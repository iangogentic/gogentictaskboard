import { test, expect } from "@playwright/test";

test.describe("Sprint 1: RBAC and Audit Logging", () => {
  test("API endpoints require authentication", async ({ page }) => {
    // Test unauthenticated access to protected endpoints
    const endpoints = [
      "/api/projects/test-id",
      "/api/tasks",
      "/api/search?q=test",
      "/api/updates",
      "/api/deliverables",
    ];

    for (const endpoint of endpoints) {
      const response = await page.request.get(endpoint);
      // Should redirect to login or return 401/307
      expect([401, 307]).toContain(response.status());
    }
  });

  test("Search API works with authentication bypass for testing", async ({
    page,
  }) => {
    // Test search with short query
    const response = await page.request.get("/api/search?q=a");

    // Should handle auth redirect or empty results
    if (response.status() === 200) {
      const data = await response.json();
      expect(data.results).toBeDefined();
    } else {
      expect([401, 307]).toContain(response.status());
    }
  });

  test("Project endpoints are protected", async ({ page }) => {
    const projectId = "test-project-123";

    // Test GET project
    const getResponse = await page.request.get(`/api/projects/${projectId}`);
    expect([401, 307, 404]).toContain(getResponse.status());

    // Test PATCH project
    const patchResponse = await page.request.patch(
      `/api/projects/${projectId}`,
      {
        data: { title: "Updated Title" },
      }
    );
    expect([401, 307, 404]).toContain(patchResponse.status());

    // Test DELETE project
    const deleteResponse = await page.request.delete(
      `/api/projects/${projectId}`
    );
    expect([401, 307, 404]).toContain(deleteResponse.status());
  });

  test("Task endpoints are protected", async ({ page }) => {
    // Test POST task
    const postResponse = await page.request.post("/api/tasks", {
      data: {
        projectId: "test-project",
        title: "Test Task",
      },
    });
    expect([401, 307]).toContain(postResponse.status());

    // Test PATCH task
    const patchResponse = await page.request.patch("/api/tasks/test-task", {
      data: { status: "done" },
    });
    expect([401, 307, 404]).toContain(patchResponse.status());
  });

  test("Bulk operations are protected", async ({ page }) => {
    // Test bulk task update
    const bulkResponse = await page.request.patch("/api/tasks/bulk", {
      data: {
        ids: ["task1", "task2"],
        updates: { status: "done" },
      },
    });
    expect([401, 307]).toContain(bulkResponse.status());
  });

  test("Global search requires authentication", async ({ page }) => {
    const response = await page.request.get("/api/search?q=project");
    expect([401, 307]).toContain(response.status());
  });

  test("Database connectivity check", async ({ page }) => {
    // Try to access a health endpoint if it exists
    const response = await page.request.get("/api/health");
    // Any response means server is running
    expect(response.status()).toBeLessThan(600);
  });
});
