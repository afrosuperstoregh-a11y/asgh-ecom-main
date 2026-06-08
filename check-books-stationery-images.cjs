const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkBooksStationeryImages() {
  try {
    console.log('🔍 Checking books and stationery product images...');
    
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, images')
      .eq('status', 'active')
      .or('name.ilike.%book%,name.ilike.%stationery%,name.ilike.%notebook%,name.ilike.%pen%,name.ilike.%calculator%,name.ilike.%B&M%,name.ilike.%H&B%,name.ilike.%S&F%,name.ilike.%J&A%,name.ilike.%H&L%');
    
    if (error) {
      console.log(`❌ Error: ${error.message}`);
      return;
    }
    
    console.log(`📊 Found ${products.length} books/stationery products`);
    
    let workingCount = 0;
    let brokenCount = 0;
    
    for (const product of products) {
      const imageUrl = Array.isArray(product.images) ? product.images[0] : product.images;
      
      try {
        const response = await fetch(imageUrl, { method: 'HEAD' });
        if (response.ok) {
          workingCount++;
          console.log(`✅ Working: ${product.name}`);
        } else {
          brokenCount++;
          console.log(`❌ Broken (${response.status}): ${product.name}`);
        }
      } catch (err) {
        brokenCount++;
        console.log(`❌ Error: ${product.name} - ${err.message}`);
      }
    }
    
    console.log(`\n📈 Summary:`);
    console.log(`✅ Working images: ${workingCount}`);
    console.log(`❌ Broken images: ${brokenCount}`);
    console.log(`📝 Total: ${products.length}`);
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

checkBooksStationeryImages();
