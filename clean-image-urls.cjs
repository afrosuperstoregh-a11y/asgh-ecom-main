const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://azpgqsmgyorjbqsgxuxw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6cGdxc21neW9yamJxc2d4dXh3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTI5ODU2MCwiZXhwIjoyMDg0ODc0NTYwfQ.A-gUiUyjt9XWxwB2mCfWScOGDCbSGmm-zXt2G5Xseh0';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

function normalizeImageUrl(url) {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    
    // Find the bucket index
    const bucketIndex = pathParts.indexOf('product-images');
    if (bucketIndex === -1) return url;
    
    // Decode all parts first to handle double-encoding
    const decodedParts = pathParts.map(part => {
      try {
        return decodeURIComponent(part);
      } catch {
        return part;
      }
    });
    
    // Then re-encode each part properly
    const encodedParts = decodedParts.map(part => encodeURIComponent(part));
    
    // Reconstruct the URL
    urlObj.pathname = encodedParts.join('/');
    return urlObj.toString();
  } catch (e) {
    return url;
  }
}

async function cleanImageURLs() {
  console.log('🧹 Cleaning and Normalizing Image URLs\n');
  
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
        
        // Normalize and deduplicate URLs
        const normalizedImages = [...new Set(
          product.images.map(url => normalizeImageUrl(url))
        )];
        
        // Check if any URLs were actually changed
        const hasChanges = 
          originalImages.length !== normalizedImages.length ||
          originalImages.some((url, idx) => url !== normalizedImages[idx]);
        
        if (hasChanges) {
          const { error: updateError } = await supabase
            .from('products')
            .update({ images: normalizedImages })
            .eq('id', product.id);
          
          if (updateError) throw updateError;
          
          console.log(`✅ Fixed: ${product.name}`);
          console.log(`   Before: ${originalImages.length} URLs`);
          console.log(`   After: ${normalizedImages.length} URLs`);
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

cleanImageURLs();
