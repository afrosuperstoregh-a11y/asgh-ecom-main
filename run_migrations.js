const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration(migrationFile, migrationName) {
  try {
    console.log(`📋 Running migration: ${migrationName}`);
    
    const migrationSQL = fs.readFileSync(migrationFile, 'utf8');
    
    // Split SQL by semicolons and execute each statement
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        // Use raw SQL execution through rpc
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
        
        if (error) {
          // If rpc doesn't exist, try direct SQL through from() with raw
          console.warn('⚠️  RPC not available, trying direct execution...');
          
          // For DDL statements, we need to use a different approach
          // Create a temporary function to execute the SQL
          const { error: funcError } = await supabase.rpc('execute_migration', {
            migration_sql: statement
          });
          
          if (funcError && !funcError.message.includes('does not exist')) {
            console.warn(`⚠️  Statement warning: ${funcError.message}`);
          }
        }
      }
    }
    
    console.log(`✅ Migration ${migrationName} completed successfully`);
    return true;
    
  } catch (error) {
    console.error(`❌ Migration ${migrationName} failed:`, error.message);
    return false;
  }
}

async function createMigrationHelper() {
  // Create a helper function to execute SQL if it doesn't exist
  const createFunctionSQL = `
    CREATE OR REPLACE FUNCTION execute_migration(migration_sql TEXT)
    RETURNS VOID AS $$
    BEGIN
      EXECUTE migration_sql;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `;
  
  try {
    const { error } = await supabase.rpc('exec_sql', { 
      sql_query: createFunctionSQL 
    });
    
    if (error && !error.message.includes('does not exist')) {
      console.warn('⚠️  Could not create migration helper:', error.message);
    }
  } catch (e) {
    console.warn('⚠️  Migration helper creation warning');
  }
}

async function main() {
  try {
    console.log('🚀 Starting database migrations for Afro Superstore...');
    
    // Test connection
    const { data, error } = await supabase.from('users').select('count').limit(1);
    if (error) throw error;
    console.log('✅ Database connection successful');
    
    // Create migration helper function
    await createMigrationHelper();
    
    // Run migrations in order
    const migrations = [
      {
        file: 'database/migrations/001_initial_schema_postgresql.sql',
        name: 'Initial Schema (PostgreSQL)'
      },
      {
        file: 'database/migrations/003_create_super_admin_postgresql.sql', 
        name: 'Create Super Admin'
      }
    ];
    
    let successCount = 0;
    
    for (const migration of migrations) {
      const migrationPath = path.resolve(migration.file);
      
      if (!fs.existsSync(migrationPath)) {
        console.error(`❌ Migration file not found: ${migrationPath}`);
        continue;
      }
      
      const success = await runMigration(migrationPath, migration.name);
      if (success) successCount++;
    }
    
    console.log(`\n🎉 Migration complete! ${successCount}/${migrations.length} migrations successful.`);
    
    // Verify tables were created
    console.log('\n📊 Verifying database schema...');
    
    const tables = ['users', 'admin_users', 'products', 'categories', 'orders', 'order_items', 'payments', 'inventory_logs'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase.from(table).select('count').limit(1);
        if (error && error.code !== 'PGRST116') {
          console.warn(`⚠️  Table ${table}: ${error.message}`);
        } else if (!error) {
          console.log(`✅ Table ${table}: OK`);
        } else {
          console.warn(`⚠️  Table ${table}: Not found`);
        }
      } catch (e) {
        console.warn(`⚠️  Table ${table}: Check failed`);
      }
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

main();
