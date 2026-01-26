const { createClient } = require('@supabase/supabase-js');

async function createMissingTables() {
  console.log('🔧 Creating Missing Database Tables...');
  console.log('=====================================');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceKey) {
    console.error('❌ Supabase service role credentials required for migrations');
    return false;
  }
  
  const supabase = createClient(supabaseUrl, serviceKey);
  
  // PostgreSQL table creation statements
  const migrations = [
    {
      name: 'cart_items',
      sql: `
        CREATE TABLE IF NOT EXISTS cart_items (
          id SERIAL PRIMARY KEY,
          customer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          session_id VARCHAR(255),
          product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
          quantity INTEGER NOT NULL DEFAULT 1,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_cart_items_customer ON cart_items(customer_id);
        CREATE INDEX IF NOT EXISTS idx_cart_items_session ON cart_items(session_id);
        CREATE UNIQUE INDEX IF NOT EXISTS unique_cart_item ON cart_items(customer_id, product_id) WHERE customer_id IS NOT NULL;
        CREATE UNIQUE INDEX IF NOT EXISTS unique_session_item ON cart_items(session_id, product_id) WHERE customer_id IS NULL;
      `
    },
    {
      name: 'payments',
      sql: `
        CREATE TABLE IF NOT EXISTS payments (
          id SERIAL PRIMARY KEY,
          order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
          payment_method VARCHAR(50) NOT NULL,
          payment_intent_id VARCHAR(255),
          amount DECIMAL(10,2) NOT NULL,
          currency VARCHAR(3) DEFAULT 'USD',
          status VARCHAR(20) DEFAULT 'pending',
          gateway_response JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
        CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
        CREATE INDEX IF NOT EXISTS idx_payments_intent ON payments(payment_intent_id);
      `
    },
    {
      name: 'addresses',
      sql: `
        CREATE TABLE IF NOT EXISTS addresses (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          type VARCHAR(20) NOT NULL CHECK (type IN ('billing', 'shipping')),
          first_name VARCHAR(100) NOT NULL,
          last_name VARCHAR(100) NOT NULL,
          company VARCHAR(100),
          address_line1 VARCHAR(255) NOT NULL,
          address_line2 VARCHAR(255),
          city VARCHAR(100) NOT NULL,
          province VARCHAR(100) NOT NULL,
          postal_code VARCHAR(20) NOT NULL,
          country VARCHAR(100) DEFAULT 'Canada',
          phone VARCHAR(20),
          is_default BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_addresses_user ON addresses(user_id);
        CREATE INDEX IF NOT EXISTS idx_addresses_type ON addresses(type);
        CREATE INDEX IF NOT EXISTS idx_addresses_default ON addresses(is_default);
      `
    },
    {
      name: 'wishlist_items',
      sql: `
        CREATE TABLE IF NOT EXISTS wishlist_items (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id, product_id)
        );
        
        CREATE INDEX IF NOT EXISTS idx_wishlist_items_user ON wishlist_items(user_id);
        CREATE INDEX IF NOT EXISTS idx_wishlist_items_product ON wishlist_items(product_id);
      `
    }
  ];
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const migration of migrations) {
    console.log(`\n📝 Creating table: ${migration.name}`);
    
    try {
      const { data, error } = await supabase.rpc('exec_sql', { sql_query: migration.sql });
      
      if (error) {
        // Fallback: Try direct SQL execution via REST API
        console.log('⚠️  RPC failed, trying REST API...');
        
        const response = await fetch(`${supabaseUrl}/rest/v1/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': serviceKey,
            'Authorization': `Bearer ${serviceKey}`,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            query: migration.sql
          })
        });
        
        if (response.ok) {
          console.log(`✅ Table ${migration.name} created successfully`);
          successCount++;
        } else {
          console.log(`❌ Failed to create table ${migration.name}: ${response.statusText}`);
          errorCount++;
        }
      } else {
        console.log(`✅ Table ${migration.name} created successfully`);
        successCount++;
      }
    } catch (error) {
      console.error(`❌ Error creating table ${migration.name}:`, error.message);
      errorCount++;
    }
  }
  
  console.log('\n📊 Migration Summary:');
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${errorCount}`);
  console.log(`📈 Total: ${successCount + errorCount}`);
  
  return successCount === migrations.length;
}

// Load environment variables
require('dotenv').config({ path: '../../.env.local' });

// Run the migrations
createMissingTables().then(success => {
  console.log(`\n${success ? '✅ SUCCESS' : '⚠️  PARTIAL'}: Migrations completed`);
  process.exit(success ? 0 : 1);
});
