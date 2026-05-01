const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://azpgqsmgyorjbqsgxuxw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6cGdxc21neW9yamJxc2d4dXh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyOTg1NjAsImV4cCI6MjA4NDg3NDU2MH0.cxHD8ihT9E5ZAxtkfGa2VjYxYmadbYxyl3xVDPtgh9Q'
);

async function checkSchema() {
  try {
    console.log('🔍 Checking products table schema...');
    
    // Try to get a few products to see what columns exist
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .limit(5);
    
    if (error) {
      console.log('❌ Error:', error.message);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('📊 Products table columns:');
      const columns = Object.keys(data[0]);
      columns.forEach(col => {
        console.log(`   - ${col}`);
      });
      
      console.log('\n📋 Sample product data:');
      data.forEach((product, index) => {
        console.log(`Product ${index + 1}:`);
        Object.entries(product).forEach(([key, value]) => {
          console.log(`   ${key}: ${value}`);
        });
        console.log('');
      });
    } else {
      console.log('❌ No products found in table');
    }
    
  } catch (err) {
    console.log('❌ Error:', err.message);
  }
}

checkSchema();
