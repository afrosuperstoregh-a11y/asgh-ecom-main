const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function findWorkingClothingImages() {
  try {
    console.log('🔍 Finding working clothing images...');
    
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, images')
      .eq('status', 'active')
      .ilike('name', '%dashiki%');
    
    if (error) {
      console.log(`❌ Error: ${error.message}`);
      return;
    }
    
    console.log(`📊 Found ${products.length} dashiki products`);
    
    const workingImages = [];
    
    for (const product of products) {
      const imageUrl = Array.isArray(product.images) ? product.images[0] : product.images;
      
      try {
        const response = await fetch(imageUrl, { method: 'HEAD' });
        if (response.ok) {
          workingImages.push({
            name: product.name,
            url: imageUrl
          });
          console.log(`✅ Working: ${product.name} - ${imageUrl}`);
        } else {
          console.log(`❌ Broken: ${product.name} - ${imageUrl}`);
        }
      } catch (err) {
        console.log(`❌ Error: ${product.name} - ${err.message}`);
      }
    }
    
    console.log(`\n🎯 Working images to use as replacements:`);
    workingImages.forEach((img, index) => {
      console.log(`${index + 1}. ${img.name}: ${img.url}`);
    });
    
    return workingImages;
    
  } catch (error) {
    console.log('❌ Error:', error.message);
    return [];
  }
}

findWorkingClothingImages();
