const express = require('express');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { Pool } = require('pg');
const router = express.Router();

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Get dashboard overview statistics
router.get('/dashboard', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { period = '30' } = req.query; // Default to last 30 days
    
    // Get date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - parseInt(period));
    
    // Overall stats
    const overallStats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE created_at >= $1) as new_customers,
        (SELECT COUNT(*) FROM orders WHERE created_at >= $1) as total_orders,
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE created_at >= $1 AND payment_status = 'paid') as revenue,
        (SELECT COUNT(*) FROM products WHERE status = 'active') as active_products,
        (SELECT COUNT(*) FROM categories WHERE is_active = true) as active_categories
    `, [startDate]);
    
    // Order status breakdown
    const orderStatus = await pool.query(`
      SELECT 
        status,
        COUNT(*) as count,
        COALESCE(SUM(total_amount), 0) as total_amount
      FROM orders 
      WHERE created_at >= $1
      GROUP BY status
      ORDER BY count DESC
    `, [startDate]);
    
    // Top products
    const topProducts = await pool.query(`
      SELECT 
        p.id,
        p.name,
        p.sku,
        SUM(oi.quantity) as total_sold,
        COALESCE(SUM(oi.total_price), 0) as revenue
      FROM products p
      JOIN order_items oi ON p.id = oi.product_id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.created_at >= $1 AND o.payment_status = 'paid'
      GROUP BY p.id, p.name, p.sku
      ORDER BY total_sold DESC
      LIMIT 10
    `, [startDate]);
    
    // Daily revenue trend
    const revenueTrend = await pool.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as orders,
        COALESCE(SUM(total_amount), 0) as revenue
      FROM orders 
      WHERE created_at >= $1 AND payment_status = 'paid'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 30
    `, [startDate]);
    
    res.json({
      success: true,
      data: {
        period: `${period} days`,
        overview: overallStats.rows[0],
        order_status: orderStatus.rows,
        top_products: topProducts.rows,
        revenue_trend: revenueTrend.rows
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard analytics'
    });
  }
});

// Get sales analytics
router.get('/sales', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { start_date, end_date, group_by = 'day' } = req.query;
    
    let dateFilter = '';
    let groupByClause = '';
    const params = [];
    
    if (start_date && end_date) {
      dateFilter = 'WHERE created_at BETWEEN $1 AND $2';
      params.push(start_date, end_date);
    } else {
      // Default to last 30 days
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      dateFilter = 'WHERE created_at >= $1';
      params.push(startDate);
    }
    
    // Determine grouping
    switch (group_by) {
      case 'hour':
        groupByClause = 'DATE_TRUNC(\'hour\', created_at)';
        break;
      case 'day':
        groupByClause = 'DATE(created_at)';
        break;
      case 'week':
        groupByClause = 'DATE_TRUNC(\'week\', created_at)';
        break;
      case 'month':
        groupByClause = 'DATE_TRUNC(\'month\', created_at)';
        break;
      default:
        groupByClause = 'DATE(created_at)';
    }
    
    const query = `
      SELECT 
        ${groupByClause} as period,
        COUNT(*) as orders,
        COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as paid_orders,
        COALESCE(SUM(total_amount), 0) as gross_revenue,
        COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END), 0) as net_revenue,
        COALESCE(AVG(total_amount), 0) as avg_order_value,
        COUNT(DISTINCT customer_id) as unique_customers
      FROM orders 
      ${dateFilter}
      GROUP BY ${groupByClause}
      ORDER BY period DESC
      LIMIT 100
    `;
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching sales analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sales analytics'
    });
  }
});

// Get product analytics
router.get('/products', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { start_date, end_date, category_id } = req.query;
    
    let dateFilter = '';
    let categoryFilter = '';
    const params = [];
    let paramIndex = 1;
    
    if (start_date && end_date) {
      dateFilter = `AND o.created_at BETWEEN $${paramIndex++} AND $${paramIndex++}`;
      params.push(start_date, end_date);
    }
    
    if (category_id) {
      categoryFilter = `AND p.category_id = $${paramIndex++}`;
      params.push(category_id);
    }
    
    // Product performance
    const productPerformance = await pool.query(`
      SELECT 
        p.id,
        p.name,
        p.sku,
        p.price,
        p.inventory_quantity,
        c.name as category_name,
        COALESCE(SUM(oi.quantity), 0) as total_sold,
        COALESCE(SUM(oi.total_price), 0) as revenue,
        COUNT(DISTINCT o.id) as order_count,
        p.created_at
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN order_items oi ON p.id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.id AND o.payment_status = 'paid'
      WHERE 1=1 ${dateFilter} ${categoryFilter}
      GROUP BY p.id, p.name, p.sku, p.price, p.inventory_quantity, c.name, p.created_at
      ORDER BY revenue DESC NULLS LAST
      LIMIT 100
    `, params);
    
    // Low stock alerts
    const lowStock = await pool.query(`
      SELECT 
        p.id,
        p.name,
        p.sku,
        p.inventory_quantity,
        c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.inventory_quantity <= 10 AND p.status = 'active'
      ORDER BY p.inventory_quantity ASC
    `);
    
    res.json({
      success: true,
      data: {
        product_performance: productPerformance.rows,
        low_stock_alerts: lowStock.rows
      }
    });
  } catch (error) {
    console.error('Error fetching product analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product analytics'
    });
  }
});

module.exports = router;
