/**
 * T187: Update Lesson Progress API
 *
 * Updates lesson progress with current watch time and progress percentage.
 *
 * POST /api/progress/update
 *
 * Request body:
 * - courseId: Course ID
 * - lessonId: Lesson ID
 * - progress: Progress percentage (0-100)
 * - currentTime: Current playback time in seconds
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
    const { courseId, lessonId, progress, currentTime } = body;

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

    // Update lesson progress with current time and progress
    const timeSpentSeconds = Math.floor(currentTime || 0);

    await pool.query(
      `INSERT INTO lesson_progress (user_id, course_id, lesson_id, time_spent_seconds, last_accessed_at, updated_at)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id, course_id, lesson_id)
       DO UPDATE SET
         time_spent_seconds = GREATEST(lesson_progress.time_spent_seconds, EXCLUDED.time_spent_seconds),
         last_accessed_at = CURRENT_TIMESTAMP,
         updated_at = CURRENT_TIMESTAMP`,
      [session.userId, courseId, lessonId, timeSpentSeconds]
    );

    // Auto-complete if progress >= 90%
    if (progress && progress >= 90) {
      await pool.query(
        `UPDATE lesson_progress
         SET completed = true,
             completed_at = COALESCE(completed_at, CURRENT_TIMESTAMP),
             updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $1 AND course_id = $2 AND lesson_id = $3 AND completed = false`,
        [session.userId, courseId, lessonId]
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Progress updated',
        progress: progress || 0,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    logger.error('Error updating progress:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to update progress',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
