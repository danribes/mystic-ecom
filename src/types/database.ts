/**
 * Database Type Definitions (T209)
 *
 * Proper TypeScript types for database operations to replace 'any' types.
 * These types provide type safety for query parameters, results, and database rows.
 */

import type { QueryResult, PoolClient } from 'pg';

/**
 * Valid SQL parameter types
 * PostgreSQL supports these primitive types as query parameters
 */
export type SqlValue = string | number | boolean | null | Date | Buffer;

/**
 * Array of SQL parameters
 * Used for parameterized queries to prevent SQL injection
 */
export type SqlParams = SqlValue[];

/**
 * Generic database row type
 * Represents a row returned from a database query
 */
export type DatabaseRow = Record<string, unknown>;

/**
 * Type-safe query result
 * Wraps PostgreSQL QueryResult with proper typing
 */
export type TypedQueryResult<T = DatabaseRow> = QueryResult<T>;

/**
 * Transaction callback type
 * Function that executes within a database transaction
 */
export type TransactionCallback<T> = (client: PoolClient) => Promise<T>;

/**
 * Query builder value type
 * Used when building dynamic queries with conditional parameters
 */
export type QueryBuilderValue = SqlValue | SqlValue[];

/**
 * Update fields type
 * Represents fields to update in an UPDATE query
 */
export type UpdateFields = Record<string, SqlValue>;

/**
 * Filter conditions type
 * Represents WHERE clause conditions
 */
export type FilterConditions = Record<string, SqlValue | SqlValue[] | null | undefined>;

/**
 * Order by direction
 */
export type OrderDirection = 'ASC' | 'DESC' | 'asc' | 'desc';

/**
 * Order by clause
 */
export interface OrderBy {
  column: string;
  direction?: OrderDirection;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  limit?: number;
  offset?: number;
}

/**
 * Common query options
 */
export interface QueryOptions extends PaginationParams {
  orderBy?: OrderBy | OrderBy[];
}

/**
 * Database error with PostgreSQL error code
 */
export interface DatabaseError extends Error {
  code?: string;
  detail?: string;
  hint?: string;
  position?: string;
  internalPosition?: string;
  internalQuery?: string;
  where?: string;
  schema?: string;
  table?: string;
  column?: string;
  dataType?: string;
  constraint?: string;
  file?: string;
  line?: string;
  routine?: string;
}

/**
 * Type guard for database errors
 */
export function isDatabaseError(error: unknown): error is DatabaseError {
  return (
    error instanceof Error &&
    'code' in error &&
    typeof (error as DatabaseError).code === 'string'
  );
}

/**
 * Specific database row types for common tables
 * These provide type safety for specific table queries
 */

export interface UserRow extends DatabaseRow {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  role: string;
  email_verified: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
  whatsapp?: string | null;
  email_verification_token?: string | null;
  email_verification_expires?: Date | null;
}

export interface CourseRow extends DatabaseRow {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: string;
  instructor_id: string;
  level: string;
  duration: number;
  language: string;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface OrderRow extends DatabaseRow {
  id: string;
  user_id: string;
  total: string;
  status: string;
  stripe_session_id: string | null;
  stripe_payment_intent: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface OrderItemRow extends DatabaseRow {
  id: string;
  order_id: string;
  item_type: string;
  item_id: string;
  quantity: number;
  price: string;
  created_at: Date;
}

export interface ProductRow extends DatabaseRow {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: string;
  product_type: string;
  file_url: string | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface EventRow extends DatabaseRow {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: string;
  date: Date;
  location: string;
  capacity: number;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface ReviewRow extends DatabaseRow {
  id: string;
  user_id: string;
  item_type: string;
  item_id: string;
  rating: number;
  comment: string;
  status: string;
  created_at: Date;
  updated_at: Date;
}
