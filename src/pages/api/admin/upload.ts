/**
 * Admin File Upload API Endpoint
 * POST /api/admin/upload
 *
 * Security:
 * - T199: Rate limited using ADMIN profile (200 req/min per user)
 * - T204: Admin authorization middleware
 * - T205: Magic byte validation for uploaded files
 */

import type { APIRoute } from 'astro';
import { uploadFile } from '../../../lib/storage';
import { rateLimit, RateLimitProfiles } from '@/lib/ratelimit';
import { withAdminAuth } from '@/lib/adminAuth';
import { validateFile } from '@/lib/fileValidation';

const handler: APIRoute = async (context) => {
  const { request } = context;

  // Admin authentication handled by withAdminAuth middleware

  // Rate limiting: Uses ADMIN profile (200 requests per minute per user)
  const rateLimitResult = await rateLimit(context, RateLimitProfiles.ADMIN);
  if (!rateLimitResult.allowed) {
    const retryAfter = rateLimitResult.resetAt - Math.floor(Date.now() / 1000);
    console.warn('[ADMIN-UPLOAD] Rate limit exceeded:', {
      ip: context.clientAddress,
      resetAt: new Date(rateLimitResult.resetAt * 1000).toISOString(),
    });

    return new Response(
      JSON.stringify({
        error: 'Too many requests. Please try again later.',
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

  try {
    // Parse multipart/form-data
    const contentType = request.headers.get('Content-Type');
    if (!contentType || !contentType.includes('multipart/form-data')) {
      return new Response(
        JSON.stringify({ error: 'Content-Type must be multipart/form-data' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get optional parameters
    const folder = formData.get('folder') as string | null;
    const maxSizeMBStr = formData.get('maxSizeMB') as string | null;
    const maxSizeMB = maxSizeMBStr ? parseFloat(maxSizeMBStr) : undefined;

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // T205: Validate file magic bytes (file signature)
    const validation = await validateFile({
      buffer: arrayBuffer,
      mimeType: file.type,
      name: file.name,
    });

    if (!validation.valid) {
      console.warn('[ADMIN-UPLOAD] File validation failed:', {
        filename: file.name,
        claimedType: file.type,
        detectedType: validation.detectedType,
        errors: validation.errors,
      });

      return new Response(
        JSON.stringify({
          error: 'File validation failed',
          message: 'The file content does not match the claimed file type',
          details: validation.errors,
          detectedType: validation.detectedType,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('[ADMIN-UPLOAD] File validation passed:', {
      filename: file.name,
      type: file.type,
      detectedType: validation.detectedType,
    });

    // Upload file
    const result = await uploadFile({
      file: {
        buffer,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
      },
      contentType: file.type,
      folder: folder || undefined,
      maxSizeMB,
    });

    return new Response(
      JSON.stringify(result),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Upload error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Upload failed';
    const status = errorMessage.includes('validation') ? 400 : 500;

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// Export handler wrapped with admin authorization middleware
export const POST = withAdminAuth(handler);
