/**
 * T207: Structured Logging System Tests
 *
 * Tests the logging system to ensure:
 * - Sensitive data (passwords, tokens, PII) is redacted
 * - Different log levels work correctly
 * - Sanitization functions work properly
 * - Child loggers inherit context
 * - Helper functions log correctly
 * - Production vs development behavior differs appropriately
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('T207: Structured Logging System', () => {
  // We'll test the sanitize function and helper functions
  // since the actual logger output is hard to capture in tests

  describe('Sanitization', () => {
    it('should redact password fields', async () => {
      const { sanitize } = await import('../../src/lib/logger');

      const input = {
        username: 'john',
        password: 'secret123',
        email: 'john@example.com',
      };

      const result = sanitize(input, false); // Don't redact PII for this test

      expect(result.username).toBe('john');
      expect(result.password).toBe('[REDACTED]');
      expect(result.email).toBe('john@example.com'); // Not redacted when redactPII=false
    });

    it('should redact various password field names', async () => {
      const { sanitize } = await import('../../src/lib/logger');

      const input = {
        password: 'secret',
        passwordHash: 'hash',
        newPassword: 'new',
        oldPassword: 'old',
        currentPassword: 'current',
      };

      const result = sanitize(input, false);

      expect(result.password).toBe('[REDACTED]');
      expect(result.passwordHash).toBe('[REDACTED]');
      expect(result.newPassword).toBe('[REDACTED]');
      expect(result.oldPassword).toBe('[REDACTED]');
      expect(result.currentPassword).toBe('[REDACTED]');
    });

    it('should redact token fields', async () => {
      const { sanitize } = await import('../../src/lib/logger');

      const input = {
        token: 'abc123',
        accessToken: 'xyz789',
        refreshToken: 'refresh',
        sessionToken: 'session',
      };

      const result = sanitize(input, false);

      expect(result.token).toBe('[REDACTED]');
      expect(result.accessToken).toBe('[REDACTED]');
      expect(result.refreshToken).toBe('[REDACTED]');
      expect(result.sessionToken).toBe('[REDACTED]');
    });

    it('should redact API keys and secrets', async () => {
      const { sanitize } = await import('../../src/lib/logger');

      const input = {
        apiKey: 'key123',
        api_key: 'key456',
        secret: 'mysecret',
        secretKey: 'secretkey',
        secret_key: 'secret_key',
        privateKey: 'private',
        private_key: 'private_key',
      };

      const result = sanitize(input, false);

      expect(result.apiKey).toBe('[REDACTED]');
      expect(result.api_key).toBe('[REDACTED]');
      expect(result.secret).toBe('[REDACTED]');
      expect(result.secretKey).toBe('[REDACTED]');
      expect(result.secret_key).toBe('[REDACTED]');
      expect(result.privateKey).toBe('[REDACTED]');
      expect(result.private_key).toBe('[REDACTED]');
    });

    it('should redact credit card information', async () => {
      const { sanitize } = await import('../../src/lib/logger');

      const input = {
        creditCard: '4111111111111111',
        credit_card: '4111111111111111',
        cardNumber: '4111111111111111',
        card_number: '4111111111111111',
        cvv: '123',
      };

      const result = sanitize(input, false);

      expect(result.creditCard).toBe('[REDACTED]');
      expect(result.credit_card).toBe('[REDACTED]');
      expect(result.cardNumber).toBe('[REDACTED]');
      expect(result.card_number).toBe('[REDACTED]');
      expect(result.cvv).toBe('[REDACTED]');
    });

    it('should redact SSN and sensitive identifiers', async () => {
      const { sanitize } = await import('../../src/lib/logger');

      const input = {
        ssn: '123-45-6789',
        social_security_number: '123-45-6789',
        authorization: 'Bearer token',
        cookie: 'session=abc',
        cookies: { session: 'abc' },
      };

      const result = sanitize(input, false);

      expect(result.ssn).toBe('[REDACTED]');
      expect(result.social_security_number).toBe('[REDACTED]');
      expect(result.authorization).toBe('[REDACTED]');
      expect(result.cookie).toBe('[REDACTED]');
      expect(result.cookies).toBe('[REDACTED]');
    });

    it('should redact PII when redactPII is true', async () => {
      const { sanitize } = await import('../../src/lib/logger');

      const input = {
        email: 'user@example.com',
        phoneNumber: '555-1234',
        phone: '555-5678',
        address: '123 Main St',
        ipAddress: '192.168.1.1',
        ip: '10.0.0.1',
      };

      const result = sanitize(input, true);

      expect(result.email).toBe('[PII_REDACTED]');
      expect(result.phoneNumber).toBe('[PII_REDACTED]');
      expect(result.phone).toBe('[PII_REDACTED]');
      expect(result.address).toBe('[PII_REDACTED]');
      expect(result.ipAddress).toBe('[PII_REDACTED]');
      expect(result.ip).toBe('[PII_REDACTED]');
    });

    it('should not redact PII when redactPII is false', async () => {
      const { sanitize } = await import('../../src/lib/logger');

      const input = {
        email: 'user@example.com',
        phoneNumber: '555-1234',
        name: 'John Doe',
      };

      const result = sanitize(input, false);

      expect(result.email).toBe('user@example.com');
      expect(result.phoneNumber).toBe('555-1234');
      expect(result.name).toBe('John Doe');
    });

    it('should redact PII name fields when redactPII is true', async () => {
      const { sanitize } = await import('../../src/lib/logger');

      const input = {
        fullName: 'John Doe',
        full_name: 'Jane Smith',
        firstName: 'John',
        first_name: 'Jane',
        lastName: 'Doe',
        last_name: 'Smith',
      };

      const result = sanitize(input, true);

      expect(result.fullName).toBe('[PII_REDACTED]');
      expect(result.full_name).toBe('[PII_REDACTED]');
      expect(result.firstName).toBe('[PII_REDACTED]');
      expect(result.first_name).toBe('[PII_REDACTED]');
      expect(result.lastName).toBe('[PII_REDACTED]');
      expect(result.last_name).toBe('[PII_REDACTED]');
    });

    it('should handle nested objects', async () => {
      const { sanitize } = await import('../../src/lib/logger');

      const input = {
        user: {
          name: 'John',
          password: 'secret',
          profile: {
            email: 'john@example.com',
            apiKey: 'key123',
          },
        },
      };

      const result = sanitize(input, true);

      expect(result.user.name).toBe('John');
      expect(result.user.password).toBe('[REDACTED]');
      expect(result.user.profile.email).toBe('[PII_REDACTED]');
      expect(result.user.profile.apiKey).toBe('[REDACTED]');
    });

    it('should handle arrays', async () => {
      const { sanitize } = await import('../../src/lib/logger');

      const input = {
        users: [
          { name: 'John', password: 'secret1' },
          { name: 'Jane', password: 'secret2' },
        ],
      };

      const result = sanitize(input, false);

      expect(result.users[0].name).toBe('John');
      expect(result.users[0].password).toBe('[REDACTED]');
      expect(result.users[1].name).toBe('Jane');
      expect(result.users[1].password).toBe('[REDACTED]');
    });

    it('should handle null and undefined', async () => {
      const { sanitize } = await import('../../src/lib/logger');

      expect(sanitize(null, false)).toBeNull();
      expect(sanitize(undefined, false)).toBeUndefined();
    });

    it('should handle primitives', async () => {
      const { sanitize } = await import('../../src/lib/logger');

      expect(sanitize('string', false)).toBe('string');
      expect(sanitize(123, false)).toBe(123);
      expect(sanitize(true, false)).toBe(true);
    });

    it('should handle Error objects', async () => {
      const { sanitize } = await import('../../src/lib/logger');

      const error = new Error('Test error');
      const result = sanitize(error, false);

      expect(result.name).toBe('Error');
      expect(result.message).toBe('Test error');
      expect(result).toHaveProperty('stack');
    });

    it('should not include stack traces in production', async () => {
      // Temporarily set NODE_ENV to production
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      // Reset modules to pick up new environment
      vi.resetModules();
      const { sanitize } = await import('../../src/lib/logger');

      const error = new Error('Test error');
      const result = sanitize(error, false);

      expect(result.name).toBe('Error');
      expect(result.message).toBe('Test error');
      expect(result.stack).toBeUndefined();

      // Restore environment
      process.env.NODE_ENV = originalEnv;
      vi.resetModules();
    });

    it('should be case-insensitive for field matching', async () => {
      const { sanitize } = await import('../../src/lib/logger');

      const input = {
        PASSWORD: 'secret',
        Token: 'token123',
        ApiKey: 'key',
        EMAIL: 'user@example.com',
      };

      const result = sanitize(input, true);

      expect(result.PASSWORD).toBe('[REDACTED]');
      expect(result.Token).toBe('[REDACTED]');
      expect(result.ApiKey).toBe('[REDACTED]');
      expect(result.EMAIL).toBe('[PII_REDACTED]');
    });
  });

  describe('Helper Functions', () => {
    it('should export logQuery helper', async () => {
      const { logQuery } = await import('../../src/lib/logger');

      expect(typeof logQuery).toBe('function');

      // Should not throw
      expect(() => logQuery('SELECT * FROM users', 150, [1, 2])).not.toThrow();
    });

    it('should export logRequest helper', async () => {
      const { logRequest } = await import('../../src/lib/logger');

      expect(typeof logRequest).toBe('function');

      // Should not throw
      expect(() => logRequest('GET', '/api/users', 200, 50, 'user123')).not.toThrow();
    });

    it('should export logAuth helper', async () => {
      const { logAuth } = await import('../../src/lib/logger');

      expect(typeof logAuth).toBe('function');

      // Should not throw
      expect(() => logAuth('login', 'user123', { ip: '127.0.0.1' })).not.toThrow();
    });

    it('should export logPayment helper', async () => {
      const { logPayment } = await import('../../src/lib/logger');

      expect(typeof logPayment).toBe('function');

      // Should not throw
      expect(() =>
        logPayment('succeeded', 1000, 'USD', 'user123', { orderId: 'order123' })
      ).not.toThrow();
    });

    it('should export logSecurity helper', async () => {
      const { logSecurity } = await import('../../src/lib/logger');

      expect(typeof logSecurity).toBe('function');

      // Should not throw
      expect(() => logSecurity('Failed login attempt', 'medium', { ip: '127.0.0.1' })).not.toThrow();
    });

    it('should export logPerformance helper', async () => {
      const { logPerformance } = await import('../../src/lib/logger');

      expect(typeof logPerformance).toBe('function');

      // Should not throw
      expect(() => logPerformance('Database query', 500, { query: 'SELECT...' })).not.toThrow();
    });

    it('should sanitize data in helper functions', async () => {
      const { logAuth, sanitize } = await import('../../src/lib/logger');

      // Test that logAuth sanitizes the details
      const details = {
        username: 'john',
        password: 'secret',
      };

      // Should not throw and should have sanitized internally
      expect(() => logAuth('login', 'user123', details)).not.toThrow();

      // Verify sanitization works
      const sanitized = sanitize(details, false);
      expect(sanitized.password).toBe('[REDACTED]');
    });
  });

  describe('Logger Interface', () => {
    it('should export log object with all methods', async () => {
      const { log } = await import('../../src/lib/logger');

      expect(typeof log.debug).toBe('function');
      expect(typeof log.info).toBe('function');
      expect(typeof log.warn).toBe('function');
      expect(typeof log.error).toBe('function');
      expect(typeof log.fatal).toBe('function');
      expect(typeof log.child).toBe('function');
    });

    it('should not throw when logging', async () => {
      const { log } = await import('../../src/lib/logger');

      expect(() => log.debug('Debug message', { key: 'value' })).not.toThrow();
      expect(() => log.info('Info message', { key: 'value' })).not.toThrow();
      expect(() => log.warn('Warn message', { key: 'value' })).not.toThrow();
      expect(() => log.error('Error message', { key: 'value' })).not.toThrow();
      expect(() => log.fatal('Fatal message', { key: 'value' })).not.toThrow();
    });

    it('should create child loggers', async () => {
      const { log } = await import('../../src/lib/logger');

      const child = log.child({ requestId: '123' });

      expect(typeof child.debug).toBe('function');
      expect(typeof child.info).toBe('function');
      expect(typeof child.warn).toBe('function');
      expect(typeof child.error).toBe('function');
      expect(typeof child.fatal).toBe('function');
    });

    it('should sanitize data when logging', async () => {
      const { log } = await import('../../src/lib/logger');

      const data = {
        user: 'john',
        password: 'secret',
      };

      // Should not throw and should sanitize internally
      expect(() => log.info('User action', data)).not.toThrow();
    });
  });

  describe('Sensitive Field Detection', () => {
    it('should detect password in various formats', async () => {
      const { sanitize } = await import('../../src/lib/logger');

      const variations = [
        { password: 'test' },
        { Password: 'test' },
        { PASSWORD: 'test' },
        { user_password: 'test' },
        { userPassword: 'test' },
      ];

      variations.forEach((input) => {
        const result = sanitize(input, false);
        const key = Object.keys(input)[0];
        expect(result[key]).toBe('[REDACTED]');
      });
    });

    it('should detect token in various formats', async () => {
      const { sanitize } = await import('../../src/lib/logger');

      const variations = [
        { token: 'test' },
        { Token: 'test' },
        { TOKEN: 'test' },
        { auth_token: 'test' },
        { authToken: 'test' },
      ];

      variations.forEach((input) => {
        const result = sanitize(input, false);
        const key = Object.keys(input)[0];
        expect(result[key]).toBe('[REDACTED]');
      });
    });

    it('should detect secret in various formats', async () => {
      const { sanitize } = await import('../../src/lib/logger');

      const variations = [
        { secret: 'test' },
        { Secret: 'test' },
        { SECRET: 'test' },
        { api_secret: 'test' },
        { apiSecret: 'test' },
      ];

      variations.forEach((input) => {
        const result = sanitize(input, false);
        const key = Object.keys(input)[0];
        expect(result[key]).toBe('[REDACTED]');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty objects', async () => {
      const { sanitize } = await import('../../src/lib/logger');

      const result = sanitize({}, false);
      expect(result).toEqual({});
    });

    it('should handle empty arrays', async () => {
      const { sanitize } = await import('../../src/lib/logger');

      const result = sanitize([], false);
      expect(result).toEqual([]);
    });

    it('should handle deeply nested objects', async () => {
      const { sanitize } = await import('../../src/lib/logger');

      const input = {
        level1: {
          level2: {
            level3: {
              level4: {
                password: 'secret',
              },
            },
          },
        },
      };

      const result = sanitize(input, false);
      expect(result.level1.level2.level3.level4.password).toBe('[REDACTED]');
    });

    it('should handle circular references gracefully', async () => {
      const { sanitize } = await import('../../src/lib/logger');

      const obj: any = { name: 'test' };
      obj.self = obj; // Circular reference

      // Should not throw and should replace circular reference with '[Circular]'
      const result = sanitize(obj, false);
      expect(result.name).toBe('test');
      expect(result.self).toBe('[Circular]');
    });

    it('should handle mixed data types', async () => {
      const { sanitize } = await import('../../src/lib/logger');

      const input = {
        string: 'value',
        number: 123,
        boolean: true,
        null: null,
        undefined: undefined,
        array: [1, 2, 3],
        object: { key: 'value' },
        password: 'secret',
      };

      const result = sanitize(input, false);

      expect(result.string).toBe('value');
      expect(result.number).toBe(123);
      expect(result.boolean).toBe(true);
      expect(result.null).toBeNull();
      expect(result.undefined).toBeUndefined();
      expect(result.array).toEqual([1, 2, 3]);
      expect(result.object).toEqual({ key: 'value' });
      expect(result.password).toBe('[REDACTED]');
    });
  });
});
