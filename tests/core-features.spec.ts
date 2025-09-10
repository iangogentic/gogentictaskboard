import { test, expect } from '@playwright/test';

test.describe('Gogentic Portal Core Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3002');
    await page.waitForLoadState('networkidle');
  });

  test('Complete user flow', async ({ page }) => {
    // 1. Verify Projects Home page
    await expect(page.locator('h2:text("Projects")')).toBeVisible();
    await expect(page.getByText('Manage and track all Gogentic projects')).toBeVisible();
    
    // 2. Check project exists
    await expect(page.getByText('Onboarding Portal')).toBeVisible();
    
    // 3. Navigate to My Work
    await page.getByRole('link', { name: 'My Work' }).click();
    await expect(page.locator('h2:text("My Tasks")')).toBeVisible();
    
    // Check default user is Ian
    await expect(page.getByText('Tasks assigned to Ian')).toBeVisible();
    
    // 4. Switch user to Sarah
    const userDropdown = page.locator('select').last();
    await userDropdown.selectOption('Sarah');
    await expect(page.getByText('Tasks assigned to Sarah')).toBeVisible();
    
    // 5. Go back to Projects
    await page.getByRole('link', { name: 'Projects' }).click();
    
    // 6. Click on a project
    await page.getByRole('link', { name: 'Z-School Course Build' }).first().click();
    
    // 7. Verify project detail page
    await expect(page.locator('h1:text("Z-School Course Build")')).toBeVisible();
    
    // 8. Check Tasks tab
    await page.getByRole('button', { name: 'tasks' }).click();
    await expect(page.locator('h3:has-text("To Do")')).toBeVisible();
    await expect(page.locator('h3:has-text("In Progress")')).toBeVisible();
    await expect(page.locator('h3:has-text("Done")')).toBeVisible();
    
    // 9. Check Activity tab
    await page.getByRole('button', { name: 'activity' }).click();
    await expect(page.locator('h3:text("Activity Feed")')).toBeVisible();
    
    // 10. Go to Overview and get client share link
    await page.getByRole('button', { name: 'overview' }).click();
    const shareInput = page.locator('input[readonly]').first();
    const shareUrl = await shareInput.inputValue();
    expect(shareUrl).toContain('/share/');
    
    // 11. Visit client share page
    await page.goto(shareUrl);
    await expect(page.getByText('Project Status')).toBeVisible();
    await expect(page.getByText('Read-only view')).toBeVisible();
    
    // Verify no internal navigation on client page
    const projectsLink = page.getByRole('link', { name: 'Projects' });
    await expect(projectsLink).not.toBeVisible();
  });

  test('Branch defaults on new project', async ({ page }) => {
    // Navigate to new project page
    await page.getByRole('link', { name: 'New Project' }).click();
    await page.waitForURL('**/projects/new');
    
    // Verify form is visible
    await expect(page.locator('h1:text("New Project")')).toBeVisible();
    
    // Select FISHER branch
    await page.getByLabel('Branch').selectOption('FISHER');
    
    // Verify PM is auto-selected to Ian
    const pmValue = await page.getByLabel('Project Manager').inputValue();
    expect(pmValue).toContain('Ian');
    
    // Verify developers Mia and Luke are checked
    await expect(page.getByLabel('Mia')).toBeChecked();
    await expect(page.getByLabel('Luke')).toBeChecked();
  });
});