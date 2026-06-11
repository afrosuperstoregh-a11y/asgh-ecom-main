const { createClient } = require('@supabase/supabase-js');

// Production Supabase project
const supabaseUrl = 'https://lljxxaejmueoxsaqaowf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxsanh4YWVqbXVlb3hzYXFhb3dmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxMDgyMjEsImV4cCI6MjA5MzY4NDIyMX0.LM2zS7a7utqqtU5DN4ADy7uCzugnshNAfG8a4gPlQfk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyProductionImages() {
  console.log('🔍 Verifying Production Image Loading\n');
  
  try {
    // Get all products with images
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, images')
      .not('images', 'is', null);
    
    if (error) throw error;
    
    console.log(`📊 Found ${products.length} products with images\n`);
    
    let valid = 0;
    let invalid = 0;
    
    for (const product of products) {
      if (!product.images || !Array.isArray(product.images) || product.images.length === 0) {
        console.log(`❌ ${product.name}: No images`);
        invalid++;
        continue;
      }
      
      console.log(`📦 ${product.name}:`);
      
      for (const imageUrl of product.images) {
        try {
          // Extract file path from URL
          const urlObj = new URL(imageUrl);
          const pathParts = urlObj.pathname.split('/');
          const bucketIndex = pathParts.indexOf('product-images');
          
          if (bucketIndex !== -1) {
            const filePath = pathParts.slice(bucketIndex + 1).join('/');
            
            // Try to download the file
            const { data, error: downloadError } = await supabase.storage
              .from('product-images')
              .download(filePath);
            
            if (downloadError) {
              console.log(`   ❌ ${filePath}: ${downloadError.message}`);
              invalid++;
            } else {
              console.log(`   ✅ ${filePath} (${data.size} bytes)`);
              valid++;
            }
          } else {
            console.log(`   ❌ Invalid URL format: ${imageUrl}`);
            invalid++;
          }
        } catch (e) {
          console.log(`   ❌ Error: ${e.message}`);
          invalid++;
        }
      }
      
      console.log('');
    }
    
    console.log(`📊 Summary:`);
    console.log(`  Valid images: ${valid}`);
    console.log(`  Invalid images: ${invalid}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

verifyProductionImages();
