# T225: Course Page Structured Data - Learning Guide

**Task ID**: T225  
**Topic**: Course Schema Implementation for SEO  
**Level**: Intermediate  
**Date**: 2025-11-06

---

## Table of Contents
1. [What is Course Structured Data?](#what-is-course-structured-data)
2. [Why Course Schema Matters](#why-course-schema-matters)
3. [Course Schema Properties](#course-schema-properties)
4. [Implementation Guide](#implementation-guide)
5. [Best Practices](#best-practices)
6. [Testing and Validation](#testing-and-validation)
7. [Common Mistakes](#common-mistakes)

---

## What is Course Structured Data?

**Course structured data** is a specific Schema.org type that helps search engines understand educational courses on your website. When implemented correctly, it enables rich course results in Google Search.

### Before Course Schema
```
Meditation Course - $199
example.com/courses/meditation
Learn meditation basics...
```
Plain search result with no visual elements.

### With Course Schema
```
Meditation Fundamentals
★★★★★ 4.9 (423 reviews)  $199.00
Spirituality Platform
Online • 4 hours • Dr. Sarah Quantum
[Course Details] [Enroll Now]
```
Rich result with ratings, price, instructor, and course details.

---

## Why Course Schema Matters

### 1. Rich Results in Search
Courses appear with enhanced information:
- Star ratings and review counts
- Price and currency
- Course provider
- Instructor name
- Duration and format (online/onsite)

### 2. Course Carousel
Google can show courses in a special carousel:
```
Courses on Meditation
┌─────────┐ ┌─────────┐ ┌─────────┐
│ Course  │ │ Course  │ │ Course  │
│ ★★★★★  │ │ ★★★★☆  │ │ ★★★★★  │
│ $199    │ │ $149    │ │ $299    │
└─────────┘ └─────────┘ └─────────┘
```

### 3. Higher Click-Through Rates
Studies show courses with structured data get:
- **58% higher CTR** than plain listings
- **More qualified leads** (users know price upfront)
- **Better conversion** (pre-qualified interest)

### 4. Course Discovery
Helps users find courses through:
- Google Search
- Google for Education
- Learning platforms
- Aggregator sites

---

## Course Schema Properties

### Required Properties

#### 1. name
The course title.

```json
"name": "Quantum Manifestation Mastery"
```

**Best Practices**:
- Clear, descriptive title
- Include key topics
- 60 characters or less

#### 2. description
Detailed course description.

```json
"description": "A comprehensive course on quantum manifestation that combines cutting-edge quantum physics with ancient spiritual wisdom..."
```

**Best Practices**:
- 200-300 characters optimal
- Include key learning outcomes
- Explain what makes course unique
- Use long description if available

#### 3. provider
The organization offering the course.

```json
"provider": {
  "@type": "Organization",
  "name": "Spirituality Platform",
  "url": "https://example.com"
}
```

**Required**:
- @type: Must be "Organization"
- name: Organization name
- url: Organization website

---

### Recommended Properties

#### 4. instructor
The course instructor(s).

```json
"instructor": {
  "@type": "Person",
  "name": "Dr. Sarah Quantum",
  "image": "https://example.com/instructors/sarah.jpg"
}
```

**Multiple Instructors**:
```json
"instructor": [
  {
    "@type": "Person",
    "name": "Dr. Sarah Quantum"
  },
  {
    "@type": "Person",
    "name": "Prof. John Meditation"
  }
]
```

#### 5. offers
Pricing information.

```json
"offers": {
  "@type": "Offer",
  "price": "199.00",
  "priceCurrency": "USD",
  "availability": "https://schema.org/InStock",
  "url": "https://example.com/courses/meditation"
}
```

**Price Format**:
- Use decimal format (199.00, not 19900)
- Always include 2 decimal places
- Specify currency code (USD, EUR, GBP)

**Availability Values**:
- `https://schema.org/InStock` - Available
- `https://schema.org/SoldOut` - Full/closed
- `https://schema.org/PreOrder` - Coming soon

#### 6. hasCourseInstance
How the course is delivered.

```json
"hasCourseInstance": [
  {
    "@type": "CourseInstance",
    "courseMode": "online",
    "courseWorkload": "PT4H30M"
  }
]
```

**courseMode Values**:
- `online` - Fully online
- `onsite` - In-person
- `blended` - Mix of both

**courseWorkload**: ISO 8601 duration
- PT4H = 4 hours
- PT4H30M = 4 hours 30 minutes
- PT10H = 10 hours

#### 7. aggregateRating
Average rating and review count.

```json
"aggregateRating": {
  "@type": "AggregateRating",
  "ratingValue": 4.9,
  "reviewCount": 423,
  "bestRating": 5,
  "worstRating": 1
}
```

**Important**:
- Only include if you have actual reviews
- ratingValue: 0-5 scale
- reviewCount: Number of reviews
- bestRating: Usually 5
- worstRating: Usually 1

---

## Implementation Guide

### Step 1: Import Required Components

```astro
---
import StructuredData from '@/components/StructuredData.astro';
import { generateCourseSchema } from '@/lib/structuredData';
---
```

### Step 2: Prepare URLs

```astro
---
// Get site base URL
const siteUrl = Astro.site?.origin || Astro.url.origin;

// Construct course URL
const courseUrl = `${siteUrl}/courses/${course.slug}`;

// Convert image to absolute URL
const courseImageUrl = course.imageUrl.startsWith('http')
  ? course.imageUrl
  : `${siteUrl}${course.imageUrl}`;
---
```

**Why Absolute URLs?**
- Schema.org requires full URLs
- Helps search engines fetch images
- Ensures correct link attribution

### Step 3: Generate Schema

```astro
---
const courseSchema = generateCourseSchema({
  name: course.title,
  description: course.longDescription || course.description,
  url: courseUrl,
  image: courseImageUrl,
  provider: {
    '@type': 'Organization',
    name: 'Your Organization',
    url: siteUrl,
  },
  instructor: {
    '@type': 'Person',
    name: course.instructorName,
    image: course.instructorAvatar,
  },
  hasCourseInstance: [
    {
      '@type': 'CourseInstance',
      courseMode: 'online',
      courseWorkload: `PT${hours}H${minutes}M`,
    },
  ],
  offers: {
    '@type': 'Offer',
    price: (course.price / 100).toFixed(2),  // Convert cents to dollars
    priceCurrency: 'USD',
    availability: 'https://schema.org/InStock',
    url: courseUrl,
  },
  // Only include if ratings exist
  ...(course.avgRating && course.reviewCount ? {
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: course.avgRating,
      reviewCount: course.reviewCount,
      bestRating: 5,
      worstRating: 1,
    },
  } : {}),
});
---
```

### Step 4: Render in Head

```astro
<BaseLayout title={course.title} ...>
  <!-- Add to head slot -->
  <StructuredData schema={courseSchema} slot="head" />
  
  <!-- Page content -->
  <div class="course-detail">
    ...
  </div>
</BaseLayout>
```

---

## Best Practices

### 1. Use Absolute URLs

❌ **Wrong**:
```json
"image": "/images/course.jpg"
```

✅ **Correct**:
```json
"image": "https://example.com/images/course.jpg"
```

### 2. Format Duration Correctly

❌ **Wrong**:
```json
"courseWorkload": "4 hours"
```

✅ **Correct**:
```json
"courseWorkload": "PT4H0M"
```

**ISO 8601 Format**:
- PT = Period Time
- H = Hours
- M = Minutes
- Examples: PT2H, PT30M, PT4H30M

**Conversion**:
```javascript
const hours = Math.floor(seconds / 3600);
const minutes = Math.floor((seconds % 3600) / 60);
const duration = `PT${hours}H${minutes}M`;
```

### 3. Only Include Real Ratings

❌ **Wrong**: Including 0 ratings
```json
"aggregateRating": {
  "ratingValue": 0,
  "reviewCount": 0
}
```

✅ **Correct**: Conditional inclusion
```javascript
...(course.avgRating && course.reviewCount ? {
  aggregateRating: { ... }
} : {})
```

### 4. Format Prices Consistently

❌ **Wrong**:
```json
"price": "199"  // Missing decimals
"price": 199    // Number instead of string
```

✅ **Correct**:
```json
"price": "199.00"  // String with 2 decimals
```

### 5. Include Provider Information

Always include complete provider info:
```json
"provider": {
  "@type": "Organization",
  "name": "Your Platform",
  "url": "https://example.com"
}
```

---

## Testing and Validation

### 1. Google Rich Results Test

**URL**: https://search.google.com/test/rich-results

**Steps**:
1. Enter your course page URL
2. Click "Test URL"
3. Wait for results
4. Check detected schema type (should be "Course")
5. Review all properties
6. Check for errors/warnings

**What to Verify**:
- ✅ Course type detected
- ✅ All required properties present
- ✅ No errors (red indicators)
- ✅ Minimal warnings
- ✅ Preview looks correct

### 2. Schema.org Validator

**URL**: https://validator.schema.org/

**Steps**:
1. View page source
2. Copy JSON-LD script content
3. Paste in validator
4. Check results

### 3. Browser DevTools

**Manual Check**:
1. Open course page
2. View page source (Ctrl+U / Cmd+U)
3. Search for `"@type": "Course"`
4. Verify schema is present
5. Copy JSON and validate format

---

## Common Mistakes

### Mistake 1: Relative Image URLs

❌ **Wrong**:
```json
"image": "/images/course.jpg"
```

**Problem**: Search engines can't resolve relative URLs.

✅ **Fix**:
```json
"image": "https://example.com/images/course.jpg"
```

### Mistake 2: Wrong Duration Format

❌ **Wrong**:
```json
"courseWorkload": "4 hours 30 minutes"
```

✅ **Fix**:
```json
"courseWorkload": "PT4H30M"
```

### Mistake 3: Missing @type

❌ **Wrong**:
```json
"instructor": {
  "name": "Dr. Smith"
}
```

✅ **Fix**:
```json
"instructor": {
  "@type": "Person",
  "name": "Dr. Smith"
}
```

### Mistake 4: Wrong Price Format

❌ **Wrong**:
```json
"price": 19900  // Cents as number
```

✅ **Fix**:
```json
"price": "199.00"  // Dollars as string
```

### Mistake 5: Inconsistent Data

❌ **Wrong**: Schema says $199, page shows $149

✅ **Fix**: Ensure schema matches page content exactly

---

## Real-World Example

Here's what our implementation generates for a course:

```json
{
  "@context": "https://schema.org",
  "@type": "Course",
  "name": "Quantum Manifestation Mastery",
  "description": "A comprehensive course on quantum manifestation...",
  "url": "https://example.com/courses/quantum-manifestation-mastery",
  "image": "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1200",
  "provider": {
    "@type": "Organization",
    "name": "Spirituality Platform",
    "url": "https://example.com"
  },
  "instructor": {
    "@type": "Person",
    "name": "Dr. Sarah Quantum",
    "image": "https://i.pravatar.cc/150?img=5"
  },
  "hasCourseInstance": [
    {
      "@type": "CourseInstance",
      "courseMode": "online",
      "courseWorkload": "PT4H0M"
    }
  ],
  "offers": {
    "@type": "Offer",
    "price": "199.00",
    "priceCurrency": "USD",
    "availability": "https://schema.org/InStock",
    "url": "https://example.com/courses/quantum-manifestation-mastery"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": 4.9,
    "reviewCount": 423,
    "bestRating": 5,
    "worstRating": 1
  }
}
```

---

## Key Takeaways

1. **Course schema enables rich results** in Google Search
2. **Required properties**: name, description, provider
3. **Recommended properties**: instructor, offers, rating, courseInstance
4. **Use absolute URLs** for all links and images
5. **ISO 8601 format** for duration (PT4H30M)
6. **Only include ratings** if you have actual reviews
7. **Format prices** with 2 decimals as strings
8. **Test with Google Rich Results Test** before deploying
9. **Keep schema data** consistent with page content

---

## Resources

### Official Documentation
- **Course Schema**: https://schema.org/Course
- **Google Course Guidelines**: https://developers.google.com/search/docs/appearance/structured-data/course
- **Rich Results Test**: https://search.google.com/test/rich-results

### Tools
- **Schema Validator**: https://validator.schema.org/
- **ISO 8601 Duration**: https://en.wikipedia.org/wiki/ISO_8601#Durations

---

## Conclusion

Course structured data is essential for educational platforms. With proper implementation:
- Courses appear with rich information in search
- Higher click-through rates from qualified users
- Better visibility in course searches
- Improved SEO performance

Follow this guide to implement Course schema correctly and enable rich course results in Google Search.

---

**Last Updated**: 2025-11-06  
**Author**: Claude Code (Anthropic)  
**Version**: 1.0  
**Related Tasks**: T224 (Structured Data Library)
