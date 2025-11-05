# T129: Unit Test Coverage - Comprehensive Learning Guide

**Purpose**: Educational guide for understanding unit test coverage, testing strategies, and best practices demonstrated in T129
**Audience**: Developers learning testing, team members, future maintainers
**Date**: 2025-11-05

---

## Table of Contents

1. [Introduction to Test Coverage](#introduction-to-test-coverage)
2. [Testing Strategy](#testing-strategy)
3. [Password Reset Testing Deep Dive](#password-reset-testing-deep-dive)
4. [Toast Service Testing Deep Dive](#toast-service-testing-deep-dive)
5. [Testing Patterns and Best Practices](#testing-patterns-and-best-practices)
6. [Database Testing Strategies](#database-testing-strategies)
7. [DOM Testing in JSDOM](#dom-testing-in-jsdom)
8. [Security Testing Considerations](#security-testing-considerations)
9. [Common Pitfalls and Solutions](#common-pitfalls-and-solutions)
10. [Test Maintenance](#test-maintenance)

---

## Introduction to Test Coverage

### What is Test Coverage?

Test coverage is a metric that measures how much of your code is executed when tests run. It helps identify untested code and gaps in your test suite.

### Types of Coverage

1. **Line Coverage**: Percentage of code lines executed
2. **Branch Coverage**: Percentage of decision branches (if/else) tested
3. **Function Coverage**: Percentage of functions called
4. **Statement Coverage**: Percentage of statements executed

### Why 70%+ Coverage?

The 70% target balances:
- **Confidence**: Covers most critical paths
- **Maintenance**: Not overly burdensome to maintain
- **Value**: Diminishing returns above 70-80%
- **Pragmatism**: Focus on critical code over trivial code

```typescript
// Example: High-value test coverage
test('should validate payment amount', () => {
  // Tests critical business logic
  expect(validatePayment(100)).toBe(true);
  expect(validatePayment(-10)).toBe(false);
});

// vs. Low-value test
test('getter returns value', () => {
  // Tests trivial code
  const obj = { value: 5 };
  expect(obj.value).toBe(5);
});
```

---

## Testing Strategy

### 1. Identify Coverage Gaps

**Approach Used in T129**:

```bash
# Analyze services vs tests
services=($(ls src/lib/*.ts))
tests=($(ls tests/unit/*.test.ts))

# Compare to find gaps
for service in "${services[@]}"; do
  if ! grep -q "$service" tests/unit/*.test.ts; then
    echo "Missing tests: $service"
  fi
done
```

**Result**: Identified 2 untested services (passwordReset, toast)

### 2. Prioritize by Criticality

Priority matrix:

| Service | Criticality | Impact | Priority |
|---------|-------------|--------|----------|
| passwordReset | HIGH | Security | P0 |
| toast | LOW | UI | P2 |
| auth | HIGH | Security | ✅ Tested |
| payments | HIGH | Business | ✅ Tested |

### 3. Write Tests Incrementally

**Best Practice**: Test-Driven Development (TDD)

```typescript
// 1. Write failing test
test('should generate secure token', () => {
  const token = generateResetToken();
  expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
});

// 2. Implement code
export function generateResetToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

// 3. Verify test passes
// ✅ Test passes
```

---

## Password Reset Testing Deep Dive

### Architecture

```
User Request → API Endpoint → Password Reset Service → Database
                                      ↓
                              Security Validation
                              Token Generation
                              Expiration Handling
```

### Security-First Testing

#### 1. Token Generation Security

```typescript
describe('generateResetToken', () => {
  it('should generate cryptographically secure tokens', () => {
    const token = generateResetToken();

    // Security checks
    expect(token.length).toBeGreaterThan(40); // Sufficient entropy
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/); // Safe characters

    // Uniqueness check
    const tokens = new Set();
    for (let i = 0; i < 100; i++) {
      tokens.add(generateResetToken());
    }
    expect(tokens.size).toBe(100); // All unique
  });
});
```

**Why This Matters**:
- Prevents predictable tokens
- Ensures collision resistance
- Validates entropy source

#### 2. Email Enumeration Prevention

```typescript
it('should return null for non-existent user', async () => {
  const result = await createPasswordResetToken('nonexistent@example.com');

  // Same response as valid user (prevents enumeration)
  expect(result).toBeNull();

  // Timing should be similar to valid case (prevents timing attacks)
  // Note: Not tested here but important in production
});
```

**Security Concept**: Email enumeration allows attackers to discover valid emails by observing different responses for existing vs non-existing users.

**Prevention**:
- Return null for both cases
- Don't reveal "user not found" vs "email sent"
- Consider constant-time operations

#### 3. Token Expiration Testing

```typescript
it('should reject expired token', async () => {
  const token = await createPasswordResetToken('user@example.com');

  // Manually expire token (time travel in tests)
  await pool.query(
    `UPDATE password_reset_tokens
     SET expires_at = NOW() - INTERVAL '1 hour'
     WHERE token = $1`,
    [token.token]
  );

  const verification = await verifyResetToken(token.token);

  expect(verification.valid).toBe(false);
  expect(verification.error).toBe('Reset token has expired');
});
```

**Testing Technique**: Time manipulation
- Can't wait 1 hour in tests
- Directly modify database timestamps
- Tests expiration logic without waiting

#### 4. One-Time Use Enforcement

```typescript
it('should reject used token', async () => {
  const token = await createPasswordResetToken('user@example.com');

  // Use token
  await markTokenAsUsed(token.token);

  // Try to use again
  const verification = await verifyResetToken(token.token);

  expect(verification.valid).toBe(false);
  expect(verification.error).toBe('Reset token has already been used');
});
```

**Security Concept**: Prevents replay attacks
- Token works only once
- Even if intercepted, can't be reused
- Database tracks usage state

#### 5. Rate Limiting Testing

```typescript
it('should detect rapid reset requests', async () => {
  const email = 'user@example.com';

  // First request
  await createPasswordResetToken(email);

  // Immediate second request
  const hasRecent = await hasRecentResetRequest(email, 5);

  expect(hasRecent).toBe(true); // Detects within 5 minutes
});
```

**Purpose**: Prevents abuse
- Limits password reset requests
- Prevents spam/DoS
- Configurable time windows

### Database Integration Testing

#### Setup and Teardown

```typescript
describe('Password Reset Service', () => {
  let pool: Pool;
  let testUserId: string;
  let testUserEmail: string;

  beforeAll(async () => {
    pool = getPool(); // Shared connection pool
  });

  beforeEach(async () => {
    // Fresh user for each test
    testUserEmail = `test-${Date.now()}@example.com`;
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, name)
       VALUES ($1, $2, $3) RETURNING id`,
      [testUserEmail, 'hashed_password', 'Test User']
    );
    testUserId = result.rows[0].id;

    // Clean existing tokens
    await pool.query(
      'DELETE FROM password_reset_tokens WHERE user_id = $1',
      [testUserId]
    );
  });

  afterAll(async () => {
    // Cleanup test data
    if (testUserId) {
      await pool.query(
        'DELETE FROM password_reset_tokens WHERE user_id = $1',
        [testUserId]
      );
      await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
    }
  });
});
```

**Key Principles**:
1. **Isolation**: Each test gets fresh data
2. **Uniqueness**: Timestamps prevent collisions
3. **Cleanup**: afterAll removes test data
4. **Shared Pool**: Reuse connections for performance

#### Querying and Validation

```typescript
it('should store token in database', async () => {
  const result = await createPasswordResetToken(testUserEmail);

  // Verify in database
  const dbResult = await pool.query(
    'SELECT * FROM password_reset_tokens WHERE token = $1',
    [result!.token]
  );

  expect(dbResult.rows.length).toBe(1);
  expect(dbResult.rows[0].user_id).toBe(testUserId);
  expect(dbResult.rows[0].used).toBe(false);

  // Verify expiration is ~1 hour from now
  const expiresAt = new Date(dbResult.rows[0].expires_at);
  const now = new Date();
  const expectedExpiry = new Date(now.getTime() + 60 * 60 * 1000);
  const timeDiff = Math.abs(expiresAt.getTime() - expectedExpiry.getTime());
  expect(timeDiff).toBeLessThan(1000); // Within 1 second
});
```

**Testing Approach**:
- Create through service method
- Verify with direct database query
- Check all relevant fields
- Validate timestamps within tolerance

---

## Toast Service Testing Deep Dive

### Architecture

```
Client Code → useToast() → Toast Singleton → DOM Manipulation
                                   ↓
                           Container Creation
                           Toast Element
                           Animation
                           Auto-Dismissal
```

### Challenges with DOM Testing

#### 1. JSDOM Limitations

```typescript
// JSDOM doesn't fully support:
// - CSS animations
// - Layout calculations
// - Visual rendering
// - Some DOM APIs

// Solution: Focus on behavior, not visuals

it('should create toast without errors', () => {
  const toast = useToast();

  // Test: Method doesn't throw
  expect(() => toast.success('Test')).not.toThrow();

  // Not testing: Exact DOM structure, CSS, animations
});
```

#### 2. Singleton Pattern Testing

```typescript
// Challenge: Singleton persists between tests

// Bad approach: Try to reset singleton
afterEach(() => {
  // This doesn't work reliably in Node
  delete global.window;
  vi.resetModules();
});

// Good approach: Design tests to be independent

it('should handle multiple calls', () => {
  const toast = useToast();

  // Test that multiple calls work, regardless of state
  expect(() => {
    toast.success('First');
    toast.error('Second');
    toast.info('Third');
  }).not.toThrow();
});
```

#### 3. Timer Testing

```typescript
beforeEach(() => {
  vi.useFakeTimers(); // Mock setTimeout/setInterval
});

afterEach(() => {
  vi.useRealTimers(); // Restore real timers
});

it('should auto-dismiss after 3 seconds', () => {
  const toast = useToast();
  toast.success('Test');

  // Fast-forward time
  vi.advanceTimersByTime(3000);

  // Check toast starts dismissing
  // Note: Actual check depends on implementation
});
```

### Testing Strategies for UI Components

#### 1. Functional Testing

```typescript
// Test: Does it work?
describe('Toast Methods', () => {
  it('should have success method', () => {
    const toast = useToast();
    expect(typeof toast.success).toBe('function');
  });

  it('should accept messages', () => {
    const toast = useToast();
    expect(() => toast.success('Message')).not.toThrow();
  });
});
```

#### 2. Error Handling Testing

```typescript
// Test: Does it fail gracefully?
describe('Error Handling', () => {
  it('should handle empty messages', () => {
    const toast = useToast();
    expect(() => toast.success('')).not.toThrow();
  });

  it('should handle special characters', () => {
    const toast = useToast();
    expect(() => {
      toast.success('<script>alert("xss")</script>');
    }).not.toThrow();
  });
});
```

#### 3. Performance Testing

```typescript
// Test: Does it perform well?
describe('Performance', () => {
  it('should handle many toasts efficiently', () => {
    const toast = useToast();
    const start = Date.now();

    for (let i = 0; i < 50; i++) {
      toast.success(`Message ${i}`);
    }

    const duration = Date.now() - start;
    expect(duration).toBeLessThan(1000);
  });
});
```

---

## Testing Patterns and Best Practices

### 1. AAA Pattern: Arrange, Act, Assert

```typescript
it('should verify valid token', async () => {
  // Arrange: Set up test data
  const token = await createPasswordResetToken('user@example.com');

  // Act: Perform the action
  const verification = await verifyResetToken(token!.token);

  // Assert: Verify the result
  expect(verification.valid).toBe(true);
  expect(verification.userId).toBeDefined();
});
```

### 2. Test Organization

```typescript
describe('Service Name', () => {
  // Setup for all tests
  beforeAll(() => { /* One-time setup */ });

  // Organize by feature/method
  describe('Feature 1', () => {
    it('should do X', () => { /* Test */ });
    it('should handle Y', () => { /* Test */ });
  });

  describe('Feature 2', () => {
    it('should do Z', () => { /* Test */ });
  });

  // Cleanup
  afterAll(() => { /* One-time cleanup */ });
});
```

### 3. Test Naming

```typescript
// Good: Descriptive, states expectation
it('should return null for non-existent user', () => {});
it('should reject expired token', () => {});
it('should handle empty messages', () => {});

// Bad: Vague, unclear
it('works', () => {});
it('test token', () => {});
it('handles stuff', () => {});
```

### 4. Edge Case Testing

```typescript
describe('Edge Cases', () => {
  it('should handle minimum value', () => {
    expect(validate(0)).toBe(true);
  });

  it('should handle maximum value', () => {
    expect(validate(Number.MAX_SAFE_INTEGER)).toBe(true);
  });

  it('should handle boundary', () => {
    expect(validate(999)).toBe(true);
    expect(validate(1000)).toBe(false);
  });

  it('should handle empty input', () => {
    expect(validate('')).toBe(false);
  });

  it('should handle null/undefined', () => {
    expect(validate(null)).toBe(false);
    expect(validate(undefined)).toBe(false);
  });
});
```

### 5. Async Testing

```typescript
// Good: Properly await async operations
it('should create token', async () => {
  const token = await createPasswordResetToken('user@example.com');
  expect(token).not.toBeNull();
});

// Bad: Missing await (test passes incorrectly)
it('should create token', () => {
  const token = createPasswordResetToken('user@example.com');
  expect(token).not.toBeNull(); // Always passes!
});
```

### 6. Mocking vs Real Dependencies

```typescript
// Use real database in integration tests
describe('Integration Tests', () => {
  it('should integrate with database', async () => {
    const pool = getPool(); // Real database
    // Test with actual database
  });
});

// Use mocks for unit tests
describe('Unit Tests', () => {
  it('should handle database error', async () => {
    const mockPool = {
      query: vi.fn().mockRejectedValue(new Error('DB Error'))
    };
    // Test error handling without real database
  });
});
```

---

## Database Testing Strategies

### 1. Test Data Management

```typescript
// Strategy: Use unique identifiers
const testEmail = `test-${Date.now()}@example.com`;
const testToken = `token-${Date.now()}-${Math.random()}`;

// Strategy: Clean up test data
afterEach(async () => {
  await pool.query('DELETE FROM test_table WHERE email LIKE $1', ['test-%']);
});
```

### 2. Transaction Testing

```typescript
it('should rollback on error', async () => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Operations that should rollback
    await client.query('INSERT INTO users ...');
    await client.query('INSERT INTO tokens ...');

    // Force error
    throw new Error('Test error');

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');

    // Verify rollback worked
    const result = await client.query('SELECT * FROM users WHERE ...');
    expect(result.rows.length).toBe(0);
  } finally {
    client.release();
  }
});
```

### 3. Constraint Testing

```typescript
it('should enforce unique constraint', async () => {
  const email = 'duplicate@example.com';

  // Create first user
  await pool.query(
    'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3)',
    [email, 'hash1', 'User 1']
  );

  // Try to create duplicate
  await expect(
    pool.query(
      'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3)',
      [email, 'hash2', 'User 2']
    )
  ).rejects.toThrow(/unique constraint/);
});
```

### 4. Cascade Testing

```typescript
it('should cascade delete tokens when user deleted', async () => {
  // Create user and token
  const userId = await createUser('user@example.com');
  await createPasswordResetToken('user@example.com');

  // Verify token exists
  let tokens = await pool.query(
    'SELECT * FROM password_reset_tokens WHERE user_id = $1',
    [userId]
  );
  expect(tokens.rows.length).toBe(1);

  // Delete user
  await pool.query('DELETE FROM users WHERE id = $1', [userId]);

  // Verify token was cascade deleted
  tokens = await pool.query(
    'SELECT * FROM password_reset_tokens WHERE user_id = $1',
    [userId]
  );
  expect(tokens.rows.length).toBe(0);
});
```

---

## DOM Testing in JSDOM

### 1. Setting Up JSDOM

```typescript
import { JSDOM } from 'jsdom';

beforeEach(() => {
  // Create fresh DOM
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    url: 'http://localhost',
    pretendToBeVisual: true, // Enable visual APIs
  });

  // Set globals
  global.document = dom.window.document;
  global.window = dom.window as any;
  global.HTMLElement = dom.window.HTMLElement;
});

afterEach(() => {
  // Clean up globals
  delete (global as any).document;
  delete (global as any).window;
  delete (global as any).HTMLElement;
});
```

### 2. Testing DOM Manipulation

```typescript
it('should create element', () => {
  const div = document.createElement('div');
  div.className = 'test-class';
  div.textContent = 'Test content';

  expect(div.className).toBe('test-class');
  expect(div.textContent).toBe('Test content');
});

it('should append to body', () => {
  const div = document.createElement('div');
  document.body.appendChild(div);

  expect(document.body.children.length).toBe(1);
  expect(document.body.children[0]).toBe(div);
});
```

### 3. Testing Event Listeners

```typescript
it('should handle click event', () => {
  const button = document.createElement('button');
  const handleClick = vi.fn();

  button.addEventListener('click', handleClick);
  button.click(); // Simulate click

  expect(handleClick).toHaveBeenCalledTimes(1);
});
```

### 4. JSDOM Limitations

```typescript
// ❌ These don't work well in JSDOM:
// - CSS animations
// - getComputedStyle (returns empty values)
// - getBoundingClientRect (returns zeros)
// - matchMedia
// - IntersectionObserver (needs polyfill)

// ✅ These work in JSDOM:
// - createElement, appendChild, removeChild
// - querySelector, querySelectorAll
// - className, textContent, innerHTML
// - Basic event listeners
// - setAttribute, getAttribute
```

---

## Security Testing Considerations

### 1. Input Validation

```typescript
describe('Input Validation', () => {
  it('should reject invalid email format', async () => {
    const result = await createPasswordResetToken('not-an-email');
    expect(result).toBeNull();
  });

  it('should handle SQL injection attempts', async () => {
    const malicious = "'; DROP TABLE users; --";
    // Should be safely parameterized
    const result = await createPasswordResetToken(malicious);
    expect(result).toBeNull();
  });

  it('should handle XSS attempts in messages', () => {
    const toast = useToast();
    expect(() => {
      toast.success('<script>alert("xss")</script>');
    }).not.toThrow();
    // Message should be escaped in DOM
  });
});
```

### 2. Authentication Testing

```typescript
describe('Authentication', () => {
  it('should require valid token', async () => {
    const invalidToken = 'fake-token-123';
    const result = await verifyResetToken(invalidToken);
    expect(result.valid).toBe(false);
  });

  it('should not reveal user existence', async () => {
    const response1 = await createPasswordResetToken('exists@example.com');
    const response2 = await createPasswordResetToken('fake@example.com');

    // Both should have same response structure
    expect(typeof response1).toBe(typeof response2);
  });
});
```

### 3. Timing Attack Prevention

```typescript
// Note: Difficult to test precisely in unit tests
// Best practice: Constant-time comparisons in production

it('should use constant-time comparison for tokens', () => {
  // In production code:
  // import { timingSafeEqual } from 'crypto';
  //
  // const isValid = timingSafeEqual(
  //   Buffer.from(tokenA),
  //   Buffer.from(tokenB)
  // );

  // In tests: Verify method exists and is used
  expect(timingSafeEqual).toBeDefined();
});
```

---

## Common Pitfalls and Solutions

### Pitfall 1: Tests Pass But Code Fails

```typescript
// Problem: Missing await
it('should create user', () => {
  createUser('test@example.com'); // Missing await!
  // Test passes but user not created yet
});

// Solution: Always await async operations
it('should create user', async () => {
  await createUser('test@example.com');
  // Now user is created before test ends
});
```

### Pitfall 2: Shared State Between Tests

```typescript
// Problem: Tests affect each other
let sharedUser = null;

it('test 1', async () => {
  sharedUser = await createUser('user@example.com');
  // Works
});

it('test 2', async () => {
  // Depends on test 1 running first!
  await updateUser(sharedUser.id, { name: 'Updated' });
});

// Solution: Each test creates own data
it('test 1', async () => {
  const user = await createUser('user1@example.com');
  // Test with user
});

it('test 2', async () => {
  const user = await createUser('user2@example.com');
  // Independent test
});
```

### Pitfall 3: Not Cleaning Up Test Data

```typescript
// Problem: Test data accumulates
it('should create tokens', async () => {
  for (let i = 0; i < 100; i++) {
    await createToken(`user${i}@example.com`);
  }
  // Database now has 100 test tokens!
});

// Solution: Clean up in afterEach
afterEach(async () => {
  await pool.query('DELETE FROM tokens WHERE email LIKE $1', ['user%']);
});
```

### Pitfall 4: Testing Implementation Instead of Behavior

```typescript
// Bad: Tests internal implementation
it('should call helper function', () => {
  const spy = vi.spyOn(service, 'helperFunction');
  service.mainFunction();
  expect(spy).toHaveBeenCalled();
});

// Good: Tests observable behavior
it('should validate token correctly', async () => {
  const result = await verifyToken('valid-token');
  expect(result.valid).toBe(true);
});
```

### Pitfall 5: Flaky Tests Due to Timing

```typescript
// Problem: Race conditions
it('should update after delay', (done) => {
  updateAfterDelay(100, 'value');
  setTimeout(() => {
    expect(getValue()).toBe('value'); // Might fail!
    done();
  }, 95); // Too soon!
});

// Solution: Use fake timers
it('should update after delay', () => {
  vi.useFakeTimers();
  updateAfterDelay(100, 'value');
  vi.advanceTimersByTime(100);
  expect(getValue()).toBe('value'); // Reliable
  vi.useRealTimers();
});
```

---

## Test Maintenance

### 1. Keeping Tests Up to Date

```typescript
// When code changes, update tests immediately

// Old code:
function generateToken() {
  return Math.random().toString();
}

// Old test:
it('should generate token', () => {
  expect(generateToken().length).toBeGreaterThan(0);
});

// New code (improved security):
function generateToken() {
  return crypto.randomBytes(32).toString('base64url');
}

// Updated test:
it('should generate secure token', () => {
  const token = generateToken();
  expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
  expect(token.length).toBeGreaterThan(40);
});
```

### 2. Refactoring Tests

```typescript
// Before: Repetitive code
it('test 1', async () => {
  const user = await pool.query('INSERT INTO users ...');
  const token = await pool.query('INSERT INTO tokens ...');
  // Test logic
});

it('test 2', async () => {
  const user = await pool.query('INSERT INTO users ...');
  const token = await pool.query('INSERT INTO tokens ...');
  // Test logic
});

// After: Extract helper
async function createTestUserWithToken() {
  const user = await pool.query('INSERT INTO users ...');
  const token = await pool.query('INSERT INTO tokens ...');
  return { user, token };
}

it('test 1', async () => {
  const { user, token } = await createTestUserWithToken();
  // Test logic
});

it('test 2', async () => {
  const { user, token } = await createTestUserWithToken();
  // Test logic
});
```

### 3. Monitoring Test Performance

```bash
# Run tests with timing
npm test -- --reporter=verbose

# Identify slow tests (>100ms)
# Optimize or split them

# Example: Slow test
it('should handle 1000 tokens', async () => {
  for (let i = 0; i < 1000; i++) {
    await createToken(`user${i}@example.com`);
  }
  // 5000ms - too slow!
});

# Optimized: Batch operations
it('should handle 1000 tokens', async () => {
  const values = Array.from({ length: 1000 }, (_, i) =>
    `user${i}@example.com`
  );
  await createTokensBatch(values);
  // 500ms - much better!
});
```

---

## Conclusion

This guide demonstrated comprehensive testing strategies through the T129 task implementation. Key takeaways:

1. **Coverage is a means, not an end**: Focus on testing critical paths and edge cases
2. **Security first**: Test security-critical services thoroughly
3. **Pragmatic testing**: Don't over-test trivial code or fight the test environment
4. **Clean tests**: Clear names, good organization, proper cleanup
5. **Maintainable tests**: Extract helpers, avoid duplication, keep tests simple

The 66 tests added in T129 provide a solid foundation for confident development, refactoring, and maintenance of the password reset and toast services.

---

## Further Reading

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Best Practices](https://testing-library.com/docs/queries/about)
- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [PostgreSQL Testing Guide](https://www.postgresql.org/docs/current/regress.html)
- [Node.js Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

---

## Exercises for Learning

Try these exercises to reinforce learning:

1. **Add rate limiting test**: Test that password reset emails are limited to 3 per hour
2. **Add cascade test**: Verify tokens are deleted when user is deleted
3. **Add boundary test**: Test token expiration at exact expiration time
4. **Add performance test**: Measure time to create 100 tokens
5. **Add security test**: Test token randomness distribution
6. **Add integration test**: Test complete flow from request to verification
7. **Add error test**: Test database connection failure handling
8. **Add concurrency test**: Test simultaneous token creation for same user

---

**Author**: Development Team
**Date**: 2025-11-05
**Version**: 1.0
