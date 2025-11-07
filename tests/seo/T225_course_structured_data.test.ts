/**
 * T225: Course Page Structured Data Tests
 *
 * Tests for Course schema implementation on course detail pages.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const coursePagePath = join(process.cwd(), 'src', 'pages', 'courses', '[id].astro');
const baseLayoutPath = join(process.cwd(), 'src', 'layouts', 'BaseLayout.astro');

describe('T225: Course Page Structured Data', () => {
  describe('Course Page File', () => {
    it('should exist at src/pages/courses/[id].astro', () => {
      expect(existsSync(coursePagePath)).toBe(true);
    });

    it('should be a valid Astro component', () => {
      const content = readFileSync(coursePagePath, 'utf-8');
      expect(content).toContain('---');
    });

    it('should have T225 task reference in comments', () => {
      const content = readFileSync(coursePagePath, 'utf-8');
      expect(content).toContain('T225');
    });
  });

  describe('Imports', () => {
    let content: string;

    beforeEach(() => {
      content = readFileSync(coursePagePath, 'utf-8');
    });

    it('should import StructuredData component', () => {
      expect(content).toContain("import StructuredData from '@/components/StructuredData.astro'");
    });

    it('should import generateCourseSchema function', () => {
      expect(content).toContain("import { generateCourseSchema } from '@/lib/structuredData'");
    });
  });

  describe('Schema Generation', () => {
    let content: string;

    beforeEach(() => {
      content = readFileSync(coursePagePath, 'utf-8');
    });

    it('should generate courseSchema variable', () => {
      expect(content).toContain('courseSchema');
      expect(content).toContain('generateCourseSchema');
    });

    it('should pass course name to schema', () => {
      expect(content).toMatch(/name:\s*course\.title/);
    });

    it('should pass course description to schema', () => {
      expect(content).toMatch(/description:\s*course\.(longDescription|description)/);
    });

    it('should pass course URL to schema', () => {
      expect(content).toMatch(/url:\s*courseUrl/);
      expect(content).toContain('courseUrl');
    });

    it('should pass course image to schema', () => {
      expect(content).toMatch(/image:\s*courseImageUrl/);
      expect(content).toContain('courseImageUrl');
    });

    it('should include provider information', () => {
      expect(content).toContain('provider:');
      expect(content).toContain("'@type': 'Organization'");
      expect(content).toContain("name: 'Spirituality Platform'");
    });

    it('should include instructor information', () => {
      expect(content).toContain('instructor:');
      expect(content).toContain("'@type': 'Person'");
      expect(content).toMatch(/name:\s*course\.instructorName/);
    });

    it('should include course instance with mode', () => {
      expect(content).toContain('hasCourseInstance:');
      expect(content).toContain("'@type': 'CourseInstance'");
      expect(content).toContain("courseMode: 'online'");
    });

    it('should include course workload in ISO 8601 duration format', () => {
      expect(content).toContain('courseWorkload:');
      expect(content).toMatch(/PT\${.*}H\${.*}M/);
    });

    it('should include pricing information', () => {
      expect(content).toContain('offers:');
      expect(content).toContain("'@type': 'Offer'");
      expect(content).toMatch(/price:\s*\(course\.price.*\)\.toFixed\(2\)/);
      expect(content).toContain("priceCurrency: 'USD'");
    });

    it('should include availability', () => {
      expect(content).toContain("availability: 'https://schema.org/InStock'");
    });

    it('should conditionally include aggregate rating', () => {
      expect(content).toContain('aggregateRating');
      expect(content).toContain('course.avgRating');
      expect(content).toContain('course.reviewCount');
    });

    it('should handle absolute and relative image URLs', () => {
      expect(content).toMatch(/\.startsWith\('http'\)/);
      expect(content).toContain('siteUrl');
    });
  });

  describe('URL Construction', () => {
    let content: string;

    beforeEach(() => {
      content = readFileSync(coursePagePath, 'utf-8');
    });

    it('should construct site URL from Astro.site or Astro.url', () => {
      expect(content).toContain('Astro.site?.origin');
      expect(content).toContain('Astro.url.origin');
    });

    it('should construct course URL with slug', () => {
      expect(content).toContain('courseUrl');
      expect(content).toMatch(/\/courses\/\${.*course\.slug.*}/);
    });

    it('should convert relative image URLs to absolute', () => {
      expect(content).toContain('courseImageUrl');
      expect(content).toMatch(/course\.imageUrl\.startsWith\('http'\)/);
    });

    it('should handle instructor avatar URL conversion', () => {
      expect(content).toMatch(/instructorAvatar.*startsWith\('http'\)/);
    });
  });

  describe('Component Rendering', () => {
    let content: string;

    beforeEach(() => {
      content = readFileSync(coursePagePath, 'utf-8');
    });

    it('should render StructuredData component', () => {
      expect(content).toContain('<StructuredData');
    });

    it('should pass courseSchema to StructuredData component', () => {
      expect(content).toMatch(/<StructuredData.*schema=\{courseSchema\}/);
    });

    it('should use head slot for StructuredData', () => {
      expect(content).toMatch(/<StructuredData.*slot="head"/);
    });

    it('should have comment explaining T225 implementation', () => {
      expect(content).toContain('T225');
      expect(content).toMatch(/Course Structured Data/i);
    });
  });

  describe('BaseLayout Integration', () => {
    let layoutContent: string;

    beforeEach(() => {
      layoutContent = readFileSync(baseLayoutPath, 'utf-8');
    });

    it('should have head slot in BaseLayout', () => {
      expect(layoutContent).toContain('<slot name="head"');
    });

    it('should position head slot before closing head tag', () => {
      const headSlotIndex = layoutContent.indexOf('<slot name="head"');
      const closingHeadIndex = layoutContent.indexOf('</head>');
      expect(headSlotIndex).toBeGreaterThan(-1);
      expect(closingHeadIndex).toBeGreaterThan(headSlotIndex);
    });
  });

  describe('Course Data Mapping', () => {
    let content: string;

    beforeEach(() => {
      content = readFileSync(coursePagePath, 'utf-8');
    });

    it('should use course.title for schema name', () => {
      expect(content).toMatch(/name:\s*course\.title/);
    });

    it('should prefer longDescription over description', () => {
      expect(content).toMatch(/course\.longDescription\s*\|\|\s*course\.description/);
    });

    it('should use course.price divided by 100 for dollars', () => {
      expect(content).toMatch(/course\.price\s*\/\s*100/);
    });

    it('should format price to 2 decimal places', () => {
      expect(content).toMatch(/\.toFixed\(2\)/);
    });

    it('should use course.duration for workload calculation', () => {
      expect(content).toMatch(/course\.duration/);
      expect(content).toMatch(/3600/); // Hours calculation
    });

    it('should use course.slug for URL construction', () => {
      expect(content).toMatch(/course\.slug/);
    });
  });

  describe('Rating and Review Integration', () => {
    let content: string;

    beforeEach(() => {
      content = readFileSync(coursePagePath, 'utf-8');
    });

    it('should check for both avgRating and reviewCount before including', () => {
      expect(content).toMatch(/course\.avgRating.*&&.*course\.reviewCount/);
    });

    it('should include ratingValue from avgRating', () => {
      expect(content).toMatch(/ratingValue:\s*course\.avgRating/);
    });

    it('should include reviewCount', () => {
      expect(content).toMatch(/reviewCount:\s*course\.reviewCount/);
    });

    it('should set bestRating to 5', () => {
      expect(content).toMatch(/bestRating:\s*5/);
    });

    it('should set worstRating to 1', () => {
      expect(content).toMatch(/worstRating:\s*1/);
    });
  });

  describe('ISO 8601 Duration Format', () => {
    let content: string;

    beforeEach(() => {
      content = readFileSync(coursePagePath, 'utf-8');
    });

    it('should format duration as ISO 8601 (PT format)', () => {
      expect(content).toMatch(/PT.*H.*M/);
    });

    it('should calculate hours from duration', () => {
      expect(content).toMatch(/Math\.floor\(course\.duration\s*\/\s*3600\)/);
    });

    it('should calculate minutes from remaining duration', () => {
      expect(content).toMatch(/Math\.floor\(\(course\.duration\s*%\s*3600\)\s*\/\s*60\)/);
    });
  });

  describe('Schema Properties', () => {
    let content: string;

    beforeEach(() => {
      content = readFileSync(coursePagePath, 'utf-8');
    });

    it('should include all required Course schema properties', () => {
      expect(content).toContain('name:');
      expect(content).toContain('description:');
      expect(content).toContain('provider:');
    });

    it('should include recommended properties', () => {
      expect(content).toContain('url:');
      expect(content).toContain('image:');
      expect(content).toContain('instructor:');
      expect(content).toContain('offers:');
    });

    it('should use correct @type for nested objects', () => {
      expect(content).toContain("'@type': 'Organization'");
      expect(content).toContain("'@type': 'Person'");
      expect(content).toContain("'@type': 'CourseInstance'");
      expect(content).toContain("'@type': 'Offer'");
    });
  });

  describe('Error Handling', () => {
    let content: string;

    beforeEach(() => {
      content = readFileSync(coursePagePath, 'utf-8');
    });

    it('should handle missing instructor avatar gracefully', () => {
      expect(content).toMatch(/instructorAvatar\?/);
    });

    it('should use spread operator for conditional rating', () => {
      expect(content).toContain('...(');
      expect(content).toContain('? {');
      expect(content).toContain('} : {})');
    });

    it('should fallback to description if longDescription missing', () => {
      expect(content).toMatch(/course\.longDescription\s*\|\|\s*course\.description/);
    });
  });

  describe('Code Quality', () => {
    let content: string;

    beforeEach(() => {
      content = readFileSync(coursePagePath, 'utf-8');
    });

    it('should have descriptive variable names', () => {
      expect(content).toContain('courseSchema');
      expect(content).toContain('courseUrl');
      expect(content).toContain('courseImageUrl');
      expect(content).toContain('siteUrl');
    });

    it('should have inline comments explaining T225', () => {
      expect(content).toMatch(/\/\/.*T225/);
    });

    it('should use const for immutable values', () => {
      expect(content).toMatch(/const\s+courseSchema/);
      expect(content).toMatch(/const\s+courseUrl/);
      expect(content).toMatch(/const\s+siteUrl/);
    });

    it('should properly format nested objects', () => {
      // Check for proper indentation and structure
      expect(content).toContain('provider: {');
      expect(content).toContain('instructor: {');
      expect(content).toContain('offers: {');
    });
  });

  describe('Performance', () => {
    let content: string;

    beforeEach(() => {
      content = readFileSync(coursePagePath, 'utf-8');
    });

    it('should generate schema only once per page load', () => {
      // Count actual schema generation calls (not imports)
      const schemaGenerationCount = (content.match(/generateCourseSchema\(/g) || []).length;
      expect(schemaGenerationCount).toBe(1);
    });

    it('should reuse siteUrl variable', () => {
      const siteUrlUsages = (content.match(/siteUrl/g) || []).length;
      expect(siteUrlUsages).toBeGreaterThan(1); // Defined once, used multiple times
    });
  });

  describe('Currency and Pricing', () => {
    let content: string;

    beforeEach(() => {
      content = readFileSync(coursePagePath, 'utf-8');
    });

    it('should use USD as currency', () => {
      expect(content).toContain("priceCurrency: 'USD'");
    });

    it('should convert cents to dollars', () => {
      expect(content).toMatch(/course\.price\s*\/\s*100/);
    });

    it('should format price with 2 decimal places', () => {
      expect(content).toMatch(/toFixed\(2\)/);
    });

    it('should include price in offers', () => {
      expect(content).toMatch(/offers:[\s\S]*price:/);
    });
  });

  describe('Organization Information', () => {
    let content: string;

    beforeEach(() => {
      content = readFileSync(coursePagePath, 'utf-8');
    });

    it('should use consistent organization name', () => {
      expect(content).toContain("name: 'Spirituality Platform'");
    });

    it('should include organization URL', () => {
      expect(content).toMatch(/provider:[\s\S]*url:\s*siteUrl/);
    });

    it('should set organization @type', () => {
      expect(content).toContain("'@type': 'Organization'");
    });
  });

  describe('Integration with Existing Code', () => {
    let content: string;

    beforeEach(() => {
      content = readFileSync(coursePagePath, 'utf-8');
    });

    it('should not interfere with existing course rendering', () => {
      expect(content).toContain('<div class="course-detail">');
    });

    it('should not modify existing BaseLayout props', () => {
      expect(content).toContain('title={course.title}');
      expect(content).toContain('description={course.description}');
      expect(content).toContain('keywords={course.tags.join');
      expect(content).toContain('ogImage={course.imageUrl}');
    });

    it('should maintain existing imports', () => {
      expect(content).toContain('import BaseLayout');
      expect(content).toContain('import VideoPlayer');
      expect(content).toContain('import ReviewForm');
    });

    it('should preserve course data fetching logic', () => {
      expect(content).toContain('getLocalizedCourseBySlug');
    });
  });
});
