'use client';

import { createContext, useContext, useReducer, useEffect } from 'react';

// Cart context
const CartContext = createContext();

// Initial state
const initialState = {
  items: [],
  total: 0,
  itemCount: 0,
};

// Action types
const ADD_ITEM = 'ADD_ITEM';
const REMOVE_ITEM = 'REMOVE_ITEM';
const UPDATE_QUANTITY = 'UPDATE_QUANTITY';
const CLEAR_CART = 'CLEAR_CART';
const LOAD_CART = 'LOAD_CART';

// Reducer
function cartReducer(state, action) {
  switch (action.type) {
    case ADD_ITEM: {
      const existingItem = state.items.find(item => item.id === action.payload.id);
      
      if (existingItem) {
        const updatedItems = state.items.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: item.quantity + action.payload.quantity }
            : item
        );
        return calculateTotals({ ...state, items: updatedItems });
      } else {
        const updatedItems = [...state.items, action.payload];
        return calculateTotals({ ...state, items: updatedItems });
      }
    }
    
    case REMOVE_ITEM: {
      const updatedItems = state.items.filter(item => item.id !== action.payload);
      return calculateTotals({ ...state, items: updatedItems });
    }
    
    case UPDATE_QUANTITY: {
      const updatedItems = state.items.map(item =>
        item.id === action.payload.id
          ? { ...item, quantity: action.payload.quantity }
          : item
      ).filter(item => item.quantity > 0);
      return calculateTotals({ ...state, items: updatedItems });
    }
    
    case CLEAR_CART:
      return initialState;
    
    case LOAD_CART:
      return action.payload;
    
    default:
      return state;
  }
}

// Calculate totals
function calculateTotals(state) {
  const total = state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);
  
  return {
    ...state,
    total,
    itemCount,
  };
}

// Provider component
export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        dispatch({ type: LOAD_CART, payload: calculateTotals({ ...initialState, items: parsedCart }) });
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(state.items));
  }, [state.items]);

  // Actions
  const addToCart = (product, quantity = 1) => {
    dispatch({
      type: ADD_ITEM,
      payload: {
        ...product,
        quantity,
      },
    });
  };

  const removeFromCart = (productId) => {
    dispatch({
      type: REMOVE_ITEM,
      payload: productId,
    });
  };

  const updateQuantity = (productId, quantity) => {
    dispatch({
      type: UPDATE_QUANTITY,
      payload: {
        id: productId,
        quantity,
      },
    });
  };

  const clearCart = () => {
    dispatch({ type: CLEAR_CART });
  };

  const getCartTotal = () => state.total;
  
  const getCartCount = () => state.itemCount;

  const value = {
    items: state.items,
    total: state.total,
    itemCount: state.itemCount,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartCount,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

// Hook to use cart context
export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

export default CartContext;
