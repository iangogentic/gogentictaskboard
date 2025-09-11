import { test, expect } from '@playwright/test';

test.describe('Gogentic Portal Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home with password if needed
    const pass = process.env.APP_PASSWORD || 'test';
    await page.goto(`/?pass=${pass}`);
  });

  test('health check endpoint works', async ({ page }) => {
    const response = await page.request.get('/api/health');
    expect(response.ok()).toBeTruthy();
    const json = await response.json();
    expect(json.ok).toBe(true);
  });

  test('create project → add task → drag to progress', async ({ page }) => {
    // Navigate to projects
    await page.goto('/projects');
    await expect(page).toHaveTitle(/Gogentic Portal/);
    
    // Click new project button
    await page.getByRole('link', { name: /new project/i }).click();
    
    // Fill in project details
    await page.getByLabel(/project name/i).fill('Smoke Test Project');
    await page.getByLabel(/branch/i).selectOption('CORTEX');
    await page.getByLabel(/client name/i).fill('Test Client');
    await page.getByLabel(/client email/i).fill('test@example.com');
    
    // Create project
    await page.getByRole('button', { name: /create project/i }).click();
    
    // Should redirect to project detail
    await expect(page.getByRole('heading', { name: 'Smoke Test Project' })).toBeVisible();
    
    // Navigate to tasks tab
    await page.getByRole('tab', { name: /tasks/i }).click();
    
    // Add a new task in Todo column
    const todoColumn = page.locator('[data-column="Todo"]');
    await todoColumn.getByRole('button', { name: '+' }).click();
    
    // Fill task details
    await page.getByPlaceholder(/task title/i).fill('First Test Task');
    await page.keyboard.press('Enter');
    
    // Verify task appears
    await expect(page.getByText('First Test Task')).toBeVisible();
    
    // Drag task to In Progress
    const task = page.getByText('First Test Task');
    const inProgressColumn = page.locator('[data-column="Doing"]');
    
    // Perform drag and drop
    await task.hover();
    await page.mouse.down();
    await inProgressColumn.hover();
    await page.mouse.up();
    
    // Verify task moved
    await expect(inProgressColumn.getByText('First Test Task')).toBeVisible();
  });

  test('my work page shows user tasks', async ({ page }) => {
    await page.goto('/my-work');
    await expect(page.getByRole('heading', { name: /my work/i })).toBeVisible();
    
    // Should show task columns
    await expect(page.getByText('To Do')).toBeVisible();
    await expect(page.getByText('In Progress')).toBeVisible();
    await expect(page.getByText('Review')).toBeVisible();
    await expect(page.getByText('Done')).toBeVisible();
  });

  test('client share page is publicly accessible', async ({ page }) => {
    // First get a project with share token
    await page.goto('/projects');
    
    // Click on first project
    const firstProject = page.locator('table tbody tr').first();
    await firstProject.click();
    
    // Get share link
    const shareLink = await page.getByText(/share\//).textContent();
    if (shareLink) {
      const token = shareLink.split('/share/')[1];
      
      // Navigate to share page (should work without auth)
      await page.goto(`/share/${token}`);
      
      // Should show project info
      await expect(page.getByText(/project status/i)).toBeVisible();
    }
  });

  test('reports page loads', async ({ page }) => {
    await page.goto('/reports');
    await expect(page.getByRole('heading', { name: /reports/i })).toBeVisible();
  });

  test('user switcher works', async ({ page }) => {
    await page.goto('/');
    
    // Find user switcher
    const userSwitcher = page.getByRole('button', { name: /current user/i });
    if (await userSwitcher.isVisible()) {
      await userSwitcher.click();
      
      // Should show user options
      await expect(page.getByRole('menuitem')).toHaveCount(6); // 6 seeded users
    }
  });
});

test.describe('Time Tracking', () => {
  test('can add time entry to task', async ({ page }) => {
    const pass = process.env.APP_PASSWORD || 'test';
    await page.goto(`/projects?pass=${pass}`);
    
    // Navigate to first project
    const firstProject = page.locator('table tbody tr').first();
    await firstProject.click();
    
    // Go to tasks tab
    await page.getByRole('tab', { name: /tasks/i }).click();
    
    // Find a task with time tracking
    const taskWithTime = page.locator('[data-task-id]').first();
    if (await taskWithTime.isVisible()) {
      // Click on time icon if present
      const timeButton = taskWithTime.getByRole('button', { name: /time/i });
      if (await timeButton.isVisible()) {
        await timeButton.click();
        
        // Add time entry
        await page.getByLabel(/hours/i).fill('2');
        await page.getByLabel(/description/i).fill('Working on task');
        await page.getByRole('button', { name: /save/i }).click();
        
        // Verify time was added
        await expect(page.getByText(/2h/)).toBeVisible();
      }
    }
  });
});