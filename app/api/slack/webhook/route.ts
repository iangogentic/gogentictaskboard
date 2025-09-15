export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { SlackService } from "@/lib/slack";
import { AuditLogger } from "@/lib/audit";

// Verify Slack request signature
function verifySlackSignature(
  signature: string,
  timestamp: string,
  body: string
): boolean {
  const signingSecret = process.env.SLACK_SIGNING_SECRET;
  if (!signingSecret) {
    console.error("SLACK_SIGNING_SECRET not configured");
    return false;
  }

  // Check timestamp to prevent replay attacks (within 5 minutes)
  const currentTime = Math.floor(Date.now() / 1000);
  if (Math.abs(currentTime - parseInt(timestamp)) > 300) {
    return false;
  }

  // Construct the signature base string
  const sigBasestring = `v0:${timestamp}:${body}`;

  // Calculate expected signature
  const mySignature =
    "v0=" +
    crypto
      .createHmac("sha256", signingSecret)
      .update(sigBasestring)
      .digest("hex");

  // Compare signatures
  return crypto.timingSafeEqual(
    Buffer.from(mySignature),
    Buffer.from(signature)
  );
}

// Handle Slack events and interactions
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-slack-signature") || "";
    const timestamp = request.headers.get("x-slack-request-timestamp") || "";

    // Verify the request is from Slack
    if (!verifySlackSignature(signature, timestamp, body)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }

    const payload = JSON.parse(body);

    // Handle URL verification challenge
    if (payload.type === "url_verification") {
      return NextResponse.json({ challenge: payload.challenge });
    }

    // Handle event callbacks
    if (payload.type === "event_callback") {
      const event = payload.event;

      switch (event.type) {
        case "app_mention":
          // Bot was mentioned in a channel
          await handleAppMention(event);
          break;

        case "message":
          // Direct message to the bot
          if (event.channel_type === "im" && !event.bot_id) {
            await handleDirectMessage(event);
          }
          break;

        case "app_home_opened":
          // User opened the bot's home tab
          await handleAppHomeOpened(event);
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      return NextResponse.json({ ok: true });
    }

    // Handle interactive messages (button clicks, etc.)
    if (payload.type === "block_actions") {
      const action = payload.actions[0];

      switch (action.action_id) {
        case "view_dashboard":
        case "update_status":
          // These are URL buttons, handled by Slack directly
          break;

        default:
          console.log(`Unhandled action: ${action.action_id}`);
      }

      return NextResponse.json({ ok: true });
    }

    // Handle slash commands
    if (payload.command) {
      return await handleSlashCommand(payload);
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Slack webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Handle app mentions
async function handleAppMention(event: any) {
  try {
    const slackService = SlackService.getInstance();

    // Simple response when mentioned
    await slackService.sendMessage({
      channel: event.channel,
      text:
        `Hi <@${event.user}>! I'm the Gogentic Portal bot. I can help you with:\n` +
        `• Daily work summaries\n` +
        `• Project updates\n` +
        `• Task notifications\n\n` +
        `Use \`/gogentic help\` to see available commands.`,
      threadTs: event.ts, // Reply in thread
    });

    await AuditLogger.logSuccess(
      "system",
      "slack_mention_response",
      "integration",
      event.ts,
      { channel: event.channel, user: event.user }
    );
  } catch (error: any) {
    console.error("Failed to handle app mention:", error);
  }
}

// Handle direct messages
async function handleDirectMessage(event: any) {
  try {
    const slackService = SlackService.getInstance();
    const text = event.text.toLowerCase();

    let response = "";

    if (text.includes("help")) {
      response =
        "Here's what I can help you with:\n" +
        "• `summary` - Get your daily work summary\n" +
        "• `tasks` - View your active tasks\n" +
        "• `projects` - List your projects\n" +
        "• `help` - Show this help message";
    } else if (text.includes("summary")) {
      // Trigger daily summary for this user
      const user = await getUserBySlackId(event.user);
      if (user) {
        const summary = await generateUserSummary(user.id);
        await slackService.sendDailyWorkDM(user.id, summary);
        return; // Don't send additional response
      } else {
        response =
          "I couldn't find your account. Please make sure your Slack is connected in the portal.";
      }
    } else if (text.includes("tasks")) {
      response =
        "View your tasks at: " + process.env.NEXT_PUBLIC_APP_URL + "/my-work";
    } else if (text.includes("projects")) {
      response =
        "View your projects at: " +
        process.env.NEXT_PUBLIC_APP_URL +
        "/projects";
    } else {
      response = "I didn't understand that. Type `help` to see what I can do.";
    }

    await slackService.sendMessage({
      channel: event.channel,
      text: response,
    });
  } catch (error: any) {
    console.error("Failed to handle direct message:", error);
  }
}

// Handle app home opened
async function handleAppHomeOpened(event: any) {
  // Could update the home tab with user-specific content
  console.log(`User ${event.user} opened app home`);
}

// Handle slash commands
async function handleSlashCommand(payload: any) {
  const { command, text, user_id, channel_id } = payload;

  if (command === "/gogentic") {
    const args = text.trim().split(" ");
    const subcommand = args[0]?.toLowerCase();

    switch (subcommand) {
      case "help":
        return NextResponse.json({
          response_type: "ephemeral",
          text:
            "Gogentic Portal Commands:\n" +
            "• `/gogentic summary` - Get your daily work summary\n" +
            "• `/gogentic link [project-id]` - Link this channel to a project\n" +
            "• `/gogentic unlink` - Unlink this channel from its project\n" +
            "• `/gogentic help` - Show this help message",
        });

      case "summary":
        const user = await getUserBySlackId(user_id);
        if (user) {
          // Send summary asynchronously
          setTimeout(async () => {
            const slackService = SlackService.getInstance();
            const summary = await generateUserSummary(user.id);
            await slackService.sendDailyWorkDM(user.id, summary);
          }, 0);

          return NextResponse.json({
            response_type: "ephemeral",
            text: "I'll send your daily summary in a DM shortly!",
          });
        } else {
          return NextResponse.json({
            response_type: "ephemeral",
            text: "Please connect your Slack account in the portal first.",
          });
        }

      case "link":
        const projectId = args[1];
        if (!projectId) {
          return NextResponse.json({
            response_type: "ephemeral",
            text: "Please provide a project ID: `/gogentic link [project-id]`",
          });
        }
        // Would need to verify user has access to project
        return NextResponse.json({
          response_type: "ephemeral",
          text: `To link this channel to a project, please use the portal interface.`,
        });

      default:
        return NextResponse.json({
          response_type: "ephemeral",
          text: "Unknown command. Use `/gogentic help` to see available commands.",
        });
    }
  }

  return NextResponse.json({ ok: true });
}

// Helper: Get user by Slack ID
async function getUserBySlackId(slackUserId: string) {
  const integration = await prisma.integrationCredential.findFirst({
    where: {
      type: "slack",
      metadata: {
        path: ["$.slackUserId"],
        equals: slackUserId,
      },
    },
  });

  if (!integration?.userId) return null;

  return await prisma.user.findUnique({
    where: { id: integration.userId },
  });
}

// Helper: Generate user summary
async function generateUserSummary(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [completedCount, inProgressTasks, blockedTasks] = await Promise.all([
    prisma.task.count({
      where: {
        assigneeId: userId,
        status: "done",
        updatedAt: { gte: today },
      },
    }),
    prisma.task.findMany({
      where: {
        assigneeId: userId,
        status: "in_progress",
      },
      include: {
        project: { select: { title: true } },
      },
      take: 10,
    }),
    prisma.task.findMany({
      where: {
        assigneeId: userId,
        status: "blocked",
      },
      include: {
        project: { select: { title: true } },
      },
      take: 5,
    }),
  ]);

  return {
    userId,
    tasks: inProgressTasks.map((task) => ({
      id: task.id,
      title: task.title,
      status: task.status,
      projectTitle: task.project.title,
      dueDate: task.dueDate || undefined,
    })),
    blockedTasks: blockedTasks.map((task) => ({
      id: task.id,
      title: task.title,
      projectTitle: task.project.title,
    })),
    completedToday: completedCount,
    inProgress: inProgressTasks.length,
  };
}
