import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import yaml from 'js-yaml';

describe('T220: API Documentation', () => {
  describe('OpenAPI Specification', () => {
    let apiSpec: any;

    beforeEach(() => {
      const specPath = join(process.cwd(), 'public', 'api-spec.yaml');
      const specContent = readFileSync(specPath, 'utf8');
      apiSpec = yaml.load(specContent);
    });

    it('should have valid OpenAPI 3.0.3 structure', () => {
      expect(apiSpec.openapi).toBe('3.0.3');
      expect(apiSpec.info).toBeDefined();
      expect(apiSpec.info.title).toBe('Spirituality Platform API');
      expect(apiSpec.info.version).toBe('1.0.0');
    });

    it('should define servers', () => {
      expect(apiSpec.servers).toBeDefined();
      expect(apiSpec.servers.length).toBeGreaterThan(0);
      expect(apiSpec.servers[0].url).toContain('/api');
    });

    it('should define all required tags', () => {
      const expectedTags = [
        'Authentication',
        'Cart',
        'Checkout',
        'Courses',
        'Products',
        'Events',
        'Reviews',
        'User',
        'Admin',
        'Health'
      ];

      const definedTags = apiSpec.tags.map((tag: any) => tag.name);
      expectedTags.forEach(tag => {
        expect(definedTags).toContain(tag);
      });
    });

    it('should define authentication security scheme', () => {
      expect(apiSpec.components.securitySchemes).toBeDefined();
      expect(apiSpec.components.securitySchemes.cookieAuth).toBeDefined();
      expect(apiSpec.components.securitySchemes.cookieAuth.type).toBe('apiKey');
      expect(apiSpec.components.securitySchemes.cookieAuth.in).toBe('cookie');
      expect(apiSpec.components.securitySchemes.cookieAuth.name).toBe('session');
    });

    describe('Authentication Endpoints', () => {
      it('should define /auth/register endpoint', () => {
        expect(apiSpec.paths['/auth/register']).toBeDefined();
        expect(apiSpec.paths['/auth/register'].post).toBeDefined();
        expect(apiSpec.paths['/auth/register'].post.tags).toContain('Authentication');
      });

      it('should define /auth/login endpoint', () => {
        expect(apiSpec.paths['/auth/login']).toBeDefined();
        expect(apiSpec.paths['/auth/login'].post).toBeDefined();
        expect(apiSpec.paths['/auth/login'].post.tags).toContain('Authentication');
      });

      it('should define /auth/logout endpoint', () => {
        expect(apiSpec.paths['/auth/logout']).toBeDefined();
        expect(apiSpec.paths['/auth/logout'].post).toBeDefined();
      });

      it('should define /auth/forgot-password endpoint', () => {
        expect(apiSpec.paths['/auth/forgot-password']).toBeDefined();
        expect(apiSpec.paths['/auth/forgot-password'].post).toBeDefined();
      });

      it('should define /auth/reset-password endpoint', () => {
        expect(apiSpec.paths['/auth/reset-password']).toBeDefined();
        expect(apiSpec.paths['/auth/reset-password'].post).toBeDefined();
      });

      it('should define /auth/verify-email endpoint', () => {
        expect(apiSpec.paths['/auth/verify-email']).toBeDefined();
        expect(apiSpec.paths['/auth/verify-email'].get).toBeDefined();
      });

      it('should define /auth/resend-verification endpoint', () => {
        expect(apiSpec.paths['/auth/resend-verification']).toBeDefined();
        expect(apiSpec.paths['/auth/resend-verification'].post).toBeDefined();
      });
    });

    describe('Cart Endpoints', () => {
      it('should define /cart endpoint', () => {
        expect(apiSpec.paths['/cart']).toBeDefined();
        expect(apiSpec.paths['/cart'].get).toBeDefined();
        expect(apiSpec.paths['/cart'].get.tags).toContain('Cart');
      });

      it('should define /cart/add endpoint', () => {
        expect(apiSpec.paths['/cart/add']).toBeDefined();
        expect(apiSpec.paths['/cart/add'].post).toBeDefined();
        expect(apiSpec.paths['/cart/add'].post.requestBody).toBeDefined();
      });

      it('should define /cart/remove endpoint', () => {
        expect(apiSpec.paths['/cart/remove']).toBeDefined();
        expect(apiSpec.paths['/cart/remove'].post).toBeDefined();
      });
    });

    describe('Checkout Endpoints', () => {
      it('should define /checkout/create-session endpoint', () => {
        expect(apiSpec.paths['/checkout/create-session']).toBeDefined();
        expect(apiSpec.paths['/checkout/create-session'].post).toBeDefined();
        expect(apiSpec.paths['/checkout/create-session'].post.security).toBeDefined();
      });

      it('should define /checkout/webhook endpoint', () => {
        expect(apiSpec.paths['/checkout/webhook']).toBeDefined();
        expect(apiSpec.paths['/checkout/webhook'].post).toBeDefined();
      });
    });

    describe('Course Endpoints', () => {
      it('should define /courses endpoint', () => {
        expect(apiSpec.paths['/courses']).toBeDefined();
        expect(apiSpec.paths['/courses'].get).toBeDefined();
        expect(apiSpec.paths['/courses'].get.tags).toContain('Courses');
      });

      it('should define /courses/featured endpoint', () => {
        expect(apiSpec.paths['/courses/featured']).toBeDefined();
        expect(apiSpec.paths['/courses/featured'].get).toBeDefined();
      });

      it('should define /courses/{id} endpoint', () => {
        expect(apiSpec.paths['/courses/{id}']).toBeDefined();
        expect(apiSpec.paths['/courses/{id}'].get).toBeDefined();
        expect(apiSpec.paths['/courses/{id}'].get.parameters).toBeDefined();
      });

      it('should define /courses/slug/{slug} endpoint', () => {
        expect(apiSpec.paths['/courses/slug/{slug}']).toBeDefined();
        expect(apiSpec.paths['/courses/slug/{slug}'].get).toBeDefined();
      });

      it('should define /courses/{courseId}/progress endpoint', () => {
        expect(apiSpec.paths['/courses/{courseId}/progress']).toBeDefined();
        expect(apiSpec.paths['/courses/{courseId}/progress'].get).toBeDefined();
        expect(apiSpec.paths['/courses/{courseId}/progress'].get.security).toBeDefined();
      });
    });

    describe('Lesson Endpoints', () => {
      it('should define /lessons/{lessonId}/start endpoint', () => {
        expect(apiSpec.paths['/lessons/{lessonId}/start']).toBeDefined();
        expect(apiSpec.paths['/lessons/{lessonId}/start'].post).toBeDefined();
        expect(apiSpec.paths['/lessons/{lessonId}/start'].post.security).toBeDefined();
      });

      it('should define /lessons/{lessonId}/complete endpoint', () => {
        expect(apiSpec.paths['/lessons/{lessonId}/complete']).toBeDefined();
        expect(apiSpec.paths['/lessons/{lessonId}/complete'].post).toBeDefined();
      });

      it('should define /lessons/{lessonId}/time endpoint', () => {
        expect(apiSpec.paths['/lessons/{lessonId}/time']).toBeDefined();
        expect(apiSpec.paths['/lessons/{lessonId}/time'].post).toBeDefined();
        expect(apiSpec.paths['/lessons/{lessonId}/time'].post.requestBody).toBeDefined();
      });
    });

    describe('Product Endpoints', () => {
      it('should define /products/download/{id} endpoint', () => {
        expect(apiSpec.paths['/products/download/{id}']).toBeDefined();
        expect(apiSpec.paths['/products/download/{id}'].get).toBeDefined();
        expect(apiSpec.paths['/products/download/{id}'].get.security).toBeDefined();
      });
    });

    describe('Event Endpoints', () => {
      it('should define /events/book endpoint', () => {
        expect(apiSpec.paths['/events/book']).toBeDefined();
        expect(apiSpec.paths['/events/book'].post).toBeDefined();
        expect(apiSpec.paths['/events/book'].post.requestBody).toBeDefined();
      });
    });

    describe('Review Endpoints', () => {
      it('should define /reviews/submit endpoint', () => {
        expect(apiSpec.paths['/reviews/submit']).toBeDefined();
        expect(apiSpec.paths['/reviews/submit'].post).toBeDefined();
        expect(apiSpec.paths['/reviews/submit'].post.requestBody).toBeDefined();
      });
    });

    describe('User Endpoints', () => {
      it('should define /user/profile endpoint with GET', () => {
        expect(apiSpec.paths['/user/profile']).toBeDefined();
        expect(apiSpec.paths['/user/profile'].get).toBeDefined();
        expect(apiSpec.paths['/user/profile'].get.security).toBeDefined();
      });

      it('should define /user/profile endpoint with PUT', () => {
        expect(apiSpec.paths['/user/profile'].put).toBeDefined();
        expect(apiSpec.paths['/user/profile'].put.requestBody).toBeDefined();
      });
    });

    describe('Search Endpoint', () => {
      it('should define /search endpoint', () => {
        expect(apiSpec.paths['/search']).toBeDefined();
        expect(apiSpec.paths['/search'].get).toBeDefined();
        expect(apiSpec.paths['/search'].get.parameters).toBeDefined();
      });
    });

    describe('Health Check Endpoint', () => {
      it('should define /health endpoint', () => {
        expect(apiSpec.paths['/health']).toBeDefined();
        expect(apiSpec.paths['/health'].get).toBeDefined();
        expect(apiSpec.paths['/health'].get.tags).toContain('Health');
      });
    });

    describe('Admin Endpoints', () => {
      it('should define /admin/orders endpoint', () => {
        expect(apiSpec.paths['/admin/orders']).toBeDefined();
        expect(apiSpec.paths['/admin/orders'].get).toBeDefined();
        expect(apiSpec.paths['/admin/orders'].get.security).toBeDefined();
      });

      it('should define /admin/cache endpoints', () => {
        expect(apiSpec.paths['/admin/cache']).toBeDefined();
        expect(apiSpec.paths['/admin/cache'].get).toBeDefined();
        expect(apiSpec.paths['/admin/cache'].post).toBeDefined();
      });

      it('should define /admin/query-stats endpoint', () => {
        expect(apiSpec.paths['/admin/query-stats']).toBeDefined();
        expect(apiSpec.paths['/admin/query-stats'].get).toBeDefined();
      });

      it('should define /admin/products endpoints', () => {
        expect(apiSpec.paths['/admin/products']).toBeDefined();
        expect(apiSpec.paths['/admin/products'].get).toBeDefined();
        expect(apiSpec.paths['/admin/products/{id}']).toBeDefined();
        expect(apiSpec.paths['/admin/products/{id}'].put).toBeDefined();
        expect(apiSpec.paths['/admin/products/{id}'].delete).toBeDefined();
      });

      it('should define /admin/courses endpoint', () => {
        expect(apiSpec.paths['/admin/courses']).toBeDefined();
        expect(apiSpec.paths['/admin/courses'].get).toBeDefined();
      });

      it('should define /admin/events endpoints', () => {
        expect(apiSpec.paths['/admin/events']).toBeDefined();
        expect(apiSpec.paths['/admin/events'].get).toBeDefined();
        expect(apiSpec.paths['/admin/events/{id}']).toBeDefined();
        expect(apiSpec.paths['/admin/events/{id}'].put).toBeDefined();
        expect(apiSpec.paths['/admin/events/{id}'].delete).toBeDefined();
      });

      it('should define /admin/reviews endpoints', () => {
        expect(apiSpec.paths['/admin/reviews/approve']).toBeDefined();
        expect(apiSpec.paths['/admin/reviews/approve'].post).toBeDefined();
        expect(apiSpec.paths['/admin/reviews/reject']).toBeDefined();
        expect(apiSpec.paths['/admin/reviews/reject'].post).toBeDefined();
      });
    });

    describe('Schema Definitions', () => {
      it('should define User schema', () => {
        expect(apiSpec.components.schemas.User).toBeDefined();
        expect(apiSpec.components.schemas.User.properties.id).toBeDefined();
        expect(apiSpec.components.schemas.User.properties.email).toBeDefined();
        expect(apiSpec.components.schemas.User.properties.name).toBeDefined();
      });

      it('should define Course schema', () => {
        expect(apiSpec.components.schemas.Course).toBeDefined();
        expect(apiSpec.components.schemas.Course.properties.id).toBeDefined();
        expect(apiSpec.components.schemas.Course.properties.title).toBeDefined();
        expect(apiSpec.components.schemas.Course.properties.price).toBeDefined();
      });

      it('should define Product schema', () => {
        expect(apiSpec.components.schemas.Product).toBeDefined();
        expect(apiSpec.components.schemas.Product.properties.id).toBeDefined();
        expect(apiSpec.components.schemas.Product.properties.title).toBeDefined();
        expect(apiSpec.components.schemas.Product.properties.productType).toBeDefined();
      });

      it('should define Event schema', () => {
        expect(apiSpec.components.schemas.Event).toBeDefined();
        expect(apiSpec.components.schemas.Event.properties.id).toBeDefined();
        expect(apiSpec.components.schemas.Event.properties.date).toBeDefined();
        expect(apiSpec.components.schemas.Event.properties.capacity).toBeDefined();
      });

      it('should define CartItem schema', () => {
        expect(apiSpec.components.schemas.CartItem).toBeDefined();
        expect(apiSpec.components.schemas.CartItem.properties.itemType).toBeDefined();
      });

      it('should define Order schema', () => {
        expect(apiSpec.components.schemas.Order).toBeDefined();
        expect(apiSpec.components.schemas.Order.properties.status).toBeDefined();
      });

      it('should define HealthResponse schema', () => {
        expect(apiSpec.components.schemas.HealthResponse).toBeDefined();
        expect(apiSpec.components.schemas.HealthResponse.properties.status).toBeDefined();
        expect(apiSpec.components.schemas.HealthResponse.properties.checks).toBeDefined();
      });

      it('should define Error schema', () => {
        expect(apiSpec.components.schemas.Error).toBeDefined();
        expect(apiSpec.components.schemas.Error.properties.success).toBeDefined();
        expect(apiSpec.components.schemas.Error.properties.error).toBeDefined();
      });
    });

    describe('Response Definitions', () => {
      it('should define standard error responses', () => {
        expect(apiSpec.components.responses.BadRequest).toBeDefined();
        expect(apiSpec.components.responses.Unauthorized).toBeDefined();
        expect(apiSpec.components.responses.Forbidden).toBeDefined();
        expect(apiSpec.components.responses.NotFound).toBeDefined();
        expect(apiSpec.components.responses.RateLimited).toBeDefined();
        expect(apiSpec.components.responses.ServerError).toBeDefined();
      });

      it('should define rate limit headers in RateLimited response', () => {
        const rateLimitedResponse = apiSpec.components.responses.RateLimited;
        expect(rateLimitedResponse.headers).toBeDefined();
        expect(rateLimitedResponse.headers['X-RateLimit-Limit']).toBeDefined();
        expect(rateLimitedResponse.headers['X-RateLimit-Remaining']).toBeDefined();
        expect(rateLimitedResponse.headers['X-RateLimit-Reset']).toBeDefined();
      });
    });
  });

  describe('API Documentation Page Structure', () => {
    it('should have api-docs.astro page', () => {
      const apiDocsPath = join(process.cwd(), 'src', 'pages', 'api-docs.astro');
      const apiDocsContent = readFileSync(apiDocsPath, 'utf8');

      expect(apiDocsContent).toContain('API Documentation');
      expect(apiDocsContent).toContain('swagger-ui');
      expect(apiDocsContent).toContain('SwaggerUIBundle');
    });

    it('should load Swagger UI from CDN', () => {
      const apiDocsPath = join(process.cwd(), 'src', 'pages', 'api-docs.astro');
      const apiDocsContent = readFileSync(apiDocsPath, 'utf8');

      expect(apiDocsContent).toContain('swagger-ui-dist');
      expect(apiDocsContent).toContain('swagger-ui.css');
      expect(apiDocsContent).toContain('swagger-ui-bundle.js');
    });

    it('should initialize Swagger UI with correct config', () => {
      const apiDocsPath = join(process.cwd(), 'src', 'pages', 'api-docs.astro');
      const apiDocsContent = readFileSync(apiDocsPath, 'utf8');

      expect(apiDocsContent).toContain('url: \'/api-spec.yaml\'');
      expect(apiDocsContent).toContain('deepLinking: true');
      expect(apiDocsContent).toContain('request.credentials = \'include\'');
    });

    it('should have Tailwind CSS styling', () => {
      const apiDocsPath = join(process.cwd(), 'src', 'pages', 'api-docs.astro');
      const apiDocsContent = readFileSync(apiDocsPath, 'utf8');

      expect(apiDocsContent).toContain('class="');
      expect(apiDocsContent).toMatch(/bg-\w+/);
      expect(apiDocsContent).toMatch(/text-\w+/);
    });
  });
});
