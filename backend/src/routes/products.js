const express = require('express');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { Pool } = require('pg');
const router = express.Router();

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Get all products (public)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM products WHERE status = $1 ORDER BY created_at DESC',
      ['active']
    );
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products'
    });
  }
});

// Get single product (public)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM products WHERE id = $1 OR slug = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product'
    });
  }
});

// Admin routes - require authentication
router.use(authenticateToken);
router.use(requireAdmin);

// Create product (admin)
router.post('/', async (req, res) => {
  try {
    const {
      name,
      slug,
      description,
      short_description,
      sku,
      price,
      compare_price,
      cost_price,
      weight,
      dimensions,
      category_id,
      images,
      tags,
      inventory_quantity = 0,
      track_inventory = true,
      allow_backorder = false,
      requires_shipping = true,
      is_digital = false,
      status = 'draft',
      featured = false,
      seo_title,
      seo_description
    } = req.body;

    const query = `
      INSERT INTO products (
        name, slug, description, short_description, sku, price, compare_price,
        cost_price, weight, dimensions, category_id, images, tags,
        inventory_quantity, track_inventory, allow_backorder, requires_shipping,
        is_digital, status, featured, seo_title, seo_description
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
        $14, $15, $16, $17, $18, $19, $20, $21, $22
      ) RETURNING *
    `;

    const values = [
      name, slug, description, short_description, sku, price, compare_price,
      cost_price, weight, dimensions, category_id, JSON.stringify(images),
      JSON.stringify(tags), inventory_quantity, track_inventory, allow_backorder,
      requires_shipping, is_digital, status, featured, seo_title, seo_description
    ];

    const result = await pool.query(query, values);
    
    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create product'
    });
  }
});

// Update product (admin)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Convert JSON fields
    if (updates.images) updates.images = JSON.stringify(updates.images);
    if (updates.tags) updates.tags = JSON.stringify(updates.tags);
    
    // Build dynamic update query
    const setClause = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');
    
    const query = `
      UPDATE products 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 OR slug = $1
      RETURNING *
    `;
    
    const values = [id, ...Object.values(updates)];
    
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Product updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update product'
    });
  }
});

// Delete product (admin)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Soft delete by setting status to archived
    const result = await pool.query(
      'UPDATE products SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 OR slug = $2 RETURNING *',
      ['archived', id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Product deleted successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete product'
    });
  }
});

module.exports = router;
