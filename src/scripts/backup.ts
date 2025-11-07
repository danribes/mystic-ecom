#!/usr/bin/env tsx
/**
 * Database Backup CLI Script
 *
 * Usage:
 *   npm run backup              - Create a new backup
 *   npm run backup:list         - List all backups
 *   npm run backup:cleanup      - Clean up old backups
 *   npm run backup:stats        - Show backup statistics
 *
 * Or run directly with tsx:
 *   tsx src/scripts/backup.ts create
 *   tsx src/scripts/backup.ts list
 *   tsx src/scripts/backup.ts cleanup
 *   tsx src/scripts/backup.ts stats
 *
 * Environment Variables:
 *   DATABASE_URL              - PostgreSQL connection string (required)
 *   BACKUP_DIR                - Backup directory (default: ./backups)
 *   BACKUP_RETENTION_DAYS     - Keep backups for N days (default: 30)
 *   BACKUP_RETENTION_COUNT    - Keep N most recent backups (default: 10)
 */

import { config } from 'dotenv';
import {
  createBackup,
  listBackups,
  cleanupOldBackups,
  getBackupStats,
  checkPgDumpAvailable,
} from '../lib/backup';

// Load environment variables
config();

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Format date to readable string
 */
function formatDate(date: Date): string {
  return date.toISOString().replace('T', ' ').split('.')[0];
}

/**
 * Create a new backup
 */
async function runCreateBackup(): Promise<void> {
  console.log('📦 Starting database backup...\n');

  // Check if pg_dump is available
  const pgDumpAvailable = await checkPgDumpAvailable();
  if (!pgDumpAvailable) {
    console.error('❌ pg_dump is not available. Please install PostgreSQL client tools.');
    process.exit(1);
  }

  const result = await createBackup();

  if (result.success) {
    console.log('\n✅ Backup completed successfully!');
    console.log(`   File: ${result.filename}`);
    console.log(`   Size: ${formatBytes(result.size!)}`);
    console.log(`   Duration: ${result.duration}ms`);
  } else {
    console.error('\n❌ Backup failed!');
    console.error(`   Error: ${result.error}`);
    process.exit(1);
  }
}

/**
 * List all backups
 */
async function runListBackups(): Promise<void> {
  console.log('📋 Listing backups...\n');

  const backups = await listBackups();

  if (backups.length === 0) {
    console.log('No backups found.');
    return;
  }

  console.log(`Found ${backups.length} backup(s):\n`);

  backups.forEach((backup, index) => {
    console.log(`${index + 1}. ${backup.filename}`);
    console.log(`   Size: ${formatBytes(backup.size)}`);
    console.log(`   Created: ${formatDate(backup.created)}`);
    console.log(`   Format: ${backup.format}`);
    console.log('');
  });
}

/**
 * Clean up old backups
 */
async function runCleanup(): Promise<void> {
  console.log('🧹 Cleaning up old backups...\n');

  const deletedCount = await cleanupOldBackups();

  if (deletedCount > 0) {
    console.log(`✅ Cleaned up ${deletedCount} old backup(s)`);
  } else {
    console.log('No old backups to clean up.');
  }
}

/**
 * Show backup statistics
 */
async function runStats(): Promise<void> {
  console.log('📊 Backup Statistics\n');

  const stats = await getBackupStats();

  console.log(`Total Backups: ${stats.totalBackups}`);
  console.log(`Total Size: ${formatBytes(stats.totalSize)}`);

  if (stats.newestBackup) {
    console.log(`Newest Backup: ${formatDate(stats.newestBackup)}`);
  }

  if (stats.oldestBackup) {
    console.log(`Oldest Backup: ${formatDate(stats.oldestBackup)}`);
  }

  if (stats.totalBackups > 0) {
    const avgSize = stats.totalSize / stats.totalBackups;
    console.log(`Average Size: ${formatBytes(avgSize)}`);
  }

  // Show retention policy
  console.log('\nRetention Policy:');
  console.log(`  Days: ${process.env.BACKUP_RETENTION_DAYS || 30}`);
  console.log(`  Count: ${process.env.BACKUP_RETENTION_COUNT || 10}`);
}

/**
 * Show usage help
 */
function showHelp(): void {
  console.log('Database Backup CLI\n');
  console.log('Usage:');
  console.log('  npm run backup              - Create a new backup');
  console.log('  npm run backup:list         - List all backups');
  console.log('  npm run backup:cleanup      - Clean up old backups');
  console.log('  npm run backup:stats        - Show backup statistics');
  console.log('');
  console.log('Or run directly:');
  console.log('  tsx src/scripts/backup.ts create');
  console.log('  tsx src/scripts/backup.ts list');
  console.log('  tsx src/scripts/backup.ts cleanup');
  console.log('  tsx src/scripts/backup.ts stats');
  console.log('');
  console.log('Environment Variables:');
  console.log('  DATABASE_URL              - PostgreSQL connection string (required)');
  console.log('  BACKUP_DIR                - Backup directory (default: ./backups)');
  console.log('  BACKUP_RETENTION_DAYS     - Keep backups for N days (default: 30)');
  console.log('  BACKUP_RETENTION_COUNT    - Keep N most recent backups (default: 10)');
}

/**
 * Main function
 */
async function main(): Promise<void> {
  const command = process.argv[2] || 'create';

  try {
    switch (command) {
      case 'create':
        await runCreateBackup();
        break;

      case 'list':
        await runListBackups();
        break;

      case 'cleanup':
        await runCleanup();
        break;

      case 'stats':
        await runStats();
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
if (require.main === module || process.argv[1].endsWith('backup.ts')) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
