#!/usr/bin/env node
/**
 * Quick fix for Slack integrations - maps portal userId to Slack for testing
 * This is a temporary solution until users re-authenticate
 */

const { PrismaClient } = require("@prisma/client");
require("dotenv").config();

const prisma = new PrismaClient();

async function quickFix() {
  console.log("🚀 Quick fix for Slack User IDs...\n");

  try {
    // Find all Slack integrations without proper user IDs
    const integrations = await prisma.integrationCredential.findMany({
      where: {
        type: "slack",
      },
    });

    console.log(`Found ${integrations.length} Slack integrations to fix\n`);

    for (const integration of integrations) {
      const metadata = integration.metadata || {};

      // If no slackUserId, use the portal userId as a placeholder
      if (!metadata.slackUserId) {
        console.log(`Fixing integration for user: ${integration.userId}`);

        await prisma.integrationCredential.update({
          where: { id: integration.id },
          data: {
            metadata: {
              ...metadata,
              slackUserId: integration.userId, // Use portal user ID as placeholder
              needsReauth: true, // Flag for re-authentication
              fixedAt: new Date().toISOString(),
            },
          },
        });

        console.log(`  ✅ Set placeholder Slack ID: ${integration.userId}`);
      } else {
        console.log(
          `  ⏭️  Skipping ${integration.userId} - already has Slack ID`
        );
      }
    }

    console.log("\n✨ Quick fix complete!");
    console.log(
      "⚠️  Note: Users will need to re-authenticate for proper Slack DMs"
    );
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

quickFix();
