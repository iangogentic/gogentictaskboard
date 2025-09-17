import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    // Get counts and statistics
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

    // Get project stage distribution
    const projectsByStage = await prisma.project.groupBy({
      by: ["stage"],
      where: { archived: false },
      _count: true,
    });

    // Get project health distribution
    const projectsByHealth = await prisma.project.groupBy({
      by: ["health"],
      where: { archived: false },
      _count: true,
    });

    // Get task statistics by status
    const tasksByStatus = await prisma.task.groupBy({
      by: ["status"],
      _count: true,
    });

    // Get time tracking stats
    const timeEntries = await prisma.timeEntry.aggregate({
      _sum: {
        hours: true,
      },
      _count: true,
    });

    const overview = {
      projects: {
        total: totalProjects,
        active: activeProjects,
        byStage: projectsByStage.map((s) => ({
          stage: s.stage,
          count: s._count,
        })),
        byHealth: projectsByHealth.map((h) => ({
          health: h.health || "unknown",
          count: h._count,
        })),
      },
      tasks: {
        total: totalTasks,
        completed: completedTasks,
        completionRate:
          totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
        byStatus: tasksByStatus.map((t) => ({
          status: t.status,
          count: t._count,
        })),
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
      timeTracking: {
        totalHours: timeEntries._sum.hours || 0,
        totalEntries: timeEntries._count,
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

    return NextResponse.json({
      success: true,
      data: overview,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error fetching overview:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
