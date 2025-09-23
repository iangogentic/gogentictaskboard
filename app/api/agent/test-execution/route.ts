import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { AgentService } from "@/lib/agent/service";

export async function GET(req: NextRequest) {
  try {
    // Get authenticated user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const agentService = AgentService.getInstance();

    // Create a test session
    const agentSession = await agentService.createSession(
      session.user.id,
      undefined // No specific project
    );

    // Generate a simple plan
    const testRequest = "Create a project called 'Agent Test Project' for testing the agent system";
    const plan = await agentService.generatePlan(agentSession.id, testRequest);

    // Auto-approve the plan
    await agentService.approvePlan(agentSession.id, session.user.id);

    // Execute the plan
    const result = await agentService.executePlan(agentSession.id);

    return NextResponse.json({
      success: true,
      sessionId: agentSession.id,
      plan: {
        id: plan.id,
        title: plan.title,
        steps: plan.steps?.map(s => ({
          tool: s.tool,
          title: s.title,
          status: s.status
        }))
      },
      result: {
        success: result.success,
        summary: result.summary,
        steps: result.steps?.map(s => ({
          tool: s.tool,
          status: s.status,
          result: s.result
        }))
      }
    });

  } catch (error: any) {
    console.error("Test execution error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}