# T184: VideoPlayer Component - Comprehensive Learning Guide

**Topic**: Building an Accessible Video Player with Cloudflare Stream Integration
**Level**: Intermediate to Advanced
**Technologies**: Astro, TypeScript, Tailwind CSS, Cloudflare Stream, PostMessage API
**Date**: 2025-11-04

---

## Table of Contents

1. [Introduction](#introduction)
2. [Why We Need a Video Player Component](#why-we-need-a-video-player-component)
3. [Video Streaming Fundamentals](#video-streaming-fundamentals)
4. [Cloudflare Stream Integration](#cloudflare-stream-integration)
5. [Astro Component Architecture](#astro-component-architecture)
6. [Keyboard Shortcuts Implementation](#keyboard-shortcuts-implementation)
7. [Progress Tracking System](#progress-tracking-system)
8. [Accessibility Implementation (WCAG 2.1 AA)](#accessibility-implementation)
9. [Error Handling and Resilience](#error-handling-and-resilience)
10. [Testing Astro Components](#testing-astro-components)
11. [Performance Optimization](#performance-optimization)
12. [Security Considerations](#security-considerations)
13. [Best Practices](#best-practices)
14. [Real-World Examples](#real-world-examples)

---

## Introduction

### What We Built

We created a production-ready VideoPlayer component that:
- Embeds Cloudflare Stream videos with HLS adaptive streaming
- Provides comprehensive keyboard shortcuts for accessibility
- Tracks user progress through videos
- Supports captions/subtitles in multiple languages
- Handles errors gracefully with retry functionality
- Meets WCAG 2.1 AA accessibility standards

### Learning Objectives

By studying this implementation, you will learn:
- How to integrate third-party video services (Cloudflare Stream)
- Cross-origin iframe communication with PostMessage API
- Building accessible components with ARIA attributes
- Implementing keyboard shortcuts that don't conflict with page shortcuts
- Progress tracking patterns for learning platforms
- Testing component rendering with JSDOM
- Responsive design with Tailwind CSS

---

## Why We Need a Video Player Component

### The Problem

Modern learning platforms need video players that:
1. **Stream efficiently** - Users have varying bandwidth
2. **Work everywhere** - Desktop, mobile, different browsers
3. **Track progress** - Know where users stopped watching
4. **Are accessible** - Work with screen readers and keyboards
5. **Handle errors** - Network issues, blocked content, etc.

### Why Not Use `<video>` Tag?

Native `<video>` tag limitations:
- No adaptive bitrate streaming (ABR) without complex setup
- Browser codec support varies
- No built-in DRM for premium content
- Manual subtitle management
- No analytics or engagement tracking

### Why Cloudflare Stream?

Cloudflare Stream solves these problems:
- **Automatic ABR**: Adjusts quality based on user's connection
- **Global CDN**: Fast delivery worldwide
- **Encoding**: Handles all format conversions
- **DRM**: Optional content protection
- **Analytics**: Built-in viewing metrics
- **Simple API**: Just embed an iframe

---

## Video Streaming Fundamentals

### HLS (HTTP Live Streaming)

**What It Is**:
HLS breaks videos into small chunks (~2-10 seconds each) at multiple quality levels.

**How It Works**:
1. Server creates multiple quality versions (360p, 720p, 1080p)
2. Each version split into segments
3. Manifest file (`.m3u8`) lists available segments
4. Player requests segments based on current bandwidth

**Benefits**:
- Adaptive: Switches quality mid-stream
- HTTP-based: Works through firewalls
- Buffering: Preloads next segments

### Adaptive Bitrate Streaming (ABR)

**The Problem**: Fixed bitrate causes buffering on slow connections or wastes bandwidth on fast ones.

**The Solution**: Monitor connection speed and adjust video quality in real-time.

```
Slow Connection (2 Mbps):
User → 360p stream (0.5 Mbps) ✅ Smooth playback

Fast Connection (25 Mbps):
User → 1080p stream (5 Mbps) ✅ High quality
```

### Why This Matters for Learning Platforms

Students may watch from:
- University WiFi (fast, stable)
- Home broadband (moderate)
- Mobile data (slow, variable)
- Rural areas (limited bandwidth)

ABR ensures everyone can watch regardless of connection.

---

## Cloudflare Stream Integration

### Iframe Embed Approach

**Why Iframe?**

```astro
<!-- Simple iframe embed -->
<iframe
  src="https://customer-{account}.cloudflarestream.com/{videoId}/iframe"
  allow="accelerometer; autoplay; encrypted-media; fullscreen"
  allowfullscreen
></iframe>
```

**Advantages**:
1. **Security**: Sandboxed environment
2. **Maintenance**: Cloudflare updates player automatically
3. **Compatibility**: They handle browser differences
4. **Features**: Built-in controls, captions, quality selector
5. **Bundle Size**: No JavaScript SDK needed

**Trade-offs**:
- Less control than direct player API
- Must use PostMessage for communication
- Can't deeply customize UI

### Building the Iframe Src

```typescript
const buildIframeSrc = () => {
  const accountHash = import.meta.env.PUBLIC_CLOUDFLARE_ACCOUNT_HASH;
  const embedUrl = `https://customer-${accountHash}.cloudflarestream.com/${videoId}/iframe`;

  const params = new URLSearchParams({
    autoplay: autoplay ? '1' : '0',
    muted: muted ? '1' : '0',
    controls: 'true',
    loop: 'false',
    preload: 'auto',
  });

  if (poster) {
    params.append('poster', poster);
  }

  return `${embedUrl}?${params.toString()}`;
};
```

**Parameters Explained**:
- `autoplay`: Start immediately (be careful with UX)
- `muted`: Required for autoplay in many browsers
- `controls`: Show play/pause, volume, etc.
- `loop`: Restart when finished
- `preload`: Load metadata/buffer ahead
- `poster`: Show thumbnail before play

### PostMessage API Communication

**The Problem**: JavaScript can't directly access iframe content from different origin (security).

**The Solution**: PostMessage API for safe cross-origin communication.

**Sending Commands**:
```typescript
iframe.contentWindow.postMessage({
  method: 'play',  // or 'pause', 'seek', etc.
  value: undefined
}, '*');
```

**Receiving Events**:
```typescript
window.addEventListener('message', (event) => {
  // Verify origin for security
  if (!event.origin.includes('cloudflarestream.com')) {
    return;
  }

  const data = event.data;

  if (data.event === 'play') {
    // Video started playing
    this.state.isPlaying = true;
  } else if (data.event === 'timeupdate') {
    // Playback position changed
    this.state.currentTime = data.currentTime;
    this.state.duration = data.duration;
  }
});
```

**Security Note**: Always verify `event.origin` to prevent malicious messages.

---

## Astro Component Architecture

### Astro Component Structure

```astro
---
// Frontmatter (runs on server)
interface Props {
  videoId: string;
  title: string;
}

const { videoId, title } = Astro.props;
const iframeSrc = buildIframeSrc();
---

<!-- Template (renders to HTML) -->
<div id="player-{videoId}">
  <iframe src={iframeSrc} title={title}></iframe>
</div>

<script>
  // Client-side JavaScript (runs in browser)
  class VideoPlayer {
    // ...
  }
</script>

<style>
  /* Component styles */
</style>
```

### Server vs Client Rendering

**Server (Frontmatter)**:
- Runs once during build or SSR
- Has access to environment variables
- Can fetch data from databases
- Generates HTML string

**Client (Script)**:
- Runs in user's browser
- Handles interactivity
- Manages state
- Responds to events

### Why This Matters

```astro
---
// This runs on server - SAFE
const apiKey = import.meta.env.CLOUDFLARE_API_KEY; // Not exposed to client
const embedUrl = buildEmbedUrl(apiKey);
---

<script>
  // This runs in browser - PUBLIC
  // Never put secrets here!
  const videoId = document.dataset.videoId; // OK, public data
</script>
```

### Component Props Pattern

```typescript
interface Props {
  videoId: string;          // Required
  title: string;            // Required
  courseId?: string;        // Optional (note the ?)
  autoplay?: boolean;       // Optional with default
  className?: string;       // Additional customization
}

const {
  videoId,
  title,
  courseId = '',           // Default value
  autoplay = false,        // Default value
  className = '',
} = Astro.props;
```

**Best Practices**:
1. Required props first
2. Optional props with `?`
3. Provide sensible defaults
4. Document with comments
5. Use TypeScript for type safety

---

## Keyboard Shortcuts Implementation

### The Challenge

Keyboard shortcuts for video players must:
1. Only work when player is focused
2. Not interfere with other page shortcuts
3. Follow conventions (Space = play/pause)
4. Work with screen readers
5. Prevent default browser actions

### Focus Detection Pattern

```typescript
let isPlayerFocused = false;

// Mouse enter/leave
container.addEventListener('mouseenter', () => {
  isPlayerFocused = true;
});

container.addEventListener('mouseleave', () => {
  isPlayerFocused = false;
});

// Focus in/out (keyboard navigation)
container.addEventListener('focusin', () => {
  isPlayerFocused = true;
});

container.addEventListener('focusout', () => {
  isPlayerFocused = false;
});

// Only handle shortcuts when focused
document.addEventListener('keydown', (e) => {
  if (!isPlayerFocused) return;

  // Handle shortcuts...
});
```

**Why Both Mouse and Focus?**
- Mouse users may hover without clicking
- Keyboard users tab into component
- Both should activate shortcuts

### Keyboard Event Handling

```typescript
document.addEventListener('keydown', (e: KeyboardEvent) => {
  if (!isPlayerFocused) return;

  // Prevent default for handled keys
  const handledKeys = [' ', 'k', 'f', 'ArrowLeft', 'ArrowRight'];
  if (handledKeys.includes(e.key)) {
    e.preventDefault();  // Don't scroll page, etc.
  }

  switch (e.key) {
    case ' ':
    case 'k':
    case 'K':
      this.togglePlayPause();
      break;

    case 'f':
    case 'F':
      this.toggleFullscreen();
      break;

    case 'ArrowLeft':
      this.seek(-5);  // Rewind 5 seconds
      break;

    case 'ArrowRight':
      this.seek(5);   // Forward 5 seconds
      break;

    case 'ArrowUp':
      this.adjustVolume(0.1);  // +10%
      break;

    case 'ArrowDown':
      this.adjustVolume(-0.1); // -10%
      break;

    default:
      // Number keys 0-9 for percentage seek
      if (e.key >= '0' && e.key <= '9') {
        const percentage = parseInt(e.key) * 10;
        this.seekToPercentage(percentage);
      }
  }
});
```

### Seek Implementation

```typescript
private seek(seconds: number): void {
  // Calculate new position
  const newTime = Math.max(0, Math.min(
    this.state.duration,
    this.state.currentTime + seconds
  ));

  // Send command to player
  this.sendPlayerCommand('currentTime', newTime);

  // Announce for screen readers
  const direction = seconds > 0 ? 'forward' : 'backward';
  this.announce(`Seeked ${direction} ${Math.abs(seconds)} seconds`);
}
```

**Key Points**:
1. Clamp value between 0 and duration
2. Use Math.max/Math.min for bounds
3. Announce action for accessibility
4. Provide feedback

### Standard Shortcuts Reference

| Shortcut | Action | Convention Source |
|----------|--------|------------------|
| Space/K | Play/Pause | YouTube, Vimeo |
| F | Fullscreen | YouTube, Vimeo |
| M | Mute/Unmute | YouTube, Vimeo |
| ← | Rewind 5s | YouTube (5s), Vimeo (5s) |
| → | Forward 5s | YouTube (5s), Vimeo (5s) |
| ↑ | Volume up | YouTube, Vimeo |
| ↓ | Volume down | YouTube, Vimeo |
| 0-9 | Jump to % | YouTube |

**Why Follow Conventions?**
Users expect these shortcuts. Don't reinvent unless necessary.

---

## Progress Tracking System

### Why Track Progress?

Learning platforms need to:
1. **Resume playback**: Start where user left off
2. **Show completion**: Mark lessons as watched
3. **Analytics**: Understand engagement
4. **Personalization**: Recommend based on watch history

### Progress Tracking Architecture

```
Video Player
    ↓ (every 10s while playing)
Progress Update API
    ↓
Database (lesson_progress table)
    ↓ (on query)
Student Dashboard (show progress)
```

### Implementation

```typescript
private setupProgressTracking(): void {
  if (!this.courseId || !this.lessonId) {
    return; // No tracking without IDs
  }

  // Update every 10 seconds while playing
  this.state.progressInterval = window.setInterval(() => {
    if (this.state.isPlaying) {
      this.updateProgress();
    }
  }, 10000);
}

private async updateProgress(): Promise<void> {
  const progress = Math.floor(
    (this.state.currentTime / this.state.duration) * 100
  );

  // Only update if changed significantly (at least 5%)
  if (Math.abs(progress - this.state.lastProgressUpdate) < 5) {
    return;
  }

  try {
    const response = await fetch('/api/progress/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        courseId: this.courseId,
        lessonId: this.lessonId,
        progress,
        currentTime: this.state.currentTime,
      }),
    });

    if (response.ok) {
      this.state.lastProgressUpdate = progress;
    }
  } catch (error) {
    // Log error but don't disrupt playback
    console.error('Failed to update progress:', error);
  }
}
```

### Throttling Strategy

**Problem**: Sending progress every second → 600 requests for 10-minute video.

**Solution**: Throttle updates
- Time-based: Every 10 seconds
- Change-based: Minimum 5% progress change

```typescript
// Bad: Update every second
setInterval(() => updateProgress(), 1000);
// Result: 600 updates for 10-min video

// Good: Update every 10 seconds with minimum change
setInterval(() => {
  if (progressChanged >= 5%) {
    updateProgress();
  }
}, 10000);
// Result: ~12-20 updates for 10-min video
```

### Handling Video End

```typescript
private onVideoEnded(): void {
  // Final progress update
  this.updateProgress();

  // Mark as completed (100%)
  fetch('/api/progress/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      courseId: this.courseId,
      lessonId: this.lessonId,
    }),
  }).catch(error => {
    console.error('Failed to mark complete:', error);
  });

  // Dispatch custom event for parent components
  this.container.dispatchEvent(new CustomEvent('videoended', {
    detail: { videoId: this.videoId }
  }));
}
```

### Non-Blocking Updates

**Critical Principle**: Progress tracking failures should NOT break video playback.

```typescript
// Bad: Throw error on failure
async function updateProgress() {
  const response = await fetch('/api/progress');
  if (!response.ok) {
    throw new Error('Progress update failed');  // Breaks playback!
  }
}

// Good: Log error, continue playback
async function updateProgress() {
  try {
    const response = await fetch('/api/progress');
    if (!response.ok) {
      console.error('Progress update failed');  // Log, don't throw
    }
  } catch (error) {
    console.error('Progress update error:', error);  // Catch, don't crash
  }
}
```

---

## Accessibility Implementation

### WCAG 2.1 AA Requirements

**Level A** (Must Have):
- Keyboard accessible
- Text alternatives for non-text content
- Meaningful link text
- No keyboard traps

**Level AA** (Should Have):
- Color contrast ratios
- Resize text up to 200%
- Multiple ways to navigate
- Consistent navigation

### ARIA Live Regions

**Purpose**: Announce dynamic content changes to screen readers.

```html
<!-- Polite announcements (non-urgent) -->
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
>
  Video playing
</div>

<!-- Assertive announcements (urgent) -->
<div
  role="alert"
  aria-live="assertive"
>
  Error: Video failed to load
</div>
```

**aria-live Values**:
- `off`: No announcement (default)
- `polite`: Announce when convenient (status changes)
- `assertive`: Announce immediately (errors, warnings)

**aria-atomic Values**:
- `true`: Announce entire region when changed
- `false`: Announce only changed parts

### Implementation in VideoPlayer

```typescript
private announce(message: string): void {
  if (this.announcementEl) {
    this.announcementEl.textContent = message;

    // Clear after 1 second so next announcement works
    setTimeout(() => {
      this.announcementEl.textContent = '';
    }, 1000);
  }
}

// Usage
this.announce('Video loaded and ready to play');
this.announce('Video playing');
this.announce('Seeked forward 5 seconds');
this.announce('Volume 80%');
```

**Why Clear After 1 Second?**
Screen readers announce when content changes. If we don't clear, the next identical message won't trigger an announcement.

### Screen Reader Instructions

```html
<div class="sr-only">
  <p>Video player keyboard shortcuts:</p>
  <ul>
    <li>Space or K: Play/Pause</li>
    <li>F: Toggle fullscreen</li>
    <li>M: Toggle mute</li>
    <li>Left Arrow: Rewind 5 seconds</li>
    <li>Right Arrow: Forward 5 seconds</li>
  </ul>
</div>
```

**sr-only CSS** (Visible to screen readers only):
```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

**Why Not `display: none`?**
Screen readers ignore `display: none` elements. This technique hides visually but remains accessible.

### Loading and Error States

```html
<!-- Loading State -->
<div
  class="loading-overlay"
  aria-live="polite"
  aria-busy="true"
>
  <div>
    <div class="spinner" aria-hidden="true"></div>
    <p>Loading video...</p>
  </div>
</div>

<!-- Error State -->
<div
  class="error-overlay hidden"
  role="alert"
  aria-live="assertive"
>
  <h3>Video Loading Error</h3>
  <p class="error-message">Unable to load video.</p>
  <button class="retry-button">Retry</button>
</div>
```

**Key Points**:
- `aria-busy="true"`: Indicates content loading
- `role="alert"`: Immediately announces errors
- `aria-hidden="true"`: Hides decorative spinner from SR
- Semantic HTML: `<h3>`, `<p>`, `<button>`

### High Contrast Mode Support

```css
@media (prefers-contrast: high) {
  .video-player-container {
    border: 2px solid currentColor;
  }

  .caption-text {
    background: #000;
    color: #fff;
    border: 1px solid #fff;
  }
}
```

**Why This Matters**:
Users with low vision often enable high contrast mode. Ensure borders and important elements remain visible.

### Reduced Motion Support

```css
@media (prefers-reduced-motion: reduce) {
  .loading-overlay > div > div {
    animation: none;  /* No spinning */
  }

  * {
    transition: none !important;  /* No animations */
  }
}
```

**Why This Matters**:
Users with vestibular disorders may experience nausea from animations. Respect their preference.

### Keyboard Navigation Best Practices

1. **Visible focus indicators**
   ```css
   .video-player-container:focus-within {
     outline: 2px solid var(--color-primary);
     outline-offset: 2px;
   }
   ```

2. **Logical tab order**
   - Container → Retry button → (iframe controls)

3. **No keyboard traps**
   - User can always tab out of player

4. **Standard shortcuts**
   - Follow YouTube/Vimeo conventions

---

## Error Handling and Resilience

### Types of Errors

1. **Network Errors**: Slow connection, interrupted load
2. **Content Errors**: Video not found, encoding failed
3. **Permission Errors**: Blocked by firewall, CORS issues
4. **Client Errors**: Browser doesn't support features

### Loading Timeout Pattern

```typescript
private async init(): Promise<void> {
  try {
    this.iframe.addEventListener('load', () => this.onIframeLoad());

    // Timeout after 15 seconds
    setTimeout(() => {
      if (this.loadingOverlay && !this.loadingOverlay.classList.contains('hidden')) {
        this.showError('Video loading timeout. Please check your connection.');
      }
    }, 15000);

  } catch (error) {
    this.showError('Failed to initialize video player.');
  }
}
```

**Why 15 Seconds?**
- Most videos load in 2-5 seconds
- Network issues apparent by 10 seconds
- Balance between patience and user frustration

### Error Display

```typescript
private showError(message: string): void {
  // Hide loading
  this.hideLoading();

  // Show error overlay
  if (this.errorOverlay) {
    this.errorOverlay.classList.remove('hidden');
    this.errorOverlay.classList.add('flex');

    // Update error message
    const errorMessage = this.errorOverlay.querySelector('.error-message');
    if (errorMessage) {
      errorMessage.textContent = message;
    }
  }

  // Announce for screen readers
  this.announce(`Error: ${message}`);
}
```

### Retry Functionality

```typescript
private retry(): void {
  // Cache current src
  const currentSrc = this.iframe.src;

  // Reset iframe (clears error state)
  this.iframe.src = '';

  // Hide error, show loading
  this.errorOverlay.classList.add('hidden');
  this.loadingOverlay.classList.remove('hidden');

  // Reload after brief delay (allows reset)
  setTimeout(() => {
    this.iframe.src = currentSrc;
  }, 100);

  this.announce('Retrying video load');
}
```

**Why Reset Iframe?**
Setting `src = ''` then restoring it forces a fresh load attempt, clearing any cached error state.

### Origin Verification (Security)

```typescript
window.addEventListener('message', (event) => {
  // IMPORTANT: Verify origin
  if (!event.origin.includes('cloudflarestream.com')) {
    return;  // Ignore messages from other sources
  }

  // Safe to process message
  const data = event.data;
  // ...
});
```

**Why This Matters**:
Without verification, malicious sites could send fake messages to control your player or extract data.

### Graceful Degradation

```typescript
// Feature detection
if (!document.fullscreenEnabled) {
  // Hide fullscreen button or show message
  console.warn('Fullscreen not supported');
}

// Fallback for PostMessage
if (!window.postMessage) {
  // Use Cloudflare's built-in controls only
  console.warn('PostMessage not supported');
}
```

---

## Testing Astro Components

### Testing Strategy

**Unit Tests** (JSDOM):
- HTML structure and rendering
- Prop handling
- Attribute setting
- CSS classes
- Accessibility attributes

**Integration Tests** (Playwright/Cypress):
- Actual video playback
- Keyboard interactions
- Progress tracking
- Error scenarios
- Cross-browser compatibility

**Visual Tests**:
- Loading state appearance
- Error state appearance
- Responsive layouts
- Dark/light themes

### JSDOM Setup

```typescript
import { JSDOM } from 'jsdom';

function setupDOM(html: string) {
  const dom = new JSDOM(html, {
    url: 'http://localhost',
    runScripts: 'dangerously',  // Allow <script> execution
    resources: 'usable',         // Load external resources
  });

  const window = dom.window;
  const document = window.document;

  // Setup globals for tests
  global.window = window;
  global.document = document;
  global.HTMLElement = window.HTMLElement;
  global.CustomEvent = window.CustomEvent;

  return { dom, window, document };
}
```

### Testing Component Rendering

```typescript
it('should render video player container', () => {
  const html = generateVideoPlayerHTML({
    videoId: 'test-123',
    title: 'Test Video',
  });

  const { document } = setupDOM(html);

  // Test container exists
  const container = document.getElementById('video-player-test-123');
  expect(container).toBeDefined();

  // Test classes
  expect(container.classList.contains('video-player-container')).toBe(true);

  // Test data attributes
  expect(container.dataset.videoId).toBe('test-123');
});
```

### Testing Props

```typescript
it('should include autoplay when enabled', () => {
  const html = generateVideoPlayerHTML({
    videoId: 'test-123',
    title: 'Test Video',
    autoplay: true,
  });

  const { document } = setupDOM(html);

  const iframe = document.querySelector('.video-iframe');
  expect(iframe.src).toContain('autoplay=1');
});
```

### Testing Accessibility

```typescript
it('should have proper ARIA attributes', () => {
  const html = generateVideoPlayerHTML({
    videoId: 'test-123',
    title: 'Test Video',
  });

  const { document } = setupDOM(html);

  // Test loading overlay
  const loadingOverlay = document.querySelector('.loading-overlay');
  expect(loadingOverlay.getAttribute('aria-live')).toBe('polite');
  expect(loadingOverlay.getAttribute('aria-busy')).toBe('true');

  // Test error overlay
  const errorOverlay = document.querySelector('.error-overlay');
  expect(errorOverlay.getAttribute('role')).toBe('alert');
  expect(errorOverlay.getAttribute('aria-live')).toBe('assertive');
});
```

### Testing Multiple Scenarios

```typescript
it('should work with different prop combinations', () => {
  const configs = [
    { videoId: 'v1', title: 'Video 1' },
    { videoId: 'v2', title: 'Video 2', autoplay: true },
    { videoId: 'v3', title: 'Video 3', muted: true },
    { videoId: 'v4', title: 'Video 4', courseId: 'c1', lessonId: 'l1' },
  ];

  configs.forEach(config => {
    const html = generateVideoPlayerHTML(config);
    const { document, dom } = setupDOM(html);

    const container = document.getElementById(`video-player-${config.videoId}`);
    expect(container).toBeDefined();

    dom.window.close();  // Cleanup
  });
});
```

### Test Cleanup

```typescript
afterEach(() => {
  if (dom) {
    dom.window.close();  // Free memory
  }
  vi.clearAllMocks();    // Reset mocks
});
```

**Why Cleanup?**
- Prevents memory leaks
- Ensures test independence
- Resets mocked functions

---

## Performance Optimization

### Lazy Loading

```html
<iframe
  src={iframeSrc}
  loading="lazy"
  class="video-iframe"
></iframe>
```

**How It Works**:
Browser delays loading iframes that are off-screen. Loads when user scrolls near them.

**Benefits**:
- Faster initial page load
- Reduced bandwidth usage
- Better performance on pages with many videos

### Efficient DOM Queries

```typescript
// Bad: Query every time
function updateProgress() {
  const container = document.getElementById('player');  // Query
  const iframe = container.querySelector('.iframe');     // Query
  // ...
}

// Good: Query once, cache reference
class VideoPlayer {
  private container: HTMLElement;
  private iframe: HTMLIFrameElement;

  constructor(containerId: string) {
    this.container = document.getElementById(containerId);  // Once
    this.iframe = this.container.querySelector('.video-iframe');  // Once
  }

  updateProgress() {
    // Use cached references
    this.iframe.contentWindow.postMessage(/* ... */);
  }
}
```

### Event Throttling

```typescript
// Progress updates throttled by:
// 1. Time: Every 10 seconds
// 2. Change: Minimum 5% progress difference

private async updateProgress(): Promise<void> {
  const progress = Math.floor(
    (this.state.currentTime / this.state.duration) * 100
  );

  // Skip if progress changed less than 5%
  if (Math.abs(progress - this.state.lastProgressUpdate) < 5) {
    return;  // Don't make API call
  }

  // Make update...
}
```

### Cleanup on Destroy

```typescript
public destroy(): void {
  // Clear intervals
  if (this.state.progressInterval) {
    clearInterval(this.state.progressInterval);
  }

  // Event listeners automatically cleaned up when DOM removed
}
```

### CSS Performance

```css
/* Use transform for animations (GPU-accelerated) */
.loading-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);  /* GPU */
  }
}

/* Avoid expensive properties */
/* Bad */
.overlay {
  box-shadow: 0 0 100px rgba(0, 0, 0, 0.9);  /* Expensive */
  filter: blur(10px);                         /* Expensive */
}

/* Good */
.overlay {
  background: rgba(0, 0, 0, 0.8);  /* Cheap */
}
```

---

## Security Considerations

### 1. Origin Verification

```typescript
window.addEventListener('message', (event) => {
  // Always verify origin
  if (!event.origin.includes('cloudflarestream.com')) {
    console.warn('Ignored message from unknown origin:', event.origin);
    return;
  }

  // Safe to process
});
```

**Attack Scenario**:
Malicious iframe sends fake 'ended' event → triggers completion of lesson user didn't watch → cheat to get certificate.

**Prevention**: Verify origin.

### 2. Iframe Sandboxing

```html
<iframe
  src={embedUrl}
  allow="autoplay; encrypted-media"  <!-- Whitelist features -->
  sandbox="allow-scripts allow-same-origin"  <!-- Restrict capabilities -->
></iframe>
```

**Sandbox Attributes**:
- `allow-scripts`: Required for player to work
- `allow-same-origin`: Required for PostMessage
- Omit `allow-top-navigation`: Prevent iframe redirecting page
- Omit `allow-forms`: Prevent form submission

### 3. Content Security Policy (CSP)

```html
<meta http-equiv="Content-Security-Policy" content="
  frame-src https://customer-*.cloudflarestream.com;
  connect-src https://customer-*.cloudflarestream.com;
">
```

Allows embedding only from Cloudflare Stream, blocks other sources.

### 4. API Endpoint Security

```typescript
// Player sends progress updates
await fetch('/api/progress/update', {
  method: 'POST',
  body: JSON.stringify({
    courseId,
    lessonId,
    progress,
  }),
});
```

**Backend MUST verify**:
1. User is authenticated
2. User is enrolled in course
3. Lesson belongs to course
4. Progress value is valid (0-100)

**Never trust client-side data!**

---

## Best Practices

### 1. Progressive Enhancement

```astro
<!-- Base: Works without JavaScript -->
<noscript>
  <p>Please enable JavaScript to view this video.</p>
  <a href="https://cloudflare.com/video/{videoId}">Watch on Cloudflare</a>
</noscript>

<!-- Enhancement: Rich player with JavaScript -->
<div class="video-player-container">
  <iframe src={embedUrl}></iframe>
</div>

<script>
  // Enhance with custom controls, progress tracking, etc.
</script>
```

### 2. Responsive Design

```css
/* 16:9 aspect ratio on all screens */
.video-iframe {
  aspect-ratio: 16 / 9;
  width: 100%;
  height: auto;
}

/* Adjust for mobile */
@media (max-width: 768px) {
  .caption-text {
    font-size: 1rem;  /* Smaller on mobile */
  }
}
```

### 3. Feedback for User Actions

```typescript
// Always provide feedback
private togglePlayPause(): void {
  if (this.state.isPlaying) {
    this.sendPlayerCommand('pause');
    this.announce('Video paused');  // Feedback
  } else {
    this.sendPlayerCommand('play');
    this.announce('Video playing');  // Feedback
  }
}
```

### 4. Error Messages

```typescript
// Bad: Technical jargon
this.showError('CORS preflight failed with status 403');

// Good: User-friendly
this.showError('Unable to load video. Please check your connection.');

// Best: Actionable
this.showError('Unable to load video. Please check your connection or try again later.');
```

### 5. Consistent Naming

```typescript
// Good: Consistent prefix
const playerId = `video-player-${videoId}`;
const cacheKey = `video:${videoId}`;
const eventName = `video:timeupdate`;

// Bad: Inconsistent
const id = `player_${videoId}`;
const key = `vid-${videoId}`;
const event = `onTimeUpdate`;
```

---

## Real-World Examples

### Example 1: Course Lesson Page

```astro
---
// src/pages/courses/[courseId]/lessons/[lessonId].astro
import VideoPlayer from '@/components/VideoPlayer.astro';
import { getLessonVideo } from '@/lib/videos';

const { courseId, lessonId } = Astro.params;
const video = await getLessonVideo(courseId, lessonId);

if (!video) {
  return Astro.redirect('/404');
}
---

<main>
  <h1>{video.title}</h1>

  <VideoPlayer
    videoId={video.cloudflare_video_id}
    title={video.title}
    courseId={courseId}
    lessonId={lessonId}
    poster={video.thumbnail_url}
    captions={[
      { src: `/captions/${video.id}/en.vtt`, label: 'English', language: 'en', default: true },
      { src: `/captions/${video.id}/es.vtt`, label: 'Spanish', language: 'es' },
    ]}
  />

  <div class="lesson-content">
    {video.description}
  </div>
</main>
```

### Example 2: Video Preview (Autoplay Muted)

```astro
<VideoPlayer
  videoId={previewVideoId}
  title="Course Preview"
  autoplay={true}
  muted={true}
  poster={thumbnailUrl}
  className="max-w-2xl mx-auto"
/>
```

### Example 3: Playlist with Progress Tracking

```astro
---
const playlist = await getCourseVideos(courseId);
---

<div class="playlist">
  {playlist.map((video, index) => (
    <div class="playlist-item">
      <VideoPlayer
        videoId={video.cloudflare_video_id}
        title={`${index + 1}. ${video.title}`}
        courseId={courseId}
        lessonId={video.lesson_id}
      />
    </div>
  ))}
</div>

<script>
  // Listen for video end, auto-play next
  document.addEventListener('videoended', (e) => {
    const nextVideo = findNextVideo(e.detail.videoId);
    if (nextVideo) {
      scrollToVideo(nextVideo);
      playVideo(nextVideo);
    }
  });
</script>
```

### Example 4: Admin Preview (No Progress Tracking)

```astro
<!-- Admin reviewing uploaded video -->
<VideoPlayer
  videoId={video.cloudflare_video_id}
  title={video.title}
  poster={video.thumbnail_url}
  <!-- No courseId/lessonId = no progress tracking -->
/>
```

---

## Conclusion

### What You Learned

1. **Video Streaming**: HLS, ABR, and why they matter
2. **Cloudflare Integration**: Iframe embed and PostMessage API
3. **Astro Components**: Server/client rendering patterns
4. **Keyboard Shortcuts**: Focus detection and standard conventions
5. **Progress Tracking**: Throttling and non-blocking updates
6. **Accessibility**: ARIA attributes, screen readers, WCAG compliance
7. **Error Handling**: Timeouts, retries, graceful degradation
8. **Testing**: JSDOM for component structure, integration tests for behavior
9. **Performance**: Lazy loading, caching, throttling
10. **Security**: Origin verification, sandboxing, CSP

### Key Takeaways

1. **Use proven solutions**: Cloudflare Stream handles complexity
2. **Focus on UX**: Keyboard shortcuts, error messages, loading states
3. **Accessibility first**: Not an afterthought, built in from start
4. **Progressive enhancement**: Works without JavaScript, better with it
5. **Security matters**: Always verify origins, never trust client data
6. **Test thoroughly**: Structure in unit tests, behavior in integration tests
7. **Performance counts**: Lazy load, throttle, cache references

### Next Steps

1. **Implement E2E tests**: Playwright tests for actual playback
2. **Add analytics**: Track engagement, drop-off points
3. **Enhance features**: Picture-in-picture, speed control, chapters
4. **Mobile optimization**: Touch gestures, responsive controls
5. **A/B testing**: Different layouts, autoplay strategies

### Resources

**Cloudflare Stream**:
- [Stream API Documentation](https://developers.cloudflare.com/stream/)
- [Player API Reference](https://developers.cloudflare.com/stream/viewing-videos/using-the-player-api/)

**Accessibility**:
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)

**HLS/Streaming**:
- [HLS Specification](https://datatracker.ietf.org/doc/html/rfc8216)
- [Adaptive Bitrate Streaming](https://en.wikipedia.org/wiki/Adaptive_bitrate_streaming)

**Testing**:
- [Vitest Documentation](https://vitest.dev/)
- [JSDOM Documentation](https://github.com/jsdom/jsdom)
- [Playwright Documentation](https://playwright.dev/)

---

**Author**: Claude Code
**Last Updated**: 2025-11-04
**Version**: 1.0
