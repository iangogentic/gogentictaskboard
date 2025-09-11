'use client'

import { UserProvider } from '@/lib/user-context'
import { ToastProvider } from '@/providers/toast-provider'
import { SlimNav } from '@/components/navigation/slim-nav'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { prisma } from '@/lib/prisma'

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isSharePage = pathname?.startsWith('/share/')
  const [projects, setProjects] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    // Load data for Command-K palette
    const loadData = async () => {
      try {
        const res = await fetch('/api/navigation-data')
        if (res.ok) {
          const data = await res.json()
          setProjects(data.projects || [])
          setUsers(data.users || [])
          setCurrentUser(data.currentUser)
        }
      } catch (error) {
        console.error('Failed to load navigation data:', error)
      }
    }
    loadData()
  }, [])

  if (isSharePage) {
    return <ToastProvider>{children}</ToastProvider>
  }

  return (
    <UserProvider>
      <ToastProvider>
        <div className="min-h-screen bg-gray-50">
          <SlimNav 
            projects={projects}
            users={users}
            currentUser={currentUser}
          />
          <main>{children}</main>
        </div>
      </ToastProvider>
    </UserProvider>
  )
}