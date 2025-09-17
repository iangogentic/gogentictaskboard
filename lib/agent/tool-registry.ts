/**
 * Unified Tool Registry - Phase 1 of Delta Integration
 * Wraps existing services with Zod schemas, RBAC, and mutation flags
 */

import { z } from "zod";
import { slackService } from "@/lib/slack";
import { GoogleDriveService } from "@/lib/google-drive";
import { embeddingService } from "@/lib/embeddings";
import { prisma } from "@/lib/prisma";

export interface ToolDefinition<T = any> {
  name: string;
  description: string;
  schema: z.ZodSchema<T>;
  mutates: boolean;
  scopes: string[];
  handler: (ctx: ToolContext, input: T) => Promise<any>;
}

export interface ToolContext {
  userId: string;
  projectId?: string;
  session?: any;
  permissions?: string[];
  traceId?: string;
}

/**
 * Database Tools - Read operations
 */
const getProjects: ToolDefinition = {
  name: "get_projects",
  description: "Retrieve projects with optional filters",
  schema: z.object({
    status: z.enum(["active", "completed", "on-hold", "cancelled"]).optional(),
    limit: z.number().int().positive().max(100).default(10),
    pmId: z.string().optional(),
  }),
  mutates: false,
  scopes: ["read:projects"],
  handler: async (ctx, input) => {
    const where: any = {};
    if (input.status) where.status = input.status;
    if (input.pmId) where.pmId = input.pmId;

    return prisma.project.findMany({
      where,
      take: input.limit,
      include: {
        pm: true,
        tasks: { select: { id: true, status: true } },
        _count: { select: { tasks: true, updates: true } },
      },
      orderBy: { lastUpdatedAt: "desc" },
    });
  },
};

const getTasks: ToolDefinition = {
  name: "get_tasks",
  description: "Retrieve tasks with optional filters",
  schema: z.object({
    projectId: z.string().optional(),
    status: z.enum(["todo", "in-progress", "completed", "blocked"]).optional(),
    assigneeId: z.string().optional(),
    limit: z.number().int().positive().max(100).default(20),
  }),
  mutates: false,
  scopes: ["read:tasks"],
  handler: async (ctx, input) => {
    const where: any = {};
    if (input.projectId) where.projectId = input.projectId;
    if (input.status) where.status = input.status;
    if (input.assigneeId) where.assigneeId = input.assigneeId;

    return prisma.task.findMany({
      where,
      take: input.limit,
      include: {
        project: { select: { id: true, title: true } },
        assignee: { select: { id: true, name: true, email: true } },
      },
      orderBy: [{ status: "asc" }, { dueDate: "asc" }],
    });
  },
};

const getUsers: ToolDefinition = {
  name: "get_users",
  description: "Retrieve users with optional role filter",
  schema: z.object({
    role: z.enum(["admin", "manager", "developer", "user"]).optional(),
    limit: z.number().int().positive().max(100).default(20),
  }),
  mutates: false,
  scopes: ["read:users"],
  handler: async (ctx, input) => {
    const where: any = {};
    if (input.role) where.role = input.role;

    return prisma.user.findMany({
      where,
      take: input.limit,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        _count: { select: { tasks: true, pmProjects: true } },
      },
      orderBy: { name: "asc" },
    });
  },
};

/**
 * Database Tools - Write operations
 */
const createProject: ToolDefinition = {
  name: "create_project",
  description: "Create a new project",
  schema: z.object({
    title: z.string().min(1).max(200),
    clientName: z.string().min(1).max(100),
    clientEmail: z.string().email().optional(),
    startDate: z.string().datetime().optional(),
    targetDelivery: z.string().datetime().optional(),
    status: z
      .enum(["active", "completed", "on-hold", "cancelled"])
      .default("active"),
    notes: z.string().optional(),
    pmId: z.string().optional(),
  }),
  mutates: true,
  scopes: ["write:projects"],
  handler: async (ctx, input) => {
    // Auto-assign PM if not provided
    let pmId = input.pmId;
    if (!pmId) {
      const pm = await prisma.user.findFirst({
        where: { role: { in: ["admin", "manager"] } },
        orderBy: { pmProjects: { _count: "asc" } },
      });
      pmId = pm?.id;
    }

    return prisma.project.create({
      data: {
        title: input.title,
        clientName: input.clientName,
        clientEmail: input.clientEmail || "",
        startDate: input.startDate ? new Date(input.startDate) : new Date(),
        targetDelivery: input.targetDelivery
          ? new Date(input.targetDelivery)
          : null,
        status: input.status,
        notes: input.notes || "",
        pmId: pmId || "",
        health: "green",
        stage: "discovery",
      },
      include: { pm: true },
    });
  },
};

const createTask: ToolDefinition = {
  name: "create_task",
  description: "Create a new task",
  schema: z.object({
    projectId: z.string(),
    title: z.string().min(1).max(200),
    description: z.string().optional(),
    status: z
      .enum(["todo", "in-progress", "completed", "blocked"])
      .default("todo"),
    priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
    estimatedHours: z.number().positive().optional(),
    dueDate: z.string().datetime().optional(),
    assigneeId: z.string().optional(),
  }),
  mutates: true,
  scopes: ["write:tasks"],
  handler: async (ctx, input) => {
    return prisma.task.create({
      data: {
        projectId: input.projectId,
        title: input.title,
        description: input.description || "",
        status: input.status,
        priority: input.priority,
        estimatedHours: input.estimatedHours || 0,
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        assigneeId: input.assigneeId || null,
      },
      include: {
        project: true,
        assignee: true,
      },
    });
  },
};

const updateTask: ToolDefinition = {
  name: "update_task",
  description: "Update an existing task",
  schema: z.object({
    taskId: z.string(),
    status: z.enum(["todo", "in-progress", "completed", "blocked"]).optional(),
    assigneeId: z.string().nullable().optional(),
    actualHours: z.number().positive().optional(),
    notes: z.string().optional(),
  }),
  mutates: true,
  scopes: ["write:tasks"],
  handler: async (ctx, input) => {
    const data: any = {};
    if (input.status !== undefined) data.status = input.status;
    if (input.assigneeId !== undefined) data.assigneeId = input.assigneeId;
    if (input.actualHours !== undefined) data.actualHours = input.actualHours;
    if (input.notes !== undefined) data.notes = input.notes;

    return prisma.task.update({
      where: { id: input.taskId },
      data,
      include: { assignee: true, project: true },
    });
  },
};

/**
 * Slack Tools - Wrapping existing SlackService
 */
const slackSendDM: ToolDefinition = {
  name: "slack_send_dm",
  description: "Send a direct message via Slack",
  schema: z.object({
    email: z.string().email(),
    message: z.string().min(1).max(4000),
  }),
  mutates: false,
  scopes: ["slack:write"],
  handler: async (ctx, input) => {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (!user) {
      throw new Error(`User ${input.email} not found`);
    }

    await slackService.sendMessage({
      channel: input.email,
      text: input.message,
    });

    return { success: true, sentTo: input.email };
  },
};

const slackSendChannelMessage: ToolDefinition = {
  name: "slack_send_channel",
  description: "Send a message to a Slack channel",
  schema: z.object({
    channel: z.string(),
    message: z.string().min(1).max(4000),
    threadTs: z.string().optional(),
  }),
  mutates: false,
  scopes: ["slack:write"],
  handler: async (ctx, input) => {
    await slackService.sendMessage({
      channel: input.channel,
      text: input.message,
      threadTs: input.threadTs,
    });

    return { success: true, channel: input.channel };
  },
};

const slackLinkProject: ToolDefinition = {
  name: "slack_link_project",
  description: "Link a project to a Slack channel",
  schema: z.object({
    projectId: z.string(),
    channelId: z.string(),
    channelName: z.string(),
  }),
  mutates: true,
  scopes: ["slack:write", "write:projects"],
  handler: async (ctx, input) => {
    await slackService.linkProjectToChannel(
      input.projectId,
      input.channelId,
      input.channelName
    );
    return { success: true, linked: true };
  },
};

/**
 * Google Drive Tools - Wrapping existing GoogleDriveService
 */
const driveCreateFolder: ToolDefinition = {
  name: "drive_create_folder",
  description: "Create a folder in Google Drive",
  schema: z.object({
    folderName: z.string().min(1).max(255),
    parentFolderId: z.string().optional(),
  }),
  mutates: true,
  scopes: ["drive:write"],
  handler: async (ctx, input) => {
    const driveService = GoogleDriveService.getInstance();
    return await driveService.createFolder(
      ctx.userId,
      input.folderName,
      input.parentFolderId
    );
  },
};

const driveCreateProjectStructure: ToolDefinition = {
  name: "drive_create_project_structure",
  description: "Create complete project folder structure in Drive",
  schema: z.object({
    projectId: z.string(),
    projectName: z.string(),
  }),
  mutates: true,
  scopes: ["drive:write", "write:projects"],
  handler: async (ctx, input) => {
    const driveService = GoogleDriveService.getInstance();
    return await driveService.createProjectFolderStructure(
      ctx.userId,
      input.projectId,
      input.projectName
    );
  },
};

const driveSearchFiles: ToolDefinition = {
  name: "drive_search_files",
  description: "Search for files in Google Drive",
  schema: z.object({
    query: z.string().min(1),
    mimeType: z.string().optional(),
  }),
  mutates: false,
  scopes: ["drive:read"],
  handler: async (ctx, input) => {
    const driveService = GoogleDriveService.getInstance();
    return await driveService.searchFiles(
      ctx.userId,
      input.query,
      input.mimeType
    );
  },
};

/**
 * RAG Tools - Wrapping existing EmbeddingService
 */
const ragSearch: ToolDefinition = {
  name: "rag_search",
  description: "Search knowledge base using semantic search",
  schema: z.object({
    query: z.string().min(1),
    projectId: z.string().optional(),
    limit: z.number().int().positive().max(20).default(5),
    threshold: z.number().min(0).max(1).default(0.7),
  }),
  mutates: false,
  scopes: ["rag:read"],
  handler: async (ctx, input) => {
    return await embeddingService.search(
      input.query,
      input.projectId,
      input.limit,
      input.threshold
    );
  },
};

const ragIndexDocument: ToolDefinition = {
  name: "rag_index_document",
  description: "Index a document for semantic search",
  schema: z.object({
    documentId: z.string(),
    content: z.string(),
  }),
  mutates: true,
  scopes: ["rag:write"],
  handler: async (ctx, input) => {
    return await embeddingService.processDocument(
      input.documentId,
      input.content
    );
  },
};

/**
 * Tool Registry Class
 */
export class ToolRegistry {
  private tools = new Map<string, ToolDefinition>();

  constructor() {
    // Register all tools
    this.registerTools([
      // Database reads
      getProjects,
      getTasks,
      getUsers,
      // Database writes
      createProject,
      createTask,
      updateTask,
      // Slack
      slackSendDM,
      slackSendChannelMessage,
      slackLinkProject,
      // Drive
      driveCreateFolder,
      driveCreateProjectStructure,
      driveSearchFiles,
      // RAG
      ragSearch,
      ragIndexDocument,
    ]);
  }

  private registerTools(tools: ToolDefinition[]) {
    tools.forEach((tool) => this.tools.set(tool.name, tool));
  }

  get(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  list(options?: { scopes?: string[]; mutates?: boolean }): ToolDefinition[] {
    let tools = Array.from(this.tools.values());

    if (options?.scopes) {
      tools = tools.filter((t) =>
        options.scopes!.some((scope) => t.scopes.includes(scope))
      );
    }

    if (options?.mutates !== undefined) {
      tools = tools.filter((t) => t.mutates === options.mutates);
    }

    return tools;
  }

  async execute(name: string, ctx: ToolContext, input: any): Promise<any> {
    const tool = this.get(name);
    if (!tool) {
      throw new Error(`Tool ${name} not found`);
    }

    // Check permissions
    if (ctx.permissions) {
      const hasPermission = tool.scopes.some((scope) =>
        ctx.permissions!.includes(scope)
      );
      if (!hasPermission) {
        throw new Error(`Insufficient permissions for tool ${name}`);
      }
    }

    // Validate input
    const validated = tool.schema.parse(input);

    // Execute
    return await tool.handler(ctx, validated);
  }

  // Get OpenAI function definitions
  getOpenAISchemas() {
    return Array.from(this.tools.values()).map((tool) => ({
      type: "function" as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: zodToJsonSchema(tool.schema),
      },
    }));
  }
}

// Helper to convert Zod to JSON Schema (simplified)
function zodToJsonSchema(schema: z.ZodSchema): any {
  // In production, use zod-to-json-schema package
  // This is a simplified implementation
  if (schema instanceof z.ZodObject) {
    const shape = (schema as any)._def.shape();
    const properties: any = {};
    const required: string[] = [];

    for (const [key, value] of Object.entries(shape)) {
      const zodType = value as z.ZodSchema;
      properties[key] = getZodTypeInfo(zodType);

      if (!zodType.isOptional()) {
        required.push(key);
      }
    }

    return {
      type: "object",
      properties,
      required: required.length > 0 ? required : undefined,
    };
  }

  return { type: "object", properties: {}, required: [] };
}

function getZodTypeInfo(zodType: z.ZodSchema): any {
  if (zodType instanceof z.ZodString) {
    return { type: "string" };
  } else if (zodType instanceof z.ZodNumber) {
    return { type: "number" };
  } else if (zodType instanceof z.ZodBoolean) {
    return { type: "boolean" };
  } else if (zodType instanceof z.ZodEnum) {
    return {
      type: "string",
      enum: (zodType as any)._def.values,
    };
  } else if (zodType instanceof z.ZodOptional) {
    return getZodTypeInfo((zodType as any)._def.innerType);
  } else if (zodType instanceof z.ZodDefault) {
    const info = getZodTypeInfo((zodType as any)._def.innerType);
    info.default = (zodType as any)._def.defaultValue();
    return info;
  }
  return { type: "string" };
}

// Export singleton
export const toolRegistry = new ToolRegistry();
