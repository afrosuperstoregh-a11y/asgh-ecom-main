import { Router } from 'express'
import categoryController from '../controllers/categoryController'
import { authenticateToken, requireAdmin } from '../middleware/auth'
import { 
  validateCategoryCreate, 
  validateCategoryUpdate,
  sanitizeBody 
} from '../middleware/validation'
import { 
  auditCategoryCreate, 
  auditCategoryUpdate, 
  auditCategoryDelete 
} from '../middleware/auditLog'
import { rateLimiters } from '../middleware/rateLimiter'

const router = Router()

// Apply rate limiting to all category routes
router.use(rateLimiters.categories)

// Apply sanitization to all routes
router.use(sanitizeBody)

// Public routes (with caching)
router.get('/', 
  categoryController.getCategories
)

router.get('/tree/all', 
  categoryController.getCategoryTree
)

router.get('/:id', 
  categoryController.getCategoryById
)

router.get('/slug/:slug', 
  categoryController.getCategoryBySlug
)

// Admin routes (require authentication + admin role)
router.use(authenticateToken, requireAdmin)

// Create category
router.post('/', 
  validateCategoryCreate,
  auditCategoryCreate,
  categoryController.createCategory
)

// Update category
router.put('/:id', 
  validateCategoryUpdate,
  auditCategoryUpdate,
  categoryController.updateCategory
)

// Delete category
router.delete('/:id', 
  auditCategoryDelete,
  categoryController.deleteCategory
)

// Get all categories (admin view - includes inactive)
router.get('/admin/all', 
  categoryController.getAllCategories
)

export default router
