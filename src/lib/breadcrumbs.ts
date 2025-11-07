/**
 * Breadcrumb Generation Utilities (T232)
 *
 * Functions for generating breadcrumb navigation from URLs.
 * Includes both visual breadcrumb data and Schema.org BreadcrumbList structured data.
 *
 * @see https://schema.org/BreadcrumbList
 * @see https://developers.google.com/search/docs/appearance/structured-data/breadcrumb
 */

import type { BreadcrumbItem } from './structuredData';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Breadcrumb configuration options
 */
export interface BreadcrumbOptions {
  /**
   * Base URL of the site (e.g., "https://example.com")
   */
  baseUrl: string;

  /**
   * Include the home link
   * @default true
   */
  includeHome?: boolean;

  /**
   * Home link label
   * @default 'Home'
   */
  homeLabel?: string;

  /**
   * Custom labels for specific path segments
   * @example { 'courses': 'All Courses', 'events': 'Upcoming Events' }
   */
  customLabels?: Record<string, string>;

  /**
   * Maximum number of breadcrumb items
   * @default undefined (no limit)
   */
  maxItems?: number;
}

/**
 * Breadcrumb item with visual properties
 */
export interface Breadcrumb extends BreadcrumbItem {
  /**
   * Display name for the breadcrumb
   */
  name: string;

  /**
   * Full URL for the breadcrumb
   */
  url: string;

  /**
   * Whether this is the current page (last item)
   */
  isCurrent: boolean;

  /**
   * Position in the breadcrumb trail (1-indexed)
   */
  position: number;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Default breadcrumb options
 */
export const DEFAULT_BREADCRUMB_OPTIONS: Required<Omit<BreadcrumbOptions, 'maxItems' | 'customLabels'>> = {
  baseUrl: '',
  includeHome: true,
  homeLabel: 'Home',
};

/**
 * Default labels for common path segments
 * These can be overridden with customLabels option
 */
export const DEFAULT_SEGMENT_LABELS: Record<string, string> = {
  // Main sections
  courses: 'Courses',
  events: 'Events',
  products: 'Products',
  blog: 'Blog',
  about: 'About',
  contact: 'Contact',

  // Account/User sections
  account: 'Account',
  profile: 'Profile',
  settings: 'Settings',
  dashboard: 'Dashboard',

  // Shopping
  cart: 'Cart',
  checkout: 'Checkout',
  orders: 'Orders',

  // Admin
  admin: 'Admin',

  // Common actions
  new: 'New',
  edit: 'Edit',
  view: 'View',
  create: 'Create',
};

/**
 * Path segments that should not appear in breadcrumbs
 */
export const EXCLUDED_SEGMENTS = new Set([
  '',
  'undefined',
  'null',
  'api',
  '_next',
  '_astro',
]);

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Normalize a path segment to a display name
 *
 * @param segment - URL path segment (e.g., "my-course")
 * @returns Human-readable label (e.g., "My Course")
 *
 * @example
 * normalizeSegment('my-course') // => 'My Course'
 * normalizeSegment('advanced-yoga-101') // => 'Advanced Yoga 101'
 */
export function normalizeSegment(segment: string): string {
  if (!segment || segment.trim() === '') {
    return '';
  }

  // Replace hyphens and underscores with spaces
  let normalized = segment.replace(/[-_]/g, ' ');

  // Capitalize first letter of each word
  normalized = normalized
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  return normalized;
}

/**
 * Check if a segment should be excluded from breadcrumbs
 *
 * @param segment - URL path segment
 * @returns True if segment should be excluded
 */
export function shouldExcludeSegment(segment: string): boolean {
  if (!segment || segment.trim() === '') {
    return true;
  }

  return EXCLUDED_SEGMENTS.has(segment.toLowerCase());
}

/**
 * Get label for a path segment
 *
 * @param segment - URL path segment
 * @param customLabels - Custom label mappings
 * @returns Display label for the segment
 *
 * @example
 * getSegmentLabel('courses') // => 'Courses'
 * getSegmentLabel('my-course', {}) // => 'My Course'
 * getSegmentLabel('courses', { courses: 'All Courses' }) // => 'All Courses'
 */
export function getSegmentLabel(segment: string, customLabels?: Record<string, string>): string {
  // Check custom labels first
  if (customLabels && segment in customLabels) {
    return customLabels[segment];
  }

  // Check default labels
  if (segment in DEFAULT_SEGMENT_LABELS) {
    return DEFAULT_SEGMENT_LABELS[segment];
  }

  // Normalize the segment
  return normalizeSegment(segment);
}

/**
 * Parse URL pathname into breadcrumb segments
 *
 * @param pathname - URL pathname (e.g., "/courses/meditation-basics")
 * @returns Array of path segments
 *
 * @example
 * parsePathname('/courses/meditation-basics')
 * // => ['courses', 'meditation-basics']
 */
export function parsePathname(pathname: string): string[] {
  if (!pathname || pathname === '/') {
    return [];
  }

  // Remove leading/trailing slashes and split
  const segments = pathname
    .replace(/^\/+|\/+$/g, '')
    .split('/')
    .filter(segment => !shouldExcludeSegment(segment));

  return segments;
}

/**
 * Build URL from base and path segments
 *
 * @param baseUrl - Base URL
 * @param segments - Path segments to append
 * @returns Full URL
 *
 * @example
 * buildUrl('https://example.com', ['courses', 'meditation'])
 * // => 'https://example.com/courses/meditation'
 */
export function buildUrl(baseUrl: string, segments: string[]): string {
  // Remove trailing slash from base URL
  const cleanBase = baseUrl.replace(/\/+$/, '');

  if (segments.length === 0) {
    return cleanBase;
  }

  // Join segments with slashes
  const path = segments.join('/');

  return `${cleanBase}/${path}`;
}

// ============================================================================
// Main Breadcrumb Generation
// ============================================================================

/**
 * Generate breadcrumbs from URL pathname
 *
 * @param pathname - URL pathname (e.g., "/courses/meditation-basics")
 * @param options - Breadcrumb generation options
 * @returns Array of breadcrumb items
 *
 * @example
 * ```typescript
 * const breadcrumbs = generateBreadcrumbs('/courses/meditation-basics', {
 *   baseUrl: 'https://example.com',
 *   customLabels: { 'meditation-basics': 'Meditation for Beginners' }
 * });
 *
 * // Result:
 * // [
 * //   { name: 'Home', url: 'https://example.com', isCurrent: false, position: 1 },
 * //   { name: 'Courses', url: 'https://example.com/courses', isCurrent: false, position: 2 },
 * //   { name: 'Meditation for Beginners', url: 'https://example.com/courses/meditation-basics', isCurrent: true, position: 3 }
 * // ]
 * ```
 */
export function generateBreadcrumbs(
  pathname: string,
  options: BreadcrumbOptions
): Breadcrumb[] {
  const opts = { ...DEFAULT_BREADCRUMB_OPTIONS, ...options };
  const breadcrumbs: Breadcrumb[] = [];

  // Add home breadcrumb
  if (opts.includeHome) {
    breadcrumbs.push({
      name: opts.homeLabel,
      url: opts.baseUrl || '/',
      isCurrent: pathname === '/' || pathname === '',
      position: 1,
    });
  }

  // If we're on the homepage, return just home
  if (pathname === '/' || pathname === '') {
    return breadcrumbs;
  }

  // Parse pathname into segments
  const segments = parsePathname(pathname);

  // Generate breadcrumb for each segment
  segments.forEach((segment, index) => {
    const pathSoFar = segments.slice(0, index + 1);
    const url = buildUrl(opts.baseUrl, pathSoFar);
    const isLast = index === segments.length - 1;

    breadcrumbs.push({
      name: getSegmentLabel(segment, opts.customLabels),
      url,
      isCurrent: isLast,
      position: breadcrumbs.length + 1,
    });
  });

  // Apply max items limit if specified
  if (opts.maxItems && breadcrumbs.length > opts.maxItems) {
    // Keep first (home) and last (current) items, truncate middle
    const first = breadcrumbs[0];
    const last = breadcrumbs[breadcrumbs.length - 1];
    const remaining = opts.maxItems - 2;

    if (remaining > 0) {
      // Take the most recent items before the current page
      const middle = breadcrumbs.slice(-remaining - 1, -1);
      return [first, ...middle, last].map((item, index) => ({
        ...item,
        position: index + 1,
      }));
    } else {
      // Only keep home and current
      return [
        { ...first, position: 1 },
        { ...last, position: 2 },
      ];
    }
  }

  return breadcrumbs;
}

/**
 * Convert breadcrumbs to BreadcrumbItem format for structured data
 *
 * @param breadcrumbs - Array of breadcrumb items
 * @returns Array of BreadcrumbItem for Schema.org
 */
export function breadcrumbsToSchemaItems(breadcrumbs: Breadcrumb[]): BreadcrumbItem[] {
  return breadcrumbs.map(breadcrumb => ({
    name: breadcrumb.name,
    url: breadcrumb.url,
  }));
}

/**
 * Generate breadcrumbs with structured data
 *
 * Convenience function that generates both breadcrumbs and Schema.org data
 *
 * @param pathname - URL pathname
 * @param options - Breadcrumb generation options
 * @returns Object with breadcrumbs array and schema items
 *
 * @example
 * ```typescript
 * const { breadcrumbs, schemaItems } = generateBreadcrumbsWithSchema(
 *   '/courses/meditation',
 *   { baseUrl: 'https://example.com' }
 * );
 *
 * // Use breadcrumbs for visual display
 * // Use schemaItems with generateBreadcrumbListSchema() for JSON-LD
 * ```
 */
export function generateBreadcrumbsWithSchema(
  pathname: string,
  options: BreadcrumbOptions
): {
  breadcrumbs: Breadcrumb[];
  schemaItems: BreadcrumbItem[];
} {
  const breadcrumbs = generateBreadcrumbs(pathname, options);
  const schemaItems = breadcrumbsToSchemaItems(breadcrumbs);

  return {
    breadcrumbs,
    schemaItems,
  };
}

/**
 * Get breadcrumb label for a specific path
 *
 * Useful for getting the current page title from the URL
 *
 * @param pathname - URL pathname
 * @param options - Breadcrumb generation options
 * @returns Label for the last breadcrumb (current page)
 *
 * @example
 * getCurrentPageLabel('/courses/meditation-basics')
 * // => 'Meditation Basics'
 */
export function getCurrentPageLabel(
  pathname: string,
  options?: Partial<BreadcrumbOptions>
): string {
  if (pathname === '/' || pathname === '') {
    return options?.homeLabel || 'Home';
  }

  const breadcrumbs = generateBreadcrumbs(pathname, {
    baseUrl: options?.baseUrl || '',
    ...options,
  });

  if (breadcrumbs.length === 0) {
    return '';
  }

  return breadcrumbs[breadcrumbs.length - 1].name;
}
