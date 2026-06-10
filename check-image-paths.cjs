const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lljxxaejmueoxsaqaowf.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxsanh4YWVqbXVlb3hzYXFhb3dmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODEwODIyMSwiZXhwIjoyMDkzNjg0MjIxfQ.qXvtkAhMYRSOHSQUFVdLGQypZ0_k-Z5Y2TlDDYJBzFQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkImagePaths() {
  try {
    console.log('🔍 Checking all product image paths...');
    
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, images');
    
    if (error) {
      console.error('❌ Error fetching products:', error);
      return;
    }
    
    console.log(`📊 Found ${products.length} total products\n`);
    
    for (const product of products) {
      console.log(`📦 ${product.name}`);
      console.log(`   ID: ${product.id}`);
      console.log(`   Images: ${JSON.stringify(product.images)}`);
      
      if (product.images && Array.isArray(product.images) && product.images.length > 0) {
        const imagePath = product.images[0];
        console.log(`   First image path: "${imagePath}"`);
        
        // Check if it's a valid path
        if (imagePath && imagePath.startsWith('http')) {
          console.log(`   ✅ Full URL`);
        } else if (imagePath && imagePath.includes('/')) {
          console.log(`   ✅ Relative path`);
        } else if (imagePath === 'placeholder-product.svg') {
          console.log(`   ⚠️  Placeholder`);
        } else {
          console.log(`   ❌ Invalid path`);
        }
      } else {
        console.log(`   ⚠️  No images or empty array`);
      }
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkImagePaths();
