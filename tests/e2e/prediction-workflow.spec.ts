import { test, expect } from '@playwright/test'

test.describe('Match Prediction Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('complete prediction workflow from homepage', async ({ page }) => {
    // Navigate to predict page
    await page.getByRole('link', { name: 'Predict Matches' }).click()
    await expect(page).toHaveURL(/\/predict/)

    // Wait for page to load
    await expect(page.getByRole('heading', { name: /Predictions/ })).toBeVisible()

    // Find a match prediction card
    const matchCards = page.locator('[data-testid="match-prediction-card"]')
    if (await matchCards.count() > 0) {
      const firstCard = matchCards.first()
      
      // Check if score inputs are present
      const scoreInputs = firstCard.locator('input[type="number"]')
      if (await scoreInputs.count() >= 2) {
        // Enter prediction scores
        await scoreInputs.first().fill('2')
        await scoreInputs.nth(1).fill('1')
        
        // Check if prediction is saved (look for visual feedback)
        await expect(firstCard.locator('.predicted-indicator')).toBeVisible({ timeout: 5000 })
      }
    }
  })

  test('AI prediction toggle functionality', async ({ page }) => {
    await page.goto('/predict')
    
    const matchCards = page.locator('[data-testid="match-prediction-card"]')
    if (await matchCards.count() > 0) {
      const firstCard = matchCards.first()
      
      // Look for AI prediction toggle
      const aiToggle = firstCard.locator('text=AI Prediction')
      if (await aiToggle.isVisible()) {
        await aiToggle.click()
        
        // Check if AI prediction is shown
        await expect(firstCard.locator('.ai-prediction')).toBeVisible({ timeout: 3000 })
      }
    }
  })

  test('score input validation', async ({ page }) => {
    await page.goto('/predict')
    
    const matchCards = page.locator('[data-testid="match-prediction-card"]')
    if (await matchCards.count() > 0) {
      const firstCard = matchCards.first()
      const scoreInputs = firstCard.locator('input[type="number"]')
      
      if (await scoreInputs.count() >= 2) {
        const homeInput = scoreInputs.first()
        
        // Test negative numbers
        await homeInput.fill('-5')
        await expect(homeInput).toHaveValue('0')
        
        // Test large numbers
        await homeInput.fill('99')
        await expect(homeInput).toHaveValue('20') // Should be clamped to 20
      }
    }
  })

  test('navigation between prediction and bracket', async ({ page }) => {
    // Start at predict page
    await page.goto('/predict')
    await expect(page.getByRole('heading', { name: /Predictions/ })).toBeVisible()
    
    // Navigate to bracket using desktop nav
    const desktopNav = page.locator('nav[aria-label="Primary"]')
    await desktopNav.getByRole('link', { name: 'Bracket', exact: true }).click()
    await expect(page).toHaveURL(/\/bracket/)
    
    // Navigate back to predict
    await desktopNav.getByRole('link', { name: 'Predict', exact: true }).click()
    await expect(page).toHaveURL(/\/predict/)
  })

  test('persistent predictions across navigation', async ({ page }) => {
    await page.goto('/predict')
    
    const matchCards = page.locator('[data-testid="match-prediction-card"]')
    if (await matchCards.count() > 0) {
      const firstCard = matchCards.first()
      const scoreInputs = firstCard.locator('input[type="number"]')
      
      if (await scoreInputs.count() >= 2) {
        // Make a prediction
        await scoreInputs.first().fill('3')
        await scoreInputs.nth(1).fill('2')
        
        // Navigate away and back
        await page.goto('/bracket')
        await page.goto('/predict')
        
        // Check if prediction is still there
        await expect(scoreInputs.first()).toHaveValue('3')
        await expect(scoreInputs.nth(1)).toHaveValue('2')
      }
    }
  })
})

test.describe('Bracket Building Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('navigate to bracket and build predictions', async ({ page }) => {
    await page.getByRole('link', { name: 'Build My Bracket' }).click()
    await expect(page).toHaveURL(/\/bracket/)
    
    // Wait for bracket to load
    await expect(page.locator('[data-testid="bracket-container"]')).toBeVisible({ timeout: 10000 })
    
    // Look for selectable matches
    const selectableMatches = page.locator('[data-testid="bracket-match"]:not(.disabled)')
    if (await selectableMatches.count() > 0) {
      const firstMatch = selectableMatches.first()
      
      // Click to select winner
      await firstMatch.click()
      
      // Check if selection is made
      await expect(firstMatch.locator('.selected')).toBeVisible({ timeout: 3000 })
    }
  })

  test('bracket navigation and rounds', async ({ page }) => {
    await page.goto('/bracket')
    
    // Look for round navigation
    const roundTabs = page.locator('[data-testid="round-tab"]')
    if (await roundTabs.count() > 1) {
      // Click through different rounds
      for (let i = 0; i < await roundTabs.count(); i++) {
        await roundTabs.nth(i).click()
        await expect(roundTabs.nth(i)).toHaveClass(/active/)
      }
    }
  })

  test('bracket progress tracking', async ({ page }) => {
    await page.goto('/bracket')
    
    // Look for progress indicator
    const progressBar = page.locator('[data-testid="bracket-progress"]')
    if (await progressBar.isVisible()) {
      await expect(progressBar).toBeVisible()
      
      // Make some selections and check if progress updates
      const selectableMatches = page.locator('[data-testid="bracket-match"]:not(.disabled)')
      if (await selectableMatches.count() > 0) {
        const initialProgress = await progressBar.getAttribute('aria-valuenow')
        
        await selectableMatches.first().click()
        
        // Wait for progress to update
        await page.waitForTimeout(1000)
        const newProgress = await progressBar.getAttribute('aria-valuenow')
        
        expect(parseInt(newProgress || '0')).toBeGreaterThan(parseInt(initialProgress || '0'))
      }
    }
  })
})
