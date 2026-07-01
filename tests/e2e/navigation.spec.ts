import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('navbar navigation works correctly', async ({ page }) => {
    const navLinks = [
      { text: 'Home', expectedUrl: '/' },
      { text: 'Predict', expectedUrl: '/predict' },
      { text: 'Bracket', expectedUrl: '/bracket' },
      { text: 'Leagues', expectedUrl: '/leagues' },
      { text: 'Profile', expectedUrl: '/profile' }
    ]

    for (const link of navLinks) {
      await page.getByText(link.text).click()
      await expect(page).toHaveURL(link.expectedUrl)
      
      // Verify active state
      const activeLink = page.locator(`a:has-text("${link.text}")`)
      await expect(activeLink).toHaveClass(/text-primary/)
    }
  })

  test('brand logo navigates to homepage', async ({ page }) => {
    // Navigate away from home
    await page.getByText('Predict').click()
    await expect(page).toHaveURL(/\/predict/)
    
    // Click brand logo
    await page.locator('.brand-logo, a:has-text("WC Predictor")').click()
    await expect(page).toHaveURL('/')
  })

  test('navigation active states update correctly', async ({ page }) => {
    // Test each navigation item
    const navItems = ['Home', 'Predict', 'Bracket', 'Leagues', 'Profile']
    
    for (const item of navItems) {
      await page.getByText(item).click()
      
      // Check that this item is active
      const activeItem = page.locator(`a:has-text("${item}")`)
      await expect(activeItem).toHaveClass(/text-primary/)
      
      // Check that other items are not active
      for (const otherItem of navItems) {
        if (otherItem !== item) {
          const otherNav = page.locator(`a:has-text("${otherItem}")`)
          await expect(otherNav).not.toHaveClass(/text-primary/)
        }
      }
    }
  })

  test('mobile navigation works', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Test navigation on mobile
    await page.getByText('Predict').click()
    await expect(page).toHaveURL(/\/predict/)
    
    await page.getByText('Bracket').click()
    await expect(page).toHaveURL(/\/bracket/)
    
    await page.getByText('Home').click()
    await expect(page).toHaveURL('/')
  })

  test('nested routes maintain correct active state', async ({ page }) => {
    // This test assumes there might be nested routes
    await page.goto('/predict/some-group')
    
    // Predict should still be active
    const predictLink = page.locator('a:has-text("Predict")')
    await expect(predictLink).toHaveClass(/text-primary/)
  })

  test('browser back/forward navigation works', async ({ page }) => {
    // Navigate through several pages
    await page.getByText('Predict').click()
    await expect(page).toHaveURL(/\/predict/)
    
    await page.getByText('Bracket').click()
    await expect(page).toHaveURL(/\/bracket/)
    
    await page.getByText('Leagues').click()
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

  test('direct URL navigation works', async ({ page }) => {
    const urls = ['/predict', '/bracket', '/leagues', '/profile']
    
    for (const url of urls) {
      await page.goto(url)
      await expect(page).toHaveURL(url)
      
      // Verify page loads without errors
      await expect(page.locator('body')).toBeVisible()
    }
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
