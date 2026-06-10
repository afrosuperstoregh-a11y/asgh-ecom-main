const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://azpgqsmgyorjbqsgxuxw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6cGdxc21neW9yamJxc2d4dXh3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTI5ODU2MCwiZXhwIjoyMDg0ODc0NTYwfQ.A-gUiUyjt9XWxwB2mCfWScOGDCbSGmm-zXt2G5Xseh0';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('🔧 Attempting to apply product_images table migration...\n');
  
  // Read the migration SQL
  const migrationSQL = fs.readFileSync(
    'supabase/migrations/011_create_product_images_table.sql',
    'utf8'
  );
  
  console.log('📋 Migration SQL loaded');
  console.log(`📝 SQL length: ${migrationSQL.length} characters\n`);
  
  // Try to apply via RPC (this likely won't work for DDL)
  try {
    console.log('🔄 Attempting to apply via Supabase client...');
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      console.log('❌ RPC method failed:', error.message);
      console.log('\n⚠️  DDL statements cannot be executed via Supabase client RPC.');
      console.log('📋 Please apply the migration manually via Supabase Dashboard.\n');
      printInstructions();
      return false;
    }
    
    console.log('✅ Migration applied successfully via RPC');
    return true;
    
  } catch (error) {
    console.log('❌ Exception:', error.message);
    console.log('\n⚠️  DDL statements cannot be executed via Supabase client.');
    console.log('📋 Please apply the migration manually via Supabase Dashboard.\n');
    printInstructions();
    return false;
  }
}

function printInstructions() {
  console.log('='.repeat(80));
  console.log('MANUAL MIGRATION INSTRUCTIONS');
  console.log('='.repeat(80));
  console.log('\n1. Go to Supabase Dashboard:');
  console.log('   https://supabase.com/dashboard/project/azpgqsmgyorjbqsgxuxw');
  console.log('\n2. Navigate to SQL Editor:');
  console.log('   Click on "SQL Editor" in the left sidebar');
  console.log('\n3. Create a new query:');
  console.log('   Click "New Query" button');
  console.log('\n4. Copy and paste the migration SQL:');
  console.log('   File location: supabase/migrations/011_create_product_images_table.sql');
  console.log('\n5. Execute the SQL:');
  console.log('   Click "Run" or press Ctrl+Enter');
  console.log('\n6. Verify the table was created:');
  console.log('   Run: SELECT * FROM product_images LIMIT 1;');
  console.log('\n' + '='.repeat(80));
  console.log('\nAfter applying the migration, run:');
  console.log('  node sync-storage-to-database.cjs --live');
  console.log('='.repeat(80));
}

async function verifyMigration() {
  console.log('\n🔍 Verifying if product_images table exists...\n');
  
  try {
    const { data, error } = await supabase
      .from('product_images')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Table does not exist:', error.message);
      return false;
    }
    
    console.log('✅ product_images table exists and is accessible');
    console.log(`📊 Current records: ${data.length}`);
    return true;
    
  } catch (error) {
    console.log('❌ Exception:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 PRODUCT_IMAGES TABLE MIGRATION\n');
  
  // First check if table already exists
  const tableExists = await verifyMigration();
  
  if (tableExists) {
    console.log('\n✅ Migration already applied. Skipping...');
    console.log('\n📋 You can proceed directly to synchronization:');
    console.log('   node sync-storage-to-database.cjs --live\n');
    return;
  }
  
  // Attempt to apply migration
  const applied = await applyMigration();
  
  if (!applied) {
    console.log('\n⏸️  Migration not applied. Please follow the manual instructions above.');
    console.log('🔄 After applying, run: node sync-storage-to-database.cjs --live\n');
  }
}

main();
