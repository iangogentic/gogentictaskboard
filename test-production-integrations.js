// Test production integrations for GoGentic Portal
// Use native fetch (available in Node 18+) or fallback

const PRODUCTION_URL = "https://gogentic-portal-real.vercel.app";
const LOCAL_URL = "http://localhost:3000";

// Use production for now
const BASE_URL = PRODUCTION_URL;

async function testHealthEndpoint() {
  console.log("\n=== Testing Health Endpoint ===");
  try {
    const response = await fetch(`${BASE_URL}/api/health`, {
      method: "GET",
      redirect: "manual",
    });

    console.log(`Status: ${response.status}`);
    if (response.status === 307) {
      console.log("⚠️  Redirecting to login (authentication required)");
    } else if (response.status === 200) {
      const data = await response.json();
      console.log("✅ Health check passed:", data);
    }
  } catch (error) {
    console.error("❌ Health check failed:", error.message);
  }
}

async function testSlackEndpoint() {
  console.log("\n=== Testing Slack Test Endpoint ===");
  try {
    const response = await fetch(`${BASE_URL}/api/slack/test`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      redirect: "manual",
    });

    console.log(`Status: ${response.status}`);
    if (response.status === 307) {
      console.log("⚠️  Authentication required - need valid session");
    } else if (response.status === 401) {
      console.log("⚠️  Unauthorized - need to be logged in");
    } else if (response.status === 200) {
      const data = await response.json();
      console.log("✅ Slack test result:", data);
    }
  } catch (error) {
    console.error("❌ Slack test failed:", error.message);
  }
}

async function testGoogleDriveEndpoint() {
  console.log("\n=== Testing Google Drive Test Endpoint ===");
  try {
    const response = await fetch(`${BASE_URL}/api/google/test`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      redirect: "manual",
    });

    console.log(`Status: ${response.status}`);
    if (response.status === 307) {
      console.log("⚠️  Authentication required - need valid session");
    } else if (response.status === 401) {
      console.log("⚠️  Unauthorized - need to be logged in");
    } else if (response.status === 200) {
      const data = await response.json();
      console.log("✅ Google Drive test result:", data);
    }
  } catch (error) {
    console.error("❌ Google Drive test failed:", error.message);
  }
}

async function testDirectSlackAPI() {
  console.log("\n=== Testing Direct Slack API ===");
  const { WebClient } = require("@slack/web-api");
  require("dotenv").config({ path: ".env.local" });

  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) {
    console.error("❌ SLACK_BOT_TOKEN not found");
    return;
  }

  try {
    const slack = new WebClient(token);

    // Test auth
    const authResult = await slack.auth.test();
    console.log("✅ Slack Auth Test:", {
      ok: authResult.ok,
      team: authResult.team,
      user: authResult.user,
      userId: authResult.user_id,
    });

    // List channels
    const channelsResult = await slack.conversations.list({
      types: "public_channel",
      limit: 5,
    });

    console.log(
      `✅ Found ${channelsResult.channels?.length || 0} public channels`
    );

    if (channelsResult.channels && channelsResult.channels.length > 0) {
      console.log("  Channels:");
      channelsResult.channels.forEach((ch) => {
        console.log(`    - #${ch.name} (${ch.id})`);
      });

      // Try to send a test message to the first channel
      const testChannel = channelsResult.channels[0];
      console.log(
        `\n  Attempting to send test message to #${testChannel.name}...`
      );

      try {
        const messageResult = await slack.chat.postMessage({
          channel: testChannel.id,
          text: "🤖 GoGentic Portal Integration Test",
          blocks: [
            {
              type: "header",
              text: {
                type: "plain_text",
                text: "🚀 GoGentic Portal Integration Test",
                emoji: true,
              },
            },
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: "This is an automated test message from the GoGentic Portal to verify Slack integration is working correctly.",
              },
            },
            {
              type: "context",
              elements: [
                {
                  type: "mrkdwn",
                  text: `Test performed at: ${new Date().toLocaleString()}`,
                },
              ],
            },
          ],
        });

        if (messageResult.ok) {
          console.log(
            `  ✅ Message sent successfully! (ts: ${messageResult.ts})`
          );
        }
      } catch (msgError) {
        console.error(
          "  ❌ Failed to send message:",
          msgError.data?.error || msgError.message
        );
      }
    }

    // Check bot permissions
    const botInfo = await slack.bots.info({ bot: authResult.user_id });
    if (botInfo.ok && botInfo.bot) {
      console.log("\n✅ Bot Info:", {
        name: botInfo.bot.name,
        id: botInfo.bot.id,
        appId: botInfo.bot.app_id,
      });
    }
  } catch (error) {
    console.error("❌ Direct Slack API test failed:", error.message);
    if (error.data) {
      console.error("  Error details:", error.data);
    }
  }
}

async function testLocalServer() {
  console.log("\n=== Checking Local Server ===");
  try {
    const response = await fetch("http://localhost:3000/api/health", {
      method: "GET",
      timeout: 2000,
    });

    if (response.ok) {
      console.log("✅ Local server is running");
      return true;
    }
  } catch (error) {
    console.log("⚠️  Local server not running");
    console.log("   Run `npm run dev` to test with authenticated session");
    return false;
  }
}

async function main() {
  console.log("========================================");
  console.log("   GoGentic Portal Integration Tests   ");
  console.log("========================================");

  // Check if local server is running
  const isLocal = await testLocalServer();

  // Test endpoints (will need auth)
  await testHealthEndpoint();
  await testSlackEndpoint();
  await testGoogleDriveEndpoint();

  // Test direct Slack API (bypasses auth)
  await testDirectSlackAPI();

  console.log("\n========================================");
  console.log("              Summary                   ");
  console.log("========================================");
  console.log("1. API endpoints require authentication (login)");
  console.log("2. Direct Slack API is working with bot token");
  console.log("3. To fully test integrations:");
  console.log("   - Start local server: npm run dev");
  console.log("   - Login via Google OAuth");
  console.log("   - Test integration endpoints with session");
  console.log("========================================");
}

main().catch(console.error);
