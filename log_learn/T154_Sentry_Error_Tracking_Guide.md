# T154: Sentry Error Tracking - Learning Guide

**Task**: Setup monitoring and error tracking with Sentry
**Date**: November 5, 2025
**Difficulty**: Intermediate
**Technologies**: Sentry, Error Monitoring, APM, DevOps

---

## Table of Contents

1. [Introduction](#introduction)
2. [Why Error Tracking Matters](#why-error-tracking-matters)
3. [Key Concepts](#key-concepts)
4. [Understanding Sentry](#understanding-sentry)
5. [Implementation Guide](#implementation-guide)
6. [Sensitive Data Protection](#sensitive-data-protection)
7. [Performance Monitoring](#performance-monitoring)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

---

## Introduction

This guide teaches you how to implement production-grade error tracking and monitoring using Sentry. You'll learn why error tracking is essential, how Sentry works, and how to use it effectively.

### What You'll Learn

- What error tracking is and why it matters
- How Sentry captures and reports errors
- Implementing Sentry in an Astro application
- Protecting sensitive data
- Performance monitoring
- Error context and debugging
- Best practices for production monitoring

### Prerequisites

- Basic understanding of JavaScript/TypeScript
- Familiarity with web applications
- Understanding of errors and exceptions
- Basic knowledge of production deployments

---

## Why Error Tracking Matters

### The Problem: Invisible Errors

**Without Error Tracking**:
```
User: "The checkout isn't working!"
Developer: "It works on my machine... 🤔"
```

**The Reality**:
- Errors happen in production, not just development
- Users don't report errors - they just leave
- Console.log() doesn't work in production
- You can't debug what you can't see

### The Solution: Automated Error Tracking

**With Sentry**:
```
Sentry Alert: "Payment processing failed for 47 users in last hour"
- Error: Stripe API timeout
- Affected: Users in EU region
- Browser: Chrome 119
- Time: 2:47 PM UTC
- Stack trace: checkout.ts:line 234
```

### Business Impact

**Benefits**:
- ✅ Know about errors before users complain
- ✅ Fix issues faster with detailed context
- ✅ Reduce user churn and improve satisfaction
- ✅ Track error trends over time
- ✅ Measure deployment quality

**Real-World Example**:
```
Before Sentry:
- Users abandon checkout (you don't know why)
- Support tickets pile up
- Revenue lost

After Sentry:
- Alert: Payment gateway timeout (5 min after it starts)
- Fix deployed within 30 minutes
- Revenue protected
```

---

## Key Concepts

### 1. Error Tracking

**What**: Automatic capture and reporting of application errors

**How It Works**:
```
1. Error occurs in your application
   ↓
2. Sentry SDK catches the error
   ↓
3. Error sent to Sentry servers
   ↓
4. You receive alert
   ↓
5. View error details in dashboard
   ↓
6. Fix the bug
```

### 2. Error Context

**What**: Additional information attached to errors for debugging

**Example**:
```typescript
// Error with NO context (useless):
Error: Payment failed

// Error with context (actionable):
Error: Payment failed
- User ID: 12345
- Amount: $99.99
- Card: Visa ending in 4242
- Time: 2025-11-05 14:32:15
- Browser: Chrome 119
- Location: checkout.ts:234
```

### 3. Breadcrumbs

**What**: Trail of events leading up to an error

**Think of it like**:
```
Breadcrumbs = GPS history for errors

[14:30:15] User clicked "Buy Now"
[14:30:17] Added item to cart
[14:30:22] Proceeded to checkout
[14:30:25] Entered payment info
[14:30:28] Clicked "Pay"
[14:30:29] ❌ Payment failed
```

**Why It Helps**:
You can see exactly what the user did before the error occurred.

### 4. Sampling

**What**: Only send a percentage of events to reduce costs

**Example**:
```typescript
{
  tracesSampleRate: 0.1  // 10% of transactions monitored
}
```

**Why**: Monitor production without paying for every single request.

### 5. Sensitive Data Filtering

**What**: Remove passwords, credit cards, API keys before sending to Sentry

**Why**: Security and compliance (GDPR, PCI-DSS)

**Example**:
```typescript
// Before filtering:
{
  password: "mySecretPassword123",
  creditCard: "4242424242424242"
}

// After filtering:
{
  password: "REDACTED",
  creditCard: "REDACTED"
}
```

---

## Understanding Sentry

### Architecture

```
┌─────────────────┐
│ Your Application│
│   (Browser/API) │
└────────┬────────┘
         │ Sentry SDK captures error
         ↓
┌────────────────────┐
│   Sentry SDK       │
│ - Captures errors  │
│ - Adds context     │
│ - Filters data     │
└────────┬───────────┘
         │ HTTPS
         ↓
┌────────────────────┐
│  Sentry.io Server  │
│ - Stores errors    │
│ - Groups issues    │
│ - Sends alerts     │
└────────┬───────────┘
         │ Alert
         ↓
┌────────────────────┐
│  Your Team         │
│ - Email            │
│ - Slack            │
│ - PagerDuty        │
└────────────────────┘
```

### Key Features

#### 1. Error Grouping
```
Instead of seeing:
- "Cannot read property 'x' of undefined" (1000 times)

You see:
- "Cannot read property 'x' of undefined" (1 issue, 1000 occurrences)
```

#### 2. Stack Traces
```javascript
Error: Payment processing failed
  at processPayment (checkout.ts:234:15)
  at handleSubmit (CheckoutForm.tsx:89:20)
  at onClick (Button.tsx:45:10)
```

**Why It Helps**: Shows exactly where the error occurred in your code.

#### 3. Release Tracking
```
v1.2.0: 50 errors
v1.2.1: 5 errors ← Fix worked!
```

#### 4. User Impact
```
Error affects:
- 47 users
- 0.2% of all users
Priority: High (affects revenue)
```

---

## Implementation Guide

### Step 1: Install Sentry

```bash
npm install --save @sentry/node @sentry/astro
```

**What Gets Installed**:
- `@sentry/node`: Core Sentry SDK for Node.js
- `@sentry/astro`: Astro-specific integration

---

### Step 2: Create Configuration

**File**: `src/lib/sentry.ts`

```typescript
import * as Sentry from '@sentry/node';

export function initSentry(): void {
  const dsn = process.env.SENTRY_DSN;
  const environment = process.env.NODE_ENV;

  // Only initialize in production
  if (dsn && environment === 'production') {
    Sentry.init({
      dsn,                              // Where to send errors
      environment,                      // production, staging, development
      tracesSampleRate: 0.1,           // 10% of transactions
      release: process.env.npm_package_version,  // Track releases
    });
  }
}
```

**Understanding Each Setting**:

#### DSN (Data Source Name)
```
dsn: "https://abc123@sentry.io/456789"
       ↑     ↑              ↑
       │     │              └─ Project ID
       │     └─ Public key
       └─ Protocol
```

**What It Is**: Your unique Sentry project identifier
**Where To Get It**: Sentry dashboard → Project Settings → Client Keys

#### Environment
```typescript
environment: 'production'  // or 'staging', 'development'
```

**Why**: Filter errors by environment in dashboard
**Example Use**: See only production errors, ignore development errors

#### Traces Sample Rate
```typescript
tracesSampleRate: 0.1  // 10%
```

**What It Means**:
- Monitor 10% of all transactions for performance
- Reduces costs while still catching issues
- In development: use 1.0 (100%) for testing

**Cost Example**:
```
1 million requests/month × 100% = $500/month
1 million requests/month × 10% = $50/month
```

#### Release
```typescript
release: '1.2.0'
```

**Why**: Track which version introduced bugs
**Use Case**: "Error started in v1.2.0, must be from latest deployment"

---

### Step 3: Capture Errors

#### Basic Error Capture
```typescript
import { captureException } from '../lib/sentry';

try {
  await processPayment(order);
} catch (error) {
  // Send error to Sentry
  captureException(error);

  // Still handle error normally
  return { success: false, error: 'Payment failed' };
}
```

#### Error with Context
```typescript
try {
  await processPayment(order);
} catch (error) {
  captureException(error, {
    userId: user.id,
    orderId: order.id,
    amount: order.total,
    paymentMethod: order.paymentMethod,
  });
}
```

**Why Context Matters**:
```
Without context:
"Error: Payment failed"
→ Which user? What amount? Can't debug.

With context:
"Error: Payment failed"
- User: john@example.com
- Amount: $99.99
- Card: Visa 4242
→ Can reproduce and fix!
```

---

### Step 4: Add Breadcrumbs

**What Breadcrumbs Do**:
Show the steps leading up to an error.

**Example**:
```typescript
import { addBreadcrumb } from '../lib/sentry';

// User starts checkout
addBreadcrumb({
  message: 'User started checkout',
  category: 'checkout',
  data: { cartTotal: 99.99 },
});

// User enters payment info
addBreadcrumb({
  message: 'Payment info entered',
  category: 'checkout',
  data: { paymentMethod: 'credit_card' },
});

// Payment fails
try {
  await processPayment(order);
} catch (error) {
  captureException(error);  // Breadcrumbs included automatically!
}
```

**In Sentry Dashboard**:
```
Breadcrumbs:
1. [14:30:15] User started checkout (cartTotal: $99.99)
2. [14:30:25] Payment info entered (paymentMethod: credit_card)
3. [14:30:29] ERROR: Payment failed
```

---

### Step 5: Track Users

**Why**: Know which users are affected by errors

```typescript
import { setUser } from '../lib/sentry';

// After user logs in
setUser({
  id: user.id,
  email: user.email,
  username: user.username,
});

// After user logs out
setUser(null);
```

**In Sentry Dashboard**:
```
Affected Users:
- john@example.com (ID: 12345)
- jane@example.com (ID: 67890)
→ Can notify them when fixed
```

---

### Step 6: Wrap Functions

**Automatic Error Capture**:

```typescript
import { wrapHandler } from '../lib/sentry';

// Without wrapping (manual):
export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const result = await processData(data);
    return new Response(JSON.stringify(result));
  } catch (error) {
    captureException(error);  // Must remember to add this
    throw error;
  }
};

// With wrapping (automatic):
export const POST: APIRoute = wrapHandler(async ({ request }) => {
  const data = await request.json();
  const result = await processData(data);
  return new Response(JSON.stringify(result));
  // Errors captured automatically!
});
```

**Benefits**:
- ✅ Never forget to capture errors
- ✅ Cleaner code
- ✅ Consistent error handling

---

## Sensitive Data Protection

### Why It Matters

**The Problem**:
```typescript
// User submits payment
{
  email: "user@example.com",
  password: "mySecretPassword123",
  creditCard: "4242424242424242",
  cvv: "123"
}

// ❌ BAD: This gets sent to Sentry!
```

**The Solution**: Filter before sending

```typescript
// After filtering:
{
  email: "user@example.com",
  password: "REDACTED",
  creditCard: "REDACTED",
  cvv: "REDACTED"
}

// ✅ GOOD: Sensitive data protected
```

### How Filtering Works

**Implementation**:
```typescript
const sensitiveKeys = [
  'password',
  'token',
  'secret',
  'apikey',
  'credit_card',
  'card_number',
  'cvv',
  'ssn',
];

function filterSensitiveObject(obj) {
  for (const [key, value] of Object.entries(obj)) {
    // If key is sensitive, redact it
    if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
      obj[key] = 'REDACTED';
    }
  }
  return obj;
}
```

### URLs and Query Parameters

**Problem**:
```
GET /api/reset?token=abc123secret456
                    ↑
                  Sensitive!
```

**Solution**:
```typescript
function filterSensitiveData(url) {
  // Remove token from URL
  return url.replace(/([?&])(token|apikey|secret)=[^&]*/gi, '$1$2=REDACTED');
}

// Result:
"GET /api/reset?token=REDACTED"
```

---

## Performance Monitoring

### What Is APM?

**APM = Application Performance Monitoring**

Track how fast your application runs:
```
Checkout flow:
- Add to cart: 50ms ✅
- Load checkout: 120ms ✅
- Process payment: 3500ms ❌ (too slow!)
```

### Implementing Transactions

**Basic Transaction**:
```typescript
import { startTransaction } from '../lib/sentry';

const transaction = startTransaction('checkout_process', 'function');

try {
  // Your code
  await processCheckout(cart);

  transaction.setStatus('ok');
} catch (error) {
  transaction.setStatus('error');
  captureException(error);
  throw error;
} finally {
  transaction.finish();  // Sends duration to Sentry
}
```

**In Sentry Dashboard**:
```
checkout_process:
- Average: 850ms
- p50: 650ms
- p95: 2100ms
- p99: 4500ms ← Some users experiencing slow checkouts
```

### Spans (Sub-Operations)

**Track individual steps**:
```typescript
const transaction = startTransaction('api_request', 'http');

// Database query
const dbSpan = transaction.startChild({ op: 'db.query' });
await db.query('SELECT * FROM users');
dbSpan.finish();

// External API call
const apiSpan = transaction.startChild({ op: 'http.client' });
await stripe.charges.create(...);
apiSpan.finish();

transaction.finish();
```

**In Sentry Dashboard**:
```
api_request (total: 500ms):
├─ db.query (100ms)
├─ http.client (350ms) ← Bottleneck!
└─ processing (50ms)
```

**Insight**: Stripe API is the slow part, not your code!

---

## Best Practices

### 1. Don't Over-Capture

**❌ Bad**:
```typescript
// Capturing expected errors
if (!user) {
  captureException(new Error('User not found'));  // This happens often!
}
```

**✅ Good**:
```typescript
// Only capture unexpected errors
if (!user) {
  return { error: 'User not found' };  // Expected, don't capture
}

try {
  await criticalOperation();
} catch (error) {
  captureException(error);  // Unexpected, capture it!
}
```

**Why**: Too many errors = expensive bill + noise

---

### 2. Use Error Levels

```typescript
import { captureMessage } from '../lib/sentry';

// Debug (not captured in production)
captureMessage('User clicked button', 'debug');

// Info
captureMessage('Payment processed successfully', 'info');

// Warning
captureMessage('Payment took 5 seconds (slow)', 'warning');

// Error
captureMessage('Payment failed', 'error');

// Fatal
captureMessage('Database connection lost', 'fatal');
```

**When To Use**:
- **Debug**: Development only
- **Info**: Informational events
- **Warning**: Something unusual but not broken
- **Error**: Something broken
- **Fatal**: System is down

---

### 3. Add Custom Tags

```typescript
captureException(error, {
  tags: {
    payment_gateway: 'stripe',
    region: 'us-east',
    user_tier: 'premium',
  },
});
```

**Why**: Filter errors in dashboard
**Example**: "Show only Stripe errors in US region"

---

### 4. Group Related Errors

**Problem**:
```
Error: Failed to fetch product 123
Error: Failed to fetch product 456
Error: Failed to fetch product 789
→ Creates 3 separate issues
```

**Solution**:
```typescript
captureException(error, {
  fingerprint: ['product-fetch-error'],
});

→ Creates 1 issue with 3 occurrences
```

---

### 5. Monitor Error Trends

**Track over time**:
```
Week 1: 100 errors
Week 2: 150 errors ↑ (getting worse)
Week 3: 50 errors ↓ (fixes deployed)
```

**Set Alerts**:
```
Alert if:
- Error rate > 10 errors/minute
- New error type appears
- Error affects > 100 users
```

---

## Troubleshooting

### Sentry Not Capturing Errors

**Check 1**: Is Sentry initialized?
```typescript
console.log('Sentry DSN:', process.env.SENTRY_DSN);  // Should not be undefined
console.log('Environment:', process.env.NODE_ENV);    // Should be 'production'
```

**Check 2**: Is error being caught?
```typescript
// ❌ Error caught and swallowed
try {
  riskyOperation();
} catch (error) {
  // Nothing here - error lost!
}

// ✅ Error caught and reported
try {
  riskyOperation();
} catch (error) {
  captureException(error);  // Now Sentry sees it
}
```

**Check 3**: Is error ignored?
```typescript
ignoreErrors: [
  'NetworkError',  // This error will NOT be sent to Sentry
]
```

---

### Too Many Errors

**Problem**: 10,000 errors/day = expensive!

**Solutions**:

1. **Reduce Sampling**:
```typescript
tracesSampleRate: 0.01  // 1% instead of 10%
```

2. **Filter Noisy Errors**:
```typescript
ignoreErrors: [
  'chrome-extension://',  // Browser extension errors
  'Network request failed',  // User offline
]
```

3. **Fix The Bugs**: Best solution!

---

### Can't See Stack Traces

**Problem**:
```
Error at <anonymous>:1:1
```

**Solution**: Upload source maps

```bash
npx sentry-cli releases files <version> upload-sourcemaps ./dist
```

**Result**:
```
Error at checkout.ts:234:15
```

---

## Further Learning

### Resources
- [Sentry Documentation](https://docs.sentry.io/)
- [Error Monitoring Best Practices](https://blog.sentry.io/category/best-practices/)
- [APM Guide](https://docs.sentry.io/product/performance/)

### Next Steps
1. Set up Sentry dashboard alerts
2. Integrate with Slack for notifications
3. Add custom tags for your business logic
4. Implement performance monitoring
5. Create error budgets (max errors allowed)

---

## Conclusion

### Key Takeaways

1. **Error Tracking Is Essential**: You can't fix what you can't see
2. **Context Is King**: Always include user ID, action, environment
3. **Protect Sensitive Data**: Filter before sending
4. **Don't Over-Capture**: Only capture unexpected errors
5. **Monitor Performance**: Track slow operations
6. **Use Breadcrumbs**: Show the trail leading to errors
7. **Set Up Alerts**: Know about issues before users complain

### Real-World Impact

**Before Sentry**:
- Errors discovered by angry users
- Hours spent trying to reproduce bugs
- Lost revenue from broken features
- Guessing which deploy broke production

**After Sentry**:
- Errors discovered automatically
- Minutes to identify and fix bugs
- Protected revenue with fast fixes
- Exact deploy that introduced issues

### Remember

> "The best error is the one you fix before users notice."

With Sentry, you can achieve this goal. Happy monitoring! 🚀
