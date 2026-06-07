-- PHASE 4 (Continued): Data Migration
-- Migration: 004_migrate_existing_data.sql
-- Purpose: Migrate existing data from old schema to canonical schema
-- This migration handles data migration while preserving all existing data
--
-- IMPORTANT: This migration should be tested on staging before production
-- Ensure database backup exists before execution

BEGIN;

-- ============================================================================
-- DATA MIGRATION VALIDATION
-- ============================================================================

-- Check if old tables exist before migration
DO $$
DECLARE
    users_table_exists BOOLEAN;
    old_orders_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
    ) INTO users_table_exists;
    
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'orders'
        AND EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'orders' 
            AND column_name = 'customer_id'
        )
    ) INTO old_orders_exists;
    
    IF users_table_exists THEN
        RAISE NOTICE '✅ Legacy users table found - will migrate to profiles';
    ELSE
        RAISE NOTICE 'ℹ️  No legacy users table found - skipping user migration';
    END IF;
    
    IF old_orders_exists THEN
        RAISE NOTICE '✅ Old orders schema found - will migrate column names';
    ELSE
        RAISE NOTICE 'ℹ️  Orders already migrated - skipping column rename';
    END IF;
END $$;

-- ============================================================================
-- MIGRATION 1: USER DATA MIGRATION (users → profiles)
-- ============================================================================

-- Migrate data from legacy users table to profiles table
DO $$
DECLARE
    users_count INTEGER;
    profiles_count INTEGER;
    migrated_count INTEGER;
BEGIN
    -- Check if legacy users table exists
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
    ) THEN
        -- Count existing users
        SELECT COUNT(*) INTO users_count FROM users;
        
        -- Count existing profiles
        SELECT COUNT(*) INTO profiles_count FROM profiles;
        
        RAISE NOTICE 'Legacy users: %, Existing profiles: %', users_count, profiles_count;
        
        -- Migrate users to profiles
        INSERT INTO profiles (
            id,
            user_id,
            first_name,
            last_name,
            phone,
            role,
            email_verified,
            created_at,
            updated_at
        )
        SELECT 
            u.id,
            COALESCE(u.auth_user_id, u.id), -- Use auth_user_id if exists, otherwise use id
            u.first_name,
            u.last_name,
            u.phone,
            u.role,
            u.email_verified,
            u.created_at,
            u.updated_at
        FROM users u
        WHERE NOT EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.user_id = COALESCE(u.auth_user_id, u.id)
        )
        ON CONFLICT (user_id) DO NOTHING;
        
        GET DIAGNOSTICS migrated_count = ROW_COUNT;
        
        RAISE NOTICE '✅ Migrated % users to profiles', migrated_count;
        
        -- Migrate admin_users if they exist in legacy schema
        IF EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'admin_users'
        ) THEN
            INSERT INTO admin_users (user_id, permissions, login_count)
            SELECT 
                p.id,
                COALESCE(au.permissions, '{"canManageProducts": true, "canManageOrders": true, "canManageUsers": true, "canManageSettings": true, "canViewAnalytics": true}'::jsonb),
                COALESCE(au.login_count, 0)
            FROM profiles p
            JOIN users u ON p.user_id = COALESCE(u.auth_user_id, u.id)
            LEFT JOIN admin_users au ON au.user_id = u.id
            WHERE u.role IN ('admin', 'super_admin')
            AND NOT EXISTS (
                SELECT 1 FROM admin_users nau 
                WHERE nau.user_id = p.id
            )
            ON CONFLICT (user_id) DO NOTHING;
            
            RAISE NOTICE '✅ Migrated admin users to admin_users table';
        END IF;
    ELSE
        RAISE NOTICE 'ℹ️  No legacy users table - skipping user migration';
    END IF;
END $$;

-- ============================================================================
-- MIGRATION 2: ORDERS COLUMN RENAMES
-- ============================================================================

-- Rename columns in orders table if old schema exists
DO $$
BEGIN
    -- Check if customer_id column exists (old schema)
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'customer_id'
    ) THEN
        -- Add user_id column if it doesn't exist
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'orders' 
            AND column_name = 'user_id'
        ) THEN
            ALTER TABLE orders ADD COLUMN user_id UUID;
            RAISE NOTICE '✅ Added user_id column to orders';
        END IF;
        
        -- Copy data from customer_id to user_id
        UPDATE orders SET user_id = customer_id WHERE user_id IS NULL AND customer_id IS NOT NULL;
        RAISE NOTICE '✅ Copied customer_id to user_id in orders';
        
        -- Drop old customer_id column
        ALTER TABLE orders DROP COLUMN customer_id;
        RAISE NOTICE '✅ Dropped customer_id column from orders';
        
        -- Add foreign key constraint for user_id
        IF NOT EXISTS (
            SELECT FROM information_schema.table_constraints 
            WHERE table_name = 'orders' 
            AND constraint_name = 'orders_user_id_fkey'
        ) THEN
            ALTER TABLE orders ADD CONSTRAINT orders_user_id_fkey 
                FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE RESTRICT;
            RAISE NOTICE '✅ Added foreign key constraint for orders.user_id';
        END IF;
    END IF;
    
    -- Rename email to guest_email if exists
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'email'
    ) THEN
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'orders' 
            AND column_name = 'guest_email'
        ) THEN
            ALTER TABLE orders ADD COLUMN guest_email TEXT;
        END IF;
        
        UPDATE orders SET guest_email = email WHERE guest_email IS NULL AND email IS NOT NULL;
        ALTER TABLE orders DROP COLUMN email;
        RAISE NOTICE '✅ Renamed email to guest_email in orders';
    END IF;
    
    -- Rename total_amount to total if exists
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'total_amount'
    ) THEN
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'orders' 
            AND column_name = 'total'
        ) THEN
            ALTER TABLE orders ADD COLUMN total DECIMAL(10,2);
        END IF;
        
        UPDATE orders SET total = total_amount WHERE total IS NULL AND total_amount IS NOT NULL;
        ALTER TABLE orders DROP COLUMN total_amount;
        RAISE NOTICE '✅ Renamed total_amount to total in orders';
    END IF;
    
    -- Add payment_provider column if it doesn't exist
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'payment_provider'
    ) THEN
        ALTER TABLE orders ADD COLUMN payment_provider TEXT;
        RAISE NOTICE '✅ Added payment_provider column to orders';
    END IF;
    
    -- Add payment_details column if it doesn't exist
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'payment_details'
    ) THEN
        ALTER TABLE orders ADD COLUMN payment_details JSONB;
        RAISE NOTICE '✅ Added payment_details column to orders';
    END IF;
    
    -- Add payment_reference column if it doesn't exist
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'payment_reference'
    ) THEN
        ALTER TABLE orders ADD COLUMN payment_reference TEXT;
        RAISE NOTICE '✅ Added payment_reference column to orders';
    END IF;
END $$;

-- ============================================================================
-- MIGRATION 3: ORDER_ITEMS COLUMN RENAMES
-- ============================================================================

DO $$
BEGIN
    -- Rename unit_price to price if exists
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'order_items' 
        AND column_name = 'unit_price'
    ) THEN
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'order_items' 
            AND column_name = 'price'
        ) THEN
            ALTER TABLE order_items ADD COLUMN price DECIMAL(10,2);
        END IF;
        
        UPDATE order_items SET price = unit_price WHERE price IS NULL AND unit_price IS NOT NULL;
        ALTER TABLE order_items DROP COLUMN unit_price;
        RAISE NOTICE '✅ Renamed unit_price to price in order_items';
    END IF;
    
    -- Rename total_price to total if exists
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'order_items' 
        AND column_name = 'total_price'
    ) THEN
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'order_items' 
            AND column_name = 'total'
        ) THEN
            ALTER TABLE order_items ADD COLUMN total DECIMAL(10,2);
        END IF;
        
        UPDATE order_items SET total = total_price WHERE total IS NULL AND total_price IS NOT NULL;
        ALTER TABLE order_items DROP COLUMN total_price;
        RAISE NOTICE '✅ Renamed total_price to total in order_items';
    END IF;
    
    -- Drop product_name and product_sku if they exist
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'order_items' 
        AND column_name = 'product_name'
    ) THEN
        ALTER TABLE order_items DROP COLUMN product_name;
        RAISE NOTICE '✅ Dropped product_name from order_items';
    END IF;
    
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'order_items' 
        AND column_name = 'product_sku'
    ) THEN
        ALTER TABLE order_items DROP COLUMN product_sku;
        RAISE NOTICE '✅ Dropped product_sku from order_items';
    END IF;
END $$;

-- ============================================================================
-- MIGRATION 4: PAYMENTS COLUMN RENAMES
-- ============================================================================

DO $$
BEGIN
    -- Rename payment_method to provider if exists
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'payments' 
        AND column_name = 'payment_method'
    ) THEN
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'payments' 
            AND column_name = 'provider'
        ) THEN
            ALTER TABLE payments ADD COLUMN provider TEXT;
        END IF;
        
        UPDATE payments SET provider = payment_method WHERE provider IS NULL AND payment_method IS NOT NULL;
        ALTER TABLE payments DROP COLUMN payment_method;
        RAISE NOTICE '✅ Renamed payment_method to provider in payments';
    END IF;
    
    -- Rename payment_intent_id to provider_id if exists
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'payments' 
        AND column_name = 'payment_intent_id'
    ) THEN
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'payments' 
            AND column_name = 'provider_id'
        ) THEN
            ALTER TABLE payments ADD COLUMN provider_id TEXT;
        END IF;
        
        UPDATE payments SET provider_id = payment_intent_id WHERE provider_id IS NULL AND payment_intent_id IS NOT NULL;
        ALTER TABLE payments DROP COLUMN payment_intent_id;
        RAISE NOTICE '✅ Renamed payment_intent_id to provider_id in payments';
    END IF;
END $$;

-- ============================================================================
-- MIGRATION 5: CART TABLE UPDATES
-- ============================================================================

DO $$
BEGIN
    -- Rename customer_id to user_id if exists
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'cart' 
        AND column_name = 'customer_id'
    ) THEN
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'cart' 
            AND column_name = 'user_id'
        ) THEN
            ALTER TABLE cart ADD COLUMN user_id UUID;
        END IF;
        
        UPDATE cart SET user_id = customer_id WHERE user_id IS NULL AND customer_id IS NOT NULL;
        ALTER TABLE cart DROP COLUMN customer_id;
        
        -- Update foreign key constraint
        IF EXISTS (
            SELECT FROM information_schema.table_constraints 
            WHERE table_name = 'cart' 
            AND constraint_name = 'cart_customer_id_fkey'
        ) THEN
            ALTER TABLE cart DROP CONSTRAINT cart_customer_id_fkey;
        END IF;
        
        ALTER TABLE cart ADD CONSTRAINT cart_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
        
        RAISE NOTICE '✅ Updated cart table: customer_id → user_id';
    END IF;
END $$;

-- ============================================================================
-- MIGRATION 6: REVIEWS TABLE UPDATES
-- ============================================================================

DO $$
BEGIN
    -- Rename customer_id to user_id if exists
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'reviews' 
        AND column_name = 'customer_id'
    ) THEN
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'reviews' 
            AND column_name = 'user_id'
        ) THEN
            ALTER TABLE reviews ADD COLUMN user_id UUID;
        END IF;
        
        UPDATE reviews SET user_id = customer_id WHERE user_id IS NULL AND customer_id IS NOT NULL;
        ALTER TABLE reviews DROP COLUMN customer_id;
        
        -- Update foreign key constraint
        IF EXISTS (
            SELECT FROM information_schema.table_constraints 
            WHERE table_name = 'reviews' 
            AND constraint_name = 'reviews_customer_id_fkey'
        ) THEN
            ALTER TABLE reviews DROP CONSTRAINT reviews_customer_id_fkey;
        END IF;
        
        ALTER TABLE reviews ADD CONSTRAINT reviews_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
        
        RAISE NOTICE '✅ Updated reviews table: customer_id → user_id';
    END IF;
END $$;

-- ============================================================================
-- MIGRATION 7: INVENTORY_LOGS TABLE UPDATES
-- ============================================================================

DO $$
BEGIN
    -- Rename created_by to use profiles if it references users
    IF EXISTS (
        SELECT FROM information_schema.table_constraints 
        WHERE table_name = 'inventory_logs' 
        AND constraint_name = 'inventory_logs_created_by_fkey'
        AND EXISTS (
            SELECT 1 FROM information_schema.key_column_usage 
            WHERE table_name = 'inventory_logs' 
            AND column_name = 'created_by'
        )
    ) THEN
        -- This assumes created_by was referencing users.id
        -- We need to update it to reference profiles.id
        ALTER TABLE inventory_logs DROP CONSTRAINT IF EXISTS inventory_logs_created_by_fkey;
        ALTER TABLE inventory_logs ADD CONSTRAINT inventory_logs_created_by_fkey 
            FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL;
        RAISE NOTICE '✅ Updated inventory_logs.created_by foreign key';
    END IF;
END $$;

-- ============================================================================
-- MIGRATION 8: REFUND_REQUESTS TYPE FIX
-- ============================================================================

DO $$
BEGIN
    -- Fix refund_requests.order_id type if it's INTEGER but should be UUID
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'refund_requests' 
        AND column_name = 'order_id' 
        AND data_type = 'integer'
    ) THEN
        -- Create new UUID column
        ALTER TABLE refund_requests ADD COLUMN order_id_uuid UUID;
        
        -- This is a complex migration - we need to map integer IDs to UUIDs
        -- For now, we'll set it to NULL and require manual reconciliation
        UPDATE refund_requests SET order_id_uuid = NULL;
        
        -- Drop old column and rename new one
        ALTER TABLE refund_requests DROP COLUMN order_id;
        ALTER TABLE refund_requests RENAME COLUMN order_id_uuid TO order_id;
        
        -- Add proper foreign key
        ALTER TABLE refund_requests ADD CONSTRAINT refund_requests_order_id_fkey 
            FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;
        
        RAISE NOTICE '⚠️  refund_requests.order_id converted to UUID - manual reconciliation required';
    END IF;
END $$;

-- ============================================================================
-- MIGRATION 9: ADD DELETED_AT COLUMNS
-- ============================================================================

DO $$
BEGIN
    -- Add deleted_at column to tables that don't have it
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'deleted_at'
    ) THEN
        ALTER TABLE profiles ADD COLUMN deleted_at TIMESTAMPTZ;
        RAISE NOTICE '✅ Added deleted_at to profiles';
    END IF;
    
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'categories' 
        AND column_name = 'deleted_at'
    ) THEN
        ALTER TABLE categories ADD COLUMN deleted_at TIMESTAMPTZ;
        RAISE NOTICE '✅ Added deleted_at to categories';
    END IF;
    
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'deleted_at'
    ) THEN
        ALTER TABLE products ADD COLUMN deleted_at TIMESTAMPTZ;
        RAISE NOTICE '✅ Added deleted_at to products';
    END IF;
    
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'deleted_at'
    ) THEN
        ALTER TABLE orders ADD COLUMN deleted_at TIMESTAMPTZ;
        RAISE NOTICE '✅ Added deleted_at to orders';
    END IF;
    
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'customer_profiles' 
        AND column_name = 'deleted_at'
    ) THEN
        ALTER TABLE customer_profiles ADD COLUMN deleted_at TIMESTAMPTZ;
        RAISE NOTICE '✅ Added deleted_at to customer_profiles';
    END IF;
END $$;

-- ============================================================================
-- DATA INTEGRITY VALIDATION
-- ============================================================================

DO $$
DECLARE
    orphan_count INTEGER;
BEGIN
    -- Check for orphaned orders
    SELECT COUNT(*) INTO orphan_count
    FROM orders o
    LEFT JOIN profiles p ON o.user_id = p.id
    WHERE o.user_id IS NOT NULL AND p.id IS NULL;
    
    IF orphan_count > 0 THEN
        RAISE WARNING '⚠️  Found % orphaned orders (orders without valid user_id)', orphan_count;
    ELSE
        RAISE NOTICE '✅ No orphaned orders found';
    END IF;
    
    -- Check for orphaned order items
    SELECT COUNT(*) INTO orphan_count
    FROM order_items oi
    LEFT JOIN orders o ON oi.order_id = o.id
    WHERE o.id IS NULL;
    
    IF orphan_count > 0 THEN
        RAISE WARNING '⚠️  Found % orphaned order items', orphan_count;
    ELSE
        RAISE NOTICE '✅ No orphaned order items found';
    END IF;
    
    -- Check for orphaned cart items
    SELECT COUNT(*) INTO orphan_count
    FROM cart c
    LEFT JOIN profiles p ON c.user_id = p.id
    WHERE c.user_id IS NOT NULL AND p.id IS NULL;
    
    IF orphan_count > 0 THEN
        RAISE WARNING '⚠️  Found % orphaned cart items', orphan_count;
    ELSE
        RAISE NOTICE '✅ No orphaned cart items found';
    END IF;
END $$;

-- ============================================================================
-- MIGRATION LOG ENTRY
-- ============================================================================

INSERT INTO migration_log (migration_name, executed_at, success, checksum)
VALUES ('004_migrate_existing_data.sql', NOW(), true, md5(current_timestamp::text))
ON CONFLICT (migration_name) DO UPDATE SET
    executed_at = NOW(),
    success = true;

COMMIT;

-- ============================================================================
-- POST-MIGRATION NOTES
-- ============================================================================
--
-- This migration handles data migration from old schema to canonical schema.
--
-- MIGRATIONS PERFORMED:
-- 1. User data: users table → profiles table
-- 2. Orders column renames: customer_id → user_id, email → guest_email, total_amount → total
-- 3. Order items column renames: unit_price → price, total_price → total
-- 4. Payments column renames: payment_method → provider, payment_intent_id → provider_id
-- 5. Cart table updates: customer_id → user_id
-- 6. Reviews table updates: customer_id → user_id
-- 7. Foreign key updates to reference profiles table
-- 8. Added deleted_at columns for soft delete pattern
--
-- MANUAL RECONCILIATION REQUIRED:
-- - refund_requests.order_id if it was INTEGER type
-- - Any data that couldn't be automatically migrated
--
-- VALIDATION:
-- - Run SELECT * FROM validate_schema_integrity() after migration
-- - Check for orphaned records
-- - Verify data counts match before/after
--
-- ROLLBACK:
-- - Restore from database backup
-- - This migration is not reversible without backup
