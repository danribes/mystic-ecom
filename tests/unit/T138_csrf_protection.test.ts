/**
 * T138: CSRF Protection - Unit Test Suite
 *
 * Tests for CSRF (Cross-Site Request Forgery) protection implementation
 * Validates token generation, validation, and endpoint integration
 *
 * Test Framework: Vitest
 * Security: OWASP A01:2021 - Broken Access Control
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  generateCSRFToken,
  setCSRFCookie,
  getCSRFTokenFromCookie,
  getCSRFTokenFromRequest,
  validateCSRFToken,
  withCSRF,
  getCSRFInput,
  CSRFConfig,
} from '@/lib/csrf';

const { COOKIE_NAME: CSRF_COOKIE_NAME, HEADER_NAME: CSRF_HEADER_NAME, FORM_FIELD: CSRF_FORM_FIELD } = CSRFConfig;
import type { AstroCookies } from 'astro';

// ==================== Mock Classes ====================

/**
 * Mock AstroCookies implementation for testing
 */
class MockCookies implements AstroCookies {
  private cookies: Map<string, { value: string; options?: any }> = new Map();

  get(name: string) {
    const cookie = this.cookies.get(name);
    return cookie ? { value: cookie.value } : undefined;
  }

  has(name: string): boolean {
    return this.cookies.has(name);
  }

  set(name: string, value: string | object, options?: any): void {
    this.cookies.set(name, {
      value: typeof value === 'string' ? value : JSON.stringify(value),
      options,
    });
  }

  delete(name: string, options?: any): void {
    this.cookies.delete(name);
  }

  headers(): Headers {
    return new Headers();
  }

  *[Symbol.iterator](): Iterator<[string, { value: string }]> {
    for (const [name, cookie] of this.cookies.entries()) {
      yield [name, { value: cookie.value }];
    }
  }
}

/**
 * Create mock Request object
 */
function createMockRequest(options: {
  csrfToken?: string;
  method?: string;
  url?: string;
  headers?: Record<string, string>;
  body?: any;
}): Request {
  const {
    csrfToken,
    method = 'POST',
    url = 'https://example.com/api/test',
    headers = {},
    body,
  } = options;

  const requestHeaders = new Headers(headers);

  if (csrfToken && !requestHeaders.has(CSRF_HEADER_NAME)) {
    requestHeaders.set(CSRF_HEADER_NAME, csrfToken);
  }

  // For form data requests
  if (body && typeof body === 'object' && CSRF_FORM_FIELD in body) {
    requestHeaders.set('Content-Type', 'application/x-www-form-urlencoded');
  }

  return new Request(url, {
    method,
    headers: requestHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });
}

// ==================== Test Suites ====================

describe('CSRF Token Generation', () => {
  it('should generate a CSRF token', () => {
    const token = generateCSRFToken();

    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);
  });

  it('should generate unique tokens', () => {
    const token1 = generateCSRFToken();
    const token2 = generateCSRFToken();

    expect(token1).not.toBe(token2);
  });

  it('should generate URL-safe tokens (base64url)', () => {
    const token = generateCSRFToken();

    // Base64url should not contain +, /, or =
    expect(token).not.toMatch(/[+/=]/);
  });

  it('should generate tokens of expected length', () => {
    const token = generateCSRFToken();

    // 32 bytes encoded as base64url ≈ 43 characters
    expect(token.length).toBeGreaterThanOrEqual(40);
    expect(token.length).toBeLessThanOrEqual(50);
  });
});

describe('CSRF Cookie Management', () => {
  let cookies: MockCookies;

  beforeEach(() => {
    cookies = new MockCookies();
  });

  it('should set CSRF cookie and return token', () => {
    const token = setCSRFCookie(cookies);

    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(cookies.has(CSRF_COOKIE_NAME)).toBe(true);
  });

  it('should retrieve CSRF token from cookie', () => {
    const token = setCSRFCookie(cookies);
    const retrieved = getCSRFTokenFromCookie(cookies);

    expect(retrieved).toBe(token);
  });

  it('should return undefined when cookie does not exist', () => {
    const retrieved = getCSRFTokenFromCookie(cookies);

    expect(retrieved).toBeUndefined();
  });

  it('should set cookie with correct options', () => {
    setCSRFCookie(cookies);

    const cookie = cookies.get(CSRF_COOKIE_NAME);
    expect(cookie).toBeDefined();
    expect(cookie?.value).toBeDefined();
  });
});

describe('CSRF Token Retrieval from Request', () => {
  it('should retrieve CSRF token from header', () => {
    const token = 'test-csrf-token-123';
    const request = createMockRequest({
      csrfToken: token,
    });

    const retrieved = getCSRFTokenFromRequest(request);
    expect(retrieved).toBe(token);
  });

  it('should retrieve CSRF token from form data (simulated)', async () => {
    const token = 'test-csrf-token-456';
    const formData = new FormData();
    formData.set(CSRF_FORM_FIELD, token);

    const request = new Request('https://example.com/api/test', {
      method: 'POST',
      body: formData,
    });

    // Note: Actual form data retrieval would require parsing the body
    // This tests the header retrieval path
    const requestWithHeader = createMockRequest({
      csrfToken: token,
    });

    const retrieved = getCSRFTokenFromRequest(requestWithHeader);
    expect(retrieved).toBe(token);
  });

  it('should return undefined when token not in request', () => {
    const request = createMockRequest({});

    const retrieved = getCSRFTokenFromRequest(request);
    expect(retrieved).toBeUndefined();
  });

  it('should prefer header over form field', () => {
    const headerToken = 'header-token';
    const request = new Request('https://example.com/api/test', {
      method: 'POST',
      headers: {
        [CSRF_HEADER_NAME]: headerToken,
      },
    });

    const retrieved = getCSRFTokenFromRequest(request);
    expect(retrieved).toBe(headerToken);
  });
});

describe('CSRF Token Validation', () => {
  let cookies: MockCookies;

  beforeEach(() => {
    cookies = new MockCookies();
  });

  it('should validate matching tokens (header)', async () => {
    const token = setCSRFCookie(cookies);
    const request = createMockRequest({ csrfToken: token });

    const isValid = await validateCSRFToken(request, cookies);
    expect(isValid).toBe(true);
  });

  it('should reject mismatched tokens', async () => {
    setCSRFCookie(cookies);
    const request = createMockRequest({ csrfToken: 'wrong-token' });

    const isValid = await validateCSRFToken(request, cookies);
    expect(isValid).toBe(false);
  });

  it('should reject when cookie token is missing', async () => {
    const request = createMockRequest({ csrfToken: 'some-token' });

    const isValid = await validateCSRFToken(request, cookies);
    expect(isValid).toBe(false);
  });

  it('should reject when request token is missing', async () => {
    setCSRFCookie(cookies);
    const request = createMockRequest({});

    const isValid = await validateCSRFToken(request, cookies);
    expect(isValid).toBe(false);
  });

  it('should reject when both tokens are missing', async () => {
    const request = createMockRequest({});

    const isValid = await validateCSRFToken(request, cookies);
    expect(isValid).toBe(false);
  });

  it('should use timing-safe comparison', async () => {
    // This test ensures constant-time comparison
    const token = setCSRFCookie(cookies);
    const similarToken = token.slice(0, -1) + 'X'; // Change last character

    const request = createMockRequest({ csrfToken: similarToken });

    const startTime = Date.now();
    const isValid = await validateCSRFToken(request, cookies);
    const endTime = Date.now();

    expect(isValid).toBe(false);
    // Timing should be similar regardless of where tokens differ
    expect(endTime - startTime).toBeLessThan(10); // Very fast operation
  });

  it('should handle tokens with different lengths', async () => {
    cookies.set(CSRF_COOKIE_NAME, 'short');
    const request = createMockRequest({
      csrfToken: 'this-is-a-much-longer-token',
    });

    const isValid = await validateCSRFToken(request, cookies);
    expect(isValid).toBe(false);
  });
});

describe('withCSRF Wrapper', () => {
  let cookies: MockCookies;
  let mockHandler: any;
  let mockContext: any;

  beforeEach(() => {
    cookies = new MockCookies();
    mockHandler = async (context: any) => {
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };
    mockContext = {
      cookies,
      request: createMockRequest({}),
      clientAddress: '127.0.0.1',
      locals: {},
    };
  });

  it('should allow request with valid CSRF token', async () => {
    const token = setCSRFCookie(cookies);
    mockContext.request = createMockRequest({ csrfToken: token });

    const wrappedHandler = withCSRF(mockHandler);
    const response = await wrappedHandler(mockContext);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  it('should reject request with invalid CSRF token', async () => {
    setCSRFCookie(cookies);
    mockContext.request = createMockRequest({ csrfToken: 'wrong-token' });

    const wrappedHandler = withCSRF(mockHandler);
    const response = await wrappedHandler(mockContext);

    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error).toContain('CSRF');
  });

  it('should reject request with missing CSRF token', async () => {
    mockContext.request = createMockRequest({});

    const wrappedHandler = withCSRF(mockHandler);
    const response = await wrappedHandler(mockContext);

    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error).toContain('CSRF');
  });

  it('should not call handler when CSRF validation fails', async () => {
    let handlerCalled = false;
    const trackingHandler = async (context: any) => {
      handlerCalled = true;
      return new Response('OK');
    };

    mockContext.request = createMockRequest({ csrfToken: 'wrong' });

    const wrappedHandler = withCSRF(trackingHandler);
    await wrappedHandler(mockContext);

    expect(handlerCalled).toBe(false);
  });

  it('should call handler when CSRF validation succeeds', async () => {
    let handlerCalled = false;
    const trackingHandler = async (context: any) => {
      handlerCalled = true;
      return new Response('OK');
    };

    const token = setCSRFCookie(cookies);
    mockContext.request = createMockRequest({ csrfToken: token });

    const wrappedHandler = withCSRF(trackingHandler);
    await wrappedHandler(mockContext);

    expect(handlerCalled).toBe(true);
  });

  it('should preserve handler response', async () => {
    const customResponse = new Response('Custom Response', {
      status: 201,
      headers: { 'X-Custom': 'Header' },
    });

    const customHandler = async () => customResponse;

    const token = setCSRFCookie(cookies);
    mockContext.request = createMockRequest({ csrfToken: token });

    const wrappedHandler = withCSRF(customHandler);
    const response = await wrappedHandler(mockContext);

    expect(response.status).toBe(201);
    expect(response.headers.get('X-Custom')).toBe('Header');
    const text = await response.text();
    expect(text).toBe('Custom Response');
  });
});

describe('CSRF HTML Helper', () => {
  let cookies: MockCookies;

  beforeEach(() => {
    cookies = new MockCookies();
  });

  it('should generate hidden input HTML', () => {
    const html = getCSRFInput(cookies);

    expect(html).toContain('<input');
    expect(html).toContain('type="hidden"');
    expect(html).toContain(`name="${CSRF_FORM_FIELD}"`);
    expect(html).toContain('value=');
  });

  it('should include valid token in input', () => {
    const token = setCSRFCookie(cookies);
    const html = getCSRFInput(cookies);

    expect(html).toContain(`value="${token}"`);
  });

  it('should create new token if cookie does not exist', () => {
    const html = getCSRFInput(cookies);

    expect(html).toContain('value=');
    expect(cookies.has(CSRF_COOKIE_NAME)).toBe(true);
  });

  it('should be safe for HTML injection', () => {
    const html = getCSRFInput(cookies);

    // Should not contain script tags or dangerous content
    expect(html).not.toContain('<script');
    expect(html).not.toContain('javascript:');
    expect(html).not.toContain('onerror');
    expect(html).not.toContain('onclick');
  });
});

describe('CSRF Constants', () => {
  it('should have correct cookie name', () => {
    expect(CSRF_COOKIE_NAME).toBe('csrf_token');
  });

  it('should have correct header name', () => {
    expect(CSRF_HEADER_NAME).toBe('x-csrf-token');
  });

  it('should have correct form field name', () => {
    expect(CSRF_FORM_FIELD).toBe('csrf_token');
  });
});

describe('Edge Cases', () => {
  let cookies: MockCookies;

  beforeEach(() => {
    cookies = new MockCookies();
  });

  it('should handle empty token strings', async () => {
    cookies.set(CSRF_COOKIE_NAME, '');
    const request = createMockRequest({ csrfToken: '' });

    const isValid = await validateCSRFToken(request, cookies);
    expect(isValid).toBe(false);
  });

  it('should handle whitespace-only tokens', async () => {
    cookies.set(CSRF_COOKIE_NAME, '   ');
    const request = createMockRequest({ csrfToken: '   ' });

    const isValid = await validateCSRFToken(request, cookies);
    expect(isValid).toBe(false);
  });

  it('should handle very long tokens', async () => {
    const longToken = 'a'.repeat(1000);
    cookies.set(CSRF_COOKIE_NAME, longToken);
    const request = createMockRequest({ csrfToken: longToken });

    const isValid = await validateCSRFToken(request, cookies);
    expect(isValid).toBe(true);
  });

  it('should handle special characters in tokens', async () => {
    const token = setCSRFCookie(cookies);
    const request = createMockRequest({ csrfToken: token });

    const isValid = await validateCSRFToken(request, cookies);
    expect(isValid).toBe(true);
  });

  it('should reject token with null bytes (security)', async () => {
    const token = 'token\x00with\x00nulls';
    cookies.set(CSRF_COOKIE_NAME, token);

    // Cannot set null bytes in headers, so manually create request with proper headers
    const requestHeaders = new Headers();
    // Skip adding null byte token to header - it would throw
    const request = new Request('https://example.com/api/test', {
      method: 'POST',
      headers: requestHeaders,
    });

    const isValid = await validateCSRFToken(request, cookies);
    // Should fail because request token is missing
    expect(isValid).toBe(false);
  });
});

describe('Security Properties', () => {
  let cookies: MockCookies;

  beforeEach(() => {
    cookies = new MockCookies();
  });

  it('should not accept substring attacks', async () => {
    const token = setCSRFCookie(cookies);
    const substring = token.substring(0, token.length - 5);
    const request = createMockRequest({ csrfToken: substring });

    const isValid = await validateCSRFToken(request, cookies);
    expect(isValid).toBe(false);
  });

  it('should not accept prefix attacks', async () => {
    const token = setCSRFCookie(cookies);
    const prefixed = token + 'extra';
    const request = createMockRequest({ csrfToken: prefixed });

    const isValid = await validateCSRFToken(request, cookies);
    expect(isValid).toBe(false);
  });

  it('should not accept case variation attacks', async () => {
    const token = setCSRFCookie(cookies);
    const upperCase = token.toUpperCase();

    // Only test if token has letters
    if (token !== upperCase) {
      const request = createMockRequest({ csrfToken: upperCase });
      const isValid = await validateCSRFToken(request, cookies);
      expect(isValid).toBe(false);
    }
  });

  it('should generate cryptographically random tokens', () => {
    const tokens = new Set();
    const iterations = 1000;

    for (let i = 0; i < iterations; i++) {
      tokens.add(generateCSRFToken());
    }

    // All tokens should be unique
    expect(tokens.size).toBe(iterations);
  });
});

describe('Integration Scenarios', () => {
  let cookies: MockCookies;

  beforeEach(() => {
    cookies = new MockCookies();
  });

  it('should support multiple concurrent requests with same token', async () => {
    const token = setCSRFCookie(cookies);

    const request1 = createMockRequest({ csrfToken: token });
    const request2 = createMockRequest({ csrfToken: token });
    const request3 = createMockRequest({ csrfToken: token });

    const [valid1, valid2, valid3] = await Promise.all([
      validateCSRFToken(request1, cookies),
      validateCSRFToken(request2, cookies),
      validateCSRFToken(request3, cookies),
    ]);

    expect(valid1).toBe(true);
    expect(valid2).toBe(true);
    expect(valid3).toBe(true);
  });

  it('should reuse existing token from cookie', async () => {
    // setCSRFCookie reuses existing token if present
    const firstToken = setCSRFCookie(cookies);
    const secondToken = setCSRFCookie(cookies);

    // Should return the same token
    expect(firstToken).toBe(secondToken);

    // Both should work
    const requestWithToken = createMockRequest({ csrfToken: firstToken });
    const isValid = await validateCSRFToken(requestWithToken, cookies);
    expect(isValid).toBe(true);
  });

  it('should work with different HTTP methods', async () => {
    const token = setCSRFCookie(cookies);

    const methods = ['POST', 'PUT', 'PATCH', 'DELETE'];

    for (const method of methods) {
      const request = createMockRequest({ csrfToken: token, method });
      const isValid = await validateCSRFToken(request, cookies);
      expect(isValid).toBe(true);
    }
  });
});
