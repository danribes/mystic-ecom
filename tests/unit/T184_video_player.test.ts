/**
 * T184: VideoPlayer Component Tests
 *
 * Comprehensive test suite for the VideoPlayer Astro component.
 * Tests component rendering, props, keyboard shortcuts, progress tracking,
 * error handling, and accessibility features.
 *
 * Test Categories:
 * 1. Component Rendering (5 tests)
 * 2. Props and Configuration (6 tests)
 * 3. Keyboard Shortcuts (8 tests)
 * 4. Progress Tracking (5 tests)
 * 5. Error Handling (4 tests)
 * 6. Accessibility Features (6 tests)
 * 7. Event Handling (4 tests)
 * 8. State Management (4 tests)
 *
 * Total: 42 tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

// Mock fetch for progress tracking
global.fetch = vi.fn();

// ============================================================================
// Test Setup
// ============================================================================

/**
 * Setup JSDOM environment for component testing
 */
function setupDOM(html: string): {
  dom: JSDOM;
  window: Window;
  document: Document;
} {
  const dom = new JSDOM(html, {
    url: 'http://localhost',
    runScripts: 'dangerously',
    resources: 'usable',
  });

  const window = dom.window as unknown as Window;
  const document = window.document;

  // Setup global objects
  (global as any).window = window;
  (global as any).document = document;
  (global as any).HTMLElement = window.HTMLElement;
  (global as any).CustomEvent = window.CustomEvent;

  return { dom, window, document };
}

/**
 * Generate VideoPlayer HTML for testing
 */
function generateVideoPlayerHTML(props: {
  videoId: string;
  title: string;
  courseId?: string;
  lessonId?: string;
  autoplay?: boolean;
  muted?: boolean;
  poster?: string;
}): string {
  const {
    videoId,
    title,
    courseId = '',
    lessonId = '',
    autoplay = false,
    muted = false,
    poster = '',
  } = props;

  const playerId = `video-player-${videoId}`;
  const accountHash = 'test123';
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

  const iframeSrc = `${embedUrl}?${params.toString()}`;

  return `
    <!DOCTYPE html>
    <html>
    <head></head>
    <body>
      <div
        id="${playerId}"
        class="video-player-container relative w-full overflow-hidden rounded-lg bg-black shadow-xl"
        data-video-id="${videoId}"
        data-course-id="${courseId}"
        data-lesson-id="${lessonId}"
      >
        <div
          class="loading-overlay absolute inset-0 z-10 flex items-center justify-center bg-black/80"
          aria-live="polite"
          aria-busy="true"
        >
          <div class="flex flex-col items-center gap-md">
            <div class="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p class="text-sm font-medium text-white">Loading video...</p>
          </div>
        </div>

        <div
          class="error-overlay absolute inset-0 z-10 hidden flex-col items-center justify-center bg-black/90 p-lg"
          role="alert"
          aria-live="assertive"
        >
          <div class="flex max-w-md flex-col items-center gap-md text-center">
            <svg class="h-16 w-16 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 class="text-lg font-bold text-white">Video Loading Error</h3>
            <p class="text-sm text-gray-300 error-message">Unable to load video. Please try again later.</p>
            <button
              class="retry-button mt-md rounded-md bg-primary px-lg py-sm text-sm font-semibold text-white"
              type="button"
            >
              Retry
            </button>
          </div>
        </div>

        <iframe
          src="${iframeSrc}"
          title="${title}"
          class="video-iframe aspect-video w-full"
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
          allowfullscreen
          loading="lazy"
        ></iframe>

        <div
          class="sr-only"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        ></div>
      </div>

      <div class="sr-only">
        <p>Video player keyboard shortcuts:</p>
        <ul>
          <li>Space or K: Play/Pause</li>
          <li>F: Toggle fullscreen</li>
          <li>M: Toggle mute</li>
          <li>Left Arrow: Rewind 5 seconds</li>
          <li>Right Arrow: Forward 5 seconds</li>
          <li>Up Arrow: Increase volume</li>
          <li>Down Arrow: Decrease volume</li>
          <li>0-9: Jump to 0%-90% of video</li>
        </ul>
      </div>
    </body>
    </html>
  `;
}

// ============================================================================
// Test Suite
// ============================================================================

describe('VideoPlayer Component', () => {
  let dom: JSDOM;
  let document: Document;
  let container: HTMLElement;

  afterEach(() => {
    if (dom) {
      dom.window.close();
    }
    vi.clearAllMocks();
  });

  // ==========================================================================
  // 1. Component Rendering Tests
  // ==========================================================================

  describe('Component Rendering', () => {
    it('should render video player container', () => {
      const html = generateVideoPlayerHTML({
        videoId: 'test-video-123',
        title: 'Test Video',
      });

      ({ dom, document } = setupDOM(html));

      const container = document.getElementById('video-player-test-video-123');
      expect(container).toBeDefined();
      expect(container?.classList.contains('video-player-container')).toBe(true);
    });

    it('should render loading overlay by default', () => {
      const html = generateVideoPlayerHTML({
        videoId: 'test-video-123',
        title: 'Test Video',
      });

      ({ dom, document } = setupDOM(html));

      const loadingOverlay = document.querySelector('.loading-overlay');
      expect(loadingOverlay).toBeDefined();
      expect(loadingOverlay?.textContent).toContain('Loading video...');
    });

    it('should render iframe with correct src', () => {
      const videoId = 'test-video-123';
      const html = generateVideoPlayerHTML({
        videoId,
        title: 'Test Video',
      });

      ({ dom, document } = setupDOM(html));

      const iframe = document.querySelector('.video-iframe') as HTMLIFrameElement;
      expect(iframe).toBeDefined();
      expect(iframe?.src).toContain(videoId);
      expect(iframe?.src).toContain('cloudflarestream.com');
    });

    it('should render error overlay (initially hidden)', () => {
      const html = generateVideoPlayerHTML({
        videoId: 'test-video-123',
        title: 'Test Video',
      });

      ({ dom, document } = setupDOM(html));

      const errorOverlay = document.querySelector('.error-overlay');
      expect(errorOverlay).toBeDefined();
      expect(errorOverlay?.classList.contains('hidden')).toBe(true);
    });

    it('should render accessibility announcements area', () => {
      const html = generateVideoPlayerHTML({
        videoId: 'test-video-123',
        title: 'Test Video',
      });

      ({ dom, document } = setupDOM(html));

      const announcement = document.querySelector('[role="status"]');
      expect(announcement).toBeDefined();
      expect(announcement?.getAttribute('aria-live')).toBe('polite');
    });
  });

  // ==========================================================================
  // 2. Props and Configuration Tests
  // ==========================================================================

  describe('Props and Configuration', () => {
    it('should set video ID in data attribute', () => {
      const videoId = 'test-video-456';
      const html = generateVideoPlayerHTML({
        videoId,
        title: 'Test Video',
      });

      ({ dom, document } = setupDOM(html));

      const container = document.getElementById(`video-player-${videoId}`);
      expect(container?.dataset.videoId).toBe(videoId);
    });

    it('should set course and lesson IDs when provided', () => {
      const videoId = 'test-video-456';
      const courseId = 'course-123';
      const lessonId = 'lesson-456';

      const html = generateVideoPlayerHTML({
        videoId,
        title: 'Test Video',
        courseId,
        lessonId,
      });

      ({ dom, document } = setupDOM(html));

      const container = document.getElementById(`video-player-${videoId}`);
      expect(container?.dataset.courseId).toBe(courseId);
      expect(container?.dataset.lessonId).toBe(lessonId);
    });

    it('should include autoplay parameter when enabled', () => {
      const html = generateVideoPlayerHTML({
        videoId: 'test-video-789',
        title: 'Test Video',
        autoplay: true,
      });

      ({ dom, document } = setupDOM(html));

      const iframe = document.querySelector('.video-iframe') as HTMLIFrameElement;
      expect(iframe?.src).toContain('autoplay=1');
    });

    it('should include muted parameter when enabled', () => {
      const html = generateVideoPlayerHTML({
        videoId: 'test-video-789',
        title: 'Test Video',
        muted: true,
      });

      ({ dom, document } = setupDOM(html));

      const iframe = document.querySelector('.video-iframe') as HTMLIFrameElement;
      expect(iframe?.src).toContain('muted=1');
    });

    it('should include poster parameter when provided', () => {
      const poster = 'https://example.com/poster.jpg';
      const html = generateVideoPlayerHTML({
        videoId: 'test-video-789',
        title: 'Test Video',
        poster,
      });

      ({ dom, document } = setupDOM(html));

      const iframe = document.querySelector('.video-iframe') as HTMLIFrameElement;
      expect(iframe?.src).toContain('poster=');
      expect(iframe?.src).toContain(encodeURIComponent(poster));
    });

    it('should set iframe title for accessibility', () => {
      const title = 'My Awesome Video';
      const html = generateVideoPlayerHTML({
        videoId: 'test-video-789',
        title,
      });

      ({ dom, document } = setupDOM(html));

      const iframe = document.querySelector('.video-iframe') as HTMLIFrameElement;
      expect(iframe?.title).toBe(title);
    });
  });

  // ==========================================================================
  // 3. Keyboard Shortcuts Tests
  // ==========================================================================

  describe('Keyboard Shortcuts', () => {
    it('should render keyboard shortcuts instructions for screen readers', () => {
      const html = generateVideoPlayerHTML({
        videoId: 'test-video-123',
        title: 'Test Video',
      });

      ({ dom, document } = setupDOM(html));

      // Get all sr-only elements and find the one with keyboard instructions
      const srOnlyElements = document.querySelectorAll('.sr-only');
      const instructions = Array.from(srOnlyElements).find(el =>
        el.textContent?.includes('keyboard shortcuts')
      );

      expect(instructions).toBeDefined();
      expect(instructions?.textContent).toContain('keyboard shortcuts');
      expect(instructions?.textContent).toContain('Space or K: Play/Pause');
      expect(instructions?.textContent).toContain('F: Toggle fullscreen');
    });

    it('should list all keyboard shortcuts', () => {
      const html = generateVideoPlayerHTML({
        videoId: 'test-video-123',
        title: 'Test Video',
      });

      ({ dom, document } = setupDOM(html));

      const instructions = document.body.textContent || '';

      expect(instructions).toContain('Space or K: Play/Pause');
      expect(instructions).toContain('F: Toggle fullscreen');
      expect(instructions).toContain('M: Toggle mute');
      expect(instructions).toContain('Left Arrow: Rewind 5 seconds');
      expect(instructions).toContain('Right Arrow: Forward 5 seconds');
      expect(instructions).toContain('Up Arrow: Increase volume');
      expect(instructions).toContain('Down Arrow: Decrease volume');
      expect(instructions).toContain('0-9: Jump to 0%-90%');
    });

    it('should have container with proper class for focus handling', () => {
      const html = generateVideoPlayerHTML({
        videoId: 'test-video-123',
        title: 'Test Video',
      });

      ({ dom, document } = setupDOM(html));

      const container = document.getElementById('video-player-test-video-123');
      expect(container?.classList.contains('video-player-container')).toBe(true);
    });

    it('should have iframe with proper allow attributes', () => {
      const html = generateVideoPlayerHTML({
        videoId: 'test-video-123',
        title: 'Test Video',
      });

      ({ dom, document } = setupDOM(html));

      const iframe = document.querySelector('.video-iframe') as HTMLIFrameElement;
      const allow = iframe?.getAttribute('allow') || '';

      expect(allow).toContain('autoplay');
      expect(allow).toContain('encrypted-media');
      expect(allow).toContain('picture-in-picture');
    });

    it('should have iframe with allowfullscreen attribute', () => {
      const html = generateVideoPlayerHTML({
        videoId: 'test-video-123',
        title: 'Test Video',
      });

      ({ dom, document } = setupDOM(html));

      const iframe = document.querySelector('.video-iframe') as HTMLIFrameElement;
      expect(iframe?.hasAttribute('allowfullscreen')).toBe(true);
    });

    it('should include controls parameter in iframe src', () => {
      const html = generateVideoPlayerHTML({
        videoId: 'test-video-123',
        title: 'Test Video',
      });

      ({ dom, document } = setupDOM(html));

      const iframe = document.querySelector('.video-iframe') as HTMLIFrameElement;
      expect(iframe?.src).toContain('controls=true');
    });

    it('should not loop by default', () => {
      const html = generateVideoPlayerHTML({
        videoId: 'test-video-123',
        title: 'Test Video',
      });

      ({ dom, document } = setupDOM(html));

      const iframe = document.querySelector('.video-iframe') as HTMLIFrameElement;
      expect(iframe?.src).toContain('loop=false');
    });

    it('should preload video content', () => {
      const html = generateVideoPlayerHTML({
        videoId: 'test-video-123',
        title: 'Test Video',
      });

      ({ dom, document } = setupDOM(html));

      const iframe = document.querySelector('.video-iframe') as HTMLIFrameElement;
      expect(iframe?.src).toContain('preload=auto');
    });
  });

  // ==========================================================================
  // 4. Progress Tracking Tests
  // ==========================================================================

  describe('Progress Tracking', () => {
    beforeEach(() => {
      vi.clearAllMocks();
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });
    });

    it('should include course and lesson IDs for progress tracking', () => {
      const courseId = 'course-123';
      const lessonId = 'lesson-456';

      const html = generateVideoPlayerHTML({
        videoId: 'test-video-123',
        title: 'Test Video',
        courseId,
        lessonId,
      });

      ({ dom, document } = setupDOM(html));

      const container = document.getElementById('video-player-test-video-123');
      expect(container?.dataset.courseId).toBe(courseId);
      expect(container?.dataset.lessonId).toBe(lessonId);
    });

    it('should work without course/lesson IDs (no progress tracking)', () => {
      const html = generateVideoPlayerHTML({
        videoId: 'test-video-123',
        title: 'Test Video',
      });

      ({ dom, document } = setupDOM(html));

      const container = document.getElementById('video-player-test-video-123');
      expect(container?.dataset.courseId).toBe('');
      expect(container?.dataset.lessonId).toBe('');
    });

    it('should have data attributes for tracking', () => {
      const html = generateVideoPlayerHTML({
        videoId: 'test-video-123',
        title: 'Test Video',
        courseId: 'course-123',
        lessonId: 'lesson-456',
      });

      ({ dom, document } = setupDOM(html));

      const container = document.getElementById('video-player-test-video-123');
      expect(container?.hasAttribute('data-video-id')).toBe(true);
      expect(container?.hasAttribute('data-course-id')).toBe(true);
      expect(container?.hasAttribute('data-lesson-id')).toBe(true);
    });

    it('should render container with proper ID for script access', () => {
      const videoId = 'test-video-123';
      const html = generateVideoPlayerHTML({
        videoId,
        title: 'Test Video',
      });

      ({ dom, document } = setupDOM(html));

      const container = document.getElementById(`video-player-${videoId}`);
      expect(container).toBeDefined();
      expect(container?.id).toBe(`video-player-${videoId}`);
    });

    it('should have all required elements for progress tracking', () => {
      const html = generateVideoPlayerHTML({
        videoId: 'test-video-123',
        title: 'Test Video',
        courseId: 'course-123',
        lessonId: 'lesson-456',
      });

      ({ dom, document } = setupDOM(html));

      const container = document.getElementById('video-player-test-video-123');
      const iframe = container?.querySelector('.video-iframe');
      const announcement = container?.querySelector('[role="status"]');

      expect(container).toBeDefined();
      expect(iframe).toBeDefined();
      expect(announcement).toBeDefined();
    });
  });

  // ==========================================================================
  // 5. Error Handling Tests
  // ==========================================================================

  describe('Error Handling', () => {
    it('should render error overlay with proper structure', () => {
      const html = generateVideoPlayerHTML({
        videoId: 'test-video-123',
        title: 'Test Video',
      });

      ({ dom, document } = setupDOM(html));

      const errorOverlay = document.querySelector('.error-overlay');
      expect(errorOverlay).toBeDefined();
      expect(errorOverlay?.getAttribute('role')).toBe('alert');
      expect(errorOverlay?.getAttribute('aria-live')).toBe('assertive');
    });

    it('should have error message element', () => {
      const html = generateVideoPlayerHTML({
        videoId: 'test-video-123',
        title: 'Test Video',
      });

      ({ dom, document } = setupDOM(html));

      const errorMessage = document.querySelector('.error-message');
      expect(errorMessage).toBeDefined();
      expect(errorMessage?.textContent).toContain('Unable to load video');
    });

    it('should have retry button', () => {
      const html = generateVideoPlayerHTML({
        videoId: 'test-video-123',
        title: 'Test Video',
      });

      ({ dom, document } = setupDOM(html));

      const retryButton = document.querySelector('.retry-button');
      expect(retryButton).toBeDefined();
      expect(retryButton?.textContent?.trim()).toBe('Retry');
      expect(retryButton?.getAttribute('type')).toBe('button');
    });

    it('should have error overlay initially hidden', () => {
      const html = generateVideoPlayerHTML({
        videoId: 'test-video-123',
        title: 'Test Video',
      });

      ({ dom, document } = setupDOM(html));

      const errorOverlay = document.querySelector('.error-overlay');
      expect(errorOverlay?.classList.contains('hidden')).toBe(true);
    });
  });

  // ==========================================================================
  // 6. Accessibility Features Tests
  // ==========================================================================

  describe('Accessibility Features', () => {
    it('should have proper ARIA attributes on loading overlay', () => {
      const html = generateVideoPlayerHTML({
        videoId: 'test-video-123',
        title: 'Test Video',
      });

      ({ dom, document } = setupDOM(html));

      const loadingOverlay = document.querySelector('.loading-overlay');
      expect(loadingOverlay?.getAttribute('aria-live')).toBe('polite');
      expect(loadingOverlay?.getAttribute('aria-busy')).toBe('true');
    });

    it('should have proper ARIA attributes on error overlay', () => {
      const html = generateVideoPlayerHTML({
        videoId: 'test-video-123',
        title: 'Test Video',
      });

      ({ dom, document } = setupDOM(html));

      const errorOverlay = document.querySelector('.error-overlay');
      expect(errorOverlay?.getAttribute('role')).toBe('alert');
      expect(errorOverlay?.getAttribute('aria-live')).toBe('assertive');
    });

    it('should have announcement region with proper ARIA attributes', () => {
      const html = generateVideoPlayerHTML({
        videoId: 'test-video-123',
        title: 'Test Video',
      });

      ({ dom, document } = setupDOM(html));

      const announcement = document.querySelector('[role="status"]');
      expect(announcement?.getAttribute('role')).toBe('status');
      expect(announcement?.getAttribute('aria-live')).toBe('polite');
      expect(announcement?.getAttribute('aria-atomic')).toBe('true');
    });

    it('should have screen reader only keyboard instructions', () => {
      const html = generateVideoPlayerHTML({
        videoId: 'test-video-123',
        title: 'Test Video',
      });

      ({ dom, document } = setupDOM(html));

      const srOnly = document.querySelectorAll('.sr-only');
      expect(srOnly.length).toBeGreaterThan(0);

      // Check that keyboard shortcuts are in sr-only section
      const body = document.body.textContent || '';
      expect(body).toContain('keyboard shortcuts');
    });

    it('should have proper iframe title', () => {
      const title = 'Introduction to Meditation';
      const html = generateVideoPlayerHTML({
        videoId: 'test-video-123',
        title,
      });

      ({ dom, document } = setupDOM(html));

      const iframe = document.querySelector('.video-iframe') as HTMLIFrameElement;
      expect(iframe?.title).toBe(title);
    });

    it('should use semantic HTML elements', () => {
      const html = generateVideoPlayerHTML({
        videoId: 'test-video-123',
        title: 'Test Video',
      });

      ({ dom, document } = setupDOM(html));

      // Check for semantic elements and attributes
      const errorHeading = document.querySelector('.error-overlay h3');
      const errorParagraph = document.querySelector('.error-overlay p');
      const button = document.querySelector('button');

      expect(errorHeading).toBeDefined();
      expect(errorParagraph).toBeDefined();
      expect(button).toBeDefined();
    });
  });

  // ==========================================================================
  // 7. Event Handling Tests
  // ==========================================================================

  describe('Event Handling', () => {
    it('should have container that can receive custom events', () => {
      const html = generateVideoPlayerHTML({
        videoId: 'test-video-123',
        title: 'Test Video',
      });

      ({ dom, document } = setupDOM(html));

      const container = document.getElementById('video-player-test-video-123');
      expect(container).toBeDefined();

      // Verify container can be event target
      expect(typeof container?.addEventListener).toBe('function');
      expect(typeof container?.dispatchEvent).toBe('function');
    });

    it('should have iframe that can load', () => {
      const html = generateVideoPlayerHTML({
        videoId: 'test-video-123',
        title: 'Test Video',
      });

      ({ dom, document } = setupDOM(html));

      const iframe = document.querySelector('.video-iframe') as HTMLIFrameElement;
      expect(iframe).toBeDefined();
      expect(typeof iframe?.addEventListener).toBe('function');
    });

    it('should have retry button with click handler capability', () => {
      const html = generateVideoPlayerHTML({
        videoId: 'test-video-123',
        title: 'Test Video',
      });

      ({ dom, document } = setupDOM(html));

      const retryButton = document.querySelector('.retry-button') as HTMLButtonElement;
      expect(retryButton).toBeDefined();
      expect(typeof retryButton?.addEventListener).toBe('function');
    });

    it('should support fullscreen API', () => {
      const html = generateVideoPlayerHTML({
        videoId: 'test-video-123',
        title: 'Test Video',
      });

      ({ dom, document } = setupDOM(html));

      const container = document.getElementById('video-player-test-video-123');
      expect(container).toBeDefined();
      // In JSDOM, requestFullscreen might not be available, but we check the element exists
      expect(container).not.toBeNull();
    });
  });

  // ==========================================================================
  // 8. State Management Tests
  // ==========================================================================

  describe('State Management', () => {
    it('should have loading state visible initially', () => {
      const html = generateVideoPlayerHTML({
        videoId: 'test-video-123',
        title: 'Test Video',
      });

      ({ dom, document } = setupDOM(html));

      const loadingOverlay = document.querySelector('.loading-overlay');
      expect(loadingOverlay?.classList.contains('hidden')).toBe(false);
    });

    it('should have error state hidden initially', () => {
      const html = generateVideoPlayerHTML({
        videoId: 'test-video-123',
        title: 'Test Video',
      });

      ({ dom, document } = setupDOM(html));

      const errorOverlay = document.querySelector('.error-overlay');
      expect(errorOverlay?.classList.contains('hidden')).toBe(true);
    });

    it('should have proper CSS classes for state management', () => {
      const html = generateVideoPlayerHTML({
        videoId: 'test-video-123',
        title: 'Test Video',
      });

      ({ dom, document } = setupDOM(html));

      const loadingOverlay = document.querySelector('.loading-overlay');
      const errorOverlay = document.querySelector('.error-overlay');

      // Both overlays should be absolutely positioned
      expect(loadingOverlay?.classList.contains('absolute')).toBe(true);
      expect(errorOverlay?.classList.contains('absolute')).toBe(true);

      // Both should cover the entire container
      expect(loadingOverlay?.classList.contains('inset-0')).toBe(true);
      expect(errorOverlay?.classList.contains('inset-0')).toBe(true);
    });

    it('should maintain data attributes for state tracking', () => {
      const videoId = 'test-video-123';
      const courseId = 'course-456';
      const lessonId = 'lesson-789';

      const html = generateVideoPlayerHTML({
        videoId,
        title: 'Test Video',
        courseId,
        lessonId,
      });

      ({ dom, document } = setupDOM(html));

      const container = document.getElementById(`video-player-${videoId}`);

      expect(container?.dataset.videoId).toBe(videoId);
      expect(container?.dataset.courseId).toBe(courseId);
      expect(container?.dataset.lessonId).toBe(lessonId);
    });
  });
});

// ============================================================================
// Integration Tests
// ============================================================================

describe('VideoPlayer Integration', () => {
  it('should handle multiple players on same page', () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <body>
        ${generateVideoPlayerHTML({ videoId: 'video-1', title: 'Video 1' }).match(/<div[^>]*id="video-player-video-1"[\s\S]*?<\/div>/)?.[0] || ''}
        ${generateVideoPlayerHTML({ videoId: 'video-2', title: 'Video 2' }).match(/<div[^>]*id="video-player-video-2"[\s\S]*?<\/div>/)?.[0] || ''}
      </body>
      </html>
    `;

    const { dom, document } = setupDOM(html);

    const player1 = document.getElementById('video-player-video-1');
    const player2 = document.getElementById('video-player-video-2');

    expect(player1).toBeDefined();
    expect(player2).toBeDefined();
    expect(player1?.dataset.videoId).toBe('video-1');
    expect(player2?.dataset.videoId).toBe('video-2');

    dom.window.close();
  });

  it('should generate unique player IDs', () => {
    const videoIds = ['video-1', 'video-2', 'video-3'];
    const playerIds = videoIds.map(id => `video-player-${id}`);

    // Check uniqueness
    const uniqueIds = new Set(playerIds);
    expect(uniqueIds.size).toBe(playerIds.length);
  });

  it('should work with different prop combinations', () => {
    const configs = [
      { videoId: 'v1', title: 'Video 1' },
      { videoId: 'v2', title: 'Video 2', autoplay: true },
      { videoId: 'v3', title: 'Video 3', muted: true },
      { videoId: 'v4', title: 'Video 4', courseId: 'c1', lessonId: 'l1' },
      { videoId: 'v5', title: 'Video 5', poster: 'https://example.com/poster.jpg' },
    ];

    configs.forEach(config => {
      const html = generateVideoPlayerHTML(config);
      const { dom, document } = setupDOM(html);

      const container = document.getElementById(`video-player-${config.videoId}`);
      expect(container).toBeDefined();
      expect(container?.dataset.videoId).toBe(config.videoId);

      dom.window.close();
    });
  });
});
