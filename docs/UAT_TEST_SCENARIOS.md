# User Acceptance Testing (UAT) - Test Scenarios

**Version**: 1.0
**Last Updated**: November 6, 2025
**Environment**: Staging
**Tester Instructions**: Complete all scenarios and report results

---

## Table of Contents

1. [Overview](#overview)
2. [Test Environment](#test-environment)
3. [Test Accounts](#test-accounts)
4. [Critical User Journeys](#critical-user-journeys)
5. [Feature-Specific Tests](#feature-specific-tests)
6. [Cross-Browser Testing](#cross-browser-testing)
7. [Mobile Testing](#mobile-testing)
8. [Performance Testing](#performance-testing)
9. [Security Testing](#security-testing)
10. [Bug Reporting](#bug-reporting)

---

## Overview

### Purpose
User Acceptance Testing validates that the platform meets business requirements and user expectations before production deployment.

### Scope
- All user-facing features
- Critical business workflows
- Cross-browser compatibility
- Mobile responsiveness
- Performance and security

### Success Criteria
- ✅ All critical tests pass
- ✅ No high-severity bugs
- ✅ Performance meets targets
- ✅ Security tests pass
- ✅ Stakeholder sign-off

---

## Test Environment

**Staging URL**: https://staging.yourdomain.com

**Credentials**: See [Test Accounts](#test-accounts)

**Setup**:
1. Access staging environment
2. Clear browser cache
3. Use incognito/private mode
4. Test on recommended browsers

---

## Test Accounts

### Regular User
- **Email**: test@example.com
- **Password**: [Available in 1Password]
- **Purpose**: Standard user workflows

### Admin User
- **Email**: admin@example.com
- **Password**: [Available in 1Password]
- **Purpose**: Admin features testing

### Test Cards (Stripe Test Mode)
- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- **Insufficient Funds**: 4000 0000 0000 9995

---

## Critical User Journeys

### CUJ-001: New User Registration

**Priority**: 🔴 Critical

**Steps**:
1. Navigate to staging homepage
2. Click "Sign Up" or "Get Started"
3. Fill registration form:
   - Email: newuser@test.com
   - Name: Test User
   - Password: SecurePass123!
4. Submit form
5. Verify email sent
6. Click verification link
7. Confirm account activated

**Expected Result**:
- ✅ Registration form validates inputs
- ✅ Email verification sent within 1 minute
- ✅ Account activated successfully
- ✅ User redirected to dashboard/welcome page

**Test Data**:
| Field | Valid Value | Invalid Value |
|-------|-------------|---------------|
| Email | test123@example.com | notanemail |
| Password | SecurePass123! | 123 (too short) |
| Name | John Doe | (empty) |

**Pass/Fail**: ☐

**Notes**: _______________________

---

### CUJ-002: User Login

**Priority**: 🔴 Critical

**Steps**:
1. Navigate to login page
2. Enter email: test@example.com
3. Enter password: [test password]
4. Click "Login"
5. Verify dashboard loads

**Expected Result**:
- ✅ Valid credentials → successful login
- ✅ Invalid credentials → error message
- ✅ Session persists after refresh
- ✅ User sees personalized content

**Test Cases**:
- ✅ Valid email + valid password → Success
- ✅ Valid email + wrong password → Error
- ✅ Invalid email format → Validation error
- ✅ Empty fields → Validation error
- ✅ Remember me checkbox → Session persists

**Pass/Fail**: ☐

**Notes**: _______________________

---

### CUJ-003: Browse and View Products

**Priority**: 🔴 Critical

**Steps**:
1. Navigate to products/courses page
2. View list of products
3. Use search functionality
4. Filter by category
5. Click on a product
6. View product details

**Expected Result**:
- ✅ Products load within 2 seconds
- ✅ Search returns relevant results
- ✅ Filters work correctly
- ✅ Product details page shows complete information
- ✅ Images load properly

**Performance Targets**:
- Product listing: < 2 seconds
- Search results: < 1 second
- Product detail page: < 1.5 seconds

**Pass/Fail**: ☐

**Notes**: _______________________

---

### CUJ-004: Add to Cart and Checkout

**Priority**: 🔴 Critical

**Steps**:
1. Add product to cart
2. View cart
3. Update quantity
4. Proceed to checkout
5. Enter shipping information
6. Select payment method
7. Enter test card: 4242 4242 4242 4242
8. Complete purchase

**Expected Result**:
- ✅ Item added to cart
- ✅ Cart total calculates correctly
- ✅ Can update/remove items
- ✅ Checkout form validates inputs
- ✅ Payment processes successfully
- ✅ Order confirmation displayed
- ✅ Confirmation email sent

**Test Cases**:
- ✅ Add single item
- ✅ Add multiple items
- ✅ Update quantity
- ✅ Remove item
- ✅ Apply discount code
- ✅ Successful payment (4242 4242 4242 4242)
- ✅ Failed payment (4000 0000 0000 0002)

**Pass/Fail**: ☐

**Notes**: _______________________

---

### CUJ-005: User Profile Management

**Priority**: 🟡 High

**Steps**:
1. Login as test user
2. Navigate to profile/settings
3. Update profile information:
   - Name
   - Email
   - Phone
4. Change password
5. Save changes

**Expected Result**:
- ✅ Profile loads current information
- ✅ Can update all fields
- ✅ Email change requires verification
- ✅ Password change requires current password
- ✅ Changes saved successfully
- ✅ Confirmation message displayed

**Pass/Fail**: ☐

**Notes**: _______________________

---

### CUJ-006: Password Reset

**Priority**: 🟡 High

**Steps**:
1. Go to login page
2. Click "Forgot Password"
3. Enter email: test@example.com
4. Click "Send Reset Link"
5. Check email for reset link
6. Click reset link
7. Enter new password
8. Submit
9. Login with new password

**Expected Result**:
- ✅ Reset email sent within 1 minute
- ✅ Reset link works
- ✅ New password validates (complexity)
- ✅ Can login with new password
- ✅ Old password no longer works

**Pass/Fail**: ☐

**Notes**: _______________________

---

### CUJ-007: Search Functionality

**Priority**: 🟡 High

**Steps**:
1. Use search bar
2. Search for: "meditation"
3. View results
4. Try different search terms
5. Test autocomplete/suggestions

**Expected Result**:
- ✅ Results appear within 1 second
- ✅ Results are relevant
- ✅ No results shows helpful message
- ✅ Autocomplete suggests terms
- ✅ Can filter/sort results

**Test Queries**:
| Query | Expected Results |
|-------|------------------|
| "meditation" | Related courses/content |
| "xyz123abc" | No results message |
| "" (empty) | All results or prompt |

**Pass/Fail**: ☐

**Notes**: _______________________

---

### CUJ-008: Video Playback (if applicable)

**Priority**: 🟡 High

**Steps**:
1. Navigate to course with video
2. Click play on video
3. Test pause/resume
4. Test seeking (skip forward/back)
5. Test fullscreen
6. Test quality settings

**Expected Result**:
- ✅ Video starts within 3 seconds
- ✅ No buffering on good connection
- ✅ Controls work correctly
- ✅ Fullscreen works
- ✅ Quality adjusts to connection

**Pass/Fail**: ☐

**Notes**: _______________________

---

### CUJ-009: Admin Dashboard

**Priority**: 🟡 High (Admin only)

**Steps**:
1. Login as admin
2. Access admin dashboard
3. View user list
4. View orders
5. View analytics
6. Test admin actions

**Expected Result**:
- ✅ Admin dashboard accessible
- ✅ User list displays correctly
- ✅ Orders list displays correctly
- ✅ Analytics load
- ✅ Admin actions work

**Pass/Fail**: ☐

**Notes**: _______________________

---

### CUJ-010: Logout

**Priority**: 🟢 Medium

**Steps**:
1. While logged in, click "Logout"
2. Confirm logged out
3. Try accessing protected page
4. Verify redirected to login

**Expected Result**:
- ✅ Successfully logged out
- ✅ Session cleared
- ✅ Cannot access protected pages
- ✅ Redirected to login

**Pass/Fail**: ☐

**Notes**: _______________________

---

## Feature-Specific Tests

### F-001: Email Notifications

**Test Cases**:
- ☐ Welcome email after registration
- ☐ Email verification
- ☐ Password reset email
- ☐ Order confirmation email
- ☐ Shipping notification (if applicable)

**Pass/Fail**: ☐

---

### F-002: Responsive Design

**Test Cases**:
- ☐ Desktop (1920x1080)
- ☐ Laptop (1366x768)
- ☐ Tablet (768x1024)
- ☐ Mobile (375x667)

**Pass/Fail**: ☐

---

### F-003: Form Validation

**Test Cases**:
- ☐ Email format validation
- ☐ Password strength validation
- ☐ Required field validation
- ☐ Phone number format (if applicable)
- ☐ Credit card format

**Pass/Fail**: ☐

---

### F-004: Error Handling

**Test Cases**:
- ☐ 404 page for invalid URLs
- ☐ Graceful handling of network errors
- ☐ Helpful error messages
- ☐ Error recovery options

**Pass/Fail**: ☐

---

### F-005: Accessibility

**Test Cases**:
- ☐ Keyboard navigation works
- ☐ Screen reader friendly
- ☐ Sufficient color contrast
- ☐ Alt text on images
- ☐ Form labels present

**Pass/Fail**: ☐

---

## Cross-Browser Testing

### Desktop Browsers

**Chrome (Latest)**:
- ☐ All critical journeys pass
- ☐ UI renders correctly
- ☐ No console errors

**Firefox (Latest)**:
- ☐ All critical journeys pass
- ☐ UI renders correctly
- ☐ No console errors

**Safari (Latest)**:
- ☐ All critical journeys pass
- ☐ UI renders correctly
- ☐ No console errors

**Edge (Latest)**:
- ☐ All critical journeys pass
- ☐ UI renders correctly
- ☐ No console errors

---

## Mobile Testing

### iOS Safari
- ☐ Registration works
- ☐ Login works
- ☐ Checkout works
- ☐ UI responsive
- ☐ Touch targets adequate

### Android Chrome
- ☐ Registration works
- ☐ Login works
- ☐ Checkout works
- ☐ UI responsive
- ☐ Touch targets adequate

---

## Performance Testing

### Page Load Times

| Page | Target | Actual | Pass/Fail |
|------|--------|--------|-----------|
| Homepage | < 2s | _____ | ☐ |
| Products | < 2s | _____ | ☐ |
| Product Detail | < 1.5s | _____ | ☐ |
| Checkout | < 2s | _____ | ☐ |
| Dashboard | < 2s | _____ | ☐ |

### Core Web Vitals

| Metric | Target | Actual | Pass/Fail |
|--------|--------|--------|-----------|
| LCP | < 2.5s | _____ | ☐ |
| FID | < 100ms | _____ | ☐ |
| CLS | < 0.1 | _____ | ☐ |

---

## Security Testing

### Basic Security Checks

- ☐ HTTPS enforced
- ☐ Passwords masked in forms
- ☐ Session expires after inactivity
- ☐ Cannot access other users' data
- ☐ Admin pages require authentication
- ☐ SQL injection protected (try `' OR '1'='1`)
- ☐ XSS protected (try `<script>alert('XSS')</script>`)

---

## Bug Reporting

### Bug Template

**Bug ID**: UAT-XXX

**Severity**:
- 🔴 Critical (blocks testing)
- 🟡 High (major feature broken)
- 🟢 Medium (feature partially broken)
- 🔵 Low (cosmetic issue)

**Steps to Reproduce**:
1. Step 1
2. Step 2
3. Step 3

**Expected Result**: What should happen

**Actual Result**: What actually happens

**Environment**:
- Browser: Chrome 120
- OS: Windows 11
- Screen Size: 1920x1080

**Screenshots**: [Attach if applicable]

---

## Sign-Off

### Tester Information

**Name**: _______________________

**Role**: _______________________

**Date**: _______________________

### Test Results Summary

**Total Tests**: _______

**Passed**: _______

**Failed**: _______

**Blocked**: _______

### Recommendation

- ☐ **PASS** - Ready for production
- ☐ **PASS WITH MINOR ISSUES** - Can deploy, fix issues post-launch
- ☐ **FAIL** - Not ready, requires fixes

**Comments**: _______________________

**Signature**: _______________________

---

## Additional Notes

[Space for any additional observations, suggestions, or concerns]

_______________________________________________________

_______________________________________________________

_______________________________________________________
