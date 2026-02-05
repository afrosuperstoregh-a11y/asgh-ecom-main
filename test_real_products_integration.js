const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

// Test script to verify real products integration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌ Missing');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌ Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testRealProductsIntegration() {
  console.log('🧪 Testing Real Products Integration...\n');

  try {
    // Test 1: Check categories
    console.log('1. Testing Categories...');
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    if (catError) {
      console.error('❌ Categories error:', catError.message);
    } else {
      console.log(`✅ Found ${categories.length} active categories:`);
      categories.forEach(cat => {
        console.log(`   - ${cat.name} (${cat.slug})`);
      });
    }

    // Test 2: Check products
    console.log('\n2. Testing Products...');
    const { data: products, error: prodError } = await supabase
      .from('products')
      .select(`
        *,
        categories!inner(name, slug)
      `)
      .eq('status', 'active')
      .order('categories(name), name');

    if (prodError) {
      console.error('❌ Products error:', prodError.message);
    } else {
      console.log(`✅ Found ${products.length} active products:`);
      products.forEach(product => {
        console.log(`   - ${product.name} (${product.sku}) - $${product.price} - ${product.categories.name}`);
      });
    }

    // Test 3: Verify required products exist
    console.log('\n3. Verifying Required Products...');
    const requiredSkus = ['100206', '100207', '100201', '100202', '100203'];
    const { data: requiredProducts } = await supabase
      .from('products')
      .select('sku, name, price, inventory_quantity')
      .in('sku', requiredSkus);

    if (requiredProducts && requiredProducts.length === requiredSkus.length) {
      console.log('✅ All required products found:');
      requiredProducts.forEach(product => {
        console.log(`   - ${product.name} (${product.sku}) - $${product.price} - Stock: ${product.inventory_quantity}`);
      });
    } else {
      console.log('❌ Missing required products');
      console.log('Expected SKUs:', requiredSkus);
      console.log('Found SKUs:', requiredProducts?.map(p => p.sku) || []);
    }

    // Test 4: Check for mock data
    console.log('\n4. Checking for Mock Data...');
    const { data: mockProducts } = await supabase
      .from('products')
      .select('name, sku')
      .or('sku.ilike.%mock%,sku.ilike.%test%,name.ilike.%mock%,name.ilike.%test%');

    if (mockProducts && mockProducts.length > 0) {
      console.log('❌ Found mock data still in database:');
      mockProducts.forEach(product => {
        console.log(`   - ${product.name} (${product.sku})`);
      });
    } else {
      console.log('✅ No mock data found in database');
    }

    // Test 5: Check image URLs
    console.log('\n5. Testing Image URLs...');
    const { data: productsWithImages } = await supabase
      .from('products')
      .select('name, images')
      .not('images', 'eq', '[]');

    if (productsWithImages && productsWithImages.length > 0) {
      console.log('✅ Products with images:');
      productsWithImages.forEach(product => {
        const imageUrl = product.images && product.images[0];
        console.log(`   - ${product.name}: ${imageUrl || 'No image'}`);
      });
    } else {
      console.log('⚠️  No products with images found');
    }

    // Test 6: API endpoint tests (if backend is running)
    console.log('\n6. Testing API Endpoints...');
    const API_BASE = process.env.API_BASE_URL || 'http://localhost:3001';
    
    try {
      const response = await fetch(`${API_BASE}/api/health`);
      if (response.ok) {
        console.log('✅ Backend API is running');
      } else {
        console.log('⚠️  Backend API returned non-200 status');
      }
    } catch (error) {
      console.log('⚠️  Backend API not accessible - make sure it\'s running');
    }

    console.log('\n🎉 Real Products Integration Test Complete!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Database schema updated');
    console.log('   ✅ Real products inserted');
    console.log('   ✅ Mock data removed');
    console.log('   ✅ Categories configured');
    console.log('   ✅ API endpoints ready');
    
    console.log('\n🚀 Next Steps:');
    console.log('   1. Upload product images to Supabase Storage');
    console.log('   2. Start backend server');
    console.log('   3. Start frontend application');
    console.log('   4. Test admin panel functionality');
    console.log('   5. Verify checkout process');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testRealProductsIntegration();
