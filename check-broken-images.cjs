const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://azpgqsmgyorjbqsgxuxw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6cGdxc21neW9yamJxc2d4dXh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyOTg1NjAsImV4cCI6MjA4NDg3NDU2MH0.cxHD8ihT9E5ZAxtkfGa2VjYxYmadbYxyl3xVDPtgh9Q'
);

async function checkBrokenImages() {
  try {
    console.log('🔍 Checking all products for broken or placeholder images...');
    
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, images, status')
      .eq('status', 'active');
    
    if (error) {
      console.log('❌ Error:', error.message);
      return;
    }
    
    console.log(`📊 Found ${products.length} active products`);
    
    const placeholderProducts = [];
    const brokenImages = [];
    const workingImages = [];
    
    for (const product of products) {
      const imageUrl = product.images;
      
      // Check for placeholder images
      if (!imageUrl || imageUrl.includes('placeholder')) {
        placeholderProducts.push(product);
        console.log(`🎭 Placeholder: ${product.name}`);
        continue;
      }
      
      // Test if the image URL works
      try {
        const response = await fetch(imageUrl, { method: 'HEAD' });
        if (response.ok) {
          workingImages.push(product);
          console.log(`✅ Working: ${product.name}`);
        } else {
          brokenImages.push(product);
          console.log(`❌ Broken (${response.status}): ${product.name}`);
        }
      } catch (err) {
        brokenImages.push(product);
        console.log(`❌ Error: ${product.name} - ${err.message}`);
      }
    }
    
    console.log(`\n📈 Summary:`);
    console.log(`✅ Working images: ${workingImages.length}`);
    console.log(`🎭 Placeholder images: ${placeholderProducts.length}`);
    console.log(`❌ Broken images: ${brokenImages.length}`);
    console.log(`📝 Total: ${products.length}`);
    
    if (placeholderProducts.length > 0) {
      console.log(`\n🎯 Products with placeholder images:`);
      placeholderProducts.forEach((product, index) => {
        console.log(`  ${index + 1}. ${product.name} - Current: ${product.images || 'No image'}`);
      });
    }
    
    if (brokenImages.length > 0) {
      console.log(`\n🔧 Products with broken images:`);
      brokenImages.forEach((product, index) => {
        console.log(`  ${index + 1}. ${product.name} - URL: ${product.images}`);
      });
    }
    
    return { placeholderProducts, brokenImages, workingImages };
    
  } catch (error) {
    console.log('❌ Error:', error.message);
    return { placeholderProducts: [], brokenImages: [], workingImages: [] };
  }
}

checkBrokenImages();
