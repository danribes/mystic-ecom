# T191: Video Transcoding Monitoring - Learning Guide

**Date:** November 5, 2025
**Difficulty:** Intermediate
**Prerequisites:** T181 (Cloudflare Stream), T186 (Webhooks), T048 (Email)

## Table of Contents

1. [Core Concepts](#core-concepts)
2. [Architecture Overview](#architecture-overview)
3. [Email Notifications](#email-notifications)
4. [Monitoring Service](#monitoring-service)
5. [Retry Logic](#retry-logic)
6. [Admin API](#admin-api)
7. [Usage Examples](#usage-examples)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

## Core Concepts

### Video Processing States

Video transcoding on Cloudflare Stream goes through distinct states:

```
Upload → queued → inprogress → ready | error
```

**queued:** Video uploaded, waiting for transcoding
**inprogress:** Actively transcoding (0-100% complete)
**ready:** Transcoding complete, ready to stream
**error:** Transcoding failed, requires investigation

### Webhook Notifications

Cloudflare sends webhook notifications when video status changes:

```javascript
POST /api/webhooks/cloudflare

{
  "uid": "cf-video-123",
  "readyToStream": true,
  "status": {
    "state": "ready",
    "pctComplete": "100"
  },
  "duration": 600,
  "playback": {
    "hls": "https://...",
    "dash": "https://..."
  }
}
```

### Monitoring vs. Polling

**Webhooks (Push):** Cloudflare notifies us when status changes
**Monitoring (Pull):** We actively check status via API calls

Both approaches complement each other:
- Webhooks: Real-time notifications (preferred)
- Monitoring: Catch missed webhooks, detect stuck videos

### Retry Strategies

**Exponential Backoff:**
```
Attempt 1: 5 seconds
Attempt 2: 10 seconds
Attempt 3: 20 seconds
Max delay: 5 minutes
```

Formula: `delay = initialDelay * (multiplier ^ (attempt - 1))`

## Architecture Overview

### Component Diagram

```
┌─────────────────────────────────────────────────────────┐
│                  Cloudflare Stream                      │
│  (Video Storage & Transcoding)                          │
└────────────┬────────────────────────────┬───────────────┘
             │                            │
             │ Webhooks                   │ API Calls
             │ (Push)                     │ (Pull)
             ▼                            ▼
┌────────────────────┐        ┌─────────────────────────┐
│ Webhook Handler    │        │  Monitoring Service     │
│ (cloudflare.ts)    │        │  (videoMonitoring.ts)   │
│                    │        │                         │
│ - Receive webhooks │        │ - Check video status    │
│ - Update database  │        │ - Retry failed videos   │
│ - Send notifications│       │ - Get statistics        │
└─────────┬──────────┘        └──────────┬──────────────┘
          │                               │
          │                               │
          ▼                               ▼
┌─────────────────────────────────────────────────────────┐
│              PostgreSQL Database                         │
│  (course_videos table)                                   │
│                                                           │
│  id, cloudflare_video_id, status, progress, duration... │
└─────────────────────────────────────────────────────────┘
          │                               │
          │                               │
          ▼                               ▼
┌─────────────────────┐        ┌─────────────────────────┐
│  Email Service      │        │   Admin Dashboard       │
│  (email.ts)         │        │   (Admin API)           │
│                     │        │                         │
│ - Video ready       │        │ - View statistics       │
│ - Video failed      │        │ - Trigger monitoring    │
│                     │        │ - Manual retry          │
└─────────────────────┘        └─────────────────────────┘
```

### Data Flow

**1. Video Becomes Ready:**
```
Cloudflare → Webhook → Database Update → Email Notification → Admin
```

**2. Video Fails:**
```
Cloudflare → Webhook → Database Update → Admin Alert → Manual Investigation
```

**3. Manual Monitoring:**
```
Admin → API Endpoint → Monitoring Service → Cloudflare API → Status Update
```

**4. Automatic Retry:**
```
Failed Video → Retry Service → Cloudflare API Check → Update if Fixed
```

## Email Notifications

### Video Ready Notification

Sent to admin when video completes processing successfully.

**Template Structure:**
- **Subject:** 🎬 Video Ready: [Video Title]
- **Header:** Green gradient with success icon
- **Content:** Video details, course info, duration
- **CTA:** "Watch Video Now" button
- **Footer:** Platform branding

**Example Email:**
```
Your Video is Ready! 🎬

Hi Admin,

Great news! The video "Introduction to Meditation" from your course
"Mindfulness Basics" has finished processing and is now ready to watch.

Video Details:
  📹 Video: Introduction to Meditation
  📚 Course: Mindfulness Basics
  ⏱️ Duration: 10:00

[Watch Video Now]

Pro Tip: Your video is now available in HD quality and streams
instantly on any device.
```

**Data Required:**
```typescript
interface VideoReadyData {
  userName: string;      // 'Admin'
  userEmail: string;     // from ADMIN_EMAIL
  videoTitle: string;    // from database
  courseTitle: string;   // from database
  videoUrl: string;      // generated link
  duration: number;      // seconds
}
```

### Video Failed Notification

Sent to admin when video processing fails.

**Template Structure:**
- **Subject:** 🚨 Video Processing Failed: [Video Title]
- **Header:** Red gradient with warning icon
- **Content:** Error details, video info, troubleshooting
- **Sections:**
  - Failed Video Details
  - Error Information (code + message)
  - Recommended Actions
- **CTA:** "View in Admin Dashboard" button

**Example Email:**
```
⚠️ Video Processing Failed

Admin Alert: A video upload has failed during processing and
requires attention.

Failed Video Details:
  📹 Video Title: Advanced Techniques
  📚 Course: Meditation Mastery
  🆔 Video ID: 123e4567-e89b-12d3...
  ☁️ Cloudflare ID: cf-abc123
  📅 Uploaded: November 5, 2025, 3:45 PM

Error Information:
  Error Code: ERR_INVALID_FORMAT
  Error Message: Video codec not supported

Recommended Actions:
  ✓ Check video file format and codec compatibility
  ✓ Verify file size within Cloudflare Stream limits
  ✓ Review Cloudflare Stream dashboard for detailed logs
  ✓ Consider re-uploading video if file is corrupted
  ✓ Contact Cloudflare support if issue persists

[View in Admin Dashboard]
```

**Data Required:**
```typescript
interface VideoFailedData {
  adminEmail: string;
  videoId: string;
  videoTitle: string;
  courseTitle: string;
  cloudflareVideoId: string;
  errorCode?: string;
  errorMessage?: string;
  uploadedAt: Date;
  adminDashboardUrl: string;
}
```

## Monitoring Service

### Check Video Status

Check the current Cloudflare status of a specific video:

```typescript
import { checkVideoStatus } from '@/lib/videoMonitoring';

const status = await checkVideoStatus(videoId);

console.log(status);
// {
//   videoId: '123e4567-e89b-12d3...',
//   cloudflareVideoId: 'cf-abc123',
//   status: 'inprogress',
//   progress: 45,
//   duration: null,
//   readyToStream: false,
//   lastChecked: Date
// }
```

**Use Cases:**
- Manual status refresh
- Periodic monitoring cron job
- Admin dashboard display
- Debugging processing issues

### Monitor All Processing Videos

Batch check all videos currently in processing:

```typescript
import { monitorProcessingVideos } from '@/lib/videoMonitoring';

const checkedCount = await monitorProcessingVideos();
console.log(`Checked ${checkedCount} videos`);
```

**Implementation:**
```typescript
// Finds all videos with status IN ('queued', 'inprogress')
// For each video:
//   1. Call Cloudflare API to get current status
//   2. Update database if status changed
//   3. Add 100ms delay to avoid rate limits
```

**Recommended Schedule:**
- Development: Manual trigger via API
- Staging: Every 15 minutes (cron)
- Production: Every 5 minutes (cron)

### Get Monitoring Statistics

Retrieve aggregated statistics across all videos:

```typescript
import { getMonitoringStats } from '@/lib/videoMonitoring';

const stats = await getMonitoringStats();
console.log(stats);
// {
//   totalVideos: 150,
//   processing: 5,
//   ready: 140,
//   failed: 3,
//   queued: 2,
//   averageProcessingTime: 8.5  // minutes
// }
```

**Query Implementation:**
```sql
SELECT
  status,
  COUNT(*) as count,
  AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/60) as avg_processing_time
FROM course_videos
WHERE status IN ('queued', 'inprogress', 'ready', 'error')
GROUP BY status
```

### Detect Stuck Videos

Find videos that have been processing unusually long:

```typescript
import { getStuckVideos } from '@/lib/videoMonitoring';

// Get videos processing longer than 2 hours
const stuckVideos = await getStuckVideos(120);

stuckVideos.forEach(video => {
  console.log(`Stuck: ${video.title} (${video.status})`);
  console.log(`Last updated: ${video.updated_at}`);
});
```

**Thresholds:**
- Short videos (<10 min): 30 minutes
- Medium videos (10-60 min): 60 minutes
- Long videos (>60 min): 120 minutes

## Retry Logic

### Retry Single Video

Attempt to recover a failed video with exponential backoff:

```typescript
import { retryFailedVideo } from '@/lib/videoMonitoring';

const success = await retryFailedVideo(videoId, {
  maxRetries: 3,
  initialDelayMs: 5000,
  maxDelayMs: 300000,
  backoffMultiplier: 2
});

if (success) {
  console.log('Video recovered successfully');
} else {
  console.log('Video still failed after retries');
}
```

**Retry Flow:**
```
Attempt 1 (immediate):
  Check Cloudflare status
  If ready/processing: Update database, return success
  If still error: Record attempt, continue

Wait 5 seconds (5000ms)

Attempt 2:
  Check Cloudflare status again
  If recovered: Update database, return success
  If still error: Record attempt, continue

Wait 10 seconds (10000ms)

Attempt 3 (final):
  Check Cloudflare status
  If recovered: Update database, return success
  If still error: Send admin notification, return failure
```

### Retry All Failed Videos

Batch retry all videos in error state:

```typescript
import { retryAllFailedVideos } from '@/lib/videoMonitoring';

const retriedCount = await retryAllFailedVideos();
console.log(`Successfully retried ${retriedCount} videos`);
```

**Use Cases:**
- Nightly maintenance job
- After Cloudflare service restoration
- Mass recovery after temporary issues

### Track Retry Attempts

View retry history for a video:

```typescript
import { getRetryAttempts } from '@/lib/videoMonitoring';

const attempts = getRetryAttempts(videoId);

attempts.forEach(attempt => {
  console.log(`Attempt ${attempt.attemptNumber}:`);
  console.log(`  Time: ${attempt.attemptedAt}`);
  console.log(`  Success: ${attempt.success}`);
  console.log(`  Error: ${attempt.error || 'N/A'}`);
});
```

**Storage:**
- Currently: In-memory Map (single server)
- Recommended: Redis (multi-server, persistent)

## Admin API

### GET /api/admin/videos/monitor

Retrieve monitoring statistics and stuck videos.

**Request:**
```http
GET /api/admin/videos/monitor?includeStuck=true&stuckThreshold=60
Authorization: Bearer <admin-token>
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalVideos": 150,
    "processing": 5,
    "ready": 140,
    "failed": 3,
    "queued": 2,
    "averageProcessingTime": 8.5
  },
  "stuckVideos": [
    {
      "id": "123e4567-e89b-12d3...",
      "title": "Long Tutorial",
      "status": "inprogress",
      "progress": 45,
      "createdAt": "2025-11-05T10:00:00Z",
      "updatedAt": "2025-11-05T10:45:00Z",
      "cloudflareVideoId": "cf-abc123"
    }
  ]
}
```

### POST /api/admin/videos/monitor

Trigger manual monitoring check for all processing videos.

**Request:**
```http
POST /api/admin/videos/monitor
Authorization: Bearer <admin-token>
Content-Type: application/json

{}
```

**Response:**
```json
{
  "success": true,
  "message": "Checked 5 processing videos",
  "checkedCount": 5,
  "stats": {
    "totalVideos": 150,
    "processing": 3,  // 2 became ready
    "ready": 142,
    "failed": 3,
    "queued": 2,
    "averageProcessingTime": 8.3
  }
}
```

### POST /api/admin/videos/retry

Retry failed video(s) with configurable settings.

**Request (Single Video):**
```http
POST /api/admin/videos/retry
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "videoId": "123e4567-e89b-12d3...",
  "maxRetries": 3
}
```

**Response:**
```json
{
  "success": true,
  "message": "Video 123e4567-e89b-12d3... retry succeeded",
  "videoId": "123e4567-e89b-12d3...",
  "attempts": [
    {
      "videoId": "123e4567-e89b-12d3...",
      "attemptNumber": 1,
      "attemptedAt": "2025-11-05T15:30:00Z",
      "success": true,
      "error": null
    }
  ]
}
```

**Request (All Failed Videos):**
```http
POST /api/admin/videos/retry
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "maxRetries": 3
}
```

**Response:**
```json
{
  "success": true,
  "message": "Retried 2 failed videos",
  "retriedCount": 2
}
```

## Usage Examples

### Example 1: Manual Status Check

Admin wants to check a specific video's processing status:

```typescript
// In admin dashboard component
async function checkVideoStatus(videoId: string) {
  const response = await fetch('/api/admin/videos/monitor', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({})
  });

  const data = await response.json();
  console.log(`Processing: ${data.stats.processing} videos`);
  return data.stats;
}
```

### Example 2: Scheduled Monitoring

Set up cron job for automatic monitoring:

```typescript
// In cron job file
import { monitorProcessingVideos } from '@/lib/videoMonitoring';

// Run every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  try {
    const count = await monitorProcessingVideos();
    console.log(`[Cron] Monitored ${count} videos`);
  } catch (error) {
    console.error('[Cron] Monitoring failed:', error);
  }
});
```

### Example 3: Retry Failed Videos Nightly

Automated retry of failed videos:

```typescript
// In cron job file
import { retryAllFailedVideos } from '@/lib/videoMonitoring';

// Run daily at 2 AM
cron.schedule('0 2 * * *', async () => {
  try {
    const count = await retryAllFailedVideos();
    console.log(`[Cron] Retried ${count} failed videos`);
  } catch (error) {
    console.error('[Cron] Retry failed:', error);
  }
});
```

## Best Practices

### 1. Configure Environment Variables

```bash
# .env
ADMIN_EMAIL=admin@yourdomain.com
CLOUDFLARE_WEBHOOK_SECRET=your_secret_here
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_api_token
```

### 2. Set Up Monitoring Schedule

**Recommended Frequencies:**
- Status monitoring: Every 5 minutes (production)
- Retry failed videos: Every 6 hours or nightly
- Stuck video alerts: Daily

### 3. Monitor Retry Success Rates

Track how often retries succeed:
```sql
SELECT
  COUNT(*) as total_retries,
  SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful
FROM retry_attempts
WHERE attempted_at > NOW() - INTERVAL '7 days';
```

### 4. Handle Email Failures Gracefully

Never let email failures break webhook processing:
```typescript
try {
  await sendVideoReadyEmail(data);
} catch (emailError) {
  logger.warn('Email failed but video updated:', emailError);
  // Continue - video status already updated
}
```

### 5. Use Redis for Production Scale

For multi-server deployments, replace in-memory retry tracking:
```typescript
// Instead of Map
const retryAttempts = new Map<string, RetryAttempt[]>();

// Use Redis
await redis.setJSON(`retry:${videoId}`, attempts);
```

## Troubleshooting

### Issue: Webhook not triggering notifications

**Symptoms:** Videos become ready but no email sent

**Debugging:**
1. Check webhook logs: `grep "Updated video" logs/app.log`
2. Verify ADMIN_EMAIL is set
3. Check email service logs
4. Test webhook manually with curl

**Solution:**
```bash
# Verify webhook secret
curl -X POST http://localhost:4321/api/webhooks/cloudflare \
  -H "Webhook-Signature: test" \
  -d '{"uid":"test123","status":{"state":"ready"}}'
```

### Issue: Videos stuck in processing

**Symptoms:** Videos show "inprogress" for hours

**Debugging:**
1. Check Cloudflare dashboard
2. Run stuck video query
3. Check for API errors

**Solution:**
```typescript
// Get stuck videos
const stuck = await getStuckVideos(60);

// Manually trigger retry
for (const video of stuck) {
  await retryFailedVideo(video.id);
}
```

### Issue: Retry attempts not tracked

**Symptoms:** getRetryAttempts returns empty array

**Cause:** Server restart clears in-memory Map

**Solution:** Implement Redis-based storage:
```typescript
// Store in Redis instead
await redis.setJSON(`retry:${videoId}`, attempts, 86400); // 24hr TTL
```

### Issue: Too many API calls

**Symptoms:** Cloudflare rate limit errors

**Solution:** Increase delays in batch operations:
```typescript
// Change from 100ms to 500ms
await sleep(500); // between API calls
```

## Conclusion

T191 provides comprehensive video transcoding monitoring with:
- ✅ Real-time webhook notifications
- ✅ Email alerts for ready/failed status
- ✅ Intelligent retry with exponential backoff
- ✅ Admin dashboard for manual operations
- ✅ Stuck video detection
- ✅ Monitoring statistics

**Key Takeaways:**
1. Webhooks provide real-time updates (preferred)
2. Monitoring catches missed webhooks (backup)
3. Retries recover transient failures automatically
4. Email notifications keep admins informed
5. Manual controls allow intervention when needed

**Next Steps:**
1. Configure production environment variables
2. Test webhook with sample video upload
3. Set up monitoring cron jobs
4. Monitor retry success rates
5. Consider Redis migration for scale
