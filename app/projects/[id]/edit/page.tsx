"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, X } from "lucide-react";
import { BRANCHES, PROJECT_STATUS } from "@/lib/utils";
import { GlassCard } from "@/components/glass";

interface User {
  id: string;
  name: string;
  email: string;
}

interface Portfolio {
  id: string;
  key: string;
  name: string;
  color: string | null;
}

interface Project {
  id: string;
  title: string;
  branch: string;
  portfolioId: string | null;
  portfolio: Portfolio | null;
  stage: string;
  health: string | null;
  pmId: string;
  developers: User[];
  clientName: string;
  clientEmail: string;
  status: string;
  startDate: string | null;
  targetDelivery: string | null;
  notes: string | null;
}

export default function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [projectId, setProjectId] = useState<string | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    branch: "",
    portfolioId: "",
    stage: "Discovery",
    health: "Green",
    pmId: "",
    developerIds: [] as string[],
    clientName: "",
    clientEmail: "",
    status: "",
    startDate: "",
    targetDelivery: "",
    notes: "",
  });

  useEffect(() => {
    params.then((p) => setProjectId(p.id));
  }, [params]);

  useEffect(() => {
    if (projectId) {
      fetchProjectAndUsers();
    }
  }, [projectId]);

  const fetchProjectAndUsers = async () => {
    if (!projectId) return;
    try {
      const [projectRes, usersRes, portfoliosRes] = await Promise.all([
        fetch(`/api/projects/${projectId}`),
        fetch("/api/users"),
        fetch("/api/portfolios"),
      ]);

      if (!projectRes.ok) throw new Error("Failed to fetch project");
      if (!usersRes.ok) throw new Error("Failed to fetch users");
      if (!portfoliosRes.ok) throw new Error("Failed to fetch portfolios");

      const projectData = await projectRes.json();
      const usersData = await usersRes.json();
      const portfoliosData = await portfoliosRes.json();

      setProject(projectData);
      setUsers(usersData);
      setPortfolios(portfoliosData);

      // Populate form with existing data
      setFormData({
        title: projectData.title,
        branch: projectData.branch,
        portfolioId: projectData.portfolioId || "",
        stage: projectData.stage || "Discovery",
        health: projectData.health || "Green",
        pmId: projectData.pmId,
        developerIds: projectData.developers.map((d: User) => d.id),
        clientName: projectData.clientName || "",
        clientEmail: projectData.clientEmail || "",
        status: projectData.status,
        startDate: projectData.startDate
          ? new Date(projectData.startDate).toISOString().split("T")[0]
          : "",
        targetDelivery: projectData.targetDelivery
          ? new Date(projectData.targetDelivery).toISOString().split("T")[0]
          : "",
        notes: projectData.notes || "",
      });
    } catch (err) {
      setError("Failed to load project data");
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          startDate: formData.startDate
            ? new Date(formData.startDate).toISOString()
            : null,
          targetDelivery: formData.targetDelivery
            ? new Date(formData.targetDelivery).toISOString()
            : null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update project");
      }

      router.push(`/projects/${projectId}`);
    } catch (err) {
      setError("Failed to update project. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleDeveloper = (userId: string) => {
    setFormData((prev) => ({
      ...prev,
      developerIds: prev.developerIds.includes(userId)
        ? prev.developerIds.filter((id) => id !== userId)
        : [...prev.developerIds, userId],
    }));
  };

  if (!project || users.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <p className="text-white/50">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href={projectId ? `/projects/${projectId}` : "/"}
              className="inline-flex items-center text-sm text-white/50 hover:text-white/70 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Cancel
            </Link>
            <h1 className="text-xl font-semibold text-white/90">
              Edit Project
            </h1>
          </div>
        </div>
      </div>

      {error && (
        <GlassCard className="mb-4 p-4 border-red-500/20 bg-red-500/5">
          <p className="text-sm text-red-400">{error}</p>
        </GlassCard>
      )}

      <GlassCard className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-white/70 mb-2"
            >
              Project Title
            </label>
            <input
              type="text"
              id="title"
              required
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full px-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-white/90 placeholder-white/30 focus:bg-white/[0.05] focus:border-white/20 focus:outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="portfolio"
                className="block text-sm font-medium text-white/70 mb-2"
              >
                Portfolio
              </label>
              <select
                id="portfolio"
                value={formData.portfolioId}
                onChange={(e) =>
                  setFormData({ ...formData, portfolioId: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-white/90 focus:bg-white/[0.05] focus:border-white/20 focus:outline-none transition-all"
              >
                <option value="">Select portfolio</option>
                {portfolios.map((portfolio) => (
                  <option key={portfolio.id} value={portfolio.id}>
                    {portfolio.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="stage"
                className="block text-sm font-medium text-white/70 mb-2"
              >
                Stage
              </label>
              <select
                id="stage"
                value={formData.stage}
                onChange={(e) =>
                  setFormData({ ...formData, stage: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-white/90 focus:bg-white/[0.05] focus:border-white/20 focus:outline-none transition-all"
              >
                <option value="Discovery">Discovery</option>
                <option value="Build">Build</option>
                <option value="Launch">Launch</option>
                <option value="Live">Live</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div>
              <label
                htmlFor="status"
                className="block text-sm font-medium text-white/70 mb-2"
              >
                Status
              </label>
              <select
                id="status"
                required
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-white/90 focus:bg-white/[0.05] focus:border-white/20 focus:outline-none transition-all"
              >
                {Object.entries(PROJECT_STATUS).map(([key, value]) => (
                  <option key={key} value={value}>
                    {value
                      .split("_")
                      .map(
                        (word) =>
                          word.charAt(0).toUpperCase() +
                          word.slice(1).toLowerCase()
                      )
                      .join(" ")}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="health"
                className="block text-sm font-medium text-white/70 mb-2"
              >
                Health
              </label>
              <select
                id="health"
                value={formData.health}
                onChange={(e) =>
                  setFormData({ ...formData, health: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-white/90 focus:bg-white/[0.05] focus:border-white/20 focus:outline-none transition-all"
              >
                <option value="Green">Green</option>
                <option value="Amber">Amber</option>
                <option value="Red">Red</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="branch"
                className="block text-sm font-medium text-white/70 mb-2"
              >
                Branch (Legacy)
              </label>
              <select
                id="branch"
                value={formData.branch}
                onChange={(e) =>
                  setFormData({ ...formData, branch: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-white/90 focus:bg-white/[0.05] focus:border-white/20 focus:outline-none transition-all"
              >
                <option value="">Select branch</option>
                {Object.entries(BRANCHES).map(([key, value]) => (
                  <option key={key} value={value}>
                    {value.charAt(0) + value.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="pm"
              className="block text-sm font-medium text-white/70 mb-2"
            >
              Project Manager
            </label>
            <select
              id="pm"
              required
              value={formData.pmId}
              onChange={(e) =>
                setFormData({ ...formData, pmId: e.target.value })
              }
              className="w-full px-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-white/90 focus:bg-white/[0.05] focus:border-white/20 focus:outline-none transition-all"
            >
              <option value="">Select PM</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
            {formData.pmId && (
              <p className="mt-1 text-xs text-white/40">
                Current: {users.find((u) => u.id === formData.pmId)?.name}
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-white/70">
                Developers
                <span className="ml-2 text-xs text-white/40">
                  ({formData.developerIds.length} selected)
                </span>
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      developerIds: users.map((u) => u.id),
                    })
                  }
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Select all
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, developerIds: [] })}
                  className="text-xs text-white/40 hover:text-white/60 transition-colors"
                >
                  Clear all
                </button>
              </div>
            </div>
            <div className="border border-white/10 rounded-xl bg-white/[0.02] p-3 max-h-48 overflow-y-auto">
              <div className="space-y-2">
                {users.map((user) => (
                  <label
                    key={user.id}
                    className="flex items-center hover:bg-white/[0.03] p-1 rounded-lg cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={formData.developerIds.includes(user.id)}
                      onChange={() => toggleDeveloper(user.id)}
                      className="h-4 w-4 rounded border-white/20 bg-white/5 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0"
                    />
                    <span className="ml-2 text-sm text-white/70">
                      {user.name}
                      <span className="text-white/40 ml-1">({user.email})</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
            {formData.developerIds.length > 0 && (
              <p className="mt-1 text-xs text-white/40">
                Selected:{" "}
                {users
                  .filter((u) => formData.developerIds.includes(u.id))
                  .map((u) => u.name)
                  .join(", ")}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="clientName"
                className="block text-sm font-medium text-white/70 mb-2"
              >
                Client Name
              </label>
              <input
                type="text"
                id="clientName"
                value={formData.clientName}
                onChange={(e) =>
                  setFormData({ ...formData, clientName: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-white/90 placeholder-white/30 focus:bg-white/[0.05] focus:border-white/20 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label
                htmlFor="clientEmail"
                className="block text-sm font-medium text-white/70 mb-2"
              >
                Client Email
              </label>
              <input
                type="email"
                id="clientEmail"
                value={formData.clientEmail}
                onChange={(e) =>
                  setFormData({ ...formData, clientEmail: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-white/90 placeholder-white/30 focus:bg-white/[0.05] focus:border-white/20 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="startDate"
                className="block text-sm font-medium text-white/70 mb-2"
              >
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-white/90 focus:bg-white/[0.05] focus:border-white/20 focus:outline-none transition-all [color-scheme:dark]"
              />
            </div>

            <div>
              <label
                htmlFor="targetDelivery"
                className="block text-sm font-medium text-white/70 mb-2"
              >
                Target Delivery
              </label>
              <input
                type="date"
                id="targetDelivery"
                value={formData.targetDelivery}
                onChange={(e) =>
                  setFormData({ ...formData, targetDelivery: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-white/90 focus:bg-white/[0.05] focus:border-white/20 focus:outline-none transition-all [color-scheme:dark]"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="notes"
              className="block text-sm font-medium text-white/70 mb-2"
            >
              Notes
            </label>
            <textarea
              id="notes"
              rows={4}
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              className="w-full px-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-white/90 placeholder-white/30 focus:bg-white/[0.05] focus:border-white/20 focus:outline-none transition-all resize-none"
              placeholder="Add project notes..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-white/5">
            <Link
              href={projectId ? `/projects/${projectId}` : "/"}
              className="px-4 py-2 rounded-xl border border-white/10 text-white/70 bg-white/[0.02] hover:bg-white/[0.05] hover:text-white/90 transition-all"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 rounded-xl text-white/90 bg-indigo-600/80 hover:bg-indigo-600 backdrop-blur-xl border border-indigo-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
