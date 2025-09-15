export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { authOptions } from "@/lib/auth";
import { AgentService } from "@/lib/agent/service";

const agentService = AgentService.getInstance();

// Get session details
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authSession = await getServerSession();
    if (!authSession?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context.params;
    const sessionId = params.id;
    const session = await agentService.getSessionStatus(sessionId);

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Check if user owns the session
    if (
      session.userId !== authSession.user.id &&
      authSession.user.role !== "admin"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ session });
  } catch (error: any) {
    console.error("Failed to get agent session:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get session" },
      { status: 500 }
    );
  }
}

// Cancel a session
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const authSession = await getServerSession();
    if (!authSession?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessionId = params.id;
    const session = await agentService.getSessionStatus(sessionId);

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Check if user owns the session
    if (
      session.userId !== authSession.user.id &&
      authSession.user.role !== "admin"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await agentService.cancelSession(sessionId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to cancel agent session:", error);
    return NextResponse.json(
      { error: error.message || "Failed to cancel session" },
      { status: 500 }
    );
  }
}
