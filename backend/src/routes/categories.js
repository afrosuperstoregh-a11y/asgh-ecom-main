const express = require('express');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { supabase } = require('../config/supabase');
// const { auditLog } = require('../middleware/auditLog');
// const { cacheConfigs, invalidateCache } = require('../middleware/cache');
const { Pool } = require('pg');
const router = express.Router();

// Database connection (fallback)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Generate unique slug from name
function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim();
}

// Ensure unique slug by adding number if needed
async function ensureUniqueSlug(slug, excludeId = null) {
  let uniqueSlug = slug;
  let counter = 1;
  
  while (true) {
    const query = excludeId 
      ? 'SELECT id FROM categories WHERE slug = $1 AND id != $2'
      : 'SELECT id FROM categories WHERE slug = $1';
    
    const params = excludeId ? [uniqueSlug, excludeId] : [uniqueSlug];
    const result = await pool.query(query, params);
    
    if (result.rows.length === 0) {
      break;
    }
    
    uniqueSlug = `${slug}-${counter}`;
    counter++;
  }
  
  return uniqueSlug;
}

// Get all categories (public)
router.get('/', async (req, res) => {
  try {
    // Try Supabase first
    if (supabase) {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true });

      if (error) {
        console.error('Supabase error fetching categories:', error);
        throw error;
      }

      // Get product counts for each category
      const categoriesWithCounts = await Promise.all(
        data.map(async (category) => {
          const { count, error: countError } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('category_id', category.id)
            .eq('status', 'active');

          return {
            ...category,
            productCount: countError ? 0 : count || 0
          };
        })
      );

      return res.json({
        success: true,
        categories: categoriesWithCounts,
        count: categoriesWithCounts.length
      });
    }

    // Fallback to PostgreSQL if Supabase is not available
    const result = await pool.query(`
      SELECT 
        c.*,
        COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id AND p.status = 'active'
      WHERE c.is_active = true
      GROUP BY c.id
      ORDER BY c.sort_order ASC, c.name ASC
    `);
    
    const categoriesWithCounts = result.rows.map(row => ({
      ...row,
      productCount: parseInt(row.product_count) || 0
    }));

    res.json({
      success: true,
      categories: categoriesWithCounts,
      count: categoriesWithCounts.length
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories'
    });
  }
});

// Get single category (public)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT 
        c.*,
        COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id AND p.status = 'active'
      WHERE c.id = $1 OR c.slug = $1
      GROUP BY c.id
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch category'
    });
  }
});

// Get category tree (hierarchical structure)
router.get('/tree/all', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        c.*,
        COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id AND p.status = 'active'
      WHERE c.is_active = true
      GROUP BY c.id
      ORDER BY c.sort_order ASC, c.name ASC
    `);
    
    // Build hierarchical tree
    const categories = result.rows;
    const categoryMap = {};
    const tree = [];
    
    // Create map of categories
    categories.forEach(cat => {
      categoryMap[cat.id] = { ...cat, children: [] };
    });
    
    // Build tree structure
    categories.forEach(cat => {
      if (cat.parent_id && categoryMap[cat.parent_id]) {
        categoryMap[cat.parent_id].children.push(categoryMap[cat.id]);
      } else {
        tree.push(categoryMap[cat.id]);
      }
    });
    
    res.json({
      success: true,
      data: tree,
      count: tree.length
    });
  } catch (error) {
    console.error('Error fetching category tree:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch category tree'
    });
  }
});

// Admin routes - require authentication
router.use(authenticateToken);
router.use(requireAdmin);

// Create category (admin)
router.post('/', 
  // auditLog('CREATE', 'category'),
  // invalidateCache(['cache:categories:*', 'cache:products:*']),
  async (req, res) => {
  try {
    const {
      name,
      description,
      image_url,
      parent_id,
      sort_order = 0,
      is_active = true
    } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required'
      });
    }
    
    // Generate and ensure unique slug
    const baseSlug = generateSlug(name);
    const slug = await ensureUniqueSlug(baseSlug);
    
    // Validate parent category if provided
    if (parent_id) {
      const parentResult = await pool.query('SELECT id FROM categories WHERE id = $1', [parent_id]);
      if (parentResult.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Parent category not found'
        });
      }
    }
    
    const query = `
      INSERT INTO categories (
        name, slug, description, image_url, parent_id, sort_order, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    
    const values = [
      name, slug, description, image_url, parent_id, sort_order, is_active
    ];
    
    const result = await pool.query(query, values);
    
    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create category'
    });
  }
});

// Update category (admin)
router.put('/:id', 
  // auditLog('UPDATE', 'category'),
  // invalidateCache(['cache:categories:*', 'cache:products:*']),
  async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Check if category exists
    const existingCategory = await pool.query(
      'SELECT * FROM categories WHERE id = $1 OR slug = $1',
      [id]
    );
    
    if (existingCategory.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    const category = existingCategory.rows[0];
    
    // Handle slug generation if name is being updated
    if (updates.name && updates.name !== category.name) {
      const baseSlug = generateSlug(updates.name);
      updates.slug = await ensureUniqueSlug(baseSlug, category.id);
    }
    
    // Validate parent category if being updated
    if (updates.parent_id && updates.parent_id !== category.parent_id) {
      // Prevent self-parenting
      if (updates.parent_id === category.id) {
        return res.status(400).json({
          success: false,
          message: 'Category cannot be its own parent'
        });
      }
      
      // Check if parent exists
      const parentResult = await pool.query('SELECT id FROM categories WHERE id = $1', [updates.parent_id]);
      if (parentResult.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Parent category not found'
        });
      }
      
      // Prevent circular references (basic check)
      const childCheck = await pool.query(
        'SELECT id FROM categories WHERE parent_id = $1',
        [category.id]
      );
      
      if (childCheck.rows.some(child => child.id === parseInt(updates.parent_id))) {
        return res.status(400).json({
          success: false,
          message: 'Cannot set child category as parent'
        });
      }
    }
    
    // Store old data for audit
    req.oldData = category;
    
    // Build dynamic update query
    const setClause = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');
    
    const query = `
      UPDATE categories 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    
    const values = [category.id, ...Object.values(updates)];
    
    const result = await pool.query(query, values);
    
    res.json({
      success: true,
      message: 'Category updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update category'
    });
  }
});

// Delete category (admin)
router.delete('/:id', 
  // auditLog('DELETE', 'category'),
  // invalidateCache(['cache:categories:*', 'cache:products:*']),
  async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if category exists
    const existingCategory = await pool.query(
      'SELECT * FROM categories WHERE id = $1 OR slug = $1',
      [id]
    );
    
    if (existingCategory.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    const category = existingCategory.rows[0];
    
    // Check for products in this category
    const productsResult = await pool.query(
      'SELECT COUNT(*) as count FROM products WHERE category_id = $1',
      [category.id]
    );
    
    if (parseInt(productsResult.rows[0].count) > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category with existing products. Move or delete products first.'
      });
    }
    
    // Check for child categories
    const childrenResult = await pool.query(
      'SELECT COUNT(*) as count FROM categories WHERE parent_id = $1',
      [category.id]
    );
    
    if (parseInt(childrenResult.rows[0].count) > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category with child categories. Move or delete child categories first.'
      });
    }
    
    // Store old data for audit
    req.oldData = category;
    
    // Soft delete by deactivating
    const result = await pool.query(
      'UPDATE categories SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
      [category.id]
    );
    
    res.json({
      success: true,
      message: 'Category deleted successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete category'
    });
  }
});

// Get all categories (admin - includes inactive)
router.get('/admin/all', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        c.*,
        COUNT(p.id) as product_count,
        parent.name as parent_name
      FROM categories c
      LEFT JOIN categories parent ON c.parent_id = parent.id
      LEFT JOIN products p ON c.id = p.category_id
      GROUP BY c.id, parent.name
      ORDER BY c.sort_order ASC, c.name ASC
    `);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching all categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories'
    });
  }
});

module.exports = router;
