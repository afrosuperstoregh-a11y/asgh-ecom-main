const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://azpgqsmgyorjbqsgxuxw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6cGdxc21neW9yamJxc2d4dXh3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTI5ODU2MCwiZXhwIjoyMDg0ODc0NTYwfQ.A-gUiUyjt9XWxwB2mCfWScOGDCbSGmm-zXt2G5Xseh0';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

function generateSKU(name) {
  const prefix = name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${random}`;
}

async function fixProductMetadata() {
  console.log('🔧 Fixing Product Metadata (slugs and SKUs)\n');
  
  try {
    // Get all products missing slug or sku
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, slug, sku')
      .or('slug.is.null,sku.is.null');
    
    if (error) throw error;
    
    console.log(`📊 Found ${products.length} products missing metadata\n`);
    
    let fixed = 0;
    let errors = 0;
    
    for (const product of products) {
      try {
        const updates = {};
        
        if (!product.slug) {
          updates.slug = slugify(product.name);
        }
        
        if (!product.sku) {
          updates.sku = generateSKU(product.name);
        }
        
        if (Object.keys(updates).length > 0) {
          const { error: updateError } = await supabase
            .from('products')
            .update(updates)
            .eq('id', product.id);
          
          if (updateError) throw updateError;
          
          console.log(`✅ Fixed: ${product.name}`);
          console.log(`   Slug: ${updates.slug || 'existing'}`);
          console.log(`   SKU: ${updates.sku || 'existing'}`);
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

fixProductMetadata();
