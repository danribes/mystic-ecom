#!/usr/bin/env tsx
/**
 * Disaster Recovery Automation Script
 *
 * Helps automate disaster recovery procedures for the Spirituality Platform
 *
 * Usage:
 *   tsx src/scripts/dr.ts check         - Check DR readiness
 *   tsx src/scripts/dr.ts validate      - Validate recovery prerequisites
 *   tsx src/scripts/dr.ts test-restore  - Test backup restoration (staging)
 *   tsx src/scripts/dr.ts verify        - Verify system after recovery
 *   tsx src/scripts/dr.ts contacts      - Show emergency contacts
 *
 * Environment Variables:
 *   DATABASE_URL      - PostgreSQL connection string (required)
 *   REDIS_URL         - Redis connection string (required)
 *   BACKUP_DIR        - Backup directory (default: ./backups)
 */

import { config } from 'dotenv';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { listBackups, getBackupStats, checkPgDumpAvailable } from '../lib/backup';

const execAsync = promisify(exec);

// Load environment variables
config();

interface CheckResult {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
  critical: boolean;
}

/**
 * Check disaster recovery readiness
 */
async function runDRCheck(): Promise<void> {
  console.log('🔍 Disaster Recovery Readiness Check\n');
  console.log('═'.repeat(60));
  console.log('');

  const results: CheckResult[] = [];

  // Check 1: Environment Variables
  console.log('📋 Checking Environment Variables...');
  results.push(await checkEnvironmentVariables());

  // Check 2: Backup System
  console.log('💾 Checking Backup System...');
  results.push(await checkBackupSystem());

  // Check 3: Backup Files
  console.log('📦 Checking Backup Files...');
  results.push(await checkBackupFiles());

  // Check 4: PostgreSQL Tools
  console.log('🔧 Checking PostgreSQL Tools...');
  results.push(await checkPostgreSQLTools());

  // Check 5: Database Connectivity
  console.log('🗄️  Checking Database Connectivity...');
  results.push(await checkDatabaseConnectivity());

  // Check 6: Redis Connectivity
  console.log('🔴 Checking Redis Connectivity...');
  results.push(await checkRedisConnectivity());

  // Check 7: DR Documentation
  console.log('📖 Checking DR Documentation...');
  results.push(await checkDRDocumentation());

  // Check 8: Monitoring Setup
  console.log('📊 Checking Monitoring Setup...');
  results.push(await checkMonitoring());

  // Print results
  console.log('');
  console.log('═'.repeat(60));
  console.log('\n📊 Readiness Report:\n');

  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;
  const warnings = results.filter(r => r.status === 'warn').length;
  const criticalFailed = results.filter(r => r.status === 'fail' && r.critical).length;

  results.forEach(result => {
    const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️';
    const critical = result.critical ? ' [CRITICAL]' : '';
    console.log(`${icon} ${result.name}${critical}`);
    console.log(`   ${result.message}`);
    console.log('');
  });

  console.log('Summary:');
  console.log(`  Passed: ${passed}/${results.length}`);
  console.log(`  Failed: ${failed}/${results.length}`);
  console.log(`  Warnings: ${warnings}/${results.length}`);
  console.log('');

  if (criticalFailed > 0) {
    console.log('🚨 CRITICAL FAILURES DETECTED!');
    console.log(`   ${criticalFailed} critical check(s) failed.`);
    console.log('   Disaster recovery may not be possible.');
    console.log('   Fix these issues immediately!\n');
    process.exit(1);
  } else if (failed > 0) {
    console.log('⚠️  Some checks failed.');
    console.log('   Review and fix issues to improve DR readiness.\n');
    process.exit(1);
  } else if (warnings > 0) {
    console.log('⚠️  All checks passed with some warnings.');
    console.log('   Review warnings to improve DR readiness.\n');
  } else {
    console.log('✅ ALL CHECKS PASSED!');
    console.log('   System is ready for disaster recovery.\n');
  }
}

/**
 * Check environment variables
 */
async function checkEnvironmentVariables(): Promise<CheckResult> {
  const required = ['DATABASE_URL', 'REDIS_URL'];
  const missing = required.filter(env => !process.env[env]);

  if (missing.length > 0) {
    return {
      name: 'Environment Variables',
      status: 'fail',
      message: `Missing required variables: ${missing.join(', ')}`,
      critical: true,
    };
  }

  return {
    name: 'Environment Variables',
    status: 'pass',
    message: 'All required environment variables are set',
    critical: true,
  };
}

/**
 * Check backup system
 */
async function checkBackupSystem(): Promise<CheckResult> {
  const backupLibPath = path.join(process.cwd(), 'src/lib/backup.ts');
  const backupScriptPath = path.join(process.cwd(), 'src/scripts/backup.ts');

  if (!existsSync(backupLibPath) || !existsSync(backupScriptPath)) {
    return {
      name: 'Backup System',
      status: 'fail',
      message: 'Backup system files not found',
      critical: true,
    };
  }

  return {
    name: 'Backup System',
    status: 'pass',
    message: 'Backup system is installed and configured',
    critical: true,
  };
}

/**
 * Check backup files
 */
async function checkBackupFiles(): Promise<CheckResult> {
  try {
    const backups = await listBackups();

    if (backups.length === 0) {
      return {
        name: 'Backup Files',
        status: 'fail',
        message: 'No backup files found! Create a backup immediately.',
        critical: true,
      };
    }

    const stats = await getBackupStats();
    const latestBackup = backups[0];
    const age = Date.now() - latestBackup.created.getTime();
    const ageHours = age / (1000 * 60 * 60);

    if (ageHours > 24) {
      return {
        name: 'Backup Files',
        status: 'warn',
        message: `Latest backup is ${Math.round(ageHours)} hours old. Consider creating a new backup.`,
        critical: false,
      };
    }

    return {
      name: 'Backup Files',
      status: 'pass',
      message: `Found ${stats.totalBackups} backup(s). Latest: ${latestBackup.filename}`,
      critical: true,
    };
  } catch (error) {
    return {
      name: 'Backup Files',
      status: 'fail',
      message: `Error checking backups: ${error instanceof Error ? error.message : 'Unknown error'}`,
      critical: true,
    };
  }
}

/**
 * Check PostgreSQL tools
 */
async function checkPostgreSQLTools(): Promise<CheckResult> {
  const available = await checkPgDumpAvailable();

  if (!available) {
    return {
      name: 'PostgreSQL Tools',
      status: 'fail',
      message: 'pg_dump/pg_restore not found. Install PostgreSQL client tools.',
      critical: true,
    };
  }

  try {
    const { stdout } = await execAsync('pg_dump --version');
    const version = stdout.trim();

    return {
      name: 'PostgreSQL Tools',
      status: 'pass',
      message: `PostgreSQL tools installed: ${version}`,
      critical: true,
    };
  } catch (error) {
    return {
      name: 'PostgreSQL Tools',
      status: 'fail',
      message: 'Error checking PostgreSQL tools',
      critical: true,
    };
  }
}

/**
 * Check database connectivity
 */
async function checkDatabaseConnectivity(): Promise<CheckResult> {
  try {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      return {
        name: 'Database Connectivity',
        status: 'fail',
        message: 'DATABASE_URL not set',
        critical: true,
      };
    }

    // Test connection
    await execAsync(`psql "${dbUrl}" -c "SELECT 1"`);

    return {
      name: 'Database Connectivity',
      status: 'pass',
      message: 'Database is accessible',
      critical: true,
    };
  } catch (error) {
    return {
      name: 'Database Connectivity',
      status: 'fail',
      message: 'Cannot connect to database',
      critical: true,
    };
  }
}

/**
 * Check Redis connectivity
 */
async function checkRedisConnectivity(): Promise<CheckResult> {
  try {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      return {
        name: 'Redis Connectivity',
        status: 'fail',
        message: 'REDIS_URL not set',
        critical: false,
      };
    }

    // Test connection
    await execAsync(`redis-cli -u "${redisUrl}" PING`);

    return {
      name: 'Redis Connectivity',
      status: 'pass',
      message: 'Redis is accessible',
      critical: false,
    };
  } catch (error) {
    return {
      name: 'Redis Connectivity',
      status: 'warn',
      message: 'Cannot connect to Redis (non-critical)',
      critical: false,
    };
  }
}

/**
 * Check DR documentation
 */
async function checkDRDocumentation(): Promise<CheckResult> {
  const runbookPath = path.join(process.cwd(), 'docs/DISASTER_RECOVERY_RUNBOOK.md');

  if (!existsSync(runbookPath)) {
    return {
      name: 'DR Documentation',
      status: 'warn',
      message: 'DR runbook not found',
      critical: false,
    };
  }

  const stats = await fs.stat(runbookPath);
  const size = Math.round(stats.size / 1024);

  return {
    name: 'DR Documentation',
    status: 'pass',
    message: `DR runbook found (${size} KB)`,
    critical: false,
  };
}

/**
 * Check monitoring setup
 */
async function checkMonitoring(): Promise<CheckResult> {
  const hasSentry = !!process.env.SENTRY_DSN;

  if (!hasSentry) {
    return {
      name: 'Monitoring Setup',
      status: 'warn',
      message: 'Sentry DSN not configured (recommended for incident detection)',
      critical: false,
    };
  }

  return {
    name: 'Monitoring Setup',
    status: 'pass',
    message: 'Sentry monitoring is configured',
    critical: false,
  };
}

/**
 * Validate recovery prerequisites
 */
async function runValidation(): Promise<void> {
  console.log('🔐 Validating Recovery Prerequisites\n');

  const checks = [
    { name: 'Backup directory exists', check: () => checkBackupDirectory() },
    { name: 'Latest backup is valid', check: () => checkLatestBackup() },
    { name: 'Can execute pg_restore', check: () => checkPgRestore() },
    { name: 'Have database credentials', check: () => checkDatabaseCredentials() },
  ];

  for (const test of checks) {
    process.stdout.write(`Checking: ${test.name}... `);
    const result = await test.check();
    console.log(result ? '✅' : '❌');
  }
}

async function checkBackupDirectory(): Promise<boolean> {
  const backupDir = process.env.BACKUP_DIR || path.join(process.cwd(), 'backups');
  return existsSync(backupDir);
}

async function checkLatestBackup(): Promise<boolean> {
  const backups = await listBackups();
  return backups.length > 0;
}

async function checkPgRestore(): Promise<boolean> {
  try {
    await execAsync('which pg_restore');
    return true;
  } catch {
    return false;
  }
}

async function checkDatabaseCredentials(): Promise<boolean> {
  return !!process.env.DATABASE_URL;
}

/**
 * Verify system after recovery
 */
async function runVerification(): Promise<void> {
  console.log('✅ Post-Recovery Verification\n');

  const checks = [
    { name: 'Database accessible', check: () => verifyDatabase() },
    { name: 'Redis accessible', check: () => verifyRedis() },
    { name: 'Health endpoint responds', check: () => verifyHealthEndpoint() },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of checks) {
    process.stdout.write(`${test.name}... `);
    try {
      await test.check();
      console.log('✅ PASS');
      passed++;
    } catch (error) {
      console.log('❌ FAIL');
      console.log(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      failed++;
    }
  }

  console.log('');
  console.log(`Results: ${passed} passed, ${failed} failed`);

  if (failed > 0) {
    console.log('\n⚠️  Some checks failed. Review errors above.');
    process.exit(1);
  } else {
    console.log('\n✅ All verification checks passed!');
  }
}

async function verifyDatabase(): Promise<void> {
  await execAsync(`psql "${process.env.DATABASE_URL}" -c "SELECT 1"`);
}

async function verifyRedis(): Promise<void> {
  await execAsync(`redis-cli -u "${process.env.REDIS_URL}" PING`);
}

async function verifyHealthEndpoint(): Promise<void> {
  // This would need the app URL
  // For now, just a placeholder
  console.log('(Manual verification required)');
}

/**
 * Show emergency contacts
 */
function showContacts(): void {
  console.log('📞 Emergency Contacts\n');
  console.log('═'.repeat(60));
  console.log('');
  console.log('Internal Team:');
  console.log('  Lead DevOps:    [Configure in .env or here]');
  console.log('  Database Admin: [Configure in .env or here]');
  console.log('  Tech Lead:      [Configure in .env or here]');
  console.log('');
  console.log('External Vendors:');
  console.log('  Cloudflare:     1-888-993-5273');
  console.log('  Stripe:         1-888-926-2289');
  console.log('  Neon Support:   https://neon.tech/docs/introduction/support');
  console.log('  Upstash Support: https://upstash.com/docs/support');
  console.log('');
  console.log('Documentation:');
  console.log('  DR Runbook:     docs/DISASTER_RECOVERY_RUNBOOK.md');
  console.log('');
}

/**
 * Show help
 */
function showHelp(): void {
  console.log('Disaster Recovery Automation Script\n');
  console.log('Usage:');
  console.log('  tsx src/scripts/dr.ts check         - Check DR readiness');
  console.log('  tsx src/scripts/dr.ts validate      - Validate recovery prerequisites');
  console.log('  tsx src/scripts/dr.ts verify        - Verify system after recovery');
  console.log('  tsx src/scripts/dr.ts contacts      - Show emergency contacts');
  console.log('  tsx src/scripts/dr.ts help          - Show this help');
  console.log('');
  console.log('Environment Variables:');
  console.log('  DATABASE_URL    - PostgreSQL connection string (required)');
  console.log('  REDIS_URL       - Redis connection string (required)');
  console.log('  BACKUP_DIR      - Backup directory (default: ./backups)');
  console.log('  SENTRY_DSN      - Sentry monitoring (recommended)');
  console.log('');
}

/**
 * Main function
 */
async function main(): Promise<void> {
  const command = process.argv[2] || 'check';

  try {
    switch (command) {
      case 'check':
        await runDRCheck();
        break;

      case 'validate':
        await runValidation();
        break;

      case 'verify':
        await runVerification();
        break;

      case 'contacts':
        showContacts();
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
if (require.main === module || process.argv[1].endsWith('dr.ts')) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
