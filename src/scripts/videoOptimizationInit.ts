/**
 * Video Optimization Initialization (T192)
 *
 * Client-side script to initialize video optimizations on page load.
 * Handles:
 * - Lazy loading of videos and thumbnails
 * - Preloading of next lesson video
 * - Web Vitals tracking
 * - Network-aware optimizations
 *
 * Usage: Import this script in pages with video content
 */

import {
  lazyLoadVideos,
  lazyLoadThumbnails,
  preloadVideo,
  getPreloadPriority,
  reportVideoWebVitals,
  getNetworkInfo,
} from '../lib/videoOptimization';
import { logger } from '../lib/logger';

// ============================================================================
// Initialize on DOM Ready
// ============================================================================

function initVideoOptimizations(): void {
  logger.debug('Initializing video optimizations...');

  // 1. Initialize lazy loading for video iframes
  const cleanupVideos = lazyLoadVideos('[data-lazy-video]', {
    rootMargin: '300px', // Start loading 300px before viewport
    threshold: 0.01,
    onLoad: (element) => {
      logger.debug('Video lazy loaded:', element);

      // Dispatch custom event
      element.dispatchEvent(new CustomEvent('videolazyloaded', {
        bubbles: true,
        detail: { videoId: element.getAttribute('data-video-id') }
      }));
    },
    onError: (element, error) => {
      logger.error('Video lazy load error:', error);
      element.classList.add('lazy-load-error');
    },
  });

  // 2. Initialize lazy loading for video thumbnails
  const cleanupThumbnails = lazyLoadThumbnails('[data-lazy-thumbnail]', {
    rootMargin: '400px', // Thumbnails can load earlier than videos
    threshold: 0.01,
    onLoad: (img) => {
      logger.debug('Thumbnail lazy loaded:', img.alt);

      // Add fade-in effect
      img.classList.add('fade-in');
    },
    onError: (img, error) => {
      logger.error('Thumbnail lazy load error:', error);

      // Show placeholder on error
      img.classList.add('thumbnail-error');
      img.src = '/images/video-placeholder.svg';
    },
  });

  // 3. Preload next lesson video (if on course lesson page)
  preloadNextLesson();

  // 4. Report Web Vitals for video performance monitoring
  reportVideoWebVitals();

  // 5. Log network information (for debugging)
  const networkInfo = getNetworkInfo();
  if (networkInfo) {
    logger.debug('Network info:', networkInfo);

    // Show data saver notice if enabled
    if (networkInfo.saveData) {
      showDataSaverNotice();
    }
  }

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    cleanupVideos();
    cleanupThumbnails();
  });

  logger.debug('Video optimizations initialized successfully');
}

// ============================================================================
// Preload Next Lesson
// ============================================================================

/**
 * Preload the next lesson's video for faster navigation
 */
function preloadNextLesson(): void {
  // Find next lesson link (if exists)
  const nextLessonButton = document.querySelector('[data-next-lesson-video]');

  if (!nextLessonButton) {
    return; // Not on a lesson page or no next lesson
  }

  const nextVideoId = nextLessonButton.getAttribute('data-next-lesson-video');

  if (!nextVideoId) {
    return;
  }

  // Check network conditions before preloading
  const preloadPriority = getPreloadPriority();

  if (preloadPriority === null) {
    logger.debug('Skipping video preload due to slow network');
    return;
  }

  // Preload next video after current video starts playing
  const currentVideoPlayer = document.querySelector('[data-video-id]');

  if (currentVideoPlayer) {
    // Listen for video play event
    currentVideoPlayer.addEventListener('videotimeupdate', (event: Event) => {
      const customEvent = event as CustomEvent;
      const { progress } = customEvent.detail;

      // Preload when current video is 25% complete
      if (progress > 25 && !preloadNextLesson.preloaded) {
        logger.debug(`Preloading next lesson video: ${nextVideoId}`);
        preloadVideo(nextVideoId, { priority: preloadPriority });
        preloadNextLesson.preloaded = true;
      }
    }, { once: false });
  } else {
    // If no current video is playing, preload immediately (low priority)
    setTimeout(() => {
      if (preloadPriority !== null) {
        logger.debug(`Preloading next lesson video (idle): ${nextVideoId}`);
        preloadVideo(nextVideoId, { priority: 'low' });
      }
    }, 2000); // Wait 2 seconds after page load
  }
}

// Track if next lesson has been preloaded
preloadNextLesson.preloaded = false;

// ============================================================================
// Data Saver Notice
// ============================================================================

/**
 * Show notice if user has data saver enabled
 */
function showDataSaverNotice(): void {
  const existingNotice = document.querySelector('.data-saver-notice');

  if (existingNotice) {
    return; // Already shown
  }

  const notice = document.createElement('div');
  notice.className = 'data-saver-notice fixed bottom-4 right-4 z-50 max-w-sm rounded-lg bg-blue-50 p-4 shadow-lg border border-blue-200';
  notice.innerHTML = `
    <div class="flex items-start gap-3">
      <svg class="h-5 w-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <div class="flex-1">
        <h3 class="text-sm font-semibold text-blue-900">Data Saver Enabled</h3>
        <p class="mt-1 text-sm text-blue-700">
          Video quality has been reduced to save bandwidth. You can change this in your browser settings.
        </p>
      </div>
      <button
        class="data-saver-close flex-shrink-0 text-blue-600 hover:text-blue-800"
        aria-label="Close"
      >
        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  `;

  document.body.appendChild(notice);

  // Close button
  const closeButton = notice.querySelector('.data-saver-close');
  closeButton?.addEventListener('click', () => {
    notice.remove();

    // Remember that user dismissed notice
    sessionStorage.setItem('data-saver-notice-dismissed', 'true');
  });

  // Auto-dismiss after 10 seconds
  setTimeout(() => {
    if (notice.parentElement) {
      notice.classList.add('fade-out');
      setTimeout(() => notice.remove(), 300);
    }
  }, 10000);

  // Check if user previously dismissed
  const dismissed = sessionStorage.getItem('data-saver-notice-dismissed');
  if (dismissed === 'true') {
    notice.remove();
  }
}

// ============================================================================
// Initialize
// ============================================================================

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initVideoOptimizations);
} else {
  // DOM already loaded
  initVideoOptimizations();
}

// Export for testing
export { initVideoOptimizations, preloadNextLesson, showDataSaverNotice };
