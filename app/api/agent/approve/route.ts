import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AuditLogger } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { planId, sessionId, userId, approved, reason } = body;

    if (!planId || !sessionId || !userId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Load the session
    const session = await prisma.agentSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Verify the user owns the session or is an admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (session.userId !== userId && user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized to approve this plan" },
        { status: 403 }
      );
    }

    // Update the plan approval status
    const plan = session.plan as any;
    if (!plan || plan.id !== planId) {
      return NextResponse.json(
        { error: "Plan not found in session" },
        { status: 404 }
      );
    }

    if (approved) {
      plan.approved = true;
      plan.approvedAt = new Date();
      plan.approvedBy = userId;

      // Update session state
      await prisma.agentSession.update({
        where: { id: sessionId },
        data: {
          state: "awaiting_approval",
          plan: plan,
          updatedAt: new Date(),
        },
      });

      // Log approval
      await AuditLogger.logSuccess(
        userId,
        "plan_approved",
        "agent_plan",
        planId,
        {
          sessionId,
          planTitle: plan.title,
          stepCount: plan.steps?.length || 0,
        }
      );

      return NextResponse.json({
        success: true,
        message: "Plan approved successfully",
        plan,
      });
    } else {
      // Rejection
      plan.rejected = true;
      plan.rejectedAt = new Date();
      plan.rejectedBy = userId;
      plan.rejectionReason = reason;

      await prisma.agentSession.update({
        where: { id: sessionId },
        data: {
          state: "failed",
          plan: plan,
          error: `Plan rejected: ${reason || "No reason provided"}`,
          updatedAt: new Date(),
        },
      });

      // Log rejection
      await AuditLogger.logSuccess(
        userId,
        "plan_rejected",
        "agent_plan",
        planId,
        {
          sessionId,
          reason,
        }
      );

      return NextResponse.json({
        success: true,
        message: "Plan rejected",
        plan,
      });
    }
  } catch (error: any) {
    console.error("Plan approval error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * Dry run endpoint - executes read-only operations and simulates mutations
 */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, planId } = body;

    const session = await prisma.agentSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const plan = session.plan as any;
    if (!plan || plan.id !== planId) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    // Import the tool registry
    const { toolRegistry } = await import("@/lib/agent/tool-registry");

    // Execute dry run
    const dryRunResults: any[] = [];

    for (const step of plan.steps) {
      const tool = toolRegistry.get(step.tool);

      if (!tool) {
        dryRunResults.push({
          stepId: step.id,
          error: `Tool ${step.tool} not found`,
        });
        continue;
      }

      // Only execute read-only tools in dry run
      if (!tool.mutates) {
        try {
          const result = await toolRegistry.execute(
            step.tool,
            {
              userId: session.userId,
              projectId: session.projectId || undefined,
              session,
              permissions: tool.scopes,
              traceId: `dry_run_${session.id}_${step.id}`,
            },
            step.parameters
          );

          dryRunResults.push({
            stepId: step.id,
            preview: JSON.stringify(result, null, 2).substring(0, 500),
            executed: true,
          });
        } catch (error: any) {
          dryRunResults.push({
            stepId: step.id,
            error: error.message,
          });
        }
      } else {
        // Simulate mutation
        dryRunResults.push({
          stepId: step.id,
          preview: `[SIMULATION] Would ${step.tool} with parameters: ${JSON.stringify(step.parameters, null, 2).substring(0, 200)}`,
          changes: [
            `Would modify data using ${step.tool}`,
            `Estimated impact: ${tool.scopes.join(", ")}`,
          ],
          warnings: tool.scopes.includes("delete")
            ? ["This operation would permanently delete data"]
            : [],
          executed: false,
        });
      }

      // Update step with dry run result
      step.dryRunResult = dryRunResults[dryRunResults.length - 1];
    }

    // Update session with dry run results
    await prisma.agentSession.update({
      where: { id: sessionId },
      data: {
        plan: plan,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      dryRunResults,
      plan,
    });
  } catch (error: any) {
    console.error("Dry run error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
