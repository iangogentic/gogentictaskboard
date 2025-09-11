import { prisma } from '@/lib/db'
import { ProjectsList } from '@/components/projects/projects-list'
import { Suspense } from 'react'

export const revalidate = 60

export default async function ProjectsPage() {
  const [projects, users, portfolios] = await Promise.all([
    prisma.project.findMany({
      include: {
        pm: true,
        developers: true,
        portfolio: true,
        tasks: true,
        updates: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { lastUpdatedAt: 'desc' },
    }),
    prisma.user.findMany(),
    prisma.portfolio.findMany({
      orderBy: { order: 'asc' }
    })
  ])

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Suspense fallback={
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
            <span className="ml-3 text-muted">Loading projects...</span>
          </div>
        }>
          <ProjectsList 
            projects={projects} 
            users={users}
            portfolios={portfolios}
          />
        </Suspense>
      </div>
    </div>
  )
}