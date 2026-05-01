const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://azpgqsmgyorjbqsgxuxw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6cGdxc21neW9yamJxc2d4dXh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyOTg1NjAsImV4cCI6MjA4NDg3NDU2MH0.cxHD8ihT9E5ZAxtkfGa2VjYxYmadbYxyl3xVDPtgh9Q'
);

async function findAvailableImages() {
  try {
    console.log('🔍 Finding available real images for placeholder replacement...');
    
    // Get all products to see what images are working
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, images, price, status')
      .eq('status', 'active')
      .order('name')
      .limit(150);
    
    if (productsError) {
      console.log('❌ Error fetching products:', productsError.message);
      return;
    }
    
    console.log(`📊 Checking ${products.length} products for working images...`);
    
    const workingImages = [];
    const brokenImages = [];
    
    for (const product of products) {
      const imageUrl = product.images;
      
      if (!imageUrl || imageUrl.includes('placeholder')) {
        continue;
      }
      
      // Test if the image actually works
      try {
        const response = await fetch(imageUrl, { method: 'HEAD' });
        if (response.ok) {
          workingImages.push({
            name: product.name,
            url: imageUrl,
            price: product.price,
            id: product.id
          });
        } else {
          brokenImages.push(product);
        }
      } catch (err) {
        brokenImages.push(product);
      }
    }
    
    console.log(`\n✅ Found ${workingImages.length} working images:`);
    
    // Group working images by type
    const foodImages = workingImages.filter(p => 
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
    
    const otherImages = workingImages.filter(p => !foodImages.includes(p));
    
    console.log(`\n🍽️ Food & beverage images (${foodImages.length}):`);
    foodImages.forEach((img, index) => {
      console.log(`  ${index + 1}. ${img.name} - $${img.price}`);
      console.log(`     URL: ${img.url}`);
    });
    
    console.log(`\n📦 Other available images (${otherImages.length}):`);
    otherImages.slice(0, 10).forEach((img, index) => {
      console.log(`  ${index + 1}. ${img.name} - $${img.price}`);
      console.log(`     URL: ${img.url}`);
    });
    
    if (otherImages.length > 10) {
      console.log(`  ... and ${otherImages.length - 10} more`);
    }
    
    // Find suitable replacements for Banku Flour and Banku Mix
    console.log(`\n🎯 Suggested replacements for placeholder products:`);
    
    const bankuRelated = foodImages.filter(p => 
      p.name.toLowerCase().includes('banku')
    );
    
    const flourRelated = foodImages.filter(p => 
      p.name.toLowerCase().includes('flour') || 
      p.name.toLowerCase().includes('mix')
    );
    
    const generalFood = foodImages.filter(p => 
      !p.name.toLowerCase().includes('banku') &&
      !p.name.toLowerCase().includes('flour') &&
      !p.name.toLowerCase().includes('mix')
    );
    
    console.log(`\nFor "Banku Flour":`);
    if (bankuRelated.length > 0) {
      bankuRelated.forEach((img, index) => {
        console.log(`  Option ${index + 1}: ${img.name} - ${img.url}`);
      });
    } else if (flourRelated.length > 0) {
      flourRelated.forEach((img, index) => {
        console.log(`  Option ${index + 1}: ${img.name} - ${img.url}`);
      });
    } else {
      generalFood.slice(0, 3).forEach((img, index) => {
        console.log(`  Option ${index + 1}: ${img.name} - ${img.url}`);
      });
    }
    
    console.log(`\nFor "Banku Mix":`);
    if (bankuRelated.length > 0) {
      bankuRelated.forEach((img, index) => {
        console.log(`  Option ${index + 1}: ${img.name} - ${img.url}`);
      });
    } else if (flourRelated.length > 0) {
      flourRelated.forEach((img, index) => {
        console.log(`  Option ${index + 1}: ${img.name} - ${img.url}`);
      });
    } else {
      generalFood.slice(0, 3).forEach((img, index) => {
        console.log(`  Option ${index + 1}: ${img.name} - ${img.url}`);
      });
    }
    
    return { workingImages, foodImages, otherImages, bankuRelated, flourRelated, generalFood };
    
  } catch (error) {
    console.log('❌ Error:', error.message);
    return { workingImages: [], foodImages: [], otherImages: [], bankuRelated: [], flourRelated: [], generalFood: [] };
  }
}

findAvailableImages();
