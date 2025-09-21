"use client";

import React, { useState, useTransition } from "react";
import { motion } from "framer-motion";
import {
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock,
  Plus,
  ChevronRight,
  Zap,
  Bell,
  Link as LinkIcon,
  LogOut,
} from "lucide-react";
import { GlassCard, Badge, ProgressRing, ThemeMenu } from "@/components/glass";

import { useTheme } from "@/lib/themes/provider";

import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

interface Task {
  id: string;
  title: string;
  project: string;
  due: string;
  done: boolean;
}

interface Update {
  id: string;
  title: string;
  detail: string;
  project: string;
  projectId: string | null;
  time: string;
  kind: "update" | "commit" | "pr" | "note";
}

interface Meeting {
  id: string;
  title: string;
  time: string;
  location: string;
  link: string;
}

interface Project {
  id: string;
  title: string;
  description: string | null;
  activeTasks: number;
  teamSize: number;
  updatedAt: Date;
}

interface ClientWrapperProps {
  initialData: {
    tasks: Task[];
    updates: Update[];
    meetings: Meeting[];
    stats: {
      totalTasks: number;
      completedTasks: number;
      activeProjects: number;
    };
    projects: Project[];
  };
  userId: string;
  userName: string;
  userEmail: string;
}

export default function ClientWrapper({
  initialData,
  userId,
  userName,
  userEmail,
}: ClientWrapperProps) {
  const [tasks, setTasks] = useState(initialData.tasks);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [isPending, startTransition] = useTransition();
  const { clarity } = useTheme();
  const router = useRouter();

  const completed = tasks.filter((t) => t.done).length;
  const pct = Math.round((completed / Math.max(tasks.length, 1)) * 100);
  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  async function toggleTask(id: string) {
    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );

    // Call API to update task
    try {
      const task = tasks.find((t) => t.id === id);
      const newStatus = !task?.done ? "COMPLETED" : "TODO";

      const response = await fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        // Revert on error
        setTasks((prev) =>
          prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
        );
      }
    } catch (error) {
      console.error("Failed to update task:", error);
      // Revert on error
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
      );
    }
  }

  async function addQuickTask() {
    if (!newTaskTitle.trim()) return;

    startTransition(async () => {
      try {
        const response = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: newTaskTitle,
            assigneeId: userId,
            dueDate: new Date().toISOString(),
            status: "TODO",
          }),
        });

        if (response.ok) {
          const newTask = await response.json();
          setTasks((prev) => [
            ...prev,
            {
              id: newTask.id,
              title: newTask.title,
              project: newTask.project?.name || "Personal",
              due: new Date().toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              }),
              done: false,
            },
          ]);
          setNewTaskTitle("");
        }
      } catch (error) {
        console.error("Failed to add task:", error);
      }
    });
  }

  // Motion tokens
  const ease: any = [0.2, 0.0, 0.2, 1];
  const tFast = { duration: 0.18, ease };
  const tMed = { duration: 0.28, ease };
  const focus =
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/80";

  return (
    <div className="glass-home-page">
      {/* GRID */}
      <div className="relative max-w-7xl mx-auto px-6 py-4 grid grid-cols-12 gap-6">
        {/* LEFT: Updates */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={tMed}
          className="hidden lg:block col-span-12 lg:col-span-3"
        >
          <GlassCard clarity={clarity} className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 opacity-95" />
                <h3 className="font-semibold text-white">Updates</h3>
              </div>
              <Badge>Live</Badge>
            </div>
            <div className="space-y-3">
              {initialData.updates.length === 0 ? (
                <div className="text-sm text-white/70">No recent activity.</div>
              ) : (
                initialData.updates.map((u) => (
                  <a
                    key={u.id}
                    href={`/projects/${u.projectId}`}
                    className={`block p-3 rounded-xl border ${
                      clarity
                        ? "border-white/15 bg-white/10"
                        : "border-white/10 bg-white/5"
                    } hover:bg-white/15 hover:border-white/20 transition-all cursor-pointer`}
                  >
                    <div className="flex items-start gap-2 mb-1">
                      <span className="mt-1.5 h-2 w-2 rounded-full bg-purple-400/80 animate-pulse" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-white/90">
                            {u.project}
                          </span>
                          <span className="text-xs text-white/50">
                            {u.time}
                          </span>
                        </div>
                        <p className="text-sm text-white/80 mt-1 line-clamp-2 leading-relaxed">
                          {u.detail}
                        </p>
                      </div>
                    </div>
                  </a>
                ))
              )}
            </div>
          </GlassCard>
        </motion.div>

        {/* CENTER: Today Tasks */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={tMed}
          className="col-span-12 lg:col-span-6"
        >
          <GlassCard clarity={clarity} className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-[22px] font-semibold tracking-tight text-white">
                  Your day
                </h2>
                <p className="text-[13px] text-white/85">{today}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative grid place-items-center">
                  <ProgressRing value={pct} />
                  <span className="absolute text-xs font-semibold text-white">
                    {pct}%
                  </span>
                </div>
                <button
                  onClick={() => router.push("/my-work")}
                  className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium border ${
                    clarity
                      ? "bg-purple-500/20 text-white border-purple-400/40 hover:bg-purple-500/30"
                      : "bg-purple-500/10 text-white border-purple-400/20 hover:bg-purple-500/20"
                  } transition-all duration-200 ${focus}`}
                >
                  <Zap className="h-4 w-4" /> Focus Mode
                </button>
              </div>
            </div>

            {/* Quick add */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex-1">
                <input
                  aria-label="Quick add task"
                  placeholder="Quick add a task and press Enter…"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addQuickTask()}
                  className={`w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 ${
                    clarity
                      ? "border-white/40 bg-white/20 ring-white/40 placeholder:text-white/80 text-white"
                      : "border-white/15 bg-white/10 ring-white/20 placeholder:text-white/60 text-white"
                  } ${focus}`}
                />
              </div>
              <button
                onClick={addQuickTask}
                disabled={isPending || !newTaskTitle.trim()}
                className={`rounded-xl px-3 py-2 text-sm font-medium border flex items-center gap-2 transition-all duration-200 ${
                  clarity
                    ? "border-blue-400/40 bg-blue-500/20 text-white hover:bg-blue-500/30 disabled:opacity-50"
                    : "border-blue-400/20 bg-blue-500/10 text-white hover:bg-blue-500/20 disabled:opacity-50"
                } ${focus}`}
              >
                <Plus className="h-4 w-4" />
                Add
              </button>
            </div>

            <div
              className={`divide-y ${clarity ? "divide-white/22" : "divide-white/12"}`}
            >
              {tasks.length === 0 ? (
                <div className="py-8 text-center text-white/75 text-sm">
                  No tasks for today — add your first task above.
                </div>
              ) : (
                tasks.map((t) => (
                  <motion.button
                    layout
                    whileTap={{ scale: 0.995 }}
                    transition={tFast}
                    key={t.id}
                    onClick={() => toggleTask(t.id)}
                    className={`w-full text-left py-3 flex items-center gap-3 ${focus}`}
                  >
                    {t.done ? (
                      <CheckCircle2 className="h-5 w-5 text-white drop-shadow-[0_0_8px_rgba(255,255,255,.35)]" />
                    ) : (
                      <Circle className="h-5 w-5 text-white/80" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div
                        className={`font-medium ${t.done ? "line-through text-white/70" : "text-white"}`}
                      >
                        {t.title}
                      </div>
                      <div className="text-xs text-white/85 mt-0.5 flex items-center gap-2">
                        <Badge>{t.project}</Badge>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {t.due}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-white/60" />
                  </motion.button>
                ))
              )}
            </div>

            {/* Your Projects Section */}
            <div className="mt-6 pt-4 border-t border-white/10">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-white">
                  Your Projects
                </h4>
                <Badge>{initialData.stats.activeProjects}</Badge>
              </div>
              <div className="space-y-2">
                {initialData.projects && initialData.projects.length > 0 ? (
                  initialData.projects.slice(0, 3).map((project) => (
                    <a
                      key={project.id}
                      href={`/projects/${project.id}`}
                      className={`block p-3 rounded-xl border transition ${
                        clarity
                          ? "border-white/20 bg-white/10 hover:bg-white/15"
                          : "border-white/10 bg-white/5 hover:bg-white/10"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-white">
                            {project.title}
                          </div>
                          <div className="text-xs text-white/70 mt-0.5">
                            {project.activeTasks} active{" "}
                            {project.activeTasks === 1 ? "task" : "tasks"} •{" "}
                            {project.teamSize}{" "}
                            {project.teamSize === 1 ? "member" : "members"}
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-white/50" />
                      </div>
                    </a>
                  ))
                ) : (
                  <div className="text-sm text-white/75">
                    No projects assigned yet.
                  </div>
                )}
              </div>
              {initialData.projects && initialData.projects.length > 3 && (
                <div className="mt-3 text-center">
                  <a
                    href="/projects"
                    className="text-sm text-white/90 hover:text-white underline decoration-white/50"
                  >
                    View all {initialData.stats.activeProjects} projects →
                  </a>
                </div>
              )}
            </div>
          </GlassCard>
        </motion.div>

        {/* RIGHT: Meetings */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={tMed}
          className="col-span-12 lg:col-span-3"
        >
          <GlassCard clarity={clarity} className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 opacity-95" />
                <h3 className="font-semibold text-white">Upcoming</h3>
              </div>
              <Badge>Tasks</Badge>
            </div>

            <div className="space-y-3">
              {initialData.meetings.length === 0 ? (
                <div className="text-sm text-white/75">
                  No upcoming meetings or tasks.
                </div>
              ) : (
                initialData.meetings.map((ev) => (
                  <div
                    key={ev.id}
                    className={`p-3 rounded-xl border ${clarity ? "border-white/28 bg-white/18" : "border-white/12 bg-white/10"}`}
                  >
                    <div className="font-medium truncate text-white">
                      {ev.title}
                    </div>
                    <div className="text-sm text-white/85">{ev.time}</div>
                    <div className="text-xs text-white/75 mt-0.5">
                      {ev.location}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-white/10">
              <a
                href="/tasks"
                className="text-sm text-white/90 hover:text-white underline decoration-white/50"
              >
                View all tasks →
              </a>
            </div>
          </GlassCard>
        </motion.div>

        {/* MOBILE: Updates below */}
        <div className="lg:hidden col-span-12">
          <GlassCard clarity={clarity} className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Bell className="h-5 w-5 opacity-95" />
              <h3 className="font-semibold text-white">Updates</h3>
            </div>
            <div className="space-y-4">
              {initialData.updates.map((u) => (
                <div key={u.id} className="flex items-start gap-3">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-white/90 shadow-[0_0_10px_rgba(255,255,255,.5)]" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-[13px]">
                      <span className="font-medium truncate text-white">
                        {u.title}
                      </span>
                      <Badge>{u.project}</Badge>
                      <span className="text-white/70">• {u.time}</span>
                    </div>
                    <p className="text-[13px] text-white/80 mt-0.5 line-clamp-2">
                      {u.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
