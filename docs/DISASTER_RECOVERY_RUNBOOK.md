# Disaster Recovery Runbook

**Document Version**: 1.0
**Last Updated**: November 5, 2025
**Owner**: DevOps Team
**Review Frequency**: Quarterly

---

## Table of Contents

1. [Overview](#overview)
2. [Emergency Contacts](#emergency-contacts)
3. [Recovery Objectives](#recovery-objectives)
4. [Disaster Scenarios](#disaster-scenarios)
5. [Recovery Procedures](#recovery-procedures)
6. [System Dependencies](#system-dependencies)
7. [Data Recovery](#data-recovery)
8. [Service Restoration](#service-restoration)
9. [Validation & Testing](#validation--testing)
10. [Post-Recovery Actions](#post-recovery-actions)

---

## Overview

### Purpose

This runbook provides step-by-step procedures for recovering the Spirituality E-Commerce Platform from various disaster scenarios.

### Scope

- Database failures
- Application server failures
- Infrastructure outages
- Data corruption
- Security incidents
- Complete system loss

### Recovery Priority

1. **Critical (P0)**: Database, Authentication, Payment Processing
2. **High (P1)**: Core Application, API
3. **Medium (P2)**: Admin Dashboard, Reporting
4. **Low (P3)**: Analytics, Marketing Features

---

## Emergency Contacts

### Internal Team

| Role | Name | Phone | Email | Availability |
|------|------|-------|-------|--------------|
| **Lead DevOps** | [Name] | [Phone] | [Email] | 24/7 |
| **Database Admin** | [Name] | [Phone] | [Email] | 24/7 |
| **Tech Lead** | [Name] | [Phone] | [Email] | Business Hours |
| **Security Lead** | [Name] | [Phone] | [Email] | 24/7 |
| **Business Owner** | [Name] | [Phone] | [Email] | Business Hours |

### External Vendors

| Service | Support Contact | Phone | Email | SLA |
|---------|----------------|-------|-------|-----|
| **Cloudflare** | Support Portal | 1-888-993-5273 | support@cloudflare.com | 24/7 |
| **Neon (Database)** | Support Portal | - | support@neon.tech | 24/7 |
| **Upstash (Redis)** | Support Portal | - | support@upstash.com | 24/7 |
| **Stripe** | Support Portal | 1-888-926-2289 | support@stripe.com | 24/7 |
| **Sentry** | Support Portal | - | support@sentry.io | Business Hours |

---

## Recovery Objectives

### RTO (Recovery Time Objective)

| Component | Target RTO | Maximum Acceptable |
|-----------|------------|-------------------|
| Database | 15 minutes | 30 minutes |
| Application | 30 minutes | 1 hour |
| Payment Processing | 15 minutes | 30 minutes |
| Full System | 2 hours | 4 hours |

### RPO (Recovery Point Objective)

| Data Type | Target RPO | Backup Frequency |
|-----------|-----------|------------------|
| Transactional Data | 1 hour | Hourly |
| User Data | 4 hours | Every 6 hours |
| Configuration | 24 hours | Daily |
| Media/Assets | 24 hours | Daily |

**Note**: These are targets. Actual recovery may vary based on disaster scope.

---

## Disaster Scenarios

### Scenario 1: Database Failure

**Symptoms**:
- Application shows database connection errors
- 500 errors on all pages
- Health check fails for database

**Impact**: Complete service outage

**Recovery**: [See Database Recovery](#database-recovery)

---

### Scenario 2: Application Server Failure

**Symptoms**:
- Application not responding
- 502/503 errors from load balancer
- Health check timeout

**Impact**: Service degradation or outage

**Recovery**: [See Application Recovery](#application-recovery)

---

### Scenario 3: Redis Failure

**Symptoms**:
- Users cannot login
- Session errors
- Cart data lost

**Impact**: Service degradation (can function without sessions)

**Recovery**: [See Redis Recovery](#redis-recovery)

---

### Scenario 4: Complete Infrastructure Loss

**Symptoms**:
- All services unreachable
- DNS not resolving
- Complete outage

**Impact**: Total service outage

**Recovery**: [See Full System Recovery](#full-system-recovery)

---

### Scenario 5: Data Corruption

**Symptoms**:
- Incorrect data in database
- Application behaving unexpectedly
- Data integrity issues

**Impact**: Service functional but data unreliable

**Recovery**: [See Data Corruption Recovery](#data-corruption-recovery)

---

### Scenario 6: Security Incident

**Symptoms**:
- Unauthorized access detected
- Data breach suspected
- Malware detected

**Impact**: Varies (potential data compromise)

**Recovery**: [See Security Incident Response](#security-incident-response)

---

## Recovery Procedures

### Database Recovery

**Estimated Time**: 15-30 minutes

#### Step 1: Assess the Situation (2 minutes)

```bash
# Check database connectivity
psql $DATABASE_URL -c "SELECT 1"

# Check database status in Neon dashboard
# https://console.neon.tech/

# Check recent error logs in Sentry
# https://sentry.io/
```

**Decision Point**:
- If database responds → Minor issue, investigate specific error
- If database unreachable → Proceed to Step 2

---

#### Step 2: Create New Database Instance (5 minutes)

**Option A: Using Neon Dashboard**
1. Log into Neon console: https://console.neon.tech/
2. Create new database instance
3. Copy new DATABASE_URL
4. Note the new connection string

**Option B: Using Neon CLI**
```bash
# Create new project
neon projects create --name spirituality-recovery

# Get connection string
neon connection-string
```

---

#### Step 3: Restore from Latest Backup (10-15 minutes)

```bash
# List available backups
npm run backup:list

# Example output:
# 1. spirituality_2025-11-05_14-00-00.dump (15.2 MB)
# 2. spirituality_2025-11-05_12-00-00.dump (14.8 MB)

# Identify latest good backup
# Check Sentry for when issues started
# Choose backup from before issue

# Restore to new database
pg_restore -h [new-host] \
  -p 5432 \
  -U [user] \
  -d [database] \
  -c \
  -v \
  backups/spirituality_2025-11-05_14-00-00.dump
```

**Environment Variable**:
```bash
# Set temporary password for restore
export PGPASSWORD=[password]

# Run restore
pg_restore [options]

# Clear password
unset PGPASSWORD
```

---

#### Step 4: Update Environment Variables (2 minutes)

**Cloudflare Pages**:
1. Go to Pages dashboard
2. Select your project
3. Settings → Environment variables
4. Update `DATABASE_URL` with new connection string
5. Redeploy application

**Vercel**:
```bash
# Update environment variable
vercel env add DATABASE_URL production

# Redeploy
vercel --prod
```

**Alternative: Update .env and Redeploy**
```bash
# Update production .env file
DATABASE_URL=postgresql://[new-connection-string]

# Commit and push (triggers auto-deploy)
git add .env.production
git commit -m "Update DATABASE_URL for recovery"
git push origin main
```

---

#### Step 5: Verify Database Recovery (5 minutes)

```bash
# Test connection to new database
psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"

# Check critical tables
psql $DATABASE_URL -c "SELECT COUNT(*) FROM orders;"
psql $DATABASE_URL -c "SELECT COUNT(*) FROM courses;"

# Verify recent data
psql $DATABASE_URL -c "SELECT MAX(created_at) FROM orders;"

# Compare with backup timestamp
# Data loss = (current time - MAX(created_at))
```

**Health Check**:
```bash
# Check application health endpoint
curl https://yourdomain.com/api/health

# Expected response:
# {
#   "status": "healthy",
#   "services": {
#     "database": "connected",
#     "redis": "connected"
#   }
# }
```

---

#### Step 6: Restore Lost Transactions (variable)

**If data loss occurred**:

1. **Identify Lost Data Window**
   ```
   Backup time: 2025-11-05 14:00:00
   Recovery time: 2025-11-05 16:30:00
   Data loss window: 2.5 hours
   ```

2. **Check Stripe for Lost Orders**
   ```bash
   # List recent charges in Stripe dashboard
   # https://dashboard.stripe.com/payments

   # Or via API
   curl https://api.stripe.com/v1/charges \
     -u $STRIPE_SECRET_KEY \
     -d created[gte]=$(date -d "2025-11-05 14:00:00" +%s)
   ```

3. **Manually Restore Lost Orders**
   - Contact affected customers
   - Recreate orders in system
   - Update inventory
   - Send confirmation emails

---

### Application Recovery

**Estimated Time**: 30 minutes - 1 hour

#### Step 1: Diagnose Issue (5 minutes)

```bash
# Check application logs
# Cloudflare Pages
wrangler tail

# Check Sentry for errors
# https://sentry.io/

# Check health endpoint
curl https://yourdomain.com/api/health
```

---

#### Step 2: Rollback to Last Known Good Version (10 minutes)

**Cloudflare Pages**:
1. Go to Deployments page
2. Find last successful deployment
3. Click "Rollback to this deployment"
4. Wait for rollback to complete (2-3 minutes)

**Vercel**:
```bash
# List recent deployments
vercel list

# Rollback to specific deployment
vercel rollback [deployment-url]
```

**Git-based Rollback**:
```bash
# Find last good commit
git log --oneline -10

# Create rollback
git revert [bad-commit-hash]
git push origin main

# Or hard reset (use with caution)
git reset --hard [good-commit-hash]
git push --force origin main
```

---

#### Step 3: Clear CDN Cache (2 minutes)

**Cloudflare**:
```bash
# Using Cloudflare API
curl -X POST "https://api.cloudflare.com/client/v4/zones/[zone-id]/purge_cache" \
  -H "Authorization: Bearer [api-token]" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}'
```

**Or via Dashboard**:
1. Go to Cloudflare dashboard
2. Caching → Configuration
3. Click "Purge Everything"

---

#### Step 4: Restart Services (if applicable) (5 minutes)

**For VPS/Self-hosted**:
```bash
# Restart application
pm2 restart all

# Or using systemd
sudo systemctl restart app.service

# Check status
pm2 status
# or
sudo systemctl status app.service
```

---

#### Step 5: Verify Application Recovery (5-10 minutes)

```bash
# Check homepage
curl -I https://yourdomain.com/
# Expected: 200 OK

# Test user flow
# 1. View products
curl https://yourdomain.com/courses

# 2. Test API
curl https://yourdomain.com/api/health

# 3. Test authentication (manual in browser)
# - Login
# - View cart
# - Checkout (test mode)
```

---

### Redis Recovery

**Estimated Time**: 10-15 minutes

#### Step 1: Check Redis Status (2 minutes)

```bash
# Test Redis connection
redis-cli -u $REDIS_URL PING
# Expected: PONG

# Check Redis info in Upstash dashboard
# https://console.upstash.com/
```

---

#### Step 2: Create New Redis Instance (5 minutes)

**Upstash Dashboard**:
1. Go to https://console.upstash.com/
2. Create new database
3. Copy new REDIS_URL
4. Note connection details

---

#### Step 3: Update Environment Variables (3 minutes)

```bash
# Update REDIS_URL in hosting platform
# (Same process as database update)

# Redeploy application
```

---

#### Step 4: Verify Redis Recovery (5 minutes)

```bash
# Test connection
redis-cli -u $REDIS_URL PING

# Test set/get
redis-cli -u $REDIS_URL SET test_key test_value
redis-cli -u $REDIS_URL GET test_key
redis-cli -u $REDIS_URL DEL test_key

# Check application health
curl https://yourdomain.com/api/health
```

**Note**: Users will need to re-login (sessions lost)

---

### Full System Recovery

**Estimated Time**: 2-4 hours

**Prerequisites**:
- Access to backup files
- Access to hosting provider dashboards
- Access to DNS provider
- Access to GitHub repository

---

#### Phase 1: Infrastructure Setup (30-60 minutes)

**1. Create New Database (Neon)**:
```bash
# Already covered in Database Recovery section
```

**2. Create New Redis (Upstash)**:
```bash
# Already covered in Redis Recovery section
```

**3. Setup Hosting (Cloudflare Pages)**:
1. Go to https://dash.cloudflare.com/
2. Pages → Create project
3. Connect to GitHub repository
4. Configure build settings:
   - Build command: `npm run build`
   - Output directory: `dist`
5. Add environment variables (see step 4)

**4. Configure Environment Variables**:
```bash
# Critical variables
DATABASE_URL=postgresql://[connection-string]
REDIS_URL=redis://[connection-string]
JWT_SECRET=[32+ character secret]

# Stripe
STRIPE_SECRET_KEY=sk_live_[key]
STRIPE_PUBLISHABLE_KEY=pk_live_[key]
STRIPE_WEBHOOK_SECRET=whsec_[secret]

# Email
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASSWORD=SG.[api-key]
EMAIL_FROM=noreply@yourdomain.com

# Monitoring
SENTRY_DSN=https://[token]@sentry.io/[project-id]

# Backup
BACKUP_DIR=/path/to/backups
BACKUP_API_KEY=[secure-key]
```

---

#### Phase 2: Data Restoration (30-60 minutes)

**1. Restore Database**:
```bash
# Get latest backup
npm run backup:list

# Restore to new database
pg_restore -h [host] -U [user] -d [database] -c -v [backup-file]
```

**2. Verify Data**:
```bash
# Check record counts
psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"
psql $DATABASE_URL -c "SELECT COUNT(*) FROM orders;"
psql $DATABASE_URL -c "SELECT COUNT(*) FROM courses;"

# Check most recent records
psql $DATABASE_URL -c "SELECT MAX(created_at) FROM orders;"
```

**3. Redis Setup**:
```bash
# No data to restore (sessions are ephemeral)
# Users will need to re-login
```

---

#### Phase 3: Application Deployment (20-30 minutes)

**1. Trigger Deployment**:
```bash
# Push to trigger auto-deploy
git push origin main

# Or manual deploy
vercel --prod
```

**2. Monitor Deployment**:
- Watch build logs in Cloudflare Pages / Vercel dashboard
- Check for errors
- Wait for deployment to complete

**3. Configure DNS** (if needed):
```bash
# Point domain to new hosting
# A record: [your-ip]
# or CNAME: [your-host]
```

---

#### Phase 4: Service Configuration (15-30 minutes)

**1. Setup Stripe Webhooks**:
1. Go to https://dashboard.stripe.com/webhooks
2. Create new webhook endpoint
3. URL: `https://yourdomain.com/api/webhooks/stripe`
4. Select events to listen for
5. Copy webhook secret
6. Update `STRIPE_WEBHOOK_SECRET` environment variable

**2. Configure Email Service**:
- Verify SendGrid API key is valid
- Test email sending

**3. Setup Monitoring**:
- Verify Sentry is receiving events
- Setup UptimeRobot monitoring

---

#### Phase 5: Validation (15-30 minutes)

**Complete Validation Checklist** (see Validation section below)

---

### Data Corruption Recovery

**Estimated Time**: 1-2 hours

#### Step 1: Identify Scope of Corruption (15 minutes)

```bash
# Find inconsistencies
psql $DATABASE_URL << EOF
-- Check for orphaned records
SELECT COUNT(*) FROM order_items WHERE order_id NOT IN (SELECT id FROM orders);

-- Check for NULL required fields
SELECT COUNT(*) FROM users WHERE email IS NULL;

-- Check for duplicate records
SELECT email, COUNT(*) FROM users GROUP BY email HAVING COUNT(*) > 1;
EOF
```

---

#### Step 2: Determine Root Cause (15-30 minutes)

- Check Sentry for errors around corruption time
- Review deployment history
- Check for failed migrations
- Review recent code changes

---

#### Step 3: Restore from Backup (30-45 minutes)

**Option A: Full Restore**
```bash
# If corruption is widespread
# Follow "Database Recovery" procedure
```

**Option B: Partial Restore**
```bash
# If only specific tables are affected
# Create temporary database
createdb temp_recovery

# Restore backup to temporary database
pg_restore -d temp_recovery [backup-file]

# Export affected table data
pg_dump -t affected_table temp_recovery > affected_table_backup.sql

# Import into production (carefully!)
psql $DATABASE_URL < affected_table_backup.sql

# Cleanup
dropdb temp_recovery
```

---

#### Step 4: Fix Data Integrity (variable)

```sql
-- Remove orphaned records
DELETE FROM order_items
WHERE order_id NOT IN (SELECT id FROM orders);

-- Remove duplicates (keep oldest)
DELETE FROM users a
USING users b
WHERE a.id > b.id AND a.email = b.email;

-- Fix NULL values
UPDATE users SET email = 'unknown@example.com'
WHERE email IS NULL;
```

---

#### Step 5: Prevent Future Corruption (ongoing)

- Add database constraints
- Implement data validation
- Add integrity checks to backup process
- Review and fix buggy code

---

### Security Incident Response

**Estimated Time**: Variable (2-24 hours)

**IMPORTANT**: Follow company security incident response policy

#### Step 1: Contain the Incident (IMMEDIATE)

**If Active Breach Suspected**:
```bash
# Immediately disable API access
# Revoke API keys in Stripe, SendGrid, etc.

# Change all credentials
# - Database passwords
# - API keys
# - JWT secrets

# Block suspicious IPs in Cloudflare
# Firewall Rules → Block IP range

# Take affected systems offline if needed
```

---

#### Step 2: Assess Impact (1-2 hours)

- **Data accessed**: Review logs, check Sentry
- **Data modified**: Check database audit logs
- **Systems compromised**: Identify affected services
- **User accounts**: Check for unauthorized access

---

#### Step 3: Eradicate Threat (2-4 hours)

```bash
# Restore from clean backup (before breach)
# Follow "Database Recovery" procedure

# Update all secrets
# Generate new JWT_SECRET
openssl rand -base64 32

# Rotate all API keys
# - Stripe
# - SendGrid
# - Sentry
# - Others

# Update environment variables
# Deploy new keys to production
```

---

#### Step 4: Recovery (1-2 hours)

```bash
# Restore services with new credentials
# Follow "Full System Recovery" procedure

# Force password reset for all users
UPDATE users SET password_reset_required = true;

# Invalidate all sessions
DELETE FROM sessions;
# or
redis-cli -u $REDIS_URL FLUSHALL
```

---

#### Step 5: Post-Incident (ongoing)

- **Notification**: Inform affected users (if required)
- **Documentation**: Create incident report
- **Compliance**: Report to authorities (if required)
- **Prevention**: Implement additional security measures

---

## System Dependencies

### Critical Dependencies

```
User Request
    ↓
Cloudflare CDN (DDoS protection, SSL)
    ↓
Application Server (Cloudflare Pages / Vercel)
    ↓
    ├→ PostgreSQL Database (Neon) [CRITICAL]
    ├→ Redis (Upstash) [IMPORTANT]
    ├→ Stripe (Payments) [CRITICAL for orders]
    ├→ SendGrid (Emails) [IMPORTANT]
    └→ Sentry (Monitoring) [OPTIONAL]
```

### Dependency Recovery Priority

1. **Database** - Nothing works without it
2. **Application** - Core functionality
3. **Payments** - Revenue critical
4. **Redis** - Sessions (users can re-login)
5. **Email** - Can queue and send later
6. **Monitoring** - Nice to have

---

## Data Recovery

### Backup Locations

**Primary**: Local backups directory
```
/path/to/app/backups/
├── spirituality_2025-11-05_14-00-00.dump
├── spirituality_2025-11-05_12-00-00.dump
└── spirituality_2025-11-05_10-00-00.dump
```

**Secondary** (if configured): Cloud storage
```
s3://mybucket/backups/
├── spirituality_2025-11-05_14-00-00.dump
├── spirituality_2025-11-05_12-00-00.dump
└── ...
```

### Backup Verification

```bash
# List backups
npm run backup:list

# Get backup info
ls -lh backups/

# Test backup integrity
pg_restore --list backups/latest.dump | head -20
```

---

## Service Restoration

### Restoration Order

1. **Database** (15-30 min)
2. **Application** (10-20 min)
3. **Redis** (5-10 min)
4. **External Services** (10-15 min)
5. **Monitoring** (5 min)

**Total Time**: 45-80 minutes (for complete restoration)

---

## Validation & Testing

### Post-Recovery Validation Checklist

#### Infrastructure
- [ ] Database accessible
- [ ] Redis accessible
- [ ] Application deployed
- [ ] DNS resolving correctly
- [ ] SSL certificates valid

#### Application
- [ ] Homepage loads (< 3s)
- [ ] API health check passes
- [ ] Health endpoint returns "healthy"

#### Functionality
- [ ] User can view courses
- [ ] User can register
- [ ] User can login
- [ ] User can add to cart
- [ ] User can checkout (test mode)
- [ ] Order confirmation sent
- [ ] Admin dashboard accessible

#### Data Integrity
- [ ] User count matches backup
- [ ] Order count matches backup
- [ ] Course count matches backup
- [ ] Recent data verified

#### External Services
- [ ] Stripe webhook receiving events
- [ ] Emails sending correctly
- [ ] Sentry receiving errors
- [ ] Monitoring active

---

## Post-Recovery Actions

### Immediate (Within 1 hour)

1. **Notify stakeholders**: Recovery complete
2. **Document incident**: What happened, how fixed
3. **Monitor closely**: Watch for issues
4. **Create fresh backup**: Capture recovered state

### Short-term (Within 24 hours)

1. **Root cause analysis**: Why did it happen?
2. **Update runbook**: Lessons learned
3. **Customer communication**: If applicable
4. **Review logs**: Ensure no lingering issues

### Medium-term (Within 1 week)

1. **Improve monitoring**: Prevent future incidents
2. **Update recovery procedures**: Based on experience
3. **Test recovery process**: Verify it works
4. **Train team**: Share learnings

### Long-term (Within 1 month)

1. **Implement preventive measures**: Fix root cause
2. **Improve backup strategy**: If needed
3. **Conduct DR drill**: Test procedures
4. **Update documentation**: Keep current

---

## DR Testing Schedule

### Monthly
- Test backup restoration
- Verify backup integrity
- Update contact information

### Quarterly
- Full DR drill (in staging)
- Review and update runbook
- Train new team members

### Annually
- Complete infrastructure failover test
- Review and update RTO/RPO targets
- Audit security procedures

---

## Appendix

### Useful Commands

```bash
# Check system health
npm run health-check

# Create backup
npm run backup

# List backups
npm run backup:list

# Database quick check
psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"

# Redis quick check
redis-cli -u $REDIS_URL PING

# Check application logs
tail -f /var/log/app.log

# Check deployment status
# (varies by hosting provider)
```

### Emergency Decision Tree

```
Incident Detected
    ↓
Is service accessible?
    ├─ Yes → Investigate error logs → Fix issue
    └─ No → Is database responding?
            ├─ No → Database Recovery
            └─ Yes → Is application deployed?
                    ├─ No → Redeploy application
                    └─ Yes → Check DNS/CDN
```

---

**END OF RUNBOOK**

**Remember**: Stay calm, follow procedures, document everything.
