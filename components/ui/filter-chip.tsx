'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterChipProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
  active?: boolean;
  count?: number;
  onToggle: (value: string) => void;
  onClear?: (value: string) => void;
}

export function FilterChip({
  label,
  value,
  icon,
  active = false,
  count,
  onToggle,
  onClear,
}: FilterChipProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onToggle(value);
    }
    if (active && e.key === 'Delete' && onClear) {
      e.preventDefault();
      onClear(value);
    }
  };

  return (
    <button
      role="switch"
      aria-checked={active}
      aria-label={`Filter by ${label}`}
      onClick={() => onToggle(value)}
      onKeyDown={handleKeyDown}
      className={cn(
        'inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-sm font-medium',
        'transition-all duration-200 focus-visible:outline-none focus-visible:ring-2',
        'focus-visible:ring-offset-2 focus-visible:ring-blue-500',
        active
          ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      )}
    >
      {icon && <span className="w-4 h-4">{icon}</span>}
      <span>{label}</span>
      {count !== undefined && (
        <span className={cn(
          'ml-1 px-1.5 py-0.5 text-xs rounded-full',
          active ? 'bg-blue-200' : 'bg-gray-200'
        )}>
          {count}
        </span>
      )}
      {active && onClear && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClear(value);
          }}
          className="ml-1 -mr-1 p-0.5 rounded-full hover:bg-blue-200"
          aria-label={`Clear ${label} filter`}
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </button>
  );
}

interface FilterBarProps {
  filters: Array<{
    label: string;
    value: string;
    icon?: React.ReactNode;
    count?: number;
  }>;
  activeFilters: string[];
  onFilterToggle: (value: string) => void;
  onClearAll: () => void;
  className?: string;
}

export function FilterBar({
  filters,
  activeFilters,
  onFilterToggle,
  onClearAll,
  className,
}: FilterBarProps) {
  const activeCount = activeFilters.length;

  return (
    <div className={cn('flex items-center gap-2 flex-wrap', className)}>
      {filters.map((filter) => (
        <FilterChip
          key={filter.value}
          {...filter}
          active={activeFilters.includes(filter.value)}
          onToggle={onFilterToggle}
          onClear={onFilterToggle}
        />
      ))}
      {activeCount > 0 && (
        <button
          onClick={onClearAll}
          className="ml-2 text-sm text-gray-500 hover:text-gray-700 underline"
        >
          Clear all ({activeCount})
        </button>
      )}
    </div>
  );
}