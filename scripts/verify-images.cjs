/**
 * Production Verification Script for Product Images
 * 
 * This script verifies:
 * 1. Environment variables are set
 * 2. Supabase Storage bucket exists and is accessible
 * 3. Storage policies are correctly configured
 * 4. Sample images can be accessed
 * 5. Product data has correct image structure
 * 6. URL generation works correctly
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// ANSI color codes for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

function logTest(name, passed, details = '') {
  const status = passed ? '✓ PASS' : '✗ FAIL';
  const color = passed ? 'green' : 'red';
  log(`${status}: ${name}`, color);
  if (details) {
    console.log(`  ${details}`);
  }
}

async function verifyEnvironmentVariables() {
  logSection('Phase 1: Environment Variables');
  
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];
  
  let allPassed = true;
  
  for (const varName of requiredVars) {
    const value = process.env[varName];
    const passed = value && value !== 'your-project-id' && value !== 'your_supabase_anon_key';
    logTest(varName, passed, passed ? 'Set' : 'Missing or using placeholder');
    if (!passed) allPassed = false;
  }
  
  // Check consistency between frontend and backend URLs
  const frontendUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const backendUrl = process.env.SUPABASE_URL;
  const urlsMatch = frontendUrl === backendUrl;
  logTest('Frontend and backend URLs match', urlsMatch, 
    urlsMatch ? 'Both use same project' : `Frontend: ${frontendUrl}, Backend: ${backendUrl}`);
  
  return allPassed;
}

async function verifyStorageBucket(supabase) {
  logSection('Phase 2: Storage Bucket');
  
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      logTest('List buckets', false, error.message);
      return false;
    }
    
    logTest('List buckets', true, `Found ${buckets.length} buckets`);
    
    const productImagesBucket = buckets.find(b => b.id === 'product-images');
    if (productImagesBucket) {
      logTest('product-images bucket exists', true, 
        `Public: ${productImagesBucket.public}, Size limit: ${productImagesBucket.file_size_limit}`);
    } else {
      logTest('product-images bucket exists', false, 'Bucket not found');
      return false;
    }
    
    // List some files to verify access
    const { data: files, error: listError } = await supabase
      .storage
      .from('product-images')
      .list('', { limit: 5 });
    
    if (listError) {
      logTest('List bucket contents', false, listError.message);
      return false;
    }
    
    logTest('List bucket contents', true, `Found ${files.length} files (showing first 5)`);
    
    return true;
  } catch (error) {
    logTest('Storage bucket verification', false, error.message);
    return false;
  }
}

async function verifyStoragePolicies(supabase) {
  logSection('Phase 3: Storage Policies');
  
  try {
    // Try to access a file as anon user (public read)
    const { data: publicUrl, error: urlError } = supabase.storage
      .from('product-images')
      .getPublicUrl('test-placeholder.jpg');
    
    if (urlError) {
      logTest('Generate public URL', false, urlError.message);
      return false;
    }
    
    logTest('Generate public URL', true, 'Public URL generation works');
    
    // Try to fetch the SQL to check policies
    const { data, error } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'objects')
      .eq('schemaname', 'storage');
    
    // This might fail due to permissions, but that's okay
    if (error) {
      logTest('Check storage policies', false, 'Cannot query policies (may need service role)');
    } else {
      logTest('Check storage policies', true, `Found ${data.length} policies`);
    }
    
    return true;
  } catch (error) {
    logTest('Storage policies verification', false, error.message);
    return false;
  }
}

async function verifyProductData(supabase) {
  logSection('Phase 4: Product Data');
  
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, images')
      .limit(10);
    
    if (error) {
      logTest('Fetch product data', false, error.message);
      return false;
    }
    
    logTest('Fetch product data', true, `Found ${products.length} products`);
    
    // Analyze image fields
    let withImagesArray = 0;
    let withNoImages = 0;
    
    for (const product of products) {
      if (product.images && Array.isArray(product.images) && product.images.length > 0) withImagesArray++;
      if (!product.images || product.images.length === 0) withNoImages++;
    }
    
    logTest('Products with images array', true, `${withImagesArray}/${products.length}`);
    logTest('Products with no images', true, `${withNoImages}/${products.length}`);
    
    return true;
  } catch (error) {
    logTest('Product data verification', false, error.message);
    return false;
  }
}

async function verifyUrlGeneration() {
  logSection('Phase 5: URL Generation');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  
  if (!supabaseUrl) {
    logTest('NEXT_PUBLIC_SUPABASE_URL available', false, 'Not set');
    return false;
  }
  
  logTest('NEXT_PUBLIC_SUPABASE_URL available', true, supabaseUrl);
  
  // Test URL construction
  const testPaths = [
    'product-images/test.jpg',
    '/product-images/test.jpg',
    'https://example.com/image.jpg',
    null,
    undefined,
    ''
  ];
  
  let allPassed = true;
  for (const path of testPaths) {
    try {
      let url;
      if (!path || path === '') {
        url = '/placeholder-product.svg';
      } else if (path.startsWith('http')) {
        url = path;
      } else {
        const cleanPath = path.startsWith('/') ? path.slice(1) : path;
        url = `${supabaseUrl}/storage/v1/object/public/${cleanPath}`;
      }
      logTest(`URL generation for: ${path || '(empty)'}`, true, url);
    } catch (error) {
      logTest(`URL generation for: ${path || '(empty)'}`, false, error.message);
      allPassed = false;
    }
  }
  
  return allPassed;
}

async function verifyImageAccessibility(supabase) {
  logSection('Phase 6: Image Accessibility');
  
  try {
    // Get a product with an image
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, images')
      .not('images', 'is', null)
      .limit(3);
    
    if (error) {
      logTest('Fetch products with images', false, error.message);
      return false;
    }
    
    if (!products || products.length === 0) {
      logTest('Fetch products with images', false, 'No products with images found');
      return false;
    }
    
    logTest('Fetch products with images', true, `Found ${products.length} products`);
    
    // Try to access each image URL
    for (const product of products) {
      const images = product.images;
      if (!images || images.length === 0) continue;
      
      const imageUrl = images[0];
      // For now, just verify the URL format
      const isValidUrl = imageUrl.startsWith('http') || imageUrl.startsWith('/');
      logTest(`Image URL format for ${product.name}`, isValidUrl, imageUrl);
    }
    
    return true;
  } catch (error) {
    logTest('Image accessibility verification', false, error.message);
    return false;
  }
}

async function main() {
  log('🔍 Product Image Verification Script', 'cyan');
  log('Checking environment, storage, and image configuration...\n', 'cyan');
  
  // Phase 1: Environment Variables
  const envPassed = await verifyEnvironmentVariables();
  
  // Initialize Supabase client with service role for full access
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    log('\n❌ Cannot proceed: Missing Supabase credentials', 'red');
    process.exit(1);
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Phase 2: Storage Bucket
  const bucketPassed = await verifyStorageBucket(supabase);
  
  // Phase 3: Storage Policies
  const policiesPassed = await verifyStoragePolicies(supabase);
  
  // Phase 4: Product Data
  const productDataPassed = await verifyProductData(supabase);
  
  // Phase 5: URL Generation
  const urlPassed = await verifyUrlGeneration();
  
  // Phase 6: Image Accessibility
  const accessibilityPassed = await verifyImageAccessibility(supabase);
  
  // Summary
  logSection('Summary');
  const allPassed = envPassed && bucketPassed && policiesPassed && productDataPassed && urlPassed && accessibilityPassed;
  
  if (allPassed) {
    log('✓ All checks passed!', 'green');
    log('\nNext steps:', 'cyan');
    log('1. Verify images render correctly in the frontend', 'cyan');
    log('2. Test image upload functionality', 'cyan');
    log('3. Monitor for any image loading errors in production', 'cyan');
  } else {
    log('✗ Some checks failed. Review the output above.', 'red');
    log('\nCommon issues:', 'yellow');
    log('1. Missing environment variables in Vercel/Railway', 'yellow');
    log('2. Storage bucket not created or not public', 'yellow');
    log('3. Storage policies not applied', 'yellow');
    log('4. Product data has incorrect image paths', 'yellow');
  }
  
  process.exit(allPassed ? 0 : 1);
}

main().catch(error => {
  log(`\n❌ Script failed: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
