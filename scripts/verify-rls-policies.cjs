/**
 * Verification script to check current RLS policies in the database
 * This script identifies recursive policies and other issues
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyRLSPolicies() {
  console.log('=== RLS Policy Verification ===\n');

  try {
    // Check all RLS policies
    const { data: policies, error: policiesError } = await supabase
      .rpc('get_all_policies');

    if (policiesError) {
      // If the function doesn't exist, use direct SQL query
      console.log('Using direct SQL query to check policies...\n');
      
      const { data: sqlResult, error: sqlError } = await supabase
        .rpc('exec_sql', {
          sql: `
            SELECT 
              schemaname,
              tablename,
              policyname,
              permissive,
              roles,
              cmd,
              qual,
              with_check
            FROM pg_policies
            ORDER BY tablename, policyname
          `
        });

      if (sqlError) {
        console.error('Error querying policies:', sqlError);
        return;
      }

      console.log('Current RLS Policies:');
      console.log(JSON.stringify(sqlResult, null, 2));
    } else {
      console.log('Current RLS Policies:');
      console.log(JSON.stringify(policies, null, 2));
    }

    // Check for recursive policies
    console.log('\n=== Checking for Recursive Policies ===\n');
    
    const { data: recursiveCheck, error: recursiveError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT 
            schemaname,
            tablename,
            policyname,
            qual,
            with_check,
            CASE 
              WHEN qual LIKE '%' || tablename || '%' THEN 'RECURSIVE in qual'
              WHEN with_check LIKE '%' || tablename || '%' THEN 'RECURSIVE in with_check'
              ELSE 'OK'
            END as recursion_status
          FROM pg_policies
          WHERE 
            qual LIKE '%' || tablename || '%'
            OR with_check LIKE '%' || tablename || '%'
          ORDER BY tablename, policyname
        `
      });

    if (recursiveError) {
      console.error('Error checking for recursive policies:', recursiveError);
    } else if (recursiveCheck && recursiveCheck.length > 0) {
      console.log('⚠️  FOUND RECURSIVE POLICIES:');
      console.log(JSON.stringify(recursiveCheck, null, 2));
    } else {
      console.log('✅ No recursive policies found');
    }

    // Check if is_admin_user function exists
    console.log('\n=== Checking is_admin_user Function ===\n');
    
    const { data: functionCheck, error: functionError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT 
            routine_name,
            routine_type,
            security_type
          FROM information_schema.routines
          WHERE routine_name = 'is_admin_user'
          AND routine_schema = 'public'
        `
      });

    if (functionError) {
      console.error('Error checking function:', functionError);
    } else if (functionCheck && functionCheck.length > 0) {
      console.log('✅ is_admin_user function exists:', functionCheck[0]);
    } else {
      console.log('⚠️  is_admin_user function does not exist - needs to be created');
    }

    // Test queries that were failing
    console.log('\n=== Testing Categories Query ===\n');
    
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .limit(10);

    if (categoriesError) {
      console.error('❌ Categories query failed:', categoriesError);
    } else {
      console.log('✅ Categories query succeeded');
      console.log(`   Found ${categories.length} categories`);
    }

    console.log('\n=== Testing Products Query ===\n');
    
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*,categories(id,name,slug)')
      .limit(10);

    if (productsError) {
      console.error('❌ Products query failed:', productsError);
    } else {
      console.log('✅ Products query succeeded');
      console.log(`   Found ${products.length} products`);
    }

    console.log('\n=== Testing admin_users Query ===\n');
    
    const { data: adminUsers, error: adminUsersError } = await supabase
      .from('admin_users')
      .select('*')
      .limit(10);

    if (adminUsersError) {
      console.error('❌ admin_users query failed:', adminUsersError);
      console.error('   This confirms the infinite recursion issue');
    } else {
      console.log('✅ admin_users query succeeded');
      console.log(`   Found ${adminUsers.length} admin users`);
    }

    // Check foreign key relationships
    console.log('\n=== Checking Foreign Key Relationships ===\n');
    
    const { data: foreignKeys, error: fkError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT
            conname as constraint_name,
            conrelid::regclass as table_name,
            confrelid::regclass as references_table,
            pg_get_constraintdef(c.oid) as constraint_definition
          FROM pg_constraint c
          JOIN pg_namespace n ON n.oid = c.connamespace
          WHERE contype = 'f'
          AND conrelid::regclass IN ('public.products', 'public.categories', 'public.admin_users')
          ORDER BY conrelid::regclass
        `
      });

    if (fkError) {
      console.error('Error checking foreign keys:', fkError);
    } else {
      console.log('Foreign Key Relationships:');
      console.log(JSON.stringify(foreignKeys, null, 2));
    }

    // Check storage buckets
    console.log('\n=== Checking Storage Buckets ===\n');
    
    const { data: buckets, error: bucketsError } = await supabase
      .storage.listBuckets();

    if (bucketsError) {
      console.error('Error listing storage buckets:', bucketsError);
    } else {
      console.log('Storage Buckets:');
      buckets.forEach(bucket => {
        console.log(`   - ${bucket.name} (public: ${bucket.public})`);
      });
    }

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

verifyRLSPolicies().catch(console.error);
