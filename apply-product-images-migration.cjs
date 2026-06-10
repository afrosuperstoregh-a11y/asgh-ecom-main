const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://azpgqsmgyorjbqsgxuxw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6cGdxc21neW9yamJxc2d4dXh3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTI5ODU2MCwiZXhwIjoyMDg0ODc0NTYwfQ.A-gUiUyjt9XWxwB2mCfWScOGDCbSGmm-zXt2G5Xseh0';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('🔧 Applying product_images table migration...\n');
  
  // Read the migration SQL file
  const migrationSQL = fs.readFileSync(
    'supabase/migrations/011_create_product_images_table.sql',
    'utf8'
  );
  
  // Execute the migration using SQL RPC
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: migrationSQL
  });
  
  if (error) {
    console.log('❌ Error applying migration:', error.message);
    console.log('\n⚠️  Trying direct SQL execution via postgres connection...');
    
    // Alternative: Try using the database directly
    try {
      const { Client } = require('pg');
      const client = new Client({
        connectionString: 'postgresql://postgres.azpgqsmgyorjbqsgxuxw:[YOUR-PASSWORD]@db.azpgqsmgyorjbqsgxuxw.supabase.co:5432/postgres'
      });
      
      console.log('❌ Direct PostgreSQL connection not configured');
      console.log('Please apply the migration manually via Supabase Dashboard SQL Editor');
      console.log('File: supabase/migrations/011_create_product_images_table.sql');
      
    } catch (e) {
      console.log('❌ Exception:', e.message);
    }
    
    return false;
  }
  
  console.log('✅ Migration applied successfully');
  return true;
}

async function verifyTable() {
  console.log('\n🔍 Verifying product_images table...');
  
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
    return true;
    
  } catch (e) {
    console.log('❌ Exception:', e.message);
    return false;
  }
}

async function main() {
  const tableExists = await verifyTable();
  
  if (!tableExists) {
    console.log('\n⚠️  product_images table does not exist');
    console.log('Please apply the migration manually:');
    console.log('1. Go to Supabase Dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Open and run: supabase/migrations/011_create_product_images_table.sql');
  } else {
    console.log('\n✅ product_images table already exists');
  }
}

main();
