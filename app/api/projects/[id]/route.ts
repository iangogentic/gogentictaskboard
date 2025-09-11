export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        pm: true,
        developers: true,
        tasks: true,
        updates: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(project)
  } catch (error) {
    console.error('Error fetching project:', error)
    return NextResponse.json(
      { error: 'Failed to fetch project' },
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
    const {
      title,
      branch,
      portfolioId,
      stage,
      health,
      pmId,
      developerIds,
      clientName,
      clientEmail,
      status,
      startDate,
      targetDelivery,
      notes,
    } = body

    // Get the old project data for comparison
    const oldProject = await prisma.project.findUnique({
      where: { id },
      include: { pm: true },
    })

    if (!oldProject) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Update the project
    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        title,
        branch,
        portfolioId: portfolioId || null,
        stage: stage || 'Discovery',
        health: health || null,
        pmId,
        developers: {
          set: developerIds.map((id: string) => ({ id })),
        },
        clientName,
        clientEmail,
        status,
        startDate: startDate ? new Date(startDate) : null,
        targetDelivery: targetDelivery ? new Date(targetDelivery) : null,
        notes,
      },
      include: {
        pm: true,
        developers: true,
      },
    })

    // Create activity updates for significant changes
    const updates = []
    
    if (oldProject.status !== status) {
      updates.push({
        projectId: id,
        authorId: pmId, // Using PM as the user making the change
        body: `Project status changed from ${oldProject.status.replace('_', ' ')} to ${status.replace('_', ' ')}`,
      })
    }

    if (oldProject.pmId !== pmId) {
      updates.push({
        projectId: id,
        authorId: pmId,
        body: `Project manager changed from ${oldProject.pm.name} to ${updatedProject.pm.name}`,
      })
    }

    if (updates.length > 0) {
      await prisma.update.createMany({
        data: updates,
      })
    }

    return NextResponse.json(updatedProject)
  } catch (error) {
    console.error('Error updating project:', error)
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    // Delete all related data first
    await prisma.update.deleteMany({
      where: { projectId: id },
    })

    await prisma.task.deleteMany({
      where: { projectId: id },
    })

    await prisma.deliverable.deleteMany({
      where: { projectId: id },
    })

    // Finally delete the project
    await prisma.project.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting project:', error)
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    )
  }
}