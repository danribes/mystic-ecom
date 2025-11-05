/**
 * T208: Standardized Error Handling System - Unit Tests
 *
 * Tests for the centralized error handling utilities including:
 * - Custom error classes
 * - Error response formatting
 * - Error handlers
 * - Database error mapping
 * - Assert helpers
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { APIContext } from 'astro';
import {
  AppError,
  ValidationError,
  UnauthorizedError,
  AuthenticationError,
  ForbiddenError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  InternalServerError,
  DatabaseError,
  PaymentError,
  BusinessLogicError,
  FileUploadError,
  isAppError,
  isOperationalError,
  formatErrorResponse,
  createErrorResponse,
  createErrorRedirect,
  handleError,
  mapDatabaseError,
  asyncHandler,
  assert,
  assertExists,
} from '../../src/lib/errors';

describe('T208: Error Handling System', () => {
  describe('Error Classes', () => {
    describe('AppError', () => {
      it('should create an AppError with all properties', () => {
        const error = new AppError('Test error', 500, 'TEST_CODE', true, {
          foo: 'bar',
        });

        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe('Test error');
        expect(error.statusCode).toBe(500);
        expect(error.code).toBe('TEST_CODE');
        expect(error.isOperational).toBe(true);
        expect(error.context).toEqual({ foo: 'bar' });
        expect(error.name).toBe('AppError');
      });

      it('should have default values', () => {
        const error = new AppError('Test error');

        expect(error.statusCode).toBe(500);
        expect(error.isOperational).toBe(true);
      });

      it('should serialize to JSON correctly', () => {
        const error = new AppError('Test error', 400, 'TEST', true, {
          field: 'email',
        });

        const json = error.toJSON();

        expect(json.error.name).toBe('AppError');
        expect(json.error.message).toBe('Test error');
        expect(json.error.code).toBe('TEST');
        expect(json.error.statusCode).toBe(400);
      });
    });

    describe('ValidationError', () => {
      it('should create a ValidationError with 400 status', () => {
        const error = new ValidationError('Invalid input', {
          field: 'email',
        });

        expect(error.statusCode).toBe(400);
        expect(error.code).toBe('VALIDATION_ERROR');
        expect(error.isOperational).toBe(true);
        expect(error.context).toEqual({ field: 'email' });
      });
    });

    describe('UnauthorizedError / AuthenticationError', () => {
      it('should create an UnauthorizedError with 401 status', () => {
        const error = new UnauthorizedError('Invalid credentials');

        expect(error.statusCode).toBe(401);
        expect(error.code).toBe('UNAUTHORIZED');
        expect(error.isOperational).toBe(true);
      });

      it('should create an AuthenticationError with default message', () => {
        const error = new AuthenticationError();

        expect(error.message).toBe('Authentication required');
        expect(error.statusCode).toBe(401);
      });
    });

    describe('ForbiddenError / AuthorizationError', () => {
      it('should create a ForbiddenError with 403 status', () => {
        const error = new ForbiddenError('Access denied');

        expect(error.statusCode).toBe(403);
        expect(error.code).toBe('FORBIDDEN');
        expect(error.isOperational).toBe(true);
      });

      it('should create an AuthorizationError with default message', () => {
        const error = new AuthorizationError();

        expect(error.message).toBe('Access denied');
        expect(error.statusCode).toBe(403);
      });
    });

    describe('NotFoundError', () => {
      it('should create a NotFoundError with resource name', () => {
        const error = new NotFoundError('User');

        expect(error.message).toBe('User not found');
        expect(error.statusCode).toBe(404);
        expect(error.code).toBe('NOT_FOUND');
      });

      it('should use default resource name', () => {
        const error = new NotFoundError();

        expect(error.message).toBe('Resource not found');
      });
    });

    describe('ConflictError', () => {
      it('should create a ConflictError with 409 status', () => {
        const error = new ConflictError('Email already exists');

        expect(error.statusCode).toBe(409);
        expect(error.code).toBe('CONFLICT');
      });
    });

    describe('RateLimitError', () => {
      it('should create a RateLimitError with retry info', () => {
        const error = new RateLimitError(
          'Too many requests',
          60,
          Date.now() / 1000 + 60
        );

        expect(error.statusCode).toBe(429);
        expect(error.code).toBe('RATE_LIMIT_ERROR');
        expect(error.retryAfter).toBe(60);
        expect(error.resetAt).toBeDefined();
      });
    });

    describe('InternalServerError', () => {
      it('should create an InternalServerError marked as non-operational', () => {
        const error = new InternalServerError();

        expect(error.statusCode).toBe(500);
        expect(error.code).toBe('INTERNAL_SERVER_ERROR');
        expect(error.isOperational).toBe(false);
      });
    });

    describe('DatabaseError', () => {
      it('should create a DatabaseError marked as non-operational', () => {
        const error = new DatabaseError('Connection failed');

        expect(error.statusCode).toBe(500);
        expect(error.code).toBe('DATABASE_ERROR');
        expect(error.isOperational).toBe(false);
      });
    });

    describe('PaymentError', () => {
      it('should create a PaymentError with custom status code', () => {
        const error = new PaymentError('Card declined', 402);

        expect(error.statusCode).toBe(402);
        expect(error.code).toBe('PAYMENT_ERROR');
      });
    });

    describe('BusinessLogicError', () => {
      it('should create a BusinessLogicError', () => {
        const error = new BusinessLogicError('Cannot delete active user', 422);

        expect(error.statusCode).toBe(422);
        expect(error.code).toBe('BUSINESS_LOGIC_ERROR');
      });
    });

    describe('FileUploadError', () => {
      it('should create a FileUploadError', () => {
        const error = new FileUploadError('File too large', 413);

        expect(error.statusCode).toBe(413);
        expect(error.code).toBe('FILE_UPLOAD_ERROR');
      });
    });
  });

  describe('Error Utilities', () => {
    describe('isAppError', () => {
      it('should return true for AppError instances', () => {
        const error = new ValidationError('Test');
        expect(isAppError(error)).toBe(true);
      });

      it('should return false for standard Error', () => {
        const error = new Error('Test');
        expect(isAppError(error)).toBe(false);
      });
    });

    describe('isOperationalError', () => {
      it('should return true for operational errors', () => {
        const error = new ValidationError('Test');
        expect(isOperationalError(error)).toBe(true);
      });

      it('should return false for non-operational errors', () => {
        const error = new DatabaseError('Test');
        expect(isOperationalError(error)).toBe(false);
      });

      it('should return false for standard Error', () => {
        const error = new Error('Test');
        expect(isOperationalError(error)).toBe(false);
      });
    });
  });

  describe('Error Formatting', () => {
    describe('formatErrorResponse', () => {
      it('should format AppError correctly', () => {
        const error = new ValidationError('Invalid email', {
          field: 'email',
        });

        const response = formatErrorResponse(error);

        expect(response.success).toBe(false);
        expect(response.error.code).toBe('VALIDATION_ERROR');
        expect(response.error.message).toBe('Invalid email');
      });

      it('should include retryAfter for RateLimitError', () => {
        const error = new RateLimitError('Too many requests', 60);

        const response = formatErrorResponse(error);

        expect(response.retryAfter).toBe(60);
      });

      it('should format standard Error', () => {
        const error = new Error('Unexpected error');

        const response = formatErrorResponse(error);

        expect(response.success).toBe(false);
        expect(response.error.code).toBe('INTERNAL_SERVER_ERROR');
      });

      it('should hide context in production', () => {
        const originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'production';

        const error = new ValidationError('Test', { secret: 'data' });
        const response = formatErrorResponse(error);

        expect(response.error.context).toBeUndefined();

        process.env.NODE_ENV = originalEnv;
      });
    });

    describe('createErrorResponse', () => {
      it('should create a Response with correct status and headers', () => {
        const error = new NotFoundError('User');

        const response = createErrorResponse(error);

        expect(response.status).toBe(404);
        expect(response.headers.get('Content-Type')).toBe(
          'application/json'
        );
      });

      it('should include Retry-After header for rate limit errors', () => {
        const error = new RateLimitError('Too many requests', 60);

        const response = createErrorResponse(error);

        expect(response.status).toBe(429);
        expect(response.headers.get('Retry-After')).toBe('60');
      });

      it('should default to 500 for standard errors', () => {
        const error = new Error('Unexpected');

        const response = createErrorResponse(error);

        expect(response.status).toBe(500);
      });
    });

    describe('createErrorRedirect', () => {
      it('should create a redirect with error query param', () => {
        const error = new ValidationError('Invalid input');
        const mockContext = {
          request: { url: 'http://localhost/api/test' },
          redirect: vi.fn((url) => new Response(null, { status: 302 })),
        } as unknown as APIContext;

        createErrorRedirect(error, '/form', mockContext);

        expect(mockContext.redirect).toHaveBeenCalledWith(
          expect.stringContaining('error=validation_error')
        );
      });

      it('should include retry_after for rate limit errors', () => {
        const error = new RateLimitError('Too many requests', 120);
        const mockContext = {
          request: { url: 'http://localhost/api/test' },
          redirect: vi.fn((url) => new Response(null, { status: 302 })),
        } as unknown as APIContext;

        createErrorRedirect(error, '/form', mockContext);

        expect(mockContext.redirect).toHaveBeenCalledWith(
          expect.stringContaining('retry_after=120')
        );
      });
    });
  });

  describe('Error Handlers', () => {
    describe('handleError', () => {
      beforeEach(() => {
        vi.clearAllMocks();
      });

      it('should return JSON response for AppError', () => {
        const error = new ValidationError('Test');

        const response = handleError(error);

        expect(response.status).toBe(400);
      });

      it('should return redirect for form endpoints', () => {
        const error = new ValidationError('Test');
        const mockContext = {
          request: { url: 'http://localhost/api/test' },
          redirect: vi.fn((url) => new Response(null, { status: 302 })),
        } as unknown as APIContext;

        handleError(error, mockContext, '/form');

        expect(mockContext.redirect).toHaveBeenCalled();
      });

      it('should handle non-Error values', () => {
        const response = handleError('string error');

        expect(response.status).toBe(500);
      });
    });

    describe('asyncHandler', () => {
      it('should pass through successful response', async () => {
        const handler = vi.fn(async () => new Response('OK'));
        const wrapped = asyncHandler(handler);
        const mockContext = {} as APIContext;

        const response = await wrapped(mockContext);

        expect(await response.text()).toBe('OK');
      });

      it('should catch and handle errors', async () => {
        const handler = vi.fn(async () => {
          throw new ValidationError('Invalid');
        });
        const wrapped = asyncHandler(handler);
        const mockContext = {} as APIContext;

        const response = await wrapped(mockContext);

        expect(response.status).toBe(400);
      });

      it('should support redirect path', async () => {
        const handler = vi.fn(async () => {
          throw new ValidationError('Invalid');
        });
        const wrapped = asyncHandler(handler, '/form');
        const mockContext = {
          request: { url: 'http://localhost/api/test' },
          redirect: vi.fn((url) => new Response(null, { status: 302 })),
        } as unknown as APIContext;

        await wrapped(mockContext);

        expect(mockContext.redirect).toHaveBeenCalled();
      });
    });
  });

  describe('Database Error Mapping', () => {
    it('should map unique constraint violation (23505)', () => {
      const dbError = {
        code: '23505',
        constraint: 'users_email_key',
        detail: 'Key (email)=(test@example.com) already exists.',
      };

      const error = mapDatabaseError(dbError);

      expect(error).toBeInstanceOf(ConflictError);
      expect(error.message).toContain('already exists');
    });

    it('should map foreign key violation (23503)', () => {
      const dbError = {
        code: '23503',
        constraint: 'orders_user_id_fkey',
        detail: 'Key (user_id)=(123) is not present in table "users".',
      };

      const error = mapDatabaseError(dbError);

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toContain('does not exist');
    });

    it('should map not null violation (23502)', () => {
      const dbError = {
        code: '23502',
        column: 'email',
      };

      const error = mapDatabaseError(dbError);

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toContain('missing');
    });

    it('should map invalid text representation (22P02)', () => {
      const dbError = {
        code: '22P02',
        detail: 'invalid input syntax for type integer',
      };

      const error = mapDatabaseError(dbError);

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toContain('Invalid data format');
    });

    it('should return DatabaseError for unknown codes', () => {
      const dbError = {
        code: 'XXXXX',
        detail: 'Some unknown error',
      };

      const error = mapDatabaseError(dbError);

      expect(error).toBeInstanceOf(DatabaseError);
    });
  });

  describe('Assert Helpers', () => {
    describe('assert', () => {
      it('should not throw for true condition', () => {
        expect(() => assert(true, 'Should not throw')).not.toThrow();
      });

      it('should throw ValidationError for false condition', () => {
        expect(() => assert(false, 'Test message')).toThrow(ValidationError);
      });

      it('should include context in error', () => {
        try {
          assert(false, 'Test', { field: 'email' });
          expect.fail('Should have thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(ValidationError);
          expect((error as ValidationError).context).toEqual({
            field: 'email',
          });
        }
      });
    });

    describe('assertExists', () => {
      it('should not throw for non-null values', () => {
        expect(() => assertExists('value')).not.toThrow();
        expect(() => assertExists(0)).not.toThrow();
        expect(() => assertExists(false)).not.toThrow();
      });

      it('should throw for null', () => {
        expect(() => assertExists(null)).toThrow(ValidationError);
      });

      it('should throw for undefined', () => {
        expect(() => assertExists(undefined)).toThrow(ValidationError);
      });

      it('should use custom message', () => {
        try {
          assertExists(null, 'Custom message');
          expect.fail('Should have thrown');
        } catch (error) {
          expect((error as ValidationError).message).toBe('Custom message');
        }
      });
    });
  });
});
