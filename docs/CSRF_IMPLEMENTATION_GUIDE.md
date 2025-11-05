# CSRF Implementation Guide

**Last Updated**: 2025-11-03
**Related Task**: T201 - CSRF Protection
**Status**: ✅ Implemented

This guide covers how to implement and use the CSRF (Cross-Site Request Forgery) protection system in the application.

---

## Table of Contents

1. [Overview](#overview)
2. [How It Works](#how-it-works)
3. [Backend Integration](#backend-integration)
4. [Frontend Integration](#frontend-integration)
5. [Testing CSRF Protection](#testing-csrf-protection)
6. [Troubleshooting](#troubleshooting)
7. [Security Considerations](#security-considerations)

---

## Overview

### What is CSRF?

Cross-Site Request Forgery (CSRF) is an attack that forces authenticated users to execute unwanted actions on a web application. For example:

1. User logs into `yoursite.com`
2. User visits malicious site `evil.com`
3. `evil.com` contains: `<form action="https://yoursite.com/api/cart/add" method="POST">...</form>`
4. Form auto-submits, adding items to user's cart without their knowledge

### Our Implementation

We use the **double-submit cookie pattern**:
- Server generates a random token and sets it in an httpOnly cookie
- Client includes the same token in request (header or form field)
- Server validates that both tokens match

**Benefits**:
- ✅ Stateless (no server-side storage needed)
- ✅ Works with both forms and AJAX
- ✅ Standards-compliant
- ✅ Timing-safe validation prevents timing attacks

---

## How It Works

### Token Flow

```
┌─────────┐                      ┌─────────┐
│ Browser │                      │ Server  │
└────┬────┘                      └────┬────┘
     │                                │
     │  1. GET /login (any page)      │
     ├───────────────────────────────>│
     │                                │
     │  2. Set-Cookie: csrf_token=abc │
     │  3. <input name="csrf_token">  │
     │<───────────────────────────────┤
     │                                │
     │  4. POST /api/auth/login       │
     │     Cookie: csrf_token=abc     │
     │     X-CSRF-Token: abc          │
     ├───────────────────────────────>│
     │                                │
     │  5. Validate: cookie == header │
     │     ✅ Tokens match            │
     │<───────────────────────────────┤
     │                                │
     │  6. Process request            │
     │<───────────────────────────────┤
     │                                │
```

### Security Properties

1. **Cookie** (httpOnly, sameSite=strict):
   - Cannot be read by JavaScript
   - Not sent to other domains
   - Attacker cannot access token

2. **Request Token** (header or form field):
   - Must be explicitly included by client
   - Attacker cannot forge this (due to same-origin policy)

3. **Validation**:
   - Timing-safe comparison prevents timing attacks
   - Both tokens must match exactly

---

## Backend Integration

### Step 1: Setting the CSRF Cookie

The CSRF cookie should be set on any page that contains forms or makes state-changing requests.

**Example - Login Page**:
```typescript
// src/pages/login.astro
---
import { setCSRFCookie } from '@/lib/csrf';

const csrfToken = setCSRFCookie(Astro.cookies);
---

<form method="POST" action="/api/auth/login">
  <input type="hidden" name="csrf_token" value={csrfToken} />

  <input type="email" name="email" required />
  <input type="password" name="password" required />
  <button type="submit">Login</button>
</form>
```

### Step 2: Validating CSRF Tokens

All state-changing API endpoints (POST, PUT, DELETE, PATCH) should validate CSRF tokens.

**Option A: Manual Validation** (most common):
```typescript
// src/pages/api/cart/add.ts
import type { APIRoute } from 'astro';
import { validateCSRF } from '@/lib/csrf';

export const POST: APIRoute = async (context) => {
  // Validate CSRF token
  const csrfValid = await validateCSRF(context);

  if (!csrfValid) {
    console.warn('[CART-ADD] CSRF validation failed:', {
      ip: context.clientAddress,
      url: context.request.url,
    });

    return new Response(
      JSON.stringify({
        success: false,
        error: 'CSRF validation failed',
        code: 'CSRF_TOKEN_INVALID',
      }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Continue with normal request processing...
  const body = await context.request.json();
  // ... rest of handler
};
```

**Option B: Higher-Order Function** (cleaner for new endpoints):
```typescript
// src/pages/api/orders/create.ts
import type { APIRoute } from 'astro';
import { withCSRF } from '@/lib/csrf';

const handler: APIRoute = async (context) => {
  // CSRF already validated by wrapper
  const body = await context.request.json();

  // Process order...
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

// Export wrapped handler
export const POST = withCSRF(handler);
```

### Step 3: Exemptions

Some endpoints should **NOT** have CSRF protection:

**Webhooks** (use signature validation instead):
```typescript
// src/pages/api/checkout/webhook.ts
export const POST: APIRoute = async (context) => {
  // NO CSRF validation for webhooks
  // Use Stripe signature verification instead

  const signature = context.request.headers.get('stripe-signature');
  const event = stripe.webhooks.constructEvent(
    await context.request.text(),
    signature,
    process.env.STRIPE_WEBHOOK_SECRET
  );

  // Process webhook...
};
```

**Read-only endpoints** (GET requests):
```typescript
// src/pages/api/cart/index.ts
export const GET: APIRoute = async (context) => {
  // NO CSRF validation needed for GET requests
  // (They don't change state)

  const cart = await getCart(sessionId);
  return new Response(JSON.stringify(cart));
};
```

---

## Frontend Integration

### Method 1: HTML Forms

For traditional form submissions, include the token as a hidden input:

```html
<!-- Login form example -->
<form method="POST" action="/api/auth/login">
  <input type="hidden" name="csrf_token" value="{csrfToken}" />

  <label>Email: <input type="email" name="email" required /></label>
  <label>Password: <input type="password" name="password" required /></label>
  <button type="submit">Login</button>
</form>
```

The server will automatically extract the token from the form data and validate it.

### Method 2: AJAX/Fetch Requests

For JavaScript requests, include the token in the `X-CSRF-Token` header:

```typescript
// Get CSRF token from cookie
function getCSRFToken(): string | null {
  const match = document.cookie.match(/csrf_token=([^;]+)/);
  return match ? match[1] : null;
}

// Add to cart example
async function addToCart(itemType: string, itemId: string, quantity: number) {
  const csrfToken = getCSRFToken();

  if (!csrfToken) {
    console.error('CSRF token not found');
    return;
  }

  const response = await fetch('/api/cart/add', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken,
    },
    body: JSON.stringify({
      itemType,
      itemId,
      quantity,
    }),
  });

  if (!response.ok) {
    const error = await response.json();

    if (error.code === 'CSRF_TOKEN_INVALID') {
      // Token expired or missing - reload page to get new token
      alert('Your session has expired. Please refresh the page.');
      window.location.reload();
      return;
    }

    console.error('Failed to add to cart:', error);
  }

  return response.json();
}
```

### Method 3: React/Vue/Svelte Components

**React Example**:
```tsx
import { useEffect, useState } from 'react';

function getCSRFToken(): string | null {
  const match = document.cookie.match(/csrf_token=([^;]+)/);
  return match ? match[1] : null;
}

export function AddToCartButton({ itemType, itemId }) {
  const [csrfToken, setCSRFToken] = useState<string | null>(null);

  useEffect(() => {
    // Get CSRF token on mount
    setCSRFToken(getCSRFToken());
  }, []);

  const handleAddToCart = async () => {
    if (!csrfToken) {
      alert('CSRF token not found. Please refresh the page.');
      return;
    }

    const response = await fetch('/api/cart/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
      },
      body: JSON.stringify({
        itemType,
        itemId,
        quantity: 1,
      }),
    });

    if (!response.ok) {
      const error = await response.json();

      if (error.code === 'CSRF_TOKEN_INVALID') {
        alert('Your session has expired. Please refresh the page.');
        window.location.reload();
        return;
      }

      alert('Failed to add to cart');
      return;
    }

    const data = await response.json();
    console.log('Added to cart:', data);
  };

  return (
    <button onClick={handleAddToCart}>
      Add to Cart
    </button>
  );
}
```

**Svelte Example**:
```svelte
<script lang="ts">
  import { onMount } from 'svelte';

  export let itemType: string;
  export let itemId: string;

  let csrfToken: string | null = null;

  onMount(() => {
    const match = document.cookie.match(/csrf_token=([^;]+)/);
    csrfToken = match ? match[1] : null;
  });

  async function addToCart() {
    if (!csrfToken) {
      alert('CSRF token not found. Please refresh the page.');
      return;
    }

    const response = await fetch('/api/cart/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
      },
      body: JSON.stringify({
        itemType,
        itemId,
        quantity: 1,
      }),
    });

    if (!response.ok) {
      const error = await response.json();

      if (error.code === 'CSRF_TOKEN_INVALID') {
        alert('Your session has expired. Please refresh the page.');
        window.location.reload();
        return;
      }

      alert('Failed to add to cart');
      return;
    }

    const data = await response.json();
    console.log('Added to cart:', data);
  }
</script>

<button on:click={addToCart}>
  Add to Cart
</button>
```

### Method 4: Global Fetch Wrapper

Create a wrapper to automatically include CSRF tokens in all requests:

```typescript
// src/lib/api.ts
function getCSRFToken(): string | null {
  const match = document.cookie.match(/csrf_token=([^;]+)/);
  return match ? match[1] : null;
}

export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const csrfToken = getCSRFToken();

  // Only add CSRF token for state-changing methods
  const needsCSRF = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(
    (options.method || 'GET').toUpperCase()
  );

  if (needsCSRF && csrfToken) {
    options.headers = {
      ...options.headers,
      'X-CSRF-Token': csrfToken,
    };
  }

  const response = await fetch(url, options);

  // Handle CSRF errors globally
  if (!response.ok && response.status === 403) {
    const error = await response.json().catch(() => ({}));

    if (error.code === 'CSRF_TOKEN_INVALID') {
      alert('Your session has expired. Please refresh the page.');
      window.location.reload();
      throw new Error('CSRF validation failed');
    }
  }

  return response;
}

// Usage
await apiFetch('/api/cart/add', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ itemType: 'course', itemId: '123', quantity: 1 }),
});
```

---

## Testing CSRF Protection

### Manual Testing with cURL

**Test 1: Request without CSRF token (should fail)**
```bash
curl -X POST http://localhost:4321/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Expected response:
# {
#   "success": false,
#   "error": "CSRF validation failed",
#   "code": "CSRF_TOKEN_INVALID"
# }
# Status: 403 Forbidden
```

**Test 2: Request with valid CSRF token (should succeed)**
```bash
# First, get a CSRF token by visiting the login page
TOKEN=$(curl -s -c cookies.txt http://localhost:4321/login | \
  grep -o 'csrf_token" value="[^"]*"' | \
  cut -d'"' -f4)

# Extract cookie
COOKIE=$(cat cookies.txt | grep csrf_token | awk '{print $7}')

# Now make request with both cookie and header
curl -X POST http://localhost:4321/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Cookie: csrf_token=$COOKIE" \
  -H "X-CSRF-Token: $TOKEN" \
  -d '{"email":"test@example.com","password":"password"}'

# Expected: Successful response (status 200 or redirect)
```

**Test 3: Request with mismatched tokens (should fail)**
```bash
curl -X POST http://localhost:4321/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Cookie: csrf_token=abc123" \
  -H "X-CSRF-Token: xyz789" \
  -d '{"email":"test@example.com","password":"password"}'

# Expected: 403 Forbidden (tokens don't match)
```

### Automated Testing

**Vitest/Jest Example**:
```typescript
// tests/csrf.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { generateCSRFToken, validateCSRFToken } from '@/lib/csrf';

describe('CSRF Protection', () => {
  it('should generate valid tokens', () => {
    const token = generateCSRFToken();

    expect(token).toBeTruthy();
    expect(token.length).toBeGreaterThan(32);
    expect(typeof token).toBe('string');
  });

  it('should validate matching tokens', async () => {
    const token = generateCSRFToken();

    // Mock request and cookies
    const request = new Request('http://localhost/api/test', {
      method: 'POST',
      headers: { 'X-CSRF-Token': token },
    });

    const cookies = {
      get: () => ({ value: token }),
    };

    const isValid = await validateCSRFToken(request, cookies as any);
    expect(isValid).toBe(true);
  });

  it('should reject mismatched tokens', async () => {
    const token1 = generateCSRFToken();
    const token2 = generateCSRFToken();

    const request = new Request('http://localhost/api/test', {
      method: 'POST',
      headers: { 'X-CSRF-Token': token1 },
    });

    const cookies = {
      get: () => ({ value: token2 }),
    };

    const isValid = await validateCSRFToken(request, cookies as any);
    expect(isValid).toBe(false);
  });

  it('should reject missing cookie', async () => {
    const token = generateCSRFToken();

    const request = new Request('http://localhost/api/test', {
      method: 'POST',
      headers: { 'X-CSRF-Token': token },
    });

    const cookies = {
      get: () => undefined,
    };

    const isValid = await validateCSRFToken(request, cookies as any);
    expect(isValid).toBe(false);
  });

  it('should reject missing header', async () => {
    const token = generateCSRFToken();

    const request = new Request('http://localhost/api/test', {
      method: 'POST',
    });

    const cookies = {
      get: () => ({ value: token }),
    };

    const isValid = await validateCSRFToken(request, cookies as any);
    expect(isValid).toBe(false);
  });
});
```

**Playwright/E2E Example**:
```typescript
// tests/e2e/csrf.spec.ts
import { test, expect } from '@playwright/test';

test.describe('CSRF Protection', () => {
  test('should prevent login without CSRF token', async ({ page, context }) => {
    // Intercept API request
    const loginPromise = page.waitForResponse('/api/auth/login');

    // Make request without CSRF token (clear cookies first)
    await context.clearCookies();
    await page.evaluate(() => {
      return fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password',
        }),
      });
    });

    const response = await loginPromise;

    expect(response.status()).toBe(403);

    const body = await response.json();
    expect(body.code).toBe('CSRF_TOKEN_INVALID');
  });

  test('should allow login with valid CSRF token', async ({ page }) => {
    // Visit login page (sets CSRF cookie)
    await page.goto('/login');

    // Fill form (includes CSRF token automatically)
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');

    // Should redirect to dashboard (or show success)
    await page.waitForURL('/dashboard', { timeout: 5000 });
  });

  test('should handle CSRF token expiration', async ({ page, context }) => {
    // Visit page to get token
    await page.goto('/login');

    // Wait for token to expire (or manually expire it)
    await context.addCookies([{
      name: 'csrf_token',
      value: 'expired-token',
      domain: 'localhost',
      path: '/',
      expires: Math.floor(Date.now() / 1000) - 3600, // Expired 1 hour ago
    }]);

    // Try to submit form
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password');

    const responsePromise = page.waitForResponse('/api/auth/login');
    await page.click('button[type="submit"]');

    const response = await responsePromise;
    expect(response.status()).toBe(403);
  });
});
```

---

## Troubleshooting

### Issue 1: "CSRF validation failed" error

**Symptoms**:
- 403 Forbidden responses
- `CSRF_TOKEN_INVALID` error code
- Forms not submitting

**Common Causes**:

1. **Missing CSRF cookie**
   - **Check**: Open browser DevTools → Application → Cookies
   - **Fix**: Ensure `setCSRFCookie()` is called on the page before form submission

2. **Token not included in request**
   - **Check**: DevTools → Network → Request headers
   - **Fix**: Add `X-CSRF-Token` header or `csrf_token` form field

3. **Mismatched tokens**
   - **Check**: Compare cookie value vs header/form value
   - **Fix**: Ensure you're reading the token correctly from the cookie

4. **Cookie not sent with request**
   - **Check**: Request includes `Cookie: csrf_token=...`
   - **Fix**: Ensure `credentials: 'same-origin'` in fetch options

   ```typescript
   fetch('/api/cart/add', {
     method: 'POST',
     credentials: 'same-origin', // Include cookies
     headers: {
       'X-CSRF-Token': token,
     },
   });
   ```

5. **Token expired**
   - **Check**: Cookie max-age is 2 hours
   - **Fix**: Reload page to get fresh token

### Issue 2: CSRF protection blocking webhooks

**Symptoms**:
- Stripe webhooks failing with 403
- Event not processed

**Solution**:
Webhooks should **NOT** use CSRF protection. They use signature validation instead:

```typescript
// ❌ WRONG - Don't validate CSRF for webhooks
export const POST: APIRoute = async (context) => {
  const csrfValid = await validateCSRF(context);
  // ... webhook code
};

// ✅ CORRECT - Use signature validation
export const POST: APIRoute = async (context) => {
  const signature = context.request.headers.get('stripe-signature');

  // Verify Stripe signature (built-in CSRF protection)
  const event = stripe.webhooks.constructEvent(
    body,
    signature,
    webhookSecret
  );
  // ... process event
};
```

### Issue 3: Token not accessible in JavaScript

**Symptoms**:
- `document.cookie` doesn't include `csrf_token`
- Token shows in DevTools but not in JS

**Cause**:
Cookie is `httpOnly`, which prevents JavaScript access for security.

**Solution**:
Pass token explicitly to JavaScript:

```astro
---
// src/pages/cart.astro
import { setCSRFCookie } from '@/lib/csrf';

const csrfToken = setCSRFCookie(Astro.cookies);
---

<script define:vars={{ csrfToken }}>
  // Now available in JavaScript
  console.log('CSRF Token:', csrfToken);

  // Use in fetch requests
  fetch('/api/cart/add', {
    method: 'POST',
    headers: {
      'X-CSRF-Token': csrfToken,
    },
  });
</script>
```

### Issue 4: CORS errors with CSRF

**Symptoms**:
- CORS error in browser console
- Preflight OPTIONS request fails

**Solution**:
CSRF protection is designed for same-origin requests. For cross-origin APIs:

1. **Use API keys instead** (for external API access)
2. **Configure CORS properly** (allow credentials)
3. **Consider exempting public APIs** from CSRF

```typescript
// For public API endpoints (no authentication required)
export const POST: APIRoute = async (context) => {
  // Skip CSRF for public endpoints with API keys
  const apiKey = context.request.headers.get('X-API-Key');

  if (apiKey) {
    // Validate API key instead of CSRF
    const isValidKey = await validateAPIKey(apiKey);
    if (!isValidKey) {
      return new Response('Invalid API key', { status: 401 });
    }
  } else {
    // For browser requests, validate CSRF
    const csrfValid = await validateCSRF(context);
    if (!csrfValid) {
      return new Response('CSRF validation failed', { status: 403 });
    }
  }

  // Process request...
};
```

### Issue 5: Tests failing due to CSRF

**Symptoms**:
- Integration tests return 403
- API tests cannot authenticate

**Solution 1: Mock CSRF validation in tests**
```typescript
// tests/setup.ts
import { vi } from 'vitest';

vi.mock('@/lib/csrf', () => ({
  validateCSRF: vi.fn(() => Promise.resolve(true)),
  generateCSRFToken: vi.fn(() => 'test-token'),
  setCSRFCookie: vi.fn(() => 'test-token'),
}));
```

**Solution 2: Generate real tokens in tests**
```typescript
// tests/api/cart.test.ts
import { generateCSRFToken } from '@/lib/csrf';

test('should add item to cart', async () => {
  const token = generateCSRFToken();

  const response = await fetch('/api/cart/add', {
    method: 'POST',
    headers: {
      'Cookie': `csrf_token=${token}`,
      'X-CSRF-Token': token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      itemType: 'course',
      itemId: '123',
      quantity: 1,
    }),
  });

  expect(response.status).toBe(200);
});
```

---

## Security Considerations

### Token Generation

**✅ Secure**:
```typescript
// Uses cryptographically secure random
crypto.randomBytes(32).toString('base64url');
```

**❌ Insecure**:
```typescript
// Never use Math.random() for security tokens
Math.random().toString(36); // NOT SECURE!
```

### Token Validation

**✅ Timing-Safe Comparison**:
```typescript
// Prevents timing attacks
crypto.timingSafeEqual(
  Buffer.from(cookieToken, 'utf8'),
  Buffer.from(requestToken, 'utf8')
);
```

**❌ Regular Comparison**:
```typescript
// Vulnerable to timing attacks
if (cookieToken === requestToken) {
  // Attacker can measure response time to guess token
}
```

### Cookie Configuration

**✅ Secure Settings**:
```typescript
cookies.set('csrf_token', token, {
  httpOnly: true,        // Prevent JavaScript access
  secure: true,          // HTTPS only (production)
  sameSite: 'strict',   // Prevent cross-site sending
  maxAge: 7200,          // 2 hours expiration
  path: '/',             // Available site-wide
});
```

**❌ Insecure Settings**:
```typescript
cookies.set('csrf_token', token, {
  httpOnly: false,       // ❌ Vulnerable to XSS
  secure: false,         // ❌ Can be intercepted over HTTP
  sameSite: 'none',     // ❌ Defeats purpose of CSRF protection
  maxAge: 86400 * 365,  // ❌ Too long, increases attack window
});
```

### Method Filtering

CSRF protection should only apply to state-changing methods:

**Protected**: POST, PUT, DELETE, PATCH
**Not Protected**: GET, HEAD, OPTIONS

```typescript
// Automatic in validateCSRF()
const method = request.method.toUpperCase();
const safeMethods = ['GET', 'HEAD', 'OPTIONS'];

if (safeMethods.includes(method)) {
  return true; // No CSRF validation needed
}
```

### Defense in Depth

CSRF protection works best as part of a layered security approach:

1. **SameSite Cookies**: First line of defense (browsers that support it)
2. **CSRF Tokens**: Works even on older browsers
3. **Origin/Referer Checking**: Additional validation layer
4. **Authentication**: Ensures user is who they say they are
5. **Authorization**: Ensures user can perform the action

Example with all layers:
```typescript
export const POST: APIRoute = async (context) => {
  // 1. Check authentication
  const user = await getAuthenticatedUser(context);
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  // 2. Validate CSRF token
  const csrfValid = await validateCSRF(context);
  if (!csrfValid) {
    return new Response('CSRF validation failed', { status: 403 });
  }

  // 3. Validate Origin header
  const origin = context.request.headers.get('origin');
  const allowedOrigins = [process.env.BASE_URL];
  if (origin && !allowedOrigins.includes(origin)) {
    return new Response('Invalid origin', { status: 403 });
  }

  // 4. Check authorization
  const body = await context.request.json();
  const canPerformAction = await checkPermission(user.id, body.action);
  if (!canPerformAction) {
    return new Response('Forbidden', { status: 403 });
  }

  // 5. Rate limiting
  const rateLimitResult = await rateLimit(context);
  if (!rateLimitResult.allowed) {
    return new Response('Too many requests', { status: 429 });
  }

  // All checks passed - process request
  // ... rest of handler
};
```

---

## Best Practices

### DO:
- ✅ Generate new tokens for each session
- ✅ Use timing-safe comparison for validation
- ✅ Set short expiration times (2 hours max)
- ✅ Use httpOnly and sameSite cookies
- ✅ Log CSRF validation failures for monitoring
- ✅ Provide clear error messages to developers
- ✅ Test CSRF protection in both manual and automated tests

### DON'T:
- ❌ Reuse tokens across sessions
- ❌ Store tokens in localStorage (vulnerable to XSS)
- ❌ Use predictable token generation (Math.random)
- ❌ Apply CSRF to webhooks (use signatures instead)
- ❌ Set overly long expiration times
- ❌ Disable CSRF in production "for testing"
- ❌ Expose tokens in URLs (use headers or form fields)

---

## Additional Resources

- **OWASP CSRF Prevention**: https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html
- **Double Submit Cookie Pattern**: https://owasp.org/www-community/attacks/csrf#double-submit-cookie
- **SameSite Cookie Attribute**: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite

---

**This guide should be updated as the CSRF implementation evolves.**

**Last Review**: 2025-11-03
**Next Review**: After any changes to CSRF system or security requirements
