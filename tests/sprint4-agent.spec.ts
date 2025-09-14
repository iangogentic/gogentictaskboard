import { test, expect } from "@playwright/test";

test.describe("Sprint 4: Agent System", () => {
  test("Agent session endpoints require authentication", async ({ page }) => {
    // Test create session
    const createResponse = await page.request.post("/api/agent/sessions", {
      data: { projectId: "test-project" },
    });
    expect([401, 307]).toContain(createResponse.status());

    // Test list sessions
    const listResponse = await page.request.get("/api/agent/sessions");
    expect([401, 307]).toContain(listResponse.status());

    // Test get session
    const getResponse = await page.request.get(
      "/api/agent/sessions/test-session"
    );
    expect([401, 307, 404]).toContain(getResponse.status());

    // Test cancel session
    const cancelResponse = await page.request.delete(
      "/api/agent/sessions/test-session"
    );
    expect([401, 307, 404]).toContain(cancelResponse.status());
  });

  test("Plan generation requires authentication", async ({ page }) => {
    const response = await page.request.post("/api/agent/plan", {
      data: {
        sessionId: "test-session",
        request: "Create 5 tasks for frontend development",
      },
    });
    expect([401, 307]).toContain(response.status());
  });

  test("Plan approval requires authentication", async ({ page }) => {
    const response = await page.request.post("/api/agent/approve", {
      data: { sessionId: "test-session" },
    });
    expect([401, 307]).toContain(response.status());
  });

  test("Plan execution requires authentication", async ({ page }) => {
    const response = await page.request.post("/api/agent/execute", {
      data: { sessionId: "test-session" },
    });
    expect([401, 307]).toContain(response.status());
  });

  test("Agent workflow validation", async ({ page }) => {
    // Test workflow order validation
    const sessionId = "test-workflow-session";

    // Should not execute without plan
    const executeWithoutPlan = await page.request.post("/api/agent/execute", {
      data: { sessionId },
    });
    expect([401, 307, 400, 404]).toContain(executeWithoutPlan.status());

    // Should not approve without plan
    const approveWithoutPlan = await page.request.post("/api/agent/approve", {
      data: { sessionId },
    });
    expect([401, 307, 400, 404]).toContain(approveWithoutPlan.status());
  });

  test("Session management validation", async ({ page }) => {
    // Test with invalid session ID
    const invalidSession = "invalid-session-id";

    const planResponse = await page.request.post("/api/agent/plan", {
      data: {
        sessionId: invalidSession,
        request: "Test request",
      },
    });
    expect([401, 307, 404]).toContain(planResponse.status());
  });
});
