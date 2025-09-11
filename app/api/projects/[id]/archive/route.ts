export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const project = await prisma.project.update({
      where: { id },
      data: {
        archived: true,
        archivedAt: new Date()
      },
      include: {
        pm: true
      }
    })

    // Create an auto-generated update
    await prisma.update.create({
      data: {
        projectId: id,
        authorId: project.pmId,
        body: 'Project archived'
      }
    })

    return NextResponse.json(project)
  } catch (error) {
    console.error('Error archiving project:', error)
    return NextResponse.json(
      { error: 'Failed to archive project' },
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
    
    const project = await prisma.project.update({
      where: { id },
      data: {
        archived: false,
        archivedAt: null
      },
      include: {
        pm: true
      }
    })

    // Create an auto-generated update
    await prisma.update.create({
      data: {
        projectId: id,
        authorId: project.pmId,
        body: 'Project restored from archive'
      }
    })

    return NextResponse.json(project)
  } catch (error) {
    console.error('Error unarchiving project:', error)
    return NextResponse.json(
      { error: 'Failed to unarchive project' },
      { status: 500 }
    )
  }
}