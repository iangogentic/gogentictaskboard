import React from "react";
import { motion } from "framer-motion";
import {
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock,
  Plus,
  ChevronRight,
  Zap,
  Bell,
  Link as LinkIcon,
} from "lucide-react";
import { GlassCard, Badge, ProgressRing, ThemeMenu } from "@/components/glass";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import ClientWrapper from "./client-wrapper";

async function getPageData(userId: string) {
  // Get today's tasks
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const tasks = await prisma.task.findMany({
    where: {
      OR: [
        { assigneeId: userId },
        { project: { ProjectMember: { some: { userId } } } },
      ],
      dueDate: {
        gte: today,
        lt: tomorrow,
      },
    },
    include: {
      project: true,
      assignee: true,
    },
    orderBy: { dueDate: "asc" },
  });

  // Get recent updates
  const updates = await prisma.update.findMany({
    where: {
      project: {
        ProjectMember: {
          some: { userId },
        },
      },
    },
    include: {
      project: true,
      author: true,
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  // Get upcoming meetings (placeholder - would integrate with calendar)
  // For now, we'll use scheduled tasks or project milestones
  const meetings = await prisma.task.findMany({
    where: {
      OR: [
        { assigneeId: userId },
        { project: { ProjectMember: { some: { userId } } } },
      ],
      title: { contains: "meeting", mode: "insensitive" },
      dueDate: { gte: today },
    },
    include: {
      project: true,
    },
    orderBy: { dueDate: "asc" },
    take: 3,
  });

  // Get user's projects for quick stats and display
  const projects = await prisma.project.findMany({
    where: {
      ProjectMember: {
        some: { userId },
      },
    },
    include: {
      tasks: {
        where: {
          status: {
            not: "COMPLETED",
          },
        },
      },
      ProjectMember: {
        include: {
          user: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return {
    tasks: tasks.map((t) => ({
      id: t.id,
      title: t.title,
      project: t.project?.title || "No Project",
      due: t.dueDate
        ? new Date(t.dueDate).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          })
        : "No due date",
      done: t.status === "COMPLETED",
    })),
    updates: updates.map((u) => ({
      id: u.id,
      title: u.body.substring(0, 50) + (u.body.length > 50 ? "..." : ""),
      detail: u.body,
      project: u.project?.title || "General",
      time: getRelativeTime(u.createdAt),
      kind: "update" as const,
    })),
    meetings: meetings.map((m) => ({
      id: m.id,
      title: m.title,
      time: m.dueDate
        ? new Date(m.dueDate).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          })
        : "TBD",
      location: m.project?.title || "TBD",
      link: "#",
    })),
    stats: {
      totalTasks: tasks.length,
      completedTasks: tasks.filter((t) => t.status === "COMPLETED").length,
      activeProjects: projects.length,
    },
    projects: projects.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      activeTasks: p.tasks.length,
      teamSize: p.ProjectMember.length,
      updatedAt: p.updatedAt,
    })),
  };
}

function getRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  return `${days}d`;
}

export default async function GlassHomePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const data = await getPageData(session.user.id);

  return (
    <ClientWrapper
      initialData={data}
      userId={session.user.id}
      userName={session.user.name || "User"}
      userEmail={session.user.email || ""}
    />
  );
}
