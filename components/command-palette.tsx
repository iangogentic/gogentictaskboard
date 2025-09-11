'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Search, Plus, Home, User, BarChart3, Settings, 
  FileText, Clock, CheckSquare, ArrowRight 
} from 'lucide-react'

interface CommandItem {
  id: string
  title: string
  description?: string
  icon: React.ReactNode
  action: () => void
  keywords?: string[]
}

export default function CommandPalette() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)

  const commands: CommandItem[] = [
    {
      id: 'home',
      title: 'Go to Home',
      description: 'View all projects',
      icon: <Home className="h-4 w-4" />,
      action: () => router.push('/'),
      keywords: ['projects', 'all', 'list']
    },
    {
      id: 'dashboard',
      title: 'Open Dashboard',
      description: 'View metrics and analytics',
      icon: <BarChart3 className="h-4 w-4" />,
      action: () => router.push('/dashboard'),
      keywords: ['metrics', 'analytics', 'stats']
    },
    {
      id: 'my-work',
      title: 'My Work',
      description: 'View your assigned tasks',
      icon: <User className="h-4 w-4" />,
      action: () => router.push('/my-work'),
      keywords: ['tasks', 'assigned', 'todo']
    },
    {
      id: 'new-project',
      title: 'Create New Project',
      description: 'Start a new project',
      icon: <Plus className="h-4 w-4" />,
      action: () => router.push('/projects/new'),
      keywords: ['add', 'create', 'new']
    },
    {
      id: 'search-projects',
      title: 'Search Projects',
      description: 'Find a specific project',
      icon: <Search className="h-4 w-4" />,
      action: () => {
        setIsOpen(false)
        document.querySelector<HTMLInputElement>('input[placeholder*="Search projects"]')?.focus()
      },
      keywords: ['find', 'search', 'filter']
    }
  ]

  const filteredCommands = commands.filter(cmd => {
    const searchLower = search.toLowerCase()
    return (
      cmd.title.toLowerCase().includes(searchLower) ||
      cmd.description?.toLowerCase().includes(searchLower) ||
      cmd.keywords?.some(k => k.toLowerCase().includes(searchLower))
    )
  })

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Open with Cmd/Ctrl + K
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault()
      setIsOpen(prev => !prev)
    }

    // Close with Escape
    if (e.key === 'Escape') {
      setIsOpen(false)
    }

    // Navigate with arrow keys
    if (isOpen) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < filteredCommands.length - 1 ? prev + 1 : 0
        )
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : filteredCommands.length - 1
        )
      }
      if (e.key === 'Enter' && filteredCommands[selectedIndex]) {
        e.preventDefault()
        filteredCommands[selectedIndex].action()
        setIsOpen(false)
        setSearch('')
      }
    }
  }, [isOpen, filteredCommands, selectedIndex])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  useEffect(() => {
    // Reset selection when search changes
    setSelectedIndex(0)
  }, [search])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={() => setIsOpen(false)}
      />

      {/* Command Palette */}
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-full max-w-2xl bg-bg rounded-lg shadow-2xl z-50">
        <div className="flex items-center border-b px-4 py-3">
          <Search className="h-5 w-5 text-muted mr-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Type a command or search..."
            className="flex-1 outline-none text-lg"
            autoFocus
          />
          <kbd className="px-2 py-1 text-xs bg-surface rounded border">ESC</kbd>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {filteredCommands.length === 0 ? (
            <div className="px-4 py-8 text-center text-muted">
              No commands found for "{search}"
            </div>
          ) : (
            <div className="py-2">
              {filteredCommands.map((cmd, index) => (
                <button
                  key={cmd.id}
                  onClick={() => {
                    cmd.action()
                    setIsOpen(false)
                    setSearch('')
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full px-4 py-3 flex items-center justify-between hover:bg-bg ${
                    index === selectedIndex ? 'bg-bg' : ''
                  }`}
                >
                  <div className="flex items-center">
                    <div className="mr-3 text-muted">{cmd.icon}</div>
                    <div className="text-left">
                      <div className="font-medium text-fg">{cmd.title}</div>
                      {cmd.description && (
                        <div className="text-sm text-muted">{cmd.description}</div>
                      )}
                    </div>
                  </div>
                  {index === selectedIndex && (
                    <ArrowRight className="h-4 w-4 text-muted" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="border-t px-4 py-2 flex items-center justify-between text-xs text-muted">
          <div className="flex items-center space-x-4">
            <span className="flex items-center">
              <kbd className="px-1.5 py-0.5 bg-surface rounded border mr-1">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-surface rounded border mr-1">↓</kbd>
              to navigate
            </span>
            <span className="flex items-center">
              <kbd className="px-1.5 py-0.5 bg-surface rounded border mr-1">↵</kbd>
              to select
            </span>
          </div>
          <span>
            Press <kbd className="px-1.5 py-0.5 bg-surface rounded border">⌘K</kbd> to open
          </span>
        </div>
      </div>
    </>
  )
}