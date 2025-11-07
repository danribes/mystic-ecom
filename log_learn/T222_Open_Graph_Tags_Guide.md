# T222: Open Graph Meta Tags - Learning Guide

**Task ID**: T222  
**Topic**: Open Graph Protocol for Social Media Sharing  
**Level**: Intermediate  
**Date**: 2025-11-06

---

## Table of Contents
1. [What is Open Graph?](#what-is-open-graph)
2. [Why Open Graph Matters](#why-open-graph-matters)
3. [Required Properties](#required-properties)
4. [Optional Properties](#optional-properties)
5. [Content Types](#content-types)
6. [Image Best Practices](#image-best-practices)
7. [Implementation Guide](#implementation-guide)
8. [Testing and Debugging](#testing-and-debugging)
9. [Common Mistakes](#common-mistakes)
10. [Platform-Specific Notes](#platform-specific-notes)

---

## What is Open Graph?

**Open Graph Protocol** (OGP) is a standard created by Facebook in 2010 that allows web pages to become rich objects in social graphs. When you share a URL on social media, the platform reads Open Graph meta tags to create rich previews with images, titles, and descriptions.

### Before Open Graph
```
Someone shares: https://example.com/blog/meditation
Facebook shows: https://example.com/blog/meditation
```
Just a plain URL - not very appealing!

### With Open Graph
```
Someone shares: https://example.com/blog/meditation
Facebook shows:
┌─────────────────────────────────┐
│ [Beautiful meditation image]     │
├─────────────────────────────────┤
│ Complete Meditation Guide        │
│ example.com                      │
│                                  │
│ Learn meditation from scratch... │
└─────────────────────────────────┘
```
Rich, engaging preview with image, title, and description!

### How It Works

1. **User shares URL** on Facebook, LinkedIn, WhatsApp, etc.
2. **Platform fetches the page** to read meta tags
3. **Platform reads OG tags** from the `<head>` section
4. **Platform creates rich preview** using the metadata
5. **Preview appears** in the user's feed or message

---

## Why Open Graph Matters

### 1. Higher Click-Through Rates
Rich previews with images are **5-10x more likely** to be clicked than plain URLs.

### 2. Professional Appearance
Your content looks polished and trustworthy on social media.

### 3. Control Your Narrative
You decide exactly how your content appears when shared.

### 4. Universal Standard
Works across multiple platforms:
- Facebook
- LinkedIn
- WhatsApp
- Slack
- Discord
- Pinterest
- Reddit
- Many more

### 5. SEO Benefits
While not a direct ranking factor, social sharing signals can indirectly benefit SEO.

---

## Required Properties

Open Graph requires 5 essential properties:

### 1. og:title
The title of your content as it should appear when shared.

```html
<meta property="og:title" content="Complete Meditation Guide for Beginners" />
```

**Best Practices**:
- 60-90 characters optimal
- Include keywords
- Be descriptive and compelling
- Don't just copy page title - optimize for sharing

### 2. og:description
A one to two sentence description of your content.

```html
<meta property="og:description" content="Learn meditation from scratch with our comprehensive guide. Includes techniques, benefits, and tips for beginners." />
```

**Best Practices**:
- 200 characters maximum
- 150-160 characters optimal
- Compelling and informative
- Include a call-to-action or value proposition

### 3. og:image
An image URL representing the content.

```html
<meta property="og:image" content="https://example.com/images/meditation-guide.jpg" />
```

**Best Practices**:
- 1200x630 pixels (1.91:1 aspect ratio)
- Under 8MB file size
- JPG or PNG format
- Must be absolute URL (https://..., not /images/...)
- High quality, relevant image

### 4. og:url
The canonical URL of the page.

```html
<meta property="og:url" content="https://example.com/blog/meditation-guide" />
```

**Best Practices**:
- Use the canonical URL (the "main" version)
- Include https://
- No tracking parameters
- Clean, descriptive URL

### 5. og:type
The type of content.

```html
<meta property="og:type" content="article" />
```

**Common Types**:
- `website` - General pages (default)
- `article` - Blog posts, news articles
- `video` - Video content
- `music` - Music content
- `profile` - User profiles
- `book` - Books

---

## Optional Properties

### og:site_name
The name of your website/brand.

```html
<meta property="og:site_name" content="Spirituality Platform" />
```

Shows below the title in social previews.

### og:locale
The language and region.

```html
<meta property="og:locale" content="en_US" />
```

Common values: `en_US`, `en_GB`, `fr_FR`, `es_ES`

### Image Metadata
Additional image information:

```html
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="Person meditating in peaceful environment" />
<meta property="og:image:type" content="image/jpeg" />
```

**Why it matters**: Helps platforms render the preview faster and provides accessibility.

---

## Content Types

Different content types have specific properties:

### Website (Default)
```html
<meta property="og:type" content="website" />
<meta property="og:title" content="Home | Spirituality Platform" />
<meta property="og:description" content="..." />
<meta property="og:image" content="..." />
<meta property="og:url" content="..." />
```

### Article
For blog posts, news articles:

```html
<meta property="og:type" content="article" />
<meta property="article:published_time" content="2025-11-06T10:00:00Z" />
<meta property="article:modified_time" content="2025-11-06T15:30:00Z" />
<meta property="article:author" content="Jane Smith" />
<meta property="article:section" content="Meditation" />
<meta property="article:tag" content="mindfulness" />
<meta property="article:tag" content="wellness" />
```

### Video
For video content:

```html
<meta property="og:type" content="video" />
<meta property="video:url" content="https://example.com/video.mp4" />
<meta property="video:secure_url" content="https://example.com/video.mp4" />
<meta property="video:type" content="video/mp4" />
<meta property="video:width" content="1280" />
<meta property="video:height" content="720" />
<meta property="video:duration" content="600" />
```

### Profile
For user profiles:

```html
<meta property="og:type" content="profile" />
<meta property="profile:first_name" content="Jane" />
<meta property="profile:last_name" content="Smith" />
<meta property="profile:username" content="janesmith" />
<meta property="profile:gender" content="female" />
```

### Book
For books:

```html
<meta property="og:type" content="book" />
<meta property="book:author" content="Jane Smith" />
<meta property="book:isbn" content="978-3-16-148410-0" />
<meta property="book:release_date" content="2025-11-06" />
<meta property="book:tag" content="spirituality" />
```

---

## Image Best Practices

### Optimal Dimensions
- **Recommended**: 1200x630 pixels
- **Aspect Ratio**: 1.91:1
- **Minimum**: 600x314 pixels
- **Maximum**: 8MB file size

### Why 1200x630?
- Works across all platforms
- High enough resolution for retina displays
- Not too large (loads quickly)
- Facebook's recommended size

### Image Requirements

**Must Have**:
- Absolute URL (`https://example.com/image.jpg`)
- Publicly accessible (not behind login)
- Fast loading
- High quality

**Should Have**:
- Relevant to content
- Clear and readable
- Text overlay readable at small sizes
- Branded (includes logo or brand colors)

### Creating OG Images

**Tools**:
- Canva (easiest)
- Figma (for designers)
- Adobe Photoshop
- Automated tools (og-image.vercel.app)

**Template Ideas**:
1. Hero image + title overlay
2. Product photo + description
3. Author photo + quote
4. Data visualization
5. Before/after images

---

## Implementation Guide

### Astro Component

```astro
---
import OpenGraph from '@/components/OpenGraph.astro';
---

<head>
  <OpenGraph
    title="Complete Meditation Guide"
    description="Learn meditation from scratch with our comprehensive guide"
    image="/images/meditation-guide.jpg"
    url="https://example.com/blog/meditation-guide"
    type="article"
    publishedTime="2025-11-06T10:00:00Z"
    author="Jane Smith"
    section="Meditation"
    tags={["mindfulness", "meditation", "wellness"]}
  />
</head>
```

### React/Next.js

```jsx
import Head from 'next/head';

export default function Page() {
  return (
    <>
      <Head>
        <meta property="og:title" content="Complete Meditation Guide" />
        <meta property="og:description" content="Learn meditation from scratch..." />
        <meta property="og:image" content="https://example.com/images/meditation.jpg" />
        <meta property="og:url" content="https://example.com/blog/meditation" />
        <meta property="og:type" content="article" />
      </Head>
      {/* Page content */}
    </>
  );
}
```

### Vue/Nuxt

```vue
<template>
  <div>
    <!-- Page content -->
  </div>
</template>

<script>
export default {
  head() {
    return {
      meta: [
        { hid: 'og:title', property: 'og:title', content: 'Complete Meditation Guide' },
        { hid: 'og:description', property: 'og:description', content: '...' },
        { hid: 'og:image', property: 'og:image', content: 'https://example.com/...' },
        { hid: 'og:url', property: 'og:url', content: 'https://example.com/...' },
        { hid: 'og:type', property: 'og:type', content: 'article' },
      ]
    }
  }
}
</script>
```

---

## Testing and Debugging

### 1. Facebook Sharing Debugger
**URL**: https://developers.facebook.com/tools/debug/

**How to Use**:
1. Enter your page URL
2. Click "Debug"
3. View how page will appear on Facebook
4. Check for warnings or errors
5. Click "Scrape Again" to refresh cached data

**Common Issues**:
- Image not loading (check absolute URL)
- Incorrect image size
- Missing required properties
- Cache needs clearing

### 2. LinkedIn Post Inspector
**URL**: https://www.linkedin.com/post-inspector/

**How to Use**:
1. Enter your page URL
2. View preview
3. Check image, title, description

### 3. WhatsApp Link Preview
**How to Test**:
1. Send URL to yourself in WhatsApp
2. Wait for preview to generate
3. Check image and text

### 4. Slack Link Preview
**How to Test**:
1. Post URL in Slack channel or DM
2. Wait for unfurling
3. Check preview appearance

### 5. Browser DevTools
**Manual Check**:
1. Open page in browser
2. View page source (Ctrl+U or Cmd+U)
3. Search for "og:"
4. Verify all tags present and correct

---

## Common Mistakes

### Mistake 1: Relative Image URLs

❌ **Wrong**:
```html
<meta property="og:image" content="/images/og-image.jpg" />
```

✅ **Correct**:
```html
<meta property="og:image" content="https://example.com/images/og-image.jpg" />
```

**Why**: Social platforms need absolute URLs to fetch images from external servers.

---

### Mistake 2: Wrong Image Dimensions

❌ **Wrong**:
```html
<!-- Square image -->
<meta property="og:image" content="https://example.com/square.jpg" />
```

✅ **Correct**:
```html
<!-- 1.91:1 ratio -->
<meta property="og:image" content="https://example.com/1200x630.jpg" />
```

**Why**: Images will be cropped or stretched if wrong dimensions.

---

### Mistake 3: Images Behind Authentication

❌ **Wrong**:
```html
<meta property="og:image" content="https://example.com/user/avatar.jpg" />
<!-- Requires login to access -->
```

✅ **Correct**:
```html
<meta property="og:image" content="https://example.com/public/default-avatar.jpg" />
<!-- Publicly accessible -->
```

**Why**: Social platforms can't access images that require authentication.

---

### Mistake 4: Missing Required Properties

❌ **Wrong**:
```html
<meta property="og:title" content="My Page" />
<meta property="og:image" content="..." />
<!-- Missing og:url, og:description, og:type -->
```

✅ **Correct**:
```html
<meta property="og:title" content="My Page" />
<meta property="og:description" content="..." />
<meta property="og:image" content="..." />
<meta property="og:url" content="..." />
<meta property="og:type" content="website" />
```

---

### Mistake 5: Not Testing

❌ **Wrong**: Deploy without testing

✅ **Correct**: Test with Facebook Debugger, LinkedIn Inspector, and real shares

---

## Platform-Specific Notes

### Facebook
- Caches OG data aggressively
- Use Sharing Debugger to clear cache
- Requires absolute URLs for images
- Recommended image: 1200x630px

### LinkedIn
- Uses OG tags
- Also has own `linkedin:` prefix tags
- Strict about image dimensions
- Caches for 7 days

### WhatsApp
- Uses OG tags
- Works on mobile and web
- Shows image, title, description
- Fast caching

### Slack
- Calls it "unfurling"
- Uses OG tags
- Can disable for specific domains
- Shows rich previews in channels

### Twitter
- Prefers Twitter Cards (`twitter:` prefix)
- Falls back to OG tags if Twitter Cards missing
- See T223 for Twitter Cards implementation

---

## Key Takeaways

1. **Open Graph controls social sharing appearance**
2. **5 required properties**: title, description, image, url, type
3. **Images must be 1200x630px and absolute URLs**
4. **Different content types have specific properties**
5. **Always test with Facebook Debugger**
6. **Platforms cache OG data - use debuggers to refresh**

---

## Further Reading

- **Official Spec**: https://ogp.me
- **Facebook Docs**: https://developers.facebook.com/docs/sharing/webmasters
- **Best Practices**: https://www.opengraphprotocol.org/
- **Image Generator**: https://og-image.vercel.app

---

**Last Updated**: 2025-11-06  
**Author**: Claude Code (Anthropic)  
**Version**: 1.0
