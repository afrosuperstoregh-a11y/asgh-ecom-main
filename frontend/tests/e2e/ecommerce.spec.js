import { test, expect } from '@playwright/test'

test.describe('E-commerce Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display products on homepage', async ({ page }) => {
    // Should have product grid
    await expect(page.locator('[data-testid="product-grid"]')).toBeVisible()
    
    // Should have at least one product
    await expect(page.locator('[data-testid="product-card"]').first()).toBeVisible()
    
    // Product should have required elements
    const firstProduct = page.locator('[data-testid="product-card"]').first()
    await expect(firstProduct.locator('[data-testid="product-name"]')).toBeVisible()
    await expect(firstProduct.locator('[data-testid="product-price"]')).toBeVisible()
    await expect(firstProduct.locator('[data-testid="product-image"]')).toBeVisible()
  })

  test('should search for products', async ({ page }) => {
    // Find search input and search for a product
    await page.fill('[data-testid="search-input"]', 'shirt')
    await page.press('[data-testid="search-input"]', 'Enter')
    
    // Should show search results
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible()
    
    // Results should contain search term
    await expect(page.locator('[data-testid="search-results"]')).toContainText('shirt')
  })

  test('should filter products by category', async ({ page }) => {
    // Click on category filter
    await page.click('[data-testid="category-filter"]')
    await page.click('[data-testid="category-clothing"]')
    
    // Should apply filter and show filtered results
    await expect(page.locator('[data-testid="active-filters"]')).toBeVisible()
    await expect(page.locator('[data-testid="active-filters"]')).toContainText('Clothing')
  })

  test('should sort products', async ({ page }) => {
    // Click sort dropdown
    await page.click('[data-testid="sort-dropdown"]')
    await page.click('[data-testid="sort-price-high"]')
    
    // Should apply sorting
    await expect(page.locator('[data-testid="sort-indicator"]')).toBeVisible()
  })

  test('should add product to cart', async ({ page }) => {
    // Find first product and add to cart
    const firstProduct = page.locator('[data-testid="product-card"]').first()
    await firstProduct.click()
    
    // Should be on product detail page
    await expect(page).toHaveURL(/.*products\/.*/)
    await expect(page.locator('[data-testid="product-detail"]')).toBeVisible()
    
    // Add to cart
    await page.click('[data-testid="add-to-cart-button"]')
    
    // Should show success message
    await expect(page.locator('[data-testid="cart-success-message"]')).toBeVisible()
    
    // Cart icon should update
    await expect(page.locator('[data-testid="cart-count"]')).toContainText('1')
  })

  test('should view cart', async ({ page }) => {
    // Add product to cart first
    const firstProduct = page.locator('[data-testid="product-card"]').first()
    await firstProduct.click()
    await page.click('[data-testid="add-to-cart-button"]')
    
    // Go to cart
    await page.click('[data-testid="cart-icon"]')
    
    // Should be on cart page
    await expect(page).toHaveURL(/.*cart/)
    await expect(page.locator('[data-testid="cart-page"]')).toBeVisible()
    
    // Should show cart item
    await expect(page.locator('[data-testid="cart-item"]')).toBeVisible()
    await expect(page.locator('[data-testid="cart-total"]')).toBeVisible()
  })

  test('should update cart quantity', async ({ page }) => {
    // Add product to cart
    const firstProduct = page.locator('[data-testid="product-card"]').first()
    await firstProduct.click()
    await page.click('[data-testid="add-to-cart-button"]')
    
    // Go to cart
    await page.click('[data-testid="cart-icon"]')
    
    // Update quantity
    const quantityInput = page.locator('[data-testid="quantity-input"]')
    await quantityInput.fill('3')
    await page.press('[data-testid="quantity-input"]', 'Enter')
    
    // Should update cart total
    await expect(page.locator('[data-testid="cart-total"]')).not.toHaveTextContent('0')
  })

  test('should remove item from cart', async ({ page }) => {
    // Add product to cart
    const firstProduct = page.locator('[data-testid="product-card"]').first()
    await firstProduct.click()
    await page.click('[data-testid="add-to-cart-button"]')
    
    // Go to cart
    await page.click('[data-testid="cart-icon"]')
    
    // Remove item
    await page.click('[data-testid="remove-item-button"]')
    
    // Should show empty cart
    await expect(page.locator('[data-testid="empty-cart"]')).toBeVisible()
    await expect(page.locator('[data-testid="cart-count"]')).toHaveTextContent('0')
  })

  test('should proceed to checkout', async ({ page }) => {
    // Add product to cart
    const firstProduct = page.locator('[data-testid="product-card"]').first()
    await firstProduct.click()
    await page.click('[data-testid="add-to-cart-button"]')
    
    // Go to cart
    await page.click('[data-testid="cart-icon"]')
    
    // Proceed to checkout
    await page.click('[data-testid="checkout-button"]')
    
    // Should be on checkout page
    await expect(page).toHaveURL(/.*checkout/)
    await expect(page.locator('[data-testid="checkout-form"]')).toBeVisible()
  })

  test('should fill shipping information', async ({ page }) => {
    // Add product and go to checkout
    const firstProduct = page.locator('[data-testid="product-card"]').first()
    await firstProduct.click()
    await page.click('[data-testid="add-to-cart-button"]')
    await page.click('[data-testid="cart-icon"]')
    await page.click('[data-testid="checkout-button"]')
    
    // Fill shipping form
    await page.fill('[data-testid="first-name"]', 'John')
    await page.fill('[data-testid="last-name"]', 'Doe')
    await page.fill('[data-testid="email"]', 'john.doe@example.com')
    await page.fill('[data-testid="phone"]', '1234567890')
    await page.fill('[data-testid="address"]', '123 Main St')
    await page.fill('[data-testid="city"]', 'Accra')
    await page.fill('[data-testid="postal-code"]', '00233')
    
    // Select country
    await page.click('[data-testid="country-select"]')
    await page.click('[data-testid="country-ghana"]')
    
    // Continue to payment
    await page.click('[data-testid="continue-to-payment"]')
    
    // Should show payment section
    await expect(page.locator('[data-testid="payment-section"]')).toBeVisible()
  })

  test('should handle payment method selection', async ({ page }) => {
    // Go to payment section
    const firstProduct = page.locator('[data-testid="product-card"]').first()
    await firstProduct.click()
    await page.click('[data-testid="add-to-cart-button"]')
    await page.click('[data-testid="cart-icon"]')
    await page.click('[data-testid="checkout-button"]')
    
    // Fill shipping form quickly
    await page.fill('[data-testid="first-name"]', 'John')
    await page.fill('[data-testid="last-name"]', 'Doe')
    await page.fill('[data-testid="email"]', 'john.doe@example.com')
    await page.fill('[data-testid="phone"]', '1234567890')
    await page.fill('[data-testid="address"]', '123 Main St')
    await page.fill('[data-testid="city"]', 'Accra')
    await page.click('[data-testid="continue-to-payment"]')
    
    // Should show payment options
    await expect(page.locator('[data-testid="payment-methods"]')).toBeVisible()
    await expect(page.locator('[data-testid="stripe-payment"]')).toBeVisible()
    await expect(page.locator('[data-testid="paystack-payment"]')).toBeVisible()
    
    // Select payment method
    await page.click('[data-testid="stripe-payment"]')
    await expect(page.locator('[data-testid="stripe-form"]')).toBeVisible()
  })

  test('should handle mobile responsiveness', async ({ page }) => {
    // Switch to mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Should have mobile navigation
    await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible()
    
    // Open mobile menu
    await page.click('[data-testid="mobile-menu-button"]')
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible()
    
    // Product grid should adapt
    await expect(page.locator('[data-testid="product-grid"]')).toBeVisible()
    const products = page.locator('[data-testid="product-card"]')
    const productCount = await products.count()
    expect(productCount).toBeGreaterThan(0)
  })

  test('should handle wishlist functionality', async ({ page }) => {
    // Find product and add to wishlist
    const firstProduct = page.locator('[data-testid="product-card"]').first()
    await firstProduct.click()
    
    // Add to wishlist
    await page.click('[data-testid="wishlist-button"]')
    
    // Should show success message
    await expect(page.locator('[data-testid="wishlist-success"]')).toBeVisible()
    
    // Wishlist icon should update
    await expect(page.locator('[data-testid="wishlist-count"]')).toBeVisible()
  })

  test('should handle product comparison', async ({ page }) => {
    // Add products to comparison
    const products = page.locator('[data-testid="product-card"]')
    
    // Add first two products to comparison
    await products.nth(0).hover()
    await page.click('[data-testid="compare-button"]')
    
    await products.nth(1).hover()
    await page.click('[data-testid="compare-button"]')
    
    // Should show comparison notification
    await expect(page.locator('[data-testid="compare-notification"]')).toBeVisible()
    
    // Go to comparison page
    await page.click('[data-testid="compare-link"]')
    
    // Should show comparison table
    await expect(page.locator('[data-testid="comparison-table"]')).toBeVisible()
  })

  test('should handle loading states', async ({ page }) => {
    // Navigate to products page
    await page.click('[data-testid="products-link"]')
    
    // Should show loading state initially
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible()
    
    // Wait for products to load
    await page.waitForSelector('[data-testid="product-grid"]', { timeout: 5000 })
    
    // Loading should disappear
    await expect(page.locator('[data-testid="loading-spinner"]')).not.toBeVisible()
  })

  test('should handle error states', async ({ page }) => {
    // Mock network error by going to invalid page
    await page.goto('/invalid-page')
    
    // Should show 404 error page
    await expect(page.locator('[data-testid="error-page"]')).toBeVisible()
    await expect(page.locator('[data-testid="error-code"]')).toContainText('404')
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Page not found')
  })
})
