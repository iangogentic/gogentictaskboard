import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Admin endpoint to add integration credentials
export async function POST(request: NextRequest) {
  try {
    // Check for admin token
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (token !== process.env.ADMIN_FIX_TOKEN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    let slackAdded = 0;
    let driveAdded = 0;
    const errors: string[] = [];

    // Add integrations for all users
    for (const user of users) {
      try {
        // Check existing integrations
        const existing = await prisma.integrationCredential.findMany({
          where: { userId: user.id },
          select: { type: true },
        });

        // Add Slack if missing
        const slackExists = existing.some((e) => e.type === "slack");
        if (!slackExists && process.env.SLACK_BOT_TOKEN) {
          await prisma.integrationCredential.create({
            data: {
              id: `ic_slack_${user.id.substring(0, 8)}_${Date.now()}`,
              userId: user.id,
              type: "slack",
              data: {
                token: process.env.SLACK_BOT_TOKEN,
                refreshToken: null,
                expiresAt: null,
                botUserId: process.env.SLACK_BOT_USER_ID || "U123456",
                teamId: process.env.SLACK_TEAM_ID || "T123456",
              },
              updatedAt: new Date(),
            },
          });
          slackAdded++;
        }

        // Add Google Drive if missing
        const driveExists = existing.some((e) => e.type === "google_drive");
        if (!driveExists) {
          await prisma.integrationCredential.create({
            data: {
              id: `ic_drive_${user.id.substring(0, 8)}_${Date.now()}`,
              userId: user.id,
              type: "google_drive",
              data: {
                token: process.env.GOOGLE_CLIENT_ID || "dummy-google-token",
                refreshToken: "dummy-refresh-token",
                expiresAt: null,
              },
              updatedAt: new Date(),
            },
          });
          driveAdded++;
        }
      } catch (error: any) {
        errors.push(`User ${user.id}: ${error.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Integration fix complete",
      stats: {
        totalUsers: users.length,
        slackAdded,
        driveAdded,
        errors: errors.length,
      },
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error("Fix integrations error:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to fix integrations",
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}
