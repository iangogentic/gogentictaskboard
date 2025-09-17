/**
 * Unified Tool Catalog - Integrating existing services with Zod validation
 * This wraps all existing services (Slack, Drive, RAG) with type-safe interfaces
 */

import { z } from "zod";
import { slackService } from "@/lib/slack";
import { GoogleDriveService } from "@/lib/google-drive";
import { embeddingService } from "@/lib/embeddings";
import { prisma } from "@/lib/prisma";

// Enhanced type-safe tool interface
export interface UnifiedTool<T = any> {
  name: string;
  description: string;
  category: "database" | "slack" | "drive" | "rag" | "dynamic";
  schema: z.ZodSchema<T>;
  implementation: (params: T, context?: ToolContext) => Promise<any>;
  requiresAuth?: boolean;
  rateLimit?: { requests: number; window: number };
}

export interface ToolContext {
  userId: string;
  session?: any;
  traceId?: string;
  startTime?: number;
}

/**
 * Database Tools - Wrapping existing hybrid functions with Zod
 */
export const databaseTools: UnifiedTool[] = [
  {
    name: "get_projects",
    description: "Get projects with optional filters",
    category: "database",
    schema: z.object({
      status: z
        .enum(["active", "completed", "on-hold", "cancelled"])
        .optional(),
      limit: z.number().int().positive().max(100).default(10),
    }),
    implementation: async (params) => {
      const where: any = {};
      if (params.status) where.status = params.status;

      return prisma.project.findMany({
        where,
        take: params.limit,
        include: {
          pm: true,
          tasks: { select: { id: true, status: true } },
          _count: { select: { tasks: true, updates: true } },
        },
        orderBy: { lastUpdatedAt: "desc" },
      });
    },
  },
  {
    name: "get_tasks",
    description: "Get tasks with optional filters",
    category: "database",
    schema: z.object({
      projectId: z.string().optional(),
      status: z
        .enum(["todo", "in-progress", "completed", "blocked"])
        .optional(),
      assigneeId: z.string().optional(),
      limit: z.number().int().positive().max(100).default(20),
    }),
    implementation: async (params) => {
      const where: any = {};
      if (params.projectId) where.projectId = params.projectId;
      if (params.status) where.status = params.status;
      if (params.assigneeId) where.assigneeId = params.assigneeId;

      return prisma.task.findMany({
        where,
        take: params.limit,
        include: {
          project: { select: { id: true, title: true } },
          assignee: { select: { id: true, name: true, email: true } },
        },
        orderBy: [{ status: "asc" }, { dueDate: "asc" }],
      });
    },
  },
  {
    name: "create_project",
    description: "Create a new project",
    category: "database",
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
    }),
    requiresAuth: true,
    implementation: async (params) => {
      // Find available PM
      const pm = await prisma.user.findFirst({
        where: { role: { in: ["admin", "manager"] } },
        orderBy: { pmProjects: { _count: "asc" } },
      });

      return prisma.project.create({
        data: {
          title: params.title,
          clientName: params.clientName,
          clientEmail: params.clientEmail || "",
          startDate: params.startDate ? new Date(params.startDate) : new Date(),
          targetDelivery: params.targetDelivery
            ? new Date(params.targetDelivery)
            : null,
          status: params.status,
          notes: params.notes || "",
          pmId: pm?.id || "",
          health: "green",
          stage: "discovery",
        },
        include: { pm: true },
      });
    },
  },
];

/**
 * Slack Tools - Wrapping existing SlackService with Zod
 */
export const slackTools: UnifiedTool[] = [
  {
    name: "slack_send_dm",
    description: "Send a direct message via Slack",
    category: "slack",
    schema: z.object({
      email: z.string().email(),
      message: z.string().min(1).max(4000),
      userId: z.string().optional(), // Internal user ID
    }),
    requiresAuth: true,
    implementation: async (params, context) => {
      // First try to get Slack user ID from our database
      const user = await prisma.user.findUnique({
        where: { email: params.email },
      });

      if (user?.id) {
        // Use existing sendDailyWorkDM pattern
        const summary = {
          userId: user.id,
          tasks: [],
          blockedTasks: [],
          completedToday: 0,
          inProgress: 0,
        };

        // Modify to send custom message
        await slackService.sendMessage({
          channel: params.email, // SlackService will resolve to DM
          text: params.message,
        });

        return { success: true, sentTo: params.email };
      }

      throw new Error(`User ${params.email} not found in system`);
    },
  },
  {
    name: "slack_send_channel_message",
    description: "Send a message to a Slack channel",
    category: "slack",
    schema: z.object({
      channel: z.string(),
      message: z.string().min(1).max(4000),
      threadTs: z.string().optional(),
    }),
    requiresAuth: true,
    implementation: async (params) => {
      await slackService.sendMessage({
        channel: params.channel,
        text: params.message,
        threadTs: params.threadTs,
      });
      return { success: true, channel: params.channel };
    },
  },
  {
    name: "slack_link_project",
    description: "Link a project to a Slack channel",
    category: "slack",
    schema: z.object({
      projectId: z.string(),
      channelId: z.string(),
      channelName: z.string(),
    }),
    requiresAuth: true,
    implementation: async (params) => {
      await slackService.linkProjectToChannel(
        params.projectId,
        params.channelId,
        params.channelName
      );
      return { success: true, linked: true };
    },
  },
];

/**
 * Google Drive Tools - Wrapping existing GoogleDriveService with Zod
 */
export const driveTools: UnifiedTool[] = [
  {
    name: "drive_create_folder",
    description: "Create a folder in Google Drive",
    category: "drive",
    schema: z.object({
      folderName: z.string().min(1).max(255),
      parentFolderId: z.string().optional(),
    }),
    requiresAuth: true,
    implementation: async (params, context) => {
      const driveService = GoogleDriveService.getInstance();
      return await driveService.createFolder(
        context!.userId,
        params.folderName,
        params.parentFolderId
      );
    },
  },
  {
    name: "drive_create_project_structure",
    description: "Create complete project folder structure",
    category: "drive",
    schema: z.object({
      projectId: z.string(),
      projectName: z.string(),
    }),
    requiresAuth: true,
    implementation: async (params, context) => {
      const driveService = GoogleDriveService.getInstance();
      return await driveService.createProjectFolderStructure(
        context!.userId,
        params.projectId,
        params.projectName
      );
    },
  },
  {
    name: "drive_upload_file",
    description: "Upload a file to Google Drive",
    category: "drive",
    schema: z.object({
      fileName: z.string(),
      mimeType: z.string(),
      content: z.string(), // Base64 or text
      folderId: z.string().optional(),
    }),
    requiresAuth: true,
    implementation: async (params, context) => {
      const driveService = GoogleDriveService.getInstance();
      const buffer = Buffer.from(
        params.content,
        params.mimeType.startsWith("text/") ? "utf-8" : "base64"
      );

      return await driveService.uploadFile(
        context!.userId,
        params.fileName,
        params.mimeType,
        buffer,
        params.folderId
      );
    },
  },
  {
    name: "drive_search_files",
    description: "Search for files in Google Drive",
    category: "drive",
    schema: z.object({
      query: z.string().min(1),
      mimeType: z.string().optional(),
    }),
    requiresAuth: true,
    implementation: async (params, context) => {
      const driveService = GoogleDriveService.getInstance();
      return await driveService.searchFiles(
        context!.userId,
        params.query,
        params.mimeType
      );
    },
  },
];

/**
 * RAG Tools - Wrapping existing EmbeddingService with Zod
 */
export const ragTools: UnifiedTool[] = [
  {
    name: "rag_search",
    description: "Search knowledge base using semantic search",
    category: "rag",
    schema: z.object({
      query: z.string().min(1),
      projectId: z.string().optional(),
      limit: z.number().int().positive().max(20).default(5),
      threshold: z.number().min(0).max(1).default(0.7),
    }),
    implementation: async (params) => {
      return await embeddingService.search(
        params.query,
        params.projectId,
        params.limit,
        params.threshold
      );
    },
  },
  {
    name: "rag_index_document",
    description: "Index a document for semantic search",
    category: "rag",
    schema: z.object({
      documentId: z.string(),
      content: z.string(),
    }),
    requiresAuth: true,
    implementation: async (params) => {
      return await embeddingService.processDocument(
        params.documentId,
        params.content
      );
    },
  },
  {
    name: "rag_get_context",
    description: "Get context for AI based on query",
    category: "rag",
    schema: z.object({
      query: z.string(),
      projectId: z.string().optional(),
      maxTokens: z.number().int().positive().default(2000),
    }),
    implementation: async (params) => {
      return await embeddingService.getContextForQuery(
        params.query,
        params.projectId,
        params.maxTokens
      );
    },
  },
];

/**
 * Dynamic Execution Tool - For complex operations
 */
export const dynamicTool: UnifiedTool = {
  name: "execute_dynamic",
  description: "Execute complex database operations dynamically",
  category: "dynamic",
  schema: z.object({
    operation: z.string(),
    reasoning: z.string(),
  }),
  requiresAuth: true,
  rateLimit: { requests: 5, window: 60 }, // 5 per minute
  implementation: async (params) => {
    // Import the existing safety checks
    const { isOperationSafe, executePrismaOperation } = await import(
      "@/lib/agent/autonomous-executor"
    );

    if (!isOperationSafe(params.operation)) {
      throw new Error("Operation blocked for safety");
    }

    return await executePrismaOperation(params.operation, params.reasoning);
  },
};

/**
 * Unified Tool Registry
 */
export class UnifiedToolRegistry {
  private tools = new Map<string, UnifiedTool>();
  private rateLimits = new Map<string, { count: number; resetTime: number }>();

  constructor() {
    // Register all tools
    [
      ...databaseTools,
      ...slackTools,
      ...driveTools,
      ...ragTools,
      dynamicTool,
    ].forEach((tool) => this.register(tool));
  }

  register(tool: UnifiedTool) {
    this.tools.set(tool.name, tool);
  }

  get(name: string): UnifiedTool | undefined {
    return this.tools.get(name);
  }

  list(category?: string): UnifiedTool[] {
    const tools = Array.from(this.tools.values());
    return category ? tools.filter((t) => t.category === category) : tools;
  }

  async execute(name: string, params: any, context: ToolContext): Promise<any> {
    const tool = this.get(name);
    if (!tool) {
      throw new Error(`Tool ${name} not found`);
    }

    // Check rate limit
    if (tool.rateLimit && !this.checkRateLimit(name, context.userId)) {
      throw new Error(`Rate limit exceeded for tool ${name}`);
    }

    // Validate params with Zod
    const validated = tool.schema.parse(params);

    // Check auth requirement
    if (tool.requiresAuth && !context.userId) {
      throw new Error(`Authentication required for tool ${name}`);
    }

    // Execute with timing
    const startTime = Date.now();
    try {
      const result = await tool.implementation(validated, context);

      // Log metrics
      console.log(`[Tool: ${name}] Executed in ${Date.now() - startTime}ms`);

      return result;
    } catch (error) {
      console.error(`[Tool: ${name}] Error:`, error);
      throw error;
    }
  }

  private checkRateLimit(toolName: string, userId: string): boolean {
    const tool = this.get(toolName);
    if (!tool?.rateLimit) return true;

    const key = `${toolName}:${userId}`;
    const now = Date.now();
    const limit = this.rateLimits.get(key);

    if (!limit || now > limit.resetTime) {
      this.rateLimits.set(key, {
        count: 1,
        resetTime: now + tool.rateLimit.window * 1000,
      });
      return true;
    }

    if (limit.count >= tool.rateLimit.requests) {
      return false;
    }

    limit.count++;
    return true;
  }

  // Get OpenAI function definitions
  getOpenAISchemas() {
    return Array.from(this.tools.values()).map((tool) => ({
      type: "function" as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: this.zodToOpenAISchema(tool.schema),
      },
    }));
  }

  private zodToOpenAISchema(schema: z.ZodSchema): any {
    // Convert Zod schema to OpenAI JSON Schema
    // This is a simplified version - use zod-to-json-schema in production
    return {
      type: "object",
      properties: {},
      required: [],
    };
  }
}

// Export singleton instance
export const unifiedToolRegistry = new UnifiedToolRegistry();
