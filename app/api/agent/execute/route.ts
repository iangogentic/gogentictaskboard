export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { AgentService } from "@/lib/agent/service";
import { resolveRequestUser } from "@/lib/api/auth-helpers";

const agentService = AgentService.getInstance();

// Execute an approved plan
export async function POST(request: NextRequest) {
  try {
    const requestUser = await resolveRequestUser(request);
    if (!requestUser) {
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

    if (session.userId !== requestUser.id && requestUser.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!session.plan) {
      return NextResponse.json(
        { error: "No plan to execute" },
        { status: 400 }
      );
    }

    if (!session.plan.approvedAt) {
      return NextResponse.json({ error: "Plan not approved" }, { status: 400 });
    }

    // Check if already executing
    if (agentService.isSessionActive(sessionId)) {
      return NextResponse.json(
        { error: "Session is already executing" },
        { status: 409 }
      );
    }

    // Execute plan
    const result = await agentService.executePlan(sessionId);

    return NextResponse.json({ result });
  } catch (error: any) {
    console.error("Failed to execute plan:", error);
    return NextResponse.json(
      { error: error.message || "Failed to execute plan" },
      { status: 500 }
    );
  }
}
