/**
 * CRM Middleware
 * Additional security and validation middleware for CRM operations
 */

const { Pool } = require('pg');

// Database connection for security checks
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

/**
 * Validate CRM Admin Access
 * Ensures user has proper CRM permissions
 */
const validateCRMAdmin = async (req, res, next) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Check if user has admin role
    if (!['admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'CRM admin access required'
      });
    }

    // Additional check for super admin only operations
    if (req.path.includes('/super-admin') && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Super admin access required'
      });
    }

    next();
  } catch (error) {
    console.error('CRM admin validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication validation failed'
    });
  }
};

/**
 * Validate Customer Access
 * Ensures user can access specific customer data
 */
const validateCustomerAccess = async (req, res, next) => {
  try {
    const customerId = req.params.id || req.params.customerId;
    
    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: 'Customer ID required'
      });
    }

    // Admins can access all customers
    if (['admin', 'super_admin'].includes(req.user.role)) {
      return next();
    }

    // Check if user owns the customer profile
    const query = `
      SELECT cp.id 
      FROM customer_profiles cp 
      WHERE cp.id = $1 AND cp.user_id = $2 AND cp.soft_deleted = false
    `;
    
    const result = await pool.query(query, [customerId, req.user.id]);
    
    if (result.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Customer not found or access restricted'
      });
    }

    next();
  } catch (error) {
    console.error('Customer access validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Access validation failed'
    });
  }
};

/**
 * Validate CRM Operation
 * Validates CRM-specific operations and permissions
 */
const validateCRMOperation = (operation) => {
  return async (req, res, next) => {
    try {
      // Check user permissions based on operation
      const permissions = {
        'read': ['admin', 'super_admin', 'support'],
        'write': ['admin', 'super_admin'],
        'delete': ['admin', 'super_admin'],
        'automation': ['admin', 'super_admin'],
        'email': ['admin', 'super_admin'],
        'segmentation': ['admin', 'super_admin']
      };

      const allowedRoles = permissions[operation] || ['admin', 'super_admin'];
      
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: `Insufficient permissions for ${operation} operation`
        });
      }

      // Additional validation for specific operations
      switch (operation) {
        case 'delete':
          await validateDeleteOperation(req);
          break;
        case 'automation':
          await validateAutomationOperation(req);
          break;
        case 'email':
          await validateEmailOperation(req);
          break;
      }

      next();
    } catch (error) {
      console.error('CRM operation validation error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Operation validation failed'
      });
    }
  };
};

/**
 * Validate Delete Operation
 */
const validateDeleteOperation = async (req) => {
  const customerId = req.params.id;
  
  // Prevent deletion of certain high-value customers
  const query = `
    SELECT cp.total_spend, cp.order_count 
    FROM customer_profiles cp 
    WHERE cp.id = $1
  `;
  
  const result = await pool.query(query, [customerId]);
  
  if (result.rows.length > 0) {
    const customer = result.rows[0];
    
    // Prevent deletion of high-value customers (configurable thresholds)
    const HIGH_VALUE_THRESHOLD = 10000; // $10,000
    const HIGH_ORDER_THRESHOLD = 100; // 100 orders
    
    if (customer.total_spend >= HIGH_VALUE_THRESHOLD || customer.order_count >= HIGH_ORDER_THRESHOLD) {
      throw new Error('Cannot delete high-value customer. Additional approval required.');
    }
  }
};

/**
 * Validate Automation Operation
 */
const validateAutomationOperation = async (req) => {
  // Validate automation configuration
  if (req.body.actions) {
    const actions = req.body.actions;
    
    // Check for potentially dangerous actions
    const dangerousActions = actions.filter(action => 
      action.type === 'webhook' && 
      action.config && 
      action.config.url && 
      !action.config.url.startsWith('https://')
    );
    
    if (dangerousActions.length > 0) {
      throw new Error('Webhook URLs must use HTTPS for security');
    }
  }
  
  // Validate trigger configuration
  if (req.body.trigger_config) {
    const triggerConfig = req.body.trigger_config;
    
    // Check for potentially unsafe trigger configurations
    if (triggerConfig.days_inactive && triggerConfig.days_inactive < 1) {
      throw new Error('Days inactive must be at least 1');
    }
  }
};

/**
 * Validate Email Operation
 */
const validateEmailOperation = async (req) => {
  // Validate email recipients
  if (req.body.to) {
    const recipients = Array.isArray(req.body.to) ? req.body.to : [req.body.to];
    
    // Check for suspicious email patterns
    const suspiciousEmails = recipients.filter(email => {
      const emailStr = typeof email === 'string' ? email : email.email || '';
      return !emailStr.includes('@') || emailStr.length > 255;
    });
    
    if (suspiciousEmails.length > 0) {
      throw new Error('Invalid email recipients detected');
    }
  }
  
  // Validate template variables
  if (req.body.variables) {
    const variables = req.body.variables;
    
    // Check for potentially malicious content
    const dangerousKeys = Object.keys(variables).filter(key => 
      key.toLowerCase().includes('script') || 
      key.toLowerCase().includes('javascript') ||
      key.toLowerCase().includes('iframe')
    );
    
    if (dangerousKeys.length > 0) {
      throw new Error('Potentially dangerous template variables detected');
    }
  }
};

/**
 * Rate Limiting for CRM Operations
 */
const crmRateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();
  
  return (req, res, next) => {
    const key = `crm_${req.user.id}_${req.path}`;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Clean up old entries
    for (const [k, v] of requests.entries()) {
      if (v.timestamp < windowStart) {
        requests.delete(k);
      }
    }
    
    // Check current requests
    const userRequests = requests.get(key) || { count: 0, timestamp: now };
    
    if (userRequests.count >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Too many CRM requests. Please try again later.'
      });
    }
    
    // Update request count
    requests.set(key, {
      count: userRequests.count + 1,
      timestamp: now
    });
    
    next();
  };
};

/**
 * Validate CRM Data
 * Validates CRM data structure and content
 */
const validateCRMData = (dataType) => {
  return (req, res, next) => {
    try {
      const data = req.body;
      
      switch (dataType) {
        case 'customer_profile':
          validateCustomerProfileData(data);
          break;
        case 'customer_segment':
          validateCustomerSegmentData(data);
          break;
        case 'email_template':
          validateEmailTemplateData(data);
          break;
        case 'automation':
          validateAutomationData(data);
          break;
        default:
          break;
      }
      
      next();
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  };
};

/**
 * Validate Customer Profile Data
 */
const validateCustomerProfileData = (data) => {
  const requiredFields = ['user_id'];
  const allowedFields = [
    'user_id', 'lifecycle_stage', 'preferred_language', 'timezone',
    'marketing_consent', 'sms_consent'
  ];
  
  // Check required fields
  for (const field of requiredFields) {
    if (!data[field]) {
      throw new Error(`Required field missing: ${field}`);
    }
  }
  
  // Check for disallowed fields
  const disallowedFields = Object.keys(data).filter(field => !allowedFields.includes(field));
  if (disallowedFields.length > 0) {
    throw new Error(`Disallowed fields: ${disallowedFields.join(', ')}`);
  }
  
  // Validate field values
  if (data.lifecycle_stage && !['lead', 'active', 'inactive', 'vip', 'churned'].includes(data.lifecycle_stage)) {
    throw new Error('Invalid lifecycle stage');
  }
  
  if (data.preferred_language && data.preferred_language.length > 10) {
    throw new Error('Preferred language too long');
  }
};

/**
 * Validate Customer Segment Data
 */
const validateCustomerSegmentData = (data) => {
  const requiredFields = ['name'];
  const allowedFields = [
    'name', 'description', 'is_active', 'is_dynamic', 'rules'
  ];
  
  // Check required fields
  for (const field of requiredFields) {
    if (!data[field]) {
      throw new Error(`Required field missing: ${field}`);
    }
  }
  
  // Check for disallowed fields
  const disallowedFields = Object.keys(data).filter(field => !allowedFields.includes(field));
  if (disallowedFields.length > 0) {
    throw new Error(`Disallowed fields: ${disallowedFields.join(', ')}`);
  }
  
  // Validate segment name
  if (data.name.length > 100) {
    throw new Error('Segment name too long');
  }
  
  // Validate rules if provided
  if (data.rules && Array.isArray(data.rules)) {
    for (const rule of data.rules) {
      if (!rule.field || !rule.operator || !rule.value) {
        throw new Error('Invalid segment rule: missing field, operator, or value');
      }
    }
  }
};

/**
 * Validate Email Template Data
 */
const validateEmailTemplateData = (data) => {
  const requiredFields = ['name', 'subject', 'html_content', 'template_type'];
  const allowedFields = [
    'name', 'subject', 'html_content', 'text_content', 'template_type',
    'category', 'variables'
  ];
  
  // Check required fields
  for (const field of requiredFields) {
    if (!data[field]) {
      throw new Error(`Required field missing: ${field}`);
    }
  }
  
  // Check for disallowed fields
  const disallowedFields = Object.keys(data).filter(field => !allowedFields.includes(field));
  if (disallowedFields.length > 0) {
    throw new Error(`Disallowed fields: ${disallowedFields.join(', ')}`);
  }
  
  // Validate template type
  if (!['transactional', 'marketing', 'notification'].includes(data.template_type)) {
    throw new Error('Invalid template type');
  }
  
  // Check for potentially dangerous HTML content
  if (data.html_content.includes('<script') || data.html_content.includes('javascript:')) {
    throw new Error('Potentially dangerous HTML content detected');
  }
};

/**
 * Validate Automation Data
 */
const validateAutomationData = (data) => {
  const requiredFields = ['name', 'trigger_type', 'actions'];
  const allowedFields = [
    'name', 'description', 'trigger_type', 'trigger_config', 'actions', 'is_active'
  ];
  
  // Check required fields
  for (const field of requiredFields) {
    if (!data[field]) {
      throw new Error(`Required field missing: ${field}`);
    }
  }
  
  // Check for disallowed fields
  const disallowedFields = Object.keys(data).filter(field => !allowedFields.includes(field));
  if (disallowedFields.length > 0) {
    throw new Error(`Disallowed fields: ${disallowedFields.join(', ')}`);
  }
  
  // Validate trigger type
  const validTriggers = [
    'order_placed', 'order_shipped', 'customer_inactive', 
    'customer_signup', 'segment_changed', 'custom'
  ];
  
  if (!validTriggers.includes(data.trigger_type)) {
    throw new Error('Invalid trigger type');
  }
  
  // Validate actions
  if (!Array.isArray(data.actions) || data.actions.length === 0) {
    throw new Error('At least one action is required');
  }
  
  for (const action of data.actions) {
    if (!action.type || !action.config) {
      throw new Error('Invalid action: missing type or config');
    }
  }
};

/**
 * Sanitize CRM Data
 * Sanitizes input data to prevent XSS and injection attacks
 */
const sanitizeCRMData = (req, res, next) => {
  try {
    const sanitizeString = (str) => {
      if (typeof str !== 'string') return str;
      
      // Remove potentially dangerous characters
      return str
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .trim();
    };
    
    const sanitizeObject = (obj) => {
      if (typeof obj !== 'object' || obj === null) return obj;
      
      const sanitized = {};
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
          sanitized[key] = sanitizeString(value);
        } else if (typeof value === 'object') {
          sanitized[key] = sanitizeObject(value);
        } else {
          sanitized[key] = value;
        }
      }
      return sanitized;
    };
    
    // Sanitize request body
    if (req.body) {
      req.body = sanitizeObject(req.body);
    }
    
    // Sanitize query parameters
    if (req.query) {
      req.query = sanitizeObject(req.query);
    }
    
    next();
  } catch (error) {
    console.error('Data sanitization error:', error);
    res.status(400).json({
      success: false,
      message: 'Invalid data format'
    });
  }
};

module.exports = {
  validateCRMAdmin,
  validateCustomerAccess,
  validateCRMOperation,
  crmRateLimit,
  validateCRMData,
  sanitizeCRMData
};
