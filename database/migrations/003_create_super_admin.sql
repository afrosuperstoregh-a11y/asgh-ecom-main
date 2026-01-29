-- Create Super Admin User for AfroSuperStore
-- SECURITY: This file is for reference only
-- Actual admin creation should use environment variables

-- Hash the password (using bcrypt)
-- Replace with your own hashed password
-- Generate with: node -e "console.log(require('bcryptjs').hashSync('your-password', 10))"

-- Example: INSERT INTO users (
--     email,
--     password_hash,
--     first_name,
--     last_name,
--     role,
--     email_verified
-- ) VALUES (
--     'admin@yourdomain.com',
--     '$2a$10$your_bcrypt_hashed_password_here',
--     'Super',
--     'Admin',
--     'super_admin',
--     true
-- ) ON CONFLICT (email) DO NOTHING;

-- For production use:
-- 1. Set environment variables: ADMIN_EMAIL and ADMIN_PASSWORD
-- 2. Run: node create_supabase_auth_admin.js
-- 3. This will securely create the admin user with proper password hashing
