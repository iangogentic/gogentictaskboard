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
    label: 'Projects',
    icon: FolderOpen,
    description: 'All projects'
  },
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    description: 'Metrics & insights'
  },
  {
    href: '/my-work',
    label: 'My Work',
    icon: Briefcase,
    description: 'Your tasks'
  },
  {
    href: '/users',
    label: 'Team',
    icon: Users,
    description: 'Team members'
  },
  {
    href: '/activity',
    label: 'Activity',
    icon: Clock,
    description: 'Recent updates'
  },
  {
    href: '/reports',
    label: 'Reports',
    icon: BarChart3,
    description: 'Analytics'
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
              <div className="flex items-center">
                {/* Network graph representation */}
                <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" className="mr-2">
                  <g fill="none" stroke="#4B5563" strokeWidth="1.5">
                    <line x1="5" y1="20" x2="12" y2="10" />
                    <line x1="5" y1="20" x2="12" y2="30" />
                    <line x1="12" y1="10" x2="20" y2="8" />
                    <line x1="12" y1="10" x2="20" y2="20" />
                    <line x1="12" y1="30" x2="20" y2="20" />
                    <line x1="20" y1="20" x2="28" y2="15" />
                    <line x1="20" y1="20" x2="28" y2="25" />
                    <line x1="28" y1="15" x2="35" y2="20" />
                    <line x1="5" y1="20" x2="20" y2="32" />
                    <line x1="20" y1="32" x2="35" y2="20" />
                  </g>
                  <g fill="#4B5563">
                    <circle cx="5" cy="20" r="3" />
                    <circle cx="12" cy="10" r="2" />
                    <circle cx="12" cy="30" r="2" />
                    <circle cx="20" cy="20" r="4" />
                    <circle cx="20" cy="8" r="2" />
                    <circle cx="28" cy="15" r="3" />
                    <circle cx="28" cy="25" r="2" />
                    <circle cx="35" cy="20" r="2" />
                    <circle cx="20" cy="32" r="3" />
                  </g>
                </svg>
                <span className="text-xl font-semibold">
                  <span className="text-gray-800">Gogentic</span>
                  <span className="text-gray-500">.ai</span>
                </span>
              </div>
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