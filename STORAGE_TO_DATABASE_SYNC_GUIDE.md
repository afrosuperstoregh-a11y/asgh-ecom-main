# Supabase Storage to Database Synchronization Guide

## Overview

This guide documents the complete solution for automatically populating Supabase product-related database tables using product assets stored in Supabase Storage buckets.

## Analysis Summary

### Database Schema

**Existing Tables:**
- `products` - 120 products with images stored in JSONB `images` column
- `categories` - 12 categories
- `profiles`, `orders`, `cart`, `reviews`, `inventory_logs`, `payments`

**Missing Tables:**
- `product_images` - Normalized table for individual product images (migration created)

### Storage Structure

**Buckets Analyzed:**
- `product-images` - 116 files across 10 category folders
- `products` - 1 placeholder file
- `category-images` - 11 category images
- `user-avatars` - empty

**Product Image Organization:**
```
product-images/
├── beauty&health/ (3 files)
├── books&media/ (3 files)
├── electronics/ (42 files)
├── food&beverages/ (55 files)
├── home&living/ (3 files)
├── jewelry&accessories/ (3 files)
├── men-fashion/ (4 files)
├── sport&fitness/ (3 files)
├── stationery/ (5 files)
└── womem-fashion/ (2 files)
```

**File Naming Patterns:**
- Product variants: `product-name-1.jpg`, `product-name-2.jpg`
- Single images: `product-name.jpg`
- Categories map to folder names

## Implementation Steps

### Step 1: Apply Missing Migration

The `product_images` table is missing from the database. Apply the migration:

```bash
# Option 1: Via Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Navigate to your project
3. Go to SQL Editor
4. Open file: supabase/migrations/011_create_product_images_table.sql
5. Execute the SQL

# Option 2: Via CLI (if configured)
supabase db push
```

**Migration File:** `supabase/migrations/011_create_product_images_table.sql`

### Step 2: Run Synchronization Script

The sync script (`sync-storage-to-database.cjs`) performs the following:

**Features:**
- ✅ Idempotent operations (safe to run multiple times)
- ✅ Dry-run mode for validation
- ✅ Automatic category creation
- ✅ Automatic product creation
- ✅ Image linking to products
- ✅ Comprehensive error reporting
- ✅ Detailed execution reports

**Category Mapping:**
```javascript
{
  'beauty&health': 'beauty-health',
  'books&media': 'books-media',
  'electronics': 'electronics',
  'food&beverages': 'food-beverages',
  'home&living': 'home-living',
  'jewelry&accessories': 'jewelry-accessories',
  'men-fashion': 'men-fashion',
  'sport&fitness': 'sport-fitness',
  'stationery': 'stationery',
  'womem-fashion': 'women-fashion'
}
```

**Run in Dry-Run Mode (Validation):**
```bash
node sync-storage-to-database.cjs
```

**Run in Live Mode (Apply Changes):**
```bash
node sync-storage-to-database.cjs --live
```

### Step 3: Verify Results

After synchronization, verify the results:

```bash
# Check product_images table
node check-actual-schema.cjs

# Check products with images
node check-products.cjs

# Review the sync report
cat sync-report.json
```

## Script Details

### sync-storage-to-database.cjs

**Purpose:** Synchronize storage files to database tables

**Configuration:**
- `DRY_RUN`: Set to `false` to apply changes (default: `true`)
- `BUCKET_NAME`: Storage bucket to scan (default: 'product-images')

**Default Product Values:**
```javascript
{
  price: 29.99,
  inventory_quantity: 100,
  status: 'active',
  track_inventory: true,
  allow_backorder: false,
  requires_shipping: true,
  is_digital: false,
  featured: false
}
```

**Logic Flow:**
1. Scan storage bucket recursively
2. Group files by category folder
3. For each category:
   - Get or create category record
   - Group files by product base name
   - For each product:
     - Get or create product record
     - Create product image records
     - Set first image as primary

**Fallback Behavior:**
If `product_images` table doesn't exist, the script falls back to updating the `products.images` JSONB array.

## Expected Results

Based on the storage analysis, the synchronization will:

**Categories:** 10 categories (some may already exist)
- beauty-health
- books-media
- electronics
- food-beverages
- home-living
- jewelry-accessories
- men-fashion
- sport-fitness
- stationery
- women-fashion

**Products:** ~60-70 new products (estimated from file patterns)
- Electronics: ~10-15 products (Dell laptops, HP Elitebooks, Lenovo ThinkPads)
- Food & Beverages: ~35 products (Ghanaian dishes, ingredients)
- Fashion: ~5 products (Dashiki shirts, ladies wear)
- Stationery: ~5 products (Calculator, desk organizer, pens, notebooks)
- Other categories: ~5-10 products

**Product Images:** 116 image records
- Each product will have 1-6 images
- First image marked as primary
- Images linked via storage paths

## Troubleshooting

### Issue: product_images table not accessible

**Solution:** Apply the migration first (Step 1)

### Issue: Permission denied errors

**Solution:** Ensure you're using the service role key (configured in script)

### Issue: Duplicate products

**Solution:** The script is idempotent - it checks for existing products by slug before creating new ones

### Issue: Category not found

**Solution:** The script automatically creates missing categories based on folder names

## Files Created

1. **supabase/migrations/011_create_product_images_table.sql** - Migration for missing table
2. **sync-storage-to-database.cjs** - Main synchronization script
3. **scan-storage-recursive.cjs** - Storage scanning utility
4. **check-actual-schema.cjs** - Schema verification utility
5. **storage-recursive-report.json** - Detailed storage analysis
6. **sync-report.json** - Synchronization execution report

## Safety Features

- ✅ **Idempotent:** Safe to run multiple times
- ✅ **Dry-run mode:** Validate before applying changes
- ✅ **Error handling:** Continues on individual errors, logs all issues
- ✅ **Transaction safety:** Uses Supabase client with proper error handling
- ✅ **Data validation:** Checks for existing records before insertion
- ✅ **Fallback behavior:** Works with or without product_images table

## Next Steps

1. Apply the migration to create `product_images` table
2. Run the sync script in dry-run mode to validate
3. Review the dry-run report
4. Run the sync script in live mode to apply changes
5. Verify the results using check scripts
6. Review the final sync report

## Support Scripts

### Scan Storage
```bash
node scan-storage-recursive.cjs
```

### Check Schema
```bash
node check-actual-schema.cjs
```

### Check Products
```bash
node check-products.cjs
```

### Check Categories
```bash
node check-categories.cjs
```

## Report Structure

The sync report (`sync-report.json`) includes:
- Execution mode (dry-run/live)
- Timestamp
- Categories created/updated/skipped
- Products created/updated/skipped
- Product images created/updated/skipped/errors
- Detailed error log

## Notes

- The script uses the service role key for full database access
- Image URLs are constructed using the Supabase storage public URL pattern
- Product slugs are auto-generated from names
- SKUs are auto-generated using a random suffix
- Default values can be customized in the script configuration
