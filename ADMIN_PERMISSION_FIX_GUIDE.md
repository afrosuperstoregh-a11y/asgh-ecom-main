# Admin Permission Fix - Complete Solution

## Problem
Admin panel shows "permission denied for table products" when trying to create/update products. This is because:

1. **Authentication Mismatch**: Admin APIs use custom token validation but create Supabase client with anon key
2. **RLS Policies**: Row Level Security expects `auth.uid()` (real Supabase user) but admin system uses custom tokens
3. **Permission Denied**: Supabase denies operations because no authenticated user context exists

## Solution Strategy
Use **Service Role Key** for admin API operations to bypass RLS restrictions while maintaining custom token authentication for authorization.

## Files to Modify

### 1. SQL Fix (Run First)
Execute this in Supabase SQL Editor:

```sql
-- File: database/fix_admin_rls.sql
-- Fix Admin RLS Permission Issue

-- Disable RLS temporarily
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Public can view products" ON products;
DROP POLICY IF EXISTS "Admins can manage products" ON products;
DROP POLICY IF EXISTS "Public can view categories" ON categories;
DROP POLICY IF EXISTS "Admins can manage categories" ON categories;

-- Create public read policies
CREATE POLICY "Enable read access for all products" ON products
    FOR SELECT USING (true);

CREATE POLICY "Enable read access for all categories" ON categories
    FOR SELECT USING (true);

-- Block public modifications (service role bypasses these)
CREATE POLICY "Public cannot modify products" ON products
    FOR INSERT WITH CHECK (false);
    
CREATE POLICY "Public cannot update products" ON products
    FOR UPDATE USING (false);
    
CREATE POLICY "Public cannot delete products" ON products
    FOR DELETE USING (false);

CREATE POLICY "Public cannot modify categories" ON categories
    FOR INSERT WITH CHECK (false);
    
CREATE POLICY "Public cannot update categories" ON categories
    FOR UPDATE USING (false);
    
CREATE POLICY "Public cannot delete categories" ON categories
    FOR DELETE USING (false);
```

### 2. Environment Variables
Ensure your `.env.local` has:
```env
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### 3. Admin API Routes Updated
Update these files to use service role key:

- ✅ `frontend/app/api/admin/products/route.ts` 
- ✅ `frontend/app/api/admin/categories/route.ts`
- ⏳ `frontend/app/api/admin/orders/route.ts`
- ⏳ `frontend/app/api/admin/customers/route.ts`
- ⏳ `frontend/app/api/admin/promotions/route.ts`

Change from:
```typescript
const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

To:
```typescript
const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
```

## Implementation Steps

### Step 1: Run SQL Fix
1. Go to Supabase Dashboard → SQL Editor
2. Copy and paste the SQL from `database/fix_admin_rls.sql`
3. Execute the script

### Step 2: Update Environment
1. Get service role key from Supabase Dashboard → Settings → API
2. Add `SUPABASE_SERVICE_ROLE_KEY` to your `.env.local`

### Step 3: Update API Routes
1. Update all admin API routes to use service role key
2. Keep the custom token validation for authorization
3. Service role bypasses RLS, token validation handles security

### Step 4: Test
1. Restart development server
2. Try creating a product in admin panel
3. Should work without permission errors

## Security Notes
- **Service Role Key**: Has full database access, never expose to frontend
- **Custom Token Auth**: Still validates admin permissions before API calls
- **RLS Policies**: Still protect public access, only admin APIs bypass them
- **Audit Logging**: Consider adding audit logs for admin operations

## Files Created/Modified
- ✅ `database/fix_admin_rls.sql` - SQL fix script
- ✅ `frontend/app/api/admin/products/route.ts` - Updated to service role
- ✅ `frontend/app/api/admin/categories/route.ts` - Updated to service role
- ⏳ Other admin API routes need similar updates
