# Production Deployment Checklist

**Version**: 1.0
**Last Updated**: November 6, 2025
**Status**: Pre-Production
**Deployment Target**: Production

---

## Table of Contents

1. [Overview](#overview)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Security Checklist](#security-checklist)
4. [Infrastructure Checklist](#infrastructure-checklist)
5. [Application Checklist](#application-checklist)
6. [Database Checklist](#database-checklist)
7. [External Services Checklist](#external-services-checklist)
8. [Testing Checklist](#testing-checklist)
9. [Monitoring & Logging Checklist](#monitoring--logging-checklist)
10. [Performance Checklist](#performance-checklist)
11. [Backup & Recovery Checklist](#backup--recovery-checklist)
12. [Documentation Checklist](#documentation-checklist)
13. [Deployment Day Checklist](#deployment-day-checklist)
14. [Post-Deployment Checklist](#post-deployment-checklist)
15. [Rollback Plan](#rollback-plan)
16. [Emergency Contacts](#emergency-contacts)

---

## Overview

### Purpose

This checklist ensures all critical systems, configurations, and processes are ready for production deployment. Complete all items before deploying to production.

### Success Criteria

- ✅ All critical checklist items completed
- ✅ All tests passing (unit, integration, E2E, security)
- ✅ UAT sign-off received
- ✅ Rollback plan tested and ready
- ✅ Monitoring and alerting configured
- ✅ Team briefed and ready

### Severity Levels

- 🔴 **BLOCKER** - Must be completed, blocks deployment
- 🟡 **CRITICAL** - Should be completed, high risk if skipped
- 🟢 **IMPORTANT** - Recommended, medium risk if skipped
- 🔵 **NICE-TO-HAVE** - Optional, low risk if skipped

---

## Pre-Deployment Checklist

### Code Quality

- [ ] 🔴 All code reviewed and approved
- [ ] 🔴 All tests passing (100% pass rate)
  - [ ] Unit tests: `npm test`
  - [ ] Integration tests: `npm run test:e2e`
  - [ ] Security tests: `npm run security:scan`
  - [ ] Accessibility tests: `npm run accessibility:audit`
- [ ] 🔴 No known critical bugs
- [ ] 🔴 No high-severity security vulnerabilities
- [ ] 🟡 Code coverage > 80%
- [ ] 🟡 No linting errors: `npm run lint`
- [ ] 🟡 TypeScript compilation successful: `tsc --noEmit`
- [ ] 🟢 Documentation updated

**Validation**:
```bash
npm run deploy:validate
```

**Sign-off**: _________________ (Engineering Lead)

---

### Version Control

- [ ] 🔴 All changes committed to git
- [ ] 🔴 Production branch up to date
- [ ] 🔴 Git tags created for release (e.g., `v1.0.0`)
- [ ] 🟡 Changelog updated
- [ ] 🟡 Release notes prepared
- [ ] 🟢 Git history clean (no sensitive data)

**Current Version**: _________________

**Git Tag**: _________________

**Sign-off**: _________________ (Engineering Lead)

---

## Security Checklist

### Environment Variables

- [ ] 🔴 `.env` file never committed to repository
- [ ] 🔴 All production secrets generated (not copied from staging)
- [ ] 🔴 `NODE_ENV=production`
- [ ] 🔴 No `BYPASS_ADMIN_AUTH=true` flag
- [ ] 🔴 Strong `JWT_SECRET` (32+ characters, random)
- [ ] 🔴 Strong `SESSION_SECRET` (32+ characters, random)
- [ ] 🟡 All required environment variables set
- [ ] 🟡 No test/development keys in production

**Environment Variables Required**:
```bash
# Core
NODE_ENV=production
PUBLIC_SITE_URL=https://yourdomain.com

# Database
DATABASE_URL=postgresql://...

# Redis
REDIS_URL=redis://...

# Stripe (LIVE keys)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email
RESEND_API_KEY=re_...

# Monitoring
SENTRY_DSN=https://...

# Security
JWT_SECRET=<strong-random-string>
SESSION_SECRET=<strong-random-string>
```

**Validation**:
```bash
npm run deploy:check-env
```

**Sign-off**: _________________ (Security Lead)

---

### Authentication & Authorization

- [ ] 🔴 Admin routes protected by authentication middleware
- [ ] 🔴 No bypass flags enabled in production
- [ ] 🔴 Password hashing implemented (bcrypt)
- [ ] 🔴 Session management secure (httpOnly, secure cookies)
- [ ] 🟡 Rate limiting enabled on auth endpoints
- [ ] 🟡 CORS configured properly
- [ ] 🟡 JWT tokens expire (reasonable timeout)
- [ ] 🟢 2FA available for admin accounts

**Validation**:
```bash
npm run security:audit:auth
```

**Sign-off**: _________________ (Security Lead)

---

### Data Protection

- [ ] 🔴 SQL injection protection verified
- [ ] 🔴 XSS protection enabled
- [ ] 🔴 CSRF protection implemented
- [ ] 🔴 Input validation on all endpoints
- [ ] 🔴 Sensitive data encrypted at rest
- [ ] 🟡 HTTPS enforced (no HTTP)
- [ ] 🟡 Security headers configured (CSP, HSTS, etc.)
- [ ] 🟡 File upload validation and scanning

**Validation**:
```bash
npm run security:owasp
```

**Sign-off**: _________________ (Security Lead)

---

### API Security

- [ ] 🔴 All API endpoints require authentication (except public ones)
- [ ] 🔴 Rate limiting configured (100 requests/15 min)
- [ ] 🔴 API keys rotated (not using test keys)
- [ ] 🟡 API versioning implemented
- [ ] 🟡 Request logging enabled
- [ ] 🟡 Error messages don't expose sensitive info
- [ ] 🟢 API documentation up to date

**Sign-off**: _________________ (API Lead)

---

## Infrastructure Checklist

### Domain & DNS

- [ ] 🔴 Production domain purchased and active
- [ ] 🔴 DNS records configured correctly
  - [ ] A record pointing to production server
  - [ ] CNAME for www subdomain
  - [ ] MX records for email (if applicable)
- [ ] 🔴 SSL certificate installed and valid
- [ ] 🟡 DNS TTL reduced before deployment (for quick rollback)
- [ ] 🟡 CDN configured (Cloudflare Pages)

**Production Domain**: _________________

**SSL Expiry**: _________________

**Sign-off**: _________________ (DevOps Lead)

---

### Hosting & Deployment

- [ ] 🔴 Production hosting environment ready
  - [ ] Cloudflare Pages configured
  - [ ] Custom domain linked
  - [ ] Build settings configured
- [ ] 🔴 Deployment pipeline tested
- [ ] 🔴 Environment variables set in hosting platform
- [ ] 🟡 Auto-scaling configured (if applicable)
- [ ] 🟡 CDN cache configured
- [ ] 🟢 Staging environment mirrors production

**Hosting Platform**: Cloudflare Pages

**Region**: _________________

**Sign-off**: _________________ (DevOps Lead)

---

### Database

- [ ] 🔴 Production database provisioned (Neon PostgreSQL)
- [ ] 🔴 Database migrations applied
- [ ] 🔴 Database backups configured (daily)
- [ ] 🔴 Database credentials rotated (not using staging creds)
- [ ] 🟡 Database connection pooling configured
- [ ] 🟡 Database performance tuned (indexes created)
- [ ] 🟡 Database monitoring enabled
- [ ] 🟢 Point-in-time recovery enabled

**Database Provider**: Neon

**Backup Schedule**: Daily

**Retention**: 30 days

**Validation**:
```bash
npm run deploy:check-db
```

**Sign-off**: _________________ (Database Lead)

---

### Caching (Redis)

- [ ] 🔴 Production Redis instance provisioned (Upstash)
- [ ] 🔴 Redis connection tested
- [ ] 🔴 Redis credentials rotated
- [ ] 🟡 Redis persistence configured
- [ ] 🟡 Redis memory limits set
- [ ] 🟡 Redis monitoring enabled
- [ ] 🟢 Redis cluster configured (high availability)

**Redis Provider**: Upstash

**Max Memory**: _________________

**Eviction Policy**: _________________

**Validation**:
```bash
npm run deploy:check-redis
```

**Sign-off**: _________________ (Infrastructure Lead)

---

## Application Checklist

### Build & Deployment

- [ ] 🔴 Production build successful: `npm run build`
- [ ] 🔴 Build artifacts optimized (minified, compressed)
- [ ] 🔴 No console.log statements in production code
- [ ] 🔴 Source maps generated (for debugging)
- [ ] 🟡 Build size analyzed and acceptable
- [ ] 🟡 Bundle size optimized (code splitting)
- [ ] 🟢 Service worker configured (PWA)

**Build Size**: _________________

**Validation**:
```bash
npm run build:prod
npm run build:analyze
```

**Sign-off**: _________________ (Frontend Lead)

---

### Configuration

- [ ] 🔴 `NODE_ENV=production` set
- [ ] 🔴 Production URLs configured (API, CDN, etc.)
- [ ] 🔴 Feature flags set correctly for production
- [ ] 🔴 Debug mode disabled
- [ ] 🟡 Logging level appropriate (info/warn/error only)
- [ ] 🟡 Session timeout configured (30 minutes)
- [ ] 🟢 Analytics configured (Google Analytics, etc.)

**Sign-off**: _________________ (Engineering Lead)

---

## External Services Checklist

### Payment Processing (Stripe)

- [ ] 🔴 Stripe account verified and activated
- [ ] 🔴 Using LIVE Stripe keys (not test keys)
  - [ ] `STRIPE_SECRET_KEY=sk_live_...`
  - [ ] `STRIPE_PUBLISHABLE_KEY=pk_live_...`
- [ ] 🔴 Stripe webhook configured and tested
  - [ ] Endpoint: `https://yourdomain.com/api/webhooks/stripe`
  - [ ] Events: `payment_intent.succeeded`, `payment_intent.failed`, etc.
- [ ] 🔴 Payment flows tested in production mode
- [ ] 🟡 Dispute handling process documented
- [ ] 🟡 Refund process tested
- [ ] 🟢 Subscription management tested (if applicable)

**Stripe Account**: _________________

**Webhook Secret**: whsec_...

**Validation**:
```bash
npm run deploy:check-stripe
```

**Sign-off**: _________________ (Payment Lead)

---

### Email Service (Resend)

- [ ] 🔴 Resend account active
- [ ] 🔴 Production API key configured
- [ ] 🔴 Domain verified for sending (SPF, DKIM)
- [ ] 🔴 Email templates tested
- [ ] 🟡 Email deliverability tested (not going to spam)
- [ ] 🟡 Unsubscribe links working
- [ ] 🟢 Email analytics configured

**Email Domain**: _________________

**From Address**: _________________

**Validation**:
```bash
npm run deploy:check-email
```

**Sign-off**: _________________ (Email Lead)

---

### Monitoring (Sentry)

- [ ] 🔴 Sentry project created for production
- [ ] 🔴 Sentry DSN configured
- [ ] 🔴 Error reporting tested
- [ ] 🟡 Source maps uploaded to Sentry
- [ ] 🟡 Release tracking configured
- [ ] 🟡 Alert rules configured
- [ ] 🟢 Performance monitoring enabled

**Sentry Project**: _________________

**Validation**:
```bash
npm run deploy:check-sentry
```

**Sign-off**: _________________ (DevOps Lead)

---

## Testing Checklist

### Automated Tests

- [ ] 🔴 All unit tests passing: `npm test`
- [ ] 🔴 All integration tests passing: `npm run test:e2e`
- [ ] 🔴 Security scan clean: `npm run security:scan`
- [ ] 🔴 OWASP Top 10 audit passing: `npm run security:owasp`
- [ ] 🟡 Load tests passing: `npm run test:load`
- [ ] 🟡 Accessibility audit passing: `npm run accessibility:audit`
- [ ] 🟢 Performance tests meeting targets

**Test Results**:
- Unit Tests: _____ / _____ passing
- Integration Tests: _____ / _____ passing
- Security Tests: _____ vulnerabilities found
- Load Tests: Peak throughput _____ req/s

**Sign-off**: _________________ (QA Lead)

---

### Manual Testing

- [ ] 🔴 UAT completed and signed off
- [ ] 🔴 All critical user journeys tested in staging
- [ ] 🟡 Cross-browser testing completed
  - [ ] Chrome
  - [ ] Firefox
  - [ ] Safari
  - [ ] Edge
- [ ] 🟡 Mobile testing completed
  - [ ] iOS Safari
  - [ ] Android Chrome
- [ ] 🟡 Payment flows tested end-to-end

**UAT Report**: See `.uat/report-latest.md`

**Sign-off**: _________________ (QA Lead)

---

## Monitoring & Logging Checklist

### Logging

- [ ] 🔴 Application logs configured
- [ ] 🔴 Error logs captured (Sentry)
- [ ] 🔴 Access logs enabled
- [ ] 🟡 Log rotation configured
- [ ] 🟡 Log retention policy set (90 days)
- [ ] 🟢 Log aggregation configured (if applicable)

**Log Level**: info

**Retention**: 90 days

**Sign-off**: _________________ (DevOps Lead)

---

### Monitoring

- [ ] 🔴 Uptime monitoring configured
  - [ ] Homepage monitoring
  - [ ] API endpoint monitoring
  - [ ] Database connectivity monitoring
- [ ] 🔴 Error rate monitoring (Sentry)
- [ ] 🟡 Performance monitoring (response times)
- [ ] 🟡 Resource monitoring (CPU, memory, disk)
- [ ] 🟡 Database monitoring (query performance, connections)
- [ ] 🟢 User analytics configured

**Monitoring Tools**: Sentry, Cloudflare Analytics

**Sign-off**: _________________ (DevOps Lead)

---

### Alerting

- [ ] 🔴 Critical alerts configured
  - [ ] Site down
  - [ ] Database unreachable
  - [ ] Error rate spike
  - [ ] Payment processing failures
- [ ] 🟡 Warning alerts configured
  - [ ] High response times
  - [ ] High error rate
  - [ ] Disk space low
- [ ] 🟡 Alert channels configured (email, Slack)
- [ ] 🟢 On-call rotation defined

**Alert Recipients**: _________________

**Sign-off**: _________________ (DevOps Lead)

---

## Performance Checklist

### Page Performance

- [ ] 🔴 Core Web Vitals passing
  - [ ] LCP < 2.5s
  - [ ] FID < 100ms
  - [ ] CLS < 0.1
- [ ] 🔴 Homepage loads < 2s
- [ ] 🟡 Assets compressed (gzip/brotli)
- [ ] 🟡 Images optimized
- [ ] 🟡 CSS minified
- [ ] 🟡 JavaScript minified and bundled
- [ ] 🟢 Lazy loading implemented

**Lighthouse Score**: _________________

**Sign-off**: _________________ (Performance Lead)

---

### API Performance

- [ ] 🔴 API response times < 500ms (p95)
- [ ] 🔴 Database queries optimized
- [ ] 🟡 Caching implemented (Redis)
- [ ] 🟡 Rate limiting configured
- [ ] 🟢 CDN configured for static assets

**Sign-off**: _________________ (Backend Lead)

---

## Backup & Recovery Checklist

### Backups

- [ ] 🔴 Database backups configured (daily)
- [ ] 🔴 Backup restoration tested
- [ ] 🔴 Backup retention policy set (30 days)
- [ ] 🟡 Redis backups configured
- [ ] 🟡 File storage backups configured (if applicable)
- [ ] 🟢 Offsite backups configured

**Backup Schedule**: Daily at 2:00 AM UTC

**Validation**:
```bash
npm run backup:test
```

**Sign-off**: _________________ (Infrastructure Lead)

---

### Disaster Recovery

- [ ] 🔴 Rollback plan documented and tested
- [ ] 🔴 Database restore procedure documented
- [ ] 🟡 RTO (Recovery Time Objective) defined: _________________
- [ ] 🟡 RPO (Recovery Point Objective) defined: _________________
- [ ] 🟢 Disaster recovery drill completed

**Sign-off**: _________________ (Infrastructure Lead)

---

## Documentation Checklist

### Technical Documentation

- [ ] 🔴 README.md updated
- [ ] 🔴 Deployment guide updated
- [ ] 🔴 API documentation current
- [ ] 🟡 Architecture diagrams updated
- [ ] 🟡 Database schema documented
- [ ] 🟢 Code comments complete

**Sign-off**: _________________ (Engineering Lead)

---

### Operational Documentation

- [ ] 🔴 Runbook created
  - [ ] How to deploy
  - [ ] How to rollback
  - [ ] Common issues and solutions
- [ ] 🔴 Monitoring guide created
- [ ] 🟡 Incident response plan documented
- [ ] 🟡 Escalation procedures defined
- [ ] 🟢 Knowledge base articles prepared

**Sign-off**: _________________ (Operations Lead)

---

### User Documentation

- [ ] 🟡 User guide updated
- [ ] 🟡 FAQ updated
- [ ] 🟡 Help center articles prepared
- [ ] 🟢 Video tutorials created

**Sign-off**: _________________ (Product Manager)

---

## Deployment Day Checklist

### Pre-Deployment (T-24 hours)

- [ ] 🔴 All checklist items above completed
- [ ] 🔴 Deployment window scheduled
- [ ] 🔴 Team availability confirmed
- [ ] 🔴 Stakeholders notified
- [ ] 🟡 Customer communication prepared
- [ ] 🟡 Support team briefed
- [ ] 🟢 Social media posts prepared

**Deployment Window**: _________________

**Team Members**:
- Engineering: _________________
- DevOps: _________________
- QA: _________________
- Support: _________________

**Sign-off**: _________________ (Project Manager)

---

### During Deployment

- [ ] 🔴 Staging environment verified one last time
- [ ] 🔴 Backup created immediately before deployment
- [ ] 🔴 DNS TTL lowered (for quick rollback)
- [ ] 🔴 Maintenance page ready (if needed)
- [ ] 🔴 Deployment executed
  ```bash
  npm run deploy:production
  ```
- [ ] 🔴 Database migrations run (if applicable)
- [ ] 🔴 Cache cleared
- [ ] 🟡 CDN cache purged
- [ ] 🟡 Smoke tests run

**Deployment Started**: _________________

**Deployment Completed**: _________________

**Sign-off**: _________________ (Deployment Lead)

---

### Smoke Tests (Immediate Post-Deployment)

Run within 5 minutes of deployment:

- [ ] 🔴 Homepage loads successfully
- [ ] 🔴 User can register
- [ ] 🔴 User can login
- [ ] 🔴 Product pages load
- [ ] 🔴 Checkout flow works
- [ ] 🔴 Payment processing works (test with real card)
- [ ] 🔴 Email notifications sent
- [ ] 🟡 Admin dashboard accessible
- [ ] 🟡 API endpoints responding
- [ ] 🟡 Database queries working

**Validation**:
```bash
npm run deploy:smoke-test
```

**Sign-off**: _________________ (QA Lead)

---

## Post-Deployment Checklist

### First Hour

- [ ] 🔴 Monitor error rates (should be < 1%)
- [ ] 🔴 Monitor response times (should be < 2s)
- [ ] 🔴 Check Sentry for errors
- [ ] 🔴 Verify no alerts triggered
- [ ] 🟡 Monitor user registrations
- [ ] 🟡 Monitor transactions
- [ ] 🟡 Check payment processing

**Error Rate**: _________________ %

**Response Time (p95)**: _________________ ms

**Active Users**: _________________

**Sign-off**: _________________ (DevOps Lead)

---

### First 24 Hours

- [ ] 🔴 Continuous monitoring (error rates, response times)
- [ ] 🔴 Review Sentry errors daily
- [ ] 🔴 Check backup completion
- [ ] 🟡 Analyze user behavior
- [ ] 🟡 Review performance metrics
- [ ] 🟡 Check Core Web Vitals
- [ ] 🟢 Collect user feedback

**Issues Found**: _________________

**Sign-off**: _________________ (Operations Lead)

---

### First Week

- [ ] 🔴 Daily monitoring and review
- [ ] 🔴 Address any critical issues immediately
- [ ] 🟡 Weekly team review meeting
- [ ] 🟡 Update documentation based on learnings
- [ ] 🟢 Plan next iteration

**Sign-off**: _________________ (Engineering Manager)

---

## Rollback Plan

### When to Rollback

Rollback immediately if:
- Site is completely down
- Critical functionality broken (auth, checkout, payments)
- Data corruption detected
- Security breach detected
- Error rate > 10%

Rollback recommended if:
- Error rate > 5%
- Response times > 5s
- User complaints spike
- Payment failures > 1%

### Rollback Procedure

**Step 1: Decide to Rollback**
- Incident commander makes call
- Notify team immediately

**Step 2: Execute Rollback**
```bash
# Revert to previous deployment
npm run deploy:rollback

# Or manually:
# 1. Revert git to previous tag
git checkout v1.0.0-previous
# 2. Redeploy
npm run deploy:production
```

**Step 3: Verify Rollback**
- Run smoke tests
- Check error rates
- Verify core functionality

**Step 4: Communicate**
- Notify stakeholders
- Update status page
- Communicate to users (if necessary)

**Step 5: Post-Mortem**
- Document what went wrong
- Identify root cause
- Create action items
- Schedule retrospective

**Rollback Time Target**: < 5 minutes

**Testing**: Rollback procedure tested? [ ] Yes [ ] No

---

## Emergency Contacts

### Engineering Team

| Role | Name | Email | Phone | Availability |
|------|------|-------|-------|--------------|
| Engineering Lead | _________ | _________ | _________ | 24/7 |
| DevOps Lead | _________ | _________ | _________ | 24/7 |
| Backend Lead | _________ | _________ | _________ | 24/7 |
| Frontend Lead | _________ | _________ | _________ | On-call |

### External Services

| Service | Support Email | Support Phone | Account ID |
|---------|---------------|---------------|------------|
| Cloudflare | _________ | _________ | _________ |
| Neon (Database) | _________ | _________ | _________ |
| Upstash (Redis) | _________ | _________ | _________ |
| Stripe | _________ | _________ | _________ |
| Resend | _________ | _________ | _________ |
| Sentry | _________ | _________ | _________ |

---

## Final Sign-Off

### Checklist Completion

**Total Items**: _________________

**Completed**: _________________

**Blockers Remaining**: _________________

**Critical Items Remaining**: _________________

### Approvals Required

- [ ] Engineering Lead: _________________ Date: _________________
- [ ] Security Lead: _________________ Date: _________________
- [ ] QA Lead: _________________ Date: _________________
- [ ] DevOps Lead: _________________ Date: _________________
- [ ] Product Manager: _________________ Date: _________________
- [ ] Engineering Manager: _________________ Date: _________________

### Deployment Decision

**Status**: [ ] APPROVED [ ] APPROVED WITH CONDITIONS [ ] REJECTED

**Conditions** (if applicable): _________________________________________________

**Next Steps**: _________________________________________________

---

## Appendix

### Automated Validation

Run comprehensive deployment readiness check:

```bash
npm run deploy:validate
```

This will check:
- Environment variables
- Database connectivity
- Redis connectivity
- External services (Stripe, Resend, Sentry)
- Security configuration
- Build process
- Test suite
- Performance benchmarks

### Useful Commands

```bash
# Validate deployment readiness
npm run deploy:validate

# Check environment variables
npm run deploy:check-env

# Test database connection
npm run deploy:check-db

# Test Redis connection
npm run deploy:check-redis

# Run smoke tests
npm run deploy:smoke-test

# Deploy to production
npm run deploy:production

# Rollback deployment
npm run deploy:rollback
```

---

**Document Version**: 1.0
**Last Updated**: November 6, 2025
**Next Review**: Before production deployment
