export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SlackService } from "@/lib/slack";

// Vercel Cron endpoint for daily project update requests
// Add to vercel.json:
// {
//   "crons": [{
//     "path": "/api/cron/daily-project-updates",
//     "schedule": "0 9 * * *"
//   }]
// }

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret if configured
    const authHeader = request.headers.get("authorization");
    if (
      process.env.CRON_SECRET &&
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const slackService = SlackService.getInstance();
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3002";

    // Get all users with Slack integration
    const integrations = await prisma.integrationCredential.findMany({
      where: {
        type: "slack",
      },
      select: {
        userId: true,
      },
    });

    // Get user details for each integration
    const usersWithSlack = await Promise.all(
      integrations.map(async (integration) => {
        if (!integration.userId) {
          return { ...integration, user: null };
        }
        const user = await prisma.user.findUnique({
          where: { id: integration.userId },
          select: { id: true, name: true },
        });
        return { ...integration, user };
      })
    );

    console.log(`Found ${usersWithSlack.length} users with Slack integration`);

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // Send updates to each user
    for (const integration of usersWithSlack) {
      try {
        // Skip if no userId
        if (!integration.userId || !integration.user) {
          console.log("Skipping integration with missing user data");
          continue;
        }

        // Get user's active projects
        const projects = await prisma.project.findMany({
          where: {
            OR: [
              { pmId: integration.userId },
              {
                ProjectMember: {
                  some: {
                    userId: integration.userId,
                    role: { in: ["owner", "member"] },
                  },
                },
              },
            ],
            status: {
              in: ["in_progress", "planning", "review"],
              notIn: ["completed", "cancelled", "archived"],
            },
          },
          select: {
            id: true,
            title: true,
            notes: true,
            status: true,
            lastUpdatedAt: true,
          },
          orderBy: {
            lastUpdatedAt: "asc", // Oldest first (need updates most)
          },
          take: 10, // Limit to 10 projects per user
        });

        if (projects.length === 0) {
          console.log(
            `No active projects for user ${integration.user?.name || integration.userId}`
          );
          continue;
        }

        // Send the Slack DM
        await slackService.sendProjectUpdateRequest(
          integration.userId,
          projects,
          baseUrl
        );

        console.log(
          `Sent update request to ${integration.user?.name || integration.userId} for ${projects.length} projects`
        );
        successCount++;
      } catch (error: any) {
        console.error(
          `Failed to send to user ${integration.user?.name || integration.userId}:`,
          error.message
        );
        errors.push(
          `${integration.user?.name || integration.userId}: ${error.message}`
        );
        errorCount++;
      }
    }

    // Log summary
    const summary = {
      total: usersWithSlack.length,
      successCount: successCount,
      errorCount: errorCount,
      timestamp: new Date().toISOString(),
      ...(errors.length > 0 && { errorDetails: errors }),
    };

    console.log("Daily project updates cron completed:", summary);

    return NextResponse.json({
      success: true,
      ...summary,
    });
  } catch (error: any) {
    console.error("Daily project updates cron failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
