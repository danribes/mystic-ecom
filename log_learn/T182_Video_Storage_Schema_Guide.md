# T182: Video Storage Schema - Learning Guide

**Topic**: Database Schema Design for Video Storage
**Level**: Intermediate
**Prerequisites**: SQL basics, PostgreSQL, understanding of relational databases
**Related**: T181 (Cloudflare Stream API)

---

## Table of Contents

1. [Introduction](#introduction)
2. [Core Concepts](#core-concepts)
3. [Schema Design](#schema-design)
4. [Implementation Details](#implementation-details)
5. [Best Practices](#best-practices)
6. [Common Patterns](#common-patterns)
7. [Performance Optimization](#performance-optimization)
8. [Security Considerations](#security-considerations)
9. [Real-World Examples](#real-world-examples)
10. [Exercises](#exercises)

---

## Introduction

### What This Guide Covers

This guide explains how to design and implement a database schema for storing video metadata in an e-learning platform. You'll learn:

- How to structure video data in relational databases
- When to use separate tables vs. embedded columns
- How to implement proper constraints and indexes
- How to integrate with external video hosting services (Cloudflare Stream)
- Best practices for performance and data integrity

### Why Video Storage Matters

Video is the most engaging content format in e-learning platforms:
- 65% of learners prefer video over text
- Video courses have 5x higher completion rates
- Proper video management is critical for user experience

**Key Challenge**: Videos are large files that shouldn't be stored directly in databases. Instead, we store metadata and URLs while actual video files live in specialized storage services.

---

## Core Concepts

### 1. Video Metadata vs. Video Files

**Video Metadata** (stored in database):
- Video ID, title, description
- Duration, thumbnail URL
- Processing status
- Playback URLs

**Video Files** (stored in external service):
- Actual video binary data
- Transcoded versions
- HLS/DASH manifests

```
┌─────────────┐         ┌──────────────────┐
│  Database   │────────▶│  Video Service   │
│  (metadata) │ Links to│  (actual videos) │
└─────────────┘         └──────────────────┘
```

### 2. One-to-Many Relationships

Courses have multiple lesson videos:

```
courses (1) ──────< course_videos (many)
```

**Example**:
- Course: "Advanced Meditation"
  - Video 1: "Introduction to Practice"
  - Video 2: "Breathing Techniques"
  - Video 3: "Guided Session"

### 3. Video Processing States

Videos go through a lifecycle:

```
queued → inprogress → ready (or error)
```

- **queued**: Upload started, waiting for processing
- **inprogress**: Being transcoded/processed
- **ready**: Available for playback
- **error**: Processing failed

### 4. Foreign Key Cascade Behaviors

Different delete behaviors for different relationships:

**CASCADE**: Delete dependent data automatically
```sql
course_videos.course_id → courses.id ON DELETE CASCADE
-- Deleting a course also deletes its videos
```

**RESTRICT**: Prevent deletion if dependent data exists
```sql
orders.user_id → users.id ON DELETE RESTRICT
-- Cannot delete user with existing orders
```

**SET NULL**: Keep record but nullify reference
```sql
download_logs.user_id → users.id ON DELETE SET NULL
-- Keep download log but remove user reference
```

---

## Schema Design

### Design Decision 1: Separate Table vs. Embedded Columns

**Question**: Should we store video data in the courses table or create a separate table?

#### Option A: Embedded in Courses Table
```sql
CREATE TABLE courses (
  id UUID,
  title VARCHAR,
  video1_url VARCHAR,
  video2_url VARCHAR,
  video3_url VARCHAR
  -- Problems: Fixed number of videos, repetitive columns
);
```

❌ **Problems**:
- Fixed number of videos
- Cannot add videos dynamically
- Hard to query all videos
- Repetitive column structure

#### Option B: Separate Videos Table
```sql
CREATE TABLE courses (
  id UUID,
  title VARCHAR
);

CREATE TABLE course_videos (
  id UUID,
  course_id UUID REFERENCES courses(id),
  lesson_id VARCHAR,
  video_url VARCHAR
);
```

✅ **Benefits**:
- Unlimited videos per course
- Easy to add/remove videos
- Clean queries for all videos
- Follows normalization principles

### Design Decision 2: Preview Videos

**Question**: Preview videos are always one per course. Should they be in a separate table?

#### Analysis
```
Preview Video: One per course → Embed in courses table
Lesson Videos: Many per course → Separate table
```

**Implementation**:
```sql
CREATE TABLE courses (
  id UUID,
  title VARCHAR,
  -- Preview video (1:1 relationship)
  preview_video_url VARCHAR,
  preview_video_id VARCHAR,
  preview_video_thumbnail VARCHAR,
  preview_video_duration INTEGER
);

CREATE TABLE course_videos (
  -- Lesson videos (1:N relationship)
  id UUID,
  course_id UUID REFERENCES courses(id),
  lesson_id VARCHAR
);
```

**Rationale**:
- No JOIN needed to fetch preview video
- Simpler queries for course listings
- Preview video is always loaded with course data
- One-to-one relationships can be embedded

### Design Decision 3: Lesson Identifiers

**Question**: Should lesson_id be a foreign key to a lessons table?

#### Option A: Foreign Key to Lessons Table
```sql
CREATE TABLE lessons (
  id UUID PRIMARY KEY,
  course_id UUID,
  order_number INTEGER
);

CREATE TABLE course_videos (
  lesson_id UUID REFERENCES lessons(id)
);
```

**Problems**:
- Rigid structure
- Course curriculum stored as JSONB (flexible)
- Different courses use different lesson ID formats
- Creates unnecessary coupling

#### Option B: Flexible VARCHAR Field
```sql
CREATE TABLE course_videos (
  lesson_id VARCHAR(255) NOT NULL
  -- Examples: "lesson-1", "module-2-lesson-3", "intro"
);
```

✅ **Benefits**:
- Matches flexible curriculum structure
- Supports various naming conventions
- No rigid schema constraints
- Easy to integrate with existing JSONB curriculum

**Safety**: Unique constraint on (course_id, lesson_id) prevents duplicates

---

## Implementation Details

### 1. Enum Types for Status Values

**Why Enums?**
- Type safety at database level
- Clear documentation of valid values
- Prevents typos and invalid states
- Better than VARCHAR with CHECK constraint

**Implementation**:
```sql
CREATE TYPE video_status AS ENUM ('queued', 'inprogress', 'ready', 'error');

CREATE TABLE course_videos (
  status video_status DEFAULT 'queued'
);
```

**Benefits**:
- ❌ Invalid: `status = 'processing'` (not in enum)
- ✅ Valid: `status = 'inprogress'`
- Auto-complete in database tools
- Self-documenting schema

### 2. JSONB for Flexible Metadata

**Problem**: Cloudflare Stream returns extensive metadata:
- Resolution (1920x1080, 1280x720, etc.)
- Codec (h264, vp9, etc.)
- Bitrate (various values)
- File size
- Many other fields that may change

**Solution**: JSONB column

```sql
CREATE TABLE course_videos (
  metadata JSONB
);

-- Insert example
INSERT INTO course_videos (metadata) VALUES ('{
  "resolution": "1920x1080",
  "codec": "h264",
  "bitrate": 5000,
  "fileSize": 125000000,
  "audioChannels": 2
}');

-- Query by metadata
SELECT * FROM course_videos
WHERE metadata->>'resolution' = '1920x1080';

-- Update specific field
UPDATE course_videos
SET metadata = jsonb_set(metadata, '{bitrate}', '6000')
WHERE id = ?;
```

**Benefits**:
- Flexible structure
- No schema changes for new fields
- Queryable with JSON operators
- Preserves all API response data

### 3. Unique Constraints

**Purpose**: Prevent duplicate data and maintain integrity

**Implementation**:
```sql
CREATE TABLE course_videos (
  cloudflare_video_id VARCHAR(255) UNIQUE, -- Single-column unique
  CONSTRAINT unique_course_lesson UNIQUE(course_id, lesson_id) -- Composite unique
);
```

**Examples**:

```sql
-- ✅ Valid: Different Cloudflare IDs
INSERT INTO course_videos VALUES (uuid_gen(), course1, 'lesson-1', 'cf-video-1');
INSERT INTO course_videos VALUES (uuid_gen(), course1, 'lesson-2', 'cf-video-2');

-- ❌ Invalid: Duplicate Cloudflare ID
INSERT INTO course_videos VALUES (uuid_gen(), course2, 'lesson-1', 'cf-video-1');
-- ERROR: duplicate key value violates unique constraint

-- ❌ Invalid: Duplicate course-lesson combination
INSERT INTO course_videos VALUES (uuid_gen(), course1, 'lesson-1', 'cf-video-3');
-- ERROR: duplicate key value violates unique constraint "unique_course_lesson"
```

### 4. Check Constraints

**Purpose**: Enforce business rules at database level

**Implementation**:
```sql
CREATE TABLE course_videos (
  processing_progress INTEGER DEFAULT 0,
  CONSTRAINT check_progress CHECK (processing_progress >= 0 AND processing_progress <= 100)
);
```

**Example**:
```sql
-- ✅ Valid values
UPDATE course_videos SET processing_progress = 0 WHERE id = ?;
UPDATE course_videos SET processing_progress = 50 WHERE id = ?;
UPDATE course_videos SET processing_progress = 100 WHERE id = ?;

-- ❌ Invalid values
UPDATE course_videos SET processing_progress = 150 WHERE id = ?;
-- ERROR: new row violates check constraint "check_progress"

UPDATE course_videos SET processing_progress = -10 WHERE id = ?;
-- ERROR: new row violates check constraint "check_progress"
```

**Why Check Constraints?**
- Data validation at source
- Prevents invalid data from any client
- Self-documenting business rules
- Better than application-level validation alone

### 5. Automatic Timestamps with Triggers

**Goal**: Automatically update `updated_at` on every row change

**Implementation**:
```sql
-- Reusable function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to table
CREATE TRIGGER update_course_videos_timestamp
BEFORE UPDATE ON course_videos
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

**How It Works**:
```sql
-- Initial insert
INSERT INTO course_videos (title, created_at, updated_at)
VALUES ('Video 1', NOW(), NOW());
-- created_at: 2025-01-01 10:00:00
-- updated_at: 2025-01-01 10:00:00

-- Update video
UPDATE course_videos SET status = 'ready' WHERE id = ?;
-- Trigger fires automatically
-- updated_at: 2025-01-01 12:30:00 (automatic!)

-- Another update
UPDATE course_videos SET processing_progress = 100 WHERE id = ?;
-- updated_at: 2025-01-01 14:15:00 (automatic!)
```

**Benefits**:
- No application code needed
- Consistent across all clients
- Impossible to forget
- Audit trail for changes

---

## Best Practices

### 1. Index Strategy

**Rule**: Index columns used in WHERE, JOIN, and ORDER BY clauses

**Our Indexes**:
```sql
CREATE INDEX idx_course_videos_course_id ON course_videos(course_id);
-- Query: SELECT * FROM course_videos WHERE course_id = ?

CREATE INDEX idx_course_videos_status ON course_videos(status);
-- Query: SELECT * FROM course_videos WHERE status = 'ready'

CREATE INDEX idx_course_videos_created_at ON course_videos(created_at);
-- Query: SELECT * FROM course_videos ORDER BY created_at DESC
```

**Performance Impact**:
```
Without Index: Full table scan - 1000ms for 1M rows
With Index: Index scan - 5ms for 1M rows
```

### 2. Foreign Key Naming Convention

**Pattern**: `tablename_columnname_fkey`

```sql
-- Auto-generated name (ugly)
CONSTRAINT course_videos_course_id_fkey FOREIGN KEY (course_id) REFERENCES courses(id)

-- Named explicitly (better)
CONSTRAINT fk_course_videos_course FOREIGN KEY (course_id) REFERENCES courses(id)
```

### 3. Documentation with Comments

```sql
COMMENT ON TABLE course_videos IS 'Stores video metadata for course lessons integrated with Cloudflare Stream';

COMMENT ON COLUMN course_videos.cloudflare_video_id IS 'Unique identifier from Cloudflare Stream API';

COMMENT ON COLUMN course_videos.processing_progress IS 'Transcoding progress percentage (0-100)';
```

**Benefits**:
- Self-documenting schema
- Visible in database tools
- Helps new developers understand structure

### 4. Default Values for Common Fields

```sql
CREATE TABLE course_videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- Auto-generate ID
  status video_status DEFAULT 'queued', -- New videos start queued
  processing_progress INTEGER DEFAULT 0, -- Progress starts at 0
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Auto-set creation time
);
```

**Usage**:
```sql
-- Minimal insert - defaults fill in the rest
INSERT INTO course_videos (course_id, lesson_id, cloudflare_video_id, title)
VALUES (?, ?, ?, ?);
-- id: auto-generated
-- status: 'queued'
-- processing_progress: 0
-- created_at: current time
```

---

## Common Patterns

### Pattern 1: Optimistic Locking with updated_at

**Problem**: Prevent overwriting changes made by other users

**Solution**: Check updated_at timestamp

```sql
-- User A reads video
SELECT * FROM course_videos WHERE id = ?;
-- updated_at: 2025-01-01 10:00:00

-- User B updates video
UPDATE course_videos SET status = 'ready' WHERE id = ?;
-- updated_at: 2025-01-01 10:05:00 (changed!)

-- User A tries to save changes
UPDATE course_videos
SET status = 'error'
WHERE id = ? AND updated_at = '2025-01-01 10:00:00';
-- ❌ 0 rows updated (timestamp changed!)

-- Application detects conflict and shows error
```

### Pattern 2: Soft Deletes

**Note**: We don't use soft deletes for videos (they CASCADE delete), but here's the pattern:

```sql
-- Add deleted_at column
ALTER TABLE some_table ADD COLUMN deleted_at TIMESTAMP NULL;

-- "Delete" a record
UPDATE some_table SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?;

-- Query only active records
SELECT * FROM some_table WHERE deleted_at IS NULL;

-- Index for performance
CREATE INDEX idx_some_table_deleted_at ON some_table(deleted_at);
```

### Pattern 3: Polymorphic Associations

**Problem**: Order items can be either courses or digital products

**Solution**: Discriminator column + nullable foreign keys

```sql
CREATE TABLE order_items (
  item_type VARCHAR(50) NOT NULL, -- 'course' or 'digital_product'
  course_id UUID REFERENCES courses(id),
  digital_product_id UUID REFERENCES digital_products(id),
  CONSTRAINT check_item_reference CHECK (
    (course_id IS NOT NULL AND digital_product_id IS NULL) OR
    (course_id IS NULL AND digital_product_id IS NOT NULL)
  )
);
```

---

## Performance Optimization

### 1. Explain Analyze

**Tool**: PostgreSQL EXPLAIN command shows query execution plan

```sql
EXPLAIN ANALYZE
SELECT * FROM course_videos WHERE course_id = 'some-uuid';
```

**Output Analysis**:
```
Index Scan using idx_course_videos_course_id on course_videos
  (cost=0.42..8.44 rows=1 width=1234) (actual time=0.012..0.014 rows=1 loops=1)
  Index Cond: (course_id = 'some-uuid'::uuid)
Planning Time: 0.098 ms
Execution Time: 0.042 ms
```

**Key Metrics**:
- **Index Scan**: ✅ Good (using index)
- **Seq Scan**: ⚠️ Bad (full table scan)
- **Execution Time**: < 1ms ✅ Excellent

### 2. Partial Indexes

**Concept**: Index only rows matching a condition

```sql
-- Index only unused password reset tokens
CREATE INDEX idx_password_reset_tokens_unused
ON password_reset_tokens(user_id)
WHERE used = false;
```

**Benefits**:
- Smaller index size
- Faster queries for common case
- Less maintenance overhead

### 3. Index-Only Scans

**Technique**: Include all needed columns in index

```sql
-- Query needs course_id and status
CREATE INDEX idx_course_videos_course_status
ON course_videos(course_id, status);

-- Now this query doesn't touch the table at all!
SELECT course_id, status FROM course_videos WHERE course_id = ?;
```

### 4. Batch Operations

**Inefficient** (N+1 queries):
```sql
-- 100 videos = 100 separate queries
for each video in videos:
  INSERT INTO course_videos (...) VALUES (...);
```

**Efficient** (1 query):
```sql
-- 100 videos = 1 query
INSERT INTO course_videos (course_id, lesson_id, title, ...)
VALUES
  (uuid1, 'lesson-1', 'Title 1', ...),
  (uuid1, 'lesson-2', 'Title 2', ...),
  (uuid1, 'lesson-3', 'Title 3', ...);
  -- ... 100 rows
```

---

## Security Considerations

### 1. SQL Injection Prevention

**Vulnerable Code** (❌ NEVER DO THIS):
```javascript
// Concatenating user input into SQL
const query = `SELECT * FROM course_videos WHERE lesson_id = '${userInput}'`;
```

**Attack**:
```javascript
userInput = "'; DROP TABLE course_videos; --"
// Resulting query: SELECT * FROM course_videos WHERE lesson_id = ''; DROP TABLE course_videos; --'
```

**Safe Code** (✅ ALWAYS DO THIS):
```javascript
// Parameterized queries
const query = 'SELECT * FROM course_videos WHERE lesson_id = $1';
await pool.query(query, [userInput]);
```

### 2. Row-Level Security (RLS)

**Concept**: PostgreSQL can enforce access control at database level

```sql
-- Enable RLS on table
ALTER TABLE course_videos ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see videos from courses they purchased
CREATE POLICY course_videos_select_policy ON course_videos
FOR SELECT
USING (
  course_id IN (
    SELECT course_id FROM enrollments
    WHERE user_id = current_setting('app.current_user_id')::uuid
  )
);
```

### 3. Sensitive Data Handling

**Video URLs**:
- Generate signed URLs with expiration
- Don't expose Cloudflare account ID
- Rotate API tokens regularly
- Log access for audit trail

```sql
-- Store access token securely
CREATE TABLE api_credentials (
  service VARCHAR NOT NULL,
  token_encrypted BYTEA NOT NULL, -- Encrypted!
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Real-World Examples

### Example 1: Display Course Videos to Student

```sql
-- Check if student enrolled
SELECT EXISTS(
  SELECT 1 FROM enrollments
  WHERE user_id = $1 AND course_id = $2
) AS is_enrolled;

-- If enrolled, fetch videos with playback URLs
SELECT
  cv.lesson_id,
  cv.title,
  cv.description,
  cv.duration,
  cv.thumbnail_url,
  cv.playback_hls_url,
  cv.playback_dash_url,
  cv.status
FROM course_videos cv
WHERE cv.course_id = $1
  AND cv.status = 'ready' -- Only show ready videos
ORDER BY cv.lesson_id;
```

### Example 2: Admin Dashboard - Processing Status

```sql
-- Count videos by status
SELECT
  status,
  COUNT(*) as count,
  ROUND(AVG(processing_progress)) as avg_progress
FROM course_videos
GROUP BY status;

-- Result:
-- status      | count | avg_progress
-- queued      |    15 |            0
-- inprogress  |     8 |           45
-- ready       |   342 |          100
-- error       |     2 |           30
```

### Example 3: Find Failed Uploads

```sql
-- Videos stuck in error state
SELECT
  c.title as course_title,
  cv.lesson_id,
  cv.title as video_title,
  cv.error_message,
  cv.created_at,
  EXTRACT(EPOCH FROM (NOW() - cv.created_at))/3600 as hours_ago
FROM course_videos cv
JOIN courses c ON cv.course_id = c.id
WHERE cv.status = 'error'
ORDER BY cv.created_at DESC;
```

### Example 4: Course Completion Tracking

```sql
-- Calculate student progress
WITH course_video_count AS (
  SELECT course_id, COUNT(*) as total_videos
  FROM course_videos
  WHERE status = 'ready'
  GROUP BY course_id
),
student_viewed AS (
  SELECT course_id, COUNT(DISTINCT video_id) as viewed_videos
  FROM video_views
  WHERE user_id = $1 AND completed = true
  GROUP BY course_id
)
SELECT
  c.title,
  cvc.total_videos,
  COALESCE(sv.viewed_videos, 0) as viewed_videos,
  ROUND(100.0 * COALESCE(sv.viewed_videos, 0) / cvc.total_videos) as progress_percent
FROM courses c
JOIN course_video_count cvc ON c.id = cvc.course_id
LEFT JOIN student_viewed sv ON c.id = sv.course_id
WHERE c.id IN (
  SELECT course_id FROM enrollments WHERE user_id = $1
);
```

---

## Exercises

### Exercise 1: Basic Schema Design

**Task**: Design a schema for storing quiz videos (short educational clips).

Requirements:
- Each quiz can have multiple video explanations
- Videos have title, description, Vimeo URL
- Track video views per user

**Solution**:
```sql
CREATE TABLE quiz_videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  vimeo_id VARCHAR(255) NOT NULL,
  vimeo_url VARCHAR(500) NOT NULL,
  duration INTEGER, -- seconds
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE video_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES quiz_videos(id) ON DELETE CASCADE,
  watched_duration INTEGER DEFAULT 0, -- seconds watched
  completed BOOLEAN DEFAULT false,
  viewed_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, video_id) -- One record per user per video
);

CREATE INDEX idx_quiz_videos_quiz_id ON quiz_videos(quiz_id);
CREATE INDEX idx_video_views_user_id ON video_views(user_id);
CREATE INDEX idx_video_views_video_id ON video_views(video_id);
```

### Exercise 2: Query Writing

**Task**: Write queries for these scenarios:

1. Get all videos for a course ordered by lesson number
2. Find all videos currently processing
3. Calculate average video duration per course
4. Find courses with no videos

**Solutions**:

```sql
-- 1. Videos ordered by lesson (assuming lesson-N format)
SELECT * FROM course_videos
WHERE course_id = $1
ORDER BY CAST(SUBSTRING(lesson_id FROM '[0-9]+') AS INTEGER);

-- 2. Currently processing videos
SELECT * FROM course_videos
WHERE status IN ('queued', 'inprogress')
ORDER BY created_at ASC;

-- 3. Average duration per course
SELECT
  c.title,
  COUNT(cv.id) as video_count,
  ROUND(AVG(cv.duration)) as avg_duration_seconds,
  ROUND(AVG(cv.duration) / 60.0, 1) as avg_duration_minutes
FROM courses c
LEFT JOIN course_videos cv ON c.id = cv.course_id
WHERE cv.status = 'ready'
GROUP BY c.id, c.title
ORDER BY avg_duration_seconds DESC;

-- 4. Courses with no videos
SELECT c.id, c.title
FROM courses c
LEFT JOIN course_videos cv ON c.id = cv.course_id
WHERE cv.id IS NULL;
```

### Exercise 3: Performance Optimization

**Task**: A query is slow. Optimize it.

**Slow Query**:
```sql
-- Takes 2000ms
SELECT c.title, COUNT(cv.id)
FROM courses c
LEFT JOIN course_videos cv ON c.id = cv.course_id
WHERE cv.status = 'ready' OR cv.status IS NULL
GROUP BY c.id, c.title;
```

**Optimization**:
```sql
-- Add index on status
CREATE INDEX idx_course_videos_status ON course_videos(status);

-- Rewrite query
SELECT
  c.title,
  (SELECT COUNT(*) FROM course_videos
   WHERE course_id = c.id AND status = 'ready') as video_count
FROM courses c;
-- Now takes 50ms
```

---

## Summary

### Key Takeaways

1. **Separate Tables for One-to-Many**: Use separate table when relationship is 1:N
2. **Embed for One-to-One**: Embed columns when relationship is 1:1
3. **Use Enums for Fixed Sets**: Video status, order status, etc.
4. **JSONB for Flexibility**: Store variable metadata
5. **Index Common Queries**: WHERE, JOIN, ORDER BY columns
6. **Constraints for Integrity**: UNIQUE, CHECK, FOREIGN KEY
7. **Triggers for Automation**: updated_at timestamps
8. **CASCADE Carefully**: Only for truly dependent data

### Design Checklist

When designing a new schema, ask:

- [ ] What are the relationships? (1:1, 1:N, N:M)
- [ ] What queries will be common? (index them)
- [ ] What constraints ensure data integrity?
- [ ] What happens on delete? (CASCADE, RESTRICT, SET NULL)
- [ ] What fields should have defaults?
- [ ] What needs automatic updates? (triggers)
- [ ] What can change over time? (use JSONB)
- [ ] What should never change? (constraints)

### Next Steps

1. **Practice**: Design schemas for your own projects
2. **Read**: PostgreSQL documentation on constraints and indexes
3. **Experiment**: Use EXPLAIN ANALYZE to understand query performance
4. **Learn**: Study normalization (1NF, 2NF, 3NF) and denormalization
5. **Implement**: Build the video upload UI (T183) that uses this schema

---

## Further Reading

### Documentation
- [PostgreSQL Foreign Keys](https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-FK)
- [PostgreSQL Indexes](https://www.postgresql.org/docs/current/indexes.html)
- [PostgreSQL Triggers](https://www.postgresql.org/docs/current/triggers.html)
- [JSONB in PostgreSQL](https://www.postgresql.org/docs/current/datatype-json.html)

### Books
- "Database Design for Mere Mortals" by Michael J. Hernandez
- "SQL Performance Explained" by Markus Winand
- "PostgreSQL: Up and Running" by Regina Obe & Leo Hsu

### Tools
- pgAdmin - PostgreSQL GUI
- DBeaver - Universal database tool
- dbdiagram.io - Database diagram tool
- explain.depesz.com - EXPLAIN plan visualizer

---

**Author**: Claude Code
**Version**: 1.0
**Last Updated**: 2025-11-04
**Related Tasks**: T181 (Cloudflare Stream API), T183 (Video Upload UI)
