# Core Web Vitals: Complete Learning Guide

**Task:** T145 - Audit and Optimize Core Web Vitals (LCP, FID, CLS)
**Level:** Intermediate to Advanced
**Estimated Reading Time:** 45 minutes

---

## 📚 Table of Contents

1. [Introduction to Web Vitals](#introduction)
2. [Understanding Each Metric](#metrics)
3. [Measurement Techniques](#measurement)
4. [Optimization Strategies](#optimization)
5. [Implementation Guide](#implementation)
6. [Testing and Validation](#testing)
7. [Real-World Examples](#examples)
8. [Common Pitfalls](#pitfalls)
9. [Best Practices](#best-practices)
10. [Resources](#resources)

---

## 🎯 Introduction to Web Vitals {#introduction}

### What Are Web Vitals?

Web Vitals are a set of metrics introduced by Google to measure real-world user experience on the web. They focus on three critical aspects of user experience:

1. **Loading Performance** - How quickly content appears
2. **Interactivity** - How responsive the page is to user input
3. **Visual Stability** - How much the page layout shifts unexpectedly

### Why Do They Matter?

**For Users:**
- Better, faster, more stable web experiences
- Less frustration with slow or janky sites
- Clearer indication of what's happening on the page

**For Developers:**
- Quantifiable metrics to track performance
- Clear targets for optimization efforts
- Industry-standard benchmarks

**For Business:**
- Improved SEO rankings (Google uses Web Vitals as ranking signal)
- Higher conversion rates (faster sites convert better)
- Reduced bounce rates
- Better user retention

### The Core Web Vitals

Google designated three metrics as "Core Web Vitals":

1. **LCP (Largest Contentful Paint)** - Loading performance
2. **FID (First Input Delay)** - Interactivity (being replaced by INP)
3. **CLS (Cumulative Layout Shift)** - Visual stability

These three metrics are considered the most important for user experience.

---

## 📊 Understanding Each Metric {#metrics}

### 1. LCP - Largest Contentful Paint

**Definition:** The time it takes for the largest visible content element to render on the screen.

**What It Measures:**
- How quickly the main content becomes visible
- Perceived loading speed from user's perspective

**Common LCP Elements:**
- Hero images
- Large text blocks
- Video thumbnails
- Background images

**Thresholds:**
```
Good: ≤ 2.5 seconds
Needs Improvement: 2.5 - 4.0 seconds
Poor: > 4.0 seconds
```

**Example Scenario:**
```
User visits an e-commerce product page:
- Hero product image loads at 2.3s → LCP = 2.3s (Good ✅)
- If hero image loads at 4.5s → LCP = 4.5s (Poor ❌)
```

**Why It Matters:**
Users perceive a page as "loaded" when the largest element appears. A fast LCP makes the site feel responsive and snappy.

---

### 2. FID - First Input Delay

**Definition:** The time from when a user first interacts with the page to when the browser can actually respond to that interaction.

**What It Measures:**
- Responsiveness to user input
- How long the browser's main thread is blocked
- Interactivity during page load

**Common Interactions:**
- Clicking a button
- Tapping a link
- Entering text in a form
- Opening a menu

**Thresholds:**
```
Good: ≤ 100 milliseconds
Needs Improvement: 100 - 300 milliseconds
Poor: > 300 milliseconds
```

**Example Scenario:**
```
User clicks "Add to Cart" button:
- Browser responds in 80ms → FID = 80ms (Good ✅)
- Browser responds in 350ms → FID = 350ms (Poor ❌)
```

**Why It Matters:**
When users interact with a page, they expect immediate feedback. Delays create frustration and the perception of a broken site.

**Note:** FID is being replaced by INP (Interaction to Next Paint) which measures all interactions, not just the first one.

---

### 3. CLS - Cumulative Layout Shift

**Definition:** A measure of the largest burst of layout shift scores for every unexpected layout shift that occurs during the page's lifetime.

**What It Measures:**
- Visual stability
- How much content moves around unexpectedly
- Frustrating user experiences from shifting content

**Common Causes:**
- Images without dimensions
- Ads, embeds, or iframes without reserved space
- Web fonts loading and changing text size
- Dynamically injected content

**Thresholds:**
```
Good: ≤ 0.1
Needs Improvement: 0.1 - 0.25
Poor: > 0.25
```

**Example Scenario:**
```
User is about to click "Submit" button:
- Button suddenly shifts down as image loads
- User accidentally clicks ad instead
- CLS score increases → Bad UX
```

**Why It Matters:**
Unexpected layout shifts cause users to lose their place, misclick, or need to re-read content. It's particularly frustrating on mobile devices.

---

### Supporting Metrics

While not "Core" Web Vitals, these metrics provide additional insights:

#### FCP - First Contentful Paint

**Definition:** Time when the first text or image is painted.

**Thresholds:**
```
Good: ≤ 1.8 seconds
Needs Improvement: 1.8 - 3.0 seconds
Poor: > 3.0 seconds
```

**Use Case:** Measures when users first see that the page is loading.

---

#### TTFB - Time to First Byte

**Definition:** Time from navigation start to when the browser receives the first byte of the response.

**Thresholds:**
```
Good: ≤ 800 milliseconds
Needs Improvement: 800 - 1800 milliseconds
Poor: > 1800 milliseconds
```

**Use Case:** Measures server response time and network latency.

---

#### INP - Interaction to Next Paint

**Definition:** Measures the latency of ALL user interactions throughout the page lifecycle.

**Thresholds:**
```
Good: ≤ 200 milliseconds
Needs Improvement: 200 - 500 milliseconds
Poor: > 500 milliseconds
```

**Use Case:** Replacing FID as a more comprehensive interactivity metric.

---

## 🔬 Measurement Techniques {#measurement}

### Browser APIs for Measurement

#### 1. PerformanceObserver API

The modern way to measure Web Vitals using native browser APIs.

**Basic Pattern:**
```javascript
const observer = new PerformanceObserver((list) => {
  const entries = list.getEntries();
  entries.forEach(entry => {
    console.log('Performance entry:', entry);
  });
});

observer.observe({ entryTypes: ['paint', 'largest-contentful-paint', 'layout-shift', 'first-input'] });
```

**Advantages:**
- Native browser support
- Minimal performance overhead
- Real-time measurements
- Accurate timing data

**Browser Support:**
- Chrome 52+
- Firefox 57+
- Safari 11+
- Edge 79+

---

#### 2. Measuring Each Metric

##### TTFB Measurement
```javascript
function measureTTFB() {
  const navigationEntry = performance.getEntriesByType('navigation')[0];
  if (navigationEntry) {
    const ttfb = navigationEntry.responseStart - navigationEntry.requestStart;
    console.log('TTFB:', ttfb, 'ms');
    return ttfb;
  }
}
```

**How It Works:**
1. Get navigation timing entry
2. Calculate time from request to first byte
3. Return duration

---

##### FCP Measurement
```javascript
function measureFCP() {
  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');

    if (fcpEntry) {
      console.log('FCP:', fcpEntry.startTime, 'ms');
      observer.disconnect();
    }
  });

  observer.observe({ entryTypes: ['paint'] });
}
```

**How It Works:**
1. Create observer for paint timing entries
2. Look for 'first-contentful-paint' entry
3. Report startTime value
4. Disconnect after first measurement

---

##### LCP Measurement
```javascript
function measureLCP() {
  let lcpValue = 0;

  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    // The last entry is the largest
    const lastEntry = entries[entries.length - 1];
    lcpValue = lastEntry.startTime;
  });

  observer.observe({ entryTypes: ['largest-contentful-paint'] });

  // Report final value when page lifecycle changes
  ['pagehide', 'beforeunload'].forEach(event => {
    addEventListener(event, () => {
      console.log('LCP:', lcpValue, 'ms');
      observer.disconnect();
    }, { capture: true, once: true });
  });
}
```

**How It Works:**
1. LCP updates as larger elements appear
2. Track the latest (largest) entry
3. Report final value when user leaves page
4. Use page lifecycle events to catch final measurement

**Why Track Changes:**
LCP can change as larger elements load. We need the final value when the page is fully loaded.

---

##### FID Measurement
```javascript
function measureFID() {
  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const fidEntry = entries[0]; // Only one FID per page

    if (fidEntry) {
      const fid = fidEntry.processingStart - fidEntry.startTime;
      console.log('FID:', fid, 'ms');
      observer.disconnect();
    }
  });

  observer.observe({ entryTypes: ['first-input'] });
}
```

**How It Works:**
1. Observe first-input timing
2. Calculate delay from input to processing
3. Report once (FID is measured only once per page)
4. Disconnect observer

**Key Point:**
FID only captures the FIRST interaction. Subsequent interactions are not measured.

---

##### CLS Measurement
```javascript
function measureCLS() {
  let clsValue = 0;

  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries();

    entries.forEach(entry => {
      // Ignore shifts caused by user interaction
      if (!entry.hadRecentInput) {
        clsValue += entry.value;
      }
    });
  });

  observer.observe({ entryTypes: ['layout-shift'] });

  // Report final value on page hide
  addEventListener('pagehide', () => {
    console.log('CLS:', clsValue);
    observer.disconnect();
  }, { capture: true, once: true });
}
```

**How It Works:**
1. Accumulate layout shift scores
2. Ignore shifts caused by user input (e.g., clicking accordion)
3. Report cumulative total on page hide

**Key Point:**
CLS accumulates throughout the page lifecycle. Filter out expected shifts from user interactions.

---

### Rating Calculation

**Algorithm:**
```typescript
function getRating(metricName: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const thresholds = {
    'LCP': { good: 2500, poor: 4000 },
    'FID': { good: 100, poor: 300 },
    'CLS': { good: 0.1, poor: 0.25 },
    // ... other metrics
  };

  const threshold = thresholds[metricName];

  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}
```

**Three-Tier System:**
1. **Good** - Meets recommended threshold
2. **Needs Improvement** - Between good and poor
3. **Poor** - Below acceptable threshold

**Percentile Targeting:**
Google recommends that 75% of page loads should meet the "good" threshold.

---

## 🚀 Optimization Strategies {#optimization}

### LCP Optimization

**Problem Areas:**
1. Slow server response times
2. Render-blocking JavaScript and CSS
3. Slow resource load times
4. Client-side rendering

**Solutions:**

#### 1. Optimize Server Response (TTFB)
```typescript
// Use CDN for static assets
// Enable HTTP/2 or HTTP/3
// Implement edge caching

// Example: Preconnect to required origins
<link rel="preconnect" href="https://cdn.example.com" crossorigin>
```

#### 2. Preload Critical Resources
```typescript
// Preload LCP image
<link rel="preload" as="image" href="/hero.jpg" fetchpriority="high">

// Example usage:
const preloadLink = LCPOptimizations.generateImagePreload('/hero.jpg', 'image/jpeg');
// Returns: <link rel="preload" as="image" href="/hero.jpg" type="image/jpeg" fetchpriority="high">
```

#### 3. Optimize Images
```typescript
// Use modern formats (WebP, AVIF)
<picture>
  <source srcset="/hero.webp" type="image/webp">
  <source srcset="/hero.jpg" type="image/jpeg">
  <img src="/hero.jpg" alt="Hero">
</picture>

// Responsive images with srcset
<img
  srcset="/hero-320.jpg 320w, /hero-640.jpg 640w, /hero-1280.jpg 1280w"
  sizes="100vw"
  src="/hero-640.jpg"
  alt="Hero"
>
```

#### 4. Eliminate Render-Blocking Resources
```typescript
// Defer non-critical JavaScript
<script defer src="/analytics.js"></script>

// Inline critical CSS, defer non-critical
<style>
  /* Critical CSS inline */
</style>
<link rel="preload" href="/styles.css" as="style" onload="this.rel='stylesheet'">

// Helper function:
const isBlocking = LCPOptimizations.isRenderBlocking('script', { src: 'app.js' });
// Returns: true (blocking)

const isBlocking2 = LCPOptimizations.isRenderBlocking('script', { src: 'app.js', defer: 'true' });
// Returns: false (not blocking)
```

#### 5. Use CDN
```typescript
// Serve assets from CDN
const cdnUrl = 'https://cdn.example.com';
const imageUrl = `${cdnUrl}/hero.jpg`;

// Preconnect to CDN
const preconnect = LCPOptimizations.generatePreconnect(cdnUrl);
// Returns: <link rel="preconnect" href="https://cdn.example.com" crossorigin>
```

---

### FID Optimization

**Problem Areas:**
1. Long JavaScript execution tasks
2. Heavy JavaScript bundles
3. Excessive third-party scripts
4. Unoptimized event handlers

**Solutions:**

#### 1. Code Splitting
```typescript
// Split large bundles
// Vite example:
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) return 'vendor';
          if (id.includes('/components/')) return 'components';
        }
      }
    }
  }
};

// Helper function:
const shouldSplit = FIDOptimizations.shouldCodeSplit(fileSize);
// If fileSize > 200KB, returns true
```

#### 2. Break Up Long Tasks
```typescript
// Instead of:
function processLargeDataset(data) {
  data.forEach(item => {
    // Heavy processing (blocks main thread for 500ms)
  });
}

// Do this:
async function processLargeDataset(data) {
  for (let i = 0; i < data.length; i++) {
    // Process item
    await processItem(data[i]);

    // Yield to browser every 50ms
    if (i % 100 === 0) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }
}

// Helper function:
const isLong = FIDOptimizations.isLongTask(duration);
// If duration > 50ms, returns true
```

#### 3. Defer Non-Essential JavaScript
```typescript
// Defer analytics, chat widgets, etc.
const scriptTag = FIDOptimizations.generateDeferScript('/analytics.js');
// Returns: <script defer src="/analytics.js"></script>
```

#### 4. Use Web Workers
```typescript
// Offload heavy computation to worker
const worker = new Worker('/worker.js');

worker.postMessage({ data: largeDataset });

worker.onmessage = (e) => {
  console.log('Result:', e.data);
};
```

#### 5. Optimize Event Handlers
```typescript
// Use passive event listeners
element.addEventListener('touchstart', handler, { passive: true });

// Debounce expensive handlers
function debounce(fn, delay) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

const debouncedHandler = debounce(expensiveHandler, 300);
```

---

### CLS Optimization

**Problem Areas:**
1. Images without dimensions
2. Ads/embeds without reserved space
3. Dynamic content injection
4. Web fonts causing layout shift

**Solutions:**

#### 1. Set Image Dimensions
```typescript
// Always include width and height
<img src="/hero.jpg" width="1920" height="1080" alt="Hero">

// Or use aspect-ratio CSS
<img src="/hero.jpg" style="aspect-ratio: 16/9;" alt="Hero">

// Helper function:
const ratio = CLSOptimizations.calculateAspectRatio(1920, 1080);
// Returns: "16/9"

const css = CLSOptimizations.generateAspectRatioCSS(ratio);
// Returns: "aspect-ratio: 16/9;"
```

#### 2. Reserve Space for Ads/Embeds
```typescript
// Wrapper with min-height
<div style="min-height: 250px;">
  <!-- Ad loads here -->
</div>

// Or use aspect-ratio
<div style="aspect-ratio: 16/9; min-height: 400px;">
  <!-- Embed loads here -->
</div>
```

#### 3. Avoid Inserting Content Above Existing Content
```typescript
// ❌ Bad: Inserts banner above content
function showBanner() {
  const banner = document.createElement('div');
  document.body.prepend(banner); // Shifts all content down
}

// ✅ Good: Use fixed/sticky positioning
function showBanner() {
  const banner = document.createElement('div');
  banner.style.position = 'fixed';
  banner.style.top = '0';
  document.body.appendChild(banner); // Doesn't shift content
}
```

#### 4. Preload Fonts
```typescript
// Preload critical fonts
<link rel="preload" href="/fonts/main.woff2" as="font" type="font/woff2" crossorigin>

// Use font-display: swap
@font-face {
  font-family: 'MyFont';
  src: url('/fonts/main.woff2') format('woff2');
  font-display: swap; /* Prevents layout shift */
}
```

#### 5. Validate Dimensions
```typescript
// Check if element has dimensions before rendering
const element = { width: 1920, height: 1080 };
const hasDimensions = CLSOptimizations.hasDimensions(element);
// Returns: true

const element2 = { width: 0, height: 1080 };
const hasDimensions2 = CLSOptimizations.hasDimensions(element2);
// Returns: false (width is 0)
```

---

## 💻 Implementation Guide {#implementation}

### Step 1: Add Monitoring Component

```astro
---
// src/layouts/Layout.astro
import WebVitalsMonitor from '@/components/WebVitalsMonitor.astro';
---

<!DOCTYPE html>
<html>
  <head>
    <title>My Site</title>
  </head>
  <body>
    <slot />

    <!-- Enable in development -->
    <WebVitalsMonitor
      enabled={import.meta.env.DEV}
      showIndicator={true}
    />
  </body>
</html>
```

**What This Does:**
- Adds real-time monitoring to your site
- Shows visual indicator in development
- Logs metrics to console
- Helps catch performance issues early

---

### Step 2: Generate Reports

```typescript
import { generateVitalsReport, type WebVitalsReport } from '@/lib/webVitals';

// Create report from measurements
const report: WebVitalsReport = {
  url: window.location.href,
  timestamp: Date.now(),
  lcp: { name: 'LCP', value: 2200, rating: 'good' },
  fid: { name: 'FID', value: 85, rating: 'good' },
  cls: { name: 'CLS', value: 0.08, rating: 'good' },
};

// Generate formatted report
const formattedReport = generateVitalsReport(report);
console.log(formattedReport);

/*
Output:
============================================================
🎯 Core Web Vitals Report
============================================================

Overall Score: ✅ 100/100
URL: https://example.com
Timestamp: 2025-11-05T10:30:00.000Z

Core Metrics:
  ✅ LCP: 2200ms (good)
     Target: <2500ms
  ✅ FID: 85ms (good)
     Target: <100ms
  ✅ CLS: 0.080 (good)
     Target: <0.1

Other Metrics:
  ...

✨ All metrics are performing well! No recommendations at this time.
============================================================
*/
```

---

### Step 3: Get Recommendations

```typescript
import { generateRecommendations } from '@/lib/webVitals';

// Report with poor LCP
const report: WebVitalsReport = {
  url: 'https://example.com',
  timestamp: Date.now(),
  lcp: { name: 'LCP', value: 4500, rating: 'poor' },
  cls: { name: 'CLS', value: 0.3, rating: 'poor' },
};

const recommendations = generateRecommendations(report);

recommendations.forEach(rec => {
  console.log(`[${rec.priority.toUpperCase()}] ${rec.metric}`);
  console.log(`Issue: ${rec.issue}`);
  console.log(`Suggestion: ${rec.suggestion}`);
  console.log(`Impact: ${rec.impact}`);
  console.log('---');
});

/*
Output:
[HIGH] LCP
Issue: Largest Contentful Paint is 4500ms
Suggestion: Optimize largest element: preload hero images, use CDN, optimize images, reduce render-blocking resources
Impact: Improves perceived load speed and user experience
---

[HIGH] CLS
Issue: Cumulative Layout Shift score is 0.300
Suggestion: Set explicit dimensions for images/ads, avoid inserting content above existing content, use CSS aspect-ratio
Impact: Prevents unexpected layout shifts and improves visual stability
---
*/
```

---

### Step 4: Calculate Scores

```typescript
import { calculatePageScore } from '@/lib/webVitals';

const report: WebVitalsReport = {
  url: 'https://example.com',
  timestamp: Date.now(),
  lcp: { name: 'LCP', value: 2000, rating: 'good' },       // 100 points
  fid: { name: 'FID', value: 200, rating: 'needs-improvement' }, // 50 points
  cls: { name: 'CLS', value: 0.5, rating: 'poor' },        // 0 points
  fcp: { name: 'FCP', value: 1500, rating: 'good' },       // 100 points
};

const score = calculatePageScore(report);
console.log(`Page Score: ${score}/100`);
// Output: Page Score: 63/100
// Calculation: (100 + 50 + 0 + 100) / 4 = 62.5 → 63
```

---

### Step 5: Use Optimization Helpers

```typescript
import { LCPOptimizations, CLSOptimizations, FIDOptimizations } from '@/lib/webVitals';

// LCP: Preload critical image
const preload = LCPOptimizations.generateImagePreload('/hero.jpg');
document.head.insertAdjacentHTML('beforeend', preload);

// CLS: Calculate aspect ratio
const ratio = CLSOptimizations.calculateAspectRatio(1920, 1080);
const css = CLSOptimizations.generateAspectRatioCSS(ratio);
// Apply to image: style="aspect-ratio: 16/9;"

// FID: Check if task is too long
const taskDuration = 75; // ms
if (FIDOptimizations.isLongTask(taskDuration)) {
  console.warn('Task too long! Consider breaking it up.');
}

// FID: Check if bundle should be split
const bundleSize = 350 * 1024; // 350 KB
if (FIDOptimizations.shouldCodeSplit(bundleSize)) {
  console.warn('Bundle too large! Consider code splitting.');
}
```

---

### Step 6: Custom Performance Monitoring

```typescript
import { PerformanceMonitor } from '@/lib/webVitals';

const monitor = new PerformanceMonitor();

// Mark start of operation
monitor.mark('data-fetch-start');

// ... perform operation ...
await fetchData();

// Mark end
monitor.mark('data-fetch-end');

// Measure duration
const duration = monitor.measure('data-fetch-duration', 'data-fetch-start', 'data-fetch-end');
console.log(`Data fetch took ${duration}ms`);

// Retrieve measurement later
const savedDuration = monitor.getMeasure('data-fetch-duration');
console.log(`Saved: ${savedDuration}ms`);

// Clear all marks
monitor.clear();
```

---

## 🧪 Testing and Validation {#testing}

### Unit Testing

```typescript
import { describe, it, expect } from 'vitest';
import { getRating, calculatePageScore } from '@/lib/webVitals';

describe('Web Vitals', () => {
  it('should calculate correct rating', () => {
    expect(getRating('LCP', 2000)).toBe('good');
    expect(getRating('LCP', 3000)).toBe('needs-improvement');
    expect(getRating('LCP', 5000)).toBe('poor');
  });

  it('should calculate page score', () => {
    const report = {
      url: 'test',
      timestamp: Date.now(),
      lcp: { name: 'LCP', value: 2000, rating: 'good' as const },
      fid: { name: 'FID', value: 80, rating: 'good' as const },
      cls: { name: 'CLS', value: 0.05, rating: 'good' as const },
    };
    expect(calculatePageScore(report)).toBe(100);
  });
});
```

---

### Manual Testing

**Development Testing:**
1. Enable `WebVitalsMonitor` in development
2. Navigate to your pages
3. Check visual indicator in bottom-right
4. Review console logs for detailed metrics

**Production Testing:**
1. Use Chrome DevTools Performance tab
2. Record page load
3. Check Web Vitals panel
4. Analyze timeline for issues

---

### Automated Auditing

```bash
# Run audit script
npx tsx src/scripts/auditWebVitals.ts

# Output:
# 🎯 Core Web Vitals Audit
# ============================================================
# Auditing: https://example.com/
# [Report for each page]
# ============================================================
# 📊 Audit Summary
# Average Score: 87/100
```

---

## 🌍 Real-World Examples {#examples}

### Example 1: E-commerce Product Page

**Scenario:** Product page with large hero image and add-to-cart button

**Issues:**
- LCP: 4.2s (hero image loads slowly)
- FID: 250ms (heavy JavaScript blocks interaction)
- CLS: 0.18 (reviews section shifts when loaded)

**Solutions:**

```astro
---
// src/pages/products/[id].astro
import OptimizedImage from '@/components/OptimizedImage.astro';
---

<html>
  <head>
    <!-- Preconnect to image CDN -->
    <link rel="preconnect" href="https://cdn.example.com" crossorigin>

    <!-- Preload hero image -->
    <link rel="preload" as="image" href="/product-hero.jpg" fetchpriority="high">

    <!-- Defer non-critical scripts -->
    <script defer src="/analytics.js"></script>
  </head>
  <body>
    <!-- Use optimized image component with aspect ratio -->
    <OptimizedImage
      src="/product-hero.jpg"
      alt="Product"
      preset="hero"
      loading="eager"
    />

    <!-- Reserve space for reviews to prevent CLS -->
    <div class="reviews-container" style="min-height: 400px;">
      <!-- Reviews load here -->
    </div>

    <!-- Inline critical CSS, defer the rest -->
    <style>
      .product-info { /* critical styles */ }
    </style>
    <link rel="preload" href="/styles.css" as="style" onload="this.rel='stylesheet'">
  </body>
</html>
```

**Results:**
- LCP: 2.1s (improved from 4.2s) ✅
- FID: 75ms (improved from 250ms) ✅
- CLS: 0.04 (improved from 0.18) ✅

---

### Example 2: Blog Post Page

**Scenario:** Blog with large text content and embedded media

**Issues:**
- FCP: 2.5s (fonts and CSS blocking render)
- CLS: 0.22 (embedded videos shifting content)

**Solutions:**

```astro
<html>
  <head>
    <!-- Preload critical font -->
    <link rel="preload" href="/fonts/main.woff2" as="font" type="font/woff2" crossorigin>

    <!-- Font display swap -->
    <style>
      @font-face {
        font-family: 'Main';
        src: url('/fonts/main.woff2') format('woff2');
        font-display: swap;
      }
    </style>

    <!-- Inline critical CSS -->
    <style>
      .post-content { max-width: 700px; margin: 0 auto; }
    </style>
  </head>
  <body>
    <!-- Video embed with aspect ratio -->
    <div style="aspect-ratio: 16/9; max-width: 100%;">
      <iframe
        width="560"
        height="315"
        src="https://www.youtube.com/embed/..."
        style="width: 100%; height: 100%;"
      ></iframe>
    </div>

    <!-- Images with explicit dimensions -->
    <img
      src="/blog-image.jpg"
      width="700"
      height="400"
      alt="Blog illustration"
      loading="lazy"
    >
  </body>
</html>
```

**Results:**
- FCP: 1.4s (improved from 2.5s) ✅
- CLS: 0.03 (improved from 0.22) ✅

---

### Example 3: Dashboard with Dynamic Content

**Scenario:** Admin dashboard with charts and real-time data

**Issues:**
- FID: 180ms (chart rendering blocks main thread)
- INP: 350ms (slow chart interactions)
- CLS: 0.15 (data tables shifting)

**Solutions:**

```typescript
// Break up long chart rendering task
async function renderChart(data) {
  const chunks = chunkArray(data, 100);

  for (const chunk of chunks) {
    await renderChunk(chunk);

    // Yield to browser
    await new Promise(resolve => setTimeout(resolve, 0));
  }
}

// Use Web Worker for data processing
const worker = new Worker('/data-processor.js');
worker.postMessage({ data: rawData });
worker.onmessage = (e) => {
  updateChart(e.data);
};

// Reserve space for data table
<div class="data-table-container" style="min-height: 600px;">
  <!-- Table loads here -->
</div>
```

**Results:**
- FID: 65ms (improved from 180ms) ✅
- INP: 120ms (improved from 350ms) ✅
- CLS: 0.02 (improved from 0.15) ✅

---

## ⚠️ Common Pitfalls {#pitfalls}

### Pitfall 1: Optimizing for Lab Metrics Only

**Problem:**
```typescript
// Good Lighthouse score in lab, but poor real-world performance
```

**Why It Happens:**
- Lab conditions don't match real users (slow networks, old devices)
- Synthetic testing doesn't capture all user journeys

**Solution:**
- Use Real User Monitoring (RUM)
- Monitor field data in addition to lab data
- Test on real devices and networks

---

### Pitfall 2: Ignoring Above-the-Fold Content

**Problem:**
```astro
<!-- Lazy loading hero image (wrong!) -->
<img src="/hero.jpg" loading="lazy" alt="Hero">
```

**Why It Happens:**
- Applying lazy loading to all images
- Not prioritizing critical content

**Solution:**
```astro
<!-- Eager loading for hero image -->
<img src="/hero.jpg" loading="eager" fetchpriority="high" alt="Hero">

<!-- Lazy loading for below-fold images -->
<img src="/gallery-1.jpg" loading="lazy" alt="Gallery item">
```

---

### Pitfall 3: Not Setting Image Dimensions

**Problem:**
```html
<!-- No dimensions = layout shift -->
<img src="/photo.jpg" alt="Photo">
```

**Why It Happens:**
- Forgetting width/height attributes
- Not understanding CSS aspect-ratio

**Solution:**
```html
<!-- Option 1: width/height attributes -->
<img src="/photo.jpg" width="1200" height="800" alt="Photo">

<!-- Option 2: CSS aspect-ratio -->
<img src="/photo.jpg" style="aspect-ratio: 3/2; width: 100%;" alt="Photo">
```

---

### Pitfall 4: Excessive Third-Party Scripts

**Problem:**
```html
<!-- All loaded synchronously in head -->
<script src="analytics.js"></script>
<script src="chat-widget.js"></script>
<script src="social-share.js"></script>
<script src="ad-network.js"></script>
```

**Why It Happens:**
- Adding scripts without considering performance impact
- Not deferring non-critical scripts

**Solution:**
```html
<!-- Defer non-critical scripts -->
<script defer src="analytics.js"></script>
<script defer src="chat-widget.js"></script>

<!-- Load on interaction -->
<script>
  let chatLoaded = false;
  window.addEventListener('scroll', () => {
    if (!chatLoaded && window.scrollY > 100) {
      loadChatWidget();
      chatLoaded = true;
    }
  }, { once: true });
</script>
```

---

### Pitfall 5: Not Monitoring Continuously

**Problem:**
- Checking Web Vitals once during development
- No ongoing monitoring in production

**Why It Happens:**
- Treating performance as one-time task
- No alerting for regressions

**Solution:**
```typescript
// Enable analytics in production
<WebVitalsMonitor
  enabled={true}
  sendToAnalytics={true}
  analyticsEndpoint="/api/analytics/web-vitals"
  showIndicator={false}
/>

// Set up alerts for poor metrics
if (lcp > 4000) {
  sendAlert('LCP degraded to ' + lcp + 'ms');
}
```

---

## ✅ Best Practices {#best-practices}

### 1. Prioritize Critical Content

```astro
<!-- Preload critical assets -->
<link rel="preload" as="image" href="/hero.jpg" fetchpriority="high">
<link rel="preload" as="font" href="/font.woff2" type="font/woff2" crossorigin>

<!-- Eager load above-the-fold images -->
<img src="/hero.jpg" loading="eager" alt="Hero">

<!-- Lazy load below-the-fold images -->
<img src="/footer.jpg" loading="lazy" alt="Footer">
```

---

### 2. Always Set Dimensions

```astro
<!-- Images -->
<img src="/photo.jpg" width="1200" height="800" alt="Photo">

<!-- Or use aspect-ratio -->
<img src="/photo.jpg" style="aspect-ratio: 3/2;" alt="Photo">

<!-- Embeds -->
<div style="aspect-ratio: 16/9;">
  <iframe src="..."></iframe>
</div>
```

---

### 3. Optimize JavaScript

```typescript
// Code splitting
import(/* webpackChunkName: "analytics" */ './analytics').then(module => {
  module.init();
});

// Break up long tasks
async function processItems(items) {
  for (let i = 0; i < items.length; i++) {
    processItem(items[i]);

    // Yield every 100 items
    if (i % 100 === 0) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }
}

// Defer non-critical scripts
<script defer src="/non-critical.js"></script>
```

---

### 4. Monitor Continuously

```typescript
// Production monitoring
<WebVitalsMonitor
  enabled={true}
  sendToAnalytics={true}
  showIndicator={false}
/>

// Set performance budgets
const budgets = {
  lcp: 2500,
  fid: 100,
  cls: 0.1,
};

// Alert on budget violations
if (metrics.lcp > budgets.lcp) {
  sendAlert('LCP budget exceeded');
}
```

---

### 5. Test on Real Devices

```bash
# Use Lighthouse CI
npm install -g @lhci/cli
lhci autorun

# Test on real devices
# - Use Chrome Remote Debugging
# - Test on slow networks (3G)
# - Test on low-end devices
```

---

## 📚 Resources {#resources}

### Official Documentation
- [Web Vitals](https://web.dev/vitals/)
- [Optimize LCP](https://web.dev/optimize-lcp/)
- [Optimize FID](https://web.dev/optimize-fid/)
- [Optimize CLS](https://web.dev/optimize-cls/)

### Tools
- [PageSpeed Insights](https://pagespeed.web.dev/)
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [WebPageTest](https://www.webpagetest.org/)

### Libraries
- [web-vitals](https://github.com/GoogleChrome/web-vitals) - Official Google library
- [Perfume.js](https://github.com/Zizzamia/perfume.js) - Performance monitoring
- [SpeedCurve](https://speedcurve.com/) - Continuous monitoring

### Learning
- [web.dev](https://web.dev/) - Google's web development resources
- [MDN Web Performance](https://developer.mozilla.org/en-US/docs/Web/Performance)
- [Performance Now conference talks](https://perfnow.nl/)

---

## 🎓 Summary

**Key Takeaways:**

1. **Core Web Vitals measure real user experience**
   - LCP (loading), FID (interactivity), CLS (stability)
   - Target 75th percentile of users

2. **Use native browser APIs for measurement**
   - PerformanceObserver for real-time monitoring
   - Navigation Timing for TTFB
   - Layout Shift API for CLS

3. **Optimization requires holistic approach**
   - Server optimization (TTFB)
   - Asset optimization (images, fonts)
   - JavaScript optimization (code splitting, deferring)
   - Layout stability (dimensions, reserved space)

4. **Monitor continuously**
   - Real User Monitoring in production
   - Automated auditing in CI/CD
   - Performance budgets with alerts

5. **Test on real conditions**
   - Real devices
   - Slow networks
   - Various user journeys

**Next Steps:**
1. Implement monitoring on your site
2. Audit current performance
3. Prioritize high-impact optimizations
4. Monitor and iterate

---

**Happy Optimizing!** 🚀
