import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { projectId, title, status, assigneeId, dueDate, notes, order } = body

    // Create the task
    const task = await prisma.task.create({
      data: {
        projectId,
        title,
        status: status || 'Todo',
        assigneeId,
        dueDate: dueDate ? new Date(dueDate) : null,
        notes,
        order: order || 0,
      },
      include: {
        assignee: true,
        project: true,
      },
    })

    // Create an update for the new task
    const systemUser = await prisma.user.findFirst()
    if (systemUser) {
      await prisma.update.create({
        data: {
          projectId,
          authorId: systemUser.id,
          body: `New task "${task.title}" added to ${status || 'Todo'}`,
        },
      })
    }

    return NextResponse.json(task)
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
  }
}
