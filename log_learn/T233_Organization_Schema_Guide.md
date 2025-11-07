# T233: Organization Schema - Learning Guide

**Topic**: Schema.org Organization Structured Data for SEO
**Level**: Intermediate
**Prerequisites**: Basic understanding of HTML, JSON, and SEO concepts
**Estimated Reading Time**: 30 minutes

---

## Table of Contents

1. [What is Organization Structured Data?](#what-is-organization-structured-data)
2. [Why Organization Schema Matters for SEO](#why-organization-schema-matters-for-seo)
3. [Understanding Schema.org](#understanding-schemaorg)
4. [Organization Schema Properties](#organization-schema-properties)
5. [Implementation Overview](#implementation-overview)
6. [How the System Works](#how-the-system-works)
7. [Configuration Guide](#configuration-guide)
8. [SEO Benefits](#seo-benefits)
9. [Testing and Validation](#testing-and-validation)
10. [Best Practices](#best-practices)
11. [Common Pitfalls](#common-pitfalls)
12. [Advanced Techniques](#advanced-techniques)
13. [Resources](#resources)

---

## What is Organization Structured Data?

### Definition

**Organization structured data** is machine-readable information about your company, organization, or business that you add to your website. It uses the Schema.org vocabulary to tell search engines like Google:

- Who you are (organization name)
- What you do (description)
- Where to find you (URL, address)
- How to contact you (email, phone)
- Where to follow you (social media)

### Why It's Called "Structured" Data

**Unstructured** (how humans read it):
```html
<p>Mystic Ecommerce is a leading platform for spiritual growth.
Contact us at contact@mystic-ecom.com or find us on Facebook.</p>
```

Search engines see: "Some text about a company"

**Structured** (how machines read it):
```json
{
  "@type": "Organization",
  "name": "Mystic Ecommerce",
  "description": "A leading platform for spiritual growth",
  "email": "contact@mystic-ecom.com",
  "sameAs": ["https://facebook.com/mysticecommerce"]
}
```

Search engines see: "An Organization named 'Mystic Ecommerce' with these specific properties"

### The Problem It Solves

**Without Structured Data**:
- Search engines guess at your organization details
- Inconsistent information across platforms
- No official connection to social media profiles
- Generic search results without rich snippets

**With Structured Data**:
- Official, authoritative organization information
- Consistent branding across search results
- Verified social media connections
- Enhanced search results with logo, links, and details

---

## Why Organization Schema Matters for SEO

### 1. Google Knowledge Graph

**What is it?**: Google's database of entities (people, places, organizations)

**Benefits of Being in the Knowledge Graph**:
- **Knowledge Panel**: Box on right side of search results with your logo, description, social links
- **Brand Authority**: Google recognizes you as an official entity
- **Instant Answers**: Users get info about you without clicking

**Example**: Search for "Mystic Ecommerce" and see:
```
┌─────────────────────────────┐
│ [LOGO] Mystic Ecommerce     │
│                             │
│ Description: Leading...     │
│                             │
│ Social Media:               │
│ ◯ Facebook  ◯ Twitter      │
│ ◯ Instagram ◯ LinkedIn     │
│                             │
│ Website: mystic-ecom.com    │
└─────────────────────────────┘
```

### 2. Enhanced Search Results

**Organization Schema Enables**:
- Logo display in search results
- Site name enhancement
- Social profile links
- Contact information snippets

**Before** (without schema):
```
mystic-ecom.pages.dev
Spiritual growth platform...
```

**After** (with schema):
```
[LOGO] Mystic Ecommerce
mystic-ecom.pages.dev
Leading platform for spiritual growth, mindfulness, and wellness
☰ Facebook • Twitter • Instagram • LinkedIn
```

### 3. Social Media Verification

**sameAs Property** tells Google:
- "These are our OFFICIAL social media profiles"
- Connects website to social accounts
- Prevents impersonation
- Improves brand consistency

### 4. Trust Signals

**Comprehensive Organization Schema**:
- Signals professionalism to search engines
- Shows you're a legitimate, established business
- Provides transparency (contact info, founding date)
- Improves E-A-T (Expertise, Authoritativeness, Trustworthiness)

---

## Understanding Schema.org

### What is Schema.org?

**Schema.org** is a collaborative project created by:
- Google
- Microsoft (Bing)
- Yahoo
- Yandex

It's a standard vocabulary for structured data that ALL major search engines understand.

**Think of it as**: A universal language for describing things on the web

### Why Schema.org?

**Problem**: Every search engine had its own format for structured data
- Google wanted one format
- Bing wanted another
- Yahoo wanted yet another
- Developers had to implement multiple formats

**Solution**: Schema.org created ONE standard that everyone uses

### Schema.org Types

Schema.org defines hundreds of "types" (categories of things):
- **Organization**: Companies, businesses, groups
- **Person**: Individuals
- **Product**: Items for sale
- **Event**: Concerts, conferences, meetups
- **Course**: Educational content
- **Review**: User reviews and ratings
- And many more...

Each type has specific properties (attributes) you can use.

---

## Organization Schema Properties

### Required Properties

These are absolutely necessary for valid Organization schema:

#### 1. @context
```json
"@context": "https://schema.org"
```
**Purpose**: Tells parsers this uses Schema.org vocabulary
**Value**: Always `"https://schema.org"`

#### 2. @type
```json
"@type": "Organization"
```
**Purpose**: Specifies this is an Organization (not Person, Product, etc.)
**Value**: `"Organization"` or a more specific subtype

#### 3. name
```json
"name": "Mystic Ecommerce"
```
**Purpose**: Official organization name
**Format**: Plain text string
**Best Practice**: Use your legal or widely-known brand name

### Recommended Properties

Google recommends including these for best results:

#### 4. url
```json
"url": "https://mystic-ecom.pages.dev"
```
**Purpose**: Official website URL
**Format**: Absolute URL (must include https://)
**Best Practice**: Use your main homepage URL

#### 5. logo
```json
"logo": "https://mystic-ecom.pages.dev/logo.png"
```
**Purpose**: Organization logo image
**Format**: Absolute URL to image file
**Requirements**:
- Square image recommended (1:1 aspect ratio)
- Minimum 112x112px
- Maximum 10MB file size
- Formats: PNG, JPG, WebP

#### 6. description
```json
"description": "Leading platform for spiritual growth..."
```
**Purpose**: Brief description of what the organization does
**Format**: Plain text string
**Best Practice**:
- 1-2 sentences
- Include key services/products
- Natural language (not keyword stuffing)

#### 7. sameAs
```json
"sameAs": [
  "https://facebook.com/mysticecommerce",
  "https://twitter.com/mysticecommerce",
  "https://instagram.com/mysticecommerce"
]
```
**Purpose**: Links to official social media profiles
**Format**: Array of absolute URLs
**Supported Platforms**:
- Facebook, Twitter, Instagram, LinkedIn
- YouTube, Pinterest, TikTok
- Wikipedia, Crunchbase
- Any authoritative profile page

### Optional Properties

Include these if applicable:

#### 8. email
```json
"email": "contact@mystic-ecom.com"
```
**Purpose**: Contact email address
**Format**: Valid email address
**Privacy Note**: This will be public in your source code

#### 9. telephone
```json
"telephone": "+1-555-0100"
```
**Purpose**: Contact phone number
**Format**: E.164 format recommended (+country code)

#### 10. address
```json
"address": {
  "@type": "PostalAddress",
  "streetAddress": "123 Main Street",
  "addressLocality": "San Francisco",
  "addressRegion": "CA",
  "postalCode": "94102",
  "addressCountry": "US"
}
```
**Purpose**: Physical business address
**When to use**: If you have a physical location
**Benefits**: Enables local SEO, Google Maps integration

#### 11. foundingDate
```json
"foundingDate": "2024-01-01"
```
**Purpose**: When the organization was founded
**Format**: ISO 8601 date (YYYY-MM-DD)

#### 12. founder
```json
"founder": {
  "@type": "Person",
  "name": "Jane Doe"
}
```
**Purpose**: Who founded the organization
**Format**: Person or Organization object

---

## Implementation Overview

### Architecture

Our implementation has three main components:

```
┌──────────────────────────────────┐
│   BaseLayout.astro               │
│   (Every Page)                   │
│                                  │
│   Imports Organization schema    │
│   Renders JSON-LD script         │
└──────────┬───────────────────────┘
           │
           │ uses
           ▼
┌──────────────────────────────────┐
│   siteConfig.ts                  │
│   (Organization Data)            │
│                                  │
│   - Name, URL, Logo              │
│   - Social Media URLs            │
│   - Contact Information          │
└──────────┬───────────────────────┘
           │
           │ transformed by
           ▼
┌──────────────────────────────────┐
│   structuredData.ts              │
│   (Schema Generation)            │
│                                  │
│   - Adds @context, @type         │
│   - Formats as JSON-LD           │
│   - Validates structure          │
└──────────────────────────────────┘
```

### File Responsibilities

1. **`src/lib/siteConfig.ts`**
   - Stores all organization metadata
   - Provides helper functions
   - Single source of truth for org data

2. **`src/lib/structuredData.ts`**
   - Generates Schema.org JSON-LD
   - Validates data structure
   - Reusable across different schema types

3. **`src/layouts/BaseLayout.astro`**
   - Renders Organization schema on every page
   - Injects JSON-LD script into `<head>`
   - Ensures site-wide coverage

---

## How the System Works

### Step 1: Configuration

Define your organization details in `siteConfig.ts`:

```typescript
export const siteConfig = {
  name: 'Mystic Ecommerce',
  url: 'https://mystic-ecom.pages.dev',
  logo: 'https://mystic-ecom.pages.dev/logo.png',
  email: 'contact@mystic-ecom.com',
  // ... more fields
  socialMedia: {
    facebook: 'https://facebook.com/mysticecommerce',
    twitter: 'https://twitter.com/mysticecommerce',
    // ... more platforms
  },
};
```

### Step 2: Data Transformation

`getOrganizationData()` converts config to Schema.org format:

```typescript
export function getOrganizationData() {
  return {
    name: siteConfig.name,
    url: siteConfig.url,
    logo: siteConfig.logo,
    email: siteConfig.email,
    sameAs: Object.values(siteConfig.socialMedia).filter(Boolean),
    // ... more fields
  };
}
```

**Key transformation**:
- Social media object → `sameAs` array
- Filters out undefined values
- Prepares data for schema generation

### Step 3: Schema Generation

`generateOrganizationSchema()` adds Schema.org structure:

```typescript
const orgData = getOrganizationData();
const schema = generateOrganizationSchema(orgData);

// Result:
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Mystic Ecommerce",
  "url": "https://mystic-ecom.pages.dev",
  // ... all other properties
}
```

### Step 4: JSON-LD Injection

BaseLayout.astro renders the schema:

```astro
---
const organizationSchema = generateOrganizationSchema(getOrganizationData());
---

<html>
  <head>
    <!-- Organization Structured Data -->
    <script type="application/ld+json" set:html={JSON.stringify(organizationSchema)} />
  </head>
</html>
```

### Step 5: Search Engine Parsing

1. Google crawls your page
2. Finds `<script type="application/ld+json">`
3. Parses the JSON
4. Extracts Organization information
5. Adds to Knowledge Graph
6. Uses in search results

---

## Configuration Guide

### Basic Setup

#### 1. Update Organization Details

Edit `/src/lib/siteConfig.ts`:

```typescript
export const siteConfig = {
  name: 'Your Organization Name',
  description: 'What your organization does',
  url: 'https://your-domain.com',
  logo: 'https://your-domain.com/logo.png',
  email: 'contact@your-domain.com',
  foundingDate: '2024-01-01',

  founder: {
    '@type': 'Person',
    name: 'Founder Name',
  },

  socialMedia: {
    facebook: 'https://facebook.com/yourpage',
    twitter: 'https://twitter.com/yourhandle',
    instagram: 'https://instagram.com/yourhandle',
    linkedin: 'https://linkedin.com/company/yourcompany',
    youtube: 'https://youtube.com/@yourchannel',
  },
};
```

#### 2. Logo Requirements

Your logo should:
- **Format**: PNG, JPG, or WebP
- **Size**: Square (1:1 aspect ratio) recommended
- **Dimensions**: At least 112x112px
- **Quality**: High resolution (512x512px or larger is ideal)
- **Background**: Transparent or white background works best
- **URL**: Absolute URL (include https://)

**Example**:
```
❌ Bad: /logo.png (relative URL)
✅ Good: https://mystic-ecom.pages.dev/logo.png (absolute URL)
```

### Advanced Configuration

#### Adding Physical Address

If you have a physical location:

```typescript
export const siteConfig = {
  // ... other fields
  address: {
    '@type': 'PostalAddress',
    streetAddress: '123 Main Street, Suite 100',
    addressLocality: 'San Francisco',
    addressRegion: 'CA',
    postalCode: '94102',
    addressCountry: 'US',
  },
};
```

**Benefits**:
- Eligible for local search results
- Can appear in Google Maps
- Shows up in "near me" searches

#### Adding Phone Number

```typescript
export const siteConfig = {
  // ... other fields
  telephone: '+1-555-0100',
};
```

**Format**: International format recommended
- ✅ `+1-555-0100` (with country code)
- ✅ `+44-20-7946-0958` (UK)
- ❌ `555-0100` (missing country code)

#### Adding More Social Media

To add platforms not in default config:

```typescript
socialMedia: {
  facebook: 'https://facebook.com/yourpage',
  twitter: 'https://twitter.com/yourhandle',
  instagram: 'https://instagram.com/yourhandle',
  linkedin: 'https://linkedin.com/company/yourcompany',
  youtube: 'https://youtube.com/@yourchannel',

  // Add new platforms:
  tiktok: 'https://tiktok.com/@yourhandle',
  pinterest: 'https://pinterest.com/yourprofile',
  github: 'https://github.com/yourorg',
  medium: 'https://medium.com/@yourhandle',
}
```

**No code changes needed** - the system automatically includes all platforms in `sameAs`.

---

## SEO Benefits

### 1. Knowledge Graph Inclusion

**What Happens**:
Google adds your organization to its Knowledge Graph database.

**Results**:
- Knowledge Panel on branded searches
- Logo display in search results
- Quick facts about your organization
- Social media links

**Timeline**: 2-8 weeks after implementation

### 2. Enhanced Brand Presence

**Search Result Enhancements**:
- Your logo appears next to your site name
- Breadcrumbs use your organization name
- Site name shows consistently
- Social profiles linked

### 3. Social Media Discovery

**How It Works**:
The `sameAs` property tells Google which social profiles are official.

**Benefits**:
- Verified connection between website and social accounts
- Social profiles may appear in Knowledge Panel
- Helps prevent impersonation
- Improves brand consistency

### 4. Trust and Authority

**E-A-T Signals**:
- **Expertise**: Description shows what you do
- **Authoritativeness**: Founding date shows establishment
- **Trustworthiness**: Contact info shows transparency

**Result**: Higher rankings for branded and relevant searches

---

## Testing and Validation

### 1. Google Rich Results Test

**URL**: https://search.google.com/test/rich-results

**Steps**:
1. Go to the tool
2. Enter your page URL
3. Click "Test URL"
4. Wait for results

**What to Look For**:
```
✓ Organization detected
  Valid Organization schema found

Properties:
  name: "Mystic Ecommerce"
  url: "https://mystic-ecom.pages.dev"
  logo: "https://mystic-ecom.pages.dev/logo.png"
  sameAs: 5 URLs
```

**If Errors**:
- Red X = Invalid schema (fix required)
- Yellow ! = Warning (optional fix)
- Green ✓ = Valid schema

### 2. Schema Markup Validator

**URL**: https://validator.schema.org/

**Steps**:
1. View page source in browser
2. Copy the JSON-LD `<script>` content
3. Paste into validator
4. Check results

**Expected**: "No errors found"

### 3. Manual HTML Inspection

**Steps**:
1. Visit any page on your site
2. Right-click → "View Page Source"
3. Search for `"@type": "Organization"`
4. Verify JSON-LD script is present

**Example of what you should see**:
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Mystic Ecommerce",
  ...
}
</script>
```

### 4. Google Search Console

**Monitor Structured Data**:
1. Go to Google Search Console
2. Navigate to "Enhancements" → "Structured Data"
3. Check for errors or warnings
4. Monitor "Valid items" count

**Healthy Status**:
- Valid items: Increasing
- Errors: 0
- Warnings: 0 (or minimal)

---

## Best Practices

### 1. Use Absolute URLs

**❌ Wrong**:
```json
{
  "logo": "/logo.png",
  "sameAs": ["/facebook"]
}
```

**✅ Correct**:
```json
{
  "logo": "https://mystic-ecom.pages.dev/logo.png",
  "sameAs": ["https://facebook.com/mysticecommerce"]
}
```

**Why**: Schema.org requires absolute URLs for proper identification.

### 2. Keep Information Accurate

**✅ Do**:
- Use official organization name
- Provide current contact information
- Link to active social media profiles
- Update when details change

**❌ Don't**:
- Use fake or placeholder data
- Link to inactive profiles
- Include outdated information

### 3. Be Consistent Across Platforms

**Consistency Matters**:
- Same organization name everywhere
- Same logo on all platforms
- Same description (or similar)
- Same contact information

**Example**:
- Website: "Mystic Ecommerce"
- Facebook: "Mystic Ecommerce"
- LinkedIn: "Mystic Ecommerce Inc."
- ✅ Close enough for consistency

### 4. Include Only Official Profiles

**sameAs Should Include**:
- ✅ Your official Facebook page
- ✅ Your official Twitter account
- ✅ Your verified LinkedIn company page

**sameAs Should NOT Include**:
- ❌ Employee personal accounts
- ❌ Fan pages
- ❌ Unofficial accounts
- ❌ Parody accounts

### 5. Test Before Deploying

**Pre-Deployment Checklist**:
- [ ] All URLs are absolute
- [ ] Logo image is accessible
- [ ] Social media links work
- [ ] Email is correct
- [ ] Schema validates without errors
- [ ] JSON-LD appears in page source

### 6. Monitor Search Console

**Regular Checks**:
- Weekly: Check for new errors
- Monthly: Review valid items count
- Quarterly: Verify data is still accurate

---

## Common Pitfalls

### 1. Relative URLs

**❌ Problem**:
```json
"logo": "/images/logo.png"
```

**Why It Fails**: Search engines can't determine the full URL

**✅ Fix**:
```json
"logo": "https://mystic-ecom.pages.dev/images/logo.png"
```

### 2. Multiple Organization Schemas

**❌ Problem**:
Having multiple `@type: Organization` schemas on one page

**Why It's Bad**: Search engines don't know which is official

**✅ Fix**:
Only include Organization schema in BaseLayout (appears once per page)

### 3. Missing Required Properties

**❌ Problem**:
```json
{
  "@context": "https://schema.org",
  "@type": "Organization"
  // Missing name!
}
```

**Why It Fails**: `name` is required

**✅ Fix**:
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Mystic Ecommerce"
}
```

### 4. Broken Logo Image

**❌ Problem**:
Logo URL returns 404 error

**Impact**: Google can't display your logo

**✅ Fix**:
- Test logo URL in browser
- Ensure image is accessible
- Check for typos in URL

### 5. Inconsistent Information

**❌ Problem**:
- Website says: "Mystic E-commerce"
- Schema says: "Mystic Ecommerce"
- Facebook says: "Mystic Ecom"

**Impact**: Confuses search engines, weakens brand

**✅ Fix**: Use exact same name everywhere

### 6. Including Personal Email

**❌ Problem**:
```json
"email": "john.doe.personal@gmail.com"
```

**Why It's Bad**:
- Not professional
- Privacy concern
- Not official contact

**✅ Fix**:
```json
"email": "contact@mystic-ecom.com"
```

---

## Advanced Techniques

### 1. Organization Subtypes

Instead of generic "Organization", use specific subtypes:

**Available Subtypes**:
- `Corporation`: For-profit company
- `LocalBusiness`: Physical storefront
- `EducationalOrganization`: Schools, universities
- `NonprofitOrganization`: Charities, NGOs
- `OnlineBusiness`: E-commerce only
- `SportsOrganization`: Sports teams, leagues

**Example**:
```json
{
  "@type": "Corporation",  // More specific than "Organization"
  "name": "Mystic Ecommerce Inc.",
  ...
}
```

**Benefits**: More precise categorization for search engines

### 2. Multiple Founders

If your organization has multiple founders:

```json
{
  "founder": [
    {
      "@type": "Person",
      "name": "Jane Doe"
    },
    {
      "@type": "Person",
      "name": "John Smith"
    }
  ]
}
```

### 3. Nested Organization

If you have parent/subsidiary structure:

```json
{
  "@type": "Organization",
  "name": "Mystic Ecommerce",
  "parentOrganization": {
    "@type": "Corporation",
    "name": "Mystic Holdings LLC"
  }
}
```

Or:

```json
{
  "@type": "Organization",
  "name": "Mystic Holdings LLC",
  "subOrganization": [
    {
      "@type": "Organization",
      "name": "Mystic Ecommerce"
    }
  ]
}
```

### 4. Contact Points

More detailed contact information:

```json
{
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+1-555-0100",
    "contactType": "customer service",
    "email": "support@mystic-ecom.com",
    "availableLanguage": ["English", "Spanish"],
    "areaServed": "US"
  }
}
```

**Contact Types**:
- `customer service`
- `technical support`
- `sales`
- `billing`
- `reservations`

### 5. Opening Hours (for physical locations)

```json
{
  "openingHoursSpecification": {
    "@type": "OpeningHoursSpecification",
    "dayOfWeek": [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday"
    ],
    "opens": "09:00",
    "closes": "17:00"
  }
}
```

---

## Real-World Examples

### Example 1: E-commerce Store

```json
{
  "@context": "https://schema.org",
  "@type": "OnlineBusiness",
  "name": "Mystic Ecommerce",
  "url": "https://mystic-ecom.pages.dev",
  "logo": "https://mystic-ecom.pages.dev/logo.png",
  "description": "Online store for spiritual products and wellness courses",
  "email": "support@mystic-ecom.com",
  "sameAs": [
    "https://facebook.com/mysticecommerce",
    "https://instagram.com/mysticecommerce"
  ],
  "foundingDate": "2024-01-01"
}
```

### Example 2: Local Business with Address

```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Mindful Yoga Studio",
  "url": "https://mindfulyoga.example",
  "logo": "https://mindfulyoga.example/logo.png",
  "description": "Community yoga studio offering classes for all levels",
  "telephone": "+1-555-0100",
  "email": "info@mindfulyoga.example",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "456 Zen Boulevard",
    "addressLocality": "Boulder",
    "addressRegion": "CO",
    "postalCode": "80302",
    "addressCountry": "US"
  },
  "sameAs": [
    "https://facebook.com/mindfulyogastudio",
    "https://instagram.com/mindfulyogastudio"
  ]
}
```

### Example 3: Non-Profit Organization

```json
{
  "@context": "https://schema.org",
  "@type": "NonprofitOrganization",
  "name": "Meditation for Peace Foundation",
  "url": "https://meditationforpeace.org",
  "logo": "https://meditationforpeace.org/logo.png",
  "description": "Non-profit promoting peace through meditation and mindfulness",
  "email": "contact@meditationforpeace.org",
  "foundingDate": "2020-03-15",
  "founder": {
    "@type": "Person",
    "name": "Sarah Johnson"
  },
  "sameAs": [
    "https://facebook.com/meditationforpeace",
    "https://twitter.com/med4peace",
    "https://linkedin.com/company/meditation-for-peace"
  ]
}
```

---

## Troubleshooting

### Schema Not Detected

**Possible Causes**:
1. JSON syntax error
2. Schema in wrong location (not in `<head>`)
3. Missing `@context` or `@type`

**How to Fix**:
1. Validate JSON with https://jsonlint.com/
2. Check page source for `<script type="application/ld+json">`
3. Verify `@context` and `@type` are present

### Logo Not Showing

**Possible Causes**:
1. Image URL returns 404
2. Image is too small (< 112x112px)
3. URL is relative, not absolute

**How to Fix**:
1. Test logo URL in browser
2. Check image dimensions
3. Use absolute URL with https://

### Knowledge Panel Not Appearing

**Timeline**: Can take 2-8 weeks

**Requirements**:
- Valid Organization schema
- Sufficient brand searches
- Consistent information across web
- Active social media presence

**Note**: Not guaranteed - Google decides which organizations get Knowledge Panels

---

## Summary

### Key Takeaways

1. **Organization Schema is Essential**: Helps search engines understand your brand
2. **Simple to Implement**: Just add JSON-LD script to your pages
3. **SEO Benefits**: Enhanced search results, Knowledge Graph, brand authority
4. **Centralized Configuration**: Easy to maintain in one config file
5. **Test Before Deploying**: Use Google Rich Results Test

### Quick Reference

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Your Organization Name",
  "url": "https://your-domain.com",
  "logo": "https://your-domain.com/logo.png",
  "description": "What you do",
  "email": "contact@your-domain.com",
  "sameAs": [
    "https://facebook.com/yourpage",
    "https://twitter.com/yourhandle"
  ],
  "foundingDate": "2024-01-01"
}
```

### Next Steps

1. **Update siteConfig.ts** with your organization details
2. **Test** with Google Rich Results Test
3. **Deploy** to production
4. **Monitor** Google Search Console for errors
5. **Wait** 2-8 weeks for Knowledge Graph inclusion
6. **Verify** logo appears in search results

---

## Resources

### Official Documentation

- [Schema.org Organization](https://schema.org/Organization)
- [Google Search - Organization Structured Data](https://developers.google.com/search/docs/appearance/structured-data/organization)
- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [Schema.org Validator](https://validator.schema.org/)

### Tools

- [Google Rich Results Test](https://search.google.com/test/rich-results) - Validate your schema
- [Schema Markup Validator](https://validator.schema.org/) - Check JSON-LD syntax
- [Google Search Console](https://search.google.com/search-console) - Monitor structured data
- [JSON-LD Playground](https://json-ld.org/playground/) - Experiment with JSON-LD

### Further Reading

- [JSON-LD Official Site](https://json-ld.org/) - Learn about JSON-LD format
- [Google Knowledge Graph](https://www.google.com/intl/en/insidesearch/features/search/knowledge.html) - About Knowledge Graph
- [Structured Data Best Practices](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data) - Google's guidelines

---

**Learning Guide Complete**
**Ready to implement Organization schema**: ✅
**Questions?** Refer to the [Resources](#resources) section for further learning.
