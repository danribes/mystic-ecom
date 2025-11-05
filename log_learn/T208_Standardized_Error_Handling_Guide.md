# T208: Standardized Error Handling - Learning Guide

**Topic**: Error Handling Best Practices in Node.js/TypeScript APIs
**Level**: Intermediate to Advanced
**Date**: 2025-11-04

## Table of Contents

1. [Introduction](#introduction)
2. [Why Standardized Error Handling Matters](#why-standardized-error-handling-matters)
3. [Core Concepts](#core-concepts)
4. [Custom Error Classes](#custom-error-classes)
5. [Error Response Formatting](#error-response-formatting)
6. [Central Error Handling](#central-error-handling)
7. [Database Error Mapping](#database-error-mapping)
8. [Best Practices](#best-practices)
9. [Common Pitfalls](#common-pitfalls)
10. [Real-World Examples](#real-world-examples)

## Introduction

Error handling is one of the most critical aspects of building robust APIs. Poor error handling leads to:
- 😞 Frustrated users receiving generic "something went wrong" messages
- 🔍 Debugging nightmares with no context
- 🔒 Security vulnerabilities from exposing stack traces
- 🤖 APIs that are difficult to consume programmatically

This guide teaches you how to build a production-ready error handling system that solves these problems.

## Why Standardized Error Handling Matters

### The Problem

Without standardization, APIs often have inconsistent error responses:

```typescript
// Endpoint A returns this
{ "error": "User not found" }

// Endpoint B returns this
{ "success": false, "message": "Invalid credentials" }

// Endpoint C returns this
{ "status": "error", "error": { "type": "validation", "msg": "Bad input" } }
```

This inconsistency creates problems:
- **Frontend developers** must handle multiple error formats
- **Error tracking** becomes difficult (can't aggregate similar errors)
- **Debugging** is harder (no consistent error codes)
- **Documentation** becomes complex

### The Solution

A standardized error response format:

```typescript
{
  "success": false,
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "User with ID 123 not found",
    "context": { ... }  // Development only
  }
}
```

Benefits:
- ✅ Consistent structure across all endpoints
- ✅ Machine-readable error codes
- ✅ Human-readable messages
- ✅ Debugging context when needed
- ✅ Security-conscious (context hidden in production)

## Core Concepts

### 1. Operational vs Programming Errors

**Operational Errors** (Expected):
- User provides invalid input
- Database record not found
- External API is down
- Rate limit exceeded

These are **normal** parts of application operation and should be handled gracefully.

**Programming Errors** (Unexpected):
- Null reference errors
- Type errors
- Syntax errors
- Logic bugs

These indicate **bugs** in the code and should be logged and investigated.

### 2. HTTP Status Codes

Use appropriate HTTP status codes:

| Code | Meaning | Use Case |
|------|---------|----------|
| 400 | Bad Request | Invalid input, validation failures |
| 401 | Unauthorized | Not authenticated |
| 403 | Forbidden | Authenticated but lacks permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate entry, state conflict |
| 429 | Too Many Requests | Rate limiting |
| 500 | Internal Server Error | Unexpected server errors |

### 3. Error Codes

Use string codes that are:
- **Descriptive**: `USER_NOT_FOUND` not `E404`
- **Consistent**: Use same code for same error type
- **Namespaced**: `PAYMENT_FAILED` not just `FAILED`
- **Documented**: List all possible codes

## Custom Error Classes

### Why Custom Errors?

Standard JavaScript `Error` doesn't provide:
- HTTP status codes
- Error codes for machine parsing
- Context for debugging
- Operational vs programming distinction

### Base Error Class

```typescript
class AppError extends Error {
  public readonly isOperational: boolean;
  public readonly context?: Record<string, any>;

  constructor(
    message: string,
    public statusCode: number,
    public code: string,
    isOperational: boolean = true,
    context?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
    this.isOperational = isOperational;
    this.context = context;

    // Maintains proper stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}
```

**Key Features**:
1. **statusCode**: HTTP status to return
2. **code**: Machine-readable error code
3. **isOperational**: Distinguish expected vs unexpected errors
4. **context**: Additional debugging information
5. **Error.captureStackTrace**: Proper stack traces

### Specialized Error Classes

Create errors for specific use cases:

```typescript
class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 400, 'VALIDATION_ERROR', true, context);
    this.name = 'ValidationError';
  }
}

class NotFoundError extends AppError {
  constructor(resource: string = 'Resource', context?: Record<string, any>) {
    super(`${resource} not found`, 404, 'NOT_FOUND', true, context);
    this.name = 'NotFoundError';
  }
}
```

**Benefits**:
- Type safety
- Consistent status codes and error codes
- Self-documenting code
- Easy to extend

### Usage Example

```typescript
// Instead of
if (!user) {
  throw new Error('User not found');  // 😞 Generic 500 error
}

// Do this
if (!user) {
  throw new NotFoundError('User', { userId });  // ✅ Proper 404 error
}
```

## Error Response Formatting

### Standard Response Format

```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    context?: Record<string, any>;
  };
  // Special fields for specific errors
  retryAfter?: number;  // For rate limiting
  resetAt?: number;     // For rate limiting
}
```

### Format Function

```typescript
function formatErrorResponse(error: Error | AppError): ErrorResponse {
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (error instanceof AppError) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        context: isDevelopment ? error.context : undefined  // Security!
      }
    };
  }

  // Handle unexpected errors
  return {
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: isDevelopment
        ? error.message
        : 'An unexpected error occurred',  // Security!
      context: isDevelopment ? { stack: error.stack } : undefined
    }
  };
}
```

**Security Considerations**:
- ❌ Never expose stack traces in production
- ❌ Never expose internal implementation details
- ❌ Never expose database error details
- ✅ Hide context in production
- ✅ Generic messages for unexpected errors

## Central Error Handling

### The Problem

Without central handling, every endpoint duplicates error logic:

```typescript
export const GET: APIRoute = async (context) => {
  try {
    // ... your code
  } catch (error) {
    console.error(error);  // Inconsistent logging
    return new Response(
      JSON.stringify({ error: 'Server error' }),  // Inconsistent format
      { status: 500 }
    );
  }
};
```

### The Solution

Central error handler:

```typescript
function handleError(
  error: unknown,
  context?: APIContext,
  redirectPath?: string
): Response {
  const err = error instanceof Error ? error : new Error(String(error));

  // Automatic structured logging
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      log.error(err.message, { code: err.code, context: err.context });
    } else {
      log.warn(err.message, { code: err.code });
    }
  } else {
    log.error('Unhandled error', { message: err.message, stack: err.stack });
  }

  // Smart response type
  if (context && redirectPath) {
    return createErrorRedirect(err, redirectPath, context);
  }

  return createErrorResponse(err);
}
```

**Benefits**:
- ✅ Consistent logging
- ✅ Consistent error responses
- ✅ Automatic severity detection
- ✅ Support for both JSON and redirect responses

### Async Handler Wrapper

Wrap handlers to automatically catch errors:

```typescript
function asyncHandler(
  handler: (context: APIContext) => Promise<Response>,
  redirectPath?: string
) {
  return async (context: APIContext): Promise<Response> => {
    try {
      return await handler(context);
    } catch (error) {
      return handleError(error, context, redirectPath);
    }
  };
}
```

**Usage**:

```typescript
// Instead of manual try-catch
export const POST: APIRoute = async (context) => {
  try {
    // ... your code
  } catch (error) {
    // ... error handling
  }
};

// Wrap with asyncHandler
export const POST: APIRoute = asyncHandler(async (context) => {
  // ... your code (errors automatically handled!)
});
```

## Database Error Mapping

### The Problem

Database errors are cryptic:

```
error: duplicate key value violates unique constraint "users_email_key"
Detail: Key (email)=(test@example.com) already exists.
```

This should become:
```
ConflictError: Email address is already registered
```

### PostgreSQL Error Codes

Common error codes:
- `23505` - Unique constraint violation (duplicate)
- `23503` - Foreign key violation (referenced record doesn't exist)
- `23502` - Not null violation (required field missing)
- `22P02` - Invalid text representation (type conversion error)

### Error Mapper Function

```typescript
function mapDatabaseError(error: any): AppError {
  // Unique constraint violation
  if (error.code === '23505') {
    return new ConflictError('A record with this value already exists', {
      constraint: error.constraint,
    });
  }

  // Foreign key violation
  if (error.code === '23503') {
    return new ValidationError('Referenced record does not exist', {
      constraint: error.constraint,
    });
  }

  // Not null violation
  if (error.code === '23502') {
    return new ValidationError('Required field is missing', {
      column: error.column,
    });
  }

  // Generic database error (hide details in production)
  return new DatabaseError('Database operation failed', {
    code: error.code,
    detail: process.env.NODE_ENV === 'development' ? error.detail : undefined,
  });
}
```

**Usage**:

```typescript
try {
  await pool.query('INSERT INTO users ...', [email, password]);
} catch (error) {
  throw mapDatabaseError(error);  // Converts to user-friendly error
}
```

## Best Practices

### 1. Use Specific Error Classes

❌ **Bad**:
```typescript
throw new Error('Validation failed');
```

✅ **Good**:
```typescript
throw new ValidationError('Email format is invalid', {
  field: 'email',
  providedValue: email
});
```

### 2. Provide Context for Debugging

❌ **Bad**:
```typescript
throw new NotFoundError('User');
```

✅ **Good**:
```typescript
throw new NotFoundError('User', {
  userId,
  requestedBy: context.user?.id,
  timestamp: new Date().toISOString()
});
```

### 3. Use Assert Helpers for Validation

❌ **Bad**:
```typescript
if (!email) {
  throw new ValidationError('Email is required');
}
if (email.length > 255) {
  throw new ValidationError('Email is too long');
}
if (!email.includes('@')) {
  throw new ValidationError('Invalid email format');
}
```

✅ **Good**:
```typescript
assert(email, 'Email is required');
assert(email.length <= 255, 'Email is too long');
assert(email.includes('@'), 'Invalid email format');
```

### 4. Log with Structured Logger

❌ **Bad**:
```typescript
console.error('Error:', error);
console.log('User:', user);
```

✅ **Good**:
```typescript
log.error('User creation failed', {
  error,
  userId: user?.id,
  operation: 'create_user'
});
```

### 5. Don't Mix Error Handling Patterns

❌ **Bad**:
```typescript
// Mixing callbacks, promises, and try-catch
getUserById(id, (err, user) => {
  if (err) throw err;

  updateUser(user)
    .then(result => /* ... */)
    .catch(error => /* ... */);
});
```

✅ **Good**:
```typescript
// Consistent async/await with try-catch
try {
  const user = await getUserById(id);
  const result = await updateUser(user);
  return result;
} catch (error) {
  throw mapDatabaseError(error);
}
```

### 6. Handle Errors at the Right Level

**Low Level** (Data Access):
```typescript
// Throw specific errors
async function getUserByEmail(email: string): Promise<User> {
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

  if (result.rows.length === 0) {
    throw new NotFoundError('User', { email });
  }

  return result.rows[0];
}
```

**High Level** (API Route):
```typescript
// Let errors bubble up, handle centrally
export const GET: APIRoute = asyncHandler(async (context) => {
  const email = context.url.searchParams.get('email');
  assert(email, 'Email parameter is required');

  const user = await getUserByEmail(email);  // May throw NotFoundError

  return new Response(JSON.stringify({ success: true, user }));
});
```

## Common Pitfalls

### 1. Swallowing Errors

❌ **Bad**:
```typescript
try {
  await criticalOperation();
} catch (error) {
  console.log('Error occurred');  // Error lost!
}
```

✅ **Good**:
```typescript
try {
  await criticalOperation();
} catch (error) {
  log.error('Critical operation failed', { error });
  throw error;  // Re-throw or handle appropriately
}
```

### 2. Exposing Sensitive Information

❌ **Bad**:
```typescript
return new Response(
  JSON.stringify({
    error: error.stack,  // Exposes file paths, code structure
    sql: error.query,    // Exposes database schema
    env: process.env     // Exposes secrets
  })
);
```

✅ **Good**:
```typescript
return createErrorResponse(error);  // Sanitized automatically
```

### 3. Using Generic Error Messages

❌ **Bad**:
```typescript
if (!user) throw new Error('Error');
if (!canDelete) throw new Error('Error');
if (!isValid) throw new Error('Error');
```

✅ **Good**:
```typescript
if (!user) throw new NotFoundError('User', { userId });
if (!canDelete) throw new ForbiddenError('Cannot delete this resource');
if (!isValid) throw new ValidationError('Input validation failed', { errors });
```

### 4. Catching Errors Too Early

❌ **Bad**:
```typescript
async function getUser(id: string) {
  try {
    return await db.query('SELECT * FROM users WHERE id = $1', [id]);
  } catch (error) {
    return null;  // Loses error information
  }
}
```

✅ **Good**:
```typescript
async function getUser(id: string) {
  // Let error bubble up to be handled centrally
  const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);

  if (result.rows.length === 0) {
    throw new NotFoundError('User', { userId: id });
  }

  return result.rows[0];
}
```

### 5. Not Validating Early

❌ **Bad**:
```typescript
export const POST: APIRoute = async (context) => {
  const data = await context.request.json();

  // Process data first, validate later
  await saveToDatabase(data);
  await sendEmail(data.email);

  // Oops, now we validate
  if (!data.email) {
    throw new ValidationError('Email required');  // Too late!
  }
};
```

✅ **Good**:
```typescript
export const POST: APIRoute = asyncHandler(async (context) => {
  const data = await context.request.json();

  // Validate first
  assert(data.email, 'Email is required');
  assert(isValidEmail(data.email), 'Invalid email format');

  // Then process
  await saveToDatabase(data);
  await sendEmail(data.email);
});
```

## Real-World Examples

### Example 1: User Registration Endpoint

```typescript
import { asyncHandler, ValidationError, ConflictError, mapDatabaseError } from '@/lib/errors';
import { log } from '@/lib/logger';

export const POST: APIRoute = asyncHandler(async (context) => {
  const formData = await context.request.formData();
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  // Validate inputs
  assert(email, 'Email is required');
  assert(password, 'Password is required');
  assert(password.length >= 8, 'Password must be at least 8 characters');

  // Hash password
  const passwordHash = await hashPassword(password);

  // Insert user
  try {
    const result = await pool.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id',
      [email, passwordHash]
    );

    log.info('User registered successfully', {
      userId: result.rows[0].id,
      email: email  // PII auto-redacted in production by logger
    });

    return new Response(
      JSON.stringify({
        success: true,
        userId: result.rows[0].id
      }),
      { status: 201 }
    );
  } catch (error) {
    throw mapDatabaseError(error);  // Converts to ConflictError if email exists
  }
}, '/register');  // Redirect path for errors
```

### Example 2: Protected Resource Access

```typescript
export const GET: APIRoute = asyncHandler(async (context) => {
  // Check authentication
  const user = await getSessionUser(context);
  if (!user) {
    throw new UnauthorizedError('Authentication required');
  }

  // Get resource
  const resourceId = context.params.id;
  const resource = await getResource(resourceId);

  if (!resource) {
    throw new NotFoundError('Resource', { resourceId });
  }

  // Check authorization
  if (resource.userId !== user.id && user.role !== 'admin') {
    throw new ForbiddenError('You do not have permission to access this resource', {
      resourceId,
      userId: user.id,
      resourceOwnerId: resource.userId
    });
  }

  log.info('Resource accessed', {
    resourceId,
    userId: user.id
  });

  return new Response(JSON.stringify({ success: true, resource }));
});
```

### Example 3: Payment Processing

```typescript
export const POST: APIRoute = asyncHandler(async (context) => {
  const { orderId, paymentMethod } = await context.request.json();

  // Validate
  assertExists(orderId, 'Order ID is required');
  assertExists(paymentMethod, 'Payment method is required');

  // Get order
  const order = await getOrder(orderId);
  if (!order) {
    throw new NotFoundError('Order', { orderId });
  }

  // Check order state
  if (order.status !== 'pending') {
    throw new BusinessLogicError(
      `Cannot process payment for ${order.status} order`,
      422,
      { orderId, currentStatus: order.status }
    );
  }

  // Process payment
  try {
    const charge = await stripe.charges.create({
      amount: order.total,
      currency: 'usd',
      source: paymentMethod
    });

    await updateOrderStatus(orderId, 'paid', charge.id);

    log.info('Payment processed successfully', {
      orderId,
      chargeId: charge.id,
      amount: order.total
    });

    return new Response(
      JSON.stringify({ success: true, chargeId: charge.id }),
      { status: 200 }
    );
  } catch (error: any) {
    // Map Stripe errors to app errors
    if (error.type === 'StripeCardError') {
      throw new PaymentError(error.message, 402, {
        code: error.code,
        declineCode: error.decline_code
      });
    }

    throw new PaymentError('Payment processing failed', 500, {
      stripeErrorType: error.type
    });
  }
});
```

## Summary

**Key Takeaways**:

1. ✅ Use custom error classes for type safety and consistency
2. ✅ Provide meaningful error codes and messages
3. ✅ Include context for debugging (hide in production)
4. ✅ Use central error handling for consistency
5. ✅ Map database errors to user-friendly messages
6. ✅ Validate early and fail fast
7. ✅ Log errors with structured logging
8. ✅ Use appropriate HTTP status codes
9. ✅ Distinguish operational from programming errors
10. ✅ Never expose sensitive information in errors

**Remember**:
- Good error handling improves user experience
- Good error handling improves developer experience
- Good error handling improves security
- Good error handling improves maintainability

Build your APIs with robust error handling from the start, not as an afterthought!

## Additional Resources

- [MDN: Error Handling](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Control_flow_and_error_handling)
- [HTTP Status Codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)
- [PostgreSQL Error Codes](https://www.postgresql.org/docs/current/errcodes-appendix.html)
- [Node.js Error Handling Best Practices](https://nodejs.org/en/docs/guides/error-handling/)

---

**Next Steps**: Apply these patterns to your existing API endpoints for consistent, robust error handling across your entire application!
