import React, { act } from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CartProvider, useCart } from '@/context/CartContext'
import { SupabaseAuthProvider } from '@/contexts/SupabaseAuthContext'

// Test component that uses the cart context
const TestComponent = () => {
  const { items, addToCart, removeFromCart, updateQuantity, clearCart, getCartTotal, getCartCount } = useCart()

  const testProduct = {
    id: 'test-product-1',
    name: 'Test Product',
    price: 10.99,
    image: '/test-image.jpg',
    category: 'Test Category'
  }

  return (
    <div>
      <div data-testid="cart-count">{getCartCount()}</div>
      <div data-testid="cart-total">{getCartTotal()}</div>
      <div data-testid="cart-items">{items.length}</div>
      
      <button
        data-testid="add-to-cart"
        onClick={() => addToCart(testProduct)}
      >
        Add to Cart
      </button>
      
      <button
        data-testid="remove-from-cart"
        onClick={() => removeFromCart(testProduct.id)}
      >
        Remove from Cart
      </button>
      
      <button
        data-testid="update-quantity"
        onClick={() => updateQuantity(testProduct.id, 3)}
      >
        Update Quantity
      </button>
      
      <button
        data-testid="clear-cart"
        onClick={clearCart}
      >
        Clear Cart
      </button>
    </div>
  )
}

const renderWithProviders = (component) => {
  return render(
    <SupabaseAuthProvider>
      <CartProvider>
        {component}
      </CartProvider>
    </SupabaseAuthProvider>
  )
}

describe('CartContext', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
  })

  it('should initialize with empty cart', () => {
    renderWithProviders(<TestComponent />)

    expect(screen.getByTestId('cart-count')).toHaveTextContent('0')
    expect(screen.getByTestId('cart-total')).toHaveTextContent('0')
    expect(screen.getByTestId('cart-items')).toHaveTextContent('0')
  })

  it('should add item to cart', async () => {
    renderWithProviders(<TestComponent />)

    const addToCartButton = screen.getByTestId('add-to-cart')
    
    await act(async () => {
      fireEvent.click(addToCartButton)
    })

    await waitFor(() => {
      expect(screen.getByTestId('cart-count')).toHaveTextContent('1')
      expect(screen.getByTestId('cart-total')).toHaveTextContent('10.99')
      expect(screen.getByTestId('cart-items')).toHaveTextContent('1')
    })
  })

  it('should add same item twice and increase quantity', async () => {
    renderWithProviders(<TestComponent />)

    const addToCartButton = screen.getByTestId('add-to-cart')
    
    await act(async () => {
      fireEvent.click(addToCartButton)
    })

    await act(async () => {
      fireEvent.click(addToCartButton)
    })

    await waitFor(() => {
      expect(screen.getByTestId('cart-count')).toHaveTextContent('2')
      expect(screen.getByTestId('cart-total')).toHaveTextContent('21.98') // 10.99 * 2
      expect(screen.getByTestId('cart-items')).toHaveTextContent('1') // Still 1 unique item
    })
  })

  it('should update item quantity', async () => {
    renderWithProviders(<TestComponent />)

    const addToCartButton = screen.getByTestId('add-to-cart')
    const updateQuantityButton = screen.getByTestId('update-quantity')
    
    await act(async () => {
      fireEvent.click(addToCartButton)
    })

    await act(async () => {
      fireEvent.click(updateQuantityButton)
    })

    await waitFor(() => {
      expect(screen.getByTestId('cart-count')).toHaveTextContent('3')
      expect(screen.getByTestId('cart-total')).toHaveTextContent('32.97') // 10.99 * 3
    })
  })

  it('should remove item from cart', async () => {
    renderWithProviders(<TestComponent />)

    const addToCartButton = screen.getByTestId('add-to-cart')
    const removeFromCartButton = screen.getByTestId('remove-from-cart')
    
    await act(async () => {
      fireEvent.click(addToCartButton)
    })

    await waitFor(() => {
      expect(screen.getByTestId('cart-count')).toHaveTextContent('1')
    })

    await act(async () => {
      fireEvent.click(removeFromCartButton)
    })

    await waitFor(() => {
      expect(screen.getByTestId('cart-count')).toHaveTextContent('0')
      expect(screen.getByTestId('cart-total')).toHaveTextContent('0')
      expect(screen.getByTestId('cart-items')).toHaveTextContent('0')
    })
  })

  it('should clear entire cart', async () => {
    renderWithProviders(<TestComponent />)

    const addToCartButton = screen.getByTestId('add-to-cart')
    const clearCartButton = screen.getByTestId('clear-cart')
    
    await act(async () => {
      fireEvent.click(addToCartButton)
    })

    await act(async () => {
      fireEvent.click(addToCartButton)
    })

    await waitFor(() => {
      expect(screen.getByTestId('cart-count')).toHaveTextContent('2')
    })

    await act(async () => {
      fireEvent.click(clearCartButton)
    })

    await waitFor(() => {
      expect(screen.getByTestId('cart-count')).toHaveTextContent('0')
      expect(screen.getByTestId('cart-total')).toHaveTextContent('0')
      expect(screen.getByTestId('cart-items')).toHaveTextContent('0')
    })
  })

  it('should handle quantity update to zero (removes item)', async () => {
    renderWithProviders(<TestComponent />)

    const addToCartButton = screen.getByTestId('add-to-cart')
    
    await act(async () => {
      fireEvent.click(addToCartButton)
    })

    await waitFor(() => {
      expect(screen.getByTestId('cart-count')).toHaveTextContent('1')
    })

    await act(async () => {
      // Update quantity to 0 should remove the item
      fireEvent.click(screen.getByTestId('update-quantity'))
    })

    // The update-quantity button sets quantity to 3, so let's test with a custom update
    const TestComponentWithCustomUpdate = () => {
      const { items, addToCart, updateQuantity } = useCart()

      const testProduct = {
        id: 'test-product-1',
        name: 'Test Product',
        price: 10.99
      }

      return (
        <div>
          <div data-testid="cart-count">{items.reduce((total, item) => total + item.quantity, 0)}</div>
          <button
            data-testid="add-to-cart"
            onClick={() => addToCart(testProduct)}
          >
            Add to Cart
          </button>
          <button
            data-testid="update-to-zero"
            onClick={() => updateQuantity(testProduct.id, 0)}
          >
            Update to Zero
          </button>
        </div>
      )
    }

    renderWithProviders(<TestComponentWithCustomUpdate />)

    await act(async () => {
      fireEvent.click(screen.getByTestId('add-to-cart'))
    })

    await act(async () => {
      fireEvent.click(screen.getByTestId('update-to-zero'))
    })

    await waitFor(() => {
      expect(screen.getByTestId('cart-count')).toHaveTextContent('0')
    })
  })

  it('should persist cart to localStorage', async () => {
    renderWithProviders(<TestComponent />)

    const addToCartButton = screen.getByTestId('add-to-cart')
    
    await act(async () => {
      fireEvent.click(addToCartButton)
    })

    await waitFor(() => {
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'cart',
        expect.stringContaining('test-product-1')
      )
    })
  })
})
