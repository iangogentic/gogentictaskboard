import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  format,
  startOfWeek,
  startOfMonth,
  subDays,
  subWeeks,
  subMonths,
} from "date-fns";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Users,
  FolderOpen,
  CheckCircle,
  Clock,
  AlertCircle,
  Activity,
  BarChart3,
  PieChart,
  Calendar,
  Download,
  Filter,
} from "lucide-react";
import { GlassCard, GlassNav } from "@/components/glass";
import { AnimatedBackground } from "@/components/glass/AnimatedBackground";

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
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <AnimatedBackground />
      <GlassNav />

      <div className="relative z-10 pt-20 px-6 pb-10">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white/90">
              Reports & Analytics
            </h1>
            <p className="text-white/60 mt-1">
              Comprehensive insights and performance metrics
            </p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <GlassCard className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/50">Active Projects</p>
                  <p className="text-3xl font-bold text-white/90">
                    {metrics.activeProjects}
                  </p>
                  <p className="text-xs text-white/40 mt-1">
                    of {metrics.totalProjects} total
                  </p>
                </div>
                <FolderOpen className="h-8 w-8 text-indigo-400/70" />
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/50">Task Completion</p>
                  <p className="text-3xl font-bold text-white/90">
                    {metrics.taskCompletionRate}%
                  </p>
                  <p className="text-xs text-white/40 mt-1">
                    {metrics.completedTasks} of {metrics.totalTasks}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-400/70" />
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/50">Weekly Velocity</p>
                  <p className="text-3xl font-bold text-white/90 flex items-center">
                    {Math.abs(velocity)}
                    {velocity > 0 && (
                      <TrendingUp className="h-5 w-5 text-green-400/70 ml-2" />
                    )}
                    {velocity < 0 && (
                      <TrendingDown className="h-5 w-5 text-red-400/70 ml-2" />
                    )}
                  </p>
                  <p className="text-xs text-white/40 mt-1">
                    updates vs last week
                  </p>
                </div>
                <Activity className="h-8 w-8 text-purple-400/70" />
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/50">Blocked Items</p>
                  <p className="text-3xl font-bold text-red-400/90">
                    {metrics.blockedProjects}
                  </p>
                  <p className="text-xs text-white/40 mt-1">
                    projects need attention
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-400/70" />
              </div>
            </GlassCard>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Task Status Distribution */}
            <GlassCard className="p-6">
              <h2 className="text-lg font-semibold mb-4 text-white/90">
                Task Distribution
              </h2>
              <div className="space-y-3">
                {taskStatusDistribution.map((item) => (
                  <div key={item.status}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-white/70">
                        {item.status}
                      </span>
                      <span className="text-sm text-white/50">
                        {item.count}
                      </span>
                    </div>
                    <div className="w-full bg-white/10 backdrop-blur-sm rounded-full h-2">
                      <div
                        className={`${item.color} h-2 rounded-full backdrop-blur-sm`}
                        style={{
                          width: `${metrics.totalTasks > 0 ? (item.count / metrics.totalTasks) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Project Status Distribution */}
            <GlassCard className="p-6">
              <h2 className="text-lg font-semibold mb-4 text-white/90">
                Project Status
              </h2>
              <div className="space-y-3">
                {projectStatusDistribution.map((item) => (
                  <div key={item.status}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-white/70">
                        {item.status}
                      </span>
                      <span className="text-sm text-white/50">
                        {item.count}
                      </span>
                    </div>
                    <div className="w-full bg-white/10 backdrop-blur-sm rounded-full h-2">
                      <div
                        className={`${item.color} h-2 rounded-full backdrop-blur-sm`}
                        style={{
                          width: `${metrics.totalProjects > 0 ? (item.count / metrics.totalProjects) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Weekly Update Trend */}
            <GlassCard className="p-6">
              <h2 className="text-lg font-semibold mb-4 text-white/90">
                Weekly Updates
              </h2>
              <div className="space-y-2">
                {weeklyUpdates.map((week, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-sm text-white/50">{week.week}</span>
                    <div className="flex items-center">
                      <div className="w-24 bg-white/10 backdrop-blur-sm rounded-full h-2 mr-2">
                        <div
                          className="bg-indigo-500/60 h-2 rounded-full backdrop-blur-sm"
                          style={{
                            width: `${Math.max(...weeklyUpdates.map((w) => w.count)) > 0 ? (week.count / Math.max(...weeklyUpdates.map((w) => w.count))) * 100 : 0}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium text-white/70 w-8 text-right">
                        {week.count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Top Contributors */}
            <GlassCard className="p-6">
              <h2 className="text-lg font-semibold mb-4 text-white/90">
                Top Contributors (30d)
              </h2>
              <div className="space-y-3">
                {topContributors.map((contributor, idx) => (
                  <div
                    key={contributor.user.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      <span className="text-sm font-medium mr-2 text-white/50">
                        #{idx + 1}
                      </span>
                      <span className="text-sm text-white/70">
                        {contributor.user.name}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3 text-sm">
                      <span className="text-white/40">
                        {contributor.updateCount} updates
                      </span>
                      <span className="text-white/40">
                        {contributor.taskCount} tasks
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Projects by Branch */}
            <GlassCard className="p-6">
              <h2 className="text-lg font-semibold mb-4 text-white/90">
                Projects by Branch
              </h2>
              <div className="space-y-3">
                {projectsByBranch.map((branch) => (
                  <div
                    key={branch.branch}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm font-medium text-white/70">
                      {branch.branch}
                    </span>
                    <span className="px-2 py-1 text-xs font-medium bg-white/10 backdrop-blur-sm rounded-full text-white/60">
                      {branch._count.id}
                    </span>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>

          {/* Aging Tasks Alert */}
          {oldTasks.length > 0 && (
            <GlassCard className="p-6 mb-8 border-red-500/30 bg-red-500/10">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-3" />
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-red-400 mb-2">
                    Aging Tasks ({metrics.oldTasksCount} tasks over 30 days old)
                  </h3>
                  <div className="space-y-2">
                    {oldTasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <div>
                          <Link
                            href={`/projects/${task.project.id}`}
                            className="text-red-300 hover:text-red-200 font-medium"
                          >
                            {task.title}
                          </Link>
                          <span className="text-red-400/70 ml-2">
                            ({task.project.title})
                          </span>
                        </div>
                        <span className="text-red-400/70">
                          {task.assignee?.name || "Unassigned"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </GlassCard>
          )}

          {/* Project Performance Table */}
          <GlassCard>
            <div className="px-6 py-4 border-b border-white/10">
              <h2 className="text-lg font-semibold text-white/90">
                Project Performance
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/10">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/50 uppercase tracking-wider">
                      Project
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/50 uppercase tracking-wider">
                      Branch
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/50 uppercase tracking-wider">
                      PM
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/50 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/50 uppercase tracking-wider">
                      Tasks
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/50 uppercase tracking-wider">
                      Updates
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/50 uppercase tracking-wider">
                      Deliverables
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {projects.map((project) => (
                    <tr
                      key={project.id}
                      className="hover:bg-white/5 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          href={`/projects/${project.id}`}
                          className="text-sm font-medium text-indigo-400 hover:text-indigo-300"
                        >
                          {project.title}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white/50">
                        {project.branch}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white/50">
                        {project.pm.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full backdrop-blur-sm ${
                            project.status === "COMPLETED"
                              ? "bg-green-500/20 text-green-400 border border-green-500/30"
                              : project.status === "IN_PROGRESS"
                                ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                : project.status === "BLOCKED"
                                  ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                  : "bg-white/10 text-white/60 border border-white/20"
                          }`}
                        >
                          {project.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white/50">
                        {project._count.tasks}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white/50">
                        {project._count.updates}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white/50">
                        {project._count.deliverables}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
