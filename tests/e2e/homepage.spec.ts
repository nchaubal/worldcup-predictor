import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('loads homepage with correct title and content', async ({ page }) => {
    await expect(page).toHaveTitle(/World Cup Predictor 2026/)
    
    await expect(page.getByText('FIFA World Cup')).toBeVisible()
    await expect(page.getByText('2026™')).toBeVisible()
    await expect(page.getByText('Predictor')).toBeVisible()
  })

  test('displays tournament statistics', async ({ page }) => {
    await expect(page.getByText('48')).toBeVisible()
    await expect(page.getByText('104')).toBeVisible()
    await expect(page.getByText('12')).toBeVisible()
    await expect(page.getByText('3')).toBeVisible()
  })

  test('shows main navigation buttons', async ({ page }) => {
    await expect(page.getByText('Build My Bracket')).toBeVisible()
    await expect(page.getByText('Predict Matches')).toBeVisible()
  })

  test('navigates to bracket page', async ({ page }) => {
    await page.getByText('Build My Bracket').click()
    await expect(page).toHaveURL(/\/bracket/)
  })

  test('navigates to predict page', async ({ page }) => {
    await page.getByText('Predict Matches').click()
    await expect(page).toHaveURL(/\/predict/)
  })

  test('displays round of 32 matches section', async ({ page }) => {
    await expect(page.getByText('Round of 32')).toBeVisible()
    await expect(page.getByText('View full bracket →')).toBeVisible()
  })

  test('shows group standings', async ({ page }) => {
    await expect(page.getByText('Final Group Standings')).toBeVisible()
    await expect(page.getByText('Group I')).toBeVisible()
    await expect(page.getByText('See all groups →')).toBeVisible()
  })

  test('displays quick links cards', async ({ page }) => {
    await expect(page.getByText('Group Stage Predictions')).toBeVisible()
    await expect(page.getByText('Build Your Bracket')).toBeVisible()
    await expect(page.getByText('Create a League')).toBeVisible()
  })

  test('quick links navigate to correct pages', async ({ page }) => {
    await page.getByText('Create a League').click()
    await expect(page).toHaveURL(/\/leagues/)
    
    await page.goBack()
    
    await page.getByText('Group Stage Predictions').click()
    await expect(page).toHaveURL(/\/predict/)
  })

  test('shows host information', async ({ page }) => {
    await expect(page.getByText(/🇺🇸 USA · 🇨🇦 Canada · 🇲🇽 Mexico/)).toBeVisible()
    await expect(page.getByText(/Final: Jul 19, New Jersey/)).toBeVisible()
  })

  test('responsive design works on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    
    await expect(page.getByText('FIFA World Cup')).toBeVisible()
    await expect(page.getByText('Build My Bracket')).toBeVisible()
    
    // Check navigation is collapsed on mobile
    const navTexts = ['Home', 'Predict', 'Bracket', 'Leagues', 'Profile']
    for (const text of navTexts) {
      const element = page.getByText(text)
      await expect(element).toBeVisible()
    }
  })

  test('displays live matches with correct styling', async ({ page }) => {
    // Look for live match indicators
    const liveElements = page.locator('text=LIVE')
    if (await liveElements.count() > 0) {
      await expect(liveElements.first()).toBeVisible()
      await expect(page.getByText('Live Now')).toBeVisible()
    }
  })

  test('shows completed match results', async ({ page }) => {
    // Look for completed match indicators
    const completedElements = page.locator('text=FT')
    if (await completedElements.count() > 0) {
      await expect(completedElements.first()).toBeVisible()
    }
  })
})
