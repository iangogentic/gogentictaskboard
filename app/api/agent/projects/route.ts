import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

// This runs in Node.js runtime, not Edge
export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all projects
    const projects = await prisma.project.findMany({
      include: {
        portfolio: true,
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Format the response
    const formattedProjects = projects.map((project) => ({
      id: project.id,
      title: project.title,
      portfolio: project.portfolio?.name || "No Portfolio",
      portfolioColor: project.portfolio?.color || "#gray",
      status: project.status,
      health: project.health,
      progress: project.progress,
      taskCount: project.tasks.length,
      inProgressTasks: project.tasks.filter((t) => t.status === "IN_PROGRESS")
        .length,
      completedTasks: project.tasks.filter((t) => t.status === "COMPLETED")
        .length,
      createdAt: project.createdAt,
      dueDate: project.dueDate,
    }));

    return NextResponse.json({ projects: formattedProjects });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}
