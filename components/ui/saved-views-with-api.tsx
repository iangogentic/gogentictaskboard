'use client'

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { 
  ChevronDown, Save, Share2, Trash2, Eye, Plus,
  Filter, Clock, Users, AlertCircle, Palette
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SavedView {
  id: string
  name: string
  icon?: React.ReactNode
  filters: Record<string, any>
  sortBy?: string
  sortOrder?: string
  isDefault?: boolean
  isShared?: boolean
  viewType?: string
}

interface SavedViewsWithApiProps {
  userId: string
  viewType: string
  currentViewId?: string
  onViewChange: (view: SavedView) => void
  className?: string
}

const getDefaultViews = (viewType: string): SavedView[] => {
  if (viewType === 'projects') {
    return [
      {
        id: 'all',
        name: 'All Projects',
        icon: <Eye className="w-4 h-4" />,
        filters: {},
        isDefault: true,
      },
      {
        id: 'my-projects',
        name: 'My Projects',
        icon: <Users className="w-4 h-4" />,
        filters: { assignedToMe: true },
        isDefault: true,
      },
      {
        id: 'blocked',
        name: 'Blocked',
        icon: <AlertCircle className="w-4 h-4" />,
        filters: { status: 'Blocked' },
        isDefault: true,
      },
      {
        id: 'this-week',
        name: 'Due This Week',
        icon: <Clock className="w-4 h-4" />,
        filters: { dueThisWeek: true },
        isDefault: true,
      },
    ]
  }
  return []
}

export function SavedViewsWithApi({
  userId,
  viewType,
  currentViewId,
  onViewChange,
  className,
}: SavedViewsWithApiProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [showSaveDialog, setShowSaveDialog] = React.useState(false)
  const [newViewName, setNewViewName] = React.useState('')
  const [customViews, setCustomViews] = React.useState<SavedView[]>([])
  const [loading, setLoading] = React.useState(true)
  const searchParams = useSearchParams()
  const router = useRouter()

  // Load saved views from API
  React.useEffect(() => {
    fetchSavedViews()
  }, [userId, viewType])

  const fetchSavedViews = async () => {
    try {
      const response = await fetch(`/api/saved-views?userId=${userId}&viewType=${viewType}`)
      if (response.ok) {
        const data = await response.json()
        const views = data.map((v: any) => ({
          id: v.id,
          name: v.name,
          filters: v.filters,
          sortBy: v.sortBy,
          sortOrder: v.sortOrder,
          icon: <Filter className="w-4 h-4" />,
        }))
        setCustomViews(views)
      }
    } catch (error) {
      console.error('Failed to fetch saved views:', error)
    } finally {
      setLoading(false)
    }
  }

  const defaultViews = getDefaultViews(viewType)
  const allViews = [...defaultViews, ...customViews]
  const currentView = allViews.find(v => v.id === currentViewId) || defaultViews[0]

  const handleViewChange = (view: SavedView) => {
    setIsOpen(false)
    onViewChange(view)
    
    // Update URL with view filters
    const params = new URLSearchParams(searchParams)
    
    // Clear existing filter params
    Array.from(params.keys()).forEach(key => {
      if (key.startsWith('filter_') || key === 'status' || key === 'portfolio' || key === 'stage') {
        params.delete(key)
      }
    })
    
    // Add new filter params
    Object.keys(view.filters).forEach(key => {
      if (view.filters[key]) {
        params.set(key, String(view.filters[key]))
      }
    })
    
    if (view.sortBy) params.set('sortBy', view.sortBy)
    if (view.sortOrder) params.set('sortOrder', view.sortOrder)
    
    router.push(`?${params.toString()}`)
  }

  const handleSaveCurrentView = async () => {
    if (!newViewName) return
    
    const currentFilters = Object.fromEntries(searchParams.entries())
    
    try {
      const response = await fetch('/api/saved-views', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          name: newViewName,
          viewType,
          filters: currentFilters,
          sortBy: currentFilters.sortBy,
          sortOrder: currentFilters.sortOrder,
        })
      })
      
      if (response.ok) {
        const newView = await response.json()
        setCustomViews([...customViews, {
          id: newView.id,
          name: newView.name,
          filters: newView.filters,
          sortBy: newView.sortBy,
          sortOrder: newView.sortOrder,
          icon: <Filter className="w-4 h-4" />,
        }])
        setNewViewName('')
        setShowSaveDialog(false)
      }
    } catch (error) {
      console.error('Failed to save view:', error)
    }
  }

  const handleDeleteView = async (viewId: string) => {
    try {
      const response = await fetch(`/api/saved-views?id=${viewId}&userId=${userId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setCustomViews(customViews.filter(v => v.id !== viewId))
        if (currentViewId === viewId) {
          handleViewChange(defaultViews[0])
        }
      }
    } catch (error) {
      console.error('Failed to delete view:', error)
    }
  }

  if (loading) {
    return (
      <div className={cn('animate-pulse', className)}>
        <div className="h-10 w-32 bg-gray-200 rounded-lg" />
      </div>
    )
  }

  return (
    <div className={cn('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        {currentView.icon}
        <span className="font-medium">{currentView.name}</span>
        <ChevronDown className={cn(
          'w-4 h-4 transition-transform',
          isOpen && 'rotate-180'
        )} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-40">
            <div className="p-2 max-h-80 overflow-y-auto">
              {defaultViews.length > 0 && (
                <>
                  <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase">
                    Default Views
                  </div>
                  {defaultViews.map((view) => (
                    <div
                      key={view.id}
                      className={cn(
                        'flex items-center justify-between px-3 py-2 rounded-md cursor-pointer',
                        currentViewId === view.id
                          ? 'bg-blue-50 text-blue-700'
                          : 'hover:bg-gray-50'
                      )}
                      onClick={() => handleViewChange(view)}
                    >
                      <div className="flex items-center gap-2">
                        {view.icon}
                        <span className="text-sm font-medium">{view.name}</span>
                      </div>
                    </div>
                  ))}
                </>
              )}
              
              {customViews.length > 0 && (
                <>
                  <div className="px-3 py-1 mt-2 text-xs font-semibold text-gray-500 uppercase">
                    Saved Views
                  </div>
                  {customViews.map((view) => (
                    <div
                      key={view.id}
                      className={cn(
                        'group flex items-center justify-between px-3 py-2 rounded-md cursor-pointer',
                        currentViewId === view.id
                          ? 'bg-blue-50 text-blue-700'
                          : 'hover:bg-gray-50'
                      )}
                      onClick={() => handleViewChange(view)}
                    >
                      <div className="flex items-center gap-2">
                        {view.icon}
                        <span className="text-sm font-medium">{view.name}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteView(view.id)
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 transition-opacity"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </>
              )}
            </div>
            
            <div className="border-t border-gray-200 p-2">
              <button
                onClick={() => setShowSaveDialog(true)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md"
              >
                <Plus className="w-4 h-4" />
                Save current filters
              </button>
            </div>
          </div>
        </>
      )}

      {showSaveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowSaveDialog(false)}
          />
          <div className="relative bg-white rounded-lg p-6 w-96 shadow-xl">
            <h3 className="text-lg font-semibold mb-4">Save View</h3>
            <input
              type="text"
              value={newViewName}
              onChange={(e) => setNewViewName(e.target.value)}
              placeholder="View name..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveCurrentView()
              }}
            />
            <div className="flex items-center gap-2 mt-4">
              <button
                onClick={handleSaveCurrentView}
                disabled={!newViewName}
                className={cn(
                  'flex-1 py-2 rounded-lg font-medium transition-colors',
                  newViewName
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                )}
              >
                Save View
              </button>
              <button
                onClick={() => {
                  setShowSaveDialog(false)
                  setNewViewName('')
                }}
                className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}