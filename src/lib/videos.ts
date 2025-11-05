/**
 * Video Service (T183)
 *
 * Service for managing course videos integrated with Cloudflare Stream.
 * Handles video metadata storage, retrieval, updates, and deletion.
 * Includes Redis caching for improved performance.
 *
 * Features:
 * - Create video metadata records
 * - Retrieve videos by course or lesson
 * - Update video metadata
 * - Delete videos from both database and Cloudflare
 * - Get playback data with Cloudflare integration
 * - Redis caching with automatic invalidation
 *
 * Integration:
 * - Database: course_videos table (T182)
 * - Cloudflare Stream API (T181)
 * - Redis caching
 */

import { getPool } from './db';
import { logger } from './logger';
import * as redis from './redis';
import * as cloudflare from './cloudflare';
import type { QueryResult } from 'pg';

// ============================================================================
// Types
// ============================================================================

/**
 * Video status enum matching database type
 */
export type VideoStatus = 'queued' | 'inprogress' | 'ready' | 'error';

/**
 * Course video metadata (database record)
 */
export interface CourseVideo {
  id: string;
  course_id: string;
  lesson_id: string;
  cloudflare_video_id: string;
  title: string;
  description: string | null;
  duration: number | null;
  thumbnail_url: string | null;
  status: VideoStatus;
  playback_hls_url: string | null;
  playback_dash_url: string | null;
  processing_progress: number;
  error_message: string | null;
  metadata: Record<string, any> | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Input data for creating a course video
 */
export interface CreateVideoInput {
  course_id: string;
  lesson_id: string;
  cloudflare_video_id: string;
  title: string;
  description?: string;
  duration?: number;
  thumbnail_url?: string;
  status?: VideoStatus;
  playback_hls_url?: string;
  playback_dash_url?: string;
  processing_progress?: number;
  metadata?: Record<string, any>;
}

/**
 * Input data for updating video metadata
 */
export interface UpdateVideoInput {
  title?: string;
  description?: string;
  thumbnail_url?: string;
  status?: VideoStatus;
  duration?: number;
  playback_hls_url?: string;
  playback_dash_url?: string;
  processing_progress?: number;
  error_message?: string;
  metadata?: Record<string, any>;
}

/**
 * Combined video data with Cloudflare information
 */
export interface VideoPlaybackData extends CourseVideo {
  cloudflare_status: {
    state: string;
    percentComplete?: string;
    errorMessage?: string;
  } | null;
  is_ready: boolean;
  playback_urls: {
    hls: string | null;
    dash: string | null;
  };
  thumbnail_url_generated: string | null;
}

/**
 * Video service error codes
 */
export enum VideoErrorCode {
  VIDEO_NOT_FOUND = 'VIDEO_NOT_FOUND',
  COURSE_NOT_FOUND = 'COURSE_NOT_FOUND',
  DUPLICATE_VIDEO = 'DUPLICATE_VIDEO',
  CLOUDFLARE_ERROR = 'CLOUDFLARE_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  CACHE_ERROR = 'CACHE_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
}

/**
 * Video service error
 */
export class VideoError extends Error {
  constructor(
    public code: VideoErrorCode,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'VideoError';
  }
}

// ============================================================================
// Cache Configuration
// ============================================================================

const CACHE_PREFIX = 'video:';
const CACHE_TTL = 3600; // 1 hour in seconds
const COURSE_VIDEOS_CACHE_PREFIX = 'course_videos:';
const COURSE_VIDEOS_CACHE_TTL = 1800; // 30 minutes

/**
 * Generate cache key for a video
 */
function getVideoCacheKey(videoId: string): string {
  return `${CACHE_PREFIX}${videoId}`;
}

/**
 * Generate cache key for course videos
 */
function getCourseVideosCacheKey(courseId: string): string {
  return `${COURSE_VIDEOS_CACHE_PREFIX}${courseId}`;
}

/**
 * Generate cache key for lesson video
 */
function getLessonVideoCacheKey(courseId: string, lessonId: string): string {
  return `${CACHE_PREFIX}${courseId}:${lessonId}`;
}

/**
 * Invalidate all caches related to a course
 */
async function invalidateCourseCaches(courseId: string): Promise<void> {
  try {
    await redis.del(getCourseVideosCacheKey(courseId));
    // Also clear any lesson-specific caches for this course
    const pattern = `${CACHE_PREFIX}${courseId}:*`;
    await redis.delPattern(pattern);
    logger.info(`Cache invalidated for course: ${courseId}`);
  } catch (error) {
    logger.warn(`Failed to invalidate cache for course ${courseId}:`, error);
    // Non-critical error, continue execution
  }
}

/**
 * Invalidate cache for a specific video
 */
async function invalidateVideoCache(videoId: string, courseId?: string, lessonId?: string): Promise<void> {
  try {
    const keys = [getVideoCacheKey(videoId)];

    if (courseId && lessonId) {
      keys.push(getLessonVideoCacheKey(courseId, lessonId));
    }

    if (courseId) {
      keys.push(getCourseVideosCacheKey(courseId));
    }

    await redis.del(...keys);
    logger.info(`Cache invalidated for video: ${videoId}`);
  } catch (error) {
    logger.warn(`Failed to invalidate cache for video ${videoId}:`, error);
  }
}

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Create a new course video record
 *
 * @param input - Video creation data
 * @returns Created video record
 * @throws VideoError if creation fails
 */
export async function createCourseVideo(input: CreateVideoInput): Promise<CourseVideo> {
  const pool = getPool();

  try {
    // Validate input
    if (!input.course_id || !input.lesson_id || !input.cloudflare_video_id || !input.title) {
      throw new VideoError(
        VideoErrorCode.INVALID_INPUT,
        'Missing required fields: course_id, lesson_id, cloudflare_video_id, title'
      );
    }

    // Verify course exists
    const courseCheck = await pool.query(
      'SELECT id FROM courses WHERE id = $1',
      [input.course_id]
    );

    if (courseCheck.rows.length === 0) {
      throw new VideoError(
        VideoErrorCode.COURSE_NOT_FOUND,
        `Course not found: ${input.course_id}`
      );
    }

    // Insert video record
    const result = await pool.query<CourseVideo>(
      `INSERT INTO course_videos (
        course_id, lesson_id, cloudflare_video_id, title, description,
        duration, thumbnail_url, status, playback_hls_url, playback_dash_url,
        processing_progress, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        input.course_id,
        input.lesson_id,
        input.cloudflare_video_id,
        input.title,
        input.description || null,
        input.duration || null,
        input.thumbnail_url || null,
        input.status || 'queued',
        input.playback_hls_url || null,
        input.playback_dash_url || null,
        input.processing_progress || 0,
        input.metadata ? JSON.stringify(input.metadata) : null,
      ]
    );

    const video = result.rows[0];

    // Cache the new video
    await redis.setJSON(getVideoCacheKey(video.id), video, CACHE_TTL).catch(() => {
      // Cache failure is non-critical
    });

    // Invalidate course videos cache
    await invalidateCourseCaches(input.course_id);

    logger.info(`Created video: ${video.id} for course: ${input.course_id}, lesson: ${input.lesson_id}`);

    return video;
  } catch (error) {
    if (error instanceof VideoError) {
      throw error;
    }

    // Check for unique constraint violations
    if (error instanceof Error && error.message.includes('unique')) {
      if (error.message.includes('cloudflare_video_id')) {
        throw new VideoError(
          VideoErrorCode.DUPLICATE_VIDEO,
          `Video with Cloudflare ID ${input.cloudflare_video_id} already exists`
        );
      }
      if (error.message.includes('unique_course_lesson')) {
        throw new VideoError(
          VideoErrorCode.DUPLICATE_VIDEO,
          `Video already exists for course ${input.course_id}, lesson ${input.lesson_id}`
        );
      }
    }

    logger.error('Error creating video:', error);
    throw new VideoError(
      VideoErrorCode.DATABASE_ERROR,
      'Failed to create video',
      error
    );
  }
}

/**
 * Get all videos for a course
 *
 * @param courseId - Course UUID
 * @param options - Query options (includeNotReady: include non-ready videos)
 * @returns Array of course videos
 */
export async function getCourseVideos(
  courseId: string,
  options: { includeNotReady?: boolean } = {}
): Promise<CourseVideo[]> {
  const pool = getPool();

  try {
    // Check cache first
    const cacheKey = getCourseVideosCacheKey(courseId);
    const cached = await redis.getJSON<CourseVideo[]>(cacheKey).catch(() => null);

    if (cached) {
      logger.debug(`Cache hit for course videos: ${courseId}`);

      // Filter by status if needed
      if (!options.includeNotReady) {
        return cached.filter(v => v.status === 'ready');
      }

      return cached;
    }

    // Build query
    let query = 'SELECT * FROM course_videos WHERE course_id = $1';
    const params: any[] = [courseId];

    if (!options.includeNotReady) {
      query += ' AND status = $2';
      params.push('ready');
    }

    query += ' ORDER BY lesson_id';

    const result = await pool.query<CourseVideo>(query, params);

    // Cache all videos for this course (including not ready)
    if (result.rows.length > 0) {
      const allVideos = options.includeNotReady
        ? result.rows
        : await pool.query<CourseVideo>(
            'SELECT * FROM course_videos WHERE course_id = $1 ORDER BY lesson_id',
            [courseId]
          ).then(r => r.rows);

      await redis.setJSON(cacheKey, allVideos, COURSE_VIDEOS_CACHE_TTL).catch(() => {});
    }

    logger.debug(`Retrieved ${result.rows.length} videos for course: ${courseId}`);

    return result.rows;
  } catch (error) {
    logger.error(`Error retrieving videos for course ${courseId}:`, error);
    throw new VideoError(
      VideoErrorCode.DATABASE_ERROR,
      'Failed to retrieve course videos',
      error
    );
  }
}

/**
 * Get a specific lesson video
 *
 * @param courseId - Course UUID
 * @param lessonId - Lesson identifier
 * @returns Video record or null if not found
 */
export async function getLessonVideo(
  courseId: string,
  lessonId: string
): Promise<CourseVideo | null> {
  const pool = getPool();

  try {
    // Check cache first
    const cacheKey = getLessonVideoCacheKey(courseId, lessonId);
    const cached = await redis.getJSON<CourseVideo>(cacheKey).catch(() => null);

    if (cached) {
      logger.debug(`Cache hit for lesson video: ${courseId}/${lessonId}`);
      return cached;
    }

    // Query database
    const result = await pool.query<CourseVideo>(
      'SELECT * FROM course_videos WHERE course_id = $1 AND lesson_id = $2',
      [courseId, lessonId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const video = result.rows[0];

    // Cache the video
    await redis.setJSON(cacheKey, video, CACHE_TTL).catch(() => {});
    await redis.setJSON(getVideoCacheKey(video.id), video, CACHE_TTL).catch(() => {});

    logger.debug(`Retrieved lesson video: ${courseId}/${lessonId}`);

    return video;
  } catch (error) {
    logger.error(`Error retrieving lesson video ${courseId}/${lessonId}:`, error);
    throw new VideoError(
      VideoErrorCode.DATABASE_ERROR,
      'Failed to retrieve lesson video',
      error
    );
  }
}

/**
 * Get video by ID
 *
 * @param videoId - Video UUID
 * @returns Video record or null if not found
 */
export async function getVideoById(videoId: string): Promise<CourseVideo | null> {
  const pool = getPool();

  try {
    // Check cache first
    const cacheKey = getVideoCacheKey(videoId);
    const cached = await redis.getJSON<CourseVideo>(cacheKey).catch(() => null);

    if (cached) {
      logger.debug(`Cache hit for video: ${videoId}`);
      return cached;
    }

    // Query database
    const result = await pool.query<CourseVideo>(
      'SELECT * FROM course_videos WHERE id = $1',
      [videoId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const video = result.rows[0];

    // Cache the video
    await redis.setJSON(cacheKey, video, CACHE_TTL).catch(() => {});

    logger.debug(`Retrieved video: ${videoId}`);

    return video;
  } catch (error) {
    logger.error(`Error retrieving video ${videoId}:`, error);
    throw new VideoError(
      VideoErrorCode.DATABASE_ERROR,
      'Failed to retrieve video',
      error
    );
  }
}

/**
 * Update video metadata
 *
 * @param videoId - Video UUID
 * @param updates - Fields to update
 * @returns Updated video record
 * @throws VideoError if video not found or update fails
 */
export async function updateVideoMetadata(
  videoId: string,
  updates: UpdateVideoInput
): Promise<CourseVideo> {
  const pool = getPool();

  try {
    // Build dynamic update query
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.title !== undefined) {
      fields.push(`title = $${paramIndex++}`);
      values.push(updates.title);
    }
    if (updates.description !== undefined) {
      fields.push(`description = $${paramIndex++}`);
      values.push(updates.description);
    }
    if (updates.thumbnail_url !== undefined) {
      fields.push(`thumbnail_url = $${paramIndex++}`);
      values.push(updates.thumbnail_url);
    }
    if (updates.status !== undefined) {
      fields.push(`status = $${paramIndex++}`);
      values.push(updates.status);
    }
    if (updates.duration !== undefined) {
      fields.push(`duration = $${paramIndex++}`);
      values.push(updates.duration);
    }
    if (updates.playback_hls_url !== undefined) {
      fields.push(`playback_hls_url = $${paramIndex++}`);
      values.push(updates.playback_hls_url);
    }
    if (updates.playback_dash_url !== undefined) {
      fields.push(`playback_dash_url = $${paramIndex++}`);
      values.push(updates.playback_dash_url);
    }
    if (updates.processing_progress !== undefined) {
      fields.push(`processing_progress = $${paramIndex++}`);
      values.push(updates.processing_progress);
    }
    if (updates.error_message !== undefined) {
      fields.push(`error_message = $${paramIndex++}`);
      values.push(updates.error_message);
    }
    if (updates.metadata !== undefined) {
      fields.push(`metadata = $${paramIndex++}`);
      values.push(JSON.stringify(updates.metadata));
    }

    if (fields.length === 0) {
      throw new VideoError(
        VideoErrorCode.INVALID_INPUT,
        'No fields to update'
      );
    }

    // Add video ID as last parameter
    values.push(videoId);

    const query = `
      UPDATE course_videos
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query<CourseVideo>(query, values);

    if (result.rows.length === 0) {
      throw new VideoError(
        VideoErrorCode.VIDEO_NOT_FOUND,
        `Video not found: ${videoId}`
      );
    }

    const video = result.rows[0];

    // Invalidate caches
    await invalidateVideoCache(video.id, video.course_id, video.lesson_id);

    logger.info(`Updated video: ${videoId}`);

    return video;
  } catch (error) {
    if (error instanceof VideoError) {
      throw error;
    }

    logger.error(`Error updating video ${videoId}:`, error);
    throw new VideoError(
      VideoErrorCode.DATABASE_ERROR,
      'Failed to update video',
      error
    );
  }
}

/**
 * Delete video record and optionally from Cloudflare
 *
 * @param videoId - Video UUID
 * @param deleteFromCloudflare - Whether to also delete from Cloudflare Stream
 * @returns True if deleted successfully
 * @throws VideoError if deletion fails
 */
export async function deleteVideoRecord(
  videoId: string,
  deleteFromCloudflare: boolean = true
): Promise<boolean> {
  const pool = getPool();

  try {
    // Get video details before deletion
    const video = await getVideoById(videoId);

    if (!video) {
      throw new VideoError(
        VideoErrorCode.VIDEO_NOT_FOUND,
        `Video not found: ${videoId}`
      );
    }

    // Delete from Cloudflare first (if requested)
    if (deleteFromCloudflare) {
      try {
        await cloudflare.deleteVideo(video.cloudflare_video_id);
        logger.info(`Deleted video from Cloudflare: ${video.cloudflare_video_id}`);
      } catch (error) {
        logger.error(`Failed to delete video from Cloudflare: ${video.cloudflare_video_id}`, error);
        // Continue with database deletion even if Cloudflare deletion fails
        throw new VideoError(
          VideoErrorCode.CLOUDFLARE_ERROR,
          'Failed to delete video from Cloudflare',
          error
        );
      }
    }

    // Delete from database
    const result = await pool.query(
      'DELETE FROM course_videos WHERE id = $1 RETURNING id',
      [videoId]
    );

    if (result.rows.length === 0) {
      throw new VideoError(
        VideoErrorCode.VIDEO_NOT_FOUND,
        `Video not found: ${videoId}`
      );
    }

    // Invalidate caches
    await invalidateVideoCache(video.id, video.course_id, video.lesson_id);

    logger.info(`Deleted video: ${videoId}`);

    return true;
  } catch (error) {
    if (error instanceof VideoError) {
      throw error;
    }

    logger.error(`Error deleting video ${videoId}:`, error);
    throw new VideoError(
      VideoErrorCode.DATABASE_ERROR,
      'Failed to delete video',
      error
    );
  }
}

/**
 * Get video playback data with Cloudflare status
 *
 * Combines database video record with real-time Cloudflare status
 * and playback URLs.
 *
 * @param videoId - Video UUID
 * @returns Combined video and playback data
 * @throws VideoError if video not found
 */
export async function getVideoPlaybackData(videoId: string): Promise<VideoPlaybackData> {
  try {
    // Get video from database
    const video = await getVideoById(videoId);

    if (!video) {
      throw new VideoError(
        VideoErrorCode.VIDEO_NOT_FOUND,
        `Video not found: ${videoId}`
      );
    }

    // Get real-time status from Cloudflare
    let cloudflareStatus = null;
    let isReady = false;

    try {
      const cfVideo = await cloudflare.getVideo(video.cloudflare_video_id);
      cloudflareStatus = cfVideo.status;
      isReady = cfVideo.status?.state === 'ready';

      // Update database if status changed
      if (video.status !== cfVideo.status?.state) {
        await updateVideoMetadata(video.id, {
          status: cfVideo.status?.state as VideoStatus,
          processing_progress: parseInt(cfVideo.status?.pctComplete || '0'),
        });
      }
    } catch (error) {
      logger.warn(`Failed to get Cloudflare status for video ${video.cloudflare_video_id}:`, error);
      // Use database status as fallback
      cloudflareStatus = {
        state: video.status,
        percentComplete: video.processing_progress.toString(),
      };
      isReady = video.status === 'ready';
    }

    // Generate playback URLs
    const playbackUrls = {
      hls: video.playback_hls_url || cloudflare.generatePlaybackUrl(video.cloudflare_video_id, 'hls'),
      dash: video.playback_dash_url || cloudflare.generatePlaybackUrl(video.cloudflare_video_id, 'dash'),
    };

    // Generate thumbnail if not present
    const thumbnailUrl = video.thumbnail_url || cloudflare.generateThumbnailUrl(video.cloudflare_video_id);

    const playbackData: VideoPlaybackData = {
      ...video,
      cloudflare_status: cloudflareStatus,
      is_ready: isReady,
      playback_urls: playbackUrls,
      thumbnail_url_generated: thumbnailUrl,
    };

    logger.debug(`Retrieved playback data for video: ${videoId}`);

    return playbackData;
  } catch (error) {
    if (error instanceof VideoError) {
      throw error;
    }

    logger.error(`Error getting playback data for video ${videoId}:`, error);
    throw new VideoError(
      VideoErrorCode.DATABASE_ERROR,
      'Failed to get video playback data',
      error
    );
  }
}

/**
 * Sync video status from Cloudflare
 *
 * Updates database with current Cloudflare status for a video.
 * Useful for webhook handlers or batch sync operations.
 *
 * @param videoId - Video UUID
 * @returns Updated video record
 */
export async function syncVideoStatus(videoId: string): Promise<CourseVideo> {
  try {
    const video = await getVideoById(videoId);

    if (!video) {
      throw new VideoError(
        VideoErrorCode.VIDEO_NOT_FOUND,
        `Video not found: ${videoId}`
      );
    }

    // Get status from Cloudflare
    const cfVideo = await cloudflare.getVideo(video.cloudflare_video_id);

    // Prepare updates
    const updates: UpdateVideoInput = {
      status: cfVideo.status?.state as VideoStatus,
      processing_progress: parseInt(cfVideo.status?.pctComplete || '0'),
      duration: cfVideo.duration || video.duration,
    };

    // Update playback URLs if video is ready
    if (cfVideo.status?.state === 'ready' && cfVideo.playback) {
      updates.playback_hls_url = cfVideo.playback.hls;
      updates.playback_dash_url = cfVideo.playback.dash;
    }

    // Update thumbnail if available
    if (cfVideo.thumbnail) {
      updates.thumbnail_url = cfVideo.thumbnail;
    }

    // Store full Cloudflare metadata
    if (cfVideo.meta) {
      updates.metadata = cfVideo.meta as Record<string, any>;
    }

    const updatedVideo = await updateVideoMetadata(videoId, updates);

    logger.info(`Synced video status from Cloudflare: ${videoId}`);

    return updatedVideo;
  } catch (error) {
    if (error instanceof VideoError) {
      throw error;
    }

    logger.error(`Error syncing video status ${videoId}:`, error);
    throw new VideoError(
      VideoErrorCode.CLOUDFLARE_ERROR,
      'Failed to sync video status from Cloudflare',
      error
    );
  }
}

/**
 * Batch sync all processing videos
 *
 * Updates status for all videos that are queued or in progress.
 * Useful for background jobs to keep database in sync with Cloudflare.
 *
 * @returns Number of videos synced
 */
export async function syncAllProcessingVideos(): Promise<number> {
  const pool = getPool();

  try {
    // Get all videos that are processing
    const result = await pool.query<CourseVideo>(
      `SELECT * FROM course_videos
       WHERE status IN ('queued', 'inprogress')
       ORDER BY created_at ASC`
    );

    let syncedCount = 0;

    for (const video of result.rows) {
      try {
        await syncVideoStatus(video.id);
        syncedCount++;
      } catch (error) {
        logger.error(`Failed to sync video ${video.id}:`, error);
        // Continue with other videos
      }
    }

    logger.info(`Synced ${syncedCount} processing videos`);

    return syncedCount;
  } catch (error) {
    logger.error('Error syncing processing videos:', error);
    throw new VideoError(
      VideoErrorCode.DATABASE_ERROR,
      'Failed to sync processing videos',
      error
    );
  }
}

/**
 * Get video statistics for a course
 *
 * @param courseId - Course UUID
 * @returns Video statistics
 */
export async function getCourseVideoStats(courseId: string): Promise<{
  total: number;
  ready: number;
  processing: number;
  queued: number;
  error: number;
  totalDuration: number;
}> {
  const pool = getPool();

  try {
    const result = await pool.query<{
      status: VideoStatus;
      count: string;
      total_duration: string;
    }>(
      `SELECT
        status,
        COUNT(*) as count,
        COALESCE(SUM(duration), 0) as total_duration
       FROM course_videos
       WHERE course_id = $1
       GROUP BY status`,
      [courseId]
    );

    const stats = {
      total: 0,
      ready: 0,
      processing: 0,
      queued: 0,
      error: 0,
      totalDuration: 0,
    };

    for (const row of result.rows) {
      const count = parseInt(row.count);
      stats.total += count;
      stats.totalDuration += parseInt(row.total_duration);

      switch (row.status) {
        case 'ready':
          stats.ready = count;
          break;
        case 'inprogress':
          stats.processing = count;
          break;
        case 'queued':
          stats.queued = count;
          break;
        case 'error':
          stats.error = count;
          break;
      }
    }

    return stats;
  } catch (error) {
    logger.error(`Error getting video stats for course ${courseId}:`, error);
    throw new VideoError(
      VideoErrorCode.DATABASE_ERROR,
      'Failed to get video statistics',
      error
    );
  }
}
