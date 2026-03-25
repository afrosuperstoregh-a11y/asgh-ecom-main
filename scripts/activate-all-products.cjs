// Simple script to activate all products using built-in fetch

async function activateAllProducts() {
  try {
    console.log('Starting to activate all products...');
    
    // Get current products to see status breakdown
    const response = await fetch('http://localhost:3002/api/products?limit=200');
    const result = await response.json();
    
    if (!result.success) {
      console.error('Error fetching products:', result);
      process.exit(1);
    }

    console.log(`Found ${result.data.products.length} products`);
    
    // Count products by status
    const statusCounts = {};
    result.data.products.forEach(product => {
      const status = product.status || 'unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    console.log('Current status breakdown:', statusCounts);
    
    // Update products that don't have 'active' status
    const inactiveProducts = result.data.products.filter(p => p.status !== 'active');
    console.log(`Found ${inactiveProducts.length} products to activate`);
    
    if (inactiveProducts.length === 0) {
      console.log('✅ All products are already active!');
      return;
    }

    // Update each product individually (since we don't have bulk update API)
    let successCount = 0;
    for (const product of inactiveProducts) {
      try {
        const updateResponse = await fetch(`http://localhost:3002/api/products/${product.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...product,
            status: 'active'
          })
        });
        
        if (updateResponse.ok) {
          successCount++;
          if (successCount % 10 === 0) {
            console.log(`Activated ${successCount}/${inactiveProducts.length} products...`);
          }
        } else {
          console.error(`Failed to activate product ${product.id}:`, updateResponse.statusText);
        }
      } catch (err) {
        console.error(`Error activating product ${product.id}:`, err.message);
      }
    }
    
    console.log(`✅ Successfully activated ${successCount}/${inactiveProducts.length} products!`);
    
  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(1);
  }
}

activateAllProducts();
