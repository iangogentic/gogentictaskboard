import { prisma } from '@/lib/db'
import Link from 'next/link'
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns'
import { 
  TrendingUp, TrendingDown, Activity, Users, Briefcase, 
  CheckCircle, Clock, AlertCircle, Calendar, BarChart3 
} from 'lucide-react'
import { getStatusColor, getBranchColor } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  // Fetch all data needed for dashboard
  const [projects, tasks, updates, users] = await Promise.all([
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
          gte: subDays(new Date(), 7) // Last 7 days
        }
      },
      include: {
        author: true,
        project: true,
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.user.findMany()
  ])

  // Calculate metrics
  const metrics = {
    totalProjects: projects.length,
    activeProjects: projects.filter(p => p.status === 'IN_PROGRESS').length,
    completedProjects: projects.filter(p => p.status === 'COMPLETED').length,
    blockedProjects: projects.filter(p => p.status === 'BLOCKED').length,
    totalTasks: tasks.length,
    todoTasks: tasks.filter(t => t.status === 'Todo').length,
    inProgressTasks: tasks.filter(t => t.status === 'Doing').length,
    reviewTasks: tasks.filter(t => t.status === 'Review').length,
    completedTasks: tasks.filter(t => t.status === 'Done').length,
    overdueTasks: tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date()).length,
    weeklyUpdates: updates.length,
  }

  // Branch distribution
  const branchMetrics = {
    CORTEX: projects.filter(p => p.branch === 'CORTEX').length,
    SOLUTIONS: projects.filter(p => p.branch === 'SOLUTIONS').length,
    FISHER: projects.filter(p => p.branch === 'FISHER').length,
  }

  // User workload
  const userWorkload = users.map(user => ({
    user,
    assignedTasks: tasks.filter(t => t.assigneeId === user.id && t.status !== 'Done').length,
    completedTasks: tasks.filter(t => t.assigneeId === user.id && t.status === 'Done').length,
    managedProjects: projects.filter(p => p.pmId === user.id).length,
  })).sort((a, b) => b.assignedTasks - a.assignedTasks)

  // Recent activity by project
  const projectActivity = projects.map(project => ({
    project,
    recentUpdates: project.updates.filter(u => 
      new Date(u.createdAt) > subDays(new Date(), 7)
    ).length,
    taskProgress: project.tasks.length > 0 
      ? Math.round((project.tasks.filter(t => t.status === 'Done').length / project.tasks.length) * 100)
      : 0,
    urgentTasks: project.tasks.filter(t => 
      t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'Done'
    ).length,
  })).sort((a, b) => b.recentUpdates - a.recentUpdates)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Overview of all projects and team activity</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600">Active Projects</div>
            <Briefcase className="h-5 w-5 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{metrics.activeProjects}</div>
          <div className="text-xs text-gray-500">of {metrics.totalProjects} total</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600">Tasks In Progress</div>
            <Activity className="h-5 w-5 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{metrics.inProgressTasks}</div>
          <div className="text-xs text-gray-500">{metrics.reviewTasks} in review</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600">Overdue Tasks</div>
            <AlertCircle className="h-5 w-5 text-red-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{metrics.overdueTasks}</div>
          <div className="text-xs text-gray-500">needs attention</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600">Weekly Updates</div>
            <TrendingUp className="h-5 w-5 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{metrics.weeklyUpdates}</div>
          <div className="text-xs text-gray-500">last 7 days</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Task Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Task Distribution</h2>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">To Do</span>
                <span className="font-medium">{metrics.todoTasks}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gray-600 h-2 rounded-full" 
                  style={{ width: `${(metrics.todoTasks / metrics.totalTasks) * 100}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">In Progress</span>
                <span className="font-medium">{metrics.inProgressTasks}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${(metrics.inProgressTasks / metrics.totalTasks) * 100}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Review</span>
                <span className="font-medium">{metrics.reviewTasks}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-yellow-600 h-2 rounded-full" 
                  style={{ width: `${(metrics.reviewTasks / metrics.totalTasks) * 100}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Completed</span>
                <span className="font-medium">{metrics.completedTasks}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full" 
                  style={{ width: `${(metrics.completedTasks / metrics.totalTasks) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Branch Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Projects by Branch</h2>
          <div className="space-y-4">
            {Object.entries(branchMetrics).map(([branch, count]) => (
              <div key={branch} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getBranchColor(branch)}`}>
                    {branch}
                  </span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-2xl font-bold">{count}</div>
                  <div className="text-sm text-gray-500">projects</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Project Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Project Status</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-gray-600">In Progress</span>
              </div>
              <span className="text-lg font-bold">{metrics.activeProjects}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm text-gray-600">Completed</span>
              </div>
              <span className="text-lg font-bold">{metrics.completedProjects}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm text-gray-600">Blocked</span>
              </div>
              <span className="text-lg font-bold">{metrics.blockedProjects}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Team Workload */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Team Workload</h2>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="pb-3">Team Member</th>
                  <th className="pb-3">Active Tasks</th>
                  <th className="pb-3">Completed Tasks</th>
                  <th className="pb-3">Managed Projects</th>
                  <th className="pb-3">Workload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {userWorkload.map(({ user, assignedTasks, completedTasks, managedProjects }) => (
                  <tr key={user.id}>
                    <td className="py-3">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center text-xs font-medium text-gray-700">
                          {user.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-xs text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className="text-sm font-medium">{assignedTasks}</span>
                    </td>
                    <td className="py-3">
                      <span className="text-sm text-gray-600">{completedTasks}</span>
                    </td>
                    <td className="py-3">
                      <span className="text-sm text-gray-600">{managedProjects}</span>
                    </td>
                    <td className="py-3">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            assignedTasks > 10 ? 'bg-red-500' : 
                            assignedTasks > 5 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min((assignedTasks / 15) * 100, 100)}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Active Projects */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Project Activity (Last 7 Days)</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {projectActivity.slice(0, 5).map(({ project, recentUpdates, taskProgress, urgentTasks }) => (
              <div key={project.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <Link 
                    href={`/projects/${project.id}`}
                    className="text-sm font-medium text-gray-900 hover:text-indigo-600"
                  >
                    {project.title}
                  </Link>
                  <div className="flex items-center space-x-4 mt-1">
                    <span className="text-xs text-gray-500">PM: {project.pm.name}</span>
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getBranchColor(project.branch)}`}>
                      {project.branch}
                    </span>
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusColor(project.status)}`}>
                      {project.status}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <div className="text-lg font-bold">{taskProgress}%</div>
                    <div className="text-xs text-gray-500">Complete</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold">{recentUpdates}</div>
                    <div className="text-xs text-gray-500">Updates</div>
                  </div>
                  {urgentTasks > 0 && (
                    <div className="text-center">
                      <div className="text-lg font-bold text-red-600">{urgentTasks}</div>
                      <div className="text-xs text-gray-500">Overdue</div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}