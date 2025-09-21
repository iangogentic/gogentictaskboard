"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Calendar,
  User,
  X,
  CheckSquare,
  Square,
  Trash2,
  Users,
  Clock,
} from "lucide-react";
import { format } from "date-fns";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  DragOverEvent,
  PointerSensor,
  useSensor,
  useSensors,
  rectIntersection,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import SortableTask from "./sortable-task";
import DroppableColumn from "./droppable-column";
import type { Project, Task, User as UserType } from "@prisma/client";

type TaskWithAssignee = Task & { assignee: UserType | null };
type ProjectWithTasks = Project & { tasks: TaskWithAssignee[] };

interface TaskBoardWithBulkProps {
  project: ProjectWithTasks;
  users: UserType[];
}

const COLUMNS = [
  { id: "Todo", title: "To Do" },
  { id: "Doing", title: "In Progress" },
  { id: "Review", title: "Review" },
  { id: "Done", title: "Done" },
];

export default function TaskBoardWithBulk({
  project,
  users,
}: TaskBoardWithBulkProps) {
  const router = useRouter();
  const [tasks, setTasks] = useState(project.tasks);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [addingTask, setAddingTask] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [bulkActionOpen, setBulkActionOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Custom collision detection that prioritizes columns over tasks
  const collisionDetection = useCallback((args: any) => {
    // First, try to find collisions with columns
    const collisions = rectIntersection(args);

    // Separate column and task collisions
    const columnCollisions = collisions.filter((collision: any) =>
      COLUMNS.some((col) => col.id === collision.id)
    );

    // If we have column collisions, return only those
    if (columnCollisions.length > 0) {
      return columnCollisions;
    }

    // Otherwise return all collisions
    return collisions;
  }, []);

  const handleSelectTask = (taskId: string) => {
    setSelectedTasks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (status: string) => {
    const columnTasks = tasks.filter((t) => t.status === status);
    const allSelected = columnTasks.every((t) => selectedTasks.has(t.id));

    setSelectedTasks((prev) => {
      const newSet = new Set(prev);
      columnTasks.forEach((task) => {
        if (allSelected) {
          newSet.delete(task.id);
        } else {
          newSet.add(task.id);
        }
      });
      return newSet;
    });
  };

  const handleBulkStatusChange = async (newStatus: string) => {
    if (selectedTasks.size === 0) return;

    const taskIds = Array.from(selectedTasks);

    // Optimistically update UI
    setTasks((prev) =>
      prev.map((t) =>
        selectedTasks.has(t.id) ? { ...t, status: newStatus } : t
      )
    );

    try {
      const response = await fetch("/api/tasks/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskIds,
          updates: { status: newStatus },
        }),
      });

      if (!response.ok) throw new Error("Failed to update tasks");

      setSelectedTasks(new Set());
      setBulkActionOpen(false);
      router.refresh();
    } catch (error) {
      console.error("Error updating tasks:", error);
      router.refresh();
    }
  };

  const handleBulkAssign = async (assigneeId: string | null) => {
    if (selectedTasks.size === 0) return;

    const taskIds = Array.from(selectedTasks);

    try {
      const response = await fetch("/api/tasks/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskIds,
          updates: { assigneeId },
        }),
      });

      if (!response.ok) throw new Error("Failed to assign tasks");

      setSelectedTasks(new Set());
      setBulkActionOpen(false);
      router.refresh();
    } catch (error) {
      console.error("Error assigning tasks:", error);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTasks.size === 0) return;
    if (!confirm(`Delete ${selectedTasks.size} selected tasks?`)) return;

    const taskIds = Array.from(selectedTasks);

    try {
      const response = await fetch("/api/tasks/bulk", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskIds }),
      });

      if (!response.ok) throw new Error("Failed to delete tasks");

      setTasks((prev) => prev.filter((t) => !selectedTasks.has(t.id)));
      setSelectedTasks(new Set());
      setBulkActionOpen(false);
      router.refresh();
    } catch (error) {
      console.error("Error deleting tasks:", error);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    // Check if we're over a column (not another task)
    if (over.data.current?.type !== "column") return;

    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === overId) return;

    // Update task status immediately on drag over
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: overId } : t))
    );
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const taskId = active.id as string;
    let newStatus: string;

    // Determine the new status based on what we're dropping over
    if (over.data.current?.type === "column") {
      newStatus = over.id as string;
    } else if (over.data.current?.type === "task") {
      // If dropped on a task, use that task's status
      const overTask = tasks.find((t) => t.id === over.id);
      if (!overTask) return;
      newStatus = overTask.status;
    } else {
      return;
    }

    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === newStatus) return;

    // Optimistically update UI
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );

    // Update in database
    const response = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });

    if (!response.ok) {
      // Revert on error
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: task.status } : t))
      );
    } else {
      router.refresh();
    }
  };

  const handleCreateTask = async (status: string) => {
    if (!newTaskTitle.trim()) return;

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTaskTitle,
          status,
          projectId: project.id,
          order: tasks.filter((t) => t.status === status).length,
        }),
      });

      if (!response.ok) throw new Error("Failed to create task");

      const newTask = await response.json();
      setTasks((prev) => [...prev, newTask]);
      setNewTaskTitle("");
      setAddingTask(null);
      router.refresh();
    } catch (error) {
      console.error("Error creating task:", error);
    }
  };

  const activeTask = tasks.find((t) => t.id === activeId);

  return (
    <>
      {selectedTasks.size > 0 && (
        <div className="mb-4 p-4 bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-white/90">
              {selectedTasks.size} task{selectedTasks.size > 1 ? "s" : ""}{" "}
              selected
            </span>
            <button
              onClick={() => setSelectedTasks(new Set())}
              className="text-sm text-purple-300 hover:text-purple-200 transition-colors"
            >
              Clear selection
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <div className="relative">
              <button
                onClick={() => setBulkActionOpen(!bulkActionOpen)}
                className="px-3 py-1.5 bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg text-sm font-medium text-white/90 hover:bg-white/15 transition-all"
              >
                Bulk Actions
              </button>

              {bulkActionOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white/10 backdrop-blur-xl rounded-xl shadow-lg z-10 border border-white/20">
                  <div className="py-1">
                    <div className="px-3 py-2 text-xs font-semibold text-white/50 uppercase">
                      Move to
                    </div>
                    {COLUMNS.map((col) => (
                      <button
                        key={col.id}
                        onClick={() => handleBulkStatusChange(col.id)}
                        className="block w-full text-left px-4 py-2 text-sm text-white/70 hover:bg-white/10 transition-colors"
                      >
                        {col.title}
                      </button>
                    ))}
                    <div className="border-t border-white/10 my-1"></div>
                    <div className="px-3 py-2 text-xs font-semibold text-white/50 uppercase">
                      Assign to
                    </div>
                    <button
                      onClick={() => handleBulkAssign(null)}
                      className="block w-full text-left px-4 py-2 text-sm text-white/70 hover:bg-white/10 transition-colors"
                    >
                      Unassigned
                    </button>
                    {users.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => handleBulkAssign(user.id)}
                        className="block w-full text-left px-4 py-2 text-sm text-white/70 hover:bg-white/10 transition-colors"
                      >
                        {user.name}
                      </button>
                    ))}
                    <div className="border-t border-white/10 my-1"></div>
                    <button
                      onClick={handleBulkDelete}
                      className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="inline h-4 w-4 mr-2" />
                      Delete selected
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-4 gap-4">
          {COLUMNS.map((column) => {
            const columnTasks = tasks.filter((t) => t.status === column.id);
            const columnSelected = columnTasks.filter((t) =>
              selectedTasks.has(t.id)
            ).length;
            const allSelected =
              columnTasks.length > 0 && columnSelected === columnTasks.length;

            return (
              <DroppableColumn key={column.id} id={column.id}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleSelectAll(column.id)}
                      className="text-white/50 hover:text-white/70 transition-colors"
                      title={allSelected ? "Deselect all" : "Select all"}
                    >
                      {allSelected ? (
                        <CheckSquare className="h-4 w-4" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                    <h3 className="font-medium text-white/90">
                      {column.title}
                    </h3>
                    <span className="text-sm text-white/50">
                      ({columnTasks.length})
                    </span>
                  </div>
                  <button
                    onClick={() => setAddingTask(column.id)}
                    className="text-white/50 hover:text-white/70 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <SortableContext
                  items={columnTasks.map((t) => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2 min-h-[100px]">
                    {columnTasks.map((task) => (
                      <div key={task.id} className="flex items-start space-x-2">
                        <input
                          type="checkbox"
                          checked={selectedTasks.has(task.id)}
                          onChange={() => handleSelectTask(task.id)}
                          className="mt-3.5 flex-shrink-0 h-4 w-4 text-purple-400 rounded border-white/20 bg-white/10 focus:ring-purple-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="flex-1">
                          <SortableTask task={task} users={users} />
                        </div>
                      </div>
                    ))}
                  </div>
                </SortableContext>

                {addingTask === column.id && (
                  <div className="mt-2 p-3 bg-white/10 backdrop-blur-xl rounded-xl border border-white/20">
                    <input
                      type="text"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleCreateTask(column.id);
                        if (e.key === "Escape") {
                          setAddingTask(null);
                          setNewTaskTitle("");
                        }
                      }}
                      placeholder="Enter task title..."
                      className="w-full px-3 py-2 text-sm bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50"
                      autoFocus
                    />
                    <div className="flex justify-end space-x-2 mt-2">
                      <button
                        onClick={() => {
                          setAddingTask(null);
                          setNewTaskTitle("");
                        }}
                        className="px-3 py-1.5 text-xs text-white/50 hover:text-white/70 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleCreateTask(column.id)}
                        className="px-3 py-1.5 text-xs bg-purple-500/20 border border-purple-400/40 text-white rounded-lg hover:bg-purple-500/30 transition-all"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                )}
              </DroppableColumn>
            );
          })}
        </div>

        <DragOverlay>
          {activeTask && (
            <div className="bg-white/20 backdrop-blur-xl p-3 rounded-xl shadow-lg border-2 border-purple-500/50">
              <p className="text-sm font-medium text-white">
                {activeTask.title}
              </p>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </>
  );
}
