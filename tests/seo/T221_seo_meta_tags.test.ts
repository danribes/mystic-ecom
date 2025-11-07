/**
 * T221: Basic SEO Meta Tags - Test Suite
 *
 * Tests for SEO component and meta tags implementation
 */

import { describe, it, expect } from 'vitest';
import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import path from 'path';

const rootDir = process.cwd();

describe('T221: Basic SEO Meta Tags', () => {
  describe('1. SEO Component File', () => {
    const seoComponentPath = path.join(rootDir, 'src/components/SEO.astro');

    it('should have SEO component file', () => {
      expect(existsSync(seoComponentPath)).toBe(true);
    });

    it('should have comprehensive JSDoc documentation', async () => {
      const content = await readFile(seoComponentPath, 'utf-8');
      expect(content).toContain('/**');
      expect(content).toContain('SEO Component');
      expect(content).toContain('@example');
    });

    it('should have Props interface with required fields', async () => {
      const content = await readFile(seoComponentPath, 'utf-8');
      expect(content).toContain('interface Props');
      expect(content).toContain('title: string');
      expect(content).toContain('description?:');
      expect(content).toContain('keywords?:');
    });
  });

  describe('2. Primary Meta Tags', () => {
    const seoComponentPath = path.join(rootDir, 'src/components/SEO.astro');

    it('should include title meta tag', async () => {
      const content = await readFile(seoComponentPath, 'utf-8');
      expect(content).toContain('<title>');
      expect(content).toContain('</title>');
    });

    it('should include description meta tag', async () => {
      const content = await readFile(seoComponentPath, 'utf-8');
      expect(content).toContain('name="description"');
    });

    it('should include keywords meta tag', async () => {
      const content = await readFile(seoComponentPath, 'utf-8');
      expect(content).toContain('name="keywords"');
    });

    it('should include author meta tag', async () => {
      const content = await readFile(seoComponentPath, 'utf-8');
      expect(content).toContain('name="author"');
    });

    it('should include language meta tag', async () => {
      const content = await readFile(seoComponentPath, 'utf-8');
      expect(content).toContain('name="language"');
    });

    it('should include robots meta tag', async () => {
      const content = await readFile(seoComponentPath, 'utf-8');
      expect(content).toContain('name="robots"');
    });

    it('should include generator meta tag', async () => {
      const content = await readFile(seoComponentPath, 'utf-8');
      expect(content).toContain('name="generator"');
    });

    it('should include theme-color meta tag', async () => {
      const content = await readFile(seoComponentPath, 'utf-8');
      expect(content).toContain('name="theme-color"');
    });
  });

  describe('3. Open Graph Meta Tags', () => {
    const seoComponentPath = path.join(rootDir, 'src/components/SEO.astro');

    it('should include og:type meta tag', async () => {
      const content = await readFile(seoComponentPath, 'utf-8');
      expect(content).toContain('property="og:type"');
    });

    it('should include og:url meta tag', async () => {
      const content = await readFile(seoComponentPath, 'utf-8');
      expect(content).toContain('property="og:url"');
    });

    it('should include og:site_name meta tag', async () => {
      const content = await readFile(seoComponentPath, 'utf-8');
      expect(content).toContain('property="og:site_name"');
    });

    it('should include og:title meta tag', async () => {
      const content = await readFile(seoComponentPath, 'utf-8');
      expect(content).toContain('property="og:title"');
    });

    it('should include og:description meta tag', async () => {
      const content = await readFile(seoComponentPath, 'utf-8');
      expect(content).toContain('property="og:description"');
    });

    it('should include og:image meta tag', async () => {
      const content = await readFile(seoComponentPath, 'utf-8');
      expect(content).toContain('property="og:image"');
    });

    it('should include og:image:alt meta tag', async () => {
      const content = await readFile(seoComponentPath, 'utf-8');
      expect(content).toContain('property="og:image:alt"');
    });

    it('should include og:locale meta tag', async () => {
      const content = await readFile(seoComponentPath, 'utf-8');
      expect(content).toContain('property="og:locale"');
    });
  });

  describe('4. Twitter Card Meta Tags', () => {
    const seoComponentPath = path.join(rootDir, 'src/components/SEO.astro');

    it('should include twitter:card meta tag', async () => {
      const content = await readFile(seoComponentPath, 'utf-8');
      expect(content).toContain('name="twitter:card"');
    });

    it('should include twitter:url meta tag', async () => {
      const content = await readFile(seoComponentPath, 'utf-8');
      expect(content).toContain('name="twitter:url"');
    });

    it('should include twitter:title meta tag', async () => {
      const content = await readFile(seoComponentPath, 'utf-8');
      expect(content).toContain('name="twitter:title"');
    });

    it('should include twitter:description meta tag', async () => {
      const content = await readFile(seoComponentPath, 'utf-8');
      expect(content).toContain('name="twitter:description"');
    });

    it('should include twitter:image meta tag', async () => {
      const content = await readFile(seoComponentPath, 'utf-8');
      expect(content).toContain('name="twitter:image"');
    });

    it('should include twitter:image:alt meta tag', async () => {
      const content = await readFile(seoComponentPath, 'utf-8');
      expect(content).toContain('name="twitter:image:alt"');
    });
  });

  describe('5. Canonical URL', () => {
    const seoComponentPath = path.join(rootDir, 'src/components/SEO.astro');

    it('should include canonical link tag', async () => {
      const content = await readFile(seoComponentPath, 'utf-8');
      expect(content).toContain('rel="canonical"');
    });

    it('should generate canonical URL from current URL', async () => {
      const content = await readFile(seoComponentPath, 'utf-8');
      expect(content).toContain('canonicalURL');
      expect(content).toContain('Astro.url.pathname');
    });
  });

  describe('6. Default Values', () => {
    const seoComponentPath = path.join(rootDir, 'src/components/SEO.astro');

    it('should have default description', async () => {
      const content = await readFile(seoComponentPath, 'utf-8');
      expect(content).toContain("description = 'Discover spiritual growth");
    });

    it('should have default keywords', async () => {
      const content = await readFile(seoComponentPath, 'utf-8');
      expect(content).toContain('spirituality');
      expect(content).toContain('meditation');
      expect(content).toContain('mindfulness');
    });

    it('should have default author', async () => {
      const content = await readFile(seoComponentPath, 'utf-8');
      expect(content).toContain("author = 'Spirituality Platform'");
    });

    it('should have default OG image', async () => {
      const content = await readFile(seoComponentPath, 'utf-8');
      expect(content).toContain("ogImage = '/images/og-default.jpg'");
    });

    it('should have default OG type', async () => {
      const content = await readFile(seoComponentPath, 'utf-8');
      expect(content).toContain("ogType = 'website'");
    });

    it('should have default Twitter card type', async () => {
      const content = await readFile(seoComponentPath, 'utf-8');
      expect(content).toContain("twitterCard = 'summary_large_image'");
    });
  });

  describe('7. SEO Best Practices', () => {
    const seoComponentPath = path.join(rootDir, 'src/components/SEO.astro');

    it('should truncate title if too long (60 chars)', async () => {
      const content = await readFile(seoComponentPath, 'utf-8');
      expect(content).toContain('fullTitle.length > 60');
      expect(content).toContain('substring(0, 57)');
    });

    it('should truncate description if too long (160 chars)', async () => {
      const content = await readFile(seoComponentPath, 'utf-8');
      expect(content).toContain('description.length > 160');
      expect(content).toContain('substring(0, 157)');
    });

    it('should append site name to title', async () => {
      const content = await readFile(seoComponentPath, 'utf-8');
      expect(content).toContain('siteName');
      expect(content).toContain('Spirituality Platform');
    });

    it('should generate absolute URLs for OG images', async () => {
      const content = await readFile(seoComponentPath, 'utf-8');
      expect(content).toContain('absoluteOgImage');
      expect(content).toContain('startsWith');
    });
  });

  describe('8. Article-Specific Meta Tags', () => {
    const seoComponentPath = path.join(rootDir, 'src/components/SEO.astro');

    it('should support article published time', async () => {
      const content = await readFile(seoComponentPath, 'utf-8');
      expect(content).toContain('publishedTime');
      expect(content).toContain('article:published_time');
    });

    it('should support article modified time', async () => {
      const content = await readFile(seoComponentPath, 'utf-8');
      expect(content).toContain('modifiedTime');
      expect(content).toContain('article:modified_time');
    });

    it('should support article author', async () => {
      const content = await readFile(seoComponentPath, 'utf-8');
      expect(content).toContain('articleAuthor');
      expect(content).toContain('article:author');
    });

    it('should support article section', async () => {
      const content = await readFile(seoComponentPath, 'utf-8');
      expect(content).toContain('articleSection');
      expect(content).toContain('article:section');
    });

    it('should support article tags', async () => {
      const content = await readFile(seoComponentPath, 'utf-8');
      expect(content).toContain('articleTags');
      expect(content).toContain('article:tag');
    });
  });

  describe('9. Robots Control', () => {
    const seoComponentPath = path.join(rootDir, 'src/components/SEO.astro');

    it('should support noindex option', async () => {
      const content = await readFile(seoComponentPath, 'utf-8');
      expect(content).toContain('noindex');
      expect(content).toContain("noindex ? 'noindex' : 'index'");
    });

    it('should support nofollow option', async () => {
      const content = await readFile(seoComponentPath, 'utf-8');
      expect(content).toContain('nofollow');
      expect(content).toContain("nofollow ? 'nofollow' : 'follow'");
    });

    it('should default to index,follow', async () => {
      const content = await readFile(seoComponentPath, 'utf-8');
      expect(content).toContain('noindex = false');
      expect(content).toContain('nofollow = false');
    });
  });

  describe('10. Structured Data (JSON-LD)', () => {
    const seoComponentPath = path.join(rootDir, 'src/components/SEO.astro');

    it('should include WebSite structured data', async () => {
      const content = await readFile(seoComponentPath, 'utf-8');
      expect(content).toContain('application/ld+json');
      expect(content).toContain("'@type': 'WebSite'");
    });

    it('should include SearchAction in structured data', async () => {
      const content = await readFile(seoComponentPath, 'utf-8');
      expect(content).toContain('SearchAction');
      expect(content).toContain('urlTemplate');
    });

    it('should include Article structured data for articles', async () => {
      const content = await readFile(seoComponentPath, 'utf-8');
      expect(content).toContain("'@type': 'Article'");
    });

    it('should include schema.org context', async () => {
      const content = await readFile(seoComponentPath, 'utf-8');
      expect(content).toContain("'@context': 'https://schema.org'");
    });
  });

  describe('11. BaseLayout Integration', () => {
    const baseLayoutPath = path.join(rootDir, 'src/layouts/BaseLayout.astro');

    it('should have BaseLayout file', () => {
      expect(existsSync(baseLayoutPath)).toBe(true);
    });

    it('should import SEO component', async () => {
      const content = await readFile(baseLayoutPath, 'utf-8');
      expect(content).toContain("import SEO from '@/components/SEO.astro'");
    });

    it('should use SEO component in head', async () => {
      const content = await readFile(baseLayoutPath, 'utf-8');
      expect(content).toContain('<SEO');
    });

    it('should pass title prop to SEO component', async () => {
      const content = await readFile(baseLayoutPath, 'utf-8');
      expect(content).toContain('title={title}');
    });

    it('should pass description prop to SEO component', async () => {
      const content = await readFile(baseLayoutPath, 'utf-8');
      expect(content).toContain('description={description}');
    });

    it('should pass keywords prop to SEO component', async () => {
      const content = await readFile(baseLayoutPath, 'utf-8');
      expect(content).toContain('keywords={keywords}');
    });

    it('should support article metadata', async () => {
      const content = await readFile(baseLayoutPath, 'utf-8');
      expect(content).toContain('publishedTime');
      expect(content).toContain('articleAuthor');
    });
  });

  describe('12. Component Props Interface', () => {
    const seoComponentPath = path.join(rootDir, 'src/components/SEO.astro');

    it('should have title prop with JSDoc', async () => {
      const content = await readFile(seoComponentPath, 'utf-8');
      expect(content).toContain('title: string');
      expect(content).toContain('Page title');
    });

    it('should have optional description prop', async () => {
      const content = await readFile(seoComponentPath, 'utf-8');
      expect(content).toContain('description?:');
    });

    it('should have optional keywords prop', async () => {
      const content = await readFile(seoComponentPath, 'utf-8');
      expect(content).toContain('keywords?:');
    });

    it('should have optional ogImage prop', async () => {
      const content = await readFile(seoComponentPath, 'utf-8');
      expect(content).toContain('ogImage?:');
    });

    it('should have ogType with union type', async () => {
      const content = await readFile(seoComponentPath, 'utf-8');
      expect(content).toContain('ogType?:');
      expect(content).toContain("'website' | 'article'");
    });

    it('should have twitterCard with union type', async () => {
      const content = await readFile(seoComponentPath, 'utf-8');
      expect(content).toContain('twitterCard?:');
      expect(content).toContain("'summary' | 'summary_large_image'");
    });
  });

  describe('13. Twitter Metadata Support', () => {
    const seoComponentPath = path.join(rootDir, 'src/components/SEO.astro');

    it('should support Twitter site handle', async () => {
      const content = await readFile(seoComponentPath, 'utf-8');
      expect(content).toContain('twitterSite');
      expect(content).toContain('twitter:site');
    });

    it('should support Twitter creator handle', async () => {
      const content = await readFile(seoComponentPath, 'utf-8');
      expect(content).toContain('twitterCreator');
      expect(content).toContain('twitter:creator');
    });
  });

  describe('14. Language Support', () => {
    const seoComponentPath = path.join(rootDir, 'src/components/SEO.astro');

    it('should support language prop', async () => {
      const content = await readFile(seoComponentPath, 'utf-8');
      expect(content).toContain('lang');
    });

    it('should default to English', async () => {
      const content = await readFile(seoComponentPath, 'utf-8');
      expect(content).toContain("lang = 'en'");
    });

    it('should set og:locale based on language', async () => {
      const content = await readFile(seoComponentPath, 'utf-8');
      expect(content).toContain('og:locale');
      expect(content).toContain('en_US');
    });
  });

  describe('15. Image Handling', () => {
    const seoComponentPath = path.join(rootDir, 'src/components/SEO.astro');

    it('should handle relative image URLs', async () => {
      const content = await readFile(seoComponentPath, 'utf-8');
      expect(content).toContain('ogImage.startsWith');
    });

    it('should generate absolute image URLs', async () => {
      const content = await readFile(seoComponentPath, 'utf-8');
      expect(content).toContain('absoluteOgImage');
    });

    it('should include image alt text', async () => {
      const content = await readFile(seoComponentPath, 'utf-8');
      expect(content).toContain('og:image:alt');
      expect(content).toContain('twitter:image:alt');
    });
  });

  describe('16. File Structure', () => {
    it('should have SEO component in correct location', () => {
      const componentPath = path.join(rootDir, 'src/components/SEO.astro');
      expect(existsSync(componentPath)).toBe(true);
    });

    it('should have BaseLayout in correct location', () => {
      const layoutPath = path.join(rootDir, 'src/layouts/BaseLayout.astro');
      expect(existsSync(layoutPath)).toBe(true);
    });
  });

  describe('17. Code Quality', () => {
    const seoComponentPath = path.join(rootDir, 'src/components/SEO.astro');

    it('should have proper TypeScript typing', async () => {
      const content = await readFile(seoComponentPath, 'utf-8');
      expect(content).toContain('interface Props');
    });

    it('should have JSDoc comments', async () => {
      const content = await readFile(seoComponentPath, 'utf-8');
      expect(content).toContain('/**');
      expect(content).toContain('*/');
    });

    it('should have usage examples', async () => {
      const content = await readFile(seoComponentPath, 'utf-8');
      expect(content).toContain('@example');
    });

    it('should have parameter descriptions', async () => {
      const content = await readFile(seoComponentPath, 'utf-8');
      expect(content).toContain('@default');
    });
  });

  describe('18. SEO Best Practices Implementation', () => {
    const seoComponentPath = path.join(rootDir, 'src/components/SEO.astro');

    it('should document optimal title length', async () => {
      const content = await readFile(seoComponentPath, 'utf-8');
      expect(content).toContain('50-60 character') || expect(content).toContain('60 chars');
    });

    it('should document optimal description length', async () => {
      const content = await readFile(seoComponentPath, 'utf-8');
      expect(content).toContain('150-160 character') || expect(content).toContain('160 chars');
    });

    it('should include comprehensive default keywords', async () => {
      const content = await readFile(seoComponentPath, 'utf-8');
      const keywordsMatch = content.match(/keywords = ['"]([^'"]+)['"]/);
      if (keywordsMatch) {
        const keywords = keywordsMatch[1].split(',').map(k => k.trim());
        expect(keywords.length).toBeGreaterThanOrEqual(5);
      }
    });
  });
});
