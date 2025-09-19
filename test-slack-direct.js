// Direct Slack API test - bypasses authentication
const { WebClient } = require("@slack/web-api");
require("dotenv").config({ path: ".env.local" });

async function testSlackIntegration() {
  console.log("=== Testing Slack Integration Directly ===\n");

  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) {
    console.error("❌ SLACK_BOT_TOKEN not found in .env.local");
    return;
  }

  console.log("✓ Bot Token found:", token.substring(0, 20) + "...\n");

  const slack = new WebClient(token);

  try {
    // 1. Test authentication
    console.log("1. Testing Authentication...");
    const authResult = await slack.auth.test();
    console.log("   ✅ Authenticated as:", authResult.user);
    console.log("   Workspace:", authResult.team);
    console.log("   Bot User ID:", authResult.user_id);
    console.log("   App ID:", authResult.app_id);

    // 2. List channels
    console.log("\n2. Listing Channels...");
    const channelsResult = await slack.conversations.list({
      types: "public_channel",
      limit: 10,
    });

    const channels = channelsResult.channels || [];
    console.log(`   Found ${channels.length} public channels:`);

    channels.forEach((ch) => {
      console.log(
        `   - #${ch.name} (${ch.id})${ch.is_member ? " [BOT IS MEMBER]" : ""}`
      );
    });

    // 3. Find a channel the bot is a member of
    const botChannel = channels.find((ch) => ch.is_member);

    if (botChannel) {
      console.log(`\n3. Sending Test Message to #${botChannel.name}...`);

      const messageResult = await slack.chat.postMessage({
        channel: botChannel.id,
        text: "GoGentic Portal Test Message",
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: "*🤖 GoGentic Portal Integration Test*\n\nThis is a test message to verify Slack integration is working.",
            },
          },
          {
            type: "section",
            fields: [
              {
                type: "mrkdwn",
                text: "*Status:* ✅ Connected",
              },
              {
                type: "mrkdwn",
                text: `*Time:* ${new Date().toLocaleTimeString()}`,
              },
            ],
          },
          {
            type: "divider",
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: "🚀 *Available Features:*\n• Project updates\n• Task notifications\n• Daily summaries\n• Team collaboration",
            },
          },
        ],
      });

      if (messageResult.ok) {
        console.log(`   ✅ Message sent successfully!`);
        console.log(`   Message timestamp: ${messageResult.ts}`);
        console.log(
          `   View in Slack: https://gogentic-ai.slack.com/archives/${botChannel.id}`
        );
      }
    } else {
      console.log("\n3. Cannot Send Test Message");
      console.log("   ⚠️  Bot is not a member of any public channels");
      console.log("   To test messaging:");
      console.log("   1. Add the bot to a channel in Slack");
      console.log("   2. Use: /invite @gogentic_portal");
    }

    // 4. Test user lookup (for DMs)
    console.log("\n4. Testing User Lookup...");
    try {
      const usersResult = await slack.users.list({ limit: 5 });
      const realUsers =
        usersResult.members?.filter((u) => !u.is_bot && !u.deleted) || [];
      console.log(`   Found ${realUsers.length} users`);

      if (realUsers.length > 0) {
        console.log("   Can send DMs to users for daily summaries ✅");
      }
    } catch (error) {
      console.log("   ⚠️  Cannot list users (may need additional scopes)");
    }

    // 5. Check bot info
    console.log("\n5. Bot Configuration:");
    try {
      const botInfo = await slack.bots.info({ bot: authResult.user_id });
      if (botInfo.ok && botInfo.bot) {
        console.log("   Name:", botInfo.bot.name);
        console.log(
          "   Icons:",
          botInfo.bot.icons ? "✅ Configured" : "⚠️  Not set"
        );
      }
    } catch (error) {
      console.log("   ⚠️  Cannot fetch bot info");
    }

    console.log("\n=== Slack Integration Status: WORKING ✅ ===");
  } catch (error) {
    console.error("\n❌ Slack test failed:", error.message);
    if (error.data?.error) {
      console.error("Error code:", error.data.error);

      if (error.data.error === "invalid_auth") {
        console.error("\nToken may be expired or invalid. Please:");
        console.error("1. Go to https://api.slack.com/apps");
        console.error("2. Select your app");
        console.error('3. Go to "OAuth & Permissions"');
        console.error('4. Copy the "Bot User OAuth Token"');
        console.error("5. Update SLACK_BOT_TOKEN in .env.local");
      }
    }
  }
}

testSlackIntegration();
