// Simple test to check database directly
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkDatabase() {
  try {
    console.log('Checking database directly...');
    
    // Count all products regardless of status
    const { data: allProducts, error: countError } = await supabase
      .from('products')
      .select('id, name, status', { count: 'exact' })

    if (countError) {
      console.error('Error counting products:', countError);
      return;
    }

    console.log(`Total products in database: ${allProducts.length}`);
    
    // Count by status
    const statusCounts = {};
    allProducts.forEach(product => {
      const status = product.status || 'unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    console.log('Status breakdown:', statusCounts);
    
    // Count active products
    const { data: activeProducts, error: activeError } = await supabase
      .from('products')
      .select('id, name', { count: 'exact' })
      .eq('status', 'active')

    if (activeError) {
      console.error('Error counting active products:', activeError);
      return;
    }

    console.log(`Active products: ${activeProducts.length}`);
    
    if (allProducts.length === 117) {
      console.log('🎉 SUCCESS: All 117 products are in the database!');
    } else {
      console.log(`⚠️ Expected 117 products, found ${allProducts.length}`);
    }
    
  } catch (error) {
    console.error('Database check failed:', error.message);
  }
}

checkDatabase();
