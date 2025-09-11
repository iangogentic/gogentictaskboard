'use client';

import * as React from 'react';
import Link from 'next/link';
import { TrendingUp, TrendingDown, Minus, ArrowRight, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPITileProps {
  label: string;
  value: number | string;
  delta?: {
    value: number;
    trend: 'up' | 'down' | 'neutral';
    label?: string;
  };
  href?: string;
  icon?: React.ReactNode;
  loading?: boolean;
  className?: string;
}

export function KPITile({
  label,
  value,
  delta,
  href,
  icon,
  loading = false,
  className,
}: KPITileProps) {
  const content = (
    <>
      {loading ? (
        <div className="space-y-2 animate-pulse">
          <div className="h-8 w-24 bg-surface-strong rounded" />
          <div className="h-4 w-16 bg-surface rounded" />
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-2xl md:text-3xl font-semibold text-fg">{value}</p>
              <p className="text-sm text-muted mt-1">{label}</p>
            </div>
            {icon && (
              <div className="text-muted opacity-50">{icon}</div>
            )}
          </div>
          {delta && (
            <div className="flex items-center gap-1 mt-3">
              {delta.trend === 'up' && (
                <TrendingUp className="w-4 h-4 text-success" />
              )}
              {delta.trend === 'down' && (
                <TrendingDown className="w-4 h-4 text-danger" />
              )}
              {delta.trend === 'neutral' && (
                <Minus className="w-4 h-4 text-muted" />
              )}
              <span className={cn(
                "text-xs font-medium",
                delta.trend === 'up' && 'text-success',
                delta.trend === 'down' && 'text-danger',
                delta.trend === 'neutral' && 'text-muted'
              )}>
                {delta.value > 0 ? '+' : ''}{delta.value}%
                {delta.label && (
                  <span className="text-muted ml-1">{delta.label}</span>
                )}
              </span>
            </div>
          )}
        </>
      )}
    </>
  );

  const tileClassName = cn(
    "relative bg-bg rounded-2xl border border-border p-4 sm:p-6",
    "shadow-[var(--shadow-card)] transition-all duration-200",
    href && "hover:shadow-[var(--shadow-card-hover)] hover:border-brand/20 cursor-pointer",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2",
    className
  );

  if (href) {
    return (
      <Link href={href} className={tileClassName}>
        {content}
      </Link>
    );
  }

  return <div className={tileClassName}>{content}</div>;
}

interface KPIGridProps {
  children: React.ReactNode;
  className?: string;
}

export function KPIGrid({ children, className }: KPIGridProps) {
  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6', className)}>
      {children}
    </div>
  );
}

interface AttentionCardProps {
  items: Array<{
    id: string;
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    href?: string;
  }>;
  className?: string;
}

export function AttentionCard({ items, className }: AttentionCardProps) {
  if (items.length === 0) return null;

  const priorityColors = {
    high: 'bg-red-100 text-red-700',
    medium: 'bg-amber-100 text-amber-700',
    low: 'bg-blue-100 text-blue-700',
  };

  return (
    <div className={cn(
      'p-6 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200',
      className
    )}>
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-5 h-5 text-amber-600" />
        <h3 className="text-lg font-semibold text-fg">Needs Attention</h3>
        <span className="ml-auto text-sm text-muted">{items.length} items</span>
      </div>

      <div className="space-y-3">
        {items.slice(0, 3).map((item) => (
          <div key={item.id} className="flex items-start gap-3">
            <span className={cn(
              'mt-1 px-2 py-0.5 text-xs font-medium rounded-full',
              priorityColors[item.priority]
            )}>
              {item.priority}
            </span>
            <div className="flex-1">
              {item.href ? (
                <Link
                  href={item.href}
                  className="font-medium text-fg hover:text-blue-600 transition-colors"
                >
                  {item.title}
                </Link>
              ) : (
                <p className="font-medium text-fg">{item.title}</p>
              )}
              <p className="text-sm text-muted mt-0.5">{item.description}</p>
            </div>
          </div>
        ))}
      </div>

      {items.length > 3 && (
        <Link
          href="/dashboard/attention"
          className="mt-4 inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
        >
          View all {items.length} items
          <ArrowRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
}