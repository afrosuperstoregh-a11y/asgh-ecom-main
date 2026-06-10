const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lljxxaejmueoxsaqaowf.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxsanh4YWVqbXVlb3hzYXFhb3dmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODEwODIyMSwiZXhwIjoyMDkzNjg0MjIxfQ.qXvtkAhMYRSOHSQUFVdLGQypZ0_k-Z5Y2TlDDYJBzFQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixImageIssues() {
  try {
    console.log('🔧 Fixing image issues...\n');
    
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
      let needsFix = false;
      let newImages = product.images;
      
      // Check if images is a stringified JSON array
      if (typeof product.images === 'string' && product.images.startsWith('[')) {
        console.log(`🔧 Fixing stringified JSON array for: ${product.name}`);
        try {
          newImages = JSON.parse(product.images);
          needsFix = true;
        } catch (e) {
          console.log(`❌ Failed to parse JSON for ${product.name}`);
          newImages = ['placeholder-product.svg'];
          needsFix = true;
        }
      }
      
      // Check if images is an empty array
      if (Array.isArray(product.images) && product.images.length === 0) {
        console.log(`🔧 Setting placeholder for empty array: ${product.name}`);
        newImages = ['placeholder-product.svg'];
        needsFix = true;
      }
      
      // Check if images is null or undefined
      if (!product.images) {
        console.log(`🔧 Setting placeholder for null/undefined: ${product.name}`);
        newImages = ['placeholder-product.svg'];
        needsFix = true;
      }
      
      if (needsFix) {
        const { error: updateError } = await supabase
          .from('products')
          .update({ images: newImages })
          .eq('id', product.id);
        
        if (updateError) {
          console.error(`❌ Failed to update ${product.name}:`, updateError.message);
        } else {
          console.log(`✅ Fixed ${product.name}`);
          fixedCount++;
        }
      }
    }
    
    console.log(`\n✅ Successfully fixed ${fixedCount} products`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixImageIssues();
