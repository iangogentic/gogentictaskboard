"use client";

import React, { useState } from "react";
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
} from "lucide-react";
import { GlassCard, Badge, ProgressRing, ThemeMenu } from "@/components/glass";
import { useTheme } from "@/lib/themes/provider";
import {
  THEMES,
  buildConic,
  buildRadial,
  buildGrid,
} from "@/lib/themes/constants";

// Sample Data
const sampleTasks = [
  {
    id: 1,
    title: "Ship SIG Weekender draft",
    project: "SIG Marketing",
    due: "10:30 AM",
    done: false,
  },
  {
    id: 2,
    title: "Fix agent tool registry bug",
    project: "GoGentic Portal",
    due: "1:00 PM",
    done: false,
  },
  {
    id: 3,
    title: "Review Fisher AI lesson plan",
    project: "Fisher — Literacy AI",
    due: "3:15 PM",
    done: true,
  },
  {
    id: 4,
    title: "Sync with Andrew / Launchpad",
    project: "AI Labs",
    due: "4:30 PM",
    done: false,
  },
];

const sampleEvents = [
  {
    id: "e1",
    title: "Stand‑up: Fisher project",
    time: "9:00–9:30 AM",
    location: "Google Meet",
    link: "#",
  },
  {
    id: "e2",
    title: "Partner call: Z‑School",
    time: "12:00–12:45 PM",
    location: "Zoom",
    link: "#",
  },
  {
    id: "e3",
    title: "Internal: Portal UI review",
    time: "2:00–2:30 PM",
    location: "Google Meet",
    link: "#",
  },
];

const sampleUpdates = [
  {
    id: "u1",
    kind: "commit",
    title: "Slack/Drive tools added",
    detail: "Integration tests passing; need agent registration.",
    project: "Portal",
    time: "12m",
  },
  {
    id: "u2",
    kind: "pr",
    title: "Email template refactor",
    detail: "Reduced CLS in TWAS layout.",
    project: "SIG",
    time: "1h",
  },
  {
    id: "u3",
    kind: "note",
    title: "New speaker confirmed",
    detail: "NPI webinar bios finalized.",
    project: "SIG",
    time: "3h",
  },
];

export default function ModernLandingPage() {
  const [tasks, setTasks] = useState(sampleTasks);
  const { theme, clarity } = useTheme();

  const completed = tasks.filter((t) => t.done).length;
  const pct = Math.round((completed / Math.max(tasks.length, 1)) * 100);
  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  function toggleTask(id: number) {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
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
          {/* LEFT: Title */}
          <div className="flex items-center gap-3">
            <span className="font-semibold tracking-tight text-white">
              Gogentic Portal
            </span>
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
            <a
              href="/dashboard"
              className={`rounded-xl px-3 py-2 text-sm border ${
                clarity
                  ? "bg-white text-black border-white/80 hover:bg-white/90"
                  : "bg-white/10 text-white border-white/20 hover:bg-white/15"
              } transition ${focus}`}
            >
              Dashboard
            </a>
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
              {sampleUpdates.length === 0 ? (
                <div className="text-sm text-white/70">No recent activity.</div>
              ) : (
                sampleUpdates.map((u) => (
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
                  className={`w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 ${
                    clarity
                      ? "border-white/40 bg-white/20 ring-white/40 placeholder:text-white/80"
                      : "border-white/15 bg-white/10 ring-white/20 placeholder:text-white/60"
                  } ${focus}`}
                />
              </div>
              <button
                className={`rounded-xl px-3 py-2 text-sm border flex items-center gap-2 transition ${
                  clarity
                    ? "border-white/80 bg-white text-black hover:bg-white/90"
                    : "border-white/15 bg-white/10 hover:bg-white/15 text-white"
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
                  Nothing scheduled — add your first task.
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
                <h3 className="font-semibold text-white">Upcoming meetings</h3>
              </div>
              <Badge>Google Calendar</Badge>
            </div>

            <div className="mb-4">
              <button
                className={`w-full rounded-xl px-3 py-2 text-sm border flex items-center justify-center gap-2 transition ${
                  clarity
                    ? "border-white/80 bg-white text-black hover:bg-white/90"
                    : "border-white/15 bg-white/10 hover:bg-white/15 text-white"
                } ${focus}`}
              >
                <LinkIcon className="h-4 w-4" /> Connect Google Calendar
              </button>
            </div>

            <div className="space-y-3">
              {sampleEvents.length === 0 ? (
                <div className="text-sm text-white/75">
                  No meetings on the horizon.
                </div>
              ) : (
                sampleEvents.map((ev) => (
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
                    <a
                      href={ev.link}
                      className={`text-sm mt-2 inline-flex items-center gap-1 underline ${
                        clarity ? "decoration-white/80" : "decoration-white/60"
                      } hover:decoration-white ${focus}`}
                    >
                      Join <ChevronRight className="h-3 w-3" />
                    </a>
                  </div>
                ))
              )}
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
              {sampleUpdates.map((u) => (
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

      {/* FOOTER HINT */}
      <div className="max-w-7xl mx-auto px-6 pb-10 text-center text-[11px] text-white/75">
        Use the menu (top-center) → Themes to switch palettes. Built to preserve
        contrast in any theme.
      </div>
    </div>
  );
}
