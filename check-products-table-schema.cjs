const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lljxxaejmueoxsaqaowf.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxsanh4YWVqbXVlb3hzYXFhb3dmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODEwODIyMSwiZXhwIjoyMDkzNjg0MjIxfQ.qXvtkAhMYRSOHSQUFVdLGQypZ0_k-Z5Y2TlDDYJBzFQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkProductsSchema() {
  try {
    console.log('🔍 Checking products table schema...\n');
    
    // Get one product to see the structure
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error fetching products:', error);
      return;
    }
    
    if (products.length === 0) {
      console.log('⚠️  No products found, checking table structure via SQL...\n');
      
      // Try to get column information
      const { data: columns, error: columnError } = await supabase
        .rpc('get_table_columns', { table_name: 'products' });
      
      if (columnError) {
        console.error('❌ Error getting columns:', columnError);
      } else {
        console.log('📊 Columns:', columns);
      }
      
      return;
    }
    
    console.log('📊 Product structure (from first product):');
    console.log(JSON.stringify(products[0], null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkProductsSchema();
