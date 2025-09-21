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
import { GlassCard, GlassTopBar } from "@/components/glass";
import { AnimatedBackground } from "@/components/glass/AnimatedBackground";
import { useTheme } from "@/lib/themes/provider";
import {
  THEMES,
  buildConic,
  buildRadial,
  buildGrid,
} from "@/lib/themes/constants";

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
  const { theme, clarity } = useTheme();

  const [portfolioKey, setPortfolioKey] = useState<string | null>(null);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Build theme-driven background styles
  const A = THEMES[theme].a;
  const B = THEMES[theme].b;
  const conic = { backgroundImage: buildConic(A, B) };
  const radialA = { backgroundImage: buildRadial(B) };
  const radialB = { backgroundImage: buildRadial(A) };
  const gridStyle: React.CSSProperties = {
    backgroundImage: buildGrid(),
    backgroundSize: "64px 64px",
    maskImage: "radial-gradient(80% 60% at 50% 40%, black, transparent)",
    WebkitMaskImage: "radial-gradient(80% 60% at 50% 40%, black, transparent)",
  };

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
        return "bg-blue-500/20 text-blue-400";
      case "Build":
        return "bg-purple-500/20 text-purple-400";
      case "Launch":
        return "bg-amber-500/20 text-amber-400";
      case "Live":
        return "bg-green-500/20 text-green-400";
      default:
        return "bg-white/10 text-white/60";
    }
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case "Green":
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case "Amber":
        return <AlertCircle className="w-4 h-4 text-amber-400" />;
      case "Red":
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Activity className="w-4 h-4 text-white/50" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Not Started":
        return "text-white/50";
      case "In Progress":
        return "text-blue-400";
      case "Review":
        return "text-purple-400";
      case "Blocked":
        return "text-red-400";
      case "Done":
        return "text-green-400";
      default:
        return "text-white/50";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden text-white">
        <AnimatedBackground />
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="absolute -top-24 left-1/2 h-[52rem] w-[52rem] -translate-x-1/2 rounded-full blur-3xl"
            style={{ ...conic, opacity: clarity ? 0.18 : 0.3 }}
          />
          <div
            className="absolute -bottom-48 -left-24 h-[40rem] w-[40rem] rounded-full blur-3xl"
            style={{ ...radialA, opacity: clarity ? 0.14 : 0.25 }}
          />
          <div
            className="absolute -bottom-20 -right-20 h-[36rem] w-[36rem] rounded-full blur-3xl"
            style={{ ...radialB, opacity: clarity ? 0.14 : 0.25 }}
          />
          <div
            className="absolute inset-0"
            style={{ ...gridStyle, opacity: clarity ? 0.07 : 0.12 }}
          />
          {clarity ? <div className="absolute inset-0 bg-black/40" /> : null}
        </div>
        <GlassTopBar />
        <div className="relative z-10 pt-24 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white/50 mx-auto"></div>
            <p className="mt-4 text-white/70">Loading portfolio...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="min-h-screen relative overflow-hidden text-white">
        <AnimatedBackground />
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="absolute -top-24 left-1/2 h-[52rem] w-[52rem] -translate-x-1/2 rounded-full blur-3xl"
            style={{ ...conic, opacity: clarity ? 0.18 : 0.3 }}
          />
          <div
            className="absolute -bottom-48 -left-24 h-[40rem] w-[40rem] rounded-full blur-3xl"
            style={{ ...radialA, opacity: clarity ? 0.14 : 0.25 }}
          />
          <div
            className="absolute -bottom-20 -right-20 h-[36rem] w-[36rem] rounded-full blur-3xl"
            style={{ ...radialB, opacity: clarity ? 0.14 : 0.25 }}
          />
          <div
            className="absolute inset-0"
            style={{ ...gridStyle, opacity: clarity ? 0.07 : 0.12 }}
          />
          {clarity ? <div className="absolute inset-0 bg-black/40" /> : null}
        </div>
        <GlassTopBar />
        <div className="relative z-10 pt-24 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-white/70">Portfolio not found</p>
            <Link href="/" className="mt-4 text-blue-400 hover:text-blue-300">
              Back to Mission Control
            </Link>
          </div>
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
    <div className="min-h-screen relative overflow-hidden text-white">
      {/* Animated particle background */}
      <AnimatedBackground />

      {/* BACKGROUND (theme-driven) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-24 left-1/2 h-[52rem] w-[52rem] -translate-x-1/2 rounded-full blur-3xl"
          style={{ ...conic, opacity: clarity ? 0.18 : 0.3 }}
        />
        <div
          className="absolute -bottom-48 -left-24 h-[40rem] w-[40rem] rounded-full blur-3xl"
          style={{ ...radialA, opacity: clarity ? 0.14 : 0.25 }}
        />
        <div
          className="absolute -bottom-20 -right-20 h-[36rem] w-[36rem] rounded-full blur-3xl"
          style={{ ...radialB, opacity: clarity ? 0.14 : 0.25 }}
        />
        <div
          className="absolute inset-0"
          style={{ ...gridStyle, opacity: clarity ? 0.07 : 0.12 }}
        />
        {clarity ? <div className="absolute inset-0 bg-black/40" /> : null}
      </div>

      {/* Top Navigation */}
      <GlassTopBar />

      <div className="relative z-10 pt-24 px-6 pb-10">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Link
                  href="/"
                  className="inline-flex items-center text-sm text-white/70 hover:text-white mr-4"
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
                    <h1 className="text-2xl font-bold text-white/90">
                      {portfolio.name}
                    </h1>
                    <p className="text-sm text-white/60 mt-1">
                      {portfolio.description}
                    </p>
                  </div>
                </div>
              </div>
              <Link
                href="/projects/new"
                className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-medium text-white border transition-all ${
                  clarity
                    ? "bg-purple-500/20 border-purple-400/40 hover:bg-purple-500/30"
                    : "bg-purple-500/10 border-purple-400/20 hover:bg-purple-500/20"
                }`}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Link>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
            <GlassCard clarity={clarity} className="p-4">
              <div className="text-sm text-white/50">Total</div>
              <div className="text-2xl font-bold text-white/90">
                {stats.total}
              </div>
            </GlassCard>
            <GlassCard clarity={clarity} className="p-4">
              <div className="text-sm text-white/50">Discovery</div>
              <div className="text-2xl font-bold text-blue-400">
                {stats.discovery}
              </div>
            </GlassCard>
            <GlassCard clarity={clarity} className="p-4">
              <div className="text-sm text-white/50">Build</div>
              <div className="text-2xl font-bold text-purple-400">
                {stats.build}
              </div>
            </GlassCard>
            <GlassCard clarity={clarity} className="p-4">
              <div className="text-sm text-white/50">Launch</div>
              <div className="text-2xl font-bold text-amber-400">
                {stats.launch}
              </div>
            </GlassCard>
            <GlassCard clarity={clarity} className="p-4">
              <div className="text-sm text-white/50">Live</div>
              <div className="text-2xl font-bold text-green-400">
                {stats.live}
              </div>
            </GlassCard>
            <GlassCard clarity={clarity} className="p-4">
              <div className="text-sm text-white/50">Blocked</div>
              <div className="text-2xl font-bold text-red-400">
                {stats.blocked}
              </div>
            </GlassCard>
            <GlassCard clarity={clarity} className="p-4">
              <div className="text-sm text-white/50">Tasks</div>
              <div className="text-2xl font-bold text-white/90">
                {stats.tasksTotal}
              </div>
            </GlassCard>
          </div>

          {/* Filters */}
          <GlassCard clarity={clarity} className="mb-6">
            <div
              className={`px-6 py-4 border-b ${clarity ? "border-white/20" : "border-white/10"}`}
            >
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/40" />
                    <input
                      type="text"
                      placeholder="Search projects..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className={`w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500/50 text-white placeholder-white/40 ${
                        clarity
                          ? "bg-white/20 border-white/20 focus:border-white/30"
                          : "bg-white/5 border-white/10 focus:border-white/20"
                      }`}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <select
                    value={stageFilter}
                    onChange={(e) => setStageFilter(e.target.value)}
                    className={`px-4 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500/50 text-white ${
                      clarity
                        ? "bg-white/20 border-white/20 focus:border-white/30"
                        : "bg-white/5 border-white/10 focus:border-white/20"
                    }`}
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
                    className={`px-4 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500/50 text-white ${
                      clarity
                        ? "bg-white/20 border-white/20 focus:border-white/30"
                        : "bg-white/5 border-white/10 focus:border-white/20"
                    }`}
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
          </GlassCard>

          {/* Projects Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="block"
              >
                <GlassCard
                  clarity={clarity}
                  className={`transition-all ${
                    clarity ? "hover:bg-white/[0.08]" : "hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-white/90 hover:text-blue-400">
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
                        <span className="text-white/50">Client</span>
                        <span className="text-white/90">
                          {project.clientName}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/50">PM</span>
                        <span className="text-white/90">{project.pm.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/50">Team</span>
                        <span className="text-white/90">
                          {project.developers.length} devs
                        </span>
                      </div>
                      {project.targetDelivery && (
                        <div className="flex justify-between">
                          <span className="text-white/50">Due</span>
                          <span className="text-white/90">
                            {new Date(
                              project.targetDelivery
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
                      <div className="flex items-center text-sm text-white/50">
                        <Target className="w-4 h-4 mr-1" />
                        {project._count.tasks} tasks
                      </div>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          // Handle more actions
                        }}
                        className={`p-1 rounded transition ${
                          clarity ? "hover:bg-white/15" : "hover:bg-white/10"
                        }`}
                      >
                        <MoreVertical className="w-4 h-4 text-white/50" />
                      </button>
                    </div>
                  </div>
                </GlassCard>
              </Link>
            ))}
          </div>

          {filteredProjects.length === 0 && (
            <GlassCard clarity={clarity} className="p-12 text-center">
              <p className="text-white/50">
                No projects found matching your filters
              </p>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
}
