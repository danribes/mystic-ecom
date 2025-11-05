# Database Query Optimization: Complete Learning Guide

**Task:** T140 - Optimize Database Queries (Add Indexes, Analyze Slow Queries)
**Level:** Intermediate to Advanced
**Estimated Reading Time:** 60 minutes

---

## 📚 Table of Contents

1. [Introduction to Query Optimization](#introduction)
2. [Understanding Database Indexes](#indexes)
3. [Query Performance Analysis](#analysis)
4. [Common Performance Problems](#problems)
5. [Optimization Strategies](#strategies)
6. [Profiling and Monitoring](#monitoring)
7. [Real-World Examples](#examples)
8. [Best Practices](#best-practices)
9. [Tools and Resources](#resources)

---

## 🎯 Introduction to Query Optimization {#introduction}

### What is Query Optimization?

Query optimization is the process of improving database query performance to reduce execution time, minimize resource usage, and improve overall application responsiveness.

**Key Goals:**
- Reduce query execution time
- Minimize database load
- Improve user experience
- Lower infrastructure costs

### Why Does It Matter?

**For Users:**
- Faster page loads
- Smoother interactions
- Better overall experience

**For Developers:**
- Easier debugging
- Better application performance
- Fewer production issues

**For Business:**
- Lower server costs
- Better scalability
- Higher user satisfaction
- Reduced bounce rates

### Performance Impact

```
Slow Query (500ms):
- User waits half a second
- Server busy for 500ms
- Can handle ~2 requests/second

Optimized Query (10ms):
- Near-instant response
- Server busy for 10ms
- Can handle ~100 requests/second
```

**50x performance improvement = 50x capacity**

---

## 📊 Understanding Database Indexes {#indexes}

### What is an Index?

An index is a data structure that improves the speed of data retrieval operations on a database table.

**Analogy:**
Think of an index like a book's index. Instead of reading every page to find "PostgreSQL", you look in the index and jump directly to page 145.

### How Indexes Work

**Without Index (Sequential Scan):**
```sql
SELECT * FROM users WHERE email = 'john@example.com';

-- Database must check EVERY row:
Row 1: email = 'alice@example.com'? NO
Row 2: email = 'bob@example.com'? NO
Row 3: email = 'charlie@example.com'? NO
...
Row 1,000,000: email = 'john@example.com'? YES ✅

-- O(n) complexity - linear search
```

**With Index (Index Scan):**
```sql
-- Index is a sorted tree structure
CREATE INDEX idx_users_email ON users(email);

SELECT * FROM users WHERE email = 'john@example.com';

-- Database uses B-tree index:
1. Start at root node
2. Navigate to correct branch
3. Find exact match in ~log(n) steps

-- O(log n) complexity - logarithmic search
```

**Performance Difference:**
```
1,000,000 rows:
- Sequential scan: ~1,000,000 comparisons
- Index scan: ~20 comparisons (log₂ 1,000,000 ≈ 20)

Result: 50,000x faster! ⚡
```

---

### Types of Indexes

#### 1. B-Tree Index (Default)

**Best For:**
- Equality comparisons (=)
- Range queries (<, >, BETWEEN)
- Sorting (ORDER BY)
- Pattern matching (LIKE 'prefix%')

**Example:**
```sql
CREATE INDEX idx_users_created_at ON users(created_at);

-- Fast queries:
SELECT * FROM users WHERE created_at > '2025-01-01';
SELECT * FROM users WHERE created_at BETWEEN '2025-01-01' AND '2025-12-31';
SELECT * FROM users ORDER BY created_at DESC LIMIT 10;
```

**How It Works:**
```
B-Tree Structure:
           [50]
          /    \
      [25]      [75]
     /   \      /   \
  [10] [30]  [60] [90]
  
Each node contains:
- Key value
- Pointer to row
- Pointers to child nodes
```

---

#### 2. Composite Index

**Multiple Columns:**
```sql
CREATE INDEX idx_orders_user_status_date 
ON orders(user_id, status, created_at DESC);
```

**Column Order Matters:**

```sql
-- ✅ FAST - Uses index efficiently
SELECT * FROM orders 
WHERE user_id = 123 AND status = 'completed'
ORDER BY created_at DESC;

-- ✅ FAST - Uses first column
SELECT * FROM orders WHERE user_id = 123;

-- ❌ SLOW - Cannot use index (user_id not specified)
SELECT * FROM orders WHERE status = 'completed';
```

**Rule:** Index works left-to-right. Missing leftmost column = index not used.

**Best Practices:**
1. Put most selective (unique) columns first
2. Put equality columns before range columns
3. Put ORDER BY columns last

---

#### 3. Partial Index

**Indexes Only Subset of Rows:**

```sql
-- Index only pending orders
CREATE INDEX idx_orders_pending 
ON orders(user_id, created_at DESC)
WHERE status = 'pending';
```

**Benefits:**
- Smaller index size
- Faster writes (fewer rows to index)
- Faster queries on filtered data

**Use Cases:**
- Status-based filtering
- Soft deletes (WHERE deleted_at IS NULL)
- Active/inactive records
- Recent data (WHERE created_at > NOW() - INTERVAL '30 days')

**Example:**
```sql
-- Full index: 10 GB, covers 1,000,000 orders
CREATE INDEX idx_orders_all ON orders(user_id);

-- Partial index: 500 MB, covers 50,000 pending orders
CREATE INDEX idx_orders_pending ON orders(user_id)
WHERE status = 'pending';

-- 95% space savings! 🎉
```

---

#### 4. GIN Index (Generalized Inverted Index)

**Best For:**
- Full-text search
- JSONB columns
- Array columns

**Full-Text Search:**
```sql
CREATE INDEX idx_courses_search 
ON courses USING gin(to_tsvector('english', title || ' ' || description));

-- Fast full-text search:
SELECT * FROM courses
WHERE to_tsvector('english', title || ' ' || description) @@ to_tsquery('meditation');
```

**JSONB Queries:**
```sql
CREATE INDEX idx_metadata_json 
ON courses USING gin(metadata);

-- Fast JSON queries:
SELECT * FROM courses WHERE metadata @> '{"category": "mindfulness"}';
SELECT * FROM courses WHERE metadata ? 'featured';
```

---

#### 5. BRIN Index (Block Range Index)

**Best For:**
- Very large tables
- Naturally ordered data (timestamps, IDs)
- Low cardinality

**Example:**
```sql
CREATE INDEX idx_logs_timestamp USING brin(created_at);

-- Tiny index size, good for append-only tables
```

**Trade-offs:**
- Very small index size (100x smaller than B-tree)
- Slower than B-tree for random access
- Great for sequential data

---

### Index Trade-offs

**Pros:**
- ✅ Faster SELECT queries
- ✅ Faster JOIN operations
- ✅ Faster ORDER BY operations
- ✅ Enforces uniqueness

**Cons:**
- ❌ Slower INSERT operations
- ❌ Slower UPDATE operations  
- ❌ Slower DELETE operations
- ❌ Takes up disk space
- ❌ Requires maintenance

**Rule of Thumb:**
- Read-heavy tables: Add more indexes
- Write-heavy tables: Minimize indexes
- Balance based on access patterns

---

## 🔍 Query Performance Analysis {#analysis}

### EXPLAIN Command

**The Secret Weapon:**
```sql
EXPLAIN SELECT * FROM users WHERE email = 'john@example.com';
```

**Output:**
```
Seq Scan on users  (cost=0.00..2345.00 rows=1 width=100)
  Filter: (email = 'john@example.com')
```

**Reading EXPLAIN Output:**
- `Seq Scan`: Sequential scan (bad for large tables)
- `cost=0.00..2345.00`: Estimated cost (arbitrary units)
- `rows=1`: Estimated rows returned
- `width=100`: Average row size in bytes

---

### EXPLAIN ANALYZE (Better)

**Shows Actual Performance:**
```sql
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'john@example.com';
```

**Output:**
```
Seq Scan on users  (cost=0.00..2345.00 rows=1 width=100) (actual time=45.234..45.235 rows=1 loops=1)
  Filter: (email = 'john@example.com')
  Rows Removed by Filter: 999999
Planning Time: 0.123 ms
Execution Time: 45.256 ms
```

**Key Metrics:**
- `actual time`: Real execution time
- `rows=1`: Actual rows returned
- `Rows Removed by Filter`: Wasted comparisons
- `Execution Time`: Total query time

**Analysis:**
Scanning 999,999 unnecessary rows! Need an index.

---

### After Adding Index

```sql
CREATE INDEX idx_users_email ON users(email);

EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'john@example.com';
```

**Output:**
```
Index Scan using idx_users_email on users  (cost=0.42..8.44 rows=1 width=100) (actual time=0.025..0.026 rows=1 loops=1)
  Index Cond: (email = 'john@example.com')
Planning Time: 0.234 ms
Execution Time: 0.045 ms
```

**Improvement:**
- Execution time: 45ms → 0.045ms
- **1000x faster!** 🚀
- Changed from Seq Scan to Index Scan
- No rows removed by filter

---

### Common Scan Types

**1. Sequential Scan (Seq Scan)**
```
⚠️ Bad for large tables
✅ OK for small tables (<1000 rows)
```

**2. Index Scan**
```
✅ Good - Uses index
Fetches rows in index order
```

**3. Index Only Scan**
```
✅ Better - Uses only index
No table access needed (covering index)
```

**4. Bitmap Index Scan**
```
✅ Good - For multiple conditions
Combines multiple indexes
```

**5. Nested Loop**
```
⚠️ Watch out - Can be slow with large datasets
✅ Fast for small datasets
```

**6. Hash Join**
```
✅ Good for equality joins
✅ Fast for large datasets
```

**7. Merge Join**
```
✅ Good for sorted data
✅ Efficient for large sorted sets
```

---

## 🐛 Common Performance Problems {#problems}

### 1. The N+1 Query Problem

**The Problem:**

```typescript
// ❌ BAD: N+1 queries
const users = await db.query('SELECT * FROM users LIMIT 10');

for (const user of users) {
  // Executes 10 separate queries!
  const courses = await db.query(
    'SELECT * FROM courses WHERE user_id = $1',
    [user.id]
  );
  user.courses = courses.rows;
}

// Total: 1 + 10 = 11 queries
```

**The Solution:**

```typescript
// ✅ GOOD: Single query with JOIN
const usersWithCourses = await db.query(`
  SELECT
    u.*,
    json_agg(
      json_build_object(
        'id', c.id,
        'title', c.title
      )
    ) AS courses
  FROM users u
  LEFT JOIN courses c ON c.user_id = u.id
  WHERE u.id IN (1, 2, 3, 4, 5, 6, 7, 8, 9, 10)
  GROUP BY u.id
`);

// Total: 1 query
```

**Performance:**
```
N+1 approach: 11 queries × 10ms = 110ms
JOIN approach: 1 query × 15ms = 15ms

Result: 7.3x faster!
```

---

### 2. Missing WHERE Clause Index

**The Problem:**

```sql
-- No index on status column
SELECT * FROM orders WHERE status = 'pending';

-- Result: Sequential scan of entire table
```

**The Solution:**

```sql
-- Add index
CREATE INDEX idx_orders_status ON orders(status);

-- Or partial index for specific status
CREATE INDEX idx_orders_pending ON orders(user_id, created_at DESC)
WHERE status = 'pending';
```

---

### 3. Function Calls in WHERE Clause

**The Problem:**

```sql
-- ❌ BAD: Index cannot be used
SELECT * FROM users WHERE LOWER(email) = 'john@example.com';

-- Reason: Function call prevents index usage
```

**The Solution:**

```sql
-- ✅ GOOD: Store email in lowercase
UPDATE users SET email = LOWER(email);
SELECT * FROM users WHERE email = 'john@example.com';

-- Or use expression index:
CREATE INDEX idx_users_email_lower ON users(LOWER(email));
SELECT * FROM users WHERE LOWER(email) = 'john@example.com';
```

---

### 4. SELECT * (Fetching Unnecessary Data)

**The Problem:**

```sql
-- ❌ BAD: Fetches all columns
SELECT * FROM courses WHERE id = 123;

-- Wastes I/O reading unused columns
```

**The Solution:**

```sql
-- ✅ GOOD: Fetch only needed columns
SELECT id, title, price FROM courses WHERE id = 123;

-- Even better: Covering index (index-only scan)
CREATE INDEX idx_courses_id_title_price ON courses(id) INCLUDE (title, price);
```

---

### 5. OR Conditions

**The Problem:**

```sql
-- ❌ BAD: Cannot use indexes efficiently
SELECT * FROM users WHERE email = 'john@example.com' OR phone = '555-1234';
```

**The Solution:**

```sql
-- ✅ GOOD: Use UNION
SELECT * FROM users WHERE email = 'john@example.com'
UNION
SELECT * FROM users WHERE phone = '555-1234';

-- Allows each query to use its own index
```

---

### 6. Implicit Type Conversions

**The Problem:**

```sql
-- user_id is INTEGER, but we pass STRING
SELECT * FROM orders WHERE user_id = '123';

-- PostgreSQL converts every row, preventing index usage
```

**The Solution:**

```sql
-- ✅ GOOD: Use correct type
SELECT * FROM orders WHERE user_id = 123;
```

---

## 🚀 Optimization Strategies {#strategies}

### Strategy 1: Add Indexes Strategically

**Analyze Query Patterns:**

```sql
-- Find tables with most sequential scans
SELECT
  schemaname || '.' || tablename AS table,
  seq_scan AS sequential_scans,
  idx_scan AS index_scans,
  n_live_tup AS row_count,
  CASE WHEN idx_scan > 0 
    THEN (seq_scan::float / idx_scan::float)
    ELSE seq_scan::float
  END AS seq_to_idx_ratio
FROM pg_stat_user_tables
WHERE n_live_tup > 1000
ORDER BY seq_to_idx_ratio DESC;
```

**Add Indexes Where Needed:**

```sql
-- High seq_to_idx_ratio = needs index
CREATE INDEX idx_table_column ON table(column);
```

---

### Strategy 2: Use Composite Indexes

**Single Query Pattern:**
```sql
SELECT * FROM orders 
WHERE user_id = 123 
  AND status = 'completed'
ORDER BY created_at DESC
LIMIT 10;
```

**Optimized Index:**
```sql
CREATE INDEX idx_orders_user_status_created 
ON orders(user_id, status, created_at DESC);

-- Supports:
-- 1. Filtering by user_id
-- 2. Filtering by status  
-- 3. Sorting by created_at
-- All in one index!
```

---

### Strategy 3: Covering Indexes

**Include Columns:**

```sql
CREATE INDEX idx_courses_id_include 
ON courses(id) INCLUDE (title, price, image_url);

-- SELECT id, title, price, image_url FROM courses WHERE id = 123
-- Uses index-only scan - never touches table!
```

---

### Strategy 4: Denormalization (Carefully)

**Problem: Expensive JOINs**

```sql
-- Joins 3 tables every time
SELECT 
  o.id,
  u.name,
  u.email,
  COUNT(oi.id) as item_count
FROM orders o
JOIN users u ON u.id = o.user_id
JOIN order_items oi ON oi.order_id = o.id
GROUP BY o.id, u.name, u.email;
```

**Solution: Store Commonly Accessed Data**

```sql
-- Add denormalized columns
ALTER TABLE orders 
ADD COLUMN user_name VARCHAR(255),
ADD COLUMN user_email VARCHAR(255),
ADD COLUMN item_count INTEGER DEFAULT 0;

-- Update on insert/update
-- Now query is simple:
SELECT id, user_name, user_email, item_count 
FROM orders 
WHERE id = 123;
```

**Trade-offs:**
- ✅ Faster reads
- ❌ Slower writes
- ❌ Data can become stale
- ❌ More storage

**When to Use:**
- Read-heavy workloads
- Data doesn't change often
- JOIN performance is critical

---

### Strategy 5: Partitioning

**For Very Large Tables:**

```sql
-- Partition orders by year
CREATE TABLE orders (
  id BIGSERIAL,
  user_id INTEGER,
  created_at TIMESTAMP,
  ...
) PARTITION BY RANGE (created_at);

CREATE TABLE orders_2023 PARTITION OF orders
FOR VALUES FROM ('2023-01-01') TO ('2024-01-01');

CREATE TABLE orders_2024 PARTITION OF orders
FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
```

**Benefits:**
- Queries only scan relevant partitions
- Faster VACUUM and ANALYZE
- Can drop old partitions easily

---

## 📈 Profiling and Monitoring {#monitoring}

### 1. Query Profiling in Application

**Using Our Query Profiler:**

```typescript
import { 
  startProfiling, 
  recordQuery, 
  finishProfiling,
  formatProfile 
} from './lib/queryProfiler';

// Start profiling
const requestId = generateRequestId();
startProfiling(requestId);

// Execute queries (automatically profiled)
await getUsers(requestId);
await getCourses(requestId);
await getOrders(requestId);

// Finish and analyze
const profile = finishProfiling(requestId);
console.log(formatProfile(profile));
```

**Output:**
```
Query Profile: req_1730876543_abc123
Total Queries: 15
Total Duration: 234ms
Potential N+1: YES

Recommendations:
  - Potential N+1 query pattern detected (12x similar queries)
  - Total query time is 234ms. Consider caching
```

---

### 2. Database-Level Monitoring

**Enable pg_stat_statements:**

```sql
-- In postgresql.conf
shared_preload_libraries = 'pg_stat_statements'

-- Restart PostgreSQL, then:
CREATE EXTENSION pg_stat_statements;
```

**Find Slow Queries:**

```sql
SELECT
  query,
  calls,
  mean_exec_time,
  max_exec_time,
  total_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 100  -- > 100ms average
ORDER BY mean_exec_time DESC
LIMIT 20;
```

---

### 3. Index Usage Statistics

**Find Unused Indexes:**

```sql
SELECT
  schemaname || '.' || tablename AS table,
  indexname AS index,
  idx_scan AS scans,
  pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND indexname NOT LIKE '%pkey%'
ORDER BY pg_relation_size(indexrelid) DESC;
```

**Find Most Used Indexes:**

```sql
SELECT
  schemaname || '.' || tablename AS table,
  indexname AS index,
  idx_scan AS scans,
  idx_tup_fetch AS rows_fetched
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC
LIMIT 20;
```

---

### 4. Cache Hit Ratio

**Monitor Buffer Cache:**

```sql
SELECT
  sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) AS cache_hit_ratio,
  sum(heap_blks_hit) AS buffer_hits,
  sum(heap_blks_read) AS disk_reads
FROM pg_statio_user_tables;
```

**Target: > 90% cache hit ratio**

**If Low:**
- Increase `shared_buffers`
- Increase `effective_cache_size`
- Review query patterns

---

## 🌍 Real-World Examples {#examples}

### Example 1: E-commerce Order History

**Problem:**
```sql
-- Slow query (2.3 seconds)
SELECT 
  o.*,
  u.name,
  u.email
FROM orders o
JOIN users u ON u.id = o.user_id
WHERE o.user_id = 123
ORDER BY o.created_at DESC;

-- EXPLAIN shows Seq Scan on orders
```

**Solution:**
```sql
-- Add composite index
CREATE INDEX idx_orders_user_created 
ON orders(user_id, created_at DESC);

-- Now executes in 12ms (191x faster!)
```

---

### Example 2: Full-Text Search

**Problem:**
```sql
-- Very slow (4.5 seconds)
SELECT * FROM courses
WHERE title LIKE '%meditation%'
   OR description LIKE '%meditation%';

-- Cannot use indexes (LIKE with leading %)
```

**Solution:**
```sql
-- Create GIN index for full-text search
CREATE INDEX idx_courses_search 
ON courses USING gin(
  to_tsvector('english', title || ' ' || description)
);

-- Use proper full-text query
SELECT * FROM courses
WHERE to_tsvector('english', title || ' ' || description) 
  @@ to_tsquery('english', 'meditation');

-- Now executes in 45ms (100x faster!)
```

---

### Example 3: Dashboard Analytics

**Problem:**
```sql
-- N+1 query in dashboard
const stats = [];
for (const user of users) {
  const orderCount = await db.query(
    'SELECT COUNT(*) FROM orders WHERE user_id = $1',
    [user.id]
  );
  stats.push({ user, orderCount });
}

-- 100 users = 100 queries
-- Total: 3.2 seconds
```

**Solution:**
```sql
-- Single query with aggregation
SELECT
  u.id,
  u.name,
  u.email,
  COUNT(o.id) as order_count
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
GROUP BY u.id, u.name, u.email;

-- Total: 85ms (37x faster!)
```

---

## ✅ Best Practices {#best-practices}

### 1. Index Design

**DO:**
- Index foreign keys
- Index columns in WHERE clauses
- Index columns in JOIN conditions
- Index columns in ORDER BY
- Use partial indexes for filtered queries
- Create covering indexes when possible

**DON'T:**
- Over-index (each index costs write performance)
- Index low-cardinality columns (gender, boolean)
- Forget to ANALYZE after creating indexes
- Create duplicate indexes

---

### 2. Query Writing

**DO:**
- Use prepared statements
- Fetch only needed columns
- Use LIMIT for pagination
- Use appropriate JOIN types
- Filter as early as possible

**DON'T:**
- Use SELECT *
- Put functions in WHERE clauses
- Use OR when UNION is better
- Ignore EXPLAIN output
- Query in loops (N+1 problem)

---

### 3. Monitoring

**DO:**
- Enable pg_stat_statements
- Monitor slow query log
- Track cache hit ratio
- Review index usage monthly
- Profile in development
- Test with production-scale data

**DON'T:**
- Wait for users to complain
- Ignore performance warnings
- Test only with small datasets
- Skip regular performance reviews

---

### 4. Maintenance

**DO:**
- Run VACUUM regularly
- Run ANALYZE after bulk operations
- Monitor table bloat
- Review and remove unused indexes
- Update PostgreSQL version

**DON'T:**
- Let autovacuum fall behind
- Ignore statistics staleness
- Keep unused indexes
- Run without monitoring

---

## 🛠️ Tools and Resources {#resources}

### PostgreSQL Tools

**pg_stat_statements**
- Track query performance
- Identify slow queries
- Monitor resource usage

**EXPLAIN / EXPLAIN ANALYZE**
- Understand query execution
- Identify bottlenecks
- Validate index usage

**PgHero**
- Visual performance dashboard
- Index suggestions
- Query analysis

**pgbadger**
- Log analyzer
- Performance reports
- Query statistics

---

### Monitoring Services

**Sentry**
- Application performance monitoring
- Slow query alerts
- Error tracking

**DataDog**
- Infrastructure monitoring
- Database metrics
- Custom dashboards

**New Relic**
- APM with database insights
- Query analysis
- Performance trends

---

### Online Resources

**Official Documentation:**
- [PostgreSQL Performance Tips](https://www.postgresql.org/docs/current/performance-tips.html)
- [Indexes in PostgreSQL](https://www.postgresql.org/docs/current/indexes.html)
- [EXPLAIN Documentation](https://www.postgresql.org/docs/current/sql-explain.html)

**Learning Resources:**
- [Use The Index, Luke!](https://use-the-index-luke.com/)
- [PostgreSQL Exercises](https://pgexercises.com/)
- [Postgres Weekly Newsletter](https://postgresweekly.com/)

**Books:**
- "The Art of PostgreSQL" by Dimitri Fontaine
- "PostgreSQL Query Optimization" by Henrietta Dombrovskaya
- "High Performance PostgreSQL" by Gregory Smith

---

## 🎓 Summary

**Key Takeaways:**

1. **Indexes Speed Up Reads**
   - B-tree for most cases
   - GIN for full-text and JSONB
   - Partial for filtered queries
   - Composite for multi-column

2. **Avoid N+1 Queries**
   - Use JOINs instead of loops
   - Fetch related data together
   - Profile during development

3. **Monitor Performance**
   - Use EXPLAIN ANALYZE
   - Enable pg_stat_statements
   - Track cache hit ratio
   - Review index usage

4. **Optimize Strategically**
   - Index high-traffic queries
   - Remove unused indexes
   - Test with real data
   - Monitor continuously

**Next Steps:**
1. Enable query profiling in your app
2. Run database performance analysis
3. Add missing indexes
4. Fix identified N+1 queries
5. Set up continuous monitoring

---

**Happy Optimizing!** 🚀
