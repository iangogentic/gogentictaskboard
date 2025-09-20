"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Filter,
  Search,
  MoreVertical,
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  Users,
  TrendingUp,
  Target,
} from "lucide-react";

interface Portfolio {
  id: string;
  key: string;
  name: string;
  color: string;
  description: string;
}

interface Project {
  id: string;
  title: string;
  stage: string;
  health: string;
  status: string;
  pmId: string;
  pm: { name: string; email: string };
  developers: { id: string; name: string }[];
  targetDelivery: string | null;
  clientName: string;
  _count: { tasks: number };
}

export default function PortfolioDashboard({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const router = useRouter();
  const [portfolioKey, setPortfolioKey] = useState<string | null>(null);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    params.then((p) => setPortfolioKey(p.key));
  }, [params]);

  useEffect(() => {
    if (portfolioKey) {
      fetchPortfolioData();
    }
  }, [portfolioKey]);

  useEffect(() => {
    filterProjects();
  }, [projects, searchTerm, stageFilter, statusFilter]);

  const fetchPortfolioData = async () => {
    if (!portfolioKey) return;
    try {
      const response = await fetch(`/api/portfolio/${portfolioKey}`);
      const data = await response.json();
      setPortfolio(data.portfolio);
      setProjects(data.projects);
      setFilteredProjects(data.projects);
    } catch (error) {
      console.error("Failed to fetch portfolio data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterProjects = () => {
    let filtered = [...projects];

    if (searchTerm) {
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.clientName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (stageFilter !== "all") {
      filtered = filtered.filter((p) => p.stage === stageFilter);
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((p) => p.status === statusFilter);
    }

    setFilteredProjects(filtered);
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case "Discovery":
        return "bg-info-bg text-info";
      case "Build":
        return "bg-portfolio-fisher/10 text-portfolio-fisher";
      case "Launch":
        return "bg-warn-bg text-warn";
      case "Live":
        return "bg-success-bg text-success";
      default:
        return "bg-surface text-fg";
    }
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case "Green":
        return <CheckCircle className="w-4 h-4 text-success" />;
      case "Amber":
        return <AlertCircle className="w-4 h-4 text-warn" />;
      case "Red":
        return <AlertCircle className="w-4 h-4 text-danger" />;
      default:
        return <Activity className="w-4 h-4 text-muted" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Not Started":
        return "text-muted";
      case "In Progress":
        return "text-brand";
      case "Review":
        return "text-portfolio-fisher";
      case "Blocked":
        return "text-danger";
      case "Done":
        return "text-success";
      default:
        return "text-muted";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto"></div>
          <p className="mt-4 text-muted">Loading portfolio...</p>
        </div>
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted">Portfolio not found</p>
          <Link href="/" className="mt-4 text-brand hover:text-brand-hover">
            Back to Mission Control
          </Link>
        </div>
      </div>
    );
  }

  // Calculate stats
  const stats = {
    total: projects.length,
    discovery: projects.filter((p) => p.stage === "Discovery").length,
    build: projects.filter((p) => p.stage === "Build").length,
    launch: projects.filter((p) => p.stage === "Launch").length,
    live: projects.filter((p) => p.stage === "Live").length,
    blocked: projects.filter((p) => p.status === "Blocked").length,
    tasksTotal: projects.reduce((sum, p) => sum + p._count.tasks, 0),
  };

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link
                href="/"
                className="inline-flex items-center text-sm text-muted hover:text-fg mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Mission Control
              </Link>
              <div className="flex items-center">
                <div
                  className="w-2 h-8 rounded-full mr-3"
                  style={{ backgroundColor: portfolio.color }}
                />
                <div>
                  <h1 className="text-2xl font-bold text-fg">
                    {portfolio.name}
                  </h1>
                  <p className="text-sm text-muted mt-1">
                    {portfolio.description}
                  </p>
                </div>
              </div>
            </div>
            <Link
              href="/projects/new"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white"
              style={{ backgroundColor: portfolio.color }}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
          <div className="bg-bg rounded-lg shadow-sm p-4">
            <div className="text-sm text-muted">Total</div>
            <div className="text-2xl font-bold text-fg">{stats.total}</div>
          </div>
          <div className="bg-bg rounded-lg shadow-sm p-4">
            <div className="text-sm text-muted">Discovery</div>
            <div className="text-2xl font-bold text-brand">
              {stats.discovery}
            </div>
          </div>
          <div className="bg-bg rounded-lg shadow-sm p-4">
            <div className="text-sm text-muted">Build</div>
            <div className="text-2xl font-bold text-portfolio-fisher">
              {stats.build}
            </div>
          </div>
          <div className="bg-bg rounded-lg shadow-sm p-4">
            <div className="text-sm text-muted">Launch</div>
            <div className="text-2xl font-bold text-warn">{stats.launch}</div>
          </div>
          <div className="bg-bg rounded-lg shadow-sm p-4">
            <div className="text-sm text-muted">Live</div>
            <div className="text-2xl font-bold text-success">{stats.live}</div>
          </div>
          <div className="bg-bg rounded-lg shadow-sm p-4">
            <div className="text-sm text-muted">Blocked</div>
            <div className="text-2xl font-bold text-danger">
              {stats.blocked}
            </div>
          </div>
          <div className="bg-bg rounded-lg shadow-sm p-4">
            <div className="text-sm text-muted">Tasks</div>
            <div className="text-2xl font-bold text-fg">{stats.tasksTotal}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-bg rounded-lg shadow-sm mb-6">
          <div className="px-6 py-4 border-b">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted" />
                  <input
                    type="text"
                    placeholder="Search projects..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-border rounded-md focus:ring-brand focus:border-brand"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <select
                  value={stageFilter}
                  onChange={(e) => setStageFilter(e.target.value)}
                  className="px-4 py-2 border border-border rounded-md focus:ring-brand focus:border-brand"
                >
                  <option value="all">All Stages</option>
                  <option value="Discovery">Discovery</option>
                  <option value="Build">Build</option>
                  <option value="Launch">Launch</option>
                  <option value="Live">Live</option>
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-border rounded-md focus:ring-brand focus:border-brand"
                >
                  <option value="all">All Status</option>
                  <option value="Not Started">Not Started</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Review">Review</option>
                  <option value="Blocked">Blocked</option>
                  <option value="Done">Done</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="bg-bg rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-fg hover:text-brand">
                    {project.title}
                  </h3>
                  <div className="flex items-center">
                    {getHealthIcon(project.health)}
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${getStageColor(project.stage)}`}
                  >
                    {project.stage}
                  </span>
                  <span
                    className={`text-xs font-medium ${getStatusColor(project.status)}`}
                  >
                    {project.status}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted">Client</span>
                    <span className="text-fg">{project.clientName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">PM</span>
                    <span className="text-fg">{project.pm.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Team</span>
                    <span className="text-fg">
                      {project.developers.length} devs
                    </span>
                  </div>
                  {project.targetDelivery && (
                    <div className="flex justify-between">
                      <span className="text-muted">Due</span>
                      <span className="text-fg">
                        {new Date(project.targetDelivery).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t flex justify-between items-center">
                  <div className="flex items-center text-sm text-muted">
                    <Target className="w-4 h-4 mr-1" />
                    {project._count.tasks} tasks
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      // Handle more actions
                    }}
                    className="p-1 hover:bg-surface rounded"
                  >
                    <MoreVertical className="w-4 h-4 text-muted" />
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {filteredProjects.length === 0 && (
          <div className="bg-bg rounded-lg shadow-sm p-12 text-center">
            <p className="text-muted">
              No projects found matching your filters
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
