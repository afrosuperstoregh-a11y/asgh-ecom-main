import { body, param, query } from 'express-validator';

// User validation schemas
export const validateUserRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('name')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Please provide a valid phone number')
];

export const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Product validation schemas
export const validateProductCreate = [
  body('name')
    .isLength({ min: 2, max: 200 })
    .withMessage('Product name must be between 2 and 200 characters'),
  body('description')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Description must not exceed 2000 characters'),
  body('shortDesc')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Short description must not exceed 500 characters'),
  body('sku')
    .isLength({ min: 2, max: 50 })
    .withMessage('SKU must be between 2 and 50 characters'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('comparePrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Compare price must be a positive number'),
  body('cost')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Cost must be a positive number'),
  body('stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock must be a non-negative integer'),
  body('categoryId')
    .isUUID()
    .withMessage('Category ID must be a valid UUID'),
  body('images')
    .optional()
    .isArray()
    .withMessage('Images must be an array'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('weight')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Weight must be a positive number'),
  body('dimensions')
    .optional()
    .isObject()
    .withMessage('Dimensions must be an object with length, width, height')
];

export const validateProductUpdate = [
  param('id')
    .isUUID()
    .withMessage('Product ID must be a valid UUID'),
  ...validateProductCreate.map(validation => ({
    ...validation,
    optional: true
  }))
];

export const validateProductId = [
  param('id')
    .isUUID()
    .withMessage('Product ID must be a valid UUID')
];

// Cart validation schemas
export const validateCartItemAdd = [
  body('productId')
    .isUUID()
    .withMessage('Product ID must be a valid UUID'),
  body('quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer')
];

export const validateCartItemUpdate = [
  param('id')
    .isUUID()
    .withMessage('Cart item ID must be a valid UUID'),
  body('quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer')
];

export const validateCartItemId = [
  param('id')
    .isUUID()
    .withMessage('Cart item ID must be a valid UUID')
];

// Order validation schemas
export const validateOrderCreate = [
  body('items')
    .isArray({ min: 1 })
    .withMessage('Order must contain at least one item'),
  body('items.*.productId')
    .isUUID()
    .withMessage('Product ID must be a valid UUID'),
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),
  body('shippingAddress')
    .isObject()
    .withMessage('Shipping address is required'),
  body('shippingAddress.firstName')
    .isLength({ min: 2 })
    .withMessage('First name is required'),
  body('shippingAddress.lastName')
    .isLength({ min: 2 })
    .withMessage('Last name is required'),
  body('shippingAddress.address1')
    .isLength({ min: 5 })
    .withMessage('Address is required'),
  body('shippingAddress.city')
    .isLength({ min: 2 })
    .withMessage('City is required'),
  body('shippingAddress.postalCode')
    .isLength({ min: 3 })
    .withMessage('Postal code is required'),
  body('shippingAddress.country')
    .isLength({ min: 2 })
    .withMessage('Country is required'),
  body('billingAddress')
    .optional()
    .isObject()
    .withMessage('Billing address must be an object'),
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters')
];

// Address validation schemas
export const validateAddressCreate = [
  body('type')
    .isIn(['SHIPPING', 'BILLING'])
    .withMessage('Address type must be SHIPPING or BILLING'),
  body('firstName')
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('company')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Company name must not exceed 100 characters'),
  body('address1')
    .isLength({ min: 5, max: 200 })
    .withMessage('Address must be between 5 and 200 characters'),
  body('address2')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Address line 2 must not exceed 200 characters'),
  body('city')
    .isLength({ min: 2, max: 100 })
    .withMessage('City must be between 2 and 100 characters'),
  body('province')
    .isLength({ min: 2, max: 100 })
    .withMessage('Province must be between 2 and 100 characters'),
  body('country')
    .isLength({ min: 2, max: 100 })
    .withMessage('Country must be between 2 and 100 characters'),
  body('postalCode')
    .isLength({ min: 3, max: 20 })
    .withMessage('Postal code must be between 3 and 20 characters'),
  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Please provide a valid phone number'),
  body('isDefault')
    .optional()
    .isBoolean()
    .withMessage('isDefault must be a boolean')
];

// Payment validation schemas
export const validatePaymentIntent = [
  body('orderId')
    .isUUID()
    .withMessage('Order ID must be a valid UUID'),
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be a positive number'),
  body('currency')
    .optional()
    .isLength({ min: 3, max: 3 })
    .withMessage('Currency must be a 3-character code')
];

// Query validation schemas
export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('sort')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort must be asc or desc'),
  query('sortBy')
    .optional()
    .isString()
    .withMessage('Sort by must be a string')
];

export const validateProductSearch = [
  ...validatePagination,
  query('q')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters'),
  query('category')
    .optional()
    .isUUID()
    .withMessage('Category ID must be a valid UUID'),
  query('minPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum price must be a positive number'),
  query('maxPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum price must be a positive number'),
  query('featured')
    .optional()
    .isBoolean()
    .withMessage('Featured must be a boolean')
];
