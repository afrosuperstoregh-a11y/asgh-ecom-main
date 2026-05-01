const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://azpgqsmgyorjbqsgxuxw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6cGdxc21neW9yamJxc2d4dXh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyOTg1NjAsImV4cCI6MjA4NDg3NDU2MH0.cxHD8ihT9E5ZAxtkfGa2VjYxYmadbYxyl3xVDPtgh9Q'
);

async function checkAllProductsImages() {
  try {
    console.log('🔍 Checking all products for image status...');
    
    // Get all active products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, images, price, status, category_id')
      .eq('status', 'active')
      .order('name')
      .limit(100);
    
    if (productsError) {
      console.log('❌ Error fetching products:', productsError.message);
      return;
    }
    
    console.log(`📊 Found ${products.length} active products:`);
    
    const placeholderProducts = [];
    const realImageProducts = [];
    const foodBeverageProducts = [];
    
    for (const product of products) {
      const imageUrl = product.images;
      const isFoodBeverage = product.name.toLowerCase().includes('food') || 
                           product.name.toLowerCase().includes('rice') ||
                           product.name.toLowerCase().includes('stew') ||
                           product.name.toLowerCase().includes('jollof') ||
                           product.name.toLowerCase().includes('kenkey') ||
                           product.name.toLowerCase().includes('waakye') ||
                           product.name.toLowerCase().includes('banku') ||
                           product.name.toLowerCase().includes('shito') ||
                           product.name.toLowerCase().includes('gari') ||
                           product.name.toLowerCase().includes('kelewele') ||
                           product.name.toLowerCase().includes('plantain') ||
                           product.name.toLowerCase().includes('soup') ||
                           product.name.toLowerCase().includes('egusi') ||
                           product.name.toLowerCase().includes('fufu');
      
      if (isFoodBeverage) {
        foodBeverageProducts.push(product);
      }
      
      if (!imageUrl || imageUrl.includes('placeholder')) {
        placeholderProducts.push(product);
        console.log(`🎭 Placeholder: ${product.name} - $${product.price} - Category: ${product.category_id}`);
      } else {
        // Test if the image actually works
        try {
          const response = await fetch(imageUrl, { method: 'HEAD' });
          if (response.ok) {
            realImageProducts.push(product);
            if (isFoodBeverage) {
              console.log(`✅ Food image: ${product.name} - $${product.price} - ${imageUrl}`);
            }
          } else {
            placeholderProducts.push(product);
            console.log(`❌ Broken image: ${product.name} - $${product.price} - ${imageUrl}`);
          }
        } catch (err) {
          placeholderProducts.push(product);
          console.log(`❌ Error testing: ${product.name} - $${product.price} - ${imageUrl}`);
        }
      }
    }
    
    console.log(`\n📈 Summary:`);
    console.log(`✅ Real images: ${realImageProducts.length}`);
    console.log(`🎭 Placeholders/Broken: ${placeholderProducts.length}`);
    console.log(`🍽️ Food & beverage: ${foodBeverageProducts.length}`);
    console.log(`📝 Total: ${products.length}`);
    
    // Focus on food & beverage products that need images
    const foodPlaceholders = placeholderProducts.filter(p => 
      p.name.toLowerCase().includes('food') || 
      p.name.toLowerCase().includes('rice') ||
      p.name.toLowerCase().includes('stew') ||
      p.name.toLowerCase().includes('jollof') ||
      p.name.toLowerCase().includes('kenkey') ||
      p.name.toLowerCase().includes('waakye') ||
      p.name.toLowerCase().includes('banku') ||
      p.name.toLowerCase().includes('shito') ||
      p.name.toLowerCase().includes('gari') ||
      p.name.toLowerCase().includes('kelewele') ||
      p.name.toLowerCase().includes('plantain') ||
      p.name.toLowerCase().includes('soup') ||
      p.name.toLowerCase().includes('egusi') ||
      p.name.toLowerCase().includes('fufu')
    );
    
    if (foodPlaceholders.length > 0) {
      console.log(`\n🎯 Food & beverage products that need real images (${foodPlaceholders.length}):`);
      foodPlaceholders.forEach((product, index) => {
        console.log(`  ${index + 1}. ${product.name} - $${product.price} - Current: ${product.images || 'No image'}`);
      });
    }
    
    return { placeholderProducts, realImageProducts, foodBeverageProducts, foodPlaceholders };
    
  } catch (error) {
    console.log('❌ Error:', error.message);
    return { placeholderProducts: [], realImageProducts: [], foodBeverageProducts: [], foodPlaceholders: [] };
  }
}

checkAllProductsImages();
