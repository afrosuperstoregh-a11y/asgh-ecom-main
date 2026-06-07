# Next Steps Guide - Supabase Setup

**Status:** Supabase CLI not detected in current environment

---

## Option 1: Install Supabase CLI (Recommended for Local Development)

### Windows Installation

```powershell
# Using npm (recommended)
npm install -g supabase

# Or using winget
winget install Supabase.SupabaseCLI

# Or download from GitHub
# https://github.com/supabase/cli/releases
```

### Verify Installation

```bash
supabase --version
```

### After Installation

```bash
# From project root
supabase start                    # Start local Supabase instance
supabase db reset                 # Apply migrations
supabase migration list           # Verify migrations
```

---

## Option 2: Use Supabase Dashboard (No CLI Required)

If you prefer not to install the CLI, you can set up everything via the Supabase Dashboard:

### Step 1: Create Supabase Project

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Enter project name and database password
4. Wait for project to be created (~2 minutes)

### Step 2: Get Project Credentials

1. Go to Project Settings → API
2. Copy:
   - Project URL (SUPABASE_URL)
   - anon/public key (SUPABASE_ANON_KEY)
   - service_role key (SUPABASE_SERVICE_ROLE_KEY)

### Step 3: Run Migrations via SQL Editor

1. Go to SQL Editor in Supabase Dashboard
2. Execute migrations in order:

```sql
-- Copy and paste the contents of each migration file:

-- 1. 001_initial_schema.sql
-- (Open supabase/migrations/001_initial_schema.sql and paste entire contents)

-- 2. 002_add_indexes.sql
-- (Open supabase/migrations/002_add_indexes.sql and paste entire contents)

-- 3. 003_add_password_reset_columns.sql
-- (Open supabase/migrations/003_add_password_reset_columns.sql and paste entire contents)

-- 4. 004_remove_legacy_auth_columns.sql
-- (Open supabase/migrations/004_remove_legacy_auth_columns.sql and paste entire contents)

-- 5. 007_add_videos_column.sql
-- (Open supabase/migrations/007_add_videos_column.sql and paste entire contents)

-- 6. 008_update_orders_schema.sql
-- (Open supabase/migrations/008_update_orders_schema.sql and paste entire contents)
```

### Step 4: Create Storage Buckets

1. Go to Storage in Supabase Dashboard
2. Create each bucket:

**Products Bucket:**
- Name: `products`
- Public: ✅ Yes
- File size limit: 5242880 (5MB)
- Allowed MIME types: `image/*`

**Product-Images Bucket:**
- Name: `product-images`
- Public: ✅ Yes
- File size limit: 5242880 (5MB)
- Allowed MIME types: `image/*`

**Category-Images Bucket:**
- Name: `category-images`
- Public: ✅ Yes
- File size limit: 2097152 (2MB)
- Allowed MIME types: `image/*`

**User-Avatars Bucket:**
- Name: `user-avatars`
- Public: ✅ Yes
- File size limit: 1048576 (1MB)
- Allowed MIME types: `image/*`

### Step 5: Apply Storage Policies

1. Go to SQL Editor
2. Execute `supabase/migrations/009_setup_storage_buckets.sql`

### Step 6: Configure Local Environment

Create `.env.local` in project root:

```env
# Backend
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

---

## Option 3: Test Backend Scripts (Can Run Without CLI)

The storage bucket creation script can run against a remote Supabase project:

```bash
# Set environment variables first
$env:SUPABASE_URL="https://your-project.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"

# Run the script
node scripts/create-storage-buckets.js
```

---

## Verification Steps

### After Setup, Verify:

1. **Check Tables Created**
   - Go to Supabase Dashboard → Table Editor
   - Verify tables exist: profiles, categories, products, orders, etc.

2. **Check RLS Policies**
   - Go to Authentication → Policies
   - Verify policies are enabled on all tables

3. **Check Triggers**
   - Go to SQL Editor
   - Run: `SELECT * FROM pg_trigger WHERE tgname LIKE '%auth%';`
   - Verify `on_auth_user_created` trigger exists

4. **Check Storage Buckets**
   - Go to Storage
   - Verify all 4 buckets exist and are public

5. **Test User Signup**
   - Start frontend application
   - Try to sign up a new user
   - Check if profile created automatically in profiles table

---

## Quick Start (Recommended Path)

```bash
# 1. Install Supabase CLI
npm install -g supabase

# 2. Start local Supabase
supabase start

# 3. Apply migrations
supabase db reset

# 4. Create storage buckets
node scripts/create-storage-buckets.js

# 5. Apply storage policies
supabase db push

# 6. Start applications
npm run dev
```

---

## Troubleshooting

### CLI Not Found After Installation

```bash
# Restart terminal after installation
# Or add to PATH manually
```

### Migration Errors in SQL Editor

- Ensure you execute migrations in the correct order
- Check for syntax errors in pasted SQL
- Verify previous migrations completed successfully

### Storage Bucket Creation Fails

- Ensure you have service role key (not anon key)
- Check bucket name doesn't already exist
- Verify file size limits are valid numbers

### Environment Variables Not Loading

- Restart application after changing .env files
- Verify .env files are in correct directories
- Check variable names match exactly (case-sensitive)

---

## Production Deployment

When ready for production:

1. **Update Railway Environment Variables**
   - Set SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

2. **Update Vercel Environment Variables**
   - Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY

3. **Apply Migrations to Production**
   - Use Supabase Dashboard SQL Editor
   - Or use CLI: `supabase db push --remote`

4. **Create Production Storage Buckets**
   - Use dashboard or script with production credentials

5. **Deploy Applications**
   - Push to GitHub (Railway and Vercel auto-deploy)

---

## Support

- **Supabase CLI Docs:** https://supabase.com/docs/guides/cli
- **Supabase Dashboard:** https://supabase.com/dashboard
- **Storage Guide:** See STORAGE_SETUP_GUIDE.md
- **Deployment Checklist:** See DEPLOYMENT_CHECKLIST.md
