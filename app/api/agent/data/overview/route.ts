import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get comprehensive site overview
    const [
      projectCount,
      taskCount,
      userCount,
      portfolios,
      recentActivity,
      projectsByStatus,
      tasksByStatus,
    ] = await Promise.all([
      prisma.project.count(),
      prisma.task.count(),
      prisma.user.count(),
      prisma.portfolio.findMany({
        include: {
          _count: {
            select: { projects: true },
          },
        },
      }),
      prisma.activity.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { name: true, email: true },
          },
        },
      }),
      prisma.project.groupBy({
        by: ["status"],
        _count: true,
      }),
      prisma.task.groupBy({
        by: ["status"],
        _count: true,
      }),
    ]);

    return NextResponse.json({
      overview: {
        totalProjects: projectCount,
        totalTasks: taskCount,
        totalUsers: userCount,
        portfolios: portfolios.map((p) => ({
          id: p.id,
          name: p.name,
          color: p.color,
          projectCount: p._count.projects,
        })),
        projectsByStatus: projectsByStatus.reduce(
          (acc, curr) => {
            acc[curr.status] = curr._count;
            return acc;
          },
          {} as Record<string, number>
        ),
        tasksByStatus: tasksByStatus.reduce(
          (acc, curr) => {
            acc[curr.status] = curr._count;
            return acc;
          },
          {} as Record<string, number>
        ),
        recentActivity: recentActivity.map((a) => ({
          id: a.id,
          action: a.action,
          details: a.details,
          user: a.user?.name || "System",
          timestamp: a.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error("Overview error:", error);
    return NextResponse.json(
      { error: "Failed to get overview" },
      { status: 500 }
    );
  }
}
