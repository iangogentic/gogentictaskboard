"use client";

import React from "react";
import Link from "next/link";
import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";
import {
  Clock,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  User,
  Calendar,
  TrendingUp,
  Activity,
  GitBranch,
  FileText,
  Users,
  PlayCircle,
  Target,
  Filter,
  Search,
} from "lucide-react";
import { GlassCard } from "@/components/glass";
import { useTheme } from "@/lib/themes/provider";

interface ActivityData {
  type:
    | "update"
    | "task_completed"
    | "task_started"
    | "project"
    | "time_logged";
  date: Date;
  data: any;
  iconName: string;
  color: string;
}

interface ClientWrapperProps {
  activities: ActivityData[];
  groupedActivities: Record<string, ActivityData[]>;
  todayActivities: number;
  weekCompleted: number;
  activeProjects: number;
  totalHours: number;
}

export default function ClientWrapper({
  activities,
  groupedActivities,
  todayActivities,
  weekCompleted,
  activeProjects,
  totalHours,
}: ClientWrapperProps) {
  const { clarity } = useTheme();

  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "EEEE, MMMM d");
  };

  const getActivityDescription = (activity: ActivityData) => {
    switch (activity.type) {
      case "update":
        return (
          <>
            <span className="font-medium text-white/90">
              {activity.data.author.name}
            </span>
            {" posted update in "}
            <Link
              href={`/projects/${activity.data.project.id}`}
              className="font-medium text-blue-400/80 hover:text-blue-400"
            >
              {activity.data.project.title}
            </Link>
          </>
        );
      case "task_completed":
        return (
          <>
            <span className="font-medium text-white/90">
              {activity.data.assignee?.name || "Someone"}
            </span>
            {" completed "}
            <span className="font-medium text-white/90">
              {activity.data.title}
            </span>
            {" in "}
            <Link
              href={`/projects/${activity.data.project.id}`}
              className="text-blue-400/80 hover:text-blue-400"
            >
              {activity.data.project.title}
            </Link>
          </>
        );
      case "task_started":
        return (
          <>
            <span className="font-medium text-white/90">
              {activity.data.assignee?.name || "Someone"}
            </span>
            {" started working on "}
            <span className="font-medium text-white/90">
              {activity.data.title}
            </span>
          </>
        );
      case "project":
        return (
          <>
            <Link
              href={`/projects/${activity.data.id}`}
              className="font-medium text-blue-400/80 hover:text-blue-400"
            >
              {activity.data.title}
            </Link>
            {" was updated by "}
            <span className="font-medium text-white/90">
              {activity.data.pm.name}
            </span>
          </>
        );
      case "time_logged":
        const duration = Math.round((activity.data.hours || 0) * 60);
        return (
          <>
            <span className="font-medium text-white/90">
              {activity.data.user.name}
            </span>
            {" logged "}
            <span className="font-medium text-white/90">
              {duration} minutes
            </span>
            {" on "}
            <span className="font-medium text-white/90">
              {activity.data.task?.title || "a task"}
            </span>
          </>
        );
      default:
        return "Activity";
    }
  };

  return (
    <div className="relative">
      <div className="px-6 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white/90">Activity</h1>
            <p className="text-white/60 mt-1">
              Track all team activity and project updates
            </p>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <GlassCard clarity={clarity} className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-white/50">Today's Activity</span>
                <Activity className="w-5 h-5 text-purple-400/70" />
              </div>
              <p className="text-2xl font-bold text-white/90">
                {todayActivities}
              </p>
              <p className="text-xs text-white/40">events</p>
            </GlassCard>

            <GlassCard clarity={clarity} className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-white/50">Week Completed</span>
                <CheckCircle className="w-5 h-5 text-green-400/70" />
              </div>
              <p className="text-2xl font-bold text-white/90">
                {weekCompleted}
              </p>
              <p className="text-xs text-white/40">tasks</p>
            </GlassCard>

            <GlassCard clarity={clarity} className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-white/50">Active Projects</span>
                <GitBranch className="w-5 h-5 text-indigo-400/70" />
              </div>
              <p className="text-2xl font-bold text-white/90">
                {activeProjects}
              </p>
              <p className="text-xs text-white/40">in progress</p>
            </GlassCard>

            <GlassCard clarity={clarity} className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-white/50">Hours Logged</span>
                <Clock className="w-5 h-5 text-amber-400/70" />
              </div>
              <p className="text-2xl font-bold text-white/90">
                {Math.round(totalHours)}
              </p>
              <p className="text-xs text-white/40">this week</p>
            </GlassCard>
          </div>

          {/* Filters */}
          <div className="mb-6 flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="text"
                placeholder="Search activity..."
                className={`w-full pl-10 pr-4 py-2.5 backdrop-blur-sm border rounded-xl text-white/90 placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${
                  clarity
                    ? "bg-white/20 border-white/20 focus:border-white/30"
                    : "bg-white/5 border-white/10 focus:border-white/20"
                }`}
              />
            </div>
            <button
              className={`px-4 py-2.5 backdrop-blur-sm border rounded-xl text-white/70 flex items-center gap-2 transition-all ${
                clarity
                  ? "bg-white/10 border-white/20 hover:bg-white/15"
                  : "bg-white/5 border-white/10 hover:bg-white/10"
              }`}
            >
              <Filter className="w-4 h-4" />
              Filter
            </button>
          </div>

          {/* Activity Timeline */}
          <GlassCard clarity={clarity}>
            <div className="px-6 py-4 border-b border-white/10">
              <h2 className="text-lg font-semibold flex items-center gap-2 text-white/90">
                <Clock className="w-5 h-5 text-white/50" />
                Timeline
              </h2>
            </div>

            <div className="divide-y divide-white/5">
              {Object.entries(groupedActivities)
                .slice(0, 7)
                .map(([date, dayActivities]) => (
                  <div key={date} className="p-6">
                    {/* Date Header */}
                    <div className="flex items-center mb-4">
                      <div className="flex-shrink-0 w-24">
                        <p className="text-sm font-medium text-white/80">
                          {getDateLabel(date)}
                        </p>
                        <p className="text-xs text-white/40">
                          {dayActivities.length} activities
                        </p>
                      </div>
                      <div className="flex-1 ml-4">
                        <div className="h-px bg-white/10" />
                      </div>
                    </div>

                    {/* Activities */}
                    <div className="space-y-4 ml-24">
                      {dayActivities.slice(0, 10).map((activity, idx) => {
                        const iconMap = {
                          MessageSquare,
                          CheckCircle,
                          PlayCircle,
                          GitBranch,
                          Clock,
                        };
                        const Icon =
                          iconMap[activity.iconName as keyof typeof iconMap] ||
                          Activity;
                        const bgColor =
                          {
                            blue: "bg-blue-500/20",
                            green: "bg-green-500/20",
                            purple: "bg-purple-500/20",
                            indigo: "bg-indigo-500/20",
                            amber: "bg-amber-500/20",
                          }[activity.color] || "bg-white/5";

                        const iconColor =
                          {
                            blue: "text-blue-400",
                            green: "text-green-400",
                            purple: "text-purple-400",
                            indigo: "text-indigo-400",
                            amber: "text-amber-400",
                          }[activity.color] || "text-white/50";

                        return (
                          <div
                            key={`${activity.type}-${idx}`}
                            className="flex items-start gap-3"
                          >
                            <div
                              className={`flex-shrink-0 w-8 h-8 rounded-full ${bgColor} backdrop-blur-sm flex items-center justify-center border ${activity.color ? `border-${activity.color}-500/30` : "border-white/10"}`}
                            >
                              <Icon className={`w-4 h-4 ${iconColor}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-white/70">
                                {getActivityDescription(activity)}
                              </p>
                              {activity.type === "update" &&
                                activity.data.body && (
                                  <p className="text-sm text-white/40 mt-1 line-clamp-2">
                                    {activity.data.body}
                                  </p>
                                )}
                              <p className="text-xs text-white/30 mt-1">
                                {formatDistanceToNow(activity.date, {
                                  addSuffix: true,
                                })}
                              </p>
                            </div>
                          </div>
                        );
                      })}

                      {dayActivities.length > 10 && (
                        <button className="text-sm text-blue-400/70 hover:text-blue-400 ml-11 transition-colors">
                          Show {dayActivities.length - 10} more activities
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>

            {/* Load More */}
            <div className="px-6 py-4 border-t border-white/10">
              <button className="w-full py-2 text-sm text-white/50 hover:text-white/70 font-medium transition-colors">
                Load older activities
              </button>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
