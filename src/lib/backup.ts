/**
 * Database Backup Utility
 *
 * Provides functionality for automated PostgreSQL database backups:
 * - Create backups using pg_dump
 * - List existing backups
 * - Clean up old backups
 * - Restore from backup
 * - Upload to cloud storage (optional)
 *
 * Features:
 * - Timestamped backup files
 * - Retention policy (keep last N backups or X days)
 * - Compression support
 * - Error handling and logging
 * - Progress tracking
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';
import { captureException, addBreadcrumb } from './sentry';

const execAsync = promisify(exec);

/**
 * Backup configuration
 */
export interface BackupConfig {
  backupDir: string;
  retentionDays?: number;
  retentionCount?: number;
  compress?: boolean;
  format?: 'plain' | 'custom' | 'directory' | 'tar';
}

/**
 * Backup metadata
 */
export interface BackupInfo {
  filename: string;
  path: string;
  size: number;
  created: Date;
  database: string;
  format: string;
}

/**
 * Backup result
 */
export interface BackupResult {
  success: boolean;
  filename?: string;
  path?: string;
  size?: number;
  duration?: number;
  error?: string;
}

/**
 * Default backup configuration
 */
const DEFAULT_CONFIG: BackupConfig = {
  backupDir: process.env.BACKUP_DIR || path.join(process.cwd(), 'backups'),
  retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '30'),
  retentionCount: parseInt(process.env.BACKUP_RETENTION_COUNT || '10'),
  compress: true,
  format: 'custom',
};

/**
 * Get database connection info from DATABASE_URL
 */
function parseDatabaseUrl(url: string): {
  host: string;
  port: string;
  database: string;
  username: string;
  password: string;
} {
  const matches = url.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/);

  if (!matches) {
    throw new Error('Invalid DATABASE_URL format');
  }

  const [, username, password, host, port, database] = matches;

  return { host, port, database, username, password };
}

/**
 * Ensure backup directory exists
 */
async function ensureBackupDir(backupDir: string): Promise<void> {
  if (!existsSync(backupDir)) {
    await fs.mkdir(backupDir, { recursive: true });
    console.log(`✅ Created backup directory: ${backupDir}`);
  }
}

/**
 * Generate backup filename with timestamp
 */
function generateBackupFilename(database: string, format: string = 'custom'): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T').join('_').split('.')[0];
  const extension = format === 'custom' ? 'dump' : format === 'tar' ? 'tar' : 'sql';

  return `${database}_${timestamp}.${extension}`;
}

/**
 * Create database backup using pg_dump
 *
 * @param config - Backup configuration
 * @returns Backup result
 */
export async function createBackup(config: Partial<BackupConfig> = {}): Promise<BackupResult> {
  const startTime = Date.now();
  const cfg = { ...DEFAULT_CONFIG, ...config };

  try {
    // Log breadcrumb
    addBreadcrumb({
      message: 'Starting database backup',
      category: 'backup',
      level: 'info',
      data: { backupDir: cfg.backupDir, format: cfg.format },
    });

    // Ensure backup directory exists
    await ensureBackupDir(cfg.backupDir);

    // Get database connection info
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    const dbInfo = parseDatabaseUrl(databaseUrl);
    const filename = generateBackupFilename(dbInfo.database, cfg.format);
    const backupPath = path.join(cfg.backupDir, filename);

    // Build pg_dump command
    const pgDumpCommand = buildPgDumpCommand(dbInfo, backupPath, cfg);

    console.log(`🔄 Creating backup: ${filename}`);

    // Execute pg_dump
    const { stdout, stderr } = await execAsync(pgDumpCommand, {
      env: {
        ...process.env,
        PGPASSWORD: dbInfo.password,
      },
      maxBuffer: 1024 * 1024 * 100, // 100MB buffer
    });

    if (stderr && !stderr.includes('password')) {
      console.warn('pg_dump warnings:', stderr);
    }

    // Get backup file size
    const stats = await fs.stat(backupPath);
    const duration = Date.now() - startTime;

    console.log(`✅ Backup created: ${filename} (${formatBytes(stats.size)}) in ${duration}ms`);

    // Log breadcrumb
    addBreadcrumb({
      message: 'Database backup completed',
      category: 'backup',
      level: 'info',
      data: {
        filename,
        size: stats.size,
        duration,
      },
    });

    // Clean up old backups
    await cleanupOldBackups(cfg);

    return {
      success: true,
      filename,
      path: backupPath,
      size: stats.size,
      duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;

    console.error('❌ Backup failed:', error);

    // Log to Sentry
    captureException(error, {
      context: 'database_backup',
      operation: 'create_backup',
      duration,
    });

    return {
      success: false,
      duration,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Build pg_dump command
 */
function buildPgDumpCommand(
  dbInfo: { host: string; port: string; database: string; username: string },
  backupPath: string,
  config: BackupConfig
): string {
  const parts = [
    'pg_dump',
    `-h ${dbInfo.host}`,
    `-p ${dbInfo.port}`,
    `-U ${dbInfo.username}`,
    `-d ${dbInfo.database}`,
  ];

  // Format
  if (config.format === 'custom') {
    parts.push('-Fc'); // Custom format (compressed)
  } else if (config.format === 'tar') {
    parts.push('-Ft'); // Tar format
  } else if (config.format === 'directory') {
    parts.push('-Fd'); // Directory format
  }
  // plain format uses default output

  // Compression (for custom format)
  if (config.compress && config.format === 'custom') {
    parts.push('-Z 9'); // Maximum compression
  }

  // Output file
  parts.push(`-f ${backupPath}`);

  // Verbose
  parts.push('-v');

  return parts.join(' ');
}

/**
 * List all backups
 *
 * @param config - Backup configuration
 * @returns Array of backup info
 */
export async function listBackups(config: Partial<BackupConfig> = {}): Promise<BackupInfo[]> {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  try {
    // Ensure backup directory exists
    if (!existsSync(cfg.backupDir)) {
      return [];
    }

    // Read directory
    const files = await fs.readdir(cfg.backupDir);

    // Filter backup files
    const backupFiles = files.filter((file) =>
      file.endsWith('.dump') || file.endsWith('.sql') || file.endsWith('.tar')
    );

    // Get file stats
    const backups: BackupInfo[] = [];

    for (const file of backupFiles) {
      const filePath = path.join(cfg.backupDir, file);
      const stats = await fs.stat(filePath);

      // Parse database name from filename
      const database = file.split('_')[0];

      // Determine format
      const format = file.endsWith('.dump')
        ? 'custom'
        : file.endsWith('.tar')
        ? 'tar'
        : 'plain';

      backups.push({
        filename: file,
        path: filePath,
        size: stats.size,
        created: stats.mtime,
        database,
        format,
      });
    }

    // Sort by creation date (newest first)
    backups.sort((a, b) => b.created.getTime() - a.created.getTime());

    return backups;
  } catch (error) {
    console.error('Error listing backups:', error);
    captureException(error, { context: 'database_backup', operation: 'list_backups' });
    return [];
  }
}

/**
 * Clean up old backups based on retention policy
 *
 * @param config - Backup configuration
 */
export async function cleanupOldBackups(config: Partial<BackupConfig> = {}): Promise<number> {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  try {
    const backups = await listBackups(cfg);

    if (backups.length === 0) {
      return 0;
    }

    const backupsToDelete: BackupInfo[] = [];

    // Apply retention count policy
    if (cfg.retentionCount && backups.length > cfg.retentionCount) {
      backupsToDelete.push(...backups.slice(cfg.retentionCount));
    }

    // Apply retention days policy
    if (cfg.retentionDays) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - cfg.retentionDays);

      const oldBackups = backups.filter((backup) => backup.created < cutoffDate);
      oldBackups.forEach((backup) => {
        if (!backupsToDelete.some((b) => b.filename === backup.filename)) {
          backupsToDelete.push(backup);
        }
      });
    }

    // Delete old backups
    let deletedCount = 0;

    for (const backup of backupsToDelete) {
      try {
        await fs.unlink(backup.path);
        console.log(`🗑️  Deleted old backup: ${backup.filename}`);
        deletedCount++;
      } catch (error) {
        console.error(`Failed to delete backup ${backup.filename}:`, error);
      }
    }

    if (deletedCount > 0) {
      addBreadcrumb({
        message: `Cleaned up ${deletedCount} old backups`,
        category: 'backup',
        level: 'info',
        data: { deletedCount },
      });
    }

    return deletedCount;
  } catch (error) {
    console.error('Error cleaning up backups:', error);
    captureException(error, { context: 'database_backup', operation: 'cleanup' });
    return 0;
  }
}

/**
 * Delete a specific backup
 *
 * @param filename - Backup filename to delete
 * @param config - Backup configuration
 */
export async function deleteBackup(
  filename: string,
  config: Partial<BackupConfig> = {}
): Promise<boolean> {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  try {
    const backupPath = path.join(cfg.backupDir, filename);

    // Check if file exists
    if (!existsSync(backupPath)) {
      throw new Error('Backup file not found');
    }

    // Delete file
    await fs.unlink(backupPath);

    console.log(`🗑️  Deleted backup: ${filename}`);

    addBreadcrumb({
      message: 'Backup deleted',
      category: 'backup',
      level: 'info',
      data: { filename },
    });

    return true;
  } catch (error) {
    console.error('Error deleting backup:', error);
    captureException(error, { context: 'database_backup', operation: 'delete', filename });
    return false;
  }
}

/**
 * Restore database from backup
 *
 * @param filename - Backup filename to restore from
 * @param config - Backup configuration
 */
export async function restoreBackup(
  filename: string,
  config: Partial<BackupConfig> = {}
): Promise<BackupResult> {
  const startTime = Date.now();
  const cfg = { ...DEFAULT_CONFIG, ...config };

  try {
    const backupPath = path.join(cfg.backupDir, filename);

    // Check if file exists
    if (!existsSync(backupPath)) {
      throw new Error('Backup file not found');
    }

    // Get database connection info
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    const dbInfo = parseDatabaseUrl(databaseUrl);

    // Determine backup format
    const format = filename.endsWith('.dump')
      ? 'custom'
      : filename.endsWith('.tar')
      ? 'tar'
      : 'plain';

    // Build pg_restore or psql command
    let restoreCommand: string;

    if (format === 'plain') {
      // Use psql for plain SQL files
      restoreCommand = `psql -h ${dbInfo.host} -p ${dbInfo.port} -U ${dbInfo.username} -d ${dbInfo.database} -f ${backupPath}`;
    } else {
      // Use pg_restore for custom/tar formats
      restoreCommand = `pg_restore -h ${dbInfo.host} -p ${dbInfo.port} -U ${dbInfo.username} -d ${dbInfo.database} -c -v ${backupPath}`;
    }

    console.log(`🔄 Restoring from backup: ${filename}`);

    addBreadcrumb({
      message: 'Starting database restore',
      category: 'backup',
      level: 'info',
      data: { filename, format },
    });

    // Execute restore command
    const { stdout, stderr } = await execAsync(restoreCommand, {
      env: {
        ...process.env,
        PGPASSWORD: dbInfo.password,
      },
      maxBuffer: 1024 * 1024 * 100, // 100MB buffer
    });

    if (stderr && !stderr.includes('password')) {
      console.warn('Restore warnings:', stderr);
    }

    const duration = Date.now() - startTime;

    console.log(`✅ Restore completed in ${duration}ms`);

    addBreadcrumb({
      message: 'Database restore completed',
      category: 'backup',
      level: 'info',
      data: { filename, duration },
    });

    return {
      success: true,
      filename,
      path: backupPath,
      duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;

    console.error('❌ Restore failed:', error);

    captureException(error, {
      context: 'database_backup',
      operation: 'restore',
      filename,
      duration,
    });

    return {
      success: false,
      duration,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get backup statistics
 *
 * @param config - Backup configuration
 */
export async function getBackupStats(config: Partial<BackupConfig> = {}): Promise<{
  totalBackups: number;
  totalSize: number;
  oldestBackup?: Date;
  newestBackup?: Date;
}> {
  const backups = await listBackups(config);

  if (backups.length === 0) {
    return {
      totalBackups: 0,
      totalSize: 0,
    };
  }

  const totalSize = backups.reduce((sum, backup) => sum + backup.size, 0);
  const oldestBackup = backups[backups.length - 1].created;
  const newestBackup = backups[0].created;

  return {
    totalBackups: backups.length,
    totalSize,
    oldestBackup,
    newestBackup,
  };
}

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
 * Check if pg_dump is available
 */
export async function checkPgDumpAvailable(): Promise<boolean> {
  try {
    await execAsync('pg_dump --version');
    return true;
  } catch (error) {
    return false;
  }
}
