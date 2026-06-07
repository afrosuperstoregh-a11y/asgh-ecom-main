# Staging Test Plan: 004_migrate_existing_data.sql

**Migration Version:** 2.0 (REMEDIATED)  
**Test Date:** [DATE]  
**Tested By:** [NAME]  
**Staging Environment:** [ENVIRONMENT]  
**Status:** [PENDING/IN PROGRESS/COMPLETED]

---

## Test Objectives

1. Verify migration executes successfully on staging environment
2. Validate data integrity after migration
3. Test application functionality with migrated data
4. Verify rollback procedure works correctly
5. Identify any issues before production deployment

---

## Pre-Test Requirements

### Environment Setup
- [ ] Staging environment is available and accessible
- [ ] Staging database has recent production-like data
- [ ] Canonical schema (002_create_canonical_schema.sql) has been applied
- [ ] RLS policies (003_apply_canonical_rls_policies.sql) have been applied
- [ ] Database backup of staging environment exists

### Test Data Preparation
- [ ] Verify staging has legacy users table (if applicable)
- [ ] Verify staging has orders with customer_id column (if applicable)
- [ ] Verify staging has order_items with old column names (if applicable)
- [ ] Verify staging has payments with old column names (if applicable)
- [ ] Verify staging has cart with customer_id column (if applicable)
- [ ] Verify staging has reviews with customer_id column (if applicable)
- [ ] Document current row counts for all tables

### Tools and Access
- [ ] Database access credentials for staging
- [ ] psql or other SQL client available
- [ ] Application access to staging environment
- [ ] Monitoring tools available

---

## Test Cases

### Test Case 1: Migration Execution

**Objective:** Verify migration script executes without errors

**Steps:**
1. Take baseline snapshot of database state
2. Execute migration script:
   ```bash
   psql -h staging-host -U staging-user -d staging-db -f 004_migrate_existing_data.sql
   ```
3. Monitor execution logs
4. Verify completion status

**Expected Results:**
- Migration completes successfully
- No errors in execution logs
- Validation summary shows no critical issues

**Actual Results:**
- [ ] Migration completed successfully
- [ ] No errors encountered
- [ ] Validation summary: [DETAILS]

**Status:** [PASS/FAIL]

---

### Test Case 2: Pre-Migration Validation

**Objective:** Verify pre-migration validations run correctly

**Steps:**
1. Check `migration_validation_results` table
2. Review each validation check
3. Verify no critical failures

**Expected Results:**
- Schema existence check: PASSED
- Auth schema check: PASSED or SKIPPED
- User/auth mapping: PASSED or WARNING
- Profile duplicate check: PASSED
- Orphan record check (pre): PASSED or WARNING
- Backup creation: PASSED

**Actual Results:**
- Schema existence check: [RESULT]
- Auth schema check: [RESULT]
- User/auth mapping: [RESULT]
- Profile duplicate check: [RESULT]
- Orphan record check (pre): [RESULT]
- Backup creation: [RESULT]

**Status:** [PASS/FAIL]

---

### Test Case 3: User Migration

**Objective:** Verify users table migrates to profiles correctly

**Steps:**
1. Count legacy users before migration
2. Count profiles after migration
3. Verify user_id mappings are correct
4. Check for duplicate profiles
5. Verify admin_users migration

**Expected Results:**
- All legacy users migrated to profiles
- No duplicate profiles created
- user_id correctly references auth.users (if applicable)
- Admin users migrated correctly

**Actual Results:**
- Legacy users count: [NUMBER]
- Profiles after migration: [NUMBER]
- Migrated: [NUMBER]
- Skipped: [NUMBER]
- Duplicate profiles: [NUMBER]
- Admin users migrated: [NUMBER]

**Status:** [PASS/FAIL]

---

### Test Case 4: Orders Column Migration

**Objective:** Verify orders column renames work correctly

**Steps:**
1. Verify customer_id column removed
2. Verify user_id column exists
3. Verify data copied correctly
4. Verify foreign key created
5. Verify guest_email column exists
6. Verify total column exists

**Expected Results:**
- customer_id column removed
- user_id column exists with correct data
- Foreign key references profiles(id)
- guest_email column exists with correct data
- total column exists with correct data

**Actual Results:**
- customer_id removed: [YES/NO]
- user_id exists: [YES/NO]
- Data count matches: [YES/NO]
- Foreign key created: [YES/NO]
- guest_email exists: [YES/NO]
- total exists: [YES/NO]

**Status:** [PASS/FAIL]

---

### Test Case 5: Order Items Migration

**Objective:** Verify order_items column renames work correctly

**Steps:**
1. Verify unit_price removed
2. Verify price column exists
3. Verify total_price removed
4. Verify total column exists
5. Verify product_name removed
6. Verify product_sku removed

**Expected Results:**
- unit_price removed, price exists with correct data
- total_price removed, total exists with correct data
- product_name removed
- product_sku removed

**Actual Results:**
- unit_price removed: [YES/NO]
- price exists: [YES/NO]
- total_price removed: [YES/NO]
- total exists: [YES/NO]
- product_name removed: [YES/NO]
- product_sku removed: [YES/NO]

**Status:** [PASS/FAIL]

---

### Test Case 6: Payments Migration

**Objective:** Verify payments column renames work correctly

**Steps:**
1. Verify payment_method removed
2. Verify provider column exists
3. Verify payment_intent_id removed
4. Verify provider_id column exists

**Expected Results:**
- payment_method removed, provider exists with correct data
- payment_intent_id removed, provider_id exists with correct data

**Actual Results:**
- payment_method removed: [YES/NO]
- provider exists: [YES/NO]
- payment_intent_id removed: [YES/NO]
- provider_id exists: [YES/NO]

**Status:** [PASS/FAIL]

---

### Test Case 7: Cart Migration

**Objective:** Verify cart column rename works correctly

**Steps:**
1. Verify customer_id removed
2. Verify user_id column exists
3. Verify foreign key created

**Expected Results:**
- customer_id removed
- user_id exists with correct data
- Foreign key references profiles(id)

**Actual Results:**
- customer_id removed: [YES/NO]
- user_id exists: [YES/NO]
- Foreign key created: [YES/NO]

**Status:** [PASS/FAIL]

---

### Test Case 8: Reviews Migration

**Objective:** Verify reviews column rename works correctly

**Steps:**
1. Verify customer_id removed
2. Verify user_id column exists
3. Verify foreign key created

**Expected Results:**
- customer_id removed
- user_id exists with correct data
- Foreign key references profiles(id)

**Actual Results:**
- customer_id removed: [YES/NO]
- user_id exists: [YES/NO]
- Foreign key created: [YES/NO]

**Status:** [PASS/FAIL]

---

### Test Case 9: Inventory Logs Migration

**Objective:** Verify inventory_logs foreign key updated

**Steps:**
1. Verify created_by foreign key references profiles
2. Verify constraint name is correct

**Expected Results:**
- created_by foreign key references profiles(id)
- Constraint exists with correct name

**Actual Results:**
- FK references profiles: [YES/NO]
- Constraint exists: [YES/NO]

**Status:** [PASS/FAIL]

---

### Test Case 10: Refund Requests Migration

**Objective:** Verify refund_requests type conversion with data preservation

**Steps:**
1. Verify order_id is now UUID type
2. Check refund_order_mapping table exists
3. Verify old order IDs preserved in mapping table
4. Note any records requiring manual reconciliation

**Expected Results:**
- order_id is UUID type
- refund_order_mapping table exists
- Old order IDs preserved
- Manual reconciliation requirements documented

**Actual Results:**
- order_id is UUID: [YES/NO]
- Mapping table exists: [YES/NO]
- Records requiring reconciliation: [NUMBER]

**Status:** [PASS/FAIL/WARNING]

---

### Test Case 11: Deleted_at Columns

**Objective:** Verify deleted_at columns added where missing

**Steps:**
1. Check profiles.deleted_at exists
2. Check categories.deleted_at exists
3. Check products.deleted_at exists
4. Check orders.deleted_at exists
5. Check customer_profiles.deleted_at exists (if table exists)

**Expected Results:**
- All expected deleted_at columns exist

**Actual Results:**
- profiles.deleted_at: [YES/NO]
- categories.deleted_at: [YES/NO]
- products.deleted_at: [YES/NO]
- orders.deleted_at: [YES/NO]
- customer_profiles.deleted_at: [YES/NO/N/A]

**Status:** [PASS/FAIL]

---

### Test Case 12: Post-Migration Validation

**Objective:** Verify post-migration validations pass

**Steps:**
1. Run validation script:
   ```bash
   psql -h staging-host -U staging-user -d staging-db -f 004_validate_data_migration.sql
   ```
2. Review validation results
3. Check for orphaned records
4. Check foreign key integrity

**Expected Results:**
- No critical validation issues
- No orphaned records (or acceptable number)
- All foreign keys valid

**Actual Results:**
- Critical issues: [NUMBER]
- High priority issues: [NUMBER]
- Orphaned orders: [NUMBER]
- Orphaned order items: [NUMBER]
- Orphaned cart items: [NUMBER]
- Orphaned reviews: [NUMBER]
- Orphaned payments: [NUMBER]
- Orphaned inventory_logs: [NUMBER]

**Status:** [PASS/FAIL/WARNING]

---

### Test Case 13: Backup Tables

**Objective:** Verify backup tables created correctly

**Steps:**
1. Check users_backup_004 exists (if users table existed)
2. Check orders_backup_004 exists
3. Check order_items_backup_004 exists
4. Check payments_backup_004 exists
5. Check refund_requests_backup_004 exists
6. Check cart_backup_004 exists
7. Check reviews_backup_004 exists
8. Check inventory_logs_backup_004 exists
9. Verify row counts match source tables

**Expected Results:**
- All backup tables exist
- Row counts match source tables

**Actual Results:**
- users_backup_004: [EXISTS/NOT APPLICABLE]
- orders_backup_004: [EXISTS]
- order_items_backup_004: [EXISTS]
- payments_backup_004: [EXISTS]
- refund_requests_backup_004: [EXISTS]
- cart_backup_004: [EXISTS]
- reviews_backup_004: [EXISTS]
- inventory_logs_backup_004: [EXISTS]
- Row counts match: [YES/NO]

**Status:** [PASS/FAIL]

---

### Test Case 14: Application Functionality

**Objective:** Verify application works with migrated data

**Steps:**
1. Test user login
2. Test user registration
3. Test order creation
4. Test cart functionality
5. Test product browsing
6. Test review submission
7. Test admin panel access
8. Test payment processing

**Expected Results:**
- All application functions work correctly
- No errors in application logs
- User authentication works
- Orders can be created and viewed

**Actual Results:**
- User login: [PASS/FAIL]
- User registration: [PASS/FAIL]
- Order creation: [PASS/FAIL]
- Cart functionality: [PASS/FAIL]
- Product browsing: [PASS/FAIL]
- Review submission: [PASS/FAIL]
- Admin panel: [PASS/FAIL]
- Payment processing: [PASS/FAIL]

**Status:** [PASS/FAIL]

---

### Test Case 15: Rollback Test

**Objective:** Verify rollback procedure works correctly

**Steps:**
1. Note current state
2. Restore from backup tables:
   ```sql
   TRUNCATE orders;
   INSERT INTO orders SELECT * FROM orders_backup_004;
   ```
3. Verify data restored correctly
4. Re-run migration to restore forward state

**Expected Results:**
- Rollback succeeds
- Data restored to pre-migration state
- Re-migration succeeds

**Actual Results:**
- Rollback succeeded: [YES/NO]
- Data restored: [YES/NO]
- Re-migration succeeded: [YES/NO]

**Status:** [PASS/FAIL]

---

## Test Summary

### Test Results Overview
| Test Case | Description | Status | Notes |
|-----------|-------------|--------|-------|
| 1 | Migration Execution | [PASS/FAIL] | [NOTES] |
| 2 | Pre-Migration Validation | [PASS/FAIL] | [NOTES] |
| 3 | User Migration | [PASS/FAIL] | [NOTES] |
| 4 | Orders Column Migration | [PASS/FAIL] | [NOTES] |
| 5 | Order Items Migration | [PASS/FAIL] | [NOTES] |
| 6 | Payments Migration | [PASS/FAIL] | [NOTES] |
| 7 | Cart Migration | [PASS/FAIL] | [NOTES] |
| 8 | Reviews Migration | [PASS/FAIL] | [NOTES] |
| 9 | Inventory Logs Migration | [PASS/FAIL] | [NOTES] |
| 10 | Refund Requests Migration | [PASS/FAIL] | [NOTES] |
| 11 | Deleted_at Columns | [PASS/FAIL] | [NOTES] |
| 12 | Post-Migration Validation | [PASS/FAIL] | [NOTES] |
| 13 | Backup Tables | [PASS/FAIL] | [NOTES] |
| 14 | Application Functionality | [PASS/FAIL] | [NOTES] |
| 15 | Rollback Test | [PASS/FAIL] | [NOTES] |

### Overall Result
- **Total Tests:** 15
- **Passed:** [NUMBER]
- **Failed:** [NUMBER]
- **Warnings:** [NUMBER]
- **Overall Status:** [PASS/FAIL/CONDITIONAL PASS]

---

## Issues Found

### Critical Issues
1. [ISSUE 1]
2. [ISSUE 2]

### High Priority Issues
1. [ISSUE 1]
2. [ISSUE 2]

### Medium Priority Issues
1. [ISSUE 1]
2. [ISSUE 2]

### Low Priority Issues
1. [ISSUE 1]
2. [ISSUE 2]

---

## Recommendations

### For Production Deployment
1. [RECOMMENDATION 1]
2. [RECOMMENDATION 2]
3. [RECOMMENDATION 3]

### For Follow-up
1. [RECOMMENDATION 1]
2. [RECOMMENDATION 2]

---

## Sign-Off

### Test Execution
- **Tested By:** [NAME]
- **Date:** [DATE]
- **Signature:** [SIGNATURE]

### Test Review
- **Reviewed By:** [NAME]
- **Date:** [DATE]
- **Signature:** [SIGNATURE]

### Production Approval
- **Approved By:** [NAME]
- **Date:** [DATE]
- **Signature:** [SIGNATURE]

---

## Appendix

### Test Environment Details
- **Staging Database:** [DATABASE_NAME]
- **Staging Host:** [HOST]
- **Staging Port:** [PORT]
- **Test Data Source:** [SOURCE]

### Execution Logs
[ATTACH LOGS OR REFERENCE LOCATION]

### Screenshots
[ATTACH SCREENSHOTS OR REFERENCE LOCATION]

---

**Test Plan Version:** 1.0  
**Last Updated:** 2025-06-07
