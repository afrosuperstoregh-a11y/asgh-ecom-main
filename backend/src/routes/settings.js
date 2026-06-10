const express = require('express');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { auditLog } = require('../middleware/auditLog');
const { pool } = require('../config/database');
const router = express.Router();

// Create settings table if it doesn't exist
async function createSettingsTable() {
  if (!pool) {
    console.log('ℹ️  Direct PostgreSQL connection not available - skipping settings table creation');
    return;
  }

  const query = `
    CREATE TABLE IF NOT EXISTS settings (
      id SERIAL PRIMARY KEY,
      key VARCHAR(255) UNIQUE NOT NULL,
      value TEXT,
      type VARCHAR(50) DEFAULT 'string',
      category VARCHAR(100) DEFAULT 'general',
      description TEXT,
      is_public BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);
    CREATE INDEX IF NOT EXISTS idx_settings_category ON settings(category);
    CREATE INDEX IF NOT EXISTS idx_settings_public ON settings(is_public);
  `;
  
  try {
    await pool.query(query);
    console.log('✅ Settings table ready');
  } catch (error) {
    console.error('❌ Error creating settings table:', error.message);
    if (error.code === 'ENETUNREACH' || error.code === 'ECONNREFUSED') {
      console.warn('⚠️  Network error - settings table creation skipped');
    }
  }
}

// Initialize default settings
async function initializeDefaultSettings() {
  if (!pool) {
    console.log('ℹ️  Direct PostgreSQL connection not available - skipping default settings initialization');
    return;
  }

  const defaultSettings = [
    // Store Settings
    { key: 'store_name', value: 'Afro Superstore', type: 'string', category: 'store', description: 'Store name displayed throughout the site', is_public: true },
    { key: 'store_description', value: 'Premium Afrocentric products and lifestyle items', type: 'text', category: 'store', description: 'Store description for SEO and about page', is_public: true },
    { key: 'store_email', value: 'info@afrosuperstore.ca', type: 'email', category: 'store', description: 'Contact email for customer inquiries', is_public: true },
    { key: 'store_phone', value: '+1-555-0123', type: 'phone', category: 'store', description: 'Customer service phone number', is_public: true },
    { key: 'store_address', value: '{"street":"123 Main St","city":"Toronto","province":"ON","postalCode":"M5V 2N6","country":"Canada"}', type: 'json', category: 'store', description: 'Store physical address', is_public: true },
    
    // Currency & Pricing
    { key: 'default_currency', value: 'CAD', type: 'string', category: 'pricing', description: 'Default currency for pricing', is_public: true },
    { key: 'tax_rate', value: '13', type: 'number', category: 'pricing', description: 'Default tax rate percentage', is_public: false },
    { key: 'shipping_cost', value: '15.00', type: 'decimal', category: 'pricing', description: 'Default shipping cost', is_public: false },
    { key: 'free_shipping_threshold', value: '100.00', type: 'decimal', category: 'pricing', description: 'Free shipping minimum order amount', is_public: true },
    
    // Inventory Settings
    { key: 'track_inventory', value: 'true', type: 'boolean', category: 'inventory', description: 'Enable inventory tracking', is_public: false },
    { key: 'allow_backorder', value: 'false', type: 'boolean', category: 'inventory', description: 'Allow backordering of out-of-stock items', is_public: false },
    { key: 'low_stock_threshold', value: '10', type: 'number', category: 'inventory', description: 'Low stock alert threshold', is_public: false },
    
    // Order Settings
    { key: 'order_confirmation_email', value: 'true', type: 'boolean', category: 'orders', description: 'Send order confirmation emails', is_public: false },
    { key: 'shipping_confirmation_email', value: 'true', type: 'boolean', category: 'orders', description: 'Send shipping confirmation emails', is_public: false },
    { key: 'order_number_prefix', value: 'ORD', type: 'string', category: 'orders', description: 'Prefix for order numbers', is_public: false },
    
    // Payment Settings
    { key: 'stripe_enabled', value: 'true', type: 'boolean', category: 'payments', description: 'Enable Stripe payments', is_public: false },
    { key: 'paypal_enabled', value: 'true', type: 'boolean', category: 'payments', description: 'Enable PayPal payments', is_public: false },
    { key: 'cash_on_delivery_enabled', value: 'false', type: 'boolean', category: 'payments', description: 'Enable cash on delivery', is_public: false },
    
    // Security Settings
    { key: 'session_timeout', value: '7', type: 'number', category: 'security', description: 'Session timeout in days', is_public: false },
    { key: 'max_login_attempts', value: '5', type: 'number', category: 'security', description: 'Maximum login attempts before lockout', is_public: false },
    { key: 'password_min_length', value: '8', type: 'number', category: 'security', description: 'Minimum password length', is_public: false },
    
    // Email Settings
    { key: 'email_from_name', value: 'Afro Superstore', type: 'string', category: 'email', description: 'From name for outgoing emails', is_public: false },
    { key: 'email_from_address', value: 'noreply@afrosuperstore.ca', type: 'email', category: 'email', description: 'From address for outgoing emails', is_public: false },
    
    // Social Media
    { key: 'facebook_url', value: 'https://facebook.com/afrosuperstore', type: 'url', category: 'social', description: 'Facebook page URL', is_public: true },
    { key: 'instagram_url', value: 'https://instagram.com/afrosuperstore', type: 'url', category: 'social', description: 'Instagram profile URL', is_public: true },
    { key: 'twitter_url', value: 'https://twitter.com/afrosuperstore', type: 'url', category: 'social', description: 'Twitter profile URL', is_public: true },
    
    // SEO Settings
    { key: 'meta_title', value: 'Afro Superstore - Premium Afrocentric Products', type: 'string', category: 'seo', description: 'Default meta title', is_public: true },
    { key: 'meta_description', value: 'Discover premium Afrocentric clothing, accessories, home decor and more at Afro Superstore.', type: 'text', category: 'seo', description: 'Default meta description', is_public: true },
    { key: 'meta_keywords', value: 'afrocentric, african clothing, accessories, home decor, lifestyle', type: 'text', category: 'seo', description: 'Default meta keywords', is_public: true }
  ];
  
  try {
    for (const setting of defaultSettings) {
      await pool.query(`
        INSERT INTO settings (key, value, type, category, description, is_public)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (key) DO NOTHING
      `, [setting.key, setting.value, setting.type, setting.category, setting.description, setting.is_public]);
    }
    console.log('✅ Default settings initialized');
  } catch (error) {
    console.error('❌ Error initializing default settings:', error.message);
    if (error.code === 'ENETUNREACH' || error.code === 'ECONNREFUSED') {
      console.warn('⚠️  Network error - default settings initialization skipped');
    }
  }
}

// Get public settings (no auth required)
router.get('/public', async (req, res) => {
  if (!pool) {
    return res.status(503).json({
      success: false,
      message: 'Database connection not available'
    });
  }

  try {
    const result = await pool.query(`
      SELECT key, value, type, category
      FROM settings 
      WHERE is_public = true
      ORDER BY category, key
    `);
    
    // Group by category
    const settings = {};
    result.rows.forEach(setting => {
      if (!settings[setting.category]) {
        settings[setting.category] = {};
      }
      
      // Parse value based on type
      let parsedValue = setting.value;
      if (setting.type === 'boolean') {
        parsedValue = setting.value === 'true';
      } else if (setting.type === 'number') {
        parsedValue = parseInt(setting.value);
      } else if (setting.type === 'decimal') {
        parsedValue = parseFloat(setting.value);
      } else if (setting.type === 'json') {
        try {
          parsedValue = JSON.parse(setting.value);
        } catch (e) {
          parsedValue = setting.value;
        }
      }
      
      settings[setting.category][setting.key] = parsedValue;
    });
    
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error fetching public settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch settings'
    });
  }
});

// Get all settings (admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  if (!pool) {
    return res.status(503).json({
      success: false,
      message: 'Database connection not available'
    });
  }

  try {
    const { category } = req.query;
    
    let query = `
      SELECT *
      FROM settings
    `;
    const params = [];
    
    if (category) {
      query += ' WHERE category = $1';
      params.push(category);
    }
    
    query += ' ORDER BY category, key';
    
    const result = await pool.query(query, params);
    
    // Group by category
    const settings = {};
    result.rows.forEach(setting => {
      if (!settings[setting.category]) {
        settings[setting.category] = [];
      }
      
      settings[setting.category].push({
        id: setting.id,
        key: setting.key,
        value: setting.value,
        type: setting.type,
        description: setting.description,
        is_public: setting.is_public,
        updated_at: setting.updated_at
      });
    });
    
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch settings'
    });
  }
});

// Get single setting (admin only)
router.get('/:key', authenticateToken, requireAdmin, async (req, res) => {
  if (!pool) {
    return res.status(503).json({
      success: false,
      message: 'Database connection not available'
    });
  }

  try {
    const { key } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM settings WHERE key = $1',
      [key]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Setting not found'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching setting:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch setting'
    });
  }
});

// Update setting (admin only)
router.put('/:key', authenticateToken, requireAdmin, auditLog('UPDATE', 'setting'), async (req, res) => {
  if (!pool) {
    return res.status(503).json({
      success: false,
      message: 'Database connection not available'
    });
  }

  try {
    const { key } = req.params;
    const { value, type, description, is_public } = req.body;
    
    // Check if setting exists
    const existingSetting = await pool.query(
      'SELECT * FROM settings WHERE key = $1',
      [key]
    );
    
    if (existingSetting.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Setting not found'
      });
    }
    
    const setting = existingSetting.rows[0];
    
    // Validate value based on type
    if (type) {
      if (type === 'boolean' && value !== 'true' && value !== 'false') {
        return res.status(400).json({
          success: false,
          message: 'Boolean value must be "true" or "false"'
        });
      }
      
      if (type === 'number' && isNaN(parseInt(value))) {
        return res.status(400).json({
          success: false,
          message: 'Number value must be a valid integer'
        });
      }
      
      if (type === 'decimal' && isNaN(parseFloat(value))) {
        return res.status(400).json({
          success: false,
          message: 'Decimal value must be a valid number'
        });
      }
      
      if (type === 'json') {
        try {
          JSON.parse(value);
        } catch (e) {
          return res.status(400).json({
            success: false,
            message: 'JSON value must be valid JSON'
          });
        }
      }
    }
    
    // Store old data for audit
    req.oldData = setting;
    
    // Update setting
    const updateFields = ['value', 'type', 'description', 'is_public'];
    const updateValues = [];
    const setClause = [];
    
    updateFields.forEach((field, index) => {
      if (req.body[field] !== undefined) {
        setClause.push(`${field} = $${index + 2}`);
        updateValues.push(req.body[field]);
      }
    });
    
    if (setClause.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }
    
    const query = `
      UPDATE settings 
      SET ${setClause.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE key = $1
      RETURNING *
    `;
    
    const values = [key, ...updateValues];
    const result = await pool.query(query, values);
    
    res.json({
      success: true,
      message: 'Setting updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating setting:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update setting'
    });
  }
});

// Create new setting (admin only)
router.post('/', authenticateToken, requireAdmin, auditLog('CREATE', 'setting'), async (req, res) => {
  if (!pool) {
    return res.status(503).json({
      success: false,
      message: 'Database connection not available'
    });
  }

  try {
    const { key, value, type = 'string', category = 'general', description, is_public = false } = req.body;
    
    if (!key) {
      return res.status(400).json({
        success: false,
        message: 'Setting key is required'
      });
    }
    
    // Check if setting already exists
    const existingSetting = await pool.query(
      'SELECT id FROM settings WHERE key = $1',
      [key]
    );
    
    if (existingSetting.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Setting with this key already exists'
      });
    }
    
    // Validate value based on type
    if (type === 'boolean' && value !== 'true' && value !== 'false') {
      return res.status(400).json({
        success: false,
        message: 'Boolean value must be "true" or "false"'
      });
    }
    
    if (type === 'number' && isNaN(parseInt(value))) {
      return res.status(400).json({
        success: false,
        message: 'Number value must be a valid integer'
      });
    }
    
    if (type === 'decimal' && isNaN(parseFloat(value))) {
      return res.status(400).json({
        success: false,
        message: 'Decimal value must be a valid number'
      });
    }
    
    if (type === 'json') {
      try {
        JSON.parse(value);
      } catch (e) {
        return res.status(400).json({
          success: false,
          message: 'JSON value must be valid JSON'
        });
      }
    }
    
    const query = `
      INSERT INTO settings (key, value, type, category, description, is_public)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const values = [key, value, type, category, description, is_public];
    const result = await pool.query(query, values);
    
    res.status(201).json({
      success: true,
      message: 'Setting created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating setting:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create setting'
    });
  }
});

// Delete setting (admin only)
router.delete('/:key', authenticateToken, requireAdmin, auditLog('DELETE', 'setting'), async (req, res) => {
  if (!pool) {
    return res.status(503).json({
      success: false,
      message: 'Database connection not available'
    });
  }

  try {
    const { key } = req.params;
    
    // Check if setting exists
    const existingSetting = await pool.query(
      'SELECT * FROM settings WHERE key = $1',
      [key]
    );
    
    if (existingSetting.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Setting not found'
      });
    }
    
    const setting = existingSetting.rows[0];
    
    // Store old data for audit
    req.oldData = setting;
    
    // Delete setting
    await pool.query('DELETE FROM settings WHERE key = $1', [key]);
    
    res.json({
      success: true,
      message: 'Setting deleted successfully',
      data: setting
    });
  } catch (error) {
    console.error('Error deleting setting:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete setting'
    });
  }
});

// Bulk update settings (admin only)
router.put('/', authenticateToken, requireAdmin, auditLog('BULK_UPDATE', 'setting'), async (req, res) => {
  if (!pool) {
    return res.status(503).json({
      success: false,
      message: 'Database connection not available'
    });
  }

  try {
    const { settings } = req.body;
    
    if (!Array.isArray(settings) || settings.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Settings array is required'
      });
    }
    
    const results = [];
    const errors = [];
    
    for (const settingData of settings) {
      try {
        const { key, value, type, description, is_public } = settingData;
        
        if (!key) {
          errors.push({ key: settingData.key, error: 'Setting key is required' });
          continue;
        }
        
        // Check if setting exists
        const existingSetting = await pool.query(
          'SELECT * FROM settings WHERE key = $1',
          [key]
        );
        
        if (existingSetting.rows.length === 0) {
          errors.push({ key, error: 'Setting not found' });
          continue;
        }
        
        // Update setting
        const updateFields = ['value', 'type', 'description', 'is_public'];
        const updateValues = [];
        const setClause = [];
        
        updateFields.forEach((field, index) => {
          if (settingData[field] !== undefined) {
            setClause.push(`${field} = $${index + 2}`);
            updateValues.push(settingData[field]);
          }
        });
        
        if (setClause.length > 0) {
          const query = `
            UPDATE settings 
            SET ${setClause.join(', ')}, updated_at = CURRENT_TIMESTAMP
            WHERE key = $1
            RETURNING *
          `;
          
          const values = [key, ...updateValues];
          const result = await pool.query(query, values);
          results.push(result.rows[0]);
        }
      } catch (error) {
        errors.push({ key: settingData.key, error: error.message });
      }
    }
    
    res.json({
      success: true,
      message: `Updated ${results.length} settings successfully`,
      data: {
        updated: results,
        errors: errors
      }
    });
  } catch (error) {
    console.error('Error bulk updating settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk update settings'
    });
  }
});

module.exports = router;
module.exports.createSettingsTable = createSettingsTable;
module.exports.initializeDefaultSettings = initializeDefaultSettings;
