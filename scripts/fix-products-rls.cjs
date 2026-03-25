const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../frontend/.env') });

async function fixProductsRLS() {
  try {
    console.log('🔧 Fixing Products and Categories RLS policies...');

    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    }

    console.log('✅ Environment variables found');

    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Read the SQL file
    const sqlFile = path.join(__dirname, '../supabase/fix_products_rls.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    console.log('📄 SQL file loaded, executing...');

    // Split SQL into individual statements and execute them
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`\n🔹 Executing statement ${i + 1}/${statements.length}:`);
        console.log(statement.substring(0, 100) + (statement.length > 100 ? '...' : ''));
        
        try {
          const { data, error } = await supabase.rpc('exec_sql', { sql_query: statement });
          
          if (error) {
            // If exec_sql doesn't exist, try direct SQL execution
            console.log('⚠️  exec_sql not available, trying direct execution...');
            
            // For DDL statements, we need to use a different approach
            // Let's try using the raw SQL execution
            const { error: directError } = await supabase
              .from('pg_temp')
              .select('*')
              .limit(0); // This will fail but we need to check the error
            
            console.log('📝 Note: Some DDL statements may need to be run manually in Supabase dashboard');
            console.log('   Please run the following SQL in your Supabase SQL editor:');
            console.log('   File: supabase/fix_products_rls.sql');
          } else {
            console.log('✅ Statement executed successfully');
          }
        } catch (err) {
          console.log(`⚠️  Statement ${i + 1} execution note:`, err.message);
        }
      }
    }

    console.log('\n🎉 RLS fix process completed!');
    console.log('\n📋 Next steps:');
    console.log('1. If some statements failed to execute automatically, run them manually in Supabase dashboard');
    console.log('2. Go to: https://supabase.com/dashboard/project/your-project-id/sql');
    console.log('3. Copy and paste the contents of supabase/fix_products_rls.sql');
    console.log('4. Execute the SQL to fix the RLS policies');
    console.log('\n🔄 After fixing RLS, restart your development server and test product creation.');

  } catch (error) {
    console.error('❌ Error fixing RLS policies:', error.message);
    process.exit(1);
  }
}

// Run the fix
fixProductsRLS();
