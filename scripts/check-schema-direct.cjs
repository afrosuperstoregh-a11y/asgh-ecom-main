/**
 * Check products table schema using direct PostgreSQL connection
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('Checking products table schema...\n');
  
  // Get sample product data first to see what fields exist
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .limit(1);
  
  if (error) {
    console.error('Error fetching products:', error);
    process.exit(1);
  }
  
  if (!products || products.length === 0) {
    console.log('No products found in database');
    process.exit(0);
  }
  
  const sampleProduct = products[0];
  console.log('Sample product fields:');
  console.log(Object.keys(sampleProduct).join('\n'));
  
  console.log('\n\nSample product data:');
  console.log(JSON.stringify(sampleProduct, null, 2));
  
  // Check for image-related fields
  const imageFields = Object.keys(sampleProduct).filter(key =>
    key.toLowerCase().includes('image') || 
    key.toLowerCase().includes('img') ||
    key.toLowerCase().includes('picture') ||
    key.toLowerCase().includes('photo')
  );
  
  console.log('\n\nImage-related fields:', imageFields);
  
  // Get count of products with images
  for (const field of imageFields) {
    const { count } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .not(field, 'is', null);
    
    console.log(`Products with ${field}: ${count || 0}`);
  }
}

checkSchema().catch(console.error);
