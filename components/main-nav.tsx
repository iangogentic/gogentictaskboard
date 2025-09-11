'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  FolderOpen, 
  Users, 
  Briefcase,
  BarChart3,
  Clock,
  FileText,
  Settings
} from 'lucide-react'

const navItems = [
  {
    href: '/',
    label: 'Mission Control',
    icon: LayoutDashboard,
    description: 'Portfolio overview'
  },
  {
    href: '/projects',
    label: 'Projects',
    icon: FolderOpen,
    description: 'All projects'
  },
  {
    href: '/my-work',
    label: 'My Work',
    icon: Briefcase,
    description: 'Your tasks'
  },
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: BarChart3,
    description: 'Analytics & metrics'
  },
  {
    href: '/reports',
    label: 'Reports',
    icon: FileText,
    description: 'Detailed reports'
  },
  {
    href: '/activity',
    label: 'Activity',
    icon: Clock,
    description: 'Recent updates'
  },
  {
    href: '/team',
    label: 'Team',
    icon: Users,
    description: 'Team members'
  }
]

export default function MainNav() {
  const pathname = usePathname()

  return (
    <nav className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <img 
                src="/Gogentic.ai.png" 
                alt="Gogentic.ai" 
                className="h-10 w-auto"
              />
            </Link>
            
            <div className="hidden md:flex items-center space-x-1 ml-10">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || 
                  (item.href !== '/' && pathname.startsWith(item.href))
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors
                      ${isActive 
                        ? 'bg-indigo-50 text-indigo-700' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }
                    `}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Link
              href="/settings"
              className="p-2 text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-50"
              title="Settings"
            >
              <Settings className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="md:hidden border-t">
        <div className="grid grid-cols-3 gap-1 p-2">
          {navItems.slice(0, 6).map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || 
              (item.href !== '/' && pathname.startsWith(item.href))
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex flex-col items-center justify-center p-3 rounded-md text-xs transition-colors
                  ${isActive 
                    ? 'bg-indigo-50 text-indigo-700' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }
                `}
              >
                <Icon className="h-5 w-5 mb-1" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}