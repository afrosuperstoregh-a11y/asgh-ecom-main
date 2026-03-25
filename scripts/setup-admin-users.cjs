const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'frontend/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const adminUsers = [
  {
    email: 'admin@afrosuperstore.ca',
    password: 'Admin123!',
    role: 'super_admin',
    first_name: 'Super',
    last_name: 'Admin'
  },
  {
    email: 'info@afrosuperstore.ca',
    password: 'Iamtech@100',
    role: 'admin',
    first_name: 'Tech',
    last_name: 'Admin'
  }
];

async function setupAdminUsers() {
  console.log('Setting up admin users...');
  
  for (const adminUser of adminUsers) {
    try {
      console.log(`Creating/Updating user: ${adminUser.email}`);
      
      // First, try to get the user by using the admin API
      const { data: existingUsers, error: fetchError } = await supabase.auth.admin.listUsers();
      
      if (fetchError) {
        console.error(`Error fetching users:`, fetchError);
        continue;
      }
      
      const existingUser = existingUsers.users.find(u => u.email === adminUser.email);
      
      let userId;
      
      if (existingUser) {
        // User exists, update their password if needed
        userId = existingUser.id;
        console.log(`User ${adminUser.email} exists with ID: ${userId}`);
        
        // Update password
        const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
          password: adminUser.password
        });
        
        if (updateError) {
          console.error(`Error updating password for ${adminUser.email}:`, updateError);
        } else {
          console.log(`Updated password for ${adminUser.email}`);
        }
      } else {
        // Create new user
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email: adminUser.email,
          password: adminUser.password,
          email_confirm: true
        });
        
        if (createError) {
          console.error(`Error creating user ${adminUser.email}:`, createError);
          continue;
        }
        
        userId = newUser.user.id;
        console.log(`Created user ${adminUser.email} with ID: ${userId}`);
      }
      
      // Update user profile in users table
      const { error: profileError } = await supabase
        .from('users')
        .upsert({
          email: adminUser.email,
          first_name: adminUser.first_name,
          last_name: adminUser.last_name,
          role: adminUser.role,
          email_verified: true
        }, {
          onConflict: 'email'
        })
        .select();
      
      if (profileError) {
        console.error(`Error updating profile for ${adminUser.email}:`, profileError);
      } else {
        console.log(`Updated profile for ${adminUser.email} with role: ${adminUser.role}`);
      }
      
    } catch (error) {
      console.error(`Error processing user ${adminUser.email}:`, error);
    }
  }
  
  console.log('Admin users setup complete!');
}

setupAdminUsers().catch(console.error);
