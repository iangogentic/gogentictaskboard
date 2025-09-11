'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  ChevronDown, Save, Share2, Trash2, Eye, Plus,
  Filter, Clock, Users, AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SavedView {
  id: string;
  name: string;
  icon?: React.ReactNode;
  filters: Record<string, any>;
  sort?: string;
  isDefault?: boolean;
  isShared?: boolean;
}

interface SavedViewsProps {
  views: SavedView[];
  currentViewId?: string;
  onViewChange: (view: SavedView) => void;
  onSaveView?: (name: string, filters: Record<string, any>) => void;
  onDeleteView?: (id: string) => void;
  onShareView?: (id: string) => void;
  className?: string;
}

const defaultViews: SavedView[] = [
  {
    id: 'all',
    name: 'All Projects',
    icon: <Eye className="w-4 h-4" />,
    filters: {},
    isDefault: true,
  },
  {
    id: 'my-projects',
    name: 'My Projects',
    icon: <Users className="w-4 h-4" />,
    filters: { assignedToMe: true },
    isDefault: true,
  },
  {
    id: 'blocked',
    name: 'Blocked',
    icon: <AlertCircle className="w-4 h-4" />,
    filters: { status: 'BLOCKED' },
    isDefault: true,
  },
  {
    id: 'this-week',
    name: 'This Week',
    icon: <Clock className="w-4 h-4" />,
    filters: { dueThisWeek: true },
    isDefault: true,
  },
];

export function SavedViews({
  views: customViews,
  currentViewId,
  onViewChange,
  onSaveView,
  onDeleteView,
  onShareView,
  className,
}: SavedViewsProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [showSaveDialog, setShowSaveDialog] = React.useState(false);
  const [newViewName, setNewViewName] = React.useState('');
  const searchParams = useSearchParams();
  const router = useRouter();

  const allViews = [...defaultViews, ...customViews];
  const currentView = allViews.find(v => v.id === currentViewId) || defaultViews[0];

  const handleViewChange = (view: SavedView) => {
    setIsOpen(false);
    onViewChange(view);
    
    // Update URL with view filters
    const params = new URLSearchParams(searchParams);
    Object.keys(view.filters).forEach(key => {
      if (view.filters[key]) {
        params.set(key, String(view.filters[key]));
      } else {
        params.delete(key);
      }
    });
    router.push(`?${params.toString()}`);
  };

  const handleSaveCurrentView = () => {
    if (!newViewName || !onSaveView) return;
    
    const currentFilters = Object.fromEntries(searchParams.entries());
    onSaveView(newViewName, currentFilters);
    setNewViewName('');
    setShowSaveDialog(false);
  };

  return (
    <div className={cn('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        {currentView.icon}
        <span className="font-medium">{currentView.name}</span>
        <ChevronDown className={cn(
          'w-4 h-4 transition-transform',
          isOpen && 'rotate-180'
        )} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-40">
            <div className="p-2">
              {allViews.map((view) => (
                <div
                  key={view.id}
                  className={cn(
                    'group flex items-center justify-between px-3 py-2 rounded-md cursor-pointer',
                    currentViewId === view.id
                      ? 'bg-blue-50 text-blue-700'
                      : 'hover:bg-gray-50'
                  )}
                  onClick={() => handleViewChange(view)}
                >
                  <div className="flex items-center gap-2">
                    {view.icon}
                    <span className="text-sm font-medium">{view.name}</span>
                    {view.isShared && (
                      <Share2 className="w-3 h-3 text-gray-400" />
                    )}
                  </div>
                  {!view.isDefault && (
                    <div className="hidden group-hover:flex items-center gap-1">
                      {onShareView && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onShareView(view.id);
                          }}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          <Share2 className="w-3 h-3" />
                        </button>
                      )}
                      {onDeleteView && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteView(view.id);
                          }}
                          className="p-1 text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {onSaveView && (
              <div className="border-t border-gray-200 p-2">
                <button
                  onClick={() => setShowSaveDialog(true)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md"
                >
                  <Plus className="w-4 h-4" />
                  Save current view
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {showSaveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowSaveDialog(false)}
          />
          <div className="relative bg-white rounded-lg p-6 w-96 shadow-xl">
            <h3 className="text-lg font-semibold mb-4">Save View</h3>
            <input
              type="text"
              value={newViewName}
              onChange={(e) => setNewViewName(e.target.value)}
              placeholder="View name..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <div className="flex items-center gap-2 mt-4">
              <button
                onClick={handleSaveCurrentView}
                disabled={!newViewName}
                className={cn(
                  'flex-1 py-2 rounded-lg font-medium transition-colors',
                  newViewName
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                )}
              >
                Save View
              </button>
              <button
                onClick={() => setShowSaveDialog(false)}
                className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
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