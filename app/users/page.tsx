import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ArrowLeft, Plus, Mail, Calendar, Briefcase, Clock } from 'lucide-react'
import { format } from 'date-fns'
import UserActions from '@/components/user-actions'

export const revalidate = 60

async function getUsers() {
  const users = await prisma.user.findMany({
    include: {
      projectsAsPM: {
        select: {
          id: true,
          title: true,
          status: true
        }
      },
      projectsAsDev: {
        select: {
          id: true,
          title: true,
          status: true
        }
      },
      tasks: {
        select: {
          id: true,
          title: true,
          status: true
        }
      },
      _count: {
        select: {
          projectsAsPM: true,
          projectsAsDev: true,
          tasks: true,
          updates: true
        }
      }
    },
    orderBy: {
      name: 'asc'
    }
  })
  return users
}

export default async function UsersPage() {
  const users = await getUsers()

  return (
    <div className="min-h-screen bg-surface">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="flex items-center text-muted hover:text-fg"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Link>
              <div className="border-l pl-4">
                <h1 className="text-xl font-semibold">Team Members</h1>
              </div>
            </div>
            <Link
              href="/users/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add User
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user) => {
            // Get unique active projects (user might be both PM and developer on same project)
            const projectMap = new Map()
            user.projectsAsPM.filter(p => p.status === 'IN_PROGRESS').forEach(p => {
              projectMap.set(p.id, p)
            })
            user.projectsAsDev.filter(p => p.status === 'IN_PROGRESS').forEach(p => {
              projectMap.set(p.id, p)
            })
            const activeProjects = Array.from(projectMap.values())
            const activeTasks = user.tasks.filter(t => t.status !== 'Done')
            
            return (
              <div key={user.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-fg">{user.name}</h3>
                      <div className="flex items-center text-sm text-muted mt-1">
                        <Mail className="h-3 w-3 mr-1" />
                        {user.email}
                      </div>
                    </div>
                    <UserActions userId={user.id} userName={user.name || 'Unknown'} />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted">Projects (PM)</span>
                      <span className="font-medium">{user._count.projectsAsPM}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted">Projects (Dev)</span>
                      <span className="font-medium">{user._count.projectsAsDev}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted">Active Tasks</span>
                      <span className="font-medium">{activeTasks.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted">Updates</span>
                      <span className="font-medium">{user._count.updates}</span>
                    </div>
                  </div>

                  {activeProjects.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-xs text-muted mb-2">Active Projects</p>
                      <div className="space-y-1">
                        {activeProjects.slice(0, 3).map(project => (
                          <Link
                            key={project.id}
                            href={`/projects/${project.id}`}
                            className="block text-sm text-indigo-600 hover:text-indigo-900 truncate"
                          >
                            {project.title}
                          </Link>
                        ))}
                        {activeProjects.length > 3 && (
                          <p className="text-xs text-muted">+{activeProjects.length - 3} more</p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t flex items-center justify-between text-xs text-muted">
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      Joined {format(new Date(user.createdAt), 'MMM yyyy')}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {users.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm border">
            <p className="text-muted">No users found</p>
          </div>
        )}
      </div>
    </div>
  )
}
