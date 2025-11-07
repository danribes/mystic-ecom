/**
 * Test Suite for T232: Breadcrumb Generation and Structured Data
 *
 * Comprehensive tests for breadcrumb utilities including:
 * - URL parsing and segment extraction
 * - Breadcrumb generation from paths
 * - Label normalization and custom labels
 * - Structured data conversion
 * - Edge cases and real-world scenarios
 */

import { describe, it, expect } from 'vitest';
import {
  // Utility functions
  normalizeSegment,
  shouldExcludeSegment,
  getSegmentLabel,
  parsePathname,
  buildUrl,
  // Main functions
  generateBreadcrumbs,
  breadcrumbsToSchemaItems,
  generateBreadcrumbsWithSchema,
  getCurrentPageLabel,
  // Constants
  DEFAULT_SEGMENT_LABELS,
  EXCLUDED_SEGMENTS,
} from '@/lib/breadcrumbs';

describe('T232: Breadcrumb Generation and Structured Data', () => {
  const baseUrl = 'https://example.com';

  // ========================================================================
  // Utility Function Tests
  // ========================================================================

  describe('normalizeSegment', () => {
    it('should convert hyphenated segments to title case', () => {
      expect(normalizeSegment('my-course')).toBe('My Course');
      expect(normalizeSegment('advanced-yoga-techniques')).toBe('Advanced Yoga Techniques');
    });

    it('should convert underscored segments to title case', () => {
      expect(normalizeSegment('my_course')).toBe('My Course');
      expect(normalizeSegment('user_profile')).toBe('User Profile');
    });

    it('should handle mixed separators', () => {
      expect(normalizeSegment('my-course_name')).toBe('My Course Name');
    });

    it('should capitalize each word', () => {
      expect(normalizeSegment('the-quick-brown-fox')).toBe('The Quick Brown Fox');
    });

    it('should handle single words', () => {
      expect(normalizeSegment('courses')).toBe('Courses');
      expect(normalizeSegment('EVENTS')).toBe('Events');
    });

    it('should handle numbers', () => {
      expect(normalizeSegment('course-101')).toBe('Course 101');
      expect(normalizeSegment('level-2-advanced')).toBe('Level 2 Advanced');
    });

    it('should return empty string for empty input', () => {
      expect(normalizeSegment('')).toBe('');
      expect(normalizeSegment('   ')).toBe('');
    });
  });

  describe('shouldExcludeSegment', () => {
    it('should exclude empty segments', () => {
      expect(shouldExcludeSegment('')).toBe(true);
      expect(shouldExcludeSegment('   ')).toBe(true);
    });

    it('should exclude undefined/null strings', () => {
      expect(shouldExcludeSegment('undefined')).toBe(true);
      expect(shouldExcludeSegment('null')).toBe(true);
    });

    it('should exclude system paths', () => {
      expect(shouldExcludeSegment('api')).toBe(true);
      expect(shouldExcludeSegment('_next')).toBe(true);
      expect(shouldExcludeSegment('_astro')).toBe(true);
    });

    it('should not exclude valid segments', () => {
      expect(shouldExcludeSegment('courses')).toBe(false);
      expect(shouldExcludeSegment('my-course')).toBe(false);
      expect(shouldExcludeSegment('123')).toBe(false);
    });
  });

  describe('getSegmentLabel', () => {
    it('should return custom label if provided', () => {
      const customLabels = { courses: 'All Courses' };
      expect(getSegmentLabel('courses', customLabels)).toBe('All Courses');
    });

    it('should return default label if available', () => {
      expect(getSegmentLabel('courses')).toBe('Courses');
      expect(getSegmentLabel('events')).toBe('Events');
      expect(getSegmentLabel('products')).toBe('Products');
    });

    it('should normalize segment if no label found', () => {
      expect(getSegmentLabel('my-custom-page')).toBe('My Custom Page');
    });

    it('should prioritize custom over default labels', () => {
      const customLabels = { courses: 'Training Programs' };
      expect(getSegmentLabel('courses', customLabels)).toBe('Training Programs');
    });
  });

  describe('parsePathname', () => {
    it('should parse simple paths', () => {
      expect(parsePathname('/courses')).toEqual(['courses']);
      expect(parsePathname('/courses/meditation')).toEqual(['courses', 'meditation']);
    });

    it('should handle leading/trailing slashes', () => {
      expect(parsePathname('/courses/')).toEqual(['courses']);
      expect(parsePathname('courses')).toEqual(['courses']);
      expect(parsePathname('/courses/meditation/')).toEqual(['courses', 'meditation']);
    });

    it('should return empty array for root path', () => {
      expect(parsePathname('/')).toEqual([]);
      expect(parsePathname('')).toEqual([]);
    });

    it('should filter excluded segments', () => {
      expect(parsePathname('/api/courses')).toEqual(['courses']);
      expect(parsePathname('/courses//meditation')).toEqual(['courses', 'meditation']);
    });

    it('should handle complex paths', () => {
      expect(parsePathname('/courses/meditation/advanced')).toEqual([
        'courses',
        'meditation',
        'advanced',
      ]);
    });
  });

  describe('buildUrl', () => {
    it('should build URL from base and segments', () => {
      expect(buildUrl(baseUrl, ['courses'])).toBe('https://example.com/courses');
      expect(buildUrl(baseUrl, ['courses', 'meditation'])).toBe(
        'https://example.com/courses/meditation'
      );
    });

    it('should handle base URL with trailing slash', () => {
      expect(buildUrl('https://example.com/', ['courses'])).toBe('https://example.com/courses');
    });

    it('should handle empty segments', () => {
      expect(buildUrl(baseUrl, [])).toBe('https://example.com');
    });

    it('should handle multiple segments', () => {
      expect(buildUrl(baseUrl, ['courses', 'meditation', 'basics'])).toBe(
        'https://example.com/courses/meditation/basics'
      );
    });
  });

  // ========================================================================
  // Main Breadcrumb Generation Tests
  // ========================================================================

  describe('generateBreadcrumbs', () => {
    it('should generate breadcrumbs for simple path', () => {
      const breadcrumbs = generateBreadcrumbs('/courses', { baseUrl });

      expect(breadcrumbs).toHaveLength(2);
      expect(breadcrumbs[0]).toMatchObject({
        name: 'Home',
        url: baseUrl,
        isCurrent: false,
        position: 1,
      });
      expect(breadcrumbs[1]).toMatchObject({
        name: 'Courses',
        url: `${baseUrl}/courses`,
        isCurrent: true,
        position: 2,
      });
    });

    it('should generate breadcrumbs for nested path', () => {
      const breadcrumbs = generateBreadcrumbs('/courses/meditation', { baseUrl });

      expect(breadcrumbs).toHaveLength(3);
      expect(breadcrumbs[0].name).toBe('Home');
      expect(breadcrumbs[1].name).toBe('Courses');
      expect(breadcrumbs[2].name).toBe('Meditation');
      expect(breadcrumbs[2].isCurrent).toBe(true);
    });

    it('should generate breadcrumbs for deep path', () => {
      const breadcrumbs = generateBreadcrumbs('/courses/meditation/advanced', { baseUrl });

      expect(breadcrumbs).toHaveLength(4);
      expect(breadcrumbs.map(b => b.name)).toEqual(['Home', 'Courses', 'Meditation', 'Advanced']);
    });

    it('should use custom labels', () => {
      const customLabels = {
        courses: 'All Courses',
        meditation: 'Meditation Programs',
      };
      const breadcrumbs = generateBreadcrumbs('/courses/meditation', { baseUrl, customLabels });

      expect(breadcrumbs[1].name).toBe('All Courses');
      expect(breadcrumbs[2].name).toBe('Meditation Programs');
    });

    it('should use custom home label', () => {
      const breadcrumbs = generateBreadcrumbs('/courses', {
        baseUrl,
        homeLabel: 'Homepage',
      });

      expect(breadcrumbs[0].name).toBe('Homepage');
    });

    it('should handle root path', () => {
      const breadcrumbs = generateBreadcrumbs('/', { baseUrl });

      expect(breadcrumbs).toHaveLength(1);
      expect(breadcrumbs[0]).toMatchObject({
        name: 'Home',
        url: baseUrl,
        isCurrent: true,
        position: 1,
      });
    });

    it('should exclude home when includeHome is false', () => {
      const breadcrumbs = generateBreadcrumbs('/courses', {
        baseUrl,
        includeHome: false,
      });

      expect(breadcrumbs).toHaveLength(1);
      expect(breadcrumbs[0].name).toBe('Courses');
    });

    it('should normalize slug-based paths', () => {
      const breadcrumbs = generateBreadcrumbs('/courses/mindfulness-meditation-basics', {
        baseUrl,
      });

      expect(breadcrumbs[2].name).toBe('Mindfulness Meditation Basics');
    });

    it('should set correct positions', () => {
      const breadcrumbs = generateBreadcrumbs('/courses/meditation/advanced', { baseUrl });

      breadcrumbs.forEach((breadcrumb, index) => {
        expect(breadcrumb.position).toBe(index + 1);
      });
    });

    it('should mark only last item as current', () => {
      const breadcrumbs = generateBreadcrumbs('/courses/meditation/advanced', { baseUrl });

      expect(breadcrumbs[0].isCurrent).toBe(false);
      expect(breadcrumbs[1].isCurrent).toBe(false);
      expect(breadcrumbs[2].isCurrent).toBe(false);
      expect(breadcrumbs[3].isCurrent).toBe(true);
    });

    it('should respect maxItems limit', () => {
      const breadcrumbs = generateBreadcrumbs('/courses/meditation/advanced/level-2', {
        baseUrl,
        maxItems: 3,
      });

      expect(breadcrumbs).toHaveLength(3);
      expect(breadcrumbs[0].name).toBe('Home');
      expect(breadcrumbs[breadcrumbs.length - 1].name).toBe('Level 2');
    });

    it('should handle maxItems = 2 (home and current)', () => {
      const breadcrumbs = generateBreadcrumbs('/courses/meditation/advanced', {
        baseUrl,
        maxItems: 2,
      });

      expect(breadcrumbs).toHaveLength(2);
      expect(breadcrumbs[0].name).toBe('Home');
      expect(breadcrumbs[1].name).toBe('Advanced');
    });
  });

  // ========================================================================
  // Schema Conversion Tests
  // ========================================================================

  describe('breadcrumbsToSchemaItems', () => {
    it('should convert breadcrumbs to schema items', () => {
      const breadcrumbs = generateBreadcrumbs('/courses/meditation', { baseUrl });
      const schemaItems = breadcrumbsToSchemaItems(breadcrumbs);

      expect(schemaItems).toHaveLength(3);
      expect(schemaItems[0]).toEqual({
        name: 'Home',
        url: baseUrl,
      });
      expect(schemaItems[1]).toEqual({
        name: 'Courses',
        url: `${baseUrl}/courses`,
      });
      expect(schemaItems[2]).toEqual({
        name: 'Meditation',
        url: `${baseUrl}/courses/meditation`,
      });
    });

    it('should preserve name and url properties only', () => {
      const breadcrumbs = generateBreadcrumbs('/courses', { baseUrl });
      const schemaItems = breadcrumbsToSchemaItems(breadcrumbs);

      schemaItems.forEach(item => {
        expect(item).toHaveProperty('name');
        expect(item).toHaveProperty('url');
        expect(item).not.toHaveProperty('isCurrent');
        expect(item).not.toHaveProperty('position');
      });
    });
  });

  describe('generateBreadcrumbsWithSchema', () => {
    it('should return both breadcrumbs and schema items', () => {
      const result = generateBreadcrumbsWithSchema('/courses/meditation', { baseUrl });

      expect(result).toHaveProperty('breadcrumbs');
      expect(result).toHaveProperty('schemaItems');
      expect(result.breadcrumbs).toHaveLength(3);
      expect(result.schemaItems).toHaveLength(3);
    });

    it('should have matching data in both outputs', () => {
      const result = generateBreadcrumbsWithSchema('/courses', { baseUrl });

      expect(result.breadcrumbs[0].name).toBe(result.schemaItems[0].name);
      expect(result.breadcrumbs[0].url).toBe(result.schemaItems[0].url);
      expect(result.breadcrumbs[1].name).toBe(result.schemaItems[1].name);
      expect(result.breadcrumbs[1].url).toBe(result.schemaItems[1].url);
    });
  });

  // ========================================================================
  // Helper Function Tests
  // ========================================================================

  describe('getCurrentPageLabel', () => {
    it('should return current page label', () => {
      expect(getCurrentPageLabel('/courses/meditation', { baseUrl })).toBe('Meditation');
      expect(getCurrentPageLabel('/courses', { baseUrl })).toBe('Courses');
    });

    it('should return home label for root path', () => {
      expect(getCurrentPageLabel('/', { baseUrl })).toBe('Home');
      expect(getCurrentPageLabel('', { baseUrl })).toBe('Home');
    });

    it('should use custom home label', () => {
      expect(getCurrentPageLabel('/', { baseUrl, homeLabel: 'Homepage' })).toBe('Homepage');
    });

    it('should handle custom labels', () => {
      expect(
        getCurrentPageLabel('/courses/meditation', {
          baseUrl,
          customLabels: { meditation: 'Meditation Programs' },
        })
      ).toBe('Meditation Programs');
    });
  });

  // ========================================================================
  // Real-World Scenarios
  // ========================================================================

  describe('Real-World Scenarios', () => {
    it('should generate breadcrumbs for course detail page', () => {
      const breadcrumbs = generateBreadcrumbs('/courses/mindfulness-meditation-basics', {
        baseUrl,
        customLabels: {
          'mindfulness-meditation-basics': 'Mindfulness Meditation for Beginners',
        },
      });

      expect(breadcrumbs).toHaveLength(3);
      expect(breadcrumbs[2].name).toBe('Mindfulness Meditation for Beginners');
    });

    it('should generate breadcrumbs for event detail page', () => {
      const breadcrumbs = generateBreadcrumbs('/events/summer-yoga-retreat-2025', {
        baseUrl,
        customLabels: {
          'summer-yoga-retreat-2025': 'Summer Yoga Retreat 2025',
        },
      });

      expect(breadcrumbs[1].name).toBe('Events');
      expect(breadcrumbs[2].name).toBe('Summer Yoga Retreat 2025');
    });

    it('should generate breadcrumbs for product detail page', () => {
      const breadcrumbs = generateBreadcrumbs('/products/yoga-mat-premium', {
        baseUrl,
        customLabels: {
          'yoga-mat-premium': 'Premium Yoga Mat',
        },
      });

      expect(breadcrumbs[1].name).toBe('Products');
      expect(breadcrumbs[2].name).toBe('Premium Yoga Mat');
    });

    it('should generate breadcrumbs for blog post', () => {
      const breadcrumbs = generateBreadcrumbs('/blog/meditation-tips-for-beginners', {
        baseUrl,
      });

      expect(breadcrumbs[1].name).toBe('Blog');
      expect(breadcrumbs[2].name).toBe('Meditation Tips For Beginners');
    });

    it('should generate breadcrumbs for user profile', () => {
      const breadcrumbs = generateBreadcrumbs('/account/profile', { baseUrl });

      expect(breadcrumbs[1].name).toBe('Account');
      expect(breadcrumbs[2].name).toBe('Profile');
    });

    it('should generate breadcrumbs for nested admin page', () => {
      const breadcrumbs = generateBreadcrumbs('/admin/courses/edit', {
        baseUrl,
        customLabels: {
          admin: 'Administration',
        },
      });

      expect(breadcrumbs[1].name).toBe('Administration');
      expect(breadcrumbs[2].name).toBe('Courses');
      expect(breadcrumbs[3].name).toBe('Edit');
    });
  });

  // ========================================================================
  // Edge Cases
  // ========================================================================

  describe('Edge Cases', () => {
    it('should handle paths with trailing slashes', () => {
      const breadcrumbs1 = generateBreadcrumbs('/courses/', { baseUrl });
      const breadcrumbs2 = generateBreadcrumbs('/courses', { baseUrl });

      expect(breadcrumbs1).toEqual(breadcrumbs2);
    });

    it('should handle paths with multiple slashes', () => {
      const breadcrumbs = generateBreadcrumbs('/courses//meditation', { baseUrl });

      expect(breadcrumbs).toHaveLength(3);
      expect(breadcrumbs.map(b => b.name)).toEqual(['Home', 'Courses', 'Meditation']);
    });

    it('should handle paths with special characters in segment', () => {
      const breadcrumbs = generateBreadcrumbs('/courses/meditation-101', { baseUrl });

      expect(breadcrumbs[2].name).toBe('Meditation 101');
    });

    it('should handle very long paths', () => {
      const breadcrumbs = generateBreadcrumbs('/a/b/c/d/e/f/g/h', { baseUrl });

      expect(breadcrumbs).toHaveLength(9); // home + 8 segments
    });

    it('should handle paths with numbers only', () => {
      const breadcrumbs = generateBreadcrumbs('/courses/123', { baseUrl });

      expect(breadcrumbs[2].name).toBe('123');
    });

    it('should handle empty base URL', () => {
      const breadcrumbs = generateBreadcrumbs('/courses', { baseUrl: '' });

      expect(breadcrumbs[0].url).toBe('/');
      expect(breadcrumbs[1].url).toBe('/courses');
    });

    it('should handle maxItems larger than actual breadcrumbs', () => {
      const breadcrumbs = generateBreadcrumbs('/courses', {
        baseUrl,
        maxItems: 10,
      });

      expect(breadcrumbs).toHaveLength(2); // Not padded to 10
    });

    it('should handle maxItems of 1 (only current page)', () => {
      const breadcrumbs = generateBreadcrumbs('/courses/meditation', {
        baseUrl,
        maxItems: 2,
      });

      expect(breadcrumbs).toHaveLength(2);
      expect(breadcrumbs[0].name).toBe('Home');
      expect(breadcrumbs[1].name).toBe('Meditation');
    });
  });

  // ========================================================================
  // Constants Tests
  // ========================================================================

  describe('Constants', () => {
    it('should have default segment labels', () => {
      expect(DEFAULT_SEGMENT_LABELS).toHaveProperty('courses');
      expect(DEFAULT_SEGMENT_LABELS).toHaveProperty('events');
      expect(DEFAULT_SEGMENT_LABELS).toHaveProperty('products');
      expect(DEFAULT_SEGMENT_LABELS.courses).toBe('Courses');
    });

    it('should have excluded segments', () => {
      expect(EXCLUDED_SEGMENTS.has('api')).toBe(true);
      expect(EXCLUDED_SEGMENTS.has('_next')).toBe(true);
      expect(EXCLUDED_SEGMENTS.has('_astro')).toBe(true);
    });
  });

  // ========================================================================
  // Integration Tests
  // ========================================================================

  describe('Integration Tests', () => {
    it('should work end-to-end for typical course page', () => {
      const path = '/courses/meditation-basics';
      const options = {
        baseUrl: 'https://example.com',
        customLabels: {
          'meditation-basics': 'Meditation for Beginners',
        },
      };

      const { breadcrumbs, schemaItems } = generateBreadcrumbsWithSchema(path, options);

      // Check breadcrumbs
      expect(breadcrumbs).toHaveLength(3);
      expect(breadcrumbs[0].name).toBe('Home');
      expect(breadcrumbs[1].name).toBe('Courses');
      expect(breadcrumbs[2].name).toBe('Meditation for Beginners');
      expect(breadcrumbs[2].isCurrent).toBe(true);

      // Check schema items
      expect(schemaItems).toHaveLength(3);
      expect(schemaItems[2].name).toBe('Meditation for Beginners');
      expect(schemaItems[2].url).toBe('https://example.com/courses/meditation-basics');
    });

    it('should generate valid structured data for search engines', () => {
      const { schemaItems } = generateBreadcrumbsWithSchema('/courses/meditation', { baseUrl });

      // All items should have name and url
      schemaItems.forEach(item => {
        expect(item.name).toBeTruthy();
        expect(item.url).toBeTruthy();
      });

      // URLs should be absolute
      schemaItems.forEach(item => {
        expect(item.url).toMatch(/^https?:\/\//);
      });
    });
  });
});
