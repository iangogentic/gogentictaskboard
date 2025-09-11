export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Get the time entry to update task hours
    const timeEntry = await prisma.timeEntry.findUnique({
      where: { id },
      include: { task: true, user: true }
    })

    if (!timeEntry) {
      return NextResponse.json(
        { error: 'Time entry not found' },
        { status: 404 }
      )
    }

    // Delete the time entry
    await prisma.timeEntry.delete({
      where: { id }
    })

    // Update task's actual hours
    await prisma.task.update({
      where: { id: timeEntry.taskId },
      data: {
        actualHours: {
          decrement: timeEntry.hours
        }
      }
    })

    // Create activity update
    await prisma.update.create({
      data: {
        projectId: timeEntry.task.projectId,
        authorId: timeEntry.userId,
        body: `Removed ${timeEntry.hours} hours from task "${timeEntry.task.title}"`
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting time entry:', error)
    return NextResponse.json(
      { error: 'Failed to delete time entry' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { hours, description, date } = body

    // Get the old time entry
    const oldEntry = await prisma.timeEntry.findUnique({
      where: { id },
      include: { task: true }
    })

    if (!oldEntry) {
      return NextResponse.json(
        { error: 'Time entry not found' },
        { status: 404 }
      )
    }

    // Update the time entry
    const updatedEntry = await prisma.timeEntry.update({
      where: { id },
      data: {
        ...(hours !== undefined && { hours }),
        ...(description !== undefined && { description }),
        ...(date !== undefined && { date: new Date(date) })
      },
      include: {
        user: true,
        task: true
      }
    })

    // Update task's actual hours if hours changed
    if (hours !== undefined && hours !== oldEntry.hours) {
      const hoursDiff = hours - oldEntry.hours
      await prisma.task.update({
        where: { id: oldEntry.taskId },
        data: {
          actualHours: {
            increment: hoursDiff
          }
        }
      })
    }

    return NextResponse.json(updatedEntry)
  } catch (error) {
    console.error('Error updating time entry:', error)
    return NextResponse.json(
      { error: 'Failed to update time entry' },
      { status: 500 }
    )
  }
}