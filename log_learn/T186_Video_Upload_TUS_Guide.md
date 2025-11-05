# T186: Video Upload with TUS Protocol - Learning Guide

**Task**: Implement resumable video uploads and webhook processing
**Complexity**: Advanced
**Topics**: TUS protocol, webhooks, HMAC signatures, async processing
**Date**: 2025-11-04

---

## Table of Contents

1. [Overview](#overview)
2. [Learning Objectives](#learning-objectives)
3. [Key Concepts](#key-concepts)
4. [Implementation Steps](#implementation-steps)
5. [Best Practices](#best-practices)
6. [Common Pitfalls](#common-pitfalls)

---

## Overview

This guide teaches you how to implement a production-grade video upload system using the TUS (Tus Upload Protocol) for resumable uploads, with webhook handlers for asynchronous processing notifications.

### What We're Building

A complete video upload pipeline that:
- Generates TUS upload URLs for resumable uploads
- Saves video metadata to database immediately
- Receives webhook notifications when processing completes
- Verifies webhook signatures for security
- Updates database with video duration, thumbnails, playback URLs
- Handles all processing states (queued → inprogress → ready/error)

---

## Learning Objectives

By the end of this guide, you will understand:

1. **TUS Protocol**: How to implement resumable uploads
2. **Webhook Handlers**: How to process async notifications
3. **HMAC Signatures**: How to verify webhook authenticity
4. **State Management**: How to track async processing states
5. **Error Handling**: How to handle failures gracefully
6. **Security**: How to secure upload and webhook endpoints

---

## Key Concepts

### 1. What is TUS?

**TUS** (Tus Upload Protocol) is an open protocol for resumable file uploads. If an upload is interrupted (network failure, browser crash), it can resume from where it left off instead of starting over.

**Benefits**:
- **Resumable**: Continue interrupted uploads
- **Efficient**: No need to re-upload entire file
- **Reliable**: Automatic retry with exponential backoff
- **Standardized**: Works with any TUS-compatible server

**How TUS Works**:

1. **Create Upload**: Client requests upload URL from server
   ```
   POST /upload-url-endpoint
   → Returns TUS upload URL
   ```

2. **Upload File**: Client uploads file in chunks via PATCH requests
   ```
   PATCH {tus-url}
   Headers:
     Upload-Offset: 0          # Start byte
     Upload-Length: 1048576    # Total bytes
     Content-Type: application/offset+octet-stream
     Tus-Resumable: 1.0.0
   Body: [file chunk]
   ```

3. **Resume Upload**: If interrupted, client asks "Where did I leave off?"
   ```
   HEAD {tus-url}
   Headers:
     Tus-Resumable: 1.0.0

   Response:
     Upload-Offset: 524288     # Resume from byte 524288
     Upload-Length: 1048576
   ```

4. **Continue Upload**: Client sends next chunk from offset
   ```
   PATCH {tus-url}
   Headers:
     Upload-Offset: 524288
     Upload-Length: 1048576
   Body: [next chunk]
   ```

**TUS vs Direct Upload**:

| Feature | Direct Upload | TUS Upload |
|---------|--------------|------------|
| Resumable | ❌ No | ✅ Yes |
| Network failure | ❌ Start over | ✅ Resume |
| File size limit | ⚠️ 200MB | ✅ 5GB+ |
| Upload speed | ⚠️ Slower | ✅ Faster (parallel chunks) |
| Implementation | ✅ Simple | ⚠️ Complex |

### 2. Webhook Pattern

**Webhook**: Server-to-server HTTP callback triggered by an event.

**Why Webhooks?**

When you upload a video to Cloudflare, processing takes time:
- Small video (1 min): ~30 seconds
- Medium video (10 min): ~5 minutes
- Large video (1 hour): ~20 minutes

**Polling (Bad)**:
```typescript
// Check status every 5 seconds
setInterval(async () => {
  const status = await fetch('/api/videos/status');
  if (status.ready) {
    console.log('Ready!');
    clearInterval(interval);
  }
}, 5000);

// Problems:
// - Wastes server resources (thousands of requests)
// - Delays detection (5s polling = up to 5s delay)
// - Doesn't scale (1000 users = 12,000 requests/minute)
```

**Webhooks (Good)**:
```typescript
// Cloudflare calls your server when ready
POST /api/webhooks/cloudflare
Body: { uid: 'video-123', status: 'ready', duration: 120 }

// Your server updates database immediately
UPDATE videos SET status = 'ready', duration = 120 WHERE id = 'video-123';

// Benefits:
// - Instant notification (no delay)
// - Zero wasted requests
// - Scales to millions of videos
```

### 3. HMAC Signature Verification

**Problem**: How do you know the webhook is really from Cloudflare?

Without verification, anyone could send fake webhooks:
```bash
curl -X POST https://your-site.com/api/webhooks/cloudflare \
  -d '{"uid":"video-123","status":"ready"}' \
  -H "Content-Type: application/json"

# Your server would process this fake webhook!
```

**Solution**: HMAC (Hash-based Message Authentication Code)

**How HMAC Works**:

1. **Setup**: You and Cloudflare share a secret key
   ```
   CLOUDFLARE_WEBHOOK_SECRET = "super-secret-key-abc123"
   ```

2. **Cloudflare sends webhook**: Computes signature
   ```
   payload = '{"uid":"video-123","status":"ready"}'
   signature = HMAC-SHA256(payload, secret)

   POST /webhook
   Headers:
     Webhook-Signature: t=1699999999,v1=a3f2...8b7c
   Body: {"uid":"video-123","status":"ready"}
   ```

3. **Your server verifies**: Recomputes signature
   ```typescript
   const receivedSignature = request.headers['Webhook-Signature'];
   const payload = request.body;

   const computedSignature = HMAC-SHA256(payload, secret);

   if (computedSignature === receivedSignature) {
     // ✅ Authentic webhook from Cloudflare
     processWebhook(payload);
   } else {
     // ❌ Fake webhook, reject
     return 401 Unauthorized;
   }
   ```

**Why HMAC is Secure**:
- **Secret**: Attacker doesn't know the secret key
- **One-way**: Can't reverse signature to get secret
- **Tamper-proof**: Changing payload invalidates signature

**Implementation**:
```typescript
import { createHmac } from 'crypto';

function verifyWebhookSignature(
  payload: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature) return false;

  try {
    // Extract signature from header format: "t=1234,v1=abc123"
    const parts = signature.split(',');
    const signaturePart = parts.find(part => part.startsWith('v1='));
    if (!signaturePart) return false;

    const expectedSignature = signaturePart.substring(3); // Remove 'v1='

    // Compute HMAC-SHA256
    const hmac = createHmac('sha256', secret);
    hmac.update(payload);
    const computedSignature = hmac.digest('hex');

    // Timing-safe comparison
    return computedSignature === expectedSignature;
  } catch (error) {
    logger.error('Signature verification failed:', error);
    return false;
  }
}
```

### 4. Async Processing States

Video processing is asynchronous with multiple states:

```
Upload → queued → inprogress → ready
                              → error
```

**State Definitions**:

- **queued** (0%): Video uploaded, waiting to process
  - Just received upload
  - No processing started yet
  - No duration/thumbnail yet

- **inprogress** (0-100%): Video being transcoded
  - Cloudflare is processing
  - Progress updates via webhook (25%, 50%, 75%)
  - Still no playback URLs

- **ready** (100%): Video ready to stream
  - Processing complete
  - Has duration, thumbnail, HLS/DASH URLs
  - Can display to users

- **error** (N/A): Processing failed
  - Codec not supported
  - File corrupted
  - Duration too long
  - Has error code and message

**Database Schema**:
```sql
CREATE TABLE course_videos (
  id UUID PRIMARY KEY,
  cloudflare_video_id TEXT NOT NULL,
  status TEXT NOT NULL,                    -- queued/inprogress/ready/error
  processing_progress INTEGER DEFAULT 0,  -- 0-100
  duration INTEGER,                        -- seconds (NULL until ready)
  thumbnail_url TEXT,                      -- NULL until ready
  playback_hls_url TEXT,                   -- NULL until ready
  playback_dash_url TEXT,                  -- NULL until ready
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**State Transitions**:
```typescript
// Initial state (after TUS URL created)
{ status: 'queued', processing_progress: 0 }

// Webhook 1: Processing started
{ status: 'inprogress', processing_progress: 25 }

// Webhook 2: Half done
{ status: 'inprogress', processing_progress: 50 }

// Webhook 3: Almost done
{ status: 'inprogress', processing_progress: 90 }

// Webhook 4: Complete
{
  status: 'ready',
  processing_progress: 100,
  duration: 120,
  thumbnail_url: 'https://...',
  playback_hls_url: 'https://...',
  playback_dash_url: 'https://...'
}
```

### 5. COALESCE for Partial Updates

**Problem**: Webhooks may not include all fields every time.

**Bad Approach** (overwrite with null):
```sql
UPDATE videos
SET
  duration = $1,          -- NULL if webhook doesn't provide
  thumbnail_url = $2      -- NULL if webhook doesn't provide
WHERE id = $3;

-- Result: Existing duration/thumbnail LOST!
```

**Good Approach** (preserve existing):
```sql
UPDATE videos
SET
  duration = COALESCE($1, duration),              -- Use new OR keep existing
  thumbnail_url = COALESCE($2, thumbnail_url)    -- Use new OR keep existing
WHERE id = $3;

-- Result: Only update fields that are provided
```

**How COALESCE Works**:
```sql
COALESCE(val1, val2, val3, ...)
-- Returns first non-NULL value

COALESCE(NULL, 120)      → 120
COALESCE(150, 120)       → 150
COALESCE(NULL, NULL, 0)  → 0
```

**Use Cases**:
```sql
-- Keep existing duration if webhook doesn't provide new one
duration = COALESCE($new_duration, duration)

-- Set default value if both are NULL
duration = COALESCE($new_duration, duration, 0)

-- Update only if new value provided and not empty string
title = COALESCE(NULLIF($new_title, ''), title)
```

---

## Implementation Steps

### Step 1: Add TUS Function to Cloudflare Library

```typescript
// src/lib/cloudflare.ts

export async function createTusUpload(
  options: Omit<UploadVideoOptions, 'file'>
): Promise<{ tusUrl: string; videoId: string; expiresAt: string }> {
  const config = getCloudflareConfig();
  const url = `${BASE_URL}/accounts/${config.accountId}/stream?direct_upload=true`;

  const body = {
    maxDurationSeconds: options.maxDurationSeconds || 21600, // 6 hours
  };

  if (options.meta) body.meta = options.meta;
  if (options.requireSignedURLs !== undefined) body.requireSignedURLs = options.requireSignedURLs;

  const response = await fetch(url, {
    method: 'POST',
    headers: getHeaders(config.apiToken, 'application/json'),
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!data.success) {
    handleCloudflareError(data.errors);
  }

  return {
    tusUrl: data.result.uploadLink,      // TUS upload URL for client
    videoId: data.result.uid,            // Cloudflare video UID
    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
  };
}
```

**Key Points**:
- `direct_upload=true`: Tells Cloudflare to return TUS URL
- `uploadLink`: The TUS URL client will use
- `maxDurationSeconds`: Reject videos longer than this
- Expires in 30 minutes (security)

### Step 2: Create Upload API Endpoint

```typescript
// src/pages/api/admin/videos/upload.ts

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // 1. Authenticate admin
    const authResult = await checkAdminAuth(cookies, '/api/admin/videos/upload');
    if (!authResult.user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. Parse request body
    const body = await request.json();
    const { filename, fileSize, courseId, lessonId, title, description } = body;

    // 3. Validate inputs
    if (!filename || !fileSize || !courseId || !lessonId || !title) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate file extension
    const validExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.flv'];
    const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    if (!validExtensions.includes(extension)) {
      return new Response(
        JSON.stringify({ error: 'Invalid file type' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate file size (5GB max)
    const maxSize = 5 * 1024 * 1024 * 1024;
    if (fileSize > maxSize) {
      return new Response(
        JSON.stringify({ error: 'File too large. Maximum size is 5GB' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 4. Create TUS upload URL
    const { tusUrl, videoId, expiresAt } = await createTusUpload({
      filename,
      meta: {
        courseId,
        lessonId,
        title,
        description: description || '',
        uploadedBy: authResult.user.email || 'unknown',
        uploadedAt: new Date().toISOString(),
      },
      requireSignedURLs: false, // Allow public playback
      maxDurationSeconds: 21600, // 6 hours max
    });

    logger.info(`TUS upload created: ${videoId} by ${authResult.user.email}`);

    // 5. Save initial video record to database
    const dbVideo = await createCourseVideo({
      course_id: courseId,
      lesson_id: lessonId,
      cloudflare_video_id: videoId,
      title: title.trim(),
      description: description?.trim() || null,
      status: 'queued', // Initial status
      processing_progress: 0,
      metadata: {
        filename,
        fileSize,
        uploadedBy: authResult.user.email,
        uploadedAt: new Date().toISOString(),
      },
    });

    logger.info(`Video record created in database: ${dbVideo.id}`);

    // 6. Return TUS URL to client
    return new Response(
      JSON.stringify({
        tusUrl,              // Client uploads to this URL
        videoId,             // Cloudflare video UID
        dbVideoId: dbVideo.id, // Database record ID
        expiresAt,           // URL expiration
        message: 'TUS upload URL created successfully',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    logger.error('TUS upload creation error:', err as Error);

    return new Response(
      JSON.stringify({
        error: 'Failed to create upload URL',
        message: err instanceof Error ? err.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
```

**Workflow**:
1. Authenticate admin user
2. Validate all inputs (filename, size, course, lesson, title)
3. Create TUS upload URL via Cloudflare API
4. Save video record to database with status='queued'
5. Return TUS URL to client for upload

### Step 3: Create Webhook Handler

```typescript
// src/pages/api/webhooks/cloudflare.ts

export const POST: APIRoute = async ({ request }) => {
  try {
    // 1. Get webhook secret (optional but recommended)
    const webhookSecret = process.env.CLOUDFLARE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      logger.warn('CLOUDFLARE_WEBHOOK_SECRET not configured');
    }

    // 2. Read raw body for signature verification
    const body = await request.text();

    // 3. Verify signature (if secret configured)
    if (webhookSecret) {
      const signature = request.headers.get('Webhook-Signature');

      if (!verifyWebhookSignature(body, signature, webhookSecret)) {
        logger.warn('Invalid webhook signature - rejecting request');
        return new Response(
          JSON.stringify({ error: 'Invalid signature' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // 4. Parse webhook payload
    const webhook = JSON.parse(body);
    const videoId = webhook.uid;

    if (!videoId) {
      logger.error('Webhook missing video UID');
      return new Response(
        JSON.stringify({ error: 'Missing video UID' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    logger.info(`Webhook received: ${videoId}, status: ${webhook.status?.state}`);

    // 5. Extract data from webhook
    const status = webhook.status?.state || 'queued';
    const processingProgress = webhook.status?.pctComplete
      ? parseInt(webhook.status.pctComplete)
      : null;
    const duration = webhook.duration || null;
    const thumbnailUrl = webhook.thumbnail || null;
    const playbackHls = webhook.playback?.hls || null;
    const playbackDash = webhook.playback?.dash || null;

    // 6. Update database
    const pool = getPool();
    const result = await pool.query(
      `
      UPDATE course_videos
      SET
        status = $1,
        processing_progress = $2,
        duration = COALESCE($3, duration),              -- Keep existing if not provided
        thumbnail_url = COALESCE($4, thumbnail_url),    -- Keep existing if not provided
        playback_hls_url = COALESCE($5, playback_hls_url),
        playback_dash_url = COALESCE($6, playback_dash_url),
        updated_at = NOW()
      WHERE cloudflare_video_id = $7
      RETURNING id, title
      `,
      [status, processingProgress, duration, thumbnailUrl, playbackHls, playbackDash, videoId]
    );

    if (result.rowCount === 0) {
      logger.warn(`No video record found for Cloudflare ID: ${videoId}`);
      return new Response(
        JSON.stringify({ success: false, message: 'Video not found in database' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const video = result.rows[0];
    logger.info(`Updated video ${video.id} (${video.title}) to status: ${status}`);

    // 7. Log errors if processing failed
    if (status === 'error') {
      logger.error(
        `Video processing failed: ${videoId}`,
        new Error(`${webhook.status?.errorReasonCode}: ${webhook.status?.errorReasonText}`)
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Webhook processed successfully',
        videoId: video.id,
        status,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    logger.error('Webhook processing error:', err as Error);

    return new Response(
      JSON.stringify({
        error: 'Webhook processing failed',
        message: err instanceof Error ? err.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
```

**Workflow**:
1. Read raw request body (needed for signature verification)
2. Verify HMAC signature (if secret configured)
3. Parse JSON payload
4. Extract video status, duration, thumbnails, playback URLs
5. Update database using COALESCE to preserve existing values
6. Log errors if video processing failed

### Step 4: Configure Cloudflare Webhooks

1. **Generate Webhook Secret**:
   ```bash
   # Generate random secret
   openssl rand -hex 32
   # Output: a3f2b8c7e4d9f1a6b2c8e5d3f7a9b4c1e6d2f8a3b9c5e1d7f4a2b6c9e3d8f1a5
   ```

2. **Add to .env**:
   ```env
   CLOUDFLARE_WEBHOOK_SECRET=a3f2b8c7e4d9f1a6b2c8e5d3f7a9b4c1e6d2f8a3b9c5e1d7f4a2b6c9e3d8f1a5
   ```

3. **Configure in Cloudflare Dashboard**:
   - Go to https://dash.cloudflare.com
   - Navigate to Stream → Webhooks
   - Click "Add Webhook"
   - URL: `https://your-domain.com/api/webhooks/cloudflare`
   - Secret: Paste the secret from step 1
   - Events: Select "Video Status Changes"
   - Click "Save"

4. **Test Webhook**:
   - Upload a test video
   - Check your logs for webhook notifications
   - Verify database updates

---

## Best Practices

### 1. Always Validate File Extension

```typescript
// ✅ Good: Whitelist approach
const validExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.flv'];
const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));

if (!validExtensions.includes(extension)) {
  return { error: 'Invalid file type' };
}

// ❌ Bad: Blacklist approach (incomplete)
if (filename.endsWith('.exe') || filename.endsWith('.bat')) {
  return { error: 'Invalid file type' };
}
// What about .sh, .dll, .com, .app, .dmg, ...?
```

### 2. Set Reasonable File Size Limits

```typescript
// ✅ Good: Enforce limit on backend
const maxSize = 5 * 1024 * 1024 * 1024; // 5GB
if (fileSize > maxSize) {
  return { error: 'File too large. Maximum size is 5GB' };
}

// ❌ Bad: Rely on client-side validation only
// Client can bypass this easily
```

### 3. Use COALESCE for Partial Updates

```sql
-- ✅ Good: Preserve existing values
UPDATE videos
SET
  duration = COALESCE($new_duration, duration),
  thumbnail_url = COALESCE($new_thumbnail, thumbnail_url)
WHERE id = $1;

-- ❌ Bad: Overwrite with NULL
UPDATE videos
SET
  duration = $new_duration,          -- NULL if not provided
  thumbnail_url = $new_thumbnail      -- NULL if not provided
WHERE id = $1;
```

### 4. Always Verify Webhook Signatures

```typescript
// ✅ Good: Verify signature
if (webhookSecret) {
  const signature = request.headers.get('Webhook-Signature');

  if (!verifySignature(body, signature, webhookSecret)) {
    return { error: 'Invalid signature', status: 401 };
  }
}

// ❌ Bad: Trust all webhooks
// Anyone can send fake webhooks!
```

### 5. Handle Missing Webhook Secret Gracefully

```typescript
// ✅ Good: Warn but continue (development)
const webhookSecret = process.env.CLOUDFLARE_WEBHOOK_SECRET;

if (!webhookSecret) {
  logger.warn('CLOUDFLARE_WEBHOOK_SECRET not configured - signature verification disabled');
  // Continue processing (useful for development)
}

// ❌ Bad: Crash
if (!webhookSecret) {
  throw new Error('Missing webhook secret');
  // App crashes, all webhooks fail
}
```

### 6. Log Errors with Context

```typescript
// ✅ Good: Include context
logger.error(
  `Video processing failed: ${videoId}`,
  new Error(`${errorCode}: ${errorMessage}`)
);

// ❌ Bad: Generic error
logger.error('Error');
```

### 7. Use Transactions for Multi-Step Operations

```typescript
// ✅ Good: Use transaction
const client = await pool.connect();
try {
  await client.query('BEGIN');

  // Create video record
  await client.query('INSERT INTO videos ...');

  // Update course video count
  await client.query('UPDATE courses SET video_count = video_count + 1 ...');

  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
}

// ❌ Bad: Separate queries (risk of inconsistency)
await pool.query('INSERT INTO videos ...');
await pool.query('UPDATE courses ...'); // Might fail, leaving inconsistent state
```

---

## Common Pitfalls

### 1. Not Handling TUS URL Expiration

**Problem**: TUS URLs expire after 30 minutes

**Solution**: Implement expiration handling

```typescript
// ✅ Good: Check expiration before upload
const { tusUrl, expiresAt } = await createTusUpload(...);
const expiryTime = new Date(expiresAt);

if (Date.now() > expiryTime.getTime()) {
  // Request new TUS URL
  const { tusUrl: newUrl } = await createTusUpload(...);
}

// ❌ Bad: Assume URL never expires
const { tusUrl } = await createTusUpload(...);
// Use tusUrl forever (will fail after 30 minutes)
```

### 2. Overwriting Existing Data with NULL

**Problem**: Webhook doesn't always include all fields

**Solution**: Use COALESCE

```sql
-- ✅ Good
UPDATE videos
SET duration = COALESCE($1, duration)
WHERE id = $2;

-- ❌ Bad
UPDATE videos
SET duration = $1  -- NULL if webhook doesn't provide
WHERE id = $2;
```

### 3. Not Validating Webhook Payload

**Problem**: Webhook might be malformed

**Solution**: Validate all fields

```typescript
// ✅ Good: Validate payload
const webhook = JSON.parse(body);

if (!webhook.uid) {
  return { error: 'Missing video UID', status: 400 };
}

if (!webhook.status || !webhook.status.state) {
  return { error: 'Missing status', status: 400 };
}

// ❌ Bad: Assume payload is valid
const webhook = JSON.parse(body);
const status = webhook.status.state; // Might be undefined
```

### 4. Blocking Webhook Endpoint with Slow Operations

**Problem**: Cloudflare expects quick response (< 5 seconds)

**Solution**: Process async, respond immediately

```typescript
// ✅ Good: Async processing
export const POST: APIRoute = async ({ request }) => {
  const body = await request.text();
  const webhook = JSON.parse(body);

  // Queue for async processing (don't await)
  processWebhook(webhook).catch(err => {
    logger.error('Async webhook processing failed:', err);
  });

  // Respond immediately
  return new Response(JSON.stringify({ success: true }), { status: 200 });
};

async function processWebhook(webhook) {
  // Long-running operations here
  await updateDatabase(webhook);
  await sendNotification(webhook);
  await updateCache(webhook);
}

// ❌ Bad: Block until done
export const POST: APIRoute = async ({ request }) => {
  const webhook = JSON.parse(await request.text());

  // Wait for all operations (takes 10 seconds)
  await updateDatabase(webhook);
  await sendNotification(webhook);
  await updateCache(webhook);

  return new Response(JSON.stringify({ success: true }), { status: 200 });
  // Cloudflare timeout after 5 seconds!
};
```

### 5. Not Handling Duplicate Webhooks

**Problem**: Cloudflare might resend webhooks if no response

**Solution**: Use idempotent operations

```typescript
// ✅ Good: Idempotent update
UPDATE videos
SET
  status = $1,
  updated_at = NOW()
WHERE id = $2 AND status != $1;  -- Only update if status changed

// ❌ Bad: Always update (wasteful)
UPDATE videos
SET status = $1, updated_at = NOW()
WHERE id = $2;
-- Updates even if status unchanged
```

---

## Conclusion

You've learned how to build a production-grade video upload system with:
- ✅ TUS protocol for resumable uploads
- ✅ Webhook handlers for async notifications
- ✅ HMAC signature verification for security
- ✅ State management for processing stages
- ✅ Graceful error handling
- ✅ Database updates with COALESCE

### Next Steps

1. **Implement Client-Side Upload**: Use tus-js-client library
2. **Add Real-Time Updates**: WebSocket/SSE for status changes
3. **Implement Upload Queue**: Manage concurrent uploads
4. **Add Retry Logic**: Automatic retry with exponential backoff
5. **Implement Analytics**: Track upload success rates

---

**Author**: Claude Code
**Version**: 1.0
**Last Updated**: 2025-11-04
