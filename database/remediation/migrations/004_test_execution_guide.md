# Test Execution Guide

**Purpose:** Step-by-step guide for executing staging test plan  
**Test Date:** [DATE]  
**Tested By:** [NAME]

---

## Pre-Test Preparation

### 1. Gather Required Information
- [ ] Staging database host: `____________________`
- [ ] Staging database port: `____________________`
- [ ] Staging database name: `____________________`
- [ ] Staging database user: `____________________`
- [ ] Staging application URL: `____________________`
- [ ] Backup location: `____________________`

### 2. Prepare Test Environment
- [ ] Open terminal/command prompt
- [ ] Navigate to migrations directory:
  ```bash
  cd database/remediation/migrations
  ```
- [ ] Verify all required files exist:
  ```bash
  ls -la 004_*.sql 004_*.md
  ```

### 3. Create Test Session Directory
```bash
mkdir -p test_results/$(date +%Y%m%d_%H%M%S)
cd test_results/$(date +%Y%m%d_%H%M%S)
```

---

## Test Execution Steps

### Phase 1: Pre-Migration Setup

#### Step 1.1: Verify Staging Environment
```bash
# Test database connection
psql -h [HOST] -U [USER] -d [DATABASE] -c "SELECT version();"

# Expected: PostgreSQL version output
```

**Result:** [PASS/FAIL]  
**Notes:** ____________________

#### Step 1.2: Verify Canonical Schema Applied
```bash
psql -h [HOST] -U [USER] -d [DATABASE] -c "
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'orders', 'order_items', 'payments', 'cart', 'reviews')
ORDER BY table_name;
"
```

**Expected:** All tables listed  
**Result:** [PASS/FAIL]  
**Notes:** ____________________

#### Step 1.3: Prepare Test Data
```bash
psql -h [HOST] -U [USER] -d [DATABASE] -f ../004_prepare_test_data.sql > test_data_preparation.log 2>&1
```

**Result:** [PASS/FAIL]  
**Notes:** ____________________

#### Step 1.4: Verify Test Data
```bash
psql -h [HOST] -U [USER] -d [DATABASE] -c "SELECT * FROM pre_migration_snapshot ORDER BY table_name;"
```

**Expected:** Row counts for all tables  
**Result:** [PASS/FAIL]  
**Notes:** ____________________

#### Step 1.5: Create Pre-Migration Backup
```bash
pg_dump -h [HOST] -U [USER] -d [DATABASE] > pre_migration_backup.sql
```

**Result:** [PASS/FAIL]  
**Backup size:** ____________________  
**Notes:** ____________________

---

### Phase 2: Migration Execution

#### Step 2.1: Execute Migration
```bash
psql -h [HOST] -U [USER] -d [DATABASE] -f ../004_migrate_existing_data.sql > migration_execution.log 2>&1
```

**Result:** [PASS/FAIL]  
**Execution time:** ____________________  
**Notes:** ____________________

#### Step 2.2: Review Migration Log
```bash
tail -50 migration_execution.log
```

**Critical issues found:** [YES/NO]  
**High priority issues found:** [YES/NO]  
**Notes:** ____________________

#### Step 2.3: Check Migration Validation Results
```bash
psql -h [HOST] -U [USER] -d [DATABASE] -c "
SELECT validation_name, status, severity, details 
FROM migration_validation_results 
ORDER BY 
  CASE severity
    WHEN 'CRITICAL' THEN 1
    WHEN 'HIGH' THEN 2
    WHEN 'MEDIUM' THEN 3
    WHEN 'LOW' THEN 4
  END,
  validation_name;
"
```

**Critical issues:** [NUMBER]  
**High priority issues:** [NUMBER]  
**Result:** [PASS/FAIL/WARNING]  
**Notes:** ____________________

---

### Phase 3: Post-Migration Validation

#### Step 3.1: Run Validation Script
```bash
psql -h [HOST] -U [USER] -d [DATABASE] -f ../004_validate_data_migration.sql > validation_execution.log 2>&1
```

**Result:** [PASS/FAIL]  
**Notes:** ____________________

#### Step 3.2: Review Validation Results
```bash
psql -h [HOST] -U [USER] -d [DATABASE] -c "
SELECT * FROM data_migration_validation_results 
ORDER BY 
  CASE severity
    WHEN 'CRITICAL' THEN 1
    WHEN 'HIGH' THEN 2
    WHEN 'MEDIUM' THEN 3
    WHEN 'LOW' THEN 4
  END,
  check_name;
"
```

**Critical issues:** [NUMBER]  
**High priority issues:** [NUMBER]  
**Result:** [PASS/FAIL/WARNING]  
**Notes:** ____________________

#### Step 3.3: Check for Orphaned Records
```bash
psql -h [HOST] -U [USER] -d [DATABASE] -c "
SELECT 'orders' as table_name, COUNT(*) as orphan_count
FROM orders o
LEFT JOIN profiles p ON o.user_id = p.id
WHERE o.user_id IS NOT NULL AND p.id IS NULL

UNION ALL

SELECT 'order_items', COUNT(*)
FROM order_items oi
LEFT JOIN orders o ON oi.order_id = o.id
WHERE o.id IS NULL

UNION ALL

SELECT 'cart', COUNT(*)
FROM cart c
LEFT JOIN profiles p ON c.user_id = p.id
WHERE c.user_id IS NOT NULL AND p.id IS NULL;
"
```

**Orphaned records:** [NUMBER]  
**Result:** [PASS/FAIL]  
**Notes:** ____________________

#### Step 3.4: Verify Backup Tables Created
```bash
psql -h [HOST] -U [USER] -d [DATABASE] -c "
SELECT table_name, pg_size_pretty(pg_total_relation_size(table_name)) as size
FROM information_schema.tables
WHERE table_name LIKE '%_backup_004'
ORDER BY table_name;
"
```

**Backup tables created:** [NUMBER]  
**Result:** [PASS/FAIL]  
**Notes:** ____________________

#### Step 3.5: Compare Pre/Post Migration Counts
```bash
psql -h [HOST] -U [USER] -d [DATABASE] -c "
SELECT 'users' as table_name, COUNT(*) as post_count FROM users
UNION ALL
SELECT 'profiles', COUNT(*) FROM profiles
UNION ALL
SELECT 'orders', COUNT(*) FROM orders
UNION ALL
SELECT 'order_items', COUNT(*) FROM order_items
UNION ALL
SELECT 'payments', COUNT(*) FROM payments
ORDER BY table_name;
"
```

**Result:** [PASS/FAIL]  
**Notes:** ____________________

---

### Phase 4: Schema Verification

#### Step 4.1: Verify Old Columns Removed
```bash
psql -h [HOST] -U [USER] -d [DATABASE] -c "
SELECT table_name, column_name 
FROM information_schema.columns 
WHERE table_name IN ('orders', 'order_items', 'payments', 'cart', 'reviews')
AND column_name IN ('customer_id', 'email', 'total_amount', 'unit_price', 'total_price', 'payment_method', 'payment_intent_id', 'product_name', 'product_sku')
ORDER BY table_name, column_name;
"
```

**Expected:** No results (all old columns removed)  
**Result:** [PASS/FAIL]  
**Notes:** ____________________

#### Step 4.2: Verify New Columns Exist
```bash
psql -h [HOST] -U [USER] -d [DATABASE] -c "
SELECT table_name, column_name 
FROM information_schema.columns 
WHERE table_name IN ('orders', 'order_items', 'payments', 'cart', 'reviews')
AND column_name IN ('user_id', 'guest_email', 'total', 'price', 'provider', 'provider_id')
ORDER BY table_name, column_name;
"
```

**Expected:** All new columns present  
**Result:** [PASS/FAIL]  
**Notes:** ____________________

#### Step 4.3: Verify Foreign Keys Created
```bash
psql -h [HOST] -U [USER] -d [DATABASE] -c "
SELECT 
    tc.table_name,
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name IN ('orders', 'cart', 'reviews', 'inventory_logs')
ORDER BY tc.table_name, tc.constraint_name;
"
```

**Expected:** FKs reference profiles table  
**Result:** [PASS/FAIL]  
**Notes:** ____________________

---

### Phase 5: Application Testing

#### Step 5.1: Test User Login
1. Navigate to staging application: `____________________`
2. Attempt login with test user: `customer1@example.com`
3. Verify login successful

**Result:** [PASS/FAIL]  
**Notes:** ____________________

#### Step 5.2: Test Order Creation
1. Login as test user
2. Add product to cart
3. Proceed to checkout
4. Create test order
5. Verify order created successfully

**Result:** [PASS/FAIL]  
**Order ID:** ____________________  
**Notes:** ____________________

#### Step 5.3: Test Cart Functionality
1. Add multiple items to cart
2. Update quantities
3. Remove item
4. Verify cart updates correctly

**Result:** [PASS/FAIL]  
**Notes:** ____________________

#### Step 5.4: Test Product Browsing
1. Browse product catalog
2. Filter by category
3. Search for product
4. Verify all functions work

**Result:** [PASS/FAIL]  
**Notes:** ____________________

#### Step 5.5: Test Admin Panel
1. Login as admin user: `admin1@example.com`
2. Access admin dashboard
3. View orders
4. View users
5. Verify admin functions work

**Result:** [PASS/FAIL]  
**Notes:** ____________________

---

### Phase 6: Refund Reconciliation (if applicable)

#### Step 6.1: Check Refund Order Mapping
```bash
psql -h [HOST] -U [USER] -d [DATABASE] -c "
SELECT COUNT(*) as total,
       SUM(CASE WHEN mapping_status = 'manual_reconciliation_required' THEN 1 ELSE 0 END) as requiring_reconciliation
FROM refund_order_mapping;
"
```

**Records requiring reconciliation:** [NUMBER]  
**Result:** [PASS/FAIL/N/A]  
**Notes:** ____________________

#### Step 6.2: Perform Manual Reconciliation (if needed)
```bash
# View records requiring reconciliation
psql -h [HOST] -U [USER] -d [DATABASE] -c "
SELECT * FROM refund_order_mapping 
WHERE mapping_status = 'manual_reconciliation_required'
ORDER BY created_at;
"
```

**Reconciliation performed:** [YES/NO/N/A]  
**Notes:** ____________________

---

### Phase 7: Rollback Test (Optional but Recommended)

#### Step 7.1: Test Rollback from Backup Tables
```bash
# Test orders table rollback
psql -h [HOST] -U [USER] -d [DATABASE] -c "
BEGIN;
TRUNCATE orders;
INSERT INTO orders SELECT * FROM orders_backup_004;
ROLLBACK;
"
```

**Result:** [PASS/FAIL]  
**Notes:** ____________________

#### Step 7.2: Re-run Migration After Rollback Test
```bash
psql -h [HOST] -U [USER] -d [DATABASE] -f ../004_migrate_existing_data.sql > rollback_test_migration.log 2>&1
```

**Result:** [PASS/FAIL]  
**Notes:** ____________________

---

## Test Results Summary

### Test Case Results
| Test Case | Status | Notes |
|-----------|--------|-------|
| 1.1 Database Connection | [PASS/FAIL] | [NOTES] |
| 1.2 Canonical Schema | [PASS/FAIL] | [NOTES] |
| 1.3 Test Data Prep | [PASS/FAIL] | [NOTES] |
| 1.4 Test Data Verify | [PASS/FAIL] | [NOTES] |
| 1.5 Pre-Migration Backup | [PASS/FAIL] | [NOTES] |
| 2.1 Migration Execution | [PASS/FAIL] | [NOTES] |
| 2.2 Migration Log Review | [PASS/FAIL] | [NOTES] |
| 2.3 Migration Validation | [PASS/FAIL] | [NOTES] |
| 3.1 Validation Script | [PASS/FAIL] | [NOTES] |
| 3.2 Validation Results | [PASS/FAIL] | [NOTES] |
| 3.3 Orphaned Records | [PASS/FAIL] | [NOTES] |
| 3.4 Backup Tables | [PASS/FAIL] | [NOTES] |
| 3.5 Count Comparison | [PASS/FAIL] | [NOTES] |
| 4.1 Old Columns Removed | [PASS/FAIL] | [NOTES] |
| 4.2 New Columns Exist | [PASS/FAIL] | [NOTES] |
| 4.3 Foreign Keys Created | [PASS/FAIL] | [NOTES] |
| 5.1 User Login | [PASS/FAIL] | [NOTES] |
| 5.2 Order Creation | [PASS/FAIL] | [NOTES] |
| 5.3 Cart Functionality | [PASS/FAIL] | [NOTES] |
| 5.4 Product Browsing | [PASS/FAIL] | [NOTES] |
| 5.5 Admin Panel | [PASS/FAIL] | [NOTES] |
| 6.1 Refund Mapping | [PASS/FAIL/N/A] | [NOTES] |
| 6.2 Reconciliation | [PASS/FAIL/N/A] | [NOTES] |
| 7.1 Rollback Test | [PASS/FAIL] | [NOTES] |
| 7.2 Re-migration | [PASS/FAIL] | [NOTES] |

### Overall Statistics
- **Total Tests:** [NUMBER]
- **Passed:** [NUMBER]
- **Failed:** [NUMBER]
- **Warnings:** [NUMBER]
- **Overall Status:** [PASS/FAIL/CONDITIONAL PASS]

---

## Issues Encountered

### Critical Issues
1. [ISSUE DESCRIPTION]
   - **Impact:** [HIGH/MEDIUM/LOW]
   - **Resolution:** [RESOLUTION]
   - **Status:** [RESOLVED/UNRESOLVED]

### High Priority Issues
1. [ISSUE DESCRIPTION]
   - **Impact:** [HIGH/MEDIUM/LOW]
   - **Resolution:** [RESOLUTION]
   - **Status:** [RESOLVED/UNRESOLVED]

### Medium Priority Issues
1. [ISSUE DESCRIPTION]
   - **Impact:** [HIGH/MEDIUM/LOW]
   - **Resolution:** [RESOLUTION]
   - **Status:** [RESOLVED/UNRESOLVED]

---

## Recommendations

### For Production Deployment
- [ ] All critical issues must be resolved before production
- [ ] All high priority issues should be resolved or have mitigation plan
- [ ] Document any manual reconciliation steps required
- [ ] Schedule maintenance window for production deployment
- [ ] Ensure production backup is created before deployment

### For Follow-up
- [ ] [RECOMMENDATION 1]
- [ ] [RECOMMENDATION 2]
- [ ] [RECOMMENDATION 3]

---

## Log Files Location

- `test_data_preparation.log` - Test data preparation output
- `migration_execution.log` - Migration execution output
- `validation_execution.log` - Validation script output
- `rollback_test_migration.log` - Rollback test migration output

---

## Sign-Off

### Test Execution
- **Tested By:** ____________________
- **Date:** ____________________
- **Time:** ____________________
- **Signature:** ____________________

### Test Review
- **Reviewed By:** ____________________
- **Date:** ____________________
- **Signature:** ____________________

### Production Approval
- **Approved By:** ____________________
- **Date:** ____________________
- **Signature:** ____________________

---

## Next Steps

- [ ] Address any failed test cases
- [ ] Resolve critical issues
- [ ] Update deployment checklist with any findings
- [ ] Schedule production deployment
- [ ] Prepare production deployment runbook

---

**Test Execution Guide Version:** 1.0  
**Last Updated:** 2025-06-07
