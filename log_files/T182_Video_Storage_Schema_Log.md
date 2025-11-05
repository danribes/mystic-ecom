# T182: Video Storage Schema Implementation Log

**Task**: Update database schema for video storage metadata
**Date**: 2025-11-04
**Status**: ✅ Completed
**Test Results**: 27/27 tests passing (100%)

---

## Overview

Implemented comprehensive database schema changes to support video storage with Cloudflare Stream integration. Added new `course_videos` table for lesson-specific videos and preview video columns to the existing `courses` table.

## Implementation Summary

### 1. Migration File Created
**File**: `database/migrations/009_add_video_storage_metadata.sql`

#### New Enum Type
```sql
CREATE TYPE video_status AS ENUM ('queued', 'inprogress', 'ready', 'error');
```

#### New Table: course_videos
- **Purpose**: Store video metadata for course lessons
- **Columns**: 16 total
  - `id` (UUID, Primary Key)
  - `course_id` (UUID, Foreign Key to courses)
  - `lesson_id` (VARCHAR, flexible identifier)
  - `cloudflare_video_id` (VARCHAR, UNIQUE)
  - `title` (VARCHAR)
  - `description` (TEXT)
  - `duration` (INTEGER, seconds)
  - `thumbnail_url` (VARCHAR)
  - `status` (video_status enum)
  - `playback_hls_url` (VARCHAR)
  - `playback_dash_url` (VARCHAR)
  - `processing_progress` (INTEGER, 0-100)
  - `error_message` (TEXT)
  - `metadata` (JSONB)
  - `created_at` (TIMESTAMP)
  - `updated_at` (TIMESTAMP)

#### Constraints
- **Primary Key**: `id`
- **Foreign Key**: `course_id` REFERENCES `courses(id)` ON DELETE CASCADE
- **Unique Constraints**:
  - `cloudflare_video_id` (single column)
  - `unique_course_lesson` (course_id + lesson_id combination)
- **Check Constraints**:
  - `check_progress`: processing_progress BETWEEN 0 AND 100

#### Indexes Created
1. `idx_course_videos_course_id` - Fast lookups by course
2. `idx_course_videos_lesson_id` - Fast lookups by lesson
3. `idx_course_videos_cloudflare_id` - Fast lookups by Cloudflare video ID
4. `idx_course_videos_status` - Filter videos by processing status
5. `idx_course_videos_created_at` - Sort by creation date

#### Courses Table Updates
Added preview video columns:
- `preview_video_url` (VARCHAR)
- `preview_video_id` (VARCHAR)
- `preview_video_thumbnail` (VARCHAR)
- `preview_video_duration` (INTEGER)

Added index:
- `idx_courses_preview_video_id`

#### Triggers
- `update_course_videos_timestamp` - Automatically updates `updated_at` on row changes

### 2. Schema File Updated
**File**: `database/schema.sql`

Applied all migration changes to the main schema file:
- Added `video_status` enum type definition
- Added complete `course_videos` table definition
- Added all indexes and constraints
- Added video columns to `courses` table
- Added trigger for automatic timestamp updates

### 3. Database Migration Executed

Successfully applied migration to both databases:
- ✅ `spirituality_platform` (main database)
- ✅ `spirituality_platform_test` (test database)

**Migration Output**:
```
CREATE TYPE
CREATE TABLE
CREATE INDEX (5 indexes)
COMMENT (6 table/column comments)
ALTER TABLE
CREATE INDEX
COMMENT (4 column comments)
CREATE FUNCTION
CREATE TRIGGER
```

## Technical Decisions

### 1. Separate Table vs. Embedded Data
**Decision**: Created separate `course_videos` table for lesson videos, but added columns to `courses` table for preview videos.

**Rationale**:
- **Lesson videos**: Multiple videos per course (one per lesson) → Separate table
- **Preview videos**: One preview per course → Columns on courses table
- Avoids unnecessary JOINs for preview video queries
- Maintains clean normalization for lesson videos

### 2. Flexible Lesson IDs
**Decision**: Used `VARCHAR(255)` for `lesson_id` instead of foreign key to another table.

**Rationale**:
- Course curriculum stored as JSONB with flexible structure
- Different courses may use different lesson ID patterns
- Examples: "lesson-1", "module-2-lesson-3", "intro-video"
- Avoids need for rigid lesson table structure
- Unique constraint ensures one video per course-lesson combination

### 3. JSONB Metadata Storage
**Decision**: Added `metadata` JSONB column for additional Cloudflare data.

**Rationale**:
- Cloudflare Stream API returns extensive metadata
- Flexible storage for resolution, codec, bitrate, file size, etc.
- Avoids creating columns for every possible metadata field
- Supports future API additions without schema changes
- Enables JSON queries for advanced filtering

### 4. Processing Progress Tracking
**Decision**: Added `processing_progress` integer (0-100) and `error_message` text fields.

**Rationale**:
- Users need visibility into video upload status
- Admin dashboard can show progress bars
- Error messages help debug failed uploads
- Matches Cloudflare Stream API response format

### 5. Cascade Delete Strategy
**Decision**: CASCADE delete for course_videos when course is deleted.

**Rationale**:
- Videos are dependent data with no standalone value
- No financial implications (vs. orders which use RESTRICT)
- Simplifies cleanup when courses are removed
- Cloudflare Stream videos deleted separately via API

### 6. Dual Playback URLs
**Decision**: Stored both HLS and DASH playback URLs.

**Rationale**:
- HLS: Better Apple/iOS support
- DASH: Better Android/Chrome support
- Allows client-side format selection
- Future-proofs for different device requirements

## File Changes

### Created Files
1. `database/migrations/009_add_video_storage_metadata.sql` (110 lines)
2. `tests/unit/T182_video_storage_schema.test.ts` (508 lines)

### Modified Files
1. `database/schema.sql`
   - Added video_status enum type (line 12)
   - Added course_videos table (lines 86-112)
   - Added video columns to courses table (lines 70-73)
   - Added preview_video_id index (line 84)
   - Added trigger for course_videos (lines 369-370)

## Database Schema Changes

### Before
- Courses table: 19 columns
- No video-specific tables
- No video status tracking

### After
- Courses table: 23 columns (+4 for preview videos)
- New course_videos table: 16 columns
- New video_status enum type: 4 values
- 5 new indexes for video queries
- 1 new trigger for timestamp updates

## Testing

### Test Coverage
**File**: `tests/unit/T182_video_storage_schema.test.ts`

**Test Categories**:
1. **Enum Type Tests** (1 test)
   - Validates video_status enum has correct values

2. **Table Structure Tests** (8 tests)
   - Table exists with correct columns
   - Correct data types for all columns
   - Primary key on id
   - Foreign key to courses with CASCADE delete
   - Unique constraint on cloudflare_video_id
   - Unique constraint on course_id + lesson_id
   - Check constraint on processing_progress (0-100)

3. **Index Tests** (5 tests)
   - course_id index
   - lesson_id index
   - cloudflare_video_id index
   - status index
   - created_at index

4. **Courses Table Tests** (3 tests)
   - Preview video columns exist
   - Correct data types for preview columns
   - Index on preview_video_id

5. **Trigger Tests** (1 test)
   - updated_at trigger exists and fires on UPDATE

6. **Functional Tests** (7 tests)
   - Insert course video successfully
   - Enforce unique cloudflare_video_id
   - Enforce unique course_id + lesson_id
   - Enforce check constraint on progress (0-100)
   - Update updated_at timestamp automatically
   - Cascade delete videos when course deleted
   - Store JSONB metadata correctly
   - Store preview video metadata on courses

7. **Query Performance Tests** (2 tests)
   - Index usage for course_id queries
   - Index usage for status queries

**Total Tests**: 27
**Passing**: 27 (100%)
**Execution Time**: 302ms

### Test Results
```
✅ All 27 tests passed
✅ 0 failed tests
✅ Execution time: 302ms
```

## Integration Points

### With T181 (Cloudflare Stream API)
The schema is designed to work seamlessly with the Cloudflare Stream API integration:

```typescript
// Example: Storing video after upload
const videoData = await uploadVideo({
  filePath: '/path/to/video.mp4',
  metadata: { courseId, lessonId }
});

await db.query(`
  INSERT INTO course_videos (
    course_id, lesson_id, cloudflare_video_id, title,
    status, thumbnail_url, metadata
  ) VALUES ($1, $2, $3, $4, $5, $6, $7)
`, [
  courseId,
  lessonId,
  videoData.uid,
  'Lesson 1: Introduction',
  videoData.status.state,
  videoData.thumbnail,
  JSON.stringify(videoData)
]);
```

### With Future Course Management
- Admin can upload videos for specific lessons
- Status tracking for upload progress
- Preview videos for course landing pages
- Video metadata displayed in course curriculum
- Download/stream URLs served to enrolled students

## Database Performance Considerations

### Index Strategy
- **course_id**: Most common query pattern (show all videos for a course)
- **lesson_id**: Lookup specific lesson video
- **status**: Admin dashboard filtering (show all processing/failed videos)
- **cloudflare_video_id**: Webhook updates from Cloudflare

### Query Examples
```sql
-- Get all videos for a course (uses idx_course_videos_course_id)
SELECT * FROM course_videos WHERE course_id = ?;

-- Get specific lesson video (uses idx_course_videos_course_id + lesson_id)
SELECT * FROM course_videos
WHERE course_id = ? AND lesson_id = ?;

-- Admin: Show all processing videos (uses idx_course_videos_status)
SELECT * FROM course_videos
WHERE status IN ('queued', 'inprogress')
ORDER BY created_at DESC;

-- Get course with preview video (no JOIN needed)
SELECT title, preview_video_url, preview_video_thumbnail
FROM courses WHERE id = ?;
```

## Security Considerations

### Data Validation
- UUID format enforced by PostgreSQL
- Progress constrained to 0-100 range
- Unique constraints prevent duplicate videos
- Foreign key ensures course exists before video insert

### Access Control
- Video URLs are private Cloudflare Stream links
- Access controlled at application layer
- Student enrollment checked before serving video URLs
- Admin-only access for upload/delete operations

## Migration Steps for Production

1. **Backup Database**
   ```bash
   pg_dump -U postgres -d spirituality_platform > backup_pre_t182.sql
   ```

2. **Apply Migration**
   ```bash
   psql -U postgres -d spirituality_platform -f database/migrations/009_add_video_storage_metadata.sql
   ```

3. **Verify Schema**
   ```sql
   \d course_videos
   \d courses
   SELECT * FROM pg_enum WHERE enumtypid = 'video_status'::regtype;
   ```

4. **Run Tests**
   ```bash
   npm test tests/unit/T182_video_storage_schema.test.ts
   ```

5. **Monitor Performance**
   - Check index usage with EXPLAIN ANALYZE
   - Monitor query performance in production
   - Adjust indexes if needed based on actual usage

## Rollback Plan

If rollback is needed:

```sql
-- Drop course_videos table
DROP TABLE IF EXISTS course_videos CASCADE;

-- Drop video_status enum
DROP TYPE IF EXISTS video_status;

-- Remove video columns from courses
ALTER TABLE courses
  DROP COLUMN IF EXISTS preview_video_url,
  DROP COLUMN IF EXISTS preview_video_id,
  DROP COLUMN IF EXISTS preview_video_thumbnail,
  DROP COLUMN IF EXISTS preview_video_duration;

-- Drop indexes
DROP INDEX IF EXISTS idx_courses_preview_video_id;
```

## Future Enhancements

### Potential Additions
1. **Video Analytics**
   - Watch time tracking
   - Completion rates
   - Most-viewed lessons

2. **Transcripts**
   - Auto-generated captions
   - Searchable transcript text
   - Multi-language support

3. **Video Versions**
   - Multiple quality versions
   - Downloadable vs. stream-only
   - Mobile-optimized versions

4. **Video Collections**
   - Playlists across courses
   - Featured video highlights
   - Sample video galleries

## Lessons Learned

### What Went Well
- ✅ Clean separation between lesson and preview videos
- ✅ Flexible lesson_id approach supports varied curriculum structures
- ✅ JSONB metadata provides future flexibility
- ✅ Comprehensive test coverage caught issues early
- ✅ All tests passed after fixes

### Challenges & Solutions
1. **Challenge**: Migration not auto-applied to test database
   - **Solution**: Manually copied and executed migration on both DBs
   - **Learning**: Need automated migration system for test environment

2. **Challenge**: Trigger name mismatch between migration and tests
   - **Solution**: Updated test to match actual trigger name
   - **Learning**: Verify generated names match test expectations

3. **Challenge**: Duplicate slugs in cascade delete test
   - **Solution**: Generate unique slug with timestamp
   - **Learning**: Always use unique identifiers in tests

4. **Challenge**: Invalid UUID format in performance test
   - **Solution**: Use proper UUID format
   - **Learning**: Use valid test data that matches column types

## Conclusion

Successfully implemented comprehensive video storage schema with:
- ✅ 1 new enum type
- ✅ 1 new table (16 columns)
- ✅ 4 new columns on existing table
- ✅ 6 new indexes
- ✅ 1 new trigger
- ✅ 27 passing tests (100% success rate)
- ✅ Full integration with Cloudflare Stream API (T181)

The schema provides a solid foundation for video management in the spirituality platform, supporting both preview videos for course marketing and full lesson videos for enrolled students.

---

**Implemented by**: Claude Code
**Review Status**: Ready for production
**Next Steps**: Implement video upload/management UI (T183)
