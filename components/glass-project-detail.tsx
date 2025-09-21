"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Copy,
  RefreshCw,
  Calendar,
  Users,
  Mail,
  Clock,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  Circle,
  User as UserIcon,
  Activity,
  Package,
  ChevronRight,
  Zap,
  Bell,
  LinkIcon,
} from "lucide-react";
import { GlassCard, Badge, GlassTabs, type Tab } from "@/components/glass";
import { useTheme } from "@/lib/themes/provider";
import TaskBoardWithBulk from "./task-board-with-bulk";
import DeliverablesList from "./deliverables-list";
import type { Project, User, Task, Update, Deliverable } from "@prisma/client";

type ProjectWithRelations = Project & {
  pm: User;
  developers: User[];
  tasks: (Task & { assignee: User | null })[];
  updates: (Update & { author: User })[];
  deliverables: Deliverable[];
};

interface ProjectDetailProps {
  project: ProjectWithRelations;
  users: User[];
}

export default function GlassProjectDetail({
  project,
  users,
}: ProjectDetailProps) {
  const router = useRouter();
  const { clarity } = useTheme();
  const [activeTab, setActiveTab] = useState<
    "overview" | "tasks" | "activity" | "deliverables"
  >("overview");
  const [showCopied, setShowCopied] = useState(false);
  const [addingUpdate, setAddingUpdate] = useState(false);
  const [updateText, setUpdateText] = useState("");
  const [selectedAuthorId, setSelectedAuthorId] = useState(users[0]?.id || "");
  const [shareUrl, setShareUrl] = useState("");

  // Set share URL on client side only
  useEffect(() => {
    if (typeof window !== "undefined") {
      setShareUrl(
        `${window.location.origin}/share/${project.clientShareToken}`
      );
    }
  }, [project.clientShareToken]);

  const copyClientLink = () => {
    if (typeof window !== "undefined") {
      const link = `${window.location.origin}/share/${project.clientShareToken}`;
      navigator.clipboard.writeText(link);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    }
  };

  const regenerateToken = async () => {
    const response = await fetch(
      `/api/projects/${project.id}/regenerate-token`,
      {
        method: "POST",
      }
    );
    if (response.ok) {
      router.refresh();
    }
  };

  const handleAddUpdate = async () => {
    if (!updateText.trim()) return;

    try {
      const response = await fetch("/api/updates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          authorId: selectedAuthorId,
          body: updateText,
        }),
      });

      if (response.ok) {
        setUpdateText("");
        setAddingUpdate(false);
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to add update:", error);
    }
  };

  const tabs: Tab[] = [
    { id: "overview", label: "Overview", icon: Activity },
    {
      id: "tasks",
      label: "Tasks",
      icon: CheckCircle2,
      badge:
        project.tasks.filter((t) => t.status !== "COMPLETED").length ||
        undefined,
    },
    {
      id: "activity",
      label: "Activity",
      icon: Bell,
      badge: project.updates.length || undefined,
    },
    {
      id: "deliverables",
      label: "Deliverables",
      icon: Package,
      badge: project.deliverables.length || undefined,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "In Progress":
        return "text-blue-400";
      case "Done":
        return "text-green-400";
      case "Not Started":
        return "text-yellow-400";
      case "Blocked":
        return "text-red-400";
      case "Review":
        return "text-purple-400";
      default:
        return "text-white/70";
    }
  };

  return (
    <div className="relative z-10 pt-2">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-6 mb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/projects"
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition ${
                clarity
                  ? "border-white/25 bg-white/10 hover:bg-white/15"
                  : "border-white/20 bg-white/5 hover:bg-white/10"
              } text-white/90 hover:text-white`}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Projects
            </Link>
            <div className="border-l border-white/20 pl-4">
              <h1 className="text-2xl font-semibold text-white">
                {project.title}
              </h1>
              <div className="flex items-center gap-3 mt-1">
                <Badge>{project.branch}</Badge>
                <span
                  className={`text-sm font-medium ${getStatusColor(project.status)}`}
                >
                  {project.status.replace("_", " ")}
                </span>
              </div>
            </div>
          </div>
          <Link
            href={`/projects/${project.id}/edit`}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition ${
              clarity
                ? "border-purple-400/40 bg-purple-500/20 hover:bg-purple-500/30"
                : "border-purple-400/20 bg-purple-500/10 hover:bg-purple-500/20"
            } text-white`}
          >
            <Edit className="h-4 w-4" />
            Edit Project
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-6 mb-2">
        <GlassTabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={(tabId) => setActiveTab(tabId as any)}
        />
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Project Details */}
              <div className="lg:col-span-2">
                <GlassCard clarity={clarity} className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Project Details
                  </h3>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <UserIcon className="h-5 w-5 text-white/50 mt-0.5" />
                      <div>
                        <div className="text-sm text-white/70">
                          Project Manager
                        </div>
                        <div className="text-white font-medium">
                          {project.pm.name}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Users className="h-5 w-5 text-white/50 mt-0.5" />
                      <div>
                        <div className="text-sm text-white/70">Developers</div>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {project.developers.length > 0 ? (
                            project.developers.map((dev) => (
                              <Badge key={dev.id}>{dev.name}</Badge>
                            ))
                          ) : (
                            <span className="text-white/50 text-sm">
                              No developers assigned
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Mail className="h-5 w-5 text-white/50 mt-0.5" />
                      <div>
                        <div className="text-sm text-white/70">Client</div>
                        <div className="text-white">{project.clientName}</div>
                        <div className="text-sm text-white/50">
                          {project.clientEmail}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-white/50 mt-0.5" />
                      <div>
                        <div className="text-sm text-white/70">Timeline</div>
                        <div className="text-white">
                          {project.startDate && (
                            <span>
                              Started{" "}
                              {format(
                                new Date(project.startDate),
                                "MMM d, yyyy"
                              )}
                            </span>
                          )}
                          {project.targetDelivery && (
                            <span className="block text-sm text-white/70">
                              Target:{" "}
                              {format(
                                new Date(project.targetDelivery),
                                "MMM d, yyyy"
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-white/50 mt-0.5" />
                      <div>
                        <div className="text-sm text-white/70">
                          Last Updated
                        </div>
                        <div className="text-white">
                          {format(
                            new Date(project.lastUpdatedAt),
                            "MMM d, yyyy h:mm a"
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {project.notes && (
                    <div className="mt-6 pt-6 border-t border-white/10">
                      <h4 className="text-sm font-semibold text-white mb-2">
                        Notes
                      </h4>
                      <p className="text-white/80 text-sm leading-relaxed">
                        {project.notes}
                      </p>
                    </div>
                  )}
                </GlassCard>
              </div>

              {/* Client Share */}
              <div>
                <GlassCard clarity={clarity} className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Client Share Link
                  </h3>

                  <div className="space-y-3">
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                      <div className="text-xs text-white/50 mb-1">
                        Share URL
                      </div>
                      <div className="text-sm text-white break-all">
                        {shareUrl ||
                          `[loading...]/share/${project.clientShareToken}`}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={copyClientLink}
                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl border transition ${
                          clarity
                            ? "border-white/25 bg-white/10 hover:bg-white/15"
                            : "border-white/20 bg-white/5 hover:bg-white/10"
                        } text-white text-sm`}
                      >
                        <Copy className="h-4 w-4" />
                        {showCopied ? "Copied!" : "Copy"}
                      </button>
                      <button
                        onClick={regenerateToken}
                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl border transition ${
                          clarity
                            ? "border-white/25 bg-white/10 hover:bg-white/15"
                            : "border-white/20 bg-white/5 hover:bg-white/10"
                        } text-white text-sm`}
                      >
                        <RefreshCw className="h-4 w-4" />
                        Regenerate
                      </button>
                    </div>
                  </div>
                </GlassCard>

                {/* Quick Stats */}
                <GlassCard clarity={clarity} className="p-6 mt-6">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Quick Stats
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-white/70">Total Tasks</span>
                      <span className="text-white font-medium">
                        {project.tasks.length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-white/70">Completed</span>
                      <span className="text-white font-medium">
                        {
                          project.tasks.filter((t) => t.status === "COMPLETED")
                            .length
                        }
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-white/70">Updates</span>
                      <span className="text-white font-medium">
                        {project.updates.length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-white/70">
                        Deliverables
                      </span>
                      <span className="text-white font-medium">
                        {project.deliverables.length}
                      </span>
                    </div>
                  </div>
                </GlassCard>
              </div>
            </div>
          )}

          {activeTab === "tasks" && (
            <GlassCard clarity={clarity} className="p-6">
              <TaskBoardWithBulk project={project} users={users} />
            </GlassCard>
          )}

          {activeTab === "activity" && (
            <GlassCard clarity={clarity} className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">
                  Project Updates
                </h3>
                <button
                  onClick={() => setAddingUpdate(true)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition ${
                    clarity
                      ? "border-purple-400/40 bg-purple-500/20 hover:bg-purple-500/30"
                      : "border-purple-400/20 bg-purple-500/10 hover:bg-purple-500/20"
                  } text-white`}
                >
                  <Plus className="h-4 w-4" />
                  Add Update
                </button>
              </div>

              {addingUpdate && (
                <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
                  <textarea
                    value={updateText}
                    onChange={(e) => setUpdateText(e.target.value)}
                    placeholder="Write an update..."
                    className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    rows={3}
                  />
                  <div className="flex items-center gap-2 mt-3">
                    <select
                      value={selectedAuthorId}
                      onChange={(e) => setSelectedAuthorId(e.target.value)}
                      className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none"
                    >
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleAddUpdate}
                      className="px-4 py-2 rounded-lg bg-purple-500/20 border border-purple-400/40 text-white hover:bg-purple-500/30"
                    >
                      Post Update
                    </button>
                    <button
                      onClick={() => {
                        setAddingUpdate(false);
                        setUpdateText("");
                      }}
                      className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white hover:bg-white/15"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {project.updates.length === 0 ? (
                  <div className="text-center py-8 text-white/50">
                    No updates yet. Add the first update to keep everyone
                    informed.
                  </div>
                ) : (
                  project.updates.map((update) => (
                    <div
                      key={update.id}
                      className={`p-4 rounded-xl border ${
                        clarity
                          ? "border-white/15 bg-white/10"
                          : "border-white/10 bg-white/5"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                            <UserIcon className="h-4 w-4 text-purple-400" />
                          </div>
                          <div>
                            <div className="font-medium text-white">
                              {update.author.name}
                            </div>
                            <div className="text-xs text-white/50">
                              {format(
                                new Date(update.createdAt),
                                "MMM d, yyyy h:mm a"
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <p className="text-white/80 text-sm leading-relaxed">
                        {update.body}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </GlassCard>
          )}

          {activeTab === "deliverables" && (
            <GlassCard clarity={clarity} className="p-6">
              <DeliverablesList
                projectId={project.id}
                deliverables={project.deliverables}
              />
            </GlassCard>
          )}
        </motion.div>
      </div>
    </div>
  );
}
