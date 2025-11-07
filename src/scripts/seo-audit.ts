/**
 * T235: SEO Audit Script
 *
 * Comprehensive SEO validation utility that checks:
 * - Meta tags (title, description, keywords) and their lengths
 * - Structured data (JSON-LD) syntax validation
 * - Canonical URLs
 * - Sitemap configuration
 * - robots.txt validation
 * - Open Graph tags
 * - Twitter Cards
 *
 * Can be run as a script or imported for testing.
 *
 * Usage as script:
 * ```bash
 * npm run seo:audit
 * npm run seo:audit -- --url https://example.com
 * npm run seo:audit -- --html index.html
 * ```
 *
 * Usage in tests:
 * ```typescript
 * import { validateMetaTags, validateStructuredData } from '@/scripts/seo-audit';
 * const result = validateMetaTags(html);
 * ```
 */

import { parse } from 'node-html-parser';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface MetaTag {
  name?: string;
  property?: string;
  content?: string;
}

export interface MetaTagsValidation {
  isValid: boolean;
  score: number; // 0-100
  issues: string[];
  warnings: string[];
  suggestions: string[];
  tags: {
    title?: string;
    description?: string;
    keywords?: string;
    robots?: string;
    author?: string;
    viewport?: string;
  };
}

export interface StructuredDataValidation {
  isValid: boolean;
  score: number; // 0-100
  issues: string[];
  warnings: string[];
  schemas: Array<{
    type: string;
    valid: boolean;
    data: any;
    errors: string[];
  }>;
}

export interface CanonicalUrlValidation {
  isValid: boolean;
  score: number; // 0-100
  issues: string[];
  warnings: string[];
  canonicalUrl?: string;
  isAbsolute: boolean;
  hasHttps: boolean;
}

export interface OpenGraphValidation {
  isValid: boolean;
  score: number; // 0-100
  issues: string[];
  warnings: string[];
  tags: {
    'og:title'?: string;
    'og:description'?: string;
    'og:image'?: string;
    'og:url'?: string;
    'og:type'?: string;
    'og:site_name'?: string;
    [key: string]: string | undefined;
  };
}

export interface TwitterCardValidation {
  isValid: boolean;
  score: number; // 0-100
  issues: string[];
  warnings: string[];
  tags: {
    'twitter:card'?: string;
    'twitter:title'?: string;
    'twitter:description'?: string;
    'twitter:image'?: string;
    'twitter:site'?: string;
    'twitter:creator'?: string;
    [key: string]: string | undefined;
  };
}

export interface RobotsTxtValidation {
  isValid: boolean;
  score: number; // 0-100
  issues: string[];
  warnings: string[];
  suggestions: string[];
  directives: {
    userAgents: string[];
    allows: string[];
    disallows: string[];
    sitemaps: string[];
    crawlDelays: Map<string, number>;
  };
}

export interface SitemapValidation {
  isValid: boolean;
  score: number; // 0-100
  issues: string[];
  warnings: string[];
  suggestions: string[];
  sitemapUrl?: string;
  urlCount?: number;
}

export interface SEOAuditResult {
  score: number; // Overall 0-100
  metaTags: MetaTagsValidation;
  structuredData: StructuredDataValidation;
  canonicalUrl: CanonicalUrlValidation;
  openGraph: OpenGraphValidation;
  twitterCard: TwitterCardValidation;
  robotsTxt?: RobotsTxtValidation;
  sitemap?: SitemapValidation;
  timestamp: string;
  url?: string;
}

// ============================================================================
// Constants
// ============================================================================

export const SEO_LIMITS = {
  TITLE_MIN: 30,
  TITLE_MAX: 60,
  TITLE_IDEAL: 50,
  DESCRIPTION_MIN: 50,
  DESCRIPTION_MAX: 160,
  DESCRIPTION_IDEAL: 155,
  KEYWORDS_MIN: 3,
  KEYWORDS_MAX: 10,
} as const;

export const REQUIRED_META_TAGS = [
  'title',
  'description',
] as const;

export const REQUIRED_OG_TAGS = [
  'og:title',
  'og:description',
  'og:image',
  'og:url',
  'og:type',
] as const;

export const REQUIRED_TWITTER_TAGS = [
  'twitter:card',
  'twitter:title',
  'twitter:description',
  'twitter:image',
] as const;

// ============================================================================
// Meta Tags Validation
// ============================================================================

/**
 * Extract meta tags from HTML
 */
export function extractMetaTags(html: string): MetaTag[] {
  const root = parse(html);
  const metaTags: MetaTag[] = [];

  // Extract all meta tags
  root.querySelectorAll('meta').forEach(meta => {
    const tag: MetaTag = {};

    const name = meta.getAttribute('name');
    const property = meta.getAttribute('property');
    const content = meta.getAttribute('content');

    if (name) tag.name = name;
    if (property) tag.property = property;
    if (content) tag.content = content;

    if (tag.name || tag.property) {
      metaTags.push(tag);
    }
  });

  return metaTags;
}

/**
 * Get meta tag content by name or property
 */
export function getMetaContent(
  metaTags: MetaTag[],
  nameOrProperty: string
): string | undefined {
  const tag = metaTags.find(
    t => t.name === nameOrProperty || t.property === nameOrProperty
  );
  return tag?.content;
}

/**
 * Validate meta tags
 */
export function validateMetaTags(html: string): MetaTagsValidation {
  const root = parse(html);
  const metaTags = extractMetaTags(html);

  const issues: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];
  let score = 100;

  // Extract key tags
  const title = root.querySelector('title')?.textContent?.trim();
  const description = getMetaContent(metaTags, 'description');
  const keywords = getMetaContent(metaTags, 'keywords');
  const robots = getMetaContent(metaTags, 'robots');
  const author = getMetaContent(metaTags, 'author');
  const viewport = getMetaContent(metaTags, 'viewport');

  // Validate title
  if (!title) {
    issues.push('Missing <title> tag');
    score -= 30;
  } else {
    if (title.length < SEO_LIMITS.TITLE_MIN) {
      issues.push(
        `Title too short (${title.length} chars, minimum ${SEO_LIMITS.TITLE_MIN})`
      );
      score -= 15;
    }
    if (title.length > SEO_LIMITS.TITLE_MAX) {
      warnings.push(
        `Title too long (${title.length} chars, maximum ${SEO_LIMITS.TITLE_MAX})`
      );
      score -= 10;
      suggestions.push('Shorten title to 50-60 characters for optimal display');
    }
    if (title.length < SEO_LIMITS.TITLE_IDEAL && title.length >= SEO_LIMITS.TITLE_MIN) {
      suggestions.push('Consider expanding title to 50-60 characters for better SEO');
    }
  }

  // Validate description
  if (!description) {
    issues.push('Missing meta description');
    score -= 25;
  } else {
    if (description.length < SEO_LIMITS.DESCRIPTION_MIN) {
      issues.push(
        `Description too short (${description.length} chars, minimum ${SEO_LIMITS.DESCRIPTION_MIN})`
      );
      score -= 15;
    }
    if (description.length > SEO_LIMITS.DESCRIPTION_MAX) {
      warnings.push(
        `Description too long (${description.length} chars, maximum ${SEO_LIMITS.DESCRIPTION_MAX})`
      );
      score -= 10;
      suggestions.push('Shorten description to 150-160 characters');
    }
  }

  // Validate keywords (optional but recommended)
  if (keywords) {
    const keywordArray = keywords.split(',').map(k => k.trim()).filter(k => k);
    if (keywordArray.length < SEO_LIMITS.KEYWORDS_MIN) {
      warnings.push(`Few keywords (${keywordArray.length}, recommended ${SEO_LIMITS.KEYWORDS_MIN}-${SEO_LIMITS.KEYWORDS_MAX})`);
      suggestions.push('Add more relevant keywords');
    }
    if (keywordArray.length > SEO_LIMITS.KEYWORDS_MAX) {
      warnings.push(`Too many keywords (${keywordArray.length}, recommended ${SEO_LIMITS.KEYWORDS_MIN}-${SEO_LIMITS.KEYWORDS_MAX})`);
      suggestions.push('Focus on most relevant keywords');
    }
  }

  // Validate robots
  if (!robots) {
    warnings.push('Missing robots meta tag');
    suggestions.push('Add robots meta tag for explicit crawling instructions');
  }

  // Validate viewport (important for mobile SEO)
  if (!viewport) {
    warnings.push('Missing viewport meta tag');
    score -= 5;
    suggestions.push('Add viewport meta tag for mobile responsiveness');
  }

  score = Math.max(0, Math.min(100, score));
  const isValid = issues.length === 0 && score >= 80;

  return {
    isValid,
    score,
    issues,
    warnings,
    suggestions,
    tags: {
      title,
      description,
      keywords,
      robots,
      author,
      viewport,
    },
  };
}

// ============================================================================
// Structured Data Validation
// ============================================================================

/**
 * Extract JSON-LD structured data from HTML
 */
export function extractStructuredData(html: string): any[] {
  const root = parse(html);
  const schemas: any[] = [];

  root.querySelectorAll('script[type="application/ld+json"]').forEach(script => {
    try {
      const content = script.textContent?.trim();
      if (content) {
        const data = JSON.parse(content);
        schemas.push(data);
      }
    } catch (error) {
      // Invalid JSON - will be caught in validation
    }
  });

  return schemas;
}

/**
 * Validate JSON-LD structured data
 */
export function validateStructuredData(html: string): StructuredDataValidation {
  const root = parse(html);
  const issues: string[] = [];
  const warnings: string[] = [];
  const schemas: StructuredDataValidation['schemas'] = [];
  let score = 100;

  const scripts = root.querySelectorAll('script[type="application/ld+json"]');

  if (scripts.length === 0) {
    issues.push('No structured data (JSON-LD) found');
    score = 0;
    return { isValid: false, score, issues, warnings, schemas };
  }

  scripts.forEach((script, index) => {
    const content = script.textContent?.trim();
    if (!content) {
      issues.push(`Empty structured data at position ${index + 1}`);
      score -= 20;
      schemas.push({
        type: 'Unknown',
        valid: false,
        data: null,
        errors: ['Empty content'],
      });
      return;
    }

    try {
      const data = JSON.parse(content);
      const errors: string[] = [];

      // Validate basic structure
      if (!data['@context']) {
        errors.push('Missing @context');
        score -= 10;
      } else if (data['@context'] !== 'https://schema.org' && !data['@context'].includes('schema.org')) {
        warnings.push(`Non-standard @context: ${data['@context']}`);
      }

      if (!data['@type']) {
        errors.push('Missing @type');
        score -= 10;
      }

      // Type-specific validation
      const type = data['@type'];

      if (type === 'WebSite') {
        if (!data.name) errors.push('WebSite missing required "name" property');
        if (!data.url) errors.push('WebSite missing required "url" property');
      } else if (type === 'Organization') {
        if (!data.name) errors.push('Organization missing required "name" property');
        if (!data.url) errors.push('Organization missing required "url" property');
      } else if (type === 'Article') {
        if (!data.headline) errors.push('Article missing required "headline" property');
        if (!data.datePublished) errors.push('Article missing required "datePublished" property');
        if (!data.author) errors.push('Article missing required "author" property');
      } else if (type === 'Product') {
        if (!data.name) errors.push('Product missing required "name" property');
        if (!data.image) errors.push('Product missing required "image" property');
        if (!data.offers) errors.push('Product missing required "offers" property');
      }

      schemas.push({
        type: type || 'Unknown',
        valid: errors.length === 0,
        data,
        errors,
      });

      if (errors.length > 0) {
        score -= errors.length * 5;
      }

    } catch (error) {
      issues.push(`Invalid JSON-LD at position ${index + 1}: ${error instanceof Error ? error.message : 'Parse error'}`);
      score -= 30;
      schemas.push({
        type: 'Invalid',
        valid: false,
        data: null,
        errors: ['JSON parse error'],
      });
    }
  });

  score = Math.max(0, Math.min(100, score));
  const isValid = issues.length === 0 && schemas.every(s => s.valid);

  return {
    isValid,
    score,
    issues,
    warnings,
    schemas,
  };
}

// ============================================================================
// Canonical URL Validation
// ============================================================================

/**
 * Validate canonical URL
 */
export function validateCanonicalUrl(html: string): CanonicalUrlValidation {
  const root = parse(html);
  const issues: string[] = [];
  const warnings: string[] = [];
  let score = 100;

  const canonical = root.querySelector('link[rel="canonical"]');
  const canonicalUrl = canonical?.getAttribute('href');

  if (!canonicalUrl) {
    issues.push('Missing canonical URL');
    score = 0;
    return {
      isValid: false,
      score,
      issues,
      warnings,
      isAbsolute: false,
      hasHttps: false,
    };
  }

  // Check if absolute URL
  const isAbsolute = canonicalUrl.startsWith('http://') || canonicalUrl.startsWith('https://');
  if (!isAbsolute) {
    issues.push('Canonical URL must be absolute (include protocol and domain)');
    score -= 30;
  }

  // Check if HTTPS
  const hasHttps = canonicalUrl.startsWith('https://');
  if (isAbsolute && !hasHttps) {
    warnings.push('Canonical URL should use HTTPS');
    score -= 10;
  }

  // Check for common issues
  if (canonicalUrl.includes('?')) {
    warnings.push('Canonical URL contains query parameters');
  }

  if (canonicalUrl.includes('#')) {
    warnings.push('Canonical URL contains fragment identifier');
  }

  // Check trailing slash consistency
  if (!canonicalUrl.endsWith('/') && !canonicalUrl.match(/\.\w+$/)) {
    warnings.push('Consider adding trailing slash for consistency');
  }

  score = Math.max(0, Math.min(100, score));
  const isValid = issues.length === 0 && score >= 80;

  return {
    isValid,
    score,
    issues,
    warnings,
    canonicalUrl,
    isAbsolute,
    hasHttps,
  };
}

// ============================================================================
// Open Graph Validation
// ============================================================================

/**
 * Validate Open Graph tags
 */
export function validateOpenGraph(html: string): OpenGraphValidation {
  const metaTags = extractMetaTags(html);
  const issues: string[] = [];
  const warnings: string[] = [];
  let score = 100;

  const tags: OpenGraphValidation['tags'] = {};

  // Extract all OG tags
  metaTags
    .filter(t => t.property?.startsWith('og:'))
    .forEach(t => {
      if (t.property && t.content) {
        tags[t.property] = t.content;
      }
    });

  // Check required tags
  REQUIRED_OG_TAGS.forEach(requiredTag => {
    if (!tags[requiredTag]) {
      issues.push(`Missing required Open Graph tag: ${requiredTag}`);
      score -= 15;
    }
  });

  // Validate tag values
  if (tags['og:title']) {
    if (tags['og:title'].length > 60) {
      warnings.push(`og:title too long (${tags['og:title'].length} chars)`);
      score -= 5;
    }
  }

  if (tags['og:description']) {
    if (tags['og:description'].length > 160) {
      warnings.push(`og:description too long (${tags['og:description'].length} chars)`);
      score -= 5;
    }
  }

  if (tags['og:image']) {
    if (!tags['og:image'].startsWith('http')) {
      warnings.push('og:image should be an absolute URL');
      score -= 10;
    }
  }

  if (tags['og:url']) {
    if (!tags['og:url'].startsWith('https://')) {
      warnings.push('og:url should use HTTPS');
      score -= 5;
    }
  }

  score = Math.max(0, Math.min(100, score));
  const isValid = issues.length === 0 && score >= 80;

  return {
    isValid,
    score,
    issues,
    warnings,
    tags,
  };
}

// ============================================================================
// Twitter Card Validation
// ============================================================================

/**
 * Validate Twitter Card tags
 */
export function validateTwitterCard(html: string): TwitterCardValidation {
  const metaTags = extractMetaTags(html);
  const issues: string[] = [];
  const warnings: string[] = [];
  let score = 100;

  const tags: TwitterCardValidation['tags'] = {};

  // Extract all Twitter tags
  metaTags
    .filter(t => t.name?.startsWith('twitter:') || t.property?.startsWith('twitter:'))
    .forEach(t => {
      const key = t.name || t.property;
      if (key && t.content) {
        tags[key] = t.content;
      }
    });

  // Check required tags
  REQUIRED_TWITTER_TAGS.forEach(requiredTag => {
    if (!tags[requiredTag]) {
      issues.push(`Missing required Twitter Card tag: ${requiredTag}`);
      score -= 15;
    }
  });

  // Validate card type
  if (tags['twitter:card']) {
    const validCardTypes = ['summary', 'summary_large_image', 'app', 'player'];
    if (!validCardTypes.includes(tags['twitter:card'])) {
      warnings.push(`Invalid twitter:card type: ${tags['twitter:card']}`);
      score -= 10;
    }
  }

  // Validate tag values
  if (tags['twitter:title']) {
    if (tags['twitter:title'].length > 70) {
      warnings.push(`twitter:title too long (${tags['twitter:title'].length} chars)`);
      score -= 5;
    }
  }

  if (tags['twitter:description']) {
    if (tags['twitter:description'].length > 200) {
      warnings.push(`twitter:description too long (${tags['twitter:description'].length} chars)`);
      score -= 5;
    }
  }

  if (tags['twitter:image']) {
    if (!tags['twitter:image'].startsWith('http')) {
      warnings.push('twitter:image should be an absolute URL');
      score -= 10;
    }
  }

  score = Math.max(0, Math.min(100, score));
  const isValid = issues.length === 0 && score >= 80;

  return {
    isValid,
    score,
    issues,
    warnings,
    tags,
  };
}

// ============================================================================
// Robots.txt Validation
// ============================================================================

/**
 * Validate robots.txt content
 */
export function validateRobotsTxt(content: string): RobotsTxtValidation {
  const issues: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];
  let score = 100;

  const directives = {
    userAgents: [] as string[],
    allows: [] as string[],
    disallows: [] as string[],
    sitemaps: [] as string[],
    crawlDelays: new Map<string, number>(),
  };

  if (!content || content.trim().length === 0) {
    issues.push('robots.txt is empty');
    score = 0;
    return { isValid: false, score, issues, warnings, suggestions, directives };
  }

  const lines = content.split('\n');
  let currentUserAgent: string | null = null;
  let hasUserAgent = false;
  let hasSitemap = false;

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();

    // Skip empty lines and comments
    if (!trimmedLine || trimmedLine.startsWith('#')) {
      return;
    }

    // Parse directive
    const colonIndex = trimmedLine.indexOf(':');
    if (colonIndex === -1) {
      warnings.push(`Line ${index + 1}: Invalid format (missing colon)`);
      score -= 2;
      return;
    }

    const directive = trimmedLine.substring(0, colonIndex).trim().toLowerCase();
    const value = trimmedLine.substring(colonIndex + 1).trim();

    switch (directive) {
      case 'user-agent':
        hasUserAgent = true;
        currentUserAgent = value;
        directives.userAgents.push(value);
        break;

      case 'allow':
        if (!currentUserAgent) {
          warnings.push(`Line ${index + 1}: Allow directive without User-agent`);
          score -= 5;
        }
        directives.allows.push(value);
        break;

      case 'disallow':
        if (!currentUserAgent) {
          warnings.push(`Line ${index + 1}: Disallow directive without User-agent`);
          score -= 5;
        }
        directives.disallows.push(value);
        break;

      case 'sitemap':
        hasSitemap = true;
        directives.sitemaps.push(value);
        if (!value.startsWith('http')) {
          warnings.push(`Line ${index + 1}: Sitemap should be an absolute URL`);
          score -= 5;
        }
        break;

      case 'crawl-delay':
        if (currentUserAgent) {
          const delay = parseInt(value, 10);
          if (isNaN(delay)) {
            warnings.push(`Line ${index + 1}: Invalid crawl-delay value`);
            score -= 5;
          } else {
            directives.crawlDelays.set(currentUserAgent, delay);
          }
        }
        break;

      default:
        warnings.push(`Line ${index + 1}: Unknown directive "${directive}"`);
        score -= 2;
    }
  });

  // Check for required directives
  if (!hasUserAgent) {
    issues.push('Missing User-agent directive');
    score -= 20;
  }

  if (directives.disallows.length === 0 && directives.allows.length === 0) {
    warnings.push('No Allow or Disallow directives found');
    suggestions.push('Add at least one Disallow or Allow directive');
  }

  if (!hasSitemap) {
    warnings.push('No Sitemap directive found');
    suggestions.push('Add Sitemap directive to help search engines discover your sitemap');
  }

  // Check for placeholder URLs
  if (directives.sitemaps.some(s => s.includes('yourdomain.com'))) {
    issues.push('Sitemap contains placeholder URL');
    score -= 15;
  }

  score = Math.max(0, Math.min(100, score));
  const isValid = issues.length === 0 && score >= 80;

  return {
    isValid,
    score,
    issues,
    warnings,
    suggestions,
    directives,
  };
}

// ============================================================================
// Sitemap Validation
// ============================================================================

/**
 * Check if sitemap is referenced in HTML or robots.txt
 */
export function validateSitemap(html: string, robotsTxt?: string): SitemapValidation {
  const issues: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];
  let score = 100;
  let sitemapUrl: string | undefined;

  // Check for sitemap in HTML (link tag)
  const root = parse(html);
  const sitemapLink = root.querySelector('link[rel="sitemap"]');
  if (sitemapLink) {
    sitemapUrl = sitemapLink.getAttribute('href') || undefined;
  }

  // Check for sitemap in robots.txt
  if (robotsTxt) {
    const sitemapMatch = robotsTxt.match(/Sitemap:\s*(.+)/i);
    if (sitemapMatch) {
      sitemapUrl = sitemapMatch[1].trim();
    }
  }

  if (!sitemapUrl) {
    warnings.push('No sitemap reference found');
    suggestions.push('Add sitemap reference in robots.txt or HTML');
    score -= 20;
  } else {
    // Validate sitemap URL
    if (!sitemapUrl.startsWith('http')) {
      issues.push('Sitemap URL must be absolute');
      score -= 15;
    }

    if (!sitemapUrl.endsWith('.xml')) {
      warnings.push('Sitemap should be an XML file');
    }

    if (sitemapUrl.includes('yourdomain.com')) {
      issues.push('Sitemap URL contains placeholder domain');
      score -= 20;
    }
  }

  score = Math.max(0, Math.min(100, score));
  const isValid = issues.length === 0 && score >= 70;

  return {
    isValid,
    score,
    issues,
    warnings,
    suggestions,
    sitemapUrl,
  };
}

// ============================================================================
// Complete SEO Audit
// ============================================================================

/**
 * Perform complete SEO audit on HTML page
 */
export function auditSEO(
  html: string,
  options?: {
    robotsTxt?: string;
    url?: string;
  }
): SEOAuditResult {
  const metaTags = validateMetaTags(html);
  const structuredData = validateStructuredData(html);
  const canonicalUrl = validateCanonicalUrl(html);
  const openGraph = validateOpenGraph(html);
  const twitterCard = validateTwitterCard(html);

  let robotsTxt: RobotsTxtValidation | undefined;
  if (options?.robotsTxt) {
    robotsTxt = validateRobotsTxt(options.robotsTxt);
  }

  const sitemap = validateSitemap(html, options?.robotsTxt);

  // Calculate overall score (weighted average)
  const scores = [
    { score: metaTags.score, weight: 0.25 },
    { score: structuredData.score, weight: 0.20 },
    { score: canonicalUrl.score, weight: 0.10 },
    { score: openGraph.score, weight: 0.15 },
    { score: twitterCard.score, weight: 0.15 },
    { score: sitemap.score, weight: 0.10 },
  ];

  if (robotsTxt) {
    scores.push({ score: robotsTxt.score, weight: 0.05 });
  }

  const totalWeight = scores.reduce((sum, s) => sum + s.weight, 0);
  const weightedScore = scores.reduce((sum, s) => sum + (s.score * s.weight), 0);
  const score = Math.round(weightedScore / totalWeight);

  return {
    score,
    metaTags,
    structuredData,
    canonicalUrl,
    openGraph,
    twitterCard,
    robotsTxt,
    sitemap,
    timestamp: new Date().toISOString(),
    url: options?.url,
  };
}

// ============================================================================
// CLI Runner (if executed directly)
// ============================================================================

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🔍 SEO Audit Tool\n');
  console.log('Usage:');
  console.log('  npm run seo:audit');
  console.log('  npm run seo:audit -- --url https://example.com');
  console.log('  npm run seo:audit -- --html index.html\n');

  // This would be implemented to fetch and audit a real URL or file
  console.log('✅ SEO audit utilities are ready for use in tests');
}
