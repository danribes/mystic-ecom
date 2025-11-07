/**
 * T224: JSON-LD Structured Data Tests
 *
 * Tests for Schema.org structured data implementation using JSON-LD format.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import {
  generateOrganizationSchema,
  generateWebSiteSchema,
  generateBreadcrumbListSchema,
  generateCourseSchema,
  generateEventSchema,
  generateProductSchema,
  generateReviewSchema,
  generateFAQPageSchema,
  validateSchema,
  combineSchemas,
} from '@/lib/structuredData';

const structuredDataLibPath = join(process.cwd(), 'src', 'lib', 'structuredData.ts');
const structuredDataComponentPath = join(process.cwd(), 'src', 'components', 'StructuredData.astro');
const seoComponentPath = join(process.cwd(), 'src', 'components', 'SEO.astro');

describe('T224: JSON-LD Structured Data', () => {
  describe('Library File', () => {
    it('should exist at src/lib/structuredData.ts', () => {
      expect(existsSync(structuredDataLibPath)).toBe(true);
    });

    it('should export all required generator functions', () => {
      expect(generateOrganizationSchema).toBeDefined();
      expect(generateWebSiteSchema).toBeDefined();
      expect(generateBreadcrumbListSchema).toBeDefined();
      expect(generateCourseSchema).toBeDefined();
      expect(generateEventSchema).toBeDefined();
      expect(generateProductSchema).toBeDefined();
      expect(generateReviewSchema).toBeDefined();
      expect(generateFAQPageSchema).toBeDefined();
    });

    it('should export utility functions', () => {
      expect(validateSchema).toBeDefined();
      expect(combineSchemas).toBeDefined();
    });

    it('should have comprehensive JSDoc documentation', () => {
      const content = readFileSync(structuredDataLibPath, 'utf-8');
      expect(content).toContain('/**');
      expect(content).toContain('@see https://schema.org/');
      expect(content).toContain('@example');
    });
  });

  describe('Component File', () => {
    it('should exist at src/components/StructuredData.astro', () => {
      expect(existsSync(structuredDataComponentPath)).toBe(true);
    });

    it('should be a valid Astro component', () => {
      const content = readFileSync(structuredDataComponentPath, 'utf-8');
      expect(content).toContain('---');
      expect(content).toContain('interface Props');
    });

    it('should have comprehensive JSDoc documentation', () => {
      const content = readFileSync(structuredDataComponentPath, 'utf-8');
      expect(content).toContain('/**');
      expect(content).toContain('Usage:');
      expect(content).toContain('@see https://schema.org/');
    });

    it('should accept schema or schemas prop', () => {
      const content = readFileSync(structuredDataComponentPath, 'utf-8');
      expect(content).toContain('schema?:');
      expect(content).toContain('schemas?:');
    });

    it('should render JSON-LD script tags', () => {
      const content = readFileSync(structuredDataComponentPath, 'utf-8');
      expect(content).toContain('type="application/ld+json"');
      expect(content).toContain('JSON.stringify');
    });
  });

  describe('Organization Schema', () => {
    it('should generate valid Organization schema', () => {
      const schema = generateOrganizationSchema({
        name: 'Spirituality Platform',
        url: 'https://example.com',
      });

      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('Organization');
      expect(schema.name).toBe('Spirituality Platform');
      expect(schema.url).toBe('https://example.com');
    });

    it('should include optional properties when provided', () => {
      const schema = generateOrganizationSchema({
        name: 'Spirituality Platform',
        url: 'https://example.com',
        logo: 'https://example.com/logo.png',
        description: 'A spiritual platform',
        email: 'contact@example.com',
        telephone: '+1-555-1234',
        sameAs: ['https://facebook.com/spirituality'],
      });

      expect(schema.logo).toBe('https://example.com/logo.png');
      expect(schema.description).toBe('A spiritual platform');
      expect(schema.email).toBe('contact@example.com');
      expect(schema.telephone).toBe('+1-555-1234');
      expect(schema.sameAs).toEqual(['https://facebook.com/spirituality']);
    });

    it('should include address when provided', () => {
      const schema = generateOrganizationSchema({
        name: 'Spirituality Platform',
        url: 'https://example.com',
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Boulder',
          addressRegion: 'CO',
          addressCountry: 'US',
        },
      });

      expect(schema.address).toBeDefined();
      expect(schema.address).toHaveProperty('addressLocality', 'Boulder');
    });

    it('should include founder when provided', () => {
      const schema = generateOrganizationSchema({
        name: 'Spirituality Platform',
        url: 'https://example.com',
        founder: {
          '@type': 'Person',
          name: 'Jane Smith',
        },
      });

      expect(schema.founder).toBeDefined();
      expect(schema.founder).toHaveProperty('name', 'Jane Smith');
    });
  });

  describe('WebSite Schema', () => {
    it('should generate valid WebSite schema', () => {
      const schema = generateWebSiteSchema({
        name: 'Spirituality Platform',
        url: 'https://example.com',
      });

      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('WebSite');
      expect(schema.name).toBe('Spirituality Platform');
      expect(schema.url).toBe('https://example.com');
    });

    it('should include search action when provided', () => {
      const schema = generateWebSiteSchema({
        name: 'Spirituality Platform',
        url: 'https://example.com',
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: 'https://example.com/search?q={search_term_string}',
          },
          'query-input': 'required name=search_term_string',
        },
      });

      expect(schema.potentialAction).toBeDefined();
      expect(schema.potentialAction).toHaveProperty('@type', 'SearchAction');
    });

    it('should include language when provided', () => {
      const schema = generateWebSiteSchema({
        name: 'Spirituality Platform',
        url: 'https://example.com',
        inLanguage: 'en',
      });

      expect(schema.inLanguage).toBe('en');
    });
  });

  describe('BreadcrumbList Schema', () => {
    it('should generate valid BreadcrumbList schema', () => {
      const schema = generateBreadcrumbListSchema([
        { name: 'Home', url: 'https://example.com' },
        { name: 'Courses', url: 'https://example.com/courses' },
        { name: 'Meditation', url: 'https://example.com/courses/meditation' },
      ]);

      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('BreadcrumbList');
      expect(schema.itemListElement).toHaveLength(3);
    });

    it('should generate correct positions', () => {
      const schema = generateBreadcrumbListSchema([
        { name: 'Home', url: 'https://example.com' },
        { name: 'Courses', url: 'https://example.com/courses' },
      ]);

      const items = schema.itemListElement as any[];
      expect(items[0].position).toBe(1);
      expect(items[1].position).toBe(2);
    });

    it('should handle items without URLs', () => {
      const schema = generateBreadcrumbListSchema([
        { name: 'Home', url: 'https://example.com' },
        { name: 'Current Page' }, // No URL
      ]);

      const items = schema.itemListElement as any[];
      expect(items[0]).toHaveProperty('item');
      expect(items[1]).not.toHaveProperty('item');
    });
  });

  describe('Course Schema', () => {
    it('should generate valid Course schema', () => {
      const schema = generateCourseSchema({
        name: 'Meditation Fundamentals',
        description: 'Learn meditation from scratch',
        provider: {
          '@type': 'Organization',
          name: 'Spirituality Platform',
        },
      });

      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('Course');
      expect(schema.name).toBe('Meditation Fundamentals');
      expect(schema.provider).toHaveProperty('name', 'Spirituality Platform');
    });

    it('should include instructor when provided', () => {
      const schema = generateCourseSchema({
        name: 'Meditation Fundamentals',
        description: 'Learn meditation',
        provider: {
          '@type': 'Organization',
          name: 'Spirituality Platform',
        },
        instructor: {
          '@type': 'Person',
          name: 'Jane Smith',
        },
      });

      expect(schema.instructor).toBeDefined();
      expect(schema.instructor).toHaveProperty('name', 'Jane Smith');
    });

    it('should include offers when provided', () => {
      const schema = generateCourseSchema({
        name: 'Meditation Fundamentals',
        description: 'Learn meditation',
        provider: {
          '@type': 'Organization',
          name: 'Spirituality Platform',
        },
        offers: {
          '@type': 'Offer',
          price: 99,
          priceCurrency: 'USD',
        },
      });

      expect(schema.offers).toBeDefined();
      expect(schema.offers).toHaveProperty('price', 99);
      expect(schema.offers).toHaveProperty('priceCurrency', 'USD');
    });

    it('should include aggregate rating when provided', () => {
      const schema = generateCourseSchema({
        name: 'Meditation Fundamentals',
        description: 'Learn meditation',
        provider: {
          '@type': 'Organization',
          name: 'Spirituality Platform',
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: 4.5,
          reviewCount: 100,
        },
      });

      expect(schema.aggregateRating).toBeDefined();
      expect(schema.aggregateRating).toHaveProperty('ratingValue', 4.5);
      expect(schema.aggregateRating).toHaveProperty('reviewCount', 100);
    });
  });

  describe('Event Schema', () => {
    it('should generate valid Event schema', () => {
      const schema = generateEventSchema({
        name: 'Meditation Retreat',
        description: '3-day meditation retreat',
        startDate: '2025-12-01T09:00:00Z',
        location: {
          '@type': 'Place',
          name: 'Mountain Retreat Center',
        },
      });

      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('Event');
      expect(schema.name).toBe('Meditation Retreat');
      expect(schema.startDate).toBe('2025-12-01T09:00:00Z');
    });

    it('should include endDate when provided', () => {
      const schema = generateEventSchema({
        name: 'Meditation Retreat',
        description: '3-day retreat',
        startDate: '2025-12-01T09:00:00Z',
        endDate: '2025-12-03T17:00:00Z',
        location: {
          '@type': 'Place',
          name: 'Retreat Center',
        },
      });

      expect(schema.endDate).toBe('2025-12-03T17:00:00Z');
    });

    it('should support virtual location', () => {
      const schema = generateEventSchema({
        name: 'Online Meditation',
        description: 'Virtual meditation session',
        startDate: '2025-12-01T09:00:00Z',
        location: {
          '@type': 'VirtualLocation',
          url: 'https://example.com/join',
        },
      });

      expect(schema.location).toHaveProperty('@type', 'VirtualLocation');
      expect(schema.location).toHaveProperty('url');
    });

    it('should include event status when provided', () => {
      const schema = generateEventSchema({
        name: 'Meditation Retreat',
        description: '3-day retreat',
        startDate: '2025-12-01T09:00:00Z',
        location: {
          '@type': 'Place',
          name: 'Retreat Center',
        },
        eventStatus: 'EventScheduled',
      });

      expect(schema.eventStatus).toBe('https://schema.org/EventScheduled');
    });

    it('should include event attendance mode when provided', () => {
      const schema = generateEventSchema({
        name: 'Meditation Retreat',
        description: '3-day retreat',
        startDate: '2025-12-01T09:00:00Z',
        location: {
          '@type': 'Place',
          name: 'Retreat Center',
        },
        eventAttendanceMode: 'OfflineEventAttendanceMode',
      });

      expect(schema.eventAttendanceMode).toBe('https://schema.org/OfflineEventAttendanceMode');
    });
  });

  describe('Product Schema', () => {
    it('should generate valid Product schema', () => {
      const schema = generateProductSchema({
        name: 'Meditation Cushion',
        description: 'Premium meditation cushion',
      });

      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('Product');
      expect(schema.name).toBe('Meditation Cushion');
    });

    it('should include brand when provided', () => {
      const schema = generateProductSchema({
        name: 'Meditation Cushion',
        description: 'Premium cushion',
        brand: {
          '@type': 'Brand',
          name: 'Zen Supply',
        },
      });

      expect(schema.brand).toBeDefined();
      expect(schema.brand).toHaveProperty('name', 'Zen Supply');
    });

    it('should include offers when provided', () => {
      const schema = generateProductSchema({
        name: 'Meditation Cushion',
        description: 'Premium cushion',
        offers: {
          '@type': 'Offer',
          price: 49.99,
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock',
        },
      });

      expect(schema.offers).toBeDefined();
      expect(schema.offers).toHaveProperty('price', 49.99);
    });

    it('should include SKU and MPN when provided', () => {
      const schema = generateProductSchema({
        name: 'Meditation Cushion',
        description: 'Premium cushion',
        sku: 'MC-001',
        mpn: 'MPN-123',
      });

      expect(schema.sku).toBe('MC-001');
      expect(schema.mpn).toBe('MPN-123');
    });
  });

  describe('Review Schema', () => {
    it('should generate valid Review schema', () => {
      const schema = generateReviewSchema({
        '@type': 'Review',
        author: {
          '@type': 'Person',
          name: 'Jane Smith',
        },
        reviewRating: {
          '@type': 'Rating',
          ratingValue: 5,
        },
      });

      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('Review');
      expect(schema.author).toHaveProperty('name', 'Jane Smith');
      expect(schema.reviewRating).toHaveProperty('ratingValue', 5);
    });

    it('should include review body when provided', () => {
      const schema = generateReviewSchema({
        '@type': 'Review',
        author: {
          '@type': 'Person',
          name: 'Jane Smith',
        },
        reviewBody: 'Excellent course!',
        reviewRating: {
          '@type': 'Rating',
          ratingValue: 5,
        },
      });

      expect(schema.reviewBody).toBe('Excellent course!');
    });

    it('should include date published when provided', () => {
      const schema = generateReviewSchema({
        '@type': 'Review',
        author: {
          '@type': 'Person',
          name: 'Jane Smith',
        },
        datePublished: '2025-11-06',
        reviewRating: {
          '@type': 'Rating',
          ratingValue: 5,
        },
      });

      expect(schema.datePublished).toBe('2025-11-06');
    });
  });

  describe('FAQ Schema', () => {
    it('should generate valid FAQPage schema', () => {
      const schema = generateFAQPageSchema([
        {
          question: 'What is meditation?',
          answer: 'Meditation is a practice of mindfulness.',
        },
        {
          question: 'How long should I meditate?',
          answer: 'Start with 5-10 minutes daily.',
        },
      ]);

      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('FAQPage');
      expect(schema.mainEntity).toHaveLength(2);
    });

    it('should structure questions correctly', () => {
      const schema = generateFAQPageSchema([
        {
          question: 'What is meditation?',
          answer: 'Meditation is a practice.',
        },
      ]);

      const question = (schema.mainEntity as any[])[0];
      expect(question['@type']).toBe('Question');
      expect(question.name).toBe('What is meditation?');
      expect(question.acceptedAnswer['@type']).toBe('Answer');
      expect(question.acceptedAnswer.text).toBe('Meditation is a practice.');
    });
  });

  describe('Schema Validation', () => {
    it('should add @context if missing', () => {
      const schema = validateSchema({
        '@type': 'Organization',
        name: 'Test',
      });

      expect(schema['@context']).toBe('https://schema.org');
    });

    it('should throw error if @type is missing', () => {
      expect(() => {
        validateSchema({
          name: 'Test',
        });
      }).toThrow('Schema must have @type property');
    });

    it('should remove undefined values', () => {
      const schema = validateSchema({
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Test',
        description: undefined,
      });

      expect(schema).not.toHaveProperty('description');
    });
  });

  describe('Schema Combination', () => {
    it('should combine multiple schemas', () => {
      const schemas = combineSchemas([
        {
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'Test Org',
        },
        {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'Test Site',
        },
      ]);

      expect(schemas).toHaveLength(2);
      expect(schemas[0]['@type']).toBe('Organization');
      expect(schemas[1]['@type']).toBe('WebSite');
    });
  });

  describe('SEO Component Integration', () => {
    let seoContent: string;

    beforeEach(() => {
      seoContent = readFileSync(seoComponentPath, 'utf-8');
    });

    it('should import StructuredData component', () => {
      expect(seoContent).toContain("import StructuredData from '@/components/StructuredData.astro'");
    });

    it('should import generateWebSiteSchema function', () => {
      expect(seoContent).toContain("import { generateWebSiteSchema } from '@/lib/structuredData'");
    });

    it('should use StructuredData component for WebSite schema', () => {
      expect(seoContent).toContain('<StructuredData');
      expect(seoContent).toContain('generateWebSiteSchema');
    });

    it('should pass WebSite schema properties', () => {
      expect(seoContent).toMatch(/name:\s*siteName/);
      expect(seoContent).toMatch(/url:\s*siteUrl/);
      expect(seoContent).toMatch(/description:\s*displayDescription/);
    });

    it('should include search action in WebSite schema', () => {
      expect(seoContent).toContain('potentialAction');
      expect(seoContent).toContain('SearchAction');
    });

    it('should use StructuredData for Article schema when ogType is article', () => {
      expect(seoContent).toContain("ogType === 'article'");
      expect(seoContent).toContain('<StructuredData');
      expect(seoContent).toContain("'@type': 'Article'");
    });
  });

  describe('TypeScript Types', () => {
    it('should have TypeScript interfaces exported', () => {
      const content = readFileSync(structuredDataLibPath, 'utf-8');
      expect(content).toContain('export interface OrganizationSchema');
      expect(content).toContain('export interface WebSiteSchema');
      expect(content).toContain('export interface BreadcrumbListSchema');
      expect(content).toContain('export interface CourseSchema');
      expect(content).toContain('export interface EventSchema');
      expect(content).toContain('export interface ProductSchema');
      expect(content).toContain('export interface ReviewSchema');
      expect(content).toContain('export interface FAQPageSchema');
    });

    it('should have proper type annotations', () => {
      const content = readFileSync(structuredDataLibPath, 'utf-8');
      expect(content).toMatch(/:\s*Record<string,\s*unknown>/);
    });
  });

  describe('Documentation', () => {
    it('should have usage examples for each function', () => {
      const content = readFileSync(structuredDataLibPath, 'utf-8');
      expect(content).toContain('generateOrganizationSchema');
      expect(content).toContain('@example');
      expect(content.match(/@example/g)?.length).toBeGreaterThan(5);
    });

    it('should reference Schema.org documentation', () => {
      const content = readFileSync(structuredDataLibPath, 'utf-8');
      expect(content).toContain('https://schema.org/');
    });

    it('should have comprehensive JSDoc comments', () => {
      const content = readFileSync(structuredDataLibPath, 'utf-8');
      const jsdocCount = (content.match(/\/\*\*/g) || []).length;
      expect(jsdocCount).toBeGreaterThan(10);
    });
  });

  describe('Component Props', () => {
    it('should have schema prop in StructuredData component', () => {
      const content = readFileSync(structuredDataComponentPath, 'utf-8');
      expect(content).toContain('schema?:');
    });

    it('should have schemas prop for multiple schemas', () => {
      const content = readFileSync(structuredDataComponentPath, 'utf-8');
      expect(content).toContain('schemas?:');
    });

    it('should have prettyPrint prop', () => {
      const content = readFileSync(structuredDataComponentPath, 'utf-8');
      expect(content).toContain('prettyPrint');
    });
  });

  describe('Component Validation', () => {
    it('should validate schemas in development', () => {
      const content = readFileSync(structuredDataComponentPath, 'utf-8');
      expect(content).toContain('import.meta.env.DEV');
      expect(content).toContain('console.warn');
    });

    it('should check for missing @type', () => {
      const content = readFileSync(structuredDataComponentPath, 'utf-8');
      expect(content).toContain("!s['@type']");
    });

    it('should check for relative URLs', () => {
      const content = readFileSync(structuredDataComponentPath, 'utf-8');
      expect(content).toContain("startsWith('/')");
      expect(content).toContain('should be absolute URL');
    });

    it('should check for ISO 8601 date format', () => {
      const content = readFileSync(structuredDataComponentPath, 'utf-8');
      expect(content).toContain('ISO 8601');
    });
  });

  describe('Component Rendering', () => {
    it('should render application/ld+json script tags', () => {
      const content = readFileSync(structuredDataComponentPath, 'utf-8');
      expect(content).toContain('type="application/ld+json"');
    });

    it('should set data-schema-type attribute', () => {
      const content = readFileSync(structuredDataComponentPath, 'utf-8');
      expect(content).toContain('data-schema-type');
    });

    it('should pretty print in development', () => {
      const content = readFileSync(structuredDataComponentPath, 'utf-8');
      expect(content).toContain('prettyPrint ? JSON.stringify(schemaData, null, 2)');
    });
  });
});
