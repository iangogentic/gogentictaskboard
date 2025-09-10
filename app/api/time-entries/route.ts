import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { taskId, userId, hours, description, date } = body

    // Create time entry
    const timeEntry = await prisma.timeEntry.create({
      data: {
        taskId,
        userId,
        hours,
        description,
        date: new Date(date)
      },
      include: {
        user: true,
        task: true
      }
    })

    // Update task's actual hours
    await prisma.task.update({
      where: { id: taskId },
      data: {
        actualHours: {
          increment: hours
        }
      }
    })

    // Create activity update
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: true }
    })

    if (task) {
      await prisma.update.create({
        data: {
          projectId: task.projectId,
          authorId: userId,
          body: `Logged ${hours} hours on task "${task.title}"`
        }
      })
    }

    return NextResponse.json(timeEntry)
  } catch (error) {
    console.error('Error creating time entry:', error)
    return NextResponse.json(
      { error: 'Failed to create time entry' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const taskId = searchParams.get('taskId')
    const userId = searchParams.get('userId')
    const projectId = searchParams.get('projectId')

    const where: any = {}
    if (taskId) where.taskId = taskId
    if (userId) where.userId = userId
    if (projectId) {
      where.task = {
        projectId
      }
    }

    const timeEntries = await prisma.timeEntry.findMany({
      where,
      include: {
        user: true,
        task: {
          include: {
            project: true
          }
        }
      },
      orderBy: { date: 'desc' }
    })

    return NextResponse.json(timeEntries)
  } catch (error) {
    console.error('Error fetching time entries:', error)
    return NextResponse.json(
      { error: 'Failed to fetch time entries' },
      { status: 500 }
    )
  }
}