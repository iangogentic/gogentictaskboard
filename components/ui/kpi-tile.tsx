'use client';

import * as React from 'react';
import Link from 'next/link';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPITileProps {
  title: string;
  value: number | string;
  delta?: {
    value: number;
    type: 'increase' | 'decrease' | 'neutral';
    label?: string;
  };
  trend?: number[];
  icon?: React.ReactNode;
  href?: string;
  status?: 'default' | 'warning' | 'danger' | 'success';
  subtitle?: string;
  className?: string;
}

const statusColors = {
  default: 'border-gray-200',
  warning: 'border-amber-200 bg-amber-50',
  danger: 'border-red-200 bg-red-50',
  success: 'border-green-200 bg-green-50',
};

export function KPITile({
  title,
  value,
  delta,
  trend,
  icon,
  href,
  status = 'default',
  subtitle,
  className,
}: KPITileProps) {
  const TrendIcon = delta?.type === 'increase' ? TrendingUp : 
                    delta?.type === 'decrease' ? TrendingDown : Minus;

  const deltaColor = delta?.type === 'increase' ? 'text-red-600' : 
                     delta?.type === 'decrease' ? 'text-green-600' : 
                     'text-gray-600';

  const needsAttention = status === 'warning' || status === 'danger';

  const content = (
    <>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          {icon && (
            <div className="p-2 bg-gray-100 rounded-lg">
              {icon}
            </div>
          )}
          <div>
            <h3 className="text-sm font-medium text-gray-600">{title}</h3>
            {subtitle && (
              <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
        {needsAttention && (
          <AlertTriangle className="w-4 h-4 text-amber-500" />
        )}
      </div>

      <div className="flex items-end justify-between">
        <div>
          <div className="text-3xl font-semibold text-gray-900">
            {value}
          </div>
          {delta && (
            <div className={cn('flex items-center gap-1 mt-2', deltaColor)}>
              <TrendIcon className="w-4 h-4" />
              <span className="text-sm font-medium">
                {delta.type === 'increase' ? '+' : delta.type === 'decrease' ? '-' : ''}
                {delta.value}
              </span>
              {delta.label && (
                <span className="text-xs text-gray-500">{delta.label}</span>
              )}
            </div>
          )}
        </div>

        {trend && trend.length > 0 && (
          <div className="flex items-end gap-0.5 h-12">
            {trend.map((val, i) => {
              const height = `${(val / Math.max(...trend)) * 100}%`;
              return (
                <div
                  key={i}
                  className="w-1.5 bg-blue-200 rounded-t"
                  style={{ height }}
                />
              );
            })}
          </div>
        )}
      </div>

      {href && (
        <div className="mt-4 pt-4 border-t flex items-center justify-between">
          <span className="text-xs text-gray-500">View details</span>
          <ArrowRight className="w-4 h-4 text-gray-400" />
        </div>
      )}
    </>
  );

  const tileClasses = cn(
    'relative p-6 bg-white rounded-2xl border transition-all duration-200',
    statusColors[status],
    href && 'hover:shadow-lg cursor-pointer',
    className
  );

  if (href) {
    return (
      <Link href={href} className={tileClasses}>
        {content}
      </Link>
    );
  }

  return <div className={tileClasses}>{content}</div>;
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
        <h3 className="text-lg font-semibold text-gray-900">Needs Attention</h3>
        <span className="ml-auto text-sm text-gray-600">{items.length} items</span>
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
                  className="font-medium text-gray-900 hover:text-blue-600 transition-colors"
                >
                  {item.title}
                </Link>
              ) : (
                <p className="font-medium text-gray-900">{item.title}</p>
              )}
              <p className="text-sm text-gray-600 mt-0.5">{item.description}</p>
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