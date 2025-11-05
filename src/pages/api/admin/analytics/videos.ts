/**
 * Admin Video Analytics API (T190)
 *
 * GET /api/admin/analytics/videos
 *
 * Returns video analytics summary for all videos.
 * Admin-only endpoint.
 */

import type { APIRoute } from 'astro';
import {
  getAnalyticsDashboardStats,
  getPopularVideos,
  refreshAnalyticsSummary,
} from '@/lib/analytics/videos';
import { logger } from '@/lib/logger';
import { isAdmin } from '@/lib/adminAuth';

export const GET: APIRoute = async ({ request, locals }) => {
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

    // Parse query parameters
    const url = new URL(request.url);
    const refresh = url.searchParams.get('refresh') === 'true';
    const limit = parseInt(url.searchParams.get('limit') || '10');

    // Refresh analytics summary if requested
    if (refresh) {
      await refreshAnalyticsSummary();
      logger.info('Analytics summary refreshed by admin');
    }

    // Get dashboard stats
    const stats = await getAnalyticsDashboardStats();

    // Get popular videos
    const popularVideos = await getPopularVideos(limit);

    logger.info(`Admin retrieved video analytics dashboard`);

    return new Response(
      JSON.stringify({
        success: true,
        stats,
        popular_videos: popularVideos,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    logger.error('Error in admin videos analytics API:', error);

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
