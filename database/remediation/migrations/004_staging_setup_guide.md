# Staging Environment Setup Guide

**Purpose:** Prepare staging environment for testing 004_migrate_existing_data.sql migration  
**Setup Date:** [DATE]  
**Setup By:** [NAME]

---

## Prerequisites

### Required Access
- [ ] Access to staging database server
- [ ] Database administrator credentials
- [ ] Access to staging application environment
- [ ] Access to Git repository with migration files
- [ ] psql or similar SQL client tool

### Required Software
- [ ] PostgreSQL client (psql) version 14+
- [ ] Git client
- [ ] Text editor or IDE
- [ ] Database monitoring tool (optional but recommended)

---

## Step 1: Database Preparation

### 1.1 Create Staging Database

If staging database doesn't exist:

```bash
# Connect to PostgreSQL server
psql -h staging-host -U postgres

# Create staging database
CREATE DATABASE staging_ecommerce;
CREATE USER staging_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE staging_ecommerce TO staging_user;
```

### 1.2 Verify Database Connection

```bash
# Test connection
psql -h staging-host -U staging_user -d staging_ecommerce

# Should show: staging_ecommerce=#
```

### 1.3 Enable Required Extensions

```sql
-- Connect to staging database
\c staging_ecommerce

-- Enable extensions (if using Supabase, these are pre-enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

---

## Step 2: Apply Canonical Schema

### 2.1 Run Previous Migrations

The migration 004 depends on canonical schema being applied first.

```bash
# From migrations directory
cd database/remediation/migrations

# Run canonical schema migration
psql -h staging-host -U staging_user -d staging_ecommerce -f 002_create_canonical_schema.sql

# Run RLS policies migration
psql -h staging-host -U staging_user -d staging_ecommerce -f 003_apply_canonical_rls_policies.sql
```

### 2.2 Verify Schema Applied

```sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Expected tables:
-- - profiles
-- - admin_users
-- - categories
-- - products
-- - orders
-- - order_items
-- - cart
-- - reviews
-- - inventory_logs
-- - payments
-- - refund_requests
-- - customer_profiles (optional)
```

---

## Step 3: Prepare Legacy Data

### 3.1 Create Legacy Users Table (if testing user migration)

```sql
-- Create legacy users table to simulate old schema
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    role TEXT DEFAULT 'customer',
    email_verified BOOLEAN DEFAULT false,
    auth_user_id UUID,  -- References auth.users if using Supabase
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_auth_user_id ON users(auth_user_id);
```

### 3.2 Create Legacy Orders Schema (if testing column migration)

```sql
-- Add old columns to orders table to simulate old schema
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_id UUID;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10,2);

-- Populate with test data if columns are empty
UPDATE orders 
SET customer_id = user_id 
WHERE customer_id IS NULL AND user_id IS NOT NULL;

UPDATE orders 
SET email = guest_email 
WHERE email IS NULL AND guest_email IS NOT NULL;

UPDATE orders 
SET total_amount = total 
WHERE total_amount IS NULL AND total IS NOT NULL;
```

### 3.3 Create Legacy Order Items Schema

```sql
-- Add old columns to order_items table
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS unit_price DECIMAL(10,2);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS total_price DECIMAL(10,2);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_name VARCHAR(255);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_sku VARCHAR(100);

-- Populate with test data
UPDATE order_items 
SET unit_price = price 
WHERE unit_price IS NULL AND price IS NOT NULL;

UPDATE order_items 
SET total_price = total 
WHERE total_price IS NULL AND total IS NOT NULL;

UPDATE order_items 
SET product_name = (SELECT name FROM products WHERE products.id = order_items.product_id)
WHERE product_name IS NULL;

UPDATE order_items 
SET product_sku = (SELECT sku FROM products WHERE products.id = order_items.product_id)
WHERE product_sku IS NULL;
```

### 3.4 Create Legacy Payments Schema

```sql
-- Add old columns to payments table
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_intent_id TEXT;

-- Populate with test data
UPDATE payments 
SET payment_method = provider 
WHERE payment_method IS NULL AND provider IS NOT NULL;

UPDATE payments 
SET payment_intent_id = provider_id 
WHERE payment_intent_id IS NULL AND provider_id IS NOT NULL;
```

### 3.5 Create Legacy Cart Schema

```sql
-- Add old column to cart table
ALTER TABLE cart ADD COLUMN IF NOT EXISTS customer_id UUID;

-- Populate with test data
UPDATE cart 
SET customer_id = user_id 
WHERE customer_id IS NULL AND user_id IS NOT NULL;
```

### 3.6 Create Legacy Reviews Schema

```sql
-- Add old column to reviews table
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS customer_id UUID;

-- Populate with test data
UPDATE reviews 
SET customer_id = user_id 
WHERE customer_id IS NULL AND user_id IS NOT NULL;
```

### 3.7 Create Legacy Inventory Logs Schema

```sql
-- Ensure created_by references users instead of profiles (for testing)
-- This simulates old schema where created_by referenced users.id
-- Note: This is only for testing the migration logic
```

---

## Step 4: Load Test Data

### 4.1 Insert Test Users

```sql
-- Insert test users into legacy users table
INSERT INTO users (email, first_name, last_name, phone, role, email_verified, auth_user_id) VALUES
('test.user1@example.com', 'John', 'Doe', '+1234567890', 'customer', true, NULL),
('test.user2@example.com', 'Jane', 'Smith', '+1234567891', 'customer', true, NULL),
('admin@example.com', 'Admin', 'User', '+1234567892', 'admin', true, NULL)
ON CONFLICT (email) DO NOTHING;
```

### 4.2 Insert Test Orders

```sql
-- Ensure orders have customer_id set (for testing migration)
UPDATE orders 
SET customer_id = (SELECT id FROM users LIMIT 1)
WHERE customer_id IS NULL AND user_id IS NOT NULL;
```

### 4.3 Verify Test Data

```sql
-- Check user counts
SELECT 'users' as table_name, COUNT(*) as row_count FROM users
UNION ALL
SELECT 'profiles', COUNT(*) FROM profiles
UNION ALL
SELECT 'orders', COUNT(*) FROM orders
UNION ALL
SELECT 'order_items', COUNT(*) FROM order_items
UNION ALL
SELECT 'payments', COUNT(*) FROM payments;

-- Check for old columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('orders', 'order_items', 'payments', 'cart', 'reviews')
AND column_name IN ('customer_id', 'email', 'total_amount', 'unit_price', 'total_price', 'payment_method', 'payment_intent_id')
ORDER BY table_name, column_name;
```

---

## Step 5: Configure Supabase Auth (if applicable)

### 5.1 Enable Auth Schema

If using Supabase, auth schema should already exist. Verify:

```sql
-- Check auth schema exists
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name = 'auth';

-- Check auth.users exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'auth' 
AND table_name = 'users';
```

### 5.2 Create Test Auth Users

```sql
-- Insert test auth users (if auth schema exists)
INSERT INTO auth.users (id, email, email_confirmed_at, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'auth.user1@example.com', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440001', 'auth.user2@example.com', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Update legacy users to reference auth users
UPDATE users 
SET auth_user_id = '550e8400-e29b-41d4-a716-446655440000'
WHERE email = 'test.user1@example.com';

UPDATE users 
SET auth_user_id = '550e8400-e29b-41d4-a716-446655440001'
WHERE email = 'test.user2@example.com';
```

---

## Step 6: Pre-Migration Validation

### 6.1 Document Current State

```sql
-- Save current row counts
CREATE TABLE IF NOT EXISTS pre_migration_snapshot (
    table_name TEXT PRIMARY KEY,
    row_count INTEGER,
    snapshot_time TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO pre_migration_snapshot (table_name, row_count)
SELECT 'users', COUNT(*) FROM users
ON CONFLICT (table_name) DO UPDATE SET row_count = EXCLUDED.row_count, snapshot_time = NOW();

INSERT INTO pre_migration_snapshot (table_name, row_count)
SELECT 'profiles', COUNT(*) FROM profiles
ON CONFLICT (table_name) DO UPDATE SET row_count = EXCLUDED.row_count, snapshot_time = NOW();

INSERT INTO pre_migration_snapshot (table_name, row_count)
SELECT 'orders', COUNT(*) FROM orders
ON CONFLICT (table_name) DO UPDATE SET row_count = EXCLUDED.row_count, snapshot_time = NOW();

INSERT INTO pre_migration_snapshot (table_name, row_count)
SELECT 'order_items', COUNT(*) FROM order_items
ON CONFLICT (table_name) DO UPDATE SET row_count = EXCLUDED.row_count, snapshot_time = NOW();

-- View snapshot
SELECT * FROM pre_migration_snapshot ORDER BY table_name;
```

### 6.2 Check for Orphaned Records

```sql
-- Check for existing orphaned records before migration
SELECT 'orders with invalid customer_id' as check_name, COUNT(*) as count
FROM orders 
WHERE customer_id IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM users WHERE users.id = orders.customer_id)

UNION ALL

SELECT 'order_items with invalid order_id', COUNT(*)
FROM order_items 
WHERE NOT EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id)

UNION ALL

SELECT 'cart with invalid customer_id', COUNT(*)
FROM cart 
WHERE customer_id IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM users WHERE users.id = cart.customer_id);
```

---

## Step 7: Backup Staging Database

### 7.1 Create Database Backup

```bash
# Create backup
pg_dump -h staging-host -U staging_user -d staging_ecommerce -f staging_backup_before_migration.sql

# Or create compressed backup
pg_dump -h staging-host -U staging_user -d staging_ecommerce | gzip > staging_backup_before_migration.sql.gz
```

### 7.2 Verify Backup

```bash
# Check backup file exists
ls -lh staging_backup_before_migration.sql*

# Verify backup can be restored (test restore to different database)
createdb test_restore
pg_dump -h staging-host -U staging_user -d staging_ecommerce | psql -h staging-host -U staging_user -d test_restore
dropdb test_restore
```

---

## Step 8: Configure Application

### 8.1 Update Application Configuration

Update staging application configuration to point to staging database:

```env
# Example .env.staging
DATABASE_URL=postgresql://staging_user:password@staging-host:5432/staging_ecommerce
SUPABASE_URL=https://your-staging-project.supabase.co
SUPABASE_ANON_KEY=your-staging-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-staging-service-role-key
```

### 8.2 Restart Application

```bash
# Restart staging application
# (specific commands depend on your deployment setup)
systemctl restart staging-app
# or
docker-compose -f docker-compose.staging.yml restart
```

### 8.3 Verify Application Connectivity

```bash
# Test application can connect to database
# Check application logs for connection errors
```

---

## Step 9: Document Setup

### 9.1 Record Environment Details

```
Staging Environment Details:
- Database Host: staging-host
- Database Port: 5432
- Database Name: staging_ecommerce
- Database User: staging_user
- Application URL: https://staging.example.com
- Setup Date: [DATE]
- Setup By: [NAME]
```

### 9.2 Save Configuration

Save all configuration files and connection strings in secure location.

---

## Step 10: Pre-Migration Checklist

Before running the migration, verify:

- [ ] Staging database created and accessible
- [ ] Canonical schema (002) applied successfully
- [ ] RLS policies (003) applied successfully
- [ ] Legacy users table exists (for testing)
- [ ] Old columns exist in orders, order_items, payments, cart, reviews
- [ ] Test data loaded
- [ ] Pre-migration snapshot created
- [ ] Database backup created and verified
- [ ] Application configured and connected
- [ ] Application can access database
- [ ] No orphaned records in test data (or documented)

---

## Troubleshooting

### Issue: Cannot connect to staging database

**Solution:**
- Verify database host is accessible
- Check firewall rules
- Verify credentials
- Test with psql directly

### Issue: Canonical schema migration fails

**Solution:**
- Verify extensions are enabled
- Check for conflicting table names
- Review migration logs for specific errors
- Ensure previous migrations completed

### Issue: Test data insertion fails

**Solution:**
- Verify foreign key constraints
- Check for duplicate data
- Review constraint violations
- Ensure required columns have data

### Issue: Application cannot connect after schema changes

**Solution:**
- Verify application configuration
- Check RLS policies
- Review application logs
- Test database connection with application credentials

---

## Next Steps

After staging environment is set up:

1. Execute staging test plan (004_staging_test_plan.md)
2. Run all 15 test cases
3. Document results
4. Address any issues found
5. Approve for production deployment

---

**Setup Guide Version:** 1.0  
**Last Updated:** 2025-06-07
