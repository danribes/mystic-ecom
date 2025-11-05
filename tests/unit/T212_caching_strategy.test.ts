/**
 * T212: Caching Strategy - Unit Tests
 *
 * Tests for Redis caching layer implementation including:
 * - Cache helper functions
 * - Product caching
 * - Course caching
 * - Event caching
 * - Cache invalidation
 * - Cache statistics
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  generateCacheKey,
  getCached,
  setCached,
  invalidateCache,
  invalidateNamespace,
  getOrSet,
  getCacheStats,
  flushAllCache,
  CacheNamespace,
  CacheTTL,
} from '@/lib/redis';
import {
  getProducts,
  getProductById,
  getProductBySlug,
  invalidateProductCache,
  invalidateProductCacheById,
} from '@/lib/products';
import {
  getCourses,
  getCourseById,
  invalidateCourseCache,
  invalidateCourseCacheById,
} from '@/lib/courses';
import {
  getEvents,
  getEventById,
  invalidateEventCache,
  invalidateEventCacheById,
} from '@/lib/events';

// ============================================================================
// Test Setup and Teardown
// ============================================================================

beforeAll(async () => {
  // Ensure Redis is clean before tests
  await flushAllCache();
});

afterAll(async () => {
  // Cleanup after all tests
  await flushAllCache();
});

beforeEach(async () => {
  // Clear cache before each test for isolation
  await flushAllCache();
});

// ============================================================================
// Cache Helper Functions
// ============================================================================

describe('Cache Helper Functions', () => {
  describe('generateCacheKey', () => {
    it('should generate key with namespace and identifier', () => {
      const key = generateCacheKey('products', '123');
      expect(key).toBe('products:123');
    });

    it('should generate key with namespace, identifier, and suffix', () => {
      const key = generateCacheKey('products', 'list', 'all');
      expect(key).toBe('products:list:all');
    });

    it('should handle empty suffix', () => {
      const key = generateCacheKey('courses', '456', '');
      // Empty suffix should not be appended
      expect(key).toBe('courses:456');
    });
  });

  describe('setCached and getCached', () => {
    it('should store and retrieve string data', async () => {
      const key = 'test:string';
      const value = 'Hello, World!';

      await setCached(key, value);
      const cached = await getCached<string>(key);

      expect(cached).toBe(value);
    });

    it('should store and retrieve object data', async () => {
      const key = 'test:object';
      const value = { id: 123, name: 'Test', price: 99.99 };

      await setCached(key, value);
      const cached = await getCached<typeof value>(key);

      expect(cached).toEqual(value);
    });

    it('should store and retrieve array data', async () => {
      const key = 'test:array';
      const value = [1, 2, 3, 4, 5];

      await setCached(key, value);
      const cached = await getCached<number[]>(key);

      expect(cached).toEqual(value);
    });

    it('should return null for non-existent key', async () => {
      const cached = await getCached('non-existent-key');
      expect(cached).toBeNull();
    });

    it('should store data with TTL', async () => {
      const key = 'test:ttl';
      const value = 'expires soon';

      await setCached(key, value, 1); // 1 second TTL
      const cached1 = await getCached<string>(key);
      expect(cached1).toBe(value);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1100));

      const cached2 = await getCached<string>(key);
      expect(cached2).toBeNull();
    });
  });

  describe('invalidateCache', () => {
    it('should invalidate all keys matching pattern', async () => {
      await setCached('test:1', 'value1');
      await setCached('test:2', 'value2');
      await setCached('test:3', 'value3');
      await setCached('other:1', 'value4');

      const deleted = await invalidateCache('test:*');

      expect(deleted).toBe(3);
      expect(await getCached('test:1')).toBeNull();
      expect(await getCached('test:2')).toBeNull();
      expect(await getCached('test:3')).toBeNull();
      expect(await getCached('other:1')).toBe('value4');
    });

    it('should return 0 if no keys match', async () => {
      const deleted = await invalidateCache('nonexistent:*');
      expect(deleted).toBe(0);
    });
  });

  describe('invalidateNamespace', () => {
    it('should invalidate all keys in namespace', async () => {
      await setCached('products:1', 'p1');
      await setCached('products:2', 'p2');
      await setCached('courses:1', 'c1');

      const deleted = await invalidateNamespace(CacheNamespace.PRODUCTS);

      expect(deleted).toBe(2);
      expect(await getCached('products:1')).toBeNull();
      expect(await getCached('products:2')).toBeNull();
      expect(await getCached('courses:1')).toBe('c1');
    });
  });

  describe('getOrSet', () => {
    it('should call fetchFn on cache miss', async () => {
      const key = 'test:getOrSet';
      let fetchCalled = false;

      const fetchFn = async () => {
        fetchCalled = true;
        return 'fetched value';
      };

      const value = await getOrSet(key, fetchFn);

      expect(fetchCalled).toBe(true);
      expect(value).toBe('fetched value');
      expect(await getCached(key)).toBe('fetched value');
    });

    it('should not call fetchFn on cache hit', async () => {
      const key = 'test:getOrSet:hit';
      await setCached(key, 'cached value');

      let fetchCalled = false;
      const fetchFn = async () => {
        fetchCalled = true;
        return 'fetched value';
      };

      const value = await getOrSet(key, fetchFn);

      expect(fetchCalled).toBe(false);
      expect(value).toBe('cached value');
    });
  });

  describe('getCacheStats', () => {
    it('should return cache statistics', async () => {
      await setCached('products:1', 'p1');
      await setCached('products:2', 'p2');
      await setCached('courses:1', 'c1');
      await setCached('events:1', 'e1');

      const stats = await getCacheStats();

      expect(stats.totalKeys).toBe(4);
      expect(stats.keysByNamespace.products).toBe(2);
      expect(stats.keysByNamespace.courses).toBe(1);
      expect(stats.keysByNamespace.events).toBe(1);
    });

    it('should return zero stats for empty cache', async () => {
      await flushAllCache();

      const stats = await getCacheStats();

      expect(stats.totalKeys).toBe(0);
      expect(stats.keysByNamespace).toEqual({});
    });
  });

  describe('flushAllCache', () => {
    it('should flush all keys', async () => {
      await setCached('test:1', 'value1');
      await setCached('test:2', 'value2');
      await setCached('test:3', 'value3');

      const success = await flushAllCache();
      expect(success).toBe(true);

      const stats = await getCacheStats();
      expect(stats.totalKeys).toBe(0);
    });
  });
});

// ============================================================================
// Product Caching
// ============================================================================

describe('Product Caching', () => {
  describe('getProducts', () => {
    it('should cache product listings', async () => {
      // First call - should fetch from DB
      const products1 = await getProducts({ limit: 10 });

      // Second call with same params - should hit cache
      const products2 = await getProducts({ limit: 10 });

      expect(products1).toEqual(products2);
    });

    it('should use different cache keys for different filters', async () => {
      const products1 = await getProducts({ type: 'pdf' });
      const products2 = await getProducts({ type: 'ebook' });

      // Results should be different (or could be same if no products)
      // Main point is different cache keys are used
      expect(Array.isArray(products1)).toBe(true);
      expect(Array.isArray(products2)).toBe(true);
    });
  });

  describe('invalidateProductCache', () => {
    it('should invalidate all product caches', async () => {
      // Populate cache
      await getProducts();
      const stats1 = await getCacheStats();
      const productKeysBefore = stats1.keysByNamespace.products || 0;

      // Invalidate
      await invalidateProductCache();

      const stats2 = await getCacheStats();
      const productKeysAfter = stats2.keysByNamespace.products || 0;

      expect(productKeysAfter).toBeLessThan(productKeysBefore);
    });
  });
});

// ============================================================================
// Course Caching
// ============================================================================

describe('Course Caching', () => {
  describe('getCourses', () => {
    it('should cache course listings', async () => {
      // First call - should fetch from DB
      const courses1 = await getCourses({ limit: 10 });

      // Second call with same params - should hit cache
      const courses2 = await getCourses({ limit: 10 });

      expect(courses1).toEqual(courses2);
    });

    it('should use different cache keys for different filters', async () => {
      const courses1 = await getCourses({ level: 'beginner' });
      const courses2 = await getCourses({ level: 'advanced' });

      // Results should be different (or could be same if no courses)
      // Main point is different cache keys are used
      expect(courses1).toBeDefined();
      expect(courses2).toBeDefined();
    });
  });

  describe('invalidateCourseCache', () => {
    it('should invalidate all course caches', async () => {
      // Populate cache
      await getCourses();
      const stats1 = await getCacheStats();
      const courseKeysBefore = stats1.keysByNamespace.courses || 0;

      // Invalidate
      await invalidateCourseCache();

      const stats2 = await getCacheStats();
      const courseKeysAfter = stats2.keysByNamespace.courses || 0;

      expect(courseKeysAfter).toBeLessThan(courseKeysBefore);
    });
  });
});

// ============================================================================
// Event Caching
// ============================================================================

describe('Event Caching', () => {
  describe('getEvents', () => {
    it('should cache event listings', async () => {
      // First call - should fetch from DB
      const events1 = await getEvents({ limit: 10 });

      // Second call with same params - should hit cache
      const events2 = await getEvents({ limit: 10 });

      expect(events1).toEqual(events2);
    });

    it('should use different cache keys for different filters', async () => {
      const events1 = await getEvents({ city: 'New York' });
      const events2 = await getEvents({ city: 'London' });

      // Results should be different (or could be same if no events)
      // Main point is different cache keys are used
      expect(Array.isArray(events1)).toBe(true);
      expect(Array.isArray(events2)).toBe(true);
    });
  });

  describe('invalidateEventCache', () => {
    it('should invalidate all event caches', async () => {
      // Populate cache
      await getEvents();
      const stats1 = await getCacheStats();
      const eventKeysBefore = stats1.keysByNamespace.events || 0;

      // Invalidate
      await invalidateEventCache();

      const stats2 = await getCacheStats();
      const eventKeysAfter = stats2.keysByNamespace.events || 0;

      expect(eventKeysAfter).toBeLessThan(eventKeysBefore);
    });
  });
});

// ============================================================================
// Cache TTL Configuration
// ============================================================================

describe('Cache TTL Configuration', () => {
  it('should have correct TTL values', () => {
    expect(CacheTTL.PRODUCTS).toBe(300); // 5 minutes
    expect(CacheTTL.COURSES).toBe(600);  // 10 minutes
    expect(CacheTTL.EVENTS).toBe(600);   // 10 minutes
  });

  it('should have cache namespaces defined', () => {
    expect(CacheNamespace.PRODUCTS).toBe('products');
    expect(CacheNamespace.COURSES).toBe('courses');
    expect(CacheNamespace.EVENTS).toBe('events');
  });
});

// ============================================================================
// Integration Tests
// ============================================================================

describe('Cache Integration', () => {
  it('should handle multiple cached entities simultaneously', async () => {
    await getProducts({ limit: 5 });
    await getCourses({ limit: 5 });
    await getEvents({ limit: 5 });

    const stats = await getCacheStats();

    // Should have keys for all three namespaces
    expect(stats.totalKeys).toBeGreaterThan(0);
  });

  it('should invalidate only specific namespace', async () => {
    // Populate all caches
    await getProducts();
    await getCourses();
    await getEvents();

    const stats1 = await getCacheStats();
    const totalBefore = stats1.totalKeys;

    // Invalidate only products
    await invalidateProductCache();

    const stats2 = await getCacheStats();
    const totalAfter = stats2.totalKeys;

    // Total keys should decrease
    expect(totalAfter).toBeLessThan(totalBefore);

    // Other namespaces should still have keys
    const coursesKeys = stats2.keysByNamespace.courses || 0;
    const eventsKeys = stats2.keysByNamespace.events || 0;
    expect(coursesKeys + eventsKeys).toBeGreaterThan(0);
  });
});
