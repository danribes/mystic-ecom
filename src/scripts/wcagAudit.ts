/**
 * T146: WCAG 2.1 AA Accessibility Audit - CLI Tool
 *
 * Command-line interface for running WCAG 2.1 Level AA accessibility audits
 *
 * Usage:
 *   npm run accessibility:audit
 *   npm run accessibility:audit -- --save-report
 *   npm run accessibility:audit -- --verbose
 */

import { WCAGAuditor, type WCAGAuditReport } from '../lib/security/wcagAuditor';
import * as fs from 'fs/promises';
import * as path from 'path';

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

/**
 * Format colored text
 */
function color(text: string, colorCode: string): string {
  return `${colorCode}${text}${colors.reset}`;
}

/**
 * Run WCAG audit and display results
 */
async function main() {
  const args = process.argv.slice(2);
  const saveReport = args.includes('--save-report');
  const verbose = args.includes('--verbose');

  console.log(color('\n🔍 Starting WCAG 2.1 AA Accessibility Audit...', colors.bright + colors.cyan));
  console.log(color('═'.repeat(60), colors.cyan));

  const startTime = Date.now();

  try {
    // Create auditor
    const auditor = new WCAGAuditor({
      rootDir: process.cwd(),
      maxFiles: 50,
      timeout: 30000,
    });

    // Run audit
    const report = await auditor.audit();
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    // Display results
    displayResults(report, duration, verbose);

    // Save report if requested
    if (saveReport) {
      await saveReportFiles(report);
    }

    // Exit with appropriate code
    if (report.summary.criticalIssues > 0 || report.overallStatus === 'non_compliant') {
      console.log(color('\n⚠️  Accessibility audit failed - critical issues found\n', colors.red));
      process.exit(1);
    } else if (report.summary.failed > 0 || report.overallStatus === 'needs_review') {
      console.log(color('\n⚠️  Accessibility audit needs review - issues found\n', colors.yellow));
      process.exit(0); // Don't fail build for warnings
    } else {
      console.log(color('\n✅ Accessibility audit passed!\n', colors.green));
      process.exit(0);
    }
  } catch (error: any) {
    console.error(color(`\n❌ Audit failed: ${error.message}\n`, colors.red));
    process.exit(1);
  }
}

/**
 * Display audit results
 */
function displayResults(report: WCAGAuditReport, duration: string, verbose: boolean) {
  console.log(color(`\n✨ Audit completed in ${duration}s`, colors.green));
  console.log(color('─'.repeat(60), colors.cyan));

  // Summary
  console.log(color('\n📊 Summary', colors.bright + colors.blue));
  console.log(color('─'.repeat(60), colors.blue));

  const { summary } = report;
  console.log(`Files Scanned:      ${summary.totalChecks > 0 ? report.filesScanned : 0}`);
  console.log(`Total Checks:       ${summary.totalChecks}`);
  console.log(color(`Passed:             ${summary.passed}`, colors.green));
  console.log(color(`Failed:             ${summary.failed}`, summary.failed > 0 ? colors.red : colors.green));
  console.log(color(`Warnings:           ${summary.warnings}`, summary.warnings > 0 ? colors.yellow : colors.green));
  console.log(`Not Applicable:     ${summary.notApplicable}`);

  // Compliance score
  const scoreColor =
    summary.complianceScore >= 90 ? colors.green :
    summary.complianceScore >= 70 ? colors.yellow :
    colors.red;

  console.log(color(`\nCompliance Score:   ${summary.complianceScore}%`, colors.bright + scoreColor));

  // Overall status
  const statusIcon =
    report.overallStatus === 'compliant' ? '✅' :
    report.overallStatus === 'needs_review' ? '⚠️' :
    '❌';

  const statusColor =
    report.overallStatus === 'compliant' ? colors.green :
    report.overallStatus === 'needs_review' ? colors.yellow :
    colors.red;

  console.log(color(`Overall Status:     ${statusIcon} ${report.overallStatus.replace('_', ' ').toUpperCase()}`, statusColor));

  // Issue breakdown
  if (summary.criticalIssues > 0 || summary.seriousIssues > 0 || summary.moderateIssues > 0) {
    console.log(color('\n🔍 Issue Severity Breakdown', colors.bright + colors.magenta));
    console.log(color('─'.repeat(60), colors.magenta));

    if (summary.criticalIssues > 0) {
      console.log(color(`🚨 Critical:  ${summary.criticalIssues} issues`, colors.red));
    }
    if (summary.seriousIssues > 0) {
      console.log(color(`⚡ Serious:   ${summary.seriousIssues} issues`, colors.red));
    }
    if (summary.moderateIssues > 0) {
      console.log(color(`📋 Moderate:  ${summary.moderateIssues} issues`, colors.yellow));
    }
    if (summary.minorIssues > 0) {
      console.log(color(`ℹ️  Minor:     ${summary.minorIssues} issues`, colors.blue));
    }
  }

  // Categories
  console.log(color('\n📂 WCAG 2.1 Principles (POUR)', colors.bright + colors.cyan));
  console.log(color('─'.repeat(60), colors.cyan));

  const principles: Array<{key: 'perceivable' | 'operable' | 'understandable' | 'robust', icon: string}> = [
    { key: 'perceivable', icon: '👁️' },
    { key: 'operable', icon: '⌨️' },
    { key: 'understandable', icon: '🧠' },
    { key: 'robust', icon: '🔧' },
  ];

  for (const { key, icon } of principles) {
    const category = report.categories[key];
    const statusIcon =
      category.status === 'pass' ? '✅' :
      category.status === 'warning' ? '⚠️' :
      '❌';

    const scoreStr = `${category.complianceScore}%`;
    const scoreColor =
      category.complianceScore >= 90 ? colors.green :
      category.complianceScore >= 70 ? colors.yellow :
      colors.red;

    console.log(`${icon}  ${statusIcon} ${category.name.padEnd(18)} ${color(scoreStr.padStart(4), scoreColor)} (${category.passed}/${category.totalChecks} passed)`);
  }

  // Failed checks
  const failedChecks = report.checks.filter(c => c.status === 'fail');
  if (failedChecks.length > 0 && verbose) {
    console.log(color('\n❌ Failed Checks', colors.bright + colors.red));
    console.log(color('─'.repeat(60), colors.red));

    for (const check of failedChecks) {
      const severityIcon =
        check.severity === 'critical' ? '🚨' :
        check.severity === 'serious' ? '⚡' :
        check.severity === 'moderate' ? '📋' :
        'ℹ️';

      console.log(`\n${severityIcon} ${check.id}: ${check.name}`);
      console.log(`   ${check.description}`);
      console.log(color(`   Issues: ${check.issues.length}`, colors.yellow));

      if (check.issues.length > 0 && verbose) {
        // Show first 3 issues
        for (const issue of check.issues.slice(0, 3)) {
          console.log(color(`   • ${issue.problem}`, colors.red));
          if (issue.file) {
            console.log(color(`     File: ${issue.file}`, colors.cyan));
          }
          if (issue.recommendation) {
            console.log(color(`     Fix: ${issue.recommendation}`, colors.green));
          }
        }

        if (check.issues.length > 3) {
          console.log(color(`   ... and ${check.issues.length - 3} more issues`, colors.yellow));
        }
      }
    }
  }

  // Warnings
  const warnings = report.checks.filter(c => c.status === 'warning');
  if (warnings.length > 0 && verbose) {
    console.log(color('\n⚠️  Warnings (Manual Review Needed)', colors.bright + colors.yellow));
    console.log(color('─'.repeat(60), colors.yellow));

    for (const check of warnings.slice(0, 5)) {
      console.log(`• ${check.name}: ${check.description}`);
      if (check.issues.length > 0) {
        console.log(color(`  ${check.issues[0].recommendation}`, colors.cyan));
      }
    }

    if (warnings.length > 5) {
      console.log(color(`... and ${warnings.length - 5} more warnings`, colors.yellow));
    }
  }

  // Recommendations
  if (report.recommendations.length > 0) {
    console.log(color('\n💡 Recommendations', colors.bright + colors.green));
    console.log(color('─'.repeat(60), colors.green));

    for (const rec of report.recommendations) {
      console.log(`• ${rec}`);
    }
  }
}

/**
 * Save report files
 */
async function saveReportFiles(report: WCAGAuditReport) {
  const reportsDir = path.join(process.cwd(), 'accessibility-reports');

  try {
    await fs.mkdir(reportsDir, { recursive: true });

    // Save JSON report
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const jsonPath = path.join(reportsDir, `wcag-audit-${timestamp}.json`);
    await fs.writeFile(jsonPath, JSON.stringify(report, null, 2));

    // Save Markdown report
    const mdPath = path.join(reportsDir, 'latest-wcag-audit.md');
    const markdown = generateMarkdownReport(report);
    await fs.writeFile(mdPath, markdown);

    console.log(color('\n📄 Reports saved to: ./accessibility-reports', colors.green));
    console.log(`   • JSON: ${path.basename(jsonPath)}`);
    console.log(`   • Markdown: ${path.basename(mdPath)}`);
  } catch (error: any) {
    console.error(color(`Failed to save reports: ${error.message}`, colors.red));
  }
}

/**
 * Generate Markdown report
 */
function generateMarkdownReport(report: WCAGAuditReport): string {
  const { summary, categories, checks } = report;

  let md = '# WCAG 2.1 AA Accessibility Audit Report\n\n';
  md += `**Generated**: ${new Date(report.timestamp).toLocaleString()}\n\n`;
  md += `**Files Scanned**: ${report.filesScanned}\n\n`;

  md += '---\n\n';
  md += '## Executive Summary\n\n';
  md += `**Compliance Score**: ${summary.complianceScore}%\n\n`;
  md += `**Overall Status**: ${report.overallStatus.replace('_', ' ').toUpperCase()}\n\n`;

  md += '### Results Breakdown\n\n';
  md += `- ✅ **Passed**: ${summary.passed} checks\n`;
  md += `- ❌ **Failed**: ${summary.failed} checks\n`;
  md += `- ⚠️  **Warnings**: ${summary.warnings} checks\n`;
  md += `- ℹ️  **Not Applicable**: ${summary.notApplicable} checks\n\n`;

  if (summary.criticalIssues > 0 || summary.seriousIssues > 0) {
    md += '### Issue Severity\n\n';
    if (summary.criticalIssues > 0) md += `- 🚨 **Critical**: ${summary.criticalIssues} issues\n`;
    if (summary.seriousIssues > 0) md += `- ⚡ **Serious**: ${summary.seriousIssues} issues\n`;
    if (summary.moderateIssues > 0) md += `- 📋 **Moderate**: ${summary.moderateIssues} issues\n`;
    if (summary.minorIssues > 0) md += `- ℹ️  **Minor**: ${summary.minorIssues} issues\n`;
    md += '\n';
  }

  md += '---\n\n';
  md += '## WCAG 2.1 Principles (POUR)\n\n';

  const principles: Array<{key: 'perceivable' | 'operable' | 'understandable' | 'robust', icon: string}> = [
    { key: 'perceivable', icon: '👁️' },
    { key: 'operable', icon: '⌨️' },
    { key: 'understandable', icon: '🧠' },
    { key: 'robust', icon: '🔧' },
  ];

  for (const { key, icon } of principles) {
    const category = categories[key];
    const statusIcon = category.status === 'pass' ? '✅' : category.status === 'warning' ? '⚠️' : '❌';

    md += `### ${icon} ${statusIcon} ${category.name}\n\n`;
    md += `${category.description}\n\n`;
    md += `**Score**: ${category.complianceScore}% (${category.passed}/${category.totalChecks} passed)\n\n`;

    const categoryChecks = checks.filter(c => c.principle === key && c.status === 'fail');
    if (categoryChecks.length > 0) {
      md += '**Failed Checks**:\n\n';
      for (const check of categoryChecks) {
        md += `- ${check.id}: ${check.name} (${check.issues.length} issues)\n`;
      }
      md += '\n';
    }
  }

  md += '---\n\n';
  md += '## Detailed Findings\n\n';

  const failedChecks = checks.filter(c => c.status === 'fail');
  if (failedChecks.length > 0) {
    for (const check of failedChecks) {
      const severityIcon =
        check.severity === 'critical' ? '🚨' :
        check.severity === 'serious' ? '⚡' :
        check.severity === 'moderate' ? '📋' :
        'ℹ️';

      md += `### ${severityIcon} ${check.id}: ${check.name}\n\n`;
      md += `**Guideline**: ${check.guideline}\n\n`;
      md += `**Success Criterion**: ${check.successCriterion}\n\n`;
      md += `**Level**: ${check.level}\n\n`;
      md += `**Severity**: ${check.severity.toUpperCase()}\n\n`;
      md += `**Description**: ${check.description}\n\n`;
      md += `**Reference**: [WCAG 2.1](${check.wcagReference})\n\n`;

      if (check.issues.length > 0) {
        md += `**Issues Found** (${check.issues.length}):\n\n`;

        for (const issue of check.issues.slice(0, 10)) {
          md += `- **Problem**: ${issue.problem}\n`;
          if (issue.file) md += `  - **File**: ${issue.file}\n`;
          if (issue.element) md += `  - **Element**: \`${issue.element}\`\n`;
          if (issue.selector) md += `  - **Selector**: \`${issue.selector}\`\n`;
          md += `  - **Recommendation**: ${issue.recommendation}\n\n`;
        }

        if (check.issues.length > 10) {
          md += `_... and ${check.issues.length - 10} more issues_\n\n`;
        }
      }

      md += '---\n\n';
    }
  }

  if (report.recommendations.length > 0) {
    md += '## Recommendations\n\n';
    for (const rec of report.recommendations) {
      md += `- ${rec}\n`;
    }
    md += '\n';
  }

  md += '---\n\n';
  md += '## Resources\n\n';
  md += '- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)\n';
  md += '- [WebAIM Accessibility Checklist](https://webaim.org/standards/wcag/checklist)\n';
  md += '- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)\n';
  md += '- [A11y Project Checklist](https://www.a11yproject.com/checklist/)\n\n';

  return md;
}

// Run main function
main().catch(console.error);
