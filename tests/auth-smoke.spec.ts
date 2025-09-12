import { test, expect } from '@playwright/test'

test.describe('Auth Smoke Tests @auth-smoke', () => {
  test.beforeEach(async ({ page }) => {
    // Set AUTH_DEBUG env var if testing locally
    if (process.env.AUTH_DEBUG) {
      await page.addInitScript(() => {
        process.env.AUTH_DEBUG = 'true'
      })
    }
  })

  test('unauthenticated user cannot access protected routes', async ({ page }) => {
    // Visit root, should redirect to login
    await page.goto('/')
    await expect(page).toHaveURL('/login')
    
    // Try to access dashboard directly
    await page.goto('/dashboard')
    await expect(page).toHaveURL('/login')
    
    // Try to access projects
    await page.goto('/projects')
    await expect(page).toHaveURL('/login')
  })

  test('debug endpoint shows null session when logged out', async ({ page }) => {
    // Skip if AUTH_DEBUG is not enabled
    const debugEnabled = process.env.AUTH_DEBUG === 'true'
    test.skip(!debugEnabled, 'AUTH_DEBUG not enabled')
    
    const response = await page.request.get('/api/auth/_debug')
    
    if (response.ok()) {
      const data = await response.json()
      expect(data.sessionUser).toBeNull()
      expect(data.authenticated).toBe(false)
    }
  })

  test('login page shows only OAuth buttons in production', async ({ page }) => {
    await page.goto('/login')
    
    // Check for OAuth buttons
    await expect(page.getByText('Continue with Google')).toBeVisible()
    await expect(page.getByText('Continue with GitHub')).toBeVisible()
    
    // In production, email/password fields should not be visible
    const isProduction = process.env.NODE_ENV === 'production' || 
                        !process.env.NEXT_PUBLIC_ENABLE_CREDENTIALS_AUTH
    
    if (isProduction) {
      // Should NOT see email/password fields
      const emailField = page.locator('input[type="email"]')
      await expect(emailField).not.toBeVisible()
    }
  })

  test('OAuth buttons are clickable', async ({ page }) => {
    await page.goto('/login')
    
    // Google OAuth button
    const googleButton = page.getByText('Continue with Google')
    await expect(googleButton).toBeVisible()
    await expect(googleButton).toBeEnabled()
    
    // GitHub OAuth button  
    const githubButton = page.getByText('Continue with GitHub')
    await expect(githubButton).toBeVisible()
    await expect(githubButton).toBeEnabled()
  })

  test('no Aakansha auto-login on page load', async ({ page }) => {
    // Skip if AUTH_DEBUG is not enabled
    const debugEnabled = process.env.AUTH_DEBUG === 'true'
    test.skip(!debugEnabled, 'AUTH_DEBUG not enabled')
    
    // Clear all cookies first
    await page.context().clearCookies()
    
    // Visit the site
    await page.goto('/')
    
    // Should redirect to login, not auto-login
    await expect(page).toHaveURL('/login')
    
    // Check debug endpoint
    const response = await page.request.get('/api/auth/_debug')
    if (response.ok()) {
      const data = await response.json()
      
      // Should NOT be logged in as anyone
      expect(data.sessionUser).toBeNull()
      
      // Definitely should NOT be Aakansha
      if (data.sessionUser) {
        expect(data.sessionUser.email).not.toContain('aakansha')
      }
    }
  })

  test('cookie check shows no problematic cookies', async ({ page }) => {
    // Skip if AUTH_DEBUG is not enabled
    const debugEnabled = process.env.AUTH_DEBUG === 'true'
    test.skip(!debugEnabled, 'AUTH_DEBUG not enabled')
    
    await page.goto('/login')
    
    const response = await page.request.get('/api/auth/_cookiecheck')
    if (response.ok()) {
      const data = await response.json()
      
      // Should have no problematic cookies
      expect(data.problematicCookies).toBeNull()
      
      // Should not have URL mismatch
      expect(data.urlMismatch).toBeFalsy()
    }
  })

  test.describe('OAuth flow (manual)', () => {
    test.skip(({ browserName }) => browserName !== 'chromium', 
      'OAuth test only runs in Chromium')
    
    test('Google OAuth flow', async ({ page }) => {
      // This test requires manual intervention or mocking
      test.skip(true, 'Manual test - run with headed browser')
      
      await page.goto('/login')
      
      // Click Google OAuth
      await page.getByText('Continue with Google').click()
      
      // Would redirect to Google OAuth consent screen
      // Manual steps:
      // 1. Login with your Google account
      // 2. Approve consent
      // 3. Should redirect back to /dashboard
      
      // After manual OAuth:
      await expect(page).toHaveURL('/dashboard')
      
      // Check session
      const response = await page.request.get('/api/auth/_debug')
      const data = await response.json()
      
      expect(data.sessionUser).not.toBeNull()
      expect(data.sessionUser.email).toBeTruthy()
      // Should be YOUR email, not Aakansha
      expect(data.sessionUser.email).not.toContain('aakansha')
    })
  })

  test('logout clears session completely', async ({ page }) => {
    // This test assumes a logged-in state
    // In CI, this would need proper setup
    test.skip(true, 'Requires authenticated session')
    
    // Assuming logged in, find logout button
    await page.goto('/dashboard')
    
    // Look for logout button (adjust selector as needed)
    const logoutButton = page.locator('button[title="Sign out"]')
    if (await logoutButton.isVisible()) {
      await logoutButton.click()
      
      // Should redirect to login
      await expect(page).toHaveURL('/login')
      
      // Try to access protected route
      await page.goto('/dashboard')
      await expect(page).toHaveURL('/login')
      
      // Check debug endpoint
      const response = await page.request.get('/api/auth/_debug')
      if (response.ok()) {
        const data = await response.json()
        expect(data.sessionUser).toBeNull()
      }
    }
  })
})