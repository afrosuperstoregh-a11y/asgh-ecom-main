const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://azpgqsmgyorjbqsgxuxw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6cGdxc21neW9yamJxc2d4dXh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyOTg1NjAsImV4cCI6MjA4NDg3NDU2MH0.cxHD8ihT9E5ZAxtkfGa2VjYxYmadbYxyl3xVDPtgh9Q';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProductImages() {
  try {
    console.log('🔍 Checking product images...');
    
    // Get a sample of products with their images
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        id,
        name,
        images,
        category_id,
        categories (
          id,
          name
        )
      `)
      .limit(20);
    
    if (error) {
      console.error('❌ Error fetching products:', error);
      return;
    }
    
    console.log(`📊 Found ${products.length} products`);
    
    for (const product of products) {
      console.log(`\n📦 Product: ${product.name}`);
      console.log(`   ID: ${product.id}`);
      console.log(`   Category: ${product.categories?.name || 'No category'}`);
      console.log(`   Images:`, product.images);
      
      if (product.images && Array.isArray(product.images)) {
        product.images.forEach((image, index) => {
          console.log(`     [${index}]: ${image}`);
        });
      } else {
        console.log(`   ❌ No images array or empty`);
      }
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkProductImages();
