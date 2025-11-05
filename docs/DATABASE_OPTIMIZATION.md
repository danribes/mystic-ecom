# Database Optimization Guide

**Task:** T213 - Database Query Optimization and N+1 Prevention

## Table of Contents

1. [Current Optimizations](#current-optimizations)
2. [Recommended Indexes](#recommended-indexes)
3. [Query Patterns](#query-patterns)
4. [N+1 Prevention](#n1-prevention)
5. [Performance Monitoring](#performance-monitoring)

## Current Optimizations

### JOIN Optimization

All listing queries use JOINs to fetch related data in a single query:

**Courses:**
```sql
SELECT c.*, COALESCE(AVG(r.rating), 0) as rating, COUNT(DISTINCT r.id) as review_count
FROM courses c
LEFT JOIN reviews r ON c.id = r.course_id AND r.is_approved = true
WHERE c.is_published = true
GROUP BY c.id
```

**Products:**
```sql
SELECT dp.*, o.id as order_id, o.created_at as purchase_date, COUNT(dl.id) as download_count
FROM orders o
INNER JOIN order_items oi ON oi.order_id = o.id
INNER JOIN digital_products dp ON dp.id = oi.digital_product_id
LEFT JOIN download_logs dl ON dl.order_id = o.id AND dl.digital_product_id = dp.id
WHERE o.user_id = $1 AND o.status = 'completed'
GROUP BY dp.id, o.id, o.created_at
```

### Caching Layer (T212)

- Products: 5-minute TTL
- Courses: 10-minute TTL
- Events: 10-minute TTL
- Expected 70-90% database load reduction

## Recommended Indexes

### Courses Table

```sql
-- Primary lookups
CREATE INDEX IF NOT EXISTS idx_courses_slug ON courses(slug);
CREATE INDEX IF NOT EXISTS idx_courses_published ON courses(is_published) WHERE is_published = true;

-- Filtering
CREATE INDEX IF NOT EXISTS idx_courses_level ON courses(level);
CREATE INDEX IF NOT EXISTS idx_courses_price ON courses(price);

-- Sorting
CREATE INDEX IF NOT EXISTS idx_courses_created_at ON courses(created_at DESC);

-- Composite for common queries
CREATE INDEX IF NOT EXISTS idx_courses_published_level ON courses(is_published, level) WHERE is_published = true;
```

### Reviews Table

```sql
-- JOIN optimization
CREATE INDEX IF NOT EXISTS idx_reviews_course_approved ON reviews(course_id, is_approved) WHERE is_approved = true;
CREATE INDEX IF NOT EXISTS idx_reviews_product_approved ON reviews(product_id, is_approved) WHERE is_approved = true;

-- Aggregations
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
```

### Course Enrollments

```sql
-- User lookups
CREATE INDEX IF NOT EXISTS idx_enrollments_user ON course_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON course_enrollments(course_id);

-- Uniqueness check
CREATE UNIQUE INDEX IF NOT EXISTS idx_enrollments_user_course ON course_enrollments(user_id, course_id);
```

### Digital Products

```sql
-- Lookups
CREATE INDEX IF NOT EXISTS idx_products_slug ON digital_products(slug);
CREATE INDEX IF NOT EXISTS idx_products_published ON digital_products(is_published) WHERE is_published = true;

-- Filtering
CREATE INDEX IF NOT EXISTS idx_products_type ON digital_products(product_type);
CREATE INDEX IF NOT EXISTS idx_products_price ON digital_products(price);

-- Full-text search
CREATE INDEX IF NOT EXISTS idx_products_title_search ON digital_products USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_products_description_search ON digital_products USING gin(to_tsvector('english', description));
```

### Events Table

```sql
-- Lookups
CREATE INDEX IF NOT EXISTS idx_events_slug ON events(slug);
CREATE INDEX IF NOT EXISTS idx_events_published ON events(is_published) WHERE is_published = true;

-- Date filtering
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_upcoming ON events(event_date) WHERE is_published = true AND event_date >= CURRENT_DATE;

-- Location filtering
CREATE INDEX IF NOT EXISTS idx_events_city ON events(venue_city);
CREATE INDEX IF NOT EXISTS idx_events_country ON events(venue_country);

-- Availability
CREATE INDEX IF NOT EXISTS idx_events_available ON events(available_spots) WHERE available_spots > 0;
```

### Orders and Order Items

```sql
-- User orders
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_user_status ON orders(user_id, status);

-- Order items
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(digital_product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_course ON order_items(course_id);
```

### Bookings

```sql
-- User bookings
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_event ON bookings(event_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

-- Event capacity checking
CREATE INDEX IF NOT EXISTS idx_bookings_event_status ON bookings(event_id, status) WHERE status != 'cancelled';
```

## Query Patterns

### 1. Pagination with Filtering

**Pattern:**
```sql
SELECT * FROM courses
WHERE is_published = true
  AND level = $1
  AND price BETWEEN $2 AND $3
ORDER BY created_at DESC
LIMIT $4 OFFSET $5
```

**Optimization:**
- Use composite index on (is_published, level)
- Add separate index on price for range queries
- Add index on created_at for sorting

### 2. Search with Aggregation

**Pattern:**
```sql
SELECT c.*, COUNT(e.id) as enrollment_count
FROM courses c
LEFT JOIN course_enrollments e ON c.id = e.course_id
WHERE c.title ILIKE '%search%'
GROUP BY c.id
ORDER BY enrollment_count DESC
```

**Optimization:**
- Use GIN index for full-text search instead of ILIKE
- Consider materialized view for enrollment counts

### 3. Related Data Fetching

**Always use JOINs, never loop queries:**

❌ **Bad (N+1):**
```typescript
const courses = await getCourses();
for (const course of courses) {
  course.reviews = await getReviewsForCourse(course.id); // N queries!
}
```

✅ **Good (Single Query):**
```typescript
const courses = await db.query(`
  SELECT c.*, COALESCE(AVG(r.rating), 0) as avg_rating
  FROM courses c
  LEFT JOIN reviews r ON c.id = r.course_id
  GROUP BY c.id
`);
```

## N+1 Prevention

### Detection

Use the query profiler to detect N+1 patterns:

```typescript
import { startProfiling, finishProfiling, formatProfile } from '@/lib/queryProfiler';

const requestId = generateRequestId();
startProfiling(requestId);

// ... execute queries ...

const profile = finishProfiling(requestId);
if (profile?.potentialN1) {
  console.warn('N+1 detected:', formatProfile(profile));
}
```

### Common N+1 Scenarios

**1. Loop with Individual Lookups**

❌ Bad:
```typescript
const users = await getUsers();
for (const user of users) {
  user.orders = await getOrdersForUser(user.id);
}
```

✅ Good:
```typescript
SELECT u.*, json_agg(o.*) as orders
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
GROUP BY u.id
```

**2. Nested Relationships**

❌ Bad:
```typescript
const courses = await getCourses();
for (const course of courses) {
  course.instructor = await getUser(course.instructor_id);
  course.reviews = await getReviews(course.id);
}
```

✅ Good:
```typescript
SELECT c.*, u.name as instructor_name, json_agg(r.*) as reviews
FROM courses c
LEFT JOIN users u ON c.instructor_id = u.id
LEFT JOIN reviews r ON c.id = r.course_id
GROUP BY c.id, u.name
```

**3. Conditional Fetching**

❌ Bad:
```typescript
for (const item of items) {
  if (item.needs_details) {
    item.details = await getDetails(item.id);
  }
}
```

✅ Good:
```typescript
SELECT i.*, CASE WHEN i.needs_details THEN d.* ELSE NULL END as details
FROM items i
LEFT JOIN details d ON i.id = d.item_id AND i.needs_details = true
```

## Performance Monitoring

### Query Profiler Usage

```typescript
import { measureQuery, recordQuery } from '@/lib/queryProfiler';

// Option 1: Wrap existing query
const result = await measureQuery(
  () => pool.query('SELECT * FROM courses'),
  requestId,
  'Fetch all courses'
);

// Option 2: Manual recording
const start = Date.now();
const result = await pool.query(query, params);
recordQuery(requestId, query, Date.now() - start, params);
```

### Performance Thresholds

```typescript
SLOW_QUERY_MS: 100         // Queries > 100ms are logged as slow
N1_THRESHOLD: 10            // 10+ similar queries = potential N+1
MAX_QUERIES_PER_REQUEST: 50 // Warn if > 50 queries per request
```

### Monitoring Checklist

- [ ] Enable slow query log in PostgreSQL
- [ ] Monitor query execution times
- [ ] Track query count per request
- [ ] Alert on N+1 patterns
- [ ] Review query plans with EXPLAIN
- [ ] Monitor cache hit rates
- [ ] Track database connection pool usage

### PostgreSQL Configuration

```conf
# postgresql.conf

# Logging
log_min_duration_statement = 100  # Log queries > 100ms
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
log_statement = 'none'

# Performance
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 16MB
maintenance_work_mem = 128MB

# Connections
max_connections = 100
```

### Admin API for Query Stats

```typescript
// GET /api/admin/query-stats
{
  "totalQueries": 1234,
  "averageQueriesPerRequest": 5.2,
  "slowQueries": 23,
  "cacheHitRate": 85.5
}
```

## Optimization Workflow

1. **Identify Slow Queries**
   - Check slow query log
   - Use query profiler
   - Monitor APM tools

2. **Analyze Query Plan**
   ```sql
   EXPLAIN ANALYZE SELECT * FROM courses WHERE ...;
   ```

3. **Add Indexes**
   - Create indexes for WHERE clauses
   - Create indexes for JOIN columns
   - Create indexes for ORDER BY columns

4. **Test Performance**
   - Compare execution times
   - Verify index usage
   - Check query plans

5. **Monitor Production**
   - Track query times
   - Alert on regressions
   - Review regularly

## Best Practices

1. **Always Use Parameterized Queries**
   ```typescript
   ✅ pool.query('SELECT * FROM users WHERE id = $1', [userId])
   ❌ pool.query(`SELECT * FROM users WHERE id = '${userId}'`)
   ```

2. **Fetch Only Required Columns**
   ```typescript
   ✅ SELECT id, name, email FROM users
   ❌ SELECT * FROM users
   ```

3. **Use LIMIT for Large Result Sets**
   ```typescript
   ✅ SELECT * FROM logs ORDER BY created_at DESC LIMIT 100
   ❌ SELECT * FROM logs ORDER BY created_at DESC
   ```

4. **Avoid N+1 with JOINs or Batch Loading**
   - Single query with JOINs
   - DataLoader for GraphQL
   - Batch queries with WHERE IN

5. **Cache Expensive Queries**
   - Aggregate queries
   - Report queries
   - Rarely-changing data

6. **Use Transactions for Consistency**
   ```typescript
   await pool.query('BEGIN');
   try {
     // Multiple queries
     await pool.query('COMMIT');
   } catch (error) {
     await pool.query('ROLLBACK');
   }
   ```

## Conclusion

This optimization strategy combines:
- ✅ Proper indexes for all common queries
- ✅ JOIN-based queries to prevent N+1
- ✅ Redis caching (70-90% load reduction)
- ✅ Query profiling and monitoring
- ✅ Performance thresholds and alerts

**Expected Results:**
- Database query reduction: 70-90% (via caching)
- Query execution time: <50ms average
- Zero N+1 patterns in production
- Scalable to 100k+ users
