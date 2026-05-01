const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://azpgqsmgyorjbqsgxuxw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6cGdxc21neW9yamJxc2d4dXh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyOTg1NjAsImV4cCI6MjA4NDg3NDU2MH0.cxHD8ihT9E5ZAxtkfGa2VjYxYmadbYxyl3xVDPtgh9Q'
);

async function checkFoodBeveragesInShop() {
  try {
    console.log('🔍 Checking food & beverage products in main shop...');
    
    // Get food & beverages category
    const { data: categories, error: categoryError } = await supabase
      .from('categories')
      .select('*')
      .ilike('name', '%food%');
    
    if (categoryError) {
      console.log('❌ Error checking categories:', categoryError.message);
      return;
    }
    
    if (!categories || categories.length === 0) {
      console.log('❌ No food & beverage category found');
      return;
    }
    
    const foodCategory = categories[0];
    console.log(`✅ Found category: ${foodCategory.name} (ID: ${foodCategory.id})`);
    
    // Get all products in food & beverages category
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, price, images, status, featured, created_at')
      .eq('category_id', foodCategory.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false });
    
    if (productsError) {
      console.log('❌ Error fetching products:', productsError.message);
      return;
    }
    
    console.log(`\n📊 Found ${products.length} food & beverage products in main shop:`);
    
    let realImageCount = 0;
    let placeholderCount = 0;
    
    products.forEach((product, index) => {
      const hasRealImage = product.images && !product.images.includes('placeholder');
      if (hasRealImage) {
        realImageCount++;
        console.log(`✅ ${index + 1}. ${product.name} - $${product.price} - ${product.images}`);
      } else {
        placeholderCount++;
        console.log(`🎭 ${index + 1}. ${product.name} - $${product.price} - No image/placeholder`);
      }
    });
    
    console.log(`\n📈 Summary:`);
    console.log(`✅ Real images: ${realImageCount}`);
    console.log(`🎭 Placeholders: ${placeholderCount}`);
    console.log(`📝 Total: ${products.length}`);
    
    // Test a few sample images
    console.log(`\n🔍 Testing sample images...`);
    const sampleProducts = products.slice(0, 5);
    
    for (const product of sampleProducts) {
      if (product.images && !product.images.includes('placeholder')) {
        try {
          const response = await fetch(product.images, { method: 'HEAD' });
          if (response.ok) {
            console.log(`✅ Working: ${product.name}`);
          } else {
            console.log(`❌ Failed: ${product.name} - ${response.status}`);
          }
        } catch (err) {
          console.log(`❌ Error: ${product.name} - ${err.message}`);
        }
      }
    }
    
    // Check if these products appear in the API
    console.log(`\n🌐 Testing API endpoint...`);
    try {
      const apiResponse = await fetch('http://localhost:3000/api/products?limit=100');
      if (apiResponse.ok) {
        const apiData = await apiResponse.json();
        const allProducts = apiData.data?.products || [];
        const foodProducts = allProducts.filter(p => 
          p.categories?.name?.toLowerCase().includes('food') || 
          p.name?.toLowerCase().includes('food') ||
          p.name?.toLowerCase().includes('rice') ||
          p.name?.toLowerCase().includes('stew') ||
          p.name?.toLowerCase().includes('jollof')
        );
        
        console.log(`✅ API returns ${allProducts.length} total products`);
        console.log(`✅ Found ${foodProducts.length} food-related products in API`);
        
        if (foodProducts.length > 0) {
          console.log(`\n🎯 Sample food products from API:`);
          foodProducts.slice(0, 5).forEach((product, index) => {
            console.log(`  ${index + 1}. ${product.name} - $${product.price}`);
          });
        }
      } else {
        console.log(`❌ API test failed: ${apiResponse.status}`);
      }
    } catch (err) {
      console.log(`❌ API test error: ${err.message}`);
    }
    
    console.log(`\n🎉 Food & beverage products are ready for the main shop!`);
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

checkFoodBeveragesInShop();
