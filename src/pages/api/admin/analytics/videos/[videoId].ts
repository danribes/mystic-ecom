/**
 * Admin Video Analytics Detail API (T190)
 *
 * GET /api/admin/analytics/videos/[videoId]
 *
 * Returns detailed analytics for a specific video.
 * Admin-only endpoint.
 */

import type { APIRoute } from 'astro';
import { getVideoAnalyticsSummary } from '@/lib/analytics/videos';
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

    // Get video analytics summary
    const analytics = await getVideoAnalyticsSummary(videoId);

    if (!analytics) {
      return new Response(
        JSON.stringify({ error: 'Video analytics not found' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    logger.info(`Admin retrieved analytics for video: ${videoId}`);

    return new Response(
      JSON.stringify({
        success: true,
        analytics,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    logger.error('Error in admin video analytics detail API:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to retrieve video analytics',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
