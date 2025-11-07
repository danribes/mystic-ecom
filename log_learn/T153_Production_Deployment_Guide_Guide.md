# T153: Production Deployment - Learning Guide

**Task**: Create deployment guide for production
**Date**: November 5, 2025
**Difficulty**: Intermediate to Advanced
**Technologies**: DevOps, PostgreSQL, Redis, Cloudflare Pages, Docker

---

## Table of Contents

1. [Introduction](#introduction)
2. [Why Production Deployment Matters](#why-production-deployment-matters)
3. [Key Concepts](#key-concepts)
4. [Infrastructure Components](#infrastructure-components)
5. [Deployment Process](#deployment-process)
6. [Security Best Practices](#security-best-practices)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Troubleshooting](#troubleshooting)
9. [Best Practices](#best-practices)

---

## Introduction

This guide teaches you how to deploy a production-ready web application. You'll learn about infrastructure setup, security, monitoring, and maintaining a live application.

### What You'll Learn

- Setting up production infrastructure (Database, Redis, Hosting)
- Configuring environment variables securely
- Implementing security best practices
- Setting up monitoring and alerting
- Creating backup and disaster recovery plans
- Optimizing performance
- Troubleshooting production issues

### Prerequisites

- Understanding of web applications
- Basic command line knowledge
- Familiarity with Git
- Understanding of databases
- Basic DevOps concepts

---

## Why Production Deployment Matters

### The Stakes Are Higher

**Development vs Production**:

| Aspect | Development | Production |
|--------|-------------|------------|
| Users | Just you | Real customers |
| Data | Test data | Real user data |
| Security | Relaxed | Critical |
| Uptime | Not critical | 99.9% expected |
| Performance | Can be slow | Must be fast |
| Errors | Expected | Unacceptable |

### Business Impact

**Well-Deployed Application**:
- ✅ Users trust your service
- ✅ Positive reviews and growth
- ✅ Revenue generation
- ✅ Competitive advantage

**Poorly-Deployed Application**:
- ❌ User frustration and churn
- ❌ Negative reviews
- ❌ Revenue loss
- ❌ Security breaches

---

## Key Concepts

### 1. Environments

**Development**: Where you write code
```
- URL: http://localhost:4321
- Database: Local PostgreSQL
- Purpose: Active development
- Errors: Expected and logged
```

**Staging** (Optional but recommended):
```
- URL: https://staging.yourdomain.com
- Database: Separate staging database
- Purpose: Final testing before production
- Mirrors: Production setup
```

**Production**:
```
- URL: https://yourdomain.com
- Database: Production database
- Purpose: Live user-facing site
- Monitoring: 24/7
```

### 2. Environment Variables

**What**: Configuration values stored outside code

**Why**:
- Different values per environment
- Security (don't commit secrets to Git)
- Flexibility (change without code changes)

**Examples**:
```bash
# Development
DATABASE_URL=postgresql://localhost:5432/dev_db

# Production
DATABASE_URL=postgresql://user:pass@neon.tech:5432/prod_db?sslmode=require
```

### 3. Infrastructure as a Service (IaaS)

Instead of managing servers yourself, use cloud services:

**Database**: Neon, Supabase (managed PostgreSQL)
**Redis**: Upstash (managed Redis)
**Hosting**: Cloudflare Pages, Vercel (serverless hosting)
**Email**: SendGrid (transactional emails)
**Monitoring**: Sentry (error tracking)

**Benefits**:
- No server management
- Automatic scaling
- Built-in backups
- Pay-as-you-go pricing

### 4. CI/CD (Continuous Integration/Continuous Deployment)

**Continuous Integration**:
- Automatically run tests on every commit
- Catch errors early
- Ensure code quality

**Continuous Deployment**:
- Automatically deploy to production on push to main branch
- Fast iteration
- Consistent deployment process

**Example Flow**:
```
1. Developer pushes code to GitHub
2. GitHub Actions runs tests
3. If tests pass, build application
4. Deploy to production
5. Monitor for errors
```

### 5. Database Migrations

**What**: Versioned changes to database schema

**Why**:
- Track database changes in Git
- Apply changes consistently
- Rollback if needed

**Example**:
```sql
-- Migration 001: Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Migration 002: Add name column
ALTER TABLE users ADD COLUMN name VARCHAR(255);
```

### 6. Monitoring & Observability

**Metrics**: What's happening (requests/sec, response time)
**Logs**: Detailed event records
**Traces**: Request path through system
**Alerts**: Notifications when something's wrong

**Example Metrics**:
- Requests per minute
- Error rate
- Response time
- CPU usage
- Memory usage
- Database connections

---

## Infrastructure Components

### 1. Database (PostgreSQL)

**What**: Stores all application data (users, courses, orders)

**Why PostgreSQL**:
- Reliable and mature
- Excellent performance
- Rich features (JSON, full-text search)
- Strong consistency

**Production Considerations**:
- **Backups**: Daily automated backups
- **Scaling**: Read replicas for heavy read load
- **Security**: SSL connections, firewall rules
- **Monitoring**: Track query performance

**Managed Options**:
- **Neon** (Recommended): Serverless, free tier, auto-scaling
- **Supabase**: PostgreSQL + auth + storage
- **AWS RDS**: Enterprise-grade, expensive
- **Railway**: Simple, affordable ($5/month)

### 2. Redis (Caching & Sessions)

**What**: In-memory data store for fast access

**Use Cases**:
- Session storage (user login state)
- Caching (reduce database queries)
- Rate limiting (track API usage)
- Real-time features (pub/sub)

**Why Redis**:
- Extremely fast (microsecond latency)
- Rich data structures
- Persistence options
- Atomic operations

**Production Considerations**:
- **Persistence**: Enable snapshots
- **Eviction**: Configure memory limits
- **Replication**: For high availability
- **Monitoring**: Track memory usage

**Managed Options**:
- **Upstash** (Recommended): Serverless, free tier, global
- **Redis Cloud**: Official managed service
- **Railway**: Included with PostgreSQL

### 3. Hosting (Cloudflare Pages)

**What**: Where your application runs

**Serverless vs VPS**:

**Serverless** (Cloudflare Pages, Vercel):
- ✅ No server management
- ✅ Auto-scaling
- ✅ Free tier generous
- ❌ Less control

**VPS** (DigitalOcean, Linode):
- ✅ Full control
- ✅ Predictable pricing
- ❌ Must manage servers
- ❌ Manual scaling

**Why Cloudflare Pages**:
- Free tier (unlimited bandwidth!)
- Global CDN (300+ locations)
- Automatic HTTPS
- DDoS protection
- Simple deployment (Git push)

---

## Deployment Process

### Step-by-Step Deployment

#### 1. Pre-Deployment

```bash
# Run all tests
npm test

# Build application
npm run build

# Security audit
npm audit --production

# Lint code
npm run lint

# Type check
npx tsc --noEmit
```

All green? Continue!

#### 2. Infrastructure Setup

**A. Create Database (Neon)**:
1. Go to https://neon.tech
2. Sign up (free)
3. Create project: "my-app-production"
4. Copy connection string
5. Run schema: `psql $DATABASE_URL -f database/schema.sql`

**B. Create Redis (Upstash)**:
1. Go to https://console.upstash.com
2. Create database: "my-app-sessions"
3. Copy connection URL

**C. Setup Hosting (Cloudflare Pages)**:
1. Go to https://dash.cloudflare.com
2. Connect GitHub repository
3. Add environment variables
4. Deploy!

#### 3. Configure Environment Variables

In Cloudflare Pages (or your platform):

```bash
# Critical
DATABASE_URL=postgresql://...?sslmode=require
REDIS_URL=redis://default:password@...
JWT_SECRET=<32+ random characters>

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...

# Email
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PASSWORD=SG.xxxxx...
EMAIL_FROM=noreply@yourdomain.com
```

#### 4. Deploy

**With Cloudflare Pages** (automatic):
```bash
git add .
git commit -m "Release v1.0.0"
git push origin main
# Cloudflare automatically deploys!
```

**With Vercel** (CLI):
```bash
vercel --prod
```

#### 5. Verify Deployment

```bash
# Check health
curl https://yourdomain.com/api/health

# Run deployment tests
npm run test:deployment

# Manual checks
- Can users sign up?
- Can users log in?
- Can users purchase courses?
- Are emails being sent?
```

---

## Security Best Practices

### 1. Secrets Management

**❌ NEVER do this**:
```javascript
// WRONG - Secret in code!
const stripe = new Stripe('sk_live_123456789');
```

**✅ Always do this**:
```javascript
// CORRECT - Secret from environment
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
```

### 2. HTTPS Everywhere

**Why**:
- Encrypts data in transit
- Prevents man-in-the-middle attacks
- SEO boost
- User trust

**How**: Use Cloudflare or Let's Encrypt for free SSL

### 3. Database Security

```sql
-- Use least privilege
-- App user should NOT have DROP, ALTER permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO app_user;

-- No DROP or ALTER!
-- Those stay with admin user only
```

### 4. Rate Limiting

Prevent abuse:
```typescript
// Allow 100 requests per minute
const limiter = {
  points: 100,
  duration: 60,
};
```

### 5. Input Validation

```typescript
// Always validate user input
function createUser(email: string) {
  // ❌ WRONG - No validation
  db.query(`INSERT INTO users (email) VALUES ('${email}')`);

  // ✅ CORRECT - Validate + parameterized query
  if (!isValidEmail(email)) {
    throw new Error('Invalid email');
  }
  db.query('INSERT INTO users (email) VALUES ($1)', [email]);
}
```

---

## Monitoring & Maintenance

### 1. Error Tracking (Sentry)

```typescript
// src/lib/sentry.ts
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: 'production',
});

// Errors automatically tracked!
```

**Benefits**:
- See every error in production
- Stack traces for debugging
- User context (what they were doing)
- Alert on error spikes

### 2. Uptime Monitoring

Use UptimeRobot (free):
1. Add website URL
2. Check every 5 minutes
3. Alert via email/SMS if down
4. Track uptime percentage

### 3. Performance Monitoring

**Web Vitals**:
- Largest Contentful Paint (LCP): < 2.5s
- First Input Delay (FID): < 100ms
- Cumulative Layout Shift (CLS): < 0.1

Track with:
```typescript
import { onLCP, onFID, onCLS } from 'web-vitals';

onLCP(metric => sendToAnalytics(metric));
onFID(metric => sendToAnalytics(metric));
onCLS(metric => sendToAnalytics(metric));
```

### 4. Database Monitoring

Watch for:
- Slow queries (> 100ms)
- High connection count
- Growing database size
- Index usage

```sql
-- Find slow queries
SELECT query, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

---

## Troubleshooting

### Common Issues

#### Site is Down
1. Check hosting dashboard for errors
2. Check Sentry for recent errors
3. Verify DNS settings
4. Check SSL certificate status

#### Slow Performance
1. Check database query times
2. Enable caching (Redis)
3. Optimize images
4. Use CDN for static assets
5. Add database indexes

#### Database Connection Errors
```bash
# Check connection string format
echo $DATABASE_URL

# Should include ?sslmode=require
postgresql://user:pass@host/db?sslmode=require

# Test connection
psql $DATABASE_URL -c "SELECT 1"
```

#### Redis Connection Errors
```bash
# Check URL format
echo $REDIS_URL

# Should include password
redis://default:password@host:6379

# Test connection
redis-cli -u $REDIS_URL PING
```

---

## Best Practices

### 1. Deployment Checklist

Before every deployment:
- [ ] All tests passing
- [ ] Build succeeds locally
- [ ] Database backup created
- [ ] Environment variables verified
- [ ] Security audit passed
- [ ] Changelog updated
- [ ] Team notified

### 2. Zero-Downtime Deployments

Use blue-green deployment:
1. Deploy to new environment (green)
2. Test green environment
3. Switch traffic from blue to green
4. Keep blue running for quick rollback

### 3. Database Migrations

```bash
# Always backup before migration
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Test migration on staging first
psql $STAGING_DATABASE_URL -f migration.sql

# If successful, run on production
psql $DATABASE_URL -f migration.sql
```

### 4. Monitoring

Set up alerts for:
- Site down (immediate alert)
- Error rate > 1% (30-min delay)
- Response time > 3s (1-hour delay)
- Database disk > 80% (24-hour delay)

### 5. Documentation

Maintain:
- Deployment runbook
- Incident response plan
- Emergency contacts
- Rollback procedures

---

## Further Learning

### Resources
- [Twelve-Factor App](https://12factor.net/): Best practices for web apps
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [PostgreSQL Performance](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [Redis Best Practices](https://redis.io/docs/manual/patterns/)

### Next Steps
1. Implement CI/CD with GitHub Actions
2. Set up staging environment
3. Create monitoring dashboards
4. Practice rollback procedures
5. Conduct load testing

---

## Conclusion

Production deployment is about more than just getting code live - it's about maintaining reliability, security, and performance for real users.

### Key Takeaways

1. **Prepare Thoroughly**: Test everything before deploying
2. **Security First**: Never commit secrets, use HTTPS, validate inputs
3. **Monitor Everything**: Know when things go wrong
4. **Plan for Failure**: Have backups and rollback procedures
5. **Iterate Gradually**: Small, frequent deployments are safer

### Practice Makes Perfect

Start with small projects, learn from mistakes, and build confidence. Every deployment teaches you something new!

Happy deploying! 🚀
