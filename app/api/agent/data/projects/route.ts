import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status");
    const portfolioId = searchParams.get("portfolioId");

    const where: any = {};
    if (status) where.status = status;
    if (portfolioId) where.portfolioId = portfolioId;

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

    return NextResponse.json({
      success: true,
      data: projectData,
      count: projectData.length,
    });
  } catch (error: any) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
