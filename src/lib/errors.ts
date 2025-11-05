/**
 * Standardized Error Handling System (T208)
 *
 * Domain-specific error classes for better error handling
 * and consistent error responses across the application.
 *
 * Integrated with structured logging system (T207)
 */

import type { APIContext } from 'astro';
import { log } from './logger';

/**
 * Base application error class
 */
export class AppError extends Error {
  public readonly isOperational: boolean;
  public readonly context?: Record<string, any>;

  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    isOperational: boolean = true,
    context?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
    this.isOperational = isOperational;
    this.context = context;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      error: {
        name: this.name,
        message: this.message,
        code: this.code,
        statusCode: this.statusCode,
        context: process.env.NODE_ENV === 'development' ? this.context : undefined,
      },
    };
  }
}

/**
 * Validation error (400)
 */
export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 400, 'VALIDATION_ERROR', true, context);
    this.name = 'ValidationError';
  }
}

/**
 * Authentication error (401) - User not authenticated
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required', context?: Record<string, any>) {
    super(message, 401, 'AUTHENTICATION_ERROR', true, context);
    this.name = 'AuthenticationError';
  }
}

/**
 * Alias for AuthenticationError (common naming)
 */
export class UnauthorizedError extends AuthenticationError {
  constructor(message: string = 'Unauthorized', context?: Record<string, any>) {
    super(message, context);
    this.code = 'UNAUTHORIZED';
  }
}

/**
 * Authorization error (403) - User authenticated but lacks permissions
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied', context?: Record<string, any>) {
    super(message, 403, 'AUTHORIZATION_ERROR', true, context);
    this.name = 'AuthorizationError';
  }
}

/**
 * Alias for AuthorizationError (common naming)
 */
export class ForbiddenError extends AuthorizationError {
  constructor(message: string = 'Forbidden', context?: Record<string, any>) {
    super(message, context);
    this.code = 'FORBIDDEN';
  }
}

/**
 * Not found error (404)
 */
export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource', context?: Record<string, any>) {
    super(`${resource} not found`, 404, 'NOT_FOUND', true, context);
    this.name = 'NotFoundError';
  }
}

/**
 * Conflict error (409) - Resource conflict (e.g., duplicate entry)
 */
export class ConflictError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 409, 'CONFLICT', true, context);
    this.name = 'ConflictError';
  }
}

/**
 * Payment error (402/500)
 */
export class PaymentError extends AppError {
  constructor(message: string, statusCode: number = 402, context?: Record<string, any>) {
    super(message, statusCode, 'PAYMENT_ERROR', true, context);
    this.name = 'PaymentError';
  }
}

/**
 * Database error (500) - Non-operational by default
 */
export class DatabaseError extends AppError {
  constructor(message: string = 'Database error occurred', context?: Record<string, any>) {
    super(message, 500, 'DATABASE_ERROR', false, context);
    this.name = 'DatabaseError';
  }
}

/**
 * External service error (502)
 */
export class ExternalServiceError extends AppError {
  constructor(service: string, message?: string, context?: Record<string, any>) {
    super(
      message || `External service error: ${service}`,
      502,
      'EXTERNAL_SERVICE_ERROR',
      true,
      context
    );
    this.name = 'ExternalServiceError';
  }
}

/**
 * Rate limit error (429)
 */
export class RateLimitError extends AppError {
  public readonly retryAfter?: number;
  public readonly resetAt?: number;

  constructor(
    message: string = 'Too many requests',
    retryAfter?: number,
    resetAt?: number,
    context?: Record<string, any>
  ) {
    super(message, 429, 'RATE_LIMIT_ERROR', true, {
      ...context,
      retryAfter,
      resetAt,
    });
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
    this.resetAt = resetAt;
  }
}

/**
 * Internal server error (500) - For unexpected errors
 */
export class InternalServerError extends AppError {
  constructor(message: string = 'Internal server error', context?: Record<string, any>) {
    super(message, 500, 'INTERNAL_SERVER_ERROR', false, context);
    this.name = 'InternalServerError';
  }
}

/**
 * Business logic error (400/422) - For business rule violations
 */
export class BusinessLogicError extends AppError {
  constructor(message: string, statusCode: number = 400, context?: Record<string, any>) {
    super(message, statusCode, 'BUSINESS_LOGIC_ERROR', true, context);
    this.name = 'BusinessLogicError';
  }
}

/**
 * File upload error (400/413)
 */
export class FileUploadError extends AppError {
  constructor(message: string, statusCode: number = 400, context?: Record<string, any>) {
    super(message, statusCode, 'FILE_UPLOAD_ERROR', true, context);
    this.name = 'FileUploadError';
  }
}

/**
 * Check if error is an AppError instance
 * T209: Properly typed - uses unknown instead of any
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Check if error is operational (expected) or programming (unexpected)
 */
export function isOperationalError(error: Error | AppError): boolean {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}

/**
 * Error response interface
 */
export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    context?: Record<string, any>;
  };
  retryAfter?: number;
  resetAt?: number;
}

/**
 * Format error for JSON response
 */
export function formatErrorResponse(error: Error | AppError): ErrorResponse {
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Handle AppError instances
  if (error instanceof AppError) {
    const response: ErrorResponse = {
      success: false,
      error: {
        code: error.code || 'UNKNOWN_ERROR',
        message: error.message,
        context: isDevelopment ? error.context : undefined,
      },
    };

    // Add rate limit specific fields
    if (error instanceof RateLimitError) {
      response.retryAfter = error.retryAfter;
      response.resetAt = error.resetAt;
    }

    return response;
  }

  // Handle standard errors
  return {
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: isDevelopment ? error.message : 'An unexpected error occurred',
      context: isDevelopment ? { stack: error.stack } : undefined,
    },
  };
}

/**
 * Create a JSON response from an error
 */
export function createErrorResponse(error: Error | AppError): Response {
  const errorResponse = formatErrorResponse(error);
  const statusCode = error instanceof AppError ? error.statusCode : 500;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // Add retry-after header for rate limit errors
  if (error instanceof RateLimitError && error.retryAfter) {
    headers['Retry-After'] = String(error.retryAfter > 0 ? error.retryAfter : 1);
  }

  return new Response(JSON.stringify(errorResponse), {
    status: statusCode,
    headers,
  });
}

/**
 * Create a redirect response with error query parameter
 * Used for form-based endpoints that need to redirect on error
 */
export function createErrorRedirect(
  error: Error | AppError,
  redirectPath: string,
  context: APIContext
): Response {
  let errorCode: string;

  if (error instanceof AppError && error.code) {
    errorCode = error.code.toLowerCase();
  } else {
    errorCode = 'server_error';
  }

  const url = new URL(redirectPath, context.request.url);
  url.searchParams.set('error', errorCode);

  // Add retry_after for rate limit errors
  if (error instanceof RateLimitError && error.retryAfter) {
    url.searchParams.set('retry_after', String(error.retryAfter));
  }

  return context.redirect(url.toString());
}

/**
 * Central error handler for API routes
 *
 * Automatically logs errors and returns appropriate response
 *
 * @param error - The error to handle
 * @param context - Optional API context (for redirect-based errors)
 * @param redirectPath - Optional redirect path for form endpoints
 * @returns Response object (JSON or redirect)
 */
export function handleError(
  error: unknown,
  context?: APIContext,
  redirectPath?: string
): Response {
  // Convert unknown errors to Error instances
  const err = error instanceof Error ? error : new Error(String(error));

  // Log the error using structured logger
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      log.error(err.message, {
        code: err.code,
        statusCode: err.statusCode,
        context: err.context,
        stack: err.stack,
      });
    } else if (err.statusCode >= 400) {
      log.warn(err.message, {
        code: err.code,
        statusCode: err.statusCode,
        context: err.context,
      });
    }
  } else {
    log.error('Unhandled error', {
      message: err.message,
      stack: err.stack,
    });
  }

  // Return appropriate response
  if (context && redirectPath) {
    return createErrorRedirect(err, redirectPath, context);
  }

  return createErrorResponse(err);
}

/**
 * Map database error codes to application errors
 * T209: Properly typed - uses unknown instead of any
 */
export function mapDatabaseError(error: unknown): AppError {
  // Type guard for database errors
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return new DatabaseError('Unknown database error');
  }

  const dbError = error as Record<string, unknown>;

  // PostgreSQL error codes
  if (dbError.code === '23505') {
    // Unique constraint violation
    return new ConflictError('A record with this value already exists', {
      constraint: dbError.constraint,
      detail: dbError.detail,
    });
  }

  if (dbError.code === '23503') {
    // Foreign key violation
    return new ValidationError('Referenced record does not exist', {
      constraint: dbError.constraint,
      detail: dbError.detail,
    });
  }

  if (dbError.code === '23502') {
    // Not null violation
    return new ValidationError('Required field is missing', {
      column: dbError.column,
    });
  }

  if (dbError.code === '22P02') {
    // Invalid text representation
    return new ValidationError('Invalid data format', {
      detail: dbError.detail,
    });
  }

  // Generic database error
  return new DatabaseError('Database operation failed', {
    code: dbError.code,
    detail: process.env.NODE_ENV === 'development' ? dbError.detail : undefined,
  });
}

/**
 * Async error handler wrapper
 * Wraps async route handlers to catch and handle errors
 *
 * Usage:
 * ```typescript
 * export const POST = asyncHandler(async (context) => {
 *   // Your code here
 *   return new Response(...);
 * });
 * ```
 */
export function asyncHandler(
  handler: (context: APIContext) => Promise<Response>,
  redirectPath?: string
) {
  return async (context: APIContext): Promise<Response> => {
    try {
      return await handler(context);
    } catch (error) {
      return handleError(error, context, redirectPath);
    }
  };
}

/**
 * Utility to assert conditions and throw validation errors
 */
export function assert(condition: boolean, message: string, context?: Record<string, any>): asserts condition {
  if (!condition) {
    throw new ValidationError(message, context);
  }
}

/**
 * Utility to assert that a value is not null/undefined
 */
export function assertExists<T>(
  value: T | null | undefined,
  message: string = 'Required value is missing'
): asserts value is T {
  if (value === null || value === undefined) {
    throw new ValidationError(message);
  }
}

/**
 * Convert any error to a standard error response (legacy)
 * @deprecated Use formatErrorResponse instead
 * T209: Properly typed - uses unknown instead of any
 */
export function normalizeError(error: unknown): {
  message: string;
  statusCode: number;
  code?: string;
} {
  if (isAppError(error)) {
    return {
      message: error.message,
      statusCode: error.statusCode,
      code: error.code,
    };
  }

  // Handle standard errors
  if (error instanceof Error) {
    return {
      message:
        process.env.NODE_ENV === 'production'
          ? 'Internal server error'
          : error.message,
      statusCode: 500,
      code: 'INTERNAL_ERROR',
    };
  }

  // Handle unknown errors
  return {
    message: 'An unknown error occurred',
    statusCode: 500,
    code: 'UNKNOWN_ERROR',
  };
}

/**
 * Error logger utility (legacy)
 * @deprecated Use handleError or log.error instead
 * T209: Properly typed - uses unknown instead of any
 */
export function logError(error: unknown, context?: Record<string, unknown>): void {
  const errorInfo = isAppError(error) ? error.toJSON() : { error };
  log.error('Error logged', { ...errorInfo, ...context });
}
