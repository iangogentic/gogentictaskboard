// Agent Monitoring Service - Sprint 6 Implementation
import { prisma } from "@/lib/prisma";

export class AgentMonitor {
  async startSession(userId: string, projectId?: string) {
    return await prisma.agentSession.create({
      data: {
        id: `session_${userId}_${Date.now()}`,
        userId,
        projectId,
        state: "active",
        updatedAt: new Date(),
      },
    });
  }

  async endSession(sessionId: string, success: boolean, metadata?: any) {
    return await prisma.agentSession.update({
      where: { id: sessionId },
      data: {
        state: success ? "completed" : "failed",
        result: metadata,
      },
    });
  }

  async logAnalytics(data: {
    sessionId?: string;
    userId: string;
    projectId?: string;
    action: string;
    duration: number;
    toolsUsed?: any;
    tokensUsed?: number;
    cost?: number;
    success: boolean;
    errorType?: string;
    metadata?: any;
  }) {
    return await prisma.agentAnalytics.create({
      data: {
        id: `analytics_${data.userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...data,
      },
    });
  }

  async getAnalytics(userId: string, projectId?: string) {
    const where = {
      userId,
      ...(projectId && { projectId }),
    };

    const [total, successful, avgDuration, topTools] = await Promise.all([
      prisma.agentAnalytics.count({ where }),
      prisma.agentAnalytics.count({ where: { ...where, success: true } }),
      prisma.agentAnalytics.aggregate({
        where,
        _avg: { duration: true },
      }),
      prisma.agentAnalytics.findMany({
        where,
        select: { toolsUsed: true },
        take: 100,
      }),
    ]);

    // Extract tool usage
    const toolCounts: Record<string, number> = {};
    topTools.forEach((record) => {
      if (record.toolsUsed && Array.isArray(record.toolsUsed)) {
        (record.toolsUsed as string[]).forEach((tool) => {
          toolCounts[tool] = (toolCounts[tool] || 0) + 1;
        });
      }
    });

    const sortedTools = Object.entries(toolCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([tool]) => tool);

    return {
      totalSessions: total,
      successRate: total > 0 ? Math.round((successful / total) * 100) : 0,
      avgDuration: Math.round(avgDuration._avg.duration || 0),
      topTools: sortedTools,
    };
  }

  async getRecentSessions(userId: string, limit: number = 10) {
    return await prisma.agentSession.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  async getSessionDetails(sessionId: string) {
    const session = await prisma.agentSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) return null;

    const analytics = await prisma.agentAnalytics.findMany({
      where: { sessionId },
      orderBy: { createdAt: "asc" },
    });

    return {
      session,
      analytics,
    };
  }
}
