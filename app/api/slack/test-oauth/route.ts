import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json({
      error: "No code provided",
      tip: "This endpoint is for testing OAuth. Visit /api/slack/auth POST to start OAuth flow",
    });
  }

  // Test the token exchange
  try {
    const params = new URLSearchParams({
      client_id: process.env.SLACK_CLIENT_ID!,
      client_secret: process.env.SLACK_CLIENT_SECRET!,
      code,
      redirect_uri: process.env.SLACK_REDIRECT_URI!,
    });

    const response = await fetch("https://slack.com/api/oauth.v2.access", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });

    const data = await response.json();

    return NextResponse.json({
      success: data.ok,
      error: data.error,
      error_description: data.error_description,
      params_sent: {
        client_id: process.env.SLACK_CLIENT_ID ? "SET" : "MISSING",
        client_secret: process.env.SLACK_CLIENT_SECRET ? "SET" : "MISSING",
        redirect_uri: process.env.SLACK_REDIRECT_URI,
        code: code.substring(0, 10) + "...",
      },
      response: data.ok ? "Token received successfully" : data,
    });
  } catch (error: any) {
    return NextResponse.json({
      error: "Failed to exchange token",
      message: error.message,
    });
  }
}
