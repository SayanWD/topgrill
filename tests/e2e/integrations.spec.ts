import { test, expect } from '@playwright/test'

/**
 * E2E Tests для CRM Integrations
 */

test.describe('CRM Integrations Page', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login')
    
    // Click "Sign up" link
    await page.click('text=Don\'t have an account? Sign up')
    
    // Fill registration form
    await page.fill('input[type="email"]', 'test@integrations.com')
    await page.fill('input[type="password"]', 'Test123!')
    await page.click('button[type="submit"]')
    
    // Wait for redirect to analytics
    await page.waitForURL(/\/analytics/)
  })

  test('should display integrations page', async ({ page }) => {
    await page.goto('/integrations')
    
    // Check page title
    await expect(page.locator('h1')).toContainText('CRM Integrations')
    
    // Check description
    await expect(page.locator('text=Connect your CRM systems')).toBeVisible()
  })

  test('should show available CRM options', async ({ page }) => {
    await page.goto('/integrations')
    
    // Check all CRM options are displayed
    await expect(page.locator('text=amoCRM')).toBeVisible()
    await expect(page.locator('text=HubSpot')).toBeVisible()
    await expect(page.locator('text=Salesforce')).toBeVisible()
    await expect(page.locator('text=Pipedrive')).toBeVisible()
    
    // Check icons
    await expect(page.locator('text=🟢')).toBeVisible() // amoCRM
    await expect(page.locator('text=🟠')).toBeVisible() // HubSpot
    await expect(page.locator('text=⚡')).toBeVisible() // Salesforce
  })

  test('should open amoCRM connection form', async ({ page }) => {
    await page.goto('/integrations')
    
    // Click amoCRM card
    await page.click('text=amoCRM')
    
    // Connection form should appear
    await expect(page.locator('text=Connect amoCRM')).toBeVisible()
    await expect(page.locator('text=amoCRM Subdomain')).toBeVisible()
    await expect(page.locator('input[placeholder="yourcompany"]')).toBeVisible()
  })

  test('should validate subdomain input', async ({ page }) => {
    await page.goto('/integrations')
    await page.click('text=amoCRM')
    
    // Try to connect without subdomain
    await page.click('text=Connect via OAuth')
    
    // Should show alert (or validation message)
    page.on('dialog', (dialog) => {
      expect(dialog.message()).toContain('subdomain')
      dialog.accept()
    })
  })

  test('should allow entering subdomain', async ({ page }) => {
    await page.goto('/integrations')
    await page.click('text=amoCRM')
    
    // Fill subdomain
    await page.fill('input[placeholder="yourcompany"]', 'topgrillkz')
    
    // Check value
    const input = await page.locator('input[placeholder="yourcompany"]')
    await expect(input).toHaveValue('topgrillkz')
  })

  test('should open HubSpot connection form', async ({ page }) => {
    await page.goto('/integrations')
    
    // Click HubSpot
    await page.click('text=HubSpot')
    
    // Form should appear
    await expect(page.locator('text=Connect HubSpot')).toBeVisible()
    await expect(page.locator('text=Private App Access Token')).toBeVisible()
  })

  test('should show connected integrations as empty initially', async ({ page }) => {
    await page.goto('/integrations')
    
    // Check for empty state
    await expect(
      page.locator('text=No CRM systems connected yet')
    ).toBeVisible()
  })

  test('should close connection form', async ({ page }) => {
    await page.goto('/integrations')
    await page.click('text=amoCRM')
    
    // Form is open
    await expect(page.locator('text=Connect amoCRM')).toBeVisible()
    
    // Click close button (X)
    await page.click('button:has-text("✕")')
    
    // Form should close, show CRM options again
    await expect(page.locator('text=amoCRM')).toBeVisible()
    await expect(page.locator('text=Connect amoCRM')).not.toBeVisible()
  })
})

test.describe('Integration Benefits', () => {
  test.beforeEach(async ({ page }) => {
    // Quick login
    await page.goto('/login')
    await page.click('text=Don\'t have an account? Sign up')
    await page.fill('input[type="email"]', 'benefits@test.com')
    await page.fill('input[type="password"]', 'Test123!')
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/analytics/)
  })

  test('should display integration benefits', async ({ page }) => {
    await page.goto('/integrations')
    
    // Check benefit cards
    await expect(page.locator('text=Auto Sync')).toBeVisible()
    await expect(page.locator('text=Secure OAuth')).toBeVisible()
    await expect(page.locator('text=Real-time Insights')).toBeVisible()
  })
})

test.describe('Navigation', () => {
  test('should have integrations link in nav', async ({ page }) => {
    await page.goto('/login')
    await page.click('text=Don\'t have an account? Sign up')
    await page.fill('input[type="email"]', 'nav@test.com')
    await page.fill('input[type="password"]', 'Test123!')
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/analytics/)
    
    // Check navigation
    await expect(page.locator('text=🔗 Integrations')).toBeVisible()
    
    // Click navigation
    await page.click('text=🔗 Integrations')
    
    // Should navigate
    await expect(page).toHaveURL(/\/integrations/)
  })
})

