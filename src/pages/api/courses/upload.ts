/**
 * T070: Course File Upload API Endpoint
 * POST /api/courses/upload
 *
 * Handles uploads for course images and materials with:
 * - Session-based authentication (admin or instructor only)
 * - File type validation (images, videos, documents)
 * - Magic byte validation for security
 * - Rate limiting
 * - Organized storage by file type
 *
 * Supported file types:
 * - Images: JPEG, PNG, WebP, GIF (for course images/thumbnails)
 * - Videos: MP4, MOV (for preview videos)
 * - Documents: PDF, ZIP, EPUB (for course materials)
 * - Audio: MP3, WAV (for audio courses)
 */

import type { APIRoute } from 'astro';
import { uploadFile, type UploadResult } from '@/lib/storage';
import { validateFile } from '@/lib/fileValidation';
import { rateLimit, RateLimitProfiles } from '@/lib/ratelimit';
import { getSessionFromRequest } from '@/lib/auth/session';
import { z } from 'zod';

// ==================== Configuration ====================

const MAX_IMAGE_SIZE_MB = 10; // 10MB for images
const MAX_VIDEO_SIZE_MB = 100; // 100MB for videos
const MAX_DOCUMENT_SIZE_MB = 50; // 50MB for documents

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime'];
const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'application/zip', 'application/epub+zip'];
const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/wav'];

const ALL_ALLOWED_TYPES = [
  ...ALLOWED_IMAGE_TYPES,
  ...ALLOWED_VIDEO_TYPES,
  ...ALLOWED_DOCUMENT_TYPES,
  ...ALLOWED_AUDIO_TYPES,
];

// ==================== Validation Schema ====================

const UploadQuerySchema = z.object({
  folder: z.string().optional(),
  courseId: z.string().uuid().optional(),
});

// ==================== Helper Functions ====================

/**
 * Check if user has permission to upload course files
 * (must be admin or instructor)
 */
function hasUploadPermission(session: any): boolean {
  return session?.role === 'admin' || session?.role === 'instructor';
}

/**
 * Determine file category from MIME type
 */
function getFileCategory(mimeType: string): string {
  if (ALLOWED_IMAGE_TYPES.includes(mimeType)) return 'images';
  if (ALLOWED_VIDEO_TYPES.includes(mimeType)) return 'videos';
  if (ALLOWED_DOCUMENT_TYPES.includes(mimeType)) return 'documents';
  if (ALLOWED_AUDIO_TYPES.includes(mimeType)) return 'audio';
  return 'other';
}

/**
 * Get max file size based on file type
 */
function getMaxFileSizeMB(mimeType: string): number {
  if (ALLOWED_IMAGE_TYPES.includes(mimeType)) return MAX_IMAGE_SIZE_MB;
  if (ALLOWED_VIDEO_TYPES.includes(mimeType)) return MAX_VIDEO_SIZE_MB;
  if (ALLOWED_DOCUMENT_TYPES.includes(mimeType)) return MAX_DOCUMENT_SIZE_MB;
  if (ALLOWED_AUDIO_TYPES.includes(mimeType)) return MAX_DOCUMENT_SIZE_MB;
  return 10; // Default
}

/**
 * Build folder path for course files
 */
function buildFolderPath(category: string, courseId?: string): string {
  const base = `courses/${category}`;
  return courseId ? `${base}/${courseId}` : base;
}

// ==================== POST Handler ====================

/**
 * POST /api/courses/upload
 * Upload course images, videos, or materials
 */
export const POST: APIRoute = async (context) => {
  const { request } = context;

  try {
    // Check authentication
    const session = await getSessionFromRequest(context.cookies);

    if (!session || !session.userId) {
      console.warn('[COURSE-UPLOAD] Unauthenticated upload attempt:', {
        ip: context.clientAddress,
      });

      return new Response(
        JSON.stringify({
          success: false,
          error: 'Authentication required',
          code: 'AUTHENTICATION_REQUIRED',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Check authorization (admin or instructor only)
    if (!hasUploadPermission(session)) {
      console.warn('[COURSE-UPLOAD] Unauthorized upload attempt:', {
        userId: session.userId,
        role: session.role,
      });

      return new Response(
        JSON.stringify({
          success: false,
          error: 'Insufficient permissions. Admin or instructor role required.',
          code: 'INSUFFICIENT_PERMISSIONS',
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Rate limiting: Use UPLOAD profile (10 uploads per 10 minutes)
    const rateLimitResult = await rateLimit(context, RateLimitProfiles.UPLOAD);
    if (!rateLimitResult.allowed) {
      const retryAfter = rateLimitResult.resetAt - Math.floor(Date.now() / 1000);
      console.warn('[COURSE-UPLOAD] Rate limit exceeded:', {
        userId: session.userId,
        ip: context.clientAddress,
        resetAt: new Date(rateLimitResult.resetAt * 1000).toISOString(),
      });

      return new Response(
        JSON.stringify({
          success: false,
          error: 'Too many upload attempts. Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED',
          resetAt: rateLimitResult.resetAt,
          retryAfter: retryAfter,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(retryAfter > 0 ? retryAfter : 1),
          },
        }
      );
    }

    // Validate Content-Type
    const contentType = request.headers.get('Content-Type');
    if (!contentType || !contentType.includes('multipart/form-data')) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Content-Type must be multipart/form-data',
          code: 'INVALID_CONTENT_TYPE',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No file provided',
          code: 'MISSING_FILE',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate query parameters
    const url = new URL(request.url);
    const queryParams = {
      folder: url.searchParams.get('folder') || undefined,
      courseId: url.searchParams.get('courseId') || undefined,
    };

    const validatedQuery = UploadQuerySchema.safeParse(queryParams);
    if (!validatedQuery.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid query parameters',
          details: validatedQuery.error.errors,
          code: 'INVALID_QUERY_PARAMS',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate file type
    if (!ALL_ALLOWED_TYPES.includes(file.type)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid file type',
          message: 'Allowed types: images (JPEG, PNG, WebP, GIF), videos (MP4, MOV), documents (PDF, ZIP, EPUB), audio (MP3, WAV)',
          received: file.type,
          code: 'INVALID_FILE_TYPE',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate file size
    const maxSize = getMaxFileSizeMB(file.type);
    const maxSizeBytes = maxSize * 1024 * 1024;

    if (file.size > maxSizeBytes) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'File too large',
          message: `Maximum file size for ${getFileCategory(file.type)} is ${maxSize}MB`,
          received: `${(file.size / (1024 * 1024)).toFixed(2)}MB`,
          maxAllowed: `${maxSize}MB`,
          code: 'FILE_TOO_LARGE',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Convert File to ArrayBuffer for validation
    const arrayBuffer = await file.arrayBuffer();

    // Validate magic bytes (file signature)
    const validation = await validateFile({
      buffer: arrayBuffer,
      mimeType: file.type,
      name: file.name,
    });

    if (!validation.valid) {
      console.warn('[COURSE-UPLOAD] File validation failed:', {
        userId: session.userId,
        filename: file.name,
        claimedType: file.type,
        detectedType: validation.detectedType,
        errors: validation.errors,
      });

      return new Response(
        JSON.stringify({
          success: false,
          error: 'File validation failed',
          message: 'The file content does not match the claimed file type',
          details: validation.errors,
          detectedType: validation.detectedType,
          code: 'FILE_VALIDATION_FAILED',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('[COURSE-UPLOAD] File validation passed:', {
      userId: session.userId,
      filename: file.name,
      type: file.type,
      detectedType: validation.detectedType,
      size: `${(file.size / (1024 * 1024)).toFixed(2)}MB`,
    });

    // Determine storage folder
    const category = getFileCategory(file.type);
    const { courseId } = validatedQuery.data;
    const folder = buildFolderPath(category, courseId);

    // Upload file to storage
    const buffer = Buffer.from(arrayBuffer);
    const result: UploadResult = await uploadFile({
      file: {
        buffer,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
      },
      contentType: file.type,
      folder,
      maxSizeMB: maxSize,
    });

    console.log('[COURSE-UPLOAD] Upload successful:', {
      userId: session.userId,
      filename: file.name,
      url: result.url,
      key: result.key,
      size: `${(result.size / (1024 * 1024)).toFixed(2)}MB`,
      category,
      courseId: courseId || 'none',
    });

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          url: result.url,
          key: result.key,
          filename: file.name,
          size: result.size,
          sizeFormatted: `${(result.size / (1024 * 1024)).toFixed(2)}MB`,
          type: result.contentType,
          category,
          courseId: courseId || null,
        },
        message: 'File uploaded successfully',
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[COURSE-UPLOAD] Upload error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Upload failed';
    const isValidationError = errorMessage.toLowerCase().includes('validation');

    return new Response(
      JSON.stringify({
        success: false,
        error: isValidationError ? 'Validation error' : 'Failed to upload file',
        message: errorMessage,
        code: isValidationError ? 'VALIDATION_ERROR' : 'UPLOAD_ERROR',
      }),
      {
        status: isValidationError ? 400 : 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
