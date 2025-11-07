/**
 * T223: Twitter Card Meta Tags Tests
 *
 * Tests for Twitter Card implementation for Twitter/X sharing.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const twitterCardComponentPath = join(process.cwd(), 'src', 'components', 'TwitterCard.astro');
const seoComponentPath = join(process.cwd(), 'src', 'components', 'SEO.astro');

describe('T223: Twitter Card Meta Tags', () => {
  describe('Component File', () => {
    it('should exist at src/components/TwitterCard.astro', () => {
      expect(existsSync(twitterCardComponentPath)).toBe(true);
    });

    it('should be a valid Astro component', () => {
      const content = readFileSync(twitterCardComponentPath, 'utf-8');
      expect(content).toContain('---');
      expect(content).toContain('interface Props');
    });

    it('should have comprehensive JSDoc documentation', () => {
      const content = readFileSync(twitterCardComponentPath, 'utf-8');
      expect(content).toContain('/**');
      expect(content).toContain('* Twitter Card Component');
    });

    it('should reference Twitter Cards documentation', () => {
      const content = readFileSync(twitterCardComponentPath, 'utf-8');
      expect(content).toMatch(/twitter\.com|Twitter Card/i);
    });
  });

  describe('Required Twitter Card Properties', () => {
    let content: string;

    beforeEach(() => {
      content = readFileSync(twitterCardComponentPath, 'utf-8');
    });

    it('should include twitter:card meta tag', () => {
      expect(content).toContain('<meta name="twitter:card"');
      expect(content).toContain('content={card}');
    });

    it('should include twitter:title meta tag', () => {
      expect(content).toContain('<meta name="twitter:title"');
      expect(content).toContain('content={title}');
    });

    it('should include twitter:description meta tag', () => {
      expect(content).toContain('<meta name="twitter:description"');
      expect(content).toContain('content={description}');
    });

    it('should include twitter:image meta tag', () => {
      expect(content).toContain('<meta name="twitter:image"');
      expect(content).toContain('absoluteImageUrl');
    });

    it('should have twitter:card with valid card types', () => {
      expect(content).toMatch(/'summary'\s*\|\s*'summary_large_image'\s*\|\s*'app'\s*\|\s*'player'/);
    });

    it('should default to summary_large_image', () => {
      expect(content).toContain("card = 'summary_large_image'");
    });
  });

  describe('Optional Twitter Card Properties', () => {
    let content: string;

    beforeEach(() => {
      content = readFileSync(twitterCardComponentPath, 'utf-8');
    });

    it('should include twitter:site meta tag when provided', () => {
      expect(content).toContain('{site &&');
      expect(content).toContain('<meta name="twitter:site"');
      expect(content).toContain('content={site}');
    });

    it('should include twitter:creator meta tag when provided', () => {
      expect(content).toContain('{creator &&');
      expect(content).toContain('<meta name="twitter:creator"');
      expect(content).toContain('content={creator}');
    });

    it('should include twitter:image:alt meta tag when provided', () => {
      expect(content).toContain('{imageAlt &&');
      expect(content).toContain('<meta name="twitter:image:alt"');
      expect(content).toContain('imageAltText');
    });

    it('should have optional site prop', () => {
      expect(content).toContain('site?:');
    });

    it('should have optional creator prop', () => {
      expect(content).toContain('creator?:');
    });
  });

  describe('Card Types', () => {
    let content: string;

    beforeEach(() => {
      content = readFileSync(twitterCardComponentPath, 'utf-8');
    });

    it('should support summary card type', () => {
      expect(content).toMatch(/card.*'summary'/);
    });

    it('should support summary_large_image card type', () => {
      expect(content).toMatch(/card.*'summary_large_image'/);
    });

    it('should support app card type', () => {
      expect(content).toMatch(/card.*'app'/);
    });

    it('should support player card type', () => {
      expect(content).toMatch(/card.*'player'/);
    });
  });

  describe('App Card Properties', () => {
    let content: string;

    beforeEach(() => {
      content = readFileSync(twitterCardComponentPath, 'utf-8');
    });

    it('should conditionally render app card properties', () => {
      expect(content).toContain("card === 'app'");
    });

    it('should support app name for different platforms', () => {
      expect(content).toContain('appName?.iphone');
      expect(content).toContain('appName?.ipad');
      expect(content).toContain('appName?.googleplay');
    });

    it('should support app ID for different platforms', () => {
      expect(content).toContain('appId?.iphone');
      expect(content).toContain('appId?.ipad');
      expect(content).toContain('appId?.googleplay');
    });

    it('should support app URL for different platforms', () => {
      expect(content).toContain('appUrl?.iphone');
      expect(content).toContain('appUrl?.ipad');
      expect(content).toContain('appUrl?.googleplay');
    });

    it('should have twitter:app:name tags', () => {
      expect(content).toContain('<meta name="twitter:app:name:iphone"');
      expect(content).toContain('<meta name="twitter:app:name:ipad"');
      expect(content).toContain('<meta name="twitter:app:name:googleplay"');
    });
  });

  describe('Player Card Properties', () => {
    let content: string;

    beforeEach(() => {
      content = readFileSync(twitterCardComponentPath, 'utf-8');
    });

    it('should conditionally render player card properties', () => {
      expect(content).toContain("card === 'player'");
    });

    it('should support player URL', () => {
      expect(content).toContain('playerUrl');
      expect(content).toContain('<meta name="twitter:player"');
    });

    it('should support player width', () => {
      expect(content).toContain('playerWidth');
      expect(content).toContain('<meta name="twitter:player:width"');
    });

    it('should support player height', () => {
      expect(content).toContain('playerHeight');
      expect(content).toContain('<meta name="twitter:player:height"');
    });

    it('should support player stream', () => {
      expect(content).toContain('playerStream');
      expect(content).toContain('<meta name="twitter:player:stream"');
    });
  });

  describe('URL Handling', () => {
    let content: string;

    beforeEach(() => {
      content = readFileSync(twitterCardComponentPath, 'utf-8');
    });

    it('should convert relative image URLs to absolute', () => {
      expect(content).toContain('absoluteImageUrl');
      expect(content).toContain("image.startsWith('http')");
      expect(content).toMatch(/siteUrl.*image/);
    });

    it('should use absolute image URL in meta tag', () => {
      expect(content).toContain('content={absoluteImageUrl}');
    });

    it('should get siteUrl from Astro config', () => {
      expect(content).toContain('Astro.site');
      expect(content).toContain('Astro.url.origin');
    });
  });

  describe('Validation and Warnings', () => {
    let content: string;

    beforeEach(() => {
      content = readFileSync(twitterCardComponentPath, 'utf-8');
    });

    it('should validate title length', () => {
      expect(content).toContain('title.length > 70');
      expect(content).toContain('console.warn');
    });

    it('should validate description length', () => {
      expect(content).toContain('description.length > 200');
      expect(content).toContain('console.warn');
    });

    it('should validate @username format for site', () => {
      expect(content).toContain("!site.startsWith('@')");
      expect(content).toContain('console.warn');
    });

    it('should validate @username format for creator', () => {
      expect(content).toContain("!creator.startsWith('@')");
      expect(content).toContain('console.warn');
    });

    it('should include debug information in development', () => {
      expect(content).toContain('import.meta.env.DEV');
      expect(content).toContain('data-twitter-card-debug');
    });

    it('should warn about card type recommendations', () => {
      expect(content).toMatch(/summary_large_image.*1200x628/i);
      expect(content).toMatch(/summary.*144x144/i);
    });
  });

  describe('Props Interface', () => {
    let content: string;

    beforeEach(() => {
      content = readFileSync(twitterCardComponentPath, 'utf-8');
    });

    it('should have required title prop', () => {
      expect(content).toContain('title: string');
    });

    it('should have required description prop', () => {
      expect(content).toContain('description: string');
    });

    it('should have required image prop', () => {
      expect(content).toContain('image: string');
    });

    it('should have optional card prop', () => {
      expect(content).toContain('card?:');
    });

    it('should have optional site and creator props', () => {
      expect(content).toContain('site?:');
      expect(content).toContain('creator?:');
    });

    it('should have JSDoc comments for props', () => {
      const propsSection = content.match(/interface Props \{[\s\S]*?\}/);
      expect(propsSection).toBeTruthy();
      if (propsSection) {
        expect(propsSection[0]).toContain('@example');
        expect(propsSection[0]).toContain('@default');
      }
    });
  });

  describe('SEO Component Integration', () => {
    let seoContent: string;

    beforeEach(() => {
      seoContent = readFileSync(seoComponentPath, 'utf-8');
    });

    it('should import TwitterCard component in SEO', () => {
      expect(seoContent).toContain("import TwitterCard from '@/components/TwitterCard.astro'");
    });

    it('should use TwitterCard component in SEO', () => {
      expect(seoContent).toContain('<TwitterCard');
    });

    it('should pass card type to TwitterCard', () => {
      expect(seoContent).toMatch(/card=\{.*twitterCard.*\}/);
    });

    it('should pass title to TwitterCard', () => {
      expect(seoContent).toMatch(/title=\{.*displayTitle.*\}/);
    });

    it('should pass description to TwitterCard', () => {
      expect(seoContent).toMatch(/description=\{.*displayDescription.*\}/);
    });

    it('should pass image to TwitterCard', () => {
      expect(seoContent).toMatch(/image=\{.*ogImage.*\}/);
    });

    it('should pass site to TwitterCard', () => {
      expect(seoContent).toMatch(/site=\{.*twitterSite.*\}/);
    });

    it('should pass creator to TwitterCard', () => {
      expect(seoContent).toMatch(/creator=\{.*twitterCreator.*\}/);
    });
  });

  describe('Best Practices', () => {
    let content: string;

    beforeEach(() => {
      content = readFileSync(twitterCardComponentPath, 'utf-8');
    });

    it('should recommend 1200x628px for large image cards', () => {
      expect(content).toMatch(/1200.*628|1200x628/);
    });

    it('should recommend 144x144px for summary cards', () => {
      expect(content).toMatch(/144.*144|144x144/);
    });

    it('should recommend @username format', () => {
      expect(content).toMatch(/@username|@yourbrand/);
    });

    it('should use absolute URLs', () => {
      expect(content).toContain('absoluteImageUrl');
    });

    it('should have default card type', () => {
      expect(content).toContain("card = 'summary_large_image'");
    });

    it('should have image alt text support', () => {
      expect(content).toContain('imageAlt');
      expect(content).toContain('twitter:image:alt');
    });
  });

  describe('Type Safety', () => {
    let content: string;

    beforeEach(() => {
      content = readFileSync(twitterCardComponentPath, 'utf-8');
    });

    it('should have TypeScript interface', () => {
      expect(content).toContain('interface Props');
    });

    it('should type card as string union', () => {
      expect(content).toContain("'summary' | 'summary_large_image' | 'app' | 'player'");
    });

    it('should type all props correctly', () => {
      expect(content).toMatch(/\w+:\s*string/);
      expect(content).toMatch(/\w+\?:\s*string/);
    });

    it('should type numbers correctly', () => {
      expect(content).toMatch(/playerWidth\?:\s*number/);
      expect(content).toMatch(/playerHeight\?:\s*number/);
    });
  });

  describe('Documentation', () => {
    let content: string;

    beforeEach(() => {
      content = readFileSync(twitterCardComponentPath, 'utf-8');
    });

    it('should have usage examples', () => {
      expect(content).toContain('Usage:');
      expect(content).toContain('```astro');
      expect(content).toContain('<TwitterCard');
    });

    it('should document best practices', () => {
      expect(content).toContain('Best Practices');
    });

    it('should reference official Twitter documentation', () => {
      expect(content).toMatch(/twitter\.com\/.*\/docs|developer\.twitter\.com/i);
    });

    it('should have inline comments', () => {
      const commentCount = (content.match(/\/\//g) || []).length;
      expect(commentCount).toBeGreaterThan(3);
    });
  });

  describe('Edge Cases', () => {
    let content: string;

    beforeEach(() => {
      content = readFileSync(twitterCardComponentPath, 'utf-8');
    });

    it('should handle missing optional props gracefully', () => {
      expect(content).toContain('imageAlt ||');
      expect(content).toMatch(/site.*&&/);
      expect(content).toMatch(/creator.*&&/);
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
      const content = readFileSync(twitterCardComponentPath, 'utf-8');
      const sizeInKB = Buffer.byteLength(content, 'utf-8') / 1024;
      expect(sizeInKB).toBeLessThan(15);
    });

    it('should not have unnecessary dependencies', () => {
      const content = readFileSync(twitterCardComponentPath, 'utf-8');
      expect(content).not.toContain('import React');
      expect(content).not.toContain('import Vue');
    });
  });

  describe('Twitter Platform Compatibility', () => {
    let content: string;

    beforeEach(() => {
      content = readFileSync(twitterCardComponentPath, 'utf-8');
    });

    it('should support standard Twitter cards', () => {
      expect(content).toContain('twitter:card');
      expect(content).toContain('twitter:title');
      expect(content).toContain('twitter:description');
      expect(content).toContain('twitter:image');
    });

    it('should support summary cards', () => {
      expect(content).toContain("'summary'");
    });

    it('should support large image summary cards', () => {
      expect(content).toContain("'summary_large_image'");
    });

    it('should support app cards', () => {
      expect(content).toContain("'app'");
    });

    it('should support player cards', () => {
      expect(content).toContain("'player'");
    });
  });
});
