import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export const runtime = 'nodejs'

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

    const [projects, users, currentUser] = await Promise.all([
      prisma.project.findMany({
        select: {
          id: true,
          title: true,
          branch: true,
        },
        take: 10,
        orderBy: { lastUpdatedAt: 'desc' },
      }),
      prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
        },
      }),
      prisma.user.findUnique({
        where: { email: session.user.email },
        select: {
          id: true,
          name: true,
          email: true,
        },
      })
    ])

    return NextResponse.json({
      projects,
      users,
      currentUser,
    })
  } catch (error) {
    console.error('Failed to fetch navigation data:', error)
    return NextResponse.json(
      { projects: [], users: [], currentUser: null },
      { status: 500 }
    )
  }
}