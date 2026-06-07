-- PHASE 4 (Continued): Remove Obsolete Objects
-- Migration: 005_remove_obsolete_tables.sql
-- Purpose: Remove obsolete tables and columns after data migration
-- This migration should only be run AFTER successful data migration
--
-- CRITICAL: Ensure data migration (004) completed successfully before running this
-- CRITICAL: Ensure database backup exists before execution

BEGIN;

-- ============================================================================
-- CLEANUP VALIDATION
-- ============================================================================

-- Verify data migration completed successfully
DO $$
DECLARE
    profiles_count INTEGER;
    orders_count INTEGER;
BEGIN
    -- Check if profiles table has data
    SELECT COUNT(*) INTO profiles_count FROM profiles;
    
    -- Check if orders table has data
    SELECT COUNT(*) INTO orders_count FROM orders;
    
    IF profiles_count = 0 THEN
        RAISE EXCEPTION '❌ CRITICAL: profiles table is empty. Data migration may have failed. Aborting cleanup.';
    END IF;
    
    IF orders_count = 0 THEN
        RAISE WARNING '⚠️  orders table is empty. This may be expected for new installations.';
    ELSE
        RAISE NOTICE '✅ Data validation passed: profiles=%, orders=%', profiles_count, orders_count;
    END IF;
END $$;

-- ============================================================================
-- REMOVE OBSOLETE TABLES
-- ============================================================================

-- Drop legacy users table (replaced by profiles)
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
    ) THEN
        -- Check if users table has data that wasn't migrated
        IF EXISTS (SELECT 1 FROM users) THEN
            RAISE WARNING '⚠️  users table still has data. Ensure migration completed before dropping.';
        END IF;
        
        DROP TABLE IF EXISTS users CASCADE;
        RAISE NOTICE '✅ Dropped obsolete users table';
    ELSE
        RAISE NOTICE 'ℹ️  users table does not exist - skipping';
    END IF;
END $$;

-- Drop users_backup table if it exists (created in 004_remove_legacy_auth_columns)
DROP TABLE IF EXISTS users_backup CASCADE;
RAISE NOTICE '✅ Dropped users_backup table if it existed';

-- Drop migration_log table if it exists (old version, will be recreated by canonical schema)
-- Note: We keep the migration_log table from canonical schema, so we don't drop it here

-- ============================================================================
-- REMOVE OBSOLETE COLUMNS
-- ============================================================================

-- Remove any remaining password-related columns if they exist
DO $$
BEGIN
    -- Check profiles table for legacy password columns
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'password_hash'
    ) THEN
        ALTER TABLE profiles DROP COLUMN IF EXISTS password_hash;
        RAISE NOTICE '✅ Dropped password_hash from profiles';
    END IF;
    
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'reset_token'
    ) THEN
        ALTER TABLE profiles DROP COLUMN IF EXISTS reset_token;
        RAISE NOTICE '✅ Dropped reset_token from profiles';
    END IF;
    
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'reset_token_expiry'
    ) THEN
        ALTER TABLE profiles DROP COLUMN IF EXISTS reset_token_expiry;
        RAISE NOTICE '✅ Dropped reset_token_expiry from profiles';
    END IF;
    
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'email_verification_token'
    ) THEN
        ALTER TABLE profiles DROP COLUMN IF EXISTS email_verification_token;
        RAISE NOTICE '✅ Dropped email_verification_token from profiles';
    END IF;
    
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'email_verification_expires'
    ) THEN
        ALTER TABLE profiles DROP COLUMN IF EXISTS email_verification_expires;
        RAISE NOTICE '✅ Dropped email_verification_expires from profiles';
    END IF;
END $$;

-- Remove auth_user_id column from profiles if it exists (temporary migration column)
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'auth_user_id'
    ) THEN
        ALTER TABLE profiles DROP COLUMN IF EXISTS auth_user_id;
        RAISE NOTICE '✅ Dropped auth_user_id from profiles (temporary migration column)';
    END IF;
END $$;

-- ============================================================================
-- REMOVE OBSOLETE FUNCTIONS
-- ============================================================================

-- Drop duplicate or obsolete functions
DROP FUNCTION IF EXISTS is_admin(TEXT) CASCADE;  -- Old version with TEXT parameter
DROP FUNCTION IF EXISTS get_user_role(UUID) CASCADE;  -- Duplicate function
DROP FUNCTION IF EXISTS owns_resource(UUID) CASCADE;  -- May be duplicate

RAISE NOTICE '✅ Dropped obsolete functions';

-- ============================================================================
-- REMOVE OBSOLETE VIEWS
-- ============================================================================

-- Drop old views that may conflict with new ones
DROP VIEW IF EXISTS user_orders CASCADE;
DROP VIEW IF EXISTS customer_analytics_old CASCADE;
DROP VIEW IF EXISTS payment_analytics_old CASCADE;

RAISE NOTICE '✅ Dropped obsolete views';

-- ============================================================================
-- REMOVE OBSOLETE INDEXES
-- ============================================================================

-- Drop indexes that are no longer needed or conflict with new ones
DROP INDEX IF EXISTS idx_users_email CASCADE;
DROP INDEX IF EXISTS idx_users_role CASCADE;
DROP INDEX IF EXISTS idx_orders_customer CASCADE;
DROP INDEX IF EXISTS idx_cart_customer CASCADE;
DROP INDEX IF EXISTS idx_reviews_customer CASCADE;

RAISE NOTICE '✅ Dropped obsolete indexes';

-- ============================================================================
-- REMOVE OBSOLETE CONSTRAINTS
-- ============================================================================

-- Drop old foreign key constraints that may conflict
DO $$
BEGIN
    -- Drop old customer_id foreign keys if they still exist
    IF EXISTS (
        SELECT FROM information_schema.table_constraints 
        WHERE table_name = 'orders' 
        AND constraint_name LIKE '%customer%'
    ) THEN
        ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_customer_id_fkey;
        RAISE NOTICE '✅ Dropped old orders.customer_id foreign key';
    END IF;
    
    IF EXISTS (
        SELECT FROM information_schema.table_constraints 
        WHERE table_name = 'cart' 
        AND constraint_name LIKE '%customer%'
    ) THEN
        ALTER TABLE cart DROP CONSTRAINT IF EXISTS cart_customer_id_fkey;
        RAISE NOTICE '✅ Dropped old cart.customer_id foreign key';
    END IF;
    
    IF EXISTS (
        SELECT FROM information_schema.table_constraints 
        WHERE table_name = 'reviews' 
        AND constraint_name LIKE '%customer%'
    ) THEN
        ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_customer_id_fkey;
        RAISE NOTICE '✅ Dropped old reviews.customer_id foreign key';
    END IF;
END $$;

-- ============================================================================
-- CLEANUP MIGRATIONS TABLE (if it exists from old schema)
-- ============================================================================

-- Drop old migrations table if it exists (different from migration_log)
DROP TABLE IF EXISTS migrations CASCADE;
RAISE NOTICE '✅ Dropped obsolete migrations table';

-- ============================================================================
-- VACUUM AND ANALYZE
-- ============================================================================

-- Reclaim space and update statistics
VACUUM ANALYZE;
RAISE NOTICE '✅ Vacuum and analyze completed';

-- ============================================================================
-- CLEANUP VALIDATION
-- ============================================================================

DO $$
DECLARE
    obsolete_count INTEGER;
BEGIN
    -- Check for any remaining obsolete tables
    SELECT COUNT(*) INTO obsolete_count
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('users', 'users_backup', 'migrations');
    
    IF obsolete_count > 0 THEN
        RAISE WARNING '⚠️  Found % obsolete tables still present', obsolete_count;
    ELSE
        RAISE NOTICE '✅ All obsolete tables removed';
    END IF;
    
    -- Check for any remaining obsolete columns
    SELECT COUNT(*) INTO obsolete_count
    FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name IN ('password_hash', 'reset_token', 'reset_token_expiry', 'email_verification_token', 'email_verification_expires', 'auth_user_id');
    
    IF obsolete_count > 0 THEN
        RAISE WARNING '⚠️  Found % obsolete columns still present in profiles', obsolete_count;
    ELSE
        RAISE NOTICE '✅ All obsolete columns removed from profiles';
    END IF;
END $$;

-- ============================================================================
-- MIGRATION LOG ENTRY
-- ============================================================================

INSERT INTO migration_log (migration_name, executed_at, success, checksum)
VALUES ('005_remove_obsolete_tables.sql', NOW(), true, md5(current_timestamp::text))
ON CONFLICT (migration_name) DO UPDATE SET
    executed_at = NOW(),
    success = true;

COMMIT;

-- ============================================================================
-- POST-MIGRATION NOTES
-- ============================================================================
--
-- This migration removes obsolete objects after successful data migration.
--
-- OBJECTS REMOVED:
-- - users table (legacy, replaced by profiles)
-- - users_backup table (backup from previous migration)
-- - Legacy password columns from profiles
-- - Temporary migration columns (auth_user_id)
-- - Obsolete functions (is_admin with TEXT, get_user_role, owns_resource)
-- - Obsolete views
-- - Obsolete indexes
-- - Obsolete foreign key constraints
-- - Old migrations table
--
-- VALIDATION:
-- - Data migration must be completed successfully first
-- - Database backup must exist
-- - Run SELECT * FROM validate_schema_integrity() after cleanup
--
-- ROLLBACK:
-- - Restore from database backup
-- - This migration is not reversible without backup
--
-- NEXT STEPS:
-- - Run 006_create_admin_user.sql
-- - Run 007_validate_schema_integrity.sql
-- - Test application functionality
