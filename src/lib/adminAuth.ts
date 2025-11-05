/**
 * Admin Authorization Middleware
 *
 * Centralizes admin authentication and authorization checks across all admin endpoints.
 * Provides consistent error handling and logging for unauthorized access attempts.
 *
 * Security Task: T204
 */

import type { APIContext, APIRoute } from 'astro';
import { getSessionFromRequest } from '@/lib/auth/session';

/**
 * Check if user has admin privileges
 *
 * @param context - Astro API context
 * @returns {Promise<{ isAdmin: boolean; session?: any; error?: string; statusCode?: number }>}
 */
export async function checkAdminAuth(context: APIContext): Promise<{
  isAdmin: boolean;
  session?: any;
  error?: string;
  statusCode?: number;
}> {
  try {
    // Get session from cookies
    const session = await getSessionFromRequest(context.cookies);

    // Check if user is authenticated
    if (!session) {
      console.warn('[ADMIN-AUTH] Unauthenticated access attempt:', {
        ip: context.clientAddress,
        url: context.request.url,
        method: context.request.method,
      });

      return {
        isAdmin: false,
        error: 'Authentication required. Please log in to access this resource.',
        statusCode: 401,
      };
    }

    // Check if user has admin role
    if (session.role !== 'admin') {
      console.warn('[ADMIN-AUTH] Unauthorized admin access attempt:', {
        userId: session.userId,
        userRole: session.role,
        ip: context.clientAddress,
        url: context.request.url,
        method: context.request.method,
      });

      return {
        isAdmin: false,
        session,
        error: 'Admin privileges required. You do not have permission to access this resource.',
        statusCode: 403,
      };
    }

    // User is authenticated and has admin role
    console.log('[ADMIN-AUTH] Admin access granted:', {
      userId: session.userId,
      url: context.request.url,
      method: context.request.method,
    });

    return {
      isAdmin: true,
      session,
    };
  } catch (error) {
    console.error('[ADMIN-AUTH] Error checking admin authorization:', error);

    return {
      isAdmin: false,
      error: 'Failed to verify authorization',
      statusCode: 500,
    };
  }
}

/**
 * Middleware function that wraps admin API routes
 *
 * Automatically checks admin authorization before executing the handler.
 * Returns appropriate error responses for unauthorized access.
 *
 * @param handler - The admin API route handler to wrap
 * @returns {APIRoute} - Wrapped API route with admin authorization
 *
 * @example
 * ```typescript
 * import { withAdminAuth } from '@/lib/adminAuth';
 *
 * const handler: APIRoute = async (context) => {
 *   // This code only runs if user is authenticated as admin
 *   const { session } = context.locals; // Session attached by middleware
 *
 *   // Your admin logic here...
 *   return new Response(JSON.stringify({ success: true }));
 * };
 *
 * export const GET = withAdminAuth(handler);
 * export const POST = withAdminAuth(handler);
 * ```
 */
export function withAdminAuth(
  handler: (context: APIContext) => Promise<Response> | Response
): APIRoute {
  return async (context: APIContext): Promise<Response> => {
    // Check admin authorization
    const authResult = await checkAdminAuth(context);

    // If not admin, return error response
    if (!authResult.isAdmin) {
      return new Response(
        JSON.stringify({
          success: false,
          error: authResult.error || 'Unauthorized',
          code: authResult.statusCode === 401 ? 'AUTHENTICATION_REQUIRED' : 'ADMIN_ACCESS_REQUIRED',
        }),
        {
          status: authResult.statusCode || 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Attach session to context.locals for handler access
    context.locals = context.locals || {};
    context.locals.session = authResult.session;
    context.locals.isAdmin = true;

    // Execute the handler
    try {
      return await handler(context);
    } catch (error) {
      console.error('[ADMIN-AUTH] Error in admin handler:', error);

      return new Response(
        JSON.stringify({
          success: false,
          error: 'Internal server error',
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
}

/**
 * Alternative function that returns session on success
 *
 * Use this when you need more control over the response or want to manually handle errors.
 *
 * @param context - Astro API context
 * @returns {Promise<any>} - Session object if authorized
 * @throws {Response} - Error response if not authorized
 *
 * @example
 * ```typescript
 * export const GET: APIRoute = async (context) => {
 *   const session = await requireAdminAuth(context);
 *
 *   // If we get here, user is authenticated as admin
 *   // Your admin logic here...
 * };
 * ```
 */
export async function requireAdminAuth(context: APIContext): Promise<any> {
  const authResult = await checkAdminAuth(context);

  if (!authResult.isAdmin) {
    throw new Response(
      JSON.stringify({
        success: false,
        error: authResult.error || 'Unauthorized',
        code: authResult.statusCode === 401 ? 'AUTHENTICATION_REQUIRED' : 'ADMIN_ACCESS_REQUIRED',
      }),
      {
        status: authResult.statusCode || 403,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  return authResult.session;
}

/**
 * Check if user is admin without throwing errors
 *
 * Useful for conditional admin features in pages (not just API routes).
 *
 * @param context - Astro context
 * @returns {Promise<boolean>} - True if user is admin
 *
 * @example
 * ```astro
 * ---
 * import { isAdmin } from '@/lib/adminAuth';
 *
 * const userIsAdmin = await isAdmin(Astro);
 * ---
 *
 * {userIsAdmin && (
 *   <div>Admin-only content</div>
 * )}
 * ```
 */
export async function isAdmin(context: APIContext): Promise<boolean> {
  const authResult = await checkAdminAuth(context);
  return authResult.isAdmin;
}
