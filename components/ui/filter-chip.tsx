'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterChipProps {
  label: string;
  value?: string | number;
  selected?: boolean;
  onToggle?: () => void;
  onRemove?: () => void;
  icon?: React.ReactNode;
  color?: 'default' | 'brand' | 'success' | 'warn' | 'danger' | 'portfolio-cortex' | 'portfolio-solutions' | 'portfolio-launchpad' | 'portfolio-fisher';
  size?: 'sm' | 'md';
  className?: string;
}

const colorClasses = {
  default: {
    base: 'bg-surface border-border text-fg',
    selected: 'bg-brand text-white border-brand',
  },
  brand: {
    base: 'bg-brand/10 border-brand/20 text-brand',
    selected: 'bg-brand text-white border-brand',
  },
  success: {
    base: 'bg-success-bg border-success/20 text-success',
    selected: 'bg-success text-white border-success',
  },
  warn: {
    base: 'bg-warn-bg border-warn/20 text-warn',
    selected: 'bg-warn text-white border-warn',
  },
  danger: {
    base: 'bg-danger-bg border-danger/20 text-danger',
    selected: 'bg-danger text-white border-danger',
  },
  'portfolio-cortex': {
    base: 'bg-portfolio-cortex/10 border-portfolio-cortex/20 text-portfolio-cortex',
    selected: 'bg-portfolio-cortex text-white border-portfolio-cortex',
  },
  'portfolio-solutions': {
    base: 'bg-portfolio-solutions/10 border-portfolio-solutions/20 text-portfolio-solutions',
    selected: 'bg-portfolio-solutions text-white border-portfolio-solutions',
  },
  'portfolio-launchpad': {
    base: 'bg-portfolio-launchpad/10 border-portfolio-launchpad/20 text-portfolio-launchpad',
    selected: 'bg-portfolio-launchpad text-white border-portfolio-launchpad',
  },
  'portfolio-fisher': {
    base: 'bg-portfolio-fisher/10 border-portfolio-fisher/20 text-portfolio-fisher',
    selected: 'bg-portfolio-fisher text-white border-portfolio-fisher',
  },
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs gap-1',
  md: 'px-3 py-1 text-sm gap-1.5',
};

export function FilterChip({
  label,
  value,
  selected = false,
  onToggle,
  onRemove,
  icon,
  color = 'default',
  size = 'md',
  className,
}: FilterChipProps) {
  const isInteractive = onToggle || onRemove;
  const colors = colorClasses[color] || colorClasses.default;

  const chipClass = cn(
    'inline-flex items-center rounded-full border font-medium transition-all duration-150',
    sizeClasses[size],
    selected ? colors.selected : colors.base,
    isInteractive && 'cursor-pointer hover:shadow-sm',
    onToggle && !selected && 'hover:bg-surface-strong',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1',
    className
  );

  const handleClick = () => {
    if (onToggle) {
      onToggle();
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRemove) {
      onRemove();
    }
  };

  return (
    <button
      type="button"
      className={chipClass}
      onClick={handleClick}
      disabled={!isInteractive}
      aria-pressed={selected}
    >
      {icon && <span className={cn(size === 'sm' ? 'w-3 h-3' : 'w-4 h-4')}>{icon}</span>}
      <span>{label}</span>
      {value !== undefined && (
        <span className={cn('font-semibold', selected && 'opacity-90')}>
          {value}
        </span>
      )}
      {selected && onRemove && (
        <button
          type="button"
          onClick={handleRemove}
          className={cn(
            'ml-0.5 -mr-1 rounded-full p-0.5 hover:bg-white/20 transition-colors',
            'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white'
          )}
          aria-label={`Remove ${label} filter`}
        >
          <X className={cn(size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5')} />
        </button>
      )}
    </button>
  );
}

interface FilterChipGroupProps {
  children: React.ReactNode;
  className?: string;
  label?: string;
  collapsible?: boolean;
  maxVisible?: number;
}

export function FilterChipGroup({
  children,
  className,
  label,
  collapsible = false,
  maxVisible = 5,
}: FilterChipGroupProps) {
  const [expanded, setExpanded] = React.useState(false);
  const chips = React.Children.toArray(children);
  const hasOverflow = collapsible && chips.length > maxVisible;
  const visibleChips = hasOverflow && !expanded ? chips.slice(0, maxVisible) : chips;
  const hiddenCount = chips.length - maxVisible;

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {label && (
        <span className="text-sm font-medium text-muted mr-2">{label}</span>
      )}
      {visibleChips}
      {hasOverflow && !expanded && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="px-3 py-1 text-sm font-medium text-brand hover:text-brand-hover transition-colors"
        >
          +{hiddenCount} more
        </button>
      )}
      {hasOverflow && expanded && (
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="px-3 py-1 text-sm font-medium text-muted hover:text-fg transition-colors"
        >
          Show less
        </button>
      )}
    </div>
  );
}