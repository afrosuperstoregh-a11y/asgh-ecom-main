// Simple test to check if the products page loads
console.log('🧪 Testing Products Page Load...\n');

// Function to test the products API directly
async function testProductsPage() {
    try {
        console.log('1️⃣ Testing direct API call...');
        
        // First try to login to get cookies
        const loginResponse = await fetch('/api/admin/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'info@afrosuperstore.ca',
                password: 'Iamtech@100'
            })
        });
        
        console.log('Login status:', loginResponse.status);
        
        if (loginResponse.ok) {
            console.log('✅ Login successful');
            
            // Now try to access products page
            console.log('\n2️⃣ Testing products page...');
            window.location.href = '/admin/products';
            
        } else {
            console.log('❌ Login failed');
        }
        
    } catch (error) {
        console.error('❌ Test error:', error);
    }
}

// Auto-run the test
testProductsPage();
