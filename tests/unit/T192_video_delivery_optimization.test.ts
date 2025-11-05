/**
 * T192: Video Delivery Optimization Tests
 *
 * Tests for:
 * - CDN caching headers
 * - WebP thumbnail generation
 * - Video preloading
 * - Lazy loading
 * - Network-aware optimizations
 * - Responsive srcset generation
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getOptimizedThumbnail,
  getResponsiveThumbnailSrcset,
  getThumbnailPictureSources,
  preloadVideo,
  preloadThumbnail,
  getPreloadPriority,
  getRecommendedQuality,
  getNetworkInfo,
} from '../../src/lib/videoOptimization';

// Mock logger
vi.mock('../../src/lib/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// ============================================================================
// Test Data
// ============================================================================

const mockVideoId = 'abc123def456789012345678abcdef01'; // Valid Cloudflare video ID

// ============================================================================
// WebP Thumbnail Generation Tests
// ============================================================================

describe('T192: WebP Thumbnail Generation', () => {
  it('should generate optimized WebP thumbnail URL', () => {
    const url = getOptimizedThumbnail(mockVideoId, {
      format: 'webp',
      width: 640,
      height: 360,
    });

    expect(url).toContain('videodelivery.net');
    expect(url).toContain(mockVideoId);
    expect(url).toContain('/thumbnails/thumbnail.webp');
    expect(url).toContain('width=640');
    expect(url).toContain('height=360');
  });

  it('should default to WebP format if no format specified', () => {
    const url = getOptimizedThumbnail(mockVideoId);

    expect(url).toContain('/thumbnails/thumbnail.webp');
  });

  it('should support JPEG format for fallback', () => {
    const url = getOptimizedThumbnail(mockVideoId, {
      format: 'jpeg',
      width: 640,
    });

    expect(url).toContain('/thumbnails/thumbnail.jpeg');
    expect(url).toContain('width=640');
  });

  it('should support PNG format', () => {
    const url = getOptimizedThumbnail(mockVideoId, {
      format: 'png',
    });

    expect(url).toContain('/thumbnails/thumbnail.png');
  });

  it('should include quality parameter', () => {
    const url = getOptimizedThumbnail(mockVideoId, {
      format: 'webp',
      quality: 90,
    });

    expect(url).toContain('quality=90');
  });

  it('should not include quality parameter if default (85)', () => {
    const url = getOptimizedThumbnail(mockVideoId, {
      format: 'webp',
      quality: 85,
    });

    expect(url).not.toContain('quality=');
  });

  it('should include timestamp parameter for thumbnail at specific time', () => {
    const url = getOptimizedThumbnail(mockVideoId, {
      time: 30, // 30 seconds
    });

    expect(url).toContain('time=30s');
  });

  it('should support different fit modes', () => {
    const coverUrl = getOptimizedThumbnail(mockVideoId, { fit: 'cover' });
    const containUrl = getOptimizedThumbnail(mockVideoId, { fit: 'contain' });
    const cropUrl = getOptimizedThumbnail(mockVideoId, { fit: 'crop' });

    expect(coverUrl).not.toContain('fit='); // cover is default
    expect(containUrl).toContain('fit=contain');
    expect(cropUrl).toContain('fit=crop');
  });

  it('should handle no parameters (use defaults)', () => {
    const url = getOptimizedThumbnail(mockVideoId);

    expect(url).toBe(`https://videodelivery.net/${mockVideoId}/thumbnails/thumbnail.webp`);
  });
});

describe('T192: Responsive Thumbnail Srcset', () => {
  it('should generate responsive srcset with multiple widths', () => {
    const srcset = getResponsiveThumbnailSrcset(mockVideoId);

    expect(srcset).toContain('320w');
    expect(srcset).toContain('640w');
    expect(srcset).toContain('960w');
    expect(srcset).toContain('1280w');
    expect(srcset).toContain('1920w');
  });

  it('should include video ID in all srcset URLs', () => {
    const srcset = getResponsiveThumbnailSrcset(mockVideoId);

    const urls = srcset.split(', ');
    urls.forEach(urlPart => {
      expect(urlPart).toContain(mockVideoId);
    });
  });

  it('should use WebP format by default', () => {
    const srcset = getResponsiveThumbnailSrcset(mockVideoId);

    expect(srcset).toContain('/thumbnails/thumbnail.webp');
  });

  it('should support JPEG format in srcset', () => {
    const srcset = getResponsiveThumbnailSrcset(mockVideoId, {
      format: 'jpeg',
    });

    expect(srcset).toContain('/thumbnails/thumbnail.jpeg');
  });

  it('should include timestamp if provided', () => {
    const srcset = getResponsiveThumbnailSrcset(mockVideoId, {
      time: 60,
    });

    expect(srcset).toContain('time=60s');
  });
});

describe('T192: Picture Element Sources', () => {
  it('should return both WebP and JPEG sources', () => {
    const sources = getThumbnailPictureSources(mockVideoId);

    expect(sources.webp).toContain('/thumbnails/thumbnail.webp');
    expect(sources.jpeg).toContain('/thumbnails/thumbnail.jpeg');
  });

  it('should return srcsets for both formats', () => {
    const sources = getThumbnailPictureSources(mockVideoId);

    expect(sources.webpSrcset).toContain('320w');
    expect(sources.webpSrcset).toContain('640w');
    expect(sources.jpegSrcset).toContain('320w');
    expect(sources.jpegSrcset).toContain('640w');
  });

  it('should apply options to both WebP and JPEG', () => {
    const sources = getThumbnailPictureSources(mockVideoId, {
      width: 800,
      time: 30,
    });

    expect(sources.webp).toContain('time=30s');
    expect(sources.jpeg).toContain('time=30s');
  });
});

// ============================================================================
// Video Preloading Tests
// ============================================================================

describe('T192: Video Preloading', () => {
  beforeEach(() => {
    // Clear document head
    document.head.innerHTML = '';
  });

  it('should create preload link for video manifest', () => {
    preloadVideo(mockVideoId);

    const preloadLink = document.querySelector('link[rel="preload"]');
    expect(preloadLink).toBeTruthy();
    expect(preloadLink?.getAttribute('href')).toContain(mockVideoId);
    expect(preloadLink?.getAttribute('href')).toContain('/manifest/video.m3u8');
  });

  it('should set correct preload attributes', () => {
    preloadVideo(mockVideoId);

    const preloadLink = document.querySelector('link[rel="preload"]');
    expect(preloadLink?.getAttribute('rel')).toBe('preload');
    expect(preloadLink?.getAttribute('as')).toBe('fetch');
    expect(preloadLink?.getAttribute('crossorigin')).toBe('anonymous');
  });

  it('should not duplicate preload for same video', () => {
    preloadVideo(mockVideoId);
    preloadVideo(mockVideoId);

    const preloadLinks = document.querySelectorAll(`link[data-video-id="${mockVideoId}"]`);
    expect(preloadLinks.length).toBe(1);
  });

  it('should support high priority preloading', () => {
    preloadVideo(mockVideoId, { priority: 'high' });

    const preloadLink = document.querySelector('link[rel="preload"]');
    expect(preloadLink).toBeTruthy();
  });

  it('should support low priority preloading', () => {
    preloadVideo(mockVideoId, { priority: 'low' });

    const preloadLink = document.querySelector('link[rel="preload"]');
    expect(preloadLink).toBeTruthy();
  });

  it('should support cross-origin credentials', () => {
    preloadVideo(mockVideoId, { crossOrigin: 'use-credentials' });

    const preloadLink = document.querySelector('link[rel="preload"]') as HTMLLinkElement;
    expect(preloadLink?.crossOrigin).toBe('use-credentials');
  });
});

describe('T192: Thumbnail Preloading', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
  });

  it('should create preload link for thumbnail', () => {
    preloadThumbnail(mockVideoId, { format: 'webp', width: 640 });

    const preloadLink = document.querySelector('link[rel="preload"]');
    expect(preloadLink).toBeTruthy();
    expect(preloadLink?.getAttribute('as')).toBe('image');
  });

  it('should set correct image type for WebP', () => {
    preloadThumbnail(mockVideoId, { format: 'webp' });

    const preloadLink = document.querySelector('link[rel="preload"]') as HTMLLinkElement;
    expect(preloadLink?.type).toBe('image/webp');
  });

  it('should set correct image type for JPEG', () => {
    preloadThumbnail(mockVideoId, { format: 'jpeg' });

    const preloadLink = document.querySelector('link[rel="preload"]') as HTMLLinkElement;
    expect(preloadLink?.type).toBe('image/jpeg');
  });

  it('should not duplicate thumbnail preload', () => {
    const options = { format: 'webp' as const, width: 640 };
    preloadThumbnail(mockVideoId, options);
    preloadThumbnail(mockVideoId, options);

    const preloadLinks = document.querySelectorAll('link[rel="preload"][as="image"]');
    expect(preloadLinks.length).toBe(1);
  });
});

// ============================================================================
// Network-Aware Optimization Tests
// ============================================================================

describe('T192: Network-Aware Preload Priority', () => {
  beforeEach(() => {
    // Reset navigator mock
    delete (navigator as any).connection;
  });

  it('should return low priority if Network Info API not available', () => {
    const priority = getPreloadPriority();
    expect(priority).toBe('low');
  });

  it('should return null if data saver is enabled', () => {
    (navigator as any).connection = {
      saveData: true,
      effectiveType: '4g',
    };

    const priority = getPreloadPriority();
    expect(priority).toBeNull();
  });

  it('should return high priority on 4G connection', () => {
    (navigator as any).connection = {
      saveData: false,
      effectiveType: '4g',
    };

    const priority = getPreloadPriority();
    expect(priority).toBe('high');
  });

  it('should return low priority on 3G connection', () => {
    (navigator as any).connection = {
      saveData: false,
      effectiveType: '3g',
    };

    const priority = getPreloadPriority();
    expect(priority).toBe('low');
  });

  it('should return null on 2G connection (skip preload)', () => {
    (navigator as any).connection = {
      saveData: false,
      effectiveType: '2g',
    };

    const priority = getPreloadPriority();
    expect(priority).toBeNull();
  });

  it('should return null on slow-2G connection (skip preload)', () => {
    (navigator as any).connection = {
      saveData: false,
      effectiveType: 'slow-2g',
    };

    const priority = getPreloadPriority();
    expect(priority).toBeNull();
  });
});

describe('T192: Network-Aware Quality Recommendation', () => {
  beforeEach(() => {
    delete (navigator as any).connection;
  });

  it('should return auto if Network Info API not available', () => {
    const quality = getRecommendedQuality();
    expect(quality).toBe('auto');
  });

  it('should recommend 360p if data saver enabled', () => {
    (navigator as any).connection = {
      saveData: true,
      effectiveType: '4g',
    };

    const quality = getRecommendedQuality();
    expect(quality).toBe('360p');
  });

  it('should recommend 1080p on 4G connection', () => {
    (navigator as any).connection = {
      saveData: false,
      effectiveType: '4g',
    };

    const quality = getRecommendedQuality();
    expect(quality).toBe('1080p');
  });

  it('should recommend 720p on 3G connection', () => {
    (navigator as any).connection = {
      saveData: false,
      effectiveType: '3g',
    };

    const quality = getRecommendedQuality();
    expect(quality).toBe('720p');
  });

  it('should recommend 480p on 2G connection', () => {
    (navigator as any).connection = {
      saveData: false,
      effectiveType: '2g',
    };

    const quality = getRecommendedQuality();
    expect(quality).toBe('480p');
  });

  it('should recommend 360p on slow-2G connection', () => {
    (navigator as any).connection = {
      saveData: false,
      effectiveType: 'slow-2g',
    };

    const quality = getRecommendedQuality();
    expect(quality).toBe('360p');
  });
});

describe('T192: Get Network Information', () => {
  beforeEach(() => {
    delete (navigator as any).connection;
  });

  it('should return null if Network Info API not available', () => {
    const info = getNetworkInfo();
    expect(info).toBeNull();
  });

  it('should return network info if API available', () => {
    (navigator as any).connection = {
      effectiveType: '4g',
      downlink: 10.5,
      rtt: 50,
      saveData: false,
    };

    const info = getNetworkInfo();
    expect(info).toBeTruthy();
    expect(info?.effectiveType).toBe('4g');
    expect(info?.downlink).toBe(10.5);
    expect(info?.rtt).toBe(50);
    expect(info?.saveData).toBe(false);
  });

  it('should handle partial network info', () => {
    (navigator as any).connection = {
      effectiveType: '3g',
    };

    const info = getNetworkInfo();
    expect(info).toBeTruthy();
    expect(info?.effectiveType).toBe('3g');
    expect(info?.downlink).toBe(10); // Default
    expect(info?.rtt).toBe(50); // Default
    expect(info?.saveData).toBe(false); // Default
  });
});

// ============================================================================
// CDN Caching Headers Tests
// ============================================================================

describe('T192: CDN Caching Headers', () => {
  it('should generate correct thumbnail URL structure', () => {
    const url = getOptimizedThumbnail(mockVideoId, {
      width: 640,
      height: 360,
      format: 'webp',
    });

    // Verify URL structure matches Cloudflare Stream API
    expect(url).toMatch(/^https:\/\/videodelivery\.net\/[a-f0-9]{32}\/thumbnails\/thumbnail\.webp/);
  });

  it('should use Cloudflare videodelivery.net domain', () => {
    const url = getOptimizedThumbnail(mockVideoId);
    expect(url).toContain('https://videodelivery.net/');
  });
});

// ============================================================================
// URL Parameter Encoding Tests
// ============================================================================

describe('T192: URL Parameter Encoding', () => {
  it('should properly encode query parameters', () => {
    const url = getOptimizedThumbnail(mockVideoId, {
      width: 1920,
      height: 1080,
      quality: 95,
      fit: 'contain',
      time: 120,
    });

    const urlObj = new URL(url);
    expect(urlObj.searchParams.get('width')).toBe('1920');
    expect(urlObj.searchParams.get('height')).toBe('1080');
    expect(urlObj.searchParams.get('quality')).toBe('95');
    expect(urlObj.searchParams.get('fit')).toBe('contain');
    expect(urlObj.searchParams.get('time')).toBe('120s');
  });

  it('should handle edge case values', () => {
    const url = getOptimizedThumbnail(mockVideoId, {
      width: 0, // Edge case: zero width
      quality: 0, // Edge case: min quality
      time: 0, // Edge case: start of video
    });

    const urlObj = new URL(url);
    expect(urlObj.searchParams.get('width')).toBe('0');
    expect(urlObj.searchParams.get('quality')).toBe('0');
    expect(urlObj.searchParams.get('time')).toBe('0s');
  });

  it('should round fractional time values to seconds', () => {
    const url = getOptimizedThumbnail(mockVideoId, {
      time: 30.75, // Should round to 30
    });

    expect(url).toContain('time=30s');
  });
});

// ============================================================================
// Edge Cases and Error Handling
// ============================================================================

describe('T192: Edge Cases', () => {
  it('should handle empty video ID gracefully', () => {
    const url = getOptimizedThumbnail('');
    expect(url).toContain('https://videodelivery.net/');
    expect(url).toContain('/thumbnails/thumbnail.webp');
  });

  it('should handle very long video ID', () => {
    const longId = 'a'.repeat(100);
    const url = getOptimizedThumbnail(longId);
    expect(url).toContain(longId);
  });

  it('should handle special characters in video ID', () => {
    const specialId = 'test-video_123';
    const url = getOptimizedThumbnail(specialId);
    expect(url).toContain(specialId);
  });

  it('should handle maximum width value', () => {
    const url = getOptimizedThumbnail(mockVideoId, {
      width: 4096, // 4K width
    });

    expect(url).toContain('width=4096');
  });

  it('should handle maximum quality value', () => {
    const url = getOptimizedThumbnail(mockVideoId, {
      quality: 100,
    });

    expect(url).toContain('quality=100');
  });

  it('should handle large time values', () => {
    const url = getOptimizedThumbnail(mockVideoId, {
      time: 7200, // 2 hours
    });

    expect(url).toContain('time=7200s');
  });
});

// ============================================================================
// Performance Tests
// ============================================================================

describe('T192: Performance', () => {
  it('should generate thumbnail URL quickly (< 1ms)', () => {
    const start = performance.now();

    for (let i = 0; i < 1000; i++) {
      getOptimizedThumbnail(mockVideoId, {
        width: 640,
        height: 360,
        format: 'webp',
      });
    }

    const duration = performance.now() - start;
    const avgTime = duration / 1000;

    expect(avgTime).toBeLessThan(1); // Average < 1ms per call
  });

  it('should generate srcset quickly (< 5ms)', () => {
    const start = performance.now();

    for (let i = 0; i < 100; i++) {
      getResponsiveThumbnailSrcset(mockVideoId);
    }

    const duration = performance.now() - start;
    const avgTime = duration / 100;

    expect(avgTime).toBeLessThan(5); // Average < 5ms per call
  });
});

// ============================================================================
// Integration Tests
// ============================================================================

describe('T192: Integration Tests', () => {
  it('should work end-to-end for picture element', () => {
    const sources = getThumbnailPictureSources(mockVideoId, {
      width: 800,
      time: 60,
      quality: 90,
    });

    // Verify WebP source
    expect(sources.webp).toContain('/thumbnails/thumbnail.webp');
    expect(sources.webp).toContain('quality=90');
    expect(sources.webp).toContain('time=60s');

    // Verify JPEG fallback
    expect(sources.jpeg).toContain('/thumbnails/thumbnail.jpeg');
    expect(sources.jpeg).toContain('quality=90');
    expect(sources.jpeg).toContain('time=60s');

    // Verify srcsets
    expect(sources.webpSrcset).toContain('320w');
    expect(sources.webpSrcset).toContain('1920w');
    expect(sources.jpegSrcset).toContain('320w');
    expect(sources.jpegSrcset).toContain('1920w');
  });

  it('should coordinate preloading for complete page load', () => {
    document.head.innerHTML = '';

    // Preload thumbnail
    preloadThumbnail(mockVideoId, { format: 'webp', width: 640 });

    // Preload video
    preloadVideo(mockVideoId, { priority: 'high' });

    // Verify both preloads exist
    const preloads = document.querySelectorAll('link[rel="preload"]');
    expect(preloads.length).toBe(2);

    const imagePreload = Array.from(preloads).find(link => link.getAttribute('as') === 'image');
    const fetchPreload = Array.from(preloads).find(link => link.getAttribute('as') === 'fetch');

    expect(imagePreload).toBeTruthy();
    expect(fetchPreload).toBeTruthy();
  });
});
