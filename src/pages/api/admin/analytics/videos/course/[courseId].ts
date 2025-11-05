/**
 * Admin Course Video Analytics API (T190)
 *
 * GET /api/admin/analytics/videos/course/[courseId]
 *
 * Returns analytics for all videos in a course.
 * Admin-only endpoint.
 */

import type { APIRoute } from 'astro';
import {
  getCourseVideoAnalytics,
  getCourseVideoAnalyticsOverview,
} from '@/lib/analytics/videos';
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

    const { courseId } = params;

    if (!courseId) {
      return new Response(
        JSON.stringify({ error: 'Course ID is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Get course video analytics
    const videoAnalytics = await getCourseVideoAnalytics(courseId);
    const overview = await getCourseVideoAnalyticsOverview(courseId);

    logger.info(`Admin retrieved course video analytics: ${courseId}`);

    return new Response(
      JSON.stringify({
        success: true,
        overview,
        videos: videoAnalytics,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    logger.error('Error in admin course video analytics API:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to retrieve course video analytics',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
