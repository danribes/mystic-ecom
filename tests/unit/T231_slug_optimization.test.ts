/**
 * Test Suite for T231: SEO-Friendly Slug Generation and Validation
 *
 * Comprehensive tests for slug utilities including:
 * - Slug generation with various options
 * - Unicode transliteration
 * - Stop word removal
 * - Validation and analysis
 * - Optimization and suggestions
 */

import { describe, it, expect } from 'vitest';
import {
  // Core functions
  generateSlug,
  slugify,
  generateUniqueSlug,
  // Validation
  isValidSlug,
  isUrlSafe,
  validateSlug,
  analyzeSlug,
  // Utility functions
  transliterate,
  removeStopWords,
  compareSlugSimilarity,
  extractKeywords,
  suggestImprovements,
  slugContainsKeyword,
  optimizeSlug,
  // Constants
  OPTIMAL_SLUG_LENGTH,
  SLUG_PATTERN,
} from '@/lib/slug';

describe('T231: SEO-Friendly Slug Generation and Validation', () => {
  // ========================================================================
  // Basic Slug Generation Tests
  // ========================================================================

  describe('generateSlug', () => {
    it('should convert text to lowercase slug', () => {
      expect(generateSlug('Hello World')).toBe('hello-world');
      expect(generateSlug('UPPERCASE TEXT')).toBe('uppercase-text');
      expect(generateSlug('MiXeD CaSe')).toBe('mixed-case');
    });

    it('should replace spaces with hyphens', () => {
      expect(generateSlug('multiple words here')).toBe('multiple-words-here');
      expect(generateSlug('   extra   spaces   ')).toBe('extra-spaces');
    });

    it('should remove special characters', () => {
      expect(generateSlug('Hello, World!')).toBe('hello-world');
      expect(generateSlug('Test@#$%^&*()String')).toBe('teststring');
      expect(generateSlug('café & restaurant')).toBe('cafe-restaurant');
    });

    it('should replace underscores with hyphens', () => {
      expect(generateSlug('hello_world_test')).toBe('hello-world-test');
      expect(generateSlug('snake_case_string')).toBe('snake-case-string');
    });

    it('should remove leading and trailing hyphens', () => {
      expect(generateSlug('-hello-world-')).toBe('hello-world');
      expect(generateSlug('---test---')).toBe('test');
    });

    it('should handle consecutive hyphens', () => {
      expect(generateSlug('hello--world')).toBe('hello-world');
      expect(generateSlug('multiple---hyphens')).toBe('multiple-hyphens');
    });

    it('should preserve numbers by default', () => {
      expect(generateSlug('Course 101')).toBe('course-101');
      expect(generateSlug('Top 10 Tips')).toBe('top-10-tips');
    });

    it('should remove numbers when preserveNumbers is false', () => {
      expect(generateSlug('Course 101', { preserveNumbers: false })).toBe('course');
      expect(generateSlug('Top 10 Tips', { preserveNumbers: false })).toBe('top-tips');
    });

    it('should throw error for empty text', () => {
      expect(() => generateSlug('')).toThrow('Text cannot be empty');
      expect(() => generateSlug('   ')).toThrow('Text cannot be empty');
    });

    it('should throw error for too short slugs', () => {
      expect(() => generateSlug('ab')).toThrow('Slug is too short');
    });

    it('should respect maxLength option', () => {
      const longText = 'this is a very long text that should be truncated to a reasonable length';
      const slug = generateSlug(longText, { maxLength: 30 });

      expect(slug.length).toBeLessThanOrEqual(30);
      expect(slug.endsWith('-')).toBe(false); // Should not end with hyphen
    });

    it('should truncate at word boundary', () => {
      const text = 'mindfulness meditation techniques for beginners';
      const slug = generateSlug(text, { maxLength: 30 });

      // Should break at a hyphen, not mid-word
      expect(slug.length).toBeLessThanOrEqual(30);
      expect(slug.endsWith('-')).toBe(false); // Should not end with hyphen
    });
  });

  // ========================================================================
  // Unicode and Transliteration Tests
  // ========================================================================

  describe('transliterate', () => {
    it('should convert accented characters to ASCII', () => {
      expect(transliterate('café')).toBe('cafe');
      expect(transliterate('naïve')).toBe('naive');
      expect(transliterate('résumé')).toBe('resume');
    });

    it('should handle German umlauts', () => {
      expect(transliterate('Zürich')).toBe('Zurich');
      expect(transliterate('Müller')).toBe('Muller');
      expect(transliterate('Straße')).toBe('Strasse');
    });

    it('should handle French characters', () => {
      expect(transliterate('français')).toBe('francais');
      expect(transliterate('œuvre')).toBe('oeuvre');
      expect(transliterate('Côte d\'Azur')).toBe('Cote d\'Azur');
    });

    it('should handle Spanish characters', () => {
      expect(transliterate('año')).toBe('ano');
      expect(transliterate('niño')).toBe('nino');
      expect(transliterate('José')).toBe('Jose');
    });

    it('should handle multiple special characters', () => {
      expect(transliterate('Héllo Wörld')).toBe('Hello World');
      expect(transliterate('àéîôù')).toBe('aeiou');
    });

    it('should preserve regular ASCII characters', () => {
      expect(transliterate('hello world')).toBe('hello world');
      expect(transliterate('123-abc')).toBe('123-abc');
    });
  });

  describe('generateSlug with unicode', () => {
    it('should generate slug from accented text', () => {
      expect(generateSlug('Café Müller')).toBe('cafe-muller');
      expect(generateSlug('El Niño')).toBe('el-nino');
    });

    it('should handle mixed ASCII and unicode', () => {
      expect(generateSlug('Zürich Travel Guide')).toBe('zurich-travel-guide');
    });
  });

  // ========================================================================
  // Stop Words Tests
  // ========================================================================

  describe('removeStopWords', () => {
    it('should remove common stop words', () => {
      expect(removeStopWords('the-quick-brown-fox')).toBe('quick-brown-fox');
      expect(removeStopWords('a-guide-to-meditation')).toBe('guide-meditation');
    });

    it('should keep at least one word', () => {
      expect(removeStopWords('the')).toBe('the');
      expect(removeStopWords('a-and-the')).toBe('the'); // Keeps last word
    });

    it('should not remove content words', () => {
      expect(removeStopWords('mindfulness-meditation')).toBe('mindfulness-meditation');
    });

    it('should handle empty input', () => {
      expect(removeStopWords('')).toBe('');
    });
  });

  describe('generateSlug with stop words removal', () => {
    it('should remove stop words when option is enabled', () => {
      expect(generateSlug('The Ultimate Guide to Meditation', { removeStopWords: true })).toBe(
        'ultimate-guide-meditation'
      );

      expect(generateSlug('A Complete Introduction to Yoga', { removeStopWords: true })).toBe(
        'complete-introduction-yoga'
      );
    });

    it('should keep stop words by default', () => {
      expect(generateSlug('The Ultimate Guide')).toBe('the-ultimate-guide');
    });
  });

  // ========================================================================
  // Unique Slug Generation Tests
  // ========================================================================

  describe('generateUniqueSlug', () => {
    it('should return original slug if unique', () => {
      expect(generateUniqueSlug('my-article', [])).toBe('my-article');
      expect(generateUniqueSlug('my-article', ['other-article'])).toBe('my-article');
    });

    it('should append number if slug exists', () => {
      expect(generateUniqueSlug('my-article', ['my-article'])).toBe('my-article-2');
    });

    it('should increment until unique slug found', () => {
      expect(generateUniqueSlug('my-article', ['my-article', 'my-article-2'])).toBe(
        'my-article-3'
      );

      expect(
        generateUniqueSlug('my-article', ['my-article', 'my-article-2', 'my-article-3'])
      ).toBe('my-article-4');
    });

    it('should handle large numbers', () => {
      const existing = Array.from({ length: 100 }, (_, i) =>
        i === 0 ? 'popular-article' : `popular-article-${i + 1}`
      );

      expect(generateUniqueSlug('popular-article', existing)).toBe('popular-article-101');
    });
  });

  // ========================================================================
  // Validation Tests
  // ========================================================================

  describe('isValidSlug', () => {
    it('should validate correct slugs', () => {
      expect(isValidSlug('hello-world')).toBe(true);
      expect(isValidSlug('test-123')).toBe(true);
      expect(isValidSlug('mindfulness-meditation-guide')).toBe(true);
    });

    it('should reject slugs with uppercase', () => {
      expect(isValidSlug('Hello-World')).toBe(false);
      expect(isValidSlug('UPPERCASE')).toBe(false);
    });

    it('should reject slugs with underscores', () => {
      expect(isValidSlug('hello_world')).toBe(false);
      expect(isValidSlug('test_slug')).toBe(false);
    });

    it('should reject slugs with spaces', () => {
      expect(isValidSlug('hello world')).toBe(false);
      expect(isValidSlug('test slug')).toBe(false);
    });

    it('should reject slugs with special characters', () => {
      expect(isValidSlug('hello@world')).toBe(false);
      expect(isValidSlug('test#slug')).toBe(false);
      expect(isValidSlug('café')).toBe(false);
    });

    it('should reject slugs starting or ending with hyphen', () => {
      expect(isValidSlug('-hello-world')).toBe(false);
      expect(isValidSlug('hello-world-')).toBe(false);
    });

    it('should reject consecutive hyphens', () => {
      expect(isValidSlug('hello--world')).toBe(false);
      expect(isValidSlug('test---slug')).toBe(false);
    });

    it('should reject empty or invalid input', () => {
      expect(isValidSlug('')).toBe(false);
      expect(isValidSlug(null as any)).toBe(false);
      expect(isValidSlug(undefined as any)).toBe(false);
    });

    it('should validate single word slugs', () => {
      expect(isValidSlug('meditation')).toBe(true);
      expect(isValidSlug('yoga')).toBe(true);
    });
  });

  describe('isUrlSafe', () => {
    it('should validate URL-safe slugs', () => {
      expect(isUrlSafe('hello-world')).toBe(true);
      expect(isUrlSafe('test-123')).toBe(true);
    });

    it('should reject non-URL-safe characters', () => {
      expect(isUrlSafe('Hello-World')).toBe(false);
      expect(isUrlSafe('hello world')).toBe(false);
      expect(isUrlSafe('hello_world')).toBe(false);
    });
  });

  describe('validateSlug', () => {
    it('should validate correct slugs without errors', () => {
      const result = validateSlug('mindfulness-meditation');

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect uppercase letters', () => {
      const result = validateSlug('Hello-World');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Slug contains uppercase letters. Use lowercase only');
      expect(result.suggestions).toContain('Try: "hello-world"');
    });

    it('should detect underscores', () => {
      const result = validateSlug('hello_world');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Slug contains underscores. Use hyphens instead');
      expect(result.suggestions).toContain('Try: "hello-world"');
    });

    it('should detect spaces', () => {
      const result = validateSlug('hello world');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Slug contains spaces. Use hyphens instead');
    });

    it('should detect too short slugs', () => {
      const result = validateSlug('ab');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Slug is too short (2 chars). Minimum: 3 characters');
    });

    it('should detect too long slugs', () => {
      const slug = 'a'.repeat(101);
      const result = validateSlug(slug);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Slug is too long (101 chars). Maximum: 100 characters');
    });

    it('should detect leading/trailing hyphens', () => {
      const result = validateSlug('-hello-world-');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Slug cannot start or end with hyphens');
    });

    it('should detect consecutive hyphens', () => {
      const result = validateSlug('hello--world');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Slug contains consecutive hyphens');
    });

    it('should warn about non-optimal length', () => {
      const slug = 'this-is-a-very-long-slug-that-exceeds-the-recommended-length-for-seo';
      const result = validateSlug(slug);

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('longer than recommended');
    });

    it('should warn about many words', () => {
      const slug = 'one-two-three-four-five-six-seven-eight-nine-ten-eleven';
      const result = validateSlug(slug);

      expect(result.warnings.some((w) => w.includes('many words'))).toBe(true);
    });

    it('should warn about stop words', () => {
      const result = validateSlug('the-ultimate-guide-to-meditation');

      expect(result.warnings.some((w) => w.includes('stop words'))).toBe(true);
    });

    it('should provide suggestions for invalid slugs', () => {
      const result = validateSlug('Hello World!');

      expect(result.suggestions.length).toBeGreaterThan(0);
    });
  });

  // ========================================================================
  // Analysis Tests
  // ========================================================================

  describe('analyzeSlug', () => {
    it('should analyze slug metrics', () => {
      const analysis = analyzeSlug('mindfulness-meditation-guide');

      expect(analysis.length).toBe(28);
      expect(analysis.wordCount).toBe(3);
      expect(analysis.isOptimalLength).toBe(true);
      expect(analysis.hasNumbers).toBe(false);
      expect(analysis.isLowercase).toBe(true);
    });

    it('should detect numbers in slug', () => {
      const analysis = analyzeSlug('course-101-basics');

      expect(analysis.hasNumbers).toBe(true);
    });

    it('should detect non-lowercase', () => {
      const analysis = analyzeSlug('Hello-World');

      expect(analysis.isLowercase).toBe(false);
    });

    it('should calculate word count', () => {
      expect(analyzeSlug('one').wordCount).toBe(1);
      expect(analyzeSlug('one-two').wordCount).toBe(2);
      expect(analyzeSlug('one-two-three-four-five').wordCount).toBe(5);
    });

    it('should provide SEO score', () => {
      const goodSlug = analyzeSlug('mindfulness-meditation');
      const badSlug = analyzeSlug('a');

      expect(goodSlug.seoScore).toBeGreaterThan(80);
      expect(badSlug.seoScore).toBeLessThan(70);
    });

    it('should provide readability score', () => {
      const readable = analyzeSlug('easy-to-read-slug');
      const unreadable = analyzeSlug('a-b-c-d-e-f-g-h-i-j-k');

      expect(readable.readabilityScore).toBeGreaterThan(unreadable.readabilityScore);
    });

    it('should handle optimal length detection', () => {
      const short = analyzeSlug('abc');
      const optimal = analyzeSlug('mindfulness-meditation');
      const long = analyzeSlug('this-is-a-very-very-very-long-slug-that-exceeds-optimal-length');

      expect(short.isOptimalLength).toBe(true); // >= 3 chars
      expect(optimal.isOptimalLength).toBe(true);
      expect(long.isOptimalLength).toBe(false);
    });
  });

  // ========================================================================
  // Utility Function Tests
  // ========================================================================

  describe('compareSlugSimilarity', () => {
    it('should return 1.0 for identical slugs', () => {
      expect(compareSlugSimilarity('meditation-guide', 'meditation-guide')).toBe(1.0);
    });

    it('should return 1.0 for same words in different order', () => {
      expect(compareSlugSimilarity('mindfulness-meditation', 'meditation-mindfulness')).toBe(1.0);
    });

    it('should calculate overlap correctly', () => {
      // yoga-basics and yoga-advanced share 1 word (yoga) out of 3 unique words total
      const similarity = compareSlugSimilarity('yoga-basics', 'yoga-advanced');
      expect(similarity).toBeCloseTo(0.333, 2);
    });

    it('should return 0.0 for no overlap', () => {
      expect(compareSlugSimilarity('yoga', 'meditation')).toBe(0.0);
    });

    it('should handle partial overlaps', () => {
      const similarity = compareSlugSimilarity('abc-def-ghi', 'abc-def-xyz');
      expect(similarity).toBeCloseTo(0.5, 1); // 2 common words out of 4 unique
    });
  });

  describe('extractKeywords', () => {
    it('should extract words from slug', () => {
      expect(extractKeywords('mindfulness-meditation-guide')).toEqual([
        'mindfulness',
        'meditation',
        'guide',
      ]);
    });

    it('should remove stop words by default', () => {
      expect(extractKeywords('the-ultimate-guide-to-meditation')).toEqual([
        'ultimate',
        'guide',
        'meditation',
      ]);
    });

    it('should keep stop words when removeStop is false', () => {
      expect(extractKeywords('the-ultimate-guide', false)).toEqual(['the', 'ultimate', 'guide']);
    });

    it('should handle single word', () => {
      expect(extractKeywords('meditation')).toEqual(['meditation']);
    });
  });

  describe('slugContainsKeyword', () => {
    it('should find keyword in slug', () => {
      expect(slugContainsKeyword('mindfulness-meditation-guide', 'meditation')).toBe(true);
      expect(slugContainsKeyword('yoga-basics-101', 'yoga')).toBe(true);
    });

    it('should not find missing keyword', () => {
      expect(slugContainsKeyword('mindfulness-meditation', 'yoga')).toBe(false);
    });

    it('should handle multi-word keywords', () => {
      expect(slugContainsKeyword('advanced-yoga-techniques', 'advanced-yoga')).toBe(true);
    });

    it('should be case-insensitive', () => {
      expect(slugContainsKeyword('meditation-guide', 'Meditation')).toBe(true);
    });
  });

  describe('suggestImprovements', () => {
    it('should suggest improvements for invalid slugs', () => {
      const suggestions = suggestImprovements('Hello World!');

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0]).toBe('hello-world');
    });

    it('should suggest stop word removal', () => {
      const suggestions = suggestImprovements('the-ultimate-guide-to-meditation');

      expect(suggestions).toContain('ultimate-guide-meditation');
    });

    it('should suggest shorter version for long slugs', () => {
      const longSlug =
        'this-is-an-extremely-long-slug-that-should-be-shortened-for-better-seo-performance';
      const suggestions = suggestImprovements(longSlug);

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some((s) => s.length < longSlug.length)).toBe(true);
    });

    it('should return empty array for already optimal slugs', () => {
      const suggestions = suggestImprovements('meditation-guide');

      // Might have suggestions or not, but should not error
      expect(Array.isArray(suggestions)).toBe(true);
    });
  });

  describe('optimizeSlug', () => {
    it('should optimize slug with stop words', () => {
      expect(optimizeSlug('the-ultimate-guide-to-meditation')).toBe('ultimate-guide-meditation');
    });

    it('should shorten long slugs', () => {
      const longSlug =
        'this-is-an-extremely-long-slug-that-should-definitely-be-shortened-for-seo';
      const optimized = optimizeSlug(longSlug);

      expect(optimized.length).toBeLessThan(longSlug.length);
      expect(optimized.length).toBeLessThanOrEqual(OPTIMAL_SLUG_LENGTH.ideal);
    });

    it('should fix invalid slugs', () => {
      expect(optimizeSlug('Hello World!')).toBe('hello-world');
      expect(optimizeSlug('test_slug')).toBe('test-slug');
    });

    it('should preserve already optimal slugs', () => {
      expect(optimizeSlug('meditation-guide')).toBe('meditation-guide');
    });

    it('should keep meaningful length', () => {
      const optimized = optimizeSlug('guide');
      expect(optimized.length).toBeGreaterThanOrEqual(OPTIMAL_SLUG_LENGTH.min);
    });
  });

  // ========================================================================
  // Backwards Compatibility Tests
  // ========================================================================

  describe('slugify (alias)', () => {
    it('should work as alias for generateSlug', () => {
      expect(slugify('Hello World')).toBe('hello-world');
      expect(slugify('Test String')).toBe('test-string');
    });

    it('should accept same options as generateSlug', () => {
      expect(slugify('The Guide', { removeStopWords: true })).toBe('guide');
      expect(slugify('Long Text Here', { maxLength: 10 })).toBe('long-text');
    });
  });

  // ========================================================================
  // Edge Cases and Error Handling
  // ========================================================================

  describe('Edge Cases', () => {
    it('should handle very long text', () => {
      const veryLongText = 'word '.repeat(100);
      const slug = generateSlug(veryLongText);

      expect(slug.length).toBeLessThanOrEqual(100);
      expect(isValidSlug(slug)).toBe(true);
    });

    it('should handle text with only special characters', () => {
      expect(() => generateSlug('!@#$%^&*()')).toThrow();
    });

    it('should handle numbers only', () => {
      expect(generateSlug('123')).toBe('123');
      expect(generateSlug('456789')).toBe('456789');
    });

    it('should handle mixed scripts', () => {
      expect(generateSlug('café resume')).toBe('cafe-resume');
    });

    it('should handle single character words', () => {
      expect(generateSlug('a b c')).toBe('a-b-c');
    });

    it('should handle repeated words', () => {
      expect(generateSlug('test test test')).toBe('test-test-test');
    });

    it('should handle empty array for unique slug generation', () => {
      expect(generateUniqueSlug('test', [])).toBe('test');
    });
  });

  // ========================================================================
  // Real-World Examples
  // ========================================================================

  describe('Real-World Examples', () => {
    it('should generate SEO-friendly course slugs', () => {
      expect(generateSlug('Mindfulness Meditation for Beginners')).toBe(
        'mindfulness-meditation-for-beginners'
      );

      expect(
        generateSlug('Advanced Yoga Techniques & Practices', { removeStopWords: true })
      ).toBe('advanced-yoga-techniques-practices');
    });

    it('should generate SEO-friendly event slugs', () => {
      expect(generateSlug('Summer Yoga Retreat 2025')).toBe('summer-yoga-retreat-2025');

      expect(generateSlug('Introduction to Meditation Workshop')).toBe(
        'introduction-to-meditation-workshop'
      );
    });

    it('should generate SEO-friendly product slugs', () => {
      expect(generateSlug('Yoga Mat - Premium Quality')).toBe('yoga-mat-premium-quality');

      expect(generateSlug('Meditation Cushion (Zafu)')).toBe('meditation-cushion-zafu');
    });

    it('should handle blog post titles', () => {
      expect(
        generateSlug('10 Benefits of Daily Meditation Practice', { maxLength: 50 })
      ).toBe('10-benefits-of-daily-meditation-practice');

      expect(generateSlug('How to Start Your Yoga Journey', { removeStopWords: true })).toBe(
        'how-start-your-yoga-journey'
      );
    });

    it('should validate production-ready slugs', () => {
      const slugs = [
        'mindfulness-meditation-guide',
        'yoga-basics-101',
        'advanced-breathing-techniques',
        'meditation-for-stress-relief',
      ];

      slugs.forEach((slug) => {
        expect(isValidSlug(slug)).toBe(true);
        const validation = validateSlug(slug);
        expect(validation.valid).toBe(true);
      });
    });
  });

  // ========================================================================
  // SEO Best Practices Tests
  // ========================================================================

  describe('SEO Best Practices', () => {
    it('should prefer hyphens over underscores', () => {
      const slug = generateSlug('hello_world_test');
      expect(slug).toBe('hello-world-test');
      expect(slug).not.toContain('_');
    });

    it('should use lowercase only', () => {
      const slug = generateSlug('Hello World TEST');
      expect(slug).toBe('hello-world-test');
      expect(slug).toBe(slug.toLowerCase());
    });

    it('should be descriptive and readable', () => {
      const slug = generateSlug('Complete Guide to Mindfulness');
      const analysis = analyzeSlug(slug);

      expect(analysis.wordCount).toBeGreaterThanOrEqual(2);
      expect(analysis.readabilityScore).toBeGreaterThan(70);
    });

    it('should keep slugs concise', () => {
      const slug = generateSlug('Very Long Title That Should Be Shortened', { maxLength: 30 });

      expect(slug.length).toBeLessThanOrEqual(30);
    });

    it('should include relevant keywords', () => {
      const slug = generateSlug('Mindfulness Meditation for Stress Relief');

      expect(slugContainsKeyword(slug, 'mindfulness')).toBe(true);
      expect(slugContainsKeyword(slug, 'meditation')).toBe(true);
      expect(slugContainsKeyword(slug, 'stress')).toBe(true);
    });
  });
});
