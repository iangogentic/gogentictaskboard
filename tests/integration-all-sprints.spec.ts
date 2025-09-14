import { test, expect } from "@playwright/test";

// Set shorter timeout for API tests
test.use({ timeout: 5000 });

test.describe("Integration: All Sprints", () => {
  test("All API endpoints respond correctly", async ({ request }) => {
    const endpoints = [
      // Sprint 1: RBAC endpoints
      {
        path: "/api/projects/test",
        method: "GET",
        expectedStatus: [307, 401, 404],
      },
      { path: "/api/tasks", method: "GET", expectedStatus: [307, 401] },
      { path: "/api/search?q=test", method: "GET", expectedStatus: [307, 401] },

      // Sprint 2: Slack endpoints
      { path: "/api/slack/auth", method: "POST", expectedStatus: [307, 401] },
      {
        path: "/api/slack/channels",
        method: "GET",
        expectedStatus: [307, 401],
      },
      {
        path: "/api/slack/daily-summary",
        method: "GET",
        expectedStatus: [307, 401],
      },
      { path: "/api/slack/test", method: "GET", expectedStatus: [307, 401] },

      // Sprint 3: Google Drive endpoints
      { path: "/api/google/auth", method: "POST", expectedStatus: [307, 401] },
      {
        path: "/api/google/folders",
        method: "GET",
        expectedStatus: [307, 401],
      },
      {
        path: "/api/google/search?q=test",
        method: "GET",
        expectedStatus: [307, 401],
      },
      { path: "/api/google/quota", method: "GET", expectedStatus: [307, 401] },
      { path: "/api/google/test", method: "GET", expectedStatus: [307, 401] },

      // Sprint 4: Agent endpoints
      {
        path: "/api/agent/sessions",
        method: "GET",
        expectedStatus: [307, 401],
      },
      {
        path: "/api/agent/sessions",
        method: "POST",
        expectedStatus: [307, 401],
      },
      {
        path: "/api/agent/plan",
        method: "POST",
        expectedStatus: [307, 400, 401],
      },
      {
        path: "/api/agent/approve",
        method: "POST",
        expectedStatus: [307, 400, 401],
      },
      {
        path: "/api/agent/execute",
        method: "POST",
        expectedStatus: [307, 400, 401],
      },
    ];

    console.log("Testing", endpoints.length, "endpoints...");

    for (const endpoint of endpoints) {
      console.log(`Testing ${endpoint.method} ${endpoint.path}`);

      let response;
      if (endpoint.method === "GET") {
        response = await request.get(endpoint.path);
      } else if (endpoint.method === "POST") {
        response = await request.post(endpoint.path, {
          data: {},
          headers: { "Content-Type": "application/json" },
        });
      } else if (endpoint.method === "DELETE") {
        response = await request.delete(endpoint.path);
      } else {
        response = await request.get(endpoint.path);
      }

      expect(
        endpoint.expectedStatus,
        `${endpoint.method} ${endpoint.path} should return one of ${endpoint.expectedStatus}, got ${response.status()}`
      ).toContain(response.status());
    }

    console.log("All endpoints tested successfully!");
  });

  test("Webhook endpoints handle invalid requests", async ({ request }) => {
    // Slack webhook with invalid signature
    const slackResponse = await request.post("/api/slack/webhook", {
      headers: {
        "x-slack-signature": "invalid",
        "x-slack-request-timestamp": "0",
      },
      data: { type: "test" },
    });
    expect(slackResponse.status()).toBe(403);
  });

  test("Protected endpoints redirect to auth", async ({ request }) => {
    const protectedPaths = [
      "/api/projects/123",
      "/api/tasks",
      "/api/agent/sessions",
    ];

    for (const path of protectedPaths) {
      const response = await request.get(path);
      // Should redirect (307) or return unauthorized (401)
      expect([307, 401, 404]).toContain(response.status());
    }
  });
});
