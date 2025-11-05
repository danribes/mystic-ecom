/**
 * T069: Admin Courses API Endpoint
 *
 * POST /api/admin/courses
 * - Create a new course (admin only)
 *
 * PUT /api/admin/courses
 * - Update an existing course (admin only)
 *
 * DELETE /api/admin/courses
 * - Delete a course (admin only)
 *
 * Security: Uses centralized admin authorization middleware (T204)
 */

import type { APIRoute } from 'astro';
import {
  createCourse,
  updateCourse,
  deleteCourse,
  publishCourse,
  unpublishCourse,
  type CreateCourseInput,
  type UpdateCourseInput,
} from '@/services/course.service';
import { withAdminAuth } from '@/lib/adminAuth';
import { ValidationError } from '@/lib/errors';
import { rateLimit, RateLimitProfiles } from '@/lib/ratelimit';
import { z } from 'zod';

// ==================== Validation Schemas ====================

const CreateCourseSchema = z.object({
  title: z.string().min(3).max(200),
  slug: z.string().min(3).max(200),
  description: z.string().min(10).max(500),
  longDescription: z.string().optional(),
  instructorId: z.string().uuid(),
  price: z.number().min(0),
  duration: z.number().min(1),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  category: z.string().min(2).max(100),
  imageUrl: z.string().url().optional().or(z.literal('')),
  thumbnailUrl: z.string().url().optional().or(z.literal('')),
  previewVideoUrl: z.string().url().optional().or(z.literal('')),
  tags: z.array(z.string()).optional().default([]),
  learningOutcomes: z.array(z.string()).optional().default([]),
  prerequisites: z.array(z.string()).optional().default([]),
  curriculum: z.array(z.object({
    title: z.string(),
    description: z.string().optional(),
    order: z.number(),
    lessons: z.array(z.object({
      title: z.string(),
      duration: z.number(),
      type: z.enum(['video', 'text', 'quiz', 'assignment']),
      videoUrl: z.string().url().optional(),
      content: z.string().optional(),
      order: z.number(),
    })),
  })).optional().default([]),
  isPublished: z.boolean().optional().default(false),
  isFeatured: z.boolean().optional().default(false),
});

const UpdateCourseSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(3).max(200).optional(),
  slug: z.string().min(3).max(200).optional(),
  description: z.string().min(10).max(500).optional(),
  longDescription: z.string().optional(),
  price: z.number().min(0).optional(),
  duration: z.number().min(1).optional(),
  level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  category: z.string().min(2).max(100).optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  thumbnailUrl: z.string().url().optional().or(z.literal('')),
  previewVideoUrl: z.string().url().optional().or(z.literal('')),
  tags: z.array(z.string()).optional(),
  learningOutcomes: z.array(z.string()).optional(),
  prerequisites: z.array(z.string()).optional(),
  isPublished: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
});

const DeleteCourseSchema = z.object({
  id: z.string().uuid(),
});

const PublishCourseSchema = z.object({
  id: z.string().uuid(),
  action: z.enum(['publish', 'unpublish']),
});

// ==================== POST Handler ====================

/**
 * POST /api/admin/courses
 * Create a new course (admin only)
 */
const postHandler: APIRoute = async (context) => {
  // Rate limiting: 200 requests per minute for admin endpoints
  const rateLimitResult = await rateLimit(context, RateLimitProfiles.ADMIN);
  if (!rateLimitResult.allowed) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Too many requests. Please try again later.',
        resetAt: rateLimitResult.resetAt,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(rateLimitResult.resetAt - Math.floor(Date.now() / 1000)),
        },
      }
    );
  }

  try {
    // Parse and validate request body
    const body = await context.request.json();
    const validatedData = CreateCourseSchema.safeParse(body);

    if (!validatedData.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid course data',
          details: validatedData.error.errors,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const courseInput: CreateCourseInput = validatedData.data;
    const course = await createCourse(courseInput);

    console.log('[ADMIN-COURSES] Course created:', {
      courseId: course.id,
      title: course.title,
      adminId: context.locals.session?.userId,
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: course,
        message: 'Course created successfully',
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[ADMIN-COURSES] Error creating course:', error);

    if (error instanceof ValidationError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message,
          code: 'VALIDATION_ERROR',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to create course',
        message: error instanceof Error ? error.message : 'Unknown error',
        code: 'COURSE_CREATE_ERROR',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

export const POST = withAdminAuth(postHandler);

// ==================== PUT Handler ====================

/**
 * PUT /api/admin/courses
 * Update an existing course (admin only)
 */
const putHandler: APIRoute = async (context) => {
  // Rate limiting: 200 requests per minute for admin endpoints
  const rateLimitResult = await rateLimit(context, RateLimitProfiles.ADMIN);
  if (!rateLimitResult.allowed) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Too many requests. Please try again later.',
        resetAt: rateLimitResult.resetAt,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(rateLimitResult.resetAt - Math.floor(Date.now() / 1000)),
        },
      }
    );
  }

  try {
    // Parse and validate request body
    const body = await context.request.json();
    const validatedData = UpdateCourseSchema.safeParse(body);

    if (!validatedData.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid course data',
          details: validatedData.error.errors,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const { id, ...updateData } = validatedData.data;

    // Remove empty strings for optional URL fields
    const cleanedData: UpdateCourseInput = Object.fromEntries(
      Object.entries(updateData).filter(([_, v]) => v !== '')
    ) as UpdateCourseInput;

    const updatedCourse = await updateCourse(id, cleanedData);

    console.log('[ADMIN-COURSES] Course updated:', {
      courseId: id,
      title: updatedCourse.title,
      adminId: context.locals.session?.userId,
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: updatedCourse,
        message: 'Course updated successfully',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[ADMIN-COURSES] Error updating course:', error);

    if (error instanceof ValidationError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message,
          code: 'VALIDATION_ERROR',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Handle "Course not found" error (from service)
    if (error instanceof Error && error.message.includes('not found')) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Course not found',
          code: 'COURSE_NOT_FOUND',
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to update course',
        message: error instanceof Error ? error.message : 'Unknown error',
        code: 'COURSE_UPDATE_ERROR',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

export const PUT = withAdminAuth(putHandler);

// ==================== DELETE Handler ====================

/**
 * DELETE /api/admin/courses?id=...
 * Delete a course (admin only)
 */
const deleteHandler: APIRoute = async (context) => {
  // Rate limiting: 200 requests per minute for admin endpoints
  const rateLimitResult = await rateLimit(context, RateLimitProfiles.ADMIN);
  if (!rateLimitResult.allowed) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Too many requests. Please try again later.',
        resetAt: rateLimitResult.resetAt,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(rateLimitResult.resetAt - Math.floor(Date.now() / 1000)),
        },
      }
    );
  }

  try {
    // Get course ID from query parameters
    const url = new URL(context.request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Course ID is required',
          code: 'MISSING_COURSE_ID',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate course ID
    const validatedData = DeleteCourseSchema.safeParse({ id });

    if (!validatedData.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid course ID format',
          details: validatedData.error.errors,
          code: 'INVALID_COURSE_ID',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    await deleteCourse(id);

    console.log('[ADMIN-COURSES] Course deleted:', {
      courseId: id,
      adminId: context.locals.session?.userId,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Course deleted successfully',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[ADMIN-COURSES] Error deleting course:', error);

    // Handle "Course not found" error (from service)
    if (error instanceof Error && error.message.includes('not found')) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Course not found',
          code: 'COURSE_NOT_FOUND',
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to delete course',
        message: error instanceof Error ? error.message : 'Unknown error',
        code: 'COURSE_DELETE_ERROR',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

export const DELETE = withAdminAuth(deleteHandler);

// ==================== PATCH Handler (Publish/Unpublish) ====================

/**
 * PATCH /api/admin/courses
 * Publish or unpublish a course (admin only)
 */
const patchHandler: APIRoute = async (context) => {
  try {
    // Parse and validate request body
    const body = await context.request.json();
    const validatedData = PublishCourseSchema.safeParse(body);

    if (!validatedData.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid request data',
          details: validatedData.error.errors,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const { id, action } = validatedData.data;

    const updatedCourse = action === 'publish'
      ? await publishCourse(id)
      : await unpublishCourse(id);

    console.log('[ADMIN-COURSES] Course publish status changed:', {
      courseId: id,
      action,
      adminId: context.locals.session?.userId,
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: updatedCourse,
        message: `Course ${action}ed successfully`,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[ADMIN-COURSES] Error changing course publish status:', error);

    if (error instanceof Error && error.message.includes('not found')) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Course not found',
          code: 'COURSE_NOT_FOUND',
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to change course publish status',
        message: error instanceof Error ? error.message : 'Unknown error',
        code: 'COURSE_PUBLISH_ERROR',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

export const PATCH = withAdminAuth(patchHandler);
