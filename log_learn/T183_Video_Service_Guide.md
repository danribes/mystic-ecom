# T183: Video Service - Learning Guide

**Topic**: Video Service Layer with Caching and External API Integration
**Level**: Intermediate to Advanced
**Prerequisites**: TypeScript, PostgreSQL, Redis basics, REST APIs
**Related**: T181 (Cloudflare Stream API), T182 (Database Schema)

---

## Table of Contents

1. [Introduction](#introduction)
2. [Service Layer Architecture](#service-layer-architecture)
3. [Caching Strategies](#caching-strategies)
4. [Error Handling](#error-handling)
5. [Integration Patterns](#integration-patterns)
6. [Best Practices](#best-practices)
7. [Real-World Examples](#real-world-examples)

---

## Introduction

### What is a Service Layer?

A service layer sits between your API routes and your data sources (database, external APIs). It encapsulates business logic, data transformations, and integration concerns.

```
┌─────────────┐
│  API Routes │ (HTTP handlers)
└──────┬──────┘
       │
┌──────▼──────┐
│   Service   │ ← You are here (videos.ts)
│    Layer    │
└──────┬──────┘
       │
   ┌───┴────┐
   │        │
┌──▼───┐ ┌─▼────────┐
│  DB  │ │ External │
│      │ │   APIs   │
└──────┘ └──────────┘
```

### Why Service Layers?

**Benefits**:
- Centralized business logic
- Easier testing (mock dependencies)
- Reusable across multiple routes
- Clear separation of concerns
- Simplified API route handlers

**Example Without Service Layer** (❌ Bad):
```typescript
// API route does everything
export async function POST(request: Request) {
  const body = await request.json();

  // Validation
  if (!body.title) throw new Error('Title required');

  // Database
  const pool = getPool();
  const video = await pool.query('INSERT ...');

  // Cache
  await redis.set(`video:${video.id}`, JSON.stringify(video));

  // External API
  const cfVideo = await fetch('https://api.cloudflare.com/...');

  return Response.json(video);
}
```

**Example With Service Layer** (✅ Good):
```typescript
// API route is thin
export async function POST(request: Request) {
  const body = await request.json();
  const video = await createCourseVideo(body);
  return Response.json(video);
}

// Service handles complexity
export async function createCourseVideo(input: CreateVideoInput) {
  // All logic here
}
```

---

## Service Layer Architecture

### 1. Type Definitions

Define clear interfaces for inputs and outputs:

```typescript
// Input types (what the function accepts)
export interface CreateVideoInput {
  course_id: string;
  lesson_id: string;
  cloudflare_video_id: string;
  title: string;
  description?: string;  // Optional
  metadata?: Record<string, any>;
}

// Output types (what the function returns)
export interface CourseVideo {
  id: string;
  course_id: string;
  lesson_id: string;
  // ... all fields
}
```

**Benefits**:
- TypeScript catches errors at compile time
- Auto-complete in IDEs
- Self-documenting code
- Easy refactoring

### 2. Error Handling

Create custom error classes for domain-specific errors:

```typescript
export enum VideoErrorCode {
  VIDEO_NOT_FOUND = 'VIDEO_NOT_FOUND',
  DUPLICATE_VIDEO = 'DUPLICATE_VIDEO',
  CLOUDFLARE_ERROR = 'CLOUDFLARE_ERROR',
}

export class VideoError extends Error {
  constructor(
    public code: VideoErrorCode,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'VideoError';
  }
}

// Usage
throw new VideoError(
  VideoErrorCode.VIDEO_NOT_FOUND,
  `Video not found: ${videoId}`
);
```

**Why Custom Errors?**:
- Client can handle different errors differently
- Error codes are predictable and documented
- Can include additional context (details field)
- Type-safe error handling

### 3. Function Organization

Organize functions by operation type:

**CRUD Operations**:
- Create: `createCourseVideo()`
- Read: `getVideoById()`, `getCourseVideos()`, `getLessonVideo()`
- Update: `updateVideoMetadata()`
- Delete: `deleteVideoRecord()`

**Business Logic**:
- `getVideoPlaybackData()` - Combines data from multiple sources
- `syncVideoStatus()` - Sync with external API
- `getCourseVideoStats()` - Aggregate calculations

**Utility Functions**:
- Cache key generators
- Cache invalidation helpers

---

## Caching Strategies

### Why Cache?

**Problem**: Database queries are slow (5-50ms)
**Solution**: Cache frequently accessed data in Redis (<1ms)

**Example**:
```
Without Cache:
Request → Database (20ms) → Response
Total: 20ms per request

With Cache:
Request → Cache hit (0.5ms) → Response
Total: 0.5ms (40x faster!)
```

### Cache Key Design

**Pattern**: `resource:identifier[:sub-identifier]`

```typescript
// Individual video
`video:${videoId}`  // "video:abc-123"

// All videos for a course
`course_videos:${courseId}`  // "course_videos:course-456"

// Specific lesson video
`video:${courseId}:${lessonId}`  // "video:course-456:lesson-1"
```

**Why This Pattern?**:
- Hierarchical (easy to invalidate related keys)
- Predictable (no guessing what's cached)
- Namespace protection (won't conflict with other data)

### Cache TTL (Time To Live)

Different data changes at different rates:

```typescript
const CACHE_TTL = 3600;  // 1 hour - individual videos
const COURSE_VIDEOS_CACHE_TTL = 1800;  // 30 min - course lists
```

**Guidelines**:
- Frequently changing data: Shorter TTL (5-15 minutes)
- Rarely changing data: Longer TTL (1-24 hours)
- Critical data: No cache or very short TTL

### Cache Invalidation

**"There are only two hard things in Computer Science: cache invalidation and naming things." – Phil Karlton**

**Strategy**: Invalidate aggressively

```typescript
async function updateVideoMetadata(videoId: string, updates: UpdateVideoInput) {
  // 1. Update database
  const video = await pool.query('UPDATE ...');

  // 2. Invalidate ALL related caches
  await redis.del(`video:${videoId}`);  // Individual cache
  await redis.del(`video:${video.course_id}:${video.lesson_id}`);  // Lesson cache
  await redis.del(`course_videos:${video.course_id}`);  // Course cache

  return video;
}
```

**When to Invalidate**:
- ✅ On create: Invalidate parent caches (course cache)
- ✅ On update: Invalidate all related caches
- ✅ On delete: Invalidate all related caches

### Non-Blocking Cache Operations

**Important Pattern**: Don't let cache failures break your application

```typescript
// ❌ Bad: Cache failure breaks everything
await redis.setJSON(key, value, ttl);

// ✅ Good: Cache failure is non-critical
await redis.setJSON(key, value, ttl).catch(() => {
  // Log error but don't throw
  logger.warn(`Failed to cache ${key}`);
});
```

**Rationale**:
- Database is source of truth
- Cache is performance optimization
- Better to be slow than broken

### Cache-Aside Pattern

```typescript
async function getVideoById(videoId: string): Promise<CourseVideo | null> {
  // 1. Try cache first
  const cached = await redis.getJSON(key);
  if (cached) return cached;

  // 2. Cache miss - query database
  const video = await pool.query('SELECT ...');
  if (!video) return null;

  // 3. Store in cache for next time
  await redis.setJSON(key, video, TTL).catch(() => {});

  return video;
}
```

This is the most common caching pattern.

---

## Error Handling

### Layered Error Handling

```typescript
export async function createCourseVideo(input: CreateVideoInput) {
  try {
    // Validation
    if (!input.title) {
      throw new VideoError(
        VideoErrorCode.INVALID_INPUT,
        'Missing required fields'
      );
    }

    // Business logic
    const video = await pool.query('INSERT ...');
    return video;

  } catch (error) {
    // Handle specific errors
    if (error instanceof VideoError) {
      throw error;  // Re-throw our errors
    }

    // Handle database errors
    if (error.message.includes('unique')) {
      throw new VideoError(
        VideoErrorCode.DUPLICATE_VIDEO,
        'Video already exists'
      );
    }

    // Log unexpected errors
    logger.error('Unexpected error:', error);

    // Throw generic error
    throw new VideoError(
      VideoErrorCode.DATABASE_ERROR,
      'Failed to create video',
      error  // Include original error in details
    );
  }
}
```

### Error Propagation

```
User Request
     ↓
API Route (catches VideoError, returns appropriate HTTP status)
     ↓
Service Layer (throws VideoError)
     ↓
Database/External API (throws generic errors)
```

**API Route Example**:
```typescript
try {
  const video = await createCourseVideo(body);
  return Response.json(video, { status: 201 });
} catch (error) {
  if (error instanceof VideoError) {
    if (error.code === VideoErrorCode.VIDEO_NOT_FOUND) {
      return Response.json({ error: error.message }, { status: 404 });
    }
    if (error.code === VideoErrorCode.DUPLICATE_VIDEO) {
      return Response.json({ error: error.message }, { status: 409 });
    }
  }
  return Response.json({ error: 'Internal server error' }, { status: 500 });
}
```

---

## Integration Patterns

### 1. Database Integration

**Connection Pooling**:
```typescript
import { getPool } from './db';

const pool = getPool();  // Reuse connections
const result = await pool.query('SELECT ...', [param1, param2]);
```

**Parameterized Queries** (prevents SQL injection):
```typescript
// ❌ Never do this
const query = `SELECT * FROM videos WHERE id = '${videoId}'`;  // SQL injection!

// ✅ Always do this
const query = 'SELECT * FROM videos WHERE id = $1';
const result = await pool.query(query, [videoId]);
```

### 2. External API Integration

**Graceful Degradation**:
```typescript
async function getVideoPlaybackData(videoId: string) {
  const video = await getVideoById(videoId);

  // Try to get live status from Cloudflare
  try {
    const cfVideo = await cloudflare.getVideo(video.cloudflare_video_id);
    return { ...video, cloudflare_status: cfVideo.status };
  } catch (error) {
    // Cloudflare down? Use database data
    logger.warn('Cloudflare API failed, using database fallback');
    return { ...video, cloudflare_status: { state: video.status } };
  }
}
```

**Why This Matters**:
- External APIs can fail
- Network can be unreliable
- Don't break user experience for external failures

### 3. Multi-Source Data Aggregation

Combine data from multiple sources:

```typescript
async function getVideoPlaybackData(videoId: string): Promise<VideoPlaybackData> {
  // Source 1: Database
  const video = await getVideoById(videoId);

  // Source 2: Cloudflare API
  const cfVideo = await cloudflare.getVideo(video.cloudflare_video_id);

  // Source 3: Generate URLs
  const playbackUrls = {
    hls: cloudflare.generatePlaybackUrl(video.cloudflare_video_id, 'hls'),
    dash: cloudflare.generatePlaybackUrl(video.cloudflare_video_id, 'dash'),
  };

  // Combine all sources
  return {
    ...video,  // Database fields
    cloudflare_status: cfVideo.status,  // Live status
    playback_urls: playbackUrls,  // Generated URLs
    is_ready: cfVideo.status.state === 'ready',  // Computed field
  };
}
```

---

## Best Practices

### 1. Dynamic Query Building

**Problem**: Need to update only provided fields

**Solution**: Build query dynamically

```typescript
async function updateVideoMetadata(videoId: string, updates: UpdateVideoInput) {
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (updates.title !== undefined) {
    fields.push(`title = $${paramIndex++}`);
    values.push(updates.title);
  }

  if (updates.status !== undefined) {
    fields.push(`status = $${paramIndex++}`);
    values.push(updates.status);
  }

  values.push(videoId);  // Last parameter for WHERE clause

  const query = `
    UPDATE course_videos
    SET ${fields.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *
  `;

  return await pool.query(query, values);
}
```

**Usage**:
```typescript
// Update only title
await updateVideoMetadata(id, { title: 'New Title' });
// SQL: UPDATE course_videos SET title = $1 WHERE id = $2

// Update multiple fields
await updateVideoMetadata(id, { title: 'New', status: 'ready' });
// SQL: UPDATE course_videos SET title = $1, status = $2 WHERE id = $3
```

### 2. Validation Before Database Operations

**Pattern**: Validate early, fail fast

```typescript
async function createCourseVideo(input: CreateVideoInput) {
  // 1. Validate input
  if (!input.course_id || !input.lesson_id || !input.title) {
    throw new VideoError(VideoErrorCode.INVALID_INPUT, 'Missing required fields');
  }

  // 2. Validate foreign keys
  const course = await pool.query('SELECT id FROM courses WHERE id = $1', [input.course_id]);
  if (course.rows.length === 0) {
    throw new VideoError(VideoErrorCode.COURSE_NOT_FOUND, 'Course not found');
  }

  // 3. Now safe to insert
  const video = await pool.query('INSERT ...');
  return video;
}
```

**Benefits**:
- Clear error messages
- No partial database changes
- Easier debugging

### 3. Logging Strategy

**What to Log**:
```typescript
// ✅ Info: Successful operations
logger.info(`Created video: ${video.id} for course: ${input.course_id}`);

// ✅ Debug: Development details
logger.debug(`Cache hit for video: ${videoId}`);

// ✅ Warn: Recoverable errors
logger.warn(`Failed to cache video ${videoId}`, error);

// ✅ Error: Unexpected failures
logger.error(`Database error in createCourseVideo:`, error);
```

**What NOT to Log**:
- ❌ Sensitive data (passwords, tokens)
- ❌ Personal information
- ❌ Every database query in production
- ❌ Success messages for every operation

### 4. Testing Service Functions

**Unit Test Structure**:
```typescript
describe('createCourseVideo', () => {
  it('should create a video successfully', async () => {
    // Arrange
    const input = { course_id: '...', lesson_id: '...', title: '...' };

    // Act
    const video = await createCourseVideo(input);

    // Assert
    expect(video.id).toBeDefined();
    expect(video.title).toBe(input.title);
  });

  it('should throw error for missing title', async () => {
    // Arrange
    const input = { course_id: '...', lesson_id: '...' };  // Missing title

    // Act & Assert
    await expect(createCourseVideo(input)).rejects.toThrow(VideoError);
  });
});
```

---

## Real-World Examples

### Example 1: Student Viewing Video

```typescript
// Student clicks on lesson
async function handleLessonView(courseId: string, lessonId: string, userId: string) {
  // 1. Get lesson video
  const video = await getLessonVideo(courseId, lessonId);
  if (!video) {
    return { error: 'Video not found' };
  }

  // 2. Check if user enrolled
  const enrolled = await checkEnrollment(userId, courseId);
  if (!enrolled) {
    return { error: 'Not enrolled' };
  }

  // 3. Get playback data
  const playbackData = await getVideoPlaybackData(video.id);

  // 4. Log view
  await logVideoView(userId, video.id);

  // 5. Return video data
  return {
    video: playbackData,
    playbackUrl: playbackData.playback_urls.hls,  // Send to player
  };
}
```

### Example 2: Admin Dashboard

```typescript
// Admin views course management page
async function getCourseManagementData(courseId: string) {
  // 1. Get course details
  const course = await getCourse(courseId);

  // 2. Get all videos (including processing)
  const videos = await getCourseVideos(courseId, { includeNotReady: true });

  // 3. Get statistics
  const stats = await getCourseVideoStats(courseId);

  // 4. Return combined data
  return {
    course,
    videos: videos.map(v => ({
      ...v,
      canDelete: v.status !== 'inprogress',  // Don't delete processing videos
      needsAttention: v.status === 'error',
    })),
    stats: {
      ...stats,
      percentComplete: stats.total > 0 ? (stats.ready / stats.total) * 100 : 0,
    },
  };
}
```

### Example 3: Webhook from Cloudflare

```typescript
// Cloudflare sends webhook when video ready
export async function POST(request: Request) {
  const webhook = await request.json();

  // Find our video by Cloudflare ID
  const video = await pool.query(
    'SELECT id FROM course_videos WHERE cloudflare_video_id = $1',
    [webhook.uid]
  );

  if (video.rows.length > 0) {
    // Sync status from Cloudflare
    await syncVideoStatus(video.rows[0].id);

    // Notify user?
    if (webhook.status.state === 'ready') {
      await notifyVideoReady(video.rows[0].id);
    }
  }

  return Response.json({ received: true });
}
```

### Example 4: Background Job

```typescript
// Cron job: Sync all processing videos every 5 minutes
export async function syncProcessingVideos() {
  logger.info('Starting video status sync');

  const syncedCount = await syncAllProcessingVideos();

  logger.info(`Synced ${syncedCount} processing videos`);

  return { success: true, count: syncedCount };
}
```

---

## Summary

### Key Takeaways

1. **Service Layer**: Centralize business logic, keep API routes thin
2. **Caching**: Use Redis for performance, invalidate aggressively
3. **Error Handling**: Custom error classes with codes
4. **Integration**: Graceful degradation with external APIs
5. **Validation**: Validate early, fail fast
6. **Testing**: Comprehensive unit tests with mocking
7. **Logging**: Strategic logging for debugging

### Common Pitfalls to Avoid

1. ❌ Putting business logic in API routes
2. ❌ Not invalidating cache on updates
3. ❌ Letting cache failures break the app
4. ❌ Not using parameterized queries
5. ❌ Not handling external API failures
6. ❌ Over-caching (stale data problems)
7. ❌ Under-logging (hard to debug)

### Design Checklist

When creating a service function, ask:

- [ ] Clear input/output types?
- [ ] Validation before database operations?
- [ ] Error handling with custom errors?
- [ ] Cache strategy defined?
- [ ] Cache invalidation handled?
- [ ] External API failures handled gracefully?
- [ ] Logging at appropriate levels?
- [ ] Unit tests written?

---

## Further Reading

### Documentation
- [PostgreSQL Connection Pooling](https://node-postgres.com/features/pooling)
- [Redis Caching Patterns](https://redis.io/docs/manual/patterns/)
- [Error Handling in TypeScript](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates)

### Patterns
- Cache-Aside Pattern
- Service Layer Pattern
- Repository Pattern
- Graceful Degradation

### Tools
- Vitest - Testing framework
- Redis - Caching
- PostgreSQL - Database
- TypeScript - Type safety

---

**Author**: Claude Code
**Version**: 1.0
**Last Updated**: 2025-11-04
**Related Tasks**: T181 (Cloudflare API), T182 (Database Schema), T184 (Video Player)
