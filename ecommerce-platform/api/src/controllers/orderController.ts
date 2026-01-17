import { Request, Response } from 'express';
import { db } from '../config/database';
import { redisClient } from '../config/redis';
import { ApiResponseUtil, createPaginationMetadata } from '../utils/response';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { OrderStatus, PaymentStatus, CartStatus } from '../types/enums';

export class OrderController {
  // Helper method to generate order number
  private static generateOrderNumber(): string {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `ORD-${timestamp}-${random}`;
  }

  // Helper method to calculate order totals
  private static calculateOrderTotals(items: any[]) {
    const subtotal = items.reduce((sum: number, item: any) => {
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

  // POST /api/checkout - Create order from cart
  static createOrder = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.userId;
    const sessionId = req.headers['x-session-id'] as string;
    const {
      items,
      shippingAddress,
      billingAddress,
      notes,
      guestEmail
    } = req.body;

    // Validate items
    if (!items || items.length === 0) {
      throw ApiError.badRequest('Order must contain at least one item');
    }

    // Get product details and validate stock
    const productIds = items.map((item: any) => item.productId);
    const products = await db.product.findMany({
      where: {
        id: { in: productIds },
        status: 'ACTIVE'
      }
    });

    if (products.length !== productIds.length) {
      throw ApiError.badRequest('One or more products are not available');
    }

    // Check stock availability
    for (const item of items) {
      const product = products.find((p: any) => p.id === item.productId);
      if (product?.trackInventory && product.stock < item.quantity) {
        throw ApiError.badRequest(`Insufficient stock for product: ${product.name}`);
      }
    }

    // Calculate totals
    const totals = OrderController.calculateOrderTotals(items);

    // Create order
    const order = await db.order.create({
      data: {
        orderNumber: OrderController.generateOrderNumber(),
        userId,
        guestEmail: guestEmail || null,
        status: OrderStatus.PENDING,
        currency: 'USD',
        ...totals,
        notes,
        shippingAddress,
        billingAddress: billingAddress || shippingAddress,
        paymentStatus: PaymentStatus.PENDING
      },
      include: {
        items: true
      }
    });

    // Create order items
    const orderItems = await Promise.all(
      items.map(async (item: any) => {
        const product = products.find((p: any) => p.id === item.productId);
        
        if (!product) {
          throw new Error(`Product with ID ${item.productId} not found`);
        }
        
        const orderItem = await db.orderItem.create({
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
          await db.product.update({
            where: { id: item.productId },
            data: {
              stock: product.stock - item.quantity
            }
          });
        }

        return orderItem;
      })
    );

    // Clear cart if user is logged in
    if (userId) {
      const cart = await db.cart.findFirst({
        where: {
          userId,
          status: CartStatus.ACTIVE
        }
      });

      if (cart) {
        await db.cartItem.deleteMany({
          where: { cartId: cart.id }
        });

        await db.cart.update({
          where: { id: cart.id },
          data: { status: CartStatus.CONVERTED }
        });

        // Invalidate cart cache
        await redisClient.invalidateCart(userId, sessionId);
      }
    }

    // Return complete order with items
    const completeOrder = await db.order.findUnique({
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

    return ApiResponseUtil.created(res, completeOrder, 'Order created successfully');
  });

  // GET /api/orders - Get user's orders
  static getOrders = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.userId;
    const {
      page = '1',
      limit = '20',
      status
    } = req.query;

    if (!userId) {
      throw ApiError.unauthorized('Authentication required');
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = { userId };
    if (status) {
      where.status = status;
    }

    // Get total count
    const total = await db.order.count({ where });

    // Get orders
    const orders = await db.order.findMany({
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

    const pagination = createPaginationMetadata(pageNum, limitNum, total);

    return ApiResponseUtil.paginated(res, orders, pagination);
  });

  // GET /api/orders/:id - Get single order by ID
  static getOrderById = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.userId;
    const { id } = req.params;

    const order = await db.order.findUnique({
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
      throw ApiError.notFound('Order not found');
    }

    // Check ownership
    if (userId && order.userId !== userId) {
      throw ApiError.forbidden('Access denied');
    }

    return ApiResponseUtil.success(res, order);
  });

  // PUT /api/orders/:id/cancel - Cancel order
  static cancelOrder = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.userId;
    const { id } = req.params;

    const order = await db.order.findUnique({
      where: { id },
      include: {
        items: true
      }
    });

    if (!order) {
      throw ApiError.notFound('Order not found');
    }

    // Check ownership
    if (userId && order.userId !== userId) {
      throw ApiError.forbidden('Access denied');
    }

    // Check if order can be cancelled
    if (order.status !== OrderStatus.PENDING && order.status !== OrderStatus.CONFIRMED) {
      throw ApiError.badRequest('Order cannot be cancelled at this stage');
    }

    // Restore product stock
    for (const item of order.items) {
      const product = await db.product.findUnique({
        where: { id: item.productId }
      });

      if (product && product.trackInventory) {
        await db.product.update({
          where: { id: item.productId },
          data: {
            stock: product.stock + item.quantity
          }
        });
      }
    }

    // Update order status
    const updatedOrder = await db.order.update({
      where: { id },
      data: {
        status: OrderStatus.CANCELLED,
        paymentStatus: PaymentStatus.CANCELLED
      }
    });

    return ApiResponseUtil.success(res, updatedOrder, 'Order cancelled successfully');
  });

  // GET /api/orders/:id/tracking - Get order tracking info
  static getOrderTracking = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.userId;
    const { id } = req.params;

    const order = await db.order.findUnique({
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
      throw ApiError.notFound('Order not found');
    }

    // Check ownership
    if (userId && order.userId !== userId) {
      throw ApiError.forbidden('Access denied');
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

    return ApiResponseUtil.success(res, trackingInfo);
  });
}
