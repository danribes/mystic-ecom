/**
 * T239: SEO Metrics Utilities
 *
 * Functions for fetching and calculating SEO health metrics.
 * Includes Google Search Console API integration hooks and mock data for development.
 *
 * @see https://developers.google.com/webmaster-tools/search-console-api-original
 * @see https://developers.google.com/search/apis/indexing-api
 */

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * SEO metric status indicator
 */
export type SEOMetricStatus = 'healthy' | 'warning' | 'error' | 'unknown';

/**
 * SEO metric trend direction
 */
export type SEOMetricTrend = 'up' | 'down' | 'stable' | 'unknown';

/**
 * Google Search Console indexing metrics
 */
export interface IndexingMetrics {
  /**
   * Total pages on the site
   */
  totalPages: number;

  /**
   * Pages indexed by Google
   */
  indexedPages: number;

  /**
   * Pages submitted in sitemap
   */
  sitemapPages: number;

  /**
   * Pages blocked by robots.txt
   */
  blockedPages: number;

  /**
   * Pages with errors (4xx, 5xx)
   */
  errorPages: number;

  /**
   * Indexing rate (indexed / total)
   */
  indexingRate: number;

  /**
   * Status indicator
   */
  status: SEOMetricStatus;

  /**
   * Last update timestamp
   */
  lastUpdated: Date;
}

/**
 * Keyword performance metrics
 */
export interface KeywordMetrics {
  /**
   * Total tracked keywords
   */
  totalKeywords: number;

  /**
   * Average position across all keywords
   */
  averagePosition: number;

  /**
   * Keywords in top 10
   */
  top10Keywords: number;

  /**
   * Keywords in top 3
   */
  top3Keywords: number;

  /**
   * Position trend (vs last period)
   */
  positionTrend: SEOMetricTrend;

  /**
   * Position change
   */
  positionChange: number;

  /**
   * Status indicator
   */
  status: SEOMetricStatus;

  /**
   * Top performing keywords
   */
  topKeywords: Array<{
    keyword: string;
    position: number;
    clicks: number;
    impressions: number;
    ctr: number;
  }>;
}

/**
 * Click-through rate metrics
 */
export interface CTRMetrics {
  /**
   * Total impressions in search results
   */
  impressions: number;

  /**
   * Total clicks from search results
   */
  clicks: number;

  /**
   * Overall CTR percentage
   */
  ctr: number;

  /**
   * CTR trend (vs last period)
   */
  ctrTrend: SEOMetricTrend;

  /**
   * CTR change percentage
   */
  ctrChange: number;

  /**
   * Status indicator
   */
  status: SEOMetricStatus;

  /**
   * CTR by page
   */
  topPages: Array<{
    url: string;
    impressions: number;
    clicks: number;
    ctr: number;
  }>;
}

/**
 * Structured data error report
 */
export interface StructuredDataError {
  /**
   * Error type
   */
  type: string;

  /**
   * Error severity
   */
  severity: 'error' | 'warning';

  /**
   * Number of pages affected
   */
  affectedPages: number;

  /**
   * Example URLs with the error
   */
  exampleUrls: string[];

  /**
   * Error description
   */
  description: string;
}

/**
 * Structured data metrics
 */
export interface StructuredDataMetrics {
  /**
   * Total pages with structured data
   */
  totalPages: number;

  /**
   * Pages with valid structured data
   */
  validPages: number;

  /**
   * Pages with errors
   */
  pagesWithErrors: number;

  /**
   * Pages with warnings
   */
  pagesWithWarnings: number;

  /**
   * Status indicator
   */
  status: SEOMetricStatus;

  /**
   * Structured data types in use
   */
  types: Array<{
    type: string;
    count: number;
    valid: number;
    errors: number;
  }>;

  /**
   * Error details
   */
  errors: StructuredDataError[];
}

/**
 * Sitemap status metrics
 */
export interface SitemapMetrics {
  /**
   * Sitemap URL
   */
  sitemapUrl: string;

  /**
   * Sitemap exists and is accessible
   */
  exists: boolean;

  /**
   * URLs in sitemap
   */
  urlCount: number;

  /**
   * Last modified date
   */
  lastModified: Date | null;

  /**
   * Is submitted to Google Search Console
   */
  submittedToGSC: boolean;

  /**
   * URLs processed by Google
   */
  processedUrls: number;

  /**
   * Sitemap errors
   */
  errors: string[];

  /**
   * Status indicator
   */
  status: SEOMetricStatus;
}

/**
 * Core Web Vitals metrics
 */
export interface CoreWebVitalsMetrics {
  /**
   * Largest Contentful Paint (LCP) in seconds
   */
  lcp: number;

  /**
   * First Input Delay (FID) in milliseconds
   */
  fid: number;

  /**
   * Cumulative Layout Shift (CLS)
   */
  cls: number;

  /**
   * Percentage of pages with good LCP
   */
  goodLCP: number;

  /**
   * Percentage of pages with good FID
   */
  goodFID: number;

  /**
   * Percentage of pages with good CLS
   */
  goodCLS: number;

  /**
   * Overall status
   */
  status: SEOMetricStatus;
}

/**
 * Complete SEO metrics dashboard data
 */
export interface SEOMetrics {
  /**
   * Indexing metrics
   */
  indexing: IndexingMetrics;

  /**
   * Keyword performance
   */
  keywords: KeywordMetrics;

  /**
   * Click-through rate
   */
  ctr: CTRMetrics;

  /**
   * Structured data
   */
  structuredData: StructuredDataMetrics;

  /**
   * Sitemap status
   */
  sitemap: SitemapMetrics;

  /**
   * Core Web Vitals
   */
  coreWebVitals: CoreWebVitalsMetrics;

  /**
   * Overall SEO health score (0-100)
   */
  healthScore: number;

  /**
   * Health status
   */
  healthStatus: SEOMetricStatus;

  /**
   * Last updated timestamp
   */
  lastUpdated: Date;
}

/**
 * Google Search Console API configuration
 */
export interface GSCConfig {
  /**
   * API key or OAuth credentials
   */
  apiKey?: string;

  /**
   * Site URL
   */
  siteUrl: string;

  /**
   * Enable API calls
   */
  enabled: boolean;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * SEO health thresholds
 */
export const SEO_THRESHOLDS = {
  indexingRate: {
    healthy: 0.9, // 90%+
    warning: 0.7, // 70-90%
  },
  averagePosition: {
    healthy: 10, // Top 10
    warning: 20, // Top 20
  },
  ctr: {
    healthy: 0.05, // 5%+
    warning: 0.02, // 2-5%
  },
  structuredDataErrors: {
    healthy: 0, // No errors
    warning: 5, // 1-5 errors
  },
  coreWebVitals: {
    lcp: {
      good: 2.5, // seconds
      needsImprovement: 4.0,
    },
    fid: {
      good: 100, // milliseconds
      needsImprovement: 300,
    },
    cls: {
      good: 0.1,
      needsImprovement: 0.25,
    },
  },
};

/**
 * Default SEO metrics (fallback/mock data)
 */
export const DEFAULT_SEO_METRICS: SEOMetrics = {
  indexing: {
    totalPages: 0,
    indexedPages: 0,
    sitemapPages: 0,
    blockedPages: 0,
    errorPages: 0,
    indexingRate: 0,
    status: 'unknown',
    lastUpdated: new Date(),
  },
  keywords: {
    totalKeywords: 0,
    averagePosition: 0,
    top10Keywords: 0,
    top3Keywords: 0,
    positionTrend: 'unknown',
    positionChange: 0,
    status: 'unknown',
    topKeywords: [],
  },
  ctr: {
    impressions: 0,
    clicks: 0,
    ctr: 0,
    ctrTrend: 'unknown',
    ctrChange: 0,
    status: 'unknown',
    topPages: [],
  },
  structuredData: {
    totalPages: 0,
    validPages: 0,
    pagesWithErrors: 0,
    pagesWithWarnings: 0,
    status: 'unknown',
    types: [],
    errors: [],
  },
  sitemap: {
    sitemapUrl: '/sitemap.xml',
    exists: false,
    urlCount: 0,
    lastModified: null,
    submittedToGSC: false,
    processedUrls: 0,
    errors: [],
    status: 'unknown',
  },
  coreWebVitals: {
    lcp: 0,
    fid: 0,
    cls: 0,
    goodLCP: 0,
    goodFID: 0,
    goodCLS: 0,
    status: 'unknown',
  },
  healthScore: 0,
  healthStatus: 'unknown',
  lastUpdated: new Date(),
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Calculate SEO health status based on value and thresholds
 */
export function calculateStatus(
  value: number,
  healthThreshold: number,
  warningThreshold: number,
  higherIsBetter: boolean = true
): SEOMetricStatus {
  if (value === 0) return 'unknown';

  if (higherIsBetter) {
    if (value >= healthThreshold) return 'healthy';
    if (value >= warningThreshold) return 'warning';
    return 'error';
  } else {
    if (value <= healthThreshold) return 'healthy';
    if (value <= warningThreshold) return 'warning';
    return 'error';
  }
}

/**
 * Calculate trend direction
 */
export function calculateTrend(currentValue: number, previousValue: number): SEOMetricTrend {
  if (previousValue === 0 || currentValue === previousValue) return 'stable';

  const change = ((currentValue - previousValue) / previousValue) * 100;

  if (Math.abs(change) < 2) return 'stable'; // Less than 2% change is stable
  return change > 0 ? 'up' : 'down';
}

/**
 * Calculate overall SEO health score (0-100)
 */
export function calculateHealthScore(metrics: SEOMetrics): number {
  const scores = {
    indexing: Math.min(metrics.indexing.indexingRate * 100, 100),
    keywords: Math.max(100 - metrics.keywords.averagePosition * 3, 0),
    ctr: Math.min(metrics.ctr.ctr * 1000, 100),
    structuredData:
      metrics.structuredData.totalPages > 0
        ? (metrics.structuredData.validPages / metrics.structuredData.totalPages) * 100
        : 50,
    sitemap: metrics.sitemap.exists && metrics.sitemap.errors.length === 0 ? 100 : 50,
    coreWebVitals:
      ((metrics.coreWebVitals.goodLCP + metrics.coreWebVitals.goodFID + metrics.coreWebVitals.goodCLS) / 3),
  };

  // Weighted average
  const weights = {
    indexing: 0.25,
    keywords: 0.20,
    ctr: 0.15,
    structuredData: 0.15,
    sitemap: 0.10,
    coreWebVitals: 0.15,
  };

  const weightedScore =
    scores.indexing * weights.indexing +
    scores.keywords * weights.keywords +
    scores.ctr * weights.ctr +
    scores.structuredData * weights.structuredData +
    scores.sitemap * weights.sitemap +
    scores.coreWebVitals * weights.coreWebVitals;

  return Math.round(weightedScore);
}

/**
 * Get status color class for Tailwind
 */
export function getStatusColorClass(status: SEOMetricStatus): string {
  switch (status) {
    case 'healthy':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'warning':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'error':
      return 'text-red-600 bg-red-50 border-red-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
}

/**
 * Get status icon
 */
export function getStatusIcon(status: SEOMetricStatus): string {
  switch (status) {
    case 'healthy':
      return '✅';
    case 'warning':
      return '⚠️';
    case 'error':
      return '❌';
    default:
      return '❓';
  }
}

/**
 * Get trend icon
 */
export function getTrendIcon(trend: SEOMetricTrend): string {
  switch (trend) {
    case 'up':
      return '📈';
    case 'down':
      return '📉';
    case 'stable':
      return '➖';
    default:
      return '❓';
  }
}

/**
 * Format percentage
 */
export function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

/**
 * Format number with commas
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

// ============================================================================
// Data Fetching Functions
// ============================================================================

/**
 * Fetch indexing metrics from Google Search Console
 * @param config - GSC configuration
 * @returns Indexing metrics
 */
export async function fetchIndexingMetrics(config: GSCConfig): Promise<IndexingMetrics> {
  // If API is disabled, return mock data
  if (!config.enabled || !config.apiKey) {
    return generateMockIndexingMetrics();
  }

  try {
    // TODO: Implement actual GSC API call
    // const response = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(config.siteUrl)}/searchAnalytics/query`, {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${config.apiKey}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({...})
    // });

    // For now, return mock data
    return generateMockIndexingMetrics();
  } catch (error) {
    console.error('Failed to fetch indexing metrics:', error);
    return generateMockIndexingMetrics();
  }
}

/**
 * Fetch keyword metrics from Google Search Console
 */
export async function fetchKeywordMetrics(config: GSCConfig): Promise<KeywordMetrics> {
  if (!config.enabled || !config.apiKey) {
    return generateMockKeywordMetrics();
  }

  try {
    // TODO: Implement actual GSC API call
    return generateMockKeywordMetrics();
  } catch (error) {
    console.error('Failed to fetch keyword metrics:', error);
    return generateMockKeywordMetrics();
  }
}

/**
 * Fetch CTR metrics from Google Search Console
 */
export async function fetchCTRMetrics(config: GSCConfig): Promise<CTRMetrics> {
  if (!config.enabled || !config.apiKey) {
    return generateMockCTRMetrics();
  }

  try {
    // TODO: Implement actual GSC API call
    return generateMockCTRMetrics();
  } catch (error) {
    console.error('Failed to fetch CTR metrics:', error);
    return generateMockCTRMetrics();
  }
}

/**
 * Check sitemap status
 */
export async function checkSitemapStatus(siteUrl: string): Promise<SitemapMetrics> {
  try {
    const sitemapUrl = `${siteUrl}/sitemap.xml`;

    // In production, this would make an actual HTTP request
    // For now, return mock data
    return {
      sitemapUrl,
      exists: true,
      urlCount: 42,
      lastModified: new Date(),
      submittedToGSC: false,
      processedUrls: 38,
      errors: [],
      status: 'healthy',
    };
  } catch (error) {
    console.error('Failed to check sitemap:', error);
    return {
      sitemapUrl: `${siteUrl}/sitemap.xml`,
      exists: false,
      urlCount: 0,
      lastModified: null,
      submittedToGSC: false,
      processedUrls: 0,
      errors: ['Sitemap not accessible'],
      status: 'error',
    };
  }
}

/**
 * Analyze structured data errors
 */
export async function analyzeStructuredData(siteUrl: string): Promise<StructuredDataMetrics> {
  try {
    // In production, this would scan pages or use GSC API
    // For now, return mock data
    return {
      totalPages: 42,
      validPages: 40,
      pagesWithErrors: 0,
      pagesWithWarnings: 2,
      status: 'healthy',
      types: [
        { type: 'WebSite', count: 1, valid: 1, errors: 0 },
        { type: 'Organization', count: 1, valid: 1, errors: 0 },
        { type: 'Course', count: 15, valid: 15, errors: 0 },
        { type: 'Event', count: 10, valid: 10, errors: 0 },
        { type: 'Product', count: 8, valid: 8, errors: 0 },
        { type: 'BreadcrumbList', count: 40, valid: 40, errors: 0 },
        { type: 'FAQPage', count: 5, valid: 5, errors: 0 },
      ],
      errors: [],
    };
  } catch (error) {
    console.error('Failed to analyze structured data:', error);
    return {
      totalPages: 0,
      validPages: 0,
      pagesWithErrors: 0,
      pagesWithWarnings: 0,
      status: 'unknown',
      types: [],
      errors: [],
    };
  }
}

/**
 * Fetch Core Web Vitals metrics
 */
export async function fetchCoreWebVitals(siteUrl: string): Promise<CoreWebVitalsMetrics> {
  try {
    // In production, this would use PageSpeed Insights API or CrUX API
    // For now, return mock data
    return {
      lcp: 2.1,
      fid: 85,
      cls: 0.08,
      goodLCP: 85,
      goodFID: 92,
      goodCLS: 88,
      status: 'healthy',
    };
  } catch (error) {
    console.error('Failed to fetch Core Web Vitals:', error);
    return {
      lcp: 0,
      fid: 0,
      cls: 0,
      goodLCP: 0,
      goodFID: 0,
      goodCLS: 0,
      status: 'unknown',
    };
  }
}

/**
 * Fetch all SEO metrics
 */
export async function fetchSEOMetrics(config: GSCConfig): Promise<SEOMetrics> {
  try {
    const [indexing, keywords, ctr, structuredData, sitemap, coreWebVitals] = await Promise.all([
      fetchIndexingMetrics(config),
      fetchKeywordMetrics(config),
      fetchCTRMetrics(config),
      analyzeStructuredData(config.siteUrl),
      checkSitemapStatus(config.siteUrl),
      fetchCoreWebVitals(config.siteUrl),
    ]);

    const metrics: SEOMetrics = {
      indexing,
      keywords,
      ctr,
      structuredData,
      sitemap,
      coreWebVitals,
      healthScore: 0,
      healthStatus: 'unknown',
      lastUpdated: new Date(),
    };

    // Calculate overall health
    metrics.healthScore = calculateHealthScore(metrics);
    metrics.healthStatus = calculateStatus(metrics.healthScore, 80, 60, true);

    return metrics;
  } catch (error) {
    console.error('Failed to fetch SEO metrics:', error);
    return DEFAULT_SEO_METRICS;
  }
}

// ============================================================================
// Mock Data Generators (for development/testing)
// ============================================================================

/**
 * Generate mock indexing metrics
 */
function generateMockIndexingMetrics(): IndexingMetrics {
  const totalPages = 42;
  const indexedPages = 38;
  const sitemapPages = 42;

  return {
    totalPages,
    indexedPages,
    sitemapPages,
    blockedPages: 0,
    errorPages: 4,
    indexingRate: indexedPages / totalPages,
    status: calculateStatus(indexedPages / totalPages, 0.9, 0.7, true),
    lastUpdated: new Date(),
  };
}

/**
 * Generate mock keyword metrics
 */
function generateMockKeywordMetrics(): KeywordMetrics {
  return {
    totalKeywords: 25,
    averagePosition: 12.5,
    top10Keywords: 10,
    top3Keywords: 3,
    positionTrend: 'up',
    positionChange: -2.3, // Negative is better (higher position)
    status: calculateStatus(12.5, 10, 20, false),
    topKeywords: [
      { keyword: 'meditation courses online', position: 3.2, clicks: 145, impressions: 2450, ctr: 0.059 },
      { keyword: 'mindfulness training', position: 5.8, clicks: 98, impressions: 1820, ctr: 0.054 },
      { keyword: 'spiritual wellness', position: 8.1, clicks: 76, impressions: 1520, ctr: 0.05 },
      { keyword: 'online yoga classes', position: 11.4, clicks: 52, impressions: 980, ctr: 0.053 },
      { keyword: 'meditation for beginners', position: 15.2, clicks: 34, impressions: 750, ctr: 0.045 },
    ],
  };
}

/**
 * Generate mock CTR metrics
 */
function generateMockCTRMetrics(): CTRMetrics {
  const impressions = 12500;
  const clicks = 625;
  const ctr = clicks / impressions;

  return {
    impressions,
    clicks,
    ctr,
    ctrTrend: 'up',
    ctrChange: 0.008, // +0.8%
    status: calculateStatus(ctr, 0.05, 0.02, true),
    topPages: [
      { url: '/courses/meditation-basics', impressions: 2450, clicks: 145, ctr: 0.059 },
      { url: '/courses/mindfulness-training', impressions: 1820, clicks: 98, ctr: 0.054 },
      { url: '/events/wellness-retreat', impressions: 1520, clicks: 76, ctr: 0.05 },
      { url: '/products/meditation-cushion', impressions: 980, clicks: 52, ctr: 0.053 },
      { url: '/', impressions: 3200, clicks: 180, ctr: 0.056 },
    ],
  };
}

/**
 * Get mock SEO metrics for development
 */
export function getMockSEOMetrics(): SEOMetrics {
  const metrics: SEOMetrics = {
    indexing: generateMockIndexingMetrics(),
    keywords: generateMockKeywordMetrics(),
    ctr: generateMockCTRMetrics(),
    structuredData: {
      totalPages: 42,
      validPages: 40,
      pagesWithErrors: 0,
      pagesWithWarnings: 2,
      status: 'healthy',
      types: [
        { type: 'WebSite', count: 1, valid: 1, errors: 0 },
        { type: 'Organization', count: 1, valid: 1, errors: 0 },
        { type: 'Course', count: 15, valid: 15, errors: 0 },
        { type: 'Event', count: 10, valid: 10, errors: 0 },
        { type: 'Product', count: 8, valid: 8, errors: 0 },
        { type: 'BreadcrumbList', count: 40, valid: 40, errors: 0 },
        { type: 'FAQPage', count: 5, valid: 5, errors: 0 },
      ],
      errors: [],
    },
    sitemap: {
      sitemapUrl: '/sitemap.xml',
      exists: true,
      urlCount: 42,
      lastModified: new Date(),
      submittedToGSC: true,
      processedUrls: 38,
      errors: [],
      status: 'healthy',
    },
    coreWebVitals: {
      lcp: 2.1,
      fid: 85,
      cls: 0.08,
      goodLCP: 85,
      goodFID: 92,
      goodCLS: 88,
      status: 'healthy',
    },
    healthScore: 0,
    healthStatus: 'healthy',
    lastUpdated: new Date(),
  };

  metrics.healthScore = calculateHealthScore(metrics);
  metrics.healthStatus = calculateStatus(metrics.healthScore, 80, 60, true);

  return metrics;
}
