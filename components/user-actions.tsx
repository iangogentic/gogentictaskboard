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
        className="p-1 rounded hover:bg-gray-100"
        disabled={loading}
      >
        <MoreVertical className="h-4 w-4 text-gray-500" />
      </button>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border z-20">
            <button
              onClick={() => {
                router.push(`/users/${userId}/edit`)
                setShowMenu(false)
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit User
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
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