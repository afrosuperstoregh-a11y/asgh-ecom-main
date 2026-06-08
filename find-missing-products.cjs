const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function findMissingProducts() {
  try {
    console.log('🔍 Searching for products with similar names...');
    
    const searchTerms = ['Banku', 'Barbeque'];
    
    for (const term of searchTerms) {
      console.log(`\n🔎 Searching for: ${term}`);
      
      const { data: products, error } = await supabase
        .from('products')
        .select('id, name, images')
        .ilike('name', `%${term}%`)
        .eq('status', 'active');
      
      if (error) {
        console.log(`❌ Error: ${error.message}`);
        continue;
      }
      
      console.log(`📊 Found ${products.length} products matching "${term}":`);
      products.forEach(product => {
        console.log(`  - ${product.name}: ${product.images}`);
      });
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

findMissingProducts();
