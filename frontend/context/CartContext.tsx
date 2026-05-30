"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { getSupabaseClient } from '@/lib/supabase-client';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  category?: string;
  sku?: string;
  product_id?: string;
}

interface CartContextType {
  items: CartItem[];
  loading: boolean;
  addToCart: (item: Omit<CartItem, 'quantity'>) => Promise<void>;
  removeFromCart: (id: string) => Promise<void>;
  updateQuantity: (id: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  syncCartWithDatabase: () => Promise<void>;
  getCartTotal: () => number;
  getCartCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isAuthenticated } = useSupabaseAuth();
  const supabase = getSupabaseClient();

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        setItems(parsedCart);
      } catch (error) {
        console.error('Error parsing saved cart:', error);
        localStorage.removeItem('cart');
      }
    }
    setLoading(false);
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (!loading) {
      localStorage.setItem('cart', JSON.stringify(items));
    }
  }, [items, loading]);

  // Sync cart with database when user authentication changes
  useEffect(() => {
    if (isAuthenticated && user) {
      syncCartWithDatabase();
    }
  }, [isAuthenticated, user]);

  const syncCartWithDatabase = async () => {
    if (!isAuthenticated || !user) return;

    try {
      setLoading(true);

      // Get user's cart from database
      const { data: dbCart, error } = await supabase
        .from('cart')
        .select(`
          *,
          product!product_id (
            id,
            name,
            price,
            images,
            sku,
            category!category_id (
              name
            )
          )
        `)
        .eq('customer_id', user.id);

      if (error) {
        console.error('Error fetching cart from database:', error);
        return;
      }

      if (dbCart && dbCart.length > 0) {
        // Convert database cart to frontend format
        const dbItems: CartItem[] = (dbCart as any[]).map(item => ({
          id: item.product_id,
          product_id: item.product_id,
          name: item.product?.name || 'Unknown Product',
          price: item.product?.price || 0,
          quantity: item.quantity,
          image: item.product?.images?.[0] || '',
          category: item.product?.category?.name || '',
          sku: item.product?.sku || ''
        }));

        // Merge with local cart
        const mergedCart = mergeCarts(items, dbItems);
        setItems(mergedCart);

        // Update database with merged cart
        await updateDatabaseCart(mergedCart);
      } else {
        // No database cart, push local cart to database
        await updateDatabaseCart(items);
      }
    } catch (error) {
      console.error('Error syncing cart with database:', error);
    } finally {
      setLoading(false);
    }
  };

  const mergeCarts = (localCart: CartItem[], dbCart: CartItem[]): CartItem[] => {
    const merged = new Map<string, CartItem>();

    // Add local cart items
    localCart.forEach(item => {
      merged.set(item.id, { ...item });
    });

    // Add database cart items and merge quantities if duplicates
    dbCart.forEach(item => {
      const existing = merged.get(item.id);
      if (existing) {
        // Merge quantities
        merged.set(item.id, {
          ...existing,
          quantity: existing.quantity + item.quantity
        });
      } else {
        merged.set(item.id, { ...item });
      }
    });

    return Array.from(merged.values());
  };

  const updateDatabaseCart = async (cartItems: CartItem[]) => {
    if (!isAuthenticated || !user) return;

    try {
      // Clear existing cart items
      await supabase
        .from('cart')
        .delete()
        .eq('customer_id', user.id);

      // Insert new cart items
      if (cartItems.length > 0) {
        const cartData = cartItems.map(item => ({
          customer_id: user.id,
          product_id: item.id,
          quantity: item.quantity
        }));

        const { error } = await supabase
          .from('cart')
          .insert(cartData as any);

        if (error) {
          console.error('Error updating database cart:', error);
        }
      }
    } catch (error) {
      console.error('Error updating database cart:', error);
    }
  };

  const addToCart = async (item: Omit<CartItem, 'quantity'>) => {
    setItems((prevItems) => {
      const existingItem = prevItems.find((i) => i.id === item.id);
      if (existingItem) {
        const updatedItems = prevItems.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
        updateDatabaseCart(updatedItems);
        return updatedItems;
      }
      const newItems = [...prevItems, { ...item, quantity: 1 }];
      updateDatabaseCart(newItems);
      return newItems;
    });
  };

  const removeFromCart = async (id: string) => {
    const updatedItems = items.filter((item) => item.id !== id);
    setItems(updatedItems);
    await updateDatabaseCart(updatedItems);
  };

  const updateQuantity = async (id: string, quantity: number) => {
    if (quantity <= 0) {
      await removeFromCart(id);
      return;
    }
    
    const updatedItems = items.map((item) =>
      item.id === id ? { ...item, quantity } : item
    );
    setItems(updatedItems);
    await updateDatabaseCart(updatedItems);
  };

  const clearCart = async () => {
    setItems([]);
    await updateDatabaseCart([]);
  };

  const getCartTotal = () => {
    return items.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  };

  const getCartCount = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        loading,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        syncCartWithDatabase,
        getCartTotal,
        getCartCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
