"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateProductSearch = exports.validatePagination = exports.validatePaymentIntent = exports.validateAddressCreate = exports.validateOrderCreate = exports.validateCartItemId = exports.validateCartItemUpdate = exports.validateCartItemAdd = exports.validateProductId = exports.validateProductUpdate = exports.validateProductCreate = exports.validateUserLogin = exports.validateUserRegistration = void 0;
const express_validator_1 = require("express-validator");
// User validation schemas
exports.validateUserRegistration = [
    (0, express_validator_1.body)('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),
    (0, express_validator_1.body)('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    (0, express_validator_1.body)('name')
        .optional()
        .isLength({ min: 2, max: 50 })
        .withMessage('Name must be between 2 and 50 characters'),
    (0, express_validator_1.body)('phone')
        .optional()
        .isMobilePhone('any')
        .withMessage('Please provide a valid phone number')
];
exports.validateUserLogin = [
    (0, express_validator_1.body)('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),
    (0, express_validator_1.body)('password')
        .notEmpty()
        .withMessage('Password is required')
];
// Product validation schemas
exports.validateProductCreate = [
    (0, express_validator_1.body)('name')
        .isLength({ min: 2, max: 200 })
        .withMessage('Product name must be between 2 and 200 characters'),
    (0, express_validator_1.body)('description')
        .optional()
        .isLength({ max: 2000 })
        .withMessage('Description must not exceed 2000 characters'),
    (0, express_validator_1.body)('shortDesc')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Short description must not exceed 500 characters'),
    (0, express_validator_1.body)('sku')
        .isLength({ min: 2, max: 50 })
        .withMessage('SKU must be between 2 and 50 characters'),
    (0, express_validator_1.body)('price')
        .isFloat({ min: 0 })
        .withMessage('Price must be a positive number'),
    (0, express_validator_1.body)('comparePrice')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Compare price must be a positive number'),
    (0, express_validator_1.body)('cost')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Cost must be a positive number'),
    (0, express_validator_1.body)('stock')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Stock must be a non-negative integer'),
    (0, express_validator_1.body)('categoryId')
        .isUUID()
        .withMessage('Category ID must be a valid UUID'),
    (0, express_validator_1.body)('images')
        .optional()
        .isArray()
        .withMessage('Images must be an array'),
    (0, express_validator_1.body)('tags')
        .optional()
        .isArray()
        .withMessage('Tags must be an array'),
    (0, express_validator_1.body)('weight')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Weight must be a positive number'),
    (0, express_validator_1.body)('dimensions')
        .optional()
        .isObject()
        .withMessage('Dimensions must be an object with length, width, height')
];
exports.validateProductUpdate = [
    (0, express_validator_1.param)('id')
        .isUUID()
        .withMessage('Product ID must be a valid UUID'),
    ...exports.validateProductCreate.map(validation => ({
        ...validation,
        optional: true
    }))
];
exports.validateProductId = [
    (0, express_validator_1.param)('id')
        .isUUID()
        .withMessage('Product ID must be a valid UUID')
];
// Cart validation schemas
exports.validateCartItemAdd = [
    (0, express_validator_1.body)('productId')
        .isUUID()
        .withMessage('Product ID must be a valid UUID'),
    (0, express_validator_1.body)('quantity')
        .isInt({ min: 1 })
        .withMessage('Quantity must be a positive integer')
];
exports.validateCartItemUpdate = [
    (0, express_validator_1.param)('id')
        .isUUID()
        .withMessage('Cart item ID must be a valid UUID'),
    (0, express_validator_1.body)('quantity')
        .isInt({ min: 1 })
        .withMessage('Quantity must be a positive integer')
];
exports.validateCartItemId = [
    (0, express_validator_1.param)('id')
        .isUUID()
        .withMessage('Cart item ID must be a valid UUID')
];
// Order validation schemas
exports.validateOrderCreate = [
    (0, express_validator_1.body)('items')
        .isArray({ min: 1 })
        .withMessage('Order must contain at least one item'),
    (0, express_validator_1.body)('items.*.productId')
        .isUUID()
        .withMessage('Product ID must be a valid UUID'),
    (0, express_validator_1.body)('items.*.quantity')
        .isInt({ min: 1 })
        .withMessage('Quantity must be a positive integer'),
    (0, express_validator_1.body)('shippingAddress')
        .isObject()
        .withMessage('Shipping address is required'),
    (0, express_validator_1.body)('shippingAddress.firstName')
        .isLength({ min: 2 })
        .withMessage('First name is required'),
    (0, express_validator_1.body)('shippingAddress.lastName')
        .isLength({ min: 2 })
        .withMessage('Last name is required'),
    (0, express_validator_1.body)('shippingAddress.address1')
        .isLength({ min: 5 })
        .withMessage('Address is required'),
    (0, express_validator_1.body)('shippingAddress.city')
        .isLength({ min: 2 })
        .withMessage('City is required'),
    (0, express_validator_1.body)('shippingAddress.postalCode')
        .isLength({ min: 3 })
        .withMessage('Postal code is required'),
    (0, express_validator_1.body)('shippingAddress.country')
        .isLength({ min: 2 })
        .withMessage('Country is required'),
    (0, express_validator_1.body)('billingAddress')
        .optional()
        .isObject()
        .withMessage('Billing address must be an object'),
    (0, express_validator_1.body)('notes')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Notes must not exceed 500 characters')
];
// Address validation schemas
exports.validateAddressCreate = [
    (0, express_validator_1.body)('type')
        .isIn(['SHIPPING', 'BILLING'])
        .withMessage('Address type must be SHIPPING or BILLING'),
    (0, express_validator_1.body)('firstName')
        .isLength({ min: 2, max: 50 })
        .withMessage('First name must be between 2 and 50 characters'),
    (0, express_validator_1.body)('lastName')
        .isLength({ min: 2, max: 50 })
        .withMessage('Last name must be between 2 and 50 characters'),
    (0, express_validator_1.body)('company')
        .optional()
        .isLength({ max: 100 })
        .withMessage('Company name must not exceed 100 characters'),
    (0, express_validator_1.body)('address1')
        .isLength({ min: 5, max: 200 })
        .withMessage('Address must be between 5 and 200 characters'),
    (0, express_validator_1.body)('address2')
        .optional()
        .isLength({ max: 200 })
        .withMessage('Address line 2 must not exceed 200 characters'),
    (0, express_validator_1.body)('city')
        .isLength({ min: 2, max: 100 })
        .withMessage('City must be between 2 and 100 characters'),
    (0, express_validator_1.body)('province')
        .isLength({ min: 2, max: 100 })
        .withMessage('Province must be between 2 and 100 characters'),
    (0, express_validator_1.body)('country')
        .isLength({ min: 2, max: 100 })
        .withMessage('Country must be between 2 and 100 characters'),
    (0, express_validator_1.body)('postalCode')
        .isLength({ min: 3, max: 20 })
        .withMessage('Postal code must be between 3 and 20 characters'),
    (0, express_validator_1.body)('phone')
        .optional()
        .isMobilePhone('any')
        .withMessage('Please provide a valid phone number'),
    (0, express_validator_1.body)('isDefault')
        .optional()
        .isBoolean()
        .withMessage('isDefault must be a boolean')
];
// Payment validation schemas
exports.validatePaymentIntent = [
    (0, express_validator_1.body)('orderId')
        .isUUID()
        .withMessage('Order ID must be a valid UUID'),
    (0, express_validator_1.body)('amount')
        .isFloat({ min: 0.01 })
        .withMessage('Amount must be a positive number'),
    (0, express_validator_1.body)('currency')
        .optional()
        .isLength({ min: 3, max: 3 })
        .withMessage('Currency must be a 3-character code')
];
// Query validation schemas
exports.validatePagination = [
    (0, express_validator_1.query)('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    (0, express_validator_1.query)('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    (0, express_validator_1.query)('sort')
        .optional()
        .isIn(['asc', 'desc'])
        .withMessage('Sort must be asc or desc'),
    (0, express_validator_1.query)('sortBy')
        .optional()
        .isString()
        .withMessage('Sort by must be a string')
];
exports.validateProductSearch = [
    ...exports.validatePagination,
    (0, express_validator_1.query)('q')
        .optional()
        .isLength({ min: 1, max: 100 })
        .withMessage('Search query must be between 1 and 100 characters'),
    (0, express_validator_1.query)('category')
        .optional()
        .isUUID()
        .withMessage('Category ID must be a valid UUID'),
    (0, express_validator_1.query)('minPrice')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Minimum price must be a positive number'),
    (0, express_validator_1.query)('maxPrice')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Maximum price must be a positive number'),
    (0, express_validator_1.query)('featured')
        .optional()
        .isBoolean()
        .withMessage('Featured must be a boolean')
];
