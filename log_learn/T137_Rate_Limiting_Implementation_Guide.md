# T137: Rate Limiting Implementation - Learning Guide

**Task ID**: T137  
**Topic**: API Rate Limiting  
**Level**: Intermediate  
**Estimated Reading Time**: 20-30 minutes

---

## Table of Contents

1. [What is Rate Limiting?](#what-is-rate-limiting)
2. [Why Rate Limiting Matters](#why-rate-limiting-matters)
3. [Rate Limiting Algorithms](#rate-limiting-algorithms)
4. [Implementation with Redis](#implementation-with-redis)
5. [Rate Limit Profiles](#rate-limit-profiles)
6. [Client Identification](#client-identification)
7. [Error Handling Strategies](#error-handling-strategies)
8. [Best Practices](#best-practices)
9. [Testing Rate Limiting](#testing-rate-limiting)
10. [Real-World Examples](#real-world-examples)

---

## What is Rate Limiting?

Rate limiting is a technique to control the rate at which users or systems can access an API or service.

**Simple Analogy**: Like a bouncer at a club who limits how many people can enter per hour.

### Basic Concept

```
User makes 5 requests → All allowed ✅
User makes 6th request → Blocked ❌ (limit: 5 per minute)
Wait 1 minute → Limit resets → Requests allowed again ✅
```

---

## Why Rate Limiting Matters

### Security Benefits

**1. Brute Force Protection**
```
Login attempts without rate limiting:
- Attacker tries 1000 passwords/second
- Cracks account in minutes

Login attempts with rate limiting (5/15min):
- Attacker tries 5 passwords, then must wait 15 minutes
- Takes weeks/months to crack
```

**2. DDoS Prevention**
```
Without rate limiting:
- Attacker sends 100,000 requests/second
- Server crashes

With rate limiting (100/minute per IP):
- Each IP limited to reasonable traffic
- Server stays stable
```

**3. Scraping Prevention**
```
Scraper behavior:
- Makes 1000s of search requests
- Steals all product data

Rate limited (30 searches/minute):
- Scraping becomes impractical
- Legitimate users unaffected
```

### Business Benefits

- **Cost Control**: Prevents API abuse that increases infrastructure costs
- **Fair Usage**: Ensures all users get equal access
- **Service Quality**: Prevents one user from degrading service for others

---

## Rate Limiting Algorithms

### 1. Fixed Window Counter

**How it works**:
```
Window: 1 minute (00:00 - 01:00)
Limit: 10 requests

00:00: Request 1-10 → Allowed ✅
00:59: Request 11 → Blocked ❌
01:00: Counter resets → Request 12 → Allowed ✅
```

**Pros**: Simple to implement
**Cons**: Burst traffic at window boundaries

### 2. Sliding Window (Used in T137) ⭐

**How it works**:
```
Window: 60 seconds rolling
Limit: 10 requests

Time: 00:00 - Make 10 requests
Time: 00:30 - Try request 11 → Blocked (10 in last 60s)
Time: 01:01 - Try request 12 → Allowed (oldest request expired)
```

**Pros**: Smooth rate limiting, no burst issues
**Cons**: Slightly more complex

**Implementation**:
```typescript
// Store timestamps in Redis sorted set
await redis.zAdd(key, { score: timestamp, value: requestId });

// Remove old entries
await redis.zRemRangeByScore(key, 0, now - windowSeconds);

// Count remaining
const count = await redis.zCard(key);
```

### 3. Token Bucket

Gives users "tokens" they spend on requests. Tokens refill over time.

**Example**:
```
Bucket: 10 tokens, refill 1/second
User makes 10 requests quickly → All allowed, bucket empty
User waits 5 seconds → 5 tokens refilled
User makes 3 requests → Allowed (2 tokens remain)
```

---

## Implementation with Redis

### Why Redis?

1. **Fast**: In-memory operations (microseconds)
2. **Shared**: Multiple servers can share rate limits
3. **Persistent**: Survives application restarts
4. **Built-in Expiration**: Auto-cleanup of old data

### Data Structure

```typescript
// Redis sorted set for sliding window
Key: "rl:auth:ip:192.168.1.1"
Members: [
  { score: 1699123400000, value: "1699123400000:0.123" },
  { score: 1699123410000, value: "1699123410000:0.456" },
  { score: 1699123420000, value: "1699123420000:0.789" }
]

// Score = timestamp (for range queries)
// Value = timestamp:random (for uniqueness)
```

### Redis Commands Used

```typescript
// Clean up old entries
zRemRangeByScore(key, 0, windowStart)

// Count current entries
zCard(key)

// Add new entry
zAdd(key, { score: now, value: unique })

// Set expiration (cleanup)
expire(key, windowSeconds + 10)
```

---

## Rate Limit Profiles

### Pre-configured Limits

```typescript
// Strict (High Security)
AUTH: 5 requests / 15 minutes
PASSWORD_RESET: 3 requests / 1 hour
EMAIL_VERIFY: 3 requests / 1 hour

// Moderate (User Experience)
CHECKOUT: 10 requests / 1 minute
UPLOAD: 10 requests / 10 minutes

// Lenient (General Usage)
SEARCH: 30 requests / 1 minute
API: 100 requests / 1 minute
ADMIN: 200 requests / 1 minute (session-based)
CART: 100 requests / 1 hour (session-based)
```

### Choosing the Right Limit

**Questions to ask**:
1. What's a reasonable usage pattern?
   - Login: 1-2 times per session → 5/15min is generous
   - Search: Multiple searches per minute → 30/min allows normal usage

2. What attack are we preventing?
   - Brute force: Very strict limits
   - Scraping: Moderate limits
   - DDoS: Generous but effective limits

3. What's the business impact?
   - Payment endpoints: Very strict (fraud prevention)
   - Content browsing: Lenient (user experience)

---

## Client Identification

### Method 1: IP Address (Default)

```typescript
// Primary source
const ip = context.clientAddress;

// Fallback: Proxy headers
const ip = request.headers.get('x-forwarded-for');
const ip = request.headers.get('x-real-ip');
```

**Pros**: Works for anonymous users  
**Cons**: Multiple users behind same NAT share limits

### Method 2: Session ID (For Authenticated Users)

```typescript
const sessionId = context.cookies.get('session_id')?.value;
return `user:${sessionId}`;
```

**Pros**: Per-user limits, fair for shared IPs  
**Cons**: Requires authentication

### Hybrid Approach (Recommended)

```typescript
if (config.useUserId && sessionId) {
  return `user:${sessionId}`;
} else {
  return `ip:${ipAddress}`;
}
```

---

## Error Handling Strategies

### Fail Open vs Fail Closed

**Fail Open** (Used in T137) ⭐:
```typescript
try {
  // Check rate limit
  return await checkRedis();
} catch (error) {
  console.error('Redis error:', error);
  // Allow request when Redis fails
  return { allowed: true };
}
```

**Pros**: Service stays available  
**Cons**: No rate limiting during Redis outage

**Fail Closed**:
```typescript
catch (error) {
  // Block request when Redis fails
  return { allowed: false };
}
```

**Pros**: Security maintained  
**Cons**: Service unavailable during Redis outage

### When to Use Each

- **Fail Open**: User-facing services (login, checkout)
- **Fail Closed**: Internal APIs, admin endpoints

---

## Best Practices

### 1. Return Useful Headers

```
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1699123456
Retry-After: 45
```

**Benefits**:
- Clients know when to retry
- Debugging rate limit issues easier
- Better user experience

### 2. Provide Clear Error Messages

```json
{
  "error": "Too many requests. Please try again later.",
  "code": "RATE_LIMIT_EXCEEDED",
  "limit": 100,
  "resetAt": 1699123456,
  "retryAfter": 45
}
```

### 3. Log Rate Limit Events

```typescript
console.warn('[RateLimit] Exceeded:', {
  endpoint: '/api/login',
  client: 'ip:192.168.1.1',
  limit: 5,
  resetAt: new Date(resetAt * 1000)
});
```

### 4. Monitor Rate Limit Metrics

Track in production:
- Number of rate limited requests
- Most limited endpoints
- Most limited IP addresses
- False positive rate

### 5. Allow Rate Limit Resets (Admin Function)

```typescript
// Admin can reset limits for legitimate users
await resetRateLimit('ip:192.168.1.1', 'rl:auth');
```

---

## Testing Rate Limiting

### Unit Testing

```typescript
test('should block after limit', async () => {
  const config = { maxRequests: 3, windowSeconds: 60 };
  
  // Make 3 requests
  await checkRateLimit(context, config); // ✅
  await checkRateLimit(context, config); // ✅
  await checkRateLimit(context, config); // ✅
  
  // 4th should be blocked
  const result = await checkRateLimit(context, config);
  expect(result.allowed).toBe(false); // ❌
});
```

### Testing Window Expiration

```typescript
test('should allow after window expires', async () => {
  const config = { maxRequests: 2, windowSeconds: 1 };
  
  // Exhaust limit
  await checkRateLimit(context, config); // ✅
  await checkRateLimit(context, config); // ✅
  
  const blocked = await checkRateLimit(context, config);
  expect(blocked.allowed).toBe(false); // ❌
  
  // Wait for window to expire
  await new Promise(r => setTimeout(r, 1100));
  
  // Should work again
  const allowed = await checkRateLimit(context, config);
  expect(allowed.allowed).toBe(true); // ✅
});
```

### Integration Testing

```typescript
test('should rate limit login endpoint', async () => {
  // Make 5 login attempts
  for (let i = 0; i < 5; i++) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    expect(res.status).toBe(200); // ✅
  }
  
  // 6th should be rate limited
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
  expect(res.status).toBe(429); // ❌
});
```

---

## Real-World Examples

### Example 1: Protecting Login

```typescript
export const POST: APIRoute = async (context) => {
  // Rate limit: 5 attempts per 15 minutes
  const rateLimit = await checkRateLimit(
    context,
    RateLimitProfiles.AUTH
  );
  
  if (!rateLimit.allowed) {
    return new Response(JSON.stringify({
      error: 'Too many login attempts',
      retryAfter: rateLimit.resetAt - Math.floor(Date.now() / 1000)
    }), { status: 429 });
  }
  
  // Process login...
};
```

### Example 2: E-commerce Cart Protection

```typescript
export const POST: APIRoute = async (context) => {
  // Rate limit: 100 cart operations per hour
  const rateLimit = await checkRateLimit(
    context,
    RateLimitProfiles.CART
  );
  
  if (!rateLimit.allowed) {
    return new Response(JSON.stringify({
      error: 'Too many cart operations',
      message: 'Please slow down to prevent issues'
    }), { status: 429 });
  }
  
  // Add to cart...
};
```

### Example 3: Search API Protection

```typescript
export const GET: APIRoute = async (context) => {
  // Rate limit: 30 searches per minute
  const rateLimit = await checkRateLimit(
    context,
    RateLimitProfiles.SEARCH
  );
  
  if (!rateLimit.allowed) {
    return new Response(JSON.stringify({
      error: 'Search rate limit exceeded',
      suggestion: 'Try using filters to narrow your search'
    }), { status: 429 });
  }
  
  // Execute search...
};
```

---

## Conclusion

Rate limiting is essential for:
- **Security**: Preventing brute force and abuse
- **Stability**: Ensuring service availability
- **Fairness**: Equal access for all users
- **Cost Control**: Preventing infrastructure overload

**Key Takeaways**:
1. Use sliding window algorithm for smooth rate limiting
2. Choose appropriate limits based on use case
3. Fail open for user-facing services
4. Provide clear error messages and headers
5. Monitor and adjust limits based on real traffic

**Further Reading**:
- [OWASP Rate Limiting Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Denial_of_Service_Cheat_Sheet.html)
- [Redis Rate Limiting Patterns](https://redis.io/docs/manual/patterns/rate-limiter/)
- [RFC 6585 - HTTP 429 Too Many Requests](https://tools.ietf.org/html/rfc6585)

Happy Rate Limiting! 🛡️
