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
        status: "Done",
        updatedAt: {
          gte: last7Days,
        },
      },
    }),

    // Tasks older than 30 days still not done
    prisma.task.findMany({
      where: {
        status: {
          not: "Done",
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
        status: "Done",
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
  const completedTasks = tasks.filter((t) => t.status === "Done").length;
  const inProgressTasks = tasks.filter((t) => t.status === "Doing").length;
  const todoTasks = tasks.filter((t) => t.status === "Todo").length;
  const reviewTasks = tasks.filter((t) => t.status === "Review").length;

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
    { status: "Todo", count: todoTasks, color: "bg-muted" },
    { status: "Doing", count: inProgressTasks, color: "bg-blue-500" },
    { status: "Review", count: reviewTasks, color: "bg-yellow-500" },
    { status: "Done", count: completedTasks, color: "bg-green-500" },
  ];

  // Project status distribution
  const projectStatusDistribution = [
    {
      status: "Planning",
      count: projects.filter((p) => p.status === "PLANNING").length,
      color: "bg-muted",
    },
    { status: "In Progress", count: activeProjects, color: "bg-blue-500" },
    { status: "Blocked", count: blockedProjects, color: "bg-red-500" },
    { status: "Completed", count: completedProjects, color: "bg-green-500" },
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
    <div className="min-h-screen bg-surface">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="flex items-center text-muted hover:text-fg"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Link>
              <div className="border-l pl-4">
                <h1 className="text-xl font-semibold">Reports & Analytics</h1>
              </div>
            </div>
            <button className="inline-flex items-center px-4 py-2 border border-border text-sm font-medium rounded-md text-fg-muted bg-white hover:bg-surface">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted">Active Projects</p>
                <p className="text-3xl font-bold">{metrics.activeProjects}</p>
                <p className="text-xs text-muted mt-1">
                  of {metrics.totalProjects} total
                </p>
              </div>
              <FolderOpen className="h-8 w-8 text-indigo-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted">Task Completion</p>
                <p className="text-3xl font-bold">
                  {metrics.taskCompletionRate}%
                </p>
                <p className="text-xs text-muted mt-1">
                  {metrics.completedTasks} of {metrics.totalTasks}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted">Weekly Velocity</p>
                <p className="text-3xl font-bold flex items-center">
                  {Math.abs(velocity)}
                  {velocity > 0 && (
                    <TrendingUp className="h-5 w-5 text-green-500 ml-2" />
                  )}
                  {velocity < 0 && (
                    <TrendingDown className="h-5 w-5 text-red-500 ml-2" />
                  )}
                </p>
                <p className="text-xs text-muted mt-1">updates vs last week</p>
              </div>
              <Activity className="h-8 w-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted">Blocked Items</p>
                <p className="text-3xl font-bold">{metrics.blockedProjects}</p>
                <p className="text-xs text-muted mt-1">
                  projects need attention
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Task Status Distribution */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">Task Distribution</h2>
            <div className="space-y-3">
              {taskStatusDistribution.map((item) => (
                <div key={item.status}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{item.status}</span>
                    <span className="text-sm text-muted">{item.count}</span>
                  </div>
                  <div className="w-full bg-border rounded-full h-2">
                    <div
                      className={`${item.color} h-2 rounded-full`}
                      style={{
                        width: `${metrics.totalTasks > 0 ? (item.count / metrics.totalTasks) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Project Status Distribution */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">Project Status</h2>
            <div className="space-y-3">
              {projectStatusDistribution.map((item) => (
                <div key={item.status}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{item.status}</span>
                    <span className="text-sm text-muted">{item.count}</span>
                  </div>
                  <div className="w-full bg-border rounded-full h-2">
                    <div
                      className={`${item.color} h-2 rounded-full`}
                      style={{
                        width: `${metrics.totalProjects > 0 ? (item.count / metrics.totalProjects) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Weekly Update Trend */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">Weekly Updates</h2>
            <div className="space-y-2">
              {weeklyUpdates.map((week, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-sm text-muted">{week.week}</span>
                  <div className="flex items-center">
                    <div className="w-24 bg-border rounded-full h-2 mr-2">
                      <div
                        className="bg-indigo-500 h-2 rounded-full"
                        style={{
                          width: `${Math.max(...weeklyUpdates.map((w) => w.count)) > 0 ? (week.count / Math.max(...weeklyUpdates.map((w) => w.count))) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium w-8 text-right">
                      {week.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Contributors */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">
              Top Contributors (30d)
            </h2>
            <div className="space-y-3">
              {topContributors.map((contributor, idx) => (
                <div
                  key={contributor.user.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <span className="text-sm font-medium mr-2">#{idx + 1}</span>
                    <span className="text-sm">{contributor.user.name}</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                    <span className="text-muted">
                      {contributor.updateCount} updates
                    </span>
                    <span className="text-muted">
                      {contributor.taskCount} tasks
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Projects by Branch */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">Projects by Branch</h2>
            <div className="space-y-3">
              {projectsByBranch.map((branch) => (
                <div
                  key={branch.branch}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm font-medium">{branch.branch}</span>
                  <span className="px-2 py-1 text-xs font-medium bg-surface rounded-full">
                    {branch._count.id}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Aging Tasks Alert */}
        {oldTasks.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-red-900 mb-2">
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
                          className="text-red-700 hover:text-red-900 font-medium"
                        >
                          {task.title}
                        </Link>
                        <span className="text-red-600 ml-2">
                          ({task.project.title})
                        </span>
                      </div>
                      <span className="text-red-600">
                        {task.assignee?.name || "Unassigned"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Project Performance Table */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">Project Performance</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-surface">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                    Project
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                    Branch
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                    PM
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                    Tasks
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                    Updates
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                    Deliverables
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-border">
                {projects.map((project) => (
                  <tr key={project.id} className="hover:bg-surface">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/projects/${project.id}`}
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-900"
                      >
                        {project.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">
                      {project.branch}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">
                      {project.pm.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          project.status === "COMPLETED"
                            ? "bg-green-100 text-green-800"
                            : project.status === "IN_PROGRESS"
                              ? "bg-blue-100 text-blue-800"
                              : project.status === "BLOCKED"
                                ? "bg-red-100 text-red-800"
                                : "bg-surface text-fg"
                        }`}
                      >
                        {project.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">
                      {project._count.tasks}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">
                      {project._count.updates}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">
                      {project._count.deliverables}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
