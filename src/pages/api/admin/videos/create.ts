/**
 * T185: Create Video Record API Endpoint
 *
 * Creates a video record in the database after Cloudflare processing is complete.
 * Links the video to a course and lesson.
 *
 * POST /api/admin/videos/create
 *
 * Request body (JSON):
 * - courseId: Course ID
 * - cloudflareVideoId: Cloudflare Stream video UID
 * - title: Video title
 * - description: Video description (optional)
 * - lessonId: Lesson identifier
 * - thumbnailTimestamp: Thumbnail timestamp percentage (optional)
 *
 * Response:
 * - videoId: Database video record ID
 * - message: Success message
 */

import type { APIRoute } from 'astro';
import { createCourseVideo } from '@/lib/videos';
import { getVideo } from '@/lib/cloudflare';
import { checkAdminAuth } from '@/lib/auth/admin';
import { logger } from '@/lib/logger';

export const POST: APIRoute = async ({ request, cookies }) => {
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
    const {
      courseId,
      cloudflareVideoId,
      title,
      description,
      lessonId,
      thumbnailTimestamp,
    } = body;

    // Validate required fields
    if (!courseId || !cloudflareVideoId || !title || !lessonId) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields',
          required: ['courseId', 'cloudflareVideoId', 'title', 'lessonId'],
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Get video metadata from Cloudflare
    const cloudflareVideo = await getVideo(cloudflareVideoId);

    // Check if video is ready
    if (!cloudflareVideo.readyToStream) {
      return new Response(
        JSON.stringify({
          error: 'Video not ready',
          message: 'Video is still processing on Cloudflare',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Create video record in database
    const video = await createCourseVideo({
      course_id: courseId,
      lesson_id: lessonId,
      cloudflare_video_id: cloudflareVideoId,
      title,
      description: description || null,
      duration: cloudflareVideo.duration || null,
      thumbnail_url: cloudflareVideo.thumbnail || null,
      status: 'ready',
      playback_hls_url: cloudflareVideo.playback?.hls || null,
      playback_dash_url: cloudflareVideo.playback?.dash || null,
      processing_progress: 100,
      metadata: {
        width: cloudflareVideo.input?.width,
        height: cloudflareVideo.input?.height,
        created: cloudflareVideo.created,
        thumbnailTimestamp: thumbnailTimestamp || 0,
        uploadedBy: authResult.user.email,
      },
    });

    logger.info(`Video record created: ${video.id} for course ${courseId}, lesson ${lessonId}`);

    return new Response(
      JSON.stringify({
        videoId: video.id,
        message: 'Video record created successfully',
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    logger.error('Video record creation error:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to create video record',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
