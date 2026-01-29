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
    console.log('🔧 Creating admin users directly...');
    
    // Create primary admin
    const primaryPasswordHash = await bcrypt.hash('Admin123!', 10);
    console.log('🔐 Primary admin password hashed');
    
    // Check if primary user exists
    const { rows: existingPrimaryUsers } = await client.query(
      'SELECT id, email FROM users WHERE email = $1',
      ['admin@afrosuperstore.ca']
    );
    
    if (existingPrimaryUsers.length > 0) {
      console.log('👤 Primary admin exists, updating password...');
      await client.query(
        'UPDATE users SET password_hash = $1, role = $2, email_verified = $3 WHERE email = $4',
        [primaryPasswordHash, 'super_admin', true, 'admin@afrosuperstore.ca']
      );
      console.log('✅ Primary admin user updated');
    } else {
      console.log('👤 Creating new primary admin user...');
      const { rows: newPrimaryUser } = await client.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, role, email_verified) 
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email`,
        ['admin@afrosuperstore.ca', primaryPasswordHash, 'Super', 'Admin', 'super_admin', true]
      );
      console.log('✅ Primary admin user created:', newPrimaryUser[0]);
    }

    // Create secondary admin
    const secondaryPasswordHash = await bcrypt.hash('Iamtech@100', 10);
    console.log('🔐 Secondary admin password hashed');
    
    // Check if secondary user exists
    const { rows: existingSecondaryUsers } = await client.query(
      'SELECT id, email FROM users WHERE email = $1',
      ['info@afrosuperstore.ca']
    );
    
    if (existingSecondaryUsers.length > 0) {
      console.log('👤 Secondary admin exists, updating password...');
      await client.query(
        'UPDATE users SET password_hash = $1, role = $2, email_verified = $3 WHERE email = $4',
        [secondaryPasswordHash, 'super_admin', true, 'info@afrosuperstore.ca']
      );
      console.log('✅ Secondary admin user updated');
    } else {
      console.log('👤 Creating new secondary admin user...');
      const { rows: newSecondaryUser } = await client.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, role, email_verified) 
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email`,
        ['info@afrosuperstore.ca', secondaryPasswordHash, 'Tech', 'Admin', 'super_admin', true]
      );
      console.log('✅ Secondary admin user created:', newSecondaryUser[0]);
    }
    
    // Verify the users were created
    const { rows: verifyUsers } = await client.query(
      'SELECT email, role, email_verified FROM users WHERE role = $1',
      ['super_admin']
    );
    
    console.log('🔍 Verification:');
    verifyUsers.forEach(user => {
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Verified: ${user.email_verified}`);
    });
    
    console.log('\n🎉 Admin setup complete! Try logging in with:');
    console.log('   Primary Admin:');
    console.log('   Email: admin@afrosuperstore.ca');
    console.log('   Password: Admin123!');
    console.log('   Secondary Admin:');
    console.log('   Email: info@afrosuperstore.ca');
    console.log('   Password: Iamtech@100');
    
  } catch (error) {
    console.error('❌ Error creating admin:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

createAdminDirectly();
