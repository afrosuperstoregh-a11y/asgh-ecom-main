const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const supabaseStorageUrl = `${supabaseUrl}/storage/v1/object/public/product-images/`;

async function fixRelativePaths() {
  try {
    console.log('🔧 Fixing products with relative image paths...');
    
    // Get all products and filter by image URL in JavaScript
    const { data: products, error: findError } = await supabase
      .from('products')
      .select('id, name, images')
      .eq('status', 'active');
    
    if (findError) {
      console.log(`❌ Error fetching products: ${findError.message}`);
      return;
    }
    
    console.log(`📊 Found ${products.length} total products`);
    
    // Filter products with relative paths (not starting with http)
    const productsToFix = products.filter(p => 
      p.images && typeof p.images === 'string' && !p.images.startsWith('http') && !p.images.startsWith('https')
    );
    
    console.log(`🎯 Found ${productsToFix.length} products with relative paths`);
    
    let successCount = 0;
    let failCount = 0;
    
    for (const product of productsToFix) {
      try {
        console.log(`\n🔄 Fixing: ${product.name}`);
        console.log(`  Current: ${product.images}`);
        
        // Construct the full URL
        const newImage = `${supabaseStorageUrl}${product.images.replace('&', '%26')}`;
        console.log(`  New: ${newImage}`);
        
        const { error: updateError } = await supabase
          .from('products')
          .update({
            images: newImage,
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

fixRelativePaths();
