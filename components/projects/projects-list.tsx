'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { ProjectRowCard } from '@/components/ui/project-row-card'
import { FilterBar } from '@/components/ui/filter-chip'
import { SavedViews, SavedView } from '@/components/ui/saved-views'
import { EmptyState } from '@/components/ui/empty-states'
import { ProjectCardSkeleton } from '@/components/ui/skeletons'
import { 
  Plus, GitBranch, AlertCircle, Clock, CheckCircle, 
  Users, Filter, Search 
} from 'lucide-react'

interface ProjectsListProps {
  projects: any[]
  users: any[]
  portfolios?: any[]
  loading?: boolean
}

export function ProjectsList({ projects, users, portfolios = [], loading = false }: ProjectsListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  const [customViews, setCustomViews] = useState<SavedView[]>([])
  const [currentViewId, setCurrentViewId] = useState<string>('all')

  // Filter configuration
  const filters = [
    // Portfolio filters
    ...portfolios.map(p => ({
      label: p.name,
      value: `portfolio:${p.id}`,
      icon: <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
    })),
    // Status filters
    { label: 'In Progress', value: 'status:In Progress', icon: <Clock className="w-3 h-3" /> },
    { label: 'Blocked', value: 'status:Blocked', icon: <AlertCircle className="w-3 h-3" /> },
    { label: 'Done', value: 'status:Done', icon: <CheckCircle className="w-3 h-3" /> },
    // Stage filters
    { label: 'Discovery', value: 'stage:Discovery', icon: <div className="w-3 h-3 bg-blue-500 rounded-full" /> },
    { label: 'Build', value: 'stage:Build', icon: <div className="w-3 h-3 bg-purple-500 rounded-full" /> },
    { label: 'Launch', value: 'stage:Launch', icon: <div className="w-3 h-3 bg-amber-500 rounded-full" /> },
    { label: 'Live', value: 'stage:Live', icon: <div className="w-3 h-3 bg-green-500 rounded-full" /> },
    { label: 'My Projects', value: 'mine', icon: <Users className="w-3 h-3" /> },
  ]

  // Parse active filters
  const filterCriteria = useMemo(() => {
    const criteria: any = {}
    activeFilters.forEach(filter => {
      const [key, value] = filter.split(':')
      if (key && value) {
        criteria[key] = value
      } else if (filter === 'mine') {
        criteria.mine = true
      }
    })
    return criteria
  }, [activeFilters])

  // Filter projects
  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        if (!project.title.toLowerCase().includes(query) &&
            !project.clientName.toLowerCase().includes(query) &&
            !project.branch.toLowerCase().includes(query)) {
          return false
        }
      }

      // Status filter
      if (filterCriteria.status && project.status !== filterCriteria.status) {
        return false
      }

      // Portfolio filter
      if (filterCriteria.portfolio && project.portfolioId !== filterCriteria.portfolio) {
        return false
      }

      // Stage filter
      if (filterCriteria.stage && project.stage !== filterCriteria.stage) {
        return false
      }

      // Branch filter (legacy)
      if (filterCriteria.branch && project.branch !== filterCriteria.branch) {
        return false
      }

      // My projects filter (would need current user context)
      if (filterCriteria.mine) {
        // This would filter by current user
      }

      return true
    })
  }, [projects, searchQuery, filterCriteria])

  // Prepare projects with computed fields
  const enrichedProjects = filteredProjects.map(project => ({
    ...project,
    taskCounts: {
      total: project.tasks?.length || 0,
      completed: project.tasks?.filter((t: any) => t.status === 'DONE').length || 0,
    }
  }))

  const handleFilterToggle = (value: string) => {
    setActiveFilters(prev =>
      prev.includes(value)
        ? prev.filter(f => f !== value)
        : [...prev, value]
    )
  }

  const handleViewChange = (view: SavedView) => {
    setCurrentViewId(view.id)
    // Apply view filters
    const newFilters: string[] = []
    if (view.filters.status) {
      newFilters.push(`status:${view.filters.status}`)
    }
    if (view.filters.branch) {
      newFilters.push(`branch:${view.filters.branch}`)
    }
    if (view.filters.assignedToMe) {
      newFilters.push('mine')
    }
    setActiveFilters(newFilters)
  }

  const handleQuickAction = (action: string, projectId: string) => {
    console.log('Quick action:', action, projectId)
    // Implement quick actions
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <ProjectCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Projects</h2>
          <p className="mt-1 text-sm text-gray-600">
            {filteredProjects.length} of {projects.length} projects
          </p>
        </div>
        <div className="flex items-center gap-3">
          <SavedViews
            views={customViews}
            currentViewId={currentViewId}
            onViewChange={handleViewChange}
            onSaveView={(name, filters) => {
              const newView: SavedView = {
                id: `custom-${Date.now()}`,
                name,
                filters,
                icon: <Filter className="w-4 h-4" />,
              }
              setCustomViews([...customViews, newView])
            }}
            onDeleteView={(id) => {
              setCustomViews(customViews.filter(v => v.id !== id))
            }}
          />
          <Link
            href="/projects/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Project
          </Link>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Filters */}
      <FilterBar
        filters={filters}
        activeFilters={activeFilters}
        onFilterToggle={handleFilterToggle}
        onClearAll={() => setActiveFilters([])}
        className="mb-6"
      />

      {/* Projects List */}
      {enrichedProjects.length === 0 ? (
        <EmptyState
          type={searchQuery || activeFilters.length > 0 ? 'search' : 'projects'}
          description={
            searchQuery || activeFilters.length > 0
              ? "Try adjusting your search or filters"
              : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          {enrichedProjects.map(project => (
            <ProjectRowCard
              key={project.id}
              project={project}
              onQuickAction={handleQuickAction}
            />
          ))}
        </div>
      )}
    </div>
  )
}