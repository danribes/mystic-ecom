# T139: Input Validation and Sanitization - Learning Guide

**Task ID**: T139  
**Topic**: Input Validation and Sanitization Security  
**Level**: Intermediate  
**Estimated Reading Time**: 30-40 minutes

---

## Table of Contents

1. [What is Input Validation?](#what-is-input-validation)
2. [Why Input Validation Matters](#why-input-validation-matters)
3. [Types of Injection Attacks](#types-of-injection-attacks)
4. [Validation vs Sanitization](#validation-vs-sanitization)
5. [Using Zod for Validation](#using-zod-for-validation)
6. [Common Validation Patterns](#common-validation-patterns)
7. [Security Best Practices](#security-best-practices)
8. [Testing Validation](#testing-validation)
9. [Real-World Examples](#real-world-examples)

---

## What is Input Validation?

Input validation is the process of ensuring that user-supplied data meets expected criteria before processing it.

**Simple Analogy**: Like a bouncer checking IDs at a club - only valid, properly formatted data gets through.

### Basic Concept

```
User Input → Validation → ✅ Accept OR ❌ Reject
```

---

## Why Input Validation Matters

### Without Validation

```typescript
// ❌ Dangerous: No validation
export const POST = async ({ request }) => {
  const { email } = await request.json();
  
  // What if email is: '; DROP TABLE users; --
  await db.query(`SELECT * FROM users WHERE email = '${email}'`);
};
```

**Result**: SQL Injection vulnerability!

### With Validation

```typescript
// ✅ Safe: Validated input
export const POST = async ({ request }) => {
  const body = await request.json();
  const validation = emailSchema.safeParse(body.email);
  
  if (!validation.success) {
    return error(400, 'Invalid email');
  }
  
  // Guaranteed to be valid email format
  await db.query('SELECT * FROM users WHERE email = $1', [validation.data]);
};
```

---

## Types of Injection Attacks

### 1. SQL Injection

**Attack**:
```sql
Input: ' OR '1'='1
Query: SELECT * FROM users WHERE username = '' OR '1'='1'
Result: Returns all users!
```

**Prevention**:
```typescript
// ✅ Parameterized queries + validation
const userSchema = z.object({
  username: z.string().regex(/^[a-zA-Z0-9_]+$/),
});

await db.query(
  'SELECT * FROM users WHERE username = $1',
  [validatedUsername]
);
```

### 2. XSS (Cross-Site Scripting)

**Attack**:
```html
Input: <script>alert('XSS')</script>
Output: <div>{userInput}</div>
Result: Script executes in browser!
```

**Prevention**:
```typescript
// ✅ Validate + Escape
const nameSchema = z.string().max(100);

// In template (Astro auto-escapes):
<div>{validatedName}</div>

// For HTML content, sanitize:
import DOMPurify from 'isomorphic-dompurify';
const clean = DOMPurify.sanitize(userHTML);
```

### 3. Path Traversal

**Attack**:
```
Input: ../../../etc/passwd
Result: Access to system files!
```

**Prevention**:
```typescript
// ✅ Strict slug validation
const slugSchema = z.string().regex(/^[a-z0-9-]+$/);

// Rejects: ../../../etc/passwd ❌
// Accepts: my-valid-slug ✅
```

### 4. Command Injection

**Attack**:
```
Input: file.txt; rm -rf /
Command: cat file.txt; rm -rf /
Result: System files deleted!
```

**Prevention**:
```typescript
// ✅ Never execute shell commands with user input
// ✅ Validate filenames strictly
const filenameSchema = z.string().regex(/^[a-zA-Z0-9._-]+$/);
```

---

## Validation vs Sanitization

### Validation

**Definition**: Checking if input meets criteria, reject if not

```typescript
// Validation: Accept or reject
const email = emailSchema.safeParse(input);
if (!email.success) {
  return error('Invalid email');
}
```

**When to use**: Always as first line of defense

### Sanitization

**Definition**: Cleaning/modifying input to make it safe

```typescript
// Sanitization: Transform to safe version
const cleanHTML = DOMPurify.sanitize(dirtyHTML);
const trimmedName = name.trim();
const lowerEmail = email.toLowerCase();
```

**When to use**: After validation, for formatting

### Best Practice: Both!

```typescript
// 1. Validate structure
const validation = emailSchema.safeParse(input);
if (!validation.success) return error();

// 2. Sanitize (already done by Zod's .trim() and .toLowerCase())
const cleanEmail = validation.data; // Already trimmed and lowercased
```

---

## Using Zod for Validation

### Basic Schema

```typescript
import { z } from 'zod';

const userSchema = z.object({
  email: z.string().email(),
  age: z.number().min(18).max(120),
  name: z.string().min(2).max(100),
});

// Validate
const result = userSchema.safeParse(userInput);

if (result.success) {
  const user = result.data; // Type-safe!
} else {
  console.error(result.error.errors);
}
```

### With Transformations

```typescript
const emailSchema = z
  .string()
  .email()
  .toLowerCase()  // Transform to lowercase
  .trim();        // Remove whitespace

const result = emailSchema.parse('  User@EXAMPLE.COM  ');
// Result: "user@example.com"
```

### With Custom Validation

```typescript
const passwordSchema = z
  .string()
  .min(8)
  .refine(
    (pass) => /[A-Z]/.test(pass),
    'Must contain uppercase'
  )
  .refine(
    (pass) => /[0-9]/.test(pass),
    'Must contain number'
  );
```

### With Dependent Fields

```typescript
const registerSchema = z
  .object({
    password: z.string().min(8),
    confirmPassword: z.string(),
  })
  .refine(
    (data) => data.password === data.confirmPassword,
    {
      message: 'Passwords must match',
      path: ['confirmPassword'],
    }
  );
```

---

## Common Validation Patterns

### Email Validation

```typescript
export const emailSchema = z
  .string()
  .email('Invalid email address')
  .min(5)
  .max(255)
  .toLowerCase()
  .trim();

// ✅ Accepts: user@example.com
// ❌ Rejects: not-an-email, @example.com, very-long-email...
```

### Password Validation

```typescript
export const passwordSchema = z
  .string()
  .min(8, 'At least 8 characters')
  .max(128, 'Max 128 characters')
  .regex(/[A-Z]/, 'Need uppercase')
  .regex(/[a-z]/, 'Need lowercase')
  .regex(/[0-9]/, 'Need number')
  .regex(/[^A-Za-z0-9]/, 'Need special char');

// ✅ Accepts: MyP@ssw0rd
// ❌ Rejects: password (no uppercase, number, special)
```

### Slug Validation

```typescript
export const slugSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  .min(3)
  .max(100);

// ✅ Accepts: my-awesome-post, product-123
// ❌ Rejects: My-Post (uppercase), my_post (underscore), ../etc (traversal)
```

### UUID Validation

```typescript
export const uuidSchema = z.string().uuid();

// ✅ Accepts: 123e4567-e89b-12d3-a456-426614174000
// ❌ Rejects: 123-456, not-a-uuid
```

### Pagination Validation

```typescript
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// Input: { page: "2", limit: "50" }
// Output: { page: 2, limit: 50 } // Coerced to numbers!
```

---

## Security Best Practices

### 1. Validate Early, Fail Fast

```typescript
export const POST: APIRoute = async ({ request }) => {
  // Validate FIRST
  const body = await request.json();
  const validation = schema.safeParse(body);
  
  if (!validation.success) {
    return new Response(JSON.stringify({
      error: 'Validation failed',
      details: validation.error.errors,
    }), { status: 400 });
  }

  // Then process
  const data = validation.data;
  // ... business logic
};
```

### 2. Use Whitelists, Not Blacklists

```typescript
// ❌ Bad: Blacklist approach
const badChars = ['<', '>', '"', "'"];
const isSafe = !badChars.some(char => input.includes(char));

// ✅ Good: Whitelist approach
const allowedPattern = /^[a-zA-Z0-9_-]+$/;
const isSafe = allowedPattern.test(input);
```

### 3. Length Limits on Everything

```typescript
// ❌ Bad: No limits
z.string()

// ✅ Good: Explicit limits
z.string().min(1).max(255)

// Prevents:
// - Buffer overflows
// - DoS attacks (huge inputs)
// - Database errors
```

### 4. Type Validation

```typescript
// ❌ Bad: Accept any type
const price = request.body.price;

// ✅ Good: Enforce type
const priceSchema = z.number().int().min(0);
const price = priceSchema.parse(request.body.price);
```

### 5. Sanitize Output

```typescript
// Input validation
const userBio = bioSchema.parse(input);

// Output sanitization
<div>
  {userBio} <!-- Astro auto-escapes -->
</div>

// For HTML content:
<div set:html={DOMPurify.sanitize(userHTML)} />
```

---

## Testing Validation

### Unit Testing

```typescript
describe('Email Validation', () => {
  it('should accept valid emails', () => {
    const valid = ['user@example.com', 'test+tag@domain.co.uk'];
    
    valid.forEach(email => {
      const result = emailSchema.safeParse(email);
      expect(result.success).toBe(true);
    });
  });

  it('should reject invalid emails', () => {
    const invalid = ['not-email', '@example.com', ''];
    
    invalid.forEach(email => {
      const result = emailSchema.safeParse(email);
      expect(result.success).toBe(false);
    });
  });
});
```

### Security Testing

```typescript
describe('SQL Injection Prevention', () => {
  it('should handle SQL injection attempts', () => {
    const attacks = [
      "'; DROP TABLE users; --",
      "1' OR '1'='1",
    ];
    
    attacks.forEach(attack => {
      const result = nameSchema.safeParse(attack);
      // Should either reject or treat as string
      expect(typeof result).toBe('object');
    });
  });
});
```

---

## Real-World Examples

### Example 1: User Registration

```typescript
import { registerSchema } from '@/lib/validation';

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();
  
  // Validate
  const validation = registerSchema.safeParse(body);
  if (!validation.success) {
    return new Response(JSON.stringify({
      error: 'Validation failed',
      details: extractZodErrors(validation.error),
    }), { status: 400 });
  }

  const { email, password, name } = validation.data;
  
  // Process with validated data
  const user = await createUser({ email, password, name });
  
  return new Response(JSON.stringify({ success: true, user }));
};
```

### Example 2: Search Query

```typescript
const searchSchema = z.object({
  q: z.string().min(1).max(100),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const GET: APIRoute = async ({ url }) => {
  const params = Object.fromEntries(url.searchParams);
  
  const validation = searchSchema.safeParse(params);
  if (!validation.success) {
    return new Response(JSON.stringify({
      error: 'Invalid search parameters',
    }), { status: 400 });
  }

  const { q, page, limit } = validation.data;
  const results = await searchDatabase(q, page, limit);
  
  return new Response(JSON.stringify(results));
};
```

---

## Conclusion

Input validation is essential for:
- **Security**: Preventing injection attacks
- **Data Integrity**: Ensuring data quality
- **Stability**: Preventing errors and crashes
- **User Experience**: Providing clear error messages

**Key Takeaways**:
1. Validate ALL user input
2. Use Zod for type-safe validation
3. Validate early, fail fast
4. Use whitelists over blacklists
5. Set length limits on everything
6. Sanitize output, not just input
7. Test validation thoroughly
8. Document validation rules

**Further Reading**:
- [OWASP Input Validation Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)
- [Zod Documentation](https://zod.dev/)
- [CWE-20: Improper Input Validation](https://cwe.mitre.org/data/definitions/20.html)

Happy Secure Coding! 🔒
