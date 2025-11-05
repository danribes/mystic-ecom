/**
 * T206: Environment Variable Validation Tests
 *
 * Tests the configuration validation system to ensure:
 * - Required environment variables are validated
 * - Invalid values are rejected with clear error messages
 * - Optional variables work correctly
 * - Production-specific checks are enforced
 * - Config can be accessed safely after validation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('T206: Environment Variable Validation', () => {
  // Store original environment
  const originalEnv = { ...process.env };

  // Valid test environment
  const validTestEnv = {
    DATABASE_URL: 'postgres://user:pass@localhost:5432/testdb',
    REDIS_URL: 'redis://localhost:6379',
    SESSION_SECRET: 'test-session-secret-that-is-at-least-32-characters-long',
    STRIPE_SECRET_KEY: 'sk_test_fake_key_for_testing_only_not_real',
    STRIPE_PUBLISHABLE_KEY: 'pk_test_fake_key_for_testing_only_not_real',
    STRIPE_WEBHOOK_SECRET: 'whsec_test_fake_webhook_secret_for_testing',
    RESEND_API_KEY: 're_test1234567890abcdefghijklmnop',
    EMAIL_FROM: 'test@example.com',
    BASE_URL: 'http://localhost:4321',
    DOWNLOAD_TOKEN_SECRET: 'download-secret-that-is-at-least-32-characters-long',
    NODE_ENV: 'test',
    PORT: '4321',
  };

  beforeEach(() => {
    // Clear module cache to get fresh imports
    vi.resetModules();

    // Reset environment to clean state
    process.env = { ...validTestEnv };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
    vi.resetModules();
  });

  describe('Successful Validation', () => {
    it('should validate all required environment variables successfully', async () => {
      const { validateConfig } = await import('../../src/lib/config');

      expect(() => validateConfig(true)).not.toThrow();
    });

    it('should allow access to config after validation', async () => {
      const { validateConfig, getConfig } = await import('../../src/lib/config');

      validateConfig(true);
      const cfg = getConfig();

      expect(cfg.DATABASE_URL).toBe(validTestEnv.DATABASE_URL);
      expect(cfg.REDIS_URL).toBe(validTestEnv.REDIS_URL);
      expect(cfg.SESSION_SECRET).toBe(validTestEnv.SESSION_SECRET);
    });

    it('should allow access via config proxy', async () => {
      const { validateConfig, config } = await import('../../src/lib/config');

      validateConfig(true);

      expect(config.DATABASE_URL).toBe(validTestEnv.DATABASE_URL);
      expect(config.NODE_ENV).toBe('test');
      expect(config.PORT).toBe('4321');
    });

    it('should validate with optional Twilio variables', async () => {
      process.env.TWILIO_ACCOUNT_SID = 'AC1234567890';
      process.env.TWILIO_AUTH_TOKEN = 'auth_token_123';
      process.env.TWILIO_WHATSAPP_FROM = 'whatsapp:+14155551234';
      process.env.TWILIO_ADMIN_WHATSAPP = 'whatsapp:+14155555678';

      const { validateConfig, getConfig } = await import('../../src/lib/config');

      validateConfig(true);
      const cfg = getConfig();

      expect(cfg.TWILIO_ACCOUNT_SID).toBe('AC1234567890');
      expect(cfg.TWILIO_AUTH_TOKEN).toBe('auth_token_123');
    });

    it('should validate with optional Cloudflare variables', async () => {
      process.env.CLOUDFLARE_ACCOUNT_ID = 'cf_account_123';
      process.env.CLOUDFLARE_API_TOKEN = 'cf_token_456';

      const { validateConfig, getConfig } = await import('../../src/lib/config');

      validateConfig(true);
      const cfg = getConfig();

      expect(cfg.CLOUDFLARE_ACCOUNT_ID).toBe('cf_account_123');
      expect(cfg.CLOUDFLARE_API_TOKEN).toBe('cf_token_456');
    });

    it('should apply default values for NODE_ENV and PORT', async () => {
      delete process.env.NODE_ENV;
      delete process.env.PORT;

      const { validateConfig, getConfig } = await import('../../src/lib/config');

      validateConfig(true);
      const cfg = getConfig();

      expect(cfg.NODE_ENV).toBe('development');
      expect(cfg.PORT).toBe('4321');
    });
  });

  describe('Required Variable Validation', () => {
    it('should fail if DATABASE_URL is missing', async () => {
      delete process.env.DATABASE_URL;

      const { validateConfig } = await import('../../src/lib/config');

      expect(() => validateConfig(true)).toThrow(/DATABASE_URL/);
    });

    it('should fail if DATABASE_URL is not a valid URL', async () => {
      process.env.DATABASE_URL = 'not-a-url';

      const { validateConfig } = await import('../../src/lib/config');

      expect(() => validateConfig(true)).toThrow(/must be a valid PostgreSQL connection URL/);
    });

    it('should fail if DATABASE_URL is not a PostgreSQL URL', async () => {
      process.env.DATABASE_URL = 'mysql://localhost:3306/db';

      const { validateConfig } = await import('../../src/lib/config');

      expect(() => validateConfig(true)).toThrow(/must be a PostgreSQL URL/);
    });

    it('should fail if REDIS_URL is missing', async () => {
      delete process.env.REDIS_URL;

      const { validateConfig } = await import('../../src/lib/config');

      expect(() => validateConfig(true)).toThrow(/REDIS_URL/);
    });

    it('should fail if REDIS_URL is not a valid URL', async () => {
      process.env.REDIS_URL = 'not-a-redis-url';

      const { validateConfig } = await import('../../src/lib/config');

      expect(() => validateConfig(true)).toThrow(/must be a valid Redis connection URL/);
    });

    it('should fail if SESSION_SECRET is too short', async () => {
      process.env.SESSION_SECRET = 'too-short';

      const { validateConfig } = await import('../../src/lib/config');

      expect(() => validateConfig(true)).toThrow(/must be at least 32 characters/);
    });

    it('should fail if SESSION_SECRET uses default value', async () => {
      process.env.SESSION_SECRET = 'your-secret-key-here-change-in-production';

      const { validateConfig } = await import('../../src/lib/config');

      expect(() => validateConfig(true)).toThrow(/must not use default value/);
    });

    it('should fail if STRIPE_SECRET_KEY is missing', async () => {
      delete process.env.STRIPE_SECRET_KEY;

      const { validateConfig } = await import('../../src/lib/config');

      expect(() => validateConfig(true)).toThrow(/STRIPE_SECRET_KEY/);
    });

    it('should fail if STRIPE_SECRET_KEY does not start with sk_', async () => {
      process.env.STRIPE_SECRET_KEY = 'invalid_key_format';

      const { validateConfig } = await import('../../src/lib/config');

      expect(() => validateConfig(true)).toThrow(/must start with sk_/);
    });

    it('should fail if STRIPE_SECRET_KEY uses placeholder value', async () => {
      process.env.STRIPE_SECRET_KEY = 'sk_your-stripe-secret-key';

      const { validateConfig } = await import('../../src/lib/config');

      expect(() => validateConfig(true)).toThrow(/must not use placeholder value/);
    });

    it('should fail if STRIPE_PUBLISHABLE_KEY does not start with pk_', async () => {
      process.env.STRIPE_PUBLISHABLE_KEY = 'invalid_key';

      const { validateConfig } = await import('../../src/lib/config');

      expect(() => validateConfig(true)).toThrow(/must start with pk_/);
    });

    it('should fail if STRIPE_WEBHOOK_SECRET does not start with whsec_', async () => {
      process.env.STRIPE_WEBHOOK_SECRET = 'invalid_secret';

      const { validateConfig } = await import('../../src/lib/config');

      expect(() => validateConfig(true)).toThrow(/must start with whsec_/);
    });

    it('should fail if RESEND_API_KEY is missing', async () => {
      delete process.env.RESEND_API_KEY;

      const { validateConfig } = await import('../../src/lib/config');

      expect(() => validateConfig(true)).toThrow(/RESEND_API_KEY/);
    });

    it('should fail if RESEND_API_KEY does not start with re_', async () => {
      process.env.RESEND_API_KEY = 'invalid_api_key';

      const { validateConfig } = await import('../../src/lib/config');

      expect(() => validateConfig(true)).toThrow(/must start with re_/);
    });

    it('should fail if EMAIL_FROM is missing', async () => {
      delete process.env.EMAIL_FROM;

      const { validateConfig } = await import('../../src/lib/config');

      expect(() => validateConfig(true)).toThrow(/EMAIL_FROM/);
    });

    it('should fail if EMAIL_FROM is not a valid email', async () => {
      process.env.EMAIL_FROM = 'not-an-email';

      const { validateConfig } = await import('../../src/lib/config');

      expect(() => validateConfig(true)).toThrow(/must be a valid email address/);
    });

    it('should fail if BASE_URL is missing', async () => {
      delete process.env.BASE_URL;

      const { validateConfig } = await import('../../src/lib/config');

      expect(() => validateConfig(true)).toThrow(/BASE_URL/);
    });

    it('should fail if BASE_URL is not a valid URL', async () => {
      process.env.BASE_URL = 'not-a-url';

      const { validateConfig } = await import('../../src/lib/config');

      expect(() => validateConfig(true)).toThrow(/must be a valid URL/);
    });

    it('should fail if DOWNLOAD_TOKEN_SECRET is too short', async () => {
      process.env.DOWNLOAD_TOKEN_SECRET = 'short';

      const { validateConfig } = await import('../../src/lib/config');

      expect(() => validateConfig(true)).toThrow(/must be at least 32 characters/);
    });

    it('should fail if DOWNLOAD_TOKEN_SECRET uses default value', async () => {
      process.env.DOWNLOAD_TOKEN_SECRET = 'your-secret-key-change-in-production';

      const { validateConfig } = await import('../../src/lib/config');

      expect(() => validateConfig(true)).toThrow(/must not use default value/);
    });
  });

  describe('Production-Specific Checks', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
      process.env.BASE_URL = 'https://example.com';
      process.env.STRIPE_SECRET_KEY = 'sk_test_fake_key_for_testing_only_not_real';
    });

    it('should fail if BYPASS_ADMIN_AUTH is enabled in production', async () => {
      process.env.BYPASS_ADMIN_AUTH = 'true';

      const { validateConfig } = await import('../../src/lib/config');

      expect(() => validateConfig(true)).toThrow(/must not be enabled/);
    });

    it('should accept BYPASS_ADMIN_AUTH=false in production', async () => {
      process.env.BYPASS_ADMIN_AUTH = 'false';

      const { validateConfig } = await import('../../src/lib/config');

      expect(() => validateConfig(true)).not.toThrow();
    });

    it('should accept missing BYPASS_ADMIN_AUTH in production', async () => {
      delete process.env.BYPASS_ADMIN_AUTH;

      const { validateConfig } = await import('../../src/lib/config');

      expect(() => validateConfig(true)).not.toThrow();
    });
  });

  describe('Environment Detection', () => {
    it('should detect development environment', async () => {
      process.env.NODE_ENV = 'development';

      const { validateConfig, isDevelopment } = await import('../../src/lib/config');

      validateConfig(true);
      expect(isDevelopment()).toBe(true);
    });

    it('should detect production environment', async () => {
      process.env.NODE_ENV = 'production';
      process.env.BASE_URL = 'https://example.com';
      process.env.STRIPE_SECRET_KEY = 'sk_test_fake_key_for_testing_only_not_real';

      const { validateConfig, isProduction } = await import('../../src/lib/config');

      validateConfig(true);
      expect(isProduction()).toBe(true);
    });

    it('should detect test environment', async () => {
      process.env.NODE_ENV = 'test';

      const { validateConfig, isTest } = await import('../../src/lib/config');

      validateConfig(true);
      expect(isTest()).toBe(true);
    });
  });

  describe('Config Access Control', () => {
    it('should throw error when accessing config before validation', async () => {
      const { getConfig } = await import('../../src/lib/config');

      expect(() => getConfig()).toThrow(/Configuration not validated/);
    });

    it('should throw error when using config proxy before validation', async () => {
      const { config } = await import('../../src/lib/config');

      expect(() => config.DATABASE_URL).toThrow(/Configuration not validated/);
    });

    it('should allow config access after validation', async () => {
      const { validateConfig, getConfig } = await import('../../src/lib/config');

      validateConfig(true);

      expect(() => getConfig()).not.toThrow();
      expect(getConfig().DATABASE_URL).toBe(validTestEnv.DATABASE_URL);
    });
  });

  describe('isConfigured Helper', () => {
    it('should return true for configured required variables', async () => {
      const { validateConfig, isConfigured } = await import('../../src/lib/config');

      validateConfig(true);

      expect(isConfigured('DATABASE_URL')).toBe(true);
      expect(isConfigured('REDIS_URL')).toBe(true);
      expect(isConfigured('SESSION_SECRET')).toBe(true);
    });

    it('should return false for unconfigured optional variables', async () => {
      const { validateConfig, isConfigured } = await import('../../src/lib/config');

      validateConfig(true);

      expect(isConfigured('TWILIO_ACCOUNT_SID' as keyof any)).toBe(false);
      expect(isConfigured('CLOUDFLARE_ACCOUNT_ID' as keyof any)).toBe(false);
    });

    it('should return true for configured optional variables', async () => {
      process.env.TWILIO_ACCOUNT_SID = 'AC1234567890';

      const { validateConfig, isConfigured } = await import('../../src/lib/config');

      validateConfig(true);

      expect(isConfigured('TWILIO_ACCOUNT_SID' as keyof any)).toBe(true);
    });
  });

  describe('PORT Validation', () => {
    it('should accept valid port number', async () => {
      process.env.PORT = '3000';

      const { validateConfig, getConfig } = await import('../../src/lib/config');

      validateConfig(true);
      expect(getConfig().PORT).toBe('3000');
    });

    it('should fail if PORT is not a number', async () => {
      process.env.PORT = 'not-a-number';

      const { validateConfig } = await import('../../src/lib/config');

      expect(() => validateConfig(true)).toThrow(/PORT must be a number/);
    });

    it('should use default port if not specified', async () => {
      delete process.env.PORT;

      const { validateConfig, getConfig } = await import('../../src/lib/config');

      validateConfig(true);
      expect(getConfig().PORT).toBe('4321');
    });
  });

  describe('NODE_ENV Validation', () => {
    it('should accept development environment', async () => {
      process.env.NODE_ENV = 'development';

      const { validateConfig, getConfig } = await import('../../src/lib/config');

      validateConfig(true);
      expect(getConfig().NODE_ENV).toBe('development');
    });

    it('should accept production environment', async () => {
      process.env.NODE_ENV = 'production';
      process.env.BASE_URL = 'https://example.com';
      process.env.STRIPE_SECRET_KEY = 'sk_test_fake_key_for_testing_only_not_real';

      const { validateConfig, getConfig } = await import('../../src/lib/config');

      validateConfig(true);
      expect(getConfig().NODE_ENV).toBe('production');
    });

    it('should accept test environment', async () => {
      process.env.NODE_ENV = 'test';

      const { validateConfig, getConfig } = await import('../../src/lib/config');

      validateConfig(true);
      expect(getConfig().NODE_ENV).toBe('test');
    });

    it('should use default environment if not specified', async () => {
      delete process.env.NODE_ENV;

      const { validateConfig, getConfig } = await import('../../src/lib/config');

      validateConfig(true);
      expect(getConfig().NODE_ENV).toBe('development');
    });
  });

  describe('Error Messages', () => {
    it('should provide clear error message for missing DATABASE_URL', async () => {
      delete process.env.DATABASE_URL;

      const { validateConfig } = await import('../../src/lib/config');

      try {
        validateConfig(true);
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toContain('DATABASE_URL');
        expect(error.message).toContain('Required');
      }
    });

    it('should provide clear error message for invalid STRIPE_SECRET_KEY', async () => {
      process.env.STRIPE_SECRET_KEY = 'invalid-key';

      const { validateConfig } = await import('../../src/lib/config');

      try {
        validateConfig(true);
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toContain('STRIPE_SECRET_KEY');
        expect(error.message).toContain('sk_');
      }
    });

    it('should provide multiple error messages when multiple variables are invalid', async () => {
      delete process.env.DATABASE_URL;
      delete process.env.REDIS_URL;
      delete process.env.SESSION_SECRET;

      const { validateConfig } = await import('../../src/lib/config');

      try {
        validateConfig(true);
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        const errorStr = error.toString();
        expect(errorStr).toContain('DATABASE_URL');
        expect(errorStr).toContain('REDIS_URL');
        expect(errorStr).toContain('SESSION_SECRET');
      }
    });
  });
});
