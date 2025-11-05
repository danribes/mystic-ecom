/**
 * POST /api/auth/forgot-password
 *
 * Request a password reset email
 *
 * Flow:
 * 1. Validate email format
 * 2. Check rate limiting (3 requests per hour per IP)
 * 3. Generate reset token
 * 4. Send reset email
 * 5. Return success (even if email doesn't exist, to prevent enumeration)
 *
 * Security: T203 - Password Reset Functionality
 * - Rate limited to 3 requests per hour (T199)
 * - CSRF protected (T201)
 * - Prevents email enumeration (always returns success)
 * - Tokens expire in 1 hour
 * - One-time use tokens
 */

import type { APIRoute } from 'astro';
import { createPasswordResetToken, hasRecentResetRequest } from '@/lib/passwordReset';
import { rateLimit, RateLimitProfiles } from '@/lib/ratelimit';
import { validateCSRF } from '@/lib/csrf';
import { sendPasswordResetEmail } from '@/lib/email';

export const POST: APIRoute = async (context) => {
  const { request, cookies } = context;

  // T201: CSRF protection - validate token
  const csrfValid = await validateCSRF(context);
  if (!csrfValid) {
    console.warn('[FORGOT-PASSWORD] CSRF validation failed:', {
      ip: context.clientAddress,
    });

    return new Response(
      JSON.stringify({
        success: false,
        error: 'CSRF validation failed',
        code: 'CSRF_TOKEN_INVALID',
      }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // T199: Rate limiting - 3 requests per hour (prevents abuse)
  const rateLimitResult = await rateLimit(context, RateLimitProfiles.PASSWORD_RESET);
  if (!rateLimitResult.allowed) {
    const retryAfter = rateLimitResult.resetAt - Math.floor(Date.now() / 1000);
    console.warn('[FORGOT-PASSWORD] Rate limit exceeded:', {
      ip: context.clientAddress,
      resetAt: new Date(rateLimitResult.resetAt * 1000).toISOString(),
    });

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Too many password reset requests. Please try again later.',
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
    // Parse request body
    const body = await request.json();
    const { email } = body;

    // Validate email presence
    if (!email) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Email is required',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid email format',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if user has recent reset request (additional rate limiting)
    const hasRecent = await hasRecentResetRequest(email, 5); // 5 minutes
    if (hasRecent) {
      console.warn('[FORGOT-PASSWORD] User has recent reset request:', {
        email,
        ip: context.clientAddress,
      });

      // Still return success to prevent enumeration
      // but don't actually send another email
      return new Response(
        JSON.stringify({
          success: true,
          message: 'If an account exists with this email, a password reset link has been sent.',
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Create reset token
    const resetData = await createPasswordResetToken(email);

    // If user exists, send reset email
    if (resetData) {
      const { token, expiresAt } = resetData;

      // Generate reset URL
      const frontendUrl = process.env.BASE_URL || 'http://localhost:4321';
      const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

      // Send reset email
      try {
        await sendPasswordResetEmail(email, resetUrl, expiresAt);

        console.log('[FORGOT-PASSWORD] Reset email sent successfully:', {
          email,
          expiresAt: expiresAt.toISOString(),
        });
      } catch (emailError) {
        console.error('[FORGOT-PASSWORD] Failed to send reset email:', emailError);

        // Log error but don't reveal to user
        // (prevents information disclosure)
      }
    } else {
      // User doesn't exist
      console.log('[FORGOT-PASSWORD] Reset requested for non-existent user:', {
        email,
        ip: context.clientAddress,
      });
    }

    // Always return success to prevent email enumeration
    // (attackers can't tell if email exists or not)
    return new Response(
      JSON.stringify({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error processing password reset request:', error);

    // Generic error response (don't reveal details)
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to process password reset request',
        details: process.env.NODE_ENV === 'development'
          ? (error instanceof Error ? error.message : String(error))
          : undefined,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
