'use client'

import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Calendar, User, Edit2, Trash2, X, Check } from 'lucide-react'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'
import type { Task, User as UserType } from '@prisma/client'

type TaskWithAssignee = Task & { assignee: UserType | null }

interface SortableTaskProps {
  task: TaskWithAssignee
  users?: UserType[]
}

export default function SortableTask({ task, users }: SortableTaskProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [editedTitle, setEditedTitle] = useState(task.title)
  const [editedNotes, setEditedNotes] = useState(task.notes || '')
  const [editedAssigneeId, setEditedAssigneeId] = useState(task.assigneeId || '')
  const [isDeleting, setIsDeleting] = useState(false)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: task.id,
    data: {
      type: 'task',
      task
    }
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const handleEdit = async () => {
    if (!editedTitle.trim()) return

    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editedTitle,
          notes: editedNotes || null,
          assigneeId: editedAssigneeId || null,
        }),
      })

      if (response.ok) {
        setIsEditing(false)
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to update task:', error)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this task?')) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to delete task:', error)
      setIsDeleting(false)
    }
  }

  if (isEditing) {
    return (
      <div className="bg-white rounded-lg p-3 shadow-sm border">
        <div className="space-y-2">
          <input
            type="text"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
            autoFocus
          />
          <textarea
            value={editedNotes}
            onChange={(e) => setEditedNotes(e.target.value)}
            placeholder="Notes (optional)"
            className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
            rows={2}
          />
          {users && (
            <select
              value={editedAssigneeId}
              onChange={(e) => setEditedAssigneeId(e.target.value)}
              className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Unassigned</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          )}
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => {
                setIsEditing(false)
                setEditedTitle(task.title)
                setEditedNotes(task.notes || '')
                setEditedAssigneeId(task.assigneeId || '')
              }}
              className="p-1 text-gray-500 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
            </button>
            <button
              onClick={handleEdit}
              className="p-1 text-green-600 hover:text-green-700"
            >
              <Check className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-lg p-3 shadow-sm border hover:shadow-md transition-shadow group ${isDeleting ? 'opacity-50' : ''}`}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1" {...attributes} {...listeners}>
          <p className="text-sm font-medium text-gray-900 cursor-grab">{task.title}</p>
        </div>
        <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setIsEditing(true)}
            className="p-1 text-gray-500 hover:text-indigo-600"
          >
            <Edit2 className="h-3 w-3" />
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-1 text-gray-500 hover:text-red-600"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>
      
      {task.notes && (
        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{task.notes}</p>
      )}
      
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center space-x-2">
          {task.assignee && (
            <div className="flex items-center">
              <div className="h-6 w-6 rounded-full bg-gray-300 flex items-center justify-center text-xs font-medium text-gray-700">
                {task.assignee.name.slice(0, 2).toUpperCase()}
              </div>
            </div>
          )}
          
          {task.dueDate && (
            <div className="flex items-center text-xs text-gray-500">
              <Calendar className="h-3 w-3 mr-1" />
              {format(new Date(task.dueDate), 'MMM d')}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}