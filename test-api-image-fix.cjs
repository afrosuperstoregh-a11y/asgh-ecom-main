async function testAPIImageFix() {
  try {
    console.log('🔍 Testing API image URL fix for food & beverage products...');
    
    // Test the products API
    const apiUrl = 'http://localhost:3000/api/products?limit=100';
    
    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        console.log(`❌ API request failed: ${response.status}`);
        return;
      }
      
      const data = await response.json();
      const products = data.data?.products || [];
      
      console.log(`📊 API returned ${products.length} products`);
      
      // Find food & beverage products
      const foodBeverageProducts = products.filter(p => 
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
      
      console.log(`\n🍽️ Found ${foodBeverageProducts.length} food & beverage products in API:`);
      
      const workingImages = [];
      const brokenImages = [];
      
      for (const product of foodBeverageProducts) {
        const imageUrl = Array.isArray(product.images) ? product.images[0] : product.images;
        
        if (!imageUrl || imageUrl.includes('placeholder')) {
          brokenImages.push({ name: product.name, image: imageUrl || 'No image' });
          console.log(`🎭 Placeholder: ${product.name} - ${imageUrl || 'No image'}`);
        } else {
          // Test the image URL
          try {
            const response = await fetch(imageUrl, { method: 'HEAD' });
            if (response.ok) {
              workingImages.push({ name: product.name, image: imageUrl });
              console.log(`✅ Working: ${product.name} - ${imageUrl}`);
            } else {
              brokenImages.push({ name: product.name, image: imageUrl });
              console.log(`❌ Broken: ${product.name} - ${imageUrl} (${response.status})`);
            }
          } catch (err) {
            brokenImages.push({ name: product.name, image: imageUrl });
            console.log(`❌ Error: ${product.name} - ${imageUrl} - ${err.message}`);
          }
        }
      }
      
      console.log(`\n📈 API Summary:`);
      console.log(`✅ Working images: ${workingImages.length}`);
      console.log(`❌ Broken/Placeholders: ${brokenImages.length}`);
      console.log(`📝 Total food & beverage: ${foodBeverageProducts.length}`);
      
      if (brokenImages.length > 0) {
        console.log(`\n🎯 Products still needing fixes:`);
        brokenImages.forEach((product, index) => {
          console.log(`  ${index + 1}. ${product.name} - ${product.image}`);
        });
      } else {
        console.log(`\n🎉 All food & beverage products have working images in API!`);
      }
      
      // Check specifically for Banku Flour and Banku Mix
      const bankuProducts = foodBeverageProducts.filter(p => 
        p.name.toLowerCase().includes('banku')
      );
      
      console.log(`\n🔍 Banku products in API (${bankuProducts.length}):`);
      bankuProducts.forEach((product, index) => {
        const imageUrl = Array.isArray(product.images) ? product.images[0] : product.images;
        const isWorking = imageUrl && !imageUrl.includes('food&beverages/') && !imageUrl.includes('placeholder');
        console.log(`  ${index + 1}. ${product.name} - $${product.price} - ${isWorking ? '✅' : '❌'}`);
        if (!isWorking) {
          console.log(`     Image: ${imageUrl}`);
        }
      });
      
    } catch (err) {
      console.log(`❌ API test error: ${err.message}`);
      console.log(`💡 Note: Make sure the development server is running on localhost:3000`);
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

testAPIImageFix();
