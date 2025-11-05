-- Migration: Fix CASCADE DELETE constraints to prevent financial data loss
-- Task: T197 - Security Fix
-- Date: 2025-11-03
-- Description: Changes CASCADE DELETE to RESTRICT for orders and bookings tables
--              to prevent accidental deletion of financial records
--
-- CRITICAL: This migration MUST be run before deploying to production
-- Run with: psql $DATABASE_URL -f database/migrations/001_fix_cascade_deletes.sql

\echo '========================================='
\echo 'Migration: Fix CASCADE DELETE constraints'
\echo 'Task: T197 - Security Fix'
\echo 'Date: 2025-11-03'
\echo '========================================='
\echo ''

BEGIN;

-- Check if we're in the right database
\echo 'Verifying database connection...'
SELECT current_database() AS database_name, version() AS postgresql_version;

\echo ''
\echo 'Step 1: Backing up current constraint information...'

-- Show current constraints before migration
\echo 'Current foreign key constraints on orders table:'
SELECT
    conname AS constraint_name,
    pg_get_constraintdef(c.oid) AS constraint_definition
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
WHERE t.relname = 'orders'
  AND c.contype = 'f';

\echo ''
\echo 'Step 2: Dropping old CASCADE constraints...'

-- Drop the old foreign key constraint on orders.user_id
-- Note: The exact constraint name might vary, so we use a query to find it
DO $$
DECLARE
    constraint_name_var TEXT;
BEGIN
    -- Find the constraint name for orders.user_id -> users.id
    SELECT conname INTO constraint_name_var
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(c.conkey)
    WHERE t.relname = 'orders'
      AND a.attname = 'user_id'
      AND c.contype = 'f';

    IF constraint_name_var IS NOT NULL THEN
        EXECUTE format('ALTER TABLE orders DROP CONSTRAINT IF EXISTS %I CASCADE', constraint_name_var);
        RAISE NOTICE 'Dropped constraint % on orders.user_id', constraint_name_var;
    ELSE
        RAISE NOTICE 'No constraint found on orders.user_id (may already be migrated)';
    END IF;
END $$;

\echo 'Step 3: Adding new RESTRICT constraint to orders table...'

-- Add new constraint with RESTRICT (prevents deletion of users with orders)
ALTER TABLE orders
    ADD CONSTRAINT orders_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE RESTRICT;

\echo '✓ Orders table updated: ON DELETE CASCADE → ON DELETE RESTRICT'

\echo ''
\echo 'Step 4: Dropping old CASCADE constraints on bookings...'

-- Drop the old foreign key constraint on bookings.user_id
DO $$
DECLARE
    constraint_name_var TEXT;
BEGIN
    SELECT conname INTO constraint_name_var
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(c.conkey)
    WHERE t.relname = 'bookings'
      AND a.attname = 'user_id'
      AND c.contype = 'f';

    IF constraint_name_var IS NOT NULL THEN
        EXECUTE format('ALTER TABLE bookings DROP CONSTRAINT IF EXISTS %I CASCADE', constraint_name_var);
        RAISE NOTICE 'Dropped constraint % on bookings.user_id', constraint_name_var;
    ELSE
        RAISE NOTICE 'No constraint found on bookings.user_id (may already be migrated)';
    END IF;
END $$;

\echo 'Step 5: Adding new RESTRICT constraint to bookings table...'

-- Add new constraint with RESTRICT
ALTER TABLE bookings
    ADD CONSTRAINT bookings_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE RESTRICT;

\echo '✓ Bookings table updated: ON DELETE CASCADE → ON DELETE RESTRICT'

\echo ''
\echo 'Step 6: Fixing download_logs table...'

-- Drop the old constraint on download_logs.user_id
DO $$
DECLARE
    constraint_name_var TEXT;
BEGIN
    SELECT conname INTO constraint_name_var
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(c.conkey)
    WHERE t.relname = 'download_logs'
      AND a.attname = 'user_id'
      AND c.contype = 'f';

    IF constraint_name_var IS NOT NULL THEN
        EXECUTE format('ALTER TABLE download_logs DROP CONSTRAINT IF EXISTS %I CASCADE', constraint_name_var);
        RAISE NOTICE 'Dropped constraint % on download_logs.user_id', constraint_name_var;
    ELSE
        RAISE NOTICE 'No constraint found on download_logs.user_id (may already be migrated)';
    END IF;
END $$;

\echo 'Step 7: Adding SET NULL constraint to download_logs...'

-- Change user_id to nullable first (if it's NOT NULL)
ALTER TABLE download_logs
    ALTER COLUMN user_id DROP NOT NULL;

-- Add new constraint with SET NULL
ALTER TABLE download_logs
    ADD CONSTRAINT download_logs_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE SET NULL;

\echo '✓ Download logs table updated: ON DELETE CASCADE → ON DELETE SET NULL'

\echo ''
\echo 'Step 8: Verifying new constraints...'

-- Verify the changes
\echo 'New foreign key constraints on orders table:'
SELECT
    conname AS constraint_name,
    pg_get_constraintdef(c.oid) AS constraint_definition
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
WHERE t.relname = 'orders'
  AND c.contype = 'f'
  AND conname LIKE '%user_id%';

\echo ''
\echo 'New foreign key constraints on bookings table:'
SELECT
    conname AS constraint_name,
    pg_get_constraintdef(c.oid) AS constraint_definition
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
WHERE t.relname = 'bookings'
  AND c.contype = 'f'
  AND conname LIKE '%user_id%';

\echo ''
\echo 'New foreign key constraints on download_logs table:'
SELECT
    conname AS constraint_name,
    pg_get_constraintdef(c.oid) AS constraint_definition
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
WHERE t.relname = 'download_logs'
  AND c.contype = 'f'
  AND conname LIKE '%user_id%';

\echo ''
\echo '========================================='
\echo 'Migration completed successfully!'
\echo '========================================='
\echo ''
\echo 'Summary of changes:'
\echo '  ✓ orders.user_id: CASCADE → RESTRICT'
\echo '  ✓ bookings.user_id: CASCADE → RESTRICT'
\echo '  ✓ download_logs.user_id: CASCADE → SET NULL (nullable)'
\echo ''
\echo 'Impact:'
\echo '  • Users with orders CANNOT be hard-deleted (financial records protected)'
\echo '  • Users with bookings CANNOT be hard-deleted (booking records protected)'
\echo '  • Download logs will preserve audit trail with NULL user_id'
\echo '  • Use soft delete (deleted_at column) for user account removal'
\echo ''
\echo 'Next steps:'
\echo '  1. Implement soft delete functionality in application code'
\echo '  2. Update user deletion endpoints to use deleted_at instead of DELETE'
\echo '  3. Add filters to exclude soft-deleted users from queries'
\echo ''

COMMIT;

\echo 'Transaction committed. Changes are now permanent.'
