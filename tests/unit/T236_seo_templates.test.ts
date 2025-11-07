/**
 * T236: SEO Templates Tests
 *
 * Comprehensive test suite for SEO template generation functions.
 * Tests all template types and utility functions.
 */

import { describe, it, expect } from 'vitest';
import {
  // Utility Functions
  truncate,
  optimizeTitle,
  optimizeDescription,
  formatPrice,
  formatDate,
  // Template Functions
  generateCourseTemplate,
  generateEventTemplate,
  generateProductTemplate,
  generateBlogTemplate,
  generatePageTemplate,
  generateHomepageTemplate,
  // Validation
  validateTemplate,
  // Constants
  SEO_LIMITS,
  DEFAULT_SITE_NAME,
} from '@/lib/seoTemplates';

// ============================================================================
// Utility Functions Tests
// ============================================================================

describe('T236: SEO Templates - Utility Functions', () => {
  describe('truncate', () => {
    it('should not truncate text shorter than max length', () => {
      const text = 'Short text';
      const result = truncate(text, 20);

      expect(result).toBe('Short text');
    });

    it('should truncate text at word boundary', () => {
      const text = 'This is a long text that needs to be truncated properly';
      const result = truncate(text, 30);

      expect(result).toContain('...');
      expect(result.length).toBeLessThanOrEqual(30);
      expect(result).toBe('This is a long text that...');
    });

    it('should handle text with no spaces', () => {
      const text = 'Verylongtextwithoutanyspaces';
      const result = truncate(text, 15);

      expect(result).toContain('...');
      expect(result.length).toBe(15);
    });

    it('should return exact text if equal to max length', () => {
      const text = 'Exactly twenty chars';
      const result = truncate(text, 20);

      expect(result).toBe('Exactly twenty chars');
    });
  });

  describe('optimizeTitle', () => {
    it('should add site name to title', () => {
      const title = 'Page Title';
      const result = optimizeTitle(title);

      expect(result).toContain(title);
      expect(result).toContain(DEFAULT_SITE_NAME);
      expect(result).toContain(' | ');
    });

    it('should not duplicate site name if already present', () => {
      const title = `Page Title | ${DEFAULT_SITE_NAME}`;
      const result = optimizeTitle(title);

      const occurrences = (result.match(new RegExp(DEFAULT_SITE_NAME, 'g')) || []).length;
      expect(occurrences).toBe(1);
    });

    it('should truncate long titles', () => {
      const longTitle = 'This is a very long page title that exceeds the maximum character limit';
      const result = optimizeTitle(longTitle);

      expect(result.length).toBeLessThanOrEqual(SEO_LIMITS.TITLE_MAX);
      expect(result).toContain(DEFAULT_SITE_NAME);
    });

    it('should work with custom site name', () => {
      const title = 'Page Title';
      const customSite = 'My Site';
      const result = optimizeTitle(title, customSite);

      expect(result).toContain(customSite);
      expect(result).toBe('Page Title | My Site');
    });

    it('should handle title exactly at limit', () => {
      // Create a title that with site name will be exactly at limit
      const title = 'A'.repeat(SEO_LIMITS.TITLE_MAX - DEFAULT_SITE_NAME.length - 3);
      const result = optimizeTitle(title);

      expect(result.length).toBeLessThanOrEqual(SEO_LIMITS.TITLE_MAX);
    });
  });

  describe('optimizeDescription', () => {
    it('should not truncate description shorter than max', () => {
      const desc = 'This is a good description that fits within limits.';
      const result = optimizeDescription(desc);

      expect(result).toBe(desc);
    });

    it('should truncate long descriptions', () => {
      const longDesc =
        'This is a very long description that exceeds the maximum character limit for SEO descriptions and needs to be truncated at an appropriate word boundary to ensure it displays properly in search results.';
      const result = optimizeDescription(longDesc);

      expect(result.length).toBeLessThanOrEqual(SEO_LIMITS.DESCRIPTION_MAX);
      expect(result).toContain('...');
    });

    it('should return exact text if at max length', () => {
      const desc = 'A'.repeat(SEO_LIMITS.DESCRIPTION_MAX);
      const result = optimizeDescription(desc);

      expect(result.length).toBe(SEO_LIMITS.DESCRIPTION_MAX);
    });
  });

  describe('formatPrice', () => {
    it('should format USD prices', () => {
      expect(formatPrice(29.99, 'USD')).toBe('$29.99');
      expect(formatPrice(0, 'USD')).toBe('Free');
      expect(formatPrice(100, 'USD')).toBe('$100.00');
    });

    it('should format EUR prices', () => {
      expect(formatPrice(29.99, 'EUR')).toBe('€29.99');
      expect(formatPrice(0, 'EUR')).toBe('Free');
    });

    it('should handle other currencies', () => {
      expect(formatPrice(29.99, 'GBP')).toBe('GBP29.99');
    });

    it('should default to USD', () => {
      expect(formatPrice(29.99)).toBe('$29.99');
    });

    it('should always return Free for zero price', () => {
      expect(formatPrice(0, 'USD')).toBe('Free');
      expect(formatPrice(0, 'EUR')).toBe('Free');
      expect(formatPrice(0, 'GBP')).toBe('Free');
    });
  });

  describe('formatDate', () => {
    it('should format ISO date to readable format', () => {
      const result = formatDate('2025-01-15');

      expect(result).toMatch(/Jan 15, 2025/);
    });

    it('should handle different date formats', () => {
      const result = formatDate('2025-12-25T00:00:00Z');

      expect(result).toMatch(/Dec 25, 2025/);
    });

    it('should return original string if invalid date', () => {
      const invalid = 'not a date';
      const result = formatDate(invalid);

      expect(result).toBe(invalid);
    });

    it('should handle already formatted dates', () => {
      const formatted = 'Jan 15, 2025';
      const result = formatDate(formatted);

      // Should either format it or return original
      expect(result).toBeTruthy();
    });
  });
});

// ============================================================================
// Template Functions Tests - Course
// ============================================================================

describe('T236: SEO Templates - Course Templates', () => {
  describe('generateCourseTemplate', () => {
    it('should generate basic course template', () => {
      const template = generateCourseTemplate({
        courseName: 'Mindfulness Meditation',
      });

      expect(template.title).toContain('Mindfulness Meditation');
      expect(template.title).toContain(DEFAULT_SITE_NAME);
      expect(template.title.length).toBeLessThanOrEqual(SEO_LIMITS.TITLE_MAX);
      expect(template.description).toContain('Learn Mindfulness Meditation');
    });

    it('should include instructor in description', () => {
      const template = generateCourseTemplate({
        courseName: 'Yoga Basics',
        instructor: 'Sarah Johnson',
      });

      expect(template.description).toContain('Sarah Johnson');
      expect(template.description).toContain('instructor');
    });

    it('should include level in title and description', () => {
      const template = generateCourseTemplate({
        courseName: 'Advanced Meditation',
        level: 'Advanced',
      });

      expect(template.title).toContain('Advanced');
      expect(template.description).toContain('Advanced level');
    });

    it('should include category in description', () => {
      const template = generateCourseTemplate({
        courseName: 'Meditation Course',
        category: 'Mindfulness',
        level: 'Beginner',
      });

      expect(template.description).toContain('Beginner level mindfulness course');
    });

    it('should mention free courses', () => {
      const template = generateCourseTemplate({
        courseName: 'Free Meditation',
        price: 0,
      });

      expect(template.description).toContain('Free');
    });

    it('should respect title length limits', () => {
      const template = generateCourseTemplate({
        courseName: 'Very Long Course Name That Might Exceed Character Limits',
      });

      expect(template.title.length).toBeLessThanOrEqual(SEO_LIMITS.TITLE_MAX);
    });

    it('should respect description length limits', () => {
      const template = generateCourseTemplate({
        courseName: 'Course',
        instructor: 'Very Long Instructor Name That Goes On',
        category: 'Very Specific Category Name',
        level: 'Beginner',
      });

      expect(template.description.length).toBeLessThanOrEqual(SEO_LIMITS.DESCRIPTION_MAX);
    });

    it('should work with custom site name', () => {
      const template = generateCourseTemplate(
        {
          courseName: 'Meditation',
        },
        'My Custom Site'
      );

      expect(template.title).toContain('My Custom Site');
    });
  });
});

// ============================================================================
// Template Functions Tests - Event
// ============================================================================

describe('T236: SEO Templates - Event Templates', () => {
  describe('generateEventTemplate', () => {
    it('should generate basic event template', () => {
      const template = generateEventTemplate({
        eventName: 'Meditation Retreat',
        date: '2025-01-15',
      });

      expect(template.title).toContain('Meditation Retreat');
      expect(template.title).toContain('Jan 15, 2025');
      expect(template.title).toContain(DEFAULT_SITE_NAME);
      expect(template.description).toContain('Join our Meditation Retreat');
    });

    it('should include location in description', () => {
      const template = generateEventTemplate({
        eventName: 'Workshop',
        date: '2025-02-01',
        location: 'Virtual',
      });

      expect(template.description).toContain('Virtual');
    });

    it('should include event type in description', () => {
      const template = generateEventTemplate({
        eventName: 'Meditation Session',
        date: '2025-03-15',
        type: 'Workshop',
      });

      expect(template.description).toContain('Workshop');
    });

    it('should mention free events', () => {
      const template = generateEventTemplate({
        eventName: 'Free Event',
        date: '2025-04-01',
        price: 0,
      });

      expect(template.description).toContain('Free');
    });

    it('should include ticket price', () => {
      const template = generateEventTemplate({
        eventName: 'Paid Event',
        date: '2025-05-01',
        price: 50,
      });

      expect(template.description).toContain('$50.00');
      expect(template.description).toContain('Tickets from');
    });

    it('should format dates correctly', () => {
      const template = generateEventTemplate({
        eventName: 'Event',
        date: '2025-12-25',
      });

      expect(template.title).toContain('Dec 25, 2025');
    });

    it('should respect title length limits', () => {
      const template = generateEventTemplate({
        eventName: 'Very Long Event Name That Might Exceed Character Limits for SEO',
        date: '2025-06-15',
      });

      expect(template.title.length).toBeLessThanOrEqual(SEO_LIMITS.TITLE_MAX);
    });

    it('should respect description length limits', () => {
      const template = generateEventTemplate({
        eventName: 'Event',
        date: '2025-07-01',
        location: 'Very Long Location Name',
        type: 'Very Specific Type',
      });

      expect(template.description.length).toBeLessThanOrEqual(SEO_LIMITS.DESCRIPTION_MAX);
    });
  });
});

// ============================================================================
// Template Functions Tests - Product
// ============================================================================

describe('T236: SEO Templates - Product Templates', () => {
  describe('generateProductTemplate', () => {
    it('should generate basic product template', () => {
      const template = generateProductTemplate({
        productName: 'Meditation Audio Pack',
      });

      expect(template.title).toContain('Meditation Audio Pack');
      expect(template.title).toContain(DEFAULT_SITE_NAME);
      expect(template.title.length).toBeLessThanOrEqual(SEO_LIMITS.TITLE_MAX);
      expect(template.description).toContain('Download Meditation Audio Pack');
    });

    it('should use category in title when provided', () => {
      const template = generateProductTemplate({
        productName: 'Audio Pack',
        category: 'Audio',
      });

      expect(template.title).toContain('Audio');
      expect(template.title).not.toContain('Digital Download');
    });

    it('should include format in description', () => {
      const template = generateProductTemplate({
        productName: 'Product',
        format: 'PDF',
      });

      expect(template.description).toContain('PDF');
      expect(template.description).toContain('format');
    });

    it('should mention free products', () => {
      const template = generateProductTemplate({
        productName: 'Free Guide',
        price: 0,
      });

      expect(template.description).toContain('Free');
    });

    it('should include price', () => {
      const template = generateProductTemplate({
        productName: 'Premium Product',
        price: 29.99,
      });

      expect(template.description).toContain('$29.99');
      expect(template.description).toContain('instant access');
    });

    it('should include format and category together', () => {
      const template = generateProductTemplate({
        productName: 'Product',
        format: 'MP3',
        category: 'Audio',
      });

      expect(template.description).toContain('MP3 format audio digital product');
    });

    it('should respect title length limits', () => {
      const template = generateProductTemplate({
        productName: 'Very Long Product Name That Might Exceed Character Limits for SEO Optimization',
      });

      expect(template.title.length).toBeLessThanOrEqual(SEO_LIMITS.TITLE_MAX);
    });

    it('should respect description length limits', () => {
      const template = generateProductTemplate({
        productName: 'Product',
        category: 'Very Long Category Name',
        format: 'Very Specific Format',
      });

      expect(template.description.length).toBeLessThanOrEqual(SEO_LIMITS.DESCRIPTION_MAX);
    });
  });
});

// ============================================================================
// Template Functions Tests - Blog
// ============================================================================

describe('T236: SEO Templates - Blog Templates', () => {
  describe('generateBlogTemplate', () => {
    it('should generate basic blog template', () => {
      const template = generateBlogTemplate({
        title: 'How to Meditate',
      });

      expect(template.title).toContain('How to Meditate');
      expect(template.title).toContain(DEFAULT_SITE_NAME);
      expect(template.description).toContain('Discover how to meditate');
    });

    it('should include category as guide in title', () => {
      const template = generateBlogTemplate({
        title: 'Meditation Tips',
        category: 'Mindfulness',
      });

      expect(template.title).toContain('Mindfulness Guide');
    });

    it('should include author in description', () => {
      const template = generateBlogTemplate({
        title: 'Blog Post',
        author: 'Jane Smith',
      });

      expect(template.description).toContain('Jane Smith');
    });

    it('should mention category in description', () => {
      const template = generateBlogTemplate({
        title: 'Post',
        category: 'Meditation',
      });

      expect(template.description).toContain('Comprehensive meditation guide');
    });

    it('should respect title length limits', () => {
      const template = generateBlogTemplate({
        title: 'Very Long Blog Post Title That Might Exceed Character Limits for SEO',
      });

      expect(template.title.length).toBeLessThanOrEqual(SEO_LIMITS.TITLE_MAX);
    });

    it('should respect description length limits', () => {
      const template = generateBlogTemplate({
        title: 'Post',
        author: 'Very Long Author Name Here',
        category: 'Very Specific Category',
      });

      expect(template.description.length).toBeLessThanOrEqual(SEO_LIMITS.DESCRIPTION_MAX);
    });
  });
});

// ============================================================================
// Template Functions Tests - Page
// ============================================================================

describe('T236: SEO Templates - Page Templates', () => {
  describe('generatePageTemplate', () => {
    it('should generate basic page template', () => {
      const template = generatePageTemplate({
        pageName: 'About Us',
      });

      expect(template.title).toContain('About Us');
      expect(template.title).toContain(DEFAULT_SITE_NAME);
      expect(template.description).toContain('About Us');
    });

    it('should include category in title', () => {
      const template = generatePageTemplate({
        pageName: 'Services',
        category: 'Offerings',
      });

      expect(template.title).toContain('Services - Offerings');
    });

    it('should include keywords in description', () => {
      const template = generatePageTemplate({
        pageName: 'Page',
        keywords: ['meditation', 'mindfulness', 'yoga'],
      });

      expect(template.description).toContain('meditation');
      expect(template.description).toContain('mindfulness');
      expect(template.description).toContain('yoga');
    });

    it('should limit keywords to 3', () => {
      const template = generatePageTemplate({
        pageName: 'Page',
        keywords: ['one', 'two', 'three', 'four', 'five'],
      });

      expect(template.description).toContain('one');
      expect(template.description).toContain('two');
      expect(template.description).toContain('three');
      expect(template.description).not.toContain('four');
    });

    it('should respect title length limits', () => {
      const template = generatePageTemplate({
        pageName: 'Very Long Page Name That Might Exceed Character Limits',
      });

      expect(template.title.length).toBeLessThanOrEqual(SEO_LIMITS.TITLE_MAX);
    });

    it('should respect description length limits', () => {
      const template = generatePageTemplate({
        pageName: 'Page',
        keywords: ['very', 'long', 'list', 'of', 'keywords'],
      });

      expect(template.description.length).toBeLessThanOrEqual(SEO_LIMITS.DESCRIPTION_MAX);
    });
  });
});

// ============================================================================
// Template Functions Tests - Homepage
// ============================================================================

describe('T236: SEO Templates - Homepage Templates', () => {
  describe('generateHomepageTemplate', () => {
    it('should generate default homepage template', () => {
      const template = generateHomepageTemplate();

      expect(template.title).toBe(DEFAULT_SITE_NAME);
      expect(template.description).toContain('Discover spiritual growth');
    });

    it('should use custom description if provided', () => {
      const customDesc = 'Custom homepage description';
      const template = generateHomepageTemplate(customDesc);

      expect(template.description).toBe(customDesc);
    });

    it('should use custom site name', () => {
      const template = generateHomepageTemplate(undefined, 'My Site');

      expect(template.title).toBe('My Site');
    });
  });
});

// ============================================================================
// Validation Tests
// ============================================================================

describe('T236: SEO Templates - Validation', () => {
  describe('validateTemplate', () => {
    it('should pass for valid template', () => {
      const template = {
        title: 'Good Page Title | Spirituality Platform',
        description:
          'This is a good description that is within the character limits and provides value to users searching for this content.',
      };

      const result = validateTemplate(template);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it('should warn for title too short', () => {
      const template = {
        title: 'Short',
        description: 'Valid description that is long enough to meet the minimum requirements.',
      };

      const result = validateTemplate(template);

      expect(result.isValid).toBe(false);
      expect(result.warnings.some((w) => w.includes('Title too short'))).toBe(true);
    });

    it('should warn for title too long', () => {
      const template = {
        title: 'This is a very long title that exceeds the maximum character limit',
        description: 'Valid description.',
      };

      const result = validateTemplate(template);

      expect(result.isValid).toBe(false);
      expect(result.warnings.some((w) => w.includes('Title too long'))).toBe(true);
    });

    it('should warn for description too short', () => {
      const template = {
        title: 'Valid Title | Spirituality Platform',
        description: 'Too short',
      };

      const result = validateTemplate(template);

      expect(result.isValid).toBe(false);
      expect(result.warnings.some((w) => w.includes('Description too short'))).toBe(true);
    });

    it('should warn for description too long', () => {
      const template = {
        title: 'Valid Title | Spirituality Platform',
        description:
          'This is a very long description that exceeds the maximum character limit for SEO descriptions and will be truncated by search engines in search results which is not ideal for click through rates.',
      };

      const result = validateTemplate(template);

      expect(result.isValid).toBe(false);
      expect(result.warnings.some((w) => w.includes('Description too long'))).toBe(true);
    });

    it('should warn for missing site name separator', () => {
      const template = {
        title: 'Title Without Site Name',
        description: 'Valid description that is long enough to meet the minimum requirements.',
      };

      const result = validateTemplate(template);

      expect(result.isValid).toBe(false);
      expect(result.warnings.some((w) => w.includes('site name'))).toBe(true);
    });

    it('should accept title with site name but no separator if site name is included', () => {
      const template = {
        title: 'Welcome to Spirituality Platform',
        description: 'Valid description that is long enough to meet the minimum requirements.',
      };

      const result = validateTemplate(template);

      expect(result.isValid).toBe(true);
    });
  });
});

// ============================================================================
// Constants Tests
// ============================================================================

describe('T236: SEO Templates - Constants', () => {
  it('should have correct SEO limits', () => {
    expect(SEO_LIMITS.TITLE_MIN).toBe(30);
    expect(SEO_LIMITS.TITLE_MAX).toBe(60);
    expect(SEO_LIMITS.TITLE_IDEAL).toBe(55);
    expect(SEO_LIMITS.DESCRIPTION_MIN).toBe(50);
    expect(SEO_LIMITS.DESCRIPTION_MAX).toBe(160);
    expect(SEO_LIMITS.DESCRIPTION_IDEAL).toBe(155);
  });

  it('should have default site name', () => {
    expect(DEFAULT_SITE_NAME).toBe('Spirituality Platform');
  });
});

// ============================================================================
// Integration Tests
// ============================================================================

describe('T236: SEO Templates - Integration', () => {
  it('should generate consistent results across multiple calls', () => {
    const data = {
      courseName: 'Test Course',
      instructor: 'John Doe',
    };

    const template1 = generateCourseTemplate(data);
    const template2 = generateCourseTemplate(data);

    expect(template1.title).toBe(template2.title);
    expect(template1.description).toBe(template2.description);
  });

  it('should handle all template types without errors', () => {
    expect(() => generateCourseTemplate({ courseName: 'Course' })).not.toThrow();
    expect(() => generateEventTemplate({ eventName: 'Event', date: '2025-01-01' })).not.toThrow();
    expect(() => generateProductTemplate({ productName: 'Product' })).not.toThrow();
    expect(() => generateBlogTemplate({ title: 'Blog Post' })).not.toThrow();
    expect(() => generatePageTemplate({ pageName: 'Page' })).not.toThrow();
    expect(() => generateHomepageTemplate()).not.toThrow();
  });

  it('should all templates pass validation when using reasonable data', () => {
    const courseTemplate = generateCourseTemplate({ courseName: 'Meditation Course' });
    const eventTemplate = generateEventTemplate({ eventName: 'Workshop', date: '2025-01-15' });
    const productTemplate = generateProductTemplate({ productName: 'Audio Pack' });
    const blogTemplate = generateBlogTemplate({ title: 'How to Meditate' });
    const pageTemplate = generatePageTemplate({ pageName: 'About Us' });

    expect(validateTemplate(courseTemplate).isValid).toBe(true);
    expect(validateTemplate(eventTemplate).isValid).toBe(true);
    expect(validateTemplate(productTemplate).isValid).toBe(true);
    expect(validateTemplate(blogTemplate).isValid).toBe(true);
    expect(validateTemplate(pageTemplate).isValid).toBe(true);
  });
});
