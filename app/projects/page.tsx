import { prisma } from "@/lib/db";
import { ProjectsList } from "@/components/projects/projects-list";
import { Suspense } from "react";
import { GlassNav } from "@/components/glass";
import { AnimatedBackground } from "@/components/glass/AnimatedBackground";
import { LoadingFallback } from "@/components/ui/loading-fallback";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export default async function ProjectsPage() {
  const [projects, users, portfolios] = await Promise.all([
    prisma.project.findMany({
      include: {
        pm: true,
        developers: true,
        portfolio: true,
        tasks: true,
        updates: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { lastUpdatedAt: "desc" },
    }),
    prisma.user.findMany(),
    prisma.portfolio.findMany({
      orderBy: { order: "asc" },
    }),
  ]);

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <AnimatedBackground />
      <GlassNav />

      <div className="relative z-10 pt-20">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Suspense
            fallback={<LoadingFallback message="Loading projects..." />}
          >
            <ProjectsList
              projects={projects}
              users={users}
              portfolios={portfolios}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
