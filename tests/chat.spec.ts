import { test, expect } from '@playwright/test'

test.describe('Chat Application', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the chat page
    await page.goto('/chat')
  })

  test('should display initial empty state', async ({ page }) => {
    // Should show the empty state message
    await expect(page.getByText('Create or select a conversation to start chatting')).toBeVisible()
    
    // Input should be disabled initially
    await expect(page.getByPlaceholder('Create or select a conversation first')).toBeDisabled()
    
    // Send button should be disabled
    await expect(page.getByRole('button', { name: 'send' })).toBeDisabled()
  })

  test('should create a new conversation', async ({ page }) => {
    // For this test, we'll mock the API responses since DB connectivity is limited
    await page.route('/api/conversations', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'test-conversation-id',
            title: 'New Conversation',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          })
        })
      } else if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        })
      }
    })

    // Check if we're on desktop or mobile view
    const isMobile = await page.evaluate(() => window.innerWidth <= 768)
    
    if (isMobile) {
      // Click hamburger menu to open drawer
      await page.getByRole('button', { name: '☰' }).click()
      await expect(page.getByText('Conversations')).toBeVisible()
    }

    // Click new conversation button
    await page.getByRole('button', { name: 'New Conversation' }).click()
    
    // Should show success message
    await expect(page.getByText('New conversation created')).toBeVisible()
    
    // Input should now be enabled
    await expect(page.getByPlaceholder('输入你的消息...')).toBeEnabled()
  })

  test('should send a message and receive AI response', async ({ page }) => {
    // Mock the conversation creation and API calls
    await page.route('/api/conversations', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'test-conversation-id',
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

    // Mock the chat API
    await page.route('/api/chat', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'text/plain; charset=utf-8',
        body: `data: {"type":"text","text":"Hello! How can I help you today?"}

data: {"type":"finish"}

`
      })
    })

    // Create a conversation first
    const isMobile = await page.evaluate(() => window.innerWidth <= 768)
    if (isMobile) {
      await page.getByRole('button', { name: '☰' }).click()
    }
    await page.getByRole('button', { name: 'New Conversation' }).click()
    
    // Wait for conversation to be created
    await page.waitForTimeout(1000)
    
    // Type a message
    await page.getByPlaceholder('输入你的消息...').fill('Hello, how are you?')
    
    // Send the message
    await page.getByRole('button', { name: 'send' }).click()
    
    // Should show user message
    await expect(page.getByText('Hello, how are you?')).toBeVisible()
    
    // Should show AI response
    await expect(page.getByText('Hello! How can I help you today?')).toBeVisible()
  })

  test('should test weather tool functionality', async ({ page }) => {
    // Mock the conversation and chat APIs with weather tool response
    await page.route('/api/conversations', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'test-conversation-id',
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

    await page.route('/api/chat', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'text/plain; charset=utf-8',
        body: `data: {"type":"tool-call","toolCallId":"call_1","toolName":"weather","args":{"location":"New York"}}

data: {"type":"tool-result","toolCallId":"call_1","toolName":"weather","result":{"location":"New York","temperature":72}}

data: {"type":"text","text":"The weather in New York is 72°F."}

data: {"type":"finish"}

`
      })
    })

    // Create conversation and ask about weather
    const isMobile = await page.evaluate(() => window.innerWidth <= 768)
    if (isMobile) {
      await page.getByRole('button', { name: '☰' }).click()
    }
    await page.getByRole('button', { name: 'New Conversation' }).click()
    
    await page.waitForTimeout(1000)
    
    await page.getByPlaceholder('输入你的消息...').fill('What is the weather in New York?')
    await page.getByRole('button', { name: 'send' }).click()
    
    // Should show weather response
    await expect(page.getByText(/weather.*New York.*72/)).toBeVisible()
  })

  test('should handle conversation switching', async ({ page }) => {
    // Mock conversations list
    await page.route('/api/conversations', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 'conv-1',
              title: 'First Conversation',
              createdAt: '2023-01-01T00:00:00Z',
              updatedAt: '2023-01-01T00:00:00Z'
            },
            {
              id: 'conv-2',
              title: 'Second Conversation',
              createdAt: '2023-01-02T00:00:00Z',
              updatedAt: '2023-01-02T00:00:00Z'
            }
          ])
        })
      }
    })

    // Mock conversation details
    await page.route('/api/conversations/conv-1', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          conversation: { id: 'conv-1', title: 'First Conversation' },
          messages: [
            { id: 'msg-1', role: 'user', content: 'Hello from first conversation' },
            { id: 'msg-2', role: 'assistant', content: 'Hi there!' }
          ]
        })
      })
    })

    await page.route('/api/conversations/conv-2', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          conversation: { id: 'conv-2', title: 'Second Conversation' },
          messages: [
            { id: 'msg-3', role: 'user', content: 'Hello from second conversation' }
          ]
        })
      })
    })

    // Reload page to load conversations
    await page.reload()
    
    const isMobile = await page.evaluate(() => window.innerWidth <= 768)
    if (isMobile) {
      await page.getByRole('button', { name: '☰' }).click()
    }

    // Should see both conversations
    await expect(page.getByText('First Conversation')).toBeVisible()
    await expect(page.getByText('Second Conversation')).toBeVisible()
    
    // Click on first conversation
    await page.getByText('First Conversation').click()
    
    // Should load first conversation messages
    await expect(page.getByText('Hello from first conversation')).toBeVisible()
    await expect(page.getByText('Hi there!')).toBeVisible()
    
    // Switch to second conversation
    if (isMobile) {
      await page.getByRole('button', { name: '☰' }).click()
    }
    await page.getByText('Second Conversation').click()
    
    // Should load second conversation messages
    await expect(page.getByText('Hello from second conversation')).toBeVisible()
    // First conversation messages should not be visible
    await expect(page.getByText('Hello from first conversation')).not.toBeVisible()
  })

  test('should delete conversations', async ({ page }) => {
    // Mock conversations list
    await page.route('/api/conversations', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 'conv-to-delete',
              title: 'Conversation to Delete',
              createdAt: '2023-01-01T00:00:00Z',
              updatedAt: '2023-01-01T00:00:00Z'
            }
          ])
        })
      }
    })

    // Mock delete API
    await page.route('/api/conversations/conv-to-delete', async route => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        })
      }
    })

    await page.reload()
    
    const isMobile = await page.evaluate(() => window.innerWidth <= 768)
    if (isMobile) {
      await page.getByRole('button', { name: '☰' }).click()
    }

    // Should see the conversation
    await expect(page.getByText('Conversation to Delete')).toBeVisible()
    
    // Click delete button
    await page.getByRole('button', { name: 'delete' }).click()
    
    // Should show success message
    await expect(page.getByText('Conversation deleted')).toBeVisible()
  })

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Should show hamburger menu
    await expect(page.getByRole('button', { name: '☰' })).toBeVisible()
    
    // Sidebar should be hidden initially
    await expect(page.getByText('Conversations')).not.toBeVisible()
    
    // Click hamburger menu
    await page.getByRole('button', { name: '☰' }).click()
    
    // Drawer should open
    await expect(page.getByText('Conversations')).toBeVisible()
    
    // Should show new conversation button in drawer
    await expect(page.getByRole('button', { name: 'New Conversation' })).toBeVisible()
  })
})