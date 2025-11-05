# Task T141: Implement Redis Caching - Learning Guide

**Date:** 2025-11-05
**Task ID:** T141
**Difficulty:** Intermediate
**Estimated Reading Time:** 20 minutes

---

## 📚 Table of Contents

1. [Introduction](#introduction)
2. [Core Concepts](#core-concepts)
3. [Why Caching Matters](#why-caching-matters)
4. [Caching Patterns](#caching-patterns)
5. [Implementation Details](#implementation-details)
6. [Best Practices](#best-practices)
7. [Common Pitfalls](#common-pitfalls)
8. [Advanced Topics](#advanced-topics)
9. [Real-World Examples](#real-world-examples)
10. [Exercises](#exercises)

---

## 🎯 Introduction

This guide explains the **Redis caching layer** implemented in Task T141, which provides high-performance data caching for frequently accessed content like courses, products, and events.

### What You'll Learn

- What caching is and why it's essential
- Cache-aside pattern and when to use it
- Redis caching strategies
- Cache invalidation techniques
- TTL (Time To Live) management
- Cache warmup strategies
- Testing caching implementations

### Prerequisites

- Basic understanding of databases (SQL)
- Familiarity with async/await in JavaScript/TypeScript
- Basic knowledge of Redis (key-value store)
- Understanding of HTTP request/response cycle

---

## 💡 Core Concepts

### 1. What is Caching?

**Caching** is a technique of storing frequently accessed data in a fast storage layer (cache) to avoid repeated expensive operations (like database queries).

**Analogy:** Think of caching like a library's reserve desk. Popular books are kept at the desk (cache) for quick access, while less popular books remain in the stacks (database).

**Key Benefits:**
- **Performance:** Redis reads are ~100x faster than database queries
- **Scalability:** Reduces database load, allowing more users
- **Cost:** Fewer database queries = lower infrastructure costs
- **User Experience:** Faster page loads = happier users

### 2. Redis: The Caching Engine

**Redis** (Remote Dictionary Server) is an in-memory key-value store that's extremely fast.

**Why Redis for Caching?**
- **Speed:** Sub-millisecond response times
- **Data Structures:** Supports strings, lists, sets, hashes
- **TTL Support:** Automatic key expiration
- **Persistence:** Can save to disk for durability
- **Atomic Operations:** Thread-safe operations

**Redis vs Other Caches:**
```
Memcached: Simpler, slightly faster, but fewer features
Redis: More features (data structures, persistence, pub/sub)
Application Memory: Fast but doesn't scale across servers
CDN: Great for static assets, not dynamic data
```

### 3. Cache Hierarchy

Data flows through multiple cache layers:

```
User Request
    ↓
1. Browser Cache (client-side)
    ↓ (if miss)
2. CDN Cache (edge servers)
    ↓ (if miss)
3. Application Cache (Redis) ← This implementation
    ↓ (if miss)
4. Database (PostgreSQL)
    ↓
Return Data (and populate caches on the way back)
```

This implementation focuses on **Layer 3: Application Cache**.

---

## 🎯 Why Caching Matters

### The Performance Problem

**Without Caching:**
```typescript
// Every request hits the database
export async function GET() {
  const courses = await pool.query('SELECT * FROM courses'); // 150ms
  return Response.json(courses.rows);
}
```

**With 1000 requests/minute:**
- Database queries: 1000 queries/min
- Total DB time: 150,000ms = 2.5 minutes of DB work
- Users wait 150ms per request

**With Caching:**
```typescript
// First request hits database, subsequent requests hit cache
export async function GET() {
  const courses = await getCachedCourses(); // 2ms from cache
  return Response.json(courses);
}
```

**With 1000 requests/minute:**
- Database queries: 1 query every 10 minutes (TTL)
- Cache hits: 999 requests/min at 2ms each
- Total DB time: 150ms every 10 min
- Users wait 2ms per request (75x faster!)

### Real-World Impact

**Before Caching:**
```
Homepage loads: 500ms (multiple DB queries)
Course catalog: 300ms
User dashboard: 400ms
Monthly DB cost: $200
```

**After Caching:**
```
Homepage loads: 50ms (Redis cache)
Course catalog: 20ms
User dashboard: 40ms
Monthly DB cost: $50 (75% reduction!)
```

---

## 🏗️ Caching Patterns

### Pattern 1: Cache-Aside (Lazy Loading)

**How It Works:**
1. Check cache first
2. If data exists (cache hit), return it
3. If data doesn't exist (cache miss), fetch from database
4. Store fetched data in cache
5. Return data

**Implementation:**
```typescript
async function getCachedData(key: string) {
  // 1. Check cache
  const cached = await redis.get(key);

  // 2. Cache hit - return immediately
  if (cached) {
    return JSON.parse(cached);
  }

  // 3. Cache miss - fetch from database
  const data = await database.query('SELECT * FROM table');

  // 4. Store in cache for next time
  await redis.set(key, JSON.stringify(data), 'EX', 600); // 10 min TTL

  // 5. Return data
  return data;
}
```

**Pros:**
- Simple to implement
- Only caches requested data (no waste)
- Works well for read-heavy workloads
- Graceful degradation (falls back to DB if cache fails)

**Cons:**
- First request is slow (cache miss)
- Cache stampede risk (many simultaneous misses)
- Stale data possible

**When to Use:**
- Read-heavy applications (>90% reads)
- Data that changes infrequently
- Data that's expensive to compute or fetch

### Pattern 2: Write-Through Cache

**How It Works:**
1. Application writes to cache
2. Cache writes to database
3. Confirms write

**Pros:**
- Cache is always up-to-date
- No stale data

**Cons:**
- Slower writes (two operations)
- More complex
- Write overhead even for data that's rarely read

**When to Use:**
- Write-heavy applications
- When data consistency is critical
- When you can't tolerate stale data

### Pattern 3: Write-Behind (Write-Back) Cache

**How It Works:**
1. Application writes to cache
2. Cache confirms immediately
3. Cache writes to database asynchronously (later)

**Pros:**
- Very fast writes
- Reduces database load

**Cons:**
- Risk of data loss if cache fails before DB write
- Complex implementation
- Eventual consistency

**When to Use:**
- High write throughput needed
- Can tolerate some data loss risk
- Metrics, logging, analytics

### Our Choice: Cache-Aside

**Why Cache-Aside for This Project:**

1. **Read-Heavy Workload:** Course catalog, products, events are read far more than written
2. **Simple Implementation:** Easy to understand and maintain
3. **Graceful Degradation:** If Redis fails, application still works (uses DB)
4. **Selective Caching:** Only cache what's needed, when it's needed

**Read/Write Ratio:**
```
Courses:
- Reads: 1000 requests/hour (users browsing)
- Writes: 5 updates/hour (admin editing)
- Ratio: 200:1 (99.5% reads)

Perfect for cache-aside!
```

---

## 🔧 Implementation Details

### Cache Key Strategy

**Problem:** How do we name cache keys to avoid collisions and enable pattern-based operations?

**Solution:** Namespace-based keys with consistent format.

**Format:**
```
namespace:identifier:suffix
```

**Examples:**
```typescript
// Courses
'courses:list:all'              // All courses
'courses:list:published'        // Published courses only
'courses:123'                   // Specific course by ID
'courses:slug:intro-meditation' // Specific course by slug
'courses:count'                 // Course count

// Products
'products:list:all'             // All products
'products:list:pdf'             // PDF products only
'products:456'                  // Specific product

// User-specific
'user:789:enrollments'          // User's enrollments
'user:789:purchases'            // User's purchases
```

**Benefits:**
1. **No Collisions:** Different namespaces prevent key overlaps
2. **Pattern Matching:** Can invalidate `courses:*` to clear all course caches
3. **Readable:** Easy to understand in Redis CLI
4. **Organized:** Logical grouping by data type

**Implementation:**
```typescript
export const CacheKeys = {
  // Centralized key generation
  courseList: () => generateCacheKey(CacheNamespace.COURSES, 'list', 'all'),
  courseById: (id: string) => generateCacheKey(CacheNamespace.COURSES, id),
  courseBySlug: (slug: string) => generateCacheKey(CacheNamespace.COURSES, 'slug', slug),
};

// Usage
const key = CacheKeys.courseById('123'); // 'courses:123'
```

### TTL (Time To Live) Strategy

**Problem:** How long should we cache data before refreshing?

**Considerations:**
- Update Frequency: How often does data change?
- Staleness Tolerance: Can users see slightly outdated data?
- Database Load: Shorter TTL = more DB queries

**Our Strategy:**

```typescript
export const CacheTTL = {
  PRODUCTS: 300,   // 5 minutes  - May change frequently (prices, inventory)
  COURSES: 600,    // 10 minutes - Stable content, changes rarely
  EVENTS: 600,     // 10 minutes - Stable once published
  USER: 900,       // 15 minutes - User-specific data
  LONG: 3600,      // 1 hour     - Aggregates (counts, statistics)
};
```

**Rationale:**

**Products (5 minutes):**
```
Why shorter? Prices may change, inventory updates
Impact: Users might see old price for up to 5 minutes
Trade-off: Acceptable for better performance
```

**Courses (10 minutes):**
```
Why 10 minutes? Course content rarely changes
Impact: New courses appear within 10 minutes
Trade-off: Excellent balance
```

**Counts (1 hour):**
```
Why longer? Exact count is not critical
Impact: "500+ courses" vs "503 courses" - users don't care
Trade-off: Huge performance gain
```

**Dynamic TTL (Advanced):**
```typescript
// Adjust TTL based on access patterns
function getDynamicTTL(accessCount: number): number {
  if (accessCount > 1000) return 3600; // Popular -> cache longer
  if (accessCount > 100) return 600;   // Moderate
  return 300;                          // Unpopular -> cache shorter
}
```

### Cache Invalidation

**"There are only two hard things in Computer Science: cache invalidation and naming things." - Phil Karlton**

**Problem:** When data changes, how do we update or remove stale cache entries?

**Strategy 1: Specific Item Invalidation**

When one item is updated, invalidate it and related caches:

```typescript
export async function invalidateCourseCache(id: string): Promise<void> {
  // Invalidate the specific course
  await invalidateCache(CacheKeys.courseById(id));

  // Also invalidate lists that contain this course
  await invalidateCache(CacheKeys.courseList());
  await invalidateCache(CacheKeys.courseListPublished());
}
```

**Why Also Invalidate Lists?**
```
User updates "Course A" title
↓
Cache entry 'courses:123' is stale ← Obvious
↓
But 'courses:list:all' also contains old title! ← Not obvious
↓
Must invalidate both to maintain consistency
```

**Strategy 2: Namespace Invalidation**

When many items change, clear all caches in namespace:

```typescript
export async function invalidateCourseCaches(): Promise<number> {
  // Clear all keys matching 'courses:*'
  return await invalidateNamespace(CacheNamespace.COURSES);
}
```

**Use Cases:**
```
Bulk import: 100 new courses added
Bulk update: Change all course prices
Schema change: Modify course structure
Deployment: Clear all caches on deploy
```

**When to Use Each:**

| Operation | Strategy | Example |
|-----------|----------|---------|
| Edit one course | Specific | Admin updates course description |
| Add one course | Specific | Admin publishes new course |
| Delete one course | Specific | Admin removes course |
| Import 100 courses | Namespace | Bulk CSV import |
| Change pricing structure | Namespace | Black Friday sale (all prices change) |
| Deploy new version | Namespace | Code changes affect all courses |

### Cache Warmup

**Problem:** First user after cache clear experiences slow response (cache miss).

**Solution:** Pre-populate cache with frequently accessed data on startup.

**Implementation:**
```typescript
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

  // Warm up course caches
  try {
    await getCachedPublishedCourses(); // Populate cache
    await getCachedCourseCount();      // Populate cache
    results.courses = true;
  } catch (error) {
    console.error('[Cache Warmup] ✗ Courses failed:', error);
    // Don't throw - continue to other categories
  }

  // Repeat for products, events...

  return results;
}
```

**Key Design Decisions:**

**1. Graceful Failure Handling:**
```typescript
// ✅ Good: Individual try-catch per category
try {
  await warmupCourses();
  results.courses = true;
} catch (error) {
  // Log but continue
}

try {
  await warmupProducts();
  results.products = true;
} catch (error) {
  // Continue even if courses failed
}

// ❌ Bad: Single try-catch for all
try {
  await warmupCourses();
  await warmupProducts(); // Never runs if courses fail
} catch (error) {
  // All or nothing
}
```

**2. Selective Warmup:**
```typescript
// ✅ Warm up only public, frequently accessed data
await getCachedPublishedCourses(); // Public catalog
await getCachedCourseCount();      // Homepage counter

// ❌ Don't warm up everything
await getCachedCourses(); // Includes unpublished (admin only)
await getCachedCourseById('123'); // Specific items (unnecessary)
```

**3. Status Reporting:**
```typescript
// ✅ Return detailed status
return {
  courses: true,   // Success
  products: false, // Failed
  events: true,    // Success
};

// Use in monitoring:
const warmupResult = await warmupCaches();
if (!warmupResult.courses) {
  alertAdmin('Course cache warmup failed!');
}
```

**When to Run Warmup:**
```typescript
// 1. Application startup
async function startServer() {
  await connectDB();
  await connectRedis();
  await warmupCaches(); // ← Warmup before serving requests
  startHTTPServer();
}

// 2. Scheduled refresh (optional)
setInterval(() => warmupCaches(), 3600000); // Every hour

// 3. After bulk operations
async function importCourses(csv) {
  await importFromCSV(csv);
  await invalidateCourseCaches();
  await warmupCaches(); // ← Immediately repopulate
}
```

---

## 🎓 Best Practices

### 1. Always Use getOrSet Pattern

**Bad: Manual Cache Management**
```typescript
// ❌ Verbose, error-prone, easy to forget steps
async function getCourses() {
  const cached = await redis.get('courses:list:all');
  if (cached) {
    return JSON.parse(cached);
  }

  const result = await pool.query('SELECT * FROM courses');
  await redis.set('courses:list:all', JSON.stringify(result.rows), 'EX', 600);
  return result.rows;
}
```

**Good: getOrSet Helper**
```typescript
// ✅ Clean, consistent, less error-prone
async function getCourses() {
  return await getOrSet(
    'courses:list:all',
    async () => {
      const result = await pool.query('SELECT * FROM courses');
      return result.rows;
    },
    600
  );
}
```

**Benefits:**
- Consistent caching logic
- Handles JSON serialization
- Single point of failure (fix once, works everywhere)
- Easy to test (mock getOrSet)

### 2. Centralize Cache Keys

**Bad: Hardcoded Keys**
```typescript
// ❌ Keys scattered throughout codebase
const course = await getOrSet('course:123', ...);      // Typo: 'course' not 'courses'
const course = await getOrSet('courses-123', ...);     // Inconsistent separator
const course = await getOrSet('course_123', ...);      // Different separator
```

**Good: Centralized Keys**
```typescript
// ✅ Single source of truth
export const CacheKeys = {
  courseById: (id: string) => `courses:${id}`,
};

const course = await getOrSet(CacheKeys.courseById('123'), ...);
```

**Benefits:**
- No typos
- Consistent format
- Easy to refactor (change format in one place)
- Autocomplete support

### 3. Cascading Invalidation

**Bad: Invalidate Only Specific Item**
```typescript
// ❌ Stale data in lists
async function updateCourse(id, data) {
  await pool.query('UPDATE courses SET ... WHERE id = $1', [id]);
  await invalidateCache(CacheKeys.courseById(id)); // Only this
}

// Problem: Course list still has old data!
```

**Good: Invalidate Item and Lists**
```typescript
// ✅ Comprehensive invalidation
async function updateCourse(id, data) {
  await pool.query('UPDATE courses SET ... WHERE id = $1', [id]);
  await invalidateCourseCache(id); // Invalidates item + related lists
}

async function invalidateCourseCache(id: string) {
  await invalidateCache(CacheKeys.courseById(id));
  await invalidateCache(CacheKeys.courseList());
  await invalidateCache(CacheKeys.courseListPublished());
}
```

### 4. Different TTLs for Different Data

**Bad: One TTL for Everything**
```typescript
// ❌ Same TTL regardless of data characteristics
const TTL = 600; // 10 minutes for everything

await getOrSet('courses:list', fetchCourses, TTL);  // Rarely changes
await getOrSet('products:list', fetchProducts, TTL); // Changes often
await getOrSet('analytics:views', fetchViews, TTL);  // Changes constantly
```

**Good: Tailored TTLs**
```typescript
// ✅ TTL based on update frequency
await getOrSet('courses:list', fetchCourses, 3600);    // 1 hour (stable)
await getOrSet('products:list', fetchProducts, 300);   // 5 min (dynamic)
await getOrSet('analytics:views', fetchViews, 60);     // 1 min (real-time)
```

### 5. Monitor Cache Performance

**Metrics to Track:**
```typescript
interface CacheMetrics {
  hits: number;        // Cache hits
  misses: number;      // Cache misses
  hitRate: number;     // hits / (hits + misses)
  avgLatency: number;  // Average response time
  memoryUsage: number; // Redis memory usage
}

// Log cache statistics
const stats = await getCacheStats();
console.log(`Cache hit rate: ${stats.hitRate}%`);

// Alert if hit rate drops
if (stats.hitRate < 80) {
  alertAdmin('Cache hit rate below 80%!');
}
```

**Target Metrics:**
- Hit Rate: >90% for published content
- Latency: <5ms for cache hits
- Memory Usage: Within allocated Redis memory

### 6. Graceful Degradation

**Always Handle Cache Failures:**
```typescript
async function getCourses() {
  try {
    return await getOrSet('courses:list', fetchCourses, 600);
  } catch (error) {
    // Cache failed - fall back to database
    console.error('[Cache] Redis error, falling back to DB:', error);
    return await fetchCourses(); // Direct DB query
  }
}
```

**Benefits:**
- Application works even if Redis is down
- Users experience slower response, not errors
- Time to fix Redis without emergency

---

## 🚨 Common Pitfalls

### Pitfall 1: Cache Stampede

**Problem:** When cache expires, many simultaneous requests all hit database.

**Scenario:**
```
1. Cache expires at 10:00:00
2. 100 requests arrive at 10:00:01
3. All 100 requests see cache miss
4. All 100 requests query database simultaneously
5. Database overload!
```

**Solution: Lock-Based getOrSet**
```typescript
const locks = new Map<string, Promise<any>>();

async function getOrSet<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number
): Promise<T> {
  // Check cache
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);

  // Check if another request is already fetching
  if (locks.has(key)) {
    return await locks.get(key)!;
  }

  // Create lock promise
  const promise = (async () => {
    const data = await fetchFn();
    await redis.set(key, JSON.stringify(data), 'EX', ttl);
    locks.delete(key);
    return data;
  })();

  locks.set(key, promise);
  return await promise;
}
```

**Result:**
- Only 1 request hits database
- Other 99 requests wait for that result
- Database load: 1 query instead of 100

### Pitfall 2: Forgetting to Invalidate

**Problem:** Update database but forget to clear cache.

**Bad:**
```typescript
// ❌ Cache never cleared
async function updateCourse(id, data) {
  await pool.query('UPDATE courses SET ... WHERE id = $1', [id]);
  // Missing: await invalidateCourseCache(id);
  return { success: true };
}

// Users see old data until cache expires naturally!
```

**Solution: Always Pair Updates with Invalidation**
```typescript
// ✅ Clear cache immediately after update
async function updateCourse(id, data) {
  await pool.query('UPDATE courses SET ... WHERE id = $1', [id]);
  await invalidateCourseCache(id); // ← Always include this
  return { success: true };
}
```

**Pro Tip: Create Helper Functions**
```typescript
// Wrapper that auto-invalidates
async function updateCourseWithCache(id, data) {
  const result = await updateCourseInDB(id, data);
  await invalidateCourseCache(id);
  return result;
}
```

### Pitfall 3: Caching Too Much

**Problem:** Cache everything, including rarely accessed data.

**Bad:**
```typescript
// ❌ Waste memory on data that's accessed once
async function getCourseById(id: string) {
  return await getOrSet(
    CacheKeys.courseById(id),
    () => fetchCourseFromDB(id),
    3600
  );
}

// If course is only viewed once, cache is wasted
```

**Solution: Cache Only Popular Items**
```typescript
// ✅ Cache based on access patterns
const accessCount = new Map<string, number>();

async function getCourseById(id: string) {
  // Track access
  accessCount.set(id, (accessCount.get(id) || 0) + 1);

  // Only cache if accessed multiple times
  if (accessCount.get(id)! >= 3) {
    return await getOrSet(
      CacheKeys.courseById(id),
      () => fetchCourseFromDB(id),
      3600
    );
  }

  // Fetch directly for unpopular items
  return await fetchCourseFromDB(id);
}
```

### Pitfall 4: Circular Dependencies

**Problem:** Cache depends on itself.

**Bad:**
```typescript
// ❌ Infinite loop
async function getCourses() {
  return await getOrSet(
    'courses:list',
    async () => {
      // Calls getCourses() again!
      const courses = await getCourses();
      return courses;
    },
    600
  );
}
```

**Solution: Separate Cache Logic from Business Logic**
```typescript
// ✅ Business logic separate from caching
async function fetchCoursesFromDB() {
  const result = await pool.query('SELECT * FROM courses');
  return result.rows;
}

async function getCachedCourses() {
  return await getOrSet(
    'courses:list',
    fetchCoursesFromDB, // ← No circular reference
    600
  );
}
```

---

## 🎓 Advanced Topics

### Topic 1: Cache Versioning

**Problem:** Deploy new code with different data structure while old caches still exist.

**Solution: Version Cache Keys**
```typescript
const CACHE_VERSION = 'v2';

export const CacheKeys = {
  courseById: (id: string) => `${CACHE_VERSION}:courses:${id}`,
};

// After deployment with new version:
// Old: 'v1:courses:123' (ignored, expires naturally)
// New: 'v2:courses:123' (new format)
```

### Topic 2: Distributed Caching

**Problem:** Multiple application servers need to share cache.

**Solution: Redis Cluster**
```typescript
import { createCluster } from 'redis';

const redis = createCluster({
  rootNodes: [
    { url: 'redis://node1:6379' },
    { url: 'redis://node2:6379' },
    { url: 'redis://node3:6379' },
  ],
});

// All servers share the same cache
```

### Topic 3: Cache Aside with Stale-While-Revalidate

**Pattern:** Serve stale data immediately while fetching fresh data in background.

```typescript
async function getOrSetStale<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number
): Promise<T> {
  const cached = await redis.get(key);

  if (cached) {
    const { data, timestamp } = JSON.parse(cached);

    // If cache is old but not expired, refresh in background
    if (Date.now() - timestamp > ttl * 1000 * 0.8) {
      // Refresh asynchronously (don't await)
      fetchFn().then(fresh => {
        redis.set(key, JSON.stringify({ data: fresh, timestamp: Date.now() }));
      });
    }

    // Return stale data immediately (fast!)
    return data;
  }

  // Cache miss - fetch and store
  const data = await fetchFn();
  await redis.set(key, JSON.stringify({ data, timestamp: Date.now() }));
  return data;
}
```

**Benefits:**
- Always fast responses (never wait for DB)
- Cache stays fresh
- No cache stampede

---

## 🌍 Real-World Examples

### Example 1: E-Commerce Product Cache

```typescript
// Cache product catalog
async function getProducts() {
  return await getOrSet(
    'products:catalog',
    async () => {
      return await pool.query(`
        SELECT id, name, price, inventory
        FROM products
        WHERE active = true
      `);
    },
    300 // 5 minutes (prices change frequently)
  );
}

// Invalidate on price change
async function updateProductPrice(id: string, newPrice: number) {
  await pool.query(
    'UPDATE products SET price = $1 WHERE id = $2',
    [newPrice, id]
  );

  // Clear cache immediately
  await invalidateCache('products:catalog');
  await invalidateCache(`products:${id}`);

  // Warmup cache with fresh data
  await getProducts();
}
```

### Example 2: Social Media Feed Cache

```typescript
// Cache user feed with short TTL
async function getUserFeed(userId: string) {
  return await getOrSet(
    `feed:${userId}`,
    async () => {
      return await pool.query(`
        SELECT posts.*
        FROM posts
        JOIN followers ON posts.user_id = followers.following_id
        WHERE followers.user_id = $1
        ORDER BY posts.created_at DESC
        LIMIT 50
      `, [userId]);
    },
    60 // 1 minute (real-time feel)
  );
}

// Invalidate on new post
async function createPost(userId: string, content: string) {
  const post = await pool.query(
    'INSERT INTO posts (user_id, content) VALUES ($1, $2)',
    [userId, content]
  );

  // Invalidate feed for all followers
  const followers = await getFollowers(userId);
  for (const follower of followers) {
    await invalidateCache(`feed:${follower.id}`);
  }
}
```

### Example 3: Analytics Dashboard Cache

```typescript
// Cache expensive analytics queries
async function getDashboardStats() {
  return await getOrSet(
    'analytics:dashboard',
    async () => {
      const [users, orders, revenue] = await Promise.all([
        pool.query('SELECT COUNT(*) FROM users'),
        pool.query('SELECT COUNT(*) FROM orders'),
        pool.query('SELECT SUM(amount) FROM orders'),
      ]);

      return {
        totalUsers: users.rows[0].count,
        totalOrders: orders.rows[0].count,
        totalRevenue: revenue.rows[0].sum,
      };
    },
    3600 // 1 hour (exact numbers not critical)
  );
}
```

---

## 💪 Exercises

### Exercise 1: Implement Product Cache

**Task:** Implement caching for a product catalog with the following requirements:
- Cache published products for 5 minutes
- Cache individual products by ID for 10 minutes
- Invalidate cache when product is updated
- Include proper error handling

**Starter Code:**
```typescript
// TODO: Implement these functions
async function getCachedProducts() {
  // Your code here
}

async function getCachedProductById(id: string) {
  // Your code here
}

async function invalidateProductCache(id: string) {
  // Your code here
}
```

**Solution:**
```typescript
const CacheKeys = {
  productList: () => 'products:list:published',
  productById: (id: string) => `products:${id}`,
};

async function getCachedProducts() {
  return await getOrSet(
    CacheKeys.productList(),
    async () => {
      const result = await pool.query(
        'SELECT * FROM products WHERE is_published = true'
      );
      return result.rows;
    },
    300 // 5 minutes
  );
}

async function getCachedProductById(id: string) {
  return await getOrSet(
    CacheKeys.productById(id),
    async () => {
      const result = await pool.query(
        'SELECT * FROM products WHERE id = $1',
        [id]
      );
      return result.rows[0] || null;
    },
    600 // 10 minutes
  );
}

async function invalidateProductCache(id: string) {
  await invalidateCache(CacheKeys.productById(id));
  await invalidateCache(CacheKeys.productList());
}
```

### Exercise 2: Implement Cache Warmup

**Task:** Create a warmup function that pre-populates caches for products and categories.

**Requirements:**
- Warmup both products and categories
- Handle failures gracefully
- Return status for each category
- Log progress

**Starter Code:**
```typescript
async function warmupProductCaches() {
  // Your code here
}
```

**Solution:**
```typescript
async function warmupProductCaches(): Promise<{
  products: boolean;
  categories: boolean;
}> {
  const results = {
    products: false,
    categories: false,
  };

  // Warmup products
  try {
    await getCachedProducts();
    results.products = true;
    console.log('[Warmup] ✓ Products warmed up');
  } catch (error) {
    console.error('[Warmup] ✗ Products failed:', error);
  }

  // Warmup categories
  try {
    await getCachedCategories();
    results.categories = true;
    console.log('[Warmup] ✓ Categories warmed up');
  } catch (error) {
    console.error('[Warmup] ✗ Categories failed:', error);
  }

  return results;
}
```

### Exercise 3: Implement TTL Strategy

**Task:** Design TTL values for different data types based on their characteristics.

**Data Types:**
```typescript
interface DataType {
  name: string;
  updateFrequency: 'hourly' | 'daily' | 'weekly' | 'rarely';
  criticalFreshness: 'critical' | 'important' | 'moderate' | 'low';
  queryExpense: 'expensive' | 'moderate' | 'cheap';
}

const dataTypes: DataType[] = [
  { name: 'product_prices', updateFrequency: 'hourly', criticalFreshness: 'important', queryExpense: 'cheap' },
  { name: 'blog_posts', updateFrequency: 'daily', criticalFreshness: 'moderate', queryExpense: 'moderate' },
  { name: 'user_stats', updateFrequency: 'hourly', criticalFreshness: 'low', queryExpense: 'expensive' },
  { name: 'site_config', updateFrequency: 'rarely', criticalFreshness: 'critical', queryExpense: 'cheap' },
];

// TODO: Assign appropriate TTL values
```

**Solution:**
```typescript
function calculateTTL(dataType: DataType): number {
  // Start with base TTL based on update frequency
  let baseTTL = {
    hourly: 300,   // 5 minutes
    daily: 3600,   // 1 hour
    weekly: 86400, // 1 day
    rarely: 86400, // 1 day
  }[dataType.updateFrequency];

  // Adjust based on freshness requirements
  if (dataType.criticalFreshness === 'critical') {
    baseTTL = baseTTL * 0.5; // More frequent refresh
  } else if (dataType.criticalFreshness === 'low') {
    baseTTL = baseTTL * 2; // Less frequent refresh
  }

  // Adjust based on query expense
  if (dataType.queryExpense === 'expensive') {
    baseTTL = baseTTL * 1.5; // Cache longer for expensive queries
  }

  return baseTTL;
}

// Results:
// product_prices: 300 * 1 * 1 = 300s (5 min)
// blog_posts: 3600 * 1 * 1 = 3600s (1 hour)
// user_stats: 300 * 2 * 1.5 = 900s (15 min)
// site_config: 86400 * 0.5 * 1 = 43200s (12 hours)
```

---

## 📚 Additional Resources

### Official Documentation
- [Redis Documentation](https://redis.io/documentation)
- [Redis Caching Best Practices](https://redis.io/docs/manual/patterns/caching/)
- [Node Redis Client](https://github.com/redis/node-redis)

### Articles & Guides
- [Caching Strategies and How to Choose the Right One](https://codeahoy.com/2017/08/11/caching-strategies-and-how-to-choose-the-right-one/)
- [Cache Stampede Problem](https://en.wikipedia.org/wiki/Cache_stampede)
- [Redis as a Cache](https://redis.io/docs/manual/patterns/cache/)

### Books
- *Redis in Action* by Josiah L. Carlson
- *Designing Data-Intensive Applications* by Martin Kleppmann (Chapter on Caching)

---

## ✅ Summary

**Key Takeaways:**
1. **Caching** dramatically improves performance by storing frequently accessed data in fast storage
2. **Cache-aside pattern** is simple and effective for read-heavy workloads
3. **Redis** provides sub-millisecond access times with rich features
4. **Cache invalidation** is critical - always clear cache when data changes
5. **TTL strategy** should balance freshness needs with performance gains
6. **Cache warmup** ensures first users don't experience slow responses
7. **Graceful degradation** keeps application working even if cache fails

**Implementation Checklist:**
- ✅ Use getOrSet pattern for consistency
- ✅ Centralize cache key generation
- ✅ Implement cascading invalidation
- ✅ Use appropriate TTLs for different data types
- ✅ Handle cache failures gracefully
- ✅ Monitor cache performance
- ✅ Test invalidation strategies
- ✅ Document caching decisions

**Next Steps:**
1. Monitor cache hit rates in production
2. Adjust TTLs based on actual usage patterns
3. Consider implementing stale-while-revalidate for critical paths
4. Add cache statistics dashboard
5. Implement distributed caching for high availability

---

**Happy Caching!** 🚀
