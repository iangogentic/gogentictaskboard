#!/usr/bin/env node
/**
 * Fix missing Slack user IDs in existing IntegrationCredential records
 * This script will:
 * 1. Find all Slack integrations without user IDs
 * 2. Use the bot token to call auth.test to get bot info
 * 3. Map the portal user to their Slack user ID
 */

const { PrismaClient } = require("@prisma/client");
const { WebClient } = require("@slack/web-api");
require("dotenv").config();

const prisma = new PrismaClient();

async function fixSlackUserIds() {
  console.log("🔧 Starting Slack User ID fix script...\n");

  try {
    // Find all Slack integrations
    const slackIntegrations = await prisma.integrationCredential.findMany({
      where: {
        type: "slack",
      },
      include: {
        user: true,
      },
    });

    console.log(`Found ${slackIntegrations.length} Slack integrations\n`);

    let fixedCount = 0;
    let errorCount = 0;

    for (const integration of slackIntegrations) {
      console.log(
        `\n📋 Processing integration for user: ${integration.user?.email || integration.userId}`
      );

      try {
        // Get the token from the data field
        const token = integration.data?.token || integration.data?.accessToken;

        if (!token) {
          console.log("  ❌ No token found in integration data");
          errorCount++;
          continue;
        }

        // Create Slack client with the bot token
        const slack = new WebClient(token);

        // Call auth.test to get bot info
        const authResponse = await slack.auth.test();
        console.log(`  ✓ Bot authenticated: ${authResponse.url}`);
        console.log(`  ✓ Bot User ID: ${authResponse.user_id}`);
        console.log(`  ✓ Bot Name: ${authResponse.user}`);

        // Try to find the user by email
        let slackUserId = null;

        if (integration.user?.email) {
          try {
            // Try to look up user by email
            const userResponse = await slack.users.lookupByEmail({
              email: integration.user.email,
            });

            if (userResponse.ok && userResponse.user) {
              slackUserId = userResponse.user.id;
              console.log(
                `  ✓ Found Slack user by email: ${slackUserId} (${userResponse.user.name})`
              );
            }
          } catch (emailError) {
            console.log(
              `  ⚠️  Could not find user by email: ${emailError.message}`
            );
            // This is okay - the user might not have the same email in Slack
          }
        }

        // If we couldn't find by email, we'll need to use a fallback
        if (!slackUserId) {
          // For now, we'll store the bot user ID as a fallback
          // In production, you might want to prompt the user to re-authenticate
          console.log(
            "  ℹ️  Using bot user ID as fallback (user will need to re-authenticate)"
          );
          slackUserId = authResponse.user_id;
        }

        // Update the integration with the correct data structure
        const updatedData = {
          ...integration.data,
          token: token,
          botUserId: authResponse.user_id,
          teamId: authResponse.team_id,
        };

        const updatedMetadata = {
          ...integration.metadata,
          slackUserId: slackUserId,
          fixedAt: new Date().toISOString(),
          botInfo: {
            botId: authResponse.user_id,
            botName: authResponse.user,
            workspace: authResponse.url,
          },
        };

        // Update the database
        await prisma.integrationCredential.update({
          where: {
            id: integration.id,
          },
          data: {
            data: updatedData,
            metadata: updatedMetadata,
          },
        });

        console.log("  ✅ Integration updated successfully");
        fixedCount++;
      } catch (error) {
        console.error(`  ❌ Error processing integration: ${error.message}`);
        errorCount++;
      }
    }

    console.log("\n" + "=".repeat(50));
    console.log(`\n📊 Summary:`);
    console.log(`  ✅ Fixed: ${fixedCount} integrations`);
    console.log(`  ❌ Errors: ${errorCount} integrations`);

    if (errorCount > 0) {
      console.log(
        `\n⚠️  Some integrations could not be fixed. Users may need to re-authenticate.`
      );
    }
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
fixSlackUserIds()
  .then(() => {
    console.log("\n✨ Script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });
