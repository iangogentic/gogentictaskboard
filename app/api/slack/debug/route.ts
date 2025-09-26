import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getServerSession();

  return NextResponse.json({
    hasSession: !!session,
    userId: session?.user?.id || null,
    userEmail: session?.user?.email || null,
    env: {
      hasClientId: !!process.env.SLACK_CLIENT_ID,
      hasClientSecret: !!process.env.SLACK_CLIENT_SECRET,
      redirectUri: process.env.SLACK_REDIRECT_URI,
      nodeEnv: process.env.NODE_ENV,
    },
  });
}
