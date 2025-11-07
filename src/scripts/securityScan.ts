#!/usr/bin/env tsx
/**
 * T134: Security Scan CLI
 *
 * Command-line interface for running security vulnerability scans
 *
 * Usage:
 *   npm run security:scan
 *   tsx src/scripts/securityScan.ts
 *   tsx src/scripts/securityScan.ts --save-report
 *   tsx src/scripts/securityScan.ts --fail-on critical,high
 *   tsx src/scripts/securityScan.ts --snyk --snyk-token YOUR_TOKEN
 */

import { VulnerabilityScanner, type ScannerConfig } from '../lib/security/vulnerabilityScanner.js';

// Parse command line arguments
function parseArgs(): ScannerConfig & { help?: boolean } {
  const args = process.argv.slice(2);
  const config: ScannerConfig & { help?: boolean } = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--help':
      case '-h':
        config.help = true;
        break;

      case '--save-report':
      case '-s':
        config.saveReport = true;
        break;

      case '--output-dir':
      case '-o':
        config.outputDir = args[++i];
        break;

      case '--fail-on':
      case '-f':
        const severities = args[++i].split(',');
        config.failOnSeverity = severities as any[];
        break;

      case '--max-critical':
        config.maxVulnerabilities = config.maxVulnerabilities || {};
        config.maxVulnerabilities.critical = parseInt(args[++i], 10);
        break;

      case '--max-high':
        config.maxVulnerabilities = config.maxVulnerabilities || {};
        config.maxVulnerabilities.high = parseInt(args[++i], 10);
        break;

      case '--max-moderate':
        config.maxVulnerabilities = config.maxVulnerabilities || {};
        config.maxVulnerabilities.moderate = parseInt(args[++i], 10);
        break;

      case '--max-low':
        config.maxVulnerabilities = config.maxVulnerabilities || {};
        config.maxVulnerabilities.low = parseInt(args[++i], 10);
        break;

      case '--snyk':
        config.snykEnabled = true;
        break;

      case '--snyk-token':
        config.snykToken = args[++i];
        break;

      case '--exclude':
      case '-e':
        config.excludePackages = args[++i].split(',');
        break;

      case '--exclude-dev':
        config.excludeDev = true;
        break;
    }
  }

  return config;
}

// Display help message
function displayHelp(): void {
  console.log(`
Security Vulnerability Scanner
================================

Usage:
  npm run security:scan [options]
  tsx src/scripts/securityScan.ts [options]

Options:
  -h, --help                Display this help message
  -s, --save-report         Save detailed report to file
  -o, --output-dir <dir>    Output directory for reports (default: ./security-reports)
  -f, --fail-on <levels>    Fail on specified severity levels (comma-separated)
                            Example: --fail-on critical,high
  --max-critical <n>        Maximum allowed critical vulnerabilities
  --max-high <n>            Maximum allowed high-severity vulnerabilities
  --max-moderate <n>        Maximum allowed moderate-severity vulnerabilities
  --max-low <n>             Maximum allowed low-severity vulnerabilities
  --snyk                    Enable Snyk scanning
  --snyk-token <token>      Snyk authentication token
  -e, --exclude <packages>  Exclude packages (comma-separated)
  --exclude-dev             Exclude dev dependencies

Examples:
  # Basic scan
  npm run security:scan

  # Scan and save report
  npm run security:scan --save-report

  # Fail on critical and high vulnerabilities
  npm run security:scan --fail-on critical,high

  # Scan with custom thresholds
  npm run security:scan --max-critical 0 --max-high 2

  # Enable Snyk
  npm run security:scan --snyk --snyk-token YOUR_TOKEN

Exit Codes:
  0 - Scan passed (within thresholds)
  1 - Scan failed (exceeded thresholds)
  2 - Error during scan
`);
}

// Format console output with colors
function formatSeverity(severity: string): string {
  const colors = {
    critical: '\x1b[35m', // Magenta
    high: '\x1b[31m',     // Red
    moderate: '\x1b[33m', // Yellow
    low: '\x1b[36m',      // Cyan
    info: '\x1b[37m',     // White
  };

  const reset = '\x1b[0m';
  const color = colors[severity as keyof typeof colors] || '';

  return `${color}${severity.toUpperCase()}${reset}`;
}

// Main function
async function main(): Promise<void> {
  const config = parseArgs();

  if (config.help) {
    displayHelp();
    process.exit(0);
  }

  console.log('🔍 Running Security Vulnerability Scan...\n');

  try {
    const scanner = new VulnerabilityScanner(config);
    const result = await scanner.scan();

    // Display summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 SCAN SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log(`Scan Date: ${new Date(result.timestamp).toLocaleString()}`);
    console.log(`Status: ${result.passesThreshold ? '✅ PASSED' : '❌ FAILED'}\n`);

    console.log('Vulnerabilities by Severity:');
    console.log(`  Critical:  ${result.summary.critical}`);
    console.log(`  High:      ${result.summary.high}`);
    console.log(`  Moderate:  ${result.summary.moderate}`);
    console.log(`  Low:       ${result.summary.low}`);
    console.log(`  Info:      ${result.summary.info}`);
    console.log(`  ────────────────────────────`);
    console.log(`  Total:     ${result.summary.total}\n`);

    console.log(`Fixable:               ${result.fixable}`);
    console.log(`Requires Manual Review: ${result.requiresManualReview}\n`);

    // Display recommendations
    if (result.recommendations.length > 0) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('💡 RECOMMENDATIONS');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      result.recommendations.forEach((rec) => {
        console.log(`  ${rec}`);
      });
      console.log('');
    }

    // Display top vulnerabilities
    if (result.vulnerabilities.length > 0) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🔴 TOP VULNERABILITIES');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      // Show top 5 vulnerabilities
      const topVulns = result.vulnerabilities.slice(0, 5);

      topVulns.forEach((vuln, index) => {
        console.log(`${index + 1}. ${vuln.package}`);
        console.log(`   Severity: ${formatSeverity(vuln.severity)}`);
        console.log(`   ${vuln.title}`);

        if (vuln.fixAvailable) {
          console.log(`   ✅ Fix: ${vuln.fixVersion || 'Available'}`);
          if (vuln.requiresBreakingChange) {
            console.log(`   ⚠️  Requires breaking change`);
          }
        } else {
          console.log(`   ❌ No fix available`);
        }

        if (vuln.url) {
          console.log(`   🔗 ${vuln.url}`);
        }

        console.log('');
      });

      if (result.vulnerabilities.length > 5) {
        console.log(`  ... and ${result.vulnerabilities.length - 5} more\n`);
      }
    }

    // Display report location
    if (config.saveReport) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📄 REPORT SAVED');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      console.log(`  Reports saved to: ${config.outputDir || './security-reports'}`);
      console.log(`  - latest-security-report.md (Markdown format)`);
      console.log(`  - security-scan-*.json (JSON format)\n`);
    }

    // Exit with appropriate code
    if (!result.passesThreshold) {
      console.log('❌ Security scan FAILED - vulnerabilities exceed thresholds\n');
      process.exit(1);
    } else {
      console.log('✅ Security scan PASSED - no critical issues found\n');
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Error running security scan:\n');
    console.error(error);
    process.exit(2);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(2);
  });
}

export { main };
