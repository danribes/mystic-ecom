# T237: Hreflang Tags for Internationalization - Learning Guide

**Task ID**: T237
**Task Name**: Add hreflang tags for internationalization
**Date**: 2025-11-06
**Learning Level**: Intermediate

---

## Table of Contents

1. [Introduction to Hreflang](#introduction-to-hreflang)
2. [Why Hreflang Tags Matter](#why-hreflang-tags-matter)
3. [How Hreflang Works](#how-hreflang-works)
4. [Hreflang Syntax and Format](#hreflang-syntax-and-format)
5. [Implementation Architecture](#implementation-architecture)
6. [Core Concepts](#core-concepts)
7. [Implementation Deep Dive](#implementation-deep-dive)
8. [Best Practices](#best-practices)
9. [Common Pitfalls](#common-pitfalls)
10. [Testing and Validation](#testing-and-validation)
11. [Real-World Examples](#real-world-examples)
12. [Troubleshooting](#troubleshooting)

---

## Introduction to Hreflang

### What is Hreflang?

**Hreflang** is an HTML attribute that tells search engines about alternate language versions of a page. It's part of the `<link>` tag and helps search engines serve the correct language version to users based on their language preferences and location.

**Basic Format**:
```html
<link rel="alternate" hreflang="es" href="https://example.com/es/page" />
```

This tells search engines: "There's a Spanish (`es`) version of this page at `https://example.com/es/page`"

### Historical Context

**Before Hreflang** (Pre-2011):
- Search engines couldn't distinguish between translated pages and duplicate content
- International websites faced duplicate content penalties
- Users often landed on wrong language versions
- Manual geotargeting in Google Search Console was clunky

**After Hreflang** (2011-Present):
- Google introduced hreflang in 2011
- Bing, Yandex, and other search engines adopted it
- Became essential for international SEO
- Now a standard for multilingual websites

### Who Needs Hreflang?

✅ **You NEED hreflang if**:
- You have content in multiple languages
- You have regional variations (e.g., US English vs UK English)
- You want to avoid duplicate content issues
- You want users to see content in their language

❌ **You DON'T need hreflang if**:
- Your site only has one language
- You use a completely different domain for each language (e.g., `.es` vs `.com`)
- You don't care about international SEO

---

## Why Hreflang Tags Matter

### 1. Prevents Duplicate Content Issues

**The Problem**:

Imagine you have:
- English page: `https://example.com/courses/meditation`
- Spanish page: `https://example.com/es/courses/meditacion`

**Without hreflang**: Search engines might see these as duplicate content because they have similar structure, images, and possibly some overlapping keywords.

**With hreflang**: Search engines understand these are **alternate versions**, not duplicates.

**Impact**:
```
Without hreflang:
❌ Both pages compete in search results
❌ Link equity is divided
❌ Potential ranking penalty

With hreflang:
✓ Each page ranks in appropriate language searches
✓ Link equity is consolidated
✓ No duplicate content penalty
```

### 2. Improves User Experience

**Scenario 1: User in Spain**
```
User searches: "cursos de meditación"
Without hreflang: Might see English page
With hreflang: Sees Spanish page (/es/cursos/meditacion)
Result: Better UX, higher engagement
```

**Scenario 2: User in US with Spanish Preferences**
```
User's browser language: Spanish
Without hreflang: Sees English page
With hreflang: Automatically served Spanish version
Result: Personalized experience
```

### 3. Increases Click-Through Rates

**The Data**:
- Users are 2-3x more likely to click results in their native language
- Bounce rate decreases by ~40% when users land on correct language
- Conversion rates improve by 20-70% with proper language targeting

**Example**:
```
English speaker searching "meditation courses":
  Sees: "Meditation Courses | Spirituality Platform"
  CTR: 5%

Spanish speaker searching "cursos de meditación":
  Without hreflang: Sees English result
    CTR: 1.5%
  With hreflang: Sees "Cursos de Meditación | Plataforma..."
    CTR: 4.5% (3x improvement!)
```

### 4. Strengthens International SEO

**SEO Benefits**:

1. **Better Rankings**: Each language version ranks better in regional searches
2. **Consolidated Signals**: All versions share authority and trust signals
3. **No Cannibalization**: Versions don't compete against each other
4. **Regional Targeting**: Search engines understand geographic intent

**Example Impact**:
```
Before hreflang:
  US Google Search: English page ranks #15
  Spain Google Search: English page ranks #30 (poor UX)

After hreflang:
  US Google Search: English page ranks #8 (improved)
  Spain Google Search: Spanish page ranks #6 (localized content)
```

---

## How Hreflang Works

### The Matching Process

**Step 1: User Performs Search**
```
User: Spanish speaker in Mexico
Search query: "meditación para principiantes"
Browser language: es-MX
```

**Step 2: Search Engine Crawls Your Site**
```html
<!-- English page (/courses/meditation) -->
<link rel="alternate" hreflang="en" href="https://example.com/courses/meditation" />
<link rel="alternate" hreflang="es" href="https://example.com/es/cursos/meditacion" />
<link rel="alternate" hreflang="x-default" href="https://example.com/courses/meditation" />

<!-- Spanish page (/es/cursos/meditacion) -->
<link rel="alternate" hreflang="en" href="https://example.com/courses/meditation" />
<link rel="alternate" hreflang="es" href="https://example.com/es/cursos/meditacion" />
<link rel="alternate" hreflang="x-default" href="https://example.com/courses/meditation" />
```

**Step 3: Search Engine Matches**
```
User language: es
Available versions: en, es, x-default
Best match: es
Result: Shows https://example.com/es/cursos/meditacion
```

**Step 4: User Sees Localized Result**
```
Title: "Cursos de Meditación | Plataforma de Espiritualidad"
Description: "Aprende meditación con nuestros cursos en línea..."
URL: example.com/es/cursos/meditacion
```

### Bidirectional Linking Requirement

**CRITICAL**: Hreflang must be bidirectional!

**✅ Correct** (Bidirectional):
```html
<!-- English page -->
<link rel="alternate" hreflang="en" href=".../courses" />
<link rel="alternate" hreflang="es" href=".../es/courses" />

<!-- Spanish page -->
<link rel="alternate" hreflang="en" href=".../courses" />
<link rel="alternate" hreflang="es" href=".../es/courses" />
```
*Both pages reference each other*

**❌ Incorrect** (One-way):
```html
<!-- English page -->
<link rel="alternate" hreflang="es" href=".../es/courses" />

<!-- Spanish page -->
(no hreflang tags)
```
*Search engines will ignore incomplete signals*

### Self-Referencing Requirement

**Each page must include a hreflang link to itself**

**✅ Correct**:
```html
<!-- On English page (/courses) -->
<link rel="alternate" hreflang="en" href="https://example.com/courses" />
<link rel="alternate" hreflang="es" href="https://example.com/es/courses" />
```

**❌ Incorrect**:
```html
<!-- On English page (/courses) -->
<link rel="alternate" hreflang="es" href="https://example.com/es/courses" />
<!-- Missing self-reference to English version -->
```

---

## Hreflang Syntax and Format

### Basic Syntax

```html
<link rel="alternate" hreflang="[language]" href="[URL]" />
```

**Components**:
- `rel="alternate"`: Indicates an alternate version
- `hreflang="[language]"`: ISO 639-1 language code
- `href="[URL]"`: Absolute URL to alternate version

### Language Codes (ISO 639-1)

**Common Language Codes**:
```
en = English
es = Spanish (Español)
fr = French (Français)
de = German (Deutsch)
it = Italian (Italiano)
pt = Portuguese (Português)
ja = Japanese (日本語)
zh = Chinese (中文)
ar = Arabic (العربية)
ru = Russian (Русский)
```

**Full list**: https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes

### Regional Variants

**Format**: `language-REGION`

```html
<!-- English variants -->
<link rel="alternate" hreflang="en-US" href=".../en-us/page" /> <!-- American English -->
<link rel="alternate" hreflang="en-GB" href=".../en-gb/page" /> <!-- British English -->
<link rel="alternate" hreflang="en-AU" href=".../en-au/page" /> <!-- Australian English -->

<!-- Spanish variants -->
<link rel="alternate" hreflang="es-ES" href=".../es-es/page" /> <!-- Spain Spanish -->
<link rel="alternate" hreflang="es-MX" href=".../es-mx/page" /> <!-- Mexican Spanish -->
<link rel="alternate" hreflang="es-AR" href=".../es-ar/page" /> <!-- Argentine Spanish -->
```

**When to use regional variants**:
- Currency differences ($ vs £ vs €)
- Spelling differences (color vs colour)
- Cultural differences (date formats, terminology)
- Legal requirements (different privacy policies)

### X-Default Tag

**Purpose**: Fallback for users whose language doesn't match any hreflang

**Syntax**:
```html
<link rel="alternate" hreflang="x-default" href="https://example.com/page" />
```

**When It's Used**:
1. User's language isn't available (e.g., French user, but you only have English/Spanish)
2. User's region doesn't match (e.g., Canadian user with en-CA, but you only have en-US)
3. Language detection fails or is ambiguous

**Best Practice**: Point to your most universal language (usually English)

### Absolute URLs Requirement

**✅ Correct** (Absolute):
```html
<link rel="alternate" hreflang="es" href="https://example.com/es/page" />
```

**❌ Incorrect** (Relative):
```html
<link rel="alternate" hreflang="es" href="/es/page" />
```

**Why Absolute?**: Search engines need the full URL including protocol and domain to properly identify pages across different domains or subdomains.

---

## Implementation Architecture

### System Design

Our implementation has three layers:

```
┌─────────────────────────────────────┐
│      Astro Components Layer         │
│    (SEO.astro uses hreflang)        │
│  - Automatic tag generation         │
│  - No configuration needed          │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│      Hreflang Utility Layer         │
│  (src/lib/hreflang.ts)              │
│  - generateHreflangLinks()          │
│  - validateHreflangLinks()          │
│  - Helper functions                 │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│        i18n Foundation Layer        │
│  (src/i18n/index.ts)                │
│  - LOCALES: ['en', 'es']            │
│  - getLocalizedPath()               │
│  - URL structure rules              │
└─────────────────────────────────────┘
```

### File Structure

```
src/
├── lib/
│   └── hreflang.ts              # Hreflang utilities (NEW)
├── components/
│   └── SEO.astro                # SEO component (MODIFIED)
├── i18n/
│   └── index.ts                 # i18n config (EXISTING)
└── middleware/
    └── i18n.ts                  # Locale detection (EXISTING)

tests/
└── unit/
    └── T237_hreflang.test.ts    # Comprehensive tests (NEW)
```

### Integration Points

**1. i18n System**:
```typescript
// hreflang.ts imports from i18n
import { LOCALES, DEFAULT_LOCALE, getLocalizedPath } from '../i18n';

// Uses locale configuration
for (const locale of LOCALES) {
  const localizedPath = getLocalizedPath(locale, path);
  // Generate hreflang link
}
```

**2. Astro Middleware**:
```typescript
// Middleware sets locale in context
Astro.locals.locale = 'es';

// Hreflang uses current locale
const hreflangLinks = generateHreflangFromAstro(
  Astro.url,
  Astro.site,
  Astro.locals.locale // From middleware
);
```

**3. SEO Component**:
```astro
<!-- SEO.astro automatically includes hreflang -->
<SEO title="Page Title" />

<!-- Renders -->
<link rel="alternate" hreflang="en" href="..." />
<link rel="alternate" hreflang="es" href="..." />
<link rel="alternate" hreflang="x-default" href="..." />
```

---

## Core Concepts

### 1. Locale vs Language

**Locale**: Language + optional region
- Examples: `en`, `en-US`, `es-MX`
- Used in URLs and configuration

**Language**: Just the language code
- Examples: `en`, `es`, `fr`
- ISO 639-1 standard

**In Our System**:
```typescript
export type Locale = 'en' | 'es'; // Simple language codes
// Could extend to: 'en-US' | 'en-GB' | 'es-ES' | 'es-MX'
```

### 2. URL Structure Patterns

**Pattern 1: Language Prefix** (Our Implementation)
```
English: example.com/courses
Spanish: example.com/es/courses
```

**Pattern 2: Subdomain**
```
English: en.example.com/courses
Spanish: es.example.com/courses
```

**Pattern 3: Top-Level Domain**
```
English: example.com/courses
Spanish: example.es/courses
```

**Pattern 4: Query Parameter** (Not Recommended)
```
English: example.com/courses
Spanish: example.com/courses?lang=es
```

**Our Choice**: Language prefix (Pattern 1)
- **Pros**: Simple, SEO-friendly, works with single domain
- **Cons**: Longer URLs for non-default languages

### 3. Path Normalization

**Challenge**: Path might already have a locale prefix

**Example**:
```
Current URL: /es/courses/meditation
Need to generate:
  - English: /courses/meditation
  - Spanish: /es/courses/meditation
```

**Solution**: Strip prefix first, then regenerate

```typescript
// Remove any existing locale prefix
const cleanPath = path.replace(/^\/(en|es)\//, '/');
// Result: '/courses/meditation'

// Then add back as needed
getLocalizedPath('en', cleanPath) // '/courses/meditation'
getLocalizedPath('es', cleanPath) // '/es/courses/meditation'
```

### 4. Absolute URL Generation

**Components Needed**:
```
Protocol: https://
Domain: example.com
Path: /es/courses/meditation
```

**Generation**:
```typescript
const baseUrl = 'https://example.com';
const localizedPath = '/es/courses/meditation';
const absoluteUrl = `${baseUrl}${localizedPath}`;
// Result: 'https://example.com/es/courses/meditation'
```

**Edge Cases**:
```typescript
// Trailing slash on baseUrl
'https://example.com/' + '/courses' = 'https://example.com//courses' ❌

// Solution: Remove trailing slash
const normalizedBase = baseUrl.replace(/\/$/, '');
normalizedBase + '/courses' = 'https://example.com/courses' ✓
```

---

## Implementation Deep Dive

### Core Function: generateHreflangLinks()

**Full Implementation**:

```typescript
export function generateHreflangLinks(options: HreflangOptions): HreflangLink[] {
  const {
    baseUrl,
    path,
    currentLocale = DEFAULT_LOCALE,
    locales = LOCALES,
    includeDefault = true,
    defaultLocale = DEFAULT_LOCALE,
  } = options;

  // Step 1: Normalize baseUrl (remove trailing slash)
  const normalizedBaseUrl = baseUrl.replace(/\/$/, '');

  // Step 2: Normalize path (add leading slash)
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  // Step 3: Clean existing locale prefix
  const cleanPath = normalizedPath.replace(/^\/(en|es)\//, '/');

  const links: HreflangLink[] = [];

  // Step 4: Generate link for each locale
  for (const locale of locales) {
    const localizedPath = getLocalizedPath(locale, cleanPath);
    const absoluteUrl = `${normalizedBaseUrl}${localizedPath}`;

    links.push({
      hreflang: locale,
      href: absoluteUrl,
      lang: locale === 'en' ? 'English' : 'Español',
    });
  }

  // Step 5: Add x-default if requested
  if (includeDefault) {
    const defaultPath = getLocalizedPath(defaultLocale, cleanPath);
    const defaultUrl = `${normalizedBaseUrl}${defaultPath}`;

    links.push({
      hreflang: 'x-default',
      href: defaultUrl,
      lang: 'Default',
    });
  }

  return links;
}
```

**Step-by-Step Walkthrough**:

**Input**:
```typescript
{
  baseUrl: 'https://spirituality-platform.com/',
  path: '/es/courses/meditation',
  currentLocale: 'es'
}
```

**Step 1: Normalize baseUrl**
```typescript
baseUrl = 'https://spirituality-platform.com/'
normalizedBaseUrl = 'https://spirituality-platform.com' // Removed trailing /
```

**Step 2: Normalize path**
```typescript
path = '/es/courses/meditation'
normalizedPath = '/es/courses/meditation' // Already has leading /
```

**Step 3: Clean locale prefix**
```typescript
normalizedPath = '/es/courses/meditation'
cleanPath = '/courses/meditation' // Removed /es/
```

**Step 4: Generate links**
```typescript
For locale 'en':
  localizedPath = getLocalizedPath('en', '/courses/meditation')
  localizedPath = '/courses/meditation' // No prefix for default locale
  absoluteUrl = 'https://spirituality-platform.com/courses/meditation'

For locale 'es':
  localizedPath = getLocalizedPath('es', '/courses/meditation')
  localizedPath = '/es/courses/meditation' // Adds /es/ prefix
  absoluteUrl = 'https://spirituality-platform.com/es/courses/meditation'
```

**Step 5: Add x-default**
```typescript
defaultLocale = 'en'
defaultPath = getLocalizedPath('en', '/courses/meditation')
defaultPath = '/courses/meditation'
defaultUrl = 'https://spirituality-platform.com/courses/meditation'

links.push({
  hreflang: 'x-default',
  href: 'https://spirituality-platform.com/courses/meditation',
  lang: 'Default'
});
```

**Final Output**:
```typescript
[
  {
    hreflang: 'en',
    href: 'https://spirituality-platform.com/courses/meditation',
    lang: 'English'
  },
  {
    hreflang: 'es',
    href: 'https://spirituality-platform.com/es/courses/meditation',
    lang: 'Español'
  },
  {
    hreflang: 'x-default',
    href: 'https://spirituality-platform.com/courses/meditation',
    lang: 'Default'
  }
]
```

### Validation Function

**Purpose**: Ensure hreflang links follow best practices

**Checks**:
1. ✓ All URLs are absolute
2. ✓ X-default is present
3. ✓ No duplicate hreflang values
4. ✓ All locales are covered

**Implementation**:
```typescript
export function validateHreflangLinks(
  links: HreflangLink[],
  options = {}
): { isValid: boolean; warnings: string[] } {
  const warnings: string[] = [];

  // Check 1: Non-empty
  if (links.length === 0) {
    warnings.push('No hreflang links provided');
    return { isValid: false, warnings };
  }

  // Check 2: X-default presence
  const hasDefault = links.some(link => link.hreflang === 'x-default');
  if (requireDefault && !hasDefault) {
    warnings.push('Missing x-default hreflang tag');
  }

  // Check 3: Absolute URLs
  if (requireAbsoluteUrls) {
    for (const link of links) {
      if (!link.href.startsWith('http://') && !link.href.startsWith('https://')) {
        warnings.push(`URL not absolute: ${link.href}`);
      }
    }
  }

  // Check 4: No duplicates
  const hreflangs = links.map(link => link.hreflang);
  const unique = new Set(hreflangs);
  if (hreflangs.length !== unique.size) {
    warnings.push('Duplicate hreflang values detected');
  }

  // Check 5: Locale coverage
  const localeLinks = links.filter(l => l.hreflang !== 'x-default');
  if (localeLinks.length < LOCALES.length) {
    warnings.push('Not all locales covered');
  }

  return {
    isValid: warnings.length === 0,
    warnings,
  };
}
```

---

## Best Practices

### 1. Always Use Absolute URLs ✅

```html
<!-- ✅ Correct -->
<link rel="alternate" hreflang="es" href="https://example.com/es/page" />

<!-- ❌ Wrong -->
<link rel="alternate" hreflang="es" href="/es/page" />
```

### 2. Include X-Default ✅

```html
<!-- ✅ Correct -->
<link rel="alternate" hreflang="en" href="https://example.com/page" />
<link rel="alternate" hreflang="es" href="https://example.com/es/page" />
<link rel="alternate" hreflang="x-default" href="https://example.com/page" />
```

### 3. Ensure Bidirectional Linking ✅

```html
<!-- English page (/page) -->
<link rel="alternate" hreflang="en" href="https://example.com/page" />
<link rel="alternate" hreflang="es" href="https://example.com/es/page" />

<!-- Spanish page (/es/page) -->
<link rel="alternate" hreflang="en" href="https://example.com/page" />
<link rel="alternate" hreflang="es" href="https://example.com/es/page" />
```

### 4. Include Self-Reference ✅

```html
<!-- On English page -->
<link rel="alternate" hreflang="en" href="https://example.com/page" /> <!-- Self-reference -->
<link rel="alternate" hreflang="es" href="https://example.com/es/page" />
```

### 5. Use ISO 639-1 Language Codes ✅

```html
<!-- ✅ Correct -->
<link rel="alternate" hreflang="en" href="..." /> <!-- ISO 639-1 -->

<!-- ❌ Wrong -->
<link rel="alternate" hreflang="eng" href="..." /> <!-- ISO 639-2 -->
```

### 6. Avoid Redirect Chains ✅

```html
<!-- ❌ Bad: URL redirects to another page -->
<link rel="alternate" hreflang="es" href="https://example.com/es/old-page" />
<!-- This redirects to /es/new-page - search engines may ignore -->

<!-- ✅ Good: Direct link to final page -->
<link rel="alternate" hreflang="es" href="https://example.com/es/new-page" />
```

### 7. Keep URLs Consistent ✅

```html
<!-- ✅ Correct: Consistent structure -->
English: /courses/meditation
Spanish: /es/courses/meditation
French: /fr/courses/meditation

<!-- ❌ Wrong: Inconsistent structure -->
English: /courses/meditation
Spanish: /cursos/meditacion
French: /fr/meditation-course
```

---

## Common Pitfalls

### Pitfall 1: Relative URLs

**❌ Wrong**:
```html
<link rel="alternate" hreflang="es" href="/es/page" />
```

**Problem**: Search engines need absolute URLs to correctly identify pages.

**✅ Fix**:
```html
<link rel="alternate" hreflang="es" href="https://example.com/es/page" />
```

### Pitfall 2: Missing X-Default

**❌ Wrong**:
```html
<link rel="alternate" hreflang="en" href="https://example.com/page" />
<link rel="alternate" hreflang="es" href="https://example.com/es/page" />
<!-- No x-default -->
```

**Problem**: No fallback for users whose language isn't available.

**✅ Fix**:
```html
<link rel="alternate" hreflang="en" href="https://example.com/page" />
<link rel="alternate" hreflang="es" href="https://example.com/es/page" />
<link rel="alternate" hreflang="x-default" href="https://example.com/page" />
```

### Pitfall 3: One-Way Linking

**❌ Wrong**:
```html
<!-- English page has hreflang -->
<link rel="alternate" hreflang="es" href="https://example.com/es/page" />

<!-- Spanish page has NO hreflang -->
```

**Problem**: Search engines require bidirectional confirmation.

**✅ Fix**: Both pages must have complete hreflang tags.

### Pitfall 4: Missing Self-Reference

**❌ Wrong**:
```html
<!-- On English page -->
<link rel="alternate" hreflang="es" href="https://example.com/es/page" />
<!-- Missing self-reference to English -->
```

**✅ Fix**:
```html
<!-- On English page -->
<link rel="alternate" hreflang="en" href="https://example.com/page" />
<link rel="alternate" hreflang="es" href="https://example.com/es/page" />
```

### Pitfall 5: Linking to Redirects

**❌ Wrong**:
```html
<link rel="alternate" hreflang="es" href="https://example.com/es/old" />
<!-- This URL redirects to /es/new -->
```

**Problem**: Redirect chains confuse search engines.

**✅ Fix**:
```html
<link rel="alternate" hreflang="es" href="https://example.com/es/new" />
```

### Pitfall 6: Duplicate Hreflang Values

**❌ Wrong**:
```html
<link rel="alternate" hreflang="en" href="https://example.com/page1" />
<link rel="alternate" hreflang="en" href="https://example.com/page2" />
<!-- Two different URLs for same hreflang -->
```

**Problem**: Search engines don't know which is the correct alternate.

**✅ Fix**: Only one URL per hreflang value.

---

## Testing and Validation

### Google Search Console

**Steps**:
1. Add all language versions to Search Console
2. Wait for indexing (1-2 weeks)
3. Go to "International Targeting" report
4. Check for hreflang errors

**Common Errors Reported**:
- "No return tag" (bidirectional issue)
- "Incorrect hreflang" (wrong ISO code)
- "Missing x-default"
- "Conflicting hreflang"

### Testing Tools

**1. hreflang Tags Testing Tool**
- URL: https://www.aleydasolis.com/english/international-seo-tools/hreflang-tags-generator/
- Tests: Bidirectional linking, syntax, self-reference

**2. Google Rich Results Test**
- URL: https://search.google.com/test/rich-results
- Not specifically for hreflang, but validates overall markup

**3. Built-in Validation**:
```typescript
import { generateHreflangLinks, validateHreflangLinks } from '@/lib/hreflang';

const links = generateHreflangLinks({ ... });
const validation = validateHreflangLinks(links);

if (!validation.isValid) {
  console.error('Hreflang issues:', validation.warnings);
}
```

### Manual Verification

**Check Rendered HTML**:
```bash
curl https://your-site.com/page | grep hreflang
```

**Should show**:
```html
<link rel="alternate" hreflang="en" href="https://your-site.com/page" />
<link rel="alternate" hreflang="es" href="https://your-site.com/es/page" />
<link rel="alternate" hreflang="x-default" href="https://your-site.com/page" />
```

---

## Real-World Examples

### Example 1: Course Page

**URL**: `/courses/mindfulness-meditation`

**Generated Hreflang**:
```html
<link rel="alternate" hreflang="en"
      href="https://spirituality-platform.com/courses/mindfulness-meditation" />
<link rel="alternate" hreflang="es"
      href="https://spirituality-platform.com/es/courses/mindfulness-meditation" />
<link rel="alternate" hreflang="x-default"
      href="https://spirituality-platform.com/courses/mindfulness-meditation" />
```

**User Experience**:
- English user in US → Sees English page
- Spanish user in Mexico → Sees Spanish page
- French user (no French version) → Sees English page (x-default)

### Example 2: Blog Post

**URLs**:
- English: `/blog/benefits-of-meditation`
- Spanish: `/es/blog/beneficios-de-la-meditacion`

**Hreflang Tags**:
```html
<link rel="alternate" hreflang="en"
      href="https://spirituality-platform.com/blog/benefits-of-meditation" />
<link rel="alternate" hreflang="es"
      href="https://spirituality-platform.com/es/blog/beneficios-de-la-meditacion" />
<link rel="alternate" hreflang="x-default"
      href="https://spirituality-platform.com/blog/benefits-of-meditation" />
```

### Example 3: Product Page with Query Parameters

**URL**: `/products/meditation-guide?utm_source=email`

**Generated Hreflang** (query params preserved):
```html
<link rel="alternate" hreflang="en"
      href="https://spirituality-platform.com/products/meditation-guide?utm_source=email" />
<link rel="alternate" hreflang="es"
      href="https://spirituality-platform.com/es/products/meditation-guide?utm_source=email" />
```

**Note**: Our implementation preserves query parameters automatically.

---

## Troubleshooting

### Issue 1: Hreflang Tags Not Showing

**Symptoms**: View page source, no hreflang tags

**Diagnosis**:
```bash
# Check if SEO component is included
curl https://your-site.com/page | grep "alternate"
```

**Solutions**:
1. Ensure `<SEO />` component is in page `<head>`
2. Check Astro.locals.locale is set correctly
3. Verify hreflang generation isn't throwing errors

### Issue 2: Wrong Language Version Shown

**Symptoms**: Spanish users see English page

**Diagnosis**:
- Check hreflang tags are bidirectional
- Verify x-default points to correct page
- Wait for search engines to re-crawl (can take weeks)

**Solutions**:
1. Ensure both pages have complete hreflang tags
2. Request re-indexing in Google Search Console
3. Check robots.txt isn't blocking pages

### Issue 3: Duplicate Content Warnings

**Symptoms**: Google Search Console shows duplicate content

**Diagnosis**:
- Hreflang tags missing or incorrect
- Bidirectional linking broken
- Self-references missing

**Solutions**:
1. Run validation: `validateHreflangLinks()`
2. Check every page has all required tags
3. Ensure URLs are absolute, not relative

### Issue 4: X-Default Not Working

**Symptoms**: Users with unsupported languages see wrong page

**Solutions**:
1. Verify x-default tag is present
2. Ensure x-default URL is accessible
3. Check x-default points to your most universal language

---

## Summary

### Key Takeaways

1. **Hreflang is essential for multilingual sites**
   - Prevents duplicate content
   - Improves user experience
   - Boosts international SEO

2. **Implementation requirements**
   - Absolute URLs only
   - Bidirectional linking
   - Self-referencing
   - X-default for fallback

3. **Our implementation is automatic**
   - SEO component handles everything
   - Works with existing i18n system
   - No manual configuration needed

4. **Validation is built-in**
   - `validateHreflangLinks()` catches errors
   - Tests ensure correctness
   - Google Search Console for production monitoring

5. **Extensible design**
   - Easy to add new languages
   - Supports regional variants
   - Can customize per page

### Quick Reference

**Generate hreflang links**:
```typescript
import { generateHreflangLinks } from '@/lib/hreflang';

const links = generateHreflangLinks({
  baseUrl: 'https://example.com',
  path: '/courses/meditation'
});
```

**Use in Astro component**:
```astro
---
import { generateHreflangFromAstro } from '@/lib/hreflang';

const hreflangLinks = generateHreflangFromAstro(
  Astro.url,
  Astro.site,
  Astro.locals.locale
);
---

{hreflangLinks.map(link => (
  <link rel="alternate" hreflang={link.hreflang} href={link.href} />
))}
```

**Validate**:
```typescript
import { validateHreflangLinks } from '@/lib/hreflang';

const validation = validateHreflangLinks(links);
if (!validation.isValid) {
  console.warn(validation.warnings);
}
```

---

## Further Reading

### Official Documentation

- **Google**: https://developers.google.com/search/docs/specialty/international/localized-versions
- **Bing**: https://www.bing.com/webmasters/help/hreflang-meta-element-for-language-regionalization-2ea49e82
- **Yandex**: https://yandex.com/support/webmaster/geolocation/hreflang.html

### Tools

- **hreflang Validator**: https://www.aleydasolis.com/english/international-seo-tools/hreflang-tags-generator/
- **Google Search Console**: https://search.google.com/search-console
- **Screaming Frog SEO Spider**: https://www.screamingfrog.co.uk/seo-spider/

### Related Code

- `src/lib/hreflang.ts` - Hreflang utilities
- `src/i18n/index.ts` - i18n configuration
- `src/components/SEO.astro` - SEO component
- `tests/unit/T237_hreflang.test.ts` - Comprehensive tests

---

**Guide Completed**: 2025-11-06
**Complexity Level**: Intermediate
**Estimated Study Time**: 2-3 hours
**Prerequisites**: Basic understanding of SEO, HTML, internationalization concepts
