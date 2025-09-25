export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GoogleDriveService } from "@/lib/google-drive";
import { AuditLogger } from "@/lib/audit";
import { randomUUID } from "crypto";

// Google OAuth callback handler
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    // Handle user denial
    if (error) {
      console.error("Google OAuth error:", error);
      return NextResponse.redirect(
        new URL("/settings/integrations?error=google_auth_denied", request.url)
      );
    }

    if (!code) {
      return NextResponse.json(
        { error: "Missing authorization code" },
        { status: 400 }
      );
    }

    // Exchange code for tokens
    const googleDrive = GoogleDriveService.getInstance();
    const tokens = await googleDrive.getTokens(code);

    // Store the integration credentials
    await prisma.integrationCredential.upsert({
      where: {
        userId_type: {
          userId: session.user.id,
          type: "google_drive",
        },
      },
      create: {
        id: randomUUID(),
        userId: session.user.id,
        type: "google_drive",
        data: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiryDate: tokens.expiry_date,
        },
        metadata: {
          connectedAt: new Date().toISOString(),
        },
        updatedAt: new Date(),
      },
      update: {
        data: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiryDate: tokens.expiry_date,
        },
        metadata: {
          reconnectedAt: new Date().toISOString(),
        },
        updatedAt: new Date(),
      },
    });

    // Log the integration
    await AuditLogger.logSuccess(
      session.user.id,
      "link_integration",
      "integration" as any,
      undefined,
      {
        type: "google_drive",
      }
    );

    // Redirect back to settings or integration page
    return NextResponse.redirect(
      new URL("/settings/integrations?success=google", request.url)
    );
  } catch (error: any) {
    console.error("Google OAuth error:", error);
    return NextResponse.redirect(
      new URL("/settings/integrations?error=google_auth_failed", request.url)
    );
  }
}

// Initiate Google OAuth flow
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Generate state for CSRF protection
    const state = Math.random().toString(36).substring(7);

    // Get auth URL
    const googleDrive = GoogleDriveService.getInstance();
    const authUrl = googleDrive.getAuthUrl(state);

    return NextResponse.json({ authUrl });
  } catch (error: any) {
    console.error("Failed to initiate Google OAuth:", error);
    return NextResponse.json(
      { error: "Failed to initiate Google authentication" },
      { status: 500 }
    );
  }
}
