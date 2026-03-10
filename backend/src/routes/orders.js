const express = require('express');
const { verifySupabaseUser, requireAdmin } = require('../middleware/supabaseAuth');
const { Pool } = require('pg');
const router = express.Router();

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Update order payment status
async function updateOrderPayment(orderId, paymentData) {
  const query = `
    UPDATE orders 
    SET 
      payment_status = $1,
      payment_method = $2,
      payment_intent_id = $3,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $4 OR order_number = $4
    RETURNING *
  `;
  
  const values = [
    paymentData.paymentStatus,
    paymentData.paymentMethod,
    paymentData.paymentIntentId,
    orderId
  ];
  
  try {
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error('Database error updating order payment:', error);
    throw error;
  }
}

// Get all orders (admin only)
router.get('/', verifySupabaseUser, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get order by ID (admin only or own order)
router.get('/:id', verifySupabaseUser, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Build query based on user role
    let query, params;
    if (req.user.role === 'admin' || req.user.role === 'super_admin') {
      // Admin can see any order
      query = 'SELECT * FROM orders WHERE id = $1 OR order_number = $1';
      params = [id];
    } else {
      // Customers can only see their own orders
      query = 'SELECT * FROM orders WHERE (id = $1 OR order_number = $1) AND customer_id = $2';
      params = [id, req.user.id];
    }
    
    const result = await pool.query(query, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Create new order (authenticated users)
router.post('/', verifySupabaseUser, async (req, res) => {
  try {
    const {
      customer_id,
      email,
      subtotal,
      tax_amount = 0,
      shipping_amount = 0,
      discount_amount = 0,
      total_amount,
      shipping_address,
      billing_address,
      notes
    } = req.body;

    // Use authenticated user ID or provided customer_id (for admin)
    const final_customer_id = req.user.role === 'admin' || req.user.role === 'super_admin' 
      ? customer_id 
      : req.user.id;

    // Generate unique order number
    const order_number = 'ORD-' + Date.now() + '-' + Math.random().toString(36).substring(2).toUpperCase();

    const query = `
      INSERT INTO orders (
        order_number, customer_id, email, subtotal, tax_amount, 
        shipping_amount, discount_amount, total_amount, 
        shipping_address, billing_address, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const values = [
      order_number,
      final_customer_id,
      email,
      subtotal,
      tax_amount,
      shipping_amount,
      discount_amount,
      total_amount,
      JSON.stringify(shipping_address),
      JSON.stringify(billing_address),
      notes
    ];

    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Update order (admin only)
router.put('/:id', verifySupabaseUser, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Build dynamic update query
    const setClause = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');
    
    const query = `
      UPDATE orders 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 OR order_number = $1
      RETURNING *
    `;
    
    const values = [id, ...Object.values(updates)];
    
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// Update order payment status (used by webhooks - no auth required for Stripe/PayPal)
router.patch('/:id/payment', async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_status, payment_method, payment_intent_id } = req.body;
    
    const order = await updateOrderPayment(id, {
      paymentStatus: payment_status,
      paymentMethod: payment_method,
      paymentIntentId: payment_intent_id
    });
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json(order);
  } catch (error) {
    console.error('Error updating order payment:', error);
    res.status(500).json({ error: 'Failed to update order payment' });
  }
});

// Delete/cancel order (admin only)
router.delete('/:id', verifySupabaseUser, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Soft delete by updating status to cancelled
    const result = await pool.query(
      'UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 OR order_number = $2 RETURNING *',
      ['cancelled', id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ error: 'Failed to cancel order' });
  }
});

// Export the updateOrderPayment function for use in payment routes
module.exports = router;
module.exports.updateOrderPayment = updateOrderPayment;
