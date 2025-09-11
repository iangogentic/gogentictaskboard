import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { subDays, isFuture } from 'date-fns'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 })
  }

  const now = new Date()
  const last7Days = subDays(now, 7)
  const last30Days = subDays(now, 30)

  try {
    // Get user's projects (as PM or developer)
    const userProjects = await prisma.project.findMany({
      where: {
        OR: [
          { pmId: userId },
          { developers: { some: { id: userId } } }
        ]
      },
      include: {
        pm: true,
        developers: true,
        _count: {
          select: {
            tasks: true,
            updates: true
          }
        }
      }
    })

    // Get user's tasks
    const userTasks = await prisma.task.findMany({
      where: {
        assigneeId: userId,
        status: { not: 'Done' }
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

    // Get recent updates from user's projects
    const recentUpdates = await prisma.update.findMany({
      where: {
        project: {
          OR: [
            { pmId: userId },
            { developers: { some: { id: userId } } }
          ]
        },
        createdAt: { gte: last7Days }
      },
      include: {
        author: true,
        project: true
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    // Calculate stats
    const allUserTasks = await prisma.task.findMany({
      where: { assigneeId: userId }
    })

    const stats = {
      totalProjects: userProjects.length,
      activeProjects: userProjects.filter(p => p.status === 'IN_PROGRESS').length,
      totalTasks: allUserTasks.length,
      completedTasks: allUserTasks.filter(t => t.status === 'Done').length,
      pendingTasks: userTasks.length,
      overdueTasks: userProjects.filter(p => 
        p.targetDelivery && new Date(p.targetDelivery) < now && p.status !== 'COMPLETED'
      ).length
    }

    // Get upcoming deadlines
    const upcomingDeadlines = userProjects
      .filter(p => p.targetDelivery && isFuture(new Date(p.targetDelivery)))
      .sort((a, b) => {
        const dateA = a.targetDelivery ? new Date(a.targetDelivery).getTime() : 0
        const dateB = b.targetDelivery ? new Date(b.targetDelivery).getTime() : 0
        return dateA - dateB
      })
      .slice(0, 5)

    // Get team activity
    const [allUpdates, allTasks, allProjects] = await Promise.all([
      prisma.update.findMany({
        where: { createdAt: { gte: last7Days } },
        include: {
          author: true,
          project: true
        },
        orderBy: { createdAt: 'desc' },
        take: 20
      }),
      prisma.task.findMany({
        where: {
          status: 'Done',
          updatedAt: { gte: last7Days }
        },
        include: {
          assignee: true,
          project: true
        },
        orderBy: { updatedAt: 'desc' },
        take: 20
      }),
      prisma.project.findMany({
        where: {
          lastUpdatedAt: { gte: last7Days }
        },
        include: {
          pm: true
        },
        orderBy: { lastUpdatedAt: 'desc' },
        take: 10
      })
    ])

    // Format team activity
    const teamActivity = [
      ...allUpdates.map(update => ({
        type: 'update',
        date: update.createdAt,
        description: `${update.author.name} posted an update in ${update.project.title}`
      })),
      ...allTasks.map(task => ({
        type: 'task',
        date: task.updatedAt,
        description: `${task.assignee?.name || 'Someone'} completed "${task.title}" in ${task.project.title}`
      })),
      ...allProjects.map(project => ({
        type: 'project',
        date: project.lastUpdatedAt,
        description: `${project.title} was updated by ${project.pm.name}`
      }))
    ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 10)

    return NextResponse.json({
      userProjects,
      userTasks,
      recentUpdates,
      stats,
      upcomingDeadlines,
      teamActivity
    })
  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}
