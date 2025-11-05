/**
 * Secure Cookie Configuration (T210)
 *
 * Centralized cookie security configuration that doesn't rely solely on NODE_ENV.
 * Implements defense-in-depth approach to cookie security.
 *
 * Security considerations:
 * - Always secure in production (via explicit checks)
 * - HttpOnly to prevent XSS attacks
 * - SameSite to prevent CSRF attacks
 * - Proper domain and path restrictions
 */

import type { AstroCookieSetOptions } from 'astro';

/**
 * Environment detection (multiple checks for safety)
 */
export function isProduction(): boolean {
  // Check multiple indicators, not just NODE_ENV
  return (
    process.env.NODE_ENV === 'production' ||
    process.env.VERCEL_ENV === 'production' ||
    process.env.NETLIFY === 'true' ||
    process.env.CF_PAGES === '1' ||
    // Check if we're on a production domain
    (typeof window !== 'undefined' &&
      (window.location.hostname.includes('production') ||
        !window.location.hostname.includes('localhost')))
  );
}

/**
 * Check if connection is secure (HTTPS)
 */
function isSecureConnection(): boolean {
  if (typeof window !== 'undefined') {
    return window.location.protocol === 'https:';
  }

  // Server-side: check headers or assume secure in production
  return isProduction();
}

/**
 * Cookie security level
 */
export type CookieSecurityLevel = 'standard' | 'admin';

/**
 * Get secure cookie configuration
 *
 * @param level - Security level ('standard' for regular cookies, 'admin' for admin operations)
 * @returns Secure cookie options
 */
export function getSecureCookieOptions(
  level: CookieSecurityLevel = 'standard'
): Partial<AstroCookieSetOptions> {
  const isProd = isProduction();
  const isSecure = isSecureConnection();

  // Base security settings
  const options: Partial<AstroCookieSetOptions> = {
    // Always httpOnly to prevent XSS
    httpOnly: true,

    // Secure flag: always true in production, or if on HTTPS
    // Defense-in-depth: even if NODE_ENV is wrong, we check other factors
    secure: isProd || isSecure,

    // Path restriction
    path: '/',

    // SameSite protection
    // 'strict' for admin operations (maximum protection)
    // 'lax' for standard operations (allows top-level navigation)
    sameSite: level === 'admin' ? 'strict' : 'lax',
  };

  // Production-specific settings
  if (isProd) {
    // Force secure flag in production
    options.secure = true;

    // Optional: Set domain for subdomain sharing
    // Uncomment and configure if needed:
    // options.domain = process.env.COOKIE_DOMAIN;
  }

  return options;
}

/**
 * Get session cookie options
 *
 * @param maxAge - Maximum age in seconds
 * @param isAdminSession - Whether this is an admin session
 * @returns Complete cookie options for sessions
 */
export function getSessionCookieOptions(
  maxAge: number,
  isAdminSession: boolean = false
): AstroCookieSetOptions {
  const level: CookieSecurityLevel = isAdminSession ? 'admin' : 'standard';

  return {
    ...getSecureCookieOptions(level),
    maxAge,
  } as AstroCookieSetOptions;
}

/**
 * Get CSRF token cookie options
 *
 * @returns Cookie options for CSRF tokens
 */
export function getCSRFCookieOptions(): AstroCookieSetOptions {
  return {
    ...getSecureCookieOptions('standard'),
    // CSRF tokens need to be readable by JavaScript
    httpOnly: false,
    maxAge: 60 * 60, // 1 hour
  } as AstroCookieSetOptions;
}

/**
 * Get temporary cookie options (like cart for guests)
 *
 * @param maxAge - Maximum age in seconds
 * @returns Cookie options for temporary cookies
 */
export function getTemporaryCookieOptions(
  maxAge: number = 60 * 60 * 24 * 7 // 7 days default
): AstroCookieSetOptions {
  return {
    ...getSecureCookieOptions('standard'),
    maxAge,
  } as AstroCookieSetOptions;
}

/**
 * Validate cookie security in production
 * Throws error if insecure cookies are attempted in production
 */
export function validateCookieSecurity(
  options: Partial<AstroCookieSetOptions>
): void {
  if (!isProduction()) {
    return; // Skip validation in development
  }

  // In production, enforce security requirements
  if (!options.httpOnly) {
    console.warn(
      '[COOKIE SECURITY] Warning: Cookie without httpOnly flag in production'
    );
  }

  // Check SameSite=none specific case first (more specific error)
  if (options.sameSite === 'none' && !options.secure) {
    throw new Error(
      '[COOKIE SECURITY] CRITICAL: SameSite=None requires Secure flag'
    );
  }

  if (!options.secure) {
    throw new Error(
      '[COOKIE SECURITY] CRITICAL: Attempting to set insecure cookie in production! This is a security violation.'
    );
  }
}

/**
 * Security configuration summary
 * Useful for debugging and monitoring
 */
export function getCookieSecurityInfo() {
  const isProd = isProduction();

  return {
    environment: process.env.NODE_ENV,
    isProduction: isProd,
    isSecureConnection: isSecureConnection(),
    standardCookieConfig: getSecureCookieOptions('standard'),
    adminCookieConfig: getSecureCookieOptions('admin'),
    securityEnforced: isProd,
  };
}

/**
 * Export for convenience
 */
export default {
  getSecureCookieOptions,
  getSessionCookieOptions,
  getCSRFCookieOptions,
  getTemporaryCookieOptions,
  validateCookieSecurity,
  getCookieSecurityInfo,
  isProduction,
};
