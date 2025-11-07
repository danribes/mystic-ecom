/**
 * T237: Hreflang Tags Tests
 *
 * Comprehensive test suite for hreflang tag generation utilities.
 * Tests internationalization SEO functionality.
 */

import { describe, it, expect } from 'vitest';
import {
  generateHreflangLinks,
  generateHreflangFromAstro,
  validateHreflangLinks,
  getHreflangForLocale,
  extractLocaleFromHreflangUrl,
  type HreflangLink,
  type HreflangOptions,
} from '@/lib/hreflang';
import { LOCALES, DEFAULT_LOCALE } from '@/i18n';

describe('T237: Hreflang Tags - generateHreflangLinks', () => {
  const baseOptions: HreflangOptions = {
    baseUrl: 'https://example.com',
    path: '/courses/meditation',
  };

  it('should generate hreflang links for all supported locales', () => {
    const links = generateHreflangLinks(baseOptions);

    // Should have links for each locale + x-default
    expect(links.length).toBe(LOCALES.length + 1);

    // Check English link
    const enLink = links.find(l => l.hreflang === 'en');
    expect(enLink).toBeDefined();
    expect(enLink?.href).toBe('https://example.com/courses/meditation');
    expect(enLink?.lang).toBe('English');

    // Check Spanish link
    const esLink = links.find(l => l.hreflang === 'es');
    expect(esLink).toBeDefined();
    expect(esLink?.href).toBe('https://example.com/es/courses/meditation');
    expect(esLink?.lang).toBe('Español');
  });

  it('should include x-default tag by default', () => {
    const links = generateHreflangLinks(baseOptions);

    const defaultLink = links.find(l => l.hreflang === 'x-default');
    expect(defaultLink).toBeDefined();
    expect(defaultLink?.href).toBe('https://example.com/courses/meditation');
    expect(defaultLink?.lang).toBe('Default');
  });

  it('should not include x-default if includeDefault is false', () => {
    const links = generateHreflangLinks({
      ...baseOptions,
      includeDefault: false,
    });

    const defaultLink = links.find(l => l.hreflang === 'x-default');
    expect(defaultLink).toBeUndefined();
    expect(links.length).toBe(LOCALES.length);
  });

  it('should handle baseUrl with trailing slash', () => {
    const links = generateHreflangLinks({
      baseUrl: 'https://example.com/',
      path: '/courses',
    });

    // Should not have double slashes
    expect(links[0].href).not.toContain('//courses');
    expect(links[0].href).toBe('https://example.com/courses');
  });

  it('should handle path without leading slash', () => {
    const links = generateHreflangLinks({
      baseUrl: 'https://example.com',
      path: 'courses/meditation',
    });

    // Should add leading slash
    const enLink = links.find(l => l.hreflang === 'en');
    expect(enLink?.href).toBe('https://example.com/courses/meditation');
  });

  it('should clean existing locale prefix from path', () => {
    // Path already has /es/ prefix
    const links = generateHreflangLinks({
      baseUrl: 'https://example.com',
      path: '/es/courses/meditation',
    });

    // English link should not have /es/
    const enLink = links.find(l => l.hreflang === 'en');
    expect(enLink?.href).toBe('https://example.com/courses/meditation');

    // Spanish link should have /es/
    const esLink = links.find(l => l.hreflang === 'es');
    expect(esLink?.href).toBe('https://example.com/es/courses/meditation');
  });

  it('should handle homepage path', () => {
    const links = generateHreflangLinks({
      baseUrl: 'https://example.com',
      path: '/',
    });

    const enLink = links.find(l => l.hreflang === 'en');
    expect(enLink?.href).toBe('https://example.com/');

    const esLink = links.find(l => l.hreflang === 'es');
    expect(esLink?.href).toBe('https://example.com/es/');
  });

  it('should generate absolute URLs', () => {
    const links = generateHreflangLinks(baseOptions);

    for (const link of links) {
      expect(link.href).toMatch(/^https?:\/\//);
    }
  });

  it('should respect custom locales parameter', () => {
    const links = generateHreflangLinks({
      ...baseOptions,
      locales: ['en'],
      includeDefault: false,
    });

    expect(links.length).toBe(1);
    expect(links[0].hreflang).toBe('en');
  });

  it('should respect custom defaultLocale', () => {
    const links = generateHreflangLinks({
      ...baseOptions,
      defaultLocale: 'es',
    });

    const defaultLink = links.find(l => l.hreflang === 'x-default');
    expect(defaultLink?.href).toBe('https://example.com/es/courses/meditation');
  });

  it('should handle complex nested paths', () => {
    const links = generateHreflangLinks({
      baseUrl: 'https://example.com',
      path: '/courses/meditation/beginner/lesson-1',
    });

    const enLink = links.find(l => l.hreflang === 'en');
    expect(enLink?.href).toBe('https://example.com/courses/meditation/beginner/lesson-1');

    const esLink = links.find(l => l.hreflang === 'es');
    expect(esLink?.href).toBe('https://example.com/es/courses/meditation/beginner/lesson-1');
  });
});

describe('T237: Hreflang Tags - generateHreflangFromAstro', () => {
  it('should generate hreflang links from Astro URL objects', () => {
    const astroUrl = new URL('https://example.com/courses/meditation');
    const astroSite = new URL('https://example.com');

    const links = generateHreflangFromAstro(astroUrl, astroSite, 'en');

    expect(links.length).toBeGreaterThan(0);
    expect(links[0].href).toMatch(/^https:\/\//);
  });

  it('should use request origin if astro.site is undefined', () => {
    const astroUrl = new URL('https://localhost:3000/courses');

    const links = generateHreflangFromAstro(astroUrl, undefined, 'en');

    // Should use localhost from astroUrl.origin
    expect(links[0].href).toMatch(/^https:\/\/localhost:3000/);
  });

  it('should extract path from Astro URL', () => {
    const astroUrl = new URL('https://example.com/events/retreat');
    const astroSite = new URL('https://example.com');

    const links = generateHreflangFromAstro(astroUrl, astroSite, 'en');

    const enLink = links.find(l => l.hreflang === 'en');
    expect(enLink?.href).toBe('https://example.com/events/retreat');
  });

  it('should default to en locale if not provided', () => {
    const astroUrl = new URL('https://example.com/courses');
    const astroSite = new URL('https://example.com');

    const links = generateHreflangFromAstro(astroUrl, astroSite);

    // Should generate links successfully with default locale
    expect(links.length).toBeGreaterThan(0);
  });
});

describe('T237: Hreflang Tags - validateHreflangLinks', () => {
  const validLinks: HreflangLink[] = [
    { hreflang: 'en', href: 'https://example.com/page', lang: 'English' },
    { hreflang: 'es', href: 'https://example.com/es/page', lang: 'Español' },
    { hreflang: 'x-default', href: 'https://example.com/page', lang: 'Default' },
  ];

  it('should validate correct hreflang links', () => {
    const result = validateHreflangLinks(validLinks);

    expect(result.isValid).toBe(true);
    expect(result.warnings).toHaveLength(0);
  });

  it('should warn if x-default is missing', () => {
    const linksWithoutDefault = validLinks.filter(l => l.hreflang !== 'x-default');

    const result = validateHreflangLinks(linksWithoutDefault);

    expect(result.isValid).toBe(false);
    expect(result.warnings.some(w => w.includes('x-default'))).toBe(true);
  });

  it('should not warn about x-default if requireDefault is false', () => {
    const linksWithoutDefault = validLinks.filter(l => l.hreflang !== 'x-default');

    const result = validateHreflangLinks(linksWithoutDefault, {
      requireDefault: false,
    });

    expect(result.isValid).toBe(true);
  });

  it('should warn if URLs are not absolute', () => {
    const relativeLinks: HreflangLink[] = [
      { hreflang: 'en', href: '/page', lang: 'English' },
      { hreflang: 'x-default', href: '/page', lang: 'Default' },
    ];

    const result = validateHreflangLinks(relativeLinks);

    expect(result.isValid).toBe(false);
    expect(result.warnings.some(w => w.includes('not absolute'))).toBe(true);
  });

  it('should not warn about relative URLs if requireAbsoluteUrls is false', () => {
    const relativeLinks: HreflangLink[] = [
      { hreflang: 'en', href: '/page', lang: 'English' },
      { hreflang: 'es', href: '/es/page', lang: 'Español' },
      { hreflang: 'x-default', href: '/page', lang: 'Default' },
    ];

    const result = validateHreflangLinks(relativeLinks, {
      requireAbsoluteUrls: false,
    });

    expect(result.isValid).toBe(true);
  });

  it('should warn if duplicate hreflang values exist', () => {
    const duplicateLinks: HreflangLink[] = [
      { hreflang: 'en', href: 'https://example.com/page1', lang: 'English' },
      { hreflang: 'en', href: 'https://example.com/page2', lang: 'English' },
      { hreflang: 'x-default', href: 'https://example.com/page1', lang: 'Default' },
    ];

    const result = validateHreflangLinks(duplicateLinks);

    expect(result.isValid).toBe(false);
    expect(result.warnings.some(w => w.includes('Duplicate'))).toBe(true);
  });

  it('should warn if not all locales are covered', () => {
    const incompleteLinks: HreflangLink[] = [
      { hreflang: 'en', href: 'https://example.com/page', lang: 'English' },
      { hreflang: 'x-default', href: 'https://example.com/page', lang: 'Default' },
      // Missing 'es'
    ];

    const result = validateHreflangLinks(incompleteLinks);

    expect(result.isValid).toBe(false);
    expect(result.warnings.some(w => w.includes('Not all locales'))).toBe(true);
  });

  it('should warn if links array is empty', () => {
    const result = validateHreflangLinks([]);

    expect(result.isValid).toBe(false);
    expect(result.warnings).toContain('No hreflang links provided');
  });
});

describe('T237: Hreflang Tags - getHreflangForLocale', () => {
  const links: HreflangLink[] = [
    { hreflang: 'en', href: 'https://example.com/page', lang: 'English' },
    { hreflang: 'es', href: 'https://example.com/es/page', lang: 'Español' },
    { hreflang: 'x-default', href: 'https://example.com/page', lang: 'Default' },
  ];

  it('should find link for English locale', () => {
    const link = getHreflangForLocale(links, 'en');

    expect(link).toBeDefined();
    expect(link?.hreflang).toBe('en');
    expect(link?.href).toBe('https://example.com/page');
  });

  it('should find link for Spanish locale', () => {
    const link = getHreflangForLocale(links, 'es');

    expect(link).toBeDefined();
    expect(link?.hreflang).toBe('es');
    expect(link?.href).toBe('https://example.com/es/page');
  });

  it('should find x-default link', () => {
    const link = getHreflangForLocale(links, 'x-default');

    expect(link).toBeDefined();
    expect(link?.hreflang).toBe('x-default');
  });

  it('should return undefined for non-existent locale', () => {
    const link = getHreflangForLocale(links, 'fr' as any);

    expect(link).toBeUndefined();
  });
});

describe('T237: Hreflang Tags - extractLocaleFromHreflangUrl', () => {
  const baseUrl = 'https://example.com';

  it('should extract English locale (default, no prefix)', () => {
    const locale = extractLocaleFromHreflangUrl(
      'https://example.com/courses/meditation',
      baseUrl
    );

    expect(locale).toBe('en');
  });

  it('should extract Spanish locale from path', () => {
    const locale = extractLocaleFromHreflangUrl(
      'https://example.com/es/courses/meditation',
      baseUrl
    );

    expect(locale).toBe('es');
  });

  it('should handle homepage URL', () => {
    const locale = extractLocaleFromHreflangUrl(
      'https://example.com/',
      baseUrl
    );

    expect(locale).toBe('en');
  });

  it('should handle Spanish homepage', () => {
    const locale = extractLocaleFromHreflangUrl(
      'https://example.com/es/',
      baseUrl
    );

    expect(locale).toBe('es');
  });

  it('should handle baseUrl with trailing slash', () => {
    const locale = extractLocaleFromHreflangUrl(
      'https://example.com/es/page',
      'https://example.com/'
    );

    expect(locale).toBe('es');
  });

  it('should return default locale for unrecognized path', () => {
    const locale = extractLocaleFromHreflangUrl(
      'https://example.com/unknown/path',
      baseUrl
    );

    expect(locale).toBe('en');
  });
});

describe('T237: Hreflang Tags - Integration Tests', () => {
  it('should generate and validate hreflang links successfully', () => {
    const links = generateHreflangLinks({
      baseUrl: 'https://example.com',
      path: '/courses/meditation',
    });

    const validation = validateHreflangLinks(links);

    expect(validation.isValid).toBe(true);
    expect(validation.warnings).toHaveLength(0);
  });

  it('should handle complete course page scenario', () => {
    const links = generateHreflangLinks({
      baseUrl: 'https://spirituality-platform.com',
      path: '/courses/mindfulness-meditation',
      currentLocale: 'en',
    });

    // Check structure
    expect(links.length).toBe(3); // en, es, x-default

    // English
    const enLink = getHreflangForLocale(links, 'en');
    expect(enLink?.href).toBe('https://spirituality-platform.com/courses/mindfulness-meditation');

    // Spanish
    const esLink = getHreflangForLocale(links, 'es');
    expect(esLink?.href).toBe('https://spirituality-platform.com/es/courses/mindfulness-meditation');

    // Default
    const defaultLink = getHreflangForLocale(links, 'x-default');
    expect(defaultLink?.href).toBe('https://spirituality-platform.com/courses/mindfulness-meditation');

    // Validate
    const validation = validateHreflangLinks(links);
    expect(validation.isValid).toBe(true);
  });

  it('should handle event page in Spanish context', () => {
    const links = generateHreflangLinks({
      baseUrl: 'https://spirituality-platform.com',
      path: '/es/events/meditation-retreat',
      currentLocale: 'es',
    });

    // Path should be cleaned and localized properly
    const enLink = getHreflangForLocale(links, 'en');
    expect(enLink?.href).toBe('https://spirituality-platform.com/events/meditation-retreat');

    const esLink = getHreflangForLocale(links, 'es');
    expect(esLink?.href).toBe('https://spirituality-platform.com/es/events/meditation-retreat');
  });

  it('should handle product page with complex path', () => {
    const links = generateHreflangLinks({
      baseUrl: 'https://spirituality-platform.com',
      path: '/products/guided-meditation-audio-pack/purchase',
      currentLocale: 'en',
    });

    const enLink = getHreflangForLocale(links, 'en');
    expect(enLink?.href).toBe('https://spirituality-platform.com/products/guided-meditation-audio-pack/purchase');

    const esLink = getHreflangForLocale(links, 'es');
    expect(esLink?.href).toBe('https://spirituality-platform.com/es/products/guided-meditation-audio-pack/purchase');
  });

  it('should be bidirectional - extract and generate round trip', () => {
    const originalUrl = 'https://example.com/es/courses/meditation';
    const baseUrl = 'https://example.com';

    // Extract locale from URL
    const locale = extractLocaleFromHreflangUrl(originalUrl, baseUrl);
    expect(locale).toBe('es');

    // Generate hreflang links
    const links = generateHreflangLinks({
      baseUrl,
      path: '/courses/meditation',
      currentLocale: locale,
    });

    // Find the Spanish link
    const esLink = getHreflangForLocale(links, 'es');

    // Should match original URL
    expect(esLink?.href).toBe(originalUrl);
  });
});

describe('T237: Hreflang Tags - Edge Cases', () => {
  it('should handle URL with query parameters', () => {
    const links = generateHreflangLinks({
      baseUrl: 'https://example.com',
      path: '/search?q=meditation',
    });

    const enLink = getHreflangForLocale(links, 'en');
    expect(enLink?.href).toBe('https://example.com/search?q=meditation');
  });

  it('should handle URL with fragment', () => {
    const links = generateHreflangLinks({
      baseUrl: 'https://example.com',
      path: '/page#section',
    });

    const enLink = getHreflangForLocale(links, 'en');
    expect(enLink?.href).toBe('https://example.com/page#section');
  });

  it('should handle empty path (root)', () => {
    const links = generateHreflangLinks({
      baseUrl: 'https://example.com',
      path: '',
    });

    const enLink = getHreflangForLocale(links, 'en');
    expect(enLink?.href).toBe('https://example.com/');
  });

  it('should handle path with multiple slashes', () => {
    const links = generateHreflangLinks({
      baseUrl: 'https://example.com',
      path: '//courses//meditation//',
    });

    // Should normalize path
    const enLink = getHreflangForLocale(links, 'en');
    // getLocalizedPath should handle normalization
    expect(enLink?.href).toContain('/courses');
  });

  it('should handle baseUrl with port', () => {
    const links = generateHreflangLinks({
      baseUrl: 'https://localhost:3000',
      path: '/courses',
    });

    const enLink = getHreflangForLocale(links, 'en');
    expect(enLink?.href).toBe('https://localhost:3000/courses');

    const esLink = getHreflangForLocale(links, 'es');
    expect(esLink?.href).toBe('https://localhost:3000/es/courses');
  });

  it('should handle HTTP (non-HTTPS) base URL', () => {
    const links = generateHreflangLinks({
      baseUrl: 'http://example.com',
      path: '/page',
    });

    const enLink = getHreflangForLocale(links, 'en');
    expect(enLink?.href).toBe('http://example.com/page');
  });
});

describe('T237: Hreflang Tags - Constants and Types', () => {
  it('should have correct number of locales', () => {
    const links = generateHreflangLinks({
      baseUrl: 'https://example.com',
      path: '/page',
      includeDefault: false,
    });

    expect(links.length).toBe(LOCALES.length);
  });

  it('should use correct default locale', () => {
    const links = generateHreflangLinks({
      baseUrl: 'https://example.com',
      path: '/page',
    });

    const defaultLink = getHreflangForLocale(links, 'x-default');
    const defaultLocaleLink = getHreflangForLocale(links, DEFAULT_LOCALE);

    // x-default should point to same URL as default locale
    expect(defaultLink?.href).toBe(defaultLocaleLink?.href);
  });

  it('should have correct language names', () => {
    const links = generateHreflangLinks({
      baseUrl: 'https://example.com',
      path: '/page',
    });

    const enLink = getHreflangForLocale(links, 'en');
    expect(enLink?.lang).toBe('English');

    const esLink = getHreflangForLocale(links, 'es');
    expect(esLink?.lang).toBe('Español');

    const defaultLink = getHreflangForLocale(links, 'x-default');
    expect(defaultLink?.lang).toBe('Default');
  });
});
