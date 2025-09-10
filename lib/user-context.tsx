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
      
      // Set default user (Ian) or first user
      const defaultUser = data.find((u: User) => u.name === 'Ian') || data[0]
      setCurrentUser(defaultUser)
      
      // Store in localStorage for persistence
      if (defaultUser) {
        localStorage.setItem('currentUserId', defaultUser.id)
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