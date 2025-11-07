/**
 * Sitemap Generation Utilities (T229)
 *
 * Functions for generating XML sitemaps according to sitemaps.org protocol.
 * Includes URL generation, priority setting, and change frequency management.
 *
 * @see https://www.sitemaps.org/protocol.html
 * @see https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
 */

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Sitemap URL entry
 * @see https://www.sitemaps.org/protocol.html#xmlTagDefinitions
 */
export interface SitemapUrl {
  /**
   * URL of the page (required)
   * Must be absolute URL with protocol
   */
  loc: string;

  /**
   * Date of last modification (optional)
   * ISO 8601 format: YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS+00:00
   */
  lastmod?: string;

  /**
   * How frequently the page is likely to change (optional)
   * Hint to crawlers, not a command
   */
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';

  /**
   * Priority of this URL relative to other URLs on your site (optional)
   * Valid values: 0.0 to 1.0 (default: 0.5)
   */
  priority?: number;
}

/**
 * Options for generating sitemaps
 */
export interface SitemapOptions {
  /**
   * Base URL of the site (e.g., "https://example.com")
   */
  baseUrl: string;

  /**
   * Include static pages in sitemap
   * @default true
   */
  includeStatic?: boolean;

  /**
   * Include course pages in sitemap
   * @default true
   */
  includeCourses?: boolean;

  /**
   * Include event pages in sitemap
   * @default true
   */
  includeEvents?: boolean;

  /**
   * Include product pages in sitemap
   * @default true
   */
  includeProducts?: boolean;

  /**
   * Default change frequency for pages without specific value
   * @default 'weekly'
   */
  defaultChangefreq?: SitemapUrl['changefreq'];

  /**
   * Default priority for pages without specific value
   * @default 0.5
   */
  defaultPriority?: number;
}

/**
 * Sitemap generation result
 */
export interface SitemapResult {
  /**
   * Array of sitemap URLs
   */
  urls: SitemapUrl[];

  /**
   * Total number of URLs in sitemap
   */
  count: number;

  /**
   * Date sitemap was generated
   */
  generatedAt: Date;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Default sitemap options
 */
export const DEFAULT_SITEMAP_OPTIONS: Required<Omit<SitemapOptions, 'baseUrl'>> = {
  includeStatic: true,
  includeCourses: true,
  includeEvents: true,
  includeProducts: true,
  defaultChangefreq: 'weekly',
  defaultPriority: 0.5,
};

/**
 * Static pages with their priorities and change frequencies
 */
export const STATIC_PAGES: Array<Omit<SitemapUrl, 'loc'> & { path: string }> = [
  { path: '/', priority: 1.0, changefreq: 'daily' },
  { path: '/about/', priority: 0.8, changefreq: 'monthly' },
  { path: '/contact/', priority: 0.8, changefreq: 'monthly' },
  { path: '/courses/', priority: 0.9, changefreq: 'daily' },
  { path: '/events/', priority: 0.9, changefreq: 'daily' },
  { path: '/products/', priority: 0.9, changefreq: 'daily' },
  { path: '/blog/', priority: 0.8, changefreq: 'weekly' },
  { path: '/privacy-policy/', priority: 0.5, changefreq: 'yearly' },
  { path: '/terms-of-service/', priority: 0.5, changefreq: 'yearly' },
  { path: '/refund-policy/', priority: 0.5, changefreq: 'yearly' },
  { path: '/cancellation-policy/', priority: 0.5, changefreq: 'yearly' },
];

/**
 * Maximum URLs per sitemap (sitemaps.org limit: 50,000)
 */
export const MAX_SITEMAP_URLS = 50000;

/**
 * Maximum sitemap file size (sitemaps.org limit: 50MB uncompressed)
 */
export const MAX_SITEMAP_SIZE_MB = 50;

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Validate a URL for sitemap inclusion
 *
 * @param url - URL to validate
 * @returns True if valid
 */
export function isValidSitemapUrl(url: string): boolean {
  try {
    const parsed = new URL(url);

    // Must be HTTP or HTTPS
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }

    // Should not contain fragments
    if (parsed.hash) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Validate priority value
 *
 * @param priority - Priority value to validate
 * @returns Valid priority (0.0 to 1.0)
 */
export function validatePriority(priority: number): number {
  if (priority < 0) return 0.0;
  if (priority > 1) return 1.0;
  return Math.round(priority * 10) / 10; // Round to 1 decimal place
}

/**
 * Format date for sitemap (ISO 8601)
 *
 * @param date - Date to format
 * @returns ISO 8601 formatted date string
 */
export function formatSitemapDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(d.getTime())) {
    throw new Error('Invalid date');
  }

  // Return YYYY-MM-DD format (simpler and recommended by Google)
  return d.toISOString().split('T')[0];
}

/**
 * Create a sitemap URL entry
 *
 * @param options - URL entry options
 * @returns Sitemap URL entry
 */
export function createSitemapUrl(options: {
  loc: string;
  lastmod?: Date | string;
  changefreq?: SitemapUrl['changefreq'];
  priority?: number;
}): SitemapUrl {
  const url: SitemapUrl = {
    loc: options.loc,
  };

  if (options.lastmod) {
    url.lastmod = formatSitemapDate(options.lastmod);
  }

  if (options.changefreq) {
    url.changefreq = options.changefreq;
  }

  if (options.priority !== undefined) {
    url.priority = validatePriority(options.priority);
  }

  // Validate URL
  if (!isValidSitemapUrl(url.loc)) {
    throw new Error(`Invalid sitemap URL: ${url.loc}`);
  }

  return url;
}

/**
 * Generate static page URLs for sitemap
 *
 * @param baseUrl - Base URL of the site
 * @returns Array of sitemap URLs for static pages
 */
export function generateStaticPageUrls(baseUrl: string): SitemapUrl[] {
  const cleanBaseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash

  return STATIC_PAGES.map((page) =>
    createSitemapUrl({
      loc: `${cleanBaseUrl}${page.path}`,
      priority: page.priority,
      changefreq: page.changefreq,
    })
  );
}

/**
 * Generate course page URLs for sitemap
 *
 * @param baseUrl - Base URL of the site
 * @param courses - Array of courses from database
 * @returns Array of sitemap URLs for course pages
 */
export function generateCourseUrls(
  baseUrl: string,
  courses: Array<{ slug: string; updated_at?: Date | string }>
): SitemapUrl[] {
  const cleanBaseUrl = baseUrl.replace(/\/$/, '');

  return courses.map((course) =>
    createSitemapUrl({
      loc: `${cleanBaseUrl}/courses/${course.slug}/`,
      lastmod: course.updated_at,
      changefreq: 'weekly',
      priority: 0.8,
    })
  );
}

/**
 * Generate event page URLs for sitemap
 *
 * @param baseUrl - Base URL of the site
 * @param events - Array of events from database
 * @returns Array of sitemap URLs for event pages
 */
export function generateEventUrls(
  baseUrl: string,
  events: Array<{ slug: string; updated_at?: Date | string }>
): SitemapUrl[] {
  const cleanBaseUrl = baseUrl.replace(/\/$/, '');

  return events.map((event) =>
    createSitemapUrl({
      loc: `${cleanBaseUrl}/events/${event.slug}/`,
      lastmod: event.updated_at,
      changefreq: 'weekly',
      priority: 0.7,
    })
  );
}

/**
 * Generate product page URLs for sitemap
 *
 * @param baseUrl - Base URL of the site
 * @param products - Array of products from database
 * @returns Array of sitemap URLs for product pages
 */
export function generateProductUrls(
  baseUrl: string,
  products: Array<{ slug: string; updated_at?: Date | string }>
): SitemapUrl[] {
  const cleanBaseUrl = baseUrl.replace(/\/$/, '');

  return products.map((product) =>
    createSitemapUrl({
      loc: `${cleanBaseUrl}/products/${product.slug}/`,
      lastmod: product.updated_at,
      changefreq: 'weekly',
      priority: 0.8,
    })
  );
}

/**
 * Convert sitemap URLs to XML format
 *
 * @param urls - Array of sitemap URLs
 * @returns XML string
 */
export function generateSitemapXML(urls: SitemapUrl[]): string {
  const xmlUrls = urls
    .map((url) => {
      let xml = '  <url>\n';
      xml += `    <loc>${escapeXml(url.loc)}</loc>\n`;

      if (url.lastmod) {
        xml += `    <lastmod>${url.lastmod}</lastmod>\n`;
      }

      if (url.changefreq) {
        xml += `    <changefreq>${url.changefreq}</changefreq>\n`;
      }

      if (url.priority !== undefined) {
        xml += `    <priority>${url.priority.toFixed(1)}</priority>\n`;
      }

      xml += '  </url>';
      return xml;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlUrls}
</urlset>`;
}

/**
 * Escape XML special characters
 *
 * @param str - String to escape
 * @returns Escaped string
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Generate complete sitemap
 *
 * @param options - Sitemap generation options
 * @param data - Data for dynamic pages
 * @returns Sitemap result
 */
export async function generateSitemap(
  options: SitemapOptions,
  data: {
    courses?: Array<{ slug: string; updated_at?: Date | string }>;
    events?: Array<{ slug: string; updated_at?: Date | string }>;
    products?: Array<{ slug: string; updated_at?: Date | string }>;
  }
): Promise<SitemapResult> {
  const opts = { ...DEFAULT_SITEMAP_OPTIONS, ...options };
  const urls: SitemapUrl[] = [];

  // Add static pages
  if (opts.includeStatic) {
    urls.push(...generateStaticPageUrls(opts.baseUrl));
  }

  // Add course pages
  if (opts.includeCourses && data.courses) {
    urls.push(...generateCourseUrls(opts.baseUrl, data.courses));
  }

  // Add event pages
  if (opts.includeEvents && data.events) {
    urls.push(...generateEventUrls(opts.baseUrl, data.events));
  }

  // Add product pages
  if (opts.includeProducts && data.products) {
    urls.push(...generateProductUrls(opts.baseUrl, data.products));
  }

  // Check sitemap limits
  if (urls.length > MAX_SITEMAP_URLS) {
    console.warn(
      `Sitemap contains ${urls.length} URLs, exceeding the recommended limit of ${MAX_SITEMAP_URLS}. ` +
        'Consider splitting into multiple sitemaps.'
    );
  }

  return {
    urls,
    count: urls.length,
    generatedAt: new Date(),
  };
}

/**
 * Validate sitemap XML
 *
 * @param xml - XML string to validate
 * @returns Validation result
 */
export function validateSitemapXML(xml: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check XML declaration
  if (!xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')) {
    errors.push('Missing or invalid XML declaration');
  }

  // Check urlset element
  if (!xml.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')) {
    errors.push('Missing or invalid urlset element with namespace');
  }

  // Check closing urlset
  if (!xml.includes('</urlset>')) {
    errors.push('Missing closing urlset tag');
  }

  // Check for required loc elements
  const urlCount = (xml.match(/<url>/g) || []).length;
  const locCount = (xml.match(/<loc>/g) || []).length;

  if (urlCount !== locCount) {
    errors.push(`URL count (${urlCount}) does not match loc count (${locCount})`);
  }

  // Check size limit (50MB uncompressed)
  const sizeInMB = Buffer.byteLength(xml, 'utf8') / (1024 * 1024);
  if (sizeInMB > MAX_SITEMAP_SIZE_MB) {
    errors.push(
      `Sitemap size (${sizeInMB.toFixed(2)}MB) exceeds maximum of ${MAX_SITEMAP_SIZE_MB}MB`
    );
  }

  // Check URL limit
  if (urlCount > MAX_SITEMAP_URLS) {
    errors.push(`URL count (${urlCount}) exceeds maximum of ${MAX_SITEMAP_URLS}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
