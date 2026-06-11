const { createClient } = require('@supabase/supabase-js');

// Production Supabase project
const supabaseUrl = 'https://lljxxaejmueoxsaqaowf.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxsanh4YWVqbXVlb3hzcWFhb3dmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTI5ODU2MCwiZXhwIjoyMDg0ODc0NTYwfQ.5WvK0JqXqY0Q8X1L3Y6Z9A7B2C8D9E0F1G2H3I4J5K6';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkProductionStorage() {
  console.log('🔍 Checking Production Storage\n');
  
  try {
    // List files in product-images bucket
    const { data, error } = await supabase.storage
      .from('product-images')
      .list('', {
        limit: 20
      });
    
    if (error) {
      console.log('❌ Error listing product-images:', error.message);
    } else {
      console.log('✅ Found files in product-images bucket:');
      data.forEach(file => {
        console.log(`  - ${file.name} (${file.metadata ? 'with metadata' : 'no metadata'})`);
      });
    }
    
    // Check if specific files exist
    const testFiles = [
      'placeholder-product.svg',
      'african-spices.jpg',
      'african-coffee.jpg'
    ];
    
    console.log('\n🔍 Checking specific files:');
    for (const file of testFiles) {
      const { data: fileData, error: fileError } = await supabase.storage
        .from('product-images')
        .getPublicUrl(file);
      
      if (fileError) {
        console.log(`  ❌ ${file}: ${fileError.message}`);
      } else {
        console.log(`  ✅ ${file}: ${fileData.publicUrl}`);
      }
    }
    
    // Check database for products with images
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, images')
      .limit(5);
    
    if (productsError) {
      console.log(`\n❌ Error fetching products: ${productsError.message}`);
    } else {
      console.log(`\n📊 Found ${products.length} products in production database`);
      products.forEach(product => {
        console.log(`  - ${product.name}: ${product.images ? product.images.length : 0} images`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkProductionStorage();
