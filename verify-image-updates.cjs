const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lljxxaejmueoxsaqaowf.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxsanh4YWVqbXVlb3hzYXFhb3dmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODEwODIyMSwiZXhwIjoyMDkzNjg0MjIxfQ.qXvtkAhMYRSOHSQUFVdLGQypZ0_k-Z5Y2TlDDYJBzFQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyImageUpdates() {
  try {
    console.log('🔍 Verifying image updates...\n');
    
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, images');
    
    if (error) {
      console.error('❌ Error fetching products:', error);
      return;
    }
    
    console.log(`📊 Found ${products.length} products\n`);
    
    let workingCount = 0;
    let brokenCount = 0;
    
    for (const product of products) {
      console.log(`📦 ${product.name} (ID: ${product.id})`);
      
      if (Array.isArray(product.images) && product.images.length > 0) {
        const imageUrl = product.images[0];
        console.log(`   URL: ${imageUrl.substring(0, 70)}...`);
        
        // Check if image loads
        try {
          const response = await fetch(imageUrl, { method: 'HEAD' });
          if (response.ok) {
            console.log(`   ✅ Working (${response.status})`);
            workingCount++;
          } else {
            console.log(`   ❌ Broken (${response.status})`);
            brokenCount++;
          }
        } catch (err) {
          console.log(`   ❌ Error: ${err.message}`);
          brokenCount++;
        }
      } else {
        console.log(`   ⚠️  No images`);
      }
      
      console.log('');
    }
    
    console.log(`📊 Summary:`);
    console.log(`   Working images: ${workingCount}`);
    console.log(`   Broken images: ${brokenCount}`);
    console.log(`   Total products: ${products.length}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

verifyImageUpdates();
