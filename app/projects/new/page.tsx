"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, X, FileText, Sparkles } from "lucide-react";
import { BRANCHES, PROJECT_STATUS } from "@/lib/utils";
import { ProjectTemplate } from "@/lib/project-templates";
import { sendNotification } from "@/components/notifications";

interface User {
  id: string;
  name: string;
  email: string;
}

export default function NewProjectPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [template, setTemplate] = useState<ProjectTemplate | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    branch: "",
    pmId: "",
    developerIds: [] as string[],
    clientName: "",
    clientEmail: "",
    status:
      PROJECT_STATUS.NOT_STARTED as (typeof PROJECT_STATUS)[keyof typeof PROJECT_STATUS],
    startDate: "",
    targetDelivery: "",
    notes: "",
  });

  useEffect(() => {
    fetchUsers();

    // Check if a template was selected
    const savedTemplate = sessionStorage.getItem("selectedTemplate");
    if (savedTemplate) {
      const parsed = JSON.parse(savedTemplate) as ProjectTemplate;
      setTemplate(parsed);

      // Pre-fill form with template data
      setFormData((prev) => ({
        ...prev,
        branch: parsed.branch,
        notes: parsed.notes || "",
        targetDelivery: parsed.estimatedDuration
          ? new Date(
              Date.now() + parsed.estimatedDuration * 24 * 60 * 60 * 1000
            )
              .toISOString()
              .split("T")[0]
          : "",
      }));

      // Clear the template from session
      sessionStorage.removeItem("selectedTemplate");
    }
  }, []);

  useEffect(() => {
    // Set defaults based on branch selection
    if (formData.branch === BRANCHES.CORTEX) {
      const aakansha = users.find((u) => u.name === "Aakansha");
      if (aakansha && !formData.pmId) {
        setFormData((prev) => ({ ...prev, pmId: aakansha.id }));
      }
    } else if (formData.branch === BRANCHES.SOLUTIONS) {
      const matthew = users.find((u) => u.name === "Matthew");
      if (matthew && !formData.pmId) {
        setFormData((prev) => ({ ...prev, pmId: matthew.id }));
      }
    } else if (formData.branch === BRANCHES.FISHER) {
      const ian = users.find((u) => u.name === "Ian");
      const mia = users.find((u) => u.name === "Mia");
      const luke = users.find((u) => u.name === "Luke");

      if (ian && !formData.pmId) {
        setFormData((prev) => ({ ...prev, pmId: ian.id }));
      }

      if (mia && luke && formData.developerIds.length === 0) {
        setFormData((prev) => ({ ...prev, developerIds: [mia.id, luke.id] }));
      }
    }
  }, [formData.branch, users]);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users");
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          startDate: formData.startDate ? new Date(formData.startDate) : null,
          targetDelivery: formData.targetDelivery
            ? new Date(formData.targetDelivery)
            : null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create project");
      }

      const project = await response.json();
      router.push(`/projects/${project.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project");
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

  return (
    <div className="min-h-screen bg-surface">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="flex items-center text-muted hover:text-fg"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Link>
              <div className="border-l pl-4">
                <h1 className="text-xl font-semibold">New Project</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg shadow-sm border p-6 space-y-6"
        >
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-fg-muted mb-2">
                Project Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter project title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-fg-muted mb-2">
                Branch *
              </label>
              <select
                required
                value={formData.branch}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, branch: e.target.value }))
                }
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select branch</option>
                {Object.values(BRANCHES).map((branch) => (
                  <option key={branch} value={branch}>
                    {branch}
                  </option>
                ))}
              </select>
              {formData.branch && (
                <p className="mt-1 text-xs text-muted">
                  {formData.branch === BRANCHES.CORTEX &&
                    "Default PM: Aakansha"}
                  {formData.branch === BRANCHES.SOLUTIONS &&
                    "Default PM: Matthew"}
                  {formData.branch === BRANCHES.FISHER &&
                    "Default PM: Ian, Devs: Mia & Luke"}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-fg-muted mb-2">
                Project Manager *
              </label>
              <select
                required
                value={formData.pmId}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, pmId: e.target.value }))
                }
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select PM</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-fg-muted mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    status: e.target
                      .value as (typeof PROJECT_STATUS)[keyof typeof PROJECT_STATUS],
                  }))
                }
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {Object.values(PROJECT_STATUS).map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-fg-muted mb-2">
                Client Name *
              </label>
              <input
                type="text"
                required
                value={formData.clientName}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    clientName: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Client or company name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-fg-muted mb-2">
                Client Email *
              </label>
              <input
                type="email"
                required
                value={formData.clientEmail}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    clientEmail: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="client@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-fg-muted mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    startDate: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-fg-muted mb-2">
                Target Delivery
              </label>
              <input
                type="date"
                value={formData.targetDelivery}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    targetDelivery: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-fg-muted mb-2">
              Developers
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {users.map((user) => (
                <label key={user.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.developerIds.includes(user.id)}
                    onChange={() => toggleDeveloper(user.id)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm">{user.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-fg-muted mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, notes: e.target.value }))
              }
              rows={4}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Additional project notes..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Link
              href="/"
              className="px-4 py-2 border border-border text-fg-muted rounded-md hover:bg-surface"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating..." : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
