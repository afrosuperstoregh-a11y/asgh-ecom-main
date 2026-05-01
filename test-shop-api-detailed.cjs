async function testShopAPIDetailed() {
  try {
    console.log('🔍 Detailed test of shop API for food & beverage products...');
    
    // Test 1: Check all products without category filter
    console.log('\n=== TEST 1: All Products ===');
    try {
      const allResponse = await fetch('http://localhost:3000/api/products?limit=100');
      if (allResponse.ok) {
        const allData = await allResponse.json();
        const allProducts = allData.data?.products || [];
        console.log(`✅ All products: ${allProducts.length}`);
        
        // Find food-related products in all results
        const foodRelatedProducts = allProducts.filter(p => {
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
        
        console.log(`🍽️ Food-related products in all results: ${foodRelatedProducts.length}`);
        
        if (foodRelatedProducts.length > 0) {
          console.log('Sample food products:');
          foodRelatedProducts.slice(0, 5).forEach((product, index) => {
            console.log(`  ${index + 1}. ${product.name} - Category: ${product.categories?.name || 'None'} - $${product.price}`);
          });
        }
      } else {
        console.log(`❌ All products request failed: ${allResponse.status}`);
      }
    } catch (err) {
      console.log(`❌ All products error: ${err.message}`);
    }
    
    // Test 2: Check food-beverages category specifically
    console.log('\n=== TEST 2: Food & Beverages Category ===');
    try {
      const foodResponse = await fetch('http://localhost:3000/api/products?category=food-beverages&limit=100');
      console.log(`Status: ${foodResponse.status}`);
      
      if (foodResponse.ok) {
        const foodData = await foodResponse.json();
        const foodProducts = foodData.data?.products || [];
        console.log(`✅ Food & beverages category returned: ${foodProducts.length} products`);
        
        if (foodProducts.length > 0) {
          console.log('Products in food-beverages category:');
          foodProducts.forEach((product, index) => {
            console.log(`  ${index + 1}. ${product.name} - Category: ${product.categories?.name || 'None'} - $${product.price}`);
          });
        } else {
          console.log('❌ No products returned for food-beverages category');
        }
      } else {
        console.log(`❌ Food & beverages request failed: ${foodResponse.status}`);
        const errorText = await foodResponse.text();
        console.log(`Error details: ${errorText}`);
      }
    } catch (err) {
      console.log(`❌ Food & beverages error: ${err.message}`);
    }
    
    // Test 3: Check if the server is running and get logs
    console.log('\n=== TEST 3: Server Status Check ===');
    try {
      const healthResponse = await fetch('http://localhost:3000/api/health');
      if (healthResponse.ok) {
        console.log('✅ Server is running');
      } else {
        console.log('❌ Server health check failed');
      }
    } catch (err) {
      console.log('❌ Server not responding - make sure dev server is running');
    }
    
    // Test 4: Check with different category slugs
    console.log('\n=== TEST 4: Alternative Category Slugs ===');
    const alternativeSlugs = ['food', 'beverages', 'food-and-beverages', 'food_beverages'];
    
    for (const slug of alternativeSlugs) {
      try {
        const response = await fetch(`http://localhost:3000/api/products?category=${slug}&limit=10`);
        if (response.ok) {
          const data = await response.json();
          const products = data.data?.products || [];
          console.log(`📂 Category "${slug}": ${products.length} products`);
        } else {
          console.log(`❌ Category "${slug}" failed: ${response.status}`);
        }
      } catch (err) {
        console.log(`❌ Category "${slug}" error: ${err.message}`);
      }
    }
    
  } catch (error) {
    console.log('❌ Test error:', error.message);
  }
}

testShopAPIDetailed();
