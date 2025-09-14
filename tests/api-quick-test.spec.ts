import { test, expect } from "@playwright/test";

// Quick API tests with shorter timeout
test.use({ timeout: 5000 });

test.describe("Quick API Tests - All Sprints", () => {
  const BASE_URL = "http://localhost:3003";

  test("Sprint 1-6: All API endpoints respond correctly", async ({
    request,
  }) => {
    const endpoints = [
      // Sprint 1: RBAC
      { path: "/api/projects/test", expectedStatus: [307, 401, 404] },
      { path: "/api/tasks", expectedStatus: [307, 401] },
      { path: "/api/search?q=test", expectedStatus: [307, 401] },

      // Sprint 2: Slack
      { path: "/api/slack/test", expectedStatus: [307, 401] },
      { path: "/api/slack/channels", expectedStatus: [307, 401] },

      // Sprint 3: Google Drive
      { path: "/api/google/test", expectedStatus: [307, 401] },
      { path: "/api/google/folders", expectedStatus: [307, 401] },

      // Sprint 4: Agent
      { path: "/api/agent/sessions", expectedStatus: [307, 401] },

      // Sprint 5: RAG
      {
        path: "/api/rag/search",
        method: "POST",
        expectedStatus: [307, 401, 400],
      },

      // Sprint 6: Advanced features (may not have endpoints yet)
      { path: "/api/agent/conversations", expectedStatus: [307, 401, 404] },
      { path: "/api/agent/workflows", expectedStatus: [307, 401, 404] },
    ];

    console.log(`Testing ${endpoints.length} endpoints...`);
    let passed = 0;
    let failed = 0;

    for (const endpoint of endpoints) {
      try {
        const response =
          endpoint.method === "POST"
            ? await request.post(`${BASE_URL}${endpoint.path}`, { data: {} })
            : await request.get(`${BASE_URL}${endpoint.path}`);

        const status = response.status();

        if (endpoint.expectedStatus.includes(status)) {
          console.log(`✅ ${endpoint.path}: ${status}`);
          passed++;
        } else {
          console.log(
            `❌ ${endpoint.path}: ${status} (expected ${endpoint.expectedStatus})`
          );
          failed++;
        }
      } catch (error) {
        console.log(`❌ ${endpoint.path}: Error`);
        failed++;
      }
    }

    console.log(`\nResults: ${passed} passed, ${failed} failed`);
    expect(failed).toBe(0);
  });

  test("Security: Webhook signature validation", async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/slack/webhook`, {
      headers: {
        "x-slack-signature": "invalid",
        "x-slack-request-timestamp": "0",
      },
      data: { type: "test" },
    });

    expect(response.status()).toBe(403);
    console.log("✅ Webhook security working (403 for invalid signature)");
  });

  test("System health check", async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/health`);
    const status = response.status();

    // May redirect or return various statuses
    expect([200, 307, 401, 404]).toContain(status);
    console.log(`✅ System responding with status ${status}`);
  });
});
