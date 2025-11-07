/**
 * T226: Event Page Structured Data Tests
 *
 * Tests for Event schema implementation on event detail pages.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const eventPagePath = join(process.cwd(), 'src', 'pages', 'events', '[id].astro');
const baseLayoutPath = join(process.cwd(), 'src', 'layouts', 'BaseLayout.astro');

describe('T226: Event Page Structured Data', () => {
  describe('Event Page File', () => {
    it('should exist at src/pages/events/[id].astro', () => {
      expect(existsSync(eventPagePath)).toBe(true);
    });

    it('should be a valid Astro component', () => {
      const content = readFileSync(eventPagePath, 'utf-8');
      expect(content).toContain('---');
    });

    it('should have T226 task reference in comments', () => {
      const content = readFileSync(eventPagePath, 'utf-8');
      expect(content).toContain('T226');
    });
  });

  describe('Imports', () => {
    let content: string;

    beforeEach(() => {
      content = readFileSync(eventPagePath, 'utf-8');
    });

    it('should import StructuredData component', () => {
      expect(content).toContain("import StructuredData from '@/components/StructuredData.astro'");
    });

    it('should import generateEventSchema function', () => {
      expect(content).toContain("import { generateEventSchema } from '@/lib/structuredData'");
    });
  });

  describe('Schema Generation', () => {
    let content: string;

    beforeEach(() => {
      content = readFileSync(eventPagePath, 'utf-8');
    });

    it('should generate eventSchema variable', () => {
      expect(content).toContain('eventSchema');
      expect(content).toContain('generateEventSchema');
    });

    it('should pass event name to schema', () => {
      expect(content).toMatch(/name:\s*event\.title/);
    });

    it('should pass event description to schema', () => {
      expect(content).toMatch(/description:\s*event\.description/);
    });

    it('should pass event URL to schema', () => {
      expect(content).toMatch(/url:\s*eventUrl/);
      expect(content).toContain('eventUrl');
    });

    it('should pass event image to schema', () => {
      expect(content).toMatch(/image:\s*eventImageUrl/);
      expect(content).toContain('eventImageUrl');
    });

    it('should include start date in ISO 8601 format', () => {
      expect(content).toMatch(/startDate:\s*formatDateTime\(event\.event_date\)/);
    });

    it('should include end date in ISO 8601 format', () => {
      expect(content).toMatch(/endDate:\s*formatDateTime\(endTime\)/);
    });

    it('should include location with Place type', () => {
      expect(content).toContain('location:');
      expect(content).toContain("'@type': 'Place'");
    });

    it('should include venue address in location', () => {
      expect(content).toContain("'@type': 'PostalAddress'");
      expect(content).toMatch(/streetAddress:\s*event\.venue_address/);
      expect(content).toMatch(/addressLocality:\s*event\.venue_city/);
      expect(content).toMatch(/addressCountry:\s*event\.venue_country/);
    });

    it('should include geo coordinates when available', () => {
      expect(content).toContain('hasCoordinates');
      expect(content).toContain("'@type': 'GeoCoordinates'");
      expect(content).toMatch(/latitude:\s*mapCenter/);
      expect(content).toMatch(/longitude:\s*mapCenter/);
    });

    it('should include organizer information', () => {
      expect(content).toContain('organizer:');
      expect(content).toContain("'@type': 'Organization'");
      expect(content).toContain("name: 'Spirituality Platform'");
    });

    it('should include pricing information', () => {
      expect(content).toContain('offers:');
      expect(content).toContain("'@type': 'Offer'");
      expect(content).toMatch(/price:\s*typeof\s+event\.price/);
      expect(content).toContain("priceCurrency: 'USD'");
    });

    it('should include availability based on sold out status', () => {
      expect(content).toContain('availability:');
      expect(content).toContain('isSoldOut');
      expect(content).toContain('SoldOut');
      expect(content).toContain('InStock');
    });

    it('should include event status', () => {
      expect(content).toContain('eventStatus:');
      expect(content).toContain('eventStatus');
    });

    it('should include event attendance mode', () => {
      expect(content).toContain('eventAttendanceMode:');
      expect(content).toContain('eventAttendanceMode');
    });

    it('should handle absolute and relative image URLs', () => {
      expect(content).toMatch(/event\.image_url\?\.startsWith\('http'\)/);
      expect(content).toContain('siteUrl');
    });
  });

  describe('URL Construction', () => {
    let content: string;

    beforeEach(() => {
      content = readFileSync(eventPagePath, 'utf-8');
    });

    it('should construct site URL from Astro.site or Astro.url', () => {
      expect(content).toContain('Astro.site?.origin');
      expect(content).toContain('Astro.url.origin');
    });

    it('should construct event URL with slug', () => {
      expect(content).toContain('eventUrl');
      expect(content).toMatch(/\/events\/\$\{.*event\.slug.*\}/);
    });

    it('should convert relative image URLs to absolute', () => {
      expect(content).toContain('eventImageUrl');
      expect(content).toMatch(/event\.image_url\?\.startsWith\('http'\)/);
    });

    it('should provide fallback image URL', () => {
      expect(content).toMatch(/\/images\/event-placeholder\.jpg/);
    });
  });

  describe('Component Rendering', () => {
    let content: string;

    beforeEach(() => {
      content = readFileSync(eventPagePath, 'utf-8');
    });

    it('should render StructuredData component', () => {
      expect(content).toContain('<StructuredData');
    });

    it('should pass eventSchema to StructuredData component', () => {
      expect(content).toMatch(/<StructuredData.*schema=\{eventSchema\}/);
    });

    it('should use head slot for StructuredData', () => {
      expect(content).toMatch(/<StructuredData.*slot="head"/);
    });

    it('should have comment explaining T226 implementation', () => {
      expect(content).toContain('T226');
      expect(content).toMatch(/Event Structured Data/i);
    });

    it('should not have old inline JSON-LD script tag', () => {
      const scriptMatches = content.match(/<script type="application\/ld\+json"/g);
      expect(scriptMatches).toBeNull();
    });
  });

  describe('BaseLayout Integration', () => {
    let layoutContent: string;

    beforeEach(() => {
      layoutContent = readFileSync(baseLayoutPath, 'utf-8');
    });

    it('should have head slot in BaseLayout', () => {
      expect(layoutContent).toContain('<slot name="head"');
    });

    it('should position head slot before closing head tag', () => {
      const headSlotIndex = layoutContent.indexOf('<slot name="head"');
      const closingHeadIndex = layoutContent.indexOf('</head>');
      expect(headSlotIndex).toBeGreaterThan(-1);
      expect(closingHeadIndex).toBeGreaterThan(headSlotIndex);
    });
  });

  describe('Event Data Mapping', () => {
    let content: string;

    beforeEach(() => {
      content = readFileSync(eventPagePath, 'utf-8');
    });

    it('should use event.title for schema name', () => {
      expect(content).toMatch(/name:\s*event\.title/);
    });

    it('should use event.description for schema description', () => {
      expect(content).toMatch(/description:\s*event\.description/);
    });

    it('should use event.price for offers', () => {
      expect(content).toMatch(/price:\s*typeof\s+event\.price/);
    });

    it('should handle price as string or number', () => {
      expect(content).toMatch(/typeof\s+event\.price\s*===\s*'string'/);
      expect(content).toMatch(/parseFloat\(event\.price\)/);
    });

    it('should use event.slug for URL construction', () => {
      expect(content).toMatch(/event\.slug/);
    });

    it('should use venue information for location', () => {
      expect(content).toMatch(/event\.venue_name/);
      expect(content).toMatch(/event\.venue_address/);
      expect(content).toMatch(/event\.venue_city/);
      expect(content).toMatch(/event\.venue_country/);
    });
  });

  describe('ISO 8601 Date Format', () => {
    let content: string;

    beforeEach(() => {
      content = readFileSync(eventPagePath, 'utf-8');
    });

    it('should use formatDateTime function for dates', () => {
      expect(content).toContain('formatDateTime');
    });

    it('should format start date with formatDateTime', () => {
      expect(content).toMatch(/startDate:\s*formatDateTime\(event\.event_date\)/);
    });

    it('should format end date with formatDateTime', () => {
      expect(content).toMatch(/endDate:\s*formatDateTime\(endTime\)/);
    });

    it('should have formatDateTime function that returns ISO string', () => {
      expect(content).toMatch(/const\s+formatDateTime\s*=[\s\S]*?toISOString/);
    });
  });

  describe('Schema Properties', () => {
    let content: string;

    beforeEach(() => {
      content = readFileSync(eventPagePath, 'utf-8');
    });

    it('should include all required Event schema properties', () => {
      expect(content).toContain('name:');
      expect(content).toContain('description:');
      expect(content).toContain('startDate:');
      expect(content).toContain('location:');
    });

    it('should include recommended properties', () => {
      expect(content).toContain('endDate:');
      expect(content).toContain('url:');
      expect(content).toContain('image:');
      expect(content).toContain('organizer:');
      expect(content).toContain('offers:');
      expect(content).toContain('eventStatus:');
      expect(content).toContain('eventAttendanceMode:');
    });

    it('should use correct @type for nested objects', () => {
      expect(content).toContain("'@type': 'Place'");
      expect(content).toContain("'@type': 'PostalAddress'");
      expect(content).toContain("'@type': 'Organization'");
      expect(content).toContain("'@type': 'Offer'");
      expect(content).toContain("'@type': 'GeoCoordinates'");
    });
  });

  describe('Event Status Handling', () => {
    let content: string;

    beforeEach(() => {
      content = readFileSync(eventPagePath, 'utf-8');
    });

    it('should determine event status based on sold out', () => {
      expect(content).toMatch(/const\s+eventStatus\s*=\s*isSoldOut/);
    });

    it('should use EventSoldOut when sold out', () => {
      expect(content).toContain('EventSoldOut');
    });

    it('should use EventScheduled when not sold out', () => {
      expect(content).toContain('EventScheduled');
    });
  });

  describe('Event Attendance Mode', () => {
    let content: string;

    beforeEach(() => {
      content = readFileSync(eventPagePath, 'utf-8');
    });

    it('should set attendance mode', () => {
      expect(content).toMatch(/const\s+eventAttendanceMode/);
    });

    it('should default to offline event attendance mode', () => {
      expect(content).toContain('OfflineEventAttendanceMode');
    });
  });

  describe('Error Handling', () => {
    let content: string;

    beforeEach(() => {
      content = readFileSync(eventPagePath, 'utf-8');
    });

    it('should handle missing event image gracefully', () => {
      expect(content).toMatch(/event\.image_url\?/);
    });

    it('should use conditional geo coordinates', () => {
      expect(content).toContain('...(hasCoordinates');
    });

    it('should provide fallback for image URL', () => {
      expect(content).toMatch(/event-placeholder\.jpg/);
    });
  });

  describe('Code Quality', () => {
    let content: string;

    beforeEach(() => {
      content = readFileSync(eventPagePath, 'utf-8');
    });

    it('should have descriptive variable names', () => {
      expect(content).toContain('eventSchema');
      expect(content).toContain('eventUrl');
      expect(content).toContain('eventImageUrl');
      expect(content).toContain('siteUrl');
      expect(content).toContain('eventStatus');
      expect(content).toContain('eventAttendanceMode');
    });

    it('should have inline comments explaining T226', () => {
      expect(content).toMatch(/\/\/.*T226/);
    });

    it('should use const for immutable values', () => {
      expect(content).toMatch(/const\s+eventSchema/);
      expect(content).toMatch(/const\s+eventUrl/);
      expect(content).toMatch(/const\s+siteUrl/);
    });

    it('should properly format nested objects', () => {
      expect(content).toContain('location: {');
      expect(content).toContain('organizer: {');
      expect(content).toContain('offers: {');
    });
  });

  describe('Performance', () => {
    let content: string;

    beforeEach(() => {
      content = readFileSync(eventPagePath, 'utf-8');
    });

    it('should generate schema only once per page load', () => {
      const schemaGenerationCount = (content.match(/generateEventSchema\(/g) || []).length;
      expect(schemaGenerationCount).toBe(1);
    });

    it('should reuse siteUrl variable', () => {
      const siteUrlUsages = (content.match(/siteUrl/g) || []).length;
      expect(siteUrlUsages).toBeGreaterThan(1);
    });
  });

  describe('Currency and Pricing', () => {
    let content: string;

    beforeEach(() => {
      content = readFileSync(eventPagePath, 'utf-8');
    });

    it('should use USD as currency', () => {
      expect(content).toContain("priceCurrency: 'USD'");
    });

    it('should handle price as string or number', () => {
      expect(content).toMatch(/typeof\s+event\.price/);
    });

    it('should parse string prices to float', () => {
      expect(content).toMatch(/parseFloat\(event\.price\)/);
    });

    it('should include price in offers', () => {
      expect(content).toMatch(/offers:[\s\S]*price:/);
    });
  });

  describe('Organization Information', () => {
    let content: string;

    beforeEach(() => {
      content = readFileSync(eventPagePath, 'utf-8');
    });

    it('should use consistent organization name', () => {
      expect(content).toContain("name: 'Spirituality Platform'");
    });

    it('should include organization URL', () => {
      expect(content).toMatch(/organizer:[\s\S]*url:\s*siteUrl/);
    });

    it('should set organization @type', () => {
      expect(content).toContain("'@type': 'Organization'");
    });
  });

  describe('Location Information', () => {
    let content: string;

    beforeEach(() => {
      content = readFileSync(eventPagePath, 'utf-8');
    });

    it('should include venue name', () => {
      expect(content).toMatch(/name:\s*event\.venue_name/);
    });

    it('should include complete address', () => {
      expect(content).toMatch(/streetAddress:\s*event\.venue_address/);
      expect(content).toMatch(/addressLocality:\s*event\.venue_city/);
      expect(content).toMatch(/addressCountry:\s*event\.venue_country/);
    });

    it('should conditionally include geo coordinates', () => {
      expect(content).toMatch(/\.\.\.\(hasCoordinates\s+&&/);
      expect(content).toContain('geo:');
    });
  });

  describe('Integration with Existing Code', () => {
    let content: string;

    beforeEach(() => {
      content = readFileSync(eventPagePath, 'utf-8');
    });

    it('should not interfere with existing event rendering', () => {
      expect(content).toContain('<div class="container mx-auto px-lg py-2xl">');
    });

    it('should not modify existing BaseLayout props', () => {
      expect(content).toContain('title={title}');
      expect(content).toContain('description={description}');
      expect(content).toContain('keywords={keywords}');
      expect(content).toContain('ogImage={ogImage}');
    });

    it('should maintain existing imports', () => {
      expect(content).toContain('import BaseLayout');
      expect(content).toContain('import { getEventById }');
      expect(content).toContain('import { getLocalizedEventBySlug }');
    });

    it('should preserve event data fetching logic', () => {
      expect(content).toContain('getLocalizedEventBySlug');
      expect(content).toContain('getEventById');
    });

    it('should preserve existing formatDateTime function', () => {
      expect(content).toMatch(/const\s+formatDateTime\s*=.*=>/);
    });

    it('should preserve booking functionality', () => {
      expect(content).toContain('book-now-btn');
    });
  });

  describe('Availability Status', () => {
    let content: string;

    beforeEach(() => {
      content = readFileSync(eventPagePath, 'utf-8');
    });

    it('should set availability to SoldOut when event is sold out', () => {
      expect(content).toMatch(/isSoldOut[\s\S]*SoldOut/);
    });

    it('should set availability to InStock when event has spots', () => {
      expect(content).toMatch(/InStock/);
    });

    it('should use schema.org URL format for availability', () => {
      expect(content).toContain('https://schema.org/SoldOut');
      expect(content).toContain('https://schema.org/InStock');
    });
  });

  describe('Valid From Date', () => {
    let content: string;

    beforeEach(() => {
      content = readFileSync(eventPagePath, 'utf-8');
    });

    it('should include validFrom in offers', () => {
      expect(content).toContain('validFrom:');
    });

    it('should use ISO string for validFrom', () => {
      expect(content).toMatch(/validFrom:\s*new Date\(\)\.toISOString\(\)/);
    });
  });
});
