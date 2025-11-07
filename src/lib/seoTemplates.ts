/**
 * T236: SEO Templates
 *
 * Template functions for generating SEO-optimized titles and descriptions
 * for different page types. Ensures proper character limits and best practices.
 *
 * Character Limits:
 * - Title: 50-60 characters (optimal for search results)
 * - Description: 150-160 characters (optimal for search snippets)
 *
 * Best Practices:
 * - Include site name in title
 * - Use relevant keywords naturally
 * - Include action words in descriptions
 * - Keep titles concise and descriptive
 * - Make descriptions compelling for click-through
 */

// ============================================================================
// Constants
// ============================================================================

export const SEO_LIMITS = {
  TITLE_MIN: 30,
  TITLE_MAX: 60,
  TITLE_IDEAL: 55,
  DESCRIPTION_MIN: 50,
  DESCRIPTION_MAX: 160,
  DESCRIPTION_IDEAL: 155,
} as const;

export const DEFAULT_SITE_NAME = 'Spirituality Platform';

// ============================================================================
// Types
// ============================================================================

export interface SEOTemplate {
  title: string;
  description: string;
}

export interface CourseData {
  courseName: string;
  instructor?: string;
  category?: string;
  level?: string;
  price?: number;
  currency?: string;
}

export interface EventData {
  eventName: string;
  date: string; // Format: "Jan 15, 2025" or ISO date
  location?: string;
  type?: string;
  price?: number;
  currency?: string;
}

export interface ProductData {
  productName: string;
  category?: string;
  price?: number;
  currency?: string;
  format?: string; // PDF, Video, Audio, etc.
}

export interface BlogData {
  title: string;
  category?: string;
  author?: string;
  publishDate?: string;
}

export interface PageData {
  pageName: string;
  category?: string;
  keywords?: string[];
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Truncate text to specified length, breaking at word boundary
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }

  // Account for "..." in the length
  const targetLength = maxLength - 3;

  // Find last space before targetLength
  const truncated = text.substring(0, targetLength);
  const lastSpace = truncated.lastIndexOf(' ');

  if (lastSpace > 0) {
    return truncated.substring(0, lastSpace) + '...';
  }

  // No space found, just truncate
  return truncated + '...';
}

/**
 * Ensure title is within optimal length
 */
export function optimizeTitle(title: string, siteName: string = DEFAULT_SITE_NAME): string {
  // If already includes site name, just truncate if needed
  if (title.includes(siteName)) {
    return truncate(title, SEO_LIMITS.TITLE_MAX);
  }

  // Add site name
  const withSiteName = `${title} | ${siteName}`;

  // If within limits, return as is
  if (withSiteName.length <= SEO_LIMITS.TITLE_MAX) {
    return withSiteName;
  }

  // Truncate title part to fit with site name
  // Available length = TITLE_MAX - " | ".length - siteName.length
  const availableLength = SEO_LIMITS.TITLE_MAX - 3 - siteName.length;
  const truncatedTitle = truncate(title, availableLength);

  const result = `${truncatedTitle} | ${siteName}`;

  // Final safety check - ensure result doesn't exceed limit
  if (result.length > SEO_LIMITS.TITLE_MAX) {
    // If still too long, truncate the whole thing
    return truncate(result, SEO_LIMITS.TITLE_MAX);
  }

  return result;
}

/**
 * Ensure description is within optimal length
 */
export function optimizeDescription(description: string): string {
  if (description.length <= SEO_LIMITS.DESCRIPTION_MAX) {
    return description;
  }

  return truncate(description, SEO_LIMITS.DESCRIPTION_MAX);
}

/**
 * Format price for display
 */
export function formatPrice(price: number, currency: string = 'USD'): string {
  const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency;

  if (price === 0) {
    return 'Free';
  }

  return `${symbol}${price.toFixed(2)}`;
}

/**
 * Format date for display (converts ISO to readable format)
 */
export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);

    // Check if valid date
    if (isNaN(date.getTime())) {
      return dateString; // Return original if invalid
    }

    // Format as "Jan 15, 2025"
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch (error) {
    return dateString; // Return original on error
  }
}

// ============================================================================
// Template Functions - Course
// ============================================================================

/**
 * Generate SEO metadata for course pages
 *
 * Template: `{courseName} - Online Course | {siteName}`
 *
 * @example
 * generateCourseTemplate({
 *   courseName: 'Mindfulness Meditation',
 *   instructor: 'Sarah Johnson',
 *   category: 'Meditation',
 *   level: 'Beginner'
 * })
 * // Returns:
 * // title: "Mindfulness Meditation - Online Course | Spirituality Platform"
 * // description: "Learn Mindfulness Meditation with expert instructor Sarah Johnson. Beginner level meditation course. Start your spiritual journey today."
 */
export function generateCourseTemplate(
  data: CourseData,
  siteName: string = DEFAULT_SITE_NAME
): SEOTemplate {
  const { courseName, instructor, category, level, price, currency = 'USD' } = data;

  // Build title
  let title = `${courseName} - Online Course`;

  if (level) {
    title = `${courseName} - ${level} Course`;
  }

  title = optimizeTitle(title, siteName);

  // Build description
  let descriptionParts: string[] = [];

  // Opening
  descriptionParts.push(`Learn ${courseName}`);

  // Instructor
  if (instructor) {
    descriptionParts.push(`with expert instructor ${instructor}`);
  }

  // Level and category
  if (level && category) {
    descriptionParts.push(`${level} level ${category.toLowerCase()} course`);
  } else if (level) {
    descriptionParts.push(`${level} level course`);
  } else if (category) {
    descriptionParts.push(`${category} course`);
  }

  // Price
  if (price !== undefined) {
    const priceText = formatPrice(price, currency);
    if (priceText === 'Free') {
      descriptionParts.push('Free course');
    }
  }

  // Call to action
  descriptionParts.push('Start your spiritual journey today');

  const description = descriptionParts.join('. ') + '.';

  return {
    title,
    description: optimizeDescription(description),
  };
}

// ============================================================================
// Template Functions - Event
// ============================================================================

/**
 * Generate SEO metadata for event pages
 *
 * Template: `{eventName} - {date} | {siteName}`
 *
 * @example
 * generateEventTemplate({
 *   eventName: 'Online Meditation Retreat',
 *   date: '2025-01-15',
 *   location: 'Virtual',
 *   type: 'Workshop'
 * })
 * // Returns:
 * // title: "Online Meditation Retreat - Jan 15, 2025 | Spirituality Platform"
 * // description: "Join our Online Meditation Retreat on Jan 15, 2025. Virtual workshop featuring meditation practices. Register now and secure your spot."
 */
export function generateEventTemplate(
  data: EventData,
  siteName: string = DEFAULT_SITE_NAME
): SEOTemplate {
  const { eventName, date, location, type, price, currency = 'USD' } = data;

  // Format date
  const formattedDate = formatDate(date);

  // Build title
  const title = optimizeTitle(`${eventName} - ${formattedDate}`, siteName);

  // Build description
  let descriptionParts: string[] = [];

  // Opening
  descriptionParts.push(`Join our ${eventName} on ${formattedDate}`);

  // Location and type
  if (location && type) {
    descriptionParts.push(`${location} ${type.toLowerCase()} featuring meditation practices`);
  } else if (location) {
    descriptionParts.push(`${location} event featuring meditation practices`);
  } else if (type) {
    descriptionParts.push(`${type} featuring meditation practices`);
  }

  // Price
  if (price !== undefined) {
    const priceText = formatPrice(price, currency);
    if (priceText === 'Free') {
      descriptionParts.push('Free admission');
    } else {
      descriptionParts.push(`Tickets from ${priceText}`);
    }
  }

  // Call to action
  descriptionParts.push('Register now and secure your spot');

  const description = descriptionParts.join('. ') + '.';

  return {
    title,
    description: optimizeDescription(description),
  };
}

// ============================================================================
// Template Functions - Product
// ============================================================================

/**
 * Generate SEO metadata for product pages
 *
 * Template: `{productName} - Digital Download | {siteName}`
 *
 * @example
 * generateProductTemplate({
 *   productName: 'Guided Meditation Audio Pack',
 *   category: 'Audio',
 *   price: 29.99,
 *   format: 'MP3'
 * })
 * // Returns:
 * // title: "Guided Meditation Audio Pack - Digital Download | ..."
 * // description: "Download Guided Meditation Audio Pack instantly. MP3 format digital product. Get instant access after purchase for $29.99."
 */
export function generateProductTemplate(
  data: ProductData,
  siteName: string = DEFAULT_SITE_NAME
): SEOTemplate {
  const { productName, category, price, currency = 'USD', format } = data;

  // Build title
  let title = `${productName} - Digital Download`;

  if (category) {
    title = `${productName} - ${category}`;
  }

  title = optimizeTitle(title, siteName);

  // Build description
  let descriptionParts: string[] = [];

  // Opening
  descriptionParts.push(`Download ${productName} instantly`);

  // Format and category
  if (format && category) {
    descriptionParts.push(`${format} format ${category.toLowerCase()} digital product`);
  } else if (format) {
    descriptionParts.push(`${format} format digital product`);
  } else if (category) {
    descriptionParts.push(`${category} digital product`);
  }

  // Price and CTA
  if (price !== undefined) {
    const priceText = formatPrice(price, currency);
    if (priceText === 'Free') {
      descriptionParts.push('Free download available now');
    } else {
      descriptionParts.push(`Get instant access after purchase for ${priceText}`);
    }
  } else {
    descriptionParts.push('Get instant access after purchase');
  }

  const description = descriptionParts.join('. ') + '.';

  return {
    title,
    description: optimizeDescription(description),
  };
}

// ============================================================================
// Template Functions - Blog
// ============================================================================

/**
 * Generate SEO metadata for blog post pages
 *
 * @example
 * generateBlogTemplate({
 *   title: 'How to Start a Meditation Practice',
 *   category: 'Meditation',
 *   author: 'Jane Smith'
 * })
 */
export function generateBlogTemplate(
  data: BlogData,
  siteName: string = DEFAULT_SITE_NAME
): SEOTemplate {
  const { title: postTitle, category, author, publishDate } = data;

  // Build title
  let title = postTitle;

  if (category) {
    title = `${postTitle} - ${category} Guide`;
  }

  title = optimizeTitle(title, siteName);

  // Build description
  let descriptionParts: string[] = [];

  // Opening
  descriptionParts.push(`Discover ${postTitle.toLowerCase()}`);

  // Author
  if (author) {
    descriptionParts.push(`Expert insights from ${author}`);
  }

  // Category
  if (category) {
    descriptionParts.push(`Comprehensive ${category.toLowerCase()} guide with practical tips`);
  }

  // Call to action
  descriptionParts.push('Read the full article now');

  const description = descriptionParts.join('. ') + '.';

  return {
    title,
    description: optimizeDescription(description),
  };
}

// ============================================================================
// Template Functions - Generic Page
// ============================================================================

/**
 * Generate SEO metadata for generic pages
 *
 * @example
 * generatePageTemplate({
 *   pageName: 'About Us',
 *   keywords: ['spirituality', 'meditation', 'mindfulness']
 * })
 */
export function generatePageTemplate(
  data: PageData,
  siteName: string = DEFAULT_SITE_NAME
): SEOTemplate {
  const { pageName, category, keywords } = data;

  // Build title
  let title = pageName;

  if (category) {
    title = `${pageName} - ${category}`;
  }

  title = optimizeTitle(title, siteName);

  // Build description
  let descriptionParts: string[] = [];

  // Opening
  descriptionParts.push(`${pageName} at ${siteName}`);

  // Keywords integration
  if (keywords && keywords.length > 0) {
    const keywordPhrase = keywords.slice(0, 3).join(', ');
    descriptionParts.push(`Explore ${keywordPhrase} and more`);
  }

  // Call to action
  descriptionParts.push('Learn more about our offerings');

  const description = descriptionParts.join('. ') + '.';

  return {
    title,
    description: optimizeDescription(description),
  };
}

// ============================================================================
// Template Functions - Homepage
// ============================================================================

/**
 * Generate SEO metadata for homepage
 */
export function generateHomepageTemplate(
  description?: string,
  siteName: string = DEFAULT_SITE_NAME
): SEOTemplate {
  return {
    title: siteName,
    description:
      description ||
      'Discover spiritual growth through online courses, transformative events, and inspiring digital content. Join our community of seekers on a journey toward enlightenment and inner peace.',
  };
}

// ============================================================================
// Template Validation
// ============================================================================

/**
 * Validate that a template meets SEO best practices
 */
export function validateTemplate(template: SEOTemplate): {
  isValid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];

  // Check title length
  if (template.title.length < SEO_LIMITS.TITLE_MIN) {
    warnings.push(`Title too short (${template.title.length} chars, min ${SEO_LIMITS.TITLE_MIN})`);
  }

  if (template.title.length > SEO_LIMITS.TITLE_MAX) {
    warnings.push(`Title too long (${template.title.length} chars, max ${SEO_LIMITS.TITLE_MAX})`);
  }

  // Check description length
  if (template.description.length < SEO_LIMITS.DESCRIPTION_MIN) {
    warnings.push(
      `Description too short (${template.description.length} chars, min ${SEO_LIMITS.DESCRIPTION_MIN})`
    );
  }

  if (template.description.length > SEO_LIMITS.DESCRIPTION_MAX) {
    warnings.push(
      `Description too long (${template.description.length} chars, max ${SEO_LIMITS.DESCRIPTION_MAX})`
    );
  }

  // Check for site name in title
  if (!template.title.includes('|') && !template.title.includes(DEFAULT_SITE_NAME)) {
    warnings.push('Title should include site name separated by |');
  }

  return {
    isValid: warnings.length === 0,
    warnings,
  };
}
