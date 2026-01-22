"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const paymentController_1 = require("../controllers/paymentController");
const validators_1 = require("../utils/validators");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// POST /api/payments/intent - Create payment intent
router.post('/intent', auth_1.authenticate, validators_1.validatePaymentIntent, paymentController_1.PaymentController.createPaymentIntent);
// POST /api/payments/confirm - Confirm payment (Stripe webhook)
router.post('/confirm', paymentController_1.PaymentController.confirmPayment);
// GET /api/payments/:orderId - Get payment status for an order
router.get('/:orderId', auth_1.authenticate, paymentController_1.PaymentController.getPaymentStatus);
// POST /api/payments/refund - Create refund
router.post('/refund', auth_1.authenticate, paymentController_1.PaymentController.createRefund);
exports.default = router;
