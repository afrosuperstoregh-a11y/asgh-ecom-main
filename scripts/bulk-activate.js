// Simple script to activate all products using the bulk API endpoint

async function activateAllProducts() {
  try {
    console.log('Starting bulk activation of all products...');
    
    // Call the bulk activate endpoint
    const response = await fetch('http://localhost:3002/api/products/bulk-activate', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer your-admin-token-here' // You'll need to provide a valid admin token
      }
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Success:', result.message);
      console.log(`Activated: ${result.data.activated} products`);
      console.log(`Already active: ${result.data.alreadyActive} products`);
    } else {
      console.error('❌ Error:', result.message);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

activateAllProducts();
