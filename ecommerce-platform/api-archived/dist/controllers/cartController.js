"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CartController = void 0;
const database_1 = require("../config/database");
const redis_1 = require("../config/redis");
const response_1 = require("../utils/response");
const ApiError_1 = require("../utils/ApiError");
const asyncHandler_1 = require("../utils/asyncHandler");
const enums_1 = require("../types/enums");
const security_1 = require("../utils/security");
class CartController {
    // Helper method to get or create cart
    static async getOrCreateCart(userId, sessionId) {
        let cart;
        if (userId) {
            // Try to find existing cart for user
            cart = await database_1.db.cart.findFirst({
                where: {
                    userId,
                    status: enums_1.CartStatus.ACTIVE
                },
                include: {
                    items: {
                        include: {
                            product: {
                                select: {
                                    id: true,
                                    name: true,
                                    slug: true,
                                    price: true,
                                    images: true,
                                    stock: true,
                                    trackInventory: true
                                }
                            }
                        }
                    }
                }
            });
        }
        else if (sessionId) {
            // Try to find existing cart for session
            cart = await database_1.db.cart.findFirst({
                where: {
                    sessionId,
                    status: enums_1.CartStatus.ACTIVE
                },
                include: {
                    items: {
                        include: {
                            product: {
                                select: {
                                    id: true,
                                    name: true,
                                    slug: true,
                                    price: true,
                                    images: true,
                                    stock: true,
                                    trackInventory: true
                                }
                            }
                        }
                    }
                }
            });
        }
        // Create new cart if not found
        if (!cart) {
            cart = await database_1.db.cart.create({
                data: {
                    userId,
                    sessionId,
                    status: enums_1.CartStatus.ACTIVE
                },
                include: {
                    items: {
                        include: {
                            product: {
                                select: {
                                    id: true,
                                    name: true,
                                    slug: true,
                                    price: true,
                                    images: true,
                                    stock: true,
                                    trackInventory: true
                                }
                            }
                        }
                    }
                }
            });
        }
        return cart;
    }
}
exports.CartController = CartController;
_a = CartController;
// GET /api/cart - Get current cart
CartController.getCart = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId;
    const sessionId = req.headers['x-session-id'] || security_1.SecurityUtils.generateSessionId();
    const cart = await _a.getOrCreateCart(userId, sessionId);
    // Calculate totals
    const subtotal = cart.items.reduce((sum, item) => {
        return sum + (Number(item.price) * item.quantity);
    }, 0);
    const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    const cartResponse = {
        id: cart.id,
        items: cart.items.map((item) => ({
            id: item.id,
            product: item.product,
            quantity: item.quantity,
            price: item.price,
            total: Number(item.price) * item.quantity,
            inStock: !item.product.trackInventory || item.product.stock >= item.quantity
        })),
        subtotal,
        totalItems,
        createdAt: cart.createdAt,
        updatedAt: cart.updatedAt
    };
    // Cache cart data
    await redis_1.redisClient.cacheCart(userId, sessionId, cartResponse);
    return response_1.ApiResponseUtil.success(res, cartResponse);
});
// POST /api/cart/items - Add item to cart
CartController.addToCart = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId;
    const sessionId = req.headers['x-session-id'] || security_1.SecurityUtils.generateSessionId();
    const { productId, quantity } = req.body;
    // Validate product exists and is active
    const product = await database_1.db.product.findUnique({
        where: {
            id: productId,
            status: 'ACTIVE'
        }
    });
    if (!product) {
        throw ApiError_1.ApiError.notFound('Product not found');
    }
    // Check inventory
    if (product.trackInventory && product.stock < quantity) {
        throw ApiError_1.ApiError.badRequest('Insufficient stock');
    }
    const cart = await _a.getOrCreateCart(userId, sessionId);
    // Check if item already exists in cart
    const existingItem = await database_1.db.cartItem.findUnique({
        where: {
            cartId_productId: {
                cartId: cart.id,
                productId
            }
        }
    });
    let cartItem;
    if (existingItem) {
        // Update existing item
        const newQuantity = existingItem.quantity + quantity;
        if (product.trackInventory && product.stock < newQuantity) {
            throw ApiError_1.ApiError.badRequest('Insufficient stock for requested quantity');
        }
        cartItem = await database_1.db.cartItem.update({
            where: { id: existingItem.id },
            data: { quantity: newQuantity }
        });
    }
    else {
        // Create new cart item
        cartItem = await database_1.db.cartItem.create({
            data: {
                cartId: cart.id,
                productId,
                quantity,
                price: product.price
            }
        });
    }
    // Invalidate cart cache
    await redis_1.redisClient.invalidateCart(userId, sessionId);
    return response_1.ApiResponseUtil.created(res, cartItem, 'Item added to cart successfully');
});
// PUT /api/cart/items/:id - Update cart item quantity
CartController.updateCartItem = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId;
    const sessionId = req.headers['x-session-id'];
    const { id } = req.params;
    const { quantity } = req.body;
    // Get cart item with product info
    const cartItem = await database_1.db.cartItem.findUnique({
        where: { id },
        include: {
            cart: true,
            product: true
        }
    });
    if (!cartItem) {
        throw ApiError_1.ApiError.notFound('Cart item not found');
    }
    // Verify ownership (user cart or session cart)
    if (userId && cartItem.cart.userId !== userId) {
        throw ApiError_1.ApiError.forbidden('Access denied');
    }
    if (!userId && cartItem.cart.sessionId !== sessionId) {
        throw ApiError_1.ApiError.forbidden('Access denied');
    }
    // Check inventory
    if (cartItem.product.trackInventory && cartItem.product.stock < quantity) {
        throw ApiError_1.ApiError.badRequest('Insufficient stock');
    }
    // Update quantity
    const updatedItem = await database_1.db.cartItem.update({
        where: { id },
        data: { quantity }
    });
    // Invalidate cart cache
    await redis_1.redisClient.invalidateCart(userId, sessionId);
    return response_1.ApiResponseUtil.success(res, updatedItem, 'Cart item updated successfully');
});
// DELETE /api/cart/items/:id - Remove item from cart
CartController.removeFromCart = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId;
    const sessionId = req.headers['x-session-id'];
    const { id } = req.params;
    // Get cart item with cart info
    const cartItem = await database_1.db.cartItem.findUnique({
        where: { id },
        include: { cart: true }
    });
    if (!cartItem) {
        throw ApiError_1.ApiError.notFound('Cart item not found');
    }
    // Verify ownership
    if (userId && cartItem.cart.userId !== userId) {
        throw ApiError_1.ApiError.forbidden('Access denied');
    }
    if (!userId && cartItem.cart.sessionId !== sessionId) {
        throw ApiError_1.ApiError.forbidden('Access denied');
    }
    // Delete cart item
    await database_1.db.cartItem.delete({
        where: { id }
    });
    // Invalidate cart cache
    await redis_1.redisClient.invalidateCart(userId, sessionId);
    return response_1.ApiResponseUtil.success(res, null, 'Item removed from cart successfully');
});
// DELETE /api/cart - Clear entire cart
CartController.clearCart = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId;
    const sessionId = req.headers['x-session-id'];
    const cart = await _a.getOrCreateCart(userId, sessionId);
    // Delete all items in cart
    await database_1.db.cartItem.deleteMany({
        where: { cartId: cart.id }
    });
    // Invalidate cart cache
    await redis_1.redisClient.invalidateCart(userId, sessionId);
    return response_1.ApiResponseUtil.success(res, null, 'Cart cleared successfully');
});
// POST /api/cart/merge - Merge guest cart with user cart (after login)
CartController.mergeCart = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.userId;
    const { sessionId } = req.body;
    if (!sessionId) {
        throw ApiError_1.ApiError.badRequest('Session ID is required');
    }
    // Get guest cart
    const guestCart = await database_1.db.cart.findFirst({
        where: {
            sessionId,
            status: enums_1.CartStatus.ACTIVE
        },
        include: {
            items: true
        }
    });
    if (!guestCart) {
        throw ApiError_1.ApiError.notFound('Guest cart not found');
    }
    // Get or create user cart
    const userCart = await _a.getOrCreateCart(userId);
    // Merge items
    for (const guestItem of guestCart.items) {
        const existingUserItem = await database_1.db.cartItem.findUnique({
            where: {
                cartId_productId: {
                    cartId: userCart.id,
                    productId: guestItem.productId
                }
            }
        });
        if (existingUserItem) {
            // Update existing item quantity
            await database_1.db.cartItem.update({
                where: { id: existingUserItem.id },
                data: {
                    quantity: existingUserItem.quantity + guestItem.quantity
                }
            });
        }
        else {
            // Move item to user cart
            await database_1.db.cartItem.update({
                where: { id: guestItem.id },
                data: {
                    cartId: userCart.id
                }
            });
        }
    }
    // Mark guest cart as converted
    await database_1.db.cart.update({
        where: { id: guestCart.id },
        data: { status: enums_1.CartStatus.CONVERTED }
    });
    // Invalidate caches
    await redis_1.redisClient.invalidateCart(userId, sessionId);
    return response_1.ApiResponseUtil.success(res, null, 'Cart merged successfully');
});
