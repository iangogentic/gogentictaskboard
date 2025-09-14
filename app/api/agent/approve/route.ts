export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AgentService } from "@/lib/agent/service";

const agentService = AgentService.getInstance();

// Approve a plan
export async function POST(request: NextRequest) {
  try {
    const authSession = await getServerSession(authOptions);
    if (!authSession?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    // Check session ownership
    const session = await agentService.getSessionStatus(sessionId);
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (
      session.userId !== authSession.user.id &&
      authSession.user.role !== "admin"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!session.plan) {
      return NextResponse.json(
        { error: "No plan to approve" },
        { status: 400 }
      );
    }

    // Approve plan
    await agentService.approvePlan(sessionId, authSession.user.id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to approve plan:", error);
    return NextResponse.json(
      { error: error.message || "Failed to approve plan" },
      { status: 500 }
    );
  }
}
