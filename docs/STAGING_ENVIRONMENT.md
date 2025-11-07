# Staging Environment Setup Guide

**Version**: 1.0
**Last Updated**: November 6, 2025
**Maintainer**: DevOps Team

---

## Table of Contents

1. [Overview](#overview)
2. [Environment Configuration](#environment-configuration)
3. [Quick Start](#quick-start)
4. [Scripts and Commands](#scripts-and-commands)
5. [Docker Setup](#docker-setup)
6. [Database Setup](#database-setup)
7. [Health Checks](#health-checks)
8. [Deployment](#deployment)
9. [Testing](#testing)
10. [Troubleshooting](#troubleshooting)

---

## Overview

The staging environment is a pre-production environment that mirrors production as closely as possible. It's used for:

- **User Acceptance Testing (UAT)**
- **Integration Testing**
- **Performance Testing**
- **Pre-deployment Validation**
- **Client Demos**

### Key Differences from Production

| Aspect | Production | Staging |
|--------|-----------|---------|
| **Environment** | `production` | `staging` |
| **Database** | Production Neon instance | Staging Neon branch |
| **Redis** | Production Upstash | Staging Upstash |
| **Stripe** | Live mode | Test mode |
| **Email** | Real emails | Test emails |
| **Monitoring** | Full sampling | Full sampling (for testing) |
| **Rate Limiting** | Strict | Permissive |
| **Debug Mode** | Disabled | Enabled |

---

## Environment Configuration

### 1. Create Environment File

```bash
# Copy the staging template
cp .env.staging.example .env.staging

# Edit with your staging credentials
nano .env.staging
```

### 2. Required Environment Variables

```bash
# Core Configuration
NODE_ENV=staging
PUBLIC_SITE_URL=https://staging.yourdomain.com

# Database (Neon Staging Branch)
DATABASE_URL=postgresql://user:pass@staging.neon.tech:5432/staging_db

# Redis (Upstash Staging)
REDIS_URL=redis://default:pass@staging.upstash.io:6379

# Stripe (Test Keys)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Other services...
```

### 3. Optional Configuration

```bash
# Feature Flags
ENABLE_DEBUG_MODE=true
ENABLE_VERBOSE_LOGGING=true

# Testing
SEED_DATABASE=false
ENABLE_TEST_UTILITIES=true

# Backup
BACKUP_DIR=./backups/staging
BACKUP_RETENTION_DAYS=7
BACKUP_RETENTION_COUNT=5
```

---

## Quick Start

### Option 1: Using Scripts

```bash
# Initialize staging environment
npm run staging:init

# Check environment health
npm run staging:health

# Deploy to staging
npm run staging:deploy
```

### Option 2: Using Docker Compose

```bash
# Start staging environment
docker-compose -f docker-compose.staging.yml up -d

# Check status
docker-compose -f docker-compose.staging.yml ps

# View logs
docker-compose -f docker-compose.staging.yml logs -f

# Stop environment
docker-compose -f docker-compose.staging.yml down
```

---

## Scripts and Commands

### Setup Scripts

#### Initialize Staging

```bash
tsx src/scripts/staging-setup.ts init
```

**What it does**:
- ✅ Checks environment variables
- ✅ Verifies database connectivity
- ✅ Runs database migrations
- ✅ Checks Redis connectivity
- ✅ Creates backup directory
- ✅ Verifies external services
- ✅ Sets up monitoring

**Expected output**:
```
🚀 Initializing Staging Environment

1️⃣  Checking Environment Variables...
✅ Environment Variables
   All required environment variables are set

2️⃣  Checking Database Connectivity...
✅ Database Connectivity
   Connected to database: spirituality_staging

...

✅ STAGING ENVIRONMENT READY!
   All setup steps completed successfully.
```

#### Seed Database

```bash
tsx src/scripts/staging-setup.ts seed
```

**What it does**:
- Creates test users
- Creates test products
- Populates sample data

**Use case**: Fresh staging environment needs test data

#### Reset Environment

```bash
tsx src/scripts/staging-setup.ts reset
```

**⚠️ DESTRUCTIVE**: Deletes all staging data

**What it does**:
- Drops all database tables
- Clears Redis cache
- Deletes backups

**Safety checks**:
- Only works when `NODE_ENV=staging`
- Only works on databases with 'staging' or 'test' in name
- 5-second countdown before execution

### Health Check Scripts

#### Run Health Checks

```bash
tsx src/scripts/staging-health.ts
```

**Checks**:
- ✅ Database health and performance
- ✅ Redis health and performance
- ✅ API endpoint health
- ✅ External service configuration
- ✅ Storage and backup setup

**Expected output**:
```
🏥 Staging Environment Health Check

Environment: staging
Overall Status: ✅ HEALTHY

Component Checks:

✅ Database
   Status: healthy
   Message: Database is healthy
   Duration: 156ms

✅ Redis
   Status: healthy
   Message: Redis is healthy
   Duration: 89ms

...
```

#### Watch Mode

```bash
tsx src/scripts/staging-health.ts --watch
```

Runs health checks every 30 seconds.

#### JSON Output

```bash
tsx src/scripts/staging-health.ts --json
```

Outputs health report in JSON format (useful for monitoring tools).

#### Check Specific Component

```bash
tsx src/scripts/staging-health.ts --component=db
tsx src/scripts/staging-health.ts --component=redis
tsx src/scripts/staging-health.ts --component=api
```

### Deployment Scripts

#### Deploy to Staging

```bash
tsx src/scripts/staging-deploy.ts deploy
```

**Steps**:
1. Pre-deployment checks
2. Build application
3. Run tests
4. Deploy to Cloudflare Pages
5. Run smoke tests
6. Record deployment

**Expected output**:
```
🚀 Deploying to Staging Environment

▶️  Pre-deployment checks...
   ✅ Complete (234ms)

▶️  Build application...
   ✅ Complete (15432ms)

...

✅ DEPLOYMENT SUCCESSFUL!
🌐 Staging URL: https://staging.yourdomain.com
```

#### Check Deployment Status

```bash
tsx src/scripts/staging-deploy.ts status
```

Shows latest deployment information and site health.

#### View Deployment Logs

```bash
tsx src/scripts/staging-deploy.ts logs
```

---

## Docker Setup

### Start Staging Environment

```bash
docker-compose -f docker-compose.staging.yml up -d
```

This starts:
- PostgreSQL (port 5433)
- Redis (port 6380)
- Application (port 4322)

### Check Status

```bash
docker-compose -f docker-compose.staging.yml ps
```

### View Logs

```bash
# All services
docker-compose -f docker-compose.staging.yml logs -f

# Specific service
docker-compose -f docker-compose.staging.yml logs -f app-staging
docker-compose -f docker-compose.staging.yml logs -f postgres-staging
```

### Execute Commands

```bash
# Access PostgreSQL
docker-compose -f docker-compose.staging.yml exec postgres-staging psql -U staging_user -d spirituality_staging

# Access Redis
docker-compose -f docker-compose.staging.yml exec redis-staging redis-cli -a staging_redis_password

# Access Application
docker-compose -f docker-compose.staging.yml exec app-staging sh
```

### Stop and Remove

```bash
# Stop
docker-compose -f docker-compose.staging.yml stop

# Stop and remove containers
docker-compose -f docker-compose.staging.yml down

# Stop, remove containers, and delete volumes
docker-compose -f docker-compose.staging.yml down -v
```

---

## Database Setup

### Using Neon Branching

**Recommended approach**: Use Neon database branching

```bash
# Create staging branch from production
neon branches create --name staging --parent main

# Get connection string
neon connection-string staging
```

### Manual Setup

```bash
# Create database
createdb spirituality_staging

# Run migrations
npm run db:migrate

# Seed data (optional)
tsx src/scripts/staging-setup.ts seed
```

### Restore from Production Backup

```bash
# Create backup of production
npm run backup

# Restore to staging
pg_restore -d $STAGING_DATABASE_URL backups/production-latest.dump
```

---

## Health Checks

### Automated Health Checks

Health checks run automatically in CI/CD pipeline:

```yaml
# .github/workflows/staging.yml
- name: Health Check
  run: npm run staging:health
```

### Manual Health Checks

```bash
# Full health check
npm run staging:health

# Database only
tsx src/scripts/staging-health.ts --component=db

# Watch mode
tsx src/scripts/staging-health.ts --watch
```

### Health Check Endpoints

```bash
# Application health
curl https://staging.yourdomain.com/api/health

# Database health
curl https://staging.yourdomain.com/api/health/db

# Redis health
curl https://staging.yourdomain.com/api/health/redis
```

---

## Deployment

### Cloudflare Pages Deployment

Staging deploys automatically on push to `staging` branch:

```bash
# Deploy to staging
git push origin staging
```

### Manual Deployment

```bash
# Using deployment script
npm run staging:deploy

# Using Wrangler
wrangler pages deployment create --branch=staging
```

### Deployment Verification

```bash
# Check deployment status
npm run staging:status

# Run smoke tests
curl https://staging.yourdomain.com/api/health
curl https://staging.yourdomain.com
```

---

## Testing

### Run Tests on Staging

```bash
# All tests
npm test

# Specific test suite
npm test -- tests/staging/

# Integration tests
npm test -- tests/integration/
```

### Smoke Tests

```bash
# After deployment
tsx src/scripts/staging-deploy.ts deploy
# Smoke tests run automatically

# Manual smoke tests
curl https://staging.yourdomain.com/api/health
curl https://staging.yourdomain.com/api/users/me
```

### Load Testing

```bash
# Run load tests against staging
npm run test:load
```

---

## Troubleshooting

### Common Issues

#### Database Connection Fails

**Symptom**: `Cannot connect to database`

**Solutions**:
```bash
# Check DATABASE_URL
echo $DATABASE_URL

# Test connection manually
psql $DATABASE_URL -c "SELECT 1"

# Check database is running (Docker)
docker-compose -f docker-compose.staging.yml ps postgres-staging

# Check logs
docker-compose -f docker-compose.staging.yml logs postgres-staging
```

#### Redis Connection Fails

**Symptom**: `Cannot connect to Redis`

**Solutions**:
```bash
# Check REDIS_URL
echo $REDIS_URL

# Test connection manually
redis-cli -u $REDIS_URL PING

# Check Redis is running (Docker)
docker-compose -f docker-compose.staging.yml ps redis-staging

# Check logs
docker-compose -f docker-compose.staging.yml logs redis-staging
```

#### Application Won't Start

**Symptom**: Application container exits immediately

**Solutions**:
```bash
# Check logs
docker-compose -f docker-compose.staging.yml logs app-staging

# Check environment variables
docker-compose -f docker-compose.staging.yml exec app-staging env | grep NODE_ENV

# Rebuild container
docker-compose -f docker-compose.staging.yml up --build -d app-staging
```

#### Health Checks Fail

**Symptom**: `Health endpoint unreachable`

**Solutions**:
```bash
# Check if application is running
docker-compose -f docker-compose.staging.yml ps

# Check application logs
docker-compose -f docker-compose.staging.yml logs app-staging

# Test locally
curl http://localhost:4322/api/health

# Check firewall/ports
netstat -tulpn | grep 4322
```

### Getting Help

1. **Check Documentation**: Review this guide and related docs
2. **Check Logs**: Application and service logs contain valuable information
3. **Run Health Checks**: Automated health checks identify issues
4. **Contact Team**: Reach out to DevOps team for assistance

---

## Best Practices

### 1. Keep Staging Updated

```bash
# Regularly sync with main branch
git checkout staging
git merge main
git push origin staging
```

### 2. Use Staging for All Changes

- Never deploy directly to production
- Test all changes in staging first
- Verify UAT passes before production

### 3. Monitor Staging Health

```bash
# Regular health checks
npm run staging:health

# Set up alerts for staging failures
```

### 4. Clean Up Regularly

```bash
# Reset staging monthly
tsx src/scripts/staging-setup.ts reset
tsx src/scripts/staging-setup.ts init
```

### 5. Backup Staging Data

```bash
# Create backups
npm run backup

# Test restore process
```

---

## Maintenance

### Weekly Tasks

- [ ] Run health checks
- [ ] Review and clear old data
- [ ] Update dependencies
- [ ] Review staging logs

### Monthly Tasks

- [ ] Full environment reset
- [ ] Performance testing
- [ ] Security scanning
- [ ] Documentation review

---

## Additional Resources

- [Disaster Recovery Runbook](./DISASTER_RECOVERY_RUNBOOK.md)
- [Production Deployment Guide](./PRODUCTION_DEPLOYMENT.md)
- [Database Backup Guide](../log_learn/T155_Database_Backup_Guide.md)
- [Security Best Practices](./SECURITY.md)

---

**Questions or Issues?** Contact the DevOps team or open an issue in the project repository.
