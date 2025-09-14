import { AgentTool, ToolResult } from "../types";
import { prisma } from "@/lib/prisma";
import { AuditLogger } from "@/lib/audit";

export const createUpdateTool: AgentTool = {
  name: "create_update",
  description: "Create a project update or status report",
  parameters: {
    projectId: { type: "string", required: true },
    title: { type: "string", required: true },
    content: { type: "string", required: true },
    type: {
      type: "string",
      required: false,
      enum: ["progress", "milestone", "blocker", "risk", "general"],
    },
    visibility: {
      type: "string",
      required: false,
      enum: ["public", "team", "private"],
    },
    tags: { type: "array", required: false },
  },
  execute: async (params: any): Promise<ToolResult> => {
    try {
      const update = await prisma.update.create({
        data: {
          projectId: params.projectId,
          authorId: params.executorId || "agent",
          title: params.title,
          content: params.content,
          type: params.type || "general",
          visibility: params.visibility || "team",
          tags: params.tags || [],
          metadata: params.metadata || {},
        },
        include: {
          project: { select: { title: true } },
          author: { select: { name: true, email: true } },
        },
      });

      await AuditLogger.logSuccess(
        params.executorId || "agent",
        "create_update",
        "update",
        update.id,
        params
      );

      return {
        success: true,
        data: update,
        metadata: { updateId: update.id, projectTitle: update.project.title },
      };
    } catch (error: any) {
      await AuditLogger.logFailure(
        params.executorId || "agent",
        "create_update",
        "update",
        error.message,
        undefined,
        params
      );

      return {
        success: false,
        error: error.message,
      };
    }
  },
};

export const listUpdatesTool: AgentTool = {
  name: "list_updates",
  description: "List project updates with optional filters",
  parameters: {
    projectId: { type: "string", required: false },
    authorId: { type: "string", required: false },
    type: { type: "string", required: false },
    limit: { type: "number", required: false, default: 10 },
    since: { type: "string", required: false },
  },
  execute: async (params: any): Promise<ToolResult> => {
    try {
      const where: any = {};
      if (params.projectId) where.projectId = params.projectId;
      if (params.authorId) where.authorId = params.authorId;
      if (params.type) where.type = params.type;
      if (params.since) {
        where.createdAt = { gte: new Date(params.since) };
      }

      const updates = await prisma.update.findMany({
        where,
        take: params.limit || 10,
        orderBy: { createdAt: "desc" },
        include: {
          project: { select: { title: true } },
          author: { select: { name: true, email: true } },
        },
      });

      return {
        success: true,
        data: updates,
        metadata: { count: updates.length, filters: where },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  },
};
