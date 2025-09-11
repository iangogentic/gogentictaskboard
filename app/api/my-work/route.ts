import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { subDays } from 'date-fns'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 })
  }

  try {
    const last30Days = subDays(new Date(), 30)

    // Get tasks assigned to user
    const assignedTasks = await prisma.task.findMany({
      where: {
        assigneeId: userId
      },
      include: {
        project: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: [
        { status: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    // Get projects managed by user
    const managedProjects = await prisma.project.findMany({
      where: {
        pmId: userId
      },
      include: {
        pm: true,
        developers: true,
        _count: {
          select: {
            tasks: true,
            updates: true,
            deliverables: true
          }
        }
      },
      orderBy: { lastUpdatedAt: 'desc' }
    })

    // Get projects where user is developer
    const developerProjects = await prisma.project.findMany({
      where: {
        developers: {
          some: {
            id: userId
          }
        },
        NOT: {
          pmId: userId
        }
      },
      include: {
        pm: true,
        developers: true,
        _count: {
          select: {
            tasks: true,
            updates: true,
            deliverables: true
          }
        }
      },
      orderBy: { lastUpdatedAt: 'desc' }
    })

    // Get recent updates by user
    const recentUpdates = await prisma.update.findMany({
      where: {
        authorId: userId,
        createdAt: {
          gte: last30Days
        }
      },
      include: {
        project: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    })

    // Get deliverables from user's projects
    const deliverables = await prisma.deliverable.findMany({
      where: {
        project: {
          OR: [
            { pmId: userId },
            { developers: { some: { id: userId } } }
          ]
        }
      },
      include: {
        project: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Calculate stats
    const stats = {
      totalTasks: assignedTasks.length,
      completedTasks: assignedTasks.filter(t => t.status === 'Done').length,
      inProgressTasks: assignedTasks.filter(t => t.status === 'Doing').length,
      todoTasks: assignedTasks.filter(t => t.status === 'Todo').length,
      overdueProjects: [...managedProjects, ...developerProjects].filter(p => 
        p.targetDelivery && new Date(p.targetDelivery) < new Date() && p.status !== 'COMPLETED'
      ).length
    }

    return NextResponse.json({
      assignedTasks,
      managedProjects,
      developerProjects,
      recentUpdates,
      deliverables,
      stats
    })
  } catch (error) {
    console.error('My Work API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch work data' },
      { status: 500 }
    )
  }
}
