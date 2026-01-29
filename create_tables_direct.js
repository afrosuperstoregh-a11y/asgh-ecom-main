const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

// Use the DATABASE_URL from .env.local
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ DATABASE_URL not found in environment');
  process.exit(1);
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false }
});

async function createMissingTablesDirect() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Creating missing tables directly...');
    
    // Create admin_users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        permissions JSONB DEFAULT '{}',
        last_login TIMESTAMP WITH TIME ZONE,
        login_count INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id)
      )
    `);
    console.log('✅ admin_users table created');
    
    // Create payments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        amount DECIMAL(10,2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'USD',
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'cancelled', 'refunded')),
        payment_method TEXT NOT NULL CHECK (payment_method IN ('stripe', 'paypal', 'cash_on_delivery')),
        payment_intent_id VARCHAR(255),
        gateway_response JSONB,
        failure_reason TEXT,
        processed_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    console.log('✅ payments table created');
    
    // Create inventory_logs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS inventory_logs (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
        type TEXT NOT NULL CHECK (type IN ('sale', 'restock', 'adjustment', 'return')),
        quantity_change INTEGER NOT NULL,
        previous_quantity INTEGER NOT NULL,
        new_quantity INTEGER NOT NULL,
        reason TEXT,
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    console.log('✅ inventory_logs table created');
    
    // Create indexes for new tables
    await client.query('CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON admin_users(user_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_inventory_logs_product ON inventory_logs(product_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_inventory_logs_order ON inventory_logs(order_id)');
    console.log('✅ Indexes created');
    
    // Update the admin user to have admin_users record
    const adminResult = await client.query(
      'SELECT id FROM users WHERE email = $1 AND role = $2',
      ['admin@afrosuperstore.ca', 'super_admin']
    );
    
    if (adminResult.rows.length > 0) {
      const adminUserId = adminResult.rows[0].id;
      
      await client.query(`
        INSERT INTO admin_users (user_id, permissions, login_count)
        VALUES ($1, $2, 0)
        ON CONFLICT (user_id) DO NOTHING
      `, [
        adminUserId,
        JSON.stringify({
          canManageProducts: true,
          canManageOrders: true,
          canManageUsers: true,
          canManageSettings: true,
          canViewAnalytics: true
        })
      ]);
      console.log('✅ Admin user record created in admin_users table');
    }
    
    console.log('\n🎉 All missing tables created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

createMissingTablesDirect();
