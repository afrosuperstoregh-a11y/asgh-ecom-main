# PHASE 4: Migration Consolidation
**AfroSuperStore Database Remediation**
**Date:** June 2, 2026

---

## Migration File Classification

### OBSOLETE MIGRATIONS (To Be Archived)

The following migrations are obsolete and should be archived:

1. **001_initial_schema.sql** (MySQL version)
   - Reason: MySQL-specific syntax, replaced by PostgreSQL version
   - Archive location: `database/migrations/archived/001_initial_schema_mysql.sql`

2. **003_add_password_reset_columns.sql** (both locations)
   - Reason: Supabase handles password resets natively
   - Archive location: `database/migrations/archived/003_add_password_reset_columns.sql`

3. **003_create_super_admin.sql** (reference only)
   - Reason: Reference file, not executable
   - Archive location: `database/migrations/archived/003_create_super_admin_reference.sql`

4. **006_create_customer_profiles.sql** (duplicate)
   - Reason: Duplicate of CRM version, superseded by canonical schema
   - Archive location: `database/migrations/archived/006_create_customer_profiles_duplicate.sql`

5. **006_create_customer_profiles_compatible.sql** (integer version)
   - Reason: Integer version incompatible with UUID canonical schema
   - Archive location: `database/migrations/archived/006_create_customer_profiles_integer.sql`

### DUPLICATE MIGRATIONS (To Be Removed)

The following migrations exist in both `database/migrations/` and `supabase/migrations/`:

1. **002_add_indexes.sql**
   - Action: Keep in canonical migration, remove from both directories
   - Reason: Indexes now part of canonical schema

2. **004_remove_legacy_auth_columns.sql**
   - Action: Remove from both directories
   - Reason: No longer needed with canonical schema

3. **007_add_videos_column.sql**
   - Action: Remove from both directories
   - Reason: Videos column now part of canonical schema

4. **008_update_orders_schema.sql**
   - Action: Remove from both directories
   - Reason: Schema updates now part of canonical schema

5. **20260313034613_create_product_images_dev.sql**
   - Action: Remove (empty file)
   - Reason: Empty file, not needed

### ACTIVE MIGRATIONS (To Be Replaced by Canonical)

The following migrations will be replaced by the new canonical migrations:

1. **001_initial_schema_postgresql.sql**
   - Replaced by: `002_create_canonical_schema.sql`

2. **002_supabase_rls_policies.sql**
   - Replaced by: `001_fix_rls_uuid_vulnerability.sql` and `003_apply_canonical_rls_policies.sql`

3. **003_supabase_auth_migration.sql**
   - Replaced by: `002_create_canonical_schema.sql` (includes auth integration)

4. **003_add_slug_indexes.sql**
   - Replaced by: `002_create_canonical_schema.sql` (includes indexes)

5. **003_create_super_admin_postgresql.sql**
   - Replaced by: Manual admin creation script (see below)

6. **004_crm_schema.sql**
   - Replaced by: `002_create_canonical_schema.sql` (includes CRM tables)

7. **005_add_payment_provider_and_currency.sql**
   - Replaced by: `002_create_canonical_schema.sql` (includes payment fields)

8. **005_setup_rls_policies.sql**
   - Replaced by: `003_apply_canonical_rls_policies.sql`

9. **005_crm_rls_policies.sql**
   - Replaced by: `003_apply_canonical_rls_policies.sql`

10. **20260313162500_crm_final_setup.sql**
    - Replaced by: `002_create_canonical_schema.sql` (includes CRM setup)

---

## New Canonical Migration Sequence

### Migration Order

```
001_fix_rls_uuid_vulnerability.sql
    - Fixes critical security vulnerability in existing RLS policies
    - Can be run on existing database before schema migration

002_create_canonical_schema.sql
    - Creates the complete canonical schema
    - Includes all tables, indexes, functions, triggers
    - Replaces all previous schema migrations

003_apply_canonical_rls_policies.sql
    - Applies comprehensive RLS policies to canonical schema
    - Includes proper UUID comparisons and least-privilege access

004_migrate_existing_data.sql
    - Migrates data from old schema to canonical schema
    - Handles user data, orders, products, etc.
    - Data integrity validation

005_remove_obsolete_tables.sql
    - Removes obsolete tables after data migration
    - Cleans up users table (replaced by profiles)
    - Removes backup tables

006_create_admin_user.sql
    - Creates initial admin user using environment variables
    - Replaces hardcoded password migration

007_validate_schema_integrity.sql
    - Validates final schema integrity
    - Checks foreign keys, constraints, indexes
    - Generates validation report
```

---

## Migration Execution Plan

### Pre-Migration Checklist

- [ ] Backup production database
- [ ] Set required environment variables (ADMIN_EMAIL, ADMIN_PASSWORD)
- [ ] Test migrations on staging environment
- [ ] Prepare rollback plan
- [ ] Notify stakeholders of maintenance window

### Migration Steps

1. **Phase 1: Security Fixes**
   ```bash
   # Run on existing database
   psql -f database/remediation/migrations/001_fix_rls_uuid_vulnerability.sql
   ```

2. **Phase 2: Schema Migration**
   ```bash
   # Create canonical schema
   psql -f database/remediation/migrations/002_create_canonical_schema.sql
   ```

3. **Phase 3: RLS Policies**
   ```bash
   # Apply RLS policies
   psql -f database/remediation/migrations/003_apply_canonical_rls_policies.sql
   ```

4. **Phase 4: Data Migration**
   ```bash
   # Migrate existing data
   psql -f database/remediation/migrations/004_migrate_existing_data.sql
   ```

5. **Phase 5: Cleanup**
   ```bash
   # Remove obsolete objects
   psql -f database/remediation/migrations/005_remove_obsolete_tables.sql
   ```

6. **Phase 6: Admin User**
   ```bash
   # Create admin user
   psql -f database/remediation/migrations/006_create_admin_user.sql
   ```

7. **Phase 7: Validation**
   ```bash
   # Validate schema
   psql -f database/remediation/migrations/007_validate_schema_integrity.sql
   ```

---

## Rollback Plan

### Rollback Steps

If migration fails, execute rollback in reverse order:

1. **Rollback Phase 7: Validation**
   - No action needed (validation only)

2. **Rollback Phase 6: Admin User**
   ```sql
   DELETE FROM admin_users WHERE user_id IN (
       SELECT id FROM profiles WHERE email = $ADMIN_EMAIL
   );
   DELETE FROM profiles WHERE email = $ADMIN_EMAIL;
   ```

3. **Rollback Phase 5: Cleanup**
   - Restore from backup (cannot undo table drops)

4. **Rollback Phase 4: Data Migration**
   - Restore from backup (data migration is not reversible)

5. **Rollback Phase 3: RLS Policies**
   ```sql
   -- Restore old RLS policies from backup
   ```

6. **Rollback Phase 2: Schema Migration**
   - Restore from backup (schema changes are not reversible)

7. **Rollback Phase 1: Security Fixes**
   ```sql
   -- Restore old RLS policies from backup
   ```

### Critical Rollback Note

**Data migration and schema changes are not reversible without a backup.**
Always ensure a complete database backup exists before starting migration.

---

## Migration Idempotency

All canonical migrations are designed to be idempotent:

### 001_fix_rls_uuid_vulnerability.sql
- Uses `DROP POLICY IF EXISTS` before creating
- Can be re-run safely

### 002_create_canonical_schema.sql
- Uses `CREATE TABLE IF NOT EXISTS`
- Uses `CREATE INDEX IF NOT EXISTS`
- Uses `CREATE OR REPLACE FUNCTION`
- Can be re-run safely

### 003_apply_canonical_rls_policies.sql
- Uses `DROP POLICY IF EXISTS` before creating
- Can be re-run safely

### 004_migrate_existing_data.sql
- Uses `INSERT ... ON CONFLICT DO NOTHING`
- Checks for existing data before migration
- Can be re-run safely

### 005_remove_obsolete_tables.sql
- Uses `DROP TABLE IF EXISTS`
- Can be re-run safely

### 006_create_admin_user.sql
- Uses `INSERT ... ON CONFLICT DO NOTHING`
- Can be re-run safely

### 007_validate_schema_integrity.sql
- Validation only, no schema changes
- Can be re-run safely

---

## Migration Tracking

The `migration_log` table tracks all migrations:

```sql
CREATE TABLE migration_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    migration_name TEXT NOT NULL UNIQUE,
    executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    execution_time_ms INTEGER,
    success BOOLEAN NOT NULL DEFAULT true,
    checksum TEXT,
    rollback_available BOOLEAN DEFAULT false,
    rollback_migration_name TEXT
);
```

### Check Migration Status

```sql
SELECT 
    migration_name,
    executed_at,
    execution_time_ms,
    success,
    checksum
FROM migration_log
ORDER BY executed_at DESC;
```

### Force Re-run Migration

```sql
-- Delete migration log entry
DELETE FROM migration_log WHERE migration_name = 'migration_name.sql';

-- Re-run migration
psql -f migration_name.sql
```

---

## Archive Structure

Create archive directory structure:

```
database/
├── migrations/
│   ├── archived/
│   │   ├── 001_initial_schema_mysql.sql
│   │   ├── 003_add_password_reset_columns.sql
│   │   ├── 003_create_super_admin_reference.sql
│   │   ├── 006_create_customer_profiles_duplicate.sql
│   │   └── 006_create_customer_profiles_integer.sql
│   └── remediation/
│       ├── 001_fix_rls_uuid_vulnerability.sql
│       ├── 002_create_canonical_schema.sql
│       ├── 003_apply_canonical_rls_policies.sql
│       ├── 004_migrate_existing_data.sql
│       ├── 005_remove_obsolete_tables.sql
│       ├── 006_create_admin_user.sql
│       └── 007_validate_schema_integrity.sql
└── supabase/
    └── migrations/
        └── (empty - all migrations moved to database/migrations/remediation/)
```

---

## Next Steps

1. Create archive directory structure
2. Move obsolete migrations to archived/
3. Remove duplicate migrations
4. Create remaining canonical migrations (004-007)
5. Test migration sequence on staging
6. Execute migration on production
7. Validate results
