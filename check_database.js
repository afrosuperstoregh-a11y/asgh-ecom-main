const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const databaseUrl = process.env.DATABASE_URL;
const pool = new Pool({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false }
});

async function checkDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking database state...');
    
    // Check if users table exists and has admin user
    const { rows: users } = await client.query(
      'SELECT email, role, email_verified FROM users WHERE role = $1',
      ['super_admin']
    );
    
    console.log('👤 Super admin users found:', users.length);
    users.forEach(user => {
      console.log(`   Email: ${user.email}, Verified: ${user.email_verified}`);
    });
    
    // Check if admin_users table exists
    try {
      const { rows: adminUsers } = await client.query('SELECT COUNT(*) as count FROM admin_users');
      console.log('🛡️  admin_users table exists with', adminUsers[0].count, 'records');
    } catch (error) {
      console.log('❌ admin_users table missing:', error.message);
    }
    
    // Test password hash
    if (users.length > 0) {
      const bcrypt = require('bcryptjs');
      const testPassword = 'Admin123!';
      const isValid = await bcrypt.compare(testPassword, users[0].password_hash);
      console.log('🔐 Password verification:', isValid ? '✅ Valid' : '❌ Invalid');
    }
    
  } catch (error) {
    console.error('❌ Database check failed:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkDatabase();
