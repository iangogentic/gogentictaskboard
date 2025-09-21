import { prisma } from "@/lib/prisma";
import { format, startOfWeek, subDays, subWeeks, subMonths } from "date-fns";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import ClientWrapper from "./client-wrapper";

export const dynamic = "force-dynamic";
export const revalidate = 60;

async function getReportsData() {
  const now = new Date();
  const lastWeek = subWeeks(now, 1);
  const lastMonth = subMonths(now, 1);
  const last30Days = subDays(now, 30);
  const last7Days = subDays(now, 7);

  const [
    projects,
    tasks,
    updates,
    users,
    recentTasks,
    oldTasks,
    projectsByBranch,
    userProductivity,
  ] = await Promise.all([
    // All projects with counts
    prisma.project.findMany({
      include: {
        _count: {
          select: {
            tasks: true,
            updates: true,
            deliverables: true,
          },
        },
        pm: true,
        developers: true,
      },
    }),

    // All tasks
    prisma.task.findMany({
      include: {
        assignee: true,
        project: true,
      },
    }),

    // Recent updates
    prisma.update.findMany({
      where: {
        createdAt: {
          gte: last30Days,
        },
      },
      include: {
        author: true,
        project: true,
      },
      orderBy: { createdAt: "desc" },
    }),

    // All users with counts
    prisma.user.findMany({
      include: {
        _count: {
          select: {
            projectsAsPM: true,
            projectsAsDev: true,
            tasks: true,
            updates: true,
          },
        },
      },
    }),

    // Tasks completed in last 7 days
    prisma.task.findMany({
      where: {
        status: "DONE",
        updatedAt: {
          gte: last7Days,
        },
      },
    }),

    // Tasks older than 30 days still not done
    prisma.task.findMany({
      where: {
        status: {
          not: "DONE",
        },
        createdAt: {
          lte: last30Days,
        },
      },
      include: {
        assignee: true,
        project: true,
      },
    }),

    // Projects by branch
    prisma.project.groupBy({
      by: ["branch"],
      _count: {
        id: true,
      },
    }),

    // User productivity (tasks completed per user in last 30 days)
    prisma.task.groupBy({
      by: ["assigneeId"],
      where: {
        status: "DONE",
        updatedAt: {
          gte: last30Days,
        },
      },
      _count: {
        id: true,
      },
    }),
  ]);

  // Calculate metrics
  const totalProjects = projects.length;
  const activeProjects = projects.filter(
    (p) => p.status === "IN_PROGRESS"
  ).length;
  const completedProjects = projects.filter(
    (p) => p.status === "COMPLETED"
  ).length;
  const blockedProjects = projects.filter((p) => p.status === "BLOCKED").length;

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "DONE").length;
  const inProgressTasks = tasks.filter((t) => t.status === "DOING").length;
  const todoTasks = tasks.filter((t) => t.status === "TODO").length;
  const reviewTasks = tasks.filter((t) => t.status === "REVIEW").length;

  const taskCompletionRate =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const averageTasksPerProject =
    totalProjects > 0 ? Math.round(totalTasks / totalProjects) : 0;

  // Weekly update trend
  const weeklyUpdates = [];
  for (let i = 0; i < 4; i++) {
    const weekStart = startOfWeek(subWeeks(now, i));
    const weekEnd = startOfWeek(subWeeks(now, i - 1));
    const count = updates.filter(
      (u) => u.createdAt >= weekStart && u.createdAt < weekEnd
    ).length;
    weeklyUpdates.unshift({
      week: format(weekStart, "MMM d"),
      count,
    });
  }

  // Task status distribution
  const taskStatusDistribution = [
    { status: "Todo", count: todoTasks, color: "bg-white/20" },
    { status: "Doing", count: inProgressTasks, color: "bg-blue-500/50" },
    { status: "Review", count: reviewTasks, color: "bg-yellow-500/50" },
    { status: "Done", count: completedTasks, color: "bg-green-500/50" },
  ];

  // Project status distribution
  const projectStatusDistribution = [
    {
      status: "Planning",
      count: projects.filter((p) => p.status === "PLANNING").length,
      color: "bg-white/20",
    },
    { status: "In Progress", count: activeProjects, color: "bg-blue-500/50" },
    { status: "Blocked", count: blockedProjects, color: "bg-red-500/50" },
    { status: "Completed", count: completedProjects, color: "bg-green-500/50" },
  ];

  // Top contributors (by updates in last 30 days)
  const contributorMap = new Map();
  updates.forEach((update) => {
    const current = contributorMap.get(update.author.id) || {
      user: update.author,
      updateCount: 0,
      taskCount: 0,
    };
    current.updateCount++;
    contributorMap.set(update.author.id, current);
  });

  // Add task completions to contributors
  userProductivity.forEach((prod) => {
    if (prod.assigneeId) {
      const user = users.find((u) => u.id === prod.assigneeId);
      if (user) {
        const current = contributorMap.get(user.id) || {
          user,
          updateCount: 0,
          taskCount: 0,
        };
        current.taskCount = prod._count.id;
        contributorMap.set(user.id, current);
      }
    }
  });

  const topContributors = Array.from(contributorMap.values())
    .sort((a, b) => b.updateCount + b.taskCount - (a.updateCount + a.taskCount))
    .slice(0, 5);

  return {
    metrics: {
      totalProjects,
      activeProjects,
      completedProjects,
      blockedProjects,
      totalTasks,
      completedTasks,
      inProgressTasks,
      todoTasks,
      reviewTasks,
      taskCompletionRate,
      averageTasksPerProject,
      totalUsers: users.length,
      recentTasksCompleted: recentTasks.length,
      oldTasksCount: oldTasks.length,
    },
    weeklyUpdates,
    taskStatusDistribution,
    projectStatusDistribution,
    topContributors,
    oldTasks: oldTasks.slice(0, 5),
    projectsByBranch,
    projects,
    updates: updates.slice(0, 10),
  };
}

export default async function ReportsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const {
    metrics,
    weeklyUpdates,
    taskStatusDistribution,
    projectStatusDistribution,
    topContributors,
    oldTasks,
    projectsByBranch,
    projects,
  } = await getReportsData();

  // Calculate velocity
  const velocity =
    weeklyUpdates.length > 1
      ? weeklyUpdates[weeklyUpdates.length - 1].count -
        weeklyUpdates[weeklyUpdates.length - 2].count
      : 0;

  return (
    <ClientWrapper
      metrics={metrics}
      weeklyUpdates={weeklyUpdates}
      taskStatusDistribution={taskStatusDistribution}
      projectStatusDistribution={projectStatusDistribution}
      topContributors={topContributors}
      oldTasks={oldTasks}
      projectsByBranch={projectsByBranch}
      projects={projects}
      velocity={velocity}
    />
  );
}
