# Cloudflare Pages Deployment Guide

Complete guide for deploying the Spirituality Platform to Cloudflare Pages with Neon PostgreSQL and Upstash Redis.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Pre-Deployment Setup](#pre-deployment-setup)
3. [Database Setup (Neon)](#database-setup-neon)
4. [Redis Setup (Upstash)](#redis-setup-upstash)
5. [Cloudflare Pages Setup](#cloudflare-pages-setup)
6. [Environment Variables](#environment-variables)
7. [Build Configuration](#build-configuration)
8. [Deployment](#deployment)
9. [Post-Deployment](#post-deployment)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

✅ **Required Accounts**:
- GitHub account (for repository)
- Cloudflare account (free tier works)
- Neon account (for PostgreSQL database)
- Upstash account (for Redis)
- Stripe account (for payments)
- Resend account (for emails)

✅ **Local Development**:
- Node.js 20.x installed
- Git installed
- Project tested locally

---

## Pre-Deployment Setup

### 1. Prepare Repository

```bash
# Ensure all changes are committed
git status

# Push to GitHub
git push origin main
```

### 2. Run Pre-Deployment Checks

```bash
# Run deployment validation
npm run deploy:validate

# Build locally to test
npm run build

# Check for errors
npm run astro check
```

### 3. Update Configuration

Update `astro.config.mjs` if needed (already configured to use environment variables).

---

## Database Setup (Neon)

### 1. Create Neon Project

1. Go to https://neon.tech
2. Sign up / Log in
3. Click "Create Project"
4. Choose:
   - **Name**: spirituality-platform-prod
   - **Region**: Choose closest to your users
   - **PostgreSQL Version**: 16 (recommended)
5. Click "Create Project"

### 2. Get Connection String

1. In Neon dashboard, click "Connection Details"
2. Copy the connection string
3. **Important**: It should look like:
   ```
   postgresql://user:password@your-project.neon.tech/main?sslmode=require
   ```
4. Note the `?sslmode=require` at the end (required for security)

### 3. Initialize Database Schema

```bash
# Set your Neon connection string temporarily
export DATABASE_URL="postgresql://user:password@your-project.neon.tech/main?sslmode=require"

# Run migrations (if you have migration scripts)
# npm run db:migrate

# Or import your schema directly
psql $DATABASE_URL < schema.sql
```

**Alternative**: Use the SQL Editor in Neon dashboard to paste your schema.

### 4. Verify Database

```bash
# Test connection
psql $DATABASE_URL -c "SELECT version();"
```

---

## Redis Setup (Upstash)

### 1. Create Upstash Database

1. Go to https://upstash.com
2. Sign up / Log in
3. Click "Create Database"
4. Choose:
   - **Name**: spirituality-platform-prod
   - **Type**: Regional
   - **Region**: Choose closest to your database
   - **TLS**: Enabled (required)
5. Click "Create"

### 2. Get Connection Details

1. Click on your database
2. Go to "Details" tab
3. Copy the connection string
4. **Important**: Use the **Redis URL** format with SSL:
   ```
   rediss://default:password@your-redis.upstash.io:6379
   ```
5. Note the double 's' in `rediss://` (required for SSL)

### 3. Test Connection

```bash
# Install redis-cli if you haven't
# brew install redis (Mac)
# apt-get install redis-tools (Linux)

# Test connection
redis-cli -u "rediss://default:password@your-redis.upstash.io:6379" ping
# Should return: PONG
```

---

## Cloudflare Pages Setup

### 1. Connect Repository

1. Go to https://dash.cloudflare.com
2. Navigate to "Workers & Pages"
3. Click "Create application"
4. Choose "Pages" tab
5. Click "Connect to Git"
6. Select your GitHub repository
7. Click "Begin setup"

### 2. Configure Build Settings

**Build configuration**:
```
Framework preset: Astro
Build command: npm run build
Build output directory: dist
Root directory: (leave empty)
```

### 3. Build Settings Details

```yaml
Build command: npm run build
Build output directory: dist
Node version: 20.11.0
```

---

## Environment Variables

### 1. Navigate to Environment Variables

1. In Cloudflare Pages dashboard
2. Go to your project
3. Click "Settings" → "Environment Variables"

### 2. Add Production Variables

**Required Variables**:

```bash
# Site Configuration
PUBLIC_SITE_URL=https://your-project.pages.dev

# Database (Neon)
DATABASE_URL=postgresql://user:password@your-project.neon.tech/main?sslmode=require

# Redis (Upstash)
REDIS_URL=rediss://default:password@your-redis.upstash.io:6379

# Application
NODE_ENV=production
SESSION_SECRET=<generate-32-char-random-string>

# Stripe
STRIPE_SECRET_KEY=sk_live_<your-key>
STRIPE_PUBLISHABLE_KEY=pk_live_<your-key>
STRIPE_WEBHOOK_SECRET=whsec_<your-secret>

# Email (Resend)
RESEND_API_KEY=re_<your-key>
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=Spirituality Platform

# Security
JWT_SECRET=<generate-32-char-random-string>
CSRF_SECRET=<generate-32-char-random-string>
DOWNLOAD_TOKEN_SECRET=<generate-32-char-random-string>
```

### 3. Generate Secret Keys

Generate random secrets using:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Run this **4 times** to generate all required secrets.

---

## Deployment

### 1. Trigger First Deployment

1. Click "Save and Deploy" in Cloudflare Pages
2. Wait for build to complete (usually 3-5 minutes)
3. Monitor build logs for errors

### 2. Verify Deployment

**Check Health Endpoint**:
```bash
curl https://your-project.pages.dev/api/health
```

---

## Success Checklist

✅ **Deployment is successful when**:

- [ ] Site loads at production URL
- [ ] `/api/health` returns "healthy" status
- [ ] User can register and login
- [ ] Database queries work
- [ ] Redis caching works
- [ ] Email sending works
- [ ] Stripe payments work
- [ ] All pages load without errors
- [ ] SEO meta tags are present
- [ ] Sitemap accessible at `/sitemap.xml`

---

**Deployment Complete!** 🎉
