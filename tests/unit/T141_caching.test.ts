/**
 * Unit Tests for Redis Caching Service
 * Task T141: Implement Redis caching for frequently accessed data
 *
 * Tests cover:
 * - Cache key generation
 * - Course caching and invalidation
 * - Product caching and invalidation
 * - Event caching and invalidation
 * - User-specific caching
 * - Cache warmup
 * - Cache invalidation strategies
 */

import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import * as redis from '../../src/lib/redis';
import * as db from '../../src/lib/db';
import {
  CacheKeys,
  getCachedCourses,
  getCachedPublishedCourses,
  getCachedCourseById,
  getCachedCourseBySlug,
  getCachedCourseCount,
  invalidateCourseCaches,
  invalidateCourseCache,
  getCachedProducts,
  getCachedPublishedProducts,
  getCachedProductsByType,
  getCachedProductById,
  getCachedProductBySlug,
  getCachedProductCount,
  invalidateProductCaches,
  invalidateProductCache,
  getCachedEvents,
  getCachedPublishedEvents,
  getCachedUpcomingEvents,
  getCachedEventById,
  getCachedEventBySlug,
  getCachedEventCount,
  invalidateEventCaches,
  invalidateEventCache,
  getCachedUserEnrollments,
  getCachedUserPurchases,
  getCachedUserBookings,
  invalidateUserCaches,
  warmupCaches,
  invalidateAllAppCaches,
} from '../../src/lib/caching';

// Mock dependencies
vi.mock('../../src/lib/redis', () => ({
  getCached: vi.fn(),
  setCached: vi.fn(),
  invalidateCache: vi.fn(),
  invalidateNamespace: vi.fn(),
  generateCacheKey: (namespace: string, identifier: string, suffix?: string) => {
    const parts = [namespace, identifier];
    if (suffix) parts.push(suffix);
    return parts.join(':');
  },
  getOrSet: vi.fn(),
  CacheNamespace: {
    PRODUCTS: 'products',
    COURSES: 'courses',
    EVENTS: 'events',
    CART: 'cart',
    USER: 'user',
  },
  CacheTTL: {
    PRODUCTS: 300,
    COURSES: 600,
    EVENTS: 600,
    CART: 1800,
    USER: 900,
    SHORT: 60,
    MEDIUM: 300,
    LONG: 3600,
  },
}));

vi.mock('../../src/lib/db', () => ({
  pool: {
    query: vi.fn(),
  },
}));

describe('Cache Keys', () => {
  describe('Course Cache Keys', () => {
    it('should generate course list key', () => {
      expect(CacheKeys.courseList()).toBe('courses:list:all');
    });

    it('should generate published course list key', () => {
      expect(CacheKeys.courseListPublished()).toBe('courses:list:published');
    });

    it('should generate course by ID key', () => {
      expect(CacheKeys.courseById('123')).toBe('courses:123');
    });

    it('should generate course by slug key', () => {
      expect(CacheKeys.courseBySlug('meditation-101')).toBe('courses:slug:meditation-101');
    });

    it('should generate course count key', () => {
      expect(CacheKeys.courseCount()).toBe('courses:count');
    });
  });

  describe('Product Cache Keys', () => {
    it('should generate product list key', () => {
      expect(CacheKeys.productList()).toBe('products:list:all');
    });

    it('should generate published product list key', () => {
      expect(CacheKeys.productListPublished()).toBe('products:list:published');
    });

    it('should generate product by type key', () => {
      expect(CacheKeys.productListByType('pdf')).toBe('products:list:pdf');
    });

    it('should generate product by ID key', () => {
      expect(CacheKeys.productById('456')).toBe('products:456');
    });

    it('should generate product by slug key', () => {
      expect(CacheKeys.productBySlug('ebook-mindfulness')).toBe('products:slug:ebook-mindfulness');
    });

    it('should generate product count key', () => {
      expect(CacheKeys.productCount()).toBe('products:count');
    });
  });

  describe('Event Cache Keys', () => {
    it('should generate event list key', () => {
      expect(CacheKeys.eventList()).toBe('events:list:all');
    });

    it('should generate published event list key', () => {
      expect(CacheKeys.eventListPublished()).toBe('events:list:published');
    });

    it('should generate upcoming event list key', () => {
      expect(CacheKeys.eventListUpcoming()).toBe('events:list:upcoming');
    });

    it('should generate event by ID key', () => {
      expect(CacheKeys.eventById('789')).toBe('events:789');
    });

    it('should generate event by slug key', () => {
      expect(CacheKeys.eventBySlug('retreat-2025')).toBe('events:slug:retreat-2025');
    });

    it('should generate event count key', () => {
      expect(CacheKeys.eventCount()).toBe('events:count');
    });
  });

  describe('User Cache Keys', () => {
    it('should generate user enrollments key', () => {
      expect(CacheKeys.userEnrollments('user-123')).toBe('user:user-123:enrollments');
    });

    it('should generate user purchases key', () => {
      expect(CacheKeys.userPurchases('user-456')).toBe('user:user-456:purchases');
    });

    it('should generate user bookings key', () => {
      expect(CacheKeys.userBookings('user-789')).toBe('user:user-789:bookings');
    });
  });
});

describe('Course Caching', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCachedCourses', () => {
    it('should use getOrSet with correct parameters', async () => {
      const mockCourses = [
        { id: '1', title: 'Course 1', is_published: true },
        { id: '2', title: 'Course 2', is_published: true },
      ];

      (redis.getOrSet as Mock).mockResolvedValue(mockCourses);

      const result = await getCachedCourses();

      expect(result).toEqual(mockCourses);
      expect(redis.getOrSet).toHaveBeenCalledWith(
        'courses:list:all',
        expect.any(Function),
        600 // CacheTTL.COURSES
      );
    });
  });

  describe('getCachedPublishedCourses', () => {
    it('should fetch and cache published courses', async () => {
      const mockCourses = [{ id: '1', title: 'Course 1' }];
      (redis.getOrSet as Mock).mockResolvedValue(mockCourses);

      const result = await getCachedPublishedCourses();

      expect(result).toEqual(mockCourses);
      expect(redis.getOrSet).toHaveBeenCalledWith(
        'courses:list:published',
        expect.any(Function),
        600
      );
    });
  });

  describe('getCachedCourseById', () => {
    it('should fetch and cache course by ID', async () => {
      const mockCourse = { id: '123', title: 'Test Course' };
      (redis.getOrSet as Mock).mockResolvedValue(mockCourse);

      const result = await getCachedCourseById('123');

      expect(result).toEqual(mockCourse);
      expect(redis.getOrSet).toHaveBeenCalledWith(
        'courses:123',
        expect.any(Function),
        600
      );
    });

    it('should return null if course not found', async () => {
      (redis.getOrSet as Mock).mockResolvedValue(null);

      const result = await getCachedCourseById('999');

      expect(result).toBeNull();
    });
  });

  describe('getCachedCourseBySlug', () => {
    it('should fetch and cache course by slug', async () => {
      const mockCourse = { id: '123', slug: 'meditation-101', title: 'Meditation 101' };
      (redis.getOrSet as Mock).mockResolvedValue(mockCourse);

      const result = await getCachedCourseBySlug('meditation-101');

      expect(result).toEqual(mockCourse);
      expect(redis.getOrSet).toHaveBeenCalledWith(
        'courses:slug:meditation-101',
        expect.any(Function),
        600
      );
    });
  });

  describe('getCachedCourseCount', () => {
    it('should fetch and cache course count', async () => {
      (redis.getOrSet as Mock).mockResolvedValue(42);

      const result = await getCachedCourseCount();

      expect(result).toBe(42);
      expect(redis.getOrSet).toHaveBeenCalledWith(
        'courses:count',
        expect.any(Function),
        3600 // CacheTTL.LONG
      );
    });
  });

  describe('invalidateCourseCaches', () => {
    it('should invalidate all course caches', async () => {
      (redis.invalidateNamespace as Mock).mockResolvedValue(10);

      const result = await invalidateCourseCaches();

      expect(result).toBe(10);
      expect(redis.invalidateNamespace).toHaveBeenCalledWith('courses');
    });
  });

  describe('invalidateCourseCache', () => {
    it('should invalidate specific course and related caches', async () => {
      await invalidateCourseCache('123');

      expect(redis.invalidateCache).toHaveBeenCalledWith('courses:123');
      expect(redis.invalidateCache).toHaveBeenCalledWith('courses:list:all');
      expect(redis.invalidateCache).toHaveBeenCalledWith('courses:list:published');
    });
  });
});

describe('Product Caching', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCachedProducts', () => {
    it('should fetch and cache all products', async () => {
      const mockProducts = [{ id: '1', title: 'Product 1' }];
      (redis.getOrSet as Mock).mockResolvedValue(mockProducts);

      const result = await getCachedProducts();

      expect(result).toEqual(mockProducts);
      expect(redis.getOrSet).toHaveBeenCalledWith(
        'products:list:all',
        expect.any(Function),
        300 // CacheTTL.PRODUCTS
      );
    });
  });

  describe('getCachedPublishedProducts', () => {
    it('should fetch and cache published products', async () => {
      const mockProducts = [{ id: '1', title: 'Product 1', is_published: true }];
      (redis.getOrSet as Mock).mockResolvedValue(mockProducts);

      const result = await getCachedPublishedProducts();

      expect(result).toEqual(mockProducts);
    });
  });

  describe('getCachedProductsByType', () => {
    it('should fetch and cache products by type', async () => {
      const mockProducts = [{ id: '1', product_type: 'pdf' }];
      (redis.getOrSet as Mock).mockResolvedValue(mockProducts);

      const result = await getCachedProductsByType('pdf');

      expect(result).toEqual(mockProducts);
      expect(redis.getOrSet).toHaveBeenCalledWith(
        'products:list:pdf',
        expect.any(Function),
        300
      );
    });
  });

  describe('getCachedProductById', () => {
    it('should fetch and cache product by ID', async () => {
      const mockProduct = { id: '456', title: 'Test Product' };
      (redis.getOrSet as Mock).mockResolvedValue(mockProduct);

      const result = await getCachedProductById('456');

      expect(result).toEqual(mockProduct);
    });
  });

  describe('getCachedProductBySlug', () => {
    it('should fetch and cache product by slug', async () => {
      const mockProduct = { id: '456', slug: 'ebook-test' };
      (redis.getOrSet as Mock).mockResolvedValue(mockProduct);

      const result = await getCachedProductBySlug('ebook-test');

      expect(result).toEqual(mockProduct);
    });
  });

  describe('getCachedProductCount', () => {
    it('should fetch and cache product count', async () => {
      (redis.getOrSet as Mock).mockResolvedValue(25);

      const result = await getCachedProductCount();

      expect(result).toBe(25);
    });
  });

  describe('invalidateProductCaches', () => {
    it('should invalidate all product caches', async () => {
      (redis.invalidateNamespace as Mock).mockResolvedValue(8);

      const result = await invalidateProductCaches();

      expect(result).toBe(8);
      expect(redis.invalidateNamespace).toHaveBeenCalledWith('products');
    });
  });

  describe('invalidateProductCache', () => {
    it('should invalidate specific product and related caches', async () => {
      await invalidateProductCache('456');

      expect(redis.invalidateCache).toHaveBeenCalledWith('products:456');
      expect(redis.invalidateCache).toHaveBeenCalledWith('products:list:all');
      expect(redis.invalidateCache).toHaveBeenCalledWith('products:list:published');
    });
  });
});

describe('Event Caching', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCachedEvents', () => {
    it('should fetch and cache all events', async () => {
      const mockEvents = [{ id: '1', title: 'Event 1' }];
      (redis.getOrSet as Mock).mockResolvedValue(mockEvents);

      const result = await getCachedEvents();

      expect(result).toEqual(mockEvents);
      expect(redis.getOrSet).toHaveBeenCalledWith(
        'events:list:all',
        expect.any(Function),
        600 // CacheTTL.EVENTS
      );
    });
  });

  describe('getCachedPublishedEvents', () => {
    it('should fetch and cache published events', async () => {
      const mockEvents = [{ id: '1', title: 'Event 1', is_published: true }];
      (redis.getOrSet as Mock).mockResolvedValue(mockEvents);

      const result = await getCachedPublishedEvents();

      expect(result).toEqual(mockEvents);
    });
  });

  describe('getCachedUpcomingEvents', () => {
    it('should fetch and cache upcoming events', async () => {
      const mockEvents = [{ id: '1', title: 'Future Event' }];
      (redis.getOrSet as Mock).mockResolvedValue(mockEvents);

      const result = await getCachedUpcomingEvents();

      expect(result).toEqual(mockEvents);
      expect(redis.getOrSet).toHaveBeenCalledWith(
        'events:list:upcoming',
        expect.any(Function),
        600
      );
    });
  });

  describe('getCachedEventById', () => {
    it('should fetch and cache event by ID', async () => {
      const mockEvent = { id: '789', title: 'Test Event' };
      (redis.getOrSet as Mock).mockResolvedValue(mockEvent);

      const result = await getCachedEventById('789');

      expect(result).toEqual(mockEvent);
    });
  });

  describe('getCachedEventBySlug', () => {
    it('should fetch and cache event by slug', async () => {
      const mockEvent = { id: '789', slug: 'retreat-2025' };
      (redis.getOrSet as Mock).mockResolvedValue(mockEvent);

      const result = await getCachedEventBySlug('retreat-2025');

      expect(result).toEqual(mockEvent);
    });
  });

  describe('getCachedEventCount', () => {
    it('should fetch and cache event count', async () => {
      (redis.getOrSet as Mock).mockResolvedValue(15);

      const result = await getCachedEventCount();

      expect(result).toBe(15);
    });
  });

  describe('invalidateEventCaches', () => {
    it('should invalidate all event caches', async () => {
      (redis.invalidateNamespace as Mock).mockResolvedValue(12);

      const result = await invalidateEventCaches();

      expect(result).toBe(12);
      expect(redis.invalidateNamespace).toHaveBeenCalledWith('events');
    });
  });

  describe('invalidateEventCache', () => {
    it('should invalidate specific event and related caches', async () => {
      await invalidateEventCache('789');

      expect(redis.invalidateCache).toHaveBeenCalledWith('events:789');
      expect(redis.invalidateCache).toHaveBeenCalledWith('events:list:all');
      expect(redis.invalidateCache).toHaveBeenCalledWith('events:list:published');
      expect(redis.invalidateCache).toHaveBeenCalledWith('events:list:upcoming');
    });
  });
});

describe('User-Specific Caching', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCachedUserEnrollments', () => {
    it('should fetch and cache user enrollments', async () => {
      const mockEnrollments = [{ id: '1', course_id: '123', user_id: 'user-1' }];
      (redis.getOrSet as Mock).mockResolvedValue(mockEnrollments);

      const result = await getCachedUserEnrollments('user-1');

      expect(result).toEqual(mockEnrollments);
      expect(redis.getOrSet).toHaveBeenCalledWith(
        'user:user-1:enrollments',
        expect.any(Function),
        900 // CacheTTL.USER
      );
    });
  });

  describe('getCachedUserPurchases', () => {
    it('should fetch and cache user purchases', async () => {
      const mockPurchases = [{ id: '1', user_id: 'user-2' }];
      (redis.getOrSet as Mock).mockResolvedValue(mockPurchases);

      const result = await getCachedUserPurchases('user-2');

      expect(result).toEqual(mockPurchases);
      expect(redis.getOrSet).toHaveBeenCalledWith(
        'user:user-2:purchases',
        expect.any(Function),
        900
      );
    });
  });

  describe('getCachedUserBookings', () => {
    it('should fetch and cache user bookings', async () => {
      const mockBookings = [{ id: '1', user_id: 'user-3', event_id: '789' }];
      (redis.getOrSet as Mock).mockResolvedValue(mockBookings);

      const result = await getCachedUserBookings('user-3');

      expect(result).toEqual(mockBookings);
      expect(redis.getOrSet).toHaveBeenCalledWith(
        'user:user-3:bookings',
        expect.any(Function),
        900
      );
    });
  });

  describe('invalidateUserCaches', () => {
    it('should invalidate all user-specific caches', async () => {
      await invalidateUserCaches('user-123');

      expect(redis.invalidateCache).toHaveBeenCalledWith('user:user-123:enrollments');
      expect(redis.invalidateCache).toHaveBeenCalledWith('user:user-123:purchases');
      expect(redis.invalidateCache).toHaveBeenCalledWith('user:user-123:bookings');
    });
  });
});

describe('Cache Warmup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('warmupCaches', () => {
    it('should warm up all caches successfully', async () => {
      (redis.getOrSet as Mock).mockResolvedValue([]);

      const result = await warmupCaches();

      expect(result.courses).toBe(true);
      expect(result.products).toBe(true);
      expect(result.events).toBe(true);

      // Should have called getOrSet for published lists and counts
      expect(redis.getOrSet).toHaveBeenCalled();
    });

    it('should handle partial failures gracefully', async () => {
      (redis.getOrSet as Mock)
        .mockResolvedValueOnce([]) // getCachedPublishedCourses success
        .mockResolvedValueOnce(10) // getCachedCourseCount success
        .mockRejectedValueOnce(new Error('Products failed')) // getCachedPublishedProducts fail
        .mockResolvedValueOnce(5) // getCachedProductCount success (still called)
        .mockResolvedValueOnce([]) // getCachedUpcomingEvents success
        .mockResolvedValueOnce(8); // getCachedEventCount success

      const result = await warmupCaches();

      expect(result.courses).toBe(true);
      expect(result.products).toBe(false);
      expect(result.events).toBe(true);
    });

    it('should continue warmup even if one category fails', async () => {
      (redis.getOrSet as Mock)
        .mockRejectedValueOnce(new Error('DB error'))
        .mockResolvedValue([]);

      const result = await warmupCaches();

      // Should still attempt all categories
      expect(result.courses).toBeDefined();
      expect(result.products).toBeDefined();
      expect(result.events).toBeDefined();
    });
  });
});

describe('Cache Invalidation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('invalidateAllAppCaches', () => {
    it('should invalidate all application caches', async () => {
      (redis.invalidateNamespace as Mock)
        .mockResolvedValueOnce(10) // courses
        .mockResolvedValueOnce(8) // products
        .mockResolvedValueOnce(12); // events

      const result = await invalidateAllAppCaches();

      expect(result.courses).toBe(10);
      expect(result.products).toBe(8);
      expect(result.events).toBe(12);

      expect(redis.invalidateNamespace).toHaveBeenCalledWith('courses');
      expect(redis.invalidateNamespace).toHaveBeenCalledWith('products');
      expect(redis.invalidateNamespace).toHaveBeenCalledWith('events');
    });

    it('should handle errors gracefully', async () => {
      (redis.invalidateNamespace as Mock).mockRejectedValue(new Error('Redis error'));

      const result = await invalidateAllAppCaches();

      expect(result.courses).toBe(0);
      expect(result.products).toBe(0);
      expect(result.events).toBe(0);
    });
  });
});
