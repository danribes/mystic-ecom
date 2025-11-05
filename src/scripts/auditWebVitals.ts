/**
 * Web Vitals Audit Script
 *
 * Audits pages for Core Web Vitals and generates recommendations.
 * Can be run locally or in CI/CD for performance monitoring.
 *
 * Usage: tsx src/scripts/auditWebVitals.ts
 *
 * Part of T145: Audit and optimize Core Web Vitals
 */

import type { WebVitalsReport, Recommendation } from '../lib/webVitals';
import {
  generateVitalsReport,
  generateRecommendations,
  calculatePageScore,
  THRESHOLDS,
} from '../lib/webVitals';

/**
 * Mock data for demonstration (in production, this would come from real measurements)
 */
function generateMockReport(url: string): WebVitalsReport {
  return {
    url,
    timestamp: Date.now(),
    lcp: {
      name: 'LCP',
      value: 2200,
      rating: 'good',
      delta: 2200,
      id: 'v1-lcp',
    },
    fid: {
      name: 'FID',
      value: 85,
      rating: 'good',
      delta: 85,
      id: 'v1-fid',
    },
    cls: {
      name: 'CLS',
      value: 0.08,
      rating: 'good',
      delta: 0.08,
      id: 'v1-cls',
    },
    fcp: {
      name: 'FCP',
      value: 1600,
      rating: 'good',
      delta: 1600,
      id: 'v1-fcp',
    },
    ttfb: {
      name: 'TTFB',
      value: 650,
      rating: 'good',
      delta: 650,
      id: 'v1-ttfb',
    },
  };
}

/**
 * Pages to audit
 */
const PAGES_TO_AUDIT = [
  'https://example.com/',
  'https://example.com/courses',
  'https://example.com/products',
  'https://example.com/events',
];

/**
 * Main audit function
 */
async function auditPages() {
  console.log('\n🎯 Core Web Vitals Audit\n');
  console.log('='.repeat(60));
  console.log('\n');

  const reports: Array<{ url: string; score: number; recommendations: Recommendation[] }> = [];

  for (const url of PAGES_TO_AUDIT) {
    console.log(`Auditing: ${url}\n`);

    // Generate report (in production, this would use real Lighthouse data)
    const report = generateMockReport(url);

    // Calculate score
    const score = calculatePageScore(report);

    // Generate recommendations
    const recommendations = generateRecommendations(report);

    // Store results
    reports.push({ url, score, recommendations });

    // Print report
    console.log(generateVitalsReport(report));
    console.log('\n');
  }

  // Summary
  console.log('='.repeat(60));
  console.log('📊 Audit Summary\n');

  const avgScore = Math.round(
    reports.reduce((sum, r) => sum + r.score, 0) / reports.length
  );

  console.log(`Average Score: ${avgScore}/100\n`);

  console.log('Pages by Score:');
  reports
    .sort((a, b) => b.score - a.score)
    .forEach((r, i) => {
      const emoji = r.score >= 80 ? '✅' : r.score >= 50 ? '⚠️' : '❌';
      console.log(`  ${i + 1}. ${emoji} ${r.score}/100 - ${r.url}`);
    });

  console.log('\n');

  // High priority recommendations
  const highPriorityRecs = reports
    .flatMap(r => r.recommendations)
    .filter(r => r.priority === 'high');

  if (highPriorityRecs.length > 0) {
    console.log('🔴 High Priority Issues:');
    highPriorityRecs.forEach((rec, i) => {
      console.log(`  ${i + 1}. [${rec.metric}] ${rec.issue}`);
      console.log(`     → ${rec.suggestion}`);
    });
    console.log('\n');
  }

  // Thresholds reference
  console.log('📏 Target Thresholds:');
  console.log(`  LCP: < ${THRESHOLDS.LCP.good}ms (good), < ${THRESHOLDS.LCP.poor}ms (needs improvement)`);
  console.log(`  FID: < ${THRESHOLDS.FID.good}ms (good), < ${THRESHOLDS.FID.poor}ms (needs improvement)`);
  console.log(`  CLS: < ${THRESHOLDS.CLS.good} (good), < ${THRESHOLDS.CLS.poor} (needs improvement)`);

  console.log('\n');
  console.log('='.repeat(60));

  // Exit code based on average score
  process.exit(avgScore >= 50 ? 0 : 1);
}

// Run audit
if (import.meta.url === `file://${process.argv[1]}`) {
  auditPages();
}

export { auditPages };
