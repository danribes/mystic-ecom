# T230: robots.txt Configuration - Learning Guide

**Task ID**: T230
**Topic**: robots.txt and Search Engine Crawler Control
**Level**: Beginner to Intermediate
**Date**: 2025-11-06

---

## Table of Contents
1. [Introduction to robots.txt](#introduction-to-robotstxt)
2. [How Search Engines Work](#how-search-engines-work)
3. [robots.txt Basics](#robotstxt-basics)
4. [Directive Reference](#directive-reference)
5. [Advanced Patterns](#advanced-patterns)
6. [Security Considerations](#security-considerations)
7. [SEO Best Practices](#seo-best-practices)
8. [Testing and Debugging](#testing-and-debugging)
9. [Common Mistakes](#common-mistakes)
10. [Tools and Resources](#tools-and-resources)

---

## Introduction to robots.txt

### What is robots.txt?

**robots.txt** is a text file that tells search engine crawlers (also called "robots" or "bots") which pages or sections of your website they can or cannot access. It's part of the Robots Exclusion Protocol (REP), a standard that websites use to communicate with web crawlers.

### Why Does It Exist?

robots.txt was created in 1994 to solve several problems:

1. **Server Load** - Crawlers can overwhelm servers with requests
2. **Privacy** - Some pages shouldn't appear in search results
3. **Crawl Budget** - Search engines have limited resources for crawling
4. **Content Quality** - Not all pages are valuable in search results

### How It Works

```
Website ──> robots.txt ──> Search Engine Crawler ──> Decision
            "Don't index      Reads the file         Respects or
             /admin/"                                 ignores rules
```

**Important**: robots.txt is a **directive**, not a security mechanism. Well-behaved crawlers follow it, but malicious bots can ignore it.

---

## How Search Engines Work

Understanding search engines helps you use robots.txt effectively.

### The Three-Step Process

#### 1. Crawling (Discovery)
- Crawlers (Googlebot, Bingbot, etc.) visit websites
- Follow links from page to page
- Download HTML content
- Look for new pages to visit

#### 2. Indexing (Organization)
- Analyze page content
- Identify keywords and topics
- Store information in massive databases
- Understand page relationships

#### 3. Ranking (Retrieval)
- User searches for something
- Algorithm matches query to indexed pages
- Ranks results by relevance and quality
- Displays search results

### Where robots.txt Fits In

robots.txt controls **Step 1: Crawling**.

```
Before Crawling:
1. Crawler wants to visit https://example.com/page
2. Crawler checks https://example.com/robots.txt
3. Crawler reads rules for its User-agent
4. Crawler decides: Allow or Disallow
5. If allowed, crawler fetches the page
```

### Crawl Budget

Search engines allocate a **crawl budget** to each site:
- Number of pages they'll crawl per day
- Based on site size, authority, and speed
- Limited resource - use it wisely

**robots.txt helps optimize crawl budget** by:
- Blocking low-value pages (admin, login, search results)
- Focusing crawler attention on important content
- Reducing server load from unnecessary crawling

---

## robots.txt Basics

### File Location

robots.txt **MUST** be at your domain root:

✅ **Correct**:
```
https://example.com/robots.txt
```

❌ **Wrong**:
```
https://example.com/pages/robots.txt
https://example.com/robots.txt/
https://www.example.com/robots.txt (if you want it for example.com)
```

### File Format

```
# This is a comment

User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/

Sitemap: https://example.com/sitemap.xml
```

**Key Points**:
- Plain text file (not HTML, not JSON)
- UTF-8 encoding
- One directive per line
- Comments start with #
- Case-sensitive paths (except directives)
- Max 500KB file size (Google limit)

### Basic Structure

```
# Group 1 for all crawlers
User-agent: *
Allow: /public/
Disallow: /private/

# Group 2 for specific crawler
User-agent: Googlebot
Allow: /
Disallow: /temp/

# Sitemap (outside groups)
Sitemap: https://example.com/sitemap.xml
```

---

## Directive Reference

### User-agent

Specifies which crawler the rules apply to.

```
User-agent: *                    # All crawlers
User-agent: Googlebot            # Only Google's crawler
User-agent: Bingbot              # Only Bing's crawler
User-agent: Slurp                # Only Yahoo's crawler
```

**Common Crawlers**:
- `*` - Wildcard for all crawlers
- `Googlebot` - Google's web crawler
- `Googlebot-Image` - Google's image crawler
- `Googlebot-News` - Google News crawler
- `Bingbot` - Bing's crawler
- `Slurp` - Yahoo's crawler (now uses Bing)
- `DuckDuckBot` - DuckDuckGo's crawler
- `Baiduspider` - Baidu's crawler (China)
- `YandexBot` - Yandex's crawler (Russia)

**AI Crawlers** (newer):
- `GPTBot` - OpenAI's crawler for ChatGPT
- `ChatGPT-User` - ChatGPT web browsing
- `anthropic-ai` - Anthropic's crawler
- `Claude-Web` - Claude's web access

### Disallow

Tells crawlers NOT to access specific paths.

**Syntax**:
```
Disallow: /path
```

**Examples**:

1. **Block Everything**:
```
User-agent: *
Disallow: /
```
Blocks all crawlers from entire site.

2. **Block Specific Directory**:
```
User-agent: *
Disallow: /admin/
```
Blocks `/admin/`, `/admin/users/`, `/admin/settings/`, etc.

3. **Block Specific File**:
```
User-agent: *
Disallow: /secret.html
```
Blocks only `/secret.html`.

4. **Block Multiple Paths**:
```
User-agent: *
Disallow: /api/
Disallow: /admin/
Disallow: /temp/
```

5. **Trailing Slash Matters**:
```
Disallow: /folder    # Blocks /folder, /folder/, /folder.html
Disallow: /folder/   # Only blocks /folder/ and below
```

### Allow

Tells crawlers they CAN access specific paths.

**Why Use Allow?**
- Override Disallow rules
- Create exceptions to broader blocks
- Set baseline permission

**Examples**:

1. **Allow Everything (Default)**:
```
User-agent: *
Allow: /
```

2. **Exception to Disallow**:
```
User-agent: *
Disallow: /api/
Allow: /api/public/
Allow: /api/health
```
Blocks all `/api/` except `/api/public/` and `/api/health`.

3. **Override for Specific Bot**:
```
User-agent: *
Disallow: /internal/

User-agent: Googlebot
Allow: /internal/
```
Blocks `/internal/` for all bots except Googlebot.

### Sitemap

Tells crawlers where to find your XML sitemap.

**Syntax**:
```
Sitemap: https://example.com/sitemap.xml
```

**Important**:
- Must be **absolute URL** (full URL, not relative)
- Can list multiple sitemaps
- Helps crawlers discover all pages
- Not part of a User-agent group (put at end of file)

**Multiple Sitemaps**:
```
Sitemap: https://example.com/sitemap-pages.xml
Sitemap: https://example.com/sitemap-posts.xml
Sitemap: https://example.com/sitemap-products.xml
```

### Crawl-delay (Optional)

Sets minimum delay between requests from a crawler.

**Syntax**:
```
User-agent: Baiduspider
Crawl-delay: 5
```
Means: Wait 5 seconds between requests.

**Important**:
- Not supported by Google or Bing (they ignore it)
- Supported by some smaller crawlers
- Helps with aggressive crawlers
- Use with specific User-agents, not *

---

## Advanced Patterns

### Wildcards

robots.txt supports wildcards in paths.

#### Asterisk (*) - Match Any Sequence

**Examples**:

1. **Block All Query Parameters**:
```
Disallow: /*?
```
Blocks `/page?id=1`, `/products?filter=sale`, etc.

2. **Block Specific Parameter**:
```
Disallow: /*?search=
```
Blocks URLs with `?search=` parameter.

3. **Block File Extensions**:
```
Disallow: /*.pdf$
```
Blocks all PDF files.

#### Dollar Sign ($) - End of URL

**Examples**:

1. **Block Specific File Type**:
```
Disallow: /*.php$
```
Blocks `/page.php` but not `/page.php?id=1`.

2. **Block Exact Path**:
```
Disallow: /admin$
```
Blocks `/admin` but not `/admin/` or `/admin/users`.

### Combining Directives

#### Allow Exceptions to Disallow

```
User-agent: *
Disallow: /folder/
Allow: /folder/public/
Allow: /folder/images/
```

**Result**:
- ✅ `/folder/public/file.html` - Allowed
- ✅ `/folder/images/photo.jpg` - Allowed
- ❌ `/folder/private/data.html` - Blocked
- ❌ `/folder/admin/` - Blocked

#### Bot-Specific Rules

```
# Block internal pages for most bots
User-agent: *
Disallow: /internal/

# Allow Google to index internal pages
User-agent: Googlebot
Allow: /internal/

# Completely block bad bots
User-agent: BadBot
Disallow: /
```

### Query Parameters

**Problem**: URLs with parameters create duplicate content:
- `/products?sort=price`
- `/products?sort=name`
- `/products?page=2`

**Solution**: Block parameters:
```
Disallow: /*?sort=
Disallow: /*?page=
Disallow: /*?filter=
```

**Better Solution**: Use canonical tags in HTML instead:
```html
<link rel="canonical" href="https://example.com/products">
```

---

## Security Considerations

### What robots.txt IS NOT

❌ **NOT a security measure**
- File is publicly accessible
- Anyone can read it
- Malicious bots ignore it

❌ **NOT access control**
- Doesn't prevent page access
- Doesn't require authentication
- Anyone can still visit blocked pages directly

❌ **NOT guaranteed de-indexing**
- Google may still index pages if linked externally
- Use `noindex` meta tag for stronger control

### What robots.txt IS

✅ **Guidance for well-behaved crawlers**
✅ **Crawl budget optimization**
✅ **Privacy from accidental exposure**
✅ **Server load management**

### Security Best Practices

#### 1. Don't List Secret URLs

❌ **Bad**:
```
# This reveals the secret URL to everyone!
Disallow: /super-secret-admin-panel-xyz/
Disallow: /api/v2/private-endpoints/
```

✅ **Good**:
```
# Generic paths don't reveal secrets
Disallow: /admin/
Disallow: /api/
```

#### 2. Don't Include Sensitive Keywords

❌ **Bad**:
```
# Sensitive information in comments
# API key: abc123xyz (DO NOT EXPOSE!)
# Password: mypass123
```

✅ **Good**:
```
# Generic, helpful comments
# Block admin area from search engines
```

#### 3. Use Proper Security Measures

For actual security, use:
- **Authentication** (login required)
- **Authorization** (permission checks)
- **Firewall rules** (IP blocking)
- **WAF** (Web Application Firewall)
- **noindex meta tags** (stronger de-indexing)

#### 4. Remember: robots.txt is Public

Anyone can view your robots.txt:
```bash
curl https://example.com/robots.txt
```

Try it on real sites:
- https://google.com/robots.txt
- https://facebook.com/robots.txt
- https://amazon.com/robots.txt

---

## SEO Best Practices

### 1. Optimize Crawl Budget

**Block Low-Value Pages**:
```
# Authentication pages (no SEO value)
Disallow: /login
Disallow: /register
Disallow: /forgot-password

# User accounts (private content)
Disallow: /account/
Disallow: /profile/

# E-commerce internals
Disallow: /cart/
Disallow: /checkout/

# Internal tools
Disallow: /admin/
Disallow: /dashboard/
```

**Allow High-Value Pages**:
```
# Important content pages
Allow: /blog/
Allow: /products/
Allow: /courses/
Allow: /events/
```

### 2. Prevent Duplicate Content

**Problem**: Same content, different URLs:
```
/products
/products?sort=price
/products?sort=name
/products?page=2
/products?utm_source=facebook
```

**Solution 1**: Block parameter variations:
```
Disallow: /*?*
```

**Solution 2** (Better): Use canonical tags:
```html
<link rel="canonical" href="https://example.com/products">
```

**Solution 3** (Best): Both!

### 3. Don't Block Important Resources

❌ **Bad - Blocks CSS/JS**:
```
Disallow: /css/
Disallow: /js/
Disallow: /images/
```

**Why Bad?**
- Google needs CSS/JS for mobile-first indexing
- Impacts how Google sees your page
- Can hurt search rankings

✅ **Good - Allow resources**:
```
# Allow CSS, JS, images by default
Allow: /

# Only block specific sensitive paths
Disallow: /admin/
Disallow: /api/
```

### 4. Use Sitemap Directive

```
Sitemap: https://example.com/sitemap.xml
```

**Benefits**:
- Helps crawlers discover all pages
- Faster indexing
- Better coverage
- Shows page priority and update frequency

### 5. Organize for Readability

✅ **Good Structure**:
```
# robots.txt for Example Site
# Last updated: 2025-11-06

# ===========================
# General Rules for All Bots
# ===========================

User-agent: *
Allow: /

# Sensitive Areas
Disallow: /api/
Disallow: /admin/

# User Privacy
Disallow: /account/
Disallow: /checkout/

# Duplicate Content
Disallow: /*?search=
Disallow: /*?utm_

# ===========================
# Bot-Specific Rules
# ===========================

User-agent: BadBot
Disallow: /

# ===========================
# Sitemap
# ===========================

Sitemap: https://example.com/sitemap.xml
```

---

## Testing and Debugging

### 1. Google Search Console

**URL**: https://search.google.com/search-console

**robots.txt Tester Tool**:
1. Go to Search Console
2. Select your property
3. Navigate to Legacy Tools → robots.txt Tester
4. Paste your robots.txt content
5. Test specific URLs

**Example Test**:
```
Test URL: https://example.com/admin/users
Result: ✗ Blocked

Test URL: https://example.com/products
Result: ✓ Allowed
```

### 2. Manual Testing

**Check if file exists**:
```bash
curl https://example.com/robots.txt
```

**Expected**: File content appears

**Check from different locations**:
```bash
# From your server
curl http://localhost/robots.txt

# From domain
curl https://example.com/robots.txt

# From www subdomain
curl https://www.example.com/robots.txt
```

### 3. Validate Format

**Common Format Errors**:

❌ **Wrong location**:
```
https://example.com/pages/robots.txt  # Must be at root
```

❌ **HTML instead of text**:
```html
<html><body>User-agent: *</body></html>  # Must be plain text
```

❌ **Directives before User-agent**:
```
Disallow: /admin/
User-agent: *  # User-agent must come first!
```

❌ **Invalid syntax**:
```
User-agent*  # Missing colon
Disallow /admin/  # Missing colon
```

### 4. Test Specific Patterns

Use online tools or Search Console to test:

```
Pattern: Disallow: /*?search=

Test Cases:
✓ /page                  → Allowed
✗ /page?search=test      → Blocked
✗ /results?search=query  → Blocked
✓ /search (without ?)    → Allowed
```

### 5. Monitor Crawl Stats

**Google Search Console → Crawl Stats**:
- Pages crawled per day
- Kilobytes downloaded per day
- Time spent downloading a page

**What to look for**:
- Sudden drops (might indicate over-blocking)
- High crawl rate on low-value pages (need more Disallow rules)
- 403 errors (pages blocked but still being requested)

---

## Common Mistakes

### Mistake 1: Blocking CSS/JavaScript

❌ **Bad**:
```
User-agent: *
Disallow: /css/
Disallow: /js/
Disallow: *.css
Disallow: *.js
```

**Why Bad?**
- Google can't render pages properly
- Hurts mobile-first indexing
- May impact rankings

✅ **Fix**: Remove these blocks

---

### Mistake 2: Forgetting Trailing Slashes

**Behavior Differences**:

```
Disallow: /folder
```
- Blocks: `/folder`, `/folder/`, `/folder.html`, `/folder-backup/`

```
Disallow: /folder/
```
- Blocks: `/folder/` and everything under it
- Allows: `/folder.html`, `/folder-backup/`

**Best Practice**: Use trailing slash for directories:
```
Disallow: /admin/   # Directory
Disallow: /secret   # File
```

---

### Mistake 3: Using robots.txt for Security

❌ **Bad Assumption**:
```
# This will keep hackers out!
Disallow: /admin/
```

**Reality**: Anyone can still access `/admin/` directly.

✅ **Fix**: Use proper authentication:
```javascript
// Actual security
if (!user.isAuthenticated) {
  return res.status(401).send('Unauthorized');
}
```

---

### Mistake 4: Blocking Important Pages

❌ **Bad**:
```
# Accidentally blocks all products!
Disallow: /products/
```

**Check Coverage Report** in Search Console to find accidentally blocked pages.

---

### Mistake 5: Listing Secrets

❌ **Bad**:
```
# DON'T DO THIS!
Disallow: /admin-panel-secret-login-xyz123/
Disallow: /api/v2/super-secret-endpoint/
Disallow: /backup-2025-passwords.txt
```

**Why Bad?** You're advertising secret URLs to the world!

✅ **Fix**: Use generic paths:
```
Disallow: /admin/
Disallow: /api/
```

---

### Mistake 6: Forgetting to Update Sitemap URL

❌ **Bad** (after deployment):
```
Sitemap: https://yourdomain.com/sitemap.xml
```

✅ **Fix**:
```
Sitemap: https://actualsite.com/sitemap.xml
```

---

### Mistake 7: Wrong File Location

❌ **Wrong**:
```
/public/pages/robots.txt
/static/robots.txt
/robots.txt.html
```

✅ **Correct**:
```
/public/robots.txt  (in Astro, Next.js, etc.)
→ Served at https://example.com/robots.txt
```

---

### Mistake 8: Using Wildcards Incorrectly

❌ **Doesn't Work as Expected**:
```
Disallow: /admin*
```
Many crawlers don't support `*` at end without `/`.

✅ **Better**:
```
Disallow: /admin/
Disallow: /admin-*
```

---

### Mistake 9: Conflicting Rules

❌ **Confusing**:
```
User-agent: *
Allow: /
Disallow: /
Allow: /page
```

**What happens?** Different crawlers may interpret differently.

✅ **Clear**:
```
User-agent: *
Allow: /
Disallow: /private/
```

---

### Mistake 10: Not Testing

❌ **Deploy without testing**

✅ **Always test**:
1. Use Google Search Console robots.txt Tester
2. Test with `curl`
3. Check Search Console coverage
4. Monitor crawl stats after deployment

---

## Tools and Resources

### Online Tools

#### 1. Google Search Console
**URL**: https://search.google.com/search-console

**Features**:
- robots.txt Tester
- Coverage reports
- Crawl stats
- URL inspection

**How to Use**:
1. Add and verify your site
2. Go to Legacy Tools → robots.txt Tester
3. Test URLs against your robots.txt

#### 2. Bing Webmaster Tools
**URL**: https://www.bing.com/webmasters

**Features**:
- robots.txt validation
- Crawl control
- Site scanning

#### 3. robots.txt Validators
- **Technical SEO Tools**: Screaming Frog, Ahrefs, SEMrush
- **Online validators**: Multiple free tools available

### Browser Extensions

#### 1. SEO Meta in 1 Click
- View robots.txt easily
- See meta tags
- Check indexability

#### 2. Redirect Path
- Check redirects
- See HTTP status codes
- View headers

### Testing Commands

#### Check if robots.txt exists:
```bash
curl https://example.com/robots.txt
```

#### Check status code:
```bash
curl -I https://example.com/robots.txt
```

Expected: `200 OK`

#### View robots.txt for major sites:
```bash
curl https://google.com/robots.txt
curl https://facebook.com/robots.txt
curl https://amazon.com/robots.txt
```

### Documentation

#### Official Specifications
- **RFC 9309**: https://www.rfc-editor.org/rfc/rfc9309.html
- **Google's Guide**: https://developers.google.com/search/docs/advanced/robots/intro
- **Bing's Guide**: https://www.bing.com/webmasters/help/how-to-create-a-robots-txt-file-cb7c31ec

#### Learning Resources
- **Google Search Central**: https://developers.google.com/search
- **Moz Guide**: https://moz.com/learn/seo/robotstxt
- **Ahrefs Guide**: https://ahrefs.com/blog/robots-txt/

---

## Real-World Examples

### Example 1: Simple Blog

```
# Simple blog robots.txt

User-agent: *
Allow: /

# Block admin and login
Disallow: /wp-admin/
Disallow: /wp-login.php

# Block search and filters
Disallow: /*?s=
Disallow: /*?author=

Sitemap: https://blog.com/sitemap.xml
```

### Example 2: E-commerce Site

```
# E-commerce robots.txt

User-agent: *
Allow: /

# Block checkout and cart
Disallow: /checkout/
Disallow: /cart/
Disallow: /my-account/

# Block internal search
Disallow: /*?s=
Disallow: /search/

# Block filters and sorting (use canonical instead)
Disallow: /*?orderby=
Disallow: /*?filter_
Disallow: /*?price_range=

# Allow product images
Allow: /wp-content/uploads/

Sitemap: https://shop.com/sitemap-products.xml
Sitemap: https://shop.com/sitemap-pages.xml
```

### Example 3: SaaS Application

```
# SaaS app robots.txt

User-agent: *

# Allow marketing pages
Allow: /
Allow: /features/
Allow: /pricing/
Allow: /blog/

# Block application
Disallow: /app/
Disallow: /dashboard/
Disallow: /api/

# Block auth
Disallow: /login
Disallow: /signup
Disallow: /reset-password

# Sitemap for public pages only
Sitemap: https://saasapp.com/sitemap.xml
```

### Example 4: Multi-Language Site

```
# Multi-language site robots.txt

User-agent: *
Allow: /

# Block admin for all languages
Disallow: /admin/
Disallow: /*/admin/

# Block duplicate content
Disallow: /*?lang=
Disallow: /*?ref=

# Language-specific sitemaps
Sitemap: https://example.com/sitemap-en.xml
Sitemap: https://example.com/sitemap-es.xml
Sitemap: https://example.com/sitemap-fr.xml
Sitemap: https://example.com/sitemap-de.xml
```

---

## Advanced Topics

### 1. Dynamic robots.txt

Instead of static file, generate dynamically:

**Node.js/Express**:
```javascript
app.get('/robots.txt', (req, res) => {
  const env = process.env.NODE_ENV;

  if (env === 'production') {
    res.type('text/plain');
    res.send(`
User-agent: *
Allow: /
Disallow: /api/
Sitemap: https://example.com/sitemap.xml
    `.trim());
  } else {
    // Block everything in development
    res.type('text/plain');
    res.send(`
User-agent: *
Disallow: /
    `.trim());
  }
});
```

### 2. Environment-Specific Rules

**Development**:
```
User-agent: *
Disallow: /
```

**Staging**:
```
User-agent: *
Disallow: /

User-agent: StatusCakeBot
Allow: /
```

**Production**:
```
User-agent: *
Allow: /
Disallow: /admin/
```

### 3. Handling AI Crawlers

```
# Control AI training data collection

# Block OpenAI
User-agent: GPTBot
Disallow: /

# Block ChatGPT browsing
User-agent: ChatGPT-User
Disallow: /

# Allow Anthropic (Claude)
User-agent: anthropic-ai
Allow: /

User-agent: Claude-Web
Allow: /
```

---

## Conclusion

### Key Takeaways

1. **robots.txt guides crawlers**, it doesn't provide security
2. **Place at domain root**: `https://example.com/robots.txt`
3. **Use for crawl budget optimization**, not access control
4. **Test before deploying** with Google Search Console
5. **Monitor crawl stats** to verify proper behavior
6. **Combine with other SEO tools** (canonical tags, noindex, sitemaps)

### Checklist

Before deploying your robots.txt:

- [ ] File at `/public/robots.txt` (or equivalent for your framework)
- [ ] User-agent: * directive present
- [ ] Sensitive paths blocked (admin, api, checkout, etc.)
- [ ] Important resources allowed (CSS, JS, images)
- [ ] Query parameters handled (blocked or canonical tags used)
- [ ] Sitemap URL updated with actual domain
- [ ] No sensitive information in comments
- [ ] Tested with Google Search Console
- [ ] No obvious typos or syntax errors
- [ ] Trailing slashes used correctly for directories

### Next Steps

1. **Implement XML sitemap** (Task T229)
2. **Monitor Search Console** for coverage issues
3. **Review quarterly** - update as site evolves
4. **Test with multiple tools** (Google, Bing, validators)
5. **Consider dynamic generation** for multi-environment setups

### Remember

> robots.txt is a simple but powerful tool. Use it to guide search engines toward your best content while protecting sensitive areas. But always remember: it's guidance, not security!

---

**Last Updated**: 2025-11-06
**Author**: Claude Code (Anthropic)
**Version**: 1.0

**Further Reading**:
- RFC 9309: https://www.rfc-editor.org/rfc/rfc9309.html
- Google's robots.txt Guide: https://developers.google.com/search/docs/advanced/robots/intro
- Search Engine Land's Guide: https://searchengineland.com/guide/how-to-create-a-robots-txt-file
