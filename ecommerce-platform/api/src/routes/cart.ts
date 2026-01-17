import { Router } from 'express';
import { CartController } from '../controllers/cartController';
import { validateCartItemAdd, validateCartItemUpdate, validateCartItemId } from '../utils/validators';
import { authenticate, optionalAuth } from '../middleware/auth';

const router = Router();

// GET /api/cart - Get current cart (optional auth - works for guests too)
router.get('/', 
  optionalAuth,
  CartController.getCart
);

// POST /api/cart/items - Add item to cart (optional auth)
router.post('/items',
  optionalAuth,
  validateCartItemAdd,
  CartController.addToCart
);

// PUT /api/cart/items/:id - Update cart item quantity (optional auth)
router.put('/items/:id',
  optionalAuth,
  validateCartItemUpdate,
  CartController.updateCartItem
);

// DELETE /api/cart/items/:id - Remove item from cart (optional auth)
router.delete('/items/:id',
  optionalAuth,
  validateCartItemId,
  CartController.removeFromCart
);

// DELETE /api/cart - Clear entire cart (optional auth)
router.delete('/',
  optionalAuth,
  CartController.clearCart
);

// POST /api/cart/merge - Merge guest cart with user cart (requires auth)
router.post('/merge',
  authenticate,
  CartController.mergeCart
);

export default router;
