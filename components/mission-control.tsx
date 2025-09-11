'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, TrendingUp, AlertCircle, Clock, Users, Activity, Target, Rocket, Brain, Settings } from 'lucide-react'
import { KPITile, KPIGrid } from '@/components/ui/kpi-tile'
import { PortfolioCard, PortfolioGrid } from '@/components/ui/portfolio-card'
import { FilterBar } from '@/components/ui/filter-bar'
import { cn } from '@/lib/utils'

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
      case 'cortex': return <Brain className="w-6 h-6" style={{ color: 'var(--portfolio-cortex)' }} />
      case 'solutions': return <Settings className="w-6 h-6" style={{ color: 'var(--portfolio-solutions)' }} />
      case 'launchpad': return <Rocket className="w-6 h-6" style={{ color: 'var(--portfolio-launchpad)' }} />
      case 'fisher': return <Target className="w-6 h-6" style={{ color: 'var(--portfolio-fisher)' }} />
      default: return <Activity className="w-6 h-6" />
    }
  }

  const portfolioColors = {
    cortex: 'var(--portfolio-cortex)',
    solutions: 'var(--portfolio-solutions)',
    launchpad: 'var(--portfolio-launchpad)',
    fisher: 'var(--portfolio-fisher)',
  }

  const getHealthTrend = (health: number): 'up' | 'down' | 'neutral' => {
    if (health >= 80) return 'up'
    if (health >= 60) return 'neutral'
    return 'down'
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-danger-bg text-danger border-danger/20'
      case 'medium': return 'bg-warn-bg text-warn border-warn/20'
      case 'low': return 'bg-info-bg text-info border-info/20'
      default: return 'bg-surface text-muted border-border'
    }
  }

  // Calculate KPI totals
  const totalProjects = portfolios.reduce((sum, p) => sum + p.projectCount, 0)
  const totalInProgress = portfolios.reduce((sum, p) => sum + p.inProgressCount, 0)
  const totalLive = portfolios.reduce((sum, p) => sum + p.liveCount, 0)
  const totalBlocked = portfolios.reduce((sum, p) => sum + p.blockedCount, 0)
  const avgOverallHealth = portfolios.length > 0 
    ? Math.round(portfolios.reduce((sum, p) => sum + p.avgHealth, 0) / portfolios.length)
    : 0

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto"></div>
          <p className="mt-4 text-muted">Loading Mission Control...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-fg">Mission Control</h1>
          <p className="mt-2 text-muted">Portfolio overview and health status</p>
        </div>

        {/* KPI Overview */}
        <KPIGrid>
          <KPITile
            label="Total Projects"
            value={totalProjects}
            icon={<Activity className="w-5 h-5" />}
          />
          <KPITile
            label="In Progress"
            value={totalInProgress}
            icon={<Clock className="w-5 h-5" />}
            delta={{
              value: 12,
              trend: 'up',
              label: 'this week'
            }}
          />
          <KPITile
            label="Live Projects"
            value={totalLive}
            icon={<TrendingUp className="w-5 h-5" />}
            delta={{
              value: 5,
              trend: 'up',
              label: 'this month'
            }}
          />
          <KPITile
            label="Blocked"
            value={totalBlocked}
            icon={<AlertCircle className="w-5 h-5" />}
            delta={{
              value: totalBlocked > 0 ? -2 : 0,
              trend: totalBlocked > 0 ? 'down' : 'neutral'
            }}
          />
        </KPIGrid>

        {/* Portfolio Cards */}
        <PortfolioGrid>
          {portfolios.map((portfolio) => (
            <PortfolioCard
              key={portfolio.key}
              portfolio={{
                key: portfolio.key,
                name: portfolio.name,
                description: portfolio.description,
                color: portfolioColors[portfolio.key as keyof typeof portfolioColors] || 'var(--brand)',
                icon: getPortfolioIcon(portfolio.key),
                projectCount: portfolio.projectCount,
                metrics: {
                  inProgress: portfolio.inProgressCount,
                  blocked: portfolio.blockedCount,
                  completed: 0,
                  live: portfolio.liveCount,
                },
                health: portfolio.avgHealth,
                trend: getHealthTrend(portfolio.avgHealth),
                risks: portfolio.blockedCount > 0 ? [
                  {
                    id: '1',
                    title: `${portfolio.blockedCount} projects blocked`,
                    severity: portfolio.blockedCount > 2 ? 'high' : 'medium'
                  }
                ] : undefined
              }}
              href={`/portfolio/${portfolio.key}`}
            />
          ))}
        </PortfolioGrid>

        {/* Needs Attention Section */}
        {needsAttention.length > 0 && (
          <div className="bg-bg rounded-2xl border border-border shadow-[var(--shadow-card)]">
            <div className="px-6 py-4 border-b border-border">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-warn mr-2" />
                <h2 className="text-lg font-semibold text-fg">Needs Attention</h2>
                <span className="ml-2 px-2 py-1 text-xs font-medium bg-warn-bg text-warn rounded-full">
                  {needsAttention.length}
                </span>
              </div>
            </div>
            <div className="divide-y divide-border">
              {needsAttention.map((item) => (
                <Link
                  key={item.id}
                  href={`/projects/${item.id}`}
                  className="px-6 py-4 hover:bg-surface transition-colors flex items-center justify-between group"
                >
                  <div className="flex items-start">
                    <div 
                      className="w-1 h-12 rounded-full mr-4 flex-shrink-0"
                      style={{ backgroundColor: item.portfolioColor }}
                    />
                    <div>
                      <div className="flex items-center">
                        <h3 className="text-sm font-medium text-fg group-hover:text-brand">
                          {item.title}
                        </h3>
                        <span className="ml-2 text-xs text-muted">
                          {item.portfolio}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-muted">{item.issue}</p>
                    </div>
                  </div>
                  <span className={cn('px-2 py-1 text-xs font-medium rounded-full border', getSeverityColor(item.severity))}>
                    {item.severity}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex gap-4">
          <Link
            href="/projects"
            className={cn(
              "inline-flex items-center px-4 py-2 rounded-lg",
              "border border-border bg-bg text-fg",
              "hover:bg-surface hover:border-brand/20",
              "transition-all duration-200",
              "text-sm font-medium",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
            )}
          >
            View All Projects
          </Link>
          <Link
            href="/projects/new"
            className={cn(
              "inline-flex items-center px-4 py-2 rounded-lg",
              "border border-transparent bg-brand text-white",
              "hover:bg-brand-hover",
              "transition-all duration-200",
              "text-sm font-medium",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
            )}
          >
            New Project
          </Link>
        </div>
      </div>
    </div>
  )
}