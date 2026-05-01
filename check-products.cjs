const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://azpgqsmgyorjbqsgxuxw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6cGdxc21neW9yamJxc2d4dXh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyOTg1NjAsImV4cCI6MjA4NDg3NDU2MH0.cxHD8ihT9E5ZAxtkfGa2VjYxYmadbYxyl3xVDPtgh9Q'
);

async function checkProducts() {
  try {
    console.log('🔍 Checking products table for existing images...');
    
    const { data, error } = await supabase
      .from('products')
      .select('id, name, image_url, images')
      .limit(20);
    
    if (error) {
      console.log('❌ Error fetching products:', error.message);
      return;
    }
    
    console.log(`📊 Found ${data.length} products:`);
    
    let productsWithImages = 0;
    data.forEach(product => {
      if (product.image_url || (product.images && product.images.length > 0)) {
        productsWithImages++;
        console.log(`✅ ${product.name}:`);
        if (product.image_url) {
          console.log(`   Main image: ${product.image_url}`);
        }
        if (product.images && product.images.length > 0) {
          console.log(`   Images array: ${product.images.join(', ')}`);
        }
      } else {
        console.log(`❌ ${product.name}: No images`);
      }
    });
    
    console.log(`\n📈 Summary: ${productsWithImages}/${data.length} products have images`);
    
  } catch (err) {
    console.log('❌ Error:', err.message);
  }
}

checkProducts();
