/**
 * T218: Health Check Endpoint Tests
 *
 * Tests the /api/health endpoint to ensure:
 * - Returns correct status when all services are healthy
 * - Returns degraded status when Redis is down
 * - Returns unhealthy status when database is down
 * - Returns correct response structure
 * - Calculates uptime correctly
 * - Includes proper cache headers
 * - Handles errors gracefully
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET } from '../../src/pages/api/health';

// Mock the database and Redis clients
vi.mock('../../src/lib/db', () => ({
  getPool: vi.fn(),
}));

vi.mock('../../src/lib/redis', () => ({
  getRedisClient: vi.fn(),
}));

import { getPool } from '../../src/lib/db';
import { getRedisClient } from '../../src/lib/redis';

describe('T218: Health Check Endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Healthy Status', () => {
    it('should return 200 and healthy status when all services are up', async () => {
      // Mock successful database query
      const mockQuery = vi.fn().mockResolvedValue({ rows: [{ health_check: 1 }] });
      (getPool as any).mockReturnValue({ query: mockQuery });

      // Mock successful Redis ping
      const mockPing = vi.fn().mockResolvedValue('PONG');
      (getRedisClient as any).mockResolvedValue({ ping: mockPing });

      const response = await GET({} as any);

      expect(response.status).toBe(200);

      const body = await response.json();

      expect(body.status).toBe('healthy');
      expect(body.version).toBe('0.0.1');
      expect(body.services.database.status).toBe('up');
      expect(body.services.redis.status).toBe('up');
    });

    it('should include timestamp in ISO format', async () => {
      const mockQuery = vi.fn().mockResolvedValue({ rows: [{ health_check: 1 }] });
      (getPool as any).mockReturnValue({ query: mockQuery });

      const mockPing = vi.fn().mockResolvedValue('PONG');
      (getRedisClient as any).mockResolvedValue({ ping: mockPing });

      const response = await GET({} as any);
      const body = await response.json();

      expect(body.timestamp).toBeDefined();
      expect(new Date(body.timestamp).toISOString()).toBe(body.timestamp);
    });

    it('should include uptime information', async () => {
      const mockQuery = vi.fn().mockResolvedValue({ rows: [{ health_check: 1 }] });
      (getPool as any).mockReturnValue({ query: mockQuery });

      const mockPing = vi.fn().mockResolvedValue('PONG');
      (getRedisClient as any).mockResolvedValue({ ping: mockPing });

      const response = await GET({} as any);
      const body = await response.json();

      expect(body.uptime).toBeDefined();
      expect(body.uptime.seconds).toBeGreaterThanOrEqual(0);
      expect(body.uptime.human).toBeDefined();
      expect(typeof body.uptime.human).toBe('string');
    });

    it('should include response times for services', async () => {
      const mockQuery = vi.fn().mockResolvedValue({ rows: [{ health_check: 1 }] });
      (getPool as any).mockReturnValue({ query: mockQuery });

      const mockPing = vi.fn().mockResolvedValue('PONG');
      (getRedisClient as any).mockResolvedValue({ ping: mockPing });

      const response = await GET({} as any);
      const body = await response.json();

      expect(body.services.database.responseTime).toBeGreaterThanOrEqual(0);
      expect(body.services.redis.responseTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Degraded Status', () => {
    it('should return 503 and degraded status when Redis is down', async () => {
      // Mock successful database query
      const mockQuery = vi.fn().mockResolvedValue({ rows: [{ health_check: 1 }] });
      (getPool as any).mockReturnValue({ query: mockQuery });

      // Mock Redis failure
      (getRedisClient as any).mockRejectedValue(new Error('Redis connection failed'));

      const response = await GET({} as any);

      expect(response.status).toBe(503);

      const body = await response.json();

      expect(body.status).toBe('degraded');
      expect(body.services.database.status).toBe('up');
      expect(body.services.redis.status).toBe('down');
      expect(body.services.redis.error).toContain('Redis connection failed');
    });

    it('should include error message for failed Redis', async () => {
      const mockQuery = vi.fn().mockResolvedValue({ rows: [{ health_check: 1 }] });
      (getPool as any).mockReturnValue({ query: mockQuery });

      const errorMessage = 'Connection timeout';
      (getRedisClient as any).mockRejectedValue(new Error(errorMessage));

      const response = await GET({} as any);
      const body = await response.json();

      expect(body.services.redis.error).toBe(errorMessage);
    });
  });

  describe('Unhealthy Status', () => {
    it('should return 503 and unhealthy status when database is down', async () => {
      // Mock database failure
      (getPool as any).mockReturnValue({
        query: vi.fn().mockRejectedValue(new Error('Database connection failed')),
      });

      // Mock successful Redis ping
      const mockPing = vi.fn().mockResolvedValue('PONG');
      (getRedisClient as any).mockResolvedValue({ ping: mockPing });

      const response = await GET({} as any);

      expect(response.status).toBe(503);

      const body = await response.json();

      expect(body.status).toBe('unhealthy');
      expect(body.services.database.status).toBe('down');
      expect(body.services.database.error).toContain('Database connection failed');
    });

    it('should return unhealthy when both services are down', async () => {
      // Mock database failure
      (getPool as any).mockReturnValue({
        query: vi.fn().mockRejectedValue(new Error('Database down')),
      });

      // Mock Redis failure
      (getRedisClient as any).mockRejectedValue(new Error('Redis down'));

      const response = await GET({} as any);

      expect(response.status).toBe(503);

      const body = await response.json();

      expect(body.status).toBe('unhealthy');
      expect(body.services.database.status).toBe('down');
      expect(body.services.redis.status).toBe('down');
    });

    it('should include error messages for all failed services', async () => {
      const dbError = 'Database connection timeout';
      const redisError = 'Redis authentication failed';

      (getPool as any).mockReturnValue({
        query: vi.fn().mockRejectedValue(new Error(dbError)),
      });

      (getRedisClient as any).mockRejectedValue(new Error(redisError));

      const response = await GET({} as any);
      const body = await response.json();

      expect(body.services.database.error).toBe(dbError);
      expect(body.services.redis.error).toBe(redisError);
    });
  });

  describe('Uptime Formatting', () => {
    it('should format uptime in human-readable format', async () => {
      const mockQuery = vi.fn().mockResolvedValue({ rows: [{ health_check: 1 }] });
      (getPool as any).mockReturnValue({ query: mockQuery });

      const mockPing = vi.fn().mockResolvedValue('PONG');
      (getRedisClient as any).mockResolvedValue({ ping: mockPing });

      const response = await GET({} as any);
      const body = await response.json();

      // Should contain time units (s, m, h, d)
      expect(body.uptime.human).toMatch(/\d+[smhd]/);
    });

    it('should show seconds for short uptime', async () => {
      const mockQuery = vi.fn().mockResolvedValue({ rows: [{ health_check: 1 }] });
      (getPool as any).mockReturnValue({ query: mockQuery });

      const mockPing = vi.fn().mockResolvedValue('PONG');
      (getRedisClient as any).mockResolvedValue({ ping: mockPing });

      const response = await GET({} as any);
      const body = await response.json();

      // For short uptime, should include seconds
      expect(body.uptime.human).toContain('s');
    });
  });

  describe('Response Headers', () => {
    it('should include proper Content-Type header', async () => {
      const mockQuery = vi.fn().mockResolvedValue({ rows: [{ health_check: 1 }] });
      (getPool as any).mockReturnValue({ query: mockQuery });

      const mockPing = vi.fn().mockResolvedValue('PONG');
      (getRedisClient as any).mockResolvedValue({ ping: mockPing });

      const response = await GET({} as any);

      expect(response.headers.get('Content-Type')).toBe('application/json');
    });

    it('should include no-cache headers', async () => {
      const mockQuery = vi.fn().mockResolvedValue({ rows: [{ health_check: 1 }] });
      (getPool as any).mockReturnValue({ query: mockQuery });

      const mockPing = vi.fn().mockResolvedValue('PONG');
      (getRedisClient as any).mockResolvedValue({ ping: mockPing });

      const response = await GET({} as any);

      const cacheControl = response.headers.get('Cache-Control');
      expect(cacheControl).toContain('no-store');
      expect(cacheControl).toContain('no-cache');
      expect(cacheControl).toContain('must-revalidate');

      expect(response.headers.get('Pragma')).toBe('no-cache');
      expect(response.headers.get('Expires')).toBe('0');
    });
  });

  describe('Response Structure', () => {
    it('should return valid JSON structure', async () => {
      const mockQuery = vi.fn().mockResolvedValue({ rows: [{ health_check: 1 }] });
      (getPool as any).mockReturnValue({ query: mockQuery });

      const mockPing = vi.fn().mockResolvedValue('PONG');
      (getRedisClient as any).mockResolvedValue({ ping: mockPing });

      const response = await GET({} as any);
      const body = await response.json();

      // Verify structure
      expect(body).toHaveProperty('status');
      expect(body).toHaveProperty('timestamp');
      expect(body).toHaveProperty('version');
      expect(body).toHaveProperty('uptime');
      expect(body).toHaveProperty('services');

      expect(body.uptime).toHaveProperty('seconds');
      expect(body.uptime).toHaveProperty('human');

      expect(body.services).toHaveProperty('database');
      expect(body.services).toHaveProperty('redis');

      expect(body.services.database).toHaveProperty('status');
      expect(body.services.redis).toHaveProperty('status');
    });

    it('should have correct status enum values', async () => {
      const mockQuery = vi.fn().mockResolvedValue({ rows: [{ health_check: 1 }] });
      (getPool as any).mockReturnValue({ query: mockQuery });

      const mockPing = vi.fn().mockResolvedValue('PONG');
      (getRedisClient as any).mockResolvedValue({ ping: mockPing });

      const response = await GET({} as any);
      const body = await response.json();

      // Status should be one of: healthy, degraded, unhealthy
      expect(['healthy', 'degraded', 'unhealthy']).toContain(body.status);

      // Service status should be 'up' or 'down'
      expect(['up', 'down']).toContain(body.services.database.status);
      expect(['up', 'down']).toContain(body.services.redis.status);
    });
  });

  describe('Error Handling', () => {
    it('should handle unexpected errors gracefully', async () => {
      // Mock unexpected error in getPool itself
      (getPool as any).mockImplementation(() => {
        throw new Error('Unexpected pool error');
      });

      // Mock Redis successful to isolate the error
      const mockPing = vi.fn().mockResolvedValue('PONG');
      (getRedisClient as any).mockResolvedValue({ ping: mockPing });

      const response = await GET({} as any);

      expect(response.status).toBe(503);

      const body = await response.json();

      // When getPool throws, it's caught by checkDatabase and treated as database down
      expect(body.status).toBe('unhealthy');
      expect(body.services.database.status).toBe('down');
      expect(body.services.database.error).toContain('Unexpected pool error');
    });

    it('should handle non-Error exceptions', async () => {
      // Mock non-Error exception
      (getPool as any).mockReturnValue({
        query: vi.fn().mockRejectedValue('String error'),
      });

      const mockPing = vi.fn().mockResolvedValue('PONG');
      (getRedisClient as any).mockResolvedValue({ ping: mockPing });

      const response = await GET({} as any);

      expect(response.status).toBe(503);

      const body = await response.json();

      expect(body.services.database.status).toBe('down');
      expect(body.services.database.error).toContain('Unknown database error');
    });
  });

  describe('Performance', () => {
    it('should respond quickly when all services are up', async () => {
      const mockQuery = vi.fn().mockResolvedValue({ rows: [{ health_check: 1 }] });
      (getPool as any).mockReturnValue({ query: mockQuery });

      const mockPing = vi.fn().mockResolvedValue('PONG');
      (getRedisClient as any).mockResolvedValue({ ping: mockPing });

      const startTime = Date.now();
      const response = await GET({} as any);
      const endTime = Date.now();

      const body = await response.json();

      // Health check should be fast (< 1 second in tests)
      expect(endTime - startTime).toBeLessThan(1000);

      // Response times should be reasonable
      expect(body.services.database.responseTime).toBeLessThan(500);
      expect(body.services.redis.responseTime).toBeLessThan(500);
    });

    it('should check services in parallel', async () => {
      let dbCallTime: number | null = null;
      let redisCallTime: number | null = null;

      const mockQuery = vi.fn().mockImplementation(async () => {
        dbCallTime = Date.now();
        await new Promise((resolve) => setTimeout(resolve, 50));
        return { rows: [{ health_check: 1 }] };
      });

      (getPool as any).mockReturnValue({ query: mockQuery });

      const mockPing = vi.fn().mockImplementation(async () => {
        redisCallTime = Date.now();
        await new Promise((resolve) => setTimeout(resolve, 50));
        return 'PONG';
      });

      (getRedisClient as any).mockResolvedValue({ ping: mockPing });

      const startTime = Date.now();
      await GET({} as any);
      const totalTime = Date.now() - startTime;

      // If run in parallel, total time should be ~50ms, not ~100ms
      expect(totalTime).toBeLessThan(100);

      // Both should have been called around the same time
      expect(dbCallTime).not.toBeNull();
      expect(redisCallTime).not.toBeNull();
      if (dbCallTime && redisCallTime) {
        expect(Math.abs(dbCallTime - redisCallTime)).toBeLessThan(20);
      }
    });
  });

  describe('Version Information', () => {
    it('should include application version', async () => {
      const mockQuery = vi.fn().mockResolvedValue({ rows: [{ health_check: 1 }] });
      (getPool as any).mockReturnValue({ query: mockQuery });

      const mockPing = vi.fn().mockResolvedValue('PONG');
      (getRedisClient as any).mockResolvedValue({ ping: mockPing });

      const response = await GET({} as any);
      const body = await response.json();

      expect(body.version).toBe('0.0.1');
      expect(typeof body.version).toBe('string');
    });
  });

  describe('Load Balancer Compatibility', () => {
    it('should return 200 for healthy systems (load balancer will route traffic)', async () => {
      const mockQuery = vi.fn().mockResolvedValue({ rows: [{ health_check: 1 }] });
      (getPool as any).mockReturnValue({ query: mockQuery });

      const mockPing = vi.fn().mockResolvedValue('PONG');
      (getRedisClient as any).mockResolvedValue({ ping: mockPing });

      const response = await GET({} as any);

      expect(response.status).toBe(200);
    });

    it('should return 503 for unhealthy systems (load balancer will not route traffic)', async () => {
      (getPool as any).mockReturnValue({
        query: vi.fn().mockRejectedValue(new Error('DB down')),
      });

      const mockPing = vi.fn().mockResolvedValue('PONG');
      (getRedisClient as any).mockResolvedValue({ ping: mockPing });

      const response = await GET({} as any);

      expect(response.status).toBe(503);
    });

    it('should return 503 for degraded systems (load balancer will not route traffic)', async () => {
      const mockQuery = vi.fn().mockResolvedValue({ rows: [{ health_check: 1 }] });
      (getPool as any).mockReturnValue({ query: mockQuery });

      (getRedisClient as any).mockRejectedValue(new Error('Redis down'));

      const response = await GET({} as any);

      expect(response.status).toBe(503);
    });
  });
});
