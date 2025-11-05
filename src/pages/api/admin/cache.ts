/**
 * T212: Cache Management Admin API
 *
 * Admin endpoint for cache management operations:
 * - View cache statistics
 * - Invalidate specific namespaces
 * - Flush all caches
 *
 * GET /api/admin/cache - Get cache statistics
 * POST /api/admin/cache - Invalidate or flush caches
 */

import type { APIRoute } from 'astro';
import { verifyAdmin } from '@/lib/admin';
import {
  getCacheStats,
  invalidateNamespace,
  flushAllCache,
  CacheNamespace,
} from '@/lib/redis';
import { logger } from '@/lib/logger';

/**
 * GET /api/admin/cache
 *
 * Get cache statistics including:
 * - Total number of keys
 * - Keys by namespace
 * - Memory usage
 */
export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    // Verify admin authentication
    const adminResult = await verifyAdmin(request, cookies);
    if (!adminResult.isValid || !adminResult.user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Get cache statistics
    const stats = await getCacheStats();

    logger.info(`Admin ${adminResult.user.email} retrieved cache statistics`);

    return new Response(
      JSON.stringify({
        success: true,
        stats,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    logger.error('Error getting cache stats:', error as Error);
    return new Response(
      JSON.stringify({
        error: 'Failed to get cache statistics',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

/**
 * POST /api/admin/cache
 *
 * Invalidate or flush caches
 *
 * Request body:
 * {
 *   action: 'invalidate' | 'flush',
 *   namespace?: 'products' | 'courses' | 'events' | 'cart' | 'user'
 * }
 *
 * Actions:
 * - invalidate: Delete all keys in specified namespace (requires namespace)
 * - flush: Delete ALL keys in Redis (dangerous!)
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Verify admin authentication
    const adminResult = await verifyAdmin(request, cookies);
    if (!adminResult.isValid || !adminResult.user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse request body
    const body = await request.json();
    const { action, namespace } = body;

    // Validate action
    if (!action || !['invalidate', 'flush'].includes(action)) {
      return new Response(
        JSON.stringify({
          error: 'Invalid action',
          message: 'Action must be "invalidate" or "flush"',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    let result: { success: boolean; keysDeleted?: number; message: string };

    if (action === 'flush') {
      // Flush all caches
      logger.warn(`Admin ${adminResult.user.email} initiated FULL CACHE FLUSH`);
      const success = await flushAllCache();

      result = {
        success,
        message: success
          ? 'All caches flushed successfully'
          : 'Failed to flush caches',
      };
    } else {
      // Invalidate specific namespace
      if (!namespace) {
        return new Response(
          JSON.stringify({
            error: 'Namespace required',
            message: 'Namespace is required for invalidate action',
            validNamespaces: Object.values(CacheNamespace),
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // Validate namespace
      const validNamespaces = Object.values(CacheNamespace);
      if (!validNamespaces.includes(namespace)) {
        return new Response(
          JSON.stringify({
            error: 'Invalid namespace',
            message: `Namespace must be one of: ${validNamespaces.join(', ')}`,
            validNamespaces,
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      logger.info(`Admin ${adminResult.user.email} invalidating cache namespace: ${namespace}`);
      const keysDeleted = await invalidateNamespace(namespace);

      result = {
        success: true,
        keysDeleted,
        message: `Invalidated ${keysDeleted} keys in ${namespace} namespace`,
      };
    }

    return new Response(
      JSON.stringify(result),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    logger.error('Error managing cache:', error as Error);
    return new Response(
      JSON.stringify({
        error: 'Failed to manage cache',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
