/**
 * T070: Course File Upload API - Unit Tests
 *
 * Tests for POST /api/courses/upload endpoint
 * - Authentication and authorization
 * - File type validation
 * - File size validation
 * - Magic byte validation
 * - Rate limiting
 * - Storage integration
 * - Error handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { APIContext } from 'astro';

// Mock dependencies
vi.mock('@/lib/storage', () => ({
  uploadFile: vi.fn(),
}));

vi.mock('@/lib/fileValidation', () => ({
  validateFile: vi.fn(),
}));

vi.mock('@/lib/ratelimit', () => ({
  rateLimit: vi.fn(),
  RateLimitProfiles: {
    UPLOAD: 'upload',
  },
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionFromRequest: vi.fn(),
}));

import { POST } from '@/pages/api/courses/upload';
import { uploadFile } from '@/lib/storage';
import { validateFile } from '@/lib/fileValidation';
import { rateLimit } from '@/lib/ratelimit';
import { getSessionFromRequest } from '@/lib/auth/session';

// ==================== Test Helpers ====================

/**
 * Create a mock File object
 */
function createMockFile(options: {
  name: string;
  type: string;
  size: number;
  content?: string;
}): File {
  const { name, type, size, content = 'mock file content' } = options;

  // Create a simple buffer
  const buffer = Buffer.from(content);

  // Mock File object
  const file = {
    name,
    type,
    size,
    arrayBuffer: vi.fn().mockResolvedValue(buffer.buffer),
  } as unknown as File;

  return file;
}

/**
 * Create a mock FormData
 */
function createMockFormData(file: File | null): FormData {
  const formData = new Map();
  if (file) {
    formData.set('file', file);
  }

  return {
    get: (key: string) => formData.get(key),
    set: (key: string, value: any) => formData.set(key, value),
  } as unknown as FormData;
}

/**
 * Create a mock Request
 */
function createMockRequest(options: {
  formData: FormData;
  contentType?: string;
  url?: string;
}): Request {
  const { formData, contentType = 'multipart/form-data', url = 'http://localhost/api/courses/upload' } = options;

  return {
    headers: new Headers({
      'Content-Type': contentType,
    }),
    formData: vi.fn().mockResolvedValue(formData),
    url,
  } as unknown as Request;
}

/**
 * Create a mock APIContext
 */
function createMockContext(options: {
  request: Request;
  session?: any;
  clientAddress?: string;
}): APIContext {
  const { request, session = null, clientAddress = '127.0.0.1' } = options;

  return {
    request,
    cookies: {} as any,
    clientAddress,
  } as unknown as APIContext;
}

// ==================== Tests ====================

describe('POST /api/courses/upload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==================== Authentication Tests ====================

  describe('Authentication', () => {
    it('should reject unauthenticated requests', async () => {
      // Mock no session
      (getSessionFromRequest as any).mockResolvedValue(null);

      const file = createMockFile({
        name: 'test.jpg',
        type: 'image/jpeg',
        size: 1024,
      });

      const formData = createMockFormData(file);
      const request = createMockRequest({ formData });
      const context = createMockContext({ request });

      const response = await POST(context);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Authentication required');
      expect(data.code).toBe('AUTHENTICATION_REQUIRED');
    });

    it('should reject requests with invalid session', async () => {
      // Mock session without userId
      (getSessionFromRequest as any).mockResolvedValue({ role: 'admin' });

      const file = createMockFile({
        name: 'test.jpg',
        type: 'image/jpeg',
        size: 1024,
      });

      const formData = createMockFormData(file);
      const request = createMockRequest({ formData });
      const context = createMockContext({ request });

      const response = await POST(context);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.code).toBe('AUTHENTICATION_REQUIRED');
    });
  });

  // ==================== Authorization Tests ====================

  describe('Authorization', () => {
    it('should allow admin users to upload', async () => {
      // Mock admin session
      (getSessionFromRequest as any).mockResolvedValue({
        userId: 'admin-user-id',
        role: 'admin',
      });

      // Mock rate limit success
      (rateLimit as any).mockResolvedValue({ allowed: true });

      // Mock validation success
      (validateFile as any).mockResolvedValue({
        valid: true,
        detectedType: 'jpeg',
      });

      // Mock upload success
      (uploadFile as any).mockResolvedValue({
        url: 'http://localhost/uploads/courses/images/test.jpg',
        key: 'courses/images/test.jpg',
        size: 1024,
        contentType: 'image/jpeg',
      });

      const file = createMockFile({
        name: 'test.jpg',
        type: 'image/jpeg',
        size: 1024,
      });

      const formData = createMockFormData(file);
      const request = createMockRequest({ formData });
      const context = createMockContext({ request });

      const response = await POST(context);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
    });

    it('should allow instructor users to upload', async () => {
      // Mock instructor session
      (getSessionFromRequest as any).mockResolvedValue({
        userId: 'instructor-user-id',
        role: 'instructor',
      });

      // Mock rate limit success
      (rateLimit as any).mockResolvedValue({ allowed: true });

      // Mock validation success
      (validateFile as any).mockResolvedValue({
        valid: true,
        detectedType: 'jpeg',
      });

      // Mock upload success
      (uploadFile as any).mockResolvedValue({
        url: 'http://localhost/uploads/courses/images/test.jpg',
        key: 'courses/images/test.jpg',
        size: 1024,
        contentType: 'image/jpeg',
      });

      const file = createMockFile({
        name: 'test.jpg',
        type: 'image/jpeg',
        size: 1024,
      });

      const formData = createMockFormData(file);
      const request = createMockRequest({ formData });
      const context = createMockContext({ request });

      const response = await POST(context);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
    });

    it('should reject regular users', async () => {
      // Mock regular user session
      (getSessionFromRequest as any).mockResolvedValue({
        userId: 'regular-user-id',
        role: 'user',
      });

      const file = createMockFile({
        name: 'test.jpg',
        type: 'image/jpeg',
        size: 1024,
      });

      const formData = createMockFormData(file);
      const request = createMockRequest({ formData });
      const context = createMockContext({ request });

      const response = await POST(context);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Insufficient permissions');
      expect(data.code).toBe('INSUFFICIENT_PERMISSIONS');
    });
  });

  // ==================== Rate Limiting Tests ====================

  describe('Rate Limiting', () => {
    it('should enforce rate limits', async () => {
      // Mock admin session
      (getSessionFromRequest as any).mockResolvedValue({
        userId: 'admin-user-id',
        role: 'admin',
      });

      // Mock rate limit exceeded
      const resetAt = Math.floor(Date.now() / 1000) + 300; // 5 minutes from now
      (rateLimit as any).mockResolvedValue({
        allowed: false,
        resetAt,
      });

      const file = createMockFile({
        name: 'test.jpg',
        type: 'image/jpeg',
        size: 1024,
      });

      const formData = createMockFormData(file);
      const request = createMockRequest({ formData });
      const context = createMockContext({ request });

      const response = await POST(context);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Too many upload attempts');
      expect(data.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(data.resetAt).toBe(resetAt);
      expect(response.headers.get('Retry-After')).toBeTruthy();
    });
  });

  // ==================== Content-Type Validation Tests ====================

  describe('Content-Type Validation', () => {
    it('should reject non-multipart requests', async () => {
      // Mock admin session
      (getSessionFromRequest as any).mockResolvedValue({
        userId: 'admin-user-id',
        role: 'admin',
      });

      // Mock rate limit success
      (rateLimit as any).mockResolvedValue({ allowed: true });

      const file = createMockFile({
        name: 'test.jpg',
        type: 'image/jpeg',
        size: 1024,
      });

      const formData = createMockFormData(file);
      const request = createMockRequest({
        formData,
        contentType: 'application/json', // Wrong content type
      });
      const context = createMockContext({ request });

      const response = await POST(context);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Content-Type must be multipart/form-data');
      expect(data.code).toBe('INVALID_CONTENT_TYPE');
    });
  });

  // ==================== File Presence Tests ====================

  describe('File Presence', () => {
    it('should reject requests without a file', async () => {
      // Mock admin session
      (getSessionFromRequest as any).mockResolvedValue({
        userId: 'admin-user-id',
        role: 'admin',
      });

      // Mock rate limit success
      (rateLimit as any).mockResolvedValue({ allowed: true });

      const formData = createMockFormData(null); // No file
      const request = createMockRequest({ formData });
      const context = createMockContext({ request });

      const response = await POST(context);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('No file provided');
      expect(data.code).toBe('MISSING_FILE');
    });
  });

  // ==================== File Type Validation Tests ====================

  describe('File Type Validation', () => {
    it('should accept valid image files', async () => {
      // Mock admin session
      (getSessionFromRequest as any).mockResolvedValue({
        userId: 'admin-user-id',
        role: 'admin',
      });

      // Mock rate limit success
      (rateLimit as any).mockResolvedValue({ allowed: true });

      // Mock validation success
      (validateFile as any).mockResolvedValue({
        valid: true,
        detectedType: 'jpeg',
      });

      // Mock upload success
      (uploadFile as any).mockResolvedValue({
        url: 'http://localhost/uploads/courses/images/test.jpg',
        key: 'courses/images/test.jpg',
        size: 1024,
        contentType: 'image/jpeg',
      });

      const file = createMockFile({
        name: 'test.jpg',
        type: 'image/jpeg',
        size: 1024,
      });

      const formData = createMockFormData(file);
      const request = createMockRequest({ formData });
      const context = createMockContext({ request });

      const response = await POST(context);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.category).toBe('images');
    });

    it('should accept valid video files', async () => {
      // Mock admin session
      (getSessionFromRequest as any).mockResolvedValue({
        userId: 'admin-user-id',
        role: 'admin',
      });

      // Mock rate limit success
      (rateLimit as any).mockResolvedValue({ allowed: true });

      // Mock validation success
      (validateFile as any).mockResolvedValue({
        valid: true,
        detectedType: 'mp4',
      });

      // Mock upload success
      (uploadFile as any).mockResolvedValue({
        url: 'http://localhost/uploads/courses/videos/test.mp4',
        key: 'courses/videos/test.mp4',
        size: 5 * 1024 * 1024, // 5MB
        contentType: 'video/mp4',
      });

      const file = createMockFile({
        name: 'test.mp4',
        type: 'video/mp4',
        size: 5 * 1024 * 1024,
      });

      const formData = createMockFormData(file);
      const request = createMockRequest({ formData });
      const context = createMockContext({ request });

      const response = await POST(context);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.category).toBe('videos');
    });

    it('should accept valid document files', async () => {
      // Mock admin session
      (getSessionFromRequest as any).mockResolvedValue({
        userId: 'admin-user-id',
        role: 'admin',
      });

      // Mock rate limit success
      (rateLimit as any).mockResolvedValue({ allowed: true });

      // Mock validation success
      (validateFile as any).mockResolvedValue({
        valid: true,
        detectedType: 'pdf',
      });

      // Mock upload success
      (uploadFile as any).mockResolvedValue({
        url: 'http://localhost/uploads/courses/documents/test.pdf',
        key: 'courses/documents/test.pdf',
        size: 2 * 1024 * 1024, // 2MB
        contentType: 'application/pdf',
      });

      const file = createMockFile({
        name: 'test.pdf',
        type: 'application/pdf',
        size: 2 * 1024 * 1024,
      });

      const formData = createMockFormData(file);
      const request = createMockRequest({ formData });
      const context = createMockContext({ request });

      const response = await POST(context);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.category).toBe('documents');
    });

    it('should reject invalid file types', async () => {
      // Mock admin session
      (getSessionFromRequest as any).mockResolvedValue({
        userId: 'admin-user-id',
        role: 'admin',
      });

      // Mock rate limit success
      (rateLimit as any).mockResolvedValue({ allowed: true });

      const file = createMockFile({
        name: 'test.exe',
        type: 'application/x-msdownload',
        size: 1024,
      });

      const formData = createMockFormData(file);
      const request = createMockRequest({ formData });
      const context = createMockContext({ request });

      const response = await POST(context);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid file type');
      expect(data.code).toBe('INVALID_FILE_TYPE');
    });
  });

  // ==================== File Size Validation Tests ====================

  describe('File Size Validation', () => {
    it('should reject oversized image files', async () => {
      // Mock admin session
      (getSessionFromRequest as any).mockResolvedValue({
        userId: 'admin-user-id',
        role: 'admin',
      });

      // Mock rate limit success
      (rateLimit as any).mockResolvedValue({ allowed: true });

      const file = createMockFile({
        name: 'huge.jpg',
        type: 'image/jpeg',
        size: 15 * 1024 * 1024, // 15MB (exceeds 10MB limit)
      });

      const formData = createMockFormData(file);
      const request = createMockRequest({ formData });
      const context = createMockContext({ request });

      const response = await POST(context);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('File too large');
      expect(data.code).toBe('FILE_TOO_LARGE');
    });

    it('should reject oversized video files', async () => {
      // Mock admin session
      (getSessionFromRequest as any).mockResolvedValue({
        userId: 'admin-user-id',
        role: 'admin',
      });

      // Mock rate limit success
      (rateLimit as any).mockResolvedValue({ allowed: true });

      const file = createMockFile({
        name: 'huge.mp4',
        type: 'video/mp4',
        size: 150 * 1024 * 1024, // 150MB (exceeds 100MB limit)
      });

      const formData = createMockFormData(file);
      const request = createMockRequest({ formData });
      const context = createMockContext({ request });

      const response = await POST(context);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('File too large');
      expect(data.code).toBe('FILE_TOO_LARGE');
    });
  });

  // ==================== Magic Byte Validation Tests ====================

  describe('Magic Byte Validation', () => {
    it('should reject files with mismatched magic bytes', async () => {
      // Mock admin session
      (getSessionFromRequest as any).mockResolvedValue({
        userId: 'admin-user-id',
        role: 'admin',
      });

      // Mock rate limit success
      (rateLimit as any).mockResolvedValue({ allowed: true });

      // Mock validation failure
      (validateFile as any).mockResolvedValue({
        valid: false,
        detectedType: 'exe',
        errors: ['File content doesn\'t match claimed type'],
      });

      const file = createMockFile({
        name: 'fake.jpg',
        type: 'image/jpeg',
        size: 1024,
        content: 'MZ', // EXE magic bytes
      });

      const formData = createMockFormData(file);
      const request = createMockRequest({ formData });
      const context = createMockContext({ request });

      const response = await POST(context);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('File validation failed');
      expect(data.code).toBe('FILE_VALIDATION_FAILED');
      expect(data.details).toBeDefined();
    });
  });

  // ==================== Upload Success Tests ====================

  describe('Upload Success', () => {
    it('should successfully upload a file and return correct data', async () => {
      // Mock admin session
      (getSessionFromRequest as any).mockResolvedValue({
        userId: 'admin-user-id',
        role: 'admin',
      });

      // Mock rate limit success
      (rateLimit as any).mockResolvedValue({ allowed: true });

      // Mock validation success
      (validateFile as any).mockResolvedValue({
        valid: true,
        detectedType: 'jpeg',
      });

      // Mock upload success
      (uploadFile as any).mockResolvedValue({
        url: 'http://localhost/uploads/courses/images/test-123.jpg',
        key: 'courses/images/test-123.jpg',
        size: 5120, // 5KB
        contentType: 'image/jpeg',
      });

      const file = createMockFile({
        name: 'test.jpg',
        type: 'image/jpeg',
        size: 5120,
      });

      const formData = createMockFormData(file);
      const request = createMockRequest({ formData });
      const context = createMockContext({ request });

      const response = await POST(context);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data).toMatchObject({
        url: expect.stringContaining('http://localhost/uploads/courses/images/'),
        key: expect.stringContaining('courses/images/'),
        filename: 'test.jpg',
        size: 5120,
        sizeFormatted: '0.00MB',
        type: 'image/jpeg',
        category: 'images',
      });
      expect(data.message).toBe('File uploaded successfully');
    });

    it('should organize files by courseId when provided', async () => {
      // Mock admin session
      (getSessionFromRequest as any).mockResolvedValue({
        userId: 'admin-user-id',
        role: 'admin',
      });

      // Mock rate limit success
      (rateLimit as any).mockResolvedValue({ allowed: true });

      // Mock validation success
      (validateFile as any).mockResolvedValue({
        valid: true,
        detectedType: 'jpeg',
      });

      // Mock upload success
      (uploadFile as any).mockResolvedValue({
        url: 'http://localhost/uploads/courses/images/course-uuid/test.jpg',
        key: 'courses/images/course-uuid/test.jpg',
        size: 1024,
        contentType: 'image/jpeg',
      });

      const courseId = '550e8400-e29b-41d4-a716-446655440000';
      const file = createMockFile({
        name: 'test.jpg',
        type: 'image/jpeg',
        size: 1024,
      });

      const formData = createMockFormData(file);
      const request = createMockRequest({
        formData,
        url: `http://localhost/api/courses/upload?courseId=${courseId}`,
      });
      const context = createMockContext({ request });

      const response = await POST(context);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.courseId).toBe(courseId);

      // Check that uploadFile was called with correct folder
      expect(uploadFile).toHaveBeenCalledWith(
        expect.objectContaining({
          folder: `courses/images/${courseId}`,
        })
      );
    });
  });

  // ==================== Error Handling Tests ====================

  describe('Error Handling', () => {
    it('should handle storage errors gracefully', async () => {
      // Mock admin session
      (getSessionFromRequest as any).mockResolvedValue({
        userId: 'admin-user-id',
        role: 'admin',
      });

      // Mock rate limit success
      (rateLimit as any).mockResolvedValue({ allowed: true });

      // Mock validation success
      (validateFile as any).mockResolvedValue({
        valid: true,
        detectedType: 'jpeg',
      });

      // Mock upload failure
      (uploadFile as any).mockRejectedValue(new Error('Storage service unavailable'));

      const file = createMockFile({
        name: 'test.jpg',
        type: 'image/jpeg',
        size: 1024,
      });

      const formData = createMockFormData(file);
      const request = createMockRequest({ formData });
      const context = createMockContext({ request });

      const response = await POST(context);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to upload file');
      expect(data.code).toBe('UPLOAD_ERROR');
    });
  });
});
