#!/usr/bin/env tsx
/**
 * User Acceptance Testing (UAT) Management Script
 *
 * Manages UAT test execution, tracking, and reporting
 *
 * Usage:
 *   tsx src/scripts/uat.ts init           - Initialize UAT session
 *   tsx src/scripts/uat.ts run            - Run automated UAT checks
 *   tsx src/scripts/uat.ts report         - Generate UAT report
 *   tsx src/scripts/uat.ts status         - Show UAT status
 *   tsx src/scripts/uat.ts results        - View test results
 *   tsx src/scripts/uat.ts help           - Show this help
 *
 * Environment Variables:
 *   UAT_ENVIRONMENT   - Test environment URL (default: staging)
 *   UAT_TESTER_NAME   - Name of tester
 *   UAT_TESTER_EMAIL  - Email of tester
 */

import { config } from 'dotenv';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const execAsync = promisify(exec);

// Load environment variables
config({ path: '.env.staging' });
config();

interface TestScenario {
  id: string;
  name: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  status: 'pending' | 'pass' | 'fail' | 'blocked' | 'skipped';
  notes?: string;
  tester?: string;
  timestamp?: string;
}

interface UATSession {
  id: string;
  startDate: string;
  endDate?: string;
  environment: string;
  tester: {
    name: string;
    email: string;
  };
  scenarios: TestScenario[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    blocked: number;
    skipped: number;
    pending: number;
  };
}

interface AutomatedCheck {
  name: string;
  check: () => Promise<boolean>;
  category: string;
}

const UAT_DIR = path.join(process.cwd(), '.uat');
const SESSIONS_DIR = path.join(UAT_DIR, 'sessions');
const CURRENT_SESSION_FILE = path.join(UAT_DIR, 'current-session.json');

/**
 * Initialize UAT session
 */
async function initUAT(): Promise<void> {
  console.log('🧪 Initializing UAT Session\n');
  console.log('═'.repeat(60));
  console.log('');

  // Create UAT directories
  if (!existsSync(UAT_DIR)) {
    await fs.mkdir(UAT_DIR, { recursive: true });
  }
  if (!existsSync(SESSIONS_DIR)) {
    await fs.mkdir(SESSIONS_DIR, { recursive: true });
  }

  // Get tester information
  const testerName = process.env.UAT_TESTER_NAME || 'UAT Tester';
  const testerEmail = process.env.UAT_TESTER_EMAIL || 'uat@example.com';
  const environment = process.env.UAT_ENVIRONMENT || process.env.PUBLIC_SITE_URL || 'staging';

  // Create session
  const sessionId = `uat-${Date.now()}`;
  const session: UATSession = {
    id: sessionId,
    startDate: new Date().toISOString(),
    environment,
    tester: {
      name: testerName,
      email: testerEmail,
    },
    scenarios: getDefaultScenarios(),
    summary: {
      total: 0,
      passed: 0,
      failed: 0,
      blocked: 0,
      skipped: 0,
      pending: 0,
    },
  };

  // Calculate summary
  session.summary.total = session.scenarios.length;
  session.summary.pending = session.scenarios.filter(s => s.status === 'pending').length;

  // Save session
  await fs.writeFile(
    path.join(SESSIONS_DIR, `${sessionId}.json`),
    JSON.stringify(session, null, 2)
  );
  await fs.writeFile(
    CURRENT_SESSION_FILE,
    JSON.stringify({ sessionId }, null, 2)
  );

  console.log('✅ UAT Session Created\n');
  console.log(`Session ID: ${sessionId}`);
  console.log(`Tester: ${testerName} <${testerEmail}>`);
  console.log(`Environment: ${environment}`);
  console.log(`Total Scenarios: ${session.summary.total}`);
  console.log('');
  console.log('Next Steps:');
  console.log('  1. Run automated checks: npm run uat:run');
  console.log('  2. Execute manual tests: See docs/UAT_TEST_SCENARIOS.md');
  console.log('  3. Generate report: npm run uat:report');
  console.log('');
}

/**
 * Get default test scenarios
 */
function getDefaultScenarios(): TestScenario[] {
  return [
    {
      id: 'CUJ-001',
      name: 'New User Registration',
      priority: 'critical',
      category: 'User Management',
      status: 'pending',
    },
    {
      id: 'CUJ-002',
      name: 'User Login',
      priority: 'critical',
      category: 'Authentication',
      status: 'pending',
    },
    {
      id: 'CUJ-003',
      name: 'Browse and View Products',
      priority: 'critical',
      category: 'Core Features',
      status: 'pending',
    },
    {
      id: 'CUJ-004',
      name: 'Add to Cart and Checkout',
      priority: 'critical',
      category: 'E-commerce',
      status: 'pending',
    },
    {
      id: 'CUJ-005',
      name: 'User Profile Management',
      priority: 'high',
      category: 'User Management',
      status: 'pending',
    },
    {
      id: 'CUJ-006',
      name: 'Password Reset',
      priority: 'high',
      category: 'Authentication',
      status: 'pending',
    },
    {
      id: 'CUJ-007',
      name: 'Search Functionality',
      priority: 'high',
      category: 'Core Features',
      status: 'pending',
    },
    {
      id: 'CUJ-008',
      name: 'Video Playback',
      priority: 'high',
      category: 'Media',
      status: 'pending',
    },
    {
      id: 'CUJ-009',
      name: 'Admin Dashboard',
      priority: 'high',
      category: 'Admin',
      status: 'pending',
    },
    {
      id: 'CUJ-010',
      name: 'Logout',
      priority: 'medium',
      category: 'Authentication',
      status: 'pending',
    },
  ];
}

/**
 * Run automated UAT checks
 */
async function runUAT(): Promise<void> {
  console.log('🤖 Running Automated UAT Checks\n');
  console.log('═'.repeat(60));
  console.log('');

  const checks: AutomatedCheck[] = [
    {
      name: 'Environment Health',
      check: checkEnvironmentHealth,
      category: 'Infrastructure',
    },
    {
      name: 'API Endpoints',
      check: checkAPIEndpoints,
      category: 'Backend',
    },
    {
      name: 'Database Connectivity',
      check: checkDatabaseConnection,
      category: 'Database',
    },
    {
      name: 'Authentication System',
      check: checkAuthentication,
      category: 'Security',
    },
    {
      name: 'Payment Integration',
      check: checkPaymentIntegration,
      category: 'E-commerce',
    },
    {
      name: 'Email Service',
      check: checkEmailService,
      category: 'Communications',
    },
    {
      name: 'Performance Metrics',
      check: checkPerformance,
      category: 'Performance',
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const check of checks) {
    process.stdout.write(`${check.name}... `);
    try {
      const result = await check.check();
      if (result) {
        console.log('✅ PASS');
        passed++;
      } else {
        console.log('❌ FAIL');
        failed++;
      }
    } catch (error) {
      console.log(`❌ FAIL (${error instanceof Error ? error.message : 'Error'})`);
      failed++;
    }
  }

  console.log('');
  console.log('═'.repeat(60));
  console.log(`\nAutomated Checks: ${passed} passed, ${failed} failed\n`);

  if (failed > 0) {
    console.log('⚠️  Some automated checks failed.');
    console.log('   Review failures before manual testing.\n');
    process.exit(1);
  } else {
    console.log('✅ All automated checks passed!');
    console.log('   Proceed with manual testing.\n');
  }
}

/**
 * Check environment health
 */
async function checkEnvironmentHealth(): Promise<boolean> {
  try {
    const result = await execAsync('tsx src/scripts/staging-health.ts --json');
    const health = JSON.parse(result.stdout);
    return health.overall === 'healthy';
  } catch {
    return false;
  }
}

/**
 * Check API endpoints
 */
async function checkAPIEndpoints(): Promise<boolean> {
  try {
    const siteUrl = process.env.PUBLIC_SITE_URL || process.env.CF_PAGES_URL;
    if (!siteUrl) return false;

    const response = await fetch(`${siteUrl}/api/health`, { signal: AbortSignal.timeout(5000) });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Check database connection
 */
async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) return false;

    await execAsync(`psql "${dbUrl}" -c "SELECT 1"`, { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Check authentication system
 */
async function checkAuthentication(): Promise<boolean> {
  // Check if auth-related files exist
  const authFiles = [
    'src/middleware/auth.ts',
    'src/lib/auth.ts',
  ];

  for (const file of authFiles) {
    if (!existsSync(path.join(process.cwd(), file))) {
      return false;
    }
  }

  return true;
}

/**
 * Check payment integration
 */
async function checkPaymentIntegration(): Promise<boolean> {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) return false;

  // Check if using test mode
  if (!stripeKey.startsWith('sk_test_')) {
    console.warn('\n⚠️  Warning: Not using Stripe test mode');
  }

  return true;
}

/**
 * Check email service
 */
async function checkEmailService(): Promise<boolean> {
  const resendKey = process.env.RESEND_API_KEY;
  return !!resendKey;
}

/**
 * Check performance
 */
async function checkPerformance(): Promise<boolean> {
  try {
    const siteUrl = process.env.PUBLIC_SITE_URL || process.env.CF_PAGES_URL;
    if (!siteUrl) return false;

    const start = Date.now();
    const response = await fetch(siteUrl, { signal: AbortSignal.timeout(5000) });
    const duration = Date.now() - start;

    // Should load within 3 seconds
    return response.ok && duration < 3000;
  } catch {
    return false;
  }
}

/**
 * Generate UAT report
 */
async function generateReport(): Promise<void> {
  console.log('📊 Generating UAT Report\n');

  // Load current session
  if (!existsSync(CURRENT_SESSION_FILE)) {
    console.error('❌ No active UAT session. Run "npm run uat:init" first.');
    process.exit(1);
  }

  const { sessionId } = JSON.parse(await fs.readFile(CURRENT_SESSION_FILE, 'utf-8'));
  const sessionFile = path.join(SESSIONS_DIR, `${sessionId}.json`);

  if (!existsSync(sessionFile)) {
    console.error(`❌ Session file not found: ${sessionId}`);
    process.exit(1);
  }

  const session: UATSession = JSON.parse(await fs.readFile(sessionFile, 'utf-8'));

  // Update summary
  session.summary.passed = session.scenarios.filter(s => s.status === 'pass').length;
  session.summary.failed = session.scenarios.filter(s => s.status === 'fail').length;
  session.summary.blocked = session.scenarios.filter(s => s.status === 'blocked').length;
  session.summary.skipped = session.scenarios.filter(s => s.status === 'skipped').length;
  session.summary.pending = session.scenarios.filter(s => s.status === 'pending').length;

  // Generate report
  const report = generateReportMarkdown(session);

  // Save report
  const reportFile = path.join(UAT_DIR, `report-${sessionId}.md`);
  await fs.writeFile(reportFile, report);

  console.log('✅ UAT Report Generated\n');
  console.log(`Report saved to: ${reportFile}`);
  console.log('');

  // Print summary
  printSummary(session);
}

/**
 * Generate report markdown
 */
function generateReportMarkdown(session: UATSession): string {
  const passRate = ((session.summary.passed / session.summary.total) * 100).toFixed(1);

  return `# UAT Report

**Session ID**: ${session.id}
**Date**: ${new Date(session.startDate).toLocaleDateString()}
**Tester**: ${session.tester.name} <${session.tester.email}>
**Environment**: ${session.environment}

---

## Summary

**Total Tests**: ${session.summary.total}
**Passed**: ${session.summary.passed} (${passRate}%)
**Failed**: ${session.summary.failed}
**Blocked**: ${session.summary.blocked}
**Skipped**: ${session.summary.skipped}
**Pending**: ${session.summary.pending}

## Test Results by Category

${generateCategoryBreakdown(session)}

## Detailed Results

${generateDetailedResults(session)}

## Recommendation

${generateRecommendation(session)}

---

**Generated**: ${new Date().toISOString()}
`;
}

/**
 * Generate category breakdown
 */
function generateCategoryBreakdown(session: UATSession): string {
  const categories = new Set(session.scenarios.map(s => s.category));
  let markdown = '';

  for (const category of categories) {
    const scenarios = session.scenarios.filter(s => s.category === category);
    const passed = scenarios.filter(s => s.status === 'pass').length;
    const total = scenarios.length;

    markdown += `### ${category}\n`;
    markdown += `- Tests: ${total}\n`;
    markdown += `- Passed: ${passed}/${total}\n`;
    markdown += `- Status: ${passed === total ? '✅ Complete' : '⏳ In Progress'}\n\n`;
  }

  return markdown;
}

/**
 * Generate detailed results
 */
function generateDetailedResults(session: UATSession): string {
  let markdown = '';

  for (const scenario of session.scenarios) {
    const icon = getStatusIcon(scenario.status);
    markdown += `### ${icon} ${scenario.id}: ${scenario.name}\n`;
    markdown += `- **Priority**: ${scenario.priority}\n`;
    markdown += `- **Category**: ${scenario.category}\n`;
    markdown += `- **Status**: ${scenario.status}\n`;
    if (scenario.tester) {
      markdown += `- **Tester**: ${scenario.tester}\n`;
    }
    if (scenario.notes) {
      markdown += `- **Notes**: ${scenario.notes}\n`;
    }
    markdown += '\n';
  }

  return markdown;
}

/**
 * Generate recommendation
 */
function generateRecommendation(session: UATSession): string {
  const { passed, failed, blocked, total } = session.summary;
  const passRate = (passed / total) * 100;

  if (failed === 0 && blocked === 0 && passRate === 100) {
    return '**✅ PASS** - All tests passed. Ready for production deployment.';
  } else if (failed === 0 && blocked === 0 && passRate >= 90) {
    return '**✅ PASS WITH MINOR ISSUES** - Can proceed to production. Address remaining tests post-launch.';
  } else if (failed > 0 || blocked > 0) {
    return `**❌ FAIL** - ${failed} tests failed, ${blocked} blocked. Requires fixes before production deployment.`;
  } else {
    return '**⏳ IN PROGRESS** - Testing not complete. Continue testing before making recommendation.';
  }
}

/**
 * Get status icon
 */
function getStatusIcon(status: string): string {
  switch (status) {
    case 'pass':
      return '✅';
    case 'fail':
      return '❌';
    case 'blocked':
      return '🚫';
    case 'skipped':
      return '⏭️';
    case 'pending':
      return '⏳';
    default:
      return '❓';
  }
}

/**
 * Show UAT status
 */
async function showStatus(): Promise<void> {
  console.log('📋 UAT Status\n');

  if (!existsSync(CURRENT_SESSION_FILE)) {
    console.log('No active UAT session.');
    console.log('Run "npm run uat:init" to start a session.\n');
    return;
  }

  const { sessionId } = JSON.parse(await fs.readFile(CURRENT_SESSION_FILE, 'utf-8'));
  const sessionFile = path.join(SESSIONS_DIR, `${sessionId}.json`);

  if (!existsSync(sessionFile)) {
    console.log(`Session file not found: ${sessionId}\n`);
    return;
  }

  const session: UATSession = JSON.parse(await fs.readFile(sessionFile, 'utf-8'));

  // Update summary
  session.summary.passed = session.scenarios.filter(s => s.status === 'pass').length;
  session.summary.failed = session.scenarios.filter(s => s.status === 'fail').length;
  session.summary.blocked = session.scenarios.filter(s => s.status === 'blocked').length;
  session.summary.skipped = session.scenarios.filter(s => s.status === 'skipped').length;
  session.summary.pending = session.scenarios.filter(s => s.status === 'pending').length;

  printSummary(session);
}

/**
 * Print summary
 */
function printSummary(session: UATSession): void {
  console.log('Session Information:');
  console.log(`  ID: ${session.id}`);
  console.log(`  Started: ${new Date(session.startDate).toLocaleString()}`);
  console.log(`  Tester: ${session.tester.name}`);
  console.log(`  Environment: ${session.environment}`);
  console.log('');

  console.log('Test Summary:');
  console.log(`  Total: ${session.summary.total}`);
  console.log(`  ✅ Passed: ${session.summary.passed}`);
  console.log(`  ❌ Failed: ${session.summary.failed}`);
  console.log(`  🚫 Blocked: ${session.summary.blocked}`);
  console.log(`  ⏭️  Skipped: ${session.summary.skipped}`);
  console.log(`  ⏳ Pending: ${session.summary.pending}`);
  console.log('');

  const passRate = session.summary.total > 0
    ? ((session.summary.passed / session.summary.total) * 100).toFixed(1)
    : '0.0';
  console.log(`Pass Rate: ${passRate}%`);
  console.log('');
}

/**
 * Show help
 */
function showHelp(): void {
  console.log('UAT Management Script\n');
  console.log('Usage:');
  console.log('  tsx src/scripts/uat.ts init     - Initialize UAT session');
  console.log('  tsx src/scripts/uat.ts run      - Run automated UAT checks');
  console.log('  tsx src/scripts/uat.ts report   - Generate UAT report');
  console.log('  tsx src/scripts/uat.ts status   - Show UAT status');
  console.log('  tsx src/scripts/uat.ts help     - Show this help');
  console.log('');
  console.log('Environment Variables:');
  console.log('  UAT_ENVIRONMENT     - Test environment URL');
  console.log('  UAT_TESTER_NAME     - Name of tester');
  console.log('  UAT_TESTER_EMAIL    - Email of tester');
  console.log('');
}

/**
 * Main function
 */
async function main(): Promise<void> {
  const command = process.argv[2] || 'status';

  try {
    switch (command) {
      case 'init':
        await initUAT();
        break;

      case 'run':
        await runUAT();
        break;

      case 'report':
        await generateReport();
        break;

      case 'status':
        await showStatus();
        break;

      case 'help':
      case '--help':
      case '-h':
        showHelp();
        break;

      default:
        console.error(`Unknown command: ${command}`);
        console.log('');
        showHelp();
        process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Run main function if this script is executed directly
if (require.main === module || process.argv[1].endsWith('uat.ts')) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { initUAT, runUAT, generateReport, showStatus };
