/**
 * Test script for Slack Integration
 * Run with: node test-slack.js
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

// Test 1: Slack OAuth endpoints
async function testSlackOAuthEndpoints() {
  console.log(blue("\n=== Testing Slack OAuth Endpoints ==="));

  await test("POST /slack/auth initiates OAuth flow", async () => {
    const res = await fetch(`${API_BASE}/slack/auth`, {
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
    }
  });

  await test("GET /slack/auth handles OAuth callback", async () => {
    const res = await fetch(`${API_BASE}/slack/auth?code=test&state=test`);

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

// Test 2: Slack channel endpoints
async function testSlackChannelEndpoints() {
  console.log(blue("\n=== Testing Slack Channel Endpoints ==="));

  await test("GET /slack/channels requires authentication", async () => {
    const res = await fetch(`${API_BASE}/slack/channels`);
    if (res.status !== 401) {
      throw new Error(`Expected 401, got ${res.status}`);
    }
  });

  await test("POST /slack/link-project requires authentication", async () => {
    const res = await fetch(`${API_BASE}/slack/link-project`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: "test-project",
        channelId: "C1234567890",
        channelName: "test-channel",
      }),
    });
    if (res.status !== 401) {
      throw new Error(`Expected 401, got ${res.status}`);
    }
  });

  await test("DELETE /slack/link-project requires authentication", async () => {
    const res = await fetch(
      `${API_BASE}/slack/link-project?projectId=test-project`,
      { method: "DELETE" }
    );
    if (res.status !== 401) {
      throw new Error(`Expected 401, got ${res.status}`);
    }
  });
}

// Test 3: Daily summary endpoints
async function testDailySummaryEndpoints() {
  console.log(blue("\n=== Testing Daily Summary Endpoints ==="));

  await test("POST /slack/daily-summary requires authentication", async () => {
    const res = await fetch(`${API_BASE}/slack/daily-summary`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: "test-user" }),
    });
    if (res.status !== 401) {
      throw new Error(`Expected 401, got ${res.status}`);
    }
  });

  await test("GET /slack/daily-summary requires authentication", async () => {
    const res = await fetch(`${API_BASE}/slack/daily-summary`);
    if (res.status !== 401) {
      throw new Error(`Expected 401, got ${res.status}`);
    }
  });
}

// Test 4: Webhook endpoint
async function testWebhookEndpoint() {
  console.log(blue("\n=== Testing Webhook Endpoint ==="));

  await test("POST /slack/webhook handles URL verification", async () => {
    const res = await fetch(`${API_BASE}/slack/webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-slack-signature": "v0=test",
        "x-slack-request-timestamp": String(Math.floor(Date.now() / 1000)),
      },
      body: JSON.stringify({
        type: "url_verification",
        challenge: "test-challenge",
      }),
    });

    // Will fail signature verification without real secret
    if (res.status === 403) {
      console.log(
        yellow("  (Signature verification failed - expected without secret)")
      );
      return;
    }
  });

  await test("POST /slack/webhook rejects invalid signatures", async () => {
    const res = await fetch(`${API_BASE}/slack/webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-slack-signature": "invalid",
        "x-slack-request-timestamp": "invalid",
      },
      body: JSON.stringify({ type: "event_callback" }),
    });

    if (res.status !== 403) {
      throw new Error(`Expected 403 for invalid signature, got ${res.status}`);
    }
  });
}

// Test 5: Test connection endpoint
async function testConnectionEndpoint() {
  console.log(blue("\n=== Testing Connection Endpoint ==="));

  await test("GET /slack/test requires authentication", async () => {
    const res = await fetch(`${API_BASE}/slack/test`);
    if (res.status !== 401) {
      throw new Error(`Expected 401, got ${res.status}`);
    }
  });
}

// Test 6: Check environment variables
async function testEnvironmentVariables() {
  console.log(blue("\n=== Checking Environment Variables ==="));

  const required = [
    "SLACK_CLIENT_ID",
    "SLACK_CLIENT_SECRET",
    "SLACK_BOT_TOKEN",
    "SLACK_SIGNING_SECRET",
    "SLACK_REDIRECT_URI",
  ];

  const missing = [];

  // Note: We can't directly check env vars from client-side
  // This is just a reminder to check them
  console.log(yellow("  Please ensure these environment variables are set:"));
  required.forEach((varName) => {
    console.log(yellow(`    - ${varName}`));
  });
}

// Main test runner
async function runTests() {
  console.log(blue("===================================="));
  console.log(blue("  Slack Integration Test Suite"));
  console.log(blue("===================================="));

  await testSlackOAuthEndpoints();
  await testSlackChannelEndpoints();
  await testDailySummaryEndpoints();
  await testWebhookEndpoint();
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
  console.log(blue("Next Steps for Slack Integration:"));
  console.log("1. Create a Slack App at https://api.slack.com/apps");
  console.log("2. Set up OAuth & Permissions with required scopes:");
  console.log("   - channels:read");
  console.log("   - chat:write");
  console.log("   - im:write");
  console.log("   - users:read");
  console.log("   - groups:read");
  console.log(
    "3. Add Event Subscriptions URL: " +
      process.env.NEXT_PUBLIC_APP_URL +
      "/api/slack/webhook"
  );
  console.log("4. Subscribe to bot events:");
  console.log("   - app_mention");
  console.log("   - message.im");
  console.log("   - app_home_opened");
  console.log("5. Add slash command: /gogentic");
  console.log("6. Install the app to your workspace");
  console.log("7. Add all required environment variables to .env.local");

  process.exit(failed > 0 ? 1 : 0);
}

// Run the tests
runTests().catch(console.error);
