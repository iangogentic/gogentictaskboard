import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { taskIds, updates } = body

    if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
      return NextResponse.json(
        { error: 'No tasks selected' },
        { status: 400 }
      )
    }

    // Perform bulk update
    const { status, assigneeId, dueDate } = updates
    
    const updateData: any = {}
    if (status !== undefined) updateData.status = status
    if (assigneeId !== undefined) updateData.assigneeId = assigneeId
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null

    // Update all selected tasks
    await prisma.task.updateMany({
      where: {
        id: {
          in: taskIds
        }
      },
      data: updateData
    })

    // Get updated tasks to return
    const updatedTasks = await prisma.task.findMany({
      where: {
        id: {
          in: taskIds
        }
      },
      include: {
        assignee: true,
        project: true
      }
    })

    // Create activity update
    if (updatedTasks.length > 0) {
      const systemUser = await prisma.user.findFirst()
      if (systemUser) {
        const projectId = updatedTasks[0].projectId
        let updateBody = `Bulk updated ${updatedTasks.length} tasks`
        
        if (status) updateBody += ` - status changed to ${status}`
        if (assigneeId !== undefined) {
          const assignee = assigneeId ? await prisma.user.findUnique({ where: { id: assigneeId } }) : null
          updateBody += assignee ? ` - assigned to ${assignee.name}` : ' - unassigned'
        }
        if (dueDate !== undefined) {
          updateBody += dueDate ? ` - due date set to ${new Date(dueDate).toLocaleDateString()}` : ' - due date removed'
        }
        
        await prisma.update.create({
          data: {
            projectId,
            authorId: systemUser.id,
            body: updateBody
          }
        })
      }
    }

    return NextResponse.json(updatedTasks)
  } catch (error) {
    console.error('Error performing bulk update:', error)
    return NextResponse.json(
      { error: 'Failed to update tasks' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { taskIds } = body

    if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
      return NextResponse.json(
        { error: 'No tasks selected' },
        { status: 400 }
      )
    }

    // Get tasks before deletion for activity log
    const tasks = await prisma.task.findMany({
      where: {
        id: {
          in: taskIds
        }
      },
      include: {
        project: true
      }
    })

    if (tasks.length === 0) {
      return NextResponse.json(
        { error: 'No tasks found' },
        { status: 404 }
      )
    }

    // Delete the tasks
    await prisma.task.deleteMany({
      where: {
        id: {
          in: taskIds
        }
      }
    })

    // Create activity update
    const systemUser = await prisma.user.findFirst()
    if (systemUser && tasks.length > 0) {
      const projectId = tasks[0].projectId
      await prisma.update.create({
        data: {
          projectId,
          authorId: systemUser.id,
          body: `Deleted ${tasks.length} tasks`
        }
      })
    }

    return NextResponse.json({ success: true, deletedCount: tasks.length })
  } catch (error) {
    console.error('Error deleting tasks:', error)
    return NextResponse.json(
      { error: 'Failed to delete tasks' },
      { status: 500 }
    )
  }
}