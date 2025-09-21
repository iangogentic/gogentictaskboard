"use client";

import * as React from "react";
import Link from "next/link";
import {
  ChevronRight,
  MoreHorizontal,
  Users,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface ProjectRowCardProps {
  project: {
    id: string;
    title: string;
    branch: string;
    status: "Not Started" | "In Progress" | "Review" | "Blocked" | "Done";
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
  onQuickAction?: (
    action: "assign" | "status" | "share",
    projectId: string
  ) => void;
  className?: string;
}

const statusColors = {
  "Not Started": "bg-info-bg text-info",
  "In Progress": "bg-brand/10 text-brand",
  Review: "bg-portfolio-fisher/10 text-portfolio-fisher",
  Blocked: "bg-danger-bg text-danger",
  Done: "bg-success-bg text-success",
};

const branchColors = {
  CORTEX: "bg-portfolio-cortex/10 text-portfolio-cortex",
  SOLUTIONS: "bg-portfolio-solutions/10 text-portfolio-solutions",
  LAUNCHPAD: "bg-portfolio-launchpad/10 text-portfolio-launchpad",
  FISHER: "bg-portfolio-fisher/10 text-portfolio-fisher",
  DEFAULT: "bg-surface-strong text-muted",
};

export function ProjectRowCard({
  project,
  onQuickAction,
  className,
}: ProjectRowCardProps) {
  const [showActions, setShowActions] = React.useState(false);
  const progress = project.taskCounts
    ? Math.round(
        (project.taskCounts.completed / project.taskCounts.total) * 100
      ) || 0
    : project.progress || 0;

  // Deduplicate owners to avoid duplicate keys
  const uniqueOwners = new Map();

  if (project.pm) {
    uniqueOwners.set(project.pm.id, project.pm);
  }

  (project.developers || []).forEach((dev) => {
    if (!uniqueOwners.has(dev.id)) {
      uniqueOwners.set(dev.id, dev);
    }
  });

  const owners = Array.from(uniqueOwners.values()).slice(0, 3);
  const totalUniqueOwners = uniqueOwners.size;
  const overflowCount = Math.max(0, totalUniqueOwners - 3);

  return (
    <div
      className={cn(
        "group relative bg-bg rounded-2xl border border-border",
        "shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)]",
        "transition-all duration-200 hover:border-brand/20",
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
              <h3 className="text-lg font-medium text-fg truncate">
                {project.title}
              </h3>
              <span
                className={cn(
                  "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                  branchColors[project.branch as keyof typeof branchColors] ||
                    branchColors.DEFAULT
                )}
              >
                {project.branch}
              </span>
              <span
                className={cn(
                  "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                  statusColors[project.status]
                )}
              >
                {project.status}
              </span>
            </div>
            <p className="text-sm text-muted">{project.clientName}</p>
          </div>

          {/* Center: Progress + Update + Owners */}
          <div className="flex items-center gap-6 px-6">
            {/* Progress */}
            <div className="w-32">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted">Progress</span>
                <span className="text-xs font-medium text-fg">{progress}%</span>
              </div>
              <div className="h-2 bg-surface-strong rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Last Update */}
            <div className="text-sm text-muted">
              Last update{" "}
              {formatDistanceToNow(new Date(project.lastUpdatedAt), {
                addSuffix: true,
              })}
            </div>

            {/* Owners */}
            <div className="flex items-center -space-x-2">
              {owners.map((owner, i) => (
                <div
                  key={owner.id}
                  className="w-8 h-8 rounded-full bg-surface-strong border-2 border-bg flex items-center justify-center"
                  title={owner.name}
                >
                  <span className="text-xs font-medium text-fg">
                    {owner.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              ))}
              {overflowCount > 0 && (
                <div className="w-8 h-8 rounded-full bg-surface border-2 border-bg flex items-center justify-center">
                  <span className="text-xs font-medium text-muted">
                    +{overflowCount}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <ChevronRight className="w-5 h-5 text-muted group-hover:text-fg" />
          </div>
        </div>
      </Link>

      {/* Quick Actions (hover) */}
      {showActions && onQuickAction && (
        <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-bg rounded-lg shadow-lg border border-border p-1">
          <button
            onClick={(e) => {
              e.preventDefault();
              onQuickAction("assign", project.id);
            }}
            className="p-2 text-muted hover:bg-surface rounded-md transition-colors"
            title="Assign"
          >
            <Users className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              onQuickAction("status", project.id);
            }}
            className="p-2 text-muted hover:bg-surface rounded-md transition-colors"
            title="Change Status"
          >
            <AlertCircle className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              onQuickAction("share", project.id);
            }}
            className="p-2 text-muted hover:bg-surface rounded-md transition-colors"
            title="Share"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Blocked indicator */}
      {project.status === "Blocked" && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-danger rounded-l-2xl" />
      )}
    </div>
  );
}
