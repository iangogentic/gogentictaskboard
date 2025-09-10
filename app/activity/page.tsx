import { prisma } from '@/lib/db'
import Link from 'next/link'
import { format, formatDistanceToNow } from 'date-fns'
import { 
  ArrowLeft, 
  Clock, 
  MessageSquare, 
  CheckCircle, 
  AlertCircle,
  User,
  Calendar,
  TrendingUp,
  Activity
} from 'lucide-react'

export const dynamic = 'force-dynamic'

async function getRecentActivity() {
  const [updates, tasks, projects] = await Promise.all([
    // Get recent updates
    prisma.update.findMany({
      include: {
        author: true,
        project: {
          include: {
            pm: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    }),
    
    // Get recently completed tasks
    prisma.task.findMany({
      where: {
        status: 'Done',
        updatedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      include: {
        assignee: true,
        project: true
      },
      orderBy: { updatedAt: 'desc' },
      take: 20
    }),
    
    // Get recently updated projects
    prisma.project.findMany({
      where: {
        lastUpdatedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      },
      include: {
        pm: true,
        developers: true,
        _count: {
          select: {
            tasks: true,
            updates: true
          }
        }
      },
      orderBy: { lastUpdatedAt: 'desc' },
      take: 10
    })
  ])

  // Combine and sort all activities by date
  const activities = [
    ...updates.map(update => ({
      type: 'update' as const,
      date: update.createdAt,
      data: update
    })),
    ...tasks.map(task => ({
      type: 'task' as const,
      date: task.updatedAt,
      data: task
    })),
    ...projects.map(project => ({
      type: 'project' as const,
      date: project.lastUpdatedAt,
      data: project
    }))
  ].sort((a, b) => b.date.getTime() - a.date.getTime())

  return { activities, updates, tasks, projects }
}

export default async function ActivityPage() {
  const { activities, updates, tasks, projects } = await getRecentActivity()

  // Group activities by date
  const groupedActivities = activities.reduce((acc, activity) => {
    const dateKey = format(activity.date, 'yyyy-MM-dd')
    if (!acc[dateKey]) {
      acc[dateKey] = []
    }
    acc[dateKey].push(activity)
    return acc
  }, {} as Record<string, typeof activities>)

  // Calculate stats
  const todayUpdates = updates.filter(u => 
    format(u.createdAt, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
  ).length
  
  const weekTasks = tasks.length
  const activeProjects = projects.filter(p => p.status === 'IN_PROGRESS').length

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Link>
              <div className="border-l pl-4">
                <h1 className="text-xl font-semibold">Activity Feed</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Today's Updates</p>
                <p className="text-2xl font-bold">{todayUpdates}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Tasks Completed (7d)</p>
                <p className="text-2xl font-bold">{weekTasks}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Projects</p>
                <p className="text-2xl font-bold">{activeProjects}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-indigo-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Activities</p>
                <p className="text-2xl font-bold">{activities.length}</p>
              </div>
              <Activity className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">Recent Activity</h2>
          </div>
          
          <div className="divide-y">
            {Object.entries(groupedActivities).slice(0, 7).map(([date, dayActivities]) => (
              <div key={date} className="p-6">
                <div className="flex items-center mb-4">
                  <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                  <h3 className="text-sm font-medium text-gray-900">
                    {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                  </h3>
                  <span className="ml-2 text-xs text-gray-500">
                    ({dayActivities.length} activities)
                  </span>
                </div>
                
                <div className="space-y-4 ml-6">
                  {dayActivities.slice(0, 10).map((activity, idx) => {
                    if (activity.type === 'update') {
                      const update = activity.data as any
                      return (
                        <div key={`update-${update.id}`} className="flex space-x-3">
                          <div className="flex-shrink-0">
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                              <MessageSquare className="h-4 w-4 text-blue-600" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-sm">{update.author.name}</span>
                              <span className="text-gray-500 text-xs">posted an update in</span>
                              <Link 
                                href={`/projects/${update.project.id}`}
                                className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                              >
                                {update.project.title}
                              </Link>
                            </div>
                            <p className="text-gray-700 text-sm mt-1">{update.body}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {formatDistanceToNow(update.createdAt, { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      )
                    } else if (activity.type === 'task') {
                      const task = activity.data as any
                      return (
                        <div key={`task-${task.id}`} className="flex space-x-3">
                          <div className="flex-shrink-0">
                            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-sm">
                                {task.assignee?.name || 'Unassigned'}
                              </span>
                              <span className="text-gray-500 text-xs">completed</span>
                              <span className="font-medium text-sm">{task.title}</span>
                              <span className="text-gray-500 text-xs">in</span>
                              <Link 
                                href={`/projects/${task.project.id}`}
                                className="text-indigo-600 hover:text-indigo-900 text-sm"
                              >
                                {task.project.title}
                              </Link>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                              {formatDistanceToNow(task.updatedAt, { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      )
                    } else if (activity.type === 'project') {
                      const project = activity.data as any
                      return (
                        <div key={`project-${project.id}`} className="flex space-x-3">
                          <div className="flex-shrink-0">
                            <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                              <Activity className="h-4 w-4 text-purple-600" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <Link 
                                href={`/projects/${project.id}`}
                                className="font-medium text-sm text-indigo-600 hover:text-indigo-900"
                              >
                                {project.title}
                              </Link>
                              <span className="text-gray-500 text-xs">was updated</span>
                            </div>
                            <div className="flex items-center space-x-4 mt-1">
                              <span className="text-xs text-gray-500">
                                PM: {project.pm.name}
                              </span>
                              <span className="text-xs text-gray-500">
                                {project._count.tasks} tasks
                              </span>
                              <span className="text-xs text-gray-500">
                                {project._count.updates} updates
                              </span>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                              {formatDistanceToNow(project.lastUpdatedAt, { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      )
                    }
                    return null
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}