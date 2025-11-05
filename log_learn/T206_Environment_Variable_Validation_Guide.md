# T206: Environment Variable Validation - Didactic Guide

**Task ID**: T206
**Topic**: Configuration Validation with Zod for Production Readiness
**Difficulty**: Intermediate
**Date**: 2025-11-03

## Table of Contents

1. [What is Environment Variable Validation?](#what-is-environment-variable-validation)
2. [Why Validation Matters](#why-validation-matters)
3. [How Validation Works](#how-validation-works)
4. [Implementation Deep Dive](#implementation-deep-dive)
5. [Best Practices](#best-practices)
6. [Common Pitfalls](#common-pitfalls)
7. [Real-World Examples](#real-world-examples)
8. [Testing Strategies](#testing-strategies)

---

## What is Environment Variable Validation?

**Environment variable validation** is the process of verifying that all required configuration is present, correctly formatted, and secure before an application starts. Instead of discovering missing or invalid configuration at runtime (when a feature is used), validation fails fast during startup.

### Without Validation

```typescript
// ❌ Runtime failure (after deployment)
export function connectToDatabase() {
  const url = process.env.DATABASE_URL; // Could be undefined!
  const client = new Client(url); // Crashes at runtime
  return client.connect();
}

// Application starts successfully
// User tries to access database
// ERROR: Invalid connection string 'undefined'
// App crashes in production 💥
```

### With Validation

```typescript
// ✅ Startup failure (before deployment)
import { validateConfig, config } from './lib/config';

// Validate immediately on startup
validateConfig(); // Fails fast if DATABASE_URL missing

export function connectToDatabase() {
  const url = config.DATABASE_URL; // Type-safe, guaranteed present
  const client = new Client(url);
  return client.connect();
}

// If validation fails, app never starts
// Clear error message guides fix
// Production stays healthy ✨
```

### Key Difference

| Aspect | Without Validation | With Validation |
|--------|-------------------|-----------------|
| **Error Discovery** | Runtime (production) | Startup (before traffic) |
| **User Impact** | Users see errors | No user impact |
| **Error Message** | Cryptic | Clear and actionable |
| **Deployment** | Bad config reaches prod | Bad config blocks deployment |
| **Debugging** | Hunt through logs | Immediate feedback |

---

## Why Validation Matters

### 1. Security

**Problem**: Default or weak secrets in production

```typescript
// ❌ Bad: Fallback to weak default
const secret = process.env.SESSION_SECRET || 'change-me-in-production';

// Attacker can guess default secret
// All sessions compromised
```

**Solution**: Validation enforces security rules

```typescript
// ✅ Good: Validation catches weak secrets
SESSION_SECRET: z
  .string()
  .min(32, 'Must be at least 32 characters for security')
  .refine(val => val !== 'change-me-in-production', 'Must not use default')

// App won't start with weak secret
// Forces secure configuration
```

**Real Impact**:
- Prevents deployment with test API keys in production
- Enforces minimum secret length (cryptographic security)
- Detects placeholder values (e.g., "your-key-here")
- Blocks security bypasses (e.g., BYPASS_ADMIN_AUTH=true)

### 2. Reliability

**Problem**: Missing configuration causes runtime errors

```typescript
// ❌ Bad: Starts fine, crashes later
app.listen(process.env.PORT); // Works if PORT set

// Hours later...
const stripe = new Stripe(process.env.STRIPE_KEY); // Undefined! 💥
```

**Solution**: Fail fast on startup

```typescript
// ✅ Good: Fails immediately if STRIPE_KEY missing
validateConfig(); // Exits with clear error

================================================================================
FATAL ERROR: Environment Variable Validation Failed
================================================================================

Missing or invalid environment variables:

  ❌ STRIPE_KEY: Required

--------------------------------------------------------------------------------
How to fix:
  1. Copy .env.example to .env
  2. Fill in all required values
  3. Restart the application
--------------------------------------------------------------------------------
```

**Real Impact**:
- No silent failures in production
- Clear error messages guide fixes
- All errors shown at once (not one-by-one)
- Prevents cascading failures

### 3. Type Safety

**Problem**: `process.env` values are `string | undefined`

```typescript
// ❌ Bad: No type safety
const port = process.env.PORT; // string | undefined
const maxRetries = parseInt(port); // NaN if undefined

if (maxRetries > 10) { // Always false if NaN
  // Never executes
}
```

**Solution**: Validated config is strongly typed

```typescript
// ✅ Good: Type-safe access
const port = config.PORT; // string (guaranteed)
const maxRetries = parseInt(port); // Always a number

if (maxRetries > 10) {
  // Works as expected
}
```

**Real Impact**:
- TypeScript autocomplete for all config
- Compiler catches typos (e.g., `config.DATABSE_URL`)
- No need for `!` or `??` operators
- Cleaner, safer code

### 4. Developer Experience

**Problem**: Cryptic error messages

```typescript
// ❌ Bad: Unclear error
Error: connect ECONNREFUSED undefined:undefined
  at TCPConnectWrap.afterConnect [as oncomplete] (net.js:1144:16)

// What does this mean?
// Which environment variable is missing?
// How do I fix it?
```

**Solution**: Actionable error messages

```typescript
// ✅ Good: Crystal clear
================================================================================
FATAL ERROR: Environment Variable Validation Failed
================================================================================

Missing or invalid environment variables:

  ❌ DATABASE_URL: Required
  ❌ REDIS_URL: Required
  ❌ SESSION_SECRET: SESSION_SECRET must be at least 32 characters

--------------------------------------------------------------------------------
How to fix:
  1. Copy .env.example to .env
  2. Fill in all required values
  3. Restart the application
--------------------------------------------------------------------------------

// Exactly what's wrong
// Exactly how to fix it
```

---

## How Validation Works

### The Validation Flow

```
┌─────────────────┐
│ Application     │
│ Starts          │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Load .env file  │
│ (dotenv)        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ validateConfig()│ ◄── Our validation function
└────────┬────────┘
         │
         ├─────────► Check all required variables
         ├─────────► Validate formats (URLs, emails)
         ├─────────► Check minimum lengths
         ├─────────► Reject placeholder values
         ├─────────► Run production-specific checks
         │
         ▼
    ┌────┴────┐
    │ Valid?  │
    └────┬────┘
         │
    ┌────┴────┐
    │   NO    │───────► ❌ Exit with error message
    └─────────┘
         │
    ┌────┴────┐
    │   YES   │───────► ✅ Application continues
    └─────────┘
         │
         ▼
┌─────────────────┐
│ Serve traffic   │
└─────────────────┘
```

### Zod Schema Validation

Zod is a TypeScript-first schema validation library. It:
1. Defines the shape of valid data
2. Validates data against the schema
3. Infers TypeScript types from the schema
4. Provides detailed error messages

**Example**:

```typescript
import { z } from 'zod';

// Define schema
const schema = z.object({
  DATABASE_URL: z.string().url().startsWith('postgres://'),
  PORT: z.string().regex(/^\d+$/),
});

// Validate data
const result = schema.parse(process.env);

// result is typed as:
// { DATABASE_URL: string; PORT: string }
```

### Type Inference

Zod automatically infers TypeScript types:

```typescript
const envSchema = z.object({
  DATABASE_URL: z.string(),
  PORT: z.string().optional(),
  DEBUG: z.boolean().default(false),
});

// TypeScript infers this type:
type Config = {
  DATABASE_URL: string;
  PORT?: string;
  DEBUG: boolean;
};

// No manual type definition needed!
```

---

## Implementation Deep Dive

### 1. Schema Definition

```typescript
const envSchema = z.object({
  // Required string with validation
  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL is required')
    .url('DATABASE_URL must be a valid URL')
    .startsWith('postgres://', 'Must be a PostgreSQL URL'),

  // Required with format check
  EMAIL_FROM: z
    .string()
    .min(1, 'EMAIL_FROM is required')
    .email('EMAIL_FROM must be a valid email'),

  // Required with custom validation
  SESSION_SECRET: z
    .string()
    .min(32, 'SESSION_SECRET must be at least 32 characters')
    .refine(
      val => val !== 'your-secret-here',
      'SESSION_SECRET must not use placeholder'
    ),

  // Optional variables
  TWILIO_ACCOUNT_SID: z.string().optional(),

  // Variable with default
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
});
```

**Key Zod Methods**:

| Method | Purpose | Example |
|--------|---------|---------|
| `.string()` | Must be a string | `z.string()` |
| `.min(n)` | Minimum length | `z.string().min(32)` |
| `.max(n)` | Maximum length | `z.string().max(100)` |
| `.url()` | Must be valid URL | `z.string().url()` |
| `.email()` | Must be valid email | `z.string().email()` |
| `.startsWith(s)` | Must start with string | `z.string().startsWith('sk_')` |
| `.regex(r)` | Must match regex | `z.string().regex(/^\d+$/)` |
| `.refine(fn)` | Custom validation | `z.string().refine(val => val.length > 10)` |
| `.optional()` | Not required | `z.string().optional()` |
| `.default(v)` | Default value | `z.string().default('foo')` |
| `.enum([...])` | Must be one of values | `z.enum(['a', 'b', 'c'])` |

### 2. Validation Function

```typescript
export function validateConfig(throwOnError = false): void {
  try {
    console.log('[Config] Validating environment variables...');

    // Parse and validate
    validatedConfig = envSchema.parse(process.env);

    // Additional checks
    if (validatedConfig.NODE_ENV === 'production') {
      if (process.env.BYPASS_ADMIN_AUTH === 'true') {
        throw new Error('BYPASS_ADMIN_AUTH enabled in production!');
      }
    }

    console.log('[Config] ✓ Environment validation successful');

  } catch (error) {
    // Pretty-print errors
    console.error('FATAL ERROR: Environment Variable Validation Failed');

    if (error instanceof z.ZodError) {
      error.errors.forEach(err => {
        console.error(`  ❌ ${err.path.join('.')}: ${err.message}`);
      });
    }

    // Exit or throw
    if (throwOnError) {
      throw error;
    } else {
      process.exit(1);
    }
  }
}
```

**Key Design Decisions**:

1. **throwOnError Parameter**
   - Default: Exits process (production behavior)
   - `true`: Throws error (for testing)

2. **Pretty Error Messages**
   - Visual indicators (❌)
   - Grouped by category
   - Actionable guidance

3. **All Errors at Once**
   - Zod collects all validation errors
   - User sees complete picture
   - Fixes multiple issues in one go

### 3. Type-Safe Access

```typescript
// Internal validated config storage
let validatedConfig: Config | null = null;

// Getter function
export function getConfig(): Config {
  if (!validatedConfig) {
    throw new Error('Configuration not validated yet');
  }
  return validatedConfig;
}

// Convenient proxy for access
export const config = new Proxy({} as Config, {
  get(_target, prop: string) {
    const cfg = getConfig();
    return cfg[prop as keyof Config];
  },
});
```

**Usage**:

```typescript
// Method 1: Direct function call
import { getConfig } from './lib/config';
const cfg = getConfig();
console.log(cfg.DATABASE_URL);

// Method 2: Proxy (cleaner)
import { config } from './lib/config';
console.log(config.DATABASE_URL);
```

---

## Best Practices

### 1. Validate on Startup

**✅ Good**: Validate in root middleware or config file

```typescript
// src/middleware/index.ts
import { validateConfig } from '../lib/config';

let validated = false;

export const onRequest = async (context, next) => {
  if (!validated) {
    validateConfig();
    validated = true;
  }
  return next();
};
```

**❌ Bad**: Validate in random files

```typescript
// src/services/someService.ts
import { validateConfig } from '../lib/config';
validateConfig(); // Called multiple times
```

### 2. Use Type-Safe Config Access

**✅ Good**: Use validated config

```typescript
import { config } from './lib/config';

const stripe = new Stripe(config.STRIPE_SECRET_KEY);
```

**❌ Bad**: Access `process.env` directly

```typescript
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!); // Not validated!
```

### 3. No Fallback Values

**✅ Good**: Required means required

```typescript
// Schema enforces presence
DATABASE_URL: z.string().min(1)

// Usage (no fallback needed)
const url = config.DATABASE_URL;
```

**❌ Bad**: Fallback defeats validation

```typescript
const url = config.DATABASE_URL || 'postgres://localhost/db';
// If DATABASE_URL missing, validation should have failed!
```

### 4. Validate Early, Use Later

**✅ Good**: One validation, many uses

```typescript
// src/index.ts
validateConfig(); // Once at startup

// src/lib/db.ts
import { config } from './config';
const url = config.DATABASE_URL; // Just use it

// src/lib/stripe.ts
import { config } from './config';
const key = config.STRIPE_SECRET_KEY; // Just use it
```

**❌ Bad**: Re-validating everywhere

```typescript
// src/lib/db.ts
validateConfig(); // Unnecessary

// src/lib/stripe.ts
validateConfig(); // Unnecessary
```

### 5. Production-Specific Checks

**✅ Good**: Extra checks for production

```typescript
if (config.NODE_ENV === 'production') {
  // No test keys in production
  if (config.STRIPE_SECRET_KEY.startsWith('sk_test_')) {
    console.warn('WARNING: Using test Stripe keys in production');
  }

  // HTTPS only in production
  if (!config.BASE_URL.startsWith('https://')) {
    console.warn('WARNING: BASE_URL should use HTTPS in production');
  }
}
```

**❌ Bad**: Same validation for all environments

```typescript
// No environment-specific checks
```

### 6. Clear Error Messages

**✅ Good**: Specific error messages

```typescript
STRIPE_SECRET_KEY: z
  .string()
  .min(1, 'STRIPE_SECRET_KEY is required')
  .startsWith('sk_', 'STRIPE_SECRET_KEY must start with sk_')
```

**❌ Bad**: Generic error messages

```typescript
STRIPE_SECRET_KEY: z.string() // Just "Required"
```

---

## Common Pitfalls

### Pitfall 1: Forgetting to Call validateConfig()

**❌ Problem**:

```typescript
// src/index.ts
import './lib/config'; // Just importing, not validating

// Later...
import { config } from './lib/config';
console.log(config.DATABASE_URL); // Error: Configuration not validated
```

**✅ Solution**:

```typescript
// src/index.ts
import { validateConfig } from './lib/config';
validateConfig(); // Call it!

// Now safe to use config
```

### Pitfall 2: Using process.env After Validation

**❌ Problem**:

```typescript
validateConfig();

// Still using process.env
const url = process.env.DATABASE_URL; // Bypasses validation!
```

**✅ Solution**:

```typescript
import { config } from './lib/config';

const url = config.DATABASE_URL; // Type-safe, validated
```

### Pitfall 3: Circular Dependencies

**❌ Problem**:

```typescript
// src/lib/config.ts
import { someFunction } from './utils';

// src/lib/utils.ts
import { config } from './config'; // Circular!
```

**✅ Solution**: Keep config.ts dependency-free

```typescript
// src/lib/config.ts
// No imports from other app modules
import { z } from 'zod';
```

### Pitfall 4: Testing Without throwOnError

**❌ Problem**:

```typescript
// test
validateConfig(); // Exits process if validation fails!
```

**✅ Solution**:

```typescript
// test
validateConfig(true); // Throws error instead
```

### Pitfall 5: Not Validating Optional Variables

**❌ Problem**:

```typescript
// src/lib/twilio.ts
if (config.TWILIO_ACCOUNT_SID) {
  // Could still be empty string!
  twilioClient = new Twilio(config.TWILIO_ACCOUNT_SID);
}
```

**✅ Solution**: Use `isConfigured` helper

```typescript
import { isConfigured, config } from './config';

if (isConfigured('TWILIO_ACCOUNT_SID')) {
  // Guaranteed non-empty
  twilioClient = new Twilio(config.TWILIO_ACCOUNT_SID);
}
```

---

## Real-World Examples

### Example 1: Database Connection

**Before T206**:

```typescript
// src/lib/db.ts
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL || 'postgres://localhost/db';

const pool = new Pool({ connectionString });

export { pool };
```

**Problems**:
- Fallback hides missing configuration
- Runtime error if DATABASE_URL invalid
- Not type-safe

**After T206**:

```typescript
// src/lib/db.ts
import { Pool } from 'pg';
import { config } from './config';

const pool = new Pool({ connectionString: config.DATABASE_URL });

export { pool };
```

**Benefits**:
- No fallback needed (validated at startup)
- Type-safe access
- Fails fast if misconfigured

### Example 2: Stripe Integration

**Before T206**:

```typescript
// src/lib/stripe.ts
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
});

export { stripe };
```

**Problems**:
- `!` operator unsafe (could still be undefined)
- No format validation (could be wrong key type)
- Runtime error if key invalid

**After T206**:

```typescript
// src/lib/stripe.ts
import Stripe from 'stripe';
import { config } from './config';

const stripe = new Stripe(config.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16'
});

export { stripe };
```

**Benefits**:
- No `!` needed
- Key format validated (starts with `sk_`)
- Production check for test keys

### Example 3: Optional Features

**Before T206**:

```typescript
// src/lib/notifications.ts
import twilio from 'twilio';

const client = process.env.TWILIO_ACCOUNT_SID
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

export function sendNotification(message: string) {
  if (client) {
    return client.messages.create({
      // Could fail if AUTH_TOKEN missing
      body: message,
      from: process.env.TWILIO_WHATSAPP_FROM,
      to: process.env.TWILIO_ADMIN_WHATSAPP,
    });
  }
}
```

**Problems**:
- Multiple environment checks
- Could fail if only some Twilio vars set
- Not type-safe

**After T206**:

```typescript
// src/lib/notifications.ts
import twilio from 'twilio';
import { isConfigured, config } from './config';

const client = isConfigured('TWILIO_ACCOUNT_SID')
  ? twilio(config.TWILIO_ACCOUNT_SID, config.TWILIO_AUTH_TOKEN)
  : null;

export function sendNotification(message: string) {
  if (client) {
    return client.messages.create({
      body: message,
      from: config.TWILIO_WHATSAPP_FROM!,
      to: config.TWILIO_ADMIN_WHATSAPP!,
    });
  }
}
```

**Benefits**:
- Single `isConfigured` check
- Type-safe access
- Clear intent

---

## Testing Strategies

### 1. Testing Validation Logic

```typescript
describe('Environment Validation', () => {
  beforeEach(() => {
    // Reset module cache
    vi.resetModules();

    // Set up valid environment
    process.env = {
      DATABASE_URL: 'postgres://localhost/db',
      // ... all required vars
    };
  });

  it('should validate successfully with all required vars', async () => {
    const { validateConfig } = await import('../lib/config');

    expect(() => validateConfig(true)).not.toThrow();
  });

  it('should fail if DATABASE_URL missing', async () => {
    delete process.env.DATABASE_URL;

    const { validateConfig } = await import('../lib/config');

    expect(() => validateConfig(true)).toThrow(/DATABASE_URL/);
  });
});
```

**Key Techniques**:
- `vi.resetModules()` for fresh imports
- `throwOnError=true` to catch errors
- Dynamic imports after env setup

### 2. Testing Config Access

```typescript
it('should allow access after validation', async () => {
  const { validateConfig, config } = await import('../lib/config');

  validateConfig(true);

  expect(config.DATABASE_URL).toBe('postgres://localhost/db');
});

it('should throw before validation', async () => {
  const { config } = await import('../lib/config');

  expect(() => config.DATABASE_URL).toThrow(/not validated/);
});
```

### 3. Testing Optional Variables

```typescript
it('should work with optional Twilio vars', async () => {
  process.env.TWILIO_ACCOUNT_SID = 'AC123';
  process.env.TWILIO_AUTH_TOKEN = 'token';

  const { validateConfig, isConfigured } = await import('../lib/config');

  validateConfig(true);

  expect(isConfigured('TWILIO_ACCOUNT_SID')).toBe(true);
});

it('should work without optional Twilio vars', async () => {
  delete process.env.TWILIO_ACCOUNT_SID;

  const { validateConfig, isConfigured } = await import('../lib/config');

  validateConfig(true);

  expect(isConfigured('TWILIO_ACCOUNT_SID')).toBe(false);
});
```

---

## Key Takeaways

1. **Fail Fast**: Validate on startup, not at runtime
2. **Type Safety**: Use Zod for schema validation and type inference
3. **Clear Errors**: Provide actionable error messages
4. **Security**: Enforce secret length, reject placeholders, check production config
5. **Reliability**: No fallback values, all errors shown at once
6. **Developer Experience**: Type-safe access, single source of truth
7. **Testing**: Use `throwOnError` for testability
8. **Production Readiness**: Environment-specific checks

---

## Further Reading

- [Zod Documentation](https://zod.dev/)
- [Environment Variables Best Practices](https://12factor.net/config)
- [Configuration Management Patterns](https://martinfowler.com/bliki/ConfigurationSynchronization.html)
- [Fail-Fast Principle](https://martinfowler.com/ieeeSoftware/failFast.pdf)

---

**Guide Complete**: 2025-11-03
**Difficulty**: Intermediate
**Estimated Reading Time**: 30 minutes
