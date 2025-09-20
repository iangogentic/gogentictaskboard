// Script to add Slack/Drive integrations to production database
// Run this locally with production DATABASE_URL

require("dotenv").config({ path: ".env.local" });

// Override with production DATABASE_URL
process.env.DATABASE_URL =
  process.env.PRODUCTION_DATABASE_URL || process.env.DATABASE_URL;

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function fixSlackIntegrationProd() {
  console.log("🚀 Running against production database...");
  console.log(
    "Database URL:",
    process.env.DATABASE_URL?.substring(0, 30) + "..."
  );

  try {
    // Find all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    console.log(`\nFound ${users.length} users in production`);

    // Add integrations for ALL users
    let slackAdded = 0;
    let driveAdded = 0;

    for (const user of users) {
      console.log(`\nProcessing user: ${user.name || user.email} (${user.id})`);

      // Check existing integrations
      const existing = await prisma.integrationCredential.findMany({
        where: { userId: user.id },
        select: { type: true },
      });

      // Add Slack if missing
      const slackExists = existing.some((e) => e.type === "slack");
      if (!slackExists) {
        await prisma.integrationCredential.create({
          data: {
            id: `ic_slack_${user.id}_${Date.now()}`,
            userId: user.id,
            type: "slack",
            data: {
              token: process.env.SLACK_BOT_TOKEN || "dummy-slack-token",
              refreshToken: null,
              expiresAt: null,
              botUserId: process.env.SLACK_BOT_USER_ID || "U123456",
              teamId: process.env.SLACK_TEAM_ID || "T123456",
            },
            updatedAt: new Date(),
          },
        });
        console.log("  ✅ Slack integration added");
        slackAdded++;
      } else {
        console.log("  ℹ️ Slack integration already exists");
      }

      // Add Google Drive if missing
      const driveExists = existing.some((e) => e.type === "google_drive");
      if (!driveExists) {
        await prisma.integrationCredential.create({
          data: {
            id: `ic_drive_${user.id}_${Date.now()}`,
            userId: user.id,
            type: "google_drive",
            data: {
              token: "dummy-google-token",
              refreshToken: "dummy-refresh-token",
              expiresAt: null,
            },
            updatedAt: new Date(),
          },
        });
        console.log("  ✅ Google Drive integration added");
        driveAdded++;
      } else {
        console.log("  ℹ️ Google Drive integration already exists");
      }
    }

    console.log("\n=================================");
    console.log("✅ Production fix complete!");
    console.log(`  - Slack integrations added: ${slackAdded}`);
    console.log(`  - Drive integrations added: ${driveAdded}`);
    console.log("=================================");
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error(
      "Make sure you have PRODUCTION_DATABASE_URL set in .env.local"
    );
  } finally {
    await prisma.$disconnect();
  }
}

fixSlackIntegrationProd();
