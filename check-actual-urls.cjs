const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lljxxaejmueoxsaqaowf.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxsanh4YWVqbXVlb3hzYXFhb3dmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODEwODIyMSwiZXhwIjoyMDkzNjg0MjIxfQ.qXvtkAhMYRSOHSQUFVdLGQypZ0_k-Z5Y2TlDDYJBzFQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkActualUrls() {
  try {
    console.log('🔍 Checking actual URLs in database...\n');
    
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, images');
    
    if (error) {
      console.error('❌ Error fetching products:', error);
      return;
    }
    
    console.log(`📊 Found ${products.length} products\n`);
    
    for (const product of products) {
      console.log(`📦 ${product.name} (ID: ${product.id})`);
      
      if (Array.isArray(product.images) && product.images.length > 0) {
        const imageUrl = product.images[0];
        console.log(`   Full URL: ${imageUrl}`);
        
        // Test with encoded version
        const encodedUrl = imageUrl.replace(/&/g, '%26');
        console.log(`   Encoded: ${encodedUrl}`);
        
        try {
          const response = await fetch(imageUrl, { method: 'HEAD' });
          console.log(`   Original response: ${response.status}`);
        } catch (err) {
          console.log(`   Original error: ${err.message}`);
        }
        
        try {
          const response = await fetch(encodedUrl, { method: 'HEAD' });
          console.log(`   Encoded response: ${response.status}`);
        } catch (err) {
          console.log(`   Encoded error: ${err.message}`);
        }
      }
      
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkActualUrls();
