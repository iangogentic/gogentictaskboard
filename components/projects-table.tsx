'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { Search, Calendar, Users, Clock, ChevronRight, Download, Archive, ArchiveRestore } from 'lucide-react'
import { getStatusColor, getBranchColor } from '@/lib/utils'
import { exportToCSV, prepareProjectsForExport } from '@/lib/export-utils'
import type { Project, User, Task, Update } from '@prisma/client'

type ProjectWithRelations = Project & {
  pm: User
  developers: User[]
  tasks: Task[]
  updates: Update[]
}

interface ProjectsTableProps {
  projects: ProjectWithRelations[]
  users: User[]
}

export default function ProjectsTable({ projects, users }: ProjectsTableProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [branchFilter, setBranchFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [pmFilter, setPmFilter] = useState<string>('all')
  const [devFilter, setDevFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'status' | 'progress'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [showArchived, setShowArchived] = useState(false)

  const filteredAndSortedProjects = useMemo(() => {
    const filtered = projects.filter(project => {
      const matchesSearch = searchQuery === '' || 
        project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.pm.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.developers.some(dev => dev.name.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesBranch = branchFilter === 'all' || project.branch === branchFilter
      const matchesStatus = statusFilter === 'all' || project.status === statusFilter
      const matchesPM = pmFilter === 'all' || project.pmId === pmFilter
      const matchesDev = devFilter === 'all' || project.developers.some(dev => dev.id === devFilter)
      const matchesArchived = showArchived ? project.archived : !project.archived

      return matchesSearch && matchesBranch && matchesStatus && matchesPM && matchesDev && matchesArchived
    })

    // Sort the filtered projects
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title)
          break
        case 'status':
          comparison = a.status.localeCompare(b.status)
          break
        case 'progress':
          const aProgress = a.tasks.length > 0 ? a.tasks.filter(t => t.status === 'Done').length / a.tasks.length : 0
          const bProgress = b.tasks.length > 0 ? b.tasks.filter(t => t.status === 'Done').length / b.tasks.length : 0
          comparison = aProgress - bProgress
          break
        case 'date':
        default:
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
      }
      
      return sortOrder === 'asc' ? comparison : -comparison
    })

    return sorted
  }, [projects, searchQuery, branchFilter, statusFilter, pmFilter, devFilter, sortBy, sortOrder])

  const getTaskCounts = (tasks: Task[]) => {
    const counts = {
      todo: tasks.filter(t => t.status === 'Todo').length,
      doing: tasks.filter(t => t.status === 'Doing').length,
      review: tasks.filter(t => t.status === 'Review').length,
      done: tasks.filter(t => t.status === 'Done').length,
    }
    return counts
  }

  const handleExport = () => {
    const dataToExport = prepareProjectsForExport(filteredAndSortedProjects)
    exportToCSV(dataToExport, 'projects')
  }

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="space-y-4">
          {/* Search and primary filters */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
              <input
                type="text"
                placeholder="Search projects, clients, PMs, or developers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Branches</option>
              <option value="CORTEX">Cortex</option>
              <option value="SOLUTIONS">Solutions</option>
              <option value="FISHER">Fisher</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Status</option>
              <option value="NOT_STARTED">Not Started</option>
              <option value="PLANNING">Planning</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="REVIEW">Review</option>
              <option value="BLOCKED">Blocked</option>
              <option value="COMPLETED">Completed</option>
            </select>

            <select
              value={pmFilter}
              onChange={(e) => setPmFilter(e.target.value)}
              className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All PMs</option>
              {users.filter(u => projects.some(p => p.pmId === u.id)).map(user => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
          </div>

          {/* Additional filters and sorting */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <select
              value={devFilter}
              onChange={(e) => setDevFilter(e.target.value)}
              className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Developers</option>
              {users.filter(u => projects.some(p => p.developers.some(d => d.id === u.id))).map(user => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="date">Sort by Date</option>
              <option value="title">Sort by Title</option>
              <option value="status">Sort by Status</option>
              <option value="progress">Sort by Progress</option>
            </select>

            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>

            <div className="md:col-span-2 flex items-center justify-between">
              <span className="text-sm text-muted">
                Showing {filteredAndSortedProjects.length} of {projects.length} projects
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleExport}
                  className="inline-flex items-center px-3 py-2 border border-border text-sm font-medium rounded-md text-fg-muted bg-white hover:bg-surface"
                  title="Export to CSV"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Export
                </button>
                <Link
                  href="/projects/new"
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  New Project
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-surface">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                Project
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                Branch
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                PM
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                Developers
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                Tasks
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                Dates
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                Last Update
              </th>
              <th className="relative px-6 py-3">
                <span className="sr-only">View</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-border">
            {filteredAndSortedProjects.map((project) => {
              const taskCounts = getTaskCounts(project.tasks)
              const lastUpdate = project.updates[0]
              
              return (
                <tr key={project.id} className="hover:bg-surface cursor-pointer" onClick={() => router.push(`/projects/${project.id}`)}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <Link href={`/projects/${project.id}`} className="text-sm font-medium text-indigo-600 hover:text-indigo-900">
                        {project.title}
                      </Link>
                      <div className="text-sm text-muted">{project.clientName}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getBranchColor(project.branch)}`}>
                      {project.branch}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-fg">
                    {project.pm.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex -space-x-2">
                      {project.developers.slice(0, 3).map((dev) => (
                        <div
                          key={dev.id}
                          className="h-8 w-8 rounded-full bg-border flex items-center justify-center text-xs font-medium text-fg-muted border-2 border-white"
                          title={dev.name}
                        >
                          {dev.name.slice(0, 2).toUpperCase()}
                        </div>
                      ))}
                      {project.developers.length > 3 && (
                        <div className="h-8 w-8 rounded-full bg-border flex items-center justify-center text-xs font-medium text-fg-muted border-2 border-white">
                          +{project.developers.length - 3}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(project.status)}`}>
                      {project.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">
                    <div className="flex space-x-2 text-xs">
                      <span>{taskCounts.todo} todo</span>
                      <span>{taskCounts.doing} doing</span>
                      <span>{taskCounts.done} done</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">
                    <div className="space-y-1">
                      {project.startDate && (
                        <div className="flex items-center text-xs">
                          <Calendar className="h-3 w-3 mr-1" />
                          {format(new Date(project.startDate), 'MMM d')}
                        </div>
                      )}
                      {project.targetDelivery && (
                        <div className="flex items-center text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          {format(new Date(project.targetDelivery), 'MMM d')}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted">
                    {lastUpdate ? (
                      <div className="max-w-xs">
                        <div className="text-xs text-muted">
                          {format(new Date(lastUpdate.createdAt), 'MMM d, h:mm a')}
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted">No updates</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      href={`/projects/${project.id}`}
                      className="text-indigo-600 hover:text-indigo-900 flex items-center"
                    >
                      View
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        
        {filteredAndSortedProjects.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted">No projects found matching your filters.</p>
          </div>
        )}
      </div>
    </div>
  )
}