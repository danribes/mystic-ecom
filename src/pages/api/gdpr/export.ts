/**
 * T148: GDPR Data Export API Endpoint
 *
 * Implements GDPR Article 15 (Right of Access) and Article 20 (Data Portability)
 *
 * POST /api/gdpr/export
 * - Exports all user data in machine-readable JSON format
 * - Requires authentication
 * - User can only export their own data
 */

import type { APIRoute } from 'astro';
import { getSessionFromRequest } from '@/lib/auth/session';
import { exportUserData } from '@/lib/gdpr';
import { rateLimit, RateLimitProfiles } from '@/lib/ratelimit';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Rate limiting: 5 exports per hour per IP
    const limitResult = await rateLimit(
      request,
      RateLimitProfiles.DATA_EXPORT
    );

    if (limitResult.limited) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded. Too many data export requests.',
          retryAfter: limitResult.retryAfter,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': limitResult.retryAfter?.toString() || '3600',
          },
        }
      );
    }

    // Check authentication
    const session = await getSessionFromRequest(cookies);

    if (!session) {
      return new Response(
        JSON.stringify({
          error: 'Unauthorized. Please log in to export your data.',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Export user data
    const userData = await exportUserData(session.userId);

    // Return data export
    return new Response(JSON.stringify(userData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="user-data-export-${session.userId}-${Date.now()}.json"`,
        'X-GDPR-Export': 'true',
      },
    });
  } catch (error) {
    console.error('[GDPR Export] Error:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to export user data. Please try again later.',
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
