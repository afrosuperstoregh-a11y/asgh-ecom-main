const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lljxxaejmueoxsaqaowf.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxsanh4YWVqbXVlb3hzYXFhb3dmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODEwODIyMSwiZXhwIjoyMDkzNjg0MjIxfQ.qXvtkAhMYRSOHSQUFVdLGQypZ0_k-Z5Y2TlDDYJBzFQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkStringifiedArrays() {
  try {
    console.log('🔍 Checking for stringified arrays in images field...\n');
    
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, images');
    
    if (error) {
      console.error('❌ Error fetching products:', error);
      return;
    }
    
    console.log(`📊 Found ${products.length} total products\n`);
    
    let stringifiedCount = 0;
    
    for (const product of products) {
      // Check if images is a string that looks like a JSON array
      if (typeof product.images === 'string') {
        try {
          const parsed = JSON.parse(product.images);
          if (Array.isArray(parsed)) {
            console.log(`⚠️  Stringified array found: ${product.name}`);
            console.log(`   Raw value: ${product.images}`);
            console.log(`   Parsed: ${JSON.stringify(parsed)}`);
            stringifiedCount++;
          }
        } catch (e) {
          // Not a JSON string, that's fine
        }
      }
    }
    
    if (stringifiedCount === 0) {
      console.log('✅ No stringified arrays found');
    } else {
      console.log(`\n❌ Found ${stringifiedCount} products with stringified arrays`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkStringifiedArrays();
