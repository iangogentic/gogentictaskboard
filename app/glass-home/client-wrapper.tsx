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
import {
  THEMES,
  buildConic,
  buildRadial,
  buildGrid,
} from "@/lib/themes/constants";
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
  const { theme, clarity } = useTheme();
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

  // Build theme-driven background styles
  const A = THEMES[theme].a;
  const B = THEMES[theme].b;
  const conic = { backgroundImage: buildConic(A, B) };
  const radialA = { backgroundImage: buildRadial(B) };
  const radialB = { backgroundImage: buildRadial(A) };
  const gridStyle: React.CSSProperties = {
    backgroundImage: buildGrid(),
    backgroundSize: "64px 64px",
    maskImage: "radial-gradient(80% 60% at 50% 40%, black, transparent)",
    WebkitMaskImage: "radial-gradient(80% 60% at 50% 40%, black, transparent)",
  };

  return (
    <div className="relative min-h-screen text-white">
      {/* BACKGROUND (theme-driven) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-24 left-1/2 h-[52rem] w-[52rem] -translate-x-1/2 rounded-full blur-3xl"
          style={{ ...conic, opacity: clarity ? 0.18 : 0.3 }}
        />
        <div
          className="absolute -bottom-48 -left-24 h-[40rem] w-[40rem] rounded-full blur-3xl"
          style={{ ...radialA, opacity: clarity ? 0.14 : 0.25 }}
        />
        <div
          className="absolute -bottom-20 -right-20 h-[36rem] w-[36rem] rounded-full blur-3xl"
          style={{ ...radialB, opacity: clarity ? 0.14 : 0.25 }}
        />
        <div
          className="absolute inset-0"
          style={{ ...gridStyle, opacity: clarity ? 0.07 : 0.12 }}
        />
        {clarity ? <div className="absolute inset-0 bg-black/40" /> : null}
      </div>

      {/* TOP BAR */}
      <div
        className={`sticky top-0 z-20 backdrop-blur-xl ${clarity ? "bg-black/55" : "bg-black/25"} border-b border-white/15`}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 relative flex items-center justify-between">
          {/* LEFT: Title & User */}
          <div className="flex items-center gap-4">
            <span className="font-semibold tracking-tight text-white">
              GoGentic Portal
            </span>
            <Badge>{userName}</Badge>
          </div>

          {/* CENTER: Menu Toggle */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <ThemeMenu />
          </div>

          {/* RIGHT: Navigation Links */}
          <div className="flex items-center gap-4">
            <a
              href="/dashboard"
              className={`rounded-xl px-3 py-2 text-sm border border-white/25 bg-white/10 hover:bg-white/15 transition ${focus}`}
            >
              Classic UI
            </a>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className={`rounded-xl px-3 py-2 text-sm border flex items-center gap-2 ${
                clarity
                  ? "bg-white/10 text-white border-white/25 hover:bg-white/15"
                  : "bg-white/5 text-white border-white/20 hover:bg-white/10"
              } transition ${focus}`}
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* GRID */}
      <div className="relative max-w-7xl mx-auto px-6 py-8 grid grid-cols-12 gap-6">
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
            <div className="space-y-4">
              {initialData.updates.length === 0 ? (
                <div className="text-sm text-white/70">No recent activity.</div>
              ) : (
                initialData.updates.map((u) => (
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
                  className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm border ${
                    clarity
                      ? "bg-white text-black border-white/80 hover:bg-white/90"
                      : "bg-white/10 text-white border-white/20 hover:bg-white/15"
                  } transition ${focus}`}
                >
                  <Zap className="h-4 w-4" /> Focus
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
                disabled={isPending}
                className={`rounded-xl px-3 py-2 text-sm border flex items-center gap-2 transition ${
                  clarity
                    ? "border-white/80 bg-white text-black hover:bg-white/90 disabled:opacity-50"
                    : "border-white/15 bg-white/10 hover:bg-white/15 text-white disabled:opacity-50"
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

            {/* Stats Bar */}
            <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-sm">
              <span className="text-white/70">
                {initialData.stats.activeProjects} active projects
              </span>
              <a
                href="/projects"
                className="text-white/90 hover:text-white underline decoration-white/50"
              >
                View all projects →
              </a>
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
