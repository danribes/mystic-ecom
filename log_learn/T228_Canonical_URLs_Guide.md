# T228: Canonical URLs - Learning Guide

## Table of Contents
1. [Introduction](#introduction)
2. [What are Canonical URLs?](#what-are-canonical-urls)
3. [Why Canonical URLs Matter for SEO](#why-canonical-urls-matter-for-seo)
4. [Common Duplicate Content Scenarios](#common-duplicate-content-scenarios)
5. [Canonical URL Best Practices](#canonical-url-best-practices)
6. [Implementation Architecture](#implementation-architecture)
7. [Code Deep Dive](#code-deep-dive)
8. [Testing Strategy](#testing-strategy)
9. [Real-World Examples](#real-world-examples)
10. [Common Pitfalls and Solutions](#common-pitfalls-and-solutions)
11. [Advanced Topics](#advanced-topics)
12. [Further Reading](#further-reading)

---

## Introduction

This guide explains the canonical URL implementation for the Spirituality Platform. It covers the technical implementation, SEO principles, and best practices for preventing duplicate content issues.

### What You'll Learn
- What canonical URLs are and why they're critical for SEO
- How to implement canonical URL generation in Astro
- Best practices for URL normalization
- How to test canonical URL functionality
- Common pitfalls and how to avoid them

### Prerequisites
- Basic understanding of URLs and HTTP
- Familiarity with SEO concepts
- Knowledge of TypeScript and Astro framework
- Understanding of web development testing

---

## What are Canonical URLs?

### Definition

A **canonical URL** is the "official" or "preferred" version of a URL when multiple URLs can lead to the same or similar content. It's specified using the `<link rel="canonical">` tag in HTML.

### Example

Consider these URLs that all show the same content:
```
https://example.com/courses/meditation
http://example.com/courses/meditation
https://example.com/courses/meditation/
https://example.com/courses/meditation?utm_source=email
https://example.com/courses/meditation#reviews
```

**Canonical URL**: `https://example.com/courses/meditation/`

The canonical URL tells search engines: "All these URLs represent the same page - please index THIS version."

### HTML Implementation

```html
<head>
  <link rel="canonical" href="https://example.com/courses/meditation/" />
</head>
```

When a search engine crawler sees this tag, it knows to consolidate all ranking signals to the canonical URL.

---

## Why Canonical URLs Matter for SEO

### 1. Prevent Duplicate Content Penalties

Search engines penalize sites with duplicate content because it:
- Wastes crawler resources
- Dilutes ranking signals
- Creates poor user experience

**Without Canonical URLs**:
```
Google indexes:
- https://example.com/about
- https://example.com/about/
- http://example.com/about
- https://example.com/about?ref=nav

Result: 4 separate pages competing against each other
```

**With Canonical URLs**:
```
Google indexes:
- https://example.com/about/ (canonical)

Result: All ranking signals consolidated to one URL
```

### 2. Consolidate Link Equity (PageRank)

When people link to your content, they might use different URL variations:
```
Site A links to: http://example.com/about
Site B links to: https://example.com/about
Site C links to: https://example.com/about?source=twitter
```

**Without Canonical**: Link equity divided across 3 URLs
**With Canonical**: All link equity flows to one URL, stronger ranking

### 3. Improve Crawl Efficiency

Search engines have a limited "crawl budget" (number of pages they'll crawl per day).

**Without Canonical**:
- Crawler wastes time on duplicate URLs
- Fewer unique pages discovered
- Slower indexing of new content

**With Canonical**:
- Crawler focuses on unique content
- Better crawl budget utilization
- Faster indexing

### 4. Better Analytics

Canonical URLs ensure:
- Traffic data consolidated to one URL
- Accurate page view metrics
- Clear conversion tracking
- Simplified reporting

### 5. Social Media Consistency

When users share your content, canonical URLs ensure:
- Consistent share counts (Facebook, Twitter, etc.)
- Proper preview images and descriptions
- Better social proof

---

## Common Duplicate Content Scenarios

### 1. Trailing Slash Variations

**Problem**:
```
/about    ← Different URLs
/about/   ← Same content
```

**Solution**: Always use trailing slashes (or never use them - consistency is key)
```typescript
{ trailingSlash: true }
// Result: https://example.com/about/
```

### 2. HTTP vs HTTPS

**Problem**:
```
http://example.com/about   ← Insecure
https://example.com/about  ← Secure (preferred)
```

**Solution**: Always use HTTPS
```typescript
{ forceHttps: true }
// Result: https://example.com/about/
```

### 3. Query Parameter Variations

**Problem**: Marketing campaigns add tracking parameters
```
/courses/meditation                           ← Clean URL
/courses/meditation?utm_source=newsletter     ← Email campaign
/courses/meditation?utm_source=facebook       ← Social media
/courses/meditation?ref=homepage              ← Internal tracking
```

**Solution**: Remove tracking parameters from canonical URL
```typescript
{ removeQueryParams: true }
// All resolve to: https://example.com/courses/meditation/
```

### 4. URL Fragments (Hash Values)

**Problem**: Fragments create URL variations
```
/about            ← Full page
/about#team       ← Team section
/about#contact    ← Contact section
```

**Solution**: Remove fragments from canonical URL
```typescript
{ removeFragment: true }
// All resolve to: https://example.com/about/
```

### 5. Case Sensitivity

**Problem**: URLs with different cases
```
/About           ← Uppercase
/about           ← Lowercase
/ABOUT           ← All uppercase
```

**Solution**: Normalize to lowercase (optional)
```typescript
{ lowercase: true }
// All resolve to: https://example.com/about/
```

### 6. Multiple Slashes

**Problem**: Duplicate slashes in URLs
```
/courses//meditation     ← Double slash
/courses///meditation    ← Triple slash
/courses/meditation      ← Correct
```

**Solution**: Normalize to single slashes
```typescript
// Automatically handled by our implementation
// Result: https://example.com/courses/meditation/
```

---

## Canonical URL Best Practices

### 1. Use Absolute URLs

**❌ Wrong** (Relative URL):
```html
<link rel="canonical" href="/about/" />
```

**✅ Correct** (Absolute URL):
```html
<link rel="canonical" href="https://example.com/about/" />
```

**Why**: Absolute URLs prevent ambiguity and work correctly regardless of domain or subdomain.

### 2. Use HTTPS

**❌ Wrong**:
```
http://example.com/about/
```

**✅ Correct**:
```
https://example.com/about/
```

**Why**: HTTPS is the web standard. Search engines prefer secure sites.

### 3. Trailing Slash Consistency

**Choose one and stick with it**:

**Option 1**: Always use trailing slashes (our choice)
```
https://example.com/about/
https://example.com/courses/
https://example.com/contact/
```

**Option 2**: Never use trailing slashes
```
https://example.com/about
https://example.com/courses
https://example.com/contact
```

**Important**: Files with extensions should never have trailing slashes:
```
✅ https://example.com/sitemap.xml
❌ https://example.com/sitemap.xml/
```

### 4. Remove Query Parameters

**❌ Wrong**:
```
https://example.com/courses/yoga/?utm_source=email&utm_campaign=spring
```

**✅ Correct**:
```
https://example.com/courses/yoga/
```

**Exception**: Keep query parameters that change content
```
✅ https://example.com/search/?q=meditation  (different results)
✅ https://example.com/products/?page=2      (different content)
```

### 5. Remove URL Fragments

**❌ Wrong**:
```
https://example.com/about/#team
```

**✅ Correct**:
```
https://example.com/about/
```

**Why**: Fragments are client-side only and don't represent different content.

### 6. Self-Reference Canonical

Every page should have a canonical URL, even if there's no duplicate content:

```html
<!-- Page: https://example.com/about/ -->
<link rel="canonical" href="https://example.com/about/" />
```

**Why**: Makes your intentions explicit to search engines.

### 7. One Canonical Per Page

**❌ Wrong**:
```html
<link rel="canonical" href="https://example.com/page1/" />
<link rel="canonical" href="https://example.com/page2/" />
```

**✅ Correct**:
```html
<link rel="canonical" href="https://example.com/page1/" />
```

### 8. Canonical Should Be Accessible

The canonical URL must:
- Return HTTP 200 (not 404, 301, or 302)
- Be accessible to search engines (not blocked by robots.txt)
- Contain the actual content (not redirect to another page)

---

## Implementation Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Astro Component                       │
│                     (Any Page)                           │
│                                                          │
│  import { SEO } from '@/components/SEO.astro';          │
│  <SEO title="Page Title" />                             │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                   SEO Component                          │
│              (src/components/SEO.astro)                  │
│                                                          │
│  - Collects page metadata                               │
│  - Calls canonical URL generator                        │
│  - Outputs <link rel="canonical"> tag                   │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│              Canonical URL Utility                       │
│           (src/lib/canonicalUrl.ts)                      │
│                                                          │
│  generateCanonicalUrlFromAstro()                        │
│    ├─ Extract base URL from Astro.site                  │
│    ├─ Extract pathname from Astro.url                   │
│    └─ Call generateCanonicalUrl()                       │
│                                                          │
│  generateCanonicalUrl()                                 │
│    ├─ Force HTTPS                                       │
│    ├─ Extract query params/fragments                    │
│    ├─ Normalize path                                    │
│    ├─ Add trailing slash (if needed)                    │
│    └─ Reconstruct URL                                   │
└─────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Page Level**: Developer adds `<SEO>` component
2. **SEO Component**: Receives page metadata (title, description, etc.)
3. **Canonical Generation**: Calls `generateCanonicalUrlFromAstro()` with Astro context
4. **URL Processing**: Applies transformations (HTTPS, trailing slash, etc.)
5. **HTML Output**: Generates `<link rel="canonical">` tag
6. **Browser/Crawler**: Reads canonical URL from HTML

### File Structure

```
src/
├── components/
│   └── SEO.astro                    # SEO component (uses utility)
├── lib/
│   └── canonicalUrl.ts              # Canonical URL utility library
└── pages/
    ├── index.astro                  # Uses SEO component
    ├── about.astro                  # Uses SEO component
    └── courses/
        └── [id].astro               # Uses SEO component

tests/
└── unit/
    └── T228_canonical_urls.test.ts  # 76 comprehensive tests
```

---

## Code Deep Dive

### Core Function: generateCanonicalUrl()

Let's break down the main function step by step:

```typescript
export function generateCanonicalUrl(
  pathname: string,
  baseUrl: string,
  options: CanonicalUrlOptions = {}
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
```

**Step 1**: Merge provided options with defaults
- Allows customization while maintaining sensible defaults
- Default options defined at module level

```typescript
  // Ensure baseUrl doesn't have trailing slash
  let cleanBaseUrl = baseUrl.trim().replace(/\/+$/, '');
```

**Step 2**: Clean the base URL
- Remove any trailing slashes from domain
- Ensures `https://example.com/` becomes `https://example.com`
- Prevents issues like `https://example.com//about/`

```typescript
  // Force HTTPS if requested
  if (opts.forceHttps && cleanBaseUrl.startsWith('http://')) {
    cleanBaseUrl = cleanBaseUrl.replace(/^http:\/\//, 'https://');
  }
```

**Step 3**: Convert HTTP to HTTPS
- Uses simple string replacement
- Only applies if option is enabled and URL is HTTP
- Pattern: `^http:\/\/` matches start of string with `http://`

```typescript
  // Extract query parameters and fragments first
  let queryString = '';
  let fragment = '';

  if (cleanPathname.includes('?')) {
    const parts = cleanPathname.split('?');
    cleanPathname = parts[0];
    queryString = '?' + parts.slice(1).join('?');
  }

  if (cleanPathname.includes('#')) {
    const parts = cleanPathname.split('#');
    cleanPathname = parts[0];
    fragment = '#' + parts.slice(1).join('#');
  }
```

**Step 4**: Extract query parameters and fragments
- **Why extract first?** So trailing slash can be added to the path, not the query string
- **Wrong**: `/about?page=2/` ❌
- **Right**: `/about/?page=2` ✅
- Uses `.split()` to separate components
- Stores for later re-addition

```typescript
  // Ensure pathname starts with /
  if (!cleanPathname.startsWith('/')) {
    cleanPathname = '/' + cleanPathname;
  }
```

**Step 5**: Add leading slash
- Ensures `about` becomes `/about`
- Required for valid URL construction

```typescript
  // Remove trailing slash temporarily for consistency
  cleanPathname = cleanPathname.replace(/\/+$/, '');
```

**Step 6**: Remove trailing slashes
- Normalizes `/about/` and `/about///` to `/about`
- Provides clean state before adding trailing slash back

```typescript
  // Convert to lowercase if requested
  if (opts.lowercase) {
    cleanPathname = cleanPathname.toLowerCase();
  }
```

**Step 7**: Optional lowercase conversion
- `/About` → `/about`
- Only if option enabled (default: false)
- Case normalization can help with consistency

```typescript
  // Handle trailing slash
  if (opts.trailingSlash) {
    if (cleanPathname === '' || cleanPathname === '/') {
      cleanPathname = '/';
    } else {
      // Don't add trailing slash to file extensions
      const hasExtension = /\.[a-zA-Z0-9]+$/.test(cleanPathname);
      if (!hasExtension) {
        cleanPathname = cleanPathname + '/';
      }
    }
  }
```

**Step 8**: Add trailing slash intelligently
- **Root path**: Keep as `/` (not `//`)
- **File extensions**: Skip trailing slash (`.xml`, `.txt`, `.json`)
- **Regular paths**: Add trailing slash
- Regex `/\.[a-zA-Z0-9]+$/` matches file extensions at end of string

```typescript
  // Add back query parameters and fragments based on options
  if (!opts.removeQueryParams && queryString) {
    cleanPathname += queryString;
  }

  if (!opts.removeFragment && fragment) {
    cleanPathname += fragment;
  }
```

**Step 9**: Re-add query params and fragments
- Only if options say to keep them
- Added after trailing slash processing
- Ensures correct order: `path/` + `?query` + `#fragment`

```typescript
  // Construct final URL
  const canonicalUrl = `${cleanBaseUrl}${cleanPathname}`;

  return canonicalUrl;
}
```

**Step 10**: Construct and return final URL
- Combines base URL and processed pathname
- Example: `https://example.com` + `/about/` = `https://example.com/about/`

### Astro Wrapper: generateCanonicalUrlFromAstro()

This function adapts the core function to work with Astro's URL objects:

```typescript
export function generateCanonicalUrlFromAstro(
  astroUrl: URL,
  astroSite: URL | undefined,
  customCanonical?: string,
  options: CanonicalUrlOptions = {}
): string {
  // If custom canonical is provided, use it
  if (customCanonical) {
    try {
      const url = new URL(customCanonical);
      return generateCanonicalUrl(url.pathname, url.origin, options);
    } catch {
      // If not a full URL, treat as pathname
      const baseUrl = astroSite?.origin || astroUrl.origin;
      return generateCanonicalUrl(customCanonical, baseUrl, options);
    }
  }

  // Use Astro.site if available, fallback to Astro.url.origin
  const baseUrl = astroSite?.origin || astroUrl.origin;
  const pathname = astroUrl.pathname;

  return generateCanonicalUrl(pathname, baseUrl, options);
}
```

**Key Features**:
1. **Custom Canonical Support**: Allows manual override
2. **Flexible Input**: Accepts full URLs or pathnames
3. **Fallback Logic**: Uses `Astro.url.origin` if `Astro.site` undefined
4. **Error Handling**: Try-catch for URL parsing

### Validation Function: validateCanonicalUrl()

This function checks if a URL follows canonical URL best practices:

```typescript
export function validateCanonicalUrl(url: string): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  try {
    const parsedUrl = new URL(url);

    // Check protocol
    if (parsedUrl.protocol !== 'https:') {
      issues.push('Should use HTTPS protocol');
    }

    // Check for query parameters
    if (parsedUrl.search) {
      issues.push('Contains query parameters');
    }

    // Check for fragments
    if (parsedUrl.hash) {
      issues.push('Contains URL fragment (hash)');
    }

    // Check for trailing slash
    const hasExtension = /\.[a-zA-Z0-9]+$/.test(parsedUrl.pathname);
    if (!hasExtension && parsedUrl.pathname !== '/' && !parsedUrl.pathname.endsWith('/')) {
      issues.push('Missing trailing slash');
    }

    // Check for double slashes
    if (parsedUrl.pathname.includes('//')) {
      issues.push('Contains double slashes in path');
    }

  } catch (error) {
    issues.push('Invalid URL format');
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}
```

**Usage**:
```typescript
const result = validateCanonicalUrl('http://example.com/about?page=2');
console.log(result);
// {
//   valid: false,
//   issues: [
//     'Should use HTTPS protocol',
//     'Contains query parameters',
//     'Missing trailing slash'
//   ]
// }
```

### Usage in SEO Component

In `src/components/SEO.astro`:

```typescript
import { generateCanonicalUrlFromAstro } from '@/lib/canonicalUrl';

// ... component props ...

const canonicalURL = generateCanonicalUrlFromAstro(
  Astro.url,        // Current page URL
  Astro.site,       // Site config from astro.config.mjs
  canonical,        // Optional custom canonical from props
  {
    trailingSlash: true,
    forceHttps: true,
    removeQueryParams: true,
    removeFragment: true,
  }
);
```

Then in the HTML:
```html
<link rel="canonical" href={canonicalURL} />
```

---

## Testing Strategy

### Test Organization

The test suite is organized into 7 main categories:

#### 1. Core Functionality Tests
Test the main `generateCanonicalUrl()` function:
```typescript
describe('generateCanonicalUrl', () => {
  it('should generate canonical URL with trailing slash', () => {
    const result = generateCanonicalUrl('/about', 'https://example.com');
    expect(result).toBe('https://example.com/about/');
  });
});
```

#### 2. Option Tests
Test each configuration option:
```typescript
describe('Trailing Slash Handling', () => {
  it('should add trailing slash by default', () => { /* ... */ });
  it('should not add trailing slash when disabled', () => { /* ... */ });
});
```

#### 3. Edge Case Tests
Test unusual inputs:
```typescript
describe('Edge Cases', () => {
  it('should handle empty strings', () => { /* ... */ });
  it('should handle international characters', () => { /* ... */ });
});
```

#### 4. Integration Tests
Test Astro-specific functionality:
```typescript
describe('generateCanonicalUrlFromAstro', () => {
  it('should generate canonical URL from Astro context', () => {
    const astroUrl = new URL('https://example.com/about?utm_source=email');
    const astroSite = new URL('https://example.com');

    const result = generateCanonicalUrlFromAstro(astroUrl, astroSite);
    expect(result).toBe('https://example.com/about/');
  });
});
```

#### 5. Validation Tests
Test URL validation:
```typescript
describe('validateCanonicalUrl', () => {
  it('should detect HTTP protocol', () => {
    const result = validateCanonicalUrl('http://example.com/about/');
    expect(result.valid).toBe(false);
    expect(result.issues).toContain('Should use HTTPS protocol');
  });
});
```

#### 6. Real-World Scenario Tests
Test actual use cases:
```typescript
describe('Real-World Scenarios', () => {
  describe('Course Pages', () => {
    it('should handle course detail page', () => { /* ... */ });
    it('should remove tracking parameters', () => { /* ... */ });
  });
});
```

### Testing Best Practices

#### 1. Test One Thing Per Test
```typescript
// ✅ Good: Tests one specific behavior
it('should convert HTTP to HTTPS by default', () => {
  const result = generateCanonicalUrl('/about', 'http://example.com');
  expect(result).toBe('https://example.com/about/');
});

// ❌ Bad: Tests multiple behaviors
it('should handle HTTP and trailing slashes and query params', () => {
  // Too much in one test
});
```

#### 2. Use Descriptive Names
```typescript
// ✅ Good: Clear what's being tested
it('should not add trailing slash to file extensions')

// ❌ Bad: Vague description
it('should handle files')
```

#### 3. Include Input and Expected Output
```typescript
it('should remove query parameters by default', () => {
  // Clear input
  const result = generateCanonicalUrl(
    '/about?utm_source=email',
    'https://example.com'
  );

  // Clear expected output
  expect(result).toBe('https://example.com/about/');
});
```

#### 4. Test Edge Cases
```typescript
it('should handle empty strings', () => { /* ... */ });
it('should handle very long paths', () => { /* ... */ });
it('should handle international characters', () => { /* ... */ });
```

#### 5. Group Related Tests
```typescript
describe('HTTPS Enforcement', () => {
  it('should keep HTTPS when already HTTPS', () => { /* ... */ });
  it('should convert HTTP to HTTPS by default', () => { /* ... */ });
  it('should not convert HTTP when forceHttps is false', () => { /* ... */ });
});
```

---

## Real-World Examples

### Example 1: Course Page with Tracking Parameters

**Scenario**: User clicks email link with tracking parameters

**Input URL**:
```
https://example.com/courses/mindfulness-meditation-101?utm_source=newsletter&utm_campaign=spring2024&utm_medium=email
```

**Generated Canonical**:
```
https://example.com/courses/mindfulness-meditation-101/
```

**SEO Benefit**: All email traffic counted toward single canonical URL

**Implementation**:
```astro
---
// courses/[id].astro
import SEO from '@/components/SEO.astro';

const { id } = Astro.params;
const course = await getCourse(id);
---

<SEO
  title={course.title}
  description={course.description}
/>
<!-- Canonical automatically generated: removes query params, adds trailing slash -->
```

### Example 2: Blog Post with Fragment

**Scenario**: User shares link to specific section

**Input URL**:
```
https://example.com/blog/2024/11/spiritual-awakening#comments
```

**Generated Canonical**:
```
https://example.com/blog/2024/11/spiritual-awakening/
```

**SEO Benefit**: Search engines index main article, not fragment variations

### Example 3: HTTP to HTTPS Conversion

**Scenario**: Old link uses HTTP protocol

**Input URL**:
```
http://example.com/about
```

**Generated Canonical**:
```
https://example.com/about/
```

**SEO Benefit**: All ranking signals go to secure HTTPS version

### Example 4: Special Files (No Trailing Slash)

**Scenario**: Sitemap and robots files

**Input URLs**:
```
https://example.com/sitemap.xml
https://example.com/robots.txt
https://example.com/manifest.json
```

**Generated Canonicals** (unchanged):
```
https://example.com/sitemap.xml
https://example.com/robots.txt
https://example.com/manifest.json
```

**Technical Detail**: Regex detects file extensions and skips trailing slash

### Example 5: Custom Canonical Override

**Scenario**: Paginated content should point to page 1

**Usage**:
```astro
---
// search results page 2
import SEO from '@/components/SEO.astro';

const page = Astro.url.searchParams.get('page') || '1';
const canonicalPage = 'https://example.com/search/'; // Always page 1
---

<SEO
  title="Search Results"
  canonical={canonicalPage}
/>
<!-- All pages point to page 1 as canonical -->
```

---

## Common Pitfalls and Solutions

### Pitfall 1: Relative Canonical URLs

**❌ Wrong**:
```html
<link rel="canonical" href="/about/" />
```

**✅ Correct**:
```html
<link rel="canonical" href="https://example.com/about/" />
```

**Why Wrong**: Relative URLs can be ambiguous across subdomains

**Our Solution**: Always generate absolute URLs with domain

### Pitfall 2: Canonical to Different Domain

**❌ Wrong**:
```html
<!-- Page: https://example.com/about/ -->
<link rel="canonical" href="https://different-domain.com/about/" />
```

**Why Wrong**: Only use cross-domain canonical if content is truly syndicated

**Our Solution**: Use same domain unless explicitly customized

### Pitfall 3: Canonical Chain

**❌ Wrong**:
```
Page A canonical → Page B
Page B canonical → Page C
```

**✅ Correct**:
```
Page A canonical → Page C
Page B canonical → Page C
```

**Why Wrong**: Search engines may not follow chains

**Our Solution**: Always point directly to final canonical URL

### Pitfall 4: Canonical to Non-200 Page

**❌ Wrong**:
```html
<link rel="canonical" href="https://example.com/deleted-page/" />
<!-- Returns 404 -->
```

**Why Wrong**: Canonical must be accessible and return 200 OK

**Our Solution**: Ensure canonical URL exists and is accessible

### Pitfall 5: Multiple Canonicals

**❌ Wrong**:
```html
<link rel="canonical" href="https://example.com/page-1/" />
<link rel="canonical" href="https://example.com/page-2/" />
```

**Why Wrong**: Search engines use first or ignore all

**Our Solution**: SEO component generates single canonical tag

### Pitfall 6: Canonical Doesn't Match Content

**❌ Wrong**:
```html
<!-- Page: /courses/yoga/ -->
<link rel="canonical" href="https://example.com/courses/pilates/" />
```

**Why Wrong**: Content must match between page and canonical

**Our Solution**: Auto-generate from current URL, only custom when needed

### Pitfall 7: Forgetting File Extensions

**❌ Wrong**:
```
https://example.com/sitemap.xml/  ← Trailing slash on file
```

**✅ Correct**:
```
https://example.com/sitemap.xml   ← No trailing slash
```

**Our Solution**: Regex detects file extensions and skips trailing slash

### Pitfall 8: Query Parameters Change Content

**❌ Wrong**:
```
/search/?q=meditation  → Remove query (content differs per query!)
```

**✅ Correct**:
```
/search/?q=meditation  → Keep query in canonical
```

**Our Solution**: Configure per-page when query params affect content:
```astro
<SEO
  title="Search Results"
  canonical={`https://example.com/search/?q=${query}`}
/>
```

---

## Advanced Topics

### 1. Pagination Canonical URLs

For paginated content (page 2, 3, etc.), you have two strategies:

#### Strategy A: Each Page is Canonical to Itself
```
/blog/?page=1  canonical → /blog/?page=1
/blog/?page=2  canonical → /blog/?page=2
/blog/?page=3  canonical → /blog/?page=3
```

**When to use**: Each page has unique content

**Implementation**:
```astro
<SEO canonical={`https://example.com/blog/?page=${currentPage}`} />
```

#### Strategy B: All Pages Point to Page 1
```
/blog/?page=1  canonical → /blog/
/blog/?page=2  canonical → /blog/
/blog/?page=3  canonical → /blog/
```

**When to use**: You want all ranking to consolidate to page 1

**Implementation**:
```astro
<SEO canonical="https://example.com/blog/" />
```

### 2. Multilingual Canonical URLs

For multilingual sites:

```html
<!-- English page -->
<link rel="canonical" href="https://example.com/en/about/" />
<link rel="alternate" hreflang="es" href="https://example.com/es/acerca/" />
<link rel="alternate" hreflang="fr" href="https://example.com/fr/a-propos/" />

<!-- Spanish page -->
<link rel="canonical" href="https://example.com/es/acerca/" />
<link rel="alternate" hreflang="en" href="https://example.com/en/about/" />
<link rel="alternate" hreflang="fr" href="https://example.com/fr/a-propos/" />
```

**Key Point**: Each language version is canonical to itself, with alternates for others

### 3. Mobile vs Desktop Canonical

If you have separate mobile and desktop sites:

```html
<!-- Desktop: https://www.example.com/page -->
<link rel="canonical" href="https://www.example.com/page" />
<link rel="alternate" media="only screen and (max-width: 640px)"
      href="https://m.example.com/page" />

<!-- Mobile: https://m.example.com/page -->
<link rel="canonical" href="https://www.example.com/page" />
```

**Best Practice**: Use responsive design to avoid this complexity

### 4. AMP Pages Canonical

For AMP pages:

```html
<!-- Regular page: https://example.com/article -->
<link rel="canonical" href="https://example.com/article" />
<link rel="amphtml" href="https://example.com/article/amp" />

<!-- AMP page: https://example.com/article/amp -->
<link rel="canonical" href="https://example.com/article" />
```

**Key Point**: AMP page points back to regular page as canonical

### 5. Dynamic Canonical URLs

For dynamic routes in Astro:

```astro
---
// pages/courses/[id].astro
import SEO from '@/components/SEO.astro';

const { id } = Astro.params;
const course = await getCourse(id);

// Canonical automatically generated from current URL
---

<SEO title={course.title} />
<!-- Result: https://example.com/courses/mindfulness-meditation/ -->
```

The utility automatically handles dynamic routes correctly.

---

## Further Reading

### Official Documentation
- [Google Search Central - Canonical URLs](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)
- [Moz - Canonical URL Tag Guide](https://moz.com/learn/seo/canonicalization)
- [Yoast - Canonical URLs Complete Guide](https://yoast.com/rel-canonical/)

### Technical Specifications
- [RFC 6596 - Canonical Link Relation](https://tools.ietf.org/html/rfc6596)
- [Astro Documentation - URL](https://docs.astro.build/en/reference/api-reference/#astrourl)

### Advanced SEO
- [Google - Pagination Best Practices](https://developers.google.com/search/docs/specialty/ecommerce/pagination-and-incremental-page-loading)
- [Google - International Targeting](https://developers.google.com/search/docs/specialty/international)
- [Moz - Duplicate Content Guide](https://moz.com/learn/seo/duplicate-content)

### Related Topics
- **Open Graph Protocol**: Social media meta tags
- **Structured Data**: JSON-LD schemas for rich snippets
- **Sitemap.xml**: URL discovery for search engines
- **Robots.txt**: Crawler directives

---

## Summary

### Key Takeaways

1. **Canonical URLs Prevent Duplicate Content**
   - Consolidate ranking signals to one URL
   - Prevent search engine penalties
   - Improve crawl efficiency

2. **Always Use Absolute URLs with HTTPS**
   - Never use relative canonical URLs
   - Always prefer HTTPS over HTTP
   - Include full domain

3. **Consistency is Critical**
   - Choose trailing slash strategy and stick to it
   - Apply same rules across entire site
   - Handle file extensions properly

4. **Remove Tracking Parameters**
   - Marketing URLs don't create duplicate content
   - Query parameters stripped from canonical
   - User still sees full URL with tracking

5. **Test Thoroughly**
   - 76 tests cover all scenarios
   - Edge cases handled properly
   - Real-world examples validated

### Implementation Checklist

- ✅ Created `canonicalUrl.ts` utility library
- ✅ Updated SEO component to use utility
- ✅ 76 comprehensive tests all passing
- ✅ Handles all edge cases properly
- ✅ Follows SEO best practices
- ✅ Production-ready implementation

### Next Steps

1. **Monitor Search Console**: Watch for duplicate content warnings
2. **Track Rankings**: Measure SEO improvement over time
3. **Audit Regularly**: Validate canonical URLs stay correct
4. **Update Sitemap**: Use canonical URLs in sitemap.xml
5. **Analytics**: Monitor traffic consolidation

---

## Questions and Answers

### Q: When should I use a custom canonical URL?

**A**: Use custom canonical when:
- Paginated content (pointing to page 1)
- Syndicated content (pointing to original)
- Multiple URLs legitimately show same content
- A/B testing with URL variations

Don't use custom canonical for regular pages - let it auto-generate.

### Q: What if I want to keep query parameters for some pages?

**A**: Pass custom options or custom canonical:

```astro
<SEO
  title="Search Results"
  canonical={`https://example.com/search/?q=${searchQuery}`}
/>
```

Or create a custom canonical URL:
```typescript
const canonical = generateCanonicalUrl(
  `/search/?q=${query}`,
  baseUrl,
  { removeQueryParams: false }
);
```

### Q: Do I need canonical URLs on every page?

**A**: Yes! Even pages without duplicate content should have self-referencing canonical URLs. It makes your intentions explicit to search engines.

### Q: What about trailing slashes on file extensions?

**A**: Never add trailing slashes to files:
- ✅ `/sitemap.xml`
- ❌ `/sitemap.xml/`

Our implementation automatically detects file extensions and skips the trailing slash.

### Q: Can I use canonical URLs to consolidate similar content?

**A**: No! Canonical URLs should only be used for truly duplicate or near-duplicate content. Don't try to use them to boost rankings of one page by pointing other pages to it.

### Q: What's the performance impact?

**A**: Minimal. The canonical URL generation runs server-side during page render. Execution time is < 1ms per page.

### Q: How do I test if it's working?

**A**: View page source and look for:
```html
<link rel="canonical" href="https://your-domain.com/page/" />
```

Also check Google Search Console for canonical URL issues.

---

**This guide was created as part of T228: Implement canonical URLs for all pages**

*Last Updated: 2025-11-06*
