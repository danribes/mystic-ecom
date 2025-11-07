/**
 * T146: WCAG 2.1 AA Accessibility Audit - Test Suite
 *
 * Comprehensive tests for WCAG 2.1 Level AA accessibility auditor
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { WCAGAuditor, runWCAGAudit, type WCAGAuditReport, type AccessibilityCheck } from '../../src/lib/security/wcagAuditor';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('T146: WCAG 2.1 AA Accessibility Audit', () => {
  describe('Auditor Initialization', () => {
    it('should initialize with default configuration', () => {
      const auditor = new WCAGAuditor({
        rootDir: process.cwd(),
      });

      expect(auditor).toBeDefined();
    });

    it('should initialize with custom configuration', () => {
      const auditor = new WCAGAuditor({
        rootDir: process.cwd(),
        maxFiles: 50,
        timeout: 20000,
        level: 'AA',
      });

      expect(auditor).toBeDefined();
    });
  });

  describe('Audit Execution', () => {
    it('should run complete audit', async () => {
      const auditor = new WCAGAuditor({
        rootDir: path.join(process.cwd(), 'src'),
        maxFiles: 10,
        timeout: 15000,
      });

      const report = await auditor.audit();

      expect(report).toBeDefined();
      expect(report.timestamp).toBeDefined();
      expect(report.summary).toBeDefined();
      expect(report.categories).toBeDefined();
      expect(report.checks).toBeDefined();
    });

    it('should have valid timestamp', async () => {
      const report = await runWCAGAudit({
        rootDir: process.cwd(),
        maxFiles: 5,
      });

      const timestamp = new Date(report.timestamp);
      expect(timestamp.getTime()).toBeGreaterThan(0);
    });

    it('should include all 4 WCAG principles', async () => {
      const report = await runWCAGAudit({
        rootDir: process.cwd(),
        maxFiles: 5,
      });

      expect(report.categories.perceivable).toBeDefined();
      expect(report.categories.operable).toBeDefined();
      expect(report.categories.understandable).toBeDefined();
      expect(report.categories.robust).toBeDefined();
    });

    it('should complete within timeout', async () => {
      const startTime = Date.now();

      await runWCAGAudit({
        rootDir: process.cwd(),
        maxFiles: 5,
        timeout: 10000,
      });

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(15000);
    });
  });

  describe('Accessibility Check Structure', () => {
    it('should have proper check structure', async () => {
      const report = await runWCAGAudit({
        rootDir: process.cwd(),
        maxFiles: 5,
      });

      for (const check of report.checks) {
        expect(check.id).toBeDefined();
        expect(check.id).toMatch(/^WCAG-/);
        expect(check.principle).toBeDefined();
        expect(['perceivable', 'operable', 'understandable', 'robust']).toContain(check.principle);
        expect(check.guideline).toBeDefined();
        expect(check.successCriterion).toBeDefined();
        expect(check.level).toBeDefined();
        expect(['A', 'AA', 'AAA']).toContain(check.level);
        expect(check.name).toBeDefined();
        expect(check.description).toBeDefined();
        expect(check.status).toBeDefined();
        expect(['pass', 'fail', 'warning', 'not_applicable']).toContain(check.status);
        expect(check.severity).toBeDefined();
        expect(['critical', 'serious', 'moderate', 'minor']).toContain(check.severity);
        expect(check.wcagReference).toBeDefined();
        expect(check.issues).toBeDefined();
        expect(Array.isArray(check.issues)).toBe(true);
        expect(check.automated).toBeDefined();
        expect(typeof check.automated).toBe('boolean');
      }
    });

    it('should have valid WCAG check IDs', async () => {
      const report = await runWCAGAudit({
        rootDir: process.cwd(),
        maxFiles: 5,
      });

      for (const check of report.checks) {
        expect(check.id).toMatch(/^WCAG-\d+\.\d+\.\d+/);
      }
    });
  });

  describe('Summary Statistics', () => {
    it('should calculate total checks', async () => {
      const report = await runWCAGAudit({
        rootDir: process.cwd(),
        maxFiles: 5,
      });

      expect(report.summary.totalChecks).toBeGreaterThan(0);
      expect(report.summary.totalChecks).toBe(
        report.summary.passed +
        report.summary.failed +
        report.summary.warnings +
        report.summary.notApplicable
      );
    });

    it('should calculate compliance score', async () => {
      const report = await runWCAGAudit({
        rootDir: process.cwd(),
        maxFiles: 5,
      });

      expect(report.summary.complianceScore).toBeGreaterThanOrEqual(0);
      expect(report.summary.complianceScore).toBeLessThanOrEqual(100);
    });

    it('should count severity levels', async () => {
      const report = await runWCAGAudit({
        rootDir: process.cwd(),
        maxFiles: 5,
      });

      expect(report.summary.criticalIssues).toBeGreaterThanOrEqual(0);
      expect(report.summary.seriousIssues).toBeGreaterThanOrEqual(0);
      expect(report.summary.moderateIssues).toBeGreaterThanOrEqual(0);
      expect(report.summary.minorIssues).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Category Results', () => {
    it('should have all 4 principle categories', async () => {
      const report = await runWCAGAudit({
        rootDir: process.cwd(),
        maxFiles: 5,
      });

      const categories = Object.keys(report.categories);
      expect(categories).toContain('perceivable');
      expect(categories).toContain('operable');
      expect(categories).toContain('understandable');
      expect(categories).toContain('robust');
    });

    it('should have valid category structure', async () => {
      const report = await runWCAGAudit({
        rootDir: process.cwd(),
        maxFiles: 5,
      });

      for (const category of Object.values(report.categories)) {
        expect(category.name).toBeDefined();
        expect(category.description).toBeDefined();
        expect(category.totalChecks).toBeGreaterThanOrEqual(0);
        expect(category.passed).toBeGreaterThanOrEqual(0);
        expect(category.failed).toBeGreaterThanOrEqual(0);
        expect(category.warnings).toBeGreaterThanOrEqual(0);
        expect(['pass', 'fail', 'warning']).toContain(category.status);
        expect(category.complianceScore).toBeGreaterThanOrEqual(0);
        expect(category.complianceScore).toBeLessThanOrEqual(100);
      }
    });
  });

  describe('Overall Status', () => {
    it('should determine overall status', async () => {
      const report = await runWCAGAudit({
        rootDir: process.cwd(),
        maxFiles: 5,
      });

      expect(['compliant', 'non_compliant', 'needs_review']).toContain(report.overallStatus);
    });
  });

  describe('Recommendations', () => {
    it('should provide recommendations', async () => {
      const report = await runWCAGAudit({
        rootDir: process.cwd(),
        maxFiles: 5,
      });

      expect(Array.isArray(report.recommendations)).toBe(true);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('Perceivable - Text Alternatives', () => {
    it('should check for missing alt text on images', async () => {
      const report = await runWCAGAudit({
        rootDir: process.cwd(),
        maxFiles: 20,
      });

      const textAltCheck = report.checks.find(c => c.id === 'WCAG-1.1.1');
      expect(textAltCheck).toBeDefined();
      expect(textAltCheck?.name).toBe('Text Alternatives');
      expect(textAltCheck?.level).toBe('A');
    });

    it('should check alt text quality', async () => {
      const report = await runWCAGAudit({
        rootDir: process.cwd(),
        maxFiles: 20,
      });

      const altTextCheck = report.checks.find(c => c.id === 'WCAG-1.1.1-ENHANCED');
      expect(altTextCheck).toBeDefined();
    });
  });

  describe('Perceivable - Semantic HTML', () => {
    it('should check for semantic HTML usage', async () => {
      const report = await runWCAGAudit({
        rootDir: process.cwd(),
        maxFiles: 20,
      });

      const semanticCheck = report.checks.find(c => c.id === 'WCAG-1.3.1');
      expect(semanticCheck).toBeDefined();
      expect(semanticCheck?.name).toBe('Semantic HTML');
    });

    it('should check heading structure', async () => {
      const report = await runWCAGAudit({
        rootDir: process.cwd(),
        maxFiles: 20,
      });

      const headingCheck = report.checks.find(c => c.id === 'WCAG-1.3.1-HEADINGS');
      expect(headingCheck).toBeDefined();
      expect(headingCheck?.name).toBe('Heading Structure');
    });
  });

  describe('Perceivable - Color Contrast', () => {
    it('should check color contrast', async () => {
      const report = await runWCAGAudit({
        rootDir: process.cwd(),
        maxFiles: 20,
      });

      const contrastCheck = report.checks.find(c => c.id === 'WCAG-1.4.3');
      expect(contrastCheck).toBeDefined();
      expect(contrastCheck?.name).toBe('Color Contrast');
      expect(contrastCheck?.level).toBe('AA');
    });
  });

  describe('Operable - Keyboard Navigation', () => {
    it('should check keyboard accessibility', async () => {
      const report = await runWCAGAudit({
        rootDir: process.cwd(),
        maxFiles: 20,
      });

      const keyboardCheck = report.checks.find(c => c.id === 'WCAG-2.1.1');
      expect(keyboardCheck).toBeDefined();
      expect(keyboardCheck?.name).toBe('Keyboard Navigation');
      expect(keyboardCheck?.severity).toBe('critical');
    });

    it('should check focus visibility', async () => {
      const report = await runWCAGAudit({
        rootDir: process.cwd(),
        maxFiles: 20,
      });

      const focusCheck = report.checks.find(c => c.id === 'WCAG-2.4.7');
      expect(focusCheck).toBeDefined();
      expect(focusCheck?.name).toBe('Focus Indicator');
      expect(focusCheck?.level).toBe('AA');
    });
  });

  describe('Operable - Navigation', () => {
    it('should check for skip links', async () => {
      const report = await runWCAGAudit({
        rootDir: process.cwd(),
        maxFiles: 20,
      });

      const skipCheck = report.checks.find(c => c.id === 'WCAG-2.4.1');
      expect(skipCheck).toBeDefined();
      expect(skipCheck?.name).toBe('Skip Links');
    });

    it('should check page titles', async () => {
      const report = await runWCAGAudit({
        rootDir: process.cwd(),
        maxFiles: 20,
      });

      const titleCheck = report.checks.find(c => c.id === 'WCAG-2.4.2');
      expect(titleCheck).toBeDefined();
      expect(titleCheck?.name).toBe('Page Titles');
      expect(titleCheck?.severity).toBe('serious');
    });

    it('should check link purpose', async () => {
      const report = await runWCAGAudit({
        rootDir: process.cwd(),
        maxFiles: 20,
      });

      const linkCheck = report.checks.find(c => c.id === 'WCAG-2.4.4');
      expect(linkCheck).toBeDefined();
      expect(linkCheck?.name).toBe('Link Purpose');
    });
  });

  describe('Understandable - Language', () => {
    it('should check language attribute', async () => {
      const report = await runWCAGAudit({
        rootDir: process.cwd(),
        maxFiles: 20,
      });

      const langCheck = report.checks.find(c => c.id === 'WCAG-3.1.1');
      expect(langCheck).toBeDefined();
      expect(langCheck?.name).toBe('Language Attribute');
      expect(langCheck?.level).toBe('A');
    });
  });

  describe('Understandable - Forms', () => {
    it('should check form labels', async () => {
      const report = await runWCAGAudit({
        rootDir: process.cwd(),
        maxFiles: 20,
      });

      const labelCheck = report.checks.find(c => c.id === 'WCAG-3.3.2');
      expect(labelCheck).toBeDefined();
      expect(labelCheck?.name).toBe('Form Labels');
      expect(labelCheck?.severity).toBe('critical');
    });

    it('should check error identification', async () => {
      const report = await runWCAGAudit({
        rootDir: process.cwd(),
        maxFiles: 20,
      });

      const errorCheck = report.checks.find(c => c.id === 'WCAG-3.3.1');
      expect(errorCheck).toBeDefined();
      expect(errorCheck?.name).toBe('Error Identification');
    });
  });

  describe('Robust - Compatibility', () => {
    it('should check valid HTML', async () => {
      const report = await runWCAGAudit({
        rootDir: process.cwd(),
        maxFiles: 20,
      });

      const htmlCheck = report.checks.find(c => c.id === 'WCAG-4.1.1');
      expect(htmlCheck).toBeDefined();
      expect(htmlCheck?.name).toBe('Valid HTML');
    });

    it('should check ARIA usage', async () => {
      const report = await runWCAGAudit({
        rootDir: process.cwd(),
        maxFiles: 20,
      });

      const ariaCheck = report.checks.find(c => c.id === 'WCAG-4.1.2-ARIA');
      expect(ariaCheck).toBeDefined();
      expect(ariaCheck?.name).toBe('ARIA Usage');
    });

    it('should check name, role, value', async () => {
      const report = await runWCAGAudit({
        rootDir: process.cwd(),
        maxFiles: 20,
      });

      const nrvCheck = report.checks.find(c => c.id === 'WCAG-4.1.2');
      expect(nrvCheck).toBeDefined();
      expect(nrvCheck?.name).toBe('Name, Role, Value');
      expect(nrvCheck?.severity).toBe('critical');
    });
  });

  describe('Helper Function', () => {
    it('should work with runWCAGAudit helper', async () => {
      const report = await runWCAGAudit({
        rootDir: process.cwd(),
        maxFiles: 5,
      });

      expect(report).toBeDefined();
      expect(report.checks.length).toBeGreaterThan(0);
    });
  });

  describe('Files Scanned', () => {
    it('should respect maxFiles limit', async () => {
      const report = await runWCAGAudit({
        rootDir: process.cwd(),
        maxFiles: 3,
      });

      expect(report.filesScanned).toBeLessThanOrEqual(3);
    });

    it('should scan multiple files', async () => {
      const report = await runWCAGAudit({
        rootDir: process.cwd(),
        maxFiles: 20,
      });

      expect(report.filesScanned).toBeGreaterThan(0);
    });
  });

  describe('Performance', () => {
    it('should complete audit in reasonable time', async () => {
      const startTime = Date.now();

      await runWCAGAudit({
        rootDir: process.cwd(),
        maxFiles: 10,
        timeout: 20000,
      });

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(20000);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid root directory gracefully', async () => {
      const report = await runWCAGAudit({
        rootDir: '/nonexistent/path',
        maxFiles: 5,
      });

      // Should return a valid report even with no files
      expect(report).toBeDefined();
      expect(report.filesScanned).toBe(0);
      expect(report.checks.length).toBeGreaterThan(0);
    });
  });
});
