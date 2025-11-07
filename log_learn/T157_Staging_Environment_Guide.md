# T157: Staging Environment - Learning Guide

**Task**: Setup staging environment for testing
**Date**: November 6, 2025
**Difficulty**: Intermediate
**Technologies**: DevOps, Docker, CI/CD, Testing

---

## Table of Contents

1. [Introduction](#introduction)
2. [Why Staging Environments Matter](#why-staging-environments-matter)
3. [Key Concepts](#key-concepts)
4. [Environment Types](#environment-types)
5. [Setting Up Staging](#setting-up-staging)
6. [Health Monitoring](#health-monitoring)
7. [Deployment Strategies](#deployment-strategies)
8. [Best Practices](#best-practices)
9. [Common Pitfalls](#common-pitfalls)
10. [Real-World Examples](#real-world-examples)

---

## Introduction

This guide teaches you how to create and maintain a staging environment for pre-production testing.

### What You'll Learn

- Why staging environments are critical
- How to configure staging properly
- Automation scripts for staging management
- Health monitoring strategies
- Deployment best practices
- Common mistakes and how to avoid them

### Prerequisites

- Basic understanding of environments (dev, staging, production)
- Command line proficiency
- Docker basics (optional)
- Understanding of deployment concepts

---

## Why Staging Environments Matter

### The Deployment Pipeline

```
Development → Staging → Production
   (Code)    (Test)    (Live Users)
```

**Without Staging**:
```
Developer writes code → Deploy to production → 💥 Bug affects users
```

**With Staging**:
```
Developer writes code → Test in staging → Find bugs → Fix → Deploy to production → ✅ Works
```

### Real-World Scenario

**Company**: E-commerce platform with 10,000 daily users

**Scenario 1 - No Staging**:
```
Friday 5 PM: Developer deploys new checkout feature
Friday 5:30 PM: Users start reporting checkout failures
Friday 6 PM: Emergency rollback initiated
Friday 7 PM: Still debugging, lost 2 hours of sales ($50,000)
Friday 10 PM: Fixed and redeployed
Weekend: Angry customers, damaged reputation
```

**Scenario 2 - With Staging**:
```
Thursday 2 PM: Developer deploys to staging
Thursday 3 PM: QA tests checkout feature in staging
Thursday 4 PM: Bug found (payment processing fails for international cards)
Thursday 5 PM: Developer fixes bug
Friday 9 AM: Retested in staging, confirmed working
Friday 10 AM: Deployed to production successfully
Weekend: Happy customers, no issues
```

**Savings**: $50,000 + reputation + developer stress

---

## Key Concepts

### 1. Environment Parity

**Parity** = How similar staging is to production

**High Parity (Good)**:
```
Staging:
- Same OS (Ubuntu 22.04)
- Same database version (PostgreSQL 15)
- Same Redis version (Redis 7)
- Same Node.js version (20.x)
- Similar data volume
- Similar traffic patterns

Production:
- Same as staging ✅
```

**Low Parity (Dangerous)**:
```
Staging:
- Different OS (macOS)
- Different database (SQLite)
- No Redis
- Different Node.js (18.x)
- Empty database
- No load testing

Production:
- Ubuntu, PostgreSQL, Redis, Node 20.x
- Result: Bugs appear in production ❌
```

**Our Implementation**: High parity
- Same database (PostgreSQL 15)
- Same cache (Redis 7)
- Same Node.js runtime
- Similar configuration
- Test mode for external services (Stripe, email)

---

### 2. Test Mode vs Live Mode

**External Services Need Special Handling**:

**Stripe (Payments)**:
```
Development: sk_test_... (free, fake cards)
Staging: sk_test_... (free, fake cards)
Production: sk_live_... (real money)
```

**Email (Resend/SendGrid)**:
```
Development: Test mode (no emails sent)
Staging: Test mode (emails to test inboxes)
Production: Live mode (real emails to users)
```

**Why**:
- Don't charge real money in staging
- Don't send emails to real users
- Don't create real records in external systems

**Our Implementation**:
```bash
# .env.staging.example
STRIPE_SECRET_KEY=sk_test_...
PAYMENT_TEST_MODE=true
EMAIL_TEST_MODE=true
```

---

### 3. Configuration Management

**Environment-Specific Settings**:

```javascript
// ❌ BAD: Hardcoded
const rateLimit = 100; // Same for all environments

// ✅ GOOD: Environment-specific
const rateLimit = process.env.NODE_ENV === 'staging' ? 1000 : 100;
```

**Our Approach**:
```bash
# Production (.env)
RATE_LIMIT_MAX_REQUESTS=100
ENABLE_DEBUG_MODE=false

# Staging (.env.staging)
RATE_LIMIT_MAX_REQUESTS=1000  # More permissive for testing
ENABLE_DEBUG_MODE=true         # Verbose logging
```

---

## Environment Types

### 1. Development (Local)

**Purpose**: Developers write and test code

**Characteristics**:
```
Location: Laptop/Desktop
Database: Local (Docker)
Users: 1 (the developer)
Data: Fake/minimal
Uptime: Doesn't matter
Speed: Fast iteration
```

**Example**:
```bash
NODE_ENV=development
DATABASE_URL=postgresql://localhost:5432/dev_db
npm run dev  # Hot reload
```

---

### 2. Staging (Pre-Production)

**Purpose**: Test before production

**Characteristics**:
```
Location: Cloud server
Database: Separate instance (test data)
Users: Internal team, QA, stakeholders
Data: Production-like but sanitized
Uptime: Important (for testing)
Speed: Similar to production
```

**Example**:
```bash
NODE_ENV=staging
DATABASE_URL=postgresql://staging.host:5432/staging_db
npm run staging:deploy
```

---

### 3. Production (Live)

**Purpose**: Serve real users

**Characteristics**:
```
Location: Cloud server (multiple regions)
Database: Production instance
Users: All real users
Data: Real user data
Uptime: Critical (99.9%+)
Speed: Optimized
```

**Example**:
```bash
NODE_ENV=production
DATABASE_URL=postgresql://prod.host:5432/prod_db
npm run build && deploy
```

---

## Setting Up Staging

### Step 1: Environment Configuration

**Create `.env.staging` file**:
```bash
# Copy template
cp .env.staging.example .env.staging

# Edit with staging credentials
nano .env.staging
```

**Key Settings**:
```bash
# Core
NODE_ENV=staging
PUBLIC_SITE_URL=https://staging.yourdomain.com

# Database (Neon Staging Branch)
DATABASE_URL=postgresql://user:pass@staging.neon.tech:5432/staging_db

# Redis (Upstash Staging)
REDIS_URL=redis://default:pass@staging.upstash.io:6379

# Stripe (Test Mode)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Feature Flags
ENABLE_DEBUG_MODE=true
ENABLE_VERBOSE_LOGGING=true

# Rate Limiting (More Permissive)
RATE_LIMIT_MAX_REQUESTS=1000  # vs 100 in production
```

---

### Step 2: Initialize Staging

```bash
npm run staging:init
```

**What Happens**:
1. ✅ Checks environment variables (DATABASE_URL, REDIS_URL, NODE_ENV)
2. ✅ Tests database connectivity
3. ✅ Verifies database is staging (safety check)
4. ✅ Runs database migrations
5. ✅ Tests Redis connectivity
6. ✅ Creates backup directory
7. ✅ Verifies external services (Stripe, Resend, Sentry)
8. ✅ Sets up monitoring (Sentry test message)

**Example Output**:
```
🚀 Initializing Staging Environment

1️⃣  Checking Environment Variables...
✅ Environment Variables (123ms)
   All required environment variables are set

2️⃣  Checking Database Connectivity...
✅ Database Connectivity (456ms)
   Connected to database: spirituality_staging

...

✅ STAGING ENVIRONMENT READY!
   All setup steps completed successfully.
```

---

### Step 3: Seed Test Data

```bash
npm run staging:seed
```

**Creates**:
- Test users (`test@example.com`, `admin@example.com`)
- Test products
- Sample data for testing

**Use Case**: Fresh staging environment needs realistic data for testing.

---

### Step 4: Verify Health

```bash
npm run staging:health
```

**Checks**:
- ✅ Database (connection, query performance)
- ✅ Redis (connection, operation speed)
- ✅ API (health endpoint response)
- ✅ External services (configuration)
- ✅ Storage (backup system)

---

## Health Monitoring

### Why Monitor Staging Health?

**Staging Issues = Production Problems**

If staging is unhealthy:
- Tests are unreliable
- Deployments fail
- Team loses confidence
- Production issues slip through

### Health Check Levels

```
✅ Healthy: All systems operational
⚠️  Degraded: Non-critical issues (slow response, optional service down)
❌ Unhealthy: Critical issues requiring immediate action
```

### Health Check Script

```bash
# Run once
npm run staging:health

# Watch mode (continuous monitoring)
npm run staging:health:watch

# JSON output (for monitoring tools)
tsx src/scripts/staging-health.ts --json

# Check specific component
tsx src/scripts/staging-health.ts --component=db
```

### Performance Thresholds

**Database**:
```
Query time < 1000ms → healthy ✅
Query time > 1000ms → degraded ⚠️
Cannot connect → unhealthy ❌
```

**Redis**:
```
Operation < 500ms → healthy ✅
Operation > 500ms → degraded ⚠️
Cannot connect → degraded ⚠️ (non-critical)
```

**API**:
```
Response < 2000ms → healthy ✅
Response > 2000ms → degraded ⚠️
No response → unhealthy ❌
```

---

## Deployment Strategies

### Strategy 1: Manual Deployment

```bash
# Build and deploy manually
npm run build
git push origin staging
# Wait for Cloudflare Pages to build
```

**Pros**: Simple, direct control
**Cons**: Error-prone, inconsistent, manual steps

---

### Strategy 2: Automated Deployment (Recommended)

```bash
npm run staging:deploy
```

**Steps**:
1. Pre-deployment checks (git status, versions)
2. Build application (`npm run build`)
3. Run tests (`npm test`)
4. Deploy to Cloudflare Pages
5. Run smoke tests (health check, homepage)
6. Record deployment (timestamp, commit, author)

**Pros**: Consistent, automated, catches issues
**Cons**: Slightly slower (but worth it)

---

### Strategy 3: Continuous Deployment

```yaml
# .github/workflows/staging.yml
name: Deploy to Staging

on:
  push:
    branches: [staging]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run build
      - run: npm test
      - run: npm run staging:health
      - uses: cloudflare/pages-action@v1
```

**Pros**: Fully automated, instant feedback
**Cons**: Requires CI/CD setup

---

## Best Practices

### 1. Keep Staging Updated

```bash
# Daily sync with main
git checkout staging
git merge main
git push origin staging
```

**Why**: Old staging = unreliable testing

---

### 2. Use Production-Like Data

**Bad**: Empty database
```sql
SELECT * FROM users;
-- 0 rows
```

**Good**: Production-like volume (sanitized)
```sql
SELECT * FROM users;
-- 10,000 rows (fake names, test emails)
```

**How**: Restore from production backup with data sanitization
```bash
# 1. Backup production
npm run backup

# 2. Sanitize sensitive data
psql $STAGING_DATABASE_URL << EOF
UPDATE users SET
  email = CONCAT('test', id, '@example.com'),
  phone = NULL,
  address = NULL;
EOF
```

---

### 3. Test in Staging First

**Rule**: Never skip staging

```
✅ Develop → Stage → Test → Deploy to Production
❌ Develop → Deploy to Production (skip staging)
```

**What to Test**:
- Functionality (does it work?)
- Performance (is it fast enough?)
- Security (any vulnerabilities?)
- User experience (is it usable?)
- Integrations (do external services work?)

---

### 4. Monitor Staging Health

```bash
# Set up daily health checks
0 6 * * * npm run staging:health >> /var/log/staging-health.log

# Alert on failures
0 6 * * * npm run staging:health || curl -X POST https://alerts.example.com/staging-unhealthy
```

---

### 5. Document Staging Procedures

**Create runbook**:
```markdown
## Staging Environment

### URLs
- Application: https://staging.yourdomain.com
- Database: staging.neon.tech
- Redis: staging.upstash.io

### Access
- Admin: admin@yourdomain.com / [password in 1Password]
- Test User: test@example.com / [password in 1Password]

### Common Tasks
- Deploy: `npm run staging:deploy`
- Health Check: `npm run staging:health`
- Reset: `npm run staging:reset`

### Troubleshooting
[Solutions to common issues]
```

---

## Common Pitfalls

### Pitfall 1: Staging Differs from Production

**Problem**: Staging uses SQLite, production uses PostgreSQL

**Result**: Code works in staging, fails in production

**Solution**: Use same database type
```bash
# .env.staging
DATABASE_URL=postgresql://staging.host:5432/staging_db  # PostgreSQL

# .env (production)
DATABASE_URL=postgresql://prod.host:5432/prod_db  # PostgreSQL
```

---

### Pitfall 2: Using Production Credentials in Staging

**Problem**: Staging uses production Stripe keys

**Result**: Test charges hit production, costing real money

**Solution**: Use test mode
```bash
# .env.staging
STRIPE_SECRET_KEY=sk_test_...  # Test mode ✅

# .env (production)
STRIPE_SECRET_KEY=sk_live_...  # Live mode
```

---

### Pitfall 3: No Safety Checks for Reset

**Problem**: Accidentally reset production database

**Result**: All production data deleted

**Solution**: Multiple safety checks
```typescript
// ❌ BAD: No checks
async function reset() {
  await execAsync('DROP SCHEMA public CASCADE');
}

// ✅ GOOD: Safety checks
async function reset() {
  if (process.env.NODE_ENV !== 'staging') {
    throw new Error('Can only reset staging');
  }

  const dbName = await getDatabaseName();
  if (!dbName.includes('staging') && !dbName.includes('test')) {
    throw new Error('Database does not appear to be staging');
  }

  console.log('⚠️  Destructive operation! Waiting 5 seconds...');
  await sleep(5000);

  await execAsync('DROP SCHEMA public CASCADE');
}
```

---

### Pitfall 4: Ignoring Staging Health

**Problem**: Staging database fills up, becomes slow

**Result**: Tests fail randomly, team ignores staging

**Solution**: Monitor staging health
```bash
npm run staging:health:watch  # Continuous monitoring
```

---

## Real-World Examples

### Example 1: Facebook

**Setup**:
- Development: Local machines
- Staging: "Staging tier" with production-like data
- Production: Live site

**Practice**: "Dogfooding"
- Engineers use staging site daily
- Find bugs before users do
- Staging mirrors production closely

**Result**: Bugs caught in staging, not production

---

### Example 2: Netflix

**Setup**:
- Development: Local
- Staging: "Test environment" with subset of traffic
- Production: Full traffic

**Practice**: "Canary deployments"
- Deploy to staging
- Test with internal users
- Deploy to 1% of production
- Monitor metrics
- Deploy to 100% if successful

**Result**: Gradual rollout reduces risk

---

## Conclusion

### Key Takeaways

1. **Staging is Essential**: Test before production
2. **High Parity**: Staging should mirror production
3. **Test Mode**: Use test mode for external services
4. **Automate**: Automate setup, deployment, health checks
5. **Monitor**: Regular health checks prevent issues
6. **Document**: Clear procedures save time

### Remember

> "If you don't test it in staging, you're testing it in production"

Staging environments are your safety net. Use them properly and you'll catch bugs before users do.

Happy staging! 🚀
