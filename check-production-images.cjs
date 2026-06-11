const { createClient } = require('@supabase/supabase-js');

// Production Supabase project (from frontend .env)
const supabaseUrl = 'https://lljxxaejmueoxsaqaowf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxsanh4YWVqbXVlb3hzYXFhb3dmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxMDgyMjEsImV4cCI6MjA5MzY4NDIyMX0.LM2zS7a7utqqtU5DN4ADy7uCzugnshNAfG8a4gPlQfk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkProductionImages() {
  console.log('🔍 Checking Production Images with Anon Key\n');
  
  try {
    // Try to fetch products with images
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, images')
      .limit(5);
    
    if (error) {
      console.log(`❌ Error fetching products: ${error.message}`);
      console.log(`   Error code: ${error.code}`);
      console.log(`   Error details: ${JSON.stringify(error.details, null, 2)}`);
    } else {
      console.log(`✅ Found ${products.length} products in production database`);
      products.forEach(product => {
        console.log(`  - ${product.name}: ${product.images ? product.images.length : 0} images`);
        if (product.images && product.images.length > 0) {
          console.log(`    Sample URL: ${product.images[0]}`);
        }
      });
    }
    
    // Check storage bucket
    console.log('\n🔍 Checking storage bucket access...');
    const { data: storageData, error: storageError } = await supabase.storage
      .from('product-images')
      .list('', { limit: 5 });
    
    if (storageError) {
      console.log(`❌ Error accessing storage: ${storageError.message}`);
    } else {
      console.log(`✅ Storage bucket accessible: ${storageData.length} files`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkProductionImages();
