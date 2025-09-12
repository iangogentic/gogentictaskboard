export const runtime = 'nodejs'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'

export async function GET() {
  try {
    // Get current user from NextAuth session
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, email: true, name: true }
    })

    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 403 }
      )
    }
    // Fetch portfolios with projects where user is involved (PM or developer)
    const portfolios = await prisma.portfolio.findMany({
      orderBy: { order: 'asc' },
      include: {
        projects: {
          where: {
            OR: [
              { pmId: currentUser.id },
              { developers: { some: { id: currentUser.id } } }
            ]
          },
          include: {
            tasks: true
          }
        }
      }
    })

    // Calculate portfolio stats
    const portfolioStats = portfolios.map(portfolio => {
      const projects = portfolio.projects
      const inProgressCount = projects.filter(p => p.status === 'In Progress' || p.status === 'IN_PROGRESS').length
      const blockedCount = projects.filter(p => p.status === 'Blocked' || p.status === 'BLOCKED').length
      const liveCount = projects.filter(p => p.stage === 'Live').length
      
      // Calculate average health (mock calculation for now)
      const healthyProjects = projects.filter(p => p.health === 'Green').length
      const warningProjects = projects.filter(p => p.health === 'Amber').length
      const avgHealth = projects.length > 0 
        ? Math.round(((healthyProjects * 100) + (warningProjects * 60)) / projects.length)
        : 100

      return {
        id: portfolio.id,
        key: portfolio.key,
        name: portfolio.name,
        color: portfolio.color || '#6B7280',
        description: portfolio.description || '',
        projectCount: projects.length,
        inProgressCount,
        blockedCount,
        liveCount,
        avgHealth
      }
    })

    // Find projects that need attention (only user's projects)
    const needsAttentionProjects = await prisma.project.findMany({
      where: {
        AND: [
          {
            OR: [
              { pmId: currentUser.id },
              { developers: { some: { id: currentUser.id } } }
            ]
          },
          {
            OR: [
              { status: 'Blocked' },
              { status: 'BLOCKED' },
              { health: 'Red' },
              {
                AND: [
                  { targetDelivery: { not: null } },
                  { targetDelivery: { lte: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) } }
                ]
              }
            ]
          }
        ]
      },
      include: {
        portfolio: true
      },
      take: 10
    })

    const needsAttention = needsAttentionProjects.map(project => {
      let issue = ''
      let severity: 'high' | 'medium' | 'low' = 'low'

      if (project.status === 'Blocked' || project.status === 'BLOCKED') {
        issue = 'Project is blocked'
        severity = 'high'
      } else if (project.health === 'Red') {
        issue = 'Health status is critical'
        severity = 'high'
      } else if (project.targetDelivery && project.targetDelivery <= new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)) {
        const daysUntilDue = Math.ceil((project.targetDelivery.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
        issue = `Due in ${daysUntilDue} days`
        severity = daysUntilDue <= 1 ? 'high' : 'medium'
      }

      return {
        id: project.id,
        title: project.title,
        portfolio: project.portfolio?.name || 'Unassigned',
        portfolioColor: project.portfolio?.color || '#6B7280',
        issue,
        severity
      }
    })

    return NextResponse.json({
      portfolios: portfolioStats,
      needsAttention
    })
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}
