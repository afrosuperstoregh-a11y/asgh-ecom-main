const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

async function createAdminUser() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 1,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
  });

  try {
    console.log('🔍 Connecting to database...');
    const client = await pool.connect();
    console.log('✅ Database connected successfully');

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@afrosuperstore.ca';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';
    
    // Use the correct hash for "Admin123!"
    const hashedPassword = '$2a$12$10V2w98v46Y62/LN4OEskercY1LWWk/JuujwQGMKgwJS1oW87AUmu';

    console.log('🔍 Checking if admin user already exists...');
    const existingUser = await client.query(
      'SELECT * FROM users WHERE email = $1',
      [adminEmail]
    );

    if (existingUser.rows.length > 0) {
      console.log('✅ Admin user already exists:', existingUser.rows[0].email);
      
      // Update password if needed
      await client.query(
        'UPDATE users SET password_hash = $1, role = $2, email_verified = true WHERE email = $3',
        [hashedPassword, 'super_admin', adminEmail]
      );
      console.log('🔄 Admin user password updated');
    } else {
      console.log('🔍 Creating new admin user...');
      
      const newUser = await client.query(
        `INSERT INTO users (id, email, password_hash, first_name, last_name, role, email_verified, created_at, updated_at) 
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW(), NOW()) 
         RETURNING id, email, role`,
        [adminEmail, hashedPassword, 'Super', 'Admin', 'super_admin', true]
      );

      console.log('✅ Admin user created successfully:', newUser.rows[0].email);
      console.log('🆔 Admin ID:', newUser.rows[0].id);
    }

    // Test the login
    console.log('🔍 Testing admin login...');
    const testUser = await client.query(
      'SELECT * FROM users WHERE email = $1',
      [adminEmail]
    );

    if (testUser.rows.length > 0) {
      const isValid = await bcrypt.compare(adminPassword, testUser.rows[0].password_hash);
      console.log(isValid ? '✅ Password verification successful' : '❌ Password verification failed');
      console.log('👤 User details:', {
        id: testUser.rows[0].id,
        email: testUser.rows[0].email,
        role: testUser.rows[0].role,
        email_verified: testUser.rows[0].email_verified
      });
    }

    client.release();

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await pool.end();
  }
}

// Load environment variables
require('dotenv').config();

createAdminUser();
