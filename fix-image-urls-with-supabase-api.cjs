const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://azpgqsmgyorjbqsgxuxw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6cGdxc21neW9yamJxc2d4dXh3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTI5ODU2MCwiZXhwIjoyMDg0ODc0NTYwfQ.A-gUiUyjt9XWxwB2mCfWScOGDCbSGmm-zXt2G5Xseh0';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Map storage paths to their correct format
const BUCKET_NAME = 'product-images';

function getStoragePathFromUrl(url) {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const bucketIndex = pathParts.indexOf(BUCKET_NAME);
    
    if (bucketIndex === -1) return null;
    
    // Extract the path after the bucket name
    const storagePath = pathParts.slice(bucketIndex + 1).join('/');
    
    // Decode the path to get the original storage path
    return decodeURIComponent(storagePath);
  } catch (e) {
    return null;
  }
}

async function fixImageURLsWithSupabaseAPI() {
  console.log('🔧 Fixing Image URLs using Supabase getPublicUrl\n');
  
  try {
    // Get all products with images
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, images')
      .not('images', 'is', null);
    
    if (error) throw error;
    
    console.log(`📊 Found ${products.length} products with images\n`);
    
    let fixed = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const product of products) {
      try {
        if (!product.images || !Array.isArray(product.images)) {
          skipped++;
          continue;
        }
        
        const originalImages = [...product.images];
        const fixedImages = [];
        
        for (const url of originalImages) {
          // Extract the storage path from the URL
          const storagePath = getStoragePathFromUrl(url);
          
          if (storagePath) {
            // Use Supabase's getPublicUrl to generate the correct URL
            const { data: { publicUrl } } = supabase.storage
              .from(BUCKET_NAME)
              .getPublicUrl(storagePath);
            
            fixedImages.push(publicUrl);
          } else {
            // Keep the original URL if we can't extract the path
            fixedImages.push(url);
          }
        }
        
        // Deduplicate
        const uniqueImages = [...new Set(fixedImages)];
        
        // Check if any URLs were actually changed
        const hasChanges = 
          originalImages.length !== uniqueImages.length ||
          originalImages.some((url, idx) => url !== uniqueImages[idx]);
        
        if (hasChanges) {
          const { error: updateError } = await supabase
            .from('products')
            .update({ images: uniqueImages })
            .eq('id', product.id);
          
          if (updateError) throw updateError;
          
          console.log(`✅ Fixed: ${product.name}`);
          console.log(`   Before: ${originalImages.length} URLs`);
          console.log(`   After: ${uniqueImages.length} URLs`);
          fixed++;
        } else {
          skipped++;
        }
        
      } catch (error) {
        console.log(`❌ Error fixing ${product.name}: ${error.message}`);
        errors++;
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`  Fixed: ${fixed}`);
    console.log(`  Skipped: ${skipped}`);
    console.log(`  Errors: ${errors}`);
    
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
  }
}

fixImageURLsWithSupabaseAPI();
