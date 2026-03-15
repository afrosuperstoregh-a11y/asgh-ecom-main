-- Migration 004: Remove Legacy Authentication Columns
-- This migration removes password-related columns from the users table
-- since authentication is now handled by Supabase Auth

-- First, backup any existing user data that might be needed
CREATE TABLE IF NOT EXISTS users_backup AS 
SELECT * FROM users WHERE 1=0;

-- Insert current users data into backup (if users table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') THEN
        INSERT INTO users_backup SELECT * FROM users;
    END IF;
END $$;

-- Remove password-related columns from users table (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') THEN
        -- Remove password hash column
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'password_hash') THEN
            ALTER TABLE users DROP COLUMN password_hash;
        END IF;
        
        -- Remove reset token columns
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'reset_token') THEN
            ALTER TABLE users DROP COLUMN reset_token;
        END IF;
        
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'reset_token_expiry') THEN
            ALTER TABLE users DROP COLUMN reset_token_expiry;
        END IF;
        
        -- Remove any other auth-related columns
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'email_verification_token') THEN
            ALTER TABLE users DROP COLUMN email_verification_token;
        END IF;
        
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'email_verification_expires') THEN
            ALTER TABLE users DROP COLUMN email_verification_expires;
        END IF;
        
        -- Add a foreign key reference to auth.users if users table is kept
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'auth_user_id') THEN
            ALTER TABLE users ADD COLUMN auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        END IF;
        
        -- Create index on the new foreign key
        CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);
        
        -- Add comment
        COMMENT ON COLUMN users.auth_user_id IS 'Reference to Supabase auth.users.id - replaces legacy authentication';
    END IF;
END $$;

-- Create a migration log entry
-- INSERT INTO migration_log (migration_file, executed_at, status) 
-- VALUES ('004_remove_legacy_auth_columns.sql', CURRENT_TIMESTAMP, 'completed')
-- ON CONFLICT (migration_file) DO UPDATE SET 
-- executed_at = CURRENT_TIMESTAMP, 
-- status = 'completed';

-- Add comments for documentation
COMMENT ON TABLE users_backup IS 'Backup of legacy users table before Supabase Auth migration';
COMMENT ON TABLE users IS 'Legacy users table - now linked to Supabase auth.users via auth_user_id';
