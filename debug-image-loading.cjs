const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://azpgqsmgyorjbqsgxuxw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6cGdxc21neW9yamJxc2d4dXh3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTI5ODU2MCwiZXhwIjoyMDg0ODc0NTYwfQ.A-gUiUyjt9XWxwB2mCfWScOGDCbSGmm-zXt2G5Xseh0';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugImageURLs() {
  console.log('🔍 Debugging Image URLs\n');
  
  try {
    // Get some products with images
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, images')
      .limit(10);
    
    if (error) throw error;
    
    console.log(`📊 Found ${products.length} products\n`);
    
    for (const product of products) {
      if (product.images && product.images.length > 0) {
        console.log(`📦 ${product.name}:`);
        product.images.forEach((url, idx) => {
          console.log(`   ${idx + 1}. ${url}`);
          
          // Check if URL is properly encoded
          const hasSpecialChars = /[&]/.test(url);
          const isEncoded = /%26/.test(url);
          
          if (hasSpecialChars && !isEncoded) {
            console.log(`      ⚠️  URL contains unencoded special characters`);
            console.log(`      🔧 Encoded: ${encodeURIComponent(url)}`);
          }
        });
        console.log('');
      }
    }
    
    // Test actual URL accessibility
    console.log('🌐 Testing URL accessibility...\n');
    
    const testProduct = products.find(p => p.images && p.images.length > 0);
    if (testProduct && testProduct.images[0]) {
      const testUrl = testProduct.images[0];
      console.log(`Testing: ${testUrl}`);
      
      try {
        const fetch = require('node-fetch');
        const response = await fetch(testUrl, { method: 'HEAD' });
        console.log(`Status: ${response.status}`);
        console.log(`Headers: ${JSON.stringify(Object.fromEntries(response.headers), null, 2)}`);
      } catch (e) {
        console.log(`Error: ${e.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugImageURLs();
