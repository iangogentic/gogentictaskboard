import { prisma } from "@/lib/prisma";
import { format, subDays } from "date-fns";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import ClientWrapper from "./client-wrapper";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export default async function TeamPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Check if user is admin or PM
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (
    !currentUser ||
    (currentUser.role !== "admin" && currentUser.role !== "pm")
  ) {
    redirect("/glass-home");
  }

  const [users, projects, tasks, recentActivity, portfolios] =
    await Promise.all([
      prisma.user.findMany({
        orderBy: { name: "asc" },
      }),
      prisma.project.findMany({
        include: {
          pm: true,
          developers: true,
          portfolio: true,
        },
      }),
      prisma.task.findMany({
        include: {
          assignee: true,
          project: true,
        },
      }),
      prisma.update.findMany({
        where: {
          createdAt: {
            gte: subDays(new Date(), 30),
          },
        },
        include: {
          author: true,
        },
      }),
      prisma.portfolio.findMany({
        orderBy: { order: "asc" },
      }),
    ]);

  // Calculate team metrics
  const teamMetrics = users.map((user) => {
    const userTasks = tasks.filter((t) => t.assigneeId === user.id);
    const activeTasks = userTasks.filter((t) => t.status !== "DONE");
    const completedTasks = userTasks.filter((t) => t.status === "DONE");
    const completedThisWeek = completedTasks.filter(
      (t) => t.updatedAt > subDays(new Date(), 7)
    );
    const overdueTasks = userTasks.filter(
      (t) =>
        t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "DONE"
    );
    const managedProjects = projects.filter((p) => p.pmId === user.id);
    const developingProjects = projects.filter((p) =>
      p.developers.some((d) => d.id === user.id)
    );
    const recentUpdates = recentActivity.filter((u) => u.authorId === user.id);

    // Calculate capacity (0-100%)
    const capacity = Math.min((activeTasks.length / 10) * 100, 100);
    const capacityStatus: "normal" | "high" | "over" =
      capacity > 80 ? "over" : capacity > 60 ? "high" : "normal";

    // Calculate productivity score (mock calculation)
    const productivityScore = Math.round(
      completedThisWeek.length * 20 +
        recentUpdates.length * 5 +
        (100 - capacity) / 2
    );

    // Activity heatmap for last 30 days
    const activityMap = Array.from({ length: 30 }, (_, i) => {
      const date = subDays(new Date(), 29 - i);
      const dayActivity = recentUpdates.filter((u) => {
        const updateDate = new Date(u.createdAt);
        return updateDate.toDateString() === date.toDateString();
      }).length;
      return dayActivity;
    });

    // Portfolio assignments
    const portfolioProjects = new Map<string, number>();
    const allUserProjects = [...managedProjects, ...developingProjects];
    const uniqueProjects = Array.from(new Set(allUserProjects.map((p) => p.id)))
      .map((id) => allUserProjects.find((p) => p.id === id))
      .filter((p) => p?.portfolio);

    uniqueProjects.forEach((project) => {
      if (project?.portfolio) {
        const current = portfolioProjects.get(project.portfolio.id) || 0;
        portfolioProjects.set(project.portfolio.id, current + 1);
      }
    });

    return {
      user,
      activeTasks: activeTasks.length,
      completedTasks: completedTasks.length,
      completedThisWeek: completedThisWeek.length,
      overdueTasks: overdueTasks.length,
      managedProjects: managedProjects.length,
      developingProjects: developingProjects.length,
      capacity,
      capacityStatus,
      productivityScore,
      activityMap,
      totalUpdates: recentUpdates.length,
      portfolioProjects,
    };
  });

  // Sort by active tasks (busiest first)
  teamMetrics.sort((a, b) => b.activeTasks - a.activeTasks);

  return (
    <ClientWrapper
      users={users}
      teamMetrics={teamMetrics}
      portfolios={portfolios}
    />
  );
}
