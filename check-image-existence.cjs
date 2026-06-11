const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lljxxaejmueoxsaqaowf.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxsanh4YWVqbXVlb3hzYXFhb3dmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODEwODIyMSwiZXhwIjoyMDkzNjg0MjIxfQ.qXvtkAhMYRSOHSQUFVdLGQypZ0_k-Z5Y2TlDDYJBzFQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkImageExistence() {
  try {
    console.log('🔍 Checking if image files actually exist in Supabase storage...\n');
    
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, images');
    
    if (error) {
      console.error('❌ Error fetching products:', error);
      return;
    }
    
    console.log(`📊 Found ${products.length} total products\n`);
    
    let missingCount = 0;
    let emptyFolderCount = 0;
    
    for (const product of products) {
      console.log(`📦 ${product.name} (ID: ${product.id})`);
      
      if (Array.isArray(product.images) && product.images.length > 0) {
        for (const imageUrl of product.images) {
          if (typeof imageUrl === 'string') {
            // Check for empty folder placeholder
            if (imageUrl.includes('.emptyFolderPlaceholder')) {
              console.log(`   ❌ EMPTY FOLDER PLACEHOLDER: ${imageUrl}`);
              emptyFolderCount++;
              missingCount++;
            } else if (imageUrl.startsWith('http')) {
              // Try to fetch the image to check if it exists
              try {
                const response = await fetch(imageUrl, { method: 'HEAD' });
                if (response.ok) {
                  console.log(`   ✅ EXISTS: ${imageUrl.substring(0, 60)}...`);
                } else {
                  console.log(`   ❌ MISSING (${response.status}): ${imageUrl.substring(0, 60)}...`);
                  missingCount++;
                }
              } catch (err) {
                console.log(`   ❌ ERROR CHECKING: ${imageUrl.substring(0, 60)}...`);
                missingCount++;
              }
            }
          }
        }
      }
      console.log('');
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`   Total products: ${products.length}`);
    console.log(`   Missing images: ${missingCount}`);
    console.log(`   Empty folder placeholders: ${emptyFolderCount}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkImageExistence();
