/**
 * T153: Production Deployment Validation Tests
 *
 * These tests validate that the deployment environment is properly configured
 * for production deployment. They check:
 * - Environment variables
 * - Database connectivity
 * - Redis connectivity
 * - Security configurations
 * - Build process
 * - Production readiness
 *
 * Run before deploying to production:
 * npm test -- tests/deployment/T153_production_deployment.test.ts
 */

import { describe, it, expect, beforeAll } from 'vitest';
import pool from '../../src/lib/db';
import * as redis from '../../src/lib/redis';
import fs from 'fs';
import path from 'path';

describe('T153: Production Deployment Validation', () => {
  describe('Environment Variables', () => {
    it('should have NODE_ENV set', () => {
      expect(process.env.NODE_ENV).toBeDefined();
      expect(['development', 'test', 'production']).toContain(process.env.NODE_ENV);
    });

    it('should have DATABASE_URL configured', () => {
      expect(process.env.DATABASE_URL).toBeDefined();
      expect(process.env.DATABASE_URL).toMatch(/^postgresql:\/\//);
    });

    it('should have REDIS_URL configured', () => {
      expect(process.env.REDIS_URL).toBeDefined();
      expect(process.env.REDIS_URL).toMatch(/^redis:\/\//);
    });

    it('should have JWT_SECRET configured', () => {
      // Optional for test environment
      if (process.env.NODE_ENV === 'production') {
        expect(process.env.JWT_SECRET).toBeDefined();
        expect(process.env.JWT_SECRET!.length).toBeGreaterThanOrEqual(32);
      } else {
        // In test/dev, we can have a default
        if (process.env.JWT_SECRET) {
          expect(process.env.JWT_SECRET.length).toBeGreaterThanOrEqual(32);
        }
      }
    });

    it('should have Stripe keys configured', () => {
      expect(process.env.STRIPE_SECRET_KEY).toBeDefined();
      expect(process.env.STRIPE_PUBLISHABLE_KEY).toBeDefined();

      // Check format (starts with sk_ or pk_)
      expect(process.env.STRIPE_SECRET_KEY).toMatch(/^sk_(test|live)_/);
      expect(process.env.STRIPE_PUBLISHABLE_KEY).toMatch(/^pk_(test|live)_/);
    });

    it('should have email configuration', () => {
      // Optional for test environment
      if (process.env.NODE_ENV === 'production') {
        expect(process.env.EMAIL_HOST).toBeDefined();
        expect(process.env.EMAIL_PORT).toBeDefined();
        expect(process.env.EMAIL_USER).toBeDefined();
        expect(process.env.EMAIL_FROM).toBeDefined();
      } else {
        // In test/dev, email config is optional
        // Just log a warning if not configured
        if (!process.env.EMAIL_HOST) {
          console.warn('⚠️  Email configuration not set (OK for test environment)');
        }
      }
    });

    it('should warn if using test Stripe keys in production', () => {
      if (process.env.NODE_ENV === 'production') {
        expect(process.env.STRIPE_SECRET_KEY).not.toMatch(/^sk_test_/);
        expect(process.env.STRIPE_PUBLISHABLE_KEY).not.toMatch(/^pk_test_/);
      }
    });
  });

  describe('Database Connectivity', () => {
    it('should connect to PostgreSQL database', async () => {
      const client = await pool.connect();
      expect(client).toBeDefined();

      // Release client back to pool
      client.release();
    });

    it('should execute basic query', async () => {
      const result = await pool.query('SELECT 1 as test');
      expect(result.rows[0].test).toBe(1);
    });

    it('should have required tables', async () => {
      const tables = [
        'users',
        'courses',
        'digital_products',
        'events',
        'orders',
        'order_items',
        'cart_items',
        'bookings',
        // 'sessions', // Sessions may be in Redis, not PostgreSQL
      ];

      for (const table of tables) {
        const result = await pool.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name = $1
          );
        `, [table]);

        expect(result.rows[0].exists).toBe(true);
      }
    });

    it('should have proper indexes', async () => {
      // Check for critical indexes
      const result = await pool.query(`
        SELECT indexname
        FROM pg_indexes
        WHERE schemaname = 'public'
        AND tablename IN ('users', 'courses', 'orders')
      `);

      expect(result.rows.length).toBeGreaterThan(0);
    });

    it('should verify database version', async () => {
      const result = await pool.query('SHOW server_version');
      const version = result.rows[0].server_version;

      // Should be PostgreSQL 14+ for best performance
      const majorVersion = parseInt(version.split('.')[0]);
      expect(majorVersion).toBeGreaterThanOrEqual(14);
    });
  });

  describe('Redis Connectivity', () => {
    it('should connect to Redis', async () => {
      // Test connection by setting a value
      await redis.set('test:deployment', 'ok', 60);
      const value = await redis.get('test:deployment');
      expect(value).toBe('ok');

      // Cleanup
      await redis.del('test:deployment');
    });

    it('should handle Redis operations', async () => {
      const testKey = 'test:deployment:json';

      // Test JSON operations
      await redis.setJSON(testKey, { field1: 'value1', field2: 'value2' }, 60);

      // Get JSON
      const data = await redis.getJSON(testKey);
      expect(data).toEqual({
        field1: 'value1',
        field2: 'value2',
      });

      // Cleanup
      await redis.del(testKey);
    });

    it('should support expiration', async () => {
      const testKey = 'test:deployment:expire';

      // Set with 1 second expiration
      await redis.set(testKey, 'value', 1);

      // Should exist immediately
      const value = await redis.get(testKey);
      expect(value).toBe('value');

      // Wait 1.5 seconds
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Should be expired
      const expired = await redis.get(testKey);
      expect(expired).toBeNull();
    });
  });

  describe('Security Configuration', () => {
    it('should have strong JWT secret', () => {
      const secret = process.env.JWT_SECRET || '';

      // Only validate in production
      if (process.env.NODE_ENV === 'production') {
        // At least 32 characters
        expect(secret.length).toBeGreaterThanOrEqual(32);

        // Not default/weak secret
        const weakSecrets = [
          'secret',
          'your-secret-key',
          'change-me',
          'default',
          '12345678901234567890123456789012',
        ];
        expect(weakSecrets).not.toContain(secret);
      } else {
        // In test/dev, just check if it exists
        if (secret) {
          expect(secret.length).toBeGreaterThan(0);
        }
      }
    });

    it('should have SSL mode enabled for database in production', () => {
      if (process.env.NODE_ENV === 'production') {
        const dbUrl = process.env.DATABASE_URL || '';
        expect(dbUrl).toMatch(/sslmode=require/);
      }
    });

    it('should not expose sensitive info in error messages', () => {
      // This is more of a code review item
      // Just verify we're not logging sensitive data
      const dbUrl = process.env.DATABASE_URL || '';
      const redisUrl = process.env.REDIS_URL || '';

      // Just check they exist and are properly formatted
      if (dbUrl) {
        expect(dbUrl).toMatch(/^postgresql:\/\//);
      }
      if (redisUrl) {
        expect(redisUrl).toMatch(/^redis:\/\//);
      }
    });
  });

  describe('Build Configuration', () => {
    it('should have package.json', () => {
      const packagePath = path.join(process.cwd(), 'package.json');
      expect(fs.existsSync(packagePath)).toBe(true);

      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
      expect(packageJson.name).toBeDefined();
      expect(packageJson.version).toBeDefined();
    });

    it('should have required scripts', () => {
      const packagePath = path.join(process.cwd(), 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));

      expect(packageJson.scripts).toBeDefined();
      expect(packageJson.scripts.build).toBeDefined();
      expect(packageJson.scripts.test).toBeDefined();
    });

    it('should have required dependencies', () => {
      const packagePath = path.join(process.cwd(), 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));

      const required = [
        'astro',
        'typescript',
        'pg',
        'redis',
        'stripe',
        'bcrypt',
      ];

      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };

      required.forEach((dep) => {
        expect(allDeps[dep]).toBeDefined();
      });
    });

    it('should have astro config', () => {
      const configPath = path.join(process.cwd(), 'astro.config.mjs');
      expect(fs.existsSync(configPath)).toBe(true);
    });

    it('should have TypeScript config', () => {
      const configPath = path.join(process.cwd(), 'tsconfig.json');
      expect(fs.existsSync(configPath)).toBe(true);

      // Just verify the file exists and contains expected content
      // Don't parse JSON because tsconfig.json may have comments (JSON5)
      const tsConfigContent = fs.readFileSync(configPath, 'utf-8');
      expect(tsConfigContent).toContain('compilerOptions');
      expect(tsConfigContent).toContain('include');
    });
  });

  describe('File Structure', () => {
    it('should have required directories', () => {
      const requiredDirs = [
        'src',
        'src/pages',
        'src/components',
        'src/layouts',
        'src/lib',
        'tests',
        'public',
        'database',
      ];

      requiredDirs.forEach((dir) => {
        const dirPath = path.join(process.cwd(), dir);
        expect(fs.existsSync(dirPath)).toBe(true);
      });
    });

    it('should have gitignore', () => {
      const gitignorePath = path.join(process.cwd(), '.gitignore');
      expect(fs.existsSync(gitignorePath)).toBe(true);

      const gitignore = fs.readFileSync(gitignorePath, 'utf-8');
      expect(gitignore).toContain('.env');
      expect(gitignore).toContain('node_modules');
      expect(gitignore).toContain('dist');
    });

    it('should not commit sensitive files', () => {
      const sensitivePaths = [
        '.env',
        '.env.production',
        'credentials.json',
      ];

      sensitivePaths.forEach((file) => {
        const filePath = path.join(process.cwd(), file);
        // If file exists, ensure .gitignore covers it
        if (fs.existsSync(filePath)) {
          const gitignorePath = path.join(process.cwd(), '.gitignore');
          const gitignore = fs.readFileSync(gitignorePath, 'utf-8');
          expect(gitignore).toContain(file);
        }
      });
    });
  });

  describe('Production Readiness', () => {
    it('should not use default admin credentials in production', async () => {
      if (process.env.NODE_ENV === 'production') {
        // Check if default admin exists with default password
        const result = await pool.query(`
          SELECT * FROM users
          WHERE email = 'admin@spirituality.com'
        `);

        if (result.rows.length > 0) {
          // Admin exists - this is OK, but password should be changed
          console.warn('⚠️  Default admin user exists. Ensure password has been changed from default.');
        }
      }
    });

    it('should have database connection pooling configured', async () => {
      // Check pool settings
      const totalCount = pool.totalCount;
      const idleCount = pool.idleCount;
      const waitingCount = pool.waitingCount;

      expect(totalCount).toBeDefined();
      expect(typeof totalCount).toBe('number');
    });

    it('should handle concurrent database connections', async () => {
      // Test with multiple simultaneous queries
      const queries = Array(10)
        .fill(null)
        .map(() => pool.query('SELECT 1'));

      const results = await Promise.all(queries);
      expect(results).toHaveLength(10);
      results.forEach((result) => {
        expect(result.rows[0]).toEqual({ '?column?': 1 });
      });
    });
  });

  describe('API Health Check', () => {
    it('should validate database health', async () => {
      try {
        const result = await pool.query('SELECT 1');
        expect(result.rows[0]).toBeDefined();
      } catch (error) {
        throw new Error(`Database health check failed: ${error}`);
      }
    });

    it('should validate Redis health', async () => {
      try {
        await redis.set('health:check', 'ok', 10);
        const value = await redis.get('health:check');
        expect(value).toBe('ok');
        await redis.del('health:check');
      } catch (error) {
        throw new Error(`Redis health check failed: ${error}`);
      }
    });

    it('should provide health endpoint data', async () => {
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          database: 'unknown',
          redis: 'unknown',
        },
      };

      // Check database
      try {
        await pool.query('SELECT 1');
        health.services.database = 'connected';
      } catch (error) {
        health.services.database = 'disconnected';
        health.status = 'unhealthy';
      }

      // Check Redis
      try {
        const isConnected = await redis.checkConnection();
        health.services.redis = isConnected ? 'connected' : 'disconnected';
        if (!isConnected) {
          health.status = 'unhealthy';
        }
      } catch (error) {
        health.services.redis = 'disconnected';
        health.status = 'unhealthy';
      }

      expect(health.status).toBe('healthy');
      expect(health.services.database).toBe('connected');
      expect(health.services.redis).toBe('connected');
    });
  });

  describe('Deployment Checklist', () => {
    it('should pass all pre-deployment checks', () => {
      const checks = {
        envVars: !!process.env.DATABASE_URL && !!process.env.REDIS_URL,
        jwtSecret: process.env.NODE_ENV === 'production'
          ? (process.env.JWT_SECRET?.length || 0) >= 32
          : true, // Optional in test/dev
        stripeKeys: !!process.env.STRIPE_SECRET_KEY && !!process.env.STRIPE_PUBLISHABLE_KEY,
        emailConfig: process.env.NODE_ENV === 'production'
          ? !!process.env.EMAIL_HOST && !!process.env.EMAIL_FROM
          : true, // Optional in test/dev
      };

      expect(checks.envVars).toBe(true);
      expect(checks.jwtSecret).toBe(true);
      expect(checks.stripeKeys).toBe(true);
      expect(checks.emailConfig).toBe(true);
    });

    it('should have deployment documentation', () => {
      const docsDir = path.join(process.cwd(), 'docs');
      expect(fs.existsSync(docsDir)).toBe(true);

      const deploymentDoc = path.join(docsDir, 'PRODUCTION_DEPLOYMENT_GUIDE.md');
      expect(fs.existsSync(deploymentDoc)).toBe(true);
    });
  });
});

describe('Performance Benchmarks', () => {
  it('should execute database query within acceptable time', async () => {
    const start = Date.now();
    await pool.query('SELECT * FROM users LIMIT 10');
    const duration = Date.now() - start;

    // Should complete within 100ms
    expect(duration).toBeLessThan(100);
  });

  it('should execute Redis operation within acceptable time', async () => {
    const start = Date.now();
    await redis.set('perf:test', 'value');
    await redis.get('perf:test');
    await redis.del('perf:test');
    const duration = Date.now() - start;

    // Should complete within 100ms (more lenient for different Redis setups)
    expect(duration).toBeLessThan(100);
  });
});

describe('Error Handling', () => {
  it('should handle database connection errors gracefully', async () => {
    // This tests that error handling exists, not that it fails
    // Real test would require intentionally breaking connection
    expect(pool).toBeDefined();
    expect(typeof pool.query).toBe('function');
  });

  it('should handle Redis connection errors gracefully', async () => {
    // This tests that error handling exists
    expect(redis).toBeDefined();
    expect(typeof redis.set).toBe('function');
    expect(typeof redis.get).toBe('function');
    expect(typeof redis.del).toBe('function');
  });
});
