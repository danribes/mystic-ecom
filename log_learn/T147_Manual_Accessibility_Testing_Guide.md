# T147: Manual Accessibility Testing - Learning Guide

**Topic**: Manual Accessibility Testing with Screen Readers and Keyboard Navigation
**Level**: Intermediate
**Date**: November 5, 2025

---

## Table of Contents

1. [What is Manual Accessibility Testing?](#what-is-manual-accessibility-testing)
2. [Why Manual Testing is Important](#why-manual-testing-is-important)
3. [Screen Readers Explained](#screen-readers-explained)
4. [Keyboard Navigation Explained](#keyboard-navigation-explained)
5. [Setting Up Your Testing Environment](#setting-up-your-testing-environment)
6. [Screen Reader Testing Guide](#screen-reader-testing-guide)
7. [Keyboard Navigation Testing Guide](#keyboard-navigation-testing-guide)
8. [Common Accessibility Issues](#common-accessibility-issues)
9. [WCAG 2.1 Quick Reference](#wcag-21-quick-reference)
10. [Best Practices](#best-practices)

---

## What is Manual Accessibility Testing?

**Manual accessibility testing** is the process of evaluating a website or application by actually using it the way people with disabilities would - with assistive technologies like screen readers and without a mouse.

### Key Differences from Automated Testing

| Automated Testing | Manual Testing |
|-------------------|----------------|
| Checks code patterns | Tests real user experience |
| Fast (seconds) | Slower (hours/days) |
| Catches ~30% of issues | Catches 70-100% of issues |
| Can't judge context | Evaluates contextual meaning |
| No subjective judgment | Tests usability |

**Example**: Automated tests can verify an image has `alt` text, but only a human can determine if the alt text is *meaningful*.

```html
<!-- Passes automated tests but BAD -->
<img src="photo.jpg" alt="image123" />

<!-- Also passes and GOOD -->
<img src="photo.jpg" alt="User profile showing John Doe" />
```

---

## Why Manual Testing is Important

### 1. Real User Experience
Automated tools can't experience your website the way users do. Manual testing reveals:
- Is navigation logical and efficient?
- Are instructions clear when heard aloud?
- Can users complete tasks without seeing the screen?

### 2. Catches Contextual Issues
```html
<!-- Technically accessible but confusing -->
<a href="/about">Click here</a>

<!-- Better: Descriptive and contextual -->
<a href="/about">Learn about our company</a>
```

A screen reader user navigating links will hear "Click here, Click here, Click here" vs. "Learn about our company, Contact us, View pricing" - huge difference!

### 3. Required for WCAG Compliance
Many WCAG criteria **cannot** be tested automatically:
- **2.4.4 Link Purpose**: Are links descriptive?
- **3.2.1 On Focus**: Does receiving focus cause unexpected changes?
- **3.3.2 Labels or Instructions**: Are form instructions clear?

### 4. Builds Empathy
Using assistive technology helps you understand the challenges users face and design better solutions.

---

## Screen Readers Explained

### What is a Screen Reader?

A **screen reader** is software that reads digital text aloud and provides keyboard navigation. It's primarily used by:
- Blind users
- Users with low vision
- Users with reading disabilities (dyslexia)
- Users with cognitive disabilities

### Popular Screen Readers

#### NVDA (Windows) - FREE
- **Website**: https://www.nvaccess.org/
- **Best For**: Testing on Windows
- **Pros**: Free, frequently updated, widely used
- **Cons**: Windows only

#### JAWS (Windows) - PAID
- **Website**: https://www.freedomscientific.com/products/software/jaws/
- **Best For**: Professional testing, enterprise
- **Pros**: Industry standard, powerful features
- **Cons**: Expensive ($1000+), complex

#### VoiceOver (macOS, iOS) - FREE
- **Best For**: Mac and iPhone testing
- **Pros**: Built-in, free, good iOS support
- **Cons**: Mac/iOS only, different paradigm

#### Narrator (Windows) - FREE
- **Best For**: Basic testing on Windows
- **Pros**: Built-in, improving rapidly
- **Cons**: Less commonly used by blind users

#### TalkBack (Android) - FREE
- **Best For**: Android app testing
- **Pros**: Built-in, free
- **Cons**: Android only

### How Screen Readers Work

Screen readers convert visual content into:
1. **Speech**: Text-to-speech synthesis
2. **Braille**: Output to refreshable braille display
3. **Navigation**: Keyboard shortcuts to jump between elements

#### What Screen Readers Announce

```html
<button aria-label="Close dialog">X</button>
```

**Screen reader says**: "Close dialog, button"

```html
<input type="text" id="email" required />
<label for="email">Email Address</label>
```

**Screen reader says**: "Email Address, required, edit text"

---

## Keyboard Navigation Explained

### Why Keyboard Navigation Matters

Many users cannot use a mouse:
- Blind users (can't see cursor)
- Motor disability users (mouse too precise)
- Power users (keyboard faster)
- Mobile keyboard users

### Essential Keyboard Commands

| Key | Function |
|-----|----------|
| **Tab** | Move focus to next interactive element |
| **Shift+Tab** | Move focus to previous element |
| **Enter** | Activate link or button |
| **Space** | Toggle checkbox, activate button |
| **Arrow Keys** | Navigate within menus, radio buttons, tabs |
| **Escape** | Close modal or menu |
| **Home/End** | Jump to start/end of list or content |

### Focus Indicator

The **focus indicator** shows which element has keyboard focus:

```css
/* Browser default (usually blue outline) */
button:focus {
  outline: 2px solid blue;
}

/* Custom focus style - must be visible! */
button:focus {
  outline: 3px solid #4A90E2;
  outline-offset: 2px;
}
```

**WCAG 2.4.7 (Level AA)**: Focus must be visible

---

## Setting Up Your Testing Environment

### For Screen Reader Testing

#### Windows + NVDA (Recommended for Beginners)

1. **Download NVDA**
   - Visit https://www.nvaccess.org/download/
   - Download and install latest version
   - Free, no registration required

2. **Start NVDA**
   - Launch NVDA from desktop shortcut
   - You'll hear: "NVDA started"
   - Modifier key: Insert or Caps Lock

3. **Essential NVDA Commands**
   ```
   NVDA + Q       = Quit NVDA
   NVDA + S       = Toggle speech on/off
   NVDA + N       = Open NVDA menu
   Insert + F1    = Help (hear element info)
   ```

4. **Browse Mode Navigation**
   ```
   H              = Next heading
   Shift + H      = Previous heading
   K              = Next link
   F              = Next form field
   B              = Next button
   T              = Next table
   ```

#### macOS + VoiceOver

1. **Enable VoiceOver**
   - Press `Command + F5`
   - Or: System Preferences → Accessibility → VoiceOver

2. **Essential VoiceOver Commands**
   ```
   VO = Control + Option (modifier key)

   VO + A         = Start reading
   VO + Right     = Move to next item
   VO + Left      = Move to previous item
   VO + Space     = Activate item
   VO + U         = Open rotor (navigation menu)
   ```

3. **Web Navigation (Rotor)**
   ```
   VO + U         = Open rotor
   Left/Right     = Switch between categories (headings, links, forms)
   Up/Down        = Navigate items in category
   Enter          = Jump to selected item
   ```

### For Keyboard Testing

**No special software needed!**

1. **Unplug or disable your mouse** (important!)
2. **Open your web browser**
3. **Navigate to your website**
4. **Start pressing Tab** to navigate

**Tip**: Use a browser extension to highlight focus:
- **Firefox**: Built-in accessibility inspector
- **Chrome**: Install "Accessibility Insights" extension

---

## Screen Reader Testing Guide

### Test 1: Page Title (SR-NAV-001)

**WCAG**: 2.4.2 Page Titled (Level A)
**Priority**: Critical

**How to Test**:
1. Navigate to a page
2. Listen for the page title announcement
3. The title should be announced immediately

**What You're Looking For**:
- Title is announced automatically
- Title is descriptive and unique
- Title identifies the page purpose

**Example**:
```html
<!-- GOOD -->
<title>Contact Us - Acme Corporation</title>

<!-- BAD -->
<title>Page</title>
```

**Screen Reader Says**:
- ✅ "Contact Us - Acme Corporation, page"
- ❌ "Page, page" (not descriptive)

---

### Test 2: Landmarks (SR-NAV-002)

**WCAG**: 1.3.1 Info and Relationships (Level A)
**Priority**: High

**How to Test (NVDA)**:
1. Press `D` to jump between landmarks
2. Listen for landmark names
3. Verify all page regions are identified

**How to Test (VoiceOver)**:
1. Press `VO + U` to open rotor
2. Use Left/Right arrows to select "Landmarks"
3. Navigate with Up/Down arrows

**What You're Looking For**:
- Header identified as "banner"
- Main content identified as "main"
- Navigation identified as "navigation"
- Footer identified as "contentinfo"

**Example**:
```html
<!-- GOOD: Semantic HTML with ARIA -->
<header role="banner">
  <nav role="navigation" aria-label="Main">
    <!-- Navigation links -->
  </nav>
</header>

<main role="main">
  <!-- Main content -->
</main>

<footer role="contentinfo">
  <!-- Footer content -->
</footer>
```

---

### Test 3: Form Labels (SR-FORM-001)

**WCAG**: 1.3.1 Info and Relationships (Level A)
**Priority**: Critical

**How to Test**:
1. Navigate to a form (press `F` in NVDA)
2. Tab through form fields
3. Listen for label announcements

**What You're Looking For**:
- Every field has a label
- Label is announced before field type
- Label describes the field purpose

**Example**:
```html
<!-- GOOD: Explicit label association -->
<label for="email">Email Address</label>
<input type="email" id="email" required />

<!-- Screen Reader: "Email Address, required, edit text" -->
```

```html
<!-- BAD: No label -->
<input type="email" placeholder="Email" />

<!-- Screen Reader: "Edit text" (unclear!) -->
```

---

### Test 4: Form Errors (SR-FORM-003)

**WCAG**: 3.3.1 Error Identification (Level A)
**Priority**: Critical

**How to Test**:
1. Submit form with errors
2. Navigate to error fields
3. Listen for error announcements

**What You're Looking For**:
- Errors announced immediately
- Error messages associated with fields
- Instructions on how to fix

**Example**:
```html
<!-- GOOD: Error associated with field -->
<label for="email">Email Address</label>
<input
  type="email"
  id="email"
  aria-describedby="email-error"
  aria-invalid="true"
/>
<div id="email-error" role="alert">
  Please enter a valid email address
</div>

<!-- Screen Reader: "Email Address, invalid entry, edit text.
     Please enter a valid email address" -->
```

---

### Test 5: Images (SR-CONT-001)

**WCAG**: 1.1.1 Non-text Content (Level A)
**Priority**: Critical

**How to Test**:
1. Navigate to images (press `G` in NVDA)
2. Listen for alt text announcements
3. Evaluate if alt text is meaningful

**What You're Looking For**:
- All images have alt text
- Alt text describes image content
- Decorative images have `alt=""`

**Examples**:
```html
<!-- GOOD: Descriptive alt text -->
<img
  src="profile.jpg"
  alt="Sarah Johnson, Chief Technology Officer"
/>

<!-- GOOD: Decorative image (empty alt) -->
<img src="divider.png" alt="" role="presentation" />

<!-- BAD: Missing alt -->
<img src="important.jpg" />

<!-- BAD: Redundant alt -->
<a href="/profile">
  <img src="profile.jpg" alt="Profile" />
  Profile
</a>
<!-- Screen Reader: "Profile, Profile, link" (redundant!) -->
```

---

### Test 6: Buttons (SR-INT-001)

**WCAG**: 4.1.2 Name, Role, Value (Level A)
**Priority**: Critical

**How to Test**:
1. Navigate to buttons (press `B` in NVDA)
2. Listen for button announcements
3. Verify role and accessible name

**What You're Looking For**:
- "Button" role announced
- Button has accessible name
- Name describes button action

**Examples**:
```html
<!-- GOOD: Text button -->
<button>Save Changes</button>
<!-- Screen Reader: "Save Changes, button" -->

<!-- GOOD: Icon button with aria-label -->
<button aria-label="Close dialog">
  <svg>...</svg>
</button>
<!-- Screen Reader: "Close dialog, button" -->

<!-- BAD: No accessible name -->
<button><img src="icon.png" alt="" /></button>
<!-- Screen Reader: "Button" (unclear purpose!) -->
```

---

## Keyboard Navigation Testing Guide

### Test 1: Tab Navigation (KB-NAV-001, KB-NAV-002)

**WCAG**: 2.1.1 Keyboard (Level A)
**Priority**: Critical

**How to Test**:
1. **Unplug your mouse**
2. Press **Tab** repeatedly
3. Press **Shift+Tab** to go backward
4. Verify focus moves logically

**What You're Looking For**:
- Focus moves to next interactive element
- Focus order matches visual order
- No focus going to hidden elements
- Focus indicator always visible

**Common Issues**:
```html
<!-- BAD: div not keyboard accessible -->
<div onclick="handleClick()">Click me</div>

<!-- GOOD: button is keyboard accessible -->
<button onclick="handleClick()">Click me</button>
```

---

### Test 2: Focus Visibility (KB-NAV-003)

**WCAG**: 2.4.7 Focus Visible (Level AA)
**Priority**: Critical

**How to Test**:
1. Tab through interactive elements
2. Look for visual focus indicator
3. Verify indicator is always visible

**What You're Looking For**:
- Clear visual outline or border
- High contrast with background
- At least 2px visible boundary

**Examples**:
```css
/* GOOD: Visible focus */
button:focus {
  outline: 3px solid #4A90E2;
  outline-offset: 2px;
}

/* BAD: Focus removed */
button:focus {
  outline: none; /* Never do this! */
}
```

---

### Test 3: No Keyboard Traps (KB-NAV-005)

**WCAG**: 2.1.2 No Keyboard Trap (Level A)
**Priority**: Critical

**How to Test**:
1. Tab through entire page
2. Try to escape from each component
3. Verify you can always move focus away

**What You're Looking For**:
- Focus never gets stuck
- Can always Tab or Shift+Tab away
- Modal dialogs trap focus intentionally (OK)
- Can escape modal with Escape key

**Example Keyboard Trap (BAD)**:
```javascript
// BAD: Focus trapped unintentionally
input.addEventListener('keydown', (e) => {
  if (e.key === 'Tab') {
    e.preventDefault(); // Trap!
  }
});
```

---

### Test 4: Button Activation (KB-INT-001)

**WCAG**: 2.1.1 Keyboard (Level A)
**Priority**: Critical

**How to Test**:
1. Tab to a button
2. Press **Enter**
3. Press **Space**
4. Verify button activates with both keys

**What You're Looking For**:
- Buttons activate with Enter
- Buttons activate with Space
- No unexpected behavior

**Examples**:
```html
<!-- GOOD: Native button works with Enter and Space -->
<button onclick="save()">Save</button>

<!-- BAD: Div only responds to click -->
<div onclick="save()">Save</div>
<!-- Does not respond to Enter or Space! -->
```

---

### Test 5: Modal Dialogs (KB-INT-003)

**WCAG**: 2.4.3 Focus Order (Level A)
**Priority**: Critical

**How to Test**:
1. Open a modal dialog
2. Try to Tab outside the modal
3. Press Escape
4. Verify focus returns to trigger

**What You're Looking For**:
- Focus moves to modal on open
- Tab only cycles within modal
- Escape closes modal
- Focus returns to trigger button

**Example**:
```javascript
// GOOD: Focus management
function openModal() {
  // 1. Save currently focused element
  const trigger = document.activeElement;

  // 2. Show modal
  modal.style.display = 'block';

  // 3. Focus first element in modal
  modal.querySelector('button').focus();

  // 4. Trap focus
  modal.addEventListener('keydown', trapFocus);

  // 5. On close, return focus
  closeButton.addEventListener('click', () => {
    modal.style.display = 'none';
    trigger.focus();
  });
}
```

---

## Common Accessibility Issues

### Issue 1: Missing Alt Text
**Problem**: Images without alt attributes
```html
<img src="logo.png" />
```

**Fix**:
```html
<img src="logo.png" alt="Company Logo" />
```

---

### Issue 2: Poor Color Contrast
**Problem**: Text hard to read for low vision users
```css
/* BAD: Contrast ratio 2.5:1 (fails WCAG) */
color: #999;
background: #fff;
```

**Fix**:
```css
/* GOOD: Contrast ratio 4.8:1 (passes AA) */
color: #666;
background: #fff;
```

**Tool**: Use https://webaim.org/resources/contrastchecker/

---

### Issue 3: Non-Descriptive Links
**Problem**: "Click here" doesn't describe destination
```html
<a href="/pricing">Click here</a> to see our prices
```

**Fix**:
```html
<a href="/pricing">View our pricing</a>
```

---

### Issue 4: Form Fields Without Labels
**Problem**: Screen readers can't identify fields
```html
<input type="text" placeholder="Name" />
```

**Fix**:
```html
<label for="name">Name</label>
<input type="text" id="name" />
```

---

### Issue 5: Keyboard Inaccessible Custom Widgets
**Problem**: Div buttons don't work with keyboard
```html
<div onclick="submit()">Submit</div>
```

**Fix**:
```html
<button onclick="submit()">Submit</button>
```

---

### Issue 6: No Focus Indicator
**Problem**: Can't see where keyboard focus is
```css
*:focus { outline: none; }
```

**Fix**:
```css
*:focus {
  outline: 2px solid #4A90E2;
  outline-offset: 2px;
}
```

---

### Issue 7: No Skip Links
**Problem**: Keyboard users must tab through navigation on every page
```html
<header>
  <nav>
    <!-- 50 navigation links -->
  </nav>
</header>
<main>
  <!-- Main content -->
</main>
```

**Fix**:
```html
<a href="#main" class="skip-link">Skip to main content</a>
<header>...</header>
<main id="main">...</main>
```

```css
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  z-index: 100;
}

.skip-link:focus {
  top: 0;
}
```

---

## WCAG 2.1 Quick Reference

### Level A (Must Have)

| Criterion | Name | What It Means |
|-----------|------|---------------|
| **1.1.1** | Non-text Content | All images have alt text |
| **1.3.1** | Info and Relationships | Structure is clear (headings, labels, landmarks) |
| **2.1.1** | Keyboard | All functionality available via keyboard |
| **2.1.2** | No Keyboard Trap | Focus never gets stuck |
| **2.4.1** | Bypass Blocks | Skip links for repetitive content |
| **2.4.2** | Page Titled | Every page has unique title |
| **2.4.3** | Focus Order | Tab order is logical |
| **2.4.4** | Link Purpose | Link text describes destination |
| **3.3.1** | Error Identification | Errors clearly identified |
| **3.3.2** | Labels or Instructions | Form fields have labels |
| **4.1.2** | Name, Role, Value | UI components have accessible names |

### Level AA (Should Have)

| Criterion | Name | What It Means |
|-----------|------|---------------|
| **1.4.3** | Contrast (Minimum) | Text has 4.5:1 contrast ratio |
| **2.4.6** | Headings and Labels | Headings and labels are descriptive |
| **2.4.7** | Focus Visible | Focus indicator is visible |
| **4.1.3** | Status Messages | Status changes announced by screen reader |

---

## Best Practices

### 1. Use Semantic HTML
```html
<!-- GOOD: Semantic -->
<button>Click me</button>
<nav>Navigation</nav>
<main>Content</main>
<footer>Footer</footer>

<!-- BAD: Non-semantic -->
<div onclick="...">Click me</div>
<div>Navigation</div>
<div>Content</div>
<div>Footer</div>
```

### 2. Always Provide Text Alternatives
```html
<!-- Images -->
<img src="chart.png" alt="Sales increased 50% in Q4" />

<!-- Icon buttons -->
<button aria-label="Delete item">
  <svg>...</svg>
</button>

<!-- Videos -->
<video>
  <track kind="captions" src="captions.vtt" />
</video>
```

### 3. Design for Keyboard First
Before implementing mouse interactions, ensure keyboard works:
- Tab navigation
- Enter/Space activation
- Escape to close
- Arrow keys for lists/menus

### 4. Test with Real Assistive Technology
Don't rely solely on automated tools. Actually use:
- Screen readers (NVDA, JAWS, VoiceOver)
- Keyboard-only navigation
- Voice control (Dragon, Voice Control)

### 5. Involve Users with Disabilities
The best testing includes people with actual disabilities:
- Hire accessibility consultants
- Run usability tests with diverse users
- Get feedback from disability community

---

## Testing Checklist

### Before Every Release
- [ ] Run automated accessibility tests (axe, Lighthouse)
- [ ] Test with keyboard only (unplug mouse)
- [ ] Test with NVDA or VoiceOver
- [ ] Check color contrast
- [ ] Verify all images have alt text
- [ ] Test form validation and errors
- [ ] Check focus visibility
- [ ] Test modals and overlays
- [ ] Verify skip links work
- [ ] Check page titles are unique

### Quarterly Comprehensive Audit
- [ ] Full manual screen reader test (all pages)
- [ ] Test with multiple screen readers
- [ ] Test on mobile with TalkBack/VoiceOver
- [ ] Magnification testing (200-400% zoom)
- [ ] Voice control testing
- [ ] User testing with people with disabilities

---

## Resources

### Screen Readers
- **NVDA**: https://www.nvaccess.org/
- **JAWS**: https://www.freedomscientific.com/products/software/jaws/
- **VoiceOver Guide**: https://www.apple.com/accessibility/voiceover/

### Testing Tools
- **WAVE**: https://wave.webaim.org/
- **axe DevTools**: https://www.deque.com/axe/devtools/
- **Lighthouse**: Built into Chrome DevTools
- **Accessibility Insights**: https://accessibilityinsights.io/

### Learning Resources
- **WebAIM**: https://webaim.org/
- **A11y Project**: https://www.a11yproject.com/
- **WCAG Quick Reference**: https://www.w3.org/WAI/WCAG21/quickref/
- **Deque University**: https://dequeuniversity.com/

### Testing Checklist
- **WebAIM Checklist**: https://webaim.org/standards/wcag/checklist
- **A11y Checklist**: https://www.a11yproject.com/checklist/

---

**Status**: Ready to start manual accessibility testing! 🎉
**Framework**: T147 accessibility testing checklist available
**Next Steps**: Perform manual accessibility audit using this guide
