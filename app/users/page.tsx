import { prisma } from "@/lib/prisma";
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
import { GlassCard, GlassNav } from "@/components/glass";
import { AnimatedBackground } from "@/components/glass/AnimatedBackground";

export const dynamic = "force-dynamic";
export const revalidate = 60;

async function getUsers() {
  const users = await prisma.user.findMany({
    include: {
      projectsAsPM: {
        select: {
          id: true,
          title: true,
          status: true,
        },
      },
      projectsAsDev: {
        select: {
          id: true,
          title: true,
          status: true,
        },
      },
      tasks: {
        select: {
          id: true,
          title: true,
          status: true,
        },
      },
      _count: {
        select: {
          projectsAsPM: true,
          projectsAsDev: true,
          tasks: true,
          updates: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });
  return users;
}

export default async function UsersPage() {
  const users = await getUsers();

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <AnimatedBackground />
      <GlassNav />

      <div className="relative z-10 pt-20 px-6 pb-10">
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
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-medium transition-all"
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
                .filter((p) => p.status === "IN_PROGRESS")
                .forEach((p) => {
                  projectMap.set(p.id, p);
                });
              user.projectsAsDev
                .filter((p) => p.status === "IN_PROGRESS")
                .forEach((p) => {
                  projectMap.set(p.id, p);
                });
              const activeProjects = Array.from(projectMap.values());
              const activeTasks = user.tasks.filter((t) => t.status !== "DONE");

              return (
                <GlassCard
                  key={user.id}
                  className="p-6 hover:bg-white/[0.04] transition-all"
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
            <GlassCard className="text-center py-12">
              <p className="text-white/50">No users found</p>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
}
