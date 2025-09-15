export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { authOptions } from "@/lib/auth";
import { AgentService } from "@/lib/agent/service";

const agentService = AgentService.getInstance();

// Generate a plan for a request
export async function POST(request: NextRequest) {
  try {
    const authSession = await getServerSession();
    if (!authSession?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { sessionId, request: userRequest } = body;

    if (!sessionId || !userRequest) {
      return NextResponse.json(
        { error: "Session ID and request are required" },
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

    // Generate plan
    const plan = await agentService.generatePlan(sessionId, userRequest);

    return NextResponse.json({ plan });
  } catch (error: any) {
    console.error("Failed to generate plan:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate plan" },
      { status: 500 }
    );
  }
}
