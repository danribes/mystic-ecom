# T187: Course Lesson Page - Learning Guide

**Task**: Integrate VideoPlayer into course lesson pages
**Complexity**: Intermediate-Advanced
**Topics**: Astro dynamic routes, video integration, progress tracking, enrollment verification
**Date**: 2025-11-04

---

## Table of Contents

1. [Overview](#overview)
2. [Learning Objectives](#learning-objectives)
3. [Architecture](#architecture)
4. [Key Concepts](#key-concepts)
5. [Implementation Steps](#implementation-steps)
6. [Progress Tracking System](#progress-tracking-system)
7. [Security & Authorization](#security--authorization)
8. [Best Practices](#best-practices)
9. [Common Pitfalls](#common-pitfalls)
10. [Advanced Topics](#advanced-topics)

---

## Overview

This guide teaches you how to build a complete course lesson page with video player integration, progress tracking, enrollment verification, and navigation features. You'll learn how to create an engaging learning experience for students with automatic progress tracking and seamless video playback.

### What We're Building

A comprehensive lesson viewing page that:
- Displays video content with Cloudflare Stream
- Tracks student progress automatically
- Provides lesson navigation (previous/next)
- Shows course curriculum in sidebar
- Verifies enrollment before access
- Handles multiple video processing states
- Works responsively on all devices

---

## Learning Objectives

By the end of this guide, you will understand:

1. **Astro Dynamic Routes**: How to create dynamic pages with multiple parameters
2. **Video Player Integration**: How to embed and control video players
3. **Progress Tracking**: How to implement automatic watch-time tracking
4. **Enrollment Verification**: How to restrict content to enrolled users
5. **Database Operations**: How to perform complex queries with JOINs
6. **State Management**: How to handle video processing states
7. **UI/UX Patterns**: How to create intuitive lesson navigation
8. **API Design**: How to build RESTful progress tracking endpoints

---

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────┐
│                   Browser                            │
│  ┌───────────────────────────────────────────────┐  │
│  │          Lesson Page (Astro)                  │  │
│  │  ┌─────────────────────────────────────────┐  │  │
│  │  │       VideoPlayer Component             │  │  │
│  │  │  - Cloudflare Stream iframe             │  │  │
│  │  │  - Progress tracking (10s intervals)    │  │  │
│  │  │  - Keyboard shortcuts                    │  │  │
│  │  │  - Auto-complete at 90%                  │  │  │
│  │  └─────────────────────────────────────────┘  │  │
│  │                                                 │  │
│  │  [Mark Complete Button]                        │  │
│  │  [Previous] [Next] Navigation                  │  │
│  │  [Curriculum Sidebar]                          │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
                        │
                        │ API Calls
                        ▼
┌─────────────────────────────────────────────────────┐
│                Server (Astro API)                    │
│                                                       │
│  /api/progress/update     /api/progress/complete    │
│  - Watch time tracking    - Mark as complete        │
│  - Auto-complete >= 90%   - Set completed_at        │
│  - Enrollment check       - Enrollment check        │
└─────────────────────────────────────────────────────┘
                        │
                        │ Database Queries
                        ▼
┌─────────────────────────────────────────────────────┐
│              PostgreSQL Database                     │
│                                                       │
│  lesson_progress:  Track completion & watch time    │
│  courses:          Course data & curriculum         │
│  course_videos:    Video metadata & URLs            │
│  orders:           Enrollment verification          │
└─────────────────────────────────────────────────────┘
                        │
                        │ Video Delivery
                        ▼
┌─────────────────────────────────────────────────────┐
│          Cloudflare Stream CDN                       │
│  - HLS/DASH adaptive streaming                      │
│  - Global edge network                              │
│  - Automatic encoding                               │
└─────────────────────────────────────────────────────┘
```

### Data Flow

```
1. User clicks lesson →
2. Auth check →
3. Enrollment verification →
4. Load course/video data →
5. Render page with player →
6. Video plays →
7. Progress tracked (10s) →
8. Progress updated in DB →
9. Auto-complete >= 90% OR manual complete →
10. Navigate to next lesson
```

---

## Key Concepts

### 1. Astro Dynamic Routes

Astro allows dynamic route parameters using bracket syntax:

```
src/pages/courses/[id]/lessons/[lessonId].astro
```

This creates routes like:
- `/courses/quantum-mastery/lessons/lesson-01`
- `/courses/energy-healing/lessons/intro`

**Accessing Parameters**:
```typescript
const { id: courseId, lessonId } = Astro.params;
```

**Why This Matters**: Dynamic routes let you create one page template that works for all courses and lessons, reducing code duplication.

### 2. Enrollment Verification

Before showing lesson content, verify the user has purchased the course:

```sql
SELECT 1 FROM order_items oi
JOIN orders o ON oi.order_id = o.id
WHERE o.user_id = $1
  AND oi.course_id = $2
  AND o.status = 'completed'
LIMIT 1
```

**Key Points**:
- JOIN orders and order_items tables
- Check order status = 'completed' (not 'pending')
- Use LIMIT 1 for performance (we only need to know if exists)
- Return early if not enrolled

**Security Implication**: This prevents unauthorized access to paid content.

### 3. Progress Tracking Strategy

**Automatic Tracking** (VideoPlayer):
- Update every 10 seconds while video plays
- Only update if progress changed >= 5%
- Send currentTime and progress %
- Auto-complete at >= 90% watched

**Manual Tracking** (Mark Complete Button):
- User explicitly marks lesson done
- Updates completion timestamp
- Shows visual feedback

**Database Design**:
```sql
CREATE TABLE lesson_progress (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    course_id UUID REFERENCES courses(id),
    lesson_id VARCHAR(255),
    completed BOOLEAN DEFAULT false,
    time_spent_seconds INTEGER,
    completed_at TIMESTAMP,
    last_accessed_at TIMESTAMP,
    UNIQUE(user_id, course_id, lesson_id)
);
```

**Why UNIQUE Constraint**: Ensures one progress record per user/course/lesson combination.

### 4. UPSERT Pattern

Use ON CONFLICT to handle insert-or-update in one query:

```sql
INSERT INTO lesson_progress (user_id, course_id, lesson_id, time_spent_seconds)
VALUES ($1, $2, $3, $4)
ON CONFLICT (user_id, course_id, lesson_id)
DO UPDATE SET
  time_spent_seconds = GREATEST(
    lesson_progress.time_spent_seconds,
    EXCLUDED.time_spent_seconds
  ),
  last_accessed_at = CURRENT_TIMESTAMP,
  updated_at = CURRENT_TIMESTAMP
```

**Key Points**:
- INSERT first (optimistic)
- If conflict on UNIQUE constraint → UPDATE
- Use GREATEST to prevent backwards progress
- Update timestamps

### 5. Video Processing States

Videos go through multiple states after upload:

```typescript
type VideoStatus = 'queued' | 'inprogress' | 'ready' | 'error';
```

**State Handling**:
- **queued**: Show "Processing..." with 0% progress
- **inprogress**: Show animated spinner with progress %
- **ready**: Display video player
- **error**: Show error message with retry option
- **no video**: Show placeholder message

**UI Implementation**:
```astro
{videoData && videoData.status === 'ready' ? (
  <VideoPlayer videoId={videoData.cloudflareVideoId} />
) : videoData && videoData.status === 'queued' ? (
  <ProcessingIndicator progress={videoData.processingProgress} />
) : !videoData ? (
  <NoVideoPlaceholder />
) : null}
```

### 6. Lesson Navigation Logic

**Finding Adjacent Lessons**:
```typescript
// Flatten all lessons from all sections
const getAllLessons = () => {
  const allLessons: any[] = [];
  curriculum.forEach((section) => {
    section.lessons?.forEach((lesson) => {
      allLessons.push({
        id: lesson.id,
        title: lesson.title,
        sectionTitle: section.title,
      });
    });
  });
  return allLessons;
};

// Find current, previous, next
const allLessons = getAllLessons();
const currentIndex = allLessons.findIndex((l) => l.id === lessonId);
const previousLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;
```

**Edge Cases**:
- First lesson: no previous button
- Last lesson: no next button
- Single lesson course: no navigation

---

## Implementation Steps

### Step 1: Create Dynamic Route File

**File**: `src/pages/courses/[id]/lessons/[lessonId].astro`

```astro
---
const { id: courseId, lessonId } = Astro.params;
---

<div>Course: {courseId}, Lesson: {lessonId}</div>
```

**Test**: Visit `/courses/test/lessons/lesson1` and verify parameters display.

### Step 2: Add Authentication Check

```astro
---
import { getSessionFromRequest } from '@/lib/auth/session';

const session = await getSessionFromRequest(Astro.cookies);

if (!session) {
  return Astro.redirect(`/login?redirect=/courses/${courseId}/lessons/${lessonId}`);
}
---
```

**Test**: Visit as logged-out user → should redirect to login.

### Step 3: Add Enrollment Verification

```astro
---
import { getPool } from '@/lib/db';

const pool = getPool();

const enrollmentResult = await pool.query(
  `SELECT 1 FROM order_items oi
   JOIN orders o ON oi.order_id = o.id
   WHERE o.user_id = $1 AND oi.course_id = $2 AND o.status = 'completed'
   LIMIT 1`,
  [session.userId, courseId]
);

const isEnrolled = enrollmentResult.rows.length > 0;

if (!isEnrolled) {
  return Astro.redirect(`/courses/${courseId}?error=not-enrolled`);
}
---
```

**Test**: Try accessing as non-enrolled user → should redirect to course page.

### Step 4: Load Course and Video Data

```astro
---
// Load course
const courseResult = await pool.query(
  `SELECT id, title, slug, description, metadata
   FROM courses
   WHERE id = $1 OR slug = $1`,
  [courseId]
);

const course = courseResult.rows[0];

// Load video for lesson
const videoResult = await pool.query(
  `SELECT id, cloudflare_video_id, title, status, playback_hls_url
   FROM course_videos
   WHERE course_id = $1 AND lesson_id = $2`,
  [course.id, lessonId]
);

const videoData = videoResult.rows[0];
---
```

**Test**: Verify course and video data loads correctly.

### Step 5: Integrate VideoPlayer Component

```astro
---
import VideoPlayer from '@/components/VideoPlayer.astro';
---

{videoData && videoData.status === 'ready' ? (
  <VideoPlayer
    videoId={videoData.cloudflare_video_id}
    title={course.title}
    courseId={course.id}
    lessonId={lessonId}
    poster={videoData.thumbnail_url}
  />
) : (
  <div>Video not ready</div>
)}
```

**Test**: Video should play when status is 'ready'.

### Step 6: Add Progress Tracking APIs

**Create `/api/progress/update.ts`**:

```typescript
import type { APIRoute } from 'astro';
import { getSessionFromRequest } from '@/lib/auth/session';
import { getPool } from '@/lib/db';

export const POST: APIRoute = async ({ request, cookies }) => {
  const session = await getSessionFromRequest(cookies);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const { courseId, lessonId, progress, currentTime } = await request.json();

  const pool = getPool();

  // Update progress
  await pool.query(
    `INSERT INTO lesson_progress (user_id, course_id, lesson_id, time_spent_seconds)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, course_id, lesson_id)
     DO UPDATE SET
       time_spent_seconds = GREATEST(lesson_progress.time_spent_seconds, EXCLUDED.time_spent_seconds),
       last_accessed_at = CURRENT_TIMESTAMP`,
    [session.userId, courseId, lessonId, Math.floor(currentTime)]
  );

  // Auto-complete if >= 90%
  if (progress >= 90) {
    await pool.query(
      `UPDATE lesson_progress
       SET completed = true, completed_at = COALESCE(completed_at, CURRENT_TIMESTAMP)
       WHERE user_id = $1 AND course_id = $2 AND lesson_id = $3 AND completed = false`,
      [session.userId, courseId, lessonId]
    );
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 });
};
```

**Test**: VideoPlayer should call this endpoint every 10 seconds.

### Step 7: Add Mark Complete Button

```astro
<script>
document.getElementById('mark-complete-btn')?.addEventListener('click', async () => {
  const response = await fetch('/api/progress/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      courseId: '{course.id}',
      lessonId: '{lessonId}'
    })
  });

  if (response.ok) {
    window.location.reload(); // Refresh to show completed state
  }
});
</script>

<button id="mark-complete-btn">Mark as Complete</button>
```

**Test**: Click button → lesson should be marked complete in database.

### Step 8: Add Lesson Navigation

```astro
---
// Find previous and next lessons
const allLessons = getAllLessons(curriculum);
const currentIndex = allLessons.findIndex((l) => l.id === lessonId);
const previousLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;
---

<div class="lesson-navigation">
  {previousLesson && (
    <a href={`/courses/${course.slug}/lessons/${previousLesson.id}`}>
      ← Previous: {previousLesson.title}
    </a>
  )}

  {nextLesson && (
    <a href={`/courses/${course.slug}/lessons/${nextLesson.id}`}>
      Next: {nextLesson.title} →
    </a>
  )}
</div>
```

**Test**: Navigate between lessons using buttons.

### Step 9: Add Curriculum Sidebar

```astro
<aside class="curriculum-sidebar">
  <h2>Course Content</h2>
  {curriculum.map((section) => (
    <details open={section.lessons?.some((l) => l.id === lessonId)}>
      <summary>{section.title}</summary>
      <ul>
        {section.lessons?.map((lesson) => (
          <li class={lesson.id === lessonId ? 'active' : ''}>
            <a href={`/courses/${course.slug}/lessons/${lesson.id}`}>
              {lesson.title}
            </a>
          </li>
        ))}
      </ul>
    </details>
  ))}
</aside>
```

**Test**: Sidebar should show all lessons, highlight current lesson.

### Step 10: Style with Tailwind CSS

```astro
<div class="grid grid-cols-1 lg:grid-cols-[1fr_350px]">
  <!-- Main content -->
  <main class="lesson-main">
    <div class="aspect-video bg-black">
      <VideoPlayer ... />
    </div>
  </main>

  <!-- Sidebar -->
  <aside class="lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto border-l">
    <!-- Curriculum -->
  </aside>
</div>
```

**Test**: Layout should be responsive, sidebar sticky on desktop.

---

## Progress Tracking System

### How It Works

1. **Page Load**:
   - Check if progress record exists
   - If not, create initial record with completed = false
   - Update last_accessed_at timestamp

2. **During Playback** (VideoPlayer Component):
   - Track current playback time
   - Every 10 seconds, send update to API
   - Only update if progress changed >= 5%
   - Calculate progress percentage

3. **Auto-Completion**:
   - If progress >= 90%, automatically mark complete
   - Prevents need for manual button click
   - Uses COALESCE to keep original completion time

4. **Manual Completion**:
   - User clicks "Mark as Complete" button
   - Sets completed = true
   - Records completed_at timestamp
   - Shows success feedback

### Database Queries Explained

**GREATEST Function**:
```sql
time_spent_seconds = GREATEST(
  lesson_progress.time_spent_seconds,
  EXCLUDED.time_spent_seconds
)
```
This ensures watch time only increases, never decreases (prevents rewinding from reducing progress).

**COALESCE Function**:
```sql
completed_at = COALESCE(completed_at, CURRENT_TIMESTAMP)
```
This keeps the original completion timestamp if already set, only sets new timestamp if NULL.

**UNIQUE Constraint**:
```sql
UNIQUE(user_id, course_id, lesson_id)
```
This ensures one progress record per user+course+lesson, enabling UPSERT pattern.

---

## Security & Authorization

### 1. Authentication Layer

```typescript
const session = await getSessionFromRequest(Astro.cookies);

if (!session) {
  return Astro.redirect('/login');
}
```

**Purpose**: Verify user is logged in before accessing any lesson content.

### 2. Enrollment Layer

```sql
SELECT 1 FROM order_items oi
JOIN orders o ON oi.order_id = o.id
WHERE o.user_id = $1
  AND oi.course_id = $2
  AND o.status = 'completed'
```

**Purpose**: Verify user has purchased the course.

**Why Check Status**: Pending orders shouldn't grant access until payment is complete.

### 3. Parameter Validation

```typescript
if (!courseId || !lessonId) {
  return new Response(
    JSON.stringify({ error: 'Missing parameters' }),
    { status: 400 }
  );
}
```

**Purpose**: Prevent invalid requests from causing errors.

### 4. SQL Injection Prevention

```typescript
// ❌ BAD: String concatenation
await pool.query(`SELECT * FROM courses WHERE id = '${courseId}'`);

// ✅ GOOD: Parameterized query
await pool.query('SELECT * FROM courses WHERE id = $1', [courseId]);
```

**Purpose**: Prevent malicious SQL injection attacks.

### 5. API Endpoint Protection

Every API endpoint should:
1. Check authentication
2. Validate parameters
3. Check authorization (enrollment)
4. Handle errors gracefully
5. Log security events

---

## Best Practices

### 1. Error Handling

**Always Handle Errors**:
```typescript
try {
  const result = await pool.query(...);
} catch (error) {
  logger.error('Database error:', error);
  return new Response(
    JSON.stringify({ error: 'Failed to load lesson' }),
    { status: 500 }
  );
}
```

### 2. Loading States

**Show Feedback to Users**:
```astro
{isLoading ? (
  <div>Loading...</div>
) : error ? (
  <div>Error: {error}</div>
) : (
  <VideoPlayer ... />
)}
```

### 3. Progressive Enhancement

**Work Without JavaScript**:
- Links work without JS (server-side rendering)
- Forms work without JS (native HTML)
- Enhance with JS for better UX

### 4. Accessibility

**Screen Reader Support**:
```html
<button
  aria-label="Mark lesson as complete"
  aria-pressed={isCompleted}
>
  Mark as Complete
</button>
```

### 5. Performance Optimization

**Lazy Load Non-Critical Content**:
```astro
<iframe loading="lazy" ... />
```

**Index Database Columns**:
```sql
CREATE INDEX idx_lesson_progress_user_course
ON lesson_progress(user_id, course_id);
```

---

## Common Pitfalls

### 1. Not Checking Enrollment

**Problem**: Allowing access without verifying purchase
**Solution**: Always check enrollment before rendering content
**Impact**: Revenue loss, security breach

### 2. Race Conditions in Progress Updates

**Problem**: Multiple rapid updates causing conflicts
**Solution**: Use UPSERT with GREATEST for idempotent updates
**Impact**: Incorrect progress data

### 3. Not Handling Video States

**Problem**: Only handling 'ready' state
**Solution**: Handle all states (queued, inprogress, ready, error, null)
**Impact**: Poor user experience during processing

### 4. Forgetting Error Boundaries

**Problem**: Errors crash entire page
**Solution**: Wrap sections in try-catch, show friendly errors
**Impact**: Broken user experience

### 5. Missing Indexes

**Problem**: Slow queries on large tables
**Solution**: Index foreign keys and frequently queried columns
**Impact**: Poor performance at scale

### 6. Not Using Transactions

**Problem**: Partial updates leaving inconsistent state
**Solution**: Use transactions for multi-step operations
**Impact**: Data corruption

### 7. Client-Side Only Progress

**Problem**: Progress lost on page refresh
**Solution**: Save progress to database, not just local storage
**Impact**: Lost user data

---

## Advanced Topics

### 1. Real-Time Progress Synchronization

For multi-device support, use WebSockets:

```typescript
const ws = new WebSocket('wss://api.example.com/progress');

ws.onmessage = (event) => {
  const { lessonId, progress } = JSON.parse(event.data);
  updateProgressUI(lessonId, progress);
};
```

### 2. Offline Support

Cache lessons for offline viewing:

```typescript
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');

  // Cache video for offline
  caches.open('lessons').then((cache) => {
    cache.add(videoUrl);
  });
}
```

### 3. Analytics Integration

Track detailed viewing analytics:

```typescript
const analytics = {
  lessonId,
  userId,
  watchTime: currentTime,
  completionRate: (currentTime / duration) * 100,
  playbackSpeed,
  deviceType,
  timestamp: new Date(),
};

await fetch('/api/analytics', {
  method: 'POST',
  body: JSON.stringify(analytics),
});
```

### 4. Adaptive Video Quality

Implement quality selector:

```typescript
<select onChange={(e) => setQuality(e.target.value)}>
  <option value="auto">Auto</option>
  <option value="1080p">1080p</option>
  <option value="720p">720p</option>
  <option value="480p">480p</option>
</select>
```

### 5. Certificate Generation

Auto-generate certificates on completion:

```typescript
const generateCertificate = async (userId, courseId) => {
  // Check if all lessons completed
  const result = await pool.query(`
    SELECT COUNT(*) as total,
           SUM(CASE WHEN completed THEN 1 ELSE 0 END) as completed
    FROM lesson_progress
    WHERE user_id = $1 AND course_id = $2
  `, [userId, courseId]);

  if (result.rows[0].total === result.rows[0].completed) {
    // Generate PDF certificate
    await generatePDF({
      template: 'certificate',
      data: { userName, courseName, completionDate }
    });
  }
};
```

---

## Conclusion

You've learned how to build a complete course lesson page with:
- ✅ Dynamic routing in Astro
- ✅ Video player integration
- ✅ Automatic progress tracking
- ✅ Enrollment verification
- ✅ Lesson navigation
- ✅ Responsive curriculum sidebar
- ✅ Multiple video states handling
- ✅ Security best practices
- ✅ Performance optimization

### Next Steps

1. **Test Thoroughly**: Try all edge cases and error states
2. **Monitor Performance**: Track page load times and video quality
3. **Gather Feedback**: Ask users about the learning experience
4. **Iterate**: Continuously improve based on data and feedback

### Additional Resources

- [Astro Documentation](https://docs.astro.build)
- [Cloudflare Stream API](https://developers.cloudflare.com/stream/)
- [PostgreSQL UPSERT](https://www.postgresql.org/docs/current/sql-insert.html)
- [Web Video Standards](https://www.w3.org/TR/html5/embedded-content-0.html#the-video-element)

---

**Author**: Claude Code
**Version**: 1.0
**Last Updated**: 2025-11-04
