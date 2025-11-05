# T209: TypeScript Type Safety - Learning Guide

**Topic**: TypeScript Type Safety Best Practices
**Level**: Intermediate to Advanced
**Date**: 2025-11-04

## Table of Contents

1. [Introduction](#introduction)
2. [The Problem with `any`](#the-problem-with-any)
3. [Understanding `unknown`](#understanding-unknown)
4. [Type Guards and Assertions](#type-guards-and-assertions)
5. [Strict Mode Configuration](#strict-mode-configuration)
6. [Database Type Safety](#database-type-safety)
7. [Best Practices](#best-practices)
8. [Common Patterns](#common-patterns)
9. [Migration Guide](#migration-guide)
10. [Real-World Examples](#real-world-examples)

## Introduction

Type safety is TypeScript's primary value proposition. It catches errors at compile time instead of runtime, provides better IDE support, and makes code more maintainable. However, using `any` defeats TypeScript's type system entirely.

This guide teaches you how to write truly type-safe TypeScript code.

## The Problem with `any`

### What is `any`?

`any` is TypeScript's escape hatch that says "I give up on type checking."

```typescript
let value: any = "hello";
value = 42;  // OK
value = true;  // OK
value.anything.you.want();  // OK (but crashes at runtime!)
```

### Why `any` is Dangerous

#### Example 1: Runtime Crashes

```typescript
function getUser(id: string): any {
  // Might return null if user not found
  return users.find(u => u.id === id);
}

const user = getUser("123");
console.log(user.name);  // ✅ Compiles
                         // 💥 Crashes if user is null!
```

TypeScript doesn't warn you about the potential null value.

#### Example 2: Refactoring Nightmares

```typescript
// Original function
function processData(data: any) {
  return data.value * 2;
}

// Someone changes the API
// Now data.value is a string, not a number
processData(apiData);  // ✅ Still compiles
                       // 💥 Returns NaN, bugs everywhere!
```

No compile errors, but the app is broken.

#### Example 3: No IDE Support

```typescript
function handleData(data: any) {
  data.  // IDE shows no autocomplete suggestions
  // What properties does data have? Who knows!
}
```

### The Cost of `any`

1. **Security**: No validation of untrusted input
2. **Maintenance**: Hard to refactor safely
3. **Documentation**: Code doesn't self-document
4. **Debugging**: Errors only found at runtime
5. **Team Productivity**: Other developers don't know what to pass

## Understanding `unknown`

### What is `unknown`?

`unknown` is the type-safe counterpart of `any`. It says "I don't know the type yet, but I'll check before using it."

```typescript
let value: unknown = "hello";
value = 42;  // OK
value = true;  // OK

// value.anything();  // ❌ TypeScript error!
                      // Must check type first
```

### `any` vs `unknown`

```typescript
// ❌ any: No type safety
function handleAny(value: any) {
  return value.toUpperCase();  // ✅ Compiles
                                // 💥 Crashes if value is not a string
}

// ✅ unknown: Type-safe
function handleUnknown(value: unknown) {
  // return value.toUpperCase();  // ❌ TypeScript error!

  // Must check type first
  if (typeof value === 'string') {
    return value.toUpperCase();  // ✅ Safe!
  }

  throw new Error('Value must be a string');
}
```

### When to Use `unknown`

**Use `unknown` when:**
- Parsing JSON from an API
- Handling user input
- Error handling (catch blocks)
- Library functions that accept any type

**Example:**

```typescript
// API response - we don't know the shape
async function fetchData(url: string): Promise<unknown> {
  const response = await fetch(url);
  return response.json();  // Could be anything!
}

// Use with type guard
const data = await fetchData('/api/users');

if (isUserArray(data)) {
  // Now TypeScript knows data is User[]
  data.forEach(user => console.log(user.name));
}
```

## Type Guards and Assertions

### Type Guards

Type guards are functions that check if a value matches a specific type.

#### Basic Type Guards

```typescript
// typeof guard (for primitives)
function isString(value: unknown): value is string {
  return typeof value === 'string';
}

// instanceof guard (for classes)
function isError(value: unknown): value is Error {
  return value instanceof Error;
}

// Property check guard
function hasProperty<K extends string>(
  value: unknown,
  key: K
): value is Record<K, unknown> {
  return typeof value === 'object' && value !== null && key in value;
}
```

#### Using Type Guards

```typescript
function processValue(value: unknown) {
  if (isString(value)) {
    // TypeScript knows value is string here
    console.log(value.toUpperCase());
  } else if (isError(value)) {
    // TypeScript knows value is Error here
    console.log(value.message);
  } else {
    console.log('Unknown type');
  }
}
```

### Complex Type Guards

```typescript
interface User {
  id: string;
  name: string;
  email: string;
}

function isUser(value: unknown): value is User {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'name' in value &&
    'email' in value &&
    typeof (value as User).id === 'string' &&
    typeof (value as User).name === 'string' &&
    typeof (value as User).email === 'string'
  );
}

// Usage
const data: unknown = JSON.parse(jsonString);

if (isUser(data)) {
  // TypeScript knows data is User
  console.log(data.email);  // ✅ Safe!
}
```

### Type Assertions

Use when you're certain of the type:

```typescript
// ❌ Dangerous
const user = data as User;  // What if data isn't a User?

// ✅ Safe - with type guard first
if (isUser(data)) {
  const user = data;  // TypeScript infers User type
}

// ✅ Also safe - double assertion (use sparingly)
const user = (data as unknown) as User;
```

## Strict Mode Configuration

### Enable Strict Mode

```json
{
  "compilerOptions": {
    "strict": true,  // Enables all strict checks

    // Or enable individually:
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,

    // T209: Additional safety
    "useUnknownInCatchVariables": true
  }
}
```

### What Each Option Does

#### `noImplicitAny`

```typescript
// ❌ Without noImplicitAny
function add(a, b) {  // a and b implicitly any
  return a + b;
}

// ✅ With noImplicitAny
function add(a: number, b: number) {  // Must specify types
  return a + b;
}
```

#### `strictNullChecks`

```typescript
// ❌ Without strictNullChecks
function getLength(str: string) {
  return str.length;  // Crashes if str is null
}

getLength(null);  // ✅ Compiles (bad!)

// ✅ With strictNullChecks
function getLength(str: string | null) {
  if (str === null) {
    return 0;
  }
  return str.length;
}

// getLength(null);  // ❌ TypeScript error!
```

#### `useUnknownInCatchVariables`

```typescript
// ❌ Without useUnknownInCatchVariables
try {
  dangerousOperation();
} catch (error) {
  // error is 'any' - unsafe!
  console.log(error.message);
}

// ✅ With useUnknownInCatchVariables
try {
  dangerousOperation();
} catch (error) {
  // error is 'unknown' - must check type!
  if (error instanceof Error) {
    console.log(error.message);  // Safe!
  }
}
```

## Database Type Safety

### The Problem

Database results are inherently dynamic:

```typescript
// ❌ Unsafe
const result = await query('SELECT * FROM users WHERE id = $1', [userId]);
const user = result.rows[0];  // Type is any!
console.log(user.email);  // Could crash if email doesn't exist
```

### The Solution

Define proper types:

```typescript
// Step 1: Define SQL value types
type SqlValue = string | number | boolean | null | Date | Buffer;
type SqlParams = SqlValue[];

// Step 2: Define row types
interface UserRow {
  id: string;
  email: string;
  name: string;
  // ... other fields
}

// Step 3: Type-safe query function
async function query<T = DatabaseRow>(
  text: string,
  params?: SqlParams
): Promise<QueryResult<T>> {
  return pool.query<T>(text, params);
}

// Step 4: Use with type parameter
const result = await query<UserRow>(
  'SELECT * FROM users WHERE id = $1',
  [userId]
);

const user = result.rows[0];  // Type is UserRow!
console.log(user.email);  // ✅ Type-safe!
```

### Type Guards for Database Results

```typescript
function isUserRow(row: unknown): row is UserRow {
  return (
    typeof row === 'object' &&
    row !== null &&
    'id' in row &&
    'email' in row &&
    'name' in row &&
    typeof (row as UserRow).id === 'string' &&
    typeof (row as UserRow).email === 'string' &&
    typeof (row as UserRow).name === 'string'
  );
}

// Usage
const result = await query('SELECT * FROM users WHERE id = $1', [userId]);

if (result.rows.length > 0 && isUserRow(result.rows[0])) {
  const user = result.rows[0];  // TypeScript knows it's UserRow
  console.log(user.email);
}
```

## Best Practices

### 1. Never Use `any`

```typescript
// ❌ Never do this
function process(data: any) { }

// ✅ Use unknown
function process(data: unknown) {
  if (typeof data === 'object' && data !== null) {
    // Handle object
  }
}

// ✅ Or use specific types
interface ProcessData {
  value: number;
}

function process(data: ProcessData) {
  return data.value * 2;
}
```

### 2. Use Type Guards

```typescript
// ❌ Unsafe
function handleValue(value: unknown) {
  return (value as string).toUpperCase();
}

// ✅ Safe with type guard
function handleValue(value: unknown) {
  if (typeof value === 'string') {
    return value.toUpperCase();
  }
  throw new ValidationError('Value must be a string');
}
```

### 3. Enable Strict Mode

Always use strict mode in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "strict": true
  }
}
```

### 4. Validate External Data

```typescript
// API responses, user input, etc.
const response = await fetch('/api/data');
const data: unknown = await response.json();

// ✅ Validate before using
if (isValidData(data)) {
  processData(data);
} else {
  throw new ValidationError('Invalid API response');
}
```

### 5. Use `satisfies` for Type Checking

```typescript
// ✅ Ensure object matches interface without losing literal types
const config = {
  host: 'localhost',
  port: 5432,
  database: 'mydb'
} satisfies DatabaseConfig;

// config.host is still 'localhost', not just string
// But TypeScript ensures all required fields are present
```

## Common Patterns

### Pattern 1: Error Handling

```typescript
try {
  await riskyOperation();
} catch (error: unknown) {
  if (error instanceof AppError) {
    // Handle application errors
    log.error('App error', { code: error.code });
  } else if (error instanceof Error) {
    // Handle standard errors
    log.error('Error', { message: error.message });
  } else {
    // Handle non-error throws
    log.error('Unknown error', { value: error });
  }
}
```

### Pattern 2: API Response Handling

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

function isApiResponse<T>(
  value: unknown,
  isT: (data: unknown) => data is T
): value is ApiResponse<T> {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const response = value as Record<string, unknown>;

  if (typeof response.success !== 'boolean') {
    return false;
  }

  if (response.data !== undefined && !isT(response.data)) {
    return false;
  }

  return true;
}

// Usage
const response: unknown = await fetch('/api/users').then(r => r.json());

if (isApiResponse(response, isUserArray)) {
  if (response.success && response.data) {
    // TypeScript knows response.data is User[]
    response.data.forEach(user => console.log(user.name));
  }
}
```

### Pattern 3: Generic Type-Safe Functions

```typescript
// Type-safe pick function
function pick<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>;

  for (const key of keys) {
    result[key] = obj[key];
  }

  return result;
}

// Usage
interface User {
  id: string;
  name: string;
  email: string;
  password: string;
}

const user: User = { /* ... */ };
const publicUser = pick(user, ['id', 'name', 'email']);
// Type is { id: string; name: string; email: string }
// 'password' is not included
```

## Migration Guide

### Step-by-Step Migration

#### Step 1: Enable Strict Mode

```json
{
  "compilerOptions": {
    "strict": true
  }
}
```

Run `npx tsc --noEmit` to see all type errors.

#### Step 2: Fix Core Files First

Start with infrastructure files:
1. Database layer
2. Error handling
3. Logging
4. Authentication

#### Step 3: Replace `any` with `unknown`

```typescript
// Before
function log(data: any) { }

// After
function log(data: unknown) {
  // Add type guards as needed
}
```

#### Step 4: Add Type Guards

```typescript
function process(value: unknown) {
  if (typeof value === 'string') {
    // Handle string
  } else if (typeof value === 'number') {
    // Handle number
  } else {
    throw new Error('Invalid type');
  }
}
```

#### Step 5: Define Specific Types

```typescript
// Better than unknown when you know the shape
interface Config {
  host: string;
  port: number;
}

function loadConfig(): Config {
  // ...
}
```

## Real-World Examples

### Example 1: Type-Safe Database Query

```typescript
import type { UserRow, SqlParams } from '@/types/database';
import { query } from '@/lib/db';

async function getUserByEmail(email: string): Promise<UserRow | null> {
  const params: SqlParams = [email];

  const result = await query<UserRow>(
    'SELECT * FROM users WHERE email = $1',
    params
  );

  return result.rows[0] || null;
}

// Usage
const user = await getUserByEmail('test@example.com');

if (user) {
  // TypeScript knows user is UserRow
  console.log(user.name);  // ✅ Type-safe!
}
```

### Example 2: Type-Safe API Route

```typescript
import { asyncHandler, ValidationError, assert } from '@/lib/errors';
import type { SqlParams } from '@/types/database';

export const POST = asyncHandler(async (context) => {
  const body: unknown = await context.request.json();

  // Validate with type guard
  if (!isCreateUserRequest(body)) {
    throw new ValidationError('Invalid request body');
  }

  // Now body is properly typed
  const params: SqlParams = [body.email, body.name];

  const result = await query(
    'INSERT INTO users (email, name) VALUES ($1, $2) RETURNING id',
    params
  );

  return new Response(
    JSON.stringify({ success: true, id: result.rows[0].id }),
    { status: 201 }
  );
});

function isCreateUserRequest(value: unknown): value is CreateUserRequest {
  return (
    typeof value === 'object' &&
    value !== null &&
    'email' in value &&
    'name' in value &&
    typeof (value as CreateUserRequest).email === 'string' &&
    typeof (value as CreateUserRequest).name === 'string'
  );
}

interface CreateUserRequest {
  email: string;
  name: string;
}
```

### Example 3: Type-Safe Error Handling

```typescript
import { mapDatabaseError, handleError } from '@/lib/errors';

export const POST = asyncHandler(async (context) => {
  try {
    const result = await query('INSERT INTO users ...', params);
    return new Response(JSON.stringify({ success: true }));
  } catch (error: unknown) {
    // Map database errors to friendly errors
    if (isDatabaseError(error)) {
      throw mapDatabaseError(error);
    }

    // Re-throw for central error handler
    throw error;
  }
});
```

## Summary

**Key Takeaways**:

1. ❌ Never use `any` - it defeats TypeScript's purpose
2. ✅ Use `unknown` for values of uncertain type
3. ✅ Always use type guards before accessing unknown values
4. ✅ Enable strict mode in tsconfig.json
5. ✅ Define specific types for database operations
6. ✅ Validate external data (APIs, user input)
7. ✅ Use type assertions sparingly and safely
8. ✅ Leverage TypeScript's type inference
9. ✅ Write type guards for complex validations
10. ✅ Make impossible states impossible

**Remember**: The few extra lines for type checking save hours of debugging runtime errors!

---

**Further Reading**:
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)
- [Effective TypeScript](https://effectivetypescript.com/)
