# T115: Review Submission API Endpoint - Learning Guide

**Task ID**: T115  
**Topic**: RESTful API Endpoint Development  
**Level**: Intermediate  
**Date**: 2025-11-06

---

## Table of Contents
1. [What is an API Endpoint?](#what-is-an-api-endpoint)
2. [Why Build API Endpoints?](#why-build-api-endpoints)
3. [RESTful API Design](#restful-api-design)
4. [Astro API Routes](#astro-api-routes)
5. [Authentication & Authorization](#authentication--authorization)
6. [Input Validation](#input-validation)
7. [Error Handling](#error-handling)
8. [Security Best Practices](#security-best-practices)
9. [Testing API Endpoints](#testing-api-endpoints)

---

## What is an API Endpoint?

An **API endpoint** is a specific URL in your application that accepts requests and returns responses, typically in JSON format. It's the entry point for external systems or clients to interact with your backend.

### Anatomy of an API Endpoint

```
Method: POST
URL: https://example.com/api/reviews/submit
Headers:
  Content-Type: application/json
  Cookie: session=...
Body:
  {
    "courseId": "uuid",
    "rating": 5,
    "comment": "Great course!"
  }

Response:
  Status: 201 Created
  Body:
    {
      "success": true,
      "review": { ... }
    }
```

**Components**:
- **HTTP Method**: POST, GET, PUT, DELETE, PATCH
- **URL Path**: `/api/reviews/submit`
- **Headers**: Content-Type, Authorization, Cookies
- **Request Body**: JSON data (for POST/PUT/PATCH)
- **Response**: Status code + JSON body

---

## Why Build API Endpoints?

### 1. Separation of Concerns
```
Frontend (UI) ←→ API Endpoint ←→ Backend (Database)
```
- Frontend handles presentation
- API handles business logic
- Database handles data storage

### 2. Reusability
```typescript
// Same API used by:
- Web app (Astro pages)
- Mobile app (React Native)
- Third-party integrations
- Testing tools (Postman)
```

### 3. Security
```typescript
// API can enforce:
- Authentication (who are you?)
- Authorization (what can you do?)
- Rate limiting
- Input validation
```

### 4. Flexibility
```typescript
// Frontend can be rebuilt without changing API
// Multiple clients can use same API
// API versioning allows gradual changes
```

---

## RESTful API Design

**REST** (Representational State Transfer) is an architectural style for APIs.

### HTTP Methods

| Method | Purpose | Example |
|--------|---------|---------|
| GET | Retrieve data | GET /api/reviews/:id |
| POST | Create new resource | POST /api/reviews/submit |
| PUT | Update entire resource | PUT /api/reviews/:id |
| PATCH | Update part of resource | PATCH /api/reviews/:id |
| DELETE | Delete resource | DELETE /api/reviews/:id |

### Status Codes

| Code | Meaning | When to Use |
|------|---------|-------------|
| 200 | OK | Successful GET/PUT/PATCH |
| 201 | Created | Successful POST |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Validation error |
| 401 | Unauthorized | Not authenticated |
| 403 | Forbidden | Not authorized |
| 404 | Not Found | Resource doesn't exist |
| 500 | Server Error | Unexpected error |

### RESTful URL Structure

```typescript
// Good (RESTful)
POST   /api/reviews          - Create review
GET    /api/reviews/:id      - Get specific review
GET    /api/reviews          - List reviews
PUT    /api/reviews/:id      - Update review
DELETE /api/reviews/:id      - Delete review

// Bad (Not RESTful)
GET    /api/createReview     - Wrong method
POST   /api/getReview        - Wrong method
GET    /api/review-update    - Verbs in URL
```

### Request/Response Format

**Request** (JSON):
```json
{
  "courseId": "uuid",
  "rating": 5,
  "comment": "Great course!"
}
```

**Response** (JSON):
```json
{
  "success": true,
  "review": {
    "id": "uuid",
    "rating": 5,
    "comment": "Great course!"
  }
}
```

**Consistency**:
- Always use JSON
- Use camelCase for property names
- Include success flag
- Nest data in named objects

---

## Astro API Routes

Astro provides file-based API routes in the `src/pages/api/` directory.

### File Structure

```
src/pages/api/
  reviews/
    submit.ts          → POST /api/reviews/submit
    [id].ts            → GET /api/reviews/:id
  courses/
    [id].ts            → GET /api/courses/:id
```

### Basic Endpoint

```typescript
// src/pages/api/reviews/submit.ts
import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, cookies }) => {
  // 1. Parse request
  const body = await request.json();
  
  // 2. Process request
  const result = await processReview(body);
  
  // 3. Return response
  return new Response(JSON.stringify(result), {
    status: 201,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};
```

### Multiple Methods

```typescript
// Support multiple HTTP methods
export const GET: APIRoute = async ({ params }) => {
  // Handle GET
};

export const POST: APIRoute = async ({ request }) => {
  // Handle POST
};

export const DELETE: APIRoute = async ({ params }) => {
  // Handle DELETE
};
```

### Request Context

```typescript
export const POST: APIRoute = async (context) => {
  const {
    request,    // Fetch API Request
    params,     // URL parameters {:id}
    cookies,    // Cookie management
    url,        // Full URL object
    redirect,   // Redirect helper
    locals,     // Middleware data
  } = context;
};
```

---

## Authentication & Authorization

### Authentication (Who are you?)

**Session-Based Authentication**:
```typescript
import { getSessionFromRequest } from '@/lib/auth/session';

const session = await getSessionFromRequest(cookies);
if (!session) {
  throw new AuthenticationError('You must be logged in');
}
```

**What it does**:
1. Reads session cookie from request
2. Validates session in Redis
3. Returns user information
4. Throws error if invalid/expired

### Authorization (What can you do?)

**Check User Permissions**:
```typescript
// Verify user owns resource
if (requestUserId !== session.userId) {
  throw new AuthorizationError('You can only submit reviews for yourself');
}

// Check business rules
const hasPurchased = await checkPurchase(session.userId, courseId);
if (!hasPurchased) {
  throw new AuthorizationError('You must purchase the course first');
}
```

### Error Responses

```typescript
// 401 Unauthorized
{
  "success": false,
  "error": {
    "message": "You must be logged in",
    "code": "AUTHENTICATION_ERROR"
  }
}

// 403 Forbidden
{
  "success": false,
  "error": {
    "message": "You can only submit reviews for yourself",
    "code": "AUTHORIZATION_ERROR"
  }
}
```

---

## Input Validation

### Why Validate Input?

1. **Security**: Prevent SQL injection, XSS, command injection
2. **Data Integrity**: Ensure correct data types and formats
3. **User Experience**: Provide clear error messages
4. **Business Logic**: Enforce business rules

### Validation Layers

```
1. Type Checking (TypeScript)
   ↓
2. Runtime Validation (API endpoint)
   ↓
3. Business Rules (Service layer)
   ↓
4. Database Constraints (Database)
```

### Step-by-Step Validation

**1. Parse Request Body**:
```typescript
let body: any;
try {
  body = await request.json();
} catch (err) {
  throw new ValidationError('Invalid JSON in request body');
}
```

**2. Check Required Fields**:
```typescript
const { courseId, rating, comment } = body;

if (!courseId || typeof courseId !== 'string') {
  throw new ValidationError('Course ID is required');
}
```

**3. Validate Data Types**:
```typescript
if (typeof rating !== 'number') {
  throw new ValidationError('Rating must be a number');
}
```

**4. Validate Ranges**:
```typescript
if (rating < 1 || rating > 5) {
  throw new ValidationError('Rating must be between 1 and 5');
}
```

**5. Validate Lengths**:
```typescript
if (comment && comment.length > 1000) {
  throw new ValidationError('Comment must not exceed 1000 characters');
}
```

### Validation Helpers

```typescript
// Reusable validation functions
function validateRequired(value: any, fieldName: string) {
  if (!value) {
    throw new ValidationError(`${fieldName} is required`);
  }
}

function validateRange(value: number, min: number, max: number, fieldName: string) {
  if (value < min || value > max) {
    throw new ValidationError(`${fieldName} must be between ${min} and ${max}`);
  }
}

function validateLength(value: string, max: number, fieldName: string) {
  if (value.length > max) {
    throw new ValidationError(`${fieldName} must not exceed ${max} characters`);
  }
}
```

---

## Error Handling

### Error Types

```typescript
// Custom error classes
class ValidationError extends Error {
  statusCode = 400;
  code = 'VALIDATION_ERROR';
}

class AuthenticationError extends Error {
  statusCode = 401;
  code = 'AUTHENTICATION_ERROR';
}

class AuthorizationError extends Error {
  statusCode = 403;
  code = 'AUTHORIZATION_ERROR';
}
```

### Try-Catch Pattern

```typescript
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Happy path
    const result = await processRequest();
    return successResponse(result);
    
  } catch (error) {
    // Error path
    return errorResponse(error);
  }
};
```

### Error Logging

```typescript
catch (error) {
  // Log for debugging
  logError(error, {
    endpoint: 'POST /api/reviews/submit',
    timestamp: new Date().toISOString(),
    userId: session?.userId,
  });
  
  // Return sanitized error
  return errorResponse(error);
}
```

### Error Normalization

```typescript
function normalizeError(error: unknown) {
  // Convert any error to consistent format
  if (error instanceof ValidationError) {
    return {
      statusCode: 400,
      message: error.message,
      code: 'VALIDATION_ERROR',
    };
  }
  
  if (error instanceof AuthenticationError) {
    return {
      statusCode: 401,
      message: error.message,
      code: 'AUTHENTICATION_ERROR',
    };
  }
  
  // Unknown errors
  return {
    statusCode: 500,
    message: 'An unexpected error occurred',
    code: 'INTERNAL_ERROR',
  };
}
```

### Error Response Format

```typescript
{
  "success": false,
  "error": {
    "message": "Rating must be between 1 and 5",
    "code": "VALIDATION_ERROR",
    "fields": {
      "rating": "Must be between 1 and 5"
    }
  }
}
```

**Never expose**:
- Stack traces
- Database errors
- Internal file paths
- Sensitive configuration

---

## Security Best Practices

### 1. SQL Injection Prevention

**Bad** (Vulnerable):
```typescript
const query = `SELECT * FROM reviews WHERE course_id = '${courseId}'`;
// Attacker can inject: '; DROP TABLE reviews; --
```

**Good** (Safe):
```typescript
const query = 'SELECT * FROM reviews WHERE course_id = $1';
const result = await pool.query(query, [courseId]);
// Uses parameterized queries
```

### 2. XSS Prevention

**Storage**:
```typescript
// Store raw user input (don't modify)
await saveComment(comment);
// Escaping happens on output, not input
```

**Output Escaping** (in components):
```astro
<!-- Astro automatically escapes -->
<p>{comment}</p>

<!-- React automatically escapes -->
<div>{comment}</div>
```

### 3. Authentication

```typescript
// Always check session
const session = await getSessionFromRequest(cookies);
if (!session) {
  throw new AuthenticationError('Not authenticated');
}

// Use session user ID, not request body
const userId = session.userId; // ✅ Trusted
// NOT: const userId = body.userId; // ❌ Untrusted
```

### 4. Authorization

```typescript
// Check ownership
if (resourceOwnerId !== session.userId) {
  throw new AuthorizationError('Not authorized');
}

// Check business rules
if (!await hasPermission(session.userId, action)) {
  throw new AuthorizationError('Not authorized');
}
```

### 5. Rate Limiting

```typescript
// Limit requests per user
const rateLimit = await checkRateLimit(session.userId, 'submit-review');
if (rateLimit.exceeded) {
  throw new Error('Too many requests');
}
```

### 6. HTTPS Only

```typescript
// Ensure secure connections
if (!request.url.startsWith('https://')) {
  return redirect('https://' + request.url.slice(7));
}
```

### 7. Input Sanitization

```typescript
// Trim whitespace
const comment = body.comment?.trim();

// Remove null bytes
const courseId = body.courseId.replace(/\0/g, '');

// Validate UUIDs
if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(courseId)) {
  throw new ValidationError('Invalid course ID format');
}
```

---

## Testing API Endpoints

### Unit Tests

Test individual functions and validation logic:

```typescript
describe('Rating Validation', () => {
  it('should reject rating less than 1', () => {
    expect(() => validateRating(0)).toThrow('Rating must be between 1 and 5');
  });
  
  it('should accept rating of 5', () => {
    expect(() => validateRating(5)).not.toThrow();
  });
});
```

### Integration Tests

Test endpoint with mocked dependencies:

```typescript
describe('POST /api/reviews/submit', () => {
  it('should create review with valid input', async () => {
    const mockSession = { userId: 'user-1' };
    const mockReviewService = { createReview: vi.fn() };
    
    const response = await submitReview({
      courseId: 'course-1',
      rating: 5,
    }, mockSession, mockReviewService);
    
    expect(response.status).toBe(201);
    expect(mockReviewService.createReview).toHaveBeenCalled();
  });
});
```

### E2E Tests

Test complete flow with real HTTP requests:

```typescript
test('User can submit review', async ({ page }) => {
  await page.goto('/courses/meditation-101');
  await page.fill('textarea[name="comment"]', 'Great course!');
  await page.click('button:has-text("5 stars")');
  await page.click('button:has-text("Submit Review")');
  
  await expect(page.locator('.review')).toContainText('Great course!');
});
```

### Manual Testing with cURL

```bash
# Test successful submission
curl -X POST https://localhost:4321/api/reviews/submit \
  -H "Content-Type: application/json" \
  -H "Cookie: session=..." \
  -d '{
    "courseId": "uuid",
    "rating": 5,
    "comment": "Great course!"
  }'

# Test validation error
curl -X POST https://localhost:4321/api/reviews/submit \
  -H "Content-Type: application/json" \
  -H "Cookie: session=..." \
  -d '{
    "courseId": "uuid",
    "rating": 6
  }'

# Test authentication error
curl -X POST https://localhost:4321/api/reviews/submit \
  -H "Content-Type: application/json" \
  -d '{
    "courseId": "uuid",
    "rating": 5
  }'
```

---

## Common Patterns

### Pattern 1: Request Validation

```typescript
// Validate request body
const { courseId, rating, comment } = await validateRequestBody(request, {
  courseId: { type: 'string', required: true },
  rating: { type: 'number', required: true, min: 1, max: 5 },
  comment: { type: 'string', maxLength: 1000 },
});
```

### Pattern 2: Service Layer

```typescript
// Separate business logic from API handling
export const POST: APIRoute = async ({ request, cookies }) => {
  const session = await authenticate(cookies);
  const data = await parseRequest(request);
  
  // Service handles all business logic
  const result = await ReviewService.createReview(session.userId, data);
  
  return successResponse(result, 201);
};
```

### Pattern 3: Response Helpers

```typescript
// Consistent response format
function successResponse(data: any, status = 200) {
  return new Response(JSON.stringify({
    success: true,
    ...data,
  }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function errorResponse(error: any) {
  const normalized = normalizeError(error);
  return new Response(JSON.stringify({
    success: false,
    error: normalized,
  }), {
    status: normalized.statusCode,
    headers: { 'Content-Type': 'application/json' },
  });
}
```

---

## Key Takeaways

1. **API endpoints** provide programmatic access to backend functionality
2. **RESTful design** uses HTTP methods and status codes correctly
3. **Astro API routes** are file-based in `src/pages/api/`
4. **Always authenticate** before processing requests
5. **Validate all input** at multiple layers
6. **Handle errors gracefully** with consistent format
7. **Security first**: Prevent SQL injection, XSS, and unauthorized access
8. **Test thoroughly**: Unit, integration, and E2E tests
9. **Use TypeScript** for type safety
10. **Separate concerns**: API → Service → Database

---

## Resources

### Official Documentation
- **Astro API Routes**: https://docs.astro.build/en/core-concepts/endpoints/
- **REST API Design**: https://restfulapi.net/
- **HTTP Status Codes**: https://httpstatuses.com/

### Security
- **OWASP API Security**: https://owasp.org/www-project-api-security/
- **SQL Injection**: https://owasp.org/www-community/attacks/SQL_Injection
- **XSS Prevention**: https://owasp.org/www-community/attacks/xss/

### Testing
- **Vitest**: https://vitest.dev/
- **API Testing**: https://www.postman.com/api-testing/

---

## Conclusion

Building secure, well-designed API endpoints is crucial for modern web applications. Follow RESTful principles, validate all input, handle errors gracefully, and test thoroughly. This endpoint demonstrates best practices for authentication, authorization, validation, and error handling.

---

**Last Updated**: 2025-11-06  
**Author**: Claude Code (Anthropic)  
**Version**: 1.0  
**Related Tasks**: T114 (Review Form), T116 (Review Display)
