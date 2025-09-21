import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const userId = session.user.id;

  // Check user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  // Get all tasks for debugging
  const allTasks = await prisma.task.findMany({
    where: {
      OR: [
        { assigneeId: userId },
        { project: { ProjectMember: { some: { userId } } } },
      ],
    },
    include: {
      project: true,
      assignee: true,
    },
  });

  // Get incomplete tasks
  const incompleteTasks = await prisma.task.findMany({
    where: {
      OR: [
        { assigneeId: userId },
        { project: { ProjectMember: { some: { userId } } } },
      ],
      status: {
        not: "COMPLETED",
      },
    },
    include: {
      project: true,
      assignee: true,
    },
  });

  // Get projects
  const projects = await prisma.project.findMany({
    where: {
      ProjectMember: {
        some: { userId },
      },
    },
    include: {
      ProjectMember: true,
      tasks: true,
    },
  });

  // Get project members for current user
  const projectMembers = await prisma.projectMember.findMany({
    where: { userId },
    include: {
      Project: true,
    },
  });

  return NextResponse.json({
    user: {
      id: user?.id,
      email: user?.email,
      name: user?.name,
    },
    stats: {
      totalTasks: allTasks.length,
      incompleteTasks: incompleteTasks.length,
      projects: projects.length,
      projectMemberships: projectMembers.length,
    },
    data: {
      tasks: allTasks.slice(0, 5),
      projects: projects.slice(0, 5),
      projectMembers: projectMembers,
    },
  });
}
