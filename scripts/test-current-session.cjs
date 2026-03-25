const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'frontend/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testCurrentSession() {
  console.log('Testing current Supabase session...');
  
  try {
    // Get current session
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error getting session:', error);
      return;
    }
    
    if (session) {
      console.log('✅ Active session found:');
      console.log('  User ID:', session.user.id);
      console.log('  Email:', session.user.email);
      console.log('  Expires at:', new Date(session.expires_at * 1000).toLocaleString());
      
      // Test if the session is still valid for API calls
      console.log('\nTesting API access...');
      const response = await fetch('http://localhost:3000/api/admin/customers', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ API access successful');
        console.log('  Customers count:', result.data?.customers?.length || 0);
      } else {
        console.log('❌ API access failed:', response.status);
        const errorText = await response.text();
        console.log('  Error:', errorText);
      }
    } else {
      console.log('❌ No active session found');
      console.log('You need to log in first at: http://localhost:3000/admin/login');
      
      // Test login
      console.log('\nAttempting login...');
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: 'admin@afrosuperstore.ca',
        password: 'Admin123!'
      });
      
      if (loginError) {
        console.error('Login failed:', loginError);
      } else {
        console.log('✅ Login successful!');
        console.log('  User ID:', loginData.user.id);
        console.log('  Email:', loginData.user.email);
        console.log('  Session established');
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testCurrentSession().catch(console.error);
