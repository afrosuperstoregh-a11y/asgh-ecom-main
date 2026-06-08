const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function investigateBrokenImages() {
  try {
    console.log('🔍 Investigating broken image URLs...');
    
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, images')
      .eq('status', 'active')
      .in('name', ['Banku Flour', 'Barbeque', 'Banku Mix']);
    
    if (error) {
      console.log(`❌ Error: ${error.message}`);
      return;
    }
    
    console.log(`📊 Found ${products.length} products`);
    
    for (const product of products) {
      console.log(`\n📋 ${product.name}`);
      console.log(`   Type: ${typeof product.images}`);
      console.log(`   Value: ${JSON.stringify(product.images)}`);
      console.log(`   String: ${product.images}`);
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

investigateBrokenImages();
