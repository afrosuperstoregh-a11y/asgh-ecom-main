-- Test Data Preparation Script for Staging
-- Purpose: Prepare staging database with production-like test data for migration testing
-- This script should be run AFTER canonical schema is applied and BEFORE migration 004
--
-- Usage:
--   psql -h staging-host -U staging-user -d staging-db -f 004_prepare_test_data.sql

BEGIN;

-- ============================================================================
-- STEP 1: CREATE LEGACY USERS TABLE (Simulates old schema)
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'super_admin', 'vendor')),
    email_verified BOOLEAN DEFAULT false,
    auth_user_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);

RAISE NOTICE '✅ Created legacy users table';

-- ============================================================================
-- STEP 2: INSERT TEST USERS
-- ============================================================================

-- Insert test customers
INSERT INTO users (email, first_name, last_name, phone, role, email_verified) VALUES
('customer1@example.com', 'John', 'Doe', '+233201234567', 'customer', true),
('customer2@example.com', 'Jane', 'Smith', '+233201234568', 'customer', true),
('customer3@example.com', 'Kwame', 'Owusu', '+233201234569', 'customer', false),
('customer4@example.com', 'Ama', 'Mensa', '+233201234570', 'customer', true),
('customer5@example.com', 'Kojo', 'Ansah', '+233201234571', 'customer', true)
ON CONFLICT (email) DO NOTHING;

-- Insert test admin users
INSERT INTO users (email, first_name, last_name, phone, role, email_verified) VALUES
('admin1@example.com', 'Admin', 'User', '+233201234580', 'admin', true),
('superadmin@example.com', 'Super', 'Admin', '+233201234581', 'super_admin', true)
ON CONFLICT (email) DO NOTHING;

RAISE NOTICE '✅ Inserted test users';

-- ============================================================================
-- STEP 3: CREATE TEST AUTH USERS (if auth schema exists)
-- ============================================================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.schemata 
        WHERE schema_name = 'auth'
    ) THEN
        -- Insert test auth users
        INSERT INTO auth.users (id, email, email_confirmed_at, created_at) VALUES
        ('550e8400-e29b-41d4-a716-446655440001', 'customer1@example.com', NOW(), NOW()),
        ('550e8400-e29b-41d4-a716-446655440002', 'customer2@example.com', NOW(), NOW()),
        ('550e8400-e29b-41d4-a716-446655440003', 'admin1@example.com', NOW(), NOW()),
        ('550e8400-e29b-41d4-a716-446655440004', 'superadmin@example.com', NOW(), NOW())
        ON CONFLICT (id) DO NOTHING;
        
        -- Link legacy users to auth users
        UPDATE users SET auth_user_id = '550e8400-e29b-41d4-a716-446655440001' WHERE email = 'customer1@example.com';
        UPDATE users SET auth_user_id = '550e8400-e29b-41d4-a716-446655440002' WHERE email = 'customer2@example.com';
        UPDATE users SET auth_user_id = '550e8400-e29b-41d4-a716-446655440003' WHERE email = 'admin1@example.com';
        UPDATE users SET auth_user_id = '550e8400-e29b-41d4-a716-446655440004' WHERE email = 'superadmin@example.com';
        
        RAISE NOTICE '✅ Created test auth users and linked to legacy users';
    ELSE
        RAISE NOTICE 'ℹ️  Auth schema not found - skipping auth user creation';
    END IF;
END $$;

-- ============================================================================
-- STEP 4: ADD LEGACY COLUMNS TO ORDERS (Simulates old schema)
-- ============================================================================

ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_id UUID;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10,2);

RAISE NOTICE '✅ Added legacy columns to orders table';

-- ============================================================================
-- STEP 5: ADD LEGACY COLUMNS TO ORDER_ITEMS (Simulates old schema)
-- ============================================================================

ALTER TABLE order_items ADD COLUMN IF NOT EXISTS unit_price DECIMAL(10,2);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS total_price DECIMAL(10,2);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_name VARCHAR(255);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_sku VARCHAR(100);

RAISE NOTICE '✅ Added legacy columns to order_items table';

-- ============================================================================
-- STEP 6: ADD LEGACY COLUMNS TO PAYMENTS (Simulates old schema)
-- ============================================================================

ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_intent_id TEXT;

RAISE NOTICE '✅ Added legacy columns to payments table';

-- ============================================================================
-- STEP 7: ADD LEGACY COLUMNS TO CART (Simulates old schema)
-- ============================================================================

ALTER TABLE cart ADD COLUMN IF NOT EXISTS customer_id UUID;

RAISE NOTICE '✅ Added legacy column to cart table';

-- ============================================================================
-- STEP 8: ADD LEGACY COLUMNS TO REVIEWS (Simulates old schema)
-- ============================================================================

ALTER TABLE reviews ADD COLUMN IF NOT EXISTS customer_id UUID;

RAISE NOTICE '✅ Added legacy column to reviews table';

-- ============================================================================
-- STEP 9: POPULATE LEGACY COLUMNS WITH TEST DATA
-- ============================================================================

-- Populate orders with customer_id (using user_id as source)
UPDATE orders 
SET customer_id = user_id 
WHERE customer_id IS NULL AND user_id IS NOT NULL;

-- Populate orders with email (using guest_email as source)
UPDATE orders 
SET email = guest_email 
WHERE email IS NULL AND guest_email IS NOT NULL;

-- Populate orders with total_amount (using total as source)
UPDATE orders 
SET total_amount = total 
WHERE total_amount IS NULL AND total IS NOT NULL;

-- Populate order_items with unit_price (using price as source)
UPDATE order_items 
SET unit_price = price 
WHERE unit_price IS NULL AND price IS NOT NULL;

-- Populate order_items with total_price (using total as source)
UPDATE order_items 
SET total_price = total 
WHERE total_price IS NULL AND total IS NOT NULL;

-- Populate order_items with product_name from products table
UPDATE order_items 
SET product_name = p.name 
FROM products p
WHERE order_items.product_name IS NULL 
AND order_items.product_id = p.id;

-- Populate order_items with product_sku from products table
UPDATE order_items 
SET product_sku = p.sku 
FROM products p
WHERE order_items.product_sku IS NULL 
AND order_items.product_id = p.id;

-- Populate payments with payment_method (using provider as source)
UPDATE payments 
SET payment_method = provider 
WHERE payment_method IS NULL AND provider IS NOT NULL;

-- Populate payments with payment_intent_id (using provider_id as source)
UPDATE payments 
SET payment_intent_id = provider_id 
WHERE payment_intent_id IS NULL AND provider_id IS NOT NULL;

-- Populate cart with customer_id (using user_id as source)
UPDATE cart 
SET customer_id = user_id 
WHERE customer_id IS NULL AND user_id IS NOT NULL;

-- Populate reviews with customer_id (using user_id as source)
UPDATE reviews 
SET customer_id = user_id 
WHERE customer_id IS NULL AND user_id IS NOT NULL;

RAISE NOTICE '✅ Populated legacy columns with test data';

-- ============================================================================
-- STEP 10: CREATE TEST ORDERS WITH LEGACY customer_id
-- ============================================================================

-- Get a test user ID to use for orders
DO $$
DECLARE
    v_test_user_id UUID;
    v_test_profile_id UUID;
BEGIN
    -- Get a legacy user ID
    SELECT id INTO v_test_user_id FROM users LIMIT 1;
    
    -- Get or create a profile for this user
    SELECT id INTO v_test_profile_id FROM profiles LIMIT 1;
    
    IF v_test_profile_id IS NULL THEN
        -- Create a test profile
        INSERT INTO profiles (user_id, first_name, last_name, role, email_verified)
        VALUES (v_test_user_id, 'Test', 'User', 'customer', true)
        RETURNING id INTO v_test_profile_id;
    END IF;
    
    -- Insert test orders with customer_id set
    INSERT INTO orders (
        order_number, user_id, customer_id, guest_email, status, 
        subtotal, tax_amount, shipping_amount, total, payment_status
    ) VALUES
    ('ORD-TEST-001', v_test_profile_id, v_test_user_id, 'test@example.com', 'pending', 
     100.00, 10.00, 5.00, 115.00, 'pending'),
    ('ORD-TEST-002', v_test_profile_id, v_test_user_id, 'test@example.com', 'confirmed', 
     200.00, 20.00, 10.00, 230.00, 'completed'),
    ('ORD-TEST-003', v_test_profile_id, v_test_user_id, 'test@example.com', 'shipped', 
     150.00, 15.00, 7.50, 172.50, 'completed')
    ON CONFLICT (order_number) DO NOTHING;
    
    RAISE NOTICE '✅ Created test orders with legacy customer_id';
END $$;

-- ============================================================================
-- STEP 11: CREATE PRE-MIGRATION SNAPSHOT
-- ============================================================================

CREATE TABLE IF NOT EXISTS pre_migration_snapshot (
    table_name TEXT PRIMARY KEY,
    row_count INTEGER,
    snapshot_time TIMESTAMPTZ DEFAULT NOW()
);

-- Clear previous snapshot
TRUNCATE pre_migration_snapshot;

-- Capture current row counts
INSERT INTO pre_migration_snapshot (table_name, row_count)
SELECT 'users', COUNT(*) FROM users
ON CONFLICT (table_name) DO UPDATE SET row_count = EXCLUDED.row_count, snapshot_time = NOW();

INSERT INTO pre_migration_snapshot (table_name, row_count)
SELECT 'profiles', COUNT(*) FROM profiles
ON CONFLICT (table_name) DO UPDATE SET row_count = EXCLUDED.row_count, snapshot_time = NOW();

INSERT INTO pre_migration_snapshot (table_name, row_count)
SELECT 'orders', COUNT(*) FROM orders
ON CONFLICT (table_name) DO UPDATE SET row_count = EXCLUDED.row_count, snapshot_time = NOW();

INSERT INTO pre_migration_snapshot (table_name, row_count)
SELECT 'order_items', COUNT(*) FROM order_items
ON CONFLICT (table_name) DO UPDATE SET row_count = EXCLUDED.row_count, snapshot_time = NOW();

INSERT INTO pre_migration_snapshot (table_name, row_count)
SELECT 'payments', COUNT(*) FROM payments
ON CONFLICT (table_name) DO UPDATE SET row_count = EXCLUDED.row_count, snapshot_time = NOW();

INSERT INTO pre_migration_snapshot (table_name, row_count)
SELECT 'cart', COUNT(*) FROM cart
ON CONFLICT (table_name) DO UPDATE SET row_count = EXCLUDED.row_count, snapshot_time = NOW();

INSERT INTO pre_migration_snapshot (table_name, row_count)
SELECT 'reviews', COUNT(*) FROM reviews
ON CONFLICT (table_name) DO UPDATE SET row_count = EXCLUDED.row_count, snapshot_time = NOW();

RAISE NOTICE '✅ Created pre-migration snapshot';

-- ============================================================================
-- STEP 12: DISPLAY TEST DATA SUMMARY
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'TEST DATA PREPARATION SUMMARY';
    RAISE NOTICE '========================================';
    
    RAISE NOTICE 'Pre-Migration Row Counts:';
    FOR v_record IN 
        SELECT table_name, row_count 
        FROM pre_migration_snapshot 
        ORDER BY table_name
    LOOP
        RAISE NOTICE '  %: %', v_record.table_name, v_record.row_count;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE 'Legacy Columns Status:';
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'customer_id'
    ) THEN
        RAISE NOTICE '  orders.customer_id: EXISTS';
    ELSE
        RAISE NOTICE '  orders.customer_id: MISSING';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'total_amount'
    ) THEN
        RAISE NOTICE '  orders.total_amount: EXISTS';
    ELSE
        RAISE NOTICE '  orders.total_amount: MISSING';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' AND column_name = 'unit_price'
    ) THEN
        RAISE NOTICE '  order_items.unit_price: EXISTS';
    ELSE
        RAISE NOTICE '  order_items.unit_price: MISSING';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payments' AND column_name = 'payment_method'
    ) THEN
        RAISE NOTICE '  payments.payment_method: EXISTS';
    ELSE
        RAISE NOTICE '  payments.payment_method: MISSING';
    END IF;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ Test data preparation completed';
    RAISE NOTICE '========================================';
END $$;

COMMIT;

-- ============================================================================
-- POST-SETUP VERIFICATION QUERIES
-- ============================================================================

-- Run these queries to verify test data is ready:

-- 1. Check legacy users table
-- SELECT COUNT(*) FROM users;

-- 2. Check pre-migration snapshot
-- SELECT * FROM pre_migration_snapshot ORDER BY table_name;

-- 3. Check for legacy columns
-- SELECT table_name, column_name 
-- FROM information_schema.columns 
-- WHERE table_name IN ('orders', 'order_items', 'payments', 'cart', 'reviews')
-- AND column_name IN ('customer_id', 'email', 'total_amount', 'unit_price', 'total_price', 'payment_method', 'payment_intent_id')
-- ORDER BY table_name, column_name;

-- 4. Check orders have customer_id populated
-- SELECT COUNT(*) as orders_with_customer_id FROM orders WHERE customer_id IS NOT NULL;

-- 5. Check auth user mappings (if auth schema exists)
-- SELECT u.email, u.auth_user_id, au.email as auth_email 
-- FROM users u 
-- LEFT JOIN auth.users au ON au.id = u.auth_user_id 
-- WHERE u.auth_user_id IS NOT NULL;
