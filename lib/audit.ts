import { prisma } from "@/lib/prisma";

export interface AuditEntry {
  id: string;
  actorId: string;
  action: string;
  entity: string;
  entityId?: string;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

export class AuditService {
  private static instance: AuditService;

  static getInstance(): AuditService {
    if (!AuditService.instance) {
      AuditService.instance = new AuditService();
    }
    return AuditService.instance;
  }

  static async logSuccess(
    actorId: string,
    action: string,
    entity: string,
    entityId?: string,
    metadata?: any
  ): Promise<AuditEntry> {
    return AuditService.getInstance().log({
      actorId,
      action,
      entity,
      entityId,
      metadata: { ...metadata, status: "success" },
    });
  }

  static async logFailure(
    actorId: string,
    action: string,
    entity: string,
    error: string,
    entityId?: string,
    metadata?: any
  ): Promise<AuditEntry> {
    return AuditService.getInstance().log({
      actorId,
      action,
      entity,
      entityId,
      metadata: { ...metadata, error, status: "failure" },
    });
  }
  /**
   * Log an audit entry
   */
  async log(params: {
    actorId: string;
    action: string;
    entity: string;
    entityId?: string;
    metadata?: any;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<AuditEntry> {
    try {
      const entry = await prisma.auditLog.create({
        data: {
          id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          actorId: params.actorId,
          actorType: "user",
          action: params.action,
          targetType: params.entity,
          targetId: params.entityId,
          payload: params.metadata || {},
          status: "executed",
        },
      });

      return {
        id: entry.id,
        actorId: entry.actorId,
        action: entry.action,
        entity: entry.targetType,
        entityId: entry.targetId,
        metadata: entry.payload,
        createdAt: entry.createdAt,
      } as AuditEntry;
    } catch (error) {
      console.error("Failed to create audit log:", error);
      // Return a mock entry if database fails
      return {
        id: `audit_${Date.now()}`,
        actorId: params.actorId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
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
    actorId: string,
    limit: number = 100
  ): Promise<AuditEntry[]> {
    try {
      const logs = await prisma.auditLog.findMany({
        where: { actorId },
        orderBy: { createdAt: "desc" },
        take: limit,
      });
      return logs.map((log) => ({
        id: log.id,
        actorId: log.actorId,
        action: log.action,
        entity: log.targetType,
        entityId: log.targetId,
        metadata: log.payload,
        createdAt: log.createdAt,
      })) as AuditEntry[];
    } catch (error) {
      console.error("Failed to fetch audit logs:", error);
      return [];
    }
  }

  /**
   * Get audit logs for a project (Note: AuditLog model doesn't have projectId)
   */
  async getProjectAuditLogs(
    projectId: string,
    limit: number = 100
  ): Promise<AuditEntry[]> {
    try {
      // Since AuditLog doesn't have projectId, we'll filter by targetId for project-related actions
      const logs = await prisma.auditLog.findMany({
        where: {
          targetType: "project",
          targetId: projectId,
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      });
      return logs.map((log) => ({
        id: log.id,
        actorId: log.actorId,
        action: log.action,
        entity: log.targetType,
        entityId: log.targetId,
        metadata: log.payload,
        createdAt: log.createdAt,
      })) as AuditEntry[];
    } catch (error) {
      console.error("Failed to fetch project audit logs:", error);
      return [];
    }
  }

  /**
   * Search audit logs
   */
  async searchAuditLogs(params: {
    actorId?: string;
    projectId?: string;
    action?: string;
    entity?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<AuditEntry[]> {
    try {
      const where: any = {};

      if (params.actorId) where.actorId = params.actorId;
      if (params.projectId) {
        where.targetType = "project";
        where.targetId = params.projectId;
      }
      if (params.action) where.action = params.action;
      if (params.entity) where.targetType = params.entity;

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

      return logs.map((log) => ({
        id: log.id,
        actorId: log.actorId,
        action: log.action,
        entity: log.targetType,
        entityId: log.targetId,
        metadata: log.payload,
        createdAt: log.createdAt,
      })) as AuditEntry[];
    } catch (error) {
      console.error("Failed to search audit logs:", error);
      return [];
    }
  }

  /**
   * Get recent activity for a user
   */
  async getRecentActivity(
    actorId: string,
    hours: number = 24
  ): Promise<AuditEntry[]> {
    const startDate = new Date();
    startDate.setHours(startDate.getHours() - hours);

    return this.searchAuditLogs({
      actorId,
      startDate,
      limit: 50,
    });
  }

  /**
   * Log agent activity
   */
  async logAgentActivity(params: {
    actorId: string;
    action: string;
    projectId?: string;
    message?: string;
    toolsUsed?: string[];
    response?: string;
  }): Promise<AuditEntry> {
    return this.log({
      actorId: params.actorId,
      action: `agent:${params.action}`,
      entity: "agent",
      metadata: {
        message: params.message,
        toolsUsed: params.toolsUsed,
        response: params.response?.substring(0, 500), // Truncate long responses
        projectId: params.projectId, // Store in metadata since AuditLog doesn't have projectId
      },
    });
  }

  /**
   * Log task activity
   */
  async logTaskActivity(params: {
    actorId: string;
    action: "create" | "update" | "delete" | "complete";
    taskId: string;
    projectId?: string;
    changes?: any;
  }): Promise<AuditEntry> {
    return this.log({
      actorId: params.actorId,
      action: `task:${params.action}`,
      entity: "task",
      entityId: params.taskId,
      metadata: {
        ...params.changes,
        projectId: params.projectId, // Store in metadata since AuditLog doesn't have projectId
      },
    });
  }

  /**
   * Log project activity
   */
  async logProjectActivity(params: {
    actorId: string;
    action: "create" | "update" | "delete" | "archive";
    projectId: string;
    changes?: any;
  }): Promise<AuditEntry> {
    return this.log({
      actorId: params.actorId,
      action: `project:${params.action}`,
      entity: "project",
      entityId: params.projectId,
      metadata: params.changes,
    });
  }

  /**
   * Get audit statistics
   */
  async getAuditStats(
    actorId?: string,
    projectId?: string
  ): Promise<{
    totalActions: number;
    actionsByType: Record<string, number>;
    mostActiveUsers: Array<{ actorId: string; count: number }>;
    recentActions: AuditEntry[];
  }> {
    try {
      const where: any = {};
      if (actorId) where.actorId = actorId;
      if (projectId) {
        where.targetType = "project";
        where.targetId = projectId;
      }

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
      let mostActiveUsers: Array<{ actorId: string; count: number }> = [];
      if (!actorId) {
        const userGroups = await prisma.auditLog.groupBy({
          by: ["actorId"],
          where: projectId
            ? { targetType: "project", targetId: projectId }
            : {},
          _count: true,
          orderBy: { _count: { actorId: "desc" } },
          take: 5,
        });

        mostActiveUsers = userGroups.map((group) => ({
          actorId: group.actorId,
          count: group._count,
        }));
      }

      return {
        totalActions,
        actionsByType,
        mostActiveUsers,
        recentActions: recentActions.map((log) => ({
          id: log.id,
          actorId: log.actorId,
          action: log.action,
          entity: log.targetType,
          entityId: log.targetId,
          metadata: log.payload,
          createdAt: log.createdAt,
        })) as AuditEntry[],
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

export const auditService = AuditService.getInstance();

export const AuditLogger = AuditService;

// Export logAction as a standalone function for backwards compatibility
export async function logAction(params: {
  actorId: string;
  actorType: string;
  action: string;
  targetType: string;
  targetId?: string;
  payload?: any;
  status?: string;
}): Promise<AuditEntry> {
  return auditService.log({
    actorId: params.actorId,
    action: params.action,
    entity: params.targetType,
    entityId: params.targetId,
    metadata: params.payload,
  });
}
