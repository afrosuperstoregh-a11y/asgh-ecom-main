const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://azpgqsmgyorjbqsgxuxw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6cGdxc21neW9yamJxc2d4dXh3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTI5ODU2MCwiZXhwIjoyMDg0ODc0NTYwfQ.A-gUiUyjt9XWxwB2mCfWScOGDCbSGmm-zXt2G5Xseh0';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testImageURLs() {
  console.log('🌐 Testing Image URL Accessibility\n');
  
  try {
    // Get a few products with images
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, images')
      .limit(5);
    
    if (error) throw error;
    
    const fetch = require('node-fetch');
    
    for (const product of products) {
      if (product.images && product.images.length > 0) {
        console.log(`📦 ${product.name}:`);
        
        for (const url of product.images.slice(0, 2)) { // Test first 2 images
          try {
            console.log(`   Testing: ${url}`);
            const response = await fetch(url, { method: 'HEAD' });
            console.log(`   Status: ${response.status} ${response.statusText}`);
            
            if (response.status === 200) {
              console.log(`   ✅ Image accessible`);
            } else {
              console.log(`   ❌ Image not accessible (status ${response.status})`);
            }
          } catch (e) {
            console.log(`   ❌ Error: ${e.message}`);
          }
          console.log('');
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testImageURLs();
