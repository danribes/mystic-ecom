/**
 * Unit Tests for Web Vitals Monitoring and Optimization
 * Task T145: Audit and optimize Core Web Vitals (LCP, FID, CLS)
 *
 * Tests cover:
 * - Metric rating calculations
 * - Value formatting
 * - Score calculations
 * - Recommendation generation
 * - Optimization helpers
 * - Performance monitoring
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  getRating,
  formatMetricValue,
  getRatingColor,
  getRatingEmoji,
  calculatePageScore,
  generateRecommendations,
  generateVitalsReport,
  THRESHOLDS,
  LCPOptimizations,
  CLSOptimizations,
  FIDOptimizations,
  PerformanceMonitor,
  type WebVitalsReport,
  type WebVitalMetric,
  type MetricName,
} from '../../src/lib/webVitals';

describe('Web Vitals - Thresholds', () => {
  it('should have correct LCP thresholds', () => {
    expect(THRESHOLDS.LCP.good).toBe(2500);
    expect(THRESHOLDS.LCP.poor).toBe(4000);
  });

  it('should have correct FID thresholds', () => {
    expect(THRESHOLDS.FID.good).toBe(100);
    expect(THRESHOLDS.FID.poor).toBe(300);
  });

  it('should have correct CLS thresholds', () => {
    expect(THRESHOLDS.CLS.good).toBe(0.1);
    expect(THRESHOLDS.CLS.poor).toBe(0.25);
  });

  it('should have correct FCP thresholds', () => {
    expect(THRESHOLDS.FCP.good).toBe(1800);
    expect(THRESHOLDS.FCP.poor).toBe(3000);
  });

  it('should have correct TTFB thresholds', () => {
    expect(THRESHOLDS.TTFB.good).toBe(800);
    expect(THRESHOLDS.TTFB.poor).toBe(1800);
  });

  it('should have correct INP thresholds', () => {
    expect(THRESHOLDS.INP.good).toBe(200);
    expect(THRESHOLDS.INP.poor).toBe(500);
  });
});

describe('getRating()', () => {
  describe('LCP ratings', () => {
    it('should return "good" for LCP <= 2500ms', () => {
      expect(getRating('LCP', 2000)).toBe('good');
      expect(getRating('LCP', 2500)).toBe('good');
    });

    it('should return "needs-improvement" for LCP between 2500ms and 4000ms', () => {
      expect(getRating('LCP', 2501)).toBe('needs-improvement');
      expect(getRating('LCP', 3500)).toBe('needs-improvement');
      expect(getRating('LCP', 4000)).toBe('needs-improvement');
    });

    it('should return "poor" for LCP > 4000ms', () => {
      expect(getRating('LCP', 4001)).toBe('poor');
      expect(getRating('LCP', 5000)).toBe('poor');
    });
  });

  describe('FID ratings', () => {
    it('should return "good" for FID <= 100ms', () => {
      expect(getRating('FID', 50)).toBe('good');
      expect(getRating('FID', 100)).toBe('good');
    });

    it('should return "needs-improvement" for FID between 100ms and 300ms', () => {
      expect(getRating('FID', 101)).toBe('needs-improvement');
      expect(getRating('FID', 200)).toBe('needs-improvement');
      expect(getRating('FID', 300)).toBe('needs-improvement');
    });

    it('should return "poor" for FID > 300ms', () => {
      expect(getRating('FID', 301)).toBe('poor');
      expect(getRating('FID', 500)).toBe('poor');
    });
  });

  describe('CLS ratings', () => {
    it('should return "good" for CLS <= 0.1', () => {
      expect(getRating('CLS', 0.05)).toBe('good');
      expect(getRating('CLS', 0.1)).toBe('good');
    });

    it('should return "needs-improvement" for CLS between 0.1 and 0.25', () => {
      expect(getRating('CLS', 0.11)).toBe('needs-improvement');
      expect(getRating('CLS', 0.2)).toBe('needs-improvement');
      expect(getRating('CLS', 0.25)).toBe('needs-improvement');
    });

    it('should return "poor" for CLS > 0.25', () => {
      expect(getRating('CLS', 0.26)).toBe('poor');
      expect(getRating('CLS', 0.5)).toBe('poor');
    });
  });

  describe('FCP ratings', () => {
    it('should return "good" for FCP <= 1800ms', () => {
      expect(getRating('FCP', 1500)).toBe('good');
      expect(getRating('FCP', 1800)).toBe('good');
    });

    it('should return "needs-improvement" for FCP between 1800ms and 3000ms', () => {
      expect(getRating('FCP', 1801)).toBe('needs-improvement');
      expect(getRating('FCP', 2500)).toBe('needs-improvement');
      expect(getRating('FCP', 3000)).toBe('needs-improvement');
    });

    it('should return "poor" for FCP > 3000ms', () => {
      expect(getRating('FCP', 3001)).toBe('poor');
      expect(getRating('FCP', 4000)).toBe('poor');
    });
  });

  describe('TTFB ratings', () => {
    it('should return "good" for TTFB <= 800ms', () => {
      expect(getRating('TTFB', 600)).toBe('good');
      expect(getRating('TTFB', 800)).toBe('good');
    });

    it('should return "needs-improvement" for TTFB between 800ms and 1800ms', () => {
      expect(getRating('TTFB', 801)).toBe('needs-improvement');
      expect(getRating('TTFB', 1500)).toBe('needs-improvement');
      expect(getRating('TTFB', 1800)).toBe('needs-improvement');
    });

    it('should return "poor" for TTFB > 1800ms', () => {
      expect(getRating('TTFB', 1801)).toBe('poor');
      expect(getRating('TTFB', 2500)).toBe('poor');
    });
  });

  describe('INP ratings', () => {
    it('should return "good" for INP <= 200ms', () => {
      expect(getRating('INP', 150)).toBe('good');
      expect(getRating('INP', 200)).toBe('good');
    });

    it('should return "needs-improvement" for INP between 200ms and 500ms', () => {
      expect(getRating('INP', 201)).toBe('needs-improvement');
      expect(getRating('INP', 400)).toBe('needs-improvement');
      expect(getRating('INP', 500)).toBe('needs-improvement');
    });

    it('should return "poor" for INP > 500ms', () => {
      expect(getRating('INP', 501)).toBe('poor');
      expect(getRating('INP', 800)).toBe('poor');
    });
  });
});

describe('formatMetricValue()', () => {
  it('should format CLS values with 3 decimal places', () => {
    expect(formatMetricValue('CLS', 0.123456)).toBe('0.123');
    expect(formatMetricValue('CLS', 0.1)).toBe('0.100');
    expect(formatMetricValue('CLS', 0.25678)).toBe('0.257');
  });

  it('should format time-based metrics with "ms" suffix', () => {
    expect(formatMetricValue('LCP', 2543.67)).toBe('2544ms');
    expect(formatMetricValue('FID', 85.3)).toBe('85ms');
    expect(formatMetricValue('FCP', 1678.9)).toBe('1679ms');
    expect(formatMetricValue('TTFB', 654.2)).toBe('654ms');
    expect(formatMetricValue('INP', 234.8)).toBe('235ms');
  });

  it('should round time values to nearest integer', () => {
    expect(formatMetricValue('LCP', 2500.4)).toBe('2500ms');
    expect(formatMetricValue('LCP', 2500.6)).toBe('2501ms');
  });
});

describe('getRatingColor()', () => {
  it('should return green color for "good" rating', () => {
    expect(getRatingColor('good')).toBe('#0cce6b');
  });

  it('should return orange color for "needs-improvement" rating', () => {
    expect(getRatingColor('needs-improvement')).toBe('#ffa400');
  });

  it('should return red color for "poor" rating', () => {
    expect(getRatingColor('poor')).toBe('#ff4e42');
  });
});

describe('getRatingEmoji()', () => {
  it('should return checkmark emoji for "good" rating', () => {
    expect(getRatingEmoji('good')).toBe('✅');
  });

  it('should return warning emoji for "needs-improvement" rating', () => {
    expect(getRatingEmoji('needs-improvement')).toBe('⚠️');
  });

  it('should return cross emoji for "poor" rating', () => {
    expect(getRatingEmoji('poor')).toBe('❌');
  });
});

describe('calculatePageScore()', () => {
  it('should return 0 for empty report', () => {
    const report: WebVitalsReport = {
      url: 'https://example.com',
      timestamp: Date.now(),
    };
    expect(calculatePageScore(report)).toBe(0);
  });

  it('should calculate 100 score when all metrics are good', () => {
    const report: WebVitalsReport = {
      url: 'https://example.com',
      timestamp: Date.now(),
      lcp: { name: 'LCP', value: 2000, rating: 'good' },
      fid: { name: 'FID', value: 80, rating: 'good' },
      cls: { name: 'CLS', value: 0.05, rating: 'good' },
    };
    expect(calculatePageScore(report)).toBe(100);
  });

  it('should calculate 0 score when all metrics are poor', () => {
    const report: WebVitalsReport = {
      url: 'https://example.com',
      timestamp: Date.now(),
      lcp: { name: 'LCP', value: 5000, rating: 'poor' },
      fid: { name: 'FID', value: 500, rating: 'poor' },
      cls: { name: 'CLS', value: 0.5, rating: 'poor' },
    };
    expect(calculatePageScore(report)).toBe(0);
  });

  it('should calculate 50 score when all metrics need improvement', () => {
    const report: WebVitalsReport = {
      url: 'https://example.com',
      timestamp: Date.now(),
      lcp: { name: 'LCP', value: 3000, rating: 'needs-improvement' },
      fid: { name: 'FID', value: 200, rating: 'needs-improvement' },
      cls: { name: 'CLS', value: 0.15, rating: 'needs-improvement' },
    };
    expect(calculatePageScore(report)).toBe(50);
  });

  it('should calculate mixed score correctly', () => {
    const report: WebVitalsReport = {
      url: 'https://example.com',
      timestamp: Date.now(),
      lcp: { name: 'LCP', value: 2000, rating: 'good' }, // 100
      fid: { name: 'FID', value: 200, rating: 'needs-improvement' }, // 50
      cls: { name: 'CLS', value: 0.5, rating: 'poor' }, // 0
      fcp: { name: 'FCP', value: 1500, rating: 'good' }, // 100
    };
    // (100 + 50 + 0 + 100) / 4 = 62.5, rounds to 63
    expect(calculatePageScore(report)).toBe(63);
  });

  it('should handle report with only some metrics', () => {
    const report: WebVitalsReport = {
      url: 'https://example.com',
      timestamp: Date.now(),
      lcp: { name: 'LCP', value: 2000, rating: 'good' },
      cls: { name: 'CLS', value: 0.05, rating: 'good' },
    };
    expect(calculatePageScore(report)).toBe(100);
  });
});

describe('generateRecommendations()', () => {
  it('should return empty array when all metrics are good', () => {
    const report: WebVitalsReport = {
      url: 'https://example.com',
      timestamp: Date.now(),
      lcp: { name: 'LCP', value: 2000, rating: 'good' },
      fid: { name: 'FID', value: 80, rating: 'good' },
      cls: { name: 'CLS', value: 0.05, rating: 'good' },
      fcp: { name: 'FCP', value: 1500, rating: 'good' },
      ttfb: { name: 'TTFB', value: 600, rating: 'good' },
      inp: { name: 'INP', value: 150, rating: 'good' },
    };
    const recommendations = generateRecommendations(report);
    expect(recommendations).toHaveLength(0);
  });

  it('should generate high priority recommendation for poor LCP', () => {
    const report: WebVitalsReport = {
      url: 'https://example.com',
      timestamp: Date.now(),
      lcp: { name: 'LCP', value: 5000, rating: 'poor' },
    };
    const recommendations = generateRecommendations(report);
    expect(recommendations).toHaveLength(1);
    expect(recommendations[0].metric).toBe('LCP');
    expect(recommendations[0].priority).toBe('high');
    expect(recommendations[0].suggestion).toContain('preload hero images');
  });

  it('should generate medium priority recommendation for needs-improvement LCP', () => {
    const report: WebVitalsReport = {
      url: 'https://example.com',
      timestamp: Date.now(),
      lcp: { name: 'LCP', value: 3000, rating: 'needs-improvement' },
    };
    const recommendations = generateRecommendations(report);
    expect(recommendations[0].priority).toBe('medium');
  });

  it('should generate FID recommendation with correct suggestion', () => {
    const report: WebVitalsReport = {
      url: 'https://example.com',
      timestamp: Date.now(),
      fid: { name: 'FID', value: 400, rating: 'poor' },
    };
    const recommendations = generateRecommendations(report);
    expect(recommendations[0].metric).toBe('FID');
    expect(recommendations[0].suggestion).toContain('code splitting');
    expect(recommendations[0].suggestion).toContain('web workers');
  });

  it('should generate CLS recommendation with correct suggestion', () => {
    const report: WebVitalsReport = {
      url: 'https://example.com',
      timestamp: Date.now(),
      cls: { name: 'CLS', value: 0.35, rating: 'poor' },
    };
    const recommendations = generateRecommendations(report);
    expect(recommendations[0].metric).toBe('CLS');
    expect(recommendations[0].suggestion).toContain('explicit dimensions');
    expect(recommendations[0].suggestion).toContain('aspect-ratio');
  });

  it('should generate FCP recommendation', () => {
    const report: WebVitalsReport = {
      url: 'https://example.com',
      timestamp: Date.now(),
      fcp: { name: 'FCP', value: 3500, rating: 'poor' },
    };
    const recommendations = generateRecommendations(report);
    expect(recommendations[0].metric).toBe('FCP');
    expect(recommendations[0].priority).toBe('medium');
    expect(recommendations[0].suggestion).toContain('render-blocking');
  });

  it('should generate TTFB recommendation', () => {
    const report: WebVitalsReport = {
      url: 'https://example.com',
      timestamp: Date.now(),
      ttfb: { name: 'TTFB', value: 2000, rating: 'poor' },
    };
    const recommendations = generateRecommendations(report);
    expect(recommendations[0].metric).toBe('TTFB');
    expect(recommendations[0].suggestion).toContain('CDN');
  });

  it('should generate INP recommendation', () => {
    const report: WebVitalsReport = {
      url: 'https://example.com',
      timestamp: Date.now(),
      inp: { name: 'INP', value: 600, rating: 'poor' },
    };
    const recommendations = generateRecommendations(report);
    expect(recommendations[0].metric).toBe('INP');
    expect(recommendations[0].suggestion).toContain('event handlers');
  });

  it('should sort recommendations by priority (high first)', () => {
    const report: WebVitalsReport = {
      url: 'https://example.com',
      timestamp: Date.now(),
      lcp: { name: 'LCP', value: 5000, rating: 'poor' }, // high
      fid: { name: 'FID', value: 400, rating: 'poor' }, // high
      fcp: { name: 'FCP', value: 2500, rating: 'needs-improvement' }, // medium
      ttfb: { name: 'TTFB', value: 1500, rating: 'needs-improvement' }, // medium
    };
    const recommendations = generateRecommendations(report);
    expect(recommendations[0].priority).toBe('high');
    expect(recommendations[1].priority).toBe('high');
    expect(recommendations[2].priority).toBe('medium');
    expect(recommendations[3].priority).toBe('medium');
  });
});

describe('generateVitalsReport()', () => {
  it('should generate report with all sections', () => {
    const report: WebVitalsReport = {
      url: 'https://example.com',
      timestamp: 1234567890000,
      lcp: { name: 'LCP', value: 2000, rating: 'good' },
      fid: { name: 'FID', value: 80, rating: 'good' },
      cls: { name: 'CLS', value: 0.05, rating: 'good' },
      fcp: { name: 'FCP', value: 1500, rating: 'good' },
      ttfb: { name: 'TTFB', value: 600, rating: 'good' },
    };

    const output = generateVitalsReport(report);

    expect(output).toContain('Core Web Vitals Report');
    expect(output).toContain('Overall Score');
    expect(output).toContain('100/100');
    expect(output).toContain('https://example.com');
    expect(output).toContain('LCP');
    expect(output).toContain('FID');
    expect(output).toContain('CLS');
    expect(output).toContain('FCP');
    expect(output).toContain('TTFB');
  });

  it('should include recommendations section when there are issues', () => {
    const report: WebVitalsReport = {
      url: 'https://example.com',
      timestamp: Date.now(),
      lcp: { name: 'LCP', value: 5000, rating: 'poor' },
    };

    const output = generateVitalsReport(report);
    expect(output).toContain('Recommendations');
    expect(output).toContain('preload hero images');
  });

  it('should show positive message when all metrics are good', () => {
    const report: WebVitalsReport = {
      url: 'https://example.com',
      timestamp: Date.now(),
      lcp: { name: 'LCP', value: 2000, rating: 'good' },
      fid: { name: 'FID', value: 80, rating: 'good' },
      cls: { name: 'CLS', value: 0.05, rating: 'good' },
    };

    const output = generateVitalsReport(report);
    expect(output).toContain('All metrics are performing well');
  });
});

describe('LCPOptimizations', () => {
  describe('generateImagePreload()', () => {
    it('should generate preload link with default type', () => {
      const result = LCPOptimizations.generateImagePreload('/hero.jpg');
      expect(result).toBe('<link rel="preload" as="image" href="/hero.jpg" type="image/jpeg" fetchpriority="high">');
    });

    it('should generate preload link with custom type', () => {
      const result = LCPOptimizations.generateImagePreload('/hero.png', 'image/png');
      expect(result).toBe('<link rel="preload" as="image" href="/hero.png" type="image/png" fetchpriority="high">');
    });

    it('should generate preload link for WebP', () => {
      const result = LCPOptimizations.generateImagePreload('/hero.webp', 'image/webp');
      expect(result).toBe('<link rel="preload" as="image" href="/hero.webp" type="image/webp" fetchpriority="high">');
    });
  });

  describe('generatePreconnect()', () => {
    it('should generate preconnect link', () => {
      const result = LCPOptimizations.generatePreconnect('https://cdn.example.com');
      expect(result).toBe('<link rel="preconnect" href="https://cdn.example.com" crossorigin>');
    });

    it('should handle different domains', () => {
      const result = LCPOptimizations.generatePreconnect('https://fonts.googleapis.com');
      expect(result).toBe('<link rel="preconnect" href="https://fonts.googleapis.com" crossorigin>');
    });
  });

  describe('isRenderBlocking()', () => {
    it('should identify blocking scripts without async/defer', () => {
      expect(LCPOptimizations.isRenderBlocking('script', { src: 'app.js' })).toBe(true);
    });

    it('should not identify async scripts as blocking', () => {
      expect(LCPOptimizations.isRenderBlocking('script', { src: 'app.js', async: 'true' })).toBe(false);
    });

    it('should not identify defer scripts as blocking', () => {
      expect(LCPOptimizations.isRenderBlocking('script', { src: 'app.js', defer: 'true' })).toBe(false);
    });

    it('should identify stylesheets as blocking', () => {
      expect(LCPOptimizations.isRenderBlocking('link', { rel: 'stylesheet', href: 'styles.css' })).toBe(true);
    });

    it('should not identify other link types as blocking', () => {
      expect(LCPOptimizations.isRenderBlocking('link', { rel: 'preload', href: 'font.woff2' })).toBe(false);
    });

    it('should not identify other tags as blocking', () => {
      expect(LCPOptimizations.isRenderBlocking('img', { src: 'image.jpg' })).toBe(false);
    });
  });
});

describe('CLSOptimizations', () => {
  describe('calculateAspectRatio()', () => {
    it('should calculate aspect ratio for common dimensions', () => {
      expect(CLSOptimizations.calculateAspectRatio(1920, 1080)).toBe('16/9');
      expect(CLSOptimizations.calculateAspectRatio(1600, 900)).toBe('16/9');
      expect(CLSOptimizations.calculateAspectRatio(1280, 720)).toBe('16/9');
    });

    it('should calculate aspect ratio for 4:3 images', () => {
      expect(CLSOptimizations.calculateAspectRatio(1024, 768)).toBe('4/3');
      expect(CLSOptimizations.calculateAspectRatio(800, 600)).toBe('4/3');
    });

    it('should calculate aspect ratio for square images', () => {
      expect(CLSOptimizations.calculateAspectRatio(500, 500)).toBe('1/1');
      expect(CLSOptimizations.calculateAspectRatio(1000, 1000)).toBe('1/1');
    });

    it('should calculate aspect ratio for portrait images', () => {
      expect(CLSOptimizations.calculateAspectRatio(1080, 1920)).toBe('9/16');
    });

    it('should handle arbitrary dimensions', () => {
      expect(CLSOptimizations.calculateAspectRatio(1366, 768)).toBe('683/384');
    });
  });

  describe('generateAspectRatioCSS()', () => {
    it('should generate CSS aspect-ratio property', () => {
      expect(CLSOptimizations.generateAspectRatioCSS('16/9')).toBe('aspect-ratio: 16/9;');
      expect(CLSOptimizations.generateAspectRatioCSS('4/3')).toBe('aspect-ratio: 4/3;');
      expect(CLSOptimizations.generateAspectRatioCSS('1/1')).toBe('aspect-ratio: 1/1;');
    });
  });

  describe('hasDimensions()', () => {
    it('should return true when both width and height are present', () => {
      expect(CLSOptimizations.hasDimensions({ width: 1920, height: 1080 })).toBe(true);
      expect(CLSOptimizations.hasDimensions({ width: 100, height: 100 })).toBe(true);
    });

    it('should return false when width is missing', () => {
      expect(CLSOptimizations.hasDimensions({ height: 1080 })).toBe(false);
    });

    it('should return false when height is missing', () => {
      expect(CLSOptimizations.hasDimensions({ width: 1920 })).toBe(false);
    });

    it('should return false when both are missing', () => {
      expect(CLSOptimizations.hasDimensions({})).toBe(false);
    });

    it('should return false when dimensions are 0', () => {
      expect(CLSOptimizations.hasDimensions({ width: 0, height: 1080 })).toBe(false);
      expect(CLSOptimizations.hasDimensions({ width: 1920, height: 0 })).toBe(false);
    });
  });
});

describe('FIDOptimizations', () => {
  describe('isLongTask()', () => {
    it('should identify tasks longer than 50ms as long tasks', () => {
      expect(FIDOptimizations.isLongTask(51)).toBe(true);
      expect(FIDOptimizations.isLongTask(100)).toBe(true);
      expect(FIDOptimizations.isLongTask(500)).toBe(true);
    });

    it('should not identify tasks 50ms or shorter as long tasks', () => {
      expect(FIDOptimizations.isLongTask(50)).toBe(false);
      expect(FIDOptimizations.isLongTask(30)).toBe(false);
      expect(FIDOptimizations.isLongTask(10)).toBe(false);
    });
  });

  describe('shouldCodeSplit()', () => {
    it('should recommend code splitting for bundles > 200KB', () => {
      expect(FIDOptimizations.shouldCodeSplit(300 * 1024)).toBe(true);
      expect(FIDOptimizations.shouldCodeSplit(500 * 1024)).toBe(true);
      expect(FIDOptimizations.shouldCodeSplit(1024 * 1024)).toBe(true);
    });

    it('should not recommend code splitting for bundles <= 200KB', () => {
      expect(FIDOptimizations.shouldCodeSplit(200 * 1024)).toBe(false);
      expect(FIDOptimizations.shouldCodeSplit(150 * 1024)).toBe(false);
      expect(FIDOptimizations.shouldCodeSplit(50 * 1024)).toBe(false);
    });
  });

  describe('generateDeferScript()', () => {
    it('should generate script tag with defer attribute', () => {
      expect(FIDOptimizations.generateDeferScript('/js/app.js')).toBe('<script defer src="/js/app.js"></script>');
      expect(FIDOptimizations.generateDeferScript('https://cdn.example.com/lib.js')).toBe(
        '<script defer src="https://cdn.example.com/lib.js"></script>'
      );
    });
  });
});

describe('PerformanceMonitor', () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    monitor = new PerformanceMonitor();
  });

  describe('mark()', () => {
    it('should create a performance mark', () => {
      monitor.mark('start');
      expect(monitor.getMeasure('start')).toBeGreaterThanOrEqual(0);
    });

    it('should create multiple marks', () => {
      monitor.mark('start');
      monitor.mark('middle');
      monitor.mark('end');
      expect(monitor.getMeasure('start')).toBeDefined();
      expect(monitor.getMeasure('middle')).toBeDefined();
      expect(monitor.getMeasure('end')).toBeDefined();
    });
  });

  describe('measure()', () => {
    it('should measure duration between two marks', () => {
      monitor.mark('start');
      monitor.mark('end');
      const duration = monitor.measure('duration', 'start', 'end');
      expect(duration).toBeGreaterThanOrEqual(0);
    });

    it('should measure from mark to current time when end mark not provided', () => {
      monitor.mark('start');
      const duration = monitor.measure('duration', 'start');
      expect(duration).toBeGreaterThanOrEqual(0);
    });

    it('should throw error when start mark does not exist', () => {
      expect(() => monitor.measure('duration', 'nonexistent')).toThrow('Start mark "nonexistent" not found');
    });

    it('should throw error when end mark does not exist', () => {
      monitor.mark('start');
      expect(() => monitor.measure('duration', 'start', 'nonexistent')).toThrow('End mark "nonexistent" not found');
    });

    it('should store measurement for later retrieval', () => {
      monitor.mark('start');
      monitor.mark('end');
      const duration = monitor.measure('myMeasure', 'start', 'end');
      expect(monitor.getMeasure('myMeasure')).toBe(duration);
    });
  });

  describe('getMeasure()', () => {
    it('should return undefined for non-existent measure', () => {
      expect(monitor.getMeasure('nonexistent')).toBeUndefined();
    });

    it('should return stored measure value', () => {
      monitor.mark('start');
      const duration = monitor.measure('test', 'start');
      expect(monitor.getMeasure('test')).toBe(duration);
    });
  });

  describe('clear()', () => {
    it('should clear all marks and measures', () => {
      monitor.mark('start');
      monitor.mark('end');
      monitor.measure('duration', 'start', 'end');

      monitor.clear();

      expect(monitor.getMeasure('start')).toBeUndefined();
      expect(monitor.getMeasure('end')).toBeUndefined();
      expect(monitor.getMeasure('duration')).toBeUndefined();
    });

    it('should allow new marks after clearing', () => {
      monitor.mark('start');
      monitor.clear();
      monitor.mark('newStart');
      expect(monitor.getMeasure('newStart')).toBeGreaterThanOrEqual(0);
    });
  });
});
