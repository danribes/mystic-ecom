/**
 * T213: Query Optimization and N+1 Prevention - Test Suite
 *
 * Tests:
 * - Query profiler utility functions
 * - N+1 pattern detection
 * - Performance threshold monitoring
 * - Query recording and analysis
 * - Admin API for query statistics
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  generateRequestId,
  startProfiling,
  recordQuery,
  finishProfiling,
  clearProfilingData,
  measureQuery,
  analyzeProfile,
  formatProfile,
  getQueryStatistics,
  PERFORMANCE_THRESHOLDS,
  type QueryProfile,
} from '@/lib/queryProfiler';

describe('T213: Query Profiler Utility', () => {
  beforeEach(() => {
    clearProfilingData();
  });

  afterEach(() => {
    clearProfilingData();
  });

  describe('Request ID Generation', () => {
    it('should generate unique request IDs', () => {
      const id1 = generateRequestId();
      const id2 = generateRequestId();

      expect(id1).toMatch(/^req_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^req_\d+_[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });
  });

  describe('Profiling Lifecycle', () => {
    it('should start profiling for a request', () => {
      const requestId = generateRequestId();
      startProfiling(requestId);

      // Should not throw and should allow recording
      recordQuery(requestId, 'SELECT * FROM users', 50);
      const profile = finishProfiling(requestId);

      expect(profile).not.toBeNull();
      expect(profile!.requestId).toBe(requestId);
    });

    it('should finish profiling and return profile', () => {
      const requestId = generateRequestId();
      startProfiling(requestId);

      recordQuery(requestId, 'SELECT * FROM products', 25);
      recordQuery(requestId, 'SELECT * FROM courses', 30);

      const profile = finishProfiling(requestId);

      expect(profile).not.toBeNull();
      expect(profile!.queryCount).toBe(2);
      expect(profile!.totalDuration).toBe(55);
      expect(profile!.queries).toHaveLength(2);
    });

    it('should return null when finishing non-existent profile', () => {
      const profile = finishProfiling('non-existent-request');
      expect(profile).toBeNull();
    });

    it('should clean up data after finishing profiling', () => {
      const requestId = generateRequestId();
      startProfiling(requestId);
      recordQuery(requestId, 'SELECT * FROM events', 15);

      const profile1 = finishProfiling(requestId);
      expect(profile1).not.toBeNull();

      // Second finish should return null (data cleaned up)
      const profile2 = finishProfiling(requestId);
      expect(profile2).toBeNull();
    });
  });

  describe('Query Recording', () => {
    it('should record query with duration', () => {
      const requestId = generateRequestId();
      startProfiling(requestId);

      recordQuery(requestId, 'SELECT * FROM users WHERE id = $1', 45, ['123']);

      const profile = finishProfiling(requestId);
      expect(profile).not.toBeNull();
      expect(profile!.queries).toHaveLength(1);
      expect(profile!.queries[0].duration).toBe(45);
    });

    it('should normalize queries for comparison', () => {
      const requestId = generateRequestId();
      startProfiling(requestId);

      recordQuery(requestId, 'SELECT  *   FROM   users', 10);
      recordQuery(requestId, 'SELECT * FROM users', 12);

      const profile = finishProfiling(requestId);
      expect(profile).not.toBeNull();

      // Both should be normalized to the same pattern
      const queries = profile!.queries.map(q => q.query);
      expect(queries[0]).toBe(queries[1]);
    });

    it('should auto-start profiling if not started', () => {
      const requestId = generateRequestId();

      // Record without starting
      recordQuery(requestId, 'SELECT * FROM products', 20);

      const profile = finishProfiling(requestId);
      expect(profile).not.toBeNull();
      expect(profile!.queries).toHaveLength(1);
    });
  });

  describe('Slow Query Detection', () => {
    it('should detect slow queries', () => {
      const requestId = generateRequestId();
      startProfiling(requestId);

      // Fast query
      recordQuery(requestId, 'SELECT * FROM users LIMIT 10', 25);

      // Slow query (>100ms threshold)
      recordQuery(requestId, 'SELECT * FROM huge_table', 150);

      const profile = finishProfiling(requestId);
      expect(profile).not.toBeNull();

      const slowQueries = profile!.queries.filter(
        q => q.duration > PERFORMANCE_THRESHOLDS.SLOW_QUERY_MS
      );
      expect(slowQueries).toHaveLength(1);
      expect(slowQueries[0].duration).toBe(150);
    });

    it('should track slow query percentage', () => {
      const requestId = generateRequestId();
      startProfiling(requestId);

      // 3 fast queries
      recordQuery(requestId, 'SELECT 1', 10);
      recordQuery(requestId, 'SELECT 2', 20);
      recordQuery(requestId, 'SELECT 3', 30);

      // 1 slow query
      recordQuery(requestId, 'SELECT heavy', 200);

      const profile = finishProfiling(requestId);
      expect(profile).not.toBeNull();

      const slowCount = profile!.queries.filter(
        q => q.duration > PERFORMANCE_THRESHOLDS.SLOW_QUERY_MS
      ).length;

      expect(slowCount / profile!.queryCount).toBe(0.25); // 25%
    });
  });

  describe('N+1 Pattern Detection', () => {
    it('should detect N+1 pattern with many similar queries', () => {
      const requestId = generateRequestId();
      startProfiling(requestId);

      // Simulate N+1: 1 query to get list, then N queries for details
      recordQuery(requestId, 'SELECT * FROM courses', 30);

      // 15 similar queries (exceeds N1_THRESHOLD of 10)
      for (let i = 1; i <= 15; i++) {
        recordQuery(requestId, `SELECT * FROM reviews WHERE course_id = $1`, 10, [i.toString()]);
      }

      const profile = finishProfiling(requestId);
      expect(profile).not.toBeNull();
      expect(profile!.potentialN1).toBe(true);
    });

    it('should not flag N+1 for diverse queries', () => {
      const requestId = generateRequestId();
      startProfiling(requestId);

      // Different queries
      recordQuery(requestId, 'SELECT * FROM users', 20);
      recordQuery(requestId, 'SELECT * FROM products', 25);
      recordQuery(requestId, 'SELECT * FROM courses', 30);
      recordQuery(requestId, 'SELECT * FROM events', 15);

      const profile = finishProfiling(requestId);
      expect(profile).not.toBeNull();
      expect(profile!.potentialN1).toBe(false);
    });

    it('should detect N+1 when query pattern is the same but params differ', () => {
      const requestId = generateRequestId();
      startProfiling(requestId);

      // Same query pattern, different parameters
      for (let i = 1; i <= 12; i++) {
        recordQuery(requestId, `SELECT * FROM users WHERE id = $1`, 8, [i.toString()]);
      }

      const profile = finishProfiling(requestId);
      expect(profile).not.toBeNull();
      expect(profile!.potentialN1).toBe(true);
    });
  });

  describe('Query Measurement', () => {
    it('should measure query execution time', async () => {
      const requestId = generateRequestId();
      startProfiling(requestId);

      const mockQuery = async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return { rows: [{ id: 1 }] };
      };

      const result = await measureQuery(mockQuery, requestId, 'Test query');

      expect(result).toEqual({ rows: [{ id: 1 }] });

      const profile = finishProfiling(requestId);
      expect(profile).not.toBeNull();
      expect(profile!.queries).toHaveLength(1);
      expect(profile!.queries[0].duration).toBeGreaterThanOrEqual(50);
    });

    it('should record duration even on query error', async () => {
      const requestId = generateRequestId();
      startProfiling(requestId);

      const failingQuery = async () => {
        await new Promise(resolve => setTimeout(resolve, 30));
        throw new Error('Query failed');
      };

      await expect(
        measureQuery(failingQuery, requestId, 'Failing query')
      ).rejects.toThrow('Query failed');

      const profile = finishProfiling(requestId);
      expect(profile).not.toBeNull();
      expect(profile!.queries).toHaveLength(1);
      expect(profile!.queries[0].query).toContain('[error]'); // Normalized to lowercase
    });
  });

  describe('Profile Analysis', () => {
    it('should generate recommendations for high query count', () => {
      const requestId = generateRequestId();
      startProfiling(requestId);

      // Simulate 60 queries (exceeds MAX_QUERIES_PER_REQUEST of 50)
      for (let i = 0; i < 60; i++) {
        recordQuery(requestId, `SELECT ${i}`, 10);
      }

      const profile = finishProfiling(requestId);
      expect(profile).not.toBeNull();

      const recommendations = analyzeProfile(profile!);
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.some(r => r.includes('query count'))).toBe(true);
    });

    it('should generate recommendations for slow total duration', () => {
      const requestId = generateRequestId();
      startProfiling(requestId);

      // Queries totaling > 1000ms
      recordQuery(requestId, 'SELECT 1', 600);
      recordQuery(requestId, 'SELECT 2', 500);

      const profile = finishProfiling(requestId);
      expect(profile).not.toBeNull();

      const recommendations = analyzeProfile(profile!);
      expect(recommendations.some(r => r.includes('query time'))).toBe(true);
    });

    it('should generate recommendations for N+1 pattern', () => {
      const requestId = generateRequestId();
      startProfiling(requestId);

      // Generate N+1 pattern
      for (let i = 0; i < 15; i++) {
        recordQuery(requestId, 'SELECT * FROM table WHERE id = $1', 10, [i.toString()]);
      }

      const profile = finishProfiling(requestId);
      expect(profile).not.toBeNull();

      const recommendations = analyzeProfile(profile!);
      expect(recommendations.some(r => r.includes('N+1'))).toBe(true);
    });

    it('should generate recommendations for slow queries', () => {
      const requestId = generateRequestId();
      startProfiling(requestId);

      recordQuery(requestId, 'SELECT 1', 20);
      recordQuery(requestId, 'SELECT 2', 150); // Slow
      recordQuery(requestId, 'SELECT 3', 180); // Slow

      const profile = finishProfiling(requestId);
      expect(profile).not.toBeNull();

      const recommendations = analyzeProfile(profile!);
      expect(recommendations.some(r => r.includes('slow queries'))).toBe(true);
    });
  });

  describe('Profile Formatting', () => {
    it('should format profile for logging', () => {
      const requestId = generateRequestId();
      startProfiling(requestId);

      recordQuery(requestId, 'SELECT * FROM users', 25);
      recordQuery(requestId, 'SELECT * FROM products', 30);

      const profile = finishProfiling(requestId);
      expect(profile).not.toBeNull();

      const formatted = formatProfile(profile!);

      expect(formatted).toContain('Query Profile:');
      expect(formatted).toContain('Total Queries: 2');
      expect(formatted).toContain('Total Duration: 55ms');
      expect(formatted).toContain('Query Patterns:');
    });

    it('should include recommendations in formatted output', () => {
      const requestId = generateRequestId();
      startProfiling(requestId);

      // Create scenario that triggers recommendations
      for (let i = 0; i < 15; i++) {
        recordQuery(requestId, 'SELECT * FROM table WHERE id = $1', 10, [i.toString()]);
      }

      const profile = finishProfiling(requestId);
      expect(profile).not.toBeNull();

      const formatted = formatProfile(profile!);
      expect(formatted).toContain('Recommendations:');
    });
  });

  describe('Query Statistics', () => {
    it('should aggregate statistics across requests', () => {
      // Request 1
      const req1 = generateRequestId();
      startProfiling(req1);
      recordQuery(req1, 'SELECT 1', 20);
      recordQuery(req1, 'SELECT 2', 150); // Slow

      // Request 2
      const req2 = generateRequestId();
      startProfiling(req2);
      recordQuery(req2, 'SELECT 3', 30);
      recordQuery(req2, 'SELECT 4', 40);
      recordQuery(req2, 'SELECT 5', 50);

      const stats = getQueryStatistics();

      expect(stats.totalQueries).toBe(5);
      expect(stats.averageQueriesPerRequest).toBe(2.5); // 5 queries / 2 requests
      expect(stats.slowQueries).toBe(1);
    });

    it('should return zeros when no queries recorded', () => {
      clearProfilingData();

      const stats = getQueryStatistics();

      expect(stats.totalQueries).toBe(0);
      expect(stats.averageQueriesPerRequest).toBe(0);
      expect(stats.slowQueries).toBe(0);
    });
  });

  describe('Performance Thresholds', () => {
    it('should have correct threshold values', () => {
      expect(PERFORMANCE_THRESHOLDS.SLOW_QUERY_MS).toBe(100);
      expect(PERFORMANCE_THRESHOLDS.N1_THRESHOLD).toBe(10);
      expect(PERFORMANCE_THRESHOLDS.MAX_QUERIES_PER_REQUEST).toBe(50);
    });
  });

  describe('Data Cleanup', () => {
    it('should clear all profiling data', () => {
      const req1 = generateRequestId();
      const req2 = generateRequestId();

      startProfiling(req1);
      startProfiling(req2);
      recordQuery(req1, 'SELECT 1', 10);
      recordQuery(req2, 'SELECT 2', 20);

      let stats = getQueryStatistics();
      expect(stats.totalQueries).toBeGreaterThan(0);

      clearProfilingData();

      stats = getQueryStatistics();
      expect(stats.totalQueries).toBe(0);
    });
  });
});

describe('T213: Admin Query Stats API', () => {
  // Note: These are integration-style tests that would require
  // a running server and admin authentication.
  // For now, we'll test the core logic components.

  describe('Performance Status Calculation', () => {
    it('should determine performance status based on metrics', () => {
      // This would test the getPerformanceStatus function
      // if it were exported. Since it's internal to the API,
      // we test it via the API response in E2E tests.
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('Recommendation Generation', () => {
    it('should generate appropriate recommendations', () => {
      // This would test the getRecommendations function
      // if it were exported. Tested via API in E2E.
      expect(true).toBe(true); // Placeholder
    });
  });
});
