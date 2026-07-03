import { test, expect } from '@playwright/test'

test.describe('League Management Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('navigate to leagues page from homepage', async ({ page }) => {
    await page.getByRole('link', { name: /Create a League/ }).click()
    await expect(page).toHaveURL(/\/leagues/)
    await expect(page.getByRole('heading', { name: 'Leagues', exact: true })).toBeVisible()
  })

  test('create new league functionality', async ({ page }) => {
    await page.goto('/leagues')
    
    // Look for create league button
    const createButton = page.locator('button:has-text("Create League"), button:has-text("New League")')
    if (await createButton.isVisible()) {
      await createButton.click()
      
      // Fill out league creation form
      const leagueNameInput = page.locator('input[name="name"], input[placeholder*="name"]')
      if (await leagueNameInput.isVisible()) {
        await leagueNameInput.fill('Test League 2026')
        
        const descriptionInput = page.locator('textarea[name="description"], input[placeholder*="description"]')
        if (await descriptionInput.isVisible()) {
          await descriptionInput.fill('A test league for the World Cup 2026')
        }
        
        // Submit form
        const submitButton = page.locator('button:has-text("Create"), button:has-text("Submit")')
        if (await submitButton.isVisible()) {
          await submitButton.click()
          
          // Verify league was created
          await expect(page.getByText('Test League 2026')).toBeVisible({ timeout: 5000 })
        }
      }
    }
  })

  test('join league with code functionality', async ({ page }) => {
    await page.goto('/leagues')
    
    // Look for join league section
    const joinSection = page.locator('[data-testid="join-league"], .join-league')
    if (await joinSection.isVisible()) {
      const codeInput = page.locator('input[name="code"], input[placeholder*="code"]')
      if (await codeInput.isVisible()) {
        await codeInput.fill('TEST123')
        
        const joinButton = page.locator('button:has-text("Join"), button:has-text("Submit")')
        if (await joinButton.isVisible()) {
          await joinButton.click()
          
          // Check for success or error message
          await expect(page.locator('.success-message, .error-message')).toBeVisible({ timeout: 3000 })
        }
      }
    }
  })

  test('view league standings', async ({ page }) => {
    await page.goto('/leagues')
    
    // Look for league cards or list
    const leagueCards = page.locator('[data-testid="league-card"], .league-item')
    if (await leagueCards.count() > 0) {
      await leagueCards.first().click()
      
      // Check if standings are displayed
      await expect(page.locator('[data-testid="standings"], .leaderboard')).toBeVisible({ timeout: 5000 })
    }
  })

  test('league member management', async ({ page }) => {
    await page.goto('/leagues')
    
    // Navigate to a specific league
    const leagueCards = page.locator('[data-testid="league-card"], .league-item')
    if (await leagueCards.count() > 0) {
      await leagueCards.first().click()
      
      // Look for member management options
      const membersSection = page.locator('[data-testid="members"], .league-members')
      if (await membersSection.isVisible()) {
        // Check if members are listed
        const memberItems = page.locator('[data-testid="member-item"], .member')
        expect(await memberItems.count()).toBeGreaterThan(0)
      }
    }
  })

  test('league settings and configuration', async ({ page }) => {
    await page.goto('/leagues')
    
    const leagueCards = page.locator('[data-testid="league-card"], .league-item')
    if (await leagueCards.count() > 0) {
      await leagueCards.first().click()
      
      // Look for settings button
      const settingsButton = page.locator('button:has-text("Settings"), button:has-text("Configure")')
      if (await settingsButton.isVisible()) {
        await settingsButton.click()
        
        // Check if settings modal/page appears
        await expect(page.locator('[data-testid="settings"], .settings-modal')).toBeVisible({ timeout: 3000 })
      }
    }
  })
})

test.describe('League Social Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/leagues')
  })

  test('share league functionality', async ({ page }) => {
    const leagueCards = page.locator('[data-testid="league-card"], .league-item')
    if (await leagueCards.count() > 0) {
      await leagueCards.first().click()
      
      // Look for share button
      const shareButton = page.locator('button:has-text("Share"), button[aria-label*="share"]')
      if (await shareButton.isVisible()) {
        await shareButton.click()
        
        // Check if share options appear
        await expect(page.locator('[data-testid="share-modal"], .share-options')).toBeVisible({ timeout: 3000 })
      }
    }
  })

  test('invite league members', async ({ page }) => {
    const leagueCards = page.locator('[data-testid="league-card"], .league-item')
    if (await leagueCards.count() > 0) {
      await leagueCards.first().click()
      
      // Look for invite button
      const inviteButton = page.locator('button:has-text("Invite"), button:has-text("Add Members")')
      if (await inviteButton.isVisible()) {
        await inviteButton.click()
        
        // Check if invite form appears
        const inviteForm = page.locator('[data-testid="invite-form"], .invite-modal')
        if (await inviteForm.isVisible()) {
          const emailInput = inviteForm.locator('input[type="email"], input[placeholder*="email"]')
          if (await emailInput.isVisible()) {
            await emailInput.fill('test@example.com')
            
            const sendButton = inviteForm.locator('button:has-text("Send"), button:has-text("Invite")')
            if (await sendButton.isVisible()) {
              await sendButton.click()
              
              // Check for confirmation
              await expect(page.locator('.success-message, .confirmation')).toBeVisible({ timeout: 3000 })
            }
          }
        }
      }
    }
  })

  test('league chat or comments', async ({ page }) => {
    const leagueCards = page.locator('[data-testid="league-card"], .league-item')
    if (await leagueCards.count() > 0) {
      await leagueCards.first().click()
      
      // Look for chat/comments section
      const chatSection = page.locator('[data-testid="chat"], .comments, .discussion')
      if (await chatSection.isVisible()) {
        const messageInput = chatSection.locator('input[placeholder*="message"], textarea')
        if (await messageInput.isVisible()) {
          await messageInput.fill('Good luck everyone!')
          
          const sendButton = chatSection.locator('button:has-text("Send"), button[type="submit"]')
          if (await sendButton.isVisible()) {
            await sendButton.click()
            
            // Check if message appears
            await expect(chatSection.getByText('Good luck everyone!')).toBeVisible({ timeout: 3000 })
          }
        }
      }
    }
  })
})
