import { Router } from 'express';
import { ProductController } from '../controllers/productController';
import { validatePagination, validateProductId, validateProductSearch } from '../utils/validators';

const router = Router();

// GET /api/products - Get all products with pagination and filtering
router.get('/', 
  validatePagination,
  ProductController.getProducts
);

// GET /api/products/featured - Get featured products
router.get('/featured', 
  ProductController.getFeaturedProducts
);

// GET /api/products/search - Search products
router.get('/search',
  validateProductSearch,
  ProductController.searchProducts
);

// GET /api/products/categories - Get all categories
router.get('/categories',
  ProductController.getCategories
);

// GET /api/products/category/:slug - Get products by category slug
router.get('/category/:slug',
  validatePagination,
  ProductController.getProductsByCategory
);

// GET /api/products/:id - Get single product by ID
router.get('/:id',
  validateProductId,
  ProductController.getProductById
);

// GET /api/products/related/:id - Get related products
router.get('/related/:id',
  validateProductId,
  ProductController.getRelatedProducts
);

export default router;
