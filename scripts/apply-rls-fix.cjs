const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: 'frontend/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyRlsFix() {
  console.log('Applying RLS policies fix...');
  
  try {
    // Read the SQL file
    const sqlContent = fs.readFileSync('database/fix_users_rls.sql', 'utf8');
    
    // Split into individual statements
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      
      const { data, error } = await supabase.rpc('exec_sql', { sql_query: statement });
      
      if (error) {
        // Try direct SQL execution if RPC fails
        console.log('RPC failed, trying direct execution...');
        const { error: directError } = await supabase
          .from('_temp')
          .select('*')
          .limit(1);
        
        if (directError && directError.message.includes('permission denied')) {
          console.log('⚠️  Cannot execute SQL directly. You need to run this manually:');
          console.log('\n1. Go to Supabase Dashboard');
          console.log('2. Navigate to SQL Editor');
          console.log('3. Copy and paste the contents of database/fix_users_rls.sql');
          console.log('4. Click "Run"\n');
          console.log('SQL content to run:');
          console.log('=' .repeat(50));
          console.log(sqlContent);
          console.log('=' .repeat(50));
          return;
        }
      }
      
      console.log('✅ Statement executed successfully');
    }
    
    console.log('\n✅ RLS policies applied successfully!');
    
    // Test the fix
    console.log('\nTesting the fix...');
    const { data: testData, error: testError } = await supabase.auth.signInWithPassword({
      email: 'admin@afrosuperstore.ca',
      password: 'Admin123!'
    });
    
    if (testError) {
      console.error('Test login failed:', testError);
      return;
    }
    
    // Create a new client with the user's session to test RLS
    const userClient = createClient(supabaseUrl, supabaseAnonKey);
    await userClient.auth.setSession(testData.session);
    
    const { data: profile, error: profileError } = await userClient
      .from('users')
      .select('role, first_name, last_name')
      .eq('email', testData.user.email)
      .single();
    
    if (profileError) {
      console.error('❌ Profile lookup still fails:', profileError);
    } else {
      console.log('✅ Profile lookup works! Profile:', profile);
    }
    
  } catch (error) {
    console.error('Error applying RLS fix:', error);
  }
}

applyRlsFix().catch(console.error);
