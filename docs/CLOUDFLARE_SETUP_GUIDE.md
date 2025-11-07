# Cloudflare Pages Setup Guide

This guide will walk you through setting up your complete deployment on Cloudflare Pages with all required services.

## Quick Overview

You need to set up 3 services:
1. **Neon** - PostgreSQL database (Free tier)
2. **Upstash** - Redis for sessions (Free tier)
3. **Cloudflare Pages** - Configure environment variables

Total setup time: ~15 minutes

---

## Part 1: Set Up Neon PostgreSQL Database

### Step 1: Create Neon Account
1. Go to [https://neon.tech](https://neon.tech)
2. Click **"Sign Up"** (you can use GitHub login for faster setup)
3. Verify your email if prompted

### Step 2: Create Your Database
1. After login, click **"Create Project"** (or it may auto-create one)
2. **Project settings:**
   - Name: `mystic-ecom-cloud-prod` (or any name you prefer)
   - Region: Choose closest to your users (e.g., US East, EU West)
   - PostgreSQL version: **16** (latest)
3. Click **"Create Project"**

### Step 3: Get Connection String
1. You'll see a **"Connection Details"** panel
2. Look for **"Connection string"** dropdown
3. Select **"Pooled connection"** (recommended for serverless)
4. Copy the connection string - it looks like:
   ```
   postgresql://danribes:AbC123...@ep-cool-name-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
5. **Save this somewhere safe** - you'll need it in a moment

### Step 4: Run Database Migrations
You need to create your database tables. You have two options:

#### Option A: Run SQL Directly in Neon Console
1. In Neon dashboard, click **"SQL Editor"** in the left sidebar
2. Open your local file: `database/schema.sql`
3. Copy the entire contents
4. Paste into Neon SQL Editor
5. Click **"Run"** to execute
6. Repeat for `database/seed.sql` if you want sample data

#### Option B: Run from Your Local Machine (Easier)
```bash
# In your project directory
psql "YOUR_NEON_CONNECTION_STRING" < database/schema.sql
psql "YOUR_NEON_CONNECTION_STRING" < database/seed.sql
```

Replace `YOUR_NEON_CONNECTION_STRING` with the string you copied.

---

## Part 2: Set Up Upstash Redis

### Step 1: Create Upstash Account
1. Go to [https://upstash.com](https://upstash.com)
2. Click **"Login"** (you can use GitHub/Google for faster setup)
3. Create an account

### Step 2: Create Redis Database
1. After login, click **"Create Database"**
2. **Database settings:**
   - Name: `mystic-ecom-cloud-redis` (or any name)
   - Type: **Regional** (cheaper) or **Global** (faster)
   - Region: Choose same or closest to your Neon database
3. Click **"Create"**

### Step 3: Get Redis Credentials
1. Click on your newly created database
2. Scroll down to **"REST API"** section
3. You'll see two values:
   - **UPSTASH_REDIS_REST_URL**: `https://us1-boss-name-12345.upstash.io`
   - **UPSTASH_REDIS_REST_TOKEN**: `AZa1b2C3d4...`
4. **Copy both values** - you'll need them next

---

## Part 3: Generate Session Secret

Run this command in your terminal to generate a secure session secret:

```bash
openssl rand -base64 32
```

Copy the output (looks like: `xK9mP2nQ5rS8tV1wY4zA7bC0dE3fG6hI9jL2mN5oP8qR`)

---

## Part 4: Configure Cloudflare Pages Environment Variables

### Step 1: Navigate to Settings
1. Go to your Cloudflare dashboard: [https://dash.cloudflare.com](https://dash.cloudflare.com)
2. Go to **Workers & Pages** > **mystic-ecom-cloud**
3. Click the **"Settings"** tab at the top

### Step 2: Add Environment Variables
Scroll down to **"Environment variables"** section and click **"Add variable"** or **"Edit variables"**.

Add these variables one by one:

#### Required Variables (For Production)

| Variable Name | Value | Where to Get It |
|---------------|-------|-----------------|
| `DATABASE_URL` | Your Neon connection string | From Neon dashboard (Step 1.3) |
| `REDIS_URL` | Your Upstash REST URL | From Upstash dashboard (Step 2.3) |
| `REDIS_TOKEN` | Your Upstash REST token | From Upstash dashboard (Step 2.3) |
| `SESSION_SECRET` | Generated random string | From Step 3 |
| `NODE_ENV` | `production` | Type manually |
| `BASE_URL` | `https://mystic-ecom-cloud.pages.dev` | Your Cloudflare Pages URL |

#### Stripe Variables (Required for Payments)

| Variable Name | Value | Where to Get It |
|---------------|-------|-----------------|
| `STRIPE_SECRET_KEY` | `sk_live_...` or `sk_test_...` | [Stripe Dashboard](https://dashboard.stripe.com/apikeys) |
| `STRIPE_PUBLISHABLE_KEY` | `pk_live_...` or `pk_test_...` | [Stripe Dashboard](https://dashboard.stripe.com/apikeys) |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | [Stripe Webhooks](https://dashboard.stripe.com/webhooks) |

**For testing:** Use Stripe test keys (`sk_test_...` and `pk_test_...`)
**For production:** Use live keys (`sk_live_...` and `pk_live_...`)

#### Optional Variables (Add if using these features)

| Variable Name | Value | Where to Get It |
|---------------|-------|-----------------|
| `RESEND_API_KEY` | `re_...` | [Resend Dashboard](https://resend.com/api-keys) |
| `EMAIL_FROM` | `noreply@yourdomain.com` | Your email address |
| `ADMIN_EMAIL` | `admin@yourdomain.com` | Your admin email |
| `TWILIO_ACCOUNT_SID` | `AC...` | [Twilio Console](https://console.twilio.com) |
| `TWILIO_AUTH_TOKEN` | Your auth token | [Twilio Console](https://console.twilio.com) |
| `TWILIO_WHATSAPP_FROM` | `whatsapp:+14155238886` | Twilio WhatsApp sandbox |

### Step 3: Select Environment
For each variable, select **"Production"** from the dropdown (or "Both" if you want them in preview deployments too).

### Step 4: Save
Click **"Save"** after adding all variables.

---

## Part 5: Deploy or Redeploy

### Option A: Trigger New Deployment (Recommended)
Push any commit to your GitHub repository:

```bash
# Make a small change (like updating a comment)
echo "# Deployment configured" >> README.md
git add README.md
git commit -m "Trigger Cloudflare deployment with env vars"
git push origin main
```

### Option B: Retry Existing Deployment
1. Go to **"Deployments"** tab
2. Click on your latest deployment (77fbf5f)
3. Click **"Retry deployment"** button
4. Wait for build to complete (~2-3 minutes)

---

## Part 6: Verify Deployment

### Step 1: Check Build Logs
1. Go to **Deployments** tab
2. Click **"View details"** on the latest deployment
3. Check the **"Build logs"** - should show "Success"
4. Check the **"Functions logs"** for any runtime errors

### Step 2: Test Your Site
Visit your site: `https://mystic-ecom-cloud.pages.dev`

**Test these pages:**
1. Home page - Should load without errors
2. Courses page - Should fetch from database
3. Products page - Should show products
4. Login/Register - Should work with database
5. Add item to cart - Should use Redis sessions

### Step 3: Common Issues & Solutions

#### Error: "Database connection failed"
- **Check:** DATABASE_URL is correct in Cloudflare settings
- **Verify:** Neon database is running (check Neon dashboard)
- **Fix:** Make sure connection string includes `?sslmode=require`

#### Error: "Redis connection failed"
- **Check:** REDIS_URL and REDIS_TOKEN are correct
- **Verify:** Upstash database is active (check Upstash dashboard)
- **Fix:** Make sure you're using REST API credentials, not native Redis connection

#### Error: "Session secret not found"
- **Check:** SESSION_SECRET is set in Cloudflare
- **Fix:** Add SESSION_SECRET variable (must be at least 32 characters)

#### Page loads but no data
- **Check:** Database migrations ran successfully
- **Fix:** Run `database/schema.sql` and `database/seed.sql` in Neon SQL Editor

---

## Part 7: Optional - Set Up Custom Domain

### Step 1: Add Custom Domain
1. In Cloudflare Pages settings, go to **"Custom domains"** tab
2. Click **"Set up a custom domain"**
3. Enter your domain (e.g., `mysticecom.com`)
4. Follow DNS instructions

### Step 2: Update BASE_URL
After domain is active:
1. Go to **Settings** > **Environment variables**
2. Update `BASE_URL` to your custom domain: `https://mysticecom.com`
3. Save and redeploy

---

## Summary Checklist

Use this checklist to make sure you've completed everything:

- [ ] Created Neon PostgreSQL database
- [ ] Got Neon connection string (starts with `postgresql://`)
- [ ] Ran database migrations (`schema.sql` and `seed.sql`)
- [ ] Created Upstash Redis database
- [ ] Got Upstash REST URL and token
- [ ] Generated session secret with `openssl rand -base64 32`
- [ ] Added all environment variables in Cloudflare Pages Settings
- [ ] Set variables to "Production" environment
- [ ] Saved environment variables
- [ ] Triggered new deployment (push to GitHub or retry)
- [ ] Checked build logs for success
- [ ] Tested website functionality
- [ ] (Optional) Set up custom domain

---

## Need Help?

**Database Issues:** Check Neon dashboard → SQL Editor → run queries manually
**Redis Issues:** Check Upstash dashboard → Database → Verify status
**Build Issues:** Check Cloudflare → Deployments → View details → Build logs
**Runtime Issues:** Check Cloudflare → Deployments → View details → Functions logs

**Next Steps:** See [SEO_GUIDE.md](SEO_GUIDE.md) for post-deployment SEO configuration.

---

## Quick Reference: Environment Variables

Copy this template for quick reference:

```bash
# Database
DATABASE_URL=postgresql://user:pass@ep-name-123.aws.neon.tech/neondb?sslmode=require

# Redis
REDIS_URL=https://region-name-12345.upstash.io
REDIS_TOKEN=AZa1b2C3d4e5F6g7H8i9J0k...

# Application
SESSION_SECRET=xK9mP2nQ5rS8tV1wY4zA7bC...
NODE_ENV=production
BASE_URL=https://mystic-ecom-cloud.pages.dev

# Stripe (use test keys for testing)
STRIPE_SECRET_KEY=sk_test_or_live...
STRIPE_PUBLISHABLE_KEY=pk_test_or_live...
STRIPE_WEBHOOK_SECRET=whsec_...

# Optional
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@yourdomain.com
ADMIN_EMAIL=admin@yourdomain.com
```
