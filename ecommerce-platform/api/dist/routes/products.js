"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const productController_1 = require("../controllers/productController");
const validators_1 = require("../utils/validators");
const router = (0, express_1.Router)();
// GET /api/products - Get all products with pagination and filtering
router.get('/', validators_1.validatePagination, productController_1.ProductController.getProducts);
// GET /api/products/featured - Get featured products
router.get('/featured', productController_1.ProductController.getFeaturedProducts);
// GET /api/products/search - Search products
router.get('/search', validators_1.validateProductSearch, productController_1.ProductController.searchProducts);
// GET /api/products/categories - Get all categories
router.get('/categories', productController_1.ProductController.getCategories);
// GET /api/products/category/:slug - Get products by category slug
router.get('/category/:slug', validators_1.validatePagination, productController_1.ProductController.getProductsByCategory);
// GET /api/products/:id - Get single product by ID
router.get('/:id', validators_1.validateProductId, productController_1.ProductController.getProductById);
// GET /api/products/related/:id - Get related products
router.get('/related/:id', validators_1.validateProductId, productController_1.ProductController.getRelatedProducts);
exports.default = router;
