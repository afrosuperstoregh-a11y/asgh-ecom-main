"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cartController_1 = require("../controllers/cartController");
const validators_1 = require("../utils/validators");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// GET /api/cart - Get current cart (optional auth - works for guests too)
router.get('/', auth_1.optionalAuth, cartController_1.CartController.getCart);
// POST /api/cart/items - Add item to cart (optional auth)
router.post('/items', auth_1.optionalAuth, validators_1.validateCartItemAdd, cartController_1.CartController.addToCart);
// PUT /api/cart/items/:id - Update cart item quantity (optional auth)
router.put('/items/:id', auth_1.optionalAuth, validators_1.validateCartItemUpdate, cartController_1.CartController.updateCartItem);
// DELETE /api/cart/items/:id - Remove item from cart (optional auth)
router.delete('/items/:id', auth_1.optionalAuth, validators_1.validateCartItemId, cartController_1.CartController.removeFromCart);
// DELETE /api/cart - Clear entire cart (optional auth)
router.delete('/', auth_1.optionalAuth, cartController_1.CartController.clearCart);
// POST /api/cart/merge - Merge guest cart with user cart (requires auth)
router.post('/merge', auth_1.authenticate, cartController_1.CartController.mergeCart);
exports.default = router;
