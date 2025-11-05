/**
 * Video Analytics Service (T190)
 *
 * Comprehensive video analytics tracking and reporting system.
 * Tracks video views, watch time, completion rates, and engagement metrics.
 *
 * Features:
 * - Video view tracking (session-based)
 * - Watch time and progress tracking
 * - Completion rate analytics
 * - Video heatmap (segment engagement)
 * - Popular videos ranking
 * - User progress tracking
 * - Admin dashboard analytics
 *
 * Integration:
 * - Database: video_analytics, video_heatmap, video_watch_progress tables
 * - Redis: Analytics caching
 * - Course progress tracking (T121-T124)
 */

import { getPool } from '../db';
import { logger } from '../logger';
import * as redis from '../redis';
import type { QueryResult } from 'pg';

// ============================================================================
// Types
// ============================================================================

/**
 * Video view tracking data
 */
export interface VideoViewData {
  video_id: string;
  user_id?: string | null;
  course_id: string;
  session_id: string;
  video_duration_seconds?: number;
  lesson_id?: string;
  is_preview?: boolean;
  ip_address?: string;
  user_agent?: string;
  device_type?: 'mobile' | 'tablet' | 'desktop';
  browser?: string;
  os?: string;
  referrer?: string;
}

/**
 * Video progress update data
 */
export interface VideoProgressData {
  session_id: string;
  current_position_seconds: number;
  watch_time_seconds?: number;
  play_count?: number;
  pause_count?: number;
  seek_count?: number;
  average_playback_speed?: number;
  quality_changes?: number;
}

/**
 * Video completion data
 */
export interface VideoCompletionData {
  session_id: string;
  watch_time_seconds: number;
  completion_percentage: number;
}

/**
 * Video analytics record
 */
export interface VideoAnalytics {
  id: string;
  video_id: string;
  user_id: string | null;
  course_id: string;
  session_id: string;
  started_at: Date;
  last_updated_at: Date;
  watch_time_seconds: number;
  video_duration_seconds: number | null;
  completion_percentage: number;
  completed: boolean;
  completed_at: Date | null;
  play_count: number;
  pause_count: number;
  seek_count: number;
  max_position_seconds: number;
  average_playback_speed: number;
  quality_changes: number;
  ip_address: string | null;
  user_agent: string | null;
  device_type: string | null;
  browser: string | null;
  os: string | null;
  referrer: string | null;
  lesson_id: string | null;
  is_preview: boolean;
  created_at: Date;
}

/**
 * Video analytics summary (from materialized view)
 */
export interface VideoAnalyticsSummary {
  video_id: string;
  course_id: string;
  video_title: string;
  lesson_id: string;
  course_title: string;
  total_views: number;
  unique_viewers: number;
  unique_completers: number;
  avg_watch_time_seconds: number;
  total_watch_time_seconds: number;
  max_watch_time_seconds: number;
  avg_completion_percentage: number;
  completed_count: number;
  completion_rate: number;
  avg_play_count: number;
  avg_pause_count: number;
  avg_seek_count: number;
  avg_playback_speed: number;
  play_rate: number;
  drop_off_rate: number;
  first_view_at: Date;
  last_view_at: Date;
  video_duration_seconds: number | null;
  video_status: string;
  is_preview: boolean;
}

/**
 * Video heatmap segment data
 */
export interface VideoHeatmapSegment {
  id: string;
  video_id: string;
  segment_start: number;
  segment_end: number;
  view_count: number;
  unique_viewers: number;
  total_watch_time_seconds: number;
  completion_rate: number;
  drop_off_count: number;
  last_aggregated_at: Date;
}

/**
 * Video watch progress
 */
export interface VideoWatchProgress {
  id: string;
  user_id: string;
  video_id: string;
  course_id: string;
  current_position_seconds: number;
  video_duration_seconds: number | null;
  progress_percentage: number;
  completed: boolean;
  first_watched_at: Date;
  last_watched_at: Date;
  completed_at: Date | null;
  lesson_id: string | null;
}

/**
 * Course video analytics overview
 */
export interface CourseVideoAnalyticsOverview {
  course_id: string;
  course_title: string;
  total_videos: number;
  total_views: number;
  unique_viewers: number;
  total_watch_time_seconds: number;
  avg_completion_rate: number;
  most_viewed_video: {
    video_id: string;
    title: string;
    views: number;
  } | null;
  least_completed_video: {
    video_id: string;
    title: string;
    completion_rate: number;
  } | null;
}

/**
 * Popular videos ranking
 */
export interface PopularVideo {
  video_id: string;
  video_title: string;
  course_id: string;
  course_title: string;
  total_views: number;
  unique_viewers: number;
  completion_rate: number;
  avg_watch_time_seconds: number;
  is_preview: boolean;
}

// ============================================================================
// Cache Configuration
// ============================================================================

const ANALYTICS_CACHE_PREFIX = 'video_analytics:';
const SUMMARY_CACHE_TTL = 300; // 5 minutes
const HEATMAP_CACHE_TTL = 600; // 10 minutes
const POPULAR_CACHE_TTL = 600; // 10 minutes

/**
 * Generate cache key for video analytics summary
 */
function getAnalyticsCacheKey(videoId: string): string {
  return `${ANALYTICS_CACHE_PREFIX}summary:${videoId}`;
}

/**
 * Generate cache key for course analytics
 */
function getCourseAnalyticsCacheKey(courseId: string): string {
  return `${ANALYTICS_CACHE_PREFIX}course:${courseId}`;
}

/**
 * Generate cache key for popular videos
 */
function getPopularVideosCacheKey(limit: number): string {
  return `${ANALYTICS_CACHE_PREFIX}popular:${limit}`;
}

/**
 * Invalidate analytics caches for a video
 */
async function invalidateAnalyticsCaches(videoId: string, courseId?: string): Promise<void> {
  try {
    const keys = [getAnalyticsCacheKey(videoId)];

    if (courseId) {
      keys.push(getCourseAnalyticsCacheKey(courseId));
    }

    // Also invalidate popular videos cache
    await redis.delPattern(`${ANALYTICS_CACHE_PREFIX}popular:*`);

    await redis.del(...keys);
  } catch (error) {
    logger.warn('Failed to invalidate analytics caches:', error);
  }
}

// ============================================================================
// Core Tracking Functions
// ============================================================================

/**
 * Track a video view
 *
 * Creates a new analytics session when a user starts watching a video.
 *
 * @param data - Video view tracking data
 * @returns Created analytics record
 */
export async function trackVideoView(data: VideoViewData): Promise<VideoAnalytics> {
  const pool = getPool();

  try {
    // Validate required fields
    if (!data.video_id || !data.course_id || !data.session_id) {
      throw new Error('Missing required fields: video_id, course_id, session_id');
    }

    // Check if session already exists (prevent duplicates)
    const existing = await pool.query<VideoAnalytics>(
      'SELECT * FROM video_analytics WHERE session_id = $1',
      [data.session_id]
    );

    if (existing.rows.length > 0) {
      logger.debug(`Session already tracked: ${data.session_id}`);
      return existing.rows[0];
    }

    // Insert new analytics record
    const result = await pool.query<VideoAnalytics>(
      `INSERT INTO video_analytics (
        video_id, user_id, course_id, session_id, video_duration_seconds,
        lesson_id, is_preview, ip_address, user_agent, device_type,
        browser, os, referrer
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        data.video_id,
        data.user_id || null,
        data.course_id,
        data.session_id,
        data.video_duration_seconds || null,
        data.lesson_id || null,
        data.is_preview || false,
        data.ip_address || null,
        data.user_agent || null,
        data.device_type || null,
        data.browser || null,
        data.os || null,
        data.referrer || null,
      ]
    );

    const analytics = result.rows[0];

    // Invalidate caches
    await invalidateAnalyticsCaches(data.video_id, data.course_id);

    logger.info(`Tracked video view: ${data.video_id}, session: ${data.session_id}`);

    return analytics;
  } catch (error) {
    logger.error('Error tracking video view:', error);
    throw error;
  }
}

/**
 * Update video progress
 *
 * Updates the analytics session with current watch progress.
 * Also updates user's watch progress for resume functionality.
 *
 * @param data - Video progress data
 * @returns Updated analytics record
 */
export async function trackVideoProgress(data: VideoProgressData): Promise<VideoAnalytics> {
  const pool = getPool();

  try {
    // Build dynamic update query
    const fields: string[] = ['last_updated_at = CURRENT_TIMESTAMP'];
    const values: any[] = [];
    let paramIndex = 1;

    // Always update max position if current position is higher
    fields.push(`max_position_seconds = GREATEST(max_position_seconds, $${paramIndex++})`);
    values.push(data.current_position_seconds);

    if (data.watch_time_seconds !== undefined) {
      fields.push(`watch_time_seconds = $${paramIndex++}`);
      values.push(data.watch_time_seconds);

      // Calculate completion percentage
      fields.push(`completion_percentage = CASE
        WHEN video_duration_seconds > 0 THEN
          LEAST(100, ($${paramIndex - 1}::DECIMAL / video_duration_seconds * 100))
        ELSE 0
      END`);
    }

    if (data.play_count !== undefined) {
      fields.push(`play_count = $${paramIndex++}`);
      values.push(data.play_count);
    }

    if (data.pause_count !== undefined) {
      fields.push(`pause_count = $${paramIndex++}`);
      values.push(data.pause_count);
    }

    if (data.seek_count !== undefined) {
      fields.push(`seek_count = $${paramIndex++}`);
      values.push(data.seek_count);
    }

    if (data.average_playback_speed !== undefined) {
      fields.push(`average_playback_speed = $${paramIndex++}`);
      values.push(data.average_playback_speed);
    }

    if (data.quality_changes !== undefined) {
      fields.push(`quality_changes = $${paramIndex++}`);
      values.push(data.quality_changes);
    }

    // Add session_id as last parameter
    values.push(data.session_id);

    const query = `
      UPDATE video_analytics
      SET ${fields.join(', ')}
      WHERE session_id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query<VideoAnalytics>(query, values);

    if (result.rows.length === 0) {
      throw new Error(`Analytics session not found: ${data.session_id}`);
    }

    const analytics = result.rows[0];

    // Also update user's watch progress (if user is logged in)
    if (analytics.user_id) {
      await updateUserWatchProgress({
        user_id: analytics.user_id,
        video_id: analytics.video_id,
        course_id: analytics.course_id,
        current_position_seconds: data.current_position_seconds,
        video_duration_seconds: analytics.video_duration_seconds || undefined,
        lesson_id: analytics.lesson_id || undefined,
      });
    }

    // Update heatmap data
    await updateVideoHeatmap(analytics.video_id, data.current_position_seconds);

    logger.debug(`Updated video progress: ${data.session_id}`);

    return analytics;
  } catch (error) {
    logger.error('Error tracking video progress:', error);
    throw error;
  }
}

/**
 * Mark video as completed
 *
 * @param data - Video completion data
 * @returns Updated analytics record
 */
export async function trackVideoCompletion(data: VideoCompletionData): Promise<VideoAnalytics> {
  const pool = getPool();

  try {
    const result = await pool.query<VideoAnalytics>(
      `UPDATE video_analytics
       SET completed = true,
           completed_at = CURRENT_TIMESTAMP,
           watch_time_seconds = $1,
           completion_percentage = $2,
           last_updated_at = CURRENT_TIMESTAMP
       WHERE session_id = $3
       RETURNING *`,
      [data.watch_time_seconds, data.completion_percentage, data.session_id]
    );

    if (result.rows.length === 0) {
      throw new Error(`Analytics session not found: ${data.session_id}`);
    }

    const analytics = result.rows[0];

    // Update user's watch progress
    if (analytics.user_id) {
      await pool.query(
        `UPDATE video_watch_progress
         SET completed = true,
             completed_at = CURRENT_TIMESTAMP,
             progress_percentage = $1
         WHERE user_id = $2 AND video_id = $3`,
        [data.completion_percentage, analytics.user_id, analytics.video_id]
      );
    }

    // Invalidate caches
    await invalidateAnalyticsCaches(analytics.video_id, analytics.course_id);

    logger.info(`Video completed: ${analytics.video_id}, session: ${data.session_id}`);

    return analytics;
  } catch (error) {
    logger.error('Error tracking video completion:', error);
    throw error;
  }
}

/**
 * Update user's watch progress (for resume functionality)
 *
 * @param data - Watch progress data
 */
async function updateUserWatchProgress(data: {
  user_id: string;
  video_id: string;
  course_id: string;
  current_position_seconds: number;
  video_duration_seconds?: number;
  lesson_id?: string;
}): Promise<void> {
  const pool = getPool();

  try {
    // Calculate progress percentage
    const progressPercentage = data.video_duration_seconds
      ? Math.min(100, (data.current_position_seconds / data.video_duration_seconds) * 100)
      : 0;

    // Upsert watch progress
    await pool.query(
      `INSERT INTO video_watch_progress (
        user_id, video_id, course_id, current_position_seconds,
        video_duration_seconds, progress_percentage, lesson_id, last_watched_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id, video_id)
      DO UPDATE SET
        current_position_seconds = EXCLUDED.current_position_seconds,
        video_duration_seconds = EXCLUDED.video_duration_seconds,
        progress_percentage = EXCLUDED.progress_percentage,
        last_watched_at = CURRENT_TIMESTAMP`,
      [
        data.user_id,
        data.video_id,
        data.course_id,
        data.current_position_seconds,
        data.video_duration_seconds || null,
        progressPercentage,
        data.lesson_id || null,
      ]
    );
  } catch (error) {
    logger.error('Error updating watch progress:', error);
    // Non-critical error, don't throw
  }
}

/**
 * Update video heatmap with segment view
 *
 * Increments view count for 10-second segments
 *
 * @param videoId - Video ID
 * @param positionSeconds - Current playback position
 */
async function updateVideoHeatmap(videoId: string, positionSeconds: number): Promise<void> {
  const pool = getPool();

  try {
    // Calculate segment (10-second intervals)
    const segmentSize = 10;
    const segmentStart = Math.floor(positionSeconds / segmentSize) * segmentSize;
    const segmentEnd = segmentStart + segmentSize;

    // Upsert heatmap data
    await pool.query(
      `INSERT INTO video_heatmap (
        video_id, segment_start, segment_end, view_count
      ) VALUES ($1, $2, $3, 1)
      ON CONFLICT (video_id, segment_start, segment_end)
      DO UPDATE SET
        view_count = video_heatmap.view_count + 1,
        last_aggregated_at = CURRENT_TIMESTAMP`,
      [videoId, segmentStart, segmentEnd]
    );
  } catch (error) {
    logger.error('Error updating video heatmap:', error);
    // Non-critical error, don't throw
  }
}

// ============================================================================
// Analytics Retrieval Functions
// ============================================================================

/**
 * Get analytics summary for a specific video
 *
 * @param videoId - Video ID
 * @returns Video analytics summary
 */
export async function getVideoAnalyticsSummary(
  videoId: string
): Promise<VideoAnalyticsSummary | null> {
  const pool = getPool();

  try {
    // Check cache first
    const cacheKey = getAnalyticsCacheKey(videoId);
    const cached = await redis.getJSON<VideoAnalyticsSummary>(cacheKey).catch(() => null);

    if (cached) {
      logger.debug(`Cache hit for video analytics: ${videoId}`);
      return cached;
    }

    // Query materialized view
    const result = await pool.query<VideoAnalyticsSummary>(
      'SELECT * FROM video_analytics_summary WHERE video_id = $1',
      [videoId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const summary = result.rows[0];

    // Cache result
    await redis.setJSON(cacheKey, summary, SUMMARY_CACHE_TTL).catch(() => {});

    return summary;
  } catch (error) {
    logger.error(`Error getting video analytics summary for ${videoId}:`, error);
    throw error;
  }
}

/**
 * Get analytics for all videos in a course
 *
 * @param courseId - Course ID
 * @returns Array of video analytics summaries
 */
export async function getCourseVideoAnalytics(
  courseId: string
): Promise<VideoAnalyticsSummary[]> {
  const pool = getPool();

  try {
    // Check cache
    const cacheKey = getCourseAnalyticsCacheKey(courseId);
    const cached = await redis.getJSON<VideoAnalyticsSummary[]>(cacheKey).catch(() => null);

    if (cached) {
      logger.debug(`Cache hit for course video analytics: ${courseId}`);
      return cached;
    }

    // Query materialized view
    const result = await pool.query<VideoAnalyticsSummary>(
      `SELECT * FROM video_analytics_summary
       WHERE course_id = $1
       ORDER BY total_views DESC`,
      [courseId]
    );

    // Cache result
    await redis.setJSON(cacheKey, result.rows, SUMMARY_CACHE_TTL).catch(() => {});

    return result.rows;
  } catch (error) {
    logger.error(`Error getting course video analytics for ${courseId}:`, error);
    throw error;
  }
}

/**
 * Get course video analytics overview
 *
 * Aggregated stats across all videos in a course
 *
 * @param courseId - Course ID
 * @returns Course video analytics overview
 */
export async function getCourseVideoAnalyticsOverview(
  courseId: string
): Promise<CourseVideoAnalyticsOverview | null> {
  const pool = getPool();

  try {
    const result = await pool.query<CourseVideoAnalyticsOverview>(
      `SELECT
        c.id as course_id,
        c.title as course_title,
        COUNT(DISTINCT cv.id) as total_videos,
        COALESCE(SUM(vas.total_views), 0) as total_views,
        COALESCE(SUM(vas.unique_viewers), 0) as unique_viewers,
        COALESCE(SUM(vas.total_watch_time_seconds), 0) as total_watch_time_seconds,
        COALESCE(AVG(vas.completion_rate), 0) as avg_completion_rate
       FROM courses c
       LEFT JOIN course_videos cv ON c.id = cv.course_id
       LEFT JOIN video_analytics_summary vas ON cv.id = vas.video_id
       WHERE c.id = $1
       GROUP BY c.id, c.title`,
      [courseId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const overview = result.rows[0];

    // Get most viewed video
    const mostViewed = await pool.query(
      `SELECT vas.video_id, vas.video_title, vas.total_views
       FROM video_analytics_summary vas
       WHERE vas.course_id = $1
       ORDER BY vas.total_views DESC
       LIMIT 1`,
      [courseId]
    );

    // Get least completed video
    const leastCompleted = await pool.query(
      `SELECT vas.video_id, vas.video_title, vas.completion_rate
       FROM video_analytics_summary vas
       WHERE vas.course_id = $1 AND vas.total_views > 0
       ORDER BY vas.completion_rate ASC
       LIMIT 1`,
      [courseId]
    );

    return {
      ...overview,
      most_viewed_video: mostViewed.rows[0] ? {
        video_id: mostViewed.rows[0].video_id,
        title: mostViewed.rows[0].video_title,
        views: mostViewed.rows[0].total_views,
      } : null,
      least_completed_video: leastCompleted.rows[0] ? {
        video_id: leastCompleted.rows[0].video_id,
        title: leastCompleted.rows[0].video_title,
        completion_rate: leastCompleted.rows[0].completion_rate,
      } : null,
    };
  } catch (error) {
    logger.error(`Error getting course overview for ${courseId}:`, error);
    throw error;
  }
}

/**
 * Get popular videos
 *
 * Returns top videos by view count
 *
 * @param limit - Number of videos to return (default: 10)
 * @returns Array of popular videos
 */
export async function getPopularVideos(limit: number = 10): Promise<PopularVideo[]> {
  const pool = getPool();

  try {
    // Check cache
    const cacheKey = getPopularVideosCacheKey(limit);
    const cached = await redis.getJSON<PopularVideo[]>(cacheKey).catch(() => null);

    if (cached) {
      logger.debug('Cache hit for popular videos');
      return cached;
    }

    const result = await pool.query<PopularVideo>(
      `SELECT
        video_id,
        video_title,
        course_id,
        course_title,
        total_views,
        unique_viewers,
        completion_rate,
        avg_watch_time_seconds,
        is_preview
       FROM video_analytics_summary
       WHERE is_preview = false
       ORDER BY total_views DESC, unique_viewers DESC
       LIMIT $1`,
      [limit]
    );

    // Cache result
    await redis.setJSON(cacheKey, result.rows, POPULAR_CACHE_TTL).catch(() => {});

    return result.rows;
  } catch (error) {
    logger.error('Error getting popular videos:', error);
    throw error;
  }
}

/**
 * Get video heatmap
 *
 * Returns engagement data for video segments
 *
 * @param videoId - Video ID
 * @returns Array of heatmap segments
 */
export async function getVideoHeatmap(videoId: string): Promise<VideoHeatmapSegment[]> {
  const pool = getPool();

  try {
    const result = await pool.query<VideoHeatmapSegment>(
      `SELECT * FROM video_heatmap
       WHERE video_id = $1
       ORDER BY segment_start ASC`,
      [videoId]
    );

    return result.rows;
  } catch (error) {
    logger.error(`Error getting video heatmap for ${videoId}:`, error);
    throw error;
  }
}

/**
 * Get user's watch progress for a video
 *
 * @param userId - User ID
 * @param videoId - Video ID
 * @returns Watch progress or null
 */
export async function getUserVideoProgress(
  userId: string,
  videoId: string
): Promise<VideoWatchProgress | null> {
  const pool = getPool();

  try {
    const result = await pool.query<VideoWatchProgress>(
      'SELECT * FROM video_watch_progress WHERE user_id = $1 AND video_id = $2',
      [userId, videoId]
    );

    return result.rows[0] || null;
  } catch (error) {
    logger.error(`Error getting user video progress for ${userId}, ${videoId}:`, error);
    throw error;
  }
}

/**
 * Get user's watch progress for all videos in a course
 *
 * @param userId - User ID
 * @param courseId - Course ID
 * @returns Array of watch progress records
 */
export async function getUserCourseProgress(
  userId: string,
  courseId: string
): Promise<VideoWatchProgress[]> {
  const pool = getPool();

  try {
    const result = await pool.query<VideoWatchProgress>(
      `SELECT * FROM video_watch_progress
       WHERE user_id = $1 AND course_id = $2
       ORDER BY last_watched_at DESC`,
      [userId, courseId]
    );

    return result.rows;
  } catch (error) {
    logger.error(`Error getting user course progress for ${userId}, ${courseId}:`, error);
    throw error;
  }
}

/**
 * Refresh analytics summary materialized view
 *
 * Should be called periodically (e.g., every hour) or after bulk analytics imports
 */
export async function refreshAnalyticsSummary(): Promise<void> {
  const pool = getPool();

  try {
    await pool.query('SELECT refresh_video_analytics_summary()');

    // Invalidate all analytics caches
    await redis.delPattern(`${ANALYTICS_CACHE_PREFIX}*`);

    logger.info('Analytics summary refreshed');
  } catch (error) {
    logger.error('Error refreshing analytics summary:', error);
    throw error;
  }
}

/**
 * Get analytics for date range
 *
 * @param videoId - Video ID
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Analytics records
 */
export async function getVideoAnalyticsByDateRange(
  videoId: string,
  startDate: Date,
  endDate: Date
): Promise<VideoAnalytics[]> {
  const pool = getPool();

  try {
    const result = await pool.query<VideoAnalytics>(
      `SELECT * FROM video_analytics
       WHERE video_id = $1
         AND started_at >= $2
         AND started_at <= $3
       ORDER BY started_at DESC`,
      [videoId, startDate, endDate]
    );

    return result.rows;
  } catch (error) {
    logger.error(`Error getting video analytics by date range:`, error);
    throw error;
  }
}

/**
 * Get analytics stats for admin dashboard
 *
 * @returns Overall analytics statistics
 */
export async function getAnalyticsDashboardStats(): Promise<{
  total_videos_with_analytics: number;
  total_views: number;
  total_unique_viewers: number;
  total_watch_time_hours: number;
  average_completion_rate: number;
  videos_by_completion_rate: {
    high: number; // >75%
    medium: number; // 50-75%
    low: number; // <50%
  };
}> {
  const pool = getPool();

  try {
    const result = await pool.query<{
      total_videos: string;
      total_views: string;
      total_unique_viewers: string;
      total_watch_time_seconds: string;
      avg_completion_rate: string;
      high_completion: string;
      medium_completion: string;
      low_completion: string;
    }>(
      `SELECT
        COUNT(DISTINCT video_id) as total_videos,
        SUM(total_views)::BIGINT as total_views,
        SUM(unique_viewers)::BIGINT as total_unique_viewers,
        SUM(total_watch_time_seconds)::BIGINT as total_watch_time_seconds,
        AVG(completion_rate) as avg_completion_rate,
        COUNT(CASE WHEN completion_rate > 75 THEN 1 END) as high_completion,
        COUNT(CASE WHEN completion_rate BETWEEN 50 AND 75 THEN 1 END) as medium_completion,
        COUNT(CASE WHEN completion_rate < 50 THEN 1 END) as low_completion
       FROM video_analytics_summary`
    );

    const row = result.rows[0];

    return {
      total_videos_with_analytics: parseInt(row.total_videos || '0'),
      total_views: parseInt(row.total_views || '0'),
      total_unique_viewers: parseInt(row.total_unique_viewers || '0'),
      total_watch_time_hours: parseInt(row.total_watch_time_seconds || '0') / 3600,
      average_completion_rate: parseFloat(row.avg_completion_rate || '0'),
      videos_by_completion_rate: {
        high: parseInt(row.high_completion || '0'),
        medium: parseInt(row.medium_completion || '0'),
        low: parseInt(row.low_completion || '0'),
      },
    };
  } catch (error) {
    logger.error('Error getting dashboard stats:', error);
    throw error;
  }
}
