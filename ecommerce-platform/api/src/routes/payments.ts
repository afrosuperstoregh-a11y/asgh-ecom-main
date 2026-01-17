import { Router } from 'express';
import { PaymentController } from '../controllers/paymentController';
import { validatePaymentIntent } from '../utils/validators';
import { authenticate } from '../middleware/auth';

const router = Router();

// POST /api/payments/intent - Create payment intent
router.post('/intent',
  authenticate,
  validatePaymentIntent,
  PaymentController.createPaymentIntent
);

// POST /api/payments/confirm - Confirm payment (Stripe webhook)
router.post('/confirm',
  PaymentController.confirmPayment
);

// GET /api/payments/:orderId - Get payment status for an order
router.get('/:orderId',
  authenticate,
  PaymentController.getPaymentStatus
);

// POST /api/payments/refund - Create refund
router.post('/refund',
  authenticate,
  PaymentController.createRefund
);

export default router;
