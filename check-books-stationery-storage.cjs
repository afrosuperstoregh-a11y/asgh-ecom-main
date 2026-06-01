// Check Supabase Storage for books and stationery images
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './frontend/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

// Use service role key for storage access to bypass RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseKey);

async function checkStorageStructure() {
  console.log('🔍 Checking Supabase Storage structure...\n');

  // Check product-images bucket root
  console.log('📁 Checking product-images bucket root...');
  const { data: rootFiles, error: rootError } = await supabase.storage
    .from('product-images')
    .list('', { limit: 100 });

  if (rootError) {
    console.error('❌ Error listing root:', rootError);
  } else {
    console.log(`✅ Found ${rootFiles.length} items in root:`);
    rootFiles.forEach(file => {
      console.log(`  - ${file.name} (${file.metadata?.mimeType || 'folder'})`);
    });
  }

  // Check for books folder
  console.log('\n📚 Checking for books folder...');
  const { data: booksFiles, error: booksError } = await supabase.storage
    .from('product-images')
    .list('books', { limit: 100 });

  if (booksError) {
    console.log('❌ Books folder not found or inaccessible:', booksError.message);
  } else {
    console.log(`✅ Found ${booksFiles.length} items in books folder:`);
    booksFiles.forEach(file => {
      console.log(`  - ${file.name}`);
    });
  }

  // Check for books&media folder (actual folder name found)
  console.log('\n📚 Checking for books&media folder...');
  const { data: booksMediaFiles, error: booksMediaError } = await supabase.storage
    .from('product-images')
    .list('books&media', { limit: 100 });

  if (booksMediaError) {
    console.log('❌ Books&media folder not found or inaccessible:', booksMediaError.message);
  } else {
    console.log(`✅ Found ${booksMediaFiles.length} items in books&media folder:`);
    booksMediaFiles.forEach(file => {
      console.log(`  - ${file.name}`);
    });
  }

  // Check for stationery folder
  console.log('\n✏️  Checking for stationery folder...');
  const { data: stationeryFiles, error: stationeryError } = await supabase.storage
    .from('product-images')
    .list('stationery', { limit: 100 });

  if (stationeryError) {
    console.log('❌ Stationery folder not found or inaccessible:', stationeryError.message);
  } else {
    console.log(`✅ Found ${stationeryFiles.length} items in stationery folder:`);
    stationeryFiles.forEach(file => {
      console.log(`  - ${file.name}`);
    });
  }

  // Check for other common folder names
  const commonFolders = ['book', 'books-images', 'stationery-images', 'school', 'office'];
  console.log('\n🔍 Checking other common folder names...');
  
  for (const folder of commonFolders) {
    const { data: folderFiles, error: folderError } = await supabase.storage
      .from('product-images')
      .list(folder, { limit: 10 });
    
    if (!folderError && folderFiles.length > 0) {
      console.log(`✅ Found folder "${folder}" with ${folderFiles.length} items`);
    }
  }

  // Check all buckets
  console.log('\n🗂️  Checking all available buckets...');
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
  
  if (bucketsError) {
    console.error('❌ Error listing buckets:', bucketsError);
  } else {
    console.log(`✅ Found ${buckets.length} buckets:`);
    buckets.forEach(bucket => {
      console.log(`  - ${bucket.name} (public: ${bucket.public})`);
    });
  }
}

async function checkDatabaseProducts() {
  console.log('\n\n🔍 Checking database for books and stationery products...\n');

  // Check for books products
  const { data: booksProducts, error: booksError } = await supabase
    .from('products')
    .select('id, name, slug, images, category_id')
    .ilike('name', '%book%')
    .limit(20);

  if (booksError) {
    console.error('❌ Error fetching books products:', booksError);
  } else {
    console.log(`📚 Found ${booksProducts.length} products with "book" in name:`);
    booksProducts.forEach(product => {
      console.log(`  - ${product.name}`);
      console.log(`    Images: ${product.images?.[0] || 'none'}`);
    });
  }

  // Check for stationery products
  const { data: stationeryProducts, error: stationeryError } = await supabase
    .from('products')
    .select('id, name, slug, images, category_id')
    .ilike('name', '%stationery%')
    .limit(20);

  if (stationeryError) {
    console.error('❌ Error fetching stationery products:', stationeryError);
  } else {
    console.log(`\n✏️  Found ${stationeryProducts.length} products with "stationery" in name:`);
    stationeryProducts.forEach(product => {
      console.log(`  - ${product.name}`);
      console.log(`    Images: ${product.images?.[0] || 'none'}`);
    });
  }

  // Check categories
  const { data: categories, error: categoriesError } = await supabase
    .from('categories')
    .select('id, name, slug')
    .ilike('name', '%book%')
    .or('name.ilike.%stationery%')
    .or('name.ilike.%school%')
    .or('name.ilike.%office%');

  if (categoriesError) {
    console.error('❌ Error fetching categories:', categoriesError);
  } else {
    console.log(`\n📂 Found ${categories.length} related categories:`);
    categories.forEach(category => {
      console.log(`  - ${category.name} (${category.slug})`);
    });
  }

  // Check products in books&media folder
  console.log('\n📚 Checking products with images in books&media folder...');
  const { data: allProductsForCheck, error: allProductsError } = await supabase
    .from('products')
    .select('id, name, slug, images, category_id')
    .limit(100);

  if (allProductsError) {
    console.error('❌ Error fetching products:', allProductsError);
  } else {
    const booksMediaProducts = allProductsForCheck.filter(product => 
      product.images?.[0]?.includes('books&media')
    );
    console.log(`✅ Found ${booksMediaProducts.length} products with books&media images:`);
    booksMediaProducts.forEach(product => {
      console.log(`  - ${product.name}`);
      console.log(`    Images: ${product.images?.[0] || 'none'}`);
      console.log(`    Category ID: ${product.category_id}`);
    });
  }

  // Check category ID 11
  console.log('\n📂 Checking category ID 11...');
  const { data: category11, error: category11Error } = await supabase
    .from('categories')
    .select('id, name, slug')
    .eq('id', '11')
    .single();

  if (category11Error) {
    console.error('❌ Error fetching category 11:', category11Error);
  } else {
    console.log(`✅ Category 11: ${category11.name} (${category11.slug})`);
  }

  // Test image URLs for accessibility
  console.log('\n🔍 Testing books&media image URLs for accessibility...');
  const testUrls = [
    'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/books&media/b&mproduct1.jpg',
    'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/books&media/b&mproduct2.jpg',
    'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/books&media/b&mproduct3.jpg',
  ];

  for (const url of testUrls) {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      console.log(`  - ${url.split('/').pop()}: ${response.status} ${response.statusText}`);
    } catch (error) {
      console.log(`  - ${url.split('/').pop()}: Failed to fetch - ${error.message}`);
    }
  }

  // Check all products to see image path patterns
  const { data: allProducts, error: allError } = await supabase
    .from('products')
    .select('name, images')
    .limit(50);

  if (allError) {
    console.error('❌ Error fetching all products:', allError);
  } else {
    console.log(`\n📊 Image path patterns in first 50 products:`);
    const pathPatterns = {};
    allProducts.forEach(product => {
      const imagePath = product.images?.[0];
      if (imagePath) {
        // Extract folder path if it exists
        const match = imagePath.match(/product-images\/([^\/]+)/);
        if (match) {
          const folder = match[1];
          pathPatterns[folder] = (pathPatterns[folder] || 0) + 1;
        }
      }
    });
    
    console.log('  Folder distribution:');
    Object.entries(pathPatterns).forEach(([folder, count]) => {
      console.log(`    - ${folder}: ${count} products`);
    });
  }
}

async function main() {
  try {
    await checkStorageStructure();
    await checkDatabaseProducts();
    console.log('\n✅ Audit complete');
  } catch (error) {
    console.error('❌ Audit failed:', error);
    process.exit(1);
  }
}

main();
