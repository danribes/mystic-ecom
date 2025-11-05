/**
 * T186: Admin Video Upload API Endpoint (TUS Protocol)
 *
 * Creates a TUS upload URL for resumable video uploads to Cloudflare Stream.
 * Saves initial video metadata to database.
 *
 * POST /api/admin/videos/upload
 *
 * Request body (JSON):
 * - filename: Video filename
 * - fileSize: File size in bytes
 * - courseId: Course ID
 * - lessonId: Lesson ID
 * - title: Video title
 * - description: Video description (optional)
 *
 * Response:
 * - tusUrl: TUS upload URL for client-side upload
 * - videoId: Cloudflare Stream video UID
 * - dbVideoId: Database video record ID
 * - expiresAt: TUS URL expiration time
 */

import type { APIRoute } from 'astro';
import { createTusUpload } from '@/lib/cloudflare';
import { createCourseVideo } from '@/lib/videos';
import { checkAdminAuth } from '@/lib/auth/admin';
import { logger } from '@/lib/logger';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Check admin authentication
    const authResult = await checkAdminAuth(cookies, '/api/admin/videos/upload');
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
    const { filename, fileSize, courseId, lessonId, title, description } = body;

    // Validate required fields
    if (!filename) {
      return new Response(
        JSON.stringify({ error: 'Filename is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (!fileSize) {
      return new Response(
        JSON.stringify({ error: 'File size is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (!courseId || !lessonId) {
      return new Response(
        JSON.stringify({ error: 'Course ID and Lesson ID are required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (!title) {
      return new Response(
        JSON.stringify({ error: 'Title is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate file type from filename extension
    const validExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.flv'];
    const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    if (!validExtensions.includes(extension)) {
      return new Response(
        JSON.stringify({
          error: 'Invalid file type. Supported formats: MP4, WebM, MOV, AVI, MKV, FLV'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate file size (5GB max)
    const maxSize = 5 * 1024 * 1024 * 1024; // 5GB
    if (fileSize > maxSize) {
      return new Response(
        JSON.stringify({ error: 'File too large. Maximum size is 5GB' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    logger.info(`Creating TUS upload for: ${filename} (${fileSize} bytes) by ${authResult.user.email}`);

    // Create TUS upload URL via Cloudflare
    const { tusUrl, videoId, expiresAt } = await createTusUpload({
      filename,
      meta: {
        courseId,
        lessonId,
        title,
        description: description || '',
        uploadedBy: authResult.user.email || 'unknown',
        uploadedAt: new Date().toISOString(),
      },
      requireSignedURLs: false, // Allow public playback
      maxDurationSeconds: 21600, // 6 hours max
    });

    logger.info(`TUS upload created: ${videoId}`);

    // Save initial video record to database
    const dbVideo = await createCourseVideo({
      course_id: courseId,
      lesson_id: lessonId,
      cloudflare_video_id: videoId,
      title: title.trim(),
      description: description?.trim() || null,
      status: 'queued', // Initial status
      processing_progress: 0,
      metadata: {
        filename,
        fileSize,
        uploadedBy: authResult.user.email,
        uploadedAt: new Date().toISOString(),
      },
    });

    logger.info(`Video record created in database: ${dbVideo.id}`);

    return new Response(
      JSON.stringify({
        tusUrl,
        videoId, // Cloudflare video UID
        dbVideoId: dbVideo.id, // Database record ID
        expiresAt,
        message: 'TUS upload URL created successfully',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );

  } catch (err) {
    logger.error('TUS upload creation error:', err as Error);

    return new Response(
      JSON.stringify({
        error: 'Failed to create upload URL',
        message: err instanceof Error ? err.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
