const { createClient } = require('@supabase/supabase-js');

// Production Supabase project
const supabaseUrl = 'https://lljxxaejmueoxsaqaowf.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxsanh4YWVqbXVlb3hzYXFhb3dmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODEwODIyMSwiZXhwIjoyMDkzNjg0MjIxfQ.qXvtkAhMYRSOHSQUFVdLGQypZ0_k-Z5Y2TlDDYJBzFQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const BUCKET_NAME = 'product-images';

function fixDoubleEncoding(url) {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    
    // Find the bucket index
    const bucketIndex = pathParts.indexOf(BUCKET_NAME);
    if (bucketIndex === -1) return url;
    
    // Decode all parts completely to handle double/triple encoding
    const decodedParts = pathParts.map(part => {
      try {
        // Decode repeatedly until no more changes
        let decoded = part;
        let prevDecoded;
        do {
          prevDecoded = decoded;
          decoded = decodeURIComponent(decoded);
        } while (decoded !== prevDecoded);
        return decoded;
      } catch {
        return part;
      }
    });
    
    // Re-encode each part after the bucket name exactly once
    const fixedParts = decodedParts.map((part, idx) => {
      if (idx > bucketIndex) {
        return encodeURIComponent(part);
      }
      return part;
    });
    
    urlObj.pathname = fixedParts.join('/');
    return urlObj.toString();
  } catch (e) {
    return url;
  }
}

async function fixProductionDoubleEncoding() {
  console.log('🔧 Fixing Double Encoding in Production URLs\n');
  
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
        
        // Fix double encoding
        const fixedImages = originalImages.map(url => fixDoubleEncoding(url));
        
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
          if (uniqueImages.length > 0) {
            console.log(`   Sample: ${uniqueImages[0]}`);
          }
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

fixProductionDoubleEncoding();
