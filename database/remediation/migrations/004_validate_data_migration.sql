-- Data Migration Validation Script
-- Purpose: Comprehensive validation of data migration integrity
-- This script should be run after 004_migrate_existing_data_REMEDIATED.sql
--
-- This validation function checks:
-- - Row counts
-- - Orphaned records
-- - Duplicate users
-- - Invalid auth mappings
-- - FK integrity
-- - Migration completeness

-- ============================================================================
-- VALIDATION FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_data_migration()
RETURNS TABLE (
    check_name TEXT,
    status TEXT,
    details TEXT,
    severity TEXT,
    recommendation TEXT
) AS $$
DECLARE
    v_count INTEGER;
    v_count1 INTEGER;
    v_count2 INTEGER;
    v_auth_schema_exists BOOLEAN;
BEGIN
    -- ============================================================================
    -- CHECK 1: Row Count Validation
    -- ============================================================================
    
    -- Check profiles row count
    SELECT COUNT(*) INTO v_count FROM profiles;
    RETURN QUERY SELECT 
        'Profiles row count'::TEXT as check_name,
        'INFO'::TEXT as status,
        format('% profiles found', v_count)::TEXT as details,
        'LOW'::TEXT as severity,
        NULL::TEXT as recommendation;
    
    -- Check orders row count
    SELECT COUNT(*) INTO v_count FROM orders;
    RETURN QUERY SELECT 
        'Orders row count'::TEXT as check_name,
        'INFO'::TEXT as status,
        format('% orders found', v_count)::TEXT as details,
        'LOW'::TEXT as severity,
        NULL::TEXT as recommendation;
    
    -- Check order_items row count
    SELECT COUNT(*) INTO v_count FROM order_items;
    RETURN QUERY SELECT 
        'Order items row count'::TEXT as check_name,
        'INFO'::TEXT as status,
        format('% order items found', v_count)::TEXT as details,
        'LOW'::TEXT as severity,
        NULL::TEXT as recommendation;
    
    -- Check payments row count
    SELECT COUNT(*) INTO v_count FROM payments;
    RETURN QUERY SELECT 
        'Payments row count'::TEXT as check_name,
        'INFO'::TEXT as status,
        format('% payments found', v_count)::TEXT as details,
        'LOW'::TEXT as severity,
        NULL::TEXT as recommendation;
    
    -- ============================================================================
    -- CHECK 2: Orphaned Records
    -- ============================================================================
    
    -- Check for orphaned orders
    SELECT COUNT(*) INTO v_count
    FROM orders o
    LEFT JOIN profiles p ON o.user_id = p.id
    WHERE o.user_id IS NOT NULL AND p.id IS NULL;
    
    IF v_count > 0 THEN
        RETURN QUERY SELECT 
            'Orphaned orders'::TEXT as check_name,
            'FAILED'::TEXT as status,
            format('% orders without valid user_id', v_count)::TEXT as details,
            'CRITICAL'::TEXT as severity,
            'Review and fix orphaned orders before proceeding'::TEXT as recommendation;
    ELSE
        RETURN QUERY SELECT 
            'Orphaned orders'::TEXT as check_name,
            'PASSED'::TEXT as status,
            'No orphaned orders found'::TEXT as details,
            'LOW'::TEXT as severity,
            NULL::TEXT as recommendation;
    END IF;
    
    -- Check for orphaned order items
    SELECT COUNT(*) INTO v_count
    FROM order_items oi
    LEFT JOIN orders o ON oi.order_id = o.id
    WHERE o.id IS NULL;
    
    IF v_count > 0 THEN
        RETURN QUERY SELECT 
            'Orphaned order items'::TEXT as check_name,
            'FAILED'::TEXT as status,
            format('% order items without valid order_id', v_count)::TEXT as details,
            'CRITICAL'::TEXT as severity,
            'Review and fix orphaned order items before proceeding'::TEXT as recommendation;
    ELSE
        RETURN QUERY SELECT 
            'Orphaned order items'::TEXT as check_name,
            'PASSED'::TEXT as status,
            'No orphaned order items found'::TEXT as details,
            'LOW'::TEXT as severity,
            NULL::TEXT as recommendation;
    END IF;
    
    -- Check for orphaned cart items
    SELECT COUNT(*) INTO v_count
    FROM cart c
    LEFT JOIN profiles p ON c.user_id = p.id
    WHERE c.user_id IS NOT NULL AND p.id IS NULL;
    
    IF v_count > 0 THEN
        RETURN QUERY SELECT 
            'Orphaned cart items'::TEXT as check_name,
            'WARNING'::TEXT as status,
            format('% cart items without valid user_id', v_count)::TEXT as details,
            'HIGH'::TEXT as severity,
            'Consider deleting orphaned cart items or assigning to guest user'::TEXT as recommendation;
    ELSE
        RETURN QUERY SELECT 
            'Orphaned cart items'::TEXT as check_name,
            'PASSED'::TEXT as status,
            'No orphaned cart items found'::TEXT as details,
            'LOW'::TEXT as severity,
            NULL::TEXT as recommendation;
    END IF;
    
    -- Check for orphaned reviews
    SELECT COUNT(*) INTO v_count
    FROM reviews r
    LEFT JOIN profiles p ON r.user_id = p.id
    WHERE r.user_id IS NOT NULL AND p.id IS NULL;
    
    IF v_count > 0 THEN
        RETURN QUERY SELECT 
            'Orphaned reviews'::TEXT as check_name,
            'WARNING'::TEXT as status,
            format('% reviews without valid user_id', v_count)::TEXT as details,
            'HIGH'::TEXT as severity,
            'Review and fix orphaned reviews before proceeding'::TEXT as recommendation;
    ELSE
        RETURN QUERY SELECT 
            'Orphaned reviews'::TEXT as check_name,
            'PASSED'::TEXT as status,
            'No orphaned reviews found'::TEXT as details,
            'LOW'::TEXT as severity,
            NULL::TEXT as recommendation;
    END IF;
    
    -- Check for orphaned payments
    SELECT COUNT(*) INTO v_count
    FROM payments pay
    LEFT JOIN orders o ON pay.order_id = o.id
    WHERE o.id IS NULL;
    
    IF v_count > 0 THEN
        RETURN QUERY SELECT 
            'Orphaned payments'::TEXT as check_name,
            'FAILED'::TEXT as status,
            format('% payments without valid order_id', v_count)::TEXT as details,
            'CRITICAL'::TEXT as severity,
            'Review and fix orphaned payments before proceeding'::TEXT as recommendation;
    ELSE
        RETURN QUERY SELECT 
            'Orphaned payments'::TEXT as check_name,
            'PASSED'::TEXT as status,
            'No orphaned payments found'::TEXT as details,
            'LOW'::TEXT as severity,
            NULL::TEXT as recommendation;
    END IF;
    
    -- Check for orphaned inventory logs
    SELECT COUNT(*) INTO v_count
    FROM inventory_logs il
    LEFT JOIN profiles p ON il.created_by = p.id
    WHERE il.created_by IS NOT NULL AND p.id IS NULL;
    
    IF v_count > 0 THEN
        RETURN QUERY SELECT 
            'Orphaned inventory logs'::TEXT as check_name,
            'WARNING'::TEXT as status,
            format('% inventory logs without valid created_by', v_count)::TEXT as details,
            'MEDIUM'::TEXT as severity,
            'Set created_by to NULL for orphaned records'::TEXT as recommendation;
    ELSE
        RETURN QUERY SELECT 
            'Orphaned inventory logs'::TEXT as check_name,
            'PASSED'::TEXT as status,
            'No orphaned inventory logs found'::TEXT as details,
            'LOW'::TEXT as severity,
            NULL::TEXT as recommendation;
    END IF;
    
    -- Check for orphaned refund requests
    SELECT COUNT(*) INTO v_count
    FROM refund_requests rr
    LEFT JOIN orders o ON rr.order_id = o.id
    WHERE rr.order_id IS NOT NULL AND o.id IS NULL;
    
    IF v_count > 0 THEN
        RETURN QUERY SELECT 
            'Orphaned refund requests'::TEXT as check_name,
            'WARNING'::TEXT as status,
            format('% refund requests without valid order_id', v_count)::TEXT as details,
            'HIGH'::TEXT as severity,
            'Review refund_order_mapping table for reconciliation'::TEXT as recommendation;
    ELSE
        RETURN QUERY SELECT 
            'Orphaned refund requests'::TEXT as check_name,
            'PASSED'::TEXT as status,
            'No orphaned refund requests found'::TEXT as details,
            'LOW'::TEXT as severity,
            NULL::TEXT as recommendation;
    END IF;
    
    -- ============================================================================
    -- CHECK 3: Duplicate Users
    -- ============================================================================
    
    -- Check for duplicate user_id in profiles
    SELECT COUNT(*) INTO v_count
    FROM (
        SELECT user_id, COUNT(*)
        FROM profiles
        WHERE user_id IS NOT NULL
        GROUP BY user_id
        HAVING COUNT(*) > 1
    ) dupes;
    
    IF v_count > 0 THEN
        RETURN QUERY SELECT 
            'Duplicate user_id in profiles'::TEXT as check_name,
            'FAILED'::TEXT as status,
            format('% duplicate user_id values found', v_count)::TEXT as details,
            'CRITICAL'::TEXT as severity,
            'Remove duplicate profiles before proceeding'::TEXT as recommendation;
    ELSE
        RETURN QUERY SELECT 
            'Duplicate user_id in profiles'::TEXT as check_name,
            'PASSED'::TEXT as status,
            'No duplicate user_id found'::TEXT as details,
            'LOW'::TEXT as severity,
            NULL::TEXT as recommendation;
    END IF;
    
    -- Check for duplicate emails in profiles (if email column exists)
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'email'
    ) THEN
        SELECT COUNT(*) INTO v_count
        FROM (
            SELECT email, COUNT(*)
            FROM profiles
            WHERE email IS NOT NULL
            GROUP BY email
            HAVING COUNT(*) > 1
        ) dupes;
        
        IF v_count > 0 THEN
            RETURN QUERY SELECT 
                'Duplicate email in profiles'::TEXT as check_name,
                'WARNING'::TEXT as status,
                format('% duplicate email values found', v_count)::TEXT as details,
                'HIGH'::TEXT as severity,
                'Review and consolidate duplicate email records'::TEXT as recommendation;
        ELSE
            RETURN QUERY SELECT 
                'Duplicate email in profiles'::TEXT as check_name,
                'PASSED'::TEXT as status,
                'No duplicate email found'::TEXT as details,
                'LOW'::TEXT as severity,
                NULL::TEXT as recommendation;
        END IF;
    END IF;
    
    -- ============================================================================
    -- CHECK 4: Invalid Auth Mappings (Supabase Only)
    -- ============================================================================
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.schemata 
        WHERE schema_name = 'auth'
    ) INTO v_auth_schema_exists;
    
    IF v_auth_schema_exists THEN
        -- Check for profiles with invalid auth.users references
        SELECT COUNT(*) INTO v_count
        FROM profiles p
        LEFT JOIN auth.users au ON p.user_id = au.id
        WHERE p.user_id IS NOT NULL AND au.id IS NULL;
        
        IF v_count > 0 THEN
            RETURN QUERY SELECT 
                'Invalid auth.users references'::TEXT as check_name,
                'FAILED'::TEXT as status,
                format('% profiles with invalid auth.users references', v_count)::TEXT as details,
                'CRITICAL'::TEXT as severity,
                'Fix auth mappings or remove invalid profiles before proceeding'::TEXT as recommendation;
        ELSE
            RETURN QUERY SELECT 
                'Invalid auth.users references'::TEXT as check_name,
                'PASSED'::TEXT as status,
                'All profiles have valid auth.users references'::TEXT as details,
                'LOW'::TEXT as severity,
                NULL::TEXT as recommendation;
        END IF;
        
        -- Check for auth.users without profiles
        SELECT COUNT(*) INTO v_count
        FROM auth.users au
        LEFT JOIN profiles p ON au.id = p.user_id
        WHERE p.id IS NULL;
        
        IF v_count > 0 THEN
            RETURN QUERY SELECT 
                'Auth users without profiles'::TEXT as check_name,
                'WARNING'::TEXT as status,
                format('% auth.users without corresponding profiles', v_count)::TEXT as details,
                'MEDIUM'::TEXT as severity,
                'Create profiles for auth users or review if expected'::TEXT as recommendation;
        ELSE
            RETURN QUERY SELECT 
                'Auth users without profiles'::TEXT as check_name,
                'PASSED'::TEXT as status,
                'All auth users have corresponding profiles'::TEXT as details,
                'LOW'::TEXT as severity,
                NULL::TEXT as recommendation;
        END IF;
    ELSE
        RETURN QUERY SELECT 
            'Auth schema validation'::TEXT as check_name,
            'SKIPPED'::TEXT as status,
            'Auth schema not found (non-Supabase environment)'::TEXT as details,
            'LOW'::TEXT as severity,
            NULL::TEXT as recommendation;
    END IF;
    
    -- ============================================================================
    -- CHECK 5: Foreign Key Integrity
    -- ============================================================================
    
    -- Check that orders.user_id foreign key exists and is valid
    IF EXISTS (
        SELECT FROM information_schema.table_constraints 
        WHERE table_name = 'orders' 
        AND constraint_name = 'orders_user_id_fkey'
    ) THEN
        RETURN QUERY SELECT 
            'Orders user_id foreign key'::TEXT as check_name,
            'PASSED'::TEXT as status,
            'Foreign key constraint exists'::TEXT as details,
            'LOW'::TEXT as severity,
            NULL::TEXT as recommendation;
    ELSE
        RETURN QUERY SELECT 
            'Orders user_id foreign key'::TEXT as check_name,
            'WARNING'::TEXT as status,
            'Foreign key constraint missing'::TEXT as details,
            'HIGH'::TEXT as severity,
            'Create foreign key constraint on orders.user_id'::TEXT as recommendation;
    END IF;
    
    -- Check that cart.user_id foreign key exists and is valid
    IF EXISTS (
        SELECT FROM information_schema.table_constraints 
        WHERE table_name = 'cart' 
        AND constraint_name = 'cart_user_id_fkey'
    ) THEN
        RETURN QUERY SELECT 
            'Cart user_id foreign key'::TEXT as check_name,
            'PASSED'::TEXT as status,
            'Foreign key constraint exists'::TEXT as details,
            'LOW'::TEXT as severity,
            NULL::TEXT as recommendation;
    ELSE
        RETURN QUERY SELECT 
            'Cart user_id foreign key'::TEXT as check_name,
            'WARNING'::TEXT as status,
            'Foreign key constraint missing'::TEXT as details,
            'HIGH'::TEXT as severity,
            'Create foreign key constraint on cart.user_id'::TEXT as recommendation;
    END IF;
    
    -- Check that reviews.user_id foreign key exists and is valid
    IF EXISTS (
        SELECT FROM information_schema.table_constraints 
        WHERE table_name = 'reviews' 
        AND constraint_name = 'reviews_user_id_fkey'
    ) THEN
        RETURN QUERY SELECT 
            'Reviews user_id foreign key'::TEXT as check_name,
            'PASSED'::TEXT as status,
            'Foreign key constraint exists'::TEXT as details,
            'LOW'::TEXT as severity,
            NULL::TEXT as recommendation;
    ELSE
        RETURN QUERY SELECT 
            'Reviews user_id foreign key'::TEXT as check_name,
            'WARNING'::TEXT as status,
            'Foreign key constraint missing'::TEXT as details,
            'HIGH'::TEXT as severity,
            'Create foreign key constraint on reviews.user_id'::TEXT as recommendation;
    END IF;
    
    -- ============================================================================
    -- CHECK 6: Migration Completeness
    -- ============================================================================
    
    -- Check if legacy users table still exists
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
    ) THEN
        RETURN QUERY SELECT 
            'Legacy users table cleanup'::TEXT as check_name,
            'WARNING'::TEXT as status,
            'Legacy users table still exists'::TEXT as details,
            'MEDIUM'::TEXT as severity,
            'Run 005_remove_obsolete_tables.sql to clean up'::TEXT as recommendation;
    ELSE
        RETURN QUERY SELECT 
            'Legacy users table cleanup'::TEXT as check_name,
            'PASSED'::TEXT as status,
            'Legacy users table removed'::TEXT as details,
            'LOW'::TEXT as severity,
            NULL::TEXT as recommendation;
    END IF;
    
    -- Check for old column names that should have been migrated
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'customer_id'
    ) THEN
        RETURN QUERY SELECT 
            'Orders column migration'::TEXT as check_name,
            'FAILED'::TEXT as status,
            'Old column customer_id still exists'::TEXT as details,
            'CRITICAL'::TEXT as severity,
            'Complete column migration before proceeding'::TEXT as recommendation;
    ELSE
        RETURN QUERY SELECT 
            'Orders column migration'::TEXT as check_name,
            'PASSED'::TEXT as status,
            'All old columns migrated'::TEXT as details,
            'LOW'::TEXT as severity,
            NULL::TEXT as recommendation;
    END IF;
    
    -- Check for deleted_at columns
    SELECT COUNT(*) INTO v_count
    FROM information_schema.columns
    WHERE column_name = 'deleted_at'
    AND table_name IN ('profiles', 'categories', 'products', 'orders');
    
    IF v_count = 4 THEN
        RETURN QUERY SELECT 
            'Deleted_at columns'::TEXT as check_name,
            'PASSED'::TEXT as status,
            'All deleted_at columns present (4/4)'::TEXT as details,
            'LOW'::TEXT as severity,
            NULL::TEXT as recommendation;
    ELSE
        RETURN QUERY SELECT 
            'Deleted_at columns'::TEXT as check_name,
            'WARNING'::TEXT as status,
            format('Missing deleted_at columns (%/4 present)', v_count)::TEXT as details,
            'MEDIUM'::TEXT as severity,
            'Add missing deleted_at columns'::TEXT as recommendation;
    END IF;
    
    -- ============================================================================
    -- CHECK 7: Refund Request Reconciliation
    -- ============================================================================
    
    -- Check if refund_order_mapping table exists and has data
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'refund_order_mapping'
    ) THEN
        SELECT COUNT(*) INTO v_count
        FROM refund_order_mapping
        WHERE mapping_status = 'manual_reconciliation_required';
        
        IF v_count > 0 THEN
            RETURN QUERY SELECT 
                'Refund request reconciliation'::TEXT as check_name,
                'WARNING'::TEXT as status,
                format('% refund requests require manual reconciliation', v_count)::TEXT as details,
                'HIGH'::TEXT as severity,
                'Review refund_order_mapping table and complete reconciliation'::TEXT as recommendation;
        ELSE
            RETURN QUERY SELECT 
                'Refund request reconciliation'::TEXT as check_name,
                'PASSED'::TEXT as status,
                'All refund requests reconciled'::TEXT as details,
                'LOW'::TEXT as severity,
                NULL::TEXT as recommendation;
        END IF;
    ELSE
        RETURN QUERY SELECT 
            'Refund request reconciliation'::TEXT as check_name,
            'SKIPPED'::TEXT as status,
            'Refund order mapping table not found'::TEXT as details,
            'LOW'::TEXT as severity,
            NULL::TEXT as recommendation;
    END IF;
    
    -- ============================================================================
    -- CHECK 8: Backup Tables
    -- ============================================================================
    
    -- Check if backup tables exist
    SELECT COUNT(*) INTO v_count
    FROM information_schema.tables
    WHERE table_name LIKE '%_backup_004';
    
    IF v_count > 0 THEN
        RETURN QUERY SELECT 
            'Backup tables cleanup'::TEXT as check_name,
            'INFO'::TEXT as status,
            format('% backup tables found (can be removed after verification)', v_count)::TEXT as details,
            'LOW'::TEXT as severity,
            'Remove backup tables after successful verification'::TEXT as recommendation;
    ELSE
        RETURN QUERY SELECT 
            'Backup tables cleanup'::TEXT as check_name,
            'PASSED'::TEXT as status,
            'No backup tables found'::TEXT as details,
            'LOW'::TEXT as severity,
            NULL::TEXT as recommendation;
    END IF;
    
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- RUN VALIDATION AND DISPLAY RESULTS
-- ============================================================================

DO $$
DECLARE
    v_record RECORD;
    v_critical_count INTEGER := 0;
    v_high_count INTEGER := 0;
    v_medium_count INTEGER := 0;
    v_low_count INTEGER;
    v_total_count INTEGER;
BEGIN
    -- Clear previous validation results if table exists
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'data_migration_validation_results'
    ) THEN
        TRUNCATE data_migration_validation_results;
    ELSE
        CREATE TABLE data_migration_validation_results (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            check_name TEXT NOT NULL,
            status TEXT NOT NULL,
            details TEXT,
            severity TEXT NOT NULL,
            recommendation TEXT,
            validated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    END IF;
    
    -- Run validation and store results
    FOR v_record IN SELECT * FROM validate_data_migration()
    LOOP
        INSERT INTO data_migration_validation_results (check_name, status, details, severity, recommendation)
        VALUES (v_record.check_name, v_record.status, v_record.details, v_record.severity, v_record.recommendation);
        
        -- Count by severity
        CASE v_record.severity
            WHEN 'CRITICAL' THEN v_critical_count := v_critical_count + 1;
            WHEN 'HIGH' THEN v_high_count := v_high_count + 1;
            WHEN 'MEDIUM' THEN v_medium_count := v_medium_count + 1;
            WHEN 'LOW' THEN v_low_count := v_low_count + 1;
        END CASE;
    END LOOP;
    
    SELECT COUNT(*) INTO v_total_count FROM data_migration_validation_results;
    
    -- Output summary
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'DATA MIGRATION VALIDATION SUMMARY';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total checks: %', v_total_count;
    RAISE NOTICE 'CRITICAL: %', v_critical_count;
    RAISE NOTICE 'HIGH: %', v_high_count;
    RAISE NOTICE 'MEDIUM: %', v_medium_count;
    RAISE NOTICE 'LOW: %', v_low_count;
    RAISE NOTICE '========================================';
    
    -- Output individual results
    FOR v_record IN 
        SELECT check_name, status, details, severity, recommendation
        FROM data_migration_validation_results
        ORDER BY 
            CASE severity
                WHEN 'CRITICAL' THEN 1
                WHEN 'HIGH' THEN 2
                WHEN 'MEDIUM' THEN 3
                WHEN 'LOW' THEN 4
            END,
            check_name
    LOOP
        RAISE NOTICE '[%] %: %', v_record.severity, v_record.check_name, v_record.status;
        RAISE NOTICE '    Details: %', v_record.details;
        IF v_record.recommendation IS NOT NULL THEN
            RAISE NOTICE '    Recommendation: %', v_record.recommendation;
        END IF;
    END LOOP;
    
    RAISE NOTICE '========================================';
    
    -- Check for critical issues
    IF v_critical_count > 0 THEN
        RAISE EXCEPTION '❌ VALIDATION FAILED: % critical issues found. Review data_migration_validation_results table for details.', v_critical_count;
    ELSIF v_high_count > 0 THEN
        RAISE WARNING '⚠️  VALIDATION COMPLETED WITH WARNINGS: % high priority issues found. Review data_migration_validation_results table for details.', v_high_count;
    ELSE
        RAISE NOTICE '✅ VALIDATION PASSED: All checks successful';
    END IF;
END $$;

-- ============================================================================
-- USAGE INSTRUCTIONS
-- ============================================================================
--
-- To run validation:
--   SELECT * FROM validate_data_migration();
--
-- To view stored results:
--   SELECT * FROM data_migration_validation_results ORDER BY severity DESC, check_name;
--
-- To get summary:
--   SELECT severity, COUNT(*) FROM data_migration_validation_results GROUP BY severity ORDER BY severity DESC;
--
-- To get only failed checks:
--   SELECT * FROM data_migration_validation_results WHERE status IN ('FAILED', 'WARNING') ORDER BY severity DESC;
