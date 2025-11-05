/**
 * T188: Update Video Metadata API
 *
 * Updates video title and description.
 *
 * PUT /api/admin/videos/update
 *
 * Request body:
 * - videoId: Video ID
 * - title: New title
 * - description: New description (optional)
 *
 * Response:
 * - success: boolean
 * - video: Updated video object
 */

import type { APIRoute } from 'astro';
import { checkAdminAuth } from '@/lib/auth/admin';
import { updateVideoMetadata, getVideoById } from '@/lib/videos';
import { logger } from '@/lib/logger';

export const PUT: APIRoute = async ({ request, cookies }) => {
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
    const { videoId, title, description } = body;

    if (!videoId) {
      return new Response(
        JSON.stringify({ error: 'Video ID is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (!title || title.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Title is required' }),
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

    // Update video metadata
    const updatedVideo = await updateVideoMetadata(videoId, {
      title: title.trim(),
      description: description && description.trim().length > 0 ? description.trim() : null,
    });

    logger.info(`Video updated: ${videoId} by ${authResult.user.email}`);

    return new Response(
      JSON.stringify({
        success: true,
        video: updatedVideo,
        message: 'Video updated successfully',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    logger.error('Error updating video:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to update video',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
