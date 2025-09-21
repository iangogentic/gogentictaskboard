"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  format,
  isToday,
  isTomorrow,
  isPast,
  addDays,
  startOfDay,
} from "date-fns";
import {
  Clock,
  Calendar,
  AlertCircle,
  CheckCircle,
  PlayCircle,
  PauseCircle,
  Timer,
  Coffee,
  Target,
  TrendingUp,
  Plus,
  ChevronRight,
  MoreHorizontal,
  Flag,
} from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-states";
import { GlassCard, GlassButton, GlassNav } from "@/components/glass";
import { AnimatedBackground } from "@/components/glass/AnimatedBackground";
import { cn } from "@/lib/utils";

interface MyWorkClientProps {
  tasks: any[];
  projects: any[];
  currentUser: any;
  timeEntries: any[];
  todayMinutes: number;
  activeTimer: any;
}

export function MyWorkClient({
  tasks,
  projects,
  currentUser,
  timeEntries,
  todayMinutes,
  activeTimer,
}: MyWorkClientProps) {
  const [activeTaskId, setActiveTaskId] = useState<string | null>(
    activeTimer?.taskId || null
  );
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [selectedBucket, setSelectedBucket] = useState<
    "today" | "upcoming" | "overdue" | "all"
  >("today");

  // Timer effect (simplified - would need backend support)
  useEffect(() => {
    if (activeTaskId) {
      const interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [activeTaskId]);

  // Categorize tasks into buckets
  const buckets = {
    today: tasks.filter((t) => {
      if (t.status === "DONE") return false;
      if (!t.dueDate) return t.status === "DOING";
      return (
        isToday(new Date(t.dueDate)) ||
        (isPast(new Date(t.dueDate)) && t.status !== "DONE")
      );
    }),
    upcoming: tasks.filter((t) => {
      if (t.status === "DONE") return false;
      if (!t.dueDate) return false;
      const due = new Date(t.dueDate);
      return !isPast(due) && !isToday(due) && due <= addDays(new Date(), 7);
    }),
    overdue: tasks.filter((t) => {
      if (t.status === "DONE") return false;
      if (!t.dueDate) return false;
      return isPast(new Date(t.dueDate)) && !isToday(new Date(t.dueDate));
    }),
    all: tasks.filter((t) => t.status !== "DONE"),
  };

  const completedToday = tasks.filter(
    (t) => t.status === "DONE" && t.updatedAt && isToday(new Date(t.updatedAt))
  );

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const formatMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const handleStartTimer = async (taskId: string) => {
    setActiveTaskId(taskId);
    // API call to start timer
    await fetch("/api/time-entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId, userId: currentUser.id }),
    });
  };

  const handleStopTimer = async () => {
    // Would need to save time entry to database
    setActiveTaskId(null);
    setTimerSeconds(0);
  };

  const handleSnooze = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      const newDate = addDays(new Date(), 1);
      await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dueDate: newDate }),
      });
      window.location.reload();
    }
  };

  const getPriorityColor = (task: any) => {
    if (task.priority === "HIGH") return "text-red-600 bg-red-50";
    if (task.priority === "MEDIUM") return "text-amber-600 bg-amber-50";
    return "text-muted bg-surface";
  };

  const TaskCard = ({ task }: { task: any }) => (
    <GlassCard
      className={cn(
        "p-4 group transition-all duration-200",
        activeTaskId === task.id && "ring-2 ring-blue-400/50 bg-blue-500/10"
      )}
      hover
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <Link
            href={`/projects/${task.projectId}`}
            className="text-sm font-medium text-white/90 hover:text-white transition-colors"
          >
            {task.title}
          </Link>
          <div className="flex items-center gap-3 mt-2">
            {task.project.portfolio && (
              <span
                className="text-xs px-2 py-0.5 rounded-full border"
                style={{
                  backgroundColor: `${task.project.portfolio.color}20`,
                  borderColor: `${task.project.portfolio.color}30`,
                  color: task.project.portfolio.color,
                }}
              >
                {task.project.portfolio.name}
              </span>
            )}
            <span className="text-xs text-white/50">{task.project.title}</span>
            {task.dueDate && (
              <span
                className={cn(
                  "text-xs flex items-center gap-1",
                  isPast(new Date(task.dueDate)) &&
                    !isToday(new Date(task.dueDate))
                    ? "text-red-400"
                    : "text-white/50"
                )}
              >
                <Calendar className="w-3 h-3" />
                {format(new Date(task.dueDate), "MMM d")}
              </span>
            )}
            {task.priority && (
              <span
                className={cn(
                  "text-xs px-2 py-0.5 rounded-full flex items-center gap-1 border",
                  task.priority === "HIGH"
                    ? "bg-red-500/20 text-red-300 border-red-500/30"
                    : task.priority === "MEDIUM"
                      ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                      : "bg-white/10 text-white/70 border-white/20"
                )}
              >
                <Flag className="w-3 h-3" />
                {task.priority}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 ml-4">
          {activeTaskId === task.id ? (
            <button
              onClick={handleStopTimer}
              className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
              title="Stop timer"
            >
              <PauseCircle className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={() => handleStartTimer(task.id)}
              className="p-2 text-white/50 hover:text-green-400 hover:bg-green-500/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
              title="Start timer"
            >
              <PlayCircle className="w-5 h-5" />
            </button>
          )}
          <div className="relative group/menu">
            <button className="p-2 text-white/50 hover:text-white/80 hover:bg-white/10 rounded-lg transition-colors">
              <MoreHorizontal className="w-5 h-5" />
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-black/40 backdrop-blur-xl rounded-lg shadow-lg border border-white/10 hidden group-hover/menu:block z-10">
              <button
                onClick={() => handleSnooze(task.id)}
                className="w-full px-4 py-2 text-left text-sm text-white/70 hover:bg-white/10 hover:text-white/90"
              >
                Snooze to tomorrow
              </button>
              <Link
                href={`/projects/${task.projectId}`}
                className="block px-4 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white/90"
              >
                View in project
              </Link>
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  );

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <AnimatedBackground />
      <GlassNav />

      <div className="relative z-10 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header with Timer */}
          <motion.div
            className="mb-8 flex items-start justify-between"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div>
              <h1 className="text-3xl font-bold text-white/90">My Work</h1>
              <p className="text-white/70 mt-1">
                Focus on what matters today, {currentUser.name}
              </p>
            </div>
            <div className="flex items-center gap-4">
              {/* Today's Time */}
              <GlassCard className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <Timer className="w-5 h-5 text-white/70" />
                  <div>
                    <p className="text-xs text-white/50">Today's time</p>
                    <p className="text-lg font-semibold text-white/90">
                      {formatMinutes(todayMinutes)}
                    </p>
                  </div>
                </div>
              </GlassCard>

              {/* Active Timer */}
              {activeTaskId && (
                <GlassCard className="px-4 py-3 bg-blue-500/10 border-blue-400/30 animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                    <div>
                      <p className="text-xs text-blue-300">Timer running</p>
                      <p className="text-lg font-mono font-semibold text-blue-200">
                        {formatTime(timerSeconds)}
                      </p>
                    </div>
                    <button
                      onClick={handleStopTimer}
                      className="ml-2 p-1 text-red-400 hover:bg-red-500/20 rounded"
                    >
                      <PauseCircle className="w-5 h-5" />
                    </button>
                  </div>
                </GlassCard>
              )}
            </div>
          </motion.div>

          {/* Portfolio Breakdown */}
          {projects.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mb-8"
            >
              <GlassCard className="p-6">
                <h2 className="text-lg font-semibold text-white/90 mb-4">
                  My Projects by Portfolio
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Array.from(
                    new Set(
                      projects.map((p) => p.portfolio?.id).filter(Boolean)
                    )
                  ).map((portfolioId) => {
                    const portfolio = projects.find(
                      (p) => p.portfolio?.id === portfolioId
                    )?.portfolio;
                    if (!portfolio) return null;
                    const portfolioProjects = projects.filter(
                      (p) => p.portfolio?.id === portfolioId
                    );
                    const portfolioTasks = tasks.filter(
                      (t) => t.project.portfolio?.id === portfolioId
                    );

                    return (
                      <div
                        key={portfolioId}
                        className="flex items-center gap-3"
                      >
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor: portfolio.color || "#6b7280",
                          }}
                        />
                        <div>
                          <p className="text-sm font-medium text-white/90">
                            {portfolio.name}
                          </p>
                          <p className="text-xs text-white/50">
                            {portfolioProjects.length} projects •{" "}
                            {portfolioTasks.length} tasks
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* Stats Bar */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            {[
              {
                label: "Today",
                value: buckets.today.length,
                icon: Target,
                color: "text-blue-400",
              },
              {
                label: "Upcoming",
                value: buckets.upcoming.length,
                icon: Calendar,
                color: "text-purple-400",
              },
              {
                label: "Overdue",
                value: buckets.overdue.length,
                icon: AlertCircle,
                color: "text-red-400",
              },
              {
                label: "Completed Today",
                value: completedToday.length,
                icon: CheckCircle,
                color: "text-green-400",
              },
              {
                label: "Projects",
                value: projects.length,
                icon: TrendingUp,
                color: "text-indigo-400",
              },
            ].map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 + index * 0.05 }}
                >
                  <GlassCard className="p-4" hover>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-white/50">{stat.label}</p>
                        <p
                          className={`text-2xl font-bold ${
                            stat.label === "Overdue" && stat.value > 0
                              ? "text-red-400"
                              : "text-white/90"
                          }`}
                        >
                          {stat.value}
                        </p>
                      </div>
                      <Icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                  </GlassCard>
                </motion.div>
              );
            })}
          </div>

          {/* Bucket Tabs */}
          <motion.div
            className="flex items-center gap-2 mb-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            {(["today", "upcoming", "overdue", "all"] as const).map(
              (bucket) => (
                <button
                  key={bucket}
                  onClick={() => setSelectedBucket(bucket)}
                  className={cn(
                    "px-4 py-2 rounded-xl font-medium transition-all backdrop-blur-xl",
                    selectedBucket === bucket
                      ? "bg-white/20 text-white border border-white/30"
                      : "bg-white/5 text-white/70 hover:bg-white/10 border border-white/10"
                  )}
                >
                  <span className="flex items-center gap-2">
                    {bucket === "today" && <Target className="w-4 h-4" />}
                    {bucket === "upcoming" && <Calendar className="w-4 h-4" />}
                    {bucket === "overdue" && (
                      <AlertCircle className="w-4 h-4" />
                    )}
                    {bucket === "all" && <Clock className="w-4 h-4" />}
                    {bucket.charAt(0).toUpperCase() + bucket.slice(1)}
                    <span
                      className={cn(
                        "px-2 py-0.5 text-xs rounded-full",
                        bucket === "overdue" && buckets[bucket].length > 0
                          ? "bg-red-500/20 text-red-300"
                          : "bg-white/10 text-white/70"
                      )}
                    >
                      {buckets[bucket].length}
                    </span>
                  </span>
                </button>
              )
            )}
          </motion.div>

          {/* Task List */}
          <div className="space-y-3">
            {buckets[selectedBucket].length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
              >
                <GlassCard className="p-12 text-center">
                  <div className="text-white/50 mb-4">
                    {selectedBucket === "today" && (
                      <Target className="w-12 h-12 mx-auto mb-4" />
                    )}
                    {selectedBucket === "upcoming" && (
                      <Calendar className="w-12 h-12 mx-auto mb-4" />
                    )}
                    {selectedBucket === "overdue" && (
                      <AlertCircle className="w-12 h-12 mx-auto mb-4" />
                    )}
                    {selectedBucket === "all" && (
                      <Clock className="w-12 h-12 mx-auto mb-4" />
                    )}
                    <h3 className="text-lg font-medium text-white/70">
                      No {selectedBucket} tasks
                    </h3>
                    <p className="text-white/50 mt-2">
                      {selectedBucket === "today"
                        ? "You're all caught up! Check upcoming tasks or take a break."
                        : selectedBucket === "overdue"
                          ? "Great! No overdue tasks."
                          : "No tasks in this category."}
                    </p>
                  </div>
                </GlassCard>
              </motion.div>
            ) : (
              buckets[selectedBucket].map((task, index) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.7 + index * 0.05 }}
                >
                  <TaskCard task={task} />
                </motion.div>
              ))
            )}
          </div>

          {/* Quick Add Task */}
          <motion.button
            className="fixed bottom-8 right-8 p-4 bg-white/20 backdrop-blur-xl border border-white/20 text-white rounded-full shadow-lg hover:bg-white/30 transition-all duration-200 hover:scale-110"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus className="w-6 h-6" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
