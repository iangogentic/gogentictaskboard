import { test, expect } from "@playwright/test";

test.describe("GPT-5 Agent Chat", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto("http://localhost:3002");

    // Wait for the page to load
    await page.waitForLoadState("networkidle");
  });

  test("should display the floating chat button", async ({ page }) => {
    // Check if the floating button is visible
    const chatButton = page.locator('button[aria-label="Open AI Assistant"]');
    await expect(chatButton).toBeVisible();

    // Verify button has correct styling
    await expect(chatButton).toHaveClass(/fixed bottom-6 right-6/);
  });

  test("should open chat panel when button is clicked", async ({ page }) => {
    // Click the chat button
    const chatButton = page.locator('button[aria-label="Open AI Assistant"]');
    await chatButton.click();

    // Check if chat panel opens
    const chatPanel = page.locator("text=AI Assistant");
    await expect(chatPanel).toBeVisible();

    // Check for welcome message
    const welcomeText = page.locator("text=/Hello.*AI assistant/");
    await expect(welcomeText).toBeVisible();
  });

  test("should send message to GPT-5 and receive response", async ({
    page,
  }) => {
    // Open chat panel
    const chatButton = page.locator('button[aria-label="Open AI Assistant"]');
    await chatButton.click();

    // Type a test message
    const input = page.locator('input[placeholder="Type your message..."]');
    await input.fill("Hello GPT-5, what model are you using?");

    // Send the message
    const sendButton = page.locator('button[type="submit"]');
    await sendButton.click();

    // Wait for response (GPT-5 might take a moment to respond)
    await page.waitForResponse(
      (response) => response.url().includes("/api/agent/chat"),
      { timeout: 30000 }
    );

    // Check if user message appears
    const userMessage = page.locator(
      'text="Hello GPT-5, what model are you using?"'
    );
    await expect(userMessage).toBeVisible();

    // Check if there's an AI response
    const aiResponse = page.locator(".text-gray-800").last();
    await expect(aiResponse).toBeVisible();
  });

  test("should verify GPT-5 model is being used", async ({ page }) => {
    // Intercept the API response
    let apiResponse: any = null;

    page.on("response", async (response) => {
      if (response.url().includes("/api/agent/chat")) {
        apiResponse = await response.json();
      }
    });

    // Open chat and send message
    const chatButton = page.locator('button[aria-label="Open AI Assistant"]');
    await chatButton.click();

    const input = page.locator('input[placeholder="Type your message..."]');
    await input.fill("Test message");

    const sendButton = page.locator('button[type="submit"]');
    await sendButton.click();

    // Wait for API response
    await page.waitForResponse(
      (response) => response.url().includes("/api/agent/chat"),
      { timeout: 30000 }
    );

    // Verify GPT-5 is being used
    expect(apiResponse).toBeTruthy();
    expect(apiResponse.model).toBe("gpt-5");
    expect(apiResponse.usingGPT5).toBe(true);
  });

  test("should maintain conversation memory", async ({ page }) => {
    // Open chat
    const chatButton = page.locator('button[aria-label="Open AI Assistant"]');
    await chatButton.click();

    // Send first message
    const input = page.locator('input[placeholder="Type your message..."]');
    await input.fill("My name is TestUser");
    await page.locator('button[type="submit"]').click();

    // Wait for first response
    await page.waitForResponse(
      (response) => response.url().includes("/api/agent/chat"),
      { timeout: 30000 }
    );

    // Send second message referencing first
    await input.fill("What is my name?");
    await page.locator('button[type="submit"]').click();

    // Wait for second response
    const response = await page.waitForResponse(
      (response) => response.url().includes("/api/agent/chat"),
      { timeout: 30000 }
    );

    const responseData = await response.json();

    // Verify conversation memory is active
    expect(responseData.hasMemory).toBe(true);
    expect(responseData.conversationId).toBeTruthy();
  });

  test("should handle fullscreen mode", async ({ page }) => {
    // Open chat
    const chatButton = page.locator('button[aria-label="Open AI Assistant"]');
    await chatButton.click();

    // Click fullscreen button
    const fullscreenButton = page.locator(
      'button[aria-label="Enter fullscreen"]'
    );
    await fullscreenButton.click();

    // Check if panel expands to fullscreen
    const chatPanel = page.locator(".fixed.top-0.right-0").first();
    await expect(chatPanel).toHaveClass(/w-full h-full/);

    // Click minimize button
    const minimizeButton = page.locator('button[aria-label="Exit fullscreen"]');
    await minimizeButton.click();

    // Check if panel returns to normal size
    await expect(chatPanel).not.toHaveClass(/w-full h-full/);
  });

  test("should close chat panel", async ({ page }) => {
    // Open chat
    const chatButton = page.locator('button[aria-label="Open AI Assistant"]');
    await chatButton.click();

    // Verify panel is open
    const chatPanel = page.locator("text=AI Assistant");
    await expect(chatPanel).toBeVisible();

    // Click close button
    const closeButton = page.locator('button[aria-label="Close chat"]');
    await closeButton.click();

    // Verify panel is closed
    await expect(chatPanel).not.toBeVisible();

    // Verify floating button is still visible
    await expect(chatButton).toBeVisible();
  });

  test("should display loading state while waiting for response", async ({
    page,
  }) => {
    // Open chat
    const chatButton = page.locator('button[aria-label="Open AI Assistant"]');
    await chatButton.click();

    // Send a message
    const input = page.locator('input[placeholder="Type your message..."]');
    await input.fill("Test loading state");
    await page.locator('button[type="submit"]').click();

    // Check for loading spinner
    const loadingSpinner = page.locator(".animate-spin");
    await expect(loadingSpinner).toBeVisible();

    // Wait for response
    await page.waitForResponse(
      (response) => response.url().includes("/api/agent/chat"),
      { timeout: 30000 }
    );

    // Loading spinner should disappear
    await expect(loadingSpinner).not.toBeVisible();
  });
});
