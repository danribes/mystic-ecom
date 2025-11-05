/**
 * Caching Service for Frequently Accessed Data
 * Task T141: Implement Redis caching for frequently accessed data
 *
 * Provides caching layer for:
 * - Course catalog
 * - Digital products
 * - Events
 * - User enrollments
 *
 * Features:
 * - Automatic cache warming
 * - Cache invalidation on updates
 * - TTL management
 * - Cache statistics
 * - Cache-aside pattern
 *
 * @module caching
 */

import {
  getCached,
  setCached,
  invalidateCache,
  generateCacheKey,
  CacheNamespace,
  CacheTTL,
  getOrSet,
  invalidateNamespace,
} from './redis';
import { pool } from './db';

/**
 * Cache key generators for different data types
 */
export const CacheKeys = {
  // Courses
  courseList: () => generateCacheKey(CacheNamespace.COURSES, 'list', 'all'),
  courseListPublished: () => generateCacheKey(CacheNamespace.COURSES, 'list', 'published'),
  courseById: (id: string) => generateCacheKey(CacheNamespace.COURSES, id),
  courseBySlug: (slug: string) => generateCacheKey(CacheNamespace.COURSES, 'slug', slug),
  courseCount: () => generateCacheKey(CacheNamespace.COURSES, 'count'),

  // Products
  productList: () => generateCacheKey(CacheNamespace.PRODUCTS, 'list', 'all'),
  productListPublished: () => generateCacheKey(CacheNamespace.PRODUCTS, 'list', 'published'),
  productListByType: (type: string) => generateCacheKey(CacheNamespace.PRODUCTS, 'list', type),
  productById: (id: string) => generateCacheKey(CacheNamespace.PRODUCTS, id),
  productBySlug: (slug: string) => generateCacheKey(CacheNamespace.PRODUCTS, 'slug', slug),
  productCount: () => generateCacheKey(CacheNamespace.PRODUCTS, 'count'),

  // Events
  eventList: () => generateCacheKey(CacheNamespace.EVENTS, 'list', 'all'),
  eventListPublished: () => generateCacheKey(CacheNamespace.EVENTS, 'list', 'published'),
  eventListUpcoming: () => generateCacheKey(CacheNamespace.EVENTS, 'list', 'upcoming'),
  eventById: (id: string) => generateCacheKey(CacheNamespace.EVENTS, id),
  eventBySlug: (slug: string) => generateCacheKey(CacheNamespace.EVENTS, 'slug', slug),
  eventCount: () => generateCacheKey(CacheNamespace.EVENTS, 'count'),

  // User-specific caches
  userEnrollments: (userId: string) => generateCacheKey(CacheNamespace.USER, userId, 'enrollments'),
  userPurchases: (userId: string) => generateCacheKey(CacheNamespace.USER, userId, 'purchases'),
  userBookings: (userId: string) => generateCacheKey(CacheNamespace.USER, userId, 'bookings'),
} as const;

// ============================================================================
// Course Caching
// ============================================================================

/**
 * Get all courses with caching
 */
export async function getCachedCourses(): Promise<any[]> {
  return await getOrSet(
    CacheKeys.courseList(),
    async () => {
      const result = await pool.query(`
        SELECT
          id, title, slug, description, price, image_url,
          curriculum, duration_hours, level, is_published,
          created_at, updated_at
        FROM courses
        WHERE deleted_at IS NULL
        ORDER BY created_at DESC
      `);
      return result.rows;
    },
    CacheTTL.COURSES
  );
}

/**
 * Get published courses with caching
 */
export async function getCachedPublishedCourses(): Promise<any[]> {
  return await getOrSet(
    CacheKeys.courseListPublished(),
    async () => {
      const result = await pool.query(`
        SELECT
          id, title, slug, description, price, image_url,
          curriculum, duration_hours, level,
          created_at, updated_at
        FROM courses
        WHERE is_published = true AND deleted_at IS NULL
        ORDER BY created_at DESC
      `);
      return result.rows;
    },
    CacheTTL.COURSES
  );
}

/**
 * Get course by ID with caching
 */
export async function getCachedCourseById(id: string): Promise<any | null> {
  return await getOrSet(
    CacheKeys.courseById(id),
    async () => {
      const result = await pool.query(
        `SELECT * FROM courses WHERE id = $1 AND deleted_at IS NULL`,
        [id]
      );
      return result.rows[0] || null;
    },
    CacheTTL.COURSES
  );
}

/**
 * Get course by slug with caching
 */
export async function getCachedCourseBySlug(slug: string): Promise<any | null> {
  return await getOrSet(
    CacheKeys.courseBySlug(slug),
    async () => {
      const result = await pool.query(
        `SELECT * FROM courses WHERE slug = $1 AND deleted_at IS NULL`,
        [slug]
      );
      return result.rows[0] || null;
    },
    CacheTTL.COURSES
  );
}

/**
 * Get course count with caching
 */
export async function getCachedCourseCount(): Promise<number> {
  return await getOrSet(
    CacheKeys.courseCount(),
    async () => {
      const result = await pool.query(
        `SELECT COUNT(*) as count FROM courses WHERE is_published = true AND deleted_at IS NULL`
      );
      return parseInt(result.rows[0].count, 10);
    },
    CacheTTL.LONG
  );
}

/**
 * Invalidate all course caches
 */
export async function invalidateCourseCaches(): Promise<number> {
  return await invalidateNamespace(CacheNamespace.COURSES);
}

/**
 * Invalidate specific course cache
 */
export async function invalidateCourseCache(id: string): Promise<void> {
  await invalidateCache(CacheKeys.courseById(id));
  // Also invalidate list caches as they may contain this course
  await invalidateCache(CacheKeys.courseList());
  await invalidateCache(CacheKeys.courseListPublished());
}

// ============================================================================
// Product Caching
// ============================================================================

/**
 * Get all products with caching
 */
export async function getCachedProducts(): Promise<any[]> {
  return await getOrSet(
    CacheKeys.productList(),
    async () => {
      const result = await pool.query(`
        SELECT
          id, title, slug, description, price, product_type,
          file_url, file_size_mb, preview_url, image_url,
          download_limit, is_published,
          created_at, updated_at
        FROM digital_products
        ORDER BY created_at DESC
      `);
      return result.rows;
    },
    CacheTTL.PRODUCTS
  );
}

/**
 * Get published products with caching
 */
export async function getCachedPublishedProducts(): Promise<any[]> {
  return await getOrSet(
    CacheKeys.productListPublished(),
    async () => {
      const result = await pool.query(`
        SELECT
          id, title, slug, description, price, product_type,
          preview_url, image_url,
          created_at, updated_at
        FROM digital_products
        WHERE is_published = true
        ORDER BY created_at DESC
      `);
      return result.rows;
    },
    CacheTTL.PRODUCTS
  );
}

/**
 * Get products by type with caching
 */
export async function getCachedProductsByType(productType: string): Promise<any[]> {
  return await getOrSet(
    CacheKeys.productListByType(productType),
    async () => {
      const result = await pool.query(
        `SELECT * FROM digital_products WHERE product_type = $1 AND is_published = true ORDER BY created_at DESC`,
        [productType]
      );
      return result.rows;
    },
    CacheTTL.PRODUCTS
  );
}

/**
 * Get product by ID with caching
 */
export async function getCachedProductById(id: string): Promise<any | null> {
  return await getOrSet(
    CacheKeys.productById(id),
    async () => {
      const result = await pool.query(
        `SELECT * FROM digital_products WHERE id = $1`,
        [id]
      );
      return result.rows[0] || null;
    },
    CacheTTL.PRODUCTS
  );
}

/**
 * Get product by slug with caching
 */
export async function getCachedProductBySlug(slug: string): Promise<any | null> {
  return await getOrSet(
    CacheKeys.productBySlug(slug),
    async () => {
      const result = await pool.query(
        `SELECT * FROM digital_products WHERE slug = $1`,
        [slug]
      );
      return result.rows[0] || null;
    },
    CacheTTL.PRODUCTS
  );
}

/**
 * Get product count with caching
 */
export async function getCachedProductCount(): Promise<number> {
  return await getOrSet(
    CacheKeys.productCount(),
    async () => {
      const result = await pool.query(
        `SELECT COUNT(*) as count FROM digital_products WHERE is_published = true`
      );
      return parseInt(result.rows[0].count, 10);
    },
    CacheTTL.LONG
  );
}

/**
 * Invalidate all product caches
 */
export async function invalidateProductCaches(): Promise<number> {
  return await invalidateNamespace(CacheNamespace.PRODUCTS);
}

/**
 * Invalidate specific product cache
 */
export async function invalidateProductCache(id: string): Promise<void> {
  await invalidateCache(CacheKeys.productById(id));
  // Also invalidate list caches
  await invalidateCache(CacheKeys.productList());
  await invalidateCache(CacheKeys.productListPublished());
}

// ============================================================================
// Event Caching
// ============================================================================

/**
 * Get all events with caching
 */
export async function getCachedEvents(): Promise<any[]> {
  return await getOrSet(
    CacheKeys.eventList(),
    async () => {
      const result = await pool.query(`
        SELECT
          id, title, slug, description, price,
          event_date, duration_hours,
          venue_name, venue_address, venue_city, venue_country,
          venue_lat, venue_lng,
          capacity, available_spots,
          image_url, is_published,
          created_at, updated_at
        FROM events
        ORDER BY event_date ASC
      `);
      return result.rows;
    },
    CacheTTL.EVENTS
  );
}

/**
 * Get published events with caching
 */
export async function getCachedPublishedEvents(): Promise<any[]> {
  return await getOrSet(
    CacheKeys.eventListPublished(),
    async () => {
      const result = await pool.query(`
        SELECT * FROM events
        WHERE is_published = true
        ORDER BY event_date ASC
      `);
      return result.rows;
    },
    CacheTTL.EVENTS
  );
}

/**
 * Get upcoming events with caching
 */
export async function getCachedUpcomingEvents(): Promise<any[]> {
  return await getOrSet(
    CacheKeys.eventListUpcoming(),
    async () => {
      const result = await pool.query(`
        SELECT * FROM events
        WHERE is_published = true
          AND event_date > NOW()
        ORDER BY event_date ASC
      `);
      return result.rows;
    },
    CacheTTL.EVENTS
  );
}

/**
 * Get event by ID with caching
 */
export async function getCachedEventById(id: string): Promise<any | null> {
  return await getOrSet(
    CacheKeys.eventById(id),
    async () => {
      const result = await pool.query(
        `SELECT * FROM events WHERE id = $1`,
        [id]
      );
      return result.rows[0] || null;
    },
    CacheTTL.EVENTS
  );
}

/**
 * Get event by slug with caching
 */
export async function getCachedEventBySlug(slug: string): Promise<any | null> {
  return await getOrSet(
    CacheKeys.eventBySlug(slug),
    async () => {
      const result = await pool.query(
        `SELECT * FROM events WHERE slug = $1`,
        [slug]
      );
      return result.rows[0] || null;
    },
    CacheTTL.EVENTS
  );
}

/**
 * Get event count with caching
 */
export async function getCachedEventCount(): Promise<number> {
  return await getOrSet(
    CacheKeys.eventCount(),
    async () => {
      const result = await pool.query(
        `SELECT COUNT(*) as count FROM events WHERE is_published = true`
      );
      return parseInt(result.rows[0].count, 10);
    },
    CacheTTL.LONG
  );
}

/**
 * Invalidate all event caches
 */
export async function invalidateEventCaches(): Promise<number> {
  return await invalidateNamespace(CacheNamespace.EVENTS);
}

/**
 * Invalidate specific event cache
 */
export async function invalidateEventCache(id: string): Promise<void> {
  await invalidateCache(CacheKeys.eventById(id));
  // Also invalidate list caches
  await invalidateCache(CacheKeys.eventList());
  await invalidateCache(CacheKeys.eventListPublished());
  await invalidateCache(CacheKeys.eventListUpcoming());
}

// ============================================================================
// User-Specific Caching
// ============================================================================

/**
 * Get user's course enrollments with caching
 */
export async function getCachedUserEnrollments(userId: string): Promise<any[]> {
  return await getOrSet(
    CacheKeys.userEnrollments(userId),
    async () => {
      const result = await pool.query(
        `SELECT
          ce.*,
          c.title, c.slug, c.image_url, c.duration_hours
        FROM course_enrollments ce
        JOIN courses c ON c.id = ce.course_id
        WHERE ce.user_id = $1
        ORDER BY ce.enrolled_at DESC`,
        [userId]
      );
      return result.rows;
    },
    CacheTTL.USER
  );
}

/**
 * Get user's purchases with caching
 */
export async function getCachedUserPurchases(userId: string): Promise<any[]> {
  return await getOrSet(
    CacheKeys.userPurchases(userId),
    async () => {
      const result = await pool.query(
        `SELECT * FROM orders
        WHERE user_id = $1
        ORDER BY created_at DESC`,
        [userId]
      );
      return result.rows;
    },
    CacheTTL.USER
  );
}

/**
 * Get user's event bookings with caching
 */
export async function getCachedUserBookings(userId: string): Promise<any[]> {
  return await getOrSet(
    CacheKeys.userBookings(userId),
    async () => {
      const result = await pool.query(
        `SELECT
          b.*,
          e.title, e.slug, e.event_date, e.venue_name, e.venue_city
        FROM bookings b
        JOIN events e ON e.id = b.event_id
        WHERE b.user_id = $1
        ORDER BY e.event_date DESC`,
        [userId]
      );
      return result.rows;
    },
    CacheTTL.USER
  );
}

/**
 * Invalidate user-specific caches
 */
export async function invalidateUserCaches(userId: string): Promise<void> {
  await invalidateCache(CacheKeys.userEnrollments(userId));
  await invalidateCache(CacheKeys.userPurchases(userId));
  await invalidateCache(CacheKeys.userBookings(userId));
}

// ============================================================================
// Cache Warming
// ============================================================================

/**
 * Warm up frequently accessed caches
 *
 * Call this on application startup or periodically to ensure
 * caches are populated before user requests.
 */
export async function warmupCaches(): Promise<{
  courses: boolean;
  products: boolean;
  events: boolean;
}> {
  const results = {
    courses: false,
    products: false,
    events: false,
  };

  try {
    console.log('[Cache Warmup] Starting cache warmup...');

    // Warm up course caches
    try {
      await getCachedPublishedCourses();
      await getCachedCourseCount();
      results.courses = true;
      console.log('[Cache Warmup] ✓ Courses warmed up');
    } catch (error) {
      console.error('[Cache Warmup] ✗ Courses failed:', error);
    }

    // Warm up product caches
    try {
      await getCachedPublishedProducts();
      await getCachedProductCount();
      results.products = true;
      console.log('[Cache Warmup] ✓ Products warmed up');
    } catch (error) {
      console.error('[Cache Warmup] ✗ Products failed:', error);
    }

    // Warm up event caches
    try {
      await getCachedUpcomingEvents();
      await getCachedEventCount();
      results.events = true;
      console.log('[Cache Warmup] ✓ Events warmed up');
    } catch (error) {
      console.error('[Cache Warmup] ✗ Events failed:', error);
    }

    console.log('[Cache Warmup] Cache warmup completed');
    return results;
  } catch (error) {
    console.error('[Cache Warmup] Cache warmup failed:', error);
    return results;
  }
}

/**
 * Invalidate all application caches
 *
 * Use when deploying new content or making global changes
 */
export async function invalidateAllAppCaches(): Promise<{
  courses: number;
  products: number;
  events: number;
}> {
  const results = {
    courses: 0,
    products: 0,
    events: 0,
  };

  try {
    results.courses = await invalidateCourseCaches();
    results.products = await invalidateProductCaches();
    results.events = await invalidateEventCaches();

    console.log('[Cache] Invalidated all application caches:', results);
    return results;
  } catch (error) {
    console.error('[Cache] Error invalidating caches:', error);
    return results;
  }
}
