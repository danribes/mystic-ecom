/**
 * Unit Tests for Database Query Optimization
 * Task T140: Optimize database queries (add indexes, analyze slow queries)
 *
 * Tests cover:
 * - Query profiling and logging
 * - N+1 query detection
 * - Slow query identification
 * - Query normalization
 * - Performance analysis
 * - Recommendation generation
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  generateRequestId,
  startProfiling,
  recordQuery,
  finishProfiling,
  clearProfilingData,
  analyzeProfile,
  formatProfile,
  getQueryStatistics,
  measureQuery,
  PERFORMANCE_THRESHOLDS,
  type QueryProfile,
} from '../../src/lib/queryProfiler';

describe('Query Profiler - Request ID Generation', () => {
  it('should generate unique request IDs', () => {
    const id1 = generateRequestId();
    const id2 = generateRequestId();

    expect(id1).toBeTruthy();
    expect(id2).toBeTruthy();
    expect(id1).not.toBe(id2);
  });

  it('should generate IDs with correct format', () => {
    const id = generateRequestId();
    expect(id).toMatch(/^req_\d+_[a-z0-9]+$/);
  });
});

describe('Query Profiler - Basic Profiling', () => {
  beforeEach(() => {
    clearProfilingData();
  });

  afterEach(() => {
    clearProfilingData();
  });

  it('should start profiling for a request', () => {
    const requestId = 'test-request-1';
    startProfiling(requestId);

    // With no queries recorded, finishProfiling returns null
    const profile = finishProfiling(requestId);
    expect(profile).toBeNull();
  });

  it('should record a single query', () => {
    const requestId = 'test-request-2';
    startProfiling(requestId);

    recordQuery(requestId, 'SELECT * FROM users WHERE id = $1', 50, ['123']);

    const profile = finishProfiling(requestId);
    expect(profile).toBeTruthy();
    expect(profile?.queryCount).toBe(1);
    expect(profile?.queries[0].duration).toBe(50);
  });

  it('should record multiple queries', () => {
    const requestId = 'test-request-3';
    startProfiling(requestId);

    recordQuery(requestId, 'SELECT * FROM users WHERE id = $1', 30, ['1']);
    recordQuery(requestId, 'SELECT * FROM courses WHERE user_id = $1', 45, ['1']);
    recordQuery(requestId, 'SELECT * FROM orders WHERE user_id = $1', 60, ['1']);

    const profile = finishProfiling(requestId);
    expect(profile).toBeTruthy();
    expect(profile?.queryCount).toBe(3);
    expect(profile?.totalDuration).toBe(135);
  });

  it('should calculate total duration correctly', () => {
    const requestId = 'test-request-4';
    startProfiling(requestId);

    recordQuery(requestId, 'SELECT * FROM users', 25);
    recordQuery(requestId, 'SELECT * FROM courses', 50);
    recordQuery(requestId, 'SELECT * FROM products', 75);

    const profile = finishProfiling(requestId);
    expect(profile?.totalDuration).toBe(150);
  });

  it('should auto-create profiling session if not started', () => {
    const requestId = 'test-request-5';
    // Don't call startProfiling

    recordQuery(requestId, 'SELECT * FROM users', 30);

    const profile = finishProfiling(requestId);
    expect(profile).toBeTruthy();
    expect(profile?.queryCount).toBe(1);
  });
});

describe('Query Profiler - Slow Query Detection', () => {
  beforeEach(() => {
    clearProfilingData();
  });

  afterEach(() => {
    clearProfilingData();
  });

  it('should detect slow queries above threshold', () => {
    const requestId = 'test-slow-1';
    startProfiling(requestId);

    // Fast query
    recordQuery(requestId, 'SELECT * FROM users WHERE id = $1', 50);

    // Slow query
    recordQuery(requestId, 'SELECT * FROM courses WITH COMPLEX JOIN', 150);

    const profile = finishProfiling(requestId);
    expect(profile).toBeTruthy();

    const slowQueries = profile?.queries.filter(
      q => q.duration > PERFORMANCE_THRESHOLDS.SLOW_QUERY_MS
    );
    expect(slowQueries).toHaveLength(1);
    expect(slowQueries?.[0].duration).toBe(150);
  });

  it('should handle queries at exact threshold', () => {
    const requestId = 'test-slow-2';
    startProfiling(requestId);

    recordQuery(requestId, 'SELECT * FROM users', PERFORMANCE_THRESHOLDS.SLOW_QUERY_MS);

    const profile = finishProfiling(requestId);
    const slowQueries = profile?.queries.filter(
      q => q.duration > PERFORMANCE_THRESHOLDS.SLOW_QUERY_MS
    );

    // At threshold is not considered slow (only >)
    expect(slowQueries).toHaveLength(0);
  });
});

describe('Query Profiler - N+1 Query Detection', () => {
  beforeEach(() => {
    clearProfilingData();
  });

  afterEach(() => {
    clearProfilingData();
  });

  it('should detect N+1 query pattern', () => {
    const requestId = 'test-n1-1';
    startProfiling(requestId);

    // Simulate N+1: one query for list, then N queries for each item
    recordQuery(requestId, 'SELECT * FROM users', 30);

    // Execute same query 15 times with different parameters
    for (let i = 1; i <= 15; i++) {
      recordQuery(requestId, `SELECT * FROM courses WHERE user_id = $1`, 20, [i]);
    }

    const profile = finishProfiling(requestId);
    expect(profile).toBeTruthy();
    expect(profile?.potentialN1).toBe(true);
  });

  it('should not detect N+1 with few queries', () => {
    const requestId = 'test-n1-2';
    startProfiling(requestId);

    // Only 5 similar queries - below threshold
    for (let i = 1; i <= 5; i++) {
      recordQuery(requestId, `SELECT * FROM users WHERE id = $1`, 20, [i]);
    }

    const profile = finishProfiling(requestId);
    expect(profile?.potentialN1).toBe(false);
  });

  it('should detect N+1 at exact threshold', () => {
    const requestId = 'test-n1-3';
    startProfiling(requestId);

    // Exactly 10 queries (threshold)
    for (let i = 1; i <= PERFORMANCE_THRESHOLDS.N1_THRESHOLD; i++) {
      recordQuery(requestId, `SELECT * FROM courses WHERE id = $1`, 15, [i]);
    }

    const profile = finishProfiling(requestId);
    expect(profile?.potentialN1).toBe(true);
  });

  it('should distinguish between different query patterns', () => {
    const requestId = 'test-n1-4';
    startProfiling(requestId);

    // 5 queries of one pattern
    for (let i = 1; i <= 5; i++) {
      recordQuery(requestId, `SELECT * FROM users WHERE id = $1`, 20, [i]);
    }

    // 5 queries of another pattern
    for (let i = 1; i <= 5; i++) {
      recordQuery(requestId, `SELECT * FROM courses WHERE id = $1`, 20, [i]);
    }

    // Neither pattern alone exceeds threshold, so no N+1
    const profile = finishProfiling(requestId);
    expect(profile?.potentialN1).toBe(false);
  });
});

describe('Query Profiler - High Query Count Detection', () => {
  beforeEach(() => {
    clearProfilingData();
  });

  afterEach(() => {
    clearProfilingData();
  });

  it('should detect high query count', () => {
    const requestId = 'test-count-1';
    startProfiling(requestId);

    // Add more than MAX_QUERIES_PER_REQUEST queries
    for (let i = 0; i < PERFORMANCE_THRESHOLDS.MAX_QUERIES_PER_REQUEST + 10; i++) {
      recordQuery(requestId, `SELECT ${i}`, 5);
    }

    const profile = finishProfiling(requestId);
    expect(profile?.queryCount).toBeGreaterThan(PERFORMANCE_THRESHOLDS.MAX_QUERIES_PER_REQUEST);
  });

  it('should handle normal query count', () => {
    const requestId = 'test-count-2';
    startProfiling(requestId);

    // Add reasonable number of queries
    for (let i = 0; i < 10; i++) {
      recordQuery(requestId, `SELECT ${i}`, 5);
    }

    const profile = finishProfiling(requestId);
    expect(profile?.queryCount).toBeLessThanOrEqual(PERFORMANCE_THRESHOLDS.MAX_QUERIES_PER_REQUEST);
  });
});

describe('Query Profiler - Profile Analysis', () => {
  beforeEach(() => {
    clearProfilingData();
  });

  afterEach(() => {
    clearProfilingData();
  });

  it('should generate recommendations for high query count', () => {
    const requestId = 'test-analyze-1';
    startProfiling(requestId);

    for (let i = 0; i < 60; i++) {
      recordQuery(requestId, `SELECT ${i}`, 10);
    }

    const profile = finishProfiling(requestId);
    expect(profile).toBeTruthy();

    const recommendations = analyzeProfile(profile!);
    expect(recommendations.length).toBeGreaterThan(0);
    expect(recommendations.some(r => r.includes('query count'))).toBe(true);
  });

  it('should generate recommendations for slow total duration', () => {
    const requestId = 'test-analyze-2';
    startProfiling(requestId);

    // Queries totaling > 1000ms
    recordQuery(requestId, 'SELECT * FROM users', 600);
    recordQuery(requestId, 'SELECT * FROM courses', 500);

    const profile = finishProfiling(requestId);
    const recommendations = analyzeProfile(profile!);

    expect(recommendations.some(r => r.includes('Total query time'))).toBe(true);
  });

  it('should generate recommendations for N+1 pattern', () => {
    const requestId = 'test-analyze-3';
    startProfiling(requestId);

    for (let i = 0; i < 15; i++) {
      recordQuery(requestId, 'SELECT * FROM users WHERE id = $1', 20, [i]);
    }

    const profile = finishProfiling(requestId);
    const recommendations = analyzeProfile(profile!);

    expect(recommendations.some(r => r.includes('N+1'))).toBe(true);
  });

  it('should generate recommendations for slow queries', () => {
    const requestId = 'test-analyze-4';
    startProfiling(requestId);

    recordQuery(requestId, 'SELECT * FROM courses', 50);
    recordQuery(requestId, 'COMPLEX QUERY', 200);
    recordQuery(requestId, 'ANOTHER SLOW', 150);

    const profile = finishProfiling(requestId);
    const recommendations = analyzeProfile(profile!);

    expect(recommendations.some(r => r.includes('slow queries'))).toBe(true);
  });

  it('should generate no recommendations for good profile', () => {
    const requestId = 'test-analyze-5';
    startProfiling(requestId);

    recordQuery(requestId, 'SELECT * FROM users', 30);
    recordQuery(requestId, 'SELECT * FROM courses', 40);

    const profile = finishProfiling(requestId);
    const recommendations = analyzeProfile(profile!);

    expect(recommendations).toHaveLength(0);
  });
});

describe('Query Profiler - Profile Formatting', () => {
  beforeEach(() => {
    clearProfilingData();
  });

  afterEach(() => {
    clearProfilingData();
  });

  it('should format profile as readable text', () => {
    const requestId = 'test-format-1';
    startProfiling(requestId);

    recordQuery(requestId, 'SELECT * FROM users WHERE id = $1', 30, ['1']);
    recordQuery(requestId, 'SELECT * FROM users WHERE id = $1', 35, ['2']);

    const profile = finishProfiling(requestId);
    const formatted = formatProfile(profile!);

    expect(formatted).toContain(requestId);
    expect(formatted).toContain('Total Queries: 2');
    expect(formatted).toContain('Total Duration: 65ms');
  });

  it('should include N+1 detection in formatted output', () => {
    const requestId = 'test-format-2';
    startProfiling(requestId);

    for (let i = 0; i < 12; i++) {
      recordQuery(requestId, 'SELECT * FROM users WHERE id = $1', 20, [i]);
    }

    const profile = finishProfiling(requestId);
    const formatted = formatProfile(profile!);

    expect(formatted).toContain('Potential N+1: YES');
  });

  it('should group queries by pattern', () => {
    const requestId = 'test-format-3';
    startProfiling(requestId);

    recordQuery(requestId, 'SELECT * FROM users WHERE id = $1', 20, ['1']);
    recordQuery(requestId, 'SELECT * FROM users WHERE id = $1', 25, ['2']);
    recordQuery(requestId, 'SELECT * FROM courses WHERE id = $1', 30, ['1']);

    const profile = finishProfiling(requestId);
    const formatted = formatProfile(profile!);

    expect(formatted).toContain('Query Patterns:');
    // Should show patterns grouped
    expect(formatted).toMatch(/2x.*users/i);
    expect(formatted).toMatch(/1x.*courses/i);
  });
});

describe('Query Profiler - Statistics', () => {
  beforeEach(() => {
    clearProfilingData();
  });

  afterEach(() => {
    clearProfilingData();
  });

  it('should calculate statistics across requests', () => {
    const req1 = 'stats-req-1';
    const req2 = 'stats-req-2';

    startProfiling(req1);
    recordQuery(req1, 'SELECT * FROM users', 50);
    recordQuery(req1, 'SELECT * FROM courses', 60);

    startProfiling(req2);
    recordQuery(req2, 'SELECT * FROM products', 70);

    const stats = getQueryStatistics();

    expect(stats.totalQueries).toBe(3);
    expect(stats.averageQueriesPerRequest).toBe(1.5); // 3 queries / 2 requests
  });

  it('should count slow queries in statistics', () => {
    const requestId = 'stats-slow';
    startProfiling(requestId);

    recordQuery(requestId, 'FAST QUERY', 50);
    recordQuery(requestId, 'SLOW QUERY 1', 150);
    recordQuery(requestId, 'SLOW QUERY 2', 200);

    const stats = getQueryStatistics();
    expect(stats.slowQueries).toBe(2);
  });

  it('should handle no queries in statistics', () => {
    clearProfilingData();

    const stats = getQueryStatistics();
    expect(stats.totalQueries).toBe(0);
    expect(stats.averageQueriesPerRequest).toBe(0);
    expect(stats.slowQueries).toBe(0);
  });
});

describe('Query Profiler - Measure Query Helper', () => {
  beforeEach(() => {
    clearProfilingData();
  });

  afterEach(() => {
    clearProfilingData();
  });

  it('should measure async function execution', async () => {
    const requestId = 'measure-1';
    startProfiling(requestId);

    const result = await measureQuery(
      async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return 'result';
      },
      requestId,
      'Test Query'
    );

    expect(result).toBe('result');

    const profile = finishProfiling(requestId);
    expect(profile?.queryCount).toBe(1);
    expect(profile?.queries[0].duration).toBeGreaterThanOrEqual(50);
  });

  it('should record error in query', async () => {
    const requestId = 'measure-error';
    startProfiling(requestId);

    await expect(
      measureQuery(
        async () => {
          throw new Error('Query failed');
        },
        requestId,
        'Failing Query'
      )
    ).rejects.toThrow('Query failed');

    const profile = finishProfiling(requestId);
    expect(profile?.queryCount).toBe(1);
    expect(profile?.queries[0].query).toContain('[error]');
  });
});

describe('Query Profiler - Cleanup', () => {
  it('should clear all profiling data', () => {
    const req1 = 'cleanup-1';
    const req2 = 'cleanup-2';

    startProfiling(req1);
    recordQuery(req1, 'SELECT 1', 10);

    startProfiling(req2);
    recordQuery(req2, 'SELECT 2', 20);

    let stats = getQueryStatistics();
    expect(stats.totalQueries).toBeGreaterThan(0);

    clearProfilingData();

    stats = getQueryStatistics();
    expect(stats.totalQueries).toBe(0);
  });

  it('should return null for finished profiling after cleanup', () => {
    const requestId = 'cleanup-3';
    startProfiling(requestId);
    recordQuery(requestId, 'SELECT 1', 10);

    clearProfilingData();

    const profile = finishProfiling(requestId);
    expect(profile).toBeNull();
  });
});

describe('Query Profiler - Performance Thresholds', () => {
  it('should have correct threshold values', () => {
    expect(PERFORMANCE_THRESHOLDS.SLOW_QUERY_MS).toBe(100);
    expect(PERFORMANCE_THRESHOLDS.N1_THRESHOLD).toBe(10);
    expect(PERFORMANCE_THRESHOLDS.MAX_QUERIES_PER_REQUEST).toBe(50);
  });
});

describe('Query Profiler - Edge Cases', () => {
  beforeEach(() => {
    clearProfilingData();
  });

  afterEach(() => {
    clearProfilingData();
  });

  it('should handle finishing non-existent profiling', () => {
    const profile = finishProfiling('non-existent-request');
    expect(profile).toBeNull();
  });

  it('should handle empty query string', () => {
    const requestId = 'empty-query';
    startProfiling(requestId);

    recordQuery(requestId, '', 10);

    const profile = finishProfiling(requestId);
    expect(profile?.queryCount).toBe(1);
  });

  it('should handle zero duration query', () => {
    const requestId = 'zero-duration';
    startProfiling(requestId);

    recordQuery(requestId, 'SELECT 1', 0);

    const profile = finishProfiling(requestId);
    expect(profile?.totalDuration).toBe(0);
  });

  it('should handle very long query strings', () => {
    const requestId = 'long-query';
    startProfiling(requestId);

    const longQuery = 'SELECT ' + '* FROM users WHERE id IN ('.repeat(100) + ')'.repeat(100);
    recordQuery(requestId, longQuery, 50);

    const profile = finishProfiling(requestId);
    expect(profile?.queryCount).toBe(1);
  });
});
