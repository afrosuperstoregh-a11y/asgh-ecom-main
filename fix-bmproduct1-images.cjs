const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://azpgqsmgyorjbqsgxuxw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6cGdxc21neW9yamJxc2d4dXh3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTI5ODU2MCwiZXhwIjoyMDg0ODc0NTYwfQ.A-gUiUyjt9XWxwB2mCfWScOGDCbSGmm-zXt2G5Xseh0';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixBMProduct1() {
  console.log('🔧 Fixing B&Mproduct1 malformed images field\n');
  
  try {
    // Get the product
    const { data: product, error } = await supabase
      .from('products')
      .select('id, name, images')
      .eq('name', 'B&Mproduct1')
      .single();
    
    if (error) throw error;
    
    console.log(`📦 Product: ${product.name}`);
    console.log(`   Current images type: ${typeof product.images}`);
    console.log(`   Current images value: ${JSON.stringify(product.images)}`);
    
    // Fix: convert string to array
    const fixedImages = Array.isArray(product.images) ? product.images : [product.images];
    
    console.log(`   Fixed images type: ${typeof fixedImages}`);
    console.log(`   Fixed images value: ${JSON.stringify(fixedImages)}`);
    
    // Update the database
    const { error: updateError } = await supabase
      .from('products')
      .update({ images: fixedImages })
      .eq('id', product.id);
    
    if (updateError) throw updateError;
    
    console.log(`\n✅ Fixed B&Mproduct1 images field`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixBMProduct1();
