# T207: Structured Logging System - Learning Guide

**Task ID**: T207
**Date**: 2025-11-03
**Purpose**: Educational guide for understanding and using structured logging

## Table of Contents

1. [What is Structured Logging?](#what-is-structured-logging)
2. [Why Structured Logging Matters](#why-structured-logging-matters)
3. [Security and Compliance](#security-and-compliance)
4. [How Our Implementation Works](#how-our-implementation-works)
5. [Usage Guide](#usage-guide)
6. [Best Practices](#best-practices)
7. [Migration from console.log](#migration-from-consolelog)
8. [Troubleshooting](#troubleshooting)

---

## What is Structured Logging?

### Traditional Logging (Unstructured)

Traditional logging uses plain text messages:

```typescript
console.log('User john logged in from 192.168.1.1 at 2025-11-03 10:30:00');
console.log('[ERROR] Database connection failed: timeout after 30s');
console.log('Payment of $100.00 processed for order #12345');
```

**Problems**:
- Hard to parse programmatically
- Difficult to search and filter
- No consistent format
- Can't aggregate or analyze easily
- Sensitive data easily leaked

### Structured Logging

Structured logging uses consistent, parseable formats (typically JSON):

```typescript
log.info('User logged in', {
  username: 'john',
  ip: '192.168.1.1',
  timestamp: '2025-11-03T10:30:00Z'
});

log.error('Database connection failed', {
  error: 'timeout',
  duration: 30000,
  host: 'db.example.com'
});

log.info('Payment processed', {
  amount: 100.00,
  currency: 'USD',
  orderId: '12345'
});
```

**Benefits**:
- ✅ Machine-readable (JSON)
- ✅ Easy to search and filter
- ✅ Consistent structure
- ✅ Supports log aggregation services (Datadog, ELK, CloudWatch)
- ✅ Automatic sensitive data redaction
- ✅ Contextual information (request IDs, user IDs)

---

## Why Structured Logging Matters

### 1. Security

**Problem**: Accidental secret leakage
```typescript
// ❌ DANGEROUS
console.log('User data:', user);
// Might log: { username: 'john', password: 'secret123', token: 'abc...' }
```

**Solution**: Automatic redaction
```typescript
// ✅ SAFE
log.info('User data', user);
// Logs: { username: 'john', password: '[REDACTED]', token: '[REDACTED]' }
```

### 2. Debugging Production Issues

**Problem**: Finding the root cause in text logs
```
[2025-11-03 10:30:00] User action
[2025-11-03 10:30:01] Processing...
[2025-11-03 10:30:02] Error occurred
[2025-11-03 10:30:03] Another user action
```

**Solution**: Search by structured fields
```typescript
// Find all errors for a specific user
// Query: level=error AND userId=john123

// Find slow API requests
// Query: duration > 1000 AND path=/api/users

// Find all payment failures
// Query: event=payment AND status=failed
```

### 3. Compliance (GDPR, PCI-DSS)

**GDPR Requirements**:
- Don't log personal data unnecessarily
- Delete logs containing personal data on request
- Protect personal data from unauthorized access

**Our Solution**:
```typescript
// Development: PII visible for debugging
log.info('User registered', { email: 'john@example.com', name: 'John Doe' });
// Logs: { email: 'john@example.com', name: 'John Doe' }

// Production: PII automatically redacted
log.info('User registered', { email: 'john@example.com', name: 'John Doe' });
// Logs: { email: '[PII_REDACTED]', name: '[PII_REDACTED]' }
```

**PCI-DSS Requirements**:
- Never log full card numbers
- Never log CVV
- Protect cardholder data

**Our Solution**:
```typescript
log.info('Payment processed', {
  cardNumber: '4532-1234-5678-9010',
  cvv: '123'
});
// Logs: { cardNumber: '[REDACTED]', cvv: '[REDACTED]' }
```

### 4. Monitoring and Alerting

**Use Case**: Trigger alerts on critical events

```typescript
// This log can trigger a PagerDuty alert
logSecurity('Multiple failed login attempts', 'critical', {
  username: 'admin',
  attempts: 5,
  ip: '192.168.1.100'
});
```

**Query in Datadog/CloudWatch**:
```
level=fatal OR (level=error AND event=security AND severity=critical)
→ Send alert to #incidents Slack channel
→ Page on-call engineer
```

---

## Security and Compliance

### Automatically Redacted Fields

Our logger redacts 30+ sensitive field patterns:

#### 1. Authentication Secrets (Always Redacted)
```typescript
{
  password: '[REDACTED]',
  passwordHash: '[REDACTED]',
  newPassword: '[REDACTED]',
  oldPassword: '[REDACTED]',
  currentPassword: '[REDACTED]',
  token: '[REDACTED]',
  accessToken: '[REDACTED]',
  refreshToken: '[REDACTED]',
  sessionToken: '[REDACTED]',
  apiKey: '[REDACTED]',
  secret: '[REDACTED]',
  secretKey: '[REDACTED]',
  privateKey: '[REDACTED]'
}
```

#### 2. Payment Data (Always Redacted)
```typescript
{
  creditCard: '[REDACTED]',
  cardNumber: '[REDACTED]',
  cvv: '[REDACTED]',
  ssn: '[REDACTED]',
  social_security_number: '[REDACTED]'
}
```

#### 3. PII (Redacted in Production Only)
```typescript
// Development: visible for debugging
{
  email: 'john@example.com',
  phoneNumber: '555-1234',
  address: '123 Main St',
  firstName: 'John',
  lastName: 'Doe',
  ip: '192.168.1.1'
}

// Production: redacted for GDPR
{
  email: '[PII_REDACTED]',
  phoneNumber: '[PII_REDACTED]',
  address: '[PII_REDACTED]',
  firstName: '[PII_REDACTED]',
  lastName: '[PII_REDACTED]',
  ip: '[PII_REDACTED]'
}
```

### How Redaction Works

#### Case-Insensitive Matching
```typescript
{
  PASSWORD: '[REDACTED]',      // Uppercase
  Password: '[REDACTED]',      // Capitalized
  password: '[REDACTED]',      // Lowercase
  pAsSwOrD: '[REDACTED]'       // Mixed case
}
```

#### Partial Field Name Matching
```typescript
{
  userPassword: '[REDACTED]',     // Contains 'password'
  myApiKey: '[REDACTED]',         // Contains 'apiKey'
  oldRefreshToken: '[REDACTED]'   // Contains 'refreshToken'
}
```

#### Nested Object Redaction
```typescript
log.info('User data', {
  user: {
    profile: {
      credentials: {
        password: 'secret'  // ← Redacted even when deeply nested
      }
    }
  }
});
```

### Circular Reference Handling

The logger safely handles circular object references:

```typescript
const user: any = { name: 'John' };
user.self = user;  // Circular reference

log.info('User data', user);
// Logs: { name: 'John', self: '[Circular]' }
// ✅ No stack overflow!
```

---

## How Our Implementation Works

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Application Code                      │
│  log.info('User logged in', { userId, ip })             │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                  Sanitization Layer                      │
│  • Detect sensitive fields (password, token, etc.)      │
│  • Detect PII (email, phone, address)                   │
│  • Detect circular references                           │
│  • Recursively sanitize nested objects                  │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                    Pino Logger                           │
│  • Apply log level filtering (debug/info/warn/error)    │
│  • Add timestamps and metadata                          │
│  • Format output (JSON in prod, pretty in dev)          │
│  • Defense-in-depth redaction                           │
└────────────────────┬────────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         ▼                       ▼
┌─────────────────┐    ┌──────────────────┐
│  Development    │    │   Production     │
│  Pretty Print   │    │   JSON Output    │
│  Colored        │    │   Aggregation    │
│  Multi-line     │    │   Datadog/ELK    │
└─────────────────┘    └──────────────────┘
```

### Log Levels

Our logger supports 5 log levels:

```typescript
log.debug('Cache hit', { key: 'user:123', ttl: 3600 });
// ▸ Development only
// ▸ Detailed diagnostic information
// ▸ Use for troubleshooting

log.info('User logged in', { userId: 'john123', ip: '192.168.1.1' });
// ▸ Production: Visible
// ▸ General informational messages
// ▸ Normal application flow

log.warn('Rate limit approaching', { requests: 95, limit: 100 });
// ▸ Production: Visible
// ▸ Potentially harmful situations
// ▸ Does not affect functionality

log.error('Database query failed', { error: err, query: 'SELECT...' });
// ▸ Production: Visible
// ▸ Error events
// ▸ Functionality affected, but app continues

log.fatal('Out of memory', { heapUsed: '2GB', heapTotal: '2GB' });
// ▸ Production: Visible
// ▸ Critical errors
// ▸ Application might terminate
```

### Environment-Specific Behavior

| Feature | Development | Production | Test |
|---------|-------------|------------|------|
| **Output Format** | Pretty (colored) | JSON | Silent |
| **Log Level** | debug+ | info+ | none |
| **PII Redaction** | ❌ Disabled | ✅ Enabled | ✅ Enabled |
| **Stack Traces** | ✅ Included | ❌ Excluded | ❌ Excluded |
| **Debug Logs** | ✅ Shown | ❌ Hidden | ❌ Hidden |

---

## Usage Guide

### Basic Logging

```typescript
import { log } from './lib/logger';

// Simple message
log.info('Application started');

// With structured data
log.info('User registered', {
  userId: user.id,
  email: user.email,  // Redacted in production
  plan: 'premium'
});

// With errors
try {
  await processPayment(order);
} catch (error) {
  log.error('Payment processing failed', {
    error,           // Automatically serialized
    orderId: order.id,
    amount: order.total
  });
}
```

### Helper Functions

We provide specialized functions for common patterns:

#### 1. Database Queries
```typescript
import { logQuery } from './lib/logger';

const start = Date.now();
const result = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
const duration = Date.now() - start;

logQuery('SELECT * FROM users WHERE id = $1', duration, [userId]);
// Logs: { query: 'SELECT * FROM users...', duration: 15, paramsCount: 1 }
```

#### 2. API Requests
```typescript
import { logRequest } from './lib/logger';

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logRequest(
      req.method,
      req.path,
      res.statusCode,
      duration,
      req.user?.id
    );
  });
  next();
});
// Logs: { method: 'GET', path: '/api/users', statusCode: 200, duration: 45, userId: '123' }
```

#### 3. Authentication Events
```typescript
import { logAuth } from './lib/logger';

// Successful login
logAuth('login', user.id, {
  ip: req.ip,
  userAgent: req.headers['user-agent']
});

// Failed login
logAuth('failed_login', undefined, {
  username: 'admin',
  ip: req.ip,
  reason: 'Invalid password'
});

// Logout
logAuth('logout', user.id);
```

#### 4. Payment Events
```typescript
import { logPayment } from './lib/logger';

// Payment initiated
logPayment('initiated', 1000, 'USD', user.id, {
  orderId: order.id,
  method: 'credit_card'
});

// Payment succeeded
logPayment('succeeded', 1000, 'USD', user.id, {
  orderId: order.id,
  transactionId: transaction.id
});

// Payment failed
logPayment('failed', 1000, 'USD', user.id, {
  orderId: order.id,
  error: 'Insufficient funds'
});
```

#### 5. Security Events
```typescript
import { logSecurity } from './lib/logger';

// Rate limiting
logSecurity('Rate limit exceeded', 'medium', {
  ip: req.ip,
  endpoint: req.path,
  requests: 150
});

// Suspicious activity
logSecurity('Multiple failed logins', 'high', {
  username: 'admin',
  attempts: 5,
  ip: req.ip
});

// Critical security issue
logSecurity('SQL injection attempt detected', 'critical', {
  query: req.query.search,
  ip: req.ip
});
```

#### 6. Performance Metrics
```typescript
import { logPerformance } from './lib/logger';

const start = Date.now();
const result = await expensiveOperation();
const duration = Date.now() - start;

logPerformance('expensiveOperation', duration, {
  itemCount: result.length,
  cacheHit: false
});
// Uses log.warn if duration > 1000ms, log.debug otherwise
```

### Child Loggers (Request Context)

Child loggers inherit context, useful for request-scoped logging:

```typescript
import { log } from './lib/logger';

// Create request-specific logger
app.use((req, res, next) => {
  req.log = log.child({
    requestId: req.id,
    method: req.method,
    path: req.path,
    userId: req.user?.id
  });
  next();
});

// Use in route handlers
app.get('/api/users/:id', async (req, res) => {
  req.log.info('Fetching user');
  // Logs: { requestId: '123', method: 'GET', path: '/api/users/456', userId: 'john', message: 'Fetching user' }

  const user = await db.getUser(req.params.id);

  req.log.info('User fetched', { cached: false });
  // Logs: { requestId: '123', method: 'GET', ..., cached: false, message: 'User fetched' }

  res.json(user);
});
```

---

## Best Practices

### 1. Log Levels: When to Use Each

**Debug**: Detailed diagnostic information
```typescript
log.debug('Cache lookup', { key: 'user:123', hit: true, ttl: 3600 });
log.debug('Query plan', { plan: queryPlan, estimatedRows: 1000 });
```

**Info**: Normal application flow
```typescript
log.info('Server started', { port: 3000, env: 'production' });
log.info('User action completed', { action: 'profile_update', userId: '123' });
```

**Warn**: Potentially harmful situations that don't affect functionality
```typescript
log.warn('Deprecated API used', { endpoint: '/api/v1/users', ip: req.ip });
log.warn('Slow query detected', { query: 'SELECT...', duration: 2500 });
```

**Error**: Error events that affect functionality
```typescript
log.error('External API call failed', { service: 'stripe', error: err });
log.error('Database connection lost', { host: 'db.example.com', error: err });
```

**Fatal**: Critical errors that might cause app termination
```typescript
log.fatal('Unrecoverable error', { error: err, context: 'startup' });
log.fatal('Out of memory', { heapUsed: process.memoryUsage().heapUsed });
```

### 2. What to Log

**✅ DO Log**:
- User actions (login, logout, profile updates)
- API requests and responses (method, path, status, duration)
- Database queries (query, duration, row count)
- External API calls (service, endpoint, duration, status)
- Errors and exceptions (with context)
- Performance metrics (slow operations)
- Security events (failed logins, rate limiting)
- Business events (payments, orders, subscriptions)

**❌ DON'T Log**:
- Passwords (automatically redacted)
- API keys, tokens (automatically redacted)
- Credit card data (automatically redacted)
- Excessive PII in production (automatically redacted)
- Inside tight loops (performance impact)
- Redundant information already in metadata

### 3. Structured Data Format

**✅ Good: Structured and searchable**
```typescript
log.info('Payment processed', {
  amount: 100.00,
  currency: 'USD',
  orderId: '12345',
  userId: 'john123',
  method: 'credit_card',
  duration: 150
});
```

**❌ Bad: Unstructured string**
```typescript
log.info(`Payment of $100.00 USD processed for order #12345 by user john123 using credit_card in 150ms`);
```

**Why?** The structured version allows queries like:
- "All payments over $1000": `amount > 1000`
- "Failed credit card payments": `method=credit_card AND status=failed`
- "Slow payment processing": `duration > 1000`

### 4. Message Format

**✅ Good: Concise, descriptive message with structured data**
```typescript
log.info('User logged in', { userId: '123', ip: '192.168.1.1', method: 'oauth' });
```

**❌ Bad: All information in message string**
```typescript
log.info(`User 123 logged in from 192.168.1.1 using oauth`);
```

**✅ Good: Action-oriented, present tense**
```typescript
log.info('Processing payment');
log.info('Payment processed');
log.error('Payment processing failed');
```

**❌ Bad: Vague or past tense**
```typescript
log.info('Payment stuff happening');
log.info('Did payment processing');
```

### 5. Error Logging

**✅ Good: Include error object and context**
```typescript
try {
  await processOrder(order);
} catch (error) {
  log.error('Order processing failed', {
    error,              // Error object (automatically serialized)
    orderId: order.id,
    userId: order.userId,
    items: order.items.length,
    total: order.total
  });
  throw error; // Re-throw if appropriate
}
```

**❌ Bad: Lose error context**
```typescript
try {
  await processOrder(order);
} catch (error) {
  log.error('Something went wrong');  // ❌ No error details!
}
```

### 6. Performance Considerations

**❌ Avoid logging in tight loops**
```typescript
// BAD: Logs 10,000 times
for (const item of items) {  // 10,000 items
  log.debug('Processing item', { id: item.id });  // ❌ Too much!
  processItem(item);
}
```

**✅ Log summary instead**
```typescript
// GOOD: Logs once
log.debug('Processing items batch', { count: items.length });
for (const item of items) {
  processItem(item);
}
log.debug('Items processed', { count: items.length, duration: elapsed });
```

**✅ Use log levels appropriately**
```typescript
// Development: Verbose logging
log.debug('Cache lookup', { key: 'user:123' });  // Only in dev

// Production: Only info and above
log.info('User registered', { userId: '123' });  // Visible in prod
```

---

## Migration from console.log

### Step 1: Import the Logger

```typescript
// Add to top of file
import { log } from './lib/logger';
```

### Step 2: Replace console.log

**Before:**
```typescript
console.log('User logged in:', userId);
console.log('[DEBUG] Cache hit for key:', key);
console.error('Database error:', error);
console.warn('Deprecated feature used');
```

**After:**
```typescript
log.info('User logged in', { userId });
log.debug('Cache hit', { key });
log.error('Database error', { error });
log.warn('Deprecated feature used');
```

### Step 3: Restructure Data

**Before (unstructured):**
```typescript
console.log(`User ${userId} created order #${orderId} for $${total}`);
```

**After (structured):**
```typescript
log.info('Order created', { userId, orderId, total });
```

### Step 4: Use Helper Functions

**Before:**
```typescript
console.log(`[AUTH] User ${userId} logged in from ${ip}`);
```

**After:**
```typescript
import { logAuth } from './lib/logger';
logAuth('login', userId, { ip });
```

### Migration Checklist

- [ ] Import logger in file
- [ ] Replace `console.log(` with `log.info(`
- [ ] Replace `console.error(` with `log.error(`
- [ ] Replace `console.warn(` with `log.warn(`
- [ ] Replace `console.debug(` with `log.debug(`
- [ ] Convert string concatenation to structured objects
- [ ] Use helper functions where appropriate
- [ ] Test in development (verify output)
- [ ] Test in production (verify JSON format)

---

## Troubleshooting

### Problem: Logs not appearing in development

**Cause**: Log level too low

**Solution**: Check NODE_ENV
```typescript
console.log(process.env.NODE_ENV);  // Should be 'development'
```

**Solution**: Set log level explicitly
```bash
LOG_LEVEL=debug npm run dev
```

---

### Problem: Logs not appearing in tests

**Cause**: Tests run with `NODE_ENV=test`, which sets logger to silent mode

**Solution**: This is intentional. Logs are silenced in tests to keep output clean.

**Workaround**: Temporarily change NODE_ENV for debugging
```bash
NODE_ENV=development npm test
```

---

### Problem: Sensitive data still being logged

**Cause**: Field name not in SENSITIVE_FIELDS list

**Solution**: Add field to logger.ts
```typescript
const SENSITIVE_FIELDS = [
  // ... existing fields ...
  'yourCustomField',  // Add here
];
```

**Cause**: Using direct Pino logger instead of our wrapper

**Solution**: Use `log` instead of `logger`
```typescript
// ❌ No sanitization
import { logger } from './lib/logger';
logger.info({ password: 'secret' }, 'User data');

// ✅ Automatic sanitization
import { log } from './lib/logger';
log.info('User data', { password: 'secret' });  // Redacted!
```

---

### Problem: Circular reference causing issues

**Cause**: Object has circular reference

**Solution**: Logger handles this automatically
```typescript
const obj: any = { name: 'test' };
obj.self = obj;

log.info('Data', obj);  // ✅ Logs: { name: 'test', self: '[Circular]' }
```

If you see this in logs, it might indicate a bug in your code creating unintended circular references.

---

### Problem: Performance issues with logging

**Cause**: Too much logging in hot code paths

**Solution**: Reduce log frequency
```typescript
// ❌ Bad: Logs every millisecond
setInterval(() => {
  log.debug('Heartbeat');  // Too frequent!
}, 1);

// ✅ Good: Logs every minute
setInterval(() => {
  log.debug('Heartbeat');
}, 60000);
```

**Solution**: Use appropriate log level
```typescript
// Development only
log.debug('Detailed trace info');  // Only in dev, not in prod

// Production too
log.info('Important event');  // Shown in prod
```

---

### Problem: Logs not parsed correctly in log aggregation service

**Cause**: Not using JSON format in production

**Solution**: Verify NODE_ENV is 'production'
```bash
echo $NODE_ENV  # Should output: production
```

**Cause**: Pretty printing enabled in production

**Solution**: Remove pino-pretty transport configuration for production builds

---

## Advanced Topics

### Custom Sensitive Fields

Add project-specific sensitive fields:

```typescript
// In src/lib/logger.ts
const SENSITIVE_FIELDS = [
  // ... default fields ...
  'yourInternalToken',
  'yourSecretField',
  'customApiKey',
];
```

### Sampling for High-Volume Logs

For very high-traffic applications:

```typescript
// Log only 10% of debug messages
const shouldLog = Math.random() < 0.1;

if (shouldLog) {
  log.debug('High frequency event', { data });
}
```

### Log Aggregation Integration

**Datadog**: Logs automatically parsed as JSON
```json
{
  "level": "info",
  "timestamp": "2025-11-03T10:30:00.000Z",
  "env": "production",
  "message": "User logged in",
  "userId": "123"
}
```

**CloudWatch**: Use `pino-cloudwatch` transport
```bash
npm install pino-cloudwatch
```

**ELK Stack**: Pino JSON output works directly

---

## Summary

**What we built**: Production-ready structured logging system with Pino

**Key features**:
- ✅ Automatic sensitive data redaction (30+ field types)
- ✅ PII redaction in production (GDPR compliance)
- ✅ Leveled logging (debug, info, warn, error, fatal)
- ✅ Environment-specific behavior (dev/prod/test)
- ✅ Helper functions for common patterns
- ✅ Child loggers for request context
- ✅ Circular reference handling
- ✅ Error object serialization
- ✅ JSON output for log aggregation

**Why it matters**:
- 🔒 Prevents security incidents (leaked passwords, tokens, PII)
- 📊 Enables powerful log analysis and monitoring
- ⚖️ Ensures regulatory compliance (GDPR, PCI-DSS)
- 🐛 Makes debugging production issues easier
- 🚀 Provides foundation for observability

**Next steps**:
1. Migrate existing console.log statements (239+ instances)
2. Add request ID middleware for request tracing
3. Integrate with log aggregation service (Datadog/CloudWatch)
4. Set up alerts for critical log events
5. Review production logs for any missed sensitive fields

---

**For more information**:
- Implementation Log: `log_files/T207_Structured_Logging_System_Log.md`
- Test Log: `log_tests/T207_Structured_Logging_System_TestLog.md`
- Source Code: `src/lib/logger.ts`
- Tests: `tests/unit/T207_structured_logging.test.ts`

**Questions or issues?** Check the troubleshooting section or review the test cases for examples.
