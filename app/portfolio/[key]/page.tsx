'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Filter, Search, MoreVertical, Activity, AlertCircle, CheckCircle, Clock, Users, TrendingUp, Target } from 'lucide-react'

interface Portfolio {
  id: string
  key: string
  name: string
  color: string
  description: string
}

interface Project {
  id: string
  title: string
  stage: string
  health: string
  status: string
  pmId: string
  pm: { name: string; email: string }
  developers: { id: string; name: string }[]
  targetDelivery: string | null
  clientName: string
  _count: { tasks: number }
}

export default function PortfolioDashboard({ params }: { params: Promise<{ key: string }> }) {
  const router = useRouter()
  const [portfolioKey, setPortfolioKey] = useState<string | null>(null)
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [stageFilter, setStageFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    params.then(p => setPortfolioKey(p.key))
  }, [params])

  useEffect(() => {
    if (portfolioKey) {
      fetchPortfolioData()
    }
  }, [portfolioKey])

  useEffect(() => {
    filterProjects()
  }, [projects, searchTerm, stageFilter, statusFilter])

  const fetchPortfolioData = async () => {
    if (!portfolioKey) return
    try {
      const response = await fetch(`/api/portfolio/${portfolioKey}`)
      const data = await response.json()
      setPortfolio(data.portfolio)
      setProjects(data.projects)
      setFilteredProjects(data.projects)
    } catch (error) {
      console.error('Failed to fetch portfolio data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterProjects = () => {
    let filtered = [...projects]

    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.clientName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (stageFilter !== 'all') {
      filtered = filtered.filter(p => p.stage === stageFilter)
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter)
    }

    setFilteredProjects(filtered)
  }

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'Discovery': return 'bg-blue-100 text-blue-800'
      case 'Build': return 'bg-purple-100 text-purple-800'
      case 'Launch': return 'bg-amber-100 text-amber-800'
      case 'Live': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'Green': return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'Amber': return <AlertCircle className="w-4 h-4 text-amber-600" />
      case 'Red': return <AlertCircle className="w-4 h-4 text-red-600" />
      default: return <Activity className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Not Started': return 'text-gray-600'
      case 'In Progress': return 'text-blue-600'
      case 'Review': return 'text-purple-600'
      case 'Blocked': return 'text-red-600'
      case 'Done': return 'text-green-600'
      default: return 'text-gray-600'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading portfolio...</p>
        </div>
      </div>
    )
  }

  if (!portfolio) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Portfolio not found</p>
          <Link href="/" className="mt-4 text-indigo-600 hover:text-indigo-700">
            Back to Mission Control
          </Link>
        </div>
      </div>
    )
  }

  // Calculate stats
  const stats = {
    total: projects.length,
    discovery: projects.filter(p => p.stage === 'Discovery').length,
    build: projects.filter(p => p.stage === 'Build').length,
    launch: projects.filter(p => p.stage === 'Launch').length,
    live: projects.filter(p => p.stage === 'Live').length,
    blocked: projects.filter(p => p.status === 'Blocked').length,
    tasksTotal: projects.reduce((sum, p) => sum + p._count.tasks, 0)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link
                href="/"
                className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Mission Control
              </Link>
              <div className="flex items-center">
                <div 
                  className="w-2 h-8 rounded-full mr-3"
                  style={{ backgroundColor: portfolio.color }}
                />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{portfolio.name}</h1>
                  <p className="text-sm text-gray-600 mt-1">{portfolio.description}</p>
                </div>
              </div>
            </div>
            <Link
              href="/projects/new"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white"
              style={{ backgroundColor: portfolio.color }}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-sm text-gray-500">Total</div>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-sm text-gray-500">Discovery</div>
            <div className="text-2xl font-bold text-blue-600">{stats.discovery}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-sm text-gray-500">Build</div>
            <div className="text-2xl font-bold text-purple-600">{stats.build}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-sm text-gray-500">Launch</div>
            <div className="text-2xl font-bold text-amber-600">{stats.launch}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-sm text-gray-500">Live</div>
            <div className="text-2xl font-bold text-green-600">{stats.live}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-sm text-gray-500">Blocked</div>
            <div className="text-2xl font-bold text-red-600">{stats.blocked}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-sm text-gray-500">Tasks</div>
            <div className="text-2xl font-bold text-gray-900">{stats.tasksTotal}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="px-6 py-4 border-b">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search projects..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <select
                  value={stageFilter}
                  onChange={(e) => setStageFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">All Stages</option>
                  <option value="Discovery">Discovery</option>
                  <option value="Build">Build</option>
                  <option value="Launch">Launch</option>
                  <option value="Live">Live</option>
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">All Status</option>
                  <option value="Not Started">Not Started</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Review">Review</option>
                  <option value="Blocked">Blocked</option>
                  <option value="Done">Done</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 hover:text-indigo-600">
                    {project.title}
                  </h3>
                  <div className="flex items-center">
                    {getHealthIcon(project.health)}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mb-3">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStageColor(project.stage)}`}>
                    {project.stage}
                  </span>
                  <span className={`text-xs font-medium ${getStatusColor(project.status)}`}>
                    {project.status}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Client</span>
                    <span className="text-gray-900">{project.clientName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">PM</span>
                    <span className="text-gray-900">{project.pm.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Team</span>
                    <span className="text-gray-900">{project.developers.length} devs</span>
                  </div>
                  {project.targetDelivery && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Due</span>
                      <span className="text-gray-900">
                        {new Date(project.targetDelivery).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t flex justify-between items-center">
                  <div className="flex items-center text-sm text-gray-500">
                    <Target className="w-4 h-4 mr-1" />
                    {project._count.tasks} tasks
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      // Handle more actions
                    }}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <MoreVertical className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {filteredProjects.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <p className="text-gray-500">No projects found matching your filters</p>
          </div>
        )}
      </div>
    </div>
  )
}