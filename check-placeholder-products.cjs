const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://azpgqsmgyorjbqsgxuxw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6cGdxc21neW9yamJxc2d4dXh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyOTg1NjAsImV4cCI6MjA4NDg3NDU2MH0.cxHD8ihT9E5ZAxtkfGa2VjYxYmadbYxyl3xVDPtgh9Q'
);

async function checkPlaceholderProducts() {
  try {
    console.log('🔍 Checking which food & beverage products use placeholder images...');
    
    // Get all products in food & beverages category
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, images, price, status')
      .eq('status', 'active')
      .ilike('name', '%food%')
      .or('name.ilike.%rice%,name.ilike.%stew%,name.ilike.%jollof%,name.ilike.%kenkey%,name.ilike.%waakye%')
      .order('name');
    
    if (productsError) {
      console.log('❌ Error fetching products:', productsError.message);
      return;
    }
    
    console.log(`📊 Found ${products.length} food-related products:`);
    
    const placeholderProducts = [];
    const realImageProducts = [];
    
    for (const product of products) {
      const imageUrl = product.images;
      
      if (!imageUrl || imageUrl.includes('placeholder')) {
        placeholderProducts.push(product);
        console.log(`🎭 Placeholder: ${product.name} - $${product.price}`);
      } else {
        // Test if the image actually works
        try {
          const response = await fetch(imageUrl, { method: 'HEAD' });
          if (response.ok) {
            realImageProducts.push(product);
            console.log(`✅ Real image: ${product.name} - $${product.price}`);
          } else {
            placeholderProducts.push(product);
            console.log(`❌ Broken image: ${product.name} - $${product.price}`);
          }
        } catch (err) {
          placeholderProducts.push(product);
          console.log(`❌ Error testing: ${product.name} - $${product.price}`);
        }
      }
    }
    
    console.log(`\n📈 Summary:`);
    console.log(`✅ Real images: ${realImageProducts.length}`);
    console.log(`🎭 Placeholders/Broken: ${placeholderProducts.length}`);
    console.log(`📝 Total: ${products.length}`);
    
    if (placeholderProducts.length > 0) {
      console.log(`\n🎯 Products that need real images:`);
      placeholderProducts.forEach((product, index) => {
        console.log(`  ${index + 1}. ${product.name} - $${product.price} - Current: ${product.images || 'No image'}`);
      });
    }
    
    return { placeholderProducts, realImageProducts };
    
  } catch (error) {
    console.log('❌ Error:', error.message);
    return { placeholderProducts: [], realImageProducts: [] };
  }
}

checkPlaceholderProducts();
