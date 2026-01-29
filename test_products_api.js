// Test script to verify the products API endpoint
async function testProductsAPI() {
    try {
        console.log('🧪 Testing Products API Endpoint...\n');

        // First, let's test the API without authentication to see the exact error
        console.log('1️⃣ Testing API without authentication...');
        const response = await fetch('http://localhost:3001/api/admin/products', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));
        
        const data = await response.json();
        console.log('Response body:', data);

        // Test with a mock authentication token
        console.log('\n2️⃣ Testing API with mock token...');
        const mockResponse = await fetch('http://localhost:3001/api/admin/products', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer mock-token'
            }
        });

        console.log('Mock auth response status:', mockResponse.status);
        const mockData = await mockResponse.json();
        console.log('Mock auth response:', mockData);

    } catch (error) {
        console.error('❌ API test error:', error);
    }
}

// Only run if the server is available
testProductsAPI();
