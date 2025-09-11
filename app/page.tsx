import { prisma } from '@/lib/prisma'
import ProjectsTable from '@/components/projects-table'
import Link from 'next/link'
import { Plus, BarChart3, Briefcase } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const [projects, users] = await Promise.all([
    prisma.project.findMany({
      include: {
        pm: true,
        developers: true,
        tasks: true,
        updates: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.findMany(),
  ])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Projects</h2>
            <p className="mt-1 text-sm text-gray-600">Manage and track all Gogentic projects</p>
          </div>
          <div className="flex space-x-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Dashboard
            </Link>
            <Link
              href="/my-work"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Briefcase className="h-4 w-4 mr-2" />
              My Work
            </Link>
          </div>
        </div>

        <ProjectsTable projects={projects} users={users} />
    </div>
  )
}
