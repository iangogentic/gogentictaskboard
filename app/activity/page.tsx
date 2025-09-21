import { prisma } from "@/lib/prisma";
import { format, subDays, isToday } from "date-fns";
import {
  Clock,
  MessageSquare,
  CheckCircle,
  GitBranch,
  PlayCircle,
} from "lucide-react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import ClientWrapper from "./client-wrapper";

export const dynamic = "force-dynamic";
export const revalidate = 60;

async function getRecentActivity(userId: string, userRole: string | null) {
  // If admin, show everything. Otherwise, filter by user's projects
  const isAdmin = userRole === "admin";

  // Get user's projects (where they're PM or member)
  const userProjects = isAdmin
    ? []
    : await prisma.project.findMany({
        where: {
          OR: [
            { pmId: userId },
            {
              developers: {
                some: {
                  id: userId,
                },
              },
            },
          ],
        },
        select: { id: true },
      });

  const projectIds = userProjects.map((p) => p.id);
  const projectFilter = isAdmin ? {} : { projectId: { in: projectIds } };

  const [updates, tasks, projects, timeEntries] = await Promise.all([
    // Get recent updates
    prisma.update.findMany({
      where: projectFilter,
      include: {
        author: true,
        project: {
          include: {
            pm: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),

    // Get recently changed tasks
    prisma.task.findMany({
      where: {
        ...projectFilter,
        updatedAt: {
          gte: subDays(new Date(), 7),
        },
      },
      include: {
        assignee: true,
        project: true,
      },
      orderBy: { updatedAt: "desc" },
      take: 50,
    }),

    // Get recently updated projects
    prisma.project.findMany({
      where: isAdmin
        ? {
            lastUpdatedAt: {
              gte: subDays(new Date(), 7),
            },
          }
        : {
            id: { in: projectIds },
            lastUpdatedAt: {
              gte: subDays(new Date(), 7),
            },
          },
      include: {
        pm: true,
        developers: true,
        _count: {
          select: {
            tasks: true,
            updates: true,
          },
        },
      },
      orderBy: { lastUpdatedAt: "desc" },
      take: 20,
    }),

    // Get time tracking entries
    prisma.timeEntry.findMany({
      where: isAdmin
        ? {
            date: {
              gte: subDays(new Date(), 7),
            },
          }
        : {
            OR: [
              { userId: userId },
              {
                task: {
                  projectId: { in: projectIds },
                },
              },
            ],
            date: {
              gte: subDays(new Date(), 7),
            },
          },
      include: {
        user: true,
        task: {
          include: {
            project: true,
          },
        },
      },
      orderBy: { date: "desc" },
      take: 30,
    }),
  ]);

  // Combine and sort all activities by date
  const activities = [
    ...updates.map((update) => ({
      type: "update" as const,
      date: update.createdAt,
      data: update,
      iconName: "MessageSquare",
      color: "blue",
    })),
    ...tasks
      .filter((t) => t.status === "DONE")
      .map((task) => ({
        type: "task_completed" as const,
        date: task.updatedAt,
        data: task,
        iconName: "CheckCircle",
        color: "green",
      })),
    ...tasks
      .filter((t) => t.status === "DOING")
      .map((task) => ({
        type: "task_started" as const,
        date: task.updatedAt,
        data: task,
        iconName: "PlayCircle",
        color: "purple",
      })),
    ...projects.map((project) => ({
      type: "project" as const,
      date: project.lastUpdatedAt,
      data: project,
      iconName: "GitBranch",
      color: "indigo",
    })),
    ...timeEntries.map((entry) => ({
      type: "time_logged" as const,
      date: entry.date,
      data: entry,
      iconName: "Clock",
      color: "amber",
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  return { activities, updates, tasks, projects, timeEntries };
}

export default async function ActivityPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Get user's role
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  const { activities, updates, tasks, projects, timeEntries } =
    await getRecentActivity(session.user.id, currentUser?.role || null);

  // Group activities by date
  const groupedActivities = activities.reduce(
    (acc, activity) => {
      const dateKey = format(activity.date, "yyyy-MM-dd");
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(activity);
      return acc;
    },
    {} as Record<string, typeof activities>
  );

  // Calculate stats
  const todayActivities = activities.filter((a) => isToday(a.date)).length;
  const weekCompleted = tasks.filter((t) => t.status === "DONE").length;
  const activeProjects = projects.filter(
    (p) => p.status === "IN_PROGRESS"
  ).length;
  const totalHours = timeEntries.reduce((sum, e) => {
    return sum + (e.hours || 0);
  }, 0);

  return (
    <ClientWrapper
      activities={activities}
      groupedActivities={groupedActivities}
      todayActivities={todayActivities}
      weekCompleted={weekCompleted}
      activeProjects={activeProjects}
      totalHours={totalHours}
    />
  );
}
