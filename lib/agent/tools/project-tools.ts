import { AgentTool, ToolResult } from "../types";
import { prisma } from "@/lib/prisma";
import { AuditLogger } from "@/lib/audit";

export const createProjectTool: AgentTool = {
  name: "create_project",
  description: "Create a new project with specified details",
  parameters: {
    title: { type: "string", required: true },
    branch: { type: "string", required: false },
    status: {
      type: "string",
      required: false,
      enum: ["planning", "active", "on_hold", "completed"],
    },
    stage: {
      type: "string",
      required: false,
      enum: ["Discovery", "Development", "Testing", "Deployment"],
    },
    startDate: { type: "string", required: false },
    targetDelivery: { type: "string", required: false },
    pmId: { type: "string", required: false }, // Made optional
    clientName: { type: "string", required: false }, // Made optional
    clientEmail: { type: "string", required: false }, // Made optional
  },
  execute: async (params: any, context?: any): Promise<ToolResult> => {
    try {
      const { randomUUID } = require("crypto");

      // Use context user as PM if pmId not provided
      const pmId = params.pmId || context?.userId || context?.user?.id;

      // Default client info if not provided
      const clientName = params.clientName || "TBD";
      const clientEmail = params.clientEmail || "tbd@example.com";

      const project = await prisma.project.create({
        data: {
          id: randomUUID(),
          title: params.title,
          branch: params.branch || "main",
          status: params.status || "planning",
          stage: params.stage || "Discovery",
          startDate: params.startDate ? new Date(params.startDate) : undefined,
          targetDelivery: params.targetDelivery
            ? new Date(params.targetDelivery)
            : undefined,
          pmId: pmId,
          clientName: clientName,
          clientEmail: clientEmail,
          clientShareToken: randomUUID(),
          archived: false,
          lastUpdatedAt: new Date(),
          createdAt: new Date(),
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
