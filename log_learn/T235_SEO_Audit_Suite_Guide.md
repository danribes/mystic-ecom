# T235: SEO Audit Suite - Learning Guide

**Task ID**: T235
**Topic**: SEO Auditing, Testing, and Automation
**Difficulty**: Intermediate to Advanced
**Prerequisites**: Basic SEO knowledge, HTML, TypeScript, Testing concepts

---

## Table of Contents

1. [Introduction to SEO Auditing](#introduction)
2. [Why Automated SEO Testing Matters](#why-it-matters)
3. [Core SEO Concepts](#core-concepts)
4. [Implementation Deep Dive](#implementation)
5. [Testing Strategy](#testing-strategy)
6. [Best Practices](#best-practices)
7. [Common Mistakes](#common-mistakes)
8. [Real-World Examples](#examples)
9. [How to Use This System](#usage)
10. [Advanced Topics](#advanced)
11. [Resources](#resources)

---

## 1. Introduction to SEO Auditing {#introduction}

### What is SEO Auditing?

SEO auditing is the process of analyzing a website to ensure it follows search engine optimization best practices. An SEO audit checks:

1. **Technical SEO**: Meta tags, structured data, canonical URLs, sitemaps
2. **On-Page SEO**: Content quality, keywords, headers, images
3. **Off-Page SEO**: Backlinks, social signals, brand mentions
4. **Performance**: Page speed, Core Web Vitals, mobile-friendliness

This project (T235) focuses on **Technical SEO** - the foundation that search engines rely on to understand and index your content.

### Why We Built This System

Before T235, SEO validation was:
- ❌ Manual and error-prone
- ❌ No automated checks in CI/CD
- ❌ Risk of regressions going unnoticed
- ❌ Inconsistent across pages
- ❌ No feedback for developers

**T235 provides**:
- ✅ Automated SEO validation
- ✅ CI/CD integration
- ✅ Catch regressions automatically
- ✅ Detailed feedback and scoring
- ✅ Best practices enforcement

---

## 2. Why Automated SEO Testing Matters {#why-it-matters}

### For Search Engines

**SEO is Competitive**:
- Google processes 8.5 billion searches per day
- First organic result gets 28.5% of clicks
- 75% of users never scroll past first page
- Technical SEO is the foundation for ranking

**What Search Engines Need**:
1. **Proper meta tags**: To display in search results
2. **Structured data**: To understand content context
3. **Canonical URLs**: To avoid duplicate content
4. **Sitemaps**: To discover all pages
5. **Mobile-friendly**: To rank in mobile search

### For Developers

**Automated Testing Prevents**:
- Breaking SEO during refactoring
- Deploying pages with missing meta tags
- Invalid structured data
- Incorrect canonical URLs
- robots.txt misconfigurations

**Real Impact**:
- Airbnb: Fixed structured data errors, increased traffic 30%
- Etsy: Improved meta descriptions, gained 50% more clicks
- Pinterest: Added rich snippets, tripled SEO traffic

### For Business

**SEO = Revenue**:
- Organic traffic is free (vs paid ads)
- Higher quality leads (people searching for solutions)
- Long-term compound growth
- Brand visibility and authority

---

## 3. Core SEO Concepts {#core-concepts}

### 3.1 Meta Tags

**What are Meta Tags?**

Meta tags are HTML elements that provide information about a web page to search engines and social media platforms.

```html
<head>
  <title>Page Title</title>
  <meta name="description" content="Page description for search engines" />
  <meta name="keywords" content="seo, meta, tags" />
  <meta name="robots" content="index, follow" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
```

**Why Meta Tags Matter**:
1. **Title**: Shows in search results (most important ranking signal)
2. **Description**: Shows in search snippet (affects click-through rate)
3. **Keywords**: Less important now, but still used
4. **Robots**: Controls crawling and indexing
5. **Viewport**: Essential for mobile SEO

**Optimal Lengths**:
- Title: 50-60 characters (Google displays ~60)
- Description: 150-160 characters (Google displays ~160)
- Keywords: 5-10 relevant keywords

### 3.2 Structured Data (JSON-LD)

**What is Structured Data**?

Structured data is a standardized format to provide information about a page and classify its content. It helps search engines understand context.

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "How to Do SEO Audits",
  "author": {
    "@type": "Person",
    "name": "John Doe"
  },
  "datePublished": "2025-01-06"
}
</script>
```

**Why Structured Data Matters**:
- **Rich Snippets**: Enhanced search results with ratings, images, prices
- **Knowledge Graph**: Inclusion in Google's knowledge panel
- **Voice Search**: Better answers for voice assistants
- **Better CTR**: Rich snippets get 30% higher click-through rates

**Common Schema Types**:
- **WebSite**: For your homepage
- **Organization**: For company information
- **Article**: For blog posts and articles
- **Product**: For e-commerce products
- **Event**: For events and webinars
- **Course**: For online courses

### 3.3 Canonical URLs

**What is a Canonical URL**?

A canonical URL is the preferred version of a web page when multiple versions exist.

```html
<link rel="canonical" href="https://example.com/page/" />
```

**Why Canonical URLs Matter**:

**Problem**: Duplicate content
```
https://example.com/page
https://example.com/page/
https://example.com/page?utm_source=email
http://www.example.com/page
```

All these URLs show the same content, but search engines see them as different pages. This:
- Dilutes ranking signals
- Splits traffic analytics
- Wastes crawl budget
- Confuses search engines

**Solution**: Canonical URL
```html
<link rel="canonical" href="https://example.com/page/" />
```

This tells search engines: "If you see multiple versions, treat this URL as the main one."

**Best Practices**:
- Always use absolute URLs
- Use HTTPS
- Add trailing slashes consistently
- Avoid query parameters
- Avoid fragments (#)

### 3.4 Open Graph (Social SEO)

**What is Open Graph?**

Open Graph is a protocol created by Facebook to control how URLs are displayed when shared on social media.

```html
<meta property="og:title" content="Page Title" />
<meta property="og:description" content="Page description" />
<meta property="og:image" content="https://example.com/image.jpg" />
<meta property="og:url" content="https://example.com/page/" />
<meta property="og:type" content="website" />
```

**Why Open Graph Matters**:
- **Social Sharing**: Controls how links appear on Facebook, LinkedIn, Slack
- **Click-Through**: Better previews = more clicks
- **Brand Control**: Consistent messaging across platforms

**Required Tags**:
- `og:title`: Title (max 60 characters)
- `og:description`: Description (max 160 characters)
- `og:image`: Image (absolute URL, min 1200x630px)
- `og:url`: Canonical URL
- `og:type`: Content type (website, article, product, etc.)

### 3.5 Twitter Cards

**What are Twitter Cards?**

Twitter Cards enhance tweets with rich media when URLs are shared.

```html
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Page Title" />
<meta name="twitter:description" content="Page description" />
<meta name="twitter:image" content="https://example.com/image.jpg" />
```

**Card Types**:
- **summary**: Small image on the side
- **summary_large_image**: Large image above text
- **app**: Mobile app details
- **player**: Video/audio player

**Why Twitter Cards Matter**:
- **Engagement**: Tweets with cards get 150% more retweets
- **Traffic**: Better previews drive more clicks
- **Brand**: Professional appearance on Twitter

### 3.6 Robots.txt

**What is robots.txt?**

A text file that tells search engine crawlers which pages they can or cannot access.

```
User-agent: *
Disallow: /admin/
Disallow: /api/
Allow: /

Sitemap: https://example.com/sitemap.xml
```

**Why robots.txt Matters**:
- **Crawl Budget**: Don't waste time on unimportant pages
- **Privacy**: Prevent indexing of sensitive pages
- **Performance**: Reduce server load from bots
- **Sitemap**: Tell crawlers where to find your sitemap

**Common Directives**:
- `User-agent`: Which bot (*, Googlebot, Bingbot)
- `Disallow`: Paths to block
- `Allow`: Paths to allow (overrides Disallow)
- `Sitemap`: Sitemap location
- `Crawl-delay`: Seconds between requests

### 3.7 Sitemaps

**What is a Sitemap?**

An XML file listing all URLs on your site that search engines should crawl.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/page/</loc>
    <lastmod>2025-01-06</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>
```

**Why Sitemaps Matter**:
- **Discovery**: Help search engines find all pages
- **Crawling**: Prioritize important pages
- **Updates**: Notify of content changes
- **Large Sites**: Essential for sites with 1000+ pages

---

## 4. Implementation Deep Dive {#implementation}

### 4.1 System Architecture

Our SEO audit system has three layers:

```
┌─────────────────────────────────────┐
│   Tests (Vitest)                    │
│   - 69 comprehensive tests          │
│   - Automated CI/CD validation      │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   seo-audit.ts (Validation Logic)   │
│   - Extract meta tags               │
│   - Validate structured data        │
│   - Check canonical URLs            │
│   - Validate OG and Twitter         │
│   - Parse robots.txt                │
│   - Complete audit orchestration    │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   node-html-parser                  │
│   - Fast HTML parsing               │
│   - CSS selector support            │
└─────────────────────────────────────┘
```

### 4.2 Meta Tags Validation

**Extraction**:
```typescript
import { parse } from 'node-html-parser';

export function extractMetaTags(html: string): MetaTag[] {
  const root = parse(html);
  const metaTags: MetaTag[] = [];

  // Find all <meta> tags
  root.querySelectorAll('meta').forEach(meta => {
    const tag: MetaTag = {
      name: meta.getAttribute('name'),
      property: meta.getAttribute('property'),
      content: meta.getAttribute('content'),
    };

    if (tag.name || tag.property) {
      metaTags.push(tag);
    }
  });

  return metaTags;
}
```

**Validation with Scoring**:
```typescript
export function validateMetaTags(html: string): MetaTagsValidation {
  let score = 100;
  const issues: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];

  // Extract title
  const title = root.querySelector('title')?.textContent;

  // Validate title
  if (!title) {
    issues.push('Missing <title> tag');
    score -= 30; // Critical issue
  } else if (title.length < 30) {
    issues.push(`Title too short (${title.length} chars, minimum 30)`);
    score -= 15; // Major issue
  } else if (title.length > 60) {
    warnings.push(`Title too long (${title.length} chars, maximum 60)`);
    score -= 10; // Minor issue
    suggestions.push('Shorten title to 50-60 characters');
  }

  // Calculate final validity
  const isValid = issues.length === 0 && score >= 80;

  return { isValid, score, issues, warnings, suggestions, tags: { title, description, ... } };
}
```

**Penalty System**:
- Missing title: -30 points (critical)
- Missing description: -25 points (critical)
- Title too short: -15 points (major)
- Title too long: -10 points (minor)
- Missing viewport: -5 points (minor)

### 4.3 Structured Data Validation

**Extraction**:
```typescript
export function extractStructuredData(html: string): any[] {
  const root = parse(html);
  const schemas: any[] = [];

  // Find all JSON-LD scripts
  root.querySelectorAll('script[type="application/ld+json"]').forEach(script => {
    try {
      const content = script.textContent?.trim();
      if (content) {
        const data = JSON.parse(content); // Parse JSON
        schemas.push(data);
      }
    } catch (error) {
      // Invalid JSON - will be caught in validation
    }
  });

  return schemas;
}
```

**Validation**:
```typescript
export function validateStructuredData(html: string): StructuredDataValidation {
  let score = 100;
  const schemas: ValidationResult[] = [];

  const scripts = root.querySelectorAll('script[type="application/ld+json"]');

  if (scripts.length === 0) {
    return { isValid: false, score: 0, issues: ['No structured data found'], schemas: [] };
  }

  scripts.forEach((script) => {
    const content = script.textContent?.trim();
    const errors: string[] = [];

    try {
      const data = JSON.parse(content);

      // Validate required properties
      if (!data['@context']) {
        errors.push('Missing @context');
        score -= 10;
      }

      if (!data['@type']) {
        errors.push('Missing @type');
        score -= 10;
      }

      // Type-specific validation
      const type = data['@type'];

      if (type === 'WebSite') {
        if (!data.name) errors.push('WebSite missing "name"');
        if (!data.url) errors.push('WebSite missing "url"');
      } else if (type === 'Article') {
        if (!data.headline) errors.push('Article missing "headline"');
        if (!data.datePublished) errors.push('Article missing "datePublished"');
        if (!data.author) errors.push('Article missing "author"');
      }
      // ... more type validations

      schemas.push({ type: type || 'Unknown', valid: errors.length === 0, data, errors });

    } catch (error) {
      issues.push('Invalid JSON-LD');
      score -= 30;
      schemas.push({ type: 'Invalid', valid: false, data: null, errors: ['JSON parse error'] });
    }
  });

  return { isValid: issues.length === 0 && schemas.every(s => s.valid), score, schemas };
}
```

### 4.4 Complete Audit Orchestration

**Weighted Scoring**:
```typescript
export function auditSEO(html: string, options?: { robotsTxt?: string; url?: string }): SEOAuditResult {
  // Run all validations
  const metaTags = validateMetaTags(html);              // Score: 0-100
  const structuredData = validateStructuredData(html);  // Score: 0-100
  const canonicalUrl = validateCanonicalUrl(html);      // Score: 0-100
  const openGraph = validateOpenGraph(html);            // Score: 0-100
  const twitterCard = validateTwitterCard(html);        // Score: 0-100
  const sitemap = validateSitemap(html, options?.robotsTxt); // Score: 0-100

  // Calculate weighted average
  const scores = [
    { score: metaTags.score, weight: 0.25 },        // 25% - Most important
    { score: structuredData.score, weight: 0.20 },  // 20% - Rich snippets
    { score: canonicalUrl.score, weight: 0.10 },    // 10% - Duplicate content
    { score: openGraph.score, weight: 0.15 },       // 15% - Social sharing
    { score: twitterCard.score, weight: 0.15 },     // 15% - Social sharing
    { score: sitemap.score, weight: 0.10 },         // 10% - Discoverability
  ];

  const totalWeight = scores.reduce((sum, s) => sum + s.weight, 0);
  const weightedScore = scores.reduce((sum, s) => sum + (s.score * s.weight), 0);
  const overallScore = Math.round(weightedScore / totalWeight);

  return {
    score: overallScore,
    metaTags,
    structuredData,
    canonicalUrl,
    openGraph,
    twitterCard,
    sitemap,
    timestamp: new Date().toISOString(),
    url: options?.url,
  };
}
```

**Why Weighted Scores?**

Not all SEO factors are equally important. Meta tags (25%) have more impact than sitemaps (10%) because they directly affect search result appearance and rankings.

---

## 5. Testing Strategy {#testing-strategy}

### 5.1 Test Organization

```typescript
describe('T235: SEO Audit - Meta Tags', () => {
  describe('extractMetaTags', () => {
    it('should extract meta tags from HTML', () => { ... });
    it('should handle empty HTML', () => { ... });
  });

  describe('validateMetaTags', () => {
    it('should pass for valid meta tags', () => { ... });
    it('should fail for missing title', () => { ... });
    it('should warn for title too long', () => { ... });
  });
});
```

**Test Hierarchy**:
1. Main category (Meta Tags, Structured Data, etc.)
2. Function being tested (extractMetaTags, validateMetaTags)
3. Specific behavior (should pass, should fail, should warn)

### 5.2 Test Helper Functions

**Creating Test HTML**:
```typescript
function createTestHTML(options: {
  title?: string;
  description?: string;
  ogTags?: Record<string, string>;
  twitterTags?: Record<string, string>;
  structuredData?: any[];
}): string {
  let html = `<!DOCTYPE html><html><head>`;

  // Add title
  if (options.title) {
    html += `<title>${options.title}</title>`;
  }

  // Add meta tags
  if (options.description) {
    html += `<meta name="description" content="${options.description}" />`;
  }

  // Add OG tags
  if (options.ogTags) {
    Object.entries(options.ogTags).forEach(([key, value]) => {
      html += `<meta property="${key}" content="${value}" />`;
    });
  }

  // Add structured data
  if (options.structuredData) {
    options.structuredData.forEach(data => {
      html += `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
    });
  }

  html += `</head><body></body></html>`;
  return html;
}
```

**Usage in Tests**:
```typescript
it('should pass for valid meta tags', () => {
  const html = createTestHTML({
    title: 'Perfect SEO Title - Test Page',
    description: 'This is a perfect meta description with the right length.',
    keywords: 'seo, test, validation',
  });

  const result = validateMetaTags(html);

  expect(result.isValid).toBe(true);
  expect(result.score).toBeGreaterThanOrEqual(80);
});
```

### 5.3 Arrange-Act-Assert Pattern

Every test follows AAA:

```typescript
it('should fail for missing title', () => {
  // Arrange - Set up test data
  const html = `<html><head><meta name="description" content="Test" /></head></html>`;

  // Act - Execute function
  const result = validateMetaTags(html);

  // Assert - Verify expectations
  expect(result.isValid).toBe(false);
  expect(result.issues).toContain('Missing <title> tag');
  expect(result.score).toBeLessThan(80);
});
```

---

## 6. Best Practices {#best-practices}

### 6.1 Meta Tags

**DO**:
- ✅ Title: 50-60 characters
- ✅ Description: 150-160 characters
- ✅ Include target keywords naturally
- ✅ Make each page unique
- ✅ Include viewport for mobile
- ✅ Use robots meta tag explicitly

**DON'T**:
- ❌ Duplicate titles across pages
- ❌ Keyword stuff
- ❌ Use ALL CAPS
- ❌ Exceed character limits
- ❌ Use generic descriptions ("Welcome to my website")

### 6.2 Structured Data

**DO**:
- ✅ Use appropriate schema types
- ✅ Include all required properties
- ✅ Use https://schema.org as @context
- ✅ Test with Google Rich Results Test
- ✅ Keep data accurate and up-to-date

**DON'T**:
- ❌ Add structured data for content not on page
- ❌ Stuff keywords in structured data
- ❌ Use deprecated schema types
- ❌ Forget required properties
- ❌ Use invalid JSON

### 6.3 Canonical URLs

**DO**:
- ✅ Always use absolute URLs
- ✅ Use HTTPS
- ✅ Add trailing slashes consistently
- ✅ Self-reference canonical (point to itself)
- ✅ Keep canonical simple (no query params)

**DON'T**:
- ❌ Use relative URLs (/page/ vs https://example.com/page/)
- ❌ Include query parameters
- ❌ Include fragments (#section)
- ❌ Change canonical frequently
- ❌ Point to 404 or redirected URLs

### 6.4 Open Graph & Twitter Cards

**DO**:
- ✅ Use high-quality images (min 1200x630px for OG)
- ✅ Use absolute URLs for images
- ✅ Test with Facebook Sharing Debugger
- ✅ Test with Twitter Card Validator
- ✅ Match OG/Twitter data with page content

**DON'T**:
- ❌ Use low-resolution images
- ❌ Use relative image URLs
- ❌ Exceed character limits
- ❌ Use generic images for all pages
- ❌ Include misleading information

### 6.5 Robots.txt

**DO**:
- ✅ Include User-agent directive
- ✅ Add Sitemap directive
- ✅ Use absolute URLs for sitemaps
- ✅ Test with Google Search Console
- ✅ Keep it simple and clear

**DON'T**:
- ❌ Block important pages
- ❌ Use robots.txt for security (use authentication)
- ❌ Forget trailing slashes
- ❌ Use relative sitemap URLs
- ❌ Leave placeholder domains

---

## 7. Common Mistakes {#common-mistakes}

### Mistake #1: Missing Viewport Meta Tag

**Impact**: Site not mobile-friendly, lower mobile rankings

**Wrong**:
```html
<head>
  <title>My Site</title>
</head>
```

**Right**:
```html
<head>
  <title>My Site</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
```

### Mistake #2: Relative Canonical URLs

**Impact**: Search engines can't determine preferred URL

**Wrong**:
```html
<link rel="canonical" href="/page/" />
```

**Right**:
```html
<link rel="canonical" href="https://example.com/page/" />
```

### Mistake #3: Missing Structured Data

**Impact**: No rich snippets, lower CTR, missed opportunities

**Wrong**:
```html
<!-- No structured data -->
```

**Right**:
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Article Title",
  "author": { "@type": "Person", "name": "John Doe" },
  "datePublished": "2025-01-06"
}
</script>
```

### Mistake #4: Duplicate Meta Tags

**Impact**: Confused search engines, inconsistent display

**Wrong**:
```html
<meta name="description" content="First description" />
<meta name="description" content="Second description" />
```

**Right**:
```html
<meta name="description" content="Single, accurate description" />
```

### Mistake #5: Placeholder Sitemap URL in robots.txt

**Impact**: Search engines can't find sitemap

**Wrong**:
```
Sitemap: https://yourdomain.com/sitemap.xml
```

**Right**:
```
Sitemap: https://example.com/sitemap.xml
```

---

## 8. Real-World Examples {#examples}

### Example 1: E-Commerce Product Page

**Complete SEO Setup**:
```html
<head>
  <!-- Meta Tags -->
  <title>Organic Yoga Mat - Eco-Friendly | MyStore</title>
  <meta name="description" content="Buy our premium organic yoga mat. Eco-friendly, non-slip, perfect for hot yoga. Free shipping on orders over $50." />
  <meta name="keywords" content="yoga mat, organic, eco-friendly, non-slip" />

  <!-- Canonical -->
  <link rel="canonical" href="https://mystore.com/products/organic-yoga-mat/" />

  <!-- Open Graph -->
  <meta property="og:title" content="Organic Yoga Mat - Eco-Friendly" />
  <meta property="og:description" content="Premium organic yoga mat. Eco-friendly and non-slip." />
  <meta property="og:image" content="https://mystore.com/images/yoga-mat.jpg" />
  <meta property="og:url" content="https://mystore.com/products/organic-yoga-mat/" />
  <meta property="og:type" content="product" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="Organic Yoga Mat" />
  <meta name="twitter:description" content="Premium organic yoga mat" />
  <meta name="twitter:image" content="https://mystore.com/images/yoga-mat.jpg" />

  <!-- Structured Data -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "Organic Yoga Mat",
    "image": "https://mystore.com/images/yoga-mat.jpg",
    "description": "Premium organic yoga mat for hot yoga",
    "brand": { "@type": "Brand", "name": "MyStore" },
    "offers": {
      "@type": "Offer",
      "price": "79.99",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock"
    }
  }
  </script>
</head>
```

**Audit Result**: Score 100/100 ✅

### Example 2: Blog Article

**Complete SEO Setup**:
```html
<head>
  <!-- Meta Tags -->
  <title>10 Tips for Better Meditation | Mindfulness Blog</title>
  <meta name="description" content="Discover 10 proven tips to improve your meditation practice. Learn breathing techniques, posture tips, and how to stay focused during meditation." />

  <!-- Canonical -->
  <link rel="canonical" href="https://blog.example.com/meditation-tips/" />

  <!-- Open Graph -->
  <meta property="og:title" content="10 Tips for Better Meditation" />
  <meta property="og:description" content="Proven tips to improve your meditation practice" />
  <meta property="og:image" content="https://blog.example.com/images/meditation.jpg" />
  <meta property="og:url" content="https://blog.example.com/meditation-tips/" />
  <meta property="og:type" content="article" />
  <meta property="article:published_time" content="2025-01-06T10:00:00Z" />
  <meta property="article:author" content="Jane Smith" />

  <!-- Structured Data -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "10 Tips for Better Meditation",
    "image": "https://blog.example.com/images/meditation.jpg",
    "datePublished": "2025-01-06T10:00:00Z",
    "author": {
      "@type": "Person",
      "name": "Jane Smith"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Mindfulness Blog",
      "logo": {
        "@type": "ImageObject",
        "url": "https://blog.example.com/logo.png"
      }
    }
  }
  </script>
</head>
```

**Audit Result**: Score 98/100 ✅

---

## 9. How to Use This System {#usage}

### 9.1 Running Tests

```bash
# Run SEO audit tests
npm test -- tests/seo/seo-audit.test.ts

# Run with coverage
npm test -- tests/seo/seo-audit.test.ts --coverage

# Run in watch mode
npm test -- tests/seo/seo-audit.test.ts --watch
```

### 9.2 Using as Import

**Validate Specific Aspects**:
```typescript
import {
  validateMetaTags,
  validateStructuredData,
  validateOpenGraph,
} from '@/scripts/seo-audit';

// Validate meta tags
const metaResult = validateMetaTags(html);
if (!metaResult.isValid) {
  console.log('Meta Tag Issues:', metaResult.issues);
  console.log('Suggestions:', metaResult.suggestions);
}

// Validate structured data
const structuredResult = validateStructuredData(html);
console.log(`Structured Data Score: ${structuredResult.score}/100`);
```

**Complete Audit**:
```typescript
import { auditSEO } from '@/scripts/seo-audit';

const audit = auditSEO(html, {
  robotsTxt: robotsTxtContent,
  url: 'https://example.com/page/',
});

console.log(`Overall SEO Score: ${audit.score}/100`);
console.log(`Meta Tags: ${audit.metaTags.score}/100`);
console.log(`Structured Data: ${audit.structuredData.score}/100`);

if (audit.score < 80) {
  console.log('SEO Issues Found:');
  audit.metaTags.issues.forEach(issue => console.log(`  - ${issue}`));
  audit.structuredData.issues.forEach(issue => console.log(`  - ${issue}`));
}
```

### 9.3 CI/CD Integration

**GitHub Actions**:
```yaml
name: SEO Tests
on: [push, pull_request]

jobs:
  seo-audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm test -- tests/seo/seo-audit.test.ts

      # Fail if tests don't pass
      - name: Check SEO
        run: |
          if [ $? -ne 0 ]; then
            echo "SEO tests failed!"
            exit 1
          fi
```

---

## 10. Advanced Topics {#advanced}

### 10.1 Dynamic Meta Tags

For SPAs or server-rendered pages:

```typescript
// Astro component
---
import SEO from '@/components/SEO.astro';
import { auditSEO } from '@/scripts/seo-audit';

const { title, description } = Astro.props;

// Validate during build
if (import.meta.env.DEV) {
  const testHtml = `
    <head>
      <title>${title}</title>
      <meta name="description" content="${description}" />
    </head>
  `;

  const audit = auditSEO(testHtml);
  if (audit.score < 80) {
    console.warn(`SEO Score: ${audit.score}/100`);
  }
}
---

<SEO title={title} description={description} />
```

### 10.2 Automated Reporting

Generate SEO reports:

```typescript
import { auditSEO } from '@/scripts/seo-audit';
import fs from 'fs';

async function generateSEOReport(urls: string[]) {
  const results = [];

  for (const url of urls) {
    const response = await fetch(url);
    const html = await response.text();
    const audit = auditSEO(html, { url });
    results.push(audit);
  }

  // Generate HTML report
  const report = generateHTMLReport(results);
  fs.writeFileSync('seo-report.html', report);
}
```

### 10.3 Real-Time Monitoring

Monitor SEO in production:

```typescript
// api/seo-check.ts
export async function GET({ request }) {
  const url = new URL(request.url).searchParams.get('url');

  const response = await fetch(url);
  const html = await response.text();

  const audit = auditSEO(html, { url });

  return new Response(JSON.stringify(audit), {
    headers: { 'Content-Type': 'application/json' }
  });
}
```

---

## 11. Resources {#resources}

### Official Guidelines
- [Google Search Central](https://developers.google.com/search)
- [Schema.org Documentation](https://schema.org/)
- [Open Graph Protocol](https://ogp.me/)
- [Twitter Cards Guide](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)

### Tools
- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
- [Twitter Card Validator](https://cards-dev.twitter.com/validator)
- [Google Search Console](https://search.google.com/search-console)

### Further Reading
- [The Art of SEO](https://www.amazon.com/Art-SEO-Mastering-Search-Optimization/dp/1491948965) by Eric Enge
- [SEO 2024](https://www.amazon.com/SEO-2024-optimization-marketing-strategies/dp/1915723078) by Adam Clarke

---

## Key Takeaways

1. **Automated SEO Testing is Essential**: Prevents regressions and ensures consistency
2. **Meta Tags are Foundation**: Title and description directly affect rankings and CTR
3. **Structured Data Enhances Results**: Rich snippets increase visibility and clicks
4. **Canonical URLs Prevent Duplicates**: Consolidates ranking signals
5. **Social SEO Matters**: Open Graph and Twitter Cards drive traffic
6. **Robots.txt and Sitemaps Help Crawling**: Ensures search engines find all content
7. **CI/CD Integration Catches Issues Early**: Automated validation before deployment
8. **Scoring Provides Actionable Feedback**: Know exactly what to fix

---

## Conclusion

SEO auditing is not a one-time task - it's an ongoing process that should be automated and integrated into your development workflow. The T235 SEO Audit Suite provides comprehensive validation of all critical SEO aspects, with detailed feedback, scoring, and CI/CD integration.

By following the best practices in this guide and using the audit system, you'll ensure your pages are optimized for search engines and social platforms, leading to better rankings, more traffic, and higher conversions.

---

**Guide completed**: 2025-11-06
**Maintained by**: Development Team
**Questions?**: Check the implementation log and test log for technical details
