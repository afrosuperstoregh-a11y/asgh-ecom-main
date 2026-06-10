const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://azpgqsmgyorjbqsgxuxw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6cGdxc21neW9yamJxc2d4dXh3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTI5ODU2MCwiZXhwIjoyMDg0ODc0NTYwfQ.A-gUiUyjt9XWxwB2mCfWScOGDCbSGmm-zXt2G5Xseh0';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSchema() {
  console.log('🔍 Checking actual database schema...\n');
  
  // Query information_schema to get all tables
  const { data: tables, error: tablesError } = await supabase
    .rpc('get_tables'); // This might not exist, let's try direct SQL
  
  // Alternative: use a direct query
  const { data: schemaData, error: schemaError } = await supabase
    .from('information_schema.tables')
    .select('table_name, table_schema')
    .eq('table_schema', 'public')
    .order('table_name');
  
  if (schemaError) {
    console.log('❌ Error fetching schema:', schemaError.message);
    
    // Try another approach - list known tables
    const knownTables = ['products', 'categories', 'product_images', 'profiles', 'orders', 'cart', 'wishlist', 'reviews', 'addresses', 'inventory_logs', 'payments'];
    
    for (const table of knownTables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`❌ ${table}: ${error.message}`);
        } else {
          console.log(`✅ ${table}: exists (${data.length} records)`);
        }
      } catch (e) {
        console.log(`❌ ${table}: ${e.message}`);
      }
    }
  } else {
    console.log('📋 Tables in public schema:');
    schemaData.forEach(t => {
      console.log(`  - ${t.table_name}`);
    });
  }
  
  // Check products table structure
  console.log('\n🔍 Products table structure:');
  const { data: products, error: prodError } = await supabase
    .from('products')
    .select('*')
    .limit(1);
  
  if (prodError) {
    console.log('❌ Error:', prodError.message);
  } else if (products.length > 0) {
    console.log('Columns:', Object.keys(products[0]).join(', '));
  }
  
  // Check if product_images table exists
  console.log('\n🔍 Checking product_images table...');
  try {
    const { data: prodImages, error: imgError } = await supabase
      .from('product_images')
      .select('*')
      .limit(1);
    
    if (imgError) {
      console.log('❌ product_images table does not exist or is not accessible:', imgError.message);
    } else {
      console.log('✅ product_images table exists');
      console.log('Columns:', Object.keys(prodImages[0] || {}).join(', '));
    }
  } catch (e) {
    console.log('❌ Exception:', e.message);
  }
}

checkSchema();
