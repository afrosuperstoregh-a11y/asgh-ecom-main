// Test Supabase Connection and Data
// Run this script to verify your Supabase integration

const { createClient } = require('@supabase/supabase-js');

// Configuration from your .env file
const supabaseUrl = 'https://lljxxaejmueoxsaqaowf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxsanh4YWVqbXVlb3hzYXFhb3dmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxMDgyMjEsImV4cCI6MjA5MzY4NDIyMX0.LM2zS7a7utqqtU5DN4ADy7uCzugnshNAfG8a4gPlQfk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase Connection...\n');
  
  try {
    // Test 1: Basic connection
    console.log('1. Testing basic connection...');
    const { data, error } = await supabase.from('products').select('count').single();
    
    if (error) {
      console.error('❌ Connection failed:', error.message);
      return;
    }
    
    console.log('✅ Connection successful!\n');
    
    // Test 2: Check products table
    console.log('2. Checking products table...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, slug, status, featured, price')
      .limit(5);
    
    if (productsError) {
      console.error('❌ Products table error:', productsError.message);
    } else {
      console.log(`✅ Found ${products.length} sample products:`);
      products.forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.name} (${product.status}) - $${product.price}`);
      });
    }
    
    console.log('');
    
    // Test 3: Check categories table
    console.log('3. Checking categories table...');
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('id, name, slug, is_active')
      .limit(5);
    
    if (categoriesError) {
      console.error('❌ Categories table error:', categoriesError.message);
    } else {
      console.log(`✅ Found ${categories.length} categories:`);
      categories.forEach((category, index) => {
        console.log(`   ${index + 1}. ${category.name} (${category.is_active ? 'Active' : 'Inactive'})`);
      });
    }
    
    console.log('');
    
    // Test 4: Check active products count
    console.log('4. Counting active products...');
    const { data: activeProducts, error: activeError } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active');
    
    if (activeError) {
      console.error('❌ Active products count error:', activeError.message);
    } else {
      console.log(`✅ Found ${activeProducts.length} active products`);
    }
    
    console.log('');
    
    // Test 5: Check featured products
    console.log('5. Checking featured products...');
    const { data: featuredProducts, error: featuredError } = await supabase
      .from('products')
      .select('id, name, featured')
      .eq('featured', true)
      .eq('status', 'active')
      .limit(3);
    
    if (featuredError) {
      console.error('❌ Featured products error:', featuredError.message);
    } else {
      console.log(`✅ Found ${featuredProducts.length} featured products:`);
      featuredProducts.forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.name}`);
      });
    }
    
    console.log('\n🎉 Supabase connection test completed successfully!');
    
    // Recommendations
    console.log('\n📋 Recommendations:');
    if (products.length === 0) {
      console.log('⚠️  No products found. Consider adding sample products to test the frontend.');
    }
    if (categories.length === 0) {
      console.log('⚠️  No categories found. Consider adding sample categories.');
    }
    if (activeProducts.length === 0) {
      console.log('⚠️  No active products found. Make sure some products have status = "active".');
    }
    if (featuredProducts.length === 0) {
      console.log('⚠️  No featured products found. Set featured = true for some products to test homepage.');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

// Run the test
testSupabaseConnection();
