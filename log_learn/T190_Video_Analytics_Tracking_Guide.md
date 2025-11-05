# T190: Video Analytics Tracking - Learning Guide

## Table of Contents
1. [Introduction](#introduction)
2. [Why Video Analytics Matter](#why-video-analytics-matter)
3. [Core Concepts](#core-concepts)
4. [Architecture Overview](#architecture-overview)
5. [Database Design](#database-design)
6. [Tracking Implementation](#tracking-implementation)
7. [Analytics Retrieval](#analytics-retrieval)
8. [Client-Side Integration](#client-side-integration)
9. [Performance Optimization](#performance-optimization)
10. [Best Practices](#best-practices)

## Introduction

Video analytics tracking is a system that monitors and analyzes how users interact with video content. For an e-learning platform like ours (Spirituality E-Commerce), understanding video engagement is crucial for:
- Measuring content effectiveness
- Improving user experience
- Identifying drop-off points
- Optimizing course structure

This guide explains how we implemented comprehensive video analytics tracking in our Astro + PostgreSQL + Redis stack.

## Why Video Analytics Matter

### Business Value

**1. Content Quality Insights**
- Which videos have high completion rates? → Keep making similar content
- Which videos have high drop-off rates? → Need improvement
- Which segments are rewatched? → Most valuable parts

**2. User Engagement Metrics**
- Average watch time per video
- Completion rate percentage
- Play rate (views vs. unique viewers)
- Popular videos ranking

**3. Course Optimization**
- Identify problematic lessons (low completion)
- Reorder lessons based on engagement
- Adjust video length based on completion data

**4. Revenue Impact**
- Videos with high engagement → Higher course sales
- Preview videos → Conversion rate tracking
- Engaged users → More likely to purchase additional courses

### Technical Value

**1. Performance Monitoring**
- Track video loading times
- Identify buffering issues
- Monitor playback quality changes

**2. User Experience**
- Resume from last position
- Recommend next videos
- Personalized learning paths

**3. Infrastructure Planning**
- Peak viewing times → Server capacity planning
- Popular videos → CDN cache strategy
- Geographic distribution → Regional CDN placement

## Core Concepts

### 1. Sessions vs. Views

**Session:**
- A single continuous watching session
- Has unique session_id (generated client-side)
- Tracks one user watching one video from start to pause/end
- Can have multiple sessions for same user+video (rewatches)

**View:**
- Broader term - one session = one view
- Used for counting: "This video has 1,234 views"

**Example:**
```
User watches video:
  - Monday 9am: Session A (watched 10 minutes)
  - Monday 5pm: Session B (watched remaining 5 minutes)
  - = 2 views, 1 unique viewer, 100% completion (combined)
```

### 2. Watch Time vs. Position

**watch_time_seconds:**
- Actual time spent watching
- Excludes paused time
- Can be less than position if user seeks forward

**current_position_seconds:**
- Playback head position in video
- Can jump forward/backward (seeks)
- max_position_seconds tracks furthest point reached

**Example:**
```
10-minute video:
- User watches first 2 minutes (watch_time: 120s, position: 120s)
- User seeks to 8 minutes (watch_time: 120s, position: 480s)
- User watches to end (watch_time: 240s, position: 600s)
  → 4 minutes actual watch time, 10 minute position
  → Completion: 100% (based on position)
  → Engagement: 40% (based on watch_time)
```

### 3. Completion Thresholds

Not all users watch to 100%. Industry standards:

- **90% = Completed** - Most common threshold
  - Accounts for skipped credits/outros
  - Considered "fully watched" for learning

- **75% = Mostly Watched** - High engagement
  - User got the main content
  - May have skipped some parts

- **50% = Partially Watched** - Medium engagement
  - User sampled the content
  - May return later

Our implementation uses **90% as completion threshold** (configurable).

### 4. Heatmaps

**Concept:**
Divide video into segments (we use 10 seconds) and track views per segment.

**Purpose:**
- Identify most-watched parts (rewatched segments)
- Find drop-off points (segments with declining views)
- Optimize video editing (cut low-engagement parts)

**Visualization:**
```
|████████░░░░░░██████████████░░░░|
0s      120s              360s  600s
↑       ↑                 ↑
Start   Drop-off         Pick-up
```

High bars = More views
Low bars = Skip/drop-off points

## Architecture Overview

### System Components

```
┌─────────────────┐
│   Web Browser   │
│  (Video Player) │
└────────┬────────┘
         │ Events (play, pause, timeupdate)
         ↓
┌─────────────────────────────────┐
│ videoAnalyticsTracking.ts       │
│ - Session management            │
│ - Event listening               │
│ - Periodic updates              │
│ - Retry queue                   │
└────────┬────────────────────────┘
         │ HTTP POST /api/analytics/*
         ↓
┌─────────────────────────────────┐
│ API Endpoints                   │
│ - /video-view    (track start)  │
│ - /video-progress (track watch) │
│ - /video-complete (track finish)│
└────────┬────────────────────────┘
         │ Function calls
         ↓
┌─────────────────────────────────┐
│ src/lib/analytics/videos.ts     │
│ - trackVideoView()              │
│ - trackVideoProgress()          │
│ - trackVideoCompletion()        │
│ - getAnalyticsSummary()         │
└────────┬────────────────────────┘
         │ SQL queries
         ↓
┌─────────────────────────────────┐
│ PostgreSQL Database             │
│ - video_analytics (raw data)    │
│ - video_heatmap (segments)      │
│ - video_watch_progress (resume) │
│ - video_analytics_summary (agg) │
└─────────────────────────────────┘
         │
         ↓
┌─────────────────────────────────┐
│ Redis Cache                     │
│ - Analytics summaries (5min)    │
│ - Popular videos (10min)        │
└─────────────────────────────────┘
         │
         ↓
┌─────────────────────────────────┐
│ Admin Dashboard                 │
│ - Overall stats                 │
│ - Popular videos                │
│ - Per-video analytics           │
│ - Heatmap visualization         │
└─────────────────────────────────┘
```

### Data Flow

**1. User Starts Watching:**
```
Browser → generateSessionId() → POST /api/analytics/video-view
  → trackVideoView() → INSERT video_analytics
  → Return analytics_id
```

**2. User Watches (Every 15 seconds):**
```
Browser → track position, watch_time → POST /api/analytics/video-progress
  → trackVideoProgress() → UPDATE video_analytics
  → Update heatmap (UPSERT video_heatmap)
  → Update user progress (UPSERT video_watch_progress)
```

**3. User Completes (90%+ watched):**
```
Browser → detect completion → POST /api/analytics/video-complete
  → trackVideoCompletion() → UPDATE video_analytics SET completed=true
  → UPDATE video_watch_progress SET completed=true
  → Invalidate caches
  → Dispatch completion event
```

**4. Admin Views Analytics:**
```
Admin Dashboard → GET /api/admin/analytics/videos
  → Check Redis cache
  → If miss: Query video_analytics_summary materialized view
  → Cache result (5 min TTL)
  → Return stats + popular videos
```

## Database Design

### Table: video_analytics

**Purpose:** Store every viewing session with detailed metrics

**Schema:**
```sql
CREATE TABLE video_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID NOT NULL REFERENCES course_videos(id),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    course_id UUID NOT NULL REFERENCES courses(id),
    session_id VARCHAR(255) NOT NULL UNIQUE, -- Client-generated

    -- Timing
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Watch metrics
    watch_time_seconds INTEGER DEFAULT 0,
    video_duration_seconds INTEGER,
    completion_percentage DECIMAL(5,2) DEFAULT 0,
    completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP,

    -- Engagement
    play_count INTEGER DEFAULT 1,
    pause_count INTEGER DEFAULT 0,
    seek_count INTEGER DEFAULT 0,
    max_position_seconds INTEGER DEFAULT 0,
    average_playback_speed DECIMAL(3,2) DEFAULT 1.00,
    quality_changes INTEGER DEFAULT 0,

    -- Technical
    ip_address INET,
    user_agent TEXT,
    device_type VARCHAR(50),
    browser VARCHAR(100),
    os VARCHAR(100),
    referrer TEXT,

    -- Context
    lesson_id VARCHAR(255),
    is_preview BOOLEAN DEFAULT false,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Key Indexes:**
```sql
-- Fast lookups
CREATE INDEX idx_video_analytics_video_id ON video_analytics(video_id);
CREATE INDEX idx_video_analytics_user_id ON video_analytics(user_id);
CREATE INDEX idx_video_analytics_session_id ON video_analytics(session_id);

-- Analytics queries
CREATE INDEX idx_video_analytics_completed ON video_analytics(completed) WHERE completed = true;
CREATE INDEX idx_video_analytics_user_video ON video_analytics(user_id, video_id);
```

**Design Decisions:**

1. **user_id is NULL-able**
   - Allows anonymous tracking
   - ON DELETE SET NULL preserves analytics when user deleted

2. **session_id is UNIQUE**
   - Prevents duplicate tracking
   - Client-generated for offline capability

3. **Separate watch_time and position**
   - watch_time = actual engagement
   - position = video progress
   - Both needed for accurate metrics

4. **Detailed engagement metrics**
   - play_count: How many times user hit play (engagement restarts)
   - pause_count: How often user pauses (confusion? phone call?)
   - seek_count: How much skipping (looking for specific part?)

### Table: video_heatmap

**Purpose:** Aggregate segment-level engagement

**Schema:**
```sql
CREATE TABLE video_heatmap (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID NOT NULL REFERENCES course_videos(id),

    -- Time segment (10-second intervals)
    segment_start INTEGER NOT NULL,
    segment_end INTEGER NOT NULL,

    -- Metrics
    view_count INTEGER DEFAULT 0,
    unique_viewers INTEGER DEFAULT 0,
    total_watch_time_seconds INTEGER DEFAULT 0,
    completion_rate DECIMAL(5,2) DEFAULT 0,
    drop_off_count INTEGER DEFAULT 0,

    last_aggregated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(video_id, segment_start, segment_end)
);
```

**How It Works:**

1. **Segment Calculation:**
```javascript
const segmentSize = 10; // seconds
const segmentStart = Math.floor(positionSeconds / segmentSize) * segmentSize;
const segmentEnd = segmentStart + segmentSize;

// Example: position 125s → segment 120-130s
```

2. **Upsert Strategy:**
```sql
INSERT INTO video_heatmap (video_id, segment_start, segment_end, view_count)
VALUES ($1, $2, $3, 1)
ON CONFLICT (video_id, segment_start, segment_end)
DO UPDATE SET
  view_count = video_heatmap.view_count + 1,
  last_aggregated_at = CURRENT_TIMESTAMP;
```

3. **Visualization Query:**
```sql
SELECT segment_start, segment_end, view_count
FROM video_heatmap
WHERE video_id = $1
ORDER BY segment_start;
```

Returns data for bar chart or heatmap visualization.

### Table: video_watch_progress

**Purpose:** Store user's current position for resume functionality

**Schema:**
```sql
CREATE TABLE video_watch_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    video_id UUID NOT NULL REFERENCES course_videos(id),
    course_id UUID NOT NULL REFERENCES courses(id),

    -- Current state
    current_position_seconds INTEGER DEFAULT 0,
    video_duration_seconds INTEGER,
    progress_percentage DECIMAL(5,2) DEFAULT 0,
    completed BOOLEAN DEFAULT false,

    -- Timestamps
    first_watched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_watched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,

    lesson_id VARCHAR(255),

    UNIQUE(user_id, video_id) -- One progress per user per video
);
```

**Use Cases:**

1. **Resume Watching:**
```sql
SELECT current_position_seconds
FROM video_watch_progress
WHERE user_id = $1 AND video_id = $2;

-- Start video at current_position_seconds
```

2. **Course Progress Dashboard:**
```sql
SELECT video_id, progress_percentage, completed
FROM video_watch_progress
WHERE user_id = $1 AND course_id = $2
ORDER BY last_watched_at DESC;
```

3. **Recently Watched:**
```sql
SELECT * FROM video_watch_progress
WHERE user_id = $1
ORDER BY last_watched_at DESC
LIMIT 10;
```

### Materialized View: video_analytics_summary

**Purpose:** Pre-aggregate analytics for fast dashboard queries

**Definition:**
```sql
CREATE MATERIALIZED VIEW video_analytics_summary AS
SELECT
    va.video_id,
    va.course_id,
    cv.title as video_title,

    -- View metrics
    COUNT(DISTINCT va.id) as total_views,
    COUNT(DISTINCT va.user_id) as unique_viewers,
    COUNT(DISTINCT CASE WHEN va.completed = true THEN va.user_id END) as unique_completers,

    -- Time metrics
    AVG(va.watch_time_seconds) as avg_watch_time_seconds,
    SUM(va.watch_time_seconds) as total_watch_time_seconds,

    -- Completion metrics
    AVG(va.completion_percentage) as avg_completion_percentage,
    COUNT(CASE WHEN va.completed = true THEN 1 END) as completed_count,
    ROUND(
        (COUNT(CASE WHEN va.completed = true THEN 1 END)::DECIMAL /
         NULLIF(COUNT(DISTINCT va.id), 0) * 100),
        2
    ) as completion_rate,

    -- Engagement metrics
    AVG(va.play_count) as avg_play_count,
    AVG(va.pause_count) as avg_pause_count,
    AVG(va.seek_count) as avg_seek_count,

    -- Date range
    MIN(va.started_at) as first_view_at,
    MAX(va.started_at) as last_view_at

FROM video_analytics va
INNER JOIN course_videos cv ON va.video_id = cv.id
GROUP BY va.video_id, va.course_id, cv.title;
```

**Benefits:**
- Queries run in <10ms (vs 100ms+ for raw aggregation)
- No JOIN overhead on dashboard load
- Consistent performance with growing data

**Refresh Strategy:**
```sql
-- Manual refresh (admin clicks "Refresh Data")
REFRESH MATERIALIZED VIEW CONCURRENTLY video_analytics_summary;

-- Or scheduled (cron job every hour)
0 * * * * psql -c "REFRESH MATERIALIZED VIEW video_analytics_summary;"
```

## Tracking Implementation

### Client-Side: Session Management

**Session ID Generation:**
```javascript
function generateSessionId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Example: "1699123456789-kx7m2n4"
```

**Why this format:**
- Timestamp first: Natural sorting by time
- Random suffix: Uniqueness even for concurrent sessions
- No server roundtrip: Works offline
- URL-safe: No special characters

**Session Lifecycle:**
```javascript
const session = {
  sessionId: generateSessionId(),
  videoId: 'uuid',
  courseId: 'uuid',
  startTime: Date.now(),
  currentPosition: 0,
  watchTime: 0,
  playCount: 0,
  pauseCount: 0,
  seekCount: 0,
  isTracked: false,      // True after initial POST succeeds
  isCompleted: false     // True after completion POST succeeds
};
```

### Client-Side: Event Tracking

**HTML5 Video Events:**
```javascript
video.addEventListener('play', () => {
  session.playCount++;
  session.lastUpdateTime = Date.now();
});

video.addEventListener('pause', () => {
  session.pauseCount++;

  // Calculate watch time since last play
  const now = Date.now();
  const elapsed = (now - session.lastUpdateTime) / 1000;
  session.watchTime += elapsed;
});

video.addEventListener('timeupdate', () => {
  const currentTime = video.currentTime;

  // Detect seek (position jump > 2 seconds)
  if (Math.abs(currentTime - session.lastPosition) > 2) {
    session.seekCount++;
  }

  session.currentPosition = currentTime;
  session.lastPosition = currentTime;

  // Check for completion (90%+)
  const percentage = (currentTime / videoDuration) * 100;
  if (percentage >= 90 && !session.isCompleted) {
    trackCompletion(session);
  }
});
```

**Cloudflare Stream (iframe postMessage):**
```javascript
window.addEventListener('message', (event) => {
  // Validate origin
  if (!event.origin.includes('cloudflarestream.com')) return;

  const data = event.data;

  if (data.event === 'play') {
    session.playCount++;
  } else if (data.event === 'timeupdate') {
    session.currentPosition = data.currentTime;
    // ... update watch time
  }
});
```

### Client-Side: Periodic Updates

**Update Interval:**
```javascript
// Send progress every 15 seconds while playing
const UPDATE_INTERVAL = 15000; // 15 seconds

const intervalId = setInterval(() => {
  if (session.isTracked && !video.paused) {
    trackProgress(session);
  }
}, UPDATE_INTERVAL);
```

**Why 15 seconds:**
- Frequent enough: Accurate progress tracking
- Not too frequent: Reduces server load
- Battery friendly: Doesn't drain mobile devices
- Network friendly: Reduces cellular data usage

**Alternative Strategies:**
- Every 10 seconds: More accurate, higher load
- Every 30 seconds: Less accurate, lower load
- Adaptive: More frequent on fast connections, less on slow

### Server-Side: Tracking Functions

**Track Video View:**
```typescript
export async function trackVideoView(data: VideoViewData) {
  // 1. Check for duplicate session
  const existing = await pool.query(
    'SELECT * FROM video_analytics WHERE session_id = $1',
    [data.session_id]
  );

  if (existing.rows.length > 0) {
    return existing.rows[0]; // Already tracked
  }

  // 2. Insert new session
  const result = await pool.query(`
    INSERT INTO video_analytics (
      video_id, user_id, course_id, session_id,
      video_duration_seconds, lesson_id, is_preview,
      ip_address, user_agent, device_type, browser, os, referrer
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING *
  `, [/* ... values ... */]);

  // 3. Invalidate caches
  await invalidateAnalyticsCaches(data.video_id, data.course_id);

  return result.rows[0];
}
```

**Track Progress:**
```typescript
export async function trackVideoProgress(data: VideoProgressData) {
  // Update analytics session
  await pool.query(`
    UPDATE video_analytics
    SET max_position_seconds = GREATEST(max_position_seconds, $1),
        watch_time_seconds = $2,
        play_count = $3,
        pause_count = $4,
        last_updated_at = CURRENT_TIMESTAMP
    WHERE session_id = $5
    RETURNING *
  `, [
    data.current_position_seconds,
    data.watch_time_seconds,
    data.play_count,
    data.pause_count,
    data.session_id
  ]);

  // Update user progress (for resume)
  await updateUserWatchProgress({
    user_id: analytics.user_id,
    video_id: analytics.video_id,
    current_position_seconds: data.current_position_seconds,
    // ...
  });

  // Update heatmap
  await updateVideoHeatmap(videoId, data.current_position_seconds);
}
```

**Update Heatmap:**
```typescript
async function updateVideoHeatmap(videoId: string, positionSeconds: number) {
  const segmentSize = 10;
  const segmentStart = Math.floor(positionSeconds / segmentSize) * segmentSize;
  const segmentEnd = segmentStart + segmentSize;

  // Upsert (increment if exists, create if not)
  await pool.query(`
    INSERT INTO video_heatmap (video_id, segment_start, segment_end, view_count)
    VALUES ($1, $2, $3, 1)
    ON CONFLICT (video_id, segment_start, segment_end)
    DO UPDATE SET
      view_count = video_heatmap.view_count + 1,
      last_aggregated_at = CURRENT_TIMESTAMP
  `, [videoId, segmentStart, segmentEnd]);
}
```

## Analytics Retrieval

### Pattern: Cache-Aside

```typescript
export async function getVideoAnalyticsSummary(videoId: string) {
  // 1. Check cache
  const cacheKey = `video_analytics:summary:${videoId}`;
  const cached = await redis.getJSON(cacheKey);

  if (cached) {
    logger.debug('Cache hit');
    return cached;
  }

  // 2. Query database (cache miss)
  const result = await pool.query(
    'SELECT * FROM video_analytics_summary WHERE video_id = $1',
    [videoId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  // 3. Cache result
  await redis.setJSON(cacheKey, result.rows[0], 300); // 5 min TTL

  return result.rows[0];
}
```

**Cache Strategy:**
- **TTL: 5 minutes** - Balance freshness vs performance
- **Invalidation:** On new views/completions
- **Pattern delete:** `video_analytics:*` for bulk invalidation

### Popular Videos Query

```typescript
export async function getPopularVideos(limit = 10) {
  const result = await pool.query(`
    SELECT
      video_id, video_title, course_title,
      total_views, unique_viewers, completion_rate
    FROM video_analytics_summary
    WHERE is_preview = false  -- Exclude preview videos
    ORDER BY total_views DESC, unique_viewers DESC
    LIMIT $1
  `, [limit]);

  return result.rows;
}
```

**Why this ORDER BY:**
- Primary sort: total_views (most watched first)
- Tiebreaker: unique_viewers (better reach)
- Could add: completion_rate (quality filter)

### Dashboard Statistics

```typescript
export async function getAnalyticsDashboardStats() {
  const result = await pool.query(`
    SELECT
      COUNT(DISTINCT video_id) as total_videos,
      SUM(total_views)::BIGINT as total_views,
      SUM(unique_viewers)::BIGINT as total_unique_viewers,
      SUM(total_watch_time_seconds)::BIGINT / 3600 as total_watch_time_hours,
      AVG(completion_rate) as avg_completion_rate,
      COUNT(CASE WHEN completion_rate > 75 THEN 1 END) as high_completion,
      COUNT(CASE WHEN completion_rate BETWEEN 50 AND 75 THEN 1 END) as medium_completion,
      COUNT(CASE WHEN completion_rate < 50 THEN 1 END) as low_completion
    FROM video_analytics_summary
  `);

  return result.rows[0];
}
```

**Bucketing Completion Rates:**
- **High (>75%):** Excellent videos, replicate their success
- **Medium (50-75%):** Good videos, minor improvements needed
- **Low (<50%):** Problem videos, investigate or replace

## Client-Side Integration

### Auto-Initialization

**HTML Markup:**
```html
<video
  data-video-analytics
  data-video-id="550e8400-e29b-41d4-a716-446655440001"
  data-course-id="550e8400-e29b-41d4-a716-446655440002"
  data-video-duration="600"
  data-lesson-id="lesson-1"
  data-is-preview="false"
  src="/videos/lesson-1.mp4"
></video>
```

**Auto-Initialize Script:**
```javascript
// Runs on DOMContentLoaded
function initAllVideoAnalytics() {
  const videos = document.querySelectorAll('[data-video-analytics]');

  videos.forEach(video => {
    const config = {
      videoId: video.dataset.videoId,
      courseId: video.dataset.courseId,
      videoDuration: parseFloat(video.dataset.videoDuration),
      lessonId: video.dataset.lessonId,
      isPreview: video.dataset.isPreview === 'true'
    };

    initVideoAnalytics(video, config);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAllVideoAnalytics);
} else {
  initAllVideoAnalytics(); // Already loaded
}
```

### Manual Initialization

**For Dynamic Videos (SPA):**
```javascript
import { initVideoAnalytics } from '@/scripts/videoAnalyticsTracking';

// When mounting video component
const cleanup = initVideoAnalytics(videoElement, {
  videoId: 'uuid',
  courseId: 'uuid',
  videoDuration: 600,
  updateInterval: 15, // seconds
  completionThreshold: 90 // percentage
});

// When unmounting component
cleanup(); // Stops tracking, sends final update
```

### Retry Queue for Offline

**Problem:** User loses internet while watching

**Solution:** Queue failed requests and retry

```javascript
const retryQueue = [];

async function trackWithRetry(type, data) {
  try {
    await fetch(`/api/analytics/${type}`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  } catch (error) {
    // Queue for retry
    retryQueue.push({
      type,
      data,
      attempts: 0,
      nextRetryTime: Date.now() + 5000 // Retry in 5s
    });
  }
}

// Retry processor (runs every 5s)
setInterval(async () => {
  for (let i = retryQueue.length - 1; i >= 0; i--) {
    const item = retryQueue[i];

    if (Date.now() < item.nextRetryTime) continue;

    try {
      await fetch(`/api/analytics/${item.type}`, {
        method: 'POST',
        body: JSON.stringify(item.data)
      });

      retryQueue.splice(i, 1); // Success - remove from queue
    } catch (error) {
      item.attempts++;

      if (item.attempts >= 3) {
        retryQueue.splice(i, 1); // Give up after 3 attempts
      } else {
        // Exponential backoff
        item.nextRetryTime = Date.now() + Math.pow(2, item.attempts) * 5000;
      }
    }
  }
}, 5000);
```

## Performance Optimization

### 1. Materialized Views

**Problem:** Aggregating analytics is slow
```sql
-- Slow (scans all rows every time)
SELECT COUNT(*), AVG(watch_time) FROM video_analytics WHERE video_id = $1;
```

**Solution:** Pre-aggregate with materialized view
```sql
-- Fast (single row lookup)
SELECT * FROM video_analytics_summary WHERE video_id = $1;
```

**Trade-off:**
- ✅ 10x+ faster queries
- ❌ Not real-time (needs refresh)
- ✅ Acceptable for analytics (hourly refresh is fine)

### 2. Redis Caching

**Cache Layers:**
```
Request → Redis (5-10ms) → Materialized View (20-30ms) → Raw Data (100ms+)
          ↑ Cache hit       ↑ Cache miss                  ↑ View miss
```

**TTL Strategy:**
- **Short TTL (5 min):** Frequently changing data (video stats)
- **Medium TTL (10 min):** Slowly changing data (popular videos)
- **Long TTL (1 hour):** Rarely changing data (course totals)

### 3. Batch Updates

**Instead of:**
```javascript
// 1 query per second
video.addEventListener('timeupdate', async () => {
  await trackProgress(session); // Network call!
});
```

**Do:**
```javascript
// 1 query per 15 seconds
setInterval(async () => {
  if (!video.paused) {
    await trackProgress(session);
  }
}, 15000);
```

**Savings:** 93% fewer API calls (60/min → 4/min)

### 4. Index Optimization

**Most Common Queries:**
```sql
-- 1. Get user's progress (for resume)
SELECT * FROM video_watch_progress WHERE user_id = $1 AND video_id = $2;
→ INDEX idx_video_watch_progress_user_video (user_id, video_id)

-- 2. Get video stats
SELECT * FROM video_analytics WHERE video_id = $1;
→ INDEX idx_video_analytics_video_id (video_id)

-- 3. Get completed videos only
SELECT * FROM video_analytics WHERE completed = true;
→ PARTIAL INDEX idx_video_analytics_completed (completed) WHERE completed = true
```

**Partial Index Benefit:**
- Smaller index size (only completed=true rows)
- Faster queries (less data to scan)
- Less disk I/O

## Best Practices

### 1. Session ID Generation

✅ **DO:**
```javascript
const sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
```

❌ **DON'T:**
```javascript
const sessionId = Math.random().toString(); // Could collide
const sessionId = Date.now().toString();     // Collides on fast clicks
```

### 2. Completion Threshold

✅ **DO:**
```javascript
const threshold = 90; // Configurable
const percentage = (currentTime / duration) * 100;
if (percentage >= threshold && !completed) {
  markComplete();
}
```

❌ **DON'T:**
```javascript
if (video.ended) {
  markComplete(); // Misses users who close at 95%
}
```

### 3. Error Handling

✅ **DO:**
```javascript
try {
  await trackProgress(data);
} catch (error) {
  logger.error('Analytics tracking failed', error);
  queueForRetry(data); // Don't lose data
}
```

❌ **DON'T:**
```javascript
await trackProgress(data); // Unhandled rejection
// Or worse:
trackProgress(data).catch(() => {}); // Silent failure
```

### 4. Privacy Considerations

✅ **DO:**
```typescript
// Anonymize IP addresses (GDPR compliance)
const anonymizedIP = ipAddress.split('.').slice(0, 3).join('.') + '.0';

// Make user_id nullable
user_id UUID REFERENCES users(id) ON DELETE SET NULL
```

❌ **DON'T:**
```typescript
// Store full IP without consent
ip_address: request.ip,

// Lose analytics on user deletion
user_id UUID REFERENCES users(id) ON DELETE CASCADE
```

### 5. Data Retention

✅ **DO:**
```sql
-- Archive old data (keep recent for analysis)
DELETE FROM video_analytics
WHERE created_at < NOW() - INTERVAL '2 years';

-- Or move to archive table
INSERT INTO video_analytics_archive
SELECT * FROM video_analytics
WHERE created_at < NOW() - INTERVAL '1 year';
```

## Conclusion

Video analytics tracking is a powerful tool for understanding user engagement and improving content quality. Our implementation provides:

✅ **Comprehensive Tracking**
- View counts, watch time, completion rates
- Engagement metrics (play, pause, seek)
- Segment-level heatmaps

✅ **Performance Optimized**
- Materialized views for fast aggregations
- Redis caching for sub-second response times
- Batch updates to reduce server load

✅ **User-Friendly**
- Auto-initialization for easy integration
- Resume functionality for better UX
- Retry queue for offline resilience

✅ **Actionable Insights**
- Popular videos ranking
- Drop-off point identification
- Completion rate bucketing

**Next Steps for Learning:**
1. Explore the codebase: `src/lib/analytics/videos.ts`
2. Try the admin dashboard: `/admin/analytics/videos`
3. Examine the database: `SELECT * FROM video_analytics LIMIT 10`
4. Monitor real-time: Watch your own video and check `video_watch_progress`
5. Optimize further: Add A/B testing, recommendations, or machine learning

Happy tracking! 📊🎥
