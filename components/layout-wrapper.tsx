'use client'

import { UserProvider } from '@/lib/user-context'
import UserSwitcher from './user-switcher'
import CommandPalette from './command-palette'
import NotificationCenter from './notifications'
import MainNav from './main-nav'
import Link from 'next/link'
import { Plus, Command } from 'lucide-react'
import { usePathname } from 'next/navigation'

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isSharePage = pathname?.startsWith('/share/')

  if (isSharePage) {
    return <>{children}</>
  }

  return (
    <UserProvider>
      <div className="min-h-screen bg-gray-50">
        <MainNav />
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-12">
              <div className="flex items-center space-x-4">
                <NotificationCenter />
                <button className="flex items-center px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 border rounded-md hover:bg-gray-50">
                  <Command className="h-4 w-4 mr-1" />
                  <kbd className="font-mono text-xs">⌘K</kbd>
                </button>
              </div>
              <div className="flex items-center space-x-4">
                <UserSwitcher />
                {pathname === '/' && (
                  <Link 
                    href="/projects/new"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    New Project
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
        <div>{children}</div>
        <CommandPalette />
      </div>
    </UserProvider>
  )
}