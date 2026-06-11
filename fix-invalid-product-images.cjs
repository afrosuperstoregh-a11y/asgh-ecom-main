const { createClient } = require('@supabase/supabase-js');

// Production Supabase project
const supabaseUrl = 'https://lljxxaejmueoxsaqaowf.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxsanh4YWVqbXVlb3hzYXFhb3dmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODEwODIyMSwiZXhwIjoyMDkzNjg0MjIxfQ.qXvtkAhMYRSOHSQUFVdLGQypZ0_k-Z5Y2TlDDYJBzFQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const BUCKET_NAME = 'product-images';

async function fixInvalidProductImages() {
  console.log('🔧 Fixing Invalid Product Images\n');
  
  try {
    // Get all products with images
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, images');
    
    if (error) throw error;
    
    console.log(`📊 Found ${products.length} products\n`);
    
    // Scan storage for available files
    console.log('📁 Scanning storage for available files...');
    const { data: storageFiles, error: storageError } = await supabase.storage
      .from(BUCKET_NAME)
      .list('', { limit: 100 });
    
    if (storageError) throw storageError;
    
    let allFiles = [];
    for (const item of storageFiles) {
      if (item.metadata === null) {
        // It's a folder, list its contents
        const { data: folderFiles, error: folderError } = await supabase.storage
          .from(BUCKET_NAME)
          .list(item.name, { limit: 100 });
        
        if (!folderError) {
          for (const file of folderFiles) {
            allFiles.push(`${item.name}/${file.name}`);
          }
        }
      } else {
        // It's a file
        allFiles.push(item.name);
      }
    }
    
    console.log(`✅ Found ${allFiles.length} files in storage\n`);
    
    // Generate public URLs for all files
    const fileUrls = allFiles.map(file => {
      const { data: { publicUrl } } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(file);
      return publicUrl;
    });
    
    let fixed = 0;
    let errors = 0;
    
    for (const product of products) {
      try {
        // Check if images field is invalid
        let needsFix = false;
        
        if (!product.images) {
          needsFix = true;
        } else if (typeof product.images === 'string') {
          needsFix = true;
        } else if (Array.isArray(product.images) && product.images.length === 0) {
          needsFix = true;
        } else if (Array.isArray(product.images)) {
          // Check if any URL is invalid
          for (const url of product.images) {
            try {
              new URL(url);
            } catch {
              needsFix = true;
              break;
            }
          }
        }
        
        if (needsFix) {
          // Assign random available images
          const numImages = Math.min(Math.floor(Math.random() * 3) + 1, fileUrls.length);
          const shuffled = fileUrls.sort(() => 0.5 - Math.random());
          const newImages = shuffled.slice(0, numImages);
          
          const { error: updateError } = await supabase
            .from('products')
            .update({ images: newImages })
            .eq('id', product.id);
          
          if (updateError) throw updateError;
          
          console.log(`✅ Fixed: ${product.name} (${newImages.length} images)`);
          fixed++;
        }
        
      } catch (error) {
        console.log(`❌ Error fixing ${product.name}: ${error.message}`);
        errors++;
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`  Fixed: ${fixed}`);
    console.log(`  Errors: ${errors}`);
    
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
  }
}

fixInvalidProductImages();
