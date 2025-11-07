#!/usr/bin/env tsx
/**
 * Production Deployment Validation Script
 *
 * Validates deployment readiness by checking:
 * - Environment variables
 * - Database connectivity
 * - Redis connectivity
 * - External services
 * - Security configuration
 * - Build process
 * - Test suite
 *
 * Usage:
 *   tsx src/scripts/deploy-validate.ts              - Full validation
 *   tsx src/scripts/deploy-validate.ts --quick      - Quick validation (no tests)
 *   tsx src/scripts/deploy-validate.ts --report     - Generate report file
 *   tsx src/scripts/deploy-validate.ts --help       - Show help
 */

import { config } from 'dotenv';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const execAsync = promisify(exec);

// Load environment variables
config();

interface ValidationResult {
  category: string;
  check: string;
  status: 'pass' | 'fail' | 'warn' | 'skip';
  message: string;
  severity: 'blocker' | 'critical' | 'important' | 'nice-to-have';
  duration?: number;
}

interface ValidationReport {
  timestamp: string;
  environment: string;
  totalChecks: number;
  passed: number;
  failed: number;
  warnings: number;
  skipped: number;
  blockers: number;
  criticals: number;
  deploymentReady: boolean;
  results: ValidationResult[];
  summary: string;
}

const results: ValidationResult[] = [];

/**
 * Add validation result
 */
function addResult(
  category: string,
  check: string,
  status: 'pass' | 'fail' | 'warn' | 'skip',
  message: string,
  severity: 'blocker' | 'critical' | 'important' | 'nice-to-have',
  duration?: number
): void {
  results.push({ category, check, status, message, severity, duration });
}

/**
 * Print colored output
 */
function print(message: string, color: 'green' | 'red' | 'yellow' | 'blue' | 'gray' = 'gray'): void {
  const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    gray: '\x1b[90m',
    reset: '\x1b[0m',
  };
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Run a check with timing
 */
async function runCheck(
  category: string,
  check: string,
  fn: () => Promise<{ status: 'pass' | 'fail' | 'warn' | 'skip'; message: string }>,
  severity: 'blocker' | 'critical' | 'important' | 'nice-to-have'
): Promise<void> {
  const start = Date.now();
  try {
    const result = await fn();
    const duration = Date.now() - start;
    addResult(category, check, result.status, result.message, severity, duration);

    const icon =
      result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : result.status === 'warn' ? '⚠️ ' : '⏭️ ';
    const severityIcon =
      severity === 'blocker' ? '🔴' : severity === 'critical' ? '🟡' : severity === 'important' ? '🟢' : '🔵';

    print(`${icon} ${severityIcon} ${check}`, result.status === 'pass' ? 'green' : result.status === 'fail' ? 'red' : 'yellow');
    if (result.message) {
      print(`   ${result.message}`, 'gray');
    }
  } catch (error: unknown) {
    const duration = Date.now() - start;
    const errorMessage = error instanceof Error ? error.message : String(error);
    addResult(category, check, 'fail', `Error: ${errorMessage}`, severity, duration);
    print(`❌ ${check}`, 'red');
    print(`   Error: ${errorMessage}`, 'red');
  }
}

/**
 * 1. Environment Variables Validation
 */
async function validateEnvironmentVariables(): Promise<void> {
  print('\n📋 Environment Variables', 'blue');
  print('═'.repeat(60), 'gray');

  const requiredVars = [
    'NODE_ENV',
    'PUBLIC_SITE_URL',
    'DATABASE_URL',
    'REDIS_URL',
    'STRIPE_SECRET_KEY',
    'STRIPE_PUBLISHABLE_KEY',
    'RESEND_API_KEY',
    'JWT_SECRET',
    'SESSION_SECRET',
  ];

  const productionVars = ['SENTRY_DSN', 'STRIPE_WEBHOOK_SECRET'];

  // Check NODE_ENV
  await runCheck(
    'Environment',
    'NODE_ENV is production',
    async () => {
      const nodeEnv = process.env.NODE_ENV;
      if (nodeEnv === 'production') {
        return { status: 'pass', message: 'NODE_ENV=production' };
      }
      return { status: 'fail', message: `NODE_ENV=${nodeEnv} (should be production)` };
    },
    'blocker'
  );

  // Check required variables
  for (const varName of requiredVars) {
    await runCheck(
      'Environment',
      `${varName} is set`,
      async () => {
        if (process.env[varName]) {
          return { status: 'pass', message: `${varName} is configured` };
        }
        return { status: 'fail', message: `${varName} is not set` };
      },
      'blocker'
    );
  }

  // Check production-specific variables
  for (const varName of productionVars) {
    await runCheck(
      'Environment',
      `${varName} is set`,
      async () => {
        if (process.env[varName]) {
          return { status: 'pass', message: `${varName} is configured` };
        }
        return { status: 'warn', message: `${varName} not set (recommended for production)` };
      },
      'important'
    );
  }

  // Check for test/development keys in production
  await runCheck(
    'Environment',
    'No test keys in production',
    async () => {
      const stripeKey = process.env.STRIPE_SECRET_KEY || '';
      if (stripeKey.startsWith('sk_test_')) {
        return { status: 'fail', message: 'Using Stripe TEST key (should use sk_live_...)' };
      }
      if (stripeKey.startsWith('sk_live_')) {
        return { status: 'pass', message: 'Using Stripe LIVE key' };
      }
      return { status: 'warn', message: 'Stripe key format unclear' };
    },
    'blocker'
  );

  // Check for dangerous flags
  await runCheck(
    'Environment',
    'No bypass flags enabled',
    async () => {
      if (process.env.BYPASS_ADMIN_AUTH === 'true') {
        return { status: 'fail', message: 'BYPASS_ADMIN_AUTH=true (SECURITY RISK!)' };
      }
      return { status: 'pass', message: 'No dangerous bypass flags detected' };
    },
    'blocker'
  );

  // Check secret strength
  await runCheck(
    'Environment',
    'JWT_SECRET strength',
    async () => {
      const secret = process.env.JWT_SECRET || '';
      if (secret.length < 32) {
        return { status: 'fail', message: `JWT_SECRET too short (${secret.length} chars, need 32+)` };
      }
      return { status: 'pass', message: `JWT_SECRET is strong (${secret.length} chars)` };
    },
    'critical'
  );

  await runCheck(
    'Environment',
    'SESSION_SECRET strength',
    async () => {
      const secret = process.env.SESSION_SECRET || '';
      if (secret.length < 32) {
        return { status: 'fail', message: `SESSION_SECRET too short (${secret.length} chars, need 32+)` };
      }
      return { status: 'pass', message: `SESSION_SECRET is strong (${secret.length} chars)` };
    },
    'critical'
  );
}

/**
 * 2. Database Connectivity
 */
async function validateDatabase(): Promise<void> {
  print('\n🗄️  Database', 'blue');
  print('═'.repeat(60), 'gray');

  await runCheck(
    'Database',
    'Database connection',
    async () => {
      try {
        const { stdout } = await execAsync(`psql "${process.env.DATABASE_URL}" -c "SELECT 1" -t`);
        if (stdout.trim() === '1') {
          return { status: 'pass', message: 'Database is accessible' };
        }
        return { status: 'fail', message: 'Database query failed' };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { status: 'fail', message: `Cannot connect to database: ${errorMessage}` };
      }
    },
    'blocker'
  );

  await runCheck(
    'Database',
    'Database is not staging',
    async () => {
      try {
        const { stdout } = await execAsync(`psql "${process.env.DATABASE_URL}" -c "SELECT current_database()" -t`);
        const dbName = stdout.trim();
        if (dbName.toLowerCase().includes('staging') || dbName.toLowerCase().includes('test')) {
          return { status: 'fail', message: `Database appears to be staging/test: ${dbName}` };
        }
        return { status: 'pass', message: `Database: ${dbName}` };
      } catch (error: unknown) {
        return { status: 'warn', message: 'Could not verify database name' };
      }
    },
    'blocker'
  );
}

/**
 * 3. Redis Connectivity
 */
async function validateRedis(): Promise<void> {
  print('\n💾 Redis', 'blue');
  print('═'.repeat(60), 'gray');

  await runCheck(
    'Redis',
    'Redis connection',
    async () => {
      try {
        // Test Redis connection by importing and testing
        const redisModule = await import('../lib/redis.js');
        const redis = redisModule.default;
        await redis.set('deploy-test', 'ok', 'EX', 10);
        const value = await redis.get('deploy-test');
        if (value === 'ok') {
          return { status: 'pass', message: 'Redis is accessible' };
        }
        return { status: 'fail', message: 'Redis test failed' };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { status: 'fail', message: `Cannot connect to Redis: ${errorMessage}` };
      }
    },
    'critical'
  );
}

/**
 * 4. External Services
 */
async function validateExternalServices(): Promise<void> {
  print('\n🔌 External Services', 'blue');
  print('═'.repeat(60), 'gray');

  // Stripe
  await runCheck(
    'External Services',
    'Stripe configuration',
    async () => {
      const secretKey = process.env.STRIPE_SECRET_KEY;
      const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;

      if (!secretKey || !publishableKey) {
        return { status: 'fail', message: 'Stripe keys not configured' };
      }

      if (!secretKey.startsWith('sk_live_')) {
        return { status: 'fail', message: 'Not using Stripe LIVE secret key' };
      }

      if (!publishableKey.startsWith('pk_live_')) {
        return { status: 'fail', message: 'Not using Stripe LIVE publishable key' };
      }

      return { status: 'pass', message: 'Stripe configured with LIVE keys' };
    },
    'blocker'
  );

  // Resend
  await runCheck(
    'External Services',
    'Resend (Email) configuration',
    async () => {
      const apiKey = process.env.RESEND_API_KEY;
      if (!apiKey) {
        return { status: 'fail', message: 'Resend API key not configured' };
      }
      if (apiKey.startsWith('re_')) {
        return { status: 'pass', message: 'Resend API key configured' };
      }
      return { status: 'warn', message: 'Resend API key format unclear' };
    },
    'critical'
  );

  // Sentry
  await runCheck(
    'External Services',
    'Sentry (Monitoring) configuration',
    async () => {
      const dsn = process.env.SENTRY_DSN;
      if (!dsn) {
        return { status: 'warn', message: 'Sentry DSN not configured (recommended)' };
      }
      return { status: 'pass', message: 'Sentry configured for error monitoring' };
    },
    'important'
  );
}

/**
 * 5. Security Configuration
 */
async function validateSecurity(): Promise<void> {
  print('\n🔒 Security', 'blue');
  print('═'.repeat(60), 'gray');

  // Check for .env in git
  await runCheck(
    'Security',
    '.env not in repository',
    async () => {
      try {
        const { stdout } = await execAsync('git ls-files .env');
        if (stdout.trim()) {
          return { status: 'fail', message: '.env file is tracked by git (SECURITY RISK!)' };
        }
        return { status: 'pass', message: '.env is not tracked by git' };
      } catch {
        return { status: 'pass', message: '.env is not tracked by git' };
      }
    },
    'blocker'
  );

  // Check .gitignore
  await runCheck(
    'Security',
    '.env in .gitignore',
    async () => {
      const gitignorePath = path.join(process.cwd(), '.gitignore');
      if (existsSync(gitignorePath)) {
        const content = await fs.readFile(gitignorePath, 'utf-8');
        if (content.includes('.env')) {
          return { status: 'pass', message: '.env is in .gitignore' };
        }
        return { status: 'fail', message: '.env not in .gitignore' };
      }
      return { status: 'warn', message: '.gitignore not found' };
    },
    'blocker'
  );

  // Check for console.log in production code
  await runCheck(
    'Security',
    'No console.log in production',
    async () => {
      try {
        const { stdout } = await execAsync('grep -r "console\\.log" src/ --include="*.ts" --include="*.js" | wc -l');
        const count = parseInt(stdout.trim(), 10);
        if (count > 0) {
          return { status: 'warn', message: `Found ${count} console.log statements (should remove for production)` };
        }
        return { status: 'pass', message: 'No console.log statements found' };
      } catch {
        return { status: 'pass', message: 'No console.log statements found' };
      }
    },
    'important'
  );
}

/**
 * 6. Build Process
 */
async function validateBuild(): Promise<void> {
  print('\n🏗️  Build Process', 'blue');
  print('═'.repeat(60), 'gray');

  await runCheck(
    'Build',
    'TypeScript compilation',
    async () => {
      try {
        await execAsync('npx tsc --noEmit');
        return { status: 'pass', message: 'TypeScript compilation successful' };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { status: 'fail', message: `TypeScript errors: ${errorMessage}` };
      }
    },
    'blocker'
  );

  await runCheck(
    'Build',
    'Production build',
    async () => {
      try {
        await execAsync('npm run build');
        return { status: 'pass', message: 'Production build successful' };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { status: 'fail', message: `Build failed: ${errorMessage}` };
      }
    },
    'blocker'
  );

  await runCheck(
    'Build',
    'Build output exists',
    async () => {
      const distPath = path.join(process.cwd(), 'dist');
      if (existsSync(distPath)) {
        return { status: 'pass', message: 'Build output directory exists' };
      }
      return { status: 'fail', message: 'Build output directory not found' };
    },
    'blocker'
  );
}

/**
 * 7. Test Suite
 */
async function validateTests(quick: boolean): Promise<void> {
  print('\n🧪 Test Suite', 'blue');
  print('═'.repeat(60), 'gray');

  if (quick) {
    addResult('Tests', 'Test suite', 'skip', 'Skipped (quick mode)', 'critical');
    print('⏭️  Test suite', 'yellow');
    print('   Skipped (quick mode)', 'gray');
    return;
  }

  await runCheck(
    'Tests',
    'Unit tests',
    async () => {
      try {
        const { stdout } = await execAsync('npm test');
        if (stdout.includes('All tests passing') || stdout.includes('passed')) {
          return { status: 'pass', message: 'All unit tests passing' };
        }
        return { status: 'fail', message: 'Some unit tests failing' };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { status: 'fail', message: `Test failures: ${errorMessage}` };
      }
    },
    'blocker'
  );
}

/**
 * Generate validation report
 */
function generateReport(): ValidationReport {
  const passed = results.filter((r) => r.status === 'pass').length;
  const failed = results.filter((r) => r.status === 'fail').length;
  const warnings = results.filter((r) => r.status === 'warn').length;
  const skipped = results.filter((r) => r.status === 'skip').length;

  const blockers = results.filter((r) => r.status === 'fail' && r.severity === 'blocker').length;
  const criticals = results.filter((r) => r.status === 'fail' && r.severity === 'critical').length;

  const deploymentReady = blockers === 0 && failed === 0;

  let summary = '';
  if (deploymentReady) {
    summary = '✅ READY FOR DEPLOYMENT';
  } else if (blockers > 0) {
    summary = `❌ BLOCKED - ${blockers} blocker(s) must be fixed`;
  } else if (criticals > 0) {
    summary = `⚠️  CRITICAL ISSUES - ${criticals} critical issue(s) should be fixed`;
  } else {
    summary = `⚠️  ISSUES FOUND - ${failed} check(s) failed`;
  }

  return {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    totalChecks: results.length,
    passed,
    failed,
    warnings,
    skipped,
    blockers,
    criticals,
    deploymentReady,
    results,
    summary,
  };
}

/**
 * Print summary
 */
function printSummary(report: ValidationReport): void {
  print('\n' + '═'.repeat(60), 'gray');
  print('📊 VALIDATION SUMMARY', 'blue');
  print('═'.repeat(60), 'gray');
  print('');
  print(`Total Checks: ${report.totalChecks}`);
  print(`Passed: ${report.passed}`, 'green');
  print(`Failed: ${report.failed}`, report.failed > 0 ? 'red' : 'gray');
  print(`Warnings: ${report.warnings}`, report.warnings > 0 ? 'yellow' : 'gray');
  print(`Skipped: ${report.skipped}`, 'gray');
  print('');

  if (report.blockers > 0) {
    print(`🔴 Blockers: ${report.blockers}`, 'red');
  }
  if (report.criticals > 0) {
    print(`🟡 Critical: ${report.criticals}`, 'yellow');
  }
  print('');
  print('═'.repeat(60), 'gray');

  if (report.deploymentReady) {
    print('✅ READY FOR DEPLOYMENT', 'green');
  } else {
    print(report.summary, 'red');
  }

  print('═'.repeat(60), 'gray');
  print('');

  // List failed checks
  if (report.failed > 0) {
    print('❌ Failed Checks:', 'red');
    results
      .filter((r) => r.status === 'fail')
      .forEach((r) => {
        const severityIcon =
          r.severity === 'blocker' ? '🔴' : r.severity === 'critical' ? '🟡' : r.severity === 'important' ? '🟢' : '🔵';
        print(`   ${severityIcon} ${r.category}: ${r.check}`, 'red');
        print(`      ${r.message}`, 'gray');
      });
    print('');
  }

  // List warnings
  if (report.warnings > 0) {
    print('⚠️  Warnings:', 'yellow');
    results
      .filter((r) => r.status === 'warn')
      .forEach((r) => {
        print(`   ${r.category}: ${r.check}`, 'yellow');
        print(`      ${r.message}`, 'gray');
      });
    print('');
  }
}

/**
 * Save report to file
 */
async function saveReport(report: ValidationReport): Promise<void> {
  const reportDir = path.join(process.cwd(), '.deploy');
  if (!existsSync(reportDir)) {
    await fs.mkdir(reportDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = path.join(reportDir, `validation-${timestamp}.json`);

  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  print(`\n📄 Report saved to: ${reportPath}`, 'blue');

  // Also save as latest
  const latestPath = path.join(reportDir, 'validation-latest.json');
  await fs.writeFile(latestPath, JSON.stringify(report, null, 2));
}

/**
 * Main validation function
 */
async function validate(options: { quick?: boolean; report?: boolean } = {}): Promise<void> {
  print('\n🚀 Production Deployment Validation', 'blue');
  print('═'.repeat(60), 'gray');
  print('');

  const startTime = Date.now();

  await validateEnvironmentVariables();
  await validateDatabase();
  await validateRedis();
  await validateExternalServices();
  await validateSecurity();
  await validateBuild();
  await validateTests(options.quick || false);

  const duration = Date.now() - startTime;
  const report = generateReport();

  printSummary(report);

  print(`⏱️  Validation completed in ${(duration / 1000).toFixed(2)}s`, 'gray');
  print('');

  if (options.report) {
    await saveReport(report);
  }

  // Exit with appropriate code
  process.exit(report.deploymentReady ? 0 : 1);
}

/**
 * CLI
 */
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Production Deployment Validation

Usage:
  tsx src/scripts/deploy-validate.ts              - Full validation
  tsx src/scripts/deploy-validate.ts --quick      - Quick validation (no tests)
  tsx src/scripts/deploy-validate.ts --report     - Generate report file
  tsx src/scripts/deploy-validate.ts --help       - Show this help

Options:
  --quick    Skip time-consuming checks (tests)
  --report   Save validation report to .deploy/validation-latest.json
  --help     Show this help message

Exit Codes:
  0 - All checks passed, ready for deployment
  1 - Some checks failed, not ready for deployment
  `);
  process.exit(0);
}

const options = {
  quick: args.includes('--quick'),
  report: args.includes('--report'),
};

validate(options).catch((error) => {
  console.error('Validation error:', error);
  process.exit(1);
});
