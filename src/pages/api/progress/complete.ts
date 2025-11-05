/**
 * T187: Mark Lesson as Complete API
 *
 * Updates lesson progress to mark as completed.
 *
 * POST /api/progress/complete
 *
 * Request body:
 * - courseId: Course ID
 * - lessonId: Lesson ID
 *
 * Response:
 * - success: boolean
 * - message: string
 */

import type { APIRoute } from 'astro';
import { getSessionFromRequest } from '@/lib/auth/session';
import { getPool } from '@/lib/db';
import { logger } from '@/lib/logger';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Check authentication
    const session = await getSessionFromRequest(cookies);
    if (!session) {
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
    const { courseId, lessonId } = body;

    if (!courseId || !lessonId) {
      return new Response(
        JSON.stringify({ error: 'Course ID and Lesson ID are required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const pool = getPool();

    // Check if user is enrolled in the course
    const enrollmentResult = await pool.query(
      `SELECT 1 FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       WHERE o.user_id = $1 AND oi.course_id = $2 AND o.status = 'completed'
       LIMIT 1`,
      [session.userId, courseId]
    );

    if (enrollmentResult.rows.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Not enrolled in this course' }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Update lesson progress to completed
    await pool.query(
      `INSERT INTO lesson_progress (user_id, course_id, lesson_id, completed, completed_at, updated_at)
       VALUES ($1, $2, $3, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id, course_id, lesson_id)
       DO UPDATE SET
         completed = true,
         completed_at = CURRENT_TIMESTAMP,
         updated_at = CURRENT_TIMESTAMP`,
      [session.userId, courseId, lessonId]
    );

    logger.info(`Lesson marked as complete: user=${session.userId}, course=${courseId}, lesson=${lessonId}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Lesson marked as complete',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    logger.error('Error marking lesson complete:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to mark lesson as complete',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
