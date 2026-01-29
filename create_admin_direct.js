const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: 'backend/.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  family: 4
});

async function createAdminDirectly() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Creating admin user directly...');
    
    // Hash the password
    const passwordHash = await bcrypt.hash('Admin123!', 10);
    console.log('🔐 Password hashed');
    
    // Check if user exists
    const { rows: existingUsers } = await client.query(
      'SELECT id, email FROM users WHERE email = $1',
      ['admin@afrosuperstore.ca']
    );
    
    if (existingUsers.length > 0) {
      console.log('👤 User exists, updating password...');
      await client.query(
        'UPDATE users SET password_hash = $1, role = $2, email_verified = $3 WHERE email = $4',
        [passwordHash, 'super_admin', true, 'admin@afrosuperstore.ca']
      );
      console.log('✅ Admin user updated');
    } else {
      console.log('👤 Creating new admin user...');
      const { rows: newUser } = await client.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, role, email_verified) 
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email`,
        ['admin@afrosuperstore.ca', passwordHash, 'Super', 'Admin', 'super_admin', true]
      );
      console.log('✅ Admin user created:', newUser[0]);
    }
    
    // Verify the user was created
    const { rows: verifyUsers } = await client.query(
      'SELECT email, role, email_verified FROM users WHERE email = $1',
      ['admin@afrosuperstore.ca']
    );
    
    console.log('🔍 Verification:');
    verifyUsers.forEach(user => {
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Verified: ${user.email_verified}`);
    });
    
    console.log('\n🎉 Admin setup complete! Try logging in with:');
    console.log('   Email: admin@afrosuperstore.ca');
    console.log('   Password: Admin123!');
    
  } catch (error) {
    console.error('❌ Error creating admin:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

createAdminDirectly();
