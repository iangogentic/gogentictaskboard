import { test, expect } from "@playwright/test";

test.describe("Sprint 3: Google Drive Integration", () => {
  test("Google OAuth endpoints exist and require auth", async ({ page }) => {
    // Test OAuth initiation
    const authResponse = await page.request.post("/api/google/auth");
    expect([401, 307]).toContain(authResponse.status());

    // Test OAuth callback
    const callbackResponse = await page.request.get(
      "/api/google/auth?code=test&state=test"
    );
    expect([401, 307, 302]).toContain(callbackResponse.status());
  });

  test("Folder management endpoints require authentication", async ({
    page,
  }) => {
    // Test create folder
    const createResponse = await page.request.post("/api/google/folders", {
      data: { folderName: "Test Folder" },
    });
    expect([401, 307]).toContain(createResponse.status());

    // Test list files
    const listResponse = await page.request.get("/api/google/folders");
    expect([401, 307]).toContain(listResponse.status());

    // Test with project ID
    const projectResponse = await page.request.get(
      "/api/google/folders?projectId=test-project"
    );
    expect([401, 307]).toContain(projectResponse.status());
  });

  test("File operations require authentication", async ({ page }) => {
    // Test upload file
    const formData = new FormData();
    formData.append(
      "file",
      new Blob(["test content"], { type: "text/plain" }),
      "test.txt"
    );

    const uploadResponse = await page.request.post("/api/google/files", {
      multipart: {
        file: {
          name: "test.txt",
          mimeType: "text/plain",
          buffer: Buffer.from("test content"),
        },
      },
    });
    expect([401, 307]).toContain(uploadResponse.status());

    // Test download file
    const downloadResponse = await page.request.get(
      "/api/google/files?fileId=test-file"
    );
    expect([401, 307]).toContain(downloadResponse.status());

    // Test delete file
    const deleteResponse = await page.request.delete(
      "/api/google/files?fileId=test-file"
    );
    expect([401, 307]).toContain(deleteResponse.status());
  });

  test("Search endpoint requires authentication", async ({ page }) => {
    const response = await page.request.get("/api/google/search?q=test");
    expect([401, 307]).toContain(response.status());
  });

  test("Share endpoint requires authentication", async ({ page }) => {
    const response = await page.request.post("/api/google/share", {
      data: {
        fileId: "test-file",
        email: "test@example.com",
        role: "reader",
      },
    });
    expect([401, 307]).toContain(response.status());
  });

  test("Quota endpoint requires authentication", async ({ page }) => {
    const response = await page.request.get("/api/google/quota");
    expect([401, 307]).toContain(response.status());
  });

  test("Test connection endpoint requires authentication", async ({ page }) => {
    const response = await page.request.get("/api/google/test");
    expect([401, 307]).toContain(response.status());
  });
});
