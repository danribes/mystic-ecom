# Pre-Deployment Checklist for Cloudflare Pages

Complete this checklist before deploying to production.

---

## Code Quality & Testing

- [ ] All tests passing: `npm test`
- [ ] No TypeScript errors: `npm run astro check`
- [ ] Build succeeds locally: `npm run build`
- [ ] Preview build works: `npm run preview`
- [ ] No console errors in browser
- [ ] All features tested locally

## Security

- [ ] All environment variables use strong, random secrets
- [ ] No `.env` files committed to repository
- [ ] `.gitignore` includes `.env`, `.env.local`, `.env.production`
- [ ] Stripe uses live keys (not test keys)
- [ ] `SESSION_SECRET` is 32+ characters and randomly generated
- [ ] `JWT_SECRET` is 32+ characters and randomly generated
- [ ] `CSRF_SECRET` is 32+ characters and randomly generated
- [ ] `DOWNLOAD_TOKEN_SECRET` is 32+ characters and randomly generated
- [ ] Database connection uses SSL (`?sslmode=require`)
- [ ] Redis connection uses SSL (`rediss://`)
- [ ] Rate limiting configured (already implemented)
- [ ] CORS configured properly (if needed)
- [ ] Security headers configured (already implemented)

## Database (Neon)

- [ ] Neon project created
- [ ] Database schema imported/migrated
- [ ] Connection string tested
- [ ] Connection string includes `?sslmode=require`
- [ ] Database accessible from Cloudflare (test with health check)
- [ ] Indexes created on frequently queried columns
- [ ] Sample data added (if needed)

## Redis (Upstash)

- [ ] Upstash database created
- [ ] Connection tested with `redis-cli`
- [ ] Connection URL uses `rediss://` (SSL)
- [ ] Redis accessible from Cloudflare (test with health check)

## External Services

- [ ] Stripe account configured
- [ ] Stripe webhook endpoint configured
- [ ] Stripe webhook secret matches env var
- [ ] Resend/SendGrid email configured
- [ ] Email sending tested
- [ ] Twilio configured (if using WhatsApp)
- [ ] Sentry DSN configured (error tracking)
- [ ] Google Search Console API configured (if using SEO dashboard)

## Cloudflare Pages

- [ ] Repository connected to Cloudflare Pages
- [ ] Build command set to: `npm run build`
- [ ] Build output directory set to: `dist`
- [ ] Node version set to: `20.11.0`
- [ ] All production environment variables set
- [ ] Preview environment variables set (for staging)
- [ ] Custom domain configured (if applicable)
- [ ] DNS configured (if using custom domain)

## SEO & Performance

- [ ] Sitemap accessible at `/sitemap.xml`
- [ ] robots.txt accessible at `/robots.txt`
- [ ] Sitemap submitted to Google Search Console
- [ ] Sitemap submitted to Bing Webmaster Tools
- [ ] Meta tags present on all pages
- [ ] Open Graph tags working
- [ ] Twitter Cards working
- [ ] Structured data validated (schema.org)
- [ ] Core Web Vitals scores "Good"
- [ ] Images optimized
- [ ] Lazy loading enabled

## Monitoring & Alerts

- [ ] Uptime monitoring configured (UptimeRobot, Pingdom, etc.)
- [ ] `/api/health` endpoint monitored
- [ ] Sentry error tracking active
- [ ] Cloudflare Analytics reviewed
- [ ] Alert thresholds set
- [ ] On-call person designated

## Documentation

- [ ] README.md updated with production info
- [ ] Environment variables documented
- [ ] Deployment process documented
- [ ] Troubleshooting guide reviewed
- [ ] Team trained on deployment process

## Final Checks

- [ ] All changes committed to git
- [ ] All changes pushed to GitHub
- [ ] Feature branches merged to main
- [ ] Changelog updated (if applicable)
- [ ] Version number bumped (if applicable)
- [ ] Backup of database created
- [ ] Rollback plan documented
- [ ] Team notified of deployment

## Post-Deployment

- [ ] Deployment completed successfully
- [ ] Health check returns "healthy"
- [ ] Homepage loads correctly
- [ ] User registration works
- [ ] User login works
- [ ] Payment flow works (test with real card)
- [ ] Email notifications sent
- [ ] Database queries working
- [ ] Redis caching working
- [ ] No errors in Cloudflare logs
- [ ] No errors in Sentry
- [ ] Core Web Vitals checked
- [ ] Mobile experience tested
- [ ] Different browsers tested

---

## Quick Command Reference

```bash
# Test locally
npm test
npm run astro check
npm run build
npm run preview

# Generate secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Test database connection
psql $DATABASE_URL -c "SELECT version();"

# Test Redis connection
redis-cli -u $REDIS_URL ping

# Test health endpoint (after deployment)
curl https://your-project.pages.dev/api/health
```

---

## Common Issues & Solutions

### Build Fails
- Check `package-lock.json` is committed
- Verify Node version (20.11.0)
- Check build logs for specific errors

### Database Connection Fails
- Verify `?sslmode=require` in connection string
- Check database is running in Neon dashboard
- Test connection locally first

### Redis Connection Fails
- Use `rediss://` (double 's') for SSL
- Verify credentials in Upstash dashboard
- Test with redis-cli first

### Environment Variables Not Working
- Check spelling and case sensitivity
- Ensure variables set in Production environment
- Redeploy after adding variables

---

**Ready to Deploy?**

Once all items are checked, proceed with deployment following the [Cloudflare Deployment Guide](docs/CLOUDFLARE_DEPLOYMENT.md).
