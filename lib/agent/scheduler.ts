import { prisma } from "@/lib/prisma";
import { ScheduledTask, Workflow } from "@prisma/client";
import { WorkflowEngine } from "./workflow-engine";
import { AgentContext } from "./types";
import * as cron from "node-cron";
const cronParser = require("cron-parser");

export class SchedulerService {
  private scheduledJobs: Map<string, cron.ScheduledTask> = new Map();
  private context: AgentContext;

  constructor(context: AgentContext) {
    this.context = context;
  }

  /**
   * Create a scheduled task
   */
  async createScheduledTask(
    name: string,
    cronExpression: string,
    workflowId?: string,
    metadata?: any
  ): Promise<ScheduledTask> {
    // Validate cron expression
    if (!cron.validate(cronExpression)) {
      throw new Error("Invalid cron expression");
    }

    // Calculate next run time
    const nextRun = this.calculateNextRun(cronExpression);

    const { randomUUID } = require("crypto");
    const data: any = {
      id: randomUUID(),
      name,
      cron: cronExpression,
      nextRun,
      status: "active",
      metadata: metadata || {},
      createdBy: this.context.user.id,
    };

    if (workflowId) {
      data.workflowId = workflowId;
    }

    const task = await prisma.scheduledTask.create({ data });

    // Schedule the task
    await this.scheduleTask(task);

    return task;
  }

  /**
   * Schedule a task for execution
   */
  private async scheduleTask(task: ScheduledTask): Promise<void> {
    if (task.status !== "active") {
      return;
    }

    // Create cron job
    const job = cron.schedule(task.cron, async () => {
      await this.executeScheduledTask(task.id);
    });

    // Store job reference
    this.scheduledJobs.set(task.id, job);
  }

  /**
   * Execute a scheduled task
   */
  private async executeScheduledTask(taskId: string): Promise<void> {
    try {
      const task = await prisma.scheduledTask.findUnique({
        where: { id: taskId },
        include: { Workflow: true },
      });

      if (!task || task.status !== "active") {
        return;
      }

      // Update last run time
      await prisma.scheduledTask.update({
        where: { id: taskId },
        data: {
          lastRun: new Date(),
          nextRun: this.calculateNextRun(task.cron),
        },
      });

      // Execute workflow if linked
      if (task.Workflow) {
        const engine = new WorkflowEngine(this.context);
        await engine.executeWorkflow(task.workflowId!, task.metadata as any);
      }

      // Execute custom logic based on metadata
      if (task.metadata && (task.metadata as any).action) {
        await this.executeCustomAction(task.metadata as any);
      }
    } catch (error: any) {
      console.error(`Failed to execute scheduled task ${taskId}:`, error);

      // Mark task as failed after multiple failures
      const task = await prisma.scheduledTask.findUnique({
        where: { id: taskId },
      });

      if (task) {
        const failures = ((task.metadata as any)?.failures || 0) + 1;

        if (failures >= 3) {
          await prisma.scheduledTask.update({
            where: { id: taskId },
            data: {
              status: "failed",
              metadata: {
                ...(task.metadata as any),
                failures,
                lastError: error.message,
              },
            },
          });

          // Stop the cron job
          this.stopTask(taskId);
        } else {
          // Update failure count
          await prisma.scheduledTask.update({
            where: { id: taskId },
            data: {
              metadata: {
                ...(task.metadata as any),
                failures,
                lastError: error.message,
              },
            },
          });
        }
      }
    }
  }

  /**
   * Execute custom scheduled action
   */
  private async executeCustomAction(metadata: any): Promise<void> {
    const { action, params } = metadata;

    switch (action) {
      case "daily_standup":
        await this.executeDailyStandup(params);
        break;
      case "weekly_report":
        await this.executeWeeklyReport(params);
        break;
      case "health_check":
        await this.executeHealthCheck(params);
        break;
      case "sync_data":
        await this.executeSyncData(params);
        break;
      default:
        console.log(`Unknown scheduled action: ${action}`);
    }
  }

  /**
   * Execute daily standup collection
   */
  private async executeDailyStandup(params: any): Promise<void> {
    const { projectId } = params;

    // Get yesterday's updates
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const updates = await prisma.update.findMany({
      where: {
        projectId,
        createdAt: { gte: yesterday },
      },
      include: { author: true },
    });

    const tasks = await prisma.task.findMany({
      where: {
        projectId,
        updatedAt: { gte: yesterday },
        status: "Done",
      },
    });

    // Format standup message
    let message = `📅 *Daily Standup Summary*\n\n`;

    if (updates.length > 0) {
      message += `*Updates:*\n`;
      updates.forEach((u) => {
        message += `• ${u.author.name}: ${u.body}\n`;
      });
      message += "\n";
    }

    if (tasks.length > 0) {
      message += `*Completed Tasks:*\n`;
      tasks.forEach((t) => {
        message += `• ✅ ${t.title}\n`;
      });
    }

    // Send via Slack if configured
    const integration = await prisma.projectIntegration.findFirst({
      where: { projectId, key: "slackChannelId" },
    });

    if (integration) {
      // Send to Slack channel
      console.log("Sending standup to Slack:", integration.value);
    }
  }

  /**
   * Execute weekly report generation
   */
  private async executeWeeklyReport(params: any): Promise<void> {
    const { projectId } = params;

    // Get week's data
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        tasks: {
          where: { updatedAt: { gte: weekAgo } },
        },
        updates: {
          where: { createdAt: { gte: weekAgo } },
        },
      },
    });

    if (!project) return;

    // Generate report
    const completedTasks = project.tasks.filter(
      (t) => t.status === "Done"
    ).length;
    const inProgressTasks = project.tasks.filter(
      (t) => t.status === "Doing"
    ).length;
    const blockedTasks = project.tasks.filter(
      (t) => t.status === "Blocked"
    ).length;

    const report = `
📊 Weekly Report: ${project.title}
Period: ${weekAgo.toDateString()} - ${new Date().toDateString()}

Tasks:
• Completed: ${completedTasks}
• In Progress: ${inProgressTasks}
• Blocked: ${blockedTasks}

Updates: ${project.updates.length} posted
Status: ${project.status}
Health: ${project.health || "Not set"}
    `.trim();

    // Save as update
    await prisma.update.create({
      data: {
        projectId,
        authorId: this.context.user.id,
        body: report,
      },
    });
  }

  /**
   * Execute health check
   */
  private async executeHealthCheck(params: any): Promise<void> {
    const { projectId } = params;

    // Import monitoring service
    const { monitoringService } = await import("./monitoring");

    // Run health checks
    const alerts = await monitoringService.checkProjectHealth(projectId);
    const metrics = await monitoringService.getProjectMetrics(projectId);

    // Update project health status
    let health = "Green";
    if (metrics.healthScore < 50) health = "Red";
    else if (metrics.healthScore < 80) health = "Amber";

    await prisma.project.update({
      where: { id: projectId },
      data: { health },
    });

    // Send alerts if needed
    if (alerts.length > 0) {
      await monitoringService.sendAlerts(alerts, this.context.user.id);
    }
  }

  /**
   * Execute data sync
   */
  private async executeSyncData(params: any): Promise<void> {
    const { projectId, sources = ["project"] } = params;

    // Import document ingestion service
    const { documentIngestionService } = await import("../document-ingestion");

    // Sync documents
    await documentIngestionService.syncProject(
      projectId,
      this.context.user.id,
      sources
    );
  }

  /**
   * Calculate next run time for cron expression
   */
  private calculateNextRun(cronExpression: string): Date {
    const interval = cronParser.parseExpression(cronExpression);
    return interval.next().toDate();
  }

  /**
   * Update scheduled task
   */
  async updateScheduledTask(
    taskId: string,
    updates: {
      name?: string;
      cron?: string;
      status?: string;
      metadata?: any;
    }
  ): Promise<ScheduledTask> {
    // Stop existing job if cron changed
    if (updates.cron) {
      this.stopTask(taskId);
    }

    const task = await prisma.scheduledTask.update({
      where: { id: taskId },
      data: {
        ...updates,
        nextRun: updates.cron ? this.calculateNextRun(updates.cron) : undefined,
      },
    });

    // Reschedule if needed
    if (updates.cron || updates.status === "active") {
      await this.scheduleTask(task);
    }

    return task;
  }

  /**
   * Stop a scheduled task
   */
  stopTask(taskId: string): void {
    const job = this.scheduledJobs.get(taskId);
    if (job) {
      job.stop();
      this.scheduledJobs.delete(taskId);
    }
  }

  /**
   * Pause a scheduled task
   */
  async pauseTask(taskId: string): Promise<void> {
    await this.updateScheduledTask(taskId, { status: "paused" });
    this.stopTask(taskId);
  }

  /**
   * Resume a scheduled task
   */
  async resumeTask(taskId: string): Promise<void> {
    const task = await this.updateScheduledTask(taskId, { status: "active" });
    await this.scheduleTask(task);
  }

  /**
   * Delete a scheduled task
   */
  async deleteTask(taskId: string): Promise<void> {
    this.stopTask(taskId);
    await prisma.scheduledTask.delete({
      where: { id: taskId },
    });
  }

  /**
   * Get all scheduled tasks
   */
  async getScheduledTasks(
    status?: string,
    limit: number = 20
  ): Promise<ScheduledTask[]> {
    const where: any = {};
    if (status) {
      where.status = status;
    }

    return await prisma.scheduledTask.findMany({
      where,
      orderBy: { nextRun: "asc" },
      take: limit,
      include: {
        Workflow: true,
      },
    });
  }

  /**
   * Initialize scheduler on startup
   */
  async initialize(): Promise<void> {
    // Load all active scheduled tasks
    const activeTasks = await prisma.scheduledTask.findMany({
      where: { status: "active" },
    });

    // Schedule each task
    for (const task of activeTasks) {
      await this.scheduleTask(task);
    }

    console.log(
      `Scheduler initialized with ${activeTasks.length} active tasks`
    );
  }

  /**
   * Shutdown scheduler
   */
  shutdown(): void {
    // Stop all scheduled jobs
    for (const [taskId, job] of this.scheduledJobs) {
      job.stop();
    }
    this.scheduledJobs.clear();
    console.log("Scheduler shut down");
  }
}

// Predefined cron schedules
export const CRON_SCHEDULES = {
  EVERY_MINUTE: "* * * * *",
  EVERY_5_MINUTES: "*/5 * * * *",
  EVERY_30_MINUTES: "*/30 * * * *",
  HOURLY: "0 * * * *",
  DAILY_9AM: "0 9 * * *",
  DAILY_6PM: "0 18 * * *",
  WEEKLY_MONDAY: "0 9 * * 1",
  WEEKLY_FRIDAY: "0 17 * * 5",
  MONTHLY_FIRST: "0 9 1 * *",
};
