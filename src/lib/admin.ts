/**
 * Admin Verification Utility
 *
 * Provides verifyAdmin function for admin API routes.
 * This is a wrapper around the adminAuth module for backwards compatibility.
 */

import type { AstroCookies } from 'astro';
import { getSessionFromRequest } from '@/lib/auth/session';

export interface AdminVerificationResult {
  isValid: boolean;
  user?: any;
  error?: string;
}

/**
 * Verify admin authentication
 *
 * @param request - The incoming request
 * @param cookies - Astro cookies object
 * @returns AdminVerificationResult with user info if valid
 */
export async function verifyAdmin(
  request: Request,
  cookies: AstroCookies
): Promise<AdminVerificationResult> {
  try {
    // Get session from cookies
    const session = await getSessionFromRequest(cookies);

    // Check if user is authenticated
    if (!session) {
      return {
        isValid: false,
        error: 'Authentication required',
      };
    }

    // Check if user has admin role
    if (session.role !== 'admin') {
      return {
        isValid: false,
        error: 'Admin privileges required',
      };
    }

    // User is authenticated and has admin role
    return {
      isValid: true,
      user: {
        id: session.userId,
        email: session.email,
        role: session.role,
      },
    };
  } catch (error) {
    console.error('[Admin Verification] Error:', error);
    return {
      isValid: false,
      error: 'Failed to verify admin authorization',
    };
  }
}
