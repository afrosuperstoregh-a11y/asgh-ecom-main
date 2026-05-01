const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://azpgqsmgyorjbqsgxuxw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6cGdxc21neW9yamJxc2d4dXh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyOTg1NjAsImV4cCI6MjA4NDg3NDU2MH0.cxHD8ihT9E5ZAxtkfGa2VjYxYmadbYxyl3xVDPtgh9Q'
);

async function findAdditionalImages() {
  try {
    console.log('🔍 Finding additional food & beverage images to reach 55 products...');
    
    const { data, error } = await supabase
      .from('products')
      .select('id, name, images, status')
      .eq('status', 'active')
      .not('images', 'is', null);
    
    if (error) {
      console.log('❌ Error:', error.message);
      return;
    }
    
    console.log(`📊 Found ${data.length} total products with images:`);
    
    // Current working images (39)
    const currentWorkingImages = [
      'cabbage-stew.png',
      'chicken-wings-ghanaian-style-2.jpg',
      'chicken.png',
      'different-stew-party-orders-1.jpg',
      'different-stew-party-orders-2.jpg',
      'different-stew-party-orders-3.jpg',
      'different-stew-party-orders-4.jpg',
      'fried-fish-2.jpg',
      'fried-fish.jpg',
      'fried-rice-and-chicken.jpg',
      'fried-rice-with-chicken-combo-2.jpg',
      'fried-rice-with-chicken-combo-3.jpg',
      'fried-rice-with-chicken-combo-4.jpg',
      'fried-rice-with-chicken-combo.jpg',
      'ghana-nkulenu-plam-sauce.jpeg',
      'jollof-combo.jpg',
      'jollof-rice.jpg',
      'jolof-rice,-plaintain-vegetables-&-chicken.png',
      'kenkey.jpg',
      'khebab-1.jpg',
      'khebab-2.jpg',
      'kontomire-stew.jpg',
      'meat-pie.png',
      'neat-fufu.png',
      'nigerian-egusi-stew.jpg',
      'palm-oil.jpg',
      'pasta.png',
      'rice-with-green-pea.png',
      'sierra-leone-food.jpg',
      'spaghetti.jpg',
      'tuozafi-2.jpg',
      'tuozafi.jpg',
      'vegetables-&-bake-beans.png',
      'waakye-with-fish-combo-1.jpg',
      'waakye-with-fish-combo-2.jpg',
      'waakye.png',
      'all-ghanaian-foods-party-orders-1.jpg',
      'all-ghanaian-foods-party-orders-2.jpg',
      'all-ghanaian-foods-party-orders-3.jpg'
    ];
    
    const additionalImages = [];
    const allFoodImages = [];
    
    // Test each image
    for (const product of data) {
      if (product.images && product.images.includes('food&beverages')) {
        const filename = product.images.split('/').pop();
        allFoodImages.push({
          name: product.name,
          filename: filename,
          url: product.images
        });
        
        // Check if this is not in current working images
        if (!currentWorkingImages.includes(filename)) {
          try {
            const response = await fetch(product.images, { method: 'HEAD' });
            if (response.ok) {
              additionalImages.push({
                name: product.name,
                filename: filename,
                url: product.images
              });
              console.log(`✅ Additional working: ${product.name} - ${filename}`);
            }
          } catch (err) {
            console.log(`❌ Failed: ${product.name} - ${filename}`);
          }
        }
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`- Current working images: ${currentWorkingImages.length}`);
    console.log(`- Additional working images found: ${additionalImages.length}`);
    console.log(`- Total available: ${currentWorkingImages.length + additionalImages.length}`);
    console.log(`- Need to reach 55: ${55 - (currentWorkingImages.length + additionalImages.length)} more needed`);
    
    if (additionalImages.length > 0) {
      console.log(`\n🎯 Additional images to add:`);
      additionalImages.forEach(img => {
        console.log(`  - '${img.filename}' // ${img.name}`);
      });
    }
    
    // Create complete array for 55 products
    const completeArray = [...currentWorkingImages, ...additionalImages.map(img => img.filename)];
    console.log(`\n📝 Complete array for food-beverages page (${completeArray.length} total):`);
    console.log('const predefinedImages = [');
    completeArray.forEach(img => {
      console.log(`  '${img}',`);
    });
    console.log('];');
    
    if (completeArray.length < 55) {
      console.log(`\n⚠️  Still need ${55 - completeArray.length} more products to reach 55 total`);
      console.log('Consider adding placeholder images for remaining items');
    }
    
  } catch (err) {
    console.log('❌ Error:', err.message);
  }
}

findAdditionalImages();
