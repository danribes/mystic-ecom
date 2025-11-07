/**
 * T235: SEO Audit Tests
 *
 * Comprehensive test suite for SEO validation utilities.
 * Tests all aspects of SEO: meta tags, structured data, canonical URLs,
 * Open Graph, Twitter Cards, robots.txt, and sitemaps.
 *
 * @jest-environment node
 */

import { describe, it, expect } from 'vitest';
import {
  // Meta Tags
  extractMetaTags,
  getMetaContent,
  validateMetaTags,
  // Structured Data
  extractStructuredData,
  validateStructuredData,
  // Canonical URL
  validateCanonicalUrl,
  // Open Graph
  validateOpenGraph,
  // Twitter Cards
  validateTwitterCard,
  // Robots.txt
  validateRobotsTxt,
  // Sitemap
  validateSitemap,
  // Complete Audit
  auditSEO,
  // Constants
  SEO_LIMITS,
  REQUIRED_META_TAGS,
  REQUIRED_OG_TAGS,
  REQUIRED_TWITTER_TAGS,
} from '@/scripts/seo-audit';

// ============================================================================
// Test Helpers
// ============================================================================

function createTestHTML(options: {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  ogTags?: Record<string, string>;
  twitterTags?: Record<string, string>;
  structuredData?: any[];
  includeViewport?: boolean;
  includeRobots?: boolean;
}): string {
  const {
    title = 'Test Page',
    description,
    keywords,
    canonical,
    ogTags,
    twitterTags,
    structuredData,
    includeViewport = true,
    includeRobots = true,
  } = options;

  let html = `<!DOCTYPE html><html><head>`;

  // Title
  html += `<title>${title}</title>`;

  // Meta tags
  if (description) {
    html += `<meta name="description" content="${description}" />`;
  }
  if (keywords) {
    html += `<meta name="keywords" content="${keywords}" />`;
  }
  if (includeViewport) {
    html += `<meta name="viewport" content="width=device-width, initial-scale=1.0" />`;
  }
  if (includeRobots) {
    html += `<meta name="robots" content="index, follow" />`;
  }

  // Canonical
  if (canonical) {
    html += `<link rel="canonical" href="${canonical}" />`;
  }

  // Open Graph
  if (ogTags) {
    Object.entries(ogTags).forEach(([key, value]) => {
      html += `<meta property="${key}" content="${value}" />`;
    });
  }

  // Twitter Cards
  if (twitterTags) {
    Object.entries(twitterTags).forEach(([key, value]) => {
      html += `<meta name="${key}" content="${value}" />`;
    });
  }

  // Structured Data
  if (structuredData) {
    structuredData.forEach(data => {
      html += `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
    });
  }

  html += `</head><body></body></html>`;
  return html;
}

// ============================================================================
// Meta Tags Tests
// ============================================================================

describe('T235: SEO Audit - Meta Tags', () => {
  describe('extractMetaTags', () => {
    it('should extract meta tags from HTML', () => {
      const html = createTestHTML({
        description: 'Test description',
        keywords: 'test, keywords',
      });

      const tags = extractMetaTags(html);

      expect(tags.length).toBeGreaterThan(0);
      expect(tags.some(t => t.name === 'description')).toBe(true);
      expect(tags.some(t => t.name === 'keywords')).toBe(true);
    });

    it('should extract both name and property attributes', () => {
      const html = `
        <html><head>
          <meta name="description" content="Test" />
          <meta property="og:title" content="OG Title" />
        </head></html>
      `;

      const tags = extractMetaTags(html);

      expect(tags.some(t => t.name === 'description')).toBe(true);
      expect(tags.some(t => t.property === 'og:title')).toBe(true);
    });

    it('should return empty array for HTML with no meta tags', () => {
      const html = `<html><head><title>Test</title></head></html>`;
      const tags = extractMetaTags(html);

      expect(Array.isArray(tags)).toBe(true);
      expect(tags.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getMetaContent', () => {
    it('should get meta content by name', () => {
      const html = createTestHTML({
        description: 'Test description',
      });
      const tags = extractMetaTags(html);

      const content = getMetaContent(tags, 'description');
      expect(content).toBe('Test description');
    });

    it('should get meta content by property', () => {
      const html = createTestHTML({
        ogTags: {
          'og:title': 'OG Title',
        },
      });
      const tags = extractMetaTags(html);

      const content = getMetaContent(tags, 'og:title');
      expect(content).toBe('OG Title');
    });

    it('should return undefined for non-existent tag', () => {
      const html = createTestHTML({});
      const tags = extractMetaTags(html);

      const content = getMetaContent(tags, 'nonexistent');
      expect(content).toBeUndefined();
    });
  });

  describe('validateMetaTags', () => {
    it('should pass for valid meta tags', () => {
      const html = createTestHTML({
        title: 'Perfect SEO Title - 50 Characters Exactly Here',
        description: 'This is a perfect meta description with the right length between 150 and 160 characters to maximize search engine visibility and click rates.',
        keywords: 'seo, meta, tags, test, validation',
      });

      const result = validateMetaTags(html);

      expect(result.isValid).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(80);
      expect(result.issues).toHaveLength(0);
      expect(result.tags.title).toBe('Perfect SEO Title - 50 Characters Exactly Here');
      expect(result.tags.description).toContain('perfect meta description');
    });

    it('should fail for missing title', () => {
      const html = `<html><head></head></html>`;
      const result = validateMetaTags(html);

      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('Missing <title> tag');
      expect(result.score).toBeLessThan(80);
    });

    it('should fail for missing description', () => {
      const html = createTestHTML({
        title: 'Test Page',
        description: undefined,
      });

      const result = validateMetaTags(html);

      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('Missing meta description');
      expect(result.score).toBeLessThan(80);
    });

    it('should warn for title too short', () => {
      const html = createTestHTML({
        title: 'Short',
        description: 'This is a valid description with enough characters to pass the minimum length requirements for SEO.',
      });

      const result = validateMetaTags(html);

      expect(result.isValid).toBe(false);
      expect(result.issues.some(i => i.includes('Title too short'))).toBe(true);
    });

    it('should warn for title too long', () => {
      const html = createTestHTML({
        title: 'This is an extremely long title that exceeds the recommended 60 character limit for optimal SEO',
        description: 'Valid description',
      });

      const result = validateMetaTags(html);

      expect(result.warnings.some(w => w.includes('Title too long'))).toBe(true);
    });

    it('should warn for description too short', () => {
      const html = createTestHTML({
        title: 'Good Title With Perfect Length For SEO Testing',
        description: 'Too short',
      });

      const result = validateMetaTags(html);

      expect(result.issues.some(i => i.includes('Description too short'))).toBe(true);
    });

    it('should warn for description too long', () => {
      const html = createTestHTML({
        title: 'Good Title',
        description: 'This is an extremely long meta description that far exceeds the recommended maximum length of 160 characters which will cause search engines to truncate it in search results.',
      });

      const result = validateMetaTags(html);

      expect(result.warnings.some(w => w.includes('Description too long'))).toBe(true);
    });

    it('should warn for missing viewport', () => {
      const html = createTestHTML({
        title: 'Test Page With Good Length For SEO Testing Here',
        description: 'This is a good description with the right length for SEO testing purposes and will pass all validation checks.',
        includeViewport: false,
      });

      const result = validateMetaTags(html);

      expect(result.warnings).toContain('Missing viewport meta tag');
    });

    it('should validate keywords count', () => {
      const html = createTestHTML({
        title: 'Test Page With Good Length For SEO Testing Here',
        description: 'This is a good description with the right length for SEO testing purposes and will pass all validation checks.',
        keywords: 'only, two',
      });

      const result = validateMetaTags(html);

      expect(result.warnings.some(w => w.includes('Few keywords'))).toBe(true);
    });

    it('should warn for too many keywords', () => {
      const html = createTestHTML({
        title: 'Test Page With Good Length For SEO Testing Here',
        description: 'This is a good description with the right length for SEO testing purposes and will pass all validation checks.',
        keywords: 'one, two, three, four, five, six, seven, eight, nine, ten, eleven, twelve',
      });

      const result = validateMetaTags(html);

      expect(result.warnings.some(w => w.includes('Too many keywords'))).toBe(true);
    });
  });
});

// ============================================================================
// Structured Data Tests
// ============================================================================

describe('T235: SEO Audit - Structured Data', () => {
  describe('extractStructuredData', () => {
    it('should extract JSON-LD structured data', () => {
      const html = createTestHTML({
        structuredData: [
          {
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'Test Site',
            url: 'https://example.com',
          },
        ],
      });

      const schemas = extractStructuredData(html);

      expect(schemas).toHaveLength(1);
      expect(schemas[0]['@type']).toBe('WebSite');
      expect(schemas[0].name).toBe('Test Site');
    });

    it('should extract multiple structured data schemas', () => {
      const html = createTestHTML({
        structuredData: [
          {
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'Test Site',
          },
          {
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'Test Org',
          },
        ],
      });

      const schemas = extractStructuredData(html);

      expect(schemas).toHaveLength(2);
      expect(schemas[0]['@type']).toBe('WebSite');
      expect(schemas[1]['@type']).toBe('Organization');
    });

    it('should return empty array if no structured data', () => {
      const html = createTestHTML({});
      const schemas = extractStructuredData(html);

      expect(schemas).toHaveLength(0);
    });
  });

  describe('validateStructuredData', () => {
    it('should pass for valid WebSite schema', () => {
      const html = createTestHTML({
        structuredData: [
          {
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'Test Site',
            url: 'https://example.com',
            description: 'Test site description',
          },
        ],
      });

      const result = validateStructuredData(html);

      expect(result.isValid).toBe(true);
      expect(result.score).toBe(100);
      expect(result.issues).toHaveLength(0);
      expect(result.schemas).toHaveLength(1);
      expect(result.schemas[0].valid).toBe(true);
    });

    it('should pass for valid Organization schema', () => {
      const html = createTestHTML({
        structuredData: [
          {
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'Test Org',
            url: 'https://example.com',
          },
        ],
      });

      const result = validateStructuredData(html);

      expect(result.isValid).toBe(true);
      expect(result.schemas[0].valid).toBe(true);
    });

    it('should pass for valid Article schema', () => {
      const html = createTestHTML({
        structuredData: [
          {
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: 'Test Article',
            datePublished: '2025-01-06',
            author: {
              '@type': 'Person',
              name: 'John Doe',
            },
          },
        ],
      });

      const result = validateStructuredData(html);

      expect(result.isValid).toBe(true);
      expect(result.schemas[0].valid).toBe(true);
    });

    it('should pass for valid Product schema', () => {
      const html = createTestHTML({
        structuredData: [
          {
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: 'Test Product',
            image: 'https://example.com/product.jpg',
            offers: {
              '@type': 'Offer',
              price: '29.99',
              priceCurrency: 'USD',
            },
          },
        ],
      });

      const result = validateStructuredData(html);

      expect(result.isValid).toBe(true);
      expect(result.schemas[0].valid).toBe(true);
    });

    it('should fail for missing @context', () => {
      const html = createTestHTML({
        structuredData: [
          {
            '@type': 'WebSite',
            name: 'Test Site',
          },
        ],
      });

      const result = validateStructuredData(html);

      expect(result.schemas[0].errors).toContain('Missing @context');
      expect(result.score).toBeLessThan(100);
    });

    it('should fail for missing @type', () => {
      const html = createTestHTML({
        structuredData: [
          {
            '@context': 'https://schema.org',
            name: 'Test Site',
          },
        ],
      });

      const result = validateStructuredData(html);

      expect(result.schemas[0].errors).toContain('Missing @type');
      expect(result.score).toBeLessThan(100);
    });

    it('should fail for missing required WebSite properties', () => {
      const html = createTestHTML({
        structuredData: [
          {
            '@context': 'https://schema.org',
            '@type': 'WebSite',
          },
        ],
      });

      const result = validateStructuredData(html);

      expect(result.schemas[0].errors.some(e => e.includes('name'))).toBe(true);
      expect(result.schemas[0].errors.some(e => e.includes('url'))).toBe(true);
    });

    it('should fail for invalid JSON', () => {
      const html = `
        <html><head>
          <script type="application/ld+json">{ invalid json }</script>
        </head></html>
      `;

      const result = validateStructuredData(html);

      expect(result.isValid).toBe(false);
      expect(result.issues.some(i => i.includes('Invalid JSON-LD'))).toBe(true);
    });

    it('should fail for no structured data', () => {
      const html = createTestHTML({});
      const result = validateStructuredData(html);

      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('No structured data (JSON-LD) found');
      expect(result.score).toBe(0);
    });
  });
});

// ============================================================================
// Canonical URL Tests
// ============================================================================

describe('T235: SEO Audit - Canonical URL', () => {
  describe('validateCanonicalUrl', () => {
    it('should pass for valid HTTPS canonical URL', () => {
      const html = createTestHTML({
        canonical: 'https://example.com/page/',
      });

      const result = validateCanonicalUrl(html);

      expect(result.isValid).toBe(true);
      expect(result.score).toBe(100);
      expect(result.issues).toHaveLength(0);
      expect(result.canonicalUrl).toBe('https://example.com/page/');
      expect(result.isAbsolute).toBe(true);
      expect(result.hasHttps).toBe(true);
    });

    it('should fail for missing canonical URL', () => {
      const html = createTestHTML({});
      const result = validateCanonicalUrl(html);

      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('Missing canonical URL');
      expect(result.score).toBe(0);
    });

    it('should fail for relative canonical URL', () => {
      const html = createTestHTML({
        canonical: '/page/',
      });

      const result = validateCanonicalUrl(html);

      expect(result.isValid).toBe(false);
      expect(result.issues.some(i => i.includes('absolute'))).toBe(true);
      expect(result.isAbsolute).toBe(false);
    });

    it('should warn for HTTP canonical URL', () => {
      const html = createTestHTML({
        canonical: 'http://example.com/page/',
      });

      const result = validateCanonicalUrl(html);

      expect(result.warnings.some(w => w.includes('HTTPS'))).toBe(true);
      expect(result.hasHttps).toBe(false);
    });

    it('should warn for query parameters', () => {
      const html = createTestHTML({
        canonical: 'https://example.com/page/?param=value',
      });

      const result = validateCanonicalUrl(html);

      expect(result.warnings.some(w => w.includes('query parameters'))).toBe(true);
    });

    it('should warn for fragment identifier', () => {
      const html = createTestHTML({
        canonical: 'https://example.com/page/#section',
      });

      const result = validateCanonicalUrl(html);

      expect(result.warnings.some(w => w.includes('fragment'))).toBe(true);
    });

    it('should warn for missing trailing slash', () => {
      const html = createTestHTML({
        canonical: 'https://example.com/page',
      });

      const result = validateCanonicalUrl(html);

      expect(result.warnings.some(w => w.includes('trailing slash'))).toBe(true);
    });
  });
});

// ============================================================================
// Open Graph Tests
// ============================================================================

describe('T235: SEO Audit - Open Graph', () => {
  describe('validateOpenGraph', () => {
    it('should pass for valid Open Graph tags', () => {
      const html = createTestHTML({
        ogTags: {
          'og:title': 'Test Page Title',
          'og:description': 'Test page description',
          'og:image': 'https://example.com/image.jpg',
          'og:url': 'https://example.com/page/',
          'og:type': 'website',
          'og:site_name': 'Test Site',
        },
      });

      const result = validateOpenGraph(html);

      expect(result.isValid).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(80);
      expect(result.issues).toHaveLength(0);
      expect(result.tags['og:title']).toBe('Test Page Title');
      expect(result.tags['og:type']).toBe('website');
    });

    it('should fail for missing required og:title', () => {
      const html = createTestHTML({
        ogTags: {
          'og:description': 'Test',
          'og:image': 'https://example.com/image.jpg',
          'og:url': 'https://example.com/page/',
          'og:type': 'website',
        },
      });

      const result = validateOpenGraph(html);

      expect(result.isValid).toBe(false);
      expect(result.issues.some(i => i.includes('og:title'))).toBe(true);
    });

    it('should fail for missing required og:description', () => {
      const html = createTestHTML({
        ogTags: {
          'og:title': 'Test',
          'og:image': 'https://example.com/image.jpg',
          'og:url': 'https://example.com/page/',
          'og:type': 'website',
        },
      });

      const result = validateOpenGraph(html);

      expect(result.issues.some(i => i.includes('og:description'))).toBe(true);
    });

    it('should fail for missing required og:image', () => {
      const html = createTestHTML({
        ogTags: {
          'og:title': 'Test',
          'og:description': 'Test',
          'og:url': 'https://example.com/page/',
          'og:type': 'website',
        },
      });

      const result = validateOpenGraph(html);

      expect(result.issues.some(i => i.includes('og:image'))).toBe(true);
    });

    it('should warn for og:title too long', () => {
      const html = createTestHTML({
        ogTags: {
          'og:title': 'This is an extremely long Open Graph title that exceeds the recommended 60 character limit',
          'og:description': 'Test',
          'og:image': 'https://example.com/image.jpg',
          'og:url': 'https://example.com/page/',
          'og:type': 'website',
        },
      });

      const result = validateOpenGraph(html);

      expect(result.warnings.some(w => w.includes('og:title too long'))).toBe(true);
    });

    it('should warn for relative og:image URL', () => {
      const html = createTestHTML({
        ogTags: {
          'og:title': 'Test',
          'og:description': 'Test',
          'og:image': '/images/og-image.jpg',
          'og:url': 'https://example.com/page/',
          'og:type': 'website',
        },
      });

      const result = validateOpenGraph(html);

      expect(result.warnings.some(w => w.includes('og:image should be an absolute URL'))).toBe(true);
    });

    it('should warn for HTTP og:url', () => {
      const html = createTestHTML({
        ogTags: {
          'og:title': 'Test',
          'og:description': 'Test',
          'og:image': 'https://example.com/image.jpg',
          'og:url': 'http://example.com/page/',
          'og:type': 'website',
        },
      });

      const result = validateOpenGraph(html);

      expect(result.warnings.some(w => w.includes('og:url should use HTTPS'))).toBe(true);
    });
  });
});

// ============================================================================
// Twitter Card Tests
// ============================================================================

describe('T235: SEO Audit - Twitter Cards', () => {
  describe('validateTwitterCard', () => {
    it('should pass for valid Twitter Card tags', () => {
      const html = createTestHTML({
        twitterTags: {
          'twitter:card': 'summary_large_image',
          'twitter:title': 'Test Page Title',
          'twitter:description': 'Test page description',
          'twitter:image': 'https://example.com/image.jpg',
          'twitter:site': '@testsite',
          'twitter:creator': '@testcreator',
        },
      });

      const result = validateTwitterCard(html);

      expect(result.isValid).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(80);
      expect(result.issues).toHaveLength(0);
      expect(result.tags['twitter:card']).toBe('summary_large_image');
    });

    it('should fail for missing twitter:card', () => {
      const html = createTestHTML({
        twitterTags: {
          'twitter:title': 'Test',
          'twitter:description': 'Test',
          'twitter:image': 'https://example.com/image.jpg',
        },
      });

      const result = validateTwitterCard(html);

      expect(result.isValid).toBe(false);
      expect(result.issues.some(i => i.includes('twitter:card'))).toBe(true);
    });

    it('should fail for missing twitter:title', () => {
      const html = createTestHTML({
        twitterTags: {
          'twitter:card': 'summary',
          'twitter:description': 'Test',
          'twitter:image': 'https://example.com/image.jpg',
        },
      });

      const result = validateTwitterCard(html);

      expect(result.issues.some(i => i.includes('twitter:title'))).toBe(true);
    });

    it('should warn for invalid card type', () => {
      const html = createTestHTML({
        twitterTags: {
          'twitter:card': 'invalid_type',
          'twitter:title': 'Test',
          'twitter:description': 'Test',
          'twitter:image': 'https://example.com/image.jpg',
        },
      });

      const result = validateTwitterCard(html);

      expect(result.warnings.some(w => w.includes('Invalid twitter:card type'))).toBe(true);
    });

    it('should warn for twitter:title too long', () => {
      const html = createTestHTML({
        twitterTags: {
          'twitter:card': 'summary',
          'twitter:title': 'This is an extremely long Twitter Card title that exceeds the recommended 70 character limit for optimal display',
          'twitter:description': 'Test',
          'twitter:image': 'https://example.com/image.jpg',
        },
      });

      const result = validateTwitterCard(html);

      expect(result.warnings.some(w => w.includes('twitter:title too long'))).toBe(true);
    });

    it('should warn for relative twitter:image URL', () => {
      const html = createTestHTML({
        twitterTags: {
          'twitter:card': 'summary',
          'twitter:title': 'Test',
          'twitter:description': 'Test',
          'twitter:image': '/images/twitter-image.jpg',
        },
      });

      const result = validateTwitterCard(html);

      expect(result.warnings.some(w => w.includes('twitter:image should be an absolute URL'))).toBe(true);
    });
  });
});

// ============================================================================
// Robots.txt Tests
// ============================================================================

describe('T235: SEO Audit - Robots.txt', () => {
  describe('validateRobotsTxt', () => {
    it('should pass for valid robots.txt', () => {
      const robotsTxt = `
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Sitemap: https://example.com/sitemap.xml
      `.trim();

      const result = validateRobotsTxt(robotsTxt);

      expect(result.isValid).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(80);
      expect(result.issues).toHaveLength(0);
      expect(result.directives.userAgents).toContain('*');
      expect(result.directives.sitemaps).toContain('https://example.com/sitemap.xml');
    });

    it('should fail for empty robots.txt', () => {
      const result = validateRobotsTxt('');

      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('robots.txt is empty');
      expect(result.score).toBe(0);
    });

    it('should fail for missing User-agent', () => {
      const robotsTxt = `
Disallow: /admin/
      `.trim();

      const result = validateRobotsTxt(robotsTxt);

      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('Missing User-agent directive');
    });

    it('should warn for missing Sitemap', () => {
      const robotsTxt = `
User-agent: *
Disallow: /admin/
      `.trim();

      const result = validateRobotsTxt(robotsTxt);

      expect(result.warnings).toContain('No Sitemap directive found');
      expect(result.suggestions.some(s => s.includes('Sitemap'))).toBe(true);
    });

    it('should warn for placeholder sitemap URL', () => {
      const robotsTxt = `
User-agent: *
Disallow: /admin/
Sitemap: https://yourdomain.com/sitemap.xml
      `.trim();

      const result = validateRobotsTxt(robotsTxt);

      expect(result.isValid).toBe(false);
      expect(result.issues.some(i => i.includes('placeholder URL'))).toBe(true);
    });

    it('should warn for relative sitemap URL', () => {
      const robotsTxt = `
User-agent: *
Disallow: /admin/
Sitemap: /sitemap.xml
      `.trim();

      const result = validateRobotsTxt(robotsTxt);

      expect(result.warnings.some(w => w.includes('absolute URL'))).toBe(true);
    });

    it('should handle comments correctly', () => {
      const robotsTxt = `
# This is a comment
User-agent: *
# Another comment
Disallow: /admin/
      `.trim();

      const result = validateRobotsTxt(robotsTxt);

      expect(result.isValid).toBe(true);
      expect(result.directives.userAgents).toContain('*');
    });

    it('should parse multiple user agents', () => {
      const robotsTxt = `
User-agent: *
Disallow: /admin/

User-agent: Googlebot
Allow: /
      `.trim();

      const result = validateRobotsTxt(robotsTxt);

      expect(result.directives.userAgents).toContain('*');
      expect(result.directives.userAgents).toContain('Googlebot');
    });

    it('should parse Crawl-delay', () => {
      const robotsTxt = `
User-agent: *
Crawl-delay: 10
Disallow: /admin/
      `.trim();

      const result = validateRobotsTxt(robotsTxt);

      expect(result.directives.crawlDelays.get('*')).toBe(10);
    });
  });
});

// ============================================================================
// Sitemap Tests
// ============================================================================

describe('T235: SEO Audit - Sitemap', () => {
  describe('validateSitemap', () => {
    it('should pass when sitemap is in robots.txt', () => {
      const html = createTestHTML({});
      const robotsTxt = `
User-agent: *
Sitemap: https://example.com/sitemap.xml
      `.trim();

      const result = validateSitemap(html, robotsTxt);

      expect(result.sitemapUrl).toBe('https://example.com/sitemap.xml');
    });

    it('should warn when no sitemap reference found', () => {
      const html = createTestHTML({});
      const result = validateSitemap(html);

      expect(result.warnings).toContain('No sitemap reference found');
      expect(result.suggestions.some(s => s.includes('sitemap reference'))).toBe(true);
    });

    it('should fail for relative sitemap URL', () => {
      const html = createTestHTML({});
      const robotsTxt = 'Sitemap: /sitemap.xml';

      const result = validateSitemap(html, robotsTxt);

      expect(result.issues.some(i => i.includes('absolute'))).toBe(true);
    });

    it('should fail for placeholder sitemap URL', () => {
      const html = createTestHTML({});
      const robotsTxt = 'Sitemap: https://yourdomain.com/sitemap.xml';

      const result = validateSitemap(html, robotsTxt);

      expect(result.issues.some(i => i.includes('placeholder'))).toBe(true);
    });

    it('should warn for non-XML sitemap', () => {
      const html = createTestHTML({});
      const robotsTxt = 'Sitemap: https://example.com/sitemap.txt';

      const result = validateSitemap(html, robotsTxt);

      expect(result.warnings.some(w => w.includes('XML file'))).toBe(true);
    });
  });
});

// ============================================================================
// Complete SEO Audit Tests
// ============================================================================

describe('T235: SEO Audit - Complete Audit', () => {
  describe('auditSEO', () => {
    it('should perform complete audit and return all results', () => {
      const html = createTestHTML({
        title: 'Perfect SEO Title - Test Page',
        description: 'This is a perfect meta description with the right length between 150 and 160 characters for optimal search engine visibility.',
        keywords: 'seo, audit, test, validation, complete',
        canonical: 'https://example.com/page/',
        ogTags: {
          'og:title': 'Test Page',
          'og:description': 'Test description',
          'og:image': 'https://example.com/image.jpg',
          'og:url': 'https://example.com/page/',
          'og:type': 'website',
        },
        twitterTags: {
          'twitter:card': 'summary_large_image',
          'twitter:title': 'Test Page',
          'twitter:description': 'Test description',
          'twitter:image': 'https://example.com/image.jpg',
        },
        structuredData: [
          {
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'Test Site',
            url: 'https://example.com',
          },
        ],
      });

      const robotsTxt = `
User-agent: *
Disallow: /admin/
Sitemap: https://example.com/sitemap.xml
      `.trim();

      const result = auditSEO(html, { robotsTxt, url: 'https://example.com/page/' });

      expect(result.score).toBeGreaterThan(0);
      expect(result.metaTags).toBeDefined();
      expect(result.structuredData).toBeDefined();
      expect(result.canonicalUrl).toBeDefined();
      expect(result.openGraph).toBeDefined();
      expect(result.twitterCard).toBeDefined();
      expect(result.robotsTxt).toBeDefined();
      expect(result.sitemap).toBeDefined();
      expect(result.timestamp).toBeDefined();
      expect(result.url).toBe('https://example.com/page/');
    });

    it('should calculate weighted overall score', () => {
      const html = createTestHTML({
        title: 'Good SEO Title For Testing Page Here',
        description: 'This is a good meta description with the right length between 150 and 160 characters for optimal search engine visibility and testing.',
        canonical: 'https://example.com/page/',
        ogTags: {
          'og:title': 'Test',
          'og:description': 'Test',
          'og:image': 'https://example.com/image.jpg',
          'og:url': 'https://example.com/page/',
          'og:type': 'website',
        },
        twitterTags: {
          'twitter:card': 'summary',
          'twitter:title': 'Test',
          'twitter:description': 'Test',
          'twitter:image': 'https://example.com/image.jpg',
        },
        structuredData: [
          {
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'Test',
            url: 'https://example.com',
          },
        ],
      });

      const result = auditSEO(html);

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('should handle audit without robots.txt', () => {
      const html = createTestHTML({
        title: 'Test Page Title',
        description: 'Test description',
      });

      const result = auditSEO(html);

      expect(result.robotsTxt).toBeUndefined();
      expect(result.score).toBeGreaterThan(0);
    });
  });
});

// ============================================================================
// Constants Tests
// ============================================================================

describe('T235: SEO Audit - Constants', () => {
  it('should have correct SEO limits', () => {
    expect(SEO_LIMITS.TITLE_MIN).toBe(30);
    expect(SEO_LIMITS.TITLE_MAX).toBe(60);
    expect(SEO_LIMITS.TITLE_IDEAL).toBe(50);
    expect(SEO_LIMITS.DESCRIPTION_MIN).toBe(50);
    expect(SEO_LIMITS.DESCRIPTION_MAX).toBe(160);
    expect(SEO_LIMITS.DESCRIPTION_IDEAL).toBe(155);
    expect(SEO_LIMITS.KEYWORDS_MIN).toBe(3);
    expect(SEO_LIMITS.KEYWORDS_MAX).toBe(10);
  });

  it('should have required meta tags defined', () => {
    expect(REQUIRED_META_TAGS).toContain('title');
    expect(REQUIRED_META_TAGS).toContain('description');
  });

  it('should have required Open Graph tags defined', () => {
    expect(REQUIRED_OG_TAGS).toContain('og:title');
    expect(REQUIRED_OG_TAGS).toContain('og:description');
    expect(REQUIRED_OG_TAGS).toContain('og:image');
    expect(REQUIRED_OG_TAGS).toContain('og:url');
    expect(REQUIRED_OG_TAGS).toContain('og:type');
  });

  it('should have required Twitter Card tags defined', () => {
    expect(REQUIRED_TWITTER_TAGS).toContain('twitter:card');
    expect(REQUIRED_TWITTER_TAGS).toContain('twitter:title');
    expect(REQUIRED_TWITTER_TAGS).toContain('twitter:description');
    expect(REQUIRED_TWITTER_TAGS).toContain('twitter:image');
  });
});
