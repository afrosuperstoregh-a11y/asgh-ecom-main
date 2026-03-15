-- Add password reset columns to users table
-- Migration for adding secure password reset functionality

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP;

-- Create index for faster reset token lookups
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token);

-- Create index for token expiry cleanup
CREATE INDEX IF NOT EXISTS idx_users_reset_token_expiry ON users(reset_token_expiry);

-- Add comment for documentation
COMMENT ON COLUMN users.reset_token IS 'Secure token for password reset (expires in 1 hour)';
COMMENT ON COLUMN users.reset_token_expiry IS 'Expiry timestamp for password reset token';
