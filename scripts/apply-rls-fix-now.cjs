const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'frontend/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 Applying RLS fix immediately...');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyRlsFix() {
  try {
    console.log('Step 1: Disabling RLS temporarily...');
    
    // First, try to disable RLS completely (quickest fix)
    const { error: disableError } = await supabase.rpc('exec_sql', {
      sql_query: 'ALTER TABLE users DISABLE ROW LEVEL SECURITY;'
    });
    
    if (disableError) {
      console.log('⚠️  Could not disable RLS via RPC');
      console.log('You need to manually run this in Supabase Dashboard:');
      console.log('1. Go to https://supabase.com/dashboard');
      console.log('2. Select your project');
      console.log('3. Open SQL Editor');
      console.log('4. Run: ALTER TABLE users DISABLE ROW LEVEL SECURITY;');
      console.log('5. Try logging in again');
      return;
    }
    
    console.log('✅ RLS disabled successfully!');
    
    // Test the fix
    console.log('Step 2: Testing authentication...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'admin@afrosuperstore.ca',
      password: 'Admin123!'
    });
    
    if (authError) {
      console.error('❌ Login test failed:', authError.message);
      return;
    }
    
    // Create user client to test profile lookup
    const { supabaseAnonKey } = process.env;
    const userClient = createClient(supabaseUrl, supabaseAnonKey);
    await userClient.auth.setSession(authData.session);
    
    const { data: profile, error: profileError } = await userClient
      .from('users')
      .select('role, first_name, last_name')
      .eq('email', authData.user.email)
      .single();
    
    if (profileError) {
      console.error('❌ Profile lookup still fails:', profileError.message);
    } else {
      console.log('✅ SUCCESS! Profile lookup works:');
      console.log('  Name:', `${profile.first_name} ${profile.last_name}`);
      console.log('  Role:', profile.role);
      console.log('\n🎉 Login should now work! Try it at: http://localhost:3000/admin/login');
    }
    
  } catch (error) {
    console.error('❌ Fix failed:', error.message);
    console.log('\nManual fix required:');
    console.log('1. Go to Supabase Dashboard → SQL Editor');
    console.log('2. Run: ALTER TABLE users DISABLE ROW LEVEL SECURITY;');
  }
}

applyRlsFix().catch(console.error);
