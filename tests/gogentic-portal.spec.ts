import { test, expect } from '@playwright/test';

test.describe('Gogentic Portal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3002');
  });

  test('Projects Home page displays correctly', async ({ page }) => {
    await expect(page.locator('h2:text("Projects")')).toBeVisible();
    await expect(page.getByText('Manage and track all Gogentic projects')).toBeVisible();
    
    // Check if projects table is visible
    const projectRows = page.locator('tbody tr');
    const rowCount = await projectRows.count();
    expect(rowCount).toBeGreaterThanOrEqual(3);
    
    // Verify project details are visible
    await expect(page.getByText('Onboarding Portal')).toBeVisible();
    await expect(page.getByRole('table').getByText('FISHER').first()).toBeVisible();
    await expect(page.getByText('Planning')).toBeVisible();
  });

  test('Branch filters work correctly', async ({ page }) => {
    // Wait for table to load
    await page.waitForSelector('tbody tr');
    
    // Test CORTEX filter - select by value since the option text is "Cortex"
    const branchFilter = page.locator('select').first();
    await branchFilter.selectOption({ value: 'CORTEX' });
    
    // Wait for filtered results
    await page.waitForTimeout(500);
    
    await expect(page.getByText('Z-School Course Build')).toBeVisible();
    
    // Reset filter
    await branchFilter.selectOption({ value: '' });
  });

  test('Search functionality works', async ({ page }) => {
    await page.getByPlaceholder('Search projects...').fill('Z-School');
    await expect(page.getByText('Z-School Course Build')).toBeVisible();
    await expect(page.getByText('Onboarding Portal')).not.toBeVisible();
  });

  test('New project creation with branch defaults', async ({ page }) => {
    await page.getByRole('link', { name: 'New Project' }).click();
    await page.waitForURL('**/projects/new');
    
    // Fill basic info
    await page.getByLabel('Project Title').fill('Test Project from Playwright');
    
    // Select FISHER branch and verify defaults
    await page.getByLabel('Branch').selectOption('FISHER');
    
    // Verify PM is set to Ian
    const pmSelect = page.getByLabel('Project Manager');
    await expect(pmSelect).toHaveValue(/Ian/);
    
    // Verify developers include Mia and Luke
    await expect(page.getByLabel('Mia')).toBeChecked();
    await expect(page.getByLabel('Luke')).toBeChecked();
    
    // Fill client info
    await page.getByLabel('Client Name').fill('Test Client');
    await page.getByLabel('Client Email').fill('test@client.com');
    
    // Submit form
    await page.getByRole('button', { name: 'Create Project' }).click();
    
    // Verify redirect to new project
    await page.waitForURL(/\/projects\/[a-z0-9]+$/);
    await expect(page.locator('h1:text("Test Project from Playwright")')).toBeVisible();
  });

  test('Kanban board drag and drop', async ({ page }) => {
    // Navigate to first project's tasks
    await page.getByRole('link', { name: 'Onboarding Portal' }).click();
    await page.getByRole('button', { name: 'tasks' }).click();
    
    // Verify Kanban board is visible
    await expect(page.getByText('To Do')).toBeVisible();
    await expect(page.getByText('In Progress')).toBeVisible();
    await expect(page.getByText('Review')).toBeVisible();
    await expect(page.getByText('Done')).toBeVisible();
    
    // Note: Actual drag-and-drop testing requires more complex Playwright setup
    // with dragTo() or manual mouse events
  });

  test('Task creation in Kanban', async ({ page }) => {
    // Navigate to project tasks
    await page.getByRole('link', { name: 'Onboarding Portal' }).click();
    await page.getByRole('button', { name: 'tasks' }).click();
    
    // Add new task to Todo column
    const todoColumn = page.locator('div:has(h3:text("To Do"))');
    await todoColumn.getByRole('button', { name: '+' }).click();
    
    await page.getByPlaceholder('Task title...').fill('Test task from Playwright');
    await page.getByPlaceholder('Task title...').press('Enter');
    
    // Verify task was created
    await expect(page.getByText('Test task from Playwright')).toBeVisible();
  });

  test('Activity feed shows updates', async ({ page }) => {
    // Navigate to project activity
    await page.getByRole('link', { name: 'Onboarding Portal' }).click();
    await page.getByRole('button', { name: 'activity' }).click();
    
    // Verify activity feed is visible
    await expect(page.getByText('Activity')).toBeVisible();
    
    // Check for auto-generated updates
    const updates = page.locator('div:has(> div > div:text("Ian"))');
    const updateCount = await updates.count();
    expect(updateCount).toBeGreaterThan(0);
  });

  test('My Work page filters by user', async ({ page }) => {
    await page.goto('http://localhost:3002/my-work');
    
    // Wait for page to load
    await page.waitForSelector('h2:text("My Tasks")');
    
    // Default user should be Ian
    await expect(page.getByText('Tasks assigned to Ian')).toBeVisible();
    
    // Switch to Sarah
    await page.getByRole('combobox').selectOption('Sarah');
    await expect(page.getByText('Tasks assigned to Sarah')).toBeVisible();
    
    // Verify Sarah's tasks are shown
    await expect(page.getByText('Build interactive exercises')).toBeVisible();
  });

  test('Client share page is read-only', async ({ page }) => {
    // Navigate to a project to get share link
    await page.getByRole('link', { name: 'Z-School Course Build' }).click();
    
    // Get the share link
    const shareInput = page.locator('input[readonly]').first();
    const shareUrl = await shareInput.inputValue();
    
    // Navigate to share page
    await page.goto(shareUrl);
    
    // Verify read-only view
    await expect(page.getByText('Project Status')).toBeVisible();
    await expect(page.getByText('Read-only view for Eric')).toBeVisible();
    
    // Verify no navigation links
    await expect(page.getByRole('link', { name: 'Projects' })).not.toBeVisible();
    await expect(page.getByRole('link', { name: 'My Work' })).not.toBeVisible();
    
    // Verify project info is visible
    await expect(page.getByText('Z-School Course Build')).toBeVisible();
    await expect(page.getByText('Progress Overview')).toBeVisible();
    await expect(page.getByText('Recent Updates')).toBeVisible();
  });

  test('User switching persists across pages', async ({ page }) => {
    // Wait for page to load
    await page.waitForSelector('h2:text("Projects")');
    
    // Find user dropdown (it's the last select on the page)
    const userDropdown = page.locator('select').last();
    
    // Switch user on home page
    await userDropdown.selectOption('Matthew');
    
    // Navigate to My Work
    await page.getByRole('link', { name: 'My Work' }).click();
    
    // Verify user is still Matthew
    await expect(page.getByText('Tasks assigned to Matthew')).toBeVisible();
    
    // Navigate back to Projects
    await page.getByRole('link', { name: 'Projects' }).click();
    
    // Verify user is still Matthew in dropdown
    const dropdownValue = await page.locator('select').last().inputValue();
    expect(dropdownValue).toContain('Matthew');
  });
});