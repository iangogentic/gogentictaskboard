require("dotenv").config({ path: ".env.local" });
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function fixSlackIntegration() {
  try {
    // Find the user
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    console.log("Found users:");
    users.forEach((u) => console.log(`- ${u.name || u.email} (${u.id})`));

    if (users.length === 0) {
      console.log("No users found!");
      return;
    }

    // Use the first user (or you can modify to select specific user)
    const userId = users[0].id;
    console.log(`\nAdding Slack integration for user: ${userId}`);

    // Check existing integrations
    const existing = await prisma.integrationCredential.findMany({
      where: { userId },
      select: { type: true },
    });

    console.log(
      "\nExisting integrations:",
      existing.map((e) => e.type).join(", ") || "None"
    );

    // Create Slack integration if it doesn't exist
    const slackExists = existing.some((e) => e.type === "slack");

    if (!slackExists) {
      await prisma.integrationCredential.create({
        data: {
          id: `ic_slack_${Date.now()}`,
          userId: userId,
          type: "slack",
          data: {
            token: process.env.SLACK_BOT_TOKEN || "dummy-token",
            refreshToken: null,
            expiresAt: null,
            botUserId: process.env.SLACK_BOT_USER_ID || "U123456",
            teamId: process.env.SLACK_TEAM_ID || "T123456",
          },
          updatedAt: new Date(),
        },
      });
      console.log("✅ Slack integration added!");
    } else {
      console.log("✅ Slack integration already exists");
    }

    // Also add Google Drive integration for completeness
    const driveExists = existing.some((e) => e.type === "google_drive");

    if (!driveExists) {
      await prisma.integrationCredential.create({
        data: {
          id: `ic_drive_${Date.now()}`,
          userId: userId,
          type: "google_drive",
          data: {
            token: "dummy-google-token",
            refreshToken: "dummy-refresh-token",
            expiresAt: null,
          },
          updatedAt: new Date(),
        },
      });
      console.log("✅ Google Drive integration added!");
    } else {
      console.log("✅ Google Drive integration already exists");
    }

    // Verify integrations are now available
    const updated = await prisma.integrationCredential.findMany({
      where: { userId },
      select: { type: true },
    });

    console.log(
      "\nUpdated integrations:",
      updated.map((e) => e.type).join(", ")
    );
    console.log(
      "\n✅ Integration fix complete! The agent should now recognize Slack and Drive."
    );
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

fixSlackIntegration();
