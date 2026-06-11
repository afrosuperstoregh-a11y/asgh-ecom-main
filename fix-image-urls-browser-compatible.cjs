const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://azpgqsmgyorjbqsgxuxw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6cGdxc21neW9yamJxc2d4dXh3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTI5ODU2MCwiZXhwIjoyMDg0ODc0NTYwfQ.A-gUiUyjt9XWxwB2mCfWScOGDCbSGmm-zXt2G5Xseh0';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const BUCKET_NAME = 'product-images';

function encodeUrlForBrowser(url) {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    
    // Find the bucket index
    const bucketIndex = pathParts.indexOf(BUCKET_NAME);
    if (bucketIndex === -1) return url;
    
    // Encode each path part after the bucket name
    const encodedParts = pathParts.map((part, idx) => {
      if (idx > bucketIndex) {
        return encodeURIComponent(part);
      }
      return part;
    });
    
    urlObj.pathname = encodedParts.join('/');
    return urlObj.toString();
  } catch (e) {
    return url;
  }
}

async function fixImageURLsBrowserCompatible() {
  console.log('🔧 Fixing Image URLs for Browser Compatibility\n');
  
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
        
        // Encode URLs for browser compatibility
        const encodedImages = originalImages.map(url => encodeUrlForBrowser(url));
        
        // Deduplicate
        const uniqueImages = [...new Set(encodedImages)];
        
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

fixImageURLsBrowserCompatible();
