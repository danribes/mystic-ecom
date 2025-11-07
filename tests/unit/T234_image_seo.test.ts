/**
 * T234: Image SEO Tests
 *
 * Tests for image SEO validation utilities including:
 * - Alt text validation
 * - File name validation
 * - Complete SEO analysis
 */

import { describe, it, expect } from 'vitest';
import {
  // Alt text functions
  isDecorativeImage,
  isAltTextTooShort,
  isAltTextTooLong,
  hasRedundantPrefix,
  isFileName,
  calculateAltTextQuality,
  validateAltText,

  // File name functions
  isDescriptiveFileName,
  usesHyphens,
  isLowercase,
  extractKeywords,
  validateFileName,

  // Size functions
  isFileSizeOptimized,
  getRecommendedFileSize,
  formatFileSize,

  // Complete analysis
  analyzeImageSEO,
  generateAltFromFileName,

  // Constants
  ALT_TEXT_LENGTH,
  MAX_FILE_SIZES,
} from '@/lib/imageSEO';

describe('T234: Image SEO Validation', () => {
  // ============================================================================
  // Alt Text Validation Tests
  // ============================================================================

  describe('isDecorativeImage', () => {
    it('should return true for empty alt text', () => {
      expect(isDecorativeImage('')).toBe(true);
      expect(isDecorativeImage('   ')).toBe(true);
    });

    it('should return true for explicitly decorative keywords', () => {
      expect(isDecorativeImage('decorative')).toBe(true);
      expect(isDecorativeImage('Decorative')).toBe(true);
      expect(isDecorativeImage('decoration')).toBe(true);
      expect(isDecorativeImage('spacer')).toBe(true);
    });

    it('should return false for descriptive alt text', () => {
      expect(isDecorativeImage('A beautiful sunset')).toBe(false);
      expect(isDecorativeImage('Meditation room with candles')).toBe(false);
    });
  });

  describe('isAltTextTooShort', () => {
    it('should return true for very short alt text', () => {
      expect(isAltTextTooShort('img')).toBe(true);
      expect(isAltTextTooShort('photo')).toBe(true);
      expect(isAltTextTooShort('test')).toBe(true);
    });

    it('should return false for adequately long alt text', () => {
      expect(isAltTextTooShort('Meditation room')).toBe(false);
      expect(isAltTextTooShort('A peaceful meditation space')).toBe(false);
    });
  });

  describe('isAltTextTooLong', () => {
    it('should return true for alt text over 125 characters', () => {
      const longText = 'A' + ' very long description'.repeat(10);
      expect(isAltTextTooLong(longText)).toBe(true);
    });

    it('should return false for alt text within limits', () => {
      expect(isAltTextTooLong('Meditation room with candles and cushions')).toBe(false);
      expect(isAltTextTooLong('A peaceful space for meditation')).toBe(false);
    });
  });

  describe('hasRedundantPrefix', () => {
    it('should return true for redundant prefixes', () => {
      expect(hasRedundantPrefix('Image of a sunset')).toBe(true);
      expect(hasRedundantPrefix('Picture of a mountain')).toBe(true);
      expect(hasRedundantPrefix('Photo of a beach')).toBe(true);
      expect(hasRedundantPrefix('Graphic of a logo')).toBe(true);
      expect(hasRedundantPrefix('Illustration of a concept')).toBe(true);
    });

    it('should return false for alt text without redundant prefixes', () => {
      expect(hasRedundantPrefix('A beautiful sunset')).toBe(false);
      expect(hasRedundantPrefix('Mountain landscape')).toBe(false);
      expect(hasRedundantPrefix('Meditation room')).toBe(false);
    });

    it('should be case insensitive', () => {
      expect(hasRedundantPrefix('IMAGE OF a sunset')).toBe(true);
      expect(hasRedundantPrefix('PICTURE OF mountains')).toBe(true);
    });
  });

  describe('isFileName', () => {
    it('should return true for common file name patterns', () => {
      expect(isFileName('IMG_1234.jpg')).toBe(true);
      expect(isFileName('IMG_5678')).toBe(true);
      expect(isFileName('DSC_9012')).toBe(true);
      expect(isFileName('PHOTO_3456')).toBe(true);
      expect(isFileName('20241106_123456')).toBe(true);
      expect(isFileName('image.jpg')).toBe(true);
      expect(isFileName('photo.png')).toBe(true);
    });

    it('should return false for descriptive text', () => {
      expect(isFileName('Meditation room with candles')).toBe(false);
      expect(isFileName('Beautiful sunset over mountains')).toBe(false);
      expect(isFileName('Yoga class in progress')).toBe(false);
    });
  });

  describe('calculateAltTextQuality', () => {
    it('should give 100 score for empty alt (decorative)', () => {
      expect(calculateAltTextQuality('')).toBe(100);
    });

    it('should give high score for good alt text', () => {
      const score = calculateAltTextQuality('Meditation room with soft lighting and cushions');
      expect(score).toBeGreaterThanOrEqual(80);
    });

    it('should penalize short alt text', () => {
      const score = calculateAltTextQuality('photo');
      expect(score).toBeLessThan(70);
    });

    it('should penalize redundant prefixes', () => {
      const score1 = calculateAltTextQuality('Meditation room');
      const score2 = calculateAltTextQuality('Image of meditation room');
      expect(score2).toBeLessThan(score1);
    });

    it('should penalize file names', () => {
      const score = calculateAltTextQuality('IMG_1234.jpg');
      expect(score).toBeLessThan(60);
    });

    it('should penalize all caps', () => {
      const score1 = calculateAltTextQuality('Meditation Room');
      const score2 = calculateAltTextQuality('MEDITATION ROOM');
      expect(score2).toBeLessThan(score1);
    });

    it('should penalize no spaces (not descriptive)', () => {
      const score = calculateAltTextQuality('meditationroom');
      expect(score).toBeLessThan(80);
    });

    it('should give bonus for ideal length', () => {
      const goodLength = 'Peaceful meditation room with candles, cushions, and soft ambient lighting';
      const score = calculateAltTextQuality(goodLength);
      expect(score).toBeGreaterThanOrEqual(90);
    });
  });

  describe('validateAltText', () => {
    it('should validate empty alt for decorative images', () => {
      const result = validateAltText('', true);

      expect(result.isValid).toBe(true);
      expect(result.score).toBe(100);
      expect(result.issues).toHaveLength(0);
    });

    it('should warn if decorative image has alt text', () => {
      const result = validateAltText('Some text', true);

      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should fail for missing alt text on non-decorative image', () => {
      const result = validateAltText('', false);

      expect(result.isValid).toBe(false);
      expect(result.score).toBe(0);
      expect(result.issues).toContain('Alt text is missing');
    });

    it('should pass for good alt text', () => {
      const result = validateAltText('Meditation room with soft lighting and comfortable cushions');

      expect(result.isValid).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(80);
      expect(result.issues).toHaveLength(0);
    });

    it('should identify too short alt text', () => {
      const result = validateAltText('photo');

      expect(result.isValid).toBe(false);
      expect(result.issues.some(issue => issue.includes('too short'))).toBe(true);
    });

    it('should identify too long alt text', () => {
      const longText = 'A'.repeat(150);
      const result = validateAltText(longText);

      expect(result.warnings.some(warning => warning.includes('too long'))).toBe(true);
    });

    it('should identify redundant prefixes', () => {
      const result = validateAltText('Image of a meditation room');

      expect(result.warnings.some(warning => warning.includes('redundant prefix'))).toBe(true);
    });

    it('should identify file names', () => {
      const result = validateAltText('IMG_1234.jpg');

      expect(result.isValid).toBe(false);
      expect(result.issues.some(issue => issue.includes('file name'))).toBe(true);
    });

    it('should provide helpful suggestions', () => {
      const result = validateAltText('img');

      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(result.suggestions.some(s => s.includes('descriptive'))).toBe(true);
    });
  });

  // ============================================================================
  // File Name Validation Tests
  // ============================================================================

  describe('isDescriptiveFileName', () => {
    it('should return true for descriptive file names', () => {
      expect(isDescriptiveFileName('meditation-room-candles.jpg')).toBe(true);
      expect(isDescriptiveFileName('yoga-class-outdoors.png')).toBe(true);
      expect(isDescriptiveFileName('peaceful-sunset-mountains.webp')).toBe(true);
    });

    it('should return false for generic file names', () => {
      expect(isDescriptiveFileName('IMG_1234.jpg')).toBe(false);
      expect(isDescriptiveFileName('DSC_5678.png')).toBe(false);
      expect(isDescriptiveFileName('PHOTO_9012.jpg')).toBe(false);
      expect(isDescriptiveFileName('image1.jpg')).toBe(false);
      expect(isDescriptiveFileName('pic123.jpg')).toBe(false);
      expect(isDescriptiveFileName('screenshot.png')).toBe(false);
      expect(isDescriptiveFileName('untitled.jpg')).toBe(false);
    });

    it('should return false for timestamp file names', () => {
      expect(isDescriptiveFileName('20241106123456.jpg')).toBe(false);
    });
  });

  describe('usesHyphens', () => {
    it('should return true for hyphenated file names', () => {
      expect(usesHyphens('meditation-room.jpg')).toBe(true);
      expect(usesHyphens('yoga-class-outdoor.png')).toBe(true);
      expect(usesHyphens('peaceful-sunset.webp')).toBe(true);
    });

    it('should return false for files with underscores', () => {
      expect(usesHyphens('meditation_room.jpg')).toBe(false);
      expect(usesHyphens('yoga_class.png')).toBe(false);
    });

    it('should return false for files with spaces', () => {
      expect(usesHyphens('meditation room.jpg')).toBe(false);
      expect(usesHyphens('yoga class.png')).toBe(false);
    });

    it('should return true for single-word files', () => {
      expect(usesHyphens('meditation.jpg')).toBe(true);
    });
  });

  describe('isLowercase', () => {
    it('should return true for lowercase file names', () => {
      expect(isLowercase('meditation-room.jpg')).toBe(true);
      expect(isLowercase('yoga-class.png')).toBe(true);
    });

    it('should return false for uppercase or mixed case', () => {
      expect(isLowercase('Meditation-Room.jpg')).toBe(false);
      expect(isLowercase('YOGA-CLASS.PNG')).toBe(false);
      expect(isLowercase('Yoga-Class.jpg')).toBe(false);
    });
  });

  describe('extractKeywords', () => {
    it('should extract keywords from hyphenated file names', () => {
      const keywords = extractKeywords('meditation-room-candles.jpg');
      expect(keywords).toEqual(['meditation', 'room', 'candles']);
    });

    it('should extract keywords from underscored file names', () => {
      const keywords = extractKeywords('yoga_class_outdoor.png');
      expect(keywords).toEqual(['yoga', 'class', 'outdoor']);
    });

    it('should handle camelCase file names', () => {
      const keywords = extractKeywords('meditationRoomCandles.jpg');
      expect(keywords).toEqual(['meditation', 'room', 'candles']);
    });

    it('should handle single-word file names', () => {
      const keywords = extractKeywords('meditation.jpg');
      expect(keywords).toEqual(['meditation']);
    });

    it('should filter out empty strings', () => {
      const keywords = extractKeywords('meditation--room.jpg'); // double hyphen
      expect(keywords.every(k => k.length > 0)).toBe(true);
    });
  });

  describe('validateFileName', () => {
    it('should pass for SEO-optimized file names', () => {
      const result = validateFileName('meditation-room-candles.jpg');

      expect(result.isValid).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(80);
      expect(result.issues).toHaveLength(0);
    });

    it('should fail for non-descriptive file names', () => {
      const result = validateFileName('IMG_1234.jpg');

      expect(result.isValid).toBe(false);
      expect(result.issues.some(issue => issue.includes('not descriptive'))).toBe(true);
    });

    it('should warn about underscores', () => {
      const result = validateFileName('meditation_room.jpg');

      expect(result.warnings.some(warning => warning.includes('underscores'))).toBe(true);
    });

    it('should identify spaces in file names', () => {
      const result = validateFileName('meditation room.jpg');

      expect(result.issues.some(issue => issue.includes('spaces'))).toBe(true);
    });

    it('should warn about uppercase', () => {
      const result = validateFileName('Meditation-Room.jpg');

      expect(result.warnings.some(warning => warning.includes('lowercase'))).toBe(true);
    });

    it('should warn about special characters', () => {
      const result = validateFileName('meditation@room!.jpg');

      expect(result.warnings.some(warning => warning.includes('special characters'))).toBe(true);
    });

    it('should warn about too few keywords', () => {
      const result = validateFileName('meditation.jpg');

      expect(result.warnings.some(warning => warning.includes('fewer than 2 keywords'))).toBe(true);
    });

    it('should warn about too many keywords (keyword stuffing)', () => {
      const result = validateFileName('meditation-room-candles-yoga-class-peaceful-zen-spiritual.jpg');

      expect(result.warnings.some(warning => warning.includes('too many keywords'))).toBe(true);
    });

    it('should provide helpful suggestions', () => {
      const result = validateFileName('IMG_1234.jpg');

      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(result.suggestions.some(s => s.includes('descriptive'))).toBe(true);
    });
  });

  // ============================================================================
  // File Size Optimization Tests
  // ============================================================================

  describe('isFileSizeOptimized', () => {
    it('should return true for optimized file sizes', () => {
      expect(isFileSizeOptimized(40 * 1024, 'thumbnail')).toBe(true); // 40KB thumbnail
      expect(isFileSizeOptimized(80 * 1024, 'card')).toBe(true); // 80KB card
      expect(isFileSizeOptimized(150 * 1024, 'hero')).toBe(true); // 150KB hero
    });

    it('should return false for oversized files', () => {
      expect(isFileSizeOptimized(60 * 1024, 'thumbnail')).toBe(false); // 60KB > 50KB max
      expect(isFileSizeOptimized(120 * 1024, 'card')).toBe(false); // 120KB > 100KB max
      expect(isFileSizeOptimized(250 * 1024, 'hero')).toBe(false); // 250KB > 200KB max
    });

    it('should use default card type if not specified', () => {
      expect(isFileSizeOptimized(80 * 1024)).toBe(true); // 80KB < 100KB (card default)
      expect(isFileSizeOptimized(120 * 1024)).toBe(false); // 120KB > 100KB
    });
  });

  describe('getRecommendedFileSize', () => {
    it('should return correct max sizes for each type', () => {
      expect(getRecommendedFileSize('thumbnail')).toBe(50 * 1024);
      expect(getRecommendedFileSize('card')).toBe(100 * 1024);
      expect(getRecommendedFileSize('hero')).toBe(200 * 1024);
      expect(getRecommendedFileSize('fullWidth')).toBe(200 * 1024);
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(500)).toBe('500 B');
      expect(formatFileSize(1024)).toBe('1.0 KB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
      expect(formatFileSize(1024 * 1024)).toBe('1.0 MB');
      expect(formatFileSize(1.5 * 1024 * 1024)).toBe('1.5 MB');
    });

    it('should handle edge cases', () => {
      expect(formatFileSize(0)).toBe('0 B');
      expect(formatFileSize(1)).toBe('1 B');
    });
  });

  // ============================================================================
  // Complete SEO Analysis Tests
  // ============================================================================

  describe('analyzeImageSEO', () => {
    it('should provide comprehensive analysis for good images', () => {
      const analysis = analyzeImageSEO(
        '/images/meditation-room-candles.jpg',
        'Peaceful meditation room with candles and cushions',
        false
      );

      expect(analysis.score).toBeGreaterThanOrEqual(80);
      expect(analysis.meetsBestPractices).toBe(true);
      expect(analysis.altText.isValid).toBe(true);
      expect(analysis.fileName.score).toBeGreaterThanOrEqual(60);
    });

    it('should identify issues with poor images', () => {
      const analysis = analyzeImageSEO(
        '/images/IMG_1234.jpg',
        'img',
        false
      );

      expect(analysis.score).toBeLessThan(80);
      expect(analysis.meetsBestPractices).toBe(false);
      expect(analysis.allIssues.length).toBeGreaterThan(0);
    });

    it('should handle decorative images correctly', () => {
      const analysis = analyzeImageSEO(
        '/images/decoration-pattern.jpg',
        '',
        true
      );

      expect(analysis.altText.isValid).toBe(true);
      expect(analysis.altText.score).toBe(100);
    });

    it('should combine issues from both alt and filename', () => {
      const analysis = analyzeImageSEO(
        '/images/IMG_1234.jpg',
        'Image of meditation',
        false
      );

      expect(analysis.allIssues.length).toBeGreaterThan(0);
      expect(analysis.allSuggestions.length).toBeGreaterThan(0);
    });

    it('should calculate weighted score correctly', () => {
      // Alt text matters more (60%) than file name (40%)
      const analysis = analyzeImageSEO(
        '/images/IMG_1234.jpg', // Bad filename (low score)
        'Beautiful meditation room with soft lighting and comfortable cushions', // Good alt (high score)
        false
      );

      // Should have decent score because alt text is good
      expect(analysis.score).toBeGreaterThan(50);
    });
  });

  describe('generateAltFromFileName', () => {
    it('should generate alt text from file name', () => {
      const alt = generateAltFromFileName('meditation-room-candles.jpg');
      expect(alt).toBe('Meditation room candles');
    });

    it('should handle underscores', () => {
      const alt = generateAltFromFileName('yoga_class_outdoor.png');
      expect(alt).toBe('Yoga class outdoor');
    });

    it('should capitalize first letter', () => {
      const alt = generateAltFromFileName('peaceful-sunset.jpg');
      expect(alt).toMatch(/^P/); // Starts with capital P
    });

    it('should remove file extension', () => {
      const alt = generateAltFromFileName('meditation.jpg');
      expect(alt).not.toContain('.jpg');
    });
  });

  // ============================================================================
  // Integration Tests
  // ============================================================================

  describe('Integration: Real-World Scenarios', () => {
    it('should validate a well-optimized course thumbnail', () => {
      const analysis = analyzeImageSEO(
        '/images/courses/meditation-basics-course.jpg',
        'Meditation Basics course featuring guided sessions and mindfulness techniques',
        false
      );

      expect(analysis.score).toBeGreaterThanOrEqual(80);
      expect(analysis.meetsBestPractices).toBe(true);
      expect(analysis.altText.isValid).toBe(true);
      expect(analysis.fileName.isValid).toBe(true);
    });

    it('should validate a hero image', () => {
      const analysis = analyzeImageSEO(
        '/images/hero-meditation-sunset-mountains.jpg',
        'Peaceful meditation scene at sunset with mountains in the background',
        false
      );

      expect(analysis.score).toBeGreaterThanOrEqual(70);
      expect(analysis.altText.isValid).toBe(true);
    });

    it('should identify issues with camera-generated file names', () => {
      const analysis = analyzeImageSEO(
        '/uploads/DSC_5678.JPG',
        'Photo',
        false
      );

      expect(analysis.meetsBestPractices).toBe(false);
      expect(analysis.fileName.isValid).toBe(false);
      expect(analysis.altText.isValid).toBe(false);
      expect(analysis.allIssues.length).toBeGreaterThan(1);
    });

    it('should handle decorative background patterns', () => {
      const analysis = analyzeImageSEO(
        '/images/backgrounds/zen-pattern-texture.jpg',
        '',
        true
      );

      expect(analysis.altText.isValid).toBe(true);
      expect(analysis.fileName.isValid).toBe(true);
    });
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle very long file names', () => {
      const longName = 'meditation-' + 'peaceful-'.repeat(20) + 'room.jpg';
      const result = validateFileName(longName);

      expect(result.warnings.some(w => w.includes('too many keywords'))).toBe(true);
    });

    it('should handle single-character alt text', () => {
      const result = validateAltText('a');

      expect(result.isValid).toBe(false);
      expect(result.score).toBeLessThan(70);
    });

    it('should handle exact length limits', () => {
      const exactMin = 'a'.repeat(ALT_TEXT_LENGTH.min);
      const result1 = validateAltText(exactMin);
      expect(isAltTextTooShort(exactMin)).toBe(false);

      const exactMax = 'a'.repeat(ALT_TEXT_LENGTH.max);
      const result2 = validateAltText(exactMax);
      expect(isAltTextTooLong(exactMax)).toBe(false);

      const overMax = 'a'.repeat(ALT_TEXT_LENGTH.max + 1);
      expect(isAltTextTooLong(overMax)).toBe(true);
    });

    it('should handle file names with numbers', () => {
      const result = validateFileName('meditation-101-basics.jpg');

      expect(result.isValid).toBe(true);
      expect(extractKeywords('meditation-101-basics.jpg')).toContain('101');
    });

    it('should handle special image formats', () => {
      const result1 = validateFileName('meditation-room.webp');
      expect(result1.isValid).toBe(true);

      const result2 = validateFileName('meditation-room.svg');
      expect(result2.isValid).toBe(true);
    });
  });

  // ============================================================================
  // Constants Tests
  // ============================================================================

  describe('Constants', () => {
    it('should have correct ALT_TEXT_LENGTH values', () => {
      expect(ALT_TEXT_LENGTH.min).toBe(10);
      expect(ALT_TEXT_LENGTH.ideal).toBe(125);
      expect(ALT_TEXT_LENGTH.max).toBe(125);
    });

    it('should have correct MAX_FILE_SIZES values', () => {
      expect(MAX_FILE_SIZES.thumbnail).toBe(50 * 1024);
      expect(MAX_FILE_SIZES.card).toBe(100 * 1024);
      expect(MAX_FILE_SIZES.hero).toBe(200 * 1024);
      expect(MAX_FILE_SIZES.fullWidth).toBe(200 * 1024);
    });
  });
});
