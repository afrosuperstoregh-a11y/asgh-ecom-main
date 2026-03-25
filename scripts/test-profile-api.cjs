const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'frontend/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testProfileApi() {
  console.log('Testing profile API endpoint...');
  
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
    console.log('Session token:', data.session.access_token.substring(0, 50) + '...');

    // Test the profile API
    const response = await fetch('http://localhost:3000/api/admin/auth/profile', {
      headers: {
        'Authorization': `Bearer ${data.session.access_token}`
      }
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Profile API successful!');
      console.log('Profile data:', result.data);
    } else {
      console.error('❌ Profile API failed:', response.status);
      const errorText = await response.text();
      console.error('Error:', errorText);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testProfileApi().catch(console.error);
