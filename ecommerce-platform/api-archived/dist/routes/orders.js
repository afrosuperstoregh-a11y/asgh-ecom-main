"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const orderController_1 = require("../controllers/orderController");
const validators_1 = require("../utils/validators");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// POST /api/checkout - Create order from cart (optional auth for guest checkout)
router.post('/checkout', auth_1.optionalAuth, validators_1.validateOrderCreate, orderController_1.OrderController.createOrder);
// GET /api/orders - Get user's orders (requires auth)
router.get('/', auth_1.authenticate, orderController_1.OrderController.getOrders);
// GET /api/orders/:id - Get single order by ID (requires auth)
router.get('/:id', auth_1.authenticate, orderController_1.OrderController.getOrderById);
// PUT /api/orders/:id/cancel - Cancel order (requires auth)
router.put('/:id/cancel', auth_1.authenticate, orderController_1.OrderController.cancelOrder);
// GET /api/orders/:id/tracking - Get order tracking info (requires auth)
router.get('/:id/tracking', auth_1.authenticate, orderController_1.OrderController.getOrderTracking);
exports.default = router;
