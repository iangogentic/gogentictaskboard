import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { title, description, url, type } = body

    const deliverable = await prisma.deliverable.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(url !== undefined && { url }),
        ...(type !== undefined && { type }),
      },
    })

    return NextResponse.json(deliverable)
  } catch (error) {
    console.error('Error updating deliverable:', error)
    return NextResponse.json(
      { error: 'Failed to update deliverable' },
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
    const deliverable = await prisma.deliverable.findUnique({
      where: { id },
      include: { project: true },
    })

    if (!deliverable) {
      return NextResponse.json(
        { error: 'Deliverable not found' },
        { status: 404 }
      )
    }

    await prisma.deliverable.delete({
      where: { id },
    })

    // Create an activity update
    await prisma.update.create({
      data: {
        projectId: deliverable.projectId,
        authorId: deliverable.project.pmId,
        body: `Deliverable "${deliverable.title}" was deleted`,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting deliverable:', error)
    return NextResponse.json(
      { error: 'Failed to delete deliverable' },
      { status: 500 }
    )
  }
}