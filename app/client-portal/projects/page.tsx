import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { Calendar, Clock, Users, ArrowRight, Building2, FileText, CheckCircle } from 'lucide-react'
import { getStatusColor, getBranchColor } from '@/lib/utils'

export const revalidate = 60

async function getClientProjects(email: string) {
  if (!email) return []
  
  const projects = await prisma.project.findMany({
    where: { 
      clientEmail: email.toLowerCase(),
      archived: false
    },
    include: {
      pm: true,
      developers: true,
      tasks: true,
      updates: {
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    },
    orderBy: { createdAt: 'desc' }
  })
  
  return projects
}

export default async function ClientProjectsPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ email?: string }> 
}) {
  const params = await searchParams
  const email = params.email
  
  if (!email) {
    redirect('/client-portal')
  }

  const projects = await getClientProjects(email)

  if (projects.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-6 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Building2 className="h-8 w-8 text-indigo-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Client Portal</h1>
                  <p className="text-sm text-gray-600">{email}</p>
                </div>
              </div>
              <a
                href="/client-portal"
                className="text-sm text-indigo-600 hover:text-indigo-500"
              >
                ← Back to Login
              </a>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Projects Found</h2>
            <p className="text-gray-600">
              No projects are associated with the email address: {email}
            </p>
            <p className="text-gray-600 mt-2">
              Please check your email address or contact your project manager.
            </p>
            <a
              href="/client-portal"
              className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 mt-6"
            >
              Try Another Email
            </a>
          </div>
        </div>
      </div>
    )
  }

  const getProgress = (tasks: any[]) => {
    if (tasks.length === 0) return 0
    const done = tasks.filter(t => t.status === 'Done').length
    return Math.round((done / tasks.length) * 100)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Building2 className="h-8 w-8 text-indigo-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Your Projects</h1>
                <p className="text-sm text-gray-600">{email}</p>
              </div>
            </div>
            <a
              href="/client-portal"
              className="text-sm text-indigo-600 hover:text-indigo-500"
            >
              ← Change Email
            </a>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => {
            const progress = getProgress(project.tasks)
            const lastUpdate = project.updates[0]
            const taskCounts = {
              todo: project.tasks.filter(t => t.status === 'Todo').length,
              doing: project.tasks.filter(t => t.status === 'Doing').length,
              review: project.tasks.filter(t => t.status === 'Review').length,
              done: project.tasks.filter(t => t.status === 'Done').length,
            }

            return (
              <Link
                key={project.id}
                href={`/share/${project.clientShareToken}`}
                data-testid="project-card"
                className="block bg-white rounded-xl shadow-sm border hover:shadow-lg transition-all duration-200 overflow-hidden group"
              >
                <div className="p-6">
                  {/* Project Header */}
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                      {project.title}
                    </h3>
                    <div className="flex items-center space-x-2 mt-2">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getBranchColor(project.branch)}`}>
                        {project.branch}
                      </span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(project.status)}`}>
                        {project.status}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-medium text-gray-900">{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Task Counts */}
                  <div className="grid grid-cols-4 gap-2 mb-4 text-xs">
                    <div className="text-center">
                      <div className="font-bold text-gray-700">{taskCounts.todo}</div>
                      <div className="text-gray-500">Todo</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-blue-600">{taskCounts.doing}</div>
                      <div className="text-gray-500">Doing</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-yellow-600">{taskCounts.review}</div>
                      <div className="text-gray-500">Review</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-green-600">{taskCounts.done}</div>
                      <div className="text-gray-500">Done</div>
                    </div>
                  </div>

                  {/* Project Details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-xs text-gray-600">
                      <Users className="h-3 w-3 mr-1.5" />
                      PM: {project.pm.name}
                    </div>
                    {project.targetDelivery && (
                      <div className="flex items-center text-xs text-gray-600">
                        <Calendar className="h-3 w-3 mr-1.5" />
                        Target: {format(new Date(project.targetDelivery), 'MMM d, yyyy')}
                      </div>
                    )}
                    <div className="flex items-center text-xs text-gray-600">
                      <Clock className="h-3 w-3 mr-1.5" />
                      Updated: {format(new Date(project.lastUpdatedAt), 'MMM d')}
                    </div>
                  </div>

                  {/* Last Update */}
                  {lastUpdate && (
                    <div className="pt-4 border-t">
                      <p className="text-xs text-gray-500 mb-1">Latest Update:</p>
                      <p className="text-xs text-gray-700 line-clamp-2">
                        {lastUpdate.body}
                      </p>
                    </div>
                  )}

                  {/* View Details Link */}
                  <div className="mt-4 pt-4 border-t flex items-center justify-between">
                    <span className="text-sm text-indigo-600 font-medium">
                      View Details
                    </span>
                    <ArrowRight className="h-4 w-4 text-indigo-600 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Summary Stats */}
        <div className="mt-12 bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Portfolio Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{projects.length}</div>
              <div className="text-sm text-gray-600 mt-1">Total Projects</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {projects.filter(p => p.status === 'IN_PROGRESS').length}
              </div>
              <div className="text-sm text-gray-600 mt-1">In Progress</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {projects.filter(p => p.status === 'COMPLETED').length}
              </div>
              <div className="text-sm text-gray-600 mt-1">Completed</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {projects.reduce((acc, p) => acc + p.tasks.length, 0)}
              </div>
              <div className="text-sm text-gray-600 mt-1">Total Tasks</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-8 text-sm text-gray-600">
          <p>This is a read-only view of your projects.</p>
          <p>For questions or updates, please contact your project manager.</p>
        </div>
      </div>
    </div>
  )
}