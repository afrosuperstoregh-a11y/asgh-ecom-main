const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://lljxxaejmueoxsaqaowf.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxsanh4YWVqbXVlb3hzYXFhb3dmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODEwODIyMSwiZXhwIjoyMDkzNjg0MjIxfQ.qXvtkAhMYRSOHSQUFVdLGQypZ0_k-Z5Y2TlDDYJBzFQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Folder to category mapping - map to existing categories where possible
const folderToCategory = {
  'books&stationeries': 'Art & Crafts',
  'electronics': 'Home & Living',
  'root': 'Home & Living'
};

// Price ranges based on product type keywords
const priceRanges = {
  'ruler': { min: 2.99, max: 5.99 },
  'pencil': { min: 1.99, max: 4.99 },
  'pen': { min: 2.99, max: 8.99 },
  'eraser': { min: 1.99, max: 3.99 },
  'sharpener': { min: 1.99, max: 4.99 },
  'calculator': { min: 14.99, max: 49.99 },
  'stapler': { min: 8.99, max: 24.99 },
  'envelope': { min: 4.99, max: 12.99 },
  'notebook': { min: 5.99, max: 19.99 },
  'paper': { min: 8.99, max: 29.99 },
  'binder': { min: 9.99, max: 24.99 },
  'folder': { min: 4.99, max: 15.99 },
  'tape': { min: 3.99, max: 9.99 },
  'glue': { min: 3.99, max: 12.99 },
  'scissors': { min: 5.99, max: 15.99 },
  'marker': { min: 4.99, max: 14.99 },
  'highlighter': { min: 4.99, max: 12.99 },
  'chalk': { min: 2.99, max: 7.99 },
  'board': { min: 19.99, max: 49.99 },
  'bible': { min: 19.99, max: 39.99 },
  'book': { min: 12.99, max: 49.99 },
  'dictionary': { min: 24.99, max: 59.99 },
  'keyboard': { min: 24.99, max: 89.99 },
  'mouse': { min: 14.99, max: 59.99 },
  'headphone': { min: 29.99, max: 149.99 },
  'speaker': { min: 39.99, max: 199.99 },
  'charger': { min: 14.99, max: 49.99 },
  'cable': { min: 9.99, max: 29.99 },
  'adapter': { min: 12.99, max: 39.99 },
  'battery': { min: 9.99, max: 29.99 },
  'flashlight': { min: 14.99, max: 39.99 },
  'fan': { min: 29.99, max: 89.99 },
  'laptop': { min: 499, max: 2499 },
  'computer': { min: 599, max: 2999 },
  'monitor': { min: 199, max: 899 },
  'tablet': { min: 299, max: 1299 },
  'shirt': { min: 19.99, max: 79.99 },
  'dress': { min: 29.99, max: 149.99 },
  'pants': { min: 29.99, max: 99.99 },
  'shoes': { min: 39.99, max: 199.99 },
  'bag': { min: 24.99, max: 149.99 },
  'watch': { min: 49.99, max: 299.99 },
  'jewelry': { min: 29.99, max: 499.99 },
  'accessory': { min: 14.99, max: 99.99 },
  'furniture': { min: 99, max: 999 },
  'decor': { min: 19.99, max: 199.99 },
  'kitchen': { min: 14.99, max: 149.99 },
  'bedding': { min: 29.99, max: 199.99 },
  'ball': { min: 14.99, max: 49.99 },
  'equipment': { min: 29.99, max: 199.99 },
  'fitness': { min: 49.99, max: 299.99 },
  'software': { min: 49.99, max: 499.99 },
  'antivirus': { min: 29.99, max: 99.99 },
  'office': { min: 99.99, max: 399.99 },
  'food': { min: 4.99, max: 29.99 },
  'coffee': { min: 12.99, max: 39.99 },
  'beverage': { min: 2.99, max: 19.99 },
  'acrylic': { min: 9.99, max: 29.99 },
  'crayon': { min: 4.99, max: 12.99 },
  'stamp': { min: 7.99, max: 19.99 },
  'dairy': { min: 8.99, max: 24.99 },
  'stethoscope': { min: 29.99, max: 89.99 },
  'default': { min: 14.99, max: 99.99 }
};

// Convert filename to product name
function filenameToProductName(filename) {
  let name = filename.replace(/\.[^/.]+$/, '');
  
  // Remove trailing numbers (1, 2, 3, etc.)
  name = name.replace(/\s*\(\d+\)$/, '');
  name = name.replace(/\s*\d+$/, '');
  
  // Remove duplicate suffixes
  name = name.replace(/_duplicate\d*$/, '');
  name = name.replace(/_copy\d*$/, '');
  
  // Replace underscores with spaces
  name = name.replace(/_/g, ' ');
  
  // Replace hyphens with spaces
  name = name.replace(/-/g, ' ');
  
  // Replace special characters
  name = name.replace(/\(ties\)/g, ' Ties');
  name = name.replace(/&/g, ' & ');
  name = name.replace(/\+/g, ' Plus ');
  
  // Capitalize each word
  name = name.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
  
  // Clean up extra spaces
  name = name.replace(/\s+/g, ' ').trim();
  
  return name;
}

// Generate slug from name
function nameToSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// Get price based on product name
function getPriceForProduct(productName) {
  const lowerName = productName.toLowerCase();
  
  for (const [keyword, range] of Object.entries(priceRanges)) {
    if (keyword !== 'default' && lowerName.includes(keyword)) {
      const min = range.min;
      const max = range.max;
      const price = min + Math.random() * (max - min);
      return Math.round(price * 100) / 100;
    }
  }
  
  const min = priceRanges.default.min;
  const max = priceRanges.default.max;
  const price = min + Math.random() * (max - min);
  return Math.round(price * 100) / 100;
}

// Generate description
function generateDescription(productName, category) {
  return `High-quality ${productName} from our ${category} collection. Perfect for everyday use with durable materials and excellent craftsmanship.`;
}

// Get category from folder path
function getCategoryFromPath(folder) {
  // Check if folder starts with books&stationeries
  if (folder.startsWith('books&stationeries')) {
    return 'Art & Crafts';
  }
  if (folder.startsWith('electronics')) {
    return 'Home & Living';
  }
  return folderToCategory[folder] || 'Home & Living';
}

async function listAllFiles(path = '', files = []) {
  const { data: items, error } = await supabase
    .storage
    .from('product-images')
    .list(path, { limit: 1000 });
  
  if (error) {
    console.error(`❌ Error listing ${path}:`, error.message);
    return files;
  }
  
  for (const item of items) {
    if (item.name === '.emptyFolderPlaceholder' || item.name.includes('.emptyFolderPlaceholder')) {
      continue;
    }
    
    if (item.metadata?.mimetype) {
      const extension = item.name.split('.').pop().toLowerCase();
      if (['jpg', 'jpeg', 'png', 'webp', 'JPG', 'JPEG', 'PNG', 'WEBP'].includes(extension)) {
        const fullPath = path ? `${path}/${item.name}` : item.name;
        files.push({
          path: fullPath,
          folder: path || 'root',
          filename: item.name
        });
      }
    } else {
      const folderPath = path ? `${path}/${item.name}` : item.name;
      await listAllFiles(folderPath, files);
    }
  }
  
  return files;
}

async function deleteAllProducts() {
  try {
    console.log('🗑️  Deleting all existing products...\n');
    
    const { data: products, error } = await supabase
      .from('products')
      .select('id');
    
    if (error) {
      console.error('❌ Error fetching products:', error);
      return false;
    }
    
    if (products.length === 0) {
      console.log('✅ No products to delete\n');
      return true;
    }
    
    const ids = products.map(p => p.id);
    
    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .in('id', ids);
    
    if (deleteError) {
      console.error('❌ Error deleting products:', deleteError);
      return false;
    }
    
    console.log(`✅ Deleted ${products.length} products\n`);
    return true;
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

async function getCategoryId(categoryName) {
  // Try exact match first (case-insensitive)
  const { data: categories, error } = await supabase
    .from('categories')
    .select('id, name')
    .ilike('name', categoryName);
  
  if (error) {
    console.error(`❌ Error fetching category ${categoryName}:`, error.message);
    return null;
  }
  
  if (categories && categories.length > 0) {
    console.log(`✅ Found existing category: ${categories[0].name} (ID: ${categories[0].id})`);
    return categories[0].id;
  }
  
  // If not found, try to create the category
  console.log(`⚠️  Category ${categoryName} not found, attempting to create...`);
  const { data: newCategory, error: createError } = await supabase
    .from('categories')
    .insert({
      name: categoryName,
      slug: nameToSlug(categoryName),
      description: `${categoryName} products`,
      image: 'placeholder-category.svg'
    })
    .select('id')
    .single();
  
  if (createError) {
    console.error(`❌ Error creating category ${categoryName}:`, createError.message);
    // Fallback to Home & Living (ID: 3)
    console.log(`🔄 Using fallback category: Home & Living (ID: 3)`);
    return 3;
  }
  
  console.log(`✅ Created new category: ${categoryName} (ID: ${newCategory.id})`);
  return newCategory.id;
}

async function createProductsFromImages() {
  try {
    console.log('🔍 Scanning all images in bucket...\n');
    
    const allFiles = await listAllFiles();
    console.log(`📊 Found ${allFiles.length} images\n`);
    
    // Delete all existing products
    const deleted = await deleteAllProducts();
    if (!deleted) {
      console.error('❌ Failed to delete existing products');
      return;
    }
    
    console.log('📦 Creating products from images...\n');
    
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    const slugCounts = {};
    
    for (const file of allFiles) {
      try {
        const productName = filenameToProductName(file.filename);
        const category = getCategoryFromPath(file.folder);
        const price = getPriceForProduct(productName);
        let slug = nameToSlug(productName);
        const publicUrl = `${supabaseUrl}/storage/v1/object/public/product-images/${file.path}`;
        const categoryId = await getCategoryId(category);
        
        if (!categoryId) {
          console.error(`❌ Could not get category for ${category}`);
          errorCount++;
          errors.push({ file: file.path, error: 'Category not found' });
          continue;
        }
        
        // Make slug unique by appending number if duplicate
        if (slugCounts[slug]) {
          slugCounts[slug]++;
          slug = `${slug}-${slugCounts[slug]}`;
        } else {
          slugCounts[slug] = 1;
        }
        
        const { error: insertError } = await supabase
          .from('products')
          .insert({
            name: productName,
            slug: slug,
            description: generateDescription(productName, category),
            price: price,
            images: [publicUrl],
            category_id: categoryId,
            status: 'active',
            inventory_quantity: 100,
            sku: slug.toUpperCase()
          });
        
        if (insertError) {
          console.error(`❌ Error inserting ${productName}:`, insertError.message);
          errorCount++;
          errors.push({ file: file.path, error: insertError.message });
        } else {
          successCount++;
          console.log(`✅ Created: ${productName} (${category}) - $${price}`);
        }
        
      } catch (error) {
        console.error(`❌ Error processing ${file.path}:`, error.message);
        errorCount++;
        errors.push({ file: file.path, error: error.message });
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`  Total images: ${allFiles.length}`);
    console.log(`  Products created: ${successCount}`);
    console.log(`  Errors: ${errorCount}`);
    
    if (errors.length > 0) {
      console.log('\n❌ Errors:');
      errors.forEach(e => {
        console.log(`  ${e.file}: ${e.error}`);
      });
    }
    
    const report = {
      totalImages: allFiles.length,
      productsCreated: successCount,
      productsUpdated: 0,
      errors: errorCount,
      errorDetails: errors
    };
    
    fs.writeFileSync('product-catalog-fix-report.json', JSON.stringify(report, null, 2));
    console.log('\n✅ Report saved to product-catalog-fix-report.json');
    
    return report;
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createProductsFromImages();
