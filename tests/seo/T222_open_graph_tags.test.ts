/**
 * T222: Open Graph Meta Tags Tests
 *
 * Tests for Open Graph Protocol implementation for social media sharing.
 *
 * Test Coverage:
 * - Component existence and structure
 * - Required Open Graph properties
 * - Optional Open Graph properties
 * - Article-specific properties
 * - Video-specific properties
 * - Profile-specific properties
 * - Book-specific properties
 * - Image metadata
 * - URL handling (absolute vs relative)
 * - Type-specific rendering
 * - Integration with SEO component
 * - Validation and warnings
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const openGraphComponentPath = join(process.cwd(), 'src', 'components', 'OpenGraph.astro');
const seoComponentPath = join(process.cwd(), 'src', 'components', 'SEO.astro');

describe('T222: Open Graph Meta Tags', () => {
  describe('Component File', () => {
    it('should exist at src/components/OpenGraph.astro', () => {
      expect(existsSync(openGraphComponentPath)).toBe(true);
    });

    it('should be a valid Astro component', () => {
      const content = readFileSync(openGraphComponentPath, 'utf-8');
      expect(content).toContain('---');
      expect(content).toContain('interface Props');
    });

    it('should have comprehensive JSDoc documentation', () => {
      const content = readFileSync(openGraphComponentPath, 'utf-8');
      expect(content).toContain('/**');
      expect(content).toContain('* Open Graph Component');
      expect(content).toMatch(/Open Graph Protocol/i);
    });

    it('should reference ogp.me documentation', () => {
      const content = readFileSync(openGraphComponentPath, 'utf-8');
      expect(content).toMatch(/ogp\.me|openGraph|Open Graph Protocol/i);
    });
  });

  describe('Required Open Graph Properties', () => {
    let content: string;

    beforeEach(() => {
      content = readFileSync(openGraphComponentPath, 'utf-8');
    });

    it('should include og:title meta tag', () => {
      expect(content).toContain('<meta property="og:title"');
      expect(content).toContain('content={title}');
    });

    it('should include og:description meta tag', () => {
      expect(content).toContain('<meta property="og:description"');
      expect(content).toContain('content={description}');
    });

    it('should include og:image meta tag', () => {
      expect(content).toContain('<meta property="og:image"');
      expect(content).toContain('absoluteImageUrl');
    });

    it('should include og:url meta tag', () => {
      expect(content).toContain('<meta property="og:url"');
      expect(content).toContain('absoluteUrl');
    });

    it('should include og:type meta tag', () => {
      expect(content).toContain('<meta property="og:type"');
      expect(content).toContain('content={type}');
    });

    it('should have og:type with valid values', () => {
      expect(content).toMatch(/type\?:\s*'website'\s*\|\s*'article'\s*\|\s*'profile'\s*\|\s*'book'\s*\|\s*'music'\s*\|\s*'video'/);
    });
  });

  describe('Optional Open Graph Properties', () => {
    let content: string;

    beforeEach(() => {
      content = readFileSync(openGraphComponentPath, 'utf-8');
    });

    it('should include og:site_name meta tag', () => {
      expect(content).toContain('<meta property="og:site_name"');
      expect(content).toContain('content={siteName}');
    });

    it('should include og:locale meta tag', () => {
      expect(content).toContain('<meta property="og:locale"');
      expect(content).toContain('content={locale}');
    });

    it('should have default siteName', () => {
      expect(content).toContain("siteName = 'Spirituality Platform'");
    });

    it('should have default locale', () => {
      expect(content).toContain("locale = 'en_US'");
    });
  });

  describe('Image Metadata', () => {
    let content: string;

    beforeEach(() => {
      content = readFileSync(openGraphComponentPath, 'utf-8');
    });

    it('should include og:image:alt meta tag', () => {
      expect(content).toContain('<meta property="og:image:alt"');
      expect(content).toContain('imageAltText');
    });

    it('should include og:image:width meta tag', () => {
      expect(content).toContain('<meta property="og:image:width"');
      expect(content).toContain('imageWidth');
    });

    it('should include og:image:height meta tag', () => {
      expect(content).toContain('<meta property="og:image:height"');
      expect(content).toContain('imageHeight');
    });

    it('should include og:image:type meta tag', () => {
      expect(content).toContain('<meta property="og:image:type"');
    });

    it('should have default image dimensions (1200x630)', () => {
      expect(content).toContain('imageWidth = 1200');
      expect(content).toContain('imageHeight = 630');
    });

    it('should have default image path', () => {
      expect(content).toContain("image = '/images/og-default.jpg'");
    });
  });

  describe('URL Handling', () => {
    let content: string;

    beforeEach(() => {
      content = readFileSync(openGraphComponentPath, 'utf-8');
    });

    it('should convert relative image URLs to absolute', () => {
      expect(content).toContain('absoluteImageUrl');
      expect(content).toContain("image.startsWith('http')");
      expect(content).toMatch(/siteUrl.*image/);
    });

    it('should convert relative page URLs to absolute', () => {
      expect(content).toContain('absoluteUrl');
      expect(content).toContain("url.startsWith('http')");
      expect(content).toMatch(/siteUrl.*url/);
    });

    it('should use absolute URLs in meta tags', () => {
      expect(content).toContain('content={absoluteImageUrl}');
      expect(content).toContain('content={absoluteUrl}');
    });

    it('should get siteUrl from Astro config', () => {
      expect(content).toContain('Astro.site');
      expect(content).toContain('Astro.url.origin');
    });
  });

  describe('Article-Specific Properties', () => {
    let content: string;

    beforeEach(() => {
      content = readFileSync(openGraphComponentPath, 'utf-8');
    });

    it('should conditionally render article properties', () => {
      expect(content).toContain("type === 'article'");
    });

    it('should include article:published_time meta tag', () => {
      expect(content).toContain('<meta property="article:published_time"');
      expect(content).toContain('publishedTime');
    });

    it('should include article:modified_time meta tag', () => {
      expect(content).toContain('<meta property="article:modified_time"');
      expect(content).toContain('modifiedTime');
    });

    it('should include article:author meta tag', () => {
      expect(content).toContain('<meta property="article:author"');
      expect(content).toContain('author');
    });

    it('should include article:section meta tag', () => {
      expect(content).toContain('<meta property="article:section"');
      expect(content).toContain('section');
    });

    it('should include article:tag meta tags', () => {
      expect(content).toContain('<meta property="article:tag"');
      expect(content).toContain('tags');
      expect(content).toContain('.map');
    });

    it('should have Props interface for article metadata', () => {
      expect(content).toContain('publishedTime?:');
      expect(content).toContain('modifiedTime?:');
      expect(content).toContain('author?:');
      expect(content).toContain('section?:');
      expect(content).toContain('tags?:');
    });
  });

  describe('Video-Specific Properties', () => {
    let content: string;

    beforeEach(() => {
      content = readFileSync(openGraphComponentPath, 'utf-8');
    });

    it('should conditionally render video properties', () => {
      expect(content).toContain("type === 'video'");
    });

    it('should support video:url property', () => {
      expect(content).toContain("additionalTags['video:url']");
      expect(content).toContain('<meta property="video:url"');
    });

    it('should support video:secure_url property', () => {
      expect(content).toContain("additionalTags['video:secure_url']");
    });

    it('should support video:type property', () => {
      expect(content).toContain("additionalTags['video:type']");
    });

    it('should support video:width property', () => {
      expect(content).toContain("additionalTags['video:width']");
    });

    it('should support video:height property', () => {
      expect(content).toContain("additionalTags['video:height']");
    });
  });

  describe('Profile-Specific Properties', () => {
    let content: string;

    beforeEach(() => {
      content = readFileSync(openGraphComponentPath, 'utf-8');
    });

    it('should conditionally render profile properties', () => {
      expect(content).toContain("type === 'profile'");
    });

    it('should support profile:first_name property', () => {
      expect(content).toContain("additionalTags['profile:first_name']");
      expect(content).toContain('<meta property="profile:first_name"');
    });

    it('should support profile:last_name property', () => {
      expect(content).toContain("additionalTags['profile:last_name']");
    });

    it('should support profile:username property', () => {
      expect(content).toContain("additionalTags['profile:username']");
    });
  });

  describe('Book-Specific Properties', () => {
    let content: string;

    beforeEach(() => {
      content = readFileSync(openGraphComponentPath, 'utf-8');
    });

    it('should conditionally render book properties', () => {
      expect(content).toContain("type === 'book'");
    });

    it('should support book:author property', () => {
      expect(content).toContain("additionalTags['book:author']");
      expect(content).toContain('<meta property="book:author"');
    });

    it('should support book:isbn property', () => {
      expect(content).toContain("additionalTags['book:isbn']");
    });

    it('should support book:release_date property', () => {
      expect(content).toContain("additionalTags['book:release_date']");
    });
  });

  describe('Props Interface', () => {
    let content: string;

    beforeEach(() => {
      content = readFileSync(openGraphComponentPath, 'utf-8');
    });

    it('should have required title prop', () => {
      expect(content).toContain('title: string');
    });

    it('should have required description prop', () => {
      expect(content).toContain('description: string');
    });

    it('should have required url prop', () => {
      expect(content).toContain('url: string');
    });

    it('should have optional image prop', () => {
      expect(content).toContain('image?:');
    });

    it('should have optional type prop', () => {
      expect(content).toContain('type?:');
    });

    it('should have additionalTags prop for extensibility', () => {
      expect(content).toContain('additionalTags?:');
      expect(content).toContain('Record<string, string>');
    });

    it('should have JSDoc comments for all props', () => {
      const propsSection = content.match(/interface Props \{[\s\S]*?\}/);
      expect(propsSection).toBeTruthy();
      if (propsSection) {
        expect(propsSection[0]).toContain('@example');
        expect(propsSection[0]).toContain('@default');
      }
    });
  });

  describe('Validation and Warnings', () => {
    let content: string;

    beforeEach(() => {
      content = readFileSync(openGraphComponentPath, 'utf-8');
    });

    it('should validate optimal image dimensions', () => {
      expect(content).toContain('isOptimalSize');
      expect(content).toContain('imageWidth === 1200');
      expect(content).toContain('imageHeight === 630');
    });

    it('should warn about non-optimal image sizes in development', () => {
      expect(content).toContain('!isOptimalSize');
      expect(content).toContain('import.meta.env.DEV');
      expect(content).toContain('console.warn');
    });

    it('should validate title length', () => {
      expect(content).toContain('title.length > 95');
      expect(content).toContain('console.warn');
    });

    it('should validate description length', () => {
      expect(content).toContain('description.length > 200');
      expect(content).toContain('console.warn');
    });

    it('should include debug information in development', () => {
      expect(content).toContain('import.meta.env.DEV');
      expect(content).toContain('data-og-debug');
    });
  });

  describe('SEO Component Integration', () => {
    let seoContent: string;

    beforeEach(() => {
      seoContent = readFileSync(seoComponentPath, 'utf-8');
    });

    it('should import OpenGraph component in SEO', () => {
      expect(seoContent).toContain("import OpenGraph from '@/components/OpenGraph.astro'");
    });

    it('should use OpenGraph component in SEO', () => {
      expect(seoContent).toContain('<OpenGraph');
    });

    it('should pass title to OpenGraph', () => {
      expect(seoContent).toMatch(/title=\{.*displayTitle.*\}/);
    });

    it('should pass description to OpenGraph', () => {
      expect(seoContent).toMatch(/description=\{.*displayDescription.*\}/);
    });

    it('should pass image to OpenGraph', () => {
      expect(seoContent).toMatch(/image=\{.*ogImage.*\}/);
    });

    it('should pass url to OpenGraph', () => {
      expect(seoContent).toMatch(/url=\{.*canonicalURL.*\}/);
    });

    it('should pass type to OpenGraph', () => {
      expect(seoContent).toMatch(/type=\{.*ogType.*\}/);
    });

    it('should pass article metadata to OpenGraph', () => {
      expect(seoContent).toMatch(/publishedTime=\{.*publishedTime.*\}/);
      expect(seoContent).toMatch(/modifiedTime=\{.*modifiedTime.*\}/);
      expect(seoContent).toMatch(/author=\{.*articleAuthor.*\}/);
    });
  });

  describe('Best Practices', () => {
    let content: string;

    beforeEach(() => {
      content = readFileSync(openGraphComponentPath, 'utf-8');
    });

    it('should recommend 1200x630px image size', () => {
      expect(content).toMatch(/1200.*630|1200x630/);
    });

    it('should recommend 1.91:1 aspect ratio', () => {
      expect(content).toMatch(/1\.91:1|aspect ratio/);
    });

    it('should use absolute URLs', () => {
      expect(content).toContain('absoluteImageUrl');
      expect(content).toContain('absoluteUrl');
    });

    it('should provide default values for optional props', () => {
      expect(content).toContain("image = '/images/og-default.jpg'");
      expect(content).toContain("type = 'website'");
      expect(content).toContain("siteName = 'Spirituality Platform'");
    });

    it('should have image alt text for accessibility', () => {
      expect(content).toContain('imageAlt');
      expect(content).toContain('og:image:alt');
    });
  });

  describe('Type Safety', () => {
    let content: string;

    beforeEach(() => {
      content = readFileSync(openGraphComponentPath, 'utf-8');
    });

    it('should have TypeScript interface', () => {
      expect(content).toContain('interface Props');
    });

    it('should type all props', () => {
      expect(content).toMatch(/\w+:\s*string/);
      expect(content).toMatch(/\w+\?:\s*string/);
    });

    it('should use string union types for specific values', () => {
      expect(content).toContain("'website' | 'article'");
    });

    it('should type arrays correctly', () => {
      expect(content).toContain('string[]');
    });

    it('should type records correctly', () => {
      expect(content).toContain('Record<string, string>');
    });
  });

  describe('Documentation', () => {
    let content: string;

    beforeEach(() => {
      content = readFileSync(openGraphComponentPath, 'utf-8');
    });

    it('should have usage examples', () => {
      expect(content).toContain('Usage:');
      expect(content).toContain('```astro');
      expect(content).toContain('<OpenGraph');
    });

    it('should document best practices', () => {
      expect(content).toContain('Best Practices');
    });

    it('should reference official documentation', () => {
      expect(content).toMatch(/ogp\.me|opengraphprotocol\.org/);
    });

    it('should have inline comments for complex logic', () => {
      const commentCount = (content.match(/\/\//g) || []).length;
      expect(commentCount).toBeGreaterThan(5);
    });
  });

  describe('Extensibility', () => {
    let content: string;

    beforeEach(() => {
      content = readFileSync(openGraphComponentPath, 'utf-8');
    });

    it('should support additionalTags for custom properties', () => {
      expect(content).toContain('additionalTags');
      expect(content).toContain('Object.entries(additionalTags)');
    });

    it('should map additional tags to og: properties', () => {
      expect(content).toContain('property={`og:${key}`}');
    });

    it('should filter out type-specific additional tags', () => {
      expect(content).toContain("key.startsWith('video:')");
      expect(content).toContain("key.startsWith('profile:')");
      expect(content).toContain("key.startsWith('book:')");
    });
  });

  describe('Edge Cases', () => {
    let content: string;

    beforeEach(() => {
      content = readFileSync(openGraphComponentPath, 'utf-8');
    });

    it('should handle missing optional props gracefully', () => {
      expect(content).toContain('imageAlt ||');
      expect(content).toMatch(/publishedTime.*&&/);
      expect(content).toMatch(/modifiedTime.*&&/);
    });

    it('should handle empty arrays', () => {
      expect(content).toContain('tags && tags.map');
    });

    it('should use title as default alt text', () => {
      expect(content).toContain('imageAlt || title');
    });

    it('should convert numbers to strings for meta content', () => {
      expect(content).toContain('.toString()');
    });
  });

  describe('Performance', () => {
    it('should have minimal component size', () => {
      const content = readFileSync(openGraphComponentPath, 'utf-8');
      const sizeInKB = Buffer.byteLength(content, 'utf-8') / 1024;

      // Component should be under 20KB
      expect(sizeInKB).toBeLessThan(20);
    });

    it('should not have unnecessary dependencies', () => {
      const content = readFileSync(openGraphComponentPath, 'utf-8');

      // Check that we're not importing heavy libraries
      expect(content).not.toContain('import React');
      expect(content).not.toContain('import Vue');
      expect(content).not.toContain('import lodash');
    });
  });

  describe('Social Platform Compatibility', () => {
    let content: string;

    beforeEach(() => {
      content = readFileSync(openGraphComponentPath, 'utf-8');
    });

    it('should support Facebook Open Graph tags', () => {
      expect(content).toContain('og:title');
      expect(content).toContain('og:description');
      expect(content).toContain('og:image');
      expect(content).toContain('og:url');
    });

    it('should support LinkedIn sharing', () => {
      // LinkedIn uses the same OG tags as Facebook
      expect(content).toContain('og:title');
      expect(content).toContain('og:description');
      expect(content).toContain('og:image');
    });

    it('should support WhatsApp sharing', () => {
      // WhatsApp uses OG tags
      expect(content).toContain('og:title');
      expect(content).toContain('og:description');
      expect(content).toContain('og:image');
    });

    it('should support Slack unfurling', () => {
      // Slack uses OG tags for link previews
      expect(content).toContain('og:title');
      expect(content).toContain('og:description');
      expect(content).toContain('og:image');
    });
  });
});
