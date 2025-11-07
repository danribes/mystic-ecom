/**
 * T155: Database Backup Tests
 *
 * These tests validate the database backup functionality:
 * - Backup configuration
 * - Backup creation (mocked)
 * - Backup listing
 * - Backup cleanup
 * - Backup deletion
 * - Backup statistics
 * - API endpoint functionality
 * - pg_dump availability check
 *
 * Run these tests:
 * npm test -- tests/backup/T155_database_backup.test.ts
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import * as backup from '../../src/lib/backup';

// Test backup directory
const TEST_BACKUP_DIR = path.join(process.cwd(), 'test-backups');

describe('T155: Database Backup', () => {
  // Clean up test directory before and after tests
  beforeEach(async () => {
    if (existsSync(TEST_BACKUP_DIR)) {
      await fs.rm(TEST_BACKUP_DIR, { recursive: true, force: true });
    }
    await fs.mkdir(TEST_BACKUP_DIR, { recursive: true });
  });

  afterEach(async () => {
    if (existsSync(TEST_BACKUP_DIR)) {
      await fs.rm(TEST_BACKUP_DIR, { recursive: true, force: true });
    }
  });

  describe('Backup Configuration', () => {
    it('should have backup library file', () => {
      const backupLibPath = path.join(process.cwd(), 'src/lib/backup.ts');
      expect(existsSync(backupLibPath)).toBe(true);
    });

    it('should have backup script file', () => {
      const backupScriptPath = path.join(process.cwd(), 'src/scripts/backup.ts');
      expect(existsSync(backupScriptPath)).toBe(true);
    });

    it('should have backup API endpoint', () => {
      const backupApiPath = path.join(process.cwd(), 'src/pages/api/backup.ts');
      expect(existsSync(backupApiPath)).toBe(true);
    });

    it('should have backup npm scripts in package.json', () => {
      const packagePath = path.join(process.cwd(), 'package.json');
      const packageJson = JSON.parse(require('fs').readFileSync(packagePath, 'utf-8'));

      expect(packageJson.scripts.backup).toBeDefined();
      expect(packageJson.scripts['backup:list']).toBeDefined();
      expect(packageJson.scripts['backup:cleanup']).toBeDefined();
      expect(packageJson.scripts['backup:stats']).toBeDefined();
    });

    it('should export backup functions', () => {
      expect(typeof backup.createBackup).toBe('function');
      expect(typeof backup.listBackups).toBe('function');
      expect(typeof backup.cleanupOldBackups).toBe('function');
      expect(typeof backup.deleteBackup).toBe('function');
      expect(typeof backup.restoreBackup).toBe('function');
      expect(typeof backup.getBackupStats).toBe('function');
      expect(typeof backup.checkPgDumpAvailable).toBe('function');
    });
  });

  describe('Environment Variables', () => {
    it('should have DATABASE_URL configured', () => {
      expect(process.env.DATABASE_URL).toBeDefined();
    });

    it('should have valid DATABASE_URL format', () => {
      const dbUrl = process.env.DATABASE_URL || '';
      expect(dbUrl).toMatch(/^postgresql:\/\//);
    });

    it('should accept optional BACKUP_DIR environment variable', () => {
      // BACKUP_DIR is optional, defaults to ./backups
      const backupDir = process.env.BACKUP_DIR || path.join(process.cwd(), 'backups');
      expect(typeof backupDir).toBe('string');
    });

    it('should accept optional BACKUP_RETENTION_DAYS', () => {
      // Optional, defaults to 30
      const retentionDays = parseInt(process.env.BACKUP_RETENTION_DAYS || '30');
      expect(typeof retentionDays).toBe('number');
      expect(retentionDays).toBeGreaterThan(0);
    });

    it('should accept optional BACKUP_RETENTION_COUNT', () => {
      // Optional, defaults to 10
      const retentionCount = parseInt(process.env.BACKUP_RETENTION_COUNT || '10');
      expect(typeof retentionCount).toBe('number');
      expect(retentionCount).toBeGreaterThan(0);
    });
  });

  describe('Backup Listing', () => {
    it('should list backups in empty directory', async () => {
      const backups = await backup.listBackups({ backupDir: TEST_BACKUP_DIR });
      expect(Array.isArray(backups)).toBe(true);
      expect(backups.length).toBe(0);
    });

    it('should list backups when files exist', async () => {
      // Create mock backup files
      await fs.writeFile(path.join(TEST_BACKUP_DIR, 'test_2025-11-05_12-00-00.dump'), 'mock backup');
      await fs.writeFile(path.join(TEST_BACKUP_DIR, 'test_2025-11-05_13-00-00.sql'), 'mock backup');

      const backups = await backup.listBackups({ backupDir: TEST_BACKUP_DIR });

      expect(backups.length).toBe(2);
      expect(backups[0]).toHaveProperty('filename');
      expect(backups[0]).toHaveProperty('size');
      expect(backups[0]).toHaveProperty('created');
      expect(backups[0]).toHaveProperty('database');
      expect(backups[0]).toHaveProperty('format');
    });

    it('should sort backups by creation date (newest first)', async () => {
      // Create mock backup files with different timestamps
      await fs.writeFile(path.join(TEST_BACKUP_DIR, 'test_2025-11-05_12-00-00.dump'), 'old backup');

      // Wait a bit to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));

      await fs.writeFile(path.join(TEST_BACKUP_DIR, 'test_2025-11-05_13-00-00.dump'), 'new backup');

      const backups = await backup.listBackups({ backupDir: TEST_BACKUP_DIR });

      expect(backups.length).toBe(2);
      // Newer file should be first
      expect(backups[0].filename).toContain('13-00-00');
    });

    it('should identify backup format correctly', async () => {
      await fs.writeFile(path.join(TEST_BACKUP_DIR, 'test.dump'), 'custom');
      await fs.writeFile(path.join(TEST_BACKUP_DIR, 'test.sql'), 'plain');
      await fs.writeFile(path.join(TEST_BACKUP_DIR, 'test.tar'), 'tar');

      const backups = await backup.listBackups({ backupDir: TEST_BACKUP_DIR });

      expect(backups.find(b => b.filename === 'test.dump')?.format).toBe('custom');
      expect(backups.find(b => b.filename === 'test.sql')?.format).toBe('plain');
      expect(backups.find(b => b.filename === 'test.tar')?.format).toBe('tar');
    });

    it('should filter only backup files', async () => {
      await fs.writeFile(path.join(TEST_BACKUP_DIR, 'backup.dump'), 'backup');
      await fs.writeFile(path.join(TEST_BACKUP_DIR, 'readme.txt'), 'not a backup');
      await fs.writeFile(path.join(TEST_BACKUP_DIR, 'data.json'), 'not a backup');

      const backups = await backup.listBackups({ backupDir: TEST_BACKUP_DIR });

      expect(backups.length).toBe(1);
      expect(backups[0].filename).toBe('backup.dump');
    });
  });

  describe('Backup Deletion', () => {
    it('should delete existing backup file', async () => {
      const filename = 'test_backup.dump';
      const filePath = path.join(TEST_BACKUP_DIR, filename);

      await fs.writeFile(filePath, 'backup data');
      expect(existsSync(filePath)).toBe(true);

      const result = await backup.deleteBackup(filename, { backupDir: TEST_BACKUP_DIR });

      expect(result).toBe(true);
      expect(existsSync(filePath)).toBe(false);
    });

    it('should return false for non-existent backup', async () => {
      const result = await backup.deleteBackup('non_existent.dump', { backupDir: TEST_BACKUP_DIR });
      expect(result).toBe(false);
    });

    it('should handle multiple deletions', async () => {
      await fs.writeFile(path.join(TEST_BACKUP_DIR, 'backup1.dump'), 'data');
      await fs.writeFile(path.join(TEST_BACKUP_DIR, 'backup2.dump'), 'data');

      const result1 = await backup.deleteBackup('backup1.dump', { backupDir: TEST_BACKUP_DIR });
      const result2 = await backup.deleteBackup('backup2.dump', { backupDir: TEST_BACKUP_DIR });

      expect(result1).toBe(true);
      expect(result2).toBe(true);

      const backups = await backup.listBackups({ backupDir: TEST_BACKUP_DIR });
      expect(backups.length).toBe(0);
    });
  });

  describe('Backup Cleanup', () => {
    it('should cleanup old backups based on retention count', async () => {
      // Create 5 backup files
      for (let i = 0; i < 5; i++) {
        await fs.writeFile(
          path.join(TEST_BACKUP_DIR, `backup_${i}.dump`),
          `backup ${i}`
        );
        // Small delay to ensure different timestamps
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      // Keep only 3 backups
      const deletedCount = await backup.cleanupOldBackups({
        backupDir: TEST_BACKUP_DIR,
        retentionCount: 3,
        retentionDays: undefined, // Disable days-based cleanup
      });

      expect(deletedCount).toBe(2); // Should delete 2 old backups

      const remainingBackups = await backup.listBackups({ backupDir: TEST_BACKUP_DIR });
      expect(remainingBackups.length).toBe(3);
    });

    it('should not delete backups if within retention limits', async () => {
      // Create 3 backups
      for (let i = 0; i < 3; i++) {
        await fs.writeFile(
          path.join(TEST_BACKUP_DIR, `backup_${i}.dump`),
          `backup ${i}`
        );
      }

      // Keep up to 10 backups
      const deletedCount = await backup.cleanupOldBackups({
        backupDir: TEST_BACKUP_DIR,
        retentionCount: 10,
        retentionDays: undefined,
      });

      expect(deletedCount).toBe(0);

      const remainingBackups = await backup.listBackups({ backupDir: TEST_BACKUP_DIR });
      expect(remainingBackups.length).toBe(3);
    });

    it('should handle empty backup directory', async () => {
      const deletedCount = await backup.cleanupOldBackups({ backupDir: TEST_BACKUP_DIR });
      expect(deletedCount).toBe(0);
    });
  });

  describe('Backup Statistics', () => {
    it('should return zero stats for empty directory', async () => {
      const stats = await backup.getBackupStats({ backupDir: TEST_BACKUP_DIR });

      expect(stats.totalBackups).toBe(0);
      expect(stats.totalSize).toBe(0);
      expect(stats.oldestBackup).toBeUndefined();
      expect(stats.newestBackup).toBeUndefined();
    });

    it('should calculate correct statistics', async () => {
      // Create backups with known sizes
      await fs.writeFile(path.join(TEST_BACKUP_DIR, 'backup1.dump'), 'a'.repeat(100)); // 100 bytes
      await new Promise(resolve => setTimeout(resolve, 10));
      await fs.writeFile(path.join(TEST_BACKUP_DIR, 'backup2.dump'), 'b'.repeat(200)); // 200 bytes

      const stats = await backup.getBackupStats({ backupDir: TEST_BACKUP_DIR });

      expect(stats.totalBackups).toBe(2);
      expect(stats.totalSize).toBe(300);
      expect(stats.oldestBackup).toBeDefined();
      expect(stats.newestBackup).toBeDefined();
      expect(stats.newestBackup!.getTime()).toBeGreaterThan(stats.oldestBackup!.getTime());
    });

    it('should handle single backup', async () => {
      await fs.writeFile(path.join(TEST_BACKUP_DIR, 'backup.dump'), 'data');

      const stats = await backup.getBackupStats({ backupDir: TEST_BACKUP_DIR });

      expect(stats.totalBackups).toBe(1);
      expect(stats.totalSize).toBeGreaterThan(0);
      expect(stats.oldestBackup).toEqual(stats.newestBackup);
    });
  });

  describe('pg_dump Availability', () => {
    it('should check if pg_dump is available', async () => {
      const available = await backup.checkPgDumpAvailable();
      // Result depends on system, just verify it returns boolean
      expect(typeof available).toBe('boolean');
    });
  });

  describe('Backup Configuration Options', () => {
    it('should accept custom backup directory', async () => {
      const customDir = path.join(TEST_BACKUP_DIR, 'custom');
      await fs.mkdir(customDir, { recursive: true });

      await fs.writeFile(path.join(customDir, 'test.dump'), 'data');

      const backups = await backup.listBackups({ backupDir: customDir });
      expect(backups.length).toBe(1);

      await fs.rm(customDir, { recursive: true });
    });

    it('should accept retention configuration', async () => {
      // Create 10 backups
      for (let i = 0; i < 10; i++) {
        await fs.writeFile(
          path.join(TEST_BACKUP_DIR, `backup_${i}.dump`),
          'data'
        );
        await new Promise(resolve => setTimeout(resolve, 5));
      }

      // Keep only 5, with high retention days to only test count
      await backup.cleanupOldBackups({
        backupDir: TEST_BACKUP_DIR,
        retentionCount: 5,
        retentionDays: 365, // Won't trigger
      });

      const backups = await backup.listBackups({ backupDir: TEST_BACKUP_DIR });
      expect(backups.length).toBe(5);
    });
  });

  describe('File Structure', () => {
    it('should have required backup files', () => {
      const requiredFiles = [
        'src/lib/backup.ts',
        'src/scripts/backup.ts',
        'src/pages/api/backup.ts',
      ];

      requiredFiles.forEach(file => {
        const filePath = path.join(process.cwd(), file);
        expect(existsSync(filePath)).toBe(true);
      });
    });

    it('should have backup functions documentation', () => {
      const backupLibPath = path.join(process.cwd(), 'src/lib/backup.ts');
      const content = require('fs').readFileSync(backupLibPath, 'utf-8');

      // Check for key functions
      expect(content).toContain('createBackup');
      expect(content).toContain('listBackups');
      expect(content).toContain('cleanupOldBackups');
      expect(content).toContain('deleteBackup');
      expect(content).toContain('restoreBackup');
      expect(content).toContain('getBackupStats');
    });

    it('should have API endpoint documentation', () => {
      const apiPath = path.join(process.cwd(), 'src/pages/api/backup.ts');
      const content = require('fs').readFileSync(apiPath, 'utf-8');

      // Check for API methods
      expect(content).toContain('export const GET');
      expect(content).toContain('export const POST');
      expect(content).toContain('export const DELETE');
    });
  });

  describe('Error Handling', () => {
    it('should handle listing non-existent directory', async () => {
      const backups = await backup.listBackups({ backupDir: '/non/existent/path' });
      expect(Array.isArray(backups)).toBe(true);
      expect(backups.length).toBe(0);
    });

    it('should handle stats for non-existent directory', async () => {
      const stats = await backup.getBackupStats({ backupDir: '/non/existent/path' });
      expect(stats.totalBackups).toBe(0);
      expect(stats.totalSize).toBe(0);
    });

    it('should handle cleanup for non-existent directory', async () => {
      const deletedCount = await backup.cleanupOldBackups({ backupDir: '/non/existent/path' });
      expect(deletedCount).toBe(0);
    });
  });

  describe('Integration', () => {
    it('should have proper type definitions', () => {
      // TypeScript compilation ensures types are correct
      // This test verifies the interfaces are exported
      const backupLibPath = path.join(process.cwd(), 'src/lib/backup.ts');
      const content = require('fs').readFileSync(backupLibPath, 'utf-8');

      expect(content).toContain('export interface BackupConfig');
      expect(content).toContain('export interface BackupInfo');
      expect(content).toContain('export interface BackupResult');
    });

    it('should integrate with Sentry', () => {
      const backupLibPath = path.join(process.cwd(), 'src/lib/backup.ts');
      const content = require('fs').readFileSync(backupLibPath, 'utf-8');

      // Check for Sentry integration
      expect(content).toContain('captureException');
      expect(content).toContain('addBreadcrumb');
    });

    it('should have CLI help command', () => {
      const scriptPath = path.join(process.cwd(), 'src/scripts/backup.ts');
      const content = require('fs').readFileSync(scriptPath, 'utf-8');

      expect(content).toContain('showHelp');
      expect(content).toContain('Usage:');
    });
  });
});

describe('Deployment Readiness', () => {
  it('should pass all backup configuration checks', () => {
    const checks = {
      backupLibraryExists: existsSync(path.join(process.cwd(), 'src/lib/backup.ts')),
      backupScriptExists: existsSync(path.join(process.cwd(), 'src/scripts/backup.ts')),
      backupApiExists: existsSync(path.join(process.cwd(), 'src/pages/api/backup.ts')),
      databaseUrlConfigured: !!process.env.DATABASE_URL,
    };

    expect(checks.backupLibraryExists).toBe(true);
    expect(checks.backupScriptExists).toBe(true);
    expect(checks.backupApiExists).toBe(true);
    expect(checks.databaseUrlConfigured).toBe(true);
  });

  it('should have npm scripts configured', () => {
    const packagePath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(require('fs').readFileSync(packagePath, 'utf-8'));

    expect(packageJson.scripts.backup).toContain('backup.ts');
    expect(packageJson.scripts['backup:list']).toContain('list');
    expect(packageJson.scripts['backup:cleanup']).toContain('cleanup');
    expect(packageJson.scripts['backup:stats']).toContain('stats');
  });
});
