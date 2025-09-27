import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { SlackService } from "@/lib/slack";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { userId } = body;

    // Get user's Slack mapping
    const integration = await prisma.integrationCredential.findFirst({
      where: {
        userId,
        type: "slack",
      },
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    });

    if (!integration) {
      return NextResponse.json(
        { error: "No Slack mapping found for this user" },
        { status: 404 }
      );
    }

    const slackUserId = (integration.metadata as any)?.slackUserId;
    if (!slackUserId) {
      return NextResponse.json(
        { error: "No Slack User ID found in mapping" },
        { status: 400 }
      );
    }

    // Send test message
    const slack = SlackService.getInstance();
    const testProjects = [
      {
        id: "test-1",
        title: "Test Project",
        notes: "This is a test message",
        status: "In Progress",
        lastUpdatedAt: new Date(),
      },
    ];

    await slack.sendProjectUpdateRequest(
      userId,
      testProjects,
      process.env.NEXT_PUBLIC_APP_URL ||
        "https://gogentic-portal-real.vercel.app"
    );

    return NextResponse.json({
      success: true,
      message: `Test DM sent to ${integration.user?.name} (${slackUserId})`,
    });
  } catch (error: any) {
    console.error("Failed to send test DM:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send test DM" },
      { status: 500 }
    );
  }
}
