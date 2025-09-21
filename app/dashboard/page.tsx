"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { format, subDays } from "date-fns";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Users,
  Briefcase,
  CheckCircle,
  Clock,
  AlertCircle,
  Calendar,
  BarChart3,
  GitBranch,
  Target,
  Timer,
  FolderOpen,
  ArrowUpRight,
  Heart,
  Shield,
  Zap,
  Rocket,
} from "lucide-react";
import { GlassCard, GlassNav } from "@/components/glass";
import { AnimatedBackground } from "@/components/glass/AnimatedBackground";

interface Portfolio {
  id: string;
  key: string;
  name: string;
  color: string;
  description: string;
  projectCount: number;
  inProgressCount: number;
  blockedCount: number;
  liveCount: number;
  avgHealth: number;
}

interface AttentionItem {
  id: string;
  title: string;
  portfolio: string;
  portfolioColor: string;
  issue: string;
  severity: "high" | "medium" | "low";
}

export default function DashboardPage() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [needsAttention, setNeedsAttention] = useState<AttentionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch("/api/dashboard");
      const data = await response.json();
      setPortfolios(data.portfolios || []);
      setNeedsAttention(data.needsAttention || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getPortfolioIcon = (key: string) => {
    switch (key) {
      case "cortex":
        return <Zap className="w-5 h-5" />;
      case "solutions":
        return <Shield className="w-5 h-5" />;
      case "launchpad":
        return <Rocket className="w-5 h-5" />;
      case "fisher":
        return <Heart className="w-5 h-5" />;
      default:
        return <FolderOpen className="w-5 h-5" />;
    }
  };

  const totalProjects = portfolios.reduce((sum, p) => sum + p.projectCount, 0);
  const totalInProgress = portfolios.reduce(
    (sum, p) => sum + p.inProgressCount,
    0
  );
  const totalBlocked = portfolios.reduce((sum, p) => sum + p.blockedCount, 0);
  const totalLive = portfolios.reduce((sum, p) => sum + p.liveCount, 0);

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <AnimatedBackground />
        <GlassNav />
        <div className="relative z-10 min-h-screen flex items-center justify-center pt-20">
          <motion.div
            className="text-white/70 text-lg"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Loading dashboard...
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <AnimatedBackground />
      <GlassNav />

      <div className="relative z-10 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-3xl font-bold text-white/90">
              Portfolio Dashboard
            </h1>
            <p className="text-white/70 mt-1">
              Real-time overview of all portfolios and projects
            </p>
          </motion.div>

          {/* Global Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {[
              {
                label: "Total Projects",
                value: totalProjects,
                icon: Briefcase,
                color: "text-blue-400",
              },
              {
                label: "In Progress",
                value: totalInProgress,
                icon: Clock,
                color: "text-green-400",
              },
              {
                label: "Blocked",
                value: totalBlocked,
                icon: AlertCircle,
                color: "text-red-400",
              },
              {
                label: "Live",
                value: totalLive,
                icon: CheckCircle,
                color: "text-purple-400",
              },
            ].map((metric, index) => {
              const Icon = metric.icon;
              return (
                <motion.div
                  key={metric.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <GlassCard className="p-6" hover>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-white/50">{metric.label}</p>
                        <p className="text-2xl font-bold text-white/90 mt-1">
                          {metric.value}
                        </p>
                      </div>
                      <Icon className={`w-8 h-8 ${metric.color}`} />
                    </div>
                  </GlassCard>
                </motion.div>
              );
            })}
          </div>

          {/* Needs Attention */}
          {needsAttention.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="mb-8"
            >
              <GlassCard className="p-6 border-red-500/20 bg-red-500/5">
                <h2 className="text-lg font-semibold text-red-400 mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Needs Immediate Attention
                </h2>
                <div className="space-y-3">
                  {needsAttention.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="bg-white/5 rounded-xl p-4 flex items-center justify-between backdrop-blur-xl"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-2 h-12 rounded-full"
                          style={{ backgroundColor: item.portfolioColor }}
                        />
                        <div>
                          <Link
                            href={`/projects/${item.id}`}
                            className="font-medium text-white/90 hover:text-white transition-colors"
                          >
                            {item.title}
                          </Link>
                          <p className="text-sm text-white/50">
                            {item.portfolio} • {item.issue}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full backdrop-blur-xl ${
                          item.severity === "high"
                            ? "bg-red-500/20 text-red-300 border border-red-500/30"
                            : item.severity === "medium"
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                              : "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
                        }`}
                      >
                        {item.severity}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* Portfolio Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {portfolios.map((portfolio, index) => (
              <motion.div
                key={portfolio.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
              >
                <GlassCard className="overflow-hidden" hover glow>
                  <div
                    className="h-1"
                    style={{
                      background: `linear-gradient(90deg, ${portfolio.color}, ${portfolio.color}80)`,
                    }}
                  />
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center backdrop-blur-xl"
                          style={{
                            backgroundColor: `${portfolio.color}20`,
                            border: `1px solid ${portfolio.color}30`,
                          }}
                        >
                          <div style={{ color: portfolio.color }}>
                            {getPortfolioIcon(portfolio.key)}
                          </div>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white/90">
                            {portfolio.name}
                          </h3>
                          <p className="text-sm text-white/50 line-clamp-1">
                            {portfolio.description}
                          </p>
                        </div>
                      </div>
                      <Link
                        href={`/projects?portfolio=${portfolio.key}`}
                        className="p-2 hover:bg-white/5 rounded-xl transition-all duration-200 group"
                      >
                        <ArrowUpRight className="w-4 h-4 text-white/50 group-hover:text-white/80 transition-colors" />
                      </Link>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-white/50">Projects</p>
                        <p className="text-2xl font-bold text-white/90">
                          {portfolio.projectCount}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-white/50">Health</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 bg-white/10 rounded-full h-2">
                            <motion.div
                              className={`h-2 rounded-full ${
                                portfolio.avgHealth >= 80
                                  ? "bg-green-400"
                                  : portfolio.avgHealth >= 60
                                    ? "bg-amber-400"
                                    : "bg-red-400"
                              }`}
                              initial={{ width: 0 }}
                              animate={{ width: `${portfolio.avgHealth}%` }}
                              transition={{
                                duration: 1,
                                delay: 1 + index * 0.2,
                              }}
                            />
                          </div>
                          <span className="text-sm font-medium text-white/70">
                            {portfolio.avgHealth}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm flex-wrap">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-blue-400" />
                        <span className="text-white/50">Progress:</span>
                        <span className="font-medium text-white/90">
                          {portfolio.inProgressCount}
                        </span>
                      </div>
                      {portfolio.blockedCount > 0 && (
                        <div className="flex items-center gap-1">
                          <AlertCircle className="w-4 h-4 text-red-400" />
                          <span className="text-white/50">Blocked:</span>
                          <span className="font-medium text-red-400">
                            {portfolio.blockedCount}
                          </span>
                        </div>
                      )}
                      {portfolio.liveCount > 0 && (
                        <div className="flex items-center gap-1">
                          <CheckCircle className="w-4 h-4 text-green-400" />
                          <span className="text-white/50">Live:</span>
                          <span className="font-medium text-green-400">
                            {portfolio.liveCount}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                href: "/projects",
                title: "View All Projects",
                desc: "Browse all projects by portfolio",
                icon: FolderOpen,
              },
              {
                href: "/reports",
                title: "Portfolio Reports",
                desc: "Detailed analytics and metrics",
                icon: BarChart3,
              },
              {
                href: "/activity",
                title: "Recent Activity",
                desc: "Latest updates across portfolios",
                icon: Activity,
              },
            ].map((link, index) => {
              const Icon = link.icon;
              return (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 1.2 + index * 0.1 }}
                >
                  <Link href={link.href} className="block group">
                    <GlassCard
                      className="p-6 transition-all duration-200 group-hover:scale-[1.02]"
                      hover
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-white/90 group-hover:text-white transition-colors">
                            {link.title}
                          </p>
                          <p className="text-sm text-white/50 mt-1 line-clamp-1">
                            {link.desc}
                          </p>
                        </div>
                        <Icon className="w-8 h-8 text-white/50 group-hover:text-white/80 transition-colors" />
                      </div>
                    </GlassCard>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
