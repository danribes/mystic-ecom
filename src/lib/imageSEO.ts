/**
 * Image SEO Utilities (T234)
 *
 * Utilities for validating and optimizing images for SEO including:
 * - Alt text validation and quality checking
 * - File name validation (descriptive, hyphen-separated, keywords)
 * - Image size optimization recommendations
 * - SEO best practices enforcement
 *
 * @see https://developers.google.com/search/docs/appearance/google-images
 */

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Alt text validation result
 */
export interface AltTextValidation {
  /**
   * Whether the alt text is valid
   */
  isValid: boolean;

  /**
   * Validation score (0-100)
   */
  score: number;

  /**
   * Issues found (if any)
   */
  issues: string[];

  /**
   * Warnings (non-critical)
   */
  warnings: string[];

  /**
   * Suggestions for improvement
   */
  suggestions: string[];
}

/**
 * File name validation result
 */
export interface FileNameValidation {
  /**
   * Whether the file name is valid
   */
  isValid: boolean;

  /**
   * Validation score (0-100)
   */
  score: number;

  /**
   * Issues found (if any)
   */
  issues: string[];

  /**
   * Warnings (non-critical)
   */
  warnings: string[];

  /**
   * Suggestions for improvement
   */
  suggestions: string[];
}

/**
 * Image SEO analysis result
 */
export interface ImageSEOAnalysis {
  /**
   * Overall SEO score (0-100)
   */
  score: number;

  /**
   * Alt text validation
   */
  altText: AltTextValidation;

  /**
   * File name validation
   */
  fileName: FileNameValidation;

  /**
   * Whether image meets SEO best practices
   */
  meetsBestPractices: boolean;

  /**
   * All issues combined
   */
  allIssues: string[];

  /**
   * All suggestions combined
   */
  allSuggestions: string[];
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Recommended maximum file sizes (in bytes)
 */
export const MAX_FILE_SIZES = {
  thumbnail: 50 * 1024, // 50KB
  card: 100 * 1024, // 100KB
  hero: 200 * 1024, // 200KB
  fullWidth: 200 * 1024, // 200KB
} as const;

/**
 * Common SEO stop words to avoid in alt text
 * These add no value for SEO
 */
export const ALT_TEXT_STOP_WORDS = new Set([
  'image',
  'picture',
  'photo',
  'graphic',
  'illustration',
  'icon',
  'logo',
  'banner',
  'img',
  'pic',
]);

/**
 * Common filler words that reduce alt text quality
 */
export const FILLER_WORDS = new Set([
  'a',
  'an',
  'the',
  'of',
  'in',
  'on',
  'at',
  'to',
  'for',
  'with',
  'and',
  'or',
  'but',
]);

/**
 * Recommended alt text length range
 */
export const ALT_TEXT_LENGTH = {
  min: 10,
  ideal: 125,
  max: 125,
} as const;

// ============================================================================
// Alt Text Validation
// ============================================================================

/**
 * Checks if alt text is empty or decorative
 *
 * @param alt - Alt text to check
 * @returns True if empty or explicitly decorative
 *
 * @example
 * isDecorativeImage('') // => true
 * isDecorativeImage('decorative') // => true
 * isDecorativeImage('A beautiful sunset') // => false
 */
export function isDecorativeImage(alt: string): boolean {
  if (!alt || alt.trim() === '') {
    return true;
  }

  const normalized = alt.toLowerCase().trim();
  return (
    normalized === 'decorative' ||
    normalized === 'decoration' ||
    normalized === 'spacer'
  );
}

/**
 * Checks if alt text is too short
 *
 * @param alt - Alt text to check
 * @returns True if alt text is too short
 */
export function isAltTextTooShort(alt: string): boolean {
  return alt.trim().length < ALT_TEXT_LENGTH.min;
}

/**
 * Checks if alt text is too long
 *
 * @param alt - Alt text to check
 * @returns True if alt text is too long
 */
export function isAltTextTooLong(alt: string): boolean {
  return alt.length > ALT_TEXT_LENGTH.max;
}

/**
 * Checks if alt text starts with redundant prefix
 *
 * @param alt - Alt text to check
 * @returns True if starts with "image of", "picture of", etc.
 *
 * @example
 * hasRedundantPrefix('Image of a sunset') // => true
 * hasRedundantPrefix('A beautiful sunset') // => false
 */
export function hasRedundantPrefix(alt: string): boolean {
  const normalized = alt.toLowerCase().trim();

  const redundantPrefixes = [
    'image of',
    'picture of',
    'photo of',
    'graphic of',
    'illustration of',
    'icon of',
    'logo of',
  ];

  return redundantPrefixes.some(prefix => normalized.startsWith(prefix));
}

/**
 * Checks if alt text is just a file name
 *
 * @param alt - Alt text to check
 * @returns True if appears to be a file name
 *
 * @example
 * isFileName('IMG_1234.jpg') // => true
 * isFileName('DSC_5678') // => true
 * isFileName('Sunset over mountains') // => false
 */
export function isFileName(alt: string): boolean {
  // Check for common file name patterns
  const fileNamePatterns = [
    /^IMG_\d+/i, // IMG_1234
    /^DSC_\d+/i, // DSC_5678
    /^PHOTO_\d+/i, // PHOTO_1234
    /^\d{8,}/, // 20241106_123456
    /\.(jpg|jpeg|png|gif|webp)$/i, // ends with extension
  ];

  return fileNamePatterns.some(pattern => pattern.test(alt));
}

/**
 * Calculates the quality score of alt text
 *
 * @param alt - Alt text to analyze
 * @returns Score from 0-100
 */
export function calculateAltTextQuality(alt: string): number {
  if (isDecorativeImage(alt)) {
    return 100; // Empty alt is correct for decorative images
  }

  let score = 100;

  // Penalize if too short
  if (isAltTextTooShort(alt)) {
    score -= 35;
  }

  // Penalize if too long
  if (isAltTextTooLong(alt)) {
    score -= 20;
  }

  // Penalize redundant prefixes
  if (hasRedundantPrefix(alt)) {
    score -= 15;
  }

  // Penalize if it's just a file name
  if (isFileName(alt)) {
    score -= 40;
  }

  // Penalize if it's all uppercase (seems like shouting)
  if (alt === alt.toUpperCase() && alt.length > 3) {
    score -= 10;
  }

  // Penalize if no spaces (likely not descriptive)
  if (!alt.includes(' ') && alt.length > 10) {
    score -= 25;
  }

  // Bonus for ideal length
  if (alt.length >= 30 && alt.length <= ALT_TEXT_LENGTH.ideal) {
    score += 10;
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Validates alt text and provides detailed feedback
 *
 * @param alt - Alt text to validate
 * @param isDecor ative - Whether image is decorative (optional)
 * @returns Validation result with issues and suggestions
 *
 * @example
 * ```typescript
 * const result = validateAltText('IMG_1234.jpg');
 * // {
 * //   isValid: false,
 * //   score: 40,
 * //   issues: ['Alt text appears to be a file name'],
 * //   suggestions: ['Use descriptive text instead of file name']
 * // }
 * ```
 */
export function validateAltText(
  alt: string,
  isDecorative: boolean = false
): AltTextValidation {
  const issues: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];

  // If explicitly marked as decorative, empty alt is correct
  if (isDecorative) {
    if (alt && alt.trim() !== '') {
      warnings.push('Decorative images should have empty alt text (alt="")');
      suggestions.push('Remove alt text for decorative images');
    }

    return {
      isValid: true,
      score: 100,
      issues: [],
      warnings,
      suggestions,
    };
  }

  // Check if alt text is missing
  if (!alt || alt.trim() === '') {
    issues.push('Alt text is missing');
    suggestions.push('Add descriptive alt text explaining what the image shows');

    return {
      isValid: false,
      score: 0,
      issues,
      warnings,
      suggestions,
    };
  }

  const score = calculateAltTextQuality(alt);

  // Check for specific issues
  if (isAltTextTooShort(alt)) {
    issues.push(`Alt text is too short (${alt.length} chars, minimum ${ALT_TEXT_LENGTH.min})`);
    suggestions.push('Provide more descriptive alt text');
  }

  if (isAltTextTooLong(alt)) {
    warnings.push(`Alt text is too long (${alt.length} chars, recommended max ${ALT_TEXT_LENGTH.max})`);
    suggestions.push('Shorten alt text to 125 characters or less');
  }

  if (hasRedundantPrefix(alt)) {
    warnings.push('Alt text starts with redundant prefix ("image of", "picture of", etc.)');
    suggestions.push('Remove redundant prefix - screen readers already announce "image"');
  }

  if (isFileName(alt)) {
    issues.push('Alt text appears to be a file name');
    suggestions.push('Use descriptive text instead of file name (e.g., "Meditation room with candles")');
  }

  // Check for all caps
  if (alt === alt.toUpperCase() && alt.length > 3) {
    warnings.push('Alt text is all uppercase');
    suggestions.push('Use sentence case for better readability');
  }

  // Check for no spaces (likely not descriptive)
  if (!alt.includes(' ') && alt.length > 10) {
    warnings.push('Alt text has no spaces - may not be descriptive enough');
    suggestions.push('Use complete phrases or sentences');
  }

  const isValid = issues.length === 0 && score >= 60;

  return {
    isValid,
    score,
    issues,
    warnings,
    suggestions,
  };
}

// ============================================================================
// File Name Validation
// ============================================================================

/**
 * Checks if file name is descriptive (not generic)
 *
 * @param fileName - File name to check
 * @returns True if descriptive
 *
 * @example
 * isDescriptiveFileName('meditation-room-candles.jpg') // => true
 * isDescriptiveFileName('image1.jpg') // => false
 * isDescriptiveFileName('IMG_1234.jpg') // => false
 */
export function isDescriptiveFileName(fileName: string): boolean {
  const baseName = fileName.replace(/\.[^.]+$/, '').toLowerCase();

  // Generic patterns to avoid
  const genericPatterns = [
    /^img_?\d+$/i,
    /^dsc_?\d+$/i,
    /^photo_?\d+$/i,
    /^image_?\d+$/i,
    /^pic_?\d+$/i,
    /^screenshot/i,
    /^untitled/i,
    /^\d{8,}$/, // Just numbers
  ];

  return !genericPatterns.some(pattern => pattern.test(baseName));
}

/**
 * Checks if file name uses hyphens (not underscores or spaces)
 *
 * @param fileName - File name to check
 * @returns True if uses hyphens
 *
 * @example
 * usesHyphens('meditation-room.jpg') // => true
 * usesHyphens('meditation_room.jpg') // => false
 * usesHyphens('meditation room.jpg') // => false
 */
export function usesHyphens(fileName: string): boolean {
  const baseName = fileName.replace(/\.[^.]+$/, '');

  // Should use hyphens if there are multiple words
  if (baseName.includes('_') || baseName.includes(' ')) {
    return false;
  }

  // If it has hyphens and no underscores/spaces, it's good
  return baseName.includes('-') || !baseName.match(/[A-Z][a-z]/);
}

/**
 * Checks if file name is lowercase
 *
 * @param fileName - File name to check
 * @returns True if lowercase
 */
export function isLowercase(fileName: string): boolean {
  const baseName = fileName.replace(/\.[^.]+$/, '');
  return baseName === baseName.toLowerCase();
}

/**
 * Extracts keywords from file name
 *
 * @param fileName - File name to analyze
 * @returns Array of keywords
 *
 * @example
 * extractKeywords('meditation-room-candles.jpg')
 * // => ['meditation', 'room', 'candles']
 */
export function extractKeywords(fileName: string): string[] {
  const baseName = fileName.replace(/\.[^.]+$/, '');

  // Split by hyphens, underscores, or camelCase (before lowercasing)
  const words = baseName
    .replace(/([a-z])([A-Z])/g, '$1-$2') // Split camelCase
    .toLowerCase()
    .split(/[-_\s]+/)
    .filter(word => word.length > 0);

  return words;
}

/**
 * Validates file name for SEO best practices
 *
 * @param fileName - File name to validate
 * @returns Validation result with issues and suggestions
 *
 * @example
 * ```typescript
 * const result = validateFileName('IMG_1234.JPG');
 * // {
 * //   isValid: false,
 * //   score: 30,
 * //   issues: [
 * //     'File name is not descriptive',
 * //     'File name should be lowercase'
 * //   ],
 * //   suggestions: [
 * //     'Use descriptive, keyword-rich file name',
 * //     'Convert to lowercase'
 * //   ]
 * // }
 * ```
 */
export function validateFileName(fileName: string): FileNameValidation {
  const issues: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];

  let score = 100;

  // Check if descriptive
  if (!isDescriptiveFileName(fileName)) {
    issues.push('File name is not descriptive (appears to be generic or camera-generated)');
    suggestions.push('Use descriptive, keyword-rich file name (e.g., "meditation-room-candles.jpg")');
    score -= 40;
  }

  // Check for hyphens
  if (!usesHyphens(fileName)) {
    const baseName = fileName.replace(/\.[^.]+$/, '');

    if (baseName.includes('_')) {
      warnings.push('File name uses underscores instead of hyphens');
      suggestions.push('Use hyphens instead of underscores for better SEO');
      score -= 15;
    }

    if (baseName.includes(' ')) {
      issues.push('File name contains spaces');
      suggestions.push('Replace spaces with hyphens');
      score -= 20;
    }
  }

  // Check for lowercase
  if (!isLowercase(fileName)) {
    warnings.push('File name is not lowercase');
    suggestions.push('Convert file name to lowercase');
    score -= 10;
  }

  // Check for special characters
  if (/[^a-z0-9.-]/i.test(fileName)) {
    warnings.push('File name contains special characters');
    suggestions.push('Remove special characters from file name');
    score -= 10;
  }

  // Check for keywords
  const keywords = extractKeywords(fileName);
  if (keywords.length < 2) {
    warnings.push('File name has fewer than 2 keywords');
    suggestions.push('Include 2-4 descriptive keywords in file name');
    score -= 15;
  }

  if (keywords.length > 5) {
    warnings.push('File name has too many keywords (keyword stuffing)');
    suggestions.push('Keep file name concise (2-4 keywords)');
    score -= 10;
  }

  const isValid = issues.length === 0 && score >= 60;

  return {
    isValid,
    score: Math.max(0, score),
    issues,
    warnings,
    suggestions,
  };
}

// ============================================================================
// Image Size Optimization
// ============================================================================

/**
 * Checks if file size is optimized for web
 *
 * @param fileSize - File size in bytes
 * @param imageType - Type of image (thumbnail, card, hero, fullWidth)
 * @returns Whether size is acceptable
 *
 * @example
 * isFileSizeOptimized(150000, 'thumbnail') // => false (too large for thumbnail)
 * isFileSizeOptimized(80000, 'card') // => true
 */
export function isFileSizeOptimized(
  fileSize: number,
  imageType: keyof typeof MAX_FILE_SIZES = 'card'
): boolean {
  return fileSize <= MAX_FILE_SIZES[imageType];
}

/**
 * Gets recommended file size for image type
 *
 * @param imageType - Type of image
 * @returns Recommended max size in bytes
 */
export function getRecommendedFileSize(imageType: keyof typeof MAX_FILE_SIZES): number {
  return MAX_FILE_SIZES[imageType];
}

/**
 * Formats file size in human-readable format
 *
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "150 KB", "1.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  } else {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}

// ============================================================================
// Complete Image SEO Analysis
// ============================================================================

/**
 * Performs complete SEO analysis on an image
 *
 * @param src - Image source URL/path
 * @param alt - Alt text
 * @param isDecorative - Whether image is decorative
 * @returns Complete SEO analysis
 *
 * @example
 * ```typescript
 * const analysis = analyzeImageSEO(
 *   '/images/meditation-room-candles.jpg',
 *   'Peaceful meditation room with lit candles and cushions',
 *   false
 * );
 *
 * console.log(`SEO Score: ${analysis.score}/100`);
 * console.log(`Issues: ${analysis.allIssues.join(', ')}`);
 * ```
 */
export function analyzeImageSEO(
  src: string,
  alt: string,
  isDecorative: boolean = false
): ImageSEOAnalysis {
  // Extract file name from src
  const fileName = src.split('/').pop() || '';

  // Validate alt text
  const altTextValidation = validateAltText(alt, isDecorative);

  // Validate file name
  const fileNameValidation = validateFileName(fileName);

  // Calculate overall score (weighted average)
  const overallScore = Math.round(
    altTextValidation.score * 0.6 + fileNameValidation.score * 0.4
  );

  // Combine all issues and suggestions
  const allIssues = [
    ...altTextValidation.issues,
    ...fileNameValidation.issues,
  ];

  const allSuggestions = [
    ...altTextValidation.suggestions,
    ...fileNameValidation.suggestions,
  ];

  // Meets best practices if score >= 80 and no critical issues
  const meetsBestPractices =
    overallScore >= 80 &&
    altTextValidation.isValid &&
    fileNameValidation.score >= 60;

  return {
    score: overallScore,
    altText: altTextValidation,
    fileName: fileNameValidation,
    meetsBestPractices,
    allIssues,
    allSuggestions,
  };
}

/**
 * Generates SEO-friendly alt text from file name (fallback)
 *
 * @param fileName - Original file name
 * @returns Generated alt text
 *
 * @example
 * generateAltFromFileName('meditation-room-candles.jpg')
 * // => 'Meditation room candles'
 */
export function generateAltFromFileName(fileName: string): string {
  const baseName = fileName.replace(/\.[^.]+$/, '');

  // Replace hyphens and underscores with spaces
  let alt = baseName.replace(/[-_]/g, ' ');

  // Capitalize first letter
  alt = alt.charAt(0).toUpperCase() + alt.slice(1);

  return alt;
}
