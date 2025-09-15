import { AgentTool, ToolResult } from "../types";
import { prisma } from "@/lib/prisma";

export const searchTool: AgentTool = {
  name: "search",
  description: "Search across projects, tasks, updates, and documents",
  parameters: {
    query: { type: "string", required: true },
    types: {
      type: "array",
      required: false,
      default: ["projects", "tasks", "updates", "documents"],
    },
    projectId: { type: "string", required: false },
    limit: { type: "number", required: false, default: 10 },
  },
  execute: async (params: any): Promise<ToolResult> => {
    try {
      const results: any = {
        projects: [],
        tasks: [],
        updates: [],
        documents: [],
      };

      const searchTypes = params.types || [
        "projects",
        "tasks",
        "updates",
        "documents",
      ];
      const searchQuery = params.query.toLowerCase();

      // Search projects
      if (searchTypes.includes("projects")) {
        results.projects = await prisma.project.findMany({
          where: {
            OR: [
              { title: { contains: searchQuery, mode: "insensitive" } },
              { description: { contains: searchQuery, mode: "insensitive" } },
            ],
          },
          take: params.limit || 10,
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            priority: true,
          },
        });
      }

      // Search tasks
      if (searchTypes.includes("tasks")) {
        const taskWhere: any = {
          OR: [
            { title: { contains: searchQuery, mode: "insensitive" } },
            { description: { contains: searchQuery, mode: "insensitive" } },
          ],
        };
        if (params.projectId) taskWhere.projectId = params.projectId;

        results.tasks = await prisma.task.findMany({
          where: taskWhere,
          take: params.limit || 10,
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            priority: true,
            project: { select: { title: true } },
          },
        });
      }

      // Search updates
      if (searchTypes.includes("updates")) {
        const updateWhere: any = {
          OR: [
            { title: { contains: searchQuery, mode: "insensitive" } },
            { content: { contains: searchQuery, mode: "insensitive" } },
          ],
        };
        if (params.projectId) updateWhere.projectId = params.projectId;

        results.updates = await prisma.update.findMany({
          where: updateWhere,
          take: params.limit || 10,
          select: {
            id: true,
            title: true,
            content: true,
            type: true,
            createdAt: true,
            project: { select: { title: true } },
          },
        });
      }

      // Search documents
      if (searchTypes.includes("documents")) {
        const docWhere: any = {
          OR: [
            { title: { contains: searchQuery, mode: "insensitive" } },
            { content: { contains: searchQuery, mode: "insensitive" } },
          ],
        };
        if (params.projectId) docWhere.projectId = params.projectId;

        results.documents = await prisma.document.findMany({
          where: docWhere,
          take: params.limit || 10,
          select: {
            id: true,
            title: true,
            source: true,
            createdAt: true,
            project: { select: { title: true } },
          },
        });
      }

      const totalResults =
        results.projects.length +
        results.tasks.length +
        results.updates.length +
        results.documents.length;

      return {
        success: true,
        data: results,
        metadata: {
          query: params.query,
          totalResults,
          breakdown: {
            projects: results.projects.length,
            tasks: results.tasks.length,
            updates: results.updates.length,
            documents: results.documents.length,
          },
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  },
};
