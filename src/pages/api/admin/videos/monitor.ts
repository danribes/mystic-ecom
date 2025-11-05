/**
 * T191: Video Monitoring Admin API
 *
 * Admin endpoints for monitoring and managing video processing status
 *
 * GET /api/admin/videos/monitor - Get monitoring statistics
 * POST /api/admin/videos/monitor - Trigger monitoring check
 */

import type { APIRoute } from 'astro';
import { verifyAdmin } from '@/lib/admin';
import { logger } from '@/lib/logger';
import {
  monitorProcessingVideos,
  getMonitoringStats,
  getStuckVideos,
} from '@/lib/videoMonitoring';

/**
 * GET /api/admin/videos/monitor
 * Get video monitoring statistics
 */
export const GET: APIRoute = async ({ request, cookies }) => {
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

    // Get query parameters
    const url = new URL(request.url);
    const includeStuck = url.searchParams.get('includeStuck') === 'true';
    const stuckThreshold = parseInt(url.searchParams.get('stuckThreshold') || '60');

    // Get monitoring stats
    const stats = await getMonitoringStats();

    // Optionally get stuck videos
    let stuckVideos = null;
    if (includeStuck) {
      stuckVideos = await getStuckVideos(stuckThreshold);
    }

    return new Response(
      JSON.stringify({
        success: true,
        stats,
        stuckVideos: stuckVideos ? stuckVideos.map(v => ({
          id: v.id,
          title: v.title,
          status: v.status,
          progress: v.processing_progress,
          createdAt: v.created_at,
          updatedAt: v.updated_at,
          cloudflareVideoId: v.cloudflare_video_id,
        })) : undefined,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    logger.error('Error getting monitoring stats:', err);

    return new Response(
      JSON.stringify({
        error: 'Failed to get monitoring stats',
        message: err instanceof Error ? err.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

/**
 * POST /api/admin/videos/monitor
 * Trigger monitoring check for all processing videos
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

    logger.info(`Admin ${adminResult.user.email} triggered video monitoring check`);

    // Run monitoring
    const checkedCount = await monitorProcessingVideos();

    // Get updated stats
    const stats = await getMonitoringStats();

    return new Response(
      JSON.stringify({
        success: true,
        message: `Checked ${checkedCount} processing videos`,
        checkedCount,
        stats,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    logger.error('Error running video monitoring:', err);

    return new Response(
      JSON.stringify({
        error: 'Failed to run video monitoring',
        message: err instanceof Error ? err.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
