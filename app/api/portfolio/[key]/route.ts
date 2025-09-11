export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params

    // Get portfolio by key
    const portfolio = await prisma.portfolio.findUnique({
      where: { key }
    })

    if (!portfolio) {
      return NextResponse.json(
        { error: 'Portfolio not found' },
        { status: 404 }
      )
    }

    // Get all projects for this portfolio
    const projects = await prisma.project.findMany({
      where: { portfolioId: portfolio.id },
      include: {
        pm: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        developers: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            tasks: true,
            updates: true
          }
        }
      },
      orderBy: [
        { stage: 'asc' },
        { status: 'asc' },
        { lastUpdatedAt: 'desc' }
      ]
    })

    return NextResponse.json({
      portfolio,
      projects
    })
  } catch (error) {
    console.error('Error fetching portfolio data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch portfolio data' },
      { status: 500 }
    )
  }
}