/**
 * T230: Configure robots.txt Tests
 *
 * Tests for robots.txt configuration to ensure proper search engine crawling directives.
 *
 * Test Coverage:
 * - File existence and accessibility
 * - Basic syntax and structure
 * - User-agent directives
 * - Allow/Disallow rules
 * - Sitemap location
 * - Security and best practices
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const robotsTxtPath = join(process.cwd(), 'public', 'robots.txt');

describe('T230: robots.txt Configuration', () => {
  describe('File Existence', () => {
    it('should exist at public/robots.txt', () => {
      expect(existsSync(robotsTxtPath)).toBe(true);
    });

    it('should be readable', () => {
      expect(() => readFileSync(robotsTxtPath, 'utf-8')).not.toThrow();
    });

    it('should not be empty', () => {
      const content = readFileSync(robotsTxtPath, 'utf-8');
      expect(content.length).toBeGreaterThan(0);
    });
  });

  describe('Basic Syntax and Structure', () => {
    let content: string;

    beforeEach(() => {
      content = readFileSync(robotsTxtPath, 'utf-8');
    });

    it('should have proper line breaks', () => {
      expect(content).toContain('\n');
    });

    it('should have comments explaining the file', () => {
      expect(content).toContain('#');
    });

    it('should follow robots.txt format', () => {
      // Check for key directive patterns
      expect(content).toMatch(/User-agent:/i);
      expect(content).toMatch(/(Allow:|Disallow:)/i);
    });

    it('should not contain invalid characters', () => {
      // robots.txt should be plain text ASCII
      const lines = content.split('\n');
      lines.forEach(line => {
        // Allow only ASCII characters, newlines, and basic punctuation
        expect(line).toMatch(/^[\x20-\x7E\t\r]*$/);
      });
    });
  });

  describe('User-Agent Directives', () => {
    let content: string;

    beforeEach(() => {
      content = readFileSync(robotsTxtPath, 'utf-8');
    });

    it('should have a User-agent directive', () => {
      expect(content).toMatch(/User-agent:/i);
    });

    it('should include wildcard User-agent (*) for all crawlers', () => {
      expect(content).toMatch(/User-agent:\s*\*/i);
    });

    it('should have proper User-agent syntax', () => {
      const userAgentLines = content.match(/User-agent:.*$/gmi) || [];
      expect(userAgentLines.length).toBeGreaterThan(0);

      userAgentLines.forEach(line => {
        // Format: "User-agent: BotName" or "User-agent: *"
        expect(line).toMatch(/User-agent:\s+[\w*-]+/i);
      });
    });
  });

  describe('Allow Directives', () => {
    let content: string;

    beforeEach(() => {
      content = readFileSync(robotsTxtPath, 'utf-8');
    });

    it('should have Allow directive', () => {
      expect(content).toMatch(/Allow:/i);
    });

    it('should allow root path (Allow: /)', () => {
      expect(content).toMatch(/Allow:\s*\//i);
    });

    it('should have proper Allow syntax', () => {
      const allowLines = content.match(/^Allow:.*$/gmi) || [];

      allowLines.forEach(line => {
        // Format: "Allow: /path"
        expect(line).toMatch(/Allow:\s+\//i);
      });
    });
  });

  describe('Disallow Directives - Sensitive Paths', () => {
    let content: string;

    beforeEach(() => {
      content = readFileSync(robotsTxtPath, 'utf-8');
    });

    it('should have Disallow directives', () => {
      expect(content).toMatch(/Disallow:/i);
    });

    it('should disallow /api/ path', () => {
      expect(content).toMatch(/Disallow:\s*\/api\//i);
    });

    it('should disallow /admin/ path', () => {
      expect(content).toMatch(/Disallow:\s*\/admin\//i);
    });

    it('should disallow /cart/ path', () => {
      expect(content).toMatch(/Disallow:\s*\/cart\//i);
    });

    it('should disallow /checkout/ path', () => {
      expect(content).toMatch(/Disallow:\s*\/checkout\//i);
    });

    it('should have proper Disallow syntax', () => {
      const disallowLines = content.match(/^Disallow:.*$/gmi) || [];
      expect(disallowLines.length).toBeGreaterThan(0);

      disallowLines.forEach(line => {
        // Format: "Disallow: /path" or "Disallow:" (for allowing all)
        expect(line).toMatch(/Disallow:\s*[\/\w*.-]*/i);
      });
    });
  });

  describe('Sitemap Directive', () => {
    let content: string;

    beforeEach(() => {
      content = readFileSync(robotsTxtPath, 'utf-8');
    });

    it('should have Sitemap directive', () => {
      expect(content).toMatch(/Sitemap:/i);
    });

    it('should have sitemap URL', () => {
      expect(content).toMatch(/Sitemap:\s*https?:\/\//i);
    });

    it('should have sitemap pointing to sitemap.xml', () => {
      expect(content).toMatch(/Sitemap:.*sitemap\.xml/i);
    });

    it('should have absolute URL for sitemap', () => {
      const sitemapLine = content.match(/Sitemap:\s*(.*)/i);
      if (sitemapLine && sitemapLine[1]) {
        const url = sitemapLine[1].trim();
        expect(url).toMatch(/^https?:\/\//);
      }
    });
  });

  describe('Security Best Practices', () => {
    let content: string;

    beforeEach(() => {
      content = readFileSync(robotsTxtPath, 'utf-8');
    });

    it('should protect authentication endpoints', () => {
      const hasLoginProtection =
        content.match(/Disallow:.*\/login/i) ||
        content.match(/Disallow:.*\/register/i) ||
        content.match(/Disallow:.*\/reset-password/i);

      expect(hasLoginProtection).toBeTruthy();
    });

    it('should protect user account pages', () => {
      const hasAccountProtection =
        content.match(/Disallow:.*\/account/i);

      expect(hasAccountProtection).toBeTruthy();
    });

    it('should not contain sensitive information in comments', () => {
      const lowerContent = content.toLowerCase();

      // Check for common sensitive keywords
      expect(lowerContent).not.toContain('password');
      expect(lowerContent).not.toContain('api_key');
      expect(lowerContent).not.toContain('secret');
      expect(lowerContent).not.toContain('token');
      expect(lowerContent).not.toContain('credential');
    });
  });

  describe('SEO Best Practices', () => {
    let content: string;

    beforeEach(() => {
      content = readFileSync(robotsTxtPath, 'utf-8');
    });

    it('should block duplicate content from query parameters', () => {
      // Should block URLs with search or tracking parameters
      const hasQueryBlock =
        content.match(/Disallow:.*\?/i) ||
        content.match(/Disallow:.*utm_/i) ||
        content.match(/Disallow:.*search=/i);

      expect(hasQueryBlock).toBeTruthy();
    });

    it('should have explanatory comments', () => {
      const commentLines = content.match(/^#.*$/gm) || [];
      expect(commentLines.length).toBeGreaterThan(3);
    });

    it('should not block important public resources', () => {
      // Should not disallow CSS, JS, images
      expect(content).not.toMatch(/Disallow:.*\.css/i);
      expect(content).not.toMatch(/Disallow:.*\.js/i);
      expect(content).not.toMatch(/Disallow:.*\.jpg/i);
      expect(content).not.toMatch(/Disallow:.*\.png/i);
    });
  });

  describe('Format Validation', () => {
    let content: string;

    beforeEach(() => {
      content = readFileSync(robotsTxtPath, 'utf-8');
    });

    it('should have directives after User-agent', () => {
      const lines = content.split('\n').filter(line => line.trim() && !line.trim().startsWith('#'));

      let foundUserAgent = false;
      let foundDirectiveAfterUserAgent = false;

      for (const line of lines) {
        if (line.match(/User-agent:/i)) {
          foundUserAgent = true;
        } else if (foundUserAgent && (line.match(/Allow:/i) || line.match(/Disallow:/i))) {
          foundDirectiveAfterUserAgent = true;
          break;
        }
      }

      expect(foundUserAgent).toBe(true);
      expect(foundDirectiveAfterUserAgent).toBe(true);
    });

    it('should not have trailing whitespace on directive lines', () => {
      const directiveLines = content.match(/^(User-agent|Allow|Disallow|Sitemap):.*$/gmi) || [];

      directiveLines.forEach(line => {
        // Allow trailing whitespace but not on directive lines for cleanliness
        if (line.trim().length > 0) {
          expect(line).toBe(line.trimEnd());
        }
      });
    });

    it('should use consistent spacing after colons', () => {
      const directiveLines = content.match(/^(User-agent|Allow|Disallow|Sitemap):.*$/gmi) || [];

      directiveLines.forEach(line => {
        // Should have space after colon
        expect(line).toMatch(/:\s+/);
      });
    });
  });

  describe('Content Validation', () => {
    let content: string;

    beforeEach(() => {
      content = readFileSync(robotsTxtPath, 'utf-8');
    });

    it('should not be too large (< 500KB limit)', () => {
      // Google's limit is 500KB for robots.txt
      const sizeInBytes = Buffer.byteLength(content, 'utf-8');
      expect(sizeInBytes).toBeLessThan(500 * 1024);
    });

    it('should have reasonable number of directives', () => {
      const directiveLines = content.match(/^(User-agent|Allow|Disallow):.*$/gmi) || [];

      // Should have multiple directives but not excessive
      expect(directiveLines.length).toBeGreaterThan(3);
      expect(directiveLines.length).toBeLessThan(1000);
    });

    it('should be well-organized with sections', () => {
      // Should have multiple comment blocks organizing content
      const commentBlocks = content.split(/\n\n+/).filter(block =>
        block.trim().startsWith('#')
      );

      expect(commentBlocks.length).toBeGreaterThan(1);
    });
  });

  describe('Path Protection', () => {
    let content: string;

    beforeEach(() => {
      content = readFileSync(robotsTxtPath, 'utf-8');
    });

    it('should protect build artifacts', () => {
      // Should protect Astro build artifacts
      const hasBuildProtection = content.match(/Disallow:.*_astro/i);
      expect(hasBuildProtection).toBeTruthy();
    });

    it('should use trailing slashes for directory protection', () => {
      const disallowLines = content.match(/^Disallow:\s*\/\w+\//gmi) || [];

      // At least some protected paths should have trailing slashes
      expect(disallowLines.length).toBeGreaterThan(0);
    });

    it('should protect sensitive directories consistently', () => {
      const sensitivePathsToProtect = ['/api/', '/admin/'];

      sensitivePathsToProtect.forEach(path => {
        const regex = new RegExp(`Disallow:\\s*${path.replace(/\//g, '\\/')}`, 'i');
        expect(content).toMatch(regex);
      });
    });
  });

  describe('Accessibility', () => {
    it('should be accessible at /robots.txt route', () => {
      // File in public/ folder should be served at /robots.txt
      // This is a static file accessibility test
      const publicPath = join(process.cwd(), 'public', 'robots.txt');
      expect(existsSync(publicPath)).toBe(true);
    });

    it('should be in the correct location for web servers', () => {
      // Must be in public/ folder to be served at domain root
      expect(robotsTxtPath).toContain('public');
      expect(robotsTxtPath).toMatch(/public[\/\\]robots\.txt$/);
    });
  });

  describe('Documentation', () => {
    let content: string;

    beforeEach(() => {
      content = readFileSync(robotsTxtPath, 'utf-8');
    });

    it('should have header comments explaining purpose', () => {
      const firstLines = content.split('\n').slice(0, 5).join('\n');
      expect(firstLines).toContain('#');
      expect(firstLines.toLowerCase()).toMatch(/robots\.txt|search engine|crawler/);
    });

    it('should reference documentation or guidelines', () => {
      // Should link to Google's documentation or similar
      const hasDocLink =
        content.match(/https?:\/\/.*google.*robots/i) ||
        content.match(/https?:\/\/.*robotstxt\.org/i) ||
        content.includes('Learn more:');

      expect(hasDocLink).toBeTruthy();
    });

    it('should include instructions for updating sitemap URL', () => {
      const lowerContent = content.toLowerCase();
      const hasSitemapInstructions =
        lowerContent.includes('update') ||
        lowerContent.includes('replace') ||
        lowerContent.includes('domain');

      expect(hasSitemapInstructions).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    let content: string;

    beforeEach(() => {
      content = readFileSync(robotsTxtPath, 'utf-8');
    });

    it('should handle multiple User-agent blocks correctly', () => {
      const userAgentCount = (content.match(/User-agent:/gi) || []).length;

      // Should have at least the wildcard user-agent
      expect(userAgentCount).toBeGreaterThanOrEqual(1);
    });

    it('should not have conflicting directives', () => {
      // Ensure we don't have obviously conflicting rules
      // Note: "Allow: /" + "Disallow: /path" is valid (allow all except specific paths)
      // This test checks for truly problematic scenarios only

      const lines = content.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));

      // Check for duplicate Allow directives (same path allowed twice - not harmful but redundant)
      const allowLines = lines.filter(l => l.match(/^Allow:/i));
      const uniqueAllows = new Set(allowLines);
      expect(allowLines.length).toBe(uniqueAllows.size);

      // Check for duplicate Disallow directives (same path disallowed twice - not harmful but redundant)
      const disallowLines = lines.filter(l => l.match(/^Disallow:/i));
      const uniqueDisallows = new Set(disallowLines);
      expect(disallowLines.length).toBe(uniqueDisallows.size);

      // The file should be well-formed
      expect(allowLines.length).toBeGreaterThan(0);
      expect(disallowLines.length).toBeGreaterThan(0);
    });

    it('should handle empty lines gracefully', () => {
      // File should parse correctly even with empty lines
      const lines = content.split('\n');
      const hasEmptyLines = lines.some(line => line.trim() === '');

      // Having empty lines is fine for readability
      expect(hasEmptyLines).toBe(true);
    });
  });

  describe('Compliance', () => {
    let content: string;

    beforeEach(() => {
      content = readFileSync(robotsTxtPath, 'utf-8');
    });

    it('should follow robots.txt RFC specification', () => {
      // Basic compliance checks
      const hasUserAgent = content.match(/User-agent:/i);
      const hasDirectives = content.match(/(Allow:|Disallow:)/i);

      expect(hasUserAgent).toBeTruthy();
      expect(hasDirectives).toBeTruthy();
    });

    it('should use case-insensitive directives', () => {
      // Directives should use standard casing but are case-insensitive
      // This test ensures we use the conventional casing
      expect(content).toMatch(/User-agent:/); // Capital U
      expect(content).toMatch(/Allow:|Disallow:/); // Capital A/D
      expect(content).toMatch(/Sitemap:/); // Capital S
    });

    it('should not use deprecated directives', () => {
      // Check for old/deprecated directives
      expect(content).not.toMatch(/Noindex:/i); // Use meta tag instead
      expect(content).not.toMatch(/Host:/i); // Deprecated
    });
  });
});
