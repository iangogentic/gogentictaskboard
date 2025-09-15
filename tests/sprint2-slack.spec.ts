import { test, expect } from "@playwright/test";

test.describe("Sprint 2: Slack Integration", () => {
  test("Slack OAuth endpoints exist and require auth", async ({ page }) => {
    // Test OAuth initiation
    const authResponse = await page.request.post("/api/slack/auth");
    expect([401, 307]).toContain(authResponse.status());

    // Test OAuth callback
    const callbackResponse = await page.request.get(
      "/api/slack/auth?code=test&state=test"
    );
    expect([401, 307, 302]).toContain(callbackResponse.status());
  });

  test("Slack channels endpoint requires authentication", async ({ page }) => {
    const response = await page.request.get("/api/slack/channels");
    expect([401, 307]).toContain(response.status());
  });

  test("Project-channel linking requires authentication", async ({ page }) => {
    // Test link project
    const linkResponse = await page.request.post("/api/slack/link-project", {
      data: {
        projectId: "test-project",
        channelId: "C1234567890",
        channelName: "test-channel",
      },
    });
    expect([401, 307]).toContain(linkResponse.status());

    // Test unlink project
    const unlinkResponse = await page.request.delete(
      "/api/slack/link-project?projectId=test-project"
    );
    expect([401, 307]).toContain(unlinkResponse.status());
  });

  test("Daily summary endpoints require authentication", async ({ page }) => {
    // Test send summary
    const sendResponse = await page.request.post("/api/slack/daily-summary", {
      data: { userId: "test-user" },
    });
    expect([401, 307]).toContain(sendResponse.status());

    // Test get summary status
    const statusResponse = await page.request.get("/api/slack/daily-summary");
    expect([401, 307]).toContain(statusResponse.status());
  });

  test("Webhook endpoint handles verification", async ({ page }) => {
    // Test URL verification challenge
    const response = await page.request.post("/api/slack/webhook", {
      headers: {
        "x-slack-signature": "v0=test",
        "x-slack-request-timestamp": String(Math.floor(Date.now() / 1000)),
      },
      data: {
        type: "url_verification",
        challenge: "test-challenge",
      },
    });

    // Should reject invalid signature
    expect(response.status()).toBe(403);
  });

  test("Webhook rejects invalid signatures", async ({ page }) => {
    const response = await page.request.post("/api/slack/webhook", {
      headers: {
        "x-slack-signature": "invalid",
        "x-slack-request-timestamp": "invalid",
      },
      data: { type: "event_callback" },
    });

    expect(response.status()).toBe(403);
  });

  test("Test connection endpoint requires authentication", async ({ page }) => {
    const response = await page.request.get("/api/slack/test");
    expect([401, 307]).toContain(response.status());
  });
});
