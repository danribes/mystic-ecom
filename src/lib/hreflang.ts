/**
 * T237: Hreflang Tags for Internationalization
 *
 * Utilities for generating hreflang tags that indicate alternate language versions
 * of pages to search engines. This helps search engines serve the correct language
 * version to users based on their language preferences and location.
 *
 * Hreflang Best Practices:
 * - Include all language versions of a page
 * - Add x-default for fallback language
 * - Use absolute URLs (including protocol and domain)
 * - Use ISO 639-1 language codes (en, es, fr, etc.)
 * - Ensure bidirectional linking (all pages link to all versions)
 *
 * SEO Benefits:
 * - Prevents duplicate content issues across language versions
 * - Helps search engines show correct language version in search results
 * - Improves user experience by directing users to their preferred language
 * - Essential for international SEO and multilingual websites
 */

import { type Locale, LOCALES, DEFAULT_LOCALE, getLocalizedPath } from '../i18n';

/**
 * Hreflang link entry
 * Represents a single hreflang alternate language link
 */
export interface HreflangLink {
  /** ISO 639-1 language code (e.g., 'en', 'es') or 'x-default' */
  hreflang: string;

  /** Absolute URL to the alternate language version */
  href: string;

  /** Language name (for debugging/documentation) */
  lang: string;
}

/**
 * Hreflang generation options
 */
export interface HreflangOptions {
  /**
   * Base URL of the site (e.g., 'https://example.com')
   * Required for generating absolute URLs
   */
  baseUrl: string;

  /**
   * Current page path without locale prefix (e.g., '/courses/meditation')
   * Should not include the locale prefix (/es/)
   */
  path: string;

  /**
   * Current locale (optional, used for debugging)
   * @default 'en'
   */
  currentLocale?: Locale;

  /**
   * Locales to generate hreflang tags for
   * @default LOCALES (all supported locales)
   */
  locales?: Locale[];

  /**
   * Whether to include x-default tag
   * x-default is used when no language matches user's preference
   * @default true
   */
  includeDefault?: boolean;

  /**
   * Which locale to use for x-default
   * @default DEFAULT_LOCALE ('en')
   */
  defaultLocale?: Locale;
}

/**
 * Generate hreflang tags for a page
 *
 * Creates hreflang link tags for all supported language versions of a page.
 * Includes x-default tag pointing to the default language.
 *
 * @param options - Configuration options for hreflang generation
 * @returns Array of hreflang link objects
 *
 * @example
 * ```typescript
 * const links = generateHreflangLinks({
 *   baseUrl: 'https://example.com',
 *   path: '/courses/meditation',
 *   currentLocale: 'en'
 * });
 * // Returns:
 * // [
 * //   { hreflang: 'en', href: 'https://example.com/courses/meditation', lang: 'English' },
 * //   { hreflang: 'es', href: 'https://example.com/es/courses/meditation', lang: 'Español' },
 * //   { hreflang: 'x-default', href: 'https://example.com/courses/meditation', lang: 'Default' }
 * // ]
 * ```
 *
 * @example
 * // Usage in Astro component:
 * ```astro
 * ---
 * import { generateHreflangLinks } from '@/lib/hreflang';
 *
 * const hreflangLinks = generateHreflangLinks({
 *   baseUrl: Astro.site?.origin || Astro.url.origin,
 *   path: Astro.url.pathname,
 *   currentLocale: Astro.locals.locale
 * });
 * ---
 *
 * {hreflangLinks.map(link => (
 *   <link rel="alternate" hreflang={link.hreflang} href={link.href} />
 * ))}
 * ```
 */
export function generateHreflangLinks(options: HreflangOptions): HreflangLink[] {
  const {
    baseUrl,
    path,
    currentLocale = DEFAULT_LOCALE,
    locales = LOCALES,
    includeDefault = true,
    defaultLocale = DEFAULT_LOCALE,
  } = options;

  // Ensure baseUrl doesn't end with /
  const normalizedBaseUrl = baseUrl.replace(/\/$/, '');

  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  // Remove any existing locale prefix from path
  // In case path already has locale (e.g., '/es/courses')
  const cleanPath = normalizedPath.replace(/^\/(en|es)\//, '/');

  const links: HreflangLink[] = [];

  // Generate hreflang link for each supported locale
  for (const locale of locales) {
    const localizedPath = getLocalizedPath(locale, cleanPath);
    const absoluteUrl = `${normalizedBaseUrl}${localizedPath}`;

    links.push({
      hreflang: locale,
      href: absoluteUrl,
      lang: locale === 'en' ? 'English' : 'Español',
    });
  }

  // Add x-default tag if requested
  if (includeDefault) {
    const defaultPath = getLocalizedPath(defaultLocale, cleanPath);
    const defaultUrl = `${normalizedBaseUrl}${defaultPath}`;

    links.push({
      hreflang: 'x-default',
      href: defaultUrl,
      lang: 'Default',
    });
  }

  return links;
}

/**
 * Generate hreflang tags from Astro context
 *
 * Convenience function that extracts necessary information from Astro context
 * and generates hreflang links. Designed for use in Astro components.
 *
 * @param astroUrl - Astro.url object
 * @param astroSite - Astro.site object (optional)
 * @param currentLocale - Current locale from Astro.locals
 * @returns Array of hreflang link objects
 *
 * @example
 * ```astro
 * ---
 * import { generateHreflangFromAstro } from '@/lib/hreflang';
 *
 * const hreflangLinks = generateHreflangFromAstro(
 *   Astro.url,
 *   Astro.site,
 *   Astro.locals.locale
 * );
 * ---
 *
 * {hreflangLinks.map(link => (
 *   <link rel="alternate" hreflang={link.hreflang} href={link.href} />
 * ))}
 * ```
 */
export function generateHreflangFromAstro(
  astroUrl: URL,
  astroSite: URL | undefined,
  currentLocale: Locale = DEFAULT_LOCALE
): HreflangLink[] {
  // Get base URL from astro.site or fall back to request origin
  const baseUrl = astroSite?.origin || astroUrl.origin;

  // Get current path
  const path = astroUrl.pathname;

  return generateHreflangLinks({
    baseUrl,
    path,
    currentLocale,
  });
}

/**
 * Validate hreflang configuration
 *
 * Checks that hreflang links are properly configured according to best practices:
 * - All URLs are absolute (include protocol and domain)
 * - All locales are supported
 * - x-default is present (if expected)
 * - No duplicate hreflang values
 *
 * @param links - Array of hreflang links to validate
 * @param options - Validation options
 * @returns Validation result with warnings
 *
 * @example
 * ```typescript
 * const links = generateHreflangLinks({ ... });
 * const validation = validateHreflangLinks(links);
 *
 * if (!validation.isValid) {
 *   console.warn('Hreflang validation issues:', validation.warnings);
 * }
 * ```
 */
export function validateHreflangLinks(
  links: HreflangLink[],
  options: {
    requireDefault?: boolean;
    requireAbsoluteUrls?: boolean;
  } = {}
): {
  isValid: boolean;
  warnings: string[];
} {
  const {
    requireDefault = true,
    requireAbsoluteUrls = true,
  } = options;

  const warnings: string[] = [];

  // Check if links array is empty
  if (links.length === 0) {
    warnings.push('No hreflang links provided');
    return { isValid: false, warnings };
  }

  // Check for x-default
  const hasDefault = links.some(link => link.hreflang === 'x-default');
  if (requireDefault && !hasDefault) {
    warnings.push('Missing x-default hreflang tag (recommended for fallback)');
  }

  // Check for absolute URLs
  if (requireAbsoluteUrls) {
    for (const link of links) {
      if (!link.href.startsWith('http://') && !link.href.startsWith('https://')) {
        warnings.push(`Hreflang URL is not absolute: ${link.href} (hreflang: ${link.hreflang})`);
      }
    }
  }

  // Check for duplicates
  const hreflangs = links.map(link => link.hreflang);
  const uniqueHreflangs = new Set(hreflangs);
  if (hreflangs.length !== uniqueHreflangs.size) {
    warnings.push('Duplicate hreflang values detected');
  }

  // Check that all locales are covered
  const localeLinks = links.filter(link => link.hreflang !== 'x-default');
  if (localeLinks.length < LOCALES.length) {
    warnings.push(`Not all locales covered (expected ${LOCALES.length}, got ${localeLinks.length})`);
  }

  return {
    isValid: warnings.length === 0,
    warnings,
  };
}

/**
 * Get hreflang for a specific locale
 *
 * Helper function to get the hreflang link for a specific locale from a list.
 *
 * @param links - Array of hreflang links
 * @param locale - Locale to find
 * @returns The hreflang link for the locale, or undefined if not found
 */
export function getHreflangForLocale(
  links: HreflangLink[],
  locale: Locale | 'x-default'
): HreflangLink | undefined {
  return links.find(link => link.hreflang === locale);
}

/**
 * Extract locale from hreflang URL
 *
 * Given a hreflang URL, extracts the locale from the path.
 * Useful for debugging or processing hreflang links.
 *
 * @param url - The hreflang URL
 * @param baseUrl - The base URL of the site
 * @returns The locale, or DEFAULT_LOCALE if not found
 *
 * @example
 * ```typescript
 * extractLocaleFromHreflangUrl(
 *   'https://example.com/es/courses',
 *   'https://example.com'
 * ); // Returns: 'es'
 *
 * extractLocaleFromHreflangUrl(
 *   'https://example.com/courses',
 *   'https://example.com'
 * ); // Returns: 'en'
 * ```
 */
export function extractLocaleFromHreflangUrl(
  url: string,
  baseUrl: string
): Locale {
  // Remove base URL to get path
  const normalizedBaseUrl = baseUrl.replace(/\/$/, '');
  const path = url.replace(normalizedBaseUrl, '');

  // Check if path starts with a locale
  const segments = path.split('/').filter(Boolean);
  if (segments.length > 0 && LOCALES.includes(segments[0] as Locale)) {
    return segments[0] as Locale;
  }

  return DEFAULT_LOCALE;
}
