const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'frontend/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixNullCategoryProducts() {
  try {
    console.log('🔍 Finding products with null category_id...');
    
    // Get products with null category_id
    const { data: nullProducts, error: nullError } = await supabase
      .from('products')
      .select('id, name, slug')
      .is('category_id', null);
    
    if (nullError) {
      console.error('❌ Error finding null category products:', nullError.message);
      return;
    }
    
    if (nullProducts.length === 0) {
      console.log('✅ No products with null category_id found');
      return;
    }
    
    console.log(`Found ${nullProducts.length} products with null category_id:`);
    nullProducts.forEach(p => console.log(`   - ${p.name} (ID: ${p.id})`));
    
    // Get the Electronics category (most likely category for uncategorized products)
    const { data: electronicsCat, error: catError } = await supabase
      .from('categories')
      .select('id, name')
      .eq('slug', 'electronics')
      .single();
    
    if (catError || !electronicsCat) {
      console.error('❌ Could not find Electronics category');
      return;
    }
    
    console.log(`\nAssigning these products to '${electronicsCat.name}' category...`);
    
    // Update each product
    for (const product of nullProducts) {
      const { error: updateError } = await supabase
        .from('products')
        .update({ category_id: electronicsCat.id })
        .eq('id', product.id);
      
      if (updateError) {
        console.error(`❌ Error updating ${product.name}:`, updateError.message);
      } else {
        console.log(`✅ Updated: ${product.name}`);
      }
    }
    
    console.log('\n✅ All null category products fixed');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixNullCategoryProducts();
