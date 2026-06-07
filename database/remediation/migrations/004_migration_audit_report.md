# Migration Audit Report: 004_migrate_existing_data.sql

**Migration File:** `004_migrate_existing_data.sql`  
**Audit Date:** 2025-06-07  
**Severity:** CRITICAL - Production Deployment Blocked  
**Status:** REMEDIATION REQUIRED

---

## Executive Summary

The current migration file contains **15 critical issues** that prevent safe production deployment. These issues include data loss scenarios, broken authentication relationships, non-idempotent operations, and missing validation checkpoints. The migration **MUST NOT** be deployed to production without remediation.

**Risk Level:** CRITICAL  
**Data Loss Risk:** HIGH  
**Deployment Risk:** HIGH  
**Rollback Risk:** HIGH

---

## Critical Issues

### CRITICAL ISSUE 1: Profiles/User Mapping Is Incorrect

**Location:** Lines 88-102  
**Severity:** CRITICAL  
**Data Loss Risk:** HIGH

**Problem:**
```sql
COALESCE(u.auth_user_id, u.id)
```

The migration assumes `users.id == auth.users.id`, which is often false. This can create:
- Orphaned profiles
- Invalid foreign keys
- Duplicate users
- Broken authentication

**Impact:**
- Users may lose access to their accounts
- Authentication system may fail
- Data integrity violations
- Application crashes

**Remediation Required:**
1. Inspect actual schema before migration
2. Verify column types:
   - `users.id` type
   - `users.auth_user_id` type
   - `profiles.user_id` type
   - `auth.users.id` type
3. Create mapping validation:
   ```sql
   SELECT COUNT(*)
   FROM users u
   LEFT JOIN auth.users au
   ON au.id = u.auth_user_id
   WHERE au.id IS NULL;
   ```
4. Abort migration if invalid mappings exist
5. Do not migrate users that cannot be mapped safely
6. Generate reconciliation report

---

### CRITICAL ISSUE 2: Foreign Keys May Fail During Column Migration

**Location:** Lines 165-166, 195, 214, 270, 289, 334, 353, 379, 418  
**Severity:** CRITICAL  
**Data Loss Risk:** HIGH

**Problem:**
```sql
ALTER TABLE orders DROP COLUMN customer_id;
```
Executed before validating all references.

**Impact:**
- Foreign key constraint violations
- Data loss if migration fails midway
- Broken referential integrity
- Application errors

**Remediation Required:**
Migration order must be:
1. Create new column
2. Populate new column
3. Validate data
4. Create indexes
5. Create foreign key
6. Validate foreign key
7. Remove old column

Never drop old columns before validation succeeds.

---

### CRITICAL ISSUE 3: Existing Constraints Not Fully Checked

**Location:** Lines 169-177, 382-391, 420-430  
**Severity:** HIGH  
**Deployment Risk:** HIGH

**Problem:**
Current migration only checks:
```sql
orders_user_id_fkey
```

Constraint names vary across environments.

**Impact:**
- Migration fails on different environments
- Duplicate constraints
- Constraint conflicts
- Deployment failures

**Remediation Required:**
1. Discover constraints dynamically using:
   ```sql
   information_schema.table_constraints
   ```
   or
   ```sql
   pg_constraint
   ```
2. Remove constraints by actual dependency analysis
3. Do not use hardcoded constraint names
4. Generate constraint migration report

---

### CRITICAL ISSUE 4: Data Loss During Column Renames

**Location:** Throughout migration  
**Severity:** CRITICAL  
**Data Loss Risk:** HIGH

**Problem:**
Current pattern:
```sql
ADD COLUMN
COPY DATA
DROP COLUMN
```

If migration fails midway, data can be lost.

**Impact:**
- Permanent data loss
- No recovery without backup
- Production data corruption

**Remediation Required:**
Use safe migration pattern:
```sql
ADD COLUMN
COPY DATA
VERIFY COUNTS
VERIFY NULLS
BACKUP VALUES
ONLY THEN DROP
```

Create validation checks:
```sql
old_count = new_count
```

Abort if mismatch.

---

### CRITICAL ISSUE 5: refund_requests Migration Causes Data Loss

**Location:** Lines 468-492  
**Severity:** CRITICAL  
**Data Loss Risk:** CRITICAL

**Problem:**
```sql
UPDATE refund_requests
SET order_id_uuid = NULL;
```

This destroys relationships.

**Impact:**
- All refund request order references lost
- Financial data corruption
- Customer service impact
- Audit trail broken

**Remediation Required:**
Never overwrite order references. Implement:

**Phase A:** Create mapping table
```sql
CREATE TABLE refund_order_mapping (
    refund_request_id UUID,
    old_order_id INTEGER,
    new_order_id UUID,
    mapping_status TEXT
);
```

**Phase B:** Attempt automatic mapping
```sql
refund_requests.order_id
→ legacy orders.id
→ new orders.id
```

**Phase C:** Store unresolved mappings
- Generate reconciliation report
- Do not set references to NULL

---

### CRITICAL ISSUE 6: admin_users Migration Uses Wrong IDs

**Location:** Lines 115-128  
**Severity:** HIGH  
**Data Loss Risk:** MEDIUM

**Problem:**
```sql
INSERT INTO admin_users (
    user_id
)
SELECT p.id
```

Need verification. Determine whether `admin_users.user_id` references:
- `profiles.id`
- `auth.users.id`
- `users.id`

**Impact:**
- Broken admin access
- Security vulnerabilities
- Application errors

**Remediation Required:**
1. Verify actual relationship type
2. Fix migration accordingly
3. Do not assume relationship types

---

### CRITICAL ISSUE 7: Non-Idempotent Foreign Key Creation

**Location:** Lines 174-176, 390-391, 429-430, 456-457, 487-488  
**Severity:** HIGH  
**Deployment Risk:** HIGH

**Problem:**
```sql
ALTER TABLE cart
ADD CONSTRAINT cart_user_id_fkey
```

Second execution can fail.

**Impact:**
- Migration cannot be rerun
- Deployment failures
- Manual intervention required

**Remediation Required:**
Create helper function:
```sql
CREATE OR REPLACE FUNCTION create_constraint_if_not_exists()
```

or dynamic existence checks.

Every `ADD CONSTRAINT`, `ADD INDEX`, `ADD COLUMN` must be idempotent.

---

### CRITICAL ISSUE 8: Missing Transaction Safety

**Location:** Lines 9-602  
**Severity:** HIGH  
**Deployment Risk:** HIGH

**Problem:**
Migration uses large updates within a single transaction. Can lock production tables.

**Impact:**
- Production downtime
- Timeout errors
- Application unavailability

**Remediation Required:**
Break migration into phases:

**Phase 1:** Schema preparation  
**Phase 2:** Data migration  
**Phase 3:** Validation  
**Phase 4:** Cleanup

Use smaller batches where appropriate. Evaluate lock duration. Recommend migration strategy for Supabase production environments.

---

### CRITICAL ISSUE 9: Missing Profile Duplicate Detection

**Location:** Lines 76-103  
**Severity:** HIGH  
**Data Loss Risk:** MEDIUM

**Problem:**
No duplicate detection before migration for:
- `profiles.user_id`
- `users.auth_user_id`
- `users.email`

**Impact:**
- Duplicate profiles
- Data conflicts
- Application errors

**Remediation Required:**
Before migration, detect duplicates. Report:
- Duplicates
- Conflicts
- Unmapped users

Abort if unsafe.

---

### CRITICAL ISSUE 10: Missing Orphan Validation

**Location:** Lines 551-590  
**Severity:** HIGH  
**Data Loss Risk:** MEDIUM

**Problem:**
Incomplete orphan validation. Missing checks for:
- Payments.order_id
- Order Items.order_id
- Inventory Logs.created_by
- Refund Requests.order_id

**Impact:**
- Orphaned records not detected
- Data integrity issues
- Application errors

**Remediation Required:**
Add validation for all foreign key relationships:
- Orders.user_id
- Cart.user_id
- Reviews.user_id
- Payments.order_id
- Order Items.order_id
- Inventory Logs.created_by
- Refund Requests.order_id

Generate detailed counts. Abort cleanup phase if orphaned records exist.

---

### CRITICAL ISSUE 11: Hardcoded Column Types

**Location:** Throughout migration  
**Severity:** MEDIUM  
**Deployment Risk:** MEDIUM

**Problem:**
Migration creates columns like:
```sql
UUID
DECIMAL(10,2)
TEXT
```

without checking actual schema.

**Impact:**
- Type mismatches
- Data truncation
- Migration failures

**Remediation Required:**
1. Inspect canonical schema first
2. Ensure new columns use exact target types
3. Do not hardcode assumptions

---

### CRITICAL ISSUE 12: Soft Delete Columns

**Location:** Lines 537-544  
**Severity:** MEDIUM  
**Deployment Risk:** LOW

**Problem:**
Code blindly adds:
```sql
deleted_at TIMESTAMPTZ
```

without verifying table existence. Some environments may not contain `customer_profiles`.

**Impact:**
- Migration errors
- Deployment failures

**Remediation Required:**
Verify table existence first. Use safe checks.

---

### CRITICAL ISSUE 13: Migration Log Dependency

**Location:** Lines 596-600  
**Severity:** MEDIUM  
**Deployment Risk:** LOW

**Problem:**
Code assumes `migration_log` exists.

**Impact:**
- Migration fails if table missing
- No migration tracking

**Remediation Required:**
1. Verify table existence
2. Create if missing
3. Or gracefully skip logging
4. Never fail migration because logging table is absent

---

### CRITICAL ISSUE 14: Missing Rollback Strategy

**Location:** Throughout migration  
**Severity:** HIGH  
**Data Loss Risk:** HIGH

**Problem:**
No rollback plan. Before destructive operations, no backup tables created.

**Impact:**
- No recovery path
- Permanent data loss
- Production risk

**Remediation Required:**
Before destructive operations, create backup tables:
```sql
users_backup_004
orders_backup_004
order_items_backup_004
payments_backup_004
refund_requests_backup_004
```

Store snapshots. Generate rollback SQL.

---

### CRITICAL ISSUE 15: Supabase Auth Compatibility

**Location:** Lines 88-102  
**Severity:** CRITICAL  
**Data Loss Risk:** HIGH

**Problem:**
No validation that `profiles.user_id` references `auth.users(id)`.

**Impact:**
- RLS policies become invalid
- Auth relationships break
- Profile records detach from auth users
- Authentication failures

**Remediation Required:**
Validate:
1. `profiles.user_id` references `auth.users(id)`
2. RLS policies remain valid
3. Auth relationships remain intact
4. No profile records become detached from auth users

Generate compatibility report.

---

## Additional Issues Found

### Issue 16: Missing Index Creation
**Severity:** MEDIUM**

Migration does not create indexes on new columns before adding foreign keys, which can cause performance issues and locking.

### Issue 17: No Data Count Validation
**Severity:** MEDIUM**

No verification that row counts match before and after column migrations.

### Issue 18: Missing NULL Constraint Validation
**Severity:** MEDIUM**

No validation that required columns are not NULL after migration.

### Issue 19: No Batch Processing
**Severity:** LOW**

Large updates are not batched, which can cause long-running transactions and timeouts.

### Issue 20: Missing Error Handling
**Severity:** MEDIUM**

DO blocks lack comprehensive error handling and rollback logic.

---

## Risk Assessment

### Data Loss Scenarios
1. **refund_requests.order_id** set to NULL - CRITICAL
2. Column drops before validation - HIGH
3. Incorrect user mapping - HIGH
4. Orphaned records not detected - MEDIUM

### Broken Authentication Scenarios
1. Invalid profiles.user_id mapping - CRITICAL
2. Broken auth.users relationships - CRITICAL
3. Duplicate user records - HIGH

### Deployment Failure Scenarios
1. Non-idempotent operations - HIGH
2. Hardcoded constraint names - HIGH
3. Missing table checks - MEDIUM
4. Transaction locks - MEDIUM

---

## Recommendations

### Immediate Actions (Required Before Deployment)
1. ✅ Implement proper user/auth mapping validation
2. ✅ Fix refund_requests migration to preserve data
3. ✅ Add idempotent constraint creation
4. ✅ Implement backup table creation
5. ✅ Add comprehensive orphan validation
6. ✅ Fix foreign key migration order

### High Priority Actions
1. ✅ Break migration into phases
2. ✅ Add data count validation
3. ✅ Implement batch processing
4. ✅ Add error handling
5. ✅ Create rollback SQL

### Medium Priority Actions
1. ✅ Remove hardcoded types
2. ✅ Add index creation
3. ✅ Verify table existence
4. ✅ Handle migration_log dependency

---

## Success Criteria

The remediated migration must:

- ✅ Run successfully on Supabase PostgreSQL
- ✅ Be safe to rerun (idempotent)
- ✅ Cause no data loss
- ✅ Not break auth.users relationships
- ✅ Not create orphaned records
- ✅ Validate all foreign keys
- ✅ Preserve all legacy data
- ✅ Be production deployment ready

---

## Next Steps

1. Review this audit report
2. Approve remediation plan
3. Generate corrected migration script
4. Create validation script
5. Test on staging environment
6. Perform dry-run on production
7. Schedule production deployment with maintenance window
8. Create database backup
9. Execute migration
10. Run validation
11. Verify application functionality

---

## Appendix

### Files Referenced
- `004_migrate_existing_data.sql` - Current migration (CRITICAL ISSUES)
- `002_create_canonical_schema.sql` - Target schema
- `007_validate_schema_integrity.sql` - Validation functions

### Schema Relationships
```
auth.users (id) ← profiles.user_id
profiles (id) ← orders.user_id
profiles (id) ← cart.user_id
profiles (id) ← reviews.user_id
profiles (id) ← inventory_logs.created_by
profiles (id) ← admin_users.user_id
orders (id) ← order_items.order_id
orders (id) ← payments.order_id
orders (id) ← refund_requests.order_id
```

### Migration Order
1. 001_fix_rls_uuid_vulnerability.sql
2. 002_create_canonical_schema.sql
3. 003_apply_canonical_rls_policies.sql
4. **004_migrate_existing_data.sql** ← CURRENT FILE (REQUIRES REMEDIATION)
5. 005_remove_obsolete_tables.sql
6. 006_create_admin_user.sql
7. 007_validate_schema_integrity.sql

---

**Report Generated:** 2025-06-07  
**Status:** REMEDIATION REQUIRED  
**Approved By:** [PENDING]  
**Remediation Status:** [PENDING]
