# Scripts Directory

This directory contains utility scripts for the Afro Superstore e-commerce platform.

## generate-placeholder-categories.ts

### Purpose
Automatically generates placeholder category records from images stored in Supabase Storage and inserts them into the category table.

### Features
- Fetches all images from the `category-images` bucket in Supabase Storage
- Generates placeholder category data including:
  - Category name (derived from filename)
  - URL-friendly slug
  - Placeholder description
  - Image URL from Supabase Storage
  - UUID generation
- Checks for duplicates by comparing slugs
- Inserts categories in batches of 10
- Provides detailed console output with statistics

### Usage

#### Prerequisites
- Node.js and npm installed
- Supabase local development environment running
- Environment variables set:
  - `SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`

#### Running the Script
```bash
# Set environment variables (Windows PowerShell)
$env:SUPABASE_URL="http://127.0.0.1:54321"
$env:SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Run the script
npx ts-node --esm scripts/generate-placeholder-categories.ts
```

#### Example Output
```
🚀 Starting placeholder category generation...
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
```

### Generated Category Data Structure
Each generated category includes:
- **Basic Info**: ID (UUID), name, slug
- **Description**: Placeholder description template
- **Image**: Image URL from Supabase Storage
- **Metadata**: Created timestamp

### Duplicate Prevention
The script checks existing categories by comparing slugs to avoid creating duplicate entries.

### Dependencies
- `@supabase/supabase-js` - Supabase client
- `uuid` - UUID generation
- `ts-node` - TypeScript execution

### Notes
- Uses the `category-images` bucket
- Requires service role key for admin access to storage and database
- Script is safe to run multiple times (will skip duplicates)
- Generated categories are immediately available for display on frontend
- Run `scripts/test-category-generation.ts` to test the logic without Supabase

## Quick Commands

```bash
# Test the category generation logic (no Supabase required)
npx ts-node --esm scripts/test-category-generation.ts

# Generate categories from Supabase Storage (requires running Supabase)
npx ts-node --esm scripts/generate-placeholder-categories.ts

# Generate products from Supabase Storage (requires running Supabase)
npx ts-node --esm scripts/generate-placeholder-products.ts
```

## generate-placeholder-products.ts

### Purpose
Automatically generates placeholder product records from images stored in Supabase Storage and inserts them into the products table.

### Features
- Fetches all images from the `product-images` bucket in Supabase Storage
- Generates placeholder product data including:
  - Product name (derived from filename)
  - Description and short description
  - Random price ($10-$210)
  - Random stock quantity (5-100)
  - SKU generation
  - SEO metadata
  - Product dimensions and weight
- Checks for duplicates by comparing image URLs
- Inserts products in batches of 10
- Provides detailed console output with statistics

### Usage

#### Prerequisites
- Node.js and npm installed
- Supabase local development environment running
- Environment variables set:
  - `SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`

#### Running the Script
```bash
# Set environment variables (Windows PowerShell)
$env:SUPABASE_URL="http://127.0.0.1:54321"
$env:SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Run the script
npx ts-node --esm scripts/generate-placeholder-products.ts
```

#### Example Output
```
🚀 Starting placeholder product generation...
📁 Fetching images from Supabase Storage...
📸 Found 9 images in bucket
🔍 Checking for existing products...
📊 Found 0 existing products with images
📂 Found 0 active categories
📝 Generated 9 new products
⏭️  Skipped 0 duplicates
💾 Inserting products into database...
✅ Batch 1/1 inserted (9 products)

🎉 Placeholder product generation completed!
📊 Summary:
   - Total images found: 9
   - Products created: 9
   - Duplicates skipped: 0
   - Total products in database: 9
```

### Generated Product Data Structure
Each generated product includes:
- **Basic Info**: Name, slug, description, SKU
- **Pricing**: Price ($10-$210), compare price, cost price
- **Inventory**: Stock quantity (5-100), tracking settings
- **Media**: Image URL from Supabase Storage
- **Metadata**: SEO title/description, tags, dimensions
- **Status**: Set to 'active' for immediate display

### Duplicate Prevention
The script checks existing products by comparing image URLs to avoid creating duplicate entries.

### Dependencies
- `@supabase/supabase-js` - Supabase client
- `uuid` - UUID generation
- `ts-node` - TypeScript execution

### Notes
- Uses the `product-images` bucket (not `products`)
- Requires service role key for admin access to storage and database
- Script is safe to run multiple times (will skip duplicates)
- Generated products are immediately available for display on frontend
