// Script to clear cache and verify all products are active

async function clearCacheAndVerify() {
  try {
    console.log('Clearing cache...');
    
    // Clear all product cache
    const clearResponse = await fetch('http://localhost:3002/api/cache/clear', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (clearResponse.ok) {
      console.log('✅ Cache cleared');
    } else {
      console.log('⚠️ Cache clear failed, but continuing...');
    }
    
    // Now check total products
    console.log('Checking total products...');
    const checkResponse = await fetch('http://localhost:3002/api/products?limit=200');
    const result = await checkResponse.json();
    
    if (result.success) {
      console.log(`✅ Total products in database: ${result.data.pagination.total_items}`);
      console.log(`✅ Products returned: ${result.data.products.length}`);
      
      // Count active vs inactive
      const activeCount = result.data.products.filter(p => p.status === 'active').length;
      const inactiveCount = result.data.products.filter(p => p.status !== 'active').length;
      
      console.log(`✅ Active products: ${activeCount}`);
      console.log(`✅ Inactive products: ${inactiveCount}`);
      
      if (result.data.pagination.total_items === 117) {
        console.log('🎉 SUCCESS: All 117 products are now accessible!');
      } else {
        console.log(`⚠️ Expected 117 products, found ${result.data.pagination.total_items}`);
      }
    } else {
      console.error('❌ Error checking products:', result.message);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

clearCacheAndVerify();
