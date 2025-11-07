# T227: Product Structured Data - Learning Guide

## Table of Contents
1. [Introduction](#introduction)
2. [What is Product Structured Data?](#what-is-product-structured-data)
3. [Why Product Schema Matters](#why-product-schema-matters)
4. [Schema.org Product Specification](#schemaorg-product-specification)
5. [Implementation Architecture](#implementation-architecture)
6. [Code Deep Dive](#code-deep-dive)
7. [Testing Strategy](#testing-strategy)
8. [Google Rich Results](#google-rich-results)
9. [Real-World Examples](#real-world-examples)
10. [Common Pitfalls and Solutions](#common-pitfalls-and-solutions)
11. [Advanced Topics](#advanced-topics)
12. [Further Reading](#further-reading)

---

## Introduction

This guide explains Product structured data implementation for the Spirituality Platform. It covers the technical implementation, SEO principles, and best practices for enabling rich product results in search engines.

### What You'll Learn
- What Product structured data is and why it's essential for e-commerce
- How to implement Product schema in JSON-LD format
- Best practices for product listings and SEO
- How to enable Google Shopping and rich results
- Testing and validation techniques
- Common mistakes and how to avoid them

### Prerequisites
- Basic understanding of HTML and JavaScript
- Familiarity with JSON format
- Knowledge of SEO concepts
- Understanding of TypeScript (helpful but not required)
- Familiarity with Astro framework (helpful)

---

## What is Product Structured Data?

### Definition

**Product structured data** is a standardized way to describe product information using Schema.org vocabulary in JSON-LD format. It tells search engines about your products: what they are, how much they cost, whether they're available, and more.

### JSON-LD Format

**JSON-LD** (JavaScript Object Notation for Linked Data) is a lightweight format for expressing structured data. It's embedded in HTML as a `<script>` tag:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Meditation Guide PDF",
  "description": "A comprehensive guide to meditation",
  "offers": {
    "@type": "Offer",
    "price": "29.99",
    "priceCurrency": "USD"
  }
}
</script>
```

### Why JSON-LD?

- **Easy to Add**: Just drop in a script tag
- **No Visual Impact**: Invisible to users, read by bots
- **Clean Separation**: Doesn't affect page layout or styles
- **Rich Data**: Can express complex relationships
- **Industry Standard**: Recommended by Google

---

## Why Product Schema Matters

### 1. Rich Results in Search

Without Product schema:
```
Meditation Guide - Spirituality Platform
https://example.com/products/meditation-guide
Learn meditation with our comprehensive PDF guide. Perfect for beginners...
```

With Product schema:
```
★★★★★ (4.8)  150 reviews
Meditation Guide PDF                    $29.99
Spirituality Platform                   In Stock
Learn meditation with our comprehensive guide...
[Product Image]  [Add to Cart Button]
```

### 2. Increased Click-Through Rates

Studies show rich results improve CTR by:
- **15-30% higher CTR** compared to plain listings
- **Visual appeal** attracts more attention
- **Quick information** helps users decide faster
- **Trust signals** (ratings, brand) increase confidence

### 3. Google Shopping Eligibility

Product schema is **required** for:
- Google Shopping listings
- Google Merchant Center integration
- Product Feed ads
- Shopping carousel features

### 4. Voice Search Optimization

Voice assistants use structured data to:
- Answer product questions
- Compare prices
- Check availability
- Enable voice commerce

### 5. Multi-Platform Visibility

Structured data powers:
- **Google Search**: Rich snippets
- **Bing Shopping**: Product cards
- **Pinterest**: Product Pins
- **Facebook**: Product Catalogs
- **Price Comparison Sites**: Automated listings

---

## Schema.org Product Specification

### Product Type Hierarchy

```
Thing
  └─ Product
       ├─ IndividualProduct
       ├─ ProductCollection
       ├─ ProductModel
       ├─ SomeProducts
       └─ Vehicle (special type)
```

For digital products, we use the base `Product` type.

### Required Properties

#### 1. @context
**Type**: URL
**Value**: `"https://schema.org"`
**Purpose**: Defines the vocabulary

```json
"@context": "https://schema.org"
```

#### 2. @type
**Type**: Text
**Value**: `"Product"`
**Purpose**: Specifies this is a Product

```json
"@type": "Product"
```

#### 3. name
**Type**: Text
**Purpose**: Product name/title
**Best Practices**:
- Be descriptive but concise
- Include key features
- 50-60 characters optimal

```json
"name": "Complete Meditation Guide PDF"
```

#### 4. description
**Type**: Text
**Purpose**: Detailed product description
**Best Practices**:
- 150-300 characters
- Include benefits and features
- Use natural language

```json
"description": "A comprehensive 200-page guide covering meditation techniques for beginners and advanced practitioners"
```

### Recommended Properties

#### 5. image
**Type**: URL or Array of URLs
**Purpose**: Product images
**Best Practices**:
- Use absolute HTTPS URLs
- Minimum 1200x630 pixels
- High quality (< 200KB)
- Formats: JPG, PNG, WebP

```json
"image": "https://example.com/images/meditation-guide.jpg"
```

Or multiple images:
```json
"image": [
  "https://example.com/images/product-1.jpg",
  "https://example.com/images/product-2.jpg"
]
```

#### 6. brand
**Type**: Brand or Organization
**Purpose**: Product manufacturer/seller
**Best Practices**:
- Use Brand for product brands
- Use Organization for companies
- Consistent across products

```json
"brand": {
  "@type": "Brand",
  "name": "Spirituality Platform"
}
```

#### 7. sku
**Type**: Text
**Purpose**: Stock Keeping Unit (internal ID)
**Best Practices**:
- Unique per product
- Consistent format
- Example: PROD-123

```json
"sku": "PROD-001"
```

#### 8. offers
**Type**: Offer or Array of Offers
**Purpose**: Pricing and availability
**Required Sub-properties**:
- `@type`: "Offer"
- `price`: Numeric value
- `priceCurrency`: ISO 4217 code

```json
"offers": {
  "@type": "Offer",
  "price": "29.99",
  "priceCurrency": "USD",
  "availability": "https://schema.org/InStock",
  "url": "https://example.com/products/meditation-guide"
}
```

### Optional but Valuable Properties

#### 9. aggregateRating
**Type**: AggregateRating
**Purpose**: Average customer ratings
**Impact**: ⭐ Star ratings in search results

```json
"aggregateRating": {
  "@type": "AggregateRating",
  "ratingValue": 4.8,
  "reviewCount": 150,
  "bestRating": 5,
  "worstRating": 1
}
```

#### 10. review
**Type**: Review or Array of Reviews
**Purpose**: Individual customer reviews
**Impact**: Review snippets in search

```json
"review": [{
  "@type": "Review",
  "author": {
    "@type": "Person",
    "name": "Jane Smith"
  },
  "datePublished": "2025-11-01",
  "reviewBody": "Excellent guide!",
  "reviewRating": {
    "@type": "Rating",
    "ratingValue": 5,
    "bestRating": 5
  }
}]
```

---

## Implementation Architecture

### System Overview

```
┌─────────────────────────────────────────┐
│      Product Page (Astro)                │
│   /products/[slug].astro                 │
│                                          │
│  1. Load product from database          │
│  2. Generate Product schema             │
│  3. Render StructuredData component     │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│   generateProductSchema()                │
│   (src/lib/structuredData.ts)           │
│                                          │
│  - Maps product data to schema          │
│  - Handles optional fields              │
│  - Returns JSON-LD object               │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│   StructuredData Component               │
│   (src/components/StructuredData.astro) │
│                                          │
│  - Validates schema                     │
│  - Renders <script> tag                 │
│  - Outputs JSON-LD                      │
└─────────────────────────────────────────┘
```

### Data Flow

1. **Request**: User visits `/products/meditation-guide`
2. **Load**: Astro loads product from database by slug
3. **Map**: Convert database fields to Product schema
4. **Generate**: Create JSON-LD object
5. **Validate**: Check required fields
6. **Render**: Output as `<script type="application/ld+json">`
7. **Crawl**: Search engines read and index structured data

---

## Code Deep Dive

### Step 1: Define Product Schema Interface

In `/src/lib/structuredData.ts`:

```typescript
export interface ProductSchema extends Thing {
  '@type': 'Product';
  name: string;                    // Required
  description: string;             // Required
  image?: string | string[];       // Recommended
  brand?: {                        // Recommended
    '@type': 'Brand' | 'Organization';
    name: string;
  };
  sku?: string;                    // Recommended
  mpn?: string;                    // Optional
  offers?: {                       // Recommended
    '@type': 'Offer';
    price: string | number;
    priceCurrency: string;
    availability?: string;
    url?: string;
    priceValidUntil?: string;
    seller?: {
      '@type': 'Organization';
      name: string;
    };
  };
  aggregateRating?: {              // Optional
    '@type': 'AggregateRating';
    ratingValue: number;
    reviewCount: number;
    bestRating?: number;
    worstRating?: number;
  };
  review?: ReviewSchema[];         // Optional
}
```

**Key Points**:
- `name` and `description` are required
- Most fields are optional (`?`)
- Nested types (Offer, AggregateRating, Review)
- Type unions (`string | string[]` for image)

### Step 2: Generate Product Schema Function

In `/src/lib/structuredData.ts`:

```typescript
export function generateProductSchema(
  data: Omit<ProductSchema, '@type'>
): Record<string, unknown> {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: data.name,
    description: data.description,
  };

  // Add optional fields if provided
  if (data.url) schema.url = data.url;
  if (data.image) schema.image = data.image;
  if (data.brand) schema.brand = data.brand;
  if (data.sku) schema.sku = data.sku;
  if (data.mpn) schema.mpn = data.mpn;
  if (data.offers) schema.offers = data.offers;
  if (data.aggregateRating) schema.aggregateRating = data.aggregateRating;
  if (data.review) schema.review = data.review;

  return schema;
}
```

**How It Works**:
1. Create base schema with required fields
2. Add `@context` and `@type`
3. Conditionally add optional fields (if present)
4. Return complete schema object

**Why This Design**:
- Type-safe with TypeScript
- Flexible (optional fields)
- Clean output (no undefined values)
- Easy to extend

### Step 3: Map Product Data in Astro Page

In `/src/pages/products/[slug].astro`:

```typescript
// 1. Load product from database
const product = await getProductBySlug(slug);

// 2. Generate absolute URLs
const siteUrl = Astro.site?.origin || Astro.url.origin;
const productUrl = `${siteUrl}/products/${product.slug}`;
const productImageUrl = product.image_url ?
  (product.image_url.startsWith('http') ? product.image_url : `${siteUrl}${product.image_url}`) :
  `${siteUrl}/images/og-default.jpg`;

// 3. Map availability
const availability = product.is_active ?
  'https://schema.org/InStock' :
  'https://schema.org/OutOfStock';

// 4. Generate schema
const productSchema = generateProductSchema({
  name: product.title,
  description: product.description,
  image: productImageUrl,
  brand: {
    '@type': 'Brand',
    name: 'Spirituality Platform'
  },
  sku: `PROD-${product.id}`,
  offers: {
    '@type': 'Offer',
    price: Number(product.price).toFixed(2),
    priceCurrency: 'USD',
    availability: availability,
    url: productUrl,
    seller: {
      '@type': 'Organization',
      name: 'Spirituality Platform'
    }
  },
  url: productUrl
});
```

**Data Mapping**:

| Database Field | Schema Property | Transformation |
|----------------|-----------------|----------------|
| `product.title` | `name` | Direct mapping |
| `product.description` | `description` | Direct mapping |
| `product.image_url` | `image` | Convert to absolute URL |
| Fixed value | `brand.name` | "Spirituality Platform" |
| `product.id` | `sku` | Prefix with "PROD-" |
| `product.price` | `offers.price` | Format to 2 decimals |
| `product.is_active` | `offers.availability` | Map to schema.org URL |
| `product.slug` | `url` | Build full product URL |

### Step 4: Render Structured Data

In `/src/pages/products/[slug].astro`:

```astro
---
// ... schema generation above ...
---

<StructuredData schema={productSchema} />

<BaseLayout title={pageTitle}>
  <!-- Product page HTML -->
</BaseLayout>
```

The `<StructuredData>` component outputs:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Complete Meditation Guide PDF",
  "description": "A comprehensive guide...",
  "image": "https://mystic-ecom-cloud.pages.dev/images/guide.jpg",
  "brand": {
    "@type": "Brand",
    "name": "Spirituality Platform"
  },
  "sku": "PROD-123",
  "offers": {
    "@type": "Offer",
    "price": "29.99",
    "priceCurrency": "USD",
    "availability": "https://schema.org/InStock",
    "url": "https://mystic-ecom-cloud.pages.dev/products/meditation-guide",
    "seller": {
      "@type": "Organization",
      "name": "Spirituality Platform"
    }
  },
  "url": "https://mystic-ecom-cloud.pages.dev/products/meditation-guide"
}
</script>
```

---

## Testing Strategy

### Unit Tests

Test the `generateProductSchema()` function:

```typescript
describe('generateProductSchema', () => {
  it('should generate basic product schema', () => {
    const product = generateProductSchema({
      name: 'Test Product',
      description: 'Test description'
    });

    expect(product['@context']).toBe('https://schema.org');
    expect(product['@type']).toBe('Product');
    expect(product.name).toBe('Test Product');
    expect(product.description).toBe('Test description');
  });

  it('should include offers', () => {
    const product = generateProductSchema({
      name: 'Product',
      description: 'Description',
      offers: {
        '@type': 'Offer',
        price: 99.99,
        priceCurrency: 'USD'
      }
    });

    expect(product.offers).toBeDefined();
    expect((product.offers as any).price).toBe(99.99);
  });
});
```

### Validation Tests

Use Google's Rich Results Test:

```typescript
describe('Google Rich Results', () => {
  it('should use schema.org URLs for availability', () => {
    const product = generateProductSchema({
      name: 'Product',
      description: 'Description',
      offers: {
        '@type': 'Offer',
        price: 99,
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock'
      }
    });

    expect((product.offers as any).availability)
      .toContain('schema.org');
  });
});
```

### Manual Testing Steps

1. **View Page Source**
   - Navigate to product page
   - Right-click → View Page Source
   - Search for `application/ld+json`
   - Verify JSON-LD is present

2. **Google Rich Results Test**
   - Go to: https://search.google.com/test/rich-results
   - Enter product page URL
   - Click "Test URL"
   - Verify Product schema detected
   - Check for errors/warnings

3. **Schema.org Validator**
   - Go to: https://validator.schema.org/
   - Copy JSON-LD from page source
   - Paste and validate
   - Fix any issues

4. **JSON-LD Playground**
   - Go to: https://json-ld.org/playground/
   - Paste JSON-LD
   - Visualize data structure
   - Check for errors

---

## Google Rich Results

### What Are Rich Results?

**Rich results** are enhanced search listings that display additional information beyond the standard title, URL, and description.

### Product Rich Results Include:

- **Product Name**: Large, bold title
- **Price**: Prominently displayed
- **Currency**: USD, EUR, etc.
- **Availability**: InStock, OutOfStock badges
- **Ratings**: ⭐⭐⭐⭐⭐ star display
- **Review Count**: (150 reviews)
- **Image**: Product thumbnail
- **Brand**: Displayed under title

### Requirements for Rich Results

Google requires:

1. **Valid Product Schema**
   - @context, @type, name, description

2. **Offer Information**
   - price, priceCurrency, availability

3. **Absolute URLs**
   - All URLs must be absolute (https://)

4. **Crawlable Page**
   - Not blocked by robots.txt
   - Returns 200 OK
   - Accessible to Googlebot

5. **Quality Content**
   - Real product
   - Unique description
   - High-quality images

### How to Enable

1. **Add Product Schema** ✅ (Done in T227)
2. **Submit Sitemap** (T229 - upcoming)
3. **Wait for Crawling** (Google will crawl)
4. **Monitor Search Console** (Check enhancements)

### Typical Timeline

- **Crawling**: 1-7 days
- **Indexing**: 3-14 days
- **Rich Results**: 2-4 weeks

---

## Real-World Examples

### Example 1: Digital PDF Product

**Product**:
- Name: "Complete Meditation Guide PDF"
- Price: $29.99
- Type: Downloadable PDF
- Status: InStock

**Schema**:
```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Complete Meditation Guide PDF",
  "description": "A comprehensive 200-page guide covering meditation techniques for beginners and advanced practitioners. Includes breathing exercises, mindfulness practices, and daily routines.",
  "image": "https://mystic-ecom-cloud.pages.dev/images/meditation-guide.jpg",
  "brand": {
    "@type": "Brand",
    "name": "Spirituality Platform"
  },
  "sku": "PROD-101",
  "offers": {
    "@type": "Offer",
    "price": "29.99",
    "priceCurrency": "USD",
    "availability": "https://schema.org/InStock",
    "url": "https://mystic-ecom-cloud.pages.dev/products/meditation-guide"
  }
}
```

**Rich Result**:
```
★★★★★ (4.8)
Complete Meditation Guide PDF           $29.99
Spirituality Platform                   In Stock

A comprehensive 200-page guide covering meditation techniques...
[Product Image]
```

### Example 2: Audio Course with Ratings

**Product**:
- Name: "Mindfulness Audio Course"
- Price: $49.99
- Rating: 4.7/5 (89 reviews)
- Type: Audio files
- Status: InStock

**Schema**:
```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Mindfulness Audio Course",
  "description": "Learn mindfulness through 20 guided audio lessons. Each lesson is 15-30 minutes, perfect for daily practice.",
  "image": "https://mystic-ecom-cloud.pages.dev/images/audio-course.jpg",
  "brand": {
    "@type": "Organization",
    "name": "Spirituality Platform"
  },
  "sku": "PROD-202",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": 4.7,
    "reviewCount": 89,
    "bestRating": 5,
    "worstRating": 1
  },
  "offers": {
    "@type": "Offer",
    "price": "49.99",
    "priceCurrency": "USD",
    "availability": "https://schema.org/InStock",
    "url": "https://mystic-ecom-cloud.pages.dev/products/audio-course",
    "seller": {
      "@type": "Organization",
      "name": "Spirituality Platform"
    }
  }
}
```

**Rich Result**:
```
★★★★☆ (4.7) · 89 reviews
Mindfulness Audio Course                $49.99
Spirituality Platform                   In Stock

Learn mindfulness through 20 guided audio lessons...
[Product Image]
```

### Example 3: Free Product

**Product**:
- Name: "Free Meditation Starter Guide"
- Price: $0.00
- Type: PDF
- Status: InStock

**Schema**:
```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Free Meditation Starter Guide",
  "description": "Get started with meditation - completely free. A 20-page guide for absolute beginners.",
  "image": "https://mystic-ecom-cloud.pages.dev/images/free-guide.jpg",
  "brand": {
    "@type": "Brand",
    "name": "Spirituality Platform"
  },
  "sku": "PROD-FREE-001",
  "offers": {
    "@type": "Offer",
    "price": "0.00",
    "priceCurrency": "USD",
    "availability": "https://schema.org/InStock",
    "url": "https://mystic-ecom-cloud.pages.dev/products/free-starter-guide"
  }
}
```

**Key Point**: Free products (price: 0) are valid and can have rich results.

### Example 4: Out of Stock Product

**Product**:
- Name: "Limited Edition Retreat Recording"
- Price: $149.99
- Status: Sold Out

**Schema**:
```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Limited Edition Retreat Recording",
  "description": "Exclusive 2024 meditation retreat recording - now sold out.",
  "brand": {
    "@type": "Brand",
    "name": "Spirituality Platform"
  },
  "offers": {
    "@type": "Offer",
    "price": "149.99",
    "priceCurrency": "USD",
    "availability": "https://schema.org/OutOfStock"
  }
}
```

**Rich Result**:
```
Limited Edition Retreat Recording       $149.99
Spirituality Platform                   Sold Out

Exclusive 2024 meditation retreat recording...
```

**Key Point**: Out of stock products should still show price and schema.

---

## Common Pitfalls and Solutions

### Pitfall 1: Relative URLs

❌ **Wrong**:
```json
"image": "/images/product.jpg",
"url": "/products/meditation-guide"
```

✅ **Correct**:
```json
"image": "https://example.com/images/product.jpg",
"url": "https://example.com/products/meditation-guide"
```

**Why**: Google requires absolute URLs for all resources.

**Solution**:
```typescript
const siteUrl = Astro.site?.origin || Astro.url.origin;
const imageUrl = product.image.startsWith('http') ?
  product.image :
  `${siteUrl}${product.image}`;
```

### Pitfall 2: Incorrect Availability Values

❌ **Wrong**:
```json
"availability": "InStock"
```

✅ **Correct**:
```json
"availability": "https://schema.org/InStock"
```

**Why**: Must use full schema.org URLs.

**Valid Values**:
- `https://schema.org/InStock`
- `https://schema.org/OutOfStock`
- `https://schema.org/PreOrder`
- `https://schema.org/Discontinued`
- `https://schema.org/SoldOut`

### Pitfall 3: Invalid Currency Codes

❌ **Wrong**:
```json
"priceCurrency": "$"
```

✅ **Correct**:
```json
"priceCurrency": "USD"
```

**Why**: Must use ISO 4217 currency codes.

**Common Codes**:
- USD (US Dollar)
- EUR (Euro)
- GBP (British Pound)
- JPY (Japanese Yen)
- AUD (Australian Dollar)

### Pitfall 4: Missing Required Fields

❌ **Wrong**:
```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Product Name"
  // Missing description!
}
```

✅ **Correct**:
```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Product Name",
  "description": "Product description"
}
```

**Required Fields**:
- `@context`
- `@type`
- `name`
- `description`

### Pitfall 5: Incorrect Price Format

❌ **Wrong**:
```json
"price": "$29.99"
```

✅ **Correct**:
```json
"price": "29.99"
// or
"price": 29.99
```

**Why**: Price should be numeric value only, no currency symbols.

### Pitfall 6: Using HTTP Instead of HTTPS

❌ **Wrong**:
```json
"url": "http://example.com/products/test"
```

✅ **Correct**:
```json
"url": "https://example.com/products/test"
```

**Why**: Google prefers HTTPS and may not display rich results for HTTP.

### Pitfall 7: Duplicate @context

❌ **Wrong**:
```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "offers": {
    "@context": "https://schema.org",  // Don't repeat!
    "@type": "Offer"
  }
}
```

✅ **Correct**:
```json
{
  "@context": "https://schema.org",  // Once at top level
  "@type": "Product",
  "offers": {
    "@type": "Offer"  // No @context needed
  }
}
```

### Pitfall 8: Fake Reviews

❌ **Wrong**:
```json
"review": [{
  "@type": "Review",
  "author": {"@type": "Person", "name": "Fake Review"},
  "reviewRating": {"@type": "Rating", "ratingValue": 5}
}]
```

✅ **Correct**:
Only include real, verified reviews from actual customers.

**Why**: Google can detect and penalize fake reviews. This can result in:
- Manual action
- Rich results removal
- Site-wide penalties

---

## Advanced Topics

### 1. Multiple Offers (Variants)

For products with multiple pricing options:

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Meditation Course",
  "description": "Learn meditation",
  "offers": [
    {
      "@type": "Offer",
      "name": "Basic",
      "price": "49.99",
      "priceCurrency": "USD"
    },
    {
      "@type": "Offer",
      "name": "Premium",
      "price": "99.99",
      "priceCurrency": "USD"
    }
  ]
}
```

### 2. Product with Video

For video courses or products:

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Yoga Video Course",
  "description": "Complete yoga training",
  "video": {
    "@type": "VideoObject",
    "name": "Course Preview",
    "description": "Sample lesson",
    "thumbnailUrl": "https://example.com/thumb.jpg",
    "uploadDate": "2025-01-01",
    "duration": "PT2M30S"  // ISO 8601 duration (2 min 30 sec)
  }
}
```

### 3. Product with Additional Properties

For specific product attributes:

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Meditation MP3 Collection",
  "additionalProperty": [
    {
      "@type": "PropertyValue",
      "name": "File Size",
      "value": "500 MB"
    },
    {
      "@type": "PropertyValue",
      "name": "Format",
      "value": "MP3"
    },
    {
      "@type": "PropertyValue",
      "name": "Duration",
      "value": "10 hours"
    }
  ]
}
```

### 4. Product Bundles

For bundled products:

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Complete Spiritual Bundle",
  "description": "Includes: Meditation Guide, Audio Course, and Video Series",
  "isRelatedTo": [
    {
      "@type": "Product",
      "name": "Meditation Guide"
    },
    {
      "@type": "Product",
      "name": "Audio Course"
    }
  ]
}
```

### 5. Subscription Products

For recurring payments:

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Monthly Meditation Membership",
  "offers": {
    "@type": "Offer",
    "price": "19.99",
    "priceCurrency": "USD",
    "priceSpecification": {
      "@type": "UnitPriceSpecification",
      "price": "19.99",
      "priceCurrency": "USD",
      "referenceQuantity": {
        "@type": "QuantitativeValue",
        "value": "1",
        "unitCode": "MON"  // Month
      }
    }
  }
}
```

---

## Further Reading

### Official Documentation

#### Schema.org
- [Product Schema](https://schema.org/Product)
- [Offer Schema](https://schema.org/Offer)
- [AggregateRating Schema](https://schema.org/AggregateRating)
- [Review Schema](https://schema.org/Review)

#### Google
- [Product Rich Results Guide](https://developers.google.com/search/docs/appearance/structured-data/product)
- [Structured Data General Guidelines](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data)
- [JSON-LD Best Practices](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data#json-ld)

#### Google Tools
- [Rich Results Test](https://search.google.com/test/rich-results)
- [Search Console](https://search.google.com/search-console)
- [Schema Markup Validator](https://validator.schema.org/)

### Community Resources

- **Schema.org Community Group**: https://www.w3.org/community/schemaorg/
- **JSON-LD Playground**: https://json-ld.org/playground/
- **Stack Overflow**: [structured-data] tag

### Related SEO Topics

- **Open Graph Protocol**: Social media meta tags
- **Twitter Cards**: Twitter-specific meta tags
- **Canonical URLs**: Duplicate content prevention
- **XML Sitemaps**: Search engine crawling
- **Robots.txt**: Crawler directives

### Advanced Reading

- **JSON-LD Specification**: https://www.w3.org/TR/json-ld11/
- **Schema.org Best Practices**: https://schema.org/docs/gs.html
- **E-Commerce SEO Guide**: Comprehensive e-commerce optimization

---

## Summary and Key Takeaways

### What We Learned

1. **Product Structured Data** = Schema.org vocabulary in JSON-LD format
2. **Purpose** = Enable rich results in search engines
3. **Benefits** = Higher CTR, better visibility, Google Shopping eligibility
4. **Required Fields** = @context, @type, name, description
5. **Recommended Fields** = image, brand, sku, offers
6. **Optional Fields** = ratings, reviews, video

### Implementation Checklist

- ✅ Add `generateProductSchema()` utility
- ✅ Map product data to schema
- ✅ Use absolute HTTPS URLs
- ✅ Include offers with price and currency
- ✅ Map availability correctly
- ✅ Render with StructuredData component
- ✅ Test with Google Rich Results Test
- ✅ Validate with Schema.org validator
- ✅ Monitor in Search Console

### Best Practices

1. **Always** use absolute URLs
2. **Always** use HTTPS
3. **Always** include required fields
4. **Use** schema.org URLs for availability
5. **Use** ISO 4217 currency codes
6. **Format** prices as numbers (no symbols)
7. **Include** real reviews only
8. **Test** before deploying

### Common Mistakes to Avoid

1. ❌ Relative URLs
2. ❌ HTTP instead of HTTPS
3. ❌ Missing required fields
4. ❌ Wrong availability format
5. ❌ Wrong currency codes
6. ❌ Price with currency symbols
7. ❌ Fake reviews
8. ❌ Duplicate @context

### Next Steps

1. **Implement** on all product pages
2. **Test** with validation tools
3. **Submit** sitemap to Google
4. **Monitor** Search Console
5. **Track** CTR improvements
6. **Add** reviews when available
7. **Optimize** product descriptions
8. **Update** regularly

---

## Questions and Answers

### Q: Do I need Product schema for every product?

**A**: Yes! Every product page should have Product schema for:
- Consistent SEO
- Maximum visibility
- Google Shopping eligibility
- Better user experience

### Q: What if I don't have product reviews yet?

**A**: That's fine! Reviews are optional. You can:
- Omit `aggregateRating` and `review` fields
- Still get basic rich results
- Add reviews later when available

### Q: Can I use Product schema for services?

**A**: No. Use `Service` schema instead:
```json
{
  "@context": "https://schema.org",
  "@type": "Service",
  "name": "Meditation Coaching",
  "description": "One-on-one coaching"
}
```

### Q: How long until I see rich results?

**A**: Typically:
- **Crawling**: 1-7 days
- **Indexing**: 3-14 days
- **Rich Results**: 2-4 weeks

Submit sitemap to speed up crawling.

### Q: Can I have multiple Product schemas on one page?

**A**: Generally no. One product per page is best practice. For variants:
- Use single Product schema
- Add multiple Offer objects

### Q: What if my product has no price?

**A**: You can:
- Omit the `offers` field entirely
- Or use: `"offers": { "@type": "Offer", "availability": "https://schema.org/Discontinued" }`

### Q: Should I include Product schema on listing pages?

**A**: No. Product schema is for **individual product pages** only. For listing pages:
- Use `ItemList` schema
- Or `CollectionPage` schema

### Q: Can Product schema hurt my SEO?

**A**: Only if:
- You use fake reviews (penalty)
- You have errors (no rich results)
- You mislead users (manual action)

Done correctly, it only helps!

---

**This guide was created as part of T227: Add structured data for Product pages**

*Last Updated: 2025-11-06*
*Version: 1.0*
