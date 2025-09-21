import { prisma } from "@/lib/db";
import { ProjectsClientWrapper } from "./client-wrapper";

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
    <ProjectsClientWrapper
      projects={projects}
      users={users}
      portfolios={portfolios}
    />
  );
}
