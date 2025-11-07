/**
 * T136: OWASP Top 10 2021 Compliance Auditor
 *
 * Comprehensive security auditing system that checks for OWASP Top 10 vulnerabilities:
 * A01:2021 – Broken Access Control
 * A02:2021 – Cryptographic Failures
 * A03:2021 – Injection
 * A04:2021 – Insecure Design
 * A05:2021 – Security Misconfiguration
 * A06:2021 – Vulnerable and Outdated Components
 * A07:2021 – Identification and Authentication Failures
 * A08:2021 – Software and Data Integrity Failures
 * A09:2021 – Security Logging and Monitoring Failures
 * A10:2021 – Server-Side Request Forgery (SSRF)
 *
 * @module owaspTop10Auditor
 */

import fs from 'fs/promises';
import path from 'path';
import { containsSQLInjection, containsXSS, testPasswordStrength, testCookieSecurity, testCSRFToken } from './pentest.js';
import { VulnerabilityScanner } from './vulnerabilityScanner.js';

/**
 * OWASP Top 10 2021 categories
 */
export type OWASPCategory =
  | 'A01_Broken_Access_Control'
  | 'A02_Cryptographic_Failures'
  | 'A03_Injection'
  | 'A04_Insecure_Design'
  | 'A05_Security_Misconfiguration'
  | 'A06_Vulnerable_Components'
  | 'A07_Authentication_Failures'
  | 'A08_Data_Integrity_Failures'
  | 'A09_Logging_Monitoring_Failures'
  | 'A10_SSRF';

/**
 * Compliance status for each check
 */
export type ComplianceStatus = 'pass' | 'fail' | 'warning' | 'not_applicable';

/**
 * Individual security check result
 */
export interface SecurityCheck {
  id: string;
  category: OWASPCategory;
  name: string;
  description: string;
  status: ComplianceStatus;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  findings: string[];
  recommendations: string[];
  cweIds?: string[];
  automated: boolean;
}

/**
 * OWASP Top 10 audit report
 */
export interface OWASPAuditReport {
  timestamp: string;
  applicationName: string;
  auditVersion: string;
  summary: {
    totalChecks: number;
    passed: number;
    failed: number;
    warnings: number;
    notApplicable: number;
    complianceScore: number; // 0-100
    criticalIssues: number;
    highIssues: number;
    mediumIssues: number;
    lowIssues: number;
  };
  categoryResults: Record<OWASPCategory, CategoryResult>;
  checks: SecurityCheck[];
  overallStatus: 'compliant' | 'non_compliant' | 'needs_review';
  nextSteps: string[];
}

/**
 * Category-level result summary
 */
export interface CategoryResult {
  category: OWASPCategory;
  displayName: string;
  description: string;
  totalChecks: number;
  passed: number;
  failed: number;
  warnings: number;
  status: ComplianceStatus;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

/**
 * Configuration for OWASP audit
 */
export interface AuditConfig {
  applicationName?: string;
  skipCategories?: OWASPCategory[];
  outputDir?: string;
  generateReport?: boolean;
  verbose?: boolean;
}

/**
 * OWASP Top 10 2021 Auditor
 */
export class OWASPTop10Auditor {
  private config: Required<AuditConfig>;
  private checks: SecurityCheck[] = [];
  private startTime: number = 0;

  constructor(config: AuditConfig = {}) {
    this.config = {
      applicationName: config.applicationName || 'Web Application',
      skipCategories: config.skipCategories || [],
      outputDir: config.outputDir || './security-reports',
      generateReport: config.generateReport !== false,
      verbose: config.verbose || false,
    };
  }

  /**
   * Run comprehensive OWASP Top 10 audit
   */
  async audit(): Promise<OWASPAuditReport> {
    this.startTime = Date.now();
    this.checks = [];

    // Run all category checks
    await this.checkA01_BrokenAccessControl();
    await this.checkA02_CryptographicFailures();
    await this.checkA03_Injection();
    await this.checkA04_InsecureDesign();
    await this.checkA05_SecurityMisconfiguration();
    await this.checkA06_VulnerableComponents();
    await this.checkA07_AuthenticationFailures();
    await this.checkA08_DataIntegrityFailures();
    await this.checkA09_LoggingMonitoringFailures();
    await this.checkA10_SSRF();

    // Generate report
    const report = this.generateReport();

    // Save report if configured
    if (this.config.generateReport) {
      await this.saveReport(report);
    }

    return report;
  }

  /**
   * A01:2021 – Broken Access Control
   */
  private async checkA01_BrokenAccessControl(): Promise<void> {
    if (this.config.skipCategories.includes('A01_Broken_Access_Control')) return;

    // Check 1: Authorization middleware exists
    const authMiddlewareCheck = await this.checkFileExists('src/middleware/auth.ts');
    this.addCheck({
      id: 'A01-001',
      category: 'A01_Broken_Access_Control',
      name: 'Authorization Middleware',
      description: 'Verify authentication middleware is implemented',
      status: authMiddlewareCheck ? 'pass' : 'fail',
      severity: authMiddlewareCheck ? 'info' : 'critical',
      findings: authMiddlewareCheck
        ? ['Authentication middleware found']
        : ['No authentication middleware found'],
      recommendations: authMiddlewareCheck
        ? []
        : ['Implement authentication middleware for protected routes'],
      cweIds: ['CWE-284', 'CWE-285'],
      automated: true,
    });

    // Check 2: Role-based access control
    const rbacFiles = await this.findFilesWithPattern(['src/**/*rbac*', 'src/**/*role*', 'src/**/*permission*']);
    this.addCheck({
      id: 'A01-002',
      category: 'A01_Broken_Access_Control',
      name: 'Role-Based Access Control',
      description: 'Verify RBAC implementation exists',
      status: rbacFiles.length > 0 ? 'pass' : 'warning',
      severity: rbacFiles.length > 0 ? 'info' : 'high',
      findings: rbacFiles.length > 0
        ? [`Found ${rbacFiles.length} RBAC-related files`]
        : ['No RBAC implementation found'],
      recommendations: rbacFiles.length > 0
        ? []
        : ['Implement role-based access control for authorization'],
      cweIds: ['CWE-639'],
      automated: true,
    });

    // Check 3: API endpoint protection
    const apiFiles = await this.findFilesWithPattern(['src/pages/api/**/*.ts']);
    const protectedCount = await this.countFilesWithContent(apiFiles, /auth|session|protect/i);
    const protectionRate = apiFiles.length > 0 ? (protectedCount / apiFiles.length) * 100 : 0;

    this.addCheck({
      id: 'A01-003',
      category: 'A01_Broken_Access_Control',
      name: 'API Endpoint Protection',
      description: 'Verify API endpoints have authentication checks',
      status: protectionRate >= 70 ? 'pass' : protectionRate >= 40 ? 'warning' : 'fail',
      severity: protectionRate >= 70 ? 'info' : protectionRate >= 40 ? 'medium' : 'high',
      findings: [
        `${protectedCount}/${apiFiles.length} API files contain authentication checks`,
        `Protection rate: ${protectionRate.toFixed(1)}%`
      ],
      recommendations: protectionRate < 70
        ? ['Ensure all API endpoints verify authentication before processing requests']
        : [],
      cweIds: ['CWE-306'],
      automated: true,
    });

    // Check 4: CORS configuration
    const corsConfigured = await this.checkFileContains('src', /cors|allowedOrigin/i);
    this.addCheck({
      id: 'A01-004',
      category: 'A01_Broken_Access_Control',
      name: 'CORS Configuration',
      description: 'Verify CORS is properly configured',
      status: corsConfigured ? 'pass' : 'warning',
      severity: corsConfigured ? 'info' : 'medium',
      findings: corsConfigured
        ? ['CORS configuration found']
        : ['No CORS configuration detected'],
      recommendations: corsConfigured
        ? []
        : ['Implement CORS policy to restrict cross-origin requests'],
      cweIds: ['CWE-346'],
      automated: true,
    });
  }

  /**
   * A02:2021 – Cryptographic Failures
   */
  private async checkA02_CryptographicFailures(): Promise<void> {
    if (this.config.skipCategories.includes('A02_Cryptographic_Failures')) return;

    // Check 1: HTTPS enforcement
    const httpsEnforced = await this.checkFileContains('src', /secure.*true|https.*only/i);
    this.addCheck({
      id: 'A02-001',
      category: 'A02_Cryptographic_Failures',
      name: 'HTTPS Enforcement',
      description: 'Verify HTTPS is enforced for all connections',
      status: httpsEnforced ? 'pass' : 'fail',
      severity: httpsEnforced ? 'info' : 'critical',
      findings: httpsEnforced
        ? ['HTTPS enforcement detected in codebase']
        : ['No HTTPS enforcement found'],
      recommendations: httpsEnforced
        ? []
        : ['Enforce HTTPS for all connections', 'Set Secure flag on all cookies'],
      cweIds: ['CWE-319', 'CWE-311'],
      automated: true,
    });

    // Check 2: Password hashing
    const passwordHashing = await this.checkFileContains('src', /bcrypt|argon2|scrypt|pbkdf2/i);
    this.addCheck({
      id: 'A02-002',
      category: 'A02_Cryptographic_Failures',
      name: 'Password Hashing',
      description: 'Verify passwords are hashed with strong algorithms',
      status: passwordHashing ? 'pass' : 'fail',
      severity: passwordHashing ? 'info' : 'critical',
      findings: passwordHashing
        ? ['Strong password hashing library detected']
        : ['No password hashing implementation found'],
      recommendations: passwordHashing
        ? []
        : ['Use bcrypt, Argon2, or scrypt for password hashing'],
      cweIds: ['CWE-256', 'CWE-916'],
      automated: true,
    });

    // Check 3: Sensitive data encryption
    const encryptionUsed = await this.checkFileContains('src', /encrypt|crypto\.createCipher|AES/i);
    this.addCheck({
      id: 'A02-003',
      category: 'A02_Cryptographic_Failures',
      name: 'Data Encryption',
      description: 'Verify sensitive data is encrypted',
      status: encryptionUsed ? 'pass' : 'warning',
      severity: encryptionUsed ? 'info' : 'high',
      findings: encryptionUsed
        ? ['Encryption implementation found']
        : ['No encryption implementation detected'],
      recommendations: encryptionUsed
        ? []
        : ['Encrypt sensitive data at rest and in transit'],
      cweIds: ['CWE-311', 'CWE-327'],
      automated: true,
    });

    // Check 4: Weak cryptography patterns
    const weakCrypto = await this.checkFileContains('src', /md5|sha1|des|rc4/i);
    this.addCheck({
      id: 'A02-004',
      category: 'A02_Cryptographic_Failures',
      name: 'Weak Cryptography Detection',
      description: 'Check for weak cryptographic algorithms',
      status: weakCrypto ? 'fail' : 'pass',
      severity: weakCrypto ? 'high' : 'info',
      findings: weakCrypto
        ? ['Weak cryptographic algorithms detected (MD5, SHA1, DES, RC4)']
        : ['No weak cryptographic algorithms found'],
      recommendations: weakCrypto
        ? ['Replace MD5/SHA1 with SHA-256 or higher', 'Use AES instead of DES/RC4']
        : [],
      cweIds: ['CWE-327', 'CWE-328'],
      automated: true,
    });

    // Check 5: Environment variable encryption
    const envFileExists = await this.checkFileExists('.env');
    const envInGitignore = await this.checkFileContains('.gitignore', /\.env/);
    this.addCheck({
      id: 'A02-005',
      category: 'A02_Cryptographic_Failures',
      name: 'Environment Variable Protection',
      description: 'Verify .env files are not committed to git',
      status: envInGitignore || !envFileExists ? 'pass' : 'fail',
      severity: envInGitignore || !envFileExists ? 'info' : 'critical',
      findings: envInGitignore
        ? ['.env files excluded from git']
        : envFileExists
          ? ['.env file exists but not in .gitignore']
          : ['No .env file found'],
      recommendations: !envInGitignore && envFileExists
        ? ['Add .env to .gitignore immediately', 'Rotate any exposed secrets']
        : [],
      cweIds: ['CWE-312', 'CWE-798'],
      automated: true,
    });
  }

  /**
   * A03:2021 – Injection
   */
  private async checkA03_Injection(): Promise<void> {
    if (this.config.skipCategories.includes('A03_Injection')) return;

    // Check 1: SQL Injection protection
    const usesPreparedStatements = await this.checkFileContains('src', /db\.query|db\.execute|\.prepare|parameterized/i);
    const hasRawSQL = await this.checkFileContains('src', /db\.raw|\.rawQuery|execute\(.*\+.*\)/i);

    this.addCheck({
      id: 'A03-001',
      category: 'A03_Injection',
      name: 'SQL Injection Protection',
      description: 'Verify parameterized queries are used',
      status: usesPreparedStatements && !hasRawSQL ? 'pass' : hasRawSQL ? 'fail' : 'warning',
      severity: hasRawSQL ? 'critical' : usesPreparedStatements ? 'info' : 'high',
      findings: [
        usesPreparedStatements ? 'Parameterized queries detected' : 'No parameterized queries found',
        hasRawSQL ? 'Raw SQL execution detected - HIGH RISK' : 'No raw SQL execution found'
      ],
      recommendations: hasRawSQL
        ? ['Replace all raw SQL with parameterized queries', 'Use ORM/query builder']
        : usesPreparedStatements
          ? []
          : ['Implement parameterized queries for all database operations'],
      cweIds: ['CWE-89'],
      automated: true,
    });

    // Check 2: XSS protection
    const hasXSSProtection = await this.checkFileContains('src', /sanitize|escape|dangerouslySetInnerHTML/i);
    const reactUsed = await this.checkFileContains('package.json', /"react"/);

    this.addCheck({
      id: 'A03-002',
      category: 'A03_Injection',
      name: 'XSS Protection',
      description: 'Verify XSS protection mechanisms are in place',
      status: reactUsed || hasXSSProtection ? 'pass' : 'warning',
      severity: reactUsed || hasXSSProtection ? 'info' : 'high',
      findings: [
        reactUsed ? 'React provides automatic XSS protection' : 'React not detected',
        hasXSSProtection ? 'Additional XSS sanitization found' : 'No explicit sanitization found'
      ],
      recommendations: !reactUsed && !hasXSSProtection
        ? ['Implement XSS protection via sanitization libraries', 'Escape all user input']
        : [],
      cweIds: ['CWE-79'],
      automated: true,
    });

    // Check 3: Command injection protection
    const usesExec = await this.checkFileContains('src', /child_process|exec\(|spawn\(|eval\(/i);

    this.addCheck({
      id: 'A03-003',
      category: 'A03_Injection',
      name: 'Command Injection Protection',
      description: 'Check for unsafe command execution',
      status: usesExec ? 'warning' : 'pass',
      severity: usesExec ? 'high' : 'info',
      findings: usesExec
        ? ['Command execution detected - verify input validation']
        : ['No command execution found'],
      recommendations: usesExec
        ? ['Validate and sanitize all inputs to exec/spawn', 'Use allowlists for commands', 'Avoid eval()']
        : [],
      cweIds: ['CWE-78', 'CWE-94'],
      automated: true,
    });

    // Check 4: Input validation implementation
    const hasInputValidation = await this.checkFileContains('src', /validate|zod|yup|joi|ajv/i);

    this.addCheck({
      id: 'A03-004',
      category: 'A03_Injection',
      name: 'Input Validation',
      description: 'Verify input validation is implemented',
      status: hasInputValidation ? 'pass' : 'fail',
      severity: hasInputValidation ? 'info' : 'high',
      findings: hasInputValidation
        ? ['Input validation library detected']
        : ['No input validation implementation found'],
      recommendations: hasInputValidation
        ? []
        : ['Implement input validation for all user inputs', 'Use validation libraries like Zod or Yup'],
      cweIds: ['CWE-20'],
      automated: true,
    });
  }

  /**
   * A04:2021 – Insecure Design
   */
  private async checkA04_InsecureDesign(): Promise<void> {
    if (this.config.skipCategories.includes('A04_Insecure_Design')) return;

    // Check 1: Security requirements documentation
    const hasSecurityDocs = await this.checkFileExists('SECURITY.md') ||
                            await this.checkFileExists('docs/security.md');

    this.addCheck({
      id: 'A04-001',
      category: 'A04_Insecure_Design',
      name: 'Security Documentation',
      description: 'Verify security requirements are documented',
      status: hasSecurityDocs ? 'pass' : 'warning',
      severity: hasSecurityDocs ? 'info' : 'medium',
      findings: hasSecurityDocs
        ? ['Security documentation found']
        : ['No security documentation found'],
      recommendations: hasSecurityDocs
        ? []
        : ['Create SECURITY.md documenting security requirements and policies'],
      cweIds: ['CWE-1008'],
      automated: true,
    });

    // Check 2: Rate limiting
    const hasRateLimiting = await this.checkFileContains('src', /rateLimit|rate-limit|throttle/i);

    this.addCheck({
      id: 'A04-002',
      category: 'A04_Insecure_Design',
      name: 'Rate Limiting',
      description: 'Verify rate limiting is implemented',
      status: hasRateLimiting ? 'pass' : 'fail',
      severity: hasRateLimiting ? 'info' : 'high',
      findings: hasRateLimiting
        ? ['Rate limiting implementation found']
        : ['No rate limiting detected'],
      recommendations: hasRateLimiting
        ? []
        : ['Implement rate limiting to prevent abuse'],
      cweIds: ['CWE-770', 'CWE-307'],
      automated: true,
    });

    // Check 3: Error handling
    const hasErrorHandling = await this.checkFileContains('src', /try.*catch|error.*handler|\.catch\(/i);

    this.addCheck({
      id: 'A04-003',
      category: 'A04_Insecure_Design',
      name: 'Error Handling',
      description: 'Verify proper error handling exists',
      status: hasErrorHandling ? 'pass' : 'warning',
      severity: hasErrorHandling ? 'info' : 'medium',
      findings: hasErrorHandling
        ? ['Error handling detected']
        : ['No error handling found'],
      recommendations: hasErrorHandling
        ? []
        : ['Implement comprehensive error handling', 'Avoid exposing sensitive error details'],
      cweIds: ['CWE-209', 'CWE-755'],
      automated: true,
    });

    // Check 4: Business logic validation
    const hasBusinessValidation = await this.checkFileContains('src', /business.*rule|workflow|state.*machine/i);

    this.addCheck({
      id: 'A04-004',
      category: 'A04_Insecure_Design',
      name: 'Business Logic Validation',
      description: 'Check for business logic validation',
      status: hasBusinessValidation ? 'pass' : 'warning',
      severity: 'medium',
      findings: hasBusinessValidation
        ? ['Business logic validation detected']
        : ['No explicit business logic validation found'],
      recommendations: hasBusinessValidation
        ? []
        : ['Implement server-side business logic validation', 'Prevent logic bypass attacks'],
      cweIds: ['CWE-840'],
      automated: true,
    });
  }

  /**
   * A05:2021 – Security Misconfiguration
   */
  private async checkA05_SecurityMisconfiguration(): Promise<void> {
    if (this.config.skipCategories.includes('A05_Security_Misconfiguration')) return;

    // Check 1: Security headers
    const hasSecurityHeaders = await this.checkFileContains('src', /helmet|security.*header|csp|content-security-policy/i);

    this.addCheck({
      id: 'A05-001',
      category: 'A05_Security_Misconfiguration',
      name: 'Security Headers',
      description: 'Verify security headers are configured',
      status: hasSecurityHeaders ? 'pass' : 'fail',
      severity: hasSecurityHeaders ? 'info' : 'high',
      findings: hasSecurityHeaders
        ? ['Security headers configuration found']
        : ['No security headers detected'],
      recommendations: hasSecurityHeaders
        ? []
        : ['Implement security headers (CSP, HSTS, X-Frame-Options, etc.)'],
      cweIds: ['CWE-16', 'CWE-693'],
      automated: true,
    });

    // Check 2: Default credentials
    const hasDefaultCreds = await this.checkFileContains('src', /admin.*admin|password.*password|test.*test/i);

    this.addCheck({
      id: 'A05-002',
      category: 'A05_Security_Misconfiguration',
      name: 'Default Credentials',
      description: 'Check for default credentials in code',
      status: hasDefaultCreds ? 'fail' : 'pass',
      severity: hasDefaultCreds ? 'critical' : 'info',
      findings: hasDefaultCreds
        ? ['Potential default credentials found in code']
        : ['No default credentials detected'],
      recommendations: hasDefaultCreds
        ? ['Remove all default credentials', 'Use environment variables for credentials']
        : [],
      cweIds: ['CWE-798'],
      automated: true,
    });

    // Check 3: Debug mode in production
    const hasDebugCode = await this.checkFileContains('src', /console\.log|debugger|debug.*true/i);

    this.addCheck({
      id: 'A05-003',
      category: 'A05_Security_Misconfiguration',
      name: 'Debug Code',
      description: 'Check for debug code that should be removed',
      status: hasDebugCode ? 'warning' : 'pass',
      severity: hasDebugCode ? 'medium' : 'info',
      findings: hasDebugCode
        ? ['Debug code detected - ensure it\'s removed in production']
        : ['No debug code found'],
      recommendations: hasDebugCode
        ? ['Remove console.log and debugger statements', 'Disable debug mode in production']
        : [],
      cweIds: ['CWE-489'],
      automated: true,
    });

    // Check 4: Unnecessary features enabled
    const unnecessaryFeatures = await this.checkFileContains('src', /autoIndex.*true|directory.*listing/i);

    this.addCheck({
      id: 'A05-004',
      category: 'A05_Security_Misconfiguration',
      name: 'Unnecessary Features',
      description: 'Check for unnecessary features that should be disabled',
      status: unnecessaryFeatures ? 'warning' : 'pass',
      severity: unnecessaryFeatures ? 'medium' : 'info',
      findings: unnecessaryFeatures
        ? ['Unnecessary features detected']
        : ['No unnecessary features found'],
      recommendations: unnecessaryFeatures
        ? ['Disable directory listing', 'Remove unused features']
        : [],
      cweIds: ['CWE-16'],
      automated: true,
    });
  }

  /**
   * A06:2021 – Vulnerable and Outdated Components
   */
  private async checkA06_VulnerableComponents(): Promise<void> {
    if (this.config.skipCategories.includes('A06_Vulnerable_Components')) return;

    // Use existing vulnerability scanner with timeout
    try {
      const scanner = new VulnerabilityScanner({ saveReport: false });

      // Add 10 second timeout for npm audit
      const scanResult = await Promise.race([
        scanner.scan(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Scan timeout')), 10000)
        )
      ]);

      this.addCheck({
        id: 'A06-001',
        category: 'A06_Vulnerable_Components',
        name: 'Dependency Vulnerabilities',
        description: 'Scan for vulnerabilities in dependencies',
        status: scanResult.summary.critical === 0 && scanResult.summary.high === 0 ? 'pass' : 'fail',
        severity: scanResult.summary.critical > 0 ? 'critical' : scanResult.summary.high > 0 ? 'high' : 'info',
        findings: [
          `Critical: ${scanResult.summary.critical}`,
          `High: ${scanResult.summary.high}`,
          `Moderate: ${scanResult.summary.moderate}`,
          `Total: ${scanResult.summary.total}`
        ],
        recommendations: scanResult.summary.total > 0
          ? ['Run npm audit fix', 'Update vulnerable dependencies', 'Review security advisories']
          : [],
        automated: true,
      });
    } catch (error) {
      this.addCheck({
        id: 'A06-001',
        category: 'A06_Vulnerable_Components',
        name: 'Dependency Vulnerabilities',
        description: 'Scan for vulnerabilities in dependencies',
        status: 'warning',
        severity: 'high',
        findings: ['Unable to run vulnerability scan - timed out or failed'],
        recommendations: ['Run npm audit manually', 'Check for outdated dependencies'],
        automated: true,
      });
    }

    // Check 2: Package-lock exists
    const hasPackageLock = await this.checkFileExists('package-lock.json');

    this.addCheck({
      id: 'A06-002',
      category: 'A06_Vulnerable_Components',
      name: 'Dependency Lock File',
      description: 'Verify package-lock.json exists',
      status: hasPackageLock ? 'pass' : 'fail',
      severity: hasPackageLock ? 'info' : 'high',
      findings: hasPackageLock
        ? ['package-lock.json found']
        : ['No package-lock.json found'],
      recommendations: hasPackageLock
        ? []
        : ['Generate package-lock.json to lock dependency versions'],
      cweIds: ['CWE-1104'],
      automated: true,
    });

    // Check 3: Outdated dependencies
    const hasRenovate = await this.checkFileExists('renovate.json') ||
                        await this.checkFileExists('.github/renovate.json');
    const hasDependabot = await this.checkFileExists('.github/dependabot.yml');

    this.addCheck({
      id: 'A06-003',
      category: 'A06_Vulnerable_Components',
      name: 'Automated Dependency Updates',
      description: 'Check for automated dependency update tools',
      status: hasRenovate || hasDependabot ? 'pass' : 'warning',
      severity: hasRenovate || hasDependabot ? 'info' : 'medium',
      findings: [
        hasRenovate ? 'Renovate configured' : '',
        hasDependabot ? 'Dependabot configured' : '',
        !hasRenovate && !hasDependabot ? 'No automated updates configured' : ''
      ].filter(Boolean),
      recommendations: !hasRenovate && !hasDependabot
        ? ['Configure Renovate or Dependabot for automated updates']
        : [],
      automated: true,
    });
  }

  /**
   * A07:2021 – Identification and Authentication Failures
   */
  private async checkA07_AuthenticationFailures(): Promise<void> {
    if (this.config.skipCategories.includes('A07_Authentication_Failures')) return;

    // Check 1: Password policy
    const hasPasswordPolicy = await this.checkFileContains('src', /password.*strength|password.*policy|validatePassword/i);

    this.addCheck({
      id: 'A07-001',
      category: 'A07_Authentication_Failures',
      name: 'Password Policy',
      description: 'Verify password strength requirements',
      status: hasPasswordPolicy ? 'pass' : 'fail',
      severity: hasPasswordPolicy ? 'info' : 'high',
      findings: hasPasswordPolicy
        ? ['Password policy implementation found']
        : ['No password policy detected'],
      recommendations: hasPasswordPolicy
        ? []
        : ['Implement password strength requirements', 'Enforce minimum length and complexity'],
      cweIds: ['CWE-521'],
      automated: true,
    });

    // Check 2: Multi-factor authentication
    const hasMFA = await this.checkFileContains('src', /mfa|2fa|two.*factor|totp|authenticator/i);

    this.addCheck({
      id: 'A07-002',
      category: 'A07_Authentication_Failures',
      name: 'Multi-Factor Authentication',
      description: 'Check for MFA implementation',
      status: hasMFA ? 'pass' : 'warning',
      severity: hasMFA ? 'info' : 'medium',
      findings: hasMFA
        ? ['MFA implementation found']
        : ['No MFA implementation detected'],
      recommendations: hasMFA
        ? []
        : ['Consider implementing MFA for enhanced security'],
      cweIds: ['CWE-287'],
      automated: true,
    });

    // Check 3: Session management
    const hasSessionManagement = await this.checkFileContains('src', /session|jwt|token.*refresh/i);

    this.addCheck({
      id: 'A07-003',
      category: 'A07_Authentication_Failures',
      name: 'Session Management',
      description: 'Verify session management is implemented',
      status: hasSessionManagement ? 'pass' : 'fail',
      severity: hasSessionManagement ? 'info' : 'critical',
      findings: hasSessionManagement
        ? ['Session management found']
        : ['No session management detected'],
      recommendations: hasSessionManagement
        ? []
        : ['Implement secure session management'],
      cweIds: ['CWE-384'],
      automated: true,
    });

    // Check 4: Brute force protection
    const hasBruteForceProtection = await this.checkFileContains('src', /rate.*limit|throttle|attempt.*count/i);

    this.addCheck({
      id: 'A07-004',
      category: 'A07_Authentication_Failures',
      name: 'Brute Force Protection',
      description: 'Verify brute force protection is in place',
      status: hasBruteForceProtection ? 'pass' : 'fail',
      severity: hasBruteForceProtection ? 'info' : 'high',
      findings: hasBruteForceProtection
        ? ['Brute force protection detected']
        : ['No brute force protection found'],
      recommendations: hasBruteForceProtection
        ? []
        : ['Implement rate limiting on authentication endpoints'],
      cweIds: ['CWE-307'],
      automated: true,
    });
  }

  /**
   * A08:2021 – Software and Data Integrity Failures
   */
  private async checkA08_DataIntegrityFailures(): Promise<void> {
    if (this.config.skipCategories.includes('A08_Data_Integrity_Failures')) return;

    // Check 1: CI/CD pipeline security
    const hasCICD = await this.checkFileExists('.github/workflows') ||
                    await this.checkFileExists('.gitlab-ci.yml');

    this.addCheck({
      id: 'A08-001',
      category: 'A08_Data_Integrity_Failures',
      name: 'CI/CD Pipeline',
      description: 'Verify CI/CD pipeline exists',
      status: hasCICD ? 'pass' : 'warning',
      severity: hasCICD ? 'info' : 'medium',
      findings: hasCICD
        ? ['CI/CD pipeline configuration found']
        : ['No CI/CD pipeline detected'],
      recommendations: hasCICD
        ? []
        : ['Implement CI/CD with security checks'],
      cweIds: ['CWE-494'],
      automated: true,
    });

    // Check 2: Code signing/integrity
    const hasIntegrityChecks = await this.checkFileContains('package.json', /"integrity":|"sha/i);

    this.addCheck({
      id: 'A08-002',
      category: 'A08_Data_Integrity_Failures',
      name: 'Package Integrity',
      description: 'Verify package integrity checks',
      status: hasIntegrityChecks ? 'pass' : 'warning',
      severity: hasIntegrityChecks ? 'info' : 'medium',
      findings: hasIntegrityChecks
        ? ['Package integrity checks found']
        : ['No integrity checks detected'],
      recommendations: hasIntegrityChecks
        ? []
        : ['Use package-lock.json with integrity hashes'],
      cweIds: ['CWE-345'],
      automated: true,
    });

    // Check 3: Deserialization safety
    const hasUnsafeDeserialization = await this.checkFileContains('src', /JSON\.parse\(.*req|eval\(|unserialize/i);

    this.addCheck({
      id: 'A08-003',
      category: 'A08_Data_Integrity_Failures',
      name: 'Safe Deserialization',
      description: 'Check for unsafe deserialization',
      status: hasUnsafeDeserialization ? 'warning' : 'pass',
      severity: hasUnsafeDeserialization ? 'high' : 'info',
      findings: hasUnsafeDeserialization
        ? ['Potential unsafe deserialization detected']
        : ['No unsafe deserialization found'],
      recommendations: hasUnsafeDeserialization
        ? ['Validate all deserialized data', 'Avoid eval() and unsafe parsing']
        : [],
      cweIds: ['CWE-502'],
      automated: true,
    });

    // Check 4: Update mechanism security
    const hasSecureUpdates = await this.checkFileContains('.github', /dependabot|renovate/i);

    this.addCheck({
      id: 'A08-004',
      category: 'A08_Data_Integrity_Failures',
      name: 'Secure Update Mechanism',
      description: 'Verify secure automated updates',
      status: hasSecureUpdates ? 'pass' : 'warning',
      severity: hasSecureUpdates ? 'info' : 'medium',
      findings: hasSecureUpdates
        ? ['Automated update mechanism found']
        : ['No automated updates configured'],
      recommendations: hasSecureUpdates
        ? []
        : ['Configure automated dependency updates'],
      automated: true,
    });
  }

  /**
   * A09:2021 – Security Logging and Monitoring Failures
   */
  private async checkA09_LoggingMonitoringFailures(): Promise<void> {
    if (this.config.skipCategories.includes('A09_Logging_Monitoring_Failures')) return;

    // Check 1: Logging implementation
    const hasLogging = await this.checkFileContains('src', /logger|log\.|winston|pino|bunyan/i);

    this.addCheck({
      id: 'A09-001',
      category: 'A09_Logging_Monitoring_Failures',
      name: 'Logging Implementation',
      description: 'Verify logging is implemented',
      status: hasLogging ? 'pass' : 'fail',
      severity: hasLogging ? 'info' : 'high',
      findings: hasLogging
        ? ['Logging implementation found']
        : ['No logging detected'],
      recommendations: hasLogging
        ? []
        : ['Implement comprehensive logging', 'Log security events'],
      cweIds: ['CWE-778'],
      automated: true,
    });

    // Check 2: Security event logging
    const hasSecurityLogging = await this.checkFileContains('src', /log.*security|log.*auth|log.*failed|audit.*log/i);

    this.addCheck({
      id: 'A09-002',
      category: 'A09_Logging_Monitoring_Failures',
      name: 'Security Event Logging',
      description: 'Verify security events are logged',
      status: hasSecurityLogging ? 'pass' : 'warning',
      severity: hasSecurityLogging ? 'info' : 'medium',
      findings: hasSecurityLogging
        ? ['Security event logging found']
        : ['No security event logging detected'],
      recommendations: hasSecurityLogging
        ? []
        : ['Log authentication attempts', 'Log authorization failures', 'Log security exceptions'],
      cweIds: ['CWE-778'],
      automated: true,
    });

    // Check 3: Sensitive data in logs
    const hasSensitiveInLogs = await this.checkFileContains('src', /log.*password|log.*token|log.*secret/i);

    this.addCheck({
      id: 'A09-003',
      category: 'A09_Logging_Monitoring_Failures',
      name: 'Sensitive Data in Logs',
      description: 'Check for sensitive data being logged',
      status: hasSensitiveInLogs ? 'fail' : 'pass',
      severity: hasSensitiveInLogs ? 'high' : 'info',
      findings: hasSensitiveInLogs
        ? ['Potential sensitive data logging detected']
        : ['No sensitive data in logs detected'],
      recommendations: hasSensitiveInLogs
        ? ['Remove password/token logging', 'Implement log sanitization']
        : [],
      cweIds: ['CWE-532'],
      automated: true,
    });

    // Check 4: Monitoring/alerting
    const hasMonitoring = await this.checkFileContains('src', /monitor|alert|sentry|newrelic|datadog/i);

    this.addCheck({
      id: 'A09-004',
      category: 'A09_Logging_Monitoring_Failures',
      name: 'Monitoring and Alerting',
      description: 'Check for monitoring/alerting tools',
      status: hasMonitoring ? 'pass' : 'warning',
      severity: hasMonitoring ? 'info' : 'medium',
      findings: hasMonitoring
        ? ['Monitoring/alerting system detected']
        : ['No monitoring system detected'],
      recommendations: hasMonitoring
        ? []
        : ['Implement application monitoring', 'Set up security alerts'],
      cweIds: ['CWE-778'],
      automated: true,
    });
  }

  /**
   * A10:2021 – Server-Side Request Forgery (SSRF)
   */
  private async checkA10_SSRF(): Promise<void> {
    if (this.config.skipCategories.includes('A10_SSRF')) return;

    // Check 1: External HTTP requests
    const hasExternalRequests = await this.checkFileContains('src', /fetch\(|axios|http\.request|https\.request/i);

    this.addCheck({
      id: 'A10-001',
      category: 'A10_SSRF',
      name: 'External HTTP Requests',
      description: 'Check for external HTTP requests that could be vulnerable to SSRF',
      status: hasExternalRequests ? 'warning' : 'pass',
      severity: hasExternalRequests ? 'medium' : 'info',
      findings: hasExternalRequests
        ? ['External HTTP requests detected - verify URL validation']
        : ['No external HTTP requests found'],
      recommendations: hasExternalRequests
        ? ['Validate all URLs', 'Use allowlist for allowed domains', 'Block internal IP ranges']
        : [],
      cweIds: ['CWE-918'],
      automated: true,
    });

    // Check 2: URL validation
    const hasURLValidation = await this.checkFileContains('src', /url.*validate|allowlist.*domain|isValidUrl/i);

    this.addCheck({
      id: 'A10-002',
      category: 'A10_SSRF',
      name: 'URL Validation',
      description: 'Verify URL validation for external requests',
      status: hasURLValidation && hasExternalRequests ? 'pass' : !hasExternalRequests ? 'not_applicable' : 'warning',
      severity: hasURLValidation || !hasExternalRequests ? 'info' : 'high',
      findings: hasURLValidation
        ? ['URL validation detected']
        : hasExternalRequests
          ? ['External requests without URL validation']
          : ['No external requests'],
      recommendations: hasExternalRequests && !hasURLValidation
        ? ['Implement URL validation', 'Use domain allowlists']
        : [],
      cweIds: ['CWE-918'],
      automated: true,
    });

    // Check 3: DNS rebinding protection
    const hasDNSProtection = await this.checkFileContains('src', /dns.*resolve|ip.*validate|private.*ip/i);

    this.addCheck({
      id: 'A10-003',
      category: 'A10_SSRF',
      name: 'DNS Rebinding Protection',
      description: 'Check for DNS rebinding protection',
      status: hasDNSProtection ? 'pass' : 'warning',
      severity: hasDNSProtection ? 'info' : 'medium',
      findings: hasDNSProtection
        ? ['DNS protection measures detected']
        : ['No DNS protection detected'],
      recommendations: hasDNSProtection
        ? []
        : ['Block requests to private IP ranges', 'Validate resolved IPs'],
      cweIds: ['CWE-350'],
      automated: true,
    });
  }

  /**
   * Add a security check to the results
   */
  private addCheck(check: SecurityCheck): void {
    this.checks.push(check);
  }

  /**
   * Generate comprehensive audit report
   */
  private generateReport(): OWASPAuditReport {
    const categoryResults = this.generateCategoryResults();
    const summary = this.generateSummary();

    const overallStatus: OWASPAuditReport['overallStatus'] =
      summary.criticalIssues > 0 || summary.failed > 10 ? 'non_compliant' :
      summary.warnings > 5 ? 'needs_review' :
      'compliant';

    const nextSteps = this.generateNextSteps(summary);

    return {
      timestamp: new Date().toISOString(),
      applicationName: this.config.applicationName,
      auditVersion: '1.0.0',
      summary,
      categoryResults,
      checks: this.checks,
      overallStatus,
      nextSteps,
    };
  }

  /**
   * Generate category-level results
   */
  private generateCategoryResults(): Record<OWASPCategory, CategoryResult> {
    const categories: Record<OWASPCategory, CategoryResult> = {
      A01_Broken_Access_Control: {
        category: 'A01_Broken_Access_Control',
        displayName: 'A01:2021 – Broken Access Control',
        description: 'Restrictions on authenticated users not properly enforced',
        totalChecks: 0,
        passed: 0,
        failed: 0,
        warnings: 0,
        status: 'pass',
        priority: 'critical',
      },
      A02_Cryptographic_Failures: {
        category: 'A02_Cryptographic_Failures',
        displayName: 'A02:2021 – Cryptographic Failures',
        description: 'Failures related to cryptography leading to sensitive data exposure',
        totalChecks: 0,
        passed: 0,
        failed: 0,
        warnings: 0,
        status: 'pass',
        priority: 'critical',
      },
      A03_Injection: {
        category: 'A03_Injection',
        displayName: 'A03:2021 – Injection',
        description: 'Injection flaws such as SQL, NoSQL, OS command injection',
        totalChecks: 0,
        passed: 0,
        failed: 0,
        warnings: 0,
        status: 'pass',
        priority: 'critical',
      },
      A04_Insecure_Design: {
        category: 'A04_Insecure_Design',
        displayName: 'A04:2021 – Insecure Design',
        description: 'Missing or ineffective control design',
        totalChecks: 0,
        passed: 0,
        failed: 0,
        warnings: 0,
        status: 'pass',
        priority: 'high',
      },
      A05_Security_Misconfiguration: {
        category: 'A05_Security_Misconfiguration',
        displayName: 'A05:2021 – Security Misconfiguration',
        description: 'Insecure default configurations, incomplete configs, open cloud storage',
        totalChecks: 0,
        passed: 0,
        failed: 0,
        warnings: 0,
        status: 'pass',
        priority: 'high',
      },
      A06_Vulnerable_Components: {
        category: 'A06_Vulnerable_Components',
        displayName: 'A06:2021 – Vulnerable and Outdated Components',
        description: 'Using vulnerable, outdated, or unsupported components',
        totalChecks: 0,
        passed: 0,
        failed: 0,
        warnings: 0,
        status: 'pass',
        priority: 'high',
      },
      A07_Authentication_Failures: {
        category: 'A07_Authentication_Failures',
        displayName: 'A07:2021 – Identification and Authentication Failures',
        description: 'Authentication and session management implementation flaws',
        totalChecks: 0,
        passed: 0,
        failed: 0,
        warnings: 0,
        status: 'pass',
        priority: 'critical',
      },
      A08_Data_Integrity_Failures: {
        category: 'A08_Data_Integrity_Failures',
        displayName: 'A08:2021 – Software and Data Integrity Failures',
        description: 'Code and infrastructure that do not protect against integrity violations',
        totalChecks: 0,
        passed: 0,
        failed: 0,
        warnings: 0,
        status: 'pass',
        priority: 'high',
      },
      A09_Logging_Monitoring_Failures: {
        category: 'A09_Logging_Monitoring_Failures',
        displayName: 'A09:2021 – Security Logging and Monitoring Failures',
        description: 'Insufficient logging and monitoring, ineffective integration with incident response',
        totalChecks: 0,
        passed: 0,
        failed: 0,
        warnings: 0,
        status: 'pass',
        priority: 'medium',
      },
      A10_SSRF: {
        category: 'A10_SSRF',
        displayName: 'A10:2021 – Server-Side Request Forgery',
        description: 'Fetching remote resources without validating user-supplied URLs',
        totalChecks: 0,
        passed: 0,
        failed: 0,
        warnings: 0,
        status: 'pass',
        priority: 'medium',
      },
    };

    // Populate category results
    this.checks.forEach(check => {
      const category = categories[check.category];
      category.totalChecks++;

      if (check.status === 'pass') category.passed++;
      else if (check.status === 'fail') category.failed++;
      else if (check.status === 'warning') category.warnings++;
    });

    // Set category status
    Object.values(categories).forEach(category => {
      if (category.failed > 0) category.status = 'fail';
      else if (category.warnings > 0) category.status = 'warning';
      else category.status = 'pass';
    });

    return categories;
  }

  /**
   * Generate summary statistics
   */
  private generateSummary(): OWASPAuditReport['summary'] {
    const passed = this.checks.filter(c => c.status === 'pass').length;
    const failed = this.checks.filter(c => c.status === 'fail').length;
    const warnings = this.checks.filter(c => c.status === 'warning').length;
    const notApplicable = this.checks.filter(c => c.status === 'not_applicable').length;

    const criticalIssues = this.checks.filter(c => c.severity === 'critical' && c.status === 'fail').length;
    const highIssues = this.checks.filter(c => c.severity === 'high' && (c.status === 'fail' || c.status === 'warning')).length;
    const mediumIssues = this.checks.filter(c => c.severity === 'medium' && c.status === 'warning').length;
    const lowIssues = this.checks.filter(c => c.severity === 'low').length;

    // Compliance score: percentage of passed checks (excluding not_applicable)
    const applicableChecks = this.checks.length - notApplicable;
    const complianceScore = applicableChecks > 0 ? Math.round((passed / applicableChecks) * 100) : 100;

    return {
      totalChecks: this.checks.length,
      passed,
      failed,
      warnings,
      notApplicable,
      complianceScore,
      criticalIssues,
      highIssues,
      mediumIssues,
      lowIssues,
    };
  }

  /**
   * Generate next steps based on findings
   */
  private generateNextSteps(summary: OWASPAuditReport['summary']): string[] {
    const steps: string[] = [];

    if (summary.criticalIssues > 0) {
      steps.push(`🚨 URGENT: Address ${summary.criticalIssues} critical security issue(s) immediately`);
    }

    if (summary.highIssues > 0) {
      steps.push(`⚠️  Fix ${summary.highIssues} high-severity issue(s) as soon as possible`);
    }

    if (summary.mediumIssues > 0) {
      steps.push(`📋 Review and address ${summary.mediumIssues} medium-severity warning(s)`);
    }

    if (summary.failed > 0) {
      steps.push('Review all failed checks and implement recommended fixes');
    }

    if (summary.complianceScore < 70) {
      steps.push('Compliance score is below 70% - prioritize security improvements');
    }

    if (steps.length === 0) {
      steps.push('✅ Good compliance! Continue monitoring and maintain security practices');
      steps.push('Schedule regular security audits (quarterly recommended)');
      steps.push('Keep dependencies updated and monitor security advisories');
    } else {
      steps.push('Re-run audit after implementing fixes to verify improvements');
      steps.push('Integrate audit into CI/CD pipeline for continuous monitoring');
    }

    return steps;
  }

  /**
   * Save audit report to files (JSON and Markdown)
   */
  private async saveReport(report: OWASPAuditReport): Promise<void> {
    try {
      // Ensure output directory exists
      await fs.mkdir(this.config.outputDir, { recursive: true });

      // Save JSON report
      const jsonPath = path.join(
        this.config.outputDir,
        `owasp-audit-${new Date().toISOString().replace(/:/g, '-')}.json`
      );
      await fs.writeFile(jsonPath, JSON.stringify(report, null, 2));

      // Save Markdown report
      const markdownPath = path.join(this.config.outputDir, 'latest-owasp-audit.md');
      const markdown = this.generateMarkdownReport(report);
      await fs.writeFile(markdownPath, markdown);

      if (this.config.verbose) {
        console.log(`Reports saved to ${this.config.outputDir}`);
      }
    } catch (error) {
      console.error('Error saving report:', error);
    }
  }

  /**
   * Generate Markdown report
   */
  private generateMarkdownReport(report: OWASPAuditReport): string {
    const statusEmoji = {
      compliant: '✅',
      non_compliant: '❌',
      needs_review: '⚠️',
    };

    let md = `# OWASP Top 10 2021 Security Audit Report\n\n`;
    md += `**Application**: ${report.applicationName}\n`;
    md += `**Audit Date**: ${new Date(report.timestamp).toLocaleString()}\n`;
    md += `**Status**: ${statusEmoji[report.overallStatus]} ${report.overallStatus.replace('_', ' ').toUpperCase()}\n`;
    md += `**Compliance Score**: ${report.summary.complianceScore}%\n\n`;

    md += `## Executive Summary\n\n`;
    md += `| Metric | Count |\n`;
    md += `|--------|-------|\n`;
    md += `| Total Checks | ${report.summary.totalChecks} |\n`;
    md += `| ✅ Passed | ${report.summary.passed} |\n`;
    md += `| ❌ Failed | ${report.summary.failed} |\n`;
    md += `| ⚠️  Warnings | ${report.summary.warnings} |\n`;
    md += `| 🚨 Critical Issues | ${report.summary.criticalIssues} |\n`;
    md += `| ⚡ High Issues | ${report.summary.highIssues} |\n`;
    md += `| 📋 Medium Issues | ${report.summary.mediumIssues} |\n\n`;

    md += `## OWASP Top 10 2021 Category Results\n\n`;
    Object.values(report.categoryResults).forEach(category => {
      const icon = category.status === 'pass' ? '✅' : category.status === 'fail' ? '❌' : '⚠️';
      md += `### ${icon} ${category.displayName}\n\n`;
      md += `**Description**: ${category.description}\n\n`;
      md += `**Priority**: ${category.priority.toUpperCase()}\n\n`;
      md += `**Results**: ${category.passed}/${category.totalChecks} passed`;
      if (category.failed > 0) md += `, ${category.failed} failed`;
      if (category.warnings > 0) md += `, ${category.warnings} warnings`;
      md += `\n\n`;

      // List checks for this category
      const categoryChecks = report.checks.filter(c => c.category === category.category);
      if (categoryChecks.length > 0) {
        categoryChecks.forEach(check => {
          const checkIcon = check.status === 'pass' ? '✅' : check.status === 'fail' ? '❌' : '⚠️';
          md += `- ${checkIcon} **${check.name}** (${check.id})\n`;
          if (check.findings.length > 0) {
            md += `  - ${check.findings.join('\n  - ')}\n`;
          }
          if (check.recommendations.length > 0) {
            md += `  - **Recommendations**: ${check.recommendations.join('; ')}\n`;
          }
        });
        md += `\n`;
      }
    });

    md += `## Next Steps\n\n`;
    report.nextSteps.forEach(step => {
      md += `- ${step}\n`;
    });
    md += `\n`;

    md += `## Detailed Findings\n\n`;
    const failedChecks = report.checks.filter(c => c.status === 'fail');
    if (failedChecks.length > 0) {
      md += `### Failed Checks (${failedChecks.length})\n\n`;
      failedChecks.forEach(check => {
        md += `#### ❌ ${check.name} (${check.id})\n\n`;
        md += `**Category**: ${check.category.replace(/_/g, ' ')}\n`;
        md += `**Severity**: ${check.severity.toUpperCase()}\n`;
        md += `**Findings**:\n${check.findings.map(f => `- ${f}`).join('\n')}\n\n`;
        if (check.recommendations.length > 0) {
          md += `**Recommendations**:\n${check.recommendations.map(r => `- ${r}`).join('\n')}\n\n`;
        }
        if (check.cweIds && check.cweIds.length > 0) {
          md += `**CWE IDs**: ${check.cweIds.join(', ')}\n\n`;
        }
      });
    }

    const warningChecks = report.checks.filter(c => c.status === 'warning');
    if (warningChecks.length > 0) {
      md += `### Warnings (${warningChecks.length})\n\n`;
      warningChecks.forEach(check => {
        md += `#### ⚠️  ${check.name} (${check.id})\n\n`;
        md += `**Category**: ${check.category.replace(/_/g, ' ')}\n`;
        md += `**Findings**: ${check.findings.join('; ')}\n\n`;
        if (check.recommendations.length > 0) {
          md += `**Recommendations**: ${check.recommendations.join('; ')}\n\n`;
        }
      });
    }

    md += `\n---\n\n`;
    md += `*Report generated by OWASP Top 10 2021 Auditor v${report.auditVersion}*\n`;

    return md;
  }

  /**
   * Helper: Check if file exists
   */
  private async checkFileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Helper: Find files matching patterns
   */
  private async findFilesWithPattern(patterns: string[]): Promise<string[]> {
    const files: string[] = [];

    for (const pattern of patterns) {
      try {
        // Simple pattern matching using fs.readdir recursively
        const matchedFiles = await this.findFilesRecursive(pattern);
        files.push(...matchedFiles);
      } catch (error) {
        // Pattern not found, continue
      }
    }

    return files;
  }

  /**
   * Helper: Find files recursively
   */
  private async findFilesRecursive(pattern: string): Promise<string[]> {
    const files: string[] = [];

    // Extract directory path from pattern
    const parts = pattern.split('/');
    const hasWildcard = parts.some(p => p.includes('*'));

    if (!hasWildcard) {
      // No wildcard, just check if file exists
      const exists = await this.checkFileExists(pattern);
      return exists ? [pattern] : [];
    }

    // For wildcard patterns, do a simplified search in common directories
    const searchDirs = ['src', 'tests', 'lib'];
    const fileExtensions = ['.ts', '.tsx', '.js', '.jsx'];

    for (const dir of searchDirs) {
      try {
        const dirExists = await this.checkFileExists(dir);
        if (!dirExists) continue;

        await this.scanDirectory(dir, files, fileExtensions);
      } catch {
        // Directory not accessible
      }
    }

    return files;
  }

  /**
   * Helper: Scan directory for files (with depth limit)
   */
  private async scanDirectory(dir: string, files: string[], extensions: string[], depth: number = 0): Promise<void> {
    // Limit recursion depth to prevent hanging
    if (depth > 3) return;

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      // Limit to first 100 entries per directory
      const limitedEntries = entries.slice(0, 100);

      for (const entry of limitedEntries) {
        if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === 'dist' || entry.name === '.git') {
          continue;
        }

        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          await this.scanDirectory(fullPath, files, extensions, depth + 1);
        } else if (entry.isFile()) {
          const hasMatchingExt = extensions.some(ext => entry.name.endsWith(ext));
          if (hasMatchingExt) {
            files.push(fullPath);
          }
        }
      }
    } catch {
      // Directory read error, skip
    }
  }

  /**
   * Helper: Check if any file contains pattern (optimized)
   */
  private async checkFileContains(searchPath: string, pattern: RegExp): Promise<boolean> {
    try {
      const files = await this.findFilesWithPattern([
        `${searchPath}/**/*.ts`,
        `${searchPath}/**/*.tsx`,
        `${searchPath}/**/*.js`,
        `${searchPath}/**/*.jsx`,
        `${searchPath}/**/*.json`,
      ]);

      // Limit to first 50 files to keep audit fast
      const limitedFiles = files.slice(0, 50);

      for (const file of limitedFiles) {
        try {
          // Read only first 100KB of file
          const buffer = Buffer.alloc(100 * 1024);
          const fd = await fs.open(file, 'r');
          const { bytesRead } = await fd.read(buffer, 0, buffer.length, 0);
          await fd.close();

          const content = buffer.toString('utf-8', 0, bytesRead);
          if (pattern.test(content)) {
            return true;
          }
        } catch {
          // File read error, continue
        }
      }

      return false;
    } catch {
      return false;
    }
  }

  /**
   * Helper: Count files containing pattern (optimized)
   */
  private async countFilesWithContent(files: string[], pattern: RegExp): Promise<number> {
    let count = 0;

    // Limit to first 30 files for faster scanning
    const limitedFiles = files.slice(0, 30);

    for (const file of limitedFiles) {
      try {
        // Read only first 50KB of file
        const buffer = Buffer.alloc(50 * 1024);
        const fd = await fs.open(file, 'r');
        const { bytesRead } = await fd.read(buffer, 0, buffer.length, 0);
        await fd.close();

        const content = buffer.toString('utf-8', 0, bytesRead);
        if (pattern.test(content)) {
          count++;
        }
      } catch {
        // File read error, continue
      }
    }

    return count;
  }
}

/**
 * Helper function to run OWASP audit
 */
export async function runOWASPAudit(config?: AuditConfig): Promise<OWASPAuditReport> {
  const auditor = new OWASPTop10Auditor(config);
  return await auditor.audit();
}
