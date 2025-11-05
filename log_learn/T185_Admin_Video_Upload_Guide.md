# T185: Admin Video Upload Interface - Comprehensive Learning Guide

**Topic**: Building a Production-Ready Video Upload System
**Level**: Intermediate to Advanced
**Technologies**: Astro, TypeScript, Cloudflare Stream, Tailwind CSS, FormData API, XMLHttpRequest
**Date**: 2025-11-04

---

## Table of Contents

1. [Introduction](#introduction)
2. [Why Video Upload Interfaces Matter](#why-video-upload-interfaces-matter)
3. [File Upload Fundamentals](#file-upload-fundamentals)
4. [Drag-and-Drop Implementation](#drag-and-drop-implementation)
5. [Upload Progress Tracking](#upload-progress-tracking)
6. [Cloudflare Stream Integration](#cloudflare-stream-integration)
7. [Processing Status Polling](#processing-status-polling)
8. [Form Data Management](#form-data-management)
9. [Error Handling Strategies](#error-handling-strategies)
10. [Testing Upload Interfaces](#testing-upload-interfaces)
11. [Best Practices](#best-practices)
12. [Real-World Examples](#real-world-examples)

---

## Introduction

### What We Built

A professional admin video upload interface featuring:
- Drag-and-drop file selection
- Real-time progress tracking with speed and ETA
- Cloudflare Stream integration for video hosting
- Processing status monitoring
- Metadata form for video details
- Complete error handling and recovery

### Learning Objectives

- Implement drag-and-drop file uploads
- Track upload progress with XMLHttpRequest
- Calculate upload speed and ETA
- Integrate with video hosting services (Cloudflare Stream)
- Poll processing status asynchronously
- Handle large file uploads efficiently
- Create professional admin interfaces

---

## Why Video Upload Interfaces Matter

### The Problem

Course platforms need to:
1. **Accept large files**: Videos are 100MB - 5GB+
2. **Provide feedback**: Users need progress updates
3. **Handle failures gracefully**: Network issues, timeouts
4. **Process videos**: Transcoding, thumbnails, multiple formats
5. **Store metadata**: Titles, descriptions, associations

### Challenges

**Large Files**:
- Can't load entire file into memory
- Need chunked/streaming uploads
- Progress tracking essential

**Long Processing**:
- Video encoding takes minutes
- Need async status checking
- User may navigate away

**User Experience**:
- Clear feedback at every step
- Error messages must be actionable
- Recovery from failures

---

## File Upload Fundamentals

### HTML File Input

```html
<input
  type="file"
  accept="video/mp4,video/webm,video/quicktime"
  id="videoFile"
/>
```

**accept Attribute**:
- Filters file picker to specific types
- User can still select other files (validate on submit!)
- MIME types or file extensions

### File API

```typescript
const fileInput = document.getElementById('videoFile') as HTMLInputElement;

fileInput.addEventListener('change', (e) => {
  const file = (e.target as HTMLInputElement).files?.[0];

  if (file) {
    console.log('Name:', file.name);
    console.log('Size:', file.size, 'bytes');
    console.log('Type:', file.type);
    console.log('Last Modified:', new Date(file.lastModified));
  }
});
```

**File Properties**:
- `name`: Filename with extension
- `size`: Size in bytes
- `type`: MIME type
- `lastModified`: Timestamp
- `slice()`: Extract portions (for chunking)

### FormData API

```typescript
const formData = new FormData();
formData.append('file', file);
formData.append('courseId', '123');
formData.append('metadata', JSON.stringify({ ... }));
```

**Why FormData?**
- Handles binary data (files)
- Automatic multipart/form-data encoding
- Works with fetch() and XMLHttpRequest
- Server parses easily

---

## Drag-and-Drop Implementation

### The HTML Structure

```html
<div id="dropZone" class="drop-zone">
  <input type="file" id="fileInput" class="sr-only" />
  <p>Drag and drop your video here</p>
  <p>or click to browse</p>
</div>
```

### Event Handlers

```typescript
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');

// Click to browse
dropZone.addEventListener('click', () => {
  fileInput.click();
});

// Prevent default drag behavior
dropZone.addEventListener('dragover', (e) => {
  e.preventDefault(); // Required to allow drop!
  dropZone.classList.add('drag-over');
});

// Remove hover effect
dropZone.addEventListener('dragleave', (e) => {
  e.preventDefault();
  dropZone.classList.remove('drag-over');
});

// Handle drop
dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('drag-over');

  const files = e.dataTransfer?.files;
  if (files && files[0]) {
    handleFileSelect(files[0]);
  }
});
```

**Key Points**:
1. `e.preventDefault()` on dragover is REQUIRED for drop to work
2. `e.dataTransfer.files` contains dropped files
3. Same `handleFileSelect()` for both click and drop (DRY)

### Visual Feedback

```css
/* Tailwind implementation */
.drop-zone {
  @apply border-2 border-dashed border-border;
  @apply transition-all duration-300;
  @apply hover:border-primary hover:bg-surface-light;
}

.drop-zone.drag-over {
  @apply border-primary bg-primary-light;
}
```

---

## Upload Progress Tracking

### Why XMLHttpRequest?

**Fetch API Limitations**:
```typescript
// fetch() doesn't support upload progress!
fetch('/upload', {
  method: 'POST',
  body: formData
}); // No way to track progress
```

**XMLHttpRequest Solution**:
```typescript
const xhr = new XMLHttpRequest();

// Track upload progress
xhr.upload.addEventListener('progress', (e) => {
  if (e.lengthComputable) {
    const percentage = (e.loaded / e.total) * 100;
    updateProgressBar(percentage);
  }
});

xhr.open('POST', '/upload');
xhr.send(formData);
```

### Complete Progress Tracking

```typescript
class UploadTracker {
  private startTime: number;
  private lastLoaded: number;
  private lastTime: number;

  constructor() {
    this.startTime = Date.now();
    this.lastLoaded = 0;
    this.lastTime = Date.now();
  }

  updateProgress(loaded: number, total: number): void {
    // 1. Calculate percentage
    const percentage = Math.round((loaded / total) * 100);
    this.updateProgressBar(percentage);

    // 2. Calculate speed (bytes per second)
    const now = Date.now();
    const timeDiff = (now - this.lastTime) / 1000; // seconds

    if (timeDiff >= 0.5) { // Update every 0.5s
      const bytesDiff = loaded - this.lastLoaded;
      const speed = bytesDiff / timeDiff; // bytes/second
      const speedMB = (speed / 1024 / 1024).toFixed(2);

      this.updateSpeed(`${speedMB} MB/s`);

      // 3. Calculate ETA
      const remaining = total - loaded; // bytes remaining
      const eta = remaining / speed; // seconds
      const etaMin = Math.floor(eta / 60);
      const etaSec = Math.floor(eta % 60);
      this.updateETA(`${etaMin}:${etaSec.toString().padStart(2, '0')}`);

      // 4. Update loaded/total display
      const loadedMB = (loaded / 1024 / 1024).toFixed(2);
      const totalMB = (total / 1024 / 1024).toFixed(2);
      this.updateLoaded(`${loadedMB} MB / ${totalMB} MB`);

      // Store for next calculation
      this.lastLoaded = loaded;
      this.lastTime = now;
    }
  }
}
```

**Throttling Updates**:
- Progress events fire many times per second
- Update UI every 0.5s, not every event
- Prevents UI jank and excessive calculations

### Cancel Upload

```typescript
let xhr: XMLHttpRequest | null = null;

function startUpload() {
  xhr = new XMLHttpRequest();
  // ... setup upload
  xhr.send(formData);
}

function cancelUpload() {
  if (xhr) {
    xhr.abort(); // Cancels upload, fires 'abort' event
  }
}

xhr.addEventListener('abort', () => {
  console.log('Upload cancelled');
  resetUI();
});
```

---

## Cloudflare Stream Integration

### Why Cloudflare Stream?

**Benefits**:
1. **Global CDN**: Fast delivery worldwide
2. **Automatic Transcoding**: Multiple qualities, formats
3. **Adaptive Bitrate**: HLS streaming adjusts to bandwidth
4. **Thumbnails**: Auto-generated
5. **Analytics**: View counts, watch time
6. **No Storage Management**: Cloudflare handles it

### Upload Flow

```
Client → API Endpoint → Cloudflare Stream
   ↓
Database Record (after processing)
```

### Server-Side Upload

```typescript
// src/pages/api/admin/videos/upload.ts
export const POST: APIRoute = async ({ request }) => {
  const formData = await request.formData();
  const file = formData.get('file') as File;

  // Upload to Cloudflare
  const video = await uploadVideo({
    file,
    filename: file.name,
    meta: {
      courseId: formData.get('courseId') as string,
      uploadedBy: user.email,
    },
  });

  return new Response(JSON.stringify({
    videoId: video.uid,
    status: video.status.state,
  }));
};
```

### Cloudflare API (from T181)

```typescript
export async function uploadVideo(options: UploadVideoOptions): Promise<VideoMetadata> {
  const config = getCloudflareConfig();
  const url = `${BASE_URL}/accounts/${config.accountId}/stream`;

  const formData = new FormData();
  formData.append('file', options.file, options.filename);

  if (options.meta) {
    formData.append('meta', JSON.stringify(options.meta));
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiToken}`,
    },
    body: formData,
  });

  const data = await response.json();
  return data.result;
}
```

**Response**:
```json
{
  "uid": "abc123",
  "status": {
    "state": "queued",
    "pctComplete": "0"
  },
  "readyToStream": false
}
```

---

## Processing Status Polling

### The Problem

Video processing is asynchronous:
1. Upload completes instantly → video UID returned
2. Cloudflare queues video for processing
3. Encoding takes 1-10 minutes
4. Need to check status repeatedly

### Polling Implementation

```typescript
async function pollProcessingStatus(videoId: string): Promise<void> {
  const interval = setInterval(async () => {
    try {
      const response = await fetch(`/api/admin/videos/status?videoId=${videoId}`);
      const data = await response.json();

      if (data.status === 'ready') {
        clearInterval(interval);
        handleProcessingComplete(data);
      } else if (data.status === 'error') {
        clearInterval(interval);
        handleProcessingError(data.errorMessage);
      } else {
        // Still processing
        updateProcessingProgress(data.progress);
      }
    } catch (error) {
      console.error('Status check failed:', error);
      // Don't clear interval - retry next time
    }
  }, 3000); // Poll every 3 seconds
}
```

**Poll Interval Guidelines**:
- Too fast: Wastes API calls, server load
- Too slow: User waits unnecessarily
- 3-5 seconds is good balance
- Exponential backoff for long processing

### Status Endpoint

```typescript
// src/pages/api/admin/videos/status.ts
export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const videoId = url.searchParams.get('videoId');

  // Get from Cloudflare
  const video = await getVideo(videoId);

  // Calculate progress
  let progress = 0;
  if (video.status.pctComplete) {
    progress = Math.round(parseFloat(video.status.pctComplete));
  } else if (video.status.state === 'ready') {
    progress = 100;
  }

  return new Response(JSON.stringify({
    status: video.status.state,
    progress,
    errorMessage: video.status.errorReasonText,
    duration: video.duration,
    thumbnail: video.thumbnail,
    readyToStream: video.readyToStream,
  }));
};
```

### UI Updates

```typescript
function updateProcessingProgress(progress: number): void {
  // Update progress bar
  const progressBar = document.querySelector('.processing-progress');
  progressBar.style.width = `${progress}%`;

  // Update percentage text
  const percentageEl = document.querySelector('.processing-percentage');
  percentageEl.textContent = `${progress}%`;

  // Update message based on progress
  let message = 'Processing video...';
  if (progress >= 75) {
    message = 'Almost done...';
  } else if (progress >= 50) {
    message = 'Halfway there...';
  }

  const messageEl = document.querySelector('.processing-message');
  messageEl.textContent = message;
}
```

---

## Form Data Management

### Two-Stage Process

**Stage 1: Upload File**
```
1. Select file
2. Upload to Cloudflare
3. Wait for processing
```

**Stage 2: Enter Metadata**
```
4. Fill in title, description, lesson ID
5. Submit metadata
6. Create database record
```

**Why Two Stages?**
- Can't save to database until processing completes
- Don't want user filling form while uploading
- Better UX: sequential, clear steps

### Metadata Form

```html
<form id="videoMetadataForm">
  <input
    type="text"
    name="title"
    required
    placeholder="Video title"
  />

  <textarea
    name="description"
    placeholder="Description (optional)"
  ></textarea>

  <input
    type="text"
    name="lessonId"
    required
    placeholder="Lesson ID (e.g., lesson-01)"
  />

  <input
    type="number"
    name="thumbnailTimestamp"
    min="0"
    max="100"
    value="0"
    placeholder="Thumbnail timestamp %"
  />

  <button type="submit">Save Video</button>
</form>
```

### Form Submission

```typescript
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = new FormData(form);

  const response = await fetch('/api/admin/videos/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      courseId: this.courseId,
      cloudflareVideoId: this.videoId,
      title: formData.get('title'),
      description: formData.get('description'),
      lessonId: formData.get('lessonId'),
      thumbnailTimestamp: formData.get('thumbnailTimestamp'),
    }),
  });

  if (response.ok) {
    // Redirect with success message
    window.location.href = `/admin/courses/${this.courseId}/edit?success=Video uploaded`;
  } else {
    const error = await response.json();
    showError(error.message);
  }
});
```

---

## Error Handling Strategies

### Client-Side Validation

```typescript
function validateFile(file: File): string | null {
  // 1. Check file type
  const validTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
  const validExtensions = ['.mp4', '.webm', '.mov', '.avi'];

  const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

  if (!validTypes.includes(file.type) && !validExtensions.includes(extension)) {
    return 'Invalid file type. Please upload MP4, WebM, MOV, or AVI files.';
  }

  // 2. Check file size (5GB max)
  const maxSize = 5 * 1024 * 1024 * 1024;
  if (file.size > maxSize) {
    return 'File is too large. Maximum size is 5 GB.';
  }

  return null; // Valid
}
```

**Why Both Type and Extension?**
- MIME type can be missing or wrong
- Extension provides fallback
- Double validation is safer

### Upload Error Handling

```typescript
xhr.addEventListener('error', () => {
  showError('Network error. Please check your connection and try again.');
  resetUpload();
});

xhr.addEventListener('timeout', () => {
  showError('Upload timed out. Please try again with a smaller file or better connection.');
  resetUpload();
});

xhr.addEventListener('abort', () => {
  showMessage('Upload cancelled.');
  resetUpload();
});

xhr.addEventListener('load', () => {
  if (xhr.status >= 200 && xhr.status < 300) {
    const response = JSON.parse(xhr.responseText);
    handleSuccess(response);
  } else {
    const error = JSON.parse(xhr.responseText);
    showError(`Upload failed: ${error.message}`);
  }
});
```

### Retry Mechanism

```typescript
async function uploadWithRetry(
  file: File,
  maxRetries: number = 3
): Promise<any> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await uploadFile(file);
    } catch (error) {
      lastError = error as Error;
      console.log(`Upload attempt ${attempt} failed:`, error);

      if (attempt < maxRetries) {
        // Wait before retry (exponential backoff)
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}
```

### User-Friendly Error Messages

```typescript
// Bad: Technical jargon
showError('CORS preflight failed with status 403');

// Good: Clear, actionable
showError('Unable to upload. Please check your internet connection and try again.');

// Best: Specific, actionable, helpful
showError(
  'Upload failed due to network error. ' +
  'Please check your connection and try again. ' +
  'If the problem persists, try a smaller file or contact support.'
);
```

---

## Testing Upload Interfaces

### Unit Test Challenges

**Problem**: Can't test actual file uploads in unit tests
- No real network requests
- FormData parsing differs in tests
- Large files cause memory issues

**Solution**: Test logic separately
```typescript
// Good: Test validation logic
it('should validate file size limit', () => {
  const maxSize = 5 * 1024 * 1024 * 1024;
  const tooLarge = 5.1 * 1024 * 1024 * 1024;
  expect(tooLarge > maxSize).toBe(true);
});

// Good: Test progress calculation
it('should calculate upload speed', () => {
  const bytesDiff = 10 * 1024 * 1024; // 10 MB
  const timeDiff = 2; // 2 seconds
  const speed = bytesDiff / timeDiff;
  const speedMB = speed / 1024 / 1024;
  expect(speedMB).toBe(5);
});
```

### Mocking Strategies

```typescript
// Mock file for testing
function createMockFile(name: string, size: number, type: string): File {
  const content = size > 1024 * 1024 ? 'x' : 'x'.repeat(size);
  const blob = new Blob([content], { type });
  const file = new File([blob], name, { type });

  // For large file tests, override size property
  if (size > 1024 * 1024) {
    Object.defineProperty(file, 'size', {
      value: size,
      writable: false,
    });
  }

  return file;
}
```

### E2E Testing

**Playwright Example**:
```typescript
test('should upload video', async ({ page }) => {
  await page.goto('/admin/courses/123/videos/upload');

  // Select file
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles('test-video.mp4');

  // Wait for upload
  await page.waitForSelector('.upload-progress', { state: 'visible' });

  // Wait for processing
  await page.waitForSelector('.processing-status', { state: 'visible', timeout: 30000 });

  // Fill metadata
  await page.fill('#videoTitle', 'Test Video');
  await page.fill('#lessonId', 'lesson-01');

  // Submit
  await page.click('button[type="submit"]');

  // Verify success
  await expect(page).toHaveURL(/success=Video/);
});
```

---

## Best Practices

### 1. Progressive Disclosure

```
Step 1: Select file
  ↓
Step 2: Upload progress
  ↓
Step 3: Processing status
  ↓
Step 4: Enter metadata
  ↓
Step 5: Success!
```

Show one step at a time, don't overwhelm.

### 2. Clear Visual States

```typescript
enum UploadState {
  IDLE,        // Drop zone visible
  SELECTED,    // File info shown
  UPLOADING,   // Progress bar active
  PROCESSING,  // Spinner with progress
  READY,       // Metadata form
  ERROR,       // Error message with retry
}
```

Each state has distinct UI.

### 3. Informative Feedback

```typescript
// Update status message based on progress
function getStatusMessage(percentage: number): string {
  if (percentage === 0) return 'Starting upload...';
  if (percentage < 25) return 'Uploading...';
  if (percentage < 75) return 'Making progress...';
  if (percentage < 100) return 'Almost done...';
  return 'Upload complete!';
}
```

### 4. Handle Edge Cases

- **Network interruption**: Show error, allow retry
- **Browser close**: Warn if upload in progress
- **File too large**: Catch before upload starts
- **Processing timeout**: Set reasonable timeout, inform user

### 5. Optimize Performance

- **Throttle UI updates**: Not every progress event
- **Lazy-load UI**: Don't render hidden states
- **Efficient DOM updates**: Cache element references
- **Cleanup intervals**: Clear on unmount/completion

---

## Real-World Examples

### Example 1: Course Video Upload

```astro
---
// src/pages/admin/courses/[id]/videos/upload.astro
import AdminLayout from '@/layouts/AdminLayout.astro';
const { id: courseId } = Astro.params;
const course = await getCourseById(courseId);
---

<AdminLayout title={`Upload Video - ${course.title}`}>
  <VideoUploadInterface courseId={courseId} />
</AdminLayout>
```

### Example 2: Batch Upload (Future Enhancement)

```typescript
class BatchUploader {
  private queue: File[] = [];
  private active: number = 0;
  private maxConcurrent: number = 2;

  addFiles(files: FileList): void {
    this.queue.push(...Array.from(files));
    this.processQueue();
  }

  private async processQueue(): Promise<void> {
    while (this.queue.length > 0 && this.active < this.maxConcurrent) {
      const file = this.queue.shift()!;
      this.active++;

      try {
        await this.uploadFile(file);
      } catch (error) {
        console.error('Upload failed:', file.name, error);
      } finally {
        this.active--;
        this.processQueue();
      }
    }
  }
}
```

### Example 3: Resume Interrupted Uploads (TUS Protocol)

```typescript
// Future enhancement with TUS
async function resumableUpload(file: File): Promise<void> {
  const chunkSize = 5 * 1024 * 1024; // 5MB chunks

  // 1. Create upload session
  const { uploadUrl } = await createUploadSession({
    filename: file.name,
    size: file.size,
  });

  // 2. Upload chunks
  for (let offset = 0; offset < file.size; offset += chunkSize) {
    const chunk = file.slice(offset, offset + chunkSize);

    await uploadChunk(uploadUrl, chunk, offset);

    updateProgress(offset + chunk.size, file.size);
  }
}
```

---

## Conclusion

### Key Takeaways

1. **Drag-and-Drop**: Enhance UX with intuitive file selection
2. **Progress Tracking**: XMLHttpRequest for upload progress
3. **Async Processing**: Poll status, don't block UI
4. **Error Handling**: Validate early, fail gracefully
5. **Two-Stage Process**: Upload first, metadata second
6. **User Feedback**: Clear states, informative messages

### What You Learned

- Implement drag-and-drop file uploads
- Track upload progress (percentage, speed, ETA)
- Integrate with video hosting services
- Poll processing status asynchronously
- Handle large file uploads
- Create professional admin interfaces
- Test upload functionality

### Next Steps

1. **Add TUS Support**: Resumable uploads for reliability
2. **Batch Upload**: Multiple files at once
3. **Video Preview**: Show preview before upload
4. **Advanced Metadata**: Chapters, captions
5. **Analytics**: Track upload success rates

---

**Author**: Claude Code
**Last Updated**: 2025-11-04
**Version**: 1.0
