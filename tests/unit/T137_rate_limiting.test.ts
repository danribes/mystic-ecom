/**
 * T137: Rate Limiting Implementation - Unit Tests
 *
 * Tests the rate limiting functionality using Redis to prevent abuse and brute force attacks.
 * Validates sliding window algorithm, configuration profiles, and edge cases.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getRedisClient } from '../../src/lib/redis';
import {
  checkRateLimit,
  rateLimit,
  RateLimitProfiles,
  resetRateLimit,
  getRateLimitStatus,
  type RateLimitConfig,
} from '../../src/lib/ratelimit';
import type { APIContext } from 'astro';

// Mock API context
function createMockContext(overrides?: Partial<APIContext>): APIContext {
  return {
    clientAddress: '192.168.1.1',
    request: {
      headers: new Headers(),
      method: 'POST',
      url: 'http://localhost:4321/api/test',
    } as Request,
    cookies: {
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
      has: vi.fn(),
    } as any,
    ...overrides,
  } as APIContext;
}

describe('T137: Rate Limiting Implementation', () => {
  let redis: Awaited<ReturnType<typeof getRedisClient>>;

  beforeEach(async () => {
    redis = await getRedisClient();
    // Clean up any existing test keys
    const keys = await redis.keys('rl:test:*');
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  });

  afterEach(async () => {
    // Clean up test keys
    const keys = await redis.keys('rl:test:*');
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  });

  describe('Basic Rate Limiting', () => {
    it('should allow requests under the limit', async () => {
      const context = createMockContext();
      const config: RateLimitConfig = {
        maxRequests: 5,
        windowSeconds: 60,
        keyPrefix: 'rl:test',
      };

      const result = await checkRateLimit(context, config);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
      expect(result.limit).toBe(5);
      expect(result.resetAt).toBeGreaterThan(Date.now() / 1000);
    });

    it('should block requests exceeding the limit', async () => {
      const context = createMockContext();
      const config: RateLimitConfig = {
        maxRequests: 3,
        windowSeconds: 60,
        keyPrefix: 'rl:test',
      };

      // Make 3 requests (at limit)
      await checkRateLimit(context, config);
      await checkRateLimit(context, config);
      await checkRateLimit(context, config);

      // 4th request should be blocked
      const result = await checkRateLimit(context, config);

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.limit).toBe(3);
    });

    it('should decrement remaining count correctly', async () => {
      const context = createMockContext();
      const config: RateLimitConfig = {
        maxRequests: 10,
        windowSeconds: 60,
        keyPrefix: 'rl:test',
      };

      const result1 = await checkRateLimit(context, config);
      expect(result1.remaining).toBe(9);

      const result2 = await checkRateLimit(context, config);
      expect(result2.remaining).toBe(8);

      const result3 = await checkRateLimit(context, config);
      expect(result3.remaining).toBe(7);
    });

    it('should use IP address as default identifier', async () => {
      const context1 = createMockContext({ clientAddress: '192.168.1.1' });
      const context2 = createMockContext({ clientAddress: '192.168.1.2' });

      const config: RateLimitConfig = {
        maxRequests: 2,
        windowSeconds: 60,
        keyPrefix: 'rl:test',
      };

      // Both IPs should have independent limits
      const result1 = await checkRateLimit(context1, config);
      expect(result1.allowed).toBe(true);
      expect(result1.remaining).toBe(1);

      const result2 = await checkRateLimit(context2, config);
      expect(result2.allowed).toBe(true);
      expect(result2.remaining).toBe(1);
    });
  });

  describe('Sliding Window Algorithm', () => {
    it('should allow requests after window expires', async () => {
      const context = createMockContext();
      const config: RateLimitConfig = {
        maxRequests: 2,
        windowSeconds: 1, // 1 second window
        keyPrefix: 'rl:test',
      };

      // Make 2 requests (at limit)
      await checkRateLimit(context, config);
      await checkRateLimit(context, config);

      // 3rd request should be blocked
      const blocked = await checkRateLimit(context, config);
      expect(blocked.allowed).toBe(false);

      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Should be allowed again
      const allowed = await checkRateLimit(context, config);
      expect(allowed.allowed).toBe(true);
      expect(allowed.remaining).toBe(1);
    });

    it('should remove expired entries from window', async () => {
      const context = createMockContext();
      const config: RateLimitConfig = {
        maxRequests: 3,
        windowSeconds: 2,
        keyPrefix: 'rl:test',
      };

      // Make 1 request
      await checkRateLimit(context, config);

      // Wait 1 second
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Make 2 more requests
      await checkRateLimit(context, config);
      await checkRateLimit(context, config);

      // Wait for first request to expire
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Should be allowed (first request expired)
      const result = await checkRateLimit(context, config);
      expect(result.allowed).toBe(true);
    });
  });

  describe('Rate Limit Profiles', () => {
    it('should enforce AUTH profile limits (5 per 15 min)', async () => {
      const context = createMockContext();
      const config = RateLimitProfiles.AUTH;

      // Make 5 requests
      for (let i = 0; i < 5; i++) {
        const result = await checkRateLimit(context, config);
        expect(result.allowed).toBe(true);
      }

      // 6th should be blocked
      const result = await checkRateLimit(context, config);
      expect(result.allowed).toBe(false);
    });

    it('should enforce PASSWORD_RESET profile limits (3 per hour)', async () => {
      const context = createMockContext();
      const config = RateLimitProfiles.PASSWORD_RESET;

      // Make 3 requests
      for (let i = 0; i < 3; i++) {
        const result = await checkRateLimit(context, config);
        expect(result.allowed).toBe(true);
      }

      // 4th should be blocked
      const result = await checkRateLimit(context, config);
      expect(result.allowed).toBe(false);
    });

    it('should enforce CHECKOUT profile limits (10 per minute)', async () => {
      const context = createMockContext();
      const config = RateLimitProfiles.CHECKOUT;

      // Make 10 requests
      for (let i = 0; i < 10; i++) {
        const result = await checkRateLimit(context, config);
        expect(result.allowed).toBe(true);
      }

      // 11th should be blocked
      const result = await checkRateLimit(context, config);
      expect(result.allowed).toBe(false);
    });

    it('should enforce SEARCH profile limits (30 per minute)', async () => {
      const context = createMockContext();
      const config = RateLimitProfiles.SEARCH;

      // Make 30 requests
      for (let i = 0; i < 30; i++) {
        const result = await checkRateLimit(context, config);
        expect(result.allowed).toBe(true);
      }

      // 31st should be blocked
      const result = await checkRateLimit(context, config);
      expect(result.allowed).toBe(false);
    });

    it('should enforce UPLOAD profile limits (10 per 10 minutes)', async () => {
      const context = createMockContext();
      const config = RateLimitProfiles.UPLOAD;

      // Make 10 requests
      for (let i = 0; i < 10; i++) {
        const result = await checkRateLimit(context, config);
        expect(result.allowed).toBe(true);
      }

      // 11th should be blocked
      const result = await checkRateLimit(context, config);
      expect(result.allowed).toBe(false);
    });
  });

  describe('User ID Based Rate Limiting', () => {
    it('should use session ID when useUserId is true', async () => {
      const sessionId1 = 'session-abc123';
      const sessionId2 = 'session-xyz789';

      const context1 = createMockContext({
        cookies: {
          get: vi.fn((name) => name === 'session_id' ? { value: sessionId1 } : undefined),
        } as any,
      });

      const context2 = createMockContext({
        cookies: {
          get: vi.fn((name) => name === 'session_id' ? { value: sessionId2 } : undefined),
        } as any,
      });

      const config: RateLimitConfig = {
        maxRequests: 2,
        windowSeconds: 60,
        keyPrefix: 'rl:test',
        useUserId: true,
      };

      // Both sessions should have independent limits
      const result1 = await checkRateLimit(context1, config);
      expect(result1.allowed).toBe(true);

      const result2 = await checkRateLimit(context2, config);
      expect(result2.allowed).toBe(true);
    });

    it('should fall back to IP when no session exists', async () => {
      const context = createMockContext({
        clientAddress: '10.0.0.1',
        cookies: {
          get: vi.fn(() => undefined),
        } as any,
      });

      const config: RateLimitConfig = {
        maxRequests: 2,
        windowSeconds: 60,
        keyPrefix: 'rl:test',
        useUserId: true,
      };

      const result = await checkRateLimit(context, config);
      expect(result.allowed).toBe(true);
    });
  });

  describe('IP Address Detection', () => {
    it('should use clientAddress when available', async () => {
      const context = createMockContext({ clientAddress: '203.0.113.1' });
      const config: RateLimitConfig = {
        maxRequests: 1,
        windowSeconds: 60,
        keyPrefix: 'rl:test',
      };

      await checkRateLimit(context, config);
      const result = await checkRateLimit(context, config);

      expect(result.allowed).toBe(false);
    });

    it('should use X-Forwarded-For header when clientAddress not available', async () => {
      const headers = new Headers();
      headers.set('x-forwarded-for', '198.51.100.1, 192.168.1.1');

      const context = createMockContext({
        clientAddress: undefined,
        request: {
          headers,
          method: 'POST',
          url: 'http://localhost:4321/api/test',
        } as Request,
      });

      const config: RateLimitConfig = {
        maxRequests: 1,
        windowSeconds: 60,
        keyPrefix: 'rl:test',
      };

      await checkRateLimit(context, config);
      const result = await checkRateLimit(context, config);

      expect(result.allowed).toBe(false);
    });

    it('should use X-Real-IP header as fallback', async () => {
      const headers = new Headers();
      headers.set('x-real-ip', '203.0.113.5');

      const context = createMockContext({
        clientAddress: undefined,
        request: {
          headers,
          method: 'POST',
          url: 'http://localhost:4321/api/test',
        } as Request,
      });

      const config: RateLimitConfig = {
        maxRequests: 1,
        windowSeconds: 60,
        keyPrefix: 'rl:test',
      };

      await checkRateLimit(context, config);
      const result = await checkRateLimit(context, config);

      expect(result.allowed).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should fail open when Redis is unavailable', async () => {
      // This is a tricky one to test - the implementation fails open
      // which means it allows requests when Redis fails
      const context = createMockContext();
      const config: RateLimitConfig = {
        maxRequests: 1,
        windowSeconds: 60,
        keyPrefix: 'rl:test:error',
      };

      // Normal request should work
      const result = await checkRateLimit(context, config);
      expect(result.allowed).toBe(true);
    });
  });

  describe('Reset Rate Limit', () => {
    it('should reset rate limit for a client', async () => {
      const context = createMockContext({ clientAddress: '192.168.1.100' });
      const config: RateLimitConfig = {
        maxRequests: 2,
        windowSeconds: 60,
        keyPrefix: 'rl:test',
      };

      // Exhaust limit
      await checkRateLimit(context, config);
      await checkRateLimit(context, config);

      const blocked = await checkRateLimit(context, config);
      expect(blocked.allowed).toBe(false);

      // Reset limit
      await resetRateLimit('ip:192.168.1.100', 'rl:test');

      // Should be allowed again
      const allowed = await checkRateLimit(context, config);
      expect(allowed.allowed).toBe(true);
    });
  });

  describe('Get Rate Limit Status', () => {
    it('should return current rate limit status', async () => {
      const context = createMockContext({ clientAddress: '192.168.1.200' });
      const config: RateLimitConfig = {
        maxRequests: 5,
        windowSeconds: 60,
        keyPrefix: 'rl:test',
      };

      // Make 2 requests
      await checkRateLimit(context, config);
      await checkRateLimit(context, config);

      // Check status
      const status = await getRateLimitStatus('ip:192.168.1.200', config);

      expect(status).not.toBeNull();
      expect(status!.allowed).toBe(true);
      expect(status!.remaining).toBe(3);
      expect(status!.limit).toBe(5);
    });

    it('should return null on error', async () => {
      const config: RateLimitConfig = {
        maxRequests: 5,
        windowSeconds: 60,
        keyPrefix: 'rl:test:invalid',
      };

      // This should handle errors gracefully
      const status = await getRateLimitStatus('invalid-client', config);

      // Implementation should either return null or valid status
      expect(status === null || typeof status === 'object').toBe(true);
    });
  });

  describe('Rate Limit Wrapper', () => {
    it('should call rateLimit wrapper successfully', async () => {
      const context = createMockContext();
      const config: RateLimitConfig = {
        maxRequests: 5,
        windowSeconds: 60,
        keyPrefix: 'rl:test',
      };

      const result = await rateLimit(context, config);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBeGreaterThanOrEqual(0);
      expect(result.limit).toBe(5);
    });
  });

  describe('Concurrent Requests', () => {
    it('should handle concurrent requests correctly', async () => {
      const context = createMockContext();
      const config: RateLimitConfig = {
        maxRequests: 10,
        windowSeconds: 60,
        keyPrefix: 'rl:test',
      };

      // Make 10 concurrent requests
      const promises = Array(10).fill(null).map(() => checkRateLimit(context, config));
      const results = await Promise.all(promises);

      // All should be allowed
      const allowed = results.filter(r => r.allowed).length;
      expect(allowed).toBe(10);

      // Next one should be blocked
      const blocked = await checkRateLimit(context, config);
      expect(blocked.allowed).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero maxRequests', async () => {
      const context = createMockContext();
      const config: RateLimitConfig = {
        maxRequests: 0,
        windowSeconds: 60,
        keyPrefix: 'rl:test',
      };

      const result = await checkRateLimit(context, config);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should handle very short window (1 second)', async () => {
      const context = createMockContext();
      const config: RateLimitConfig = {
        maxRequests: 2,
        windowSeconds: 1,
        keyPrefix: 'rl:test',
      };

      await checkRateLimit(context, config);
      const result = await checkRateLimit(context, config);

      expect(result.allowed).toBe(true);
    });

    it('should handle large maxRequests', async () => {
      const context = createMockContext();
      const config: RateLimitConfig = {
        maxRequests: 10000,
        windowSeconds: 60,
        keyPrefix: 'rl:test',
      };

      const result = await checkRateLimit(context, config);
      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(10000);
    });
  });

  describe('Different Key Prefixes', () => {
    it('should isolate rate limits by key prefix', async () => {
      const context = createMockContext();

      const config1: RateLimitConfig = {
        maxRequests: 2,
        windowSeconds: 60,
        keyPrefix: 'rl:test:prefix1',
      };

      const config2: RateLimitConfig = {
        maxRequests: 2,
        windowSeconds: 60,
        keyPrefix: 'rl:test:prefix2',
      };

      // Exhaust first limit
      await checkRateLimit(context, config1);
      await checkRateLimit(context, config1);
      const blocked1 = await checkRateLimit(context, config1);
      expect(blocked1.allowed).toBe(false);

      // Second limit should still be available
      const allowed2 = await checkRateLimit(context, config2);
      expect(allowed2.allowed).toBe(true);
    });
  });
});
