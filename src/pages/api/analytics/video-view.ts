/**
 * Video View Tracking API (T190)
 *
 * POST /api/analytics/video-view
 *
 * Tracks when a user starts watching a video.
 * Creates a new analytics session.
 */

import type { APIRoute } from 'astro';
import { trackVideoView } from '@/lib/analytics/videos';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/ratelimit';

export const POST: APIRoute = async ({ request, clientAddress, locals }) => {
  try {
    // Apply rate limiting (60 requests per minute per IP)
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
    const {
      video_id,
      course_id,
      session_id,
      video_duration_seconds,
      lesson_id,
      is_preview,
    } = body;

    // Validate required fields
    if (!video_id || !course_id || !session_id) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields: video_id, course_id, session_id',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Get user ID from session (if authenticated)
    const userId = locals.user?.id || null;

    // Parse user agent
    const userAgent = request.headers.get('user-agent') || '';
    const deviceType = detectDeviceType(userAgent);
    const browser = detectBrowser(userAgent);
    const os = detectOS(userAgent);

    // Get referrer
    const referrer = request.headers.get('referer') || request.headers.get('referrer') || '';

    // Track video view
    const analytics = await trackVideoView({
      video_id,
      user_id: userId,
      course_id,
      session_id,
      video_duration_seconds: video_duration_seconds || undefined,
      lesson_id: lesson_id || undefined,
      is_preview: is_preview || false,
      ip_address: clientAddress,
      user_agent: userAgent,
      device_type: deviceType,
      browser,
      os,
      referrer,
    });

    logger.info(`Video view tracked: ${video_id}, session: ${session_id}`);

    return new Response(
      JSON.stringify({
        success: true,
        analytics_id: analytics.id,
        session_id: analytics.session_id,
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    logger.error('Error in video-view API:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to track video view',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

/**
 * Detect device type from user agent
 */
function detectDeviceType(userAgent: string): 'mobile' | 'tablet' | 'desktop' {
  const ua = userAgent.toLowerCase();

  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(userAgent)) {
    return 'tablet';
  }

  if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent)) {
    return 'mobile';
  }

  return 'desktop';
}

/**
 * Detect browser from user agent
 */
function detectBrowser(userAgent: string): string {
  const ua = userAgent.toLowerCase();

  if (ua.includes('edg/')) return 'Edge';
  if (ua.includes('chrome/')) return 'Chrome';
  if (ua.includes('firefox/')) return 'Firefox';
  if (ua.includes('safari/') && !ua.includes('chrome')) return 'Safari';
  if (ua.includes('opr/') || ua.includes('opera/')) return 'Opera';

  return 'Unknown';
}

/**
 * Detect operating system from user agent
 */
function detectOS(userAgent: string): string {
  const ua = userAgent.toLowerCase();

  if (ua.includes('windows')) return 'Windows';
  if (ua.includes('mac')) return 'macOS';
  if (ua.includes('linux')) return 'Linux';
  if (ua.includes('android')) return 'Android';
  if (ua.includes('iphone') || ua.includes('ipad')) return 'iOS';

  return 'Unknown';
}
