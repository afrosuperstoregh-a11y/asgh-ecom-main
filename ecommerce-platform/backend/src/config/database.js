const { Pool } = require('pg');
const { findUserByEmail: supabaseFindUser, createUser: supabaseCreateUser } = require('./supabase');

// PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test database connection
async function testConnection() {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('✅ PostgreSQL connected successfully');
    return true;
  } catch (error) {
    console.error('❌ PostgreSQL connection failed:', error);
    return false;
  }
}

// Find user by email - tries Supabase first, then PostgreSQL
async function findUserByEmail(email) {
  try {
    // Try Supabase first
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const supabaseUser = await supabaseFindUser(email);
      if (supabaseUser) {
        return supabaseUser;
      }
    }
    
    // Fallback to PostgreSQL
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    
    if (result.rows.length > 0) {
      console.log('✅ User found in PostgreSQL database:', email);
      return result.rows[0];
    }
    
    return null;
  } catch (error) {
    console.error('Error finding user by email:', error);
    throw error;
  }
}

// Create user - tries Supabase first, then PostgreSQL
async function createUser(userData) {
  try {
    const { email, password_hash, first_name, last_name, phone, role = 'customer', email_verified = false } = userData;
    
    // Try Supabase first
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supabaseUser = await supabaseCreateUser({
          email,
          password: userData.password || 'tempPassword123!', // Supabase needs actual password
          first_name,
          last_name,
          role
        });
        
        // Update with additional fields
        await pool.query(
          'UPDATE users SET phone = $1, password_hash = $2 WHERE id = $3',
          [phone, password_hash, supabaseUser.id]
        );
        
        return supabaseUser;
      } catch (supabaseError) {
        console.log('Supabase user creation failed, falling back to PostgreSQL:', supabaseError.message);
      }
    }
    
    // Fallback to PostgreSQL
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, phone, role, email_verified, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW()) 
       RETURNING *`,
      [email, password_hash, first_name, last_name, phone, role, email_verified]
    );
    
    console.log('✅ User created in PostgreSQL database:', email);
    return result.rows[0];
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

// Generic query function
async function query(text, params) {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: result.rowCount });
    return result;
  } catch (error) {
    console.error('Query error', { text, error });
    throw error;
  }
}

// Get user by ID
async function findUserById(id) {
  try {
    // Try Supabase first
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { data: user, error } = await require('./supabase').supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
      
      if (user && !error) {
        return user;
      }
    }
    
    // Fallback to PostgreSQL
    const result = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    console.error('Error finding user by ID:', error);
    throw error;
  }
}

// Update user
async function updateUser(id, updates) {
  try {
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    
    const result = await pool.query(
      `UPDATE users SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id, ...values]
    );
    
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
}

module.exports = {
  pool,
  testConnection,
  findUserByEmail,
  createUser,
  findUserById,
  updateUser,
  query
};
