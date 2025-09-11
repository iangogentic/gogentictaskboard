import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(users)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    
    // Check if email already exists
    const existing = await prisma.user.findUnique({
      where: { email: data.email }
    })
    
    if (existing) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 })
    }
    
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email
      }
    })
    
    return NextResponse.json(user)
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}
