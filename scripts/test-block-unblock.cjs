const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'frontend/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testBlockUnblock() {
  console.log('Testing block/unblock functionality...');
  
  try {
    // Login as admin
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'admin@afrosuperstore.ca',
      password: 'Admin123!'
    });

    if (error) {
      console.error('Login failed:', error);
      return;
    }

    const token = data.session.access_token;
    console.log('Login successful!');

    // Get current customers
    console.log('\nFetching customers...');
    const customersResponse = await fetch('http://localhost:3000/api/admin/customers', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!customersResponse.ok) {
      console.error('Failed to fetch customers:', customersResponse.statusText);
      return;
    }

    const customersData = await customersResponse.json();
    const customers = customersData.data?.customers || [];
    
    console.log(`Found ${customers.length} customers`);
    
    // Find a customer to test with (not the admin user)
    const testCustomer = customers.find(c => c.email !== 'admin@afrosuperstore.ca');
    
    if (!testCustomer) {
      console.log('No suitable test customer found');
      return;
    }

    console.log(`\nTesting with customer: ${testCustomer.email} (ID: ${testCustomer.id}, Role: ${testCustomer.role})`);

    // Test blocking
    console.log('\nTesting block...');
    const blockResponse = await fetch(`http://localhost:3000/api/admin/customers/${testCustomer.id}/block`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        reason: 'Test block by script'
      })
    });

    if (blockResponse.ok) {
      const blockResult = await blockResponse.json();
      console.log('Block successful:', blockResult.message);
    } else {
      console.error('Block failed:', blockResponse.statusText);
      const errorText = await blockResponse.text();
      console.error('Error details:', errorText);
    }

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test unblocking
    console.log('\nTesting unblock...');
    const unblockResponse = await fetch(`http://localhost:3000/api/admin/customers/${testCustomer.id}/unblock`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        reason: 'Test unblock by script'
      })
    });

    if (unblockResponse.ok) {
      const unblockResult = await unblockResponse.json();
      console.log('Unblock successful:', unblockResult.message);
    } else {
      console.error('Unblock failed:', unblockResponse.statusText);
      const errorText = await unblockResponse.text();
      console.error('Error details:', errorText);
    }

    console.log('\nBlock/unblock testing complete!');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testBlockUnblock().catch(console.error);
