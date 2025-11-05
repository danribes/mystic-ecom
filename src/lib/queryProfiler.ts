/**
 * T213: Query Profiler - Database Query Optimization and N+1 Detection
 *
 * Utilities for:
 * - Query performance monitoring
 * - N+1 query pattern detection
 * - Query timing and logging
 * - Performance analysis
 */

import { logger } from './logger';

/**
 * Query execution record
 */
export interface QueryRecord {
  query: string;
  params?: any[];
  duration: number;
  timestamp: Date;
  stackTrace?: string;
}

/**
 * Query profile for a request
 */
export interface QueryProfile {
  requestId: string;
  queries: QueryRecord[];
  totalDuration: number;
  queryCount: number;
  potentialN1: boolean;
}

// Store query records per request
const queryRecords = new Map<string, QueryRecord[]>();

// Performance thresholds
export const PERFORMANCE_THRESHOLDS = {
  SLOW_QUERY_MS: 100,      // Queries taking longer than 100ms
  N1_THRESHOLD: 10,         // More than 10 similar queries suggests N+1
  MAX_QUERIES_PER_REQUEST: 50,  // Warning if more than 50 queries
};

/**
 * Generate a unique request ID
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Start profiling a request
 *
 * @param requestId - Unique request identifier
 */
export function startProfiling(requestId: string): void {
  if (!queryRecords.has(requestId)) {
    queryRecords.set(requestId, []);
  }
}

/**
 * Record a query execution
 *
 * @param requestId - Request identifier
 * @param query - SQL query string
 * @param duration - Execution time in milliseconds
 * @param params - Query parameters
 */
export function recordQuery(
  requestId: string,
  query: string,
  duration: number,
  params?: any[]
): void {
  if (!queryRecords.has(requestId)) {
    queryRecords.set(requestId, []);
  }

  const records = queryRecords.get(requestId)!;
  records.push({
    query: normalizeQuery(query),
    params,
    duration,
    timestamp: new Date(),
    stackTrace: process.env.NODE_ENV === 'development' ? getStackTrace() : undefined,
  });

  // Log slow queries immediately
  if (duration > PERFORMANCE_THRESHOLDS.SLOW_QUERY_MS) {
    logger.warn(`Slow query detected (${duration}ms):`, {
      requestId,
      query: normalizeQuery(query),
      duration,
    });
  }
}

/**
 * Finish profiling and get profile
 *
 * @param requestId - Request identifier
 * @returns Query profile with analysis
 */
export function finishProfiling(requestId: string): QueryProfile | null {
  const records = queryRecords.get(requestId);
  if (!records || records.length === 0) {
    return null;
  }

  const totalDuration = records.reduce((sum, r) => sum + r.duration, 0);
  const queryCount = records.length;

  // Detect potential N+1 patterns
  const potentialN1 = detectN1Pattern(records);

  // Log warnings
  if (queryCount > PERFORMANCE_THRESHOLDS.MAX_QUERIES_PER_REQUEST) {
    logger.warn(`High query count detected: ${queryCount} queries in request ${requestId}`);
  }

  if (potentialN1) {
    logger.warn(`Potential N+1 query pattern detected in request ${requestId}`);
  }

  const profile: QueryProfile = {
    requestId,
    queries: records,
    totalDuration,
    queryCount,
    potentialN1,
  };

  // Cleanup
  queryRecords.delete(requestId);

  return profile;
}

/**
 * Clear all profiling data
 */
export function clearProfilingData(): void {
  queryRecords.clear();
}

/**
 * Normalize query for comparison (remove whitespace, lowercase)
 */
function normalizeQuery(query: string): string {
  return query
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * Detect N+1 query patterns
 *
 * N+1 occurs when:
 * 1. Similar queries executed multiple times
 * 2. Queries differ only in parameter values
 * 3. Executed in rapid succession
 */
function detectN1Pattern(records: QueryRecord[]): boolean {
  // Group queries by normalized pattern
  const queryPatterns = new Map<string, number>();

  for (const record of records) {
    const pattern = extractQueryPattern(record.query);
    queryPatterns.set(pattern, (queryPatterns.get(pattern) || 0) + 1);
  }

  // Check if any pattern exceeds threshold
  for (const count of queryPatterns.values()) {
    if (count >= PERFORMANCE_THRESHOLDS.N1_THRESHOLD) {
      return true;
    }
  }

  return false;
}

/**
 * Extract query pattern (replace parameter placeholders)
 *
 * SELECT * FROM users WHERE id = $1 -> SELECT * FROM users WHERE id = $X
 */
function extractQueryPattern(query: string): string {
  return query.replace(/\$\d+/g, '$X');
}

/**
 * Get stack trace for debugging
 */
function getStackTrace(): string {
  const stack = new Error().stack || '';
  const lines = stack.split('\n').slice(3, 8); // Skip first 3 lines
  return lines.join('\n');
}

/**
 * Measure query execution time
 *
 * @param fn - Async function to execute
 * @param requestId - Request identifier
 * @param queryDescription - Description of the query
 * @returns Result and duration
 */
export async function measureQuery<T>(
  fn: () => Promise<T>,
  requestId: string,
  queryDescription: string
): Promise<T> {
  const start = Date.now();

  try {
    const result = await fn();
    const duration = Date.now() - start;

    recordQuery(requestId, queryDescription, duration);

    return result;
  } catch (error) {
    const duration = Date.now() - start;
    recordQuery(requestId, `${queryDescription} [ERROR]`, duration);
    throw error;
  }
}

/**
 * Analyze query profile and generate recommendations
 *
 * @param profile - Query profile to analyze
 * @returns Array of recommendations
 */
export function analyzeProfile(profile: QueryProfile): string[] {
  const recommendations: string[] = [];

  // High query count
  if (profile.queryCount > PERFORMANCE_THRESHOLDS.MAX_QUERIES_PER_REQUEST) {
    recommendations.push(
      `High query count (${profile.queryCount}). Consider using JOINs to reduce queries.`
    );
  }

  // Slow total duration
  if (profile.totalDuration > 1000) {
    recommendations.push(
      `Total query time is ${profile.totalDuration}ms. Consider adding caching or optimizing queries.`
    );
  }

  // N+1 pattern detected
  if (profile.potentialN1) {
    recommendations.push(
      'Potential N+1 query pattern detected. Review query logs and add JOINs to fetch related data.'
    );
  }

  // Slow individual queries
  const slowQueries = profile.queries.filter(
    q => q.duration > PERFORMANCE_THRESHOLDS.SLOW_QUERY_MS
  );
  if (slowQueries.length > 0) {
    recommendations.push(
      `${slowQueries.length} slow queries detected. Consider adding indexes or optimizing query structure.`
    );
  }

  return recommendations;
}

/**
 * Format query profile for logging
 *
 * @param profile - Query profile
 * @returns Formatted string
 */
export function formatProfile(profile: QueryProfile): string {
  const lines: string[] = [];

  lines.push(`Query Profile: ${profile.requestId}`);
  lines.push(`Total Queries: ${profile.queryCount}`);
  lines.push(`Total Duration: ${profile.totalDuration}ms`);
  lines.push(`Potential N+1: ${profile.potentialN1 ? 'YES' : 'NO'}`);
  lines.push('');

  // Group queries by pattern
  const patterns = new Map<string, { count: number; totalTime: number }>();
  for (const record of profile.queries) {
    const pattern = extractQueryPattern(record.query);
    const existing = patterns.get(pattern) || { count: 0, totalTime: 0 };
    patterns.set(pattern, {
      count: existing.count + 1,
      totalTime: existing.totalTime + record.duration,
    });
  }

  lines.push('Query Patterns:');
  for (const [pattern, stats] of patterns.entries()) {
    lines.push(
      `  ${stats.count}x (${stats.totalTime}ms): ${pattern.substring(0, 80)}...`
    );
  }

  // Recommendations
  const recommendations = analyzeProfile(profile);
  if (recommendations.length > 0) {
    lines.push('');
    lines.push('Recommendations:');
    recommendations.forEach(rec => lines.push(`  - ${rec}`));
  }

  return lines.join('\n');
}

/**
 * Get query statistics across all recorded profiles
 */
export function getQueryStatistics(): {
  totalQueries: number;
  averageQueriesPerRequest: number;
  slowQueries: number;
} {
  let totalQueries = 0;
  let slowQueries = 0;
  let requestCount = 0;

  for (const records of queryRecords.values()) {
    requestCount++;
    totalQueries += records.length;
    slowQueries += records.filter(
      r => r.duration > PERFORMANCE_THRESHOLDS.SLOW_QUERY_MS
    ).length;
  }

  return {
    totalQueries,
    averageQueriesPerRequest: requestCount > 0 ? totalQueries / requestCount : 0,
    slowQueries,
  };
}
