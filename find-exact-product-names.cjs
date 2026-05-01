const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://azpgqsmgyorjbqsgxuxw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6cGdxc21neW9yamJxc2d4dXh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyOTg1NjAsImV4cCI6MjA4NDg3NDU2MH0.cxHD8ihT9E5ZAxtkfGa2VjYxYmadbYxyl3xVDPtgh9Q'
);

async function findExactProductNames() {
  try {
    console.log('🔍 Finding exact product names for Banku Flour and Banku Mix...');
    
    // Search for products containing 'banku'
    const { data: bankuProducts, error: bankuError } = await supabase
      .from('products')
      .select('id, name, images, price, status')
      .eq('status', 'active')
      .ilike('name', '%banku%')
      .order('name');
    
    if (bankuError) {
      console.log('❌ Error finding banku products:', bankuError.message);
      return;
    }
    
    console.log(`\n📊 Found ${bankuProducts.length} products with 'banku' in name:`);
    
    bankuProducts.forEach((product, index) => {
      console.log(`  ${index + 1}. "${product.name}" - $${product.price}`);
      console.log(`     ID: ${product.id}`);
      console.log(`     Image: ${product.images}`);
      
      // Test the current image
      if (product.images && !product.images.includes('placeholder')) {
        fetch(product.images, { method: 'HEAD' })
          .then(response => {
            if (response.ok) {
              console.log(`     ✅ Image works`);
            } else {
              console.log(`     ❌ Image broken (${response.status})`);
            }
          })
          .catch(err => {
            console.log(`     ❌ Image error: ${err.message}`);
          });
      } else {
        console.log(`     🎭 Placeholder or no image`);
      }
      console.log('');
    });
    
    // Identify which ones need replacement
    const needReplacement = bankuProducts.filter(product => 
      !product.images || 
      product.images.includes('placeholder') ||
      (product.images && product.images.includes('food&beverages/banku-'))
    );
    
    console.log(`\n🎯 Products that need image replacement (${needReplacement.length}):`);
    needReplacement.forEach((product, index) => {
      console.log(`  ${index + 1}. "${product.name}" - $${product.price}`);
      console.log(`     Current: ${product.images || 'No image'}`);
    });
    
    // Suggest working replacements
    const workingReplacements = {
      'Banku Flour': 'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/food%26beverages/banku-flour.jpg',
      'Banku Mix': 'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/food%26beverages/banku-mix.png',
      'Banku With Tilapia 1': 'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/food%26beverages/banku-with-tilapia-1.jpg',
      'Banku With Tilapia 2': 'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/food%26beverages/banku-with-tilapia-2.jpg'
    };
    
    console.log(`\n💡 Suggested replacements:`);
    needReplacement.forEach((product, index) => {
      const replacement = workingReplacements[product.name];
      if (replacement) {
        console.log(`  ${index + 1}. "${product.name}" → ${replacement}`);
      } else {
        console.log(`  ${index + 1}. "${product.name}" → No direct replacement found`);
      }
    });
    
    return { bankuProducts, needReplacement, workingReplacements };
    
  } catch (error) {
    console.log('❌ Error:', error.message);
    return { bankuProducts: [], needReplacement: [], workingReplacements: {} };
  }
}

findExactProductNames();
