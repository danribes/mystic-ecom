/**
 * Web Vitals Monitoring and Optimization
 *
 * Utilities for measuring and optimizing Core Web Vitals:
 * - LCP (Largest Contentful Paint)
 * - FID (First Input Delay)
 * - CLS (Cumulative Layout Shift)
 * - FCP (First Contentful Paint)
 * - TTFB (Time to First Byte)
 * - INP (Interaction to Next Paint)
 *
 * Part of T145: Audit and optimize Core Web Vitals
 */

export type MetricName = 'LCP' | 'FID' | 'CLS' | 'FCP' | 'TTFB' | 'INP';

export interface WebVitalMetric {
  name: MetricName;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta?: number;
  id?: string;
  navigationType?: string;
}

export interface WebVitalsReport {
  lcp?: WebVitalMetric;
  fid?: WebVitalMetric;
  cls?: WebVitalMetric;
  fcp?: WebVitalMetric;
  ttfb?: WebVitalMetric;
  inp?: WebVitalMetric;
  url: string;
  timestamp: number;
}

/**
 * Core Web Vitals thresholds (in milliseconds or score)
 */
export const THRESHOLDS = {
  LCP: {
    good: 2500,
    poor: 4000,
  },
  FID: {
    good: 100,
    poor: 300,
  },
  CLS: {
    good: 0.1,
    poor: 0.25,
  },
  FCP: {
    good: 1800,
    poor: 3000,
  },
  TTFB: {
    good: 800,
    poor: 1800,
  },
  INP: {
    good: 200,
    poor: 500,
  },
} as const;

/**
 * Determines the rating for a given metric
 */
export function getRating(name: MetricName, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[name];

  if (value <= threshold.good) {
    return 'good';
  }

  if (value <= threshold.poor) {
    return 'needs-improvement';
  }

  return 'poor';
}

/**
 * Formats metric value for display
 */
export function formatMetricValue(name: MetricName, value: number): string {
  if (name === 'CLS') {
    return value.toFixed(3);
  }
  return `${Math.round(value)}ms`;
}

/**
 * Gets color for metric rating
 */
export function getRatingColor(rating: 'good' | 'needs-improvement' | 'poor'): string {
  const colors = {
    good: '#0cce6b',
    'needs-improvement': '#ffa400',
    poor: '#ff4e42',
  };
  return colors[rating];
}

/**
 * Gets emoji for metric rating
 */
export function getRatingEmoji(rating: 'good' | 'needs-improvement' | 'poor'): string {
  const emojis = {
    good: '✅',
    'needs-improvement': '⚠️',
    poor: '❌',
  };
  return emojis[rating];
}

/**
 * Calculates overall page score based on all metrics
 */
export function calculatePageScore(report: WebVitalsReport): number {
  const metrics = [report.lcp, report.fid, report.cls, report.fcp, report.ttfb, report.inp];
  const validMetrics = metrics.filter((m): m is WebVitalMetric => m !== undefined);

  if (validMetrics.length === 0) return 0;

  const ratingScores = {
    good: 100,
    'needs-improvement': 50,
    poor: 0,
  };

  const totalScore = validMetrics.reduce((sum, metric) => {
    return sum + ratingScores[metric.rating];
  }, 0);

  return Math.round(totalScore / validMetrics.length);
}

/**
 * Generates recommendations based on metrics
 */
export interface Recommendation {
  metric: MetricName;
  priority: 'high' | 'medium' | 'low';
  issue: string;
  suggestion: string;
  impact: string;
}

export function generateRecommendations(report: WebVitalsReport): Recommendation[] {
  const recommendations: Recommendation[] = [];

  // LCP recommendations
  if (report.lcp && report.lcp.rating !== 'good') {
    const priority = report.lcp.rating === 'poor' ? 'high' : 'medium';
    recommendations.push({
      metric: 'LCP',
      priority,
      issue: `Largest Contentful Paint is ${formatMetricValue('LCP', report.lcp.value)}`,
      suggestion: 'Optimize largest element: preload hero images, use CDN, optimize images, reduce render-blocking resources',
      impact: 'Improves perceived load speed and user experience',
    });
  }

  // FID recommendations
  if (report.fid && report.fid.rating !== 'good') {
    const priority = report.fid.rating === 'poor' ? 'high' : 'medium';
    recommendations.push({
      metric: 'FID',
      priority,
      issue: `First Input Delay is ${formatMetricValue('FID', report.fid.value)}`,
      suggestion: 'Reduce JavaScript execution time: code splitting, defer non-critical JS, use web workers',
      impact: 'Improves interactivity and responsiveness',
    });
  }

  // CLS recommendations
  if (report.cls && report.cls.rating !== 'good') {
    const priority = report.cls.rating === 'poor' ? 'high' : 'medium';
    recommendations.push({
      metric: 'CLS',
      priority,
      issue: `Cumulative Layout Shift score is ${formatMetricValue('CLS', report.cls.value)}`,
      suggestion: 'Set explicit dimensions for images/ads, avoid inserting content above existing content, use CSS aspect-ratio',
      impact: 'Prevents unexpected layout shifts and improves visual stability',
    });
  }

  // FCP recommendations
  if (report.fcp && report.fcp.rating !== 'good') {
    recommendations.push({
      metric: 'FCP',
      priority: 'medium',
      issue: `First Contentful Paint is ${formatMetricValue('FCP', report.fcp.value)}`,
      suggestion: 'Eliminate render-blocking resources, minify CSS, inline critical CSS, use font-display: swap',
      impact: 'Faster initial render and better perceived performance',
    });
  }

  // TTFB recommendations
  if (report.ttfb && report.ttfb.rating !== 'good') {
    recommendations.push({
      metric: 'TTFB',
      priority: 'medium',
      issue: `Time to First Byte is ${formatMetricValue('TTFB', report.ttfb.value)}`,
      suggestion: 'Use CDN, enable HTTP/2, optimize server response time, use edge caching',
      impact: 'Faster server response and initial load',
    });
  }

  // INP recommendations
  if (report.inp && report.inp.rating !== 'good') {
    recommendations.push({
      metric: 'INP',
      priority: 'medium',
      issue: `Interaction to Next Paint is ${formatMetricValue('INP', report.inp.value)}`,
      suggestion: 'Optimize event handlers, break up long tasks, use requestIdleCallback for non-critical work',
      impact: 'Better runtime performance and user interactions',
    });
  }

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  return recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}

/**
 * Generates detailed report
 */
export function generateVitalsReport(report: WebVitalsReport): string {
  const lines: string[] = [];

  lines.push('='.repeat(60));
  lines.push('🎯 Core Web Vitals Report');
  lines.push('='.repeat(60));
  lines.push('');

  // Overall score
  const score = calculatePageScore(report);
  const scoreEmoji = score >= 80 ? '✅' : score >= 50 ? '⚠️' : '❌';
  lines.push(`Overall Score: ${scoreEmoji} ${score}/100`);
  lines.push(`URL: ${report.url}`);
  lines.push(`Timestamp: ${new Date(report.timestamp).toISOString()}`);
  lines.push('');

  // Individual metrics
  lines.push('Core Metrics:');

  const metrics: Array<{ name: MetricName; metric?: WebVitalMetric }> = [
    { name: 'LCP', metric: report.lcp },
    { name: 'FID', metric: report.fid },
    { name: 'CLS', metric: report.cls },
  ];

  metrics.forEach(({ name, metric }) => {
    if (metric) {
      const emoji = getRatingEmoji(metric.rating);
      const value = formatMetricValue(name, metric.value);
      const threshold = THRESHOLDS[name];
      lines.push(`  ${emoji} ${name}: ${value} (${metric.rating})`);
      lines.push(`     Target: <${name === 'CLS' ? threshold.good : threshold.good + 'ms'}`);
    } else {
      lines.push(`  ⏳ ${name}: Not measured yet`);
    }
  });

  lines.push('');
  lines.push('Other Metrics:');

  const otherMetrics: Array<{ name: MetricName; metric?: WebVitalMetric }> = [
    { name: 'FCP', metric: report.fcp },
    { name: 'TTFB', metric: report.ttfb },
    { name: 'INP', metric: report.inp },
  ];

  otherMetrics.forEach(({ name, metric }) => {
    if (metric) {
      const emoji = getRatingEmoji(metric.rating);
      const value = formatMetricValue(name, metric.value);
      lines.push(`  ${emoji} ${name}: ${value} (${metric.rating})`);
    }
  });

  lines.push('');

  // Recommendations
  const recommendations = generateRecommendations(report);
  if (recommendations.length > 0) {
    lines.push('💡 Recommendations:');
    recommendations.forEach((rec, i) => {
      const priorityEmoji = rec.priority === 'high' ? '🔴' : rec.priority === 'medium' ? '🟡' : '🟢';
      lines.push(`  ${i + 1}. ${priorityEmoji} [${rec.metric}] ${rec.issue}`);
      lines.push(`     → ${rec.suggestion}`);
      lines.push(`     Impact: ${rec.impact}`);
      lines.push('');
    });
  } else {
    lines.push('✨ All metrics are performing well! No recommendations at this time.');
    lines.push('');
  }

  lines.push('='.repeat(60));

  return lines.join('\n');
}

/**
 * LCP optimization helpers
 */
export const LCPOptimizations = {
  /**
   * Generates preload links for critical images
   */
  generateImagePreload(src: string, type: string = 'image/jpeg'): string {
    return `<link rel="preload" as="image" href="${src}" type="${type}" fetchpriority="high">`;
  },

  /**
   * Generates preconnect links for external domains
   */
  generatePreconnect(domain: string): string {
    return `<link rel="preconnect" href="${domain}" crossorigin>`;
  },

  /**
   * Checks if resource is render-blocking
   */
  isRenderBlocking(tag: string, attrs: Record<string, string>): boolean {
    if (tag === 'script' && !attrs.async && !attrs.defer) return true;
    if (tag === 'link' && attrs.rel === 'stylesheet') return true;
    return false;
  },
};

/**
 * CLS optimization helpers
 */
export const CLSOptimizations = {
  /**
   * Calculates aspect ratio for layout stability
   */
  calculateAspectRatio(width: number, height: number): string {
    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
    const divisor = gcd(width, height);
    return `${width / divisor}/${height / divisor}`;
  },

  /**
   * Generates CSS for aspect ratio box
   */
  generateAspectRatioCSS(ratio: string): string {
    return `aspect-ratio: ${ratio};`;
  },

  /**
   * Validates if element has dimensions
   */
  hasDimensions(element: { width?: number; height?: number }): boolean {
    return !!(element.width && element.height);
  },
};

/**
 * FID optimization helpers
 */
export const FIDOptimizations = {
  /**
   * Checks if task is long (>50ms)
   */
  isLongTask(duration: number): boolean {
    return duration > 50;
  },

  /**
   * Suggests code splitting for large bundles
   */
  shouldCodeSplit(size: number): boolean {
    return size > 200 * 1024; // 200 KB
  },

  /**
   * Generates defer attribute for scripts
   */
  generateDeferScript(src: string): string {
    return `<script defer src="${src}"></script>`;
  },
};

/**
 * Performance marks and measures
 */
export class PerformanceMonitor {
  private marks: Map<string, number> = new Map();

  mark(name: string): void {
    this.marks.set(name, performance.now());
  }

  measure(name: string, startMark: string, endMark?: string): number {
    const start = this.marks.get(startMark);
    if (!start) {
      throw new Error(`Start mark "${startMark}" not found`);
    }

    const end = endMark ? this.marks.get(endMark) : performance.now();
    if (endMark && !end) {
      throw new Error(`End mark "${endMark}" not found`);
    }

    const duration = (end || performance.now()) - start;
    this.marks.set(name, duration);
    return duration;
  }

  getMeasure(name: string): number | undefined {
    return this.marks.get(name);
  }

  clear(): void {
    this.marks.clear();
  }
}

/**
 * Exports for browser usage
 */
export const webVitalsConfig = {
  thresholds: THRESHOLDS,
  getRating,
  formatMetricValue,
  getRatingColor,
  getRatingEmoji,
  calculatePageScore,
  generateRecommendations,
  generateVitalsReport,
};
