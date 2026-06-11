const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lljxxaejmueoxsaqaowf.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxsanh4YWVqbXVlb3hzYXFhb3dmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODEwODIyMSwiZXhwIjoyMDkzNjg0MjIxfQ.qXvtkAhMYRSOHSQUFVdLGQypZ0_k-Z5Y2TlDDYJBzFQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkActualImageUrls() {
  try {
    console.log('🔍 Checking actual image URLs in database...\n');
    
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, images');
    
    if (error) {
      console.error('❌ Error fetching products:', error);
      return;
    }
    
    console.log(`📊 Found ${products.length} total products\n`);
    
    for (const product of products) {
      console.log(`📦 ${product.name} (ID: ${product.id})`);
      console.log(`   Raw images field: ${JSON.stringify(product.images)}`);
      
      if (Array.isArray(product.images) && product.images.length > 0) {
        const firstImage = product.images[0];
        console.log(`   First image: ${firstImage}`);
        
        // Check if it contains problematic characters
        if (typeof firstImage === 'string') {
          if (firstImage.includes('[') || firstImage.includes(']')) {
            console.log(`   ❌ CONTAINS BRACKETS: ${firstImage}`);
          } else if (firstImage.includes('undefined')) {
            console.log(`   ❌ CONTAINS 'undefined': ${firstImage}`);
          } else if (firstImage.trim() === '') {
            console.log(`   ❌ EMPTY STRING`);
          } else if (firstImage === 'placeholder-product.svg') {
            console.log(`   ✅ Placeholder image`);
          } else if (firstImage.startsWith('http')) {
            console.log(`   ✅ Full URL`);
          } else {
            console.log(`   ℹ️  Relative path: ${firstImage}`);
          }
        }
      } else if (typeof product.images === 'string') {
        console.log(`   ⚠️  IMAGES IS STRING: ${product.images}`);
        if (product.images.includes('[') || product.images.includes(']')) {
          console.log(`   ❌ CONTAINS BRACKETS`);
        }
      } else {
        console.log(`   ⚠️  Empty or null images`);
      }
      
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkActualImageUrls();
