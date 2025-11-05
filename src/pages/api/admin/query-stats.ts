/**
 * T213: Query Statistics API
 *
 * Admin-only endpoint to view database query performance statistics
 *
 * GET /api/admin/query-stats
 * - Returns query performance metrics
 * - Total queries, averages, slow queries
 * - Cache hit rates (if available)
 */

import type { APIRoute } from 'astro';
import { verifyAdmin } from '@/lib/adminAuth';
import { getQueryStatistics, PERFORMANCE_THRESHOLDS } from '@/lib/queryProfiler';
import { getCacheStats } from '@/lib/redis';
import { logger } from '@/lib/logger';

/**
 * GET /api/admin/query-stats
 *
 * Returns query performance statistics
 */
export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    // Verify admin authentication
    const adminResult = await verifyAdmin(request, cookies);
    if (!adminResult.isValid || !adminResult.user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get query profiler statistics
    const queryStats = getQueryStatistics();

    // Get cache statistics
    let cacheStats = null;
    try {
      cacheStats = await getCacheStats();
    } catch (error) {
      logger.warn('Failed to fetch cache stats:', error);
    }

    // Calculate cache hit rate
    let cacheHitRate = 0;
    if (cacheStats && cacheStats.hits !== undefined && cacheStats.misses !== undefined) {
      const totalCacheOps = cacheStats.hits + cacheStats.misses;
      if (totalCacheOps > 0) {
        cacheHitRate = (cacheStats.hits / totalCacheOps) * 100;
      }
    }

    // Build response
    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      query: {
        totalQueries: queryStats.totalQueries,
        averageQueriesPerRequest: parseFloat(queryStats.averageQueriesPerRequest.toFixed(2)),
        slowQueries: queryStats.slowQueries,
        slowQueryThresholdMs: PERFORMANCE_THRESHOLDS.SLOW_QUERY_MS,
        n1Threshold: PERFORMANCE_THRESHOLDS.N1_THRESHOLD,
        maxQueriesPerRequest: PERFORMANCE_THRESHOLDS.MAX_QUERIES_PER_REQUEST,
        slowQueryPercentage:
          queryStats.totalQueries > 0
            ? parseFloat(((queryStats.slowQueries / queryStats.totalQueries) * 100).toFixed(2))
            : 0,
      },
      cache: cacheStats
        ? {
            hitRate: parseFloat(cacheHitRate.toFixed(2)),
            hits: cacheStats.hits || 0,
            misses: cacheStats.misses || 0,
            totalKeys: cacheStats.totalKeys || 0,
            keysByNamespace: cacheStats.keysByNamespace || {},
          }
        : null,
      performance: {
        status: getPerformanceStatus(queryStats, cacheHitRate),
        recommendations: getRecommendations(queryStats, cacheHitRate),
      },
    };

    logger.info('Query stats retrieved by admin', {
      adminId: adminResult.user.id,
      adminEmail: adminResult.user.email,
      totalQueries: queryStats.totalQueries,
      slowQueries: queryStats.slowQueries,
    });

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    logger.error('Error fetching query stats:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch query statistics',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

/**
 * Determine overall performance status
 */
function getPerformanceStatus(
  queryStats: ReturnType<typeof getQueryStatistics>,
  cacheHitRate: number
): 'excellent' | 'good' | 'fair' | 'poor' {
  const { totalQueries, averageQueriesPerRequest, slowQueries } = queryStats;

  // Calculate metrics
  const slowQueryPercentage = totalQueries > 0 ? (slowQueries / totalQueries) * 100 : 0;

  // Excellent: Low queries per request, minimal slow queries, high cache hit rate
  if (
    averageQueriesPerRequest < 5 &&
    slowQueryPercentage < 5 &&
    cacheHitRate > 80
  ) {
    return 'excellent';
  }

  // Good: Moderate queries per request, few slow queries, decent cache hit rate
  if (
    averageQueriesPerRequest < 10 &&
    slowQueryPercentage < 10 &&
    cacheHitRate > 60
  ) {
    return 'good';
  }

  // Fair: Higher queries but manageable
  if (
    averageQueriesPerRequest < PERFORMANCE_THRESHOLDS.MAX_QUERIES_PER_REQUEST &&
    slowQueryPercentage < 20
  ) {
    return 'fair';
  }

  // Poor: Needs optimization
  return 'poor';
}

/**
 * Generate performance recommendations
 */
function getRecommendations(
  queryStats: ReturnType<typeof getQueryStatistics>,
  cacheHitRate: number
): string[] {
  const recommendations: string[] = [];
  const { totalQueries, averageQueriesPerRequest, slowQueries } = queryStats;

  // High query count per request
  if (averageQueriesPerRequest > PERFORMANCE_THRESHOLDS.MAX_QUERIES_PER_REQUEST) {
    recommendations.push(
      `High average queries per request (${averageQueriesPerRequest.toFixed(1)}). Consider using JOINs to reduce query count.`
    );
  } else if (averageQueriesPerRequest > 20) {
    recommendations.push(
      `Moderate query count per request (${averageQueriesPerRequest.toFixed(1)}). Review for potential N+1 patterns.`
    );
  }

  // Slow queries
  const slowQueryPercentage = totalQueries > 0 ? (slowQueries / totalQueries) * 100 : 0;
  if (slowQueryPercentage > 20) {
    recommendations.push(
      `${slowQueryPercentage.toFixed(1)}% of queries are slow (>${PERFORMANCE_THRESHOLDS.SLOW_QUERY_MS}ms). Add indexes or optimize query structure.`
    );
  } else if (slowQueryPercentage > 10) {
    recommendations.push(
      `${slowQueryPercentage.toFixed(1)}% of queries are slow. Consider adding indexes for frequently accessed columns.`
    );
  }

  // Cache hit rate
  if (cacheHitRate < 50) {
    recommendations.push(
      `Low cache hit rate (${cacheHitRate.toFixed(1)}%). Increase TTL or review cache invalidation strategy.`
    );
  } else if (cacheHitRate < 70) {
    recommendations.push(
      `Moderate cache hit rate (${cacheHitRate.toFixed(1)}%). Consider extending TTL for stable data.`
    );
  }

  // No issues found
  if (recommendations.length === 0) {
    recommendations.push('Performance metrics look good. Continue monitoring for trends.');
  }

  return recommendations;
}
