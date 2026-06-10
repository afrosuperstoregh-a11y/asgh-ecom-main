const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lljxxaejmueoxsaqaowf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxsanh4YWVqbXVlb3hzYXFhb3dmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyOTg1NjAsImV4cCI6MjA4NDg3NDU2MH0.cxHD8ihT9E5ZAxtkfGa2VjYxYmadbYxyl3xVDPtgh9Q';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testApiImageUrls() {
  try {
    console.log('🔍 Testing API image URLs...\n');
    
    // Test products API
    console.log('Testing /api/products endpoint...');
    const productsResponse = await fetch('http://localhost:3000/api/products?limit=5');
    const productsData = await productsResponse.json();
    
    if (productsData.success && productsData.data?.products) {
      console.log(`✅ Products API returned ${productsData.data.products.length} products\n`);
      
      productsData.data.products.slice(0, 3).forEach((product, index) => {
        console.log(`Product ${index + 1}: ${product.name}`);
        console.log(`  Images: ${JSON.stringify(product.images)}`);
        console.log(`  Image URL: ${product.image_url}`);
        console.log(`  Image: ${product.image}`);
        
        // Check for problematic characters
        const allImages = [...(product.images || []), product.image_url, product.image];
        allImages.forEach(img => {
          if (img && (img.includes('[') || img.includes(']') || img.includes('undefined'))) {
            console.log(`  ⚠️  PROBLEMATIC IMAGE: ${img}`);
          }
        });
        console.log('');
      });
    } else {
      console.log('❌ Products API failed or returned unexpected data');
    }
    
    // Test categories API
    console.log('\nTesting /api/categories endpoint...');
    const categoriesResponse = await fetch('http://localhost:3000/api/categories');
    const categoriesData = await categoriesResponse.json();
    
    if (categoriesData.success && categoriesData.data) {
      console.log(`✅ Categories API returned ${categoriesData.data.length} categories\n`);
      
      categoriesData.data.slice(0, 3).forEach((category, index) => {
        console.log(`Category ${index + 1}: ${category.name}`);
        console.log(`  Image URL: ${category.image_url}`);
        
        // Check for problematic characters
        if (category.image_url && (category.image_url.includes('[') || category.image_url.includes(']') || category.image_url.includes('undefined'))) {
          console.log(`  ⚠️  PROBLEMATIC IMAGE: ${category.image_url}`);
        }
        console.log('');
      });
    } else {
      console.log('❌ Categories API failed or returned unexpected data');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testApiImageUrls();
