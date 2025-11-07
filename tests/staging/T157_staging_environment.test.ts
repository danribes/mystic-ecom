/**
 * T157: Staging Environment Setup - Comprehensive Tests
 *
 * Tests for staging environment configuration, scripts, and deployment utilities.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync } from 'fs';
import fs from 'fs/promises';
import path from 'path';

describe('T157: Staging Environment Setup', () => {
  describe('1. Environment Configuration', () => {
    it('should have staging environment template', () => {
      const envStagingExample = path.join(process.cwd(), '.env.staging.example');
      expect(existsSync(envStagingExample)).toBe(true);
    });

    it('should have required environment variables in template', async () => {
      const envStagingExample = path.join(process.cwd(), '.env.staging.example');
      const content = await fs.readFile(envStagingExample, 'utf-8');

      // Core variables
      expect(content).toContain('NODE_ENV=staging');
      expect(content).toContain('PUBLIC_SITE_URL=');
      expect(content).toContain('DATABASE_URL=');
      expect(content).toContain('REDIS_URL=');
    });

    it('should specify staging-specific configuration', async () => {
      const envStagingExample = path.join(process.cwd(), '.env.staging.example');
      const content = await fs.readFile(envStagingExample, 'utf-8');

      // Staging-specific settings
      expect(content).toContain('NODE_ENV=staging');
      expect(content).toContain('ENABLE_DEBUG_MODE=true');
      expect(content).toContain('ENABLE_VERBOSE_LOGGING=true');
    });

    it('should use test mode for external services', async () => {
      const envStagingExample = path.join(process.cwd(), '.env.staging.example');
      const content = await fs.readFile(envStagingExample, 'utf-8');

      expect(content).toContain('sk_test_');
      expect(content).toContain('pk_test_');
      expect(content).toContain('PAYMENT_TEST_MODE=true');
      expect(content).toContain('EMAIL_TEST_MODE=true');
    });

    it('should never allow BYPASS_ADMIN_AUTH even in staging', async () => {
      const envStagingExample = path.join(process.cwd(), '.env.staging.example');
      const content = await fs.readFile(envStagingExample, 'utf-8');

      expect(content).toContain('BYPASS_ADMIN_AUTH=false');
    });

    it('should have more permissive rate limiting for testing', async () => {
      const envStagingExample = path.join(process.cwd(), '.env.staging.example');
      const content = await fs.readFile(envStagingExample, 'utf-8');

      expect(content).toContain('RATE_LIMIT_MAX_REQUESTS=');
      expect(content).toContain('RATE_LIMIT_WINDOW_MS=');
    });

    it('should configure staging backup directory', async () => {
      const envStagingExample = path.join(process.cwd(), '.env.staging.example');
      const content = await fs.readFile(envStagingExample, 'utf-8');

      expect(content).toContain('BACKUP_DIR=./backups/staging');
      expect(content).toContain('BACKUP_RETENTION_DAYS=7');
      expect(content).toContain('BACKUP_RETENTION_COUNT=5');
    });
  });

  describe('2. Staging Setup Script', () => {
    it('should have staging setup script', () => {
      const setupScript = path.join(process.cwd(), 'src/scripts/staging-setup.ts');
      expect(existsSync(setupScript)).toBe(true);
    });

    it('should export required functions', async () => {
      const setupScript = path.join(process.cwd(), 'src/scripts/staging-setup.ts');
      const content = await fs.readFile(setupScript, 'utf-8');

      expect(content).toContain('initStaging');
      expect(content).toContain('seedStaging');
      expect(content).toContain('resetStaging');
      expect(content).toContain('checkStaging');
    });

    it('should have environment variable checks', async () => {
      const setupScript = path.join(process.cwd(), 'src/scripts/staging-setup.ts');
      const content = await fs.readFile(setupScript, 'utf-8');

      expect(content).toContain('checkEnvironment');
      expect(content).toContain('DATABASE_URL');
      expect(content).toContain('REDIS_URL');
      expect(content).toContain('NODE_ENV');
    });

    it('should check database connectivity', async () => {
      const setupScript = path.join(process.cwd(), 'src/scripts/staging-setup.ts');
      const content = await fs.readFile(setupScript, 'utf-8');

      expect(content).toContain('checkDatabase');
      expect(content).toContain('psql');
      expect(content).toContain('SELECT 1');
    });

    it('should verify database is staging', async () => {
      const setupScript = path.join(process.cwd(), 'src/scripts/staging-setup.ts');
      const content = await fs.readFile(setupScript, 'utf-8');

      expect(content).toContain('staging');
      expect(content).toContain('test');
      expect(content).toContain("doesn't appear to be a staging database");
    });

    it('should check Redis connectivity', async () => {
      const setupScript = path.join(process.cwd(), 'src/scripts/staging-setup.ts');
      const content = await fs.readFile(setupScript, 'utf-8');

      expect(content).toContain('checkRedis');
      expect(content).toContain('redis-cli');
      expect(content).toContain('PING');
    });

    it('should run database migrations', async () => {
      const setupScript = path.join(process.cwd(), 'src/scripts/staging-setup.ts');
      const content = await fs.readFile(setupScript, 'utf-8');

      expect(content).toContain('runMigrations');
      expect(content).toContain('db:migrate');
    });

    it('should create backup directory', async () => {
      const setupScript = path.join(process.cwd(), 'src/scripts/staging-setup.ts');
      const content = await fs.readFile(setupScript, 'utf-8');

      expect(content).toContain('createBackupDirectory');
      expect(content).toContain('BACKUP_DIR');
      expect(content).toContain('backups/staging');
    });

    it('should verify external services', async () => {
      const setupScript = path.join(process.cwd(), 'src/scripts/staging-setup.ts');
      const content = await fs.readFile(setupScript, 'utf-8');

      expect(content).toContain('verifyExternalServices');
      expect(content).toContain('STRIPE_SECRET_KEY');
      expect(content).toContain('RESEND_API_KEY');
      expect(content).toContain('SENTRY_DSN');
    });

    it('should setup monitoring', async () => {
      const setupScript = path.join(process.cwd(), 'src/scripts/staging-setup.ts');
      const content = await fs.readFile(setupScript, 'utf-8');

      expect(content).toContain('setupMonitoring');
      expect(content).toContain('Sentry');
    });

    it('should have seed functionality', async () => {
      const setupScript = path.join(process.cwd(), 'src/scripts/staging-setup.ts');
      const content = await fs.readFile(setupScript, 'utf-8');

      expect(content).toContain('seedStaging');
      expect(content).toContain('test@example.com');
      expect(content).toContain('admin@example.com');
    });

    it('should have reset functionality with safety checks', async () => {
      const setupScript = path.join(process.cwd(), 'src/scripts/staging-setup.ts');
      const content = await fs.readFile(setupScript, 'utf-8');

      expect(content).toContain('resetStaging');
      expect(content).toContain('Can only reset staging environment');
      expect(content).toContain("doesn't appear to be a staging database");
      expect(content).toContain('DROP SCHEMA public CASCADE');
    });

    it('should have command-line interface', async () => {
      const setupScript = path.join(process.cwd(), 'src/scripts/staging-setup.ts');
      const content = await fs.readFile(setupScript, 'utf-8');

      expect(content).toContain("case 'init'");
      expect(content).toContain("case 'seed'");
      expect(content).toContain("case 'reset'");
      expect(content).toContain("case 'check'");
      expect(content).toContain("case 'help'");
    });

    it('should have executable shebang', async () => {
      const setupScript = path.join(process.cwd(), 'src/scripts/staging-setup.ts');
      const content = await fs.readFile(setupScript, 'utf-8');

      expect(content.startsWith('#!/usr/bin/env tsx')).toBe(true);
    });
  });

  describe('3. Staging Health Check Script', () => {
    it('should have health check script', () => {
      const healthScript = path.join(process.cwd(), 'src/scripts/staging-health.ts');
      expect(existsSync(healthScript)).toBe(true);
    });

    it('should export health check functions', async () => {
      const healthScript = path.join(process.cwd(), 'src/scripts/staging-health.ts');
      const content = await fs.readFile(healthScript, 'utf-8');

      expect(content).toContain('runHealthChecks');
      expect(content).toContain('checkDatabase');
      expect(content).toContain('checkRedis');
      expect(content).toContain('checkAPI');
      expect(content).toContain('checkExternalServices');
      expect(content).toContain('checkStorage');
    });

    it('should have HealthCheck interface', async () => {
      const healthScript = path.join(process.cwd(), 'src/scripts/staging-health.ts');
      const content = await fs.readFile(healthScript, 'utf-8');

      expect(content).toContain('interface HealthCheck');
      expect(content).toContain('component: string');
      expect(content).toContain("status: 'healthy' | 'unhealthy' | 'degraded'");
      expect(content).toContain('message: string');
      expect(content).toContain('duration: number');
    });

    it('should check database performance', async () => {
      const healthScript = path.join(process.cwd(), 'src/scripts/staging-health.ts');
      const content = await fs.readFile(healthScript, 'utf-8');

      expect(content).toContain('checkDatabase');
      expect(content).toContain('SELECT COUNT(*)');
      expect(content).toContain('queryDuration');
    });

    it('should check Redis performance', async () => {
      const healthScript = path.join(process.cwd(), 'src/scripts/staging-health.ts');
      const content = await fs.readFile(healthScript, 'utf-8');

      expect(content).toContain('checkRedis');
      expect(content).toContain('SET health:check');
      expect(content).toContain('GET health:check');
      expect(content).toContain('perfDuration');
    });

    it('should check API endpoints', async () => {
      const healthScript = path.join(process.cwd(), 'src/scripts/staging-health.ts');
      const content = await fs.readFile(healthScript, 'utf-8');

      expect(content).toContain('checkAPI');
      expect(content).toContain('/api/health');
      expect(content).toContain('fetch');
    });

    it('should check external services configuration', async () => {
      const healthScript = path.join(process.cwd(), 'src/scripts/staging-health.ts');
      const content = await fs.readFile(healthScript, 'utf-8');

      expect(content).toContain('checkExternalServices');
      expect(content).toContain('Stripe');
      expect(content).toContain('Resend');
      expect(content).toContain('Sentry');
      expect(content).toContain('Cloudflare Stream');
    });

    it('should check storage and backups', async () => {
      const healthScript = path.join(process.cwd(), 'src/scripts/staging-health.ts');
      const content = await fs.readFile(healthScript, 'utf-8');

      expect(content).toContain('checkStorage');
      expect(content).toContain('BACKUP_DIR');
      expect(content).toContain('src/lib/backup.ts');
      expect(content).toContain('src/scripts/backup.ts');
    });

    it('should support watch mode', async () => {
      const healthScript = path.join(process.cwd(), 'src/scripts/staging-health.ts');
      const content = await fs.readFile(healthScript, 'utf-8');

      expect(content).toContain('--watch');
      expect(content).toContain('while (true)');
    });

    it('should support JSON output', async () => {
      const healthScript = path.join(process.cwd(), 'src/scripts/staging-health.ts');
      const content = await fs.readFile(healthScript, 'utf-8');

      expect(content).toContain('--json');
      expect(content).toContain('JSON.stringify');
    });

    it('should support component-specific checks', async () => {
      const healthScript = path.join(process.cwd(), 'src/scripts/staging-health.ts');
      const content = await fs.readFile(healthScript, 'utf-8');

      expect(content).toContain('--component=');
      expect(content).toContain("component === 'db'");
      expect(content).toContain("component === 'redis'");
      expect(content).toContain("component === 'api'");
    });
  });

  describe('4. Staging Deployment Script', () => {
    it('should have deployment script', () => {
      const deployScript = path.join(process.cwd(), 'src/scripts/staging-deploy.ts');
      expect(existsSync(deployScript)).toBe(true);
    });

    it('should export deployment functions', async () => {
      const deployScript = path.join(process.cwd(), 'src/scripts/staging-deploy.ts');
      const content = await fs.readFile(deployScript, 'utf-8');

      expect(content).toContain('deployStaging');
      expect(content).toContain('rollbackStaging');
      expect(content).toContain('checkStatus');
    });

    it('should have deployment steps', async () => {
      const deployScript = path.join(process.cwd(), 'src/scripts/staging-deploy.ts');
      const content = await fs.readFile(deployScript, 'utf-8');

      expect(content).toContain('Pre-deployment checks');
      expect(content).toContain('Build application');
      expect(content).toContain('Run tests');
      expect(content).toContain('Deploy to Cloudflare Pages');
      expect(content).toContain('Run smoke tests');
      expect(content).toContain('Update deployment record');
    });

    it('should run pre-deployment checks', async () => {
      const deployScript = path.join(process.cwd(), 'src/scripts/staging-deploy.ts');
      const content = await fs.readFile(deployScript, 'utf-8');

      expect(content).toContain('preDeploymentChecks');
      expect(content).toContain('git rev-parse --abbrev-ref HEAD');
      expect(content).toContain('git status --porcelain');
    });

    it('should build application', async () => {
      const deployScript = path.join(process.cwd(), 'src/scripts/staging-deploy.ts');
      const content = await fs.readFile(deployScript, 'utf-8');

      expect(content).toContain('npm run build');
    });

    it('should run tests before deployment', async () => {
      const deployScript = path.join(process.cwd(), 'src/scripts/staging-deploy.ts');
      const content = await fs.readFile(deployScript, 'utf-8');

      expect(content).toContain('npm test');
    });

    it('should run smoke tests after deployment', async () => {
      const deployScript = path.join(process.cwd(), 'src/scripts/staging-deploy.ts');
      const content = await fs.readFile(deployScript, 'utf-8');

      expect(content).toContain('runSmokeTests');
      expect(content).toContain('/api/health');
    });

    it('should record deployments', async () => {
      const deployScript = path.join(process.cwd(), 'src/scripts/staging-deploy.ts');
      const content = await fs.readFile(deployScript, 'utf-8');

      expect(content).toContain('recordDeployment');
      expect(content).toContain('.deployments');
      expect(content).toContain('staging-latest.json');
    });

    it('should support rollback', async () => {
      const deployScript = path.join(process.cwd(), 'src/scripts/staging-deploy.ts');
      const content = await fs.readFile(deployScript, 'utf-8');

      expect(content).toContain('rollbackStaging');
      expect(content).toContain('deployment history');
    });

    it('should have command-line interface', async () => {
      const deployScript = path.join(process.cwd(), 'src/scripts/staging-deploy.ts');
      const content = await fs.readFile(deployScript, 'utf-8');

      expect(content).toContain("case 'deploy'");
      expect(content).toContain("case 'rollback'");
      expect(content).toContain("case 'status'");
      expect(content).toContain("case 'logs'");
    });
  });

  describe('5. Docker Configuration', () => {
    it('should have Docker Compose file for staging', () => {
      const dockerComposeStaging = path.join(process.cwd(), 'docker-compose.staging.yml');
      expect(existsSync(dockerComposeStaging)).toBe(true);
    });

    it('should define PostgreSQL service', async () => {
      const dockerComposeStaging = path.join(process.cwd(), 'docker-compose.staging.yml');
      const content = await fs.readFile(dockerComposeStaging, 'utf-8');

      expect(content).toContain('postgres-staging');
      expect(content).toContain('postgres:15-alpine');
      expect(content).toContain('POSTGRES_DB: spirituality_staging');
      expect(content).toContain('POSTGRES_USER: staging_user');
    });

    it('should define Redis service', async () => {
      const dockerComposeStaging = path.join(process.cwd(), 'docker-compose.staging.yml');
      const content = await fs.readFile(dockerComposeStaging, 'utf-8');

      expect(content).toContain('redis-staging');
      expect(content).toContain('redis:7-alpine');
      expect(content).toContain('staging_redis_password');
    });

    it('should define application service', async () => {
      const dockerComposeStaging = path.join(process.cwd(), 'docker-compose.staging.yml');
      const content = await fs.readFile(dockerComposeStaging, 'utf-8');

      expect(content).toContain('app-staging');
      expect(content).toContain('NODE_ENV: staging');
    });

    it('should configure health checks', async () => {
      const dockerComposeStaging = path.join(process.cwd(), 'docker-compose.staging.yml');
      const content = await fs.readFile(dockerComposeStaging, 'utf-8');

      expect(content).toContain('healthcheck:');
      expect(content).toContain('pg_isready');
      expect(content).toContain('redis-cli');
      expect(content).toContain('/api/health');
    });

    it('should use different ports than production', async () => {
      const dockerComposeStaging = path.join(process.cwd(), 'docker-compose.staging.yml');
      const content = await fs.readFile(dockerComposeStaging, 'utf-8');

      expect(content).toContain('5433:5432'); // PostgreSQL
      expect(content).toContain('6380:6379'); // Redis
      expect(content).toContain('4322:4321'); // Application
    });

    it('should define volumes for persistence', async () => {
      const dockerComposeStaging = path.join(process.cwd(), 'docker-compose.staging.yml');
      const content = await fs.readFile(dockerComposeStaging, 'utf-8');

      expect(content).toContain('volumes:');
      expect(content).toContain('postgres-staging-data');
      expect(content).toContain('redis-staging-data');
      expect(content).toContain('staging-backups');
    });

    it('should define staging network', async () => {
      const dockerComposeStaging = path.join(process.cwd(), 'docker-compose.staging.yml');
      const content = await fs.readFile(dockerComposeStaging, 'utf-8');

      expect(content).toContain('networks:');
      expect(content).toContain('staging-network');
    });
  });

  describe('6. Documentation', () => {
    it('should have staging environment documentation', () => {
      const stagingDoc = path.join(process.cwd(), 'docs/STAGING_ENVIRONMENT.md');
      expect(existsSync(stagingDoc)).toBe(true);
    });

    it('should document quick start', async () => {
      const stagingDoc = path.join(process.cwd(), 'docs/STAGING_ENVIRONMENT.md');
      const content = await fs.readFile(stagingDoc, 'utf-8');

      expect(content).toContain('Quick Start');
      expect(content).toContain('npm run staging:init');
      expect(content).toContain('docker-compose');
    });

    it('should document environment configuration', async () => {
      const stagingDoc = path.join(process.cwd(), 'docs/STAGING_ENVIRONMENT.md');
      const content = await fs.readFile(stagingDoc, 'utf-8');

      expect(content).toContain('Environment Configuration');
      expect(content).toContain('.env.staging');
      expect(content).toContain('DATABASE_URL');
      expect(content).toContain('REDIS_URL');
    });

    it('should document all scripts', async () => {
      const stagingDoc = path.join(process.cwd(), 'docs/STAGING_ENVIRONMENT.md');
      const content = await fs.readFile(stagingDoc, 'utf-8');

      expect(content).toContain('staging-setup.ts');
      expect(content).toContain('staging-health.ts');
      expect(content).toContain('staging-deploy.ts');
    });

    it('should document Docker setup', async () => {
      const stagingDoc = path.join(process.cwd(), 'docs/STAGING_ENVIRONMENT.md');
      const content = await fs.readFile(stagingDoc, 'utf-8');

      expect(content).toContain('Docker Setup');
      expect(content).toContain('docker-compose.staging.yml');
    });

    it('should document health checks', async () => {
      const stagingDoc = path.join(process.cwd(), 'docs/STAGING_ENVIRONMENT.md');
      const content = await fs.readFile(stagingDoc, 'utf-8');

      expect(content).toContain('Health Checks');
      expect(content).toContain('staging:health');
    });

    it('should document deployment process', async () => {
      const stagingDoc = path.join(process.cwd(), 'docs/STAGING_ENVIRONMENT.md');
      const content = await fs.readFile(stagingDoc, 'utf-8');

      expect(content).toContain('Deployment');
      expect(content).toContain('staging:deploy');
    });

    it('should document troubleshooting', async () => {
      const stagingDoc = path.join(process.cwd(), 'docs/STAGING_ENVIRONMENT.md');
      const content = await fs.readFile(stagingDoc, 'utf-8');

      expect(content).toContain('Troubleshooting');
      expect(content).toContain('Common Issues');
    });

    it('should document best practices', async () => {
      const stagingDoc = path.join(process.cwd(), 'docs/STAGING_ENVIRONMENT.md');
      const content = await fs.readFile(stagingDoc, 'utf-8');

      expect(content).toContain('Best Practices');
    });
  });

  describe('7. NPM Scripts', () => {
    it('should have staging init script', async () => {
      const packageJson = path.join(process.cwd(), 'package.json');
      const content = await fs.readFile(packageJson, 'utf-8');

      expect(content).toContain('"staging:init"');
      expect(content).toContain('staging-setup.ts init');
    });

    it('should have staging seed script', async () => {
      const packageJson = path.join(process.cwd(), 'package.json');
      const content = await fs.readFile(packageJson, 'utf-8');

      expect(content).toContain('"staging:seed"');
      expect(content).toContain('staging-setup.ts seed');
    });

    it('should have staging reset script', async () => {
      const packageJson = path.join(process.cwd(), 'package.json');
      const content = await fs.readFile(packageJson, 'utf-8');

      expect(content).toContain('"staging:reset"');
      expect(content).toContain('staging-setup.ts reset');
    });

    it('should have staging check script', async () => {
      const packageJson = path.join(process.cwd(), 'package.json');
      const content = await fs.readFile(packageJson, 'utf-8');

      expect(content).toContain('"staging:check"');
      expect(content).toContain('staging-setup.ts check');
    });

    it('should have staging health script', async () => {
      const packageJson = path.join(process.cwd(), 'package.json');
      const content = await fs.readFile(packageJson, 'utf-8');

      expect(content).toContain('"staging:health"');
      expect(content).toContain('staging-health.ts');
    });

    it('should have staging health watch script', async () => {
      const packageJson = path.join(process.cwd(), 'package.json');
      const content = await fs.readFile(packageJson, 'utf-8');

      expect(content).toContain('"staging:health:watch"');
      expect(content).toContain('--watch');
    });

    it('should have staging deploy script', async () => {
      const packageJson = path.join(process.cwd(), 'package.json');
      const content = await fs.readFile(packageJson, 'utf-8');

      expect(content).toContain('"staging:deploy"');
      expect(content).toContain('staging-deploy.ts deploy');
    });

    it('should have staging status script', async () => {
      const packageJson = path.join(process.cwd(), 'package.json');
      const content = await fs.readFile(packageJson, 'utf-8');

      expect(content).toContain('"staging:status"');
      expect(content).toContain('staging-deploy.ts status');
    });

    it('should have staging logs script', async () => {
      const packageJson = path.join(process.cwd(), 'package.json');
      const content = await fs.readFile(packageJson, 'utf-8');

      expect(content).toContain('"staging:logs"');
      expect(content).toContain('staging-deploy.ts logs');
    });
  });

  describe('8. Security Considerations', () => {
    it('should never allow admin bypass in staging', async () => {
      const envStagingExample = path.join(process.cwd(), '.env.staging.example');
      const content = await fs.readFile(envStagingExample, 'utf-8');

      expect(content).toContain('BYPASS_ADMIN_AUTH=false');
      expect(content).not.toContain('BYPASS_ADMIN_AUTH=true');
    });

    it('should use test mode for payments', async () => {
      const envStagingExample = path.join(process.cwd(), '.env.staging.example');
      const content = await fs.readFile(envStagingExample, 'utf-8');

      expect(content).toContain('sk_test_');
      expect(content).toContain('PAYMENT_TEST_MODE=true');
    });

    it('should have staging-specific secrets', async () => {
      const envStagingExample = path.join(process.cwd(), '.env.staging.example');
      const content = await fs.readFile(envStagingExample, 'utf-8');

      expect(content).toContain('staging-jwt-secret-change-this');
      expect(content).toContain('staging-refresh-secret-change-this');
      expect(content).toContain('staging-session-secret-change-this');
    });

    it('should have safety checks for reset', async () => {
      const setupScript = path.join(process.cwd(), 'src/scripts/staging-setup.ts');
      const content = await fs.readFile(setupScript, 'utf-8');

      expect(content).toContain("NODE_ENV !== 'staging'");
      expect(content).toContain("!dbName.includes('staging')");
      expect(content).toContain("!dbName.includes('test')");
      expect(content).toContain('setTimeout(resolve, 5000)');
    });
  });

  describe('9. File Structure', () => {
    it('should have all required files', () => {
      const files = [
        '.env.staging.example',
        'src/scripts/staging-setup.ts',
        'src/scripts/staging-health.ts',
        'src/scripts/staging-deploy.ts',
        'docker-compose.staging.yml',
        'docs/STAGING_ENVIRONMENT.md',
      ];

      for (const file of files) {
        const filePath = path.join(process.cwd(), file);
        expect(existsSync(filePath)).toBe(true);
      }
    });

    it('should have staging directory structure', () => {
      // Backup directory will be created by scripts
      const scriptsDir = path.join(process.cwd(), 'src/scripts');
      const docsDir = path.join(process.cwd(), 'docs');

      expect(existsSync(scriptsDir)).toBe(true);
      expect(existsSync(docsDir)).toBe(true);
    });
  });

  describe('10. TypeScript Compatibility', () => {
    it('should have proper TypeScript syntax in setup script', async () => {
      const setupScript = path.join(process.cwd(), 'src/scripts/staging-setup.ts');
      const content = await fs.readFile(setupScript, 'utf-8');

      expect(content).toContain('interface SetupResult');
      expect(content).toContain('Promise<void>');
      expect(content).toContain('Promise<SetupResult>');
    });

    it('should have proper TypeScript syntax in health script', async () => {
      const healthScript = path.join(process.cwd(), 'src/scripts/staging-health.ts');
      const content = await fs.readFile(healthScript, 'utf-8');

      expect(content).toContain('interface HealthCheck');
      expect(content).toContain('interface HealthReport');
      expect(content).toContain('Promise<HealthCheck>');
      expect(content).toContain('Promise<HealthReport>');
    });

    it('should have proper TypeScript syntax in deploy script', async () => {
      const deployScript = path.join(process.cwd(), 'src/scripts/staging-deploy.ts');
      const content = await fs.readFile(deployScript, 'utf-8');

      expect(content).toContain('interface DeploymentStep');
      expect(content).toContain('Promise<void>');
    });

    it('should import required modules', async () => {
      const setupScript = path.join(process.cwd(), 'src/scripts/staging-setup.ts');
      const content = await fs.readFile(setupScript, 'utf-8');

      expect(content).toContain("import { config } from 'dotenv'");
      expect(content).toContain("import { exec } from 'child_process'");
      expect(content).toContain("import { promisify } from 'util'");
      expect(content).toContain("import fs from 'fs/promises'");
      expect(content).toContain("import * as Sentry from '@sentry/node'");
    });
  });

  describe('11. Deployment Readiness', () => {
    it('should verify all staging components exist', () => {
      const files = [
        '.env.staging.example',
        'src/scripts/staging-setup.ts',
        'src/scripts/staging-health.ts',
        'src/scripts/staging-deploy.ts',
        'docker-compose.staging.yml',
        'docs/STAGING_ENVIRONMENT.md',
      ];

      for (const file of files) {
        const filePath = path.join(process.cwd(), file);
        expect(existsSync(filePath)).toBe(true);
      }
    });

    it('should have executable script headers', async () => {
      const scripts = [
        'src/scripts/staging-setup.ts',
        'src/scripts/staging-health.ts',
        'src/scripts/staging-deploy.ts',
      ];

      for (const script of scripts) {
        const content = await fs.readFile(path.join(process.cwd(), script), 'utf-8');
        expect(content.startsWith('#!/usr/bin/env tsx')).toBe(true);
      }
    });

    it('should have usage documentation in scripts', async () => {
      const scripts = [
        'src/scripts/staging-setup.ts',
        'src/scripts/staging-health.ts',
        'src/scripts/staging-deploy.ts',
      ];

      for (const script of scripts) {
        const content = await fs.readFile(path.join(process.cwd(), script), 'utf-8');
        expect(content).toContain('Usage:');
      }
    });
  });
});
