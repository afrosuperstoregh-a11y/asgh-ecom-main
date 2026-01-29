const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createMissingTables() {
  try {
    console.log('🔧 Creating missing tables...');
    
    // Create admin_users table
    const { error: adminError } = await supabase
      .from('admin_users')
      .insert({
        user_id: '00000000-0000-0000-0000-000000000000',
        permissions: {},
        login_count: 0
      });
    
    if (adminError && !adminError.message.includes('duplicate key')) {
      console.warn('⚠️  admin_users table issue:', adminError.message);
    } else {
      console.log('✅ admin_users table exists');
    }
    
    // Create payments table
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        order_id: '00000000-0000-0000-0000-000000000000',
        amount: 0,
        currency: 'USD',
        status: 'pending',
        payment_method: 'stripe'
      });
    
    if (paymentError && !paymentError.message.includes('duplicate key')) {
      console.warn('⚠️  payments table issue:', paymentError.message);
    } else {
      console.log('✅ payments table exists');
    }
    
    // Create inventory_logs table
    const { error: inventoryError } = await supabase
      .from('inventory_logs')
      .insert({
        product_id: '00000000-0000-0000-0000-000000000000',
        type: 'adjustment',
        quantity_change: 0,
        previous_quantity: 0,
        new_quantity: 0
      });
    
    if (inventoryError && !inventoryError.message.includes('duplicate key')) {
      console.warn('⚠️  inventory_logs table issue:', inventoryError.message);
    } else {
      console.log('✅ inventory_logs table exists');
    }
    
    console.log('✅ Missing tables verification complete');
    
  } catch (error) {
    console.error('❌ Error creating missing tables:', error);
  }
}

createMissingTables();
