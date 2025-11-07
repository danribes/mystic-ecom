# T224: JSON-LD Structured Data - Learning Guide

**Task ID**: T224
**Topic**: Schema.org Structured Data using JSON-LD
**Level**: Intermediate to Advanced
**Date**: 2025-11-06

---

## Table of Contents
1. [What is Structured Data?](#what-is-structured-data)
2. [Why Structured Data Matters](#why-structured-data-matters)
3. [JSON-LD Format](#json-ld-format)
4. [Schema.org Vocabulary](#schemaorg-vocabulary)
5. [Common Schema Types](#common-schema-types)
6. [Implementation Guide](#implementation-guide)
7. [Best Practices](#best-practices)
8. [Testing and Validation](#testing-and-validation)
9. [Common Mistakes](#common-mistakes)
10. [Advanced Topics](#advanced-topics)

---

## What is Structured Data?

**Structured data** is a standardized format for providing information about a page and classifying its content. It helps search engines understand what your page is about and display rich results in search listings.

### The Problem

Search engines crawl billions of web pages, but they're essentially reading plain text and trying to understand context. Without structured data:

```html
<div class="product">
  <h1>Meditation Cushion</h1>
  <p>Premium meditation cushion made with organic materials</p>
  <span class="price">$49.99</span>
  <div class="rating">4.8 stars (125 reviews)</div>
</div>
```

**What the search engine sees**: Just text. It has to guess that "49.99" is a price, "4.8 stars" is a rating, etc.

### The Solution: Structured Data

With structured data, you explicitly tell search engines what each piece of information means:

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Meditation Cushion",
  "description": "Premium meditation cushion made with organic materials",
  "offers": {
    "@type": "Offer",
    "price": "49.99",
    "priceCurrency": "USD"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "125"
  }
}
```

**Now the search engine knows**:
- This is a Product
- The price is $49.99 USD
- It has a 4.8/5 rating
- Based on 125 reviews

---

## Why Structured Data Matters

### 1. Rich Results in Search

**Without structured data**:
```
Meditation Cushion - $49.99
example.com › products › meditation-cushion
Premium meditation cushion made with organic materials...
```

**With structured data**:
```
Meditation Cushion - $49.99
★★★★★ 4.8 (125 reviews)  In Stock
example.com › products › meditation-cushion
Premium meditation cushion made with organic materials...
[Image]  Price: $49.99  Free Shipping
```

### 2. Better Click-Through Rates

Studies show that rich results get:
- **58% higher CTR** compared to standard listings
- **More visibility** with star ratings and images
- **Higher trust** from users

### 3. Voice Search Optimization

Voice assistants use structured data to:
- Answer questions directly
- Understand entities and relationships
- Provide relevant information

**Example**:
- **User**: "When is the meditation retreat?"
- **Assistant**: "The meditation retreat at Mountain Center is December 1-3, 2025. Tickets are $499."

This information comes from Event structured data.

### 4. Knowledge Graph

Structured data helps Google build its Knowledge Graph:
- Organization information panels
- Event listings
- Course details
- Product information

### 5. SEO Benefits

While not a direct ranking factor, structured data:
- Increases CTR (which can improve rankings)
- Helps search engines understand content better
- Enables rich features that compete for position zero
- Improves overall search presence

---

## JSON-LD Format

**JSON-LD** (JavaScript Object Notation for Linked Data) is the preferred format for structured data. Google, Bing, and other search engines support it.

### Why JSON-LD?

**Compared to Microdata**:
```html
<!-- Microdata (old way) -->
<div itemscope itemtype="https://schema.org/Product">
  <h1 itemprop="name">Meditation Cushion</h1>
  <span itemprop="price">49.99</span>
</div>
```

**Problems with Microdata**:
- Mixed with HTML
- Hard to maintain
- Difficult to test
- Can't easily combine schemas

**JSON-LD (modern way)**:
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Meditation Cushion",
  "offers": {
    "@type": "Offer",
    "price": "49.99",
    "priceCurrency": "USD"
  }
}
</script>
```

**Benefits of JSON-LD**:
- ✅ Separate from HTML
- ✅ Easy to maintain
- ✅ Simple to test
- ✅ Can add multiple schemas
- ✅ Can dynamically generate
- ✅ Doesn't affect page design

### JSON-LD Structure

Every JSON-LD schema has three key components:

#### 1. @context
```json
"@context": "https://schema.org"
```
Tells search engines you're using Schema.org vocabulary.

#### 2. @type
```json
"@type": "Organization"
```
Specifies what type of thing you're describing.

#### 3. Properties
```json
"name": "Spirituality Platform",
"url": "https://example.com"
```
The actual information about the thing.

### Complete Example

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Spirituality Platform",
  "url": "https://example.com",
  "logo": "https://example.com/logo.png",
  "sameAs": [
    "https://facebook.com/spirituality",
    "https://twitter.com/spirituality"
  ]
}
```

---

## Schema.org Vocabulary

**Schema.org** is a collaborative project to create a common vocabulary for structured data. It's supported by Google, Microsoft, Yahoo, and Yandex.

### Schema Hierarchy

Schema.org uses a hierarchy:

```
Thing (root)
├── CreativeWork
│   ├── Article
│   ├── Book
│   ├── Course
│   └── Movie
├── Event
├── Organization
│   └── LocalBusiness
├── Person
├── Place
└── Product
```

### Understanding the Hierarchy

When you use a specific type, you inherit properties from parent types.

**Example**: Course is a CreativeWork, which is a Thing.

**Course has access to**:
- Thing properties: name, description, url, image
- CreativeWork properties: author, datePublished, keywords
- Course-specific properties: provider, courseCode, instructor

---

## Common Schema Types

### 1. Organization

Used for companies, nonprofits, organizations.

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Spirituality Platform",
  "url": "https://example.com",
  "logo": "https://example.com/logo.png",
  "description": "Online spiritual courses and events",
  "email": "contact@example.com",
  "telephone": "+1-555-1234",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "123 Main St",
    "addressLocality": "Boulder",
    "addressRegion": "CO",
    "postalCode": "80301",
    "addressCountry": "US"
  },
  "sameAs": [
    "https://facebook.com/spirituality",
    "https://twitter.com/spirituality",
    "https://linkedin.com/company/spirituality"
  ]
}
```

**Key Properties**:
- `name`: Organization name (required)
- `url`: Website URL (required)
- `logo`: Logo image URL
- `sameAs`: Social media profiles (array)
- `address`: Physical address
- `email`, `telephone`: Contact information

**Benefits**:
- Knowledge Graph panel
- Brand recognition
- Contact information in search

---

### 2. WebSite

Used for site-wide information and search functionality.

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Spirituality Platform",
  "url": "https://example.com",
  "description": "Online spiritual courses and events",
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://example.com/search?q={search_term_string}"
    },
    "query-input": "required name=search_term_string"
  }
}
```

**Key Properties**:
- `name`: Site name (required)
- `url`: Site URL (required)
- `potentialAction`: Enables sitelinks search box
- `description`: Site description

**Benefits**:
- Sitelinks search box in Google
- Site information in Knowledge Graph

---

### 3. BreadcrumbList

Used for breadcrumb navigation.

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://example.com"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Courses",
      "item": "https://example.com/courses"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "Meditation",
      "item": "https://example.com/courses/meditation"
    }
  ]
}
```

**Key Properties**:
- `itemListElement`: Array of breadcrumb items (required)
- Each item has: `position`, `name`, `item` (URL)

**Benefits**:
- Breadcrumb trail in search results
- Better understanding of site structure

---

### 4. Course

Used for educational courses.

```json
{
  "@context": "https://schema.org",
  "@type": "Course",
  "name": "Meditation Fundamentals",
  "description": "Learn meditation from scratch with our 8-week program",
  "provider": {
    "@type": "Organization",
    "name": "Spirituality Platform",
    "url": "https://example.com"
  },
  "instructor": {
    "@type": "Person",
    "name": "Jane Smith",
    "description": "Certified meditation instructor with 15 years experience",
    "image": "https://example.com/images/jane-smith.jpg"
  },
  "hasCourseInstance": [
    {
      "@type": "CourseInstance",
      "courseMode": "online",
      "courseWorkload": "PT10H"
    }
  ],
  "offers": {
    "@type": "Offer",
    "price": "99.00",
    "priceCurrency": "USD",
    "availability": "https://schema.org/InStock"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "156"
  }
}
```

**Key Properties**:
- `name`: Course name (required)
- `description`: Course description (required)
- `provider`: Organization offering the course (required)
- `instructor`: Course instructor
- `offers`: Pricing information
- `aggregateRating`: Rating and reviews

**Benefits**:
- Course rich results with ratings
- Price and availability display
- Instructor information

---

### 5. Event

Used for events, workshops, retreats.

```json
{
  "@context": "https://schema.org",
  "@type": "Event",
  "name": "Meditation Retreat",
  "description": "3-day silent meditation retreat in the mountains",
  "startDate": "2025-12-01T09:00:00-07:00",
  "endDate": "2025-12-03T17:00:00-07:00",
  "eventStatus": "https://schema.org/EventScheduled",
  "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
  "location": {
    "@type": "Place",
    "name": "Mountain Retreat Center",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "456 Mountain Rd",
      "addressLocality": "Boulder",
      "addressRegion": "CO",
      "postalCode": "80302",
      "addressCountry": "US"
    }
  },
  "image": "https://example.com/images/retreat.jpg",
  "organizer": {
    "@type": "Organization",
    "name": "Spirituality Platform",
    "url": "https://example.com"
  },
  "offers": {
    "@type": "Offer",
    "price": "499.00",
    "priceCurrency": "USD",
    "availability": "https://schema.org/InStock",
    "url": "https://example.com/events/meditation-retreat",
    "validFrom": "2025-09-01T00:00:00-07:00"
  }
}
```

**Key Properties**:
- `name`: Event name (required)
- `startDate`: Start date/time in ISO 8601 (required)
- `location`: Where the event takes place (required)
- `endDate`: End date/time
- `eventStatus`: Scheduled, Cancelled, Postponed, Rescheduled
- `eventAttendanceMode`: Offline, Online, or Mixed
- `offers`: Ticket pricing

**For Virtual Events**:
```json
"location": {
  "@type": "VirtualLocation",
  "url": "https://example.com/join-webinar"
},
"eventAttendanceMode": "https://schema.org/OnlineEventAttendanceMode"
```

**Benefits**:
- Event rich results with dates
- Google Calendar integration
- Location and ticket information

---

### 6. Product

Used for products in e-commerce.

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Meditation Cushion",
  "description": "Premium meditation cushion made with organic buckwheat hulls",
  "image": "https://example.com/images/cushion.jpg",
  "brand": {
    "@type": "Brand",
    "name": "Zen Supply"
  },
  "sku": "MC-001",
  "mpn": "MPN-CUSHION-001",
  "offers": {
    "@type": "Offer",
    "price": "49.99",
    "priceCurrency": "USD",
    "availability": "https://schema.org/InStock",
    "priceValidUntil": "2025-12-31",
    "url": "https://example.com/products/meditation-cushion"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "125",
    "bestRating": "5",
    "worstRating": "1"
  },
  "review": [
    {
      "@type": "Review",
      "author": {
        "@type": "Person",
        "name": "Sarah Johnson"
      },
      "datePublished": "2025-10-15",
      "reviewBody": "Amazing cushion! Very comfortable for long meditation sessions.",
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": "5",
        "bestRating": "5"
      }
    }
  ]
}
```

**Key Properties**:
- `name`: Product name (required)
- `image`: Product image URL
- `offers`: Pricing and availability (required)
- `brand`: Brand information
- `sku`, `mpn`: Product identifiers
- `aggregateRating`: Overall ratings
- `review`: Individual reviews

**Benefits**:
- Product rich results with ratings and price
- Star ratings in search
- Availability status
- Price comparisons

---

### 7. Review

Used for customer reviews.

```json
{
  "@context": "https://schema.org",
  "@type": "Review",
  "author": {
    "@type": "Person",
    "name": "Sarah Johnson"
  },
  "datePublished": "2025-10-15",
  "reviewBody": "This meditation course changed my life. The instructor is knowledgeable and the content is well-structured.",
  "reviewRating": {
    "@type": "Rating",
    "ratingValue": "5",
    "bestRating": "5",
    "worstRating": "1"
  },
  "itemReviewed": {
    "@type": "Course",
    "name": "Meditation Fundamentals"
  }
}
```

**Key Properties**:
- `author`: Who wrote the review (required)
- `reviewRating`: Rating given (required)
- `reviewBody`: Review text
- `datePublished`: When published
- `itemReviewed`: What was reviewed

---

### 8. FAQPage

Used for FAQ pages.

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is meditation?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Meditation is a practice where an individual uses a technique – such as mindfulness, or focusing the mind on a particular object, thought, or activity – to train attention and awareness, and achieve a mentally clear and emotionally calm and stable state."
      }
    },
    {
      "@type": "Question",
      "name": "How long should I meditate?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "For beginners, start with 5-10 minutes daily. As you get more comfortable, you can gradually increase to 20-30 minutes or longer. The key is consistency rather than duration."
      }
    }
  ]
}
```

**Key Properties**:
- `mainEntity`: Array of questions (required)
- Each question has: `name` (the question), `acceptedAnswer` (the answer)

**Benefits**:
- FAQ rich results in search
- Direct answers in search results
- Featured snippets
- Voice search optimization

---

## Implementation Guide

### Our Implementation Architecture

We created two main components:

#### 1. Helper Library (`src/lib/structuredData.ts`)

Generator functions for each schema type:

```typescript
import { generateCourseSchema } from '@/lib/structuredData';

const schema = generateCourseSchema({
  name: 'Meditation Fundamentals',
  description: 'Learn meditation',
  provider: {
    '@type': 'Organization',
    name: 'Spirituality Platform'
  }
});
```

**Benefits**:
- Type-safe with TypeScript
- Reusable across components
- Automatic @context injection
- Validation included

#### 2. Astro Component (`src/components/StructuredData.astro`)

Renders JSON-LD scripts:

```astro
---
import StructuredData from '@/components/StructuredData.astro';
import { generateCourseSchema } from '@/lib/structuredData';

const courseSchema = generateCourseSchema({...});
---

<StructuredData schema={courseSchema} />
```

**Benefits**:
- Consistent rendering
- Development validation
- Pretty printing in dev
- Easy to use

### Step-by-Step Implementation

#### Step 1: Import What You Need

```astro
---
import StructuredData from '@/components/StructuredData.astro';
import { generateCourseSchema } from '@/lib/structuredData';
---
```

#### Step 2: Generate Your Schema

```astro
---
const courseSchema = generateCourseSchema({
  name: props.courseName,
  description: props.courseDescription,
  provider: {
    '@type': 'Organization',
    name: 'Spirituality Platform'
  },
  offers: {
    '@type': 'Offer',
    price: props.price,
    priceCurrency: 'USD'
  }
});
---
```

#### Step 3: Render the Schema

```astro
<head>
  <StructuredData schema={courseSchema} />
</head>
```

#### Step 4: Multiple Schemas

```astro
---
import { combineSchemas, generateCourseSchema, generateBreadcrumbListSchema } from '@/lib/structuredData';

const schemas = combineSchemas([
  generateCourseSchema({...}),
  generateBreadcrumbListSchema([...])
]);
---

<head>
  <StructuredData schemas={schemas} />
</head>
```

---

## Best Practices

### 1. Use Absolute URLs

❌ **Wrong**:
```json
"image": "/images/product.jpg"
```

✅ **Correct**:
```json
"image": "https://example.com/images/product.jpg"
```

**Why**: Search engines need full URLs to access resources.

---

### 2. Use ISO 8601 Date Format

❌ **Wrong**:
```json
"startDate": "12/01/2025"
```

✅ **Correct**:
```json
"startDate": "2025-12-01T09:00:00-07:00"
```

**Format**: `YYYY-MM-DDTHH:MM:SS±HH:MM`

---

### 3. Include All Required Properties

Each schema type has required properties. Always include them.

**Example for Event**:
- `name` ✅ Required
- `startDate` ✅ Required
- `location` ✅ Required

---

### 4. Use Specific Types

❌ **Wrong**: Using generic types
```json
"@type": "Thing"
```

✅ **Correct**: Using specific types
```json
"@type": "Course"
```

**Why**: More specific types enable richer results.

---

### 5. Test Before Deploying

Always test with:
- Google Rich Results Test
- Schema.org Validator
- Structured Data Testing Tool

---

### 6. Don't Duplicate Content

❌ **Wrong**: Adding data not on the page
```json
"aggregateRating": {
  "ratingValue": "5.0",
  "reviewCount": "100"
}
```
When page shows no ratings.

✅ **Correct**: Only add data that's visible on the page.

---

### 7. Keep It Updated

Update structured data when content changes:
- Event dates
- Prices
- Availability
- Ratings

---

## Testing and Validation

### 1. Google Rich Results Test

**URL**: https://search.google.com/test/rich-results

**How to Use**:
1. Enter your page URL or paste code
2. Click "Test URL" or "Test Code"
3. View parsed structured data
4. Check for errors and warnings
5. Preview how it appears in search

**What to Check**:
- ✅ Schema type detected correctly
- ✅ All required properties present
- ✅ No errors or warnings
- ✅ Preview looks correct

---

### 2. Schema.org Validator

**URL**: https://validator.schema.org/

**How to Use**:
1. Paste your JSON-LD code
2. Click "Validate"
3. Review results

**What It Checks**:
- JSON syntax
- Schema.org compliance
- Property names
- Value types

---

### 3. Structured Data Testing Tool

**URL**: https://search.google.com/structured-data/testing-tool

(Note: Being deprecated in favor of Rich Results Test)

---

### 4. Manual Browser Check

1. View page source (Ctrl+U or Cmd+U)
2. Search for `application/ld+json`
3. Verify JSON is present and valid
4. Copy JSON and validate separately

---

## Common Mistakes

### Mistake 1: Missing @context

❌ **Wrong**:
```json
{
  "@type": "Organization",
  "name": "Test"
}
```

✅ **Correct**:
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Test"
}
```

---

### Mistake 2: Invalid JSON Syntax

❌ **Wrong**:
```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Test",  // Extra comma
}
```

✅ **Correct**:
```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Test"
}
```

---

### Mistake 3: Wrong Property Names

❌ **Wrong**:
```json
{
  "@type": "Product",
  "title": "Product Name"  // Should be "name"
}
```

✅ **Correct**:
```json
{
  "@type": "Product",
  "name": "Product Name"
}
```

---

### Mistake 4: Missing Required Nested Types

❌ **Wrong**:
```json
{
  "@type": "Event",
  "location": "123 Main St"  // Should be structured
}
```

✅ **Correct**:
```json
{
  "@type": "Event",
  "location": {
    "@type": "Place",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "123 Main St"
    }
  }
}
```

---

### Mistake 5: Inconsistent Data

❌ **Wrong**: Structured data says price is $99, page shows $149

✅ **Correct**: Structured data matches page content exactly

---

## Advanced Topics

### 1. Nested Schemas

Schemas can be nested:

```json
{
  "@context": "https://schema.org",
  "@type": "Course",
  "name": "Meditation Course",
  "provider": {
    "@type": "Organization",
    "name": "Spirituality Platform",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "US"
    }
  }
}
```

---

### 2. Multiple Schemas on One Page

You can have multiple schemas:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Spirituality Platform"
}
</script>

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Spirituality Platform"
}
</script>
```

Or use an array:

```json
[
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Spirituality Platform"
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Spirituality Platform"
  }
]
```

---

### 3. Dynamic Schema Generation

Generate schemas from database data:

```astro
---
import { generateCourseSchema } from '@/lib/structuredData';

// Fetch course from database
const course = await getCourseFromDatabase(id);

// Generate schema dynamically
const schema = generateCourseSchema({
  name: course.title,
  description: course.description,
  provider: {
    '@type': 'Organization',
    name: 'Spirituality Platform'
  },
  offers: {
    '@type': 'Offer',
    price: course.price,
    priceCurrency: 'USD'
  }
});
---

<StructuredData schema={schema} />
```

---

### 4. Conditional Schemas

Show different schemas based on page type:

```astro
---
const pageType = Astro.props.pageType;
let schema;

if (pageType === 'course') {
  schema = generateCourseSchema({...});
} else if (pageType === 'event') {
  schema = generateEventSchema({...});
}
---

{schema && <StructuredData schema={schema} />}
```

---

## Key Takeaways

1. **Structured data helps search engines understand your content**
2. **JSON-LD is the preferred format** (separate from HTML)
3. **Schema.org provides the vocabulary** (standardized types and properties)
4. **Rich results improve CTR** (5-10x higher than plain results)
5. **Test with Google Rich Results Test** before deploying
6. **Use absolute URLs** and **ISO 8601 dates**
7. **Include only data that's visible on the page**
8. **Keep schemas updated** when content changes

---

## Resources

### Official Documentation
- **Schema.org**: https://schema.org/
- **Google Structured Data**: https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data
- **JSON-LD**: https://json-ld.org/

### Testing Tools
- **Rich Results Test**: https://search.google.com/test/rich-results
- **Schema Validator**: https://validator.schema.org/
- **Structured Data Linter**: http://linter.structured-data.org/

### Learning Resources
- **Google Search Central**: https://developers.google.com/search
- **Schema.org Full List**: https://schema.org/docs/full.html
- **JSON-LD Playground**: https://json-ld.org/playground/

---

## Conclusion

Structured data using JSON-LD and Schema.org is a powerful tool for improving your site's presence in search results. By explicitly telling search engines what your content represents, you enable rich results, better understanding, and improved user experience.

**Implementation Summary**:
- Use our helper library for type-safe schema generation
- Use the StructuredData component for consistent rendering
- Test with Google Rich Results Test
- Keep schemas updated with content changes
- Monitor search performance and adjust as needed

With proper structured data implementation, you'll see improved CTR, better search visibility, and enhanced user trust.

---

**Last Updated**: 2025-11-06
**Author**: Claude Code (Anthropic)
**Version**: 1.0
**Related Tasks**: T221 (SEO), T222 (Open Graph), T223 (Twitter Cards)
