const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Only create Supabase client if credentials are provided
let supabase = null;
if (supabaseUrl && supabaseServiceKey) {
  supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

// Test Supabase connection
async function testConnection() {
  if (!supabase) {
    console.log('⚠️ Supabase not configured - using database only');
    return false;
  }
  
  try {
    const { data, error } = await supabase.from('users').select('count').limit(1);
    if (error) {
      console.error('❌ Supabase connection failed:', error);
      return false;
    }
    console.log('✅ Supabase connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection error:', error);
    return false;
  }
}

// Find user by email using Supabase database
async function findUserByEmail(email) {
  try {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }
    
    // Query the users table directly
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error finding user in Supabase:', error);
      throw error;
    }
    
    if (user) {
      console.log('✅ User found in Supabase database:', user.email);
      return user;
    }
    
    return null;
  } catch (error) {
    console.error('Error finding user by email in Supabase:', error);
    throw error;
  }
}

// Create user in Supabase Auth and database
async function createUser(userData) {
  try {
    const { email, password, first_name, last_name, role = 'customer' } = userData;
    
    // Create user in Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name,
        last_name,
        role
      }
    });
    
    if (error) {
      throw error;
    }
    
    // Create user record in database
    const { data: dbUser, error: dbError } = await supabase
      .from('users')
      .insert({
        id: data.user.id,
        email,
        first_name,
        last_name,
        role,
        email_verified: true
      })
      .select()
      .single();
    
    if (dbError && dbError.code !== 'PGRST116') {
      console.error('Error creating database user:', dbError);
    }
    
    return {
      id: data.user.id,
      email: data.user.email,
      email_verified: true,
      first_name,
      last_name,
      role,
      created_at: data.user.created_at,
      updated_at: data.user.updated_at
    };
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

module.exports = {
  supabase,
  testConnection,
  findUserByEmail,
  createUser
};
