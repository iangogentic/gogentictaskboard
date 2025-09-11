import { prisma } from '@/lib/prisma'
import { ProjectsList } from '@/components/projects/projects-list'
import { KPIGrid, KPITile } from '@/components/ui/kpi-tile'
import { AlertCircle, TrendingUp, Clock, Users } from 'lucide-react'
import { Suspense } from 'react'

export const revalidate = 60

export default async function HomePage() {
  const [projects, users, stats] = await Promise.all([
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
      orderBy: { lastUpdatedAt: 'desc' },
    }),
    prisma.user.findMany(),
    // Get stats for KPI tiles
    Promise.all([
      prisma.project.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.project.count({ where: { status: 'BLOCKED' } }),
      prisma.task.count({ where: { status: 'TODO' } }),
      prisma.project.count({ 
        where: { 
          targetDelivery: {
            gte: new Date(),
            lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),
    ]).then(([inProgress, blocked, todoTasks, dueSoon]) => ({
      inProgress,
      blocked,
      todoTasks,
      dueSoon,
    })),
  ])

  // Calculate deltas (mock data for now - would compare to last week in production)
  const blockedDelta = stats.blocked > 2 ? { 
    value: stats.blocked - 2, 
    type: 'increase' as const,
    label: 'vs last week'
  } : undefined;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* KPI Tiles */}
        <KPIGrid className="mb-8">
          <KPITile
            title="In Progress"
            value={stats.inProgress}
            icon={<TrendingUp className="w-5 h-5 text-blue-600" />}
            href="/projects?status=IN_PROGRESS"
            trend={[3, 4, 4, 5, stats.inProgress]}
          />
          <KPITile
            title="Blocked"
            value={stats.blocked}
            delta={blockedDelta}
            icon={<AlertCircle className="w-5 h-5 text-red-600" />}
            status={stats.blocked > 0 ? 'warning' : 'default'}
            href="/projects?status=BLOCKED"
          />
          <KPITile
            title="Due This Week"
            value={stats.dueSoon}
            icon={<Clock className="w-5 h-5 text-amber-600" />}
            href="/projects?dueSoon=true"
          />
          <KPITile
            title="Open Tasks"
            value={stats.todoTasks}
            icon={<Users className="w-5 h-5 text-green-600" />}
            href="/my-work"
          />
        </KPIGrid>

        {/* Projects List */}
        <Suspense fallback={<div>Loading projects...</div>}>
          <ProjectsList 
            projects={projects} 
            users={users}
          />
        </Suspense>
      </div>
    </div>
  )
}