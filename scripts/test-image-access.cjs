/**
 * Test if product images are actually accessible
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testImageAccess() {
  console.log('Testing image accessibility...\n');
  
  // Get products with images
  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, images')
    .not('images', 'is', null)
    .limit(5);
  
  if (error) {
    console.error('Error fetching products:', error);
    process.exit(1);
  }
  
  console.log(`Found ${products.length} products with images\n`);
  
  for (const product of products) {
    console.log(`\nProduct: ${product.name}`);
    console.log(`Images: ${JSON.stringify(product.images)}`);
    
    if (product.images && product.images.length > 0) {
      const imageUrl = product.images[0];
      console.log(`Testing URL: ${imageUrl}`);
      
      // Try to fetch the image
      try {
        const response = await fetch(imageUrl, { method: 'HEAD' });
        console.log(`Status: ${response.status} ${response.statusText}`);
        console.log(`Content-Type: ${response.headers.get('content-type')}`);
        console.log(`Accessible: ${response.ok ? '✓' : '✗'}`);
      } catch (err) {
        console.log(`Error: ${err.message}`);
        console.log(`Accessible: ✗`);
      }
    }
  }
}

testImageAccess().catch(console.error);
