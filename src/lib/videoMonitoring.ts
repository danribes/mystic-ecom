/**
 * T191: Video Transcoding Monitoring and Retry Service
 *
 * Service for monitoring Cloudflare Stream video transcoding status
 * and implementing retry logic for failed uploads.
 *
 * Features:
 * - Monitor video processing status
 * - Automatic retry for failed uploads
 * - Batch status checking for multiple videos
 * - Exponential backoff for retries
 * - Integration with notification system
 *
 * @module videoMonitoring
 */

import { getPool } from './db';
import { logger } from './logger';
import * as cloudflare from './cloudflare';
import { sendVideoFailedEmail } from './email';
import type { VideoStatus, CourseVideo } from './videos';
import { updateVideoMetadata, getVideoById } from './videos';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface VideoProcessingStatus {
  videoId: string;
  cloudflareVideoId: string;
  status: VideoStatus;
  progress: number;
  duration: number | null;
  error?: {
    code?: string;
    message?: string;
  };
  readyToStream: boolean;
  lastChecked: Date;
}

export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

export interface RetryAttempt {
  videoId: string;
  attemptNumber: number;
  attemptedAt: Date;
  success: boolean;
  error?: string;
}

export interface MonitoringStats {
  totalVideos: number;
  processing: number;
  ready: number;
  failed: number;
  queued: number;
  averageProcessingTime: number; // in minutes
}

// ============================================================================
// Configuration
// ============================================================================

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 5000, // 5 seconds
  maxDelayMs: 300000, // 5 minutes
  backoffMultiplier: 2,
};

// Store retry attempts in memory (in production, use Redis or database)
const retryAttempts = new Map<string, RetryAttempt[]>();

// ============================================================================
// Core Monitoring Functions
// ============================================================================

/**
 * Check the processing status of a specific video
 *
 * @param videoId - Database video UUID
 * @returns Current video processing status
 *
 * @example
 * ```typescript
 * const status = await checkVideoStatus('video-uuid');
 * if (status.readyToStream) {
 *   console.log('Video is ready!');
 * }
 * ```
 */
export async function checkVideoStatus(videoId: string): Promise<VideoProcessingStatus> {
  try {
    // Get video from database
    const video = await getVideoById(videoId);

    if (!video) {
      throw new Error(`Video not found: ${videoId}`);
    }

    // Get real-time status from Cloudflare
    const cfVideo = await cloudflare.getVideo(video.cloudflare_video_id);

    const status: VideoProcessingStatus = {
      videoId: video.id,
      cloudflareVideoId: video.cloudflare_video_id,
      status: cfVideo.status?.state as VideoStatus,
      progress: cfVideo.status?.pctComplete ? parseFloat(cfVideo.status.pctComplete) : 0,
      duration: cfVideo.duration || null,
      readyToStream: cfVideo.readyToStream,
      lastChecked: new Date(),
    };

    // Add error info if present
    if (cfVideo.status?.state === 'error') {
      status.error = {
        code: cfVideo.status.errorReasonCode,
        message: cfVideo.status.errorReasonText,
      };
    }

    // Update database if status changed
    if (video.status !== cfVideo.status?.state) {
      await updateVideoMetadata(video.id, {
        status: cfVideo.status?.state as VideoStatus,
        processing_progress: status.progress,
        duration: cfVideo.duration,
        playback_hls_url: cfVideo.playback?.hls,
        playback_dash_url: cfVideo.playback?.dash,
        thumbnail_url: cfVideo.thumbnail,
        error_message: status.error?.message,
      });

      logger.info(`Updated video ${videoId} status: ${video.status} → ${cfVideo.status?.state}`);
    }

    return status;
  } catch (error) {
    logger.error(`Failed to check video status for ${videoId}:`, error);
    throw error;
  }
}

/**
 * Monitor all processing videos and update their status
 *
 * @returns Number of videos checked
 *
 * @example
 * ```typescript
 * const count = await monitorProcessingVideos();
 * console.log(`Checked ${count} videos`);
 * ```
 */
export async function monitorProcessingVideos(): Promise<number> {
  const pool = getPool();

  try {
    // Get all videos that are currently processing
    const result = await pool.query<CourseVideo>(
      `SELECT * FROM course_videos
       WHERE status IN ('queued', 'inprogress')
       ORDER BY created_at ASC`
    );

    let checkedCount = 0;

    for (const video of result.rows) {
      try {
        await checkVideoStatus(video.id);
        checkedCount++;

        // Add small delay to avoid rate limiting
        await sleep(100);
      } catch (error) {
        logger.warn(`Failed to check status for video ${video.id}:`, error);
        // Continue with other videos
      }
    }

    logger.info(`Monitored ${checkedCount} processing videos`);

    return checkedCount;
  } catch (error) {
    logger.error('Failed to monitor processing videos:', error);
    throw error;
  }
}

/**
 * Get monitoring statistics for all videos
 *
 * @returns Aggregated monitoring statistics
 *
 * @example
 * ```typescript
 * const stats = await getMonitoringStats();
 * console.log(`${stats.processing} videos processing`);
 * ```
 */
export async function getMonitoringStats(): Promise<MonitoringStats> {
  const pool = getPool();

  try {
    const result = await pool.query<{
      status: VideoStatus;
      count: string;
      avg_processing_time: string | null;
    }>(
      `SELECT
        status,
        COUNT(*) as count,
        AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/60) as avg_processing_time
       FROM course_videos
       WHERE status IN ('queued', 'inprogress', 'ready', 'error')
       GROUP BY status`
    );

    const stats: MonitoringStats = {
      totalVideos: 0,
      processing: 0,
      ready: 0,
      failed: 0,
      queued: 0,
      averageProcessingTime: 0,
    };

    let totalProcessingTime = 0;
    let processedCount = 0;

    for (const row of result.rows) {
      const count = parseInt(row.count);
      stats.totalVideos += count;

      switch (row.status) {
        case 'inprogress':
          stats.processing = count;
          break;
        case 'ready':
          stats.ready = count;
          if (row.avg_processing_time) {
            totalProcessingTime += parseFloat(row.avg_processing_time) * count;
            processedCount += count;
          }
          break;
        case 'error':
          stats.failed = count;
          break;
        case 'queued':
          stats.queued = count;
          break;
      }
    }

    if (processedCount > 0) {
      stats.averageProcessingTime = totalProcessingTime / processedCount;
    }

    return stats;
  } catch (error) {
    logger.error('Failed to get monitoring stats:', error);
    throw error;
  }
}

// ============================================================================
// Retry Logic
// ============================================================================

/**
 * Calculate retry delay with exponential backoff
 *
 * @param attemptNumber - Current retry attempt number (1-based)
 * @param config - Retry configuration
 * @returns Delay in milliseconds
 */
function calculateRetryDelay(attemptNumber: number, config: RetryConfig): number {
  const delay = config.initialDelayMs * Math.pow(config.backoffMultiplier, attemptNumber - 1);
  return Math.min(delay, config.maxDelayMs);
}

/**
 * Record a retry attempt
 *
 * @param videoId - Video UUID
 * @param attemptNumber - Attempt number
 * @param success - Whether the retry succeeded
 * @param error - Error message if failed
 */
function recordRetryAttempt(
  videoId: string,
  attemptNumber: number,
  success: boolean,
  error?: string
): void {
  const attempts = retryAttempts.get(videoId) || [];
  attempts.push({
    videoId,
    attemptNumber,
    attemptedAt: new Date(),
    success,
    error,
  });
  retryAttempts.set(videoId, attempts);

  logger.info(`Retry attempt ${attemptNumber} for video ${videoId}: ${success ? 'success' : 'failed'}`);
}

/**
 * Get retry attempts for a video
 *
 * @param videoId - Video UUID
 * @returns Array of retry attempts
 */
export function getRetryAttempts(videoId: string): RetryAttempt[] {
  return retryAttempts.get(videoId) || [];
}

/**
 * Clear retry attempts for a video
 *
 * @param videoId - Video UUID
 */
export function clearRetryAttempts(videoId: string): void {
  retryAttempts.delete(videoId);
}

/**
 * Retry a failed video upload
 *
 * @param videoId - Video UUID
 * @param config - Retry configuration (optional)
 * @returns True if retry succeeded
 *
 * @example
 * ```typescript
 * const success = await retryFailedVideo('video-uuid');
 * if (success) {
 *   console.log('Video successfully retried');
 * }
 * ```
 */
export async function retryFailedVideo(
  videoId: string,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<boolean> {
  try {
    const video = await getVideoById(videoId);

    if (!video) {
      throw new Error(`Video not found: ${videoId}`);
    }

    if (video.status !== 'error') {
      logger.warn(`Video ${videoId} is not in error state (status: ${video.status})`);
      return false;
    }

    const attempts = getRetryAttempts(videoId);
    const attemptNumber = attempts.length + 1;

    if (attemptNumber > config.maxRetries) {
      logger.warn(`Max retries (${config.maxRetries}) exceeded for video ${videoId}`);
      return false;
    }

    // Calculate delay if not first attempt
    if (attemptNumber > 1) {
      const delay = calculateRetryDelay(attemptNumber, config);
      logger.info(`Waiting ${delay}ms before retry attempt ${attemptNumber} for video ${videoId}`);
      await sleep(delay);
    }

    logger.info(`Retry attempt ${attemptNumber}/${config.maxRetries} for video ${videoId}`);

    // Check current status from Cloudflare
    const cfVideo = await cloudflare.getVideo(video.cloudflare_video_id);

    // If video is now ready, update database
    if (cfVideo.status?.state === 'ready' && cfVideo.readyToStream) {
      await updateVideoMetadata(video.id, {
        status: 'ready',
        processing_progress: 100,
        duration: cfVideo.duration,
        playback_hls_url: cfVideo.playback?.hls,
        playback_dash_url: cfVideo.playback?.dash,
        thumbnail_url: cfVideo.thumbnail,
        error_message: null,
      });

      recordRetryAttempt(videoId, attemptNumber, true);
      clearRetryAttempts(videoId);

      logger.info(`Video ${videoId} successfully recovered`);
      return true;
    }

    // If video is processing, update status
    if (cfVideo.status?.state === 'inprogress' || cfVideo.status?.state === 'queued') {
      await updateVideoMetadata(video.id, {
        status: cfVideo.status.state as VideoStatus,
        processing_progress: cfVideo.status.pctComplete ? parseFloat(cfVideo.status.pctComplete) : 0,
        error_message: null,
      });

      recordRetryAttempt(videoId, attemptNumber, true);
      clearRetryAttempts(videoId);

      logger.info(`Video ${videoId} is now processing`);
      return true;
    }

    // Still in error state
    const errorMessage = `${cfVideo.status?.errorReasonCode}: ${cfVideo.status?.errorReasonText}`;
    recordRetryAttempt(videoId, attemptNumber, false, errorMessage);

    // If max retries reached, send final notification
    if (attemptNumber >= config.maxRetries) {
      logger.error(`Video ${videoId} failed after ${attemptNumber} retry attempts`);

      // Send final failure notification to admin
      try {
        const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_FROM;
        if (adminEmail) {
          const pool = getPool();
          const courseResult = await pool.query(
            `SELECT c.title as course_title, cv.created_at as uploaded_at
             FROM course_videos cv
             JOIN courses c ON cv.course_id = c.id
             WHERE cv.id = $1`,
            [video.id]
          );

          if (courseResult.rows.length > 0) {
            const courseData = courseResult.rows[0];
            await sendVideoFailedEmail({
              adminEmail,
              videoId: video.id,
              videoTitle: video.title,
              courseTitle: courseData.course_title,
              cloudflareVideoId: video.cloudflare_video_id,
              errorCode: cfVideo.status?.errorReasonCode,
              errorMessage: cfVideo.status?.errorReasonText,
              uploadedAt: courseData.uploaded_at,
              adminDashboardUrl: `${process.env.BASE_URL || 'http://localhost:4321'}/admin/videos/${video.id}`,
            });

            logger.info(`Sent final failure notification for video ${videoId}`);
          }
        }
      } catch (emailError) {
        logger.warn(`Failed to send final failure notification for video ${videoId}:`, emailError);
      }

      return false;
    }

    // Schedule next retry
    return await retryFailedVideo(videoId, config);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const attempts = getRetryAttempts(videoId);
    recordRetryAttempt(videoId, attempts.length + 1, false, errorMessage);

    logger.error(`Retry failed for video ${videoId}:`, error);
    return false;
  }
}

/**
 * Retry all failed videos
 *
 * @param config - Retry configuration (optional)
 * @returns Number of videos successfully retried
 *
 * @example
 * ```typescript
 * const retried = await retryAllFailedVideos();
 * console.log(`${retried} videos retried`);
 * ```
 */
export async function retryAllFailedVideos(
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<number> {
  const pool = getPool();

  try {
    // Get all videos in error state
    const result = await pool.query<CourseVideo>(
      `SELECT * FROM course_videos
       WHERE status = 'error'
       ORDER BY created_at DESC`
    );

    let retriedCount = 0;

    for (const video of result.rows) {
      try {
        const success = await retryFailedVideo(video.id, config);
        if (success) {
          retriedCount++;
        }

        // Add delay between retries to avoid rate limiting
        await sleep(1000);
      } catch (error) {
        logger.warn(`Failed to retry video ${video.id}:`, error);
        // Continue with other videos
      }
    }

    logger.info(`Retried ${retriedCount} out of ${result.rows.length} failed videos`);

    return retriedCount;
  } catch (error) {
    logger.error('Failed to retry all failed videos:', error);
    throw error;
  }
}

// ============================================================================
// Batch Operations
// ============================================================================

/**
 * Check status of multiple videos in batch
 *
 * @param videoIds - Array of video UUIDs
 * @returns Array of video statuses
 *
 * @example
 * ```typescript
 * const statuses = await batchCheckVideoStatus(['uuid1', 'uuid2']);
 * statuses.forEach(s => console.log(`${s.videoId}: ${s.status}`));
 * ```
 */
export async function batchCheckVideoStatus(
  videoIds: string[]
): Promise<VideoProcessingStatus[]> {
  const statuses: VideoProcessingStatus[] = [];

  for (const videoId of videoIds) {
    try {
      const status = await checkVideoStatus(videoId);
      statuses.push(status);

      // Small delay to avoid rate limiting
      await sleep(100);
    } catch (error) {
      logger.warn(`Failed to check status for video ${videoId}:`, error);
      // Continue with other videos
    }
  }

  return statuses;
}

/**
 * Get all videos that have been processing for longer than expected
 *
 * @param thresholdMinutes - Time threshold in minutes (default: 60)
 * @returns Array of videos stuck in processing
 *
 * @example
 * ```typescript
 * const stuck = await getStuckVideos(120); // 2 hours
 * console.log(`Found ${stuck.length} stuck videos`);
 * ```
 */
export async function getStuckVideos(thresholdMinutes: number = 60): Promise<CourseVideo[]> {
  const pool = getPool();

  try {
    const result = await pool.query<CourseVideo>(
      `SELECT * FROM course_videos
       WHERE status IN ('queued', 'inprogress')
       AND updated_at < NOW() - INTERVAL '${thresholdMinutes} minutes'
       ORDER BY updated_at ASC`
    );

    logger.info(`Found ${result.rows.length} videos processing longer than ${thresholdMinutes} minutes`);

    return result.rows;
  } catch (error) {
    logger.error('Failed to get stuck videos:', error);
    throw error;
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Sleep for specified milliseconds
 *
 * @param ms - Milliseconds to sleep
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Reset retry attempts for all videos (useful for testing)
 */
export function resetAllRetryAttempts(): void {
  retryAttempts.clear();
  logger.info('All retry attempts cleared');
}

// ============================================================================
// Export all functions
// ============================================================================

export default {
  checkVideoStatus,
  monitorProcessingVideos,
  getMonitoringStats,
  retryFailedVideo,
  retryAllFailedVideos,
  batchCheckVideoStatus,
  getStuckVideos,
  getRetryAttempts,
  clearRetryAttempts,
  resetAllRetryAttempts,
};
