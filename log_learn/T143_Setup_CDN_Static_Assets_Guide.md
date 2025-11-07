# T143: Setup CDN for Static Assets - Learning Guide

**Topic**: Content Delivery Networks (CDN) for Web Applications
**Level**: Intermediate to Advanced
**Date**: November 5, 2025

---

## Table of Contents

1. [What is a CDN?](#what-is-a-cdn)
2. [Why Use a CDN?](#why-use-a-cdn)
3. [How CDNs Work](#how-cdns-work)
4. [CDN Providers Comparison](#cdn-providers-comparison)
5. [Cache Control Strategies](#cache-control-strategies)
6. [Asset Versioning](#asset-versioning)
7. [Implementation Patterns](#implementation-patterns)
8. [Best Practices](#best-practices)
9. [Common Pitfalls](#common-pitfalls)
10. [Real-World Examples](#real-world-examples)

---

## What is a CDN?

A **Content Delivery Network (CDN)** is a geographically distributed network of servers that work together to deliver web content (images, videos, CSS, JavaScript, etc.) to users based on their geographic location.

### Key Concepts

**Origin Server**: Your main web server where the original content is stored.

**Edge Servers**: CDN servers distributed globally that cache and serve your content.

**Point of Presence (PoP)**: A geographic location where CDN edge servers are hosted.

**Cache**: Temporary storage of content on edge servers.

### Simple Analogy

Think of a CDN like a chain of convenience stores vs. a single warehouse:

- **Without CDN**: Everyone must drive to the single warehouse (origin server) to get products, no matter how far they live.
- **With CDN**: There are convenient stores (edge servers) in every neighborhood, so people can get products nearby.

---

## Why Use a CDN?

### 1. **Faster Load Times**

**Problem**: Users far from your server experience slow page loads.

**Solution**: CDN serves content from the nearest edge server.

**Example**:
```
Without CDN:
User in Tokyo → Server in New York → 200ms latency

With CDN:
User in Tokyo → CDN Server in Tokyo → 10ms latency
```

### 2. **Reduced Bandwidth Costs**

**Problem**: Serving all content from your origin server consumes expensive bandwidth.

**Solution**: CDN caches content, reducing origin server load by 60-95%.

**Savings**:
```
Monthly Bandwidth (without CDN): 10 TB @ $0.10/GB = $1,000
Monthly Bandwidth (with CDN):    2 TB @ $0.10/GB = $200
CDN Cost:                         $300
Total Savings:                    $500/month
```

### 3. **Improved Availability**

**Problem**: Single server can fail or get overwhelmed.

**Solution**: CDN provides redundancy and load distribution.

**Benefits**:
- 99.99% uptime SLA
- DDoS protection
- Automatic failover

### 4. **Better SEO**

**Problem**: Slow websites rank lower in search results.

**Solution**: Faster load times improve search rankings.

**Google's Core Web Vitals**:
- LCP (Largest Contentful Paint) < 2.5s
- FID (First Input Delay) < 100ms
- CLS (Cumulative Layout Shift) < 0.1

### 5. **Enhanced Security**

**Features**:
- DDoS mitigation
- Web Application Firewall (WAF)
- SSL/TLS encryption
- Bot protection

---

## How CDNs Work

### The Request Flow

```
1. User requests image: https://example.com/hero.jpg

2. DNS resolves to CDN edge server (closest to user)

3. Edge server checks cache:
   ├─ HIT: Serves cached image (fast!)
   └─ MISS: Requests from origin server
              ├─ Caches the image
              └─ Serves to user

4. Subsequent requests: Served from cache
```

### Caching Mechanisms

**Time-Based Caching**:
```http
Cache-Control: public, max-age=31536000

Explanation:
- public: Can be cached by browsers and CDN
- max-age=31536000: Cache for 1 year (365 days)
```

**Revalidation**:
```http
Cache-Control: public, max-age=604800, stale-while-revalidate=86400

Explanation:
- max-age=604800: Cache for 1 week
- stale-while-revalidate=86400: Serve stale content for 1 day while fetching fresh
```

### Cache Hierarchy

```
Browser Cache
    ↓
CDN Edge Cache
    ↓
Origin Server
```

Each level caches content to minimize requests to the next level.

---

## CDN Providers Comparison

### 1. **Cloudflare**

**Best For**: Small to medium websites, free tier available

**Pros**:
- ✅ Free plan with unlimited bandwidth
- ✅ Excellent DDoS protection
- ✅ Easy setup (just change DNS)
- ✅ Web Application Firewall (WAF)
- ✅ 200+ data centers globally

**Cons**:
- ❌ Limited cache control on free plan
- ❌ Can't choose specific PoPs

**Pricing**:
- Free: $0/month
- Pro: $20/month
- Business: $200/month
- Enterprise: Custom

**Use Case**:
```typescript
const cdn = new CDNManager({
  provider: 'cloudflare',
  domain: 'cdn.example.com',
  cloudflareZoneId: process.env.CLOUDFLARE_ZONE_ID,
  cloudflareApiToken: process.env.CLOUDFLARE_API_TOKEN,
});
```

---

### 2. **AWS CloudFront**

**Best For**: Enterprise applications, complex configurations

**Pros**:
- ✅ Tight AWS integration (S3, Lambda@Edge)
- ✅ Advanced features (field-level encryption, geoblocking)
- ✅ 400+ PoPs globally
- ✅ Real-time logs and metrics

**Cons**:
- ❌ Complex pricing structure
- ❌ Steeper learning curve
- ❌ More expensive than alternatives

**Pricing**:
- Data Transfer: $0.085/GB (first 10 TB)
- HTTP Requests: $0.0075 per 10,000 requests
- No minimum

**Use Case**:
```typescript
const cdn = new CDNManager({
  provider: 'cloudfront',
  cloudFrontDistributionId: 'E1234567890ABC',
});

// Automatically generates: https://E1234567890ABC.cloudfront.net/
```

---

### 3. **Bunny CDN**

**Best For**: Budget-conscious developers, high performance needs

**Pros**:
- ✅ Very affordable ($0.01/GB in some regions)
- ✅ Great performance
- ✅ Simple pricing
- ✅ Storage + CDN in one

**Cons**:
- ❌ Smaller company (less enterprise support)
- ❌ Fewer features than AWS/Cloudflare

**Pricing**:
- Standard Tier: $0.01 - $0.03/GB depending on region
- No minimum
- Pull zones: Free

**Use Case**:
```typescript
const cdn = new CDNManager({
  provider: 'bunny',
  domain: 'mysite.b-cdn.net',
  bunnyStorageZone: 'my-storage-zone',
  bunnyApiKey: process.env.BUNNY_API_KEY,
});
```

---

### 4. **Fastly**

**Best For**: Real-time content, complex edge logic

**Pros**:
- ✅ Fastest purge times (150ms globally)
- ✅ Powerful edge computing (VCL)
- ✅ Real-time analytics
- ✅ Great for video streaming

**Cons**:
- ❌ Expensive
- ❌ Complex configuration

**Pricing**:
- Pay-as-you-go: $0.12/GB
- Minimum: $50/month

**Use Case**:
```typescript
const cdn = new CDNManager({
  provider: 'fastly',
  domain: 'mysite.fastly.net',
});
```

---

## Cache Control Strategies

### Understanding Cache-Control Headers

```http
Cache-Control: [directives]
```

**Common Directives**:

| Directive | Meaning |
|-----------|---------|
| `public` | Can be cached by browsers and CDN |
| `private` | Only browser can cache (not CDN) |
| `no-cache` | Must revalidate before using cached version |
| `no-store` | Never cache |
| `max-age=N` | Cache for N seconds |
| `immutable` | Never changes, cache forever |
| `stale-while-revalidate=N` | Serve stale while fetching fresh |

---

### Strategy 1: Immutable Assets

**Use For**: Versioned assets that never change

**Example**: `logo.v123.png`, `app.abc123.js`

```typescript
Cache-Control: public, max-age=31536000, immutable

// Our implementation:
const cdn = new CDNManager({
  provider: 'cloudflare',
  cacheStrategies: {
    image: 'immutable',  // 1 year cache
    font: 'immutable',   // 1 year cache
  },
});
```

**Benefits**:
- ✅ Maximum performance
- ✅ Minimum bandwidth
- ✅ Works perfectly with versioning

**When to Use**:
- Assets with hash/version in filename
- Assets that never change

---

### Strategy 2: Standard Caching

**Use For**: Regular assets that change occasionally

```typescript
Cache-Control: public, max-age=604800, stale-while-revalidate=86400

// Our implementation:
const cdn = new CDNManager({
  provider: 'cloudflare',
  cacheStrategies: {
    css: 'standard',    // 1 week cache
    js: 'standard',     // 1 week cache
    video: 'standard',  // 1 week cache
  },
});
```

**Benefits**:
- ✅ Good performance
- ✅ Updates propagate in 1 week
- ✅ Stale-while-revalidate prevents latency

**When to Use**:
- CSS and JavaScript
- Videos
- Audio files

---

### Strategy 3: Short-Term Caching

**Use For**: Dynamic content that changes frequently

```typescript
Cache-Control: public, max-age=3600, stale-while-revalidate=600

// Our implementation:
const cdn = new CDNManager({
  provider: 'cloudflare',
  cacheStrategies: {
    document: 'short',  // 1 hour cache
    other: 'short',     // 1 hour cache
  },
});
```

**Benefits**:
- ✅ Still improves performance
- ✅ Updates propagate quickly
- ✅ Balance between fresh and fast

**When to Use**:
- HTML pages
- API responses
- Documents (PDF, etc.)

---

### Strategy 4: No Cache

**Use For**: Sensitive or always-fresh content

```typescript
Cache-Control: no-cache, no-store, must-revalidate

// Our implementation:
cdn.getCacheControl('document', 'no-cache');
```

**When to Use**:
- User-specific content
- Authenticated pages
- Payment pages
- Real-time data

---

### Strategy 5: Private Cache

**Use For**: User-specific but cacheable content

```typescript
Cache-Control: private, max-age=3600

// Our implementation:
cdn.getCacheControl('document', 'private');
```

**When to Use**:
- User dashboards
- Profile pages
- Personalized content

---

## Asset Versioning

### Why Version Assets?

**Problem**: Cached files don't update when you deploy new code.

```
User has cached: app.js (old version)
You deploy:      app.js (new version with bug fixes)
User still sees: old version (cached for 1 year!)
```

**Solution**: Add version to filename or query string.

---

### Method 1: Query String Versioning

**Approach**: Add version as URL parameter

```typescript
const cdn = new CDNManager({
  provider: 'cloudflare',
  domain: 'cdn.example.com',
  enableVersioning: true,
  assetVersion: 'v1.2.3',
});

cdn.getCDNUrl('/app.js');
// Returns: https://cdn.example.com/app.js?v=v1.2.3
```

**Pros**:
- ✅ Easy to implement
- ✅ No build step required
- ✅ Works with existing files

**Cons**:
- ❌ Some old proxies don't cache query strings
- ❌ Not as clean

---

### Method 2: Content Hash Versioning

**Approach**: Include file hash in URL

```typescript
const cdn = new CDNManager({
  provider: 'cloudflare',
  enableVersioning: true,
});

cdn.getCDNUrl('/app.js', { version: true });
// Returns: https://cdn.example.com/app.js?v=mhmhp0ks (timestamp hash)
```

**Pros**:
- ✅ Automatic invalidation on content change
- ✅ Works with query strings

**Cons**:
- ❌ Hash changes with every build

---

### Method 3: Filename Versioning

**Approach**: Include version/hash in filename

```
app.abc123.js
logo.v2.png
style.sha256.css
```

**Implementation**:
```typescript
// Build process generates versioned filenames
// webpack, vite, parcel do this automatically

// In your code:
<script src={cdnUrl('/app.abc123.js')} />
```

**Pros**:
- ✅ Most reliable (works everywhere)
- ✅ Clean URLs
- ✅ Better for debugging

**Cons**:
- ❌ Requires build tooling
- ❌ Need to update HTML references

---

### Versioning Best Practices

1. **Use Content Hashes for Production**:
```javascript
// webpack.config.js
output: {
  filename: '[name].[contenthash].js',
  chunkFilename: '[name].[contenthash].js',
}
```

2. **Use Git Commit SHA for Deployments**:
```typescript
const cdn = new CDNManager({
  assetVersion: process.env.VERCEL_GIT_COMMIT_SHA || 'dev',
});
```

3. **Combine Versioning with Immutable Caching**:
```typescript
// Versioned assets can be cached forever
cacheStrategies: {
  image: 'immutable',  // Works great with versioning
  css: 'immutable',
  js: 'immutable',
}
```

---

## Implementation Patterns

### Pattern 1: Component-Based Assets

**Astro Component Approach**:

```astro
---
import CDNAsset from '../components/CDNAsset.astro';
---

<!DOCTYPE html>
<html>
<head>
  <!-- Critical CSS from CDN -->
  <CDNAsset src="/styles/critical.css" type="css" preload />

  <!-- Font preload -->
  <CDNAsset src="/fonts/inter-var.woff2" type="font" />
</head>
<body>
  <!-- Hero image from CDN -->
  <CDNAsset
    src="/images/hero.jpg"
    alt="Hero"
    width={1200}
    height={600}
    loading="eager"
  />

  <!-- App JS from CDN -->
  <CDNAsset src="/scripts/app.js" type="js" defer />
</body>
</html>
```

**Benefits**:
- ✅ Type-safe props
- ✅ Automatic URL generation
- ✅ Cache headers set automatically
- ✅ Easy to maintain

---

### Pattern 2: Helper Function Approach

**Simple URL Generation**:

```typescript
import { cdnUrl } from './lib/cdn';

// In your template
const logoUrl = cdnUrl('/logo.png', { version: '2.0.0' });
const cssUrl = cdnUrl('/styles/main.css', { type: 'css' });

<img src={logoUrl} alt="Logo" />
<link rel="stylesheet" href={cssUrl} />
```

**Benefits**:
- ✅ Flexible
- ✅ Works anywhere
- ✅ Simple API

---

### Pattern 3: Middleware Approach

**Automatic CDN Headers**:

```typescript
// middleware.ts
import { getCDN } from './lib/cdn';

export async function onRequest({ request, locals }, next) {
  const response = await next();

  // Add cache headers for assets
  const url = new URL(request.url);
  if (url.pathname.startsWith('/assets/')) {
    const cdn = getCDN();
    const assetType = cdn.getAssetType(url.pathname);
    const cacheControl = cdn.getCacheControl(assetType);

    response.headers.set('Cache-Control', cacheControl);
  }

  return response;
}
```

---

### Pattern 4: Multi-Region Setup

**Geographic Routing**:

```typescript
const cdn = new CDNManager({
  provider: 'cloudflare',
  domain: 'cdn.example.com',
  regions: {
    'us': 'us-cdn.example.com',
    'eu': 'eu-cdn.example.com',
    'asia': 'asia-cdn.example.com',
  },
});

// Detect user region
const userRegion = detectUserRegion(); // 'us', 'eu', 'asia'

// Generate region-specific URL
const url = cdn.getCDNUrl('/hero.jpg', { region: userRegion });
```

**Benefits**:
- ✅ Faster for all users
- ✅ Compliance with data regulations
- ✅ Better performance metrics

---

## Best Practices

### 1. **Use Appropriate Cache Strategies**

```typescript
// ✅ Good: Different strategies for different assets
{
  image: 'immutable',    // Images rarely change
  css: 'standard',       // CSS changes occasionally
  html: 'short',         // HTML changes frequently
  api: 'no-cache',       // API always fresh
}

// ❌ Bad: Same strategy for everything
{
  image: 'no-cache',     // Wastes bandwidth
  css: 'no-cache',       // Slow page loads
  html: 'immutable',     // Users see old content
}
```

---

### 2. **Implement Versioning**

```typescript
// ✅ Good: Enable versioning
const cdn = new CDNManager({
  enableVersioning: true,
  assetVersion: process.env.GIT_COMMIT_SHA,
});

// ❌ Bad: No versioning with long cache
const cdn = new CDNManager({
  enableVersioning: false,  // Users stuck with old files!
  cacheStrategies: { css: 'immutable' },
});
```

---

### 3. **Preload Critical Assets**

```astro
<!-- ✅ Good: Preload critical resources -->
<CDNAsset src="/styles/critical.css" type="css" preload />
<CDNAsset src="/fonts/inter.woff2" type="font" preload />
<CDNAsset src="/scripts/critical.js" type="js" preload />

<!-- ❌ Bad: No preload (slower initial load) -->
<link rel="stylesheet" href="/styles/critical.css" />
```

---

### 4. **Use Fallback Mechanisms**

```typescript
// ✅ Good: Fallback to origin if CDN fails
const cdn = new CDNManager({
  enableFallback: true,
});

cdn.getAssetUrl('/hero.jpg', { fallback: true });
// If CDN fails → returns local path

// ❌ Bad: No fallback
// If CDN is down → site breaks
```

---

### 5. **Monitor CDN Performance**

```typescript
// Regular health checks
const cdn = getCDN();

const result = await cdn.testCDN('/test-asset.jpg');

if (!result.success) {
  console.error(`CDN health check failed: ${result.error}`);
  // Alert your team
  // Switch to fallback
}

console.log(`CDN response time: ${result.responseTime}ms`);
```

---

### 6. **Purge Cache on Deploy**

```typescript
// In your deployment script
import { purgeCDNCache } from './lib/cdn';

// Purge specific files
await purgeCDNCache([
  '/styles/main.css',
  '/scripts/app.js',
]);

// Or purge everything
await purgeCDNCache();
```

---

## Common Pitfalls

### Pitfall 1: Over-Caching Dynamic Content

**Problem**:
```typescript
// ❌ BAD: Caching user-specific content
app.get('/dashboard', (req, res) => {
  res.set('Cache-Control', 'public, max-age=3600');
  res.json({ user: req.user });  // WRONG! Different for each user
});
```

**Solution**:
```typescript
// ✅ GOOD: Use private or no-cache
app.get('/dashboard', (req, res) => {
  res.set('Cache-Control', 'private, max-age=300');
  res.json({ user: req.user });
});
```

---

### Pitfall 2: No Versioning with Long Cache

**Problem**:
```typescript
// ❌ BAD: Users stuck with old version
{
  enableVersioning: false,
  cacheStrategies: { css: 'immutable' },  // Cached for 1 year!
}

// Deploy new CSS → Users don't see it for 1 year
```

**Solution**:
```typescript
// ✅ GOOD: Always use versioning with long cache
{
  enableVersioning: true,
  assetVersion: 'v2.0.0',  // Increment on deploy
  cacheStrategies: { css: 'immutable' },
}
```

---

### Pitfall 3: Forgetting to Purge Cache

**Problem**:
```
Deploy new code → CDN still serves old cached version
Users report bugs that are "already fixed"
```

**Solution**:
```bash
# In your CI/CD pipeline
- name: Deploy
  run: npm run build && npm run deploy

- name: Purge CDN Cache
  run: npm run cdn:purge
```

---

### Pitfall 4: Not Testing CDN Connectivity

**Problem**:
```typescript
// CDN is misconfigured
// Site loads but all images 404
// No monitoring → Don't know until users complain
```

**Solution**:
```typescript
// Add health check endpoint
app.get('/health', async (req, res) => {
  const cdn = getCDN();
  const cdnHealth = await cdn.testCDN();

  res.json({
    status: cdnHealth.success ? 'healthy' : 'degraded',
    cdn: cdnHealth,
  });
});
```

---

### Pitfall 5: Mixing HTTP and HTTPS

**Problem**:
```html
<!-- ❌ MIXED CONTENT WARNING -->
<img src="http://cdn.example.com/logo.png" />
<!-- Page is HTTPS, image is HTTP → Blocked -->
```

**Solution**:
```typescript
// ✅ Always use HTTPS
const protocol = 'https://';  // Never HTTP
return `${protocol}${domain}${path}`;
```

---

## Real-World Examples

### Example 1: E-Commerce Product Images

**Scenario**: Store with 10,000 products, each with 5 images.

**Without CDN**:
- 50,000 images on origin server
- Slow load times internationally
- High bandwidth costs

**With CDN**:
```typescript
const cdn = new CDNManager({
  provider: 'cloudflare',
  domain: 'cdn.mystore.com',
  enableVersioning: true,
  cacheStrategies: {
    image: 'immutable',
  },
});

// Generate product image URLs
const productImages = products.map(p => ({
  url: cdnUrl(`/products/${p.id}/hero.jpg`),
  thumbnail: cdnUrl(`/products/${p.id}/thumb.jpg`),
}));
```

**Results**:
- ⚡ 80% faster load times globally
- 💰 70% reduction in bandwidth costs
- 📈 15% increase in conversion rate

---

### Example 2: SaaS Application Assets

**Scenario**: Global SaaS with users in US, EU, and Asia.

**Implementation**:
```typescript
const cdn = new CDNManager({
  provider: 'cloudfront',
  cloudFrontDistributionId: 'E123456',
  enableVersioning: true,
  assetVersion: process.env.BUILD_NUMBER,
  regions: {
    'us-east-1': 'd111111abcdef8.cloudfront.net',
    'eu-west-1': 'd222222abcdef8.cloudfront.net',
    'ap-southeast-1': 'd333333abcdef8.cloudfront.net',
  },
});

// Automatic region selection
function getUserRegion(userCountry) {
  const regionMap = {
    US: 'us-east-1',
    CA: 'us-east-1',
    GB: 'eu-west-1',
    DE: 'eu-west-1',
    SG: 'ap-southeast-1',
    JP: 'ap-southeast-1',
  };
  return regionMap[userCountry] || 'us-east-1';
}

const region = getUserRegion(user.country);
const appJS = cdnUrl('/app.js', { region });
```

**Results**:
- 🌍 Consistent performance globally
- ⚡ <100ms asset delivery worldwide
- 📊 99.99% uptime

---

### Example 3: Media-Heavy Blog

**Scenario**: Blog with lots of images, videos, and long-form content.

**Implementation**:
```astro
---
import CDNAsset from '../components/CDNAsset.astro';
---

<article>
  <header>
    <!-- Hero image with modern formats -->
    <picture>
      <source srcset={cdnUrl('/blog/post-123.avif')} type="image/avif" />
      <source srcset={cdnUrl('/blog/post-123.webp')} type="image/webp" />
      <CDNAsset
        src="/blog/post-123.jpg"
        alt="Article hero"
        width={1200}
        height={630}
        loading="eager"
      />
    </picture>
  </header>

  <section>
    <!-- Lazy-loaded images -->
    <CDNAsset
      src="/blog/screenshot-1.png"
      alt="Screenshot"
      loading="lazy"
      decoding="async"
    />

    <!-- Video from CDN -->
    <CDNAsset
      src="/blog/tutorial-video.mp4"
      type="video"
      width={800}
      height={450}
    />
  </section>
</article>
```

**Results**:
- 📈 Google PageSpeed Score: 95+
- ⚡ LCP (Largest Contentful Paint): 1.2s
- 💰 Bandwidth savings: $2,000/month

---

## Summary

### Key Takeaways

1. **CDNs dramatically improve performance** by serving content from nearby servers
2. **Choose the right CDN provider** based on your needs (Cloudflare for simplicity, AWS for features, Bunny for cost)
3. **Use appropriate cache strategies** for different asset types
4. **Always version your assets** to prevent cache staleness
5. **Monitor CDN health** to detect issues early
6. **Implement fallbacks** for reliability

### Next Steps

1. ✅ Understand CDN basics
2. ✅ Choose a CDN provider
3. ✅ Implement CDN in your application
4. ✅ Set up cache strategies
5. ✅ Enable asset versioning
6. ✅ Add CDN health monitoring
7. ✅ Optimize based on metrics

---

## Additional Resources

**Official Documentation**:
- [Cloudflare CDN](https://developers.cloudflare.com/cache/)
- [AWS CloudFront](https://docs.aws.amazon.com/cloudfront/)
- [Bunny CDN](https://docs.bunny.net/)
- [Fastly](https://docs.fastly.com/)

**Learning**:
- [MDN: HTTP Caching](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching)
- [Web.dev: Cache Control](https://web.dev/http-cache/)
- [CDN Performance Guide](https://www.cdnplanet.com/guides/)

**Tools**:
- [CDN Performance Test](https://www.cdnperf.com/)
- [WebPageTest](https://www.webpagetest.org/) (test CDN impact)
- [KeyCDN Tools](https://tools.keycdn.com/)

---

**Status**: Ready to implement CDN in your applications! 🚀
