export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { AgentService } from "@/lib/agent/service";
import { resolveRequestUser } from "@/lib/api/auth-helpers";

const agentService = AgentService.getInstance();

// Create a new agent session
export async function POST(request: NextRequest) {
  try {
    const requestUser = await resolveRequestUser(request);
    if (!requestUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { projectId } = body;

    // Create agent session
    const session = await agentService.createSession(requestUser.id, projectId);

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
    const requestUser = await resolveRequestUser(request);
    if (!requestUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");

    // Get user sessions
    const sessions = await agentService.listUserSessions(requestUser.id, limit);

    return NextResponse.json({ sessions });
  } catch (error: any) {
    console.error("Failed to list agent sessions:", error);
    return NextResponse.json(
      { error: error.message || "Failed to list sessions" },
      { status: 500 }
    );
  }
}
