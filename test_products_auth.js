// Test script to check the products API with authentication
async function testProductsWithAuth() {
    try {
        console.log('🧪 Testing Products API with Authentication...\n');

        // First, let's simulate a login to get the token
        console.log('1️⃣ Testing login...');
        const loginResponse = await fetch('http://localhost:3001/api/admin/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'info@afrosuperstore.ca',
                password: 'Iamtech@100'
            })
        });

        console.log('Login response status:', loginResponse.status);
        
        if (loginResponse.ok) {
            const loginData = await loginResponse.json();
            console.log('Login successful:', loginData.success);
            
            // Get the cookies from the response
            const setCookieHeader = loginResponse.headers.get('set-cookie');
            console.log('Set-Cookie headers:', setCookieHeader);
            
            // Now test the products API with the cookies
            console.log('\n2️⃣ Testing products API...');
            
            // Extract cookies from the login response
            const cookies = {};
            if (setCookieHeader) {
                setCookieHeader.split(',').forEach(cookie => {
                    const [name, ...rest] = cookie.split('=');
                    const value = rest.join('=').split(';')[0];
                    cookies[name.trim()] = value;
                });
            }
            
            console.log('Extracted cookies:', Object.keys(cookies));
            
            // Make the products request with cookies
            const cookieString = Object.entries(cookies)
                .map(([name, value]) => `${name}=${value}`)
                .join('; ');
            
            console.log('Cookie string:', cookieString);
            
            const productsResponse = await fetch('http://localhost:3001/api/admin/products', {
                method: 'GET',
                headers: {
                    'Cookie': cookieString
                }
            });
            
            console.log('Products response status:', productsResponse.status);
            console.log('Products response headers:', Object.fromEntries(productsResponse.headers.entries()));
            
            if (productsResponse.ok) {
                const productsData = await productsResponse.json();
                console.log('✅ Products API working!');
                console.log('Products count:', productsData.data?.products?.length || 0);
                console.log('Success:', productsData.success);
            } else {
                const errorData = await productsResponse.json();
                console.log('❌ Products API failed:', errorData);
            }
            
        } else {
            const loginError = await loginResponse.json();
            console.log('❌ Login failed:', loginError);
        }

    } catch (error) {
        console.error('❌ Test error:', error);
    }
}

testProductsWithAuth();
