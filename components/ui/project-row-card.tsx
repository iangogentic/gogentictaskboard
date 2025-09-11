'use client';

import * as React from 'react';
import Link from 'next/link';
import { ChevronRight, MoreHorizontal, Users, Calendar, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface ProjectRowCardProps {
  project: {
    id: string;
    title: string;
    branch: string;
    status: 'PLANNING' | 'IN_PROGRESS' | 'REVIEW' | 'BLOCKED' | 'COMPLETED';
    clientName: string;
    lastUpdatedAt: Date;
    progress?: number;
    pm?: { id: string; name: string; avatar?: string };
    developers?: Array<{ id: string; name: string; avatar?: string }>;
    taskCounts?: {
      total: number;
      completed: number;
    };
  };
  onQuickAction?: (action: 'assign' | 'status' | 'share', projectId: string) => void;
  className?: string;
}

const statusColors = {
  PLANNING: 'bg-gray-100 text-gray-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  REVIEW: 'bg-purple-100 text-purple-700',
  BLOCKED: 'bg-red-100 text-red-700',
  COMPLETED: 'bg-green-100 text-green-700',
};

const branchColors = {
  SOLUTIONS: 'bg-indigo-100 text-indigo-700',
  DEFAULT: 'bg-gray-100 text-gray-700',
};

export function ProjectRowCard({ project, onQuickAction, className }: ProjectRowCardProps) {
  const [showActions, setShowActions] = React.useState(false);
  const progress = project.taskCounts 
    ? Math.round((project.taskCounts.completed / project.taskCounts.total) * 100) || 0
    : project.progress || 0;

  const owners = [
    ...(project.pm ? [project.pm] : []),
    ...(project.developers || [])
  ].slice(0, 3);

  const overflowCount = (project.developers?.length || 0) + (project.pm ? 1 : 0) - 3;

  return (
    <div
      className={cn(
        'group relative bg-white rounded-2xl border border-gray-200',
        'shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)]',
        'transition-all duration-200',
        className
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <Link href={`/projects/${project.id}`} className="block p-6">
        <div className="flex items-center justify-between">
          {/* Left: Name + Branch + Status */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-medium text-gray-900 truncate">
                {project.title}
              </h3>
              <span className={cn(
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                branchColors[project.branch as keyof typeof branchColors] || branchColors.DEFAULT
              )}>
                {project.branch}
              </span>
              <span className={cn(
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                statusColors[project.status]
              )}>
                {project.status === 'IN_PROGRESS' ? 'In Progress' : project.status}
              </span>
            </div>
            <p className="text-sm text-gray-500">{project.clientName}</p>
          </div>

          {/* Center: Progress + Update + Owners */}
          <div className="flex items-center gap-6 px-6">
            {/* Progress */}
            <div className="w-32">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500">Progress</span>
                <span className="text-xs font-medium text-gray-700">{progress}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Last Update */}
            <div className="text-sm text-gray-500">
              Last update {formatDistanceToNow(new Date(project.lastUpdatedAt), { addSuffix: true })}
            </div>

            {/* Owners */}
            <div className="flex items-center -space-x-2">
              {owners.map((owner, i) => (
                <div
                  key={owner.id}
                  className="w-8 h-8 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center"
                  title={owner.name}
                >
                  <span className="text-xs font-medium text-gray-700">
                    {owner.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              ))}
              {overflowCount > 0 && (
                <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center">
                  <span className="text-xs font-medium text-gray-600">+{overflowCount}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
          </div>
        </div>
      </Link>

      {/* Quick Actions (hover) */}
      {showActions && onQuickAction && (
        <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-white rounded-lg shadow-lg border border-gray-200 p-1">
          <button
            onClick={(e) => {
              e.preventDefault();
              onQuickAction('assign', project.id);
            }}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            title="Assign"
          >
            <Users className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              onQuickAction('status', project.id);
            }}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            title="Change Status"
          >
            <AlertCircle className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              onQuickAction('share', project.id);
            }}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            title="Share"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Blocked indicator */}
      {project.status === 'BLOCKED' && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 rounded-l-2xl" />
      )}
    </div>
  );
}