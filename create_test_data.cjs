const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://azpgqsmgyorjbqsgxuxw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6cGdxc21neW9yamJxc2d4dXh3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTI5ODU2MCwiZXhwIjoyMDg0ODc0NTYwfQ.A-gUiUyjt9XWxwB2mCfWScOGDCbSGmm-zXt2G5Xseh0'
);

async function createTestData() {
  try {
    console.log('Creating test data...');
    
    // Create a test order with guest email only (no user_id)
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: 'ORD-2024-001',
        guest_email: 'testcustomer@example.com',
        status: 'pending',
        currency: 'USD',
        subtotal: 99.99,
        tax_amount: 8.00,
        shipping_amount: 10.00,
        total: 117.99,
        payment_status: 'pending',
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      })
      .select();

    if (orderError) {
      console.error('Order error:', orderError);
      return;
    }
    
    console.log('Order created:', order);

    // Create another order with different status
    const { data: order2, error: order2Error } = await supabase
      .from('orders')
      .insert({
        order_number: 'ORD-2024-002',
        guest_email: 'testcustomer2@example.com',
        status: 'confirmed',
        currency: 'USD',
        subtotal: 149.99,
        tax_amount: 12.00,
        shipping_amount: 10.00,
        total: 171.99,
        payment_status: 'paid',
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      })
      .select();

    if (order2Error) {
      console.error('Order2 error:', order2Error);
      return;
    }
    
    console.log('Order2 created:', order2);

    console.log('Test data created successfully!');
  } catch (error) {
    console.error('Error:', error);
  }
}

createTestData();
