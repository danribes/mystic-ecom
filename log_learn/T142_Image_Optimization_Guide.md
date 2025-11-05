# T142: Image Optimization - Complete Learning Guide

**Topic**: Web Image Optimization Techniques
**Level**: Intermediate to Advanced
**Estimated Reading Time**: 45 minutes

## Table of Contents

1. [Introduction to Image Optimization](#introduction)
2. [Why Image Optimization Matters](#why-it-matters)
3. [Lazy Loading Explained](#lazy-loading)
4. [Responsive Images with Srcset](#responsive-images)
5. [WebP Format and Modern Formats](#webp-format)
6. [Layout Shift Prevention](#layout-shift)
7. [Performance Presets](#performance-presets)
8. [Blur Placeholder Technique](#blur-placeholder)
9. [Preloading Critical Images](#preloading)
10. [Implementation Patterns](#implementation-patterns)
11. [Best Practices](#best-practices)
12. [Common Pitfalls](#common-pitfalls)
13. [Performance Monitoring](#performance-monitoring)
14. [Real-World Examples](#real-world-examples)

---

## Introduction to Image Optimization {#introduction}

Images typically account for 50-70% of a web page's total weight. Optimizing images is one of the most effective ways to improve website performance, user experience, and Core Web Vitals scores.

### What is Image Optimization?

Image optimization involves:
1. **Reducing file size** without noticeable quality loss
2. **Loading images efficiently** (lazy loading)
3. **Serving appropriate sizes** for different devices (responsive images)
4. **Using modern formats** (WebP, AVIF)
5. **Preventing layout shifts** (aspect ratio preservation)

### Key Performance Metrics Affected

- **LCP (Largest Contentful Paint)**: Hero images impact this the most
- **CLS (Cumulative Layout Shift)**: Unoptimized images cause layout jumps
- **FID (First Input Delay)**: Heavy images can block the main thread
- **Page Load Time**: Smaller images = faster loading
- **Bandwidth Usage**: Critical for mobile users

---

## Why Image Optimization Matters {#why-it-matters}

### User Experience Impact

```
Unoptimized:
- User waits 5-8 seconds for page to load
- Content jumps around as images load (frustrating!)
- Mobile users consume excess data
- Slow scrolling on mobile devices

Optimized:
- Page loads in 2-3 seconds
- Content stays stable (no layout shifts)
- Minimal data usage
- Smooth scrolling experience
```

### Business Impact

| Metric | Impact | Source |
|--------|--------|--------|
| **1 second delay** | 7% reduction in conversions | Amazon |
| **0.1 second improvement** | 1% increase in revenue | Walmart |
| **53% of mobile users** | Abandon sites that take >3s to load | Google |
| **Page load speed** | Top 3 ranking factors | Google |

### Technical Debt

Without optimization:
- ❌ Poor Core Web Vitals scores
- ❌ Lower search rankings
- ❌ Higher server bandwidth costs
- ❌ Slower development iterations
- ❌ More complex debugging

With optimization:
- ✅ Excellent Core Web Vitals
- ✅ Better SEO rankings
- ✅ Lower hosting costs
- ✅ Faster development
- ✅ Simpler debugging

---

## Lazy Loading Explained {#lazy-loading}

### What is Lazy Loading?

Lazy loading defers loading images until they're about to enter the viewport (user scrolls near them).

### How It Works

```html
<!-- Without lazy loading -->
<img src="image.jpg" alt="Description">
<!-- Browser loads immediately, even if off-screen -->

<!-- With lazy loading -->
<img src="image.jpg" alt="Description" loading="lazy">
<!-- Browser loads only when needed -->
```

### Browser Support

| Browser | Version | Support |
|---------|---------|---------|
| Chrome | 76+ | ✅ Native |
| Firefox | 75+ | ✅ Native |
| Safari | 15.4+ | ✅ Native |
| Edge | 79+ | ✅ Native |

### Benefits

1. **Faster Initial Page Load**
   - Loads only visible images
   - Reduces initial bandwidth by 50-70%

2. **Reduced Server Load**
   - Fewer requests on page load
   - Images load on-demand

3. **Better Mobile Experience**
   - Lower data consumption
   - Faster time to interactive

### Implementation

```astro
---
// Automatic lazy loading
import OptimizedImage from '@/components/OptimizedImage.astro';
---

<!-- First image: eager (above fold) -->
<OptimizedImage src="/hero.jpg" alt="Hero" loading="eager" />

<!-- Other images: lazy (below fold) -->
<OptimizedImage src="/content.jpg" alt="Content" loading="lazy" />

<!-- Auto strategy: first 3 eager, rest lazy -->
{images.map((img, i) => (
  <OptimizedImage src={img.url} alt={img.alt} index={i} loading="auto" />
))}
```

### When NOT to Use Lazy Loading

- ❌ Hero images (above the fold)
- ❌ Logo images
- ❌ First 2-3 content images
- ❌ Critical UI elements

These should use `loading="eager"` for immediate display.

---

## Responsive Images with Srcset {#responsive-images}

### The Problem

```html
<!-- Bad: Same large image for all devices -->
<img src="large-image-2000px.jpg" alt="Photo">
<!--
Desktop (1920px): ✅ Perfect size
Tablet (768px): ❌ Downloads 2x more than needed
Mobile (375px): ❌ Downloads 5x more than needed
-->
```

### The Solution: Srcset

```html
<img
  src="image-800w.jpg"
  srcset="
    image-400w.jpg 400w,
    image-800w.jpg 800w,
    image-1200w.jpg 1200w
  "
  sizes="(max-width: 640px) 100vw, 50vw"
  alt="Responsive image"
>
```

### How Srcset Works

1. **Browser evaluates device width**
   - iPhone 13: 390px physical, 844px viewport
   - iPad: 768px viewport
   - Desktop: 1920px viewport

2. **Browser considers pixel density**
   - Standard display: 1x
   - Retina/HiDPI: 2x or 3x

3. **Browser selects optimal image**
   - iPhone 13 (2x): Downloads 800w image
   - iPad (2x): Downloads 1200w image
   - Desktop (1x): Downloads 800w or 1200w based on viewport

4. **Browser caches selection**
   - Won't download larger image later
   - Optimal for user's device

### Sizes Attribute

Tells browser how much space image will occupy:

```html
sizes="
  (max-width: 640px) 100vw,   /* Mobile: full width */
  (max-width: 1024px) 50vw,   /* Tablet: half width */
  33vw                        /* Desktop: third width */
"
```

### Bandwidth Savings

| Device | Without Srcset | With Srcset | Savings |
|--------|----------------|-------------|---------|
| Mobile | 1.5 MB | 300 KB | **80%** |
| Tablet | 1.5 MB | 600 KB | **60%** |
| Desktop | 1.5 MB | 1.2 MB | **20%** |

### Implementation

```typescript
// Utility function
import { generateSrcset } from '@/lib/imageOptimization';

const srcset = generateSrcset(
  '/images/photo.jpg',
  [400, 800, 1200, 1600],
  80 // quality
);
// Output: "/images/photo-400w.jpg 400w, /images/photo-800w.jpg 800w, ..."
```

```astro
<!-- Component usage -->
<OptimizedImage
  src="/images/photo.jpg"
  alt="Photo"
  widths={[400, 800, 1200]}
  sizes="(max-width: 768px) 100vw, 50vw"
/>
```

---

## WebP Format and Modern Formats {#webp-format}

### Format Comparison

| Format | Size | Quality | Browser Support |
|--------|------|---------|-----------------|
| **JPEG** | 100 KB | Baseline | 99.9% |
| **PNG** | 200 KB | Lossless | 99.9% |
| **WebP** | 65-80 KB | High | 96% |
| **AVIF** | 50-60 KB | Highest | 85% |

### Why WebP?

1. **Smaller File Size**: 25-35% smaller than JPEG
2. **Better Quality**: Higher quality at same file size
3. **Transparency Support**: Like PNG but smaller
4. **Animation Support**: Like GIF but 10x smaller
5. **Broad Support**: Chrome, Firefox, Edge, Safari 14+

### How to Serve WebP

```html
<!-- Picture element with fallback -->
<picture>
  <!-- WebP for modern browsers -->
  <source
    type="image/webp"
    srcset="image-400w.webp 400w, image-800w.webp 800w"
    sizes="100vw"
  >

  <!-- JPEG fallback for older browsers -->
  <source
    type="image/jpeg"
    srcset="image-400w.jpg 400w, image-800w.jpg 800w"
    sizes="100vw"
  >

  <!-- Default img for no-picture support -->
  <img src="image-800w.jpg" alt="Description">
</picture>
```

### Browser Behavior

```
Modern Browser (Chrome 95):
1. Checks <picture> element
2. Finds WebP <source> with type="image/webp"
3. Browser supports WebP → uses WebP srcset
4. Downloads: image-800w.webp (60 KB)

Older Browser (Safari 13):
1. Checks <picture> element
2. Finds WebP <source> → doesn't support WebP
3. Checks next <source> with type="image/jpeg"
4. Browser supports JPEG → uses JPEG srcset
5. Downloads: image-800w.jpg (85 KB)
```

### Implementation

```typescript
// Generate WebP path
import { getWebPPath } from '@/lib/imageOptimization';

const webpPath = getWebPPath('/images/photo.jpg');
// Output: "/images/photo.webp"
```

```astro
<!-- Auto WebP with fallback -->
<OptimizedImage
  src="/images/photo.jpg"
  alt="Photo"
  enableWebP={true}
/>
<!-- Renders <picture> with WebP + JPEG sources -->
```

### Converting Images to WebP

#### Command Line (cwebp)

```bash
# Install
brew install webp  # macOS
apt-get install webp  # Linux

# Convert single image
cwebp -q 80 input.jpg -o output.webp

# Convert all JPEG in folder
for file in *.jpg; do
  cwebp -q 80 "$file" -o "${file%.jpg}.webp"
done
```

#### Node.js (sharp)

```javascript
const sharp = require('sharp');

async function convertToWebP(input, output) {
  await sharp(input)
    .webp({ quality: 80 })
    .toFile(output);
}

convertToWebP('photo.jpg', 'photo.webp');
```

---

## Layout Shift Prevention {#layout-shift}

### What is Layout Shift?

Layout shift occurs when content moves after page load, causing a jarring user experience.

### The Problem

```html
<!-- Image without dimensions -->
<img src="photo.jpg" alt="Photo">

<!-- Browser behavior:
1. Renders page immediately (no space for image)
2. Image downloads
3. Image loads → content shifts down
4. User was reading → loses place (frustrating!)
-->
```

### Solution 1: Explicit Dimensions

```html
<img
  src="photo.jpg"
  alt="Photo"
  width="800"
  height="600"
>
<!-- Browser reserves 800x600px space immediately -->
```

### Solution 2: Aspect Ratio

```html
<img
  src="photo.jpg"
  alt="Photo"
  style="aspect-ratio: 16/9;"
>
<!-- Modern browsers reserve space based on ratio -->
```

### Solution 3: Padding Trick (Compatibility)

```html
<div style="position: relative; padding-bottom: 56.25%; /* 16:9 */">
  <img
    src="photo.jpg"
    alt="Photo"
    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"
  >
</div>
<!-- Works in all browsers -->
```

### Implementation

```astro
<OptimizedImage
  src="/images/photo.jpg"
  alt="Photo"
  aspectRatio="16/9"
  width={800}
  height={450}
/>
<!-- Component handles aspect ratio automatically -->
```

### Calculating Aspect Ratios

```
Landscape: 16/9 = 1.778 (most videos, hero images)
Standard: 4/3 = 1.333 (photos)
Square: 1/1 = 1.000 (avatars, thumbnails)
Portrait: 9/16 = 0.563 (mobile photos)
```

### CLS Score Impact

| Implementation | CLS Score | Result |
|----------------|-----------|--------|
| No dimensions | 0.25 | ❌ Poor |
| With dimensions | 0.05 | ✅ Good |
| With aspect ratio | 0.01 | ✅ Excellent |

---

## Performance Presets {#performance-presets}

### Why Use Presets?

Presets provide **pre-configured settings** for common image types, ensuring consistency and optimal performance.

### Available Presets

#### 1. Hero Preset

```typescript
{
  widths: [640, 768, 1024, 1280, 1536, 1920, 2560],
  sizes: '100vw',
  loading: 'eager',
  fetchpriority: 'high',
  quality: 85
}
```

**Use for**:
- Hero banners
- Header images
- Full-width backgrounds

**Why**:
- Eager loading (critical for LCP)
- High priority (loads first)
- Wide range of sizes
- High quality (visible impact)

#### 2. Card Preset

```typescript
{
  widths: [320, 640, 768],
  sizes: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  loading: 'lazy',
  quality: 80
}
```

**Use for**:
- Course cards
- Product cards
- Event cards

**Why**:
- Lazy loading (below fold)
- Medium sizes (cards aren't huge)
- Responsive sizes (adapts to grid)

#### 3. Thumbnail Preset

```typescript
{
  widths: [150, 300, 450],
  sizes: '(max-width: 640px) 150px, 300px',
  loading: 'lazy',
  quality: 75
}
```

**Use for**:
- Small previews
- Gallery thumbnails
- List item images

**Why**:
- Small sizes only
- Lower quality (imperceptible at small size)
- Fast loading

#### 4. Avatar Preset

```typescript
{
  widths: [48, 96, 144],
  sizes: '48px',
  loading: 'lazy',
  quality: 75
}
```

**Use for**:
- Profile pictures
- User avatars
- Author images

**Why**:
- Tiny sizes (48-144px)
- Fixed size (no responsive needed)
- Low quality acceptable

#### 5. Full Width Preset

```typescript
{
  widths: [640, 768, 1024, 1280, 1536],
  sizes: '100vw',
  loading: 'lazy',
  quality: 85
}
```

**Use for**:
- Full-width content images
- Article images
- Feature images

**Why**:
- Wide range (not as wide as hero)
- Full viewport width
- High quality (prominent)

### Using Presets

```astro
<!-- Simple preset usage -->
<OptimizedImage src="/hero.jpg" alt="Hero" preset="hero" />
<OptimizedImage src="/course.jpg" alt="Course" preset="card" />
<OptimizedImage src="/avatar.jpg" alt="Avatar" preset="avatar" />

<!-- Override preset values -->
<OptimizedImage
  src="/hero.jpg"
  alt="Hero"
  preset="hero"
  quality={90}
  blurPlaceholder={true}
/>
```

---

## Blur Placeholder Technique {#blur-placeholder}

### What is Blur Placeholder?

A low-resolution, blurred version of the image loads first, then fades to the sharp image.

### Visual Effect

```
1. Page loads → Tiny blur SVG appears (instant)
2. Image downloads → In background
3. Image loads → Fade from blur to sharp (smooth)
```

### Implementation

```typescript
function generateBlurPlaceholder(width = 10, height = 10): string {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
      <defs>
        <filter id="blur">
          <feGaussianBlur stdDeviation="2"/>
        </filter>
      </defs>
      <rect width="100%" height="100%" fill="#e5e7eb" filter="url(#blur)"/>
    </svg>
  `;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}
```

### Usage

```astro
<OptimizedImage
  src="/images/hero.jpg"
  alt="Hero"
  blurPlaceholder={true}
/>
```

### Advanced: Real Image Blur

For production, use actual image data:

```javascript
// Generate blur hash server-side
const { encode } = require('blurhash');
const sharp = require('sharp');

async function generateBlurHash(imagePath) {
  const { data, info } = await sharp(imagePath)
    .raw()
    .ensureAlpha()
    .resize(32, 32, { fit: 'inside' })
    .toBuffer({ resolveWithObject: true });

  return encode(
    new Uint8ClampedArray(data),
    info.width,
    info.height,
    4,
    4
  );
}
```

### Benefits

- ✅ Better perceived performance
- ✅ Smoother loading experience
- ✅ Prevents "empty box" feeling
- ✅ Minimal overhead (<1 KB)

---

## Preloading Critical Images {#preloading}

### What is Preloading?

Preloading tells the browser to download critical resources ASAP, before they're discovered in HTML.

### Why Preload Images?

**Without Preload**:
```
1. Browser downloads HTML
2. Browser parses HTML
3. Browser discovers <img> tag
4. Browser starts downloading image
Total: 2-3 seconds to LCP
```

**With Preload**:
```
1. Browser downloads HTML
2. Browser sees <link rel="preload"> in <head>
3. Browser starts downloading image immediately (parallel with HTML parsing)
4. Image ready when <img> tag discovered
Total: 1.5-2 seconds to LCP (30-40% faster)
```

### Implementation

```astro
---
import { generatePreloadConfig } from '@/lib/imageOptimization';

const preloadConfig = generatePreloadConfig({
  src: '/images/hero.jpg',
  alt: 'Hero image',
  fetchpriority: 'high',
  widths: [640, 1024, 1920]
});
---

<html>
  <head>
    <!-- Preload hero image -->
    <link
      rel="preload"
      href={preloadConfig.href}
      as={preloadConfig.as}
      type={preloadConfig.type}
      imagesrcset={preloadConfig.imageSrcset}
      imagesizes={preloadConfig.imageSizes}
      fetchpriority={preloadConfig.fetchpriority}
    />
  </head>
  <body>
    <OptimizedImage
      src="/images/hero.jpg"
      alt="Hero image"
      preset="hero"
    />
  </body>
</html>
```

### When to Preload

**✅ Preload**:
- Hero images (LCP candidates)
- Logo images
- Above-the-fold images

**❌ Don't Preload**:
- Below-the-fold images (use lazy loading)
- Background images (lower priority)
- Multiple images (only preload 1-2)

### Preload vs Eager Loading

```
Preload: Tells browser to download immediately
         Use for: LCP images, critical resources

Eager Loading: Tells browser not to lazy load
              Use for: Above-fold images, important content

Best Practice: Use both together for hero images
<link rel="preload" ...>
<img loading="eager" fetchpriority="high" ...>
```

---

## Implementation Patterns {#implementation-patterns}

### Pattern 1: Simple Image

```astro
<OptimizedImage
  src="/images/photo.jpg"
  alt="Photo description"
/>
```

### Pattern 2: Hero Image

```astro
<OptimizedImage
  src="/images/hero.jpg"
  alt="Hero image"
  preset="hero"
  blurPlaceholder={true}
  class="w-full h-auto"
/>
```

### Pattern 3: Grid of Cards

```astro
<div class="grid grid-cols-3 gap-4">
  {courses.map((course, index) => (
    <div class="card">
      <OptimizedImage
        src={course.imageUrl}
        alt={course.title}
        preset="card"
        index={index}
        loading="auto"
        aspectRatio="16/9"
      />
    </div>
  ))}
</div>
```

### Pattern 4: Avatar List

```astro
<div class="flex gap-2">
  {users.map(user => (
    <OptimizedImage
      src={user.avatar}
      alt={user.name}
      preset="avatar"
      class="rounded-full"
    />
  ))}
</div>
```

### Pattern 5: External CDN Image

```astro
<OptimizedImage
  src="https://cdn.example.com/image.jpg"
  alt="CDN image"
  widths={[640, 1024]}
  quality={85}
/>
<!-- Generates: ?w=640&q=85, ?w=1024&q=85 -->
```

---

## Best Practices {#best-practices}

### 1. Always Provide Alt Text

```astro
<!-- ❌ Bad -->
<OptimizedImage src="/photo.jpg" alt="" />

<!-- ✅ Good -->
<OptimizedImage src="/photo.jpg" alt="Sunset over mountains" />
```

### 2. Use Appropriate Presets

```astro
<!-- ❌ Bad: Using hero preset for thumbnail -->
<OptimizedImage src="/thumb.jpg" alt="Thumb" preset="hero" />

<!-- ✅ Good -->
<OptimizedImage src="/thumb.jpg" alt="Thumb" preset="thumbnail" />
```

### 3. Set Aspect Ratios

```astro
<!-- ❌ Bad: No aspect ratio -->
<OptimizedImage src="/photo.jpg" alt="Photo" />

<!-- ✅ Good -->
<OptimizedImage
  src="/photo.jpg"
  alt="Photo"
  aspectRatio="16/9"
/>
```

### 4. Preload Critical Images

```astro
<!-- ✅ Preload hero image -->
<link rel="preload" href="/hero.jpg" as="image" fetchpriority="high" />
```

### 5. Use Eager Loading Above Fold

```astro
<!-- ✅ Hero: eager -->
<OptimizedImage src="/hero.jpg" alt="Hero" loading="eager" />

<!-- ✅ Below fold: lazy -->
<OptimizedImage src="/content.jpg" alt="Content" loading="lazy" />
```

### 6. Optimize Quality Settings

```typescript
// Hero images: high quality (85-90)
preset: 'hero', quality: 85

// Cards: medium quality (75-80)
preset: 'card', quality: 80

// Thumbnails: lower quality (70-75)
preset: 'thumbnail', quality: 75
```

### 7. Test on Real Devices

- ✅ Test on actual mobile devices
- ✅ Test on slow 3G connection
- ✅ Test with browser DevTools throttling
- ✅ Check Core Web Vitals

---

## Common Pitfalls {#common-pitfalls}

### 1. Lazy Loading Hero Images

```astro
<!-- ❌ Bad: Hero image lazy loads (slow LCP) -->
<OptimizedImage src="/hero.jpg" alt="Hero" loading="lazy" />

<!-- ✅ Good: Hero image eager loads -->
<OptimizedImage src="/hero.jpg" alt="Hero" loading="eager" />
```

**Impact**: LCP delayed by 1-2 seconds

### 2. Missing Aspect Ratios

```astro
<!-- ❌ Bad: Layout shifts -->
<OptimizedImage src="/photo.jpg" alt="Photo" />

<!-- ✅ Good: Stable layout -->
<OptimizedImage src="/photo.jpg" alt="Photo" aspectRatio="16/9" />
```

**Impact**: High CLS scores (poor UX)

### 3. Over-Optimizing Quality

```astro
<!-- ❌ Bad: Visible quality loss -->
<OptimizedImage src="/hero.jpg" alt="Hero" quality={40} />

<!-- ✅ Good: Balanced quality -->
<OptimizedImage src="/hero.jpg" alt="Hero" quality={85} />
```

**Impact**: Blurry, pixelated images

### 4. Too Many Widths

```astro
<!-- ❌ Bad: 15 widths = complex -->
widths={[200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 1300, 1400, 1500, 1600]}

<!-- ✅ Good: 5-7 widths = sufficient -->
widths={[320, 640, 1024, 1280, 1920]}
```

**Impact**: Marginal gains, added complexity

### 5. Not Testing Mobile

```
Desktop looks great! ✅
Mobile downloads 2MB hero image on 3G ❌
```

**Solution**: Always test mobile first

---

## Performance Monitoring {#performance-monitoring}

### Core Web Vitals

#### LCP (Largest Contentful Paint)

**Target**: < 2.5 seconds

**Optimization**:
- Preload hero image
- Use eager loading
- Optimize image size
- Use CDN

#### CLS (Cumulative Layout Shift)

**Target**: < 0.1

**Optimization**:
- Set aspect ratios
- Use width/height attributes
- Reserve space for images

#### FID (First Input Delay)

**Target**: < 100ms

**Optimization**:
- Lazy load below-fold images
- Reduce main thread work
- Defer non-critical scripts

### Tools

1. **Lighthouse** (Chrome DevTools)
   ```bash
   # Run audit
   lighthouse https://yoursite.com --view
   ```

2. **PageSpeed Insights**
   ```
   https://pagespeed.web.dev/
   ```

3. **WebPageTest**
   ```
   https://www.webpagetest.org/
   ```

4. **Chrome DevTools Performance**
   - Record page load
   - Analyze LCP element
   - Check network waterfall

### Metrics to Track

| Metric | Target | Tool |
|--------|--------|------|
| LCP | < 2.5s | Lighthouse |
| CLS | < 0.1 | Lighthouse |
| FID | < 100ms | Lighthouse |
| Image Size | < 200 KB | Network tab |
| Image Count | < 50 | Network tab |

---

## Real-World Examples {#real-world-examples}

### Example 1: Course Listing Page

**Before**:
- 50 course cards
- 50 images load immediately
- Total: 8 MB downloaded
- Load time: 8 seconds

**After**:
- 50 course cards
- First 3 load immediately
- Rest lazy load
- WebP format
- Total: 1.5 MB initial
- Load time: 2 seconds

**Code**:
```astro
{courses.map((course, index) => (
  <CourseCard course={course}>
    <OptimizedImage
      src={course.imageUrl}
      alt={course.title}
      preset="card"
      index={index}
      loading="auto"
      aspectRatio="16/9"
    />
  </CourseCard>
))}
```

### Example 2: Homepage Hero

**Before**:
- 2 MB hero image
- No preload
- LCP: 4.5 seconds

**After**:
- 600 KB WebP hero
- Preloaded
- LCP: 1.8 seconds

**Code**:
```astro
---
const preload = generatePreloadConfig({
  src: '/images/hero.jpg',
  alt: 'Hero',
  fetchpriority: 'high'
});
---

<head>
  <link rel="preload" {...preload} />
</head>

<OptimizedImage
  src="/images/hero.jpg"
  alt="Hero"
  preset="hero"
  blurPlaceholder={true}
/>
```

### Example 3: User Avatar Grid

**Before**:
- 100 avatars
- Each 500 KB
- Total: 50 MB

**After**:
- 100 avatars
- Each 15 KB (WebP)
- Total: 1.5 MB

**Code**:
```astro
<div class="grid grid-cols-10">
  {users.map(user => (
    <OptimizedImage
      src={user.avatar}
      alt={user.name}
      preset="avatar"
      class="rounded-full"
    />
  ))}
</div>
```

---

## Summary

### Key Takeaways

1. ✅ **Lazy load** images below the fold
2. ✅ **Use responsive images** with srcset
3. ✅ **Serve WebP** with JPEG/PNG fallback
4. ✅ **Set aspect ratios** to prevent layout shift
5. ✅ **Preload critical images** (hero, logo)
6. ✅ **Use appropriate presets** for consistency
7. ✅ **Test on real devices** and connections

### Performance Impact

- **20-35% smaller images** (WebP)
- **50-70% fewer requests** (lazy loading)
- **31% faster LCP** (preload + optimization)
- **87% less CLS** (aspect ratio)

### Next Steps

1. Audit current images
2. Apply OptimizedImage to components
3. Measure before/after metrics
4. Monitor Core Web Vitals
5. Iterate and improve

---

## Additional Resources

- [Web.dev Image Optimization](https://web.dev/fast/#optimize-your-images)
- [MDN Responsive Images](https://developer.mozilla.org/en-US/docs/Learn/HTML/Multimedia_and_embedding/Responsive_images)
- [WebP Documentation](https://developers.google.com/speed/webp)
- [Core Web Vitals](https://web.dev/vitals/)
- [Lighthouse Performance Scoring](https://web.dev/performance-scoring/)

---

**Guide Version**: 1.0
**Last Updated**: November 5, 2025
**Difficulty**: Intermediate to Advanced
