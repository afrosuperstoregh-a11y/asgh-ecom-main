const express = require('express');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { supabase } = require('../config/supabase');
const router = express.Router();

// Get all products (public)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, sort = 'created_at', order = 'DESC', category, search } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('products')
      .select(`
        *,
        categories!inner(name, slug)
      `);

    // Add status filter
    query = query.eq('status', 'active');

    // Add category filter
    if (category) {
      query = query.or(`categories.slug.eq.${category},categories.name.eq.${category}`);
    }

    // Add search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,sku.ilike.%${search}%`);
    }

    // Add ordering
    query = query.order(sort, { ascending: order === 'ASC' });

    // Add pagination
    query = query.range(offset, offset + limit - 1);

    const { data: products, error, count } = await query;

    if (error) {
      console.error('Error fetching products:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch products'
      });
    }

    const totalItems = count || 0;
    const totalPages = Math.ceil(totalItems / limit);

    res.json({
      success: true,
      data: products || [],
      pagination: {
        current_page: parseInt(page),
        total_pages: totalPages,
        total_items: totalItems,
        items_per_page: parseInt(limit),
        has_next: page < totalPages,
        has_prev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products'
    });
  }
});

// Get products by category (public)
router.get('/category/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { page = 1, limit = 20, sort = 'created_at', order = 'DESC' } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('products')
      .select(`
        *,
        categories!inner(name, slug)
      `)
      .eq('status', 'active')
      .or(`category_id.eq.${categoryId},categories.slug.eq.${categoryId}`);

    // Add ordering
    query = query.order(sort, { ascending: order === 'ASC' });

    // Add pagination
    query = query.range(offset, offset + limit - 1);

    const { data: products, error, count } = await query;

    if (error) {
      console.error('Error fetching products by category:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch products by category'
      });
    }

    const totalItems = count || 0;
    const totalPages = Math.ceil(totalItems / limit);

    res.json({
      success: true,
      data: products || [],
      pagination: {
        current_page: parseInt(page),
        total_pages: totalPages,
        total_items: totalItems,
        items_per_page: parseInt(limit),
        has_next: page < totalPages,
        has_prev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching products by category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products by category'
    });
  }
});

// Get single product (public)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data: product, error } = await supabase
      .from('products')
      .select(`
        *,
        categories!inner(name, slug)
      `)
      .or(`id.eq.${id},slug.eq.${id}`)
      .single();
    
    if (error || !product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    res.json({
      success: true,
      data: product
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

    // Validation
    if (!name || !sku || price === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Name, SKU, and price are required'
      });
    }

    if (inventory_quantity < 0) {
      return res.status(400).json({
        success: false,
        message: 'Stock quantity cannot be negative'
      });
    }

    // Check SKU uniqueness
    const { data: existingSku } = await supabase
      .from('products')
      .select('id')
      .eq('sku', sku)
      .single();

    if (existingSku) {
      return res.status(409).json({
        success: false,
        message: 'SKU already exists'
      });
    }

    // Validate category exists
    if (category_id) {
      const { data: categoryExists } = await supabase
        .from('categories')
        .select('id')
        .eq('id', category_id)
        .single();

      if (!categoryExists) {
        return res.status(400).json({
          success: false,
          message: 'Category not found'
        });
      }
    }

    const productData = {
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
      inventory_quantity,
      track_inventory,
      allow_backorder,
      requires_shipping,
      is_digital,
      status,
      featured,
      seo_title,
      seo_description
    };

    const { data: result, error } = await supabase
      .from('products')
      .insert(productData)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating product:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create product'
      });
    }
    
    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: result
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
    
    const { data: result, error } = await supabase
      .from('products')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .or(`id.eq.${id},slug.eq.${id}`)
      .select()
      .single();
    
    if (error || !result) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Product updated successfully',
      data: result
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
    const { data: result, error } = await supabase
      .from('products')
      .update({ 
        status: 'archived', 
        updated_at: new Date().toISOString() 
      })
      .or(`id.eq.${id},slug.eq.${id}`)
      .select()
      .single();
    
    if (error || !result) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Product deleted successfully',
      data: result
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
