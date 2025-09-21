import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import GlassProjectDetail from "@/components/glass-project-detail";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [project, users] = await Promise.all([
    prisma.project.findUnique({
      where: { id },
      include: {
        pm: true,
        developers: true,
        tasks: {
          include: { assignee: true },
          orderBy: { order: "asc" },
        },
        updates: {
          include: { author: true },
          orderBy: { createdAt: "desc" },
        },
        deliverables: {
          orderBy: { updatedAt: "desc" },
        },
      },
    }),
    prisma.user.findMany(),
  ]);

  if (!project) {
    notFound();
  }

  return <GlassProjectDetail project={project} users={users} />;
}
