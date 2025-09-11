import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { format, formatDistanceToNow, subDays, isToday, isYesterday } from 'date-fns'
import { 
  Clock, MessageSquare, CheckCircle, AlertCircle, User,
  Calendar, TrendingUp, Activity, GitBranch, FileText,
  Users, PlayCircle, Target, Filter, Search
} from 'lucide-react'
import { KPIGrid, KPITile } from '@/components/ui/kpi-tile'

export const revalidate = 60

async function getRecentActivity() {
  const [updates, tasks, projects, timeEntries] = await Promise.all([
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
      take: 100
    }),
    
    // Get recently changed tasks
    prisma.task.findMany({
      where: {
        updatedAt: {
          gte: subDays(new Date(), 7)
        }
      },
      include: {
        assignee: true,
        project: true
      },
      orderBy: { updatedAt: 'desc' },
      take: 50
    }),
    
    // Get recently updated projects
    prisma.project.findMany({
      where: {
        lastUpdatedAt: {
          gte: subDays(new Date(), 7)
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
      take: 20
    }),

    // Get time tracking entries
    prisma.timeEntry.findMany({
      where: {
        date: {
          gte: subDays(new Date(), 7)
        }
      },
      include: {
        user: true,
        task: {
          include: {
            project: true
          }
        }
      },
      orderBy: { date: 'desc' },
      take: 30
    })
  ])

  // Combine and sort all activities by date
  const activities = [
    ...updates.map(update => ({
      type: 'update' as const,
      date: update.createdAt,
      data: update,
      icon: MessageSquare,
      color: 'blue'
    })),
    ...tasks.filter(t => t.status === 'DONE').map(task => ({
      type: 'task_completed' as const,
      date: task.updatedAt,
      data: task,
      icon: CheckCircle,
      color: 'green'
    })),
    ...tasks.filter(t => t.status === 'DOING').map(task => ({
      type: 'task_started' as const,
      date: task.updatedAt,
      data: task,
      icon: PlayCircle,
      color: 'purple'
    })),
    ...projects.map(project => ({
      type: 'project' as const,
      date: project.lastUpdatedAt,
      data: project,
      icon: GitBranch,
      color: 'indigo'
    })),
    ...timeEntries.map(entry => ({
      type: 'time_logged' as const,
      date: entry.date,
      data: entry,
      icon: Clock,
      color: 'amber'
    }))
  ].sort((a, b) => b.date.getTime() - a.date.getTime())

  return { activities, updates, tasks, projects, timeEntries }
}

export default async function ActivityPage() {
  const { activities, updates, tasks, projects, timeEntries } = await getRecentActivity()

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
  const todayActivities = activities.filter(a => isToday(a.date)).length
  const weekCompleted = tasks.filter(t => t.status === 'DONE').length
  const activeProjects = projects.filter(p => p.status === 'IN_PROGRESS').length
  const totalHours = timeEntries.reduce((sum, e) => {
    return sum + (e.hours || 0)
  }, 0)

  // Activity trends (mock data - would calculate from historical data)
  const activityTrend = [15, 22, 18, 25, 30, 28, todayActivities]

  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr)
    if (isToday(date)) return 'Today'
    if (isYesterday(date)) return 'Yesterday'
    return format(date, 'EEEE, MMMM d')
  }

  const getActivityDescription = (activity: any) => {
    switch (activity.type) {
      case 'update':
        return (
          <>
            <span className="font-medium">{activity.data.author.name}</span>
            {' posted update in '}
            <Link 
              href={`/projects/${activity.data.project.id}`}
              className="font-medium text-blue-600 hover:text-blue-700"
            >
              {activity.data.project.title}
            </Link>
          </>
        )
      case 'task_completed':
        return (
          <>
            <span className="font-medium">{activity.data.assignee?.name || 'Someone'}</span>
            {' completed '}
            <span className="font-medium">{activity.data.title}</span>
            {' in '}
            <Link 
              href={`/projects/${activity.data.project.id}`}
              className="text-blue-600 hover:text-blue-700"
            >
              {activity.data.project.title}
            </Link>
          </>
        )
      case 'task_started':
        return (
          <>
            <span className="font-medium">{activity.data.assignee?.name || 'Someone'}</span>
            {' started working on '}
            <span className="font-medium">{activity.data.title}</span>
          </>
        )
      case 'project':
        return (
          <>
            <Link 
              href={`/projects/${activity.data.id}`}
              className="font-medium text-blue-600 hover:text-blue-700"
            >
              {activity.data.title}
            </Link>
            {' was updated by '}
            <span className="font-medium">{activity.data.pm.name}</span>
          </>
        )
      case 'time_logged':
        const duration = Math.round((activity.data.hours || 0) * 60)
        return (
          <>
            <span className="font-medium">{activity.data.user.name}</span>
            {' logged '}
            <span className="font-medium">{duration} minutes</span>
            {' on '}
            <span className="font-medium">{activity.data.task?.title || 'a task'}</span>
          </>
        )
      default:
        return 'Activity'
    }
  }

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-fg">Activity</h1>
          <p className="text-muted mt-1">Track all team activity and project updates</p>
        </div>

        {/* KPI Tiles */}
        <KPIGrid className="mb-8">
          <KPITile
            label="Today's Activity"
            value={todayActivities}
            icon={<Activity className="w-5 h-5 text-purple-600" />}
          />
          <KPITile
            label="Week Completed"
            value={`${weekCompleted} tasks`}
            icon={<CheckCircle className="w-5 h-5 text-green-600" />}
          />
          <KPITile
            label="Active Projects"
            value={activeProjects}
            icon={<GitBranch className="w-5 h-5 text-indigo-600" />}
            href="/?status=IN_PROGRESS"
          />
          <KPITile
            label="Hours Logged"
            value={`${Math.round(totalHours)} this week`}
            icon={<Clock className="w-5 h-5 text-amber-600" />}
          />
        </KPIGrid>

        {/* Filters */}
        <div className="mb-6 flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
            <input
              type="text"
              placeholder="Search activity..."
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button className="px-4 py-2 bg-white border border-border rounded-lg hover:bg-surface flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>

        {/* Activity Timeline */}
        <div className="bg-white rounded-2xl border border-border">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Clock className="w-5 h-5 text-muted" />
              Timeline
            </h2>
          </div>
          
          <div className="divide-y divide-surface">
            {Object.entries(groupedActivities).slice(0, 7).map(([date, dayActivities]) => (
              <div key={date} className="p-6">
                {/* Date Header */}
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0 w-24">
                    <p className="text-sm font-medium text-fg">{getDateLabel(date)}</p>
                    <p className="text-xs text-muted">{dayActivities.length} activities</p>
                  </div>
                  <div className="flex-1 ml-4">
                    <div className="h-px bg-border" />
                  </div>
                </div>
                
                {/* Activities */}
                <div className="space-y-4 ml-24">
                  {dayActivities.slice(0, 10).map((activity, idx) => {
                    const Icon = activity.icon
                    const bgColor = {
                      blue: 'bg-blue-100',
                      green: 'bg-green-100',
                      purple: 'bg-purple-100',
                      indigo: 'bg-indigo-100',
                      amber: 'bg-amber-100'
                    }[activity.color] || 'bg-surface'
                    
                    const iconColor = {
                      blue: 'text-blue-600',
                      green: 'text-green-600',
                      purple: 'text-purple-600',
                      indigo: 'text-indigo-600',
                      amber: 'text-amber-600'
                    }[activity.color] || 'text-muted'

                    return (
                      <div key={`${activity.type}-${idx}`} className="flex items-start gap-3">
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full ${bgColor} flex items-center justify-center`}>
                          <Icon className={`w-4 h-4 ${iconColor}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-fg">
                            {getActivityDescription(activity)}
                          </p>
                          {activity.type === 'update' && activity.data.body && (
                            <p className="text-sm text-muted mt-1 line-clamp-2">
                              {activity.data.body}
                            </p>
                          )}
                          <p className="text-xs text-muted mt-1">
                            {formatDistanceToNow(activity.date, { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                  
                  {dayActivities.length > 10 && (
                    <button className="text-sm text-blue-600 hover:text-blue-700 ml-11">
                      Show {dayActivities.length - 10} more activities
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Load More */}
          <div className="px-6 py-4 border-t">
            <button className="w-full py-2 text-sm text-muted hover:text-fg font-medium">
              Load older activities
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}