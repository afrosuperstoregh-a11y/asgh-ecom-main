import { Request, Response } from 'express';
import { db } from '../config/database';
import { redisClient } from '../config/redis';
import { ApiResponseUtil } from '../utils/response';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { CartStatus } from '../types/enums';
import { SecurityUtils } from '../utils/security';

export class CartController {
  // Helper method to get or create cart
  private static async getOrCreateCart(userId?: string, sessionId?: string) {
    let cart;

    if (userId) {
      // Try to find existing cart for user
      cart = await db.cart.findFirst({
        where: {
          userId,
          status: CartStatus.ACTIVE
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
    } else if (sessionId) {
      // Try to find existing cart for session
      cart = await db.cart.findFirst({
        where: {
          sessionId,
          status: CartStatus.ACTIVE
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
      cart = await db.cart.create({
        data: {
          userId,
          sessionId,
          status: CartStatus.ACTIVE
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

  // GET /api/cart - Get current cart
  static getCart = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.userId;
    const sessionId = req.headers['x-session-id'] as string || SecurityUtils.generateSessionId();

    const cart = await CartController.getOrCreateCart(userId, sessionId);

    // Calculate totals
    const subtotal = cart.items.reduce((sum: number, item: any) => {
      return sum + (Number(item.price) * item.quantity);
    }, 0);

    const totalItems = cart.items.reduce((sum: number, item: any) => sum + item.quantity, 0);

    const cartResponse = {
      id: cart.id,
      items: cart.items.map((item: any) => ({
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
    await redisClient.cacheCart(userId, sessionId, cartResponse);

    return ApiResponseUtil.success(res, cartResponse);
  });

  // POST /api/cart/items - Add item to cart
  static addToCart = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.userId;
    const sessionId = req.headers['x-session-id'] as string || SecurityUtils.generateSessionId();
    const { productId, quantity } = req.body;

    // Validate product exists and is active
    const product = await db.product.findUnique({
      where: { 
        id: productId,
        status: 'ACTIVE'
      }
    });

    if (!product) {
      throw ApiError.notFound('Product not found');
    }

    // Check inventory
    if (product.trackInventory && product.stock < quantity) {
      throw ApiError.badRequest('Insufficient stock');
    }

    const cart = await CartController.getOrCreateCart(userId, sessionId);

    // Check if item already exists in cart
    const existingItem = await db.cartItem.findUnique({
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
        throw ApiError.badRequest('Insufficient stock for requested quantity');
      }

      cartItem = await db.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity }
      });
    } else {
      // Create new cart item
      cartItem = await db.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity,
          price: product.price
        }
      });
    }

    // Invalidate cart cache
    await redisClient.invalidateCart(userId, sessionId);

    return ApiResponseUtil.created(res, cartItem, 'Item added to cart successfully');
  });

  // PUT /api/cart/items/:id - Update cart item quantity
  static updateCartItem = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.userId;
    const sessionId = req.headers['x-session-id'] as string;
    const { id } = req.params;
    const { quantity } = req.body;

    // Get cart item with product info
    const cartItem = await db.cartItem.findUnique({
      where: { id },
      include: {
        cart: true,
        product: true
      }
    });

    if (!cartItem) {
      throw ApiError.notFound('Cart item not found');
    }

    // Verify ownership (user cart or session cart)
    if (userId && cartItem.cart.userId !== userId) {
      throw ApiError.forbidden('Access denied');
    }
    if (!userId && cartItem.cart.sessionId !== sessionId) {
      throw ApiError.forbidden('Access denied');
    }

    // Check inventory
    if (cartItem.product.trackInventory && cartItem.product.stock < quantity) {
      throw ApiError.badRequest('Insufficient stock');
    }

    // Update quantity
    const updatedItem = await db.cartItem.update({
      where: { id },
      data: { quantity }
    });

    // Invalidate cart cache
    await redisClient.invalidateCart(userId, sessionId);

    return ApiResponseUtil.success(res, updatedItem, 'Cart item updated successfully');
  });

  // DELETE /api/cart/items/:id - Remove item from cart
  static removeFromCart = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.userId;
    const sessionId = req.headers['x-session-id'] as string;
    const { id } = req.params;

    // Get cart item with cart info
    const cartItem = await db.cartItem.findUnique({
      where: { id },
      include: { cart: true }
    });

    if (!cartItem) {
      throw ApiError.notFound('Cart item not found');
    }

    // Verify ownership
    if (userId && cartItem.cart.userId !== userId) {
      throw ApiError.forbidden('Access denied');
    }
    if (!userId && cartItem.cart.sessionId !== sessionId) {
      throw ApiError.forbidden('Access denied');
    }

    // Delete cart item
    await db.cartItem.delete({
      where: { id }
    });

    // Invalidate cart cache
    await redisClient.invalidateCart(userId, sessionId);

    return ApiResponseUtil.success(res, null, 'Item removed from cart successfully');
  });

  // DELETE /api/cart - Clear entire cart
  static clearCart = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.userId;
    const sessionId = req.headers['x-session-id'] as string;

    const cart = await CartController.getOrCreateCart(userId, sessionId);

    // Delete all items in cart
    await db.cartItem.deleteMany({
      where: { cartId: cart.id }
    });

    // Invalidate cart cache
    await redisClient.invalidateCart(userId, sessionId);

    return ApiResponseUtil.success(res, null, 'Cart cleared successfully');
  });

  // POST /api/cart/merge - Merge guest cart with user cart (after login)
  static mergeCart = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;
    const { sessionId } = req.body;

    if (!sessionId) {
      throw ApiError.badRequest('Session ID is required');
    }

    // Get guest cart
    const guestCart = await db.cart.findFirst({
      where: {
        sessionId,
        status: CartStatus.ACTIVE
      },
      include: {
        items: true
      }
    });

    if (!guestCart) {
      throw ApiError.notFound('Guest cart not found');
    }

    // Get or create user cart
    const userCart = await CartController.getOrCreateCart(userId);

    // Merge items
    for (const guestItem of guestCart.items) {
      const existingUserItem = await db.cartItem.findUnique({
        where: {
          cartId_productId: {
            cartId: userCart.id,
            productId: guestItem.productId
          }
        }
      });

      if (existingUserItem) {
        // Update existing item quantity
        await db.cartItem.update({
          where: { id: existingUserItem.id },
          data: {
            quantity: existingUserItem.quantity + guestItem.quantity
          }
        });
      } else {
        // Move item to user cart
        await db.cartItem.update({
          where: { id: guestItem.id },
          data: {
            cartId: userCart.id
          }
        });
      }
    }

    // Mark guest cart as converted
    await db.cart.update({
      where: { id: guestCart.id },
      data: { status: CartStatus.CONVERTED }
    });

    // Invalidate caches
    await redisClient.invalidateCart(userId, sessionId);

    return ApiResponseUtil.success(res, null, 'Cart merged successfully');
  });
}
