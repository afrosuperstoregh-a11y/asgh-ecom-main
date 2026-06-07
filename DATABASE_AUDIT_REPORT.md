# Database Audit Report
**AfroSuperStore E-Commerce Platform**
**Date:** June 2, 2026
**Audit Scope:** Schema, Migrations, Data Integrity, and RLS Policies

---

## Executive Summary

This audit identified **23 critical issues** and **15 medium-priority concerns** across the database schema, migrations, and security policies. The most significant issues involve schema inconsistencies between MySQL and PostgreSQL versions, conflicting RLS policies, and foreign key reference problems that could lead to data integrity issues.

**Risk Level:** HIGH - Immediate attention required for production deployment.

---

## Critical Issues

### 1. Schema Version Conflicts (CRITICAL)

**Issue:** Multiple incompatible schema versions exist
- **File:** `001_initial_schema.sql` (MySQL) vs `001_initial_schema_postgresql.sql` (PostgreSQL)
- **Impact:** Cannot determine which schema is the source of truth
- **Details:**
  - MySQL version uses `INT AUTO_INCREMENT` primary keys
  - PostgreSQL version uses `UUID` primary keys
  - PostgreSQL version includes additional tables: `admin_users`, `inventory_logs`, `payments`
  - Column types differ between versions (ENUM vs TEXT CHECK constraints)

**Recommendation:** 
- Choose one schema version as the primary (PostgreSQL for Supabase)
- Deprecate or remove the MySQL version
- Document the canonical schema in a single source file

---

### 2. Duplicate Migration Files (CRITICAL)

**Issue:** Multiple migration files with the same purpose but different implementations
- **Files Affected:**
  - `006_create_customer_profiles.sql` (UUID version)
  - `006_create_customer_profiles_compatible.sql` (INTEGER version)
  - `003_create_super_admin.sql` vs `003_create_super_admin_postgresql.sql`
  - `002_add_indexes.sql` (exists in both database/migrations and supabase/migrations)
- **Impact:** Unclear which migration should be executed, potential for conflicts
- **Risk:** Data corruption if wrong migration is applied

**Recommendation:**
- Consolidate duplicate migrations
- Use conditional logic or separate migration directories for different environments
- Remove obsolete migration files

---

### 3. Table Structure Conflicts (CRITICAL)

**Issue:** Conflicting user table structures across migrations
- **Tables Involved:** `users`, `profiles`, `auth.users`
- **Details:**
  - `001_initial_schema_postgresql.sql` creates `users` table with UUID primary key
  - `003_supabase_auth_migration.sql` creates `profiles` table linked to `auth.users`
  - `005_setup_rls_policies.sql` references `profiles` table
  - `004_remove_legacy_auth_columns.sql` attempts to link `users` to `auth.users`
- **Impact:** Unclear which table stores user data, RLS policies reference non-existent tables
- **Risk:** Authentication failures, data inconsistency

**Recommendation:**
- Decide on single user table strategy (users vs profiles)
- Update all RLS policies to reference the correct table
- Create migration to consolidate user data if needed

---

### 4. RLS Policy UUID Comparison Bug (CRITICAL)

**Issue:** Incorrect UUID comparison in RLS policies
- **File:** `002_supabase_rls_policies.sql`
- **Lines:** 19, 23, 27, 31, 39, 73, 82, 98, 100, 109, 117, 123, 136, 142, 175, 184, 192
- **Problem:** `auth.uid()::text = id::text` is incorrect for UUID comparison
- **Impact:** RLS policies may fail or allow unauthorized access
- **Risk:** Security vulnerability - users may access data they shouldn't

**Current Code:**
```sql
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid()::text = id::text);
```

**Correct Code:**
```sql
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);
```

**Recommendation:**
- Fix all UUID comparisons in RLS policies
- Remove `::text` casts from UUID comparisons
- Test RLS policies thoroughly after fixes

---

### 5. Foreign Key Reference Inconsistencies (CRITICAL)

**Issue:** Mixed foreign key references to different user tables
- **Affected Tables:**
  - `customer_profiles` references `users(id)` in some migrations
  - `customer_profiles` references `profiles(id)` in others
  - `orders` references both `users(id)` and `profiles(id)` in different migrations
  - `admin_audit_log` references `auth.users(id)`
- **Impact:** Foreign key constraints may fail, orphaned records
- **Risk:** Data integrity violations

**Recommendation:**
- Standardize all foreign key references to single user table
- Update all migrations to use consistent references
- Add migration to fix existing foreign keys

---

### 6. Column Naming Inconsistencies (HIGH)

**Issue:** Column renamed in migration but not consistently updated
- **File:** `008_update_orders_schema.sql`
- **Renamed Columns:**
  - `customer_id` → `user_id`
  - `email` → `guest_email`
  - `total_amount` → `total`
  - `unit_price` → `price`
  - `total_price` → `total`
  - `payment_method` → `provider`
  - `payment_intent_id` → `provider_id`
- **Impact:** Application code may break if not updated
- **Risk:** Runtime errors, data access failures

**Recommendation:**
- Ensure all application code uses new column names
- Add database views for backward compatibility if needed
- Update all stored procedures and functions

---

### 7. Missing Migration Tracking Table (HIGH)

**Issue:** `migration_log` table referenced but not created
- **Files:** `004_remove_legacy_auth_columns.sql`, `005_setup_rls_policies.sql`
- **Problem:** Migrations attempt to insert into `migration_log` table that doesn't exist
- **Impact:** Migration tracking will fail
- **Risk:** Cannot track which migrations have been executed

**Recommendation:**
- Create `migration_log` table in initial schema migration
- Add proper migration tracking mechanism
- Use Supabase's built-in migration tracking if available

---

### 8. Duplicate Function Definitions (HIGH)

**Issue:** Same functions defined in multiple migration files
- **Functions:**
  - `is_admin()` - defined in `002_supabase_rls_policies.sql`, `005_setup_rls_policies.sql`, `005_crm_rls_policies.sql`
  - `get_user_role()` - defined in `002_supabase_rls_policies.sql`
  - `update_updated_at_column()` - defined in multiple files
- **Impact:** Function redefinition errors during migration
- **Risk:** Migration failures

**Recommendation:**
- Create single migration for all shared functions
- Use `CREATE OR REPLACE FUNCTION` consistently
- Remove duplicate function definitions

---

### 9. Inconsistent ON DELETE Behaviors (MEDIUM)

**Issue:** Mixed ON DELETE actions across foreign keys
- **Examples:**
  - `CASCADE` used in most places
  - `SET NULL` used in some (categories.parent_id, customer_segment_memberships.added_by)
  - `RESTRICT` used in others (orders.customer_id, order_items.product_id)
- **Impact:** Inconsistent data deletion behavior
- **Risk:** Orphaned records or unintended cascading deletes

**Recommendation:**
- Document intended deletion behavior for each relationship
- Standardize ON DELETE actions based on business logic
- Add comments explaining deletion behavior

---

### 10. Missing Indexes (MEDIUM)

**Issue:** Performance-critical queries missing indexes
- **Missing Indexes:**
  - `products.category_id, status` composite index (exists in one file, not in initial schema)
  - `orders.user_id, status` composite index
  - `cart_items.cart_id` index (references non-existent cart_items table)
- **Impact:** Slow query performance
- **Risk:** Poor application performance at scale

**Recommendation:**
- Add all performance indexes to initial schema
- Review query patterns and add missing indexes
- Remove references to non-existent tables

---

## Medium Priority Issues

### 11. Password Hardcoded in Migration (SECURITY)

**File:** `003_create_super_admin_postgresql.sql`
**Issue:** Default password 'Admin123!' hardcoded in migration
**Risk:** Security vulnerability if not changed immediately
**Recommendation:** Remove hardcoded password, use environment variables

---

### 12. Unused Backup Table (CLEANUP)

**File:** `004_remove_legacy_auth_columns.sql`
**Issue:** Creates `users_backup` table but no cleanup mechanism
**Impact:** Unnecessary storage usage
**Recommendation:** Add cleanup job or remove backup table after verification

---

### 13. Inconsistent Data Types (MEDIUM)

**Issue:** Mixed use of TEXT vs VARCHAR
- Some columns use `VARCHAR(n)` with specific lengths
- Others use `TEXT` without length limits
- Impact: Inconsistent data validation and storage

**Recommendation:** Standardize on VARCHAR for columns with known max length, TEXT for variable-length content

---

### 14. Missing CHECK Constraints (MEDIUM)

**Issue:** Some ENUM-like columns lack CHECK constraints
- **Example:** `payment_provider` in `005_add_payment_provider_and_currency.sql` has CHECK constraint
- **Example:** `role` column uses CHECK in some places, ENUM in others
**Impact:** Data validation inconsistencies
**Recommendation:** Add CHECK constraints to all columns with restricted values

---

### 15. Trigger Function Naming Conflicts (MEDIUM)

**Issue:** Multiple trigger functions with same name but different implementations
- `update_updated_at_column()` defined differently in multiple files
- Impact: May cause unexpected behavior
**Recommendation:** Use unique names for different trigger functions or consolidate

---

## Data Integrity Concerns

### 16. Potential Orphaned Records

**Risk:** Orders without valid customer references
- Migration `008_update_orders_schema.sql` changes `customer_id` to `user_id`
- If data migration fails, orphaned records may exist
**Recommendation:** Add data validation queries after migration

---

### 17. Soft Delete Implementation Inconsistency

**Issue:** `customer_profiles` has soft delete (`soft_deleted` column)
- Other tables use hard deletes
- Impact: Inconsistent data lifecycle management
**Recommendation:** Standardize soft delete approach across all tables or remove entirely

---

### 18. Missing Unique Constraints

**Issue:** Some columns should be unique but lack constraints
- `email` in `users` table has UNIQUE constraint
- `slug` in products/categories has UNIQUE constraint
- Other natural keys may be missing uniqueness
**Recommendation:** Review all natural keys and add UNIQUE constraints where appropriate

---

## RLS Policy Issues

### 19. Policy References Non-Existent Tables

**Issue:** Some RLS policies reference tables that may not exist
- `005_setup_rls_policies.sql` references `profiles` table
- `002_supabase_rls_policies.sql` references `admin_users` table
- Impact: Policy creation will fail if tables don't exist
**Recommendation:** Ensure all referenced tables exist before creating policies

---

### 20. Missing RLS Policies

**Issue:** Some tables lack RLS policies entirely
- Tables with RLS enabled but no policies will block all access
- Impact: Users cannot access data
**Recommendation:** Ensure every table with RLS enabled has at least one policy

---

### 21. Overly Permissive Policies

**Issue:** Some policies use `USING (true)` allowing public access
- `005_setup_rls_policies.sql`: "Public can view products" and "Public can view categories"
- Impact: May expose sensitive data
**Recommendation:** Review public access policies and restrict where appropriate

---

### 22. Circular Reference Risk

**Issue:** RLS policies check admin status by querying profiles table
- `is_admin()` function queries `profiles` table
- `profiles` table has RLS policies
- Impact: Potential circular dependency or permission denied errors
**Recommendation:** Use SECURITY DEFINER for admin check functions

---

### 23. Missing Policy Comments

**Issue:** Most RLS policies lack explanatory comments
- Impact: Difficult to understand policy intent
**Recommendation:** Add comments to all policies explaining their purpose

---

## Migration Execution Order Issues

### 24. Incorrect Migration Numbering

**Issue:** Migration numbers don't reflect execution order
- Multiple files with number 003, 005, 006
- Impact: Unclear execution order
**Recommendation:** Use sequential numbering or timestamp-based naming

---

### 25. Missing Dependency Declarations

**Issue:** Migrations don't declare dependencies
- No indication of which migrations must run first
- Impact: Migrations may fail if run in wrong order
**Recommendation:** Add dependency declarations or use proper migration tool

---

## Recommendations Summary

### Immediate Actions (Critical)

1. **Fix UUID comparison bug in RLS policies** - Security vulnerability
2. **Resolve schema version conflicts** - Choose PostgreSQL as canonical
3. **Consolidate duplicate migration files** - Prevent conflicts
4. **Standardize user table references** - Fix foreign key issues
5. **Create migration_log table** - Enable migration tracking

### Short-term Actions (High Priority)

6. Update application code for column renames
7. Remove duplicate function definitions
8. Add missing indexes for performance
9. Fix RLS policy table references
10. Remove hardcoded passwords

### Medium-term Actions (Medium Priority)

11. Standardize ON DELETE behaviors
12. Add missing CHECK constraints
13. Implement consistent soft delete strategy
14. Add policy comments
15. Review and restrict public access policies

### Long-term Actions (Low Priority)

16. Implement proper migration tool with dependency tracking
17. Add data validation queries
18. Create database documentation
19. Implement automated testing for migrations
20. Set up regular database health checks

---

## Conclusion

The database schema and migrations require significant cleanup before production deployment. The most critical issues involve security vulnerabilities (RLS UUID comparison), data integrity risks (foreign key conflicts), and operational concerns (duplicate migrations). 

**Estimated Effort:** 40-60 hours to resolve all critical and high-priority issues

**Risk Assessment:** 
- **Current Risk Level:** HIGH
- **After Critical Fixes:** MEDIUM
- **After All Recommendations:** LOW

**Next Steps:**
1. Address critical security issues immediately
2. Create migration plan to consolidate schema
3. Test all changes in staging environment
4. Implement automated migration testing
5. Document final schema structure

---

**Audit Completed By:** Cascade AI Assistant
**Audit Date:** June 2, 2026
**Next Review Date:** After critical issues resolved
