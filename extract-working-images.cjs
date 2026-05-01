const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://azpgqsmgyorjbqsgxuxw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6cGdxc21neW9yamJxc2d4dXh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyOTg1NjAsImV4cCI6MjA4NDg3NDU2MH0.cxHD8ihT9E5ZAxtkfGa2VjYxYmadbYxyl3xVDPtgh9Q'
);

async function extractWorkingImages() {
  try {
    console.log('🔍 Extracting working food & beverage images...');
    
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
    
    const workingImages = [];
    
    // Test each image to see if it works
    for (const product of data) {
      if (product.images && product.images.includes('food&beverages')) {
        try {
          const response = await fetch(product.images, { method: 'HEAD' });
          if (response.ok) {
            workingImages.push(product.images);
            console.log(`✅ Working: ${product.name}`);
          } else {
            console.log(`❌ Failed: ${product.name} - ${response.status}`);
          }
        } catch (err) {
          console.log(`❌ Error: ${product.name} - ${err.message}`);
        }
      }
    }
    
    console.log(`\n🎯 Found ${workingImages.length} working food & beverage images:`);
    
    // Create: array for the food-beverages page
    const imageArray = workingImages.map(imagePath => {
      // Extract filename from path
      return imagePath.split('/').pop();
    });
    
    console.log('\n📝 Array for food-beverages page:');
    console.log('const workingFoodBeverageImages = [');
    imageArray.forEach(img => {
      console.log(`  '${img}',`);
    });
    console.log('];');
    
    console.log(`\n📈 Ready to replace ${workingImages.length} placeholders with real images!`);
    
  } catch (err) {
    console.log('❌ Error:', err.message);
  }
}

extractWorkingImages();
