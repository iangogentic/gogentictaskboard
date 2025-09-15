export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { authOptions } from "@/lib/auth";
import { SlackService } from "@/lib/slack";
import { prisma } from "@/lib/prisma";

// Get list of Slack channels
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has Slack integration
    const integration = await prisma.integrationCredential.findFirst({
      where: {
        userId: session.user.id,
        type: "slack",
      },
    });

    if (!integration) {
      return NextResponse.json(
        { error: "Slack not connected" },
        { status: 400 }
      );
    }

    // Get channels from Slack
    const slackService = SlackService.getInstance();
    const channels = await slackService.getChannels();

    return NextResponse.json({ channels });
  } catch (error: any) {
    console.error("Failed to get Slack channels:", error);
    return NextResponse.json(
      { error: "Failed to get channels" },
      { status: 500 }
    );
  }
}
