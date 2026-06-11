const { createClient } = require('@supabase/supabase-js');

// Production Supabase project
const supabaseUrl = 'https://lljxxaejmueoxsaqaowf.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxsanh4YWVqbXVlb3hzYXFhb3dmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODEwODIyMSwiZXhwIjoyMDkzNjg0MjIxfQ.qXvtkAhMYRSOHSQUFVdLGQypZ0_k-Z5Y2TlDDYJBzFQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const BUCKET_NAME = 'product-images';

async function scanStorageRecursively(folder = '', path = '') {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .list(folder, { limit: 100 });
  
  if (error) {
    console.log(`Error listing ${folder}:`, error.message);
    return [];
  }
  
  const files = [];
  
  for (const item of data) {
    const itemPath = path ? `${path}/${item.name}` : item.name;
    
    if (item.metadata === null) {
      // It's a folder, recurse
      const subFiles = await scanStorageRecursively(itemPath, itemPath);
      files.push(...subFiles);
    } else {
      // It's a file
      files.push(itemPath);
    }
  }
  
  return files;
}

async function syncProductionStorageToDatabase() {
  console.log('🔍 Scanning Production Storage and Syncing to Database\n');
  
  try {
    // Scan all files in storage
    console.log('📁 Scanning storage bucket...');
    const allFiles = await scanStorageRecursively();
    console.log(`✅ Found ${allFiles.length} files in storage\n`);
    
    // Generate public URLs for all files
    const fileUrls = allFiles.map(file => {
      const { data: { publicUrl } } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(file);
      return publicUrl;
    });
    
    console.log('📊 Sample URLs:');
    fileUrls.slice(0, 5).forEach(url => console.log(`  - ${url}`));
    console.log('');
    
    // Get all products from database
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, images');
    
    if (productsError) throw productsError;
    
    console.log(`📦 Found ${products.length} products in database\n`);
    
    // Update products with valid image URLs
    let updated = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const product of products) {
      try {
        // Check if current images exist in storage
        let validImages = [];
        
        if (product.images && Array.isArray(product.images)) {
          for (const imageUrl of product.images) {
            // Extract file path from URL
            const urlObj = new URL(imageUrl);
            const pathParts = urlObj.pathname.split('/');
            const bucketIndex = pathParts.indexOf(BUCKET_NAME);
            
            if (bucketIndex !== -1) {
              const filePath = pathParts.slice(bucketIndex + 1).join('/');
              
              // Check if file exists in our scanned files
              if (allFiles.includes(filePath)) {
                // Generate properly encoded URL
                const { data: { publicUrl } } = supabase.storage
                  .from(BUCKET_NAME)
                  .getPublicUrl(filePath);
                validImages.push(publicUrl);
              }
            }
          }
        }
        
        // If no valid images, assign random available images
        if (validImages.length === 0 && fileUrls.length > 0) {
          // Assign 1-3 random images
          const numImages = Math.min(Math.floor(Math.random() * 3) + 1, fileUrls.length);
          const shuffled = fileUrls.sort(() => 0.5 - Math.random());
          validImages = shuffled.slice(0, numImages);
        }
        
        // Update product if images changed
        if (JSON.stringify(product.images) !== JSON.stringify(validImages)) {
          const { error: updateError } = await supabase
            .from('products')
            .update({ images: validImages })
            .eq('id', product.id);
          
          if (updateError) throw updateError;
          
          console.log(`✅ Updated: ${product.name} (${validImages.length} images)`);
          updated++;
        } else {
          skipped++;
        }
        
      } catch (error) {
        console.log(`❌ Error updating ${product.name}: ${error.message}`);
        errors++;
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`  Updated: ${updated}`);
    console.log(`  Skipped: ${skipped}`);
    console.log(`  Errors: ${errors}`);
    
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
  }
}

syncProductionStorageToDatabase();
