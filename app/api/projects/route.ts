import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      include: {
        pm: true,
        developers: true,
        tasks: true,
        updates: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(projects)
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      title,
      branch,
      pmId,
      developerIds,
      clientName,
      clientEmail,
      status,
      startDate,
      targetDelivery,
      notes,
    } = body

    // Create the project
    const project = await prisma.project.create({
      data: {
        title,
        branch,
        pmId,
        clientName,
        clientEmail,
        status,
        startDate: startDate ? new Date(startDate) : null,
        targetDelivery: targetDelivery ? new Date(targetDelivery) : null,
        notes,
        developers: {
          connect: developerIds.map((id: string) => ({ id })),
        },
      },
      include: {
        pm: true,
        developers: true,
      },
    })

    // Create an initial update
    const systemUser = await prisma.user.findUnique({ where: { id: pmId } })
    if (systemUser) {
      await prisma.update.create({
        data: {
          projectId: project.id,
          authorId: systemUser.id,
          body: `Project "${project.title}" created by ${systemUser.name}`,
        },
      })
    }

    return NextResponse.json(project)
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
  }
}