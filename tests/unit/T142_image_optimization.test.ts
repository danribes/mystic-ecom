/**
 * Unit Tests for T142: Image Optimization
 *
 * Tests for:
 * - Image optimization utilities
 * - Responsive image generation
 * - WebP format support
 * - Lazy loading configuration
 * - Preload configuration
 */

import { describe, it, expect } from 'vitest';
import {
  isExternalUrl,
  isPlaceholderImage,
  getWebPPath,
  getResponsiveImageUrl,
  generateSrcset,
  generateWebPSrcset,
  calculateDimensions,
  parseAspectRatio,
  shouldLazyLoad,
  generateResponsiveImageData,
  generateBlurPlaceholder,
  getOptimalFormat,
  isValidImageUrl,
  generatePreloadConfig,
  getPreset,
  IMAGE_PRESETS
} from '@/lib/imageOptimization';

describe('Image Optimization Utilities', () => {
  describe('isExternalUrl', () => {
    it('should identify HTTP URLs as external', () => {
      expect(isExternalUrl('http://example.com/image.jpg')).toBe(true);
    });

    it('should identify HTTPS URLs as external', () => {
      expect(isExternalUrl('https://example.com/image.jpg')).toBe(true);
    });

    it('should identify protocol-relative URLs as external', () => {
      expect(isExternalUrl('//example.com/image.jpg')).toBe(true);
    });

    it('should identify local paths as not external', () => {
      expect(isExternalUrl('/images/photo.jpg')).toBe(false);
      expect(isExternalUrl('./images/photo.jpg')).toBe(false);
      expect(isExternalUrl('../images/photo.jpg')).toBe(false);
    });
  });

  describe('isPlaceholderImage', () => {
    it('should identify placeholder images', () => {
      expect(isPlaceholderImage('/images/placeholder.jpg')).toBe(true);
      expect(isPlaceholderImage('/images/default-avatar.png')).toBe(true);
    });

    it('should not identify regular images as placeholders', () => {
      expect(isPlaceholderImage('/images/course.jpg')).toBe(false);
      expect(isPlaceholderImage('https://example.com/photo.jpg')).toBe(false);
    });
  });

  describe('getWebPPath', () => {
    it('should convert JPEG to WebP', () => {
      expect(getWebPPath('/images/photo.jpg')).toBe('/images/photo.webp');
      expect(getWebPPath('/images/photo.jpeg')).toBe('/images/photo.webp');
    });

    it('should convert PNG to WebP', () => {
      expect(getWebPPath('/images/icon.png')).toBe('/images/icon.webp');
    });

    it('should convert GIF to WebP', () => {
      expect(getWebPPath('/images/animation.gif')).toBe('/images/animation.webp');
    });

    it('should return external URLs unchanged', () => {
      const externalUrl = 'https://cdn.example.com/image.jpg';
      expect(getWebPPath(externalUrl)).toBe(externalUrl);
    });

    it('should handle uppercase extensions', () => {
      expect(getWebPPath('/images/PHOTO.JPG')).toBe('/images/PHOTO.webp');
    });
  });

  describe('getResponsiveImageUrl', () => {
    it('should generate responsive local image URLs', () => {
      expect(getResponsiveImageUrl('/images/photo.jpg', 640)).toBe('/images/photo-640w.jpg');
      expect(getResponsiveImageUrl('/images/photo.jpg', 1024)).toBe('/images/photo-1024w.jpg');
    });

    it('should add width query parameter to external URLs', () => {
      expect(getResponsiveImageUrl('https://cdn.example.com/image.jpg', 640))
        .toBe('https://cdn.example.com/image.jpg?w=640');
    });

    it('should append width to existing query parameters', () => {
      expect(getResponsiveImageUrl('https://cdn.example.com/image.jpg?v=1', 640))
        .toBe('https://cdn.example.com/image.jpg?v=1&w=640');
    });

    it('should include quality parameter when specified', () => {
      expect(getResponsiveImageUrl('/images/photo.jpg', 640, 85))
        .toBe('/images/photo-640w.jpg');
      expect(getResponsiveImageUrl('https://cdn.example.com/image.jpg', 640, 85))
        .toBe('https://cdn.example.com/image.jpg?w=640&q=85');
    });
  });

  describe('generateSrcset', () => {
    it('should generate srcset string for local images', () => {
      const srcset = generateSrcset('/images/photo.jpg', [320, 640, 1024]);
      expect(srcset).toBe(
        '/images/photo-320w.jpg 320w, /images/photo-640w.jpg 640w, /images/photo-1024w.jpg 1024w'
      );
    });

    it('should generate srcset string for external images', () => {
      const srcset = generateSrcset('https://cdn.example.com/image.jpg', [320, 640]);
      expect(srcset).toContain('https://cdn.example.com/image.jpg?w=320 320w');
      expect(srcset).toContain('https://cdn.example.com/image.jpg?w=640 640w');
    });

    it('should include quality in external image srcset', () => {
      const srcset = generateSrcset('https://cdn.example.com/image.jpg', [640], 80);
      expect(srcset).toContain('w=640&q=80');
    });
  });

  describe('generateWebPSrcset', () => {
    it('should generate WebP srcset for local images', () => {
      const srcset = generateWebPSrcset('/images/photo.jpg', [320, 640]);
      expect(srcset).toBe(
        '/images/photo-320w.webp 320w, /images/photo-640w.webp 640w'
      );
    });

    it('should generate WebP srcset for external images', () => {
      const srcset = generateWebPSrcset('https://cdn.example.com/image.jpg', [640]);
      expect(srcset).toContain('https://cdn.example.com/image.jpg?w=640');
    });
  });

  describe('calculateDimensions', () => {
    it('should calculate dimensions maintaining aspect ratio', () => {
      const result = calculateDimensions(1920, 1080, 960);
      expect(result).toEqual({ width: 960, height: 540 });
    });

    it('should round height to nearest integer', () => {
      const result = calculateDimensions(1000, 667, 500);
      expect(result).toEqual({ width: 500, height: 334 });
    });

    it('should handle square images', () => {
      const result = calculateDimensions(1000, 1000, 500);
      expect(result).toEqual({ width: 500, height: 500 });
    });

    it('should handle portrait images', () => {
      const result = calculateDimensions(1080, 1920, 540);
      expect(result).toEqual({ width: 540, height: 960 });
    });
  });

  describe('parseAspectRatio', () => {
    it('should parse aspect ratio with slash separator', () => {
      expect(parseAspectRatio('16/9')).toBeCloseTo(0.5625);
      expect(parseAspectRatio('4/3')).toBeCloseTo(0.75);
    });

    it('should parse aspect ratio with colon separator', () => {
      expect(parseAspectRatio('16:9')).toBeCloseTo(0.5625);
      expect(parseAspectRatio('4:3')).toBeCloseTo(0.75);
    });

    it('should handle 1:1 ratio', () => {
      expect(parseAspectRatio('1/1')).toBe(1);
    });
  });

  describe('shouldLazyLoad', () => {
    it('should return eager loading for explicit eager', () => {
      expect(shouldLazyLoad('eager', 0)).toBe('eager');
      expect(shouldLazyLoad('eager', 10)).toBe('eager');
    });

    it('should return lazy loading for explicit lazy', () => {
      expect(shouldLazyLoad('lazy', 0)).toBe('lazy');
      expect(shouldLazyLoad('lazy', 10)).toBe('lazy');
    });

    it('should auto-determine based on index', () => {
      expect(shouldLazyLoad('auto', 0)).toBe('eager'); // First image
      expect(shouldLazyLoad('auto', 1)).toBe('eager'); // Second image
      expect(shouldLazyLoad('auto', 2)).toBe('eager'); // Third image
      expect(shouldLazyLoad('auto', 3)).toBe('lazy');  // Fourth and beyond
      expect(shouldLazyLoad('auto', 10)).toBe('lazy');
    });

    it('should default to lazy when index is undefined', () => {
      expect(shouldLazyLoad('auto', undefined)).toBe('lazy');
    });
  });

  describe('generateResponsiveImageData', () => {
    it('should generate complete responsive image data', () => {
      const result = generateResponsiveImageData({
        src: '/images/photo.jpg',
        alt: 'Test photo'
      });

      expect(result.src).toBe('/images/photo.jpg');
      expect(result.alt).toBe('Test photo');
      expect(result.srcset).toContain('320w');
      expect(result.srcset).toContain('640w');
      expect(result.srcsetWebP).toBeDefined();
      expect(result.sizes).toBeDefined();
      expect(result.loading).toBe('lazy');
    });

    it('should disable WebP when requested', () => {
      const result = generateResponsiveImageData({
        src: '/images/photo.jpg',
        alt: 'Test photo',
        enableWebP: false
      });

      expect(result.srcsetWebP).toBeUndefined();
    });

    it('should use custom widths', () => {
      const result = generateResponsiveImageData({
        src: '/images/photo.jpg',
        alt: 'Test photo',
        widths: [400, 800]
      });

      expect(result.srcset).toContain('400w');
      expect(result.srcset).toContain('800w');
      expect(result.srcset).not.toContain('320w');
    });

    it('should use custom sizes', () => {
      const result = generateResponsiveImageData({
        src: '/images/photo.jpg',
        alt: 'Test photo',
        sizes: '100vw'
      });

      expect(result.sizes).toBe('100vw');
    });

    it('should set eager loading', () => {
      const result = generateResponsiveImageData({
        src: '/images/photo.jpg',
        alt: 'Test photo',
        loading: 'eager'
      });

      expect(result.loading).toBe('eager');
    });

    it('should include fetchpriority when specified', () => {
      const result = generateResponsiveImageData({
        src: '/images/photo.jpg',
        alt: 'Test photo',
        fetchpriority: 'high'
      });

      expect(result.fetchpriority).toBe('high');
    });

    it('should include className when specified', () => {
      const result = generateResponsiveImageData({
        src: '/images/photo.jpg',
        alt: 'Test photo',
        className: 'rounded-lg'
      });

      expect(result.className).toBe('rounded-lg');
    });

    it('should include aspectRatio when specified', () => {
      const result = generateResponsiveImageData({
        src: '/images/photo.jpg',
        alt: 'Test photo',
        aspectRatio: '16/9'
      });

      expect(result.aspectRatio).toBe('16/9');
    });

    it('should not optimize placeholder images', () => {
      const result = generateResponsiveImageData({
        src: '/images/placeholder.jpg',
        alt: 'Placeholder',
        enableWebP: true
      });

      expect(result.srcset).toBe('/images/placeholder.jpg');
      expect(result.loading).toBe('lazy');
    });

    it('should apply custom quality', () => {
      const result = generateResponsiveImageData({
        src: 'https://cdn.example.com/image.jpg',
        alt: 'Test photo',
        quality: 90,
        widths: [640]
      });

      expect(result.srcset).toContain('q=90');
    });
  });

  describe('generateBlurPlaceholder', () => {
    it('should generate base64 encoded SVG placeholder', () => {
      const placeholder = generateBlurPlaceholder();
      expect(placeholder).toMatch(/^data:image\/svg\+xml;base64,/);
    });

    it('should accept custom dimensions', () => {
      const placeholder = generateBlurPlaceholder(20, 20);
      expect(placeholder).toContain('base64');
      // Decode and verify dimensions
      const svg = Buffer.from(placeholder.split(',')[1], 'base64').toString();
      expect(svg).toContain('viewBox="0 0 20 20"');
    });

    it('should include blur filter', () => {
      const placeholder = generateBlurPlaceholder();
      const svg = Buffer.from(placeholder.split(',')[1], 'base64').toString();
      expect(svg).toContain('feGaussianBlur');
    });
  });

  describe('getOptimalFormat', () => {
    it('should prefer WebP over PNG and JPEG', () => {
      expect(getOptimalFormat(['webp', 'png', 'jpeg'])).toBe('webp');
    });

    it('should prefer PNG over JPEG when WebP not available', () => {
      expect(getOptimalFormat(['png', 'jpeg'])).toBe('png');
    });

    it('should return JPEG when only JPEG available', () => {
      expect(getOptimalFormat(['jpeg'])).toBe('jpeg');
      expect(getOptimalFormat(['jpg'])).toBe('jpeg');
    });

    it('should return first format if none match preferences', () => {
      expect(getOptimalFormat(['avif', 'heic'])).toBe('avif');
    });
  });

  describe('isValidImageUrl', () => {
    it('should validate external URLs', () => {
      expect(isValidImageUrl('https://example.com/image.jpg')).toBe(true);
      expect(isValidImageUrl('http://example.com/image.jpg')).toBe(true);
    });

    it('should validate local paths', () => {
      expect(isValidImageUrl('/images/photo.jpg')).toBe(true);
      expect(isValidImageUrl('./images/photo.jpg')).toBe(true);
      expect(isValidImageUrl('../images/photo.jpg')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(isValidImageUrl('')).toBe(false);
      expect(isValidImageUrl(null as any)).toBe(false);
      expect(isValidImageUrl(undefined as any)).toBe(false);
    });

    it('should accept protocol-relative URLs', () => {
      expect(isValidImageUrl('//cdn.example.com/image.jpg')).toBe(true);
    });
  });

  describe('generatePreloadConfig', () => {
    it('should generate preload configuration', () => {
      const config = generatePreloadConfig({
        src: '/images/hero.jpg',
        alt: 'Hero image',
        loading: 'eager',
        fetchpriority: 'high'
      });

      expect(config.href).toBe('/images/hero.jpg');
      expect(config.as).toBe('image');
      expect(config.fetchpriority).toBe('high');
      expect(config.imageSrcset).toBeDefined();
      expect(config.imageSizes).toBeDefined();
    });

    it('should include WebP type when enabled', () => {
      const config = generatePreloadConfig({
        src: '/images/hero.jpg',
        alt: 'Hero image',
        enableWebP: true
      });

      expect(config.type).toBe('image/webp');
    });

    it('should not include type when WebP disabled', () => {
      const config = generatePreloadConfig({
        src: '/images/hero.jpg',
        alt: 'Hero image',
        enableWebP: false
      });

      expect(config.type).toBeUndefined();
    });
  });

  describe('Image Presets', () => {
    it('should have hero preset with correct configuration', () => {
      const preset = IMAGE_PRESETS.hero;
      expect(preset.loading).toBe('eager');
      expect(preset.fetchpriority).toBe('high');
      expect(preset.sizes).toBe('100vw');
      expect(preset.widths).toContain(1920);
    });

    it('should have thumbnail preset with small widths', () => {
      const preset = IMAGE_PRESETS.thumbnail;
      expect(preset.loading).toBe('lazy');
      expect(preset.widths).toEqual([150, 300, 450]);
    });

    it('should have card preset', () => {
      const preset = IMAGE_PRESETS.card;
      expect(preset.loading).toBe('lazy');
      expect(preset.widths).toContain(640);
    });

    it('should have avatar preset with small dimensions', () => {
      const preset = IMAGE_PRESETS.avatar;
      expect(preset.sizes).toBe('48px');
      expect(preset.widths).toEqual([48, 96, 144]);
    });

    it('should have fullWidth preset', () => {
      const preset = IMAGE_PRESETS.fullWidth;
      expect(preset.sizes).toBe('100vw');
      expect(preset.loading).toBe('lazy');
    });
  });

  describe('getPreset', () => {
    it('should return hero preset', () => {
      const preset = getPreset('hero');
      expect(preset.loading).toBe('eager');
      expect(preset.fetchpriority).toBe('high');
    });

    it('should return thumbnail preset', () => {
      const preset = getPreset('thumbnail');
      expect(preset.widths).toEqual([150, 300, 450]);
    });

    it('should return card preset', () => {
      const preset = getPreset('card');
      expect(preset.quality).toBe(80);
    });

    it('should return avatar preset', () => {
      const preset = getPreset('avatar');
      expect(preset.sizes).toBe('48px');
    });

    it('should return fullWidth preset', () => {
      const preset = getPreset('fullWidth');
      expect(preset.sizes).toBe('100vw');
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete image optimization workflow', () => {
      // Simulate optimizing a hero image
      const imageData = generateResponsiveImageData({
        src: '/images/hero.jpg',
        alt: 'Hero image',
        ...getPreset('hero')
      });

      expect(imageData.loading).toBe('eager');
      expect(imageData.srcset).toContain('1920w');
      expect(imageData.srcsetWebP).toBeDefined();
      expect(imageData.sizes).toBe('100vw');
    });

    it('should handle thumbnail optimization', () => {
      const imageData = generateResponsiveImageData({
        src: '/images/thumb.jpg',
        alt: 'Thumbnail',
        ...getPreset('thumbnail')
      });

      expect(imageData.loading).toBe('lazy');
      expect(imageData.srcset).toContain('150w');
      expect(imageData.srcset).toContain('300w');
    });

    it('should handle external CDN images', () => {
      const imageData = generateResponsiveImageData({
        src: 'https://cdn.example.com/image.jpg',
        alt: 'CDN image',
        widths: [640, 1024],
        quality: 85
      });

      expect(imageData.srcset).toContain('w=640&q=85');
      expect(imageData.srcset).toContain('w=1024&q=85');
    });
  });
});
