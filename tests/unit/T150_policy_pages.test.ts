/**
 * T150: Refund and Cancellation Policy Pages Tests
 *
 * Comprehensive tests for refund policy and cancellation policy pages.
 * Tests content, structure, accessibility, SEO, and legal completeness.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'fs/promises';

describe('T150: Policy Pages', () => {
  let refundContent: string;
  let cancellationContent: string;

  beforeAll(async () => {
    // Read both policy page files once for all tests
    refundContent = await fs.readFile('src/pages/refund-policy.astro', 'utf-8');
    cancellationContent = await fs.readFile('src/pages/cancellation-policy.astro', 'utf-8');
  });

  describe('File Existence', () => {
    it('should have refund policy page', async () => {
      const exists = await fs.access('src/pages/refund-policy.astro')
        .then(() => true)
        .catch(() => false);
      expect(exists).toBe(true);
    });

    it('should have cancellation policy page', async () => {
      const exists = await fs.access('src/pages/cancellation-policy.astro')
        .then(() => true)
        .catch(() => false);
      expect(exists).toBe(true);
    });
  });

  describe('Refund Policy Content', () => {
    describe('Main Sections', () => {
      it('should have course refunds section', () => {
        expect(refundContent).toContain('Course Refunds');
        expect(refundContent).toContain('id="course-refunds"');
      });

      it('should have event refunds section', () => {
        expect(refundContent).toContain('Event Refunds');
        expect(refundContent).toContain('id="event-refunds"');
      });

      it('should have refund exceptions section', () => {
        expect(refundContent).toContain('Refund Exceptions');
        expect(refundContent).toContain('id="refund-exceptions"');
      });

      it('should have refund process section', () => {
        expect(refundContent).toContain('How to Request a Refund');
        expect(refundContent).toContain('id="refund-process"');
      });

      it('should have processing time section', () => {
        expect(refundContent).toContain('Refund Processing Time');
        expect(refundContent).toContain('id="processing-time"');
      });

      it('should have payment method section', () => {
        expect(refundContent).toContain('Refund Payment Method');
        expect(refundContent).toContain('id="payment-method"');
      });

      it('should have partial refunds section', () => {
        expect(refundContent).toContain('Partial Refunds');
        expect(refundContent).toContain('id="partial-refunds"');
      });

      it('should have non-refundable items section', () => {
        expect(refundContent).toContain('Non-Refundable Items');
        expect(refundContent).toContain('id="no-refund-situations"');
      });

      it('should have chargebacks section', () => {
        expect(refundContent).toContain('Chargebacks');
        expect(refundContent).toContain('id="chargebacks"');
      });

      it('should have changes to policy section', () => {
        expect(refundContent).toContain('Changes to This Policy');
        expect(refundContent).toContain('id="changes-to-policy"');
      });

      it('should have contact information section', () => {
        expect(refundContent).toContain('Contact Information');
        expect(refundContent).toContain('id="contact"');
      });
    });

    describe('30-Day Money-Back Guarantee', () => {
      it('should mention 30-day money-back guarantee', () => {
        expect(refundContent).toContain('30-day');
        expect(refundContent).toContain('money-back');
        expect(refundContent).toContain('guarantee');
      });

      it('should explain eligibility requirements', () => {
        expect(refundContent).toContain('within 30 days');
        expect(refundContent).toContain('90%');
        expect(refundContent).toContain('completed');
      });

      it('should explain certificate impact', () => {
        expect(refundContent).toContain('certificate');
        expect(refundContent).toContain('revoked');
      });
    });

    describe('Event Refund Timeline', () => {
      it('should have event refund timeline table', () => {
        expect(refundContent).toContain('Cancellation Time');
        expect(refundContent).toContain('Refund Amount');
      });

      it('should mention 100% refund for early cancellation', () => {
        expect(refundContent).toContain('100%');
        expect(refundContent).toContain('30 days');
      });

      it('should mention sliding scale refunds', () => {
        expect(refundContent).toContain('75%');
        expect(refundContent).toContain('50%');
        expect(refundContent).toContain('25%');
      });

      it('should mention event credits', () => {
        expect(refundContent).toContain('credit');
        expect(refundContent).toContain('future event');
      });
    });

    describe('Refund Process', () => {
      it('should explain online refund request', () => {
        expect(refundContent).toContain('account');
        expect(refundContent).toContain('Request Refund');
      });

      it('should provide refund email', () => {
        expect(refundContent).toContain('refunds@');
        expect(refundContent).toContain('spiritualityplatform.com');
      });

      it('should mention required information', () => {
        expect(refundContent).toContain('order number');
        expect(refundContent).toContain('transaction');
      });

      it('should explain review process', () => {
        expect(refundContent).toContain('review');
        expect(refundContent).toContain('verify');
        expect(refundContent).toContain('eligibility');
      });
    });

    describe('Processing Times', () => {
      it('should mention approval timeframe', () => {
        expect(refundContent).toContain('2-3 business days');
        expect(refundContent).toContain('review');
      });

      it('should mention processing timeframe', () => {
        expect(refundContent).toContain('5-7 business days');
        expect(refundContent).toContain('process');
      });

      it('should mention bank processing time', () => {
        expect(refundContent).toContain('bank');
        expect(refundContent).toContain('credit card');
      });

      it('should mention tracking refunds', () => {
        expect(refundContent).toContain('track');
        expect(refundContent).toContain('status');
      });
    });

    describe('Exceptions and Limitations', () => {
      it('should list completed courses exception', () => {
        expect(refundContent).toContain('Completed Courses');
        expect(refundContent).toContain('90%');
      });

      it('should list gift purchases exception', () => {
        expect(refundContent).toContain('Gift');
        expect(refundContent).toContain('redeemed');
      });

      it('should list subscription exception', () => {
        expect(refundContent).toContain('Subscription');
        expect(refundContent).toContain('non-refundable');
      });

      it('should mention promotional purchases', () => {
        expect(refundContent).toContain('Promotional');
        expect(refundContent).toContain('final sale');
      });
    });

    describe('Chargebacks', () => {
      it('should encourage contacting support first', () => {
        expect(refundContent).toContain('Contact Us First');
        expect(refundContent).toContain('chargeback');
      });

      it('should explain valid chargeback reasons', () => {
        expect(refundContent).toContain('Unauthorized');
        expect(refundContent).toContain('duplicate');
      });

      it('should explain chargeback consequences', () => {
        expect(refundContent).toContain('suspended');
        expect(refundContent).toContain('access');
      });
    });
  });

  describe('Cancellation Policy Content', () => {
    describe('Main Sections', () => {
      it('should have course cancellation section', () => {
        expect(cancellationContent).toContain('Course Enrollment Cancellation');
        expect(cancellationContent).toContain('id="course-cancellation"');
      });

      it('should have event cancellation section', () => {
        expect(cancellationContent).toContain('Event Booking Cancellation');
        expect(cancellationContent).toContain('id="event-cancellation"');
      });

      it('should have subscription cancellation section', () => {
        expect(cancellationContent).toContain('Subscription Cancellation');
        expect(cancellationContent).toContain('id="subscription-cancellation"');
      });

      it('should have account cancellation section', () => {
        expect(cancellationContent).toContain('Account Closure');
        expect(cancellationContent).toContain('id="account-cancellation"');
      });

      it('should have how to cancel section', () => {
        expect(cancellationContent).toContain('How to Cancel');
        expect(cancellationContent).toContain('id="how-to-cancel"');
      });

      it('should have after cancellation section', () => {
        expect(cancellationContent).toContain('After Cancellation');
        expect(cancellationContent).toContain('id="after-cancellation"');
      });

      it('should have reinstatement section', () => {
        expect(cancellationContent).toContain('Reinstatement');
        expect(cancellationContent).toContain('id="reinstatement"');
      });

      it('should have when we cancel section', () => {
        expect(cancellationContent).toContain('When We Cancel');
        expect(cancellationContent).toContain('id="we-cancel"');
      });

      it('should have contact information section', () => {
        expect(cancellationContent).toContain('Contact Information');
        expect(cancellationContent).toContain('id="contact"');
      });
    });

    describe('Course Cancellation', () => {
      it('should explain when courses can be cancelled', () => {
        expect(cancellationContent).toContain('cancel');
        expect(cancellationContent).toContain('enrollment');
        expect(cancellationContent).toContain('anytime');
      });

      it('should explain cancellation process', () => {
        expect(cancellationContent).toContain('Log in');
        expect(cancellationContent).toContain('My Courses');
        expect(cancellationContent).toContain('Cancel Enrollment');
      });

      it('should explain what happens to progress', () => {
        expect(cancellationContent).toContain('progress');
        expect(cancellationContent).toContain('saved');
        expect(cancellationContent).toContain('deleted');
      });

      it('should mention course bundles', () => {
        expect(cancellationContent).toContain('bundle');
        expect(cancellationContent).toContain('individual');
      });
    });

    describe('Event Cancellation Timeline', () => {
      it('should have event cancellation timeline table', () => {
        expect(cancellationContent).toContain('Notice Period');
        expect(cancellationContent).toContain('Refund');
        expect(cancellationContent).toContain('Status');
      });

      it('should show 30+ days timeline', () => {
        expect(cancellationContent).toContain('30+ days');
        expect(cancellationContent).toContain('100%');
      });

      it('should show sliding scale', () => {
        expect(cancellationContent).toContain('15-30 days');
        expect(cancellationContent).toContain('7-14 days');
        expect(cancellationContent).toContain('3-6 days');
      });

      it('should mention less than 3 days policy', () => {
        expect(cancellationContent).toContain('Less than 3 days');
        expect(cancellationContent).toContain('credit');
      });
    });

    describe('Subscription Cancellation', () => {
      it('should explain when subscriptions can be cancelled', () => {
        expect(cancellationContent).toContain('cancel your subscription');
        expect(cancellationContent).toContain('any time');
      });

      it('should explain cancellation process', () => {
        expect(cancellationContent).toContain('Account Settings');
        expect(cancellationContent).toContain('Subscription');
        expect(cancellationContent).toContain('Cancel Subscription');
      });

      it('should explain monthly subscriptions', () => {
        expect(cancellationContent).toContain('Monthly');
        expect(cancellationContent).toContain('end of current month');
      });

      it('should explain annual subscriptions', () => {
        expect(cancellationContent).toContain('Annual');
        expect(cancellationContent).toContain('end of current year');
      });

      it('should mention pause option', () => {
        expect(cancellationContent).toContain('Pause');
        expect(cancellationContent).toContain('alternative');
      });
    });

    describe('Account Closure', () => {
      it('should explain account closure is permanent', () => {
        expect(cancellationContent).toContain('permanent');
        expect(cancellationContent).toContain('close your account');
      });

      it('should warn about data deletion', () => {
        expect(cancellationContent).toContain('data');
        expect(cancellationContent).toContain('deleted');
      });

      it('should list things to do before closing', () => {
        expect(cancellationContent).toContain('Download certificates');
        expect(cancellationContent).toContain('Export data');
      });

      it('should explain grace period', () => {
        expect(cancellationContent).toContain('30-day grace period');
        expect(cancellationContent).toContain('reactivate');
      });

      it('should mention deactivation alternative', () => {
        expect(cancellationContent).toContain('Deactivate');
        expect(cancellationContent).toContain('Temporary');
      });
    });

    describe('Cancellation Methods', () => {
      it('should explain self-service cancellation', () => {
        expect(cancellationContent).toContain('Self-Service');
        expect(cancellationContent).toContain('dashboard');
      });

      it('should provide cancellation email', () => {
        expect(cancellationContent).toContain('cancel@');
        expect(cancellationContent).toContain('spiritualityplatform.com');
      });

      it('should provide phone number', () => {
        expect(cancellationContent).toContain('1-800-SPIRIT-1');
        expect(cancellationContent).toContain('Phone');
      });

      it('should explain bulk cancellations', () => {
        expect(cancellationContent).toContain('bulk');
        expect(cancellationContent).toContain('multiple');
      });
    });

    describe('After Cancellation', () => {
      it('should explain immediate effects', () => {
        expect(cancellationContent).toContain('Immediate');
        expect(cancellationContent).toContain('Confirmation');
      });

      it('should have access timeline table', () => {
        expect(cancellationContent).toContain('Access Ends');
        expect(cancellationContent).toContain('Item Type');
      });

      it('should explain data retention', () => {
        expect(cancellationContent).toContain('Data Retention');
        expect(cancellationContent).toContain('90 days');
      });

      it('should explain email communications', () => {
        expect(cancellationContent).toContain('Email Communications');
        expect(cancellationContent).toContain('unsubscribe');
      });
    });

    describe('Reinstatement', () => {
      it('should explain reactivating items', () => {
        expect(cancellationContent).toContain('Reactivating');
        expect(cancellationContent).toContain('change your mind');
      });

      it('should explain progress restoration', () => {
        expect(cancellationContent).toContain('Restoring Progress');
        expect(cancellationContent).toContain('90 days');
      });

      it('should mention reinstatement fees', () => {
        expect(cancellationContent).toContain('Reinstatement Fees');
        expect(cancellationContent).toContain('processing fee');
      });
    });

    describe('When We Cancel', () => {
      it('should explain event cancellations by platform', () => {
        expect(cancellationContent).toContain('Event Cancellations by Us');
        expect(cancellationContent).toContain('Insufficient enrollment');
      });

      it('should mention full refund for platform cancellations', () => {
        expect(cancellationContent).toContain('Full refund');
        expect(cancellationContent).toContain('100%');
      });

      it('should explain course discontinuation', () => {
        expect(cancellationContent).toContain('Course Discontinuation');
        expect(cancellationContent).toContain('keep access');
      });

      it('should explain service termination', () => {
        expect(cancellationContent).toContain('Service Termination');
        expect(cancellationContent).toContain('violations');
      });
    });
  });

  describe('Cross-References', () => {
    it('refund policy should link to cancellation policy', () => {
      expect(refundContent).toContain('/cancellation-policy');
      expect(refundContent).toContain('Cancellation Policy');
    });

    it('cancellation policy should link to refund policy', () => {
      expect(cancellationContent).toContain('/refund-policy');
      expect(cancellationContent).toContain('Refund Policy');
    });

    it('both should link to terms of service', () => {
      expect(refundContent).toContain('/terms-of-service');
      expect(cancellationContent).toContain('/terms-of-service');
    });

    it('both should link to privacy policy', () => {
      expect(refundContent).toContain('/privacy-policy');
      expect(cancellationContent).toContain('/privacy-policy');
    });

    it('both should have contact information', () => {
      expect(refundContent).toContain('support@');
      expect(cancellationContent).toContain('support@');
    });

    it('both should have last updated dates', () => {
      expect(refundContent).toContain('Last Updated');
      expect(cancellationContent).toContain('Last Updated');
    });
  });

  describe('Accessibility', () => {
    it('both pages should use BaseLayout', () => {
      expect(refundContent).toContain('BaseLayout');
      expect(cancellationContent).toContain('BaseLayout');
    });

    it('both pages should have table of contents with aria-label', () => {
      expect(refundContent).toMatch(/<nav[^>]*aria-label="Table of Contents"/);
      expect(cancellationContent).toMatch(/<nav[^>]*aria-label="Table of Contents"/);
    });

    it('both pages should have semantic time elements', () => {
      expect(refundContent).toMatch(/<time[^>]*datetime/);
      expect(cancellationContent).toMatch(/<time[^>]*datetime/);
    });

    it('both pages should have proper heading hierarchy', () => {
      const refundH1Index = refundContent.indexOf('<h1');
      const refundH2Index = refundContent.indexOf('<h2');
      expect(refundH1Index).toBeLessThan(refundH2Index);

      const cancellationH1Index = cancellationContent.indexOf('<h1');
      const cancellationH2Index = cancellationContent.indexOf('<h2');
      expect(cancellationH1Index).toBeLessThan(cancellationH2Index);
    });

    it('both pages should have smooth scrolling', () => {
      expect(refundContent).toContain('scroll-behavior: smooth');
      expect(cancellationContent).toContain('scroll-behavior: smooth');
    });

    it('both pages should have semantic HTML', () => {
      expect(refundContent).toContain('<header');
      expect(refundContent).toContain('<nav');
      expect(refundContent).toContain('<article');
      expect(refundContent).toContain('<section');

      expect(cancellationContent).toContain('<header');
      expect(cancellationContent).toContain('<nav');
      expect(cancellationContent).toContain('<article');
      expect(cancellationContent).toContain('<section');
    });

    it('both pages should have proper link text (no "click here")', () => {
      expect(refundContent).not.toMatch(/href="[^"]*">[^<]*click here/i);
      expect(cancellationContent).not.toMatch(/href="[^"]*">[^<]*click here/i);
    });

    it('refund policy should have accessible table structure', () => {
      expect(refundContent).toContain('<table');
      expect(refundContent).toContain('<thead');
      expect(refundContent).toContain('<tbody');
      expect(refundContent).toContain('<th');
    });

    it('cancellation policy should have accessible table structure', () => {
      expect(cancellationContent).toContain('<table');
      expect(cancellationContent).toContain('<thead');
      expect(cancellationContent).toContain('<tbody');
      expect(cancellationContent).toContain('<th');
    });
  });

  describe('SEO', () => {
    it('refund policy should have descriptive title', () => {
      expect(refundContent).toContain('title="Refund Policy"');
    });

    it('cancellation policy should have descriptive title', () => {
      expect(cancellationContent).toContain('title="Cancellation Policy"');
    });

    it('both pages should have meta descriptions', () => {
      expect(refundContent).toMatch(/description="[^"]{50,}/);
      expect(cancellationContent).toMatch(/description="[^"]{50,}/);
    });

    it('both pages should have keywords', () => {
      expect(refundContent).toContain('keywords=');
      expect(cancellationContent).toContain('keywords=');
    });

    it('refund policy keywords should include relevant terms', () => {
      expect(refundContent).toContain('refund');
      expect(refundContent).toContain('money-back');
    });

    it('cancellation policy keywords should include relevant terms', () => {
      expect(cancellationContent).toContain('cancel');
      expect(cancellationContent).toContain('cancellation');
    });
  });

  describe('Design & Styling', () => {
    it('both pages should use Tailwind CSS', () => {
      expect(refundContent).toMatch(/class=".*container.*mx-auto/);
      expect(cancellationContent).toMatch(/class=".*container.*mx-auto/);
    });

    it('both pages should have responsive design classes', () => {
      expect(refundContent).toMatch(/class=".*px-lg/);
      expect(cancellationContent).toMatch(/class=".*px-lg/);
    });

    it('both pages should use proper spacing', () => {
      expect(refundContent).toContain('space-y-');
      expect(refundContent).toContain('mb-');

      expect(cancellationContent).toContain('space-y-');
      expect(cancellationContent).toContain('mb-');
    });

    it('both pages should use Tailwind typography', () => {
      expect(refundContent).toMatch(/text-(lg|xl|2xl|3xl|4xl)/);
      expect(refundContent).toContain('font-bold');

      expect(cancellationContent).toMatch(/text-(lg|xl|2xl|3xl|4xl)/);
      expect(cancellationContent).toContain('font-bold');
    });

    it('both pages should have consistent spacing', () => {
      expect(refundContent).toContain('mb-2xl');
      expect(cancellationContent).toContain('mb-2xl');
    });

    it('both pages should use bg-surface for cards', () => {
      expect(refundContent).toContain('bg-surface');
      expect(cancellationContent).toContain('bg-surface');
    });

    it('both pages should use bg-background for secondary elements', () => {
      expect(refundContent).toContain('bg-background');
      expect(cancellationContent).toContain('bg-background');
    });

    it('both pages should use text-primary for links', () => {
      expect(refundContent).toContain('text-primary');
      expect(cancellationContent).toContain('text-primary');
    });
  });

  describe('Policy Completeness', () => {
    it('refund policy should cover course refunds comprehensively', () => {
      expect(refundContent).toContain('30-day');
      expect(refundContent).toContain('eligibility');
      expect(refundContent).toContain('90%');
    });

    it('refund policy should cover event refunds with timeline', () => {
      expect(refundContent).toContain('30 days');
      expect(refundContent).toContain('75%');
      expect(refundContent).toContain('50%');
      expect(refundContent).toContain('25%');
    });

    it('refund policy should explain refund process clearly', () => {
      expect(refundContent).toContain('request');
      expect(refundContent).toContain('dashboard');
      expect(refundContent).toContain('email');
    });

    it('refund policy should mention processing times', () => {
      expect(refundContent).toContain('2-3 business days');
      expect(refundContent).toContain('5-7 business days');
    });

    it('cancellation policy should cover all cancellation types', () => {
      expect(cancellationContent).toContain('course');
      expect(cancellationContent).toContain('event');
      expect(cancellationContent).toContain('subscription');
      expect(cancellationContent).toContain('account');
    });

    it('cancellation policy should explain procedures clearly', () => {
      expect(cancellationContent).toContain('How to Cancel');
      expect(cancellationContent).toContain('Log in');
      expect(cancellationContent).toContain('dashboard');
    });

    it('cancellation policy should explain consequences', () => {
      expect(cancellationContent).toContain('After Cancellation');
      expect(cancellationContent).toContain('access');
      expect(cancellationContent).toContain('data');
    });

    it('both policies should provide contact information', () => {
      expect(refundContent).toContain('refunds@');
      expect(refundContent).toContain('support@');

      expect(cancellationContent).toContain('cancel@');
      expect(cancellationContent).toContain('support@');
    });
  });

  describe('Code Quality', () => {
    it('both pages should have JSDoc comments', () => {
      expect(refundContent).toMatch(/\/\*\*/);
      expect(cancellationContent).toMatch(/\/\*\*/);
    });

    it('both pages should have proper frontmatter', () => {
      expect(refundContent).toContain('---');
      expect(cancellationContent).toContain('---');
    });

    it('both pages should import BaseLayout', () => {
      expect(refundContent).toContain("import BaseLayout from '@/layouts/BaseLayout.astro'");
      expect(cancellationContent).toContain("import BaseLayout from '@/layouts/BaseLayout.astro'");
    });

    it('both pages should have date variables', () => {
      expect(refundContent).toContain('lastUpdated');
      expect(refundContent).toContain('effectiveDate');

      expect(cancellationContent).toContain('lastUpdated');
      expect(cancellationContent).toContain('effectiveDate');
    });

    it('both pages should have smooth scrolling style', () => {
      expect(refundContent).toContain('<style>');
      expect(refundContent).toContain('scroll-behavior: smooth');

      expect(cancellationContent).toContain('<style>');
      expect(cancellationContent).toContain('scroll-behavior: smooth');
    });
  });

  describe('User Experience', () => {
    it('refund policy should have clear introduction', () => {
      expect(refundContent).toContain('completely satisfied');
      expect(refundContent).toContain('30-day money-back guarantee');
    });

    it('cancellation policy should have clear introduction', () => {
      expect(cancellationContent).toContain('plans change');
      expect(cancellationContent).toContain('procedures');
    });

    it('both pages should have table of contents', () => {
      expect(refundContent).toContain('Table of Contents');
      expect(cancellationContent).toContain('Table of Contents');
    });

    it('both pages should have anchor links', () => {
      expect(refundContent).toContain('href="#');
      expect(cancellationContent).toContain('href="#');
    });

    it('both pages should have related policies section', () => {
      expect(refundContent).toContain('Related Policies');
      expect(cancellationContent).toContain('Related Policies');
    });

    it('refund policy should use tables for complex information', () => {
      expect(refundContent).toContain('<table');
    });

    it('cancellation policy should use tables for timelines', () => {
      expect(cancellationContent).toContain('<table');
    });

    it('both pages should use lists for clarity', () => {
      expect(refundContent).toContain('<ul');
      expect(refundContent).toContain('<ol');

      expect(cancellationContent).toContain('<ul');
      expect(cancellationContent).toContain('<ol');
    });
  });

  describe('Legal Language', () => {
    it('refund policy should use clear, professional language', () => {
      expect(refundContent).toContain('eligibility');
      expect(refundContent).toContain('requirements');
      expect(refundContent).toContain('conditions');
    });

    it('cancellation policy should use clear, professional language', () => {
      expect(cancellationContent).toContain('procedures');
      expect(cancellationContent).toContain('timeline');
      expect(cancellationContent).toContain('Cancellation Policy');
    });

    it('both pages should explain user rights', () => {
      expect(refundContent).toContain('right');
      expect(cancellationContent).toContain('can');
      expect(cancellationContent).toContain('anytime');
    });

    it('both pages should explain platform obligations', () => {
      expect(refundContent).toContain("We'll");
      expect(refundContent).toContain('process');

      expect(cancellationContent).toContain('we');
      expect(cancellationContent).toContain('notif');
    });
  });
});
