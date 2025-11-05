/**
 * T069: Admin Courses API Tests
 *
 * Tests for POST, PUT, DELETE, PATCH endpoints in /api/admin/courses
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { APIContext } from 'astro';

// Mock dependencies
vi.mock('@/services/course.service', () => ({
  createCourse: vi.fn(),
  updateCourse: vi.fn(),
  deleteCourse: vi.fn(),
  publishCourse: vi.fn(),
  unpublishCourse: vi.fn(),
}));

vi.mock('@/lib/adminAuth', () => ({
  withAdminAuth: (handler: Function) => handler, // Pass through for testing
  checkAdminAuth: vi.fn(),
}));

vi.mock('@/lib/errors', () => ({
  ValidationError: class ValidationError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'ValidationError';
    }
  },
}));

// Import after mocking
import { POST, PUT, DELETE, PATCH } from '@/pages/api/admin/courses';
import {
  createCourse,
  updateCourse,
  deleteCourse,
  publishCourse,
  unpublishCourse,
} from '@/services/course.service';
import { ValidationError } from '@/lib/errors';

// ==================== Test Helpers ====================

function createMockContext(options: {
  method: string;
  body?: any;
  query?: Record<string, string>;
  session?: any;
}): APIContext {
  const url = new URL('http://localhost/api/admin/courses');

  if (options.query) {
    Object.entries(options.query).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }

  const mockRequest = {
    method: options.method,
    url: url.toString(),
    headers: new Headers({
      'Content-Type': 'application/json',
    }),
    json: vi.fn().mockResolvedValue(options.body || {}),
  };

  return {
    request: mockRequest as unknown as Request,
    locals: {
      session: options.session || {
        userId: 'admin-user-123',
        role: 'admin',
      },
      isAdmin: true,
    },
    url,
  } as unknown as APIContext;
}

const mockCourse = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  title: 'Test Course',
  slug: 'test-course',
  description: 'A test course description',
  longDescription: 'A longer test course description',
  instructorId: '660e8400-e29b-41d4-a716-446655440000',
  price: 4999, // $49.99
  duration: 3600, // 1 hour
  level: 'beginner' as const,
  category: 'Meditation',
  imageUrl: 'https://example.com/image.jpg',
  thumbnailUrl: 'https://example.com/thumb.jpg',
  previewVideoUrl: undefined,
  tags: ['meditation', 'mindfulness'],
  learningOutcomes: ['Learn to meditate', 'Reduce stress'],
  prerequisites: [],
  curriculum: [],
  enrollmentCount: 0,
  avgRating: null,
  reviewCount: 0,
  isPublished: false,
  isFeatured: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// ==================== POST Tests ====================

describe('POST /api/admin/courses', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a new course with valid data', async () => {
    const courseInput = {
      title: 'Test Course',
      slug: 'test-course',
      description: 'A test course description',
      longDescription: 'A longer description',
      instructorId: '660e8400-e29b-41d4-a716-446655440000',
      price: 4999,
      duration: 3600,
      level: 'beginner',
      category: 'Meditation',
      tags: ['meditation'],
      learningOutcomes: ['Learn to meditate'],
      prerequisites: [],
      isPublished: false,
      isFeatured: false,
    };

    vi.mocked(createCourse).mockResolvedValueOnce(mockCourse);

    const context = createMockContext({
      method: 'POST',
      body: courseInput,
    });

    const response = await POST(context);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data).toMatchObject({
      id: mockCourse.id,
      title: mockCourse.title,
      slug: mockCourse.slug,
      description: mockCourse.description,
    });
    expect(data.message).toBe('Course created successfully');
    expect(createCourse).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Test Course',
      slug: 'test-course',
    }));
  });

  it('should return 400 for missing required fields', async () => {
    const invalidInput = {
      title: 'Test Course',
      // Missing slug, description, etc.
    };

    const context = createMockContext({
      method: 'POST',
      body: invalidInput,
    });

    const response = await POST(context);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Invalid course data');
    expect(data.details).toBeDefined();
    expect(createCourse).not.toHaveBeenCalled();
  });

  it('should return 400 for invalid field types', async () => {
    const invalidInput = {
      title: 'Test Course',
      slug: 'test-course',
      description: 'A test course',
      instructorId: '660e8400-e29b-41d4-a716-446655440000',
      price: 'not-a-number', // Invalid
      duration: 3600,
      level: 'beginner',
      category: 'Meditation',
    };

    const context = createMockContext({
      method: 'POST',
      body: invalidInput,
    });

    const response = await POST(context);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(createCourse).not.toHaveBeenCalled();
  });

  it('should handle validation errors from service', async () => {
    const courseInput = {
      title: 'Test Course',
      slug: 'test-course',
      description: 'A test course description',
      instructorId: '660e8400-e29b-41d4-a716-446655440000',
      price: 4999,
      duration: 3600,
      level: 'beginner',
      category: 'Meditation',
    };

    vi.mocked(createCourse).mockRejectedValueOnce(
      new ValidationError('Slug already exists')
    );

    const context = createMockContext({
      method: 'POST',
      body: courseInput,
    });

    const response = await POST(context);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Slug already exists');
    expect(data.code).toBe('VALIDATION_ERROR');
  });

  it('should handle service errors', async () => {
    const courseInput = {
      title: 'Test Course',
      slug: 'test-course',
      description: 'A test course description',
      instructorId: '660e8400-e29b-41d4-a716-446655440000',
      price: 4999,
      duration: 3600,
      level: 'beginner',
      category: 'Meditation',
    };

    vi.mocked(createCourse).mockRejectedValueOnce(
      new Error('Database connection failed')
    );

    const context = createMockContext({
      method: 'POST',
      body: courseInput,
    });

    const response = await POST(context);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Failed to create course');
    expect(data.code).toBe('COURSE_CREATE_ERROR');
  });

  it('should accept optional fields', async () => {
    const courseInput = {
      title: 'Test Course',
      slug: 'test-course',
      description: 'A test course description',
      instructorId: '660e8400-e29b-41d4-a716-446655440000',
      price: 4999,
      duration: 3600,
      level: 'beginner',
      category: 'Meditation',
      imageUrl: 'https://example.com/image.jpg',
      thumbnailUrl: 'https://example.com/thumb.jpg',
      previewVideoUrl: 'https://example.com/preview.mp4',
      tags: ['meditation', 'mindfulness'],
      learningOutcomes: ['Learn to meditate', 'Reduce stress'],
      prerequisites: ['Basic knowledge of breathing'],
      isPublished: true,
      isFeatured: true,
    };

    vi.mocked(createCourse).mockResolvedValueOnce({
      ...mockCourse,
      ...courseInput,
    });

    const context = createMockContext({
      method: 'POST',
      body: courseInput,
    });

    const response = await POST(context);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(createCourse).toHaveBeenCalledWith(expect.objectContaining({
      imageUrl: 'https://example.com/image.jpg',
      tags: ['meditation', 'mindfulness'],
      isPublished: true,
      isFeatured: true,
    }));
  });
});

// ==================== PUT Tests ====================

describe('PUT /api/admin/courses', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should update a course with valid data', async () => {
    const updateInput = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      title: 'Updated Course Title',
      price: 5999,
    };

    const updatedCourse = {
      ...mockCourse,
      title: 'Updated Course Title',
      price: 5999,
    };

    vi.mocked(updateCourse).mockResolvedValueOnce(updatedCourse);

    const context = createMockContext({
      method: 'PUT',
      body: updateInput,
    });

    const response = await PUT(context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.title).toBe('Updated Course Title');
    expect(data.message).toBe('Course updated successfully');
    expect(updateCourse).toHaveBeenCalledWith('550e8400-e29b-41d4-a716-446655440000', {
      title: 'Updated Course Title',
      price: 5999,
    });
  });

  it('should return 400 for missing course ID', async () => {
    const invalidInput = {
      title: 'Updated Title',
      // Missing id
    };

    const context = createMockContext({
      method: 'PUT',
      body: invalidInput,
    });

    const response = await PUT(context);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Invalid course data');
    expect(updateCourse).not.toHaveBeenCalled();
  });

  it('should return 400 for invalid UUID format', async () => {
    const invalidInput = {
      id: 'not-a-uuid',
      title: 'Updated Title',
    };

    const context = createMockContext({
      method: 'PUT',
      body: invalidInput,
    });

    const response = await PUT(context);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(updateCourse).not.toHaveBeenCalled();
  });

  it('should return 404 when course not found', async () => {
    const updateInput = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      title: 'Updated Title',
    };

    vi.mocked(updateCourse).mockRejectedValueOnce(
      new Error('Course not found')
    );

    const context = createMockContext({
      method: 'PUT',
      body: updateInput,
    });

    const response = await PUT(context);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Course not found');
    expect(data.code).toBe('COURSE_NOT_FOUND');
  });

  it('should handle validation errors', async () => {
    const updateInput = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      title: 'Updated Title',
    };

    vi.mocked(updateCourse).mockRejectedValueOnce(
      new ValidationError('Title already exists')
    );

    const context = createMockContext({
      method: 'PUT',
      body: updateInput,
    });

    const response = await PUT(context);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Title already exists');
    expect(data.code).toBe('VALIDATION_ERROR');
  });

  it('should update only provided fields', async () => {
    const updateInput = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      price: 5999,
      isPublished: true,
    };

    const updatedCourse = {
      ...mockCourse,
      price: 5999,
      isPublished: true,
    };

    vi.mocked(updateCourse).mockResolvedValueOnce(updatedCourse);

    const context = createMockContext({
      method: 'PUT',
      body: updateInput,
    });

    const response = await PUT(context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(updateCourse).toHaveBeenCalledWith('550e8400-e29b-41d4-a716-446655440000', {
      price: 5999,
      isPublished: true,
    });
  });

  it('should filter out empty string URLs', async () => {
    const updateInput = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      title: 'Updated Title',
      imageUrl: '', // Empty string should be filtered
    };

    const updatedCourse = {
      ...mockCourse,
      title: 'Updated Title',
    };

    vi.mocked(updateCourse).mockResolvedValueOnce(updatedCourse);

    const context = createMockContext({
      method: 'PUT',
      body: updateInput,
    });

    const response = await PUT(context);

    expect(response.status).toBe(200);
    expect(updateCourse).toHaveBeenCalledWith('550e8400-e29b-41d4-a716-446655440000', {
      title: 'Updated Title',
      // imageUrl should be filtered out
    });
  });
});

// ==================== DELETE Tests ====================

describe('DELETE /api/admin/courses', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should delete a course with valid ID', async () => {
    vi.mocked(deleteCourse).mockResolvedValueOnce(undefined);

    const context = createMockContext({
      method: 'DELETE',
      query: { id: '550e8400-e29b-41d4-a716-446655440000' },
    });

    const response = await DELETE(context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe('Course deleted successfully');
    expect(deleteCourse).toHaveBeenCalledWith('550e8400-e29b-41d4-a716-446655440000');
  });

  it('should return 400 when ID is missing', async () => {
    const context = createMockContext({
      method: 'DELETE',
      query: {}, // No ID
    });

    const response = await DELETE(context);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Course ID is required');
    expect(data.code).toBe('MISSING_COURSE_ID');
    expect(deleteCourse).not.toHaveBeenCalled();
  });

  it('should return 400 for invalid UUID format', async () => {
    const context = createMockContext({
      method: 'DELETE',
      query: { id: 'not-a-uuid' },
    });

    const response = await DELETE(context);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Invalid course ID format');
    expect(data.code).toBe('INVALID_COURSE_ID');
    expect(deleteCourse).not.toHaveBeenCalled();
  });

  it('should return 404 when course not found', async () => {
    vi.mocked(deleteCourse).mockRejectedValueOnce(
      new Error('Course not found')
    );

    const context = createMockContext({
      method: 'DELETE',
      query: { id: '550e8400-e29b-41d4-a716-446655440000' },
    });

    const response = await DELETE(context);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Course not found');
    expect(data.code).toBe('COURSE_NOT_FOUND');
  });

  it('should handle service errors', async () => {
    vi.mocked(deleteCourse).mockRejectedValueOnce(
      new Error('Database error')
    );

    const context = createMockContext({
      method: 'DELETE',
      query: { id: '550e8400-e29b-41d4-a716-446655440000' },
    });

    const response = await DELETE(context);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Failed to delete course');
    expect(data.code).toBe('COURSE_DELETE_ERROR');
  });
});

// ==================== PATCH Tests ====================

describe('PATCH /api/admin/courses', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should publish a course', async () => {
    const publishedCourse = {
      ...mockCourse,
      isPublished: true,
    };

    vi.mocked(publishCourse).mockResolvedValueOnce(publishedCourse);

    const context = createMockContext({
      method: 'PATCH',
      body: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        action: 'publish',
      },
    });

    const response = await PATCH(context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.isPublished).toBe(true);
    expect(data.message).toBe('Course published successfully');
    expect(publishCourse).toHaveBeenCalledWith('550e8400-e29b-41d4-a716-446655440000');
  });

  it('should unpublish a course', async () => {
    const unpublishedCourse = {
      ...mockCourse,
      isPublished: false,
    };

    vi.mocked(unpublishCourse).mockResolvedValueOnce(unpublishedCourse);

    const context = createMockContext({
      method: 'PATCH',
      body: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        action: 'unpublish',
      },
    });

    const response = await PATCH(context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.isPublished).toBe(false);
    expect(data.message).toBe('Course unpublished successfully');
    expect(unpublishCourse).toHaveBeenCalledWith('550e8400-e29b-41d4-a716-446655440000');
  });

  it('should return 400 for missing ID', async () => {
    const context = createMockContext({
      method: 'PATCH',
      body: {
        action: 'publish',
        // Missing id
      },
    });

    const response = await PATCH(context);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Invalid request data');
    expect(publishCourse).not.toHaveBeenCalled();
    expect(unpublishCourse).not.toHaveBeenCalled();
  });

  it('should return 400 for invalid action', async () => {
    const context = createMockContext({
      method: 'PATCH',
      body: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        action: 'invalid-action',
      },
    });

    const response = await PATCH(context);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(publishCourse).not.toHaveBeenCalled();
    expect(unpublishCourse).not.toHaveBeenCalled();
  });

  it('should return 404 when course not found', async () => {
    vi.mocked(publishCourse).mockRejectedValueOnce(
      new Error('Course not found')
    );

    const context = createMockContext({
      method: 'PATCH',
      body: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        action: 'publish',
      },
    });

    const response = await PATCH(context);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Course not found');
    expect(data.code).toBe('COURSE_NOT_FOUND');
  });

  it('should handle service errors', async () => {
    vi.mocked(publishCourse).mockRejectedValueOnce(
      new Error('Database error')
    );

    const context = createMockContext({
      method: 'PATCH',
      body: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        action: 'publish',
      },
    });

    const response = await PATCH(context);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Failed to change course publish status');
    expect(data.code).toBe('COURSE_PUBLISH_ERROR');
  });
});

// ==================== Integration Tests ====================

describe('Admin Courses API - Integration', () => {
  it('should maintain consistent error response format', async () => {
    const endpoints = [
      { handler: POST, method: 'POST', body: {} },
      { handler: PUT, method: 'PUT', body: {} },
      { handler: DELETE, method: 'DELETE', query: {} },
      { handler: PATCH, method: 'PATCH', body: {} },
    ];

    for (const endpoint of endpoints) {
      const context = createMockContext({
        method: endpoint.method,
        body: endpoint.body,
        query: endpoint.query,
      });

      const response = await endpoint.handler(context);
      const data = await response.json();

      expect(data).toHaveProperty('success');
      expect(data.success).toBe(false);
      expect(data).toHaveProperty('error');
    }
  });

  it('should log admin actions', async () => {
    const consoleSpy = vi.spyOn(console, 'log');

    vi.mocked(createCourse).mockResolvedValueOnce(mockCourse);

    const context = createMockContext({
      method: 'POST',
      body: {
        title: 'Test Course',
        slug: 'test-course',
        description: 'A test course',
        instructorId: '660e8400-e29b-41d4-a716-446655440000',
        price: 4999,
        duration: 3600,
        level: 'beginner',
        category: 'Meditation',
      },
      session: {
        userId: 'admin-user-123',
        role: 'admin',
      },
    });

    await POST(context);

    expect(consoleSpy).toHaveBeenCalledWith(
      '[ADMIN-COURSES] Course created:',
      expect.objectContaining({
        courseId: '550e8400-e29b-41d4-a716-446655440000',
        adminId: 'admin-user-123',
      })
    );

    consoleSpy.mockRestore();
  });
});
