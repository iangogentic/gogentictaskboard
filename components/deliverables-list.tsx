"use client";

import { useState } from "react";
import {
  Plus,
  FileText,
  Download,
  Trash2,
  Edit2,
  Check,
  X,
  ExternalLink,
} from "lucide-react";
import { format } from "date-fns";
import type { Deliverable } from "@prisma/client";

interface DeliverablesListProps {
  projectId: string;
  deliverables: Deliverable[];
}

export default function DeliverablesList({
  projectId,
  deliverables: initialDeliverables,
}: DeliverablesListProps) {
  const [deliverables, setDeliverables] = useState(initialDeliverables);
  const [addingDeliverable, setAddingDeliverable] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state for new deliverable
  const [newDeliverable, setNewDeliverable] = useState({
    title: "",
    url: "",
    status: "Draft",
  });

  // Form state for editing
  const [editForm, setEditForm] = useState({
    title: "",
    url: "",
    status: "Draft",
  });

  const statusOptions = [
    { value: "Draft", label: "Draft" },
    { value: "Submitted", label: "Submitted" },
    { value: "Approved", label: "Approved" },
    { value: "Delivered", label: "Delivered" },
  ];

  const handleAddDeliverable = async () => {
    if (!newDeliverable.title.trim()) return;

    try {
      const response = await fetch("/api/deliverables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          ...newDeliverable,
        }),
      });

      if (response.ok) {
        const addedDeliverable = await response.json();
        setDeliverables([...deliverables, addedDeliverable]);
        setNewDeliverable({
          title: "",
          url: "",
          status: "Draft",
        });
        setAddingDeliverable(false);
      }
    } catch (error) {
      console.error("Failed to add deliverable:", error);
    }
  };

  const handleEditDeliverable = async (id: string) => {
    if (!editForm.title.trim()) return;

    try {
      const response = await fetch(`/api/deliverables/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      if (response.ok) {
        const updatedDeliverable = await response.json();
        setDeliverables(
          deliverables.map((d) => (d.id === id ? updatedDeliverable : d))
        );
        setEditingId(null);
      }
    } catch (error) {
      console.error("Failed to update deliverable:", error);
    }
  };

  const handleDeleteDeliverable = async (id: string) => {
    if (!confirm("Are you sure you want to delete this deliverable?")) return;

    try {
      const response = await fetch(`/api/deliverables/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setDeliverables(deliverables.filter((d) => d.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete deliverable:", error);
    }
  };

  const startEdit = (deliverable: Deliverable) => {
    setEditingId(deliverable.id);
    setEditForm({
      title: deliverable.title,
      url: deliverable.fileUrl || "",
      status: deliverable.status,
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      Draft: "bg-surface text-fg",
      Submitted: "bg-info-bg text-info",
      Approved: "bg-success-bg text-success",
      Delivered: "bg-indigo-100 text-indigo-800",
    };
    return colors[status] || "bg-surface text-fg";
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Deliverables</h3>
        <button
          onClick={() => setAddingDeliverable(true)}
          className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Deliverable
        </button>
      </div>

      {addingDeliverable && (
        <div className="bg-surface rounded-lg p-4 space-y-3 border border-border">
          <input
            type="text"
            placeholder="Deliverable title"
            value={newDeliverable.title}
            onChange={(e) =>
              setNewDeliverable({ ...newDeliverable, title: e.target.value })
            }
            className="w-full px-3 py-2 bg-bg text-fg border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand placeholder-muted"
            autoFocus
          />
          <input
            type="url"
            placeholder="URL or link (optional)"
            value={newDeliverable.url}
            onChange={(e) =>
              setNewDeliverable({ ...newDeliverable, url: e.target.value })
            }
            className="w-full px-3 py-2 bg-bg text-fg border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand placeholder-muted"
          />
          <select
            value={newDeliverable.status}
            onChange={(e) =>
              setNewDeliverable({ ...newDeliverable, status: e.target.value })
            }
            className="w-full px-3 py-2 bg-bg text-fg border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand"
          >
            {statusOptions.map((option) => (
              <option
                key={option.value}
                value={option.value}
                className="bg-bg text-fg"
              >
                {option.label}
              </option>
            ))}
          </select>
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => {
                setAddingDeliverable(false);
                setNewDeliverable({
                  title: "",
                  url: "",
                  status: "Draft",
                });
              }}
              className="px-3 py-1.5 text-sm text-muted hover:text-fg"
            >
              Cancel
            </button>
            <button
              onClick={handleAddDeliverable}
              className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Add
            </button>
          </div>
        </div>
      )}

      {deliverables.length === 0 && !addingDeliverable && (
        <div className="text-center py-8 text-muted">
          <FileText className="h-12 w-12 mx-auto mb-3 text-border" />
          <p>No deliverables yet</p>
          <p className="text-sm mt-1">
            Add deliverables to track project outputs
          </p>
        </div>
      )}

      <div className="space-y-3">
        {deliverables.map((deliverable) => (
          <div key={deliverable.id}>
            {editingId === deliverable.id ? (
              <div className="bg-surface rounded-lg p-4 space-y-3 border border-border">
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) =>
                    setEditForm({ ...editForm, title: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-bg text-fg border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand placeholder-muted"
                  autoFocus
                />
                <input
                  type="url"
                  value={editForm.url}
                  onChange={(e) =>
                    setEditForm({ ...editForm, url: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-bg text-fg border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand placeholder-muted"
                />
                <select
                  value={editForm.status}
                  onChange={(e) =>
                    setEditForm({ ...editForm, status: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-bg text-fg border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand"
                >
                  {statusOptions.map((option) => (
                    <option
                      key={option.value}
                      value={option.value}
                      className="bg-bg text-fg"
                    >
                      {option.label}
                    </option>
                  ))}
                </select>
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => setEditingId(null)}
                    className="p-1.5 text-muted hover:text-fg"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleEditDeliverable(deliverable.id)}
                    className="p-1.5 text-success hover:text-green-700"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-surface rounded-lg border border-border p-4 hover:shadow-sm transition-shadow group">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h4 className="font-medium text-fg">
                        {deliverable.title}
                      </h4>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(deliverable.status)}`}
                      >
                        {deliverable.status}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-muted">
                      <span>
                        Updated{" "}
                        {format(new Date(deliverable.updatedAt), "MMM d, yyyy")}
                      </span>
                      {deliverable.fileUrl && (
                        <a
                          href={deliverable.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-brand hover:text-indigo-800"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          View
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => startEdit(deliverable)}
                      className="p-1.5 text-muted hover:text-brand"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteDeliverable(deliverable.id)}
                      className="p-1.5 text-muted hover:text-danger"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
