/**
 * Unit Tests for T144: Build Optimization
 *
 * Tests for:
 * - Asset type detection
 * - File size formatting
 * - Compression ratio calculation
 * - Bundle statistics analysis
 * - Size threshold checking
 * - Cache header generation
 * - Optimization recommendations
 */

import { describe, it, expect } from 'vitest';
import {
  getAssetType,
  formatSize,
  getCompressionRatio,
  analyzeBundleStats,
  checkBundleSize,
  getCacheHeaders,
  generateRecommendations,
  generateAssetHash,
  CACHE_HEADERS,
  DEFAULT_THRESHOLDS,
  type AssetInfo,
  type SizeThresholds,
} from '@/lib/buildOptimization';

describe('Build Optimization Utilities', () => {
  describe('getAssetType', () => {
    it('should identify JavaScript files', () => {
      expect(getAssetType('main.js')).toBe('js');
      expect(getAssetType('bundle.mjs')).toBe('js');
      expect(getAssetType('polyfill.cjs')).toBe('js');
    });

    it('should identify CSS files', () => {
      expect(getAssetType('styles.css')).toBe('css');
      expect(getAssetType('main.CSS')).toBe('css');
    });

    it('should identify image files', () => {
      expect(getAssetType('photo.jpg')).toBe('image');
      expect(getAssetType('photo.jpeg')).toBe('image');
      expect(getAssetType('icon.png')).toBe('image');
      expect(getAssetType('logo.gif')).toBe('image');
      expect(getAssetType('hero.webp')).toBe('image');
      expect(getAssetType('icon.svg')).toBe('image');
      expect(getAssetType('favicon.ico')).toBe('image');
    });

    it('should identify font files', () => {
      expect(getAssetType('font.woff')).toBe('font');
      expect(getAssetType('font.woff2')).toBe('font');
      expect(getAssetType('font.ttf')).toBe('font');
      expect(getAssetType('font.eot')).toBe('font');
      expect(getAssetType('font.otf')).toBe('font');
    });

    it('should identify other files', () => {
      expect(getAssetType('manifest.json')).toBe('other');
      expect(getAssetType('robots.txt')).toBe('other');
    });

    it('should handle files without extension', () => {
      expect(getAssetType('README')).toBe('other');
    });
  });

  describe('formatSize', () => {
    it('should format bytes', () => {
      expect(formatSize(0)).toBe('0 B');
      expect(formatSize(512)).toBe('512 B');
      expect(formatSize(1023)).toBe('1023 B');
    });

    it('should format kilobytes', () => {
      expect(formatSize(1024)).toBe('1 KB');
      expect(formatSize(1536)).toBe('1.5 KB');
      expect(formatSize(10240)).toBe('10 KB');
    });

    it('should format megabytes', () => {
      expect(formatSize(1048576)).toBe('1 MB');
      expect(formatSize(1572864)).toBe('1.5 MB');
      expect(formatSize(10485760)).toBe('10 MB');
    });

    it('should format gigabytes', () => {
      expect(formatSize(1073741824)).toBe('1 GB');
      expect(formatSize(1610612736)).toBe('1.5 GB');
    });

    it('should use 2 decimal places', () => {
      expect(formatSize(1536)).toBe('1.5 KB');
      expect(formatSize(1589)).toMatch(/1\.55 KB/);
    });
  });

  describe('getCompressionRatio', () => {
    it('should calculate compression ratio', () => {
      expect(getCompressionRatio(1000, 500)).toBe(50);
      expect(getCompressionRatio(1000, 250)).toBe(75);
      expect(getCompressionRatio(1000, 750)).toBe(25);
    });

    it('should handle zero original size', () => {
      expect(getCompressionRatio(0, 0)).toBe(0);
    });

    it('should handle no compression', () => {
      expect(getCompressionRatio(1000, 1000)).toBe(0);
    });

    it('should handle better than original (expansion)', () => {
      // Can happen with small files or already compressed files
      expect(getCompressionRatio(1000, 1100)).toBe(-10);
    });

    it('should round to 2 decimal places', () => {
      expect(getCompressionRatio(1000, 333)).toBe(66.7);
    });
  });

  describe('generateAssetHash', () => {
    it('should generate consistent hash for same content', () => {
      const content = 'test content';
      const hash1 = generateAssetHash(content);
      const hash2 = generateAssetHash(content);
      expect(hash1).toBe(hash2);
    });

    it('should generate different hashes for different content', () => {
      const hash1 = generateAssetHash('content 1');
      const hash2 = generateAssetHash('content 2');
      expect(hash1).not.toBe(hash2);
    });

    it('should generate 8-character hash', () => {
      const hash = generateAssetHash('test');
      expect(hash).toHaveLength(8);
    });

    it('should handle Buffer input', () => {
      const hash = generateAssetHash(Buffer.from('test'));
      expect(hash).toHaveLength(8);
    });
  });

  describe('analyzeBundleStats', () => {
    const mockAssets: AssetInfo[] = [
      { path: 'main.js', size: 100000, gzipSize: 35000, hash: 'abc123', type: 'js' },
      { path: 'vendor.js', size: 200000, gzipSize: 70000, hash: 'def456', type: 'js' },
      { path: 'styles.css', size: 50000, gzipSize: 15000, hash: 'ghi789', type: 'css' },
      { path: 'photo.jpg', size: 80000, gzipSize: 75000, hash: 'jkl012', type: 'image' },
    ];

    it('should calculate total sizes', () => {
      const stats = analyzeBundleStats(mockAssets);
      expect(stats.totalSize).toBe(430000);
      expect(stats.totalGzipSize).toBe(195000);
    });

    it('should group by asset type', () => {
      const stats = analyzeBundleStats(mockAssets);

      expect(stats.byType.js).toEqual({
        count: 2,
        size: 300000,
        gzipSize: 105000,
      });

      expect(stats.byType.css).toEqual({
        count: 1,
        size: 50000,
        gzipSize: 15000,
      });

      expect(stats.byType.image).toEqual({
        count: 1,
        size: 80000,
        gzipSize: 75000,
      });
    });

    it('should identify largest assets', () => {
      const stats = analyzeBundleStats(mockAssets);
      expect(stats.largestAssets[0].path).toBe('vendor.js');
      expect(stats.largestAssets[1].path).toBe('main.js');
      expect(stats.largestAssets.length).toBeLessThanOrEqual(10);
    });

    it('should handle empty assets', () => {
      const stats = analyzeBundleStats([]);
      expect(stats.totalSize).toBe(0);
      expect(stats.totalGzipSize).toBe(0);
      expect(stats.assets).toHaveLength(0);
      expect(Object.keys(stats.byType)).toHaveLength(0);
    });

    it('should limit largest assets to 10', () => {
      const manyAssets: AssetInfo[] = Array.from({ length: 20 }, (_, i) => ({
        path: `file${i}.js`,
        size: i * 1000,
        gzipSize: i * 300,
        hash: `hash${i}`,
        type: 'js' as const,
      }));

      const stats = analyzeBundleStats(manyAssets);
      expect(stats.largestAssets).toHaveLength(10);
    });
  });

  describe('checkBundleSize', () => {
    const mockStats = analyzeBundleStats([
      { path: 'main.js', size: 1000000, gzipSize: 350000, hash: 'abc', type: 'js' },
      { path: 'styles.css', size: 200000, gzipSize: 60000, hash: 'def', type: 'css' },
    ]);

    it('should pass when under all thresholds', () => {
      const thresholds: SizeThresholds = {
        maxTotalSize: 5000000,
        maxJsSize: 2000000,
        maxCssSize: 500000,
        maxAssetSize: 2000000,
      };

      const result = checkBundleSize(mockStats, thresholds);
      expect(result.passed).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail when total size exceeds limit', () => {
      const thresholds: SizeThresholds = {
        maxTotalSize: 1000000,
      };

      const result = checkBundleSize(mockStats, thresholds);
      expect(result.passed).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Total bundle size');
    });

    it('should fail when JS size exceeds limit', () => {
      const thresholds: SizeThresholds = {
        maxJsSize: 500000,
      };

      const result = checkBundleSize(mockStats, thresholds);
      expect(result.passed).toBe(false);
      expect(result.errors.some(e => e.includes('JavaScript size'))).toBe(true);
    });

    it('should fail when CSS size exceeds limit', () => {
      const thresholds: SizeThresholds = {
        maxCssSize: 100000,
      };

      const result = checkBundleSize(mockStats, thresholds);
      expect(result.passed).toBe(false);
      expect(result.errors.some(e => e.includes('CSS size'))).toBe(true);
    });

    it('should fail when single asset exceeds limit', () => {
      const thresholds: SizeThresholds = {
        maxAssetSize: 500000,
      };

      const result = checkBundleSize(mockStats, thresholds);
      expect(result.passed).toBe(false);
      expect(result.errors.some(e => e.includes('main.js'))).toBe(true);
    });

    it('should generate warnings', () => {
      const thresholds: SizeThresholds = {
        warnTotalSize: 1000000,
        warnAssetSize: 900000,
      };

      const result = checkBundleSize(mockStats, thresholds);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should work with default thresholds', () => {
      const result = checkBundleSize(mockStats, DEFAULT_THRESHOLDS);
      expect(result).toHaveProperty('passed');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('warnings');
    });
  });

  describe('getCacheHeaders', () => {
    it('should return immutable headers for hashed assets', () => {
      const headers = getCacheHeaders('_astro/main.abc12345.js');
      expect(headers['Cache-Control']).toContain('immutable');
      expect(headers['Cache-Control']).toContain('31536000');
    });

    it('should return HTML headers for HTML files', () => {
      const headers = getCacheHeaders('index.html');
      expect(headers['Cache-Control']).toContain('max-age=0');
      expect(headers['Cache-Control']).toContain('must-revalidate');
    });

    it('should return API headers for API routes', () => {
      const headers = getCacheHeaders('/api/users');
      expect(headers['Cache-Control']).toContain('no-store');
      expect(headers['Pragma']).toBe('no-cache');
    });

    it('should return image headers for images', () => {
      const headers = getCacheHeaders('photo.jpg');
      expect(headers['Cache-Control']).toContain('2592000');
      expect(headers['Cache-Control']).toContain('immutable');
    });

    it('should return static headers for other files', () => {
      const headers = getCacheHeaders('manifest.json');
      expect(headers['Cache-Control']).toContain('86400');
    });

    it('should detect hashes in various formats', () => {
      expect(getCacheHeaders('bundle.12345678.js')['Cache-Control']).toContain('immutable');
      expect(getCacheHeaders('styles.abcdef12.css')['Cache-Control']).toContain('immutable');
    });
  });

  describe('generateRecommendations', () => {
    it('should recommend for large assets', () => {
      const stats = analyzeBundleStats([
        { path: 'huge.js', size: 1000000, gzipSize: 350000, hash: 'abc', type: 'js' },
      ]);

      const recommendations = generateRecommendations(stats);
      const largeAssetRec = recommendations.find(r => r.message.includes('Large asset'));
      expect(largeAssetRec).toBeDefined();
      expect(largeAssetRec?.type).toBe('warning');
    });

    it('should recommend for low compression ratios', () => {
      const stats = analyzeBundleStats([
        { path: 'image.jpg', size: 100000, gzipSize: 95000, hash: 'abc', type: 'image' },
      ]);

      const recommendations = generateRecommendations(stats);
      const compressionRec = recommendations.find(r => r.category === 'compression');
      expect(compressionRec).toBeDefined();
    });

    it('should recommend for large total JS size', () => {
      const stats = analyzeBundleStats([
        { path: 'bundle1.js', size: 600000, gzipSize: 200000, hash: 'abc', type: 'js' },
        { path: 'bundle2.js', size: 600000, gzipSize: 200000, hash: 'def', type: 'js' },
      ]);

      const recommendations = generateRecommendations(stats);
      const jsRec = recommendations.find(r => r.message.includes('JavaScript size'));
      expect(jsRec).toBeDefined();
      expect(jsRec?.type).toBe('warning');
    });

    it('should recommend for large total CSS size', () => {
      const stats = analyzeBundleStats([
        { path: 'styles.css', size: 300000, gzipSize: 100000, hash: 'abc', type: 'css' },
      ]);

      const recommendations = generateRecommendations(stats);
      const cssRec = recommendations.find(r => r.message.includes('CSS size'));
      expect(cssRec).toBeDefined();
    });

    it('should recommend for many assets', () => {
      const manyAssets: AssetInfo[] = Array.from({ length: 60 }, (_, i) => ({
        path: `file${i}.js`,
        size: 1000,
        gzipSize: 300,
        hash: `hash${i}`,
        type: 'js' as const,
      }));

      const stats = analyzeBundleStats(manyAssets);
      const recommendations = generateRecommendations(stats);
      const assetCountRec = recommendations.find(r => r.category === 'performance');
      expect(assetCountRec).toBeDefined();
    });

    it('should return empty array for optimal bundle', () => {
      const stats = analyzeBundleStats([
        { path: 'small.js', size: 10000, gzipSize: 3000, hash: 'abc', type: 'js' },
        { path: 'tiny.css', size: 5000, gzipSize: 1500, hash: 'def', type: 'css' },
      ]);

      const recommendations = generateRecommendations(stats);
      expect(recommendations).toHaveLength(0);
    });
  });

  describe('CACHE_HEADERS constants', () => {
    it('should have immutable headers', () => {
      expect(CACHE_HEADERS.immutable['Cache-Control']).toContain('immutable');
    });

    it('should have HTML headers', () => {
      expect(CACHE_HEADERS.html['Cache-Control']).toContain('must-revalidate');
    });

    it('should have API headers', () => {
      expect(CACHE_HEADERS.api['Cache-Control']).toContain('no-store');
      expect(CACHE_HEADERS.api['Pragma']).toBe('no-cache');
    });

    it('should have static headers', () => {
      expect(CACHE_HEADERS.static['Cache-Control']).toContain('public');
    });

    it('should have image headers', () => {
      expect(CACHE_HEADERS.images['Cache-Control']).toContain('immutable');
    });
  });

  describe('DEFAULT_THRESHOLDS', () => {
    it('should have reasonable defaults', () => {
      expect(DEFAULT_THRESHOLDS.maxTotalSize).toBe(5 * 1024 * 1024); // 5 MB
      expect(DEFAULT_THRESHOLDS.maxJsSize).toBe(2 * 1024 * 1024); // 2 MB
      expect(DEFAULT_THRESHOLDS.maxCssSize).toBe(500 * 1024); // 500 KB
      expect(DEFAULT_THRESHOLDS.maxAssetSize).toBe(1 * 1024 * 1024); // 1 MB
    });

    it('should have warning thresholds lower than max', () => {
      expect(DEFAULT_THRESHOLDS.warnTotalSize).toBeLessThan(DEFAULT_THRESHOLDS.maxTotalSize!);
      expect(DEFAULT_THRESHOLDS.warnAssetSize).toBeLessThan(DEFAULT_THRESHOLDS.maxAssetSize!);
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete workflow', () => {
      // Create mock assets
      const assets: AssetInfo[] = [
        { path: '_astro/main.abc123.js', size: 250000, gzipSize: 85000, hash: 'abc123', type: 'js' },
        { path: '_astro/vendor.def456.js', size: 500000, gzipSize: 170000, hash: 'def456', type: 'js' },
        { path: '_astro/styles.ghi789.css', size: 100000, gzipSize: 30000, hash: 'ghi789', type: 'css' },
        { path: 'images/hero.jpg', size: 150000, gzipSize: 140000, hash: 'jkl012', type: 'image' },
      ];

      // Analyze
      const stats = analyzeBundleStats(assets);

      // Verify stats
      expect(stats.totalSize).toBe(1000000);
      expect(stats.totalGzipSize).toBe(425000);

      // Check sizes
      const sizeCheck = checkBundleSize(stats, DEFAULT_THRESHOLDS);
      expect(sizeCheck.passed).toBe(true);

      // Get recommendations
      const recommendations = generateRecommendations(stats);
      expect(Array.isArray(recommendations)).toBe(true);

      // Get cache headers
      assets.forEach(asset => {
        const headers = getCacheHeaders(asset.path);
        expect(headers).toHaveProperty('Cache-Control');
      });
    });

    it('should fail size checks for oversized bundle', () => {
      const assets: AssetInfo[] = [
        { path: 'huge.js', size: 6 * 1024 * 1024, gzipSize: 2 * 1024 * 1024, hash: 'abc', type: 'js' },
      ];

      const stats = analyzeBundleStats(assets);
      const sizeCheck = checkBundleSize(stats, DEFAULT_THRESHOLDS);

      expect(sizeCheck.passed).toBe(false);
      expect(sizeCheck.errors.length).toBeGreaterThan(0);
    });
  });
});
