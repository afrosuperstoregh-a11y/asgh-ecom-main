const express = require('express');
const productController = require('../controllers/productController');
const { verifySupabaseUser, requireAdminUser } = require('../middleware/supabaseAuth');
const { validateProduct, validateProductUpdate } = require('../middleware/validation');
const { cacheConfigs, invalidateCache } = require('../middleware/cache');
const { ApiResponse, asyncHandler } = require('../middleware/apiResponse');

const router = express.Router();

// Public routes (cache disabled temporarily)
router.get('/', productController.getProducts);
router.get('/categories', productController.getCategories);
router.get('/:id', productController.getProductById);

// Admin only routes (cache invalidation disabled temporarily)
router.post('/', 
  verifySupabaseUser, 
  requireAdminUser, 
  validateProduct, 
  asyncHandler(productController.createProduct)
);

router.put('/:id', 
  verifySupabaseUser, 
  requireAdminUser, 
  validateProductUpdate, 
  asyncHandler(productController.updateProduct)
);

router.delete('/:id', 
  verifySupabaseUser, 
  requireAdminUser, 
  asyncHandler(productController.deleteProduct)
);

router.post('/:id/stock', 
  verifySupabaseUser, 
  requireAdminUser, 
  asyncHandler(productController.updateStock)
);

module.exports = router;
