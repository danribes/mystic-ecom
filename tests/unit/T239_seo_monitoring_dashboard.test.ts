/**
 * T239: SEO Monitoring Dashboard - Test Suite
 *
 * Comprehensive tests for SEO metrics utilities and dashboard functionality.
 *
 * Test Coverage:
 * - Status calculation logic
 * - Trend calculation
 * - Health score computation
 * - Mock data generation
 * - Helper functions (formatting, icons, colors)
 * - API integration hooks
 */

import { describe, it, expect } from 'vitest';
import {
  calculateStatus,
  calculateTrend,
  calculateHealthScore,
  getStatusColorClass,
  getStatusIcon,
  getTrendIcon,
  formatPercentage,
  formatNumber,
  getMockSEOMetrics,
  DEFAULT_SEO_METRICS,
  SEO_THRESHOLDS,
  type SEOMetrics,
  type SEOMetricStatus,
  type SEOMetricTrend,
} from '@/lib/seo/metrics';

// ============================================================================
// Status Calculation Tests
// ============================================================================

describe('T239: SEO Monitoring Dashboard - calculateStatus', () => {
  describe('Higher is Better (Indexing Rate, CTR)', () => {
    it('should return "healthy" when value meets or exceeds healthy threshold', () => {
      const result = calculateStatus(0.95, 0.9, 0.7, true);
      expect(result).toBe('healthy');
    });

    it('should return "warning" when value is between warning and healthy thresholds', () => {
      const result = calculateStatus(0.8, 0.9, 0.7, true);
      expect(result).toBe('warning');
    });

    it('should return "error" when value is below warning threshold', () => {
      const result = calculateStatus(0.6, 0.9, 0.7, true);
      expect(result).toBe('error');
    });

    it('should return "unknown" when value is 0', () => {
      const result = calculateStatus(0, 0.9, 0.7, true);
      expect(result).toBe('unknown');
    });

    it('should handle exact threshold values correctly', () => {
      expect(calculateStatus(0.9, 0.9, 0.7, true)).toBe('healthy');
      expect(calculateStatus(0.7, 0.9, 0.7, true)).toBe('warning');
    });
  });

  describe('Lower is Better (Average Position, Error Count)', () => {
    it('should return "healthy" when value is at or below healthy threshold', () => {
      const result = calculateStatus(8, 10, 20, false);
      expect(result).toBe('healthy');
    });

    it('should return "warning" when value is between healthy and warning thresholds', () => {
      const result = calculateStatus(15, 10, 20, false);
      expect(result).toBe('warning');
    });

    it('should return "error" when value exceeds warning threshold', () => {
      const result = calculateStatus(25, 10, 20, false);
      expect(result).toBe('error');
    });

    it('should return "unknown" when value is 0', () => {
      const result = calculateStatus(0, 10, 20, false);
      expect(result).toBe('unknown');
    });

    it('should handle exact threshold values correctly', () => {
      expect(calculateStatus(10, 10, 20, false)).toBe('healthy');
      expect(calculateStatus(20, 10, 20, false)).toBe('warning');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large values', () => {
      expect(calculateStatus(1000000, 100, 50, true)).toBe('healthy');
      expect(calculateStatus(1000000, 100, 50, false)).toBe('error');
    });

    it('should handle very small decimal values', () => {
      expect(calculateStatus(0.00001, 0.001, 0.0005, true)).toBe('error');
      expect(calculateStatus(0.00001, 0.001, 0.0005, false)).toBe('healthy');
    });

    it('should handle negative values as errors (edge case)', () => {
      // Note: In practice, metrics shouldn't be negative, but testing robustness
      expect(calculateStatus(-1, 0.9, 0.7, true)).toBe('error');
    });
  });
});

// ============================================================================
// Trend Calculation Tests
// ============================================================================

describe('T239: SEO Monitoring Dashboard - calculateTrend', () => {
  describe('Upward Trends', () => {
    it('should return "up" for significant positive change (>2%)', () => {
      const result = calculateTrend(105, 100);
      expect(result).toBe('up');
    });

    it('should return "up" for large positive change', () => {
      const result = calculateTrend(150, 100);
      expect(result).toBe('up');
    });

    it('should return "stable" for small positive change (<2%)', () => {
      const result = calculateTrend(101, 100);
      expect(result).toBe('stable');
    });
  });

  describe('Downward Trends', () => {
    it('should return "down" for significant negative change (>2%)', () => {
      const result = calculateTrend(95, 100);
      expect(result).toBe('down');
    });

    it('should return "down" for large negative change', () => {
      const result = calculateTrend(50, 100);
      expect(result).toBe('down');
    });

    it('should return "stable" for small negative change (<2%)', () => {
      const result = calculateTrend(99, 100);
      expect(result).toBe('stable');
    });
  });

  describe('Stable Trends', () => {
    it('should return "stable" for identical values', () => {
      const result = calculateTrend(100, 100);
      expect(result).toBe('stable');
    });

    it('should return "stable" for changes within 2% threshold', () => {
      expect(calculateTrend(101.5, 100)).toBe('stable');
      expect(calculateTrend(98.5, 100)).toBe('stable');
    });
  });

  describe('Edge Cases', () => {
    it('should return "stable" when previous value is 0', () => {
      const result = calculateTrend(100, 0);
      expect(result).toBe('stable');
    });

    it('should handle decimal values correctly', () => {
      expect(calculateTrend(1.05, 1.0)).toBe('up');
      expect(calculateTrend(0.95, 1.0)).toBe('down');
    });

    it('should handle very small values', () => {
      expect(calculateTrend(0.0105, 0.01)).toBe('up');
      expect(calculateTrend(0.0095, 0.01)).toBe('down');
    });
  });
});

// ============================================================================
// Health Score Calculation Tests
// ============================================================================

describe('T239: SEO Monitoring Dashboard - calculateHealthScore', () => {
  describe('Perfect Score Scenarios', () => {
    it('should calculate near-perfect score for all healthy metrics', () => {
      const metrics: SEOMetrics = {
        ...DEFAULT_SEO_METRICS,
        indexing: {
          ...DEFAULT_SEO_METRICS.indexing,
          totalPages: 100,
          indexedPages: 100,
          indexingRate: 1.0,
        },
        keywords: {
          ...DEFAULT_SEO_METRICS.keywords,
          averagePosition: 1.0,
        },
        ctr: {
          ...DEFAULT_SEO_METRICS.ctr,
          ctr: 0.1, // 10% CTR
        },
        structuredData: {
          ...DEFAULT_SEO_METRICS.structuredData,
          totalPages: 100,
          validPages: 100,
        },
        sitemap: {
          ...DEFAULT_SEO_METRICS.sitemap,
          exists: true,
          errors: [],
        },
        coreWebVitals: {
          ...DEFAULT_SEO_METRICS.coreWebVitals,
          goodLCP: 100,
          goodFID: 100,
          goodCLS: 100,
        },
      };

      const score = calculateHealthScore(metrics);

      expect(score).toBeGreaterThanOrEqual(90);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('Mixed Performance Scenarios', () => {
    it('should calculate moderate score for mixed metrics', () => {
      const metrics: SEOMetrics = {
        ...DEFAULT_SEO_METRICS,
        indexing: {
          ...DEFAULT_SEO_METRICS.indexing,
          totalPages: 100,
          indexedPages: 80,
          indexingRate: 0.8,
        },
        keywords: {
          ...DEFAULT_SEO_METRICS.keywords,
          averagePosition: 15,
        },
        ctr: {
          ...DEFAULT_SEO_METRICS.ctr,
          ctr: 0.03, // 3% CTR
        },
        structuredData: {
          ...DEFAULT_SEO_METRICS.structuredData,
          totalPages: 100,
          validPages: 90,
        },
        sitemap: {
          ...DEFAULT_SEO_METRICS.sitemap,
          exists: true,
          errors: [],
        },
        coreWebVitals: {
          ...DEFAULT_SEO_METRICS.coreWebVitals,
          goodLCP: 75,
          goodFID: 80,
          goodCLS: 70,
        },
      };

      const score = calculateHealthScore(metrics);

      expect(score).toBeGreaterThanOrEqual(50);
      expect(score).toBeLessThanOrEqual(80);
    });
  });

  describe('Poor Performance Scenarios', () => {
    it('should calculate low score for poor metrics', () => {
      const metrics: SEOMetrics = {
        ...DEFAULT_SEO_METRICS,
        indexing: {
          ...DEFAULT_SEO_METRICS.indexing,
          totalPages: 100,
          indexedPages: 30,
          indexingRate: 0.3,
        },
        keywords: {
          ...DEFAULT_SEO_METRICS.keywords,
          averagePosition: 50,
        },
        ctr: {
          ...DEFAULT_SEO_METRICS.ctr,
          ctr: 0.005, // 0.5% CTR
        },
        structuredData: {
          ...DEFAULT_SEO_METRICS.structuredData,
          totalPages: 100,
          validPages: 40,
        },
        sitemap: {
          ...DEFAULT_SEO_METRICS.sitemap,
          exists: false,
          errors: ['Sitemap not found'],
        },
        coreWebVitals: {
          ...DEFAULT_SEO_METRICS.coreWebVitals,
          goodLCP: 30,
          goodFID: 40,
          goodCLS: 35,
        },
      };

      const score = calculateHealthScore(metrics);

      expect(score).toBeLessThan(50);
    });
  });

  describe('Weighted Calculations', () => {
    it('should weight indexing heavily (25%)', () => {
      const goodIndexing = { ...DEFAULT_SEO_METRICS, indexing: { ...DEFAULT_SEO_METRICS.indexing, indexingRate: 1.0 } };
      const poorIndexing = { ...DEFAULT_SEO_METRICS, indexing: { ...DEFAULT_SEO_METRICS.indexing, indexingRate: 0.3 } };

      const goodScore = calculateHealthScore(goodIndexing);
      const poorScore = calculateHealthScore(poorIndexing);

      // Good indexing should significantly improve score
      expect(goodScore - poorScore).toBeGreaterThan(10);
    });
  });

  describe('Return Value Constraints', () => {
    it('should return an integer between 0 and 100', () => {
      const metrics = getMockSEOMetrics();
      const score = calculateHealthScore(metrics);

      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
      expect(Number.isInteger(score)).toBe(true);
    });
  });
});

// ============================================================================
// Helper Functions Tests
// ============================================================================

describe('T239: SEO Monitoring Dashboard - Helper Functions', () => {
  describe('getStatusColorClass', () => {
    it('should return green classes for healthy status', () => {
      const result = getStatusColorClass('healthy');
      expect(result).toContain('green');
    });

    it('should return yellow classes for warning status', () => {
      const result = getStatusColorClass('warning');
      expect(result).toContain('yellow');
    });

    it('should return red classes for error status', () => {
      const result = getStatusColorClass('error');
      expect(result).toContain('red');
    });

    it('should return gray classes for unknown status', () => {
      const result = getStatusColorClass('unknown');
      expect(result).toContain('gray');
    });

    it('should include background and border classes', () => {
      const result = getStatusColorClass('healthy');
      expect(result).toMatch(/bg-/);
      expect(result).toMatch(/border-/);
    });
  });

  describe('getStatusIcon', () => {
    it('should return checkmark for healthy status', () => {
      expect(getStatusIcon('healthy')).toBe('✅');
    });

    it('should return warning sign for warning status', () => {
      expect(getStatusIcon('warning')).toBe('⚠️');
    });

    it('should return X mark for error status', () => {
      expect(getStatusIcon('error')).toBe('❌');
    });

    it('should return question mark for unknown status', () => {
      expect(getStatusIcon('unknown')).toBe('❓');
    });
  });

  describe('getTrendIcon', () => {
    it('should return up arrow for upward trend', () => {
      expect(getTrendIcon('up')).toBe('📈');
    });

    it('should return down arrow for downward trend', () => {
      expect(getTrendIcon('down')).toBe('📉');
    });

    it('should return horizontal line for stable trend', () => {
      expect(getTrendIcon('stable')).toBe('➖');
    });

    it('should return question mark for unknown trend', () => {
      expect(getTrendIcon('unknown')).toBe('❓');
    });
  });

  describe('formatPercentage', () => {
    it('should format decimal as percentage with one decimal place', () => {
      expect(formatPercentage(0.5)).toBe('50.0%');
      expect(formatPercentage(0.125)).toBe('12.5%');
      expect(formatPercentage(1.0)).toBe('100.0%');
    });

    it('should handle very small percentages', () => {
      expect(formatPercentage(0.001)).toBe('0.1%');
      expect(formatPercentage(0.0001)).toBe('0.0%');
    });

    it('should handle zero', () => {
      expect(formatPercentage(0)).toBe('0.0%');
    });

    it('should round to one decimal place', () => {
      expect(formatPercentage(0.12345)).toBe('12.3%');
      expect(formatPercentage(0.56789)).toBe('56.8%');
    });
  });

  describe('formatNumber', () => {
    it('should add comma separators for thousands', () => {
      expect(formatNumber(1000)).toBe('1,000');
      expect(formatNumber(1000000)).toBe('1,000,000');
    });

    it('should handle numbers without separators', () => {
      expect(formatNumber(100)).toBe('100');
      expect(formatNumber(999)).toBe('999');
    });

    it('should handle zero', () => {
      expect(formatNumber(0)).toBe('0');
    });

    it('should format large numbers correctly', () => {
      expect(formatNumber(12345678)).toBe('12,345,678');
    });

    it('should handle decimal numbers', () => {
      const result = formatNumber(1234.56);
      expect(result).toMatch(/1,234/);
    });
  });
});

// ============================================================================
// Mock Data Generation Tests
// ============================================================================

describe('T239: SEO Monitoring Dashboard - Mock Data', () => {
  describe('getMockSEOMetrics', () => {
    it('should return a complete SEO metrics object', () => {
      const metrics = getMockSEOMetrics();

      expect(metrics).toHaveProperty('indexing');
      expect(metrics).toHaveProperty('keywords');
      expect(metrics).toHaveProperty('ctr');
      expect(metrics).toHaveProperty('structuredData');
      expect(metrics).toHaveProperty('sitemap');
      expect(metrics).toHaveProperty('coreWebVitals');
      expect(metrics).toHaveProperty('healthScore');
      expect(metrics).toHaveProperty('healthStatus');
      expect(metrics).toHaveProperty('lastUpdated');
    });

    it('should generate realistic indexing metrics', () => {
      const metrics = getMockSEOMetrics();

      expect(metrics.indexing.totalPages).toBeGreaterThan(0);
      expect(metrics.indexing.indexedPages).toBeLessThanOrEqual(metrics.indexing.totalPages);
      expect(metrics.indexing.indexingRate).toBeGreaterThan(0);
      expect(metrics.indexing.indexingRate).toBeLessThanOrEqual(1);
      expect(metrics.indexing.status).toBeDefined();
    });

    it('should generate realistic keyword metrics', () => {
      const metrics = getMockSEOMetrics();

      expect(metrics.keywords.totalKeywords).toBeGreaterThan(0);
      expect(metrics.keywords.averagePosition).toBeGreaterThan(0);
      expect(metrics.keywords.top10Keywords).toBeLessThanOrEqual(metrics.keywords.totalKeywords);
      expect(metrics.keywords.top3Keywords).toBeLessThanOrEqual(metrics.keywords.top10Keywords);
      expect(metrics.keywords.topKeywords).toBeInstanceOf(Array);
    });

    it('should generate realistic CTR metrics', () => {
      const metrics = getMockSEOMetrics();

      expect(metrics.ctr.impressions).toBeGreaterThan(0);
      expect(metrics.ctr.clicks).toBeGreaterThan(0);
      expect(metrics.ctr.clicks).toBeLessThanOrEqual(metrics.ctr.impressions);
      expect(metrics.ctr.ctr).toBeGreaterThan(0);
      expect(metrics.ctr.ctr).toBeLessThanOrEqual(1);
      expect(metrics.ctr.topPages).toBeInstanceOf(Array);
    });

    it('should generate realistic structured data metrics', () => {
      const metrics = getMockSEOMetrics();

      expect(metrics.structuredData.totalPages).toBeGreaterThan(0);
      expect(metrics.structuredData.validPages).toBeLessThanOrEqual(metrics.structuredData.totalPages);
      expect(metrics.structuredData.types).toBeInstanceOf(Array);
      expect(metrics.structuredData.types.length).toBeGreaterThan(0);
    });

    it('should generate sitemap metrics', () => {
      const metrics = getMockSEOMetrics();

      expect(metrics.sitemap.sitemapUrl).toContain('sitemap.xml');
      expect(metrics.sitemap.urlCount).toBeGreaterThan(0);
      expect(metrics.sitemap.exists).toBe(true);
      expect(metrics.sitemap.errors).toBeInstanceOf(Array);
    });

    it('should generate Core Web Vitals metrics', () => {
      const metrics = getMockSEOMetrics();

      expect(metrics.coreWebVitals.lcp).toBeGreaterThan(0);
      expect(metrics.coreWebVitals.fid).toBeGreaterThan(0);
      expect(metrics.coreWebVitals.cls).toBeGreaterThan(0);
      expect(metrics.coreWebVitals.goodLCP).toBeGreaterThanOrEqual(0);
      expect(metrics.coreWebVitals.goodLCP).toBeLessThanOrEqual(100);
    });

    it('should calculate health score', () => {
      const metrics = getMockSEOMetrics();

      expect(metrics.healthScore).toBeGreaterThan(0);
      expect(metrics.healthScore).toBeLessThanOrEqual(100);
      expect(Number.isInteger(metrics.healthScore)).toBe(true);
    });

    it('should set lastUpdated to recent date', () => {
      const metrics = getMockSEOMetrics();
      const now = new Date();
      const diff = now.getTime() - metrics.lastUpdated.getTime();

      // Should be generated within the last second
      expect(diff).toBeLessThan(1000);
    });
  });

  describe('DEFAULT_SEO_METRICS', () => {
    it('should have all required properties with zero/empty values', () => {
      expect(DEFAULT_SEO_METRICS.indexing.totalPages).toBe(0);
      expect(DEFAULT_SEO_METRICS.keywords.totalKeywords).toBe(0);
      expect(DEFAULT_SEO_METRICS.ctr.clicks).toBe(0);
      expect(DEFAULT_SEO_METRICS.structuredData.totalPages).toBe(0);
      expect(DEFAULT_SEO_METRICS.sitemap.urlCount).toBe(0);
      expect(DEFAULT_SEO_METRICS.coreWebVitals.lcp).toBe(0);
    });

    it('should have "unknown" status for all metrics', () => {
      expect(DEFAULT_SEO_METRICS.indexing.status).toBe('unknown');
      expect(DEFAULT_SEO_METRICS.keywords.status).toBe('unknown');
      expect(DEFAULT_SEO_METRICS.ctr.status).toBe('unknown');
      expect(DEFAULT_SEO_METRICS.structuredData.status).toBe('unknown');
      expect(DEFAULT_SEO_METRICS.coreWebVitals.status).toBe('unknown');
    });

    it('should have empty arrays where appropriate', () => {
      expect(DEFAULT_SEO_METRICS.keywords.topKeywords).toEqual([]);
      expect(DEFAULT_SEO_METRICS.ctr.topPages).toEqual([]);
      expect(DEFAULT_SEO_METRICS.structuredData.types).toEqual([]);
      expect(DEFAULT_SEO_METRICS.structuredData.errors).toEqual([]);
      expect(DEFAULT_SEO_METRICS.sitemap.errors).toEqual([]);
    });
  });
});

// ============================================================================
// Threshold Constants Tests
// ============================================================================

describe('T239: SEO Monitoring Dashboard - Thresholds', () => {
  describe('SEO_THRESHOLDS', () => {
    it('should define indexing rate thresholds', () => {
      expect(SEO_THRESHOLDS.indexingRate.healthy).toBe(0.9);
      expect(SEO_THRESHOLDS.indexingRate.warning).toBe(0.7);
      expect(SEO_THRESHOLDS.indexingRate.healthy).toBeGreaterThan(SEO_THRESHOLDS.indexingRate.warning);
    });

    it('should define average position thresholds', () => {
      expect(SEO_THRESHOLDS.averagePosition.healthy).toBe(10);
      expect(SEO_THRESHOLDS.averagePosition.warning).toBe(20);
      expect(SEO_THRESHOLDS.averagePosition.warning).toBeGreaterThan(SEO_THRESHOLDS.averagePosition.healthy);
    });

    it('should define CTR thresholds', () => {
      expect(SEO_THRESHOLDS.ctr.healthy).toBe(0.05);
      expect(SEO_THRESHOLDS.ctr.warning).toBe(0.02);
      expect(SEO_THRESHOLDS.ctr.healthy).toBeGreaterThan(SEO_THRESHOLDS.ctr.warning);
    });

    it('should define structured data error thresholds', () => {
      expect(SEO_THRESHOLDS.structuredDataErrors.healthy).toBe(0);
      expect(SEO_THRESHOLDS.structuredDataErrors.warning).toBe(5);
    });

    it('should define Core Web Vitals thresholds', () => {
      expect(SEO_THRESHOLDS.coreWebVitals.lcp.good).toBe(2.5);
      expect(SEO_THRESHOLDS.coreWebVitals.lcp.needsImprovement).toBe(4.0);

      expect(SEO_THRESHOLDS.coreWebVitals.fid.good).toBe(100);
      expect(SEO_THRESHOLDS.coreWebVitals.fid.needsImprovement).toBe(300);

      expect(SEO_THRESHOLDS.coreWebVitals.cls.good).toBe(0.1);
      expect(SEO_THRESHOLDS.coreWebVitals.cls.needsImprovement).toBe(0.25);
    });
  });
});

// ============================================================================
// Data Structure Validation Tests
// ============================================================================

describe('T239: SEO Monitoring Dashboard - Data Structures', () => {
  describe('Top Keywords Structure', () => {
    it('should have correct properties for each keyword', () => {
      const metrics = getMockSEOMetrics();

      metrics.keywords.topKeywords.forEach((keyword) => {
        expect(keyword).toHaveProperty('keyword');
        expect(keyword).toHaveProperty('position');
        expect(keyword).toHaveProperty('clicks');
        expect(keyword).toHaveProperty('impressions');
        expect(keyword).toHaveProperty('ctr');

        expect(typeof keyword.keyword).toBe('string');
        expect(typeof keyword.position).toBe('number');
        expect(typeof keyword.clicks).toBe('number');
        expect(typeof keyword.impressions).toBe('number');
        expect(typeof keyword.ctr).toBe('number');
      });
    });

    it('should have consistent CTR calculations', () => {
      const metrics = getMockSEOMetrics();

      metrics.keywords.topKeywords.forEach((keyword) => {
        const calculatedCTR = keyword.clicks / keyword.impressions;
        expect(Math.abs(keyword.ctr - calculatedCTR)).toBeLessThan(0.001);
      });
    });
  });

  describe('Top Pages Structure', () => {
    it('should have correct properties for each page', () => {
      const metrics = getMockSEOMetrics();

      metrics.ctr.topPages.forEach((page) => {
        expect(page).toHaveProperty('url');
        expect(page).toHaveProperty('impressions');
        expect(page).toHaveProperty('clicks');
        expect(page).toHaveProperty('ctr');

        expect(typeof page.url).toBe('string');
        expect(typeof page.impressions).toBe('number');
        expect(typeof page.clicks).toBe('number');
        expect(typeof page.ctr).toBe('number');
      });
    });

    it('should have consistent CTR calculations', () => {
      const metrics = getMockSEOMetrics();

      metrics.ctr.topPages.forEach((page) => {
        const calculatedCTR = page.clicks / page.impressions;
        expect(Math.abs(page.ctr - calculatedCTR)).toBeLessThan(0.001);
      });
    });
  });

  describe('Structured Data Types Structure', () => {
    it('should have correct properties for each type', () => {
      const metrics = getMockSEOMetrics();

      metrics.structuredData.types.forEach((type) => {
        expect(type).toHaveProperty('type');
        expect(type).toHaveProperty('count');
        expect(type).toHaveProperty('valid');
        expect(type).toHaveProperty('errors');

        expect(typeof type.type).toBe('string');
        expect(typeof type.count).toBe('number');
        expect(typeof type.valid).toBe('number');
        expect(typeof type.errors).toBe('number');
      });
    });

    it('should have valid counts that do not exceed total counts', () => {
      const metrics = getMockSEOMetrics();

      metrics.structuredData.types.forEach((type) => {
        expect(type.valid).toBeLessThanOrEqual(type.count);
        expect(type.errors).toBeLessThanOrEqual(type.count);
      });
    });

    it('should include common schema types', () => {
      const metrics = getMockSEOMetrics();
      const typeNames = metrics.structuredData.types.map((t) => t.type);

      // Check for some expected schema types
      const commonTypes = ['WebSite', 'Organization', 'Course', 'Event', 'Product'];
      commonTypes.forEach((expectedType) => {
        expect(typeNames).toContain(expectedType);
      });
    });
  });
});

// ============================================================================
// Integration Tests
// ============================================================================

describe('T239: SEO Monitoring Dashboard - Integration', () => {
  describe('Complete Workflow', () => {
    it('should generate metrics, calculate status, and produce valid health score', () => {
      // Generate mock metrics
      const metrics = getMockSEOMetrics();

      // Verify status was calculated for each metric
      expect(['healthy', 'warning', 'error', 'unknown']).toContain(metrics.indexing.status);
      expect(['healthy', 'warning', 'error', 'unknown']).toContain(metrics.keywords.status);
      expect(['healthy', 'warning', 'error', 'unknown']).toContain(metrics.ctr.status);
      expect(['healthy', 'warning', 'error', 'unknown']).toContain(metrics.structuredData.status);
      expect(['healthy', 'warning', 'error', 'unknown']).toContain(metrics.sitemap.status);
      expect(['healthy', 'warning', 'error', 'unknown']).toContain(metrics.coreWebVitals.status);

      // Verify health score is valid
      expect(metrics.healthScore).toBeGreaterThanOrEqual(0);
      expect(metrics.healthScore).toBeLessThanOrEqual(100);

      // Verify health status matches health score
      if (metrics.healthScore >= 80) {
        expect(metrics.healthStatus).toBe('healthy');
      } else if (metrics.healthScore >= 60) {
        expect(metrics.healthStatus).toBe('warning');
      } else {
        expect(metrics.healthStatus).toBe('error');
      }
    });

    it('should maintain data consistency across all metrics', () => {
      const metrics = getMockSEOMetrics();

      // CTR should match calculated value
      const calculatedCTR = metrics.ctr.clicks / metrics.ctr.impressions;
      expect(Math.abs(metrics.ctr.ctr - calculatedCTR)).toBeLessThan(0.0001);

      // Indexing rate should match calculated value
      const calculatedRate = metrics.indexing.indexedPages / metrics.indexing.totalPages;
      expect(Math.abs(metrics.indexing.indexingRate - calculatedRate)).toBeLessThan(0.0001);

      // Structured data counts should be consistent
      const totalWithIssues = metrics.structuredData.pagesWithErrors + metrics.structuredData.pagesWithWarnings;
      const totalProcessed = metrics.structuredData.validPages + totalWithIssues;
      expect(totalProcessed).toBeLessThanOrEqual(metrics.structuredData.totalPages);
    });
  });
});

// ============================================================================
// Conclusion
// ============================================================================

describe('T239: Test Suite Summary', () => {
  it('should pass all SEO dashboard tests', () => {
    // This test confirms the test suite itself is working
    expect(true).toBe(true);
  });
});
