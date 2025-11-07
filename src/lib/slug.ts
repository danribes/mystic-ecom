/**
 * SEO-Friendly Slug Generation and Validation Utilities (T231)
 *
 * Provides comprehensive slug generation, validation, and optimization functions
 * following SEO best practices for URL structure.
 *
 * Best Practices:
 * - Use hyphens (not underscores) as separators
 * - Use lowercase letters only
 * - Keep slugs short and descriptive (50-60 characters ideal)
 * - Include relevant keywords
 * - Avoid stop words when possible
 * - Use only URL-safe characters (a-z, 0-9, hyphens)
 *
 * @see https://developers.google.com/search/docs/crawling-indexing/url-structure
 * @see https://moz.com/learn/seo/url
 */

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Options for slug generation
 */
export interface SlugOptions {
  /**
   * Maximum length of the generated slug
   * @default 100
   */
  maxLength?: number;

  /**
   * Remove common stop words to shorten slug
   * @default false
   */
  removeStopWords?: boolean;

  /**
   * Preserve numbers in the slug
   * @default true
   */
  preserveNumbers?: boolean;

  /**
   * Strict mode: reject non-ASCII characters instead of transliterating
   * @default false
   */
  strict?: boolean;

  /**
   * Convert to lowercase
   * @default true
   */
  lowercase?: boolean;

  /**
   * Separator character (hyphen by default)
   * @default '-'
   */
  separator?: string;
}

/**
 * Slug validation result
 */
export interface SlugValidationResult {
  /**
   * Whether the slug is valid
   */
  valid: boolean;

  /**
   * Array of validation errors
   */
  errors: string[];

  /**
   * Array of SEO warnings
   */
  warnings: string[];

  /**
   * Suggested improvements
   */
  suggestions: string[];
}

/**
 * Slug analysis result
 */
export interface SlugAnalysis {
  /**
   * Length of the slug
   */
  length: number;

  /**
   * Number of words (segments) in slug
   */
  wordCount: number;

  /**
   * Whether slug is SEO-friendly length
   */
  isOptimalLength: boolean;

  /**
   * Whether slug contains numbers
   */
  hasNumbers: boolean;

  /**
   * Whether slug contains only lowercase
   */
  isLowercase: boolean;

  /**
   * SEO score (0-100)
   */
  seoScore: number;

  /**
   * Readability score (0-100)
   */
  readabilityScore: number;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Default slug options
 */
export const DEFAULT_SLUG_OPTIONS: Required<SlugOptions> = {
  maxLength: 100,
  removeStopWords: false,
  preserveNumbers: true,
  strict: false,
  lowercase: true,
  separator: '-',
};

/**
 * Recommended slug length range for SEO
 */
export const OPTIMAL_SLUG_LENGTH = {
  min: 3,
  ideal: 50,
  max: 60,
  absolute: 100,
};

/**
 * Common English stop words to optionally remove
 * (Articles, prepositions, conjunctions that don't add SEO value)
 */
export const STOP_WORDS = new Set([
  'a',
  'an',
  'the',
  'and',
  'or',
  'but',
  'in',
  'on',
  'at',
  'to',
  'for',
  'of',
  'with',
  'by',
  'from',
  'as',
  'is',
  'was',
  'be',
  'been',
  'are',
  'am',
  'will',
  'would',
  'should',
  'could',
  'may',
  'might',
  'can',
  'this',
  'that',
  'these',
  'those',
]);

/**
 * Unicode character transliteration map
 * Converts common special characters to ASCII equivalents
 */
export const TRANSLITERATION_MAP: Record<string, string> = {
  // Latin characters with diacritics
  à: 'a',
  á: 'a',
  â: 'a',
  ã: 'a',
  ä: 'a',
  å: 'a',
  æ: 'ae',
  ç: 'c',
  è: 'e',
  é: 'e',
  ê: 'e',
  ë: 'e',
  ì: 'i',
  í: 'i',
  î: 'i',
  ï: 'i',
  ñ: 'n',
  ò: 'o',
  ó: 'o',
  ô: 'o',
  õ: 'o',
  ö: 'o',
  ø: 'o',
  œ: 'oe',
  ù: 'u',
  ú: 'u',
  û: 'u',
  ü: 'u',
  ý: 'y',
  ÿ: 'y',
  ß: 'ss',
  // Uppercase
  À: 'A',
  Á: 'A',
  Â: 'A',
  Ã: 'A',
  Ä: 'A',
  Å: 'A',
  Æ: 'AE',
  Ç: 'C',
  È: 'E',
  É: 'E',
  Ê: 'E',
  Ë: 'E',
  Ì: 'I',
  Í: 'I',
  Î: 'I',
  Ï: 'I',
  Ñ: 'N',
  Ò: 'O',
  Ó: 'O',
  Ô: 'O',
  Õ: 'O',
  Ö: 'O',
  Ø: 'O',
  Œ: 'OE',
  Ù: 'U',
  Ú: 'U',
  Û: 'U',
  Ü: 'U',
  Ý: 'Y',
  Ÿ: 'Y',
  // Common punctuation replacements (using unicode escapes)
  '\u2018': "'", // Left single quotation mark
  '\u2019': "'", // Right single quotation mark
  '\u201C': '"', // Left double quotation mark
  '\u201D': '"', // Right double quotation mark
  '\u2013': '-', // En dash
  '\u2014': '-', // Em dash
  '\u2026': '...', // Horizontal ellipsis
};

/**
 * Regex pattern for valid slug format
 * Matches: lowercase letters, numbers, hyphens
 * Must start and end with alphanumeric
 */
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Regex pattern for URL-safe characters
 */
export const URL_SAFE_PATTERN = /^[a-z0-9-]+$/;

// ============================================================================
// Core Slug Generation Functions
// ============================================================================

/**
 * Transliterate Unicode characters to ASCII equivalents
 *
 * @param text - Text to transliterate
 * @returns ASCII text
 *
 * @example
 * transliterate('café') // => 'cafe'
 * transliterate('naïve') // => 'naive'
 * transliterate('Zürich') // => 'Zurich'
 */
export function transliterate(text: string): string {
  let result = '';

  for (const char of text) {
    if (char in TRANSLITERATION_MAP) {
      result += TRANSLITERATION_MAP[char];
    } else {
      result += char;
    }
  }

  return result;
}

/**
 * Remove stop words from text
 *
 * @param text - Text to process
 * @param separator - Word separator
 * @returns Text with stop words removed
 *
 * @example
 * removeStopWords('the-quick-brown-fox') // => 'quick-brown-fox'
 * removeStopWords('a guide to meditation') // => 'guide meditation'
 */
export function removeStopWords(text: string, separator: string = '-'): string {
  const words = text.split(separator);
  const filtered = words.filter((word) => !STOP_WORDS.has(word.toLowerCase()));

  // Keep at least one word even if it's a stop word
  if (filtered.length === 0 && words.length > 0) {
    return words[words.length - 1];
  }

  return filtered.join(separator);
}

/**
 * Generate SEO-friendly slug from text
 *
 * @param text - Text to slugify
 * @param options - Slug generation options
 * @returns URL-safe slug
 *
 * @example
 * generateSlug('Hello World!') // => 'hello-world'
 * generateSlug('Café & Restaurant') // => 'cafe-restaurant'
 * generateSlug('The Ultimate Guide to Meditation', { removeStopWords: true })
 * // => 'ultimate-guide-meditation'
 */
export function generateSlug(text: string, options: SlugOptions = {}): string {
  const opts = { ...DEFAULT_SLUG_OPTIONS, ...options };

  if (!text || text.trim().length === 0) {
    throw new Error('Text cannot be empty');
  }

  let slug = text;

  // Step 1: Transliterate Unicode characters to ASCII
  if (!opts.strict) {
    slug = transliterate(slug);
  }

  // Step 2: Convert to lowercase
  if (opts.lowercase) {
    slug = slug.toLowerCase();
  }

  // Step 3: Trim whitespace
  slug = slug.trim();

  // Step 4: Replace underscores with separator
  slug = slug.replace(/_+/g, opts.separator);

  // Step 5: Replace special characters
  // Keep only alphanumeric, spaces, and hyphens
  if (opts.preserveNumbers) {
    slug = slug.replace(/[^a-z0-9\s-]/gi, '');
  } else {
    slug = slug.replace(/[^a-z\s-]/gi, '');
  }

  // Step 6: Replace spaces with separator
  slug = slug.replace(/\s+/g, opts.separator);

  // Step 7: Replace multiple separators with single separator
  slug = slug.replace(new RegExp(`${opts.separator}+`, 'g'), opts.separator);

  // Step 8: Remove stop words if requested
  if (opts.removeStopWords) {
    slug = removeStopWords(slug, opts.separator);
  }

  // Step 9: Remove leading/trailing separators
  slug = slug.replace(new RegExp(`^${opts.separator}+|${opts.separator}+$`, 'g'), '');

  // Step 10: Truncate to max length at word boundary
  if (slug.length > opts.maxLength) {
    slug = slug.substring(0, opts.maxLength);

    // Try to truncate at last separator to avoid cutting words
    const lastSeparator = slug.lastIndexOf(opts.separator);
    if (lastSeparator > opts.maxLength / 2) {
      slug = slug.substring(0, lastSeparator);
    }

    // Remove trailing separator after truncation
    slug = slug.replace(new RegExp(`${opts.separator}+$`, 'g'), '');
  }

  // Step 11: Validate minimum length
  if (slug.length < OPTIMAL_SLUG_LENGTH.min) {
    throw new Error(`Slug is too short (minimum ${OPTIMAL_SLUG_LENGTH.min} characters)`);
  }

  return slug;
}

/**
 * Alias for generateSlug (maintains backwards compatibility)
 *
 * @param text - Text to slugify
 * @param options - Slug generation options
 * @returns URL-safe slug
 */
export function slugify(text: string, options: SlugOptions = {}): string {
  return generateSlug(text, options);
}

/**
 * Generate unique slug by appending counter
 *
 * @param baseSlug - Base slug
 * @param existingSlugs - Array of existing slugs to check against
 * @returns Unique slug
 *
 * @example
 * generateUniqueSlug('my-article', ['my-article'])
 * // => 'my-article-2'
 *
 * generateUniqueSlug('my-article', ['my-article', 'my-article-2'])
 * // => 'my-article-3'
 */
export function generateUniqueSlug(baseSlug: string, existingSlugs: string[]): string {
  if (!existingSlugs.includes(baseSlug)) {
    return baseSlug;
  }

  let counter = 2;
  let uniqueSlug = `${baseSlug}-${counter}`;

  while (existingSlugs.includes(uniqueSlug)) {
    counter++;
    uniqueSlug = `${baseSlug}-${counter}`;
  }

  return uniqueSlug;
}

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Check if a string is a valid slug format
 *
 * @param slug - Slug to validate
 * @returns True if valid
 *
 * @example
 * isValidSlug('my-article') // => true
 * isValidSlug('My Article') // => false
 * isValidSlug('my_article') // => false
 */
export function isValidSlug(slug: string): boolean {
  if (!slug || typeof slug !== 'string') {
    return false;
  }

  return SLUG_PATTERN.test(slug);
}

/**
 * Check if slug is URL-safe
 *
 * @param slug - Slug to check
 * @returns True if URL-safe
 */
export function isUrlSafe(slug: string): boolean {
  if (!slug || typeof slug !== 'string') {
    return false;
  }

  return URL_SAFE_PATTERN.test(slug);
}

/**
 * Validate slug and provide detailed feedback
 *
 * @param slug - Slug to validate
 * @returns Validation result with errors, warnings, and suggestions
 *
 * @example
 * validateSlug('my-article')
 * // => { valid: true, errors: [], warnings: [], suggestions: [] }
 *
 * validateSlug('My_Article')
 * // => { valid: false, errors: ['Contains uppercase letters', ...], ... }
 */
export function validateSlug(slug: string): SlugValidationResult {
  const result: SlugValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
    suggestions: [],
  };

  // Check if slug exists
  if (!slug || typeof slug !== 'string') {
    result.valid = false;
    result.errors.push('Slug is required and must be a string');
    return result;
  }

  // Check if empty or only whitespace
  if (slug.trim().length === 0) {
    result.valid = false;
    result.errors.push('Slug cannot be empty');
    return result;
  }

  // Check minimum length
  if (slug.length < OPTIMAL_SLUG_LENGTH.min) {
    result.valid = false;
    result.errors.push(
      `Slug is too short (${slug.length} chars). Minimum: ${OPTIMAL_SLUG_LENGTH.min} characters`
    );
  }

  // Check maximum length
  if (slug.length > OPTIMAL_SLUG_LENGTH.absolute) {
    result.valid = false;
    result.errors.push(
      `Slug is too long (${slug.length} chars). Maximum: ${OPTIMAL_SLUG_LENGTH.absolute} characters`
    );
  }

  // Check for uppercase letters
  if (slug !== slug.toLowerCase()) {
    result.valid = false;
    result.errors.push('Slug contains uppercase letters. Use lowercase only');
    result.suggestions.push(`Try: "${slug.toLowerCase()}"`);
  }

  // Check for underscores
  if (slug.includes('_')) {
    result.valid = false;
    result.errors.push('Slug contains underscores. Use hyphens instead');
    result.suggestions.push(`Try: "${slug.replace(/_/g, '-')}"`);
  }

  // Check for spaces
  if (slug.includes(' ')) {
    result.valid = false;
    result.errors.push('Slug contains spaces. Use hyphens instead');
    result.suggestions.push(`Try: "${slug.replace(/\s+/g, '-')}"`);
  }

  // Check for invalid characters
  if (!URL_SAFE_PATTERN.test(slug)) {
    result.valid = false;
    result.errors.push('Slug contains invalid characters. Use only: a-z, 0-9, hyphens');
    try {
      result.suggestions.push(`Try: "${generateSlug(slug)}"`);
    } catch {
      // Ignore if slug generation fails
    }
  }

  // Check for leading/trailing hyphens
  if (slug.startsWith('-') || slug.endsWith('-')) {
    result.valid = false;
    result.errors.push('Slug cannot start or end with hyphens');
    result.suggestions.push(`Try: "${slug.replace(/^-+|-+$/g, '')}"`);
  }

  // Check for consecutive hyphens
  if (slug.includes('--')) {
    result.valid = false;
    result.errors.push('Slug contains consecutive hyphens');
    result.suggestions.push(`Try: "${slug.replace(/-+/g, '-')}"`);
  }

  // Warnings (doesn't make slug invalid, but not ideal for SEO)

  // Warn about non-optimal length
  if (slug.length > OPTIMAL_SLUG_LENGTH.max) {
    result.warnings.push(
      `Slug is longer than recommended (${slug.length} chars). Ideal: ${OPTIMAL_SLUG_LENGTH.ideal}-${OPTIMAL_SLUG_LENGTH.max} characters`
    );
    result.suggestions.push('Consider shortening the slug for better SEO');
  }

  // Warn about too many words
  const wordCount = slug.split('-').length;
  if (wordCount > 8) {
    result.warnings.push(`Slug has many words (${wordCount}). Consider reducing to 3-6 words`);
  }

  // Warn about single character segments
  const segments = slug.split('-');
  const singleCharSegments = segments.filter((s) => s.length === 1);
  if (singleCharSegments.length > 0) {
    result.warnings.push(
      `Slug contains single-character segments: ${singleCharSegments.join(', ')}`
    );
  }

  // Check for common stop words
  const hasStopWords = segments.some((segment) => STOP_WORDS.has(segment));
  if (hasStopWords) {
    result.warnings.push('Slug contains stop words (the, a, an, etc.) that could be removed');
    try {
      const optimized = removeStopWords(slug);
      if (optimized !== slug && optimized.length >= OPTIMAL_SLUG_LENGTH.min) {
        result.suggestions.push(`Consider: "${optimized}"`);
      }
    } catch {
      // Ignore if optimization fails
    }
  }

  return result;
}

/**
 * Analyze slug and provide detailed metrics
 *
 * @param slug - Slug to analyze
 * @returns Analysis result with metrics and scores
 *
 * @example
 * analyzeSlug('ultimate-guide-meditation')
 * // => { length: 26, wordCount: 3, seoScore: 95, ... }
 */
export function analyzeSlug(slug: string): SlugAnalysis {
  const words = slug.split('-');

  // Calculate SEO score (0-100)
  let seoScore = 100;

  // Length penalties
  if (slug.length < OPTIMAL_SLUG_LENGTH.min) {
    seoScore -= 30;
  } else if (slug.length > OPTIMAL_SLUG_LENGTH.absolute) {
    seoScore -= 50;
  } else if (slug.length > OPTIMAL_SLUG_LENGTH.max) {
    seoScore -= 10;
  }

  // Word count penalties
  if (words.length < 2) {
    seoScore -= 10;
  } else if (words.length > 8) {
    seoScore -= 15;
  }

  // Stop words penalty
  const hasStopWords = words.some((word) => STOP_WORDS.has(word));
  if (hasStopWords) {
    seoScore -= 5;
  }

  // Invalid format penalty
  if (!isValidSlug(slug)) {
    seoScore -= 40;
  }

  // Calculate readability score (0-100)
  let readabilityScore = 100;

  // Too short or too long
  if (slug.length < 10) {
    readabilityScore -= 10;
  } else if (slug.length > 80) {
    readabilityScore -= 20;
  }

  // Too many words
  if (words.length > 10) {
    readabilityScore -= 15;
  }

  // Single character words reduce readability
  const singleCharWords = words.filter((w) => w.length === 1);
  readabilityScore -= singleCharWords.length * 10;

  // Ensure scores don't go below 0
  seoScore = Math.max(0, seoScore);
  readabilityScore = Math.max(0, readabilityScore);

  return {
    length: slug.length,
    wordCount: words.length,
    isOptimalLength:
      slug.length >= OPTIMAL_SLUG_LENGTH.min && slug.length <= OPTIMAL_SLUG_LENGTH.max,
    hasNumbers: /\d/.test(slug),
    isLowercase: slug === slug.toLowerCase(),
    seoScore,
    readabilityScore,
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Compare two slugs for similarity
 *
 * @param slug1 - First slug
 * @param slug2 - Second slug
 * @returns Similarity score (0-1)
 *
 * @example
 * compareSlugSimilarity('mindfulness-meditation', 'meditation-mindfulness')
 * // => 1.0 (same words, different order)
 *
 * compareSlugSimilarity('yoga-basics', 'advanced-yoga')
 * // => 0.5 (one word in common)
 */
export function compareSlugSimilarity(slug1: string, slug2: string): number {
  const words1 = new Set(slug1.split('-'));
  const words2 = new Set(slug2.split('-'));

  const intersection = new Set([...words1].filter((word) => words2.has(word)));
  const union = new Set([...words1, ...words2]);

  if (union.size === 0) {
    return 0;
  }

  return intersection.size / union.size;
}

/**
 * Extract keywords from slug
 *
 * @param slug - Slug to extract keywords from
 * @param removeStop - Whether to remove stop words
 * @returns Array of keywords
 *
 * @example
 * extractKeywords('the-ultimate-guide-to-meditation')
 * // => ['ultimate', 'guide', 'meditation'] (with removeStop = true)
 */
export function extractKeywords(slug: string, removeStop: boolean = true): string[] {
  const words = slug.split('-');

  if (removeStop) {
    return words.filter((word) => !STOP_WORDS.has(word));
  }

  return words;
}

/**
 * Suggest slug improvements
 *
 * @param slug - Slug to improve
 * @returns Array of suggested improvements
 *
 * @example
 * suggestImprovements('The_Ultimate-Guide')
 * // => ['ultimate-guide', 'ultimate-guide-...']
 */
export function suggestImprovements(slug: string): string[] {
  const suggestions: string[] = [];

  try {
    // Try basic slug generation
    const basic = generateSlug(slug);
    if (basic !== slug && isValidSlug(basic)) {
      suggestions.push(basic);
    }

    // Try with stop words removed
    const withoutStops = generateSlug(slug, { removeStopWords: true });
    if (
      withoutStops !== basic &&
      withoutStops !== slug &&
      withoutStops.length >= OPTIMAL_SLUG_LENGTH.min
    ) {
      suggestions.push(withoutStops);
    }

    // Try shorter version
    if (slug.length > OPTIMAL_SLUG_LENGTH.max) {
      const shortened = generateSlug(slug, { maxLength: OPTIMAL_SLUG_LENGTH.ideal });
      if (shortened !== slug && shortened.length >= OPTIMAL_SLUG_LENGTH.min) {
        suggestions.push(shortened);
      }
    }
  } catch {
    // Ignore errors in suggestion generation
  }

  // Remove duplicates
  return [...new Set(suggestions)];
}

/**
 * Check if slug contains keyword
 *
 * @param slug - Slug to check
 * @param keyword - Keyword to find
 * @returns True if keyword is found
 *
 * @example
 * slugContainsKeyword('mindfulness-meditation-guide', 'meditation')
 * // => true
 */
export function slugContainsKeyword(slug: string, keyword: string): boolean {
  const slugWords = slug.split('-');
  const normalizedKeyword = keyword.toLowerCase().replace(/\s+/g, '-');

  return slugWords.includes(normalizedKeyword) || slug.includes(normalizedKeyword);
}

/**
 * Optimize slug for SEO
 *
 * @param slug - Slug to optimize
 * @returns Optimized slug
 *
 * @example
 * optimizeSlug('the-ultimate-guide-to-mindfulness-meditation-for-beginners')
 * // => 'ultimate-guide-mindfulness-meditation-beginners'
 */
export function optimizeSlug(slug: string): string {
  try {
    // First, ensure it's a valid slug
    if (!isValidSlug(slug)) {
      slug = generateSlug(slug);
    }

    // Remove stop words if it makes the slug shorter but still meaningful
    const withoutStops = removeStopWords(slug);
    if (
      withoutStops.length >= OPTIMAL_SLUG_LENGTH.min &&
      withoutStops.length < slug.length &&
      withoutStops.split('-').length >= 2
    ) {
      slug = withoutStops;
    }

    // Truncate if too long
    if (slug.length > OPTIMAL_SLUG_LENGTH.ideal) {
      slug = generateSlug(slug, { maxLength: OPTIMAL_SLUG_LENGTH.ideal });
    }

    return slug;
  } catch {
    return slug;
  }
}
