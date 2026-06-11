const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://azpgqsmgyorjbqsgxuxw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6cGdxc21neW9yamJxc2d4dXh3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTI5ODU2MCwiZXhwIjoyMDg0ODc0NTYwfQ.A-gUiUyjt9XWxwB2mCfWScOGDCbSGmm-zXt2G5Xseh0';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

function encodeStoragePath(path) {
  // Split the path into parts and encode each part separately
  const parts = path.split('/');
  const encodedParts = parts.map(part => encodeURIComponent(part));
  return encodedParts.join('/');
}

function fixImageUrl(url) {
  // Extract the path from the URL
  const urlObj = new URL(url);
  const pathParts = urlObj.pathname.split('/');
  
  // Find the bucket name and encode the rest
  const bucketIndex = pathParts.indexOf('product-images');
  if (bucketIndex === -1) return url;
  
  // Keep everything up to and including the bucket name
  const prefix = pathParts.slice(0, bucketIndex + 1).join('/');
  // Encode the remaining path parts
  const suffix = pathParts.slice(bucketIndex + 1).map(encodeURIComponent).join('/');
  
  // Reconstruct the URL
  urlObj.pathname = `${prefix}/${suffix}`;
  return urlObj.toString();
}

async function fixImageURLs() {
  console.log('🔧 Fixing Image URL Encoding\n');
  
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
        const fixedImages = product.images.map(url => fixImageUrl(url));
        
        // Check if any URLs were actually changed
        const hasChanges = originalImages.some((url, idx) => url !== fixedImages[idx]);
        
        if (hasChanges) {
          const { error: updateError } = await supabase
            .from('products')
            .update({ images: fixedImages })
            .eq('id', product.id);
          
          if (updateError) throw updateError;
          
          console.log(`✅ Fixed: ${product.name}`);
          fixedImages.forEach((url, idx) => {
            if (originalImages[idx] !== url) {
              console.log(`   ${idx + 1}. ${originalImages[idx]}`);
              console.log(`   → ${url}`);
            }
          });
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

fixImageURLs();
