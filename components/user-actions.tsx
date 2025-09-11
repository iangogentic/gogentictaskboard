'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MoreVertical, Edit, Trash, UserX } from 'lucide-react'

interface UserActionsProps {
  userId: string
  userName: string
}

export default function UserActions({ userId, userName }: UserActionsProps) {
  const router = useRouter()
  const [showMenu, setShowMenu] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to remove ${userName}? This will unassign them from all projects and tasks.`)) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete user')
      }

      router.refresh()
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Failed to delete user')
    } finally {
      setLoading(false)
      setShowMenu(false)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="p-1 rounded hover:bg-surface"
        disabled={loading}
      >
        <MoreVertical className="h-4 w-4 text-muted" />
      </button>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-0 mt-1 w-48 bg-bg rounded-md shadow-lg border z-20">
            <button
              onClick={() => {
                router.push(`/users/${userId}/edit`)
                setShowMenu(false)
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-fg hover:bg-surface"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit User
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center w-full px-4 py-2 text-sm text-danger hover:bg-red-50"
            >
              <UserX className="h-4 w-4 mr-2" />
              Remove User
            </button>
          </div>
        </>
      )}
    </div>
  )
}