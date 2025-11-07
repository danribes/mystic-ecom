# Security Vulnerability Scan Report

**Scan Date**: 2025-11-05T20:17:49.438Z

**Status**: ❌ FAILED

## Summary

| Severity | Count |
|----------|-------|
| Critical | 0 |
| High | 4 |
| Moderate | 0 |
| Low | 0 |
| Info | 0 |
| **Total** | **4** |

- **Fixable**: 0
- **Requires Manual Review**: 4

## Recommendations

- ⚠️  HIGH: Found 4 high-severity vulnerabilities. Prioritize fixing these.
- 📦 1 vulnerabilities in direct dependencies. Update these packages first.
- ⚙️  4 vulnerabilities require breaking changes. Review with 'npm audit fix --force'
- 🔍 Consider enabling Snyk for advanced security scanning and monitoring
- 📚 Review vulnerability details and plan remediation strategy
- 🔄 Regularly run security scans to catch new vulnerabilities

## Vulnerabilities

### 1. @playwright/test

**Severity**: HIGH
**Title**: Vulnerability in @playwright/test
**Direct Dependency**: No
**Affected Versions**: 0.9.7 - 0.1112.0-alpha2 || 1.38.0-alpha-1692262648000 - 1.55.1-beta-1758616458000
**Fix Available**: Yes (1.7.9)
⚠️  *Requires breaking change*

### 2. artillery

**Severity**: HIGH
**Title**: Vulnerability in artillery
**Direct Dependency**: Yes
**Affected Versions**: >=2.0.0-0
**Fix Available**: Yes (1.7.9)
⚠️  *Requires breaking change*

### 3. artillery-engine-playwright

**Severity**: HIGH
**Title**: Vulnerability in artillery-engine-playwright
**Direct Dependency**: No
**Affected Versions**: 0.0.5 - 0.0.6 || 0.3.1-1859275 - 1.18.0-e39393c || >=1.19.0-9942076
**Fix Available**: Yes (1.7.9)
⚠️  *Requires breaking change*

### 4. playwright

**Severity**: HIGH
**Title**: Playwright downloads and installs browsers without verifying the authenticity of the SSL certificate
**CWE**: CWE-347
**Direct Dependency**: No
**Affected Versions**: <1.55.1
**Fix Available**: Yes (1.7.9)
⚠️  *Requires breaking change*
**More Info**: https://github.com/advisories/GHSA-7mvr-c777-76hp
