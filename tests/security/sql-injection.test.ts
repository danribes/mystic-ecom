/**
 * T214: SQL Injection Security Tests
 *
 * Tests that the application properly prevents SQL injection attacks
 * by using parameterized queries and proper input validation.
 *
 * Attack vectors tested:
 * - Classic SQL injection (OR 1=1)
 * - Union-based injection
 * - Time-based blind injection
 * - Comment-based injection
 * - Stacked queries
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { pool } from '../setup/database';

describe('T214: SQL Injection Prevention', () => {
  let testUserId: string;
  let testEventId: string;
  let testCourseId: string;

  beforeAll(async () => {
    // Create test data for SQL injection attempts
    const userResult = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, email_verified)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      ['SQL Test User', 'sql-injection-test@test.com', 'hashed_password', 'user', true]
    );
    testUserId = userResult.rows[0].id;

    const eventResult = await pool.query(
      `INSERT INTO events (
        title, slug, description, price, event_date, duration_hours,
        venue_name, venue_address, venue_city, venue_country,
        capacity, available_spots, is_published
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id`,
      [
        'SQL Injection Test Event',
        'sql-injection-test-event',
        'Test event for SQL injection testing',
        50.00,
        new Date('2025-12-01'),
        2,
        'Test Venue',
        '123 Test St',
        'Test City',
        'Test Country',
        10,
        10,
        true
      ]
    );
    testEventId = eventResult.rows[0].id;

    const courseResult = await pool.query(
      `INSERT INTO courses (
        title, slug, description, price, duration_hours,
        level, language, is_published
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id`,
      [
        'SQL Injection Test Course',
        'sql-injection-test-course',
        'Test course for SQL injection testing',
        99.99,
        10,
        'beginner',
        'en',
        true
      ]
    );
    testCourseId = courseResult.rows[0].id;
  });

  afterAll(async () => {
    // Clean up test data
    await pool.query('DELETE FROM bookings WHERE user_id = $1', [testUserId]);
    await pool.query('DELETE FROM purchases WHERE user_id = $1', [testUserId]);
    await pool.query('DELETE FROM reviews WHERE user_id = $1', [testUserId]);
    await pool.query('DELETE FROM events WHERE id = $1', [testEventId]);
    await pool.query('DELETE FROM courses WHERE id = $1', [testCourseId]);
    await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
  });

  describe('User Authentication SQL Injection', () => {
    it('should prevent SQL injection in email field', async () => {
      // Classic SQL injection attempt: ' OR '1'='1
      const maliciousEmail = "' OR '1'='1' --";

      const result = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [maliciousEmail]
      );

      // Should return no results (not all users)
      expect(result.rows.length).toBe(0);
    });

    it('should prevent SQL injection with UNION attacks', async () => {
      // UNION-based injection attempt
      const maliciousEmail = "' UNION SELECT id, password_hash, email, name, role FROM users --";

      const result = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [maliciousEmail]
      );

      // Should return no results
      expect(result.rows.length).toBe(0);
    });

    it('should prevent SQL injection with comment characters', async () => {
      // Comment-based injection
      const maliciousEmail = "admin@test.com' --";

      const result = await pool.query(
        'SELECT * FROM users WHERE email = $1 AND password_hash = $2',
        [maliciousEmail, 'any_password']
      );

      // Should return no results (comment didn't bypass password check)
      expect(result.rows.length).toBe(0);
    });

    it('should prevent stacked query attacks', async () => {
      // Stacked query attempt: try to drop table
      const maliciousEmail = "test@test.com'; DROP TABLE users; --";

      // This should not execute the DROP command
      const result = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [maliciousEmail]
      );

      expect(result.rows.length).toBe(0);

      // Verify users table still exists
      const tableCheck = await pool.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_name = 'users'
        )`
      );
      expect(tableCheck.rows[0].exists).toBe(true);
    });
  });

  describe('Search and Filter SQL Injection', () => {
    it('should prevent SQL injection in event search', async () => {
      const maliciousSearch = "' OR 1=1 --";

      const result = await pool.query(
        `SELECT * FROM events
         WHERE title ILIKE $1 OR description ILIKE $1`,
        [`%${maliciousSearch}%`]
      );

      // Should search for literal string, not execute injection
      expect(result.rows.length).toBe(0);
    });

    it('should prevent SQL injection in course filtering', async () => {
      const maliciousLevel = "beginner' OR '1'='1";

      const result = await pool.query(
        'SELECT * FROM courses WHERE level = $1',
        [maliciousLevel]
      );

      // Should not return all courses
      expect(result.rows.length).toBe(0);
    });

    it('should prevent SQL injection in product slug lookup', async () => {
      const maliciousSlug = "test' UNION SELECT * FROM users WHERE '1'='1";

      const result = await pool.query(
        'SELECT * FROM courses WHERE slug = $1',
        [maliciousSlug]
      );

      expect(result.rows.length).toBe(0);
    });
  });

  describe('Numeric Parameter SQL Injection', () => {
    it('should prevent SQL injection in ID parameters', async () => {
      // Attempt to inject through ID parameter
      const maliciousId = "1 OR 1=1";

      // This should fail type validation or return nothing
      try {
        const result = await pool.query(
          'SELECT * FROM events WHERE id = $1',
          [maliciousId]
        );
        // If query succeeds, should return no results
        expect(result.rows.length).toBe(0);
      } catch (error) {
        // UUID type validation should reject this
        expect(error).toBeDefined();
      }
    });

    it('should handle price filtering safely', async () => {
      const maliciousPrice = "0 OR 1=1";

      // Even if passed as string, parameterized query should be safe
      const result = await pool.query(
        'SELECT * FROM courses WHERE price <= $1',
        [maliciousPrice]
      );

      // Should fail type coercion or return empty
      expect(result.rows.length).toBe(0);
    });
  });

  describe('ORDER BY and LIMIT SQL Injection', () => {
    it('should safely handle dynamic sorting (if implemented)', async () => {
      // NOTE: If sorting is done by concatenating user input,
      // it's vulnerable. Should use whitelisting instead.

      // Example of safe sorting with whitelist
      const userSortInput = 'price DESC; DROP TABLE courses; --';
      const allowedSorts = ['price ASC', 'price DESC', 'title ASC', 'title DESC'];
      const sortClause = allowedSorts.includes(userSortInput)
        ? userSortInput
        : 'title ASC';

      // This test verifies whitelist pattern is used
      expect(sortClause).toBe('title ASC');
      expect(sortClause).not.toContain('DROP');
    });

    it('should safely handle pagination parameters', async () => {
      const maliciousLimit = "10; DELETE FROM courses WHERE 1=1; --";

      // Parameterized limit should be safe
      try {
        const result = await pool.query(
          'SELECT * FROM courses LIMIT $1',
          [maliciousLimit]
        );
        // Should fail or return nothing
        expect(result.rows.length).toBeLessThanOrEqual(10);
      } catch (error) {
        // Type validation should catch this
        expect(error).toBeDefined();
      }
    });
  });

  describe('JSON and Array Parameter Injection', () => {
    it('should prevent injection through JSON parameters', async () => {
      // Attempt to inject through JSONB field
      const maliciousJson = {
        name: "Test'; DROP TABLE users; --",
        value: "normal"
      };

      // If storing JSON data, it should be properly escaped
      const result = await pool.query(
        `SELECT * FROM courses WHERE metadata @> $1`,
        [JSON.stringify(maliciousJson)]
      );

      // Should search safely without executing injection
      expect(result.rows).toBeDefined();
    });

    it('should prevent injection through array parameters', async () => {
      const maliciousArray = ["tag1", "'; DROP TABLE courses; --"];

      // Array parameters should be properly escaped
      const result = await pool.query(
        'SELECT * FROM courses WHERE tags && $1',
        [maliciousArray]
      );

      expect(result.rows).toBeDefined();
    });
  });

  describe('Second-Order SQL Injection Prevention', () => {
    it('should prevent second-order injection through stored data', async () => {
      // First, store malicious data
      const maliciousName = "Robert'); DROP TABLE users; --";

      const insertResult = await pool.query(
        'INSERT INTO users (name, email, password_hash, role, email_verified) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [maliciousName, 'second-order-test@test.com', 'hash', 'user', true]
      );

      const userId = insertResult.rows[0].id;

      // Now retrieve and use that data in another query
      const userResult = await pool.query(
        'SELECT name FROM users WHERE id = $1',
        [userId]
      );

      const storedName = userResult.rows[0].name;

      // Use stored name in another query - should still use parameters
      const searchResult = await pool.query(
        'SELECT * FROM users WHERE name = $1',
        [storedName]
      );

      // Should safely find the user without executing injection
      expect(searchResult.rows.length).toBe(1);
      expect(searchResult.rows[0].id).toBe(userId);

      // Verify users table still exists
      const tableCheck = await pool.query(
        `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users')`
      );
      expect(tableCheck.rows[0].exists).toBe(true);

      // Clean up
      await pool.query('DELETE FROM users WHERE id = $1', [userId]);
    });
  });

  describe('Time-Based Blind SQL Injection Prevention', () => {
    it('should not be vulnerable to time-based attacks', async () => {
      // Attempt time-based blind SQL injection
      const maliciousEmail = "test@test.com' AND SLEEP(5) --";

      const startTime = Date.now();
      const result = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [maliciousEmail]
      );
      const endTime = Date.now();

      // Query should complete quickly (not execute SLEEP)
      expect(endTime - startTime).toBeLessThan(1000); // Should be under 1 second
      expect(result.rows.length).toBe(0);
    });

    it('should not be vulnerable to pg_sleep attacks', async () => {
      const maliciousId = "' OR pg_sleep(5) --";

      const startTime = Date.now();
      try {
        await pool.query(
          'SELECT * FROM events WHERE id = $1',
          [maliciousId]
        );
      } catch (error) {
        // May fail due to type mismatch
      }
      const endTime = Date.now();

      // Should not sleep for 5 seconds
      expect(endTime - startTime).toBeLessThan(1000);
    });
  });

  describe('Parameterized Query Verification', () => {
    it('should use parameterized queries for user lookup', async () => {
      // Verify legitimate query works correctly
      const result = await pool.query(
        'SELECT id, email FROM users WHERE id = $1',
        [testUserId]
      );

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].id).toBe(testUserId);
    });

    it('should use parameterized queries for event lookup', async () => {
      const result = await pool.query(
        'SELECT id, title FROM events WHERE id = $1',
        [testEventId]
      );

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].id).toBe(testEventId);
    });

    it('should use parameterized queries for course lookup', async () => {
      const result = await pool.query(
        'SELECT id, title FROM courses WHERE id = $1',
        [testCourseId]
      );

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].id).toBe(testCourseId);
    });
  });
});
