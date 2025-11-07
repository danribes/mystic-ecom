/**
 * Canonical URL Utility (T228)
 *
 * Generates properly formatted canonical URLs for SEO.
 * Ensures consistency across all pages with HTTPS, trailing slashes, and proper formatting.
 *
 * @module canonicalUrl
 */

/**
 * Options for canonical URL generation
 */
export interface CanonicalUrlOptions {
  /**
   * Whether to add a trailing slash to URLs
   * @default true
   */
  trailingSlash?: boolean;

  /**
   * Whether to force HTTPS protocol
   * @default true
   */
  forceHttps?: boolean;

  /**
   * Whether to remove query parameters from canonical URL
   * @default true
   */
  removeQueryParams?: boolean;

  /**
   * Whether to remove URL fragments (hash)
   * @default true
   */
  removeFragment?: boolean;

  /**
   * Convert URL to lowercase
   * @default false
   */
  lowercase?: boolean;
}

/**
 * Default options for canonical URL generation
 */
const DEFAULT_OPTIONS: Required<CanonicalUrlOptions> = {
  trailingSlash: true,
  forceHttps: true,
  removeQueryParams: true,
  removeFragment: true,
  lowercase: false,
};

/**
 * Generates a canonical URL from a pathname and base URL
 *
 * @param pathname - The pathname of the page (e.g., "/about", "/courses/123")
 * @param baseUrl - The base URL of the site (e.g., "https://example.com")
 * @param options - Optional configuration for URL generation
 * @returns Properly formatted canonical URL
 *
 * @example
 * ```ts
 * generateCanonicalUrl('/about', 'https://example.com')
 * // Returns: "https://example.com/about/"
 *
 * generateCanonicalUrl('/courses/123?utm_source=email', 'https://example.com')
 * // Returns: "https://example.com/courses/123/"
 *
 * generateCanonicalUrl('/api/data', 'https://example.com', { trailingSlash: false })
 * // Returns: "https://example.com/api/data"
 * ```
 */
export function generateCanonicalUrl(
  pathname: string,
  baseUrl: string,
  options: CanonicalUrlOptions = {}
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Ensure baseUrl doesn't have trailing slash
  let cleanBaseUrl = baseUrl.trim().replace(/\/+$/, '');

  // Force HTTPS if requested
  if (opts.forceHttps && cleanBaseUrl.startsWith('http://')) {
    cleanBaseUrl = cleanBaseUrl.replace(/^http:\/\//, 'https://');
  }

  // Clean pathname
  let cleanPathname = pathname.trim();

  // Extract query parameters and fragments first
  let queryString = '';
  let fragment = '';

  if (cleanPathname.includes('?')) {
    const parts = cleanPathname.split('?');
    cleanPathname = parts[0];
    queryString = '?' + parts.slice(1).join('?');
  }

  if (cleanPathname.includes('#')) {
    const parts = cleanPathname.split('#');
    cleanPathname = parts[0];
    fragment = '#' + parts.slice(1).join('#');
  }

  // Handle query string in fragment (edge case: #fragment?query)
  if (fragment.includes('?') && queryString === '') {
    const parts = fragment.split('?');
    fragment = parts[0];
    queryString = '?' + parts.slice(1).join('?');
  }

  // Ensure pathname starts with /
  if (!cleanPathname.startsWith('/')) {
    cleanPathname = '/' + cleanPathname;
  }

  // Remove trailing slash temporarily for consistency
  cleanPathname = cleanPathname.replace(/\/+$/, '');

  // Convert to lowercase if requested
  if (opts.lowercase) {
    cleanPathname = cleanPathname.toLowerCase();
  }

  // Handle trailing slash
  if (opts.trailingSlash) {
    // Add trailing slash unless it's the root path
    if (cleanPathname === '' || cleanPathname === '/') {
      cleanPathname = '/';
    } else {
      // Don't add trailing slash to file extensions (e.g., /sitemap.xml, /robots.txt)
      const hasExtension = /\.[a-zA-Z0-9]+$/.test(cleanPathname);
      if (!hasExtension) {
        cleanPathname = cleanPathname + '/';
      }
    }
  }

  // Add back query parameters and fragments based on options
  if (!opts.removeQueryParams && queryString) {
    cleanPathname += queryString;
  }

  if (!opts.removeFragment && fragment) {
    cleanPathname += fragment;
  }

  // Construct final URL
  const canonicalUrl = `${cleanBaseUrl}${cleanPathname}`;

  return canonicalUrl;
}

/**
 * Generates a canonical URL from Astro context
 *
 * @param astroUrl - The Astro.url object
 * @param astroSite - The Astro.site object (from astro.config)
 * @param customCanonical - Optional custom canonical URL (takes precedence)
 * @param options - Optional configuration for URL generation
 * @returns Properly formatted canonical URL
 *
 * @example
 * ```astro
 * ---
 * import { generateCanonicalUrlFromAstro } from '@/lib/canonicalUrl';
 *
 * const canonical = generateCanonicalUrlFromAstro(Astro.url, Astro.site);
 * ---
 * <link rel="canonical" href={canonical} />
 * ```
 */
export function generateCanonicalUrlFromAstro(
  astroUrl: URL,
  astroSite: URL | undefined,
  customCanonical?: string,
  options: CanonicalUrlOptions = {}
): string {
  // If custom canonical is provided, use it (but still apply transformations)
  if (customCanonical) {
    try {
      const url = new URL(customCanonical);
      return generateCanonicalUrl(url.pathname, url.origin, options);
    } catch {
      // If customCanonical is not a full URL, treat it as a pathname
      const baseUrl = astroSite?.origin || astroUrl.origin;
      return generateCanonicalUrl(customCanonical, baseUrl, options);
    }
  }

  // Use Astro.site if available, fallback to Astro.url.origin
  const baseUrl = astroSite?.origin || astroUrl.origin;
  const pathname = astroUrl.pathname;

  return generateCanonicalUrl(pathname, baseUrl, options);
}

/**
 * Validates if a URL is a properly formatted canonical URL
 *
 * @param url - The URL to validate
 * @returns Object with validation result and any issues found
 *
 * @example
 * ```ts
 * validateCanonicalUrl('https://example.com/about/')
 * // Returns: { valid: true, issues: [] }
 *
 * validateCanonicalUrl('http://example.com/about?page=2')
 * // Returns: { valid: false, issues: ['Should use HTTPS', 'Contains query parameters'] }
 * ```
 */
export function validateCanonicalUrl(url: string): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  try {
    const parsedUrl = new URL(url);

    // Check protocol
    if (parsedUrl.protocol !== 'https:') {
      issues.push('Should use HTTPS protocol');
    }

    // Check for query parameters
    if (parsedUrl.search) {
      issues.push('Contains query parameters');
    }

    // Check for fragments
    if (parsedUrl.hash) {
      issues.push('Contains URL fragment (hash)');
    }

    // Check for trailing slash (except for files with extensions)
    const hasExtension = /\.[a-zA-Z0-9]+$/.test(parsedUrl.pathname);
    if (!hasExtension && parsedUrl.pathname !== '/' && !parsedUrl.pathname.endsWith('/')) {
      issues.push('Missing trailing slash');
    }

    // Check for double slashes in path
    if (parsedUrl.pathname.includes('//')) {
      issues.push('Contains double slashes in path');
    }

    // Check for uppercase letters (optional - some prefer lowercase)
    // This is commented out as it's not a strict requirement
    // if (parsedUrl.pathname !== parsedUrl.pathname.toLowerCase()) {
    //   issues.push('Contains uppercase letters in path');
    // }

  } catch (error) {
    issues.push('Invalid URL format');
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

/**
 * Normalizes multiple URL variations to a single canonical format
 * Useful for checking if URLs point to the same resource
 *
 * @param urls - Array of URLs to normalize
 * @param options - Optional configuration for URL generation
 * @returns Array of normalized canonical URLs
 *
 * @example
 * ```ts
 * normalizeUrls([
 *   'https://example.com/about',
 *   'http://example.com/about/',
 *   'https://example.com/about?utm_source=email'
 * ])
 * // Returns: ['https://example.com/about/', 'https://example.com/about/', 'https://example.com/about/']
 * // All resolve to the same canonical URL
 * ```
 */
export function normalizeUrls(
  urls: string[],
  options: CanonicalUrlOptions = {}
): string[] {
  return urls.map((url) => {
    try {
      const parsedUrl = new URL(url);
      return generateCanonicalUrl(parsedUrl.pathname, parsedUrl.origin, options);
    } catch {
      return url; // Return original if invalid
    }
  });
}

/**
 * Checks if two URLs are canonically equivalent
 * (point to the same resource after normalization)
 *
 * @param url1 - First URL
 * @param url2 - Second URL
 * @param options - Optional configuration for URL generation
 * @returns True if URLs are canonically equivalent
 *
 * @example
 * ```ts
 * areUrlsEquivalent(
 *   'https://example.com/about',
 *   'http://example.com/about?utm_source=email'
 * )
 * // Returns: true
 * ```
 */
export function areUrlsEquivalent(
  url1: string,
  url2: string,
  options: CanonicalUrlOptions = {}
): boolean {
  const [canonical1, canonical2] = normalizeUrls([url1, url2], options);
  return canonical1 === canonical2;
}
