# T228: Canonical URLs Implementation Log

## Task Information
- **Task ID**: T228
- **Task Name**: Implement canonical URLs for all pages
- **Priority**: [P] Priority
- **Date**: 2025-11-06
- **Status**: ✅ Completed

## Objective
Implement canonical URLs for all pages to prevent duplicate content issues and improve SEO. Canonical URLs ensure that search engines understand which version of a URL is the "official" one, especially when the same content might be accessible through multiple URLs (with/without trailing slashes, with tracking parameters, HTTP vs HTTPS, etc.).

## Implementation Summary

### 1. Files Created
1. **`/home/dan/web/src/lib/canonicalUrl.ts`** (337 lines)
   - Core utility library for canonical URL generation
   - Provides 5 main functions with comprehensive options

### 2. Files Modified
1. **`/home/dan/web/src/components/SEO.astro`**
   - Updated to use new canonical URL utility
   - Replaced basic canonical URL generation with robust implementation
   - Added import for `generateCanonicalUrlFromAstro`

### 3. Test Files
1. **`/home/dan/web/tests/unit/T228_canonical_urls.test.ts`** (588 lines)
   - 76 comprehensive tests covering all functionality
   - Tests for edge cases, real-world scenarios, and validation

## Technical Implementation

### Core Functions

#### 1. `generateCanonicalUrl(pathname, baseUrl, options)`
The main function that generates a canonical URL from a pathname and base URL.

**Features**:
- Adds/removes trailing slashes consistently
- Forces HTTPS protocol
- Removes query parameters (tracking params like utm_source)
- Removes URL fragments (hash values)
- Handles file extensions (no trailing slash for .xml, .txt, .json)
- Optional lowercase conversion
- Normalizes multiple consecutive slashes

**Options**:
```typescript
interface CanonicalUrlOptions {
  trailingSlash?: boolean;      // default: true
  forceHttps?: boolean;          // default: true
  removeQueryParams?: boolean;   // default: true
  removeFragment?: boolean;      // default: true
  lowercase?: boolean;           // default: false
}
```

**Examples**:
```typescript
generateCanonicalUrl('/about', 'https://example.com')
// Returns: "https://example.com/about/"

generateCanonicalUrl('/courses/123?utm_source=email', 'https://example.com')
// Returns: "https://example.com/courses/123/"

generateCanonicalUrl('/sitemap.xml', 'https://example.com')
// Returns: "https://example.com/sitemap.xml" (no trailing slash for files)
```

#### 2. `generateCanonicalUrlFromAstro(astroUrl, astroSite, customCanonical, options)`
Astro-specific wrapper function that works with Astro's URL objects.

**Features**:
- Works seamlessly with `Astro.url` and `Astro.site`
- Supports custom canonical URLs
- Falls back gracefully when `Astro.site` is undefined
- Applies same transformations as core function

**Usage in Components**:
```astro
---
import { generateCanonicalUrlFromAstro } from '@/lib/canonicalUrl';

const canonical = generateCanonicalUrlFromAstro(
  Astro.url,
  Astro.site,
  undefined,
  {
    trailingSlash: true,
    forceHttps: true,
    removeQueryParams: true,
    removeFragment: true,
  }
);
---
<link rel="canonical" href={canonical} />
```

#### 3. `validateCanonicalUrl(url)`
Validates if a URL is properly formatted as a canonical URL.

**Checks**:
- Uses HTTPS protocol
- No query parameters
- No URL fragments
- Has trailing slash (except for file extensions)
- No double slashes in path
- Valid URL format

**Returns**:
```typescript
{
  valid: boolean;
  issues: string[];
}
```

**Example**:
```typescript
validateCanonicalUrl('https://example.com/about/')
// Returns: { valid: true, issues: [] }

validateCanonicalUrl('http://example.com/about?page=2')
// Returns: {
//   valid: false,
//   issues: ['Should use HTTPS protocol', 'Contains query parameters']
// }
```

#### 4. `normalizeUrls(urls, options)`
Normalizes multiple URL variations to a single canonical format.

**Use Case**: Checking if multiple URLs point to the same resource.

**Example**:
```typescript
normalizeUrls([
  'https://example.com/about',
  'http://example.com/about/',
  'https://example.com/about?utm_source=email'
])
// Returns: [
//   'https://example.com/about/',
//   'https://example.com/about/',
//   'https://example.com/about/'
// ]
// All resolve to the same canonical URL
```

#### 5. `areUrlsEquivalent(url1, url2, options)`
Checks if two URLs are canonically equivalent.

**Example**:
```typescript
areUrlsEquivalent(
  'https://example.com/about',
  'http://example.com/about?utm_source=email'
)
// Returns: true (same canonical URL after normalization)
```

### Implementation Details

#### Query Parameter and Fragment Handling
The implementation correctly handles query parameters and fragments by:
1. Extracting them from the pathname first
2. Processing the base path (adding trailing slash, etc.)
3. Adding them back only if the options allow it

This ensures the trailing slash appears before query parameters and fragments:
```
✅ Correct: https://example.com/about/?page=2
❌ Wrong:   https://example.com/about?page=2/
```

#### File Extension Detection
Uses regex `/\.[a-zA-Z0-9]+$/` to detect file extensions and skip trailing slash:
```typescript
'https://example.com/sitemap.xml'  // No trailing slash
'https://example.com/robots.txt'   // No trailing slash
'https://example.com/manifest.json' // No trailing slash
'https://example.com/about/'       // Has trailing slash
```

#### HTTPS Enforcement
Automatically converts HTTP URLs to HTTPS by default:
```typescript
if (opts.forceHttps && cleanBaseUrl.startsWith('http://')) {
  cleanBaseUrl = cleanBaseUrl.replace(/^http:\/\//, 'https://');
}
```

### SEO Component Integration

Updated `/home/dan/web/src/components/SEO.astro` to use the new utility:

**Before**:
```typescript
const canonicalURL = canonical || (Astro.site
  ? new URL(Astro.url.pathname, Astro.site).href
  : `${siteUrl}${Astro.url.pathname}`);
```

**After**:
```typescript
const canonicalURL = generateCanonicalUrlFromAstro(
  Astro.url,
  Astro.site,
  canonical,
  {
    trailingSlash: true,
    forceHttps: true,
    removeQueryParams: true,
    removeFragment: true,
  }
);
```

## Test Results

### Test Coverage
- **Total Tests**: 76
- **Passing Tests**: 76 (100%)
- **Test Duration**: 30ms

### Test Categories

1. **generateCanonicalUrl** (32 tests)
   - Basic Functionality (5 tests)
   - Trailing Slash Handling (6 tests)
   - HTTPS Enforcement (3 tests)
   - Query Parameter Handling (3 tests)
   - Fragment Handling (3 tests)
   - Path Normalization (6 tests)
   - Lowercase Conversion (2 tests)
   - Complex Scenarios (4 tests)

2. **generateCanonicalUrlFromAstro** (7 tests)
   - Astro context handling
   - Custom canonical URLs
   - Query params and fragments
   - Custom options

3. **validateCanonicalUrl** (11 tests)
   - Valid URLs (3 tests)
   - Invalid URLs (7 tests)
   - Multiple issues detection

4. **normalizeUrls** (4 tests)
   - Multiple URL variations
   - Different paths
   - Invalid URL handling
   - Custom options

5. **areUrlsEquivalent** (6 tests)
   - Equivalence detection
   - Different URLs
   - Trailing slash variations
   - Domain differences

6. **Edge Cases** (6 tests)
   - Empty strings
   - Special characters
   - International characters
   - Numbers, hyphens, underscores
   - Long paths

7. **Real-World Scenarios** (10 tests)
   - Course pages with tracking params
   - Event pages with dates
   - Blog posts with date structure
   - Static pages (about, contact, terms, privacy)
   - Special files (sitemap.xml, robots.txt, manifest.json)

### Issues Found and Fixed

#### Issue 1: Invalid Assertion Method
**Problem**: Test used `toStartWith()` which is not a valid Vitest/Chai assertion.

**Error**:
```
Invalid Chai property: toStartWith
```

**Fix**: Replaced with `toBe()` to check exact value:
```typescript
// Before
expect(result).toStartWith('https://');

// After
expect(result).toBe('https://example.com/about/');
```

#### Issue 2: Trailing Slash Placement
**Problem**: When query parameters or fragments were kept (options disabled), the trailing slash was being added after them instead of before.

**Error**:
```
Expected: "https://example.com/about/?page=2"
Received: "https://example.com/about?page=2/"
```

**Root Cause**: The function was processing the entire pathname including query params and fragments, then adding the trailing slash at the end.

**Fix**: Refactored to:
1. Extract query params and fragments first
2. Process the base path (add trailing slash)
3. Add back query params and fragments at the end

**Code**:
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

// ... process cleanPathname (add trailing slash) ...

// Add back query parameters and fragments based on options
if (!opts.removeQueryParams && queryString) {
  cleanPathname += queryString;
}

if (!opts.removeFragment && fragment) {
  cleanPathname += fragment;
}
```

## SEO Benefits

### 1. Duplicate Content Prevention
Canonical URLs tell search engines which version of a URL is the "official" one:
```
https://example.com/courses/mindfulness      → redirects to
https://example.com/courses/mindfulness/     ← canonical
http://example.com/courses/mindfulness/      → same canonical
https://example.com/courses/mindfulness?utm_source=email  → same canonical
```

### 2. Link Equity Consolidation
All backlinks and social shares pointing to different URL variations count toward the canonical URL, improving ranking power.

### 3. Consistent Indexing
Search engines index the canonical version, preventing multiple entries for the same content.

### 4. Better User Experience
- Consistent URLs in browser address bar
- Cleaner URLs when sharing (no tracking params)
- Proper HTTPS everywhere

### 5. Tracking Parameter Removal
Marketing URLs with tracking params still work but don't create duplicate content:
```
User clicks: https://example.com/courses/meditation?utm_source=newsletter&utm_medium=email
Canonical:   https://example.com/courses/meditation/
```

## Best Practices Implemented

1. **Always Use HTTPS**: All canonical URLs use HTTPS protocol
2. **Trailing Slash Consistency**: All directory URLs end with `/`
3. **No Query Parameters**: Tracking params removed from canonical URLs
4. **No Fragments**: Hash values removed from canonical URLs
5. **File Extensions Handled**: `.xml`, `.txt`, `.json` files don't get trailing slashes
6. **Absolute URLs**: Always use full URLs including domain
7. **Lowercase Paths**: Optional lowercase conversion for consistency

## Usage Across the Site

The canonical URL utility is now automatically used by the SEO component, which means:

- ✅ Home page (`/`)
- ✅ Static pages (`/about/`, `/contact/`, `/privacy-policy/`, etc.)
- ✅ Course pages (`/courses/`, `/courses/:id/`)
- ✅ Event pages (`/events/`, `/events/:id/`)
- ✅ Blog pages (`/blog/`, `/blog/:slug/`)
- ✅ Category pages (`/courses/category/:category/`)
- ✅ Search pages (`/search/`)
- ✅ Dashboard pages (`/dashboard/*`)
- ✅ Special files (`/sitemap.xml`, `/robots.txt`, `/manifest.json`)

All pages using the `<SEO>` component automatically get proper canonical URLs.

## Performance Impact

- **Utility Function**: Lightweight, runs in < 1ms
- **No External Dependencies**: Pure TypeScript, no additional libraries
- **Build Time**: No impact (runs at server-side render time)
- **Runtime**: Negligible performance impact

## Configuration

Default configuration in `SEO.astro`:
```typescript
{
  trailingSlash: true,      // Add trailing slashes
  forceHttps: true,         // Convert HTTP to HTTPS
  removeQueryParams: true,  // Remove tracking params
  removeFragment: true,     // Remove hash fragments
}
```

Can be customized per page if needed:
```astro
<SEO
  title="Special Page"
  canonical="https://example.com/special-url"
/>
```

## Future Enhancements

Potential improvements for future iterations:

1. **Sitemap Integration**: Use canonical URLs in sitemap generation
2. **Redirect Rules**: Auto-generate redirect rules for non-canonical URLs
3. **Analytics Integration**: Track canonical vs non-canonical page views
4. **Multilingual Support**: Handle locale-specific canonical URLs
5. **AMP Pages**: Canonical links between AMP and regular versions
6. **Mobile/Desktop**: Canonical links for separate mobile sites

## References

- [Google Search Central - Canonical URLs](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)
- [Moz - Canonical URL Tag Guide](https://moz.com/learn/seo/canonicalization)
- [Astro Documentation - URL](https://docs.astro.build/en/reference/api-reference/#astrourl)

## Conclusion

Successfully implemented comprehensive canonical URL functionality across the entire site. The implementation:
- ✅ Prevents duplicate content issues
- ✅ Consolidates link equity
- ✅ Improves SEO performance
- ✅ Provides consistent URL formatting
- ✅ Handles edge cases properly
- ✅ Is well-tested (76 passing tests)
- ✅ Is production-ready

All pages now have proper canonical URLs that follow SEO best practices.
