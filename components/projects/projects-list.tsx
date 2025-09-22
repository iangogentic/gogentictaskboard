"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ProjectRowCard } from "@/components/ui/project-row-card";
import { FilterBar } from "@/components/ui/filter-bar";
import { SavedViews, SavedView } from "@/components/ui/saved-views";
import { EmptyState } from "@/components/ui/empty-states";
import { ProjectCardSkeleton } from "@/components/ui/skeletons";
import { GlassCard, GlassButton, GlassInput } from "@/components/glass";
import { useTheme } from "@/lib/themes/provider";
import {
  Plus,
  GitBranch,
  AlertCircle,
  Clock,
  CheckCircle,
  Circle,
  Users,
  Filter,
  Search,
} from "lucide-react";

interface ProjectsListProps {
  projects: any[];
  users: any[];
  portfolios?: any[];
  loading?: boolean;
}

export function ProjectsList({
  projects,
  users,
  portfolios = [],
  loading = false,
}: ProjectsListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [customViews, setCustomViews] = useState<SavedView[]>([]);
  const [currentViewId, setCurrentViewId] = useState<string>("all");
  const { clarity } = useTheme();

  // Dynamic text colors based on theme
  const textPrimary = clarity ? "text-black/90" : "text-white/90";
  const textSecondary = clarity ? "text-black/70" : "text-white/70";
  const textMuted = clarity ? "text-black/50" : "text-white/50";

  // Filter configuration
  const filters = [
    // Portfolio filters
    ...portfolios.map((p) => ({
      label: p.name,
      value: `portfolio:${p.id}`,
      icon: (
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: p.color }}
        />
      ),
    })),
    // Status filters
    {
      label: "In Progress",
      value: "status:In Progress",
      icon: <Clock className="w-3 h-3" />,
    },
    {
      label: "Blocked",
      value: "status:Blocked",
      icon: <AlertCircle className="w-3 h-3" />,
    },
    {
      label: "Done",
      value: "status:Done",
      icon: <CheckCircle className="w-3 h-3" />,
    },
    {
      label: "Not Started",
      value: "status:Not Started",
      icon: <Circle className="w-3 h-3" />,
    },
    // Stage filters
    {
      label: "Discovery",
      value: "stage:Discovery",
      icon: <div className="w-3 h-3 bg-blue-500 rounded-full" />,
    },
    {
      label: "Build",
      value: "stage:Build",
      icon: <div className="w-3 h-3 bg-purple-500 rounded-full" />,
    },
    {
      label: "Launch",
      value: "stage:Launch",
      icon: <div className="w-3 h-3 bg-amber-500 rounded-full" />,
    },
    {
      label: "Live",
      value: "stage:Live",
      icon: <div className="w-3 h-3 bg-green-500 rounded-full" />,
    },
    {
      label: "My Projects",
      value: "mine",
      icon: <Users className="w-3 h-3" />,
    },
  ];

  // Parse active filters
  const filterCriteria = useMemo(() => {
    const criteria: any = {};
    activeFilters.forEach((filter) => {
      const [key, value] = filter.split(":");
      if (key && value) {
        criteria[key] = value;
      } else if (filter === "mine") {
        criteria.mine = true;
      }
    });
    return criteria;
  }, [activeFilters]);

  // Filter projects
  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !project.title.toLowerCase().includes(query) &&
          !project.clientName.toLowerCase().includes(query) &&
          !project.branch.toLowerCase().includes(query)
        ) {
          return false;
        }
      }

      // Status filter
      if (filterCriteria.status && project.status !== filterCriteria.status) {
        return false;
      }

      // Portfolio filter
      if (
        filterCriteria.portfolio &&
        project.portfolioId !== filterCriteria.portfolio
      ) {
        return false;
      }

      // Stage filter
      if (filterCriteria.stage && project.stage !== filterCriteria.stage) {
        return false;
      }

      // Branch filter (legacy)
      if (filterCriteria.branch && project.branch !== filterCriteria.branch) {
        return false;
      }

      // My projects filter (would need current user context)
      if (filterCriteria.mine) {
        // This would filter by current user
      }

      return true;
    });
  }, [projects, searchQuery, filterCriteria]);

  // Prepare projects with computed fields
  const enrichedProjects = filteredProjects.map((project) => ({
    ...project,
    taskCounts: {
      total: project.tasks?.length || 0,
      completed:
        project.tasks?.filter((t: any) => t.status === "DONE").length || 0,
    },
  }));

  const handleFilterToggle = (value: string) => {
    setActiveFilters((prev) =>
      prev.includes(value) ? prev.filter((f) => f !== value) : [...prev, value]
    );
  };

  const handleViewChange = (view: SavedView) => {
    setCurrentViewId(view.id);
    // Apply view filters
    const newFilters: string[] = [];
    if (view.filters.status) {
      newFilters.push(`status:${view.filters.status}`);
    }
    if (view.filters.branch) {
      newFilters.push(`branch:${view.filters.branch}`);
    }
    if (view.filters.portfolio) {
      newFilters.push(`portfolio:${view.filters.portfolio}`);
    }
    if (view.filters.stage) {
      newFilters.push(`stage:${view.filters.stage}`);
    }
    if (view.filters.assignedToMe) {
      newFilters.push("mine");
    }
    if (view.filters.dueThisWeek) {
      // Handle due this week filter if needed
    }
    setActiveFilters(newFilters);
  };

  const handleQuickAction = (action: string, projectId: string) => {
    console.log("Quick action:", action, projectId);
    // Implement quick actions
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.1 }}
          >
            <GlassCard className="p-6 h-32">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-white/10 rounded w-3/4"></div>
                <div className="h-3 bg-white/10 rounded w-1/2"></div>
                <div className="h-3 bg-white/10 rounded w-1/4"></div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <motion.div
        className="mb-6 flex items-center justify-between"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div>
          <h2 className={`text-2xl font-bold ${textPrimary}`}>Projects</h2>
          <p className={`mt-1 text-sm ${textMuted}`}>
            {filteredProjects.length} of {projects.length} projects
          </p>
        </div>
        <div className="flex items-center gap-3">
          <SavedViews
            views={customViews}
            currentViewId={currentViewId}
            onViewChange={handleViewChange}
            onSaveView={(name, filters) => {
              const newView: SavedView = {
                id: `custom-${Date.now()}`,
                name,
                filters,
                icon: <Filter className="w-4 h-4" />,
              };
              setCustomViews([...customViews, newView]);
            }}
            onDeleteView={(id) => {
              setCustomViews(customViews.filter((v) => v.id !== id));
            }}
          />
          <Link href="/projects/new">
            <GlassButton
              size="md"
              variant="primary"
              icon={<Plus className="w-4 h-4" />}
            >
              New Project
            </GlassButton>
          </Link>
        </div>
      </motion.div>

      {/* Search Bar */}
      <motion.div
        className="mb-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <GlassInput
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search projects..."
          icon={<Search className="w-5 h-5" />}
          className="w-full"
          glow
        />
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="mb-6"
      >
        <GlassCard className="p-4">
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => {
              const isActive = activeFilters.includes(filter.value);
              return (
                <button
                  key={filter.value}
                  onClick={() => handleFilterToggle(filter.value)}
                  className={`
                    inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all duration-200
                    ${
                      isActive
                        ? clarity
                          ? "bg-black/30 text-black border border-black/40"
                          : "bg-white/20 text-white border border-white/30"
                        : clarity
                          ? "bg-black/10 text-black/70 border border-black/20 hover:bg-black/20 hover:text-black/90"
                          : "bg-white/5 text-white/70 border border-white/10 hover:bg-white/10 hover:text-white/90"
                    }
                  `}
                >
                  {filter.icon}
                  {filter.label}
                </button>
              );
            })}
          </div>
        </GlassCard>
      </motion.div>

      {/* Projects List */}
      {enrichedProjects.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <GlassCard className="p-12 text-center">
            <div className={`${textMuted} mb-4`}>
              <Filter className="w-12 h-12 mx-auto mb-4" />
              <h3 className={`text-lg font-medium ${textSecondary}`}>
                {searchQuery || activeFilters.length > 0
                  ? "No projects found"
                  : "No projects yet"}
              </h3>
              <p className={`${textMuted} mt-2`}>
                {searchQuery || activeFilters.length > 0
                  ? "Try adjusting your search or filters"
                  : "Create your first project to get started"}
              </p>
            </div>
            {!searchQuery && activeFilters.length === 0 && (
              <Link href="/projects/new">
                <GlassButton
                  variant="primary"
                  icon={<Plus className="w-4 h-4" />}
                >
                  Create Project
                </GlassButton>
              </Link>
            )}
          </GlassCard>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {enrichedProjects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 + index * 0.05 }}
            >
              <GlassCard
                className="p-6 group hover:scale-[1.01] transition-all duration-200"
                hover
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {project.portfolio && (
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: project.portfolio.color }}
                        />
                      )}
                      <Link
                        href={`/projects/${project.id}`}
                        className={`text-lg font-semibold ${textPrimary} ${clarity ? "hover:text-black" : "hover:text-white"} transition-colors`}
                      >
                        {project.title}
                      </Link>
                      <span
                        className={`
                        px-2 py-1 text-xs rounded-full font-medium
                        ${
                          project.status === "IN_PROGRESS"
                            ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                            : project.status === "BLOCKED"
                              ? "bg-red-500/20 text-red-300 border border-red-500/30"
                              : project.status === "COMPLETED"
                                ? "bg-green-500/20 text-green-300 border border-green-500/30"
                                : "bg-white/10 text-white/70 border border-white/20"
                        }
                      `}
                      >
                        {project.status?.replace("_", " ")}
                      </span>
                    </div>
                    <div
                      className={`flex items-center gap-6 text-sm ${textMuted}`}
                    >
                      <span>{project.clientName}</span>
                      {project.taskCounts && (
                        <span className="flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" />
                          {project.taskCounts.completed}/
                          {project.taskCounts.total} tasks
                        </span>
                      )}
                      {project.lastUpdatedAt && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {new Date(project.lastUpdatedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/projects/${project.id}`}>
                      <GlassButton size="sm" variant="ghost">
                        View
                      </GlassButton>
                    </Link>
                    <Link href={`/projects/${project.id}/edit`}>
                      <GlassButton size="sm" variant="ghost">
                        Edit
                      </GlassButton>
                    </Link>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
