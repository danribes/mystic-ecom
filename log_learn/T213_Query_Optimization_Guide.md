# T213: Database Query Optimization and N+1 Prevention - Learning Guide

**Purpose:** Educational guide explaining database query optimization, N+1 problems, detection strategies, and solutions

---

## Table of Contents

1. [What is Query Optimization?](#what-is-query-optimization)
2. [The N+1 Problem](#the-n1-problem)
3. [Database Indexes](#database-indexes)
4. [Query Profiling](#query-profiling)
5. [Optimization Strategies](#optimization-strategies)
6. [Performance Monitoring](#performance-monitoring)
7. [Best Practices](#best-practices)
8. [Real-World Examples](#real-world-examples)

---

## What is Query Optimization?

### The Problem

Every database query costs time and resources:

```
User Request → API → Database Query (150ms) → Response
```

When you have 1000 users/second:
- **Without optimization:** 1000 × 150ms = 150 seconds of database time per second
- **Result:** Database overloaded, slow responses, potential crashes

### The Goal

Reduce database load through:
1. **Fewer Queries** - Fetch all data in one query instead of many
2. **Faster Queries** - Use indexes to speed up data retrieval
3. **Caching** - Store results to avoid repeated queries
4. **Monitoring** - Detect and fix slow queries before they become problems

### Why It Matters

**Without Optimization:**
```typescript
// Fetch 100 courses
const courses = await getCourses(); // 1 query

// Fetch reviews for each course
for (const course of courses) {
  course.reviews = await getReviews(course.id); // 100 queries!
}
// Total: 101 queries, ~15 seconds
```

**With Optimization:**
```typescript
// Fetch courses with reviews in ONE query
const courses = await db.query(`
  SELECT c.*, json_agg(r.*) as reviews
  FROM courses c
  LEFT JOIN reviews r ON c.id = r.course_id
  GROUP BY c.id
`); // 1 query, ~0.2 seconds
```

**Impact:** 101 queries → 1 query = **75x faster** ⚡

---

## The N+1 Problem

### What is N+1?

The N+1 query problem occurs when:
1. You fetch N items (1 query)
2. Then fetch related data for each item (N queries)
3. **Total: 1 + N queries** instead of just 1

### Example: The Classic N+1

**Scenario:** Display courses with their average rating

❌ **Bad Code (N+1 Pattern):**
```typescript
// 1. Fetch all courses
const courses = await db.query('SELECT * FROM courses'); // 1 query

// 2. Fetch reviews for EACH course
for (const course of courses) {
  const reviews = await db.query(
    'SELECT * FROM reviews WHERE course_id = $1',
    [course.id]
  ); // N queries (one per course)

  course.averageRating = calculateAverage(reviews);
}

// Total: 1 + N queries
// If N = 100 courses → 101 queries!
```

✅ **Good Code (Single Query with JOIN):**
```typescript
const courses = await db.query(`
  SELECT
    c.*,
    COALESCE(AVG(r.rating), 0) as average_rating,
    COUNT(r.id) as review_count
  FROM courses c
  LEFT JOIN reviews r ON c.id = r.course_id
  GROUP BY c.id
`); // 1 query

// Total: 1 query
// Fetches courses + ratings in one go!
```

### Why N+1 is Bad

**Performance Impact:**

| Courses | Queries (N+1) | Queries (JOIN) | Time (N+1) | Time (JOIN) |
|---------|---------------|----------------|------------|-------------|
| 10 | 11 | 1 | 1.65s | 0.15s |
| 100 | 101 | 1 | 15.15s | 0.25s |
| 1000 | 1001 | 1 | 150.15s | 0.45s |

*Assuming 150ms per query*

**Exponential Growth:**
- 10 courses: 11x slower
- 100 courses: 60x slower
- 1000 courses: 334x slower

### How N+1 Happens

**Common Scenarios:**

**1. Loop with Individual Lookups**
```typescript
const users = await getUsers();
for (const user of users) {
  user.orders = await getOrders(user.id); // N+1!
}
```

**2. ORM Lazy Loading**
```typescript
// Many ORMs do this by default
const courses = await Course.findAll();
for (const course of courses) {
  await course.getReviews(); // Lazy load triggers N+1
}
```

**3. Nested Relationships**
```typescript
const courses = await getCourses();
for (const course of courses) {
  course.instructor = await getUser(course.instructor_id);
  course.reviews = await getReviews(course.id);
  for (const review of course.reviews) {
    review.user = await getUser(review.user_id); // N+1 inside N+1!
  }
}
```

### Detecting N+1

**Manual Detection:**
1. Look for loops with database queries inside
2. Check for multiple queries with same pattern
3. Profile request - count queries

**Automated Detection (Our Implementation):**
```typescript
import { startProfiling, finishProfiling, formatProfile } from '@/lib/queryProfiler';

const requestId = generateRequestId();
startProfiling(requestId);

// ... your code that executes queries ...

const profile = finishProfiling(requestId);
if (profile?.potentialN1) {
  console.warn('N+1 detected!', formatProfile(profile));
}
```

**Detection Algorithm:**
1. Record all queries during request
2. Normalize queries (lowercase, whitespace)
3. Replace parameters ($1 → $X) to get pattern
4. Count occurrences of each pattern
5. **If any pattern appears ≥10 times → N+1 detected**

**Example:**
```
Query 1: SELECT * FROM reviews WHERE course_id = $1 [params: ['1']]
Query 2: SELECT * FROM reviews WHERE course_id = $1 [params: ['2']]
Query 3: SELECT * FROM reviews WHERE course_id = $1 [params: ['3']]
...
Query 15: SELECT * FROM reviews WHERE course_id = $1 [params: ['15']]

Pattern: select * from reviews where course_id = $x
Occurrences: 15
Result: N+1 DETECTED ⚠️
```

---

## Database Indexes

### What is an Index?

An index is like a book's index - it lets you find data quickly without scanning everything.

**Without Index:**
```
Looking for course with slug "intro-to-python"
Scan: Row 1 ❌ Row 2 ❌ Row 3 ❌ ... Row 10,000 ✅
Time: ~500ms (full table scan)
```

**With Index:**
```
Look up "intro-to-python" in index → Points to Row 10,000
Time: ~5ms (index lookup)
```

**Speed Improvement: 100x faster**

### How Indexes Work

Think of a phone book:
- **No Index:** Read every page to find "Smith, John" (slow)
- **With Index:** Jump to "S" section, find "Smith" (fast)

**PostgreSQL Index (B-Tree):**
```
              [M]
           /       \
      [D]             [S]
    /    \          /     \
 [A-C]  [E-L]   [N-R]   [T-Z]
```

Each level narrows the search:
- Level 1: 26 possibilities → 1 branch
- Level 2: 1 branch → specific range
- Level 3: exact row

**Lookups: O(log n)** instead of O(n)

### Types of Indexes

#### 1. Single-Column Index

**Use Case:** Queries filtering on one column

```sql
CREATE INDEX idx_courses_slug ON courses(slug);
```

**Optimizes:**
```sql
SELECT * FROM courses WHERE slug = 'intro-to-python';
-- Uses index → fast lookup
```

#### 2. Composite Index

**Use Case:** Queries filtering on multiple columns

```sql
CREATE INDEX idx_courses_published_level
ON courses(is_published, level);
```

**Optimizes:**
```sql
SELECT * FROM courses
WHERE is_published = true AND level = 'beginner';
-- Uses composite index → very fast
```

**Index Order Matters:**
- `(is_published, level)` - Good for filtering both
- `(level, is_published)` - Different order, different optimization

**Rule:** Put most selective column first

#### 3. Partial Index

**Use Case:** Index only subset of rows

```sql
CREATE INDEX idx_courses_published
ON courses(is_published)
WHERE is_published = true;
```

**Benefits:**
- Smaller index size (only published courses)
- Faster index lookups
- Less maintenance overhead

**Optimizes:**
```sql
SELECT * FROM courses WHERE is_published = true;
-- Uses partial index → fastest
```

#### 4. GIN Index (Full-Text Search)

**Use Case:** Text search in large text columns

```sql
CREATE INDEX idx_products_title_search
ON digital_products
USING gin(to_tsvector('english', title));
```

**Optimizes:**
```sql
SELECT * FROM digital_products
WHERE to_tsvector('english', title) @@ to_tsquery('english', 'python & course');
-- Uses GIN index → 100x faster than ILIKE
```

**Before:**
```sql
SELECT * FROM products WHERE title ILIKE '%python%';
-- No index → full table scan → slow
```

**After:**
```sql
SELECT * FROM products
WHERE to_tsvector('english', title) @@ to_tsquery('english', 'python');
-- GIN index → fast
```

### Index Strategy

**What to Index:**

✅ **Always Index:**
- Primary keys (auto-indexed)
- Foreign keys (for JOINs)
- Columns in WHERE clauses
- Columns in ORDER BY
- Columns in GROUP BY

✅ **Consider Indexing:**
- Frequently queried columns
- Columns with high selectivity (many unique values)
- Columns used in range queries

❌ **Don't Index:**
- Small tables (<1000 rows)
- Columns with low selectivity (e.g., boolean with 50/50 split)
- Columns rarely queried
- Columns that change frequently

**Trade-offs:**

**Pros:**
- ✅ Much faster SELECT queries
- ✅ Faster ORDER BY and GROUP BY
- ✅ Faster JOIN operations

**Cons:**
- ❌ Slower INSERT/UPDATE/DELETE (must update index)
- ❌ More disk space
- ❌ More memory usage

**Rule of Thumb:** Index read-heavy tables, avoid over-indexing write-heavy tables

### Our Indexes

**Courses:**
```sql
-- Primary lookups (slug is unique, highly selective)
CREATE INDEX idx_courses_slug ON courses(slug);

-- Filtered queries (most courses are published)
CREATE INDEX idx_courses_published ON courses(is_published)
WHERE is_published = true;

-- Sorting (newest first is common)
CREATE INDEX idx_courses_created_at ON courses(created_at DESC);

-- Composite for common filter combination
CREATE INDEX idx_courses_published_level
ON courses(is_published, level)
WHERE is_published = true;
```

**Reviews (JOIN Optimization):**
```sql
-- Optimize course review JOINs
CREATE INDEX idx_reviews_course_approved
ON reviews(course_id, is_approved)
WHERE is_approved = true;
```

**Why this index?**
```sql
-- This query is very common
SELECT c.*, AVG(r.rating) as avg_rating
FROM courses c
LEFT JOIN reviews r
  ON c.id = r.course_id AND r.is_approved = true
GROUP BY c.id;

-- Index on (course_id, is_approved) makes JOIN super fast
```

**Products (Full-Text Search):**
```sql
CREATE INDEX idx_products_title_search
ON digital_products
USING gin(to_tsvector('english', title));

CREATE INDEX idx_products_description_search
ON digital_products
USING gin(to_tsvector('english', description));
```

**Enables:**
```sql
SELECT * FROM digital_products
WHERE to_tsvector('english', title || ' ' || description)
  @@ to_tsquery('english', 'meditation & mindfulness');
-- Fast full-text search across title and description
```

---

## Query Profiling

### What is Query Profiling?

Profiling tracks every database query during a request to:
1. Count total queries
2. Measure execution time
3. Detect N+1 patterns
4. Identify slow queries

### How It Works

**Architecture:**
```
Request Start
    ↓
  startProfiling(requestId)
    ↓
  [Execute queries with recordQuery()]
    ↓
  finishProfiling(requestId)
    ↓
  {profile with analysis}
```

**Step by Step:**

**1. Start Profiling**
```typescript
import { generateRequestId, startProfiling } from '@/lib/queryProfiler';

const requestId = generateRequestId(); // "req_1762325440_abc123"
startProfiling(requestId);
```

**2. Record Queries**
```typescript
import { recordQuery } from '@/lib/queryProfiler';

const start = Date.now();
const result = await pool.query('SELECT * FROM courses WHERE is_published = true');
recordQuery(requestId, 'SELECT * FROM courses WHERE is_published = true', Date.now() - start);
```

**3. Finish and Analyze**
```typescript
import { finishProfiling, formatProfile } from '@/lib/queryProfiler';

const profile = finishProfiling(requestId);

if (profile) {
  console.log('Total queries:', profile.queryCount);
  console.log('Total time:', profile.totalDuration);
  console.log('N+1 detected:', profile.potentialN1);

  if (profile.potentialN1) {
    console.warn(formatProfile(profile));
  }
}
```

### Query Profile Structure

```typescript
interface QueryProfile {
  requestId: string;           // Unique request ID
  queries: QueryRecord[];       // All queries executed
  totalDuration: number;        // Sum of all query times (ms)
  queryCount: number;           // Number of queries
  potentialN1: boolean;         // N+1 pattern detected?
}

interface QueryRecord {
  query: string;                // Normalized query
  params?: any[];               // Query parameters
  duration: number;             // Execution time (ms)
  timestamp: Date;              // When executed
  stackTrace?: string;          // Where called (dev only)
}
```

### Performance Thresholds

```typescript
export const PERFORMANCE_THRESHOLDS = {
  SLOW_QUERY_MS: 100,           // Queries >100ms are slow
  N1_THRESHOLD: 10,              // 10+ similar queries = N+1
  MAX_QUERIES_PER_REQUEST: 50,  // Warning if >50 queries
};
```

**Automatic Warnings:**

```typescript
// Slow query warning
if (duration > 100) {
  logger.warn(`Slow query detected (${duration}ms):`, { query, requestId });
}

// High query count warning
if (queryCount > 50) {
  logger.warn(`High query count: ${queryCount} queries in request ${requestId}`);
}

// N+1 pattern warning
if (potentialN1) {
  logger.warn(`Potential N+1 query pattern detected in request ${requestId}`);
}
```

### Using measureQuery Wrapper

**Instead of manual recording:**
```typescript
const start = Date.now();
const result = await pool.query(query);
recordQuery(requestId, query, Date.now() - start);
```

**Use wrapper:**
```typescript
import { measureQuery } from '@/lib/queryProfiler';

const result = await measureQuery(
  () => pool.query('SELECT * FROM courses'),
  requestId,
  'Fetch all courses'
);
// Automatically records timing!
```

**Benefits:**
- Cleaner code
- Error handling included
- Stack trace captured (dev mode)
- Consistent recording

### Profile Analysis

```typescript
import { analyzeProfile } from '@/lib/queryProfiler';

const recommendations = analyzeProfile(profile);

// Returns array of recommendations:
[
  "High query count (60). Consider using JOINs to reduce queries.",
  "Total query time is 1200ms. Consider adding caching or optimizing queries.",
  "2 slow queries detected. Consider adding indexes or optimizing query structure."
]
```

**Analysis Checks:**

1. **High Query Count**
   - Threshold: >50 queries
   - Recommendation: Use JOINs

2. **Slow Total Duration**
   - Threshold: >1000ms
   - Recommendation: Add caching or optimize

3. **N+1 Pattern**
   - Threshold: ≥10 similar queries
   - Recommendation: Add JOINs for related data

4. **Slow Individual Queries**
   - Threshold: >100ms each
   - Recommendation: Add indexes

### Admin API

**Endpoint:** `GET /api/admin/query-stats`

**Response:**
```json
{
  "success": true,
  "query": {
    "totalQueries": 1234,
    "averageQueriesPerRequest": 5.2,
    "slowQueries": 23,
    "slowQueryPercentage": 1.86
  },
  "cache": {
    "hitRate": 85.5,
    "hits": 1890,
    "misses": 320
  },
  "performance": {
    "status": "excellent",
    "recommendations": [
      "Performance metrics look good. Continue monitoring for trends."
    ]
  }
}
```

**Performance Status:**
- **Excellent:** <5 avg queries, <5% slow, >80% cache hit rate
- **Good:** <10 avg queries, <10% slow, >60% cache hit rate
- **Fair:** <50 avg queries, <20% slow
- **Poor:** Above thresholds

---

## Optimization Strategies

### Strategy 1: Use JOINs Instead of Loops

❌ **Before:**
```typescript
const courses = await db.query('SELECT * FROM courses');

for (const course of courses) {
  const reviews = await db.query(
    'SELECT * FROM reviews WHERE course_id = $1',
    [course.id]
  );
  course.reviews = reviews.rows;
}
```

✅ **After:**
```typescript
const result = await db.query(`
  SELECT
    c.*,
    json_agg(r.*) as reviews
  FROM courses c
  LEFT JOIN reviews r ON c.id = r.course_id
  GROUP BY c.id
`);

const courses = result.rows;
```

### Strategy 2: Add Indexes for Common Queries

❌ **Before (Full Table Scan):**
```sql
SELECT * FROM courses WHERE slug = 'intro-to-python';
-- Scans all rows → slow
```

✅ **After (Index Lookup):**
```sql
-- First, create index
CREATE INDEX idx_courses_slug ON courses(slug);

-- Now query is fast
SELECT * FROM courses WHERE slug = 'intro-to-python';
-- Uses index → 100x faster
```

### Strategy 3: Use Caching (T212)

❌ **Before (Always Hit Database):**
```typescript
export async function getProducts() {
  const result = await pool.query('SELECT * FROM digital_products');
  return result.rows;
}
```

✅ **After (Cache-Aside Pattern):**
```typescript
export async function getProducts() {
  const cacheKey = 'products:list:all';

  // Try cache first
  const cached = await getCached(cacheKey);
  if (cached) return cached;

  // Cache miss - fetch from database
  const result = await pool.query('SELECT * FROM digital_products');
  const products = result.rows;

  // Store in cache for 5 minutes
  await setCached(cacheKey, products, 300);

  return products;
}
```

### Strategy 4: Fetch Only Required Columns

❌ **Before:**
```sql
SELECT * FROM courses;
-- Fetches all columns including large text fields
```

✅ **After:**
```sql
SELECT id, title, slug, price, created_at FROM courses;
-- Fetches only what's needed → faster, less memory
```

### Strategy 5: Use LIMIT for Large Results

❌ **Before:**
```sql
SELECT * FROM logs ORDER BY created_at DESC;
-- Returns millions of rows → slow, memory intensive
```

✅ **After:**
```sql
SELECT * FROM logs
ORDER BY created_at DESC
LIMIT 100;
-- Returns only 100 most recent → fast
```

### Strategy 6: Batch Queries with WHERE IN

❌ **Before (N+1):**
```typescript
for (const userId of userIds) {
  const user = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
  users.push(user.rows[0]);
}
```

✅ **After (Batch Query):**
```typescript
const users = await db.query(
  'SELECT * FROM users WHERE id = ANY($1)',
  [userIds]
);
```

---

## Performance Monitoring

### Key Metrics to Track

**1. Queries Per Request**
- **Target:** <10 queries
- **Warning:** >20 queries
- **Critical:** >50 queries

**2. Slow Query Percentage**
- **Target:** <5%
- **Warning:** >10%
- **Critical:** >20%

**3. Average Query Duration**
- **Target:** <50ms
- **Warning:** >100ms
- **Critical:** >200ms

**4. Cache Hit Rate (from T212)**
- **Target:** >80%
- **Warning:** <70%
- **Critical:** <50%

### Monitoring Setup

**1. Request-Level Profiling**
```typescript
export const GET: APIRoute = async ({ request }) => {
  const requestId = generateRequestId();
  startProfiling(requestId);

  try {
    // Your endpoint logic...

    const profile = finishProfiling(requestId);
    if (profile && profile.potentialN1) {
      logger.warn('N+1 detected:', formatProfile(profile));
    }

    return response;
  } catch (error) {
    finishProfiling(requestId);
    throw error;
  }
};
```

**2. Periodic Stats Collection**
```typescript
setInterval(async () => {
  const stats = getQueryStatistics();

  logger.info('Query performance stats:', {
    totalQueries: stats.totalQueries,
    avgPerRequest: stats.averageQueriesPerRequest,
    slowQueries: stats.slowQueries,
    slowPercentage: (stats.slowQueries / stats.totalQueries * 100).toFixed(2)
  });
}, 60000); // Every minute
```

**3. Admin Dashboard**
```typescript
// GET /api/admin/query-stats
const response = await fetch('/api/admin/query-stats');
const data = await response.json();

// Display in dashboard
{
  "Average Queries/Request": 5.2,
  "Slow Query %": "1.86%",
  "Cache Hit Rate": "85.5%",
  "Status": "excellent"
}
```

### Alert Conditions

**Critical Alerts:**
```typescript
if (profile.queryCount > 100) {
  // Critical: Way too many queries
  alert('CRITICAL: >100 queries in single request');
}

if (profile.potentialN1) {
  // Warning: N+1 pattern detected
  alert('WARNING: N+1 query pattern detected');
}

if (slowQueryPercentage > 20) {
  // Critical: Too many slow queries
  alert('CRITICAL: >20% queries are slow');
}
```

---

## Best Practices

### 1. Always Use Parameterized Queries

❌ **Never:**
```typescript
const query = `SELECT * FROM users WHERE email = '${email}'`;
await pool.query(query);
// SQL injection vulnerability!
```

✅ **Always:**
```typescript
await pool.query('SELECT * FROM users WHERE email = $1', [email]);
// Safe from SQL injection
```

### 2. Use Transactions for Related Operations

❌ **Before:**
```typescript
await pool.query('INSERT INTO orders ...');
await pool.query('INSERT INTO order_items ...');
await pool.query('UPDATE products SET stock = stock - 1 ...');
// If one fails, data is inconsistent!
```

✅ **After:**
```typescript
await pool.query('BEGIN');
try {
  await pool.query('INSERT INTO orders ...');
  await pool.query('INSERT INTO order_items ...');
  await pool.query('UPDATE products SET stock = stock - 1 ...');
  await pool.query('COMMIT');
} catch (error) {
  await pool.query('ROLLBACK');
  throw error;
}
```

### 3. Index Foreign Keys

✅ **Always:**
```sql
CREATE INDEX idx_reviews_course ON reviews(course_id);
CREATE INDEX idx_enrollments_user ON enrollments(user_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);
```

**Why:** Foreign keys are used in JOINs. Indexes make JOINs fast.

### 4. Use Connection Pooling

✅ **Setup:**
```typescript
const pool = new Pool({
  max: 20,                    // Maximum connections
  idleTimeoutMillis: 30000,   // Close idle connections after 30s
  connectionTimeoutMillis: 2000, // Wait max 2s for connection
});
```

**Benefits:**
- Reuses connections (faster)
- Prevents connection exhaustion
- Better resource management

### 5. Monitor Query Plans with EXPLAIN

```sql
EXPLAIN ANALYZE
SELECT c.*, AVG(r.rating) as avg_rating
FROM courses c
LEFT JOIN reviews r ON c.id = r.course_id
GROUP BY c.id;
```

**Output shows:**
- Index usage
- Scan type (index vs sequential)
- Estimated vs actual rows
- Execution time

**Look for:**
- ✅ "Index Scan" (good)
- ❌ "Seq Scan" (bad for large tables)
- ✅ Low actual time
- ❌ High actual rows

---

## Real-World Examples

### Example 1: Course Listing with Reviews

**Requirements:**
- List all published courses
- Show average rating
- Show review count
- Sort by newest first

❌ **Bad (N+1 Pattern):**
```typescript
export async function getCourses() {
  // 1 query: Get courses
  const courses = await pool.query(`
    SELECT * FROM courses
    WHERE is_published = true
    ORDER BY created_at DESC
  `);

  // N queries: Get reviews for each course
  for (const course of courses.rows) {
    const reviews = await pool.query(`
      SELECT * FROM reviews
      WHERE course_id = $1 AND is_approved = true
    `, [course.id]);

    course.averageRating = calculateAverage(reviews.rows);
    course.reviewCount = reviews.rows.length;
  }

  return courses.rows;
}

// Performance: 1 + 100 = 101 queries (~15 seconds)
```

✅ **Good (Single Query with JOIN):**
```typescript
export async function getCourses() {
  const result = await pool.query(`
    SELECT
      c.*,
      COALESCE(AVG(r.rating), 0) as average_rating,
      COUNT(DISTINCT r.id) as review_count
    FROM courses c
    LEFT JOIN reviews r
      ON c.id = r.course_id AND r.is_approved = true
    WHERE c.is_published = true
    GROUP BY c.id
    ORDER BY c.created_at DESC
  `);

  return result.rows;
}

// Performance: 1 query (~0.2 seconds)
// Improvement: 75x faster!
```

### Example 2: User Orders with Products

**Requirements:**
- List user's orders
- Show products in each order
- Show download count per product

❌ **Bad (N+1 Inside N+1):**
```typescript
export async function getUserOrders(userId: string) {
  // 1 query: Get orders
  const orders = await pool.query(`
    SELECT * FROM orders WHERE user_id = $1
  `, [userId]);

  // N queries: Get items for each order
  for (const order of orders.rows) {
    const items = await pool.query(`
      SELECT * FROM order_items WHERE order_id = $1
    `, [order.id]);

    // N*M queries: Get product for each item
    for (const item of items.rows) {
      const product = await pool.query(`
        SELECT * FROM digital_products WHERE id = $1
      `, [item.product_id]);

      // N*M queries: Get downloads
      const downloads = await pool.query(`
        SELECT COUNT(*) FROM download_logs
        WHERE order_id = $1 AND product_id = $2
      `, [order.id, item.product_id]);

      item.product = product.rows[0];
      item.downloadCount = downloads.rows[0].count;
    }

    order.items = items.rows;
  }

  return orders.rows;
}

// If user has 10 orders with 3 products each:
// 1 + 10 + (10*3) + (10*3) = 71 queries!
```

✅ **Good (Nested JOINs):**
```typescript
export async function getUserOrders(userId: string) {
  const result = await pool.query(`
    SELECT
      o.*,
      json_agg(
        json_build_object(
          'id', oi.id,
          'quantity', oi.quantity,
          'price', oi.price,
          'product', json_build_object(
            'id', dp.id,
            'title', dp.title,
            'type', dp.product_type
          ),
          'downloadCount', COUNT(DISTINCT dl.id)
        )
      ) as items
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    LEFT JOIN digital_products dp ON oi.product_id = dp.id
    LEFT JOIN download_logs dl
      ON o.id = dl.order_id AND dp.id = dl.product_id
    WHERE o.user_id = $1
    GROUP BY o.id
    ORDER BY o.created_at DESC
  `, [userId]);

  return result.rows;
}

// Performance: 1 query
// Improvement: 71x faster!
```

### Example 3: Search with Filters

**Requirements:**
- Search products by keyword
- Filter by type
- Filter by price range
- Sort by relevance

❌ **Bad (No Indexes, ILIKE):**
```typescript
export async function searchProducts(keyword: string, filters: any) {
  return await pool.query(`
    SELECT * FROM digital_products
    WHERE
      (title ILIKE $1 OR description ILIKE $1)
      AND product_type = $2
      AND price BETWEEN $3 AND $4
    ORDER BY created_at DESC
  `, [`%${keyword}%`, filters.type, filters.minPrice, filters.maxPrice]);
}

// Performance: Full table scan (~2 seconds for 10k products)
```

✅ **Good (GIN Index, Full-Text Search):**
```typescript
// First, create indexes
/*
CREATE INDEX idx_products_title_search
ON digital_products USING gin(to_tsvector('english', title));

CREATE INDEX idx_products_type ON digital_products(product_type);

CREATE INDEX idx_products_price ON digital_products(price);
*/

export async function searchProducts(keyword: string, filters: any) {
  return await pool.query(`
    SELECT *,
      ts_rank(to_tsvector('english', title || ' ' || description), query) as relevance
    FROM digital_products,
      to_tsquery('english', $1) query
    WHERE
      to_tsvector('english', title || ' ' || description) @@ query
      AND product_type = $2
      AND price BETWEEN $3 AND $4
    ORDER BY relevance DESC
  `, [keyword.replace(/\s+/g, ' & '), filters.type, filters.minPrice, filters.maxPrice]);
}

// Performance: ~50ms (40x faster!)
// Uses GIN index for text search, B-tree for type and price
```

---

## Conclusion

### Key Takeaways

1. **N+1 is Expensive**
   - 100 courses = 101 queries = 15 seconds
   - 1 JOIN query = 0.2 seconds
   - **75x faster with proper JOINs**

2. **Indexes Are Critical**
   - Without index: 500ms (full table scan)
   - With index: 5ms (index lookup)
   - **100x faster with proper indexes**

3. **Caching Reduces Load**
   - T212 caching: 70-90% fewer database queries
   - T213 indexes: 50-90% faster queries
   - **Combined: 90%+ load reduction**

4. **Monitoring Prevents Problems**
   - Query profiler detects N+1 in real-time
   - Slow query logging identifies bottlenecks
   - Admin API provides visibility

### Optimization Checklist

Before deploying:
- ✅ No N+1 patterns (use query profiler)
- ✅ All foreign keys indexed
- ✅ Common WHERE columns indexed
- ✅ Full-text search uses GIN indexes
- ✅ Caching enabled for frequently accessed data
- ✅ Query profiling integrated into high-traffic routes
- ✅ Slow query alerts configured
- ✅ Admin dashboard monitoring active

### Performance Targets

**Excellent Performance:**
- Average queries per request: <5
- Slow query percentage: <5%
- Average query duration: <50ms
- Cache hit rate: >80%

**When to Optimize:**
- Queries per request: >20
- Slow query percentage: >10%
- Average query duration: >100ms
- Cache hit rate: <60%

### Next Learning Steps

1. **Advanced Indexing**
   - Partial indexes
   - Expression indexes
   - Covering indexes
   - Index-only scans

2. **Query Plan Analysis**
   - EXPLAIN ANALYZE
   - Sequential scan vs index scan
   - Join algorithms
   - Cost estimation

3. **Advanced Optimization**
   - Materialized views
   - Query result caching
   - Connection pooling tuning
   - Database sharding

4. **Monitoring & Alerts**
   - Slow query log analysis
   - Performance trending
   - Automated optimization suggestions
   - Real-time dashboards

---

**Resources:**
- [PostgreSQL Performance Tips](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [Use The Index, Luke](https://use-the-index-luke.com/)
- [PostgreSQL EXPLAIN Guide](https://www.postgresql.org/docs/current/using-explain.html)
- Our docs: `docs/DATABASE_OPTIMIZATION.md`

**Remember:** Measure first, optimize second. Always use the query profiler to identify real bottlenecks before optimizing!
