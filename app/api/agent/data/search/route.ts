import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { query, type = "all" } = body;

    if (!query) {
      return NextResponse.json(
        { error: "Search query is required" },
        { status: 400 }
      );
    }

    const searchTerm = query.toLowerCase();
    const results: any = {
      projects: [],
      tasks: [],
      users: [],
      documents: [],
    };

    // Search projects
    if (type === "all" || type === "projects") {
      const projects = await prisma.project.findMany({
        where: {
          OR: [
            { title: { contains: searchTerm, mode: "insensitive" } },
            { description: { contains: searchTerm, mode: "insensitive" } },
          ],
        },
        include: {
          portfolio: {
            select: {
              name: true,
              color: true,
            },
          },
          _count: {
            select: {
              tasks: true,
            },
          },
        },
        take: 10,
      });

      results.projects = projects.map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        portfolio: p.portfolio?.name,
        status: p.status,
        taskCount: p._count.tasks,
        type: "project",
      }));
    }

    // Search tasks
    if (type === "all" || type === "tasks") {
      const tasks = await prisma.task.findMany({
        where: {
          OR: [
            { title: { contains: searchTerm, mode: "insensitive" } },
            { notes: { contains: searchTerm, mode: "insensitive" } },
          ],
        },
        include: {
          project: {
            select: {
              title: true,
            },
          },
          assignee: {
            select: {
              name: true,
            },
          },
        },
        take: 10,
      });

      results.tasks = tasks.map((t) => ({
        id: t.id,
        title: t.title,
        project: t.project?.title,
        assignee: t.assignee?.name,
        status: t.status,
        priority: t.priority,
        type: "task",
      }));
    }

    // Search users
    if (type === "all" || type === "users") {
      const users = await prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: searchTerm, mode: "insensitive" } },
            { email: { contains: searchTerm, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          _count: {
            select: {
              assignedTasks: true,
              ProjectMember: true,
            },
          },
        },
        take: 10,
      });

      results.users = users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        taskCount: u._count.assignedTasks,
        projectCount: u._count.ProjectMember,
        type: "user",
      }));
    }

    // Search documents
    if (type === "all" || type === "documents") {
      const documents = await prisma.document.findMany({
        where: {
          OR: [
            { title: { contains: searchTerm, mode: "insensitive" } },
            { content: { contains: searchTerm, mode: "insensitive" } },
          ],
        },
        include: {
          project: {
            select: {
              title: true,
            },
          },
        },
        take: 10,
      });

      results.documents = documents.map((d) => ({
        id: d.id,
        title: d.title,
        project: d.project?.title,
        source: d.source,
        url: d.url,
        type: "document",
      }));
    }

    // Calculate total results
    const totalResults =
      results.projects.length +
      results.tasks.length +
      results.users.length +
      results.documents.length;

    return NextResponse.json({
      query,
      totalResults,
      results,
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Failed to perform search" },
      { status: 500 }
    );
  }
}
