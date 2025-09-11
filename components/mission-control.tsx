'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, TrendingUp, AlertCircle, Clock, Users, Activity, Target, Rocket, Brain, Settings } from 'lucide-react'

interface Portfolio {
  id: string
  key: string
  name: string
  color: string
  description: string
  projectCount: number
  inProgressCount: number
  blockedCount: number
  liveCount: number
  avgHealth: number
}

interface NeedsAttentionItem {
  id: string
  title: string
  portfolio: string
  portfolioColor: string
  issue: string
  severity: 'high' | 'medium' | 'low'
}

export default function MissionControl() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([])
  const [needsAttention, setNeedsAttention] = useState<NeedsAttentionItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard')
      const data = await response.json()
      setPortfolios(data.portfolios)
      setNeedsAttention(data.needsAttention)
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPortfolioIcon = (key: string) => {
    switch (key) {
      case 'cortex': return <Brain className="w-6 h-6" />
      case 'solutions': return <Settings className="w-6 h-6" />
      case 'launchpad': return <Rocket className="w-6 h-6" />
      case 'fisher': return <Target className="w-6 h-6" />
      default: return <Activity className="w-6 h-6" />
    }
  }

  const getHealthColor = (health: number) => {
    if (health >= 80) return 'text-green-600'
    if (health >= 60) return 'text-amber-600'
    return 'text-red-600'
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-amber-100 text-amber-800 border-amber-200'
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Mission Control...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mission Control</h1>
          <p className="mt-2 text-gray-600">Portfolio overview and health status</p>
        </div>

        {/* Portfolio Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {portfolios.map((portfolio) => (
            <Link
              key={portfolio.key}
              href={`/portfolio/${portfolio.key}`}
              className="group relative bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden"
            >
              {/* Color band at top */}
              <div className="h-1" style={{ backgroundColor: portfolio.color }} />
              
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: `${portfolio.color}20` }}>
                      <div style={{ color: portfolio.color }}>
                        {getPortfolioIcon(portfolio.key)}
                      </div>
                    </div>
                    <div className="ml-3">
                      <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                        {portfolio.name}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {portfolio.projectCount} projects
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                </div>

                {/* Description */}
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {portfolio.description}
                </p>

                {/* Stats */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">In Progress</span>
                    <span className="font-medium">{portfolio.inProgressCount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Live</span>
                    <span className="font-medium text-green-600">{portfolio.liveCount}</span>
                  </div>
                  {portfolio.blockedCount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Blocked</span>
                      <span className="font-medium text-red-600">{portfolio.blockedCount}</span>
                    </div>
                  )}
                </div>

                {/* Health indicator */}
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Health</span>
                    <div className="flex items-center">
                      <Activity className={`w-4 h-4 mr-1 ${getHealthColor(portfolio.avgHealth)}`} />
                      <span className={`text-sm font-medium ${getHealthColor(portfolio.avgHealth)}`}>
                        {portfolio.avgHealth}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Needs Attention Section */}
        {needsAttention.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-amber-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">Needs Attention</h2>
                <span className="ml-2 px-2 py-1 text-xs font-medium bg-amber-100 text-amber-800 rounded-full">
                  {needsAttention.length}
                </span>
              </div>
            </div>
            <div className="divide-y divide-gray-100">
              {needsAttention.map((item) => (
                <Link
                  key={item.id}
                  href={`/projects/${item.id}`}
                  className="px-6 py-4 hover:bg-gray-50 transition-colors flex items-center justify-between group"
                >
                  <div className="flex items-start">
                    <div 
                      className="w-1 h-12 rounded-full mr-4 flex-shrink-0"
                      style={{ backgroundColor: item.portfolioColor }}
                    />
                    <div>
                      <div className="flex items-center">
                        <h3 className="text-sm font-medium text-gray-900 group-hover:text-indigo-600">
                          {item.title}
                        </h3>
                        <span className="ml-2 text-xs text-gray-500">
                          {item.portfolio}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-600">{item.issue}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getSeverityColor(item.severity)}`}>
                    {item.severity}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-8 flex gap-4">
          <Link
            href="/projects"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            View All Projects
          </Link>
          <Link
            href="/projects/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            New Project
          </Link>
        </div>
      </div>
    </div>
  )
}