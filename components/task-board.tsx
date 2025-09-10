'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Calendar, User, X } from 'lucide-react'
import { format } from 'date-fns'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import SortableTask from './sortable-task'
import type { Project, Task, User as UserType } from '@prisma/client'

type TaskWithAssignee = Task & { assignee: UserType | null }
type ProjectWithTasks = Project & { tasks: TaskWithAssignee[] }

interface TaskBoardProps {
  project: ProjectWithTasks
  users: UserType[]
}

const COLUMNS = [
  { id: 'Todo', title: 'To Do' },
  { id: 'Doing', title: 'In Progress' },
  { id: 'Review', title: 'Review' },
  { id: 'Done', title: 'Done' },
]

export default function TaskBoard({ project, users }: TaskBoardProps) {
  const router = useRouter()
  const [tasks, setTasks] = useState(project.tasks)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [addingTask, setAddingTask] = useState<string | null>(null)
  const [newTaskTitle, setNewTaskTitle] = useState('')

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const taskId = active.id as string
    const newStatus = over.id as string

    if (!COLUMNS.some(col => col.id === newStatus)) return

    const task = tasks.find(t => t.id === taskId)
    if (!task || task.status === newStatus) return

    // Optimistically update UI
    setTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, status: newStatus } : t
    ))

    // Update in database
    const response = await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })

    if (response.ok) {
      router.refresh()
    }
  }

  const getTasksByStatus = (status: string) => {
    return tasks.filter(task => task.status === status)
  }

  const activeTask = activeId ? tasks.find(t => t.id === activeId) : null

  const handleAddTask = async (status: string) => {
    if (!newTaskTitle.trim()) return

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          title: newTaskTitle,
          status,
          order: getTasksByStatus(status).length,
        }),
      })

      if (response.ok) {
        setNewTaskTitle('')
        setAddingTask(null)
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to add task:', error)
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-4 gap-4">
        {COLUMNS.map(column => {
          const columnTasks = getTasksByStatus(column.id)
          
          return (
            <div key={column.id} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-sm text-gray-900">
                  {column.title}
                  <span className="ml-2 text-gray-500">({columnTasks.length})</span>
                </h3>
                <button 
                  onClick={() => setAddingTask(column.id)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              
              <SortableContext
                items={columnTasks.map(t => t.id)}
                strategy={verticalListSortingStrategy}
                id={column.id}
              >
                <div className="space-y-2 min-h-[200px]">
                  {addingTask === column.id && (
                    <div className="bg-white rounded-lg p-3 shadow-sm border">
                      <input
                        type="text"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleAddTask(column.id)
                          } else if (e.key === 'Escape') {
                            setAddingTask(null)
                            setNewTaskTitle('')
                          }
                        }}
                        placeholder="Task title..."
                        className="w-full text-sm px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        autoFocus
                      />
                      <div className="flex justify-end space-x-2 mt-2">
                        <button
                          onClick={() => {
                            setAddingTask(null)
                            setNewTaskTitle('')
                          }}
                          className="text-xs text-gray-500 hover:text-gray-700"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleAddTask(column.id)}
                          className="text-xs bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  )}
                  {columnTasks.map(task => (
                    <SortableTask key={task.id} task={task} users={users} />
                  ))}
                </div>
              </SortableContext>
            </div>
          )
        })}
      </div>

      <DragOverlay>
        {activeTask && (
          <div className="bg-white rounded-lg p-3 shadow-lg border cursor-grabbing">
            <p className="text-sm font-medium text-gray-900">{activeTask.title}</p>
            {activeTask.assignee && (
              <div className="flex items-center mt-2">
                <div className="h-6 w-6 rounded-full bg-gray-300 flex items-center justify-center text-xs font-medium text-gray-700">
                  {activeTask.assignee.name.slice(0, 2).toUpperCase()}
                </div>
              </div>
            )}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}