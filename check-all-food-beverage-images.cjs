const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://azpgqsmgyorjbqsgxuxw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6cGdxc21neW9yamJxc2d4dXh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyOTg1NjAsImV4cCI6MjA4NDg3NDU2MH0.cxHD8ihT9E5ZAxtkfGa2VjYxYmadbYxyl3xVDPtgh9Q'
);

// All 55 food & beverage products from the page
const allFoodBeverageProducts = [
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
  'all-ghanaian-foods-party-orders-3.jpg',
  'banku-flour.jpg',
  'banku-mix.jpg',
  'barbeque.png',
  'red-red.jpg',
  'shito.jpg',
  'gari.jpg',
  'kelewele.jpg',
  'fried-plantain.jpg',
  'groundnut-soup.jpg',
  'light-soup.jpg',
  'banga-soup.jpg',
  'egusi-soup.jpg',
  'okro-soup.jpg',
  'african-salad.jpg',
  'fruit-juice-mix.jpg',
  'sobolo.jpg',
  'zobo.jpg'
];

async function checkAllFoodBeverageImages() {
  try {
    console.log('🔍 Checking all 55 food & beverage products for image availability...');
    
    const supabaseBase = 'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/food%26beverages/';
    
    const workingImages = [];
    const brokenImages = [];
    
    for (const imageName of allFoodBeverageProducts) {
      const imageUrl = supabaseBase + encodeURIComponent(imageName);
      
      try {
        const response = await fetch(imageUrl, { method: 'HEAD' });
        if (response.ok) {
          workingImages.push({ name: imageName, url: imageUrl });
          console.log(`✅ Working: ${imageName}`);
        } else {
          brokenImages.push({ name: imageName, url: imageUrl, status: response.status });
          console.log(`❌ Broken: ${imageName} (${response.status})`);
        }
      } catch (err) {
        brokenImages.push({ name: imageName, url: imageUrl, error: err.message });
        console.log(`❌ Error: ${imageName} - ${err.message}`);
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`✅ Working images: ${workingImages.length}`);
    console.log(`❌ Broken images: ${brokenImages.length}`);
    console.log(`📝 Total checked: ${allFoodBeverageProducts.length}`);
    
    if (brokenImages.length > 0) {
      console.log(`\n🎯 Broken images that need replacement:`);
      brokenImages.forEach((img, index) => {
        console.log(`  ${index + 1}. ${img.name} - ${img.status || img.error}`);
      });
      
      // Suggest replacements from working images
      console.log(`\n💡 Available working images for replacement:`);
      workingImages.slice(0, 10).forEach((img, index) => {
        console.log(`  ${index + 1}. ${img.name}`);
      });
      
      if (workingImages.length > 10) {
        console.log(`  ... and ${workingImages.length - 10} more`);
      }
      
    } else {
      console.log(`\n🎉 All 55 food & beverage images are working!`);
    }
    
    // Check if we can find suitable replacements for broken images
    if (brokenImages.length > 0 && workingImages.length > 0) {
      console.log(`\n🔄 Suggested replacements:`);
      
      brokenImages.forEach((brokenImg, index) => {
        const brokenName = brokenImg.name.replace(/\.[^/.]+$/, '');
        
        // Find similar working images
        const similarImages = workingImages.filter(workingImg => {
          const workingName = workingImg.name.replace(/\.[^/.]+$/, '');
          return workingName.toLowerCase().includes(brokenName.toLowerCase()) ||
                 brokenName.toLowerCase().includes(workingName.toLowerCase());
        });
        
        if (similarImages.length > 0) {
          console.log(`  ${index + 1}. ${brokenImg.name} → ${similarImages[0].name}`);
        } else {
          // Use first working image as fallback
          console.log(`  ${index + 1}. ${brokenImg.name} → ${workingImages[0].name} (fallback)`);
        }
      });
    }
    
    return { workingImages, brokenImages };
    
  } catch (error) {
    console.log('❌ Error:', error.message);
    return { workingImages: [], brokenImages: [] };
  }
}

checkAllFoodBeverageImages();
