/**
 * Admin Authentication Utilities
 * Helper functions for admin route protection
 */

import type { AstroCookies } from 'astro';
import { getSessionFromRequest } from '@/lib/auth/session';

export interface AdminAuthResult {
  isAuthenticated: boolean;
  isAdmin: boolean;
  user?: {
    name: string;
    email: string;
    role: string;
    userId: string;
  };
  redirectUrl?: string;
}

/**
 * Check if user has admin access
 * Returns auth result with redirect URL if needed
 */
export async function checkAdminAuth(cookies: AstroCookies, currentPath: string): Promise<AdminAuthResult> {
  // SECURITY: Development mode bypass - EXTREMELY RESTRICTED
  // Only works if ALL of these conditions are met:
  // 1. NODE_ENV is explicitly 'development'
  // 2. BYPASS_ADMIN_AUTH is explicitly 'true'
  // 3. Not running on localhost (prevents accidental cloud deployments)
  // 4. BASE_URL contains 'localhost' or '127.0.0.1'
  const isDev = process.env.NODE_ENV === 'development';
  const bypassEnabled = process.env.BYPASS_ADMIN_AUTH === 'true';
  const baseUrl = process.env.BASE_URL || '';
  const isLocalhost = baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1');

  if (isDev && bypassEnabled && isLocalhost) {
    console.warn('⚠️  SECURITY WARNING: Admin auth bypass is enabled! This should NEVER be used in production.');
    return {
      isAuthenticated: true,
      isAdmin: true,
      user: {
        name: 'Test Admin (BYPASS MODE)',
        email: 'admin@test.com',
        role: 'admin',
        userId: 'test-admin-id',
      }
    };
  }

  // If bypass was attempted but conditions not met, log warning
  if (bypassEnabled && !isLocalhost) {
    console.error('🚨 SECURITY ALERT: Admin auth bypass attempted on non-localhost URL! Denying access.');
  }

  try {
    const session = await getSessionFromRequest(cookies);
    
    if (!session) {
      return {
        isAuthenticated: false,
        isAdmin: false,
        redirectUrl: `/login?redirect=${encodeURIComponent(currentPath)}`
      };
    }

    if (session.role !== 'admin') {
      return {
        isAuthenticated: true,
        isAdmin: false,
        redirectUrl: '/unauthorized'
      };
    }

    return {
      isAuthenticated: true,
      isAdmin: true,
      user: {
        name: session.name,
        email: session.email,
        role: session.role,
        userId: session.userId,
      }
    };
  } catch (error) {
    // If session check fails (e.g., Redis connection issue), redirect to login
    console.error('Admin auth check failed:', error);
    return {
      isAuthenticated: false,
      isAdmin: false,
      redirectUrl: `/login?redirect=${encodeURIComponent(currentPath)}`
    };
  }
}

/**
 * Require admin authentication - throws redirect if not authorized
 */
export async function requireAdmin(cookies: AstroCookies, currentPath: string) {
  const authResult = await checkAdminAuth(cookies, currentPath);
  
  if (authResult.redirectUrl) {
    throw new Response(null, {
      status: 302,
      headers: {
        Location: authResult.redirectUrl
      }
    });
  }
  
  return authResult.user!;
}