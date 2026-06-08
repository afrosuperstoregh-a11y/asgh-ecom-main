const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const supabaseStorageUrl = `${supabaseUrl}/storage/v1/object/public/product-images/`;

async function fixArrayImages() {
  try {
    console.log('🔧 Fixing products with array image fields containing relative paths...');
    
    const { data: products, error: findError } = await supabase
      .from('products')
      .select('id, name, images')
      .eq('status', 'active');
    
    if (findError) {
      console.log(`❌ Error fetching products: ${findError.message}`);
      return;
    }
    
    console.log(`📊 Found ${products.length} total products`);
    
    // Filter products where images is an array containing relative paths
    const productsToFix = products.filter(p => {
      if (!p.images || !Array.isArray(p.images)) return false;
      return p.images.some(img => img && !img.startsWith('http') && !img.startsWith('https'));
    });
    
    console.log(`🎯 Found ${productsToFix.length} products with relative paths in arrays`);
    
    let successCount = 0;
    let failCount = 0;
    
    for (const product of productsToFix) {
      try {
        console.log(`\n🔄 Fixing: ${product.name}`);
        console.log(`  Current images: ${JSON.stringify(product.images)}`);
        
        // Fix each image in the array
        const fixedImages = product.images.map(img => {
          if (img && !img.startsWith('http') && !img.startsWith('https')) {
            return `${supabaseStorageUrl}${img.replace('&', '%26')}`;
          }
          return img;
        });
        
        console.log(`  Fixed images: ${JSON.stringify(fixedImages)}`);
        
        const { error: updateError } = await supabase
          .from('products')
          .update({
            images: fixedImages,
            updated_at: new Date().toISOString()
          })
          .eq('id', product.id);
        
        if (updateError) {
          console.log(`  ❌ Error updating: ${updateError.message}`);
          failCount++;
        } else {
          console.log(`  ✅ Successfully updated`);
          successCount++;
        }
        
      } catch (error) {
        console.log(`❌ Error: ${error.message}`);
        failCount++;
      }
    }
    
    console.log(`\n🎉 Fix complete!`);
    console.log(`📊 Summary:`);
    console.log(`✅ Successfully updated: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

fixArrayImages();
