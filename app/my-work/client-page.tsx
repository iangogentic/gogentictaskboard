'use client'

import { useUser } from '@/lib/user-context'
import Link from 'next/link'
import { format } from 'date-fns'
import { Calendar } from 'lucide-react'
import type { Task, Project, User } from '@prisma/client'

type TaskWithRelations = Task & {
  project: Project & { pm: User }
  assignee: User | null
}

interface MyWorkClientPageProps {
  allTasks: TaskWithRelations[]
}

export default function MyWorkClientPage({ allTasks }: MyWorkClientPageProps) {
  const { currentUser, loading } = useUser()

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <p className="text-muted">Loading...</p>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <p className="text-muted">Please select a user from the dropdown above</p>
        </div>
      </div>
    )
  }

  const tasks = allTasks.filter(t => t.assigneeId === currentUser.id)

  const tasksByStatus = {
    Todo: tasks.filter(t => t.status === 'Todo'),
    Doing: tasks.filter(t => t.status === 'Doing'),
    Review: tasks.filter(t => t.status === 'Review'),
    Done: tasks.filter(t => t.status === 'Done'),
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-fg">My Tasks</h2>
        <p className="mt-1 text-sm text-muted">Tasks assigned to {currentUser.name}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {Object.entries(tasksByStatus).map(([status, statusTasks]) => (
          <div key={status} className="bg-white rounded-lg shadow-sm border">
            <div className="p-4 border-b bg-surface">
              <h3 className="font-medium text-sm text-fg">
                {status === 'Todo' ? 'To Do' : status === 'Doing' ? 'In Progress' : status}
                <span className="ml-2 text-muted">({statusTasks.length})</span>
              </h3>
            </div>
            
            <div className="p-4 space-y-3">
              {statusTasks.length === 0 ? (
                <p className="text-sm text-muted">No tasks</p>
              ) : (
                statusTasks.map(task => (
                  <Link
                    key={task.id}
                    href={`/projects/${task.project.id}?tab=tasks`}
                    className="block bg-surface rounded-lg p-3 hover:bg-surface transition-colors"
                  >
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-fg">{task.title}</p>
                      
                      <div className="text-xs text-muted">
                        <span className="font-medium">{task.project.title}</span>
                        <span className="mx-1">•</span>
                        <span>PM: {task.project.pm.name}</span>
                      </div>
                      
                      {task.notes && (
                        <p className="text-xs text-muted line-clamp-2">{task.notes}</p>
                      )}
                      
                      {task.dueDate && (
                        <div className="flex items-center text-xs text-muted">
                          <Calendar className="h-3 w-3 mr-1" />
                          Due {format(new Date(task.dueDate), 'MMM d, yyyy')}
                        </div>
                      )}
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-medium mb-4">Task Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-fg">{tasksByStatus.Todo.length}</div>
            <div className="text-sm text-muted">To Do</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{tasksByStatus.Doing.length}</div>
            <div className="text-sm text-muted">In Progress</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{tasksByStatus.Review.length}</div>
            <div className="text-sm text-muted">In Review</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{tasksByStatus.Done.length}</div>
            <div className="text-sm text-muted">Completed</div>
          </div>
        </div>
      </div>
    </div>
  )
}