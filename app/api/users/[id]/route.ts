export const runtime = 'nodejs';
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Check if user is a PM on any projects
    const managedProjects = await prisma.project.findMany({
      where: { pmId: id }
    })
    
    if (managedProjects.length > 0) {
      // Find another user to reassign projects to
      const otherUser = await prisma.user.findFirst({
        where: { id: { not: id } }
      })
      
      if (!otherUser) {
        return NextResponse.json({ 
          error: 'Cannot delete user - they manage projects and no other users exist to reassign' 
        }, { status: 400 })
      }
      
      // Reassign projects to another user
      await prisma.project.updateMany({
        where: { pmId: id },
        data: { pmId: otherUser.id }
      })
    }
    
    // Now safe to delete user (cascade will handle related records)
    await prisma.user.delete({
      where: { id }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}