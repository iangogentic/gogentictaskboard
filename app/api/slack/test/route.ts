export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { authOptions } from "@/lib/auth";
import { SlackService } from "@/lib/slack";

// Test Slack connection
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only allow admins to test the connection
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const slackService = SlackService.getInstance();
    const isConnected = await slackService.testConnection();

    if (isConnected) {
      return NextResponse.json({
        connected: true,
        message: "Slack connection successful",
      });
    } else {
      return NextResponse.json({
        connected: false,
        message: "Slack connection failed - check SLACK_BOT_TOKEN",
      });
    }
  } catch (error: any) {
    console.error("Slack connection test error:", error);
    return NextResponse.json(
      {
        connected: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
