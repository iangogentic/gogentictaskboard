'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface User {
  id: string
  name: string
  email: string
}

interface UserContextType {
  currentUser: User | null
  setCurrentUser: (user: User | null) => void
  users: User[]
  loading: boolean
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      const data = await response.json()
      setUsers(data)
      
      // Don't auto-set a user - let auth handle this
      // Check if there's a stored user ID from previous session
      const storedUserId = localStorage.getItem('currentUserId')
      if (storedUserId) {
        const storedUser = data.find((u: User) => u.id === storedUserId)
        if (storedUser) {
          setCurrentUser(storedUser)
        }
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateCurrentUser = (user: User | null) => {
    setCurrentUser(user)
    if (user) {
      localStorage.setItem('currentUserId', user.id)
    } else {
      localStorage.removeItem('currentUserId')
    }
  }

  return (
    <UserContext.Provider value={{ 
      currentUser, 
      setCurrentUser: updateCurrentUser, 
      users, 
      loading 
    }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}