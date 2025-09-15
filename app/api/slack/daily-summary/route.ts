export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { authOptions } from "@/lib/auth";
import { SlackService } from "@/lib/slack";
import { prisma } from "@/lib/prisma";
import { AuditLogger } from "@/lib/audit";

// Send daily work summary to a user
export async function POST(request: NextRequest) {
  let session;
  try {
    session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { userId = session.user.id } = body;

    // Check if user has Slack integration
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

    // Get user's tasks
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get tasks completed today
    const completedTasks = await prisma.task.count({
      where: {
        assigneeId: userId,
        status: "done",
        updatedAt: {
          gte: today,
        },
      },
    });

    // Get in-progress tasks
    const inProgressTasks = await prisma.task.findMany({
      where: {
        assigneeId: userId,
        status: "in_progress",
      },
      include: {
        project: {
          select: {
            title: true,
          },
        },
      },
      take: 10,
    });

    // Get blocked tasks
    const blockedTasks = await prisma.task.findMany({
      where: {
        assigneeId: userId,
        status: "blocked",
      },
      include: {
        project: {
          select: {
            title: true,
          },
        },
      },
      take: 5,
    });

    // Prepare summary
    const summary = {
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
      completedToday: completedTasks,
      inProgress: inProgressTasks.length,
    };

    // Send the summary via Slack
    const slackService = SlackService.getInstance();
    await slackService.sendDailyWorkDM(userId, summary);

    // Log the action
    await AuditLogger.logSuccess(
      session.user.id,
      "send_daily_summary",
      "integration",
      userId,
      {
        tasksCount: summary.tasks.length,
        blockedCount: summary.blockedTasks.length,
        completedToday: summary.completedToday,
      }
    );

    return NextResponse.json({ success: true, summary });
  } catch (error: any) {
    console.error("Failed to send daily summary:", error);

    await AuditLogger.logFailure(
      session?.user?.id || "system",
      "send_daily_summary",
      "integration",
      error.message
    );

    return NextResponse.json(
      { error: "Failed to send daily summary" },
      { status: 500 }
    );
  }
}

// Get daily summary status for users
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if current user has admin role
    if (session.user.role !== "admin" && session.user.role !== "pm") {
      // Regular users can only see their own status
      const integration = await prisma.integrationCredential.findFirst({
        where: {
          userId: session.user.id,
          type: "slack",
        },
      });

      return NextResponse.json({
        users: [
          {
            id: session.user.id,
            name: session.user.name,
            email: session.user.email,
            slackConnected: !!integration,
            lastSummary: integration?.metadata
              ? (integration.metadata as any).lastDailySummary
              : null,
          },
        ],
      });
    }

    // Admins and PMs can see all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    // Get Slack integration credentials for all users
    const integrations = await prisma.integrationCredential.findMany({
      where: {
        type: "slack",
        userId: {
          in: users.map((u) => u.id),
        },
      },
      select: {
        userId: true,
        metadata: true,
      },
    });

    const integrationMap = new Map(
      integrations.map((i) => [i.userId, i.metadata])
    );

    const userStatuses = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      slackConnected: integrationMap.has(user.id),
      lastSummary: integrationMap.has(user.id)
        ? (integrationMap.get(user.id) as any)?.lastDailySummary || null
        : null,
    }));

    return NextResponse.json({ users: userStatuses });
  } catch (error: any) {
    console.error("Failed to get daily summary status:", error);
    return NextResponse.json(
      { error: "Failed to get status" },
      { status: 500 }
    );
  }
}
