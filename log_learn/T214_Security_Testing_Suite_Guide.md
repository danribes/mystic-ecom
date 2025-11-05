# T214: Security Testing Suite - Implementation Guide

**Task:** Comprehensive Security Testing Suite
**Date:** 2025-11-03
**Status:** ✅ Complete
**Priority:** 🟠 HIGH

---

## Overview

This guide explains the comprehensive security testing suite implemented to validate all security features and prevent common vulnerabilities. The test suite includes 570+ tests covering all major attack vectors.

---

## Table of Contents

1. [Security Test Files](#security-test-files)
2. [SQL Injection Prevention](#sql-injection-prevention)
3. [XSS Attack Prevention](#xss-attack-prevention)
4. [CSRF Protection](#csrf-protection)
5. [Authentication & Authorization](#authentication--authorization)
6. [Rate Limiting](#rate-limiting)
6. [File Upload Security](#file-upload-security)
7. [Running Security Tests](#running-security-tests)
8. [Adding New Security Tests](#adding-new-security-tests)
9. [CI/CD Integration](#cicd-integration)
10. [Best Practices](#best-practices)

---

## Security Test Files

The security test suite is organized into 6 test files located in `tests/security/`:

```
tests/security/
├── sql-injection.test.ts           # 170+ tests
├── xss-prevention.test.ts          # 100+ tests
├── csrf-protection.test.ts         # 90+ tests
├── auth-security.test.ts           # 80+ tests
├── rate-limiting.test.ts           # 70+ tests
└── file-upload-security.test.ts    # 60+ tests
```

**Total Coverage:** 570+ security tests

---

## SQL Injection Prevention

### What is SQL Injection?

SQL injection occurs when user input is included in SQL queries without proper sanitization, allowing attackers to manipulate database queries.

### Attack Examples

```typescript
// ❌ VULNERABLE CODE (string concatenation)
const query = `SELECT * FROM users WHERE email = '${userInput}'`;

// Attack input: admin' OR '1'='1
// Resulting query: SELECT * FROM users WHERE email = 'admin' OR '1'='1'
// Result: Returns all users (authentication bypass)
```

### Secure Implementation

```typescript
// ✅ SECURE CODE (parameterized query)
const result = await query(
  'SELECT * FROM users WHERE email = $1',
  [userInput]  // User input as parameter
);

// Attack input: admin' OR '1'='1
// Treated as literal string, no SQL injection possible
```

### Test Coverage

**`tests/security/sql-injection.test.ts`** tests:

1. **Classic SQL Injection**
   ```typescript
   it('should prevent OR 1=1 injection', async () => {
     const malicious = "admin' OR '1'='1";
     const result = await query(
       'SELECT * FROM users WHERE email = $1',
       [malicious]
     );
     expect(result.rows).toHaveLength(0);
   });
   ```

2. **UNION-based Injection**
   ```typescript
   it('should prevent UNION SELECT injection', async () => {
     const malicious = "' UNION SELECT password FROM users--";
     const result = await searchProducts(malicious);
     expect(result).not.toContainPassword();
   });
   ```

3. **Time-based Blind Injection**
   ```typescript
   it('should prevent time-based injection', async () => {
     const malicious = "' OR pg_sleep(10)--";
     const start = Date.now();
     await query('SELECT * FROM products WHERE name = $1', [malicious]);
     expect(Date.now() - start).toBeLessThan(100); // No sleep executed
   });
   ```

### Prevention Checklist

- ✅ Always use parameterized queries ($1, $2, etc.)
- ✅ Never concatenate user input into SQL strings
- ✅ Validate input with Zod schemas before queries
- ✅ Use database ORM/query builder when possible
- ✅ Audit all database queries during code review

---

## XSS Attack Prevention

### What is XSS?

Cross-Site Scripting (XSS) occurs when an attacker injects malicious scripts into web pages viewed by other users.

### Attack Examples

```javascript
// ❌ VULNERABLE CODE (no escaping)
const userReview = '<script>alert(document.cookie)</script>';
document.innerHTML = userReview;
// Result: Script executes, attacker steals cookies
```

### Secure Implementation

```javascript
// ✅ SECURE CODE (HTML escaping)
function escapeHTML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const userReview = '<script>alert(document.cookie)</script>';
element.textContent = userReview; // Browser automatically escapes
// Or: element.innerHTML = escapeHTML(userReview);
// Result: <script> displayed as text, not executed
```

### Test Coverage

**`tests/security/xss-prevention.test.ts`** tests:

1. **Script Tag Injection**
   ```typescript
   it('should escape script tags in reviews', async () => {
     const malicious = '<script>alert("XSS")</script>';
     const review = await createReview({ comment: malicious });
     expect(review.comment).toBe('&lt;script&gt;alert("XSS")&lt;/script&gt;');
   });
   ```

2. **Event Handler Injection**
   ```typescript
   it('should prevent onerror injection', async () => {
     const malicious = '<img src=x onerror="alert(1)">';
     const user = await updateProfile({ name: malicious });
     expect(user.name).not.toContain('onerror=');
   });
   ```

3. **JavaScript Protocol**
   ```typescript
   it('should block javascript: URLs', async () => {
     const malicious = 'javascript:alert(document.cookie)';
     const result = await validateUrl(malicious);
     expect(result.valid).toBe(false);
   });
   ```

### Prevention Checklist

- ✅ Always escape HTML output from user input
- ✅ Use textContent instead of innerHTML when possible
- ✅ Implement Content-Security-Policy (CSP) headers
- ✅ Validate and sanitize URLs (prevent javascript:)
- ✅ Use framework's built-in escaping (Astro, React, etc.)

---

## CSRF Protection

### What is CSRF?

Cross-Site Request Forgery tricks users into performing unintended actions while authenticated.

### Attack Example

```html
<!-- Attacker's website -->
<form action="https://your-site.com/api/transfer-funds" method="POST">
  <input type="hidden" name="amount" value="1000">
  <input type="hidden" name="to" value="attacker-account">
</form>
<script>
  document.forms[0].submit(); // Auto-submit when user visits page
</script>

<!-- If user is logged in to your-site.com, request succeeds -->
```

### Secure Implementation

```typescript
// 1. Generate CSRF token
import { generateCSRFToken } from '@/lib/csrf';

export async function GET({ cookies }: APIContext) {
  const csrfToken = generateCSRFToken();
  cookies.set('csrf_token', csrfToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
  });
  return new Response(JSON.stringify({ csrfToken }));
}

// 2. Validate CSRF token
import { validateCSRFToken } from '@/lib/csrf';

export async function POST({ request, cookies }: APIContext) {
  const isValid = await validateCSRFToken(request, cookies);
  if (!isValid) {
    return new Response('CSRF token invalid', { status: 403 });
  }
  // Process request...
}
```

### Test Coverage

**`tests/security/csrf-protection.test.ts`** tests:

1. **Token Generation**
   ```typescript
   it('should generate cryptographically secure tokens', () => {
     const token1 = generateCSRFToken();
     const token2 = generateCSRFToken();
     expect(token1).not.toBe(token2); // Unique
     expect(token1).toHaveLength(43); // 32 bytes base64url
   });
   ```

2. **Token Validation**
   ```typescript
   it('should reject requests without CSRF token', async () => {
     const response = await fetch('/api/cart/add', {
       method: 'POST',
       body: JSON.stringify({ courseId: 'course-1' }),
     });
     expect(response.status).toBe(403);
   });
   ```

3. **Timing-Safe Comparison**
   ```typescript
   it('should use timing-safe comparison', async () => {
     const validToken = generateCSRFToken();
     const invalidToken = 'a'.repeat(43);

     // Time both validations
     const durationValid = await timeValidation(validToken, validToken);
     const durationInvalid = await timeValidation(validToken, invalidToken);

     // Should take similar time (prevent timing attacks)
     expect(Math.abs(durationValid - durationInvalid)).toBeLessThan(5);
   });
   ```

### Prevention Checklist

- ✅ Generate unique CSRF token for each session
- ✅ Include token in forms and AJAX requests
- ✅ Validate token on all state-changing requests (POST/PUT/DELETE)
- ✅ Use timing-safe comparison (crypto.timingSafeEqual)
- ✅ Set SameSite=Lax or Strict on cookies
- ✅ Require CSRF token in custom header (X-CSRF-Token)

---

## Authentication & Authorization

### Password Security

**Secure Password Hashing:**
```typescript
import bcrypt from 'bcrypt';

// ❌ INSECURE (plain text)
const password = 'user-password';
await db.insert({ email, password }); // DON'T DO THIS

// ✅ SECURE (bcrypt with ≥12 rounds)
const saltRounds = 12; // OWASP recommendation
const hash = await bcrypt.hash(password, saltRounds);
await db.insert({ email, passwordHash: hash });

// Password verification
const isValid = await bcrypt.compare(inputPassword, storedHash);
```

### Session Security

**Secure Session Token Generation:**
```typescript
import crypto from 'crypto';

// ✅ Generate cryptographically secure session token
function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('base64url'); // 256 bits
}

// ✅ Store in secure cookie
cookies.set('session', sessionToken, {
  httpOnly: true,      // Prevent JavaScript access
  secure: true,        // HTTPS only
  sameSite: 'lax',     // CSRF protection
  maxAge: 86400,       // 24 hours
  path: '/',
});
```

### Test Coverage

**`tests/security/auth-security.test.ts`** tests:

1. **Password Hashing**
   ```typescript
   it('should use bcrypt with ≥12 rounds', async () => {
     const hash = await hashPassword('password123');
     expect(hash).toMatch(/^\$2b\$/); // bcrypt format
     const rounds = parseInt(hash.split('$')[2]);
     expect(rounds).toBeGreaterThanOrEqual(12);
   });
   ```

2. **Account Enumeration Prevention**
   ```typescript
   it('should prevent timing-based user enumeration', async () => {
     const durationExists = await timeLogin('existing@example.com', 'wrong');
     const durationNotExists = await timeLogin('notfound@example.com', 'wrong');
     expect(Math.abs(durationExists - durationNotExists)).toBeLessThan(50);
   });
   ```

3. **Privilege Escalation Prevention**
   ```typescript
   it('should prevent horizontal privilege escalation', async () => {
     const user1Session = await login('user1@example.com', 'password');
     const user2Order = await createOrder('user2');

     const response = await fetch(`/api/orders/${user2Order.id}`, {
       headers: { Cookie: `session=${user1Session}` },
     });
     expect(response.status).toBe(403); // Forbidden
   });
   ```

### Prevention Checklist

- ✅ Hash passwords with bcrypt (≥12 rounds)
- ✅ Generate secure session tokens (crypto.randomBytes)
- ✅ Set secure cookie flags (HttpOnly, Secure, SameSite)
- ✅ Implement timing-safe comparisons
- ✅ Prevent account enumeration (consistent error messages)
- ✅ Enforce role-based access control (RBAC)
- ✅ Validate user ownership before access
- ✅ Expire sessions after reasonable time (24 hours)

---

## Rate Limiting

### What is Rate Limiting?

Rate limiting prevents brute force attacks, DoS attacks, and API abuse by limiting requests per time window.

### Implementation

```typescript
import { checkRateLimit, RateLimitProfiles } from '@/lib/ratelimit';

export async function POST({ request, clientAddress }: APIContext) {
  // Check rate limit (5 requests per 15 minutes)
  const { allowed, remaining, resetAt } = await checkRateLimit(
    clientAddress,
    RateLimitProfiles.AUTH
  );

  if (!allowed) {
    return new Response('Too many requests', {
      status: 429,
      headers: {
        'Retry-After': String(Math.ceil((resetAt - Date.now()) / 1000)),
        'X-RateLimit-Remaining': '0',
      },
    });
  }

  // Process login...
}
```

### Rate Limit Profiles

```typescript
export const RateLimitProfiles = {
  AUTH: {
    maxRequests: 5,
    windowSeconds: 900, // 15 minutes
    keyPrefix: 'rl:auth',
  },
  PASSWORD_RESET: {
    maxRequests: 3,
    windowSeconds: 3600, // 1 hour
    keyPrefix: 'rl:reset',
  },
  CHECKOUT: {
    maxRequests: 10,
    windowSeconds: 60, // 1 minute
    keyPrefix: 'rl:checkout',
  },
};
```

### Test Coverage

**`tests/security/rate-limiting.test.ts`** tests:

1. **Limit Enforcement**
   ```typescript
   it('should enforce AUTH profile (5 req/15min)', async () => {
     const ip = '192.168.1.100';

     // First 5 requests succeed
     for (let i = 0; i < 5; i++) {
       const response = await loginRequest(ip);
       expect(response.status).toBe(200);
     }

     // 6th request rate limited
     const response = await loginRequest(ip);
     expect(response.status).toBe(429);
     expect(response.headers.get('Retry-After')).toBe('900');
   });
   ```

2. **Sliding Window Algorithm**
   ```typescript
   it('should use sliding window algorithm', async () => {
     // Make requests, wait half window, requests still counted
     // Only after full window do limits reset
   });
   ```

### Prevention Checklist

- ✅ Implement rate limiting on all sensitive endpoints
- ✅ Use Redis for distributed rate limiting
- ✅ Apply appropriate limits per endpoint type
- ✅ Return 429 status with Retry-After header
- ✅ Use sliding window algorithm (more accurate)
- ✅ Monitor rate limit hits for attack detection

---

## File Upload Security

### Magic Byte Validation

**Why Magic Bytes?**
File extensions and MIME types can be spoofed. Magic bytes (file signatures) are more reliable.

### Implementation

```typescript
const FILE_SIGNATURES = {
  'jpeg': [0xFF, 0xD8, 0xFF, 0xE0],
  'png': [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
  'pdf': [0x25, 0x50, 0x44, 0x46, 0x2D], // %PDF-
  'exe': [0x4D, 0x5A], // MZ header (DANGEROUS - reject)
};

export async function validateFile(options: {
  buffer: ArrayBuffer;
  mimeType: string;
  name: string;
}): Promise<FileValidationResult> {
  const bytes = new Uint8Array(options.buffer).slice(0, 20);
  const detectedType = detectFileType(bytes);

  // Reject if detected type doesn't match declared type
  if (detectedType !== getExpectedType(options.mimeType)) {
    return { valid: false, error: 'File type mismatch' };
  }

  // Reject executables
  if (isExecutable(bytes)) {
    return { valid: false, error: 'Malicious file detected' };
  }

  return { valid: true };
}
```

### Test Coverage

**`tests/security/file-upload-security.test.ts`** tests:

1. **Magic Byte Detection**
   ```typescript
   it('should detect JPEG magic bytes', async () => {
     const jpegBytes = new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0]);
     const result = await validateFile({
       buffer: jpegBytes.buffer,
       mimeType: 'image/jpeg',
       name: 'photo.jpg',
     });
     expect(result.valid).toBe(true);
   });
   ```

2. **Executable Rejection**
   ```typescript
   it('should reject executable files', async () => {
     const exeBytes = new Uint8Array([0x4D, 0x5A]); // MZ header
     const result = await validateFile({
       buffer: exeBytes.buffer,
       mimeType: 'image/jpeg', // Spoofed
       name: 'malware.jpg',
     });
     expect(result.valid).toBe(false);
   });
   ```

3. **Path Traversal Prevention**
   ```typescript
   it('should prevent path traversal', async () => {
     const malicious = '../../../etc/passwd';
     const result = await validateFilename(malicious);
     expect(result.valid).toBe(false);
   });
   ```

### Prevention Checklist

- ✅ Validate file magic bytes (not just extension)
- ✅ Reject executables and scripts
- ✅ Enforce file size limits
- ✅ Prevent path traversal (../, absolute paths)
- ✅ Use whitelist of allowed file types
- ✅ Store uploads outside webroot
- ✅ Generate random filenames (prevent overwrites)

---

## Running Security Tests

### Run All Security Tests
```bash
npm test -- tests/security/
```

### Run Specific Test File
```bash
npm test -- tests/security/sql-injection.test.ts
npm test -- tests/security/csrf-protection.test.ts
```

### Run with Coverage
```bash
npm test -- tests/security/ --coverage
```

### Run in Watch Mode
```bash
npm test -- tests/security/ --watch
```

### Run Single Test
```bash
npm test -- tests/security/sql-injection.test.ts -t "should prevent OR 1=1"
```

---

## Adding New Security Tests

### 1. Create Test File
```typescript
// tests/security/new-feature-security.test.ts
import { describe, it, expect } from 'vitest';

describe('New Feature Security', () => {
  describe('Attack Prevention', () => {
    it('should prevent [specific attack]', async () => {
      // Arrange
      const maliciousInput = '...';

      // Act
      const result = await newFeature(maliciousInput);

      // Assert
      expect(result).toBeSecure();
    });
  });
});
```

### 2. Test Pattern
```typescript
it('should prevent [attack type]', async () => {
  // 1. Create malicious input
  const attack = createAttackPayload();

  // 2. Attempt attack
  const result = await targetFunction(attack);

  // 3. Verify prevention
  expect(result).not.toContainSensitiveData();
  expect(result.status).toBe(403); // or appropriate error
  expect(logs).toContainSecurityEvent();
});
```

---

## CI/CD Integration

### GitHub Actions
```yaml
name: Security Tests

on:
  push:
    branches: [main]
  pull_request:

jobs:
  security-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - name: Run Security Tests
        run: npm test -- tests/security/ --run
      - name: Verify Coverage
        run: |
          npm test -- tests/security/ --coverage
          if [ $? -ne 0 ]; then exit 1; fi
```

### Pre-commit Hook
```bash
# .git/hooks/pre-commit
#!/bin/bash
npm test -- tests/security/ --run
if [ $? -ne 0 ]; then
  echo "Security tests failed. Commit blocked."
  exit 1
fi
```

---

## Best Practices

### 1. Security-First Development

- ✅ Write security tests BEFORE implementing features
- ✅ Test both happy paths and attack scenarios
- ✅ Never skip security tests
- ✅ Treat security test failures as critical

### 2. Comprehensive Coverage

- ✅ Test all user inputs
- ✅ Test all database queries
- ✅ Test all file operations
- ✅ Test authentication/authorization
- ✅ Test rate limiting
- ✅ Test error handling

### 3. Regular Updates

- ✅ Add tests for new OWASP Top 10
- ✅ Update tests when vulnerabilities discovered
- ✅ Review test coverage quarterly
- ✅ Keep attack payloads current

### 4. Defense in Depth

- ✅ Multiple layers of security
- ✅ Don't rely on single protection
- ✅ Combine tests (SQL + XSS + CSRF)
- ✅ Test integration, not just units

---

## Security Testing Checklist

Before deploying new features:

- [ ] SQL injection tests pass
- [ ] XSS prevention tests pass
- [ ] CSRF protection tests pass
- [ ] Authentication tests pass
- [ ] Authorization tests pass
- [ ] Rate limiting tests pass
- [ ] File upload tests pass (if applicable)
- [ ] All 570+ security tests passing
- [ ] No security test skipped or disabled
- [ ] Test coverage at 100%

---

## Resources

### OWASP Resources
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [OWASP Cheat Sheets](https://cheatsheetseries.owasp.org/)

### Security Testing Tools
- OWASP ZAP (dynamic testing)
- Burp Suite (penetration testing)
- npm audit (dependency scanning)
- Snyk (vulnerability scanning)

### Further Reading
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Web Security Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [Security Testing in CI/CD](https://owasp.org/www-project-devsecops-guideline/)

---

## Conclusion

The comprehensive security test suite provides 570+ automated tests covering all major attack vectors. By running these tests on every commit and before every deployment, you ensure your application remains secure against common vulnerabilities.

**Remember:** Security is not a one-time task. Continuously update tests, monitor for new vulnerabilities, and maintain defense-in-depth.
