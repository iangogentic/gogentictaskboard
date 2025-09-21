"use client";

import React from "react";
import {
  Users,
  Briefcase,
  CheckCircle,
  Clock,
  TrendingUp,
  Mail,
  Shield,
  Code,
  Palette,
  AlertCircle,
} from "lucide-react";
import { GlassCard } from "@/components/glass";
import { useTheme } from "@/lib/themes/provider";
import { format, subDays } from "date-fns";

interface User {
  id: string;
  name: string | null;
  email: string;
}

interface Project {
  id: string;
  title: string;
  pmId: string | null;
  developers: User[];
  portfolio: { id: string; name: string; color: string | null } | null;
}

interface Task {
  id: string;
  title: string;
  status: string;
  dueDate: Date | null;
  updatedAt: Date;
  assigneeId: string | null;
  project: { id: string; title: string } | null;
  assignee: User | null;
}

interface Update {
  id: string;
  body: string;
  createdAt: Date;
  authorId: string;
  author: User;
}

interface Portfolio {
  id: string;
  name: string;
  color: string | null;
  order: number;
}

interface TeamMember {
  user: User;
  activeTasks: number;
  completedTasks: number;
  completedThisWeek: number;
  overdueTasks: number;
  managedProjects: number;
  developingProjects: number;
  capacity: number;
  capacityStatus: "normal" | "high" | "over";
  productivityScore: number;
  activityMap: number[];
  totalUpdates: number;
  portfolioProjects: Map<string, number>;
}

interface ClientWrapperProps {
  users: User[];
  teamMetrics: TeamMember[];
  portfolios: Portfolio[];
}

export default function ClientWrapper({
  users,
  teamMetrics,
  portfolios,
}: ClientWrapperProps) {
  const { clarity } = useTheme();

  // Role icons mapping
  const getRoleIcon = (email: string) => {
    if (email.includes("ian"))
      return <Shield className="w-4 h-4 text-white/60" />;
    if (email.includes("arjun") || email.includes("luke"))
      return <Code className="w-4 h-4 text-white/60" />;
    if (email.includes("mia"))
      return <Palette className="w-4 h-4 text-white/60" />;
    return <Users className="w-4 h-4 text-white/60" />;
  };

  const getRoleLabel = (email: string) => {
    if (email.includes("ian")) return "PM / Lead";
    if (email.includes("arjun") || email.includes("luke")) return "Developer";
    if (email.includes("mia")) return "Designer";
    return "Team Member";
  };

  return (
    <div className="relative">
      <div className="px-6 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white/90">Team</h1>
            <p className="text-white/60 mt-1">
              Team capacity, workload, and performance
            </p>
          </div>

          {/* Team Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <GlassCard clarity={clarity} className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-white/50">Team Size</span>
                <Users className="w-5 h-5 text-blue-400/70" />
              </div>
              <p className="text-2xl font-bold text-white/90">{users.length}</p>
              <p className="text-xs text-white/40">members</p>
            </GlassCard>

            <GlassCard clarity={clarity} className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-white/50">Active Tasks</span>
                <Clock className="w-5 h-5 text-amber-400/70" />
              </div>
              <p className="text-2xl font-bold text-white/90">
                {teamMetrics.reduce((sum, m) => sum + m.activeTasks, 0)}
              </p>
              <p className="text-xs text-white/40">across team</p>
            </GlassCard>

            <GlassCard clarity={clarity} className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-white/50">Weekly Completed</span>
                <CheckCircle className="w-5 h-5 text-green-400/70" />
              </div>
              <p className="text-2xl font-bold text-white/90">
                {teamMetrics.reduce((sum, m) => sum + m.completedThisWeek, 0)}
              </p>
              <p className="text-xs text-white/40">tasks</p>
            </GlassCard>

            <GlassCard clarity={clarity} className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-white/50">Overdue</span>
                <AlertCircle className="w-5 h-5 text-red-400/70" />
              </div>
              <p className="text-2xl font-bold text-red-400/90">
                {teamMetrics.reduce((sum, m) => sum + m.overdueTasks, 0)}
              </p>
              <p className="text-xs text-white/40">needs attention</p>
            </GlassCard>
          </div>

          {/* Team Members Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {teamMetrics.map((member) => (
              <GlassCard key={member.user.id} clarity={clarity} className="p-6">
                {/* Member Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400/80 to-indigo-600/80 flex items-center justify-center text-white font-bold backdrop-blur-sm">
                      {member.user.name?.charAt(0) || "?"}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white/90">
                        {member.user.name || "Unknown"}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="flex items-center gap-1 text-sm text-white/60">
                          {getRoleIcon(member.user.email)}
                          {getRoleLabel(member.user.email)}
                        </span>
                        <span className="text-white/30">•</span>
                        <a
                          href={`mailto:${member.user.email}`}
                          className="text-sm text-white/60 hover:text-blue-400/80 transition-colors"
                        >
                          {member.user.email}
                        </a>
                      </div>
                    </div>
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${
                      member.capacityStatus === "over"
                        ? "bg-red-500/20 text-red-400 border border-red-500/30"
                        : member.capacityStatus === "high"
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          : "bg-green-500/20 text-green-400 border border-green-500/30"
                    }`}
                  >
                    {member.capacity}% capacity
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-white/40 mb-1">Active</p>
                    <p className="text-xl font-bold text-white/90">
                      {member.activeTasks}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-white/40 mb-1">This Week</p>
                    <p className="text-xl font-bold text-green-400/90">
                      {member.completedThisWeek}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-white/40 mb-1">Overdue</p>
                    <p className="text-xl font-bold text-red-400/90">
                      {member.overdueTasks}
                    </p>
                  </div>
                </div>

                {/* Capacity Bar */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-white/40">Workload</span>
                    <span className="text-xs text-white/40">
                      {member.activeTasks} tasks
                    </span>
                  </div>
                  <div className="w-full bg-white/5 backdrop-blur-sm rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        member.capacityStatus === "over"
                          ? "bg-gradient-to-r from-red-500/80 to-red-400/80"
                          : member.capacityStatus === "high"
                            ? "bg-gradient-to-r from-amber-500/80 to-amber-400/80"
                            : "bg-gradient-to-r from-green-500/80 to-green-400/80"
                      }`}
                      style={{ width: `${member.capacity}%` }}
                    />
                  </div>
                </div>

                {/* Activity Heatmap */}
                <div>
                  <p className="text-xs text-white/40 mb-2">30-day activity</p>
                  <div className="flex gap-1">
                    {member.activityMap.map((activity, i) => (
                      <div
                        key={i}
                        className={`w-2 h-8 rounded-sm backdrop-blur-sm ${
                          activity === 0
                            ? "bg-white/5"
                            : activity === 1
                              ? "bg-green-400/30"
                              : activity === 2
                                ? "bg-green-400/50"
                                : activity >= 3
                                  ? "bg-green-400/70"
                                  : "bg-white/5"
                        }`}
                        title={`${format(subDays(new Date(), 29 - i), "MMM d")}: ${activity} updates`}
                      />
                    ))}
                  </div>
                </div>

                {/* Portfolio Distribution */}
                {member.portfolioProjects.size > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <p className="text-xs text-white/40 mb-2">
                      Portfolio Focus
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      {Array.from(member.portfolioProjects.entries()).map(
                        ([portfolioId, count]) => {
                          const portfolio = portfolios.find(
                            (p) => p.id === portfolioId
                          );
                          if (!portfolio) return null;
                          return (
                            <span
                              key={portfolioId}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs backdrop-blur-sm"
                              style={{
                                backgroundColor: portfolio.color
                                  ? `${portfolio.color}30`
                                  : "rgba(255,255,255,0.1)",
                                color:
                                  portfolio.color || "rgba(255,255,255,0.7)",
                                borderColor: portfolio.color
                                  ? `${portfolio.color}50`
                                  : "rgba(255,255,255,0.2)",
                                borderWidth: "1px",
                                borderStyle: "solid",
                              }}
                            >
                              {portfolio.name}
                              <span className="font-medium">{count}</span>
                            </span>
                          );
                        }
                      )}
                    </div>
                  </div>
                )}

                {/* Projects */}
                <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    {member.managedProjects > 0 && (
                      <span className="text-white/50">
                        <span className="font-medium text-white/70">
                          {member.managedProjects}
                        </span>{" "}
                        PM
                      </span>
                    )}
                    {member.developingProjects > 0 && (
                      <span className="text-white/50">
                        <span className="font-medium text-white/70">
                          {member.developingProjects}
                        </span>{" "}
                        Dev
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-4 h-4 text-white/40" />
                    <span className="text-white/50">
                      Score:{" "}
                      <span className="font-medium text-white/70">
                        {member.productivityScore}
                      </span>
                    </span>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>

          {/* Capacity Recommendations */}
          {teamMetrics.filter((m) => m.capacityStatus === "over").length >
            0 && (
            <GlassCard
              clarity={clarity}
              className="mt-8 p-6 border-amber-500/30 bg-amber-500/10"
            >
              <h3 className="text-lg font-semibold text-amber-400/90 mb-3">
                Capacity Alerts
              </h3>
              <div className="space-y-2">
                {teamMetrics
                  .filter((m) => m.capacityStatus === "over")
                  .map((member) => (
                    <p
                      key={member.user.id}
                      className="text-sm text-amber-400/70"
                    >
                      <span className="font-medium text-amber-400/90">
                        {member.user.name}
                      </span>{" "}
                      is over capacity with {member.activeTasks} active tasks.
                      Consider reassigning or delaying non-critical work.
                    </p>
                  ))}
              </div>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
}
