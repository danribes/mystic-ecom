# T069: Admin Courses API - Learning Guide

**Task:** Create admin courses API endpoints (POST/PUT/DELETE/PATCH) for course CRUD operations
**Difficulty:** Intermediate
**Topics:** RESTful API Design, Input Validation, Authentication, Error Handling
**Date:** 2025-11-04

---

## Table of Contents

1. [What We Built](#what-we-built)
2. [Why We Built It This Way](#why-we-built-it-this-way)
3. [How It Works](#how-it-works)
4. [Key Concepts Explained](#key-concepts-explained)
5. [Design Patterns Used](#design-patterns-used)
6. [Security Considerations](#security-considerations)
7. [Common Pitfalls](#common-pitfalls)
8. [Best Practices](#best-practices)
9. [Further Learning](#further-learning)

---

## What We Built

We created a comprehensive **RESTful API** for managing courses in an admin context. This API provides four HTTP endpoints for complete CRUD (Create, Read, Update, Delete) operations:

### 1. POST /api/admin/courses
**Purpose:** Create new courses
**Use Case:** Admin wants to add a new course to the platform
**Example:** Creating "Introduction to TypeScript" course

### 2. PUT /api/admin/courses
**Purpose:** Update existing courses
**Use Case:** Admin needs to change course price or update content
**Example:** Updating course price from $49.99 to $59.99

### 3. DELETE /api/admin/courses?id=...
**Purpose:** Remove courses from the platform
**Use Case:** Admin wants to remove outdated or cancelled courses
**Example:** Deleting a deprecated course

### 4. PATCH /api/admin/courses
**Purpose:** Publish or unpublish courses
**Use Case:** Admin wants to make a course visible/hidden to users
**Example:** Publishing a course after review

---

## Why We Built It This Way

### 1. Separation of Concerns

**Decision:** Split API layer from business logic (service layer)

**Why:**
```
API Layer (courses.ts)          Service Layer (course.service.ts)
├─ HTTP handling                ├─ Business logic
├─ Input validation             ├─ Database queries
├─ Authentication               ├─ Data transformation
├─ Response formatting          └─ Complex operations
└─ Error handling
```

**Benefits:**
- ✅ **Testability:** Can test API and business logic separately
- ✅ **Reusability:** Service functions can be called from multiple places
- ✅ **Maintainability:** Changes to business logic don't affect API contract
- ✅ **Clarity:** Each layer has a clear, single responsibility

**Example:**
```typescript
// API Layer: Handles HTTP, validates input
const putHandler: APIRoute = async (context) => {
  const validatedData = UpdateCourseSchema.safeParse(body);
  // ...
  const updatedCourse = await updateCourse(id, cleanedData); // Call service
  return new Response(JSON.stringify({ success: true, data: updatedCourse }));
};

// Service Layer: Handles business logic
export async function updateCourse(id: string, data: UpdateCourseInput) {
  // Complex database queries, validation, transformations
  const course = await db.courses.update({ where: { id }, data });
  return course;
}
```

---

### 2. Zod for Runtime Validation

**Decision:** Use Zod schemas instead of TypeScript types alone

**Why TypeScript Types Aren't Enough:**
```typescript
// TypeScript types only check at COMPILE time
interface CourseInput {
  title: string;
  price: number;
}

// At runtime, JavaScript doesn't enforce types:
const data = { title: 123, price: "invalid" }; // No error at runtime!
const course = createCourse(data); // Would fail in database
```

**Zod Provides Runtime Validation:**
```typescript
const CreateCourseSchema = z.object({
  title: z.string().min(3).max(200),
  price: z.number().min(0),
});

// At runtime, Zod validates the actual data:
const result = CreateCourseSchema.safeParse(data);
if (!result.success) {
  // Returns detailed error messages
  console.log(result.error.errors);
}
```

**Benefits:**
- ✅ **Type Safety at Runtime:** Validates actual data, not just compiler checks
- ✅ **Clear Error Messages:** Tells users exactly what's wrong
- ✅ **Prevents Invalid Data:** Catches bad data before database operations
- ✅ **API Documentation:** Schema serves as API contract

---

### 3. RESTful HTTP Method Design

**Decision:** Use appropriate HTTP methods for each operation

**Why:**
```
POST   → Create new resource     → 201 Created
PUT    → Update entire resource  → 200 OK
PATCH  → Partial update          → 200 OK
DELETE → Remove resource         → 200 OK
GET    → Read resource           → 200 OK
```

**Our Implementation:**
- **POST** `/api/admin/courses` - Creates new course (returns 201)
- **PUT** `/api/admin/courses` - Updates course (partial updates allowed)
- **PATCH** `/api/admin/courses` - Special action (publish/unpublish)
- **DELETE** `/api/admin/courses?id=...` - Deletes course (ID in query)

**Why DELETE uses query parameter:**
```typescript
// RESTful convention for DELETE:
DELETE /api/admin/courses?id=550e8400-e29b-41d4-a716-446655440000

// NOT in request body (body often ignored in DELETE):
DELETE /api/admin/courses
Body: { "id": "..." } // ❌ Less conventional
```

---

### 4. Authentication Middleware Pattern

**Decision:** Use `withAdminAuth` wrapper instead of inline auth checks

**Without Middleware (❌ Bad):**
```typescript
export const POST: APIRoute = async (context) => {
  // Duplicate auth logic in EVERY endpoint
  const session = context.locals.session;
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  if (session.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  }

  // Actual endpoint logic...
};
```

**With Middleware (✅ Good):**
```typescript
const postHandler: APIRoute = async (context) => {
  // No auth logic here - middleware handles it
  // Just focus on business logic
  const course = await createCourse(data);
  return new Response(JSON.stringify({ success: true, data: course }));
};

// Wrap handler with auth middleware
export const POST = withAdminAuth(postHandler);
```

**Benefits:**
- ✅ **DRY (Don't Repeat Yourself):** Auth logic in one place
- ✅ **Consistency:** All admin endpoints protected the same way
- ✅ **Maintainability:** Update auth logic in one place
- ✅ **Testability:** Can mock middleware in tests

---

## How It Works

### Request Flow Diagram

```
1. Client Request
   │
   ├─→ POST /api/admin/courses
   │   Body: { title: "...", price: 4999, ... }
   │
2. Astro Router
   │
   ├─→ Routes to /src/pages/api/admin/courses.ts
   │
3. Admin Auth Middleware (withAdminAuth)
   │
   ├─→ Check session exists
   ├─→ Check user role === 'admin'
   │   ├─ ❌ Not authenticated → 401 Unauthorized
   │   ├─ ❌ Not admin → 403 Forbidden
   │   └─ ✅ Is admin → Continue
   │
4. POST Handler (postHandler)
   │
   ├─→ Parse JSON body
   ├─→ Validate with Zod schema
   │   ├─ ❌ Invalid → 400 Bad Request
   │   └─ ✅ Valid → Continue
   │
5. Service Layer (createCourse)
   │
   ├─→ Execute database query
   ├─→ Create course record
   │   ├─ ❌ Database error → throw Error
   │   └─ ✅ Success → return course
   │
6. Response Handling
   │
   ├─→ Log admin action
   ├─→ Format response
   └─→ Return 201 Created with course data

7. Client Receives Response
   └─→ { success: true, data: { id: "...", title: "..." } }
```

---

### Code Flow Example: Creating a Course

**Step 1: Client makes request**
```javascript
// From admin panel frontend
const response = await fetch('/api/admin/courses', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'TypeScript Fundamentals',
    slug: 'typescript-fundamentals',
    description: 'Learn TypeScript from scratch',
    instructorId: '660e8400-e29b-41d4-a716-446655440000',
    price: 4999,
    duration: 3600,
    level: 'beginner',
    category: 'Programming'
  })
});
```

**Step 2: Request reaches Astro**
```typescript
// Astro routes to /src/pages/api/admin/courses.ts
// Calls: export const POST = withAdminAuth(postHandler);
```

**Step 3: Auth middleware runs**
```typescript
// Inside withAdminAuth (from adminAuth.ts)
export function withAdminAuth(handler: APIRoute): APIRoute {
  return async (context: APIContext) => {
    const session = context.locals.session;

    // Check authentication
    if (!session || !session.userId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authentication required' }),
        { status: 401 }
      );
    }

    // Check admin role
    if (session.role !== 'admin') {
      return new Response(
        JSON.stringify({ success: false, error: 'Admin access required' }),
        { status: 403 }
      );
    }

    // User is authenticated admin - call actual handler
    return handler(context);
  };
}
```

**Step 4: POST handler runs**
```typescript
const postHandler: APIRoute = async (context) => {
  // Parse request body
  const body = await context.request.json();

  // Validate with Zod
  const validatedData = CreateCourseSchema.safeParse(body);

  if (!validatedData.success) {
    // Return validation errors
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Invalid course data',
        details: validatedData.error.errors
      }),
      { status: 400 }
    );
  }

  // Call service layer
  const course = await createCourse(validatedData.data);

  // Log admin action
  console.log('[ADMIN-COURSES] Course created:', {
    courseId: course.id,
    title: course.title,
    adminId: context.locals.session?.userId,
  });

  // Return success response
  return new Response(
    JSON.stringify({
      success: true,
      data: course,
      message: 'Course created successfully'
    }),
    { status: 201 }
  );
};
```

**Step 5: Service layer executes**
```typescript
// Inside course.service.ts
export async function createCourse(input: CreateCourseInput) {
  // Additional validation (instructor exists, etc.)
  // Database transaction
  // Create course record
  // Return created course
}
```

**Step 6: Client receives response**
```javascript
const data = await response.json();
// {
//   success: true,
//   data: {
//     id: '550e8400-e29b-41d4-a716-446655440000',
//     title: 'TypeScript Fundamentals',
//     slug: 'typescript-fundamentals',
//     ...
//   },
//   message: 'Course created successfully'
// }
```

---

## Key Concepts Explained

### 1. RESTful API Design

**What is REST?**
REST (Representational State Transfer) is an architectural style for designing networked applications. It uses HTTP methods to perform operations on resources.

**Key Principles:**

#### Resource-Based URLs
```
Good (Resource-based):
/api/admin/courses          → courses collection
/api/admin/courses?id=123   → specific course

Bad (Action-based):
/api/admin/createCourse     → ❌
/api/admin/deleteCourse     → ❌
```

#### HTTP Methods for Actions
```
POST   /api/admin/courses           → Create new course
GET    /api/admin/courses           → List all courses
GET    /api/admin/courses?id=123    → Get one course
PUT    /api/admin/courses           → Update course
DELETE /api/admin/courses?id=123    → Delete course
```

#### Stateless Communication
Each request contains all necessary information (authentication, parameters, body). Server doesn't store client state between requests.

#### Standard HTTP Status Codes
```
200 OK              → Success (read, update, delete)
201 Created         → Success (create)
400 Bad Request     → Client error (invalid input)
401 Unauthorized    → Not authenticated
403 Forbidden       → Not authorized (no permission)
404 Not Found       → Resource doesn't exist
500 Server Error    → Server-side error
```

---

### 2. Input Validation with Zod

**Why Validate Input?**

```typescript
// Without validation - DANGEROUS!
export const POST: APIRoute = async (context) => {
  const body = await context.request.json();

  // What if body.price is "free"? Database error!
  // What if body.title is 500 characters? Display issues!
  // What if body.instructorId is invalid? Foreign key error!

  const course = await createCourse(body); // ❌ Dangerous
};
```

**Zod Validation Benefits:**

```typescript
// 1. Type Safety
const schema = z.object({
  price: z.number().min(0), // Must be number >= 0
  title: z.string().min(3).max(200), // Must be string 3-200 chars
});

// 2. Clear Error Messages
const result = schema.safeParse({ price: -10, title: "ab" });
if (!result.success) {
  console.log(result.error.errors);
  // [
  //   { path: ['price'], message: 'Number must be greater than or equal to 0' },
  //   { path: ['title'], message: 'String must contain at least 3 characters' }
  // ]
}

// 3. Automatic Type Inference
const validatedData = schema.parse(input);
// TypeScript knows validatedData.price is number
// TypeScript knows validatedData.title is string
```

**Common Zod Patterns:**

```typescript
// String validation
z.string().min(3).max(100)              // Length constraints
z.string().email()                      // Email format
z.string().url()                        // URL format
z.string().uuid()                       // UUID format

// Number validation
z.number().int()                        // Integer only
z.number().positive()                   // Must be > 0
z.number().min(0).max(100)              // Range

// Enum validation
z.enum(['beginner', 'intermediate', 'advanced'])

// Optional fields
z.string().optional()                   // Can be string or undefined
z.string().optional().default('N/A')    // Default if not provided

// Complex types
z.array(z.string())                     // Array of strings
z.object({ name: z.string() })          // Nested object
z.union([z.string(), z.number()])       // String OR number
```

---

### 3. Error Handling Strategy

**Consistent Error Response Format:**

All endpoints return the same error structure:
```typescript
{
  success: false,
  error: "Human-readable error message",
  code: "MACHINE_READABLE_CODE",
  details?: [{ path: string[], message: string }] // For validation errors
}
```

**Error Types and Status Codes:**

```typescript
// 400 Bad Request - Client sent invalid data
if (!validatedData.success) {
  return new Response(
    JSON.stringify({
      success: false,
      error: 'Invalid course data',
      code: 'VALIDATION_ERROR',
      details: validatedData.error.errors
    }),
    { status: 400 }
  );
}

// 404 Not Found - Resource doesn't exist
if (error.message.includes('not found')) {
  return new Response(
    JSON.stringify({
      success: false,
      error: 'Course not found',
      code: 'COURSE_NOT_FOUND'
    }),
    { status: 404 }
  );
}

// 500 Server Error - Something went wrong on our end
return new Response(
  JSON.stringify({
    success: false,
    error: 'Failed to create course',
    message: error.message, // Technical details
    code: 'COURSE_CREATE_ERROR'
  }),
  { status: 500 }
);
```

**Benefits:**
- ✅ **Predictability:** Clients always know error format
- ✅ **Debugging:** Error codes help identify issues
- ✅ **User Experience:** Clear messages for users
- ✅ **Monitoring:** Easy to track error types

---

### 4. Authentication & Authorization

**Authentication vs Authorization:**

```
Authentication (Who are you?)
├─ Verify user identity
├─ Check session/token
└─ Answer: "Yes, you're user@example.com"

Authorization (What can you do?)
├─ Check permissions/roles
├─ Verify access rights
└─ Answer: "Yes, you're an admin"
```

**Our Implementation:**

```typescript
// 1. Authentication - Check session exists
const session = context.locals.session;
if (!session || !session.userId) {
  return new Response(
    JSON.stringify({ error: 'Authentication required' }),
    { status: 401 } // Unauthorized
  );
}

// 2. Authorization - Check admin role
if (session.role !== 'admin') {
  return new Response(
    JSON.stringify({ error: 'Admin access required' }),
    { status: 403 } // Forbidden
  );
}

// 3. User is authenticated AND authorized
// Allow request to proceed
```

**Status Codes:**
- **401 Unauthorized:** "You need to log in"
- **403 Forbidden:** "You're logged in, but you don't have permission"

---

### 5. Audit Logging

**Why Log Admin Actions?**

```typescript
console.log('[ADMIN-COURSES] Course created:', {
  courseId: course.id,
  title: course.title,
  adminId: context.locals.session?.userId,
  timestamp: new Date().toISOString()
});
```

**Benefits:**
- ✅ **Accountability:** Know who did what
- ✅ **Security:** Detect unauthorized access
- ✅ **Debugging:** Trace issues to specific actions
- ✅ **Compliance:** Meet audit requirements

**What to Log:**
- Admin user ID
- Action performed (create, update, delete)
- Resource affected (course ID, title)
- Timestamp (automatic in most loggers)
- Result (success or error)

---

## Design Patterns Used

### 1. **Middleware Pattern**

**Concept:** Wrap handlers with reusable functions that add functionality

```typescript
// Pattern structure:
function middleware(handler) {
  return async (context) => {
    // Before handler logic
    const authCheck = checkAuth(context);
    if (!authCheck) return errorResponse;

    // Call actual handler
    const response = await handler(context);

    // After handler logic
    logAction(context, response);

    return response;
  };
}

// Usage:
export const POST = middleware(postHandler);
```

**Benefits:** Code reuse, separation of concerns, easy to compose

---

### 2. **Service Layer Pattern**

**Concept:** Separate HTTP handling from business logic

```
┌─────────────────────────────────────────┐
│        API Layer (HTTP)                 │
│  - Request parsing                      │
│  - Input validation                     │
│  - Response formatting                  │
└──────────┬──────────────────────────────┘
           │ Calls
           ▼
┌─────────────────────────────────────────┐
│       Service Layer (Business Logic)    │
│  - Database operations                  │
│  - Business rules                       │
│  - Data transformation                  │
└─────────────────────────────────────────┘
```

**Benefits:** Testability, reusability, maintainability

---

### 3. **Schema Validation Pattern**

**Concept:** Define data shape upfront, validate all inputs

```typescript
// 1. Define schema
const CreateCourseSchema = z.object({
  title: z.string().min(3).max(200),
  price: z.number().min(0),
});

// 2. Validate input
const result = CreateCourseSchema.safeParse(input);

// 3. Handle validation result
if (!result.success) {
  return validationError(result.error);
}

// 4. Use validated data (type-safe)
const course = await createCourse(result.data);
```

**Benefits:** Runtime type safety, clear API contract, good error messages

---

### 4. **Consistent Error Response Pattern**

**Concept:** All endpoints return errors in same format

```typescript
// Success response:
{
  success: true,
  data: { ... },
  message: "Operation successful"
}

// Error response:
{
  success: false,
  error: "User-friendly message",
  code: "ERROR_CODE",
  details?: [...]
}
```

**Benefits:** Predictable client code, easier error handling, better UX

---

## Security Considerations

### 1. **Admin-Only Access**

**Threat:** Regular users accessing admin endpoints
**Mitigation:** `withAdminAuth` middleware checks role
**Result:** Only users with `role === 'admin'` can access

### 2. **Input Validation**

**Threat:** Malicious or malformed data
**Mitigation:** Zod schema validation on all inputs
**Result:** Invalid data rejected before reaching database

### 3. **SQL Injection Prevention**

**Threat:** SQL injection through user input
**Mitigation:** Service layer uses parameterized queries
**Result:** User input never directly in SQL strings

```typescript
// Safe (parameterized):
db.query('UPDATE courses SET title = $1 WHERE id = $2', [title, id]);

// Dangerous (string concatenation):
db.query(`UPDATE courses SET title = '${title}' WHERE id = '${id}'`); // ❌
```

### 4. **UUID Validation**

**Threat:** Invalid IDs causing database errors
**Mitigation:** Zod `.uuid()` validation
**Result:** Only valid UUIDs accepted

### 5. **Audit Logging**

**Threat:** Unauthorized actions going unnoticed
**Mitigation:** Log all admin actions with user ID
**Result:** Full audit trail of who did what

### 6. **Error Message Safety**

**Threat:** Error messages leaking sensitive info
**Mitigation:** Generic error messages for server errors
**Result:** Technical details logged, not sent to client

```typescript
// Safe:
return new Response(
  JSON.stringify({ error: 'Failed to create course' }),
  { status: 500 }
);

// Unsafe:
return new Response(
  JSON.stringify({ error: `Database error: ${dbError.stack}` }), // ❌
  { status: 500 }
);
```

---

## Common Pitfalls

### 1. **Forgetting Runtime Validation**

**Problem:**
```typescript
interface CourseInput {
  title: string;
  price: number;
}

// TypeScript happy, but runtime gets { title: 123, price: "free" }
const course = await createCourse(input as CourseInput); // ❌
```

**Solution:**
```typescript
const validatedData = CreateCourseSchema.safeParse(input); // ✅
if (!validatedData.success) return error;
```

---

### 2. **Inconsistent Error Handling**

**Problem:**
```typescript
// Some endpoints return { error: "..." }
// Other endpoints return { message: "..." }
// Client code becomes complex
```

**Solution:**
```typescript
// Always use same format:
{ success: boolean, error?: string, data?: any }
```

---

### 3. **Not Validating UUIDs**

**Problem:**
```typescript
const id = url.searchParams.get('id');
await deleteCourse(id); // What if id is "123" or "'; DROP TABLE courses"?
```

**Solution:**
```typescript
const validatedData = z.object({ id: z.string().uuid() }).safeParse({ id });
if (!validatedData.success) return error;
```

---

### 4. **Mixing Authentication and Business Logic**

**Problem:**
```typescript
export const POST: APIRoute = async (context) => {
  // Auth check
  if (!session) return error;
  if (session.role !== 'admin') return error;

  // Business logic
  const course = await createCourse(data);

  // More endpoints = more duplicated auth code
};
```

**Solution:**
```typescript
const postHandler: APIRoute = async (context) => {
  // Only business logic here
  const course = await createCourse(data);
};

export const POST = withAdminAuth(postHandler); // ✅
```

---

### 5. **Not Logging Admin Actions**

**Problem:**
```typescript
const course = await createCourse(data);
return success(course); // Who created this? When? Why?
```

**Solution:**
```typescript
const course = await createCourse(data);
console.log('[ADMIN] Course created:', { courseId: course.id, adminId });
return success(course);
```

---

## Best Practices

### 1. **Use Descriptive Variable Names**

```typescript
// Bad:
const d = await c(x);

// Good:
const createdCourse = await createCourse(courseData);
```

### 2. **Validate Early, Fail Fast**

```typescript
// Validate at entry point
const validatedData = schema.safeParse(input);
if (!validatedData.success) {
  return new Response(JSON.stringify({ error: '...' }), { status: 400 });
}

// Now work with validated data (no more checks needed)
const course = await createCourse(validatedData.data);
```

### 3. **Use Appropriate HTTP Status Codes**

```
201 Created    → Use for POST (creating resources)
200 OK         → Use for PUT, DELETE, PATCH (updating/deleting)
400 Bad Request → Use for validation errors
404 Not Found  → Use when resource doesn't exist
500 Server Error → Use for unexpected server errors
```

### 4. **Keep Handlers Thin**

```typescript
// Handler should be thin - just HTTP concerns
const postHandler: APIRoute = async (context) => {
  const validatedData = validate(body);
  const result = await service(validatedData); // Business logic in service
  return formatResponse(result);
};
```

### 5. **Log with Context**

```typescript
// Bad:
console.log('Course created');

// Good:
console.log('[ADMIN-COURSES] Course created:', {
  courseId: course.id,
  title: course.title,
  adminId: context.locals.session?.userId,
  timestamp: new Date().toISOString()
});
```

### 6. **Use TypeScript Strictly**

```typescript
// Enable strict mode in tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

---

## Further Learning

### 1. **RESTful API Design**
- **Book:** "REST API Design Rulebook" by Mark Masse
- **Article:** [REST API Tutorial](https://restfulapi.net/)
- **Practice:** Build more CRUD APIs

### 2. **Input Validation**
- **Zod Documentation:** https://zod.dev/
- **Alternative:** Yup, Joi, class-validator
- **Concept:** Runtime type checking

### 3. **Authentication & Authorization**
- **Topics:** JWT, OAuth, Session-based auth
- **Security:** OWASP Top 10
- **Practice:** Implement different auth strategies

### 4. **Error Handling**
- **Pattern:** Error handling middleware
- **Topics:** Custom error classes, error codes
- **Best Practice:** Don't leak sensitive information

### 5. **Testing APIs**
- **Unit Tests:** Test handlers in isolation (Vitest)
- **Integration Tests:** Test full HTTP flow (Supertest)
- **E2E Tests:** Test real user scenarios (Playwright)

### 6. **API Documentation**
- **Tools:** Swagger/OpenAPI, Postman
- **Practice:** Document your APIs
- **Standard:** OpenAPI 3.0 specification

### 7. **Middleware Patterns**
- **Concept:** Composable request processing
- **Examples:** Auth, logging, rate limiting, CORS
- **Framework:** Express middleware, Koa middleware

---

## Summary

In T069, we built a comprehensive admin API for course management following these principles:

✅ **RESTful Design:** Proper HTTP methods and status codes
✅ **Input Validation:** Runtime validation with Zod schemas
✅ **Security:** Admin authentication, UUID validation, SQL injection prevention
✅ **Error Handling:** Consistent error format across all endpoints
✅ **Separation of Concerns:** API layer separate from business logic
✅ **Audit Logging:** All admin actions logged with context
✅ **Testability:** Comprehensive test suite with 26 passing tests

These patterns and practices apply to any API development and will serve as a foundation for building robust, secure, and maintainable backend services.

---

**Next Steps:**
1. Review the implementation in `/src/pages/api/admin/courses.ts`
2. Study the test suite in `/tests/unit/T069_admin_courses_api.test.ts`
3. Experiment: Try adding a new endpoint (e.g., duplicate course)
4. Practice: Build similar APIs for other resources (users, orders, etc.)

**Questions to Explore:**
- How would you add rate limiting to these endpoints?
- How would you implement pagination for listing courses?
- How would you add versioning to the API (v1, v2)?
- How would you document these endpoints using OpenAPI?
