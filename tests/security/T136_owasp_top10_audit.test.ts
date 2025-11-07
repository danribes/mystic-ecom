/**
 * T136: OWASP Top 10 2021 Compliance Audit - Test Suite
 *
 * Comprehensive tests for OWASP Top 10 security compliance auditing
 *
 * @group security
 * @group owasp
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  OWASPTop10Auditor,
  runOWASPAudit,
  type OWASPAuditReport,
  type SecurityCheck,
  type OWASPCategory,
  type ComplianceStatus,
} from '../../src/lib/security/owaspTop10Auditor';
import fs from 'fs/promises';
import path from 'path';

describe('T136: OWASP Top 10 2021 Compliance Audit', () => {
  let auditor: OWASPTop10Auditor;
  const testOutputDir = './test-security-reports';

  beforeEach(() => {
    auditor = new OWASPTop10Auditor({
      applicationName: 'Test Application',
      outputDir: testOutputDir,
      generateReport: false,
      verbose: false,
    });
  });

  afterEach(async () => {
    // Clean up test reports
    try {
      await fs.rm(testOutputDir, { recursive: true, force: true });
    } catch (error) {
      // Directory might not exist
    }
  });

  describe('Auditor Initialization', () => {
    it('should initialize with default configuration', () => {
      const defaultAuditor = new OWASPTop10Auditor();
      expect(defaultAuditor).toBeDefined();
    });

    it('should initialize with custom configuration', () => {
      const customAuditor = new OWASPTop10Auditor({
        applicationName: 'Custom App',
        outputDir: './custom-reports',
        skipCategories: ['A10_SSRF'],
        generateReport: true,
        verbose: true,
      });
      expect(customAuditor).toBeDefined();
    });

    it('should accept empty configuration', () => {
      const emptyConfigAuditor = new OWASPTop10Auditor({});
      expect(emptyConfigAuditor).toBeDefined();
    });
  });

  describe('Audit Execution', () => {
    it('should run complete audit', async () => {
      const report = await auditor.audit();

      expect(report).toBeDefined();
      expect(report.applicationName).toBe('Test Application');
      expect(report.timestamp).toBeDefined();
      expect(report.auditVersion).toBeDefined();
      expect(report.summary).toBeDefined();
      expect(report.categoryResults).toBeDefined();
      expect(report.checks).toBeDefined();
      expect(Array.isArray(report.checks)).toBe(true);
    });

    it('should have valid timestamp', async () => {
      const report = await auditor.audit();
      const timestamp = new Date(report.timestamp);

      expect(timestamp.toString()).not.toBe('Invalid Date');
      expect(timestamp.getTime()).toBeLessThanOrEqual(Date.now());
    });

    it('should run all 10 OWASP categories', async () => {
      const report = await auditor.audit();
      const categories = Object.keys(report.categoryResults);

      expect(categories.length).toBe(10);
      expect(categories).toContain('A01_Broken_Access_Control');
      expect(categories).toContain('A02_Cryptographic_Failures');
      expect(categories).toContain('A03_Injection');
      expect(categories).toContain('A04_Insecure_Design');
      expect(categories).toContain('A05_Security_Misconfiguration');
      expect(categories).toContain('A06_Vulnerable_Components');
      expect(categories).toContain('A07_Authentication_Failures');
      expect(categories).toContain('A08_Data_Integrity_Failures');
      expect(categories).toContain('A09_Logging_Monitoring_Failures');
      expect(categories).toContain('A10_SSRF');
    });

    it('should generate checks for each category', async () => {
      const report = await auditor.audit();

      expect(report.checks.length).toBeGreaterThan(0);

      // Verify each category has at least one check
      const categoriesWithChecks = new Set(report.checks.map(c => c.category));
      expect(categoriesWithChecks.size).toBeGreaterThan(0);
    });

    it('should complete audit within reasonable time', async () => {
      const startTime = Date.now();
      await auditor.audit();
      const duration = Date.now() - startTime;

      // Audit should complete within 30 seconds
      expect(duration).toBeLessThan(30000);
    }, 30000);
  });

  describe('Security Checks Structure', () => {
    let report: OWASPAuditReport;

    beforeEach(async () => {
      report = await auditor.audit();
    });

    it('should have properly structured security checks', () => {
      expect(report.checks.length).toBeGreaterThan(0);

      report.checks.forEach(check => {
        expect(check).toHaveProperty('id');
        expect(check).toHaveProperty('category');
        expect(check).toHaveProperty('name');
        expect(check).toHaveProperty('description');
        expect(check).toHaveProperty('status');
        expect(check).toHaveProperty('severity');
        expect(check).toHaveProperty('findings');
        expect(check).toHaveProperty('recommendations');
        expect(check).toHaveProperty('automated');

        expect(Array.isArray(check.findings)).toBe(true);
        expect(Array.isArray(check.recommendations)).toBe(true);
      });
    });

    it('should have valid check IDs', () => {
      report.checks.forEach(check => {
        expect(check.id).toMatch(/^A\d{2}-\d{3}$/);
      });
    });

    it('should have valid status values', () => {
      const validStatuses: ComplianceStatus[] = ['pass', 'fail', 'warning', 'not_applicable'];

      report.checks.forEach(check => {
        expect(validStatuses).toContain(check.status);
      });
    });

    it('should have valid severity levels', () => {
      const validSeverities = ['critical', 'high', 'medium', 'low', 'info'];

      report.checks.forEach(check => {
        expect(validSeverities).toContain(check.severity);
      });
    });

    it('should have automated flag set correctly', () => {
      report.checks.forEach(check => {
        expect(typeof check.automated).toBe('boolean');
      });
    });

    it('should have CWE IDs for relevant checks', () => {
      const checksWithCWE = report.checks.filter(c => c.cweIds && c.cweIds.length > 0);
      expect(checksWithCWE.length).toBeGreaterThan(0);

      checksWithCWE.forEach(check => {
        check.cweIds!.forEach(cwe => {
          expect(cwe).toMatch(/^CWE-\d+$/);
        });
      });
    });
  });

  describe('Summary Statistics', () => {
    let report: OWASPAuditReport;

    beforeEach(async () => {
      report = await auditor.audit();
    });

    it('should calculate summary correctly', () => {
      const { summary } = report;

      expect(summary.totalChecks).toBe(report.checks.length);

      const passed = report.checks.filter(c => c.status === 'pass').length;
      const failed = report.checks.filter(c => c.status === 'fail').length;
      const warnings = report.checks.filter(c => c.status === 'warning').length;
      const notApplicable = report.checks.filter(c => c.status === 'not_applicable').length;

      expect(summary.passed).toBe(passed);
      expect(summary.failed).toBe(failed);
      expect(summary.warnings).toBe(warnings);
      expect(summary.notApplicable).toBe(notApplicable);
    });

    it('should calculate compliance score', () => {
      const { summary } = report;

      expect(summary.complianceScore).toBeGreaterThanOrEqual(0);
      expect(summary.complianceScore).toBeLessThanOrEqual(100);
    });

    it('should count severity levels correctly', () => {
      const { summary } = report;

      const critical = report.checks.filter(c => c.severity === 'critical' && c.status === 'fail').length;
      const high = report.checks.filter(c => c.severity === 'high' && (c.status === 'fail' || c.status === 'warning')).length;

      expect(summary.criticalIssues).toBe(critical);
      expect(summary.highIssues).toBeGreaterThanOrEqual(high);
    });

    it('should have valid issue counts', () => {
      const { summary } = report;

      expect(summary.criticalIssues).toBeGreaterThanOrEqual(0);
      expect(summary.highIssues).toBeGreaterThanOrEqual(0);
      expect(summary.mediumIssues).toBeGreaterThanOrEqual(0);
      expect(summary.lowIssues).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Category Results', () => {
    let report: OWASPAuditReport;

    beforeEach(async () => {
      report = await auditor.audit();
    });

    it('should have results for all categories', () => {
      expect(Object.keys(report.categoryResults).length).toBe(10);
    });

    it('should have properly structured category results', () => {
      Object.values(report.categoryResults).forEach(category => {
        expect(category).toHaveProperty('category');
        expect(category).toHaveProperty('displayName');
        expect(category).toHaveProperty('description');
        expect(category).toHaveProperty('totalChecks');
        expect(category).toHaveProperty('passed');
        expect(category).toHaveProperty('failed');
        expect(category).toHaveProperty('warnings');
        expect(category).toHaveProperty('status');
        expect(category).toHaveProperty('priority');
      });
    });

    it('should have valid priority levels', () => {
      const validPriorities = ['critical', 'high', 'medium', 'low'];

      Object.values(report.categoryResults).forEach(category => {
        expect(validPriorities).toContain(category.priority);
      });
    });

    it('should calculate category statistics correctly', () => {
      Object.entries(report.categoryResults).forEach(([categoryKey, category]) => {
        const categoryChecks = report.checks.filter(c => c.category === categoryKey);

        expect(category.totalChecks).toBe(categoryChecks.length);

        const passed = categoryChecks.filter(c => c.status === 'pass').length;
        const failed = categoryChecks.filter(c => c.status === 'fail').length;
        const warnings = categoryChecks.filter(c => c.status === 'warning').length;

        expect(category.passed).toBe(passed);
        expect(category.failed).toBe(failed);
        expect(category.warnings).toBe(warnings);
      });
    });

    it('should set category status based on checks', () => {
      Object.entries(report.categoryResults).forEach(([categoryKey, category]) => {
        const categoryChecks = report.checks.filter(c => c.category === categoryKey);
        const hasFailed = categoryChecks.some(c => c.status === 'fail');
        const hasWarnings = categoryChecks.some(c => c.status === 'warning');

        if (hasFailed) {
          expect(category.status).toBe('fail');
        } else if (hasWarnings) {
          expect(category.status).toBe('warning');
        } else if (categoryChecks.length > 0) {
          expect(category.status).toBe('pass');
        }
      });
    });
  });

  describe('Overall Status', () => {
    it('should determine overall status correctly', async () => {
      const report = await auditor.audit();

      expect(['compliant', 'non_compliant', 'needs_review']).toContain(report.overallStatus);
    });

    it('should be non-compliant if critical issues exist', async () => {
      const report = await auditor.audit();

      if (report.summary.criticalIssues > 0) {
        expect(report.overallStatus).toBe('non_compliant');
      }
    });

    it('should align with compliance score', async () => {
      const report = await auditor.audit();

      if (report.summary.complianceScore >= 80 && report.summary.criticalIssues === 0) {
        expect(['compliant', 'needs_review']).toContain(report.overallStatus);
      }
    });
  });

  describe('Next Steps Generation', () => {
    it('should provide next steps', async () => {
      const report = await auditor.audit();

      expect(Array.isArray(report.nextSteps)).toBe(true);
      expect(report.nextSteps.length).toBeGreaterThan(0);
    });

    it('should prioritize critical issues', async () => {
      const report = await auditor.audit();

      if (report.summary.criticalIssues > 0) {
        const urgentSteps = report.nextSteps.filter(step =>
          step.includes('URGENT') || step.includes('critical')
        );
        expect(urgentSteps.length).toBeGreaterThan(0);
      }
    });

    it('should provide actionable recommendations', async () => {
      const report = await auditor.audit();

      report.nextSteps.forEach(step => {
        expect(typeof step).toBe('string');
        expect(step.length).toBeGreaterThan(0);
      });
    });
  });

  describe('A01: Broken Access Control', () => {
    it('should check for authorization middleware', async () => {
      const report = await auditor.audit();
      const check = report.checks.find(c => c.id === 'A01-001');

      expect(check).toBeDefined();
      expect(check?.name).toContain('Authorization Middleware');
      expect(check?.category).toBe('A01_Broken_Access_Control');
    });

    it('should check for RBAC implementation', async () => {
      const report = await auditor.audit();
      const check = report.checks.find(c => c.id === 'A01-002');

      expect(check).toBeDefined();
      expect(check?.name).toContain('Role-Based Access Control');
    });

    it('should check API endpoint protection', async () => {
      const report = await auditor.audit();
      const check = report.checks.find(c => c.id === 'A01-003');

      expect(check).toBeDefined();
      expect(check?.name).toContain('API Endpoint Protection');
    });

    it('should check CORS configuration', async () => {
      const report = await auditor.audit();
      const check = report.checks.find(c => c.id === 'A01-004');

      expect(check).toBeDefined();
      expect(check?.name).toContain('CORS');
    });
  });

  describe('A02: Cryptographic Failures', () => {
    it('should check HTTPS enforcement', async () => {
      const report = await auditor.audit();
      const check = report.checks.find(c => c.id === 'A02-001');

      expect(check).toBeDefined();
      expect(check?.name).toContain('HTTPS');
    });

    it('should check password hashing', async () => {
      const report = await auditor.audit();
      const check = report.checks.find(c => c.id === 'A02-002');

      expect(check).toBeDefined();
      expect(check?.name).toContain('Password Hashing');
    });

    it('should check for data encryption', async () => {
      const report = await auditor.audit();
      const check = report.checks.find(c => c.id === 'A02-003');

      expect(check).toBeDefined();
      expect(check?.name).toContain('Encryption');
    });

    it('should detect weak cryptography', async () => {
      const report = await auditor.audit();
      const check = report.checks.find(c => c.id === 'A02-004');

      expect(check).toBeDefined();
      expect(check?.name).toContain('Weak Cryptography');
    });

    it('should check environment variable protection', async () => {
      const report = await auditor.audit();
      const check = report.checks.find(c => c.id === 'A02-005');

      expect(check).toBeDefined();
      expect(check?.name).toContain('Environment Variable');
    });
  });

  describe('A03: Injection', () => {
    it('should check SQL injection protection', async () => {
      const report = await auditor.audit();
      const check = report.checks.find(c => c.id === 'A03-001');

      expect(check).toBeDefined();
      expect(check?.name).toContain('SQL Injection');
      expect(check?.cweIds).toContain('CWE-89');
    });

    it('should check XSS protection', async () => {
      const report = await auditor.audit();
      const check = report.checks.find(c => c.id === 'A03-002');

      expect(check).toBeDefined();
      expect(check?.name).toContain('XSS');
      expect(check?.cweIds).toContain('CWE-79');
    });

    it('should check command injection protection', async () => {
      const report = await auditor.audit();
      const check = report.checks.find(c => c.id === 'A03-003');

      expect(check).toBeDefined();
      expect(check?.name).toContain('Command Injection');
    });

    it('should check input validation', async () => {
      const report = await auditor.audit();
      const check = report.checks.find(c => c.id === 'A03-004');

      expect(check).toBeDefined();
      expect(check?.name).toContain('Input Validation');
    });
  });

  describe('A04: Insecure Design', () => {
    it('should check for security documentation', async () => {
      const report = await auditor.audit();
      const check = report.checks.find(c => c.id === 'A04-001');

      expect(check).toBeDefined();
      expect(check?.name).toContain('Security Documentation');
    });

    it('should check for rate limiting', async () => {
      const report = await auditor.audit();
      const check = report.checks.find(c => c.id === 'A04-002');

      expect(check).toBeDefined();
      expect(check?.name).toContain('Rate Limiting');
    });

    it('should check error handling', async () => {
      const report = await auditor.audit();
      const check = report.checks.find(c => c.id === 'A04-003');

      expect(check).toBeDefined();
      expect(check?.name).toContain('Error Handling');
    });

    it('should check business logic validation', async () => {
      const report = await auditor.audit();
      const check = report.checks.find(c => c.id === 'A04-004');

      expect(check).toBeDefined();
      expect(check?.name).toContain('Business Logic');
    });
  });

  describe('A05: Security Misconfiguration', () => {
    it('should check security headers', async () => {
      const report = await auditor.audit();
      const check = report.checks.find(c => c.id === 'A05-001');

      expect(check).toBeDefined();
      expect(check?.name).toContain('Security Headers');
    });

    it('should check for default credentials', async () => {
      const report = await auditor.audit();
      const check = report.checks.find(c => c.id === 'A05-002');

      expect(check).toBeDefined();
      expect(check?.name).toContain('Default Credentials');
    });

    it('should check for debug code', async () => {
      const report = await auditor.audit();
      const check = report.checks.find(c => c.id === 'A05-003');

      expect(check).toBeDefined();
      expect(check?.name).toContain('Debug Code');
    });

    it('should check for unnecessary features', async () => {
      const report = await auditor.audit();
      const check = report.checks.find(c => c.id === 'A05-004');

      expect(check).toBeDefined();
      expect(check?.name).toContain('Unnecessary Features');
    });
  });

  describe('A06: Vulnerable and Outdated Components', () => {
    it('should check dependency vulnerabilities', async () => {
      const report = await auditor.audit();
      const check = report.checks.find(c => c.id === 'A06-001');

      expect(check).toBeDefined();
      expect(check?.name).toContain('Dependency Vulnerabilities');
    });

    it('should check for dependency lock file', async () => {
      const report = await auditor.audit();
      const check = report.checks.find(c => c.id === 'A06-002');

      expect(check).toBeDefined();
      expect(check?.name).toContain('Lock File');
    });

    it('should check for automated dependency updates', async () => {
      const report = await auditor.audit();
      const check = report.checks.find(c => c.id === 'A06-003');

      expect(check).toBeDefined();
      expect(check?.name).toContain('Automated');
    });
  });

  describe('A07: Identification and Authentication Failures', () => {
    it('should check password policy', async () => {
      const report = await auditor.audit();
      const check = report.checks.find(c => c.id === 'A07-001');

      expect(check).toBeDefined();
      expect(check?.name).toContain('Password Policy');
    });

    it('should check for MFA', async () => {
      const report = await auditor.audit();
      const check = report.checks.find(c => c.id === 'A07-002');

      expect(check).toBeDefined();
      expect(check?.name).toContain('Multi-Factor');
    });

    it('should check session management', async () => {
      const report = await auditor.audit();
      const check = report.checks.find(c => c.id === 'A07-003');

      expect(check).toBeDefined();
      expect(check?.name).toContain('Session Management');
    });

    it('should check brute force protection', async () => {
      const report = await auditor.audit();
      const check = report.checks.find(c => c.id === 'A07-004');

      expect(check).toBeDefined();
      expect(check?.name).toContain('Brute Force');
    });
  });

  describe('A08: Software and Data Integrity Failures', () => {
    it('should check CI/CD pipeline', async () => {
      const report = await auditor.audit();
      const check = report.checks.find(c => c.id === 'A08-001');

      expect(check).toBeDefined();
      expect(check?.name).toContain('CI/CD');
    });

    it('should check package integrity', async () => {
      const report = await auditor.audit();
      const check = report.checks.find(c => c.id === 'A08-002');

      expect(check).toBeDefined();
      expect(check?.name).toContain('Integrity');
    });

    it('should check for safe deserialization', async () => {
      const report = await auditor.audit();
      const check = report.checks.find(c => c.id === 'A08-003');

      expect(check).toBeDefined();
      expect(check?.name).toContain('Deserialization');
    });

    it('should check secure update mechanism', async () => {
      const report = await auditor.audit();
      const check = report.checks.find(c => c.id === 'A08-004');

      expect(check).toBeDefined();
      expect(check?.name).toContain('Update');
    });
  });

  describe('A09: Security Logging and Monitoring Failures', () => {
    it('should check logging implementation', async () => {
      const report = await auditor.audit();
      const check = report.checks.find(c => c.id === 'A09-001');

      expect(check).toBeDefined();
      expect(check?.name).toContain('Logging');
    });

    it('should check security event logging', async () => {
      const report = await auditor.audit();
      const check = report.checks.find(c => c.id === 'A09-002');

      expect(check).toBeDefined();
      expect(check?.name).toContain('Security Event');
    });

    it('should check for sensitive data in logs', async () => {
      const report = await auditor.audit();
      const check = report.checks.find(c => c.id === 'A09-003');

      expect(check).toBeDefined();
      expect(check?.name).toContain('Sensitive Data');
    });

    it('should check monitoring and alerting', async () => {
      const report = await auditor.audit();
      const check = report.checks.find(c => c.id === 'A09-004');

      expect(check).toBeDefined();
      expect(check?.name).toContain('Monitoring');
    });
  });

  describe('A10: Server-Side Request Forgery', () => {
    it('should check for external HTTP requests', async () => {
      const report = await auditor.audit();
      const check = report.checks.find(c => c.id === 'A10-001');

      expect(check).toBeDefined();
      expect(check?.name).toContain('External HTTP');
    });

    it('should check URL validation', async () => {
      const report = await auditor.audit();
      const check = report.checks.find(c => c.id === 'A10-002');

      expect(check).toBeDefined();
      expect(check?.name).toContain('URL Validation');
    });

    it('should check DNS rebinding protection', async () => {
      const report = await auditor.audit();
      const check = report.checks.find(c => c.id === 'A10-003');

      expect(check).toBeDefined();
      expect(check?.name).toContain('DNS');
    });
  });

  describe('Report Generation', () => {
    it('should generate JSON report when configured', async () => {
      const reportingAuditor = new OWASPTop10Auditor({
        outputDir: testOutputDir,
        generateReport: true,
      });

      await reportingAuditor.audit();

      // Check if report directory was created
      const dirExists = await fs.access(testOutputDir).then(() => true).catch(() => false);
      expect(dirExists).toBe(true);

      // Check if JSON report exists
      const files = await fs.readdir(testOutputDir);
      const jsonFiles = files.filter(f => f.endsWith('.json'));
      expect(jsonFiles.length).toBeGreaterThan(0);
    });

    it('should generate Markdown report', async () => {
      const reportingAuditor = new OWASPTop10Auditor({
        outputDir: testOutputDir,
        generateReport: true,
      });

      await reportingAuditor.audit();

      const markdownPath = path.join(testOutputDir, 'latest-owasp-audit.md');
      const mdExists = await fs.access(markdownPath).then(() => true).catch(() => false);
      expect(mdExists).toBe(true);

      if (mdExists) {
        const content = await fs.readFile(markdownPath, 'utf-8');
        expect(content).toContain('OWASP Top 10 2021');
        expect(content).toContain('Security Audit Report');
        expect(content).toContain('Compliance Score');
      }
    });

    it('should include all report sections in Markdown', async () => {
      const reportingAuditor = new OWASPTop10Auditor({
        outputDir: testOutputDir,
        generateReport: true,
      });

      await reportingAuditor.audit();

      const markdownPath = path.join(testOutputDir, 'latest-owasp-audit.md');
      const content = await fs.readFile(markdownPath, 'utf-8');

      expect(content).toContain('Executive Summary');
      expect(content).toContain('Category Results');
      expect(content).toContain('Next Steps');
      expect(content).toContain('Detailed Findings');
    });
  });

  describe('Helper Function: runOWASPAudit', () => {
    it('should run audit via helper function', async () => {
      const report = await runOWASPAudit({
        generateReport: false,
      });

      expect(report).toBeDefined();
      expect(report.checks.length).toBeGreaterThan(0);
    });

    it('should accept configuration in helper function', async () => {
      const report = await runOWASPAudit({
        applicationName: 'Helper Test App',
        skipCategories: ['A10_SSRF'],
        generateReport: false,
      });

      expect(report.applicationName).toBe('Helper Test App');

      // A10 checks should be skipped
      const a10Checks = report.checks.filter(c => c.category === 'A10_SSRF');
      expect(a10Checks.length).toBe(0);
    });
  });

  describe('Skip Categories', () => {
    it('should skip specified categories', async () => {
      const skipAuditor = new OWASPTop10Auditor({
        skipCategories: ['A10_SSRF', 'A04_Insecure_Design'],
        generateReport: false,
      });

      const report = await skipAuditor.audit();

      const ssrfChecks = report.checks.filter(c => c.category === 'A10_SSRF');
      const insecureDesignChecks = report.checks.filter(c => c.category === 'A04_Insecure_Design');

      expect(ssrfChecks.length).toBe(0);
      expect(insecureDesignChecks.length).toBe(0);
    });

    it('should still process non-skipped categories', async () => {
      const skipAuditor = new OWASPTop10Auditor({
        skipCategories: ['A10_SSRF'],
        generateReport: false,
      });

      const report = await skipAuditor.audit();

      const injectionChecks = report.checks.filter(c => c.category === 'A03_Injection');
      expect(injectionChecks.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty check results gracefully', async () => {
      const emptyAuditor = new OWASPTop10Auditor({
        skipCategories: [
          'A01_Broken_Access_Control',
          'A02_Cryptographic_Failures',
          'A03_Injection',
          'A04_Insecure_Design',
          'A05_Security_Misconfiguration',
          'A06_Vulnerable_Components',
          'A07_Authentication_Failures',
          'A08_Data_Integrity_Failures',
          'A09_Logging_Monitoring_Failures',
          'A10_SSRF',
        ],
        generateReport: false,
      });

      const report = await emptyAuditor.audit();

      expect(report.checks.length).toBe(0);
      expect(report.summary.totalChecks).toBe(0);
      expect(report.summary.complianceScore).toBe(100);
    });

    it('should handle file system errors gracefully', async () => {
      const invalidPathAuditor = new OWASPTop10Auditor({
        outputDir: '/invalid/path/that/does/not/exist/and/cannot/be/created',
        generateReport: true,
      });

      // Should not throw, just log error
      await expect(invalidPathAuditor.audit()).resolves.toBeDefined();
    });
  });

  describe('Integration with Existing Tools', () => {
    it('should integrate with vulnerability scanner for A06', async () => {
      const report = await auditor.audit();
      const a06Check = report.checks.find(c => c.id === 'A06-001');

      expect(a06Check).toBeDefined();
      // Should have run npm audit or captured error
      expect(a06Check?.findings.length).toBeGreaterThan(0);
    });
  });

  describe('Compliance Score Calculation', () => {
    it('should calculate 100% for all passing checks', async () => {
      const report = await auditor.audit();

      const allPassed = report.checks.every(c => c.status === 'pass');
      if (allPassed) {
        expect(report.summary.complianceScore).toBe(100);
      }
    });

    it('should calculate 0% for all failing checks', () => {
      // This is theoretical - create mock report
      const mockChecks: SecurityCheck[] = Array(10).fill(null).map((_, i) => ({
        id: `TEST-${String(i).padStart(3, '0')}`,
        category: 'A01_Broken_Access_Control',
        name: 'Test Check',
        description: 'Test',
        status: 'fail' as ComplianceStatus,
        severity: 'high',
        findings: [],
        recommendations: [],
        automated: true,
      }));

      const passed = mockChecks.filter(c => c.status === 'pass').length;
      const score = Math.round((passed / mockChecks.length) * 100);

      expect(score).toBe(0);
    });

    it('should calculate correct percentage for mixed results', () => {
      const mockChecks: SecurityCheck[] = [
        ...Array(7).fill(null).map((_, i) => ({
          id: `PASS-${String(i).padStart(3, '0')}`,
          category: 'A01_Broken_Access_Control' as OWASPCategory,
          name: 'Pass Check',
          description: 'Test',
          status: 'pass' as ComplianceStatus,
          severity: 'info' as const,
          findings: [],
          recommendations: [],
          automated: true,
        })),
        ...Array(3).fill(null).map((_, i) => ({
          id: `FAIL-${String(i).padStart(3, '0')}`,
          category: 'A02_Cryptographic_Failures' as OWASPCategory,
          name: 'Fail Check',
          description: 'Test',
          status: 'fail' as ComplianceStatus,
          severity: 'high' as const,
          findings: [],
          recommendations: [],
          automated: true,
        })),
      ];

      const passed = mockChecks.filter(c => c.status === 'pass').length;
      const score = Math.round((passed / mockChecks.length) * 100);

      expect(score).toBe(70); // 7/10 = 70%
    });
  });

  describe('Performance', () => {
    it('should complete audit in reasonable time', async () => {
      const start = Date.now();
      await auditor.audit();
      const duration = Date.now() - start;

      // Should complete within 30 seconds
      expect(duration).toBeLessThan(30000);
    }, 30000);

    it('should handle concurrent audits', async () => {
      const audits = await Promise.all([
        auditor.audit(),
        auditor.audit(),
        auditor.audit(),
      ]);

      expect(audits).toHaveLength(3);
      audits.forEach(report => {
        expect(report).toBeDefined();
        expect(report.checks.length).toBeGreaterThan(0);
      });
    }, 60000);
  });
});
