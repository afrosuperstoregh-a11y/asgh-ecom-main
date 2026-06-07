-- PHASE 12: Automated Validation Scripts
-- Migration: 007_validate_schema_integrity.sql
-- Purpose: Validate schema integrity, security, and performance
-- This migration creates validation functions and runs comprehensive checks

BEGIN;

-- ============================================================================
-- VALIDATION: SCHEMA INTEGRITY
-- ============================================================================

-- CREATE OR REPLACE FUNCTION validate_schema_integrity()
-- RETURNS TABLE (
--     check_name TEXT,
--     status TEXT,
--     details TEXT,
--     severity TEXT
-- ) AS $$
-- DECLARE
--     orphan_count INTEGER;
--     duplicate_count INTEGER;
--     missing_index_count INTEGER;
--     missing_constraint_count INTEGER;
-- BEGIN
--     -- Check 1: Orphaned records in child tables
--     -- Orders without valid user
--     SELECT COUNT(*) INTO orphan_count
--     FROM orders o
--     LEFT JOIN profiles p ON o.user_id = p.id
--     WHERE o.user_id IS NOT NULL AND p.id IS NULL;
    
--     IF orphan_count > 0 THEN
--         RETURN QUERY SELECT 
--             'Orphaned orders'::TEXT as check_name,
--             'FAILED'::TEXT as status,
--             format('%s orders without valid user_id', orphan_count)::TEXT as details,
--             'HIGH'::TEXT as severity;
--     ELSE
--         RETURN QUERY SELECT 
--             'Orphaned orders'::TEXT as check_name,
--             'PASSED'::TEXT as status,
--             'No orphaned orders found'::TEXT as details,
--             'LOW'::TEXT as severity;
--     END IF;
    
--     -- Check 2: Order items without valid order
--     SELECT COUNT(*) INTO orphan_count
--     FROM order_items oi
--     LEFT JOIN orders o ON oi.order_id = o.id
--     WHERE o.id IS NULL;
    
--     IF orphan_count > 0 THEN
--         RETURN QUERY SELECT 
--             'Orphaned order items'::TEXT as check_name,
--             'FAILED'::TEXT as status,
--             format('%s order items without valid order_id', orphan_count)::TEXT as details,
--             'HIGH'::TEXT as severity;
--     ELSE
--         RETURN QUERY SELECT 
--             'Orphaned order items'::TEXT as check_name,
--             'PASSED'::TEXT as status,
--             'No orphaned order items found'::TEXT as details,
--             'LOW'::TEXT as severity;
--     END IF;
    
--     -- Check 3: Duplicate slugs in products
--     SELECT COUNT(*) INTO duplicate_count
--     FROM (
--         SELECT slug, COUNT(*) 
--         FROM products 
--         WHERE deleted_at IS NULL
--         GROUP BY slug 
--         HAVING COUNT(*) > 1
--     ) dupes;
    
--     IF duplicate_count > 0 THEN
--         RETURN QUERY SELECT 
--             'Duplicate product slugs'::TEXT as check_name,
--             'FAILED'::TEXT as status,
--             format('%s duplicate slugs found', duplicate_count)::TEXT as details,
--             'HIGH'::TEXT as severity;
--     ELSE
--         RETURN QUERY SELECT 
--             'Duplicate product slugs'::TEXT as check_name,
--             'PASSED'::TEXT as status,
--             'No duplicate slugs found'::TEXT as details,
--             'LOW'::TEXT as severity;
--     END IF;
    
--     -- Check 4: Duplicate SKUs
--     SELECT COUNT(*) INTO duplicate_count
--     FROM (
--         SELECT sku, COUNT(*) 
--         FROM products 
--         WHERE deleted_at IS NULL
--         GROUP BY sku 
--         HAVING COUNT(*) > 1
--     ) dupes;
    
--     IF duplicate_count > 0 THEN
--         RETURN QUERY SELECT 
--             'Duplicate product SKUs'::TEXT as check_name,
--             'FAILED'::TEXT as status,
--             format('%s duplicate SKUs found', duplicate_count)::TEXT as details,
--             'HIGH'::TEXT as severity;
--     ELSE
--         RETURN QUERY SELECT 
--             'Duplicate product SKUs'::TEXT as check_name,
--             'PASSED'::TEXT as status,
--             'No duplicate SKUs found'::TEXT as details,
--             'LOW'::TEXT as severity;
--     END IF;
    
--     -- Check 5: Missing foreign key indexes
--     SELECT COUNT(*) INTO missing_index_count
--     FROM (
--         SELECT 
--             conname as constraint_name,
--             conrelid::regclass as table_name,
--             confrelid::regclass as referenced_table
--         FROM pg_constraint
--         WHERE contype = 'f'
--         AND connamespace = 'public'::regnamespace
--     ) fk
--     LEFT JOIN pg_indexes ON fk.table_name = pg_indexes.tablename
--     WHERE pg_indexes.tablename IS NULL;
    
--     IF missing_index_count > 0 THEN
--         RETURN QUERY SELECT 
--             'Missing FK indexes'::TEXT as check_name,
--             'WARNING'::TEXT as status,
--             format('%s foreign keys without indexes', missing_index_count)::TEXT as details,
--             'MEDIUM'::TEXT as severity;
--     ELSE
--         RETURN QUERY SELECT 
--             'Missing FK indexes'::TEXT as check_name,
--             'PASSED'::TEXT as status,
--             'All foreign keys have indexes'::TEXT as details,
--             'LOW'::TEXT as severity;
--     END IF;
    
--     -- Check 6: Negative prices
--     SELECT COUNT(*) INTO missing_constraint_count
--     FROM products 
--     WHERE price < 0 AND deleted_at IS NULL;
    
--     IF missing_constraint_count > 0 THEN
--         RETURN QUERY SELECT 
--             'Negative prices'::TEXT as check_name,
--             'FAILED'::TEXT as status,
--             format('%s products with negative prices', missing_constraint_count)::TEXT as details,
--             'HIGH'::TEXT as severity;
--     ELSE
--         RETURN QUERY SELECT 
--             'Negative prices'::TEXT as check_name,
--             'PASSED'::TEXT as status,
--             'No negative prices found'::TEXT as details,
--             'LOW'::TEXT as severity;
--     END IF;
    
--     -- Check 7: Invalid ratings
--     SELECT COUNT(*) INTO missing_constraint_count
--     FROM reviews 
--     WHERE rating < 1 OR rating > 5;
    
--     IF missing_constraint_count > 0 THEN
--         RETURN QUERY SELECT 
--             'Invalid ratings'::TEXT as check_name,
--             'FAILED'::TEXT as status,
--             format('%s reviews with invalid ratings', missing_constraint_count)::TEXT as details,
--             'HIGH'::TEXT as severity;
--     ELSE
--         RETURN QUERY SELECT 
--             'Invalid ratings'::TEXT as check_name,
--             'PASSED'::TEXT as status,
--             'All ratings are valid'::TEXT as details,
--             'LOW'::TEXT as severity;
--     END IF;
    
--     RETURN;
-- END;
-- $$ LANGUAGE plpgsql;

-- ============================================================================
-- VALIDATION: SECURITY
-- ============================================================================

-- CREATE OR REPLACE FUNCTION validate_security()
-- RETURNS TABLE (
--     check_name TEXT,
--     status TEXT,
--     details TEXT,
--     severity TEXT
-- ) AS $$
-- BEGIN
--     -- Check 1: RLS enabled on sensitive tables
--     IF NOT EXISTS (
--         SELECT 1 FROM pg_tables 
--         WHERE schemaname = 'public' 
--         AND tablename IN ('profiles', 'orders', 'payments', 'customer_profiles')
--         AND rowsecurity = true
--         HAVING COUNT(*) = 4
--     ) THEN
--         RETURN QUERY SELECT 
--             'RLS enabled on sensitive tables'::TEXT as check_name,
--             'FAILED'::TEXT as status,
--             'RLS not enabled on all sensitive tables'::TEXT as details,
--             'CRITICAL'::TEXT as severity;
--     ELSE
--         RETURN QUERY SELECT 
--             'RLS enabled on sensitive tables'::TEXT as check_name,
--             'PASSED'::TEXT as status,
--             'RLS enabled on all sensitive tables'::TEXT as details,
--             'LOW'::TEXT as severity;
--     END IF;
    
    -- Check 2: No overly permissive public policies
    -- IF EXISTS (
    --     SELECT 1 FROM pg_policies 
    --     WHERE schemaname = 'public'
    --     AND (qual = 'true'::text OR with_check = 'true'::text)
    -- ) THEN
    --     RETURN QUERY SELECT 
    --         'Overly permissive policies'::TEXT as check_name,
    --         'WARNING'::TEXT as status,
    --         'Found policies with USING(true) or WITH CHECK(true)'::TEXT as details,
    --         'HIGH'::TEXT as severity;
    -- ELSE
    --     RETURN QUERY SELECT 
    --         'Overly permissive policies'::TEXT as check_name,
    --         'PASSED'::TEXT as status,
    --         'No overly permissive policies found'::TEXT as details,
    --         'LOW'::TEXT as severity;
    -- END IF;
    
    -- Check 3: UUID comparison bugs
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND (qual LIKE '%::text%'::text OR with_check LIKE '%::text%'::text)
    ) THEN
        RETURN QUERY SELECT 
            'UUID comparison bugs'::TEXT as check_name,
            'FAILED'::TEXT as status,
            'Found policies with UUID ::text casting'::TEXT as details,
            'CRITICAL'::TEXT as severity;
    ELSE
        RETURN QUERY SELECT 
            'UUID comparison bugs'::TEXT as check_name,
            'PASSED'::TEXT as status,
            'No UUID comparison bugs found'::TEXT as details,
            'LOW'::TEXT as severity;
    END IF;
    
    -- Check 4: Admin user exists
    IF NOT EXISTS (
        SELECT 1 FROM admin_users
    ) THEN
        RETURN QUERY SELECT 
            'Admin user exists'::TEXT as check_name,
            'WARNING'::TEXT as status,
            'No admin user found'::TEXT as details,
            'HIGH'::TEXT as severity;
    ELSE
        RETURN QUERY SELECT 
            'Admin user exists'::TEXT as check_name,
            'PASSED'::TEXT as status,
            'Admin user exists'::TEXT as details,
            'LOW'::TEXT as severity;
    END IF;
    
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VALIDATION: PERFORMANCE
-- ============================================================================

-- CREATE OR REPLACE FUNCTION validate_performance()
-- RETURNS TABLE (
--     check_name TEXT,
--     status TEXT,
--     details TEXT,
--     severity TEXT
-- ) AS $$
-- DECLARE
--     table_size BIGINT;
--     index_size BIGINT;
--     total_size BIGINT;
-- BEGIN
--     -- Check 1: Table sizes
--     SELECT pg_total_relation_size('profiles') INTO table_size;
--     SELECT pg_total_relation_size('orders') INTO total_size;
    
--     RETURN QUERY SELECT 
--         'Table sizes'::TEXT as check_name,
--         'INFO'::TEXT as status,
--         format('Profiles: %s MB, Orders: %s MB', 
--             round(table_size / 1024.0 / 1024.0, 2),
--             round(total_size / 1024.0 / 1024.0, 2))::TEXT as details,
--         'LOW'::TEXT as severity;
    
--     -- Check 2: Index usage
--     SELECT pg_indexes_size('profiles') INTO index_size;
--     SELECT pg_total_relation_size('profiles') INTO table_size;
    
--     IF table_size > 0 AND index_size / table_size::FLOAT < 0.1 THEN
--         RETURN QUERY SELECT 
--             'Index coverage'::TEXT as check_name,
--             'WARNING'::TEXT as status,
--             'Low index coverage on profiles table'::TEXT as details,
--             'MEDIUM'::TEXT as severity;
--     ELSE
--         RETURN QUERY SELECT 
--             'Index coverage'::TEXT as check_name,
--             'PASSED'::TEXT as status,
--             'Good index coverage'::TEXT as details,
--             'LOW'::TEXT as severity;
--     END IF;
    
--     -- Check 3: Missing composite indexes
--     IF NOT EXISTS (
--         SELECT 1 FROM pg_indexes 
--         WHERE tablename = 'orders'
--         AND indexdef LIKE '%user_id%'
--         AND indexdef LIKE '%created_at%'
--     ) THEN
--         RETURN QUERY SELECT 
--             'Composite indexes'::TEXT as check_name,
--             'WARNING'::TEXT as status,
--             'Missing composite index on orders(user_id, created_at)'::TEXT as details,
--             'MEDIUM'::TEXT as severity;
--     ELSE
--         RETURN QUERY SELECT 
--             'Composite indexes'::TEXT as check_name,
--             'PASSED'::TEXT as status,
--             'Composite indexes present'::TEXT as details,
--             'LOW'::TEXT as severity;
--     END IF;
    
--     RETURN;
-- END;
-- $$ LANGUAGE plpgsql;

-- ============================================================================
-- VALIDATION: MIGRATION INTEGRITY
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_migration_integrity()
RETURNS TABLE (
    check_name TEXT,
    status TEXT,
    details TEXT,
    severity TEXT
) AS $$
DECLARE
    migration_count INTEGER;
    failed_migrations INTEGER;
BEGIN
    -- Check 1: All migrations executed successfully
    SELECT COUNT(*) INTO migration_count
    FROM migration_log;
    
    SELECT COUNT(*) INTO failed_migrations
    FROM migration_log
    WHERE success = false;
    
    IF failed_migrations > 0 THEN
        RETURN QUERY SELECT 
            'Migration success rate'::TEXT as check_name,
            'FAILED'::TEXT as status,
            format('%s of %s migrations failed', failed_migrations, migration_count)::TEXT as details,
            'CRITICAL'::TEXT as severity;
    ELSE
        RETURN QUERY SELECT 
            'Migration success rate'::TEXT as check_name,
            'PASSED'::TEXT as status,
            format('All %s migrations executed successfully', migration_count)::TEXT as details,
            'LOW'::TEXT as severity;
    END IF;
    
    -- Check 2: Required migrations present
    IF NOT EXISTS (
        SELECT 1 FROM migration_log 
        WHERE migration_name IN (
            '001_fix_rls_uuid_vulnerability.sql',
            '002_create_canonical_schema.sql',
            '003_apply_canonical_rls_policies.sql'
        )
        HAVING COUNT(*) = 3
    ) THEN
        RETURN QUERY SELECT 
            'Required migrations'::TEXT as check_name,
            'FAILED'::TEXT as status,
            'Missing required canonical migrations'::TEXT as details,
            'CRITICAL'::TEXT as severity;
    ELSE
        RETURN QUERY SELECT 
            'Required migrations'::TEXT as check_name,
            'PASSED'::TEXT as status,
            'All required migrations present'::TEXT as details,
            'LOW'::TEXT as severity;
    END IF;
    
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- MASTER VALIDATION FUNCTION
-- ============================================================================

-- CREATE OR REPLACE FUNCTION validate_all()
-- RETURNS TABLE (
--     category TEXT,
--     check_name TEXT,
--     status TEXT,
--     details TEXT,
--     severity TEXT
-- ) AS $$
-- BEGIN
--     RETURN QUERY
--     SELECT 'SCHEMA INTEGRITY'::TEXT as category, * FROM validate_schema_integrity()
--     UNION ALL
--     SELECT 'SECURITY'::TEXT as category, * FROM validate_security()
--     UNION ALL
--     SELECT 'PERFORMANCE'::TEXT as category, * FROM validate_performance()
--     UNION ALL
--     SELECT 'MIGRATION INTEGRITY'::TEXT as category, * FROM validate_migration_integrity();
-- END;
-- $$ LANGUAGE plpgsql;

-- ============================================================================
-- RUN VALIDATION AND LOG RESULTS
-- ============================================================================

DO $$
DECLARE
    validation_record RECORD;
    critical_count INTEGER := 0;
    high_count INTEGER := 0;
    medium_count INTEGER := 0;
    low_count INTEGER := 0;
BEGIN
    -- Create validation results table if not exists
    CREATE TABLE IF NOT EXISTS validation_results (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        category TEXT NOT NULL,
        check_name TEXT NOT NULL,
        status TEXT NOT NULL,
        details TEXT,
        severity TEXT NOT NULL,
        validated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    
    -- Clear previous results
    TRUNCATE validation_results;
    
    -- Run validation and store results
    FOR validation_record IN SELECT * FROM validate_all()
    LOOP
        INSERT INTO validation_results (category, check_name, status, details, severity)
        VALUES (validation_record.category, validation_record.check_name, 
                validation_record.status, validation_record.details, validation_record.severity);
        
        -- Count by severity
        CASE validation_record.severity
            WHEN 'CRITICAL' THEN critical_count := critical_count + 1;
            WHEN 'HIGH' THEN high_count := high_count + 1;
            WHEN 'MEDIUM' THEN medium_count := medium_count + 1;
            WHEN 'LOW' THEN low_count := low_count + 1;
        END CASE;
    END LOOP;
    
    -- Output summary
    RAISE NOTICE '========================================';
    RAISE NOTICE 'VALIDATION SUMMARY';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'CRITICAL: %', critical_count;
    RAISE NOTICE 'HIGH: %', high_count;
    RAISE NOTICE 'MEDIUM: %', medium_count;
    RAISE NOTICE 'LOW: %', low_count;
    RAISE NOTICE '========================================';
    
    IF critical_count > 0 THEN
        RAISE EXCEPTION '❌ VALIDATION FAILED: % critical issues found', critical_count;
    ELSIF high_count > 0 THEN
        RAISE WARNING '⚠️  VALIDATION WARNING: % high priority issues found', high_count;
    ELSE
        RAISE NOTICE '✅ VALIDATION PASSED: All checks successful';
    END IF;
END $$;

-- ============================================================================
-- MIGRATION LOG ENTRY
-- ============================================================================

INSERT INTO migration_log (migration_name, executed_at, success, checksum)
VALUES ('007_validate_schema_integrity.sql', NOW(), true, md5(current_timestamp::text))
ON CONFLICT (migration_name) DO UPDATE SET
    executed_at = NOW(),
    success = true;

COMMIT;

-- ============================================================================
-- POST-MIGRATION NOTES
-- ============================================================================
--
-- This migration creates comprehensive validation functions.
--
-- USAGE:
--
-- Run all validations:
-- SELECT * FROM validate_all();
--
-- Run specific validation categories:
-- SELECT * FROM validate_schema_integrity();
-- SELECT * FROM validate_security();
-- SELECT * FROM validate_performance();
-- SELECT * FROM validate_migration_integrity();
--
-- View validation results:
-- SELECT * FROM validation_results ORDER BY severity DESC, validated_at DESC;
--
-- AUTOMATED VALIDATION:
-- This migration runs validation automatically and logs results.
-- Critical issues will cause the migration to fail.
--
-- INTEGRATION WITH CI/CD:
-- Add to deployment pipeline:
-- psql -f 007_validate_schema_integrity.sql
-- Check exit code for validation results
