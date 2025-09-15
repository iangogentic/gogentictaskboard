import { AgentTool, ToolResult } from "../types";
import { prisma } from "@/lib/prisma";
import { AuditLogger } from "@/lib/audit";

export const createProjectTool: AgentTool = {
  name: "create_project",
  description: "Create a new project with specified details",
  parameters: {
    title: { type: "string", required: true },
    description: { type: "string", required: false },
    status: {
      type: "string",
      required: false,
      enum: ["planning", "active", "on_hold", "completed"],
    },
    priority: {
      type: "string",
      required: false,
      enum: ["low", "medium", "high", "critical"],
    },
    startDate: { type: "string", required: false },
    endDate: { type: "string", required: false },
    pmId: { type: "string", required: false },
  },
  execute: async (params: any): Promise<ToolResult> => {
    try {
      const project = await prisma.project.create({
        data: {
          title: params.title,
          description: params.description,
          status: params.status || "planning",
          priority: params.priority || "medium",
          startDate: params.startDate ? new Date(params.startDate) : undefined,
          endDate: params.endDate ? new Date(params.endDate) : undefined,
          pmId: params.pmId,
          portfolioId: params.portfolioId,
          metadata: params.metadata || {},
        },
      });

      await AuditLogger.logSuccess(
        params.executorId || "agent",
        "create_project",
        "project",
        project.id,
        params
      );

      return {
        success: true,
        data: project,
        metadata: { projectId: project.id },
      };
    } catch (error: any) {
      await AuditLogger.logFailure(
        params.executorId || "agent",
        "create_project",
        "project",
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
