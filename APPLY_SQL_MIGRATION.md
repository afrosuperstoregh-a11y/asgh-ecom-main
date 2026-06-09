# Apply SQL Migration to Fix RLS Infinite Recursion

## Instructions

### Step 1: Open Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** (in the left sidebar)

### Step 2: Apply the Migration

1. Open the file `database/fix_recursive_rls_policies.sql` in your code editor
2. Copy the entire contents of the file
3. Paste it into the Supabase SQL Editor
4. Click **Run** to execute the migration

### Step 3: Verify Success

After running the migration, you should see:
- ✅ No errors in the output
- ✅ Success message indicating policies were dropped and recreated
- ✅ The `is_admin_user()` function was created

### Step 4: Test the Fix

#### Test Categories Endpoint
```bash
curl "https://YOUR_PROJECT.supabase.co/rest/v1/categories?select=*&is_active=eq.true&order=sort_order.asc"
```
Expected: 200 OK with categories data (no 500 error)

#### Test Products Endpoint
```bash
curl "https://YOUR_PROJECT.supabase.co/rest/v1/products?select=*,categories(id,name,slug)&limit=200&order=created_at.desc"
```
Expected: 200 OK with products data (no 500 error)

#### Test Frontend
1. Open your frontend application
2. Navigate to the shop page
3. Verify products load correctly
4. Verify categories load correctly
5. Check browser console - should see no infinite recursion errors

### Step 5: Run Verification Script (Optional)

If you have environment variables set up locally:

```bash
# Set environment variables
export SUPABASE_URL=https://YOUR_PROJECT.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Run verification
cd scripts
node verify-rls-policies.cjs
```

Expected: No recursive policies found

## What the Migration Does

1. **Creates SECURITY DEFINER function** `public.is_admin_user()` to safely check admin status
2. **Drops recursive policies** on 14 tables (admin_users, profiles, categories, products, etc.)
3. **Recreates safe policies** using the `is_admin_user()` function
4. **Fixes storage bucket policies** to use the safe function
5. **Adds verification query** to check for remaining recursive policies

## Troubleshooting

### Migration Fails to Apply

**Error**: "relation does not exist"
- **Solution**: Some tables may not exist in your database. The migration uses `IF EXISTS` clauses, so it should skip missing tables.

**Error**: "permission denied"
- **Solution**: Ensure you're logged in as a user with sufficient permissions (preferably the database owner or service role).

### Still Getting 500 Errors

**Check**: Did the migration actually run successfully?
- Look for any error messages in the SQL Editor output
- Verify the `is_admin_user()` function exists:
  ```sql
  SELECT routine_name, routine_type 
  FROM information_schema.routines 
  WHERE routine_name = 'is_admin_user';
  ```

**Check**: Are you using the correct Supabase project?
- Verify the project URL in your environment variables matches the project where you applied the migration

### Images Still Not Loading

**Check**: Storage bucket configuration
- Verify `product-images` bucket exists and is public
- Verify `category-images` bucket exists and is public
- Check bucket policies allow public read access

**Check**: Image paths in database
- Verify image paths are correct
- Check for malformed URLs

## Rollback (If Needed)

If you need to rollback the changes:

```sql
-- Drop the is_admin_user function
DROP FUNCTION IF EXISTS public.is_admin_user();

-- You'll need to manually re-apply your original policies
-- from your backup or original migration files
```

Or use Supabase's point-in-time recovery to restore the database to a state before the migration.

## Support

If you encounter issues:
1. Check the SQL Editor output for specific error messages
2. Review the `COMPLETE_FIX_DELIVERABLES.md` for detailed troubleshooting
3. Review the `RLS_RECURSION_FIX_REPORT.md` for technical details
