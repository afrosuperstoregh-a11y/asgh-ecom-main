/**
 * Check the actual products table schema
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
  
  // Get column information
  const { data, error } = await supabase.rpc('get_table_columns', {
    table_name: 'products'
  });
  
  if (error) {
    console.error('Error getting columns:', error);
    
    // Alternative: query information_schema
    const { data: columns, error: err } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'products')
      .eq('table_schema', 'public')
      .order('ordinal_position');
    
    if (err) {
      console.error('Error from information_schema:', err);
      return;
    }
    
    console.log('Columns in products table:');
    console.table(columns);
    
    // Check for image-related columns
    const imageColumns = columns.filter(col => 
      col.column_name.toLowerCase().includes('image') || 
      col.column_name.toLowerCase().includes('img') ||
      col.column_name.toLowerCase().includes('picture') ||
      col.column_name.toLowerCase().includes('photo')
    );
    
    console.log('\nImage-related columns:');
    console.table(imageColumns);
    
  } else {
    console.log('Columns:', data);
  }
  
  // Get sample data
  console.log('\n\nSample product data:');
  const { data: products, error: prodError } = await supabase
    .from('products')
    .select('*')
    .limit(1);
  
  if (prodError) {
    console.error('Error fetching products:', prodError);
  } else {
    console.log('Sample product:');
    console.log(JSON.stringify(products[0], null, 2));
  }
}

checkSchema().catch(console.error);
