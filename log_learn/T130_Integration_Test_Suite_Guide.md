# T130: Integration Testing Guide - A Comprehensive Tutorial

**Purpose**: Learn how to write effective integration tests for a full-stack web application
**Level**: Intermediate to Advanced
**Prerequisites**: TypeScript, Testing fundamentals, SQL knowledge
**Estimated Reading Time**: 30 minutes

---

## Table of Contents

1. [What is Integration Testing?](#what-is-integration-testing)
2. [Why Integration Tests Matter](#why-integration-tests-matter)
3. [Integration vs Unit vs E2E Tests](#test-types-comparison)
4. [Setting Up Integration Tests](#setup)
5. [Writing Your First Integration Test](#first-test)
6. [Testing Critical User Flows](#user-flows)
7. [Test Isolation and Cleanup](#isolation)
8. [Best Practices](#best-practices)
9. [Common Pitfalls](#common-pitfalls)
10. [Real-World Examples](#examples)

---

## What is Integration Testing?

**Integration testing** validates that multiple components of your system work together correctly. Unlike unit tests that test individual functions in isolation, integration tests verify the interactions between:

- **Application code** ↔️ **Database**
- **API endpoints** ↔️ **Business logic**
- **Authentication** ↔️ **Authorization**
- **Multiple features** ↔️ **Workflows**

### The Testing Pyramid

```
       /\        E2E Tests (Few, Slow, Expensive)
      /  \
     /____\      Integration Tests (Some, Medium Speed, Moderate Cost)
    /      \
   /________\    Unit Tests (Many, Fast, Cheap)
```

**Our Focus**: The middle layer - Integration Tests

---

## Why Integration Tests Matter

### Real-World Scenario

Imagine you have:
- ✅ Unit test: "Password hashing function works"
- ✅ Unit test: "Database insert works"
- ✅ Unit test: "Login endpoint returns 200"

But can a user actually **register and login**? Integration tests answer this!

### What Integration Tests Catch

1. **Database Schema Issues**
   ```typescript
   // Unit test: Function works
   function createUser(email, password) { ... }

   // Integration test catches:
   // Error: column "email_verified" does not exist
   ```

2. **Business Logic Flows**
   ```typescript
   // Can users access courses they haven't purchased?
   // Does the cart correctly calculate totals?
   // Are admin-only actions properly restricted?
   ```

3. **Data Consistency**
   ```typescript
   // When an order is deleted, are order_items also cleaned up?
   // Do foreign key constraints work as expected?
   ```

---

## Test Types Comparison

| Aspect | Unit Test | Integration Test | E2E Test |
|--------|-----------|------------------|----------|
| **Scope** | Single function | Multiple components | Full application |
| **Database** | Mocked | Real | Real |
| **Speed** | Fast (< 10ms) | Medium (50-200ms) | Slow (1-10s) |
| **Setup** | Minimal | Moderate | Complex |
| **Realism** | Low | High | Very High |
| **Debugging** | Easy | Medium | Hard |

### When to Use Each

**Unit Tests**: Pure functions, utilities, algorithms
```typescript
// Testing a price calculation function
expect(calculateDiscount(100, 0.2)).toBe(80);
```

**Integration Tests**: User flows, database operations, API interactions
```typescript
// Testing registration → login flow
await registerUser(email, password);
const user = await loginUser(email, password);
expect(user.email).toBe(email);
```

**E2E Tests**: Critical business paths, UI workflows
```typescript
// Testing with a browser
await page.goto('/register');
await page.fill('input[name="email"]', email);
await page.click('button[type="submit"]');
```

---

## Setting Up Integration Tests

### 1. Project Structure

```
tests/
├── unit/                 # Unit tests
├── integration/          # Integration tests ← We're here
│   ├── T130_critical_flows.test.ts
│   └── payment-complete-flow.test.ts
├── e2e/                  # E2E tests
└── setup/
    └── database.ts       # Test database connection
```

### 2. Database Setup

```typescript
// tests/setup/database.ts
import { Pool } from 'pg';

export const pool = new Pool({
  host: process.env.DATABASE_HOST,
  database: process.env.DATABASE_NAME,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
});
```

### 3. Test Configuration

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup/database.ts'],
  },
});
```

---

## Writing Your First Integration Test

### Example: User Registration Flow

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { pool } from '../setup/database';
import * as bcrypt from 'bcrypt';

describe('User Registration Integration Test', () => {
  // Cleanup after tests
  afterAll(async () => {
    await pool.query('DELETE FROM users WHERE email = $1',
      ['test@example.com']);
  });

  it('should register a new user successfully', async () => {
    // 1. ARRANGE - Prepare test data
    const email = 'test@example.com';
    const password = 'SecurePassword123';
    const passwordHash = await bcrypt.hash(password, 10);

    // 2. ACT - Execute the operation
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, role`,
      ['Test User', email, passwordHash, 'user']
    );

    const user = result.rows[0];

    // 3. ASSERT - Verify the results
    expect(user.email).toBe(email);
    expect(user.role).toBe('user');
    expect(user.id).toBeDefined();

    // 4. VERIFY - Check database state
    const dbUser = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    expect(dbUser.rows.length).toBe(1);
    expect(dbUser.rows[0].email).toBe(email);
  });
});
```

### Breaking It Down

**Step 1: ARRANGE** - Set up test data
```typescript
const email = 'test@example.com';
const password = 'SecurePassword123';
const passwordHash = await bcrypt.hash(password, 10);
```

**Step 2: ACT** - Perform the action
```typescript
const result = await pool.query(/* INSERT query */);
```

**Step 3: ASSERT** - Verify results
```typescript
expect(user.email).toBe(email);
```

**Step 4: CLEANUP** - Remove test data
```typescript
afterAll(async () => {
  await pool.query('DELETE FROM users WHERE email = $1', [email]);
});
```

---

## Testing Critical User Flows

### Flow Testing Pattern

A **flow** is a sequence of related actions a user takes:

```
Registration Flow:
  User fills form → Submits → Receives email → Verifies → Can login

Purchase Flow:
  Browse course → Add to cart → Checkout → Pay → Access course
```

### Example: Complete Purchase Flow

```typescript
describe('Purchase Flow Integration', () => {
  let testUser;
  let testCourse;

  beforeAll(async () => {
    // Create test user
    const userResult = await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      ['Buyer', 'buyer@test.com', 'hash', 'user']
    );
    testUser = userResult.rows[0];

    // Create test course
    const courseResult = await pool.query(
      `INSERT INTO courses (title, slug, description, price,
        duration_hours, level, is_published)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      ['Test Course', 'test-course', 'Description', 49.99,
       10, 'beginner', true]
    );
    testCourse = courseResult.rows[0];
  });

  afterAll(async () => {
    // Cleanup in reverse order of dependencies
    await pool.query('DELETE FROM order_items WHERE order_id IN
      (SELECT id FROM orders WHERE user_id = $1)', [testUser.id]);
    await pool.query('DELETE FROM orders WHERE user_id = $1',
      [testUser.id]);
    await pool.query('DELETE FROM cart_items WHERE user_id = $1',
      [testUser.id]);
    await pool.query('DELETE FROM courses WHERE id = $1',
      [testCourse.id]);
    await pool.query('DELETE FROM users WHERE id = $1',
      [testUser.id]);
  });

  it('should complete full purchase flow', async () => {
    // Step 1: Add to cart
    await pool.query(
      `INSERT INTO cart_items (user_id, course_id, quantity)
       VALUES ($1, $2, 1)`,
      [testUser.id, testCourse.id]
    );

    // Verify cart
    const cartCheck = await pool.query(
      'SELECT * FROM cart_items WHERE user_id = $1',
      [testUser.id]
    );
    expect(cartCheck.rows.length).toBe(1);

    // Step 2: Create order
    const orderResult = await pool.query(
      `INSERT INTO orders (user_id, total_amount, currency, status)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [testUser.id, 49.99, 'USD', 'completed']
    );
    const orderId = orderResult.rows[0].id;

    // Step 3: Create order items
    await pool.query(
      `INSERT INTO order_items (order_id, course_id, item_type,
        title, price, quantity)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [orderId, testCourse.id, 'course', 'Test Course', 49.99, 1]
    );

    // Step 4: Verify purchase grants access
    const accessCheck = await pool.query(
      `SELECT EXISTS (
        SELECT 1 FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE o.user_id = $1
        AND oi.course_id = $2
        AND o.status = 'completed'
      ) as has_access`,
      [testUser.id, testCourse.id]
    );

    expect(accessCheck.rows[0].has_access).toBe(true);

    // Step 5: Clear cart
    await pool.query('DELETE FROM cart_items WHERE user_id = $1',
      [testUser.id]);

    // Verify cart is empty
    const emptyCart = await pool.query(
      'SELECT * FROM cart_items WHERE user_id = $1',
      [testUser.id]
    );
    expect(emptyCart.rows.length).toBe(0);
  });
});
```

### Key Patterns in Flow Testing

1. **Sequential Steps**: Each step builds on the previous
2. **State Verification**: Check database state after each step
3. **Realistic Data**: Use actual prices, real strings
4. **Complete Cycles**: Test from start to finish

---

## Test Isolation and Cleanup

### Why Isolation Matters

```typescript
// ❌ BAD: Tests share data
it('test 1', async () => {
  await createUser('shared@email.com');
  // ...
});

it('test 2', async () => {
  await createUser('shared@email.com'); // FAILS! Duplicate
});
```

```typescript
// ✅ GOOD: Tests are isolated
it('test 1', async () => {
  await createUser(`test1-${randomUUID()}@email.com`);
  // ...
});

it('test 2', async () => {
  await createUser(`test2-${randomUUID()}@email.com`);
  // ...
});
```

### Cleanup Strategies

#### Strategy 1: Unique Identifiers
```typescript
import { randomUUID } from 'crypto';

it('test', async () => {
  const uniqueEmail = `user-${randomUUID()}@test.com`;
  // Use uniqueEmail...
});
```

#### Strategy 2: beforeEach/afterEach
```typescript
let testUser;

beforeEach(async () => {
  // Create fresh data for each test
  testUser = await createTestUser();
});

afterEach(async () => {
  // Clean up after each test
  await deleteTestUser(testUser.id);
});
```

#### Strategy 3: Pattern-Based Cleanup
```typescript
afterAll(async () => {
  // Delete all test data by pattern
  await pool.query(
    'DELETE FROM users WHERE email LIKE $1',
    ['%-test@example.com']
  );
});
```

### Cleanup Order Matters!

```typescript
// ❌ WRONG ORDER - Foreign key violation
await pool.query('DELETE FROM users WHERE id = $1', [userId]);
await pool.query('DELETE FROM orders WHERE user_id = $1', [userId]);

// ✅ CORRECT ORDER - Delete children first
await pool.query('DELETE FROM order_items WHERE order_id IN
  (SELECT id FROM orders WHERE user_id = $1)', [userId]);
await pool.query('DELETE FROM orders WHERE user_id = $1', [userId]);
await pool.query('DELETE FROM users WHERE id = $1', [userId]);
```

---

## Best Practices

### 1. Use Descriptive Test Names

```typescript
// ❌ BAD
it('test 1', async () => { /* ... */ });

// ✅ GOOD
it('should deny access to unpurchased courses', async () => { /* ... */ });
```

### 2. Test Both Happy and Sad Paths

```typescript
describe('User Login', () => {
  it('should login with correct credentials', async () => {
    // Happy path
  });

  it('should reject invalid password', async () => {
    // Sad path
  });

  it('should reject non-existent user', async () => {
    // Sad path
  });
});
```

### 3. Use TypeScript Interfaces

```typescript
interface User {
  id: string;
  email: string;
  role: 'user' | 'admin';
}

const result = await pool.query<User>('SELECT * FROM users...');
const user: User = result.rows[0];
// TypeScript ensures type safety
```

### 4. Avoid Magic Numbers

```typescript
// ❌ BAD
expect(result.rows.length).toBe(5);

// ✅ GOOD
const expectedCourseCount = 5;
expect(result.rows.length).toBe(expectedCourseCount);
```

### 5. Use Parameterized Queries

```typescript
// ❌ DANGEROUS - SQL Injection risk
await pool.query(`SELECT * FROM users WHERE email = '${email}'`);

// ✅ SAFE - Parameterized
await pool.query('SELECT * FROM users WHERE email = $1', [email]);
```

---

## Common Pitfalls

### Pitfall 1: Not Cleaning Up Test Data

**Problem**:
```typescript
it('test', async () => {
  await pool.query('INSERT INTO users ...');
  // No cleanup - data persists!
});
```

**Solution**:
```typescript
it('test', async () => {
  const userId = await createUser();
  try {
    // Test logic
  } finally {
    await deleteUser(userId);
  }
});
```

### Pitfall 2: Tests Depend on Execution Order

**Problem**:
```typescript
it('creates user', async () => {
  // Creates user with ID 1
});

it('updates user', async () => {
  // Assumes user ID 1 exists - FRAGILE!
});
```

**Solution**:
```typescript
describe('User CRUD', () => {
  let userId;

  beforeEach(async () => {
    userId = await createUser(); // Fresh for each test
  });

  it('creates user', async () => {
    expect(userId).toBeDefined();
  });

  it('updates user', async () => {
    await updateUser(userId, { name: 'New Name' });
    // Works independently
  });
});
```

### Pitfall 3: Ignoring Async/Await

**Problem**:
```typescript
it('test', async () => {
  pool.query('INSERT...'); // ❌ Missing await!
  const result = await pool.query('SELECT...');
  // May run before INSERT completes
});
```

**Solution**:
```typescript
it('test', async () => {
  await pool.query('INSERT...'); // ✅ Wait for completion
  const result = await pool.query('SELECT...');
});
```

### Pitfall 4: Testing Too Much in One Test

**Problem**:
```typescript
it('tests everything', async () => {
  // Register user
  // Login
  // Add to cart
  // Checkout
  // Leave review
  // Admin approves review
  // ... 100 lines later ...
});
```

**Solution**:
```typescript
describe('User Flow', () => {
  it('should register user', async () => { /* ... */ });
  it('should login user', async () => { /* ... */ });
  it('should add to cart', async () => { /* ... */ });
  // Each test focuses on one thing
});
```

---

## Real-World Examples

### Example 1: Testing Access Control

```typescript
describe('Course Access Control', () => {
  let paidUser, freeUser, course;

  beforeAll(async () => {
    // Setup users and course
    paidUser = await createUser('paid@test.com');
    freeUser = await createUser('free@test.com');
    course = await createCourse();

    // Only paidUser purchases the course
    await createPurchase(paidUser.id, course.id);
  });

  it('should grant access to users who purchased', async () => {
    const hasAccess = await checkCourseAccess(
      paidUser.id,
      course.id
    );
    expect(hasAccess).toBe(true);
  });

  it('should deny access to users who did not purchase', async () => {
    const hasAccess = await checkCourseAccess(
      freeUser.id,
      course.id
    );
    expect(hasAccess).toBe(false);
  });

  afterAll(async () => {
    // Cleanup...
  });
});
```

### Example 2: Testing Search Functionality

```typescript
describe('Course Search', () => {
  beforeAll(async () => {
    // Create test courses with different attributes
    await createCourse({
      title: 'Beginner JavaScript',
      level: 'beginner',
      price: 29.99
    });
    await createCourse({
      title: 'Advanced Python',
      level: 'advanced',
      price: 99.99
    });
    await createCourse({
      title: 'Intermediate React',
      level: 'intermediate',
      price: 59.99
    });
  });

  it('should search by title', async () => {
    const results = await pool.query(
      `SELECT * FROM courses
       WHERE title ILIKE $1 AND is_published = true`,
      ['%JavaScript%']
    );

    expect(results.rows.length).toBe(1);
    expect(results.rows[0].title).toContain('JavaScript');
  });

  it('should filter by level', async () => {
    const results = await pool.query(
      `SELECT * FROM courses
       WHERE level = $1 AND is_published = true`,
      ['beginner']
    );

    expect(results.rows.length).toBeGreaterThan(0);
    results.rows.forEach(course => {
      expect(course.level).toBe('beginner');
    });
  });

  it('should filter by price range', async () => {
    const results = await pool.query(
      `SELECT * FROM courses
       WHERE price BETWEEN $1 AND $2
       AND is_published = true`,
      [50, 100]
    );

    results.rows.forEach(course => {
      expect(course.price).toBeGreaterThanOrEqual(50);
      expect(course.price).toBeLessThanOrEqual(100);
    });
  });

  afterAll(async () => {
    await pool.query(
      "DELETE FROM courses WHERE title LIKE '%JavaScript%'
       OR title LIKE '%Python%' OR title LIKE '%React%'"
    );
  });
});
```

### Example 3: Testing Data Integrity

```typescript
describe('Order-OrderItem Relationship', () => {
  it('should delete order_items when order is deleted', async () => {
    // Create order with items
    const order = await createOrder(user.id);
    await createOrderItem(order.id, course1.id);
    await createOrderItem(order.id, course2.id);

    // Verify items exist
    let items = await pool.query(
      'SELECT * FROM order_items WHERE order_id = $1',
      [order.id]
    );
    expect(items.rows.length).toBe(2);

    // Delete order
    await pool.query('DELETE FROM orders WHERE id = $1',
      [order.id]);

    // Verify cascade delete worked
    items = await pool.query(
      'SELECT * FROM order_items WHERE order_id = $1',
      [order.id]
    );
    expect(items.rows.length).toBe(0);
  });
});
```

---

## Debugging Integration Tests

### Technique 1: Log Database State

```typescript
it('test', async () => {
  await createUser();

  // Debug: Log current state
  const users = await pool.query('SELECT * FROM users');
  console.log('Current users:', users.rows);

  // Continue testing...
});
```

### Technique 2: Use fit() for Focused Testing

```typescript
describe('Tests', () => {
  fit('only run this test', async () => {
    // Only this test runs
  });

  it('skipped', async () => {
    // Skipped
  });
});
```

### Technique 3: Check SQL Queries

```typescript
it('test', async () => {
  const query = `SELECT * FROM users WHERE email = $1`;
  const params = [email];

  console.log('Query:', query);
  console.log('Params:', params);

  const result = await pool.query(query, params);
});
```

---

## Summary Checklist

When writing integration tests, ensure:

- ✅ **Test realistic user flows**, not just individual operations
- ✅ **Clean up test data** using afterAll/afterEach hooks
- ✅ **Use unique identifiers** to prevent test collisions
- ✅ **Test both success and failure** scenarios
- ✅ **Verify database state** after operations
- ✅ **Use parameterized queries** to prevent SQL injection
- ✅ **Keep tests independent** - they should pass in any order
- ✅ **Use TypeScript types** for type safety
- ✅ **Write descriptive test names** that explain what is tested
- ✅ **Follow the AAA pattern**: Arrange, Act, Assert

---

## Next Steps

1. **Practice**: Write integration tests for your own features
2. **Expand**: Add tests for edge cases and error conditions
3. **Automate**: Integrate tests into CI/CD pipeline
4. **Monitor**: Track test coverage and execution time
5. **Refine**: Continuously improve test quality and maintainability

---

## Additional Resources

- **Vitest Documentation**: https://vitest.dev
- **PostgreSQL Testing**: https://www.postgresql.org/docs/current/regress.html
- **Testing Best Practices**: https://testingjavascript.com
- **Integration Testing Patterns**: https://martinfowler.com/testing/

---

**Congratulations!** You now understand how to write comprehensive integration tests for full-stack applications. Apply these principles to ensure your application's components work together flawlessly.

**Remember**: Good tests are an investment in code quality, not a burden. Happy testing! 🎉
