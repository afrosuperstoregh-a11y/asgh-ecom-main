const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://azpgqsmgyorjbqsgxuxw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6cGdxc21neW9yamJxc2d4dXh3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTI5ODU2MCwiZXhwIjoyMDg0ODc0NTYwfQ.A-gUiUyjt9XWxwB2mCfWScOGDCbSGmm-zXt2G5Xseh0';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Configuration
const DRY_RUN = process.argv.includes('--dry-run') || false;
const BUCKET_NAME = 'product-images';

// Category mapping from storage folders to database categories
const CATEGORY_MAPPING = {
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
};

// Default values for new products
const DEFAULT_PRODUCT_VALUES = {
  price: 29.99,
  inventory_quantity: 100,
  status: 'active',
  track_inventory: true,
  allow_backorder: false,
  requires_shipping: true,
  is_digital: false,
  featured: false
};

// Report tracking
const report = {
  dryRun: DRY_RUN,
  timestamp: new Date().toISOString(),
  categories: { created: 0, updated: 0, skipped: 0 },
  products: { created: 0, updated: 0, skipped: 0 },
  productImages: { created: 0, updated: 0, skipped: 0, errors: 0 },
  errors: []
};

function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

function encodeStoragePath(path) {
  // Split the path into parts and encode each part separately
  const parts = path.split('/');
  const encodedParts = parts.map(part => encodeURIComponent(part));
  return encodedParts.join('/');
}

function generateSKU(name) {
  const prefix = name.substring(0, 3).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${random}`;
}

function extractProductName(filename) {
  // Remove file extension
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
  
  // Remove numbering suffix (e.g., -1, -2, -3)
  const nameWithoutNumber = nameWithoutExt.replace(/-\d+$/, '');
  
  // Replace special characters with spaces
  const cleanName = nameWithoutNumber
    .replace(/[-_]/g, ' ')
    .replace(/&/g, ' & ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
  
  return cleanName;
}

function extractProductBaseName(filename) {
  // Extract the base product name (without numbering)
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
  const baseName = nameWithoutExt.replace(/-\d+$/, '');
  return baseName;
}

async function getOrCreateCategory(categorySlug) {
  try {
    // Try to find existing category
    const { data: existingCategory, error: findError } = await supabase
      .from('categories')
      .select('*')
      .eq('slug', categorySlug)
      .single();
    
    if (existingCategory) {
      log(`✅ Category found: ${existingCategory.name} (${categorySlug})`);
      return existingCategory;
    }
    
    if (DRY_RUN) {
      log(`🔍 [DRY RUN] Would create category: ${categorySlug}`);
      return null;
    }
    
    // Create new category
    const categoryName = categorySlug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    const { data: newCategory, error: createError } = await supabase
      .from('categories')
      .insert({
        name: categoryName,
        slug: categorySlug,
        description: `${categoryName} products`,
        is_active: true,
        sort_order: 0
      })
      .select()
      .single();
    
    if (createError) {
      throw createError;
    }
    
    log(`✅ Created category: ${newCategory.name} (${categorySlug})`);
    report.categories.created++;
    return newCategory;
    
  } catch (error) {
    log(`❌ Error with category ${categorySlug}: ${error.message}`);
    report.errors.push({ type: 'category', slug: categorySlug, error: error.message });
    return null;
  }
}

async function getOrCreateProduct(productName, categoryId, storagePath) {
  try {
    const productSlug = slugify(productName);
    
    // Try to find existing product by slug
    const { data: existingProduct, error: findError } = await supabase
      .from('products')
      .select('*')
      .eq('slug', productSlug)
      .single();
    
    if (existingProduct) {
      log(`✅ Product found: ${existingProduct.name} (${productSlug})`);
      return existingProduct;
    }
    
    if (DRY_RUN) {
      log(`🔍 [DRY RUN] Would create product: ${productName}`);
      return null;
    }
    
    // Generate SKU
    const sku = generateSKU(productName);
    
    // Create new product
    const { data: newProduct, error: createError } = await supabase
      .from('products')
      .insert({
        name: productName,
        slug: productSlug,
        description: `High-quality ${productName.toLowerCase()}. Perfect for your needs.`,
        short_description: `${productName}`,
        sku: sku,
        category_id: categoryId,
        ...DEFAULT_PRODUCT_VALUES
      })
      .select()
      .single();
    
    if (createError) {
      throw createError;
    }
    
    log(`✅ Created product: ${newProduct.name} (${productSlug})`);
    report.products.created++;
    return newProduct;
    
  } catch (error) {
    log(`❌ Error with product ${productName}: ${error.message}`);
    report.errors.push({ type: 'product', name: productName, error: error.message });
    return null;
  }
}

async function createProductImage(productId, imagePath, isPrimary = false) {
  try {
    // Check if product_images table exists
    const { data: checkTable, error: tableError } = await supabase
      .from('product_images')
      .select('*')
      .limit(1);
    
    if (tableError) {
      log(`⚠️  product_images table not accessible, using products.images JSONB instead`);
      
      // Update products.images JSONB array
      const { data: product, error: fetchError } = await supabase
        .from('products')
        .select('images')
        .eq('id', productId)
        .single();
      
      if (fetchError) throw fetchError;
      
      const currentImages = product.images || [];
      // Use Supabase's getPublicUrl to handle encoding correctly
      const { data: { publicUrl } } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(imagePath);
      const imageUrl = publicUrl;
      
      if (!currentImages.includes(imageUrl)) {
        if (DRY_RUN) {
          log(`🔍 [DRY RUN] Would add image to product: ${imagePath}`);
          return null;
        }
        
        const updatedImages = [...currentImages, imageUrl];
        const { error: updateError } = await supabase
          .from('products')
          .update({ images: updatedImages })
          .eq('id', productId);
        
        if (updateError) throw updateError;
        
        log(`✅ Added image to product: ${imagePath}`);
        report.productImages.created++;
      } else {
        log(`⏭️  Image already exists in product: ${imagePath}`);
        report.productImages.skipped++;
      }
      
      return null;
    }
    
    // Check if image already exists
    // Use Supabase's getPublicUrl to handle encoding correctly
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(imagePath);
    const imageUrl = publicUrl;
    const { data: existingImage, error: findError } = await supabase
      .from('product_images')
      .select('*')
      .eq('product_id', productId)
      .eq('storage_path', imagePath)
      .single();
    
    if (existingImage) {
      log(`⏭️  Product image already exists: ${imagePath}`);
      report.productImages.skipped++;
      return existingImage;
    }
    
    if (DRY_RUN) {
      log(`🔍 [DRY RUN] Would create product image: ${imagePath}`);
      return null;
    }
    
    // Create new product image
    const { data: newImage, error: createError } = await supabase
      .from('product_images')
      .insert({
        product_id: productId,
        image_url: imageUrl,
        storage_path: imagePath,
        alt_text: extractProductName(imagePath),
        sort_order: 0,
        is_primary: isPrimary
      })
      .select()
      .single();
    
    if (createError) {
      throw createError;
    }
    
    log(`✅ Created product image: ${imagePath}`);
    report.productImages.created++;
    return newImage;
    
  } catch (error) {
    log(`❌ Error creating product image ${imagePath}: ${error.message}`);
    report.productImages.errors++;
    report.errors.push({ type: 'product_image', path: imagePath, error: error.message });
    return null;
  }
}

async function listAllFiles(bucket, path = '') {
  const { data, error } = await supabase.storage
    .from(bucket)
    .list(path, {
      limit: 1000,
      offset: 0
    });
  
  if (error) {
    log(`❌ Error listing ${bucket}/${path}: ${error.message}`);
    return { files: [], folders: [] };
  }
  
  const files = [];
  const folders = [];
  
  for (const item of data) {
    if (item.name.includes('/') && !item.name.endsWith('/')) {
      // File in subdirectory
      files.push({
        name: item.name,
        path: path ? `${path}/${item.name}` : item.name
      });
    } else if (!item.name.includes('.')) {
      // Folder
      folders.push(item.name);
      const subResult = await listAllFiles(bucket, item.name);
      files.push(...subResult.files);
      folders.push(...subResult.folders);
    } else {
      // File in current directory
      files.push({
        name: item.name,
        path: path ? `${path}/${item.name}` : item.name
      });
    }
  }
  
  return { files, folders };
}

async function syncStorageToDatabase() {
  log('🚀 Starting Supabase Storage to Database Synchronization');
  log(`📋 Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  log(`📦 Bucket: ${BUCKET_NAME}\n`);
  
  // Scan storage
  log('🔍 Scanning storage bucket...');
  const { files, folders } = await listAllFiles(BUCKET_NAME);
  log(`✅ Found ${files.length} files in ${folders.length} folders\n`);
  
  // Group files by folder (category)
  const filesByCategory = {};
  files.forEach(file => {
    const parts = file.path.split('/');
    if (parts.length > 1) {
      const folder = parts[0];
      if (!filesByCategory[folder]) {
        filesByCategory[folder] = [];
      }
      filesByCategory[folder].push(file);
    } else {
      // Root level files - skip or handle separately
      log(`⏭️  Skipping root level file: ${file.name}`);
    }
  });
  
  // Process each category folder
  for (const [folderName, categoryFiles] of Object.entries(filesByCategory)) {
    log(`\n📂 Processing category folder: ${folderName}`);
    log(`   Files: ${categoryFiles.length}`);
    
    // Map folder name to category slug
    const categorySlug = CATEGORY_MAPPING[folderName] || slugify(folderName);
    
    // Get or create category
    const category = await getOrCreateCategory(categorySlug);
    if (!category) {
      log(`⚠️  Skipping category ${folderName} - could not create/find category`);
      continue;
    }
    
    // Group files by product base name
    const filesByProduct = {};
    categoryFiles.forEach(file => {
      const baseName = extractProductBaseName(file.name);
      if (!filesByProduct[baseName]) {
        filesByProduct[baseName] = [];
      }
      filesByProduct[baseName].push(file);
    });
    
    // Process each product
    for (const [baseName, productFiles] of Object.entries(filesByProduct)) {
      const productName = extractProductName(baseName);
      log(`\n   📦 Processing product: ${productName}`);
      log(`      Images: ${productFiles.length}`);
      
      // Get or create product
      const product = await getOrCreateProduct(productName, category.id, productFiles[0].path);
      if (!product) {
        log(`      ⚠️  Skipping product ${productName} - could not create/find product`);
        continue;
      }
      
      // Sort files by name to ensure consistent ordering
      productFiles.sort((a, b) => a.name.localeCompare(b.name));
      
      // Create product images
      for (let i = 0; i < productFiles.length; i++) {
        const file = productFiles[i];
        const isPrimary = (i === 0); // First image is primary
        await createProductImage(product.id, file.path, isPrimary);
      }
    }
  }
  
  // Generate final report
  log('\n\n' + '='.repeat(80));
  log('📊 SYNCHRONIZATION REPORT');
  log('='.repeat(80));
  log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  log(`Timestamp: ${report.timestamp}`);
  log(`\nCategories:`);
  log(`  Created: ${report.categories.created}`);
  log(`  Updated: ${report.categories.updated}`);
  log(`  Skipped: ${report.categories.skipped}`);
  log(`\nProducts:`);
  log(`  Created: ${report.products.created}`);
  log(`  Updated: ${report.products.updated}`);
  log(`  Skipped: ${report.products.skipped}`);
  log(`\nProduct Images:`);
  log(`  Created: ${report.productImages.created}`);
  log(`  Updated: ${report.productImages.updated}`);
  log(`  Skipped: ${report.productImages.skipped}`);
  log(`  Errors: ${report.productImages.errors}`);
  log(`\nTotal Errors: ${report.errors.length}`);
  
  if (report.errors.length > 0) {
    log(`\n❌ Errors:`);
    report.errors.forEach((err, idx) => {
      log(`  ${idx + 1}. [${err.type}] ${err.name || err.slug || err.path}: ${err.error}`);
    });
  }
  
  log('='.repeat(80));
  
  // Save report to file
  fs.writeFileSync(
    'sync-report.json',
    JSON.stringify(report, null, 2)
  );
  log(`\n✅ Report saved to sync-report.json`);
  
  if (DRY_RUN) {
    log(`\n⚠️  This was a DRY RUN. No changes were made to the database.`);
    log(`   Run without --dry-run flag to apply changes.`);
  }
}

async function main() {
  try {
    await syncStorageToDatabase();
  } catch (error) {
    log(`\n❌ Fatal error: ${error.message}`);
    process.exit(1);
  }
}

main();
