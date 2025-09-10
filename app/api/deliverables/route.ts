import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { projectId, title, url, status } = body

    if (!projectId || !title) {
      return NextResponse.json(
        { error: 'Project ID and title are required' },
        { status: 400 }
      )
    }

    const deliverable = await prisma.deliverable.create({
      data: {
        projectId,
        title,
        fileUrl: url || null,
        status: status || 'Draft',
      },
    })

    // Create an activity update
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { pm: true },
    })

    if (project) {
      await prisma.update.create({
        data: {
          projectId,
          authorId: project.pm.id,
          body: `New deliverable "${title}" added`,
        },
      })
    }

    return NextResponse.json(deliverable)
  } catch (error) {
    console.error('Error creating deliverable:', error)
    return NextResponse.json(
      { error: 'Failed to create deliverable' },
      { status: 500 }
    )
  }
}