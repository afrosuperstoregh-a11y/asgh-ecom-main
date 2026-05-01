const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://azpgqsmgyorjbqsgxuxw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6cGdxc21neW9yamJxc2d4dXh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyOTg1NjAsImV4cCI6MjA4NDg3NDU2MH0.cxHD8ihT9E5ZAxtkfGa2VjYxYmadbYxyl3xVDPtgh9Q'
);

async function checkAllImages() {
  try {
    console.log('🔍 Checking all products with images...');
    
    const { data, error } = await supabase
      .from('products')
      .select('id, name, images, status')
      .eq('status', 'active')
      .not('images', 'is', null);
    
    if (error) {
      console.log('❌ Error:', error.message);
      return;
    }
    
    console.log(`📊 Found ${data.length} products with images:`);
    
    const foodRelatedProducts = [];
    const allImages = [];
    
    data.forEach(product => {
      console.log(`📷 ${product.name}: ${product.images}`);
      allImages.push(product.images);
      
      // Check if this might be a food/beverage product based on name
      const foodKeywords = ['banku', 'food', 'flour', 'mix', 'barbeque', 'rice', 'soup', 'stew', 'jollof', 'waakye', 'kenkey', 'shito', 'gari', 'kelewele', 'plantain', 'fufu', 'palava', 'groundnut', 'egusi', 'okro', 'kontomire', 'salad', 'juice', 'sobolo', 'zobo', 'drink', 'beverage'];
      
      const isFoodRelated = foodKeywords.some(keyword => 
        product.name.toLowerCase().includes(keyword)
      );
      
      if (isFoodRelated) {
        foodRelatedProducts.push({
          name: product.name,
          image: product.images
        });
        console.log(`🍽️  Food/Beverage: ${product.name}`);
      }
    });
    
    console.log(`\n🎯 Found ${foodRelatedProducts.length} food-related products:`);
    
    // Create the array for the food-beverages page
    const imageArray = foodRelatedProducts.map(item => {
      // Extract filename from path
      const filename = item.image ? item.image.split('/').pop() : '';
      return filename;
    });
    
    console.log('\n📝 Array for food-beverages page:');
    console.log('const foodBeverageImages = [');
    imageArray.forEach(img => {
      console.log(`  '${img}',`);
    });
    console.log('];');
    
    // Test if these images actually exist
    console.log('\n🔍 Testing food-related image URLs...');
    let workingCount = 0;
    for (const item of foodRelatedProducts) {
      try {
        const response = await fetch(item.image, { method: 'HEAD' });
        if (response.ok) {
          console.log(`✅ Working: ${item.name}`);
          workingCount++;
        } else {
          console.log(`❌ Failed: ${item.name} - ${response.status}`);
        }
      } catch (err) {
        console.log(`❌ Error: ${item.name} - ${err.message}`);
      }
    }
    
    console.log(`\n📈 Summary: ${workingCount}/${foodRelatedProducts.length} food-related images are working`);
    
  } catch (err) {
    console.log('❌ Error:', err.message);
  }
}

checkAllImages();
