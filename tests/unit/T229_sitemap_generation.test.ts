/**
 * T229: XML Sitemap Generation Tests
 *
 * Tests for sitemap generation utilities and XML output.
 * Ensures proper sitemap.xml format according to sitemaps.org protocol.
 *
 * @see https://www.sitemaps.org/protocol.html
 * @see https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
 */

import { describe, it, expect } from 'vitest';
import {
  isValidSitemapUrl,
  validatePriority,
  formatSitemapDate,
  createSitemapUrl,
  generateStaticPageUrls,
  generateCourseUrls,
  generateEventUrls,
  generateProductUrls,
  generateSitemapXML,
  generateSitemap,
  validateSitemapXML,
  STATIC_PAGES,
  MAX_SITEMAP_URLS,
} from '@/lib/sitemap';

describe('T229: XML Sitemap Generation', () => {
  const baseUrl = 'https://example.com';

  // ============================================================================
  // URL Validation Tests
  // ============================================================================

  describe('isValidSitemapUrl', () => {
    it('should validate HTTPS URLs', () => {
      expect(isValidSitemapUrl('https://example.com/page')).toBe(true);
    });

    it('should validate HTTP URLs', () => {
      expect(isValidSitemapUrl('http://example.com/page')).toBe(true);
    });

    it('should reject URLs with fragments', () => {
      expect(isValidSitemapUrl('https://example.com/page#section')).toBe(false);
    });

    it('should reject invalid protocols', () => {
      expect(isValidSitemapUrl('ftp://example.com/page')).toBe(false);
    });

    it('should reject malformed URLs', () => {
      expect(isValidSitemapUrl('not a url')).toBe(false);
    });

    it('should validate URLs with query parameters', () => {
      // Query parameters are allowed in sitemaps (though not recommended)
      expect(isValidSitemapUrl('https://example.com/page?q=test')).toBe(true);
    });

    it('should validate URLs with ports', () => {
      expect(isValidSitemapUrl('https://example.com:8080/page')).toBe(true);
    });

    it('should validate URLs with paths', () => {
      expect(isValidSitemapUrl('https://example.com/path/to/page')).toBe(true);
    });
  });

  // ============================================================================
  // Priority Validation Tests
  // ============================================================================

  describe('validatePriority', () => {
    it('should accept valid priorities (0.0 to 1.0)', () => {
      expect(validatePriority(0.0)).toBe(0.0);
      expect(validatePriority(0.5)).toBe(0.5);
      expect(validatePriority(1.0)).toBe(1.0);
    });

    it('should clamp negative priorities to 0.0', () => {
      expect(validatePriority(-0.5)).toBe(0.0);
      expect(validatePriority(-10)).toBe(0.0);
    });

    it('should clamp priorities above 1.0 to 1.0', () => {
      expect(validatePriority(1.5)).toBe(1.0);
      expect(validatePriority(10)).toBe(1.0);
    });

    it('should round to 1 decimal place', () => {
      expect(validatePriority(0.555)).toBe(0.6);
      expect(validatePriority(0.444)).toBe(0.4);
    });

    it('should handle edge cases', () => {
      expect(validatePriority(0.05)).toBe(0.1);
      expect(validatePriority(0.95)).toBe(1.0);
    });
  });

  // ============================================================================
  // Date Formatting Tests
  // ============================================================================

  describe('formatSitemapDate', () => {
    it('should format Date objects to YYYY-MM-DD', () => {
      const date = new Date('2025-11-06T10:30:00Z');
      expect(formatSitemapDate(date)).toBe('2025-11-06');
    });

    it('should format date strings to YYYY-MM-DD', () => {
      expect(formatSitemapDate('2025-11-06T10:30:00Z')).toBe('2025-11-06');
      expect(formatSitemapDate('2025-12-25')).toBe('2025-12-25');
    });

    it('should handle different months', () => {
      expect(formatSitemapDate('2025-01-01')).toBe('2025-01-01');
      expect(formatSitemapDate('2025-12-31')).toBe('2025-12-31');
    });

    it('should throw error for invalid dates', () => {
      expect(() => formatSitemapDate('invalid')).toThrow('Invalid date');
    });

    it('should handle timestamps', () => {
      const date = new Date('2025-11-06T12:00:00Z'); // November 6, 2025 UTC
      const formatted = formatSitemapDate(date);
      expect(formatted).toBe('2025-11-06');
    });
  });

  // ============================================================================
  // Sitemap URL Creation Tests
  // ============================================================================

  describe('createSitemapUrl', () => {
    it('should create basic sitemap URL', () => {
      const url = createSitemapUrl({
        loc: 'https://example.com/page',
      });

      expect(url.loc).toBe('https://example.com/page');
      expect(url.lastmod).toBeUndefined();
      expect(url.changefreq).toBeUndefined();
      expect(url.priority).toBeUndefined();
    });

    it('should include lastmod when provided', () => {
      const url = createSitemapUrl({
        loc: 'https://example.com/page',
        lastmod: '2025-11-06',
      });

      expect(url.lastmod).toBe('2025-11-06');
    });

    it('should include changefreq when provided', () => {
      const url = createSitemapUrl({
        loc: 'https://example.com/page',
        changefreq: 'weekly',
      });

      expect(url.changefreq).toBe('weekly');
    });

    it('should include priority when provided', () => {
      const url = createSitemapUrl({
        loc: 'https://example.com/page',
        priority: 0.8,
      });

      expect(url.priority).toBe(0.8);
    });

    it('should include all optional fields', () => {
      const url = createSitemapUrl({
        loc: 'https://example.com/page',
        lastmod: '2025-11-06',
        changefreq: 'daily',
        priority: 0.9,
      });

      expect(url.loc).toBe('https://example.com/page');
      expect(url.lastmod).toBe('2025-11-06');
      expect(url.changefreq).toBe('daily');
      expect(url.priority).toBe(0.9);
    });

    it('should validate priority', () => {
      const url = createSitemapUrl({
        loc: 'https://example.com/page',
        priority: 1.5, // Invalid, should be clamped
      });

      expect(url.priority).toBe(1.0);
    });

    it('should throw error for invalid URL', () => {
      expect(() =>
        createSitemapUrl({
          loc: 'not a url',
        })
      ).toThrow('Invalid sitemap URL');
    });

    it('should handle all changefreq values', () => {
      const frequencies: Array<'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'> = [
        'always',
        'hourly',
        'daily',
        'weekly',
        'monthly',
        'yearly',
        'never',
      ];

      frequencies.forEach((freq) => {
        const url = createSitemapUrl({
          loc: 'https://example.com/page',
          changefreq: freq,
        });

        expect(url.changefreq).toBe(freq);
      });
    });
  });

  // ============================================================================
  // Static Page URL Generation Tests
  // ============================================================================

  describe('generateStaticPageUrls', () => {
    it('should generate URLs for all static pages', () => {
      const urls = generateStaticPageUrls(baseUrl);

      expect(urls.length).toBe(STATIC_PAGES.length);
    });

    it('should include homepage with priority 1.0', () => {
      const urls = generateStaticPageUrls(baseUrl);
      const homepage = urls.find((u) => u.loc === `${baseUrl}/`);

      expect(homepage).toBeDefined();
      expect(homepage?.priority).toBe(1.0);
      expect(homepage?.changefreq).toBe('daily');
    });

    it('should include main pages with high priority', () => {
      const urls = generateStaticPageUrls(baseUrl);
      const courses = urls.find((u) => u.loc === `${baseUrl}/courses/`);

      expect(courses).toBeDefined();
      expect(courses?.priority).toBe(0.9);
    });

    it('should include policy pages with lower priority', () => {
      const urls = generateStaticPageUrls(baseUrl);
      const privacy = urls.find((u) => u.loc === `${baseUrl}/privacy-policy/`);

      expect(privacy).toBeDefined();
      expect(privacy?.priority).toBe(0.5);
      expect(privacy?.changefreq).toBe('yearly');
    });

    it('should handle baseUrl with trailing slash', () => {
      const urls = generateStaticPageUrls('https://example.com/');
      const homepage = urls.find((u) => u.loc === 'https://example.com/');

      expect(homepage).toBeDefined();
    });

    it('should generate valid URLs', () => {
      const urls = generateStaticPageUrls(baseUrl);

      urls.forEach((url) => {
        expect(isValidSitemapUrl(url.loc)).toBe(true);
      });
    });
  });

  // ============================================================================
  // Course URL Generation Tests
  // ============================================================================

  describe('generateCourseUrls', () => {
    it('should generate URLs for courses', () => {
      const courses = [
        { slug: 'meditation-basics', updated_at: '2025-11-01' },
        { slug: 'advanced-yoga', updated_at: '2025-11-05' },
      ];

      const urls = generateCourseUrls(baseUrl, courses);

      expect(urls.length).toBe(2);
      expect(urls[0].loc).toBe(`${baseUrl}/courses/meditation-basics/`);
      expect(urls[1].loc).toBe(`${baseUrl}/courses/advanced-yoga/`);
    });

    it('should include lastmod from updated_at', () => {
      const courses = [{ slug: 'test-course', updated_at: '2025-11-06' }];

      const urls = generateCourseUrls(baseUrl, courses);

      expect(urls[0].lastmod).toBe('2025-11-06');
    });

    it('should set priority to 0.8', () => {
      const courses = [{ slug: 'test-course' }];

      const urls = generateCourseUrls(baseUrl, courses);

      expect(urls[0].priority).toBe(0.8);
    });

    it('should set changefreq to weekly', () => {
      const courses = [{ slug: 'test-course' }];

      const urls = generateCourseUrls(baseUrl, courses);

      expect(urls[0].changefreq).toBe('weekly');
    });

    it('should handle empty courses array', () => {
      const urls = generateCourseUrls(baseUrl, []);

      expect(urls.length).toBe(0);
    });

    it('should handle courses without updated_at', () => {
      const courses = [{ slug: 'test-course' }];

      const urls = generateCourseUrls(baseUrl, courses);

      expect(urls[0].lastmod).toBeUndefined();
    });
  });

  // ============================================================================
  // Event URL Generation Tests
  // ============================================================================

  describe('generateEventUrls', () => {
    it('should generate URLs for events', () => {
      const events = [
        { slug: 'meditation-retreat', updated_at: '2025-11-01' },
        { slug: 'yoga-workshop', updated_at: '2025-11-05' },
      ];

      const urls = generateEventUrls(baseUrl, events);

      expect(urls.length).toBe(2);
      expect(urls[0].loc).toBe(`${baseUrl}/events/meditation-retreat/`);
      expect(urls[1].loc).toBe(`${baseUrl}/events/yoga-workshop/`);
    });

    it('should include lastmod from updated_at', () => {
      const events = [{ slug: 'test-event', updated_at: '2025-11-06' }];

      const urls = generateEventUrls(baseUrl, events);

      expect(urls[0].lastmod).toBe('2025-11-06');
    });

    it('should set priority to 0.7', () => {
      const events = [{ slug: 'test-event' }];

      const urls = generateEventUrls(baseUrl, events);

      expect(urls[0].priority).toBe(0.7);
    });

    it('should set changefreq to weekly', () => {
      const events = [{ slug: 'test-event' }];

      const urls = generateEventUrls(baseUrl, events);

      expect(urls[0].changefreq).toBe('weekly');
    });

    it('should handle empty events array', () => {
      const urls = generateEventUrls(baseUrl, []);

      expect(urls.length).toBe(0);
    });
  });

  // ============================================================================
  // Product URL Generation Tests
  // ============================================================================

  describe('generateProductUrls', () => {
    it('should generate URLs for products', () => {
      const products = [
        { slug: 'meditation-guide-pdf', updated_at: '2025-11-01' },
        { slug: 'yoga-video-course', updated_at: '2025-11-05' },
      ];

      const urls = generateProductUrls(baseUrl, products);

      expect(urls.length).toBe(2);
      expect(urls[0].loc).toBe(`${baseUrl}/products/meditation-guide-pdf/`);
      expect(urls[1].loc).toBe(`${baseUrl}/products/yoga-video-course/`);
    });

    it('should include lastmod from updated_at', () => {
      const products = [{ slug: 'test-product', updated_at: '2025-11-06' }];

      const urls = generateProductUrls(baseUrl, products);

      expect(urls[0].lastmod).toBe('2025-11-06');
    });

    it('should set priority to 0.8', () => {
      const products = [{ slug: 'test-product' }];

      const urls = generateProductUrls(baseUrl, products);

      expect(urls[0].priority).toBe(0.8);
    });

    it('should set changefreq to weekly', () => {
      const products = [{ slug: 'test-product' }];

      const urls = generateProductUrls(baseUrl, products);

      expect(urls[0].changefreq).toBe('weekly');
    });

    it('should handle empty products array', () => {
      const urls = generateProductUrls(baseUrl, []);

      expect(urls.length).toBe(0);
    });
  });

  // ============================================================================
  // XML Generation Tests
  // ============================================================================

  describe('generateSitemapXML', () => {
    it('should generate valid XML structure', () => {
      const urls = [
        createSitemapUrl({
          loc: 'https://example.com/',
          priority: 1.0,
        }),
      ];

      const xml = generateSitemapXML(urls);

      expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
      expect(xml).toContain('</urlset>');
    });

    it('should include URL elements', () => {
      const urls = [
        createSitemapUrl({
          loc: 'https://example.com/page',
        }),
      ];

      const xml = generateSitemapXML(urls);

      expect(xml).toContain('<url>');
      expect(xml).toContain('<loc>https://example.com/page</loc>');
      expect(xml).toContain('</url>');
    });

    it('should include all optional fields', () => {
      const urls = [
        createSitemapUrl({
          loc: 'https://example.com/page',
          lastmod: '2025-11-06',
          changefreq: 'weekly',
          priority: 0.8,
        }),
      ];

      const xml = generateSitemapXML(urls);

      expect(xml).toContain('<lastmod>2025-11-06</lastmod>');
      expect(xml).toContain('<changefreq>weekly</changefreq>');
      expect(xml).toContain('<priority>0.8</priority>');
    });

    it('should escape XML special characters', () => {
      const urls = [
        createSitemapUrl({
          loc: 'https://example.com/page?q=test&foo=bar',
        }),
      ];

      const xml = generateSitemapXML(urls);

      expect(xml).toContain('&amp;');
    });

    it('should handle multiple URLs', () => {
      const urls = [
        createSitemapUrl({ loc: 'https://example.com/page1' }),
        createSitemapUrl({ loc: 'https://example.com/page2' }),
        createSitemapUrl({ loc: 'https://example.com/page3' }),
      ];

      const xml = generateSitemapXML(urls);

      const urlCount = (xml.match(/<url>/g) || []).length;
      expect(urlCount).toBe(3);
    });

    it('should format priority with one decimal place', () => {
      const urls = [
        createSitemapUrl({
          loc: 'https://example.com/page',
          priority: 0.555, // Should round to 0.6
        }),
      ];

      const xml = generateSitemapXML(urls);

      expect(xml).toContain('<priority>0.6</priority>');
    });

    it('should handle empty URLs array', () => {
      const xml = generateSitemapXML([]);

      expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
      expect(xml).toContain('</urlset>');
      expect(xml).not.toContain('<url>');
    });
  });

  // ============================================================================
  // Complete Sitemap Generation Tests
  // ============================================================================

  describe('generateSitemap', () => {
    it('should generate complete sitemap with all content types', async () => {
      const result = await generateSitemap(
        {
          baseUrl,
          includeStatic: true,
          includeCourses: true,
          includeEvents: true,
          includeProducts: true,
        },
        {
          courses: [{ slug: 'test-course', updated_at: '2025-11-01' }],
          events: [{ slug: 'test-event', updated_at: '2025-11-02' }],
          products: [{ slug: 'test-product', updated_at: '2025-11-03' }],
        }
      );

      expect(result.count).toBeGreaterThan(0);
      expect(result.urls.length).toBe(result.count);
      expect(result.generatedAt).toBeInstanceOf(Date);
    });

    it('should include static pages when enabled', async () => {
      const result = await generateSitemap(
        {
          baseUrl,
          includeStatic: true,
        },
        {}
      );

      expect(result.count).toBe(STATIC_PAGES.length);
    });

    it('should exclude static pages when disabled', async () => {
      const result = await generateSitemap(
        {
          baseUrl,
          includeStatic: false,
        },
        {}
      );

      expect(result.count).toBe(0);
    });

    it('should include courses when enabled', async () => {
      const result = await generateSitemap(
        {
          baseUrl,
          includeStatic: false,
          includeCourses: true,
        },
        {
          courses: [{ slug: 'test' }],
        }
      );

      expect(result.count).toBe(1);
    });

    it('should include events when enabled', async () => {
      const result = await generateSitemap(
        {
          baseUrl,
          includeStatic: false,
          includeEvents: true,
        },
        {
          events: [{ slug: 'test' }],
        }
      );

      expect(result.count).toBe(1);
    });

    it('should include products when enabled', async () => {
      const result = await generateSitemap(
        {
          baseUrl,
          includeStatic: false,
          includeProducts: true,
        },
        {
          products: [{ slug: 'test' }],
        }
      );

      expect(result.count).toBe(1);
    });

    it('should handle large number of URLs', async () => {
      const manyProducts = Array.from({ length: 1000 }, (_, i) => ({
        slug: `product-${i}`,
      }));

      const result = await generateSitemap(
        {
          baseUrl,
          includeStatic: false,
          includeProducts: true,
        },
        {
          products: manyProducts,
        }
      );

      expect(result.count).toBe(1000);
    });
  });

  // ============================================================================
  // XML Validation Tests
  // ============================================================================

  describe('validateSitemapXML', () => {
    it('should validate correct sitemap XML', () => {
      const urls = [createSitemapUrl({ loc: 'https://example.com/' })];
      const xml = generateSitemapXML(urls);

      const validation = validateSitemapXML(xml);

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect missing XML declaration', () => {
      const xml = '<urlset><url><loc>https://example.com/</loc></url></urlset>';

      const validation = validateSitemapXML(xml);

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Missing or invalid XML declaration');
    });

    it('should detect missing urlset element', () => {
      const xml = '<?xml version="1.0" encoding="UTF-8"?>\n<url><loc>https://example.com/</loc></url>';

      const validation = validateSitemapXML(xml);

      expect(validation.valid).toBe(false);
      expect(validation.errors.some((e) => e.includes('urlset'))).toBe(true);
    });

    it('should detect URL count exceeding limit', () => {
      const urls = Array.from({ length: MAX_SITEMAP_URLS + 1 }, (_, i) =>
        createSitemapUrl({ loc: `https://example.com/page${i}` })
      );
      const xml = generateSitemapXML(urls);

      const validation = validateSitemapXML(xml);

      expect(validation.valid).toBe(false);
      expect(validation.errors.some((e) => e.includes('exceeds maximum'))).toBe(true);
    });

    it('should validate sitemap with multiple URLs', () => {
      const urls = Array.from({ length: 100 }, (_, i) =>
        createSitemapUrl({ loc: `https://example.com/page${i}` })
      );
      const xml = generateSitemapXML(urls);

      const validation = validateSitemapXML(xml);

      expect(validation.valid).toBe(true);
    });
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle URLs with special characters', () => {
      const url = createSitemapUrl({
        loc: 'https://example.com/page?q=test&foo=bar',
      });

      const xml = generateSitemapXML([url]);

      expect(xml).toContain('&amp;');
    });

    it('should handle international URLs', () => {
      const url = createSitemapUrl({
        loc: 'https://example.com/página',
      });

      expect(url.loc).toBe('https://example.com/página');
    });

    it('should handle very long URLs', () => {
      const longPath = 'a'.repeat(1000);
      const url = createSitemapUrl({
        loc: `https://example.com/${longPath}`,
      });

      expect(url.loc.length).toBeGreaterThan(1000);
    });

    it('should handle dates at boundaries', () => {
      expect(formatSitemapDate('2025-01-01')).toBe('2025-01-01');
      expect(formatSitemapDate('2025-12-31')).toBe('2025-12-31');
    });

    it('should handle priority boundaries', () => {
      expect(validatePriority(0.0)).toBe(0.0);
      expect(validatePriority(1.0)).toBe(1.0);
    });
  });
});
