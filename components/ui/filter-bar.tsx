'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Filter, 
  Save, 
  ChevronDown,
  X,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { FilterChip, FilterChipGroup } from './filter-chip';

export interface FilterOption {
  id: string;
  label: string;
  value: string;
  icon?: React.ReactNode;
  color?: 'default' | 'brand' | 'success' | 'warn' | 'danger' | 'portfolio-cortex' | 'portfolio-solutions' | 'portfolio-launchpad' | 'portfolio-fisher';
}

export interface FilterGroup {
  id: string;
  label: string;
  options: FilterOption[];
  multiple?: boolean;
  icon?: React.ReactNode;
}

interface FilterBarProps {
  filterGroups: FilterGroup[];
  savedViews?: Array<{
    id: string;
    name: string;
    filters: Record<string, string[]>;
  }>;
  onSaveView?: (name: string, filters: Record<string, string[]>) => void;
  sticky?: boolean;
  className?: string;
}

export function FilterBar({
  filterGroups,
  savedViews,
  onSaveView,
  sticky = true,
  className,
}: FilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [showSaveDialog, setShowSaveDialog] = React.useState(false);
  const [viewName, setViewName] = React.useState('');

  // Parse current filters from URL
  const currentFilters = React.useMemo(() => {
    const filters: Record<string, string[]> = {};
    filterGroups.forEach(group => {
      const paramValue = searchParams.get(group.id);
      if (paramValue) {
        filters[group.id] = paramValue.split(',');
      } else {
        filters[group.id] = [];
      }
    });
    return filters;
  }, [searchParams, filterGroups]);

  // Check if any filters are active
  const hasActiveFilters = Object.values(currentFilters).some(values => values.length > 0);
  const activeFilterCount = Object.values(currentFilters).reduce((sum, values) => sum + values.length, 0);

  // Update URL with new filters
  const updateFilters = (groupId: string, values: string[]) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (values.length > 0) {
      params.set(groupId, values.join(','));
    } else {
      params.delete(groupId);
    }
    
    router.push(`?${params.toString()}`, { scroll: false });
  };

  // Toggle a filter option
  const toggleFilter = (groupId: string, value: string) => {
    const group = filterGroups.find(g => g.id === groupId);
    const currentValues = currentFilters[groupId] || [];
    
    let newValues: string[];
    if (currentValues.includes(value)) {
      // Remove the value
      newValues = currentValues.filter(v => v !== value);
    } else {
      // Add the value
      if (group?.multiple) {
        newValues = [...currentValues, value];
      } else {
        newValues = [value];
      }
    }
    
    updateFilters(groupId, newValues);
  };

  // Clear all filters
  const clearAllFilters = () => {
    const params = new URLSearchParams();
    router.push(`?${params.toString()}`, { scroll: false });
  };

  // Apply saved view
  const applySavedView = (view: typeof savedViews[0]) => {
    const params = new URLSearchParams();
    Object.entries(view.filters).forEach(([key, values]) => {
      if (values.length > 0) {
        params.set(key, values.join(','));
      }
    });
    router.push(`?${params.toString()}`, { scroll: false });
  };

  // Save current view
  const handleSaveView = () => {
    if (viewName && onSaveView) {
      onSaveView(viewName, currentFilters);
      setViewName('');
      setShowSaveDialog(false);
    }
  };

  return (
    <div 
      className={cn(
        'bg-bg border-b border-border',
        sticky && 'sticky top-[72px] z-30',
        className
      )}
    >
      <div className="px-6 py-3">
        {/* Main filter bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-1">
            {/* Filter toggle */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all',
                'hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
                hasActiveFilters ? 'border-brand bg-brand/5 text-brand' : 'border-border text-muted'
              )}
            >
              <Filter className="w-4 h-4" />
              <span className="text-sm font-medium">Filters</span>
              {hasActiveFilters && (
                <span className="px-1.5 py-0.5 text-xs font-semibold bg-brand text-white rounded-full">
                  {activeFilterCount}
                </span>
              )}
              <ChevronDown className={cn(
                'w-4 h-4 transition-transform',
                isExpanded && 'rotate-180'
              )} />
            </button>

            {/* Active filters */}
            {hasActiveFilters && !isExpanded && (
              <FilterChipGroup className="flex-1">
                {filterGroups.map(group => {
                  const values = currentFilters[group.id] || [];
                  return values.map(value => {
                    const option = group.options.find(o => o.value === value);
                    if (!option) return null;
                    return (
                      <FilterChip
                        key={`${group.id}-${value}`}
                        label={option.label}
                        icon={option.icon}
                        color={option.color}
                        selected
                        onRemove={() => toggleFilter(group.id, value)}
                        size="sm"
                      />
                    );
                  });
                })}
              </FilterChipGroup>
            )}

            {/* Clear all */}
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="px-3 py-1.5 text-sm font-medium text-muted hover:text-danger transition-colors"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Saved views */}
          {savedViews && savedViews.length > 0 && (
            <div className="relative">
              <select
                onChange={(e) => {
                  const view = savedViews.find(v => v.id === e.target.value);
                  if (view) applySavedView(view);
                }}
                className={cn(
                  'px-3 py-1.5 pr-8 rounded-lg border border-border bg-bg',
                  'text-sm font-medium text-fg cursor-pointer',
                  'hover:bg-surface focus:outline-none focus:ring-2 focus:ring-brand'
                )}
                defaultValue=""
              >
                <option value="">Saved views</option>
                {savedViews.map(view => (
                  <option key={view.id} value={view.id}>
                    {view.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Save current view */}
          {onSaveView && hasActiveFilters && (
            <button
              onClick={() => setShowSaveDialog(true)}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-lg',
                'border border-border text-muted hover:text-fg hover:bg-surface',
                'transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand'
              )}
            >
              <Save className="w-4 h-4" />
              <span className="text-sm font-medium">Save view</span>
            </button>
          )}
        </div>

        {/* Expanded filter groups */}
        {isExpanded && (
          <div className="mt-4 space-y-3 pb-2">
            {filterGroups.map(group => (
              <div key={group.id}>
                <div className="flex items-center gap-2 mb-2">
                  {group.icon && <span className="text-muted">{group.icon}</span>}
                  <span className="text-sm font-medium text-muted">{group.label}</span>
                </div>
                <FilterChipGroup>
                  {group.options.map(option => {
                    const isSelected = (currentFilters[group.id] || []).includes(option.value);
                    return (
                      <FilterChip
                        key={option.value}
                        label={option.label}
                        icon={option.icon}
                        color={option.color}
                        selected={isSelected}
                        onToggle={() => toggleFilter(group.id, option.value)}
                        size="sm"
                      />
                    );
                  })}
                </FilterChipGroup>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Save view dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-bg rounded-2xl border border-border p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-fg mb-4">Save Current View</h3>
            <input
              type="text"
              value={viewName}
              onChange={(e) => setViewName(e.target.value)}
              placeholder="Enter view name..."
              className={cn(
                'w-full px-3 py-2 rounded-lg border border-border bg-surface',
                'text-fg placeholder-muted',
                'focus:outline-none focus:ring-2 focus:ring-brand'
              )}
              autoFocus
            />
            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={handleSaveView}
                disabled={!viewName}
                className={cn(
                  'flex-1 px-4 py-2 rounded-lg font-medium',
                  'bg-brand text-white hover:bg-brand-hover',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand'
                )}
              >
                Save
              </button>
              <button
                onClick={() => {
                  setShowSaveDialog(false);
                  setViewName('');
                }}
                className={cn(
                  'flex-1 px-4 py-2 rounded-lg font-medium',
                  'border border-border text-fg hover:bg-surface',
                  'transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand'
                )}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}