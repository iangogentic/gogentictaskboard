import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { slackService } from "@/lib/slack";
import { AuditLogger } from "@/lib/audit";

/**
 * Scheduler tick endpoint - processes scheduled tasks and workflows
 * Should be called every minute via cron (Vercel/Cloudflare)
 * Idempotent: safe to call multiple times
 */
export async function POST(req: NextRequest) {
  // Verify cron secret if configured
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const startTime = Date.now();
  const results = {
    scheduledTasks: 0,
    workflows: 0,
    dailySummaries: 0,
    errors: [] as string[],
  };

  try {
    // 1. Process scheduled tasks
    const dueTasks = await prisma.scheduledTask.findMany({
      where: {
        nextRun: { lte: new Date() },
        status: "active",
      },
      take: 10, // Process max 10 per tick
    });

    for (const task of dueTasks) {
      try {
        await processScheduledTask(task);
        results.scheduledTasks++;

        // Update next run time based on schedule
        const nextRun = calculateNextRun(task.cron);
        await prisma.scheduledTask.update({
          where: { id: task.id },
          data: {
            lastRun: new Date(),
            nextRun: nextRun,
          },
        });
      } catch (error: any) {
        results.errors.push(`Task ${task.id}: ${error.message}`);

        // Track failures in metadata
        const metadata = (task.metadata as any) || {};
        const failureCount = (metadata.failureCount || 0) + 1;

        await prisma.scheduledTask.update({
          where: { id: task.id },
          data: {
            status: failureCount >= 3 ? "failed" : task.status,
            metadata: {
              ...metadata,
              failureCount,
              lastError: error.message,
            },
          },
        });
      }
    }

    // 2. Process workflow executions
    const activeWorkflows = await prisma.workflowExecution.findMany({
      where: {
        status: { in: ["running", "waiting"] },
      },
      take: 5,
      include: {
        Workflow: true,
      },
    });

    for (const execution of activeWorkflows) {
      try {
        await advanceWorkflow(execution);
        results.workflows++;
      } catch (error: any) {
        results.errors.push(`Workflow ${execution.id}: ${error.message}`);
      }
    }

    // 3. Send daily summaries (if it's 9 AM)
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();

    if (hour === 9 && minute < 5) {
      // Run between 9:00-9:05 AM
      const lastDailySummary = await prisma.auditLog.findFirst({
        where: {
          action: "daily_summary_sent",
          createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
        },
      });

      if (!lastDailySummary) {
        const summaryResults = await sendDailySummaries();
        results.dailySummaries = summaryResults.count;

        // Log that we sent summaries
        await AuditLogger.logSuccess(
          "scheduler",
          "daily_summary_sent",
          "scheduler",
          "daily_summary",
          {
            count: summaryResults.count,
            timestamp: now,
          }
        );
      }
    }

    // 4. Clean up old completed tasks and logs
    if (hour === 2 && minute < 5) {
      // Run cleanup at 2 AM
      await cleanupOldData();
    }

    // Log tick execution
    await AuditLogger.logSuccess(
      "scheduler",
      "tick_executed",
      "scheduler",
      "tick",
      {
        duration: Date.now() - startTime,
        results,
      }
    );

    return NextResponse.json({
      success: true,
      timestamp: new Date(),
      duration: Date.now() - startTime,
      results,
    });
  } catch (error: any) {
    console.error("Scheduler tick error:", error);

    await AuditLogger.logFailure(
      "scheduler",
      "tick_failed",
      "scheduler",
      error.message,
      "tick"
    );

    return NextResponse.json(
      {
        error: error.message,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        results,
      },
      { status: 500 }
    );
  }
}

/**
 * Process a scheduled task
 */
async function processScheduledTask(task: any) {
  const { toolRegistry } = await import("@/lib/agent/tool-registry");

  // Extract task details from metadata
  const metadata = (task.metadata as any) || {};
  const { tool, parameters, userId, projectId } = metadata;

  // Execute the task's tool
  if (tool) {
    const toolDef = toolRegistry.get(tool);
    if (!toolDef) {
      throw new Error(`Tool ${tool} not found`);
    }

    await toolRegistry.execute(
      tool,
      {
        userId: userId || "scheduler",
        projectId: projectId,
        permissions: toolDef.scopes,
        traceId: `scheduled_${task.id}_${Date.now()}`,
      },
      parameters || {}
    );
  } else {
    // Legacy: check if task type indicates a specific action
    if (task.type === "slack_reminder" && metadata.channel) {
      // Send Slack reminder
      const { slackService } = await import("@/lib/slack");
      await slackService.sendMessage({
        channel: metadata.channel,
        text: metadata.message || "Scheduled reminder",
      });
    }
  }
}

/**
 * Advance a workflow execution
 */
async function advanceWorkflow(execution: any) {
  // This is simplified - in production, use a proper workflow engine
  if (execution.status === "waiting") {
    // Check if wait condition is met
    const waitUntil = (execution.context as any)?.waitUntil;
    if (waitUntil && new Date(waitUntil) > new Date()) {
      return; // Still waiting
    }

    // Move to next step
    await prisma.workflowExecution.update({
      where: { id: execution.id },
      data: {
        status: "running",
      },
    });
  }

  // Execute current step - currentStep is just an integer index
  if (execution.currentStep >= 0 && execution.Workflow) {
    const { toolRegistry } = await import("@/lib/agent/tool-registry");

    // Get workflow steps from the JSON field
    const steps = (execution.Workflow.steps as any[]) || [];

    // Get the current step
    const currentStep = steps[execution.currentStep];

    if (!currentStep) {
      // No step at this index, mark workflow complete
      await prisma.workflowExecution.update({
        where: { id: execution.id },
        data: {
          status: "completed",
          completedAt: new Date(),
        },
      });
      return;
    }

    try {
      const result = await toolRegistry.execute(
        currentStep.tool || currentStep.name,
        {
          userId: (execution.context as any)?.userId || "",
          projectId: (execution.context as any)?.projectId || "",
          permissions: [],
          traceId: `workflow_${execution.id}_step_${execution.currentStep}`,
        },
        currentStep.parameters || currentStep.params || {}
      );

      // Store result in context for next steps
      const updatedContext = {
        ...(execution.context as any),
        [`step_${execution.currentStep}_result`]: result,
      };

      // Check if there's a next step
      const nextStepIndex = execution.currentStep + 1;
      const hasNextStep = nextStepIndex < steps.length;

      if (hasNextStep) {
        await prisma.workflowExecution.update({
          where: { id: execution.id },
          data: {
            currentStep: nextStepIndex,
            context: updatedContext,
          },
        });
      } else {
        // Workflow complete
        await prisma.workflowExecution.update({
          where: { id: execution.id },
          data: {
            status: "completed",
            completedAt: new Date(),
            result: updatedContext,
          },
        });
      }
    } catch (error: any) {
      // Store error in context
      const errorContext = {
        ...(execution.context as any),
        [`step_${execution.currentStep}_error`]: error.message,
      };

      // Fail the workflow
      await prisma.workflowExecution.update({
        where: { id: execution.id },
        data: {
          status: "failed",
          error: error.message,
          context: errorContext,
          completedAt: new Date(),
        },
      });
    }
  }
}

/**
 * Send daily work summaries via Slack
 */
async function sendDailySummaries() {
  const users = await prisma.user.findMany({
    where: {
      role: { in: ["developer", "manager", "admin"] },
      // No active field in User model, all users with roles are considered active
    },
  });

  let count = 0;

  for (const user of users) {
    try {
      // Get user's tasks for today
      const tasks = await prisma.task.findMany({
        where: {
          assigneeId: user.id,
          status: { in: ["todo", "in-progress", "blocked"] },
        },
        include: {
          project: true,
        },
      });

      if (tasks.length === 0) continue;

      // Calculate summary with proper types
      const summary = {
        userId: user.id,
        tasks: tasks
          .filter((t) => t.status !== "blocked")
          .map((t) => ({
            id: t.id,
            title: t.title,
            status: t.status,
            projectTitle: t.project?.title || "No Project",
            dueDate: t.dueDate || undefined,
          })),
        blockedTasks: tasks
          .filter((t) => t.status === "blocked")
          .map((t) => ({
            id: t.id,
            title: t.title,
            projectTitle: t.project?.title || "No Project",
          })),
        completedToday: 0, // Would need to query completed tasks today
        inProgress: tasks.filter((t) => t.status === "in-progress").length,
      };

      // Send via Slack
      await slackService.sendDailyWorkDM(user.id, summary);
      count++;
    } catch (error: any) {
      console.error(`Failed to send summary to ${user.email}:`, error);
    }
  }

  return { count };
}

/**
 * Calculate next run time based on schedule
 */
function calculateNextRun(schedule: string): Date {
  const now = new Date();

  // Simple implementation - enhance with cron parser in production
  if (schedule === "hourly") {
    return new Date(now.getTime() + 60 * 60 * 1000);
  } else if (schedule === "daily") {
    return new Date(now.getTime() + 24 * 60 * 60 * 1000);
  } else if (schedule === "weekly") {
    return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  } else if (schedule.startsWith("every_")) {
    const minutes = parseInt(schedule.replace("every_", "").replace("min", ""));
    return new Date(now.getTime() + minutes * 60 * 1000);
  }

  // Default to 1 hour
  return new Date(now.getTime() + 60 * 60 * 1000);
}

/**
 * Clean up old data
 */
async function cleanupOldData() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // Clean old completed scheduled tasks
  await prisma.scheduledTask.deleteMany({
    where: {
      status: "completed",
      lastRun: { lt: thirtyDaysAgo },
    },
  });

  // Clean old audit logs (keep important ones)
  await prisma.auditLog.deleteMany({
    where: {
      createdAt: { lt: thirtyDaysAgo },
      action: { notIn: ["plan_approved", "plan_rejected", "agent_execution"] },
    },
  });
}

// GET endpoint for monitoring
export async function GET(req: NextRequest) {
  try {
    const stats = await prisma.$transaction([
      prisma.scheduledTask.count({
        where: { status: "active" },
      }),
      prisma.workflowExecution.count({
        where: { status: { in: ["running", "waiting"] } },
      }),
      prisma.scheduledTask.count({
        where: {
          nextRun: { lte: new Date() },
          status: "active",
        },
      }),
    ]);

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date(),
      stats: {
        activeScheduledTasks: stats[0],
        activeWorkflows: stats[1],
        pendingTasks: stats[2],
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "unhealthy",
        error: error.message,
        timestamp: new Date(),
      },
      { status: 500 }
    );
  }
}
