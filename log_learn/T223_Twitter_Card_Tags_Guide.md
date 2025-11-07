# T223: Twitter Card Meta Tags - Learning Guide

**Task ID**: T223
**Topic**: Twitter Cards for Social Media Sharing
**Level**: Intermediate
**Date**: 2025-11-06

---

## Table of Contents
1. [What are Twitter Cards?](#what-are-twitter-cards)
2. [Why Twitter Cards Matter](#why-twitter-cards-matter)
3. [Card Types](#card-types)
4. [Required Properties](#required-properties)
5. [Optional Properties](#optional-properties)
6. [Implementation Guide](#implementation-guide)
7. [Best Practices](#best-practices)
8. [Testing and Debugging](#testing-and-debugging)
9. [Common Mistakes](#common-mistakes)
10. [Platform Differences](#platform-differences)

---

## What are Twitter Cards?

**Twitter Cards** are rich media attachments that appear when URLs are shared on Twitter (now X). Instead of showing just a plain link, Twitter Cards display images, titles, descriptions, and other rich content.

### Before Twitter Cards
When you share a URL on Twitter without Twitter Cards:
```
Check out this article: https://example.com/meditation-guide
```
Result: Just plain text with a clickable link.

### With Twitter Cards
When you share the same URL with Twitter Cards:
```
┌─────────────────────────────────────┐
│                                     │
│   [Beautiful meditation image]       │
│   1200x628px                         │
│                                     │
├─────────────────────────────────────┤
│ Complete Meditation Guide           │
│ example.com                          │
│                                     │
│ Learn meditation from scratch with  │
│ our comprehensive guide for...      │
└─────────────────────────────────────┘
```
Result: Rich, visual preview that's 5-10x more likely to be clicked!

### How It Works

1. **User tweets a URL** from your website
2. **Twitter fetches your page** to read the HTML
3. **Twitter looks for Twitter Card meta tags** in the `<head>` section
4. **Twitter creates a rich preview** based on the metadata
5. **Card appears** in the user's timeline and the tweet

---

## Why Twitter Cards Matter

### 1. Increased Engagement
- **5-10x higher click-through rates** compared to plain URLs
- **More retweets and likes** due to visual appeal
- **Longer dwell time** on tweets with cards

### 2. Brand Visibility
- **Professional appearance** builds trust
- **Consistent branding** across all shared links
- **Recognition** through custom images and descriptions

### 3. Control Your Message
- **You decide** what image, title, and description appear
- **Optimize for conversions** with compelling copy
- **A/B test** different card variations

### 4. Analytics
- Track how your content performs on Twitter
- Measure referral traffic
- Understand what resonates with your audience

### 5. SEO Benefits
While not a direct ranking factor:
- Increased social signals
- More traffic to your site
- Greater brand awareness

---

## Card Types

Twitter supports four main card types:

### 1. Summary Card (`summary`)

**Use Case**: General content, articles, pages

**Appearance**:
- Small square image (144x144px minimum)
- Title (70 characters max)
- Description (200 characters max)
- Site attribution

**Visual Layout**:
```
┌────────┬─────────────────────┐
│        │ Title               │
│ [IMG]  │ example.com         │
│        │ Description text... │
└────────┴─────────────────────┘
```

**When to Use**:
- Blog posts
- Articles
- General pages
- When you want text to be prominent

**Example**:
```astro
<TwitterCard
  card="summary"
  title="Complete Meditation Guide"
  description="Learn meditation from scratch"
  image="/images/meditation-square.jpg"
/>
```

---

### 2. Summary Card with Large Image (`summary_large_image`)

**Use Case**: Visual content, courses, events, products

**Appearance**:
- Large rectangular image (1200x628px recommended)
- Title (70 characters max)
- Description (200 characters max)
- Site attribution

**Visual Layout**:
```
┌─────────────────────────────┐
│                             │
│   [LARGE IMAGE]             │
│   1200x628px                │
│                             │
├─────────────────────────────┤
│ Title                       │
│ example.com                 │
│ Description text here...    │
└─────────────────────────────┘
```

**When to Use**:
- Courses and programs
- Events and webinars
- Products
- Visual content
- When image is the main draw

**Example**:
```astro
<TwitterCard
  card="summary_large_image"
  title="Mindfulness Meditation Course"
  description="8-week program to master meditation"
  image="/images/course-banner.jpg"
/>
```

**Note**: This is the **default and recommended** card type for most use cases.

---

### 3. App Card (`app`)

**Use Case**: Mobile app promotion

**Appearance**:
- App icon and screenshots
- App name and description
- Platform-specific install buttons
- Deep links to app stores

**Visual Layout**:
```
┌─────────────────────────────┐
│   [App Screenshot]          │
├─────────────────────────────┤
│ [Icon] App Name             │
│ Category • ★★★★★           │
│ Description                 │
│ [Install on iPhone]         │
│ [Get it on Google Play]     │
└─────────────────────────────┘
```

**When to Use**:
- Promoting your mobile app
- App launch announcements
- App update notifications

**Platform Support**:
- iPhone
- iPad
- Google Play (Android)

**Example**:
```astro
<TwitterCard
  card="app"
  title="Meditation App"
  description="Meditate anywhere with our mobile app"
  image="/images/app-screenshot.jpg"
  appName={{
    iphone: "Meditation App",
    ipad: "Meditation App HD",
    googleplay: "Meditation App"
  }}
  appId={{
    iphone: "123456789",
    ipad: "123456789",
    googleplay: "com.example.meditation"
  }}
  appUrl={{
    iphone: "meditation://open",
    ipad: "meditation://open",
    googleplay: "meditation://open"
  }}
/>
```

---

### 4. Player Card (`player`)

**Use Case**: Video and audio content

**Appearance**:
- Embedded video/audio player
- Play button overlay
- Title and description
- Full-screen option

**Visual Layout**:
```
┌─────────────────────────────┐
│                             │
│      ▶ [Video Player]       │
│      with controls          │
│                             │
├─────────────────────────────┤
│ Video Title                 │
│ example.com                 │
│ Description                 │
└─────────────────────────────┘
```

**When to Use**:
- Video content
- Podcasts and audio
- Webinar recordings
- Live streams

**Requirements**:
- Player must be on HTTPS
- Player must be in an iframe
- Must support Twitter Card player specs

**Example**:
```astro
<TwitterCard
  card="player"
  title="Guided Meditation Session"
  description="30-minute guided meditation for beginners"
  image="/images/video-thumbnail.jpg"
  playerUrl="https://example.com/player.html"
  playerWidth={1280}
  playerHeight={720}
  playerStream="https://example.com/stream.mp4"
/>
```

---

## Required Properties

All Twitter Cards require these four properties:

### 1. `twitter:card`
The type of card (summary, summary_large_image, app, or player).

```html
<meta name="twitter:card" content="summary_large_image" />
```

**Values**:
- `summary` - Small image card
- `summary_large_image` - Large image card (recommended)
- `app` - App promotion card
- `player` - Video/audio player card

### 2. `twitter:title`
The title of your content (70 characters max).

```html
<meta name="twitter:title" content="Complete Meditation Guide" />
```

**Best Practices**:
- Keep under 70 characters (Twitter truncates longer titles)
- Make it compelling and descriptive
- Include keywords
- Don't just copy page title - optimize for sharing

### 3. `twitter:description`
A description of your content (200 characters max).

```html
<meta name="twitter:description" content="Learn meditation from scratch with our comprehensive guide for beginners." />
```

**Best Practices**:
- Keep under 200 characters (Twitter truncates longer descriptions)
- Include a value proposition or call-to-action
- Be specific and compelling
- Avoid generic descriptions

### 4. `twitter:image`
An absolute URL to the card image.

```html
<meta name="twitter:image" content="https://example.com/images/og-image.jpg" />
```

**Best Practices**:
- **Must be absolute URL** (https://..., not /images/...)
- Recommended: 1200x628px for large image cards
- Recommended: 144x144px minimum for summary cards
- Under 5MB file size
- JPG, PNG, WEBP, or GIF format
- Publicly accessible (not behind authentication)

---

## Optional Properties

### `twitter:site`
Twitter username of the website or brand.

```html
<meta name="twitter:site" content="@spirituality" />
```

**Format**: Must start with @ symbol
**Example**: `@yourbrand`
**Appears**: In card attribution

### `twitter:creator`
Twitter username of the content creator.

```html
<meta name="twitter:creator" content="@janesmith" />
```

**Format**: Must start with @ symbol
**Example**: `@username`
**Appears**: In card attribution (when different from site)

### `twitter:image:alt`
Alt text for the image (accessibility).

```html
<meta name="twitter:image:alt" content="Person meditating in a peaceful environment" />
```

**Why Important**:
- Accessibility for screen readers
- Improves SEO
- Shows if image fails to load

**Best Practices**:
- Describe what's in the image
- Be concise but descriptive
- Don't start with "Image of..."

---

## Implementation Guide

### Astro Component Approach (Recommended)

We created a dedicated `TwitterCard.astro` component for clean, reusable implementation.

#### Step 1: Create TwitterCard Component

**File**: `src/components/TwitterCard.astro`

```astro
---
interface Props {
  card?: 'summary' | 'summary_large_image' | 'app' | 'player';
  title: string;
  description: string;
  image: string;
  site?: string;
  creator?: string;
  imageAlt?: string;
}

const {
  card = 'summary_large_image',
  title,
  description,
  image,
  site,
  creator,
  imageAlt,
} = Astro.props;

// Convert relative URLs to absolute
const siteUrl = Astro.site?.origin || Astro.url.origin;
const absoluteImageUrl = image.startsWith('http')
  ? image
  : `${siteUrl}${image}`;

// Use title as fallback alt text
const imageAltText = imageAlt || title;
---

<!-- Required Properties -->
<meta name="twitter:card" content={card} />
<meta name="twitter:title" content={title} />
<meta name="twitter:description" content={description} />
<meta name="twitter:image" content={absoluteImageUrl} />

<!-- Optional Properties -->
{site && <meta name="twitter:site" content={site} />}
{creator && <meta name="twitter:creator" content={creator} />}
{imageAlt && <meta name="twitter:image:alt" content={imageAltText} />}
```

#### Step 2: Use in SEO Component

**File**: `src/components/SEO.astro`

```astro
---
import TwitterCard from '@/components/TwitterCard.astro';

const { title, description, image, twitterCard, twitterSite, twitterCreator } = Astro.props;
---

<head>
  <!-- Other SEO tags -->

  <TwitterCard
    card={twitterCard}
    title={title}
    description={description}
    image={image}
    site={twitterSite}
    creator={twitterCreator}
  />
</head>
```

#### Step 3: Use in Pages

```astro
---
import SEO from '@/components/SEO.astro';
---

<html>
  <head>
    <SEO
      title="Complete Meditation Guide"
      description="Learn meditation from scratch"
      ogImage="/images/meditation-guide.jpg"
      twitterCard="summary_large_image"
      twitterSite="@spirituality"
      twitterCreator="@janesmith"
    />
  </head>
  <body>
    <!-- Page content -->
  </body>
</html>
```

---

### Manual Implementation

If you're not using Astro or prefer manual implementation:

```html
<head>
  <!-- Twitter Card Meta Tags -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:site" content="@yourbrand" />
  <meta name="twitter:creator" content="@username" />
  <meta name="twitter:title" content="Your Page Title" />
  <meta name="twitter:description" content="Your page description" />
  <meta name="twitter:image" content="https://example.com/image.jpg" />
  <meta name="twitter:image:alt" content="Image description" />
</head>
```

**Remember**:
- Must be in `<head>` section
- Image must be absolute URL
- Title and description should be optimized for sharing

---

## Best Practices

### 1. Image Guidelines

#### For Summary Large Image Cards (Default)
- **Size**: 1200x628 pixels
- **Aspect Ratio**: 1.91:1
- **Format**: JPG or PNG
- **File Size**: Under 5MB (smaller is better)
- **Quality**: High quality, not blurry

#### For Summary Cards
- **Size**: 144x144 pixels minimum
- **Aspect Ratio**: 1:1 (square)
- **Format**: JPG or PNG
- **File Size**: Under 1MB

#### Image Content Tips
- High contrast, clear subject
- Text should be readable at small sizes
- Avoid text-heavy images
- Use branded colors
- Test on mobile devices

---

### 2. Title Guidelines

**Length**: 70 characters maximum (Twitter truncates after this)

**Good Titles**:
```
✅ "Complete Meditation Guide for Beginners"
✅ "Learn Mindfulness in 8 Weeks"
✅ "Top 10 Meditation Techniques"
```

**Bad Titles**:
```
❌ "This Is An Extremely Long Title That Will Definitely Get Truncated By Twitter And Won't Look Good"
❌ "Click Here"
❌ "Article"
```

**Tips**:
- Front-load important words
- Include keywords
- Make it compelling
- Test different variations

---

### 3. Description Guidelines

**Length**: 200 characters maximum (Twitter truncates after this)

**Good Descriptions**:
```
✅ "Learn meditation from scratch with our comprehensive guide. Includes techniques, benefits, and tips for beginners."
✅ "Join our 8-week mindfulness course and discover inner peace. Transform your life with daily practice."
```

**Bad Descriptions**:
```
❌ "Read more at our website to find out more information about this topic and other related topics that we cover in detail."
❌ "This page contains information."
```

**Tips**:
- Include a value proposition
- Add a call-to-action
- Be specific
- Avoid generic text

---

### 4. Username Format

**Site and Creator** must use @username format:

```html
<!-- Correct -->
<meta name="twitter:site" content="@spirituality" />
<meta name="twitter:creator" content="@janesmith" />

<!-- Wrong -->
<meta name="twitter:site" content="spirituality" />
<meta name="twitter:creator" content="janesmith" />
```

---

### 5. Absolute URLs

**Images must use absolute URLs**:

```html
<!-- Correct -->
<meta name="twitter:image" content="https://example.com/images/og-image.jpg" />

<!-- Wrong -->
<meta name="twitter:image" content="/images/og-image.jpg" />
```

Our component automatically converts relative URLs to absolute URLs:
```typescript
const absoluteImageUrl = image.startsWith('http')
  ? image
  : `${siteUrl}${image}`;
```

---

### 6. Alt Text for Accessibility

Always provide alt text for images:

```html
<meta name="twitter:image:alt" content="Person meditating in peaceful nature setting" />
```

**Benefits**:
- Accessibility for screen readers
- SEO improvement
- Shows if image fails to load

---

## Testing and Debugging

### 1. Twitter Card Validator

**URL**: https://cards-dev.twitter.com/validator

**How to Use**:
1. Enter your page URL
2. Click "Preview card"
3. View how your card will appear
4. Check for errors or warnings

**What to Check**:
- ✅ Card type is correct
- ✅ Image loads and looks good
- ✅ Title is complete (not truncated)
- ✅ Description is complete
- ✅ Attribution is correct

**Common Errors**:
- Image not loading (check absolute URL)
- Card not appearing (check meta tags in `<head>`)
- Wrong card type
- Truncated text

---

### 2. Real World Testing

After validating, test by actually sharing:

1. **Create a test tweet** with your URL
2. **Check the preview** in tweet composition
3. **Post the tweet** (or save as draft)
4. **View on Twitter timeline**
5. **Test on mobile** Twitter app

---

### 3. Browser DevTools

**Manual Verification**:
1. Open your page in browser
2. Right-click → "View Page Source" (or Ctrl+U / Cmd+U)
3. Search for "twitter:" in the source
4. Verify all tags are present and correct

**Example Output**:
```html
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:site" content="@spirituality" />
<meta name="twitter:title" content="Complete Meditation Guide" />
<meta name="twitter:description" content="Learn meditation from scratch..." />
<meta name="twitter:image" content="https://example.com/images/meditation.jpg" />
<meta name="twitter:image:alt" content="Person meditating" />
```

---

### 4. Development Warnings

Our component includes helpful warnings in development mode:

```typescript
// Title length validation
if (title.length > 70 && import.meta.env.DEV) {
  console.warn(
    `TwitterCard: Title length (${title.length} chars) exceeds ` +
    `recommended maximum (70 chars). Long titles may be truncated.`
  );
}

// @username format validation
if (site && !site.startsWith('@') && import.meta.env.DEV) {
  console.warn(
    `TwitterCard: site should start with @ (got: "${site}"). ` +
    `Example: "@yourbrand"`
  );
}
```

**Check your console** during development for these warnings.

---

## Common Mistakes

### Mistake 1: Relative Image URLs

❌ **Wrong**:
```html
<meta name="twitter:image" content="/images/og-image.jpg" />
```

✅ **Correct**:
```html
<meta name="twitter:image" content="https://example.com/images/og-image.jpg" />
```

**Why**: Twitter needs the full URL to fetch the image from your server.

---

### Mistake 2: Wrong Image Dimensions

❌ **Wrong**:
```
Using square image (500x500) for summary_large_image card
```

✅ **Correct**:
```
Using rectangular image (1200x628) for summary_large_image card
```

**Result**: Images will be cropped or look distorted if wrong dimensions.

---

### Mistake 3: Missing @ in Usernames

❌ **Wrong**:
```html
<meta name="twitter:site" content="spirituality" />
```

✅ **Correct**:
```html
<meta name="twitter:site" content="@spirituality" />
```

**Why**: Twitter requires the @ symbol for username attribution.

---

### Mistake 4: Text Too Long

❌ **Wrong**:
```html
<meta name="twitter:title" content="This Is An Extremely Long Title That Goes On And On And Will Definitely Get Cut Off By Twitter" />
```

✅ **Correct**:
```html
<meta name="twitter:title" content="Complete Meditation Guide for Beginners" />
```

**Limits**:
- Title: 70 characters
- Description: 200 characters

---

### Mistake 5: Images Behind Authentication

❌ **Wrong**:
```html
<meta name="twitter:image" content="https://example.com/user/private/avatar.jpg" />
<!-- Requires login to view -->
```

✅ **Correct**:
```html
<meta name="twitter:image" content="https://example.com/public/default-avatar.jpg" />
<!-- Publicly accessible -->
```

**Why**: Twitter can't access images that require authentication.

---

### Mistake 6: Not Testing

❌ **Wrong**: Deploying without testing

✅ **Correct**: Always test with Twitter Card Validator before deploying

---

### Mistake 7: Using Generic Images

❌ **Wrong**: Using same generic image for all pages

✅ **Correct**: Using page-specific, relevant images

**Impact**: Page-specific images get 3-5x more engagement.

---

## Platform Differences

### Twitter Cards vs Open Graph

**Twitter Cards** (`twitter:` prefix) are specific to Twitter/X.
**Open Graph** (`og:` prefix) is used by Facebook, LinkedIn, WhatsApp, etc.

**Key Differences**:

| Feature | Twitter Cards | Open Graph |
|---------|--------------|------------|
| Prefix | `twitter:` | `og:` |
| Used By | Twitter/X | Facebook, LinkedIn, etc. |
| Card Types | 4 types | Multiple types |
| Image Size | 1200x628 or 144x144 | 1200x630 |

**Fallback Behavior**: If Twitter Cards are missing, Twitter will fall back to Open Graph tags.

**Best Practice**: Use **both** Twitter Cards and Open Graph tags for maximum compatibility.

```html
<!-- Open Graph (for Facebook, LinkedIn, etc.) -->
<meta property="og:title" content="Complete Meditation Guide" />
<meta property="og:description" content="Learn meditation..." />
<meta property="og:image" content="https://example.com/images/og.jpg" />

<!-- Twitter Cards (for Twitter/X) -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Complete Meditation Guide" />
<meta name="twitter:description" content="Learn meditation..." />
<meta name="twitter:image" content="https://example.com/images/twitter.jpg" />
```

---

### Twitter vs Other Platforms

**Twitter/X**:
- Uses Twitter Cards
- 4 card types
- 1200x628px images
- 70 char titles
- 200 char descriptions

**Facebook**:
- Uses Open Graph
- Multiple content types
- 1200x630px images
- Longer text limits
- See T222 for details

**LinkedIn**:
- Uses Open Graph
- Professional context
- 1200x627px images
- Business-focused

**WhatsApp**:
- Uses Open Graph
- Shows in chat previews
- Works on mobile and web

---

## Advanced Features

### App Card Deep Linking

App cards can deep link into your mobile app:

```astro
<TwitterCard
  card="app"
  title="Meditation Session"
  description="Start your meditation now"
  image="/images/app.jpg"
  appUrl={{
    iphone: "meditation://session/123",
    googleplay: "meditation://session/123"
  }}
/>
```

When users click, they'll be taken directly to that specific content in your app.

---

### Player Card for Videos

Player cards can embed video players directly in tweets:

```astro
<TwitterCard
  card="player"
  title="Guided Meditation"
  description="20-minute session"
  image="/images/video-thumb.jpg"
  playerUrl="https://example.com/player.html?video=123"
  playerWidth={1280}
  playerHeight={720}
/>
```

**Requirements**:
- Player page must be HTTPS
- Must be embeddable in iframe
- Must work without cookies (third-party context)

---

### Dynamic Card Generation

You can dynamically generate cards per page:

```astro
---
// In your page component
const pageTitle = "Meditation Course";
const pageDescription = "8-week program";
const cardImage = `/images/courses/${courseId}.jpg`;
---

<SEO
  title={pageTitle}
  description={pageDescription}
  ogImage={cardImage}
  twitterCard="summary_large_image"
/>
```

---

## Analytics and Optimization

### Tracking Card Performance

Use Twitter Analytics to track:
- Impressions
- Engagements (clicks, likes, retweets)
- Click-through rate
- Referral traffic

### A/B Testing

Test different variations:
- Different images
- Different card types (summary vs summary_large_image)
- Different title/description copy
- Different calls-to-action

### Optimization Tips

1. **Images**: Test different images to see what resonates
2. **Copy**: A/B test titles and descriptions
3. **Card Type**: Try both summary and summary_large_image
4. **Timing**: Post at optimal times for your audience
5. **Hashtags**: Use relevant hashtags in tweets

---

## Key Takeaways

1. **Twitter Cards enhance social sharing** with rich previews
2. **Four card types**: summary, summary_large_image, app, player
3. **Default to summary_large_image** for most use cases
4. **Images must be 1200x628px** for large image cards
5. **Images must be absolute URLs** (https://...)
6. **Title: 70 characters max**, Description: 200 characters max
7. **Use @username format** for site and creator
8. **Always test** with Twitter Card Validator
9. **Use with Open Graph** for maximum compatibility
10. **Monitor and optimize** based on analytics

---

## Resources

### Official Documentation
- **Twitter Cards Guide**: https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards
- **Card Markup Reference**: https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/markup
- **Card Validator**: https://cards-dev.twitter.com/validator

### Tools
- **Twitter Card Validator**: https://cards-dev.twitter.com/validator
- **Image Size Checker**: https://www.websiteplanet.com/webtools/imagesize/
- **Canva** (create card images): https://www.canva.com
- **Open Graph vs Twitter Cards**: https://ogp.me

### Related Topics
- **T222: Open Graph Tags** (for Facebook, LinkedIn, etc.)
- **SEO Meta Tags** (for search engines)
- **Schema.org** (for structured data)

---

## Quick Reference

### Basic Implementation
```html
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Your Title (70 chars max)" />
<meta name="twitter:description" content="Your description (200 chars max)" />
<meta name="twitter:image" content="https://example.com/image.jpg" />
<meta name="twitter:site" content="@yourbrand" />
<meta name="twitter:creator" content="@username" />
```

### Image Specs
- **Large Image Card**: 1200x628px (1.91:1)
- **Summary Card**: 144x144px (1:1)
- **File Size**: Under 5MB
- **Format**: JPG, PNG, WEBP, GIF

### Testing Checklist
- [ ] Test with Twitter Card Validator
- [ ] Verify image loads correctly
- [ ] Check title is not truncated
- [ ] Check description is complete
- [ ] Test actual sharing on Twitter
- [ ] Test on mobile Twitter app

---

## Conclusion

Twitter Cards are essential for maximizing engagement when your content is shared on Twitter/X. With just a few meta tags, you can transform plain links into rich, visual previews that drive 5-10x more clicks.

**Key Success Factors**:
1. Use `summary_large_image` as default
2. Optimize images (1200x628px)
3. Write compelling titles (under 70 chars)
4. Test with Twitter Card Validator
5. Monitor analytics and optimize

By following this guide and using the TwitterCard component we created, you'll have professional Twitter Cards on all your pages, leading to increased engagement and traffic from Twitter/X.

---

**Last Updated**: 2025-11-06
**Author**: Claude Code (Anthropic)
**Version**: 1.0
**Related Tasks**: T222 (Open Graph), T221 (Basic SEO)
