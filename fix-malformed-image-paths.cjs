const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lljxxaejmueoxsaqaowf.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxsanh4YWVqbXVlb3hzYXFhb3dmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODEwODIyMSwiZXhwIjoyMDkzNjg0MjIxfQ.qXvtkAhMYRSOHSQUFVdLGQypZ0_k-Z5Y2TlDDYJBzFQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixMalformedImagePaths() {
  try {
    console.log('🔍 Checking for products with malformed image paths...');
    
    // Get all products
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, images');
    
    if (error) {
      console.error('❌ Error fetching products:', error);
      return;
    }
    
    console.log(`📊 Found ${products.length} total products`);
    
    const malformedProducts = [];
    
    // Check for malformed image paths
    for (const product of products) {
      if (!product.images || !Array.isArray(product.images) || product.images.length === 0) {
        continue;
      }
      
      const imagePath = product.images[0];
      
      // Check for array syntax or other malformed patterns
      if (imagePath.includes('[') || imagePath.includes(']') || imagePath.includes('undefined') || imagePath === '') {
        malformedProducts.push({
          id: product.id,
          name: product.name,
          currentPath: imagePath
        });
        console.log(`❌ Malformed: ${product.name} - Path: "${imagePath}"`);
      }
    }
    
    console.log(`\n📊 Found ${malformedProducts.length} products with malformed image paths`);
    
    if (malformedProducts.length === 0) {
      console.log('✅ No malformed image paths found');
      return;
    }
    
    // Fix each malformed product
    let fixedCount = 0;
    
    for (const product of malformedProducts) {
      console.log(`\n🔧 Fixing: ${product.name}`);
      
      // Set a placeholder image path
      const placeholderPath = 'placeholder-product.svg';
      
      const { error: updateError } = await supabase
        .from('products')
        .update({ images: [placeholderPath] })
        .eq('id', product.id);
      
      if (updateError) {
        console.error(`❌ Failed to fix ${product.name}:`, updateError.message);
      } else {
        console.log(`✅ Fixed ${product.name} - Set to placeholder`);
        fixedCount++;
      }
    }
    
    console.log(`\n✅ Successfully fixed ${fixedCount}/${malformedProducts.length} products`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixMalformedImagePaths();
