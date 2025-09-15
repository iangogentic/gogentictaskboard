import { prisma } from "@/lib/prisma";
import { AgentAnalytics, Project } from "@prisma/client";
import { slackService } from "@/lib/slack";

export interface MonitoringAlert {
  type:
    | "task_overdue"
    | "project_delay"
    | "health_change"
    | "anomaly"
    | "milestone";
  severity: "info" | "warning" | "critical";
  title: string;
  message: string;
  projectId?: string;
  metadata?: any;
}

export interface ProjectMetrics {
  taskCompletion: number;
  onTimeDelivery: number;
  averageTaskDuration: number;
  blockedTasks: number;
  upcomingDeadlines: number;
  healthScore: number;
}

export class MonitoringService {
  /**
   * Check for overdue tasks
   */
  async checkOverdueTasks(projectId?: string): Promise<MonitoringAlert[]> {
    const alerts: MonitoringAlert[] = [];
    const now = new Date();

    const where: any = {
      dueDate: { lt: now },
      status: { not: "Done" },
    };

    if (projectId) {
      where.projectId = projectId;
    }

    const overdueTasks = await prisma.task.findMany({
      where,
      include: {
        project: true,
        assignee: true,
      },
    });

    for (const task of overdueTasks) {
      const daysOverdue = Math.floor(
        (now.getTime() - task.dueDate!.getTime()) / (1000 * 60 * 60 * 24)
      );

      alerts.push({
        type: "task_overdue",
        severity:
          daysOverdue > 7 ? "critical" : daysOverdue > 3 ? "warning" : "info",
        title: `Task Overdue: ${task.title}`,
        message: `Task "${task.title}" in project "${task.project.title}" is ${daysOverdue} days overdue. Assigned to: ${
          task.assignee?.name || "Unassigned"
        }`,
        projectId: task.projectId,
        metadata: {
          taskId: task.id,
          daysOverdue,
          assigneeId: task.assigneeId,
        },
      });
    }

    return alerts;
  }

  /**
   * Check project health
   */
  async checkProjectHealth(projectId: string): Promise<MonitoringAlert[]> {
    const alerts: MonitoringAlert[] = [];

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        tasks: true,
        updates: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });

    if (!project) return alerts;

    // Check for stale projects (no updates in 7 days)
    const lastUpdate = project.updates[0];
    if (lastUpdate) {
      const daysSinceUpdate = Math.floor(
        (Date.now() - lastUpdate.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceUpdate > 7) {
        alerts.push({
          type: "project_delay",
          severity: "warning",
          title: "Project Stale",
          message: `Project "${project.title}" has not been updated in ${daysSinceUpdate} days`,
          projectId,
          metadata: { daysSinceUpdate },
        });
      }
    }

    // Check task completion rate
    const totalTasks = project.tasks.length;
    const completedTasks = project.tasks.filter(
      (t) => t.status === "Done"
    ).length;
    const completionRate =
      totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    if (completionRate < 30 && totalTasks > 5) {
      alerts.push({
        type: "project_delay",
        severity: "warning",
        title: "Low Task Completion",
        message: `Project "${project.title}" has only ${completionRate.toFixed(1)}% task completion`,
        projectId,
        metadata: { completionRate, totalTasks, completedTasks },
      });
    }

    // Check blocked tasks
    const blockedTasks = project.tasks.filter(
      (t) => t.status === "Blocked"
    ).length;
    if (blockedTasks > 0) {
      alerts.push({
        type: "health_change",
        severity: blockedTasks > 3 ? "critical" : "warning",
        title: "Blocked Tasks",
        message: `Project "${project.title}" has ${blockedTasks} blocked task(s)`,
        projectId,
        metadata: { blockedTasks },
      });
    }

    return alerts;
  }

  /**
   * Detect anomalies in project metrics
   */
  async detectAnomalies(projectId: string): Promise<MonitoringAlert[]> {
    const alerts: MonitoringAlert[] = [];

    // Get historical analytics
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const analytics = await prisma.agentAnalytics.findMany({
      where: {
        projectId,
        createdAt: { gte: thirtyDaysAgo },
      },
      orderBy: { createdAt: "desc" },
    });

    if (analytics.length < 10) {
      return alerts; // Not enough data for anomaly detection
    }

    // Calculate averages
    const avgDuration =
      analytics.reduce((sum, a) => sum + a.duration, 0) / analytics.length;
    const avgTokens =
      analytics
        .filter((a) => a.tokensUsed)
        .reduce((sum, a) => sum + (a.tokensUsed || 0), 0) / analytics.length;

    // Check recent executions for anomalies
    const recentAnalytics = analytics.slice(0, 5);

    for (const recent of recentAnalytics) {
      // Duration anomaly
      if (recent.duration > avgDuration * 2) {
        alerts.push({
          type: "anomaly",
          severity: "warning",
          title: "Slow Operation Detected",
          message: `Operation "${recent.action}" took ${recent.duration}ms (2x average)`,
          projectId,
          metadata: {
            action: recent.action,
            duration: recent.duration,
            average: avgDuration,
          },
        });
      }

      // Token usage anomaly
      if (recent.tokensUsed && recent.tokensUsed > avgTokens * 2) {
        alerts.push({
          type: "anomaly",
          severity: "info",
          title: "High Token Usage",
          message: `Operation "${recent.action}" used ${recent.tokensUsed} tokens (2x average)`,
          projectId,
          metadata: {
            action: recent.action,
            tokensUsed: recent.tokensUsed,
            average: avgTokens,
          },
        });
      }

      // Failure patterns
      if (!recent.success) {
        const failureCount = recentAnalytics.filter(
          (a) => a.action === recent.action && !a.success
        ).length;

        if (failureCount >= 3) {
          alerts.push({
            type: "anomaly",
            severity: "critical",
            title: "Repeated Failures",
            message: `Operation "${recent.action}" has failed ${failureCount} times recently`,
            projectId,
            metadata: {
              action: recent.action,
              failureCount,
              errorType: recent.errorType,
            },
          });
        }
      }
    }

    return alerts;
  }

  /**
   * Check upcoming milestones
   */
  async checkUpcomingMilestones(
    projectId?: string
  ): Promise<MonitoringAlert[]> {
    const alerts: MonitoringAlert[] = [];
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const where: any = {
      targetDelivery: {
        gte: new Date(),
        lte: sevenDaysFromNow,
      },
    };

    if (projectId) {
      where.id = projectId;
    }

    const projects = await prisma.project.findMany({
      where,
      include: {
        tasks: true,
      },
    });

    for (const project of projects) {
      const daysUntil = Math.ceil(
        (project.targetDelivery!.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );

      const incompleteTasks = project.tasks.filter(
        (t) => t.status !== "Done"
      ).length;

      alerts.push({
        type: "milestone",
        severity: incompleteTasks > 5 ? "warning" : "info",
        title: "Upcoming Delivery",
        message: `Project "${project.title}" delivery in ${daysUntil} days with ${incompleteTasks} incomplete tasks`,
        projectId: project.id,
        metadata: {
          daysUntil,
          incompleteTasks,
          targetDate: project.targetDelivery,
        },
      });
    }

    return alerts;
  }

  /**
   * Get project metrics
   */
  async getProjectMetrics(projectId: string): Promise<ProjectMetrics> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        tasks: true,
      },
    });

    if (!project) {
      throw new Error("Project not found");
    }

    const totalTasks = project.tasks.length;
    const completedTasks = project.tasks.filter(
      (t) => t.status === "Done"
    ).length;
    const blockedTasks = project.tasks.filter(
      (t) => t.status === "Blocked"
    ).length;

    // Calculate on-time delivery
    const completedWithDueDate = project.tasks.filter(
      (t) => t.status === "Done" && t.dueDate
    );
    const onTimeTasks = completedWithDueDate.filter(
      (t) => t.updatedAt <= t.dueDate!
    ).length;
    const onTimeDelivery =
      completedWithDueDate.length > 0
        ? (onTimeTasks / completedWithDueDate.length) * 100
        : 100;

    // Calculate average task duration
    const taskDurations = project.tasks
      .filter((t) => t.status === "Done")
      .map((t) => t.updatedAt.getTime() - t.createdAt.getTime());

    const averageTaskDuration =
      taskDurations.length > 0
        ? taskDurations.reduce((sum, d) => sum + d, 0) /
          taskDurations.length /
          (1000 * 60 * 60 * 24)
        : 0;

    // Count upcoming deadlines
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const upcomingDeadlines = project.tasks.filter(
      (t) => t.dueDate && t.dueDate <= sevenDaysFromNow && t.status !== "Done"
    ).length;

    // Calculate health score
    let healthScore = 100;
    if (blockedTasks > 0) healthScore -= blockedTasks * 10;
    if (onTimeDelivery < 80) healthScore -= 20;
    if (completedTasks / totalTasks < 0.3) healthScore -= 20;
    healthScore = Math.max(0, Math.min(100, healthScore));

    return {
      taskCompletion: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
      onTimeDelivery,
      averageTaskDuration,
      blockedTasks,
      upcomingDeadlines,
      healthScore,
    };
  }

  /**
   * Send alerts via Slack
   */
  async sendAlerts(alerts: MonitoringAlert[], userId: string): Promise<void> {
    if (alerts.length === 0) return;

    // Group alerts by severity
    const critical = alerts.filter((a) => a.severity === "critical");
    const warning = alerts.filter((a) => a.severity === "warning");
    const info = alerts.filter((a) => a.severity === "info");

    let message = "🚨 *Monitoring Alerts*\n\n";

    if (critical.length > 0) {
      message += "*🔴 Critical:*\n";
      critical.forEach((a) => {
        message += `• ${a.title}: ${a.message}\n`;
      });
      message += "\n";
    }

    if (warning.length > 0) {
      message += "*🟡 Warning:*\n";
      warning.forEach((a) => {
        message += `• ${a.title}: ${a.message}\n`;
      });
      message += "\n";
    }

    if (info.length > 0) {
      message += "*🔵 Info:*\n";
      info.forEach((a) => {
        message += `• ${a.title}: ${a.message}\n`;
      });
    }

    try {
      // Get user's Slack ID from integration credentials
      const userIntegration = await prisma.integrationCredential.findFirst({
        where: {
          userId,
          type: "slack",
        },
      });

      if (!userIntegration || !userIntegration.metadata) {
        console.log(`No Slack integration found for user ${userId}`);
        return;
      }

      const slackUserId = (userIntegration.metadata as any).slackUserId;
      if (!slackUserId) {
        console.log(`No Slack user ID found for user ${userId}`);
        return;
      }

      // Open a DM channel with the user
      const dmChannel = await (slackService as any).client.conversations.open({
        users: slackUserId,
      });

      if (!dmChannel.channel?.id) {
        throw new Error("Failed to open DM channel");
      }

      // Send the message
      await slackService.sendMessage({
        channel: dmChannel.channel.id,
        text: message,
      });
    } catch (error) {
      console.error("Failed to send alerts:", error);
    }
  }

  /**
   * Record analytics
   */
  async recordAnalytics(
    userId: string,
    action: string,
    duration: number,
    success: boolean,
    options?: {
      sessionId?: string;
      projectId?: string;
      toolsUsed?: string[];
      tokensUsed?: number;
      cost?: number;
      errorType?: string;
      metadata?: any;
    }
  ): Promise<void> {
    const { randomUUID } = require("crypto");
    await prisma.agentAnalytics.create({
      data: {
        id: randomUUID(),
        userId,
        action,
        duration,
        success,
        sessionId: options?.sessionId,
        projectId: options?.projectId,
        toolsUsed: options?.toolsUsed || [],
        tokensUsed: options?.tokensUsed,
        cost: options?.cost,
        errorType: options?.errorType,
        metadata: options?.metadata || {},
      },
    });
  }

  /**
   * Get analytics summary
   */
  async getAnalyticsSummary(
    userId: string,
    projectId?: string,
    days: number = 30
  ): Promise<{
    totalOperations: number;
    successRate: number;
    averageDuration: number;
    totalTokens: number;
    totalCost: number;
    topActions: Array<{ action: string; count: number }>;
    errorTypes: Record<string, number>;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const where: any = {
      userId,
      createdAt: { gte: startDate },
    };

    if (projectId) {
      where.projectId = projectId;
    }

    const analytics = await prisma.agentAnalytics.findMany({
      where,
    });

    const totalOperations = analytics.length;
    const successfulOps = analytics.filter((a) => a.success).length;
    const successRate =
      totalOperations > 0 ? (successfulOps / totalOperations) * 100 : 0;

    const averageDuration =
      totalOperations > 0
        ? analytics.reduce((sum, a) => sum + a.duration, 0) / totalOperations
        : 0;

    const totalTokens = analytics.reduce(
      (sum, a) => sum + (a.tokensUsed || 0),
      0
    );
    const totalCost = analytics.reduce((sum, a) => sum + (a.cost || 0), 0);

    // Count actions
    const actionCounts: Record<string, number> = {};
    analytics.forEach((a) => {
      actionCounts[a.action] = (actionCounts[a.action] || 0) + 1;
    });

    const topActions = Object.entries(actionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([action, count]) => ({ action, count }));

    // Count error types
    const errorTypes: Record<string, number> = {};
    analytics
      .filter((a) => !a.success && a.errorType)
      .forEach((a) => {
        errorTypes[a.errorType!] = (errorTypes[a.errorType!] || 0) + 1;
      });

    return {
      totalOperations,
      successRate,
      averageDuration,
      totalTokens,
      totalCost,
      topActions,
      errorTypes,
    };
  }
}

export const monitoringService = new MonitoringService();
