import { test, expect } from '@playwright/test'

test.describe('Basic Chat Application Tests', () => {
  test('should display the chat page', async ({ page }) => {
    await page.goto('/chat')
    
    // Should show the header
    await expect(page.getByText('Select a conversation to start chatting')).toBeVisible()
  })

  test('should show empty state when no conversations exist', async ({ page }) => {
    // Mock empty conversations response
    await page.route('/api/conversations', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      })
    })

    await page.goto('/chat')
    
    // Should show empty state
    await expect(page.getByText('Create or select a conversation to start chatting')).toBeVisible()
    
    // Input should be disabled
    await expect(page.getByPlaceholder('Create or select a conversation first')).toBeDisabled()
  })

  test('should enable input after creating conversation', async ({ page }) => {
    // Mock conversation creation
    await page.route('/api/conversations', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'new-conv-id',
            title: 'New Conversation',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          })
        })
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        })
      }
    })

    await page.goto('/chat')
    
    // Try to find and click the New Conversation button
    // This might be in a drawer on mobile or sidebar on desktop
    const newConvButton = page.getByRole('button', { name: 'New Conversation' })
    
    // If button is not visible, try opening mobile menu
    if (!(await newConvButton.isVisible())) {
      const menuButton = page.getByRole('button', { name: '☰' })
      if (await menuButton.isVisible()) {
        await menuButton.click()
        await page.waitForTimeout(500) // Wait for drawer to open
      }
    }
    
    await newConvButton.click()
    
    // Input should now be enabled (wait a bit for state update)
    await page.waitForTimeout(1000)
    await expect(page.getByPlaceholder('输入你的消息...')).toBeEnabled()
  })
})