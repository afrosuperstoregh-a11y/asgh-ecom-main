const { Pool } = require('pg');

// Database connection configuration
// Note: This is optional - the application primarily uses Supabase client
// Direct PostgreSQL connection is only needed for specific operations
const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

let pool = null;
if (connectionString) {
  pool = new Pool({
    connectionString,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    family: 4, // Force IPv4 to prevent IPv6 connection issues
    connectionTimeoutMillis: 10000, // 10 second timeout
    idleTimeoutMillis: 30000, // 30 second idle timeout
  });
}

// Test database connection
async function testConnection() {
  if (!pool) {
    console.log('⚠️  Direct PostgreSQL connection not configured (using Supabase client instead)');
    return true; // Not an error since we use Supabase client primarily
  }
  try {
    const client = await pool.connect();
    console.log('✅ Database connected successfully');
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    if (error.code === 'ENETUNREACH') {
      console.error('   Network unreachable - check DATABASE_URL/SUPABASE_DB_URL format');
      console.error('   Ensure IPv4 is being used (family: 4)');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('   Connection refused - check host and port in connection string');
    }
    return false;
  }
}

// Find user by email
async function findUserByEmail(email) {
  if (!pool) {
    throw new Error('Direct PostgreSQL connection not available. Use Supabase client instead.');
  }
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
  if (!pool) {
    throw new Error('Direct PostgreSQL connection not available. Use Supabase client instead.');
  }
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
