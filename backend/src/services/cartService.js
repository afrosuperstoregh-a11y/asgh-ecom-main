const cacheService = require('./cacheService');

class CartService {
  constructor() {
    this.cartTTL = 86400; // 24 hours in seconds
    this.maxItems = 50; // Maximum items per cart
  }

  // Get user's cart from Redis or database
  async getCart(userId) {
    try {
      // First try to get from Redis cache
      const cachedCart = await cacheService.getCart(userId);
      
      if (cachedCart) {
        console.log(`🛒 Cart cache HIT for user: ${userId}`);
        return cachedCart;
      }

      // If not in cache, fetch from database
      console.log(`🛒 Cart cache MISS for user: ${userId}`);
      const dbCart = await this.getCartFromDatabase(userId);
      
      if (dbCart) {
        // Cache the result
        await cacheService.setCart(userId, dbCart, this.cartTTL);
      }

      return dbCart || this.createEmptyCart(userId);
    } catch (error) {
      console.error('Error getting cart:', error);
      return this.createEmptyCart(userId);
    }
  }

  // Create empty cart structure
  createEmptyCart(userId) {
    return {
      userId,
      items: [],
      totalPrice: 0,
      totalItems: 0,
      currency: 'USD',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  // Add item to cart
  async addItem(userId, item) {
    try {
      const cart = await this.getCart(userId);
      
      // Validate item
      if (!item.productId || !item.quantity || item.quantity <= 0) {
        throw new Error('Invalid item data');
      }

      // Check if item already exists in cart
      const existingItemIndex = cart.items.findIndex(i => i.productId === item.productId);
      
      if (existingItemIndex >= 0) {
        // Update existing item
        cart.items[existingItemIndex].quantity += item.quantity;
        cart.items[existingItemIndex].updatedAt = new Date().toISOString();
      } else {
        // Add new item
        if (cart.items.length >= this.maxItems) {
          throw new Error('Cart is full');
        }

        cart.items.push({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price || 0,
          name: item.name || '',
          image: item.image || '',
          addedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      // Recalculate totals
      this.calculateTotals(cart);
      cart.updatedAt = new Date().toISOString();

      // Update cache
      await cacheService.setCart(userId, cart, this.cartTTL);

      // Optionally persist to database (for checkout)
      await this.saveCartToDatabase(userId, cart);

      console.log(`🛒 Added item to cart for user: ${userId}`);
      return cart;
    } catch (error) {
      console.error('Error adding item to cart:', error);
      throw error;
    }
  }

  // Remove item from cart
  async removeItem(userId, productId) {
    try {
      const cart = await this.getCart(userId);
      
      const itemIndex = cart.items.findIndex(i => i.productId === productId);
      
      if (itemIndex === -1) {
        throw new Error('Item not found in cart');
      }

      cart.items.splice(itemIndex, 1);
      
      // Recalculate totals
      this.calculateTotals(cart);
      cart.updatedAt = new Date().toISOString();

      // Update cache
      await cacheService.setCart(userId, cart, this.cartTTL);

      // Update database
      await this.saveCartToDatabase(userId, cart);

      console.log(`🛒 Removed item from cart for user: ${userId}`);
      return cart;
    } catch (error) {
      console.error('Error removing item from cart:', error);
      throw error;
    }
  }

  // Update item quantity
  async updateItemQuantity(userId, productId, quantity) {
    try {
      if (quantity <= 0) {
        return this.removeItem(userId, productId);
      }

      const cart = await this.getCart(userId);
      
      const item = cart.items.find(i => i.productId === productId);
      
      if (!item) {
        throw new Error('Item not found in cart');
      }

      item.quantity = quantity;
      item.updatedAt = new Date().toISOString();
      
      // Recalculate totals
      this.calculateTotals(cart);
      cart.updatedAt = new Date().toISOString();

      // Update cache
      await cacheService.setCart(userId, cart, this.cartTTL);

      // Update database
      await this.saveCartToDatabase(userId, cart);

      console.log(`🛒 Updated item quantity in cart for user: ${userId}`);
      return cart;
    } catch (error) {
      console.error('Error updating item quantity:', error);
      throw error;
    }
  }

  // Clear entire cart
  async clearCart(userId) {
    try {
      const emptyCart = this.createEmptyCart(userId);
      
      // Update cache
      await cacheService.setCart(userId, emptyCart, this.cartTTL);

      // Clear in database
      await this.clearCartInDatabase(userId);

      console.log(`🛒 Cleared cart for user: ${userId}`);
      return emptyCart;
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw error;
    }
  }

  // Calculate cart totals
  calculateTotals(cart) {
    cart.totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    cart.totalPrice = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Round to 2 decimal places
    cart.totalPrice = Math.round(cart.totalPrice * 100) / 100;
  }

  // Get cart summary
  async getCartSummary(userId) {
    try {
      const cart = await this.getCart(userId);
      
      return {
        totalItems: cart.totalItems,
        totalPrice: cart.totalPrice,
        currency: cart.currency,
        itemCount: cart.items.length,
        updatedAt: cart.updatedAt,
      };
    } catch (error) {
      console.error('Error getting cart summary:', error);
      return {
        totalItems: 0,
        totalPrice: 0,
        currency: 'USD',
        itemCount: 0,
        updatedAt: new Date().toISOString(),
      };
    }
  }

  // Validate cart items (check stock, prices, etc.)
  async validateCart(userId) {
    try {
      const cart = await this.getCart(userId);
      const validationResults = [];
      let isValid = true;

      for (const item of cart.items) {
        try {
          // Get current product data
          const product = await this.getProductFromDatabase(item.productId);
          
          if (!product) {
            validationResults.push({
              productId: item.productId,
              valid: false,
              reason: 'Product not found',
            });
            isValid = false;
            continue;
          }

          // Check if product is still active
          if (product.status !== 'active') {
            validationResults.push({
              productId: item.productId,
              valid: false,
              reason: 'Product is not available',
            });
            isValid = false;
            continue;
          }

          // Check stock
          if (product.stock < item.quantity) {
            validationResults.push({
              productId: item.productId,
              valid: false,
              reason: `Insufficient stock. Available: ${product.stock}`,
              maxQuantity: product.stock,
            });
            isValid = false;
          }

          // Check for price changes
          if (product.price !== item.price) {
            validationResults.push({
              productId: item.productId,
              valid: true,
              priceChanged: true,
              oldPrice: item.price,
              newPrice: product.price,
            });
            
            // Update item price
            item.price = product.price;
          }

          validationResults.push({
            productId: item.productId,
            valid: true,
          });
        } catch (error) {
          validationResults.push({
            productId: item.productId,
            valid: false,
            reason: 'Error validating product',
          });
          isValid = false;
        }
      }

      // Recalculate totals if prices changed
      if (validationResults.some(r => r.priceChanged)) {
        this.calculateTotals(cart);
        cart.updatedAt = new Date().toISOString();
        await cacheService.setCart(userId, cart, this.cartTTL);
      }

      return {
        isValid,
        validationResults,
        cart,
      };
    } catch (error) {
      console.error('Error validating cart:', error);
      throw error;
    }
  }

  // Apply coupon/discount to cart
  async applyDiscount(userId, discountCode) {
    try {
      const cart = await this.getCart(userId);
      
      // Get discount from database
      const discount = await this.getDiscountFromDatabase(discountCode);
      
      if (!discount) {
        throw new Error('Invalid discount code');
      }

      // Check if discount is applicable
      if (!this.isDiscountApplicable(cart, discount)) {
        throw new Error('Discount not applicable to this cart');
      }

      // Apply discount
      const discountAmount = this.calculateDiscount(cart.totalPrice, discount);
      cart.discount = {
        code: discountCode,
        amount: discountAmount,
        type: discount.type,
        description: discount.description,
      };
      
      cart.finalPrice = cart.totalPrice - discountAmount;
      cart.finalPrice = Math.round(cart.finalPrice * 100) / 100;
      cart.updatedAt = new Date().toISOString();

      // Update cache
      await cacheService.setCart(userId, cart, this.cartTTL);

      console.log(`🛒 Applied discount to cart for user: ${userId}`);
      return cart;
    } catch (error) {
      console.error('Error applying discount:', error);
      throw error;
    }
  }

  // Database methods (to be implemented based on your database schema)
  async getCartFromDatabase(userId) {
    // Implement database cart retrieval
    // This should fetch from your Supabase or other database
    return null; // Return null if no cart exists
  }

  async saveCartToDatabase(userId, cart) {
    // Implement database cart saving
    // This should save to your Supabase or other database
    console.log(`💾 Cart saved to database for user: ${userId}`);
  }

  async clearCartInDatabase(userId) {
    // Implement database cart clearing
    console.log(`🗑️ Cart cleared in database for user: ${userId}`);
  }

  async getProductFromDatabase(productId) {
    // Implement product retrieval from database
    // This should fetch from your Supabase or other database
    return null;
  }

  async getDiscountFromDatabase(discountCode) {
    // Implement discount retrieval from database
    return null;
  }

  isDiscountApplicable(cart, discount) {
    // Implement discount applicability logic
    return true;
  }

  calculateDiscount(totalPrice, discount) {
    // Implement discount calculation
    return 0;
  }
}

// Create singleton instance
const cartService = new CartService();

module.exports = cartService;
