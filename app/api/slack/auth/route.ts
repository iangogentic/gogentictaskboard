export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AuditLogger } from "@/lib/audit";

// Slack OAuth callback handler
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (!code) {
      return NextResponse.json(
        { error: "Missing authorization code" },
        { status: 400 }
      );
    }

    // Exchange code for access token
    const tokenResponse = await fetch("https://slack.com/api/oauth.v2.access", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.SLACK_CLIENT_ID!,
        client_secret: process.env.SLACK_CLIENT_SECRET!,
        code,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.ok) {
      throw new Error(tokenData.error || "Failed to exchange code for token");
    }

    // Store the integration credentials
    await prisma.integrationCredential.upsert({
      where: {
        userId_type: {
          userId: session.user.id,
          type: "slack",
        },
      },
      create: {
        userId: session.user.id,
        type: "slack",
        data: {
          accessToken: tokenData.access_token,
          scope: tokenData.scope,
          teamId: tokenData.team?.id,
          teamName: tokenData.team?.name,
        },
        metadata: {
          slackUserId: tokenData.authed_user?.id,
          installedAt: new Date().toISOString(),
        },
      },
      update: {
        data: {
          accessToken: tokenData.access_token,
          scope: tokenData.scope,
          teamId: tokenData.team?.id,
          teamName: tokenData.team?.name,
        },
        metadata: {
          slackUserId: tokenData.authed_user?.id,
          installedAt: new Date().toISOString(),
        },
      },
    });

    // Log the integration
    await AuditLogger.logSuccess(
      session.user.id,
      "link_integration",
      "integration" as any,
      undefined,
      {
        type: "slack",
        teamId: tokenData.team?.id,
      }
    );

    // Redirect back to settings or integration page
    return NextResponse.redirect(
      new URL("/settings/integrations?success=slack", request.url)
    );
  } catch (error: any) {
    console.error("Slack OAuth error:", error);
    return NextResponse.redirect(
      new URL("/settings/integrations?error=slack_auth_failed", request.url)
    );
  }
}

// Initiate Slack OAuth flow
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Generate state for CSRF protection
    const state = Math.random().toString(36).substring(7);

    // Store state in session or database for verification
    // For now, we'll pass it through

    const scopes = [
      "channels:read",
      "chat:write",
      "im:write",
      "users:read",
      "groups:read",
    ].join(",");

    const authUrl = new URL("https://slack.com/oauth/v2/authorize");
    authUrl.searchParams.set("client_id", process.env.SLACK_CLIENT_ID!);
    authUrl.searchParams.set("scope", scopes);
    authUrl.searchParams.set("redirect_uri", process.env.SLACK_REDIRECT_URI!);
    authUrl.searchParams.set("state", state);

    return NextResponse.json({ authUrl: authUrl.toString() });
  } catch (error: any) {
    console.error("Failed to initiate Slack OAuth:", error);
    return NextResponse.json(
      { error: "Failed to initiate Slack authentication" },
      { status: 500 }
    );
  }
}
