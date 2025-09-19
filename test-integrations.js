// Test script for Slack and Google Drive integrations
const { WebClient } = require("@slack/web-api");

// Load environment variables
require("dotenv").config({ path: ".env.local" });

async function testSlack() {
  console.log("\n=== Testing Slack Integration ===");
  const token = process.env.SLACK_BOT_TOKEN;

  if (!token) {
    console.error("❌ SLACK_BOT_TOKEN not found in environment");
    return false;
  }

  console.log("✓ SLACK_BOT_TOKEN found:", token.substring(0, 10) + "...");

  try {
    const slack = new WebClient(token);
    const result = await slack.auth.test();

    if (result.ok) {
      console.log("✅ Slack connection successful!");
      console.log("  - Workspace:", result.team);
      console.log("  - Bot User:", result.user);
      console.log("  - Bot ID:", result.user_id);

      // Try to list channels
      const channels = await slack.conversations.list({
        types: "public_channel,private_channel",
        limit: 5,
      });

      console.log(`  - Can access ${channels.channels?.length || 0} channels`);

      return true;
    }
  } catch (error) {
    console.error("❌ Slack connection failed:", error.message);
    if (error.data) {
      console.error("  Error details:", error.data.error);
    }
    return false;
  }
}

async function testGoogleDrive() {
  console.log("\n=== Testing Google Drive Integration ===");

  const clientId = process.env.AUTH_GOOGLE_ID;
  const clientSecret = process.env.AUTH_GOOGLE_SECRET;

  if (!clientId || !clientSecret) {
    console.error("❌ Google OAuth credentials not found in environment");
    return false;
  }

  console.log("✓ AUTH_GOOGLE_ID found:", clientId.substring(0, 15) + "...");
  console.log(
    "✓ AUTH_GOOGLE_SECRET found:",
    clientSecret.substring(0, 10) + "..."
  );

  // Note: Full Google Drive test requires user authentication flow
  console.log(
    "ℹ️  Google Drive requires user authentication through OAuth flow"
  );
  console.log("   Users need to connect their Google account via the app UI");

  return true;
}

async function checkDatabaseIntegrations() {
  console.log("\n=== Checking Database for Integrations ===");

  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient();

  try {
    // Check for Slack integrations
    const slackIntegrations = await prisma.integrationCredential.count({
      where: { type: "slack" },
    });
    console.log(`  - Slack integrations in DB: ${slackIntegrations}`);

    // Check for Google Drive integrations
    const googleIntegrations = await prisma.integrationCredential.count({
      where: { type: "google_drive" },
    });
    console.log(`  - Google Drive integrations in DB: ${googleIntegrations}`);

    // Just count total projects for now
    const totalProjects = await prisma.project.count();
    console.log(`  - Total projects in DB: ${totalProjects}`);
  } catch (error) {
    console.error("❌ Database check failed:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  console.log("Testing GoGentic Portal Integrations");
  console.log("=====================================");

  // Test Slack
  const slackOk = await testSlack();

  // Test Google Drive config
  const googleOk = await testGoogleDrive();

  // Check database
  await checkDatabaseIntegrations();

  console.log("\n=== Summary ===");
  console.log("Slack:", slackOk ? "✅ Ready" : "❌ Not configured");
  console.log(
    "Google Drive:",
    googleOk ? "✅ Credentials present" : "❌ Missing credentials"
  );
  console.log(
    "\nNote: Full integration testing requires authenticated user session"
  );
}

main().catch(console.error);
