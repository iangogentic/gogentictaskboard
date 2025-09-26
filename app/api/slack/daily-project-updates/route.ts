export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SlackService } from "@/lib/slack";

// Send daily project update request to user via Slack DM
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();

    // This can be triggered by cron or admin, so session might not exist
    const body = await request.json();
    const { userId, isScheduled = false } = body;

    // If not scheduled and no session, unauthorized
    if (!isScheduled && !session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the user's Slack integration
    const integration = await prisma.integrationCredential.findFirst({
      where: {
        userId,
        type: "slack",
      },
    });

    if (!integration) {
      return NextResponse.json(
        { error: "Slack not connected for this user" },
        { status: 400 }
      );
    }

    // Get the user's active projects
    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { pmId: userId },
          {
            ProjectMember: {
              some: {
                userId: userId,
                role: { in: ["owner", "member"] },
              },
            },
          },
        ],
        status: { in: ["in_progress", "planning", "review"] },
      },
      select: {
        id: true,
        title: true,
        notes: true,
        status: true,
        lastUpdatedAt: true,
      },
      orderBy: {
        lastUpdatedAt: "desc",
      },
    });

    if (projects.length === 0) {
      console.log(`No active projects for user ${userId}`);
      return NextResponse.json({
        success: true,
        message: "No active projects to report",
      });
    }

    // Get the base URL for project links
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3002";

    // Send the Slack DM with project links
    const slackService = SlackService.getInstance();
    await slackService.sendProjectUpdateRequest(userId, projects, baseUrl);

    // Update the last summary timestamp
    await prisma.integrationCredential.update({
      where: { id: integration.id },
      data: {
        metadata: {
          ...((integration.metadata as any) || {}),
          lastProjectUpdateRequest: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json({
      success: true,
      projectCount: projects.length,
    });
  } catch (error: any) {
    console.error("Failed to send project update request:", error);
    return NextResponse.json(
      { error: "Failed to send project update request" },
      { status: 500 }
    );
  }
}

// Get all users with Slack integration for bulk sending
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();

    // Only admins can get all users for bulk sending
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all users with Slack integration
    const integrations = await prisma.integrationCredential.findMany({
      where: {
        type: "slack",
      },
      select: {
        userId: true,
        metadata: true,
      },
    });

    // Get user details for each integration
    const users = await Promise.all(
      integrations.map(async (integration) => {
        if (!integration.userId) {
          return null;
        }
        const user = await prisma.user.findUnique({
          where: { id: integration.userId },
          select: { id: true, name: true, email: true },
        });
        return user
          ? {
              id: integration.userId,
              name: user.name,
              email: user.email,
              lastUpdateRequest:
                (integration.metadata as any)?.lastProjectUpdateRequest || null,
            }
          : null;
      })
    );

    // Filter out null users
    const validUsers = users.filter((user) => user !== null);

    return NextResponse.json({ users: validUsers });
  } catch (error: any) {
    console.error("Failed to get users with Slack:", error);
    return NextResponse.json({ error: "Failed to get users" }, { status: 500 });
  }
}
