import { Router } from 'express'
import productController from '../controllers/productController'
import { authenticateToken, requireAdmin } from '../middleware/auth'
import { 
  validateProductCreate, 
  validateProductUpdate, 
  validateStockUpdate, 
  validateProductQuery,
  sanitizeBody 
} from '../middleware/validation'
import { 
  auditProductCreate, 
  auditProductUpdate, 
  auditProductDelete, 
  auditStockUpdate 
} from '../middleware/auditLog'
import { rateLimiters } from '../middleware/rateLimiter'
import { asyncHandler } from '../middleware/errorHandler'

const router = Router()

// Apply sanitization to all routes
router.use(sanitizeBody)

// Public routes (with caching)
router.get('/', 
  validateProductQuery, 
  productController.getProducts
)

router.get('/categories', 
  productController.getCategories
)

router.get('/:id', 
  productController.getProductById
)

router.get('/slug/:slug', 
  productController.getProductBySlug
)

// Admin routes (require authentication + admin role)
router.use(authenticateToken, requireAdmin)

// Bulk update products (admin only)
router.patch('/bulk-activate', 
  auditProductUpdate,
  productController.bulkActivateProducts
)

// Create product
router.post('/', 
  validateProductCreate,
  auditProductCreate,
  productController.createProduct
)

// Update product
router.put('/:id', 
  validateProductUpdate,
  auditProductUpdate,
  productController.updateProduct
)

// Delete product
router.delete('/:id', 
  auditProductDelete,
  productController.deleteProduct
)

// Update stock
router.post('/:id/stock', 
  validateStockUpdate,
  auditStockUpdate,
  productController.updateStock
)

export default router
