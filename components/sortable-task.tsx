"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Calendar, User, Edit2, Trash2, X, Check } from "lucide-react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useTheme } from "@/lib/themes/provider";
import type { Task, User as UserType } from "@prisma/client";

type TaskWithAssignee = Task & { assignee: UserType | null };

interface SortableTaskProps {
  task: TaskWithAssignee;
  users?: UserType[];
}

export default function SortableTask({ task, users }: SortableTaskProps) {
  const router = useRouter();
  const { backgroundMode } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.title);
  const [editedNotes, setEditedNotes] = useState(task.notes || "");
  const [editedAssigneeId, setEditedAssigneeId] = useState(
    task.assigneeId || ""
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: "task",
      task,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleEdit = async () => {
    if (!editedTitle.trim()) return;

    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editedTitle,
          notes: editedNotes || null,
          assigneeId: editedAssigneeId || null,
        }),
      });

      if (response.ok) {
        setIsEditing(false);
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to update task:", error);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to delete task:", error);
      setIsDeleting(false);
    }
  };

  const baseCardStyles =
    backgroundMode === "light"
      ? "bg-black/60 backdrop-blur-xl border-black/20"
      : "bg-white/10 backdrop-blur-xl border-white/20";

  const hoverCardStyles =
    backgroundMode === "light"
      ? "hover:bg-black/70 hover:border-black/30"
      : "hover:bg-white/15 hover:border-white/30";

  const inputStyles =
    backgroundMode === "light"
      ? "bg-black/20 border-black/30 text-white placeholder:text-white/50 focus:ring-purple-500/50 focus:border-purple-500/50"
      : "bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:ring-purple-500/50 focus:border-purple-500/50";

  const selectStyles =
    backgroundMode === "light"
      ? "bg-black/20 border-black/30 text-white focus:ring-purple-500/50 focus:border-purple-500/50 [&>option]:bg-gray-800"
      : "bg-white/5 border-white/10 text-white focus:ring-purple-500/50 focus:border-purple-500/50 [&>option]:bg-gray-800";

  if (isEditing) {
    return (
      <div className={`${baseCardStyles} rounded-xl p-3`}>
        <div className="space-y-2">
          <input
            type="text"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            className={`w-full px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 ${inputStyles}`}
            autoFocus
          />
          <textarea
            value={editedNotes}
            onChange={(e) => setEditedNotes(e.target.value)}
            placeholder="Notes (optional)"
            className={`w-full px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 ${inputStyles}`}
            rows={2}
          />
          {users && (
            <select
              value={editedAssigneeId}
              onChange={(e) => setEditedAssigneeId(e.target.value)}
              className={`w-full px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 ${selectStyles}`}
            >
              <option value="">Unassigned</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          )}
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => {
                setIsEditing(false);
                setEditedTitle(task.title);
                setEditedNotes(task.notes || "");
                setEditedAssigneeId(task.assigneeId || "");
              }}
              className="p-1 text-white/50 hover:text-white/70 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
            <button
              onClick={handleEdit}
              className="p-1 text-green-400 hover:text-green-300 transition-colors"
            >
              <Check className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${baseCardStyles} ${hoverCardStyles} rounded-xl p-3 transition-all group ${isDeleting ? "opacity-50" : ""}`}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1" {...attributes} {...listeners}>
          <p className="text-sm font-medium text-white/90 cursor-grab">
            {task.title}
          </p>
        </div>
        <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setIsEditing(true)}
            className="p-1 text-white/50 hover:text-purple-400 transition-colors"
          >
            <Edit2 className="h-3 w-3" />
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-1 text-white/50 hover:text-red-400 transition-colors"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>

      {task.notes && (
        <p className="text-xs text-white/50 mt-1 line-clamp-2">{task.notes}</p>
      )}

      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center space-x-2">
          {task.assignee && (
            <div className="flex items-center">
              <div className="h-6 w-6 rounded-full bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-xs font-medium text-purple-300">
                {task.assignee.name?.slice(0, 2).toUpperCase() || "NA"}
              </div>
            </div>
          )}

          {task.dueDate && (
            <div className="flex items-center text-xs text-white/50">
              <Calendar className="h-3 w-3 mr-1" />
              {format(new Date(task.dueDate), "MMM d")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
