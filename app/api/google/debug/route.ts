export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // Check environment variables
  const config = {
    hasClientId: !!process.env.GOOGLE_CLIENT_ID,
    hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
    hasRedirectUri: !!process.env.GOOGLE_REDIRECT_URI,
    redirectUri: process.env.GOOGLE_REDIRECT_URI || "NOT SET",
    clientIdLength: process.env.GOOGLE_CLIENT_ID?.length || 0,
    clientSecretLength: process.env.GOOGLE_CLIENT_SECRET?.length || 0,
    nodeEnv: process.env.NODE_ENV,
  };

  // Try to generate auth URL
  let authUrl = "ERROR";
  let error = null;

  try {
    const { GoogleDriveService } = await import("@/lib/google-drive");
    const service = GoogleDriveService.getInstance();
    authUrl = service.getAuthUrl("test-state");
  } catch (e: any) {
    error = e.message;
  }

  return NextResponse.json({
    config,
    authUrl,
    error,
    timestamp: new Date().toISOString(),
  });
}
