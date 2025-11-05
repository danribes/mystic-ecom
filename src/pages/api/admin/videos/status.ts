/**
 * T185: Video Processing Status API Endpoint
 *
 * Checks the processing status of a video on Cloudflare Stream.
 *
 * GET /api/admin/videos/status?videoId={cloudflareVideoId}
 *
 * Response:
 * - status: 'queued' | 'inprogress' | 'ready' | 'error'
 * - progress: Processing progress percentage (0-100)
 * - errorMessage: Error message if status is 'error'
 * - duration: Video duration in seconds (if ready)
 * - thumbnail: Thumbnail URL (if ready)
 */

import type { APIRoute } from 'astro';
import { getVideo } from '@/lib/cloudflare';
import { checkAdminAuth } from '@/lib/auth/admin';
import { logger } from '@/lib/logger';

export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    // Check admin authentication
    const authResult = await checkAdminAuth(cookies);
    if (!authResult.user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Get video ID from query params
    const url = new URL(request.url);
    const videoId = url.searchParams.get('videoId');

    if (!videoId) {
      return new Response(
        JSON.stringify({ error: 'Video ID is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Get video status from Cloudflare
    const video = await getVideo(videoId);

    // Calculate progress percentage
    let progress = 0;
    if (video.status.pctComplete) {
      progress = Math.round(parseFloat(video.status.pctComplete));
    } else if (video.status.state === 'ready') {
      progress = 100;
    }

    return new Response(
      JSON.stringify({
        status: video.status.state,
        progress,
        errorMessage: video.status.errorReasonText,
        duration: video.duration,
        thumbnail: video.thumbnail,
        readyToStream: video.readyToStream,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    logger.error('Video status check error:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to check video status',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
