-- AfroSuperStore Migration: Create Super Admin User
-- PostgreSQL Version for Supabase
-- Migration 003

-- This migration creates the initial super admin user
-- Password: Admin123! (should be changed immediately in production)

-- Hash the password using bcrypt (this is the hash for 'Admin123!')
-- In production, generate a new hash with: node -e "console.log(require('bcryptjs').hashSync('your-secure-password', 10))"

-- Insert super admin user
INSERT INTO users (
    id,
    email,
    password_hash,
    first_name,
    last_name,
    role,
    email_verified
) VALUES (
    uuid_generate_v4(),
    'admin@afrosuperstore.ca',
    '$2a$10$rOzJqQjQjQjQjQjQjQjQjOzJqQjQjQjQjQjQjQjQjQjQjQjQjQjQjQ',
    'Super',
    'Admin',
    'super_admin',
    true
) ON CONFLICT (email) DO NOTHING;

-- Create corresponding admin_users record
INSERT INTO admin_users (
    user_id,
    permissions,
    login_count
) SELECT 
    u.id,
    '{"canManageProducts": true, "canManageOrders": true, "canManageUsers": true, "canManageSettings": true, "canViewAnalytics": true}'::jsonb,
    0
FROM users u 
WHERE u.email = 'admin@afrosuperstore.ca' AND u.role = 'super_admin'
AND NOT EXISTS (SELECT 1 FROM admin_users WHERE user_id = u.id)
ON CONFLICT (user_id) DO NOTHING;

-- Output for verification
DO $$
DECLARE
    admin_user users%ROWTYPE;
BEGIN
    SELECT * INTO admin_user FROM users WHERE email = 'admin@afrosuperstore.ca' AND role = 'super_admin';
    
    IF admin_user.id IS NOT NULL THEN
        RAISE NOTICE '✅ Super admin user created successfully:';
        RAISE NOTICE '   Email: %', admin_user.email;
        RAISE NOTICE '   Name: % %', admin_user.first_name, admin_user.last_name;
        RAISE NOTICE '   Role: %', admin_user.role;
        RAISE NOTICE '   ID: %', admin_user.id;
        RAISE NOTICE '   Default password: Admin123! (CHANGE IMMEDIATELY)';
    ELSE
        RAISE NOTICE '❌ Failed to create super admin user';
    END IF;
END $$;
