const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const supabaseStorageUrl = `${supabaseUrl}/storage/v1/object/public/product-images/`;

async function fixRemainingBrokenImages() {
  try {
    console.log('🔧 Fixing remaining broken images with relative paths...');
    
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
    
    // Filter products with broken relative paths
    const productsToFix = products.filter(p => 
      p.images && (
        p.images === 'food&beverages/banku-flour.jpg' ||
        p.images === 'food&beverages/banku-mix.png' ||
        p.images === 'food&beverages/barbeque.png'
      )
    );
    
    console.log(`🎯 Found ${productsToFix.length} products to fix`);
    
    const fixes = {
      'food&beverages/banku-flour.jpg': `${supabaseStorageUrl}food%26beverages/banku-flour.jpg`,
      'food&beverages/banku-mix.png': `${supabaseStorageUrl}food%26beverages/banku-mix.png`,
      'food&beverages/barbeque.png': `${supabaseStorageUrl}food%26beverages/barbeque.png`
    };
    
    let successCount = 0;
    let failCount = 0;
    
    for (const product of productsToFix) {
      try {
        console.log(`\n🔄 Fixing: ${product.name}`);
        console.log(`  Current: ${product.images}`);
        console.log(`  New: ${fixes[product.images]}`);
        
        const { error: updateError } = await supabase
          .from('products')
          .update({
            images: fixes[product.images],
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

fixRemainingBrokenImages();
