// Workflow Engine Service - Sprint 6 Implementation
import { prisma } from "@/lib/prisma";

export class WorkflowEngine {
  async listWorkflows(userId: string, projectId?: string) {
    return await prisma.workflow.findMany({
      where: {
        createdBy: userId,
        ...(projectId && { projectId }),
        isActive: true,
      },
      orderBy: { updatedAt: "desc" },
    });
  }

  async createWorkflow(data: {
    name: string;
    description?: string;
    steps: any;
    triggers?: any;
    createdBy: string;
    projectId?: string;
  }) {
    return await prisma.workflow.create({
      data: {
        id: `workflow_${data.createdBy}_${Date.now()}`,
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  async executeWorkflow(workflowId: string, context: any = {}) {
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
    });

    if (!workflow) {
      throw new Error("Workflow not found");
    }

    // Create execution record
    const execution = await prisma.workflowExecution.create({
      data: {
        id: `exec_${workflowId}_${Date.now()}`,
        workflowId,
        status: "running",
        context,
      },
    });

    try {
      // Execute workflow steps (simplified)
      const steps = workflow.steps as any[];
      let result = {};

      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];

        // Update current step
        await prisma.workflowExecution.update({
          where: { id: execution.id },
          data: { currentStep: i + 1 },
        });

        // Execute step based on type
        if (step.type === "task") {
          // Create task
          const task = await prisma.task.create({
            data: {
              projectId: context.projectId,
              title: step.data.title,
              status: "To Do",
              notes: step.data.notes,
            },
          });
          result = { ...result, taskId: task.id };
        } else if (step.type === "notification") {
          // In real implementation, send notification
          console.log("Sending notification:", step.data);
        }
      }

      // Mark as completed
      await prisma.workflowExecution.update({
        where: { id: execution.id },
        data: {
          status: "completed",
          completedAt: new Date(),
          result,
        },
      });

      return execution;
    } catch (error: any) {
      // Mark as failed
      await prisma.workflowExecution.update({
        where: { id: execution.id },
        data: {
          status: "failed",
          error: error.message,
          completedAt: new Date(),
        },
      });
      throw error;
    }
  }

  async getExecutions(workflowId: string) {
    return await prisma.workflowExecution.findMany({
      where: { workflowId },
      orderBy: { startedAt: "desc" },
      take: 10,
    });
  }
}
