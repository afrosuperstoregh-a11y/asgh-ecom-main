-- PHASE 10: Remove Hardcoded Credentials - Create Admin User
-- Migration: 006_create_admin_user.sql
-- Purpose: Create initial admin user using environment variables
-- Replaces hardcoded password migration with secure environment variable approach
--
-- REQUIRED ENVIRONMENT VARIABLES:
-- - ADMIN_EMAIL: Admin user email address
-- - ADMIN_PASSWORD: Admin user password (will be hashed)
-- - ADMIN_FIRST_NAME: Admin first name (optional, defaults to 'Admin')
-- - ADMIN_LAST_NAME: Admin last name (optional, defaults to 'User')

BEGIN;

-- ============================================================================
-- SECURITY FUNCTION: HASH PASSWORD
-- ============================================================================

CREATE OR REPLACE FUNCTION hash_password(plain_text TEXT)
RETURNS TEXT AS $$
BEGIN
    -- Use pgcrypto for secure password hashing
    RETURN crypt(plain_text, gen_salt('bf'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- CREATE ADMIN USER VIA SUPABASE AUTH
-- ============================================================================

-- This function creates an admin user through Supabase Auth
-- It should be called from the application layer, not directly in SQL
-- The SQL below is for reference only

-- Application should call:
-- POST /auth/v1/admin/users
-- {
--   "email": $ADMIN_EMAIL,
--   "password": $ADMIN_PASSWORD,
--   "email_confirm": true,
--   "user_metadata": {
--     "first_name": $ADMIN_FIRST_NAME,
--     "last_name": $ADMIN_LAST_NAME,
--     "role": "super_admin"
--   }
-- }

-- ============================================================================
-- CREATE ADMIN PROFILE (AFTER USER CREATION)
-- ============================================================================

-- This will be triggered automatically by the sync_user_profile() trigger
-- when the user is created through Supabase Auth

-- ============================================================================
-- CREATE ADMIN USERS RECORD
-- ============================================================================

CREATE OR REPLACE FUNCTION ensure_admin_user()
RETURNS VOID AS $$
DECLARE
    admin_profile_id UUID;
BEGIN
    -- Get the profile ID for the admin user
    SELECT p.id INTO admin_profile_id
    FROM profiles p
    JOIN auth.users u ON p.user_id = u.id
    WHERE u.email = current_setting('admin.email', true)
    AND p.role = 'super_admin';
    
    -- If profile exists, ensure admin_users record exists
    IF admin_profile_id IS NOT NULL THEN
        INSERT INTO admin_users (user_id, permissions, login_count)
        VALUES (
            admin_profile_id,
            '{
                "canManageProducts": true,
                "canManageOrders": true,
                "canManageUsers": true,
                "canManageSettings": true,
                "canViewAnalytics": true,
                "canManageCRM": true,
                "canManageMarketing": true
            }'::jsonb,
            0
        )
        ON CONFLICT (user_id) DO NOTHING;
        
        RAISE NOTICE '✅ Admin user created successfully: %', current_setting('admin.email', true);
    ELSE
        RAISE WARNING '⚠️  Admin profile not found. Please create user through Supabase Auth first.';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- MANUAL ADMIN CREATION (FOR DEVELOPMENT ONLY)
-- ============================================================================

-- WARNING: This is for development/testing only
-- DO NOT use in production without proper authentication

-- To create admin user manually in development:
-- 1. Set environment variables
-- 2. Run: SELECT create_admin_user_dev();

CREATE OR REPLACE FUNCTION create_admin_user_dev()
RETURNS VOID AS $$
DECLARE
    admin_email TEXT := current_setting('admin.email', true);
    admin_password TEXT := current_setting('admin.password', true);
    admin_first_name TEXT := COALESCE(current_setting('admin.first_name', true), 'Admin');
    admin_last_name TEXT := COALESCE(current_setting('admin.last_name', true), 'User');
    new_user_id UUID;
    new_profile_id UUID;
BEGIN
    -- Validate environment variables are set
    IF admin_email IS NULL OR admin_email = '' THEN
        RAISE EXCEPTION 'ADMIN_EMAIL environment variable not set';
    END IF;
    
    IF admin_password IS NULL OR admin_password = '' THEN
        RAISE EXCEPTION 'ADMIN_PASSWORD environment variable not set';
    END IF;
    
    -- Check if user already exists
    SELECT p.id INTO new_profile_id
    FROM profiles p
    JOIN auth.users u ON p.user_id = u.id
    WHERE u.email = admin_email;
    
    IF new_profile_id IS NOT NULL THEN
        RAISE NOTICE 'Admin user already exists: %', admin_email;
        RETURN;
    END IF;
    
    -- Create user through Supabase Auth (requires service role)
    -- This should be done via API, not direct SQL
    -- For development, we'll create the profile directly
    
    -- Generate UUID for profile
    new_profile_id := gen_random_uuid();
    
    -- Create profile (user will be linked to auth.users later)
    INSERT INTO profiles (
        id,
        user_id,
        first_name,
        last_name,
        role,
        email_verified
    ) VALUES (
        new_profile_id,
        gen_random_uuid(), -- Temporary, will be updated when auth user is created
        admin_first_name,
        admin_last_name,
        'super_admin',
        true
    )
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Create admin_users record
    INSERT INTO admin_users (user_id, permissions, login_count)
    VALUES (
        new_profile_id,
        '{
            "canManageProducts": true,
            "canManageOrders": true,
            "canManageUsers": true,
            "canManageSettings": true,
            "canViewAnalytics": true,
            "canManageCRM": true,
            "canManageMarketing": true
        }'::jsonb,
        0
    )
    ON CONFLICT (user_id) DO NOTHING;
    
    RAISE NOTICE '⚠️  Development admin profile created: %', admin_email;
    RAISE NOTICE '⚠️  Please create Supabase Auth user and link to profile ID: %', new_profile_id;
    RAISE NOTICE '⚠️  UPDATE profiles SET user_id = auth_user_id WHERE id = %', new_profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- VALIDATION FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_admin_setup()
RETURNS TABLE (
    has_admin_email BOOLEAN,
    has_admin_password BOOLEAN,
    admin_user_exists BOOLEAN,
    admin_profile_exists BOOLEAN,
    admin_users_record_exists BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        current_setting('admin.email', true) IS NOT NULL AND current_setting('admin.email', true) != '' as has_admin_email,
        current_setting('admin.password', true) IS NOT NULL AND current_setting('admin.password', true) != '' as has_admin_password,
        EXISTS (
            SELECT 1 FROM auth.users u 
            WHERE u.email = current_setting('admin.email', true)
        ) as admin_user_exists,
        EXISTS (
            SELECT 1 FROM profiles p
            JOIN auth.users u ON p.user_id = u.id
            WHERE u.email = current_setting('admin.email', true)
            AND p.role = 'super_admin'
        ) as admin_profile_exists,
        EXISTS (
            SELECT 1 FROM admin_users au
            JOIN profiles p ON au.user_id = p.id
            JOIN auth.users u ON p.user_id = u.id
            WHERE u.email = current_setting('admin.email', true)
        ) as admin_users_record_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- DOCUMENTATION
-- ============================================================================

COMMENT ON FUNCTION hash_password(TEXT) IS 'Securely hash a password using bcrypt (pgcrypto)';
COMMENT ON FUNCTION ensure_admin_user() IS 'Ensure admin user has admin_users record after Supabase Auth creation';
COMMENT ON FUNCTION create_admin_user_dev() IS 'DEVELOPMENT ONLY: Create admin user profile (requires manual Supabase Auth linkage)';
COMMENT ON FUNCTION validate_admin_setup() IS 'Validate admin user setup and environment variables';

-- ============================================================================
-- MIGRATION LOG ENTRY
-- ============================================================================

INSERT INTO migration_log (migration_name, executed_at, success, checksum)
VALUES ('006_create_admin_user.sql', NOW(), true, md5(current_timestamp::text))
ON CONFLICT (migration_name) DO UPDATE SET
    executed_at = NOW(),
    success = true;

COMMIT;

-- ============================================================================
-- POST-MIGRATION NOTES
-- ============================================================================
--
-- This migration replaces hardcoded password creation with environment variables.
--
-- PRODUCTION USAGE:
-- 1. Set environment variables:
--    - ADMIN_EMAIL=admin@yourdomain.com
--    - ADMIN_PASSWORD=secure_password_here
--    - ADMIN_FIRST_NAME=Admin
--    - ADMIN_LAST_NAME=User
--
-- 2. Create user through Supabase Auth API:
--    POST /auth/v1/admin/users
--    {
--      "email": $ADMIN_EMAIL,
--      "password": $ADMIN_PASSWORD,
--      "email_confirm": true,
--      "user_metadata": {
--        "first_name": $ADMIN_FIRST_NAME,
--        "last_name": $ADMIN_LAST_NAME,
--        "role": "super_admin"
--      }
--    }
--
-- 3. Run ensure_admin_user() to create admin_users record:
--    SELECT ensure_admin_user();
--
-- 4. Validate setup:
--    SELECT * FROM validate_admin_setup();
--
-- DEVELOPMENT USAGE:
-- 1. Set environment variables
-- 2. Run: SELECT create_admin_user_dev();
-- 3. Manually create Supabase Auth user and link to profile
--
-- SECURITY NOTES:
-- - Never commit environment variables to version control
-- - Use strong passwords (minimum 12 characters, mixed case, numbers, symbols)
-- - Change default admin password immediately after first login
-- - Enable two-factor authentication for admin accounts
-- - Regularly rotate admin credentials
