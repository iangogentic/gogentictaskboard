"use client";

import React from "react";
import Link from "next/link";
import { format } from "date-fns";
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
import { GlassCard } from "@/components/glass";
import { useTheme } from "@/lib/themes/provider";

interface Metrics {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  blockedProjects: number;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  todoTasks: number;
  reviewTasks: number;
  taskCompletionRate: number;
  averageTasksPerProject: number;
  totalUsers: number;
  recentTasksCompleted: number;
  oldTasksCount: number;
}

interface WeeklyUpdate {
  week: string;
  count: number;
}

interface StatusDistribution {
  status: string;
  count: number;
  color: string;
}

interface Contributor {
  user: {
    id: string;
    name: string;
    email: string;
  };
  updateCount: number;
  taskCount: number;
}

interface OldTask {
  id: string;
  title: string;
  assignee?: {
    name: string | null;
  } | null;
  project: {
    id: string;
    title: string;
  };
}

interface ProjectBranch {
  branch: string;
  _count: {
    id: number;
  };
}

interface Project {
  id: string;
  title: string;
  branch: string;
  status: string;
  pm: {
    name: string | null;
  };
  _count: {
    tasks: number;
    updates: number;
    deliverables: number;
  };
}

interface ClientWrapperProps {
  metrics: Metrics;
  weeklyUpdates: WeeklyUpdate[];
  taskStatusDistribution: StatusDistribution[];
  projectStatusDistribution: StatusDistribution[];
  topContributors: Contributor[];
  oldTasks: OldTask[];
  projectsByBranch: ProjectBranch[];
  projects: Project[];
  velocity: number;
}

export default function ClientWrapper({
  metrics,
  weeklyUpdates,
  taskStatusDistribution,
  projectStatusDistribution,
  topContributors,
  oldTasks,
  projectsByBranch,
  projects,
  velocity,
}: ClientWrapperProps) {
  const { clarity } = useTheme();

  return (
    <div className="relative">
      <div className="px-6 py-8">
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
            <GlassCard clarity={clarity} className="p-6">
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

            <GlassCard clarity={clarity} className="p-6">
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

            <GlassCard clarity={clarity} className="p-6">
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

            <GlassCard clarity={clarity} className="p-6">
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
            <GlassCard clarity={clarity} className="p-6">
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
            <GlassCard clarity={clarity} className="p-6">
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
            <GlassCard clarity={clarity} className="p-6">
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
            <GlassCard clarity={clarity} className="p-6">
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
            <GlassCard clarity={clarity} className="p-6">
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
            <GlassCard
              clarity={clarity}
              className="p-6 mb-8 border-red-500/30 bg-red-500/10"
            >
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
          <GlassCard clarity={clarity}>
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
                        {project.pm.name || "No PM"}
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
