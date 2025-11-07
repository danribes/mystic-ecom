# T146: WCAG 2.1 AA Accessibility Audit - Learning Guide

**Topic**: Web Content Accessibility Guidelines (WCAG) 2.1 Level AA
**Level**: Intermediate to Advanced
**Date**: November 5, 2025

---

## Table of Contents

1. [What is WCAG?](#what-is-wcag)
2. [The POUR Principles](#the-pour-principles)
3. [Understanding Conformance Levels](#understanding-conformance-levels)
4. [Common Accessibility Issues](#common-accessibility-issues)
5. [Automated vs Manual Testing](#automated-vs-manual-testing)
6. [Implementation Guide](#implementation-guide)
7. [Best Practices](#best-practices)

---

## What is WCAG?

**WCAG** (Web Content Accessibility Guidelines) is the international standard for web accessibility, developed by the W3C (World Wide Web Consortium).

### Why Accessibility Matters

**Statistics**:
- 15% of the world's population has some form of disability
- 20% of users over 65 have significant disabilities
- Temporary disabilities affect everyone (broken arm, bright sunlight, etc.)

**Legal Requirements**:
- **ADA** (Americans with Disabilities Act) - US law
- **Section 508** - US federal agencies
- **European Accessibility Act** - EU requirement
- **AODA** - Ontario, Canada

**Business Benefits**:
- 📈 Larger audience (15% more potential users)
- 💰 Better SEO (accessible sites rank higher)
- ⚖️ Legal compliance (avoid lawsuits)
- 🌟 Brand reputation

---

## The POUR Principles

WCAG is built on four principles (POUR):

### 1. Perceivable 👁️

**Definition**: Information and UI components must be presentable to users in ways they can perceive.

**What it means**: Users must be able to perceive the information being presented (it can't be invisible to all of their senses).

**Examples**:
- ✅ Images have alt text
- ✅ Videos have captions
- ✅ Sufficient color contrast
- ✅ Content works without color alone

**Common Issues**:
```html
<!-- ❌ BAD: Missing alt text -->
<img src="product.jpg">

<!-- ✅ GOOD: Descriptive alt text -->
<img src="product.jpg" alt="Red leather handbag with gold hardware">

<!-- ❌ BAD: Information conveyed by color only -->
<span style="color: red">Error</span>

<!-- ✅ GOOD: Icon + color + text -->
<span class="text-red-600">
  <svg class="inline-block">❌</svg>
  Error: Invalid email
</span>
```

### 2. Operable ⌨️

**Definition**: UI components and navigation must be operable.

**What it means**: Users must be able to operate the interface (it can't require interaction a user can't perform).

**Examples**:
- ✅ All functionality available via keyboard
- ✅ Users have enough time to read content
- ✅ Content doesn't cause seizures
- ✅ Users can navigate and find content

**Common Issues**:
```html
<!-- ❌ BAD: Only mouse-clickable -->
<div onclick="submitForm()">Submit</div>

<!-- ✅ GOOD: Keyboard accessible button -->
<button onclick="submitForm()">Submit</button>

<!-- ❌ BAD: No skip link -->
<header>
  <nav><!-- 50 navigation links --></nav>
</header>
<main>Content</main>

<!-- ✅ GOOD: Skip to main content -->
<a href="#main" class="skip-link">Skip to main content</a>
<header>
  <nav><!-- 50 navigation links --></nav>
</header>
<main id="main">Content</main>
```

### 3. Understandable 🧠

**Definition**: Information and operation of the UI must be understandable.

**What it means**: Users must be able to understand the information and operation of the user interface.

**Examples**:
- ✅ Text is readable
- ✅ Web pages operate predictably
- ✅ Users are helped to avoid and correct mistakes
- ✅ Labels are clear

**Common Issues**:
```html
<!-- ❌ BAD: No label -->
<input type="email" placeholder="Email">

<!-- ✅ GOOD: Clear label -->
<label for="email">Email Address</label>
<input type="email" id="email" placeholder="you@example.com">

<!-- ❌ BAD: Generic error -->
<span class="error">Error</span>

<!-- ✅ GOOD: Specific error with suggestion -->
<span class="error" role="alert">
  Email is required. Please enter a valid email address.
</span>
```

### 4. Robust 🔧

**Definition**: Content must be robust enough to be interpreted by a wide variety of user agents, including assistive technologies.

**What it means**: Users must be able to access content as technologies advance.

**Examples**:
- ✅ Valid HTML markup
- ✅ Proper use of ARIA
- ✅ Compatible with assistive technologies

**Common Issues**:
```html
<!-- ❌ BAD: Invalid HTML -->
<div id="main" id="content">...</div>

<!-- ✅ GOOD: Valid, unique ID -->
<div id="main">...</div>

<!-- ❌ BAD: Custom widget without ARIA -->
<div onclick="toggle()">Expand</div>

<!-- ✅ GOOD: Proper button with ARIA -->
<button aria-expanded="false" onclick="toggle()">
  Expand
</button>
```

---

## Understanding Conformance Levels

WCAG has three conformance levels:

### Level A (Minimum)
**Must** be satisfied. Addresses most critical accessibility barriers.

**Examples**:
- Images have alt text
- Videos have captions
- Forms have labels
- Page has title
- Content is keyboard accessible

### Level AA (Recommended) ⭐
**Should** be satisfied. Addresses most common accessibility barriers. **This is the target for most websites.**

**Examples**:
- Sufficient color contrast (4.5:1 for normal text)
- Multiple ways to find pages (nav, search, sitemap)
- Consistent navigation
- Focus is visible
- Error suggestions provided

### Level AAA (Enhanced)
**May** be satisfied. Highest level of accessibility. Often not required.

**Examples**:
- Very high color contrast (7:1)
- Sign language for videos
- No time limits
- No flashing content

**Our Implementation**: Targets **Level AA** (industry standard)

---

## Common Accessibility Issues

### 1. Missing Alt Text (Critical)

**The Problem**:
```html
<img src="hero.jpg">
```

**Why It's Bad**:
- Screen readers announce "image" with no description
- Users have no idea what the image shows

**The Fix**:
```html
<!-- For informative images -->
<img src="hero.jpg" alt="Team celebrating product launch in modern office">

<!-- For decorative images -->
<img src="decoration.svg" alt="">

<!-- For functional images (buttons) -->
<button>
  <img src="download.svg" alt="Download report">
</button>
```

**Best Practices**:
- ✅ Describe what the image shows, not that it's an image
- ✅ Keep it under 150 characters
- ✅ Don't include "image of" or "picture of"
- ✅ Use empty alt="" for decorative images
- ❌ Never omit alt attribute entirely

### 2. Missing Form Labels (Critical)

**The Problem**:
```html
<input type="text" placeholder="Username">
```

**Why It's Bad**:
- Placeholders disappear when user types
- Screen readers may not announce placeholders
- Low contrast, hard to read

**The Fix**:
```html
<!-- Method 1: Explicit label -->
<label for="username">Username</label>
<input type="text" id="username" placeholder="Enter your username">

<!-- Method 2: Implicit label -->
<label>
  Username
  <input type="text" placeholder="Enter your username">
</label>

<!-- Method 3: aria-label -->
<input 
  type="text" 
  aria-label="Username" 
  placeholder="Enter your username"
>
```

### 3. Poor Keyboard Navigation (Critical)

**The Problem**:
```html
<div onclick="openModal()">Open Settings</div>
```

**Why It's Bad**:
- Can't be accessed with Tab key
- Can't be activated with Enter/Space
- Invisible to screen readers

**The Fix**:
```html
<!-- Use semantic button -->
<button onclick="openModal()">Open Settings</button>

<!-- Or add tabindex and keyboard handlers -->
<div 
  role="button" 
  tabindex="0"
  onclick="openModal()"
  onkeypress="handleKey(event)"
>
  Open Settings
</div>
```

**Keyboard Navigation Testing**:
1. Unplug your mouse
2. Use Tab to navigate
3. Use Enter/Space to activate
4. Use arrow keys in custom widgets
5. Can you reach everything?

### 4. Missing Skip Links (Moderate)

**The Problem**:
Users must tab through 50+ navigation links to reach main content.

**The Fix**:
```html
<a href="#main-content" class="skip-link">
  Skip to main content
</a>

<header>
  <nav>
    <!-- 50 navigation links -->
  </nav>
</header>

<main id="main-content">
  <!-- Content starts here -->
</main>

<style>
/* Show on focus */
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: #000;
  color: #fff;
  padding: 8px;
  z-index: 100;
}

.skip-link:focus {
  top: 0;
}
</style>
```

### 5. Poor Heading Structure (Serious)

**The Problem**:
```html
<h1>Page Title</h1>
<h4>Section</h4>  <!-- Skipped h2, h3 -->
<h5>Subsection</h5>
```

**Why It's Bad**:
- Screen reader users navigate by headings
- Skipping levels is confusing

**The Fix**:
```html
<h1>Page Title</h1>
  <h2>Main Section</h2>
    <h3>Subsection</h3>
      <h4>Detail</h4>
  <h2>Another Section</h2>
```

**Best Practices**:
- ✅ One h1 per page
- ✅ Don't skip levels
- ✅ Use headings for structure, not styling
- ✅ Style with CSS, not heading levels

### 6. Low Color Contrast (Serious)

**The Problem**:
```css
/* Light gray on white - ratio 2:1 */
color: #999999;
background: #FFFFFF;
```

**Why It's Bad**:
- Hard to read for everyone
- Impossible for low vision users
- Fails in bright sunlight

**The Fix**:
```css
/* Dark gray on white - ratio 7:1 */
color: #595959;
background: #FFFFFF;
```

**Contrast Requirements**:
- Normal text: **4.5:1** (AA) or 7:1 (AAA)
- Large text (18pt+): **3:1** (AA) or 4.5:1 (AAA)
- UI components: **3:1** (AA)

**Tools**:
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- Chrome DevTools (Lighthouse)
- [Accessible Colors](https://accessible-colors.com/)

---

## Automated vs Manual Testing

### What Automated Tools Can Check ✅

Our tool checks:
- Missing alt text
- Missing form labels
- Invalid HTML
- Missing language attributes
- Heading structure
- Keyboard accessibility (basic)
- ARIA usage (basic)
- Semantic HTML

**Percentage**: ~30-40% of WCAG criteria

### What Requires Manual Testing 🔍

Must check manually:
- Color contrast (requires rendering)
- Actual keyboard navigation
- Screen reader compatibility
- Content quality and clarity
- Logical tab order
- Focus management in SPAs
- Custom widget behavior

**Percentage**: ~60-70% of WCAG criteria

### Recommended Manual Testing Process

1. **Keyboard Navigation** (30 minutes)
   - Unplug mouse
   - Tab through entire site
   - Can you reach everything?
   - Is focus visible?
   - Logical tab order?

2. **Screen Reader** (1 hour)
   - **NVDA** (Windows, free)
   - **JAWS** (Windows, paid)
   - **VoiceOver** (Mac, built-in)
   - Navigate with headings
   - Fill out forms
   - Use complex widgets

3. **Zoom Testing** (15 minutes)
   - Zoom to 200%
   - All content still accessible?
   - No horizontal scrolling?

4. **Color Contrast** (30 minutes)
   - Use WebAIM Contrast Checker
   - Check all text combinations
   - Check UI components

---

## Implementation Guide

### Step 1: Run Automated Audit

```bash
npm run accessibility:audit
```

This will:
- Scan your HTML/Astro/JSX files
- Check 19 WCAG criteria
- Generate compliance report
- List specific issues with locations

### Step 2: Fix Critical Issues First

Priority order:
1. **Critical** (🚨): Fix immediately
   - Missing alt text
   - Missing form labels
   - Keyboard inaccessible elements

2. **Serious** (⚡): Fix soon
   - Poor semantic HTML
   - Missing page titles
   - Heading structure issues

3. **Moderate** (📋): Fix when possible
   - Skip links
   - Generic link text
   - Error identification

4. **Minor** (ℹ️): Nice to have
   - Manual check reminders

### Step 3: Integrate into Workflow

**Pre-commit Hook**:
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run accessibility:audit"
    }
  }
}
```

**CI/CD Pipeline**:
```yaml
- name: Accessibility Audit
  run: npm run accessibility:audit
  
- name: Upload Reports
  uses: actions/upload-artifact@v3
  with:
    name: accessibility-reports
    path: accessibility-reports/
```

### Step 4: Manual Testing

Use screen readers:
- **Windows**: NVDA (free)
- **Mac**: VoiceOver (built-in, Cmd+F5)
- **Linux**: Orca (free)

### Step 5: Ongoing Monitoring

- Run audit on every PR
- Monthly manual testing
- Annual comprehensive audit
- User testing with people with disabilities

---

## Best Practices

### 1. Use Semantic HTML

```html
<!-- ❌ BAD -->
<div class="header">
  <div class="nav">
    <div class="link" onclick="navigate()">Home</div>
  </div>
</div>
<div class="main">Content</div>

<!-- ✅ GOOD -->
<header>
  <nav>
    <a href="/">Home</a>
  </nav>
</header>
<main>Content</main>
```

### 2. Use ARIA Sparingly

**First Rule of ARIA**: Don't use ARIA.

Use semantic HTML first. Only use ARIA when HTML isn't enough.

```html
<!-- ❌ BAD: Unnecessary ARIA -->
<button role="button" aria-label="Submit">Submit</button>

<!-- ✅ GOOD: Semantic HTML -->
<button>Submit</button>

<!-- ✅ GOOD: ARIA when needed -->
<div role="alert" aria-live="polite">
  Changes saved successfully
</div>
```

### 3. Design for Keyboard First

```tsx
// ✅ GOOD: Keyboard-friendly component
function Dialog({ onClose }) {
  useEffect(() => {
    // Trap focus
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div role="dialog" aria-modal="true">
      <h2>Dialog Title</h2>
      <button onClick={onClose}>Close</button>
    </div>
  );
}
```

### 4. Provide Text Alternatives

```html
<!-- Icons -->
<button>
  <svg aria-hidden="true">...</svg>
  <span>Delete</span>
</button>

<!-- Icon-only button -->
<button aria-label="Delete item">
  <svg aria-hidden="true">...</svg>
</button>

<!-- Complex image -->
<img 
  src="chart.png" 
  alt="Bar chart showing sales increase from $100K in Jan to $150K in Jun"
>
```

### 5. Test with Real Users

Nothing beats real user testing with people who use assistive technology.

**How to recruit**:
- Local disability organizations
- Online platforms (UserTesting, UsabilityHub)
- Accessibility consulting firms

---

## Resources

### Official Documentation
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)

### Tools
- [WAVE Browser Extension](https://wave.webaim.org/extension/)
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)

### Learning
- [WebAIM](https://webaim.org/)
- [The A11Y Project](https://www.a11yproject.com/)
- [Inclusive Components](https://inclusive-components.design/)

### Testing
- [NVDA Screen Reader](https://www.nvaccess.org/)
- [Contrast Checker](https://webaim.org/resources/contrastchecker/)

---

**Status**: Ready to build accessible web applications! 🌟
