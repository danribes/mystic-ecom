/**
 * T210: Session Cookie Security Configuration - Unit Tests
 *
 * Tests for secure cookie configuration including:
 * - Cookie security options generation
 * - Production environment detection
 * - Admin vs standard session security
 * - Security validation
 * - CSRF cookie configuration
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getSecureCookieOptions,
  getSessionCookieOptions,
  getCSRFCookieOptions,
  getTemporaryCookieOptions,
  validateCookieSecurity,
  getCookieSecurityInfo,
  isProduction,
  type CookieSecurityLevel,
} from '../../src/lib/cookieConfig';

describe('T210: Cookie Security Configuration', () => {
  // Store original env
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Reset environment before each test
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe('Production Environment Detection', () => {
    it('should detect production from NODE_ENV', () => {
      process.env.NODE_ENV = 'production';
      expect(isProduction()).toBe(true);
    });

    it('should detect production from VERCEL_ENV', () => {
      process.env.NODE_ENV = 'development';
      process.env.VERCEL_ENV = 'production';
      expect(isProduction()).toBe(true);
    });

    it('should detect production from NETLIFY', () => {
      process.env.NODE_ENV = 'development';
      process.env.NETLIFY = 'true';
      expect(isProduction()).toBe(true);
    });

    it('should detect production from CF_PAGES', () => {
      process.env.NODE_ENV = 'development';
      process.env.CF_PAGES = '1';
      expect(isProduction()).toBe(true);
    });

    it('should not detect production in development', () => {
      process.env.NODE_ENV = 'development';
      delete process.env.VERCEL_ENV;
      delete process.env.NETLIFY;
      delete process.env.CF_PAGES;
      expect(isProduction()).toBe(false);
    });

    it('should not detect production in test environment', () => {
      process.env.NODE_ENV = 'test';
      expect(isProduction()).toBe(false);
    });
  });

  describe('getSecureCookieOptions', () => {
    describe('in development', () => {
      beforeEach(() => {
        process.env.NODE_ENV = 'development';
      });

      it('should return standard security options', () => {
        const options = getSecureCookieOptions('standard');

        expect(options.httpOnly).toBe(true);
        expect(options.path).toBe('/');
        expect(options.sameSite).toBe('lax');
        // In development, secure may be false
      });

      it('should use strict SameSite for admin cookies', () => {
        const options = getSecureCookieOptions('admin');

        expect(options.httpOnly).toBe(true);
        expect(options.sameSite).toBe('strict');
      });
    });

    describe('in production', () => {
      beforeEach(() => {
        process.env.NODE_ENV = 'production';
      });

      it('should force secure flag in production', () => {
        const options = getSecureCookieOptions('standard');

        expect(options.secure).toBe(true);
        expect(options.httpOnly).toBe(true);
        expect(options.path).toBe('/');
      });

      it('should use strict SameSite for admin cookies', () => {
        const options = getSecureCookieOptions('admin');

        expect(options.secure).toBe(true);
        expect(options.httpOnly).toBe(true);
        expect(options.sameSite).toBe('strict');
      });

      it('should use lax SameSite for standard cookies', () => {
        const options = getSecureCookieOptions('standard');

        expect(options.sameSite).toBe('lax');
      });
    });
  });

  describe('getSessionCookieOptions', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });

    it('should include maxAge for session cookies', () => {
      const maxAge = 3600; // 1 hour
      const options = getSessionCookieOptions(maxAge, false);

      expect(options.maxAge).toBe(maxAge);
      expect(options.httpOnly).toBe(true);
      expect(options.secure).toBe(true);
    });

    it('should use standard security for non-admin sessions', () => {
      const options = getSessionCookieOptions(3600, false);

      expect(options.sameSite).toBe('lax');
    });

    it('should use strict security for admin sessions', () => {
      const options = getSessionCookieOptions(3600, true);

      expect(options.sameSite).toBe('strict');
      expect(options.httpOnly).toBe(true);
      expect(options.secure).toBe(true);
    });

    it('should handle different maxAge values', () => {
      const oneDay = 86400;
      const options = getSessionCookieOptions(oneDay, false);

      expect(options.maxAge).toBe(oneDay);
    });
  });

  describe('getCSRFCookieOptions', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });

    it('should return CSRF-specific options', () => {
      const options = getCSRFCookieOptions();

      // CSRF tokens need to be readable by JavaScript
      expect(options.httpOnly).toBe(false);
      expect(options.secure).toBe(true);
      expect(options.maxAge).toBe(3600); // 1 hour
    });

    it('should include secure flag in production', () => {
      const options = getCSRFCookieOptions();

      expect(options.secure).toBe(true);
    });
  });

  describe('getTemporaryCookieOptions', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });

    it('should use default maxAge of 7 days', () => {
      const options = getTemporaryCookieOptions();

      expect(options.maxAge).toBe(60 * 60 * 24 * 7); // 7 days
    });

    it('should accept custom maxAge', () => {
      const customMaxAge = 1800; // 30 minutes
      const options = getTemporaryCookieOptions(customMaxAge);

      expect(options.maxAge).toBe(customMaxAge);
    });

    it('should include security flags', () => {
      const options = getTemporaryCookieOptions();

      expect(options.httpOnly).toBe(true);
      expect(options.secure).toBe(true);
    });
  });

  describe('validateCookieSecurity', () => {
    describe('in production', () => {
      beforeEach(() => {
        process.env.NODE_ENV = 'production';
      });

      it('should throw error if secure flag is false', () => {
        const options = {
          httpOnly: true,
          secure: false,
          sameSite: 'lax' as const,
        };

        expect(() => validateCookieSecurity(options)).toThrow(
          'CRITICAL: Attempting to set insecure cookie in production'
        );
      });

      it('should not throw if secure flag is true', () => {
        const options = {
          httpOnly: true,
          secure: true,
          sameSite: 'lax' as const,
        };

        expect(() => validateCookieSecurity(options)).not.toThrow();
      });

      it('should throw error for SameSite=none without secure', () => {
        const options = {
          httpOnly: true,
          secure: false,
          sameSite: 'none' as const,
        };

        expect(() => validateCookieSecurity(options)).toThrow(
          'SameSite=None requires Secure flag'
        );
      });

      it('should warn if httpOnly is false', () => {
        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        const options = {
          httpOnly: false,
          secure: true,
          sameSite: 'lax' as const,
        };

        validateCookieSecurity(options);

        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Cookie without httpOnly flag')
        );
      });

      it('should allow secure cookies with SameSite=none', () => {
        const options = {
          httpOnly: true,
          secure: true,
          sameSite: 'none' as const,
        };

        expect(() => validateCookieSecurity(options)).not.toThrow();
      });
    });

    describe('in development', () => {
      beforeEach(() => {
        process.env.NODE_ENV = 'development';
      });

      it('should not throw for insecure cookies', () => {
        const options = {
          httpOnly: true,
          secure: false,
          sameSite: 'lax' as const,
        };

        expect(() => validateCookieSecurity(options)).not.toThrow();
      });

      it('should not validate in development', () => {
        const options = {
          httpOnly: false,
          secure: false,
          sameSite: 'none' as const,
        };

        expect(() => validateCookieSecurity(options)).not.toThrow();
      });
    });
  });

  describe('getCookieSecurityInfo', () => {
    it('should return security configuration summary', () => {
      process.env.NODE_ENV = 'production';

      const info = getCookieSecurityInfo();

      expect(info.environment).toBe('production');
      expect(info.isProduction).toBe(true);
      expect(info.securityEnforced).toBe(true);
      expect(info.standardCookieConfig).toBeDefined();
      expect(info.adminCookieConfig).toBeDefined();
    });

    it('should show different configs for admin vs standard', () => {
      process.env.NODE_ENV = 'production';

      const info = getCookieSecurityInfo();

      expect(info.standardCookieConfig.sameSite).toBe('lax');
      expect(info.adminCookieConfig.sameSite).toBe('strict');
    });

    it('should reflect development environment', () => {
      process.env.NODE_ENV = 'development';

      const info = getCookieSecurityInfo();

      expect(info.environment).toBe('development');
      expect(info.isProduction).toBe(false);
      expect(info.securityEnforced).toBe(false);
    });
  });

  describe('Security Level Differences', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });

    it('should have different SameSite for admin vs standard', () => {
      const standardOptions = getSecureCookieOptions('standard');
      const adminOptions = getSecureCookieOptions('admin');

      expect(standardOptions.sameSite).toBe('lax');
      expect(adminOptions.sameSite).toBe('strict');
    });

    it('should both have httpOnly=true', () => {
      const standardOptions = getSecureCookieOptions('standard');
      const adminOptions = getSecureCookieOptions('admin');

      expect(standardOptions.httpOnly).toBe(true);
      expect(adminOptions.httpOnly).toBe(true);
    });

    it('should both be secure in production', () => {
      const standardOptions = getSecureCookieOptions('standard');
      const adminOptions = getSecureCookieOptions('admin');

      expect(standardOptions.secure).toBe(true);
      expect(adminOptions.secure).toBe(true);
    });
  });

  describe('Defense in Depth', () => {
    it('should detect production even if NODE_ENV is wrong', () => {
      process.env.NODE_ENV = 'development';
      process.env.VERCEL_ENV = 'production';

      const options = getSecureCookieOptions('standard');

      // Should still be secure because of VERCEL_ENV
      expect(options.secure).toBe(true);
    });

    it('should check multiple environment variables', () => {
      // Even if NODE_ENV is not set
      delete process.env.NODE_ENV;
      process.env.NETLIFY = 'true';

      expect(isProduction()).toBe(true);
    });

    it('should prioritize security in ambiguous cases', () => {
      process.env.NODE_ENV = 'staging';
      process.env.VERCEL_ENV = 'production';

      const options = getSecureCookieOptions('standard');

      // Should be secure because one indicator says production
      expect(options.secure).toBe(true);
    });
  });

  describe('Cookie Types Integration', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });

    it('should configure session cookies correctly', () => {
      const adminSession = getSessionCookieOptions(86400, true);
      const userSession = getSessionCookieOptions(86400, false);

      // Admin sessions more strict
      expect(adminSession.sameSite).toBe('strict');
      expect(userSession.sameSite).toBe('lax');

      // Both secure in production
      expect(adminSession.secure).toBe(true);
      expect(userSession.secure).toBe(true);
    });

    it('should configure CSRF cookies for client-side access', () => {
      const csrfOptions = getCSRFCookieOptions();

      // CSRF needs to be read by JavaScript
      expect(csrfOptions.httpOnly).toBe(false);

      // But still secure
      expect(csrfOptions.secure).toBe(true);
    });

    it('should configure temporary cookies securely', () => {
      const tempOptions = getTemporaryCookieOptions(3600);

      expect(tempOptions.httpOnly).toBe(true);
      expect(tempOptions.secure).toBe(true);
      expect(tempOptions.maxAge).toBe(3600);
    });
  });
});
