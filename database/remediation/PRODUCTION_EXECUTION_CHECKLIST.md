# Production Execution Checklist
**AfroSuperStore Database Remediation**
**Date:** June 2, 2026

---

## Pre-Execution Checklist (24-48 Hours Before)

### Database Preparation

- [ ] **Create Full Database Backup**
  ```bash
  pg_dump afrosuperstore > backup_pre_migration_$(date +%Y%m%d_%H%M%S).sql
  ```
  - Verify backup file size
  - Test backup restore on staging
  - Store backup in secure location (multiple locations)
  - Document backup location and timestamp

- [ ] **Verify Backup Integrity**
  ```bash
  # Check backup file
  head -n 50 backup_pre_migration_*.sql
  
  # Count tables in backup
  grep "CREATE TABLE" backup_pre_migration_*.sql | wc -l
  ```

- [ ] **Document Current State**
  ```sql
  -- Record counts before migration
  SELECT 'profiles' as table_name, COUNT(*) as count FROM profiles
  UNION ALL
  SELECT 'orders', COUNT(*) FROM orders
  UNION ALL
  SELECT 'products', COUNT(*) FROM products
  UNION ALL
  SELECT 'categories', COUNT(*) FROM categories
  UNION ALL
  SELECT 'order_items', COUNT(*) FROM order_items;
  
  -- Save output to file
  ```

### Environment Setup

- [ ] **Set Environment Variables**
  ```bash
  export ADMIN_EMAIL=admin@yourdomain.com
  export ADMIN_PASSWORD=secure_password_here
  export ADMIN_FIRST_NAME=Admin
  export ADMIN_LAST_NAME=User
  export DATABASE_URL=postgresql://user:password@host:port/database
  ```

- [ ] **Verify Environment Variables**
  ```bash
  echo $ADMIN_EMAIL
  echo $ADMIN_PASSWORD
  echo $DATABASE_URL
  ```

- [ ] **Test Database Connection**
  ```bash
  psql $DATABASE_URL -c "SELECT version();"
  psql $DATABASE_URL -c "SELECT COUNT(*) FROM profiles;"
  ```

### Application Preparation

- [ ] **Deploy Updated Application Code**
  - All code changes from APPLICATION_CODE_UPDATE_GUIDE.md completed
  - Application deployed to production
  - Application in maintenance mode or ready for migration
  - Document application version deployed

- [ ] **Verify Application Status**
  - Application accessible
  - Health checks passing
  - Error tracking enabled
  - Monitoring dashboards configured

### Team Preparation

- [ ] **Notify Stakeholders**
  - Engineering team notified
  - Product team notified
  - Support team notified
  - Customers notified (if applicable)

- [ ] **Schedule Maintenance Window**
  - Date: _______________
  - Time: _______________
  - Duration: 20-55 minutes
  - Communication sent

- [ ] **Assign Roles**
  - Migration executor: _______________
  - Database admin: _______________
  - Application admin: _______________
  - Support lead: _______________

### Validation Preparation

- [ ] **Prepare Validation Scripts**
  - Download all migration files to production server
  - Verify file integrity (checksums)
  - Test file permissions
  - Document file locations

- [ ] **Prepare Rollback Plan**
  - Rollback procedure documented
  - Rollback scripts prepared
  - Rollback tested on staging
  - Team trained on rollback

- [ ] **Prepare Monitoring**
  - Database monitoring enabled
  - Application monitoring enabled
  - Alert thresholds configured
  - Dashboard ready

---

## Execution Checklist (During Migration)

### Step 1: Pre-Migration Validation (5 minutes)

- [ ] **Run Pre-Migration Checks**
  ```sql
  SELECT * FROM validate_all();
  ```
  - Document any issues
  - Ensure no critical issues
  - Record validation results

- [ ] **Verify Record Counts**
  ```sql
  -- Compare with pre-migration documentation
  SELECT tablename, pg_total_relation_size(schemaname||'.'||tablename) as size
  FROM pg_tables 
  WHERE schemaname = 'public'
  ORDER BY pg_total_relation_size DESC;
  ```

- [ ] **Stop Application Writes** (Optional)
  - Enable maintenance mode
  - Stop background jobs
  - Pause cron jobs
  - Document time stopped

### Step 2: Security Fix (001) - 0 minutes (can run live)

- [ ] **Execute Migration 001**
  ```bash
  psql $DATABASE_URL -f migrations/001_fix_rls_uuid_vulnerability.sql
  ```
  - Capture output
  - Verify success
  - Document execution time

- [ ] **Validate Step 2**
  ```sql
  SELECT COUNT(*) FROM pg_policies 
  WHERE schemaname = 'public' 
  AND (qual LIKE '%::text%'::text OR with_check LIKE '%::text%'::text);
  -- Expected: 0
  ```

### Step 3: Canonical Schema (002) - 5-10 minutes

- [ ] **Execute Migration 002**
  ```bash
  psql $DATABASE_URL -f migrations/002_create_canonical_schema.sql
  ```
  - Capture output
  - Monitor for errors
  - Document execution time

- [ ] **Validate Step 3**
  ```sql
  -- Verify tables created
  SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public';
  -- Expected: 25+ tables
  
  -- Verify indexes created
  SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public';
  -- Expected: 50+ indexes
  ```

### Step 4: RLS Policies (003) - 2-5 minutes

- [ ] **Execute Migration 003**
  ```bash
  psql $DATABASE_URL -f migrations/003_apply_canonical_rls_policies.sql
  ```
  - Capture output
  - Monitor for errors
  - Document execution time

- [ ] **Validate Step 4**
  ```sql
  -- Verify RLS enabled
  SELECT tablename, rowsecurity 
  FROM pg_tables 
  WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'orders', 'payments');
  -- Expected: All true
  
  -- Verify policies created
  SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public';
  -- Expected: 60+ policies
  ```

### Step 5: Data Migration (004) - 10-30 minutes

- [ ] **Execute Migration 004**
  ```bash
  psql $DATABASE_URL -f migrations/004_migrate_existing_data.sql
  ```
  - Capture output
  - Monitor progress
  - Document execution time
  - Note any warnings

- [ ] **Validate Step 5**
  ```sql
  -- Verify data migrated
  SELECT COUNT(*) as profiles_count FROM profiles;
  SELECT COUNT(*) as orders_count FROM orders;
  SELECT COUNT(*) as products_count FROM products;
  
  -- Verify no orphaned records
  SELECT * FROM validate_schema_integrity();
  ```

### Step 6: Cleanup (005) - 2-5 minutes

- [ ] **Execute Migration 005**
  ```bash
  psql $DATABASE_URL -f migrations/005_remove_obsolete_tables.sql
  ```
  - Capture output
  - Monitor for errors
  - Document execution time

- [ ] **Validate Step 6**
  ```sql
  -- Verify obsolete tables removed
  SELECT tablename FROM pg_tables 
  WHERE schemaname = 'public'
  AND tablename IN ('users', 'users_backup', 'migrations');
  -- Expected: 0 rows
  ```

### Step 7: Admin User (006) - 1 minute

- [ ] **Execute Migration 006**
  ```bash
  psql $DATABASE_URL -f migrations/006_create_admin_user.sql
  ```
  - Capture output
  - Verify success
  - Document execution time

- [ ] **Validate Step 7**
  ```sql
  SELECT * FROM validate_admin_setup();
  ```

### Step 8: Final Validation (007) - 2-5 minutes

- [ ] **Execute Migration 007**
  ```bash
  psql $DATABASE_URL -f migrations/007_validate_schema_integrity.sql
  ```
  - Capture output
  - Review validation results
  - Document execution time

- [ ] **Validate Step 8**
  ```sql
  -- Run all validations
  SELECT * FROM validate_all();
  
  -- Review validation results
  SELECT * FROM validation_results 
  ORDER BY severity DESC, validated_at DESC;
  -- Expected: All PASSED, no CRITICAL or HIGH issues
  ```

---

## Post-Execution Checklist (Immediately After)

### Immediate Validation

- [ ] **Verify Migration Log**
  ```sql
  SELECT * FROM migration_log ORDER BY executed_at DESC;
  ```
  - All 7 migrations present
  - All marked as success
  - Execution times reasonable

- [ ] **Verify Record Counts**
  ```sql
  -- Compare with pre-migration counts
  SELECT 'profiles' as table_name, COUNT(*) as count FROM profiles
  UNION ALL
  SELECT 'orders', COUNT(*) FROM orders
  UNION ALL
  SELECT 'products', COUNT(*) FROM products;
  ```
  - Counts match or are higher
  - No data loss

- [ ] **Verify Data Integrity**
  ```sql
  SELECT * FROM validate_schema_integrity();
  ```
  - No orphaned records
  - No duplicate data
  - All constraints valid

### Application Validation

- [ ] **Start Application**
  - Exit maintenance mode
  - Restart application services
  - Verify application starts
  - Check logs for errors

- [ ] **Test Critical Functionality**
  - User login works
  - Product browsing works
  - Cart operations work
  - Order placement works
  - Admin login works

- [ ] **Test API Endpoints**
  ```bash
  curl -X GET https://afrosuperstore.ca/api/products
  curl -X GET https://afrosuperstore.ca/api/categories
  curl -X GET https://afrosuperstore.ca/api/orders
  ```
  - All return 200 OK
  - Data structure correct
  - Field names updated

### Performance Validation

- [ ] **Monitor Database Performance**
  - Connection pool utilization
  - Query response times
  - Index usage
  - No slow queries

- [ ] **Monitor Application Performance**
  - Response times
  - Error rates
  - Throughput
  - No degradation

### Security Validation

- [ ] **Test RLS Policies**
  - Users can only access own data
  - Anonymous users limited access
  - Admin users full access
  - No data leakage

- [ ] **Test Admin Functions**
  - Admin login works
  - Admin functions work
  - No privilege escalation

---

## Rollback Checklist (If Needed)

### Rollback Triggers

Execute rollback if:
- ❌ Migration fails at any step
- ❌ Validation fails with critical issues
- ❌ Application functionality broken
- ❌ Performance degradation > 50%
- ❌ Security vulnerability detected
- ❌ Data loss detected

### Rollback Procedure

- [ ] **Stop Application**
  - Enable maintenance mode
  - Stop all services
  - Document time stopped

- [ ] **Restore Database Backup**
  ```bash
  psql afrosuperstore < backup_pre_migration_YYYYMMDD_HHMMSS.sql
  ```
  - Verify restore success
  - Check record counts
  - Validate data integrity

- [ ] **Restore Application Code**
  ```bash
  git revert <commit-hash>
  npm run build
  npm run deploy
  ```
  - Verify deployment
  - Check logs
  - Test functionality

- [ ] **Validate Rollback**
  ```sql
  SELECT * FROM validate_all();
  ```
  - All validations pass
  - Application works
  - Data integrity verified

- [ ] **Notify Team**
  - Document rollback
  - Investigate failure
  - Plan remediation

---

## Documentation

### Execution Log

| Step | Migration | Start Time | End Time | Duration | Status | Notes |
|------|-----------|------------|----------|----------|--------|-------|
| 1 | Pre-validation | | | | ⬜ | |
| 2 | 001_fix_rls | | | | ⬜ | |
| 3 | 002_canonical_schema | | | | ⬜ | |
| 4 | 003_rls_policies | | | | ⬜ | |
| 5 | 004_migrate_data | | | | ⬜ | |
| 6 | 005_cleanup | | | | ⬜ | |
| 7 | 006_admin_user | | | | ⬜ | |
| 8 | 007_validate | | | | ⬜ | |

### Issues Encountered

| Issue ID | Step | Description | Severity | Resolution |
|-----------|------|-------------|----------|------------|
| | | | | |

### Validation Results

| Category | Check Name | Status | Details |
|----------|------------|--------|---------|
| Schema Integrity | | ⬜ | |
| Security | | ⬜ | |
| Performance | | ⬜ | |
| Migration Integrity | | ⬜ | |

---

## Sign-Off

### Migration Executor

- **Name:** _________________________
- **Date:** _________________________
- **Time:** _________________________
- **Result:** ⬜ SUCCESS / ❌ FAILED
- **Comments:** _________________________

### Database Administrator

- **Name:** _________________________
- **Date:** _________________________
- **Approval:** ⬜ APPROVED / ❌ REJECTED
- **Comments:** _________________________

### Engineering Lead

- **Name:** _________________________
- **Date:** _________________________
- **Approval:** ⬜ APPROVED / ❌ REJECTED
- **Comments:** _________________________

---

## Emergency Contacts

- **Migration Executor:** _________________________
- **Database Admin:** _________________________
- **Engineering Lead:** _________________________
- **Support Lead:** _________________________
- **On-Call Engineer:** _________________________

---

**Last Updated:** June 2, 2026
