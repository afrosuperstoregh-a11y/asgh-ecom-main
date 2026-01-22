"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderController = void 0;
const database_1 = require("../config/database");
const redis_1 = require("../config/redis");
const response_1 = require("../utils/response");
const ApiError_1 = require("../utils/ApiError");
const asyncHandler_1 = require("../utils/asyncHandler");
const enums_1 = require("../types/enums");
class OrderController {
    // Helper method to generate order number
    static generateOrderNumber() {
        const timestamp = Date.now().toString();
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `ORD-${timestamp}-${random}`;
    }
    // Helper method to calculate order totals
    static calculateOrderTotals(items) {
        const subtotal = items.reduce((sum, item) => {
            return sum + (Number(item.price) * item.quantity);
        }, 0);
        // For MVP, we'll use simple tax calculation (10%) and flat shipping ($10)
        const taxAmount = subtotal * 0.1;
        const shippingAmount = subtotal > 0 ? 10 : 0;
        const total = subtotal + taxAmount + shippingAmount;
        return {
            subtotal,
            taxAmount,
            shippingAmount,
            discountAmount: 0,
            total
        };
    }
}
exports.OrderController = OrderController;
_a = OrderController;
// POST /api/checkout - Create order from cart
OrderController.createOrder = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId;
    const sessionId = req.headers['x-session-id'];
    const { items, shippingAddress, billingAddress, notes, guestEmail } = req.body;
    // Validate items
    if (!items || items.length === 0) {
        throw ApiError_1.ApiError.badRequest('Order must contain at least one item');
    }
    // Get product details and validate stock
    const productIds = items.map((item) => item.productId);
    const products = await database_1.db.product.findMany({
        where: {
            id: { in: productIds },
            status: 'ACTIVE'
        }
    });
    if (products.length !== productIds.length) {
        throw ApiError_1.ApiError.badRequest('One or more products are not available');
    }
    // Check stock availability
    for (const item of items) {
        const product = products.find((p) => p.id === item.productId);
        if (product?.trackInventory && product.stock < item.quantity) {
            throw ApiError_1.ApiError.badRequest(`Insufficient stock for product: ${product.name}`);
        }
    }
    // Calculate totals
    const totals = _a.calculateOrderTotals(items);
    // Create order
    const order = await database_1.db.order.create({
        data: {
            orderNumber: _a.generateOrderNumber(),
            userId,
            guestEmail: guestEmail || null,
            status: enums_1.OrderStatus.PENDING,
            currency: 'USD',
            ...totals,
            notes,
            shippingAddress,
            billingAddress: billingAddress || shippingAddress,
            paymentStatus: enums_1.PaymentStatus.PENDING
        },
        include: {
            items: true
        }
    });
    // Create order items
    const orderItems = await Promise.all(items.map(async (item) => {
        const product = products.find((p) => p.id === item.productId);
        if (!product) {
            throw new Error(`Product with ID ${item.productId} not found`);
        }
        const orderItem = await database_1.db.orderItem.create({
            data: {
                orderId: order.id,
                productId: item.productId,
                productName: product.name,
                productSku: product.sku,
                quantity: item.quantity,
                price: product.price,
                total: Number(product.price) * item.quantity
            }
        });
        // Update product stock
        if (product.trackInventory) {
            await database_1.db.product.update({
                where: { id: item.productId },
                data: {
                    stock: product.stock - item.quantity
                }
            });
        }
        return orderItem;
    }));
    // Clear cart if user is logged in
    if (userId) {
        const cart = await database_1.db.cart.findFirst({
            where: {
                userId,
                status: enums_1.CartStatus.ACTIVE
            }
        });
        if (cart) {
            await database_1.db.cartItem.deleteMany({
                where: { cartId: cart.id }
            });
            await database_1.db.cart.update({
                where: { id: cart.id },
                data: { status: enums_1.CartStatus.CONVERTED }
            });
            // Invalidate cart cache
            await redis_1.redisClient.invalidateCart(userId, sessionId);
        }
    }
    // Return complete order with items
    const completeOrder = await database_1.db.order.findUnique({
        where: { id: order.id },
        include: {
            items: {
                include: {
                    product: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                            images: true
                        }
                    }
                }
            }
        }
    });
    return response_1.ApiResponseUtil.created(res, completeOrder, 'Order created successfully');
});
// GET /api/orders - Get user's orders
OrderController.getOrders = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId;
    const { page = '1', limit = '20', status } = req.query;
    if (!userId) {
        throw ApiError_1.ApiError.unauthorized('Authentication required');
    }
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    // Build where clause
    const where = { userId };
    if (status) {
        where.status = status;
    }
    // Get total count
    const total = await database_1.db.order.count({ where });
    // Get orders
    const orders = await database_1.db.order.findMany({
        where,
        include: {
            items: {
                select: {
                    id: true,
                    productName: true,
                    productSku: true,
                    quantity: true,
                    price: true,
                    total: true
                }
            }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
    });
    const pagination = (0, response_1.createPaginationMetadata)(pageNum, limitNum, total);
    return response_1.ApiResponseUtil.paginated(res, orders, pagination);
});
// GET /api/orders/:id - Get single order by ID
OrderController.getOrderById = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId;
    const { id } = req.params;
    const order = await database_1.db.order.findUnique({
        where: { id },
        include: {
            items: {
                include: {
                    product: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                            images: true
                        }
                    }
                }
            }
        }
    });
    if (!order) {
        throw ApiError_1.ApiError.notFound('Order not found');
    }
    // Check ownership
    if (userId && order.userId !== userId) {
        throw ApiError_1.ApiError.forbidden('Access denied');
    }
    return response_1.ApiResponseUtil.success(res, order);
});
// PUT /api/orders/:id/cancel - Cancel order
OrderController.cancelOrder = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId;
    const { id } = req.params;
    const order = await database_1.db.order.findUnique({
        where: { id },
        include: {
            items: true
        }
    });
    if (!order) {
        throw ApiError_1.ApiError.notFound('Order not found');
    }
    // Check ownership
    if (userId && order.userId !== userId) {
        throw ApiError_1.ApiError.forbidden('Access denied');
    }
    // Check if order can be cancelled
    if (order.status !== enums_1.OrderStatus.PENDING && order.status !== enums_1.OrderStatus.CONFIRMED) {
        throw ApiError_1.ApiError.badRequest('Order cannot be cancelled at this stage');
    }
    // Restore product stock
    for (const item of order.items) {
        const product = await database_1.db.product.findUnique({
            where: { id: item.productId }
        });
        if (product && product.trackInventory) {
            await database_1.db.product.update({
                where: { id: item.productId },
                data: {
                    stock: product.stock + item.quantity
                }
            });
        }
    }
    // Update order status
    const updatedOrder = await database_1.db.order.update({
        where: { id },
        data: {
            status: enums_1.OrderStatus.CANCELLED,
            paymentStatus: enums_1.PaymentStatus.CANCELLED
        }
    });
    return response_1.ApiResponseUtil.success(res, updatedOrder, 'Order cancelled successfully');
});
// GET /api/orders/:id/tracking - Get order tracking info
OrderController.getOrderTracking = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId;
    const { id } = req.params;
    const order = await database_1.db.order.findUnique({
        where: { id },
        select: {
            id: true,
            orderNumber: true,
            status: true,
            trackingNumber: true,
            shippedAt: true,
            deliveredAt: true,
            userId: true
        }
    });
    if (!order) {
        throw ApiError_1.ApiError.notFound('Order not found');
    }
    // Check ownership
    if (userId && order.userId !== userId) {
        throw ApiError_1.ApiError.forbidden('Access denied');
    }
    const trackingInfo = {
        orderNumber: order.orderNumber,
        status: order.status,
        trackingNumber: order.trackingNumber,
        shippedAt: order.shippedAt,
        deliveredAt: order.deliveredAt,
        estimatedDelivery: order.shippedAt ?
            new Date(order.shippedAt.getTime() + 5 * 24 * 60 * 60 * 1000) : null // 5 days from shipping
    };
    return response_1.ApiResponseUtil.success(res, trackingInfo);
});
