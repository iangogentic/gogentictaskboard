import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { status, portfolio } = body;

    // Build the query
    const where: any = {};

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (portfolio) {
      where.portfolio = {
        name: {
          contains: portfolio,
          mode: "insensitive",
        },
      };
    }

    // Get projects with related data
    const projects = await prisma.project.findMany({
      where,
      include: {
        portfolio: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            assignee: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        ProjectMember: {
          include: {
            User: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
        updates: {
          orderBy: {
            createdAt: "desc",
          },
          take: 3,
          select: {
            id: true,
            title: true,
            content: true,
            status: true,
            createdAt: true,
            author: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    // Format the response with comprehensive details
    const formattedProjects = projects.map((project) => {
      const taskStats = {
        total: project.tasks.length,
        todo: project.tasks.filter((t) => t.status === "TODO").length,
        inProgress: project.tasks.filter((t) => t.status === "IN_PROGRESS")
          .length,
        completed: project.tasks.filter((t) => t.status === "COMPLETED").length,
        highPriority: project.tasks.filter((t) => t.priority === "HIGH").length,
      };

      return {
        id: project.id,
        title: project.title,
        description: project.description,
        status: project.status,
        health: project.health,
        progress: project.progress,
        portfolio: {
          id: project.portfolio?.id,
          name: project.portfolio?.name || "No Portfolio",
          color: project.portfolio?.color || "#gray",
        },
        taskStats,
        teamMembers: project.ProjectMember.map((pm) => ({
          id: pm.User.id,
          name: pm.User.name,
          email: pm.User.email,
          role: pm.role,
        })),
        recentUpdates: project.updates.map((u) => ({
          id: u.id,
          title: u.title,
          content: u.content,
          status: u.status,
          author: u.author?.name || "System",
          createdAt: u.createdAt,
        })),
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        startDate: project.startDate,
        dueDate: project.dueDate,
      };
    });

    return NextResponse.json({
      projects: formattedProjects,
      count: formattedProjects.length,
    });
  } catch (error) {
    console.error("Projects error:", error);
    return NextResponse.json(
      { error: "Failed to get projects" },
      { status: 500 }
    );
  }
}
