export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { authOptions } from "@/lib/auth";
import { SlackService } from "@/lib/slack";
import { prisma } from "@/lib/prisma";
import { canUserModifyProject } from "@/lib/rbac";
import { AuditLogger } from "@/lib/audit";

// Link a project to a Slack channel
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, channelId, channelName } = body;

    if (!projectId || !channelId || !channelName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if user can modify the project
    const canModify = await canUserModifyProject(session.user.id, projectId);
    if (!canModify) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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

    // Link the project to the channel
    const slackService = SlackService.getInstance();
    await slackService.linkProjectToChannel(projectId, channelId, channelName);

    // Log the action
    await AuditLogger.logSuccess(
      session.user.id,
      "link_slack_channel",
      "project",
      projectId,
      {
        channelId,
        channelName,
      }
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to link project to Slack channel:", error);
    return NextResponse.json(
      { error: "Failed to link channel" },
      { status: 500 }
    );
  }
}

// Unlink a project from a Slack channel
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json(
        { error: "Missing project ID" },
        { status: 400 }
      );
    }

    // Check if user can modify the project
    const canModify = await canUserModifyProject(session.user.id, projectId);
    if (!canModify) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Remove the Slack channel link
    await prisma.projectIntegration.deleteMany({
      where: {
        projectId,
        key: "slackChannelId",
      },
    });

    // Log the action
    await AuditLogger.logSuccess(
      session.user.id,
      "unlink_slack_channel",
      "project",
      projectId
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to unlink project from Slack channel:", error);
    return NextResponse.json(
      { error: "Failed to unlink channel" },
      { status: 500 }
    );
  }
}
