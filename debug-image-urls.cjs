const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lljxxaejmueoxsaqaowf.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxsanh4YWVqbXVlb3hzYXFhb3dmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODEwODIyMSwiZXhwIjoyMDkzNjg0MjIxfQ.qXvtkAhMYRSOHSQUFVdLGQypZ0_k-Z5Y2TlDDYJBzFQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugImageUrls() {
  try {
    console.log('🔍 Debugging image URLs...\n');
    
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
      console.log(`   images: ${JSON.stringify(product.images)}`);
      
      // Check for array syntax in string values
      if (typeof product.images === 'string' && (product.images.includes('[') || product.images.includes(']'))) {
        console.log(`   ⚠️  FOUND ARRAY SYNTAX IN: ${product.images}`);
      } else if (Array.isArray(product.images) && product.images.length > 0) {
        const firstImage = product.images[0];
        if (typeof firstImage === 'string' && (firstImage.includes('[') || firstImage.includes(']'))) {
          console.log(`   ⚠️  FOUND ARRAY SYNTAX IN FIRST IMAGE: ${firstImage}`);
        } else {
          console.log(`   ✅ First image: ${firstImage}`);
        }
      } else {
        console.log(`   ✅ No array syntax found`);
      }
      
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugImageUrls();
