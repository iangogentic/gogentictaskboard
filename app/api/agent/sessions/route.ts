export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { authOptions } from "@/lib/auth";
import { AgentService } from "@/lib/agent/service";

const agentService = AgentService.getInstance();

// Create a new agent session
export async function POST(request: NextRequest) {
  try {
    const authSession = await getServerSession(authOptions);
    if (!authSession?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { projectId } = body;

    // Create agent session
    const session = await agentService.createSession(
      authSession.user.id,
      projectId
    );

    return NextResponse.json({ session });
  } catch (error: any) {
    console.error("Failed to create agent session:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create session" },
      { status: 500 }
    );
  }
}

// List user's agent sessions
export async function GET(request: NextRequest) {
  try {
    const authSession = await getServerSession(authOptions);
    if (!authSession?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");

    // Get user sessions
    const sessions = await agentService.listUserSessions(
      authSession.user.id,
      limit
    );

    return NextResponse.json({ sessions });
  } catch (error: any) {
    console.error("Failed to list agent sessions:", error);
    return NextResponse.json(
      { error: error.message || "Failed to list sessions" },
      { status: 500 }
    );
  }
}
