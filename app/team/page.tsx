import { prisma } from '@/lib/prisma'
import { format, subDays } from 'date-fns'
import { 
  Users, Briefcase, CheckCircle, Clock, TrendingUp, 
  Mail, Shield, Code, Palette, AlertCircle
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function TeamPage() {
  const [users, projects, tasks, recentActivity] = await Promise.all([
    prisma.user.findMany({
      orderBy: { name: 'asc' },
    }),
    prisma.project.findMany({
      include: {
        pm: true,
        developers: true,
      },
    }),
    prisma.task.findMany({
      include: {
        assignee: true,
        project: true,
      },
    }),
    prisma.update.findMany({
      where: {
        createdAt: {
          gte: subDays(new Date(), 30),
        },
      },
      include: {
        author: true,
      },
    }),
  ])

  // Calculate team metrics
  const teamMetrics = users.map(user => {
    const userTasks = tasks.filter(t => t.assigneeId === user.id)
    const activeTasks = userTasks.filter(t => t.status !== 'DONE')
    const completedTasks = userTasks.filter(t => t.status === 'DONE')
    const completedThisWeek = completedTasks.filter(t => 
      t.updatedAt > subDays(new Date(), 7)
    )
    const overdueTasks = userTasks.filter(t => 
      t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'DONE'
    )
    const managedProjects = projects.filter(p => p.pmId === user.id)
    const developingProjects = projects.filter(p => 
      p.developers.some(d => d.id === user.id)
    )
    const recentUpdates = recentActivity.filter(u => u.authorId === user.id)
    
    // Calculate capacity (0-100%)
    const capacity = Math.min((activeTasks.length / 10) * 100, 100)
    const capacityStatus = capacity > 80 ? 'over' : capacity > 60 ? 'high' : 'normal'
    
    // Calculate productivity score (mock calculation)
    const productivityScore = Math.round(
      (completedThisWeek.length * 20) + 
      (recentUpdates.length * 5) + 
      (100 - capacity) / 2
    )
    
    // Activity heatmap for last 30 days
    const activityMap = Array.from({ length: 30 }, (_, i) => {
      const date = subDays(new Date(), 29 - i)
      const dayActivity = recentUpdates.filter(u => {
        const updateDate = new Date(u.createdAt)
        return updateDate.toDateString() === date.toDateString()
      }).length
      return dayActivity
    })

    return {
      user,
      activeTasks: activeTasks.length,
      completedTasks: completedTasks.length,
      completedThisWeek: completedThisWeek.length,
      overdueTasks: overdueTasks.length,
      managedProjects: managedProjects.length,
      developingProjects: developingProjects.length,
      capacity,
      capacityStatus,
      productivityScore,
      activityMap,
      totalUpdates: recentUpdates.length,
    }
  })

  // Sort by active tasks (busiest first)
  teamMetrics.sort((a, b) => b.activeTasks - a.activeTasks)

  // Role icons mapping
  const getRoleIcon = (email: string) => {
    if (email.includes('ian')) return <Shield className="w-4 h-4" />
    if (email.includes('arjun') || email.includes('luke')) return <Code className="w-4 h-4" />
    if (email.includes('mia')) return <Palette className="w-4 h-4" />
    return <Users className="w-4 h-4" />
  }

  const getRoleLabel = (email: string) => {
    if (email.includes('ian')) return 'PM / Lead'
    if (email.includes('arjun') || email.includes('luke')) return 'Developer'
    if (email.includes('mia')) return 'Designer'
    return 'Team Member'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Team</h1>
          <p className="text-gray-600 mt-1">Team capacity, workload, and performance</p>
        </div>

        {/* Team Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Team Size</span>
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold">{users.length}</p>
            <p className="text-xs text-gray-500">members</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Active Tasks</span>
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-2xl font-bold">
              {teamMetrics.reduce((sum, m) => sum + m.activeTasks, 0)}
            </p>
            <p className="text-xs text-gray-500">across team</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Weekly Completed</span>
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold">
              {teamMetrics.reduce((sum, m) => sum + m.completedThisWeek, 0)}
            </p>
            <p className="text-xs text-gray-500">tasks</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Overdue</span>
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <p className="text-2xl font-bold text-red-600">
              {teamMetrics.reduce((sum, m) => sum + m.overdueTasks, 0)}
            </p>
            <p className="text-xs text-gray-500">needs attention</p>
          </div>
        </div>

        {/* Team Members Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {teamMetrics.map(member => (
            <div key={member.user.id} className="bg-white rounded-2xl border border-gray-200 p-6">
              {/* Member Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white font-bold">
                    {member.user.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{member.user.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="flex items-center gap-1 text-sm text-gray-600">
                        {getRoleIcon(member.user.email)}
                        {getRoleLabel(member.user.email)}
                      </span>
                      <span className="text-gray-400">•</span>
                      <a href={`mailto:${member.user.email}`} className="text-sm text-gray-500 hover:text-blue-600">
                        {member.user.email}
                      </a>
                    </div>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  member.capacityStatus === 'over' ? 'bg-red-100 text-red-700' :
                  member.capacityStatus === 'high' ? 'bg-amber-100 text-amber-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {member.capacity}% capacity
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Active</p>
                  <p className="text-xl font-bold text-gray-900">{member.activeTasks}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">This Week</p>
                  <p className="text-xl font-bold text-green-600">{member.completedThisWeek}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Overdue</p>
                  <p className="text-xl font-bold text-red-600">{member.overdueTasks}</p>
                </div>
              </div>

              {/* Capacity Bar */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-gray-500">Workload</span>
                  <span className="text-xs text-gray-600">{member.activeTasks} tasks</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all ${
                      member.capacityStatus === 'over' ? 'bg-red-500' :
                      member.capacityStatus === 'high' ? 'bg-amber-500' :
                      'bg-green-500'
                    }`}
                    style={{ width: `${member.capacity}%` }}
                  />
                </div>
              </div>

              {/* Activity Heatmap */}
              <div>
                <p className="text-xs text-gray-500 mb-2">30-day activity</p>
                <div className="flex gap-1">
                  {member.activityMap.map((activity, i) => (
                    <div
                      key={i}
                      className={`w-2 h-8 rounded-sm ${
                        activity === 0 ? 'bg-gray-100' :
                        activity === 1 ? 'bg-green-200' :
                        activity === 2 ? 'bg-green-400' :
                        activity >= 3 ? 'bg-green-600' :
                        'bg-gray-100'
                      }`}
                      title={`${format(subDays(new Date(), 29 - i), 'MMM d')}: ${activity} updates`}
                    />
                  ))}
                </div>
              </div>

              {/* Projects */}
              <div className="mt-4 pt-4 border-t flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  {member.managedProjects > 0 && (
                    <span className="text-gray-600">
                      <span className="font-medium">{member.managedProjects}</span> PM
                    </span>
                  )}
                  {member.developingProjects > 0 && (
                    <span className="text-gray-600">
                      <span className="font-medium">{member.developingProjects}</span> Dev
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">
                    Score: <span className="font-medium">{member.productivityScore}</span>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Capacity Recommendations */}
        {teamMetrics.filter(m => m.capacityStatus === 'over').length > 0 && (
          <div className="mt-8 bg-amber-50 border border-amber-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-amber-900 mb-3">Capacity Alerts</h3>
            <div className="space-y-2">
              {teamMetrics
                .filter(m => m.capacityStatus === 'over')
                .map(member => (
                  <p key={member.user.id} className="text-sm text-amber-800">
                    <span className="font-medium">{member.user.name}</span> is over capacity with {member.activeTasks} active tasks. Consider reassigning or delaying non-critical work.
                  </p>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}