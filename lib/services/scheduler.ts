// Task Scheduler Service - Sprint 6 Implementation
import { prisma } from "@/lib/prisma";

export class TaskScheduler {
  async listScheduledTasks(userId: string) {
    return await prisma.scheduledTask.findMany({
      where: {
        createdBy: userId,
        status: "active",
      },
      include: {
        Workflow: true,
      },
      orderBy: { nextRun: "asc" },
    });
  }

  async createScheduledTask(data: {
    name: string;
    cron: string;
    workflowId?: string;
    metadata?: any;
    createdBy: string;
  }) {
    // Calculate next run based on cron expression
    const nextRun = this.calculateNextRun(data.cron);

    return await prisma.scheduledTask.create({
      data: {
        id: `task_${data.createdBy}_${Date.now()}`,
        ...data,
        nextRun,
        status: "active",
        updatedAt: new Date(),
      },
    });
  }

  async pauseTask(taskId: string) {
    return await prisma.scheduledTask.update({
      where: { id: taskId },
      data: { status: "paused" },
    });
  }

  async resumeTask(taskId: string) {
    const nextRun = this.calculateNextRun("0 9 * * 1"); // Default to Monday 9 AM
    return await prisma.scheduledTask.update({
      where: { id: taskId },
      data: {
        status: "active",
        nextRun,
      },
    });
  }

  async deleteTask(taskId: string) {
    return await prisma.scheduledTask.delete({
      where: { id: taskId },
    });
  }

  async checkAndRunDueTasks() {
    const now = new Date();

    // Find tasks due to run
    const dueTasks = await prisma.scheduledTask.findMany({
      where: {
        status: "active",
        nextRun: { lte: now },
      },
      include: {
        Workflow: true,
      },
    });

    for (const task of dueTasks) {
      try {
        // Update last run
        await prisma.scheduledTask.update({
          where: { id: task.id },
          data: {
            lastRun: now,
            nextRun: this.calculateNextRun(task.cron),
          },
        });

        // Execute associated workflow if exists
        if (task.workflowId && task.Workflow) {
          const execution = await prisma.workflowExecution.create({
            data: {
              id: `exec_${task.workflowId}_${Date.now()}`,
              workflowId: task.workflowId,
              status: "running",
              context: {
                scheduledTaskId: task.id,
                metadata: task.metadata,
              },
            },
          });

          // In production, this would be handled asynchronously
          console.log("Executing scheduled workflow:", task.Workflow.name);
        }
      } catch (error) {
        console.error("Error running scheduled task:", task.id, error);
      }
    }

    return dueTasks.length;
  }

  private calculateNextRun(cron: string): Date {
    // Simplified - in production use a proper cron library
    const now = new Date();

    // Parse simple cron patterns
    if (cron === "0 9 * * 1") {
      // Every Monday at 9 AM
      const next = new Date(now);
      next.setDate(next.getDate() + ((1 + 7 - next.getDay()) % 7 || 7));
      next.setHours(9, 0, 0, 0);
      return next;
    } else if (cron === "0 0 * * *") {
      // Daily at midnight
      const next = new Date(now);
      next.setDate(next.getDate() + 1);
      next.setHours(0, 0, 0, 0);
      return next;
    }

    // Default to 1 day from now
    return new Date(now.getTime() + 24 * 60 * 60 * 1000);
  }
}
