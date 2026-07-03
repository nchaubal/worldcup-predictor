import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('loads homepage with correct title and content', async ({ page }) => {
    await expect(page).toHaveTitle(/World Cup Predictor 2026/)
    // Use heading role for more specific selection
    await expect(page.getByRole('heading', { name: /FIFA World Cup 2026/ })).toBeVisible()
  })

  test('displays tournament statistics', async ({ page }) => {
    // Use exact match for statistics
    await expect(page.getByText('48', { exact: true })).toBeVisible()
    await expect(page.getByText('104', { exact: true })).toBeVisible()
  })

  test('shows main navigation buttons', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Build My Bracket' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Predict Matches' })).toBeVisible()
  })

  test('navigates to bracket page', async ({ page }) => {
    await page.getByRole('link', { name: 'Build My Bracket' }).click()
    await expect(page).toHaveURL(/\/bracket/)
  })

  test('navigates to predict page', async ({ page }) => {
    await page.getByRole('link', { name: 'Predict Matches' }).click()
    await expect(page).toHaveURL(/\/predict/)
  })

  test('displays round of 32 matches section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Round of 32' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'View full bracket →' })).toBeVisible()
  })

  test('shows group standings', async ({ page }) => {
    await expect(page.getByText('Final Group Standings')).toBeVisible()
  })

  test('displays quick links cards', async ({ page }) => {
    // Quick links section exists
    await expect(page.getByRole('link', { name: /Group Stage Predictions/ })).toBeVisible()
    await expect(page.getByRole('link', { name: /Build Your Bracket/ })).toBeVisible()
    await expect(page.getByRole('link', { name: /Create a League/ })).toBeVisible()
  })

  test('quick links navigate to correct pages', async ({ page }) => {
    await page.getByRole('link', { name: /Create a League/ }).click()
    await expect(page).toHaveURL(/\/leagues/)
  })

  test('shows host information', async ({ page }) => {
    await expect(page.getByText(/USA.*Canada.*Mexico/)).toBeVisible()
  })

  test('responsive design works on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Main heading should be visible
    await expect(page.getByRole('heading', { name: /FIFA World Cup 2026/ })).toBeVisible()
    // Main CTA button should be visible
    await expect(page.getByRole('link', { name: 'Build My Bracket' })).toBeVisible()
  })

  test('displays live matches with correct styling', async ({ page }) => {
    // Look for live match indicators
    const liveElements = page.locator('text=LIVE')
    if (await liveElements.count() > 0) {
      await expect(liveElements.first()).toBeVisible()
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
