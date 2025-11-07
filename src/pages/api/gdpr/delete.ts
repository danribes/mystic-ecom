/**
 * T148: GDPR Account Deletion API Endpoint
 *
 * Implements GDPR Article 17 (Right to Erasure - "Right to be Forgotten")
 *
 * POST /api/gdpr/delete
 * - Deletes or anonymizes user account and related data
 * - Requires authentication
 * - User can only delete their own account
 * - Financial records (orders, bookings) are anonymized, not deleted (legal requirement)
 */

import type { APIRoute } from 'astro';
import { getSessionFromRequest, logout } from '@/lib/auth/session';
import { deleteUserData } from '@/lib/gdpr';
import { rateLimit, RateLimitProfiles } from '@/lib/ratelimit';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Rate limiting: 3 deletion requests per 24 hours per user
    const limitResult = await rateLimit(
      request,
      RateLimitProfiles.DATA_DELETION
    );

    if (limitResult.limited) {
      return new Response(
        JSON.stringify({
          error:
            'Rate limit exceeded. Too many account deletion requests. Please try again later.',
          retryAfter: limitResult.retryAfter,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': limitResult.retryAfter?.toString() || '86400',
          },
        }
      );
    }

    // Check authentication
    const session = await getSessionFromRequest(cookies);

    if (!session) {
      return new Response(
        JSON.stringify({
          error: 'Unauthorized. Please log in to delete your account.',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse request body for confirmation
    let body: any = {};
    try {
      const contentType = request.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        body = await request.json();
      }
    } catch {
      // Body is optional
    }

    // Check for confirmation (best practice: require explicit confirmation)
    const confirmed = body.confirmed === true;
    const confirmationText = body.confirmationText || '';

    if (!confirmed || confirmationText.toLowerCase() !== 'delete my account') {
      return new Response(
        JSON.stringify({
          error:
            'Account deletion requires explicit confirmation. Please set "confirmed": true and "confirmationText": "delete my account".',
          required: {
            confirmed: true,
            confirmationText: 'delete my account',
          },
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Delete user data
    // hardDelete = false (soft delete or anonymize depending on financial records)
    const deletionResult = await deleteUserData(session.userId, false);

    // Log out the user immediately
    await logout(cookies);

    // Return deletion result
    return new Response(JSON.stringify(deletionResult, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-GDPR-Deletion': 'true',
      },
    });
  } catch (error) {
    console.error('[GDPR Delete] Error:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to delete user account. Please try again later.',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

// Only POST method allowed
export const GET: APIRoute = async () => {
  return new Response(
    JSON.stringify({ error: 'Method not allowed. Use POST.' }),
    {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        Allow: 'POST',
      },
    }
  );
};
