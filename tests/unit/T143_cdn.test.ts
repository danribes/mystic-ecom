/**
 * T143: CDN for Static Assets - Test Suite
 *
 * Comprehensive tests for CDN manager and utilities
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CDNManager, cdnUrl, getCDN, type CDNConfig, type AssetType } from '../../src/lib/cdn';

describe('T143: CDN for Static Assets', () => {
  describe('CDNManager Initialization', () => {
    it('should initialize with Cloudflare provider', () => {
      const config: CDNConfig = {
        provider: 'cloudflare',
        domain: 'cdn.example.com',
        cloudflareZoneId: 'test-zone-id',
        cloudflareApiToken: 'test-token',
      };

      const cdn = new CDNManager(config);
      expect(cdn).toBeDefined();
    });

    it('should initialize with CloudFront provider', () => {
      const config: CDNConfig = {
        provider: 'cloudfront',
        cloudFrontDistributionId: 'test-distribution-id',
      };

      const cdn = new CDNManager(config);
      expect(cdn).toBeDefined();
    });

    it('should initialize with Bunny CDN provider', () => {
      const config: CDNConfig = {
        provider: 'bunny',
        domain: 'cdn.example.b-cdn.net',
        bunnyStorageZone: 'test-zone',
        bunnyApiKey: 'test-key',
      };

      const cdn = new CDNManager(config);
      expect(cdn).toBeDefined();
    });

    it('should initialize with Fastly provider', () => {
      const config: CDNConfig = {
        provider: 'fastly',
        domain: 'cdn.example.fastly.net',
      };

      const cdn = new CDNManager(config);
      expect(cdn).toBeDefined();
    });

    it('should initialize with custom provider', () => {
      const config: CDNConfig = {
        provider: 'custom',
        domain: 'custom-cdn.example.com',
      };

      const cdn = new CDNManager(config);
      expect(cdn).toBeDefined();
    });

    it('should handle disabled CDN', () => {
      const config: CDNConfig = {
        provider: 'cloudflare',
        enabled: false,
      };

      const cdn = new CDNManager(config);
      expect(cdn).toBeDefined();
    });

    it('should use default configuration', () => {
      const cdn = new CDNManager({
        provider: 'cloudflare',
      });

      expect(cdn).toBeDefined();
    });
  });

  describe('getCDNUrl - Basic Functionality', () => {
    it('should return CDN URL for Cloudflare', () => {
      const cdn = new CDNManager({
        provider: 'cloudflare',
        domain: 'cdn.example.com',
      });

      const url = cdn.getCDNUrl('/images/hero.jpg');
      expect(url).toBe('https://cdn.example.com/images/hero.jpg');
    });

    it('should return CDN URL for CloudFront', () => {
      const cdn = new CDNManager({
        provider: 'cloudfront',
        cloudFrontDistributionId: 'ABC123',
      });

      const url = cdn.getCDNUrl('/images/hero.jpg');
      expect(url).toBe('https://ABC123.cloudfront.net/images/hero.jpg');
    });

    it('should return CDN URL for Bunny', () => {
      const cdn = new CDNManager({
        provider: 'bunny',
        domain: 'mysite.b-cdn.net',
      });

      const url = cdn.getCDNUrl('/images/hero.jpg');
      expect(url).toBe('https://mysite.b-cdn.net/images/hero.jpg');
    });

    it('should return CDN URL for Fastly', () => {
      const cdn = new CDNManager({
        provider: 'fastly',
        domain: 'mysite.fastly.net',
      });

      const url = cdn.getCDNUrl('/images/hero.jpg');
      expect(url).toBe('https://mysite.fastly.net/images/hero.jpg');
    });

    it('should return CDN URL for custom provider', () => {
      const cdn = new CDNManager({
        provider: 'custom',
        domain: 'custom-cdn.example.com',
      });

      const url = cdn.getCDNUrl('/images/hero.jpg');
      expect(url).toBe('https://custom-cdn.example.com/images/hero.jpg');
    });

    it('should return local URL when CDN is disabled', () => {
      const cdn = new CDNManager({
        provider: 'cloudflare',
        enabled: false,
      });

      const url = cdn.getCDNUrl('/images/hero.jpg');
      expect(url).toBe('/images/hero.jpg');
    });

    it('should handle URLs without leading slash', () => {
      const cdn = new CDNManager({
        provider: 'cloudflare',
        domain: 'cdn.example.com',
      });

      const url = cdn.getCDNUrl('images/hero.jpg');
      expect(url).toBe('https://cdn.example.com/images/hero.jpg');
    });

    it('should handle URLs with query parameters', () => {
      const cdn = new CDNManager({
        provider: 'cloudflare',
        domain: 'cdn.example.com',
      });

      const url = cdn.getCDNUrl('/images/hero.jpg?quality=80');
      expect(url).toBe('https://cdn.example.com/images/hero.jpg?quality=80');
    });
  });

  describe('getCDNUrl - Versioning', () => {
    it('should add version parameter when versioning is enabled', () => {
      const cdn = new CDNManager({
        provider: 'cloudflare',
        domain: 'cdn.example.com',
        enableVersioning: true,
        assetVersion: 'v1.2.3',
      });

      const url = cdn.getCDNUrl('/images/hero.jpg');
      expect(url).toBe('https://cdn.example.com/images/hero.jpg?v=v1.2.3');
    });

    it('should use custom version from options', () => {
      const cdn = new CDNManager({
        provider: 'cloudflare',
        domain: 'cdn.example.com',
        enableVersioning: true,
      });

      const url = cdn.getCDNUrl('/images/hero.jpg', { version: '2.0.0' });
      expect(url).toBe('https://cdn.example.com/images/hero.jpg?v=2.0.0');
    });

    it('should generate hash-based version when version is true', () => {
      const cdn = new CDNManager({
        provider: 'cloudflare',
        domain: 'cdn.example.com',
      });

      const url = cdn.getCDNUrl('/images/hero.jpg', { version: true });
      // Base-36 encoding includes 0-9 and a-z characters
      expect(url).toMatch(/https:\/\/cdn\.example\.com\/images\/hero\.jpg\?v=[a-z0-9]+/);
    });

    it('should not add version when versioning is disabled', () => {
      const cdn = new CDNManager({
        provider: 'cloudflare',
        domain: 'cdn.example.com',
        enableVersioning: false,
      });

      const url = cdn.getCDNUrl('/images/hero.jpg');
      expect(url).toBe('https://cdn.example.com/images/hero.jpg');
    });

    it('should preserve existing query parameters when adding version', () => {
      const cdn = new CDNManager({
        provider: 'cloudflare',
        domain: 'cdn.example.com',
      });

      const url = cdn.getCDNUrl('/images/hero.jpg?quality=80', { version: '1.0.0' });
      expect(url).toBe('https://cdn.example.com/images/hero.jpg?quality=80&v=1.0.0');
    });
  });

  describe('getCDNUrl - Regions', () => {
    it('should use region-specific domain', () => {
      const cdn = new CDNManager({
        provider: 'cloudflare',
        domain: 'cdn.example.com',
        regions: {
          us: 'us-cdn.example.com',
          eu: 'eu-cdn.example.com',
          asia: 'asia-cdn.example.com',
        },
      });

      const url = cdn.getCDNUrl('/images/hero.jpg', { region: 'eu' });
      expect(url).toBe('https://eu-cdn.example.com/images/hero.jpg');
    });

    it('should fall back to default domain for unknown region', () => {
      const cdn = new CDNManager({
        provider: 'cloudflare',
        domain: 'cdn.example.com',
        regions: {
          us: 'us-cdn.example.com',
        },
      });

      const url = cdn.getCDNUrl('/images/hero.jpg', { region: 'unknown' });
      expect(url).toBe('https://cdn.example.com/images/hero.jpg');
    });
  });

  describe('getCDNUrl - Fallback', () => {
    it('should return local URL when fallback is enabled', () => {
      const cdn = new CDNManager({
        provider: 'cloudflare',
        domain: 'cdn.example.com',
      });

      const url = cdn.getCDNUrl('/images/hero.jpg', { fallback: true });
      expect(url).toBe('/images/hero.jpg');
    });

    it('should return CDN URL when fallback is disabled', () => {
      const cdn = new CDNManager({
        provider: 'cloudflare',
        domain: 'cdn.example.com',
      });

      const url = cdn.getCDNUrl('/images/hero.jpg', { fallback: false });
      expect(url).toBe('https://cdn.example.com/images/hero.jpg');
    });
  });

  describe('getAssetType', () => {
    let cdn: CDNManager;

    beforeEach(() => {
      cdn = new CDNManager({ provider: 'cloudflare' });
    });

    it('should detect image types', () => {
      expect(cdn.getAssetType('/images/hero.jpg')).toBe('image');
      expect(cdn.getAssetType('/images/logo.png')).toBe('image');
      expect(cdn.getAssetType('/images/banner.gif')).toBe('image');
      expect(cdn.getAssetType('/images/photo.webp')).toBe('image');
      expect(cdn.getAssetType('/images/icon.svg')).toBe('image');
      expect(cdn.getAssetType('/images/graphic.avif')).toBe('image');
    });

    it('should detect video types', () => {
      expect(cdn.getAssetType('/videos/intro.mp4')).toBe('video');
      expect(cdn.getAssetType('/videos/demo.webm')).toBe('video');
      expect(cdn.getAssetType('/videos/tutorial.avi')).toBe('video');
      expect(cdn.getAssetType('/videos/clip.mov')).toBe('video');
    });

    it('should detect audio types', () => {
      expect(cdn.getAssetType('/audio/music.mp3')).toBe('audio');
      expect(cdn.getAssetType('/audio/sound.wav')).toBe('audio');
      expect(cdn.getAssetType('/audio/podcast.ogg')).toBe('audio');
    });

    it('should detect font types', () => {
      expect(cdn.getAssetType('/fonts/roboto.woff')).toBe('font');
      expect(cdn.getAssetType('/fonts/opensans.woff2')).toBe('font');
      expect(cdn.getAssetType('/fonts/arial.ttf')).toBe('font');
      expect(cdn.getAssetType('/fonts/times.otf')).toBe('font');
      expect(cdn.getAssetType('/fonts/custom.eot')).toBe('font');
    });

    it('should detect CSS types', () => {
      expect(cdn.getAssetType('/styles/main.css')).toBe('css');
      expect(cdn.getAssetType('/css/theme.css')).toBe('css');
    });

    it('should detect JavaScript types', () => {
      expect(cdn.getAssetType('/scripts/app.js')).toBe('js');
      expect(cdn.getAssetType('/js/main.mjs')).toBe('js');
    });

    it('should detect document types', () => {
      expect(cdn.getAssetType('/docs/manual.pdf')).toBe('document');
      expect(cdn.getAssetType('/files/report.docx')).toBe('document');
      expect(cdn.getAssetType('/files/data.xlsx')).toBe('document');
      expect(cdn.getAssetType('/files/presentation.pptx')).toBe('document');
    });

    it('should return "other" for unknown types', () => {
      expect(cdn.getAssetType('/files/archive.zip')).toBe('other');
      expect(cdn.getAssetType('/files/data.json')).toBe('other');
      expect(cdn.getAssetType('/files/config.xml')).toBe('other');
    });

    it('should handle paths without extensions', () => {
      expect(cdn.getAssetType('/api/endpoint')).toBe('other');
    });

    it('should be case insensitive', () => {
      expect(cdn.getAssetType('/images/HERO.JPG')).toBe('image');
      expect(cdn.getAssetType('/styles/MAIN.CSS')).toBe('css');
    });
  });

  describe('getCacheControl', () => {
    it('should return immutable cache for images by default', () => {
      const cdn = new CDNManager({ provider: 'cloudflare' });
      const cacheControl = cdn.getCacheControl('image');
      expect(cacheControl).toBe('public, max-age=31536000, immutable');
    });

    it('should return immutable cache for fonts by default', () => {
      const cdn = new CDNManager({ provider: 'cloudflare' });
      const cacheControl = cdn.getCacheControl('font');
      expect(cacheControl).toBe('public, max-age=31536000, immutable');
    });

    it('should return standard cache for CSS by default', () => {
      const cdn = new CDNManager({ provider: 'cloudflare' });
      const cacheControl = cdn.getCacheControl('css');
      expect(cacheControl).toBe('public, max-age=604800, stale-while-revalidate=86400');
    });

    it('should return standard cache for JavaScript by default', () => {
      const cdn = new CDNManager({ provider: 'cloudflare' });
      const cacheControl = cdn.getCacheControl('js');
      expect(cacheControl).toBe('public, max-age=604800, stale-while-revalidate=86400');
    });

    it('should return standard cache for videos by default', () => {
      const cdn = new CDNManager({ provider: 'cloudflare' });
      const cacheControl = cdn.getCacheControl('video');
      expect(cacheControl).toBe('public, max-age=604800, stale-while-revalidate=86400');
    });

    it('should return short cache for documents by default', () => {
      const cdn = new CDNManager({ provider: 'cloudflare' });
      const cacheControl = cdn.getCacheControl('document');
      expect(cacheControl).toBe('public, max-age=3600, stale-while-revalidate=600');
    });

    it('should return short cache for other types by default', () => {
      const cdn = new CDNManager({ provider: 'cloudflare' });
      const cacheControl = cdn.getCacheControl('other');
      expect(cacheControl).toBe('public, max-age=3600, stale-while-revalidate=600');
    });

    it('should use custom cache strategy from config', () => {
      const cdn = new CDNManager({
        provider: 'cloudflare',
        cacheStrategies: {
          image: 'short',
          css: 'no-cache',
        },
      });

      expect(cdn.getCacheControl('image')).toBe('public, max-age=3600, stale-while-revalidate=600');
      expect(cdn.getCacheControl('css')).toBe('no-cache, no-store, must-revalidate');
    });

    it('should use custom cache strategy from parameter', () => {
      const cdn = new CDNManager({ provider: 'cloudflare' });
      const cacheControl = cdn.getCacheControl('image', 'no-cache');
      expect(cacheControl).toBe('no-cache, no-store, must-revalidate');
    });

    it('should handle all cache strategies', () => {
      const cdn = new CDNManager({ provider: 'cloudflare' });

      expect(cdn.getCacheControl('image', 'immutable')).toBe('public, max-age=31536000, immutable');
      expect(cdn.getCacheControl('image', 'standard')).toBe('public, max-age=604800, stale-while-revalidate=86400');
      expect(cdn.getCacheControl('image', 'short')).toBe('public, max-age=3600, stale-while-revalidate=600');
      expect(cdn.getCacheControl('image', 'no-cache')).toBe('no-cache, no-store, must-revalidate');
      expect(cdn.getCacheControl('image', 'private')).toBe('private, max-age=3600');
    });
  });

  describe('purgeCache', () => {
    it('should purge all cache for Cloudflare', async () => {
      const cdn = new CDNManager({
        provider: 'cloudflare',
        cloudflareZoneId: 'test-zone',
        cloudflareApiToken: 'test-token',
      });

      // Mock fetch to avoid actual API calls
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      const result = await cdn.purgeCache();

      expect(result.success).toBe(true);
      expect(result.provider).toBe('cloudflare');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.cloudflare.com/client/v4/zones/test-zone/purge_cache',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      );
    });

    it('should purge specific paths for Cloudflare', async () => {
      const cdn = new CDNManager({
        provider: 'cloudflare',
        domain: 'cdn.example.com',
        cloudflareZoneId: 'test-zone',
        cloudflareApiToken: 'test-token',
      });

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      const result = await cdn.purgeCache(['/images/hero.jpg', '/styles/main.css']);

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.cloudflare.com/client/v4/zones/test-zone/purge_cache',
        expect.objectContaining({
          body: JSON.stringify({
            files: [
              'https://cdn.example.com/images/hero.jpg',
              'https://cdn.example.com/styles/main.css',
            ],
          }),
        })
      );
    });

    it('should purge cache for Bunny CDN', async () => {
      const cdn = new CDNManager({
        provider: 'bunny',
        domain: 'test.b-cdn.net',
        bunnyStorageZone: 'test-zone',
        bunnyApiKey: 'test-key',
      });

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      const result = await cdn.purgeCache(['/images/hero.jpg']);

      expect(result.success).toBe(true);
      expect(result.provider).toBe('bunny');
    });

    it('should handle purge errors gracefully', async () => {
      const cdn = new CDNManager({
        provider: 'cloudflare',
        cloudflareZoneId: 'test-zone',
        cloudflareApiToken: 'test-token',
      });

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        statusText: 'Unauthorized',
      });

      const result = await cdn.purgeCache();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should return not supported for CloudFront', async () => {
      const cdn = new CDNManager({
        provider: 'cloudfront',
        cloudFrontDistributionId: 'test-dist',
      });

      const result = await cdn.purgeCache();

      expect(result.success).toBe(false);
      expect(result.error).toContain('not implemented');
    });

    it('should return not supported for Fastly', async () => {
      const cdn = new CDNManager({
        provider: 'fastly',
      });

      const result = await cdn.purgeCache();

      expect(result.success).toBe(false);
      expect(result.error).toContain('not implemented');
    });

    it('should return not supported for custom provider', async () => {
      const cdn = new CDNManager({
        provider: 'custom',
      });

      const result = await cdn.purgeCache();

      expect(result.success).toBe(false);
      expect(result.error).toContain('not supported');
    });
  });

  describe('testCDN', () => {
    it('should successfully test CDN connectivity', async () => {
      const cdn = new CDNManager({
        provider: 'cloudflare',
        domain: 'cdn.example.com',
      });

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: new Map([['cache-control', 'public, max-age=31536000']]),
      });

      const result = await cdn.testCDN('/test.txt');

      expect(result.success).toBe(true);
      expect(result.url).toBe('https://cdn.example.com/test.txt');
      expect(result.cacheControl).toBe('public, max-age=31536000');
    });

    it('should handle CDN connectivity failures', async () => {
      const cdn = new CDNManager({
        provider: 'cloudflare',
        domain: 'cdn.example.com',
      });

      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const result = await cdn.testCDN();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });

    it('should handle HTTP errors', async () => {
      const cdn = new CDNManager({
        provider: 'cloudflare',
        domain: 'cdn.example.com',
      });

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: {
          get: (name: string) => null,
        },
      });

      const result = await cdn.testCDN();

      expect(result.success).toBe(false);
      expect(result.error).toContain('404');
    });
  });

  describe('Helper Functions', () => {
    describe('getCDN', () => {
      it('should return singleton CDNManager instance', () => {
        const cdn1 = getCDN();
        const cdn2 = getCDN();

        expect(cdn1).toBe(cdn2);
      });

      it('should initialize with environment variables', () => {
        const cdn = getCDN();
        expect(cdn).toBeDefined();
      });
    });

    describe('cdnUrl', () => {
      it('should generate CDN URL using singleton', () => {
        const url = cdnUrl('/images/hero.jpg');
        expect(url).toBeDefined();
        expect(typeof url).toBe('string');
      });

      it('should pass options to CDNManager', () => {
        const url = cdnUrl('/images/hero.jpg', {
          version: '1.0.0',
          type: 'image',
        });

        expect(url).toBeDefined();
      });

      it('should handle fallback option', () => {
        const url = cdnUrl('/images/hero.jpg', { fallback: true });
        expect(url).toBe('/images/hero.jpg');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty asset path', () => {
      const cdn = new CDNManager({
        provider: 'cloudflare',
        domain: 'cdn.example.com',
      });

      const url = cdn.getCDNUrl('');
      expect(url).toBe('https://cdn.example.com/');
    });

    it('should handle root path', () => {
      const cdn = new CDNManager({
        provider: 'cloudflare',
        domain: 'cdn.example.com',
      });

      const url = cdn.getCDNUrl('/');
      expect(url).toBe('https://cdn.example.com/');
    });

    it('should handle paths with multiple slashes', () => {
      const cdn = new CDNManager({
        provider: 'cloudflare',
        domain: 'cdn.example.com',
      });

      const url = cdn.getCDNUrl('//images//hero.jpg');
      expect(url).toBe('https://cdn.example.com//images//hero.jpg');
    });

    it('should handle special characters in paths', () => {
      const cdn = new CDNManager({
        provider: 'cloudflare',
        domain: 'cdn.example.com',
      });

      const url = cdn.getCDNUrl('/images/photo%20(1).jpg');
      expect(url).toBe('https://cdn.example.com/images/photo%20(1).jpg');
    });

    it('should handle missing domain gracefully', () => {
      const cdn = new CDNManager({
        provider: 'custom',
        // domain not provided
      });

      const url = cdn.getCDNUrl('/images/hero.jpg');
      // Should fall back to local path
      expect(url).toBe('/images/hero.jpg');
    });

    it('should handle very long paths', () => {
      const cdn = new CDNManager({
        provider: 'cloudflare',
        domain: 'cdn.example.com',
      });

      const longPath = '/images/' + 'a'.repeat(1000) + '.jpg';
      const url = cdn.getCDNUrl(longPath);
      expect(url).toBe('https://cdn.example.com' + longPath);
    });
  });

  describe('Environment Integration', () => {
    it('should read configuration from environment variables', () => {
      // This test would need actual env vars or mocking
      const cdn = getCDN();
      expect(cdn).toBeDefined();
    });

    it('should handle missing environment variables', () => {
      const cdn = new CDNManager({
        provider: 'cloudflare',
        // No credentials provided
      });

      expect(cdn).toBeDefined();
    });
  });

  describe('Performance', () => {
    it('should handle multiple concurrent URL generations', () => {
      const cdn = new CDNManager({
        provider: 'cloudflare',
        domain: 'cdn.example.com',
      });

      const urls = Array.from({ length: 1000 }, (_, i) =>
        cdn.getCDNUrl(`/images/image-${i}.jpg`)
      );

      expect(urls).toHaveLength(1000);
      expect(urls[0]).toBe('https://cdn.example.com/images/image-0.jpg');
      expect(urls[999]).toBe('https://cdn.example.com/images/image-999.jpg');
    });

    it('should generate asset type quickly for many files', () => {
      const cdn = new CDNManager({ provider: 'cloudflare' });

      const startTime = Date.now();
      for (let i = 0; i < 10000; i++) {
        cdn.getAssetType(`/file-${i}.jpg`);
      }
      const duration = Date.now() - startTime;

      // Should complete in less than 100ms
      expect(duration).toBeLessThan(100);
    });
  });

  describe('Type Safety', () => {
    it('should accept all valid asset types', () => {
      const cdn = new CDNManager({ provider: 'cloudflare' });

      const types: AssetType[] = ['image', 'video', 'audio', 'font', 'css', 'js', 'document', 'other'];

      types.forEach(type => {
        expect(() => cdn.getCacheControl(type)).not.toThrow();
      });
    });

    it('should accept all valid CDN providers', () => {
      const providers = ['cloudflare', 'cloudfront', 'bunny', 'fastly', 'custom'] as const;

      providers.forEach(provider => {
        expect(() => new CDNManager({ provider })).not.toThrow();
      });
    });
  });
});
