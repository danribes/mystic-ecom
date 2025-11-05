# T181: Cloudflare Stream API Integration - Learning Guide

**Task**: Setup Cloudflare Stream API integration
**Difficulty**: Intermediate
**Topics**: Video Streaming, Cloud Storage, API Integration
**Date**: November 4, 2025

---

## Table of Contents

1. [Introduction to Video Streaming](#introduction-to-video-streaming)
2. [Why Cloudflare Stream?](#why-cloudflare-stream)
3. [Core Concepts](#core-concepts)
4. [Video Streaming Protocols](#video-streaming-protocols)
5. [Implementation Deep Dive](#implementation-deep-dive)
6. [Using the Cloudflare Client](#using-the-cloudflare-client)
7. [Best Practices](#best-practices)
8. [Common Pitfalls](#common-pitfalls)
9. [Performance Optimization](#performance-optimization)
10. [Troubleshooting](#troubleshooting)

---

## Introduction to Video Streaming

### What is Video Streaming?

**Video Streaming** is the continuous transmission of video data from a server to a client, allowing playback to begin before the entire file is downloaded.

**Key Difference from Download**:

```
Download:
1. Entire file downloaded
2. Wait for 100% complete
3. Then play video

Streaming:
1. Start playing immediately
2. Download while watching
3. Adaptive quality based on connection
```

### Types of Streaming

**1. On-Demand Streaming (VOD)**:
- User requests video, starts playback
- Example: YouTube, Netflix, our course videos

**2. Live Streaming**:
- Real-time broadcast
- Example: Live classes, webinars

**3. Progressive Download**:
- Hybrid approach, file downloaded but playback can start early
- Example: Basic HTML5 video tag

---

## Why Cloudflare Stream?

### Problem: Self-Hosted Video Challenges

**1. Storage Costs**:
```
100 videos × 500MB each = 50GB storage
Monthly cost: $5-50 depending on provider
```

**2. Bandwidth Costs**:
```
1000 users × 100 videos × 500MB = 50TB bandwidth
Monthly cost: $1000-5000 depending on provider
```

**3. Transcoding Complexity**:
```
Need multiple formats:
- MP4 for browsers
- WebM for Firefox
- Different resolutions (1080p, 720p, 480p, 360p)
- Mobile optimized versions
```

**4. CDN Configuration**:
```
Without CDN:
- Slow for international users
- Single point of failure
- Limited bandwidth

With CDN:
- Fast globally
- Distributed load
- Expensive to set up
```

### Solution: Cloudflare Stream

Cloudflare Stream handles ALL of the above:

✅ **Storage**: Flat fee per minute stored
✅ **Bandwidth**: Included with no limits
✅ **Transcoding**: Automatic (1080p → all formats)
✅ **CDN**: Global delivery included
✅ **Adaptive Streaming**: Automatic quality adjustment
✅ **Security**: Built-in DRM and signed URLs

### Pricing Model

**Simple Pricing**:
```
Storage: $5 per 1,000 minutes stored/month
Delivery: $1 per 1,000 minutes delivered/month

Example:
100 videos × 10 minutes = 1,000 minutes
Cost: $5/month storage + delivery costs
```

Compare to self-hosting:
```
Storage (50GB): $10/month
Bandwidth (50TB): $5,000/month
Total: $5,010/month

Cloudflare Stream: ~$50/month
Savings: 99%!
```

---

## Core Concepts

### 1. Video Lifecycle

```
Upload → Transcode → Store → Deliver
  ↓         ↓         ↓         ↓
Queued  Inprogress Ready   Streaming
```

#### State Diagram

```
[Upload Complete]
      │
      ▼
  [QUEUED]
      │
      ▼
[INPROGRESS] ←─── (Transcoding)
      │
      ├──→ [READY] ──→ (Available for playback)
      │
      └──→ [ERROR] ──→ (Failed, needs retry)
```

### 2. Video Formats

#### Input Formats (What you upload)

```
Supported:
- MP4, MOV, MKV, AVI, FLV, MPEG-2 TS
- WebM, MPG, 3GP, WMV

Recommended:
- MP4 with H.264 codec (best compatibility)
```

#### Output Formats (What users get)

Cloudflare automatically generates:

```
1. HLS (HTTP Live Streaming)
   - Format: .m3u8 playlist
   - Browser: Safari, iOS, modern browsers
   - Adaptive: Yes

2. DASH (Dynamic Adaptive Streaming)
   - Format: .mpd manifest
   - Browser: Chrome, Firefox, Edge
   - Adaptive: Yes
```

### 3. Adaptive Bitrate Streaming (ABR)

**How it works**:

```
User's Connection: Fast
  ↓
Select: 1080p @ 8Mbps
  ↓
Connection slows down
  ↓
Switch to: 720p @ 4Mbps (no buffering!)
  ↓
Connection improves
  ↓
Switch back: 1080p @ 8Mbps
```

**Without ABR**:
```
User's Connection: Slow
  ↓
Trying to load: 1080p @ 8Mbps
  ↓
Result: Buffering... buffering... buffering...
```

### 4. CDN (Content Delivery Network)

**How CDN Works**:

```
Without CDN:
User in Tokyo → Server in New York
Distance: 6,700 miles
Latency: 200ms

With CDN:
User in Tokyo → Edge server in Tokyo
Distance: 10 miles
Latency: 10ms
```

**Cloudflare's Network**:
- 300+ data centers worldwide
- Automatic routing to nearest location
- 95% of world's internet users within 50ms

---

## Video Streaming Protocols

### HLS (HTTP Live Streaming)

**Developed by**: Apple
**File Format**: .m3u8 (playlist) + .ts (video segments)

**How it works**:

```
1. Master Playlist (index.m3u8):
   - Lists available qualities
   - Points to quality playlists

2. Quality Playlists (720p.m3u8):
   - Lists video segments
   - Each segment is 2-10 seconds

3. Video Segments (segment001.ts):
   - Small video chunks
   - Downloaded on demand
```

**Example Playlist**:
```m3u8
#EXTM3U
#EXT-X-VERSION:3
#EXT-X-STREAM-INF:BANDWIDTH=2000000,RESOLUTION=1920x1080
1080p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=1000000,RESOLUTION=1280x720
720p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=500000,RESOLUTION=854x480
480p.m3u8
```

**Pros**:
- ✅ Works in all browsers (via hls.js)
- ✅ Native iOS/Safari support
- ✅ Adaptive bitrate
- ✅ Industry standard

**Cons**:
- ❌ Slightly higher latency (10-30 seconds)
- ❌ More HTTP requests (one per segment)

### DASH (Dynamic Adaptive Streaming over HTTP)

**Developed by**: MPEG
**File Format**: .mpd (manifest) + .m4s (segments)

**How it works**:

```
1. MPD Manifest (manifest.mpd):
   - XML file
   - Lists available qualities
   - Lists segments

2. Init Segment (init.m4s):
   - Initialization data
   - Downloaded once

3. Media Segments (segment001.m4s):
   - Video chunks
   - Downloaded on demand
```

**Pros**:
- ✅ Open standard
- ✅ Better compression (10-20% smaller)
- ✅ Lower latency than HLS
- ✅ More efficient

**Cons**:
- ❌ Not native in Safari (needs dash.js)
- ❌ More complex implementation

### Which to Use?

**Our Recommendation**: HLS

```
Reasons:
1. Native iOS support (huge mobile market)
2. Better browser compatibility
3. Simpler to implement
4. Industry standard for VOD
```

**When to use DASH**:
- Live streaming (lower latency)
- Android-only audience
- Need smallest file sizes

---

## Implementation Deep Dive

### Architecture

```
┌─────────────────────────────────────────────────┐
│           Your Application                       │
│  (Spirituality Platform)                         │
└───────────────┬─────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────┐
│     src/lib/cloudflare.ts                        │
│  (Our API Client)                                │
│  - uploadVideo()                                 │
│  - getVideo()                                    │
│  - listVideos()                                  │
│  - deleteVideo()                                 │
└───────────────┬─────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────┐
│   Cloudflare Stream API                          │
│  (api.cloudflare.com)                            │
│  - Receives uploads                              │
│  - Transcodes videos                             │
│  - Returns metadata                              │
└───────────────┬─────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────┐
│   Cloudflare CDN                                 │
│  (videodelivery.net)                             │
│  - Stores transcoded videos                      │
│  - Delivers to users globally                    │
│  - Handles adaptive streaming                    │
└─────────────────────────────────────────────────┘
```

### Upload Process

**Step-by-Step**:

```typescript
// 1. User selects video file
const fileInput = document.getElementById('video-upload');
const file = fileInput.files[0];

// 2. Read file as Buffer (Node.js) or use File directly (browser)
const buffer = await file.arrayBuffer();

// 3. Call uploadVideo with metadata
const video = await uploadVideo({
  file: Buffer.from(buffer),
  filename: 'meditation-intro.mp4',
  meta: {
    courseId: '123',
    lessonId: '456',
    title: 'Introduction to Meditation',
    instructor: 'John Doe'
  },
  requireSignedURLs: true, // Require authentication to view
  thumbnailTimestampPct: 0.1 // Thumbnail from 10% into video
});

// 4. Video is now uploaded, get UID
console.log('Video uploaded:', video.uid);
// Output: "abc123def456"

// 5. Video enters transcoding queue
console.log('Status:', video.status.state);
// Output: "queued"
```

**What Happens Behind the Scenes**:

```
1. File uploaded to Cloudflare
   └─ Uses multipart/form-data
   └─ Shows progress (optional)

2. Cloudflare receives file
   └─ Validates format
   └─ Generates unique UID
   └─ Returns metadata

3. Video enters queue
   └─ State: "queued"
   └─ Wait time: 0-60 seconds

4. Transcoding begins
   └─ State: "inprogress"
   └─ Progress: 0% → 100%
   └─ Time: 1-10 minutes depending on length

5. Transcoding complete
   └─ State: "ready"
   └─ Playback URLs available
   └─ Thumbnails generated
```

### Checking Processing Status

**Polling Pattern**:

```typescript
async function waitForVideoReady(videoId: string): Promise<void> {
  console.log('Waiting for video to be ready...');

  while (true) {
    // Get current status
    const status = await getVideoStatus(videoId);

    console.log(`Progress: ${status.percentComplete}%`);

    // Check if ready
    if (status.state === 'ready') {
      console.log('Video is ready!');
      break;
    }

    // Check if failed
    if (status.state === 'error') {
      throw new Error(`Transcoding failed: ${status.errorMessage}`);
    }

    // Wait 5 seconds before checking again
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
}

// Usage
try {
  await waitForVideoReady('abc123');

  const playback = await getVideoPlaybackInfo('abc123');
  console.log('HLS URL:', playback.hlsUrl);
} catch (error) {
  console.error('Error:', error.message);
}
```

**Better Pattern with Exponential Backoff**:

```typescript
async function waitForVideoReady(
  videoId: string,
  maxAttempts = 60, // Max 5 minutes (60 × 5 seconds)
  initialDelay = 5000 // Start with 5 seconds
): Promise<void> {
  let attempts = 0;
  let delay = initialDelay;

  while (attempts < maxAttempts) {
    const status = await getVideoStatus(videoId);

    if (status.state === 'ready') {
      console.log('✅ Video is ready!');
      return;
    }

    if (status.state === 'error') {
      throw new Error(`❌ Transcoding failed: ${status.errorMessage}`);
    }

    console.log(`⏳ Processing: ${status.percentComplete}% (attempt ${attempts + 1}/${maxAttempts})`);

    await new Promise(resolve => setTimeout(resolve, delay));

    // Exponential backoff: 5s → 10s → 15s → 20s → max 30s
    delay = Math.min(delay + 5000, 30000);
    attempts++;
  }

  throw new Error('Timeout: Video processing took too long');
}
```

### Getting Playback URLs

```typescript
const playback = await getVideoPlaybackInfo('abc123');

// Ready to play?
if (playback.ready) {
  console.log('HLS URL:', playback.hlsUrl);
  // https://videodelivery.net/abc123/manifest/video.m3u8

  console.log('DASH URL:', playback.dashUrl);
  // https://videodelivery.net/abc123/manifest/video.mpd

  console.log('Thumbnail:', playback.thumbnailUrl);
  // https://videodelivery.net/abc123/thumbnails/thumbnail.jpg

  console.log('Duration:', playback.duration, 'seconds');
  // 300 seconds (5 minutes)
} else {
  console.log('Video is still processing');
}
```

---

## Using the Cloudflare Client

### Setup

**1. Install Dependencies** (already done):

```bash
npm install
```

**2. Get Cloudflare Credentials**:

```bash
# A. Get Account ID
1. Log in to https://dash.cloudflare.com/
2. Navigate to Stream section
3. Copy Account ID from URL:
   https://dash.cloudflare.com/{ACCOUNT_ID}/stream

# B. Create API Token
1. Go to Profile → API Tokens
2. Click "Create Token"
3. Select "Stream: Edit" permission
4. Click "Continue to summary"
5. Click "Create Token"
6. Copy the token (only shown once!)
```

**3. Configure Environment**:

```bash
# .env
CLOUDFLARE_ACCOUNT_ID=abc123def456
CLOUDFLARE_API_TOKEN=your_secret_token_here
```

**4. Test Configuration**:

```typescript
import { getCloudflareConfig } from '@/lib/cloudflare';

try {
  const config = getCloudflareConfig();
  console.log('✅ Cloudflare configured:', config.accountId);
} catch (error) {
  console.error('❌ Configuration error:', error.message);
}
```

### Basic Usage

#### Upload a Video

```typescript
import { uploadVideo } from '@/lib/cloudflare';
import fs from 'fs';

// Read video file
const buffer = fs.readFileSync('/path/to/video.mp4');

// Upload
const video = await uploadVideo({
  file: buffer,
  filename: 'course-intro.mp4',
  meta: {
    courseId: '123',
    title: 'Course Introduction'
  }
});

console.log('Video ID:', video.uid);
```

#### Get Video Information

```typescript
import { getVideo } from '@/lib/cloudflare';

const video = await getVideo('abc123');

console.log('Title:', video.meta?.title);
console.log('Status:', video.status.state);
console.log('Duration:', video.duration, 'seconds');
```

#### List All Videos

```typescript
import { listVideos } from '@/lib/cloudflare';

// Get first 50 videos
const result = await listVideos({ limit: 50 });

console.log(`Found ${result.total} videos`);

result.result.forEach(video => {
  console.log(`- ${video.meta?.title} (${video.uid})`);
});
```

#### Delete a Video

```typescript
import { deleteVideo } from '@/lib/cloudflare';

const deleted = await deleteVideo('abc123');

if (deleted) {
  console.log('✅ Video deleted');
} else {
  console.log('❌ Failed to delete');
}
```

### Advanced Usage

#### Secure Videos with Signed URLs

```typescript
const video = await uploadVideo({
  file: buffer,
  filename: 'premium-course.mp4',
  requireSignedURLs: true // Users must authenticate to watch
});

// When serving to users, generate signed URL
// (Signing implementation in T186)
```

#### Restrict by Origin

```typescript
const video = await uploadVideo({
  file: buffer,
  filename: 'course.mp4',
  allowedOrigins: [
    'https://yourdomain.com',
    'https://app.yourdomain.com'
  ]
});

// Video can only be embedded on these domains
```

#### Custom Thumbnail

```typescript
const video = await uploadVideo({
  file: buffer,
  filename: 'course.mp4',
  thumbnailTimestampPct: 0.25 // Thumbnail from 25% into video
});

// Get thumbnail at different times
const thumb1 = generateThumbnailUrl(video.uid, 0.5); // 50%
const thumb2 = generateThumbnailUrl(video.uid, 30); // 30 seconds in
```

#### Watermark

```typescript
// First, upload a watermark image (done via Cloudflare dashboard)
const watermarkUid = 'watermark123';

const video = await uploadVideo({
  file: buffer,
  filename: 'course.mp4',
  watermarkUid // Apply watermark to video
});
```

---

## Best Practices

### 1. Always Check Processing Status

```typescript
// ❌ Bad: Assume video is ready immediately
const video = await uploadVideo({ file, filename: 'test.mp4' });
const playback = await getVideoPlaybackInfo(video.uid);
// playback.ready will be false!

// ✅ Good: Wait for processing
const video = await uploadVideo({ file, filename: 'test.mp4' });
await waitForVideoReady(video.uid);
const playback = await getVideoPlaybackInfo(video.uid);
// playback.ready will be true
```

### 2. Store Video IDs in Database

```typescript
// ✅ Good: Store Cloudflare video UID
await db.query(`
  UPDATE lessons
  SET cloudflare_video_id = $1, video_status = 'processing'
  WHERE id = $2
`, [video.uid, lessonId]);

// Later, when video is ready
await db.query(`
  UPDATE lessons
  SET video_status = 'ready', video_duration = $1
  WHERE cloudflare_video_id = $2
`, [video.duration, video.uid]);
```

### 3. Add Metadata for Searching

```typescript
// ✅ Good: Rich metadata
const video = await uploadVideo({
  file: buffer,
  filename: 'meditation-basics.mp4',
  meta: {
    courseId: '123',
    lessonId: '456',
    title: 'Meditation Basics',
    instructor: 'John Doe',
    category: 'Meditation',
    level: 'Beginner',
    uploadDate: new Date().toISOString()
  }
});

// Later, search by metadata
const results = await listVideos({
  search: 'meditation',
  status: 'ready'
});
```

### 4. Handle Errors Gracefully

```typescript
try {
  const video = await uploadVideo({ file, filename: 'test.mp4' });
} catch (error) {
  if (error.message.includes('Rate limit')) {
    // Show user-friendly message
    console.log('Too many uploads. Please try again in a few minutes.');
  } else if (error.message.includes('Invalid file format')) {
    console.log('Unsupported video format. Please use MP4, MOV, or WebM.');
  } else if (error.message.includes('Network error')) {
    console.log('Network error. Please check your connection.');
  } else {
    console.log('Upload failed. Please try again.');
  }

  // Log full error for debugging
  console.error('Upload error:', error);
}
```

### 5. Optimize Video Before Upload

```bash
# Use FFmpeg to optimize video
ffmpeg -i input.mov \
  -c:v libx264 \
  -preset slow \
  -crf 22 \
  -c:a aac \
  -b:a 128k \
  -movflags +faststart \
  output.mp4

# Flags explained:
# -c:v libx264: Use H.264 codec (best compatibility)
# -preset slow: Better compression (slower encode)
# -crf 22: Quality level (18-28, lower = better quality)
# -c:a aac: AAC audio codec
# -b:a 128k: Audio bitrate
# -movflags +faststart: Optimize for streaming
```

### 6. Use HLS for Better Compatibility

```typescript
// ✅ Good: Use HLS by default
const hlsUrl = generatePlaybackUrl(videoId, 'hls');

// Only use DASH if needed
const dashUrl = generatePlaybackUrl(videoId, 'dash');
```

---

## Common Pitfalls

### Pitfall 1: Not Waiting for Processing

```typescript
// ❌ Bad
const video = await uploadVideo({ file, filename: 'test.mp4' });
// Immediately try to play
videoPlayer.src = video.playback?.hls; // undefined!

// ✅ Good
const video = await uploadVideo({ file, filename: 'test.mp4' });
await waitForVideoReady(video.uid);
const playback = await getVideoPlaybackInfo(video.uid);
videoPlayer.src = playback.hlsUrl;
```

### Pitfall 2: Forgetting to Delete Old Videos

```typescript
// ❌ Bad: Videos accumulate, increasing costs
await uploadVideo({ file, filename: 'new-version.mp4' });

// ✅ Good: Delete old version
if (lesson.oldVideoId) {
  await deleteVideo(lesson.oldVideoId);
}
const video = await uploadVideo({ file, filename: 'new-version.mp4' });
```

### Pitfall 3: Large File Uploads Without Progress

```typescript
// ❌ Bad: No progress indicator
await uploadVideo({ file: largeFile, filename: 'test.mp4' });
// User sees nothing for minutes

// ✅ Good: Show progress (requires TUS protocol - future enhancement)
// For now, show "Uploading..." message
```

### Pitfall 4: Not Handling Network Errors

```typescript
// ❌ Bad: No retry logic
await uploadVideo({ file, filename: 'test.mp4' });

// ✅ Good: Retry with exponential backoff
async function uploadWithRetry(options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await uploadVideo(options);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      console.log(`Retry ${i + 1}/${maxRetries}...`);
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
    }
  }
}
```

### Pitfall 5: Exposing API Credentials

```typescript
// ❌ NEVER: Hardcode credentials
const API_TOKEN = 'abc123secret'; // NEVER DO THIS!

// ❌ NEVER: Send to client
res.json({ apiToken: process.env.CLOUDFLARE_API_TOKEN }); // NEVER!

// ✅ Good: Use server-side only
import { getCloudflareConfig } from '@/lib/cloudflare';
const config = getCloudflareConfig(); // Reads from environment
```

---

## Performance Optimization

### 1. Parallel Uploads

```typescript
// ❌ Slow: Sequential uploads
for (const file of files) {
  await uploadVideo({ file, filename: file.name });
}

// ✅ Fast: Parallel uploads
const uploads = files.map(file =>
  uploadVideo({ file, filename: file.name })
);
const results = await Promise.all(uploads);
```

### 2. Lazy Load Video Metadata

```typescript
// ❌ Slow: Load all video data upfront
const videos = await listVideos({ limit: 100 });
const detailed = await Promise.all(
  videos.result.map(v => getVideo(v.uid))
);

// ✅ Fast: Load only what's needed
const videos = await listVideos({ limit: 20 }); // Smaller page
// Only load details when user clicks
```

### 3. Cache Video Metadata

```typescript
// ✅ Cache in Redis (future enhancement)
const cacheKey = `video:${videoId}`;
let video = await redis.get(cacheKey);

if (!video) {
  video = await getVideo(videoId);
  await redis.setex(cacheKey, 3600, JSON.stringify(video)); // 1 hour
}
```

### 4. Use Webhooks Instead of Polling

```typescript
// ❌ Inefficient: Poll every 5 seconds
while (true) {
  const status = await getVideoStatus(videoId);
  if (status.state === 'ready') break;
  await sleep(5000);
}

// ✅ Efficient: Webhook (T191 - future task)
// Cloudflare calls your webhook when video is ready
```

---

## Troubleshooting

### Issue 1: Upload Fails

**Symptoms**: Upload throws error

**Possible Causes**:
1. Invalid API credentials
2. Unsupported file format
3. File too large (>30GB)
4. Network timeout

**Solutions**:

```typescript
// Check credentials
try {
  const config = getCloudflareConfig();
  console.log('Account ID:', config.accountId);
} catch (error) {
  console.error('Fix .env file:', error.message);
}

// Check file format
const supportedFormats = ['mp4', 'mov', 'avi', 'webm'];
const extension = filename.split('.').pop()?.toLowerCase();
if (!supportedFormats.includes(extension)) {
  throw new Error(`Unsupported format: ${extension}`);
}

// Check file size
const maxSize = 30 * 1024 * 1024 * 1024; // 30GB
if (file.size > maxSize) {
  throw new Error(`File too large: ${file.size} bytes`);
}
```

### Issue 2: Video Stuck in Processing

**Symptoms**: Video stays at "inprogress" for hours

**Possible Causes**:
1. Very long video (>2 hours)
2. Corrupted video file
3. Unusual codec or format
4. Cloudflare service issue

**Solutions**:

```typescript
// Check status after 30 minutes
const status = await getVideoStatus(videoId);

if (status.state === 'error') {
  console.error('Processing failed:', status.errorMessage);
  // Delete and retry
  await deleteVideo(videoId);
}

// If stuck, contact Cloudflare support with video UID
```

### Issue 3: Video Not Playing

**Symptoms**: Player shows error or infinite loading

**Possible Causes**:
1. Video not ready yet
2. Signed URLs required but not provided
3. CORS issues
4. Player misconfigured

**Solutions**:

```typescript
// Verify video is ready
const playback = await getVideoPlaybackInfo(videoId);

if (!playback.ready) {
  console.log('Video is still processing');
  return;
}

// Test HLS URL directly
console.log('Test URL:', playback.hlsUrl);
// Open in browser to test

// Check console for CORS errors
// Ensure allowedOrigins includes your domain
```

### Issue 4: Slow Upload

**Symptoms**: Upload takes very long time

**Possible Causes**:
1. Large file size
2. Slow internet connection
3. Server location far from Cloudflare

**Solutions**:

```typescript
// Compress video before upload
// Use FFmpeg to reduce file size

// Show progress to user
console.log('Uploading... This may take several minutes.');

// Consider TUS resumable uploads (future enhancement)
```

---

## Summary

### Key Takeaways

1. **Cloudflare Stream** handles video hosting, transcoding, and global delivery
2. **HLS/DASH** provide adaptive streaming for best user experience
3. **Videos must be processed** before playback URLs are available
4. **Always check status** before attempting playback
5. **Use metadata** for organization and searching
6. **Handle errors gracefully** with proper user feedback

### Next Steps

After T181, continue with video integration:

- **T182**: Database schema for video metadata
- **T183**: Video service combining Cloudflare + database
- **T184**: VideoPlayer component for playback
- **T185**: Admin upload interface
- **T186**: Upload API endpoint
- **T187**: Course lesson pages with videos

### Resources

- [Cloudflare Stream Docs](https://developers.cloudflare.com/stream/)
- [HLS Specification](https://datatracker.ietf.org/doc/html/rfc8216)
- [Video.js Player](https://videojs.com/) (future integration)
- [hls.js Library](https://github.com/video-dev/hls.js/) (for HLS in browsers)

---

**Guide Version**: 1.0
**Last Updated**: November 4, 2025
**Difficulty**: Intermediate
**Estimated Learning Time**: 2-3 hours
