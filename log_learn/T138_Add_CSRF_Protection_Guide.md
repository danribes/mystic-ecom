# T138: CSRF Protection Implementation - Learning Guide

**Task ID**: T138  
**Topic**: Cross-Site Request Forgery (CSRF) Protection  
**Level**: Intermediate  
**Estimated Reading Time**: 25-35 minutes

---

## Table of Contents

1. [What is CSRF?](#what-is-csrf)
2. [Why CSRF Protection Matters](#why-csrf-protection-matters)
3. [CSRF Attack Examples](#csrf-attack-examples)
4. [CSRF Protection Patterns](#csrf-protection-patterns)
5. [Double-Submit Cookie Pattern](#double-submit-cookie-pattern)
6. [Implementation in Practice](#implementation-in-practice)
7. [Token Security](#token-security)
8. [Best Practices](#best-practices)
9. [Testing CSRF Protection](#testing-csrf-protection)
10. [Real-World Examples](#real-world-examples)

---

## What is CSRF?

CSRF (Cross-Site Request Forgery) is an attack that tricks a victim into performing unwanted actions on a web application where they're authenticated.

**Simple Analogy**: Imagine you're logged into your bank. An attacker tricks your browser into making a transfer request without your knowledge.

### Basic Concept

```
User logged into site A → Visits malicious site B → Site B makes request to site A
→ Browser includes cookies → Server thinks it's legitimate → Action executed ❌
```

---

## Why CSRF Protection Matters

### Security Impact

**Without CSRF Protection**:
```
1. User logs into banking site → Cookie created ✅
2. User visits attacker's site → Still logged in ✅
3. Attacker's site submits hidden form → Browser sends cookie ✅
4. Bank processes transfer → Money stolen ❌
```

**With CSRF Protection**:
```
1. User logs into banking site → Cookie + CSRF token created ✅
2. User visits attacker's site → Still logged in ✅
3. Attacker's site submits hidden form → No CSRF token ❌
4. Bank rejects request → Money safe ✅
```

### Business Impact

- **Financial Loss**: Unauthorized transactions
- **Data Breach**: Unauthorized data modifications
- **Reputation Damage**: User trust compromised
- **Compliance**: OWASP A01:2021 violation

---

## CSRF Attack Examples

### Example 1: Money Transfer Attack

**Vulnerable Code** (No CSRF Protection):
```typescript
export const POST: APIRoute = async ({ cookies }) => {
  const session = await getSession(cookies);
  if (!session) return unauthorized();

  const { to, amount } = await request.json();
  
  // ❌ No CSRF check - vulnerable!
  await transferMoney(session.userId, to, amount);
  
  return success();
};
```

**Attacker's Malicious Page**:
```html
<!-- User visits attacker.com -->
<form action="https://bank.com/api/transfer" method="POST" id="attack">
  <input name="to" value="attacker-account">
  <input name="amount" value="10000">
</form>
<script>
  // Auto-submit when page loads
  document.getElementById('attack').submit();
</script>
```

**What Happens**:
1. User is logged into bank.com (has session cookie)
2. User clicks link to attacker.com
3. Form auto-submits to bank.com
4. Browser includes bank.com cookies
5. Bank thinks it's legitimate request
6. Money transferred! ❌

### Example 2: Account Deletion Attack

**Vulnerable Endpoint**:
```typescript
export const DELETE: APIRoute = async ({ cookies }) => {
  const session = await getSession(cookies);
  
  // ❌ Just checking authentication isn't enough!
  await deleteAccount(session.userId);
  
  return success();
};
```

**Attacker's Script**:
```html
<img src="https://site.com/api/account/delete" 
     style="display:none">
```

**Result**: Account deleted when image "loads"

### Example 3: Email Change Attack

**Vulnerable Code**:
```typescript
export const PUT: APIRoute = async ({ cookies, request }) => {
  const session = await getSession(cookies);
  const { newEmail } = await request.json();
  
  // ❌ No CSRF check
  await updateEmail(session.userId, newEmail);
  
  return success();
};
```

**Attack**:
```javascript
// Attacker's AJAX request
fetch('https://site.com/api/profile/email', {
  method: 'PUT',
  credentials: 'include', // Include cookies
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ newEmail: 'attacker@evil.com' })
});
```

---

## CSRF Protection Patterns

### 1. Synchronizer Token Pattern

Server generates unique token for each session/form.

```
Server → Form → Client → Submit → Server validates
   ↓                                      ↑
  Token → Hidden input → Token in request → ✅/❌
```

**Pros**: Very secure  
**Cons**: Requires state management

### 2. Double-Submit Cookie Pattern ⭐ (Used in T138)

Server generates token, sends in both cookie AND response. Client includes in request.

```
Server                     Client                    Server
  ↓                          ↓                         ↓
Cookie: csrf=abc    →    Store token       →    Validate:
Response: abc       →    Include in request →    Cookie == Request
```

**Pros**: Stateless, simple  
**Cons**: Vulnerable if subdomain compromised

### 3. SameSite Cookie Attribute

Browser automatically prevents cross-site cookie sending.

```typescript
cookies.set('session', token, {
  sameSite: 'strict' // Only send on same site
});
```

**Pros**: Simple, automatic  
**Cons**: Browser support, breaks some flows

### Best Approach: Defense in Depth

```typescript
// Combine multiple protections:
1. Double-submit CSRF tokens
2. SameSite cookies
3. CORS configuration
4. Origin header validation
```

---

## Double-Submit Cookie Pattern

### How It Works

**Step 1: Token Generation**
```typescript
// Server generates cryptographically random token
const token = crypto.randomBytes(32).toString('base64url');
// Example: "hR3k9mP5vL2xW8nC1qA7dT6fG4jS0uY9"
```

**Step 2: Token Distribution**
```typescript
// Set in cookie (HttpOnly for session, readable for CSRF)
cookies.set('csrf_token', token, {
  httpOnly: false,  // Client can read
  secure: true,     // HTTPS only
  sameSite: 'lax',  // Additional protection
});

// Also include in response
return { csrfToken: token };
```

**Step 3: Client Storage**
```javascript
// Token now available in:
1. Cookie: document.cookie.csrf_token
2. JavaScript variable from response
```

**Step 4: Request Inclusion**
```javascript
// Client includes token in request
fetch('/api/action', {
  method: 'POST',
  headers: {
    'X-CSRF-Token': getCookie('csrf_token'),
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(data),
});
```

**Step 5: Server Validation**
```typescript
// Server compares tokens
const cookieToken = cookies.get('csrf_token').value;
const headerToken = request.headers.get('x-csrf-token');

if (cookieToken === headerToken) {
  // ✅ Valid - process request
} else {
  // ❌ Invalid - reject with 403
}
```

### Why This Works

**Attacker cannot get the token**:
- Same-Origin Policy prevents reading cookies from other domains
- Even if attacker makes request, browser won't let them read response

```javascript
// Attacker tries to read token
fetch('https://victim.com/get-token', {
  credentials: 'include'
}).then(r => r.json()); // ❌ CORS blocks this!
```

---

## Implementation in Practice

### Using withCSRF Wrapper

**Before (Vulnerable)**:
```typescript
export const POST: APIRoute = async (context) => {
  // Handler logic...
  return new Response(JSON.stringify({ success: true }));
};
```

**After (Protected)**:
```typescript
import { withCSRF } from '@/lib/csrf';

const postHandler: APIRoute = async (context) => {
  // Handler logic...
  return new Response(JSON.stringify({ success: true }));
};

// Export with CSRF protection
export const POST = withCSRF(postHandler);
```

**What withCSRF Does**:
```typescript
export function withCSRF(handler) {
  return async (context) => {
    // 1. Extract tokens
    const cookieToken = context.cookies.get('csrf_token')?.value;
    const requestToken = context.request.headers.get('x-csrf-token');
    
    // 2. Validate
    if (!isValid(cookieToken, requestToken)) {
      return new Response(JSON.stringify({
        error: 'CSRF validation failed'
      }), { status: 403 });
    }
    
    // 3. Call original handler
    return handler(context);
  };
}
```

### HTML Forms

**Form with CSRF Token**:
```astro
---
import { getCSRFInput } from '@/lib/csrf';
---

<form method="POST" action="/api/action">
  {/* Hidden CSRF input */}
  {getCSRFInput(Astro.cookies)}
  
  <input type="text" name="data" />
  <button type="submit">Submit</button>
</form>
```

**Generated HTML**:
```html
<form method="POST" action="/api/action">
  <input type="hidden" name="csrf_token" value="hR3k9mP5vL2x...">
  <input type="text" name="data" />
  <button type="submit">Submit</button>
</form>
```

### AJAX Requests

**Client-Side**:
```javascript
// Get CSRF token from cookie
function getCookie(name) {
  const value = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
  return value ? value.pop() : '';
}

// Include in all POST/PUT/DELETE requests
async function apiRequest(url, data) {
  const csrfToken = getCookie('csrf_token');
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'X-CSRF-Token': csrfToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (response.status === 403) {
    // CSRF failed - refresh page to get new token
    window.location.reload();
  }
  
  return response.json();
}
```

---

## Token Security

### Cryptographic Randomness

**Strong** (Used in T138):
```typescript
crypto.randomBytes(32).toString('base64url');
// 256 bits of entropy
// Example: "hR3k9mP5vL2xW8nC1qA7dT6fG4jS0uY9"
```

**Weak** ❌:
```typescript
Math.random().toString(36);
// Predictable!
// Example: "0.a2b3c4d5"
```

### Why 32 Bytes (256 bits)?

```
Possible tokens: 2^256 = 115,792,089,237,316,195,423,570,985,008,687,907,853,269,984,665,640,564,039,457,584,007,913,129,639,936

Brute force time at 1 billion guesses/second:
3.6 × 10^60 years (age of universe: 1.38 × 10^10 years)
```

**Verdict**: Effectively unguessable

### Timing-Safe Comparison

**Vulnerable** ❌:
```typescript
if (cookieToken === requestToken) {
  // Returns as soon as first character differs
  // Attacker can measure timing to guess token!
}
```

**Secure** ✅:
```typescript
crypto.timingSafeEqual(
  Buffer.from(cookieToken),
  Buffer.from(requestToken)
);
// Always takes same time regardless of where tokens differ
```

**Why This Matters**:
```
Comparing "abc123" with:
"abc456" - fails at position 3
"xyz789" - fails at position 0

Without timing-safe: attacker measures response time
With timing-safe: all comparisons take same time
```

---

## Best Practices

### 1. Apply to All State-Changing Endpoints

```typescript
// ✅ Always protect these methods
POST, PUT, DELETE, PATCH

// ❌ Don't need protection
GET, HEAD, OPTIONS (should be safe operations)
```

### 2. Token Lifetime

```typescript
// Good balance
const TOKEN_MAX_AGE = 60 * 60 * 2; // 2 hours

// Too short: User frustration
const TOKEN_MAX_AGE = 60 * 5; // 5 minutes - too annoying

// Too long: Security risk
const TOKEN_MAX_AGE = 60 * 60 * 24 * 365; // 1 year - too risky
```

### 3. Error Handling

**Good Error Response**:
```json
{
  "success": false,
  "error": "CSRF validation failed",
  "code": "CSRF_TOKEN_INVALID",
  "message": "Please refresh the page and try again."
}
```

**Client Recovery**:
```javascript
if (error.code === 'CSRF_TOKEN_INVALID') {
  // Refresh to get new token
  window.location.reload();
}
```

### 4. Exempt Webhooks

```typescript
// Webhooks use different authentication
export function isCSRFExempt(request: Request): boolean {
  const url = new URL(request.url);
  
  return url.pathname.startsWith('/api/webhooks/') ||
         url.pathname === '/api/checkout/webhook';
}
```

### 5. Logging and Monitoring

```typescript
if (!valid) {
  console.warn('[CSRF] Validation failed:', {
    method: request.method,
    url: request.url,
    ip: clientAddress,
    timestamp: Date.now(),
  });
}
```

**Monitor for**:
- High failure rate (possible attack)
- Specific IPs with many failures (targeted attack)
- False positives (user experience issues)

---

## Testing CSRF Protection

### Unit Testing

**Test Token Generation**:
```typescript
test('should generate unique tokens', () => {
  const token1 = generateCSRFToken();
  const token2 = generateCSRFToken();
  
  expect(token1).not.toBe(token2);
  expect(token1.length).toBeGreaterThan(40);
});
```

**Test Validation**:
```typescript
test('should validate matching tokens', async () => {
  const token = setCSRFCookie(cookies);
  const request = createRequest({ csrfToken: token });
  
  const isValid = await validateCSRFToken(request, cookies);
  
  expect(isValid).toBe(true);
});

test('should reject mismatched tokens', async () => {
  setCSRFCookie(cookies);
  const request = createRequest({ csrfToken: 'wrong-token' });
  
  const isValid = await validateCSRFToken(request, cookies);
  
  expect(isValid).toBe(false);
});
```

### Integration Testing

```typescript
test('should protect endpoint', async () => {
  const token = setCSRFCookie(cookies);
  
  // Without token - should fail
  const failRes = await fetch('/api/action', {
    method: 'POST',
    body: JSON.stringify({ data: 'test' }),
  });
  expect(failRes.status).toBe(403);
  
  // With token - should succeed
  const successRes = await fetch('/api/action', {
    method: 'POST',
    headers: {
      'X-CSRF-Token': token,
    },
    body: JSON.stringify({ data: 'test' }),
  });
  expect(successRes.status).toBe(200);
});
```

### Security Testing

**Test Attack Vectors**:
```typescript
test('should prevent substring attacks', async () => {
  const token = setCSRFCookie(cookies);
  const substring = token.substring(0, token.length - 5);
  
  const request = createRequest({ csrfToken: substring });
  const isValid = await validateCSRFToken(request, cookies);
  
  expect(isValid).toBe(false);
});

test('should prevent prefix attacks', async () => {
  const token = setCSRFCookie(cookies);
  const prefixed = token + 'extra';
  
  const request = createRequest({ csrfToken: prefixed });
  const isValid = await validateCSRFToken(request, cookies);
  
  expect(isValid).toBe(false);
});
```

---

## Real-World Examples

### Example 1: User Profile Update

```typescript
// src/pages/api/profile/update.ts
import { withCSRF } from '@/lib/csrf';

const updateHandler: APIRoute = async ({ request, cookies }) => {
  const session = await getSession(cookies);
  if (!session) return unauthorized();
  
  const { name, email } = await request.json();
  
  // Validate and update
  await updateProfile(session.userId, { name, email });
  
  return success();
};

export const PUT = withCSRF(updateHandler);
```

### Example 2: File Upload

```typescript
// src/pages/api/upload.ts
import { withCSRF } from '@/lib/csrf';
import { rateLimit, RateLimitProfiles } from '@/lib/ratelimit';

const uploadHandler: APIRoute = async (context) => {
  // Rate limiting
  const rateLimitResult = await rateLimit(context, RateLimitProfiles.UPLOAD);
  if (!rateLimitResult.allowed) {
    return tooManyRequests();
  }
  
  // Process upload
  const formData = await context.request.formData();
  const file = formData.get('file') as File;
  
  const url = await uploadFile(file);
  
  return success({ url });
};

export const POST = withCSRF(uploadHandler);
```

### Example 3: Admin Action

```typescript
// src/pages/api/admin/users/delete.ts
import { withCSRF } from '@/lib/csrf';
import { withAdminAuth } from '@/lib/adminAuth';

const deleteHandler: APIRoute = async ({ request }) => {
  const { userId } = await request.json();
  
  await deleteUser(userId);
  
  return success();
};

// Both admin auth AND CSRF protection
export const DELETE = withAdminAuth(withCSRF(deleteHandler));
```

---

## Conclusion

CSRF protection is essential for:
- **Security**: Preventing unauthorized state-changing actions
- **Trust**: Protecting user accounts and data
- **Compliance**: Meeting OWASP security standards
- **Business**: Avoiding financial and reputational damage

**Key Takeaways**:
1. Use double-submit cookie pattern for stateless CSRF protection
2. Apply to ALL state-changing endpoints (POST, PUT, DELETE, PATCH)
3. Use cryptographically random tokens (256 bits minimum)
4. Implement timing-safe comparison
5. Combine with other security measures (SameSite, CORS)
6. Monitor and log CSRF failures
7. Test thoroughly (unit, integration, security)

**Further Reading**:
- [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [CWE-352: Cross-Site Request Forgery](https://cwe.mitre.org/data/definitions/352.html)
- [RFC 6265: HTTP State Management (Cookies)](https://tools.ietf.org/html/rfc6265)

Happy Secure Coding! 🔒
