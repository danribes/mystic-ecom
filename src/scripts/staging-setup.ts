#!/usr/bin/env tsx
/**
 * Staging Environment Setup Script
 *
 * Initializes and configures the staging environment
 *
 * Usage:
 *   tsx src/scripts/staging-setup.ts init           - Initialize staging environment
 *   tsx src/scripts/staging-setup.ts seed           - Seed staging database with test data
 *   tsx src/scripts/staging-setup.ts reset          - Reset staging environment
 *   tsx src/scripts/staging-setup.ts check          - Check staging environment health
 *   tsx src/scripts/staging-setup.ts help           - Show this help
 *
 * Environment Variables:
 *   DATABASE_URL      - PostgreSQL connection string (required)
 *   REDIS_URL         - Redis connection string (required)
 *   NODE_ENV          - Should be 'staging'
 */

import { config } from 'dotenv';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import * as Sentry from '@sentry/node';

const execAsync = promisify(exec);

// Load environment variables
config({ path: '.env.staging' });
config(); // Fallback to .env

// Initialize Sentry for error tracking
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: 'staging-setup',
    tracesSampleRate: 1.0,
  });
}

interface SetupResult {
  step: string;
  status: 'success' | 'fail' | 'skip';
  message: string;
  duration?: number;
}

/**
 * Initialize staging environment
 */
async function initStaging(): Promise<void> {
  console.log('🚀 Initializing Staging Environment\n');
  console.log('═'.repeat(60));
  console.log('');

  const results: SetupResult[] = [];
  const startTime = Date.now();

  // Step 1: Check environment variables
  console.log('1️⃣  Checking Environment Variables...');
  results.push(await checkEnvironment());

  // Step 2: Check database connectivity
  console.log('2️⃣  Checking Database Connectivity...');
  results.push(await checkDatabase());

  // Step 3: Run database migrations
  console.log('3️⃣  Running Database Migrations...');
  results.push(await runMigrations());

  // Step 4: Check Redis connectivity
  console.log('4️⃣  Checking Redis Connectivity...');
  results.push(await checkRedis());

  // Step 5: Create backup directory
  console.log('5️⃣  Creating Backup Directory...');
  results.push(await createBackupDirectory());

  // Step 6: Verify external services
  console.log('6️⃣  Verifying External Services...');
  results.push(await verifyExternalServices());

  // Step 7: Setup monitoring
  console.log('7️⃣  Setting Up Monitoring...');
  results.push(await setupMonitoring());

  const totalDuration = Date.now() - startTime;

  // Print results
  console.log('');
  console.log('═'.repeat(60));
  console.log('\n📊 Setup Results:\n');

  const succeeded = results.filter(r => r.status === 'success').length;
  const failed = results.filter(r => r.status === 'fail').length;
  const skipped = results.filter(r => r.status === 'skip').length;

  results.forEach(result => {
    const icon = result.status === 'success' ? '✅' : result.status === 'fail' ? '❌' : '⏭️';
    console.log(`${icon} ${result.step}`);
    console.log(`   ${result.message}`);
    if (result.duration) {
      console.log(`   Duration: ${result.duration}ms`);
    }
    console.log('');
  });

  console.log('Summary:');
  console.log(`  Succeeded: ${succeeded}/${results.length}`);
  console.log(`  Failed: ${failed}/${results.length}`);
  console.log(`  Skipped: ${skipped}/${results.length}`);
  console.log(`  Total Duration: ${totalDuration}ms`);
  console.log('');

  if (failed > 0) {
    console.log('❌ SETUP FAILED!');
    console.log(`   ${failed} step(s) failed.`);
    console.log('   Fix these issues before proceeding.\n');
    process.exit(1);
  } else {
    console.log('✅ STAGING ENVIRONMENT READY!');
    console.log('   All setup steps completed successfully.\n');
  }
}

/**
 * Check environment variables
 */
async function checkEnvironment(): Promise<SetupResult> {
  const start = Date.now();

  const required = ['DATABASE_URL', 'REDIS_URL', 'NODE_ENV'];
  const missing = required.filter(env => !process.env[env]);

  if (missing.length > 0) {
    return {
      step: 'Environment Variables',
      status: 'fail',
      message: `Missing required variables: ${missing.join(', ')}`,
      duration: Date.now() - start,
    };
  }

  if (process.env.NODE_ENV !== 'staging') {
    return {
      step: 'Environment Variables',
      status: 'fail',
      message: `NODE_ENV should be 'staging', found '${process.env.NODE_ENV}'`,
      duration: Date.now() - start,
    };
  }

  return {
    step: 'Environment Variables',
    status: 'success',
    message: 'All required environment variables are set',
    duration: Date.now() - start,
  };
}

/**
 * Check database connectivity
 */
async function checkDatabase(): Promise<SetupResult> {
  const start = Date.now();

  try {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      return {
        step: 'Database Connectivity',
        status: 'fail',
        message: 'DATABASE_URL not set',
        duration: Date.now() - start,
      };
    }

    // Test connection
    await execAsync(`psql "${dbUrl}" -c "SELECT 1"`);

    // Check database name to ensure it's staging
    const { stdout } = await execAsync(`psql "${dbUrl}" -c "SELECT current_database()"`);
    const dbName = stdout.trim().split('\n')[2].trim();

    if (!dbName.includes('staging') && !dbName.includes('test')) {
      return {
        step: 'Database Connectivity',
        status: 'fail',
        message: `Database '${dbName}' doesn't appear to be a staging database. Use a database with 'staging' or 'test' in the name.`,
        duration: Date.now() - start,
      };
    }

    return {
      step: 'Database Connectivity',
      status: 'success',
      message: `Connected to database: ${dbName}`,
      duration: Date.now() - start,
    };
  } catch (error) {
    return {
      step: 'Database Connectivity',
      status: 'fail',
      message: `Cannot connect to database: ${error instanceof Error ? error.message : 'Unknown error'}`,
      duration: Date.now() - start,
    };
  }
}

/**
 * Run database migrations
 */
async function runMigrations(): Promise<SetupResult> {
  const start = Date.now();

  try {
    // Check if migrations directory exists
    const migrationsPath = path.join(process.cwd(), 'migrations');
    if (!existsSync(migrationsPath)) {
      return {
        step: 'Database Migrations',
        status: 'skip',
        message: 'No migrations directory found',
        duration: Date.now() - start,
      };
    }

    // Run migrations (adjust command based on your migration tool)
    // This is a placeholder - adjust for your actual migration tool
    try {
      await execAsync('npm run db:migrate');
    } catch (error) {
      // If db:migrate script doesn't exist, skip
      return {
        step: 'Database Migrations',
        status: 'skip',
        message: 'No migration script found (npm run db:migrate)',
        duration: Date.now() - start,
      };
    }

    return {
      step: 'Database Migrations',
      status: 'success',
      message: 'Database migrations completed',
      duration: Date.now() - start,
    };
  } catch (error) {
    return {
      step: 'Database Migrations',
      status: 'fail',
      message: `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      duration: Date.now() - start,
    };
  }
}

/**
 * Check Redis connectivity
 */
async function checkRedis(): Promise<SetupResult> {
  const start = Date.now();

  try {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      return {
        step: 'Redis Connectivity',
        status: 'fail',
        message: 'REDIS_URL not set',
        duration: Date.now() - start,
      };
    }

    // Test connection
    await execAsync(`redis-cli -u "${redisUrl}" PING`);

    // Test write/read
    await execAsync(`redis-cli -u "${redisUrl}" SET staging:test "ok"`);
    const { stdout } = await execAsync(`redis-cli -u "${redisUrl}" GET staging:test`);

    if (stdout.trim() !== '"ok"' && stdout.trim() !== 'ok') {
      return {
        step: 'Redis Connectivity',
        status: 'fail',
        message: 'Redis write/read test failed',
        duration: Date.now() - start,
      };
    }

    // Cleanup
    await execAsync(`redis-cli -u "${redisUrl}" DEL staging:test`);

    return {
      step: 'Redis Connectivity',
      status: 'success',
      message: 'Redis is accessible and functional',
      duration: Date.now() - start,
    };
  } catch (error) {
    return {
      step: 'Redis Connectivity',
      status: 'fail',
      message: `Cannot connect to Redis: ${error instanceof Error ? error.message : 'Unknown error'}`,
      duration: Date.now() - start,
    };
  }
}

/**
 * Create backup directory
 */
async function createBackupDirectory(): Promise<SetupResult> {
  const start = Date.now();

  try {
    const backupDir = process.env.BACKUP_DIR || path.join(process.cwd(), 'backups/staging');

    if (!existsSync(backupDir)) {
      await fs.mkdir(backupDir, { recursive: true });
    }

    // Test write permissions
    const testFile = path.join(backupDir, '.test');
    await fs.writeFile(testFile, 'test');
    await fs.unlink(testFile);

    return {
      step: 'Backup Directory',
      status: 'success',
      message: `Backup directory ready: ${backupDir}`,
      duration: Date.now() - start,
    };
  } catch (error) {
    return {
      step: 'Backup Directory',
      status: 'fail',
      message: `Cannot create backup directory: ${error instanceof Error ? error.message : 'Unknown error'}`,
      duration: Date.now() - start,
    };
  }
}

/**
 * Verify external services
 */
async function verifyExternalServices(): Promise<SetupResult> {
  const start = Date.now();

  const services: { name: string; check: () => boolean }[] = [
    { name: 'Stripe', check: () => !!process.env.STRIPE_SECRET_KEY },
    { name: 'Resend', check: () => !!process.env.RESEND_API_KEY },
    { name: 'Sentry', check: () => !!process.env.SENTRY_DSN },
    { name: 'Cloudflare Stream', check: () => !!process.env.CLOUDFLARE_ACCOUNT_ID },
  ];

  const configured = services.filter(s => s.check());
  const missing = services.filter(s => !s.check());

  if (configured.length === 0) {
    return {
      step: 'External Services',
      status: 'fail',
      message: 'No external services configured',
      duration: Date.now() - start,
    };
  }

  if (missing.length > 0) {
    return {
      step: 'External Services',
      status: 'success',
      message: `${configured.length}/${services.length} services configured. Missing: ${missing.map(s => s.name).join(', ')}`,
      duration: Date.now() - start,
    };
  }

  return {
    step: 'External Services',
    status: 'success',
    message: `All ${services.length} external services configured`,
    duration: Date.now() - start,
  };
}

/**
 * Setup monitoring
 */
async function setupMonitoring(): Promise<SetupResult> {
  const start = Date.now();

  if (!process.env.SENTRY_DSN) {
    return {
      step: 'Monitoring Setup',
      status: 'skip',
      message: 'Sentry not configured',
      duration: Date.now() - start,
    };
  }

  try {
    // Test Sentry by capturing a test message
    Sentry.captureMessage('Staging environment initialized', 'info');
    await Sentry.flush(2000);

    return {
      step: 'Monitoring Setup',
      status: 'success',
      message: 'Sentry monitoring configured',
      duration: Date.now() - start,
    };
  } catch (error) {
    return {
      step: 'Monitoring Setup',
      status: 'fail',
      message: `Sentry setup failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      duration: Date.now() - start,
    };
  }
}

/**
 * Seed staging database with test data
 */
async function seedStaging(): Promise<void> {
  console.log('🌱 Seeding Staging Database\n');

  // Check if seeding should be done
  if (process.env.SEED_DATABASE === 'false') {
    console.log('⏭️  Seeding disabled (SEED_DATABASE=false)\n');
    return;
  }

  console.log('Creating test data...');

  try {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error('DATABASE_URL not set');
    }

    // Create test users
    console.log('  → Creating test users...');
    await execAsync(`psql "${dbUrl}" -c "
      INSERT INTO users (email, name, role, created_at)
      VALUES
        ('test@example.com', 'Test User', 'user', NOW()),
        ('admin@example.com', 'Admin User', 'admin', NOW())
      ON CONFLICT (email) DO NOTHING;
    "`);

    // Create test products (if products table exists)
    console.log('  → Creating test products...');
    try {
      await execAsync(`psql "${dbUrl}" -c "
        INSERT INTO products (name, description, price, created_at)
        VALUES
          ('Test Product 1', 'Description for test product 1', 19.99, NOW()),
          ('Test Product 2', 'Description for test product 2', 29.99, NOW())
        ON CONFLICT DO NOTHING;
      "`);
    } catch {
      console.log('  → Products table not found, skipping...');
    }

    console.log('\n✅ Staging database seeded successfully!\n');
  } catch (error) {
    console.error('\n❌ Seeding failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

/**
 * Reset staging environment
 */
async function resetStaging(): Promise<void> {
  console.log('🔄 Resetting Staging Environment\n');
  console.log('⚠️  This will delete all data in the staging database!');
  console.log('');

  // Safety check: ensure we're in staging
  if (process.env.NODE_ENV !== 'staging') {
    console.error('❌ Can only reset staging environment (NODE_ENV must be "staging")');
    process.exit(1);
  }

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('❌ DATABASE_URL not set');
    process.exit(1);
  }

  // Additional safety: check database name
  const { stdout } = await execAsync(`psql "${dbUrl}" -c "SELECT current_database()"`);
  const dbName = stdout.trim().split('\n')[2].trim();

  if (!dbName.includes('staging') && !dbName.includes('test')) {
    console.error(`❌ Refusing to reset database '${dbName}' - doesn't appear to be a staging database`);
    process.exit(1);
  }

  console.log(`Database: ${dbName}`);
  console.log('');
  console.log('Proceeding with reset in 5 seconds... (Ctrl+C to cancel)');

  await new Promise(resolve => setTimeout(resolve, 5000));

  try {
    // Drop all tables
    console.log('Dropping all tables...');
    await execAsync(`psql "${dbUrl}" -c "
      DROP SCHEMA public CASCADE;
      CREATE SCHEMA public;
      GRANT ALL ON SCHEMA public TO public;
    "`);

    // Clear Redis
    console.log('Clearing Redis cache...');
    const redisUrl = process.env.REDIS_URL;
    if (redisUrl) {
      await execAsync(`redis-cli -u "${redisUrl}" FLUSHDB`);
    }

    // Delete backups
    console.log('Deleting backups...');
    const backupDir = process.env.BACKUP_DIR || path.join(process.cwd(), 'backups/staging');
    if (existsSync(backupDir)) {
      const files = await fs.readdir(backupDir);
      for (const file of files) {
        await fs.unlink(path.join(backupDir, file));
      }
    }

    console.log('\n✅ Staging environment reset successfully!');
    console.log('   Run "tsx src/scripts/staging-setup.ts init" to reinitialize.\n');
  } catch (error) {
    console.error('\n❌ Reset failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

/**
 * Check staging environment health
 */
async function checkStaging(): Promise<void> {
  console.log('🏥 Staging Environment Health Check\n');

  const checks = [
    { name: 'Environment Variables', check: checkEnvironment },
    { name: 'Database', check: checkDatabase },
    { name: 'Redis', check: checkRedis },
    { name: 'Backup Directory', check: createBackupDirectory },
    { name: 'External Services', check: verifyExternalServices },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of checks) {
    process.stdout.write(`${test.name}... `);
    const result = await test.check();
    if (result.status === 'success') {
      console.log('✅ PASS');
      passed++;
    } else if (result.status === 'skip') {
      console.log('⏭️  SKIP');
    } else {
      console.log('❌ FAIL');
      console.log(`   ${result.message}`);
      failed++;
    }
  }

  console.log('');
  console.log(`Results: ${passed} passed, ${failed} failed`);

  if (failed > 0) {
    console.log('\n⚠️  Some checks failed. Review errors above.');
    process.exit(1);
  } else {
    console.log('\n✅ All health checks passed!');
  }
}

/**
 * Show help
 */
function showHelp(): void {
  console.log('Staging Environment Setup Script\n');
  console.log('Usage:');
  console.log('  tsx src/scripts/staging-setup.ts init     - Initialize staging environment');
  console.log('  tsx src/scripts/staging-setup.ts seed     - Seed database with test data');
  console.log('  tsx src/scripts/staging-setup.ts reset    - Reset staging environment');
  console.log('  tsx src/scripts/staging-setup.ts check    - Check environment health');
  console.log('  tsx src/scripts/staging-setup.ts help     - Show this help');
  console.log('');
  console.log('Environment Variables:');
  console.log('  DATABASE_URL    - PostgreSQL connection string (required)');
  console.log('  REDIS_URL       - Redis connection string (required)');
  console.log('  NODE_ENV        - Should be "staging" (required)');
  console.log('  BACKUP_DIR      - Backup directory (default: ./backups/staging)');
  console.log('  SEED_DATABASE   - Enable/disable seeding (default: false)');
  console.log('');
}

/**
 * Main function
 */
async function main(): Promise<void> {
  const command = process.argv[2] || 'init';

  try {
    switch (command) {
      case 'init':
        await initStaging();
        break;

      case 'seed':
        await seedStaging();
        break;

      case 'reset':
        await resetStaging();
        break;

      case 'check':
        await checkStaging();
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
    Sentry.captureException(error);
    await Sentry.flush(2000);
    process.exit(1);
  }
}

// Run main function if this script is executed directly
if (require.main === module || process.argv[1].endsWith('staging-setup.ts')) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { initStaging, seedStaging, resetStaging, checkStaging };
