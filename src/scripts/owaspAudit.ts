#!/usr/bin/env tsx
/**
 * T136: OWASP Top 10 Audit CLI
 *
 * Command-line interface for running OWASP Top 10 security audits
 *
 * Usage:
 *   npm run security:owasp
 *   tsx src/scripts/owaspAudit.ts
 *   tsx src/scripts/owaspAudit.ts --save-report
 */

import { runOWASPAudit, type AuditConfig } from '../lib/security/owaspTop10Auditor.js';

// Parse command line arguments
function parseArgs(): AuditConfig & { help?: boolean } {
  const args = process.argv.slice(2);
  const config: AuditConfig & { help?: boolean } = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--help':
      case '-h':
        config.help = true;
        break;

      case '--save-report':
      case '-s':
        config.generateReport = true;
        break;

      case '--output-dir':
      case '-o':
        config.outputDir = args[++i];
        break;

      case '--app-name':
      case '-a':
        config.applicationName = args[++i];
        break;

      case '--verbose':
      case '-v':
        config.verbose = true;
        break;

      case '--skip':
        const categories = args[++i].split(',');
        config.skipCategories = categories as any[];
        break;
    }
  }

  return config;
}

// Display help message
function displayHelp(): void {
  console.log(`
OWASP Top 10 2021 Security Audit
=================================

Usage:
  npm run security:owasp [options]
  tsx src/scripts/owaspAudit.ts [options]

Options:
  -h, --help                Display this help message
  -s, --save-report         Save audit report to files
  -o, --output-dir <dir>    Output directory for reports (default: ./security-reports)
  -a, --app-name <name>     Application name for report
  -v, --verbose             Enable verbose logging
  --skip <categories>       Skip categories (comma-separated)

Examples:
  # Run basic audit
  tsx src/scripts/owaspAudit.ts

  # Save reports
  tsx src/scripts/owaspAudit.ts --save-report

  # Custom application name
  tsx src/scripts/owaspAudit.ts --app-name "My App" --save-report

  # Skip specific categories
  tsx src/scripts/owaspAudit.ts --skip A10_SSRF,A04_Insecure_Design

OWASP Top 10 2021 Categories:
  A01 - Broken Access Control
  A02 - Cryptographic Failures
  A03 - Injection
  A04 - Insecure Design
  A05 - Security Misconfiguration
  A06 - Vulnerable and Outdated Components
  A07 - Identification and Authentication Failures
  A08 - Software and Data Integrity Failures
  A09 - Security Logging and Monitoring Failures
  A10 - Server-Side Request Forgery (SSRF)
`);
}

// Display color-coded console output
function displayReport(report: any): void {
  console.log('\n' + '='.repeat(70));
  console.log('  OWASP TOP 10 2021 SECURITY AUDIT REPORT');
  console.log('='.repeat(70) + '\n');

  console.log(`Application: ${report.applicationName}`);
  console.log(`Audit Date: ${new Date(report.timestamp).toLocaleString()}`);
  console.log(`Audit Version: ${report.auditVersion}\n`);

  // Overall status
  const statusIcon = {
    compliant: '✅',
    non_compliant: '❌',
    needs_review: '⚠️',
  }[report.overallStatus];

  console.log(`Overall Status: ${statusIcon} ${report.overallStatus.toUpperCase().replace('_', ' ')}`);
  console.log(`Compliance Score: ${report.summary.complianceScore}%\n`);

  // Summary
  console.log('SUMMARY');
  console.log('-'.repeat(70));
  console.log(`Total Checks:       ${report.summary.totalChecks}`);
  console.log(`✅ Passed:          ${report.summary.passed}`);
  console.log(`❌ Failed:          ${report.summary.failed}`);
  console.log(`⚠️  Warnings:        ${report.summary.warnings}`);
  console.log(`🚨 Critical Issues: ${report.summary.criticalIssues}`);
  console.log(`⚡ High Issues:     ${report.summary.highIssues}`);
  console.log(`📋 Medium Issues:   ${report.summary.mediumIssues}\n`);

  // Category results
  console.log('CATEGORY RESULTS');
  console.log('-'.repeat(70));

  Object.values(report.categoryResults).forEach((category: any) => {
    const icon = category.status === 'pass' ? '✅' : category.status === 'fail' ? '❌' : '⚠️';
    const priorityEmoji = {
      critical: '🚨',
      high: '⚡',
      medium: '📋',
      low: 'ℹ️',
    }[category.priority];

    console.log(`${icon} ${priorityEmoji} ${category.displayName}`);
    console.log(`   Status: ${category.status.toUpperCase()}`);
    console.log(`   Checks: ${category.passed}/${category.totalChecks} passed`);
    if (category.failed > 0) {
      console.log(`   Failed: ${category.failed}`);
    }
    if (category.warnings > 0) {
      console.log(`   Warnings: ${category.warnings}`);
    }
    console.log('');
  });

  // Next steps
  if (report.nextSteps.length > 0) {
    console.log('NEXT STEPS');
    console.log('-'.repeat(70));
    report.nextSteps.forEach((step: string, index: number) => {
      console.log(`${index + 1}. ${step}`);
    });
    console.log('');
  }

  // Failed checks detail
  const failedChecks = report.checks.filter((c: any) => c.status === 'fail');
  if (failedChecks.length > 0) {
    console.log('FAILED CHECKS (Top 10)');
    console.log('-'.repeat(70));
    failedChecks.slice(0, 10).forEach((check: any) => {
      console.log(`❌ ${check.name} (${check.id})`);
      console.log(`   Severity: ${check.severity.toUpperCase()}`);
      console.log(`   Category: ${check.category.replace(/_/g, ' ')}`);
      if (check.findings.length > 0) {
        console.log(`   Findings: ${check.findings[0]}`);
      }
      if (check.recommendations.length > 0) {
        console.log(`   Recommendation: ${check.recommendations[0]}`);
      }
      console.log('');
    });
  }

  console.log('='.repeat(70) + '\n');
}

// Main function
async function main(): Promise<void> {
  const config = parseArgs();

  if (config.help) {
    displayHelp();
    process.exit(0);
  }

  console.log('\n🔍 Running OWASP Top 10 2021 Security Audit...\n');

  try {
    const startTime = Date.now();
    const report = await runOWASPAudit(config);
    const duration = Date.now() - startTime;

    displayReport(report);

    console.log(`✨ Audit completed in ${(duration / 1000).toFixed(2)}s\n`);

    if (config.generateReport) {
      console.log(`📄 Reports saved to: ${config.outputDir || './security-reports'}`);
      console.log(`   - JSON report: owasp-audit-*.json`);
      console.log(`   - Markdown report: latest-owasp-audit.md\n`);
    }

    // Exit with appropriate code
    if (report.summary.criticalIssues > 0 || report.summary.failed > 10) {
      console.log('⚠️  Security audit failed - critical issues found\n');
      process.exit(1);
    } else if (report.summary.highIssues > 5) {
      console.log('⚠️  Security audit needs review - high issues found\n');
      process.exit(0);
    } else {
      console.log('✅ Security audit passed\n');
      process.exit(0);
    }
  } catch (error: any) {
    console.error('❌ Error running security audit:', error.message);
    process.exit(2);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
