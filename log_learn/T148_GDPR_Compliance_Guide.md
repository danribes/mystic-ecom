# T148: GDPR Compliance - Learning Guide

**Topic**: General Data Protection Regulation (GDPR) Compliance
**Level**: Intermediate
**Date**: November 5, 2025

---

## Table of Contents

1. [What is GDPR?](#what-is-gdpr)
2. [Why GDPR Matters](#why-gdpr-matters)
3. [Key GDPR Principles](#key-gdpr-principles)
4. [User Rights Under GDPR](#user-rights-under-gdpr)
5. [Implementation Guide](#implementation-guide)
6. [Cookie Consent](#cookie-consent)
7. [Data Export](#data-export)
8. [Data Deletion](#data-deletion)
9. [Best Practices](#best-practices)
10. [Common Pitfalls](#common-pitfalls)

---

## What is GDPR?

**GDPR** (General Data Protection Regulation) is a comprehensive data protection law that came into effect on May 25, 2018, in the European Union (EU) and European Economic Area (EEA).

### Key Points
- 🌍 **Scope**: Applies to ANY organization processing EU residents' data (regardless of organization location)
- ⚖️ **Enforcement**: Fines up to €20 million or 4% of global annual revenue (whichever is higher)
- 👤 **Focus**: Gives individuals control over their personal data
- 📋 **Requirements**: Organizations must implement technical and organizational measures to protect data

### What is Personal Data?
Any information relating to an identified or identifiable person:
- ✅ Name, email, phone number
- ✅ IP address, cookie identifiers
- ✅ Location data
- ✅ Online identifiers (user IDs, session IDs)
- ✅ Health data, financial data
- ✅ Biometric data (fingerprints, facial recognition)

---

## Why GDPR Matters

### Legal Reasons
- **Mandatory** for EU/EEA businesses
- **Required** for non-EU businesses serving EU customers
- **Heavy fines** for non-compliance
- **Lawsuits** from affected users

### Business Reasons
- 📈 **Customer Trust**: Users trust companies that respect privacy
- 🌟 **Competitive Advantage**: Privacy-first is a selling point
- 💰 **Reduced Risk**: Avoid costly data breaches and fines
- 🌍 **Global Expansion**: Easier to enter EU markets

### Examples of GDPR Fines
- **Google (2019)**: €50 million for lack of transparency
- **Amazon (2021)**: €746 million for cookie violations
- **Meta (2023)**: €1.2 billion for data transfers

---

## Key GDPR Principles

### 1. Lawfulness, Fairness, and Transparency
- Process data **lawfully** (with consent, contract, legal obligation, etc.)
- Be **fair** (don't use data in unexpected ways)
- Be **transparent** (tell users what data you collect and why)

### 2. Purpose Limitation
- Collect data for **specific, explicit purposes**
- Don't use data for other purposes without new consent
- Example: If you collect email for newsletters, don't use it for marketing without permission

### 3. Data Minimization
- Collect only what you **actually need**
- Don't collect "just in case" data
- Example: Don't ask for date of birth if you only need age verification

### 4. Accuracy
- Keep data **up to date**
- Allow users to **correct** incorrect data
- Delete inaccurate data

### 5. Storage Limitation
- Don't keep data **longer than necessary**
- Implement data retention policies
- Example: Delete inactive accounts after 2 years

### 6. Integrity and Confidentiality
- **Secure** data from unauthorized access
- Use encryption, access controls, secure transmission
- Regular security audits

### 7. Accountability
- **Demonstrate** compliance
- Keep records of processing activities
- Implement data protection by design

---

## User Rights Under GDPR

### Article 15: Right of Access
**What it means**: Users can request a copy of all their personal data

**Our Implementation**: `/api/gdpr/export`
```typescript
// Export all user data in JSON format
const data = await exportUserData(userId);
// Returns: profile, orders, bookings, reviews, progress, etc.
```

### Article 16: Right to Rectification
**What it means**: Users can correct inaccurate data

**Our Implementation**: User profile edit functionality
```typescript
// Users can update their profile
await updateUserProfile(userId, { name, email, whatsapp });
```

### Article 17: Right to Erasure ("Right to be Forgotten")
**What it means**: Users can request deletion of their data

**Our Implementation**: `/api/gdpr/delete`
```typescript
// Delete or anonymize user data
const result = await deleteUserData(userId, hardDelete);
// Respects financial record retention requirements
```

### Article 18: Right to Restriction of Processing
**What it means**: Users can limit how their data is used

**Our Implementation**: Soft delete (set deleted_at timestamp)
```typescript
// User marked as deleted but data preserved
UPDATE users SET deleted_at = NOW() WHERE id = $1
```

### Article 20: Right to Data Portability
**What it means**: Users can receive their data in machine-readable format

**Our Implementation**: JSON export with all data
```json
{
  "metadata": { "format": "json", "gdprArticle": "Article 20" },
  "profile": { ... },
  "orders": [ ... ],
  ...
}
```

### Article 21: Right to Object
**What it means**: Users can object to data processing

**Our Implementation**: Cookie consent with granular options
```typescript
{
  essential: true,   // Required
  analytics: false,  // Can object
  marketing: false   // Can object
}
```

---

## Implementation Guide

### Step 1: Cookie Consent

**Purpose**: Get user permission before setting non-essential cookies

**Implementation**:
```astro
<!-- Add to layout -->
<CookieConsent />
```

**Features**:
- ✅ Granular consent (Essential, Analytics, Marketing)
- ✅ Persistent storage (1 year)
- ✅ Accessible UI
- ✅ Respects user choice

**Best Practices**:
- Don't load analytics/marketing until consent given
- Make consent easy to withdraw
- Keep consent records (with timestamps)

### Step 2: Data Export (Article 15 & 20)

**Purpose**: Allow users to download all their data

**API Endpoint**:
```typescript
POST /api/gdpr/export
```

**Implementation**:
```typescript
export async function exportUserData(userId: string): Promise<UserDataExport> {
  // 1. Fetch user profile
  // 2. Fetch orders and order items
  // 3. Fetch bookings
  // 4. Fetch reviews
  // 5. Fetch course progress
  // 6. Fetch lesson progress
  // 7. Fetch downloads
  // 8. Fetch cart items
  
  return {
    metadata: { exportDate, userId, format: 'json' },
    profile: { ... },
    orders: [ ... ],
    ...
  };
}
```

**What to Include**:
- ✅ All profile data
- ✅ Purchase history
- ✅ Activity logs (views, downloads)
- ✅ User-generated content (reviews, comments)
- ✅ Preferences and settings
- ❌ Don't include: passwords (hashed), internal IDs used only for system

**Format Requirements**:
- Machine-readable (JSON, CSV, XML)
- Structured and clear
- Include metadata (export date, format)
- Reference GDPR articles

### Step 3: Data Deletion (Article 17)

**Purpose**: Allow users to delete their account and data

**API Endpoint**:
```typescript
POST /api/gdpr/delete
```

**Three Deletion Strategies**:

#### 1. Anonymization (Has Financial Records)
```typescript
// User has orders/bookings (legal requirement to keep)
// Strategy: Anonymize user, keep financial records
{
  email: `deleted_{userId}@anonymized.local`,
  name: `Deleted User {userId_prefix}`,
  whatsapp: null,
  deleted_at: NOW()
}
```

#### 2. Soft Delete (No Financial Records)
```typescript
// No orders/bookings
// Strategy: Mark as deleted, keep for recovery
UPDATE users SET deleted_at = NOW() WHERE id = $1
```

#### 3. Hard Delete (No Financial Records + Explicit Request)
```typescript
// Permanently remove from database
DELETE FROM users WHERE id = $1
// Related data cascades automatically
```

**Legal Considerations**:
- ⚖️ **Financial Records**: Must keep for tax/audit (typically 7-10 years)
- ⚖️ **Legal Claims**: Can keep data if involved in legal proceedings
- ⚖️ **Contracts**: Can keep data needed to fulfill contracts
- ⚖️ **Legitimate Interest**: May refuse if you have legitimate reason

**Database Constraints**:
```sql
-- Orders and bookings have RESTRICT constraints
-- Cannot delete user with financial records
ALTER TABLE orders 
  ADD CONSTRAINT fk_user 
  FOREIGN KEY (user_id) REFERENCES users(id) 
  ON DELETE RESTRICT;

-- Download logs nullify user_id (preserve audit trail)
ALTER TABLE download_logs
  ADD CONSTRAINT fk_user
  FOREIGN KEY (user_id) REFERENCES users(id)
  ON DELETE SET NULL;

-- Other data cascades
ALTER TABLE reviews
  ADD CONSTRAINT fk_user
  FOREIGN KEY (user_id) REFERENCES users(id)
  ON DELETE CASCADE;
```

---

## Cookie Consent

### Why Cookie Consent is Required

**ePrivacy Directive** (aka "Cookie Law") requires:
1. Inform users about cookies
2. Get explicit consent before setting non-essential cookies
3. Allow users to withdraw consent
4. Don't block access for refusing non-essential cookies

### Cookie Categories

#### Essential Cookies (Always Allowed)
- Session cookies (login, authentication)
- Shopping cart cookies
- Security cookies (CSRF protection)
- Load balancing cookies

**Why**: Necessary for site to function

#### Analytics Cookies (Require Consent)
- Google Analytics
- Heatmaps
- User behavior tracking

**Why**: Not strictly necessary for site function

#### Marketing Cookies (Require Consent)
- Facebook Pixel
- Google Ads
- Retargeting pixels
- Social media tracking

**Why**: Used for advertising, not core functionality

### Implementation Example

```typescript
// Check consent before loading analytics
const consent = parseCookieConsent(document.cookie);

if (consent.analytics) {
  // Load Google Analytics
  loadGoogleAnalytics();
}

if (consent.marketing) {
  // Load Facebook Pixel
  loadFacebookPixel();
}
```

---

## Data Export

### What to Export

**User Profile**:
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "user",
  "whatsapp": "+1234567890",
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2025-11-05T00:00:00.000Z"
}
```

**Purchase History**:
```json
{
  "orders": [
    {
      "id": "order-uuid",
      "status": "completed",
      "totalAmount": 99.99,
      "currency": "USD",
      "items": [
        {
          "itemType": "course",
          "title": "Meditation Basics",
          "price": 99.99,
          "quantity": 1
        }
      ],
      "createdAt": "2024-06-01T12:00:00.000Z"
    }
  ]
}
```

**Activity Data**:
```json
{
  "courseProgress": [
    {
      "courseTitle": "Meditation Basics",
      "progressPercentage": 75,
      "completedLessons": ["lesson-1", "lesson-2", "lesson-3"],
      "lastAccessedAt": "2025-11-04T10:30:00.000Z"
    }
  ]
}
```

### Export Format

**JSON** (Recommended):
- Machine-readable
- Structured
- Easy to parse
- Supports nested data

**CSV** (Alternative):
- Spreadsheet-friendly
- Simple structure
- Limited nesting support

**XML** (Alternative):
- Standard format
- Good for B2B
- More verbose

---

## Data Deletion

### Deletion Workflow

1. **User Request**
   ```
   User clicks "Delete Account" → Confirmation modal
   ```

2. **Confirmation**
   ```
   User must type "delete my account" → Prevents accidents
   ```

3. **Check Financial Records**
   ```sql
   SELECT COUNT(*) FROM orders WHERE user_id = $1;
   SELECT COUNT(*) FROM bookings WHERE user_id = $1;
   ```

4. **Choose Strategy**
   - Has financial records → **Anonymize**
   - No financial records, soft delete → **Soft Delete**
   - No financial records, hard delete → **Hard Delete**

5. **Execute Deletion**
   ```typescript
   BEGIN TRANSACTION;
   
   // Delete non-essential data
   DELETE FROM cart_items WHERE user_id = $1;
   DELETE FROM reviews WHERE user_id = $1;
   DELETE FROM course_progress WHERE user_id = $1;
   
   // Anonymize or delete user
   UPDATE users SET 
     email = 'deleted_UUID@anonymized.local',
     name = 'Deleted User',
     deleted_at = NOW()
   WHERE id = $1;
   
   COMMIT;
   ```

6. **Log Out User**
   ```typescript
   await destroySession(sessionId);
   deleteSessionCookie(cookies);
   ```

### What to Keep vs Delete

**Keep** (Legal Requirement):
- ✅ Financial records (orders, invoices)
- ✅ Booking records (event management)
- ✅ Audit logs (security, compliance)
- ✅ Data involved in legal proceedings

**Delete** (User Request):
- ❌ Profile data (after anonymization)
- ❌ Reviews and comments
- ❌ Course progress
- ❌ Cart contents
- ❌ Temporary data

---

## Best Practices

### 1. Privacy by Design
- Think about privacy **from the start**
- Don't collect unnecessary data
- Use privacy-preserving techniques (anonymization, pseudonymization)

### 2. Transparency
- Clear Privacy Policy
- Easy-to-understand language
- Explain data usage in simple terms

### 3. User Control
- Easy consent management
- Simple data export
- One-click account deletion
- Granular privacy settings

### 4. Security
- Encrypt data at rest and in transit
- Regular security audits
- Access controls (who can see what)
- Secure deletion (overwrite, not just DELETE)

### 5. Documentation
- Keep records of data processing activities
- Document consent (who, when, what)
- Maintain audit logs
- Regular compliance reviews

### 6. Data Retention
- Define retention periods
- Auto-delete old data
- Regular cleanup scripts

Example:
```sql
-- Delete inactive accounts after 2 years
DELETE FROM users 
WHERE deleted_at IS NULL 
  AND last_login < NOW() - INTERVAL '2 years';
```

### 7. Third-Party Services
- Review data processing agreements
- Ensure vendors are GDPR-compliant
- Limit data shared with third parties
- Use Data Processing Agreements (DPAs)

---

## Common Pitfalls

### ❌ Mistake 1: Pre-Checked Consent Boxes
```html
<!-- WRONG: Pre-checked -->
<input type="checkbox" name="marketing" checked>

<!-- CORRECT: Not pre-checked -->
<input type="checkbox" name="marketing">
```

### ❌ Mistake 2: Cookie Walls
```html
<!-- WRONG: Blocking access without consent -->
<div class="cookie-wall">
  Accept cookies or you can't use this site
</div>

<!-- CORRECT: Allow rejection -->
<button>Accept All</button>
<button>Reject Optional</button>
<button>Customize</button>
```

### ❌ Mistake 3: Unclear Privacy Policy
```
<!-- WRONG: Legal jargon -->
"We may process your personal data pursuant to Article 6(1)(f) GDPR..."

<!-- CORRECT: Plain language -->
"We use your email to send you order confirmations and updates."
```

### ❌ Mistake 4: Not Providing Data Export
```typescript
// WRONG: Manual process
"Email us at privacy@example.com to request your data"

// CORRECT: Automated export
<button onclick="exportMyData()">Download My Data</button>
```

### ❌ Mistake 5: Delaying Deletion Requests
```
// WRONG: 30-day waiting period
"Your account will be deleted in 30 days"

// CORRECT: Immediate deletion (with grace period option)
"Your account has been deleted. Undo within 7 days if you change your mind."
```

### ❌ Mistake 6: Ignoring Data Retention Laws
```typescript
// WRONG: Delete everything
DELETE FROM orders WHERE user_id = $1;

// CORRECT: Anonymize financial records
UPDATE users SET 
  email = 'deleted@anonymized.local',
  name = 'Deleted User'
WHERE id = $1;
// Keep orders for tax compliance
```

---

## GDPR Checklist

### Before Launch
- [ ] Cookie consent banner implemented
- [ ] Privacy Policy page created
- [ ] Terms of Service page created
- [ ] Data export functionality working
- [ ] Data deletion functionality working
- [ ] Secure data transmission (HTTPS)
- [ ] Access controls implemented
- [ ] Data Processing Agreement with vendors
- [ ] Appointed Data Protection Officer (if required)

### Ongoing Compliance
- [ ] Regular security audits
- [ ] Monitor consent rates
- [ ] Update Privacy Policy when needed
- [ ] Train staff on GDPR
- [ ] Review third-party processors
- [ ] Maintain audit logs
- [ ] Test data export/deletion
- [ ] Handle data breaches properly (72-hour notification)

---

## Resources

### Official Documentation
- [GDPR Full Text](https://gdpr-info.eu/)
- [ICO (UK) GDPR Guide](https://ico.org.uk/for-organisations/guide-to-data-protection/guide-to-the-general-data-protection-regulation-gdpr/)
- [CNIL (France) GDPR Resources](https://www.cnil.fr/en/home)

### Tools
- [Cookie Consent Libraries](https://github.com/orestbida/cookieconsent)
- [GDPR Compliance Checker](https://gdpr.eu/compliance-checklist/)
- [Data Protection Impact Assessment Template](https://ico.org.uk/for-organisations/guide-to-data-protection/guide-to-the-general-data-protection-regulation-gdpr/accountability-and-governance/data-protection-impact-assessments/)

### Similar Regulations
- **CCPA** (California): Similar rights, different requirements
- **LGPD** (Brazil): Based on GDPR
- **POPI** (South Africa): Data protection law
- **PIPEDA** (Canada): Privacy law

---

**Status**: Ready to implement GDPR-compliant features! 🌟
**Compliance Level**: Articles 6, 15, 16, 17, 18, 20, 21 covered
**Next Steps**: Create Privacy Policy and Terms of Service pages

