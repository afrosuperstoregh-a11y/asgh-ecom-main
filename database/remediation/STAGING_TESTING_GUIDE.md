# Staging Testing Guide
**AfroSuperStore Database Remediation**
**Date:** June 2, 2026

---

## Overview

This guide provides comprehensive testing procedures for validating the database remediation on a staging environment before production deployment.

---

## Pre-Testing Checklist

### Environment Setup

- [ ] Staging database is a fresh copy of production
- [ ] Staging application is deployed and accessible
- [ ] Environment variables configured:
  ```bash
  ADMIN_EMAIL=admin@staging.afrosuperstore.ca
  ADMIN_PASSWORD=StagingTest123!
  ADMIN_FIRST_NAME=Staging
  ADMIN_LAST_NAME=Admin
  ```
- [ ] Database backup created before testing
- [ ] Rollback procedure documented and tested
- [ ] Team notified of testing window

### Application Preparation

- [ ] Application code updated for breaking changes (see Application Code Update Guide)
- [ ] API documentation updated
- [ ] Frontend code updated for new field names
- [ ] Monitoring dashboards configured
- [ ] Error tracking enabled

---

## Testing Procedure

### Phase 1: Pre-Migration Validation

**Objective:** Validate staging environment state before migration

```sql
-- Run pre-migration validation
SELECT * FROM validate_all();

-- Check record counts
SELECT 'profiles' as table_name, COUNT(*) as count FROM profiles
UNION ALL
SELECT 'orders', COUNT(*) FROM orders
UNION ALL
SELECT 'products', COUNT(*) FROM products
UNION ALL
SELECT 'categories', COUNT(*) FROM categories;

-- Check for existing issues
SELECT * FROM validation_results 
WHERE severity IN ('CRITICAL', 'HIGH')
ORDER BY severity DESC;
```

**Expected Results:**
- All validations should pass or have only known issues
- Record counts should match production
- No critical or high severity issues

---

### Phase 2: Migration Execution

**Objective:** Execute full migration sequence and validate each step

#### Step 1: Security Fix (001)

```bash
psql -f migrations/001_fix_rls_uuid_vulnerability.sql
```

**Validation:**
```sql
-- Check RLS policies
SELECT * FROM validate_security();

-- Verify no UUID comparison bugs
SELECT COUNT(*) FROM pg_policies 
WHERE schemaname = 'public' 
AND (qual LIKE '%::text%'::text OR with_check LIKE '%::text%'::text);
-- Expected: 0
```

#### Step 2: Canonical Schema (002)

```bash
psql -f migrations/002_create_canonical_schema.sql
```

**Validation:**
```sql
-- Verify all tables created
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Verify indexes created
SELECT tablename, indexname FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Verify functions created
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public'
ORDER BY routine_name;
```

#### Step 3: RLS Policies (003)

```bash
psql -f migrations/003_apply_canonical_rls_policies.sql
```

**Validation:**
```sql
-- Verify RLS enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'orders', 'payments', 'customer_profiles');

-- Verify policies created
SELECT tablename, policyname FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

#### Step 4: Data Migration (004)

```bash
psql -f migrations/004_migrate_existing_data.sql
```

**Validation:**
```sql
-- Verify data migrated
SELECT COUNT(*) as profiles_count FROM profiles;
SELECT COUNT(*) as orders_count FROM orders;
SELECT COUNT(*) as products_count FROM products;

-- Verify no orphaned records
SELECT * FROM validate_schema_integrity();

-- Verify column renames
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'orders'
ORDER BY ordinal_position;
-- Should have: user_id, guest_email, total (NOT customer_id, email, total_amount)
```

#### Step 5: Cleanup (005)

```bash
psql -f migrations/005_remove_obsolete_tables.sql
```

**Validation:**
```sql
-- Verify obsolete tables removed
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('users', 'users_backup', 'migrations');
-- Expected: 0 rows

-- Verify obsolete columns removed
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'profiles'
AND column_name IN ('password_hash', 'reset_token', 'auth_user_id');
-- Expected: 0 rows
```

#### Step 6: Admin User (006)

```bash
psql -f migrations/006_create_admin_user.sql
```

**Validation:**
```sql
-- Verify admin setup
SELECT * FROM validate_admin_setup();

-- Check admin user exists
SELECT p.id, p.first_name, p.last_name, p.role, au.permissions
FROM profiles p
JOIN admin_users au ON p.id = au.user_id
JOIN auth.users u ON p.user_id = u.id
WHERE u.email = current_setting('admin.email', true);
```

#### Step 7: Final Validation (007)

```bash
psql -f migrations/007_validate_schema_integrity.sql
```

**Validation:**
```sql
-- Run all validations
SELECT * FROM validate_all();

-- Review validation results
SELECT * FROM validation_results 
ORDER BY severity DESC, validated_at DESC;
-- Expected: All PASSED, no CRITICAL or HIGH issues
```

---

### Phase 3: Application Testing

**Objective:** Test all application functionality with new schema

#### Authentication Tests

- [ ] User registration works
- [ ] User login works
- [ ] Password reset works (via Supabase)
- [ ] Email verification works
- [ ] Admin login works
- [ ] Session management works

#### E-commerce Tests

- [ ] Product browsing works
- [ ] Product search works
- [ ] Category filtering works
- [ ] Product details page works
- [ ] Add to cart works
- [ ] Update cart quantity works
- [ ] Remove from cart works
- [ ] Guest checkout works
- [ ] Authenticated checkout works
- [ ] Order placement works
- [ ] Order history works
- [ ] Order details work

#### Admin Panel Tests

- [ ] Admin login works
- [ ] Dashboard loads
- [ ] Product management works
- [ ] Order management works
- [ ] User management works
- [ ] Category management works
- [ ] Reports work

#### CRM Tests

- [ ] Customer profiles load
- [ ] Customer notes work
- [ ] Customer tags work
- [ ] Customer segments work
- [ ] Email templates work
- [ ] Email campaigns work

#### API Tests

```bash
# Test API endpoints
curl -X GET https://staging.afrosuperstore.ca/api/products
curl -X GET https://staging.afrosuperstore.ca/api/categories
curl -X GET https://staging.afrosuperstore.ca/api/orders
curl -X POST https://staging.afrosuperstore.ca/api/cart
```

**Expected Results:**
- All endpoints return 200 OK
- No 500 errors
- Data structure matches new schema
- Field names updated (user_id, total, etc.)

---

### Phase 4: Performance Testing

**Objective:** Validate performance improvements

#### Query Performance

```sql
-- Test common queries with EXPLAIN ANALYZE
EXPLAIN ANALYZE SELECT * FROM orders WHERE user_id = 'test-uuid' ORDER BY created_at DESC LIMIT 10;
EXPLAIN ANALYZE SELECT * FROM products WHERE category_id = 'test-uuid' AND status = 'active';
EXPLAIN ANALYZE SELECT * FROM cart WHERE user_id = 'test-uuid';
```

**Expected Results:**
- Queries use indexes (no sequential scans)
- Query times < 100ms for common operations
- Composite indexes utilized

#### Load Testing

```bash
# Use k6 or similar tool
k6 run load-test.js
```

**Expected Results:**
- No performance degradation
- Response times within acceptable range
- No database connection pool exhaustion

---

### Phase 5: Data Integrity Testing

**Objective:** Validate data integrity after migration

#### Record Count Validation

```sql
-- Compare with pre-migration counts (documented in Phase 1)
SELECT 'profiles' as table_name, COUNT(*) as count FROM profiles
UNION ALL
SELECT 'orders', COUNT(*) FROM orders
UNION ALL
SELECT 'order_items', COUNT(*) FROM order_items
UNION ALL
SELECT 'products', COUNT(*) FROM products
UNION ALL
SELECT 'categories', COUNT(*) FROM categories
UNION ALL
SELECT 'cart', COUNT(*) FROM cart
UNION ALL
SELECT 'reviews', COUNT(*) FROM reviews;
```

**Expected Results:**
- Counts match or are higher (new data added)
- No data loss

#### Foreign Key Validation

```sql
-- Check for orphaned records
SELECT 'orders without user' as issue, COUNT(*) 
FROM orders o LEFT JOIN profiles p ON o.user_id = p.id WHERE p.id IS NULL
UNION ALL
SELECT 'order_items without order', COUNT(*) 
FROM order_items oi LEFT JOIN orders o ON oi.order_id = o.id WHERE o.id IS NULL
UNION ALL
SELECT 'cart without user', COUNT(*) 
FROM cart c LEFT JOIN profiles p ON c.user_id = p.id WHERE p.id IS NULL;
```

**Expected Results:**
- 0 orphaned records
- All foreign keys valid

#### Constraint Validation

```sql
-- Test CHECK constraints
SELECT COUNT(*) FROM products WHERE price < 0; -- Expected: 0
SELECT COUNT(*) FROM order_items WHERE quantity <= 0; -- Expected: 0
SELECT COUNT(*) FROM reviews WHERE rating < 1 OR rating > 5; -- Expected: 0

-- Test UNIQUE constraints
SELECT slug, COUNT(*) FROM products GROUP BY slug HAVING COUNT(*) > 1; -- Expected: 0 rows
SELECT sku, COUNT(*) FROM products GROUP BY sku HAVING COUNT(*) > 1; -- Expected: 0 rows
```

**Expected Results:**
- All constraints enforced
- No constraint violations

---

### Phase 6: Security Testing

**Objective:** Validate security improvements

#### RLS Policy Testing

```sql
-- Test as regular user
SET ROLE authenticated;
SELECT * FROM orders WHERE user_id = auth.uid(); -- Should return own orders
SELECT * FROM orders; -- Should only return own orders

-- Test as anon
SET ROLE anon;
SELECT * FROM products WHERE status = 'active'; -- Should return active products
SELECT * FROM orders; -- Should return empty (no access)
```

**Expected Results:**
- Users can only access their own data
- Anonymous users can only access public data
- No data leakage

#### Admin Function Testing

```sql
-- Test admin check function
SELECT is_admin('admin-uuid'); -- Should return true for admin
SELECT is_admin('regular-user-uuid'); -- Should return false for regular user
```

**Expected Results:**
- Admin check works correctly
- No privilege escalation

---

### Phase 7: Rollback Testing

**Objective:** Validate rollback procedure

**Procedure:**

1. Stop application
2. Restore database from backup
3. Verify data integrity
4. Restart application
5. Test basic functionality

**Validation:**
```sql
-- Verify restored state
SELECT * FROM validate_all();

-- Verify old schema exists
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public'
AND tablename = 'users';
```

**Expected Results:**
- Rollback completes successfully
- Database restored to pre-migration state
- Application works with old schema

---

## Test Results Documentation

### Test Summary Template

| Test Phase | Status | Issues Found | Resolution |
|------------|--------|--------------|------------|
| Pre-Migration Validation | ⬜ PASS / ❌ FAIL | | |
| Migration Execution | ⬜ PASS / ❌ FAIL | | |
| Application Testing | ⬜ PASS / ❌ FAIL | | |
| Performance Testing | ⬜ PASS / ❌ FAIL | | |
| Data Integrity Testing | ⬜ PASS / ❌ FAIL | | |
| Security Testing | ⬜ PASS / ❌ FAIL | | |
| Rollback Testing | ⬜ PASS / ❌ FAIL | | |

### Issue Tracking

Document any issues found during testing:

| Issue ID | Description | Severity | Status | Resolution |
|----------|-------------|----------|--------|------------|
| | | | | |

---

## Go/No-Go Criteria

### Go Criteria (All Must Be Met)

- ✅ All migration steps complete successfully
- ✅ All validation tests pass
- ✅ Application functionality verified
- ✅ Performance meets or exceeds baseline
- ✅ Data integrity validated (no data loss)
- ✅ Security tests pass
- ✅ Rollback procedure validated
- ✅ Zero critical issues
- ✅ Zero high priority issues

### No-Go Criteria (Any One Triggers Stop)

- ❌ Migration fails at any step
- ❌ Validation fails with critical issues
- ❌ Application functionality broken
- ❌ Performance degradation > 50%
- ❌ Data loss detected
- ❌ Security vulnerability found
- ❌ Rollback fails
- ❌ Critical or high priority issues remain

---

## Sign-Off

### Testing Team

- **Tester:** _________________________
- **Date:** _________________________
- **Result:** ⬜ GO / ❌ NO-GO
- **Comments:** _________________________

### Engineering Lead

- **Name:** _________________________
- **Date:** _________________________
- **Approval:** ⬜ APPROVED / ❌ REJECTED
- **Comments:** _________________________

### Product Owner

- **Name:** _________________________
- **Date:** _________________________
- **Approval:** ⬜ APPROVED / ❌ REJECTED
- **Comments:** _________________________

---

## Next Steps After Go Decision

### If GO:

1. Schedule production migration window
2. Notify stakeholders
3. Prepare production environment
4. Execute production migration
5. Monitor production metrics
6. Validate production functionality

### If NO-GO:

1. Document issues
2. Create remediation plan
3. Fix issues
4. Re-run staging tests
5. Re-evaluate go/no-go criteria

---

**Last Updated:** June 2, 2026
