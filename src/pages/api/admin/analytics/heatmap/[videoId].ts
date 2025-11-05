/**
 * Admin Video Heatmap API (T190)
 *
 * GET /api/admin/analytics/heatmap/[videoId]
 *
 * Returns engagement heatmap data for a specific video.
 * Shows which segments of the video are most watched.
 * Admin-only endpoint.
 */

import type { APIRoute } from 'astro';
import { getVideoHeatmap } from '@/lib/analytics/videos';
import { logger } from '@/lib/logger';
import { isAdmin } from '@/lib/adminAuth';

export const GET: APIRoute = async ({ params, locals }) => {
  try {
    // Check admin authentication
    if (!locals.user || !isAdmin(locals.user)) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized. Admin access required.' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const { videoId } = params;

    if (!videoId) {
      return new Response(
        JSON.stringify({ error: 'Video ID is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Get video heatmap
    const heatmap = await getVideoHeatmap(videoId);

    logger.info(`Admin retrieved heatmap for video: ${videoId}`);

    return new Response(
      JSON.stringify({
        success: true,
        video_id: videoId,
        segments: heatmap,
        total_segments: heatmap.length,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    logger.error('Error in admin video heatmap API:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to retrieve video heatmap',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
