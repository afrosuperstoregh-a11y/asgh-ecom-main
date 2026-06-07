# Supabase Storage Setup Guide

**Last Updated:** June 7, 2026

---

## Overview

This guide explains how to set up Supabase Storage buckets for the AfroSuperStore e-commerce application.

---

## Required Buckets

| Bucket Name | Purpose | Public | File Size Limit | Allowed Types |
|-------------|---------|--------|-----------------|---------------|
| `products` | Main product images | Yes | 5MB | image/* |
| `product-images` | Additional product images/variants | Yes | 5MB | image/* |
| `category-images` | Category and collection images | Yes | 2MB | image/* |
| `user-avatars` | User profile avatars | Yes | 1MB | image/* |

---

## Setup Methods

### Method 1: Automated Script (Recommended)

Use the provided Node.js script to create buckets automatically:

```bash
# From project root
node scripts/create-storage-buckets.js
```

**Prerequisites:**
- Node.js installed
- `.env` file with `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`

**What the script does:**
1. Checks if buckets already exist
2. Creates missing buckets with correct configuration
3. Uploads placeholder images if available
4. Verifies bucket configuration

---

### Method 2: Supabase Dashboard (Manual)

1. Go to your Supabase project dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **New bucket**
4. Configure each bucket:

#### Products Bucket
- **Name:** `products`
- **Public bucket:** ✅ Yes
- **File size limit:** 5242880 (5MB)
- **Allowed MIME types:** `image/*`
- **Description:** Product images for the e-commerce store

#### Product-Images Bucket
- **Name:** `product-images`
- **Public bucket:** ✅ Yes
- **File size limit:** 5242880 (5MB)
- **Allowed MIME types:** `image/*`
- **Description:** Additional product images and variants

#### Category-Images Bucket
- **Name:** `category-images`
- **Public bucket:** ✅ Yes
- **File size limit:** 2097152 (2MB)
- **Allowed MIME types:** `image/*`
- **Description:** Category and collection images

#### User-Avatars Bucket
- **Name:** `user-avatars`
- **Public bucket:** ✅ Yes
- **File size limit:** 1048576 (1MB)
- **Allowed MIME types:** `image/*`
- **Description:** User profile avatar images

---

### Method 3: Supabase CLI

```bash
# Create products bucket
supabase storage create products --public --file-size-limit 5242880

# Create product-images bucket
supabase storage create product-images --public --file-size-limit 5242880

# Create category-images bucket
supabase storage create category-images --public --file-size-limit 2097152

# Create user-avatars bucket
supabase storage create user-avatars --public --file-size-limit 1048576
```

---

## Storage Policies

After creating buckets, apply the storage policies by running the migration:

```bash
supabase db push
```

Or manually execute the SQL in Supabase SQL Editor:
- File: `supabase/migrations/009_setup_storage_buckets.sql`

### Policy Summary

**Products Bucket:**
- Public can view (read-only)
- Admins can upload/update/delete
- Service role has full access

**Product-Images Bucket:**
- Public can view (read-only)
- Admins can upload/update/delete
- Service role has full access

**Category-Images Bucket:**
- Public can view (read-only)
- Admins can upload/update/delete
- Service role has full access

**User-Avatars Bucket:**
- Public can view (read-only)
- Users can upload/update/delete own avatars
- Admins can manage all avatars
- Service role has full access

---

## Placeholder Images

The application includes placeholder SVG images:
- `public/placeholder-product.svg`
- `public/placeholder-category.svg`
- `public/placeholder-avatar.svg`

These are automatically uploaded by the setup script if they exist.

---

## Verification

After setup, verify buckets are configured correctly:

### Using Script
```bash
node scripts/create-storage-buckets.js
```
The script will verify bucket configuration at the end.

### Using Dashboard
1. Go to Supabase Dashboard → Storage
2. Verify all 4 buckets exist
3. Verify each bucket is marked as public
4. Click on each bucket to verify settings

### Using CLI
```bash
supabase storage list
```

---

## Testing Storage Access

### Test Public Access
```bash
# Replace with your actual Supabase URL and file path
curl https://your-project.supabase.co/storage/v1/object/public/products/your-image.jpg
```

### Test Upload (Backend)
Use the backend API endpoints or scripts to test file uploads:
```bash
node backend/scripts/check-storage.js
```

---

## Troubleshooting

### Bucket Creation Fails

**Error:** "Bucket already exists"
- **Solution:** Bucket already created, skip to policy setup

**Error:** "Permission denied"
- **Solution:** Ensure you're using `SUPABASE_SERVICE_ROLE_KEY`, not anon key

**Error:** "Invalid MIME type"
- **Solution:** Use `image/*` to allow all image types

### Policies Not Working

**Error:** "Policy not found"
- **Solution:** Run migration: `supabase db push`

**Error:** "Permission denied" when uploading
- **Solution:** Verify user has admin role in profiles table

### Images Not Loading

**Error:** 404 when accessing image URL
- **Solution:** Verify bucket is public
- **Solution:** Check file path in URL
- **Solution:** Verify RLS policies allow public read

---

## Security Notes

1. **Service Role Key:** Never expose service role key in frontend code
2. **File Size Limits:** Set appropriate limits to prevent abuse
3. **MIME Types:** Restrict to image types only to prevent malicious uploads
4. **RLS Policies:** Always use policies to control access
5. **Public Buckets:** Only mark buckets as public if images should be publicly accessible

---

## Maintenance

### Regular Tasks

- Monitor storage usage in Supabase Dashboard
- Clean up unused images periodically
- Review and update file size limits if needed
- Backup important images (Supabase has built-in backups)

### Storage Quotas

- Free tier: 1GB storage
- Pro tier: 8GB storage (scalable)
- Monitor usage to avoid hitting limits

---

## Next Steps

1. ✅ Create storage buckets (using one of the methods above)
2. ✅ Apply storage policies via migration
3. ✅ Upload placeholder images
4. ✅ Test public image access
5. ✅ Test admin image upload
6. ✅ Deploy to production

---

## Support

- Supabase Storage Documentation: https://supabase.com/docs/guides/storage
- Supabase Dashboard: https://supabase.com/dashboard
- Storage Policies Guide: https://supabase.com/docs/guides/storage/security/access-control
