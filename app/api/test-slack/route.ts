import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SlackService } from "@/lib/slack";

export async function GET(request: NextRequest) {
  try {
    // Check if Slack token is configured
    const hasSlackToken = !!process.env.SLACK_BOT_TOKEN;

    // Get count of users with Slack integration
    const usersWithSlack = await prisma.integrationCredential.count({
      where: { type: "slack" },
    });

    // Get total users
    const totalUsers = await prisma.user.count();

    // Try to send a test message if we have the token
    let testMessageResult = { sent: false, error: null as string | null };

    if (hasSlackToken) {
      try {
        const slack = SlackService.getInstance();
        await slack.sendMessage({
          channel: "#general",
          text: "✅ Slack integration test from production - All users now have access!",
        });
        testMessageResult.sent = true;
      } catch (error: any) {
        testMessageResult.error = error.message;
      }
    }

    return NextResponse.json({
      success: true,
      environment: process.env.NODE_ENV,
      slack: {
        tokenConfigured: hasSlackToken,
        tokenLength: process.env.SLACK_BOT_TOKEN?.length || 0,
        usersWithIntegration: usersWithSlack,
        totalUsers: totalUsers,
        coveragePercent: Math.round((usersWithSlack / totalUsers) * 100),
      },
      testMessage: testMessageResult,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error.message || "Test failed",
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}
