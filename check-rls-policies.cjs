const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lljxxaejmueoxsaqaowf.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxsanh4YWVqbXVlb3hzYXFhb3dmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODEwODIyMSwiZXhwIjoyMDkzNjg0MjIxfQ.qXvtkAhMYRSOHSQUFVdLGQypZ0_k-Z5Y2TlDDYJBzFQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkRLSPolicies() {
  try {
    console.log('🔍 Checking RLS policies...\n');
    
    // Check if is_admin_user function exists
    const { data: funcData, error: funcError } = await supabase
      .rpc('is_admin_user');
    
    if (funcError) {
      console.log('❌ is_admin_user function does not exist or has error:', funcError.message);
      console.log('⚠️  RLS fix has NOT been applied yet');
    } else {
      console.log('✅ is_admin_user function exists and is callable');
    }
    
    // Check admin_users RLS status
    const { data: rlsData, error: rlsError } = await supabase
      .rpc('check_admin_users_rls');
    
    if (rlsError) {
      console.log('\n⚠️  Could not check admin_users RLS status via RPC');
    } else {
      console.log('✅ Admin users RLS check completed');
    }
    
    // Test categories query
    console.log('\n🔍 Testing categories query...');
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .limit(10);
    
    if (catError) {
      console.log('❌ Categories query failed:', catError.message);
      if (catError.message.includes('infinite recursion')) {
        console.log('⚠️  RLS recursion error still present - fix needs to be applied');
      }
    } else {
      console.log(`✅ Categories query succeeded - found ${categories.length} categories`);
    }
    
    // Test products query
    console.log('\n🔍 Testing products query...');
    const { data: products, error: prodError } = await supabase
      .from('products')
      .select('*')
      .limit(10);
    
    if (prodError) {
      console.log('❌ Products query failed:', prodError.message);
      if (prodError.message.includes('infinite recursion')) {
        console.log('⚠️  RLS recursion error still present - fix needs to be applied');
      }
    } else {
      console.log(`✅ Products query succeeded - found ${products.length} products`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkRLSPolicies();
