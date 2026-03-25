const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'frontend/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugUsers() {
  console.log('Debugging user data...');
  
  try {
    // Get all auth users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('Error fetching auth users:', authError);
      return;
    }
    
    console.log('\n=== Auth Users ===');
    authUsers.users.forEach(user => {
      console.log(`ID: ${user.id}, Email: ${user.email}`);
    });
    
    // Get all users from database
    const { data: dbUsers, error: dbError } = await supabase
      .from('users')
      .select('id, email, role, first_name, last_name');
    
    if (dbError) {
      console.error('Error fetching database users:', dbError);
      return;
    }
    
    console.log('\n=== Database Users ===');
    dbUsers.forEach(user => {
      console.log(`ID: ${user.id}, Email: ${user.email}, Role: ${user.role}`);
    });
    
    // Check for mismatches
    console.log('\n=== Checking for ID mismatches ===');
    const adminEmail = 'admin@afrosuperstore.ca';
    const authUser = authUsers.users.find(u => u.email === adminEmail);
    const dbUser = dbUsers.find(u => u.email === adminEmail);
    
    if (authUser && dbUser) {
      console.log(`Auth user ID: ${authUser.id}`);
      console.log(`DB user ID: ${dbUser.id}`);
      console.log(`IDs match: ${authUser.id === dbUser.id}`);
      
      if (authUser.id !== dbUser.id) {
        console.log('Updating database user ID to match auth user...');
        const { error: updateError } = await supabase
          .from('users')
          .update({ id: authUser.id })
          .eq('email', adminEmail);
        
        if (updateError) {
          console.error('Error updating user ID:', updateError);
        } else {
          console.log('Successfully updated user ID!');
        }
      }
    } else {
      console.log('User not found in one of the tables');
    }
    
  } catch (error) {
    console.error('Debug failed:', error);
  }
}

debugUsers().catch(console.error);
