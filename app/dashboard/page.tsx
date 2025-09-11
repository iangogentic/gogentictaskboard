import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { format, subDays } from 'date-fns'
import { 
  TrendingUp, TrendingDown, Activity, Users, Briefcase, 
  CheckCircle, Clock, AlertCircle, Calendar, BarChart3,
  GitBranch, Target, Timer
} from 'lucide-react'
import { KPIGrid, KPITile, AttentionCard } from '@/components/ui/kpi-tile'
import { getStatusColor, getBranchColor } from '@/lib/utils'

export const revalidate = 60

export default async function DashboardPage() {
  // Fetch all data needed for dashboard
  const [projects, tasks, updates, users, previousWeekData] = await Promise.all([
    prisma.project.findMany({
      include: {
        pm: true,
        developers: true,
        tasks: true,
        updates: true,
      }
    }),
    prisma.task.findMany({
      include: {
        assignee: true,
        project: true,
      }
    }),
    prisma.update.findMany({
      where: {
        createdAt: {
          gte: subDays(new Date(), 7)
        }
      },
      include: {
        author: true,
        project: true,
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.user.findMany(),
    // Get previous week data for deltas
    Promise.all([
      prisma.project.count({
        where: {
          status: 'BLOCKED',
          lastUpdatedAt: {
            gte: subDays(new Date(), 14),
            lt: subDays(new Date(), 7)
          }
        }
      }),
      prisma.task.count({
        where: {
          status: 'TODO',
          createdAt: {
            gte: subDays(new Date(), 14),
            lt: subDays(new Date(), 7)
          }
        }
      }),
    ]).then(([blockedLastWeek, tasksLastWeek]) => ({
      blockedLastWeek,
      tasksLastWeek,
    }))
  ])

  // Calculate metrics
  const metrics = {
    totalProjects: projects.length,
    activeProjects: projects.filter(p => p.status === 'IN_PROGRESS').length,
    completedProjects: projects.filter(p => p.status === 'COMPLETED').length,
    blockedProjects: projects.filter(p => p.status === 'BLOCKED').length,
    totalTasks: tasks.length,
    todoTasks: tasks.filter(t => t.status === 'TODO').length,
    inProgressTasks: tasks.filter(t => t.status === 'DOING').length,
    reviewTasks: tasks.filter(t => t.status === 'REVIEW').length,
    completedTasks: tasks.filter(t => t.status === 'DONE').length,
    overdueTasks: tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date()).length,
    weeklyUpdates: updates.length,
  }

  // Calculate deltas
  const blockedDelta = metrics.blockedProjects - previousWeekData.blockedLastWeek
  const tasksDelta = metrics.todoTasks - previousWeekData.tasksLastWeek

  // Identify items needing attention
  const attentionItems = [
    ...projects
      .filter(p => p.status === 'BLOCKED')
      .map(p => ({
        id: p.id,
        title: p.title,
        description: `Project blocked - ${p.branch}`,
        priority: 'high' as const,
        href: `/projects/${p.id}`
      })),
    ...tasks
      .filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'DONE')
      .slice(0, 3)
      .map(t => ({
        id: t.id,
        title: t.title,
        description: `Overdue task in ${t.project.title}`,
        priority: 'medium' as const,
        href: `/projects/${t.projectId}`
      })),
  ]

  // User workload with capacity indicators
  const userWorkload = users.map(user => ({
    user,
    assignedTasks: tasks.filter(t => t.assigneeId === user.id && t.status !== 'DONE').length,
    completedThisWeek: tasks.filter(t => 
      t.assigneeId === user.id && 
      t.status === 'DONE' &&
      t.updatedAt > subDays(new Date(), 7)
    ).length,
    managedProjects: projects.filter(p => p.pmId === user.id).length,
    capacity: tasks.filter(t => t.assigneeId === user.id && t.status !== 'DONE').length > 10 ? 'over' : 
              tasks.filter(t => t.assigneeId === user.id && t.status !== 'DONE').length > 5 ? 'high' : 'normal'
  })).sort((a, b) => b.assignedTasks - a.assignedTasks)

  // Recent trends for sparklines
  const taskTrend = [8, 10, 9, 12, metrics.todoTasks]
  const updateTrend = [5, 8, 6, 10, updates.length]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Real-time overview of projects and team performance</p>
        </div>

        {/* Attention Card */}
        {attentionItems.length > 0 && (
          <AttentionCard 
            items={attentionItems}
            className="mb-8"
          />
        )}

        {/* Primary KPIs */}
        <KPIGrid className="mb-8">
          <KPITile
            title="Active Projects"
            value={metrics.activeProjects}
            icon={<Briefcase className="w-5 h-5 text-blue-600" />}
            subtitle={`${metrics.totalProjects} total`}
            href="/?status=IN_PROGRESS"
          />
          <KPITile
            title="Blocked"
            value={metrics.blockedProjects}
            delta={blockedDelta !== 0 ? {
              value: Math.abs(blockedDelta),
              type: blockedDelta > 0 ? 'increase' : 'decrease',
              label: 'vs last week'
            } : undefined}
            icon={<AlertCircle className="w-5 h-5 text-red-600" />}
            status={metrics.blockedProjects > 0 ? 'danger' : 'default'}
            href="/?status=BLOCKED"
          />
          <KPITile
            title="Open Tasks"
            value={metrics.todoTasks}
            delta={tasksDelta !== 0 ? {
              value: Math.abs(tasksDelta),
              type: tasksDelta > 0 ? 'increase' : 'decrease',
              label: 'vs last week'
            } : undefined}
            trend={taskTrend}
            icon={<CheckCircle className="w-5 h-5 text-green-600" />}
            href="/my-work"
          />
          <KPITile
            title="Weekly Activity"
            value={updates.length}
            subtitle="updates"
            trend={updateTrend}
            icon={<Activity className="w-5 h-5 text-purple-600" />}
            href="/activity"
          />
        </KPIGrid>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Task Pipeline */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-gray-600" />
              Task Pipeline
            </h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">To Do</span>
                  <span className="text-sm font-semibold">{metrics.todoTasks}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div 
                    className="bg-gray-500 h-2 rounded-full transition-all" 
                    style={{ width: `${metrics.totalTasks ? (metrics.todoTasks / metrics.totalTasks) * 100 : 0}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">In Progress</span>
                  <span className="text-sm font-semibold">{metrics.inProgressTasks}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all" 
                    style={{ width: `${metrics.totalTasks ? (metrics.inProgressTasks / metrics.totalTasks) * 100 : 0}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Review</span>
                  <span className="text-sm font-semibold">{metrics.reviewTasks}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div 
                    className="bg-purple-500 h-2 rounded-full transition-all" 
                    style={{ width: `${metrics.totalTasks ? (metrics.reviewTasks / metrics.totalTasks) * 100 : 0}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Completed</span>
                  <span className="text-sm font-semibold text-green-600">{metrics.completedTasks}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all" 
                    style={{ width: `${metrics.totalTasks ? (metrics.completedTasks / metrics.totalTasks) * 100 : 0}%` }}
                  />
                </div>
              </div>
              {metrics.overdueTasks > 0 && (
                <div className="pt-2 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-red-600 font-medium">Overdue</span>
                    <span className="text-sm font-bold text-red-600">{metrics.overdueTasks}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Team Capacity */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 col-span-2">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-gray-600" />
              Team Capacity
            </h2>
            <div className="space-y-3">
              {userWorkload.slice(0, 5).map(({ user, assignedTasks, completedThisWeek, capacity }) => (
                <div key={user.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500">{assignedTasks} active • {completedThisWeek} completed</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-32">
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all ${
                            capacity === 'over' ? 'bg-red-500' : 
                            capacity === 'high' ? 'bg-amber-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min((assignedTasks / 10) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      capacity === 'over' ? 'bg-red-100 text-red-700' : 
                      capacity === 'high' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {capacity === 'over' ? 'Over capacity' : capacity === 'high' ? 'High load' : 'Normal'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <Link 
              href="/team"
              className="mt-4 block text-center text-sm text-blue-600 hover:text-blue-700"
            >
              View all team members →
            </Link>
          </div>
        </div>

        {/* Recent Project Activity */}
        <div className="bg-white rounded-2xl border border-gray-200">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-600" />
              Recent Activity
            </h2>
            <Link 
              href="/activity"
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              View all →
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {updates.slice(0, 5).map(update => (
              <div key={update.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">{update.author.name}</span>
                      {' updated '}
                      <Link 
                        href={`/projects/${update.projectId}`}
                        className="font-medium text-blue-600 hover:text-blue-700"
                      >
                        {update.project.title}
                      </Link>
                    </p>
                    <p className="text-sm text-gray-600 mt-1">{update.body}</p>
                  </div>
                  <span className="text-xs text-gray-500 ml-4">
                    {format(new Date(update.createdAt), 'MMM d, h:mm a')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}