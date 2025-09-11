import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

export const runtime = 'nodejs'

export async function GET() {
  try {
    // Get current user from cookie
    const cookieStore = await cookies()
    const userEmail = cookieStore.get('currentUser')?.value

    const [projects, users] = await Promise.all([
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
    ])

    const currentUser = userEmail 
      ? users.find(u => u.email === userEmail)
      : users[0]

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