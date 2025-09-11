'use client';

import * as React from 'react';
import Link from 'next/link';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  CheckCircle,
  Clock,
  ArrowRight,
  BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PortfolioCardProps {
  portfolio: {
    key: string;
    name: string;
    description: string;
    color: string;
    icon?: React.ReactNode;
    projectCount: number;
    metrics?: {
      inProgress?: number;
      blocked?: number;
      completed?: number;
      live?: number;
    };
    health?: number; // 0-100
    trend?: 'up' | 'down' | 'neutral';
    risks?: Array<{
      id: string;
      title: string;
      severity: 'high' | 'medium' | 'low';
    }>;
  };
  href?: string;
  className?: string;
}

const getHealthColor = (health: number) => {
  if (health >= 80) return 'text-success';
  if (health >= 60) return 'text-warn';
  return 'text-danger';
};

const getHealthBgColor = (health: number) => {
  if (health >= 80) return 'bg-success/10';
  if (health >= 60) return 'bg-warn/10';
  return 'bg-danger/10';
};

export function PortfolioCard({
  portfolio,
  href,
  className,
}: PortfolioCardProps) {
  const portfolioHref = href || `/portfolio/${portfolio.key}`;
  const hasRisks = portfolio.risks && portfolio.risks.length > 0;
  
  return (
    <Link
      href={portfolioHref}
      className={cn(
        'group relative block bg-bg rounded-2xl border border-border p-4 sm:p-6',
        'shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)]',
        'transition-all duration-200 hover:border-brand/20',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ 
              backgroundColor: portfolio.color ? `${portfolio.color}20` : 'var(--surface-strong)'
            }}
          >
            {portfolio.icon || (
              <div 
                className="w-6 h-6 rounded-full"
                style={{ backgroundColor: portfolio.color || 'var(--muted)' }}
              />
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-fg">{portfolio.name}</h3>
            <p className="text-sm text-muted">
              {portfolio.projectCount} {portfolio.projectCount === 1 ? 'project' : 'projects'}
            </p>
          </div>
        </div>
        <ArrowRight className="w-5 h-5 text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Description */}
      <p className="text-sm text-muted mb-4 line-clamp-2">
        {portfolio.description}
      </p>

      {/* Metrics */}
      {portfolio.metrics && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          {portfolio.metrics.inProgress !== undefined && portfolio.metrics.inProgress > 0 && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-info" />
              <span className="text-sm">
                <span className="font-medium text-fg">{portfolio.metrics.inProgress}</span>
                <span className="text-muted ml-1">In Progress</span>
              </span>
            </div>
          )}
          {portfolio.metrics.live !== undefined && portfolio.metrics.live > 0 && (
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-success" />
              <span className="text-sm">
                <span className="font-medium text-fg">{portfolio.metrics.live}</span>
                <span className="text-muted ml-1">Live</span>
              </span>
            </div>
          )}
          {portfolio.metrics.blocked !== undefined && portfolio.metrics.blocked > 0 && (
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-danger" />
              <span className="text-sm">
                <span className="font-medium text-fg">{portfolio.metrics.blocked}</span>
                <span className="text-muted ml-1">Blocked</span>
              </span>
            </div>
          )}
        </div>
      )}

      {/* Health Bar */}
      {portfolio.health !== undefined && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted">Health</span>
            <div className="flex items-center gap-1">
              {portfolio.trend === 'up' && (
                <TrendingUp className="w-3 h-3 text-success" />
              )}
              {portfolio.trend === 'down' && (
                <TrendingDown className="w-3 h-3 text-danger" />
              )}
              <span className={cn('text-sm font-medium', getHealthColor(portfolio.health))}>
                {portfolio.health}%
              </span>
            </div>
          </div>
          <div className="w-full h-2 bg-surface-strong rounded-full overflow-hidden">
            <div 
              className={cn('h-full rounded-full transition-all duration-500', getHealthBgColor(portfolio.health))}
              style={{ 
                width: `${portfolio.health}%`,
                backgroundColor: portfolio.health >= 80 ? 'var(--success)' : 
                                portfolio.health >= 60 ? 'var(--warn)' : 'var(--danger)'
              }}
            />
          </div>
        </div>
      )}

      {/* Top Risks */}
      {hasRisks && (
        <div className="pt-4 border-t border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted">Top Risks</span>
            <span className="text-xs text-danger">{portfolio.risks!.length}</span>
          </div>
          <div className="space-y-1">
            {portfolio.risks!.slice(0, 2).map((risk) => (
              <div key={risk.id} className="flex items-center gap-2">
                <span className={cn(
                  'w-1.5 h-1.5 rounded-full',
                  risk.severity === 'high' && 'bg-danger',
                  risk.severity === 'medium' && 'bg-warn',
                  risk.severity === 'low' && 'bg-info'
                )} />
                <span className="text-xs text-muted truncate">{risk.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sparkline placeholder */}
      {portfolio.metrics && (
        <div className="absolute bottom-6 right-6 opacity-10 group-hover:opacity-20 transition-opacity">
          <BarChart3 className="w-16 h-16 text-fg" />
        </div>
      )}
    </Link>
  );
}

interface PortfolioGridProps {
  children: React.ReactNode;
  className?: string;
}

export function PortfolioGrid({ children, className }: PortfolioGridProps) {
  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6', className)}>
      {children}
    </div>
  );
}