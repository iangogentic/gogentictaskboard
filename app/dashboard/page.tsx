'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { format, subDays } from 'date-fns'
import { 
  TrendingUp, TrendingDown, Activity, Users, Briefcase, 
  CheckCircle, Clock, AlertCircle, Calendar, BarChart3,
  GitBranch, Target, Timer, FolderOpen, ArrowUpRight,
  Heart, Shield, Zap, Rocket
} from 'lucide-react'

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

interface AttentionItem {
  id: string
  title: string
  portfolio: string
  portfolioColor: string
  issue: string
  severity: 'high' | 'medium' | 'low'
}

export default function DashboardPage() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([])
  const [needsAttention, setNeedsAttention] = useState<AttentionItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard')
      const data = await response.json()
      setPortfolios(data.portfolios || [])
      setNeedsAttention(data.needsAttention || [])
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPortfolioIcon = (key: string) => {
    switch(key) {
      case 'cortex': return <Zap className="w-5 h-5" />
      case 'solutions': return <Shield className="w-5 h-5" />
      case 'launchpad': return <Rocket className="w-5 h-5" />
      case 'fisher': return <Heart className="w-5 h-5" />
      default: return <FolderOpen className="w-5 h-5" />
    }
  }

  const totalProjects = portfolios.reduce((sum, p) => sum + p.projectCount, 0)
  const totalInProgress = portfolios.reduce((sum, p) => sum + p.inProgressCount, 0)
  const totalBlocked = portfolios.reduce((sum, p) => sum + p.blockedCount, 0)
  const totalLive = portfolios.reduce((sum, p) => sum + p.liveCount, 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-muted">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-fg">Portfolio Dashboard</h1>
          <p className="text-muted mt-1">Real-time overview of all portfolios and projects</p>
        </div>

        {/* Global Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted">Total Projects</p>
                <p className="text-2xl font-bold text-fg mt-1">{totalProjects}</p>
              </div>
              <Briefcase className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-xl border border-border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted">In Progress</p>
                <p className="text-2xl font-bold text-fg mt-1">{totalInProgress}</p>
              </div>
              <Clock className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-xl border border-border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted">Blocked</p>
                <p className="text-2xl font-bold text-fg mt-1">{totalBlocked}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
          </div>
          <div className="bg-white rounded-xl border border-border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted">Live</p>
                <p className="text-2xl font-bold text-fg mt-1">{totalLive}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Needs Attention */}
        {needsAttention.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
            <h2 className="text-lg font-semibold text-red-900 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Needs Immediate Attention
            </h2>
            <div className="space-y-3">
              {needsAttention.map(item => (
                <div key={item.id} className="bg-white rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-2 h-12 rounded-full"
                      style={{ backgroundColor: item.portfolioColor }}
                    />
                    <div>
                      <Link 
                        href={`/projects/${item.id}`}
                        className="font-medium text-fg hover:text-blue-600"
                      >
                        {item.title}
                      </Link>
                      <p className="text-sm text-muted">
                        {item.portfolio} • {item.issue}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    item.severity === 'high' ? 'bg-red-100 text-red-700' :
                    item.severity === 'medium' ? 'bg-amber-100 text-amber-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {item.severity}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Portfolio Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {portfolios.map(portfolio => (
            <div key={portfolio.id} className="bg-white rounded-xl border border-border overflow-hidden">
              <div 
                className="h-2"
                style={{ backgroundColor: portfolio.color }}
              />
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${portfolio.color}20` }}
                    >
                      <div style={{ color: portfolio.color }}>
                        {getPortfolioIcon(portfolio.key)}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-fg">{portfolio.name}</h3>
                      <p className="text-sm text-muted">{portfolio.description}</p>
                    </div>
                  </div>
                  <Link
                    href={`/projects?portfolio=${portfolio.key}`}
                    className="p-2 hover:bg-surface rounded-lg transition-colors"
                  >
                    <ArrowUpRight className="w-4 h-4 text-muted" />
                  </Link>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-muted">Projects</p>
                    <p className="text-2xl font-bold text-fg">{portfolio.projectCount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted">Health</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 bg-border rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all ${
                            portfolio.avgHealth >= 80 ? 'bg-green-500' :
                            portfolio.avgHealth >= 60 ? 'bg-amber-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${portfolio.avgHealth}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-fg-muted">{portfolio.avgHealth}%</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4 text-blue-500" />
                    <span className="text-muted">In Progress:</span>
                    <span className="font-medium text-fg">{portfolio.inProgressCount}</span>
                  </div>
                  {portfolio.blockedCount > 0 && (
                    <div className="flex items-center gap-1">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      <span className="text-muted">Blocked:</span>
                      <span className="font-medium text-red-600">{portfolio.blockedCount}</span>
                    </div>
                  )}
                  {portfolio.liveCount > 0 && (
                    <div className="flex items-center gap-1">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-muted">Live:</span>
                      <span className="font-medium text-green-600">{portfolio.liveCount}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/projects"
            className="bg-white rounded-xl border border-border p-6 hover:border-blue-300 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-fg">View All Projects</p>
                <p className="text-sm text-muted mt-1">Browse all projects by portfolio</p>
              </div>
              <FolderOpen className="w-8 h-8 text-muted" />
            </div>
          </Link>
          <Link
            href="/reports"
            className="bg-white rounded-xl border border-border p-6 hover:border-blue-300 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-fg">Portfolio Reports</p>
                <p className="text-sm text-muted mt-1">Detailed analytics and metrics</p>
              </div>
              <BarChart3 className="w-8 h-8 text-muted" />
            </div>
          </Link>
          <Link
            href="/activity"
            className="bg-white rounded-xl border border-border p-6 hover:border-blue-300 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-fg">Recent Activity</p>
                <p className="text-sm text-muted mt-1">Latest updates across portfolios</p>
              </div>
              <Activity className="w-8 h-8 text-muted" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}