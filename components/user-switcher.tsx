'use client'

import { useUser } from '@/lib/user-context'
import { User } from 'lucide-react'

export default function UserSwitcher() {
  const { currentUser, setCurrentUser, users, loading } = useUser()

  if (loading) {
    return (
      <div className="flex items-center space-x-2 text-sm text-muted">
        <User className="h-4 w-4" />
        <span>Loading...</span>
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-2">
      <label className="text-sm text-muted">Logged in as:</label>
      <select
        value={currentUser?.id || ''}
        onChange={(e) => {
          const user = users.find(u => u.id === e.target.value)
          if (user) setCurrentUser(user)
        }}
        className="text-sm font-medium px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        {users.map(user => (
          <option key={user.id} value={user.id}>
            {user.name}
          </option>
        ))}
      </select>
    </div>
  )
}