# T063: Admin Course Management E2E Test - Learning Guide

**Task:** E2E test for admin course management  
**Difficulty:** Intermediate  
**Topics:** E2E Testing, Playwright, Test Automation  
**Date:** 2025-11-04

---

## What is E2E Testing?

**End-to-End (E2E) Testing** tests the entire application flow from start to finish, simulating real user interactions in a real browser.

**Example:**
```
User Story: Admin creates a course

E2E Test Flow:
1. Open browser
2. Navigate to login page
3. Enter credentials
4. Click login button
5. Navigate to courses page
6. Click "New Course"
7. Fill form
8. Submit
9. Verify course appears
10. Close browser
```

---

## Why E2E Tests?

### Unit Tests vs E2E Tests

**Unit Tests:**
- Test individual functions
- Fast (milliseconds)
- Mock dependencies
- Don't catch integration issues

**E2E Tests:**
- Test complete user flows
- Slow (seconds/minutes)
- Use real browser + database
- Catch integration issues

**Example:**

```typescript
// Unit Test: Tests function in isolation
test('calculateTotal works', () => {
  expect(calculateTotal(10, 2)).toBe(20);
});

// E2E Test: Tests entire checkout flow
test('User can complete purchase', async ({ page }) => {
  await page.goto('/products');
  await page.click('text=Buy Now');
  await page.fill('[name="card"]', '4242424242424242');
  await page.click('text=Pay');
  await expect(page).toHaveURL('/success');
});
```

---

## Playwright Basics

### What is Playwright?

**Playwright** is a browser automation tool that lets you:
- Control browsers (Chrome, Firefox, Safari)
- Click buttons, fill forms, navigate pages
- Take screenshots and videos
- Run tests in parallel

### Basic Playwright Code

```typescript
import { test, expect } from '@playwright/test';

test('basic test', async ({ page }) => {
  // Navigate to page
  await page.goto('https://example.com');
  
  // Click a button
  await page.click('button');
  
  // Fill a form
  await page.fill('input[name="email"]', 'test@example.com');
  
  // Check text appears
  await expect(page.locator('h1')).toContainText('Welcome');
  
  // Verify URL
  await expect(page).toHaveURL('/dashboard');
});
```

---

## Key Concepts

### 1. Page Object

The `page` object represents a browser tab:

```typescript
test('example', async ({ page }) => {
  // page = browser tab
  await page.goto('/login');           // Navigate
  await page.fill('[name="email"]', 'test@example.com'); // Type
  await page.click('button');          // Click
  await page.screenshot({ path: 'screenshot.png' }); // Screenshot
});
```

---

### 2. Selectors

**Ways to find elements:**

```typescript
// By text content
await page.click('text=Login');

// By CSS selector
await page.click('button.submit-btn');

// By data attribute (recommended)
await page.click('[data-testid="login-button"]');

// By name attribute
await page.fill('[name="email"]', 'test@example.com');

// By role
await page.click('role=button[name="Submit"]');
```

**Best Practice:** Use `data-testid` attributes
```html
<button data-testid="submit-button">Submit</button>
```

```typescript
await page.click('[data-testid="submit-button"]');
```

---

### 3. Waiting

**Playwright auto-waits, but you can be explicit:**

```typescript
// Wait for element to be visible
await page.waitForSelector('[data-testid="success-message"]');

// Wait for navigation
await page.waitForURL('/dashboard');

// Wait for timeout
await page.waitForTimeout(1000); // 1 second

// Wait for element to appear/disappear
await expect(page.locator('.loading')).toBeVisible();
await expect(page.locator('.loading')).not.toBeVisible();
```

---

### 4. Assertions

**Checking conditions:**

```typescript
// Element visible
await expect(page.locator('h1')).toBeVisible();

// Text content
await expect(page.locator('h1')).toContainText('Welcome');

// URL
await expect(page).toHaveURL('/dashboard');

// Element count
const count = await page.locator('.item').count();
expect(count).toBeGreaterThan(0);

// Attribute
await expect(page.locator('button')).toHaveAttribute('disabled', '');
```

---

## T063 Test Structure

### Test Organization

```typescript
test.describe('Admin Course Management Flow', () => {
  // Setup before each test
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Clear storage
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  // Individual tests
  test('Admin can login', async ({ page }) => {
    // Test code
  });

  test('Admin can create course', async ({ page }) => {
    // Test code
  });
});
```

---

### Helper Functions

**Reusable login function:**

```typescript
async function loginAsAdmin(page: Page) {
  await page.goto('/login');
  await page.fill('[name="email"]', 'admin@test.com');
  await page.fill('[name="password"]', 'TestAdmin123!');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(1000);
  await expect(page.locator('text=Admin')).toBeVisible();
}

// Use in tests
test('Admin can create course', async ({ page }) => {
  await loginAsAdmin(page); // Reuse
  await page.goto('/admin/courses/new');
  // ... rest of test
});
```

---

## Testing Patterns

### Pattern 1: Arrange-Act-Assert

```typescript
test('User can submit form', async ({ page }) => {
  // ARRANGE: Set up test state
  await loginAsAdmin(page);
  await page.goto('/admin/courses/new');
  
  // ACT: Perform actions
  await page.fill('[name="title"]', 'Test Course');
  await page.fill('[name="price"]', '99.99');
  await page.click('button[type="submit"]');
  
  // ASSERT: Verify results
  await expect(page).toHaveURL('/admin/courses');
  await expect(page.locator('text=Test Course')).toBeVisible();
});
```

---

### Pattern 2: Page Objects

**Organize selectors and actions:**

```typescript
class LoginPage {
  constructor(private page: Page) {}
  
  async login(email: string, password: string) {
    await this.page.fill('[name="email"]', email);
    await this.page.fill('[name="password"]', password);
    await this.page.click('button[type="submit"]');
  }
}

// Use in test
test('Admin can login', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.login('admin@test.com', 'password');
  await expect(page).toHaveURL('/dashboard');
});
```

---

### Pattern 3: Test Data

**Use dynamic data to avoid collisions:**

```typescript
test('Create course', async ({ page }) => {
  // Dynamic title prevents duplicate errors
  const courseTitle = `Test Course ${Date.now()}`;
  
  await page.fill('[name="title"]', courseTitle);
  await page.click('button[type="submit"]');
  
  // Verify with same dynamic data
  await expect(page.locator(`text=${courseTitle}`)).toBeVisible();
});
```

---

## Common Challenges

### Challenge 1: Flaky Tests

**Problem:** Test sometimes passes, sometimes fails

**Causes:**
- Timing issues (element not loaded yet)
- Network delays
- Animations

**Solutions:**
```typescript
// ❌ Bad: Fixed timeout
await page.waitForTimeout(1000);
await page.click('button'); // Might not be ready

// ✅ Good: Wait for specific condition
await page.waitForSelector('button:not([disabled])');
await page.click('button');

// ✅ Better: Playwright auto-waits
await page.click('button'); // Automatically waits for clickable
```

---

### Challenge 2: Slow Tests

**Problem:** E2E tests take minutes to run

**Solutions:**
1. **Run in parallel:**
```bash
npx playwright test --workers=4
```

2. **Only test critical flows:**
Don't E2E test everything - focus on user journeys

3. **Use faster selectors:**
```typescript
// Slow: searches entire DOM
await page.click('.button');

// Fast: specific selector
await page.click('[data-testid="submit-button"]');
```

---

### Challenge 3: Test Data Cleanup

**Problem:** Test data clutters database

**Solutions:**
1. **Mark test data:**
```typescript
const title = `Test Course ${Date.now()}`;
// Easy to find and clean up later
```

2. **Use test database:**
```javascript
// Test uses separate database
DATABASE_URL=postgresql://localhost/test_db
```

3. **Cleanup after tests:**
```typescript
test.afterEach(async () => {
  // Delete test courses
  await db.courses.deleteMany({
    where: { title: { contains: 'Test Course' } }
  });
});
```

---

## Best Practices

### 1. Use data-testid

**HTML:**
```html
<button data-testid="submit-course">Create Course</button>
```

**Test:**
```typescript
await page.click('[data-testid="submit-course"]');
```

**Why:** Separates test selectors from styling/structure

---

### 2. Test User Flows, Not Implementation

```typescript
// ❌ Bad: Tests implementation details
test('Form sends POST to /api/courses', async ({ page }) => {
  await page.route('/api/courses', route => {
    expect(route.request().method()).toBe('POST');
  });
});

// ✅ Good: Tests user flow
test('Admin can create course', async ({ page }) => {
  await fillCourseForm(page);
  await page.click('[data-testid="submit"]');
  await expect(page.locator('text=Course created')).toBeVisible();
});
```

---

### 3. Keep Tests Independent

```typescript
// ❌ Bad: Tests depend on each other
test('Create course', async ({ page }) => {
  // Creates course with ID 123
});

test('Edit course', async ({ page }) => {
  // Assumes course ID 123 exists
});

// ✅ Good: Each test is independent
test('Edit course', async ({ page }) => {
  // Create course first
  const courseId = await createTestCourse();
  // Then edit it
  await editCourse(courseId);
});
```

---

### 4. Use Descriptive Test Names

```typescript
// ❌ Bad
test('test 1', async ({ page }) => { ... });

// ✅ Good
test('Admin can create a new course with required fields', async ({ page }) => { ... });
```

---

## Running Tests

### Local Development
```bash
# Run all tests
npx playwright test

# Run specific file
npx playwright test tests/e2e/T063_admin_flow.spec.ts

# Run in UI mode (interactive)
npx playwright test --ui

# Run in headed mode (see browser)
npx playwright test --headed

# Debug mode
npx playwright test --debug
```

### CI/CD
```yaml
# GitHub Actions
- name: Run E2E Tests
  run: npx playwright test
```

---

## Debugging Tips

### 1. Use Playwright Inspector
```bash
npx playwright test --debug
```
- Step through test
- See what Playwright sees
- Try selectors

### 2. Take Screenshots
```typescript
test('something', async ({ page }) => {
  await page.screenshot({ path: 'before.png' });
  await page.click('button');
  await page.screenshot({ path: 'after.png' });
});
```

### 3. Record Videos
```typescript
// playwright.config.ts
export default {
  use: {
    video: 'retain-on-failure', // Save video if test fails
  },
};
```

### 4. Console Logs
```typescript
// Listen to console
page.on('console', msg => console.log('PAGE LOG:', msg.text()));

// Log page content
const content = await page.content();
console.log(content);
```

---

## Summary

E2E testing with Playwright:

✅ **Tests real user flows** in real browsers  
✅ **Catches integration bugs** unit tests miss  
✅ **Provides confidence** for deployments  
✅ **Documents how features work**  
✅ **Automates manual testing**  

**Trade-offs:**
- Slower than unit tests
- More complex setup
- Can be flaky if not careful

**When to use:**
- Critical user journeys
- Login/signup flows
- Payment/checkout
- Admin operations
- After unit tests pass

**Best approach:** Combine both
- Unit tests for logic
- E2E tests for flows
