import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('navbar navigation works correctly', async ({ page }) => {
    // Use desktop nav links with exact role matching
    const desktopNav = page.locator('nav[aria-label="Primary"]')
    
    await desktopNav.getByRole('link', { name: 'Predict', exact: true }).click()
    await expect(page).toHaveURL('/predict')
    
    await desktopNav.getByRole('link', { name: 'Bracket', exact: true }).click()
    await expect(page).toHaveURL('/bracket')
    
    await desktopNav.getByRole('link', { name: 'Leagues', exact: true }).click()
    await expect(page).toHaveURL('/leagues')
  })

  test('brand logo navigates to homepage', async ({ page }) => {
    // Navigate away from home
    await page.goto('/predict')
    await expect(page).toHaveURL(/\/predict/)
    
    // Click brand logo (the FIFA World Cup image link)
    await page.getByRole('link', { name: /FIFA World Cup 2026/ }).click()
    await expect(page).toHaveURL('/')
  })

  test('direct URL navigation works', async ({ page }) => {
    const urls = ['/predict', '/bracket', '/leagues', '/profile']
    
    for (const url of urls) {
      await page.goto(url)
      await expect(page).toHaveURL(url)
      
      // Verify page loads without errors
      await expect(page.locator('body')).toBeVisible()
    }
  })

  test('browser back/forward navigation works', async ({ page }) => {
    // Navigate through several pages using direct goto
    await page.goto('/predict')
    await expect(page).toHaveURL(/\/predict/)
    
    await page.goto('/bracket')
    await expect(page).toHaveURL(/\/bracket/)
    
    await page.goto('/leagues')
    await expect(page).toHaveURL(/\/leagues/)
    
    // Test back navigation
    await page.goBack()
    await expect(page).toHaveURL(/\/bracket/)
    
    await page.goBack()
    await expect(page).toHaveURL(/\/predict/)
    
    // Test forward navigation
    await page.goForward()
    await expect(page).toHaveURL(/\/bracket/)
    
    await page.goForward()
    await expect(page).toHaveURL(/\/leagues/)
  })

  test('navigation persists scroll position appropriately', async ({ page }) => {
    // Go to a page with content
    await page.goto('/predict')
    
    // Scroll down
    await page.evaluate(() => window.scrollTo(0, 500))
    
    // Navigate away and back
    await page.goto('/bracket')
    await page.goto('/predict')
    
    // Check if scroll position is reset (typical behavior)
    const scrollY = await page.evaluate(() => window.scrollY)
    expect(scrollY).toBe(0)
  })
})
