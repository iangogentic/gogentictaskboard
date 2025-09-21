"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Mail,
  Calendar,
  Briefcase,
  Clock,
} from "lucide-react";
import { format } from "date-fns";
import UserActions from "@/components/user-actions";
import { GlassCard, GlassTopBar } from "@/components/glass";
import { AnimatedBackground } from "@/components/glass/AnimatedBackground";
import { useTheme } from "@/lib/themes/provider";
import {
  THEMES,
  buildConic,
  buildRadial,
  buildGrid,
} from "@/lib/themes/constants";

interface Project {
  id: string;
  title: string;
  status: string;
}

interface Task {
  id: string;
  title: string;
  status: string;
}

interface User {
  id: string;
  name: string | null;
  email: string;
  createdAt: Date;
  projectsAsPM: Project[];
  projectsAsDev: Project[];
  tasks: Task[];
  _count: {
    projectsAsPM: number;
    projectsAsDev: number;
    tasks: number;
    updates: number;
  };
}

interface ClientWrapperProps {
  users: User[];
}

export default function ClientWrapper({ users }: ClientWrapperProps) {
  const { theme, clarity } = useTheme();

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
    <div className="min-h-screen relative overflow-hidden text-white">
      {/* Animated particle background */}
      <AnimatedBackground />

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

      {/* Top Navigation */}
      <GlassTopBar />

      <div className="relative z-10 pt-24 px-6 pb-10">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white/90">Team Members</h1>
              <p className="text-white/60 mt-1">
                Manage your team and their roles
              </p>
            </div>
            <Link
              href="/users/new"
              className={`inline-flex items-center px-4 py-2 rounded-xl font-medium transition-all border ${
                clarity
                  ? "bg-purple-500/20 text-white border-purple-400/40 hover:bg-purple-500/30"
                  : "bg-purple-500/10 text-white border-purple-400/20 hover:bg-purple-500/20"
              }`}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add User
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.map((user) => {
              // Get unique active projects (user might be both PM and developer on same project)
              const projectMap = new Map();
              user.projectsAsPM
                .filter((p) => p.status === "In Progress")
                .forEach((p) => {
                  projectMap.set(p.id, p);
                });
              user.projectsAsDev
                .filter((p) => p.status === "In Progress")
                .forEach((p) => {
                  projectMap.set(p.id, p);
                });
              const activeProjects = Array.from(projectMap.values());
              const activeTasks = user.tasks.filter((t) => t.status !== "Done");

              return (
                <GlassCard
                  key={user.id}
                  clarity={clarity}
                  className={`p-6 transition-all ${
                    clarity ? "hover:bg-white/[0.08]" : "hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white/90">
                        {user.name}
                      </h3>
                      <div className="flex items-center text-sm text-white/50 mt-1">
                        <Mail className="h-3 w-3 mr-1" />
                        {user.email}
                      </div>
                    </div>
                    <UserActions userId={user.id} userName={user.name || ""} />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/50">Projects (PM)</span>
                      <span className="font-medium text-white/70">
                        {user._count.projectsAsPM}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/50">Projects (Dev)</span>
                      <span className="font-medium text-white/70">
                        {user._count.projectsAsDev}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/50">Active Tasks</span>
                      <span className="font-medium text-white/70">
                        {activeTasks.length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/50">Updates</span>
                      <span className="font-medium text-white/70">
                        {user._count.updates}
                      </span>
                    </div>
                  </div>

                  {activeProjects.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <p className="text-xs text-white/40 mb-2">
                        Active Projects
                      </p>
                      <div className="space-y-1">
                        {activeProjects.slice(0, 3).map((project) => (
                          <Link
                            key={project.id}
                            href={`/projects/${project.id}`}
                            className="block text-sm text-indigo-400 hover:text-indigo-300 truncate"
                          >
                            {project.title}
                          </Link>
                        ))}
                        {activeProjects.length > 3 && (
                          <p className="text-xs text-white/40">
                            +{activeProjects.length - 3} more
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-white/40">
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      Joined {format(new Date(user.createdAt), "MMM yyyy")}
                    </div>
                  </div>
                </GlassCard>
              );
            })}
          </div>

          {users.length === 0 && (
            <GlassCard clarity={clarity} className="text-center py-12">
              <p className="text-white/50">No users found</p>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
}
