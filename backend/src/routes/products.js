const express = require('express');
const productController = require('../controllers/productController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validateProduct, validateProductUpdate } = require('../middleware/validation');
const { cacheConfigs, invalidateCache } = require('../middleware/cache');

const router = express.Router();

// Public routes (cache disabled temporarily)
router.get('/', productController.getProducts);
router.get('/categories', productController.getCategories);
router.get('/:id', productController.getProductById);

// Admin only routes (cache invalidation disabled temporarily)
router.post('/', 
  authenticateToken, 
  requireAdmin, 
  validateProduct, 
  productController.createProduct
);

router.put('/:id', 
  authenticateToken, 
  requireAdmin, 
  validateProductUpdate, 
  productController.updateProduct
);

router.delete('/:id', 
  authenticateToken, 
  requireAdmin, 
  productController.deleteProduct
);

router.post('/:id/stock', 
  authenticateToken, 
  requireAdmin, 
  productController.updateStock
);

module.exports = router;
