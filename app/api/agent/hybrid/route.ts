import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { prisma } from "@/lib/prisma";
import {
  executePrismaOperation,
  executeMultipleOperations,
  isOperationSafe,
} from "@/lib/agent/autonomous-executor";

export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

let ASSISTANT_ID = process.env.OPENAI_HYBRID_ASSISTANT_ID;

/**
 * Predefined functions for common operations (fast path)
 */
const commonFunctions = {
  async get_projects(args: any) {
    const where: any = {};
    if (args.status) where.status = args.status;
    const limit = args.limit || 10;

    const projects = await prisma.project.findMany({
      where,
      take: limit,
      include: {
        pm: true,
        tasks: {
          select: {
            id: true,
            status: true,
            estimatedHours: true,
            actualHours: true,
          },
        },
        _count: {
          select: { tasks: true, updates: true },
        },
      },
      orderBy: { lastUpdatedAt: "desc" },
    });

    return projects.map((p) => ({
      ...p,
      progress:
        p.tasks.length > 0
          ? Math.round(
              (p.tasks.filter((t) => t.status === "completed").length /
                p.tasks.length) *
                100
            )
          : 0,
    }));
  },

  async get_tasks(args: any) {
    const where: any = {};
    if (args.projectId) where.projectId = args.projectId;
    if (args.status) where.status = args.status;
    if (args.assigneeId) where.assigneeId = args.assigneeId;

    return prisma.task.findMany({
      where,
      take: args.limit || 20,
      include: {
        project: { select: { id: true, title: true } },
        assignee: { select: { id: true, name: true, email: true } },
      },
      orderBy: [{ status: "asc" }, { dueDate: "asc" }],
    });
  },

  async get_users(args: any) {
    const where: any = {};
    if (args.role) where.role = args.role;

    return prisma.user.findMany({
      where,
      take: args.limit || 20,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        _count: {
          select: {
            projects: true,
            pmProjects: true,
            tasks: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });
  },

  async create_project(args: any) {
    // Find available PM
    const pm = await prisma.user.findFirst({
      where: { role: { in: ["admin", "manager"] } },
      orderBy: { pmProjects: { _count: "asc" } },
    });

    return prisma.project.create({
      data: {
        title: args.title,
        clientName: args.clientName,
        clientEmail: args.clientEmail || "",
        startDate: args.startDate ? new Date(args.startDate) : new Date(),
        targetDelivery: args.targetDelivery
          ? new Date(args.targetDelivery)
          : null,
        status: args.status || "active",
        notes: args.notes || "",
        pmId: pm?.id || "",
        health: "green",
        stage: "discovery",
      },
      include: { pm: true },
    });
  },

  async update_project(args: any) {
    const updateData: any = {};
    const { projectId, ...updates } = args;

    Object.keys(updates).forEach((key) => {
      if (updates[key] !== undefined) {
        if (key === "targetDelivery" && updates[key]) {
          updateData[key] = new Date(updates[key]);
        } else {
          updateData[key] = updates[key];
        }
      }
    });

    updateData.lastUpdatedAt = new Date();

    return prisma.project.update({
      where: { id: projectId },
      data: updateData,
      include: { pm: true, tasks: true },
    });
  },

  async create_task(args: any) {
    return prisma.task.create({
      data: {
        projectId: args.projectId,
        title: args.title,
        status: args.status || "todo",
        assigneeId: args.assigneeId || null,
        dueDate: args.dueDate ? new Date(args.dueDate) : null,
        estimatedHours: args.estimatedHours || 0,
        actualHours: 0,
        notes: args.notes || "",
        order: 999,
      },
      include: {
        project: { select: { title: true } },
        assignee: { select: { name: true } },
      },
    });
  },

  async update_task(args: any) {
    const { taskId, ...updates } = args;
    const updateData: any = {};

    Object.keys(updates).forEach((key) => {
      if (updates[key] !== undefined) {
        if (key === "dueDate" && updates[key]) {
          updateData[key] = new Date(updates[key]);
        } else {
          updateData[key] = updates[key];
        }
      }
    });

    return prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: {
        project: { select: { title: true } },
        assignee: { select: { name: true } },
      },
    });
  },

  async get_site_overview() {
    const [
      totalProjects,
      activeProjects,
      totalTasks,
      completedTasks,
      totalUsers,
      recentUpdates,
    ] = await Promise.all([
      prisma.project.count(),
      prisma.project.count({ where: { status: "active" } }),
      prisma.task.count(),
      prisma.task.count({ where: { status: "completed" } }),
      prisma.user.count(),
      prisma.update.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          author: { select: { name: true } },
          project: { select: { title: true } },
        },
      }),
    ]);

    return {
      projects: { total: totalProjects, active: activeProjects },
      tasks: {
        total: totalTasks,
        completed: completedTasks,
        completionRate:
          totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
      },
      users: { total: totalUsers },
      recentActivity: recentUpdates,
    };
  },
};

/**
 * Get or create the hybrid assistant
 */
async function getOrCreateAssistant() {
  if (ASSISTANT_ID) {
    try {
      return await openai.beta.assistants.retrieve(ASSISTANT_ID);
    } catch (error) {
      console.log("Assistant not found, creating new one...");
    }
  }

  // Create function definitions for common operations
  const functionDefinitions = [
    {
      type: "function" as const,
      function: {
        name: "get_projects",
        description: "Get projects with filters",
        parameters: {
          type: "object",
          properties: {
            status: {
              type: "string",
              enum: ["active", "completed", "on-hold", "cancelled"],
            },
            limit: { type: "number" },
          },
        },
      },
    },
    {
      type: "function" as const,
      function: {
        name: "get_tasks",
        description: "Get tasks with filters",
        parameters: {
          type: "object",
          properties: {
            projectId: { type: "string" },
            status: {
              type: "string",
              enum: ["todo", "in-progress", "completed", "blocked"],
            },
            assigneeId: { type: "string" },
            limit: { type: "number" },
          },
        },
      },
    },
    {
      type: "function" as const,
      function: {
        name: "get_users",
        description: "Get users in the system",
        parameters: {
          type: "object",
          properties: {
            role: {
              type: "string",
              enum: ["admin", "manager", "developer", "viewer"],
            },
            limit: { type: "number" },
          },
        },
      },
    },
    {
      type: "function" as const,
      function: {
        name: "create_project",
        description: "Create a new project",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string" },
            clientName: { type: "string" },
            clientEmail: { type: "string" },
            startDate: { type: "string" },
            targetDelivery: { type: "string" },
            status: { type: "string" },
            notes: { type: "string" },
          },
          required: ["title", "clientName"],
        },
      },
    },
    {
      type: "function" as const,
      function: {
        name: "update_project",
        description: "Update an existing project",
        parameters: {
          type: "object",
          properties: {
            projectId: { type: "string" },
            title: { type: "string" },
            status: { type: "string" },
            health: { type: "string" },
            notes: { type: "string" },
            targetDelivery: { type: "string" },
          },
          required: ["projectId"],
        },
      },
    },
    {
      type: "function" as const,
      function: {
        name: "create_task",
        description: "Create a new task",
        parameters: {
          type: "object",
          properties: {
            projectId: { type: "string" },
            title: { type: "string" },
            status: { type: "string" },
            assigneeId: { type: "string" },
            dueDate: { type: "string" },
            estimatedHours: { type: "number" },
            notes: { type: "string" },
          },
          required: ["projectId", "title"],
        },
      },
    },
    {
      type: "function" as const,
      function: {
        name: "update_task",
        description: "Update an existing task",
        parameters: {
          type: "object",
          properties: {
            taskId: { type: "string" },
            title: { type: "string" },
            status: { type: "string" },
            assigneeId: { type: "string" },
            dueDate: { type: "string" },
            actualHours: { type: "number" },
            notes: { type: "string" },
          },
          required: ["taskId"],
        },
      },
    },
    {
      type: "function" as const,
      function: {
        name: "get_site_overview",
        description: "Get comprehensive site statistics",
        parameters: {
          type: "object",
          properties: {},
        },
      },
    },
    {
      type: "function" as const,
      function: {
        name: "execute_dynamic_operation",
        description:
          "Execute complex or custom database operations when predefined functions aren't sufficient",
        parameters: {
          type: "object",
          properties: {
            operation: {
              type: "string",
              description: "Prisma operation to execute",
            },
            reasoning: {
              type: "string",
              description: "Why this dynamic operation is needed",
            },
          },
          required: ["operation", "reasoning"],
        },
      },
    },
  ];

  const assistant = await openai.beta.assistants.create({
    name: "GoGentic Hybrid AI Assistant",
    instructions: `You are a hybrid AI assistant for project management with two modes of operation:

## Mode 1: Fast Functions (Use First)
For common operations, use the predefined functions:
- get_projects, get_tasks, get_users, get_site_overview
- create_project, update_project, create_task, update_task

These are optimized and fast. ALWAYS prefer these when possible.

## Mode 2: Dynamic Execution (Use When Needed)
For complex operations that can't be handled by predefined functions, use execute_dynamic_operation to write custom Prisma queries.

Examples of when to use dynamic execution:
- Complex aggregations or reports
- Multi-table operations with specific conditions
- Bulk operations
- Custom queries with complex filters

## Decision Process:
1. Can this be done with a predefined function? → Use it (fast)
2. Does it require custom logic? → Use execute_dynamic_operation
3. Never use dynamic execution for simple CRUD operations

## Important:
- You have full database access but should be responsible
- Check for existing data before creating duplicates
- Be efficient - use the right tool for the job
- Predefined functions are 2-3x faster than dynamic execution`,
    model: "gpt-4-turbo-preview",
    tools: functionDefinitions,
  });

  ASSISTANT_ID = assistant.id;
  console.log("Created hybrid assistant:", assistant.id);

  return assistant;
}

/**
 * Get or create thread
 */
async function getOrCreateThread(userId: string, conversationId?: string) {
  if (conversationId) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { metadata: true },
    });

    const metadata = conversation?.metadata as any;
    if (metadata?.threadId) {
      try {
        return await openai.beta.threads.retrieve(metadata.threadId);
      } catch (error) {
        console.log("Thread not found, creating new one...");
      }
    }
  }

  const thread = await openai.beta.threads.create({
    metadata: {
      userId,
      conversationId: conversationId || "new",
      created: new Date().toISOString(),
    },
  });

  if (conversationId) {
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { metadata: { threadId: thread.id } },
    });
  }

  return thread;
}

/**
 * Main handler
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, userId, conversationId } = body;

    const effectiveUserId = userId || "hybrid-user";

    // Get or create assistant
    const assistant = await getOrCreateAssistant();

    // Get or create conversation
    let conversation = conversationId
      ? await prisma.conversation.findUnique({ where: { id: conversationId } })
      : null;

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          userId: effectiveUserId,
          title: message.substring(0, 100),
          lastMessageAt: new Date(),
        },
      });
    }

    // Get or create thread
    const thread = await getOrCreateThread(effectiveUserId, conversation.id);

    // Store user message
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        content: message,
        role: "user",
      },
    });

    // Add message to thread
    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: message,
    });

    // Run assistant
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistant.id,
    });

    // Poll for completion
    let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds timeout

    while (
      runStatus.status !== "completed" &&
      runStatus.status !== "failed" &&
      attempts < maxAttempts
    ) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      attempts++;

      // Handle function calls
      if (runStatus.status === "requires_action" && runStatus.required_action) {
        const toolCalls =
          runStatus.required_action.submit_tool_outputs.tool_calls;
        const toolOutputs = [];

        for (const toolCall of toolCalls) {
          const functionName = toolCall.function.name;
          const functionArgs = JSON.parse(toolCall.function.arguments);

          let output;

          // Check if it's a predefined function
          if (functionName in commonFunctions) {
            try {
              const result = await (commonFunctions as any)[functionName](
                functionArgs
              );
              output = JSON.stringify({ success: true, data: result });
            } catch (error: any) {
              output = JSON.stringify({
                success: false,
                error: error.message,
              });
            }
          } else if (functionName === "execute_dynamic_operation") {
            // Handle dynamic execution
            if (!isOperationSafe(functionArgs.operation)) {
              output = JSON.stringify({
                success: false,
                error: "Operation blocked for safety",
              });
            } else {
              const result = await executePrismaOperation(
                functionArgs.operation,
                functionArgs.reasoning
              );
              output = JSON.stringify(result);
            }
          } else {
            output = JSON.stringify({
              error: `Unknown function: ${functionName}`,
            });
          }

          toolOutputs.push({
            tool_call_id: toolCall.id,
            output,
          });
        }

        await openai.beta.threads.runs.submitToolOutputs(thread.id, run.id, {
          tool_outputs: toolOutputs,
        });
      }
    }

    // Get response
    const messages = await openai.beta.threads.messages.list(thread.id);
    const lastMessage = messages.data[0];

    if (lastMessage.role === "assistant") {
      const content = lastMessage.content[0];
      if (content.type === "text") {
        await prisma.message.create({
          data: {
            conversationId: conversation.id,
            content: content.text.value,
            role: "assistant",
          },
        });

        await prisma.conversation.update({
          where: { id: conversation.id },
          data: {
            lastMessageAt: new Date(),
            metadata: { threadId: thread.id },
          },
        });

        return NextResponse.json({
          response: content.text.value,
          conversationId: conversation.id,
          threadId: thread.id,
          hybrid: true,
        });
      }
    }

    return NextResponse.json({
      response: "Request processed but no response generated.",
      conversationId: conversation.id,
      threadId: thread.id,
    });
  } catch (error: any) {
    console.error("Hybrid agent error:", error);
    return NextResponse.json(
      {
        response: "An error occurred.",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const conversationId = searchParams.get("conversationId");

  if (!conversationId) {
    const conversations = await prisma.conversation.findMany({
      orderBy: { lastMessageAt: "desc" },
      take: 20,
      include: {
        messages: {
          take: 1,
          orderBy: { createdAt: "desc" },
        },
      },
    });
    return NextResponse.json({ conversations });
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  return NextResponse.json({ conversation });
}
