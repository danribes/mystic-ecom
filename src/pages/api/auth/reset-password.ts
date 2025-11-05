/**
 * POST /api/auth/reset-password
 *
 * Reset password using a valid reset token
 *
 * Flow:
 * 1. Validate token and new password
 * 2. Check rate limiting
 * 3. Verify token is valid and not expired
 * 4. Hash new password
 * 5. Update user's password
 * 6. Mark token as used
 * 7. Invalidate all other tokens for this user
 * 8. Return success
 *
 * Security: T203 - Password Reset Functionality
 * - Rate limited to 5 requests per 15 minutes (T199)
 * - CSRF protected (T201)
 * - Tokens are one-time use
 * - Tokens expire in 1 hour
 * - Strong password requirements enforced
 */

import type { APIRoute } from 'astro';
import {
  verifyResetToken,
  markTokenAsUsed,
  invalidateUserTokens,
} from '@/lib/passwordReset';
import { hashPassword } from '@/lib/auth';
import { getPool } from '@/lib/db';
import { rateLimit, RateLimitProfiles } from '@/lib/ratelimit';
import { validateCSRF } from '@/lib/csrf';

export const POST: APIRoute = async (context) => {
  const { request, cookies } = context;
  const pool = getPool();

  // T201: CSRF protection - validate token
  const csrfValid = await validateCSRF(context);
  if (!csrfValid) {
    console.warn('[RESET-PASSWORD] CSRF validation failed:', {
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

  // T199: Rate limiting - 5 requests per 15 minutes
  const rateLimitResult = await rateLimit(context, RateLimitProfiles.AUTH);
  if (!rateLimitResult.allowed) {
    const retryAfter = rateLimitResult.resetAt - Math.floor(Date.now() / 1000);
    console.warn('[RESET-PASSWORD] Rate limit exceeded:', {
      ip: context.clientAddress,
      resetAt: new Date(rateLimitResult.resetAt * 1000).toISOString(),
    });

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Too many password reset attempts. Please try again later.',
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
    const { token, password } = body;

    // Validate required fields
    if (!token || !password) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Token and password are required',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Password must be at least 8 characters long',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Additional password strength checks
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Verify reset token
    const tokenVerification = await verifyResetToken(token);

    if (!tokenVerification.valid) {
      console.warn('[RESET-PASSWORD] Invalid or expired token:', {
        ip: context.clientAddress,
        error: tokenVerification.error,
      });

      return new Response(
        JSON.stringify({
          success: false,
          error: tokenVerification.error || 'Invalid or expired reset token',
          code: 'INVALID_TOKEN',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const userId = tokenVerification.userId!;

    // Hash new password
    const passwordHash = await hashPassword(password);

    // Update user's password and mark token as used in a transaction
    try {
      await pool.query('BEGIN');

      // Update password
      await pool.query(
        'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
        [passwordHash, userId]
      );

      // Mark this token as used
      await markTokenAsUsed(token);

      // Invalidate all other tokens for this user (security measure)
      await invalidateUserTokens(userId);

      await pool.query('COMMIT');

      console.log('[RESET-PASSWORD] Password reset successful:', {
        userId,
        ip: context.clientAddress,
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Password has been reset successfully. You can now log in with your new password.',
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (dbError) {
      await pool.query('ROLLBACK');
      throw dbError;
    }
  } catch (error) {
    console.error('Error resetting password:', error);

    // Handle specific error types
    if (error instanceof Error) {
      // Database errors
      if (error.message.includes('users') || error.message.includes('password_reset_tokens')) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Failed to reset password. Please try again or request a new reset link.',
          }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Generic server error
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to reset password',
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
