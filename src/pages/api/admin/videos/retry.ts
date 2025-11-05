/**
 * T191: Video Retry Admin API
 *
 * Admin endpoints for retrying failed video uploads
 *
 * POST /api/admin/videos/retry - Retry specific video or all failed videos
 */

import type { APIRoute } from 'astro';
import { verifyAdmin } from '@/lib/admin';
import { logger } from '@/lib/logger';
import {
  retryFailedVideo,
  retryAllFailedVideos,
  getRetryAttempts,
} from '@/lib/videoMonitoring';

/**
 * POST /api/admin/videos/retry
 * Retry failed video(s)
 *
 * Body:
 * - videoId (optional): Specific video to retry
 * - maxRetries (optional): Max retry attempts (default: 3)
 * - If no videoId provided, retries all failed videos
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Verify admin authentication
    const adminResult = await verifyAdmin(request, cookies);
    if (!adminResult.isValid || !adminResult.user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const body = await request.json();
    const { videoId, maxRetries = 3 } = body;

    const retryConfig = {
      maxRetries,
      initialDelayMs: 5000,
      maxDelayMs: 300000,
      backoffMultiplier: 2,
    };

    // Retry specific video
    if (videoId) {
      logger.info(`Admin ${adminResult.user.email} triggered retry for video ${videoId}`);

      const success = await retryFailedVideo(videoId, retryConfig);
      const attempts = getRetryAttempts(videoId);

      return new Response(
        JSON.stringify({
          success,
          message: success ? `Video ${videoId} retry succeeded` : `Video ${videoId} retry failed`,
          videoId,
          attempts,
        }),
        {
          status: success ? 200 : 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Retry all failed videos
    logger.info(`Admin ${adminResult.user.email} triggered retry for all failed videos`);

    const retriedCount = await retryAllFailedVideos(retryConfig);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Retried ${retriedCount} failed videos`,
        retriedCount,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    logger.error('Error retrying videos:', err);

    return new Response(
      JSON.stringify({
        error: 'Failed to retry videos',
        message: err instanceof Error ? err.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
