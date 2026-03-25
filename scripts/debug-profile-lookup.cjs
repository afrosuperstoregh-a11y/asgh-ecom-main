const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'frontend/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function debugProfileLookup() {
  console.log('Debugging profile lookup...');
  
  try {
    // Get all users from database
    const { data: dbUsers, error: dbError } = await supabaseAdmin
      .from('users')
      .select('*');
    
    if (dbError) {
      console.error('Error fetching database users:', dbError);
      return;
    }
    
    console.log('\n=== Database Users ===');
    dbUsers.forEach(user => {
      console.log(`ID: ${user.id}, Email: ${user.email}, Role: ${user.role}, Name: ${user.first_name} ${user.last_name}`);
    });
    
    // Test the exact lookup that the API uses
    console.log('\n=== Testing API Lookup ===');
    const adminEmail = 'admin@afrosuperstore.ca';
    
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('role, first_name, last_name')
      .eq('email', adminEmail)
      .single();
    
    console.log('Profile lookup result:');
    console.log('Profile:', profile);
    console.log('Error:', profileError);
    
    if (profile) {
      console.log(`\n✅ Found profile for ${adminEmail}:`);
      console.log(`  Role: ${profile.role}`);
      console.log(`  Name: ${profile.first_name} ${profile.last_name}`);
      console.log(`  Is admin/super_admin: ${['admin', 'super_admin'].includes(profile.role)}`);
    } else {
      console.log(`\n❌ No profile found for ${adminEmail}`);
      
      // Check if there's a similar email
      const { data: similarUsers, error: similarError } = await supabaseAdmin
        .from('users')
        .select('*')
        .ilike('email', '%admin%');
      
      if (!similarError) {
        console.log('Users with "admin" in email:');
        similarUsers.forEach(user => {
          console.log(`  ${user.email} (role: ${user.role})`);
        });
      }
    }
    
  } catch (error) {
    console.error('Debug failed:', error);
  }
}

debugProfileLookup().catch(console.error);
