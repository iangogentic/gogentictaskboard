/**
 * Test script for Google Drive Integration
 * Run with: node test-google-drive.js
 */

const API_BASE = "http://localhost:3003/api";

// Color output helpers
const green = (text) => `\x1b[32m${text}\x1b[0m`;
const red = (text) => `\x1b[31m${text}\x1b[0m`;
const yellow = (text) => `\x1b[33m${text}\x1b[0m`;
const blue = (text) => `\x1b[34m${text}\x1b[0m`;

// Test results tracker
let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(green(`✓ ${name}`));
    passed++;
  } catch (error) {
    console.log(red(`✗ ${name}`));
    console.log(red(`  Error: ${error.message}`));
    failed++;
  }
}

// Test 1: Google OAuth endpoints
async function testGoogleOAuthEndpoints() {
  console.log(blue("\n=== Testing Google OAuth Endpoints ==="));

  await test("POST /google/auth initiates OAuth flow", async () => {
    const res = await fetch(`${API_BASE}/google/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (res.status === 401) {
      console.log(yellow("  (Requires authentication - expected)"));
      return;
    }

    if (res.ok) {
      const data = await res.json();
      if (!data.authUrl) {
        throw new Error("Expected authUrl in response");
      }
      if (!data.authUrl.includes("accounts.google.com")) {
        throw new Error("Invalid Google OAuth URL");
      }
    }
  });

  await test("GET /google/auth handles OAuth callback", async () => {
    const res = await fetch(`${API_BASE}/google/auth?code=test&state=test`);

    if (res.status === 401) {
      console.log(yellow("  (Requires authentication - expected)"));
      return;
    }

    // Will fail without valid code, but should handle gracefully
    if (res.status === 302 || res.status === 307) {
      console.log(yellow("  (Redirects on error - expected)"));
      return;
    }
  });
}

// Test 2: Folder management endpoints
async function testFolderEndpoints() {
  console.log(blue("\n=== Testing Folder Management Endpoints ==="));

  await test("POST /google/folders requires authentication", async () => {
    const res = await fetch(`${API_BASE}/google/folders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        folderName: "Test Folder",
      }),
    });
    if (res.status !== 401) {
      throw new Error(`Expected 401, got ${res.status}`);
    }
  });

  await test("GET /google/folders requires authentication", async () => {
    const res = await fetch(`${API_BASE}/google/folders`);
    if (res.status !== 401) {
      throw new Error(`Expected 401, got ${res.status}`);
    }
  });

  await test("GET /google/folders with projectId parameter", async () => {
    const res = await fetch(
      `${API_BASE}/google/folders?projectId=test-project`
    );
    if (res.status !== 401) {
      throw new Error(`Expected 401, got ${res.status}`);
    }
  });
}

// Test 3: File management endpoints
async function testFileEndpoints() {
  console.log(blue("\n=== Testing File Management Endpoints ==="));

  await test("POST /google/files requires authentication", async () => {
    const formData = new FormData();
    formData.append(
      "file",
      new Blob(["test"], { type: "text/plain" }),
      "test.txt"
    );

    const res = await fetch(`${API_BASE}/google/files`, {
      method: "POST",
      body: formData,
    });
    if (res.status !== 401) {
      throw new Error(`Expected 401, got ${res.status}`);
    }
  });

  await test("GET /google/files requires authentication", async () => {
    const res = await fetch(`${API_BASE}/google/files?fileId=test-file`);
    if (res.status !== 401) {
      throw new Error(`Expected 401, got ${res.status}`);
    }
  });

  await test("DELETE /google/files requires authentication", async () => {
    const res = await fetch(`${API_BASE}/google/files?fileId=test-file`, {
      method: "DELETE",
    });
    if (res.status !== 401) {
      throw new Error(`Expected 401, got ${res.status}`);
    }
  });
}

// Test 4: Search endpoint
async function testSearchEndpoint() {
  console.log(blue("\n=== Testing Search Endpoint ==="));

  await test("GET /google/search requires authentication", async () => {
    const res = await fetch(`${API_BASE}/google/search?q=test`);
    if (res.status !== 401) {
      throw new Error(`Expected 401, got ${res.status}`);
    }
  });

  await test("GET /google/search requires query parameter", async () => {
    const res = await fetch(`${API_BASE}/google/search`);
    if (res.status === 401) {
      // Authentication check comes first
      return;
    }
    if (res.status !== 400) {
      throw new Error(`Expected 400 for missing query, got ${res.status}`);
    }
  });
}

// Test 5: Share endpoint
async function testShareEndpoint() {
  console.log(blue("\n=== Testing Share Endpoint ==="));

  await test("POST /google/share requires authentication", async () => {
    const res = await fetch(`${API_BASE}/google/share`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileId: "test-file",
        email: "test@example.com",
        role: "reader",
      }),
    });
    if (res.status !== 401) {
      throw new Error(`Expected 401, got ${res.status}`);
    }
  });
}

// Test 6: Quota endpoint
async function testQuotaEndpoint() {
  console.log(blue("\n=== Testing Quota Endpoint ==="));

  await test("GET /google/quota requires authentication", async () => {
    const res = await fetch(`${API_BASE}/google/quota`);
    if (res.status !== 401) {
      throw new Error(`Expected 401, got ${res.status}`);
    }
  });
}

// Test 7: Test connection endpoint
async function testConnectionEndpoint() {
  console.log(blue("\n=== Testing Connection Endpoint ==="));

  await test("GET /google/test requires authentication", async () => {
    const res = await fetch(`${API_BASE}/google/test`);
    if (res.status !== 401) {
      throw new Error(`Expected 401, got ${res.status}`);
    }
  });
}

// Test 8: Check environment variables
async function testEnvironmentVariables() {
  console.log(blue("\n=== Checking Environment Variables ==="));

  const required = [
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "GOOGLE_REDIRECT_URI",
  ];

  console.log(yellow("  Please ensure these environment variables are set:"));
  required.forEach((varName) => {
    console.log(yellow(`    - ${varName}`));
  });
}

// Main test runner
async function runTests() {
  console.log(blue("===================================="));
  console.log(blue("  Google Drive Integration Test Suite"));
  console.log(blue("===================================="));

  await testGoogleOAuthEndpoints();
  await testFolderEndpoints();
  await testFileEndpoints();
  await testSearchEndpoint();
  await testShareEndpoint();
  await testQuotaEndpoint();
  await testConnectionEndpoint();
  await testEnvironmentVariables();

  console.log(blue("\n===================================="));
  console.log(blue("  Test Results"));
  console.log(blue("===================================="));
  console.log(green(`  Passed: ${passed}`));
  if (failed > 0) {
    console.log(red(`  Failed: ${failed}`));
  }
  console.log(blue("====================================\n"));

  // Additional setup instructions
  console.log(blue("Next Steps for Google Drive Integration:"));
  console.log(
    "1. Create a Google Cloud Project at https://console.cloud.google.com"
  );
  console.log("2. Enable Google Drive API in the project");
  console.log("3. Create OAuth 2.0 credentials:");
  console.log("   - Application type: Web application");
  console.log(
    "   - Authorized redirect URIs: " +
      process.env.NEXT_PUBLIC_APP_URL +
      "/api/google/auth"
  );
  console.log("4. Add required scopes:");
  console.log("   - https://www.googleapis.com/auth/drive.file");
  console.log("   - https://www.googleapis.com/auth/drive.metadata.readonly");
  console.log("   - https://www.googleapis.com/auth/drive.readonly");
  console.log("5. Add environment variables to .env.local:");
  console.log("   - GOOGLE_CLIENT_ID");
  console.log("   - GOOGLE_CLIENT_SECRET");
  console.log("   - GOOGLE_REDIRECT_URI");
  console.log("6. Test the integration from the settings page");

  process.exit(failed > 0 ? 1 : 0);
}

// Run the tests
runTests().catch(console.error);
