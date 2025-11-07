/**
 * T148: GDPR Compliance - Test Suite
 *
 * Tests for GDPR compliance implementation:
 * - Cookie consent management
 * - Data export (Article 15 & 20)
 * - Data deletion/anonymization (Article 17)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  exportUserData,
  deleteUserData,
  parseCookieConsent,
  generateConsentCookie,
  checkGDPRCompliance,
  type UserDataExport,
  type DeletionResult,
  type CookieConsent,
} from '../../src/lib/gdpr';
import pool from '../../src/lib/db';

describe('T148: GDPR Compliance', () => {
  // Test user IDs
  const testUserId = '550e8400-e29b-41d4-a716-446655440000';
  const testUserWithOrdersId = '550e8400-e29b-41d4-a716-446655440001';

  // Cleanup function
  async function cleanupTestData() {
    const client = await pool.connect();
    try {
      // Delete orders first (they have RESTRICT constraint)
      await client.query('DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE user_id = ANY($1))', [
        [testUserId, testUserWithOrdersId],
      ]);
      await client.query('DELETE FROM orders WHERE user_id = ANY($1)', [
        [testUserId, testUserWithOrdersId],
      ]);

      // Delete bookings
      await client.query('DELETE FROM bookings WHERE user_id = ANY($1)', [
        [testUserId, testUserWithOrdersId],
      ]);

      // Delete cart items
      await client.query('DELETE FROM cart_items WHERE user_id = ANY($1)', [
        [testUserId, testUserWithOrdersId],
      ]);

      // Delete test courses
      await client.query('DELETE FROM courses WHERE slug = $1', ['test-course-gdpr']);

      // Delete reviews
      await client.query('DELETE FROM reviews WHERE user_id = ANY($1)', [
        [testUserId, testUserWithOrdersId],
      ]);

      // Delete progress tracking
      await client.query('DELETE FROM lesson_progress WHERE user_id = ANY($1)', [
        [testUserId, testUserWithOrdersId],
      ]);
      await client.query('DELETE FROM course_progress WHERE user_id = ANY($1)', [
        [testUserId, testUserWithOrdersId],
      ]);

      // Delete password reset tokens
      await client.query('DELETE FROM password_reset_tokens WHERE user_id = ANY($1)', [
        [testUserId, testUserWithOrdersId],
      ]);

      // Finally delete test users
      await client.query('DELETE FROM users WHERE id = ANY($1)', [
        [testUserId, testUserWithOrdersId],
      ]);
    } catch (error) {
      // Ignore errors during cleanup
      console.log('[Test Cleanup] Error:', error);
    } finally {
      client.release();
    }
  }

  beforeEach(async () => {
    await cleanupTestData();
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  describe('Cookie Consent Management', () => {
    it('should parse empty consent cookie', () => {
      const consent = parseCookieConsent(undefined);

      expect(consent.essential).toBe(true);
      expect(consent.analytics).toBe(false);
      expect(consent.marketing).toBe(false);
      expect(consent.timestamp).toBeGreaterThan(0);
    });

    it('should parse valid consent cookie', () => {
      const cookie = encodeURIComponent(
        JSON.stringify({
          essential: true,
          analytics: true,
          marketing: false,
          timestamp: 1699999999000,
        })
      );

      const consent = parseCookieConsent(cookie);

      expect(consent.essential).toBe(true);
      expect(consent.analytics).toBe(true);
      expect(consent.marketing).toBe(false);
      expect(consent.timestamp).toBe(1699999999000);
    });

    it('should handle malformed consent cookie', () => {
      const consent = parseCookieConsent('invalid-json');

      expect(consent.essential).toBe(true);
      expect(consent.analytics).toBe(false);
      expect(consent.marketing).toBe(false);
    });

    it('should generate consent cookie', () => {
      const cookie = generateConsentCookie(true, true);

      expect(cookie).toBeTruthy();
      expect(cookie.length).toBeGreaterThan(0);

      // Should be URL-encoded JSON
      const decoded = decodeURIComponent(cookie);
      const parsed = JSON.parse(decoded);

      expect(parsed.essential).toBe(true);
      expect(parsed.analytics).toBe(true);
      expect(parsed.marketing).toBe(true);
      expect(parsed.timestamp).toBeGreaterThan(0);
    });

    it('should generate consent cookie with selective permissions', () => {
      const cookie = generateConsentCookie(true, false);
      const decoded = decodeURIComponent(cookie);
      const parsed = JSON.parse(decoded);

      expect(parsed.analytics).toBe(true);
      expect(parsed.marketing).toBe(false);
    });
  });

  describe('Data Export (Article 15 & 20)', () => {
    it('should export user data with all fields', async () => {
      // Create test user
      await pool.query(
        `INSERT INTO users (id, email, name, password_hash, role, whatsapp)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          testUserId,
          'test@example.com',
          'Test User',
          'hashed_password',
          'user',
          '+1234567890',
        ]
      );

      const exportData = await exportUserData(testUserId);

      // Verify metadata
      expect(exportData.metadata).toBeDefined();
      expect(exportData.metadata.userId).toBe(testUserId);
      expect(exportData.metadata.format).toBe('json');
      expect(exportData.metadata.gdprArticle).toContain('Article 15');
      expect(exportData.metadata.exportDate).toBeTruthy();

      // Verify profile data
      expect(exportData.profile).toBeDefined();
      expect(exportData.profile.id).toBe(testUserId);
      expect(exportData.profile.email).toBe('test@example.com');
      expect(exportData.profile.name).toBe('Test User');
      expect(exportData.profile.role).toBe('user');
      expect(exportData.profile.whatsapp).toBe('+1234567890');
      expect(exportData.profile.preferredLanguage).toBeNull();
    });

    it('should export empty arrays for user with no activity', async () => {
      // Create test user
      await pool.query(
        `INSERT INTO users (id, email, name, password_hash, role)
         VALUES ($1, $2, $3, $4, $5)`,
        [testUserId, 'test@example.com', 'Test User', 'hashed_password', 'user']
      );

      const exportData = await exportUserData(testUserId);

      expect(exportData.orders).toEqual([]);
      expect(exportData.bookings).toEqual([]);
      expect(exportData.reviews).toEqual([]);
      expect(exportData.courseProgress).toEqual([]);
      expect(exportData.lessonProgress).toEqual([]);
      expect(exportData.downloads).toEqual([]);
      expect(exportData.cart).toEqual([]);
    });

    it('should throw error for non-existent user', async () => {
      await expect(
        exportUserData('00000000-0000-0000-0000-000000000000')
      ).rejects.toThrow('User not found');
    });

    it('should include all data categories', async () => {
      // Create test user
      await pool.query(
        `INSERT INTO users (id, email, name, password_hash, role)
         VALUES ($1, $2, $3, $4, $5)`,
        [testUserId, 'test@example.com', 'Test User', 'hashed_password', 'user']
      );

      const exportData = await exportUserData(testUserId);

      // Verify all required categories exist
      expect(exportData).toHaveProperty('metadata');
      expect(exportData).toHaveProperty('profile');
      expect(exportData).toHaveProperty('orders');
      expect(exportData).toHaveProperty('bookings');
      expect(exportData).toHaveProperty('reviews');
      expect(exportData).toHaveProperty('courseProgress');
      expect(exportData).toHaveProperty('lessonProgress');
      expect(exportData).toHaveProperty('downloads');
      expect(exportData).toHaveProperty('cart');
    });

    it('should format dates as ISO strings', async () => {
      // Create test user
      await pool.query(
        `INSERT INTO users (id, email, name, password_hash, role)
         VALUES ($1, $2, $3, $4, $5)`,
        [testUserId, 'test@example.com', 'Test User', 'hashed_password', 'user']
      );

      const exportData = await exportUserData(testUserId);

      // Check ISO format (YYYY-MM-DDTHH:mm:ss.sssZ)
      expect(exportData.metadata.exportDate).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
      );
      expect(exportData.profile.createdAt).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
      );
    });
  });

  describe('Data Deletion (Article 17)', () => {
    it('should soft delete user without financial records', async () => {
      // Create test user
      await pool.query(
        `INSERT INTO users (id, email, name, password_hash, role)
         VALUES ($1, $2, $3, $4, $5)`,
        [testUserId, 'test@example.com', 'Test User', 'hashed_password', 'user']
      );

      const result = await deleteUserData(testUserId, false);

      expect(result.success).toBe(true);
      expect(result.userId).toBe(testUserId);
      expect(result.deletionType).toBe('soft-deleted');
      expect(result.deletedAt).toBeTruthy();

      // Verify user is soft deleted
      const userCheck = await pool.query(
        'SELECT deleted_at FROM users WHERE id = $1',
        [testUserId]
      );
      expect(userCheck.rows[0].deleted_at).not.toBeNull();
    });

    it('should hard delete user without financial records', async () => {
      // Create test user
      await pool.query(
        `INSERT INTO users (id, email, name, password_hash, role)
         VALUES ($1, $2, $3, $4, $5)`,
        [testUserId, 'test@example.com', 'Test User', 'hashed_password', 'user']
      );

      const result = await deleteUserData(testUserId, true);

      expect(result.success).toBe(true);
      expect(result.deletionType).toBe('hard-deleted');

      // Verify user is completely deleted
      const userCheck = await pool.query('SELECT * FROM users WHERE id = $1', [
        testUserId,
      ]);
      expect(userCheck.rows.length).toBe(0);
    });

    it('should anonymize user with financial records', async () => {
      // Create test user
      await pool.query(
        `INSERT INTO users (id, email, name, password_hash, role)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          testUserWithOrdersId,
          'user@example.com',
          'User With Orders',
          'hashed_password',
          'user',
        ]
      );

      // Create an order (financial record)
      await pool.query(
        `INSERT INTO orders (id, user_id, status, total_amount, currency)
         VALUES (uuid_generate_v4(), $1, $2, $3, $4)`,
        [testUserWithOrdersId, 'completed', 100.0, 'USD']
      );

      const result = await deleteUserData(testUserWithOrdersId, false);

      expect(result.success).toBe(true);
      expect(result.deletionType).toBe('anonymized');
      expect(result.anonymizedRecords.orders).toBeGreaterThan(0);
      expect(result.message).toContain('Financial records');

      // Verify user is anonymized
      const userCheck = await pool.query(
        'SELECT email, name, deleted_at FROM users WHERE id = $1',
        [testUserWithOrdersId]
      );

      const user = userCheck.rows[0];
      expect(user.email).toContain('@anonymized.local');
      expect(user.name).toContain('Deleted User');
      expect(user.deleted_at).not.toBeNull();

      // Verify order still exists
      const orderCheck = await pool.query(
        'SELECT * FROM orders WHERE user_id = $1',
        [testUserWithOrdersId]
      );
      expect(orderCheck.rows.length).toBeGreaterThan(0);
    });

    it('should throw error for non-existent user', async () => {
      await expect(
        deleteUserData('00000000-0000-0000-0000-000000000000', false)
      ).rejects.toThrow('User not found');
    });

    it('should delete related non-essential data during anonymization', async () => {
      // Create test user
      await pool.query(
        `INSERT INTO users (id, email, name, password_hash, role)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          testUserWithOrdersId,
          'user@example.com',
          'User With Orders',
          'hashed_password',
          'user',
        ]
      );

      // Create a test course
      const courseResult = await pool.query(
        `INSERT INTO courses (id, title, slug, description, price)
         VALUES (uuid_generate_v4(), $1, $2, $3, $4)
         RETURNING id`,
        ['Test Course', 'test-course-gdpr', 'Test description', 99.99]
      );
      const courseId = courseResult.rows[0].id;

      // Create an order
      await pool.query(
        `INSERT INTO orders (id, user_id, status, total_amount, currency)
         VALUES (uuid_generate_v4(), $1, $2, $3, $4)`,
        [testUserWithOrdersId, 'completed', 100.0, 'USD']
      );

      // Create cart items (non-essential)
      await pool.query(
        `INSERT INTO cart_items (id, user_id, course_id, item_type, quantity)
         VALUES (uuid_generate_v4(), $1, $2, $3, $4)`,
        [testUserWithOrdersId, courseId, 'course', 1]
      );

      const result = await deleteUserData(testUserWithOrdersId, false);

      expect(result.success).toBe(true);
      expect(result.deletionType).toBe('anonymized');

      // Verify cart items are deleted
      const cartCheck = await pool.query(
        'SELECT * FROM cart_items WHERE user_id = $1',
        [testUserWithOrdersId]
      );
      expect(cartCheck.rows.length).toBe(0);
    });

    it('should return detailed deletion statistics', async () => {
      // Create test user
      await pool.query(
        `INSERT INTO users (id, email, name, password_hash, role)
         VALUES ($1, $2, $3, $4, $5)`,
        [testUserId, 'test@example.com', 'Test User', 'hashed_password', 'user']
      );

      const result = await deleteUserData(testUserId, false);

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('userId');
      expect(result).toHaveProperty('deletionType');
      expect(result).toHaveProperty('deletedAt');
      expect(result).toHaveProperty('anonymizedRecords');
      expect(result).toHaveProperty('deletedRecords');
      expect(result).toHaveProperty('message');

      expect(result.anonymizedRecords).toHaveProperty('orders');
      expect(result.anonymizedRecords).toHaveProperty('bookings');
      expect(result.deletedRecords).toHaveProperty('passwordResetTokens');
      expect(result.deletedRecords).toHaveProperty('cartItems');
      expect(result.deletedRecords).toHaveProperty('reviews');
    });
  });

  describe('GDPR Compliance Check', () => {
    it('should return compliance status', async () => {
      const compliance = await checkGDPRCompliance();

      expect(compliance).toHaveProperty('privacyPolicyExists');
      expect(compliance).toHaveProperty('termsOfServiceExists');
      expect(compliance).toHaveProperty('cookieConsentImplemented');
      expect(compliance).toHaveProperty('dataExportAvailable');
      expect(compliance).toHaveProperty('dataDeletionAvailable');
      expect(compliance).toHaveProperty('compliant');

      expect(compliance.cookieConsentImplemented).toBe(true);
      expect(compliance.dataExportAvailable).toBe(true);
      expect(compliance.dataDeletionAvailable).toBe(true);
    });

    it('should indicate full compliance', async () => {
      const compliance = await checkGDPRCompliance();

      expect(compliance.compliant).toBe(true);
    });
  });

  describe('Cookie Consent Interface', () => {
    it('should have correct consent structure', () => {
      const consent: CookieConsent = {
        essential: true,
        analytics: false,
        marketing: false,
        timestamp: Date.now(),
      };

      expect(consent.essential).toBe(true);
      expect(typeof consent.analytics).toBe('boolean');
      expect(typeof consent.marketing).toBe('boolean');
      expect(typeof consent.timestamp).toBe('number');
    });

    it('should enforce essential cookies', () => {
      // Essential cookies should always be true
      const consent = parseCookieConsent(
        encodeURIComponent(
          JSON.stringify({
            essential: false, // Try to set false
            analytics: true,
            marketing: true,
            timestamp: Date.now(),
          })
        )
      );

      // Essential should be forced to true
      expect(consent.essential).toBe(true);
    });
  });

  describe('Export Data Structure', () => {
    it('should match UserDataExport interface', async () => {
      // Create test user
      await pool.query(
        `INSERT INTO users (id, email, name, password_hash, role)
         VALUES ($1, $2, $3, $4, $5)`,
        [testUserId, 'test@example.com', 'Test User', 'hashed_password', 'user']
      );

      const exportData = await exportUserData(testUserId);

      // Type check - should compile without errors
      const typedExport: UserDataExport = exportData;

      expect(typedExport).toBeDefined();
      expect(Array.isArray(typedExport.orders)).toBe(true);
      expect(Array.isArray(typedExport.bookings)).toBe(true);
      expect(Array.isArray(typedExport.reviews)).toBe(true);
    });
  });

  describe('Deletion Result Structure', () => {
    it('should match DeletionResult interface', async () => {
      // Create test user
      await pool.query(
        `INSERT INTO users (id, email, name, password_hash, role)
         VALUES ($1, $2, $3, $4, $5)`,
        [testUserId, 'test@example.com', 'Test User', 'hashed_password', 'user']
      );

      const result = await deleteUserData(testUserId, false);

      // Type check - should compile without errors
      const typedResult: DeletionResult = result;

      expect(typedResult).toBeDefined();
      expect(typeof typedResult.success).toBe('boolean');
      expect(['anonymized', 'soft-deleted', 'hard-deleted']).toContain(
        typedResult.deletionType
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle concurrent export requests', async () => {
      // Create test user
      await pool.query(
        `INSERT INTO users (id, email, name, password_hash, role)
         VALUES ($1, $2, $3, $4, $5)`,
        [testUserId, 'test@example.com', 'Test User', 'hashed_password', 'user']
      );

      // Make multiple concurrent exports
      const exports = await Promise.all([
        exportUserData(testUserId),
        exportUserData(testUserId),
        exportUserData(testUserId),
      ]);

      expect(exports.length).toBe(3);
      exports.forEach((exp) => {
        expect(exp.profile.email).toBe('test@example.com');
      });
    });

    it('should handle very long user names', async () => {
      const longName = 'A'.repeat(255);

      await pool.query(
        `INSERT INTO users (id, email, name, password_hash, role)
         VALUES ($1, $2, $3, $4, $5)`,
        [testUserId, 'test@example.com', longName, 'hashed_password', 'user']
      );

      const exportData = await exportUserData(testUserId);
      expect(exportData.profile.name).toBe(longName);
    });

    it('should handle special characters in email', async () => {
      const specialEmail = "test+special.user@example.com";

      await pool.query(
        `INSERT INTO users (id, email, name, password_hash, role)
         VALUES ($1, $2, $3, $4, $5)`,
        [testUserId, specialEmail, 'Test User', 'hashed_password', 'user']
      );

      const exportData = await exportUserData(testUserId);
      expect(exportData.profile.email).toBe(specialEmail);
    });
  });

  describe('Performance', () => {
    it('should export data within reasonable time', async () => {
      // Create test user
      await pool.query(
        `INSERT INTO users (id, email, name, password_hash, role)
         VALUES ($1, $2, $3, $4, $5)`,
        [testUserId, 'test@example.com', 'Test User', 'hashed_password', 'user']
      );

      const startTime = Date.now();
      await exportUserData(testUserId);
      const duration = Date.now() - startTime;

      // Should complete within 5 seconds
      expect(duration).toBeLessThan(5000);
    });

    it('should delete data within reasonable time', async () => {
      // Create test user
      await pool.query(
        `INSERT INTO users (id, email, name, password_hash, role)
         VALUES ($1, $2, $3, $4, $5)`,
        [testUserId, 'test@example.com', 'Test User', 'hashed_password', 'user']
      );

      const startTime = Date.now();
      await deleteUserData(testUserId, false);
      const duration = Date.now() - startTime;

      // Should complete within 5 seconds
      expect(duration).toBeLessThan(5000);
    });
  });
});
