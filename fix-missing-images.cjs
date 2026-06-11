const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lljxxaejmueoxsaqaowf.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxsanh4YWVqbXVlb3hzYXFhb3dmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODEwODIyMSwiZXhwIjoyMDkzNjg0MjIxfQ.qXvtkAhMYRSOHSQUFVdLGQypZ0_k-Z5Y2TlDDYJBzFQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixMissingImages() {
  try {
    console.log('🔧 Fixing all products to use placeholder images...\n');
    
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, images');
    
    if (error) {
      console.error('❌ Error fetching products:', error);
      return;
    }
    
    console.log(`📊 Found ${products.length} total products\n`);
    
    let fixedCount = 0;
    
    for (const product of products) {
      console.log(`📦 ${product.name} (ID: ${product.id})`);
      
      // Set all products to use placeholder image
      const { error: updateError } = await supabase
        .from('products')
        .update({ images: ['placeholder-product.svg'] })
        .eq('id', product.id);
      
      if (updateError) {
        console.error(`   ❌ Failed to update: ${updateError.message}`);
      } else {
        console.log(`   ✅ Fixed - set to placeholder-product.svg`);
        fixedCount++;
      }
    }
    
    console.log(`\n✅ Successfully fixed ${fixedCount} products`);
    console.log(`\n📝 Next steps:`);
    console.log(`   1. Upload actual product images to Supabase storage`);
    console.log(`   2. Update product records with correct image paths`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixMissingImages();
