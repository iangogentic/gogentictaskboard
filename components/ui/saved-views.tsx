"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronDown,
  Save,
  Share2,
  Trash2,
  Eye,
  Plus,
  Filter,
  Clock,
  Users,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
    id: "all",
    name: "All Projects",
    icon: <Eye className="w-4 h-4" />,
    filters: {},
    isDefault: true,
  },
  {
    id: "my-projects",
    name: "My Projects",
    icon: <Users className="w-4 h-4" />,
    filters: { assignedToMe: true },
    isDefault: true,
  },
  {
    id: "blocked",
    name: "Blocked",
    icon: <AlertCircle className="w-4 h-4" />,
    filters: { status: "BLOCKED" },
    isDefault: true,
  },
  {
    id: "this-week",
    name: "This Week",
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
  const [newViewName, setNewViewName] = React.useState("");
  const searchParams = useSearchParams();
  const router = useRouter();

  const allViews = [...defaultViews, ...customViews];
  const currentView =
    allViews.find((v) => v.id === currentViewId) || defaultViews[0];

  const handleViewChange = (view: SavedView) => {
    setIsOpen(false);
    onViewChange(view);

    // Update URL with view filters
    const params = new URLSearchParams(searchParams);
    Object.keys(view.filters).forEach((key) => {
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
    setNewViewName("");
    setShowSaveDialog(false);
  };

  return (
    <div className={cn("relative", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-lg hover:bg-white/[0.08] transition-colors text-white/90"
      >
        {currentView.icon}
        <span className="font-medium">{currentView.name}</span>
        <ChevronDown
          className={cn("w-4 h-4 transition-transform", isOpen && "rotate-180")}
        />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-2 w-64 bg-black/80 backdrop-blur-xl rounded-lg shadow-lg border border-white/10 z-40">
            <div className="p-2">
              {allViews.map((view) => (
                <div
                  key={view.id}
                  className={cn(
                    "group flex items-center justify-between px-3 py-2 rounded-md cursor-pointer transition-colors",
                    currentViewId === view.id
                      ? "bg-indigo-600/20 text-indigo-400"
                      : "hover:bg-white/[0.05] text-white/70 hover:text-white/90"
                  )}
                  onClick={() => handleViewChange(view)}
                >
                  <div className="flex items-center gap-2">
                    {view.icon}
                    <span className="text-sm font-medium">{view.name}</span>
                    {view.isShared && <Share2 className="w-3 h-3 text-muted" />}
                  </div>
                  {!view.isDefault && (
                    <div className="hidden group-hover:flex items-center gap-1">
                      {onShareView && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onShareView(view.id);
                          }}
                          className="p-1 text-muted hover:text-muted"
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
                          className="p-1 text-muted hover:text-danger"
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
              <div className="border-t border-white/10 p-2">
                <button
                  onClick={() => setShowSaveDialog(true)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/50 hover:bg-white/[0.05] hover:text-white/70 rounded-md transition-colors"
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
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowSaveDialog(false)}
          />
          <div className="relative bg-black/80 backdrop-blur-xl border border-white/10 rounded-lg p-6 w-96 shadow-xl">
            <h3 className="text-lg font-semibold mb-4 text-white/90">
              Save View
            </h3>
            <input
              type="text"
              value={newViewName}
              onChange={(e) => setNewViewName(e.target.value)}
              placeholder="View name..."
              className="w-full px-3 py-2 bg-white/[0.03] border border-white/10 rounded-lg text-white/90 placeholder-white/30 focus:outline-none focus:border-white/20 focus:bg-white/[0.05] transition-all"
              autoFocus
            />
            <div className="flex items-center gap-2 mt-4">
              <button
                onClick={handleSaveCurrentView}
                disabled={!newViewName}
                className={cn(
                  "flex-1 py-2 rounded-lg font-medium transition-colors",
                  newViewName
                    ? "bg-indigo-600/80 text-white hover:bg-indigo-600 border border-indigo-500/20"
                    : "bg-white/[0.03] text-white/30 cursor-not-allowed border border-white/5"
                )}
              >
                Save View
              </button>
              <button
                onClick={() => setShowSaveDialog(false)}
                className="flex-1 py-2 bg-white/[0.03] text-white/70 rounded-lg hover:bg-white/[0.05] hover:text-white/90 border border-white/10 transition-colors"
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
