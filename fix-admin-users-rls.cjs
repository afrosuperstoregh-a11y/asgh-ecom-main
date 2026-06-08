const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('SUPABASE_URL:', supabaseUrl ? 'SET' : 'MISSING');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'SET' : 'MISSING');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixAdminUsersRLS() {
  try {
    console.log('Disabling RLS on admin_users table...');
    
    const { data, error } = await supabase
      .rpc('exec_sql', { 
        sql: 'ALTER TABLE public.admin_users DISABLE ROW LEVEL SECURITY;' 
      });
    
    if (error) {
      // Try direct SQL execution via REST API
      console.log('Trying alternative method...');
      const response = await fetch(`${supabaseUrl}/rest/v1/admin_users`, {
        method: 'OPTIONS',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Please run the SQL manually in Supabase Dashboard SQL Editor:');
      console.log('ALTER TABLE public.admin_users DISABLE ROW LEVEL SECURITY;');
      return;
    }
    
    console.log('✅ RLS disabled on admin_users table successfully');
    
    // Verify the change
    console.log('Verifying RLS status...');
    const { data: tables, error: verifyError } = await supabase
      .rpc('exec_sql', { 
        sql: `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = 'admin_users';` 
      });
    
    if (verifyError) {
      console.log('Could not verify automatically. Please check manually.');
    } else {
      console.log('Verification result:', tables);
    }
    
  } catch (error) {
    console.error('Error applying fix:', error.message);
    console.log('\nPlease run the SQL manually in Supabase Dashboard SQL Editor:');
    console.log('ALTER TABLE public.admin_users DISABLE ROW LEVEL SECURITY;');
  }
}

fixAdminUsersRLS();
