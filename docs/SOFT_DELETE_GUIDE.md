# Soft Delete Implementation Guide

**Created**: 2025-11-03
**Task**: T197 - Database CASCADE Delete Fix
**Status**: Implemented in schema, needs application code updates

---

## Overview

After fixing the CASCADE DELETE issue (T197), users with orders or bookings **cannot be hard-deleted** from the database. This guide explains the soft delete pattern and how to implement it in the application.

---

## What is Soft Delete?

**Soft delete** marks a record as deleted without removing it from the database:

```sql
-- ❌ Hard delete (removes record permanently)
DELETE FROM users WHERE id = '123';

-- ✅ Soft delete (marks as deleted)
UPDATE users SET deleted_at = CURRENT_TIMESTAMP WHERE id = '123';
```

**Benefits**:
- Financial records preserved (orders, bookings)
- Audit trail maintained
- Data recovery possible
- Compliance with legal requirements
- Analytics on deleted accounts

---

## Database Schema

The `users` table already has soft delete support:

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,  -- NULL = active
    -- ... other columns
);

CREATE INDEX idx_users_deleted_at ON users(deleted_at);
```

**States**:
- `deleted_at IS NULL` = Active user
- `deleted_at IS NOT NULL` = Soft-deleted user

---

## Foreign Key Constraints (After T197 Fix)

### RESTRICT (Cannot Delete)
These tables prevent user deletion entirely:

```sql
-- orders.user_id → users.id (ON DELETE RESTRICT)
-- Cannot delete user with orders (financial records)

-- bookings.user_id → users.id (ON DELETE RESTRICT)
-- Cannot delete user with bookings (payment records)
```

**Result**: Users with orders or bookings can ONLY be soft-deleted.

### SET NULL (Preserves Logs)
```sql
-- download_logs.user_id → users.id (ON DELETE SET NULL)
-- Preserves download audit trail with anonymous user
```

### CASCADE (Can Delete)
These are acceptable to cascade:
```sql
-- cart_items.user_id (temporary data)
-- course_progress.user_id (learning progress)
-- lesson_progress.user_id (learning progress)
-- reviews.user_id (user-generated content)
```

---

## Implementation Guide

### 1. User Deletion Endpoint

Update `/api/user/delete` or admin user management:

```typescript
// src/pages/api/user/[id]/delete.ts

import pool from '@/lib/db';

export async function DELETE({ params }) {
  const { id } = params;

  try {
    // Attempt soft delete
    const result = await pool.query(
      `UPDATE users
       SET deleted_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       AND deleted_at IS NULL
       RETURNING id, email, name`,
      [id]
    );

    if (result.rows.length === 0) {
      return new Response(JSON.stringify({
        error: 'User not found or already deleted'
      }), { status: 404 });
    }

    const user = result.rows[0];

    return new Response(JSON.stringify({
      success: true,
      message: `User ${user.email} has been soft-deleted`,
      deletedUser: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    }), { status: 200 });

  } catch (error) {
    // Handle RESTRICT constraint violation
    if (error.code === '23503') {
      return new Response(JSON.stringify({
        error: 'Cannot delete user with active orders or bookings. User has been soft-deleted instead.',
        details: 'Financial records must be preserved for legal compliance.'
      }), { status: 409 });
    }

    console.error('User deletion error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to delete user'
    }), { status: 500 });
  }
}
```

### 2. Exclude Soft-Deleted Users from Queries

Update user query functions:

```typescript
// src/lib/users.ts

export async function getUsers(includeDeleted = false) {
  const whereClause = includeDeleted ? '' : 'WHERE deleted_at IS NULL';

  const result = await pool.query(`
    SELECT id, email, name, role, created_at
    FROM users
    ${whereClause}
    ORDER BY created_at DESC
  `);

  return result.rows;
}

export async function getUserById(id: string, includeDeleted = false) {
  const whereClause = includeDeleted
    ? 'WHERE id = $1'
    : 'WHERE id = $1 AND deleted_at IS NULL';

  const result = await pool.query(`
    SELECT id, email, name, role, whatsapp, created_at, deleted_at
    FROM users
    ${whereClause}
  `, [id]);

  return result.rows[0] || null;
}
```

### 3. Prevent Login for Soft-Deleted Users

Update authentication:

```typescript
// src/pages/api/auth/login.ts

export async function POST({ request }) {
  const { email, password } = await request.json();

  // Check user exists and is NOT soft-deleted
  const result = await pool.query(
    `SELECT id, email, password_hash, name, role
     FROM users
     WHERE email = $1 AND deleted_at IS NULL`, // ← Important!
    [email]
  );

  if (result.rows.length === 0) {
    return new Response(JSON.stringify({
      error: 'Invalid email or password'
    }), { status: 401 });
  }

  // ... continue with password verification
}
```

### 4. Handle Email Uniqueness

**Problem**: Soft-deleted user email blocks new registrations.

**Solutions**:

**Option A: Partial Unique Index** (Recommended)
```sql
-- Drop existing unique constraint
ALTER TABLE users DROP CONSTRAINT users_email_key;

-- Create partial unique index (only for active users)
CREATE UNIQUE INDEX users_email_unique_active
ON users(email)
WHERE deleted_at IS NULL;
```

**Option B: Modify Email on Soft Delete**
```typescript
// When soft-deleting, append timestamp to email
await pool.query(
  `UPDATE users
   SET deleted_at = CURRENT_TIMESTAMP,
       email = email || '.deleted.' || EXTRACT(EPOCH FROM CURRENT_TIMESTAMP)
   WHERE id = $1`,
  [userId]
);
// Example: user@example.com → user@example.com.deleted.1699123456
```

### 5. Admin Interface Updates

Add soft delete indicator:

```astro
<!-- src/pages/admin/users/index.astro -->

{users.map(user => (
  <tr>
    <td>{user.email}</td>
    <td>{user.name}</td>
    <td>
      {user.deleted_at ? (
        <span class="badge badge-danger">Deleted</span>
      ) : (
        <span class="badge badge-success">Active</span>
      )}
    </td>
    <td>
      {user.deleted_at ? (
        <button onclick="restoreUser('{user.id}')">
          Restore
        </button>
      ) : (
        <button onclick="deleteUser('{user.id}')">
          Delete
        </button>
      )}
    </td>
  </tr>
))}
```

### 6. Restore Functionality (Optional)

```typescript
// src/pages/api/user/[id]/restore.ts

export async function POST({ params }) {
  const { id } = params;

  const result = await pool.query(
    `UPDATE users
     SET deleted_at = NULL,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $1
     AND deleted_at IS NOT NULL
     RETURNING id, email, name`,
    [id]
  );

  if (result.rows.length === 0) {
    return new Response(JSON.stringify({
      error: 'User not found or not deleted'
    }), { status: 404 });
  }

  return new Response(JSON.stringify({
    success: true,
    message: 'User restored successfully',
    user: result.rows[0]
  }), { status: 200 });
}
```

---

## Query Patterns

### Safe Query Pattern

Always filter out soft-deleted users unless explicitly needed:

```typescript
// ✅ CORRECT - Excludes soft-deleted
const users = await pool.query(`
  SELECT * FROM users
  WHERE deleted_at IS NULL
`);

// ✅ CORRECT - Include deleted for admin view
const allUsers = await pool.query(`
  SELECT *,
         CASE WHEN deleted_at IS NULL THEN 'active' ELSE 'deleted' END as status
  FROM users
  ORDER BY deleted_at NULLS FIRST
`);

// ❌ INCORRECT - Includes soft-deleted users
const users = await pool.query(`SELECT * FROM users`);
```

### Checking Orders Before Delete

```typescript
// Check if user has orders
const orderCheck = await pool.query(
  'SELECT COUNT(*) as count FROM orders WHERE user_id = $1',
  [userId]
);

if (parseInt(orderCheck.rows[0].count) > 0) {
  // User has orders - can only soft delete
  return softDeleteUser(userId);
}
```

---

## GDPR Compliance

### Right to Be Forgotten

**Challenge**: GDPR requires data deletion, but we need financial records.

**Solution**: Anonymize personal data while preserving financial records.

```typescript
export async function anonymizeUser(userId: string) {
  await pool.query(`
    UPDATE users
    SET
      email = 'deleted-' || id || '@anonymous.local',
      name = 'Deleted User',
      password_hash = 'DELETED',
      whatsapp = NULL,
      deleted_at = CURRENT_TIMESTAMP
    WHERE id = $1
  `, [userId]);

  // Orders and bookings remain with anonymized user reference
  // Financial records preserved for legal/tax requirements
}
```

---

## Testing

### Test Scenarios

```typescript
describe('Soft Delete', () => {
  it('should prevent hard delete of user with orders', async () => {
    // Create user with order
    const user = await createTestUser();
    const order = await createTestOrder(user.id);

    // Attempt to delete user
    const response = await DELETE(`/api/user/${user.id}`);

    // Should soft delete instead
    expect(response.status).toBe(200);

    // Verify user soft-deleted
    const deletedUser = await getUserById(user.id, true);
    expect(deletedUser.deleted_at).not.toBeNull();

    // Verify order still exists
    const orderCheck = await getOrderById(order.id);
    expect(orderCheck).toBeDefined();
  });

  it('should exclude soft-deleted users from login', async () => {
    const user = await createTestUser();
    await softDeleteUser(user.id);

    const response = await POST('/api/auth/login', {
      email: user.email,
      password: 'password123'
    });

    expect(response.status).toBe(401);
  });
});
```

---

## Migration Checklist

- [x] Update database schema (T197 - Done)
- [x] Create migration script (001_fix_cascade_deletes.sql - Done)
- [ ] Run migration on production database
- [ ] Update user deletion endpoints to soft delete
- [ ] Add deleted_at filter to all user queries
- [ ] Update authentication to exclude soft-deleted users
- [ ] Fix email uniqueness (partial index or rename on delete)
- [ ] Add soft delete indicator in admin interface
- [ ] Implement restore functionality (optional)
- [ ] Update GDPR data export to handle soft-deleted users
- [ ] Test all scenarios
- [ ] Document in API docs

---

## Monitoring

### Queries to Monitor

```sql
-- Count soft-deleted users
SELECT COUNT(*) as soft_deleted_users
FROM users
WHERE deleted_at IS NOT NULL;

-- Recent deletions
SELECT id, email, name, deleted_at
FROM users
WHERE deleted_at IS NOT NULL
ORDER BY deleted_at DESC
LIMIT 10;

-- Users who can't be deleted (have orders)
SELECT u.id, u.email, COUNT(o.id) as order_count
FROM users u
JOIN orders o ON o.user_id = u.id
WHERE u.deleted_at IS NULL
GROUP BY u.id, u.email
HAVING COUNT(o.id) > 0;
```

---

## Summary

**Key Changes** (T197):
- ✅ Orders and bookings use ON DELETE RESTRICT
- ✅ Download logs use ON DELETE SET NULL
- ✅ Users table has deleted_at column (already implemented)
- ✅ Migration script created

**Next Steps**:
1. Run migration on database
2. Update application code to use soft delete
3. Test thoroughly before production

**Benefits**:
- Financial records protected
- Legal compliance maintained
- Data recovery possible
- Audit trail preserved

---

**Last Updated**: 2025-11-03
**See Also**:
- `database/migrations/001_fix_cascade_deletes.sql`
- `docs/SECURITY.md` (T197)
