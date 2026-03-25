const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'frontend/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testDashboardApi() {
  console.log('Testing dashboard API endpoint...');
  
  try {
    // Login first
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'admin@afrosuperstore.ca',
      password: 'Admin123!'
    });

    if (error) {
      console.error('Login failed:', error);
      return;
    }

    console.log('✅ Login successful');

    // Test the dashboard API
    const response = await fetch('http://localhost:3000/api/admin/dashboard', {
      headers: {
        'Authorization': `Bearer ${data.session.access_token}`
      }
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Dashboard API successful!');
      console.log('Dashboard data:', result.data);
    } else {
      console.error('❌ Dashboard API failed:', response.status);
      const errorText = await response.text();
      console.error('Error:', errorText);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testDashboardApi().catch(console.error);
