const { Pool } = require('pg');

// Database connection configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || 'postgresql://postgres:postgres123@localhost:5432/ecommerce',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test database connection
async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('✅ Database connected successfully');
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

// Find user by email
async function findUserByEmail(email) {
  try {
    const query = `
      SELECT id, email, password_hash, first_name, last_name, phone, role, email_verified 
      FROM users 
      WHERE email = $1
    `;
    const result = await pool.query(query, [email]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error finding user by email:', error);
    throw error;
  }
}

// Create user
async function createUser(userData) {
  try {
    const { email, password_hash, first_name, last_name, phone, role, email_verified } = userData;
    const query = `
      INSERT INTO users (email, password_hash, first_name, last_name, phone, role, email_verified)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, email, first_name, last_name, phone, role, email_verified
    `;
    const result = await pool.query(query, [email, password_hash, first_name, last_name, phone, role, email_verified]);
    return result.rows[0];
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

module.exports = {
  pool,
  testConnection,
  findUserByEmail,
  createUser
};
