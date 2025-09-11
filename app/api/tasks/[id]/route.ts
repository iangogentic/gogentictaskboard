import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { revalidateTag } from 'next/cache'
import { tags } from '@/lib/cache'

export const runtime = 'nodejs'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { title, status, assigneeId, dueDate, notes, order } = body

    // Get the current task to compare status
    const currentTask = await prisma.task.findUnique({
      where: { id },
      include: { assignee: true }
    })

    if (!currentTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Update the task
    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(status !== undefined && { status }),
        ...(assigneeId !== undefined && { assigneeId }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        ...(notes !== undefined && { notes }),
        ...(order !== undefined && { order }),
      },
      include: { assignee: true, project: true }
    })

    // If status changed, create an update
    if (status && status !== currentTask.status) {
      // For now, use a system user ID - in production, you'd get this from the session
      const systemUser = await prisma.user.findFirst()
      if (systemUser) {
        await prisma.update.create({
          data: {
            projectId: updatedTask.projectId,
            authorId: systemUser.id,
            body: `Task "${updatedTask.title}" status changed from ${currentTask.status} to ${status}`
          }
        })
      }
    }

    // If assignee changed, create an update
    if (assigneeId !== undefined && assigneeId !== currentTask.assigneeId) {
      const systemUser = await prisma.user.findFirst()
      if (systemUser) {
        const newAssignee = assigneeId ? await prisma.user.findUnique({ where: { id: assigneeId } }) : null
        const oldAssignee = currentTask.assignee
        
        let updateBody = ''
        if (!oldAssignee && newAssignee) {
          updateBody = `Task "${updatedTask.title}" assigned to ${newAssignee.name}`
        } else if (oldAssignee && !newAssignee) {
          updateBody = `Task "${updatedTask.title}" unassigned from ${oldAssignee.name}`
        } else if (oldAssignee && newAssignee) {
          updateBody = `Task "${updatedTask.title}" reassigned from ${oldAssignee.name} to ${newAssignee.name}`
        }
        
        if (updateBody) {
          await prisma.update.create({
            data: {
              projectId: updatedTask.projectId,
              authorId: systemUser.id,
              body: updateBody
            }
          })
        }
      }
    }

    // Revalidate cache
    revalidateTag(tags.tasks(currentTask.projectId))
    revalidateTag(tags.projects(currentTask.projectId))
    revalidateTag(tags.myWork(assigneeId || currentTask.assigneeId!))
    
    return NextResponse.json(updatedTask)
  } catch (error) {
    console.error('Error updating task:', error)
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    // Get task details before deletion for the activity log
    const task = await prisma.task.findUnique({
      where: { id },
      include: { project: true },
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    // Delete the task
    await prisma.task.delete({
      where: { id },
    })

    // Create an activity update
    const systemUser = await prisma.user.findFirst()
    if (systemUser) {
      await prisma.update.create({
        data: {
          projectId: task.projectId,
          authorId: systemUser.id,
          body: `Task "${task.title}" was deleted`,
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting task:', error)
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    )
  }
}