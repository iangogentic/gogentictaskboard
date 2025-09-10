import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // First unassign from all projects and tasks
    await prisma.$transaction([
      // Remove from managed projects
      prisma.project.updateMany({
        where: { pmId: id },
        data: { pmId: null }
      }),
      // Remove from developer projects
      prisma.project.updateMany({
        where: {
          developers: {
            some: { id }
          }
        },
        data: {
          developers: {
            disconnect: { id }
          }
        }
      }),
      // Unassign from tasks
      prisma.task.updateMany({
        where: { assigneeId: id },
        data: { assigneeId: null }
      }),
      // Delete the user
      prisma.user.delete({
        where: { id }
      })
    ])
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}