# PHASE 1: Database Analysis
**AfroSuperStore Database Remediation**
**Date:** June 2, 2026

---

## Current Migration Files Inventory

### database/migrations/ Directory

| File | Purpose | Status | Issues |
|------|---------|--------|--------|
| `001_initial_schema.sql` | MySQL initial schema | **OBSOLETE** | MySQL syntax, conflicts with PostgreSQL version |
| `001_initial_schema_postgresql.sql` | PostgreSQL initial schema | **ACTIVE** | Missing some tables, inconsistent with later migrations |
| `002_add_indexes.sql` | Performance indexes | **DUPLICATE** | Exists in both database/ and supabase/migrations/ |
| `002_supabase_rls_policies.sql` | RLS policies for Supabase | **ACTIVE** | UUID comparison bug, references non-existent tables |
| `003_add_password_reset_columns.sql` | Password reset columns | **OBSOLETE** | Supabase handles password resets |
| `003_add_slug_indexes.sql` | Slug indexes and backfill | **ACTIVE** | Good, but should be in initial schema |
| `003_create_super_admin.sql` | Super admin creation (reference) | **OBSOLETE** | Reference only, not executable |
| `003_create_super_admin_postgresql.sql` | Super admin creation | **ACTIVE** | Hardcoded password, security risk |
| `003_supabase_auth_migration.sql` | Supabase auth integration | **ACTIVE** | Creates profiles table, conflicts with users table |
| `003_create_super_admin.sql` | Super admin (MySQL) | **DUPLICATE** | Duplicate of PostgreSQL version |
| `004_crm_schema.sql` | CRM functionality | **ACTIVE** | Comprehensive, but references users table |
| `004_remove_legacy_auth_columns.sql` | Remove legacy auth columns | **ACTIVE** | References migration_log table that doesn't exist |
| `005_add_payment_provider_and_currency.sql` | Payment fields | **ACTIVE** | Good, adds payment analytics |
| `005_crm_rls_policies.sql` | CRM RLS policies | **ACTIVE** | Duplicate functions, references users table |
| `005_setup_rls_policies.sql` | RLS policies setup | **ACTIVE** | References profiles table, duplicate functions |
| `006_create_customer_profiles.sql` | Customer profiles (UUID) | **DUPLICATE** | Duplicate of CRM version |
| `006_create_customer_profiles_compatible.sql` | Customer profiles (INT) | **DUPLICATE** | Integer version, conflicts with UUID version |
| `007_add_videos_column.sql` | Product videos | **ACTIVE** | Simple, good |
| `008_update_orders_schema.sql` | Orders schema updates | **ACTIVE** | Column renames, breaking changes |

### supabase/migrations/ Directory

| File | Purpose | Status | Issues |
|------|---------|--------|--------|
| `002_add_indexes.sql` | Performance indexes | **DUPLICATE** | Duplicate of database/migrations/ version |
| `003_add_password_reset_columns.sql` | Password reset columns | **OBSOLETE** | Supabase handles password resets |
| `004_remove_legacy_auth_columns.sql` | Remove legacy auth columns | **DUPLICATE** | Duplicate of database/migrations/ version |
| `007_add_videos_column.sql` | Product videos | **DUPLICATE** | Duplicate of database/migrations/ version |
| `008_update_orders_schema.sql` | Orders schema updates | **DUPLICATE** | Duplicate of database/migrations/ version |
| `20260313034613_create_product_images_dev.sql` | Product images | **EMPTY** | Empty file |
| `20260313162500_crm_final_setup.sql` | CRM final setup | **ACTIVE** | Additional CRM setup |

---

## Current Database Schema

### Core Tables (from 001_initial_schema_postgresql.sql)

```sql
-- Authentication & User Management
auth.users (Supabase system table)
users (custom user table - CONFLICTS with auth.users)
profiles (Supabase auth extension - CONFLICTS with users)
admin_users (admin-specific data)

-- E-commerce
categories
products
orders
order_items
cart
reviews

-- Inventory & Payments
inventory_logs
payments

-- CRM (from 004_crm_schema.sql)
customer_profiles (CONFLICTS with profiles)
customer_notes
customer_tags
customer_tag_map
customer_segments
customer_segment_rules
customer_segment_memberships
email_templates
email_logs
email_campaigns
email_campaign_recipients
crm_automations
crm_automation_logs

-- Additional (from 005_add_payment_provider_and_currency.sql)
refund_requests
```

### Table Structure Conflicts

**CRITICAL CONFLICT 1: User Tables**
- `users` table (001_initial_schema_postgresql.sql)
  - UUID primary key
  - Contains email, password_hash, role
  - Self-contained authentication
  
- `profiles` table (003_supabase_auth_migration.sql)
  - UUID primary key
  - References auth.users(id)
  - Contains first_name, last_name, phone, role
  - Designed for Supabase auth

- `auth.users` (Supabase system table)
  - UUID primary key
  - Built-in authentication
  - Cannot be modified directly

**CRITICAL CONFLICT 2: Customer Profiles**
- `customer_profiles` table (004_crm_schema.sql)
  - UUID primary key
  - References users(id)
  - CRM lifecycle data
  
- `customer_profiles` table (006_create_customer_profiles.sql)
  - DUPLICATE of above
  
- `customer_profiles` table (006_create_customer_profiles_compatible.sql)
  - INTEGER primary key
  - References users(id) with INTEGER
  - Incompatible with UUID version

---

## Foreign Key Analysis

### Current Foreign Key References

| Table | Column | References | ON DELETE | Issue |
|-------|--------|------------|-----------|-------|
| categories | parent_id | categories(id) | SET NULL | OK |
| products | category_id | categories(id) | SET NULL | OK |
| products | vendor_id | users(id) | SET NULL | **CONFLICT** - should reference profiles |
| orders | customer_id | users(id) | RESTRICT | **CONFLICT** - renamed to user_id in 008 |
| orders | user_id | profiles(id) | RESTRICT | **CONFLICT** - inconsistent reference |
| order_items | order_id | orders(id) | CASCADE | OK |
| order_items | product_id | products(id) | RESTRICT | OK |
| cart | customer_id | users(id) | CASCADE | **CONFLICT** - should be user_id |
| cart | product_id | products(id) | CASCADE | OK |
| reviews | product_id | products(id) | CASCADE | OK |
| reviews | customer_id | users(id) | CASCADE | **CONFLICT** - should be user_id |
| inventory_logs | product_id | products(id) | CASCADE | OK |
| inventory_logs | order_id | orders(id) | SET NULL | OK |
| inventory_logs | created_by | users(id) | SET NULL | **CONFLICT** - should be user_id |
| payments | order_id | orders(id) | CASCADE | OK |
| admin_users | user_id | users(id) | CASCADE | **CONFLICT** - should reference profiles |
| customer_profiles | user_id | users(id) | CASCADE | **CONFLICT** - should reference profiles |
| customer_notes | customer_id | customer_profiles(id) | CASCADE | OK |
| customer_notes | admin_id | users(id) | CASCADE | **CONFLICT** - should be user_id |
| customer_tag_map | customer_id | customer_profiles(id) | CASCADE | OK |
| customer_tag_map | tag_id | customer_tags(id) | CASCADE | OK |
| customer_tag_map | assigned_by | users(id) | CASCADE | **CONFLICT** - should be user_id |
| customer_segments | created_by | users(id) | CASCADE | **CONFLICT** - should be user_id |
| customer_segment_rules | segment_id | customer_segments(id) | CASCADE | OK |
| customer_segment_memberships | customer_id | customer_profiles(id) | CASCADE | OK |
| customer_segment_memberships | segment_id | customer_segments(id) | CASCADE | OK |
| customer_segment_memberships | added_by | users(id) | SET NULL | **CONFLICT** - should be user_id |
| email_templates | created_by | users(id) | CASCADE | **CONFLICT** - should be user_id |
| email_logs | template_id | email_templates(id) | SET NULL | OK |
| email_logs | customer_id | customer_profiles(id) | SET NULL | OK |
| email_campaigns | template_id | email_templates(id) | SET NULL | OK |
| email_campaigns | segment_id | customer_segments(id) | SET NULL | OK |
| email_campaigns | created_by | users(id) | CASCADE | **CONFLICT** - should be user_id |
| email_campaign_recipients | campaign_id | email_campaigns(id) | CASCADE | OK |
| email_campaign_recipients | customer_id | customer_profiles(id) | CASCADE | OK |
| crm_automations | created_by | users(id) | CASCADE | **CONFLICT** - should be user_id |
| crm_automation_logs | automation_id | crm_automations(id) | CASCADE | OK |
| crm_automation_logs | customer_id | customer_profiles(id) | SET NULL | OK |
| refund_requests | order_id | orders(id) | CASCADE | **CONFLICT** - orders.id is UUID, refund_requests.order_id is INTEGER |
| admin_audit_log | admin_user_id | auth.users(id) | CASCADE | OK |

### Foreign Key Issues Summary

1. **Mixed References:** Tables reference both `users` and `profiles` inconsistently
2. **Type Mismatches:** Some FKs reference UUID with INTEGER columns
3. **Inconsistent ON DELETE:** Mix of CASCADE, SET NULL, RESTRICT without clear logic
4. **Broken References:** `refund_requests.order_id` is INTEGER but references UUID `orders.id`

---

## Index Analysis

### Current Indexes

| Table | Index | Type | Status |
|-------|-------|------|--------|
| users | idx_users_email | B-tree | OK |
| users | idx_users_role | B-tree | OK |
| categories | idx_categories_slug | B-tree | OK |
| categories | idx_categories_parent | B-tree | OK |
| categories | idx_categories_active | B-tree | OK |
| products | idx_products_slug | B-tree | OK |
| products | idx_products_category | B-tree | OK |
| products | idx_products_vendor | B-tree | OK |
| products | idx_products_status | B-tree | OK |
| products | idx_products_featured | B-tree | OK |
| products | idx_products_sku | B-tree | OK |
| products | idx_products_search | GIN (full-text) | OK |
| orders | idx_orders_customer | B-tree | **MISSING** - should be user_id |
| orders | idx_orders_status | B-tree | OK |
| orders | idx_orders_payment_status | B-tree | OK |
| orders | idx_orders_created | B-tree | OK |
| orders | idx_orders_number | B-tree | OK |
| order_items | idx_order_items_order | B-tree | OK |
| order_items | idx_order_items_product | B-tree | OK |
| cart | idx_cart_customer | B-tree | **MISSING** - should be user_id |
| cart | idx_cart_session | B-tree | OK |
| reviews | idx_reviews_product | B-tree | OK |
| reviews | idx_reviews_customer | B-tree | **MISSING** - should be user_id |
| reviews | idx_reviews_rating | B-tree | OK |
| reviews | idx_reviews_status | B-tree | OK |
| inventory_logs | idx_inventory_logs_product | B-tree | OK |
| inventory_logs | idx_inventory_logs_order | B-tree | OK |
| payments | idx_payments_order | B-tree | OK |
| payments | idx_payments_status | B-tree | OK |

### Missing Performance Indexes

1. **Composite Indexes:**
   - `products(category_id, status)` - for filtering products by category and status
   - `orders(user_id, created_at)` - for user order history
   - `orders(status, created_at)` - for order management queries
   - `cart(user_id, product_id)` - for cart lookups (unique constraint exists)

2. **Foreign Key Indexes:**
   - All foreign key columns should be indexed (PostgreSQL doesn't auto-index FKs)

3. **Partial Indexes:**
   - `products(id) WHERE status = 'active' AND featured = TRUE` - for featured products
   - `orders(created_at) WHERE status IN ('confirmed', 'processing', 'shipped')` - for active orders

---

## Function Analysis

### Current Functions

| Function | Purpose | Files Defined In | Issue |
|----------|---------|------------------|-------|
| `update_updated_at_column()` | Auto-update timestamp | Multiple files | **DUPLICATE** - defined in 001, 003, 004, 006 |
| `is_admin(user_id UUID)` | Check admin status | 002, 005, 005_crm | **DUPLICATE** - 3 definitions |
| `is_super_admin(user_id UUID)` | Check super admin status | 005 | OK |
| `owns_resource(resource_user_id UUID)` | Check resource ownership | 005 | OK |
| `sync_user_profile()` | Sync auth.users to profiles | 003 | OK |
| `update_customer_metrics(customer_uuid UUID)` | Update customer metrics | 004_crm | OK |
| `update_customer_on_order()` | Trigger for customer metrics | 004_crm | OK |
| `update_dynamic_segments()` | Update dynamic segments | 004_crm | OK |
| `owns_customer_profile(user_uuid UUID, profile_uuid UUID)` | Check customer profile ownership | 005_crm | OK |
| `can_access_customer_data(user_uuid UUID, customer_uuid UUID)` | Check customer data access | 005_crm | OK |
| `log_crm_access()` | Log CRM data access | 005_crm | OK |
| `audit_admin_changes()` | Audit admin actions | 005 | OK |
| `update_customer_metrics_secure(customer_uuid UUID)` | Secure metrics update | 005_crm | OK |
| `search_customers_secure()` | Secure customer search | 005_crm | OK |
| `validate_crm_permission()` | Validate CRM permissions | 005_crm | OK |
| `update_refund_requests_updated_at()` | Update refund timestamp | 005_payment | OK |

### Function Issues

1. **Duplicate Definitions:** `update_updated_at_column()` and `is_admin()` defined multiple times
2. **Naming Inconsistency:** Some functions use `user_id`, others use `user_uuid`
3. **Security:** Some functions lack SECURITY DEFINER where needed
4. **Parameter Types:** Inconsistent parameter naming (user_id vs user_uuid)

---

## Trigger Analysis

### Current Triggers

| Trigger | Table | Function | Purpose | Issue |
|---------|-------|----------|---------|-------|
| `update_users_updated_at` | users | update_updated_at_column | Auto-update timestamp | **DUPLICATE** - defined in multiple files |
| `update_admin_users_updated_at` | admin_users | update_updated_at_column | Auto-update timestamp | **DUPLICATE** |
| `update_categories_updated_at` | categories | update_updated_at_column | Auto-update timestamp | **DUPLICATE** |
| `update_products_updated_at` | products | update_updated_at_column | Auto-update timestamp | **DUPLICATE** |
| `update_orders_updated_at` | orders | update_updated_at_column | Auto-update timestamp | **DUPLICATE** |
| `update_cart_updated_at` | cart | update_updated_at_column | Auto-update timestamp | **DUPLICATE** |
| `update_reviews_updated_at` | reviews | update_updated_at_column | Auto-update timestamp | **DUPLICATE** |
| `update_payments_updated_at` | payments | update_updated_at_column | Auto-update timestamp | **DUPLICATE** |
| `update_profiles_updated_at` | profiles | update_updated_at_column | Auto-update timestamp | **DUPLICATE** |
| `on_auth_user_created` | auth.users | sync_user_profile | Create profile on user signup | OK |
| `trigger_update_customer_on_order` | orders | update_customer_on_order | Update customer metrics on order | OK |
| `audit_profiles_changes` | profiles | audit_admin_changes | Audit profile changes | OK |
| `audit_orders_changes` | orders | audit_admin_changes | Audit order changes | OK |
| `trigger_update_refund_requests_updated_at` | refund_requests | update_refund_requests_updated_at | Auto-update timestamp | OK |

### Trigger Issues

1. **Duplicate Triggers:** Multiple triggers with same purpose defined in different migrations
2. **Naming Inconsistency:** Some use `update_`, others use `trigger_update_`
3. **Missing Triggers:** Some tables lack updated_at triggers (CRM tables)

---

## RLS Policy Analysis

### Current RLS Policies

**CRITICAL SECURITY ISSUE:** UUID comparison bug in `002_supabase_rls_policies.sql`

```sql
-- INCORRECT (26 occurrences):
auth.uid()::text = id::text

-- CORRECT:
auth.uid() = id
```

### Policy Coverage by Table

| Table | RLS Enabled | Policies | Issues |
|-------|-------------|----------|--------|
| users | Yes | 5 policies | UUID bug, references non-existent admin_users |
| admin_users | Yes | 1 policy | References users table |
| categories | Yes | 2 policies | UUID bug, overly permissive public access |
| products | Yes | 2 policies | UUID bug, overly permissive public access |
| orders | Yes | 4 policies | UUID bug, references customer_id (renamed) |
| order_items | Yes | 3 policies | UUID bug |
| cart | Yes | 3 policies | UUID bug, references customer_id |
| reviews | Yes | 5 policies | UUID bug, references customer_id |
| inventory_logs | Yes | 2 policies | UUID bug |
| payments | Yes | 3 policies | UUID bug |
| profiles | Yes | 5 policies | OK (from 003_supabase_auth_migration) |
| customer_profiles | Yes | 3 policies | References users table (should be profiles) |
| customer_notes | Yes | 2 policies | OK |
| customer_tags | Yes | 2 policies | OK |
| customer_tag_map | Yes | 2 policies | OK |
| customer_segments | Yes | 2 policies | OK |
| customer_segment_rules | Yes | 2 policies | OK |
| customer_segment_memberships | Yes | 2 policies | OK |
| email_templates | Yes | 2 policies | OK |
| email_logs | Yes | 2 policies | OK |
| email_campaigns | Yes | 2 policies | OK |
| email_campaign_recipients | Yes | 2 policies | OK |
| crm_automations | Yes | 2 policies | OK |
| crm_automation_logs | Yes | 2 policies | OK |
| admin_audit_log | Yes | 2 policies | OK |

### RLS Policy Issues

1. **UUID Comparison Bug:** 26 policies use incorrect `::text` cast
2. **Table Reference Conflicts:** Policies reference both `users` and `profiles`
3. **Overly Permissive:** Some policies use `USING (true)` for public access
4. **Missing Policies:** Some tables may lack necessary policies
5. **Circular Dependencies:** `is_admin()` function queries tables with RLS

---

## View Analysis

### Current Views

| View | Purpose | Tables | Issues |
|------|---------|--------|--------|
| `users_with_profile` | Combined user data | auth.users, profiles | OK |
| `user_orders` | User orders with profile info | orders, profiles | OK |
| `customer_analytics` | Customer analytics | customer_profiles, users, segments, tags | OK |
| `secure_customer_analytics` | Secure customer analytics | customer_profiles, users, segments, tags | OK |
| `payment_analytics` | Payment analytics | orders | OK |

### View Issues

1. **Table References:** Some views reference `users` table (should be `profiles`)
2. **RLS on Views:** Some views lack security_barrier

---

## Supabase Auth Integration

### Current State

- **auth.users:** Supabase system table for authentication
- **profiles:** Custom table extending auth.users (created in 003_supabase_auth_migration.sql)
- **users:** Legacy custom user table (conflicts with profiles)

### Integration Issues

1. **Dual User Tables:** Both `users` and `profiles` exist, causing confusion
2. **Sync Triggers:** `on_auth_user_created` trigger syncs auth.users to profiles
3. **Legacy Data:** `users` table may contain legacy data that needs migration
4. **RLS Conflicts:** Policies reference both tables inconsistently

---

## Migration Dependency Graph

### Migration Execution Order Issues

Current numbering is non-sequential and confusing:

```
001_initial_schema.sql (MySQL - OBSOLETE)
001_initial_schema_postgresql.sql (PostgreSQL - ACTIVE)
002_add_indexes.sql (DUPLICATE)
002_supabase_rls_policies.sql (ACTIVE)
003_add_password_reset_columns.sql (OBSOLETE)
003_add_slug_indexes.sql (ACTIVE)
003_create_super_admin.sql (OBSOLETE)
003_create_super_admin_postgresql.sql (ACTIVE)
003_supabase_auth_migration.sql (ACTIVE)
004_crm_schema.sql (ACTIVE)
004_remove_legacy_auth_columns.sql (ACTIVE)
005_add_payment_provider_and_currency.sql (ACTIVE)
005_crm_rls_policies.sql (ACTIVE)
005_setup_rls_policies.sql (ACTIVE)
006_create_customer_profiles.sql (DUPLICATE)
006_create_customer_profiles_compatible.sql (DUPLICATE)
007_add_videos_column.sql (ACTIVE)
008_update_orders_schema.sql (ACTIVE)
```

### Correct Execution Order

```
1. 001_initial_schema_postgresql.sql (base schema)
2. 003_supabase_auth_migration.sql (auth integration)
3. 004_crm_schema.sql (CRM tables)
4. 002_supabase_rls_policies.sql (base RLS)
5. 005_setup_rls_policies.sql (additional RLS)
6. 005_crm_rls_policies.sql (CRM RLS)
7. 003_add_slug_indexes.sql (performance)
8. 005_add_payment_provider_and_currency.sql (payment fields)
9. 007_add_videos_column.sql (product videos)
10. 008_update_orders_schema.sql (schema updates)
11. 003_create_super_admin_postgresql.sql (admin user - manual step)
```

---

## Breaking Changes Identified

### Critical Breaking Changes

1. **Column Renames (008_update_orders_schema.sql):**
   - `customer_id` → `user_id`
   - `email` → `guest_email`
   - `total_amount` → `total`
   - `unit_price` → `price`
   - `total_price` → `total`
   - `payment_method` → `provider`
   - `payment_intent_id` → `provider_id`

2. **Table Structure Changes:**
   - Migration from `users` to `profiles` for user data
   - Migration from INTEGER to UUID primary keys

3. **Foreign Key Changes:**
   - All `customer_id` references to become `user_id`
   - References to `users` table to become `profiles`

### Data Migration Requirements

1. **User Data Migration:**
   - Migrate data from `users` table to `profiles` table
   - Update all foreign key references
   - Handle auth.users integration

2. **Order Data Migration:**
   - Update column names in orders table
   - Update foreign key references in order_items
   - Update payment data

3. **CRM Data Migration:**
   - Ensure customer_profiles references correct user table
   - Update all CRM foreign keys

### Backward Compatibility Risks

1. **Application Code:** All queries using old column names will break
2. **API Endpoints:** API responses may change
3. **Frontend:** Frontend may expect old field names
4. **Third-party Integrations:** External systems may break

### Security Risks

1. **RLS UUID Bug:** Policies may fail or allow unauthorized access
2. **Hardcoded Password:** Admin password hardcoded in migration
3. **Public Access:** Overly permissive policies may expose data
4. **Missing RLS:** Some tables may lack proper policies

---

## Dependency Graph

### Table Dependencies

```
auth.users (Supabase system)
    ↓
profiles (extends auth.users)
    ↓
    ├── admin_users
    ├── orders
    │   └── order_items
    ├── cart
    ├── reviews
    ├── customer_profiles
    │   ├── customer_notes
    │   ├── customer_tag_map
    │   │   └── customer_tags
    │   └── customer_segment_memberships
    │       └── customer_segments
    │           └── customer_segment_rules
    ├── email_logs
    │   └── email_templates
    ├── email_campaign_recipients
    │   └── email_campaigns
    │       └── email_templates
    │       └── customer_segments
    └── crm_automation_logs
        └── crm_automations

categories (self-referencing via parent_id)
    ↓
products
    ↓
    ├── order_items
    ├── cart
    ├── reviews
    └── inventory_logs

orders
    ↓
    ├── order_items
    ├── payments
    ├── inventory_logs
    └── refund_requests
```

### Function Dependencies

```
update_updated_at_column()
    ↓
    ├── All updated_at triggers

is_admin(user_id)
    ↓
    ├── RLS policies (multiple tables)
    ├── owns_resource()
    ├── audit_admin_changes()
    └── validate_crm_permission()

sync_user_profile()
    ↓
    ├── on_auth_user_created trigger

update_customer_metrics(customer_uuid)
    ↓
    ├── update_customer_on_order() trigger
    └── update_customer_metrics_secure()

update_dynamic_segments()
    ↓
    (manual execution or scheduled job)
```

### Migration Dependencies

```
001_initial_schema_postgresql.sql
    ↓
003_supabase_auth_migration.sql (requires auth.users)
    ↓
004_crm_schema.sql (requires users table)
    ↓
002_supabase_rls_policies.sql (requires tables)
005_setup_rls_policies.sql (requires profiles)
005_crm_rls_policies.sql (requires CRM tables)
    ↓
003_add_slug_indexes.sql (requires products, categories)
005_add_payment_provider_and_currency.sql (requires orders)
007_add_videos_column.sql (requires products)
008_update_orders_schema.sql (requires orders)
```

---

## Summary of Issues

### Critical Issues (Must Fix Before Production)

1. **UUID Comparison Bug in RLS:** 26 policies have security vulnerability
2. **Schema Conflicts:** MySQL vs PostgreSQL, users vs profiles
3. **Duplicate Migrations:** Multiple files with same purpose
4. **Foreign Key Inconsistencies:** Mixed references, type mismatches
5. **Hardcoded Password:** Security risk in super admin creation

### High Priority Issues

1. **Missing Migration Tracking:** migration_log table doesn't exist
2. **Column Renames:** Breaking changes in 008_update_orders_schema.sql
3. **Duplicate Functions:** Multiple definitions of same functions
4. **Overly Permissive RLS:** Public access policies need review
5. **Missing Indexes:** Performance issues

### Medium Priority Issues

1. **Naming Inconsistencies:** Tables, columns, constraints
2. **Missing CHECK Constraints:** Data validation
3. **Missing UNIQUE Constraints:** Data integrity
4. **Soft Delete Inconsistency:** Mixed patterns
5. **Unused Objects:** Backup tables, deprecated columns

---

## Next Steps

Proceed to Phase 2: Critical Security Fixes
