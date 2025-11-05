# T220: API Documentation - Learning Guide

**Purpose:** Educational guide on implementing comprehensive API documentation with OpenAPI/Swagger

---

## Why API Documentation Matters

**Problems Without Documentation:**
- ❌ Developers don't know what endpoints exist
- ❌ Unclear request/response formats
- ❌ Wasted time figuring out authentication
- ❌ Inconsistent API usage
- ❌ Difficult onboarding for new team members
- ❌ Hard to integrate with external services

**Solution:** OpenAPI Specification + Swagger UI
- ✅ Single source of truth
- ✅ Interactive documentation
- ✅ Auto-generated client libraries
- ✅ Testable directly from docs
- ✅ Industry standard format
- ✅ Better developer experience

---

## What is OpenAPI?

**OpenAPI Specification (OAS):**
- Formerly known as "Swagger Specification"
- Standard for describing REST APIs
- Language-agnostic
- Machine-readable
- Human-friendly

**Current Version:** OpenAPI 3.0.3 (3.1.0 is latest, but 3.0.3 has better tooling support)

**Format:** YAML or JSON (YAML is more readable)

### Basic Structure

```yaml
openapi: 3.0.3
info:
  title: My API
  version: 1.0.0
servers:
  - url: https://api.example.com
paths:
  /users:
    get:
      summary: List users
      responses:
        '200':
          description: Success
components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: string
        name:
          type: string
```

---

## OpenAPI vs Swagger

**Important Distinction:**

**OpenAPI:**
- The specification format
- The standard itself
- Describes the API

**Swagger:**
- Tools for working with OpenAPI
- Swagger UI: Interactive documentation
- Swagger Editor: Write specs
- Swagger Codegen: Generate code

**In Practice:**
- Write OpenAPI spec
- Use Swagger UI to display it

---

## OpenAPI Specification Components

### 1. Info Section

```yaml
info:
  title: Spirituality Platform API
  description: |
    REST API for managing courses, products, and events.

    ## Authentication
    All endpoints use session cookies.

    ## Rate Limiting
    Rate limits vary by endpoint.
  version: 1.0.0
  contact:
    name: API Support
    email: support@example.com
  license:
    name: MIT
    url: https://opensource.org/licenses/MIT
```

**Why Important:**
- First thing developers see
- Sets context
- Provides contact info
- Specifies version

### 2. Servers

```yaml
servers:
  - url: http://localhost:4321/api
    description: Development server
  - url: https://api.production.com/api
    description: Production server
```

**Why Important:**
- Developers know where to send requests
- Easy environment switching
- "Try it out" knows which server to use

### 3. Security Schemes

```yaml
components:
  securitySchemes:
    cookieAuth:
      type: apiKey
      in: cookie
      name: session
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
```

**Types of Security:**
- `apiKey`: API keys (header, query, or cookie)
- `http`: Basic, Bearer, etc.
- `oauth2`: OAuth 2.0 flows
- `openIdConnect`: OpenID Connect

**Usage in Endpoints:**
```yaml
/protected/endpoint:
  get:
    security:
      - cookieAuth: []
    # endpoint definition
```

### 4. Tags

```yaml
tags:
  - name: Authentication
    description: User auth and session management
  - name: Courses
    description: Course catalog and enrollment
  - name: Admin
    description: Admin-only operations
```

**Why Tags:**
- Organize endpoints by category
- Create collapsible sections in Swagger UI
- Easy navigation
- Logical grouping

### 5. Paths (Endpoints)

```yaml
paths:
  /auth/login:
    post:
      tags: [Authentication]
      summary: User login
      description: Authenticates user and creates session
      operationId: login
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [email, password]
              properties:
                email:
                  type: string
                  format: email
                password:
                  type: string
                rememberMe:
                  type: boolean
                  default: false
      responses:
        '200':
          description: Login successful
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
        '401':
          $ref: '#/components/responses/Unauthorized'
```

**Key Elements:**
- **tags:** Categories
- **summary:** Brief description
- **description:** Detailed info
- **operationId:** Unique identifier
- **requestBody:** What to send
- **responses:** What you get back

### 6. Components (Reusable Parts)

**Schemas:**
```yaml
components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: string
          format: uuid
        name:
          type: string
        email:
          type: string
          format: email
        role:
          type: string
          enum: [user, admin]
        createdAt:
          type: string
          format: date-time
```

**Responses:**
```yaml
components:
  responses:
    Unauthorized:
      description: Unauthorized - authentication required
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'

    NotFound:
      description: Resource not found
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
```

**Why Reusable Components:**
- DRY (Don't Repeat Yourself)
- Consistency across endpoints
- Easy to update (change once, apply everywhere)
- Cleaner spec file

---

## Common Data Types

### Basic Types

```yaml
properties:
  # String
  name:
    type: string
    minLength: 2
    maxLength: 100

  # Email
  email:
    type: string
    format: email

  # Integer
  age:
    type: integer
    minimum: 0
    maximum: 150

  # Number (decimal)
  price:
    type: number
    format: double
    minimum: 0

  # Boolean
  isActive:
    type: boolean

  # Date/Time
  createdAt:
    type: string
    format: date-time

  # UUID
  id:
    type: string
    format: uuid

  # Enum
  status:
    type: string
    enum: [pending, active, inactive]

  # Array
  tags:
    type: array
    items:
      type: string

  # Object
  address:
    type: object
    properties:
      street:
        type: string
      city:
        type: string
```

---

## Best Practices

### 1. Descriptive Summaries

```yaml
# ❌ Bad
summary: Login

# ✅ Good
summary: Authenticate user and create session
```

### 2. Detailed Descriptions

```yaml
# ✅ Good
description: |
  Authenticates a user with email and password.

  On success, creates a session cookie that will be
  used for subsequent authenticated requests.

  The session expires after 24 hours of inactivity.
```

### 3. Required vs Optional

```yaml
# Clearly mark required fields
type: object
required: [email, password]
properties:
  email:
    type: string
  password:
    type: string
  rememberMe:  # Optional
    type: boolean
    default: false
```

### 4. Examples

```yaml
schema:
  type: object
  properties:
    name:
      type: string
      example: "John Doe"
    email:
      type: string
      example: "john@example.com"
```

### 5. Error Responses

```yaml
responses:
  '200':
    description: Success
  '400':
    description: Bad request - validation error
  '401':
    description: Unauthorized - authentication required
  '403':
    description: Forbidden - insufficient permissions
  '404':
    description: Not found
  '429':
    description: Rate limit exceeded
  '500':
    description: Internal server error
```

### 6. Pagination

```yaml
/courses:
  get:
    parameters:
      - name: page
        in: query
        schema:
          type: integer
          minimum: 1
          default: 1
      - name: limit
        in: query
        schema:
          type: integer
          minimum: 1
          maximum: 100
          default: 20
    responses:
      '200':
        content:
          application/json:
            schema:
              type: object
              properties:
                items:
                  type: array
                  items:
                    $ref: '#/components/schemas/Course'
                total:
                  type: integer
                page:
                  type: integer
                limit:
                  type: integer
```

### 7. Path Parameters

```yaml
/courses/{id}:
  get:
    parameters:
      - name: id
        in: path
        required: true
        description: Course UUID
        schema:
          type: string
          format: uuid
```

### 8. Query Parameters

```yaml
/search:
  get:
    parameters:
      - name: q
        in: query
        required: true
        description: Search query
        schema:
          type: string
          minLength: 2
      - name: type
        in: query
        description: Filter by type
        schema:
          type: string
          enum: [course, product, event]
```

---

## Swagger UI Integration

### Setup

**1. Include Swagger UI Assets:**
```html
<!-- CSS -->
<link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.10.5/swagger-ui.css" />

<!-- JS -->
<script src="https://unpkg.com/swagger-ui-dist@5.10.5/swagger-ui-bundle.js"></script>
<script src="https://unpkg.com/swagger-ui-dist@5.10.5/swagger-ui-standalone-preset.js"></script>
```

**2. Create Container:**
```html
<div id="swagger-ui"></div>
```

**3. Initialize:**
```javascript
window.onload = function() {
  SwaggerUIBundle({
    url: '/api-spec.yaml',
    dom_id: '#swagger-ui',
    deepLinking: true,
    presets: [
      SwaggerUIBundle.presets.apis,
      SwaggerUIStandalonePreset
    ],
    layout: "StandaloneLayout"
  });
};
```

### Configuration Options

```javascript
SwaggerUIBundle({
  // URL to OpenAPI spec
  url: '/api-spec.yaml',

  // Or inline spec
  // spec: { /* OpenAPI object */ },

  // DOM element ID
  dom_id: '#swagger-ui',

  // Deep linking (URL includes endpoint hash)
  deepLinking: true,

  // Display mode
  docExpansion: 'list',  // 'none', 'list', 'full'

  // Show request duration
  displayRequestDuration: true,

  // Enable filtering
  filter: true,

  // Show extensions
  showExtensions: true,

  // Show common extensions
  showCommonExtensions: true,

  // Try it out enabled by default
  tryItOutEnabled: false,

  // Request interceptor (add auth, etc.)
  requestInterceptor: (request) => {
    request.credentials = 'include';
    return request;
  },

  // Response interceptor (log, transform, etc.)
  responseInterceptor: (response) => {
    return response;
  }
});
```

### Styling Swagger UI

```css
/* Hide default topbar */
.swagger-ui .topbar {
  display: none;
}

/* Customize colors for HTTP methods */
.swagger-ui .opblock.opblock-get {
  border-color: #3b82f6;
  background: rgba(59, 130, 246, 0.05);
}

.swagger-ui .opblock.opblock-post {
  border-color: #10b981;
  background: rgba(16, 185, 129, 0.05);
}

.swagger-ui .opblock.opblock-put {
  border-color: #f59e0b;
  background: rgba(245, 158, 11, 0.05);
}

.swagger-ui .opblock.opblock-delete {
  border-color: #ef4444;
  background: rgba(239, 68, 68, 0.05);
}

/* Customize buttons */
.swagger-ui .btn.execute {
  background-color: #3b82f6;
  border-color: #3b82f6;
}
```

---

## Advanced Features

### 1. Discriminators (Polymorphism)

```yaml
components:
  schemas:
    Pet:
      type: object
      required: [petType]
      properties:
        petType:
          type: string
      discriminator:
        propertyName: petType
        mapping:
          dog: '#/components/schemas/Dog'
          cat: '#/components/schemas/Cat'

    Dog:
      allOf:
        - $ref: '#/components/schemas/Pet'
        - type: object
          properties:
            breed:
              type: string

    Cat:
      allOf:
        - $ref: '#/components/schemas/Pet'
        - type: object
          properties:
            indoor:
              type: boolean
```

### 2. oneOf / anyOf / allOf

```yaml
# oneOf: Exactly one of these schemas
oneOf:
  - $ref: '#/components/schemas/User'
  - $ref: '#/components/schemas/Guest'

# anyOf: One or more of these schemas
anyOf:
  - $ref: '#/components/schemas/Cat'
  - $ref: '#/components/schemas/Dog'

# allOf: Must match all schemas (composition)
allOf:
  - $ref: '#/components/schemas/Pet'
  - type: object
    properties:
      name:
        type: string
```

### 3. Callbacks

```yaml
paths:
  /subscribe:
    post:
      summary: Subscribe to webhooks
      callbacks:
        webhookEvent:
          '{$request.body#/webhookUrl}':
            post:
              requestBody:
                content:
                  application/json:
                    schema:
                      $ref: '#/components/schemas/WebhookPayload'
              responses:
                '200':
                  description: Webhook received
```

### 4. Links

```yaml
paths:
  /users:
    post:
      responses:
        '201':
          description: User created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
          links:
            GetUserByUserId:
              operationId: getUserById
              parameters:
                userId: '$response.body#/id'
```

---

## Testing API Documentation

### Automated Testing

```typescript
import { readFileSync } from 'fs';
import yaml from 'js-yaml';

describe('API Documentation', () => {
  let apiSpec: any;

  beforeEach(() => {
    const specContent = readFileSync('public/api-spec.yaml', 'utf8');
    apiSpec = yaml.load(specContent);
  });

  it('should have valid OpenAPI structure', () => {
    expect(apiSpec.openapi).toBe('3.0.3');
    expect(apiSpec.info).toBeDefined();
    expect(apiSpec.paths).toBeDefined();
  });

  it('should document all endpoints', () => {
    const endpoints = Object.keys(apiSpec.paths);
    expect(endpoints.length).toBeGreaterThan(0);
  });

  it('should have proper security schemes', () => {
    expect(apiSpec.components.securitySchemes).toBeDefined();
  });
});
```

### Manual Testing

**1. Spec Validation:**
- Use https://editor.swagger.io/
- Paste your YAML
- Fix any errors

**2. Try It Out:**
- Click "Try it out" button
- Fill in parameters
- Execute request
- Verify response

**3. Check All Endpoints:**
- Expand each tag
- Verify descriptions
- Check request/response examples
- Test authentication

---

## Common Mistakes to Avoid

### ❌ Mistake 1: Incomplete Documentation

```yaml
# Bad: Minimal info
/users:
  get:
    responses:
      '200':
        description: Success
```

```yaml
# Good: Complete info
/users:
  get:
    tags: [Users]
    summary: List all users
    description: Returns a paginated list of users
    parameters:
      - name: page
        in: query
        schema:
          type: integer
          default: 1
    responses:
      '200':
        description: Users retrieved successfully
        content:
          application/json:
            schema:
              type: object
              properties:
                users:
                  type: array
                  items:
                    $ref: '#/components/schemas/User'
                total:
                  type: integer
```

### ❌ Mistake 2: Not Using $ref

```yaml
# Bad: Repeating schemas
/users:
  get:
    responses:
      '200':
        content:
          application/json:
            schema:
              type: object
              properties:
                id:
                  type: string
                name:
                  type: string
/users/{id}:
  get:
    responses:
      '200':
        content:
          application/json:
            schema:
              type: object
              properties:
                id:
                  type: string
                name:
                  type: string
```

```yaml
# Good: Using $ref
components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: string
        name:
          type: string

/users:
  get:
    responses:
      '200':
        content:
          application/json:
            schema:
              type: array
              items:
                $ref: '#/components/schemas/User'

/users/{id}:
  get:
    responses:
      '200':
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/User'
```

### ❌ Mistake 3: Missing Required Fields

```yaml
# Bad: Not marking required
type: object
properties:
  email:
    type: string
  password:
    type: string
```

```yaml
# Good: Marking required
type: object
required: [email, password]
properties:
  email:
    type: string
  password:
    type: string
```

### ❌ Mistake 4: Inconsistent Naming

```yaml
# Bad: Inconsistent
/users:
  get: ...
/user/{id}:  # Should be /users/{id}
  get: ...
/GetUserProfile:  # Should be /users/profile
  get: ...
```

```yaml
# Good: Consistent REST conventions
/users:
  get: ...
/users/{id}:
  get: ...
/users/profile:
  get: ...
```

### ❌ Mistake 5: Wrong HTTP Methods

```yaml
# Bad: Using GET for actions that modify data
/users/create:
  get:
    # Creating user with GET is wrong
```

```yaml
# Good: Proper HTTP methods
/users:
  post:  # Create
    ...
  get:   # List
    ...

/users/{id}:
  get:    # Read
    ...
  put:    # Update (full)
    ...
  patch:  # Update (partial)
    ...
  delete: # Delete
    ...
```

---

## Real-World Example

### Complete Endpoint Documentation

```yaml
/courses/{id}/enroll:
  post:
    tags: [Courses]
    summary: Enroll in a course
    description: |
      Enrolls the authenticated user in the specified course.

      Requirements:
      - User must be authenticated
      - Course must exist and be published
      - User must not already be enrolled
      - If course is paid, user must complete checkout first

      On successful enrollment:
      - User gains access to all course lessons
      - Progress tracking begins
      - Confirmation email is sent
    operationId: enrollInCourse
    security:
      - cookieAuth: []
    parameters:
      - name: id
        in: path
        required: true
        description: Course UUID
        schema:
          type: string
          format: uuid
        example: "123e4567-e89b-12d3-a456-426614174000"
    requestBody:
      required: false
      description: Optional enrollment preferences
      content:
        application/json:
          schema:
            type: object
            properties:
              sendNotifications:
                type: boolean
                description: Whether to send email notifications about course updates
                default: true
          example:
            sendNotifications: true
    responses:
      '200':
        description: Successfully enrolled
        content:
          application/json:
            schema:
              type: object
              required: [success, enrollment]
              properties:
                success:
                  type: boolean
                  example: true
                enrollment:
                  type: object
                  properties:
                    id:
                      type: string
                      format: uuid
                    userId:
                      type: string
                      format: uuid
                    courseId:
                      type: string
                      format: uuid
                    enrolledAt:
                      type: string
                      format: date-time
                    progress:
                      type: number
                      format: double
                      minimum: 0
                      maximum: 100
                message:
                  type: string
                  example: "Successfully enrolled in course"
      '400':
        description: Bad request - Invalid course ID or already enrolled
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Error'
            example:
              success: false
              error: "Already enrolled"
              message: "You are already enrolled in this course"
      '401':
        $ref: '#/components/responses/Unauthorized'
      '403':
        description: Forbidden - Course requires payment or is not published
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Error'
      '404':
        description: Course not found
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Error'
            example:
              success: false
              error: "Not found"
              message: "Course not found"
      '429':
        $ref: '#/components/responses/RateLimited'
      '500':
        $ref: '#/components/responses/ServerError'
```

---

## Maintenance and Updates

### When to Update Documentation

**1. Adding New Endpoints:**
- Document before implementing (spec-first approach)
- Or document immediately after implementing

**2. Changing Existing Endpoints:**
- Update request/response schemas
- Update descriptions
- Add deprecation warnings if breaking changes

**3. New API Version:**
- Create new spec file (e.g., api-spec-v2.yaml)
- Update servers to include version in URL
- Maintain old spec for backwards compatibility

### Version Management

```yaml
# Option 1: Version in URL
servers:
  - url: https://api.example.com/v1
  - url: https://api.example.com/v2

# Option 2: Version in header (document in spec)
info:
  description: |
    Use the `API-Version` header to specify version:
    - `API-Version: 1` for v1
    - `API-Version: 2` for v2
```

### Deprecation Warnings

```yaml
/old/endpoint:
  get:
    deprecated: true
    description: |
      ⚠️ **DEPRECATED**: This endpoint will be removed in v2.0.0.
      Please use `/new/endpoint` instead.
    # ... rest of spec
```

---

## Tools and Resources

### Online Tools

**1. Swagger Editor:**
- https://editor.swagger.io/
- Write and validate specs
- Live preview
- Generate code

**2. Stoplight Studio:**
- https://stoplight.io/studio
- Visual editor
- Collaboration features
- Free tier available

**3. OpenAPI Generator:**
- https://openapi-generator.tech/
- Generate client libraries
- Generate server stubs
- Many language options

### CLI Tools

```bash
# Validate OpenAPI spec
npx @apidevtools/swagger-cli validate api-spec.yaml

# Bundle multiple files
npx @apidevtools/swagger-cli bundle api-spec.yaml -o bundled.yaml

# Convert to JSON
npx js-yaml api-spec.yaml > api-spec.json
```

### IDE Extensions

**VS Code:**
- OpenAPI (Swagger) Editor
- 42Crunch OpenAPI
- Swagger Viewer

---

## Conclusion

**Key Takeaways:**

1. **OpenAPI is the standard** for API documentation
2. **Swagger UI** makes specs interactive
3. **YAML format** is readable and maintainable
4. **Reusable components** keep specs DRY
5. **Comprehensive docs** improve developer experience
6. **Testing** ensures documentation stays accurate
7. **Maintenance** is crucial for long-term success

**Benefits:**
- ✅ Better developer experience
- ✅ Faster onboarding
- ✅ Fewer support questions
- ✅ API contract testing
- ✅ Code generation
- ✅ Industry standard

**Next Steps:**
- Document all your API endpoints
- Set up Swagger UI
- Write tests for your spec
- Generate client libraries
- Keep documentation updated

Good API documentation is an investment that pays dividends in developer productivity and happiness!
