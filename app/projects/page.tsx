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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense fallback={<div>Loading projects...</div>}>
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