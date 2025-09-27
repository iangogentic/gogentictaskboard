import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

// Admin endpoint to manually map users to Slack IDs
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();

    // Check if user is admin
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized - Admin only" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { userId, slackUserId } = body;

    if (!userId || !slackUserId) {
      return NextResponse.json(
        { error: "userId and slackUserId are required" },
        { status: 400 }
      );
    }

    // Create or update the Slack integration for this user
    await prisma.integrationCredential.upsert({
      where: {
        userId_type: {
          userId,
          type: "slack",
        },
      },
      create: {
        id: randomUUID(),
        userId,
        type: "slack",
        data: {
          token: process.env.SLACK_BOT_TOKEN, // Use the workspace bot token
          botUserId: process.env.SLACK_BOT_USER_ID || "bot",
          teamId: process.env.SLACK_TEAM_ID || "workspace",
        },
        metadata: {
          slackUserId, // This is what we need for DMs
          addedBy: session.user.id,
          addedAt: new Date().toISOString(),
          isManual: true,
        },
        updatedAt: new Date(),
      },
      update: {
        metadata: {
          slackUserId,
          updatedBy: session.user.id,
          updatedAt: new Date().toISOString(),
          isManual: true,
        },
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Slack mapping created for user ${userId}`,
    });
  } catch (error: any) {
    console.error("Failed to create Slack mapping:", error);
    return NextResponse.json(
      { error: "Failed to create Slack mapping" },
      { status: 500 }
    );
  }
}

// Get all Slack mappings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized - Admin only" },
        { status: 401 }
      );
    }

    const mappings = await prisma.integrationCredential.findMany({
      where: { type: "slack" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    const formattedMappings = mappings.map((m) => ({
      userId: m.userId,
      userName: m.user?.name,
      userEmail: m.user?.email,
      slackUserId: (m.metadata as any)?.slackUserId,
      isManual: (m.metadata as any)?.isManual,
      createdAt: m.createdAt,
    }));

    return NextResponse.json({ mappings: formattedMappings });
  } catch (error: any) {
    console.error("Failed to get Slack mappings:", error);
    return NextResponse.json(
      { error: "Failed to get Slack mappings" },
      { status: 500 }
    );
  }
}
