-- Migration: Add password reset tokens table
-- Task: T203 - Password Reset Functionality
-- Created: 2025-11-03
--
-- This migration adds support for secure password reset functionality:
-- - Cryptographically secure tokens
-- - Time-limited tokens (1 hour expiration)
-- - One-time use enforcement
-- - Automatic cleanup of expired tokens

-- Create password_reset_tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT false NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

    -- Ensure token uniqueness
    CONSTRAINT unique_token UNIQUE (token),

    -- Ensure used_at is set only when used is true
    CONSTRAINT used_at_check CHECK (
        (used = false AND used_at IS NULL) OR
        (used = true AND used_at IS NOT NULL)
    )
);

-- Index for fast token lookup
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token
    ON password_reset_tokens(token);

-- Index for user lookups
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id
    ON password_reset_tokens(user_id);

-- Index for cleanup queries (find expired tokens)
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_created_at
    ON password_reset_tokens(created_at);

-- Index for checking unused tokens
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_used
    ON password_reset_tokens(used)
    WHERE used = false;

-- Comments for documentation
COMMENT ON TABLE password_reset_tokens IS
    'Stores password reset tokens for secure password recovery. Tokens expire after 1 hour and are single-use.';

COMMENT ON COLUMN password_reset_tokens.token IS
    'Cryptographically secure random token (32 bytes, base64url encoded)';

COMMENT ON COLUMN password_reset_tokens.expires_at IS
    'Token expiration time (1 hour from creation)';

COMMENT ON COLUMN password_reset_tokens.used IS
    'Whether token has been used to reset password';

COMMENT ON COLUMN password_reset_tokens.used_at IS
    'Timestamp when token was used (NULL if not used)';

-- Grant permissions (adjust role name as needed)
-- GRANT SELECT, INSERT, UPDATE ON password_reset_tokens TO your_app_user;
-- GRANT USAGE ON SEQUENCE password_reset_tokens_id_seq TO your_app_user;
