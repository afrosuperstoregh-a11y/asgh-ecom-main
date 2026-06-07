# Deployment Checklist: 004_migrate_existing_data.sql

**Migration Version:** 2.0 (REMEDIATED)  
**Deployment Date:** [DATE]  
**Deployed By:** [NAME]  
**Environment:** [ENVIRONMENT]

---

## Pre-Deployment Checklist

### 1. Preparation
- [ ] Review migration audit report (`004_migration_audit_report.md`)
- [ ] Review remediated migration script (`004_migrate_existing_data.sql`)
- [ ] Review validation script (`004_validate_data_migration.sql`)
- [ ] Ensure all prerequisites are met
- [ ] Schedule maintenance window (if required)
- [ ] Notify stakeholders of deployment

### 2. Database Backup
- [ ] Create full database backup
- [ ] Verify backup integrity
- [ ] Store backup in secure location
- [ ] Document backup location and restore procedure
- [ ] Test backup restore procedure (optional but recommended)

### 3. Staging Environment Testing
- [ ] Deploy to staging environment
- [ ] Run migration on staging
- [ ] Run validation script on staging
- [ ] Verify data integrity on staging
- [ ] Test application functionality on staging
- [ ] Review validation results
- [ ] Address any issues found on staging

### 4. Code Review
- [ ] Peer review of remediated migration
- [ ] Security review completed
- [ ] Performance review completed
- [ ] All review comments addressed

### 5. Documentation
- [ ] Migration documentation updated
- [ ] Rollback procedure documented
- [ ] Post-migration verification template prepared
- [ ] Runbook updated

---

## Deployment Execution Checklist

### 1. Pre-Deployment Verification
- [ ] Verify database backup exists and is accessible
- [ ] Verify staging deployment was successful
- [ ] Verify all staging issues are resolved
- [ ] Verify maintenance window is approved (if required)
- [ ] Verify team is available for deployment

### 2. Deployment Steps
- [ ] Put application in maintenance mode (if required)
- [ ] Execute database backup (final backup before deployment)
- [ ] Run remediated migration script:
  ```bash
  psql -f database/remediation/migrations/004_migrate_existing_data.sql
  ```
- [ ] Monitor migration execution logs
- [ ] Verify migration completed successfully
- [ ] Run validation script:
  ```bash
  psql -f database/remediation/migrations/004_validate_data_migration.sql
  ```
- [ ] Review validation results
- [ ] Check for any critical or high priority issues

### 3. Post-Deployment Verification
- [ ] Verify no critical validation issues
- [ ] Verify no high priority validation issues (or address them)
- [ ] Check application logs for errors
- [ ] Verify application functionality
- [ ] Test user authentication
- [ ] Test order creation
- [ ] Test cart functionality
- [ ] Test payment processing
- [ ] Test admin functions
- [ ] Verify data counts match expected values

### 4. Manual Reconciliation (if required)
- [ ] Check `refund_order_mapping` table for unresolved mappings
- [ ] Perform manual reconciliation for refund requests
- [ ] Update `refund_order_mapping` with resolved mappings
- [ ] Add foreign key to `refund_requests.order_id` after reconciliation

### 5. Cleanup
- [ ] Remove backup tables (after successful verification):
  - [ ] `users_backup_004`
  - [ ] `orders_backup_004`
  - [ ] `order_items_backup_004`
  - [ ] `payments_backup_004`
  - [ ] `refund_requests_backup_004`
  - [ ] `cart_backup_004`
  - [ ] `reviews_backup_004`
  - [ ] `inventory_logs_backup_004`
- [ ] Remove helper functions (optional):
  ```sql
  DROP FUNCTION IF EXISTS create_constraint_if_not_exists(TEXT, TEXT, TEXT);
  DROP FUNCTION IF EXISTS create_index_if_not_exists(TEXT, TEXT, TEXT[], BOOLEAN);
  DROP FUNCTION IF EXISTS add_column_if_not_exists(TEXT, TEXT, TEXT);
  DROP FUNCTION IF EXISTS drop_constraint_if_exists(TEXT, TEXT);
  DROP FUNCTION IF EXISTS create_backup_table(TEXT, TEXT);
  ```
- [ ] Take application out of maintenance mode (if applicable)

---

## Rollback Checklist

### When to Rollback
- [ ] Migration fails with critical errors
- [ ] Validation shows critical data integrity issues
- [ ] Application functionality is broken
- [ ] Performance degradation is severe
- [ ] Stakeholder requests rollback

### Rollback Steps
- [ ] Put application in maintenance mode
- [ ] Stop any ongoing transactions
- [ ] Restore from backup tables:
  ```sql
  -- Example for orders table
  TRUNCATE orders;
  INSERT INTO orders SELECT * FROM orders_backup_004;
  
  -- Repeat for other tables as needed
  ```
- [ ] OR restore from full database backup:
  ```bash
  # Restore from backup
  pg_restore -d database_name backup_file.dump
  ```
- [ ] Verify data integrity after rollback
- [ ] Verify application functionality after rollback
- [ ] Document rollback reason and lessons learned
- [ ] Notify stakeholders of rollback

---

## Post-Deployment Checklist

### 1. Documentation
- [ ] Fill out post-migration verification report
- [ ] Document any issues encountered
- [ ] Document any manual reconciliation performed
- [ ] Update deployment runbook
- [ ] Archive deployment logs

### 2. Monitoring
- [ ] Monitor database performance for 24 hours
- [ ] Monitor application error logs for 24 hours
- [ ] Monitor application performance metrics
- [ ] Set up alerts for any anomalies

### 3. Communication
- [ ] Notify stakeholders of successful deployment
- [ ] Share validation results with team
- [ ] Document any follow-up actions required
- [ ] Schedule follow-up review meeting

### 4. Next Steps
- [ ] Schedule deployment of `005_remove_obsolete_tables.sql`
- [ ] Schedule deployment of `007_validate_schema_integrity.sql`
- [ ] Plan for cleanup of legacy tables
- [ ] Update deployment schedule

---

## Validation Results Summary

### Pre-Migration Validation
- Schema existence check: [PASSED/FAILED]
- Auth schema check: [PASSED/FAILED/SKIPPED]
- User/auth mapping: [PASSED/FAILED/SKIPPED]
- Profile duplicate check: [PASSED/FAILED]
- Orphan record check (pre): [PASSED/FAILED]
- Backup creation: [PASSED/FAILED]

### Post-Migration Validation
- Orphaned orders (post): [PASSED/FAILED/WARNING]
- Orphaned order items (post): [PASSED/FAILED/WARNING]
- Orphaned cart items (post): [PASSED/FAILED/WARNING]
- Orphaned reviews (post): [PASSED/FAILED/WARNING]
- Orphaned payments (post): [PASSED/FAILED/WARNING]
- Orphaned inventory_logs (post): [PASSED/FAILED/WARNING]
- Auth compatibility: [PASSED/FAILED/SKIPPED]
- Foreign key count: [PASSED/FAILED]

### Manual Reconciliation
- Refund requests requiring reconciliation: [NUMBER]
- Refund requests reconciled: [NUMBER]
- Refund requests pending: [NUMBER]

---

## Sign-Off

### Pre-Deployment Approval
- **Approved By:** [NAME]
- **Date:** [DATE]
- **Signature:** [SIGNATURE]

### Deployment Execution
- **Executed By:** [NAME]
- **Date:** [DATE]
- **Time:** [TIME]
- **Signature:** [SIGNATURE]

### Post-Deployment Verification
- **Verified By:** [NAME]
- **Date:** [DATE]
- **Signature:** [SIGNATURE]

### Final Approval
- **Approved By:** [NAME]
- **Date:** [DATE]
- **Signature:** [SIGNATURE]

---

## Notes and Issues

### Issues Encountered
1. [ISSUE 1]
2. [ISSUE 2]
3. [ISSUE 3]

### Deviations from Plan
1. [DEVIATION 1]
2. [DEVIATION 2]

### Lessons Learned
1. [LESSON 1]
2. [LESSON 2]

---

**Checklist Version:** 1.0  
**Last Updated:** 2025-06-07
