import { test, expect } from '@playwright/test'

/**
 * E2E Tests для CSV Import Flow
 */

test.describe('CSV Import Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login')
    await page.click('text=Don\'t have an account? Sign up')
    await page.fill('input[type="email"]', 'csv@test.com')
    await page.fill('input[type="password"]', 'Test123!')
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/analytics/)
  })

  test('should navigate to import page', async ({ page }) => {
    await page.click('text=📥 Import')
    await expect(page).toHaveURL(/\/import/)
    await expect(page.locator('h1')).toContainText('Import Data')
  })

  test('should show supported sources', async ({ page }) => {
    await page.goto('/import')
    
    // Check supported CRMs
    await expect(page.locator('text=HubSpot')).toBeVisible()
    await expect(page.locator('text=Salesforce')).toBeVisible()
    await expect(page.locator('text=CSV/XLSX')).toBeVisible()
    await expect(page.locator('text=Pipedrive')).toBeVisible()
  })

  test('should start CSV upload flow', async ({ page }) => {
    await page.goto('/import')
    
    // Wait for wizard to load
    await page.waitForSelector('text=Select Data Source')
    
    // Click CSV option
    await page.click('text=CSV/XLSX File')
    
    // Should show upload step
    await expect(page.locator('text=Upload CSV File')).toBeVisible()
    await expect(page.locator('text=Click to upload or drag and drop')).toBeVisible()
  })

  test('should show template download link', async ({ page }) => {
    await page.goto('/import')
    await page.click('text=CSV/XLSX File')
    
    // Check template link exists
    await expect(page.locator('text=Download Template')).toBeVisible()
    
    const templateLink = page.locator('a[href="/templates/contacts-template.csv"]')
    await expect(templateLink).toBeVisible()
  })

  test('should show progress indicator', async ({ page }) => {
    await page.goto('/import')
    
    // Check wizard steps
    await expect(page.locator('text=Source')).toBeVisible()
    await expect(page.locator('text=Upload')).toBeVisible()
    await expect(page.locator('text=Mapping')).toBeVisible()
    await expect(page.locator('text=Import')).toBeVisible()
  })
})

test.describe('Import Wizard Steps', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.click('text=Don\'t have an account? Sign up')
    await page.fill('input[type="email"]', 'wizard@test.com')
    await page.fill('input[type="password"]', 'Test123!')
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/analytics/)
    await page.goto('/import')
  })

  test('should highlight current step', async ({ page }) => {
    // Step 1 should be active
    const step1 = page.locator('div:has-text("1")').first()
    await expect(step1).toHaveClass(/bg-blue-600/)
  })

  test('should show features on import page', async ({ page }) => {
    await expect(page.locator('text=Automatic Deduplication')).toBeVisible()
    await expect(page.locator('text=Smart Field Mapping')).toBeVisible()
    await expect(page.locator('text=Data Validation')).toBeVisible()
  })
})

