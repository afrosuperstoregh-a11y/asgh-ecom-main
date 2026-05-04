const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://azpgqsmgyorjbqsgxuxw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6cGdxc21neW9yamJxc2d4dXh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyOTg1NjAsImV4cCI6MjA4NDg3NDU2MH0.cxHD8ihT9E5ZAxtkfGa2VjYxYmadbYxyl3xVDPtgh9Q';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSpecificProducts() {
  try {
    console.log('🔍 Checking specific products mentioned by user...');
    
    const productNames = [
      'Vegetables & Bake Beans',
      'Banku Mix', 
      'Barbeque',
      'Cabbage Stew',
      'Chicken',
      'Jollof Rice, Plantain Vegetables & Chicken',
      'Meat Pie',
      'Neat Fufu',
      'Pasta',
      'Rice with Green Pea',
      'Boys Dashiki',
      'Girls Dashiki'
    ];
    
    for (const productName of productNames) {
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
        .ilike('name', `%${productName}%`);
      
      if (error) {
        console.error(`❌ Error fetching ${productName}:`, error);
        continue;
      }
      
      if (products.length === 0) {
        console.log(`❌ Product not found: "${productName}"`);
        continue;
      }
      
      for (const product of products) {
        console.log(`\n📦 Product: ${product.name}`);
        console.log(`   ID: ${product.id}`);
        console.log(`   Category: ${product.categories?.name || 'No category'}`);
        console.log(`   Images:`, product.images);
        
        if (product.images && Array.isArray(product.images) && product.images.length > 0) {
          product.images.forEach((image, index) => {
            console.log(`     [${index}]: ${image}`);
            
            // Test if the image URL is accessible
            if (image.startsWith('http')) {
              console.log(`       ✅ Full URL format`);
            } else {
              console.log(`       ⚠️  Relative path format - needs conversion`);
            }
          });
        } else {
          console.log(`   ❌ No images array or empty`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkSpecificProducts();
