import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const projectId = searchParams.get("projectId");
    const status = searchParams.get("status");
    const assigneeId = searchParams.get("assigneeId");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: any = {};
    if (projectId) where.projectId = projectId;
    if (status) where.status = status;
    if (assigneeId) where.assigneeId = assigneeId;

    const tasks = await prisma.task.findMany({
      where,
      take: limit,
      include: {
        project: {
          select: {
            id: true,
            title: true,
            clientName: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        timeEntries: {
          select: {
            hours: true,
            date: true,
          },
        },
      },
      orderBy: [{ status: "asc" }, { dueDate: "asc" }, { order: "asc" }],
    });

    const taskData = tasks.map((task) => ({
      id: task.id,
      title: task.title,
      status: task.status,
      project: task.project,
      assignee: task.assignee,
      dueDate: task.dueDate,
      notes: task.notes,
      estimatedHours: task.estimatedHours,
      actualHours: task.actualHours,
      timeEntries: task.timeEntries,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      data: taskData,
      count: taskData.length,
    });
  } catch (error: any) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
