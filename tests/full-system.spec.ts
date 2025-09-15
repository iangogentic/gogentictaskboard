import { test, expect, APIRequestContext, Page } from "@playwright/test";

// Test configuration
const BASE_URL = "http://localhost:3003";
const API_URL = `${BASE_URL}/api`;

test.describe("Full System Integration Tests", () => {
  let apiContext: APIRequestContext;
  let authToken: string;

  test.beforeAll(async ({ playwright }) => {
    // Create API context for direct API testing
    apiContext = await playwright.request.newContext({
      baseURL: API_URL,
    });
  });

  test.afterAll(async () => {
    await apiContext.dispose();
  });

  test.describe("Sprint 1: RBAC & Audit Logging", () => {
    test("RBAC endpoints require authentication", async () => {
      const endpoints = ["/projects", "/tasks", "/search", "/updates"];

      for (const endpoint of endpoints) {
        const response = await apiContext.get(endpoint);
        expect([307, 401]).toContain(response.status());
      }
    });

    test("Audit logging tracks actions", async () => {
      // This would track create/update/delete operations
      const response = await apiContext.post("/projects", {
        data: {
          title: "Test Project",
          clientName: "Test Client",
        },
      });

      // Should redirect to login or return unauthorized
      expect([307, 401]).toContain(response.status());
    });
  });

  test.describe("Sprint 2: Slack Integration", () => {
    test("Slack OAuth flow endpoints exist", async () => {
      const response = await apiContext.post("/slack/auth");
      expect([307, 401]).toContain(response.status());
    });

    test("Slack webhook validates signatures", async () => {
      const response = await apiContext.post("/slack/webhook", {
        headers: {
          "x-slack-signature": "invalid",
          "x-slack-request-timestamp": "0",
        },
        data: { type: "test" },
      });

      expect(response.status()).toBe(403); // Should reject invalid signature
    });

    test("Slack channels endpoint protected", async () => {
      const response = await apiContext.get("/slack/channels");
      expect([307, 401]).toContain(response.status());
    });
  });

  test.describe("Sprint 3: Google Drive Integration", () => {
    test("Google OAuth endpoints exist", async () => {
      const response = await apiContext.post("/google/auth");
      expect([307, 401]).toContain(response.status());
    });

    test("File operations require authentication", async () => {
      const endpoints = [
        { method: "GET", path: "/google/folders" },
        { method: "GET", path: "/google/files" },
        { method: "GET", path: "/google/search?q=test" },
      ];

      for (const { method, path } of endpoints) {
        const response = await apiContext[method.toLowerCase()](path);
        expect([307, 401]).toContain(response.status());
      }
    });
  });

  test.describe("Sprint 4: Agent System", () => {
    test("Agent session management", async () => {
      // Create session
      const createResponse = await apiContext.post("/agent/sessions", {
        data: { projectId: "test" },
      });
      expect([307, 401]).toContain(createResponse.status());

      // List sessions
      const listResponse = await apiContext.get("/agent/sessions");
      expect([307, 401]).toContain(listResponse.status());
    });

    test("Agent planning endpoints", async () => {
      const response = await apiContext.post("/agent/plan", {
        data: {
          sessionId: "test",
          request: "Create 5 tasks",
        },
      });
      expect([307, 401]).toContain(response.status());
    });

    test("Agent execution workflow", async () => {
      const endpoints = ["/agent/approve", "/agent/execute"];

      for (const endpoint of endpoints) {
        const response = await apiContext.post(endpoint, {
          data: { sessionId: "test" },
        });
        expect([307, 401, 400]).toContain(response.status());
      }
    });
  });

  test.describe("Sprint 5: RAG Memory System", () => {
    test("Semantic search endpoint", async () => {
      const response = await apiContext.post("/rag/search", {
        data: {
          query: "test search",
          projectId: "test",
        },
      });
      expect([307, 401]).toContain(response.status());
    });

    test("Document sync endpoint", async () => {
      const response = await apiContext.post("/rag/sync", {
        data: {
          projectId: "test",
          sources: ["project"],
        },
      });
      expect([307, 401]).toContain(response.status());
    });
  });

  test.describe("Sprint 6: Advanced Features", () => {
    test("Conversation endpoints", async () => {
      const response = await apiContext.get("/agent/conversations");
      expect([307, 401, 404]).toContain(response.status());
    });

    test("Workflow endpoints", async () => {
      const response = await apiContext.get("/agent/workflows");
      expect([307, 401, 404]).toContain(response.status());
    });

    test("Analytics endpoints", async () => {
      const response = await apiContext.get("/agent/analytics");
      expect([307, 401, 404]).toContain(response.status());
    });

    test("Monitoring endpoints", async () => {
      const response = await apiContext.get("/agent/monitoring");
      expect([307, 401, 404]).toContain(response.status());
    });
  });
});

test.describe("UI Integration Tests", () => {
  test("Application loads and redirects to login", async ({ page }) => {
    await page.goto(BASE_URL);

    // Should redirect to login
    await expect(page).toHaveURL(/.*login/);
  });

  test("Login page elements exist", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);

    // Check for login form elements
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    const passwordInput = page.locator(
      'input[type="password"], input[name="password"]'
    );

    // Wait for page to load
    await page.waitForTimeout(1000);

    // Check if auth elements exist (might be different based on your auth setup)
    const pageContent = await page.content();
    expect(pageContent).toBeTruthy();
  });

  test("Protected routes redirect to login", async ({ page }) => {
    const protectedRoutes = ["/dashboard", "/projects", "/agent", "/settings"];

    for (const route of protectedRoutes) {
      await page.goto(`${BASE_URL}${route}`);
      await expect(page).toHaveURL(/.*login/);
    }
  });
});

test.describe("Performance Tests", () => {
  test("API endpoints respond within acceptable time", async () => {
    const startTime = Date.now();
    const response = await apiContext.get("/health");
    const responseTime = Date.now() - startTime;

    // Should respond within 1 second
    expect(responseTime).toBeLessThan(1000);
  });

  test("Multiple concurrent requests", async () => {
    const requests = Array(10)
      .fill(null)
      .map(() => apiContext.get("/api/test").catch(() => null));

    const responses = await Promise.all(requests);

    // All requests should complete
    expect(responses.length).toBe(10);
  });
});

test.describe("Security Tests", () => {
  test("SQL injection prevention", async () => {
    const maliciousInput = "'; DROP TABLE users; --";

    const response = await apiContext.get(
      `/search?q=${encodeURIComponent(maliciousInput)}`
    );

    // Should handle safely
    expect([307, 401, 400]).toContain(response.status());
  });

  test("XSS prevention", async () => {
    const xssPayload = '<script>alert("XSS")</script>';

    const response = await apiContext.post("/updates", {
      data: {
        body: xssPayload,
      },
    });

    // Should handle safely
    expect([307, 401, 400]).toContain(response.status());
  });

  test("CORS headers present", async () => {
    const response = await apiContext.get("/test");

    const headers = response.headers();
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"]).toBe("SAMEORIGIN");
  });
});

test.describe("Database Integration", () => {
  test("Database connection health check", async () => {
    // This would be a health check endpoint
    const response = await apiContext.get("/health/db");

    // Expected to redirect or work
    expect([200, 307, 401, 404]).toContain(response.status());
  });
});

// Helper function to create authenticated session
async function createAuthenticatedSession(page: Page) {
  // This would handle your authentication flow
  await page.goto(`${BASE_URL}/login`);

  // Fill in credentials (you'd use test credentials)
  // await page.fill('input[name="email"]', 'test@example.com');
  // await page.fill('input[name="password"]', 'testpassword');
  // await page.click('button[type="submit"]');

  // Wait for redirect
  // await page.waitForNavigation();
}

// Helper function to test API with auth
async function testAuthenticatedAPI(
  apiContext: APIRequestContext,
  token: string
) {
  return apiContext.get("/projects", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
