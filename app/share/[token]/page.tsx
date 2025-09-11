import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { Calendar, Clock, Users, CheckCircle, Circle, AlertCircle } from 'lucide-react'
import { getStatusColor, getBranchColor } from '@/lib/utils'

export const revalidate = 60

export default async function ClientSharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const project = await prisma.project.findUnique({
    where: { clientShareToken: token },
    include: {
      pm: true,
      developers: true,
      tasks: {
        orderBy: { order: 'asc' },
      },
      updates: {
        include: { author: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  })

  if (!project) {
    notFound()
  }

  const taskCounts = {
    todo: project.tasks.filter(t => t.status === 'Todo').length,
    doing: project.tasks.filter(t => t.status === 'Doing').length,
    review: project.tasks.filter(t => t.status === 'Review').length,
    done: project.tasks.filter(t => t.status === 'Done').length,
    total: project.tasks.length,
  }

  const progress = taskCounts.total > 0 
    ? Math.round((taskCounts.done / taskCounts.total) * 100)
    : 0

  return (
    <div className="min-h-screen bg-surface">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-2xl font-bold text-fg">Project Status</h1>
            <p className="mt-1 text-sm text-muted">Read-only view for {project.clientName}</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Project Overview */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-fg">{project.title}</h2>
              <div className="flex items-center space-x-2 mt-2">
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getBranchColor(project.branch)}`}>
                  {project.branch}
                </span>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(project.status)}`}>
                  {project.status}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div className="space-y-3">
              <div className="flex items-center text-sm">
                <Users className="h-4 w-4 mr-2 text-muted" />
                <span className="text-muted">Project Manager:</span>
                <span className="ml-2 font-medium">{project.pm.name}</span>
              </div>
              <div className="flex items-start text-sm">
                <Users className="h-4 w-4 mr-2 text-muted mt-0.5" />
                <span className="text-muted">Development Team:</span>
                <div className="ml-2">
                  {project.developers.map(dev => (
                    <span key={dev.id} className="font-medium block">{dev.name}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {project.startDate && (
                <div className="flex items-center text-sm">
                  <Calendar className="h-4 w-4 mr-2 text-muted" />
                  <span className="text-muted">Start Date:</span>
                  <span className="ml-2 font-medium">
                    {format(new Date(project.startDate), 'MMM d, yyyy')}
                  </span>
                </div>
              )}
              {project.targetDelivery && (
                <div className="flex items-center text-sm">
                  <Clock className="h-4 w-4 mr-2 text-muted" />
                  <span className="text-muted">Target Delivery:</span>
                  <span className="ml-2 font-medium">
                    {format(new Date(project.targetDelivery), 'MMM d, yyyy')}
                  </span>
                </div>
              )}
              <div className="flex items-center text-sm">
                <Clock className="h-4 w-4 mr-2 text-muted" />
                <span className="text-muted">Last Updated:</span>
                <span className="ml-2 font-medium">
                  {format(new Date(project.lastUpdatedAt), 'MMM d, yyyy h:mm a')}
                </span>
              </div>
            </div>
          </div>

          {project.notes && (
            <div className="mt-6 p-4 bg-surface rounded-lg">
              <h3 className="text-sm font-medium text-fg-muted mb-2">Project Notes</h3>
              <p className="text-sm text-muted">{project.notes}</p>
            </div>
          )}
        </div>

        {/* Progress Overview */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-medium text-fg mb-4">Progress Overview</h3>
          
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted">Overall Progress</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <div className="w-full bg-border rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="text-center p-3 bg-surface rounded-lg">
              <div className="text-2xl font-bold text-fg-muted">{taskCounts.todo}</div>
              <div className="text-xs text-muted mt-1">To Do</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-700">{taskCounts.doing}</div>
              <div className="text-xs text-muted mt-1">In Progress</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-700">{taskCounts.review}</div>
              <div className="text-xs text-muted mt-1">In Review</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-700">{taskCounts.done}</div>
              <div className="text-xs text-muted mt-1">Completed</div>
            </div>
          </div>
        </div>

        {/* Recent Updates */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-medium text-fg mb-4">Recent Updates</h3>
          
          {project.updates.length === 0 ? (
            <p className="text-sm text-muted">No updates yet.</p>
          ) : (
            <div className="space-y-4">
              {project.updates.map(update => (
                <div key={update.id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-border flex items-center justify-center text-xs font-medium text-fg-muted">
                      {update.author.name?.slice(0, 2).toUpperCase() || 'NA'}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-sm">{update.author.name || 'Unknown'}</span>
                      <span className="text-xs text-muted">
                        {format(new Date(update.createdAt), 'MMM d, h:mm a')}
                      </span>
                    </div>
                    <p className="text-sm text-fg-muted mt-1">{update.body}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center py-8 text-sm text-muted">
          <p>This is a read-only view of the project status.</p>
          <p>For questions or updates, please contact your project manager.</p>
        </div>
      </div>
    </div>
  )
}