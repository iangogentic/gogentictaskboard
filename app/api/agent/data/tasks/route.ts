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
    const { projectId, userId, status } = body;

    // Build the query
    const where: any = {};

    if (projectId) {
      where.projectId = projectId;
    }

    if (userId) {
      where.assigneeId = userId;
    }

    if (status && status !== "ALL") {
      where.status = status;
    }

    // Get tasks with related data
    const tasks = await prisma.task.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            title: true,
            portfolio: {
              select: {
                name: true,
                color: true,
              },
            },
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [
        { priority: "desc" },
        { dueDate: "asc" },
        { createdAt: "desc" },
      ],
      take: 50, // Limit results
    });

    // Format the response
    const formattedTasks = tasks.map((task) => ({
      id: task.id,
      title: task.title,
      status: task.status,
      priority: task.priority,
      project: task.project?.title || "No Project",
      projectId: task.projectId,
      portfolio: task.project?.portfolio?.name || "No Portfolio",
      assignee: task.assignee?.name || "Unassigned",
      assigneeEmail: task.assignee?.email,
      dueDate: task.dueDate,
      createdAt: task.createdAt,
      completedAt: task.completedAt,
      notes: task.notes,
    }));

    return NextResponse.json({
      tasks: formattedTasks,
      count: formattedTasks.length,
    });
  } catch (error) {
    console.error("Tasks error:", error);
    return NextResponse.json({ error: "Failed to get tasks" }, { status: 500 });
  }
}
