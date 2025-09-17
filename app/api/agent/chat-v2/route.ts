import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { prisma } from "@/lib/prisma";
import {
  ragSearchTool,
  getMemoryContextTool,
} from "@/lib/agent/tools/rag-tools";
import { searchTool } from "@/lib/agent/tools/search-tools";

// Use Node.js runtime to avoid Edge Function size limits
export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Define available functions for the AI
const functions = [
  {
    name: "get_projects",
    description:
      "Get all projects in the system with their details, progress, and team information",
    parameters: {
      type: "object",
      properties: {
        status: {
          type: "string",
          description: "Filter by project status",
          enum: ["active", "completed", "on-hold", "cancelled"],
        },
        limit: {
          type: "number",
          description: "Maximum number of projects to return",
        },
      },
    },
  },
  {
    name: "get_site_overview",
    description:
      "Get a comprehensive overview of the entire site including project statistics, task metrics, portfolios, and recent activity",
    parameters: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_tasks",
    description: "Get tasks with filtering options",
    parameters: {
      type: "object",
      properties: {
        projectId: {
          type: "string",
          description: "Filter tasks by project ID",
        },
        status: {
          type: "string",
          description: "Filter by task status",
          enum: ["todo", "in-progress", "completed", "blocked"],
        },
        assigneeId: {
          type: "string",
          description: "Filter by assigned user ID",
        },
        limit: {
          type: "number",
          description: "Maximum number of tasks to return",
        },
      },
    },
  },
  {
    name: "search_content",
    description:
      "Search across all content including projects, tasks, documents, and knowledge base using both semantic search and database queries",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The search query",
        },
        projectId: {
          type: "string",
          description: "Optional project ID to scope the search",
        },
        type: {
          type: "string",
          description: "Type of search: all, rag, or database",
          enum: ["all", "rag", "database"],
        },
      },
      required: ["query"],
    },
  },
];

// Direct function implementations
async function callFunction(name: string, args: any) {
  try {
    switch (name) {
      case "get_projects": {
        const where: any = {};
        if (args.status) where.status = args.status;
        const limit = args.limit || 10;

        const projects = await prisma.project.findMany({
          where,
          take: limit,
          include: {
            pm: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            portfolio: true,
            tasks: {
              select: {
                id: true,
                title: true,
                status: true,
                estimatedHours: true,
                actualHours: true,
              },
            },
            developers: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            updates: {
              take: 5,
              orderBy: { createdAt: "desc" },
              include: {
                author: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
          orderBy: {
            lastUpdatedAt: "desc",
          },
        });

        const projectData = projects.map((project) => {
          const totalEstimated = project.tasks.reduce(
            (sum, task) => sum + (task.estimatedHours || 0),
            0
          );
          const totalActual = project.tasks.reduce(
            (sum, task) => sum + task.actualHours,
            0
          );
          const completedTasks = project.tasks.filter(
            (t) => t.status === "completed"
          ).length;
          const progress =
            project.tasks.length > 0
              ? Math.round((completedTasks / project.tasks.length) * 100)
              : 0;

          return {
            id: project.id,
            title: project.title,
            clientName: project.clientName,
            clientEmail: project.clientEmail,
            status: project.status,
            stage: project.stage,
            health: project.health,
            startDate: project.startDate,
            targetDelivery: project.targetDelivery,
            notes: project.notes,
            portfolio: project.portfolio,
            pm: project.pm,
            developers: project.developers,
            progress,
            taskStats: {
              total: project.tasks.length,
              completed: completedTasks,
              totalEstimatedHours: totalEstimated,
              totalActualHours: totalActual,
            },
            recentUpdates: project.updates.slice(0, 3),
            createdAt: project.createdAt,
            lastUpdatedAt: project.lastUpdatedAt,
          };
        });

        return JSON.stringify({
          success: true,
          data: projectData,
          count: projectData.length,
        });
      }

      case "get_site_overview": {
        const [
          totalProjects,
          activeProjects,
          totalTasks,
          completedTasks,
          totalUsers,
          totalDocuments,
          recentUpdates,
          portfolios,
        ] = await Promise.all([
          prisma.project.count(),
          prisma.project.count({
            where: { status: { not: "completed" }, archived: false },
          }),
          prisma.task.count(),
          prisma.task.count({ where: { status: "completed" } }),
          prisma.user.count(),
          prisma.document.count(),
          prisma.update.findMany({
            take: 10,
            orderBy: { createdAt: "desc" },
            include: {
              author: {
                select: { name: true, email: true },
              },
              project: {
                select: { title: true, clientName: true },
              },
            },
          }),
          prisma.portfolio.findMany({
            include: {
              _count: {
                select: { projects: true },
              },
            },
          }),
        ]);

        const overview = {
          projects: {
            total: totalProjects,
            active: activeProjects,
          },
          tasks: {
            total: totalTasks,
            completed: completedTasks,
            completionRate:
              totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
          },
          portfolios: portfolios.map((p) => ({
            id: p.id,
            name: p.name,
            key: p.key,
            projectCount: p._count.projects,
            color: p.color,
          })),
          users: {
            total: totalUsers,
          },
          documents: {
            total: totalDocuments,
          },
          recentActivity: recentUpdates.map((update) => ({
            id: update.id,
            type: "update",
            content: update.body,
            project: update.project.title,
            client: update.project.clientName,
            author: update.author.name || update.author.email,
            timestamp: update.createdAt,
          })),
        };

        return JSON.stringify({
          success: true,
          data: overview,
          timestamp: new Date().toISOString(),
        });
      }

      case "get_tasks": {
        const where: any = {};
        if (args.projectId) where.projectId = args.projectId;
        if (args.status) where.status = args.status;
        if (args.assigneeId) where.assigneeId = args.assigneeId;
        const limit = args.limit || 20;

        const tasks = await prisma.task.findMany({
          where,
          take: limit,
          include: {
            project: {
              select: {
                id: true,
                title: true,
                clientName: true,
              },
            },
            assignee: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            timeEntries: {
              select: {
                hours: true,
                date: true,
              },
            },
          },
          orderBy: [{ status: "asc" }, { dueDate: "asc" }, { order: "asc" }],
        });

        const taskData = tasks.map((task) => ({
          id: task.id,
          title: task.title,
          status: task.status,
          project: task.project,
          assignee: task.assignee,
          dueDate: task.dueDate,
          notes: task.notes,
          estimatedHours: task.estimatedHours,
          actualHours: task.actualHours,
          timeEntries: task.timeEntries,
          createdAt: task.createdAt,
          updatedAt: task.updatedAt,
        }));

        return JSON.stringify({
          success: true,
          data: taskData,
          count: taskData.length,
        });
      }

      case "search_content": {
        const { query, projectId, type = "all" } = args;

        const results: any = {
          semantic: null,
          database: null,
          memory: null,
        };

        // Perform semantic search using RAG
        if (type === "all" || type === "rag") {
          const ragResult = await ragSearchTool.execute({
            query,
            projectId,
            limit: 5,
          });

          if (ragResult.success) {
            results.semantic = ragResult.data;
          }
        }

        // Perform database search
        if (type === "all" || type === "database") {
          const dbResult = await searchTool.execute({
            query,
            projectId,
            types: ["projects", "tasks", "updates", "documents"],
            limit: 10,
          });

          if (dbResult.success) {
            results.database = dbResult.data;
          }
        }

        // Get memory context
        if (type === "all" || type === "rag") {
          const memoryResult = await getMemoryContextTool.execute({
            query,
            projectId,
          });

          if (memoryResult.success) {
            results.memory = memoryResult.data;
          }
        }

        return JSON.stringify({
          success: true,
          data: {
            query,
            projectId,
            searchType: type,
            results: {
              semantic: results.semantic?.results || [],
              database: results.database || {},
              memory: results.memory?.memory || null,
            },
          },
        });
      }

      default:
        throw new Error(`Unknown function: ${name}`);
    }
  } catch (error: any) {
    return JSON.stringify({ error: error.message });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, projectId, history = [] } = body;

    // Build messages array with system prompt
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `You are an AI assistant for a project management system. You have access to real-time data about projects, tasks, documents, and team members.
        
You can:
- Retrieve and analyze project information
- Search through project documentation and knowledge base
- Provide insights about project status and progress
- Help with task management and team coordination
- Answer questions about the system's data

Always provide helpful, accurate information based on the actual data you retrieve. When searching or retrieving information, use the available functions to get real-time data rather than making assumptions.

If asked about specific projects or tasks, always fetch the latest data first before responding.`,
      },
      ...history,
      { role: "user", content: message },
    ];

    // Initial API call with functions
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages,
      functions,
      function_call: "auto",
      temperature: 0.7,
      max_tokens: 1000,
    });

    let responseMessage = completion.choices[0].message;

    // Handle function calls
    if (responseMessage.function_call) {
      const functionName = responseMessage.function_call.name;
      const functionArgs = JSON.parse(responseMessage.function_call.arguments);

      // Call the function
      const functionResult = await callFunction(functionName, functionArgs);

      // Add function result to messages
      messages.push(responseMessage);
      messages.push({
        role: "function",
        name: functionName,
        content: functionResult,
      });

      // Get final response
      const secondCompletion = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages,
        temperature: 0.7,
        max_tokens: 1000,
      });

      responseMessage = secondCompletion.choices[0].message;
    }

    return NextResponse.json({
      response: responseMessage.content || "I couldn't generate a response.",
      functionCalled: responseMessage.function_call ? true : false,
    });
  } catch (error: any) {
    console.error("Chat error:", error);
    return NextResponse.json(
      {
        response:
          "I encountered an error while processing your request. Please try again.",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
