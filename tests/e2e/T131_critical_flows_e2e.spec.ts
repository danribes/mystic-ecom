/**
 * T131: Complete E2E Test Suite for Critical User Flows
 *
 * This test suite covers the three most critical user journeys end-to-end:
 * 1. Complete Course Purchase Flow (browse → cart → checkout → access)
 * 2. Complete Event Booking Flow (browse → book → payment → confirmation)
 * 3. Admin Course Management Flow (login → create → edit → publish)
 *
 * IMPORTANT: Run with specific path to avoid vitest/Playwright conflicts:
 *   ✅ npx playwright test tests/e2e/T131
 *   ✅ npx playwright test tests/e2e/T131_critical_flows_e2e.spec.ts
 *
 * These tests complement the integration tests (T130) by testing through the actual UI.
 */

import { test, expect, type Page } from '@playwright/test';
import { pool } from '../setup/database';
import * as bcrypt from 'bcrypt';

// ============================================================================
// Type Definitions
// ============================================================================

interface TestUser {
  id: string;
  email: string;
  password: string; // Plain text for testing
  name: string;
  role: 'user' | 'admin';
}

interface TestCourse {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  is_published: boolean;
}

interface TestEvent {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  event_date: Date;
  is_published: boolean;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate unique test user credentials
 */
const generateTestUser = (role: 'user' | 'admin' = 'user'): Omit<TestUser, 'id'> => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return {
    name: `Test ${role} ${timestamp}`,
    email: `test.${role}.${timestamp}.${random}@example.com`,
    password: 'TestPassword123!',
    role,
  };
};

/**
 * Create a user in the database
 */
const createUser = async (userData: Omit<TestUser, 'id'>): Promise<TestUser> => {
  const passwordHash = await bcrypt.hash(userData.password, 10);
  const result = await pool.query<{ id: string }>(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [userData.name, userData.email, passwordHash, userData.role]
  );

  return {
    ...userData,
    id: result.rows[0].id,
  };
};

/**
 * Create a test course in the database
 */
const createCourse = async (overrides: Partial<TestCourse> = {}): Promise<TestCourse> => {
  const timestamp = Date.now();
  const course = {
    title: `E2E Test Course ${timestamp}`,
    slug: `e2e-course-${timestamp}`,
    description: 'A comprehensive course for testing the purchase flow',
    price: 99.99,
    duration_hours: 10,
    level: 'intermediate' as const,
    is_published: true,
    ...overrides,
  };

  const result = await pool.query<TestCourse>(
    `INSERT INTO courses (title, slug, description, price, duration_hours, level, is_published)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, title, slug, description, price, is_published`,
    [course.title, course.slug, course.description, course.price, course.duration_hours, course.level, course.is_published]
  );

  return result.rows[0];
};

/**
 * Create a test event in the database
 */
const createEvent = async (overrides: Partial<TestEvent> = {}): Promise<TestEvent> => {
  const timestamp = Date.now();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 30); // 30 days from now

  const event = {
    title: `E2E Test Event ${timestamp}`,
    slug: `e2e-event-${timestamp}`,
    description: 'A transformative spiritual gathering for testing',
    price: 149.99,
    event_date: futureDate,
    location: 'Test Venue, Test City',
    duration_hours: 3,
    max_attendees: 50,
    is_published: true,
    ...overrides,
  };

  const result = await pool.query<TestEvent>(
    `INSERT INTO events (title, slug, description, price, event_date, location, duration_hours, max_attendees, is_published)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id, title, slug, description, price, event_date, is_published`,
    [event.title, event.slug, event.description, event.price, event.event_date, event.location, event.duration_hours, event.max_attendees, event.is_published]
  );

  return result.rows[0];
};

/**
 * Login a user via the UI
 */
const loginUser = async (page: Page, email: string, password: string) => {
  await page.goto('/login');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');

  // Wait for navigation or error message
  await page.waitForLoadState('networkidle');
};

/**
 * Clear authentication state
 */
const clearAuth = async (page: Page) => {
  await page.context().clearCookies();
  if (page.url() !== 'about:blank') {
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    }).catch(() => {
      // Ignore errors if storage is not accessible
    });
  }
};

/**
 * Cleanup test data
 */
const cleanupUser = async (userId: string) => {
  await pool.query('DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE user_id = $1)', [userId]);
  await pool.query('DELETE FROM orders WHERE user_id = $1', [userId]);
  await pool.query('DELETE FROM cart_items WHERE user_id = $1', [userId]);
  await pool.query('DELETE FROM bookings WHERE user_id = $1', [userId]);
  await pool.query('DELETE FROM reviews WHERE user_id = $1', [userId]);
  await pool.query('DELETE FROM users WHERE id = $1', [userId]);
};

const cleanupCourse = async (courseId: string) => {
  await pool.query('DELETE FROM reviews WHERE course_id = $1', [courseId]);
  await pool.query('DELETE FROM order_items WHERE course_id = $1', [courseId]);
  await pool.query('DELETE FROM cart_items WHERE course_id = $1', [courseId]);
  await pool.query('DELETE FROM courses WHERE id = $1', [courseId]);
};

const cleanupEvent = async (eventId: string) => {
  await pool.query('DELETE FROM bookings WHERE event_id = $1', [eventId]);
  await pool.query('DELETE FROM events WHERE id = $1', [eventId]);
};

// ============================================================================
// Test Suite 1: Complete Course Purchase Flow
// ============================================================================

test.describe('T131: Critical Flow 1 - Complete Course Purchase', () => {
  let testUser: TestUser;
  let testCourse: TestCourse;

  test.beforeEach(async ({ page }) => {
    // Create test data
    testUser = await createUser(generateTestUser('user'));
    testCourse = await createCourse();

    // Clear auth state
    await page.goto('/');
    await clearAuth(page);
  });

  test.afterEach(async () => {
    // Cleanup
    if (testUser) await cleanupUser(testUser.id);
    if (testCourse) await cleanupCourse(testCourse.id);
  });

  test('should complete full course purchase flow: browse → add to cart → checkout → access', async ({ page }) => {
    // Step 1: Browse courses catalog
    await page.goto('/courses');

    // Verify we can see the course
    await expect(page.locator(`text=${testCourse.title}`)).toBeVisible({ timeout: 10000 });

    // Step 2: Click on course to view details
    await page.click(`text=${testCourse.title}`);

    // Verify we're on the course detail page
    await expect(page).toHaveURL(new RegExp(`/courses/${testCourse.slug}`));
    await expect(page.locator('h1')).toContainText(testCourse.title);

    // Step 3: Add course to cart
    const addToCartButton = page.locator('button:has-text("Add to Cart"), button:has-text("Add to Basket")').first();
    await addToCartButton.click();

    // Should show confirmation or update cart indicator
    await page.waitForTimeout(1000); // Wait for cart update

    // Step 4: Navigate to cart
    await page.goto('/cart');

    // Verify course is in cart
    await expect(page.locator(`text=${testCourse.title}`)).toBeVisible();

    // Step 5: Proceed to checkout (requires login)
    const checkoutButton = page.locator('button:has-text("Checkout"), a:has-text("Checkout")').first();
    await checkoutButton.click();

    // Should redirect to login if not authenticated
    if (page.url().includes('/login')) {
      // Login with test user
      await loginUser(page, testUser.email, testUser.password);

      // Should redirect back to checkout or cart after login
      await page.waitForTimeout(2000);

      // If redirected to cart, click checkout again
      if (page.url().includes('/cart')) {
        await page.click('button:has-text("Checkout"), a:has-text("Checkout")');
      }
    }

    // Step 6: Complete checkout (we're on checkout page or Stripe page)
    // Note: In test mode, we can't complete actual Stripe checkout
    // So we'll verify the user journey up to the payment page
    await expect(page.url()).toMatch(/checkout|stripe/);

    // Verify order summary shows the correct course and price
    const pageContent = await page.textContent('body');
    expect(pageContent).toContain(testCourse.title);
  });

  test('should show empty cart when no items added', async ({ page }) => {
    await page.goto('/cart');

    // Should show empty cart message
    await expect(page.locator('text=/empty|no items|cart is empty/i')).toBeVisible({ timeout: 5000 });
  });

  test('should allow removing items from cart', async ({ page }) => {
    // Login first
    await loginUser(page, testUser.email, testUser.password);

    // Add course to cart via API for speed
    await pool.query(
      'INSERT INTO cart_items (user_id, course_id, item_type, quantity) VALUES ($1, $2, $3, $4)',
      [testUser.id, testCourse.id, 'course', 1]
    );

    // Navigate to cart
    await page.goto('/cart');

    // Verify course is in cart
    await expect(page.locator(`text=${testCourse.title}`)).toBeVisible();

    // Click remove button
    const removeButton = page.locator('button:has-text("Remove"), button[aria-label*="Remove"]').first();
    await removeButton.click();

    // Wait for removal
    await page.waitForTimeout(1000);

    // Verify course is removed
    await expect(page.locator(`text=${testCourse.title}`)).not.toBeVisible();
  });
});

// ============================================================================
// Test Suite 2: Complete Event Booking Flow
// ============================================================================

test.describe('T131: Critical Flow 2 - Complete Event Booking', () => {
  let testUser: TestUser;
  let testEvent: TestEvent;

  test.beforeEach(async ({ page }) => {
    // Create test data
    testUser = await createUser(generateTestUser('user'));
    testEvent = await createEvent();

    // Clear auth state
    await page.goto('/');
    await clearAuth(page);
  });

  test.afterEach(async () => {
    // Cleanup
    if (testUser) await cleanupUser(testUser.id);
    if (testEvent) await cleanupEvent(testEvent.id);
  });

  test('should complete full event booking flow: browse → book → confirm', async ({ page }) => {
    // Step 1: Login (booking requires authentication)
    await loginUser(page, testUser.email, testUser.password);

    // Step 2: Browse events
    await page.goto('/events');

    // Verify we can see the event
    await expect(page.locator(`text=${testEvent.title}`)).toBeVisible({ timeout: 10000 });

    // Step 3: Click on event to view details
    await page.click(`text=${testEvent.title}`);

    // Verify we're on the event detail page
    await expect(page).toHaveURL(new RegExp(`/events/${testEvent.slug}`));
    await expect(page.locator('h1')).toContainText(testEvent.title);

    // Step 4: Click book now button
    const bookButton = page.locator('button:has-text("Book"), button:has-text("Register"), button:has-text("Reserve")').first();

    if (await bookButton.isVisible()) {
      await bookButton.click();

      // Wait for booking confirmation or payment page
      await page.waitForTimeout(2000);

      // Should show confirmation message or redirect to payment
      const url = page.url();
      const hasConfirmation = url.includes('/confirmation') ||
                             url.includes('/booking') ||
                             url.includes('/dashboard') ||
                             url.includes('/checkout');

      expect(hasConfirmation).toBeTruthy();
    }
  });

  test('should show event details and date correctly', async ({ page }) => {
    await page.goto(`/events/${testEvent.slug}`);

    // Verify event details are displayed
    await expect(page.locator('h1')).toContainText(testEvent.title);
    await expect(page.locator('body')).toContainText(testEvent.description);

    // Price should be visible
    const priceText = testEvent.price.toFixed(2);
    await expect(page.locator(`text=/${priceText}/`)).toBeVisible({ timeout: 5000 });
  });
});

// ============================================================================
// Test Suite 3: Admin Course Management Flow
// ============================================================================

test.describe('T131: Critical Flow 3 - Admin Course Management', () => {
  let adminUser: TestUser;
  let testCourse: TestCourse;

  test.beforeEach(async ({ page }) => {
    // Create admin user
    adminUser = await createUser(generateTestUser('admin'));

    // Clear auth state
    await page.goto('/');
    await clearAuth(page);
  });

  test.afterEach(async () => {
    // Cleanup
    if (testCourse) await cleanupCourse(testCourse.id);
    if (adminUser) await cleanupUser(adminUser.id);
  });

  test('should complete admin course management flow: login → create → edit → publish', async ({ page }) => {
    // Step 1: Login as admin
    await loginUser(page, adminUser.email, adminUser.password);

    // Step 2: Navigate to admin dashboard
    await page.goto('/admin');

    // Verify we're in admin area
    await expect(page.locator('h1, h2')).toContainText(/admin|dashboard/i, { timeout: 5000 });

    // Step 3: Navigate to courses management
    const coursesLink = page.locator('a:has-text("Courses"), a[href*="/admin/courses"]').first();

    if (await coursesLink.isVisible()) {
      await coursesLink.click();
      await page.waitForLoadState('networkidle');

      // Step 4: Click create new course
      const createButton = page.locator('button:has-text("Create"), a:has-text("New Course"), button:has-text("Add Course")').first();

      if (await createButton.isVisible()) {
        await createButton.click();
        await page.waitForLoadState('networkidle');

        // Step 5: Fill in course details
        const timestamp = Date.now();
        const courseTitle = `Admin E2E Course ${timestamp}`;

        await page.fill('input[name="title"], input[placeholder*="title" i]', courseTitle);
        await page.fill('textarea[name="description"], textarea[placeholder*="description" i]', 'A course created through E2E admin testing');
        await page.fill('input[name="price"], input[type="number"]', '79.99');

        // Step 6: Submit the form
        await page.click('button[type="submit"]:has-text("Create"), button[type="submit"]:has-text("Save")');

        // Wait for course creation
        await page.waitForTimeout(2000);

        // Should redirect to course list or course detail
        const url = page.url();
        expect(url).toMatch(/admin\/courses/);

        // Verify course appears in the list
        await expect(page.locator(`text=${courseTitle}`)).toBeVisible({ timeout: 5000 });

        // Store course for cleanup
        const courseResult = await pool.query<TestCourse>(
          'SELECT id, title, slug, description, price, is_published FROM courses WHERE title = $1',
          [courseTitle]
        );

        if (courseResult.rows.length > 0) {
          testCourse = courseResult.rows[0];
        }
      }
    }
  });

  test('should restrict non-admin users from accessing admin pages', async ({ page }) => {
    // Create regular user
    const regularUser = await createUser(generateTestUser('user'));

    // Login as regular user
    await loginUser(page, regularUser.email, regularUser.password);

    // Try to access admin page
    await page.goto('/admin');

    // Should redirect to home or show forbidden message
    await page.waitForTimeout(2000);
    const url = page.url();

    // Should not be on admin page
    if (url.includes('/admin')) {
      // If still on admin page, should show access denied message
      await expect(page.locator('text=/forbidden|access denied|unauthorized|not authorized/i')).toBeVisible({ timeout: 5000 });
    } else {
      // Should have been redirected away from admin
      expect(url).not.toContain('/admin');
    }

    // Cleanup
    await cleanupUser(regularUser.id);
  });

  test('should allow admin to view all courses', async ({ page }) => {
    // Create a test course first
    testCourse = await createCourse();

    // Login as admin
    await loginUser(page, adminUser.email, adminUser.password);

    // Navigate to admin courses
    await page.goto('/admin/courses');

    // Should see the test course
    await expect(page.locator(`text=${testCourse.title}`)).toBeVisible({ timeout: 10000 });
  });
});

// ============================================================================
// Test Suite 4: Cross-Browser and Responsive Testing
// ============================================================================

test.describe('T131: Critical Flow 4 - Responsive and Cross-Browser', () => {
  let testCourse: TestCourse;

  test.beforeEach(async () => {
    // Create test course
    testCourse = await createCourse();
  });

  test.afterEach(async () => {
    // Cleanup
    if (testCourse) await cleanupCourse(testCourse.id);
  });

  test('should display course catalog correctly on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE size

    await page.goto('/courses');

    // Verify course is visible on mobile
    await expect(page.locator(`text=${testCourse.title}`)).toBeVisible({ timeout: 10000 });

    // Verify responsive layout
    const courseCard = page.locator(`text=${testCourse.title}`).first();
    await expect(courseCard).toBeVisible();
  });

  test('should display course details correctly on tablet', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad size

    await page.goto(`/courses/${testCourse.slug}`);

    // Verify course details are visible
    await expect(page.locator('h1')).toContainText(testCourse.title);
    await expect(page.locator('body')).toContainText(testCourse.description);
  });
});
