// Simple test script to trigger product sync
fetch('http://localhost:3000/api/sync-products', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => {
  console.log('✅ Sync Result:', data);
})
.catch(error => {
  console.error('❌ Sync Error:', error);
});
