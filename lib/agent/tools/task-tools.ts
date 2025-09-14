import { AgentTool, ToolResult } from "../types";
import { prisma } from "@/lib/prisma";
import { AuditLogger } from "@/lib/audit";

export const createTaskTool: AgentTool = {
  name: "create_task",
  description: "Create a new task in a project",
  parameters: {
    projectId: { type: "string", required: true },
    title: { type: "string", required: true },
    description: { type: "string", required: false },
    status: {
      type: "string",
      required: false,
      enum: ["todo", "in_progress", "review", "done", "blocked"],
    },
    priority: {
      type: "string",
      required: false,
      enum: ["low", "medium", "high", "critical"],
    },
    assigneeId: { type: "string", required: false },
    dueDate: { type: "string", required: false },
    tags: { type: "array", required: false },
  },
  execute: async (params: any): Promise<ToolResult> => {
    try {
      const task = await prisma.task.create({
        data: {
          projectId: params.projectId,
          title: params.title,
          description: params.description,
          status: params.status || "todo",
          priority: params.priority || "medium",
          assigneeId: params.assigneeId,
          dueDate: params.dueDate ? new Date(params.dueDate) : undefined,
          tags: params.tags || [],
          metadata: params.metadata || {},
        },
        include: {
          project: { select: { title: true } },
          assignee: { select: { name: true, email: true } },
        },
      });

      await AuditLogger.logSuccess(
        params.executorId || "agent",
        "create_task",
        "task",
        task.id,
        params
      );

      return {
        success: true,
        data: task,
        metadata: { taskId: task.id, projectTitle: task.project.title },
      };
    } catch (error: any) {
      await AuditLogger.logFailure(
        params.executorId || "agent",
        "create_task",
        "task",
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

export const updateTaskTool: AgentTool = {
  name: "update_task",
  description: "Update an existing task",
  parameters: {
    taskId: { type: "string", required: true },
    title: { type: "string", required: false },
    description: { type: "string", required: false },
    status: {
      type: "string",
      required: false,
      enum: ["todo", "in_progress", "review", "done", "blocked"],
    },
    priority: {
      type: "string",
      required: false,
      enum: ["low", "medium", "high", "critical"],
    },
    assigneeId: { type: "string", required: false },
    dueDate: { type: "string", required: false },
    completedAt: { type: "string", required: false },
  },
  execute: async (params: any): Promise<ToolResult> => {
    try {
      const updateData: any = {};
      if (params.title !== undefined) updateData.title = params.title;
      if (params.description !== undefined)
        updateData.description = params.description;
      if (params.status !== undefined) updateData.status = params.status;
      if (params.priority !== undefined) updateData.priority = params.priority;
      if (params.assigneeId !== undefined)
        updateData.assigneeId = params.assigneeId;
      if (params.dueDate !== undefined)
        updateData.dueDate = new Date(params.dueDate);
      if (params.completedAt !== undefined)
        updateData.completedAt = new Date(params.completedAt);
      if (params.status === "done" && !params.completedAt) {
        updateData.completedAt = new Date();
      }

      const task = await prisma.task.update({
        where: { id: params.taskId },
        data: updateData,
        include: {
          project: { select: { title: true } },
          assignee: { select: { name: true, email: true } },
        },
      });

      await AuditLogger.logSuccess(
        params.executorId || "agent",
        "update_task",
        "task",
        task.id,
        params
      );

      return {
        success: true,
        data: task,
        metadata: { taskId: task.id, changes: Object.keys(updateData) },
      };
    } catch (error: any) {
      await AuditLogger.logFailure(
        params.executorId || "agent",
        "update_task",
        "task",
        error.message,
        params.taskId,
        params
      );

      return {
        success: false,
        error: error.message,
      };
    }
  },
};

export const listTasksTool: AgentTool = {
  name: "list_tasks",
  description: "List tasks with optional filters",
  parameters: {
    projectId: { type: "string", required: false },
    assigneeId: { type: "string", required: false },
    status: { type: "string", required: false },
    priority: { type: "string", required: false },
    limit: { type: "number", required: false, default: 10 },
  },
  execute: async (params: any): Promise<ToolResult> => {
    try {
      const where: any = {};
      if (params.projectId) where.projectId = params.projectId;
      if (params.assigneeId) where.assigneeId = params.assigneeId;
      if (params.status) where.status = params.status;
      if (params.priority) where.priority = params.priority;

      const tasks = await prisma.task.findMany({
        where,
        take: params.limit || 10,
        orderBy: [
          { priority: "desc" },
          { dueDate: "asc" },
          { createdAt: "desc" },
        ],
        include: {
          project: { select: { title: true } },
          assignee: { select: { name: true, email: true } },
        },
      });

      return {
        success: true,
        data: tasks,
        metadata: { count: tasks.length, filters: where },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  },
};
