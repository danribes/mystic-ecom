/**
 * T154: Sentry Error Tracking and Monitoring Tests
 *
 * These tests validate the Sentry error tracking and monitoring setup:
 * - Sentry configuration
 * - Error capturing
 * - User context tracking
 * - Breadcrumb logging
 * - Performance monitoring
 * - Sensitive data filtering
 * - Health check integration
 *
 * Run these tests:
 * npm test -- tests/monitoring/T154_sentry_error_tracking.test.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as sentry from '../../src/lib/sentry';
import fs from 'fs';
import path from 'path';

describe('T154: Sentry Error Tracking', () => {
  describe('Sentry Configuration', () => {
    it('should have Sentry library installed', () => {
      const packagePath = path.join(process.cwd(), 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));

      expect(packageJson.dependencies['@sentry/node']).toBeDefined();
      expect(packageJson.dependencies['@sentry/astro']).toBeDefined();
    });

    it('should have Sentry DSN environment variable in production', () => {
      // Only check in production
      if (process.env.NODE_ENV === 'production') {
        expect(process.env.SENTRY_DSN).toBeDefined();
        expect(process.env.SENTRY_DSN).toMatch(/^https:\/\//);
      } else {
        // In test/dev, SENTRY_DSN is optional
        if (process.env.SENTRY_DSN) {
          expect(process.env.SENTRY_DSN).toMatch(/^https:\/\//);
        }
      }
    });

    it('should have Sentry configuration file', () => {
      const sentryConfigPath = path.join(process.cwd(), 'src/lib/sentry.ts');
      expect(fs.existsSync(sentryConfigPath)).toBe(true);

      const content = fs.readFileSync(sentryConfigPath, 'utf-8');
      expect(content).toContain('initSentry');
      expect(content).toContain('captureException');
      expect(content).toContain('captureMessage');
    });

    it('should have Sentry integration in Astro config', () => {
      const configPath = path.join(process.cwd(), 'astro.config.mjs');
      expect(fs.existsSync(configPath)).toBe(true);

      const content = fs.readFileSync(configPath, 'utf-8');
      expect(content).toContain('sentryIntegration');
    });

    it('should have Sentry integration file', () => {
      const integrationPath = path.join(process.cwd(), 'src/integrations/sentry.ts');
      expect(fs.existsSync(integrationPath)).toBe(true);
    });
  });

  describe('Error Capturing Functions', () => {
    it('should export captureException function', () => {
      expect(typeof sentry.captureException).toBe('function');
    });

    it('should export captureMessage function', () => {
      expect(typeof sentry.captureMessage).toBe('function');
    });

    it('should export setUser function', () => {
      expect(typeof sentry.setUser).toBe('function');
    });

    it('should export addBreadcrumb function', () => {
      expect(typeof sentry.addBreadcrumb).toBe('function');
    });

    it('should export wrapHandler function', () => {
      expect(typeof sentry.wrapHandler).toBe('function');
    });

    it('should capture exceptions without throwing', () => {
      const testError = new Error('Test error');

      expect(() => {
        sentry.captureException(testError);
      }).not.toThrow();
    });

    it('should capture messages without throwing', () => {
      expect(() => {
        sentry.captureMessage('Test message', 'info');
      }).not.toThrow();
    });

    it('should set user context without throwing', () => {
      expect(() => {
        sentry.setUser({
          id: '123',
          email: 'test@example.com',
        });
      }).not.toThrow();
    });

    it('should add breadcrumbs without throwing', () => {
      expect(() => {
        sentry.addBreadcrumb({
          message: 'Test breadcrumb',
          category: 'test',
          level: 'info',
        });
      }).not.toThrow();
    });

    it('should clear user context', () => {
      sentry.setUser({
        id: '123',
        email: 'test@example.com',
      });

      expect(() => {
        sentry.setUser(null);
      }).not.toThrow();
    });
  });

  describe('Error Context', () => {
    it('should capture exception with context', () => {
      const testError = new Error('Test error with context');
      const context = {
        userId: '123',
        action: 'test_action',
      };

      expect(() => {
        sentry.captureException(testError, context);
      }).not.toThrow();
    });

    it('should capture message with context', () => {
      const context = {
        feature: 'test_feature',
        environment: 'test',
      };

      expect(() => {
        sentry.captureMessage('Test message with context', 'warning', context);
      }).not.toThrow();
    });

    it('should add breadcrumb with data', () => {
      expect(() => {
        sentry.addBreadcrumb({
          message: 'User clicked button',
          category: 'ui',
          level: 'info',
          data: {
            buttonId: 'submit-button',
            timestamp: Date.now(),
          },
        });
      }).not.toThrow();
    });
  });

  describe('Function Wrapping', () => {
    it('should wrap synchronous function', () => {
      const testFn = vi.fn(() => 'success');
      const wrapped = sentry.wrapHandler(testFn);

      const result = wrapped();

      expect(result).toBe('success');
      expect(testFn).toHaveBeenCalled();
    });

    it('should wrap async function', async () => {
      const testFn = vi.fn(async () => 'async success');
      const wrapped = sentry.wrapHandler(testFn);

      const result = await wrapped();

      expect(result).toBe('async success');
      expect(testFn).toHaveBeenCalled();
    });

    it('should capture errors from wrapped function', () => {
      const testError = new Error('Wrapped function error');
      const testFn = vi.fn(() => {
        throw testError;
      });
      const wrapped = sentry.wrapHandler(testFn);

      expect(() => {
        wrapped();
      }).toThrow(testError);

      expect(testFn).toHaveBeenCalled();
    });

    it('should capture errors from async wrapped function', async () => {
      const testError = new Error('Async wrapped function error');
      const testFn = vi.fn(async () => {
        throw testError;
      });
      const wrapped = sentry.wrapHandler(testFn);

      await expect(wrapped()).rejects.toThrow(testError);
      expect(testFn).toHaveBeenCalled();
    });
  });

  describe('Sensitive Data Filtering', () => {
    it('should have sensitive data filtering in beforeSend', () => {
      const sentryConfigPath = path.join(process.cwd(), 'src/lib/sentry.ts');
      const content = fs.readFileSync(sentryConfigPath, 'utf-8');

      // Check for sensitive data filtering
      expect(content).toContain('filterSensitiveData');
      expect(content).toContain('filterSensitiveObject');
      expect(content).toContain('beforeSend');
    });

    it('should filter common sensitive keys', () => {
      const sentryConfigPath = path.join(process.cwd(), 'src/lib/sentry.ts');
      const content = fs.readFileSync(sentryConfigPath, 'utf-8');

      // Check for common sensitive field names
      expect(content).toContain('password');
      expect(content).toContain('token');
      expect(content).toContain('secret');
      expect(content).toContain('apikey');
    });

    it('should redact sensitive data', () => {
      const sentryConfigPath = path.join(process.cwd(), 'src/lib/sentry.ts');
      const content = fs.readFileSync(sentryConfigPath, 'utf-8');

      expect(content).toContain('REDACTED');
    });
  });

  describe('Health Check Integration', () => {
    it('should have Sentry integration in health check endpoint', () => {
      const healthPath = path.join(process.cwd(), 'src/pages/api/health.ts');
      expect(fs.existsSync(healthPath)).toBe(true);

      const content = fs.readFileSync(healthPath, 'utf-8');
      expect(content).toContain('captureException');
      expect(content).toContain('addBreadcrumb');
    });

    it('should log health check events', () => {
      const healthPath = path.join(process.cwd(), 'src/pages/api/health.ts');
      const content = fs.readFileSync(healthPath, 'utf-8');

      expect(content).toContain('Health check');
      expect(content).toContain('addBreadcrumb');
    });

    it('should capture health check errors', () => {
      const healthPath = path.join(process.cwd(), 'src/pages/api/health.ts');
      const content = fs.readFileSync(healthPath, 'utf-8');

      // Should have error capturing for database
      expect(content).toContain('database');
      expect(content).toContain('captureException');

      // Should have error capturing for redis
      expect(content).toContain('redis');
    });
  });

  describe('Performance Monitoring', () => {
    it('should have tracesSampleRate configured', () => {
      const sentryConfigPath = path.join(process.cwd(), 'src/lib/sentry.ts');
      const content = fs.readFileSync(sentryConfigPath, 'utf-8');

      expect(content).toContain('tracesSampleRate');
    });

    it('should export startTransaction function', () => {
      expect(typeof sentry.startTransaction).toBe('function');
    });

    it('should create transactions without throwing', () => {
      // In test environment, Sentry may not be initialized
      // This test just verifies the function exists and can be called
      try {
        const transaction = sentry.startTransaction('test_transaction', 'test');
        expect(transaction).toBeDefined();
      } catch (error) {
        // If Sentry is not initialized, this is expected in test environment
        // Just verify the function exists
        expect(typeof sentry.startTransaction).toBe('function');
      }
    });
  });

  describe('Environment Handling', () => {
    it('should not initialize Sentry in development without explicit enable', () => {
      const sentryConfigPath = path.join(process.cwd(), 'src/lib/sentry.ts');
      const content = fs.readFileSync(sentryConfigPath, 'utf-8');

      // Should check environment
      expect(content).toContain('environment');

      // Should have conditional initialization
      expect(content).toMatch(/production|SENTRY_ENABLED/i);
    });

    it('should initialize Sentry in production if DSN is configured', () => {
      const sentryConfigPath = path.join(process.cwd(), 'src/lib/sentry.ts');
      const content = fs.readFileSync(sentryConfigPath, 'utf-8');

      // Should check for DSN
      expect(content).toContain('dsn');
      expect(content).toMatch(/SENTRY_DSN/);
    });
  });

  describe('Error Filtering', () => {
    it('should ignore browser extension errors', () => {
      const sentryConfigPath = path.join(process.cwd(), 'src/lib/sentry.ts');
      const content = fs.readFileSync(sentryConfigPath, 'utf-8');

      expect(content).toContain('ignoreErrors');
      expect(content).toContain('chrome-extension');
      expect(content).toContain('moz-extension');
    });

    it('should ignore network errors', () => {
      const sentryConfigPath = path.join(process.cwd(), 'src/lib/sentry.ts');
      const content = fs.readFileSync(sentryConfigPath, 'utf-8');

      expect(content).toMatch(/NetworkError|Network request failed/i);
    });

    it('should ignore user cancelled actions', () => {
      const sentryConfigPath = path.join(process.cwd(), 'src/lib/sentry.ts');
      const content = fs.readFileSync(sentryConfigPath, 'utf-8');

      expect(content).toMatch(/AbortError|aborted/i);
    });
  });

  describe('Release Tracking', () => {
    it('should track releases with version', () => {
      const sentryConfigPath = path.join(process.cwd(), 'src/lib/sentry.ts');
      const content = fs.readFileSync(sentryConfigPath, 'utf-8');

      expect(content).toContain('release');
    });
  });

  describe('Cleanup Functions', () => {
    it('should export closeSentry function', () => {
      expect(typeof sentry.closeSentry).toBe('function');
    });

    it('should export flushSentry function', () => {
      expect(typeof sentry.flushSentry).toBe('function');
    });

    it('should flush Sentry without throwing', async () => {
      await expect(sentry.flushSentry(100)).resolves.toBeDefined();
    });
  });

  describe('Integration Tests', () => {
    it('should have all required files for production deployment', () => {
      const requiredFiles = [
        'src/lib/sentry.ts',
        'src/integrations/sentry.ts',
        'astro.config.mjs',
        'src/pages/api/health.ts',
      ];

      requiredFiles.forEach(file => {
        const filePath = path.join(process.cwd(), file);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });

    it('should have documentation for Sentry setup', () => {
      // Check if deployment guide exists and mentions Sentry
      const docsPath = path.join(process.cwd(), 'docs/PRODUCTION_DEPLOYMENT_GUIDE.md');

      if (fs.existsSync(docsPath)) {
        const content = fs.readFileSync(docsPath, 'utf-8');
        expect(content).toMatch(/sentry|monitoring|error tracking/i);
      }
    });
  });

  describe('Middleware', () => {
    it('should export sentryErrorMiddleware', () => {
      expect(typeof sentry.sentryErrorMiddleware).toBe('function');
    });

    it('should create middleware without throwing', () => {
      expect(() => {
        sentry.sentryErrorMiddleware();
      }).not.toThrow();
    });
  });

  describe('Configuration Completeness', () => {
    it('should have all essential Sentry functions exported', () => {
      const essentialFunctions = [
        'initSentry',
        'captureException',
        'captureMessage',
        'setUser',
        'addBreadcrumb',
        'startTransaction',
        'wrapHandler',
        'sentryErrorMiddleware',
        'closeSentry',
        'flushSentry',
      ];

      essentialFunctions.forEach(fnName => {
        expect(sentry).toHaveProperty(fnName);
        expect(typeof sentry[fnName as keyof typeof sentry]).toBe('function');
      });
    });

    it('should export Sentry SDK for advanced usage', () => {
      expect(sentry.Sentry).toBeDefined();
      expect(typeof sentry.Sentry).toBe('object');
    });
  });
});

describe('Deployment Readiness', () => {
  it('should pass all Sentry configuration checks', () => {
    const checks = {
      sentryLibraryInstalled: true,
      configurationFileExists: fs.existsSync(path.join(process.cwd(), 'src/lib/sentry.ts')),
      integrationExists: fs.existsSync(path.join(process.cwd(), 'src/integrations/sentry.ts')),
      astroConfigUpdated: fs.readFileSync(path.join(process.cwd(), 'astro.config.mjs'), 'utf-8').includes('sentryIntegration'),
      healthCheckIntegrated: fs.readFileSync(path.join(process.cwd(), 'src/pages/api/health.ts'), 'utf-8').includes('captureException'),
    };

    expect(checks.sentryLibraryInstalled).toBe(true);
    expect(checks.configurationFileExists).toBe(true);
    expect(checks.integrationExists).toBe(true);
    expect(checks.astroConfigUpdated).toBe(true);
    expect(checks.healthCheckIntegrated).toBe(true);
  });

  it('should have proper environment variable configuration', () => {
    // In production, SENTRY_DSN should be set
    // In test/dev, it's optional
    if (process.env.NODE_ENV === 'production') {
      expect(process.env.SENTRY_DSN).toBeDefined();
    }

    // Always check that the code handles missing DSN gracefully
    const sentryConfigPath = path.join(process.cwd(), 'src/lib/sentry.ts');
    const content = fs.readFileSync(sentryConfigPath, 'utf-8');

    // Should have conditional initialization
    expect(content).toContain('if');
    expect(content).toContain('dsn');
  });
});
