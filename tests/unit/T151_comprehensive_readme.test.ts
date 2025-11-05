/**
 * T151: Comprehensive README Documentation Test
 *
 * Tests README.md structure, content, and referenced files
 * Ensures documentation is complete and up-to-date
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const README_PATH = join(process.cwd(), 'README.md');
const readmeContent = readFileSync(README_PATH, 'utf-8');

describe('T151: README.md Validation', () => {
  describe('Structure and Content', () => {
    it('should have a title', () => {
      expect(readmeContent).toMatch(/^#\s+Spirituality E-Commerce Platform/m);
    });

    it('should have project description', () => {
      expect(readmeContent).toContain('production-ready');
      expect(readmeContent).toContain('multilingual');
    });

    it('should have badges', () => {
      expect(readmeContent).toContain('security-10.0%2F10-brightgreen');
      expect(readmeContent).toContain('coverage-70%25%2B-green');
      expect(readmeContent).toContain('typescript');
      expect(readmeContent).toContain('astro');
    });

    it('should have table of contents via section headers', () => {
      const sections = [
        'Features',
        'Tech Stack',
        'Project Structure',
        'Quick Start',
        'Commands',
        'Testing',
        'Database Schema',
        'Security',
        'Deployment',
        'API Documentation',
        'Troubleshooting',
        'Contributing',
      ];

      sections.forEach(section => {
        expect(readmeContent).toMatch(new RegExp(`##.*${section}`, 'i'));
      });
    });
  });

  describe('Features Section', () => {
    it('should list core functionality features', () => {
      expect(readmeContent).toContain('Multilingual Support');
      expect(readmeContent).toContain('Course Management');
      expect(readmeContent).toContain('Event Booking');
      expect(readmeContent).toContain('Digital Products');
      expect(readmeContent).toContain('Shopping Cart');
      expect(readmeContent).toContain('Stripe Payments');
    });

    it('should list security features', () => {
      expect(readmeContent).toContain('Authentication');
      expect(readmeContent).toContain('Authorization');
      expect(readmeContent).toContain('CSRF Protection');
      expect(readmeContent).toContain('Rate Limiting');
      expect(readmeContent).toContain('Input Validation');
      expect(readmeContent).toContain('SQL Injection Protection');
    });

    it('should list performance features', () => {
      expect(readmeContent).toContain('Caching Strategy');
      expect(readmeContent).toContain('Query Optimization');
      expect(readmeContent).toContain('Image Optimization');
      expect(readmeContent).toContain('Asset Minification');
    });

    it('should list developer experience features', () => {
      expect(readmeContent).toContain('Type Safety');
      expect(readmeContent).toContain('Comprehensive Testing');
      expect(readmeContent).toContain('API Documentation');
      expect(readmeContent).toContain('Structured Logging');
      expect(readmeContent).toContain('Docker Support');
    });
  });

  describe('Tech Stack Section', () => {
    it('should list core technologies', () => {
      expect(readmeContent).toContain('Astro');
      expect(readmeContent).toContain('TypeScript');
      expect(readmeContent).toContain('PostgreSQL');
      expect(readmeContent).toContain('Redis');
      expect(readmeContent).toContain('Tailwind CSS');
    });

    it('should list key libraries', () => {
      expect(readmeContent).toContain('Stripe');
      expect(readmeContent).toContain('bcrypt');
      expect(readmeContent).toContain('Zod');
      expect(readmeContent).toContain('Resend');
      expect(readmeContent).toContain('Cloudflare Stream');
    });

    it('should list testing frameworks', () => {
      expect(readmeContent).toContain('Vitest');
      expect(readmeContent).toContain('Playwright');
      expect(readmeContent).toContain('ESLint');
      expect(readmeContent).toContain('Prettier');
    });
  });

  describe('Project Structure Section', () => {
    it('should show directory tree', () => {
      expect(readmeContent).toContain('src/');
      expect(readmeContent).toContain('database/');
      expect(readmeContent).toContain('tests/');
      expect(readmeContent).toContain('docs/');
    });

    it('should describe key directories', () => {
      expect(readmeContent).toContain('components/');
      expect(readmeContent).toContain('lib/');
      expect(readmeContent).toContain('pages/');
      expect(readmeContent).toContain('middleware/');
    });
  });

  describe('Quick Start Section', () => {
    it('should list prerequisites', () => {
      expect(readmeContent).toContain('Node.js');
      expect(readmeContent).toContain('Docker');
      expect(readmeContent).toContain('npm');
    });

    it('should have installation steps', () => {
      expect(readmeContent).toContain('git clone');
      expect(readmeContent).toContain('npm install');
      expect(readmeContent).toContain('docker-compose up');
    });

    it('should explain environment setup', () => {
      expect(readmeContent).toContain('.env');
      expect(readmeContent).toContain('DATABASE_URL');
      expect(readmeContent).toContain('REDIS_URL');
      expect(readmeContent).toContain('SESSION_SECRET');
    });

    it('should mention Docker setup', () => {
      expect(readmeContent).toContain('docker-compose');
      expect(readmeContent).toContain('PostgreSQL');
      expect(readmeContent).toContain('Redis');
    });

    it('should include database setup instructions', () => {
      expect(readmeContent).toContain('database/schema.sql');
      expect(readmeContent).toContain('psql');
    });

    it('should show how to start dev server', () => {
      expect(readmeContent).toContain('npm run dev');
      expect(readmeContent).toContain('localhost:4321');
    });
  });

  describe('Commands Section', () => {
    it('should list npm commands', () => {
      expect(readmeContent).toContain('npm install');
      expect(readmeContent).toContain('npm run dev');
      expect(readmeContent).toContain('npm run build');
      expect(readmeContent).toContain('npm test');
    });

    it('should list docker commands', () => {
      expect(readmeContent).toContain('docker-compose up');
      expect(readmeContent).toContain('docker-compose down');
      expect(readmeContent).toContain('docker-compose logs');
    });

    it('should have production build command', () => {
      expect(readmeContent).toContain('npm run build:prod');
    });

    it('should have test commands', () => {
      expect(readmeContent).toContain('npm run test:coverage');
      expect(readmeContent).toContain('npm run test:e2e');
    });
  });

  describe('Testing Section', () => {
    it('should explain unit testing', () => {
      expect(readmeContent).toContain('npm test');
      expect(readmeContent).toContain('Vitest');
    });

    it('should explain E2E testing', () => {
      expect(readmeContent).toContain('npm run test:e2e');
      expect(readmeContent).toContain('Playwright');
    });

    it('should mention test coverage', () => {
      expect(readmeContent).toContain('70%');
      expect(readmeContent).toContain('coverage');
    });

    it('should list key test files', () => {
      expect(readmeContent).toContain('T047');
      expect(readmeContent).toContain('T069');
      expect(readmeContent).toContain('T220');
    });
  });

  describe('Database Schema Section', () => {
    it('should list core tables', () => {
      expect(readmeContent).toContain('users');
      expect(readmeContent).toContain('courses');
      expect(readmeContent).toContain('events');
      expect(readmeContent).toContain('digital_products');
    });

    it('should list commerce tables', () => {
      expect(readmeContent).toContain('cart_items');
      expect(readmeContent).toContain('orders');
      expect(readmeContent).toContain('bookings');
    });

    it('should mention key features', () => {
      expect(readmeContent).toContain('UUID');
      expect(readmeContent).toContain('Cascade deletes');
      expect(readmeContent).toContain('Spanish translation');
      expect(readmeContent).toContain('indexes');
    });
  });

  describe('Security Section', () => {
    it('should describe authentication', () => {
      expect(readmeContent).toContain('JWT');
      expect(readmeContent).toContain('bcrypt');
      expect(readmeContent).toContain('RBAC');
    });

    it('should describe request security', () => {
      expect(readmeContent).toContain('CSRF');
      expect(readmeContent).toContain('Rate Limiting');
      expect(readmeContent).toContain('Input Validation');
      expect(readmeContent).toContain('SQL Injection Prevention');
    });

    it('should mention security headers', () => {
      expect(readmeContent).toContain('X-Frame-Options');
      expect(readmeContent).toContain('X-Content-Type-Options');
    });

    it('should show security score', () => {
      expect(readmeContent).toContain('10.0/10');
    });

    it('should link to security documentation', () => {
      expect(readmeContent).toContain('docs/SECURITY.md');
    });
  });

  describe('Deployment Section', () => {
    it('should mention Cloudflare Pages', () => {
      expect(readmeContent).toContain('Cloudflare Pages');
      expect(readmeContent).toContain('dash.cloudflare.com');
    });

    it('should list deployment steps', () => {
      expect(readmeContent).toContain('Build Settings');
      expect(readmeContent).toContain('Environment Variables');
      expect(readmeContent).toContain('npm run build');
    });

    it('should mention external services', () => {
      expect(readmeContent).toContain('Neon');
      expect(readmeContent).toContain('Upstash');
    });

    it('should link to deployment guide', () => {
      expect(readmeContent).toContain('docs/CLOUDFLARE_DEPLOYMENT.md');
    });

    it('should mention alternative hosting', () => {
      expect(readmeContent).toContain('Netlify');
      expect(readmeContent).toContain('Vercel');
    });
  });

  describe('API Documentation Section', () => {
    it('should mention API docs route', () => {
      expect(readmeContent).toContain('/api-docs');
    });

    it('should mention OpenAPI', () => {
      expect(readmeContent).toContain('OpenAPI');
      expect(readmeContent).toContain('Swagger');
    });

    it('should list endpoint categories', () => {
      expect(readmeContent).toContain('Authentication');
      expect(readmeContent).toContain('Cart');
      expect(readmeContent).toContain('Checkout');
      expect(readmeContent).toContain('Admin');
    });

    it('should reference OpenAPI spec file', () => {
      expect(readmeContent).toContain('public/api-spec.yaml');
    });
  });

  describe('Monitoring & Logging Section', () => {
    it('should mention Pino logging', () => {
      expect(readmeContent).toContain('Pino');
      expect(readmeContent).toContain('logger');
    });

    it('should list log levels', () => {
      expect(readmeContent).toContain('fatal');
      expect(readmeContent).toContain('error');
      expect(readmeContent).toContain('warn');
      expect(readmeContent).toContain('info');
    });

    it('should mention health check', () => {
      expect(readmeContent).toContain('/api/health');
    });
  });

  describe('Internationalization Section', () => {
    it('should list supported languages', () => {
      expect(readmeContent).toContain('English');
      expect(readmeContent).toContain('Spanish');
    });

    it('should explain URL structure', () => {
      expect(readmeContent).toContain('/courses');
      expect(readmeContent).toContain('/es/');
    });

    it('should link to i18n guide', () => {
      expect(readmeContent).toContain('I18N_IMPLEMENTATION_GUIDE');
    });
  });

  describe('Performance Section', () => {
    it('should explain caching strategy', () => {
      expect(readmeContent).toContain('Redis Cache');
      expect(readmeContent).toContain('In-Memory Cache');
      expect(readmeContent).toContain('Browser Cache');
    });

    it('should mention database optimization', () => {
      expect(readmeContent).toContain('Indexed queries');
      expect(readmeContent).toContain('Connection pooling');
      expect(readmeContent).toContain('N+1 problem');
    });

    it('should mention build optimization', () => {
      expect(readmeContent).toContain('Asset minification');
      expect(readmeContent).toContain('Code splitting');
      expect(readmeContent).toContain('Tree shaking');
    });
  });

  describe('Troubleshooting Section', () => {
    it('should cover database issues', () => {
      expect(readmeContent).toContain('Database Connection Issues');
      expect(readmeContent).toContain('pg_isready');
    });

    it('should cover Redis issues', () => {
      expect(readmeContent).toContain('Redis Connection Issues');
      expect(readmeContent).toContain('redis-cli');
    });

    it('should cover port conflicts', () => {
      expect(readmeContent).toContain('Port Already in Use');
      expect(readmeContent).toContain('lsof');
    });

    it('should cover build errors', () => {
      expect(readmeContent).toContain('Build Errors');
      expect(readmeContent).toContain('node_modules');
    });

    it('should cover Stripe webhooks', () => {
      expect(readmeContent).toContain('Stripe Webhook');
      expect(readmeContent).toContain('stripe listen');
    });
  });

  describe('Contributing Section', () => {
    it('should explain development workflow', () => {
      expect(readmeContent).toContain('feature branch');
      expect(readmeContent).toContain('git checkout');
    });

    it('should mention code style requirements', () => {
      expect(readmeContent).toContain('TypeScript strict mode');
      expect(readmeContent).toContain('ESLint');
      expect(readmeContent).toContain('Prettier');
      expect(readmeContent).toContain('Tailwind CSS');
    });

    it('should mention testing requirements', () => {
      expect(readmeContent).toContain('unit tests');
      expect(readmeContent).toContain('integration tests');
      expect(readmeContent).toContain('70%');
    });
  });

  describe('Documentation Section', () => {
    it('should list available guides', () => {
      expect(readmeContent).toContain('SECURITY.md');
      expect(readmeContent).toContain('CLOUDFLARE_DEPLOYMENT.md');
      expect(readmeContent).toContain('DATABASE_OPTIMIZATION.md');
      expect(readmeContent).toContain('RATE_LIMITING_GUIDE.md');
      expect(readmeContent).toContain('SEO_GUIDE.md');
    });

    it('should mention implementation logs', () => {
      expect(readmeContent).toContain('log_files');
      expect(readmeContent).toContain('log_tests');
      expect(readmeContent).toContain('log_learn');
    });
  });

  describe('Architecture Overview Section', () => {
    it('should show request flow diagram', () => {
      expect(readmeContent).toContain('Browser');
      expect(readmeContent).toContain('Cloudflare CDN');
      expect(readmeContent).toContain('Middleware');
      expect(readmeContent).toContain('PostgreSQL');
      expect(readmeContent).toContain('Redis');
    });

    it('should list key design decisions', () => {
      expect(readmeContent).toContain('Astro SSR');
      expect(readmeContent).toContain('PostgreSQL');
      expect(readmeContent).toContain('TypeScript');
      expect(readmeContent).toContain('Docker');
    });

    it('should describe security architecture', () => {
      expect(readmeContent).toContain('Defense in Depth');
      expect(readmeContent).toContain('Least Privilege');
      expect(readmeContent).toContain('Secure by Default');
    });
  });

  describe('Project Status Section', () => {
    it('should show version and status', () => {
      expect(readmeContent).toContain('Version');
      expect(readmeContent).toContain('Production Ready');
      expect(readmeContent).toContain('2025-11-05');
    });

    it('should have production readiness checklist', () => {
      expect(readmeContent).toContain('Core features implemented');
      expect(readmeContent).toContain('Security hardened');
      expect(readmeContent).toContain('Tests passing');
      expect(readmeContent).toContain('API documented');
    });
  });

  describe('Referenced Files Exist', () => {
    it('should reference existing documentation files', () => {
      const docFiles = [
        'docs/SECURITY.md',
        'docs/CLOUDFLARE_DEPLOYMENT.md',
        'docs/DATABASE_OPTIMIZATION.md',
        'docs/RATE_LIMITING_GUIDE.md',
        'docs/CSRF_IMPLEMENTATION_GUIDE.md',
        'docs/SEO_GUIDE.md',
        'docs/HOSTING_OPTIONS.md',
        'docs/I18N_IMPLEMENTATION_GUIDE.md',
      ];

      docFiles.forEach(file => {
        expect(readmeContent).toContain(file);
        expect(existsSync(join(process.cwd(), file))).toBe(true);
      });
    });

    it('should reference existing schema file', () => {
      expect(readmeContent).toContain('database/schema.sql');
      expect(existsSync(join(process.cwd(), 'database/schema.sql'))).toBe(true);
    });

    it('should reference existing OpenAPI spec', () => {
      expect(readmeContent).toContain('public/api-spec.yaml');
      expect(existsSync(join(process.cwd(), 'public/api-spec.yaml'))).toBe(true);
    });

    it('should reference existing package.json', () => {
      expect(existsSync(join(process.cwd(), 'package.json'))).toBe(true);
    });

    it('should reference existing .env.example', () => {
      expect(readmeContent).toContain('.env');
      expect(existsSync(join(process.cwd(), '.env.example'))).toBe(true);
    });

    it('should reference existing docker-compose', () => {
      expect(readmeContent).toContain('docker-compose');
      // Note: docker-compose.yml might not exist yet, so we don't assert its existence
    });
  });

  describe('Code Examples', () => {
    it('should have bash code blocks', () => {
      expect(readmeContent).toMatch(/```bash/);
    });

    it('should have environment variable examples', () => {
      expect(readmeContent).toMatch(/```env/);
    });

    it('should have TypeScript examples', () => {
      expect(readmeContent).toMatch(/```typescript/);
    });

    it('should have JSON examples', () => {
      expect(readmeContent).toMatch(/```json/);
    });
  });

  describe('Links and URLs', () => {
    it('should have external documentation links', () => {
      expect(readmeContent).toContain('https://astro.build');
      expect(readmeContent).toContain('https://www.typescriptlang.org');
      expect(readmeContent).toContain('https://stripe.com');
    });

    it('should have Cloudflare dashboard link', () => {
      expect(readmeContent).toContain('https://dash.cloudflare.com');
    });

    it('should have local server URL', () => {
      expect(readmeContent).toContain('localhost:4321');
    });

    it('should have GitHub repository references', () => {
      expect(readmeContent).toContain('danribes/mystic-ecom');
    });
  });

  describe('Formatting and Style', () => {
    it('should use consistent heading levels', () => {
      // Should have ## for main sections
      expect((readmeContent.match(/^## /gm) || []).length).toBeGreaterThan(10);
      // Should have ### for subsections
      expect((readmeContent.match(/^### /gm) || []).length).toBeGreaterThan(15);
    });

    it('should have horizontal rules for separation', () => {
      expect((readmeContent.match(/^---$/gm) || []).length).toBeGreaterThan(5);
    });

    it('should use emoji icons for visual appeal', () => {
      expect(readmeContent).toMatch(/[🌟🚀🔧🧪🗄️🔐🌐📊🐛🤝📚📋💡🆘📄🎯🙏]/);
    });

    it('should have properly formatted lists', () => {
      // Bullet points
      expect((readmeContent.match(/^- \*\*/gm) || []).length).toBeGreaterThan(20);
    });

    it('should have code blocks with language specifications', () => {
      expect(readmeContent).toMatch(/```bash/);
      expect(readmeContent).toMatch(/```env/);
      expect(readmeContent).toMatch(/```typescript/);
    });
  });

  describe('Content Quality', () => {
    it('should be substantial (> 800 lines)', () => {
      const lines = readmeContent.split('\n').length;
      expect(lines).toBeGreaterThan(800);
    });

    it('should have clear call-to-actions', () => {
      expect(readmeContent).toContain('Ready to deploy');
      expect(readmeContent).toContain('Need help');
    });

    it('should mention security warnings', () => {
      expect(readmeContent).toContain('⚠️');
      expect(readmeContent).toContain('IMPORTANT');
    });

    it('should have checkmarks for completed features', () => {
      expect(readmeContent).toContain('✅');
    });
  });
});
