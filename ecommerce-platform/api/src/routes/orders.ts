import { Router } from 'express';
import { OrderController } from '../controllers/orderController';
import { validateOrderCreate } from '../utils/validators';
import { authenticate, optionalAuth } from '../middleware/auth';

const router = Router();

// POST /api/checkout - Create order from cart (optional auth for guest checkout)
router.post('/checkout',
  optionalAuth,
  validateOrderCreate,
  OrderController.createOrder
);

// GET /api/orders - Get user's orders (requires auth)
router.get('/',
  authenticate,
  OrderController.getOrders
);

// GET /api/orders/:id - Get single order by ID (requires auth)
router.get('/:id',
  authenticate,
  OrderController.getOrderById
);

// PUT /api/orders/:id/cancel - Cancel order (requires auth)
router.put('/:id/cancel',
  authenticate,
  OrderController.cancelOrder
);

// GET /api/orders/:id/tracking - Get order tracking info (requires auth)
router.get('/:id/tracking',
  authenticate,
  OrderController.getOrderTracking
);

export default router;
