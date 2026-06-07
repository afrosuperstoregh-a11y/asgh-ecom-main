# Apply Storage Policies - Next Step

## Status

✅ Storage buckets created successfully  
✅ Supabase connection verified  
⏳ Storage policies need to be applied

---

## Storage Bucket Status

| Bucket | Status | Files | Public |
|--------|--------|-------|--------|
| products | ✅ Created | 1 | Yes |
| product-images | ✅ Already exists | 10 | Yes |
| category-images | ✅ Already exists | 10 | Yes |
| user-avatars | ✅ Already exists | 0 | Yes |
| invoices | ✅ Already exists | 0 | No |

---

## Apply Storage Policies

Since the Supabase CLI is not installed, apply the storage policies via the Supabase Dashboard:

### Step 1: Open Supabase Dashboard

1. Go to: https://supabase.com/dashboard
2. Select your project: `azpgqsmgyorjbqsgxuxw`
3. Navigate to **SQL Editor** in the left sidebar

### Step 2: Execute Storage Policies Migration

1. Open the file: `supabase/migrations/009_setup_storage_buckets.sql`
2. Copy the entire contents
3. Paste into the SQL Editor
4. Click **Run** or press `Ctrl+Enter`

### Step 3: Verify Policies Applied

After running the migration, verify policies are applied:

1. Go to **Storage** in the left sidebar
2. Click on each bucket
3. Go to **Policies** tab
4. Verify policies exist for each bucket

**Expected policies for each bucket:**
- products: Public view, Admin upload/update/delete, Service role full access
- product-images: Public view, Admin upload/update/delete, Service role full access
- category-images: Public view, Admin upload/update/delete, Service role full access
- user-avatars: Public view, Users manage own, Admin full access, Service role full access

---

## Alternative: Install Supabase CLI (Optional)

If you prefer to use the CLI:

```bash
npm install -g supabase

# Then apply policies
supabase db push
```

---

## After Applying Policies

Once storage policies are applied, the setup is complete. You can then:

1. Test image uploads from the backend
2. Test image access from the frontend
3. Verify RLS policies work correctly
4. Deploy to production

---

## Troubleshooting

### Policy Creation Fails

**Error:** "Policy already exists"
- **Solution:** Policy may already be applied, continue to next bucket

**Error:** "Permission denied"
- **Solution:** Ensure you're logged in as project owner

### Images Not Loading After Policies

**Error:** 403 Forbidden
- **Solution:** Verify public read policy is enabled
- **Solution:** Check bucket is marked as public

---

## Next Steps After This

1. ✅ Apply storage policies (this step)
2. Test backend image upload functionality
3. Test frontend image loading
4. Verify user signup creates profile
5. Deploy to production

---

**Current Project URL:** https://azpgqsmgyorjbqsgxuxw.supabase.co
