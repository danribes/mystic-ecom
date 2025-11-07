/**
 * T228: Canonical URLs Tests
 *
 * Comprehensive tests for canonical URL generation and validation.
 * Tests the canonicalUrl utility and SEO component integration.
 */

import { describe, it, expect } from 'vitest';
import {
  generateCanonicalUrl,
  generateCanonicalUrlFromAstro,
  validateCanonicalUrl,
  normalizeUrls,
  areUrlsEquivalent,
} from '@/lib/canonicalUrl';

describe('T228: Canonical URLs', () => {
  const baseUrl = 'https://example.com';
  const httpBaseUrl = 'http://example.com';

  describe('generateCanonicalUrl', () => {
    describe('Basic Functionality', () => {
      it('should generate canonical URL with trailing slash', () => {
        const result = generateCanonicalUrl('/about', baseUrl);
        expect(result).toBe('https://example.com/about/');
      });

      it('should handle root path correctly', () => {
        const result = generateCanonicalUrl('/', baseUrl);
        expect(result).toBe('https://example.com/');
      });

      it('should handle empty pathname as root', () => {
        const result = generateCanonicalUrl('', baseUrl);
        expect(result).toBe('https://example.com/');
      });

      it('should handle nested paths', () => {
        const result = generateCanonicalUrl('/courses/meditation-101', baseUrl);
        expect(result).toBe('https://example.com/courses/meditation-101/');
      });

      it('should handle deep nested paths', () => {
        const result = generateCanonicalUrl('/blog/2025/11/article', baseUrl);
        expect(result).toBe('https://example.com/blog/2025/11/article/');
      });
    });

    describe('Trailing Slash Handling', () => {
      it('should add trailing slash by default', () => {
        const result = generateCanonicalUrl('/about', baseUrl);
        expect(result).toBe('https://example.com/about/');
      });

      it('should not add trailing slash when disabled', () => {
        const result = generateCanonicalUrl('/about', baseUrl, { trailingSlash: false });
        expect(result).toBe('https://example.com/about');
      });

      it('should normalize multiple trailing slashes', () => {
        const result = generateCanonicalUrl('/about///', baseUrl);
        expect(result).toBe('https://example.com/about/');
      });

      it('should not add trailing slash to file extensions', () => {
        const result = generateCanonicalUrl('/sitemap.xml', baseUrl);
        expect(result).toBe('https://example.com/sitemap.xml');
      });

      it('should not add trailing slash to robots.txt', () => {
        const result = generateCanonicalUrl('/robots.txt', baseUrl);
        expect(result).toBe('https://example.com/robots.txt');
      });

      it('should not add trailing slash to .json files', () => {
        const result = generateCanonicalUrl('/api/data.json', baseUrl);
        expect(result).toBe('https://example.com/api/data.json');
      });
    });

    describe('HTTPS Enforcement', () => {
      it('should keep HTTPS when already HTTPS', () => {
        const result = generateCanonicalUrl('/about', baseUrl);
        expect(result).toBe('https://example.com/about/');
      });

      it('should convert HTTP to HTTPS by default', () => {
        const result = generateCanonicalUrl('/about', httpBaseUrl);
        expect(result).toBe('https://example.com/about/');
      });

      it('should not convert HTTP when forceHttps is false', () => {
        const result = generateCanonicalUrl('/about', httpBaseUrl, { forceHttps: false });
        expect(result).toBe('http://example.com/about/');
      });
    });

    describe('Query Parameter Handling', () => {
      it('should remove query parameters by default', () => {
        const result = generateCanonicalUrl('/about?utm_source=email', baseUrl);
        expect(result).toBe('https://example.com/about/');
      });

      it('should remove multiple query parameters', () => {
        const result = generateCanonicalUrl('/about?page=2&sort=name&filter=active', baseUrl);
        expect(result).toBe('https://example.com/about/');
      });

      it('should keep query parameters when disabled', () => {
        const result = generateCanonicalUrl('/about?page=2', baseUrl, { removeQueryParams: false });
        expect(result).toBe('https://example.com/about/?page=2');
      });
    });

    describe('Fragment Handling', () => {
      it('should remove fragments by default', () => {
        const result = generateCanonicalUrl('/about#section', baseUrl);
        expect(result).toBe('https://example.com/about/');
      });

      it('should keep fragments when disabled', () => {
        const result = generateCanonicalUrl('/about#section', baseUrl, { removeFragment: false });
        expect(result).toBe('https://example.com/about/#section');
      });

      it('should remove both query params and fragments', () => {
        const result = generateCanonicalUrl('/about?page=2#section', baseUrl);
        expect(result).toBe('https://example.com/about/');
      });
    });

    describe('Path Normalization', () => {
      it('should add leading slash if missing', () => {
        const result = generateCanonicalUrl('about', baseUrl);
        expect(result).toBe('https://example.com/about/');
      });

      it('should handle paths with spaces (encoded)', () => {
        const result = generateCanonicalUrl('/my%20page', baseUrl);
        expect(result).toBe('https://example.com/my%20page/');
      });

      it('should trim whitespace from pathname', () => {
        const result = generateCanonicalUrl('  /about  ', baseUrl);
        expect(result).toBe('https://example.com/about/');
      });

      it('should trim whitespace from baseUrl', () => {
        const result = generateCanonicalUrl('/about', '  https://example.com  ');
        expect(result).toBe('https://example.com/about/');
      });

      it('should remove trailing slash from baseUrl', () => {
        const result = generateCanonicalUrl('/about', 'https://example.com/');
        expect(result).toBe('https://example.com/about/');
      });

      it('should handle baseUrl with multiple trailing slashes', () => {
        const result = generateCanonicalUrl('/about', 'https://example.com///');
        expect(result).toBe('https://example.com/about/');
      });
    });

    describe('Lowercase Conversion', () => {
      it('should not convert to lowercase by default', () => {
        const result = generateCanonicalUrl('/About/Contact', baseUrl);
        expect(result).toBe('https://example.com/About/Contact/');
      });

      it('should convert to lowercase when enabled', () => {
        const result = generateCanonicalUrl('/About/Contact', baseUrl, { lowercase: true });
        expect(result).toBe('https://example.com/about/contact/');
      });
    });

    describe('Complex Scenarios', () => {
      it('should handle all transformations together', () => {
        const result = generateCanonicalUrl(
          '/ABOUT?utm_source=email#section',
          'http://example.com/',
          {
            trailingSlash: true,
            forceHttps: true,
            removeQueryParams: true,
            removeFragment: true,
            lowercase: true,
          }
        );
        expect(result).toBe('https://example.com/about/');
      });

      it('should handle dynamic routes', () => {
        const result = generateCanonicalUrl('/courses/123', baseUrl);
        expect(result).toBe('https://example.com/courses/123/');
      });

      it('should handle UUID-based routes', () => {
        const result = generateCanonicalUrl(
          '/events/550e8400-e29b-41d4-a716-446655440000',
          baseUrl
        );
        expect(result).toBe('https://example.com/events/550e8400-e29b-41d4-a716-446655440000/');
      });

      it('should handle API routes', () => {
        const result = generateCanonicalUrl('/api/v1/users', baseUrl, { trailingSlash: false });
        expect(result).toBe('https://example.com/api/v1/users');
      });
    });
  });

  describe('generateCanonicalUrlFromAstro', () => {
    const mockAstroUrl = new URL('https://example.com/about');
    const mockAstroSite = new URL('https://example.com');

    it('should generate canonical URL from Astro context', () => {
      const result = generateCanonicalUrlFromAstro(mockAstroUrl, mockAstroSite);
      expect(result).toBe('https://example.com/about/');
    });

    it('should handle missing Astro.site', () => {
      const result = generateCanonicalUrlFromAstro(mockAstroUrl, undefined);
      expect(result).toBe('https://example.com/about/');
    });

    it('should use custom canonical when provided as full URL', () => {
      const result = generateCanonicalUrlFromAstro(
        mockAstroUrl,
        mockAstroSite,
        'https://custom.com/page'
      );
      expect(result).toBe('https://custom.com/page/');
    });

    it('should use custom canonical when provided as pathname', () => {
      const result = generateCanonicalUrlFromAstro(mockAstroUrl, mockAstroSite, '/custom-page');
      expect(result).toBe('https://example.com/custom-page/');
    });

    it('should handle Astro URL with query parameters', () => {
      const urlWithQuery = new URL('https://example.com/about?page=2');
      const result = generateCanonicalUrlFromAstro(urlWithQuery, mockAstroSite);
      expect(result).toBe('https://example.com/about/');
    });

    it('should handle Astro URL with fragment', () => {
      const urlWithFragment = new URL('https://example.com/about#section');
      const result = generateCanonicalUrlFromAstro(urlWithFragment, mockAstroSite);
      expect(result).toBe('https://example.com/about/');
    });

    it('should apply custom options', () => {
      const result = generateCanonicalUrlFromAstro(mockAstroUrl, mockAstroSite, undefined, {
        trailingSlash: false,
      });
      expect(result).toBe('https://example.com/about');
    });
  });

  describe('validateCanonicalUrl', () => {
    describe('Valid URLs', () => {
      it('should validate correct canonical URL', () => {
        const result = validateCanonicalUrl('https://example.com/about/');
        expect(result.valid).toBe(true);
        expect(result.issues).toHaveLength(0);
      });

      it('should validate root URL', () => {
        const result = validateCanonicalUrl('https://example.com/');
        expect(result.valid).toBe(true);
        expect(result.issues).toHaveLength(0);
      });

      it('should validate URL with file extension', () => {
        const result = validateCanonicalUrl('https://example.com/sitemap.xml');
        expect(result.valid).toBe(true);
        expect(result.issues).toHaveLength(0);
      });
    });

    describe('Invalid URLs', () => {
      it('should detect HTTP protocol', () => {
        const result = validateCanonicalUrl('http://example.com/about/');
        expect(result.valid).toBe(false);
        expect(result.issues).toContain('Should use HTTPS protocol');
      });

      it('should detect query parameters', () => {
        const result = validateCanonicalUrl('https://example.com/about/?page=2');
        expect(result.valid).toBe(false);
        expect(result.issues).toContain('Contains query parameters');
      });

      it('should detect fragments', () => {
        const result = validateCanonicalUrl('https://example.com/about/#section');
        expect(result.valid).toBe(false);
        expect(result.issues).toContain('Contains URL fragment (hash)');
      });

      it('should detect missing trailing slash', () => {
        const result = validateCanonicalUrl('https://example.com/about');
        expect(result.valid).toBe(false);
        expect(result.issues).toContain('Missing trailing slash');
      });

      it('should detect double slashes', () => {
        const result = validateCanonicalUrl('https://example.com//about/');
        expect(result.valid).toBe(false);
        expect(result.issues).toContain('Contains double slashes in path');
      });

      it('should detect multiple issues', () => {
        const result = validateCanonicalUrl('http://example.com/about?page=2#section');
        expect(result.valid).toBe(false);
        expect(result.issues.length).toBeGreaterThan(1);
        expect(result.issues).toContain('Should use HTTPS protocol');
        expect(result.issues).toContain('Contains query parameters');
        expect(result.issues).toContain('Contains URL fragment (hash)');
        expect(result.issues).toContain('Missing trailing slash');
      });

      it('should detect invalid URL format', () => {
        const result = validateCanonicalUrl('not a valid url');
        expect(result.valid).toBe(false);
        expect(result.issues).toContain('Invalid URL format');
      });
    });
  });

  describe('normalizeUrls', () => {
    it('should normalize multiple URL variations', () => {
      const urls = [
        'https://example.com/about',
        'http://example.com/about/',
        'https://example.com/about?utm_source=email',
        'https://example.com/about#section',
      ];
      const normalized = normalizeUrls(urls);
      expect(normalized).toEqual([
        'https://example.com/about/',
        'https://example.com/about/',
        'https://example.com/about/',
        'https://example.com/about/',
      ]);
    });

    it('should handle different paths separately', () => {
      const urls = ['https://example.com/about', 'https://example.com/contact'];
      const normalized = normalizeUrls(urls);
      expect(normalized).toEqual([
        'https://example.com/about/',
        'https://example.com/contact/',
      ]);
    });

    it('should handle invalid URLs gracefully', () => {
      const urls = ['https://example.com/about', 'not a url'];
      const normalized = normalizeUrls(urls);
      expect(normalized[0]).toBe('https://example.com/about/');
      expect(normalized[1]).toBe('not a url');
    });

    it('should apply custom options to all URLs', () => {
      const urls = [
        'https://example.com/about',
        'https://example.com/contact',
      ];
      const normalized = normalizeUrls(urls, { trailingSlash: false });
      expect(normalized).toEqual([
        'https://example.com/about',
        'https://example.com/contact',
      ]);
    });
  });

  describe('areUrlsEquivalent', () => {
    it('should detect equivalent URLs', () => {
      const result = areUrlsEquivalent(
        'https://example.com/about',
        'http://example.com/about?utm_source=email'
      );
      expect(result).toBe(true);
    });

    it('should detect different URLs', () => {
      const result = areUrlsEquivalent(
        'https://example.com/about',
        'https://example.com/contact'
      );
      expect(result).toBe(false);
    });

    it('should handle URLs with and without trailing slashes', () => {
      const result = areUrlsEquivalent(
        'https://example.com/about',
        'https://example.com/about/'
      );
      expect(result).toBe(true);
    });

    it('should handle URLs with query params and fragments', () => {
      const result = areUrlsEquivalent(
        'https://example.com/about?page=2#section',
        'https://example.com/about'
      );
      expect(result).toBe(true);
    });

    it('should detect different domains', () => {
      const result = areUrlsEquivalent(
        'https://example.com/about',
        'https://other.com/about'
      );
      expect(result).toBe(false);
    });

    it('should apply custom options', () => {
      const result = areUrlsEquivalent(
        'https://example.com/ABOUT',
        'https://example.com/about',
        { lowercase: true }
      );
      expect(result).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty strings', () => {
      const result = generateCanonicalUrl('', baseUrl);
      expect(result).toBe('https://example.com/');
    });

    it('should handle special characters in path', () => {
      const result = generateCanonicalUrl('/courses/meditation-&-mindfulness', baseUrl);
      expect(result).toBe('https://example.com/courses/meditation-&-mindfulness/');
    });

    it('should handle international characters', () => {
      const result = generateCanonicalUrl('/página', baseUrl);
      expect(result).toBe('https://example.com/página/');
    });

    it('should handle numbers in path', () => {
      const result = generateCanonicalUrl('/2025/11/06', baseUrl);
      expect(result).toBe('https://example.com/2025/11/06/');
    });

    it('should handle hyphens and underscores', () => {
      const result = generateCanonicalUrl('/my-page_name', baseUrl);
      expect(result).toBe('https://example.com/my-page_name/');
    });

    it('should handle very long paths', () => {
      const longPath = '/a'.repeat(100);
      const result = generateCanonicalUrl(longPath, baseUrl);
      expect(result).toBe(`https://example.com${longPath}/`);
    });
  });

  describe('Real-World Scenarios', () => {
    describe('Course Pages', () => {
      it('should handle course detail page', () => {
        const result = generateCanonicalUrl('/courses/meditation-101', baseUrl);
        expect(result).toBe('https://example.com/courses/meditation-101/');
      });

      it('should remove tracking parameters from course page', () => {
        const result = generateCanonicalUrl(
          '/courses/meditation-101?utm_campaign=email&utm_source=newsletter',
          baseUrl
        );
        expect(result).toBe('https://example.com/courses/meditation-101/');
      });
    });

    describe('Event Pages', () => {
      it('should handle event detail page', () => {
        const result = generateCanonicalUrl('/events/mindfulness-retreat-2025', baseUrl);
        expect(result).toBe('https://example.com/events/mindfulness-retreat-2025/');
      });
    });

    describe('Blog Pages', () => {
      it('should handle blog post with date structure', () => {
        const result = generateCanonicalUrl('/blog/2025/11/spiritual-awakening', baseUrl);
        expect(result).toBe('https://example.com/blog/2025/11/spiritual-awakening/');
      });
    });

    describe('Static Pages', () => {
      it('should handle about page', () => {
        const result = generateCanonicalUrl('/about', baseUrl);
        expect(result).toBe('https://example.com/about/');
      });

      it('should handle contact page', () => {
        const result = generateCanonicalUrl('/contact', baseUrl);
        expect(result).toBe('https://example.com/contact/');
      });

      it('should handle terms of service', () => {
        const result = generateCanonicalUrl('/terms-of-service', baseUrl);
        expect(result).toBe('https://example.com/terms-of-service/');
      });

      it('should handle privacy policy', () => {
        const result = generateCanonicalUrl('/privacy-policy', baseUrl);
        expect(result).toBe('https://example.com/privacy-policy/');
      });
    });

    describe('Special Files', () => {
      it('should handle sitemap.xml', () => {
        const result = generateCanonicalUrl('/sitemap.xml', baseUrl);
        expect(result).toBe('https://example.com/sitemap.xml');
      });

      it('should handle robots.txt', () => {
        const result = generateCanonicalUrl('/robots.txt', baseUrl);
        expect(result).toBe('https://example.com/robots.txt');
      });

      it('should handle manifest.json', () => {
        const result = generateCanonicalUrl('/manifest.json', baseUrl);
        expect(result).toBe('https://example.com/manifest.json');
      });
    });
  });
});
