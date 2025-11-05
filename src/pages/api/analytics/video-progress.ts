/**
 * Video Progress Tracking API (T190)
 *
 * POST /api/analytics/video-progress
 *
 * Updates video watch progress during playback.
 * Called periodically (e.g., every 10-30 seconds) while video is playing.
 */

import type { APIRoute } from 'astro';
import { trackVideoProgress } from '@/lib/analytics/videos';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/ratelimit';

export const POST: APIRoute = async ({ request }) => {
  try {
    // Apply rate limiting (120 requests per minute per IP for progress updates)
    const rateLimitResult = await applyRateLimit(request, {
      maxRequests: 120,
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
    const {
      session_id,
      current_position_seconds,
      watch_time_seconds,
      play_count,
      pause_count,
      seek_count,
      average_playback_speed,
      quality_changes,
    } = body;

    // Validate required fields
    if (!session_id || current_position_seconds === undefined) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields: session_id, current_position_seconds',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Track video progress
    const analytics = await trackVideoProgress({
      session_id,
      current_position_seconds,
      watch_time_seconds,
      play_count,
      pause_count,
      seek_count,
      average_playback_speed,
      quality_changes,
    });

    logger.debug(`Video progress updated: ${session_id}, position: ${current_position_seconds}s`);

    return new Response(
      JSON.stringify({
        success: true,
        session_id: analytics.session_id,
        completion_percentage: analytics.completion_percentage,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    logger.error('Error in video-progress API:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to track video progress',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
