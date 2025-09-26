export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AuditLogger } from "@/lib/audit";
import { randomUUID } from "crypto";

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
        redirect_uri: process.env.SLACK_REDIRECT_URI!,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.ok) {
      console.error("Slack OAuth token exchange failed:", {
        error: tokenData.error,
        error_description: tokenData.error_description,
        needed: tokenData.needed,
        provided: tokenData.provided,
        response: tokenData,
      });
      throw new Error(tokenData.error || "Failed to exchange code for token");
    }

    // Log the OAuth response for debugging
    console.log("Slack OAuth response:", {
      ok: tokenData.ok,
      access_token: tokenData.access_token?.substring(0, 10) + "...",
      bot_user_id: tokenData.bot_user_id,
      authed_user: tokenData.authed_user,
      team: tokenData.team,
    });

    // Store the integration credentials
    // Note: We store bot token in data.token and user who installed in metadata.slackUserId
    await prisma.integrationCredential.upsert({
      where: {
        userId_type: {
          userId: session.user.id,
          type: "slack",
        },
      },
      create: {
        id: randomUUID(),
        userId: session.user.id,
        type: "slack",
        data: {
          token: tokenData.access_token, // Bot token (xoxb-)
          botUserId: tokenData.bot_user_id, // Bot's user ID
          teamId: tokenData.team?.id,
          teamName: tokenData.team?.name,
          scope: tokenData.scope,
        },
        metadata: {
          slackUserId: tokenData.authed_user?.id, // Installing user's ID
          installedAt: new Date().toISOString(),
        },
        updatedAt: new Date(),
      },
      update: {
        data: {
          token: tokenData.access_token, // Bot token (xoxb-)
          botUserId: tokenData.bot_user_id, // Bot's user ID
          teamId: tokenData.team?.id,
          teamName: tokenData.team?.name,
          scope: tokenData.scope,
        },
        metadata: {
          slackUserId: tokenData.authed_user?.id, // Installing user's ID
          installedAt: new Date().toISOString(),
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
        type: "slack",
        teamId: tokenData.team?.id,
      }
    );

    // Redirect back to settings or integration page
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXTAUTH_URL ||
      request.url;
    return NextResponse.redirect(
      new URL("/settings/integrations?success=slack", baseUrl)
    );
  } catch (error: any) {
    console.error("Slack OAuth error:", error);
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXTAUTH_URL ||
      request.url;
    return NextResponse.redirect(
      new URL("/settings/integrations?error=slack_auth_failed", baseUrl)
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
