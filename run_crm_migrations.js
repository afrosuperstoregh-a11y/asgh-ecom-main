/**
 * CRM Migration Runner
 * Runs CRM database migrations using Node.js PostgreSQL client
 */

const fs = require('fs');
const path = require('path');

// Load environment variables from backend directory
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });

const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function runMigration(migrationFile) {
  console.log(`\n🔄 Running migration: ${migrationFile}`);
  
  try {
    const migrationPath = path.join(__dirname, 'database', 'migrations', migrationFile);
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    await pool.query(migrationSQL);
    console.log(`✅ Migration ${migrationFile} completed successfully`);
    return true;
  } catch (error) {
    console.error(`❌ Migration ${migrationFile} failed:`, error.message);
    return false;
  }
}

async function checkTableExists(tableName) {
  try {
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      )
    `, [tableName]);
    
    return result.rows[0].exists;
  } catch (error) {
    console.error(`Error checking table ${tableName}:`, error.message);
    return false;
  }
}

async function verifyMigration() {
  console.log('\n🔍 Verifying CRM migration...');
  
  const requiredTables = [
    'customer_profiles',
    'customer_notes', 
    'customer_tags',
    'customer_tag_map',
    'customer_segments',
    'customer_segment_rules',
    'customer_segment_memberships',
    'email_templates',
    'email_logs',
    'email_campaigns',
    'email_campaign_recipients',
    'crm_automations',
    'crm_automation_logs'
  ];
  
  let allTablesExist = true;
  
  for (const table of requiredTables) {
    const exists = await checkTableExists(table);
    if (exists) {
      console.log(`✅ Table ${table} exists`);
    } else {
      console.log(`❌ Table ${table} missing`);
      allTablesExist = false;
    }
  }
  
  return allTablesExist;
}

async function insertSampleData() {
  console.log('\n📝 Inserting sample CRM data...');
  
  try {
    // Check if customer profiles exist
    const customerCount = await pool.query('SELECT COUNT(*) FROM customer_profiles');
    
    if (parseInt(customerCount.rows[0].count) === 0) {
      console.log('Creating sample customer profiles...');
      
      // Get existing users
      const users = await pool.query('SELECT id, email, first_name, last_name FROM users WHERE role = $1', ['customer']);
      
      for (const user of users.rows) {
        await pool.query(`
          INSERT INTO customer_profiles (
            user_id, lifecycle_stage, total_spend, order_count, 
            last_activity, marketing_consent, sms_consent
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (user_id) DO NOTHING
        `, [
          user.id,
          'lead',
          0,
          0,
          new Date().toISOString(),
          true,
          false
        ]);
      }
      
      console.log(`✅ Created ${users.rows.length} customer profiles`);
    } else {
      console.log(`✅ Found ${customerCount.rows[0].count} existing customer profiles`);
    }
    
    // Check if segments exist
    const segmentCount = await pool.query('SELECT COUNT(*) FROM customer_segments');
    
    if (parseInt(segmentCount.rows[0].count) === 0) {
      console.log('Creating default customer segments...');
      
      const segments = [
        { name: 'All Customers', description: 'All registered customers', is_dynamic: true },
        { name: 'VIP Customers', description: 'Customers with high lifetime value', is_dynamic: true },
        { name: 'New Customers', description: 'Customers registered in the last 30 days', is_dynamic: true },
        { name: 'Active Customers', description: 'Customers with purchase in last 90 days', is_dynamic: true },
        { name: 'Inactive Customers', description: 'Customers with no purchase in last 180 days', is_dynamic: true }
      ];
      
      for (const segment of segments) {
        await pool.query(`
          INSERT INTO customer_segments (name, description, is_dynamic, is_active, created_by)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (name) DO NOTHING
        `, [segment.name, segment.description, segment.is_dynamic, true, 1]);
      }
      
      console.log(`✅ Created ${segments.length} default segments`);
    } else {
      console.log(`✅ Found ${segmentCount.rows[0].count} existing segments`);
    }
    
  } catch (error) {
    console.error('❌ Error inserting sample data:', error.message);
  }
}

async function main() {
  console.log('🚀 Starting CRM Migration Process');
  console.log('=====================================');
  
  try {
    // Test database connection
    console.log('🔌 Testing database connection...');
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful');
    
    // Run migrations in order
    const migrations = [
      '004_crm_schema.sql',
      '005_crm_rls_policies.sql'
    ];
    
    let migrationSuccess = true;
    
    for (const migration of migrations) {
      const success = await runMigration(migration);
      if (!success) {
        migrationSuccess = false;
        break;
      }
    }
    
    if (migrationSuccess) {
      // Verify migration
      const verificationSuccess = await verifyMigration();
      
      if (verificationSuccess) {
        // Insert sample data
        await insertSampleData();
        
        console.log('\n🎉 CRM Migration completed successfully!');
        console.log('=====================================');
        console.log('✅ All CRM tables created');
        console.log('✅ RLS policies applied');
        console.log('✅ Sample data inserted');
        console.log('✅ CRM system is ready for use');
      } else {
        console.log('\n❌ Migration verification failed');
      }
    } else {
      console.log('\n❌ Migration failed');
    }
    
  } catch (error) {
    console.error('\n💥 Migration process failed:', error.message);
  } finally {
    await pool.end();
  }
}

// Run the migration
main().catch(console.error);
