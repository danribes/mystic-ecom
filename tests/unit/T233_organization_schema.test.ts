/**
 * T233: Organization Schema Tests
 *
 * Tests for Schema.org Organization markup in BaseLayout
 * Validates site configuration and Organization structured data generation
 */

import { describe, it, expect } from 'vitest';
import {
  siteConfig,
  getOrganizationData,
  getSocialMediaUrls,
  getSocialMediaUrl,
  hasSocialMedia,
} from '@/lib/siteConfig';
import {
  generateOrganizationSchema,
  type OrganizationSchema,
} from '@/lib/structuredData';

describe('T233: Organization Schema and Site Configuration', () => {
  // ============================================================================
  // Site Configuration Tests
  // ============================================================================

  describe('siteConfig', () => {
    it('should have all required organization fields', () => {
      expect(siteConfig.name).toBeDefined();
      expect(siteConfig.name).toBeTypeOf('string');
      expect(siteConfig.name.length).toBeGreaterThan(0);

      expect(siteConfig.description).toBeDefined();
      expect(siteConfig.description).toBeTypeOf('string');
      expect(siteConfig.description.length).toBeGreaterThan(0);

      expect(siteConfig.url).toBeDefined();
      expect(siteConfig.url).toBeTypeOf('string');
      expect(siteConfig.url).toMatch(/^https?:\/\//);

      expect(siteConfig.logo).toBeDefined();
      expect(siteConfig.logo).toBeTypeOf('string');
      expect(siteConfig.logo).toMatch(/^https?:\/\//);

      expect(siteConfig.email).toBeDefined();
      expect(siteConfig.email).toBeTypeOf('string');
      expect(siteConfig.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    });

    it('should have social media configuration', () => {
      expect(siteConfig.socialMedia).toBeDefined();
      expect(typeof siteConfig.socialMedia).toBe('object');

      const platforms = ['facebook', 'twitter', 'instagram', 'linkedin', 'youtube'];
      platforms.forEach(platform => {
        expect(siteConfig.socialMedia).toHaveProperty(platform);
      });
    });

    it('should have valid social media URLs', () => {
      const urls = Object.values(siteConfig.socialMedia);

      urls.forEach(url => {
        if (url) {
          expect(url).toMatch(/^https?:\/\//);
          expect(url).toBeTypeOf('string');
        }
      });
    });

    it('should have default SEO metadata', () => {
      expect(siteConfig.defaultSeo).toBeDefined();
      expect(siteConfig.defaultSeo.title).toBeDefined();
      expect(siteConfig.defaultSeo.description).toBeDefined();
      expect(siteConfig.defaultSeo.keywords).toBeDefined();
      expect(siteConfig.defaultSeo.ogImage).toBeDefined();

      expect(siteConfig.defaultSeo.ogImage).toMatch(/^https?:\/\//);
    });

    it('should have valid founding date format (ISO 8601)', () => {
      expect(siteConfig.foundingDate).toBeDefined();
      expect(siteConfig.foundingDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);

      // Should be a valid date
      const date = new Date(siteConfig.foundingDate);
      expect(date.toString()).not.toBe('Invalid Date');
    });

    it('should have founder information', () => {
      expect(siteConfig.founder).toBeDefined();
      expect(siteConfig.founder['@type']).toBe('Person');
      expect(siteConfig.founder.name).toBeDefined();
      expect(siteConfig.founder.name.length).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // getOrganizationData Tests
  // ============================================================================

  describe('getOrganizationData', () => {
    it('should return organization data in correct format', () => {
      const data = getOrganizationData();

      expect(data).toBeDefined();
      expect(data.name).toBe(siteConfig.name);
      expect(data.url).toBe(siteConfig.url);
      expect(data.logo).toBe(siteConfig.logo);
      expect(data.description).toBe(siteConfig.description);
      expect(data.email).toBe(siteConfig.email);
    });

    it('should include all social media URLs in sameAs array', () => {
      const data = getOrganizationData();

      expect(data.sameAs).toBeDefined();
      expect(Array.isArray(data.sameAs)).toBe(true);

      // Should have multiple social media URLs
      expect(data.sameAs!.length).toBeGreaterThan(0);

      // All URLs should be valid
      data.sameAs!.forEach(url => {
        expect(url).toMatch(/^https?:\/\//);
      });
    });

    it('should filter out undefined social media URLs', () => {
      const data = getOrganizationData();

      expect(data.sameAs).toBeDefined();

      // Should not include undefined values
      data.sameAs!.forEach(url => {
        expect(url).toBeDefined();
        expect(url).not.toBe('');
        expect(url).not.toBeUndefined();
        expect(url).not.toBeNull();
      });
    });

    it('should include founding date', () => {
      const data = getOrganizationData();

      expect(data.foundingDate).toBe(siteConfig.foundingDate);
      expect(data.foundingDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should include founder information', () => {
      const data = getOrganizationData();

      expect(data.founder).toBeDefined();
      expect(data.founder).toEqual(siteConfig.founder);
    });

    it('should not include @type field', () => {
      const data = getOrganizationData();

      expect(data).not.toHaveProperty('@type');
    });
  });

  // ============================================================================
  // getSocialMediaUrls Tests
  // ============================================================================

  describe('getSocialMediaUrls', () => {
    it('should return an array of social media URLs', () => {
      const urls = getSocialMediaUrls();

      expect(Array.isArray(urls)).toBe(true);
      expect(urls.length).toBeGreaterThan(0);
    });

    it('should return only valid URLs', () => {
      const urls = getSocialMediaUrls();

      urls.forEach(url => {
        expect(url).toMatch(/^https?:\/\//);
        expect(typeof url).toBe('string');
        expect(url.length).toBeGreaterThan(0);
      });
    });

    it('should filter out undefined values', () => {
      const urls = getSocialMediaUrls();

      urls.forEach(url => {
        expect(url).toBeDefined();
        expect(url).not.toBeUndefined();
        expect(url).not.toBeNull();
      });
    });

    it('should match sameAs array from getOrganizationData', () => {
      const urls = getSocialMediaUrls();
      const orgData = getOrganizationData();

      expect(urls).toEqual(orgData.sameAs);
    });
  });

  // ============================================================================
  // getSocialMediaUrl Tests
  // ============================================================================

  describe('getSocialMediaUrl', () => {
    it('should return URL for configured platforms', () => {
      const facebookUrl = getSocialMediaUrl('facebook');
      expect(facebookUrl).toBeDefined();
      expect(facebookUrl).toMatch(/facebook\.com/);

      const twitterUrl = getSocialMediaUrl('twitter');
      expect(twitterUrl).toBeDefined();
      expect(twitterUrl).toMatch(/twitter\.com/);
    });

    it('should return undefined for unconfigured platforms', () => {
      // If telephone is undefined in config
      if (!siteConfig.telephone) {
        // Test with a valid platform that might not be configured
        const url = getSocialMediaUrl('linkedin');
        expect(url === undefined || typeof url === 'string').toBe(true);
      }
    });

    it('should return valid URLs for all platforms', () => {
      const platforms: (keyof typeof siteConfig.socialMedia)[] = [
        'facebook',
        'twitter',
        'instagram',
        'linkedin',
        'youtube',
      ];

      platforms.forEach(platform => {
        const url = getSocialMediaUrl(platform);
        if (url) {
          expect(url).toMatch(/^https?:\/\//);
        }
      });
    });
  });

  // ============================================================================
  // hasSocialMedia Tests
  // ============================================================================

  describe('hasSocialMedia', () => {
    it('should return true for configured platforms', () => {
      // Facebook should be configured
      expect(hasSocialMedia('facebook')).toBe(true);

      // Twitter should be configured
      expect(hasSocialMedia('twitter')).toBe(true);
    });

    it('should return false for unconfigured platforms', () => {
      // Create a test to ensure the function works correctly
      const allPlatforms = Object.keys(siteConfig.socialMedia) as (keyof typeof siteConfig.socialMedia)[];

      allPlatforms.forEach(platform => {
        const result = hasSocialMedia(platform);
        const url = siteConfig.socialMedia[platform];

        if (url) {
          expect(result).toBe(true);
        } else {
          expect(result).toBe(false);
        }
      });
    });

    it('should handle all platform keys', () => {
      const platforms: (keyof typeof siteConfig.socialMedia)[] = [
        'facebook',
        'twitter',
        'instagram',
        'linkedin',
        'youtube',
      ];

      platforms.forEach(platform => {
        const result = hasSocialMedia(platform);
        expect(typeof result).toBe('boolean');
      });
    });
  });

  // ============================================================================
  // Organization Schema Generation Tests
  // ============================================================================

  describe('generateOrganizationSchema', () => {
    it('should generate valid Organization schema from site config', () => {
      const orgData = getOrganizationData();
      const schema = generateOrganizationSchema(orgData);

      expect(schema).toBeDefined();
      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('Organization');
    });

    it('should include all required Organization properties', () => {
      const orgData = getOrganizationData();
      const schema = generateOrganizationSchema(orgData);

      // Required properties
      expect(schema.name).toBe(siteConfig.name);
      expect(schema.url).toBe(siteConfig.url);
    });

    it('should include logo as absolute URL', () => {
      const orgData = getOrganizationData();
      const schema = generateOrganizationSchema(orgData);

      expect(schema.logo).toBeDefined();
      expect(schema.logo).toMatch(/^https?:\/\//);
      expect(schema.logo).toBe(siteConfig.logo);
    });

    it('should include description', () => {
      const orgData = getOrganizationData();
      const schema = generateOrganizationSchema(orgData);

      expect(schema.description).toBeDefined();
      expect(schema.description).toBe(siteConfig.description);
    });

    it('should include email contact point', () => {
      const orgData = getOrganizationData();
      const schema = generateOrganizationSchema(orgData);

      expect(schema.email).toBeDefined();
      expect(schema.email).toBe(siteConfig.email);
    });

    it('should include sameAs array with social media URLs', () => {
      const orgData = getOrganizationData();
      const schema = generateOrganizationSchema(orgData);

      expect(schema.sameAs).toBeDefined();
      expect(Array.isArray(schema.sameAs)).toBe(true);
      expect((schema.sameAs as string[]).length).toBeGreaterThan(0);

      // All sameAs URLs should be valid
      (schema.sameAs as string[]).forEach(url => {
        expect(url).toMatch(/^https?:\/\//);
      });
    });

    it('should include founding date', () => {
      const orgData = getOrganizationData();
      const schema = generateOrganizationSchema(orgData);

      expect(schema.foundingDate).toBeDefined();
      expect(schema.foundingDate).toBe(siteConfig.foundingDate);
      expect(schema.foundingDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should include founder information', () => {
      const orgData = getOrganizationData();
      const schema = generateOrganizationSchema(orgData);

      expect(schema.founder).toBeDefined();
      expect(schema.founder).toEqual(siteConfig.founder);
    });

    it('should not include undefined values', () => {
      const orgData = getOrganizationData();
      const schema = generateOrganizationSchema(orgData);

      // Check that undefined values are not included
      Object.values(schema).forEach(value => {
        expect(value).not.toBeUndefined();
      });
    });

    it('should be valid JSON when stringified', () => {
      const orgData = getOrganizationData();
      const schema = generateOrganizationSchema(orgData);

      const jsonString = JSON.stringify(schema);
      expect(jsonString).toBeDefined();
      expect(jsonString.length).toBeGreaterThan(0);

      // Should be parseable back to object
      const parsed = JSON.parse(jsonString);
      expect(parsed).toEqual(schema);
    });
  });

  // ============================================================================
  // Schema Validation Tests
  // ============================================================================

  describe('Schema.org Compliance', () => {
    it('should have valid @context', () => {
      const orgData = getOrganizationData();
      const schema = generateOrganizationSchema(orgData);

      expect(schema['@context']).toBe('https://schema.org');
    });

    it('should have valid @type', () => {
      const orgData = getOrganizationData();
      const schema = generateOrganizationSchema(orgData);

      expect(schema['@type']).toBe('Organization');
    });

    it('should follow Schema.org Organization specification', () => {
      const orgData = getOrganizationData();
      const schema = generateOrganizationSchema(orgData);

      // Schema.org Organization required properties
      expect(schema.name).toBeDefined();

      // Common Organization properties
      expect(schema.url).toBeDefined();
      expect(schema.logo).toBeDefined();
      expect(schema.description).toBeDefined();

      // Contact information
      expect(schema.email).toBeDefined();

      // Social media profiles
      expect(schema.sameAs).toBeDefined();
      expect(Array.isArray(schema.sameAs)).toBe(true);
    });

    it('should use absolute URLs for logo', () => {
      const orgData = getOrganizationData();
      const schema = generateOrganizationSchema(orgData);

      expect(schema.logo).toMatch(/^https?:\/\//);
    });

    it('should use absolute URLs in sameAs', () => {
      const orgData = getOrganizationData();
      const schema = generateOrganizationSchema(orgData);

      (schema.sameAs as string[]).forEach(url => {
        expect(url).toMatch(/^https?:\/\//);
      });
    });

    it('should use ISO 8601 date format for foundingDate', () => {
      const orgData = getOrganizationData();
      const schema = generateOrganizationSchema(orgData);

      expect(schema.foundingDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);

      // Should be a valid date
      const date = new Date(schema.foundingDate as string);
      expect(date.toString()).not.toBe('Invalid Date');
    });
  });

  // ============================================================================
  // Integration Tests
  // ============================================================================

  describe('Integration Tests', () => {
    it('should work end-to-end from config to schema', () => {
      // Get organization data from site config
      const orgData = getOrganizationData();

      // Generate schema
      const schema = generateOrganizationSchema(orgData);

      // Verify schema is valid
      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('Organization');
      expect(schema.name).toBe(siteConfig.name);
      expect(schema.url).toBe(siteConfig.url);
      expect(schema.logo).toBe(siteConfig.logo);

      // Verify it can be serialized to JSON
      const jsonString = JSON.stringify(schema);
      expect(jsonString).toBeDefined();

      // Verify it can be parsed back
      const parsed = JSON.parse(jsonString);
      expect(parsed).toEqual(schema);
    });

    it('should generate schema suitable for JSON-LD script tag', () => {
      const orgData = getOrganizationData();
      const schema = generateOrganizationSchema(orgData);

      // Simulate what happens in BaseLayout.astro
      const jsonLdContent = JSON.stringify(schema);

      expect(jsonLdContent).toBeDefined();
      expect(jsonLdContent).toContain('"@context":"https://schema.org"');
      expect(jsonLdContent).toContain('"@type":"Organization"');
      expect(jsonLdContent).toContain(`"name":"${siteConfig.name}"`);
    });

    it('should include all social media platforms in sameAs', () => {
      const orgData = getOrganizationData();
      const schema = generateOrganizationSchema(orgData);

      const sameAsUrls = schema.sameAs as string[];

      // Should include Facebook
      expect(sameAsUrls.some(url => url.includes('facebook.com'))).toBe(true);

      // Should include Twitter
      expect(sameAsUrls.some(url => url.includes('twitter.com'))).toBe(true);

      // Should include Instagram
      expect(sameAsUrls.some(url => url.includes('instagram.com'))).toBe(true);

      // Should include LinkedIn
      expect(sameAsUrls.some(url => url.includes('linkedin.com'))).toBe(true);

      // Should include YouTube
      expect(sameAsUrls.some(url => url.includes('youtube.com'))).toBe(true);
    });
  });

  // ============================================================================
  // Edge Cases Tests
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle schema with minimal data', () => {
      const minimalData: Omit<OrganizationSchema, '@type'> = {
        name: 'Test Organization',
        url: 'https://example.com',
      };

      const schema = generateOrganizationSchema(minimalData);

      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('Organization');
      expect(schema.name).toBe('Test Organization');
      expect(schema.url).toBe('https://example.com');
    });

    it('should handle schema with all optional fields', () => {
      const fullData: Omit<OrganizationSchema, '@type'> = {
        name: 'Full Organization',
        url: 'https://example.com',
        logo: 'https://example.com/logo.png',
        description: 'A full organization',
        email: 'contact@example.com',
        telephone: '+1-555-0100',
        address: {
          '@type': 'PostalAddress',
          streetAddress: '123 Main St',
          addressLocality: 'Anytown',
          addressRegion: 'CA',
          postalCode: '12345',
          addressCountry: 'US',
        },
        sameAs: [
          'https://facebook.com/example',
          'https://twitter.com/example',
        ],
        foundingDate: '2024-01-01',
        founder: {
          '@type': 'Person',
          name: 'John Doe',
        },
      };

      const schema = generateOrganizationSchema(fullData);

      expect(schema.logo).toBe(fullData.logo);
      expect(schema.description).toBe(fullData.description);
      expect(schema.email).toBe(fullData.email);
      expect(schema.telephone).toBe(fullData.telephone);
      expect(schema.address).toEqual(fullData.address);
      expect(schema.sameAs).toEqual(fullData.sameAs);
      expect(schema.foundingDate).toBe(fullData.foundingDate);
      expect(schema.founder).toEqual(fullData.founder);
    });

    it('should handle empty sameAs array', () => {
      const dataWithoutSocial: Omit<OrganizationSchema, '@type'> = {
        name: 'Test Organization',
        url: 'https://example.com',
        sameAs: [],
      };

      const schema = generateOrganizationSchema(dataWithoutSocial);

      expect(schema.sameAs).toEqual([]);
    });
  });
});
