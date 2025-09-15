import { prisma } from "@/lib/prisma";

export interface AuditEntry {
  id: string;
  userId: string;
  projectId?: string;
  action: string;
  entity: string;
  entityId?: string;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

export class AuditService {
  /**
   * Log an audit entry
   */
  async log(params: {
    userId: string;
    action: string;
    entity: string;
    entityId?: string;
    projectId?: string;
    metadata?: any;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<AuditEntry> {
    try {
      const entry = await prisma.auditLog.create({
        data: {
          userId: params.userId,
          action: params.action,
          entity: params.entity,
          entityId: params.entityId,
          projectId: params.projectId,
          metadata: params.metadata || {},
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
        },
      });

      return entry as AuditEntry;
    } catch (error) {
      console.error("Failed to create audit log:", error);
      // Return a mock entry if database fails
      return {
        id: `audit_${Date.now()}`,
        userId: params.userId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        projectId: params.projectId,
        metadata: params.metadata,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        createdAt: new Date(),
      };
    }
  }

  /**
   * Get audit logs for a user
   */
  async getUserAuditLogs(
    userId: string,
    limit: number = 100
  ): Promise<AuditEntry[]> {
    try {
      const logs = await prisma.auditLog.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: limit,
      });
      return logs as AuditEntry[];
    } catch (error) {
      console.error("Failed to fetch audit logs:", error);
      return [];
    }
  }

  /**
   * Get audit logs for a project
   */
  async getProjectAuditLogs(
    projectId: string,
    limit: number = 100
  ): Promise<AuditEntry[]> {
    try {
      const logs = await prisma.auditLog.findMany({
        where: { projectId },
        orderBy: { createdAt: "desc" },
        take: limit,
      });
      return logs as AuditEntry[];
    } catch (error) {
      console.error("Failed to fetch project audit logs:", error);
      return [];
    }
  }

  /**
   * Search audit logs
   */
  async searchAuditLogs(params: {
    userId?: string;
    projectId?: string;
    action?: string;
    entity?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<AuditEntry[]> {
    try {
      const where: any = {};

      if (params.userId) where.userId = params.userId;
      if (params.projectId) where.projectId = params.projectId;
      if (params.action) where.action = params.action;
      if (params.entity) where.entity = params.entity;

      if (params.startDate || params.endDate) {
        where.createdAt = {};
        if (params.startDate) where.createdAt.gte = params.startDate;
        if (params.endDate) where.createdAt.lte = params.endDate;
      }

      const logs = await prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: params.limit || 100,
      });

      return logs as AuditEntry[];
    } catch (error) {
      console.error("Failed to search audit logs:", error);
      return [];
    }
  }

  /**
   * Get recent activity for a user
   */
  async getRecentActivity(
    userId: string,
    hours: number = 24
  ): Promise<AuditEntry[]> {
    const startDate = new Date();
    startDate.setHours(startDate.getHours() - hours);

    return this.searchAuditLogs({
      userId,
      startDate,
      limit: 50,
    });
  }

  /**
   * Log agent activity
   */
  async logAgentActivity(params: {
    userId: string;
    action: string;
    projectId?: string;
    message?: string;
    toolsUsed?: string[];
    response?: string;
  }): Promise<AuditEntry> {
    return this.log({
      userId,
      action: `agent:${params.action}`,
      entity: "agent",
      projectId: params.projectId,
      metadata: {
        message: params.message,
        toolsUsed: params.toolsUsed,
        response: params.response?.substring(0, 500), // Truncate long responses
      },
    });
  }

  /**
   * Log task activity
   */
  async logTaskActivity(params: {
    userId: string;
    action: "create" | "update" | "delete" | "complete";
    taskId: string;
    projectId?: string;
    changes?: any;
  }): Promise<AuditEntry> {
    return this.log({
      userId,
      action: `task:${params.action}`,
      entity: "task",
      entityId: params.taskId,
      projectId: params.projectId,
      metadata: params.changes,
    });
  }

  /**
   * Log project activity
   */
  async logProjectActivity(params: {
    userId: string;
    action: "create" | "update" | "delete" | "archive";
    projectId: string;
    changes?: any;
  }): Promise<AuditEntry> {
    return this.log({
      userId,
      action: `project:${params.action}`,
      entity: "project",
      entityId: params.projectId,
      projectId: params.projectId,
      metadata: params.changes,
    });
  }

  /**
   * Get audit statistics
   */
  async getAuditStats(
    userId?: string,
    projectId?: string
  ): Promise<{
    totalActions: number;
    actionsByType: Record<string, number>;
    mostActiveUsers: Array<{ userId: string; count: number }>;
    recentActions: AuditEntry[];
  }> {
    try {
      const where: any = {};
      if (userId) where.userId = userId;
      if (projectId) where.projectId = projectId;

      // Get total count
      const totalActions = await prisma.auditLog.count({ where });

      // Get recent actions
      const recentActions = await prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 10,
      });

      // Group by action type
      const actionGroups = await prisma.auditLog.groupBy({
        by: ["action"],
        where,
        _count: true,
      });

      const actionsByType: Record<string, number> = {};
      actionGroups.forEach((group) => {
        actionsByType[group.action] = group._count;
      });

      // Get most active users (if not filtering by user)
      let mostActiveUsers: Array<{ userId: string; count: number }> = [];
      if (!userId) {
        const userGroups = await prisma.auditLog.groupBy({
          by: ["userId"],
          where: projectId ? { projectId } : {},
          _count: true,
          orderBy: { _count: { userId: "desc" } },
          take: 5,
        });

        mostActiveUsers = userGroups.map((group) => ({
          userId: group.userId,
          count: group._count,
        }));
      }

      return {
        totalActions,
        actionsByType,
        mostActiveUsers,
        recentActions: recentActions as AuditEntry[],
      };
    } catch (error) {
      console.error("Failed to get audit stats:", error);
      return {
        totalActions: 0,
        actionsByType: {},
        mostActiveUsers: [],
        recentActions: [],
      };
    }
  }
}

export const auditService = new AuditService();
export const AuditLogger = AuditService;

// Export logAction as a standalone function for backwards compatibility
export async function logAction(params: {
  userId: string;
  action: string;
  entity: string;
  entityId?: string;
  projectId?: string;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
}): Promise<AuditEntry> {
  return auditService.log(params);
}
