import { test, expect } from '@playwright/test';

test.describe('Client Portal Tests', () => {
  test('client portal login page loads', async ({ page }) => {
    await page.goto('http://localhost:3002/client-portal');
    await expect(page).toHaveTitle(/GOGENTIC Portal/);
    await expect(page.locator('h1')).toContainText('Client Portal');
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('client portal projects page loads for valid email', async ({ page }) => {
    await page.goto('http://localhost:3002/client-portal/projects?email=egreenberg@zschool.com');
    await expect(page.locator('h1')).toContainText('Your Projects');
    
    // Check if projects are displayed
    const projectCards = page.locator('[data-testid="project-card"]');
    const count = await projectCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Client can enter email and navigate to projects', async ({ page }) => {
    // Go to client portal
    await page.goto('http://localhost:3002/client-portal');
    
    // Enter email
    await page.fill('input[type="email"]', 'egreenberg@zschool.com');
    
    // Submit form
    await page.locator('button[type="submit"]').click();
    
    // Should redirect to projects page
    await expect(page).toHaveURL(/client-portal\/projects\?email=egreenberg/);
    await expect(page.locator('h1')).toContainText('Your Projects');
  });

  test('share page loads without errors', async ({ page }) => {
    // Get a valid share token from projects page
    await page.goto('http://localhost:3002/client-portal/projects?email=egreenberg@zschool.com');
    
    // Extract a share link
    const shareLink = await page.locator('a[href*="/share/"]').first().getAttribute('href');
    
    if (shareLink) {
      // Navigate to share page
      await page.goto(`http://localhost:3002${shareLink}`);
      
      // Check page loads without errors
      await expect(page.locator('h1')).toBeVisible();
      
      // Check for any console errors
      const consoleErrors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });
      
      await page.waitForTimeout(2000);
      
      // Verify no JSON parsing errors
      const jsonErrors = consoleErrors.filter(err => 
        err.includes('JSON') || err.includes('Unexpected token')
      );
      expect(jsonErrors).toHaveLength(0);
    }
  });

  test('main dashboard redirects to login', async ({ page }) => {
    await page.goto('http://localhost:3002/dashboard');
    await expect(page).toHaveURL(/login/);
  });

  test('home page loads', async ({ page }) => {
    await page.goto('http://localhost:3002/');
    await expect(page.locator('h1')).toContainText('Mission Control');
  });
});