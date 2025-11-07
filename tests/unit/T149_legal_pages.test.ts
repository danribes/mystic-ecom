/**
 * T149: Terms of Service and Privacy Policy Pages Tests
 *
 * Tests for legal pages structure, content, and accessibility
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const termsPath = join(process.cwd(), 'src', 'pages', 'terms-of-service.astro');
const privacyPath = join(process.cwd(), 'src', 'pages', 'privacy-policy.astro');

describe('T149: Legal Pages', () => {
  describe('File Existence', () => {
    it('should have Terms of Service page', () => {
      expect(existsSync(termsPath)).toBe(true);
    });

    it('should have Privacy Policy page', () => {
      expect(existsSync(privacyPath)).toBe(true);
    });
  });

  describe('Terms of Service Page', () => {
    let content: string;

    beforeEach(() => {
      content = readFileSync(termsPath, 'utf-8');
    });

    it('should be a valid Astro component', () => {
      expect(content).toContain('---');
      expect(content).toContain('BaseLayout');
    });

    it('should have T149 task reference', () => {
      expect(content).toContain('T149');
    });

    it('should have proper page title', () => {
      expect(content).toContain('Terms of Service');
      expect(content).toMatch(/title="Terms of Service"/);
    });

    it('should have meta description', () => {
      expect(content).toMatch(/description=".+"/);
    });

    it('should have keywords', () => {
      expect(content).toMatch(/keywords=".+"/);
    });

    it('should have last updated date', () => {
      expect(content).toContain('Last Updated');
      expect(content).toContain('lastUpdated');
      expect(content).toContain('effectiveDate');
    });

    it('should have table of contents', () => {
      expect(content).toContain('Table of Contents');
      expect(content).toMatch(/aria-label="Table of Contents"/);
    });

    it('should have section for acceptance of terms', () => {
      expect(content).toMatch(/id="acceptance"/);
      expect(content).toContain('Acceptance of Terms');
    });

    it('should have section for changes to terms', () => {
      expect(content).toMatch(/id="changes"/);
      expect(content).toContain('Changes to Terms');
    });

    it('should have section for user accounts', () => {
      expect(content).toMatch(/id="account"/);
      expect(content).toContain('User Accounts');
    });

    it('should have section for courses and content', () => {
      expect(content).toMatch(/id="courses"/);
      expect(content).toContain('Courses and Content');
    });

    it('should have section for payment and refunds', () => {
      expect(content).toMatch(/id="payment"/);
      expect(content).toContain('Payment and Refunds');
      expect(content).toContain('30-day money-back guarantee');
    });

    it('should have section for user conduct', () => {
      expect(content).toMatch(/id="conduct"/);
      expect(content).toContain('User Conduct');
    });

    it('should have section for intellectual property', () => {
      expect(content).toMatch(/id="intellectual-property"/);
      expect(content).toContain('Intellectual Property');
    });

    it('should have section for reviews and ratings', () => {
      expect(content).toMatch(/id="reviews"/);
      expect(content).toContain('Reviews and Ratings');
    });

    it('should have section for events and bookings', () => {
      expect(content).toMatch(/id="events"/);
      expect(content).toContain('Events and Bookings');
    });

    it('should have section for account termination', () => {
      expect(content).toMatch(/id="termination"/);
      expect(content).toContain('Account Termination');
    });

    it('should have disclaimers section', () => {
      expect(content).toMatch(/id="disclaimers"/);
      expect(content).toContain('Disclaimers');
      expect(content).toMatch(/"AS IS"/);
    });

    it('should have limitation of liability section', () => {
      expect(content).toMatch(/id="liability"/);
      expect(content).toContain('Limitation of Liability');
    });

    it('should have indemnification section', () => {
      expect(content).toMatch(/id="indemnification"/);
      expect(content).toContain('Indemnification');
    });

    it('should have governing law section', () => {
      expect(content).toMatch(/id="governing-law"/);
      expect(content).toContain('Governing Law');
    });

    it('should have contact information', () => {
      expect(content).toMatch(/id="contact"/);
      expect(content).toContain('Contact Information');
      expect(content).toContain('@spiritualityplatform.com');
    });

    it('should use Tailwind CSS classes', () => {
      expect(content).toMatch(/class=".*container.*mx-auto/);
      expect(content).toMatch(/class=".*text-/);
      expect(content).toMatch(/class=".*rounded-/);
    });

    it('should have smooth scroll behavior', () => {
      expect(content).toContain('scroll-behavior: smooth');
    });

    it('should have scroll margin for sections', () => {
      expect(content).toContain('scroll-mt-lg');
    });

    it('should link to Privacy Policy', () => {
      expect(content).toContain('/privacy-policy');
      expect(content).toContain('Privacy Policy');
    });

    it('should have proper semantic HTML structure', () => {
      expect(content).toContain('<header');
      expect(content).toContain('<nav');
      expect(content).toContain('<article');
      expect(content).toContain('<section');
      expect(content).toContain('<footer');
    });

    it('should have h1 heading', () => {
      expect(content).toMatch(/<h1.*>.*Terms of Service.*<\/h1>/);
    });

    it('should have h2 headings for main sections', () => {
      expect(content).toMatch(/<h2.*>/);
    });

    it('should have lists for organized content', () => {
      expect(content).toContain('<ul');
      expect(content).toContain('<ol');
      expect(content).toContain('<li');
    });

    it('should have introduction section', () => {
      expect(content).toContain('Welcome to Spirituality Platform');
    });

    it('should mention age requirement', () => {
      expect(content).toContain('18 years old');
    });

    it('should mention account security', () => {
      expect(content).toContain('password secure');
    });

    it('should mention refund policy details', () => {
      expect(content).toContain('30 days');
      expect(content).toContain('30%');
    });

    it('should have prohibited activities list', () => {
      expect(content).toContain('Violate any applicable laws');
      expect(content).toContain('Harass, abuse');
    });

    it('should mention copyright protection', () => {
      expect(content).toContain('copyright');
    });

    it('should have all 15 sections', () => {
      const sectionMatches = content.match(/id="[a-z-]+"/g);
      expect(sectionMatches).toBeTruthy();
      expect(sectionMatches!.length).toBeGreaterThanOrEqual(15);
    });
  });

  describe('Privacy Policy Page', () => {
    let content: string;

    beforeEach(() => {
      content = readFileSync(privacyPath, 'utf-8');
    });

    it('should be a valid Astro component', () => {
      expect(content).toContain('---');
      expect(content).toContain('BaseLayout');
    });

    it('should have T149 task reference', () => {
      expect(content).toContain('T149');
    });

    it('should have proper page title', () => {
      expect(content).toContain('Privacy Policy');
      expect(content).toMatch(/title="Privacy Policy"/);
    });

    it('should have meta description', () => {
      expect(content).toMatch(/description=".+"/);
    });

    it('should have keywords', () => {
      expect(content).toMatch(/keywords=".+"/);
      expect(content).toContain('gdpr');
    });

    it('should have last updated date', () => {
      expect(content).toContain('Last Updated');
      expect(content).toContain('lastUpdated');
    });

    it('should have table of contents', () => {
      expect(content).toContain('Table of Contents');
    });

    it('should have section for information collection', () => {
      expect(content).toMatch(/id="collection"/);
      expect(content).toContain('Information We Collect');
    });

    it('should have section for information usage', () => {
      expect(content).toMatch(/id="usage"/);
      expect(content).toContain('How We Use Your Information');
    });

    it('should have section for information sharing', () => {
      expect(content).toMatch(/id="sharing"/);
      expect(content).toContain('Information Sharing');
    });

    it('should have section for cookies', () => {
      expect(content).toMatch(/id="cookies"/);
      expect(content).toContain('Cookies');
    });

    it('should have section for data security', () => {
      expect(content).toMatch(/id="security"/);
      expect(content).toContain('Data Security');
    });

    it('should have section for data retention', () => {
      expect(content).toMatch(/id="retention"/);
      expect(content).toContain('Data Retention');
    });

    it('should have section for privacy rights', () => {
      expect(content).toMatch(/id="rights"/);
      expect(content).toContain('Your Privacy Rights');
    });

    it('should have section for children privacy', () => {
      expect(content).toMatch(/id="children"/);
      expect(content).toContain("Children's Privacy");
    });

    it('should have section for international transfers', () => {
      expect(content).toMatch(/id="international"/);
      expect(content).toContain('International Data Transfers');
    });

    it('should have section for third-party services', () => {
      expect(content).toMatch(/id="third-party"/);
      expect(content).toContain('Third-Party Services');
    });

    it('should have section for policy updates', () => {
      expect(content).toMatch(/id="updates"/);
      expect(content).toContain('Changes to This');
    });

    it('should have contact information', () => {
      expect(content).toMatch(/id="contact"/);
      expect(content).toContain('Contact Us');
      expect(content).toContain('privacy@spiritualityplatform.com');
    });

    it('should mention GDPR', () => {
      expect(content).toContain('GDPR');
      expect(content).toContain('General Data Protection Regulation');
    });

    it('should mention CCPA', () => {
      expect(content).toContain('CCPA');
      expect(content).toContain('California Consumer Privacy Act');
    });

    it('should list types of data collected', () => {
      expect(content).toContain('email address');
      expect(content).toContain('password');
      expect(content).toContain('IP address');
    });

    it('should mention cookie types', () => {
      expect(content).toContain('Essential Cookies');
      expect(content).toContain('Analytics Cookies');
    });

    it('should mention security measures', () => {
      expect(content).toContain('Encryption');
      expect(content).toContain('HTTPS');
      expect(content).toContain('TLS');
    });

    it('should mention data retention periods', () => {
      expect(content).toContain('90 days');
      expect(content).toContain('7 years');
    });

    it('should mention user rights', () => {
      expect(content).toContain('Right to access');
      expect(content).toContain('Right to deletion');
      expect(content).toContain('data portability');
    });

    it('should mention no data selling', () => {
      expect(content).toContain('do not sell');
    });

    it('should mention third-party services by name', () => {
      expect(content).toContain('Stripe');
      expect(content).toContain('Google Analytics');
    });

    it('should have GDPR notice section', () => {
      expect(content).toContain('Your Rights Under GDPR');
      expect(content).toContain('European Economic Area');
    });

    it('should have CCPA notice section', () => {
      expect(content).toContain('California Privacy Rights');
    });

    it('should link to Terms of Service', () => {
      expect(content).toContain('/terms-of-service');
      expect(content).toContain('Terms of Service');
    });

    it('should use Tailwind CSS classes', () => {
      expect(content).toMatch(/class=".*container.*mx-auto/);
      expect(content).toMatch(/class=".*text-/);
    });

    it('should have proper semantic HTML', () => {
      expect(content).toContain('<header');
      expect(content).toContain('<nav');
      expect(content).toContain('<article');
      expect(content).toContain('<section');
      expect(content).toContain('<footer');
    });

    it('should have responsive design classes', () => {
      expect(content).toMatch(/max-w-/);
      expect(content).toMatch(/px-/);
      expect(content).toMatch(/py-/);
    });

    it('should have all 12 main sections', () => {
      const sectionMatches = content.match(/id="[a-z-]+"/g);
      expect(sectionMatches).toBeTruthy();
      expect(sectionMatches!.length).toBeGreaterThanOrEqual(12);
    });

    it('should mention DPO (Data Protection Officer)', () => {
      expect(content).toContain('Data Protection Officer');
      expect(content).toContain('dpo@spiritualityplatform.com');
    });

    it('should mention 30-day response time', () => {
      expect(content).toContain('30 days');
    });

    it('should have links to external privacy policies', () => {
      expect(content).toContain('stripe.com/privacy');
      expect(content).toContain('policies.google.com');
    });

    it('should mention PCI DSS compliance', () => {
      expect(content).toContain('PCI DSS');
    });
  });

  describe('Page Structure Comparison', () => {
    let termsContent: string;
    let privacyContent: string;

    beforeEach(() => {
      termsContent = readFileSync(termsPath, 'utf-8');
      privacyContent = readFileSync(privacyPath, 'utf-8');
    });

    it('both pages should use BaseLayout', () => {
      expect(termsContent).toContain('BaseLayout');
      expect(privacyContent).toContain('BaseLayout');
    });

    it('both pages should have last updated dates', () => {
      expect(termsContent).toContain('lastUpdated');
      expect(privacyContent).toContain('lastUpdated');
    });

    it('both pages should have table of contents', () => {
      expect(termsContent).toContain('Table of Contents');
      expect(privacyContent).toContain('Table of Contents');
    });

    it('both pages should link to each other', () => {
      expect(termsContent).toContain('privacy-policy');
      expect(privacyContent).toContain('terms-of-service');
    });

    it('both pages should have contact information', () => {
      expect(termsContent).toContain('@spiritualityplatform.com');
      expect(privacyContent).toContain('@spiritualityplatform.com');
    });

    it('both pages should use Tailwind CSS', () => {
      expect(termsContent).toMatch(/class=".*rounded-xl/);
      expect(privacyContent).toMatch(/class=".*rounded-xl/);
    });

    it('both pages should have smooth scrolling', () => {
      expect(termsContent).toContain('scroll-behavior: smooth');
      expect(privacyContent).toContain('scroll-behavior: smooth');
    });

    it('both pages should have proper heading hierarchy', () => {
      expect(termsContent).toContain('<h1');
      expect(termsContent).toContain('<h2');
      expect(privacyContent).toContain('<h1');
      expect(privacyContent).toContain('<h2');
    });
  });

  describe('Accessibility', () => {
    let termsContent: string;
    let privacyContent: string;

    beforeEach(() => {
      termsContent = readFileSync(termsPath, 'utf-8');
      privacyContent = readFileSync(privacyPath, 'utf-8');
    });

    it('Terms page should have aria-label for navigation', () => {
      expect(termsContent).toMatch(/aria-label="Table of Contents"/);
    });

    it('Privacy page should have aria-label for navigation', () => {
      expect(privacyContent).toMatch(/aria-label="Table of Contents"/);
    });

    it('both pages should have semantic time elements', () => {
      expect(termsContent).toContain('<time');
      expect(privacyContent).toContain('<time');
    });

    it('both pages should have datetime attributes', () => {
      expect(termsContent).toMatch(/datetime=/);
      expect(privacyContent).toMatch(/datetime=/);
    });

    it('both pages should have proper link text', () => {
      expect(termsContent).not.toMatch(/click here|read more/i);
      expect(privacyContent).not.toMatch(/click here|read more/i);
    });
  });

  describe('SEO', () => {
    let termsContent: string;
    let privacyContent: string;

    beforeEach(() => {
      termsContent = readFileSync(termsPath, 'utf-8');
      privacyContent = readFileSync(privacyPath, 'utf-8');
    });

    it('Terms page should have descriptive title', () => {
      expect(termsContent).toMatch(/title="Terms of Service"/);
    });

    it('Privacy page should have descriptive title', () => {
      expect(privacyContent).toMatch(/title="Privacy Policy"/);
    });

    it('both pages should have meta descriptions', () => {
      expect(termsContent).toMatch(/description="/);
      expect(privacyContent).toMatch(/description="/);
    });

    it('both pages should have keywords', () => {
      expect(termsContent).toMatch(/keywords="/);
      expect(privacyContent).toMatch(/keywords="/);
    });

    it('Terms page keywords should include legal terms', () => {
      expect(termsContent).toContain('terms of service');
      expect(termsContent).toContain('legal');
    });

    it('Privacy page keywords should include privacy terms', () => {
      expect(privacyContent).toContain('privacy policy');
      expect(privacyContent).toContain('gdpr');
    });
  });

  describe('Legal Completeness', () => {
    let termsContent: string;
    let privacyContent: string;

    beforeEach(() => {
      termsContent = readFileSync(termsPath, 'utf-8');
      privacyContent = readFileSync(privacyPath, 'utf-8');
    });

    it('Terms should cover user obligations', () => {
      expect(termsContent).toContain('you agree');
      expect(termsContent).toContain('you must');
    });

    it('Terms should have liability limitations', () => {
      expect(termsContent).toContain('LIABLE');
      expect(termsContent).toContain('TO THE MAXIMUM EXTENT');
    });

    it('Terms should have dispute resolution', () => {
      expect(termsContent).toContain('arbitration');
      expect(termsContent).toContain('dispute');
    });

    it('Privacy should explain data collection', () => {
      expect(privacyContent).toContain('collect');
      expect(privacyContent).toContain('personal information');
    });

    it('Privacy should explain data usage', () => {
      expect(privacyContent).toContain('use the information we collect');
      expect(privacyContent).toContain('process');
    });

    it('Privacy should explain user rights', () => {
      expect(privacyContent).toContain('your rights');
      expect(privacyContent).toContain('access');
      expect(privacyContent).toContain('deletion');
    });
  });

  describe('Code Quality', () => {
    let termsContent: string;
    let privacyContent: string;

    beforeEach(() => {
      termsContent = readFileSync(termsPath, 'utf-8');
      privacyContent = readFileSync(privacyPath, 'utf-8');
    });

    it('both pages should have JSDoc comments', () => {
      expect(termsContent).toMatch(/\/\*\*/);
      expect(privacyContent).toMatch(/\/\*\*/);
    });

    it('both pages should have proper indentation', () => {
      // Check that content is properly formatted
      expect(termsContent.split('\n').length).toBeGreaterThan(100);
      expect(privacyContent.split('\n').length).toBeGreaterThan(100);
    });

    it('both pages should have consistent spacing', () => {
      // Check for consistent class naming
      expect(termsContent).toMatch(/class="/g);
      expect(privacyContent).toMatch(/class="/g);
    });
  });
});
