/**
 * Video Completion Tracking API (T190)
 *
 * POST /api/analytics/video-complete
 *
 * Marks a video as completed when user finishes watching.
 * Typically triggered when watch progress reaches 90-100%.
 */

import type { APIRoute } from 'astro';
import { trackVideoCompletion } from '@/lib/analytics/videos';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/ratelimit';

export const POST: APIRoute = async ({ request }) => {
  try {
    // Apply rate limiting
    const rateLimitResult = await applyRateLimit(request, {
      maxRequests: 60,
      windowMs: 60000,
    });

    if (!rateLimitResult.success) {
      return new Response(
        JSON.stringify({
          error: 'Too many requests. Please try again later.',
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': rateLimitResult.retryAfter?.toString() || '60',
          },
        }
      );
    }

    // Parse request body
    const body = await request.json();
    const { session_id, watch_time_seconds, completion_percentage } = body;

    // Validate required fields
    if (!session_id || watch_time_seconds === undefined || completion_percentage === undefined) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields: session_id, watch_time_seconds, completion_percentage',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Track video completion
    const analytics = await trackVideoCompletion({
      session_id,
      watch_time_seconds,
      completion_percentage,
    });

    logger.info(`Video completed: ${analytics.video_id}, session: ${session_id}, completion: ${completion_percentage}%`);

    return new Response(
      JSON.stringify({
        success: true,
        session_id: analytics.session_id,
        completed: analytics.completed,
        completed_at: analytics.completed_at,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    logger.error('Error in video-complete API:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to track video completion',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
