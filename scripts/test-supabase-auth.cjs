const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'frontend/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSupabaseAuth() {
  console.log('Testing Supabase authentication...');
  
  try {
    // Test login with admin credentials
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'admin@afrosuperstore.ca',
      password: 'Admin123!'
    });

    if (error) {
      console.error('Login failed:', error);
      return;
    }

    console.log('Login successful!');
    console.log('User ID:', data.user.id);
    console.log('Email:', data.user.email);
    console.log('Access Token (first 50 chars):', data.session.access_token.substring(0, 50) + '...');
    
    // Test the customers API with the token
    console.log('\nTesting customers API...');
    const response = await fetch('http://localhost:3000/api/admin/customers', {
      headers: {
        'Authorization': `Bearer ${data.session.access_token}`
      }
    });

    if (response.ok) {
      const result = await response.json();
      console.log('API call successful!');
      console.log('Customers count:', result.data?.customers?.length || 0);
    } else {
      console.error('API call failed:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error details:', errorText);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testSupabaseAuth().catch(console.error);
