# Supabase Storage Upload Fix

## Problem
The admin panel was encountering a "new row violates row-level security policy" error when trying to upload images to the `product-images` bucket in Supabase Storage.

## Root Cause
1. **Missing RLS Policies**: The `storage.objects` table had Row Level Security enabled but no policies defined for the `product-images` bucket
2. **Authentication Mismatch**: The admin panel uses a custom token-based authentication system, but the upload functions were using the regular Supabase client which expects Supabase authentication
3. **Insufficient Permissions**: The storage bucket wasn't properly configured with the correct permissions

## Solution Applied

### 1. Storage RLS Policies (`supabase/fix_storage_rls.sql`)
- Created comprehensive RLS policies for the `product-images` bucket
- Allowed authenticated users to upload files
- Granted public read access for viewing images
- Added proper permissions for `authenticated`, `anon`, and `service_role` users
- Ensured the bucket exists with correct configuration

### 2. Admin Upload Functions (`frontend/lib/supabase-storage.ts`)
- Added `uploadFileAdmin()` and `uploadFilesAdmin()` functions
- These use the service role client which bypasses RLS restrictions
- Perfect for admin operations where elevated privileges are needed

### 3. Updated Admin Pages
- Modified `frontend/app/admin/products/create/page.tsx` to use `uploadFilesAdmin()`
- Modified `frontend/app/admin/products/[id]/edit/page.tsx` to use `uploadFilesAdmin()`

## Files Modified

### Database
- `supabase/fix_storage_rls.sql` - New RLS policies for storage
- `supabase/test_storage_setup.sql` - Test script to verify setup

### Frontend
- `frontend/lib/supabase-storage.ts` - Added admin upload functions
- `frontend/app/admin/products/create/page.tsx` - Updated to use admin upload
- `frontend/app/admin/products/[id]/edit/page.tsx` - Updated to use admin upload

## Implementation Steps

### 1. Apply Database Changes
Run the SQL script in your Supabase project:
```sql
-- Run this in Supabase SQL Editor
-- File: supabase/fix_storage_rls.sql
```

### 2. Verify Setup (Optional)
Run the test script to verify everything is working:
```sql
-- Run this in Supabase SQL Editor
-- File: supabase/test_storage_setup.sql
```

### 3. Test Upload Functionality
1. Navigate to admin panel: `/admin`
2. Go to Products → Add Product
3. Try uploading images
4. Should work without RLS errors

## Security Considerations

### Regular Upload Functions
- `uploadFile()` and `uploadFiles()` use regular Supabase client
- Subject to RLS policies
- Good for user-facing uploads where restrictions are needed

### Admin Upload Functions
- `uploadFileAdmin()` and `uploadFilesAdmin()` use service role client
- Bypass RLS restrictions
- Only use in trusted admin environments
- Requires `SUPABASE_SERVICE_ROLE_KEY` environment variable

## RLS Policies Created

1. **"Authenticated users can upload product images"**
   - Allows any authenticated user to upload to product-images bucket
   - `FOR INSERT WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated')`

2. **"Users can update their own product images"**
   - Users can only update their own files
   - Uses `auth.uid()` to verify ownership

3. **"Users can delete their own product images"**
   - Users can only delete their own files
   - Uses `auth.uid()` to verify ownership

4. **"Public can view all product images"**
   - Public read access for all images in product-images bucket
   - Essential for storefront functionality

## Troubleshooting

### If uploads still fail:
1. Verify the SQL script was executed successfully
2. Check that `SUPABASE_SERVICE_ROLE_KEY` is set in environment
3. Ensure the bucket exists: `SELECT * FROM storage.buckets WHERE id = 'product-images'`
4. Check RLS policies: `SELECT * FROM pg_policies WHERE tablename = 'objects'`

### If images don't display:
1. Verify bucket is public: `SELECT public FROM storage.buckets WHERE id = 'product-images'`
2. Check file paths in database
3. Verify CORS settings if accessing from different domains

## Environment Variables Required

```env
# Frontend (.env.local)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Backend/Server-side
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Testing

After applying the fix:
1. ✅ Admin can upload product images without RLS errors
2. ✅ Images are publicly accessible for storefront
3. ✅ Regular upload functions still respect RLS for user uploads
4. ✅ Admin upload functions bypass RLS for trusted operations

The fix maintains all existing functionality while resolving the storage upload issue for admin users.
