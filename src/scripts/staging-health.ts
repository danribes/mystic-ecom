#!/usr/bin/env tsx
/**
 * Staging Environment Health Check Script
 *
 * Performs comprehensive health checks on staging environment
 *
 * Usage:
 *   tsx src/scripts/staging-health.ts                    - Run all health checks
 *   tsx src/scripts/staging-health.ts --watch            - Run checks continuously
 *   tsx src/scripts/staging-health.ts --json             - Output JSON format
 *   tsx src/scripts/staging-health.ts --component=db     - Check specific component
 *
 * Components:
 *   db          - Database health
 *   redis       - Redis health
 *   api         - API endpoints
 *   external    - External services
 *   storage     - Storage and backups
 */

import { config } from 'dotenv';
import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync } from 'fs';
import path from 'path';

const execAsync = promisify(exec);

// Load environment variables
config({ path: '.env.staging' });
config();

interface HealthCheck {
  component: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  message: string;
  details?: any;
  duration: number;
  timestamp: string;
}

interface HealthReport {
  overall: 'healthy' | 'unhealthy' | 'degraded';
  checks: HealthCheck[];
  timestamp: string;
  environment: string;
  duration: number;
}

/**
 * Check database health
 */
async function checkDatabase(): Promise<HealthCheck> {
  const start = Date.now();
  const component = 'Database';

  try {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      return {
        component,
        status: 'unhealthy',
        message: 'DATABASE_URL not configured',
        duration: Date.now() - start,
        timestamp: new Date().toISOString(),
      };
    }

    // Test connection
    await execAsync(`psql "${dbUrl}" -c "SELECT 1"`, { timeout: 5000 });

    // Check query performance
    const queryStart = Date.now();
    await execAsync(`psql "${dbUrl}" -c "SELECT COUNT(*) FROM pg_stat_activity"`);
    const queryDuration = Date.now() - queryStart;

    // Get connection count
    const { stdout } = await execAsync(`psql "${dbUrl}" -c "SELECT COUNT(*) FROM pg_stat_activity"`);
    const lines = stdout.trim().split('\n');
    const connections = parseInt(lines[2].trim(), 10);

    const status = queryDuration > 1000 ? 'degraded' : 'healthy';

    return {
      component,
      status,
      message: status === 'healthy' ? 'Database is healthy' : 'Database response is slow',
      details: {
        queryDuration: `${queryDuration}ms`,
        connections,
      },
      duration: Date.now() - start,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      component,
      status: 'unhealthy',
      message: `Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      duration: Date.now() - start,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Check Redis health
 */
async function checkRedis(): Promise<HealthCheck> {
  const start = Date.now();
  const component = 'Redis';

  try {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      return {
        component,
        status: 'degraded',
        message: 'REDIS_URL not configured (non-critical)',
        duration: Date.now() - start,
        timestamp: new Date().toISOString(),
      };
    }

    // Test connection
    await execAsync(`redis-cli -u "${redisUrl}" PING`, { timeout: 5000 });

    // Test write/read performance
    const perfStart = Date.now();
    await execAsync(`redis-cli -u "${redisUrl}" SET health:check "ok"`);
    await execAsync(`redis-cli -u "${redisUrl}" GET health:check`);
    await execAsync(`redis-cli -u "${redisUrl}" DEL health:check`);
    const perfDuration = Date.now() - perfStart;

    // Get memory info
    const { stdout } = await execAsync(`redis-cli -u "${redisUrl}" INFO memory`);
    const usedMemory = stdout.match(/used_memory_human:([^\r\n]+)/)?.[1]?.trim();

    const status = perfDuration > 500 ? 'degraded' : 'healthy';

    return {
      component,
      status,
      message: status === 'healthy' ? 'Redis is healthy' : 'Redis response is slow',
      details: {
        operationDuration: `${perfDuration}ms`,
        usedMemory,
      },
      duration: Date.now() - start,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      component,
      status: 'degraded',
      message: `Redis connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      duration: Date.now() - start,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Check API health
 */
async function checkAPI(): Promise<HealthCheck> {
  const start = Date.now();
  const component = 'API';

  try {
    const siteUrl = process.env.PUBLIC_SITE_URL || process.env.CF_PAGES_URL;
    if (!siteUrl) {
      return {
        component,
        status: 'degraded',
        message: 'Site URL not configured',
        duration: Date.now() - start,
        timestamp: new Date().toISOString(),
      };
    }

    // Check health endpoint
    const healthUrl = `${siteUrl}/api/health`;
    const healthStart = Date.now();

    try {
      const response = await fetch(healthUrl, { signal: AbortSignal.timeout(5000) });
      const healthDuration = Date.now() - healthStart;

      if (!response.ok) {
        return {
          component,
          status: 'unhealthy',
          message: `Health endpoint returned ${response.status}`,
          details: {
            url: healthUrl,
            status: response.status,
            duration: `${healthDuration}ms`,
          },
          duration: Date.now() - start,
          timestamp: new Date().toISOString(),
        };
      }

      const data = await response.json();
      const status = healthDuration > 2000 ? 'degraded' : 'healthy';

      return {
        component,
        status,
        message: status === 'healthy' ? 'API is healthy' : 'API response is slow',
        details: {
          url: healthUrl,
          duration: `${healthDuration}ms`,
          response: data,
        },
        duration: Date.now() - start,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        component,
        status: 'unhealthy',
        message: `Health endpoint unreachable: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: {
          url: healthUrl,
        },
        duration: Date.now() - start,
        timestamp: new Date().toISOString(),
      };
    }
  } catch (error) {
    return {
      component,
      status: 'degraded',
      message: `API check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      duration: Date.now() - start,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Check external services
 */
async function checkExternalServices(): Promise<HealthCheck> {
  const start = Date.now();
  const component = 'External Services';

  const services = [
    { name: 'Stripe', key: 'STRIPE_SECRET_KEY' },
    { name: 'Resend', key: 'RESEND_API_KEY' },
    { name: 'Sentry', key: 'SENTRY_DSN' },
    { name: 'Cloudflare Stream', key: 'CLOUDFLARE_ACCOUNT_ID' },
    { name: 'Twilio', key: 'TWILIO_ACCOUNT_SID' },
  ];

  const configured = services.filter(s => !!process.env[s.key]);
  const missing = services.filter(s => !process.env[s.key]);

  const status = configured.length >= 3 ? 'healthy' : configured.length > 0 ? 'degraded' : 'unhealthy';

  return {
    component,
    status,
    message: `${configured.length}/${services.length} services configured`,
    details: {
      configured: configured.map(s => s.name),
      missing: missing.map(s => s.name),
    },
    duration: Date.now() - start,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Check storage and backups
 */
async function checkStorage(): Promise<HealthCheck> {
  const start = Date.now();
  const component = 'Storage';

  try {
    const backupDir = process.env.BACKUP_DIR || path.join(process.cwd(), 'backups/staging');

    if (!existsSync(backupDir)) {
      return {
        component,
        status: 'degraded',
        message: 'Backup directory does not exist',
        details: {
          backupDir,
        },
        duration: Date.now() - start,
        timestamp: new Date().toISOString(),
      };
    }

    // Check if we have backup utilities
    const hasBackupLib = existsSync(path.join(process.cwd(), 'src/lib/backup.ts'));
    const hasBackupScript = existsSync(path.join(process.cwd(), 'src/scripts/backup.ts'));

    if (!hasBackupLib || !hasBackupScript) {
      return {
        component,
        status: 'degraded',
        message: 'Backup system not fully configured',
        details: {
          hasBackupLib,
          hasBackupScript,
        },
        duration: Date.now() - start,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      component,
      status: 'healthy',
      message: 'Storage and backup system configured',
      details: {
        backupDir,
        backupSystemReady: true,
      },
      duration: Date.now() - start,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      component,
      status: 'degraded',
      message: `Storage check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      duration: Date.now() - start,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Run all health checks
 */
async function runHealthChecks(component?: string): Promise<HealthReport> {
  const start = Date.now();

  const checks: HealthCheck[] = [];

  if (!component || component === 'db') {
    checks.push(await checkDatabase());
  }

  if (!component || component === 'redis') {
    checks.push(await checkRedis());
  }

  if (!component || component === 'api') {
    checks.push(await checkAPI());
  }

  if (!component || component === 'external') {
    checks.push(await checkExternalServices());
  }

  if (!component || component === 'storage') {
    checks.push(await checkStorage());
  }

  // Determine overall status
  const hasUnhealthy = checks.some(c => c.status === 'unhealthy');
  const hasDegraded = checks.some(c => c.status === 'degraded');

  const overall = hasUnhealthy ? 'unhealthy' : hasDegraded ? 'degraded' : 'healthy';

  return {
    overall,
    checks,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    duration: Date.now() - start,
  };
}

/**
 * Print health report
 */
function printHealthReport(report: HealthReport, format: 'text' | 'json'): void {
  if (format === 'json') {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  // Text format
  console.log('🏥 Staging Environment Health Check\n');
  console.log('═'.repeat(60));
  console.log('');
  console.log(`Environment: ${report.environment}`);
  console.log(`Timestamp: ${report.timestamp}`);
  console.log(`Overall Status: ${getStatusIcon(report.overall)} ${report.overall.toUpperCase()}`);
  console.log('');
  console.log('Component Checks:');
  console.log('');

  report.checks.forEach(check => {
    console.log(`${getStatusIcon(check.status)} ${check.component}`);
    console.log(`   Status: ${check.status}`);
    console.log(`   Message: ${check.message}`);
    console.log(`   Duration: ${check.duration}ms`);

    if (check.details) {
      console.log(`   Details: ${JSON.stringify(check.details, null, 2).split('\n').join('\n   ')}`);
    }

    console.log('');
  });

  console.log('═'.repeat(60));
  console.log(`Total Duration: ${report.duration}ms`);
  console.log('');

  if (report.overall === 'unhealthy') {
    console.log('❌ CRITICAL: One or more components are unhealthy');
    console.log('   Immediate action required!\n');
  } else if (report.overall === 'degraded') {
    console.log('⚠️  WARNING: One or more components are degraded');
    console.log('   Review and address issues.\n');
  } else {
    console.log('✅ All components are healthy\n');
  }
}

/**
 * Get status icon
 */
function getStatusIcon(status: 'healthy' | 'unhealthy' | 'degraded'): string {
  switch (status) {
    case 'healthy':
      return '✅';
    case 'degraded':
      return '⚠️';
    case 'unhealthy':
      return '❌';
  }
}

/**
 * Main function
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);

  const watch = args.includes('--watch');
  const json = args.includes('--json');
  const componentArg = args.find(arg => arg.startsWith('--component='));
  const component = componentArg?.split('=')[1];

  if (!watch) {
    // Run once
    const report = await runHealthChecks(component);
    printHealthReport(report, json ? 'json' : 'text');
    process.exit(report.overall === 'unhealthy' ? 1 : 0);
  } else {
    // Watch mode
    console.log('🔄 Running health checks every 30 seconds...\n');
    console.log('Press Ctrl+C to stop\n');

    while (true) {
      const report = await runHealthChecks(component);
      printHealthReport(report, json ? 'json' : 'text');

      await new Promise(resolve => setTimeout(resolve, 30000));
    }
  }
}

// Run main function if this script is executed directly
if (require.main === module || process.argv[1].endsWith('staging-health.ts')) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { runHealthChecks, checkDatabase, checkRedis, checkAPI, checkExternalServices, checkStorage };
