const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://azpgqsmgyorjbqsgxuxw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6cGdxc21neW9yamJxc2d4dXh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyOTg1NjAsImV4cCI6MjA4NDg3NDU2MH0.cxHD8ihT9E5ZAxtkfGa2VjYxYmadbYxyl3xVDPtgh9Q'
);

async function extractFoodBeverageImages() {
  try {
    console.log('🔍 Extracting food & beverage products with images...');
    
    // Get all active products and filter for food & beverages
    const { data, error } = await supabase
      .from('products')
      .select('id, name, images, status')
      .eq('status', 'active');
    
    if (error) {
      console.log('❌ Error:', error.message);
      return;
    }
    
    console.log(`📊 Found ${data.length} total active products:`);
    
    const validImages = [];
    data.forEach(product => {
      if (product.images && product.images.includes('food&beverages')) {
        console.log(`✅ ${product.name}: ${product.images}`);
        validImages.push({
          name: product.name,
          image: product.images
        });
      }
    });
    
    console.log(`\n🎯 Found ${validImages.length} valid food & beverage images:`);
    
    // Create the array for the food-beverages page
    const imageArray = validImages.map(item => {
      // Extract filename from path
      const filename = item.image.split('/').pop();
      return filename;
    });
    
    console.log('\n📝 Array for food-beverages page:');
    console.log('const foodBeverageImages = [');
    imageArray.forEach(img => {
      console.log(`  '${img}',`);
    });
    console.log('];');
    
    // Test if these images actually exist
    console.log('\n🔍 Testing image URLs...');
    let workingCount = 0;
    for (const item of validImages) {
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
    
    console.log(`\n📈 Summary: ${workingCount}/${validImages.length} images are working`);
    
  } catch (err) {
    console.log('❌ Error:', err.message);
  }
}

extractFoodBeverageImages();
