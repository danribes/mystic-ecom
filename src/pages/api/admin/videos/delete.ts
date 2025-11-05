/**
 * T188: Delete Video API
 *
 * Deletes a video from both database and Cloudflare Stream.
 *
 * DELETE /api/admin/videos/delete
 *
 * Request body:
 * - videoId: Video ID to delete
 *
 * Response:
 * - success: boolean
 * - message: string
 */

import type { APIRoute } from 'astro';
import { checkAdminAuth } from '@/lib/auth/admin';
import { getVideoById, deleteVideoRecord } from '@/lib/videos';
import { deleteVideo } from '@/lib/cloudflare';
import { logger } from '@/lib/logger';

export const DELETE: APIRoute = async ({ request, cookies }) => {
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

    // Parse request body
    const body = await request.json();
    const { videoId } = body;

    if (!videoId) {
      return new Response(
        JSON.stringify({ error: 'Video ID is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if video exists
    const video = await getVideoById(videoId);
    if (!video) {
      return new Response(
        JSON.stringify({ error: 'Video not found' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Delete from Cloudflare Stream
    try {
      await deleteVideo(video.cloudflare_video_id);
    } catch (error) {
      // Log error but continue - database deletion is more important
      logger.error(`Failed to delete video from Cloudflare: ${video.cloudflare_video_id}`, error);
    }

    // Delete from database
    await deleteVideoRecord(videoId);

    logger.info(`Video deleted: ${videoId} (Cloudflare: ${video.cloudflare_video_id}) by ${authResult.user.email}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Video deleted successfully',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    logger.error('Error deleting video:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to delete video',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
