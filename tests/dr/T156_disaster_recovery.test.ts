/**
 * T156: Disaster Recovery Procedures - Comprehensive Tests
 *
 * Tests for disaster recovery documentation, automation scripts,
 * and verification tools.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync } from 'fs';
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

describe('T156: Disaster Recovery Procedures', () => {
  describe('1. DR Documentation', () => {
    it('should have disaster recovery runbook', () => {
      const runbookPath = path.join(process.cwd(), 'docs/DISASTER_RECOVERY_RUNBOOK.md');
      expect(existsSync(runbookPath)).toBe(true);
    });

    it('should have comprehensive DR runbook content', async () => {
      const runbookPath = path.join(process.cwd(), 'docs/DISASTER_RECOVERY_RUNBOOK.md');
      const content = await fs.readFile(runbookPath, 'utf-8');

      // Check for key sections
      expect(content).toContain('# Disaster Recovery Runbook');
      expect(content).toContain('## Emergency Contacts');
      expect(content).toContain('## Recovery Objectives');
      expect(content).toContain('## Disaster Scenarios');
      expect(content).toContain('## Recovery Procedures');
      expect(content).toContain('## System Dependencies');
      expect(content).toContain('## Data Recovery');
      expect(content).toContain('## Service Restoration');
      expect(content).toContain('## Validation');
      expect(content).toContain('## Post-Recovery Actions');
      expect(content).toContain('## DR Testing Schedule');
    });

    it('should include RTO and RPO targets', async () => {
      const runbookPath = path.join(process.cwd(), 'docs/DISASTER_RECOVERY_RUNBOOK.md');
      const content = await fs.readFile(runbookPath, 'utf-8');

      expect(content).toContain('RTO');
      expect(content).toContain('RPO');
      expect(content).toContain('Recovery Time Objective');
      expect(content).toContain('Recovery Point Objective');
    });

    it('should include emergency contact information', async () => {
      const runbookPath = path.join(process.cwd(), 'docs/DISASTER_RECOVERY_RUNBOOK.md');
      const content = await fs.readFile(runbookPath, 'utf-8');

      expect(content).toContain('Emergency Contacts');
      expect(content).toContain('Cloudflare');
      expect(content).toContain('Stripe');
      expect(content).toContain('Neon');
      expect(content).toContain('Upstash');
    });

    it('should document disaster scenarios', async () => {
      const runbookPath = path.join(process.cwd(), 'docs/DISASTER_RECOVERY_RUNBOOK.md');
      const content = await fs.readFile(runbookPath, 'utf-8');

      // Check for different disaster scenarios
      expect(content).toContain('Database Failure');
      expect(content).toContain('Application Server Failure');
      expect(content).toContain('Redis Failure');
      expect(content).toContain('Data Corruption');
    });

    it('should include recovery procedures', async () => {
      const runbookPath = path.join(process.cwd(), 'docs/DISASTER_RECOVERY_RUNBOOK.md');
      const content = await fs.readFile(runbookPath, 'utf-8');

      // Check for recovery steps
      expect(content).toContain('pg_restore');
      expect(content).toContain('backup');
      expect(content).toContain('DATABASE_URL');
    });

    it('should have post-recovery validation checklist', async () => {
      const runbookPath = path.join(process.cwd(), 'docs/DISASTER_RECOVERY_RUNBOOK.md');
      const content = await fs.readFile(runbookPath, 'utf-8');

      expect(content).toContain('Validation');
      expect(content).toContain('health');
      expect(content).toContain('test');
    });
  });

  describe('2. DR Automation Script', () => {
    it('should have DR automation script', () => {
      const drScriptPath = path.join(process.cwd(), 'src/scripts/dr.ts');
      expect(existsSync(drScriptPath)).toBe(true);
    });

    it('should export required functions', async () => {
      const drScriptPath = path.join(process.cwd(), 'src/scripts/dr.ts');
      const content = await fs.readFile(drScriptPath, 'utf-8');

      // Check for main functions
      expect(content).toContain('runDRCheck');
      expect(content).toContain('runValidation');
      expect(content).toContain('runVerification');
      expect(content).toContain('showContacts');
    });

    it('should have check functionality', async () => {
      const drScriptPath = path.join(process.cwd(), 'src/scripts/dr.ts');
      const content = await fs.readFile(drScriptPath, 'utf-8');

      expect(content).toContain('checkEnvironmentVariables');
      expect(content).toContain('checkBackupSystem');
      expect(content).toContain('checkBackupFiles');
      expect(content).toContain('checkPostgreSQLTools');
      expect(content).toContain('checkDatabaseConnectivity');
      expect(content).toContain('checkRedisConnectivity');
      expect(content).toContain('checkDRDocumentation');
      expect(content).toContain('checkMonitoring');
    });

    it('should have validation functionality', async () => {
      const drScriptPath = path.join(process.cwd(), 'src/scripts/dr.ts');
      const content = await fs.readFile(drScriptPath, 'utf-8');

      expect(content).toContain('checkBackupDirectory');
      expect(content).toContain('checkLatestBackup');
      expect(content).toContain('checkPgRestore');
      expect(content).toContain('checkDatabaseCredentials');
    });

    it('should have verification functionality', async () => {
      const drScriptPath = path.join(process.cwd(), 'src/scripts/dr.ts');
      const content = await fs.readFile(drScriptPath, 'utf-8');

      expect(content).toContain('verifyDatabase');
      expect(content).toContain('verifyRedis');
      expect(content).toContain('verifyHealthEndpoint');
    });

    it('should integrate with backup system', async () => {
      const drScriptPath = path.join(process.cwd(), 'src/scripts/dr.ts');
      const content = await fs.readFile(drScriptPath, 'utf-8');

      expect(content).toContain("from '../lib/backup'");
      expect(content).toContain('listBackups');
      expect(content).toContain('getBackupStats');
      expect(content).toContain('checkPgDumpAvailable');
    });

    it('should handle command-line arguments', async () => {
      const drScriptPath = path.join(process.cwd(), 'src/scripts/dr.ts');
      const content = await fs.readFile(drScriptPath, 'utf-8');

      expect(content).toContain('process.argv[2]');
      expect(content).toContain("case 'check'");
      expect(content).toContain("case 'validate'");
      expect(content).toContain("case 'verify'");
      expect(content).toContain("case 'contacts'");
      expect(content).toContain("case 'help'");
    });

    it('should have help command', async () => {
      const drScriptPath = path.join(process.cwd(), 'src/scripts/dr.ts');
      const content = await fs.readFile(drScriptPath, 'utf-8');

      expect(content).toContain('showHelp');
      expect(content).toContain('Usage:');
    });
  });

  describe('3. Environment Variable Checks', () => {
    it('should check for DATABASE_URL', async () => {
      const drScriptPath = path.join(process.cwd(), 'src/scripts/dr.ts');
      const content = await fs.readFile(drScriptPath, 'utf-8');

      expect(content).toContain('DATABASE_URL');
      expect(content).toContain('process.env.DATABASE_URL');
    });

    it('should check for REDIS_URL', async () => {
      const drScriptPath = path.join(process.cwd(), 'src/scripts/dr.ts');
      const content = await fs.readFile(drScriptPath, 'utf-8');

      expect(content).toContain('REDIS_URL');
      expect(content).toContain('process.env.REDIS_URL');
    });

    it('should support optional BACKUP_DIR', async () => {
      const drScriptPath = path.join(process.cwd(), 'src/scripts/dr.ts');
      const content = await fs.readFile(drScriptPath, 'utf-8');

      expect(content).toContain('BACKUP_DIR');
    });

    it('should support optional SENTRY_DSN', async () => {
      const drScriptPath = path.join(process.cwd(), 'src/scripts/dr.ts');
      const content = await fs.readFile(drScriptPath, 'utf-8');

      expect(content).toContain('SENTRY_DSN');
    });
  });

  describe('4. DR Check Results', () => {
    it('should have CheckResult interface', async () => {
      const drScriptPath = path.join(process.cwd(), 'src/scripts/dr.ts');
      const content = await fs.readFile(drScriptPath, 'utf-8');

      expect(content).toContain('interface CheckResult');
      expect(content).toContain('name: string');
      expect(content).toContain("status: 'pass' | 'fail' | 'warn'");
      expect(content).toContain('message: string');
      expect(content).toContain('critical: boolean');
    });

    it('should track critical checks', async () => {
      const drScriptPath = path.join(process.cwd(), 'src/scripts/dr.ts');
      const content = await fs.readFile(drScriptPath, 'utf-8');

      expect(content).toContain('critical: true');
      expect(content).toContain('criticalFailed');
    });

    it('should provide summary reporting', async () => {
      const drScriptPath = path.join(process.cwd(), 'src/scripts/dr.ts');
      const content = await fs.readFile(drScriptPath, 'utf-8');

      expect(content).toContain('passed');
      expect(content).toContain('failed');
      expect(content).toContain('warnings');
      expect(content).toContain('Summary:');
    });
  });

  describe('5. Backup System Integration', () => {
    it('should verify backup library exists', () => {
      const backupLibPath = path.join(process.cwd(), 'src/lib/backup.ts');
      expect(existsSync(backupLibPath)).toBe(true);
    });

    it('should verify backup script exists', () => {
      const backupScriptPath = path.join(process.cwd(), 'src/scripts/backup.ts');
      expect(existsSync(backupScriptPath)).toBe(true);
    });

    it('should check backup system in DR checks', async () => {
      const drScriptPath = path.join(process.cwd(), 'src/scripts/dr.ts');
      const content = await fs.readFile(drScriptPath, 'utf-8');

      expect(content).toContain('checkBackupSystem');
      expect(content).toContain('src/lib/backup.ts');
      expect(content).toContain('src/scripts/backup.ts');
    });

    it('should check backup files in DR checks', async () => {
      const drScriptPath = path.join(process.cwd(), 'src/scripts/dr.ts');
      const content = await fs.readFile(drScriptPath, 'utf-8');

      expect(content).toContain('checkBackupFiles');
      expect(content).toContain('listBackups');
      expect(content).toContain('getBackupStats');
    });
  });

  describe('6. PostgreSQL Tools Check', () => {
    it('should check for pg_dump availability', async () => {
      const drScriptPath = path.join(process.cwd(), 'src/scripts/dr.ts');
      const content = await fs.readFile(drScriptPath, 'utf-8');

      expect(content).toContain('checkPgDumpAvailable');
      expect(content).toContain('pg_dump');
    });

    it('should check PostgreSQL version', async () => {
      const drScriptPath = path.join(process.cwd(), 'src/scripts/dr.ts');
      const content = await fs.readFile(drScriptPath, 'utf-8');

      expect(content).toContain('pg_dump --version');
    });

    it('should handle missing PostgreSQL tools', async () => {
      const drScriptPath = path.join(process.cwd(), 'src/scripts/dr.ts');
      const content = await fs.readFile(drScriptPath, 'utf-8');

      expect(content).toContain('pg_dump/pg_restore not found');
      expect(content).toContain('Install PostgreSQL client tools');
    });
  });

  describe('7. Database Connectivity Check', () => {
    it('should test database connection', async () => {
      const drScriptPath = path.join(process.cwd(), 'src/scripts/dr.ts');
      const content = await fs.readFile(drScriptPath, 'utf-8');

      expect(content).toContain('checkDatabaseConnectivity');
      expect(content).toContain('psql');
      expect(content).toContain('SELECT 1');
    });

    it('should handle database connection failures', async () => {
      const drScriptPath = path.join(process.cwd(), 'src/scripts/dr.ts');
      const content = await fs.readFile(drScriptPath, 'utf-8');

      expect(content).toContain('Cannot connect to database');
    });
  });

  describe('8. Redis Connectivity Check', () => {
    it('should test Redis connection', async () => {
      const drScriptPath = path.join(process.cwd(), 'src/scripts/dr.ts');
      const content = await fs.readFile(drScriptPath, 'utf-8');

      expect(content).toContain('checkRedisConnectivity');
      expect(content).toContain('redis-cli');
      expect(content).toContain('PING');
    });

    it('should mark Redis as non-critical', async () => {
      const drScriptPath = path.join(process.cwd(), 'src/scripts/dr.ts');
      const content = await fs.readFile(drScriptPath, 'utf-8');

      // Redis connectivity should be non-critical
      const lines = content.split('\n');
      let inRedisCheck = false;
      let foundNonCritical = false;

      for (const line of lines) {
        if (line.includes('checkRedisConnectivity')) {
          inRedisCheck = true;
        }
        if (inRedisCheck && line.includes('critical: false')) {
          foundNonCritical = true;
          break;
        }
      }

      expect(foundNonCritical).toBe(true);
    });
  });

  describe('9. Contact Information', () => {
    it('should display emergency contacts', async () => {
      const drScriptPath = path.join(process.cwd(), 'src/scripts/dr.ts');
      const content = await fs.readFile(drScriptPath, 'utf-8');

      expect(content).toContain('showContacts');
      expect(content).toContain('Emergency Contacts');
    });

    it('should include vendor contact information', async () => {
      const drScriptPath = path.join(process.cwd(), 'src/scripts/dr.ts');
      const content = await fs.readFile(drScriptPath, 'utf-8');

      expect(content).toContain('Cloudflare');
      expect(content).toContain('Stripe');
      expect(content).toContain('Neon Support');
      expect(content).toContain('Upstash Support');
    });

    it('should reference DR runbook', async () => {
      const drScriptPath = path.join(process.cwd(), 'src/scripts/dr.ts');
      const content = await fs.readFile(drScriptPath, 'utf-8');

      expect(content).toContain('DISASTER_RECOVERY_RUNBOOK.md');
    });
  });

  describe('10. Error Handling', () => {
    it('should handle errors gracefully', async () => {
      const drScriptPath = path.join(process.cwd(), 'src/scripts/dr.ts');
      const content = await fs.readFile(drScriptPath, 'utf-8');

      expect(content).toContain('try {');
      expect(content).toContain('catch');
      expect(content).toContain('error instanceof Error');
    });

    it('should exit with error code on failure', async () => {
      const drScriptPath = path.join(process.cwd(), 'src/scripts/dr.ts');
      const content = await fs.readFile(drScriptPath, 'utf-8');

      expect(content).toContain('process.exit(1)');
    });

    it('should handle unknown commands', async () => {
      const drScriptPath = path.join(process.cwd(), 'src/scripts/dr.ts');
      const content = await fs.readFile(drScriptPath, 'utf-8');

      expect(content).toContain('Unknown command');
      expect(content).toContain('default:');
    });
  });

  describe('11. File Structure', () => {
    it('should have DR documentation in docs folder', () => {
      const docsPath = path.join(process.cwd(), 'docs');
      expect(existsSync(docsPath)).toBe(true);

      const runbookPath = path.join(docsPath, 'DISASTER_RECOVERY_RUNBOOK.md');
      expect(existsSync(runbookPath)).toBe(true);
    });

    it('should have DR script in scripts folder', () => {
      const scriptsPath = path.join(process.cwd(), 'src/scripts');
      expect(existsSync(scriptsPath)).toBe(true);

      const drScriptPath = path.join(scriptsPath, 'dr.ts');
      expect(existsSync(drScriptPath)).toBe(true);
    });

    it('should have backup system files', () => {
      const backupLibPath = path.join(process.cwd(), 'src/lib/backup.ts');
      const backupScriptPath = path.join(process.cwd(), 'src/scripts/backup.ts');

      expect(existsSync(backupLibPath)).toBe(true);
      expect(existsSync(backupScriptPath)).toBe(true);
    });
  });

  describe('12. TypeScript Compatibility', () => {
    it('should have proper TypeScript syntax', async () => {
      const drScriptPath = path.join(process.cwd(), 'src/scripts/dr.ts');
      const content = await fs.readFile(drScriptPath, 'utf-8');

      expect(content).toContain('interface');
      expect(content).toContain('Promise<');
      expect(content).toContain(': string');
      expect(content).toContain(': boolean');
    });

    it('should have type annotations for functions', async () => {
      const drScriptPath = path.join(process.cwd(), 'src/scripts/dr.ts');
      const content = await fs.readFile(drScriptPath, 'utf-8');

      expect(content).toContain('Promise<void>');
      expect(content).toContain('Promise<CheckResult>');
      expect(content).toContain('Promise<boolean>');
    });

    it('should import required modules', async () => {
      const drScriptPath = path.join(process.cwd(), 'src/scripts/dr.ts');
      const content = await fs.readFile(drScriptPath, 'utf-8');

      expect(content).toContain("import { config } from 'dotenv'");
      expect(content).toContain("import { exec } from 'child_process'");
      expect(content).toContain("import { promisify } from 'util'");
      expect(content).toContain("import fs from 'fs/promises'");
      expect(content).toContain("import path from 'path'");
    });
  });

  describe('13. DR Runbook Content', () => {
    it('should document database recovery steps', async () => {
      const runbookPath = path.join(process.cwd(), 'docs/DISASTER_RECOVERY_RUNBOOK.md');
      const content = await fs.readFile(runbookPath, 'utf-8');

      expect(content).toContain('Database Recovery');
      expect(content).toContain('Step 1');
      expect(content).toContain('Step 2');
    });

    it('should document application recovery steps', async () => {
      const runbookPath = path.join(process.cwd(), 'docs/DISASTER_RECOVERY_RUNBOOK.md');
      const content = await fs.readFile(runbookPath, 'utf-8');

      expect(content).toContain('Application Recovery');
    });

    it('should include system dependencies', async () => {
      const runbookPath = path.join(process.cwd(), 'docs/DISASTER_RECOVERY_RUNBOOK.md');
      const content = await fs.readFile(runbookPath, 'utf-8');

      expect(content).toContain('Dependencies');
    });

    it('should include testing procedures', async () => {
      const runbookPath = path.join(process.cwd(), 'docs/DISASTER_RECOVERY_RUNBOOK.md');
      const content = await fs.readFile(runbookPath, 'utf-8');

      expect(content).toContain('Testing');
    });
  });

  describe('14. Monitoring Integration', () => {
    it('should check for Sentry configuration', async () => {
      const drScriptPath = path.join(process.cwd(), 'src/scripts/dr.ts');
      const content = await fs.readFile(drScriptPath, 'utf-8');

      expect(content).toContain('checkMonitoring');
      expect(content).toContain('SENTRY_DSN');
    });

    it('should mark monitoring as non-critical', async () => {
      const drScriptPath = path.join(process.cwd(), 'src/scripts/dr.ts');
      const content = await fs.readFile(drScriptPath, 'utf-8');

      // Monitoring should be recommended but non-critical
      const lines = content.split('\n');
      let inMonitoringCheck = false;
      let foundNonCritical = false;

      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('checkMonitoring')) {
          inMonitoringCheck = true;
        }
        if (inMonitoringCheck && lines[i].includes('critical: false')) {
          foundNonCritical = true;
          break;
        }
      }

      expect(foundNonCritical).toBe(true);
    });
  });

  describe('15. Deployment Readiness', () => {
    it('should verify all DR components exist', () => {
      const files = [
        'docs/DISASTER_RECOVERY_RUNBOOK.md',
        'src/scripts/dr.ts',
        'src/lib/backup.ts',
        'src/scripts/backup.ts',
      ];

      for (const file of files) {
        const filePath = path.join(process.cwd(), file);
        expect(existsSync(filePath)).toBe(true);
      }
    });

    it('should have executable script header', async () => {
      const drScriptPath = path.join(process.cwd(), 'src/scripts/dr.ts');
      const content = await fs.readFile(drScriptPath, 'utf-8');

      expect(content.startsWith('#!/usr/bin/env tsx')).toBe(true);
    });

    it('should have usage documentation', async () => {
      const drScriptPath = path.join(process.cwd(), 'src/scripts/dr.ts');
      const content = await fs.readFile(drScriptPath, 'utf-8');

      expect(content).toContain('Usage:');
      expect(content).toContain('tsx src/scripts/dr.ts');
    });

    it('should document environment variables', async () => {
      const drScriptPath = path.join(process.cwd(), 'src/scripts/dr.ts');
      const content = await fs.readFile(drScriptPath, 'utf-8');

      expect(content).toContain('Environment Variables:');
      expect(content).toContain('DATABASE_URL');
      expect(content).toContain('REDIS_URL');
    });
  });
});
