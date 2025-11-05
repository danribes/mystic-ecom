# Internationalization (i18n) Implementation Guide

**Platform**: Spirituality E-Commerce Platform
**Languages Supported**: English (en), Spanish (es)
**Last Updated**: November 4, 2025
**Version**: 1.0

---

## Table of Contents

1. [Introduction](#introduction)
2. [Architecture Overview](#architecture-overview)
3. [Core Components](#core-components)
4. [Setup and Configuration](#setup-and-configuration)
5. [Translation System](#translation-system)
6. [Database Multilingual Content](#database-multilingual-content)
7. [User Interface Translation](#user-interface-translation)
8. [SEO and Metadata](#seo-and-metadata)
9. [Migration Guide](#migration-guide)
10. [Best Practices](#best-practices)
11. [Troubleshooting](#troubleshooting)
12. [API Reference](#api-reference)

---

## Introduction

This guide provides comprehensive documentation for the internationalization (i18n) system implemented in the Spirituality E-Commerce Platform. The system supports English and Spanish languages with a flexible architecture that can easily be extended to additional languages.

### What is Covered

This implementation includes:

- ✅ **UI Translations**: Static text in components (buttons, labels, navigation)
- ✅ **Content Translations**: Database content (courses, events, products)
- ✅ **Locale Detection**: Automatic language detection from URL, cookies, and browser
- ✅ **Locale Persistence**: User language preference saved and remembered
- ✅ **SEO Optimization**: hreflang tags, localized meta descriptions, structured data
- ✅ **Email Templates**: Multilingual transactional emails
- ✅ **Admin Interface**: Tools for managing translations
- ✅ **Formatting**: Numbers, currency, dates, and times per locale

### Key Features

- **Zero External Dependencies**: Built using native JavaScript Intl APIs
- **Type-Safe**: Full TypeScript support with strict typing
- **Performance Optimized**: Server-side rendering, minimal overhead
- **WCAG 2.1 AA Compliant**: Full accessibility support
- **SEO-Friendly**: Proper language signals for search engines

---

## Architecture Overview

### System Design

The i18n system consists of three layers:

```
┌─────────────────────────────────────────────────────┐
│                   Presentation Layer                 │
│  (Components, Pages, Email Templates)                │
│  - Uses translations from both layers below          │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│                 Translation Layer                     │
│  ┌────────────────────┐  ┌─────────────────────────┐│
│  │  UI Translations   │  │  Content Translations   ││
│  │   (JSON files)     │  │   (Database queries)    ││
│  │  T125, T166        │  │   T168, T169, T170      ││
│  └────────────────────┘  └─────────────────────────┘│
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│                  Infrastructure Layer                 │
│  - Locale Detection (T163)                           │
│  - Routing (T165)                                    │
│  - Formatting (T171, T172)                           │
└─────────────────────────────────────────────────────┘
```

### Request Flow

```
1. User visits /es/courses
          │
          ▼
2. Middleware detects locale = 'es'
          │
          ▼
3. Sets cookie + context (locals.locale)
          │
          ▼
4. Page renders with Spanish UI
          │
          ▼
5. Database queries return Spanish content
          │
          ▼
6. Output includes hreflang tags
```

### File Organization

```
src/
├── i18n/
│   ├── index.ts              # Core i18n utilities (T125)
│   └── locales/
│       ├── en.json           # English UI translations
│       └── es.json           # Spanish UI translations
├── lib/
│   ├── coursesI18n.ts        # Course content queries (T168)
│   ├── eventsI18n.ts         # Event content queries (T169)
│   ├── productsI18n.ts       # Product content queries (T170)
│   ├── i18nContent.ts        # Content helper utilities (T167)
│   ├── dateTimeFormat.ts     # Date/time formatting (T171)
│   ├── currencyFormat.ts     # Currency formatting (T172)
│   ├── seoMetadata.ts        # SEO utilities (T177)
│   ├── emailTemplates.ts     # Multilingual emails (T174)
│   ├── pageTranslations.ts   # Page helper utilities (T173)
│   ├── translationManager.ts # Admin translation management (T176)
│   └── userPreferences.ts    # User language preference (T175)
├── middleware/
│   ├── i18n.ts               # Locale detection middleware (T163)
│   └── middleware.ts         # Middleware orchestration
├── components/
│   ├── LanguageSwitcher.astro  # Language dropdown (T164)
│   ├── SEOHead.astro           # SEO metadata component (T177)
│   ├── TranslationEditor.astro # Admin translation UI (T176)
│   └── TranslationStatusBadge.astro # Translation status (T176)
└── pages/
    └── [locale]/             # Localized routes (optional pattern)
```

---

## Core Components

### T125: i18n Foundation

**Purpose**: Core utilities for translation and locale management
**File**: `src/i18n/index.ts`
**Created**: November 2, 2025

#### Key Functions

```typescript
import { t, getTranslations, getLocaleFromRequest } from '@/i18n';

// 1. Basic translation
const welcome = t('en', 'common.welcome'); // "Welcome"
const welcomeEs = t('es', 'common.welcome'); // "Bienvenido"

// 2. Variable interpolation
const greeting = t('en', 'dashboard.welcome', { name: 'John' });
// "Welcome back, John!"

// 3. Load all translations
const translations = getTranslations('es');
console.log(translations.common.welcome); // "Bienvenido"

// 4. Detect locale from request
const locale = getLocaleFromRequest(
  request.url,
  cookies.get('locale'),
  request.headers.get('Accept-Language')
);
```

#### Supported Locales

```typescript
export type Locale = 'en' | 'es';
export const LOCALES: Locale[] = ['en', 'es'];
export const DEFAULT_LOCALE: Locale = 'en';
export const LOCALE_NAMES: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
};
```

### T163: Locale Detection Middleware

**Purpose**: Automatically detect and set user's language preference
**File**: `src/middleware/i18n.ts`
**Created**: November 2, 2025

#### Detection Priority

1. **URL Path**: `/es/courses` → Spanish
2. **Query Parameter**: `?lang=es` → Spanish
3. **Cookie**: `locale=es` → Spanish
4. **Accept-Language Header**: `es-ES,es;q=0.9` → Spanish
5. **Default**: Fallback to English

#### How It Works

```typescript
// Middleware runs on every request
export const i18n: MiddlewareHandler = async (context, next) => {
  // 1. Detect locale from multiple sources
  const locale = getLocaleFromRequest(/* ... */);

  // 2. Add locale to request context
  context.locals.locale = locale;
  context.locals.defaultLocale = DEFAULT_LOCALE;

  // 3. Set cookie if changed (1-year expiration)
  if (cookieChanged) {
    context.cookies.set('locale', locale, {
      path: '/',
      maxAge: 31536000, // 1 year
      sameSite: 'lax',
      httpOnly: false, // Allow client-side access
      secure: import.meta.env.PROD,
    });
  }

  // 4. Set Content-Language header (WCAG 3.1.1)
  const response = await next();
  response.headers.set('Content-Language', locale);

  return response;
};
```

#### Usage in Components

```astro
---
// Available in all Astro components
const locale = Astro.locals.locale; // 'en' | 'es'
const t = getTranslations(locale);
---

<h1>{t.common.welcome}</h1>
```

### T164: Language Switcher Component

**Purpose**: UI component for users to change language
**File**: `src/components/LanguageSwitcher.astro`
**Created**: November 2, 2025

#### Features

- 🎨 Dropdown UI with flag icons (🇺🇸 EN / 🇪🇸 ES)
- ⌨️ Full keyboard navigation (Enter, Space, Escape, Arrows)
- ♿ WCAG 2.1 AA accessible (ARIA attributes)
- 🍪 Cookie-based persistence
- 📱 Responsive design (mobile/desktop)
- 🔄 Automatic URL generation with locale prefix

#### Integration

```astro
---
// Add to Header component
import LanguageSwitcher from '@/components/LanguageSwitcher.astro';
---

<header>
  <nav>
    <!-- Other nav items -->
    <LanguageSwitcher />
  </nav>
</header>
```

### T167: Multilingual Database Schema

**Purpose**: Store content in multiple languages in database
**Approach**: Column-based (separate column per language)
**Migration**: `database/migrations/003_add_multilingual_content.sql`
**Created**: November 2, 2025

#### Schema Design

```sql
-- Courses table
ALTER TABLE courses ADD COLUMN title_es VARCHAR(255);
ALTER TABLE courses ADD COLUMN description_es TEXT;
ALTER TABLE courses ADD COLUMN long_description_es TEXT;
ALTER TABLE courses ADD COLUMN learning_outcomes_es TEXT[];
ALTER TABLE courses ADD COLUMN prerequisites_es TEXT[];
ALTER TABLE courses ADD COLUMN curriculum_es JSONB;

-- Events table
ALTER TABLE events ADD COLUMN title_es VARCHAR(255);
ALTER TABLE events ADD COLUMN description_es TEXT;
ALTER TABLE events ADD COLUMN long_description_es TEXT;
ALTER TABLE events ADD COLUMN venue_name_es VARCHAR(255);
ALTER TABLE events ADD COLUMN venue_address_es TEXT;

-- Digital Products table
ALTER TABLE digital_products ADD COLUMN title_es VARCHAR(255);
ALTER TABLE digital_products ADD COLUMN description_es TEXT;
ALTER TABLE digital_products ADD COLUMN long_description_es TEXT;
```

#### Fallback Strategy

All Spanish columns are `NULL`able. Queries use `COALESCE` for automatic fallback:

```sql
-- If Spanish title is NULL or empty, use English title
SELECT
  COALESCE(NULLIF(title_es, ''), title) as title
FROM courses
WHERE locale = 'es';
```

#### Helper Utilities

`src/lib/i18nContent.ts` provides type-safe helpers:

```typescript
import { getCourseTitle, getLocalizedCourse } from '@/lib/i18nContent';

// Get localized field with automatic fallback
const title = getCourseTitle(course, 'es');
// Returns course.titleEs if present, otherwise course.title

// Get entire localized object
const localizedCourse = getLocalizedCourse(course, 'es');
// All fields automatically localized
```

### T168, T169, T170: Content Translation Services

**Purpose**: Query localized content from database
**Files**:
- `src/lib/coursesI18n.ts` (T168)
- `src/lib/eventsI18n.ts` (T169)
- `src/lib/productsI18n.ts` (T170)

#### Pattern

Each service provides locale-aware query functions:

```typescript
// Courses
import { getLocalizedCourses, getLocalizedCourseById } from '@/lib/coursesI18n';

const courses = await getLocalizedCourses('es', {
  published: true,
  limit: 10
});

const course = await getLocalizedCourseById('es', courseId);

// Events
import { getLocalizedEvents } from '@/lib/eventsI18n';

const events = await getLocalizedEvents('es', {
  startDate: new Date(),
  city: 'Madrid'
});

// Products
import { getLocalizedProducts } from '@/lib/productsI18n';

const products = await getLocalizedProducts('es', {
  type: 'pdf',
  minPrice: 0,
  maxPrice: 50
});
```

#### SQL Query Pattern

```sql
-- Embedded CASE statement for locale-specific fields
SELECT
  id,
  CASE
    WHEN $1 = 'es' THEN COALESCE(NULLIF(title_es, ''), title)
    ELSE title
  END as title,
  CASE
    WHEN $1 = 'es' THEN COALESCE(NULLIF(description_es, ''), description)
    ELSE description
  END as description,
  price,
  -- ... other fields
FROM courses
WHERE deleted_at IS NULL;
```

### T171: Date/Time Formatting

**Purpose**: Format dates and times per locale
**File**: `src/lib/dateTimeFormat.ts`
**Created**: November 2, 2025

#### Functions

```typescript
import {
  formatDateShort,
  formatDateLong,
  formatTime,
  formatDateTime,
  formatRelativeTime
} from '@/lib/dateTimeFormat';

const date = new Date('2025-11-04');

// English
formatDateShort('en', date);        // "11/4/2025"
formatDateLong('en', date);         // "November 4, 2025"
formatTime('en', date);             // "2:30 PM"
formatDateTime('en', date);         // "11/4/2025, 2:30 PM"
formatRelativeTime('en', date);     // "2 days ago"

// Spanish
formatDateShort('es', date);        // "4/11/2025"
formatDateLong('es', date);         // "4 de noviembre de 2025"
formatTime('es', date);             // "14:30"
formatDateTime('es', date);         // "4/11/2025, 14:30"
formatRelativeTime('es', date);     // "hace 2 días"
```

### T172: Currency Formatting

**Purpose**: Format prices and currency per locale
**File**: `src/lib/currencyFormat.ts`
**Created**: November 2, 2025

#### Functions

```typescript
import {
  formatCurrency,
  formatCurrencyCompact,
  formatPriceRange,
  formatDiscount
} from '@/lib/currencyFormat';

const price = 9999; // cents

// English
formatCurrency('en', price);              // "$99.99"
formatCurrencyCompact('en', 1500000);     // "$15K"
formatPriceRange('en', 1000, 5000);       // "$10.00 - $50.00"
formatDiscount('en', 9999, 20);           // "$79.99 (20% off)"

// Spanish
formatCurrency('es', price);              // "99,99 US$"
formatCurrencyCompact('es', 1500000);     // "15 mil US$"
formatPriceRange('es', 1000, 5000);       // "10,00-50,00 US$"
formatDiscount('es', 9999, 20);           // "79,99 US$ (20% de descuento)"
```

### T173: Page Translation Utilities

**Purpose**: Simplify translation usage in Astro pages
**File**: `src/lib/pageTranslations.ts`
**Created**: November 2, 2025

#### Helper Functions

```typescript
import { useTranslations } from '@/lib/pageTranslations';

// In Astro components
---
const { t, locale, formatDate, formatCurrency } = useTranslations(Astro);
---

<h1>{t('common.welcome')}</h1>
<p>{formatDate(new Date())}</p>
<span>{formatCurrency(9999)}</span>
```

### T174: Multilingual Email Templates

**Purpose**: Send emails in user's preferred language
**File**: `src/lib/emailTemplates.ts`
**Created**: November 2, 2025

#### Functions

```typescript
import {
  generateOrderConfirmationEmail,
  generateEventBookingEmail
} from '@/lib/emailTemplates';

// Order confirmation
const { subject, html, text } = generateOrderConfirmationEmail('es', {
  userName: 'Juan',
  orderId: '12345',
  items: [...],
  total: 9999
});

await sendEmail({
  to: user.email,
  subject,
  html,
  text
});
```

### T175: User Language Preference

**Purpose**: Store user's preferred language in database
**File**: `src/lib/userPreferences.ts`
**Migration**: `database/migrations/007_add_user_language_preference.sql`
**Created**: November 2, 2025

#### Database Schema

```sql
ALTER TABLE users ADD COLUMN preferred_language VARCHAR(2) DEFAULT 'en';
ALTER TABLE users ADD CONSTRAINT users_preferred_language_check
  CHECK (preferred_language IN ('en', 'es'));
CREATE INDEX idx_users_preferred_language ON users(preferred_language);
```

#### Functions

```typescript
import {
  getUserLanguagePreference,
  updateUserLanguagePreference
} from '@/lib/userPreferences';

// Get user's saved preference
const locale = await getUserLanguagePreference(userId); // 'en' | 'es'

// Update preference
await updateUserLanguagePreference(userId, 'es');
```

### T176: Translation Management (Admin)

**Purpose**: Admin UI for managing translations
**Files**:
- `src/lib/translationManager.ts` (backend functions)
- `src/components/TranslationEditor.astro` (UI component)
- `src/components/TranslationStatusBadge.astro` (status indicator)

**Created**: November 2, 2025

#### Features

- 📊 Translation completion statistics (0%, 50%, 100%)
- ✏️ Side-by-side editor (English | Spanish)
- 🔍 Filter by completion status
- 💾 Update course, event, and product translations
- ✅ Character support for Spanish accents (á, é, í, ó, ú, ñ, ¿, ¡)

#### Backend Functions

```typescript
import {
  getTranslationStatistics,
  getCourseTranslations,
  updateCourseTranslation
} from '@/lib/translationManager';

// Get statistics
const stats = await getTranslationStatistics();
// { courses: { total: 50, complete: 30, partial: 15, notStarted: 5 }, ... }

// Get courses needing translation
const courses = await getCourseTranslations('partial');

// Update translation
await updateCourseTranslation(courseId, {
  titleEs: 'Meditación 101',
  descriptionEs: 'Aprende a meditar'
});
```

#### UI Component Usage

```astro
---
import TranslationEditor from '@/components/TranslationEditor.astro';
import TranslationStatusBadge from '@/components/TranslationStatusBadge.astro';

const course = await getCourseById(id);
const completion = calculateCompletionPercentage(course);
---

<TranslationStatusBadge completion={completion} />

<TranslationEditor
  type="course"
  id={course.id}
  englishTitle={course.title}
  spanishTitle={course.titleEs}
  englishDescription={course.description}
  spanishDescription={course.descriptionEs}
/>
```

### T177: SEO Metadata

**Purpose**: Localized meta tags, hreflang, and structured data
**Files**:
- `src/lib/seoMetadata.ts` (helper functions)
- `src/components/SEOHead.astro` (reusable component)

**Created**: November 2, 2025

#### Features

- 🔗 hreflang tags for language targeting
- 📄 Canonical URLs
- 📝 Localized meta descriptions
- 🖼️ Open Graph tags (Facebook, LinkedIn)
- 🐦 Twitter Card metadata
- 🔍 JSON-LD structured data (Organization, Course, Event, Product, Breadcrumb)

#### SEOHead Component

```astro
---
import SEOHead from '@/components/SEOHead.astro';

const locale = Astro.locals.locale;
const course = await getLocalizedCourseById(locale, courseId);
---

<SEOHead
  title={course.title}
  description={course.description}
  locale={locale}
  canonicalPath={`/courses/${courseId}`}
  image={course.imageUrl}
  type="course"
  jsonLd={generateCourseSchema(course, locale)}
/>
```

#### Generated HTML

```html
<!-- Language targeting -->
<link rel="alternate" hreflang="en" href="https://example.com/courses/123" />
<link rel="alternate" hreflang="es" href="https://example.com/es/courses/123" />
<link rel="alternate" hreflang="x-default" href="https://example.com/courses/123" />

<!-- Canonical URL -->
<link rel="canonical" href="https://example.com/courses/123" />

<!-- Meta description -->
<meta name="description" content="Learn meditation techniques..." />

<!-- Open Graph -->
<meta property="og:title" content="Meditation 101" />
<meta property="og:description" content="Learn meditation..." />
<meta property="og:locale" content="en_US" />
<meta property="og:locale:alternate" content="es_ES" />

<!-- Structured data -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Course",
  "name": "Meditation 101",
  "description": "Learn meditation...",
  "inLanguage": "en"
}
</script>
```

### T178: Integration Testing

**Purpose**: Verify language switching works across all flows
**File**: `tests/integration/T178_language_switching_flows.test.ts`
**Created**: November 2, 2025

#### Coverage

- ✅ Locale detection from all sources
- ✅ User language preference persistence
- ✅ Content translation (courses, events, products)
- ✅ Email template localization
- ✅ UI element translation
- ✅ Complete user flows (browse → purchase → email)
- ✅ Edge cases (missing translations, invalid locales)
- ✅ Performance (locale detection overhead <0.5ms)

---

## Setup and Configuration

### 1. Environment Variables

No specific environment variables required for i18n. All configuration is code-based.

### 2. Translation Files

Location: `src/i18n/locales/`

```json
// en.json
{
  "common": {
    "welcome": "Welcome",
    "login": "Log In",
    "logout": "Log Out"
  },
  "courses": {
    "title": "Courses",
    "browseAll": "Browse All Courses",
    "enroll": "Enroll Now"
  }
  // ... 15+ sections
}

// es.json
{
  "common": {
    "welcome": "Bienvenido",
    "login": "Iniciar Sesión",
    "logout": "Cerrar Sesión"
  },
  "courses": {
    "title": "Cursos",
    "browseAll": "Explorar Todos los Cursos",
    "enroll": "Inscribirse Ahora"
  }
  // ... 15+ sections (must match en.json structure)
}
```

### 3. Middleware Setup

File: `src/middleware.ts`

```typescript
import { sequence } from 'astro:middleware';
import { i18n } from './middleware/i18n';
import { auth } from './middleware/auth';

// Sequence: i18n runs first, then auth
// This ensures locale is available in auth middleware
export const onRequest = sequence(i18n, auth);
```

### 4. Type Definitions

File: `src/env.d.ts`

```typescript
/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    locale: import('./i18n').Locale;
    defaultLocale: import('./i18n').Locale;
    session?: Session;
  }
}
```

### 5. Database Migration

Run migrations to add Spanish columns:

```bash
# Connect to database
psql -U postgres -d spirituality_platform

# Run migration
\i database/migrations/003_add_multilingual_content.sql
\i database/migrations/004_add_base_content_fields.sql
\i database/migrations/005_add_event_base_content_fields.sql
\i database/migrations/006_add_product_base_content_fields.sql
\i database/migrations/007_add_user_language_preference.sql
```

Verify:

```sql
-- Check courses table
\d courses

-- Should see: title_es, description_es, long_description_es, etc.
```

---

## Translation System

### Adding New Translation Keys

#### 1. Add to English JSON

`src/i18n/locales/en.json`:

```json
{
  "products": {
    "downloadNow": "Download Now",
    "fileSize": "File Size",
    "fileFormat": "File Format"
  }
}
```

#### 2. Add to Spanish JSON

`src/i18n/locales/es.json`:

```json
{
  "products": {
    "downloadNow": "Descargar Ahora",
    "fileSize": "Tamaño del Archivo",
    "fileFormat": "Formato del Archivo"
  }
}
```

#### 3. Use in Components

```astro
---
import { getTranslations } from '@/i18n';
const locale = Astro.locals.locale;
const t = getTranslations(locale);
---

<button>{t.products.downloadNow}</button>
<span>{t.products.fileSize}: 2.5 MB</span>
<span>{t.products.fileFormat}: PDF</span>
```

### Variable Interpolation

Use `{{variable}}` syntax in JSON:

```json
{
  "common": {
    "greeting": "Hello, {{name}}!",
    "itemCount": "You have {{count}} items in your cart"
  }
}
```

Usage:

```typescript
const greeting = t('en', 'common.greeting', { name: 'John' });
// "Hello, John!"

const cartMsg = t('en', 'common.itemCount', { count: 3 });
// "You have 3 items in your cart"
```

### Pluralization

Currently not built-in. Recommended pattern:

```json
{
  "cart": {
    "item": "item",
    "items": "items"
  }
}
```

```typescript
const count = 3;
const itemText = count === 1 ? t('en', 'cart.item') : t('en', 'cart.items');
const message = `${count} ${itemText}`;
// "3 items"
```

### Nested Objects

Use dot notation to access nested translations:

```json
{
  "dashboard": {
    "nav": {
      "courses": "My Courses",
      "profile": "Profile",
      "orders": "Order History"
    }
  }
}
```

```typescript
const coursesLink = t('en', 'dashboard.nav.courses');
// "My Courses"
```

---

## Database Multilingual Content

### Querying Localized Content

#### Pattern 1: Using i18n Service Functions (Recommended)

```typescript
import { getLocalizedCourseById } from '@/lib/coursesI18n';

const locale = Astro.locals.locale; // 'en' or 'es'
const course = await getLocalizedCourseById(locale, courseId);

// course.title is already localized
// course.description is already localized
// All fields automatically use Spanish if locale is 'es'
```

#### Pattern 2: Using Raw SQL with COALESCE

```typescript
import { pool } from '@/lib/db';

const locale = Astro.locals.locale;

const result = await pool.query(`
  SELECT
    id,
    CASE
      WHEN $1 = 'es' THEN COALESCE(NULLIF(title_es, ''), title)
      ELSE title
    END as title,
    CASE
      WHEN $1 = 'es' THEN COALESCE(NULLIF(description_es, ''), description)
      ELSE description
    END as description,
    price,
    image_url
  FROM courses
  WHERE id = $2 AND deleted_at IS NULL
`, [locale, courseId]);

const course = result.rows[0];
```

#### Pattern 3: Using i18nContent Helpers

```typescript
import { getCourseTitle, getCourseDescription } from '@/lib/i18nContent';

const course = await getCourseById(courseId); // English fields
const locale = Astro.locals.locale;

const localizedTitle = getCourseTitle(course, locale);
const localizedDesc = getCourseDescription(course, locale);

// Or transform entire object
import { getLocalizedCourse } from '@/lib/i18nContent';
const localizedCourse = getLocalizedCourse(course, locale);
```

### Adding Content Translations

#### Admin UI (Recommended)

Use the TranslationEditor component in admin pages:

```astro
---
// src/pages/admin/courses/[id]/edit.astro
import TranslationEditor from '@/components/TranslationEditor.astro';

const course = await getCourseById(Astro.params.id);
---

<form>
  <!-- English fields -->
  <input name="title" value={course.title} />
  <textarea name="description">{course.description}</textarea>

  <h3>Spanish Translation</h3>
  <TranslationEditor
    type="course"
    id={course.id}
    englishTitle={course.title}
    spanishTitle={course.titleEs}
    englishDescription={course.description}
    spanishDescription={course.descriptionEs}
  />
</form>
```

#### Programmatically

```typescript
import { updateCourseTranslation } from '@/lib/translationManager';

await updateCourseTranslation(courseId, {
  titleEs: 'Meditación para Principiantes',
  descriptionEs: 'Aprende las técnicas fundamentales de meditación.'
});
```

#### Direct SQL

```sql
UPDATE courses
SET
  title_es = 'Meditación para Principiantes',
  description_es = 'Aprende las técnicas fundamentales de meditación.'
WHERE id = '123e4567-e89b-12d3-a456-426614174000';
```

### Checking Translation Status

```typescript
import { isTranslationComplete, calculateCompletionPercentage } from '@/lib/translationManager';

const course = await getCourseById(courseId);

// Binary check
const isComplete = isTranslationComplete(course.titleEs, course.descriptionEs);
// true if both fields have content

// Percentage
const completion = calculateCompletionPercentage(course);
// 0, 50, or 100 based on translated fields
```

---

## User Interface Translation

### Component Pattern

Standard pattern for translating Astro components:

```astro
---
// 1. Import i18n utilities
import { getTranslations } from '@/i18n';

// 2. Get locale from middleware
const locale = Astro.locals.locale; // 'en' | 'es'

// 3. Load translations
const t = getTranslations(locale);
---

<!-- 4. Use translations in template -->
<header>
  <h1>{t.common.welcome}</h1>
  <nav>
    <a href="/courses">{t.nav.courses}</a>
    <a href="/events">{t.nav.events}</a>
    <a href="/products">{t.nav.products}</a>
  </nav>
  <div>
    <a href="/login">{t.common.login}</a>
    <a href="/register">{t.common.register}</a>
  </div>
</header>
```

### Forms and Validation

```astro
---
const t = getTranslations(Astro.locals.locale);
---

<form>
  <label for="email">{t.auth.email}</label>
  <input
    id="email"
    name="email"
    type="email"
    placeholder={t.auth.emailPlaceholder}
    required
    aria-label={t.auth.emailLabel}
  />

  <label for="password">{t.auth.password}</label>
  <input
    id="password"
    name="password"
    type="password"
    placeholder={t.auth.passwordPlaceholder}
    required
    aria-label={t.auth.passwordLabel}
  />

  <button type="submit">{t.auth.loginButton}</button>
</form>

{error && <p class="error">{t.errors[error] || t.errors.generic}</p>}
```

### Client-Side JavaScript

For dynamic content, pass translations via data attributes:

```astro
---
const t = getTranslations(Astro.locals.locale);
---

<div
  id="search-results"
  data-t-loading={t.search.loading}
  data-t-no-results={t.search.noResults}
  data-t-error={t.search.error}
>
</div>

<script>
  const container = document.getElementById('search-results');
  const loadingText = container.dataset.tLoading;
  const noResultsText = container.dataset.tNoResults;
  const errorText = container.dataset.tError;

  // Use in JavaScript
  container.textContent = loadingText; // Shows translated loading message
</script>
```

### ARIA Labels and Accessibility

Always translate ARIA attributes:

```astro
---
const t = getTranslations(Astro.locals.locale);
---

<button
  aria-label={t.nav.openMenu}
  aria-expanded="false"
  aria-controls="mobile-menu"
>
  <span class="sr-only">{t.nav.menu}</span>
  <svg aria-hidden="true"><!-- Hamburger icon --></svg>
</button>

<nav
  id="mobile-menu"
  aria-label={t.nav.mainNavigation}
  role="navigation"
>
  <!-- Navigation items -->
</nav>
```

---

## SEO and Metadata

### Page-Level SEO

Use the SEOHead component on every page:

```astro
---
import SEOHead from '@/components/SEOHead.astro';
import { generateSEOMetadata } from '@/lib/seoMetadata';

const locale = Astro.locals.locale;
const seoData = generateSEOMetadata(locale, 'courses');
---

<head>
  <SEOHead
    title={seoData.title}
    description={seoData.description}
    locale={locale}
    canonicalPath="/courses"
  />
</head>
```

### Dynamic Content SEO

```astro
---
import SEOHead from '@/components/SEOHead.astro';
import { generateCourseSchema } from '@/lib/seoMetadata';

const course = await getLocalizedCourseById(locale, courseId);
const jsonLd = generateCourseSchema(course, locale);
---

<head>
  <SEOHead
    title={`${course.title} | ${siteName}`}
    description={course.description}
    locale={locale}
    canonicalPath={`/courses/${courseId}`}
    image={course.imageUrl}
    type="course"
    jsonLd={jsonLd}
  />
</head>
```

### hreflang Implementation

The SEOHead component automatically generates hreflang tags:

```html
<!-- English version -->
<link rel="alternate" hreflang="en" href="https://example.com/courses/123" />

<!-- Spanish version -->
<link rel="alternate" hreflang="es" href="https://example.com/es/courses/123" />

<!-- Default fallback -->
<link rel="alternate" hreflang="x-default" href="https://example.com/courses/123" />
```

### Structured Data

Generate JSON-LD structured data per locale:

```typescript
import {
  generateOrganizationSchema,
  generateCourseSchema,
  generateEventSchema,
  generateProductSchema,
  generateBreadcrumbSchema
} from '@/lib/seoMetadata';

// Organization (site-wide)
const orgSchema = generateOrganizationSchema(locale);

// Course
const courseSchema = generateCourseSchema({
  name: course.title,
  description: course.description,
  provider: 'Spirituality Platform',
  inLanguage: locale === 'es' ? 'es' : 'en'
}, locale);

// Add to SEOHead
<SEOHead jsonLd={courseSchema} />
```

---

## Migration Guide

### Adding a New Language

To add a new language (e.g., French):

#### Step 1: Update Type Definition

`src/i18n/index.ts`:

```typescript
// Before
export type Locale = 'en' | 'es';

// After
export type Locale = 'en' | 'es' | 'fr';

// Update constants
export const LOCALES: Locale[] = ['en', 'es', 'fr'];
export const LOCALE_NAMES: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
};
```

#### Step 2: Create Translation File

`src/i18n/locales/fr.json`:

```json
{
  "common": {
    "welcome": "Bienvenue",
    "login": "Se Connecter",
    "logout": "Se Déconnecter"
  }
  // ... copy structure from en.json
}
```

#### Step 3: Add Database Columns

`database/migrations/009_add_french_translations.sql`:

```sql
-- Courses
ALTER TABLE courses ADD COLUMN title_fr VARCHAR(255);
ALTER TABLE courses ADD COLUMN description_fr TEXT;
ALTER TABLE courses ADD COLUMN long_description_fr TEXT;
ALTER TABLE courses ADD COLUMN learning_outcomes_fr TEXT[];
ALTER TABLE courses ADD COLUMN prerequisites_fr TEXT[];
ALTER TABLE courses ADD COLUMN curriculum_fr JSONB;

-- Events
ALTER TABLE events ADD COLUMN title_fr VARCHAR(255);
ALTER TABLE events ADD COLUMN description_fr TEXT;
ALTER TABLE events ADD COLUMN long_description_fr TEXT;
ALTER TABLE events ADD COLUMN venue_name_fr VARCHAR(255);
ALTER TABLE events ADD COLUMN venue_address_fr TEXT;

-- Digital Products
ALTER TABLE digital_products ADD COLUMN title_fr VARCHAR(255);
ALTER TABLE digital_products ADD COLUMN description_fr TEXT;
ALTER TABLE digital_products ADD COLUMN long_description_fr TEXT;
```

#### Step 4: Update i18nContent Helpers

`src/lib/i18nContent.ts`:

```typescript
// Add French field types
export interface Course {
  // ... existing fields
  titleFr?: string;
  descriptionFr?: string;
  // ... etc
}

// Update getLocalizedField function
export function getLocalizedField(
  englishValue: string,
  localizedValue: string | null | undefined,
  locale: Locale
): string {
  if (locale === 'en') return englishValue;
  if (locale === 'es') return localizedValue || englishValue;
  if (locale === 'fr') return localizedValue || englishValue; // Add this
  return englishValue;
}

// Update helper functions
export function getCourseTitle(course: Course, locale: Locale): string {
  if (locale === 'es') return getLocalizedField(course.title, course.titleEs, locale);
  if (locale === 'fr') return getLocalizedField(course.title, course.titleFr, locale);
  return course.title;
}
```

#### Step 5: Update Content Query Functions

`src/lib/coursesI18n.ts`:

```typescript
const result = await pool.query(`
  SELECT
    id,
    CASE
      WHEN $1 = 'es' THEN COALESCE(NULLIF(title_es, ''), title)
      WHEN $1 = 'fr' THEN COALESCE(NULLIF(title_fr, ''), title)
      ELSE title
    END as title,
    CASE
      WHEN $1 = 'es' THEN COALESCE(NULLIF(description_es, ''), description)
      WHEN $1 = 'fr' THEN COALESCE(NULLIF(description_fr, ''), description)
      ELSE description
    END as description
    -- ... other fields
  FROM courses
  WHERE id = $2
`, [locale, courseId]);
```

#### Step 6: Update Language Switcher

`src/components/LanguageSwitcher.astro`:

```astro
---
const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' }, // Add this
];
---
```

#### Step 7: Update User Preference Constraint

```sql
ALTER TABLE users DROP CONSTRAINT users_preferred_language_check;
ALTER TABLE users ADD CONSTRAINT users_preferred_language_check
  CHECK (preferred_language IN ('en', 'es', 'fr'));
```

#### Step 8: Update SEO Metadata

`src/lib/seoMetadata.ts`:

```typescript
// Add French translations
const seoTranslations: Record<Locale, Record<string, SEOMetadata>> = {
  en: { /* ... */ },
  es: { /* ... */ },
  fr: {
    homepage: {
      title: 'Plateforme de Spiritualité',
      description: 'Découvrez des cours...'
    },
    // ... other pages
  }
};
```

### Migrating Existing Content

If you have existing English-only content, create a migration script:

```typescript
// scripts/migrate-to-multilingual.ts
import { pool } from './src/lib/db';

async function migrateContent() {
  // 1. Ensure English content is in base columns
  await pool.query(`
    UPDATE courses
    SET
      title = COALESCE(title, title_es),
      description = COALESCE(description, description_es)
    WHERE title IS NULL OR description IS NULL;
  `);

  // 2. Copy to Spanish columns if appropriate
  // (Only if you have bilingual staff to verify translations)

  // 3. Mark as needing translation
  await pool.query(`
    UPDATE courses
    SET title_es = NULL, description_es = NULL
    WHERE title_es IS NULL OR description_es IS NULL;
  `);

  console.log('Migration complete. Courses need Spanish translation.');
}

migrateContent();
```

---

## Best Practices

### 1. Always Use Type-Safe Locales

```typescript
// ✅ Good
import { Locale } from '@/i18n';
function translatePage(locale: Locale) { /* ... */ }

// ❌ Bad
function translatePage(locale: string) { /* ... */ }
```

### 2. Provide Fallback Values

```typescript
// ✅ Good
const title = getCourseTitle(course, locale) || course.title || 'Untitled';

// ❌ Bad
const title = course.titleEs; // Could be null
```

### 3. Keep Translation Keys Organized

```json
{
  "feature": {
    "subFeature": {
      "action": "Text here"
    }
  }
}
```

Follow this hierarchy:
1. Feature area (auth, courses, cart, etc.)
2. Sub-feature (if applicable)
3. Specific element (button, label, message, etc.)

### 4. Use Consistent Naming

```json
{
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit"
  }
}
```

Reuse common translations across features.

### 5. Test Both Languages

```typescript
test('Course page renders in Spanish', async () => {
  const course = await getLocalizedCourseById('es', courseId);
  expect(course.title).toMatch(/Meditación/);
});

test('Course page renders in English', async () => {
  const course = await getLocalizedCourseById('en', courseId);
  expect(course.title).toMatch(/Meditation/);
});
```

### 6. Translate ARIA Labels

```astro
<!-- ✅ Good -->
<button aria-label={t('common.closeDialog')}>×</button>

<!-- ❌ Bad -->
<button aria-label="Close">×</button>
```

### 7. Handle Plurals Explicitly

```typescript
const count = items.length;
const itemWord = count === 1 ? t('cart.item') : t('cart.items');
const message = `${count} ${itemWord}`;
```

### 8. Use Relative Time Formatting

```typescript
// ✅ Good
import { formatRelativeTime } from '@/lib/dateTimeFormat';
const timeAgo = formatRelativeTime(locale, order.createdAt);
// "2 days ago" / "hace 2 días"

// ❌ Bad
const timeAgo = `${days} days ago`; // Not localized
```

### 9. Document Missing Translations

```typescript
// Add TODO comments for missing translations
const title = course.titleEs || course.title; // TODO: Add Spanish translation
```

### 10. Version Translation Files

When making breaking changes to translation structure, version them:

```
src/i18n/locales/
├── v1/
│   ├── en.json
│   └── es.json
└── v2/
    ├── en.json
    └── es.json
```

---

## Troubleshooting

### Issue 1: Locale Not Detected

**Symptom**: Page always shows English, even with Spanish cookie/URL.

**Cause**: Middleware not running or locale not set in context.

**Solution**:

1. Check middleware is imported in `src/middleware.ts`:
   ```typescript
   import { sequence } from 'astro:middleware';
   import { i18n } from './middleware/i18n';

   export const onRequest = sequence(i18n /* , other middleware */);
   ```

2. Verify middleware is enabled in `astro.config.mjs`:
   ```javascript
   export default defineConfig({
     output: 'server', // Middleware requires SSR mode
     // ...
   });
   ```

3. Check console for errors during middleware execution.

### Issue 2: Translations Not Found

**Symptom**: Translation key appears literally (e.g., "common.welcome" instead of "Welcome").

**Cause**: Translation key doesn't exist in JSON file.

**Solution**:

1. Check the translation exists:
   ```bash
   grep -r "common.welcome" src/i18n/locales/
   ```

2. Verify JSON syntax is valid (no trailing commas).

3. Check for typos in the key:
   ```typescript
   // ❌ Wrong
   t('en', 'common.welcom'); // Typo

   // ✅ Correct
   t('en', 'common.welcome');
   ```

4. Restart dev server after adding translations.

### Issue 3: Spanish Content Not Showing

**Symptom**: Spanish pages show English content even though Spanish translations exist in database.

**Cause**: Query not using localized function or COALESCE incorrect.

**Solution**:

1. Use i18n service functions:
   ```typescript
   // ✅ Correct
   import { getLocalizedCourseById } from '@/lib/coursesI18n';
   const course = await getLocalizedCourseById('es', courseId);

   // ❌ Wrong
   const course = await getCourseById(courseId); // Returns English
   ```

2. Check SQL query includes CASE statement:
   ```sql
   CASE
     WHEN $1 = 'es' THEN COALESCE(NULLIF(title_es, ''), title)
     ELSE title
   END as title
   ```

3. Verify Spanish column actually has data:
   ```sql
   SELECT id, title, title_es FROM courses WHERE id = '...';
   ```

### Issue 4: Language Switcher Not Working

**Symptom**: Clicking language switcher doesn't change language.

**Cause**: Cookie not being set or middleware not reading cookie.

**Solution**:

1. Check browser DevTools → Application → Cookies:
   - `locale` cookie should exist
   - Domain should match current site
   - Value should be 'en' or 'es'

2. Verify JavaScript is executing:
   ```javascript
   // Add console.log to LanguageSwitcher.astro
   document.addEventListener('DOMContentLoaded', () => {
     console.log('Language switcher initialized');
   });
   ```

3. Check cookie is being read by middleware:
   ```typescript
   // Add to src/middleware/i18n.ts
   console.log('Cookie locale:', context.cookies.get('locale'));
   ```

4. Ensure page reloads after language change (not just AJAX update).

### Issue 5: SEO hreflang Tags Missing

**Symptom**: hreflang tags not appearing in HTML source.

**Cause**: SEOHead component not included or canonical path incorrect.

**Solution**:

1. Verify SEOHead is in `<head>`:
   ```astro
   <head>
     <SEOHead
       title={title}
       description={description}
       locale={locale}
       canonicalPath="/courses"
     />
   </head>
   ```

2. Check `canonicalPath` starts with `/`:
   ```typescript
   // ✅ Correct
   canonicalPath="/courses/123"

   // ❌ Wrong
   canonicalPath="courses/123" // Missing leading slash
   ```

3. Inspect HTML source (View Source, not DevTools) to see server-rendered tags.

### Issue 6: Email Not in User's Language

**Symptom**: User receives emails in English even though they selected Spanish.

**Cause**: Email not using user's preferred language.

**Solution**:

1. Get user's language preference:
   ```typescript
   import { getUserLanguagePreference } from '@/lib/userPreferences';

   const locale = await getUserLanguagePreference(userId) || 'en';
   ```

2. Use multilingual email function:
   ```typescript
   import { generateOrderConfirmationEmail } from '@/lib/emailTemplates';

   const { subject, html, text } = generateOrderConfirmationEmail(locale, {
     userName: user.name,
     orderId: order.id,
     // ...
   });
   ```

3. Verify user's `preferred_language` column:
   ```sql
   SELECT id, email, preferred_language FROM users WHERE id = '...';
   ```

### Issue 7: Performance Issues with Translations

**Symptom**: Page load time increased after adding i18n.

**Cause**: Translation files loaded on every request or inefficient queries.

**Solution**:

1. Translation files are small (<100KB) and cached by V8, so file loading is not the issue.

2. Check database queries are using indexes:
   ```sql
   EXPLAIN ANALYZE
   SELECT * FROM courses WHERE id = '...' AND deleted_at IS NULL;
   ```

3. Use connection pooling (already implemented in `src/lib/db.ts`).

4. Consider caching translated content in Redis (future optimization):
   ```typescript
   const cacheKey = `course:${locale}:${courseId}`;
   let course = await redis.get(cacheKey);

   if (!course) {
     course = await getLocalizedCourseById(locale, courseId);
     await redis.setex(cacheKey, 3600, JSON.stringify(course));
   }
   ```

### Issue 8: Special Characters Not Displaying

**Symptom**: Spanish characters (á, é, ñ, etc.) show as � or broken encoding.

**Cause**: Database encoding or HTTP headers not set to UTF-8.

**Solution**:

1. Verify database encoding:
   ```sql
   SHOW SERVER_ENCODING; -- Should be UTF8
   ```

2. Check HTTP Content-Type header:
   ```typescript
   // Should be set automatically by Astro
   Content-Type: text/html; charset=utf-8
   ```

3. Ensure translation JSON files are UTF-8:
   ```bash
   file -I src/i18n/locales/es.json
   # Should show: charset=utf-8
   ```

4. Verify HTML meta tag:
   ```html
   <meta charset="UTF-8" />
   ```

### Issue 9: TypeScript Errors with Locale

**Symptom**: TypeScript complains about locale type.

**Solution**:

1. Import the Locale type:
   ```typescript
   import { Locale } from '@/i18n';

   function myFunction(locale: Locale) { /* ... */ }
   ```

2. Use type guard for validation:
   ```typescript
   import { isValidLocale } from '@/i18n';

   const localeParam = Astro.params.locale;
   if (isValidLocale(localeParam)) {
     // TypeScript now knows localeParam is Locale type
     const translations = getTranslations(localeParam);
   }
   ```

### Issue 10: Translation Management UI Not Saving

**Symptom**: Editing translations in admin doesn't save to database.

**Cause**: Form submission not calling update function or SQL query failing.

**Solution**:

1. Check form is posting to correct endpoint:
   ```html
   <form action="/api/admin/translations/update" method="POST">
   ```

2. Verify update function is called:
   ```typescript
   import { updateCourseTranslation } from '@/lib/translationManager';

   const result = await updateCourseTranslation(courseId, {
     titleEs: 'New title',
     descriptionEs: 'New description'
   });

   console.log('Update result:', result);
   ```

3. Check PostgreSQL logs for errors:
   ```bash
   docker logs spirituality-postgres 2>&1 | grep ERROR
   ```

---

## API Reference

### Core Functions (src/i18n/index.ts)

#### `getTranslations(locale: Locale): Translations`

Loads translation object for specified locale.

**Parameters**:
- `locale`: 'en' | 'es'

**Returns**: Translations object

**Example**:
```typescript
const t = getTranslations('es');
console.log(t.common.welcome); // "Bienvenido"
```

---

#### `t(locale: Locale, key: string, variables?: Record<string, string | number>): string`

Main translation function with variable interpolation.

**Parameters**:
- `locale`: 'en' | 'es'
- `key`: Dot-notation path to translation (e.g., 'common.welcome')
- `variables`: Optional object for variable interpolation

**Returns**: Translated string

**Example**:
```typescript
t('en', 'common.welcome'); // "Welcome"
t('es', 'dashboard.greeting', { name: 'Juan' }); // "Hola, Juan"
```

---

#### `isValidLocale(locale: string): locale is Locale`

Type guard to validate locale string.

**Parameters**:
- `locale`: String to validate

**Returns**: Boolean (type predicate)

**Example**:
```typescript
const param = 'es';
if (isValidLocale(param)) {
  // TypeScript knows param is Locale
  const t = getTranslations(param);
}
```

---

#### `getLocaleFromRequest(url: string, cookieLocale?: string, acceptLanguage?: string): Locale`

Detects locale from multiple sources with priority.

**Parameters**:
- `url`: Request URL (checks query param)
- `cookieLocale`: Optional locale cookie value
- `acceptLanguage`: Optional Accept-Language header

**Returns**: Detected locale

**Example**:
```typescript
const locale = getLocaleFromRequest(
  'https://example.com/courses?lang=es',
  'en',
  'es-ES,es;q=0.9'
);
// Returns: 'es' (query param has priority)
```

---

#### `getLocalizedPath(locale: Locale, path: string): string`

Generates locale-prefixed URL path.

**Parameters**:
- `locale`: 'en' | 'es'
- `path`: Path to localize

**Returns**: Localized path

**Example**:
```typescript
getLocalizedPath('en', '/courses'); // "/courses"
getLocalizedPath('es', '/courses'); // "/es/courses"
```

---

#### `extractLocaleFromPath(path: string): { locale: Locale; path: string }`

Extracts locale and clean path from URL.

**Parameters**:
- `path`: URL path to parse

**Returns**: Object with locale and path

**Example**:
```typescript
extractLocaleFromPath('/es/courses/123');
// { locale: 'es', path: '/courses/123' }
```

---

### Content Functions

#### `getLocalizedCourseById(locale: Locale, courseId: string): Promise<Course>`

Fetches course with localized content.

**File**: `src/lib/coursesI18n.ts`

**Parameters**:
- `locale`: Language to fetch
- `courseId`: Course UUID

**Returns**: Promise of Course object with localized fields

**Example**:
```typescript
const course = await getLocalizedCourseById('es', courseId);
// course.title is in Spanish if translation exists
```

---

#### `getLocalizedCourses(locale: Locale, filters?: CourseFilters): Promise<Course[]>`

Fetches courses with localized content.

**File**: `src/lib/coursesI18n.ts`

**Parameters**:
- `locale`: Language to fetch
- `filters`: Optional filter object

**Returns**: Promise of Course array

**Example**:
```typescript
const courses = await getLocalizedCourses('es', {
  published: true,
  category: 'meditation',
  limit: 10
});
```

---

### Formatting Functions

#### `formatDateShort(locale: Locale, date: Date | string): string`

Formats date in short format.

**File**: `src/lib/dateTimeFormat.ts`

**Parameters**:
- `locale`: 'en' | 'es'
- `date`: Date object or ISO string

**Returns**: Formatted date string

**Example**:
```typescript
formatDateShort('en', new Date()); // "11/4/2025"
formatDateShort('es', new Date()); // "4/11/2025"
```

---

#### `formatCurrency(locale: Locale, cents: number, currency?: string): string`

Formats price as currency.

**File**: `src/lib/currencyFormat.ts`

**Parameters**:
- `locale`: 'en' | 'es'
- `cents`: Price in cents
- `currency`: Optional currency code (default: 'USD')

**Returns**: Formatted currency string

**Example**:
```typescript
formatCurrency('en', 9999); // "$99.99"
formatCurrency('es', 9999); // "99,99 US$"
```

---

### Admin Functions

#### `updateCourseTranslation(courseId: string, data: CourseTranslationData): Promise<UpdateResult>`

Updates course translation in database.

**File**: `src/lib/translationManager.ts`

**Parameters**:
- `courseId`: Course UUID
- `data`: Object with titleEs, descriptionEs, etc.

**Returns**: Promise of update result

**Example**:
```typescript
const result = await updateCourseTranslation(courseId, {
  titleEs: 'Meditación 101',
  descriptionEs: 'Curso de introducción'
});
```

---

#### `getTranslationStatistics(): Promise<TranslationStats>`

Gets translation completion statistics.

**File**: `src/lib/translationManager.ts`

**Returns**: Promise of statistics object

**Example**:
```typescript
const stats = await getTranslationStatistics();
// {
//   courses: { total: 50, complete: 30, partial: 15, notStarted: 5 },
//   events: { total: 20, complete: 15, partial: 3, notStarted: 2 },
//   products: { total: 30, complete: 25, partial: 2, notStarted: 3 }
// }
```

---

### SEO Functions

#### `generateSEOMetadata(locale: Locale, page: string): SEOMetadata`

Generates SEO metadata for page.

**File**: `src/lib/seoMetadata.ts`

**Parameters**:
- `locale`: Language
- `page`: Page identifier

**Returns**: SEO metadata object

**Example**:
```typescript
const seo = generateSEOMetadata('es', 'courses');
// { title: 'Cursos de Espiritualidad', description: '...' }
```

---

#### `generateCourseSchema(course: Course, locale: Locale): object`

Generates Course JSON-LD structured data.

**File**: `src/lib/seoMetadata.ts`

**Parameters**:
- `course`: Course object
- `locale`: Language

**Returns**: JSON-LD object

**Example**:
```typescript
const schema = generateCourseSchema(course, 'es');
// {
//   "@context": "https://schema.org",
//   "@type": "Course",
//   "name": "Meditación 101",
//   "inLanguage": "es"
// }
```

---

## Conclusion

This i18n implementation provides a comprehensive, production-ready system for multilingual support in the Spirituality E-Commerce Platform. The architecture is flexible, performant, and follows web standards for internationalization.

### Key Takeaways

1. **Two-Layer Translation**: UI translations (JSON) + Content translations (Database)
2. **Automatic Detection**: Locale detected from URL, cookie, or browser
3. **Type-Safe**: Full TypeScript support prevents errors
4. **SEO-Optimized**: hreflang tags and localized metadata
5. **Accessible**: WCAG 2.1 AA compliant
6. **Extensible**: Easy to add new languages

### Next Steps

- Complete Spanish translations for all courses, events, and products
- Add more languages (French, Portuguese, etc.)
- Implement Redis caching for translated content
- Add admin analytics for translation coverage
- Create automated translation suggestion system (optional)

### Support

For questions or issues:
- Review this guide
- Check [Troubleshooting](#troubleshooting) section
- Review implementation logs in `/log_files/*i18n*.md`
- Check test files for usage examples

---

**Document Version**: 1.0
**Last Updated**: November 4, 2025
**Maintained By**: Development Team
