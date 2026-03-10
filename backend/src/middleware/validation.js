const Joi = require('joi');

// Common validation schemas
const schemas = {
  // User validation schemas
  userRegistration: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    firstName: Joi.string().min(2).max(50).required(),
    lastName: Joi.string().min(2).max(50).required(),
    phone: Joi.string().optional(),
  }),

  userLogin: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  // Product validation schemas
  productCreate: Joi.object({
    name: Joi.string().min(1).max(255).required(),
    description: Joi.string().optional(),
    price: Joi.number().positive().required(),
    categoryId: Joi.number().integer().positive().required(),
    sku: Joi.string().optional(),
    images: Joi.array().items(Joi.string().uri()).optional(),
    variants: Joi.array().items(Joi.object({
      size: Joi.string().optional(),
      color: Joi.string().optional(),
      price: Joi.number().positive().optional(),
      stock: Joi.number().integer().min(0).optional(),
    })).optional(),
  }),

  productUpdate: Joi.object({
    name: Joi.string().min(1).max(255).optional(),
    description: Joi.string().optional(),
    price: Joi.number().positive().optional(),
    categoryId: Joi.number().integer().positive().optional(),
    sku: Joi.string().optional(),
    images: Joi.array().items(Joi.string().uri()).optional(),
    status: Joi.string().valid('active', 'inactive', 'draft').optional(),
  }),

  // Order validation schemas
  orderCreate: Joi.object({
    items: Joi.array().items(Joi.object({
      productId: Joi.number().integer().positive().required(),
      quantity: Joi.number().integer().positive().required(),
      price: Joi.number().positive().required(),
    })).min(1).required(),
    shippingAddress: Joi.object({
      street: Joi.string().required(),
      city: Joi.string().required(),
      state: Joi.string().required(),
      zipCode: Joi.string().required(),
      country: Joi.string().required(),
    }).required(),
    paymentMethod: Joi.string().valid('stripe', 'paypal', 'cash').required(),
  }),

  // Category validation schemas
  categoryCreate: Joi.object({
    name: Joi.string().min(1).max(100).required(),
    description: Joi.string().optional(),
    parentId: Joi.number().integer().positive().optional(),
    image: Joi.string().uri().optional(),
  }),

  categoryUpdate: Joi.object({
    name: Joi.string().min(1).max(100).optional(),
    description: Joi.string().optional(),
    parentId: Joi.number().integer().positive().optional(),
    image: Joi.string().uri().optional(),
    status: Joi.string().valid('active', 'inactive').optional(),
  }),
};

// Validation middleware factory
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const data = source === 'body' ? req.body : 
                 source === 'query' ? req.query : 
                 source === 'params' ? req.params : req.body;

    const { error, value } = schemas[schema].validate(data, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context.value,
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
    }

    // Replace the request data with validated and cleaned data
    if (source === 'body') req.body = value;
    else if (source === 'query') req.query = value;
    else if (source === 'params') req.params = value;

    next();
  };
};

// Custom validation functions
const customValidators = {
  // Validate email uniqueness
  async validateUniqueEmail(email, excludeId = null) {
    try {
      const { Pool } = require('pg');
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
      });

      let query = 'SELECT id FROM users WHERE email = $1';
      let params = [email];

      if (excludeId) {
        query += ' AND id != $2';
        params.push(excludeId);
      }

      const result = await pool.query(query, params);
      await pool.end();

      return result.rows.length === 0;
    } catch (error) {
      console.error('Error validating email uniqueness:', error);
      return false;
    }
  },

  // Validate SKU uniqueness
  async validateUniqueSKU(sku, excludeId = null) {
    try {
      const { Pool } = require('pg');
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
      });

      let query = 'SELECT id FROM products WHERE sku = $1';
      let params = [sku];

      if (excludeId) {
        query += ' AND id != $2';
        params.push(excludeId);
      }

      const result = await pool.query(query, params);
      await pool.end();

      return result.rows.length === 0;
    } catch (error) {
      console.error('Error validating SKU uniqueness:', error);
      return false;
    }
  },

  // Validate product stock
  validateStock(quantity, availableStock) {
    return quantity <= availableStock;
  },

  // Validate file upload
  validateFile(file, allowedTypes = ['image/jpeg', 'image/png', 'image/webp'], maxSize = 10 * 1024 * 1024) {
    if (!file) return false;
    
    if (!allowedTypes.includes(file.mimetype)) {
      return false;
    }

    if (file.size > maxSize) {
      return false;
    }

    return true;
  },
};

// Sanitization functions
const sanitizers = {
  // Sanitize string input
  sanitizeString(input) {
    if (typeof input !== 'string') return input;
    return input.trim().replace(/[<>]/g, '');
  },

  // Sanitize email
  sanitizeEmail(email) {
    if (typeof email !== 'string') return email;
    return email.toLowerCase().trim();
  },

  // Sanitize phone number
  sanitizePhone(phone) {
    if (typeof phone !== 'string') return phone;
    return phone.replace(/[^\d+]/g, '');
  },

  // Sanitize HTML content
  sanitizeHTML(html) {
    if (typeof html !== 'string') return html;
    // Basic HTML sanitization - remove script tags and dangerous attributes
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+="[^"]*"/gi, '')
      .replace(/javascript:/gi, '');
  },
};

// Middleware for sanitizing request body
const sanitizeBody = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    const sanitizeObject = (obj) => {
      const sanitized = {};
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
          sanitized[key] = sanitizers.sanitizeString(value);
        } else if (Array.isArray(value)) {
          sanitized[key] = value.map(item => 
            typeof item === 'string' ? sanitizers.sanitizeString(item) : item
          );
        } else if (typeof value === 'object' && value !== null) {
          sanitized[key] = sanitizeObject(value);
        } else {
          sanitized[key] = value;
        }
      }
      return sanitized;
    };
    
    req.body = sanitizeObject(req.body);
  }
  
  next();
};

module.exports = {
  validate,
  schemas,
  customValidators,
  sanitizers,
  sanitizeBody,
  // Specific validation exports
  validateProduct: validate('productCreate'),
  validateProductUpdate: validate('productUpdate'),
  validateUserRegistration: validate('userRegistration'),
  validateUserLogin: validate('userLogin'),
  validateOrderCreate: validate('orderCreate'),
  validateCategoryCreate: validate('categoryCreate'),
  validateCategoryUpdate: validate('categoryUpdate'),
};
