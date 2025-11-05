/**
 * T129: Unit Tests for Password Reset Service
 *
 * Comprehensive test coverage for password reset functionality including:
 * - Token generation
 * - Token creation and storage
 * - Token verification
 * - Token expiration handling
 * - Token usage tracking
 * - Cleanup operations
 * - Rate limiting checks
 *
 * Target: 70%+ coverage
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import {
  generateResetToken,
  createPasswordResetToken,
  verifyResetToken,
  markTokenAsUsed,
  cleanupExpiredTokens,
  invalidateUserTokens,
  hasRecentResetRequest,
  type PasswordResetToken,
} from '../../src/lib/passwordReset';
import { getPool } from '../../src/lib/db';
import type { Pool } from 'pg';

describe('T129: Password Reset Service', () => {
  let pool: Pool;
  let testUserId: string;
  let testUserEmail: string;

  beforeAll(async () => {
    pool = getPool();
  });

  beforeEach(async () => {
    // Create a test user
    testUserEmail = `test-${Date.now()}@example.com`;
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, name)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [testUserEmail, 'hashed_password', 'Test User']
    );
    testUserId = result.rows[0].id;

    // Clean up any existing tokens for this user
    await pool.query('DELETE FROM password_reset_tokens WHERE user_id = $1', [
      testUserId,
    ]);
  });

  afterAll(async () => {
    // Clean up test data
    if (testUserId) {
      await pool.query('DELETE FROM password_reset_tokens WHERE user_id = $1', [
        testUserId,
      ]);
      await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
    }
  });

  describe('generateResetToken', () => {
    it('should generate a token', () => {
      const token = generateResetToken();
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    it('should generate unique tokens', () => {
      const tokens = new Set();
      for (let i = 0; i < 100; i++) {
        tokens.add(generateResetToken());
      }
      // All 100 tokens should be unique
      expect(tokens.size).toBe(100);
    });

    it('should generate tokens with valid base64url characters', () => {
      const token = generateResetToken();
      // Base64URL uses A-Z, a-z, 0-9, -, _
      expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it('should generate tokens of consistent length', () => {
      const token1 = generateResetToken();
      const token2 = generateResetToken();
      expect(token1.length).toBe(token2.length);
    });
  });

  describe('createPasswordResetToken', () => {
    it('should create a reset token for valid user', async () => {
      const result = await createPasswordResetToken(testUserEmail);

      expect(result).not.toBeNull();
      expect(result?.token).toBeDefined();
      expect(result?.expiresAt).toBeInstanceOf(Date);
      expect(result?.userId).toBe(testUserId);

      // Verify token expiration is approximately 1 hour from now
      const now = new Date();
      const expectedExpiry = new Date(now.getTime() + 60 * 60 * 1000);
      const timeDiff = Math.abs(
        result!.expiresAt.getTime() - expectedExpiry.getTime()
      );
      expect(timeDiff).toBeLessThan(1000); // Within 1 second
    });

    it('should return null for non-existent user', async () => {
      const result = await createPasswordResetToken('nonexistent@example.com');
      expect(result).toBeNull();
    });

    it('should handle email case insensitivity', async () => {
      const result = await createPasswordResetToken(
        testUserEmail.toUpperCase()
      );
      expect(result).not.toBeNull();
      expect(result?.userId).toBe(testUserId);
    });

    it('should store token in database', async () => {
      const result = await createPasswordResetToken(testUserEmail);
      expect(result).not.toBeNull();

      // Verify token exists in database
      const dbResult = await pool.query(
        'SELECT * FROM password_reset_tokens WHERE token = $1',
        [result!.token]
      );

      expect(dbResult.rows.length).toBe(1);
      expect(dbResult.rows[0].user_id).toBe(testUserId);
      expect(dbResult.rows[0].used).toBe(false);
    });

    it('should not return token for soft-deleted users', async () => {
      // Soft delete the user
      await pool.query('UPDATE users SET deleted_at = NOW() WHERE id = $1', [
        testUserId,
      ]);

      const result = await createPasswordResetToken(testUserEmail);
      expect(result).toBeNull();

      // Restore user for cleanup
      await pool.query('UPDATE users SET deleted_at = NULL WHERE id = $1', [
        testUserId,
      ]);
    });

    it('should allow multiple tokens for same user', async () => {
      const result1 = await createPasswordResetToken(testUserEmail);
      const result2 = await createPasswordResetToken(testUserEmail);

      expect(result1).not.toBeNull();
      expect(result2).not.toBeNull();
      expect(result1!.token).not.toBe(result2!.token);
    });
  });

  describe('verifyResetToken', () => {
    it('should verify valid token', async () => {
      const created = await createPasswordResetToken(testUserEmail);
      expect(created).not.toBeNull();

      const verification = await verifyResetToken(created!.token);

      expect(verification.valid).toBe(true);
      expect(verification.userId).toBe(testUserId);
      expect(verification.error).toBeUndefined();
    });

    it('should reject non-existent token', async () => {
      const verification = await verifyResetToken('invalid-token-12345');

      expect(verification.valid).toBe(false);
      expect(verification.error).toBe('Invalid reset token');
      expect(verification.userId).toBeUndefined();
    });

    it('should reject used token', async () => {
      const created = await createPasswordResetToken(testUserEmail);
      expect(created).not.toBeNull();

      // Mark token as used
      await markTokenAsUsed(created!.token);

      const verification = await verifyResetToken(created!.token);

      expect(verification.valid).toBe(false);
      expect(verification.error).toBe('Reset token has already been used');
    });

    it('should reject expired token', async () => {
      const created = await createPasswordResetToken(testUserEmail);
      expect(created).not.toBeNull();

      // Manually expire the token by setting expires_at to the past
      await pool.query(
        `UPDATE password_reset_tokens
         SET expires_at = NOW() - INTERVAL '1 hour'
         WHERE token = $1`,
        [created!.token]
      );

      const verification = await verifyResetToken(created!.token);

      expect(verification.valid).toBe(false);
      expect(verification.error).toBe('Reset token has expired');
    });

    it('should accept token just before expiration', async () => {
      const created = await createPasswordResetToken(testUserEmail);
      expect(created).not.toBeNull();

      // Set token to expire in 1 second
      await pool.query(
        `UPDATE password_reset_tokens
         SET expires_at = NOW() + INTERVAL '1 second'
         WHERE token = $1`,
        [created!.token]
      );

      const verification = await verifyResetToken(created!.token);

      expect(verification.valid).toBe(true);
      expect(verification.userId).toBe(testUserId);
    });
  });

  describe('markTokenAsUsed', () => {
    it('should mark valid token as used', async () => {
      const created = await createPasswordResetToken(testUserEmail);
      expect(created).not.toBeNull();

      const result = await markTokenAsUsed(created!.token);
      expect(result).toBe(true);

      // Verify in database
      const dbResult = await pool.query(
        'SELECT used, used_at FROM password_reset_tokens WHERE token = $1',
        [created!.token]
      );

      expect(dbResult.rows[0].used).toBe(true);
      expect(dbResult.rows[0].used_at).not.toBeNull();
    });

    it('should return false for non-existent token', async () => {
      const result = await markTokenAsUsed('non-existent-token');
      expect(result).toBe(false);
    });

    it('should return false when marking already used token', async () => {
      const created = await createPasswordResetToken(testUserEmail);
      expect(created).not.toBeNull();

      // Mark once
      const result1 = await markTokenAsUsed(created!.token);
      expect(result1).toBe(true);

      // Try to mark again
      const result2 = await markTokenAsUsed(created!.token);
      expect(result2).toBe(false);
    });

    it('should set used_at timestamp', async () => {
      const created = await createPasswordResetToken(testUserEmail);
      expect(created).not.toBeNull();

      await markTokenAsUsed(created!.token);

      const dbResult = await pool.query(
        'SELECT used_at FROM password_reset_tokens WHERE token = $1',
        [created!.token]
      );

      const usedAt = new Date(dbResult.rows[0].used_at);
      const now = new Date();
      const timeDiff = Math.abs(usedAt.getTime() - now.getTime());
      expect(timeDiff).toBeLessThan(2000); // Within 2 seconds
    });
  });

  describe('cleanupExpiredTokens', () => {
    it('should delete tokens older than 24 hours', async () => {
      // Create a token
      const created = await createPasswordResetToken(testUserEmail);
      expect(created).not.toBeNull();

      // Manually set created_at to 25 hours ago
      await pool.query(
        `UPDATE password_reset_tokens
         SET created_at = NOW() - INTERVAL '25 hours'
         WHERE token = $1`,
        [created!.token]
      );

      const deletedCount = await cleanupExpiredTokens();
      expect(deletedCount).toBeGreaterThanOrEqual(1);

      // Verify token is deleted
      const dbResult = await pool.query(
        'SELECT * FROM password_reset_tokens WHERE token = $1',
        [created!.token]
      );
      expect(dbResult.rows.length).toBe(0);
    });

    it('should not delete recent tokens', async () => {
      const created = await createPasswordResetToken(testUserEmail);
      expect(created).not.toBeNull();

      const deletedCount = await cleanupExpiredTokens();

      // Verify token still exists
      const dbResult = await pool.query(
        'SELECT * FROM password_reset_tokens WHERE token = $1',
        [created!.token]
      );
      expect(dbResult.rows.length).toBe(1);
    });

    it('should return count of deleted tokens', async () => {
      // Create multiple old tokens
      const token1 = await createPasswordResetToken(testUserEmail);
      const token2 = await createPasswordResetToken(testUserEmail);

      expect(token1).not.toBeNull();
      expect(token2).not.toBeNull();

      // Make them old
      await pool.query(
        `UPDATE password_reset_tokens
         SET created_at = NOW() - INTERVAL '25 hours'
         WHERE user_id = $1`,
        [testUserId]
      );

      const deletedCount = await cleanupExpiredTokens();
      expect(deletedCount).toBeGreaterThanOrEqual(2);
    });

    it('should return 0 when no tokens to delete', async () => {
      // Ensure no old tokens exist
      await pool.query(
        `DELETE FROM password_reset_tokens
         WHERE created_at < NOW() - INTERVAL '24 hours'`
      );

      const deletedCount = await cleanupExpiredTokens();
      expect(deletedCount).toBe(0);
    });
  });

  describe('invalidateUserTokens', () => {
    it('should invalidate all unused tokens for user', async () => {
      // Create multiple tokens
      const token1 = await createPasswordResetToken(testUserEmail);
      const token2 = await createPasswordResetToken(testUserEmail);

      expect(token1).not.toBeNull();
      expect(token2).not.toBeNull();

      const invalidatedCount = await invalidateUserTokens(testUserId);
      expect(invalidatedCount).toBe(2);

      // Verify both tokens are marked as used
      const dbResult = await pool.query(
        'SELECT used FROM password_reset_tokens WHERE user_id = $1',
        [testUserId]
      );

      dbResult.rows.forEach((row) => {
        expect(row.used).toBe(true);
      });
    });

    it('should not count already used tokens', async () => {
      const token1 = await createPasswordResetToken(testUserEmail);
      const token2 = await createPasswordResetToken(testUserEmail);

      expect(token1).not.toBeNull();
      expect(token2).not.toBeNull();

      // Mark one as used
      await markTokenAsUsed(token1!.token);

      // Invalidate should only affect the unused one
      const invalidatedCount = await invalidateUserTokens(testUserId);
      expect(invalidatedCount).toBe(1);
    });

    it('should return 0 for user with no tokens', async () => {
      // Create a new user with no tokens
      const newUserResult = await pool.query(
        `INSERT INTO users (email, password_hash, name)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [`newuser-${Date.now()}@example.com`, 'hashed', 'New User']
      );
      const newUserId = newUserResult.rows[0].id;

      const invalidatedCount = await invalidateUserTokens(newUserId);
      expect(invalidatedCount).toBe(0);

      // Cleanup
      await pool.query('DELETE FROM users WHERE id = $1', [newUserId]);
    });

    it('should set used_at timestamp when invalidating', async () => {
      const token = await createPasswordResetToken(testUserEmail);
      expect(token).not.toBeNull();

      await invalidateUserTokens(testUserId);

      const dbResult = await pool.query(
        'SELECT used_at FROM password_reset_tokens WHERE user_id = $1',
        [testUserId]
      );

      expect(dbResult.rows[0].used_at).not.toBeNull();
      const usedAt = new Date(dbResult.rows[0].used_at);
      const now = new Date();
      const timeDiff = Math.abs(usedAt.getTime() - now.getTime());
      expect(timeDiff).toBeLessThan(2000);
    });
  });

  describe('hasRecentResetRequest', () => {
    it('should return true for recent request within threshold', async () => {
      await createPasswordResetToken(testUserEmail);

      const hasRecent = await hasRecentResetRequest(testUserEmail, 5);
      expect(hasRecent).toBe(true);
    });

    it('should return false for request outside threshold', async () => {
      const token = await createPasswordResetToken(testUserEmail);
      expect(token).not.toBeNull();

      // Set created_at to 10 minutes ago
      await pool.query(
        `UPDATE password_reset_tokens
         SET created_at = NOW() - INTERVAL '10 minutes'
         WHERE token = $1`,
        [token!.token]
      );

      const hasRecent = await hasRecentResetRequest(testUserEmail, 5);
      expect(hasRecent).toBe(false);
    });

    it('should return false for user with no requests', async () => {
      const hasRecent = await hasRecentResetRequest(
        'nonexistent@example.com',
        5
      );
      expect(hasRecent).toBe(false);
    });

    it('should handle email case insensitivity', async () => {
      await createPasswordResetToken(testUserEmail);

      const hasRecent = await hasRecentResetRequest(
        testUserEmail.toUpperCase(),
        5
      );
      expect(hasRecent).toBe(true);
    });

    it('should use default threshold of 5 minutes', async () => {
      await createPasswordResetToken(testUserEmail);

      const hasRecent = await hasRecentResetRequest(testUserEmail);
      expect(hasRecent).toBe(true);
    });

    it('should count multiple recent requests', async () => {
      await createPasswordResetToken(testUserEmail);
      await createPasswordResetToken(testUserEmail);

      const hasRecent = await hasRecentResetRequest(testUserEmail, 5);
      expect(hasRecent).toBe(true);
    });

    it('should use custom threshold correctly', async () => {
      const token = await createPasswordResetToken(testUserEmail);
      expect(token).not.toBeNull();

      // Set to 8 minutes ago
      await pool.query(
        `UPDATE password_reset_tokens
         SET created_at = NOW() - INTERVAL '8 minutes'
         WHERE token = $1`,
        [token!.token]
      );

      // Should be outside 5 minute threshold
      const hasRecent5 = await hasRecentResetRequest(testUserEmail, 5);
      expect(hasRecent5).toBe(false);

      // Should be within 10 minute threshold
      const hasRecent10 = await hasRecentResetRequest(testUserEmail, 10);
      expect(hasRecent10).toBe(true);
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete password reset flow', async () => {
      // 1. Create token
      const created = await createPasswordResetToken(testUserEmail);
      expect(created).not.toBeNull();

      // 2. Verify token is valid
      const verification1 = await verifyResetToken(created!.token);
      expect(verification1.valid).toBe(true);

      // 3. Mark as used after password reset
      const marked = await markTokenAsUsed(created!.token);
      expect(marked).toBe(true);

      // 4. Verify token is no longer valid
      const verification2 = await verifyResetToken(created!.token);
      expect(verification2.valid).toBe(false);
      expect(verification2.error).toBe('Reset token has already been used');
    });

    it('should handle rate limiting scenario', async () => {
      // 1. Check no recent requests
      const hasRecent1 = await hasRecentResetRequest(testUserEmail);
      expect(hasRecent1).toBe(false);

      // 2. Create first request
      await createPasswordResetToken(testUserEmail);

      // 3. Check has recent request
      const hasRecent2 = await hasRecentResetRequest(testUserEmail);
      expect(hasRecent2).toBe(true);
    });

    it('should handle token invalidation on new request', async () => {
      // 1. Create first token
      const token1 = await createPasswordResetToken(testUserEmail);
      expect(token1).not.toBeNull();

      // 2. User requests another token (invalidate old ones)
      await invalidateUserTokens(testUserId);

      // 3. Create new token
      const token2 = await createPasswordResetToken(testUserEmail);
      expect(token2).not.toBeNull();

      // 4. Old token should be invalid
      const verification1 = await verifyResetToken(token1!.token);
      expect(verification1.valid).toBe(false);

      // 5. New token should be valid
      const verification2 = await verifyResetToken(token2!.token);
      expect(verification2.valid).toBe(true);
    });

    it('should handle cleanup of old tokens', async () => {
      // 1. Create tokens
      const token1 = await createPasswordResetToken(testUserEmail);
      const token2 = await createPasswordResetToken(testUserEmail);

      expect(token1).not.toBeNull();
      expect(token2).not.toBeNull();

      // 2. Age the tokens
      await pool.query(
        `UPDATE password_reset_tokens
         SET created_at = NOW() - INTERVAL '25 hours'
         WHERE user_id = $1`,
        [testUserId]
      );

      // 3. Run cleanup
      const deleted = await cleanupExpiredTokens();
      expect(deleted).toBeGreaterThanOrEqual(2);

      // 4. Tokens should be gone
      const dbResult = await pool.query(
        'SELECT * FROM password_reset_tokens WHERE user_id = $1',
        [testUserId]
      );
      expect(dbResult.rows.length).toBe(0);
    });
  });
});
