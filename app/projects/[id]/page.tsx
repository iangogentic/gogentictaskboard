import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import ProjectDetail from '@/components/project-detail'

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [project, users] = await Promise.all([
    prisma.project.findUnique({
      where: { id },
      include: {
        pm: true,
        developers: true,
        tasks: {
          include: { assignee: true },
          orderBy: { order: 'asc' },
        },
        updates: {
          include: { author: true },
          orderBy: { createdAt: 'desc' },
        },
        deliverables: {
          orderBy: { updatedAt: 'desc' },
        },
      },
    }),
    prisma.user.findMany(),
  ])

  if (!project) {
    notFound()
  }

  return <ProjectDetail project={project} users={users} />
}