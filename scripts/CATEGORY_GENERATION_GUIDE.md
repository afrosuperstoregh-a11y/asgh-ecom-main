# Category Generation Script Usage Guide

## Quick Start

1. **Ensure Supabase is running locally**
   ```bash
   # Start Supabase if not already running
   npx supabase start
   ```

2. **Set environment variables**
   ```powershell
   $env:SUPABASE_URL="http://127.0.0.1:54321"
   $env:SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
   ```

3. **Run the script**
   ```bash
   npx ts-node --esm scripts/generate-placeholder-categories.ts
   ```

## What the Script Does

1. **Connects to Supabase** using your service role key
2. **Tests the connection** to ensure everything is working
3. **Fetches all images** from the `category-images` storage bucket
4. **Generates category records** from each image:
   - Extracts name from filename (e.g., `electronics.jpg` → "Electronics")
   - Creates URL-friendly slug (e.g., "Electronics" → "electronics")
   - Generates placeholder description
   - Sets image URL from Supabase Storage
5. **Prevents duplicates** by checking existing slugs
6. **Inserts categories** in batches of 10

## Example Transformation

| Image Filename | Category Name | Slug | Description |
|---------------|---------------|------|-------------|
| `electronics.jpg` | Electronics | electronics | Browse our collection of electronics products. |
| `home-appliances.png` | Home Appliances | home-appliances | Browse our collection of home appliances products. |
| `mens-fashion.webp` | Mens Fashion | mens-fashion | Browse our collection of mens fashion products. |

## Troubleshooting

### "No images found in category-images bucket"
- Ensure the bucket exists: `npx supabase storage list`
- Upload images to the bucket: `npx supabase storage upload --bucket category-images --file path/to/image.jpg`

### "Supabase connection failed"
- Check that Supabase is running: `npx supabase status`
- Verify environment variables are correct
- Ensure service role key is valid and has proper permissions

### "Signature verification failed"
- Service role key may be expired or incorrect
- Generate a new service role key from Supabase dashboard

## Safety Features

✅ **Duplicate Prevention**: Checks existing slugs before inserting  
✅ **Batch Processing**: Inserts in batches to avoid overwhelming the database  
✅ **Error Handling**: Graceful error messages and troubleshooting hints  
✅ **Idempotent**: Safe to run multiple times (will skip duplicates)  

## Expected Output

```
🚀 Starting placeholder category generation...
📡 Connecting to Supabase at: http://127.0.0.1:54321
🔍 Testing Supabase connection...
✅ Supabase connection successful
📁 Fetching images from Supabase Storage...
📸 Found 5 images in bucket
🔍 Checking for existing categories...
📊 Found 0 existing categories
📝 Generated 5 new categories
⏭️  Skipped 0 duplicates
💾 Inserting categories into database...
✅ Batch 1/1 inserted (5 categories)

🎉 Placeholder category generation completed!
📊 Summary:
   - Total images found: 5
   - Categories created: 5
   - Duplicates skipped: 0
   - Total categories in database: 5
✅ Script completed successfully
```
