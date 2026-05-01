async function debugShopAPI() {
  try {
    console.log('🔍 Debugging shop API to check food & beverage products...');
    
    // Test the products API
    const apiUrl = 'http://localhost:3000/api/products?limit=100';
    
    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        console.log(`❌ API request failed: ${response.status}`);
        return;
      }
      
      const data = await response.json();
      console.log('📊 API Response Structure:', {
        success: data.success,
        hasData: !!data.data,
        productsCount: data.data?.products?.length,
        categoriesCount: data.data?.categories?.length
      });
      
      const products = data.data?.products || [];
      console.log(`\n📦 Total products returned: ${products.length}`);
      
      // Find food & beverage products
      const foodBeverageProducts = products.filter(p => {
        const name = (p.name || '').toLowerCase();
        const category = (p.categories?.name || '').toLowerCase();
        
        return name.includes('food') || 
               name.includes('rice') ||
               name.includes('stew') ||
               name.includes('jollof') ||
               name.includes('kenkey') ||
               name.includes('waakye') ||
               name.includes('banku') ||
               name.includes('shito') ||
               name.includes('gari') ||
               name.includes('kelewele') ||
               name.includes('plantain') ||
               name.includes('soup') ||
               name.includes('egusi') ||
               name.includes('fufu') ||
               category.includes('food') ||
               category.includes('beverage');
      });
      
      console.log(`\n🍽️ Food & beverage products found: ${foodBeverageProducts.length}`);
      
      if (foodBeverageProducts.length > 0) {
        console.log('\n📋 Food & beverage products:');
        foodBeverageProducts.forEach((product, index) => {
          console.log(`  ${index + 1}. ${product.name} - $${product.price}`);
          console.log(`     Category: ${product.categories?.name || 'No category'}`);
          console.log(`     Image: ${product.images?.[0] || product.image || 'No image'}`);
        });
      } else {
        console.log('\n❌ No food & beverage products found in API response');
        
        // Check all categories available
        const allCategories = [...new Set(products.map(p => p.categories?.name).filter(Boolean))];
        console.log('\n📂 Available categories:', allCategories);
        
        // Check if there are any products with food-related names
        const foodRelatedNames = products.filter(p => {
          const name = (p.name || '').toLowerCase();
          return name.includes('rice') || name.includes('stew') || name.includes('jollof') || name.includes('kenkey');
        });
        
        if (foodRelatedNames.length > 0) {
          console.log(`\n🔍 Found ${foodRelatedNames.length} products with food-related names but no category filter:`);
          foodRelatedNames.forEach((product, index) => {
            console.log(`  ${index + 1}. ${product.name} - Category: ${product.categories?.name || 'No category'}`);
          });
        }
      }
      
      // Test category filter specifically
      console.log('\n🔍 Testing category filter for food & beverages...');
      const categoryApiUrl = 'http://localhost:3000/api/products?category=food-beverages&limit=20';
      
      try {
        const categoryResponse = await fetch(categoryApiUrl);
        if (categoryResponse.ok) {
          const categoryData = await categoryResponse.json();
          const categoryProducts = categoryData.data?.products || [];
          console.log(`📂 Category filter returned: ${categoryProducts.length} products`);
          
          if (categoryProducts.length > 0) {
            console.log('📋 Products in food-beverages category:');
            categoryProducts.forEach((product, index) => {
              console.log(`  ${index + 1}. ${product.name} - $${product.price}`);
            });
          }
        } else {
          console.log(`❌ Category filter failed: ${categoryResponse.status}`);
        }
      } catch (err) {
        console.log(`❌ Category filter error: ${err.message}`);
      }
      
    } catch (err) {
      console.log(`❌ API test error: ${err.message}`);
      console.log(`💡 Note: Make sure the development server is running on localhost:3000`);
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

debugShopAPI();
