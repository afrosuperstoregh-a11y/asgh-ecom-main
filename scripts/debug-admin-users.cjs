const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'frontend/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugAdminUsers() {
  console.log('Debugging admin users...');
  
  try {
    // Get all auth users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('Error fetching auth users:', authError);
      return;
    }
    
    console.log('\n=== Auth Users ===');
    authUsers.users.forEach(user => {
      console.log(`ID: ${user.id}, Email: ${user.email}, Created: ${user.created_at}`);
    });
    
    // Get all users from database
    const { data: dbUsers, error: dbError } = await supabase
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
    
    // Test the exact query that login page uses
    console.log('\n=== Testing Login Query ===');
    const adminEmail = 'admin@afrosuperstore.ca';
    
    // First, simulate login to get auth user
    const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password: 'Admin123!'
    });
    
    if (signInError) {
      console.error('Sign in error:', signInError);
      return;
    }
    
    console.log(`Auth user found: ${authData.user.email} (ID: ${authData.user.id})`);
    
    // Now test the profile lookup
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('role, first_name, last_name')
      .eq('email', authData.user.email)
      .single();
    
    console.log('\nProfile lookup result:');
    console.log('Profile:', profile);
    console.log('Error:', profileError);
    
    if (profileError) {
      console.log('\n=== Trying to Fix Profile ===');
      
      // Check if user exists in database with different email format
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('*')
        .ilike('email', adminEmail);
      
      if (checkError) {
        console.error('Error checking existing user:', checkError);
      } else {
        console.log('Found users with similar email:', existingUser);
        
        if (existingUser.length === 0) {
          // Create the user profile
          console.log('Creating user profile...');
          const { data: newUser, error: createError } = await supabase
            .from('users')
            .insert({
              email: authData.user.email,
              first_name: 'Super',
              last_name: 'Admin',
              role: 'super_admin',
              email_verified: true
            })
            .select()
            .single();
          
          if (createError) {
            console.error('Error creating user profile:', createError);
          } else {
            console.log('✅ User profile created:', newUser);
          }
        } else {
          console.log('User profile already exists but email mismatch');
        }
      }
    }
    
  } catch (error) {
    console.error('Debug failed:', error);
  }
}

debugAdminUsers().catch(console.error);
