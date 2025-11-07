/**
 * T159: Production Deployment Checklist - Test Suite
 *
 * Tests for production deployment checklist and validation
 */

import { describe, it, expect } from 'vitest';
import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import path from 'path';

const rootDir = process.cwd();

describe('T159: Production Deployment Checklist', () => {
  describe('1. Deployment Checklist Document', () => {
    const checklistPath = path.join(rootDir, 'docs/PRODUCTION_DEPLOYMENT_CHECKLIST.md');

    it('should have production deployment checklist document', () => {
      expect(existsSync(checklistPath)).toBe(true);
    });

    it('should have table of contents', async () => {
      const content = await readFile(checklistPath, 'utf-8');
      expect(content).toContain('## Table of Contents');
      expect(content).toContain('Pre-Deployment Checklist');
      expect(content).toContain('Security Checklist');
      expect(content).toContain('Infrastructure Checklist');
      expect(content).toContain('Testing Checklist');
      expect(content).toContain('Deployment Day Checklist');
      expect(content).toContain('Post-Deployment Checklist');
      expect(content).toContain('Rollback Plan');
    });

    it('should define severity levels', async () => {
      const content = await readFile(checklistPath, 'utf-8');
      expect(content).toContain('### Severity Levels');
      expect(content).toContain('BLOCKER');
      expect(content).toContain('CRITICAL');
      expect(content).toContain('IMPORTANT');
      expect(content).toContain('NICE-TO-HAVE');
    });

    it('should have pre-deployment checklist', async () => {
      const content = await readFile(checklistPath, 'utf-8');
      expect(content).toContain('## Pre-Deployment Checklist');
      expect(content).toContain('### Code Quality');
      expect(content).toContain('### Version Control');
      expect(content).toContain('All tests passing');
      expect(content).toContain('No known critical bugs');
    });

    it('should have security checklist', async () => {
      const content = await readFile(checklistPath, 'utf-8');
      expect(content).toContain('## Security Checklist');
      expect(content).toContain('### Environment Variables');
      expect(content).toContain('### Authentication & Authorization');
      expect(content).toContain('### Data Protection');
      expect(content).toContain('.env` file never committed');
      expect(content).toContain('SQL injection protection');
      expect(content).toContain('XSS protection');
    });

    it('should have infrastructure checklist', async () => {
      const content = await readFile(checklistPath, 'utf-8');
      expect(content).toContain('## Infrastructure Checklist');
      expect(content).toContain('### Domain & DNS');
      expect(content).toContain('### Hosting & Deployment');
      expect(content).toContain('### Database');
      expect(content).toContain('### Caching (Redis)');
    });

    it('should specify required environment variables', async () => {
      const content = await readFile(checklistPath, 'utf-8');
      expect(content).toContain('NODE_ENV=production');
      expect(content).toContain('DATABASE_URL');
      expect(content).toContain('REDIS_URL');
      expect(content).toContain('STRIPE_SECRET_KEY');
      expect(content).toContain('RESEND_API_KEY');
      expect(content).toContain('JWT_SECRET');
      expect(content).toContain('SESSION_SECRET');
    });

    it('should warn about using live Stripe keys', async () => {
      const content = await readFile(checklistPath, 'utf-8');
      expect(content).toContain('sk_live_');
      expect(content).toContain('pk_live_');
      expect(content).toContain('Using LIVE Stripe keys');
    });

    it('should have application checklist', async () => {
      const content = await readFile(checklistPath, 'utf-8');
      expect(content).toContain('## Application Checklist');
      expect(content).toContain('### Build & Deployment');
      expect(content).toContain('### Configuration');
      expect(content).toContain('Production build successful');
      expect(content).toContain('No console.log statements');
    });

    it('should have external services checklist', async () => {
      const content = await readFile(checklistPath, 'utf-8');
      expect(content).toContain('## External Services Checklist');
      expect(content).toContain('### Payment Processing (Stripe)');
      expect(content).toContain('### Email Service (Resend)');
      expect(content).toContain('### Monitoring (Sentry)');
    });

    it('should have testing checklist', async () => {
      const content = await readFile(checklistPath, 'utf-8');
      expect(content).toContain('## Testing Checklist');
      expect(content).toContain('### Automated Tests');
      expect(content).toContain('### Manual Testing');
      expect(content).toContain('All unit tests passing');
      expect(content).toContain('UAT completed');
      expect(content).toContain('Cross-browser testing');
      expect(content).toContain('Mobile testing');
    });

    it('should have monitoring and logging checklist', async () => {
      const content = await readFile(checklistPath, 'utf-8');
      expect(content).toContain('## Monitoring & Logging Checklist');
      expect(content).toContain('### Logging');
      expect(content).toContain('### Monitoring');
      expect(content).toContain('### Alerting');
      expect(content).toContain('Uptime monitoring');
      expect(content).toContain('Error rate monitoring');
    });

    it('should have performance checklist', async () => {
      const content = await readFile(checklistPath, 'utf-8');
      expect(content).toContain('## Performance Checklist');
      expect(content).toContain('### Page Performance');
      expect(content).toContain('### API Performance');
      expect(content).toContain('Core Web Vitals');
      expect(content).toContain('LCP < 2.5s');
      expect(content).toContain('FID < 100ms');
      expect(content).toContain('CLS < 0.1');
    });

    it('should have backup and recovery checklist', async () => {
      const content = await readFile(checklistPath, 'utf-8');
      expect(content).toContain('## Backup & Recovery Checklist');
      expect(content).toContain('### Backups');
      expect(content).toContain('### Disaster Recovery');
      expect(content).toContain('Database backups configured');
      expect(content).toContain('Rollback plan');
    });

    it('should have documentation checklist', async () => {
      const content = await readFile(checklistPath, 'utf-8');
      expect(content).toContain('## Documentation Checklist');
      expect(content).toContain('### Technical Documentation');
      expect(content).toContain('### Operational Documentation');
      expect(content).toContain('Runbook created');
    });

    it('should have deployment day checklist', async () => {
      const content = await readFile(checklistPath, 'utf-8');
      expect(content).toContain('## Deployment Day Checklist');
      expect(content).toContain('### Pre-Deployment');
      expect(content).toContain('### During Deployment');
      expect(content).toContain('### Smoke Tests');
      expect(content).toContain('Deployment window scheduled');
      expect(content).toContain('Backup created immediately before');
    });

    it('should have post-deployment checklist', async () => {
      const content = await readFile(checklistPath, 'utf-8');
      expect(content).toContain('## Post-Deployment Checklist');
      expect(content).toContain('### First Hour');
      expect(content).toContain('### First 24 Hours');
      expect(content).toContain('### First Week');
      expect(content).toContain('Monitor error rates');
      expect(content).toContain('Monitor response times');
    });

    it('should have rollback plan', async () => {
      const content = await readFile(checklistPath, 'utf-8');
      expect(content).toContain('## Rollback Plan');
      expect(content).toContain('### When to Rollback');
      expect(content).toContain('### Rollback Procedure');
      expect(content).toContain('Site is completely down');
      expect(content).toContain('Critical functionality broken');
      expect(content).toContain('Rollback Time Target');
    });

    it('should have emergency contacts section', async () => {
      const content = await readFile(checklistPath, 'utf-8');
      expect(content).toContain('## Emergency Contacts');
      expect(content).toContain('Engineering Team');
      expect(content).toContain('External Services');
    });

    it('should have final sign-off section', async () => {
      const content = await readFile(checklistPath, 'utf-8');
      expect(content).toContain('## Final Sign-Off');
      expect(content).toContain('Checklist Completion');
      expect(content).toContain('Approvals Required');
      expect(content).toContain('Engineering Lead');
      expect(content).toContain('Security Lead');
      expect(content).toContain('QA Lead');
    });

    it('should have useful commands appendix', async () => {
      const content = await readFile(checklistPath, 'utf-8');
      expect(content).toContain('## Appendix');
      expect(content).toContain('### Automated Validation');
      expect(content).toContain('### Useful Commands');
      expect(content).toContain('npm run deploy:validate');
    });
  });

  describe('2. Deployment Validation Script', () => {
    const scriptPath = path.join(rootDir, 'src/scripts/deploy-validate.ts');

    it('should have deployment validation script', () => {
      expect(existsSync(scriptPath)).toBe(true);
    });

    it('should have TypeScript interfaces', async () => {
      const content = await readFile(scriptPath, 'utf-8');
      expect(content).toContain('interface ValidationResult');
      expect(content).toContain('interface ValidationReport');
    });

    it('should define ValidationResult interface', async () => {
      const content = await readFile(scriptPath, 'utf-8');
      expect(content).toContain('interface ValidationResult');
      expect(content).toContain('category: string');
      expect(content).toContain('check: string');
      expect(content).toContain("status: 'pass' | 'fail' | 'warn' | 'skip'");
      expect(content).toContain('message: string');
      expect(content).toContain('severity:');
    });

    it('should define ValidationReport interface', async () => {
      const content = await readFile(scriptPath, 'utf-8');
      expect(content).toContain('interface ValidationReport');
      expect(content).toContain('timestamp: string');
      expect(content).toContain('totalChecks: number');
      expect(content).toContain('passed: number');
      expect(content).toContain('failed: number');
      expect(content).toContain('deploymentReady: boolean');
    });

    it('should have environment variable validation', async () => {
      const content = await readFile(scriptPath, 'utf-8');
      expect(content).toContain('validateEnvironmentVariables');
      expect(content).toContain('NODE_ENV');
      expect(content).toContain('DATABASE_URL');
      expect(content).toContain('REDIS_URL');
      expect(content).toContain('STRIPE_SECRET_KEY');
    });

    it('should check for production environment', async () => {
      const content = await readFile(scriptPath, 'utf-8');
      expect(content).toContain('NODE_ENV is production');
      expect(content).toContain("nodeEnv === 'production'");
    });

    it('should check for test keys in production', async () => {
      const content = await readFile(scriptPath, 'utf-8');
      expect(content).toContain('No test keys in production');
      expect(content).toContain('sk_test_');
      expect(content).toContain('sk_live_');
    });

    it('should check for bypass flags', async () => {
      const content = await readFile(scriptPath, 'utf-8');
      expect(content).toContain('No bypass flags enabled');
      expect(content).toContain('BYPASS_ADMIN_AUTH');
    });

    it('should have database connectivity validation', async () => {
      const content = await readFile(scriptPath, 'utf-8');
      expect(content).toContain('validateDatabase');
      expect(content).toContain('Database connection');
      expect(content).toContain('psql');
    });

    it('should check database is not staging', async () => {
      const content = await readFile(scriptPath, 'utf-8');
      expect(content).toContain('Database is not staging');
      expect(content).toContain('staging');
      expect(content).toContain('test');
    });

    it('should have Redis connectivity validation', async () => {
      const content = await readFile(scriptPath, 'utf-8');
      expect(content).toContain('validateRedis');
      expect(content).toContain('Redis connection');
    });

    it('should have external services validation', async () => {
      const content = await readFile(scriptPath, 'utf-8');
      expect(content).toContain('validateExternalServices');
      expect(content).toContain('Stripe configuration');
      expect(content).toContain('Resend');
      expect(content).toContain('Sentry');
    });

    it('should have security validation', async () => {
      const content = await readFile(scriptPath, 'utf-8');
      expect(content).toContain('validateSecurity');
      expect(content).toContain('.env not in repository');
      expect(content).toContain('.gitignore');
      expect(content).toContain('console.log');
    });

    it('should have build process validation', async () => {
      const content = await readFile(scriptPath, 'utf-8');
      expect(content).toContain('validateBuild');
      expect(content).toContain('TypeScript compilation');
      expect(content).toContain('Production build');
      expect(content).toContain('npm run build');
    });

    it('should have test suite validation', async () => {
      const content = await readFile(scriptPath, 'utf-8');
      expect(content).toContain('validateTests');
      expect(content).toContain('npm test');
    });

    it('should support quick mode', async () => {
      const content = await readFile(scriptPath, 'utf-8');
      expect(content).toContain('--quick');
      expect(content).toContain('quick mode');
    });

    it('should generate validation report', async () => {
      const content = await readFile(scriptPath, 'utf-8');
      expect(content).toContain('generateReport');
      expect(content).toContain('deploymentReady');
    });

    it('should print summary', async () => {
      const content = await readFile(scriptPath, 'utf-8');
      expect(content).toContain('printSummary');
      expect(content).toContain('VALIDATION SUMMARY');
      expect(content).toContain('READY FOR DEPLOYMENT');
    });

    it('should save report to file', async () => {
      const content = await readFile(scriptPath, 'utf-8');
      expect(content).toContain('saveReport');
      expect(content).toContain('.deploy');
      expect(content).toContain('validation');
    });

    it('should handle CLI arguments', async () => {
      const content = await readFile(scriptPath, 'utf-8');
      expect(content).toContain('process.argv');
      expect(content).toContain('--help');
      expect(content).toContain('--quick');
      expect(content).toContain('--report');
    });

    it('should have severity levels defined', async () => {
      const content = await readFile(scriptPath, 'utf-8');
      expect(content).toContain('blocker');
      expect(content).toContain('critical');
      expect(content).toContain('important');
      expect(content).toContain('nice-to-have');
    });

    it('should exit with appropriate code', async () => {
      const content = await readFile(scriptPath, 'utf-8');
      expect(content).toContain('process.exit');
      expect(content).toContain('deploymentReady ? 0 : 1');
    });
  });

  describe('3. NPM Scripts Configuration', () => {
    const packageJsonPath = path.join(rootDir, 'package.json');

    it('should have deploy:validate script', async () => {
      const content = await readFile(packageJsonPath, 'utf-8');
      expect(content).toContain('"deploy:validate"');
      expect(content).toContain('tsx src/scripts/deploy-validate.ts');
    });

    it('should have deploy:validate:quick script', async () => {
      const content = await readFile(packageJsonPath, 'utf-8');
      expect(content).toContain('"deploy:validate:quick"');
      expect(content).toContain('--quick');
    });

    it('should have deploy:validate:report script', async () => {
      const content = await readFile(packageJsonPath, 'utf-8');
      expect(content).toContain('"deploy:validate:report"');
      expect(content).toContain('--report');
    });
  });

  describe('4. Deployment Checklist Coverage', () => {
    const checklistPath = path.join(rootDir, 'docs/PRODUCTION_DEPLOYMENT_CHECKLIST.md');

    it('should cover all critical security items', async () => {
      const content = await readFile(checklistPath, 'utf-8');
      expect(content).toContain('BYPASS_ADMIN_AUTH');
      expect(content).toContain('JWT_SECRET');
      expect(content).toContain('SESSION_SECRET');
      expect(content).toContain('SQL injection');
      expect(content).toContain('XSS protection');
      expect(content).toContain('CSRF protection');
    });

    it('should cover database requirements', async () => {
      const content = await readFile(checklistPath, 'utf-8');
      expect(content).toContain('Database backups configured');
      expect(content).toContain('Database migrations applied');
      expect(content).toContain('connection pooling');
      expect(content).toContain('performance tuned');
    });

    it('should cover external service requirements', async () => {
      const content = await readFile(checklistPath, 'utf-8');
      expect(content).toContain('Stripe account verified and activated');
      expect(content).toContain('Stripe webhook configured');
      expect(content).toContain('Domain verified for sending');
      expect(content).toContain('Sentry project created for production');
    });

    it('should cover monitoring requirements', async () => {
      const content = await readFile(checklistPath, 'utf-8');
      expect(content).toContain('Uptime monitoring');
      expect(content).toContain('Error rate monitoring');
      expect(content).toContain('Performance monitoring');
      expect(content).toContain('Alert rules configured');
    });

    it('should cover performance requirements', async () => {
      const content = await readFile(checklistPath, 'utf-8');
      expect(content).toContain('Core Web Vitals passing');
      expect(content).toContain('Homepage loads < 2s');
      expect(content).toContain('API response times < 500ms');
    });
  });

  describe('5. Validation Script Checks', () => {
    const scriptPath = path.join(rootDir, 'src/scripts/deploy-validate.ts');

    it('should check all required environment variables', async () => {
      const content = await readFile(scriptPath, 'utf-8');
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
      for (const varName of requiredVars) {
        expect(content).toContain(varName);
      }
    });

    it('should validate secret strength', async () => {
      const content = await readFile(scriptPath, 'utf-8');
      expect(content).toContain('JWT_SECRET strength');
      expect(content).toContain('SESSION_SECRET strength');
      expect(content).toContain('length < 32');
    });

    it('should check for .env in git', async () => {
      const content = await readFile(scriptPath, 'utf-8');
      expect(content).toContain('git ls-files .env');
      expect(content).toContain('.env file is tracked by git');
    });

    it('should validate TypeScript compilation', async () => {
      const content = await readFile(scriptPath, 'utf-8');
      expect(content).toContain('tsc --noEmit');
      expect(content).toContain('TypeScript compilation');
    });

    it('should validate production build', async () => {
      const content = await readFile(scriptPath, 'utf-8');
      expect(content).toContain('npm run build');
      expect(content).toContain('Production build');
    });
  });

  describe('6. Report Generation', () => {
    const scriptPath = path.join(rootDir, 'src/scripts/deploy-validate.ts');

    it('should calculate statistics', async () => {
      const content = await readFile(scriptPath, 'utf-8');
      expect(content).toContain('totalChecks');
      expect(content).toContain('passed');
      expect(content).toContain('failed');
      expect(content).toContain('warnings');
      expect(content).toContain('blockers');
      expect(content).toContain('criticals');
    });

    it('should determine deployment readiness', async () => {
      const content = await readFile(scriptPath, 'utf-8');
      expect(content).toContain('deploymentReady');
      expect(content).toContain('blockers === 0');
      expect(content).toContain('failed === 0');
    });

    it('should generate summary message', async () => {
      const content = await readFile(scriptPath, 'utf-8');
      expect(content).toContain('summary');
      expect(content).toContain('READY FOR DEPLOYMENT');
      expect(content).toContain('BLOCKED');
      expect(content).toContain('CRITICAL ISSUES');
    });

    it('should save report as JSON', async () => {
      const content = await readFile(scriptPath, 'utf-8');
      expect(content).toContain('JSON.stringify');
      expect(content).toContain('validation-');
      expect(content).toContain('.json');
    });
  });

  describe('7. Command Line Interface', () => {
    const scriptPath = path.join(rootDir, 'src/scripts/deploy-validate.ts');

    it('should have help command', async () => {
      const content = await readFile(scriptPath, 'utf-8');
      expect(content).toContain('--help');
      expect(content).toContain('Usage:');
    });

    it('should support quick mode flag', async () => {
      const content = await readFile(scriptPath, 'utf-8');
      expect(content).toContain('--quick');
      expect(content).toContain('quick:');
    });

    it('should support report generation flag', async () => {
      const content = await readFile(scriptPath, 'utf-8');
      expect(content).toContain('--report');
      expect(content).toContain('report:');
    });

    it('should document exit codes', async () => {
      const content = await readFile(scriptPath, 'utf-8');
      expect(content).toContain('Exit Codes:');
      expect(content).toContain('0 -');
      expect(content).toContain('1 -');
    });
  });

  describe('8. File Structure', () => {
    it('should have all required files', () => {
      const checklistPath = path.join(rootDir, 'docs/PRODUCTION_DEPLOYMENT_CHECKLIST.md');
      const scriptPath = path.join(rootDir, 'src/scripts/deploy-validate.ts');

      expect(existsSync(checklistPath)).toBe(true);
      expect(existsSync(scriptPath)).toBe(true);
    });
  });

  describe('9. Deployment Readiness', () => {
    const scriptPath = path.join(rootDir, 'src/scripts/deploy-validate.ts');
    const checklistPath = path.join(rootDir, 'docs/PRODUCTION_DEPLOYMENT_CHECKLIST.md');

    it('should have executable script header', async () => {
      const content = await readFile(scriptPath, 'utf-8');
      expect(content).toContain('#!/usr/bin/env tsx');
    });

    it('should have usage documentation', async () => {
      const content = await readFile(scriptPath, 'utf-8');
      expect(content).toContain('Usage:');
      expect(content).toContain('Options:');
    });

    it('should have comprehensive checklist', async () => {
      const content = await readFile(checklistPath, 'utf-8');
      expect(content.length).toBeGreaterThan(10000); // Comprehensive checklist
    });

    it('should handle errors gracefully', async () => {
      const content = await readFile(scriptPath, 'utf-8');
      expect(content).toContain('try');
      expect(content).toContain('catch');
      expect(content).toContain('error');
    });
  });

  describe('10. Integration Points', () => {
    const scriptPath = path.join(rootDir, 'src/scripts/deploy-validate.ts');

    it('should integrate with existing test suite', async () => {
      const content = await readFile(scriptPath, 'utf-8');
      expect(content).toContain('npm test');
    });

    it('should integrate with build process', async () => {
      const content = await readFile(scriptPath, 'utf-8');
      expect(content).toContain('npm run build');
      expect(content).toContain('tsc');
    });

    it('should integrate with security scans', async () => {
      const content = await readFile(scriptPath, 'utf-8');
      const hasSecurityCheck = content.includes('security') || content.includes('Security') || content.includes('validateSecurity');
      expect(hasSecurityCheck).toBe(true);
    });

    it('should use existing environment configuration', async () => {
      const content = await readFile(scriptPath, 'utf-8');
      expect(content).toContain('dotenv');
      expect(content).toContain('config()');
    });
  });
});
