/**
 * Video Optimization Utilities (T192)
 *
 * Utilities for optimizing video delivery including:
 * - WebP thumbnail generation and conversion
 * - Video preloading strategies
 * - Adaptive bitrate selection
 * - Lazy loading helpers
 * - CDN optimization
 *
 * Integration:
 * - Cloudflare Stream API
 * - Browser APIs (IntersectionObserver, Network Information)
 * - Image optimization
 */

import { logger } from './logger';

// ============================================================================
// Types
// ============================================================================

export interface ThumbnailOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpeg' | 'webp' | 'png';
  fit?: 'cover' | 'contain' | 'crop' | 'scale-down';
  time?: number; // Timestamp in seconds for video thumbnail
}

export interface PreloadOptions {
  priority?: 'high' | 'low' | 'auto';
  crossOrigin?: 'anonymous' | 'use-credentials';
}

export interface LazyLoadOptions {
  root?: Element | null;
  rootMargin?: string;
  threshold?: number | number[];
  onLoad?: (element: Element) => void;
  onError?: (element: Element, error: Error) => void;
}

export interface NetworkInfo {
  effectiveType: '4g' | '3g' | '2g' | 'slow-2g';
  downlink: number; // Mbps
  rtt: number; // ms
  saveData: boolean;
}

// ============================================================================
// WebP Thumbnail Optimization
// ============================================================================

/**
 * Get optimized thumbnail URL from Cloudflare Stream
 *
 * Cloudflare Stream provides dynamic thumbnail generation with format conversion.
 * Supports WebP format for better compression (25-35% smaller than JPEG).
 *
 * URL format: https://videodelivery.net/{id}/thumbnails/thumbnail.{format}
 * Query parameters:
 * - time: Timestamp in seconds (default: middle of video)
 * - width: Width in pixels
 * - height: Height in pixels
 * - fit: Resize mode (cover, contain, crop, scale-down)
 *
 * @param videoId - Cloudflare Stream video ID
 * @param options - Thumbnail generation options
 * @returns Optimized thumbnail URL
 */
export function getOptimizedThumbnail(
  videoId: string,
  options: ThumbnailOptions = {}
): string {
  const {
    width,
    height,
    quality = 85,
    format = 'webp', // Default to WebP for better compression
    fit = 'cover',
    time,
  } = options;

  // Base Cloudflare Stream thumbnail URL
  const baseUrl = `https://videodelivery.net/${videoId}/thumbnails/thumbnail.${format}`;

  // Build query parameters
  const params = new URLSearchParams();

  if (width !== undefined) params.append('width', width.toString());
  if (height !== undefined) params.append('height', height.toString());
  if (quality !== 85) params.append('quality', quality.toString());
  if (fit !== 'cover') params.append('fit', fit);
  if (time !== undefined) params.append('time', `${Math.floor(time)}s`);

  const queryString = params.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

/**
 * Get responsive thumbnail srcset for different screen sizes
 *
 * Generates multiple thumbnail sizes for responsive images.
 * Browsers will automatically select the best size based on screen resolution.
 *
 * @param videoId - Cloudflare Stream video ID
 * @param options - Base thumbnail options
 * @returns srcset string for <img> element
 */
export function getResponsiveThumbnailSrcset(
  videoId: string,
  options: ThumbnailOptions = {}
): string {
  const { format = 'webp', fit = 'cover', time } = options;

  const widths = [320, 640, 960, 1280, 1920]; // Common breakpoints

  const srcsetParts = widths.map(width => {
    const url = getOptimizedThumbnail(videoId, {
      ...options,
      width,
      format,
      fit,
      time,
    });
    return `${url} ${width}w`;
  });

  return srcsetParts.join(', ');
}

/**
 * Get picture element sources for WebP fallback
 *
 * Provides WebP with JPEG fallback for browsers that don't support WebP.
 * Modern browsers will use WebP (smaller), older browsers fall back to JPEG.
 *
 * @param videoId - Cloudflare Stream video ID
 * @param options - Thumbnail options
 * @returns Object with WebP and JPEG sources
 */
export function getThumbnailPictureSources(
  videoId: string,
  options: ThumbnailOptions = {}
): { webp: string; jpeg: string; webpSrcset: string; jpegSrcset: string } {
  const webp = getOptimizedThumbnail(videoId, { ...options, format: 'webp' });
  const jpeg = getOptimizedThumbnail(videoId, { ...options, format: 'jpeg' });

  const webpSrcset = getResponsiveThumbnailSrcset(videoId, {
    ...options,
    format: 'webp',
  });
  const jpegSrcset = getResponsiveThumbnailSrcset(videoId, {
    ...options,
    format: 'jpeg',
  });

  return { webp, jpeg, webpSrcset, jpegSrcset };
}

// ============================================================================
// Video Preloading
// ============================================================================

/**
 * Preload video for next lesson
 *
 * Uses <link rel="preload"> to hint the browser to download the next video.
 * Improves perceived performance by reducing wait time on navigation.
 *
 * @param videoId - Cloudflare Stream video ID to preload
 * @param options - Preload options
 */
export function preloadVideo(
  videoId: string,
  options: PreloadOptions = {}
): void {
  const { priority = 'low', crossOrigin = 'anonymous' } = options;

  // Check if already preloaded
  const existingPreload = document.querySelector(
    `link[rel="preload"][data-video-id="${videoId}"]`
  );
  if (existingPreload) {
    return; // Already preloaded
  }

  // Create preload link for HLS manifest
  const manifestUrl = `https://videodelivery.net/${videoId}/manifest/video.m3u8`;

  const preloadLink = document.createElement('link');
  preloadLink.setAttribute('rel', 'preload');
  preloadLink.setAttribute('as', 'fetch');
  preloadLink.setAttribute('href', manifestUrl);
  preloadLink.setAttribute('crossorigin', crossOrigin);
  preloadLink.dataset.videoId = videoId;

  // Set priority (Chrome supports fetchpriority)
  if ('fetchPriority' in HTMLLinkElement.prototype) {
    preloadLink.setAttribute('fetchpriority', priority);
  }

  document.head.appendChild(preloadLink);

  logger.debug(`Preloaded video: ${videoId}`);
}

/**
 * Preload thumbnail for faster display
 *
 * @param videoId - Cloudflare Stream video ID
 * @param options - Thumbnail options
 */
export function preloadThumbnail(
  videoId: string,
  options: ThumbnailOptions = {}
): void {
  const thumbnailUrl = getOptimizedThumbnail(videoId, options);

  // Check if already preloaded
  const existingPreload = document.querySelector(
    `link[rel="preload"][href="${thumbnailUrl}"]`
  );
  if (existingPreload) {
    return;
  }

  const preloadLink = document.createElement('link');
  preloadLink.setAttribute('rel', 'preload');
  preloadLink.setAttribute('as', 'image');
  preloadLink.setAttribute('href', thumbnailUrl);
  preloadLink.setAttribute('type', `image/${options.format || 'webp'}`);

  document.head.appendChild(preloadLink);
}

/**
 * Get preload priority based on network conditions
 *
 * Uses Network Information API to determine optimal preload strategy.
 * On slow connections, skip preloading to save bandwidth.
 *
 * @returns Preload priority or null if should skip
 */
export function getPreloadPriority(): 'high' | 'low' | null {
  // Check if Network Information API is available
  const connection = (navigator as any).connection ||
    (navigator as any).mozConnection ||
    (navigator as any).webkitConnection;

  if (!connection) {
    return 'low'; // Default to low priority if API not available
  }

  const effectiveType = connection.effectiveType;
  const saveData = connection.saveData;

  // Don't preload if user has data saver enabled
  if (saveData) {
    return null;
  }

  // Adjust priority based on connection speed
  if (effectiveType === '4g') {
    return 'high';
  } else if (effectiveType === '3g') {
    return 'low';
  } else {
    return null; // Skip preloading on 2g/slow-2g
  }
}

// ============================================================================
// Lazy Loading
// ============================================================================

/**
 * Lazy load videos using Intersection Observer
 *
 * Videos are only loaded when they enter the viewport.
 * Significantly improves initial page load performance.
 *
 * @param selector - CSS selector for video elements to lazy load
 * @param options - Lazy load options
 * @returns Cleanup function to disconnect observer
 */
export function lazyLoadVideos(
  selector: string = '[data-lazy-video]',
  options: LazyLoadOptions = {}
): () => void {
  const {
    root = null,
    rootMargin = '200px', // Start loading 200px before entering viewport
    threshold = 0.01,
    onLoad,
    onError,
  } = options;

  // Check if Intersection Observer is supported
  if (!('IntersectionObserver' in window)) {
    // Fallback: load all videos immediately
    const videos = document.querySelectorAll(selector);
    videos.forEach(video => loadVideo(video as HTMLElement));
    return () => {}; // No cleanup needed
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const element = entry.target as HTMLElement;

          try {
            loadVideo(element);
            observer.unobserve(element);

            if (onLoad) {
              onLoad(element);
            }
          } catch (error) {
            logger.error('Failed to lazy load video:', error);

            if (onError) {
              onError(element, error as Error);
            }
          }
        }
      });
    },
    { root, rootMargin, threshold }
  );

  // Observe all matching elements
  const elements = document.querySelectorAll(selector);
  elements.forEach(element => observer.observe(element));

  // Return cleanup function
  return () => observer.disconnect();
}

/**
 * Load a lazy video element
 *
 * @param element - Video element to load
 */
function loadVideo(element: HTMLElement): void {
  const videoId = element.dataset.videoId;
  const lazyVideoSrc = element.dataset.lazyVideo;

  if (lazyVideoSrc) {
    const iframe = element.querySelector('iframe');
    if (iframe && !iframe.src) {
      iframe.src = lazyVideoSrc;
      element.classList.add('loaded');
      element.removeAttribute('data-lazy-video');
    }
  }

  if (videoId) {
    // Trigger loading by adding class
    element.classList.add('loading');
  }
}

/**
 * Lazy load thumbnails using Intersection Observer
 *
 * @param selector - CSS selector for thumbnail images
 * @param options - Lazy load options
 * @returns Cleanup function
 */
export function lazyLoadThumbnails(
  selector: string = '[data-lazy-thumbnail]',
  options: LazyLoadOptions = {}
): () => void {
  const {
    root = null,
    rootMargin = '200px',
    threshold = 0.01,
    onLoad,
    onError,
  } = options;

  if (!('IntersectionObserver' in window)) {
    // Fallback: load all thumbnails immediately
    const thumbnails = document.querySelectorAll(selector);
    thumbnails.forEach(img => loadThumbnail(img as HTMLImageElement));
    return () => {};
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;

          try {
            loadThumbnail(img);
            observer.unobserve(img);

            if (onLoad) {
              onLoad(img);
            }
          } catch (error) {
            logger.error('Failed to lazy load thumbnail:', error);

            if (onError) {
              onError(img, error as Error);
            }
          }
        }
      });
    },
    { root, rootMargin, threshold }
  );

  const images = document.querySelectorAll(selector);
  images.forEach(img => observer.observe(img));

  return () => observer.disconnect();
}

/**
 * Load a lazy thumbnail image
 *
 * @param img - Image element to load
 */
function loadThumbnail(img: HTMLImageElement): void {
  const lazySrc = img.dataset.lazyThumbnail;
  const lazySrcset = img.dataset.lazySrcset;

  if (lazySrc) {
    img.src = lazySrc;
    img.removeAttribute('data-lazy-thumbnail');
  }

  if (lazySrcset) {
    img.srcset = lazySrcset;
    img.removeAttribute('data-lazy-srcset');
  }

  img.classList.add('loaded');
}

// ============================================================================
// Adaptive Bitrate Selection
// ============================================================================

/**
 * Get recommended video quality based on network conditions
 *
 * Uses Network Information API to recommend appropriate video quality.
 * Cloudflare Stream automatically handles ABR, but this can be used for UI hints.
 *
 * @returns Recommended quality level
 */
export function getRecommendedQuality(): 'auto' | '1080p' | '720p' | '480p' | '360p' {
  const connection = (navigator as any).connection ||
    (navigator as any).mozConnection ||
    (navigator as any).webkitConnection;

  if (!connection) {
    return 'auto'; // Let Cloudflare Stream decide
  }

  const effectiveType = connection.effectiveType;
  const saveData = connection.saveData;

  if (saveData) {
    return '360p'; // Lowest quality for data saver
  }

  switch (effectiveType) {
    case '4g':
      return '1080p';
    case '3g':
      return '720p';
    case '2g':
      return '480p';
    case 'slow-2g':
      return '360p';
    default:
      return 'auto';
  }
}

/**
 * Get network information (if available)
 *
 * @returns Network information or null if API not available
 */
export function getNetworkInfo(): NetworkInfo | null {
  const connection = (navigator as any).connection ||
    (navigator as any).mozConnection ||
    (navigator as any).webkitConnection;

  if (!connection) {
    return null;
  }

  return {
    effectiveType: connection.effectiveType || '4g',
    downlink: connection.downlink || 10,
    rtt: connection.rtt || 50,
    saveData: connection.saveData || false,
  };
}

// ============================================================================
// Performance Monitoring
// ============================================================================

/**
 * Measure video load time using Performance API
 *
 * @param videoId - Video ID to track
 * @param startTime - Start timestamp
 */
export function measureVideoLoadTime(videoId: string, startTime: number): void {
  const loadTime = performance.now() - startTime;

  logger.debug(`Video ${videoId} loaded in ${loadTime.toFixed(2)}ms`);

  // Send to analytics (if available)
  if (typeof window !== 'undefined' && (window as any).analytics) {
    (window as any).analytics.track('Video Load Time', {
      videoId,
      loadTime,
      networkInfo: getNetworkInfo(),
    });
  }
}

/**
 * Report Core Web Vitals for video playback
 *
 * Tracks Largest Contentful Paint (LCP) for video elements.
 */
export function reportVideoWebVitals(): void {
  // Check if PerformanceObserver is available
  if (!('PerformanceObserver' in window)) {
    return;
  }

  try {
    // Observe Largest Contentful Paint
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];

      if (lastEntry && lastEntry.element) {
        const element = lastEntry.element;

        // Check if LCP element is a video
        if (element.tagName === 'VIDEO' || element.tagName === 'IFRAME') {
          logger.debug('LCP detected for video element:', {
            lcp: lastEntry.startTime,
            element: element.tagName,
          });
        }
      }
    });

    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

    // Observe Cumulative Layout Shift (CLS)
    const clsObserver = new PerformanceObserver((list) => {
      let clsScore = 0;
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsScore += (entry as any).value;
        }
      }

      if (clsScore > 0) {
        logger.debug('CLS for video content:', clsScore);
      }
    });

    clsObserver.observe({ type: 'layout-shift', buffered: true });

  } catch (error) {
    logger.error('Failed to observe Web Vitals:', error);
  }
}
