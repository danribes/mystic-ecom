# T136: OWASP Top 10 2021 Compliance Audit - Learning Guide

**Topic**: Comprehensive Security Compliance Auditing
**Level**: Advanced
**Prerequisites**: Security fundamentals, web vulnerabilities, compliance frameworks
**Estimated Time**: 60 minutes

---

## Overview

This guide covers implementing automated compliance auditing based on the OWASP Top 10 2021 standard - the globally recognized list of the most critical web application security risks.

---

## What is OWASP Top 10?

**OWASP (Open Web Application Security Project)** is a nonprofit foundation that works to improve software security. The OWASP Top 10 is a standard awareness document representing a broad consensus about the most critical security risks to web applications.

**Version**: 2021 (updated every 3-4 years)

**Purpose**:
- Raise awareness of security risks
- Provide actionable guidance
- Establish security baseline
- Enable security compliance

---

## OWASP Top 10 2021 Categories

### A01:2021 – Broken Access Control

**What it is**: Failures in enforcing proper authorization, allowing users to access resources they shouldn't.

**Common Vulnerabilities**:
- Missing authentication on sensitive endpoints
- Elevation of privilege (user → admin)
- Insecure direct object references (IDOR)
- CORS misconfiguration
- Force browsing to authenticated pages

**Example Attack**:
```http
# Normal user accessing admin endpoint
GET /api/admin/delete-user/123
# Should return 403 Forbidden, but doesn't

# Changing user ID in URL
GET /api/users/456/profile
# Should only show own profile (user 123), not others
```

**Prevention**:
- Implement authentication middleware on all endpoints
- Use role-based access control (RBAC)
- Deny by default - require explicit grants
- Validate access on every request
- Log access control failures

**Our Checks**:
```typescript
// Check 1: Authorization middleware exists
const authMiddleware = await checkFileExists('src/middleware/auth.ts');

// Check 2: RBAC implementation
const rbacFiles = await findFilesWithPattern(['src/**/*rbac*']);

// Check 3: API protection rate
const protectedRate = (protectedEndpoints / totalEndpoints) * 100;
// Target: >70%

// Check 4: CORS configuration
const hasCORS = await checkFileContains('src', /cors|allowedOrigin/i);
```

---

### A02:2021 – Cryptographic Failures

**What it is**: Failures related to cryptography leading to exposure of sensitive data.

**Common Vulnerabilities**:
- Transmitting data in clear text (HTTP vs HTTPS)
- Using weak crypto algorithms (MD5, SHA1, DES)
- Not encrypting sensitive data at rest
- Weak key generation or management
- Missing certificate validation

**Example Issue**:
```typescript
// BAD: Using MD5 for password hashing
import crypto from 'crypto';
const hash = crypto.createHash('md5').update(password).digest('hex');

// GOOD: Using bcrypt
import bcrypt from 'bcrypt';
const hash = await bcrypt.hash(password, 12);
```

**Prevention**:
- Enforce HTTPS everywhere
- Use strong, modern algorithms (AES-256, SHA-256+)
- Use bcrypt/Argon2 for passwords
- Encrypt sensitive data at rest
- Use proven crypto libraries

**Our Checks**:
```typescript
// Check 1: HTTPS enforcement
const httpsEnforced = await checkFileContains('src', /secure.*true|https.*only/i);

// Check 2: Strong password hashing
const strongHashing = await checkFileContains('src', /bcrypt|argon2|scrypt/i);

// Check 3: Weak algorithms
const weakCrypto = await checkFileContains('src', /md5|sha1|des|rc4/i);
// Fail if found

// Check 4: .env protection
const envInGitignore = await checkFileContains('.gitignore', /\.env/);
```

---

### A03:2021 – Injection

**What it is**: Untrusted data sent to an interpreter as part of a command or query.

**Types**:
- SQL Injection
- NoSQL Injection
- OS Command Injection
- LDAP Injection
- Expression Language (EL) Injection

**SQL Injection Example**:
```typescript
// VULNERABLE:
const query = `SELECT * FROM users WHERE username='${username}'`;
// Input: admin'--
// Result: SELECT * FROM users WHERE username='admin'--'

// SAFE: Parameterized query
const query = db.prepare('SELECT * FROM users WHERE username = ?');
const result = await query.get(username);
```

**Prevention**:
- Use parameterized queries/prepared statements
- Use ORMs that handle escaping
- Validate and sanitize all input
- Use allowlists for valid inputs
- Escape special characters

**Our Checks**:
```typescript
// Check 1: Parameterized queries
const usesPreparedStatements = await checkFileContains('src', /db\.query|\.prepare/i);
const hasRawSQL = await checkFileContains('src', /db\.raw|\.rawQuery/i);

// Check 2: XSS protection
const reactUsed = await checkFileContains('package.json', /"react"/);
// React auto-escapes

// Check 3: Command injection
const usesExec = await checkFileContains('src', /exec\(|spawn\(|eval\(/i);

// Check 4: Input validation
const hasValidation = await checkFileContains('src', /validate|zod|yup|joi/i);
```

---

### A04:2021 – Insecure Design

**What it is**: Missing or ineffective security controls in the design phase.

**Focus Areas**:
- Threat modeling
- Secure design patterns
- Reference architectures
- Business logic flaws

**Examples**:
- No rate limiting (enables brute force)
- Insufficient anti-automation
- Missing business rule enforcement
- Inadequate error handling

**Prevention**:
- Establish security requirements
- Use threat modeling (STRIDE, PASTA)
- Implement rate limiting
- Add circuit breakers
- Validate business logic server-side

**Our Checks**:
```typescript
// Check 1: Security documentation
const hasSecurityDocs = await checkFileExists('SECURITY.md');

// Check 2: Rate limiting
const hasRateLimiting = await checkFileContains('src', /rateLimit|throttle/i);

// Check 3: Error handling
const hasErrorHandling = await checkFileContains('src', /try.*catch|\.catch\(/i);

// Check 4: Business logic validation
const hasBusinessValidation = await checkFileContains('src', /business.*rule/i);
```

---

### A05:2021 – Security Misconfiguration

**What it is**: Insecure default configurations, incomplete configs, open cloud storage, verbose error messages.

**Common Issues**:
- Missing security headers
- Default credentials still enabled
- Unnecessary features enabled
- Detailed error messages in production
- Unpatched software

**Security Headers**:
```typescript
// Essential security headers
const securityHeaders = {
  'Content-Security-Policy': "default-src 'self'",
  'Strict-Transport-Security': 'max-age=31536000',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin'
};
```

**Prevention**:
- Implement security headers
- Remove default accounts
- Disable debug mode in production
- Keep software updated
- Use security hardening guides

**Our Checks**:
```typescript
// Check 1: Security headers
const hasSecurityHeaders = await checkFileContains('src', /helmet|csp|hsts/i);

// Check 2: Default credentials
const hasDefaultCreds = await checkFileContains('src', /admin.*admin|password.*password/i);
// Fail if found

// Check 3: Debug code
const hasDebugCode = await checkFileContains('src', /console\.log|debugger/i);
```

---

### A06:2021 – Vulnerable and Outdated Components

**What it is**: Using components with known vulnerabilities or that are outdated.

**Risks**:
- Known CVEs (Common Vulnerabilities and Exposures)
- Outdated dependencies
- Unmaintained packages
- Supply chain attacks

**Prevention**:
- Use `npm audit` regularly
- Keep dependencies updated
- Remove unused dependencies
- Use lock files (package-lock.json)
- Implement automated dependency updates

**Our Checks**:
```typescript
// Check 1: Run npm audit
const scanner = new VulnerabilityScanner();
const scanResult = await scanner.scan();

// Check 2: Lock file exists
const hasLockFile = await checkFileExists('package-lock.json');

// Check 3: Automated updates
const hasRenovate = await checkFileExists('renovate.json');
const hasDependabot = await checkFileExists('.github/dependabot.yml');
```

---

### A07:2021 – Identification and Authentication Failures

**What it is**: Failures in confirming user identity, authentication, and session management.

**Common Issues**:
- Weak passwords allowed
- No MFA (Multi-Factor Authentication)
- Session fixation
- Weak session IDs
- No brute force protection

**Strong Authentication**:
```typescript
// Password policy
const passwordPolicy = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  preventCommon: true
};

// Session configuration
const sessionConfig = {
  cookie: {
    secure: true,        // HTTPS only
    httpOnly: true,      // No JavaScript access
    sameSite: 'strict',  // CSRF protection
    maxAge: 86400000     // 24 hours
  }
};

// Rate limiting on login
const loginRateLimit = {
  maxAttempts: 5,
  windowMinutes: 15
};
```

**Our Checks**:
```typescript
// Check 1: Password policy
const hasPasswordPolicy = await checkFileContains('src', /password.*policy|validatePassword/i);

// Check 2: MFA implementation
const hasMFA = await checkFileContains('src', /mfa|2fa|totp/i);

// Check 3: Session management
const hasSessionManagement = await checkFileContains('src', /session|jwt/i);

// Check 4: Brute force protection
const hasBruteForceProtection = await checkFileContains('src', /rate.*limit/i);
```

---

### A08:2021 – Software and Data Integrity Failures

**What it is**: Code and infrastructure that don't protect against integrity violations.

**Focus Areas**:
- Insecure CI/CD pipelines
- Auto-update without verification
- Insecure deserialization
- Unsigned packages

**Prevention**:
- Use CI/CD with security checks
- Verify package integrity (checksums)
- Validate deserialized data
- Use package signing
- Implement SRI (Subresource Integrity)

**Our Checks**:
```typescript
// Check 1: CI/CD pipeline
const hasCICD = await checkFileExists('.github/workflows');

// Check 2: Package integrity
const hasIntegrity = await checkFileContains('package.json', /"integrity":/);

// Check 3: Unsafe deserialization
const hasUnsafeDeserialization = await checkFileContains('src', /JSON\.parse\(.*req|eval\(/i);
```

---

### A09:2021 – Security Logging and Monitoring Failures

**What it is**: Insufficient logging and monitoring, ineffective incident response.

**Critical Events to Log**:
- Login attempts (success/failure)
- High-value transactions
- Access control failures
- Input validation failures
- Security exceptions

**What NOT to Log**:
- Passwords
- Session tokens
- API keys
- Credit card numbers
- Personal data (PII)

**Good Logging**:
```typescript
// Security event logging
logger.security({
  event: 'login_attempt',
  username: sanitize(username),
  ip: request.ip,
  success: false,
  reason: 'invalid_credentials',
  timestamp: new Date().toISOString()
});

// NOT THIS:
logger.info(`Login failed for ${username} with password ${password}`);
// Never log passwords!
```

**Our Checks**:
```typescript
// Check 1: Logging implementation
const hasLogging = await checkFileContains('src', /logger|log\.|winston|pino/i);

// Check 2: Security event logging
const hasSecurityLogging = await checkFileContains('src', /log.*auth|log.*failed/i);

// Check 3: Sensitive data in logs (BAD)
const hasSensitiveInLogs = await checkFileContains('src', /log.*password|log.*token/i);

// Check 4: Monitoring
const hasMonitoring = await checkFileContains('src', /sentry|newrelic|datadog/i);
```

---

### A10:2021 – Server-Side Request Forgery (SSRF)

**What it is**: Fetching remote resources without validating user-supplied URLs.

**Attack Scenario**:
```typescript
// VULNERABLE:
app.get('/fetch-url', async (req, res) => {
  const url = req.query.url;
  const response = await fetch(url);  // DANGEROUS!
  res.send(await response.text());
});

// Attacker can access:
// - http://localhost/admin
// - http://169.254.169.254/metadata  (AWS metadata)
// - file:///etc/passwd
```

**Prevention**:
- Validate and sanitize URLs
- Use URL allowlists
- Block private IP ranges
- Disable URL redirects
- Use network segmentation

**Safe Implementation**:
```typescript
const ALLOWED_DOMAINS = ['api.example.com', 'cdn.example.com'];

async function safeFetch(url: string) {
  const parsed = new URL(url);

  // Check protocol
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Invalid protocol');
  }

  // Check domain allowlist
  if (!ALLOWED_DOMAINS.includes(parsed.hostname)) {
    throw new Error('Domain not allowed');
  }

  // Block private IPs
  const ip = await dns.resolve4(parsed.hostname);
  if (isPrivateIP(ip[0])) {
    throw new Error('Private IP not allowed');
  }

  return fetch(url);
}
```

**Our Checks**:
```typescript
// Check 1: External requests
const hasExternalRequests = await checkFileContains('src', /fetch\(|axios/i);

// Check 2: URL validation
const hasURLValidation = await checkFileContains('src', /url.*validate|allowlist/i);

// Check 3: DNS protection
const hasDNSProtection = await checkFileContains('src', /dns.*resolve|ip.*validate/i);
```

---

## Using the OWASP Auditor

### Basic Usage

```bash
# Run basic audit
npm run security:owasp

# Run with verbose output
npm run security:owasp:verbose

# Run with custom config
npx tsx src/scripts/owaspAudit.ts --app-name "My App" --save-report
```

### Programmatic Usage

```typescript
import { runOWASPAudit } from '@/lib/security/owaspTop10Auditor';

// Run audit
const report = await runOWASPAudit({
  applicationName: 'Production App',
  generateReport: true,
  outputDir: './security-reports'
});

// Check compliance
if (report.summary.complianceScore < 70) {
  console.error('Compliance below threshold!');
  process.exit(1);
}

// Review critical issues
const critical = report.checks.filter(c =>
  c.severity === 'critical' && c.status === 'fail'
);

console.log(`Critical issues: ${critical.length}`);
critical.forEach(issue => {
  console.log(`- ${issue.name}: ${issue.findings.join(', ')}`);
});
```

### CI/CD Integration

```yaml
# GitHub Actions
- name: OWASP Security Audit
  run: npm run security:owasp

- name: Check compliance
  run: |
    SCORE=$(jq '.summary.complianceScore' security-reports/latest-owasp-audit.json)
    if [ "$SCORE" -lt 70 ]; then
      echo "Compliance score too low: $SCORE%"
      exit 1
    fi
```

---

## Compliance Scoring

**Score Calculation**:
```
Compliance Score = (Passed Checks / Total Applicable Checks) × 100
```

**Thresholds**:
- ✅ **90-100%**: Excellent - Production ready
- ⚠️  **70-89%**: Good - Minor improvements needed
- ❌ **50-69%**: Fair - Significant work required
- 🚨 **<50%**: Poor - Major security concerns

**Example**:
- Total Checks: 39
- Passed: 25
- Failed: 6
- Warnings: 8
- Not Applicable: 0
- **Score**: (25 / 39) × 100 = 64%

---

## Remediation Workflow

### 1. Run Audit
```bash
npm run security:owasp
```

### 2. Review Report
```bash
cat security-reports/latest-owasp-audit.md
```

### 3. Prioritize by Severity
1. 🚨 **Critical**: Fix immediately (within 24 hours)
2. ⚡ **High**: Fix within 1 week
3. 📋 **Medium**: Fix within 2 weeks
4. ℹ️  **Low**: Fix in next sprint

### 4. Implement Fixes
Address each finding based on recommendations

### 5. Re-run Audit
```bash
npm run security:owasp
```

### 6. Track Progress
Monitor compliance score improvement over time

---

## Best Practices

### 1. Regular Audits
- Run on every pull request
- Daily scans on main branch
- Weekly comprehensive reviews
- Before each release

### 2. Automated Remediation
```typescript
// Automated fixes in CI/CD
if (report.summary.criticalIssues === 0) {
  // Auto-approve PR
} else {
  // Block merge, notify security team
}
```

### 3. Continuous Monitoring
- Track compliance trends
- Set up alerts for regressions
- Review new findings weekly
- Archive historical reports

### 4. Team Training
- Share audit reports with team
- Conduct security training
- Document common issues
- Create remediation guides

---

## Common Patterns

### Pattern 1: Security Headers

```typescript
export function securityHeaders() {
  return {
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
  };
}
```

### Pattern 2: Input Validation

```typescript
import { z } from 'zod';

const userSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(12).max(128),
  username: z.string().regex(/^[a-zA-Z0-9_-]{3,20}$/)
});

// Validate
const result = userSchema.safeParse(input);
if (!result.success) {
  return error('Validation failed', result.error);
}
```

### Pattern 3: Safe Database Queries

```typescript
// Using Drizzle ORM
import { db } from './db';
import { users } from './schema';
import { eq } from 'drizzle-orm';

// Safe: Parameterized
const user = await db.select()
  .from(users)
  .where(eq(users.email, email))
  .limit(1);

// NEVER do this:
// const query = `SELECT * FROM users WHERE email='${email}'`;
```

---

## Resources

### OWASP Resources
- [OWASP Top 10 2021](https://owasp.org/Top10/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)

### CWE (Common Weakness Enumeration)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [CWE List](https://cwe.mitre.org/data/)

### Standards
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [PCI DSS](https://www.pcisecuritystandards.org/)
- [ISO 27001](https://www.iso.org/isoiec-27001-information-security.html)

---

## Summary

OWASP Top 10 compliance auditing helps identify and fix critical security vulnerabilities:

✅ **Automated checks** for all 10 categories
✅ **39 security checks** covering common vulnerabilities
✅ **CWE mapping** for vulnerability tracking
✅ **Compliance scoring** for progress monitoring
✅ **Actionable recommendations** for remediation
✅ **CI/CD integration** for continuous security
✅ **JSON/Markdown reports** for documentation

**Remember**: Security is an ongoing process, not a one-time event. Regular audits, continuous monitoring, and prompt remediation are key to maintaining a secure application.
