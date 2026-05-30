import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should navigate to login page', async ({ page }) => {
    // Find and click login button
    await page.click('[data-testid="login-button"]')
    
    // Should be on login page
    await expect(page).toHaveURL(/.*login/)
    await expect(page.locator('h1')).toContainText('Sign In')
  })

  test('should show validation errors for empty form', async ({ page }) => {
    await page.goto('/login')
    
    // Try to submit empty form
    await page.click('[data-testid="login-submit-button"]')
    
    // Should show validation errors
    await expect(page.locator('[data-testid="email-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="password-error"]')).toBeVisible()
  })

  test('should navigate to registration page', async ({ page }) => {
    await page.goto('/login')
    
    // Click "Don't have an account" link
    await page.click('[data-testid="register-link"]')
    
    // Should be on registration page
    await expect(page).toHaveURL(/.*register/)
    await expect(page.locator('h1')).toContainText('Create Account')
  })

  test('should show password strength indicator', async ({ page }) => {
    await page.goto('/register')
    
    // Fill in password field
    await page.fill('[data-testid="password-input"]', 'weak')
    
    // Should show password strength indicator
    await expect(page.locator('[data-testid="password-strength"]')).toBeVisible()
    
    // Fill in strong password
    await page.fill('[data-testid="password-input"]', 'StrongPassword123!')
    
    // Should show strong password indicator
    await expect(page.locator('[data-testid="password-strength"]')).toContainText('Strong')
  })

  test('should toggle password visibility', async ({ page }) => {
    await page.goto('/login')
    
    const passwordInput = page.locator('[data-testid="password-input"]')
    const toggleButton = page.locator('[data-testid="password-toggle"]')
    
    // Initially password should be hidden
    await expect(passwordInput).toHaveAttribute('type', 'password')
    
    // Click toggle to show password
    await toggleButton.click()
    await expect(passwordInput).toHaveAttribute('type', 'text')
    
    // Click toggle to hide password
    await toggleButton.click()
    await expect(passwordInput).toHaveAttribute('type', 'password')
  })

  test('should handle forgot password flow', async ({ page }) => {
    await page.goto('/login')
    
    // Click forgot password link
    await page.click('[data-testid="forgot-password-link"]')
    
    // Should be on forgot password page
    await expect(page).toHaveURL(/.*forgot-password/)
    await expect(page.locator('h1')).toContainText('Reset Password')
    
    // Fill email and submit
    await page.fill('[data-testid="email-input"]', 'test@example.com')
    await page.click('[data-testid="reset-password-button"]')
    
    // Should show success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
    await expect(page.locator('[data-testid="success-message"]')).toContainText('password reset instructions')
  })

  test('should show social login options', async ({ page }) => {
    await page.goto('/login')
    
    // Should have social login buttons
    await expect(page.locator('[data-testid="google-login-button"]')).toBeVisible()
    await expect(page.locator('[data-testid="facebook-login-button"]')).toBeVisible()
  })

  test('should handle form submission with invalid credentials', async ({ page }) => {
    await page.goto('/login')
    
    // Fill with invalid credentials
    await page.fill('[data-testid="email-input"]', 'invalid@example.com')
    await page.fill('[data-testid="password-input"]', 'wrongpassword')
    await page.click('[data-testid="login-submit-button"]')
    
    // Should show error message
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid credentials')
  })

  test('should handle registration form validation', async ({ page }) => {
    await page.goto('/register')
    
    // Try to submit empty form
    await page.click('[data-testid="register-submit-button"]')
    
    // Should show validation errors for all required fields
    await expect(page.locator('[data-testid="name-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="email-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="password-error"]')).toBeVisible()
    
    // Fill in invalid email
    await page.fill('[data-testid="email-input"]', 'invalid-email')
    await page.click('[data-testid="register-submit-button"]')
    
    // Should show email validation error
    await expect(page.locator('[data-testid="email-error"]')).toContainText('valid email')
  })

  test('should handle terms and conditions requirement', async ({ page }) => {
    await page.goto('/register')
    
    // Fill form but don't accept terms
    await page.fill('[data-testid="name-input"]', 'Test User')
    await page.fill('[data-testid="email-input"]', 'test@example.com')
    await page.fill('[data-testid="password-input"]', 'StrongPassword123!')
    await page.click('[data-testid="register-submit-button"]')
    
    // Should show terms acceptance error
    await expect(page.locator('[data-testid="terms-error"]')).toBeVisible()
    
    // Accept terms and submit
    await page.click('[data-testid="terms-checkbox"]')
    await page.click('[data-testid="register-submit-button"]')
    
    // Should proceed with registration (mocked)
    await expect(page.locator('[data-testid="terms-error"]')).not.toBeVisible()
  })
})
