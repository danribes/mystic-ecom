# T234: Image SEO Optimization - Learning Guide

**Task ID**: T234
**Topic**: Image SEO - Alt Text, File Names, and Size Optimization
**Difficulty**: Intermediate
**Prerequisites**: Basic SEO knowledge, HTML, TypeScript

---

## Table of Contents

1. [Introduction to Image SEO](#introduction)
2. [Why Image SEO Matters](#why-it-matters)
3. [Core Concepts](#core-concepts)
4. [Implementation Deep Dive](#implementation)
5. [Best Practices](#best-practices)
6. [Common Mistakes](#common-mistakes)
7. [Real-World Examples](#examples)
8. [How to Use This System](#usage)
9. [Advanced Topics](#advanced)
10. [Resources](#resources)

---

## 1. Introduction to Image SEO {#introduction}

### What is Image SEO?

Image SEO is the practice of optimizing images on websites to improve their visibility in search engines and enhance user experience. This involves three main areas:

1. **Alt Text**: Descriptive text for accessibility and search engines
2. **File Names**: Descriptive, keyword-rich file names
3. **File Sizes**: Optimized sizes for fast loading

### Why We Built This System

Before T234, our project had:
- ✅ Technical optimization (WebP, lazy loading, responsive images) from T142
- ❌ No validation for SEO-friendly alt text
- ❌ No enforcement of descriptive file names
- ❌ No feedback for developers on SEO issues

**T234 adds the missing SEO layer** by validating alt text and file names, providing real-time feedback to developers.

---

## 2. Why Image SEO Matters {#why-it-matters}

### For Search Engines

**Image search is huge**:
- 22.6% of all web searches are for images (Google)
- Images appear in 19% of search results
- Optimized images can drive significant organic traffic

**How search engines use images**:
1. **Alt text**: Primary signal for understanding image content
2. **File names**: Secondary signal for relevance
3. **File size**: Affects page speed, a ranking factor
4. **Context**: Surrounding text and page content

### For Users

**Accessibility**:
- Screen readers rely on alt text to describe images to visually impaired users
- Good alt text is a legal requirement in many jurisdictions (ADA, WCAG)

**Performance**:
- Smaller images = faster loading
- Faster loading = better user experience
- Better UX = higher conversion rates

### For Business

**Real Impact**:
- Pinterest increased SEO traffic by 50% after optimizing images
- Etsy's image search optimization increased traffic by 30%
- Better image SEO = more organic traffic = more customers

---

## 3. Core Concepts {#core-concepts}

### 3.1 Alt Text (Alternative Text)

#### What is Alt Text?

Alt text is the `alt` attribute on an `<img>` tag:
```html
<img src="meditation-room.jpg" alt="Peaceful meditation room with soft lighting">
```

#### Purpose of Alt Text

1. **Accessibility**: Screen readers read alt text aloud
2. **SEO**: Search engines use alt text to understand images
3. **Fallback**: Displayed if image fails to load

#### Alt Text Rules

**Length**:
- Minimum: 10 characters
- Ideal: 30-125 characters
- Maximum: 125 characters (screen readers may cut off)

**Content**:
- ✅ Be descriptive: "Meditation room with candles and cushions"
- ❌ Don't use prefixes: "Image of a meditation room"
- ❌ Don't use file names: "IMG_1234.jpg"
- ❌ Don't be vague: "photo"

**Decorative Images**:
- Use empty alt: `alt=""`
- Examples: background patterns, decorative borders, spacers

### 3.2 File Names

#### Why File Names Matter

File names become part of the URL:
```
https://example.com/images/meditation-room-candles.jpg
                            ↑ Keyword-rich, descriptive
```

Search engines use URLs as ranking signals.

#### File Naming Rules

**Format**:
```
✅ meditation-room-candles.jpg
   ↑           ↑        ↑
   keyword   hyphen  keyword

❌ IMG_1234.jpg (generic)
❌ meditation_room.jpg (underscores)
❌ Meditation Room.jpg (spaces, mixed case)
❌ MeditationRoom.jpg (camelCase)
```

**Best Practices**:
1. **Descriptive**: Use 2-4 relevant keywords
2. **Hyphens**: Always use hyphens (not underscores or spaces)
3. **Lowercase**: All lowercase letters
4. **Relevant**: Keywords should describe the image content
5. **Natural**: Avoid keyword stuffing

### 3.3 File Sizes

#### Why Size Matters

**Page Speed Impact**:
- Images account for 50% of average page weight
- 1 second delay = 7% reduction in conversions
- Page speed is a Google ranking factor

**Recommended Sizes**:
- **Thumbnails**: < 50KB
- **Card images**: < 100KB
- **Hero images**: < 200KB
- **Full-width images**: < 200KB

**Optimization Techniques**:
1. **Format**: Use WebP (30% smaller than JPEG)
2. **Compression**: Quality 75-85 is often indistinguishable
3. **Dimensions**: Don't serve 4000px images for 400px displays
4. **Lazy loading**: Load images only when needed

---

## 4. Implementation Deep Dive {#implementation}

### 4.1 System Architecture

Our image SEO system has three layers:

```
┌─────────────────────────────────────┐
│   OptimizedImage Component (UI)     │
│   - Renders optimized images        │
│   - Shows dev warnings               │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   imageSEO.ts (Validation Logic)    │
│   - Alt text validation             │
│   - File name validation            │
│   - Complete SEO analysis           │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   imageOptimization.ts (T142)       │
│   - WebP conversion                 │
│   - Responsive images               │
│   - Lazy loading                    │
└─────────────────────────────────────┘
```

### 4.2 Alt Text Validation

#### Scoring Algorithm

Alt text is scored 0-100 using a penalty system:

```typescript
function calculateAltTextQuality(alt: string): number {
  let score = 100;

  // Critical penalties
  if (isFileName(alt)) score -= 40;          // "IMG_1234.jpg"
  if (isAltTextTooShort(alt)) score -= 35;   // < 10 chars

  // Major penalties
  if (!alt.includes(' ')) score -= 25;       // No spaces = not descriptive
  if (isAltTextTooLong(alt)) score -= 20;    // > 125 chars

  // Minor penalties
  if (hasRedundantPrefix(alt)) score -= 15;  // "Image of..."
  if (alt === alt.toUpperCase()) score -= 10; // ALL CAPS

  // Bonus
  if (alt.length >= 30 && alt.length <= 125) {
    score += 10; // Ideal length
  }

  return Math.max(0, Math.min(100, score));
}
```

#### Validation Flow

```typescript
export function validateAltText(
  alt: string,
  isDecorative: boolean = false
): AltTextValidation {
  const issues: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];

  // Special case: Decorative images
  if (isDecorative) {
    if (isDecorativeImage(alt)) {
      return { isValid: true, score: 100, issues, warnings, suggestions };
    } else {
      warnings.push('Decorative images should have empty alt text (alt="")');
    }
  }

  // Check for missing alt
  if (!alt) {
    issues.push('Alt text is required for non-decorative images');
    return { isValid: false, score: 0, issues, warnings, suggestions };
  }

  // Calculate quality score
  const score = calculateAltTextQuality(alt);

  // Add issues based on checks
  if (isAltTextTooShort(alt)) {
    issues.push(`Alt text is too short (${alt.length} chars, minimum 10)`);
    suggestions.push('Provide more descriptive alt text');
  }

  if (isFileName(alt)) {
    issues.push('Alt text appears to be a file name');
    suggestions.push('Use descriptive text, not file names');
  }

  // ... more checks ...

  const isValid = issues.length === 0 && score >= 70;

  return { isValid, score, issues, warnings, suggestions };
}
```

### 4.3 File Name Validation

#### Keyword Extraction

The system extracts keywords from various file name formats:

```typescript
export function extractKeywords(fileName: string): string[] {
  // Remove extension
  const baseName = fileName.replace(/\.[^.]+$/, '');

  // Split camelCase BEFORE lowercasing
  // This preserves capital letters for splitting
  const words = baseName
    .replace(/([a-z])([A-Z])/g, '$1-$2') // meditationRoom → meditation-Room
    .toLowerCase()                        // meditation-room
    .split(/[-_\s]+/)                     // Split on separators
    .filter(word => word.length > 0);

  return words;
}
```

**Examples**:
- `meditation-room-candles.jpg` → `['meditation', 'room', 'candles']`
- `meditationRoomCandles.jpg` → `['meditation', 'room', 'candles']`
- `meditation_room_candles.jpg` → `['meditation', 'room', 'candles']`

#### Generic File Detection

The system detects generic camera-generated files:

```typescript
export function isDescriptiveFileName(fileName: string): boolean {
  const baseName = fileName.replace(/\.[^.]+$/, '').toLowerCase();

  const genericPatterns = [
    /^img[-_]?\d+$/i,      // IMG_1234, img-1234
    /^dsc[-_]?\d+$/i,      // DSC_5678, dsc-5678
    /^image\d+$/i,         // image1, image123
    /^photo\d+$/i,         // photo1, photo123
    /^picture\d+$/i,       // picture1
    /^screenshot/i,        // screenshot-1234
    /^\d{8}[-_]\d{6}$/,   // 20250106_123456 (timestamp)
  ];

  return !genericPatterns.some(pattern => pattern.test(baseName));
}
```

### 4.4 Complete SEO Analysis

The `analyzeImageSEO` function combines all validations:

```typescript
export function analyzeImageSEO(
  src: string,
  alt: string,
  isDecorative: boolean = false
): ImageSEOAnalysis {
  // Extract file name from path
  const fileName = src.split('/').pop() || src;

  // Validate alt text
  const altText = validateAltText(alt, isDecorative);

  // Validate file name
  const fileNameValidation = validateFileName(fileName);

  // Calculate overall score (weighted average)
  const score = Math.round(altText.score * 0.6 + fileNameValidation.score * 0.4);

  // Aggregate all issues and suggestions
  const allIssues = [...altText.issues, ...fileNameValidation.issues];
  const allSuggestions = [
    ...altText.suggestions,
    ...fileNameValidation.suggestions
  ];

  // Best practices threshold
  const meetsBestPractices = score >= 80 && allIssues.length === 0;

  return {
    score,
    altText,
    fileName: fileNameValidation,
    meetsBestPractices,
    allIssues,
    allSuggestions,
  };
}
```

**Score Weighting**:
- Alt text: 60% (more important for accessibility)
- File name: 40% (important for SEO)

### 4.5 Integration with OptimizedImage

The component validates images during development:

```astro
---
import { analyzeImageSEO } from '@/lib/imageSEO';

// ... props destructuring ...

// T234: SEO validation and warnings (development only)
if (import.meta.env.DEV) {
  const seoAnalysis = analyzeImageSEO(src, alt, isDecorative);

  if (!seoAnalysis.meetsBestPractices) {
    console.warn(`[OptimizedImage SEO] Image SEO score: ${seoAnalysis.score}/100 for "${src}"`);

    if (seoAnalysis.allIssues.length > 0) {
      console.warn(`[OptimizedImage SEO] Issues:`);
      seoAnalysis.allIssues.forEach(issue => console.warn(`  - ${issue}`));
    }

    if (seoAnalysis.allSuggestions.length > 0) {
      console.warn(`[OptimizedImage SEO] Suggestions:`);
      seoAnalysis.allSuggestions.forEach(suggestion =>
        console.warn(`  - ${suggestion}`)
      );
    }
  }
}
---
```

**Why Development Only?**
- No performance impact in production
- Immediate feedback during development
- Helps developers learn SEO best practices

---

## 5. Best Practices {#best-practices}

### 5.1 Writing Great Alt Text

#### The 4 C's of Alt Text

1. **Clear**: Describe what's in the image
2. **Concise**: 10-125 characters
3. **Contextual**: Consider the page context
4. **Complete**: Include relevant keywords naturally

#### Examples

**❌ Bad Alt Text**:
```html
<!-- Too vague -->
<img src="room.jpg" alt="room">

<!-- Redundant prefix -->
<img src="meditation.jpg" alt="Image of a meditation room">

<!-- File name -->
<img src="IMG_1234.jpg" alt="IMG_1234.jpg">

<!-- Keyword stuffing -->
<img src="yoga.jpg" alt="yoga meditation zen mindfulness peaceful calm quiet serene">
```

**✅ Good Alt Text**:
```html
<!-- Descriptive and concise -->
<img src="meditation-room.jpg" alt="Peaceful meditation room with soft lighting and candles">

<!-- Includes relevant keywords naturally -->
<img src="yoga-class.jpg" alt="Outdoor yoga class at sunset in the park">

<!-- Context-appropriate -->
<img src="instructor.jpg" alt="Sarah Johnson, lead meditation instructor">
```

#### Alt Text Decision Tree

```
Is the image decorative?
├─ Yes → Use empty alt: alt=""
└─ No → Is it informative?
    ├─ Yes → Describe content: alt="Meditation room with candles"
    └─ No → Is it functional (button, link)?
        └─ Yes → Describe function: alt="Download course materials"
```

### 5.2 Creating SEO-Friendly File Names

#### File Naming Process

**Before uploading**:
1. Describe the image in 2-4 words
2. Replace spaces with hyphens
3. Convert to lowercase
4. Remove special characters
5. Add appropriate file extension

**Examples**:

| Original | SEO-Friendly |
|----------|--------------|
| `IMG_1234.JPG` | `meditation-room-candles.jpg` |
| `photo (1).png` | `yoga-class-outdoor.png` |
| `Screenshot 2025-01-06.png` | `booking-form-example.png` |
| `DSC_5678.jpeg` | `peaceful-zen-garden.jpg` |

#### Keyword Selection

**Good keywords**:
- ✅ Descriptive: "meditation", "yoga", "instructor"
- ✅ Relevant: Match page content
- ✅ Natural: 2-4 words is ideal
- ✅ Specific: "outdoor-yoga-class" not just "yoga"

**Bad keywords**:
- ❌ Generic: "image", "photo", "picture"
- ❌ Irrelevant: Keywords not related to image
- ❌ Stuffing: Too many keywords (5+)
- ❌ Vague: "thing", "stuff", "item"

### 5.3 Optimizing File Sizes

#### Size Guidelines by Image Type

| Image Type | Max Size | Dimensions | Format |
|------------|----------|------------|--------|
| Thumbnail | 50KB | 200x200px | WebP |
| Card | 100KB | 400x300px | WebP |
| Hero | 200KB | 1920x1080px | WebP |
| Full Width | 200KB | 2000x1200px | WebP |

#### Optimization Workflow

1. **Choose right dimensions**: Don't upload 4000px for 400px display
2. **Compress**: Use tools like TinyPNG, ImageOptim, or Squoosh
3. **Convert to WebP**: 30% smaller than JPEG
4. **Test**: Check visual quality at target size
5. **Provide fallbacks**: JPEG/PNG for older browsers

#### Tools for Optimization

**Online**:
- [Squoosh](https://squoosh.app/) - Google's image optimizer
- [TinyPNG](https://tinypng.com/) - PNG/JPEG compression
- [Cloudinary](https://cloudinary.com/) - Automated optimization

**CLI**:
```bash
# Convert to WebP
cwebp image.jpg -q 80 -o image.webp

# Optimize JPEG
jpegoptim --max=85 image.jpg

# Optimize PNG
optipng -o7 image.png
```

---

## 6. Common Mistakes {#common-mistakes}

### 6.1 Alt Text Mistakes

#### Mistake #1: Using "Image of" or "Picture of"

**❌ Wrong**:
```html
<img src="yoga.jpg" alt="Image of a yoga class">
```

**✅ Right**:
```html
<img src="yoga.jpg" alt="Outdoor yoga class at sunset">
```

**Why**: Screen readers already announce "image", so this is redundant.

#### Mistake #2: Alt Text = File Name

**❌ Wrong**:
```html
<img src="IMG_1234.jpg" alt="IMG_1234.jpg">
```

**✅ Right**:
```html
<img src="meditation-room.jpg" alt="Peaceful meditation room with cushions">
```

**Why**: File names don't describe content. This provides zero value to users or search engines.

#### Mistake #3: No Alt for Decorative Images

**❌ Wrong**:
```html
<img src="decoration.jpg" alt="Decorative image">
```

**✅ Right**:
```html
<img src="decoration.jpg" alt="">
```

**Why**: Empty alt tells screen readers to skip decorative images, improving UX.

### 6.2 File Name Mistakes

#### Mistake #1: Using Spaces or Underscores

**❌ Wrong**:
```
meditation room.jpg
meditation_room.jpg
```

**✅ Right**:
```
meditation-room.jpg
```

**Why**: Spaces in URLs become `%20`, and underscores are not word separators for search engines.

#### Mistake #2: Mixed Case

**❌ Wrong**:
```
MeditationRoom.jpg
Meditation-Room.jpg
```

**✅ Right**:
```
meditation-room.jpg
```

**Why**: URLs are case-sensitive. Lowercase ensures consistency.

#### Mistake #3: Keeping Camera File Names

**❌ Wrong**:
```
IMG_1234.jpg
DSC_5678.jpg
20250106_123456.jpg
```

**✅ Right**:
```
meditation-instructor-sarah.jpg
zen-garden-peaceful.jpg
yoga-class-outdoor-sunset.jpg
```

**Why**: Generic names provide no SEO value and miss ranking opportunities.

### 6.3 Size Optimization Mistakes

#### Mistake #1: Uploading Huge Files

**❌ Wrong**: 4000x3000px JPEG at 5MB

**✅ Right**: Multiple sizes with srcset
```html
<picture>
  <source
    srcset="hero-400w.webp 400w, hero-800w.webp 800w, hero-1920w.webp 1920w"
    type="image/webp"
  />
  <img src="hero.jpg" alt="..." />
</picture>
```

#### Mistake #2: Over-Optimizing Quality

**❌ Wrong**: Quality 10 (visible artifacts)

**✅ Right**: Quality 75-85 (good balance)

**Why**: Balance file size and visual quality. Users notice bad quality.

#### Mistake #3: Not Using Modern Formats

**❌ Wrong**: Only JPEG/PNG

**✅ Right**: WebP with JPEG fallback

**Why**: WebP is 30% smaller with same quality.

---

## 7. Real-World Examples {#examples}

### Example 1: Course Thumbnail

**Scenario**: E-learning platform showing course thumbnails

**Before**:
```html
<img src="IMG_5432.jpg" alt="course">
```
**Score**: 25/100
**Issues**: Generic file name, vague alt text

**After**:
```html
<img
  src="mindfulness-meditation-beginner-course.jpg"
  alt="Mindfulness meditation course for beginners with instructor guide"
>
```
**Score**: 100/100
**Result**: +150% image search traffic

### Example 2: Product Image

**Scenario**: E-commerce site selling yoga mats

**Before**:
```html
<img src="product-img-1.jpg" alt="Product image">
```
**Score**: 30/100
**Issues**: Generic name and alt

**After**:
```html
<img
  src="eco-friendly-yoga-mat-purple.jpg"
  alt="Purple eco-friendly yoga mat with carrying strap"
>
```
**Score**: 100/100
**Result**: Appears in "purple yoga mat" image searches

### Example 3: Blog Hero Image

**Scenario**: Blog post about meditation techniques

**Before**:
```html
<img src="hero.jpg" alt="Image of meditation">
```
**Score**: 55/100
**Issues**: Generic file name, redundant prefix

**After**:
```html
<img
  src="meditation-techniques-mindfulness-practice.jpg"
  alt="Person practicing mindfulness meditation in peaceful room"
>
```
**Score**: 100/100
**Result**: Ranks for "meditation techniques" image search

### Example 4: Decorative Background

**Scenario**: Decorative pattern on pricing page

**Before**:
```html
<img src="bg.png" alt="Background pattern">
```
**Score**: 45/100
**Issues**: Decorative image with descriptive alt

**After**:
```html
<OptimizedImage
  src="abstract-pattern-background.png"
  alt=""
  isDecorative={true}
/>
```
**Score**: 100/100
**Result**: Screen readers skip, better UX

---

## 8. How to Use This System {#usage}

### 8.1 Using OptimizedImage Component

#### Basic Usage

```astro
---
import OptimizedImage from '@/components/OptimizedImage.astro';
---

<!-- Course thumbnail -->
<OptimizedImage
  src="/images/mindfulness-meditation-course.jpg"
  alt="Mindfulness meditation course for beginners"
  preset="card"
/>

<!-- Hero image -->
<OptimizedImage
  src="/images/yoga-class-outdoor-sunset.jpg"
  alt="Outdoor yoga class at sunset in the park"
  preset="hero"
/>

<!-- Decorative image -->
<OptimizedImage
  src="/images/background-pattern.jpg"
  alt=""
  isDecorative={true}
/>
```

#### Development Warnings

When you use a poor alt text or file name, you'll see console warnings:

```
[OptimizedImage SEO] Image SEO score: 45/100 for "/images/IMG_1234.jpg"
[OptimizedImage SEO] Issues:
  - Alt text is too short (5 chars, minimum 10)
  - File name is not descriptive (appears to be generic or camera-generated)
[OptimizedImage SEO] Suggestions:
  - Provide more descriptive alt text
  - Use descriptive, keyword-rich file name (e.g., "meditation-room-candles.jpg")
```

### 8.2 Manual Validation

You can validate alt text and file names programmatically:

```typescript
import {
  validateAltText,
  validateFileName,
  analyzeImageSEO
} from '@/lib/imageSEO';

// Validate alt text
const altResult = validateAltText('Meditation room');
console.log(`Valid: ${altResult.isValid}`);
console.log(`Score: ${altResult.score}/100`);
console.log(`Issues: ${altResult.issues.join(', ')}`);

// Validate file name
const fileResult = validateFileName('IMG_1234.jpg');
console.log(`Valid: ${fileResult.isValid}`);
console.log(`Score: ${fileResult.score}/100`);

// Complete analysis
const analysis = analyzeImageSEO(
  '/images/meditation-room.jpg',
  'Meditation room with candles',
  false
);
console.log(`Overall Score: ${analysis.score}/100`);
console.log(`Meets Best Practices: ${analysis.meetsBestPractices}`);
```

### 8.3 Pre-Upload Checklist

Before uploading images, check:

- [ ] File name is descriptive with 2-4 keywords
- [ ] File name uses hyphens (not underscores or spaces)
- [ ] File name is all lowercase
- [ ] File size is under recommended limit
- [ ] Image format is WebP (or JPEG/PNG with WebP conversion)
- [ ] Alt text is 10-125 characters
- [ ] Alt text describes the image (no "image of" prefix)
- [ ] Alt text includes relevant keywords naturally
- [ ] Decorative images have empty alt text

---

## 9. Advanced Topics {#advanced}

### 9.1 Context-Aware Alt Text

Alt text should vary based on context:

**Same image, different contexts**:

```html
<!-- On homepage: General description -->
<img
  src="meditation-instructor-sarah.jpg"
  alt="Meditation instructor teaching mindfulness techniques"
>

<!-- On instructor bio page: More specific -->
<img
  src="meditation-instructor-sarah.jpg"
  alt="Sarah Johnson, certified meditation instructor with 10 years experience"
>

<!-- In blog post about poses: Focus on pose -->
<img
  src="meditation-instructor-sarah.jpg"
  alt="Proper sitting posture for meditation with straight back and relaxed shoulders"
>
```

### 9.2 Structured Data for Images

Enhance image SEO with structured data:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "ImageObject",
  "contentUrl": "https://example.com/images/meditation-room.jpg",
  "name": "Peaceful meditation room",
  "description": "Meditation room with soft lighting, candles, and comfortable cushions",
  "author": {
    "@type": "Person",
    "name": "John Doe"
  }
}
</script>
```

### 9.3 Internationalization

For multilingual sites, translate alt text:

```astro
---
const altText = {
  en: "Peaceful meditation room with candles",
  es: "Habitación de meditación tranquila con velas",
  fr: "Salle de méditation paisible avec des bougies"
};
const currentLang = Astro.currentLocale || 'en';
---

<OptimizedImage
  src="/images/meditation-room.jpg"
  alt={altText[currentLang]}
/>
```

### 9.4 Dynamic Alt Text Generation

For user-generated content, generate alt text:

```typescript
export function generateAltFromContext(
  fileName: string,
  pageTitle: string,
  imageIndex: number
): string {
  const keywords = extractKeywords(fileName);

  if (keywords.length >= 2) {
    // Good keywords available
    return keywords.join(' ').replace(/^./, c => c.toUpperCase());
  }

  // Fallback to context
  return `${pageTitle} - Image ${imageIndex + 1}`;
}
```

### 9.5 Performance Monitoring

Track image SEO performance:

```typescript
export function trackImageSEO(src: string, analysis: ImageSEOAnalysis) {
  // Send to analytics
  analytics.track('image_seo_score', {
    src,
    score: analysis.score,
    issues: analysis.allIssues.length,
    meetsBestPractices: analysis.meetsBestPractices
  });

  // Alert if score is low
  if (analysis.score < 50) {
    console.error(`Critical: Image SEO score is ${analysis.score}/100 for ${src}`);
  }
}
```

---

## 10. Resources {#resources}

### Official Guidelines

- [Google Images SEO Best Practices](https://developers.google.com/search/docs/appearance/google-images)
- [WebAIM Alt Text Guide](https://webaim.org/techniques/alttext/)
- [WCAG Image Guidelines](https://www.w3.org/WAI/tutorials/images/)
- [Moz Image Optimization](https://moz.com/learn/seo/image-optimization)

### Tools

**Image Optimization**:
- [Squoosh](https://squoosh.app/) - Online image optimizer
- [TinyPNG](https://tinypng.com/) - PNG/JPEG compression
- [ImageOptim](https://imageoptim.com/) - Mac app for compression
- [Cloudinary](https://cloudinary.com/) - Automated optimization service

**Alt Text Validation**:
- [WAVE Browser Extension](https://wave.webaim.org/extension/) - Accessibility checker
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) - SEO audit tool
- Our T234 system (this implementation!)

**File Name Helpers**:
- [Bulk Rename Utility](https://www.bulkrenameutility.co.uk/) - Windows
- [Name Changer](https://mrrsoftware.com/namechanger/) - Mac
- CLI: `rename` command

### Further Reading

**Books**:
- "Image Optimization" by Addy Osmani
- "Web Performance in Action" by Jeremy Wagner

**Articles**:
- [The Ultimate Guide to Image Optimization](https://www.smashingmagazine.com/2021/09/modern-image-formats-avif-webp/)
- [Alt Text: The Ultimate Guide](https://axesslab.com/alt-texts/)

**Courses**:
- [Web Accessibility by Google (Udacity)](https://www.udacity.com/course/web-accessibility--ud891)
- [SEO Training Course (Moz)](https://moz.com/learn/seo)

---

## Key Takeaways

1. **Alt Text is Critical**: It's for accessibility AND SEO. Always provide descriptive alt text.

2. **File Names Matter**: Rename files before uploading. Use descriptive, hyphenated, lowercase names.

3. **Size Optimization**: Balance quality and file size. Use WebP format and responsive images.

4. **Development Feedback**: Our system provides real-time warnings to help you learn and improve.

5. **Context Matters**: Consider the page context when writing alt text.

6. **Decorative Images**: Use empty alt (`alt=""`) for purely decorative images.

7. **Test Everything**: Use our validation functions to test alt text and file names before deployment.

8. **Continuous Improvement**: Monitor image SEO performance and iterate based on data.

---

## Conclusion

Image SEO is not just about ranking in image search - it's about creating an accessible, fast, and user-friendly experience. By following the guidelines in this guide and using the T234 validation system, you'll ensure your images contribute to SEO success and provide value to all users.

Remember: **Good image SEO = Better accessibility + Faster performance + Higher rankings**

---

**Guide completed**: 2025-11-06
**Maintained by**: Development Team
**Questions?**: Check the implementation log and test log for technical details.
