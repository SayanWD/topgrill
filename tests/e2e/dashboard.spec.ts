import { test, expect } from '@playwright/test'

/**
 * E2E Tests for Dashboard
 * Critical user flows: login, view analytics, navigate
 */

test.describe('Authentication', () => {
  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/analytics')
    await expect(page).toHaveURL(/\/login/)
  })

  test('should login successfully with valid credentials', async ({ page }) => {
    await page.goto('/login')

    // Fill login form
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'password123')

    // Submit form
    await page.click('button[type="submit"]')

    // Should redirect to analytics
    await expect(page).toHaveURL(/\/analytics/)
  })

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/login')

    await page.fill('input[type="email"]', 'wrong@example.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')

    // Should show error message
    await expect(page.locator('text=Invalid')).toBeVisible()
  })
})

test.describe('Analytics Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login')
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/analytics/)
  })

  test('should display key metrics', async ({ page }) => {
    // Check for metric cards
    await expect(page.locator('text=Total Revenue')).toBeVisible()
    await expect(page.locator('text=Total Deals')).toBeVisible()
    await expect(page.locator('text=Avg Deal Size')).toBeVisible()
    await expect(page.locator('text=Conversion Rate')).toBeVisible()
  })

  test('should display charts', async ({ page }) => {
    await expect(page.locator('text=Deals Pipeline')).toBeVisible()
    await expect(page.locator('text=Conversion Funnel')).toBeVisible()
    await expect(page.locator('text=Top Sources')).toBeVisible()
  })

  test('should show real-time indicator', async ({ page }) => {
    await expect(page.locator('text=Live').or(page.locator('text=Offline'))).toBeVisible()
  })

  test('should navigate to contacts page', async ({ page }) => {
    await page.click('text=Contacts')
    await expect(page).toHaveURL(/\/contacts/)
  })

  test('should navigate to deals page', async ({ page }) => {
    await page.click('text=Deals')
    await expect(page).toHaveURL(/\/deals/)
  })
})

test.describe('User Menu', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/analytics/)
  })

  test('should show user email', async ({ page }) => {
    await expect(page.locator('text=test').or(page.locator('text=viewer'))).toBeVisible()
  })

  test('should logout successfully', async ({ page }) => {
    await page.click('[title="Logout"]')
    await expect(page).toHaveURL(/\/login/)
  })
})

